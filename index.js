const { Client, REST, Routes, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { token, webhookURL, guildIds, defaultPrefix } = require('./config.json');
const { pool, initializeDatabase } = require('./utils/db.js');
const { startVersionMonitor, scheduleUpdateCheck, initialize } = require('./updateMonitor.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,  // Required for member join event
    ]
});

client.commands = new Collection();

// Load events from the 'events' folder
function loadEvents(dirPath) {
    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));

    for (const file of files) {
        const event = require(path.join(dirPath, file));
        if (event.name && typeof event.execute === 'function') {
            client.on(event.name, (...args) => event.execute(...args, client));
            console.log(`Loaded event: ${event.name}`);
        } else {
            console.error(`Invalid event file: ${file}`);
        }
    }
}

// Load commands from the 'commands' folder
function loadCommands(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith('.js')) {
            const command = require(fullPath);
            if (command.data) {
                client.commands.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.error(`Command in ${file} does not have a valid 'data' property.`);
            }
        }
    }
}

// Get prefix for a guild
function getPrefix(guildId, callback) {
    pool.query('SELECT prefix FROM server_prefixes WHERE guild_id = ?', [guildId])
        .then(([results]) => {
            if (results.length > 0) {
                callback(results[0].prefix); // Return custom prefix from the database
            } else {
                console.log(`No custom prefix found for guild ${guildId}. Using default prefix.`);
                callback(defaultPrefix); // Fallback to the default prefix if no custom prefix is found
            }
        })
        .catch((err) => {
            console.error('Error fetching prefix:', err);
            callback(defaultPrefix); // Fallback to default prefix on error
        });
}

// Register commands for guilds
async function registerCommands(guildId = null) {
    const commands = Array.from(client.commands.values()).map(command => command.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
            console.log(`Registered commands for guild: ${guildId}`);
        } else {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
            console.log('Registered global commands');
        }
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Handle interactions (slash commands)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName) || 
                    [...client.commands.values()].find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName));

    if (!command) return;

    try {
        if (command.execute) {
            await command.execute(interaction);
        } else if (command.executeSlash) {
            await command.executeSlash(interaction);
        } else {
            throw new Error('Command is missing both execute and executeSlash methods');
        }
        console.log(`Executed slash command: ${interaction.commandName}`);
    } catch (error) {
        console.error('Error executing slash command:', error);
        await interaction.reply({ content: 'There was an error executing the command.', ephemeral: true });
    }
});

const TARGET_USER_ID = "1158709904933126235"; // Anshi
const EMOJI_ID = "1176178649842589758"; // Yummi Emoji

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.author.id === TARGET_USER_ID) {
        try {
            const emoji = `<:${message.guild.emojis.cache.get(EMOJI_ID)?.name}:${EMOJI_ID}>`;
            if (emoji) {
                await message.reply(emoji);
            } else {
                console.warn(`Emoji with ID ${EMOJI_ID} not found in this server.`);
            }
        } catch (err) {
            console.error("Error replying with emoji:", err);
        }
    }

    getPrefix(message.guild.id, async (prefix) => {
        if (!message.content.startsWith(prefix)) return;
        if (message.content.trim() === prefix) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command = client.commands.get(commandName);

        if (!command) {
            command = [...client.commands.values()].find(cmd =>
                cmd.aliases && cmd.aliases.includes(commandName)
            );
        }

        if (!command) {
            await message.reply(`Command "${prefix}${commandName}" not found.`);
            return;
        }

        try {
            if (command.executeText) {
                await command.executeText(message, args);
                console.log(`Executed prefix command: ${commandName}`);
            } else {
                throw new Error('Command is missing executeText method');
            }
        } catch (error) {
            console.error('Error executing prefix command:', error);
            await message.reply('There was an error executing the command.');
        }
    });
});


