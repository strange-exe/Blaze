const { SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('Refresh all commands without restarting the bot.')
    .addStringOption(option =>
      option.setName('scope')
        .setDescription('Where to register commands: "global" or "guild"')
        .setRequired(true)
        .addChoices(
          { name: 'Global', value: 'global' },
          { name: 'Guild', value: 'guild' }
        )),

  // Shared function to register commands
  async registerCommands(interaction, slashCommands, scope, guildId) {
    const token = require('../config.json').token;
    const rest = new REST({ version: '10' }).setToken(token);

    try {
      if (scope === 'guild') {
        if (!guildId) {
          return interaction.reply({ content: 'Guild ID is required for guild-specific commands.', ephemeral: true });
        }

        // Clear global commands if switching to guild-specific
        await rest.put(Routes.applicationCommands(interaction.client.user.id), { body: [] });

        // Register commands only for the guild
        await rest.put(Routes.applicationGuildCommands(interaction.client.user.id, guildId), { body: slashCommands });

        await interaction.reply({
          content: `${slashCommands.length} commands have been registered for this guild.`,
          ephemeral: true,
        });
      } else if (scope === 'global') {
        // Clear guild commands if switching to global
        if (guildId) {
          await rest.put(Routes.applicationGuildCommands(interaction.client.user.id, guildId), { body: [] });
        }

        // Register commands globally
        await rest.put(Routes.applicationCommands(interaction.client.user.id), { body: slashCommands });

        await interaction.reply({
          content: `${slashCommands.length} global commands have been registered.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('Error refreshing commands:', error);
      await interaction.reply({
        content: 'Failed to refresh commands. Check the console for details.',
        ephemeral: true,
      });
    }
  },

  // Slash command execution method
  async execute(interaction) {
    if (interaction.user.id !== '1023977968562876536') {
      return interaction.reply({
        content: 'Only the bot owner can use this command.',
        ephemeral: true,
      });
    }

    const scope = interaction.options.getString('scope');
    const guildId = interaction.guild?.id;
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    // Load all commands
    const slashCommands = [];
    let commandsCount = 0;

    for (const file of commandFiles) {
      delete require.cache[require.resolve(path.join(commandsPath, file))];
      const command = require(path.join(commandsPath, file));
      if (command.data) {
        interaction.client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
        commandsCount++;
      }
    }

    console.log(`Loaded ${commandsCount} commands.`);

    // Register commands based on the scope
    await this.registerCommands(interaction, slashCommands, scope, guildId);
  },

  // Prefix-based execution method (executeText)
  async executeText(message) {
    if (message.author.id !== '1023977968562876536') {
      return message.reply('Only the bot owner can use this command.');
    }

    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    // Load all commands
    const slashCommands = [];
    let commandsCount = 0;

    for (const file of commandFiles) {
      delete require.cache[require.resolve(path.join(commandsPath, file))];
      const command = require(path.join(commandsPath, file));
      if (command.data) {
        message.client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
        commandsCount++;
      }
    }

    console.log(`Loaded ${commandsCount} commands.`);

    // Register commands globally
    await this.registerCommands(message, slashCommands, 'global');
    await message.reply(`Reloaded ${commandsCount} commands successfully!`);
  },
};
