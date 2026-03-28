const Groq = require("groq-sdk");
require('dotenv').config({ path: './Backend/.env' });

const testGroq = async () => {
    console.log("Testing Groq with API Key:", process.env.GROQ_API_KEY ? "PRESENT" : "MISSING");
    if (!process.env.GROQ_API_KEY) return;

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Say hello and give me one top financial news headline for today." }],
            model: "mixtral-8x7b-32768",
        });
        console.log("Response:", completion.choices[0]?.message?.content);
    } catch (error) {
        console.error("Groq Error:", error.message);
    }
};

testGroq();
