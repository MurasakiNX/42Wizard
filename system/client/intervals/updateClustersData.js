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

    if (now > (FortyTwoDB.lastUpdate + 30000)) {
        client.updateIntoDatabase('42/Clusters', {lastUpdate: now}, {id: 1});
        const newData = await client.getParisCampusLocations();
        if (!newData.length) {
            console.error('❌ Informations sur les clusters non mis à jour !');
            return;
        };

        for (const {id, user} of newData) {
            const userData = client.selectIntoDatabase('42/Users', {userId: id});
            if (!userData) {
                client.insertIntoDatabase('42/Users', {userId: id, login: user.login, image: user.image});
            } else if (userData.login !== user.login || userData.image !== user.image) {
                client.updateIntoDatabase('42/Users', {login: user.login, image: user.image}, {userId: id});
            };
        };

        client.updateIntoDatabase('42/Clusters', {clustersData: JSON.stringify(newData)}, {id: 1});
    };
};

module.exports = updateClustersData;