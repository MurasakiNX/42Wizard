/**
 * Initialise les variables pour le bot Discord.
 * @param {DiscordClient} client Le client Discord.
 */
async function variables(client) {
    client.commands = [];
    client.emotes = {};
    client.owners = [];

    client.exportsChannelId = '';

    client.colors = {
        default: 0x000000,
        success: 0x81FA78,
        warning: 0xFFB271,
    };
};

module.exports = variables;
