const yahooFinance = require('yahoo-finance2').default;

async function testYahoo2() {
    try {
        const symbols = ["RELIANCE.NS", "TCS.NS"];
        const results = await yahooFinance.quote(symbols);
        console.log(JSON.stringify(results, null, 2));
    } catch (err) {
        console.error("Error in yahoo-finance2:", err.message);
    }
}

testYahoo2();
