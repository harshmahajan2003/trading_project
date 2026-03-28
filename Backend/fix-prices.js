const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const Stock = require('./Src/models/Stock');

async function syncPrices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const stocks = await Stock.find();
        console.log(`Found ${stocks.length} stocks. Starting sync...`);

        for (const stock of stocks) {
            try {
                const yahooSymbol = stock.symbol.includes('.') ? stock.symbol : `${stock.symbol}.NS`;
                console.log(`Syncing ${stock.symbol} -> ${yahooSymbol}...`);
                
                const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 5000
                });

                const result = response.data?.chart?.result?.[0];
                if (result && result.meta) {
                    const realPrice = result.meta.regularMarketPrice;
                    const prevClose = result.meta.previousClose || realPrice;
                    const change = ((realPrice - prevClose) / prevClose) * 100;

                    stock.price = Number(realPrice.toFixed(2));
                    stock.changePercent = Number(change.toFixed(2));
                    await stock.save();
                    console.log(`✅ ${stock.symbol}: Updated to ₹${stock.price} (${stock.changePercent}%)`);
                } else {
                    console.error(`❌ ${stock.symbol}: API failed to provide data`);
                }
            } catch (err) {
                console.error(`❌ Error syncing ${stock.symbol}:`, err.message);
            }
        }

        console.log("Sync completed!");
        process.exit(0);
    } catch (err) {
        console.error("Critical Error:", err.message);
        process.exit(1);
    }
}

syncPrices();
