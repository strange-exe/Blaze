const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Fetches user information.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to fetch info for')
                .setRequired(false)),
    aliases: ['uinfo', 'about','whois','user'], 
    // Handle Slash Command
    async executeSlash(interaction) {
        await executeUserInfo(interaction, true); // true for ephemeral (private response)
    },

    // Handle Text Command (Prefix Command)
    async executeText(message, args) {
        await executeUserInfo(message, false); // false for public response
    },
};

// Common function to handle both command types
async function executeUserInfo(interactionOrMessage, ephemeral) {
    try {
        const isInteraction = !!interactionOrMessage.isCommand;
        const target = isInteraction 
            ? interactionOrMessage.options.getUser('user') || interactionOrMessage.user 
            : interactionOrMessage.mentions.users.first() || interactionOrMessage.author;

        // Fetch the guild member if available
        const guildMember = interactionOrMessage.guild 
            ? await interactionOrMessage.guild.members.fetch(target.id).catch(() => null) 
            : null;

        await target.fetch(); // Ensure the user is fully fetched
        const bannerURL = target.bannerURL({ dynamic: true, size: 1024 });

        // Collect role information
        const roles = guildMember 
            ? guildMember.roles.cache
                  .filter(role => role.id !== interactionOrMessage.guild.id) // Exclude @everyone
                  .map(role => `\`-\` ${role.toString()}`)
                  .join('\n') || 'No roles'
            : 'No roles';
        const roleCount = guildMember?.roles.cache.size - 1 || 0;

        const embed = new EmbedBuilder()
            .setTitle(`User Information`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor(guildMember?.displayHexColor || '#2f3136')
            .addFields(
                {
                    name: '**General Information**',
                    value: `>>> **Username:** ${target.tag}\n**ID:** \`${target.id}\`\n**Mention:** ${target}\n**Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>\n[Avatar](${target.displayAvatarURL({ dynamic: true })})${bannerURL ? ` | [Banner](${bannerURL})` : ''}`,
                    inline: false
                }
            )
            .setFooter({ text: 'Developed by : strange.io', iconURL: 'https://cdn.discordapp.com/avatars/1064476252792160297/46bdb58b60c45e639a171f0d88a1ff18.webp' });

        if (guildMember) {
            embed.addFields(
                {
                    name: '**Server Information**',
                    value: `>>> **Joined Server:** <t:${Math.floor(guildMember.joinedTimestamp / 1000)}:R>\n**Highest Role:** ${guildMember.roles.highest}`,
                    inline: false
                },
                {
                    name: '**Roles**',
                    value: `>>> ${roles}\n**Total Roles:** ${roleCount}`,
                    inline: false
                }
            );
        }

        if (bannerURL) embed.setImage(bannerURL);

        // Reply or send the message based on the context
        if (isInteraction) {
            await interactionOrMessage.reply({ embeds: [embed], ephemeral });
        } else {
            await interactionOrMessage.channel.send({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Error fetching user information:', error);
        const errorMsg = 'An error occurred while fetching the user information.';
        if (interactionOrMessage.reply) {
            await interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
        } else {
            await interactionOrMessage.channel.send(errorMsg);
        }
    }
}
