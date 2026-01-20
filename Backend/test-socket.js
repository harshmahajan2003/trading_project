const io = require("socket.io-client");

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
});

socket.on("price:update", (data) => {
  console.log("📈 LIVE PRICE:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});
