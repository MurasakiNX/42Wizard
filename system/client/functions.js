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
    await require('./discord/functions')(client);
};

module.exports = functions;
