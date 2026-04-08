const express = require("express");
const router = express.Router();

const {
  getClockStartupConfig,
} = require("../controllers/startupClock.controller");

router.get("/clock-config", getClockStartupConfig);

module.exports = router;