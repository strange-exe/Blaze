const { SlashCommandBuilder } = require('discord.js');
const RankService = require('../services/rankService');
const CanvasService = require('../services/canvasService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your current rank and level in the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check the rank for')
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guild.id;

        try {
            // Fetch user stats
            const userStats = await RankService.getUserStats(user.id, guildId);

            if (!userStats) {
                return interaction.reply({
                    content: `${user.username} hasn't sent any messages yet! Start participating to earn XP.`,
                    ephemeral: false,
                });
            }

            const { messages, level } = userStats;

            // Get current role and messages needed for the next level
            const currentRole = RankService.getRoleName(level);
            const { nextLevel, messagesToNext } = RankService.getNextLevelDetails(level);

            // Generate rank image
            const rankImage = await CanvasService.generateRankImage(
                user, level, messages, messagesToNext, currentRole, interaction.guild.name
            );

            // Send the rank information
            await interaction.reply({
                content: `Here is your rank info, ${user.username}!`,
                files: [rankImage],
                ephemeral: false,
            });

        } catch (error) {
            console.error('Error in /rank command:', error);
            await interaction.reply({
                content: 'An error occurred while fetching your rank. Please try again later.',
                ephemeral: true,
            });
        }
    },
};
