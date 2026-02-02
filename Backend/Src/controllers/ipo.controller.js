const IPO = require("../models/IPO");
const IPOApplication = require("../models/IPOApplication");
const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Holding = require("../models/Holding");
const Notification = require("../models/Notification");
const Stock = require("../models/Stock");
const emailService = require("../services/emailService");

// ADMIN: CREATE IPO
const createIPO = async (req, res) => {
  try {
    const { companyName, symbol, price, lotSize, totalShares, status } = req.body;

    if (!companyName || !symbol || !price || !lotSize || !totalShares)
      return res.status(400).json({ message: "All IPO fields are required" });

    // Symbol validation
    const upperSymbol = symbol.toUpperCase().trim();
    if (upperSymbol.length < 2 || upperSymbol.length > 6)
      return res.status(400).json({ message: "Symbol must be between 2 and 6 characters" });

    // Numbers validation
    if (price <= 0 || lotSize <= 0 || totalShares <= 0)
      return res.status(400).json({ message: "Price, Lot Size, and Total Shares must be positive" });

    const ipo = await IPO.create({
      ...req.body,
      symbol: upperSymbol,
      companyName: companyName.trim(),
      availableShares: totalShares,
      status: status || "OPEN"
    });
    res.status(201).json(ipo);
  } catch (err) {
    res.status(500).json({ message: "IPO Creation failed: " + err.message });
  }
};

