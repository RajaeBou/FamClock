const express = require("express");
const cors = require("cors");

const familyRoutes = require("./routes/family.routes");
const memberRoutes = require("./routes/member.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "FamClock API running" });
});

app.use("/api/families", familyRoutes);
app.use("/api/members", memberRoutes);

module.exports = app;