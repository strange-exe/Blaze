const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../utils/db.js');

module.exports = {
    name: 'leaderboard',
    description: 'View the Tic-Tac-Toe (Cross Zero) leaderboard.',
    aliases: ['xolb', 'lb'],
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the Tic-Tac-Toe leaderboard'),
    async executeText(message) {
        await executeLeaderboard(message);
    },
    async executeSlash(interaction) {
        await executeLeaderboard(interaction);
    }
};

async function executeLeaderboard(context) {
    try {
        const [rows] = await pool.execute('SELECT user_id, wins, losses, draws FROM leaderboard ORDER BY wins DESC LIMIT 10');
        if (rows.length === 0) {
            return context.reply({ content: 'No leaderboard data available yet!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Tic-Tac-Toe Leaderboard 🏆')
            .setColor('#FFD700')
            .setDescription(rows.map((row, index) => `**${index + 1}. <@${row.user_id}>**<:W_:1354554345852768336> Wins: **${row.wins}** | <:L_:1354554268920582345> Losses: **${row.losses}** | <:D_:1354554309190225944> Draws: **${row.draws}**`).join('\n\n'))
            .setFooter({ text: 'Play more games to climb the leaderboard!' });

        await context.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        await context.reply({ content: 'An error occurred while retrieving the leaderboard.', ephemeral: true });
    }
}
