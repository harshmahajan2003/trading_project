const Transaction = require("../models/Transaction");

const getMyTransactions = async (req, res) => {
  const transactions = await Transaction.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(transactions);
};

module.exports = { getMyTransactions };
