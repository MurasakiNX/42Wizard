/**
 * Initialise les variables globales du bot.
 * @param {DiscordClient} client Le client Discord.
 */
async function variables(client) {
    client.maintenance = false;
    await require('./discord/variables')(client);
};

module.exports = variables;
