/*
Structures:
- Client:
CREATE TABLE FortyTwo(
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    accessToken TEXT NOT NULL,
    lastUpdate INTEGER NOT NULL
);

CREATE TABLE PagesSystem(
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    pages TEXT NOT NULL
);

- Cooldowns:
CREATE TABLE Discord(
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    commandName TEXT NOT NULL,
    finished INTEGER NOT NULL
);

- 42:
CREATE TABLE Clusters(
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    clustersData TEXT NOT NULL,
    lastUpdate INTEGER NOT NULL
);

CREATE TABLE Users(
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    login TEXT NOT NULL,
    image TEXT NOT NULL,
    delogTimes INTEGER NOT NULL,
    gotDeloggedTimes INTEGER NOT NULL
);

CREATE TABLE Sync(
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    discordUserId TEXT NOT NULL,
    fortyTwoUserId TEXT NOT NULL,
    dmChannelId TEXT NOT NULL,
    syncKey TEXT NOT NULL,
    mailEnabled INTEGER NOT NULL,
    avatarEnabled INTEGER NOT NULL,
    hidden INTEGER NOT NULL,
    verified INTEGER NOT NULL,
    syncedAt INTEGER NOT NULL
);

CREATE TABLE LockSystem(
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    fortyTwoUserId TEXT NOT NULL,
    lockDiscordMessageId TEXT NOT NULL,
    host TEXT NOT NULL,
    status TEXT NOT NULL,
    lockedAt INTEGER NOT NULL,
    unlockedAt INTEGER NOT NULL,
    fiveMinutesReminded INTEGER NOT NULL
);
*/

require('dotenv').config();
const {Client, Events, GatewayIntentBits} = require('discord.js');
const client = new Client({intents: [GatewayIntentBits.Guilds]});

const path = require('path');
const Database = require('better-sqlite3');

/**
 * Génère une instance SQLite pour la base de données et active le mode WAL.
 * @param {String} dbName Le nom de la base de données.
 * @return {Database} Retourne la base de données.
 */
function getDatabase(dbName) {
  const db = new Database(path.join(__dirname, `./databases/${dbName}.db`));
  db.pragma('journal_mode = WAL;');
  return db;
};

function selectAllIntoDatabase(filename, conditions = null) {
  const [dbName, tableName] = filename.split('/');
  const db = getDatabase(dbName);
  let rows;
  try {
    if (conditions) {
      const keys = Object.keys(conditions);
      const values = Object.values(conditions).map((value) => String(value));
      const whereClause = keys.map((key, i) => {
        let [operation, value] = values[i].split(' ');
        if (!value) {
          value = operation;
          operation = '=';
        };
        values[i] = value;
        return `${key} ${operation} ?`;
      }).join(' AND ');
      rows = db.prepare(`SELECT * FROM ${tableName || dbName} WHERE ${whereClause};`).all(...values);
    } else {
      rows = db.prepare(`SELECT * FROM ${tableName || dbName};`).all();
    };
  } catch (err) {
    console.error(`❌ Erreur avec la fonction selectAllIntoDatabase: ${err.message}`);
  } finally {
    db.close();
  };
  return rows;
};

function selectIntoDatabase(filename, conditions) {
  const [dbName, tableName] = filename.split('/');
  const db = getDatabase(dbName);
  let row;
  try {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions).map((value) => String(value));
    const whereClause = keys.map((key, i) => {
      let [operation, value] = values[i].split(' ');
      if (!value) {
        value = operation;
        operation = '=';
      };
      values[i] = value;
      return `${key} ${operation} ?`;
    }).join(' AND ');
    row = db.prepare(`SELECT * FROM ${tableName || dbName} WHERE ${whereClause};`).get(...values);
  } catch (err) {
    console.error(`❌ Erreur avec la fonction selectIntoDatabase: ${err.message}`);
  } finally {
    db.close();
  };
  return row;
};

function insertIntoDatabase(filename, data) {
  const [dbName, tableName] = filename.split('/');
  const db = getDatabase(dbName);
  let success = false;
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT INTO ${tableName || dbName}(${keys.join(', ')}) VALUES(${placeholders});`);
    const info = stmt.run(...values);
    success = info.changes > 0;
  } catch (err) {
    console.error(`❌ Erreur avec la fonction insertIntoDatabase: ${err.message}`);
  } finally {
    db.close();
  };
  return success;
};

function updateIntoDatabase(filename, data, conditions) {
  const [dbName, tableName] = filename.split('/');
  const db = getDatabase(dbName);
  let success = false;
  try {
    const datakeys = Object.keys(data);
    const datavalues = Object.values(data);
    const conditionskeys = Object.keys(conditions);
    const conditionsvalues = Object.values(conditions).map((conditionvalue) => String(conditionvalue));

    const setClause = datakeys.map((key) => `${key} = ?`).join(', ');
    const whereClause = conditionskeys.map((key, i) => {
      let [operation, value] = conditionsvalues[i].split(' ');
      if (!value) {
        value = operation;
        operation = '=';
      };
      conditionsvalues[i] = value;
      return `${key} ${operation} ?`;
    }).join(' AND ');
    const stmt = db.prepare(`UPDATE ${tableName || dbName} SET ${setClause} WHERE ${whereClause};`);
    const info = stmt.run(...datavalues, ...conditionsvalues);
    success = info.changes > 0;
  } catch (err) {
    console.error(`❌ Erreur avec la fonction updateIntoDatabase: ${err.message}`);
  } finally {
    db.close();
  };
  return success;
};

function deleteIntoDatabase(filename, conditions) {
  const [dbName, tableName] = filename.split('/');
  const db = getDatabase(dbName);
  let success = false;
  try {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions).map((value) => String(value));
    const whereClause = keys.map((key, i) => {
      let [operation, value] = values[i].split(' ');
      if (!value) {
        value = operation;
        operation = '=';
      };
      values[i] = value;
      return `${key} ${operation} ?`;
    }).join(' AND ');
    const stmt = db.prepare(`DELETE FROM ${tableName || dbName} WHERE ${whereClause};`);
    const info = stmt.run(...values);
    success = info.changes > 0;
  } catch (err) {
    console.error(`❌ Erreur avec la fonction deleteIntoDatabase: ${err.message}`);
  } finally {
    db.close();
  };
  return success;
};

(async () => {
})();

module.exports = {selectAllIntoDatabase, selectIntoDatabase, insertIntoDatabase, updateIntoDatabase, deleteIntoDatabase};
