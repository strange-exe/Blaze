// serverinfo.js
const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays detailed information about the server.'),
    aliases: ['sv', 'svinfo'], 

    // Handle Slash Command
    async executeSlash(interaction) {
        await executeServerInfo(interaction, true); // true for ephemeral (private response)
    },

    // Handle Text Command (Prefix Command)
    async executeText(message, args) {
        await executeServerInfo(message, false); // false for public response
    },
};

// Common function to handle both command types
async function executeServerInfo(interactionOrMessage, ephemeral) {
    try {
        // Check if interaction exists to differentiate between slash and message commands
        const isInteraction = !!interactionOrMessage.isCommand;
        const guild = interactionOrMessage.guild;

        // Check if the command is run in a DM (Direct Message)
        if (!guild) {
            const dmErrorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('This command cannot be used in Direct Messages (DMs). Please use it in a server.')
                .setTimestamp();
                
            // Respond with the error message
            if (isInteraction) {
                await interactionOrMessage.reply({ embeds: [dmErrorEmbed], ephemeral });
            } else {
                await interactionOrMessage.channel.send({ embeds: [dmErrorEmbed] });
            }
            return;
        }

        // If we're in a guild, proceed with gathering server info
        const owner = await guild.fetchOwner(); // Get server owner
        const createdAt = guild.createdAt.toDateString(); // Format the server creation date
        const memberCount = guild.memberCount; // Member count
        
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const roleCount = guild.roles.cache.size;
        const emojiCount = guild.emojis.cache.size;
        const boostCount = guild.premiumSubscriptionCount;
        const boostTier = guild.premiumTier;

        const embed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle(`${guild.name} - Server Information`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '**👑 Server Owner**', value: `<@${owner.user.id}>`, inline: true },
                { name: '**📅 Created On**', value: `${createdAt}`, inline: true },
                { name: '**👥 Members**', value: `${memberCount}`, inline: true },
                { name: '**💬 Text Channels**', value: `${textChannels}`, inline: true },
                { name: '**🔊 Voice Channels**', value: `${voiceChannels}`, inline: true },
                { name: '**🔑 Roles**', value: `${roleCount}`, inline: true },
                { name: '**😀 Emojis**', value: `${emojiCount}`, inline: true }
            );

        if (boostCount > 0) {
            embed.addFields(
                { name: '**💎 Server Boosts**', value: `${boostCount}`, inline: true },
                { name: '**🎯 Boost Tier**', value: `Tier ${boostTier}`, inline: true }
            );
        }

        embed.setTimestamp();

        const footerText = `Developed by ${interactionOrMessage.client.users.cache.get('1023977968562876536')?.tag}`;
        embed.setFooter({ text: footerText });

        // Reply or send the message based on the context
        if (isInteraction) {
            await interactionOrMessage.reply({ embeds: [embed], ephemeral });
        } else {
            await interactionOrMessage.channel.send({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Error fetching server information:', error);
        const errorMsg = 'An error occurred while fetching the server information.';
        if (interactionOrMessage.reply) {
            await interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
        } else {
            await interactionOrMessage.channel.send(errorMsg);
        }
    }
}
