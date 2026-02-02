const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
require("./config/passport");

const app = express();

// Trust proxy for HTTPS cookie/redirect support on Render
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "trading_secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// ===== ROUTES (ALL PRESERVED) =====
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/auth", require("./routes/login.routes"));
app.use("/api/wallet", require("./routes/wallet.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/transactions", require("./routes/transactions.routes"));
app.use("/api/holdings", require("./routes/holdings.routes"));
app.use("/api/candles", require("./routes/candle.routes"));
app.use("/api/stocks", require("./routes/stock.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/ipo", require("./routes/ipo.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("🚀 Trading backend running");
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

module.exports = app;
