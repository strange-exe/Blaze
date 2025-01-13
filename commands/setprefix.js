const { SlashCommandBuilder } = require('discord.js');
const { pool } = require('../utils/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Set a custom prefix for this server.')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('The new prefix for the server')
                .setRequired(true)
        ),
    async execute(interaction) {
        const newPrefix = interaction.options.getString('prefix');
        const guildId = interaction.guild.id;

        try {
            // Update the prefix in the database
            await pool.query(
                'INSERT INTO server_prefixes (guild_id, prefix) VALUES (?, ?) ON DUPLICATE KEY UPDATE prefix = ?',
                [guildId, newPrefix, newPrefix]
            );

            // Update the bot's nickname with the new prefix
            try {
                await interaction.guild.members.me.setNickname(`(${newPrefix}) | Blaze`);
            } catch (error) {
                console.error('Error updating bot nickname:', error);
                return interaction.reply('Prefix updated, but failed to update the bot nickname.');
            }

            await interaction.reply(`Prefix set to \`${newPrefix}\` and bot nickname updated.`);
        } catch (err) {
            console.error('Error updating prefix:', err);
            await interaction.reply('There was an error setting the prefix. Please try again later.');
        }
    }
};
