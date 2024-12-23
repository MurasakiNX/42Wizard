const Event = require('../system/structures/event');
const {Events} = require('discord.js');

const interactionCreate = new Event({
  name: Events.InteractionCreate,
  run: async (client, interaction) => {
    const userId = interaction.user.id;

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

    const {ownerOnly, ephemeral} = selectedCommand;
    await interaction.deferReply({ephemeral});

    const subcommandGroup = interaction.options._group;
    const subcommand = interaction.options._subcommand;
    const commandName = `${selectedCommand.name}${subcommandGroup ? ' ' + subcommandGroup : ''}${subcommand ? ' ' + subcommand : ''}`;
    const cooldownName = commandName.split(' ').join('_');

    if (!client.isClientOwner(userId)) {
      if (ownerOnly) {
        return await interaction.sendEmbed(client.createEmbed('This command is not available to you and will be of absolutely useless to you....', {emote: 'zero', type: 'warning'}));
      } else if (client.maintenance) {
        return await interaction.sendEmbed(client.createEmbed('There is currently a maintenance operation on the BOT, please wait for it to be finished (Sorry for the inconvenience)...', {emote: 'zero', type: 'warning'}));
      };
    };

    if (interaction.commandName !== 'link' && !client.selectIntoDatabase('42/Sync', {discordUserId: userId, verified: 1})) {
      return await interaction.sendEmbed(client.createEmbed('You must have linked your 42 account with your Discord account to use commands... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
    };

    const userCooldown = client.selectIntoDatabase('Cooldowns/Discord', {commandName: cooldownName, userId});

    if (userCooldown && !userCooldown.finished) {
      return await interaction.sendEmbed(client.createEmbed('You are already using this command, please wait that it is finished.', {emote: 'zero', type: 'warning'}));
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
      return await interaction.sendEmbed(client.createEmbed(`I was not able to run the \`${commandName}\` command...`, {emote: 'minus_fortytwo', type: 'warning'}));
    });

    client.updateIntoDatabase('Cooldowns/Discord', {finished: 1}, {commandName: cooldownName, userId});
    return;
  },
});

module.exports = interactionCreate;
