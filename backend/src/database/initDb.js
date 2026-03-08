const db = require("../config/db");

const initDb = () => {
  const createFamiliesTable = `
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      family_name TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `;

  const createMembersTable = `
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      servo_channel INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `;

  db.run(createFamiliesTable, (err) => {
    if (err) {
      console.error("Erreur création table families :", err.message);
    } else {
      console.log("Table families prête");
    }
  });

  db.run(createMembersTable, (err) => {
    if (err) {
      console.error("Erreur création table members :", err.message);
    } else {
      console.log("Table members prête");
    }
  });
};

module.exports = initDb;