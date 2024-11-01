const {DiscordCommand} = require('../../system/structures/command');

const sortsTypes = [{name: '42 Login [A-Z]', value: 'login_asc'}, {name: '42 Login [Z-A]', value: 'login_dsc'}, {name: 'The more the pages progress, the more we reach the bad guys [0-*]', value: 'delog_asc'}, {name: 'The further the pages go, the further we get away from the bad guys [*-0]', value: 'delog_dsc'}, {name: 'Victims last [0-*]', value: 'gdelog_asc'}, {name: 'Victims festival first [*-0]', value: 'gdelog_dsc'}];

const Leaderboard = new DiscordCommand({
	name: 'leaderboard',
	description: 'Gives the leaderboard of the deloggers and their victims.',
	category: '🔎 Search',
	run: async (client, interaction) => {
		const syncedUsers = client.selectAllIntoDatabase('42/Sync');
		const UserDB = client.selectAllIntoDatabase('42/Users').filter((user) => syncedUsers.find((syncedUser) => syncedUser.fortyTwoUserId === user.userId));

		if (!UserDB.length) {
			return await interaction.sendEmbed(client.createEmbed('Cannot find any 42 student to show...', {emote: 'zero', type: 'warning'}));	
		};

		const professionalDelogger = UserDB.sort((a, b) => b.delogTimes - a.delogTimes)[0];
		const favouriteVictim = UserDB.sort((a, b) => b.gotDeloggedTimes - a.gotDeloggedTimes)[0];

		const selectedSortType = interaction.options.getString('sorting_type') ?? 'login_asc';
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
				.setTitle('🔒 Deloggers and victims leaderboard')
				.setDescription(splittedSortedUsers.map((user) => `- **[${user.login}](https://profile.intra.42.fr/users/${user.login})**, delog **${user.delogTimes}** time(s) and has been delogged **${user.gotDeloggedTimes}** time(s)`).join('\n'))
				.setFields({name: '**Informations**', value: `- Sorting type: **${sortsTypes.find((sortType) => sortType.value === selectedSortType).name}**\n- Total delogs: **${totalDelogTimes}**\n- **\`😈👑 Professional Delogger\`** title is awarded to **[${professionalDelogger.login}](https://profile.intra.42.fr/users/${professionalDelogger.login})** who delogged **${professionalDelogger.delogTimes}** time(s).\n*And then a little thought to **[${favouriteVictim.login}](https://profile.intra.42.fr/users/${favouriteVictim.login})** who has been delogged **${favouriteVictim.gotDeloggedTimes}** time(s)...*`})
		
			pages.push([{embed: leaderboardEmbed}]);
		};

		if (pages.length === 1) {
			return await interaction.sendEmbed(pages[0][0].embed);
		};
		return await client.createPagesSystem(interaction, pages, 'buttons');
	},
});

Leaderboard.data
	.addStringOption((option) => option.setName('sorting_type').setDescription('🔁 • The sorting type (By default, with the 42 logins [A-Z]).').setChoices(...sortsTypes));

module.exports = Leaderboard;

