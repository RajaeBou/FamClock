const express = require("express");
const router = express.Router();
const { createFamily } = require("../controllers/family.controller");

router.post("/", createFamily);

module.exports = router;