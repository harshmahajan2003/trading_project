require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// START SERVER
const start = async () => {
  try {
    // 🔥 SOCKET ATTACH
    const { initSocket } = require("./socket");
    initSocket(server);

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`🔥 ERROR: Port ${PORT} is already in use.`);
        process.exit(1);
      }
    });

    // BIND TO PORT IMMEDIATELY (Crucial for Render free tier)
    server.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
      console.log("📍 API URL: http://localhost:5000/api");

      // Connect to DB in background after port is bound
      connectDB().then(() => {
        console.log("📦 Background DB connection successful");
      }).catch(err => {
        console.error("❌ Background DB connection failed:", err.message);
      });
    });
  } catch (err) {
    console.error("🔥 FAILED TO INITIALIZE SERVER:", err);
    process.exit(1);
  }
};

start();
