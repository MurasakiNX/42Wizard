/**
 * Initialise les variables pour le bot Discord.
 * @param {DiscordClient} client Le client Discord.
 */
async function variables(client) {
    client.commands = [];
    client.emotes = {no_emote: '<:no_emote:1300951130389479508>'};
    client.owners = ['562660439360667648'];

    client.exportsChannelId = '';

    client.colors = {
        default: 0x000000,
        success: 0x81FA78,
        warning: 0xFFB271,
    };
};

module.exports = variables;
