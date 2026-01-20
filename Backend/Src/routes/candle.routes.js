const router = require("express").Router();
const Candle = require("../models/candle");

// GET candles by timeframe
// /api/candles?symbol=TCS&timeframe=5m
router.get("/", async (req, res) => {
  const { symbol, timeframe } = req.query;

  if (!symbol || !timeframe) {
    return res.status(400).json({ message: "symbol & timeframe required" });
  }

  const candles = await Candle.find({
    symbol: symbol.toUpperCase(),
    timeframe,
  })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(candles.reverse());
});

module.exports = router;
