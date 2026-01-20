const { Server } = require("socket.io");
const startPriceEngine = require("./engine/priceEngine");

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  console.log("🔥 Socket server initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  // 🔥 START PRICE ENGINE
  startPriceEngine(io);
};
