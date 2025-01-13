const Canvas = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const CanvasHelpers = require('../utils/canvasHelpers');
const ImageLoader = require('../utils/imageLoader');
const CANVAS_CONFIG = require('../constants/canvas');

class CanvasService {
    async generateRankImage(user, level, messages, messagesToNextLevel, currentRole, guildName) {
        const canvas = Canvas.createCanvas(
            CANVAS_CONFIG.dimensions.width,
            CANVAS_CONFIG.dimensions.height
        );
        const ctx = canvas.getContext('2d');

        try {
            const avatar = await ImageLoader.loadUserAvatar(user);
            const progress = messagesToNextLevel === 'Maxed Out' 
                ? 1 
                : messages / messagesToNextLevel;

            const data = {
                username: user.username,
                level,
                messages,
                messagesToNextLevel,
                currentRole,
                guildName,
                progress
            };

            // Apply rendering steps
            CanvasHelpers.drawBackground(ctx);
            CanvasHelpers.addGlowEffects(ctx);
            CanvasHelpers.drawAvatar(ctx, avatar);
            CanvasHelpers.drawProgressBar(ctx, progress);
            CanvasHelpers.drawText(ctx, data);

            return new AttachmentBuilder(canvas.toBuffer(), { 
                name: 'rank-card.png',
                description: `Rank card for ${user.tag}`
            });
        } catch (error) {
            console.error('Canvas generation error:', error);
            throw new Error('Failed to generate rank image');
        }
    }
}

module.exports = new CanvasService();