require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// DB connect
connectDB();

// HTTP server create
const server = http.createServer(app);

// 🔥 SOCKET ATTACH (THIS WAS MISSING / CONFUSED)
require("./socket")(server);

// START SERVER
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
