const { pool } = require('../utils/db');
const { PermissionsBitField } = require('discord.js');
const cooldowns = new Map(); // Cooldown for level-up notifications
const roleCache = new Map(); // Cache for level roles

const LEVELS = {
    1: { roleName: 'Support Enthusiast', permissions: ['ViewChannel', 'SendMessages'] },
    5: { roleName: 'Community Builder', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
    10: { roleName: 'Problem Solver', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks'] },
    15: { roleName: 'Insightful Helper', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'] },
    20: { roleName: 'Knowledge Seeker', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'UseExternalEmojis'] },
    25: { roleName: 'Expert Advisor', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AddReactions'] },
    30: { roleName: 'Tech Guru', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'] },
    40: { roleName: 'Mentor', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels'] },
    50: { roleName: 'Legendary Supporter', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'Administrator'] },
    75: { roleName: 'Elite Visionary', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'KickMembers'] },
    100: { roleName: 'Mastermind', permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'BanMembers'] },
};

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const userId = message.author.id;
        const guildId = message.guild.id;

        try {
            // Cooldown Check (Enhancement 5)
            const cooldownTime = 10 * 1000; // 10 seconds
            if (cooldowns.has(userId)) {
                const expirationTime = cooldowns.get(userId) + cooldownTime;
                if (Date.now() < expirationTime) return;
            }
            cooldowns.set(userId, Date.now());

            // Fetch or update user data (Enhancements 1 & 2)
            const nextLevel = Math.floor((await updateUserData(userId, guildId)) / 10);

            if (nextLevel > 0) {
                const levelInfo = LEVELS[nextLevel];
                if (levelInfo) {
                    let role = await getRoleForLevel(message.guild, guildId, nextLevel, levelInfo);

                    if (!message.member.roles.cache.has(role.id)) {
                        await message.member.roles.add(role);

                        const progressBar = createProgressBar(nextLevel * 10, 100); // Enhancement 6
                        message.channel.send(
                            `${message.author}, you leveled up to **Level ${nextLevel}** and earned the "${levelInfo.roleName}" role!\nProgress: ${progressBar}`
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Error in leveling system:', error);

            // Notify the bot owner (Enhancement 5)
            const ownerId = '1023977968562876536';
            try {
                const owner = await message.client.users.fetch(ownerId);
                if (owner) {
                    owner.send(`Error in leveling system: ${error.message}`);
                }
            } catch (err) {
                console.error('Error notifying owner:', err);
            }
        }
    },
};

// Helper Functions

async function updateUserData(userId, guildId) {
    try {
        const [userRows] = await pool.query(
            `INSERT INTO user_levels (user_id, guild_id, messages, level)
             VALUES (?, ?, 1, 0)
             ON DUPLICATE KEY UPDATE
             messages = messages + 1,
             level = GREATEST(level, FLOOR(messages / 10))`,
            [userId, guildId]
        );
        return userRows.insertId ? 1 : userRows.messages + 1;
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error; // Propagate error to the main handler
    }
}

async function getRoleForLevel(guild, guildId, level, levelInfo) {
    if (!roleCache.has(guildId)) {
        roleCache.set(guildId, new Map());
    }

    const cachedRoleId = roleCache.get(guildId).get(level);
    if (cachedRoleId) return guild.roles.cache.get(cachedRoleId);

    const resolvedPermissions = levelInfo.permissions.map((perm) => PermissionsBitField.Flags[perm]);
    let role;

    try {
        role = await guild.roles.create({
            name: levelInfo.roleName,
            permissions: resolvedPermissions,
            reason: `Level ${level} role for leveling system`,
        });

        roleCache.get(guildId).set(level, role.id);

        await pool.query(
            `INSERT INTO guild_roles (guild_id, level, role_id) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`,
            [guildId, level, role.id]
        );
    } catch (error) {
        console.error('Error creating or fetching role:', error);
        throw error; // Propagate error to the main handler
    }

    return role;
}

function createProgressBar(progress, total) {
    const percentage = Math.min(Math.max((progress / total) * 10, 0), 10);
    return '█'.repeat(percentage) + '░'.repeat(10 - percentage);
}
