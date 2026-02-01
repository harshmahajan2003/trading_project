require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// START SERVER
const start = async () => {
  try {
    // DB connect
    await connectDB();

    // 🔥 SOCKET ATTACH
    const { initSocket } = require("./socket");
    initSocket(server);

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`🔥 ERROR: Port ${PORT} is already in use. Please kill the process on this port and restart.`);
        process.exit(1);
      }
    });

    server.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
      console.log("📍 API URL: http://localhost:5000/api");
    });
  } catch (err) {
    console.error("🔥 FAILED TO START SERVER:", err);
    process.exit(1);
  }
};

start();
