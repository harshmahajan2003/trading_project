const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");
const { createIPO, getIPOs, applyIPO } = require("../controllers/ipo.controller");

router.post("/", protect, isAdmin, createIPO);
router.get("/", protect, getIPOs);
router.post("/apply", protect, applyIPO);

module.exports = router;
