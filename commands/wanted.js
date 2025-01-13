const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wanted')
    .setDescription('Create a wanted poster for a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to create the wanted poster for')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reward')
        .setDescription('The reward amount between ₹500 - ₹50,00,000')
        .setRequired(false)),
    aliases: ['poster'],
  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('target') || interaction.user;
      const reward = interaction.options.getString('reward') || getRandomReward();
      const poster = await generateWantedPoster(targetUser, reward);
      await interaction.reply({ files: [poster] });
    } catch (error) {
      console.error('Error in wanted command:', error);
      await interaction.reply('Sorry, something went wrong while generating the wanted poster.');
    }
  },

  async executeText(message) {
    try {
      const targetUser = message.mentions.users.first() || message.author;
      const reward = message.content.split(' ').slice(2).join(' ') || getRandomReward();
      const poster = await generateWantedPoster(targetUser, reward);
      await message.reply({ files: [poster] });
    } catch (error) {
      console.error('Error in wanted command:', error);
      await message.reply('Sorry, something went wrong while generating the wanted poster.');
    }
  }
};

function getRandomReward() {
  const randomReward = Math.floor(Math.random() * 49500000) + 500; 
  return `₹${randomReward.toLocaleString()}`;
}

async function generateWantedPoster(user, reward) {
  const canvas = Canvas.createCanvas(1200, 1600);  // Increased canvas width and height
  const ctx = canvas.getContext('2d');

  try {
    // Fetch and draw the avatar
    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });
    const response = await fetch(avatarURL);
    const buffer = await response.arrayBuffer();
    const avatar = await Canvas.loadImage(Buffer.from(buffer));

    // Draw avatar as background
    ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

    // Add sepia overlay
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#d4b483';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // Add vintage paper texture
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 3000; i++) {  // More texture points for better effect
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      );
    }
    ctx.globalAlpha = 1;

    // Add vignette effect
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 1.5
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw borders
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 30;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Draw "WANTED" text
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;

    // Text outline
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 20;
    ctx.font = 'bold 150px "Times New Roman"';  // Reduced font size for better fit
    ctx.strokeText('WANTED', canvas.width / 2, 200);

    // Main text
    ctx.fillStyle = '#FF0000';
    ctx.fillText('WANTED', canvas.width / 2, 200);
    ctx.restore();

    // Draw display name
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.font = 'bold 80px "Times New Roman"';  // Reduced font size for display name
    ctx.fillStyle = '#FFD700';
    ctx.fillText(user.displayName, canvas.width / 2, canvas.height - 350);  // Adjusted for new size

    // Draw "DEAD OR ALIVE"
    ctx.font = 'bold 100px "Times New Roman"';  // Adjusted font size for "DEAD OR ALIVE"
    ctx.fillText('DEAD OR ALIVE', canvas.width / 2, canvas.height - 250);

    // Draw reward text with dynamic reward amount
    ctx.font = 'bold 80px "Times New Roman"';  // Reduced font size for reward text
    ctx.fillText(`REWARD: ${reward}`, canvas.width / 2, canvas.height - 150);
    ctx.restore();

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'wanted-poster.png' });
  } catch (error) {
    console.error('Error generating poster:', error);
    throw new Error('Failed to generate wanted poster');
  }
}
