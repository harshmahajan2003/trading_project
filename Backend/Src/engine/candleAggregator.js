const Candle = require("../models/candle");

/**
 * Aggregate candles
 * fromTf -> toTf
 */
async function aggregateCandles(symbol, fromTf, toTf, factor) {
  const latest = await Candle.find({ symbol, timeframe: fromTf })
    .sort({ createdAt: -1 })
    .limit(factor);

  if (latest.length < factor) return;

  const candles = latest.reverse();

  const open = candles[0].open;
  const close = candles[candles.length - 1].close;
  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  const volume = candles.reduce((sum, c) => sum + c.volume, 0);

  await Candle.create({
    symbol,
    timeframe: toTf,
    open,
    high,
    low,
    close,
    volume,
  });

  console.log(`🕯️ ${toTf} candle created for ${symbol}`);
}

module.exports = async function runAggregation(symbol) {
  try {
    await aggregateCandles(symbol, "1m", "5m", 5);
    await aggregateCandles(symbol, "1m", "15m", 15);
    await aggregateCandles(symbol, "1m", "1h", 60);
  } catch (err) {
    console.error("CANDLE AGG ERROR:", err.message);
  }
};
