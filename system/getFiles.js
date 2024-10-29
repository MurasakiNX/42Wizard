const {existsSync, readdirSync, statSync} = require('fs');
const {join} = require('path');

/**
 * Récupère la liste des fichiers dans un dossier.
 * @param {String} directory Le chemin vers le dossier.
 * @param {Array<String>} output Utilisé pour récupérer de manière récursive.
 * @return {Array<String>} La liste des fichiers dans un Array.
 */
function getFiles(directory, output=[]) {
  if (existsSync(directory)) {
    const files = readdirSync(directory);
    for (const file of files) {
      const name = `${directory}/${file}`;
      if (statSync(name).isDirectory()) {
        getFiles(name, output);
      } else {
        output.push(join(process.cwd(), name));
      };
    };
  };
  return output;
};

module.exports = getFiles;
