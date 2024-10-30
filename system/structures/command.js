const {PermissionFlagsBits, SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType} = require('discord.js');

/** Classe qui régit les commandes du bot. */
class Command {
  /**
     * Crée une instance de la classe Command.
     * @param {Object} param L'objet qui définit l'instance.
     * @param {String} param.name Le nom de la commande.
     * @param {String} param.enName Le nom anglais de la commande.
     * @param {String} param.description La description de la commande.
     * @param {String} param.category La catégorie de la commande.
     * @param {Function} param.run La fonction de la commande.
     * @param {Boolean} param.ownerOnly Seuls les propriétaires peuvent faire la commande ?
     */
  constructor({name, description, category, run, ownerOnly=false}) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.run = run;
    this.ownerOnly = ownerOnly;
  };
};

/** Classe qui régit les commandes Discord du bot. */
class DiscordCommand extends Command {
  /**
   * Crée une instance de la classe DiscordCommand.
   * @param {Object} param L'objet qui définit l'instance.
   * @param {String} param.name Le nom de la commande.
   * @param {String} param.description La description de la commande.
   * @param {String} param.category La catégorie de la commande.
   * @param {Function} param.run La fonction de la commande.
   * @param {Boolean} param.ownerOnly Seul vous pouvez faire la commande ?
   * @param {Boolean} [param.dmOnly=false] MP seulement ?
   * @param {Boolean} [param.guildOnly=false] Serveur uniquement ?
   * @param {Boolean} [param.ephemeral=false] Commande éphémère ?
   * @param {Number | null} param.permissions Les perms nécessaires.
   */
  constructor({name, description, category, run, ownerOnly=false, dmOnly=false, guildOnly=false, ephemeral=false, permissions=null}) {
    super({name, description, category, run, ownerOnly});
    this.dmOnly = dmOnly;
    this.guildOnly = guildOnly;
    this.ephemeral = ephemeral;
    this.permissions = permissions;

    this.data = new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(`[${this.category}] • ${this.description}`)
        .setContexts(this.guildOnly ? [InteractionContextType.Guild] : [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
        .setDefaultMemberPermissions(this.ownerOnly ? PermissionFlagsBits.BanMembers : this.permissions);
  };
};

module.exports = {DiscordCommand};
