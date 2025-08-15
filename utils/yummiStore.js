// utils/yummiStore.js
const yummiListeners = new Map();  // guildId => { userId, channelId }
const yummiCooldowns = new Map();  // userId => timestamp

module.exports = { yummiListeners, yummiCooldowns };
