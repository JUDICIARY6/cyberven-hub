const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;
const GROQ_API_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';

app.use(express.json());
app.use(express.static(__dirname));

app.post('/generate', async (req, res) => {
    console.log("استلمت طلب توليد..."); // للتأكد أن الطلب يصل للسيرفر
    
    try {
        if (!GROQ_API_KEY) throw new Error("مفتاح API غير موجود في إعدادات البيئة!");

        const { niche, audience, days } = req.body;
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: `Create a ${days}-day content calendar for '${niche}' targeting '${audience}'. Use HTML <div class='glass-card'> format. Return ONLY HTML.` }]
            })
        });

        const data = await response.json();
        console.log("رد Groq:", JSON.stringify(data)); // هذا السطر سيظهر لنا الخطأ الحقيقي في الـ Logs

        if (data.choices && data.choices[0]) {
            res.json({ html: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "رد غير متوقع من المحرك" });
        }
    } catch (error) {
        console.error("خطأ تقني:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
