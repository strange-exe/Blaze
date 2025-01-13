const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Fetches the avatar of a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to fetch the avatar for')
                .setRequired(false)),
    aliases: ['av'], 
    async execute(interaction) {
        await executeAvatar(interaction, true);
    },

    async executeText(message, args) {
        const target = message.mentions.users.first() || 
                       (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null) ||
                       message.author;
        
        await executeAvatar({
            user: message.author,
            options: { getUser: () => target },
            reply: (options) => message.reply(options)
        }, false);
    },
};

async function executeAvatar(interaction, ephemeral) {
    try {
        const target = interaction.options.getUser('user') || interaction.user;
        const avatarURL = target.displayAvatarURL({ dynamic: true, size: 1024 });
        const isGif = avatarURL.endsWith('.gif');

        // Prepare the download button
        const downloadButton = new ButtonBuilder()
            .setLabel('Download Avatar')
            .setStyle(ButtonStyle.Link)
            .setURL(avatarURL); // Set URL to avatar, clicking will initiate download

        // Prepare the embed
        const embed = new EmbedBuilder()
            .setTitle(`${target.tag}'s Avatar`)
            .setImage(avatarURL)
            .setDescription(`> **[Avatar URL](${avatarURL})**`)
            .setColor('#2f3136')
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        // Add the button to the row
        const row = new ActionRowBuilder().addComponents(downloadButton);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral });

    } catch (error) {
        console.error('Error fetching avatar:', error);
        await interaction.reply({ 
            content: 'An error occurred while fetching the avatar. Please try again later.', 
            ephemeral: true 
        });
    }
}
