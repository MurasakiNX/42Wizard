require('dotenv').config();

/**
 * Récupère les informations des clusters du campus de Paris.
 * @param {DiscordClient} client Le client Discord.
 */
async function updateClustersData(client) {
    if (!client.accessToken) {
        return;
    };

    const now = Date.now();
    const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});

    if (now > (FortyTwoDB.lastUpdate + 42000)) {
        client.updateIntoDatabase('42/Clusters', {lastUpdate: now}, {id: 1});
        const newData = await client.getParisCampusLocations();
        if (!newData.length) {
            console.error('❌ Informations sur les clusters non mis à jour !');
            return;
        };

        for (const {user} of newData) {
            const {id, login, image} = user;
            const userData = client.selectIntoDatabase('42/Users', {userId: id});
            if (!userData) {
                client.insertIntoDatabase('42/Users', {userId: id, login, image: image, delogTimes: 0, gotDeloggedTimes: 0});
            } else if (userData.image !== user.image) {
                client.updateIntoDatabase('42/Users', {login: login, image: image}, {userId: id});
            };
        };

        client.updateIntoDatabase('42/Clusters', {clustersData: JSON.stringify(newData)}, {id: 1});
    };
};

module.exports = updateClustersData;
