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

  const createClockPositionsTable = `
    CREATE TABLE IF NOT EXISTS clock_positions (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      position_number INTEGER NOT NULL,
      label TEXT NOT NULL,
      angle INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (family_id) REFERENCES families(id),
      UNIQUE(family_id, position_number)
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

  db.run(createClockPositionsTable, (err) => {
    if (err) {
      console.error("Erreur création table clock_positions :", err.message);
    } else {
      console.log("Table clock_positions prête");
    }
  });
};

module.exports = initDb;