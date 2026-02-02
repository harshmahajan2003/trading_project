const Stock = require("../models/Stock");
const Tick = require("../models/Tick");
const processOrders = require("./orderEngine");

const startPriceEngine = (io) => {
  console.log("🚀 Price Engine Started");

  // Update prices every 3 seconds for simulation
  setInterval(async () => {
    try {
      const stocks = await Stock.find();
      if (stocks.length === 0) {
        console.log("⚠️ Price Engine: No stocks found in database");
        return;
      }

      // Heartbeat once every few cycles to verify engine is ticking
      if (Math.random() > 0.9) {
        console.log(`⚙️ Price Engine Ticking: Processing ${stocks.length} stocks`);
        io.emit('engine_heartbeat', { stocksProcessed: stocks.length });
      }

      for (const stock of stocks) {
        // Random change between -1% and +1%
        const changePercent = (Math.random() * 2 - 1) * 0.01;
        const priceChange = stock.price * changePercent;
        const newPrice = Number((stock.price + priceChange).toFixed(2));

        // Calculate total change percentage from original (or just current)
        const displayChange = Number((changePercent * 100).toFixed(2));

        const newVolume = (stock.volume || 0) + Math.floor(Math.random() * 5000) + 1000;

        stock.price = newPrice;
        stock.changePercent = displayChange;
        stock.volume = newVolume;
        await stock.save();

        // 1. Create a Tick for candlestick generation
        await Tick.create({
          symbol: stock.symbol,
          price: newPrice,
          volume: newVolume
        });

        // 2. Emit update via Socket.io
        io.emit("stockUpdate", {
          symbol: stock.symbol,
          price: newPrice,
          change: displayChange,
          name: stock.name,
          volume: newVolume
        });

        // 3. Process Pending Orders / Risk Management
        // We pass IO so it can notify users if their order was executed
        processOrders(io, stock.symbol, newPrice);
      }
    } catch (err) {
      console.error("Price Engine Error:", err.message);
    }
  }, 3000);
};

module.exports = startPriceEngine;
