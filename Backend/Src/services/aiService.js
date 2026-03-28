const Groq = require("groq-sdk");

/**
 * Analyzes market news for sentiment and summary using Groq AI.
 * @param {string} headline - News headline
 * @param {string} content - News body content
 * @returns {Promise<{sentiment: string, summary: string, impact: string[]}>}
 */
const analyzeMarketNews = async (headline, content) => {
    // 🛡️ Prevent Crash: Check Key lazily
    if (!process.env.GROQ_API_KEY) {
        console.warn("⚠️ SKIPPING AI ANALYSIS: GROQ_API_KEY is missing/undefined");
        return { sentiment: "Neutral", summary: headline, impact: [] };
    }

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = `
        You are a financial analyst AI. Analyze the following news:
        
        Headline: "${headline}"
        Content: "${content ? content.substring(0, 500) : headline}"

        Return ONLY a JSON object (no markdown, no extra text) with:
        1. "sentiment": "Bullish", "Bearish", or "Neutral"
        2. "summary": A concise 1-sentence summary (max 20 words).
        3. "impact": Array of stock tickers (e.g. ["TATASTEEL", "NIFTY"]) affected. If none specific, use generic sector tags.

        Example format:
        { "sentiment": "Bullish", "summary": "Profits rose by 20% due to strong demand.", "impact": ["TCS", "INFY"] }
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "mixtral-8x7b-32768",
            temperature: 0.1, // Low temp for consistent JSON
        });

        const result = completion.choices[0]?.message?.content || "{}";

        // Clean potential markdown code blocks if Groq returns them
        const cleanJson = result.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("🔥 GROQ AI ERROR:", error.message);
        // Fallback if AI fails
        return {
            sentiment: "Neutral",
            summary: headline,
            impact: []
        };
    }
};

/**
 * Generates 3-5 short daily market/trading notifications.
 * @param {string} userName
 * @returns {Promise<Array<{title: string, message: string, type: string}>>}
 */
const generateDailyBrief = async (userName) => {
    // 🛡️ Prevent Crash
    if (!process.env.GROQ_API_KEY) return [];

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = `
        Generate 3 short, engaging daily notifications for a stock trader named "${userName}".
        
        Mix of:
        1. Market Wisdom (Tip)
        2. Motivation
        3. A "Look ahead" at the market.

        Format: JSON Array of objects with "title", "message", and "type" ("SYSTEM").
        Max 15 words per message.
        Example:
        [
            {"title": "Morning ${userName}! ☀️", "message": "The market rewards patience. Trade wisely today.", "type": "SYSTEM"},
            {"title": "Pro Tip 💡", "message": "Never ignore your stop-loss. Capital preservation is key.", "type": "SYSTEM"}
        ]
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "mixtral-8x7b-32768",
            temperature: 0.7,
        });

        const result = completion.choices[0]?.message?.content || "[]";
        const cleanJson = result.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("🔥 GROQ BRIEF ERROR:", error.message);
        return [];
    }
};

/**
 * Generates 5 realistic financial news headlines for "Today".
 * @returns {Promise<Array<{headline: string, content: string, source: string, time: string, sentiment: string, impact: string[]}>>}
 */
const generateMarketNews = async () => {
    if (!process.env.GROQ_API_KEY) return [];

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const today = new Date().toDateString();

        const prompt = `
        You are a top financial journalist. Generate 5 REALISTIC financial news headlines for the Indian & Global markets for "Today" (${today}).
        
        Focus on:
        - Nifty/Sensex Movements
        - Major Corporate Actions (Tata, Reliance, Infosys, HDFC, Adani)
        - Global Cues (Fed, US Markets)
        - Sectoral shifts (Auto, IT, Banking)

        Format: JSON Array of objects.
        Fields:
        - "headline": Catchy, professional headline.
        - "content": 2-3 detailed sentences summarizing the news details.
        - "summary": A very short, punchy 1-sentence summary (max 15 words) for quick reading.
        - "source": Credentials like "Mint", "Moneycontrol", "CNBC", "Reuters", "Financial Express".
        - "time": Randomly pick between "10 mins ago", "1 hour ago", "2 hours ago".
        - "sentiment": "Bullish", "Bearish", "Neutral".
        - "impact": Array of tickers (e.g. ["RELIANCE", "NIFTY"]).

        Return ONLY the raw JSON array. No markdown code blocks.
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "mixtral-8x7b-32768",
            temperature: 0.7,
        });

        let result = completion.choices[0]?.message?.content || "[]";
        
        // 🧪 Robust JSON Extraction
        // If the AI wrapped it in ```json or ``` blocks, extract just the array/object
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            result = jsonMatch[0];
        }

        return JSON.parse(result);

    } catch (error) {
        console.error("🔥 GROQ NEWS GEN ERROR:", error.message);
        return [];
    }
};

module.exports = { analyzeMarketNews, generateDailyBrief, generateMarketNews };
