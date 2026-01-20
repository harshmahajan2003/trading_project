const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ===== ROUTES (ALL PRESERVED) =====
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/auth", require("./routes/login.routes"));
app.use("/api/wallet", require("./routes/wallet.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/transactions", require("./routes/transactions.routes"));
app.use("/api/holdings", require("./routes/holdings.routes"));
app.use("/api/candles", require("./routes/candle.routes"));

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("🚀 Trading backend running");
});

module.exports = app;
