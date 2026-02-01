const User = require("../models/User");
const Stock = require("../models/Stock");
const Order = require("../models/Order");

// ADD STOCK
const addStock = async (req, res) => {
  try {
    const { symbol, name, price } = req.body;

    if (!symbol || !name || !price)
      return res.status(400).json({ message: "All fields are required" });

    // Symbol validation (uppercase, 2-6 chars)
    const upperSymbol = symbol.toUpperCase().trim();
    if (upperSymbol.length < 2 || upperSymbol.length > 6)
      return res.status(400).json({ message: "Symbol must be between 2 and 6 characters" });

    // Name validation
    if (name.trim().length < 2)
      return res.status(400).json({ message: "Name must be at least 2 characters" });

    // Price validation
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0)
      return res.status(400).json({ message: "Price must be a positive number" });

    const exists = await Stock.findOne({ symbol: upperSymbol });
    if (exists)
      return res.status(400).json({ message: "Stock with this symbol already exists" });

    const stock = await Stock.create({ symbol: upperSymbol, name, price: numPrice });
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ message: "Add stock failed: Server error" });
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

// DELETE STOCK
const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json({ message: "Stock deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete stock failed" });
  }
};

module.exports = {
  addStock,
  getAllStocks,
  getAllUsers,
  blockUser,
  getAllOrders,
  deleteStock,
};
