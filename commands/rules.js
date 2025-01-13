const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Displays the rules for Blaze\'s support server'),

  async executeSlash(interaction) {
    const guildName = interaction.guild?.name || 'this server';
    const totalMembers = interaction.guild?.memberCount || 'unknown';
    const ownerTag = '<@1023977968562876536>'; // Owner mention for Blaze
    const serverIcon = interaction.guild?.iconURL();

    const embed = new EmbedBuilder()
      .setTitle(`📜 Rules for ${guildName}`)
      .setColor('#FF4500')
      .setThumbnail(serverIcon || interaction.client.user.avatarURL())
      .setDescription(`Welcome to **${guildName}**! Please follow these rules to ensure a friendly and supportive environment for everyone.\n  
We currently have **${totalMembers} members** in our community.

**- __Be a Good Vibe Curator__** :star2: We’re here to make memories, not drama! Respect others, spread kindness, and help create a friendly atmosphere where everyone can feel welcome and included.

**- __No Spamming, Please__** :no_entry_sign: Spam belongs in cans, not in chat! Keep conversations flowing, and don’t flood the chat with repeated messages or unnecessary pings. Quality over quantity!

**- __Respect Boundaries__** :no_pedestrians: Keep it respectful—no hate speech, bullying, or harmful behavior. We’re all about building each other up, not tearing others down. Disagree? Do it respectfully!

**- __Stay on Topic, Adventurer!__** :dart: This isn’t a random wandering chat! Keep it relevant to the channel you’re in. Let’s make each conversation meaningful and fun—wandering off-topic is for treasure hunts, not chats.

**- __Your Privacy is Sacred__** :closed_lock_with_key: Don’t slip into someone’s DMs without permission. Be respectful of others’ boundaries, and always ask before sending a message. Trust is earned, not forced.

**- __Memes Are Love, but Not Spam__** :joy: We love a good meme, but don’t overdo it! Keep memes in the dedicated channels, and remember: one funny picture doesn’t mean the whole chat should be filled with them.

**- __Give Credit Where It’s Due__** :pencil: If you’re sharing someone else’s work or idea, make sure to credit them! Whether it's art, music, or a funny joke, always respect creators' rights.

**- __Use Channels Wisely__** :books: Each channel has a purpose! Don’t post random stuff in places meant for serious conversations. Keep it neat and follow the guidelines pinned in each channel!

**- __No NSFW or Explicit Content__** :no_entry_sign::underage: This is a community space for all ages! Keep it appropriate and free of explicit content. Any violations will be met with immediate action. Respect the vibe!

**- __Have Fun and Get Involved!__** :tada: We’re here to build friendships and enjoy each other’s company! Join events, start a conversation, or share your passions. The more you engage, the more fun you’ll have!

**- __The Golden Rule: Make This Place Awesome!__** :sparkles: You’re the heart of this server! Help make it a welcoming, fun, and supportive space for everyone. Share your ideas, create cool memories, and always leave a positive mark on our community. Let’s make this a place we’re all proud to call home!

By being part of this server, you agree to follow these rules. Violations may result in warnings, temporary mutes, or bans.
`
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
