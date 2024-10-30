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

			if (clusterData) {
				if (UserDB.userId == clusterData.user.id) {
					if (!lockedUser.fiveMinutesReminded && elapsed >= 2220000) {
						const reminderEmbed = client.baseEmbed()
							.setTitle('🔒 Notification de rappel de reconnexion sur un poste à 42 5 minutes avant la possibilité de delog')
							.setThumbnail(UserDB.image)
							.setDescription(`- Poste: **[${host}](https://meta.intra.42.fr/clusters#${host})**\n`);
	
						client.updateIntoDatabase('42/LockSystem', {
							fiveMinutesReminded: 1,
						}, {fortyTwoUserId});
	
						await client.sendMessage(dmChannelId, reminderEmbed);
					};
				} else {
					const deloggedEmbed = client.baseEmbed()
						.setTitle('🔓 Notification de delog manuel sur votre poste')
						.setThumbnail(clusterData.user.image)
						.setDescription(`- Poste: **[${host}](https://meta.intra.42.fr/clusters#${host})**\n- Login du delogger: **[${clusterData.user.login}](https://profile.intra.42.fr/users/${clusterData.user.login})**`);

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
						.setTitle('🔓 Notification de delog automatique sur votre poste (1 heure 24 minutes écoulées)')
						.setThumbnail(UserDB.image)
						.setDescription(`- Poste: **[${host}](https://meta.intra.42.fr/clusters#${host})**`);
					await client.sendMessage(dmChannelId, autoDeloggedEmbed);
				} else if (elapsed >= 2520000) {
					const deloggedEmbed = client.baseEmbed()
						.setTitle('🔓 Notification de delog manuel sur votre poste (Sans reconnexion)')
						.setThumbnail(UserDB.image)
						.setDescription(`- Poste: **[${host}](https://meta.intra.42.fr/clusters#${host})**`);
					await client.sendMessage(dmChannelId, deloggedEmbed);
				};
			};

			if (lockedUser.id !== lockedUsers.at(-1).id) {
				await client.waitForTimeout(500);
			};
		};
	} catch (err) {
        console.error(`❌ Erreur avec la fonction checkLockedUsers: ${err}`);
	};
};

module.exports = checkLockedUsers;
