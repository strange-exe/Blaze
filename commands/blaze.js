const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blaze')
    .setDescription('Displays information about Blaze, the all-in-one Discord bot'),

  async executeSlash(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('About Blaze')
      .setColor('#FF4500')
      .setDescription(`
Blaze is an all-in-one, feature-rich Discord bot that brings a powerful suite of commands to your server. Whether you're managing a large community, moderating chats, or simply enhancing the fun with interactive commands, Blaze has something for everyone.

**__Key Features:__**

__Advanced Moderation Tools:__  
Including message purging, role management, and user information commands.

__Customizable Commands:__  
Tailor command prefixes per server for personalized control.

__User-Friendly Design:__  
Blaze's easy-to-use commands and responsive support ensure smooth server management.

__Fun Interactions:__  
With commands like emoji and sticker downloads, custom user info, and more to engage your members.

__Slash Commands & Prefix Compatibility:__  
Enjoy both modern slash commands and traditional text-based commands for maximum flexibility.

Blaze is built with customization, flexibility, and ease of use in mind. Whether you’re an admin looking for better control or a user looking to interact with your server in a new way, Blaze has you covered.

__Available in multiple languages (Alpha Phase):__  
Blaze's interface is fully customizable, supporting various languages for a global community experience.

--------------------------------------------------------------------------------

**Note: Blaze is constantly being updated to add new features, commands, and optimizations based on user feedback.**
      `)
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
