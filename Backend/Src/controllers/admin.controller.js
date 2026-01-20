const User = require("../models/User");
const Stock = require("../models/Stock");
const Order = require("../models/Order");

// ADD STOCK
const addStock = async (req, res) => {
  try {
    const { symbol, name, price } = req.body;

    if (!symbol || !name || !price)
      return res.status(400).json({ message: "All fields required" });

    const exists = await Stock.findOne({ symbol });
    if (exists)
      return res.status(400).json({ message: "Stock already exists" });

    const stock = await Stock.create({ symbol, name, price });
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ message: "Add stock failed" });
  }
};

// GET ALL STOCKS
const getAllStocks = async (req, res) => {
  const stocks = await Stock.find();
  res.json(stocks);
};

// GET ALL USERS
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// BLOCK / UNBLOCK USER
const blockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ message: "User not found" });

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    message: user.isActive ? "User unblocked" : "User blocked",
  });
};

// GET ALL ORDERS
const getAllOrders = async (req, res) => {
  const orders = await Order.find().populate("user", "email");
  res.json(orders);
};

module.exports = {
  addStock,
  getAllStocks,
  getAllUsers,
  blockUser,
  getAllOrders,
};
