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

// NYX environment elements
let skybox;
let clouds = [];
let buildings = [];
let cars = [];

// Create NYC environment
function createNYCEnvironment() {
    createSkybox();
    createClouds();
    createBuildings();
    createCars();
}

// Create skybox with NYC sky color
function createSkybox() {
    // Create subtle gradient sky effect
    const topColor = new THREE.Color(0x72A6DB); // Light blue at top
    const bottomColor = new THREE.Color(0xD6E6F3); // Lighter blue/white at horizon
    
    scene.background = new THREE.Color(0x72A6DB);
    scene.fog = new THREE.Fog(bottomColor, 25, 80); // Add distance fog
    
    // Add a directional light to simulate sunlight
    const sunLight = new THREE.DirectionalLight(0xfffacc, 1);
    sunLight.position.set(5, 15, 8);
    sunLight.castShadow = true;
    
    // Improve shadow quality
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    
    scene.add(sunLight);
}

// Create clouds
function createClouds() {
    // Create cloud group
    const cloudGroup = new THREE.Group();
    scene.add(cloudGroup);
    
    // Function to create a single cloud
    function createCloud(x, y, z, scale) {
        const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
        const cloudMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        
        // Create a group of spheres to form a cloud
        const cloud = new THREE.Group();
        
        // Create multiple spheres for a puffy look
        const numPuffs = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numPuffs; i++) {
            const puff = new THREE.Mesh(cloudGeometry, cloudMaterial);
            puff.position.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 2
            );
            puff.scale.set(
                Math.random() * 0.8 + 0.6,
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.8 + 0.6
            );
            cloud.add(puff);
        }
        
        cloud.position.set(x, y, z);
        cloud.scale.set(scale, scale * 0.6, scale);
        
        cloudGroup.add(cloud);
        clouds.push({
            mesh: cloud,
            speed: Math.random() * 0.02 + 0.01,
            direction: new THREE.Vector3(1, 0, 0)
        });
    }
    
    // Create multiple clouds
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = 20 + Math.random() * 15;
        const z = (Math.random() - 0.5) * 100;
        const scale = Math.random() * 3 + 3;
        
        createCloud(x, y, z, scale);
    }
}

// Create NYC skyline buildings
function createBuildings() {
    // Create buildings along the perimeter
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    
    // Create building materials
    const buildingMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x8C8C8C, roughness: 0.8, metalness: 0.2 }), // Concrete
        new THREE.MeshStandardMaterial({ color: 0x4D4D4D, roughness: 0.7, metalness: 0.3 }), // Dark concrete
        new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6, metalness: 0.4 }), // Medium grey
        new THREE.MeshStandardMaterial({ color: 0x505355, roughness: 0.6, metalness: 0.6 }) // Metallic
    ];
    
    // Glass material
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a9bd5,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    
    // Function to create a building
    function createBuilding(x, z, width, depth, height) {
        // Main building
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        // Add windows as a second material
        const windowsGeometry = new THREE.BoxGeometry(width * 0.98, height * 0.98, depth * 0.98);
        const windowsMaterial = glassMaterial;
        const windows = new THREE.Mesh(windowsGeometry, windowsMaterial);
        
        // Position building
        building.position.set(x, height/2 - 0.5, z); // Adjust y position so buildings sit on ground
        windows.position.set(0, 0, 0);
        
        // Add windows to building
        building.add(windows);
        buildingGroup.add(building);
        buildings.push(building);
    }
    
    // Create buildings around the perimeter
    const courtSize = 25; // Assuming court is roughly this size
    const buildingDistance = 30; // Closer to court (was 35)
    const numBuildings = 40;
    
    for (let i = 0; i < numBuildings; i++) {
        // Calculate position around perimeter
        const angle = (i / numBuildings) * Math.PI * 2;
        const distance = buildingDistance + Math.random() * 10;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Random building dimensions - make them taller
        const width = 5 + Math.random() * 10;
        const depth = 5 + Math.random() * 10;
        const height = 25 + Math.random() * 60; // Much taller buildings (was 15 + random * 40)
        
        createBuilding(x, z, width, depth, height);
    }
    
    // Add some iconic buildings - make them even taller
    createBuilding(-30, -40, 8, 8, 90); // Empire State-like (was 60)
    createBuilding(35, -35, 10, 10, 80); // Another skyscraper (was 50)
    createBuilding(-20, 40, 15, 15, 70); // Wide office building (was 40)
    
    // Add One World Trade Center style building
    createBuilding(40, 40, 12, 12, 110); // Very tall building with square base
}

