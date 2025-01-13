const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levelroles')
        .setDescription('Manage level roles for the leveling system.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new level role')
                .addIntegerOption(option =>
                    option
                        .setName('level')
                        .setDescription('The level required to get this role')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('rolename')
                        .setDescription('The name of the role to assign')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('permissions')
                        .setDescription('Comma-separated permissions for the role (e.g., VIEW_CHANNEL,SEND_MESSAGES)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a level role')
                .addIntegerOption(option =>
                    option
                        .setName('level')
                        .setDescription('The level associated with the role to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all level roles')
        ),

    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const level = interaction.options.getInteger('level');
        const roleName = interaction.options.getString('rolename');
        const permissionsString = interaction.options.getString('permissions');

        const LEVELS = require('../events/leveling').LEVELS; // Adjust this path if needed

        switch (subCommand) {
            case 'add':
                if (!LEVELS[level]) {
                    const permissions = permissionsString
                        ? permissionsString.split(',').map(perm => perm.trim())
                        : ['VIEW_CHANNEL', 'SEND_MESSAGES'];

                    LEVELS[level] = {
                        roleName: roleName,
                        permissions: permissions,
                    };

                    await interaction.reply(`Added level role: **${roleName}** for level **${level}**.`);
                } else {
                    await interaction.reply({
                        content: `A role is already set for level ${level}. Use \`/levelroles remove\` to remove it first.`,
                        ephemeral: true,
                    });
                }
                break;

            case 'remove':
                if (LEVELS[level]) {
                    delete LEVELS[level];
                    await interaction.reply(`Removed level role for level **${level}**.`);
                } else {
                    await interaction.reply({
                        content: `No role is set for level ${level}.`,
                        ephemeral: true,
                    });
                }
                break;

            case 'list':
                if (Object.keys(LEVELS).length === 0) {
                    await interaction.reply('No level roles are set.');
                } else {
                    const rolesList = Object.entries(LEVELS)
                        .map(([lvl, info]) => `Level **${lvl}**: Role **${info.roleName}**, Permissions: ${info.permissions.join(', ')}`)
                        .join('\n');

                    await interaction.reply(`Here are the current level roles:\n${rolesList}`);
                }
                break;

            default:
                await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true });
        }
    },
};
