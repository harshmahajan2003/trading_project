const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const Wallet = require("../models/Wallet");

// GET WALLET
router.get("/", protect, async (req, res) => {
  let wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({
      user: req.user._id,
      balance: 0,
    });
  }

  res.json(wallet);
});

// ADD MONEY (TEST)
router.post("/add-money", protect, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  let wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({
      user: req.user._id,
      balance: 0,
    });
  }

  wallet.balance += Number(amount);
  await wallet.save();

  res.json({ message: "Money added", balance: wallet.balance });
});

module.exports = router;
