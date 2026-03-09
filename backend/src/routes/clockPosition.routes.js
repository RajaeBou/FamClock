const express = require("express");
const {
  getClockPositionsByFamily,
} = require("../controllers/clockPosition.controller");

const router = express.Router();

router.get("/family/:familyId", getClockPositionsByFamily);

module.exports = router;