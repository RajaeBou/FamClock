require("dotenv").config();

const initDb = require("./database/initDb");
const app = require("./app");

const PORT = process.env.PORT || 3000;

initDb();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});