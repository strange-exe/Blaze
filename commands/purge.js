const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const successId = "1303370622411346020"; // Keep your success emoji ID here

module.exports = {
  name: 'purge',
  description: 'Main purge command with subcommands to delete messages',
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages with subcommands')
    .addSubcommand(subcommand =>
      subcommand.setName('amount')
        .setDescription('Delete a specified number of messages')
        .addIntegerOption(option =>
          option.setName('amount')
                .setDescription('The number of messages to delete')
                .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('after')
        .setDescription('Purge all messages after a specific message')
        .addStringOption(option =>
          option.setName('messageid')
                .setDescription('The ID of the message to purge after')
                .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('upto')
        .setDescription('Purge messages within a specific duration')
        .addStringOption(option =>
          option.setName('duration')
                .setDescription('Duration to purge (e.g., 1m, 1h)')
                .setRequired(true))),
  aliases: ['p', 'del', 'delete', 'clear'], 

  async executeText(message, args) {
    if (!message.guild) {
      return message.reply('This command cannot be used in DMs.');
    }

    let amount = 0;  // Default amount for `amount` subcommand
    const subcommand = args[0];

    // If the first argument is a number, treat it as amount subcommand
    if (args[0] && !isNaN(args[0])) {
      amount = parseInt(args[0]);
      if (amount <= 0) {
        return message.reply('Please provide a valid number of messages to delete.');
      }
    }

    try {
      // Handle amount subcommand
      if (subcommand === 'amount' || args[0] && !['after', 'upto'].includes(subcommand)) {
        await bulkDeleteMessages(message, amount+1);  // `amount` is handled directly
      } else if (subcommand === 'after') {
        const messageId = args[1];
        if (!messageId) {
          return message.reply('Please provide a valid message ID.');
        }
        await purgeAfterText(message, messageId);
      } else if (subcommand === 'upto') {
        const duration = args[1];
        if (!duration) {
          return message.reply('Please provide a valid duration (e.g., 1m, 1h).');
        }
        await purgeUpToText(message, duration);
      } else {
        // Default behavior if no subcommand is given
        await bulkDeleteMessages(message, amount+1);
      }
    } catch (error) {
      console.error('Error executing text command:', error);
      message.reply('There was an error executing the command.');
    }
  },

  async executeSlash(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    let amount = 0;  // Default amount for `amount` subcommand

    try {
      if (subcommand === 'amount') {
        amount = interaction.options.getInteger('amount');
        if (amount <= 0) {
          return interaction.reply({ content: 'Please provide a valid number of messages to delete.', ephemeral: true });
        }
        await bulkDeleteMessages(interaction, amount, true);  // Proper `amount` handling for slash command
      } else if (subcommand === 'after') {
        const messageId = interaction.options.getString('messageid');
        await purgeAfter(interaction, messageId);
      } else if (subcommand === 'upto') {
        const duration = interaction.options.getString('duration');
        await purgeUpTo(interaction, duration);
      } else {
        // Default behavior if no subcommand is given
        await bulkDeleteMessages(interaction, amount, true);
      }
    } catch (error) {
      console.error('Error executing slash command:', error);
      if (!interaction.replied) {
        await interaction.reply({ content: 'There was an error executing the command.', ephemeral: true });
      } else {
        await interaction.followUp({ content: 'There was an error executing the command.', ephemeral: true });
      }
    }
  },
};

async function bulkDeleteMessages(context, amount, isSlash = false) {
  if (!context.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    const reply = 'You do not have permission to delete messages.';
    return isSlash ? context.reply({ content: reply, ephemeral: true }) : context.reply(reply);
  }

  const fetchedMessages = await context.channel.messages.fetch({ limit: amount });  // Include the command message itself
  const validMessages = fetchedMessages.filter(msg => !msg.system && msg.id !== context.id);  // Exclude the command message

  if (validMessages.size === 0) {
    return context.reply('No valid messages to delete.');
  }

  await context.channel.bulkDelete(validMessages);

  const embed = new EmbedBuilder()
    .setColor("#0ffc03")
    .setDescription(`<:success:${successId}> **Successfully deleted ${validMessages.size} messages**`)
    .setTimestamp();

  if (isSlash) {
    const reply = await context.reply({ embeds: [embed], ephemeral: true });
    setTimeout(() => reply.delete(), 5000);  // Delete confirmation after 5 seconds
  } else {
    const msg = await context.channel.send({ embeds: [embed] });
    setTimeout(() => msg.delete(), 5000);  // Delete confirmation after 5 seconds
  }
}

async function purgeAfterText(message, messageId) {
  try {
    const targetMessage = await message.channel.messages.fetch(messageId).catch(err => null);
    if (!targetMessage) {
      return message.reply('The provided message ID is invalid or the message has been deleted.');
    }
    const messages = await message.channel.messages.fetch({ after: targetMessage.id });
    await message.channel.bulkDelete(messages);

    const embed = new EmbedBuilder()
      .setColor("#0ffc03")
      .setDescription(`<:success:${successId}> **Successfully deleted ${messages.size} messages**`)
      .setTimestamp();

    setTimeout(() => confirmationMessage.delete(), 5000);  // Delete confirmation after 5 seconds
  } catch (error) {
    console.error('Error purging messages:', error);
    message.channel.send('Failed to purge messages. Please check the message ID.');
  }
}

async function purgeAfter(interaction, messageId) {
  await interaction.deferReply({ ephemeral: true });
  await purgeAfterText(interaction, messageId);
}

async function purgeUpToText(message, duration) {
  const durationMs = parseDuration(duration);
  if (!durationMs) return message.reply('Invalid duration format. Use formats like 1m or 1h.');

  const messages = await message.channel.messages.fetch({ limit: 100 });
  const filteredMessages = messages.filter(msg => Date.now() - msg.createdTimestamp < durationMs);

  if (filteredMessages.size === 0) {
    return message.reply('No messages were found within the specified duration.');
  }

  await message.channel.bulkDelete(filteredMessages);
  const embed = new EmbedBuilder()
    .setColor("#0ffc03")
    .setDescription(`<:success:${successId}> **Successfully deleted ${filteredMessages.size} messages**`)
    .setTimestamp();
  setTimeout(() => confirmationMessage.delete(), 5000);  // Delete confirmation after 5 seconds
}

async function purgeUpTo(interaction, duration) {
  await interaction.deferReply({ ephemeral: true });
  await purgeUpToText(interaction, duration);
}

function parseDuration(duration) {
  const match = duration.match(/^(\d+)([mh])$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  return unit === 'm' ? value * 60000 : unit === 'h' ? value * 3600000 : null;
}
