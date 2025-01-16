const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'timestamp',
  description: 'Generate Discord timestamps for current or custom time',
  // Add slash command configuration
  data: new SlashCommandBuilder()
    .setName('timestamp')
    .setDescription('Generate Discord timestamps for current or custom time')
    .addStringOption(option =>
      option
        .setName('date')
        .setDescription('Custom date (e.g., "2024-01-01" or "2024-01-01 15:30")')
        .setRequired(false)
    ),

  // Traditional command execution
  execute(message, args) {
    if (!args.length) {
      return this.generateTimestampEmbed(message);
    } else {
      return this.generateCustomTimestampEmbed(message, args.join(' '));
    }
  },

  // Slash command execution
  async executeSlash(interaction) {
    const dateStr = interaction.options.getString('date');
    if (!dateStr) {
      return this.generateTimestampEmbed(interaction);
    } else {
      return this.generateCustomTimestampEmbed(interaction, dateStr);
    }
  },

  // Helper function to generate timestamp embed
  generateTimestampEmbed(messageOrInteraction) {
    const now = Math.floor(Date.now() / 1000);
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Current Time Timestamps')
      .addFields(
        { name: 'Short Time', value: `<t:${now}:t>`, inline: true },
        { name: 'Long Time', value: `<t:${now}:T>`, inline: true },
        { name: 'Short Date', value: `<t:${now}:d>`, inline: true },
        { name: 'Long Date', value: `<t:${now}:D>`, inline: true },
        { name: 'Short Date/Time', value: `<t:${now}:f>`, inline: true },
        { name: 'Long Date/Time', value: `<t:${now}:F>`, inline: true },
        { name: 'Relative Time', value: `<t:${now}:R>`, inline: true }
      )
      .setFooter({ text: 'Copy the code to use the timestamp' });

    if (messageOrInteraction.reply) {
      return messageOrInteraction.reply({ embeds: [embed] });
    } else {
      return messageOrInteraction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Helper function to generate custom timestamp embed
  generateCustomTimestampEmbed(messageOrInteraction, dateStr) {
    try {
      const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);

      if (isNaN(timestamp)) {
        const errorMessage = 'Invalid date format. Please use a valid date format (e.g., "2024-01-01" or "2024-01-01 15:30")';
        if (messageOrInteraction.reply) {
          return messageOrInteraction.reply(errorMessage);
        } else {
          return messageOrInteraction.reply({ content: errorMessage, ephemeral: true });
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Custom Time Timestamps')
        .addFields(
          { name: 'Short Time', value: `<t:${timestamp}:t>`, inline: true },
          { name: 'Long Time', value: `<t:${timestamp}:T>`, inline: true },
          { name: 'Short Date', value: `<t:${timestamp}:d>`, inline: true },
          { name: 'Long Date', value: `<t:${timestamp}:D>`, inline: true },
          { name: 'Short Date/Time', value: `<t:${timestamp}:f>`, inline: true },
          { name: 'Long Date/Time', value: `<t:${timestamp}:F>`, inline: true },
          { name: 'Relative Time', value: `<t:${timestamp}:R>`, inline: true }
        )
        .setFooter({ text: 'Copy the code to use the timestamp' });

      if (messageOrInteraction.reply) {
        return messageOrInteraction.reply({ embeds: [embed] });
      } else {
        return messageOrInteraction.reply({ embeds: [embed], ephemeral: false });
      }
    } catch (error) {
      const errorMessage = 'Error processing the date. Please use a valid date format (e.g., "2024-01-01" or "2024-01-01 15:30")';
      if (messageOrInteraction.reply) {
        return messageOrInteraction.reply(errorMessage);
      } else {
        return messageOrInteraction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};
