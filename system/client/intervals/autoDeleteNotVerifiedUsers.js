/**
 * Supprime de la base de données, les personnes toujours pas vérifiées après 5 minutes.
 * @param {DiscordClient} client Le client Discord.
 */
async function autoDeleteNotVerifiedUsers(client) {
    const now = Date.now();
    const notVerifiedUsers = client.selectAllIntoDatabase('42/Sync', {verified: 0});

    for (const notVerifiedUser of notVerifiedUsers) {
        if (notVerifiedUser.syncedAt + 300000 <= now) {
            const deleteEmbed = client.baseEmbed()
                .setTitle('❌ You have not verified your 42 account')
                .setThumbnail(client.userAvatar)
                .setDescription('You will have to redo the </link setup:1301665165615304745> command if you want to link your Discord account with a 42 account again.');

            await client.sendMessage(notVerifiedUser.dmChannelId, deleteEmbed);
            client.deleteIntoDatabase('42/Sync', {id: notVerifiedUser.id});
        };
    };
};

module.exports = autoDeleteNotVerifiedUsers;
