/** Classe qui régit les événements du bot. */
class Event {
/**
 * Crée une instance de la classe Event.
 * @param {Object} param L'objet qui définit l'instance.
 * @param {String} param.name Le nom de l'événement.
 * @param {Function} param.run La fonction de l'événement.
 * @param {boolean} [param.once=false] Lancer qu'une seule fois l'événement ?
 */
  constructor({name, run, once=false}) {
    this.name = name;
    this.run = run;
    this.once = once;
  };
};

module.exports = Event;
