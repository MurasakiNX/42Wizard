const {deburr} = require('lodash');
const {selectAllIntoDatabase, selectIntoDatabase, insertIntoDatabase, updateIntoDatabase, deleteIntoDatabase} = require('../../ClientManager');
const {STATUS_CODES} = require('http');
const {readFileSync} = require('fs');
const nodemailer = require('nodemailer');

/**
 * Initialise les fonctions globales du bot.
 * @param {DiscordClient} client Le client Discord.
 */
async function functions(client) {
    // Databases
    client.selectAllIntoDatabase = selectAllIntoDatabase;
    client.selectIntoDatabase = selectIntoDatabase;
    client.insertIntoDatabase = insertIntoDatabase;
    client.updateIntoDatabase = updateIntoDatabase;
    client.deleteIntoDatabase = deleteIntoDatabase;

    // Utils
    client.compareText = (originalText, comparedText) => {
        const words = comparedText.split(' ');
        const occurences = words.filter((word) => deburr(originalText.toLowerCase()).replace(/[^a-z0-9]/g, '').includes(deburr(word.toLowerCase()).replace(/[^a-z0-9]/g, '')));
        return (occurences.length / words.length) >= 1;
    };

    client.waitForTimeout = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    client.removeHTMLTagsFromText = (text) => {
      return text.replace(/(<([^>]+)>)/g, '');
    };

    client.splitArrayByParts = (array, parts=10) => {
        const result = [[]];
    
        for (const element of array) {
          const lastPart = result.at(-1);
          if (lastPart.length === parts) {
            result.push([element]);
          } else {
            lastPart.push(element);
          };
        };
    
        return result;
    };

    client.sendStatus = (res, status, sendData={}, json=true) => {
      if (json) {
        return res.status(status).json({...client.baseResponse, status, response: STATUS_CODES[status], ...sendData});
      };
      return res.status(status).send(sendData);
    };

    // E-mailing
    client.sendMail = (to, subject, text) => {
      return new Promise((resolve) => {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

        transporter.sendMail({
          from: `42Wizard <${process.env.EMAIL_USER}>`,
          to,
          subject,
          text: client.removeHTMLTagsFromText(text),
          html: readFileSync('email_template.html', 'utf8')
                .replaceAll('$subject', subject)
                .replace('$text', text.replaceAll('\n', '<br/>'))
        }, (err) => resolve(!err));
      });
    };

    // 42 API
    client.getParisCampusLocations = async () => {
      const output = [];
      const syncedUsers = client.selectAllIntoDatabase('42/Sync', {verified: 1});

      const params = new URLSearchParams();
      params.append('campus_id', '1');
      params.append('per_page', '100');
      params.append('filter[active]', 'true');

      let goToNextPage = true;
      let pageId = 1;
      while (goToNextPage) {
        if (pageId !== 1) {
          await client.waitForTimeout(250);
        };

        params.set('page', String(pageId));
        const data = await fetch(`https://api.intra.42.fr/v2/locations?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${client.accessToken}`
          }
        });

        const jsonData = await data.json();
        if (!data.ok) {
          console.error(`❌ Erreur avec la fonction getParisCampusLocations: ${jsonData.message}.`);
          break;
        };

        for (const {id, host, user} of jsonData) {
          const [bat] = host.split('-');
          if (!['bess', 'paul', 'made'].includes(bat)) {
            continue;
          };
          const {login, image} = user;
          const userId = String(user.id);
          const syncData = syncedUsers.find((syncedUser) => syncedUser.fortyTwoUserId === userId);

          output.push({id: String(id), host, user: {
            id: userId,
            login,
            image: (syncData && syncData.avatarEnabled) ? image.link : client.defaultAvatar,
          }});
        };

        if (jsonData.length !== 100) {
          goToNextPage = false;
        } else {
          pageId++;
        };
      };
      return output;
    };

    await require('./discord/functions')(client);
};

module.exports = functions;
