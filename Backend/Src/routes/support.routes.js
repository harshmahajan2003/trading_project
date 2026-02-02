const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");
const { protect } = require("../middleware/auth.middleware");

// Protected route - only logged in users can send support queries
router.post("/", protect, supportController.submitSupport);

module.exports = router;
