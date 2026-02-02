require("dotenv").config();
const mongoose = require("mongoose");

// Collections to sync based on Compass screenshot
// We skip history-heavy collections (ticks, candles) for Atlas Free Tier stability
const collections = [
    { name: "stocks", modelPath: "../models/Stock" },
    { name: "ipos", modelPath: "../models/IPO" },
    { name: "ipoapplications", modelPath: "../models/IPOApplication" },
    { name: "notifications", modelPath: "../models/Notification" },
    { name: "holdings", modelPath: "../models/Holding" },
    { name: "orders", modelPath: "../models/Order" },
    { name: "transactions", modelPath: "../models/Transaction" }
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
            try {
                const schema = require(col.modelPath).schema;
                const modelName = require(col.modelPath).modelName;
                const model = localConn.model(modelName, schema);

                const docs = await model.find({});
                dataToMigrate[col.name] = docs.map(d => d.toObject());
                console.log(`📦 Fetched ${dataToMigrate[col.name].length} items from ${col.name}`);
            } catch (fetchErr) {
                console.error(`❌ Failed to fetch ${col.name}:`, fetchErr.message);
                dataToMigrate[col.name] = [];
            }
        }
        await localConn.close();

        // 2. Connect to Atlas and push data
        console.log("\n🔌 Connecting to Atlas DB...");
        const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
        console.log("✅ Connected to Atlas DB");

        for (const col of collections) {
            try {
                const schema = require(col.modelPath).schema;
                const modelName = require(col.modelPath).modelName;
                const model = atlasConn.model(modelName, schema);

                // Clear Atlas collection first to avoid duplicates
                await model.deleteMany({});
                console.log(`🧹 Cleared Atlas ${col.name}`);

                if (dataToMigrate[col.name].length > 0) {
                    await model.insertMany(dataToMigrate[col.name], { ordered: false });
                    console.log(`🚀 Mirrored ${dataToMigrate[col.name].length} items to Atlas ${col.name}`);
                }
            } catch (pushErr) {
                console.error(`❌ Failed to push ${col.name}:`, pushErr.message);
                if (pushErr.errors) {
                    Object.keys(pushErr.errors).forEach(key => {
                        console.error(`  - Field "${key}": ${pushErr.errors[key].message}`);
                    });
                }
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
