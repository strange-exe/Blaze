const Canvas = require('canvas');

class ImageLoader {
    static async loadUserAvatar(user) {
        try {
            const avatarURL = user.displayAvatarURL({ 
                extension: 'png', 
                size: 1024,
                forceStatic: true 
            });
            return await Canvas.loadImage(avatarURL);
        } catch (error) {
            console.error('Error loading avatar:', error);
            throw new Error('Failed to load user avatar');
        }
    }
}

module.exports = ImageLoader;