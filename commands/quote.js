const { SlashCommandBuilder } = require('discord.js');
const { OpenAI } = require('openai');  // Correct import

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: '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', // Replace with your OpenAI API key
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a motivational quote'),
  aliases: ['q'],

  async executeText(message) {
    try {
      const quote = await generateQuote();
      message.reply(`_\`"${quote}"\`_\n-# quotes by **[Abhinesh](https://gen-quotes.netlify.app)**`);
    } catch (error) {
      console.error('Error generating quote:', error);
      message.reply('Oops! Unable to generate a quote at the moment. Please try again later.');
    }
  },

  async execute(interaction) {
    try {
      const quote = await generateQuote();
      await interaction.reply(`_\`"${quote}"\`_\n-# quotes by **[Abhinesh](https://gen-quotes.netlify.app)**`);
    } catch (error) {
      console.error('Error generating quote:', error);
      await interaction.reply('Oops! Unable to generate a quote at the moment. Please try again later.');
    }
  },
};


// Helper function to generate a quote using OpenAI
async function generateQuote() {
  try {
    const completion = openai.chat.completions.create({
      model: "GPT-4o mini",
      store: true,
      messages: [
        {"role": "user", "content": "write a motivational quote"},
      ],
    });

    // Extract the quote from the response
    const quote = completion.choices[0].message.content.trim();
    if (!quote) {
      throw new Error('No quote generated');
    }
    return quote;
  } catch (error) {
    console.error('Error generating quote with OpenAI:', error);
    throw new Error('Failed to generate quote');
  }
}
