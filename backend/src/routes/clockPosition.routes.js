const express = require("express");
const {
  getClockPositionsByFamily,
  updateClockPositionLabel,
} = require("../controllers/clockPosition.controller");

const router = express.Router();

router.get("/family/:familyId", getClockPositionsByFamily);
router.put("/:id", updateClockPositionLabel);

module.exports = router;