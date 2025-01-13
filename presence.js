module.exports.setBotPresence = async (client, defaultPrefix) => {
    try {
        await client.user.setPresence({
            activities: [{ name: `Blaze | ${defaultPrefix}help`, type: 2 }],
            status: 'idle',
        });
        console.log('Presence updated successfully.');
    } catch (error) {
        console.error('Error updating presence:', error);
    }
};
