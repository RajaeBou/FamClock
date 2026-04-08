require("dotenv").config();

const app = require("./app");
const initDb = require("./database/initDb");
const PORT = process.env.PORT || 3000;

initDb();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});