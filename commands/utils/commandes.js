const {DiscordCommand} = require('../../system/structures/command');
const {capitalize} = require('lodash');
const {SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder} = require('discord.js');

const Commandes = new DiscordCommand({
  name: 'commandes',
  description: 'Donne des informations sur mes commandes.',
  category: '⚙️ Autres',
  run: async (client, interaction) => {
    let selectedCommand = interaction.options.getString('commande');

    const commands = client.commands.filter((command) => !command.ownerOnly);

    if (!selectedCommand) {
      const parsedCommands = {};
      for (const {name, category} of commands) {
        if (!parsedCommands[category]) {
          parsedCommands[category] = [];
        };
        parsedCommands[category].push(name);
      };

      const commandsListEmbed = client.baseEmbed()
          .setTitle('📚 Liste de mes commandes')
          .setFields(...Object.keys(parsedCommands).sort((a, b) => parsedCommands[b].length - parsedCommands[a].length).map((parsedCommandCategory) => {
            return {
              name: `**${parsedCommandCategory} (${parsedCommands[parsedCommandCategory].length})**`,
              value: parsedCommands[parsedCommandCategory].sort().map((commandName) => `\`${commandName}\``).join(', '),
              inline: true,
            };
          }));
      return await interaction.sendEmbed(commandsListEmbed);
    };

    const selectedCommands = commands.filter((command) => client.compareText(command.name, selectedCommand)).slice(0, 20);

    if (!selectedCommands.length) {
      return await interaction.sendEmbed(client.createEmbed('Aucune commande n\'a été trouvée avec cette recherche...', {emote: 'hein', type: 'warning'}));
    } else if (selectedCommands.length === 1) {
      selectedCommand = selectedCommands[0];
    } else {
      const selection = await client.createSelection(interaction, selectedCommands.map((command, i) => {
        return {label: capitalize(command.name), emoji: command.category.split(' ')[0], value: String(i)};
      }));
      if (selection === 'cancel') return;
      selectedCommand = selectedCommands[selection];
    };

    const {name, description, category, data} = selectedCommand;

    const commandEmbed = client.baseEmbed()
        .setTitle(`❓ Informations sur ma commande \`${name}\``)
        .setDescription(`> *${description}*\n- Catégorie: **${category}**`);

    if (data.options.length) {
      if (data.options[0] instanceof SlashCommandSubcommandGroupBuilder) {
        commandEmbed.data.description += `\n\n**Groupes de sous-commandes (${data.options.length})**\n` + data.options.map((SubcommandGroupOption) => `- \`${SubcommandGroupOption.name}\` (/${name} ${SubcommandGroupOption.name}): **${SubcommandGroupOption.description}**\n${SubcommandGroupOption.options.map((SubcommandOption) => `  - \`${SubcommandOption.name}\` (/${name} ${SubcommandGroupOption.name} ${SubcommandOption.name}): **${SubcommandOption.description}**`).join('\n')}`).join('\n');
      } else if (data.options[0] instanceof SlashCommandSubcommandBuilder) {
        commandEmbed.data.description += `\n\n**Sous-commandes (${data.options.length})**\n` + data.options.map((SubcommandOption) => `- \`${SubcommandOption.name}\` (/${name} ${SubcommandOption.name}): **${SubcommandOption.description}**`).join('\n');
      };
    };

    return await interaction.sendEmbed(commandEmbed);
  },
});

Commandes.data
    .addStringOption((option) => option.setName('commande').setDescription('🆔 • Le nom de la commande que vous souhaitez voir (Par défaut la liste).'));

module.exports = Commandes;
