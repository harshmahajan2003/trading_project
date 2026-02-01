const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
    },

    side: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    type: {
      type: String,
      enum: ["MARKET", "LIMIT", "IPO"],
      default: "MARKET",
    },
    triggerPrice: {
      type: Number,
    },
    stopLoss: {
      type: Number,
    },
    target: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "AUTO"],
      default: "SUCCESS",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
