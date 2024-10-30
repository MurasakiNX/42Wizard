const {deburr} = require('lodash');
const {selectAllIntoDatabase, selectIntoDatabase, insertIntoDatabase, updateIntoDatabase, deleteIntoDatabase} = require('../../ClientManager');

/**
 * Initialise les fonctions globales du bot.
 * @param {DiscordClient} client Le client Discord.
 */
async function functions(client) {
    // Databases
    client.selectAllIntoDatabase = selectAllIntoDatabase;
    client.selectIntoDatabase = selectIntoDatabase;
    client.insertIntoDatabase = insertIntoDatabase;
    client.updateIntoDatabase = updateIntoDatabase;
    client.deleteIntoDatabase = deleteIntoDatabase;

    // Utils
    client.compareText = (originalText, comparedText) => {
        const words = comparedText.split(' ');
        const occurences = words.filter((word) => deburr(originalText.toLowerCase()).replace(/[^a-z0-9]/g, '').includes(deburr(word.toLowerCase()).replace(/[^a-z0-9]/g, '')));
        return (occurences.length / words.length) >= 1;
    };

    client.waitForTimeout = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    client.splitArrayByParts = (array, parts=10) => {
        const result = [[]];
    
        for (const element of array) {
          const lastPart = result.at(-1);
          if (lastPart.length === parts) {
            result.push([element]);
          } else {
            lastPart.push(element);
          };
        };
    
        return result;
    };

    // 42 API
    client.getParisCampusLocations = async () => {
      const output = [];

      const params = new URLSearchParams();
      params.append('campus_id', '1');
      params.append('per_page', '100');
      params.append('filter[active]', 'true');

      let goToNextPage = true;
      let pageId = 1;
      while (goToNextPage) {
        if (pageId !== 1) {
          await client.waitForTimeout(500);
        };

        params.set('page', String(pageId));
        const data = await fetch(`https://api.intra.42.fr/v2/locations?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${client.accessToken}`
          }
        });

        const jsonData = await data.json();
        if (!data.ok) {
          console.error(`❌ Erreur avec la fonction getParisCampusLocations: ${jsonData.message}.`);
          break;
        };

        for (const {id, host, user} of jsonData) {
          const [bat] = host.split('-');
          if (!['bess', 'paul', 'made'].includes(bat)) {
            continue;
          };
          const {login, image} = user;
          output.push({id: String(id), host, user: {
            id: String(user.id),
            login,
            image: image.link,
          }});
        };

        if (jsonData.length !== 100) {
          goToNextPage = false;
        } else {
          pageId++;
        };
      };
      return output;
    };

    await require('./discord/functions')(client);
};

module.exports = functions;
