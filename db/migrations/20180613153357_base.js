exports.up = function(knex, Promise) {
  return knex.raw(`
    -- Users table
    create table users(
      -- Google user uid, from id_token.sub.
      id text primary key,

      -- Turnitin creds. Ugly hack.
      turnitin_email text not null,
      turnitin_password text not null,
      turnitin_tz varchar(5) not null,

      -- Notification preferences.
      phone varchar(15) not null,
      prefs jsonb default '{}'::json,

      -- Latest course data.
      updated timestamp,
      courses jsonb default 'null'::json
    );
  `);
};

exports.down = function(knex, Promise) {
  return knex.raw(`
    -- Don't do anything here, so I don't accidentally fat-finger something
    --    and gitlab the entire db.
  `);
};
