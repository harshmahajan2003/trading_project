const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");

router.get("/", async (req, res) => {
  const stocks = await Stock.find();
  res.json(stocks);
});

router.get("/:symbol", async (req, res) => {
  const stock = await Stock.findOne({ symbol: req.params.symbol });
  if (!stock) return res.status(404).json({ message: "Not found" });
  res.json(stock);
});

module.exports = router;
