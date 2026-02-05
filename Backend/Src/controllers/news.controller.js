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
let processedNewsCache = null;

const getLatestNews = async (req, res) => {
    try {
        // Return cached data if available (Simple Caching)
        if (processedNewsCache) {
            return res.json(processedNewsCache);
        }

        console.log("🔄 Fetching & Analyzing News with AI...");

        // Process news in parallel using Promise.all
        const analyzedNews = await Promise.all(MOCK_NEWS.map(async (news) => {
            const aiAnalysis = await aiService.analyzeMarketNews(news.headline, news.content);
            return { ...news, ...aiAnalysis };
        }));

        processedNewsCache = analyzedNews; // Save to cache
        res.json(analyzedNews);

    } catch (error) {
        console.error("News Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch news" });
    }
};

module.exports = { getLatestNews };
