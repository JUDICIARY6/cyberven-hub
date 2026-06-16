const http = require('http');
const fs = require('fs');
const path = require('path');

// استخدام مفتاح DeepSeek الجديد
const DS_API_KEY = process.env.DS_API_KEY ? process.env.DS_API_KEY.trim() : ''; 
const PORT = 10000; 

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) { res.writeHead(500); return res.end(); }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });

    } else if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { niche, audience, days } = JSON.parse(body);
                const prompt = `Create a ${days}-day social media content calendar for a '${niche}' business, targeting '${audience}'. Use this template for each day: <div class='glass-card'><div class='day-badge'>📅 Day X</div><h3>[Topic]</h3><p><strong>🌐 Platform:</strong> [Platform]</p><p><strong>✍️ Ad Copy:</strong> [Copy]</p><p class='tags'>🔥 [Hashtags]</p></div> Return raw HTML only.`;

                // الاتصال المباشر بمحرك DeepSeek
                const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
                const aiText = data.choices[0].message.content;

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
