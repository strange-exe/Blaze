const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands.'),

    async executeSlash(interaction) {
        const allCommands = generateCommandList(interaction.client.commands);

        const helpEmbed = buildHelpEmbed(allCommands, interaction.client.user.tag);

        // Create a button linking to the support server
        const supportButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Join Support Server') // Button label
                .setEmoji({id: '1315321985554976809',name:'support'})
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/cnwSk9sUUt') // Replace with your server link
        );

        await interaction.reply({
            embeds: [helpEmbed],
            components: [supportButton], // Include the button
            ephemeral: true,
        });
    },

    async executeText(message) {
        const allCommands = generateCommandList(message.client.commands);

        const helpEmbed = buildHelpEmbed(allCommands, message.client.user.tag);

        // Create a button linking to the support server
        const supportButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Join Support Server') // Button label
                .setEmoji({id: '1315321985554976809',name:'support'})
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/cnwSk9sUUt') // Replace with your server link
        );

        await message.reply({
            embeds: [helpEmbed],
            components: [supportButton], // Include the button
        });
    },
};

// Helper Function: Generate the command list
function generateCommandList(commands) {
    return Array.from(commands.values())
        .map(command => {
            if (!command.data?.name && !command.name) return null;

            const commandName = command.data
                ? `/${command.data.name}`
                : `~${command.name}`;
            const commandDescription =
                command.data?.description || command.description || 'No description available.';
            return { commandName, commandDescription };
        })
        .filter(command => command !== null); // Remove any invalid entries
}

// Helper Function: Build the help embed
function buildHelpEmbed(commands, botName) {
    const embed = new EmbedBuilder()
        .setTitle(`<:command:1315321948976451594> ${botName} Command List`)
        .setDescription('Here are all the commands you can use:')
        .setColor('#00AFF4') // Custom vibrant blue color
        .addFields(
            commands.map(cmd => ({
                name: cmd.commandName,
                value: cmd.commandDescription,
                inline: false,
            }))
        )
        .setFooter({
            text: `Type the commands as displayed (e.g., /command)`,
        })
        .setTimestamp();

    return embed;
}
