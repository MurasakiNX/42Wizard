const {DiscordCommand} = require('../../system/structures/command');

const Find = new DiscordCommand({
    name: 'find',
    description: 'Gives informatons about a 42 student.',
    category: '🔎 Search',
    run: async (client, interaction) => {
        const syncedUserData = client.selectIntoDatabase('42/Sync', {discordUserId: interaction.user.id, verified: 1});
        let selectedLogin = interaction.options.getString('login');

        if (!selectedLogin) {
            if (!syncedUserData) {
                return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
            };

            const userData = client.selectIntoDatabase('42/Users', {userId: syncedUserData.fortyTwoUserId});
            selectedLogin = userData.login;
        };

        const UserDB = client.selectIntoDatabase('42/Users', {login: selectedLogin});
        if (!UserDB) {
            return await interaction.sendEmbed(client.createEmbed('Cannot find a 42 account which has this login.', {emote: 'zero', type: 'warning'}));
        };

        const userSyncData = client.selectIntoDatabase('42/Sync', {fortyTwoUserId: UserDB.userId, verified: 1});
        if (!userSyncData) {
            return await interaction.sendEmbed(client.createEmbed('The student you are looking for must have synced his account with 42Wizard.', {emote: 'zero', type: 'warning'}));
        } else if (userSyncData && userSyncData.fortyTwoUserId !== syncedUserData.fortyTwoUserId) {
            if (!userSyncData.enabled) {
                return await interaction.sendEmbed(client.createEmbed('The student you are looking for must have enabled the system on his account.', {emote: 'zero', type: 'warning'}));
            } else if (userSyncData.hidden) {
                return await interaction.sendEmbed(client.createEmbed('The student you are looking for must not be hidden from the other students.', {emote: 'zero', type: 'warning'}));
            };
        };

        const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});
        const data = JSON.parse(FortyTwoDB.clustersData);
        const selectedClusters = data.filter((d) => d.user.id === UserDB.userId);

        const findEmbed = client.baseEmbed()
            .setThumbnail(UserDB.image)
            .setDescription(`- Login: **[${UserDB.login}](https://profile.intra.42.fr/users/${UserDB.login})**\n- Current host(s):${selectedClusters.length ? ('\n' + selectedClusters.map((selectedCluster) => `  - **[${selectedCluster.host}](https://meta.intra.42.fr/clusters#${selectedCluster.host})**`).join('\n')) : ' **Unavailable**'}\n\n- 😈 Delog **${UserDB.delogTimes}** time(s).\n- 😢 Has been delogged **${UserDB.gotDeloggedTimes}** time(s).`);

        return await interaction.sendEmbed(findEmbed);
    },
});

Find.data
    .addStringOption((option) => option.setName('login').setDescription('🆔 • The 42 account login of the user you are looking for (By default, your account if linked).'));

module.exports = Find;
