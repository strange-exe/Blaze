const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  name: 'timestamp',
  description: 'Generate Discord timestamps for current or custom time',
  data: new SlashCommandBuilder()
    .setName('timestamp')
    .setDescription('Generate Discord timestamps for current or custom time')
    .addSubcommand(subcommand =>
      subcommand
        .setName('now')
        .setDescription('Get timestamps for current time')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('custom')
        .setDescription('Get timestamps for a custom date/time')
        .addStringOption(option =>
          option
            .setName('date')
            .setDescription('Custom date (e.g., "2024-01-01" or "2024-01-01 15:30")')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('relative')
        .setDescription('Get timestamp for a relative time')
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('Time amount')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1000)
        )
        .addStringOption(option =>
          option
            .setName('unit')
            .setDescription('Time unit')
            .setRequired(true)
            .addChoices(
              { name: '⏱️ Minutes', value: 'minutes' },
              { name: '⏰ Hours', value: 'hours' },
              { name: '📅 Days', value: 'days' },
              { name: '📆 Weeks', value: 'weeks' },
              { name: '📊 Months', value: 'months' }
            )
        )
        .addStringOption(option =>
          option
            .setName('direction')
            .setDescription('Time direction')
            .addChoices(
              { name: '⏩ From now', value: 'future' },
              { name: '⏪ Before now', value: 'past' }
            )
        )
    ),
  aliases: ['ts', 'time'],

  async executeText(message, args) {
    try {
      if (!args.length) {
        return await this.generateTimestampEmbed(message, true);
      }

      if (args[0].toLowerCase() === 'relative') {
        const amount = parseInt(args[1]);
        const unit = args[2]?.toLowerCase();
        const direction = args[3]?.toLowerCase() === 'ago' ? 'past' : 'future';
        
        if (!amount || !unit || isNaN(amount)) {
          return message.reply('Please provide a valid amount and unit (e.g., `!timestamp relative 2 hours` or `!timestamp relative 3 days ago`)');
        }
        return await this.generateRelativeTimestampEmbed(message, amount, unit, direction, true);
      }

      return await this.generateCustomTimestampEmbed(message, args.join(' '), true);
    } catch (error) {
      console.error(error);
      return message.reply('There was an error executing the command!');
    }
  },

  async executeSlash(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'now':
          return await this.generateTimestampEmbed(interaction, false);
        case 'custom':
          const dateStr = interaction.options.getString('date');
          return await this.generateCustomTimestampEmbed(interaction, dateStr, false);
        case 'relative':
          const amount = interaction.options.getInteger('amount');
          const unit = interaction.options.getString('unit');
          const direction = interaction.options.getString('direction') || 'future';
          return await this.generateRelativeTimestampEmbed(interaction, amount, unit, direction, false);
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'There was an error executing the command!', ephemeral: true });
    }
  },

  createTimestampButtons(timestamp) {
    const formats = [
      { label: '⌚ Short Time', value: 't', description: 'e.g., 3:45 PM', style: ButtonStyle.Primary },
      { label: '🕐 Long Time', value: 'T', description: 'e.g., 3:45:20 PM', style: ButtonStyle.Primary },
      { label: '📅 Short Date', value: 'd', description: 'e.g., 01/20/2024', style: ButtonStyle.Success },
      { label: '📆 Long Date', value: 'D', description: 'e.g., January 20, 2024', style: ButtonStyle.Success },
      { label: '⏰ Short Date/Time', value: 'f', description: 'e.g., January 20, 2024 3:45 PM', style: ButtonStyle.Danger },
      { label: '🗓️ Long Date/Time', value: 'F', description: 'e.g., Saturday, January 20, 2024 3:45 PM', style: ButtonStyle.Danger },
      { label: '⏱️ Relative', value: 'R', description: 'e.g., 2 hours ago', style: ButtonStyle.Secondary }
    ];

    const rows = [];
    let currentRow = new ActionRowBuilder();
    
    formats.forEach((format, index) => {
      const button = new ButtonBuilder()
        .setCustomId(`timestamp_${format.value}_${timestamp}`)
        .setLabel(format.label)
        .setStyle(format.style);

      currentRow.addComponents(button);

      // Create new row after 4 buttons (better spacing) or at the end
      if ((index + 1) % 4 === 0 || index === formats.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
    });

    // Add utility buttons in a new row
    const utilityRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copy_timestamp_${timestamp}`)
        .setLabel('📋 Copy Current Format')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`refresh_timestamp_${timestamp}`)
        .setLabel('🔄 Refresh Preview')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`help_timestamp`)
        .setLabel('❓ Help')
        .setStyle(ButtonStyle.Secondary)
    );
    rows.push(utilityRow);

    return rows;
  },

  async handleButtonInteraction(interaction, timestamp, format) {
    if (interaction.customId.startsWith('copy_timestamp')) {
      // Get the currently displayed format from the message
      const currentEmbed = interaction.message.embeds[0];
      const currentFormat = currentEmbed.data.fields[0].value.match(/<t:\d+:(.?)>/)?.[1] || 'F';
      const code = `<t:${timestamp}:${currentFormat}>`;
      
      try {
        // Try to copy to clipboard using Discord's built-in feature
        await interaction.reply({
          content: `📋 **Copied to clipboard!**\n\`${code}\``,
          ephemeral: true
        });

        // Send the code in a way that makes it easy for users to copy
        await interaction.followUp({
          content: code,
          ephemeral: true
        });
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        await interaction.reply({
          content: `Here's your timestamp (click to copy):\n\`${code}\``,
          ephemeral: true
        });
      }
    } else if (interaction.customId === 'help_timestamp') {
      const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('❓ Timestamp Help')
        .setDescription('Here\'s how to use Discord timestamps:')
        .addFields(
          { name: '⌚ Short Time (t)', value: 'Shows time only (e.g., 3:45 PM)', inline: true },
          { name: '🕐 Long Time (T)', value: 'Shows time with seconds (e.g., 3:45:20 PM)', inline: true },
          { name: '📅 Short Date (d)', value: 'Shows date only (e.g., 01/20/2024)', inline: true },
          { name: '📆 Long Date (D)', value: 'Shows full date (e.g., January 20, 2024)', inline: true },
          { name: '⏰ Short Date/Time (f)', value: 'Shows date and time (e.g., January 20, 2024 3:45 PM)', inline: true },
          { name: '🗓️ Long Date/Time (F)', value: 'Shows full date and time (e.g., Saturday, January 20, 2024 3:45 PM)', inline: true },
          { name: '⏱️ Relative (R)', value: 'Shows time relative to now (e.g., 2 hours ago)', inline: true }
        )
        .setFooter({ text: 'Tip: Click the buttons to preview each format!' });

      await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    } else if (interaction.customId.startsWith('refresh_timestamp')) {
      const newTimestamp = Math.floor(Date.now() / 1000);
      const components = this.createTimestampButtons(newTimestamp);
      
      const refreshedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFields(
          { name: 'Current Time', value: `<t:${newTimestamp}:F>`, inline: false },
          { name: 'Preview', value: 'Click any button below to preview and copy timestamp formats.', inline: false }
        );

      await interaction.update({ embeds: [refreshedEmbed], components });
    } else {
      const formatNames = {
        't': '⌚ Short Time',
        'T': '🕐 Long Time',
        'd': '📅 Short Date',
        'D': '📆 Long Date',
        'f': '⏰ Short Date/Time',
        'F': '🗓️ Long Date/Time',
        'R': '⏱️ Relative'
      };
      
      const code = `<t:${timestamp}:${format}>`;
      
      // Update the embed to show the current format
      const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      newEmbed.data.fields[0].value = code;
      
      await interaction.update({ embeds: [newEmbed] });
      
      // Send the format preview as an ephemeral message with easy copy
      await interaction.followUp({
        content: `**${formatNames[format]}**\n\`${code}\``,
        ephemeral: true
      });
    }
  },

  async generateTimestampEmbed(messageOrInteraction, isLegacyCommand) {
    const now = Math.floor(Date.now() / 1000);
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('⏰ Discord Timestamp Generator')
      .setDescription('Generate beautiful timestamps for your messages! Click the buttons below to preview different formats and copy their codes.')
      .addFields(
        { 
          name: 'Current Time',
          value: `<t:${now}:F>`,
          inline: false 
        },
        {
          name: 'Preview',
          value: 'Click any button below to preview and copy timestamp formats.',
          inline: false
        }
      )
      .setFooter({ text: '🔄 Updates automatically • 📋 Click buttons to copy • ❓ Click Help for more info' });

    const components = this.createTimestampButtons(now);

    const response = isLegacyCommand
      ? await messageOrInteraction.channel.send({ embeds: [embed], components })
      : await messageOrInteraction.reply({ embeds: [embed], components });

    // Create button collector
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000 // 5 minutes
    });

    collector.on('collect', async i => {
      const [action, format, timestamp] = i.customId.split('_');
      await this.handleButtonInteraction(i, timestamp, format);
    });

    collector.on('end', () => {
      if (response.editable) {
        const endedEmbed = EmbedBuilder.from(embed)
          .setFooter({ text: '⏰ Timestamp session ended • Use the command again for a new session' })
          .setColor('#808080');
        response.edit({ embeds: [endedEmbed], components: [] }).catch(() => {});
      }
    });
  },

  async generateCustomTimestampEmbed(messageOrInteraction, dateStr, isLegacyCommand) {
    try {
      const date = new Date(dateStr);
      const timestamp = Math.floor(date.getTime() / 1000);

      if (isNaN(timestamp)) {
        const errorMessage = '❌ Invalid date format. Please use a valid date format (e.g., "2024-01-01" or "2024-01-01 15:30")';
        if (isLegacyCommand) {
          return await messageOrInteraction.channel.send(errorMessage);
        } else {
          return await messageOrInteraction.reply({ content: errorMessage, ephemeral: true });
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('⏰ Custom Timestamp Generator')
        .setDescription('Generate beautiful timestamps for your messages! Click the buttons below to preview different formats and copy their codes.')
        .addFields(
          { 
            name: 'Selected Time',
            value: `<t:${timestamp}:F>`,
            inline: false 
          },
          {
            name: 'Preview',
            value: 'Click any button below to preview and copy timestamp formats.',
            inline: false
          }
        )
        .setFooter({ text: '🔄 Updates automatically • 📋 Click buttons to copy • ❓ Click Help for more info' });

      const components = this.createTimestampButtons(timestamp);

      const response = isLegacyCommand
        ? await messageOrInteraction.channel.send({ embeds: [embed], components })
        : await messageOrInteraction.reply({ embeds: [embed], components });

      // Create button collector
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async i => {
        const [action, format, timestamp] = i.customId.split('_');
        await this.handleButtonInteraction(i, timestamp, format);
      });

      collector.on('end', () => {
        if (response.editable) {
          const endedEmbed = EmbedBuilder.from(embed)
            .setFooter({ text: '⏰ Timestamp session ended • Use the command again for a new session' })
            .setColor('#808080');
          response.edit({ embeds: [endedEmbed], components: [] }).catch(() => {});
        }
      });
    } catch (error) {
      console.error(error);
      const errorMessage = '❌ Error processing the date. Please use a valid date format (e.g., "2024-01-01" or "2024-01-01 15:30")';
      if (isLegacyCommand) {
        return await messageOrInteraction.channel.send(errorMessage);
      } else {
        return await messageOrInteraction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },

  async generateRelativeTimestampEmbed(messageOrInteraction, amount, unit, direction = 'future', isLegacyCommand) {
    try {
      const now = new Date();
      let targetDate = new Date(now);
      const multiplier = direction === 'past' ? -1 : 1;

      switch (unit) {
        case 'minutes':
          targetDate.setMinutes(now.getMinutes() + (amount * multiplier));
          break;
        case 'hours':
          targetDate.setHours(now.getHours() + (amount * multiplier));
          break;
        case 'days':
          targetDate.setDate(now.getDate() + (amount * multiplier));
          break;
        case 'weeks':
          targetDate.setDate(now.getDate() + (amount * 7 * multiplier));
          break;
        case 'months':
          targetDate.setMonth(now.getMonth() + (amount * multiplier));
          break;
        default:
          throw new Error('Invalid time unit');
      }

      const timestamp = Math.floor(targetDate.getTime() / 1000);
      const directionText = direction === 'past' ? 'ago' : 'from now';

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('⏰ Relative Timestamp Generator')
        .setDescription(`Showing timestamps for: ${amount} ${unit} ${directionText}`)
        .addFields(
          { 
            name: 'Target Time',
            value: `<t:${timestamp}:F>`,
            inline: false 
          },
          {
            name: 'Preview',
            value: 'Click any button below to preview and copy timestamp formats.',
            inline: false
          }
        )
        .setFooter({ text: '🔄 Updates automatically • 📋 Click buttons to copy • ❓ Click Help for more info' });

      const components = this.createTimestampButtons(timestamp);

      const response = isLegacyCommand
        ? await messageOrInteraction.channel.send({ embeds: [embed], components })
        : await messageOrInteraction.reply({ embeds: [embed], components });

      // Create button collector
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async i => {
        const [action, format, timestamp] = i.customId.split('_');
        await this.handleButtonInteraction(i, timestamp, format);
      });

      collector.on('end', () => {
        if (response.editable) {
          const endedEmbed = EmbedBuilder.from(embed)
            .setFooter({ text: '⏰ Timestamp session ended • Use the command again for a new session' })
            .setColor('#808080');
          response.edit({ embeds: [endedEmbed], components: [] }).catch(() => {});
        }
      });
    } catch (error) {
      console.error(error);
      const errorMessage = '❌ Error processing the relative time. Please use valid values.';
      if (isLegacyCommand) {
        return await messageOrInteraction.channel.send(errorMessage);
      } else {
        return await messageOrInteraction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};
