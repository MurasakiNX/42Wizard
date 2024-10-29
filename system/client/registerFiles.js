const getFiles = require('../getFiles');

/**
 * Enregistre les commandes et les événements du bot.
 * @param {DiscordClient} client Le client Discord.
 */
async function registerFiles(client) {
  // Discord
  const discordCommandFiles = getFiles('./commands');
  for (const commandFile of discordCommandFiles) {
    const command = require(commandFile);
    client.commands.push(command);
    console.log(`✅ [DISCORD] Commande ${command.name} chargée !`);
  };

  const discordEventFiles = getFiles('./events');
  for (const eventFile of discordEventFiles) {
    const event = require(eventFile);
    console.log(`✅ [DISCORD] Event ${event.name} chargé !`);
    if (event.once) {
      client.once(event.name, async (...args) => await event.run(client, ...args));
    } else {
      client.on(event.name, async (...args) => await event.run(client, ...args));
    };
  };
};

module.exports = registerFiles;
