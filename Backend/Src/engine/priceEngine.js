const Stock = require("../models/Stock");
const Tick = require("../models/Tick");
const processOrders = require("./orderEngine");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

// Helper to check if market is open (9:15 AM - 3:30 PM IST, Mon-Fri)
const isMarketOpen = () => {
  const now = new Date();

  // Convert to IST
  const istDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'long'
  }).formatToParts(now);

  const getPart = (type) => istDate.find(p => p.type === type).value;

  const hour = parseInt(getPart('hour'));
  const minute = parseInt(getPart('minute'));
  const day = getPart('weekday');

  // Weekends
  if (day === 'Saturday' || day === 'Sunday') return false;

  const totalMinutes = hour * 60 + minute;
  const openTime = 9 * 60 + 15; // 09:15
  const closeTime = 15 * 60 + 30; // 15:30

  return totalMinutes >= openTime && totalMinutes <= closeTime;
};

const startPriceEngine = (io) => {
  console.log("🚀 Price Engine Started (Hybrid Mode)");

  setInterval(async () => {
    try {
      const stocks = await Stock.find();
      if (stocks.length === 0) return;

      const marketOpen = isMarketOpen();
      let livePricesMap = {};

      if (marketOpen) {
        try {
          // Fetch live prices for Indian stocks (append .NS for National Stock Exchange)
          const symbols = stocks.map(s => s.symbol.includes('.') ? s.symbol : `${s.symbol}.NS`);
          const results = await yahooFinance.quote(symbols);

          results.forEach(quote => {
            const cleanSymbol = quote.symbol.split('.')[0];
            livePricesMap[cleanSymbol] = {
              price: quote.regularMarketPrice,
              change: quote.regularMarketChangePercent,
              volume: quote.regularMarketVolume
            };
          });
        } catch (apiErr) {
          console.error("Yahoo Finance API Error (Falling back to simulation):", apiErr.message);
        }
      }

      for (const stock of stocks) {
        let newPrice, displayChange, newVolume;

        const liveData = livePricesMap[stock.symbol];

        if (marketOpen && liveData) {
          // Use Real Data
          newPrice = Number(liveData.price.toFixed(2));
          displayChange = Number(liveData.change.toFixed(2));
          newVolume = liveData.volume;
        } else {
          // Fallback to Simulation (Random Walk)
          const changePercent = (Math.random() * 2 - 1) * 0.01;
          const priceChange = stock.price * changePercent;
          newPrice = Number((stock.price + priceChange).toFixed(2));
          displayChange = Number((changePercent * 100).toFixed(2));
          newVolume = (stock.volume || 0) + Math.floor(Math.random() * 5000) + 1000;
        }

        stock.price = newPrice;
        stock.changePercent = displayChange;
        stock.volume = newVolume;
        await stock.save();

        // 1. Create a Tick
        await Tick.create({
          symbol: stock.symbol,
          price: newPrice,
          volume: newVolume
        });

        // 2. Emit update
        io.emit("stockUpdate", {
          symbol: stock.symbol,
          price: newPrice,
          change: displayChange,
          name: stock.name,
          volume: newVolume
        });

        // 3. Process Orders
        processOrders(io, stock.symbol, newPrice);
      }

      if (Math.random() > 0.95) {
        console.log(`⚙️ Engine Ticking: ${marketOpen ? 'LIVE' : 'SIMULATED'} Mode`);
      }

    } catch (err) {
      console.error("Price Engine Error:", err.message);
    }
  }, 10000); // Increased interval to 10s to avoid API rate limits
};

module.exports = startPriceEngine;
