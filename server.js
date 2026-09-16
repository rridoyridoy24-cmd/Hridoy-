const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

const clients = {};

wss.on('connection', (ws) => {
  let userUid = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'register') {
        userUid = data.uid;
        clients[userUid] = ws;
        console.log(`User registered: ${userUid}`);
      } else if (data.target && clients[data.target]) {
        clients[data.target].send(JSON.stringify(data));
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    if (userUid && clients[userUid]) {
      delete clients[userUid];
    }
  });
});

console.log(`Server running on port ${PORT}`);
