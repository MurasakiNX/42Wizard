/**
 * Initialise les emotes pour le bot Discord.
 * @param {DiscordClient} client Le client Discord.
 */
async function initEmotes(client) {
  const emojis = await client.application.emojis.fetch();

  emojis.map(async (emoji) => {
    client.emotes[emoji.name] = emoji.animated ? `<${emoji.identifier}>` : `<:${emoji.identifier}>`;
  });

  console.log(`✅ [DISCORD] Emotes initialisées !`);
};

module.exports = initEmotes;
