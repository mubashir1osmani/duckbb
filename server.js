import express from 'express';
import { createServer } from 'http';
import { Server, OPEN } from 'ws';

const app = express();
const server = createServer(app);
app.use(express.static(__dirname));
const wss = new Server({ server });

wss.on('connection', (ws) => {
    console.log('Player connected');
    ws.on('message', (message) => {
        // Broadcast player actions (e.g., position, shots)
        wss.clients.forEach(client => {
            if (client.readyState === OPEN) {
                client.send(message);
            }
        });
    });
});

server.listen(8080, () => console.log('Server running on port 8080'));