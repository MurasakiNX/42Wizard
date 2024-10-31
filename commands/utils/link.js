require('dotenv').config();
const {DiscordCommand} = require('../../system/structures/command');
const crypto = require('crypto');

const Link = new DiscordCommand({
    name: 'link',
    description: 'Commands to manage the link between your Discord and your 42 account.',
    category: '⚙️ Utils',
    ephemeral: true,
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const syncKey = crypto.randomBytes(32).toString('hex').slice(0, 32);

        const FortyTwoSyncDB = client.selectIntoDatabase('42/Sync', {discordUserId: userId});

        switch (subcommand) {
            case 'lock_system': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                const informationsEmbed = client.baseEmbed()
                    .setTitle('❓ How to setup the lock system ?')
                    .setDescription(`- Steps:\n  - **Create** a \`.42Wizard\` directory (It is an hidden directory, make sure that you can see them) on your \`HOME\` and download (https://github.com/MurasakiNX/42Wizard/blob/main/script.sh) in it. *(Don't forget to make it executable \`chmod +x\`)*.\n  - **Create** a \`userKey\` file in the \`.42Wizard\` directory and put your authentication key in it.\n\n- **Run** this script (https://github.com/MurasakiNX/42Wizard/blob/main/autostart.sh) on a terminal to run automatically the lock system when you log in *(Don't forget to relog after that).*\n\n- Authentication key: \`${FortyTwoSyncDB.syncKey}\``)
                    .setImage('https://cdn.discordapp.com/attachments/1300993150248157267/1301168349425700966/image.png');

                await interaction.sendEmbed(informationsEmbed);
                break;
            };

            case 'setup': {
                if (FortyTwoSyncDB) {
                    const {login} = client.selectIntoDatabase('42/Users', {userId: FortyTwoSyncDB.fortyTwoUserId}); 
                    return await interaction.sendEmbed(client.createEmbed(`You Discord account is already linked with [${login}](https://profile.intra.42.fr/users/${login}) 42 account...`, {emote: 'zero', type: 'warning'}));
                };

                const selectedLogin = interaction.options.getString('login');
                const userData = client.selectIntoDatabase('42/Users', {login: selectedLogin});

                if (!userData) {
                    return await interaction.sendEmbed(client.createEmbed('Cannot find a 42 account which has this login.', {emote: 'zero', type: 'warning'}));
                } else if (client.selectIntoDatabase('42/Sync', {fortyTwoUserId: userData.userId})) {
                    return await interaction.sendEmbed(client.createEmbed('This 42 account is already linked with another Discord account...', {emote: 'zero', type: 'warning'}));
                };

                const validationEmbed = client.baseEmbed()
                    .setTitle('🔁 Linking your 42 account with you Discord account')
                    .setDescription(`- Login: **${selectedLogin}** *(In order to make sure that this 42 account is your account, you have to follow some steps)*\n- Steps:\n  - **Go** to this page: https://friends42.fr/settings/\n  - **Put** you Discord userId \`${userId}\` on your bio.\n  - **Save** with the blue button.`)
                    .setImage('https://cdn.discordapp.com/attachments/1300993150248157267/1301017221040181299/image.png');

                const validation = await client.createValidation(interaction, validationEmbed, 'Have you put your Discord userId on your Friends42 bio ?');
                if (!validation) return;

                await interaction.sendEmbed(client.createEmbed('Checking the bio...', {emote: 'chargement'}));
                await client.waitForTimeout(250);

                const data = await fetch(`https://friends42.fr/getuser/${selectedLogin}`, {
                    headers: {
                        cookie: `token=${process.env.FRIENDS_TOKEN}`
                    }
                });

                if (!data.ok) {
                    return await interaction.sendEmbed(client.createEmbed('I was not able to do the checking...', {emote: 'zero', type: 'warning'}));
                };

                try {
                    const jsonData = await data.json();
                    if (!jsonData.recit || !jsonData.recit.includes(userId)) {
                        return await interaction.sendEmbed(client.createEmbed('This 42 account does not seem to have you Discord userId in its bio...', {emote: 'zero', type: 'warning'}));
                    };
                } catch {
                    return await interaction.sendEmbed(client.createEmbed('I was not able to do the checking...', {emote: 'zero', type: 'warning'}));
                };
               
                client.insertIntoDatabase('42/Sync', {
                    discordUserId: userId,
                    fortyTwoUserId: userData.userId,
                    dmChannelId: interaction.channelId,
                    syncKey
                });

                await interaction.sendEmbed(client.createEmbed(`Your Discord account has been linked with the \`${login}\` 42 account successfully!`, {emote: 'hundred', type: 'success'}));
                break;
            };

            case 'reset_auth_key': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                const validationEmbed = client.baseEmbed()
                    .setTitle('🔁 Authentication key reset request')
                    .setDescription('You will have a new authentication key and the current one will be deleted.');
        
                const validation = await client.createValidation(interaction, validationEmbed, 'Do you confirm that you want another authentication key ?');
                if (!validation) return;

                client.updateIntoDatabase('42/Sync', {syncKey}, {discordUserId: userId});
                await interaction.sendEmbed(client.createEmbed(`The authentication has been resetted successfully and has been replaced by \`${syncKey}\`. Don't forget to edit your \`userKey\` file and to relog.`, {emote: 'hundred', type: 'warning'}));
                break;
            };

            case 'unlink': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                const validationEmbed = client.baseEmbed()
                    .setTitle('🗑️ Link to a 42 account deletion request')
                    .setDescription('You will be able to link your Discord account with a 42 account and your authentication key will be deleted.');
        
                const validation = await client.createValidation(interaction, validationEmbed, 'Do you really want to unlink your Discord account with your 42 account ?');
                if (!validation) return;

                client.deleteIntoDatabase('42/Sync', {discordUserId: userId});
                await interaction.sendEmbed(client.createEmbed('The link between your Discord account and your 42 account has been removed!', {emote: 'hundred', type: 'warning'}));
                break;
            };
        };
    }
});

Link.data
    .addSubcommand((subcommand) => subcommand.setName('lock_system').setDescription('❓• Gives informations about how to setup the lock system.'))
    .addSubcommand((subcommand) => subcommand.setName('setup').setDescription('🔄️ • Links your Discord account with your 42 account.').addStringOption((option) => option.setName('login').setDescription('🆔 • Your 42 login.').setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('reset_auth_key').setDescription('🔁 • Resets your authentication key (For the lock system).'))
    .addSubcommand((subcommand) => subcommand.setName('unlink').setDescription('🗑️• Unlinks your Discord account with you 42 account.'));

module.exports = Link;
