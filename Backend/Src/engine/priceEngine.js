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
  console.log("🚀 Price Engine Started (Hybrid Mode via Axios)");

  setInterval(async () => {
    try {
      const stocks = await Stock.find();
      if (stocks.length === 0) return;

      const marketOpen = isMarketOpen();
      let livePricesMap = {};

      if (marketOpen) {
        try {
          // Fetch live prices for Indian stocks (append .NS for National Stock Exchange)
          const symbols = stocks.map(s => s.symbol.includes('.') ? s.symbol : `${s.symbol}.NS`).join(',');
          const response = await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json',
              'Referer': 'https://finance.yahoo.com/'
            }
          });

          if (response.data && response.data.quoteResponse && response.data.quoteResponse.result) {
            response.data.quoteResponse.result.forEach(quote => {
              const cleanSymbol = quote.symbol.split('.')[0];
              livePricesMap[cleanSymbol] = {
                price: quote.regularMarketPrice,
                change: quote.regularMarketChangePercent,
                volume: quote.regularMarketVolume
              };
            });
          }
        } catch (apiErr) {
          console.error("❌ Yahoo Finance API Fetch Error:", apiErr.message);
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
        } else if (marketOpen) {
          // Fallback to Simulation ONLY if market is open but API failed
          const changePercent = (Math.random() * 2 - 1) * 0.01;
          const priceChange = stock.price * changePercent;
          newPrice = Number((stock.price + priceChange).toFixed(2));
          displayChange = Number((changePercent * 100).toFixed(2));
          newVolume = (stock.volume || 0) + Math.floor(Math.random() * 5000) + 1000;
        } else {
          // MARKET CLOSED: Keep prices STATIC (User request: "market value sahi nahi hai")
          newPrice = stock.price;
          displayChange = stock.changePercent || 0;
          newVolume = stock.volume || 0;
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
