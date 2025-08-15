const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');

// In-memory map of active yummi listeners
const { yummiListeners, yummiCooldowns } = require('../utils/yummiStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yummi')
        .setDescription('Enable or disable Yummi mode for a user.')
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('Enable Yummi mode for a user.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to target')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('scope')
                        .setDescription("Scope: 'this', 'global', channel mention, or channel ID")))
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('Disable Yummi mode in this server.')),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: `<a:tickred:1308331654367936522> Only <@${config.ownerID}> can use this command.`, ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'enable') {
            const targetUser = interaction.options.getUser('user');
            const scope = interaction.options.getString('scope') || 'this';

            const result = resolveYummiTarget({
                guild: interaction.guild,
                scope,
                currentChannelId: interaction.channel.id
            });

            if (result.error) {
                return interaction.reply({ content: result.error, ephemeral: true });
            }

            yummiListeners.set(interaction.guildId, {
                userId: targetUser.id,
                channelId: result.channelId
            });

            return interaction.reply(`<a:party_blob:1308331675838713857> Yummi mode activated for <@${targetUser.id}> in ${result.channelMention}!`);
        }

        if (subcommand === 'disable') {
            if (!yummiListeners.has(interaction.guildId)) {
                return interaction.reply('<:report:1371401333143375913> Yummi mode is not currently active in this server.');
            }

            yummiListeners.delete(interaction.guildId);
            return interaction.reply('<:success:1303370622411346020> Yummi mode has been disabled.');
        }
    },

    async executeText(message, args) {
        if (message.author.id !== config.ownerID) {
            return message.reply(`❌ Only <@${config.ownerID}> can use this command.`);
        }

        const sub = args[0]?.toLowerCase();
        if (sub === 'disable') {
            if (!yummiListeners.has(message.guild.id)) {
                return message.reply('<:report:1371401333143375913> Yummi mode is not currently active in this server.');
            }

            yummiListeners.delete(message.guild.id);
            return message.reply('<:success:1303370622411346020> Yummi mode has been disabled.');
        }

        const user = message.mentions.users.first() || (args[0] && await message.client.users.fetch(args[0]).catch(() => null));
        if (!user) return message.reply('Please mention a valid user or provide a user ID.');

        const scope = args[1] || 'this';

        const result = resolveYummiTarget({
            guild: message.guild,
            scope,
            currentChannelId: message.channel.id
        });

        if (result.error) {
            return message.reply(result.error);
        }

        yummiListeners.set(message.guild.id, {
            userId: user.id,
            channelId: result.channelId
        });

        return message.reply(`<a:party_blob:1308331675838713857> Yummi mode activated for <@${user.id}> in ${result.channelMention}!`);
    },
};

function resolveYummiTarget({ guild, scope, currentChannelId }) {
    let channelId = null;
    let channelMention = 'all channels';

    if (scope === 'global') {
        // Global scope (all channels)
    } else if (scope === 'this') {
        channelId = currentChannelId;
        channelMention = `<#${channelId}>`;
    } else if (/^<#!?(\d{17,19})>$/.test(scope)) {
        const match = scope.match(/^<#!?(\d{17,19})>$/);
        channelId = match[1];
        channelMention = `<#${channelId}>`;
    } else if (/^\d{17,19}$/.test(scope)) {
        channelId = scope;
        channelMention = `<#${channelId}>`;
    } else {
        return { error: "<:shrug:1371401371143901184> Scope must be 'this', 'global', a valid channel mention like #general, or a channel ID." };
    }

    if (channelId && !guild.channels.cache.has(channelId)) {
        return { error: "<a:tickred:1308331654367936522> That channel doesn't exist in this server." };
    }

    return { channelId, channelMention };
}
