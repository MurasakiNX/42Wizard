const {DiscordCommand} = require('../../system/structures/command');

const Trouve = new DiscordCommand({
    name: 'trouve',
    description: 'Recherche un utilisateur 42 et indique sa position en cluster.',
    category: '🔎 Recherche',
    run: async (client, interaction) => {
        const selectedLogin = interaction.options.getString('login');

        const UserDB = client.selectIntoDatabase('42/Users', {login: selectedLogin});
        if (!UserDB) {
            return await interaction.sendEmbed(client.createEmbed('Je n\'ai trouvé aucun utilisateur 42 avec cette recherche...', {emote: 'zero', type: 'warning'}));
        };

        const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});
        const data = JSON.parse(FortyTwoDB.clustersData);
        const selectedClusters = data.filter((d) => d.id === UserDB.userId);

        const trouveEmbed = client.baseEmbed()
            .setThumbnail(UserDB.image)
            .setDescription(`- Login: **[${UserDB.login}](https://profile.intra.42.fr/users/${UserDB.login})**\n- Position(s):${selectedClusters.length ? ('\n' + selectedClusters.map((selectedCluster) => `  - **[${selectedCluster.host}](https://meta.intra.42.fr/clusters#${selectedCluster.host})**`).join('\n')) : ' **❌ Connecté(e) nulle part**'}`);

        return await interaction.sendEmbed(trouveEmbed);
    },
});

Trouve.data
    .addStringOption((option) => option.setName('login').setDescription('🆔 • Le login exact du compte 42 à rechercher.').setRequired(true));

module.exports = Trouve;
