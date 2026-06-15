const http = require('http');
const fs = require('fs');
const path = require('path');
// استدعاء الكائن المعتمد والمستقر من الحزمة الرسمية
const { GoogleGenerativeAI } = require('@google/generative-ai');

// جلب مفتاح جوجل بأمان من إعدادات البيئة في Render
const API_KEY = process.env.GEMINI_API_KEY; 
const PORT = 10000; 

// تهيئة الاتصال الذكي بجوجل
let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

const server = http.createServer((req, res) => {
    // إعدادات الـ CORS الكاملة لمنع أي حظر من المتصفحات أو الهواتف
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // [1] عرض واجهة العميل الأساسية (index.html)
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) { 
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error loading Cyberven Interface'); 
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });

    // [2] استقبال البيانات وتوليد الكروت الفخمة
    } else if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                if (!API_KEY || !genAI) {
                    throw new Error("Missing GEMINI_API_KEY in Render Environment Variables.");
                }

                const { niche, audience, days } = JSON.parse(body);
                
                // صياغة الأمر وهندسته لتوليد كروت زجاجية سائلة جذابة
                const prompt = `You are an expert digital marketer. Create a ${days}-day social media content calendar for a business in the '${niche}' niche, targeting '${audience}'. Structure your answer inside clear HTML segments. For each day, use exactly this template: <div class='glass-card'><div class='day-badge'>📅 Day X</div><h3>[Insert Topic Title]</h3><p><strong>🌐 Platform:</strong> <span class='highlight'>[Insert Platform]</span></p><p><strong>✍️ Ad Copy:</strong><br><span class='copy-text'>[Insert Ad Copy with strong hooks and CTA]</span></p><p class='tags'>🔥 [Insert Hashtags]</p></div> Do not wrap the output in standard markdown blocks, just return raw HTML cards.`;

                // 🎯 التغيير الجذري: استخدام الموديل الشامل المستقر لتجنب خطأ الـ 404 تماماً
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

                // بدء توليد المحتوى من السيرفر
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const aiText = response.text();

                if (!aiText) {
                    throw new Error("Google AI Engine returned empty data. Please try again.");
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ html: aiText }));

            } catch (error) {
                // تمرير الخطأ بذكاء لمنع تجمد واجهة الموقع
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Resource Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`⚡ CYBERVEN SPEED ENGINE IS LIVE ⚡`);
});
