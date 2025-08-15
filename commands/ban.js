const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const BOT_OWNER_ID = "1023977968562876536"; // Your ID

module.exports = {
    name: "ban",
    description: "Bans a user from the server. (Looks real but doesn't actually ban)",
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bans a user from the server.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to ban")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the ban")
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
        }

        const target = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "Violation of server rules.";
        const executor = interaction.user; // The person running the command

        if (target.id === BOT_OWNER_ID) {
            // If they try to ban the bot owner, ban them instead
            await sendFakeBan(interaction, executor, "Attempted to ban the bot owner.");
            return interaction.reply({ content: `🚨 **You attempted to ban the bot owner!** You have been banned instead.`, ephemeral: true });
        }

        await sendFakeBan(interaction, target, reason);
    },

    async executeText(message, args) {
        if (!message.guild) {
            return message.reply("❌ This command can only be used in a server.");
        }

        const target = message.mentions.users.first();
        const reason = args.slice(1).join(" ") || "Violation of server rules.";
        const executor = message.author; // The person running the command

        if (!target) {
            return message.reply("❌ You must mention a user to ban.");
        }

        if (target.id === BOT_OWNER_ID) {
            // If they try to ban the bot owner, ban them instead
            await sendFakeBan(message, executor, "Attempted to ban the bot owner.");
            return message.reply("🚨 **You attempted to ban the bot owner!** You have been banned instead.");
        }

        await sendFakeBan(message, target, reason);
    }
};

async function sendFakeBan(context, target, reason) {
    if (!context.guild) return; // Prevent errors in DMs

    const embed = new EmbedBuilder()
        .setTitle("🔨 User Banned")
        .setDescription(`🚨 **${target.tag}** has been permanently banned from the server!`)
        .addFields({ name: "Reason", value: reason, inline: false })
        .setColor("Red")
        .setFooter({ text: "Server Moderation Team" })
        .setTimestamp();

    // Send the fake ban message
    if (context.reply) {
        await context.reply({ embeds: [embed] });
    } else {
        await context.channel.send({ embeds: [embed] });
    }

    // Optionally DM the user
    try {
        await target.send(`🔨 **You have been banned from ${context.guild.name}!**\nReason: ${reason}\nIf you believe this was a mistake, contact the admins.`);
    } catch (err) {
        const errorEmbed = new EmbedBuilder()
            .setTitle("⚠️ DM Failure")
            .setDescription(`Could not DM **${target.tag}**. They may have DMs closed.`)
            .setColor("Yellow")
            .setTimestamp();

        if (context.channel) {
            await context.channel.send({ embeds: [errorEmbed] });
        }
    }

    // Fake log for realism
    const logChannel = context.guild.channels.cache.find(ch => ch.name.includes("log"));
    if (logChannel) {
        await logChannel.send({ embeds: [embed] });
    }
}
