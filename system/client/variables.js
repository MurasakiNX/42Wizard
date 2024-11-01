/**
 * Initialise les variables globales du bot.
 * @param {DiscordClient} client Le client Discord.
 */
async function variables(client) {
    client.maintenance = false;
    client.accessToken = '';

    client.baseResponse = {
        status: null,
        response: null,
        data: null,
    };
    await require('./discord/variables')(client);
};

module.exports = variables;
