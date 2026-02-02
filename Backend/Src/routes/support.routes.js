const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");
const passport = require("passport");

// Protected route - only logged in users can send support queries
router.post("/", passport.authenticate("jwt", { session: false }), supportController.submitSupport);

module.exports = router;
