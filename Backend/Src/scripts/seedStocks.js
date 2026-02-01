require("dotenv").config();
const mongoose = require("mongoose");
const Stock = require("../models/Stock");

const stocks = [
    { symbol: "RELIANCE", name: "Reliance Industries Ltd.", price: 2950.50 },
    { symbol: "TCS", name: "Tata Consultancy Services Ltd.", price: 4120.75 },
    { symbol: "TATA", name: "Tata Group (Generic)", price: 322.82 },
    { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", price: 1680.30 },
    { symbol: "INFY", name: "Infosys Ltd.", price: 1540.20 },
    { symbol: "AAPL", name: "Apple Inc.", price: 185.50 },
    { symbol: "ICICIBANK", name: "ICICI Bank Ltd.", price: 1120.45 },
    { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", price: 1210.60 },
    { symbol: "SBIN", name: "State Bank of India", price: 780.25 },
    { symbol: "LICI", name: "Life Insurance Corporation of India", price: 920.15 },
    { symbol: "ITC", name: "ITC Ltd.", price: 440.80 },
    { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", price: 2450.90 },
    { symbol: "LT", name: "Larsen & Toubro Ltd.", price: 3420.35 },
    { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd.", price: 6850.10 },
    { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd.", price: 1740.55 },
    { symbol: "ADANIENT", name: "Adani Enterprises Ltd.", price: 3120.40 },
    { symbol: "HCLTECH", name: "HCL Technologies Ltd.", price: 1480.95 },
    { symbol: "AXISBANK", name: "Axis Bank Ltd.", price: 1080.30 },
    { symbol: "TITAN", name: "Titan Company Ltd.", price: 3640.20 },
    { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd.", price: 1540.75 },
    { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd.", price: 9850.40 },
    { symbol: "ASIANPAINT", name: "Asian Paints Ltd.", price: 2840.15 },
    { symbol: "NTPC", name: "NTPC Ltd.", price: 340.55 },
    { symbol: "MARUTI", name: "Maruti Suzuki India Ltd.", price: 11450.25 },
    { symbol: "M&M", name: "Mahindra & Mahindra Ltd.", price: 1940.60 },
    { symbol: "TATASTEEL", name: "Tata Steel Ltd.", price: 145.85 },
    { symbol: "ONGC", name: "Oil & Natural Gas Corporation Ltd.", price: 260.40 },
    { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd.", price: 280.90 },
    { symbol: "ADANIPORTS", name: "Adani Ports & SEZ Ltd.", price: 1320.15 },
    { symbol: "WIPRO", name: "Wipro Ltd.", price: 480.55 },
    { symbol: "JSWSTEEL", name: "JSW Steel Ltd.", price: 840.30 },
    { symbol: "COALINDIA", name: "Coal India Ltd.", price: 445.65 },
    { symbol: "TATACHEM", name: "Tata Chemicals Ltd.", price: 1120.40 },
    { symbol: "TATAMOTORS", name: "Tata Motors Ltd.", price: 940.25 },
    { symbol: "HINDALCO", name: "Hindalco Industries Ltd.", price: 580.95 },
    { symbol: "GRASIM", name: "Grasim Industries Ltd.", price: 2240.50 },
    { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd.", price: 8450.10 },
    { symbol: "SBILIFE", name: "SBI Life Insurance Company Ltd.", price: 1480.35 },
    { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd.", price: 6240.20 },
    { symbol: "BPCL", name: "Bharat Petroleum Corporation Ltd.", price: 610.75 },
    { symbol: "NESTLEIND", name: "Nestle India Ltd.", price: 2540.40 },
    { symbol: "TECHM", name: "Tech Mahindra Ltd.", price: 1280.60 },
    { symbol: "CIPLA", name: "Cipla Ltd.", price: 1450.15 },
    { symbol: "BRITANNIA", name: "Britannia Industries Ltd.", price: 4920.55 },
    { symbol: "EICHERMOT", name: "Eicher Motors Ltd.", price: 3940.40 },
    { symbol: "INDUSINDBK", name: "IndusInd Bank Ltd.", price: 1480.90 },
    { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd.", price: 1140.25 },
    { symbol: "UPL", name: "UPL Ltd.", price: 480.55 },
    { symbol: "DIVISLAB", name: "Divi's Laboratories Ltd.", price: 3640.75 },
    { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise Ltd.", price: 6120.40 },
    { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd.", price: 4480.90 },
    { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd.", price: 1580.15 }
];

const seedDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI missing in .env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("🚀 Connected to MongoDB for seeding...");

        // Remove existing test stocks to avoid duplicates and start fresh
        // We'll keep TATA since it's used in current trades if needed, but the user wants 50 Indian stocks.
        // Let's clear and insert fresh 50.
        await Stock.deleteMany({});
        console.log("🧹 Cleared existing stocks.");

        const preparedStocks = stocks.map(s => ({
            ...s,
            changePercent: (Math.random() - 0.5) * 5,
            volume: Math.floor(Math.random() * 1000000)
        }));

        await Stock.insertMany(preparedStocks);
        console.log(`✅ Successfully seeded ${preparedStocks.length} Indian stocks!`);

        process.exit(0);
    } catch (err) {
        console.error("🔥 Seeding failed:", err.message);
        process.exit(1);
    }
};

seedDB();
