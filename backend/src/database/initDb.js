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

  const createScheduleRulesTable = `
  CREATE TABLE IF NOT EXISTS schedule_rules (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    position_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (position_id) REFERENCES clock_positions(id)
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

  db.run(createScheduleRulesTable, (err) => {
  if (err) {
    console.error("Erreur création table schedule_rules :", err.message);
  } else {
    console.log("Table schedule_rules prête");
  }
});

};

module.exports = initDb;