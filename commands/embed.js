const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create or update a custom embed')
    .addStringOption(option =>
      option.setName('description')
        .setDescription('The description of the embed (use \\n for new lines and markdown like # for headings)')
        .setRequired(true)) // Required option comes first
    .addStringOption(option =>
      option.setName('title')
        .setDescription('The title of the embed (optional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('The color of the embed (hex code, e.g., #7289da)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('thumbnail')
        .setDescription('URL of the thumbnail image (optional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('media')
        .setDescription('URL of an additional image to include in the embed (optional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('footer')
        .setDescription('Text to be displayed in the footer')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('The ID of the message to update (optional)')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('ephemeral')
        .setDescription('Whether the reply should be ephemeral')
        .setRequired(false)),

  async executeSlash(interaction) {
    const title = interaction.options.getString('title'); // Optional
    let description = interaction.options.getString('description');
    const color = interaction.options.getString('color') || '#7289da'; // Default color
    const thumbnail = interaction.options.getString('thumbnail');
    const media = interaction.options.getString('media');
    const footer = interaction.options.getString('footer') || `Requested by ${interaction.user.tag}`;
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;
    const messageId = interaction.options.getString('message_id');

    // Replace '\\n' with actual line breaks in description
    description = description.replace(/\\n/g, '\n');

    const embed = new EmbedBuilder()
      .setDescription(description) // Description supports markdown
      .setColor(color)
      .setTimestamp();

    if (title) {
      embed.setTitle(title); // Add title only if provided
    }

    // Use provided thumbnail or default to server icon
    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    } else if (interaction.guild?.iconURL()) {
      embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }));
    }

    if (media) {
      embed.setImage(media); // Add media image if provided
    }

    embed.setFooter({
      text: footer,
      iconURL: interaction.user.displayAvatarURL(),
    });

    if (messageId) {
      try {
        const message = await interaction.channel.messages.fetch(messageId);
        await message.edit({ embeds: [embed] });
        await interaction.reply({ content: 'Embed updated successfully!', ephemeral });
      } catch (error) {
        console.error('Error fetching message to update:', error);
        await interaction.reply({ content: 'Failed to update the embed. Please check the message ID.', ephemeral });
      }
    } else {
      await interaction.reply({ embeds: [embed], ephemeral });
    }
  },
};
