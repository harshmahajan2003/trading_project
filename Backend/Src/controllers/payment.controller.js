const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { getIO } = require("../socket");

// CREATE CHECKOUT SESSION
exports.createCheckoutSession = async (req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    console.log("💳 [DEBUG] Request Body:", req.body);
    console.log("💳 Creating Stripe Session for amount:", req.body.amount, "User:", req.user?._id);

    try {
        const { amount } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount < 100) {
            return res.status(400).json({ message: "Minimum deposit is ₹100" });
        }

        if (numAmount > 1000000) {
            return res.status(400).json({ message: "Maximum deposit limit is ₹10,00,000" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            billing_address_collection: "required", // 🇮🇳 Required for India Export
            customer_email: req.user.email,
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: "Add Funds to Trading Wallet",
                            description: `Deposit of ₹${amount} for trading capital`,
                        },
                        unit_amount: amount * 100, // Stripe expects amount in paise
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/portfolio?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/portfolio?payment=cancelled`,
            metadata: {
                userId: userId.toString(),
                amount: amount.toString(),
            },
        });

        console.log("✅ STRIPE SESSION CREATED:", session.id);
        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error("🔥 STRIPE SESSION ERROR:", err);
        res.status(500).json({ message: "Payment initialization failed", detail: err.message });
    }
};

// VERIFY SESSION (Fallback for local dev if webhooks fail)
exports.verifySession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            const userId = session.metadata.userId;
            const amount = Number(session.metadata.amount);

            // Check if already credited (use session ID as unique marker in a real app, 
            // but here we check if a transaction with this session metadata exists)
            const existingTx = await Transaction.findOne({
                user: userId,
                description: { $regex: sessionId }
            });

            if (existingTx) {
                return res.json({ message: "Already credited", balance: (await Wallet.findOne({ user: userId })).balance });
            }

            const wallet = await Wallet.findOne({ user: userId });
            if (wallet) {
                wallet.balance += amount;
                await wallet.save();

                await Transaction.create({
                    user: userId,
                    type: "CREDIT",
                    amount: amount,
                    description: `Stripe Deposit (Verified): ₹${amount} [ID: ${sessionId}]`,
                });

                const io = getIO();
                io.emit("walletUpdate", { userId });

                return res.json({ message: "Payment verified and credited", balance: wallet.balance });
            }
        }
        res.status(400).json({ message: "Payment not completed" });
    } catch (err) {
        console.error("🔥 VERIFY ERROR:", err);
        res.status(500).json({ message: "Verification failed" });
    }
};

// STRIPE WEBHOOK (To verify and credit wallet)
exports.handleWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        // In dev, we might not have a reliable signature verify if webhook secret is missing
        // But for production, this is critical
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } else {
            event = req.body; // Fallback for simple testing if secret is not set
        }
    } catch (err) {
        console.error("🔥 WEBHOOK SIG ERROR:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const userId = session.metadata.userId;
        const amount = Number(session.metadata.amount);

        try {
            const wallet = await Wallet.findOne({ user: userId });
            if (wallet) {
                wallet.balance += amount;
                await wallet.save();

                await Transaction.create({
                    user: userId,
                    type: "CREDIT",
                    amount: amount,
                    description: `Stripe Deposit: ₹${amount}`,
                });

                const io = getIO();
                io.emit("walletUpdate", { userId });

                console.log(`✅ WALLET CREDITED: User ${userId} received ₹${amount}`);
            }
        } catch (err) {
            console.error("🔥 WEBHOOK PROCESSING ERROR:", err);
        }
    }

    res.json({ received: true });
};
