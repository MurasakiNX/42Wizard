require('dotenv').config();
const {Client, GatewayIntentBits} = require('discord.js');
const client = new Client({intents: [GatewayIntentBits.Guilds], enforceNonce: true});

(async () => {
    await require('./system/client/functions')(client);
    await require('./system/client/variables')(client);
    await require('./system/client/registerFiles')(client);
    await client.login(process.env.DISCORD_CLIENT_TOKEN);
})();