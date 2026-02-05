const express = require("express");
const router = express.Router();
const newsController = require("../controllers/news.controller");
const { protect } = require("../middleware/auth.middleware");

// Public route or Protected? Let's make it protected for premium feel
router.get("/", protect, newsController.getLatestNews);

module.exports = router;
