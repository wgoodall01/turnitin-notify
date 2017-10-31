const fs = require('fs');
const util = require('util');

async function loadData(path) {
  const fileStr = await util.promisify(fs.readFile)(path);
  return JSON.parse(fileStr);
}

async function saveData(path, data) {
  const fileStr = JSON.stringify(data, null, 2);
  await util.promisify(fs.writeFile)(path, fileStr);
}

module.exports = {loadData, saveData};
