#!/usr/bin/env node
require('dotenv').config();
const twilio = require('twilio');
const fs = require('fs');
const util = require('util');

const turnitin = require('./turnitin.js');

const TURNITIN_EMAIL = process.env.TURNITIN_EMAIL;
const TURNITIN_PW = process.env.TURNITIN_PW;
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;
const SILENT = process.env.SILENT || false;

const twilioClient = new twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

async function loadData(path) {
  const fileStr = await util.promisify(fs.readFile)(path);
  return JSON.parse(fileStr);
}

async function saveData(path, data) {
  const fileStr = JSON.stringify(data, null, 2);
  await util.promisify(fs.writeFile)(path, fileStr);
}

async function main() {
  console.log('Fetching courses...');
  const courses = await turnitin.fetch(TURNITIN_EMAIL, TURNITIN_PW);

  // Print everything out nicely
  for (c of courses) {
    console.log('\n' + c.name);
    console.group();
    for (a of c.assignments) {
      console.log(
        `${a.name}: graded=${a.isGraded}, similar=${a.similarity}, score=${a.points}, total=${a.total}`
      );
    }
    console.groupEnd();
  }
}

main()
  .then(x => console.log('\n[ done ]'))
  .catch(e => {
    console.log('\n [error]\n');
    console.log(e);
  });
