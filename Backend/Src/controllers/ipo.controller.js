const IPO = require("../models/IPO");
const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Holding = require("../models/Holding");

// ADMIN: CREATE IPO
const createIPO = async (req, res) => {
  const ipo = await IPO.create({
    ...req.body,
    availableShares: req.body.totalShares,
  });
  res.status(201).json(ipo);
};

// USER: VIEW IPOs
const getIPOs = async (req, res) => {
  const ipos = await IPO.find({ status: "OPEN" });
  res.json(ipos);
};

// USER: APPLY IPO
const applyIPO = async (req, res) => {
  const { ipoId, quantity } = req.body;
  const ipo = await IPO.findById(ipoId);
  const wallet = await Wallet.findOne({ user: req.user._id });

  const cost = quantity * ipo.price;

  if (!ipo || ipo.status !== "OPEN")
    return res.status(400).json({ message: "IPO closed" });

  if (wallet.balance < cost)
    return res.status(400).json({ message: "Insufficient balance" });

  if (ipo.availableShares < quantity)
    return res.status(400).json({ message: "Not enough shares" });

  wallet.balance -= cost;
  ipo.availableShares -= quantity;

  let holding = await Holding.findOne({
    user: req.user._id,
    symbol: ipo.symbol,
  });

  if (holding) {
    holding.quantity += quantity;
  } else {
    holding = await Holding.create({
      user: req.user._id,
      symbol: ipo.symbol,
      quantity,
      avgPrice: ipo.price,
    });
  }

  await wallet.save();
  await ipo.save();
  await holding.save();

  await Order.create({
    user: req.user._id,
    symbol: ipo.symbol,
    quantity,
    price: ipo.price,
    type: "IPO",
    status: "SUCCESS",
  });

  res.json({ message: "IPO applied successfully" });
};

module.exports = { createIPO, getIPOs, applyIPO };
