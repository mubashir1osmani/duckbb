import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js';

// Physics variables
let physicsWorld;
const rigidBodies = [];
const clock = new THREE.Clock();

// Player variables - moved outside of functions for global scope
let duckModel;
const movementSpeed = 0.05; // Adjust speed as needed
const keysPressed = {}; // Keep track of pressed keys

// Jump variables
let isJumping = false;
let jumpHeight = 1.5; // Maximum height of jump
let jumpSpeed = 0.1; // Speed of the jump
let jumpVelocity = 0; // Current jump velocity
let gravity = 0.005; // Gravity pulling down
let duckDefaultY = -1; // Default y position of the duck on the ground

// Ball handling variables
let hasBall = false; // Whether the duck is currently holding the ball
let ballPickupDistance = 0.5; // How close the duck needs to be to pick up the ball
let shootingPower = 15; // Power of the shot
let shootCooldown = 0; // Cooldown timer for shooting

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.y = 2; // Move camera up slightly

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Create the dunk trigger outside of the animation loop
const dunkTriggerGeometry = new THREE.BoxGeometry(2, 3, 2);
const dunkTriggerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x0000ff, 
    transparent: true, 
    opacity: 0.1,
    wireframe: true 
});
const dunkTrigger = new THREE.Mesh(dunkTriggerGeometry, dunkTriggerMaterial);
dunkTrigger.position.set(0, 2, -10); // Position near the hoop (adjust as needed)
scene.add(dunkTrigger);

// Basketball object reference for interactions
let basketballObj = null;
let basketballBody = null;

// Hoop position for camera orientation
let hoopPosition = new THREE.Vector3(0, 2, -10);
let playerSide = 'home'; // 'home' or 'away' to track which side player is on

function initPhysics() {
    // Physics world setup
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0)); // Gravity

    // Create the ground plane (court) physics body
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(10, 0.5, 15)); // Half extents of the court
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -1.5, 0)); // Position the ground plane
    const groundMass = 0; // Static body
    const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
    const groundRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(groundMass, groundMotionState, groundShape, new Ammo.btVector3(0, 0, 0));
    const groundRigidBody = new Ammo.btRigidBody(groundRigidBodyInfo);
    physicsWorld.addRigidBody(groundRigidBody);
}

