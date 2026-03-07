const db = require("../config/db");

const initDb = () => {
  const createFamiliesTable = `
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      family_name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `;

  db.run(createFamiliesTable, (err) => {
    if (err) {
      console.error("Erreur création table families :", err.message);
    } else {
      console.log("Table families prête");
    }
  });
};

module.exports = initDb;