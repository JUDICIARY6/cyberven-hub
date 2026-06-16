const http = require('http');
const fs = require('fs');
const path = require('path');

// استخدام المنفذ الذي يحدده Render، وإلا استخدم 10000
const PORT = process.env.PORT || 10000;
const DS_API_KEY = process.env.DS_API_KEY ? process.env.DS_API_KEY.trim() : '';

const server = http.createServer((req, res) => {
    // إعدادات الـ CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) { res.writeHead(500); res.end('Error'); return; }
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
                
                // فحص هيكل الرد الجديد للـ V4
                let aiText = "";
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    aiText = data.choices[0].message.content;
                } else {
                    aiText = "<div class='glass-card'>عذراً، المحرك عاد برد غير متوقع. يرجى المحاولة مرة أخرى.</div>";
                    console.error("DeepSeek API Response:", JSON.stringify(data));
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
