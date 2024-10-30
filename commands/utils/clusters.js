const {DiscordCommand} = require('../../system/structures/command');
const {time} = require('discord.js');

const Clusters = new DiscordCommand({
  name: 'clusters',
  description: 'Affiche des informations sur les clusters du campus de Paris',
  category: '⚙️ Autres',
  run: async (client, interaction) => {
    const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});
    const data = JSON.parse(FortyTwoDB.clustersData);
    const pages = [];
  
    if (!data.length) {
      return await interaction.sendEmbed(client.createEmbed('Je ne dispose d\'aucune information à afficher sur les clusters pour le moment...', {emote: 'zero', type: 'warning'}));
    };

    const parsedBats = {};
    for (const {user, clusterDisplay, host} of data) {
      const {bat, cluster} = clusterDisplay;
      if (!parsedBats[bat]) {
        parsedBats[bat] = {};
      };
      if (!parsedBats[bat][cluster]) {
        parsedBats[bat][cluster] = [];
      };
      parsedBats[bat][cluster].push(`- **[${user.login}](https://profile.intra.42.fr/users/${user.login})** - [Position en cluster ${host}](https://meta.intra.42.fr/clusters#${host})`);
    };

    for (const bat of Object.keys(parsedBats)) {
      for (const cluster of Object.keys(parsedBats[bat])) {
        const clusterEmbed = client.baseEmbed()
          .setTitle(`Bâtiment ${bat.toUpperCase()} - Cluster ${cluster.toUpperCase()}`)
          .setDescription(`Date de la dernière synchronisation: ${time(Math.round(FortyTwoDB.lastUpdate / 1000), 'R')}\n\n${parsedBats[bat][cluster].join('\n')}`);

        pages.push([{embed: clusterEmbed, emote: 'forty_two'}]);
      };
    };

    return await client.createPagesSystem(interaction, pages, 'selection');
  },
});

module.exports = Clusters;
