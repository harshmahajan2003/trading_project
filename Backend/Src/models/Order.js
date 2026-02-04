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
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [100000, "Maximum order quantity is 100,000"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer"
      }
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be positive"],
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
      min: [0, "Trigger price cannot be negative"],
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
