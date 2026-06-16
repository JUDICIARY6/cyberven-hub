const http = require('http');
const fs = require('fs');
const path = require('path');

const DS_API_KEY = process.env.DS_API_KEY ? process.env.DS_API_KEY.trim() : ''; 
const PORT = 10000; 

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { niche, audience, days } = JSON.parse(body);
                const prompt = `Create a ${days}-day content calendar for '${niche}' targeting '${audience}'. Use HTML <div class='glass-card'> format for each day. Return ONLY HTML.`;

                const response = await fetch("https://api.deepseek.com/chat/completions", {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DS_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [{ role: "user", content: prompt }]
                    })
                });

                const data = await response.json();
                
                // 🎯 التصحيح الذكي: فحص هيكل الرد قبل قراءته
                let aiText = "عذراً، لم يتم العثور على محتوى في رد السيرفر.";
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    aiText = data.choices[0].message.content;
                } else {
                    console.log("هيكل الرد غير متوقع:", JSON.stringify(data)); // هذا السطر سيظهر لك الهيكل في الـ Logs
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ html: aiText }));

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
});

server.listen(PORT);
