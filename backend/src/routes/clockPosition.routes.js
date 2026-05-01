const express = require("express");

const {
  getClockPositionsByFamily,
  updateClockPositionLabel,
  reorderClockPositions,
} = require("../controllers/clockPosition.controller");

const router = express.Router();

router.get("/family/:familyId", getClockPositionsByFamily);

// IMPORTANT : route spécifique avant route dynamique
router.put("/reorder", reorderClockPositions);

// renommer un emplacement
router.put("/:id", updateClockPositionLabel);

module.exports = router;