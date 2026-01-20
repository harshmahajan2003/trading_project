const mongoose = require("mongoose");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Holding = require("../models/Holding");
const Transaction = require("../models/Transaction");
const Candle = require("../models/candle");

/**
 * BUY STOCK
 */
exports.buyStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { symbol, quantity, stopLoss, target } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      throw new Error("Invalid input");
    }

    const candle = await Candle.findOne(
      { symbol: symbol.toUpperCase(), timeframe: "1m" },
      {},
      { sort: { createdAt: -1 } }
    );

    if (!candle) throw new Error("Live price not available");

    const price = candle.close;
    const totalCost = price * quantity;

    let wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) {
      wallet = await Wallet.create([{ user: userId, balance: 0 }], { session });
      wallet = wallet[0];
    }

    if (wallet.balance < totalCost) {
      throw new Error("Insufficient balance");
    }

    wallet.balance -= totalCost;
    await wallet.save({ session });

    let holding = await Holding.findOne({
      user: userId,
      symbol: symbol.toUpperCase(),
    }).session(session);

    if (!holding) {
      await Holding.create(
        [
          {
            user: userId,
            symbol: symbol.toUpperCase(),
            quantity,
            avgPrice: price,
            stopLoss,
            target,
          },
        ],
        { session }
      );
    } else {
      const totalQty = holding.quantity + quantity;
      holding.avgPrice =
        (holding.avgPrice * holding.quantity + price * quantity) / totalQty;
      holding.quantity = totalQty;
      if (stopLoss !== undefined) holding.stopLoss = stopLoss;
      if (target !== undefined) holding.target = target;
      await holding.save({ session });
    }

    await Order.create(
      [
        {
          user: userId,
          symbol: symbol.toUpperCase(),
          quantity,
          price,
          side: "BUY",
          status: "SUCCESS",
        },
      ],
      { session }
    );

    await Transaction.create(
      [
        {
          user: userId,
          type: "DEBIT",
          amount: totalCost,
          description: `BUY ${symbol.toUpperCase()}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Buy successful" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};

/**
 * SELL STOCK
 */
exports.sellStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      throw new Error("Invalid input");
    }

    const candle = await Candle.findOne(
      { symbol: symbol.toUpperCase(), timeframe: "1m" },
      {},
      { sort: { createdAt: -1 } }
    );

    if (!candle) throw new Error("Live price not available");

    const price = candle.close;
    const totalAmount = price * quantity;

    const holding = await Holding.findOne({
      user: userId,
      symbol: symbol.toUpperCase(),
    }).session(session);

    if (!holding || holding.quantity < quantity) {
      throw new Error("Not enough holdings");
    }

    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      await holding.deleteOne({ session });
    } else {
      await holding.save({ session });
    }

    let wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) {
      wallet = await Wallet.create([{ user: userId, balance: 0 }], { session });
      wallet = wallet[0];
    }

    wallet.balance += totalAmount;
    await wallet.save({ session });

    await Order.create(
      [
        {
          user: userId,
          symbol: symbol.toUpperCase(),
          quantity,
          price,
          side: "SELL",
          status: "SUCCESS",
        },
      ],
      { session }
    );

    await Transaction.create(
      [
        {
          user: userId,
          type: "CREDIT",
          amount: totalAmount,
          description: `SELL ${symbol.toUpperCase()}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Sell successful" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};
