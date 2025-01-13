const Canvas = require('canvas');
const CANVAS_CONFIG = require('../constants/canvas');
const THEMES = require('../constants/themes');


class CanvasHelpers {
    static drawBackground(ctx) {
        const { width, height } = CANVAS_CONFIG.dimensions;
        const colors = (THEMES.default && THEMES.default.background) || { start: '#000000', end: '#000000' };

        // Create main gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, colors.start);
        gradient.addColorStop(1, colors.end);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add subtle pattern
        for (let i = 0; i < width; i += 20) {
            for (let j = 0; j < height; j += 20) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
                ctx.fillRect(i, j, 10, 10);
            }
        }
    }

    static drawAvatar(ctx, avatar) {
        const { size, x, y, borderWidth, shadowBlur, shadowColor } = CANVAS_CONFIG.avatar;
        const borderColor = THEMES.default.border.primary;

        // Draw shadow
        ctx.save();
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        
        // Draw avatar with border
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2 + borderWidth, 0, Math.PI * 2);
        ctx.fillStyle = borderColor;
        ctx.fill();
        ctx.closePath();

        // Clip and draw avatar
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
    }

    static drawProgressBar(ctx, progress) {
        const { x, y, width, height, radius } = CANVAS_CONFIG.progressBar;
        const colors = THEMES.default.progress;

        // Draw background
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.fillStyle = colors.background;
        ctx.fill();

        // Draw progress
        const progressWidth = (width * progress);
        ctx.beginPath();
        ctx.roundRect(x, y, progressWidth, height, radius);
        ctx.fillStyle = colors.fill;
        ctx.fill();

        // Add shine effect
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    static drawText(ctx, data) {
        const { width } = CANVAS_CONFIG.dimensions;
        const { fonts } = CANVAS_CONFIG;
        const colors = THEMES.default.text;
        const padding = CANVAS_CONFIG.layout.padding;

        // Username and Level
        ctx.font = fonts.username;
        ctx.fillStyle = colors.primary;
        ctx.textAlign = 'left';
        ctx.fillText(data.username, 280, 150);

        ctx.font = fonts.level;
        ctx.fillStyle = colors.accent;
        ctx.textAlign = 'right';
        ctx.fillText(`LEVEL ${data.level}`, width - padding, 150);

        // Role
        ctx.font = fonts.stats;
        ctx.fillStyle = colors.secondary;
        ctx.textAlign = 'left';
        ctx.fillText(data.currentRole, 280, 190);

        // Progress text
        ctx.font = fonts.stats;
        ctx.fillStyle = colors.tertiary;
        ctx.textAlign = 'left';
        const progressText = `${data.messages} / ${data.messagesToNextLevel} messages`;
        ctx.fillText(progressText, 280, 260);

        // Server name
        ctx.font = fonts.footer;
        ctx.fillStyle = colors.tertiary;
        ctx.textAlign = 'right';
        ctx.fillText(data.guildName, width - padding, 350);
    }

    static addGlowEffects(ctx) {
        const { width, height } = CANVAS_CONFIG.dimensions;
        
        // Add subtle glow at the corners
        const cornerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
        cornerGlow.addColorStop(0, 'rgba(114, 137, 218, 0.1)');
        cornerGlow.addColorStop(1, 'rgba(114, 137, 218, 0)');
        
        ctx.fillStyle = cornerGlow;
        ctx.fillRect(0, 0, width, height);
    }
}

module.exports = CanvasHelpers;