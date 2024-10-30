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
    const previousData = JSON.parse(FortyTwoDB.clustersData); // Servira plus tard.

    if (now > (FortyTwoDB.lastUpdate + 30000)) {
        client.updateIntoDatabase('42/Clusters', {lastUpdate: now}, {id: 1});
        const newData = await client.getParisCampusLocations();
        if (!newData.length) {
            return;
        };

        client.updateIntoDatabase('42/Clusters', {clustersData: JSON.stringify(newData)}, {id: 1});
        console.log('✅ Informations sur les clusters mis à jour !');
    };
};

module.exports = updateClustersData;
