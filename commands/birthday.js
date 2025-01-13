const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// List of random birthday messages
const birthdayMessages = [
    "Wishing you a day filled with happiness and a year filled with joy!",
    "Hope your day is as amazing as you are!",
    "May this year bring you lots of love, joy, and success!",
    "Happy Birthday! May all your wishes come true today and always!",
    "Cheers to another trip around the sun!"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Create a birthday poster for a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to create the birthday poster for')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Custom birthday message')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('target') || interaction.user;
            const customMessage = interaction.options.getString('message');
            const birthdayMessage = customMessage || birthdayMessages[Math.floor(Math.random() * birthdayMessages.length)];
            const poster = await generateBirthdayPoster(targetUser, birthdayMessage);
            await interaction.reply({ files: [poster] });
        } catch (error) {
            console.error('Error in birthday command:', error);
            await interaction.reply('Sorry, something went wrong while generating the birthday poster.');
        }
    }
};

async function generateBirthdayPoster(user, birthdayMessage) {
    const baseWidth = 1200; // Width for the poster
    const canvas = Canvas.createCanvas(baseWidth, 1600); // Increased height for better layout
    const ctx = canvas.getContext('2d');

    try {
        // Add gradient background first
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ff7f50'); // Orange
        gradient.addColorStop(1, '#ff1493'); // Pink
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill with gradient background

        // Fetch and draw the avatar with a festive frame
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });
        const response = await fetch(avatarURL);
        const buffer = await response.arrayBuffer();
        const avatar = await Canvas.loadImage(Buffer.from(buffer));

        // Center the avatar in a circular frame
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 400, 150, 0, Math.PI * 2); // Centered in the canvas
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, canvas.width / 2 - 150, 250, 300, 300); // Draw centered avatar
        ctx.restore();

        // Draw reduced number of confetti effects
        for (let i = 0; i < 100; i++) { // Reduced number of confetti pieces
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 20, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 70%)`; // Random colors
            ctx.fill();
        }

        // Add stylish borders with a subtle glow effect
        ctx.strokeStyle = '#FF6347'; // Tomato red color
        ctx.lineWidth = 20;
        ctx.shadowColor = 'rgba(255, 99, 71, 0.6)';
        ctx.shadowBlur = 15;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80); // Outer border
        ctx.shadowBlur = 0;
        ctx.lineWidth = 10;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120); // Inner border

        // Add the "Happy Birthday!" text with a bold, festive font
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 120px "Arial"'; // Increased font size
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF'; // White text
        ctx.fillText('Happy Birthday!', canvas.width / 2, 150); // Adjusted the vertical position
        ctx.restore();

        // Create a background box for the birthday message with gradient and rounded corners
        const messageBoxRadius = 20;
        const messageLines = splitTextToFit(birthdayMessage, canvas.width - 100, ctx, '50px "Arial"');
        const messageBoxHeight = 50 + messageLines.length * 55; // Dynamic height based on message length

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.moveTo(50, 600); // Moved down to avoid overlap with avatar
        ctx.lineTo(canvas.width - 50, 600);
        ctx.quadraticCurveTo(canvas.width - 20, 600, canvas.width - 20, 630); // Round corners
        ctx.lineTo(canvas.width - 20, 630 + messageBoxHeight - 40);
        ctx.quadraticCurveTo(canvas.width - 20, 630 + messageBoxHeight, canvas.width - 50, 630 + messageBoxHeight);
        ctx.lineTo(50, 630 + messageBoxHeight);
        ctx.quadraticCurveTo(20, 630 + messageBoxHeight, 20, 630 + messageBoxHeight - 40);
        ctx.lineTo(20, 630);
        ctx.quadraticCurveTo(20, 600, 50, 600);
        ctx.closePath();
        ctx.fill();

        // Add the birthday message with dynamic line break handling
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 50px "Arial"';
        ctx.fillStyle = '#FFD700'; // Gold color for message text

        const messageY = 650; // Adjusted to create space between the message box and avatar
        messageLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, messageY + (index * 55)); // Adjust line spacing
        });
        ctx.restore();

        // Display the user's name with a stylish font and effect
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 80px "Arial"';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(user.displayName, canvas.width / 2, canvas.height - 250);
        ctx.restore();

        // Return the final poster as an attachment
        return new AttachmentBuilder(canvas.toBuffer(), { name: 'birthday-poster.png' });
    } catch (error) {
        console.error('Error generating poster:', error);
        throw new Error('Failed to generate birthday poster');
    }
}

// Helper function to split the text into lines that fit within the width
function splitTextToFit(text, maxWidth, context, font) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    context.font = font;

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = context.measureText(testLine).width;

        if (testWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}