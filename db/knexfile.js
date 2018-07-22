// Update with your config settings.

const pool = {
  min: 2,
  max: 10
};

module.exports = {
  development: {
    //debug: false,
    client: 'postgresql',
    pool,
    connection: {
      database: 'postgres',
      user: 'postgres'
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool,
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
