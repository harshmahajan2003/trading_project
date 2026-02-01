const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const Holding = require("../models/Holding");
const Transaction = require("../models/Transaction");

/**
 * PENDING ORDER MATCHER & RISK MANAGER
 * Called whenever a stock price updates
 */
module.exports = async function processOrders(io, symbol, currentPrice) {
    try {
        // 1. MATCH PENDING LIMIT ORDERS (BUY)
        const pendingOrders = await Order.find({
            symbol,
            status: "PENDING",
            type: "LIMIT",
            side: "BUY",
            triggerPrice: { $gte: currentPrice } // If price is <= triggerPrice
        });

        for (const order of pendingOrders) {
            console.log(`🎯 LIMIT MATCH: ${symbol} hit ${currentPrice} (Limit: ${order.triggerPrice})`);

            const totalCost = order.price * order.quantity; // Funds already locked based on this price

            // Execute Order
            order.status = "SUCCESS";
            order.price = currentPrice;
            await order.save();

            // Release Locked Funds and finalize deduction
            const wallet = await Wallet.findOne({ user: order.user });
            if (wallet) {
                wallet.lockedBalance = Math.max(0, (wallet.lockedBalance || 0) - totalCost);
                await wallet.save();
            }

            // Update Holdings
            let holding = await Holding.findOne({ user: order.user, symbol: order.symbol });
            if (!holding) {
                await Holding.create({
                    user: order.user,
                    symbol: order.symbol,
                    quantity: order.quantity,
                    avgPrice: currentPrice,
                    stopLoss: order.stopLoss,
                    target: order.target
                });
            } else {
                const totalQty = holding.quantity + order.quantity;
                holding.avgPrice = (holding.avgPrice * holding.quantity + currentPrice * order.quantity) / totalQty;
                holding.quantity = totalQty;
                if (order.stopLoss) holding.stopLoss = order.stopLoss;
                if (order.target) holding.target = order.target;
                await holding.save();
            }

            // Record Transaction
            await Transaction.create({
                user: order.user,
                type: "DEBIT",
                amount: totalCost,
                description: `LIMIT BUY: ${symbol} @ ${currentPrice}`
            });

            io.emit("walletUpdate", { userId: order.user });
        }

        // 2. RISK MANAGEMENT (SL / TARGET)
        const riskHoldings = await Holding.find({
            symbol,
            $or: [
                { stopLoss: { $gte: currentPrice } }, // Price dropped to or below SL
                { target: { $lte: currentPrice } }    // Price rose to or above Target
            ]
        });

        for (const holding of riskHoldings) {
            const isSL = holding.stopLoss && currentPrice <= holding.stopLoss;
            const type = isSL ? "STOPLOSS" : "TARGET";

            console.log(`🚨 ${type} TRIGGERED: ${symbol} @ ${currentPrice}`);

            const totalValue = currentPrice * holding.quantity;

            // Update Wallet
            const wallet = await Wallet.findOne({ user: holding.user });
            if (wallet) {
                wallet.balance += totalValue;
                await wallet.save();
            }

            // Record Auto Sell Order
            await Order.create({
                user: holding.user,
                symbol: holding.symbol,
                quantity: holding.quantity,
                price: currentPrice,
                side: "SELL",
                status: "AUTO",
                type: "MARKET",
            });

            // Record Transaction
            await Transaction.create({
                user: holding.user,
                type: "CREDIT",
                amount: totalValue,
                description: `${type} HIT: ${symbol} @ ${currentPrice}`
            });

            // Liquidate Holding
            await holding.deleteOne();

            io.emit("walletUpdate", { userId: holding.user });
        }

    } catch (err) {
        console.error("❌ ORDER ENGINE ERROR:", err);
    }
};
