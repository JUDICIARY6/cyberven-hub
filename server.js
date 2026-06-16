const http = require('http');
const fs = require('fs');
const path = require('path');

// Render يحدد المنفذ عبر process.env.PORT
const PORT = process.env.PORT || 10000;
const GROQ_API_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';

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

                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "llama3-8b-8192",
                        messages: [{ role: "user", content: prompt }]
                    })
                });

                const data = await response.json();
                
                if (data.choices && data.choices[0]) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ html: data.choices[0].message.content }));
                } else {
                    throw new Error("خطأ في رد Groq");
                }
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "فشل الاتصال" }));
            }
        });
    }
});

// هذا هو الجزء الأهم لـ Render
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
