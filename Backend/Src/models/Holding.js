const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"]
    },
    avgPrice: {
      type: Number,
      required: true,
      min: [0, "Average price cannot be negative"]
    },

    // 🔥 STEP 8 FIELDS
    stopLoss: { type: Number },
    target: { type: Number },
  },
  { timestamps: true }
);

holdingSchema.index({ user: 1, symbol: 1 });

module.exports = mongoose.model("Holding", holdingSchema);
