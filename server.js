const http = require('http');
const fs = require('fs');
const path = require('path');
// استدعاء مكتبة جوجل الرسمية للذكاء الاصطناعي التي تحل مشاكل المسارات تماماً
const { GoogleGenAI } = require('@google/generative-ai');

// قراءة مفتاح الـ API بأمان من متغيرات البيئة في Render لمنع حظره تلقائياً
const API_KEY = process.env.GEMINI_API_KEY; 
const PORT = 10000; 

// تهيئة مكتبة جوجل باستخدام المفتاح السري
let ai = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

const server = http.createServer((req, res) => {
    // إعدادات الـ CORS الكاملة لمنع أي حجب من الهواتف والمتصفحات
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // [1] عرض واجهة المستخدم الأساسية للموقع (index.html)
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) { 
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error loading Cyberven Interface'); 
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });

    // [2] استقبال البيانات وتوليد المحتوى عبر المكتبة الرسمية المعتمدة
    } else if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                if (!API_KEY || !ai) {
                    throw new Error("Missing GEMINI_API_KEY in Render Environment Variables.");
                }

                const { niche, audience, days } = JSON.parse(body);
                
                // صياغة الأمر الموجه لتصميم الكروت الزجاجية السائلة الساحرة
                const prompt = `You are an expert digital marketer. Create a ${days}-day social media content calendar for a business in the '${niche}' niche, targeting '${audience}'. Structure your answer inside clear HTML segments. For each day, use exactly this template: <div class='glass-card'><div class='day-badge'>📅 Day X</div><h3>[Insert Topic Title]</h3><p><strong>🌐 Platform:</strong> <span class='highlight'>[Insert Platform]</span></p><p><strong>✍️ Ad Copy:</strong><br><span class='copy-text'>[Insert Ad Copy with strong hooks and CTA]</span></p><p class='tags'>🔥 [Insert Hashtags]</p></div> Do not wrap the output in standard markdown blocks, just return raw HTML cards.`;

                // استخدام دالة المكتبة الرسمية التي تطلب الموديل المتوافق والنشط تلقائياً من خوادم جوجل
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: prompt,
                });

                // استخراج النص المولد مباشرة بدون تعقيدات تفكيك الـ JSON اليدوية
                const aiText = response.text;

                if (!aiText) {
                    throw new Error("Google AI Engine returned an empty response. Please try again.");
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ html: aiText }));

            } catch (error) {
                // إرجاع رسالة الخطأ الصريحة إلى الواجهة لتسهيل تتبعها وضمان عدم تجميد الصفحة
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
    console.log(`⚡ CYBERVEN SPEED ENGINE IS LIVE ON PORT ${PORT} ⚡`);
});
