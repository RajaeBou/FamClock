require("dotenv").config();

// Création automatique des tables SQLite au démarrage
require("./database/initDb");

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});