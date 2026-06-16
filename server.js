const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

app.post('/generate', async (req, res) => {
    try {
        const { niche, audience, days } = req.body;
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: `Create a ${days}-day content calendar for '${niche}' targeting '${audience}'. Use HTML <div class='glass-card'> format. Return ONLY HTML.` }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}` }
        });

        res.json({ html: response.data.choices[0].message.content });
    } catch (error) {
        console.error("API Error details:", error.response?.data || error.message);
        res.status(500).json({ error: "فشل الاتصال بـ Groq - تأكد من مفتاح الـ API" });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
