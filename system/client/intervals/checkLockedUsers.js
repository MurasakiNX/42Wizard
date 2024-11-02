const moment = require('moment');
require('moment-precise-range-plugin');
moment.locale('en');

/**
 * Vérifie l'état des personnes qui ont un PC lock.
 * @param {DiscordClient} client Le client Discord.
 */
async function checkLockedUsers(client) {
	try {
		const lockedUsers = client.selectAllIntoDatabase('42/LockSystem', {status: 'locked'});
		for (const lockedUser of lockedUsers) {
			const now = Date.now();
			const elapsed = now - lockedUser.lockedAt;
			const host = lockedUser.host;
			const FortyTwoDB = client.selectIntoDatabase('42/Clusters', {id: 1});
			const data = JSON.parse(FortyTwoDB.clustersData);

			const fortyTwoUserId = lockedUser.fortyTwoUserId;
			const UserDB = client.selectIntoDatabase('42/Users', {userId: fortyTwoUserId});
			const clusterData = data.find((cluster) => cluster.host === host);

			const FortyTwoSyncDB = client.selectIntoDatabase('42/Sync', {fortyTwoUserId});
			const dmChannelId = FortyTwoSyncDB.dmChannelId;
			const userMail = `${UserDB.login}@student.42.fr`;

			if (clusterData) {
				if (UserDB.userId == clusterData.user.id) {
					if (!lockedUser.fiveMinutesReminded && elapsed >= 2220000) {
						const reminderEmbed = client.baseEmbed()
							.setTitle('🔒 You are about to be deloggable (37 minutes elapsed)')
							.setThumbnail(UserDB.image)
							.setDescription(`- Host: **[${host}](https://meta.intra.42.fr/clusters#${host})**\n`);
	
						client.updateIntoDatabase('42/LockSystem', {
							fiveMinutesReminded: 1,
						}, {fortyTwoUserId});

						if (FortyTwoSyncDB.mailEnabled) {
							await client.sendMail(userMail, 'You are about to be deloggable (37 minutes elapsed)', `Be careful, you are about to be deloggable!\nYour host is currently at <a href="https://meta.intra.42.fr/clusters#${host}" target="_blank" style="text-decoration: none; color:#00babc;">${host}</a>`);
						};
	
						await client.sendMessage(dmChannelId, reminderEmbed);
					};
				} else {
					let delogTimes = 1;
					const deloggerUserDB = client.selectIntoDatabase('42/Users', {userId: clusterData.user.id});
					if (deloggerUserDB) {
						delogTimes = deloggerUserDB.delogTimes + 1;
						client.updateIntoDatabase('42/Users', {delogTimes}, {userId: clusterData.user.id});
					};

					const gotDeloggedTimes = UserDB.gotDeloggedTimes + 1;
					client.updateIntoDatabase('42/Users', {gotDeloggedTimes}, {userId: fortyTwoUserId});

					const elapsedAfter42 = elapsed - 2520000;
					const formattedElapsed = moment.preciseDiff(0, elapsedAfter42);
					let delogGIF = 'https://cdn.discordapp.com/attachments/1300993150248157267/1301251159968972902/default.gif';

					if (elapsedAfter42 < 180000) {
						delogGIF = 'https://cdn.discordapp.com/attachments/1300993150248157267/1301249830823264396/180000.gif';
					} else if (elapsedAfter42 < 360000) {
						delogGIF = 'https://cdn.discordapp.com/attachments/1300993150248157267/1301250136659460186/360000.gif';
					} else if (elapsedAfter42 < 1080000) {
						delogGIF = 'https://cdn.discordapp.com/attachments/1300993150248157267/1301250975134257344/1080000.gif';
					};

					const deloggedEmbed = client.baseEmbed()
						.setTitle('🔓 A student has manually delogged you')
						.setThumbnail(clusterData.user.image)
						.setDescription(`- Host: **[${host}](https://meta.intra.42.fr/clusters#${host})**\n- Delogger's login: **[${clusterData.user.login}](https://profile.intra.42.fr/users/${clusterData.user.login})**\n- Delogged after **${formattedElapsed}**\n\n- Delogger's delog time(s): **${delogTimes}**\n- You have been delogged **${gotDeloggedTimes}** time(s).`)
						.setImage(delogGIF);

					if (FortyTwoSyncDB.mailEnabled) {
						await client.sendMail(userMail, 'A student has manually delogged you', `Your host at <a href="https://meta.intra.42.fr/clusters#${host}" target="_blank" style="text-decoration: none; color:#00babc;">${host}</a> has been delogged by <a href="https://profile.intra.42.fr/users/${clusterData.user.login}" target="_blank" style="text-decoration: none; color:#00babc;">${clusterData.user.login}</a> after ${formattedElapsed} after you were deloggable.`);
					};

					client.updateIntoDatabase('42/LockSystem', {
						status: 'unlocked',
						unlockedAt: now,
					}, {fortyTwoUserId});

					await client.sendMessage(dmChannelId, deloggedEmbed);
				};
			} else {
				client.updateIntoDatabase('42/LockSystem', {
					status: 'unlocked',
					unlockedAt: now,
				}, {fortyTwoUserId});

				if (elapsed >= 5040000) {
					const autoDeloggedEmbed = client.baseEmbed()
						.setTitle('🔓 You have been delogged automatically (1 hour and 24 minutes elapsed)')
						.setThumbnail(UserDB.image)
						.setDescription(`- Host: **[${host}](https://meta.intra.42.fr/clusters#${host})**`);

					if (FortyTwoSyncDB.mailEnabled) {
						await client.sendMail(userMail, 'You have been delogged automatically (1 hour and 24 minutes elapsed)', `Your host at <a href="https://meta.intra.42.fr/clusters#${host}" target="_blank" style="text-decoration: none; color:#00babc;">${host}</a> has been delogged automatically.`);
					};
					await client.sendMessage(dmChannelId, autoDeloggedEmbed);
				} else if (elapsed >= 2520000) {
					const deloggedEmbed = client.baseEmbed()
						.setTitle('🔓 An unknown student has manually delogged you')
						.setThumbnail(UserDB.image)
						.setDescription(`- Host: **[${host}](https://meta.intra.42.fr/clusters#${host})**`);

					if (FortyTwoSyncDB.mailEnabled) {
						await client.sendMail(userMail, 'An unknown student has manually delogged you', `Your host at <a href="https://meta.intra.42.fr/clusters#${host}" target="_blank" style="text-decoration: none; color:#00babc;">${host}</a> has been delogged manually by an unknown student (Or maybe by the almighty cat 🐱🐱🐱).`);
					};
					await client.sendMessage(dmChannelId, deloggedEmbed);
				};
			};
		};
	} catch (err) {
        console.error(`❌ Erreur avec la fonction checkLockedUsers: ${err}`);
	};
};

module.exports = checkLockedUsers;
