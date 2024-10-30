require('dotenv').config();
const {DiscordCommand} = require('../../system/structures/command');
const {readFileSync} = require('fs');
const crypto = require('crypto');

const Liaison42 = new DiscordCommand({
    name: 'liaison_42',
    description: 'Commandes de gestion de la liaison de votre compte 42 et votre compte Discord.',
    category: '⚙️ Autres',
    ephemeral: true,
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const syncKey = crypto.randomBytes(32).toString('hex').slice(0, 32);

        const FortyTwoSyncDB = client.selectIntoDatabase('42/Sync', {discordUserId: userId});

        switch (subcommand) {
            case 'informations': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('Vous n\'avez pas encore relié votre compte 42 avec votre compte Discord...', {emote: 'zero', type: 'warning'}));
                };

                const userData = client.selectIntoDatabase('42/Users', {userId: FortyTwoSyncDB.fortyTwoUserId});
                const informationsEmbed = client.baseEmbed()
                    .setTitle(`❓ Informations du profil 42 ${userData.login}`)
                    .setDescription(`- Étapes:\n  - **Créez** un dossier \`.42Wizard\` (C'est un dossier caché, n'oubliez pas de les afficher) dans votre \`home\` et placez le code ci-dessous dans un fichier \`script.sh\` (N'oubliez pas de \`chmod +x\`).\n  - **Créez** un fichier \`userKey\` dans le dossier \`.42Wizard\` et inscrivez-y la clé d'identification.\n\n- **Exécutez** ce script avec ce que vous voulez (Minishell ???).\n- Clé d'identification: \`${FortyTwoSyncDB.syncKey}\`\n- Script de détection:\n\`\`\`sh\n${readFileSync('./script.sh', 'utf8')}\`\`\`\n- Script de lancement automatique:\n\`\`\`sh\n${readFileSync('./autostart.sh', 'utf8')}\`\`\``)
                    .setImage('https://cdn.discordapp.com/attachments/1300993150248157267/1301168349425700966/image.png');

                await interaction.sendEmbed(informationsEmbed);
                break;
            };

            case 'mettre_en_place': {
                if (FortyTwoSyncDB) {
                    const {login} = client.selectIntoDatabase('42/Users', {userId: FortyTwoSyncDB.fortyTwoUserId}); 
                    return await interaction.sendEmbed(client.createEmbed(`Votre compte Discord est déjà relié au compte 42 [${login}](https://profile.intra.42.fr/users/${login})`, {emote: 'zero', type: 'warning'}));
                };

                const selectedLogin = interaction.options.getString('login');
                const userData = client.selectIntoDatabase('42/Users', {login: selectedLogin});

                if (!userData) {
                    return await interaction.sendEmbed(client.createEmbed('Je n\'ai trouvé aucun utilisateur 42 avec cette recherche...', {emote: 'zero', type: 'warning'}));
                } else if (client.selectIntoDatabase('42/Sync', {fortyTwoUserId: userData.userId})) {
                    return await interaction.sendEmbed(client.createEmbed('Cet utilisateur 42 est déjà relié à un compte Discord...', {emote: 'zero', type: 'warning'}));
                };

                const validationEmbed = client.baseEmbed()
                    .setTitle('🔁 Confirmation de la liaison de votre compte Discord avec votre compte 42')
                    .setDescription(`- Login: **${selectedLogin}**\n- Étapes:\n  - **Allez** sur cette page: https://friends42.fr/settings/\n  - **Ajoutez** cet identifiant à votre biographie (Comme sur la pièce jointe): \`${userId}\`\n  - **Faites** sauvegarder.`)
                    .setImage('https://cdn.discordapp.com/attachments/1300993150248157267/1301017221040181299/image.png');

                const validation = await client.createValidation(interaction, validationEmbed, 'Confirmer la liaison de votre compte Discord avec votre compte 42 ?');
                if (!validation) return;

                await interaction.sendEmbed(client.createEmbed('Vérification en cours...', {emote: 'chargement'}));
                await client.waitForTimeout(500);

                const data = await fetch(`https://friends42.fr/getuser/${selectedLogin}`, {
                    headers: {
                        cookie: `token=${process.env.FRIENDS_TOKEN}`
                    }
                });

                if (!data.ok) {
                    return await interaction.sendEmbed(client.createEmbed('Je ne suis malheureusement pas parvenu à effectuer les vérifications...', {emote: 'zero', type: 'warning'}));
                };

                try {
                    const jsonData = await data.json();
                    if (!jsonData.recit || !jsonData.recit.includes(userId)) {
                        return await interaction.sendEmbed(client.createEmbed('Ce compte 42 ne comporte pas la signature dans sa biographie...', {emote: 'zero', type: 'warning'}));
                    };
                } catch {
                    return await interaction.sendEmbed(client.createEmbed('Je ne suis malheureusement pas parvenu à effectuer les vérifications...', {emote: 'zero', type: 'warning'}));
                };
               
                client.insertIntoDatabase('42/Sync', {
                    discordUserId: userId,
                    fortyTwoUserId: userData.userId,
                    dmChannelId: interaction.channelId,
                    syncKey
                });

                await interaction.sendEmbed(client.createEmbed('Votre compte Discord a bien été relié avec votre compte 42, vous pouvez remettre votre biographie d\'origine.', {emote: 'hundred', type: 'success'}));
                break;
            };

            case 'réinitialiser_clé': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('Vous n\'avez pas encore relié votre compte 42 avec votre compte Discord...', {emote: 'zero', type: 'warning'}));
                };

                const validationEmbed = client.baseEmbed()
                    .setTitle('🔁 Confirmation de la réinitialisation de votre clé d\'identification pour le BOT')
                    .setDescription('Vous obtiendrez une nouvelle clé et l\'ancienne sera supprimée.');
        
                const validation = await client.createValidation(interaction, validationEmbed, 'Confirmer la réinitialisation de votre clé ?');
                if (!validation) return;

                client.updateIntoDatabase('42/Sync', {syncKey}, {discordUserId: userId});
                await interaction.sendEmbed(client.createEmbed('La clé d\'identification pour le BOT a bien été réinitialisée.', {emote: 'hundred', type: 'warning'}));
                break;
            };

            case 'retirer': {
                if (!FortyTwoSyncDB) {
                    return await interaction.sendEmbed(client.createEmbed('Vous n\'avez pas encore relié votre compte 42 avec votre compte Discord...', {emote: 'zero', type: 'warning'}));
                };

                const validationEmbed = client.baseEmbed()
                    .setTitle('🗑️ Confirmation du retrait de la liaison de votre compte Discord avec votre compte 42')
                    .setDescription('Vous pourrez remettre en place la liaison de votre compte Discord avec votre compte 42 si vous le souhaitez. Si vous retirez la liaison, vous n\'aurez plus accès à certaines de mes fonctionnalités (Notamment sur le système de rappel de reconnexion) car votre clé sera supprimée également.');
        
                const validation = await client.createValidation(interaction, validationEmbed, 'Confirmer le retrait de la liaison de votre compte Discord avec votre compte 42 ?');
                if (!validation) return;

                client.deleteIntoDatabase('42/Sync', {discordUserId: userId});
                await interaction.sendEmbed(client.createEmbed('La liaison entre votre compte 42 et votre compte Discord a correctement été retirée.', {emote: 'hundred', type: 'warning'}));
                break;
            };
        };
    }
});

Liaison42.data
    .addSubcommand((subcommand) => subcommand.setName('informations').setDescription('❓• Donne des informations sur la liaison de votre compte Discord et votre compte 42.'))
    .addSubcommand((subcommand) => subcommand.setName('mettre_en_place').setDescription('🔄️ • Relie votre compte Discord avec votre compte 42.').addStringOption((option) => option.setName('login').setDescription('🆔 • Le login du compte 42 à relier à votre compte Discord.').setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('réinitialiser_clé').setDescription('🔁 • Réinitialise votre clé d\'identification pour le BOT.'))
    .addSubcommand((subcommand) => subcommand.setName('retirer').setDescription('🗑️• Retire la liaison de votre compte Discord avec votre compte 42.'));

module.exports = Liaison42;
