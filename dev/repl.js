#!/usr/bin/env babel-node
const path = require('path');
require('dotenv').config({path: path.resolve('../.env')});
const repl = require('repl');

const ctx = {
  db: require('db'),
  turnitin: require('server/lib/turnitin'),
  TURNITIN_EMAIL: process.env.TURNITIN_EMAIL,
  TURNITIN_PW: process.env.TURNITIN_PW,
  User: require('server/models/User').default,
  Worker: require('server/worker.js').default
};

console.log(Object.keys(ctx).join(', '));

const r = repl.start('> ');
Object.assign(r.context, ctx);
