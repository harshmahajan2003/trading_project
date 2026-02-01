const cron = require("node-cron");
const Tick = require("../models/Tick");
const Candle = require("../models/candle");
const Stock = require("../models/Stock");

const buildCandles = async (minutes, label) => {
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

    const tf = label || `${minutes}m`;

    await Candle.create({
      symbol,
      timeframe: tf,
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

const backfillCandles = async () => {
  try {
    const allStocks = await Stock.find();
    const now = new Date();

    for (const stock of allStocks) {
      const symbol = stock.symbol;
      const existing = await Candle.findOne({ symbol, timeframe: "1m" });
      if (existing) continue;

      console.log(`🕯️ Backfilling candles for ${symbol}...`);
      let price = stock.price || (1000 + Math.random() * 2000);

      for (let i = 60; i > 0; i--) {
        const startTime = new Date(now.getTime() - i * 60 * 1000);
        const endTime = new Date(now.getTime() - (i - 1) * 60 * 1000);

        const open = price;
        const close = price + (Math.random() - 0.5) * 20;
        const high = Math.max(open, close) + Math.random() * 10;
        const low = Math.min(open, close) - Math.random() * 10;
        price = close;

        await Candle.create({
          symbol,
          timeframe: "1m",
          open, high, low, close,
          volume: Math.floor(Math.random() * 10000),
          startTime, endTime
        });
      }
    }
  } catch (err) {
    console.error("🕯️ Candle backfill failed:", err.message);
  }
};

const startCandleEngine = () => {
  backfillCandles(); // Jumpstart
  cron.schedule("*/1 * * * *", () => buildCandles(1, "1m"));
  cron.schedule("*/5 * * * *", () => buildCandles(5, "5m"));
  cron.schedule("*/10 * * * *", () => buildCandles(10, "10m"));
  cron.schedule("*/15 * * * *", () => buildCandles(15, "15m"));
  cron.schedule("*/30 * * * *", () => buildCandles(30, "30m"));
  cron.schedule("0 * * * *", () => buildCandles(60, "1h"));
  cron.schedule("0 0 * * *", () => buildCandles(1440, "1d"));
};

module.exports = startCandleEngine;
