const express = require("express");
const router = express.Router();
const {
  createScheduleRule,
  getScheduleRulesByMember,
} = require("../controllers/scheduleController");

router.post("/", createScheduleRule);
router.get("/:memberId", getScheduleRulesByMember);

module.exports = router;