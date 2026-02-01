const mongoose = require("mongoose");

const ipoApplicationSchema = new mongoose.Schema(
    {
        ipo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "IPO",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        lots: {
            type: Number,
            required: true,
            min: 1,
        },
        quantity: {
            type: Number,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "ALLOTTED", "REJECTED"],
            default: "PENDING",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("IPOApplication", ipoApplicationSchema);
