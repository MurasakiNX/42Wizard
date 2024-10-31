const {AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder} = require('discord.js');
const {deburr} = require('lodash');

/**
 * Initialise les functions pour le bot Discord.
 * @param {DiscordClient} client Le client Discord.
 */
async function functions(client) {
  // Messages
  client.fetchChannel = async (channelId) => {
    try {
      return await client.channels.fetch(channelId);
    } catch {
      return;
    };
  };

  client.fetchMessage = async (channelId, messageId) => {
    try {
      const channel = await client.fetchChannel(channelId);
      return await channel.messages.fetch(messageId);
    } catch {
      return;
    };
  };

  client.sendMessage = async (channelId, messageEmbed) => {
    try {
      if (channelId === 'no_dm_channel') return;
      const channel = await client.fetchChannel(channelId);
      return await channel.send({embeds: [messageEmbed]});
    } catch {
      return;
    };
  };

  client.editMessage = async (channelId, messageId, messageEmbed) => {
    try {
      const message = await client.fetchMessage(channelId, messageId);
      return await message.edit(messageEmbed);
    } catch {
      return;
    };
  };

  client.deleteMessage = async (channelId, messageId) => {
    try {
      const message = await client.fetchMessage(channelId, messageId);
      return await message.delete();
    } catch {
      return;
    };
  };

  // Users
  client.fetchUser = async (userId) => {
    try {
      return await client.users.fetch(userId);
    } catch {
      return;
    };
  };

  // Embeds
  client.baseEmbed = () => {
    return new EmbedBuilder()
        .setColor(client.colors.default)
        .setFooter({text: client.user.username, iconURL: client.getAvatar(client.user.id)})
        .setTimestamp();
  };

  client.createEmbed = (message, {emote='', type='default'}) => {
    return new EmbedBuilder()
        .setColor(client.colors[type])
        .setDescription(`${client.getEmote(emote)} **${message}**`);
  };

  // Utils
  client.getAvatar = (userId) => client.users.cache.get(userId)?.displayAvatarURL({format: 'png', dynamic: true, size: 512}) || '';

  client.getEmote = (emoteName) => {
    return client.emotes[emoteName] || client.emotes[Object.keys(client.emotes).find((emote) => deburr(emote.toLowerCase()).replace(/[^a-z0-9]/g, '') === deburr(emoteName.toLowerCase()).replace(/[^a-z0-9]/g, ''))] || client.emotes.no_emote;
  };

  client.createAttachment = async (buffer, name) => {
    let url = '';
    const attachment = new AttachmentBuilder(buffer, {name: name.replace(/ +/g, '_')});
    const channel = await client.fetchChannel(client.exportsChannelId);
    if (channel) {
      url = (await channel.send({files: [attachment]})).attachments.first().url;
    };
    return url;
  };

  client.isClientOwner = (userId) => client.owners.includes(userId);
  client.setPresence = (presence) => client.user.setPresence({activities: [{name: presence, type: 0}]});

  // System
  client.createValidation = (interaction, validationEmbed, question) => {
    return new Promise(async (resolve) => {
      const now = Date.now().toString();
      const buttons = new ActionRowBuilder()
          .setComponents(new ButtonBuilder()
              .setCustomId(`${now}_confirm`)
              .setLabel('Confirm')
              .setEmoji('✅')
              .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
              .setCustomId(`${now}_cancel`)
              .setLabel('Cancel')
              .setEmoji('✖️')
              .setStyle(ButtonStyle.Danger));

      validationEmbed
          .setThumbnail(interaction.userAvatar)
          .setFields(...(validationEmbed.data.fields || []), {name: interaction.displayName, value: `${question} (If no answer, this message will be edited in one minute).`});
      const message = await interaction.editReply({embeds: [validationEmbed], components: [buttons]});

      const filter = (i) => [`${now}_confirm`, `${now}_cancel`].includes(i.customId);
      const collector = message.createMessageComponentCollector({filter, time: 60000});

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({embeds: [client.createEmbed(`I may be wrong, but you're not ${interaction.displayName}.`, {emote: 'zero', type: 'warning'})], ephemeral: true});
        };
        collector.stop(i.customId.slice(now.length + 1));
      });

      collector.on('end', async (_, answer) => {
        await interaction.editReply({components: []}).catch(() => {});
        if (answer === 'confirm') {
          return resolve(true);
        } else if (answer === 'cancel') {
          await interaction.deleteReply({components: []}).catch(() => {});
          resolve(false);
        };
        await interaction.sendEmbed(client.createEmbed('One minute elapsed, please redo the command.', {emote: 'minus_fortytwo', type: 'warning'}));
        return resolve(false);
      });
    });
  };

  client.createSelection = async (interaction, list) => {
    return new Promise(async (resolve) => {
      const now = Date.now().toString();
      const selection = new ActionRowBuilder()
          .setComponents(new StringSelectMenuBuilder()
              .setCustomId(`${now}_selection`)
              .setPlaceholder('Please select a page')
              .setOptions([{label: 'Cancel', emoji: '❌', value: 'cancel'}, ...list.map((element) => {
                if (element.emoji.length > 2) {
                  element.emoji = client.getEmote(element.emoji);
                };
                return element;
              })]));

      const message = await interaction.editReply({embeds: [client.createEmbed(`Please make a choice \`(${list.length} resultts)\`, you can cancel by chosing the cancel option *or by waiting one minute*.`, {emote: 'hundred'})], components: [selection]});
      const filter = (i) => i.customId === `${now}_selection`;
      const collector = message.createMessageComponentCollector({filter, time: 60000});

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({embeds: [client.createEmbed(`I may be wrong, but you're not ${interaction.displayName}.`, {emote: 'zero', type: 'warning'})], ephemeral: true});
        };
        collector.stop(i.values[0]);
      });

      collector.on('end', async (_, selectedPage) => {
        await interaction.editReply({components: []}).catch(() => {});
        if (!isNaN(selectedPage)) {
          return resolve(selectedPage);
        } else if (selectedPage === 'cancel') {
          await interaction.deleteReply({components: []}).catch(() => {});
          resolve('cancel');
        };
        await interaction.sendEmbed(client.createEmbed('One minute elapsed, please redo the command.', {emote: 'minus_fortytwo', type: 'warning'}));
        return resolve('cancel');
      });
    });
  };

  client.createPagesSystem = async (interaction, pages, type) => {
    const userId = interaction.user.id;
    pages.map((page, i) => {
      const pageIndex = ` (Page ${i+1}/${pages.length})`;
      page.map((level, i) => {
        level.embed.data.footer.text += pageIndex;
        if (page.length > 1) {
          level.embed.data.footer.text += ` (Level ${i+1}/${page.length})`;
        };
      });
    });

    const firstPage = pages[0];
    const firstLevelEmbed = firstPage[0].embed;

    switch (type) {
      case 'selection': {
        const selection = new ActionRowBuilder()
            .setComponents(new StringSelectMenuBuilder()
                .setCustomId('selection')
                .setPlaceholder('Please select a page')
                .setOptions([{label: 'Delete the message', emoji: '🗑️', value: 'delete'}, ...pages.map((page, i) => {
                  page = page[0];
                  return {label: page.label || page.embed.data.title.replace(/:.*:/g, '').substr(0, 100), emoji: client.getEmote(page.emote), value: String(i)};
                })]));

        const msg = await interaction.editReply({embeds: [firstLevelEmbed], components: [selection]});
        client.insertIntoDatabase('Client/PagesSystem', {
          userId,
          messageId: msg.id,
          pages: JSON.stringify(pages.map((page) => page.map((level) => level.embed.toJSON()))),
        });
        break;
      };

      case 'buttons': {
        const buttons = new ActionRowBuilder()
            .setComponents(new ButtonBuilder()
                .setCustomId('previous_page')
                .setLabel('Previous page')
                .setEmoji('⏪')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('Delete the message')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('Next page')
                .setEmoji('⏩')
                .setStyle(ButtonStyle.Primary));

        const previousLevelButton = new ButtonBuilder()
            .setCustomId('previous_level')
            .setLabel('Previous level')
            .setEmoji('⏬')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const nextLevelButton = new ButtonBuilder()
            .setCustomId('next_level')
            .setLabel('Next level')
            .setEmoji('⏫')
            .setStyle(ButtonStyle.Primary);

        const selectPageButton = new ButtonBuilder()
            .setCustomId('select_page')
            .setLabel('Select the page')
            .setEmoji('🔢')
            .setStyle(ButtonStyle.Secondary);

        const selectLevelButton = new ButtonBuilder()
            .setCustomId('select_level')
            .setLabel('Select the level')
            .setEmoji('🔢')
            .setStyle(ButtonStyle.Secondary);

        if (pages.length > 2) {
          buttons.components.splice(1, 0, selectPageButton);
        };

        if (firstPage.length > 1) {
          buttons.components.splice(1, 0, previousLevelButton);
          if (firstPage.length > 2) {
            buttons.components.splice(2, 0, selectLevelButton);
          };
          buttons.components.splice(pages.length > 2 ? 5 : 4, 0, nextLevelButton);
        };

        const splittedButtonsArrayByParts = client.splitArrayByParts(buttons.components, 5);
        const msg = await interaction.editReply({embeds: [firstLevelEmbed], components: [...Object.values(splittedButtonsArrayByParts).map((btns) => {
          const buttons = new ActionRowBuilder()
              .setComponents(...btns);
          return buttons;
        })]});
        client.insertIntoDatabase('Client/PagesSystem', {
          userId,
          messageId: msg.id,
          pages: JSON.stringify(pages.map((page) => page.map((level) => level.embed.toJSON()))),
        });
        break;
      };
    };
  };

  client.pagesSystemManager = async (interaction) => {
    const channelId = interaction.channelId;
    const messageId = interaction.message.id;
    const PagesEmbedsDB = client.selectIntoDatabase('Client/PagesSystem', {messageId});

    const buttons = new ActionRowBuilder()
        .setComponents(new ButtonBuilder()
            .setCustomId('previous_page')
            .setLabel('Previous page')
            .setEmoji('⏪')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('delete')
            .setLabel('Delete the message')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('Next page')
            .setEmoji('⏩')
            .setStyle(ButtonStyle.Primary));

    const previousLevelButton = new ButtonBuilder()
        .setCustomId('previous_level')
        .setLabel('Previous level')
        .setEmoji('⏬')
        .setStyle(ButtonStyle.Primary);

    const nextLevelButton = new ButtonBuilder()
        .setCustomId('next_level')
        .setLabel('Next level')
        .setEmoji('⏫')
        .setStyle(ButtonStyle.Primary);

    const selectPageButton = new ButtonBuilder()
        .setCustomId('select_page')
        .setLabel('Select the page')
        .setEmoji('🔢')
        .setStyle(ButtonStyle.Secondary);

    const selectLevelButton = new ButtonBuilder()
        .setCustomId('select_level')
        .setLabel('Select the level')
        .setEmoji('🔢')
        .setStyle(ButtonStyle.Secondary);

    if (PagesEmbedsDB) {
      const userId = PagesEmbedsDB.userId;
      const customId = interaction.customId;
      const selectedPage = customId === 'selection' ? interaction.values[0] : '';

      if (interaction.user.id !== userId) {
        const user = await client.fetchUser(userId);
        if (user) {
          const displayName = user.globalName || user.username;
          return await interaction.reply({embeds: [client.createEmbed(`I may be wrong, but you're not ${displayName}.`, {emote: 'zero', type: 'warning'})], ephemeral: true});
        };
        return await interaction.reply({embeds: [client.createEmbed('Only the person that has done this command can navigate between pages.', {emote: 'zero', type: 'warning'})], ephemeral: true});
      };

      const pages = JSON.parse(PagesEmbedsDB.pages);
      switch (customId) {
        case 'selection': {
          if (selectedPage === 'delete') {
            if (!await client.deleteMessage(channelId, messageId)) {
              await interaction.update({components: []});
            };
            client.deleteIntoDatabase('Client/PagesSystem', {messageId});
          } else {
            const page = pages[selectedPage][0];
            const embed = new EmbedBuilder(page);
            await interaction.update({embeds: [embed]}).catch(() => {});
          };
          break;
        };

        case 'previous_page':
        case 'next_page':
        case 'select_page': {
          let selectedPage;
          const currentPage = pages.findIndex((page) => page[0].footer.text.match(/\(([^)]+)\)/g)[0] === interaction.message.embeds[0].data.footer.text.match(/\(([^)]+)\)/g)[0]);
          const currentLevel = pages[currentPage].findIndex((level) => level.footer.text.match(/\(([^)]+)\)/g)[1] === interaction.message.embeds[0].data.footer.text.match(/\(([^)]+)\)/g)[1]);
          const page = pages[currentPage];

          if (customId === 'select_page') {
            const now = Date.now().toString();
            const selectPageModal = new ModalBuilder()
                .setCustomId(`${now}_select_page`)
                .setTitle('🔢 Select the page')
                .setComponents(new ActionRowBuilder().setComponents(
                    new TextInputBuilder()
                        .setCustomId('selected_page')
                        .setLabel('Page number')
                        .setPlaceholder('Please enter the page number')
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(pages.length.toString().length)
                        .setRequired(true)));
            await interaction.showModal(selectPageModal);

            const filter = (i) => i.customId === `${now}_select_page`;

            selectedPage = await interaction.awaitModalSubmit({time: 300000, filter})
                .then((i) => {
                  interaction = i;
                  const page = +interaction.fields.getTextInputValue('selected_page');
                  if (isNaN(page) || page < 1 || page > pages.length) return currentPage;
                  return page - 1;
                })
                .catch(() => 'time');
            if (selectedPage === 'time') return;
          } else {
            selectedPage = currentPage + (customId === 'previous_page' ? -1 : 1);
          };

          const sPage = pages[selectedPage];
          const embed = new EmbedBuilder(sPage[0]);

          if (pages.length > 2) {
            buttons.components.splice(1, 0, selectPageButton);
          };

          if (sPage.length > 1) {
            buttons.components.splice(1, 0, previousLevelButton);
            if (sPage.length > 2) {
              buttons.components.splice(2, 0, selectLevelButton);
            };
            buttons.components.splice(pages.length > 2 ? 5 : 4, 0, nextLevelButton);

            const newPreviousLevelButton = buttons.components.find((button) => button.data.custom_id === 'previous_level');
            const newNextLevelButton = buttons.components.find((button) => button.data.custom_id === 'next_level');

            if (currentLevel === 0) {
              newPreviousLevelButton.setDisabled(true);
            } else if (currentLevel > 0 && currentLevel < page.length - 1) {
              newPreviousLevelButton.setDisabled(false);
              newNextLevelButton.setDisabled(false);
            } else {
              newPreviousLevelButton.setDisabled(false);
              newNextLevelButton.setDisabled(true);
            };
          };

          const newPreviousPageButton = buttons.components.find((button) => button.data.custom_id === 'previous_page');
          const newNextPageButton = buttons.components.find((button) => button.data.custom_id === 'next_page');

          if (selectedPage === 0) {
            newPreviousPageButton.setDisabled(true);
          } else if (selectedPage > 0 && selectedPage < pages.length - 1) {
            newPreviousPageButton.setDisabled(false);
            newNextPageButton.setDisabled(false);
          } else {
            newNextPageButton.setDisabled(true);
          };

          const splittedButtonsArrayByParts = client.splitArrayByParts(buttons.components, 5);
          await interaction.update({embeds: [embed], components: [...Object.values(splittedButtonsArrayByParts).map((btns) => {
            const buttons = new ActionRowBuilder()
                .setComponents(...btns);
            return buttons;
          })]}).catch(() => {});
          break;
        };

        case 'previous_level':
        case 'next_level':
        case 'select_level': {
          let selectedLevel;
          const currentPage = pages.findIndex((page) => page[0].footer.text.match(/\(([^)]+)\)/g)[0] === interaction.message.embeds[0].data.footer.text.match(/\(([^)]+)\)/g)[0]);
          const currentLevel = pages[currentPage].findIndex((level) => level.footer.text.match(/\(([^)]+)\)/g)[1] === interaction.message.embeds[0].data.footer.text.match(/\(([^)]+)\)/g)[1]);
          const page = pages[currentPage];

          if (interaction.customId === 'select_level') {
            const now = Date.now().toString();
            const selectLevelModal = new ModalBuilder()
                .setCustomId(`${now}_select_level`)
                .setTitle('🔢 Select the level')
                .setComponents(new ActionRowBuilder().setComponents(
                    new TextInputBuilder()
                        .setCustomId('selected_level')
                        .setLabel('Level number')
                        .setPlaceholder('Please enter the level number')
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(pages[currentPage].length.toString().length)
                        .setRequired(true)));
            await interaction.showModal(selectLevelModal);

            const filter = (i) => i.customId === `${now}_select_level`;

            selectedLevel = await interaction.awaitModalSubmit({time: 300000, filter})
                .then((i) => {
                  interaction = i;
                  const level = +interaction.fields.getTextInputValue('selected_level');
                  if (isNaN(level) || level < 1 || level > page.length) return currentLevel;
                  return level - 1;
                })
                .catch(() => 'time');
            if (selectedLevel === 'time') return;
          } else {
            selectedLevel = currentLevel + (interaction.customId === 'previous_level' ? -1 : 1);
          };

          const sLevel = page[selectedLevel];
          const embed = new EmbedBuilder(sLevel);

          if (pages.length > 2) {
            buttons.components.splice(1, 0, selectPageButton);
          };

          if (page.length > 1) {
            buttons.components.splice(1, 0, previousLevelButton);
            if (page.length > 2) {
              buttons.components.splice(2, 0, selectLevelButton);
            };
            buttons.components.splice(pages.length > 2 ? 5 : 4, 0, nextLevelButton);

            const newPreviousLevelButton = buttons.components.find((button) => button.data.custom_id === 'previous_level');
            const newNextLevelButton = buttons.components.find((button) => button.data.custom_id === 'next_level');

            if (selectedLevel === 0) {
              newPreviousLevelButton.setDisabled(true);
            } else if (selectedLevel > 0 && selectedLevel < page.length - 1) {
              newPreviousLevelButton.setDisabled(false);
              newNextLevelButton.setDisabled(false);
            } else {
              newPreviousLevelButton.setDisabled(false);
              newNextLevelButton.setDisabled(true);
            };
          };

          const newPreviousPageButton = buttons.components.find((button) => button.data.custom_id === 'previous_page');
          const newNextPageButton = buttons.components.find((button) => button.data.custom_id === 'next_page');

          if (currentPage === 0) {
            newPreviousPageButton.setDisabled(true);
          } else if (currentPage > 0 && currentPage < pages.length - 1) {
            newPreviousPageButton.setDisabled(false);
            newNextPageButton.setDisabled(false);
          } else {
            newNextPageButton.setDisabled(true);
          };

          const splittedButtonsArrayByParts = client.splitArrayByParts(buttons.components, 5);
          await interaction.update({embeds: [embed], components: [...Object.values(splittedButtonsArrayByParts).map((btns) => {
            const buttons = new ActionRowBuilder()
                .setComponents(...btns);
            return buttons;
          })]}).catch(() => {});
          break;
        };

        case 'delete': {
          if (!await client.deleteMessage(channelId, messageId)) {
            await interaction.update({components: []});
          };
          client.deleteIntoDatabase('Client/PagesSystem', {messageId});
          break;
        };
      };
    };
  };
};

module.exports = functions;
