const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  name: 'download',
  description: 'Downloads an emoji or sticker from the server.',
  data: new SlashCommandBuilder()
    .setName('download')
    .setDescription('Download an emoji or sticker')
    .addStringOption(option => 
      option.setName('type')
            .setDescription('Choose whether to download an emoji or sticker')
            .setRequired(true)
            .addChoices(
              { name: 'Emoji', value: 'emoji' },
              { name: 'Sticker', value: 'sticker' }
            ))
    .addStringOption(option =>
      option.setName('identifier')
            .setDescription('Provide the emoji name or sticker ID')
            .setRequired(true)),
  aliases: ['dl', 'save', 'get'],
  
  async executeText(message, args) {
    const type = args[0];
    const identifier = args[1];

    if (!type || !identifier) {
      return message.reply('Usage: `${prefix}download <emoji|sticker> <name|ID>`');
    }

    // Check if the command is being executed in a DM
    if (!message.guild) {
      return message.reply('This command can only be used in a server, not in DMs.');
    }

    if (type.toLowerCase() === 'emoji') {
      // If the identifier is an emoji ID (e.g., a custom emoji)
      const emojiRegex = /<:\w+:(\d+)>/; // Regex to match emoji ID in format <:emoji_name:emoji_id>
      const emojiMatch = emojiRegex.exec(identifier);
      let emojiUrl;

      if (emojiMatch) {
        emojiUrl = `https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`;
      } else {
        const emoji = message.guild.emojis.cache.find(e => e.name === identifier || e.id === identifier);
        if (!emoji) return message.reply('Emoji not found!');
        emojiUrl = emoji.url;
      }

      const attachment = new AttachmentBuilder(emojiUrl);
      return message.channel.send({ files: [attachment], content: `Here is the emoji: ${identifier}` });
    }

    if (type.toLowerCase() === 'sticker') {
      // Check if the identifier is a sticker ID
      const stickerUrl = `https://cdn.discordapp.com/stickers/${identifier}.png`;

      const attachment = new AttachmentBuilder(stickerUrl);
      return message.channel.send({ files: [attachment], content: `Here is the sticker: ${identifier}` });
    }
  },

  async executeSlash(interaction) {
    const type = interaction.options.getString('type');
    const identifier = interaction.options.getString('identifier');

    // Check if the command is being executed in a DM
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used in a server, not in DMs.', ephemeral: true });
    }

    if (type === 'emoji') {
      // If the identifier is an emoji ID (e.g., a custom emoji)
      const emojiRegex = /<:\w+:(\d+)>/; // Regex to match emoji ID in format <:emoji_name:emoji_id>
      const emojiMatch = emojiRegex.exec(identifier);
      let emojiUrl;

      if (emojiMatch) {
        emojiUrl = `https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`;
      } else {
        const emoji = interaction.guild.emojis.cache.find(e => e.name === identifier || e.id === identifier);
        if (!emoji) return interaction.reply({ content: 'Emoji not found!', ephemeral: true });
        emojiUrl = emoji.url;
      }

      const attachment = new AttachmentBuilder(emojiUrl);
      return interaction.reply({ files: [attachment], content: `Here is the emoji: ${identifier}` });
    }

    if (type === 'sticker') {
      // Check if the identifier is a sticker ID
      const stickerUrl = `https://cdn.discordapp.com/stickers/${identifier}.png`;

      const attachment = new AttachmentBuilder(stickerUrl);
      return interaction.reply({ files: [attachment], content: `Here is the sticker: ${identifier}` });
    }
  },
};
