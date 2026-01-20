const Holding = require("../models/Holding");
const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");

/**
 * AUTO SELL WHEN SL / TARGET HIT
 */
module.exports = async function checkStopLoss(io, symbol, price) {
  try {
    const holdings = await Holding.find({
      symbol,
      $or: [
        { stopLoss: { $gte: price } },
        { target: { $lte: price } },
      ],
    });

    for (const holding of holdings) {
      const totalAmount = holding.quantity * price;

      // 🔥 UPDATE WALLET
      let wallet = await Wallet.findOne({ user: holding.user });
      if (!wallet) {
        wallet = await Wallet.create({ user: holding.user, balance: 0 });
      }

      wallet.balance += totalAmount;
      await wallet.save();

      // 🔥 CREATE ORDER
      await Order.create({
        user: holding.user,
        symbol,
        quantity: holding.quantity,
        price,
        side: "SELL",
        status: "AUTO",
      });

      // 🔥 TRANSACTION
      await Transaction.create({
        user: holding.user,
        type: "CREDIT",
        amount: totalAmount,
        description: `AUTO SELL ${symbol}`,
      });

      // 🔥 DELETE HOLDING
      await holding.deleteOne();

      console.log(`🛑 AUTO SELL EXECUTED for ${symbol}`);
    }
  } catch (err) {
    console.error("STOP LOSS ENGINE ERROR:", err.message);
  }
};
