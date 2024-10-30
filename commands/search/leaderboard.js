const {DiscordCommand} = require('../../system/structures/command');

const sortsTypes = [{name: 'Login 42 [A-Z]', value: 'login_asc'}, {name: 'Login 42 [Z-A]', value: 'login_dsc'}, {name: 'Plus on avance, plus on s\'approche du pas gentil [0-*]', value: 'delog_asc'}, {name: 'Plus on avance, plus on s\'éloigne du pas gentil [*-0]', value: 'delog_dsc'}, {name: 'Les victimes en dernier [0-*]', value: 'gdelog_asc'}, {name: 'Festival des victimes d\'abord [*-0]', value: 'gdelog_dsc'}];

const Leaderboard = new DiscordCommand({
	name: 'leaderboard',
	description: 'Affiche le leaderboard des deloggers et de leurs victimes.',
	category: '🔎 Recherche',
	run: async (client, interaction) => {
		const UserDB = client.selectAllIntoDatabase('42/Users');

		const professionalDelogger = UserDB.sort((a, b) => b.delogTimes - a.delogTimes)[0];
		const favouriteVictim = UserDB.sort((a, b) => b.gotDeloggedTimes - a.gotDeloggedTimes)[0];

		const selectedSortType = interaction.options.getString('type_de_tri') ?? 'login_asc';
    	const [sortBy, sortOrder] = selectedSortType.split('_');
		const sortedUsers = client.splitArrayByParts(UserDB.sort((a, b) => {
			if (sortOrder === 'dsc') {
				const c = a;
				a = b;
				b = c;
			};

			if (sortBy === 'login') {
				return a.login.localeCompare(b.login);
			} else if (sortBy === 'delog') {
				return a.delogTimes - b.delogTimes;
			};
			return a.gotDeloggedTimes - b.gotDeloggedTimes;
		}), 15);

		const totalDelogTimes = UserDB.map((a) => a.delogTimes).reduce((a, b) => a + b);
		const pages = [];
		for (const splittedSortedUsers of sortedUsers) {
			const leaderboardEmbed = client.baseEmbed()
				.setTitle('🔒 Leaderboard des deloggers et de leurs victimes de 42')
				.setDescription(splittedSortedUsers.map((user) => `- **[${user.login}](https://profile.intra.42.fr/users/${user.login})**, delog **${user.gotDeloggedTimes}** fois, a delog **${user.delogTimes}** fois`).join('\n'))
				.setFields({name: '**Informations**', value: `- Type de tri: **${sortsTypes.find((sortType) => sortType.value === selectedSortType).name}**\n- Nombre de delogs comptabilisés: **${totalDelogTimes}**\n- Le titre de 😈👑 Professional Delogger est décerné à **[${professionalDelogger.login}](https://profile.intra.42.fr/users/${professionalDelogger.login})** qui a delog **${professionalDelogger.delogTimes}** fois.\n*Et puis petite pensée à **[${favouriteVictim.login}](https://profile.intra.42.fr/users/${favouriteVictim.login})** qui a été en tout delog **${favouriteVictim.gotDeloggedTimes}** fois...*`})
		
			pages.push([{embed: leaderboardEmbed}]);
		};

		if (pages.length === 1) {
			return await interaction.sendEmbed(pages[0][0]);
		};
		return await client.createPagesSystem(interaction, pages, 'buttons');
	},
});

Leaderboard.data
	.addStringOption((option) => option.setName('type_de_tri').setDescription('🔁 • Le type de tri que vous souhaitez effectuer (Par défaut, selon les logins 42 [A-Z]).').setChoices(...sortsTypes));

module.exports = Leaderboard;

