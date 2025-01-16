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
  aliases: ['ts','time'], 

  // Traditional command execution
  async execute(message, args) {
    if (!args.length) {
      return await this.generateTimestampEmbed(message);
    } else {
      return await this.generateCustomTimestampEmbed(message, args.join(' '));
    }
  },

  // Slash command execution
  async executeSlash(interaction) {
    const dateStr = interaction.options.getString('date');
    if (!dateStr) {
      return await this.generateTimestampEmbed(interaction);
    } else {
      return await this.generateCustomTimestampEmbed(interaction, dateStr);
    }
  },

  // Helper function to generate timestamp embed
  async generateTimestampEmbed(messageOrInteraction) {
    const now = Math.floor(Date.now() / 1000);
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Current Time Timestamps')
      .addFields(
        { name: 'Short Time', value: `\`<t:${now}:t>\` → <t:${now}:t>`, inline: true },
        { name: 'Long Time', value: `\`<t:${now}:T>\` → <t:${now}:T>`, inline: true },
        { name: 'Short Date', value: `\`<t:${now}:d>\` → <t:${now}:d>`, inline: true },
        { name: 'Long Date', value: `\`<t:${now}:D>\` → <t:${now}:D>`, inline: true },
        { name: 'Short Date/Time', value: `\`<t:${now}:f>\` → <t:${now}:f>`, inline: true },
        { name: 'Long Date/Time', value: `\`<t:${now}:F>\` → <t:${now}:F>`, inline: true },
        { name: 'Relative Time', value: `\`<t:${now}:R>\` → <t:${now}:R>`, inline: true }
      )
      .setFooter({ text: 'Copy the code to use the timestamp' });

    if (messageOrInteraction.reply) {
      return await messageOrInteraction.reply({ embeds: [embed] });
    } else {
      return await messageOrInteraction.channel.send({ embeds: [embed] });
    }
  },

  // Helper function to generate custom timestamp embed
  async generateCustomTimestampEmbed(messageOrInteraction, dateStr) {
    try {
      const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);

      if (isNaN(timestamp)) {
        const errorMessage = 'Invalid date format. Please use a valid date format (e.g., "2024-01-01" or "2024-01-01 15:30")';
        if (messageOrInteraction.reply) {
          return await messageOrInteraction.reply({ content: errorMessage, ephemeral: true });
        } else {
          return await messageOrInteraction.channel.send(errorMessage);
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Custom Time Timestamps')
        .addFields(
          { name: 'Short Time', value: `\`<t:${timestamp}:t>\` → <t:${timestamp}:t>`, inline: true },
          { name: 'Long Time', value: `\`<t:${timestamp}:T>\` → <t:${timestamp}:T>`, inline: true },
          { name: 'Short Date', value: `\`<t:${timestamp}:d>\` → <t:${timestamp}:d>`, inline: true },
          { name: 'Long Date', value: `\`<t:${timestamp}:D>\` → <t:${timestamp}:D>`, inline: true },
          { name: 'Short Date/Time', value: `\`<t:${timestamp}:f>\` → <t:${timestamp}:f>`, inline: true },
          { name: 'Long Date/Time', value: `\`<t:${timestamp}:F>\` → <t:${timestamp}:F>`, inline: true },
          { name: 'Relative Time', value: `\`<t:${timestamp}:R>\` → <t:${timestamp}:R>`, inline: true }
        )
        .setFooter({ text: 'Copy the code to use the timestamp' });

      if (messageOrInteraction.reply) {
        return await messageOrInteraction.reply({ embeds: [embed] });
      } else {
        return await messageOrInteraction.channel.send({ embeds: [embed] });
      }
    } catch (error) {
      const errorMessage = 'Error processing the date. Please use a valid date format (e.g., "2024-01-01" or "2024-01-01 15:30")';
      if (messageOrInteraction.reply) {
        return await messageOrInteraction.reply({ content: errorMessage, ephemeral: true });
      } else {
        return await messageOrInteraction.channel.send(errorMessage);
      }
    }
  }
};
