const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { pool } = require('../utils/db.js');

module.exports = {
    name: 'leaderboard',
    description: 'View or reset the Tic-Tac-Toe (Cross Zero) leaderboard.',
    aliases: ['xolb', 'lb'],
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Manage the Tic-Tac-Toe leaderboard')
        .addSubcommand(subcommand => 
            subcommand.setName('view')
                .setDescription('View the Tic-Tac-Toe leaderboard')
        )
        .addSubcommand(subcommand => 
            subcommand.setName('reset')
                .setDescription('Reset the Tic-Tac-Toe leaderboard (Bot Owner Only)')
        ),
    async executeText(message, args) {
        if (args[0] === 'reset') {
            await resetLeaderboard(message);
        } else {
            await executeLeaderboard(message);
        }
    },
    async executeSlash(interaction) {
        if (interaction.options.getSubcommand() === 'reset') {
            await resetLeaderboard(interaction);
        } else {
            await executeLeaderboard(interaction);
        }
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

async function resetLeaderboard(context) {
    if (context.user?.id !== '1023977968562876536' && context.author?.id !== '1023977968562876536') {
        return context.reply({ content: 'You do not have permission to reset the leaderboard.', ephemeral: true });
    }
    
    try {
        await pool.execute('DELETE FROM leaderboard');
        await context.reply({ content: 'The Tic-Tac-Toe leaderboard has been reset.', ephemeral: false });
    } catch (error) {
        console.error('Error resetting leaderboard:', error);
        await context.reply({ content: 'An error occurred while resetting the leaderboard.', ephemeral: true });
    }
}
