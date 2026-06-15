const http = require('http');
const fs = require('fs');
const path = require('path');

// قراءة مفتاح الـ API الخاص بك بأمان من بيئة عمل Render لمنع الحظر التلقائي
const API_KEY = process.env.GEMINI_API_KEY; 
const PORT = 10000; // المنفذ الثابت المعتمد لخوادم Render لمنع انقطاع الاتصال

const server = http.createServer((req, res) => {
    // إعدادات الـ CORS الكاملة والشاملة لتشغيل الاتصال السحابي السريع بدون قيود المتصفحات
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // التعامل مع طلبات التحقق المسبق (Preflight) التي ترسلها بعض المتصفحات تلقائياً
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 1. عرض واجهة المستخدم الأساسية للموقع (index.html) عند فتح الرابط الرئيسي
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) { 
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error loading Cyberven Interface'); 
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });

    // 2. استقبال البيانات المدخلة من الواجهة ومعالجتها ثم إرسالها إلى ذكاء جوجل الاصطناعي
    } else if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        
        // تجميع قطع البيانات القادمة من المتصفح
        req.on('data', chunk => { body += chunk.toString(); });
        
        req.on('end', async () => {
            try {
                // التحقق من وجود المفتاح السري في إعدادات Render
                if (!API_KEY) {
                    throw new Error("Missing GEMINI_API_KEY in Render Environment Variables. Please check Render dashboard.");
                }

                // تفكيك البيانات القادمة من نموذج الإدخال (النيش، الجمهور، الأيام)
                const { niche, audience, days } = JSON.parse(body);
                
                // هندسة الأوامر (Prompt Engineering) لإجبار الذكاء الاصطناعي على توليد كروت زجاجية فخمة
                const prompt = `You are an expert digital marketer. Create a ${days}-day social media content calendar for a business in the '${niche}' niche, targeting '${audience}'. Structure your answer inside clear HTML segments. For each day, use exactly this template: <div class='glass-card'><div class='day-badge'>📅 Day X</div><h3>[Insert Topic Title]</h3><p><strong>🌐 Platform:</strong> <span class='highlight'>[Insert Platform]</span></p><p><strong>✍️ Ad Copy:</strong><br><span class='copy-text'>[Insert Ad Copy with strong hooks and CTA]</span></p><p class='tags'>🔥 [Insert Hashtags]</p></div> Do not wrap the output in standard markdown blocks, just return raw HTML cards.`;

                // 🎯 الرابط الرسمي النهائي والمستقر المعتمد من جوجل لـ Gemini 1.5 Flash منعاً لأي خطأ مسار
                const googleApiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

                const response = await fetch(googleApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                });

                // قراءة الرد النصي الخام من جوجل أولاً لفحصه بدقة ومعالجة الأخطاء بأمان
                const responseText = await response.text();
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    throw new Error("Google AI returned an unexpected response format. Please try again.");
                }
                
                // فحص إذا كانت خوادم جوجل قد أرجعت خطأ في محتوى الـ JSON
                if (!response.ok || data.error || !data.candidates || data.candidates.length === 0) {
                    const errorMsg = data.error ? data.error.message : "Google Engine rejected the model request structure.";
                    throw new Error(errorMsg);
                }

                // استخراج النص البرمجي (الخطة التسويقية) المولد من ذكاء جوجل
                const aiText = data.candidates[0].content.parts[0].text;
                
                // إرسال النتيجة النهائية بنجاح إلى واجهة المستخدم بصيغة JSON نظيفة
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ html: aiText }));

            } catch (error) {
                // إرجاع تفاصيل الخطأ إلى الواجهة في حال حدوث أي عطل أثناء التوليد
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        // في حال طلب رابط غير موجود بالسيرفر
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Resource Not Found');
    }
});

// إطلاق الخادم وجعله يستمع لطلبات المتصفح
server.listen(PORT, () => {
    console.log(`⚡ CYBERVEN SPEED ENGINE IS LIVE ON PORT ${PORT} ⚡`);
});
