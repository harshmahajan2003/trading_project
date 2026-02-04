const mongoose = require("mongoose");

const ipoSchema = new mongoose.Schema(
  {
    symbol: String,
    companyName: String,
    price: {
      type: Number,
      required: [true, "IPO price is required"],
      min: [0.01, "Price must be at least 0.01"],
    },
    totalShares: {
      type: Number,
      required: [true, "Total shares is required"],
      min: [1, "Total shares must be at least 1"],
    },
    availableShares: {
      type: Number,
      min: [0, "Available shares cannot be negative"],
    },
    minLot: {
      type: Number,
      default: 1,
      min: [1, "Minimum lot must be at least 1"],
    },
    lotSize: {
      type: Number,
      default: 10,
      min: [1, "Lot size must be at least 1"],
    },
    description: {
      type: String,
      default: "",
    },
    openDate: Date,
    closeDate: Date,
    status: {
      type: String,
      enum: ["UPCOMING", "OPEN", "CLOSED", "ALLOTTED", "LISTED"],
      default: "UPCOMING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IPO", ipoSchema);
