const { SlashCommandBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('randomfact')
    .setDescription('Get a random fun fact'),

  aliases: ['fact', 'rf', 'randomf', 'rfact'],

  async executeText(message) {
    try {
      // Fetch a random fact from Useless Facts API
      const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

      const data = await response.json();

      if (data && data.text) {
        message.reply(`**Did you know?**\n${data.text}`);
      } else {
        throw new Error('Invalid response structure from API.');
      }
    } catch (error) {
      console.error('Error fetching random fact:', error);
      message.reply('Sorry, I couldn’t fetch a fun fact at this time. Please try again later!');
    }
  },

  async execute(interaction) {
    try {
      // Fetch a random fact from Useless Facts API
      const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

      const data = await response.json();

      if (data && data.text) {
        await interaction.reply(`**Did you know?**\n${data.text}`);
      } else {
        throw new Error('Invalid response structure from API.');
      }
    } catch (error) {
      console.error('Error fetching random fact:', error);
      await interaction.reply('Sorry, I couldn’t fetch a fun fact at this time. Please try again later!');
    }
  },
};
