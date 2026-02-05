const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Analyzes market news for sentiment and summary using Groq AI.
 * @param {string} headline - News headline
 * @param {string} content - News body content
 * @returns {Promise<{sentiment: string, summary: string, impact: string[]}>}
 */
const analyzeMarketNews = async (headline, content) => {
    try {
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

module.exports = { analyzeMarketNews };
