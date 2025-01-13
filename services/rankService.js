const { LEVELS } = require('../constants/levels');
const { pool } = require('../utils/db');

class RankService {
    /**
     * Fetches the stats of a user in a specific guild.
     * @param {string} userId - The ID of the user.
     * @param {string} guildId - The ID of the guild.
     * @returns {Promise<Object|null>} - User stats or null if not found.
     */
    async getUserStats(userId, guildId) {
        try {
            const [userRows] = await pool.query(
                `SELECT messages, level FROM user_levels WHERE user_id = ? AND guild_id = ?`,
                [userId, guildId]
            );
            return userRows[0] || null;
        } catch (error) {
            console.error(`Error fetching stats for user: ${userId}, guild: ${guildId}`, error);
            throw new Error('Unable to fetch user stats');
        }
    }

    /**
     * Retrieves the role name for a given level.
     * Returns the role of the highest level below or equal to the user's level.
     * @param {number} level - The user's current level.
     * @returns {string} - The role name for the current or nearest lower level.
     */
    getRoleName(level) {
        const levels = Object.keys(LEVELS).map(Number).sort((a, b) => a - b);
        const closestLevel = levels.reduce((prev, curr) => (curr <= level ? curr : prev), 0);
        return LEVELS[closestLevel]?.roleName || 'None';
    }

    /**
     * Determines the next level and its required messages.
     * @param {number} currentLevel - The user's current level.
     * @param {number} messages - The user's current message count.
     * @returns {Object} - The next level details or null if maxed out.
     */
    getNextLevelDetails(currentLevel) {
        const nextLevel = currentLevel + 1;
        const requiredMessages = nextLevel * 10;
        return {
            nextLevel,
            messagesToNext: Math.max(0, requiredMessages),
        };
    }

    /**
     * Updates the user's level based on message count.
     * @param {string} userId - The ID of the user.
     * @param {string} guildId - The ID of the guild.
     * @param {number} messages - The user's total messages.
     * @returns {Promise<number>} - The new level.
     */
    async updateUserLevel(userId, guildId, messages) {
        const newLevel = Math.floor(messages / 10);

        try {
            await pool.query(
                `UPDATE user_levels SET level = ? WHERE user_id = ? AND guild_id = ?`,
                [newLevel, userId, guildId]
            );
            return newLevel;
        } catch (error) {
            console.error(`Error updating level for user: ${userId}, guild: ${guildId}`, error);
            throw new Error('Unable to update user level');
        }
    }
}

module.exports = new RankService();
