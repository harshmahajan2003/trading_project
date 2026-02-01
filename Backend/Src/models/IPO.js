const mongoose = require("mongoose");

const ipoSchema = new mongoose.Schema(
  {
    symbol: String,
    companyName: String,
    price: Number,
    totalShares: Number,
    availableShares: Number,
    minLot: {
      type: Number,
      default: 1,
    },
    lotSize: {
      type: Number,
      default: 10, // shares per lot
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