// Handle guild member joins
client.on('guildMemberAdd', async (member) => {
    const guildId = member.guild.id;

    try {
        const [rows] = await pool.query(
            'SELECT embed, embed_title, embed_description, embed_media, message, embed_channel_id, join_role_id FROM join_settings WHERE guild_id = ?',
            [guildId]
        );

        if (!rows || rows.length === 0) {
            return; // No join settings for this guild; ignore the event
        }

        const { embed, embed_title, embed_description, embed_media, message, embed_channel_id, join_role_id } = rows[0];

        const targetChannel = embed_channel_id
            ? member.guild.channels.cache.get(embed_channel_id)
            : member.guild.systemChannel;

        if (!targetChannel) {
            return; // No valid channel to send the message
        }

        function replacePlaceholders(input) {
            if (!input) return null;
            const suffix = getOrdinalSuffix(member.guild.memberCount);
            return input
                .replace('{user}', `<@${member.user.id}>`)
                .replace('{username}', member.user.username)
                .replace('{membercount}', `${member.guild.memberCount}${suffix}`)
                .replace('{usernick}', member.displayName || member.user.username)
                .replace('{useravatar}', member.user.displayAvatarURL({ dynamic: true }));
        }

        function getOrdinalSuffix(number) {
            const lastDigit = number % 10;
            const lastTwoDigits = number % 100;
            if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
            switch (lastDigit) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        }

        function getRandomColor() {
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            return `#${randomColor.padStart(6, '0')}`;
        }

        const formattedMessage = replacePlaceholders(
            message || 'Welcome to the server, {user}!'
        );

        const formattedTitle = replacePlaceholders(
            embed_title || 'Welcome, {username}!'
        );
        const formattedDescription = replacePlaceholders(
            embed_description || 'We are excited to have you here, {usernick}!'
        );

        const joinEmbed = new EmbedBuilder()
            .setTitle(formattedTitle)
            .setDescription(formattedDescription)
            .setTimestamp()
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor(getRandomColor());

        if (embed_media) {
            joinEmbed.setImage(embed_media);
        }

        await targetChannel.send({
            content: formattedMessage,
            embeds: [joinEmbed],
        });

        if (join_role_id && member.guild.roles.cache.has(join_role_id)) {
            const joinRole = member.guild.roles.cache.get(join_role_id);
            await member.roles.add(joinRole);
        }
    } catch (err) {
        console.error('Error handling guildMemberAdd event:', err);
    }
});

// Bot ready event
const setBotPresence = async () => {
    try {
        await client.user.setPresence({
            activities: [{ name: `Blaze | ${defaultPrefix}help`, type: 2 }],
            status: 'idle',
        });
        console.log('Presence updated successfully.');
    } catch (error) {
        console.error('Error updating presence:', error);
    }
};

const presence = require('./presence.js');

client.once('ready', async () => {
    console.log('Bot is ready!');
    console.log(client.user.tag);

    // Load commands, events, etc.
    try {
        loadCommands(path.join(__dirname, 'commands'));
        loadEvents(path.join(__dirname, 'events'));
        await registerCommands();
        await initializeDatabase();
    } catch (error) {
        console.error('Error during initialization:', error);
    }

    // Set initial presence
    await presence.setBotPresence(client, defaultPrefix);

    // Set presence every hour
    setInterval(() => presence.setBotPresence(client, defaultPrefix), 60 * 60 * 1000);

    // Other initialization tasks
    await scheduleUpdateCheck();
    await startVersionMonitor();
    await initialize();
});

client.on('reconnect', async () => {
    console.log('Bot reconnected.');
    await presence.setBotPresence(client, defaultPrefix);
});


// Watch all files in the bot's directory and subdirectories
const watcher = chokidar.watch(__dirname, {
    persistent: true,
    ignoreInitial: true,
    depth: 10,  // Watch up to 10 levels deep
    ignored: [
        '**/*.log',         // Ignore all .log files
        '**/chat_log.txt',  // Specifically ignore chat_log.txt
    ],
});

watcher.on('change', (filePath) => {
    console.log(`File changed: ${filePath}`);
    delete require.cache[require.resolve(filePath)];
    if (filePath.includes('commands')) {
        client.commands.clear();
        loadCommands(path.join(__dirname, 'commands'));
    }
    if (filePath.includes('events')) {
        loadEvents(path.join(__dirname, 'events'));
    }
});

// Watch for file creation (if required)
watcher.on('add', (filePath) => {
    console.log(`File added: ${filePath}`);
    
    // Handle newly added command files
    if (filePath.includes('commands')) {
        client.commands.clear();
        loadCommands(path.join(__dirname, 'commands'));
    }

    // Handle newly added event files
    if (filePath.includes('events')) {
        loadEvents(path.join(__dirname, 'events'));
    }
});

// Logging in
client.login(token).catch(console.error);
