const {DiscordCommand} = require('../../system/structures/command');

const Find = new DiscordCommand({
    name: 'find',
    description: 'Gives informatons about a 42 student.',
    category: '🔎 Search',
    run: async (client, interaction) => {
        const selectedLogin = interaction.options.getString('login');

        const UserDB = client.selectIntoDatabase('42/Users', {login: selectedLogin});
        if (!UserDB) {
            return await interaction.sendEmbed(client.createEmbed('Cannot find a 42 account which has this login.', {emote: 'zero', type: 'warning'}));
        };

        const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});
        const data = JSON.parse(FortyTwoDB.clustersData);
        const selectedClusters = data.filter((d) => d.user.id === UserDB.userId);

        const trouveEmbed = client.baseEmbed()
            .setThumbnail(UserDB.image)
            .setDescription(`- Login: **[${UserDB.login}](https://profile.intra.42.fr/users/${UserDB.login})**\n- Current host(s):${selectedClusters.length ? ('\n' + selectedClusters.map((selectedCluster) => `  - **[${selectedCluster.host}](https://meta.intra.42.fr/clusters#${selectedCluster.host})**`).join('\n')) : ' **Not connected**'}\n\n- 😈 Delog **${UserDB.delogTimes}** times.\n- 😢 Has been delogged **${UserDB.gotDeloggedTimes}** times.`);

        return await interaction.sendEmbed(trouveEmbed);
    },
});

Find.data
    .addStringOption((option) => option.setName('login').setDescription('🆔 • The 42 account login of the user you are looking for.').setRequired(true));

module.exports = Find;
