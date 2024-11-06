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
                } else if (!FortyTwoSyncDB.verified) {
                    return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                const informationsEmbed = client.baseEmbed()
                    .setTitle('❓ How to setup the lock system ?')
                    .setDescription(`- Steps:\n  - **Create** a \`.42Wizard\` directory (It is an hidden directory, make sure that you can see them) on your \`HOME\` and download (https://github.com/MurasakiNX/42Wizard/blob/main/script.sh) in it. *(Don't forget to make it executable \`chmod +x\`)*.\n  - **Create** a \`userKey\` file in the \`.42Wizard\` directory and put your authentication key in it.\n\n- **Run** this script (https://github.com/MurasakiNX/42Wizard/blob/main/autostart.sh) on a terminal to run automatically the lock system when you log in *(Don't forget to relog after that).*\n\n- Authentication key: \`${FortyTwoSyncDB.syncKey}\`\n\n*When the script is running, check that your host is not \`Unavailable\` on the intra. If it is, 42Wizard won't let your computer do the requests, as it won't be able to detect where you are logged in at. So, when you've just logged in, it may take a few minutes before the system is really working.*`)
                    .setImage('https://cdn.discordapp.com/attachments/1300993150248157267/1301168349425700966/image.png');

                await interaction.sendEmbed(informationsEmbed);
                break;
            };

            case 'setup': {
                if (FortyTwoSyncDB) {
                    if (!FortyTwoSyncDB.verified) {
                        return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                    };
                    const {login} = client.selectIntoDatabase('42/Users', {userId: FortyTwoSyncDB.fortyTwoUserId}); 
                    return await interaction.sendEmbed(client.createEmbed(`Your Discord account is already linked with [${login}](https://profile.intra.42.fr/users/${login}) 42 account...`, {emote: 'zero', type: 'warning'}));
                };

                const selectedLogin = interaction.options.getString('login');
                const userData = client.selectIntoDatabase('42/Users', {login: selectedLogin});

                if (!userData) {
                    return await interaction.sendEmbed(client.createEmbed('Cannot find a 42 account which has this login.', {emote: 'zero', type: 'warning'}));
                } else if (client.selectIntoDatabase('42/Sync', {fortyTwoUserId: userData.userId, verified: 1})) {
                    return await interaction.sendEmbed(client.createEmbed('This 42 account is already linked with another Discord account...', {emote: 'zero', type: 'warning'}));
                };

                client.deleteIntoDatabase('42/Sync', {fortyTwoUserId: userData.userId});
                const validationEmbed = client.baseEmbed()
                    .setTitle('🔁 Linking your 42 account with you Discord account')
                    .setDescription(`- Login: **[${selectedLogin}](https://profile.intra.42.fr/users/${selectedLogin})**`);

                const validation = await client.createValidation(interaction, validationEmbed, 'In order to make sure that this 42 account is your account, you will receive a confirmation link in your student mailbox. Do you confirm that ?');
                if (!validation) return;

                await interaction.sendEmbed(client.createEmbed('Sending the confimation mail...', {emote: 'chargement'}));
                await client.waitForTimeout(250);
                
                if (!await client.sendMail(`${selectedLogin}@student.42.fr`, 'Link to a Discord account confirmation mail', `If you do not recognize this mail, please ignore it.\nYou can verify the link between your Discord account and your 42 account by following this link\n<a href="https://42Wizard.fr/confirm/${syncKey}" target="_blank" style="text-decoration: none; color:#00babc;">https://42Wizard.fr/confirm/${syncKey}</a>\n(This link will expire after 5 minutes)`)) {
                    return await interaction.sendEmbed(client.createEmbed('I was not able to send you the confirmation mail...', {emote: 'zero', type: 'warning'}));
                };

                client.insertIntoDatabase('42/Sync', {
                    discordUserId: userId,
                    fortyTwoUserId: userData.userId,
                    dmChannelId: interaction.channelId,
                    syncKey,
                    mailEnabled: 1,
                    avatarEnabled: 0,
                    hidden: 0,
                    enabled: 1,
                    verified: 0,
                    syncedAt: Date.now()
                });

                await interaction.sendEmbed(client.createEmbed(`A confirmation mail has been sent, you have 5 minutes to verify your 42 account (Don't forget to check the spams and make sure that the link you will receive ends with \`${syncKey.slice(-5)}\`). If you have made a mistake, please unlink your account by using the </link unlink:1301665165615304745> command!`, {emote: 'hundred', type: 'success'}));
                break;
            };

            case 'my_settings': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                } else if (!FortyTwoSyncDB.verified) {
                    return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                const UserDB = client.selectIntoDatabase('42/Users', {userId: FortyTwoSyncDB.fortyTwoUserId});
                const mySettingsEmbed = client.baseEmbed()
                    .setTitle('⚙️ My 42Wizard settings')
                    .setThumbnail(UserDB.image)
                    .setDescription(`- Login: **[${UserDB.login}](https://profile.intra.42.fr/users/${UserDB.login})**\n**Settings**\n- System: **${FortyTwoSyncDB.enabled ? "✅ Enabled" : "❌ Disabled"}**\n- Mails: **${FortyTwoSyncDB.mailEnabled ? "✅ Enabled" : "❌ Disabled"}**\n- Avatar: **${FortyTwoSyncDB.avatarEnabled ? "✅ Visible" : "❌ Not visible"}**\n- Hidden status: **${FortyTwoSyncDB.hidden ? "❌ Hidden" : "✅ Visible"} from the other students**`);

                await interaction.sendEmbed(mySettingsEmbed);
                break;
            };

            case 'reset_auth_key': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                } else if (!FortyTwoSyncDB.verified) {
                    return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                const validationEmbed = client.baseEmbed()
                    .setTitle('🔁 Authentication key reset request')
                    .setDescription('You will have a new authentication key and the current one will be deleted.');
        
                const validation = await client.createValidation(interaction, validationEmbed, 'Do you confirm that you want another authentication key ?');
                if (!validation) return;

                client.updateIntoDatabase('42/Sync', {syncKey}, {discordUserId: userId});
                await interaction.sendEmbed(client.createEmbed(`The authentication has been resetted successfully and has been replaced by \`${syncKey}\`. Don't forget to edit your \`userKey\` file.`, {emote: 'hundred', type: 'warning'}));
                break;
            };

            case 'toggle_mail': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                } else if (!FortyTwoSyncDB.verified) {
                    return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                client.updateIntoDatabase('42/Sync', {mailEnabled: Number(!FortyTwoSyncDB.mailEnabled)}, {discordUserId: userId});
                await interaction.sendEmbed(client.createEmbed(`The mails from 42Wizard have been successfully \`${FortyTwoSyncDB.mailEnabled ? 'disabled' : 'enabled'}\`!`, {emote: 'hundred', type: 'success'}));
                break;
            };

            case 'toggle_avatar': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                } else if (!FortyTwoSyncDB.verified) {
                    return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                client.updateIntoDatabase('42/Sync', {avatarEnabled: Number(!FortyTwoSyncDB.avatarEnabled)}, {discordUserId: userId});

                if (FortyTwoSyncDB.avatarEnabled) {
                    client.updateIntoDatabase('42/Users', {image: client.defaultAvatar}, {userId: FortyTwoSyncDB.fortyTwoUserId});
                };

                await interaction.sendEmbed(client.createEmbed(`Your avatar on 42Wizard is now \`${FortyTwoSyncDB.avatarEnabled ? 'not visible' : 'visible'}\`! If it is now visible, you have to wait a few seconds and be connected on a host to see it.`, {emote: 'hundred', type: 'success'}));
                break;
            };

            case 'toggle_hidden': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                } else if (!FortyTwoSyncDB.verified) {
                    return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                client.updateIntoDatabase('42/Sync', {hidden: Number(!FortyTwoSyncDB.hidden)}, {discordUserId: userId});

                await interaction.sendEmbed(client.createEmbed(`Your are now \`${FortyTwoSyncDB.hidden ? 'visible' : 'hidden'}\` from the other students!`, {emote: 'hundred', type: 'success'}));
                break;
            };

            case 'toggle_enabled': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('You have not linked your 42 account with your Discord account yet... You can do it with the </link setup:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                } else if (!FortyTwoSyncDB.verified) {
                    return await interaction.sendEmbed(client.createEmbed('Please verify your account by checking your mails, if the 42 account you have specified is incorrect, please remove it by using the </link unlink:1301665165615304745> command!', {emote: 'zero', type: 'warning'}));
                };

                client.updateIntoDatabase('42/Sync', {hidden: Number(!FortyTwoSyncDB.enabled)}, {discordUserId: userId});

                await interaction.sendEmbed(client.createEmbed(`The system is now \`${FortyTwoSyncDB.enabled ? 'disabled' : 'enabled'}\` on your account!`, {emote: 'hundred', type: 'success'}));
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
    .addSubcommand((subcommand) => subcommand.setName('my_settings').setDescription('⚙️• Gives your 42Wizard settings.'))
    .addSubcommand((subcommand) => subcommand.setName('reset_auth_key').setDescription('🔁 • Resets your authentication key (For the lock system).'))
    .addSubcommand((subcommand) => subcommand.setName('toggle_mail').setDescription('✉️ • Enables or disables 42Wizard mails for your account.'))
    .addSubcommand((subcommand) => subcommand.setName('toggle_avatar').setDescription('🖼️ • Enables or disables 42Wizard to show your avatar on its commands.'))
    .addSubcommand((subcommand) => subcommand.setName('toggle_hidden').setDescription('👻 • Hide or show your account to the students.'))
    .addSubcommand((subcommand) => subcommand.setName('toggle_enabled').setDescription('✅/❌ • Enables or disables the system on your account.'))
    .addSubcommand((subcommand) => subcommand.setName('unlink').setDescription('🗑️• Unlinks your Discord account with you 42 account.'));

module.exports = Link;
