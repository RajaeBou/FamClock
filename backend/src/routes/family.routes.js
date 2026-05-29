const express = require("express");
const router = express.Router();

const {
  createFamily,
  loginFamily,
} = require("../controllers/family.controller");

const {
  pinAttemptLimiter,
} = require("../middlewares/pinAttemptLimiter");

router.post("/", createFamily);
router.post("/login", pinAttemptLimiter, loginFamily);

module.exports = router;