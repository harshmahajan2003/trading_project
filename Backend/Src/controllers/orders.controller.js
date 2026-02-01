const mongoose = require("mongoose");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Holding = require("../models/Holding");
const Transaction = require("../models/Transaction");
const Candle = require("../models/candle");
const Stock = require("../models/Stock");
const { getIO } = require("../socket");

/**
 * BUY STOCK
 */
exports.buyStock = async (req, res) => {
  try {
    const userId = req.user._id;
    const { symbol, quantity, type, triggerPrice, stopLoss, target } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      throw new Error("Invalid input");
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) throw new Error("Stock not found");

    const executionPrice = type === "LIMIT" ? triggerPrice : stock.price;
    if (type === "LIMIT" && (!triggerPrice || triggerPrice <= 0)) {
      throw new Error("Trigger price required for limit orders");
    }

    const totalCost = executionPrice * quantity;

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0, lockedBalance: 0 });
    }

    if (wallet.balance < totalCost) {
      throw new Error("Insufficient balance");
    }

    // Deduct from balance
    wallet.balance -= totalCost;

    if (type === "LIMIT") {
      // Move to locked for pending order
      wallet.lockedBalance = (wallet.lockedBalance || 0) + totalCost;
      await wallet.save();

      await Order.create({
        user: userId,
        symbol: symbol.toUpperCase(),
        quantity,
        price: executionPrice,
        type: "LIMIT",
        side: "BUY",
        status: "PENDING",
        triggerPrice: executionPrice,
        stopLoss,
        target,
      });

      const io = getIO();
      io.emit("walletUpdate", { userId });
      return res.status(201).json({ message: "Limit order placed" });
    }

    // MARKET ORDER LOGIC (Immediate execution)
    await wallet.save();

    let holding = await Holding.findOne({
      user: userId,
      symbol: symbol.toUpperCase(),
    });

    if (!holding) {
      await Holding.create({
        user: userId,
        symbol: symbol.toUpperCase(),
        quantity,
        avgPrice: stock.price,
        stopLoss,
        target,
      });
    } else {
      const totalQty = holding.quantity + quantity;
      holding.avgPrice =
        (holding.avgPrice * holding.quantity + stock.price * quantity) / totalQty;
      holding.quantity = totalQty;
      if (stopLoss !== undefined) holding.stopLoss = stopLoss;
      if (target !== undefined) holding.target = target;
      await holding.save();
    }

    await Order.create({
      user: userId,
      symbol: symbol.toUpperCase(),
      quantity,
      price: stock.price,
      side: "BUY",
      type: "MARKET",
      status: "SUCCESS",
      stopLoss,
      target,
    });

    await Transaction.create({
      user: userId,
      type: "DEBIT",
      amount: totalCost,
      description: `BUY ${symbol.toUpperCase()}`,
      symbol: symbol.toUpperCase(),
      quantity: quantity,
      side: "BUY"
    });

    const io = getIO();
    io.emit("walletUpdate", { userId });

    res.status(201).json({ message: "Buy successful" });
  } catch (err) {
    console.error("🔥 BUY ERROR:", err);
    res.status(400).json({ message: err.message || "Buy failed" });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * SELL STOCK
 */
exports.sellStock = async (req, res) => {
  try {
    const userId = req.user._id;
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      throw new Error("Invalid input");
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) throw new Error("Stock not found");

    const price = stock.price;
    const totalAmount = price * quantity;

    const holding = await Holding.findOne({
      user: userId,
      symbol: symbol.toUpperCase(),
    });

    if (!holding || holding.quantity < quantity) {
      throw new Error("Not enough holdings");
    }

    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      await holding.deleteOne();
    } else {
      await holding.save();
    }

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }

    wallet.balance += totalAmount;
    await wallet.save();

    await Order.create({
      user: userId,
      symbol: symbol.toUpperCase(),
      quantity,
      price,
      side: "SELL",
      status: "SUCCESS",
    });

    await Transaction.create({
      user: userId,
      type: "CREDIT",
      amount: totalAmount,
      description: `SELL ${symbol.toUpperCase()}`,
      symbol: symbol.toUpperCase(),
      quantity: quantity,
      side: "SELL"
    });

    const io = getIO();
    io.emit("walletUpdate", { userId });

    res.status(201).json({ message: "Sell successful" });
  } catch (err) {
    console.error("🔥 SELL ERROR:", err);
    res.status(400).json({ message: err.message || "Sell failed" });
  }
};
