const Event = require('../system/structures/event');
const {Events, REST, Routes} = require('discord.js');
const initEmotes = require('../system/client/discord/initEmotes');
const getFiles = require('../system/getFiles');
const initAPI = require('../system/api/initAPI');

const Ready = new Event({
  name: Events.ClientReady,
  once: true,
  run: async (client) => {
    client.updateIntoDatabase('Cooldowns/Discord', {finished: 1}, {finished: 0});
    client.deleteIntoDatabase('Cooldowns/Discord', {finished: 1});

    const rest = new REST({version: '10'}).setToken(client.token);
    client.setPresence(client.maintenance ? '⚠️ Currently in maintenace ⚠️' : 'help 42 Paris students');

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: client.commands.filter((command) => !command.ownerOnly).map((command) => command.data.toJSON()),
    });

    client.userAvatar = client.getAvatar(client.user.id);

    await initEmotes(client);
    setInterval(async () => await initEmotes(client), 1800000);

    // Intervals
    const executeInterval = async (intervalFunc, client, delay) => {
      await intervalFunc(client);
      setTimeout(() => executeInterval(intervalFunc, client, delay), delay);
    };

    const intervalFiles = getFiles('./system/client/intervals');
    for (const intervalFile of intervalFiles) {
      const interval = require(intervalFile);
      executeInterval(interval, client, 500);
    };

    await initAPI(client);
    console.log(`✅ [DISCORD] ${client.user.tag} est actuellement en ligne !`);
  },
});

module.exports = Ready;
