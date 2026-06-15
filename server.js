const http = require('http');
const fs = require('fs');
const path = require('path');

// قراءة المفتاح بأمان من بيئة العمل السحابية لمنع الحظر التلقائي من جوجل
const API_KEY = process.env.GEMINI_API_KEY; 
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
            if (err) { 
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error loading Cyberven Interface'); 
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });

    } else if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                if (!API_KEY) {
                    throw new Error("Missing GEMINI_API_KEY in Render Environment Variables.");
                }

                const { niche, audience, days } = JSON.parse(body);
                
                const prompt = `You are an expert digital marketer. Create a ${days}-day social media content calendar for a business in the '${niche}' niche, targeting '${audience}'. Structure your answer inside clear HTML segments. For each day, use exactly this template: <div class='glass-card'><div class='day-badge'>📅 Day X</div><h3>[Insert Topic Title]</h3><p><strong>🌐 Platform:</strong> <span class='highlight'>[Insert Platform]</span></p><p><strong>✍️ Ad Copy:</strong><br><span class='copy-text'>[Insert Ad Copy with strong hooks and CTA]</span></p><p class='tags'>🔥 [Insert Hashtags]</p></div> Do not wrap the output in standard markdown blocks, just return raw HTML cards.`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                const data = await response.json();
                
                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error(data.error ? data.error.message : "Google AI Engine returned empty candidates.");
                }

                const aiText = data.candidates[0].content.parts[0].text;
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ html: aiText }));

            } catch (error) {
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
