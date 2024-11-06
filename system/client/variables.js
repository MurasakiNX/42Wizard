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

    client.defaultAvatar = 'https://cdn.discordapp.com/attachments/1300993150248157267/1303524368248209439/user.png';
    await require('./discord/variables')(client);
};

module.exports = variables;
