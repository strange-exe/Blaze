const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot\'s ping and latency.'),

    // Handle Slash Command
    async executeSlash(interaction) {
        await executePing(interaction, true); // true for ephemeral (private response)
    },

    // Handle Text Command (Prefix Command)
    async executeText(message, args) {
        await executePing(message, false); // false for public response
    },
};

// Common function to handle both command types
async function executePing(interactionOrMessage, ephemeral) {
    try {
        const isInteraction = !!interactionOrMessage.isCommand;

        // Calculate latency
        const sent = await interactionOrMessage.reply({
            content: 'Pinging...',
            fetchReply: true,
            ephemeral: isInteraction ? ephemeral : false, // Ensure it’s ephemeral for interactions
        });

        const latency = sent.createdTimestamp - interactionOrMessage.createdTimestamp;
        const apiPing = interactionOrMessage.client.ws.ping;

        const embed = new EmbedBuilder()
            .setTitle('Pong! 🏓')
            .setColor('#2f3136')
            .addFields(
                { name: 'Latency', value: `${latency}ms`, inline: true },
                { name: 'API Latency', value: `${apiPing}ms`, inline: true }
            );

        // Use followUp instead of reply for the second message to avoid interaction reply error
        if (isInteraction) {
            await interactionOrMessage.followUp({
                embeds: [embed],
                ephemeral: ephemeral, // Use the ephemeral flag for interaction follow-up
            });
        } else {
            await interactionOrMessage.channel.send({ embeds: [embed] }); // Send publicly for prefix commands
        }
    } catch (error) {
        console.error('Error fetching ping information:', error);
        const errorMsg = 'An error occurred while fetching the ping information.';
        if (interactionOrMessage.reply) {
            await interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
        } else {
            await interactionOrMessage.channel.send(errorMsg);
        }
    }
}
