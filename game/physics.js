// physics.js - Basic game physics for Duck Basketball
import * as THREE from 'three';

class PhysicsSystem {
  constructor(game) {
    this.game = game;
    this.gravity = -9.8;
    this.objects = [];
    this.colliders = [];
    this.hoops = [];
  }
  
  init() {
    // Add court boundaries as colliders
    this.addCourtBoundaries();
    
    // Add hoops
    this.addHoops();
    
    // Start physics loop
    this.update = this.update.bind(this);
    this.game.addToUpdateLoop(this.update);
  }
  
  addCourtBoundaries() {
    // Court dimensions
    const courtWidth = 30;
    const courtLength = 15;
    const wallHeight = 5;
    
    // Invisible collision walls
    const createBoundary = (x, y, z, width, height, depth) => {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        transparent: true,
        opacity: 0.0 // Invisible
      });
      
      const boundary = new THREE.Mesh(geometry, material);
      boundary.position.set(x, y, z);
      
      // Add to scene and colliders
      this.game.scene.add(boundary);
      this.colliders.push(boundary);
    };
    
    // Add boundaries
    // Left wall
    createBoundary(-courtWidth/2 - 0.5, wallHeight/2, 0, 1, wallHeight, courtLength);
    
    // Right wall
    createBoundary(courtWidth/2 + 0.5, wallHeight/2, 0, 1, wallHeight, courtLength);
    
    // Front wall
    createBoundary(0, wallHeight/2, -courtLength/2 - 0.5, courtWidth, wallHeight, 1);
    
    // Back wall
    createBoundary(0, wallHeight/2, courtLength/2 + 0.5, courtWidth, wallHeight, 1);
  }
  
  addHoops() {
    // Create collision detection for hoops
    const createHoop = (x, z) => {
      // Hoop collider
      const hoopRadius = 1;
      const hoopPosition = new THREE.Vector3(x - 1.5, 3.5, z);
      
      // Create hoop detection object
      const hoop = {
        position: hoopPosition,
        radius: hoopRadius,
        team: x < 0 ? 'team2' : 'team1' // Left hoop for team2, right hoop for team1
      };
      
      this.hoops.push(hoop);
    };
    
    // Add hoops at both ends
    createHoop(-13, 0); // Left hoop
    createHoop(13, 0);  // Right hoop
  }
  
  addPhysicsObject(object) {
    if (!object.velocity) {
      object.velocity = new THREE.Vector3(0, 0, 0);
    }
    }   
}