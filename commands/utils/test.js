const {DiscordCommand} = require('../../system/structures/command');

const Test = new DiscordCommand({
  name: 'test',
  description: 'TEST',
  enDescription: 'TEST',
  category: 'TEST',
  enCategory: 'TEST',
  ephemeral: true,
  run: async (client, interaction) => {
    await client.waitForTimeout(5000);
    return await await interaction.sendEmbed(client.createEmbed('TEST', {emote: 'hundred', type: 'success'}));
  },
});

module.exports = Test;
