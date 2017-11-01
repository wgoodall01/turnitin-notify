#!/usr/bin/env node
require('dotenv').config();
const twilio = require('twilio');

const turnitin = require('./turnitin.js');
const {loadData, saveData} = require('./store.js');
const {compareCourses} = require('./diff.js');
const {formatMessage} = require('./format.js');

const TURNITIN_EMAIL = process.env.TURNITIN_EMAIL;
const TURNITIN_PW = process.env.TURNITIN_PW;
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;
const RECV_NUMBER = process.env.RECV_NUMBER;
const SILENT = process.env.SILENT || false;

const twilioClient = new twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

async function main() {
  console.log('Loading store...');
  const store = await loadData(__dirname + '/_data.json');

  console.log('Fetching courses...');
  const courses = await turnitin.fetch(TURNITIN_EMAIL, TURNITIN_PW);

  console.log('Diffing with latest...');
  const latest = store[store.length - 1];
  let differences = compareCourses(courses, latest);

  console.log('Sending diff notifications...');
  for (d of differences) {
    console.log('format', JSON.stringify(d, null, 2));
    await twilioClient.messages.create({
      body: formatMessage(d),
      from: TWILIO_NUMBER,
      to: RECV_NUMBER
    });
  }

  if (differences.length === 0) {
    console.log('Not saving store, no new data.');
  } else {
    console.log('Saving store...');
    const item = {courses, dateFetched: new Date().toISOString()};
    store.push(item);
    saveData(__dirname + '/_data.json', store); // comment for testing
  }
}

main()
  .then(x => console.log('\n[ done ]'))
  .catch(e => {
    console.log('\n [error]\n');
    console.log(e);
  });
