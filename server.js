const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

// index.html সহ সব স্ট্যাটিক ফাইল সার্ভ করার জন্য
app.use(express.static(path.join(__dirname, './')));

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'register') {
                clients.set(data.uid, ws);
                ws.uid = data.uid;
            } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
                const targetWs = clients.get(data.targetUid);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                    targetWs.send(JSON.stringify(data));
                }
            }
        } catch (err) {
            console.error(err);
        }
    });

    ws.on('close', () => {
        if (ws.uid) clients.delete(ws.uid);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
