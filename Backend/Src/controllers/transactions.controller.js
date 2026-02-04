const Transaction = require("../models/Transaction");

const getMyTransactions = async (req, res) => {
  const transactions = await Transaction.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(transactions);
};

const getMarketPulse = async (req, res) => {
  // Fetch latest 50 transactions from ALL users => "Global Pulse"
  const transactions = await Transaction.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name"); // Optional: Show who traded (or just hide it)

  res.json(transactions);
};

module.exports = { getMyTransactions, getMarketPulse };
