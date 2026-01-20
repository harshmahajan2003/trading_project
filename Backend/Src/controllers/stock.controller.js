const Stock = require("../models/Stock");

// GET ALL STOCKS
const getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ symbol: 1 });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE STOCK BY SYMBOL
const getStockBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEED STOCKS (ONE-TIME)
const seedStocks = async (req, res) => {
  try {
    const existing = await Stock.countDocuments();
    if (existing > 0) {
      return res.json({ message: "Stocks already seeded" });
    }

    const stocks = [
      { symbol: "RELIANCE", name: "Reliance Industries", price: 2500 },
      { symbol: "TCS", name: "Tata Consultancy Services", price: 3800 },
      { symbol: "INFY", name: "Infosys", price: 1550 },
      { symbol: "HDFCBANK", name: "HDFC Bank", price: 1650 },
    ];

    await Stock.insertMany(stocks);
    res.status(201).json({ message: "Stocks seeded successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllStocks, getStockBySymbol, seedStocks };
