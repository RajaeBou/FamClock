const express = require("express");
const {
  createMember,
  getMembersByFamily,
} = require("../controllers/member.controller");

const router = express.Router();

router.post("/", createMember);
router.get("/family/:familyId", getMembersByFamily);

module.exports = router;