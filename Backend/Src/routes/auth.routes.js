const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const passport = require("passport");

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });

    // ✅ WALLET CREATED WITH INITIAL BALANCE
    await Wallet.create({
      user: user._id,
      balance: 100000,
    });

    console.log(`✅ User registered and wallet initialized with ₹1,00,000: ${email}`);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    res.status(500).json({ message: "Register failed", error: err.message });
  }
});

// ===== GOOGLE OAUTH =====
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Redirect to frontend with token
    const token = req.user.token;
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-success?token=${token}`);
  }
);

module.exports = router;
