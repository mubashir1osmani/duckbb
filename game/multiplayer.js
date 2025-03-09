// multiplayer.js - Client-side multiplayer functionality
import * as THREE from 'three';
import { io } from 'socket.io-client';

class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.socket = null;
    this.roomId = null;
    this.playerName = null;
    this.players = {};
    this.localPlayer = null;
    this.ball = null;
  }
  
  init(playerName, roomId) {
    this.playerName = playerName;
    this.roomId = roomId;
    
    // Connect to server
    this.socket = io();
    
    // Set up socket event listeners
    this.setupSocketListeners();
    
    // Create the ball
    this.createBall();
    
    // Join the game
    this.socket.emit('joinGame', {
      playerName: this.playerName,
      roomId: this.roomId
    });
  }
  
  setupSocketListeners() {
    // Receive initial game state
    this.socket.on('gameState', (gameState) => {
      // Add all existing players
      Object.values(gameState.players).forEach(playerData => {
        if (playerData.id === this.socket.id) {
          this.createLocalPlayer(playerData);
        } else {
          this.addPlayer(playerData);
        }
      });
      
      // Set ball position
      if (this.ball) {
        this.ball.position.copy(gameState.ballPosition);
      }
    });
    
    // New player joined
    this.socket.on('playerJoined', (playerData) => {
      this.addPlayer(playerData);
    });
    
    // Player moved
    this.socket.on('playerMoved', (playerData) => {
      if (this.players[playerData.id]) {
        const player = this.players[playerData.id];
        
        // Apply new position and rotation
        player.position.copy(playerData.position);
        player.rotation.copy(playerData.rotation);
        
        // Update animation if needed
        if (player.currentAnimation !== playerData.animation) {
          player.playAnimation(playerData.animation);
        }
      }
    });
    
    // Ball shot
    this.socket.on('ballShot', (ballData) => {
      if (this.ball) {
        // Reset ball physics
        this.ball.position.copy(ballData.ballPosition);
        this.ball.velocity = ballData.ballVelocity;
        this.game.physics.applyBallPhysics(this.ball);
      }
    });
    
    // Score update
    this.socket.on('scoreUpdate', (score) => {
      this.game.updateScoreboard(score);
    });
    
    // Player left
    this.socket.on('playerLeft', (playerId) => {
      if (this.players[playerId]) {
        this.game.scene.remove(this.players[playerId]);
        delete this.players[playerId];
      }
    });
  }
  
  createLocalPlayer(playerData) {
    // Create player duck 3D object
    this.localPlayer = this.createDuckModel(playerData.team);
    this.localPlayer.position.copy(playerData.position);
    
    // Add to scene
    this.game.scene.add(this.localPlayer);
    
    // Store in players collection
    this.players[playerData.id] = this.localPlayer;
    
    // Set up controls for local player
    this.setupPlayerControls();
  }
  
  addPlayer(playerData) {
    // Create player duck 3D object
    const player = this.createDuckModel(playerData.team);
    player.position.copy(playerData.position);
    
    // Add to scene
    this.game.scene.add(player);
    
    // Store in players collection
    this.players[playerData.id] = player;
  }
  
  createDuckModel(team) {
    // This would be replaced with loading the actual duck model
    // For now, create a simple placeholder with team colors
    const duckGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: team === 'team1' ? 0xFFDD00 : 0xDDAA00 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    duckGroup.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: team === 'team1' ? 0xFFDD00 : 0xDDAA00 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.8, 0.8);
    head.castShadow = true;
    body.add(head);
    
    // Bill
    const billGeometry = new THREE.ConeGeometry(0.4, 0.8, 32);
    const billMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
    const bill = new THREE.Mesh(billGeometry, billMaterial);
    bill.rotation.x = Math.PI / 2;
    bill.position.set(0, 0, 0.8);
    head.add(bill);
    
    // Add animations
    duckGroup.animations = {
      idle: this.createDuckIdleAnimation(duckGroup),
      run: this.createDuckRunAnimation(duckGroup),
      shoot: this.createDuckShootAnimation(duckGroup)
    };
    
    // Current animation
    duckGroup.currentAnimation = 'idle';
    duckGroup.playAnimation = (animationName) => {
      if (duckGroup.animations[animationName]) {
        duckGroup.currentAnimation = animationName;
        // Logic to play the animation would go here
      }
    };
    
    // Play default animation
    duckGroup.playAnimation('idle');
    
    return duckGroup;
  }
  
  createDuckIdleAnimation(duck) {
    // This would be more sophisticated in the real implementation
    return {
      play: () => {
        // Bobbing animation
        const bobAnimation = (time) => {
          duck.position.y = 1.5 + Math.sin(time * 2) * 0.1;
        };
        return bobAnimation;
      }
    };
  }
  
  createDuckRunAnimation(duck) {
    // Placeholder for running animation
    return {
      play: () => {
        // Running motion
        const runAnimation = (time) => {
          // More complex animation would go here
          duck.rotation.y = Math.sin(time * 5) * 0.1;
        };
        return runAnimation;
      }
    };
  }
  
  createDuckShootAnimation(duck) {
    // Placeholder for shooting animation
    return {
      play: () => {
        // Shooting motion
        const shootAnimation = (time) => {
          // Shooting animation would go here
        };
        return shootAnimation;
      }
    };
  }
  
  createBall() {
    // Create basketball
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballTexture = new THREE.TextureLoader().load('basketball_texture.jpg');
    const ballMaterial = new THREE.MeshStandardMaterial({ 
      map: ballTexture,
      color: 0xD35400 
    });
    
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.ball.position.set(0, 1, 0);
    this.ball.castShadow = true;
    
    // Add physics properties
    this.ball.velocity = new THREE.Vector3(0, 0, 0);
    this.ball.isHeld = false;
    this.ball.heldBy = null;
    
    this.game.scene.add(this.ball);
  }
  
  setupPlayerControls() {
    // Keyboard controls
    const keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shoot: false
    };
    
    // Key events
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': keys.forward = true; break;
        case 'KeyS': keys.backward = true; break;
        case 'KeyA': keys.left = true; break;
        case 'KeyD': keys.right = true; break;
        case 'Space': keys.jump = true; break;
        case 'KeyE': keys.shoot = true; break;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': keys.forward = false; break;
        case 'KeyS': keys.backward = false; break;
        case 'KeyA': keys.left = false; break;
        case 'KeyD': keys.right = false; break;
        case 'Space': keys.jump = false; break;
        case 'KeyE': keys.shoot = false; break;
      }
    });
    
    // Update player movement and send to server
    this.game.addToUpdateLoop((delta) => {
      if (!this.localPlayer) return;
      
      let moved = false;
      let animation = 'idle';
      
      // Movement
      const speed = 5 * delta;
      
      if (keys.forward) {
        this.localPlayer.position.z -= speed;
        moved = true;
        animation = 'run';
      }
      
      if (keys.backward) {
        this.localPlayer.position.z += speed;
        moved = true;
        animation = 'run';
      }
      
      if (keys.left) {
        this.localPlayer.position.x -= speed;
        moved = true;
        animation = 'run';
      }
      
      if (keys.right) {
        this.localPlayer.position.x += speed;
        moved = true;
        animation = 'run';
      }
      
      // Face movement direction
      if (moved) {
        // Calculate direction
        const direction = new THREE.Vector3(
          keys.right ? 1 : (keys.left ? -1 : 0),
          0,
          keys.backward ? 1 : (keys.forward ? -1 : 0)
        ).normalize();
        
        if (direction.length() > 0) {
          const angle = Math.atan2(direction.x, direction.z);
          this.localPlayer.rotation.y = angle;
        }
      }
      
      // Jump
      if (keys.jump) {
        // Jump logic would go here
      }
      
      // Shoot
      if (keys.shoot && this.ball.isHeld && this.ball.heldBy === this.socket.id) {
        // Shoot logic
        this.shootBall();
        animation = 'shoot';
      }
      
      // Update animation
      if (this.localPlayer.currentAnimation !== animation) {
        this.localPlayer.playAnimation(animation);
      }
      
      // Send update to server if position changed
      if (moved) {
        this.socket.emit('updatePlayer', {
          roomId: this.roomId,
          position: this.localPlayer.position,
          rotation: this.localPlayer.rotation,
          animation
        });
      }
      
      // Check for ball pickup
      this.checkBallPickup();
    });
  }
  
  checkBallPickup() {
    if (!this.ball.isHeld && this.localPlayer) {
      // Calculate distance between player and ball
      const distance = this.localPlayer.position.distanceTo(this.ball.position);
      
      // If close enough, pick up the ball
      if (distance < 2) {
        this.ball.isHeld = true;
        this.ball.heldBy = this.socket.id;
        
        // Attach ball to player
        this.localPlayer.add(this.ball);
        this.ball.position.set(1, 0, 0);
      }
    }
  }
  
  shootBall() {
    if (this.ball.isHeld && this.ball.heldBy === this.socket.id) {
      // Detach ball from player
      this.localPlayer.remove(this.ball);
      this.game.scene.add(this.ball);
      
      // Position in front of player
      this.ball.position.copy(this.localPlayer.position);
      this.ball.position.y += 2;
      
      // Calculate shooting direction
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.localPlayer.quaternion);
      
      // Add upward arc
      direction.y = 0.5;
      direction.normalize();
      
      // Set velocity
      const shootPower = 15;
      this.ball.velocity = direction.multiplyScalar(shootPower);
      this.ball.isHeld = false;
      this.ball.heldBy = null;
      
      // Send ball shot to server
      this.socket.emit('shootBall', {
        roomId: this.roomId,
        ballPosition: this.ball.position,
        ballVelocity: this.ball.velocity,
        shootingPlayer: this.socket.id
      });
    }
  }
}

export default MultiplayerManager;