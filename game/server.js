// server.js - Node.js server using Socket.io
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const gameRooms = {};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Player joins the game
  socket.on('joinGame', (playerData) => {
    const { playerName, roomId } = playerData;
    
    // Create room if it doesn't exist
    if (!gameRooms[roomId]) {
      gameRooms[roomId] = {
        players: {},
        ballPosition: { x: 0, y: 1, z: 0 },
        score: { team1: 0, team2: 0 }
      };
    }
    
    // Add player to room
    socket.join(roomId);
    
    // Random starting position on the court
    const randomX = Math.floor(Math.random() * 10) - 5;
    const randomZ = Math.floor(Math.random() * 6) - 3;
    
    // Assign team
    const playersInRoom = Object.keys(gameRooms[roomId].players).length;
    const team = playersInRoom % 2 === 0 ? 'team1' : 'team2';
    
    // Create player
    gameRooms[roomId].players[socket.id] = {
      id: socket.id,
      name: playerName,
      position: { x: randomX, y: 1.5, z: randomZ },
      rotation: { x: 0, y: 0, z: 0 },
      team,
      hasBall: false,
      animation: 'idle'
    };
    
    // Send current game state to the new player
    socket.emit('gameState', gameRooms[roomId]);
    
    // Notify other players about the new player
    socket.to(roomId).emit('playerJoined', gameRooms[roomId].players[socket.id]);
    
    console.log(`Player ${playerName} joined room ${roomId}`);
  });
  
  // Player updates their position/rotation
  socket.on('updatePlayer', (data) => {
    const { roomId, position, rotation, animation } = data;
    
    if (gameRooms[roomId] && gameRooms[roomId].players[socket.id]) {
      // Update player data
      gameRooms[roomId].players[socket.id].position = position;
      gameRooms[roomId].players[socket.id].rotation = rotation;
      gameRooms[roomId].players[socket.id].animation = animation;
      
      // Broadcast to other players in the room
      socket.to(roomId).emit('playerMoved', {
        id: socket.id,
        position,
        rotation,
        animation
      });
    }
  });
  
  // Player shoots the ball
  socket.on('shootBall', (data) => {
    const { roomId, ballPosition, ballVelocity, shootingPlayer } = data;
    
    if (gameRooms[roomId]) {
      // Update ball state
      gameRooms[roomId].ballPosition = ballPosition;
      
      // Broadcast to all players in the room
      io.to(roomId).emit('ballShot', {
        ballPosition,
        ballVelocity,
        shootingPlayer
      });
    }
  });
  
  // Ball scored
  socket.on('ballScored', (data) => {
    const { roomId, team, points } = data;
    
    if (gameRooms[roomId]) {
      // Update score
      gameRooms[roomId].score[team] += points;
      
      // Broadcast score update
      io.to(roomId).emit('scoreUpdate', gameRooms[roomId].score);
    }
  });
  
  // Player disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from any room they were in
    Object.keys(gameRooms).forEach((roomId) => {
      if (gameRooms[roomId].players[socket.id]) {
        // Notify other players
        socket.to(roomId).emit('playerLeft', socket.id);
        
        // Remove player
        delete gameRooms[roomId].players[socket.id];
        
        // Clean up empty rooms
        if (Object.keys(gameRooms[roomId].players).length === 0) {
          delete gameRooms[roomId];
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});