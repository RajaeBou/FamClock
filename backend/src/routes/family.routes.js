const express = require("express");
const router = express.Router();
const { createFamily, loginFamily } = require("../controllers/family.controller");

router.post("/", createFamily);
router.post("/login", loginFamily);

module.exports = router;