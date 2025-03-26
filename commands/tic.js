const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { pool, initializeDatabase } = require('../utils/db.js');
module.exports = {
    name: 'tic',
    description: 'Play a game of Tic-Tac-Toe with a friend.',
    aliases: ['tictactoe', 'xo','tic'],
    data: new SlashCommandBuilder()
        .setName('crosszero')
        .setDescription('Play a game of Tic-Tac-Toe with a friend')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('Choose your opponent')
                .setRequired(true)),
    async executeText(message, args) {
        const opponent = message.mentions.users.first();
        if (!opponent) return message.reply('You need to mention someone to play with!');
        await startGame(message, message.author, opponent);
    },
    async executeSlash(interaction) {
        const opponent = interaction.options.getUser('opponent');
        if (!opponent) return interaction.reply({ content: 'You need to choose an opponent!', ephemeral: true });
        await startGame(interaction, interaction.user, opponent);
    },
    async executeLeaderboard(interaction) {
        try {
            const [rows] = await pool.execute('SELECT user_id, wins, losses, draws FROM leaderboard ORDER BY wins DESC LIMIT 10');
            if (rows.length === 0) {
                return interaction.reply({ content: 'No leaderboard data available yet!', ephemeral: true });
            }
            const leaderboard = rows.map((row, index) => `**${index + 1}. <@${row.user_id}>** - 🏆 Wins: ${row.wins}, <:X_:1354553322639589507> Losses: ${row.losses}, 🤝 Draws: ${row.draws}`).join('\n');
            await interaction.reply({ content: `**🏆 Tic-Tac-Toe Leaderboard 🏆**\n${leaderboard}`, ephemeral: false });
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            await interaction.reply({ content: 'An error occurred while retrieving the leaderboard.', ephemeral: true });
        }
    }
};

async function startGame(context, player1, player2) {
    if (player1.id === player2.id) {
        return context.reply({ content: 'You cannot play against yourself!', ephemeral: true });
    }

    let board = [['⬜', '⬜', '⬜'], ['⬜', '⬜', '⬜'], ['⬜', '⬜', '⬜']];
    let turn = Math.random() < 0.5 ? player1 : player2;
    let moves = 0;

    const message = await context.reply({
        content: `${player1} (<:X_:1354553322639589507>) vs ${player2} (<:O_:1354553298241454121>)\n\n${turn}, it's your turn! (${turn.id === player1.id ? '<:X_:1354553322639589507>' : '<:O_:1354553298241454121>'})`,
        components: [...generateButtons(board), generateEndButton()],
        fetchReply: true
    });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async interaction => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'end') {
            collector.stop('ended');
            return interaction.update({ content: 'Game has been manually ended!', components: [] });
        }

        if (interaction.user.id !== turn.id) {
            return interaction.reply({ content: 'It\'s not your turn!', ephemeral: true });
        }

        const [row, col] = interaction.customId.split('-').map(Number);

        if (board[row][col] !== '⬜') {
            return interaction.reply({ content: 'That spot is already taken!', ephemeral: true });
        }

        board[row][col] = turn.id === player1.id ? '<:X_:1354553322639589507>' : '<:O_:1354553298241454121>';
        moves++;

        if (checkWin(board, board[row][col])) {
            collector.stop('win');

            await interaction.deferUpdate(); // Ensure interaction is acknowledged
            await updateLeaderboard(turn.id, 'win');
            await updateLeaderboard(turn.id === player1.id ? player2.id : player1.id, 'loss');

            await interaction.followUp({ content: `${turn} wins! 🎉`, ephemeral: false });

            return interaction.editReply({
                content: `${player1} (<:X_:1354553322639589507>) vs ${player2} (<:O_:1354553298241454121>)\n\nGame over!`,
                components: [...generateButtons(board)]
            });
        } else if (moves === 9) {
            collector.stop('draw');

            await interaction.deferUpdate(); // Ensure interaction is acknowledged
            await updateLeaderboard(player1.id, 'draw');
            await updateLeaderboard(player2.id, 'draw');

            await interaction.followUp({ content: `It's a draw! 🤝\n\n${formatBoard(board)}`, ephemeral: false });

            return interaction.editReply({
                content: `${player1} (<:X_:1354553322639589507>) vs ${player2} (<:O_:1354553298241454121>)\n\nGame over!`,
                components: [...generateButtons(board)]
            });
        }

        // Switch turn to the next player
        turn = turn.id === player1.id ? player2 : player1;

        await interaction.update({
            content: `${player1} (<:X_:1354553322639589507>) vs ${player2} (<:O_:1354553298241454121>)\n\n${turn}, it's your turn! (${turn.id === player1.id ? '<:X_:1354553322639589507>' : '<:O_:1354553298241454121>'})`,
            components: [...generateButtons(board), generateEndButton()]
        });
    });

    collector.on('end', (_, reason) => {
        if (!['win', 'draw', 'ended'].includes(reason)) {
            message.edit({ content: 'The match ended due to inactivity.', components: [] });
        }
    });
}

async function updateLeaderboard(userId, result) {
    const column = result === 'loss' ? 'losses' : result + 's';
    await pool.execute(
        `INSERT INTO leaderboard (user_id, wins, losses, draws) 
         VALUES (?, 0, 0, 0) 
         ON DUPLICATE KEY UPDATE ${column} = ${column} + 1`,
        [userId]
    );
}
function generateButtons(board) {
    return board.map((row, rowIndex) => new ActionRowBuilder().addComponents(
        row.map((cell, colIndex) => {
            const button = new ButtonBuilder()
                .setCustomId(`${rowIndex}-${colIndex}`)
                .setStyle(
                    cell === '<:X_:1354553322639589507>' ? ButtonStyle.Primary :
                        cell === '<:O_:1354553298241454121>' ? ButtonStyle.Success : ButtonStyle.Secondary
                )
                .setDisabled(cell !== '⬜');

            // Use emojis instead of labels
            if (cell === '<:X_:1354553322639589507>') {
                button.setEmoji('1354547201669468311'); // ID of the X emoji
            } else if (cell === '<:O_:1354553298241454121>') {
                button.setEmoji('1354547067124449522'); // ID of the O emoji
            } else {
                button.setLabel('-');
            }

            return button;
        })
    ));
}

function generateEndButton() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('end')
            .setLabel('End Match')
            .setStyle(ButtonStyle.Danger)
    );
}
function formatBoard(board) {
    return board.map(row => row.join(' ')).join('\n');
}
function checkWin(board, symbol) {
    return (
        [0, 1, 2].some(i => board[i].every(cell => cell === symbol)) || // Rows
        [0, 1, 2].some(i => board.every(row => row[i] === symbol)) || // Columns
        [board[0][0], board[1][1], board[2][2]].every(cell => cell === symbol) || // Diagonal 1
        [board[0][2], board[1][1], board[2][0]].every(cell => cell === symbol) // Diagonal 2
    );
}
