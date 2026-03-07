const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(process.env.DB_PATH || "./src/database/famclock.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erreur connexion SQLite :", err.message);
  } else {
    console.log("Connecté à SQLite :", dbPath);
  }
});

module.exports = db;