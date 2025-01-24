const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const successId = "1303370622411346020"; // Keep your success emoji ID here

module.exports = {
  name: 'Purge Till This Message',
  type: ApplicationCommandType.Message, // This makes it a message context menu command
  data: new ContextMenuCommandBuilder()
    .setName('Purge Till This Message')
    .setType(ApplicationCommandType.Message),
  
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
    }

    const targetMessage = interaction.targetMessage; // The message on which the context menu was invoked

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const filteredMessages = messages.filter(msg => msg.createdTimestamp <= targetMessage.createdTimestamp);

      if (filteredMessages.size === 0) {
        return interaction.reply({ content: 'No messages found to purge up to the selected message.', ephemeral: true });
      }

      await interaction.channel.bulkDelete(filteredMessages);

      const embed = new EmbedBuilder()
        .setColor("#0ffc03")
        .setDescription(`<:success:${successId}> **Successfully deleted ${filteredMessages.size} messages up to the selected message**`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error purging messages till the selected message:', error);
      interaction.reply({ content: 'Failed to purge messages. Please try again.', ephemeral: true });
    }
  },
};
