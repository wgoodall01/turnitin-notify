const knex = require('knex');
const mapKeys = require('lodash/mapKeys');
const knexfile = require('./knexfile.js');

const env = process.env.NODE_ENV || 'development';

function assertString(str) {
  if (typeof str !== 'string') {
    throw Error(`knex identifier rewrite: got ${typeof str}, wanted string`);
  }
}

function camelToSnake(str) {
  assertString(str);
  return str.replace(/(?!^)([A-Z])/g, e => '_' + e.toLowerCase());
}

function snakeToCamel(str) {
  assertString(str);
  return str.replace(/(?!^)(\_\w)/g, e => e[1].toUpperCase());
}

module.exports = knex({
  ...knexfile[env],

  debug: env === 'development',

  // Both of these are from the knex documentation examples.
  postProcessResponse: (result, queryContext) => {
    // TODO: add special case for raw results (depends on dialect)
    if (Array.isArray(result)) {
      return result.map(record => mapKeys(record, (val, key) => snakeToCamel(key)));
    } else if (typeof result === 'string') {
      return snakeToCamel(e);
    } else {
      return result;
    }
  },
  wrapIdentifier: (value, origImpl, queryContext) => origImpl(camelToSnake(value))
});
