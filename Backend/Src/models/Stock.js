const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be at least 0.01"],
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    volume: {
      type: Number,
      default: 0,
    },
    isIPO: {
      type: Boolean,
      default: false,
    },
    ipoStatus: {
      type: String,
      enum: ["UPCOMING", "OPEN", "CLOSED", "ALLOTTED"],
      default: "UPCOMING",
    },
    ipoPrice: {
      type: Number,
    },
    minLot: {
      type: Number,
      default: 1,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", stockSchema);
