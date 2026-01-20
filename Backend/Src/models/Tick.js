const mongoose = require("mongoose");

const tickSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    volume: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tick", tickSchema);
