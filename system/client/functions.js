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
    client.getClusterDisplay = (name) => {
      const [bat, fullHost] = name.split('-');

      if (!['bess', 'paul', 'made'].includes(bat)) {
        return null;
      };

      let cluster = fullHost.substring(0, 3);
      let host = fullHost.slice(3);
    
      if (['bess', 'paul'].includes(bat)) {
        cluster = fullHost.substring(0, 2);
        host = fullHost.slice(2);
      };

      return {bat, cluster, host};
    };

    client.getParisCampusLocations = async () => {
      const output = [];

      const params = new URLSearchParams();
      params.append('campus_id', '1');
      params.append('per_page', '100');
      params.append('filter[active]', 'true');

      let goToNextPage = true;
      let pageId = 1;
      while (goToNextPage) {
        params.set('page', String(pageId));
        const data = await fetch(`https://api.intra.42.fr/v2/locations?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${client.accessToken}`
          }
        });

        if (!data.ok) {
          break;
        };

        const jsonData = await data.json();
        for (const {id, host, user} of jsonData) {
          const clusterDisplay = client.getClusterDisplay(host);
          if (!clusterDisplay) {
            continue;
          };
          const {login, image} = user;
          output.push({id: String(id), host, clusterDisplay, user: {
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
