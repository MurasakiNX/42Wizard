const Event = require('../system/structures/event');
const {Events} = require('discord.js');

const interactionCreate = new Event({
  name: Events.InteractionCreate,
  run: async (client, interaction) => {
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id || 'DM';

    interaction.userAvatar = client.getAvatar(userId);
    interaction.displayName = interaction.user.globalName || interaction.user.username;

    interaction.sendEmbed = async (embed) => {
      return await interaction.editReply({embeds: [embed]}).catch(() => {});
    };

    if (interaction.user.bot) return;
    else if (interaction.isStringSelectMenu() || interaction.isButton()) {
      switch (interaction.customId) {
        case 'selection':
        case 'previous_page':
        case 'next_page':
        case 'select_page':
        case 'previous_level':
        case 'next_level':
        case 'select_level':
        case 'delete': {
          await client.pagesSystemManager(interaction);
          break;
        };
      };
      return;
    } else if (!interaction.isChatInputCommand()) return;

    const selectedCommand = client.commands.find((command) => command.name === interaction.commandName);
    if (!selectedCommand) return;

    const {dmOnly, ownerOnly, ephemeral} = selectedCommand;
    await interaction.deferReply({ephemeral});

    const subcommandGroup = interaction.options._group;
    const subcommand = interaction.options._subcommand;
    const commandName = `${selectedCommand.name}${subcommandGroup ? ' ' + subcommandGroup : ''}${subcommand ? ' ' + subcommand : ''}`;
    const cooldownName = commandName.split(' ').join('_');

    if (guildId !== 'DM' && dmOnly) {
      return await interaction.sendEmbed(client.createEmbed('Pour des raisons de sécurité, je ne peux pas vous laisser effectuer cette commande en dehors des messages privés...', {emote: 'engarde', type: 'warning'}));
    } else if (!client.isClientOwner(interaction.user.id)) {
      if (ownerOnly) {
        return await interaction.sendEmbed(client.createEmbed('Cette commande ne vous est d\'aucune utilité...', {emote: 'engarde', type: 'warning'}));
      } else if (client.maintenance) {
        return await interaction.sendEmbed(client.createEmbed('Une opération de maintenance est en cours, veuillez patienter que celle-ci se termine, je suis sincèrement désolé pour la gêne occasionnée...', {emote: 'engarde', type: 'warning'}));
      };
    };

    const userCooldown = client.selectIntoDatabase('Cooldowns/Discord', {commandName: cooldownName, userId});

    if (userCooldown && !userCooldown.finished) {
      return await interaction.sendEmbed(client.createEmbed('Vous êtes déjà en train d\'utiliser cette commande, veuillez patienter que celle-ci se termine avant de recommencer.', {emote: 'sourire', type: 'warning'}));
    };

    if (userCooldown) {
      client.updateIntoDatabase('Cooldowns/Discord', {finished: 0}, {commandName: cooldownName, userId});
    } else {
      client.insertIntoDatabase('Cooldowns/Discord', {
        commandName: cooldownName,
        userId,
        finished: 0,
      });
    };

    await selectedCommand.run(client, interaction).catch(async (err) => {
      console.error(`❌ [DISCORD] Erreur avec la commande ${commandName}: ${err}.`);
      return await interaction.sendEmbed(client.createEmbed(`Je ne suis malheureusement pas parvenue à exécuter complètement la commande \`${commandName}\`...`, {emote: 'boude', type: 'warning'}));
    });

    client.updateIntoDatabase('Cooldowns/Discord', {finished: 1}, {commandName: cooldownName, userId});
    return;
  },
});

module.exports = interactionCreate;
