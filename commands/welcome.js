const { SlashCommandBuilder } = require('discord.js');
const { pool } = require('../utils/db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Set up a custom join message or embed and join role.')
    .addBooleanOption((option) =>
      option.setName('embed')
        .setDescription('Use an embed for the join message?')
        .setRequired(false))
    .addStringOption((option) =>
      option.setName('title')
        .setDescription('Title of the embed (if enabled)')
        .setRequired(false))
    .addStringOption((option) =>
      option.setName('description')
        .setDescription('Description of the embed (if enabled)')
        .setRequired(false))
    .addStringOption((option) =>
      option.setName('media')
        .setDescription('URL for embed media (image/thumbnail)')
        .setRequired(false))
    .addStringOption((option) =>
      option.setName('message')
        .setDescription('Custom join message (ignored if embed is enabled)')
        .setRequired(false))
    .addRoleOption((option) =>
      option.setName('role')
        .setDescription('Role to assign to new members')
        .setRequired(false)),

  async executeSlash(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ content: 'You need administrator permissions to use this command.', ephemeral: true });
    }

    const embedOption = interaction.options.getBoolean('embed') || false;
    const embedTitle = interaction.options.getString('title') || 'Welcome, {usernick}!';
    const embedDescription = interaction.options.getString('description') ||
      'You are the {membercount}th member of {guildname}! Enjoy your stay!';
    const embedMedia = interaction.options.getString('media') || null;
    const customMessage = interaction.options.getString('message') || 'Welcome to {guildname}, {user}!';
    const joinRole = interaction.options.getRole('role');
    const guildId = interaction.guild.id;
    const embedChannelId = interaction.channel.id;
    const joinRoleId = joinRole ? joinRole.id : null;

    // Validate media URL
    const isValidUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (embedOption && embedMedia && !isValidUrl(embedMedia)) {
      return interaction.reply({
        content: 'Invalid media URL. Please provide a valid URL for the embed media.',
        ephemeral: true,
      });
    }

    if (joinRole && !interaction.guild.roles.cache.has(joinRole.id)) {
      return interaction.reply({
        content: 'The selected role is not valid. Please choose an existing role in this server.',
        ephemeral: true,
      });
    }

    const sql = `
      INSERT INTO join_settings (guild_id, embed, embed_title, embed_description, embed_media, message, join_role_id, embed_channel_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      embed = VALUES(embed),
      embed_title = VALUES(embed_title),
      embed_description = VALUES(embed_description),
      embed_media = VALUES(embed_media),
      message = VALUES(message),
      join_role_id = VALUES(join_role_id),
      embed_channel_id = VALUES(embed_channel_id);
    `;

    try {
      await pool.execute(sql, [
        guildId,
        embedOption,
        embedTitle,
        embedDescription,
        embedMedia,
        customMessage,
        joinRoleId,
        embedChannelId,
      ]);

      return interaction.reply({
        content: 'Join message and role configuration updated successfully!',
        ephemeral: true,
      });
    } catch (error) {
      console.error('Failed to update join settings:', error);
      return interaction.reply({
        content: 'An error occurred while saving the join settings. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
