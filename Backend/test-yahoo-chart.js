const axios = require('axios');

async function testYahooChart() {
    try {
        const symbol = "RELIANCE.NS";
        console.log(`🔍 Fetching ${symbol} via Chart API...`);
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const result = response.data.chart.result[0];
        const meta = result.meta;
        console.log("✅ Result:", {
            price: meta.regularMarketPrice,
            previousClose: meta.previousClose,
            symbol: meta.symbol,
            currency: meta.currency
        });
    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Data:", JSON.stringify(err.response.data));
        }
    }
}

testYahooChart();
