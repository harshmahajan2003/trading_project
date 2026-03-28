const axios = require('axios');

async function testYahoo() {
    try {
        const symbols = "RELIANCE.NS,TCS.NS";
        const response = await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    }
}

testYahoo();
