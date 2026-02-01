const { io } = require("socket.io-client");
const socket = io("http://localhost:5000");

console.log("Connecting to socket...");

socket.on("connect", () => {
    console.log("Connected to server! ID:", socket.id);
});

socket.on("stockUpdate", (data) => {
    console.log("Received Update:", data.symbol, "Price:", data.price);
});

socket.on("connect_error", (err) => {
    console.log("Connection Error:", err.message);
});

setTimeout(() => {
    console.log("Ending test...");
    process.exit(0);
}, 10000);