function loadModels() {
    // Log attempt to load models
    console.log('Attempting to load models from:');
    console.log('- Court model: public/street_basketball_court/scene.gltf');
    console.log('- Duck model: public/Shaded/base_basic_shaded.glb');
    console.log('- Basketball model: public/basketball/scene.gltf');
    
    // Load Basketball Court Model
    const loader = new GLTFLoader();
    loader.load(
        // resource URL relative to index.html
        'public/street_basketball_court/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            const courtModel = gltf.scene;
            courtModel.position.y = -1; // Position the court
            scene.add(courtModel);
            console.log('Basketball court model loaded successfully');
            
            // Store the hoop position for camera orientation
            hoopPosition = new THREE.Vector3(0, 2, -10); // Adjust based on your court model
        },
        // called while loading is progressing
        function (xhr) {
            console.log('Court model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // called when loading has errors
        function (error) {
            console.error('An error happened loading the court model:', error);
        }
    );

    // Load Duck Model
    loader.load( // Reuse the same loader instance
        // resource URL relative to index.html
        'public/Shaded/base_basic_shaded.glb',
        // called when the resource is loaded
        function (gltf) {
            duckModel = gltf.scene; // Assign to the global variable
            duckModel.position.y = -1; // Place it on the court
            duckModel.scale.set(0.5, 0.5, 0.5); // Scale down if needed
            scene.add(duckModel);
            console.log('Duck model loaded successfully');
        },
        // called while loading is progressing
        function (xhr) {
            console.log('Duck model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // called when loading has errors
        function (error) {
            console.error('An error happened loading the duck model:', error);
        }
    );

    // Load Basketball Model
    loader.load(
        // resource URL relative to index.html
        'public/basketball/scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            basketballObj = gltf.scene;
            basketballObj.position.set(0, 5, 0); // Start the ball in the air
            basketballObj.scale.set(0.1, 0.1, 0.1); // Scale down the basketball
            scene.add(basketballObj);
            console.log('Basketball model loaded successfully');

            // Create basketball physics body with improved bouncing
            const ballShape = new Ammo.btSphereShape(0.1); // Radius of the basketball
            const ballTransform = new Ammo.btTransform();
            ballTransform.setIdentity();
            ballTransform.setOrigin(new Ammo.btVector3(0, 5, 0));
            const ballMass = 0.6; // Lighter ball for better bounces
            const localInertia = new Ammo.btVector3(0, 0, 0);
            ballShape.calculateLocalInertia(ballMass, localInertia);
            const ballMotionState = new Ammo.btDefaultMotionState(ballTransform);
            const ballRigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(ballMass, ballMotionState, ballShape, localInertia);
            basketballBody = new Ammo.btRigidBody(ballRigidBodyInfo);
            
            // Set restitution (bounciness) - higher value means more bounce
            basketballBody.setRestitution(0.8);
            
            // Set friction
            basketballBody.setFriction(0.5);
            
            // Enable continuous collision detection for smoother interactions
            basketballBody.setCcdMotionThreshold(0.1);
            basketballBody.setCcdSweptSphereRadius(0.08);
            
            // Add to physics world
            physicsWorld.addRigidBody(basketballBody);
            rigidBodies.push({ mesh: basketballObj, physicsBody: basketballBody });
        },
        // called while loading is progressing
        function (xhr) {
            console.log('Basketball model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // called when loading has errors
        function (error) {
            console.error('An error happened loading the basketball model:', error);
        }
    );
}

// Ball handling functions
function pickupBall() {
    console.log('Ball picked up');
    hasBall = true;
    
    // Remove basketball from physics simulation temporarily
    if (basketballBody) {
        physicsWorld.removeRigidBody(basketballBody);
    }
    
    updateHeldBallPosition();
}

function updateHeldBallPosition() {
    if (!hasBall || !duckModel || !basketballObj) return;
    
    // Position the ball slightly in front and above the duck
    basketballObj.position.x = duckModel.position.x;
    basketballObj.position.z = duckModel.position.z - 0.3; // Slightly in front
    basketballObj.position.y = duckModel.position.y + 0.3; // Slightly above
}

function shootBall() {
    if (!hasBall || !basketballObj || !basketballBody) return;
    
    console.log('Shooting ball!');
    hasBall = false;
    
    // Calculate direction vector (where the duck is facing, assumed to be forward)
    const direction = new THREE.Vector3(0, 0.5, -1).normalize();
    
    // Add the basketball back to physics simulation
    physicsWorld.addRigidBody(basketballBody);
    
    // Reset ball transformation
    const ballTransform = new Ammo.btTransform();
    ballTransform.setIdentity();
    ballTransform.setOrigin(new Ammo.btVector3(
        basketballObj.position.x,
        basketballObj.position.y,
        basketballObj.position.z
    ));
    basketballBody.setWorldTransform(ballTransform);
    
    // Clear any existing velocity
    basketballBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
    basketballBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
    
    // Apply impulse force in the direction
    const impulse = new Ammo.btVector3(
        direction.x * shootingPower,
        direction.y * shootingPower,
        direction.z * shootingPower
    );
    basketballBody.applyImpulse(impulse, new Ammo.btVector3(0, 0, 0));
    
    // Add a bit of spin for realism
    const angularImpulse = new Ammo.btVector3(0.5, 0, 0);
    basketballBody.applyTorqueImpulse(angularImpulse);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    if (physicsWorld) {
        physicsWorld.stepSimulation(deltaTime, 10); // Step physics simulation

        // Update positions of rigid bodies
        for (let i = 0; i < rigidBodies.length; i++) {
            const objThree = rigidBodies[i].mesh;
            const objAmmo = rigidBodies[i].physicsBody;
            const ms = objAmmo.getMotionState();
            if (ms) {
                const tm = new Ammo.btTransform();
                ms.getWorldTransform(tm);
                const p = tm.getOrigin();
                const q = tm.getRotation();
                objThree.position.set(p.x(), p.y(), p.z());
                objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }
        }
    }

    // Update duck position based on keys pressed
    if (duckModel && basketballObj) {
        if (keysPressed['w'] || keysPressed['ArrowUp']) {
            duckModel.position.z -= movementSpeed;
        }
        if (keysPressed['s'] || keysPressed['ArrowDown']) {
            duckModel.position.z += movementSpeed;
        }
        if (keysPressed['a'] || keysPressed['ArrowLeft']) {
            duckModel.position.x -= movementSpeed;
        }
        if (keysPressed['d'] || keysPressed['ArrowRight']) {
            duckModel.position.x += movementSpeed;
        }

        // Handle jumping
        if (keysPressed[' '] && !isJumping) {
            isJumping = true;
            jumpVelocity = jumpSpeed;
        }

        if (isJumping) {
            duckModel.position.y += jumpVelocity;
            jumpVelocity -= gravity;

            if (duckModel.position.y <= duckDefaultY) {
                duckModel.position.y = duckDefaultY;
                isJumping = false;
                jumpVelocity = 0;
            }
        }
        
        // Check for ball pickup
        if (!hasBall) {
            const distanceToBall = duckModel.position.distanceTo(basketballObj.position);
            
            if (distanceToBall < ballPickupDistance) {
                pickupBall();
            }
        } else {
            // Update ball position to follow duck when held
            updateHeldBallPosition();
            
            // Handle shooting with 'E' key
            if (shootCooldown > 0) {
                shootCooldown--;
            }
            
            if (keysPressed['e'] && shootCooldown === 0) {
                shootBall();
                shootCooldown = 30; // Set cooldown to prevent rapid shooting (30 frames)
            }
        }

        // Smart camera that faces the hoop based on player's position
        // Check if player has crossed to the other side of the hoop
        const currentSide = duckModel.position.z < hoopPosition.z ? 'away' : 'home';
        
        if (currentSide !== playerSide) {
            // Player crossed sides, update side tracking
            playerSide = currentSide;
            console.log(`Player moved to ${playerSide} side`);
        }
        
        // Adjust camera based on which side of the hoop the player is on
        if (playerSide === 'home') {
            // Original side - camera behind player, looking at player (and toward hoop)
            camera.position.x = duckModel.position.x;
            camera.position.z = duckModel.position.z + 5; // Camera behind player
            camera.lookAt(duckModel.position);
        } else {
            // Away side - camera positioned to see player and hoop
            camera.position.x = duckModel.position.x;
            camera.position.z = duckModel.position.z - 5; // Camera in front of player
            // Look at point between player and hoop to keep both in view
            const lookTarget = new THREE.Vector3(
                (duckModel.position.x + hoopPosition.x) / 2,
                (duckModel.position.y + hoopPosition.y) / 2,
                (duckModel.position.z + hoopPosition.z) / 2
            );
            camera.lookAt(lookTarget);
        }
    }

    renderer.render(scene, camera);
}

// Handle Keyboard Input
window.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Welcome page logic
document.addEventListener('DOMContentLoaded', () => {
    // Start a minimal animation loop immediately to ensure rendering works
    function minimalAnimate() {
        requestAnimationFrame(minimalAnimate);
        
        // Rotate our debug cube to show something is working
        renderer.render(scene, camera);
    }
    minimalAnimate();
    
    const startButton = document.getElementById('startButton');
    const welcomePage = document.getElementById('welcome-page');
    const playerNameInput = document.getElementById('playerName');

    startButton.addEventListener('click', () => {
        const playerName = playerNameInput.value;
        console.log('Player name:', playerName);

        // Hide welcome page
        welcomePage.style.display = 'none';

        // Start the game
        startGame();
    });
});

function startGame() {
    console.log('Starting game...');
    
    // Check if Ammo is defined before trying to use it
    if (typeof Ammo === 'undefined') {
        console.error('Ammo.js is not loaded! Trying to load it now...');
        
        // Try to load Ammo.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/ammo.js@0.2.0/ammo.min.js';
        script.onload = () => {
            console.log('Ammo.js loaded dynamically');
            initAmmo();
        };
        script.onerror = () => {
            console.error('Failed to load Ammo.js dynamically');
            // Continue without physics
            loadModels();
            animate();
        };
        document.head.appendChild(script);
    } else {
        initAmmo();
    }
}

function initAmmo() {
    // Initialize physics
    try {
        console.log('Attempting to initialize Ammo.js...');
        Ammo().then(function (AmmoLib) {
            console.log('Ammo.js physics engine loaded successfully');
            Ammo = AmmoLib;
            initPhysics();
            console.log('Physics initialized');
            loadModels();
            console.log('Started loading models');
            animate(); // Start animation loop after physics and models are loaded
        }).catch(function(error) {
            console.error('Failed to load Ammo.js:', error);
            // Continue without physics
            loadModels();
            animate();
        });
    } catch (e) {
        console.error('Error initializing Ammo.js:', e);
        // Continue without physics
        loadModels();
        animate();
    }
}
