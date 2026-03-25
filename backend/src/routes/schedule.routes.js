const express = require("express");
const router = express.Router();

const {
  createScheduleRule,
  getScheduleRulesByMember,
  getActiveScheduleRule
} = require("../controllers/schedule.controller");

router.post("/", createScheduleRule);

router.get("/active/:memberId", getActiveScheduleRule);

router.get("/:memberId", getScheduleRulesByMember);

module.exports = router;