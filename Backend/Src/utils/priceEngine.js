const Stock = require("../models/Stock");
const Candle = require("../models/candle");

function randomPriceMove(price) {
  const change = (Math.random() * 2 - 1) * 2; // -2 to +2
  return Math.max(price + change, 1);
}

async function startPriceEngine() {
  setInterval(async () => {
    const stocks = await Stock.find();

    for (let stock of stocks) {
      const newPrice = randomPriceMove(stock.price);
      stock.price = Number(newPrice.toFixed(2));
      await stock.save();

      await updateCandle(stock.symbol, newPrice);
    }
  }, 1000); // every second
}

async function updateCandle(symbol, price) {
  const now = new Date();
  now.setSeconds(0, 0);

  const candle = await Candle.findOne({
    symbol,
    timeframe: "1m",
    timestamp: now
  });

  if (!candle) {
    await Candle.create({
      symbol,
      timeframe: "1m",
      open: price,
      high: price,
      low: price,
      close: price,
      timestamp: now
    });
  } else {
    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price;
    await candle.save();
  }
}

module.exports = startPriceEngine;
