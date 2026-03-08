const express = require("express");

const {
  createMember,
  getMembersByFamily,
  getMemberById,
  updateMember,
} = require("../controllers/member.controller");

const router = express.Router();

router.post("/", createMember);
router.get("/family/:familyId", getMembersByFamily);
router.get("/:id", getMemberById);
router.put("/:id", updateMember);

module.exports = router;