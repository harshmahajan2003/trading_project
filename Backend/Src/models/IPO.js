const mongoose = require("mongoose");

const ipoSchema = new mongoose.Schema(
  {
    symbol: String,
    companyName: String,
    price: Number,
    totalShares: Number,
    availableShares: Number,
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IPO", ipoSchema);
