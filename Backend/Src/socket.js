const { Server } = require("socket.io");
const startPriceEngine = require("./engine/priceEngine");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    },
  });

  console.log("🔥 Socket server initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  // 🔥 START ENGINES AFTER IO IS READY
  setTimeout(() => {
    if (io) {
      startPriceEngine(io);
      require("./engine/candleEngine")();
      console.log("📈 All Engines Live");
    }
  }, 1000);

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO };
