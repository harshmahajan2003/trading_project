const Wallet = require("../models/Wallet");

const getWallet = async (req, res) => {
  const wallet = await Wallet.findOne({ user: req.user._id });
  res.json(wallet);
};

module.exports = { getWallet };
