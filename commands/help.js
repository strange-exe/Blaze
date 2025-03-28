const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands or searches for a specific one.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Command to search for (e.g., "ping").')
                .setRequired(false)),

    async executeSlash(interaction) {
        const searchQuery = interaction.options.getString('query');
        const allCommands = generateCommandList(interaction.client.commands);
        const filteredCommands = searchQuery ? filterCommands(allCommands, searchQuery) : allCommands;

        if (filteredCommands.length === 0) {
            return interaction.reply({ content: 'No commands found matching your query.', ephemeral: true });
        }

        await sendHelpMessage(interaction, filteredCommands, interaction.client.user.tag, true);
    },

    async executeText(message) {
        const args = message.content.split(' ').slice(1); // Extract arguments after ~help
        const searchQuery = args.join(' ').trim(); // Treat all args as the query
        const allCommands = generateCommandList(message.client.commands);
        const filteredCommands = searchQuery ? filterCommands(allCommands, searchQuery) : allCommands;

        if (filteredCommands.length === 0) {
            return message.reply('No commands found matching your query.');
        }

        await sendHelpMessage(message, filteredCommands, message.client.user.tag, false);
    },
};

// Helper Function: Generate the command list
function generateCommandList(commands) {
    return Array.from(commands.values())
        .map(command => {
            const commandName = command.data?.name || command.name;
            if (!commandName || commandName === 'help') return null; // Skip 'help' explicitly
            const displayName = command.data ? `/${commandName}` : `~${commandName}`;
            const commandDescription = command.data?.description || command.description || 'No description available.';
            return { commandName: displayName, commandDescription };
        })
        .filter(command => command !== null);
}

// Helper Function: Filter commands based on search query
function filterCommands(commands, query) {
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd =>
        cmd.commandName.toLowerCase().includes(lowerQuery) ||
        cmd.commandDescription.toLowerCase().includes(lowerQuery)
    );
}

// Helper Function: Build the help embed with pagination
function buildHelpEmbed(commands, botName, page = 0) {
    const commandsPerPage = 5; // Adjust to 25 if preferred
    const totalPages = Math.ceil(commands.length / commandsPerPage);
    const start = page * commandsPerPage;
    const end = start + commandsPerPage;
    const pageCommands = commands.slice(start, end);

    const embed = new EmbedBuilder()
        .setTitle(`<:command:1315321948976451594> ${botName} Command List`)
        .setDescription('Here are all the commands you can use:')
        .setColor('#00AFF4')
        .addFields(
            pageCommands.map(cmd => ({
                name: cmd.commandName,
                value: cmd.commandDescription,
                inline: false,
            }))
        )
        .setFooter({
            text: `Page ${page + 1} of ${totalPages} | Type the commands as displayed (e.g., /command)`,
        })
        .setTimestamp();

    return { embed, totalPages };
}

// Helper Function: Build detailed command embed
function buildCommandDetailEmbed(command, botName) {
    return new EmbedBuilder()
        .setTitle(`Command: ${command.commandName}`)
        .setDescription(command.commandDescription)
        .setColor('#00AFF4')
        .setFooter({ text: `Requested from ${botName}` })
        .setTimestamp();
}

// Helper Function: Send help message with pagination and buttons
async function sendHelpMessage(context, commands, botName, isInteraction) {
    let currentPage = 0;
    const { embed, totalPages } = buildHelpEmbed(commands, botName, currentPage);

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1),
        new ButtonBuilder()
            .setLabel('Join Support Server')
            .setEmoji({ id: '1315321985554976809', name: 'support' })
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/cnwSk9sUUt')
    );

    const detailButtons = new ActionRowBuilder().addComponents(
        commands.slice(currentPage * 5, (currentPage + 1) * 5).map((cmd, i) =>
            new ButtonBuilder()
                .setCustomId(`detail_${currentPage}_${i}`)
                .setLabel(`Details: ${cmd.commandName}`)
                .setStyle(ButtonStyle.Secondary)
        )
    );

    const reply = isInteraction
        ? await context.reply({ embeds: [embed], components: [buttons, detailButtons], ephemeral: true })
        : await context.reply({ embeds: [embed], components: [buttons, detailButtons] });

    const collector = reply.createMessageComponentCollector({ time: 60000 }); // 1 minute timeout

    collector.on('collect', async i => {
        if (isInteraction && i.user.id !== context.user.id) {
            return i.reply({ content: 'You cannot interact with this message.', ephemeral: true });
        }

        if (i.customId === 'prev' && currentPage > 0) {
            currentPage--;
        } else if (i.customId === 'next' && currentPage < totalPages - 1) {
            currentPage++;
        } else if (i.customId.startsWith('detail_')) {
            const [, page, index] = i.customId.split('_');
            const cmdIndex = parseInt(page) * 5 + parseInt(index);
            const command = commands[cmdIndex];
            const detailEmbed = buildCommandDetailEmbed(command, botName);
            await i.reply({ embeds: [detailEmbed], ephemeral: true });
            return;
        }

        const { embed: newEmbed, totalPages: newTotalPages } = buildHelpEmbed(commands, botName, currentPage);
        buttons.components[0].setDisabled(currentPage === 0);
        buttons.components[1].setDisabled(currentPage === newTotalPages - 1);

        const newDetailButtons = new ActionRowBuilder().addComponents(
            commands.slice(currentPage * 5, (currentPage + 1) * 5).map((cmd, i) =>
                new ButtonBuilder()
                    .setCustomId(`detail_${currentPage}_${i}`)
                    .setLabel(`Details: ${cmd.commandName}`)
                    .setStyle(ButtonStyle.Secondary)
            )
        );

        await i.update({ embeds: [newEmbed], components: [buttons, newDetailButtons] });
    });

    collector.on('end', () => {
        buttons.components.forEach(button => button.setDisabled(true));
        reply.edit({ components: [buttons, detailButtons] });
    });
}