// Create cars that move along streets
function createCars() {
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    
    // Car colors
    const carColors = [
        0xF6D236, // Yellow (taxi)
        0xE62E2E, // Red
        0x2E70E6, // Blue
        0x2EE675, // Green
        0xFFFFFF, // White
        0x000000  // Black
    ];
    
    // Function to create a car
    function createCar(x, z, color, direction) {
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.75, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Car top
        const topGeometry = new THREE.BoxGeometry(1.8, 0.5, 2);
        const topMaterial = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, 0.625, -0.5);
        body.add(top);
        
        // Car wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1 });
        
        // Add wheels at each corner
        const wheelPositions = [
            [-0.9, -0.3, 1.2],
            [0.9, -0.3, 1.2],
            [-0.9, -0.3, -1.2],
            [0.9, -0.3, -1.2]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            body.add(wheel);
        });
        
        // Create headlights and taillights
        const lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headlightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFCC,
            emissive: 0xFFFFCC,
            emissiveIntensity: 0.5
        });
        
        const taillightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.5
        });
        
        // Add headlights
        const headlight1 = new THREE.Mesh(lightGeometry, headlightMaterial);
        const headlight2 = new THREE.Mesh(lightGeometry, headlightMaterial);
        headlight1.position.set(-0.6, 0, 2);
        headlight2.position.set(0.6, 0, 2);
        headlight1.scale.set(0.5, 0.5, 0.1);
        headlight2.scale.set(0.5, 0.5, 0.1);
        body.add(headlight1);
        body.add(headlight2);
        
        // Add taillights
        const taillight1 = new THREE.Mesh(lightGeometry, taillightMaterial);
        const taillight2 = new THREE.Mesh(lightGeometry, taillightMaterial);
        taillight1.position.set(-0.6, 0, -2);
        taillight2.position.set(0.6, 0, -2);
        taillight1.scale.set(0.5, 0.5, 0.1);
        taillight2.scale.set(0.5, 0.5, 0.1);
        body.add(taillight1);
        body.add(taillight2);
        
        // Position car
        body.position.set(x, 0, z);
        
        // Rotate car based on direction (angle in radians)
        body.rotation.y = direction;
        
        carGroup.add(body);
        cars.push({
            mesh: body,
            speed: 0.1 + Math.random() * 0.1,
            startX: x,
            startZ: z,
            maxDistance: 100 + Math.random() * 50,
            direction: direction,
            distanceMoved: 0
        });
    }
    
    // Create "streets" of cars
    const numCars = 15;
    
    // East-West Street (Z axis)
    for (let i = 0; i < numCars/3; i++) {
        const x = -40 + Math.random() * 30; // Left side of court
        const z = 30 + i * 10 + Math.random() * 5;
        createCar(x, z, carColors[Math.floor(Math.random() * carColors.length)], 0);
    }
    
    for (let i = 0; i < numCars/3; i++) {
        const x = 40 - Math.random() * 30; // Right side of court
        const z = -30 - i * 10 - Math.random() * 5;
        createCar(x, z, carColors[Math.floor(Math.random() * carColors.length)], Math.PI);
    }
    
    // North-South Street (X axis)
    for (let i = 0; i < numCars/3; i++) {
        const x = 30 + i * 10 + Math.random() * 5;
        const z = -40 + Math.random() * 30;
        createCar(x, z, carColors[Math.floor(Math.random() * carColors.length)], Math.PI / 2);
    }
}

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
            basketballObj.position.set(0, 1.5, 0); // Lower starting position (was 5)
            basketballObj.scale.set(0.1, 0.1, 0.1); // Scale down the basketball
            scene.add(basketballObj);
            console.log('Basketball model loaded successfully');

            // Create basketball physics body with improved bouncing
            const ballShape = new Ammo.btSphereShape(0.1); // Radius of the basketball
            const ballTransform = new Ammo.btTransform();
            ballTransform.setIdentity();
            ballTransform.setOrigin(new Ammo.btVector3(0, 1.5, 0)); // Match the new position
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
    
    // Animate clouds
    clouds.forEach(cloud => {
        cloud.mesh.position.x += cloud.speed * cloud.direction.x;
        
        // Reset cloud position if it goes too far
        if (cloud.mesh.position.x > 100) {
            cloud.mesh.position.x = -100;
        }
    });
    
    // Animate cars
    cars.forEach(car => {
        // Move the car based on its direction and speed
        if (car.direction === 0) { // East direction
            car.mesh.position.x += car.speed;
            car.distanceMoved += car.speed;
            
            // Turn around if gone too far
            if (car.distanceMoved > car.maxDistance) {
                car.mesh.rotation.y = Math.PI;
                car.direction = Math.PI;
                car.distanceMoved = 0;
            }
        } else if (car.direction === Math.PI) { // West direction
            car.mesh.position.x -= car.speed;
            car.distanceMoved += car.speed;
            
            // Turn around if gone too far
            if (car.distanceMoved > car.maxDistance) {
                car.mesh.rotation.y = 0;
                car.direction = 0;
                car.distanceMoved = 0;
            }
        } else if (car.direction === Math.PI / 2) { // North direction
            car.mesh.position.z += car.speed;
            car.distanceMoved += car.speed;
            
            // Turn around if gone too far
            if (car.distanceMoved > car.maxDistance) {
                car.mesh.rotation.y = -Math.PI / 2;
                car.direction = -Math.PI / 2;
                car.distanceMoved = 0;
            }
        } else if (car.direction === -Math.PI / 2) { // South direction
            car.mesh.position.z -= car.speed;
            car.distanceMoved += car.speed;
            
            // Turn around if gone too far
            if (car.distanceMoved > car.maxDistance) {
                car.mesh.rotation.y = Math.PI / 2;
                car.direction = Math.PI / 2;
                car.distanceMoved = 0;
            }
        }
    });

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
            console.log('Creating NYC environment without physics...');
            createNYCEnvironment();
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
            // Create NYC environment BEFORE loading models to ensure it's visible
            console.log('Creating NYC environment...');
            createNYCEnvironment();
            loadModels();
            console.log('Started loading models');
            animate(); // Start animation loop after physics and models are loaded
        }).catch(function(error) {
            console.error('Failed to load Ammo.js:', error);
            // Continue without physics
            console.log('Creating NYC environment without physics...');
            createNYCEnvironment();
            loadModels();
            animate();
        });
    } catch (e) {
        console.error('Error initializing Ammo.js:', e);
        // Continue without physics
        console.log('Creating NYC environment without physics due to error...');
        createNYCEnvironment();
        loadModels();
        animate();
    }
}
