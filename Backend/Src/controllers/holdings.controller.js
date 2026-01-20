const Holding = require("../models/Holding");

const getHoldings = async (req, res) => {
  res.json(await Holding.find({ user: req.user._id }));
};

module.exports = { getHoldings };
