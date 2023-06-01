require("dotenv").config();
const { DB_CLIENT, DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_URL } =
  process.env;
module.exports = {
  development: {
    client: DB_CLIENT,
    connection: {
      database: DB_NAME,
      user: `${DB_USER}`,
      password: `${DB_PASS}`,
      host: DB_HOST,
      port: DB_PORT,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
  production: {
    client: "pg",
    connection: DB_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
  staging: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3",
    },
  },
};
