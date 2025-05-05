import express from 'express';
import { createServer } from 'http';
// Correctly import WebSocketServer directly
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
app.use(express.static(__dirname));
const wss = new WebSocketServer({ server }); // Use WebSocketServer

let nextPlayerId = 1;
const clients = new Map(); // Store clients with their IDs

wss.on('connection', (ws) => {
    const playerId = nextPlayerId++;
    console.log(`Player ${playerId} connected`);
    ws.playerId = playerId;
    clients.set(playerId, ws);

    ws.send(JSON.stringify({ type: 'assign_id', id: playerId }));

    // Send existing players' info to the new player (optional but good)
    // clients.forEach((client, id) => {
    //     if (id !== playerId && client.playerData) { // Assuming you store some data
    //         ws.send(JSON.stringify({ type: 'player_update', ...client.playerData, id: id }));
    //     }
    // });

    ws.on('message', (messageString) => {
        let message;
        try {
            message = JSON.parse(messageString);
            if (!message || typeof message !== 'object' || !message.type) {
                 console.warn(`Received invalid message format from Player ${ws.playerId}: ${messageString}`);
                 return;
            }
            message.id = ws.playerId; // Add sender's ID
        } catch (e) {
            console.error(`Failed to parse message from Player ${ws.playerId}:`, messageString, e);
            return;
        }

        // Broadcast the message to all *other* clients
        clients.forEach((client, id) => {
            if (id !== ws.playerId && client.readyState === WebSocketServer.OPEN) {
                // Send the original message (already includes type and sender ID)
                client.send(JSON.stringify(message));
            }
        });

        // Optional: Store last known state on server for new connections
        // if (message.type === 'player_update') {
        //     ws.playerData = { x: message.x, y: message.y, z: message.z /*, hasBall: message.hasBall */ };
        // }
    });

    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        clients.delete(playerId);
        // Broadcast disconnect message
        clients.forEach((client) => {
            if (client.readyState === WebSocketServer.OPEN) {
                client.send(JSON.stringify({ type: 'player_left', id: playerId }));
            }
        });
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for Player ${playerId}:`, error);
        if (clients.has(playerId)) {
            clients.delete(playerId);
            // Broadcast disconnect message on error too
             clients.forEach((client) => {
                if (client.readyState === WebSocketServer.OPEN) {
                    client.send(JSON.stringify({ type: 'player_left', id: playerId }));
                }
            });
        }
    });
});

server.listen(8080, () => console.log('Server running on port 8080'));
