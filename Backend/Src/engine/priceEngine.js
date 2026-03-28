const Stock = require("../models/Stock");
const Tick = require("../models/Tick");
const processOrders = require("./orderEngine");
const axios = require("axios");

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
  console.log("🚀 Hybrid Price Engine Started (Live + Market Simulation)");

  setInterval(async () => {
    try {
      const stocks = await Stock.find();
      if (stocks.length === 0) return;

      const marketOpen = isMarketOpen();
      
      for (const stock of stocks) {
        let newPrice, displayChange, newVolume;

        if (marketOpen) {
          try {
            // Try LIVE FETCH via Yahoo Finance Chart API
            const yahooSymbol = stock.symbol.includes('.') ? stock.symbol : `${stock.symbol}.NS`;
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://finance.yahoo.com/'
              },
              timeout: 5000
            });

            const result = response.data?.chart?.result?.[0];
            if (result && result.meta) {
              const meta = result.meta;
              newPrice = Number(meta.regularMarketPrice.toFixed(2));
              const prevClose = meta.previousClose || stock.price;
              displayChange = Number(((newPrice - prevClose) / prevClose * 100).toFixed(2));
              newVolume = meta.regularMarketVolume || stock.volume;
            } else {
              throw new Error("Invalid API structure");
            }
          } catch (apiErr) {
            // Fallback to Simulation for this stock if API fails during market hours
            const changePercent = (Math.random() * 2 - 1) * 0.005;
            const priceChange = stock.price * changePercent;
            newPrice = Number((stock.price + priceChange).toFixed(2));
            displayChange = Number((changePercent * 100).toFixed(2));
            newVolume = (stock.volume || 0) + Math.floor(Math.random() * 2000) + 500;
          }
        } else {
          // MARKET CLOSED: Run Simulation starting from last known price
          // This allows users to trade 24/7 if they want, but with fake movements
          const changePercent = (Math.random() * 2 - 1) * 0.002;
          const priceChange = stock.price * changePercent;
          newPrice = Number((stock.price + priceChange).toFixed(2));
          displayChange = Number((changePercent * 100).toFixed(2));
          newVolume = (stock.volume || 0) + Math.floor(Math.random() * 500) + 100;
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

      if (Math.random() > 0.9) {
        console.log(`📡 Price Sync: ${marketOpen ? 'LIVE MARKET' : 'SIMULATION MODE'}`);
      }

    } catch (err) {
      console.error("🔥 Price Engine Error (Global):", err.message);
    }
  }, 10000); // 10s sync interval
};

module.exports = startPriceEngine;
