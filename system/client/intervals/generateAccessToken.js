require('dotenv').config();

/**
 * Génère le token d'accès vers l'API de 42.
 * @param {DiscordClient} client Le client Discord.
 */
async function generateAccessToken(client) {
    try {
       const now = Date.now();
       const FortyTwoDB = client.selectIntoDatabase('Client/FortyTwo', {id: 1});

       if (!client.accessToken) {
        client.accessToken = FortyTwoDB.accessToken;
       };
       
       if (now > (FortyTwoDB.lastUpdate + 1200000)) {
            client.updateIntoDatabase('Client/FortyTwo', {lastUpdate: now}, {id: 1});

            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id',  process.env['42_UID']);
            params.append('client_secret', process.env['42_SECRET']);

            const data = await fetch('https://api.intra.42.fr/oauth/token', {method: 'POST', body: params});
            if (data.ok) {
                const jsonData = await data.json();
                client.updateIntoDatabase('Client/FortyTwo', {accessToken: jsonData.access_token}, {id: 1});
                client.accessToken = jsonData.access_token;
                console.log('✅ Token d\'accès à l\'API de 42 récupéré !');
            };
       };
    } catch (err) {
        console.error(`❌ Erreur avec la fonction generateAccessToken: ${err}`);
    };
};

module.exports = generateAccessToken;
