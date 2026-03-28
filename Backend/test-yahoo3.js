const yahooFinance = require('yahoo-finance2').default;

// Suppress some validation errors if they occur
yahooFinance.setGlobalConfig({
    validation: { logErrors: false }
});

async function testYahoo3() {
    try {
        const symbol = "RELIANCE.NS";
        console.log(`🔍 Fetching ${symbol}...`);
        const result = await yahooFinance.quote(symbol);
        console.log("✅ Result:", {
            price: result.regularMarketPrice,
            change: result.regularMarketChangePercent,
            time: result.regularMarketTime
        });
    } catch (err) {
        console.error("❌ Error in yahoo-finance2:", err.message);
        if (err.response) {
            console.log("Status:", err.response.status);
        }
    }
}

testYahoo3();
