const mongoose = require("mongoose");

const candleSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    timeframe: {
      type: String,
      enum: ["1m", "5m", "10m", "15m", "30m", "1h", "1d"],
      required: true,
      index: true,
    },
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// fast queries
candleSchema.index({ symbol: 1, timeframe: 1, createdAt: -1 });

module.exports = mongoose.model("Candle", candleSchema);
