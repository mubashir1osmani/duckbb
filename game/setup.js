// Basic Three.js setup for Duck Basketball
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class DuckBasketballGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = null;
    this.clock = new THREE.Clock();
    
    this.init();
  }
  
  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB); // Sky blue background
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Setup camera
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);
    
    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Create basketball court
    this.createCourt();
    
    // Add a simple duck placeholder
    this.createSimpleDuck();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Start animation loop
    this.animate();
  }
  
  createCourt() {
    // Court floor
    const courtTexture = new THREE.TextureLoader().load('court_texture.jpg');
    courtTexture.wrapS = THREE.RepeatWrapping;
    courtTexture.wrapT = THREE.RepeatWrapping;
    
    const courtGeometry = new THREE.PlaneGeometry(30, 15);
    const courtMaterial = new THREE.MeshStandardMaterial({ 
      map: courtTexture,
      side: THREE.DoubleSide
    });
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.rotation.x = -Math.PI / 2;
    court.receiveShadow = true;
    this.scene.add(court);
    
    // Backboards and hoops
    this.createHoop(-13, 0);
    this.createHoop(13, 0);
  }
  
  createHoop(x, z) {
    // Backboard
    const backboardGeometry = new THREE.BoxGeometry(0.5, 3.5, 6);
    const backboardMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(x, 5, z);
    backboard.castShadow = true;
    this.scene.add(backboard);
    
    // Hoop
    const hoopGeometry = new THREE.TorusGeometry(1, 0.1, 16, 32);
    const hoopMaterial = new THREE.MeshStandardMaterial({ color: 0xFF5500 });
    const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
    hoop.position.set(x - 1.5, 3.5, z);
    hoop.rotation.y = Math.PI / 2;
    hoop.castShadow = true;
    this.scene.add(hoop);
  }
  
  createSimpleDuck() {
    // This is a placeholder - would be replaced with proper 3D duck model
    // Body
    const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
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
    
    // Add the duck to the scene
    this.scene.add(body);
    
    // Add a basketball
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xD35400 });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(2, 0.5, 0);
    ball.castShadow = true;
    this.scene.add(ball);
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
  const game = new DuckBasketballGame('game-container');
});

export default DuckBasketballGame;