// USER: VIEW IPOs
const getIPOs = async (req, res) => {
  try {
    const ipos = await IPO.find().sort({ createdAt: -1 });
    res.json(ipos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// USER: APPLY IPO
const applyIPO = async (req, res) => {
  const { ipoId, lots } = req.body;
  const userId = req.user._id;

  try {
    const numLots = Number(lots);
    if (isNaN(numLots) || numLots <= 0 || !Number.isInteger(numLots)) {
      return res.status(400).json({ message: "Please enter a valid number of lots" });
    }

    const ipo = await IPO.findById(ipoId);
    if (!ipo || ipo.status !== "OPEN") {
      return res.status(400).json({ message: "IPO is not open for bidding" });
    }

    // Check if already applied
    const existingApp = await IPOApplication.findOne({ ipo: ipoId, user: userId });
    if (existingApp) {
      return res.status(400).json({ message: "Already applied for this IPO" });
    }

    const quantity = lots * ipo.lotSize;
    const amount = quantity * ipo.price;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance to bid" });
    }

    // 🔥 BLOCK AMOUNT: Deduct from balance, add to locked
    wallet.balance -= amount;
    wallet.lockedBalance += amount;
    await wallet.save();

    const application = await IPOApplication.create({
      ipo: ipoId,
      user: userId,
      lots,
      quantity,
      amount,
      status: "PENDING"
    });

    await Notification.create({
      user: userId,
      title: "IPO Application Received",
      message: `You have successfully applied for ${ipo.symbol} IPO (${lots} Lots). Amount ₹${amount.toLocaleString()} is blocked.`,
      type: "IPO_UPDATE"
    });

    // Notify wallet update
    const { getIO } = require("../socket");
    const io = getIO();
    if (io) io.emit("walletUpdate", { userId });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADMIN: GET APPLICATIONS
const getIPOApplications = async (req, res) => {
  try {
    const applications = await IPOApplication.find({ ipo: req.params.ipoId })
      .populate("user", "name email");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADMIN: RUN AUTOMATED RANDOM ALLOTMENT
const runBulkAllotment = async (req, res) => {
  const { ipoId } = req.body;

  try {
    const ipo = await IPO.findById(ipoId);
    if (!ipo) return res.status(404).json({ message: "IPO not found" });

    // Status check - allow from OPEN or CLOSED
    if (ipo.status === "ALLOTTED" || ipo.status === "LISTED") {
      return res.status(400).json({ message: "IPO already allotted or listed" });
    }

    const apps = await IPOApplication.find({ ipo: ipoId, status: "PENDING" });
    if (apps.length === 0) {
      return res.status(400).json({ message: "No pending applications found" });
    }

    // Randomize applications (Fisher-Yates)
    const shuffledApps = [...apps];
    for (let i = shuffledApps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledApps[i], shuffledApps[j]] = [shuffledApps[j], shuffledApps[i]];
    }

    let remainingShares = ipo.totalShares;
    let allottedCount = 0;
    let rejectedCount = 0;

    for (const app of shuffledApps) {
      const wallet = await Wallet.findOne({ user: app.user });

      if (remainingShares >= app.quantity) {
        // ALLOT
        app.status = "ALLOTTED";
        remainingShares -= app.quantity;
        allottedCount++;

        // 1. Move from Locked (Money already deducted in applyIPO)
        if (wallet) {
          wallet.lockedBalance = Math.max(0, (wallet.lockedBalance || 0) - app.amount);
          await wallet.save();
        }

        // 2. Add to Holdings
        let holding = await Holding.findOne({ user: app.user, symbol: ipo.symbol });
        if (holding) {
          const totalQty = holding.quantity + app.quantity;
          holding.avgPrice = (holding.avgPrice * holding.quantity + ipo.price * app.quantity) / totalQty;
          holding.quantity = totalQty;
          await holding.save();
        } else {
          await Holding.create({
            user: app.user,
            symbol: ipo.symbol,
            quantity: app.quantity,
            avgPrice: ipo.price
          });
        }

        // 3. Create Success Order Record
        await Order.create({
          user: app.user,
          symbol: ipo.symbol,
          quantity: app.quantity,
          price: ipo.price,
          side: "BUY",
          type: "IPO",
          status: "SUCCESS"
        });

        // 4. Notification
        await Notification.create({
          user: app.user,
          title: "IPO Allotment Success! 🎉",
          message: `Congratulations! ${app.quantity} shares of ${ipo.symbol} IPO have been allotted.`,
          type: "IPO_UPDATE"
        });

        // 5. Send Email (Asynchronous)
        emailService.sendAllotmentEmail(app.user, ipo, app.quantity).catch(err => {
          console.error(`❌ Allotment Email Error for ${app.user.email}:`, err.message);
        });

      } else {
        // REJECT (No shares left)
        app.status = "REJECTED";
        rejectedCount++;

        // 1. Refund Protected Amount
        if (wallet) {
          wallet.balance += app.amount;
          wallet.lockedBalance = Math.max(0, (wallet.lockedBalance || 0) - app.amount);
          await wallet.save();
        }

        // 2. Notification
        await Notification.create({
          user: app.user,
          title: "IPO Allotment Result",
          message: `You were not allotted shares for ${ipo.symbol}. ₹${app.amount.toLocaleString()} has been refunded.`,
          type: "IPO_UPDATE"
        });
      }
      await app.save();
    }

    // Update IPO Status
    ipo.status = "ALLOTTED";
    ipo.availableShares = remainingShares;
    await ipo.save();

    res.json({
      message: "Allotment process completed",
      stats: { allotted: allottedCount, rejected: rejectedCount, sharesRemaining: remainingShares }
    });

  } catch (err) {
    console.error("🔥 ALLOTMENT ERROR:", err);
    res.status(500).json({ message: "Allotment failed: " + err.message });
  }
};

// ADMIN: LIST IPO ON MARKET
const listIPOAsStock = async (req, res) => {
  const { ipoId } = req.body;
  try {
    const ipo = await IPO.findById(ipoId);
    if (!ipo || ipo.status !== "ALLOTTED") {
      return res.status(400).json({ message: "Only allotted IPOs can be listed on the market" });
    }

    // Check if stock already exists
    let stock = await Stock.findOne({ symbol: ipo.symbol });
    if (!stock) {
      stock = await Stock.create({
        symbol: ipo.symbol,
        name: ipo.companyName,
        price: ipo.price,
        volume: ipo.totalShares,
        isIPO: false // Now it's a regular stock
      });
    } else {
      stock.price = ipo.price;
      stock.isIPO = false;
      await stock.save();
    }

    // Mark IPO as listed
    ipo.status = "LISTED";
    await ipo.save();

    res.json({ message: `${ipo.symbol} has been successfully listed on the exchange!`, stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createIPO, getIPOs, applyIPO, getIPOApplications, runBulkAllotment, listIPOAsStock };
