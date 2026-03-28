const aiService = require("../services/aiService");

// Mock Financial Data (In a real app, fetch from NewsAPI/Bloomberg)
const MOCK_NEWS = [
    {
        id: 1,
        headline: "Tata Motors Shares Jump 5% After JLR Sales Report",
        content: "Tata Motors reported a significant surge in Jaguar Land Rover sales across Europe and North America, beating estimates.",
        source: "Financial Express",
        time: "10 mins ago",
        image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: 2,
        headline: "RBI Hints at Rate Cuts in Next MPC Meeting",
        content: "The Reserve Bank of India governor indicated that inflation is under control, opening doors for potential rate cuts to boost liquidity.",
        source: "Mint",
        time: "1 hour ago",
        image: "https://images.unsplash.com/photo-1621981386829-9b458a2cddde?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: 3,
        headline: "Adani Green Energy Secures New Solar Project in Gujarat",
        content: "Adani Green has won a bid for a 500MW solar park, further expanding its renewable energy portfolio.",
        source: "Economic Times",
        time: "2 hours ago",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: 4,
        headline: "HDFC Bank Q4 Results: Net Profit Rises 15%",
        content: "HDFC Bank showed resilient growth in its quarterly results, driven by strong retail loan demand.",
        source: "CNBC TV18",
        time: "3 hours ago",
        image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: 5,
        headline: "Tech Mahindra Shares Fall Amid Weak Global Cues",
        content: "IT stocks faced selling pressure today as US inflation data raised concerns about delayed Fed rate cuts.",
        source: "Moneycontrol",
        time: "5 hours ago",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop"
    }
];

// In-memory cache to avoid hitting AI API too often on reload
// In-memory cache + Timestamp
let processedNewsCache = null;
let lastFetchDate = null; // To track "Today"

const getLatestNews = async (req, res) => {
    try {
        const now = new Date();
        const cacheExpiry = 60 * 1000; 

        if (processedNewsCache && (now - lastFetchDate < cacheExpiry)) {
            return res.json(processedNewsCache);
        }

        console.log("🔄 Fetching FRESH Market News...");
        let newsData = [];

        try {
            const aiNews = await aiService.generateMarketNews();
            if (aiNews && aiNews.length > 0) {
                newsData = aiNews.map((n, i) => ({
                    id: `ai-${Date.now()}-${i}`,
                    ...n,
                    image: MOCK_NEWS[i % MOCK_NEWS.length].image 
                }));
            }
        } catch (aiErr) {
            console.warn("⚠️ AI News Generation Failed:", aiErr.message);
        }

        if (newsData.length === 0) {
            console.log("📡 Generating Dynamic Fallback from Market Prices...");
            const Stock = require("../models/Stock");
            const stocks = await Stock.find().sort({ changePercent: -1 }); 
            
            if (stocks.length > 0) {
                const gainers = stocks.slice(0, 8); 
                const losers = stocks.slice(-8);
                const candidates = [...gainers, ...losers].sort(() => Math.random() - 0.5).slice(0, 6);

                const gainerPhrases = [
                    "shares rally on strong market sentiment",
                    "hits intraday high as buyers flock in",
                    "outperforms peers following positive price action",
                    "sees massive buying interest at current levels",
                    "surges as technical indicators turn bullish",
                    "shares climb as investors anticipate growth"
                ];

                const loserPhrases = [
                    "under selling pressure as momentum slows",
                    "slides on profit booking after recent moves",
                    "drags as market sentiment turns cautious",
                    "witnesses sharp decline in intraday trade",
                    "underperforms as bears take control",
                    "shares dip following sector-wide correction"
                ];

                newsData = candidates.map((s, i) => {
                    const isGainer = s.changePercent >= 0;
                    const phrasePool = isGainer ? gainerPhrases : loserPhrases;
                    const phrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];
                    
                    const headline = `${s.name} (${s.symbol}) ${phrase}`;
                    const content = `The stock of ${s.name} is currently trading at ₹${s.price.toLocaleString('en-IN')}, reflecting a ${s.changePercent}% change. Market analysts are closely watching the ${s.symbol} chart for key support and resistance levels as trading volume remains ${isGainer ? 'robust' : 'volatile'}.`;

                    const summaries = [
                        `${s.symbol} continues to show ${isGainer ? 'strength' : 'weakness'} with a ${Math.abs(s.changePercent)}% move today.`,
                        `Current price of ${s.name} stands at ₹${s.price}, trending ${isGainer ? 'upwards' : 'downwards'}.`,
                        `Investors are reacting to recent price action in ${s.symbol}, which is currently at ₹${s.price}.`
                    ];

                    return {
                        id: `fallback-${s.symbol}-${Date.now()}-${i}`,
                        headline,
                        content,
                        summary: summaries[Math.floor(Math.random() * summaries.length)],
                        source: ["Mint", "Moneycontrol", "Reuters", "CNBC", "Bloomberg"][i % 5],
                        time: "Just Now",
                        sentiment: isGainer ? "Bullish" : "Bearish",
                        impact: [s.symbol],
                        image: MOCK_NEWS[i % MOCK_NEWS.length].image
                    };
                });
            } else {
                newsData = MOCK_NEWS;
            }
        }

        processedNewsCache = newsData;
        lastFetchDate = now;

        res.json(newsData);

    } catch (error) {
        console.error("News Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch news" });
    }
};

module.exports = { getLatestNews };
