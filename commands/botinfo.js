const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Displays detailed information about the bot'),

  async executeSlash(interaction) {
    const isDM = !interaction.guild;
    const totalServers = interaction.client.guilds.cache.size;
    const uptime = formatUptime(process.uptime());
    const apiLatency = Math.round(interaction.client.ws.ping);
    const totalUsers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const botAvatarURL = interaction.client.user.avatarURL();
    const botID = interaction.client.user.id;
    const botName = interaction.client.user.username;
    const botInviteLink = `https://discord.com/application-directory/${botID}`;

    const embed = new EmbedBuilder()
      .setTitle(`<:blaze:1311610677152186430>  **${botName}**`)
      .setColor('#7289da')
      .setThumbnail(botAvatarURL) // Set bot's avatar as thumbnail
      .addFields(
        {
          name: 'Bot Info',
          value: `
            > **Bot ID**: \`${botID}\`
            > **Invite Link**: [Click here](${botInviteLink})
            > **Uptime**: \`${uptime}\`
            > **Latency**: \`${apiLatency}ms\`
          `,
          inline: false,
        },
        {
          name: '<:strange:1311610511455944756>  **Creator Info**',
          value: `
            > **Creator**: <@1023977968562876536>
            > **Creator Tag**: [@strange.io](https://abhinesh.me)
          `,
          inline: false,
        }
      );
    if (!isDM) {
      embed.addFields(
        {
          name: '<:stats:1311609110818455612>  **Server Stats**',
          value: `
            > **Total Servers**: ${totalServers}
            > **Total Users**: ${totalUsers}
            > **Total Commands**: ${interaction.client.commands.size}
          `,
          inline: false,
        }
      );
    }
    const supportButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Join Support Server')
        .setEmoji({id: '1315321985554976809',name:'support'})
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/cnwSk9sUUt')
    );

    embed.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [supportButton],
      ephemeral: true,
    });
  },

  async executeText(message) {
    const isDM = !message.guild;
    const totalServers = message.client.guilds.cache.size;
    const uptime = formatUptime(process.uptime());
    const apiLatency = Math.round(message.client.ws.ping);
    const totalUsers = message.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const botAvatarURL = message.client.user.avatarURL();
    const botID = message.client.user.id;
    const botName = message.client.user.username;
    const botInviteLink = `https://discord.com/application-directory/${botID}`;

    const embed = new EmbedBuilder()
      .setTitle(`<:blaze:1311610677152186430>  **${botName}**`)
      .setColor('#7289da')
      .setThumbnail(botAvatarURL)
      .addFields(
        {
          name: 'Bot Info',
          value: `
            > **Bot ID**: \`${botID}\`
            > **Invite Link**: [Click here](${botInviteLink})
            > **Uptime**: \`${uptime}\`
            > **Latency**: \`${apiLatency}ms\`
          `,
          inline: false,
        },
        {
          name: '<:strange:1311610511455944756>  **Creator Info**',
          value: `
            > **Creator**: <@1023977968562876536>
            > **Creator Tag**: [@strange.io](https://abhineshh.netlify.app)
          `,
          inline: false,
        }
      );
    if (!isDM) {
      embed.addFields(
        {
          name: '<:stats:1311609110818455612>  **Server Stats**',
          value: `
            > **Total Servers**: ${totalServers}
            > **Total Users**: ${totalUsers}
            > **Total Commands**: ${message.client.commands.size}
          `,
          inline: false,
        }
      );
    }
    const supportButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Join Support Server')
        .setEmoji({id: '1315321985554976809',name:'support'})
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/cnwSk9sUUt')
    );
    embed.setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({
      embeds: [embed],
      components: [supportButton],
    });
  },
};
function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}
