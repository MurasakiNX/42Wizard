const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
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
        app.set('trust proxy', '127.0.0.1');
        
        // Public
        app.use('/assets', express.static('system/api/assets'));

        app.get('/confirm/:syncKey', async (req, res) => {
            const syncKey = String(req.params.syncKey);
            const newSyncKey = crypto.randomBytes(32).toString('hex').slice(0, 32);

            const syncData = client.selectIntoDatabase('42/Sync', {syncKey, verified: 0});
            if (!syncData) {
                return client.sendStatus(res, 401, {data: {message: 'Cannot find any 42 account with this key.'}});
            };

            const userData = client.selectIntoDatabase('42/Users', {userId: syncData.fortyTwoUserId});
            const syncEmbed = client.baseEmbed()
                .setTitle('✅ You have successfully linked your Discord account to your 42 account')
                .setThumbnail(userData.image)
                .setDescription(`- Login: **[${userData.login}](https://profile.intra.42.fr/users/${userData.login})**`)
                .addFields({name: '**Informations**', value: 'By default, you will receive mails when you are about to be deloggable or when you have been delogged. If you want to disable them, please use the </link toggle_mail:1301665165615304745> command!\n- To setup the lock system, please use the </link lock_system:1301665165615304745> command!\n- To allow other students to show your avatar, please use the </link toggle_avatar:1301665165615304745> command!\n- To be hidden from the other students, please use the </link toggle_hidden:1301665165615304745> command!\n- To disable the system, please use the </link toggle_enabled:1301665165615304745> command!'});

            await client.sendMessage(syncData.dmChannelId, syncEmbed);
            client.updateIntoDatabase('42/Sync', {syncKey: newSyncKey, verified: 1}, {syncKey});
            return client.sendStatus(res, 200, {data: {message: '42 account verified successfully!'}});
        });

        app.get('/getAwardedStudents', (_, res) => {
            const syncedUsers = client.selectAllIntoDatabase('42/Sync', {verified: 1, enabled: 1, hidden: 0});
            const UserDB = client.selectAllIntoDatabase('42/Users').filter((user) => (syncedUsers.find((syncedUser) => syncedUser.fortyTwoUserId === user.userId) && (user.delogTimes || user.gotDeloggedTimes)));

            if (!UserDB.length) {
                return client.sendStatus(res, 401, {data: {message: 'Cannot find any 42 student to show.'}});
            };

            const professionalDelogger = UserDB.sort((a, b) => b.delogTimes - a.delogTimes)[0];
		    const favouriteVictim = UserDB.sort((a, b) => b.gotDeloggedTimes - a.gotDeloggedTimes)[0];

            return client.sendStatus(res, 200, {data: {
                professionalDelogger: {userId: professionalDelogger.userId, delogTimes: professionalDelogger.delogTimes},
                favouriteVictim: {userId: favouriteVictim.userId, gotDeloggedTimes: favouriteVictim.gotDeloggedTimes}
            }});
        });

        // Private
        app.use((req, res, next) => {
            const ip = req.ip || '0.0.0.0';
            const authorizedIPs = process.env.AUTHORIZED_IPS.split(',');
            const parts = ip.split('.');

            if (!authorizedIPs.find((authorizedIP) => {
                const authorizedParts = authorizedIP.split('.');
                for (let i = 0; i < authorizedParts.length; i++) {
                    if (parts[i] !== authorizedParts[i] && authorizedParts[i] !== 'X') {
                        return false;
                    };
                };
                return true;
            })) {
                return client.sendStatus(res, 401, {data: {message: 'The 42Wizard API is not accessible for this IP address.'}});
            };
            next();
        });

        app.get('/', (_, res) => {
            return client.sendStatus(res, 200, {data: {message: 'Welcome to the 42Wizard API!'}});
        });

        app.post('/toggleLockStatus', async (req, res) => {
            const body = req.body;
            for (const key of ['status', 'userKey']) {
                if (!Object.keys(body).includes(key)) {
                    return client.sendStatus(res, 401, {data: {message: 'Please make sure that you have entered the status and the userKey.'}});
                };
            };
    
            const status = String(body.status);
            if (!['locked', 'unlocked'].includes(status)) {
                return client.sendStatus(res, 401, {data: {message: 'Unknown status specified.'}});
            };
    
            const userKey = String(body.userKey);
            const FortyTwoSyncDB = client.selectIntoDatabase('42/Sync', {syncKey: userKey, verified: 1});
    
            if (!FortyTwoSyncDB) {
                return client.sendStatus(res, 401, {data: {message: 'Cannot find any 42 student with this authentication key.'}});
            };
    
            const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});
            const data = JSON.parse(FortyTwoDB.clustersData);
            const fortyTwoUserId = FortyTwoSyncDB.fortyTwoUserId;
    
            const userData = client.selectIntoDatabase('42/Users', {userId: fortyTwoUserId});
            const selectedClusters = data.filter((d) => d.user.id === userData.userId);
    
            if (selectedClusters.length !== 1) {
                return client.sendStatus(res, 401, {data: {message: 'Cannot find the host of this 42 student.'}});
            };
    
            const selectedCluster = selectedClusters[0];
            const {host} = selectedCluster;
            const LockSystemDB = client.selectIntoDatabase('42/LockSystem', {fortyTwoUserId});
            const now = Date.now();
    
            if (status === 'locked' && FortyTwoSyncDB.enabled) {
                if (LockSystemDB && LockSystemDB.status === 'locked') {
                    return client.sendStatus(res, 401, {data: {message: 'This 42 student status is already locked.'}});
                };
                
                const lockedEmbed = client.baseEmbed()
                    .setTitle('🔒 You have locked your session')
                    .setThumbnail(client.userAvatar)
                    .setDescription(`- Host: **[${host}](https://meta.intra.42.fr/clusters#${host})**\n- Locked: ${time(Math.round(now / 1000), 'R')}\n- Deloggable: ${time(Math.round(now / 1000) + 2520, 'R')}\n- Auto delog: ${time(Math.round(now / 1000) + 5040, 'R')}\n\n*You will receive a message (and a mail if enabled) **5 minutes** before you are about to be deloggable.*`);

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
            } else if (status !== 'unlocked' && !FortyTwoSyncDB.enabled) {
                return client.sendStatus(res, 401, {data: {message: 'This 42 student has disabled the system on his account.'}});
            } else {
                if (LockSystemDB && LockSystemDB.status === 'unlocked') {
                    return client.sendStatus(res, 401, {data: {message: 'This 42 student status is already unlocked.'}});
                } else if ((now - LockSystemDB.lockedAt) < 500) {
                    return client.sendStatus(res, 429, {data: {message: 'You made the request too fast!'}});
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
    
            return client.sendStatus(res, 200, {data: {message: `The status of this 42 student has been successfully changed to ${status}!`}});
        });
    
        app.all('*', (req, res) => {
            return client.sendStatus(res, req.method === 'GET' ? 404 : 405, {data: {url: req._parsedUrl.path}});
        });
    
        app.listen(process.env.API_PORT, () => {
            console.log(`✅ [API] API initialisée sur le port ${process.env.API_PORT} !`);
        });
    } catch (err) {
        console.error(`❌ Erreur avec la fonction initAPI: ${err}`);
    };
};

module.exports = initAPI;
