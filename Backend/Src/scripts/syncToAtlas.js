require("dotenv").config();
const mongoose = require("mongoose");

// Collections to sync based on Compass screenshot
const collections = [
    { name: "stocks", modelPath: "../models/Stock" },
    { name: "ipos", modelPath: "../models/IPO" },
    { name: "ipoapplications", modelPath: "../models/IPOApplication" },
    { name: "candles", modelPath: "../models/candle" },
    { name: "notifications", modelPath: "../models/Notification" },
    { name: "holdings", modelPath: "../models/Holding" },
    { name: "orders", modelPath: "../models/Order" },
    { name: "transactions", modelPath: "../models/Transaction" },
    { name: "ticks", modelPath: "../models/Tick" }
];

const syncData = async () => {
    // Check both potential local DB names from .env
    const LOCAL_URI = "mongodb://127.0.0.1:27017/trading_db";
    const ATLAS_URI = process.env.ATLAS_URI;

    if (!ATLAS_URI || ATLAS_URI.includes("<db_password>")) {
        console.error("❌ Error: ATLAS_URI missing or password not filled in.");
        process.exit(1);
    }

    try {
        // 1. Connect to Local and fetch all data
        console.log("🔌 Connecting to Local DB...");
        const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log("✅ Connected to Local DB");

        const dataToMigrate = {};
        for (const col of collections) {
            const schema = require(col.modelPath).schema;
            const modelName = require(col.modelPath).modelName;
            const model = localConn.model(modelName, schema);

            dataToMigrate[col.name] = await model.find({});
            console.log(`📦 Fetched ${dataToMigrate[col.name].length} items from ${col.name}`);
        }
        await localConn.close();

        // 2. Connect to Atlas and push data
        console.log("\n🔌 Connecting to Atlas DB...");
        const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
        console.log("✅ Connected to Atlas DB");

        for (const col of collections) {
            const schema = require(col.modelPath).schema;
            const modelName = require(col.modelPath).modelName;
            const model = atlasConn.model(modelName, schema);

            // Clear Atlas collection first to avoid duplicates
            await model.deleteMany({});
            console.log(`🧹 Cleared Atlas ${col.name}`);

            if (dataToMigrate[col.name].length > 0) {
                await model.insertMany(dataToMigrate[col.name]);
                console.log(`🚀 Mirrored ${dataToMigrate[col.name].length} items to Atlas ${col.name}`);
            }
        }

        console.log("\n✨ DATABASE SYNC COMPLETE! Your live site now has all your local data.");
        await atlasConn.close();
        process.exit(0);

    } catch (err) {
        console.error("🔥 Sync failed:", err);
        process.exit(1);
    }
};

syncData();
