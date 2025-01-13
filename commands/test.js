const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../utils/db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test the welcome message configuration.'),

  async executeSlash(interaction) {
    const guildId = interaction.guild.id;

    try {
      // Query the database for join settings
      const [row] = await pool.query(
        'SELECT embed, message, embed_title, embed_description, embed_media, embed_channel_id FROM join_settings WHERE guild_id = ?',
        [guildId]
      );

      if (!row || row.length === 0) {
        return interaction.reply({
          content: 'No join settings found for this server. Please configure the welcome settings first.',
          ephemeral: true,
        });
      }

      const { message, embed_title, embed_description, embed_media, embed_channel_id } = row[0];

      // Get the target channel
      const targetChannel = embed_channel_id
        ? await interaction.guild.channels.fetch(embed_channel_id).catch(() => null)
        : interaction.guild.systemChannel;

      if (!targetChannel) {
        return interaction.reply({
          content: 'The specified channel is invalid or not found.',
          ephemeral: true,
        });
      }

      // Ensure the bot has permissions to send messages
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
      const botPermissions = targetChannel.permissionsFor(botMember);

      if (!botPermissions?.has('SEND_MESSAGES')) {
        return interaction.reply({
          content: 'I do not have permission to send messages in the target channel.',
          ephemeral: true,
        });
      }

      // Helper function to replace placeholders
      function replacePlaceholders(input) {
        if (!input) return null;
        const suffix = getOrdinalSuffix(interaction.guild.memberCount);
        return input
          .replace('{user}', `<@${interaction.user.id}>`) // Mention the user
          .replace('{username}', interaction.user.username) // Username
          .replace('{membercount}', `${interaction.guild.memberCount}${suffix}`) // Member count with suffix
          .replace('{usernick}', interaction.member.nickname || interaction.user.nickname || interaction.user.displayName) // Nickname or username
          .replace('{useravatar}', interaction.user.displayAvatarURL({ dynamic: true })); // User's avatar URL
      }

       function getRandomColor() {
         const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    	 return `#${randomColor.padStart(6, '0')}`;
       }// Get ordinal suffix for member count
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

      // Prepare the custom message
      const formattedMessage = replacePlaceholders(
        message || 'Welcome to the server, {user}!'
      );

      // Prepare the embed
      const formattedTitle = replacePlaceholders(
        embed_title || 'Welcome to {username}!'
      );
      const formattedDescription = replacePlaceholders(
        embed_description || 'We are excited to have you here, {usernick}!'
      );
  
      const joinEmbed = new EmbedBuilder()
        .setTitle(formattedTitle)
        .setDescription(formattedDescription)
        .setFooter({text:'Created By : Sᴛʀᴀɴɢᴇ'})
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setColor(getRandomColor());

      if (embed_media) {
        joinEmbed.setImage(embed_media);
      }

      // Send both the message and embed in the same message
      await targetChannel.send({
        content: formattedMessage,
        embeds: [joinEmbed],
      });

      return interaction.reply({ content: 'Test message sent successfully!', ephemeral: true });
    } catch (err) {
      console.error('Error testing the welcome message:', err);
      return interaction.reply({
        content: 'There was an error while testing the welcome message. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
