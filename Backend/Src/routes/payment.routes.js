const express = require("express");
const router = express.Router();
const { createCheckoutSession, handleWebhook, verifySession } = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/verify-session/:sessionId", protect, verifySession);
// Webhook endpoint needs raw body for verification, handled in app.js
router.post("/webhook", express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
