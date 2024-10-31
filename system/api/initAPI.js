const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {time} = require('discord.js');
require('dotenv').config();

const app = express();

/**
 * Initialise l'API de 42Wizard.
 * @param {DiscordClient} client Le client Discord.
 */
async function initAPI(client) {
    try {
        app.use(bodyParser.urlencoded({extended: false}));
        app.use(bodyParser.json());
        app.use(cors());
    
        app.post('/42Wizard', async (req, res) => {
            const body = req.body;
    
            for (const key of ['status', 'userKey']) {
                if (!Object.keys(body).includes(key)) {
                  return res.status(401).send('Veuillez indiquer le status et le userKey dans la requête.\n');
                };
            };
    
            const status = String(body.status);
            if (!['locked', 'unlocked'].includes(status)) {
                return res.status(401).send('Veuillez indiquer un status correct.');
            };
    
            const userKey = String(body.userKey);
            const FortyTwoSyncDB = client.selectIntoDatabase('42/Sync', {syncKey: userKey});
    
            if (!FortyTwoSyncDB) {
                return res.status(401).send('Impossible d\'identifier l\'utilisateur 42.');
            };
    
            const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});
            const data = JSON.parse(FortyTwoDB.clustersData);
            const fortyTwoUserId = FortyTwoSyncDB.fortyTwoUserId;
    
            const userData = client.selectIntoDatabase('42/Users', {userId: fortyTwoUserId});
            const selectedClusters = data.filter((d) => d.user.id === userData.userId);
    
            if (selectedClusters.length !== 1) {
                return res.status(401).send('Impossible d\'identifier le cluster de l\'utilisateur 42.\n');
            };
    
            const selectedCluster = selectedClusters[0];
            const {host} = selectedCluster;
            const LockSystemDB = client.selectIntoDatabase('42/LockSystem', {fortyTwoUserId});
            const now = Date.now();
    
            if (status === 'locked') {
                if (LockSystemDB && LockSystemDB.status === 'locked') {
                    return res.status(401).send('Utilisateur déjà détecté comme locked.\n');
                };
                
                const lockedEmbed = client.baseEmbed()
                .setTitle('🔒 Notification de détection de lock sur un poste à 42')
                .setThumbnail(client.userAvatar)
                .setDescription(`- Poste: **[${host}](https://meta.intra.42.fr/clusters#${host})**\n- Possibilité de delog: ${time(Math.round(now / 1000) + 2520, 'R')}\n- Delog automatique: ${time(Math.round(now / 1000) + 5040, 'R')}\n\n*Vous recevrez automatiquement une notification **5 minutes** avant la possibilité de delog.*`);

                const message = await client.sendMessage(FortyTwoSyncDB.dmChannelId, lockedEmbed);

                if (LockSystemDB) {
                    client.updateIntoDatabase('42/LockSystem', {
                        lockDiscordMessageId: message.id || '',
                        host,
                        status,
                        lockedAt: now,
                        unlockedAt: 0,
                        fiveMinutesReminded: 0
                    }, {fortyTwoUserId});
                } else {
                    client.insertIntoDatabase('42/LockSystem', {
                        fortyTwoUserId,
                        lockDiscordMessageId: message.id || '',
                        host,
                        status,
                        lockedAt: now,
                        unlockedAt: 0,
                        fiveMinutesReminded: 0
                    });
                };           
            } else {
                if (LockSystemDB && LockSystemDB.status === 'unlocked') {
                    return res.status(401).send('Utilisateur déjà détecté comme unlocked.\n');
                } else if ((now - LockSystemDB.lockedAt) < 500) {
                    return res.status(401).send('Très rapide pour unlock, on essaie de spam l\'API ?\n');
                } else if (LockSystemDB && LockSystemDB.host === selectedCluster.host) {
                    client.updateIntoDatabase('42/LockSystem', {
                        status,
                        unlockedAt: Date.now(),
                    }, {fortyTwoUserId});
                    if (LockSystemDB.lockDiscordMessageId) {
                        await client.deleteMessage(FortyTwoSyncDB.dmChannelId, LockSystemDB.lockDiscordMessageId);
                    };
                };
            };
    
            res.status(200).send('OK\n');
        });
    
        app.all('*', (_, res) => {
            res.status(404).send('Il n\'y a rien ici...\n');
        });
    
        app.listen(process.env.API_PORT, () => {
            console.log(`✅ [API] API initialisée sur le port ${process.env.API_PORT} !`);
        });
    } catch (err) {
        console.error(`❌ Erreur avec la fonction initAPI: ${err}`);
    };
};

module.exports = initAPI;
