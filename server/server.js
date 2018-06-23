#!/usr/bin/env node
import express from 'express';
import {graphqlExpress} from 'apollo-server-express';
import bodyParser from 'body-parser';
import {formatError as formatApolloError, isInstance as isGraphqlError} from 'apollo-errors';
import {authenticate} from './lib/authMiddleware.js';
import {transact} from './lib/transactionMiddleware.js';
import db from 'db';
import compression from 'compression';
import schema from './graphql/schema.js';
import {resolve} from 'path';
import fs from 'fs';
import morgan from 'morgan';

const PORT = process.env.PORT || 8080;
const DEV = process.env.NODE_ENV === 'development';
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;

const app = express();

app.use(morgan(DEV ? 'dev' : 'combined')); // Logging

// Add latency in dev.
if (DEV) {
  app.use((req, res, next) => {
    setTimeout(next, 300);
  });
}

// Graphql endpoint.
app.use(
  '/graphql',
  bodyParser.json(),
  authenticate(OAUTH_CLIENT_ID),
  transact(db),
  graphqlExpress(req => ({
    schema,
    context: {user: req.user, db: req.trx},

    formatError(err) {
      if (DEV || isGraphqlError(err)) {
        err.status = 400;
        return formatApolloError(err);
      } else {
        err.status = 500;
        return {
          message: 'Internal error',
          name: 'InternalError'
        };
      }
    }
  }))
);

// Make sure it can find the SPA
const SPA_ROOT = resolve('../client/build');
const indexPath = resolve(SPA_ROOT, 'index.html');
if (!DEV && indexPath) {
  if (!fs.existsSync(indexPath)) {
    console.error("Can't find SPA static files. Exiting.");
    process.exit(1);
  }
}

// Serve SPA files
app.use(express.static(SPA_ROOT));

app.get('*', (req, res, next) => {
  res.sendFile(SPA_ROOT + '/index.html');
});

app.use((err, req, res, next) => {
  console.log(err);
  if (isGraphqlError(err)) {
    // If we threw the error, format it nicely.
    res.status(400).json(formatApolloError(err));
  } else {
    // If something else broke, just give up.
    res.status(500).json({
      errors: {
        message: DEV ? err.message : 'Internal Error',
        ...(DEV ? {stack: err.stack} : {})
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serving SPA from ${indexPath} on http://localhost:${PORT}/`);
  console.log(`Serving GraphQl API at http://localhost:${PORT}/graphql`);
});
