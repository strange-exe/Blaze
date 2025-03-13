const { SlashCommandBuilder } = require('discord.js');

// Dynamically import 'node-fetch' to support CommonJS
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a random quote'),
  aliases: ['q'],
  async executeText(message) {
    try {
      // Fetch the quote
      const response = await fetch('https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json');
      const rawText = await response.text();
      console.log('Raw Response:', rawText); // Debugging

      // Fix malformed JSON by escaping single quotes
      const sanitizedText = rawText.replace(/\\'/g, "'").replace(/'/g, "\\'");

      let data;
      try {
        data = JSON.parse(sanitizedText); // Attempt to parse sanitized JSON
      } catch (error) {
        console.error('Still Malformed JSON:', sanitizedText);
        throw new Error('Received malformed JSON from the API.');
      }

      // Extract quote and author
      const quote = data.quoteText?.trim() || 'No quote available at the moment.';
      const author = data.quoteAuthor?.trim() || 'Abhinesh';

      // Reply with the quote
      message.reply(`_\`"${quote}"\`_ - ${author}\n-# quotes by **[Abhinesh](https://gen-quotes.netlify.app)**`);
    } catch (error) {
      console.error('Error fetching quote:', error);
      message.reply('Oops! No quote available at the moment , kindly try again after some time');
    }
  },

  async execute(interaction) {
    try {
      // Fetch the quote
      const response = await fetch('https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json');
      const rawText = await response.text();
      console.log('Raw Response:', rawText); // Debugging

      // Fix malformed JSON by escaping single quotes
      const sanitizedText = rawText.replace(/\\'/g, "'").replace(/'/g, "\\'");

      let data;
      try {
        data = JSON.parse(sanitizedText); // Attempt to parse sanitized JSON
      } catch (error) {
        console.error('Still Malformed JSON:', sanitizedText);
        throw new Error('Received malformed JSON from the API.');
      }

      // Extract quote and author
      const quote = data.quoteText?.trim() || 'No quote available at the moment.';
      const author = data.quoteAuthor?.trim() || 'Abhinesh';

      // Reply with the quote
      await interaction.reply(`_\`"${quote}"\`_ - ${author}\n-# quotes by **[Abhinesh](https://gen-quotes.netlify.app)**`);
    } catch (error) {
      console.error('Error fetching quote:', error);
      await interaction.reply('Oops! No quote available at the moment , kindly try again after some time');
    }
  },
};
