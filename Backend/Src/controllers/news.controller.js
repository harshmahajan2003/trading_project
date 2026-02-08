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
        const today = new Date().toDateString();

        // 1. Return cached data if available for TODAY
        if (processedNewsCache && lastFetchDate === today) {
            console.log("✅ Serving Cached News for", today);
            return res.json(processedNewsCache);
        }

        console.log("🔄 Generating FRESH News with AI for", today);
        let newsData = [];

        // 2. Try fetching from AI
        const aiNews = await aiService.generateMarketNews();

        if (aiNews && aiNews.length > 0) {
            // Attach random images from our pool to AI news
            newsData = aiNews.map((n, i) => ({
                id: i + 1,
                ...n,
                image: MOCK_NEWS[i % MOCK_NEWS.length].image // Cycle through mock images
            }));
        } else {
            // Fallback to MOCK if AI fails
            console.warn("⚠️ AI News Generation Failed, using Mock Backup");
            // Add a small random element to mock news to make it feel slightly dynamic? 
            // Nah, just serve mock for stability.
            // But we should re-analyze mock news if we haven't already.
            newsData = await Promise.all(MOCK_NEWS.map(async (news) => {
                // If mocking, we might want to re-analyze to get fresh "impact" or "summary" if logic changed? 
                // Actually the previous logic was fine for mock.
                // let's just use the static mock news BUT maybe shuffle them?
                return news;
                // The previous logic was enriching mock news. 
                // Since we want dynamic news, we rely on generateMarketNews mainly.
                // If that fails, we fall back to the enriched mock news.
                const aiAnalysis = await aiService.analyzeMarketNews(news.headline, news.content);
                return { ...news, ...aiAnalysis };
            }));
        }

        processedNewsCache = newsData;
        lastFetchDate = today;

        res.json(newsData);

    } catch (error) {
        console.error("News Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch news" });
    }
};

module.exports = { getLatestNews };
