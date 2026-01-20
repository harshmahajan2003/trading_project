const cron = require("node-cron");
const Tick = require("../models/Tick");
const Candle = require("../models/candle");

const buildCandles = async (minutes) => {
  const end = new Date();
  const start = new Date(end.getTime() - minutes * 60 * 1000);

  const ticks = await Tick.find({
    createdAt: { $gte: start, $lte: end },
  }).sort({ createdAt: 1 });

  const grouped = {};

  for (const t of ticks) {
    if (!grouped[t.symbol]) grouped[t.symbol] = [];
    grouped[t.symbol].push(t);
  }

  for (const symbol in grouped) {
    const prices = grouped[symbol].map(t => t.price);
    const volume = grouped[symbol].reduce((a, b) => a + b.volume, 0);

    await Candle.create({
      symbol,
      timeframe: `${minutes}m`,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume,
      startTime: start,
      endTime: end,
    });
  }
};

const startCandleEngine = () => {
  cron.schedule("*/1 * * * *", () => buildCandles(1));
  cron.schedule("*/5 * * * *", () => buildCandles(5));
};

module.exports = startCandleEngine;
