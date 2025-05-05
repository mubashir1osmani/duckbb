// Check if TWEEN is available, provide fallback if necessary
if (typeof TWEEN === 'undefined') {
    console.warn('TWEEN is not defined. Using a simple empty fallback to prevent errors.');
    window.TWEEN = {
        update: function() { /* No-op function */ }
    };
}

// DuckPlayer Class
class DuckPlayer {
    constructor(id, scene, isLocal = false) {
        this.id = id;
        this.scene = scene;
        this.isLocal = isLocal;
        
        // Character type - randomly select for visual variety
        this.characterType = this.getRandomCharacterType();
        
        // Replace simple box with the new duck mesh
        this.mesh = this.createDuckMesh(isLocal);
        this.scene.add(this.mesh);

        // Animation properties
        this.animationState = 'idle'; // idle, running, jumping, shooting
        this.animationTime = 0;
        this.animationSpeed = 1;
        this.jumpHeight = 0;
        this.jumpAngle = 0;
        
        // Physics properties
        this.velocity = new THREE.Vector3();
        this.gravity = -15; // Player gravity
        this.jumpForce = 8;
        this.isOnGround = true;

        this.hasBall = false;
        this.hoop = null;
        
        // Sounds (to be implemented later)
        this.quackSound = null;
        this.lastQuackTime = 0;

        // Set initial position and rotation
        this.mesh.position.set(Math.random() * 10 - 5, 1, Math.random() * 10 - 5);
        this.mesh.rotation.y = Math.PI; // Face forward
        
        // Player stats
        this.stats = {
            points: 0,
            rebounds: 0,
            assists: 0
        };
    }
    
    getRandomCharacterType() {
        const types = ['classic', 'baller', 'streetDuck', 'coach'];
        return types[Math.floor(Math.random() * types.length)];
    }

    createDuckMesh(isLocal) {
        const playerGroup = new THREE.Group();
        
        // Colors based on character type
        let bodyColor, jerseyColor, accessoryColor;
        
        switch(this.characterType) {
            case 'classic':
                bodyColor = 0xffff00; // Yellow
                jerseyColor = isLocal ? 0x00ff00 : 0x0000ff; // Green or Blue
                accessoryColor = 0xffa500; // Orange
                break;
            case 'baller':
                bodyColor = 0xf5deb3; // Tan duck
                jerseyColor = 0xff0000; // Red jersey
                accessoryColor = 0x000000; // Black accessories
                break;
            case 'streetDuck':
                bodyColor = 0xffff00; // Yellow
                jerseyColor = 0x000000; // Black jersey
                accessoryColor = 0xffffff; // White accessories
                break;
            case 'coach':
                bodyColor = 0xd2b48c; // Tan
                jerseyColor = 0x696969; // Dark gray
                accessoryColor = 0x8b4513; // Brown
                break;
            default:
                bodyColor = 0xffff00;
                jerseyColor = isLocal ? 0x00ff00 : 0x0000ff;
                accessoryColor = 0xffa500;
        }
        
        // Override jersey color for local player for identification
        if (isLocal) {
            jerseyColor = 0x00ff00; // Always green for local player
        }

        // Body (slightly elongated sphere or capsule)
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
        const bodyGeometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        playerGroup.add(body);

        // Head (sphere)
        const headMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
        const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        playerGroup.add(head);
        
        // Store reference to head for animations
        playerGroup.head = head;

        // Beak
        const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
        const beakGeometry = new THREE.ConeGeometry(0.4, 0.8, 16);
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0, 2.5, 0.8);
        beak.rotation.x = Math.PI / 2;
        playerGroup.add(beak);
        
        // Store reference to beak for animations
        playerGroup.beak = beak;

        // Eyes (small spheres)
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.4, 2.8, 0.6);
        playerGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.4, 2.8, 0.6);
        playerGroup.add(rightEye);
        
        // Store references to eyes for animations
        playerGroup.leftEye = leftEye;
        playerGroup.rightEye = rightEye;

        // Jersey
        const jerseyMaterial = new THREE.MeshStandardMaterial({ color: jerseyColor });
        const jerseyGeometry = new THREE.BoxGeometry(2.1, 1.5, 2.1);
        const jersey = new THREE.Mesh(jerseyGeometry, jerseyMaterial);
        jersey.position.y = 1;
        playerGroup.add(jersey);
        
        // Character-specific accessories
        switch(this.characterType) {
            case 'baller':
                // Add headband
                const headbandGeometry = new THREE.TorusGeometry(0.85, 0.1, 8, 32);
                const headbandMaterial = new THREE.MeshStandardMaterial({ color: accessoryColor });
                const headband = new THREE.Mesh(headbandGeometry, headbandMaterial);
                headband.position.y = 2.7;
                headband.rotation.x = Math.PI / 2;
                playerGroup.add(headband);
                break;
                
            case 'streetDuck':
                // Add cap
                const capGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.3, 16);
                const capMaterial = new THREE.MeshStandardMaterial({ color: accessoryColor });
                const cap = new THREE.Mesh(capGeometry, capMaterial);
                cap.position.y = 3.1;
                playerGroup.add(cap);
                
                // Add cap visor
                const visorGeometry = new THREE.BoxGeometry(1.8, 0.1, 0.6);
                const visor = new THREE.Mesh(visorGeometry, capMaterial);
                visor.position.set(0, 3.1, 0.6);
                playerGroup.add(visor);
                break;
                
            case 'coach':
                // Add glasses
                const glassesFrameGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
                const glassesFrameMaterial = new THREE.MeshStandardMaterial({ color: accessoryColor });
                
                // Left lens frame
                const leftFrame = new THREE.Mesh(glassesFrameGeometry, glassesFrameMaterial);
                leftFrame.position.set(-0.3, 2.8, 0.6);
                leftFrame.rotation.y = Math.PI;
                playerGroup.add(leftFrame);
                
                // Right lens frame
                const rightFrame = new THREE.Mesh(glassesFrameGeometry, glassesFrameMaterial);
                rightFrame.position.set(0.3, 2.8, 0.6);
                rightFrame.rotation.y = Math.PI;
                playerGroup.add(rightFrame);
                
                // Bridge
                const bridgeGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.05);
                const bridge = new THREE.Mesh(bridgeGeometry, glassesFrameMaterial);
                bridge.position.set(0, 2.8, 0.6);
                playerGroup.add(bridge);
                
                // Whistle (coaches have whistles)
                const whistleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                const whistleMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
                const whistle = new THREE.Mesh(whistleGeometry, whistleMaterial);
                whistle.position.set(0, 2.1, 0.6);
                playerGroup.add(whistle);
                break;
        }

        // Arms (will be animated)
        const armGeometry = new THREE.CapsuleGeometry(0.2, 1, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.1, 1.5, 0);
        leftArm.rotation.z = -Math.PI / 4; // Slightly out
        playerGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.1, 1.5, 0);
        rightArm.rotation.z = Math.PI / 4; // Slightly out
        playerGroup.add(rightArm);
        
        // Store references for animation
        playerGroup.leftArm = leftArm;
        playerGroup.rightArm = rightArm;
        
        // Legs (will be animated)
        const legGeometry = new THREE.CapsuleGeometry(0.25, 1, 4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.6, 0, 0);
        playerGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.6, 0, 0);
        playerGroup.add(rightLeg);
        
        // Store references for animation
        playerGroup.leftLeg = leftLeg;
        playerGroup.rightLeg = rightLeg;

        // Add player number (jersey number)
        this.addPlayerNumber(playerGroup, id);

        // Set the group's base height (important for physics)
        playerGroup.baseHeight = 1.0; // Approximate ground level reference for the group

        return playerGroup;
    }
    
    addPlayerNumber(playerGroup, id) {
        // Create a canvas for the player number
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Clear canvas
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw player number
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'white';
        context.fillText(id.toString(), canvas.width/2, canvas.height/2);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create plane with number
        const numberGeometry = new THREE.PlaneGeometry(0.8, 0.8);
        const numberMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create mesh and add to back of jersey
        const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
        numberMesh.position.set(0, 1, -1.1);
        playerGroup.add(numberMesh);
        
        // Add smaller number to front
        const frontNumberMesh = numberMesh.clone();
        frontNumberMesh.position.set(0, 1, 1.1);
        frontNumberMesh.scale.set(0.6, 0.6, 0.6);
        playerGroup.add(frontNumberMesh);
    }

    setHoopReference(hoopMesh) {
        this.hoop = hoopMesh;
    }

    move(direction) {
        const moveSpeed = 5;
        const moveVector = direction.clone().multiplyScalar(moveSpeed * 0.05);
        
        // Set animation state to running
        if (direction.lengthSq() > 0 && this.isOnGround) {
            this.animationState = 'running';
        } else if (this.isOnGround) {
            this.animationState = 'idle';
        }

        // Apply rotation based on movement direction
        if (moveVector.lengthSq() > 0) {
            let targetAngle = Math.atan2(moveVector.x, moveVector.z);
            const currentAngle = this.mesh.rotation.y;
            if (Math.abs(targetAngle - currentAngle) > Math.PI) {
                if (targetAngle < currentAngle) targetAngle += 2 * Math.PI;
                else targetAngle -= 2 * Math.PI;
            }
            this.mesh.rotation.y += (targetAngle - currentAngle) * 0.1;
        }

        // Move player position
        this.mesh.position.x += moveVector.x;
        this.mesh.position.z += moveVector.z;

        // Keep player on the court
        this.mesh.position.x = Math.max(-24, Math.min(24, this.mesh.position.x));
        this.mesh.position.z = Math.max(-14, Math.min(14, this.mesh.position.z));
        
        // Randomly quack while moving (later implementation)
        if (Math.random() < 0.005 && this.isOnGround) {
            this.quack();
        }
    }

    // Add jump method
    jump() {
        if (this.isOnGround) {
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
            this.animationState = 'jumping';
            this.jumpAngle = 0; // Reset jump animation angle
            console.log(`Player ${this.id} jumps!`);
            this.quack(0.5); // Higher pitch quack
        }
    }

    // Quack method for sound (placeholder)
    quack(pitch = 1.0) {
        // Prevent too frequent quacks
        const now = Date.now();
        if (now - this.lastQuackTime < 1000) return;
        
        this.lastQuackTime = now;
        
        // Visual feedback - animate the beak
        if (this.mesh.beak) {
            const originalScale = this.mesh.beak.scale.clone();
            
            // Make beak bigger briefly
            this.mesh.beak.scale.set(1.3, 1.3, 1.3);
            
            // Return to normal
            setTimeout(() => {
                if (this.mesh && this.mesh.beak) {
                    this.mesh.beak.scale.copy(originalScale);
                }
            }, 150);
        }
        
        console.log(`Quack! (Player ${this.id}, pitch: ${pitch})`);
        // Sound implementation will go here later
    }

    // Update method - handles animations and physics
    update(delta) {
        // Call physics update
        this.updatePhysics(delta);
        
        // Animation updates
        this.animationTime += delta;
        this.updateAnimation(delta);
    }

    // Update physics for the player
    updatePhysics(delta) {
        // Apply gravity if not on ground
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * delta;
            this.jumpAngle += delta * 5; // For jump animation
        }

        // Update position based on velocity
        this.mesh.position.y += this.velocity.y * delta;

        // Ground collision check
        const groundLevel = this.mesh.baseHeight || 0;
        if (this.mesh.position.y <= groundLevel) {
            this.mesh.position.y = groundLevel;
            this.velocity.y = 0;
            if (!this.isOnGround) {
                this.isOnGround = true;
                this.animationState = 'idle';
                // Small chance to quack on landing
                if (Math.random() < 0.3) {
                    this.quack(0.8);
                }
            }
        }
    }
    
    // Animate the duck based on current animation state
    updateAnimation(delta) {
        if (!this.mesh) return;
        
        // Reset transformations to prevent cumulative effects
        this.resetAnimationParts();
        
        switch(this.animationState) {
            case 'idle':
                this.animateIdle(delta);
                break;
            case 'running':
                this.animateRunning(delta);
                break;
            case 'jumping':
                this.animateJumping(delta);
                break;
            case 'shooting':
                this.animateShooting(delta);
                break;
        }
    }
    
    // Reset animation parts to their base position
    resetAnimationParts() {
        if (!this.mesh) return;
        
        // Reset arm positions
        if (this.mesh.leftArm) {
            this.mesh.leftArm.rotation.z = -Math.PI / 4;
            this.mesh.leftArm.position.y = 1.5;
        }
        
        if (this.mesh.rightArm) {
            this.mesh.rightArm.rotation.z = Math.PI / 4;
            this.mesh.rightArm.position.y = 1.5;
        }
        
        // Reset leg positions
        if (this.mesh.leftLeg) {
            this.mesh.leftLeg.rotation.x = 0;
        }
        
        if (this.mesh.rightLeg) {
            this.mesh.rightLeg.rotation.x = 0;
        }
        
        // Reset head position
        if (this.mesh.head) {
            this.mesh.head.position.y = 2.5;
        }
    }
    
    // Idle animation - subtle breathing motion
    animateIdle(delta) {
        if (!this.mesh) return;
        
        // Subtle body breathing animation
        const breatheAmount = Math.sin(this.animationTime * 2) * 0.05;
        
        if (this.mesh.head) {
            this.mesh.head.position.y = 2.5 + breatheAmount;
        }
        
        // Subtle arm movements
        if (this.mesh.leftArm) {
            this.mesh.leftArm.position.y = 1.5 + breatheAmount;
        }
        
        if (this.mesh.rightArm) {
            this.mesh.rightArm.position.y = 1.5 + breatheAmount;
        }
        
        // Blink occasionally
        if (Math.random() < 0.005) {
            this.blink();
        }
    }
    
    // Running animation
    animateRunning(delta) {
        if (!this.mesh) return;
        
        const cycleSpeed = 8;
        const runCycle = Math.sin(this.animationTime * cycleSpeed);
        const amplitude = 0.5;
        
        // Arm swing
        if (this.mesh.leftArm) {
            this.mesh.leftArm.rotation.x = -runCycle * amplitude;
        }
        
        if (this.mesh.rightArm) {
            this.mesh.rightArm.rotation.x = runCycle * amplitude; 
        }
        
        // Leg movement
        if (this.mesh.leftLeg) {
            this.mesh.leftLeg.rotation.x = runCycle * amplitude;
        }
        
        if (this.mesh.rightLeg) {
            this.mesh.rightLeg.rotation.x = -runCycle * amplitude;
        }
        
        // Head bob
        if (this.mesh.head) {
            this.mesh.head.position.y = 2.5 + Math.abs(runCycle) * 0.1;
        }
    }
    
    // Jumping animation
    animateJumping(delta) {
        if (!this.mesh) return;
        
        // Arm raising movement
        if (this.mesh.leftArm) {
            this.mesh.leftArm.rotation.x = -Math.sin(this.jumpAngle) * 0.7;
        }
        
        if (this.mesh.rightArm) {
            this.mesh.rightArm.rotation.x = -Math.sin(this.jumpAngle) * 0.7;
        }
        
        // Leg tuck-in during jump
        const legTuck = Math.sin(Math.min(this.jumpAngle, Math.PI/2)) * 0.7;
        
        if (this.mesh.leftLeg) {
            this.mesh.leftLeg.rotation.x = -legTuck;
        }
        
        if (this.mesh.rightLeg) {
            this.mesh.rightLeg.rotation.x = -legTuck;
        }
    }
    
    // Shooting animation
    animateShooting(delta) {
        if (!this.mesh) return;
        
        // Both arms forward and up
        if (this.mesh.leftArm) {
            this.mesh.leftArm.rotation.x = -Math.PI/3; // Forward and up
            this.mesh.leftArm.rotation.z = -Math.PI/6; // Less outward
        }
        
        if (this.mesh.rightArm) {
            this.mesh.rightArm.rotation.x = -Math.PI/3; // Forward and up
            this.mesh.rightArm.rotation.z = Math.PI/6; // Less outward
        }
        
        // Reset after shot
        setTimeout(() => {
            if (this.animationState === 'shooting') {
                this.animationState = this.isOnGround ? 'idle' : 'jumping';
            }
        }, 500);
    }
    
    // Blink animation
    blink() {
        if (!this.mesh || !this.mesh.leftEye || !this.mesh.rightEye) return;
        
        // Store original scale
        const originalScale = this.mesh.leftEye.scale.clone();
        
        // "Close" eyes by flattening them
        this.mesh.leftEye.scale.set(originalScale.x, originalScale.y * 0.1, originalScale.z);
        this.mesh.rightEye.scale.set(originalScale.x, originalScale.y * 0.1, originalScale.z);
        
        // Open eyes after a short delay
        setTimeout(() => {
            if (this.mesh && this.mesh.leftEye && this.mesh.rightEye) {
                this.mesh.leftEye.scale.copy(originalScale);
                this.mesh.rightEye.scale.copy(originalScale);
            }
        }, 150);
    }

    shoot() {
        if (this.hasBall) {
            console.log(`Player ${this.id} attempts shoot!`);
            this.hasBall = false;
            
            // Set shooting animation
            this.animationState = 'shooting';
            
            // Quack excitedly when shooting
            this.quack(1.2);
            
            return true; // Indicate shot attempt was valid (player had ball)
        }
        return false; // Player didn't have the ball
    }

    holdBall(ball) {
        if (!this.hasBall) { // Prevent holding multiple times if logic error occurs
            this.hasBall = true;
            ball.ownerId = this.id;
            console.log(`Player ${this.id} now holding ball ${ball.uuid}`);
            
            // Small chance to quack when getting the ball
            if (Math.random() < 0.5) {
                this.quack(1.1);
            }
        }
    }
}

// Main Game Class
class Game {
    constructor() {
        this.scene = new THREE.Scene();
        // Add background color to the scene
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing
        this.hoop = null; // Store hoop reference
        this.ball = null; // Add ball property

        this.player = null; // Local player object
        this.localPlayerId = null;
        this.players = new Map(); // Store all players
        this.socket = null;
        this.sendIntervalId = null;

        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false }; // Add shift key

        // For physics timing
        this.clock = new THREE.Clock();

        this.isStarted = false; // Flag to check if game has started
    }

    init() {
        console.log("Game initializing..."); // Add log
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Append renderer to the specific container
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            console.error("Game container not found!");
            return; // Stop if container is missing
        }

        // Camera setup
        this.camera.position.set(0, 15, 30); // Adjusted camera slightly
        this.camera.lookAt(0, 0, 0);

        // Add Lighting
        this.setupLighting();
        
        // Create NYC scene
        this.createNYCScene();
        
        // Create court
        this.createBasketballCourt();
        
        // Create hoops
        this.createHoops();
        
        // Create the persistent ball
        this.createBasketball();

        // Setup controls
        this.setupControls();

        console.log("Game initialized visually.");
    }
    
    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Optimize shadow map
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Additional fill light from opposite direction
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-50, 40, -50);
        this.scene.add(fillLight);
    }
    
    createNYCScene() {
        // Ground plane (street)
        const streetSize = 200;
        const streetGeometry = new THREE.PlaneGeometry(streetSize, streetSize);
        const streetMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555, // Asphalt gray
            roughness: 0.8,
            metalness: 0,
        });
        
        const street = new THREE.Mesh(streetGeometry, streetMaterial);
        street.rotation.x = -Math.PI / 2;
        street.position.y = -0.1; // Slightly below court
        street.receiveShadow = true;
        this.scene.add(street);
        
        // Create some NYC buildings around the court
        this.createBuildings();
        
        // Create some parked cars
        this.createCars();
        
        // Chain link fence around the court
        this.createFence();
        
        // Add street elements (hydrants, trash cans, street lamps)
        this.createStreetElements();
    }
    
    createBuildings() {
        // Create building function
        const createBuilding = (x, z, width, depth, height, color) => {
            const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
            const buildingMaterial = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7,
                metalness: 0.2,
            });
            
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building.position.set(x, height/2, z);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
            
            // Add windows
            this.addWindowsToBuilding(building, width, height, depth);
            
            return building;
        };
        
        // Create several buildings around the court at different positions
        const buildingParams = [
            // x, z, width, depth, height, color
            [-40, -40, 20, 30, 40, 0xA34B1F], // Brick building
            [-40, 10, 20, 40, 35, 0x8D8D8D],  // Gray building
            [40, -20, 30, 25, 50, 0xA57164],   // Tan building
            [50, 30, 25, 25, 30, 0x8B5A2B],    // Brown building
            [-20, -50, 35, 20, 45, 0x696969],  // Dark gray building
            [30, 50, 40, 20, 35, 0x8B4513]     // Sienna building
        ];
        
        // Create all buildings
        buildingParams.forEach(params => createBuilding(...params));
    }
    
    addWindowsToBuilding(building, width, height, depth) {
        // Window parameters
        const windowWidth = 1.2;
        const windowHeight = 1.8;
        const windowDepth = 0.1;
        const windowColor = 0x87CEFA; // Light blue for windows
        const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: windowColor,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        // Calculate number of windows per row and column with spacing
        const spacingX = 2;
        const spacingY = 3;
        const startHeight = 5; // Start windows a bit above ground level
        
        const numWindowsX = Math.floor((width - 4) / (windowWidth + spacingX));
        const numWindowsY = Math.floor((height - startHeight) / (windowHeight + spacingY));
        
        // Add windows on the front and back sides
        [-1, 1].forEach(side => {
            const zOffset = (depth / 2) * side;
            
            for (let y = 0; y < numWindowsY; y++) {
                for (let x = 0; x < numWindowsX; x++) {
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    windowMesh.position.x = -width/2 + 2 + x * (windowWidth + spacingX) + windowWidth/2;
                    windowMesh.position.y = startHeight + y * (windowHeight + spacingY) - height/2 + windowHeight/2;
                    windowMesh.position.z = zOffset;
                    
                    building.add(windowMesh);
                }
            }
        });
        
        // Add windows on the left and right sides
        [-1, 1].forEach(side => {
            const xOffset = (width / 2) * side;
            
            const numWindowsZ = Math.floor((depth - 4) / (windowWidth + spacingX));
            
            for (let y = 0; y < numWindowsY; y++) {
                for (let z = 0; z < numWindowsZ; z++) {
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    windowMesh.position.x = xOffset;
                    windowMesh.position.y = startHeight + y * (windowHeight + spacingY) - height/2 + windowHeight/2;
                    windowMesh.position.z = -depth/2 + 2 + z * (windowWidth + spacingX) + windowWidth/2;
                    windowMesh.rotation.y = Math.PI / 2;
                    
                    building.add(windowMesh);
                }
            }
        });
    }
    
    createCars() {
        // Colors for cars
        const carColors = [
            0xff0000, // Red
            0x0000ff, // Blue
            0xffff00, // Yellow
            0x00ff00, // Green
            0x000000, // Black
            0xffffff  // White
        ];
        
        // Car positions around the court
        const carPositions = [
            [-15, -20, Math.PI/2],  // Left side
            [-18, -15, Math.PI/2],  // Left side
            [18, 25, -Math.PI/2],   // Right side
            [16, 20, -Math.PI/2],   // Right side
            [-25, 10, Math.PI],     // Far side
            [25, -10, 0]            // Near side
        ];
        
        // Create cars at positions
        carPositions.forEach((pos, index) => {
            const color = carColors[index % carColors.length];
            this.createCar(pos[0], pos[1], color, pos[2]);
        });
    }
    
    createCar(x, z, color, rotation = 0) {
        const car = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(4.5, 1.5, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.2,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        car.add(body);
        
        // Car top/cabin
        const cabinGeometry = new THREE.BoxGeometry(2.5, 1, 1.8);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(-0.5, 2.25, 0);
        cabin.castShadow = true;
        car.add(cabin);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 1,
            metalness: 0
        });
        
        const wheelPositions = [
            [-1.5, 0.5, -1.1, Math.PI/2], // Front left
            [-1.5, 0.5, 1.1, Math.PI/2],  // Front right
            [1.5, 0.5, -1.1, Math.PI/2],  // Back left
            [1.5, 0.5, 1.1, Math.PI/2]    // Back right
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.x = pos[3];
            wheel.castShadow = true;
            car.add(wheel);
        });
        
        // Headlights
        const headlightGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.3);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });
        
        const headlightPositions = [
            [-2.25, 1.2, -0.6], // Left
            [-2.25, 1.2, 0.6]   // Right
        ];
        
        headlightPositions.forEach(pos => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(...pos);
            car.add(headlight);
        });
        
        // Position the whole car
        car.position.set(x, 0, z);
        car.rotation.y = rotation;
        this.scene.add(car);
        
        return car;
    }
    
    createFence() {
        // Court dimensions
        const courtWidth = 50;
        const courtLength = 30;
        const fenceHeight = 3;
        
        // Fence material - chain link fence texture would be better
        const fenceMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.7,
            metalness: 0.3,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        // Create fence segments
        const createFenceSegment = (width, height, x, z, rotationY = 0) => {
            const fenceGeometry = new THREE.PlaneGeometry(width, height);
            const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
            fence.position.set(x, height/2, z);
            fence.rotation.y = rotationY;
            fence.receiveShadow = true;
            this.scene.add(fence);
            return fence;
        };
        
        // Create fence around court
        createFenceSegment(courtWidth, fenceHeight, 0, courtLength/2, 0);
        createFenceSegment(courtWidth, fenceHeight, 0, -courtLength/2, 0);
        createFenceSegment(courtLength, fenceHeight, courtWidth/2, 0, Math.PI/2);
        createFenceSegment(courtLength, fenceHeight, -courtWidth/2, 0, Math.PI/2);
        
        // Add corner posts
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, fenceHeight, 8);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.5
        });
        
        const cornerPositions = [
            [courtWidth/2, courtLength/2],
            [courtWidth/2, -courtLength/2],
            [-courtWidth/2, courtLength/2],
            [-courtWidth/2, -courtLength/2]
        ];
        
        cornerPositions.forEach(pos => {
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(pos[0], fenceHeight/2, pos[1]);
            post.castShadow = true;
            this.scene.add(post);
        });
    }
    
    createStreetElements() {
        // Add fire hydrant
        this.createFireHydrant(-25, -5);
        this.createFireHydrant(35, 15);
        
        // Add trash cans
        this.createTrashCan(-28, 0);
        this.createTrashCan(30, -10);
        
        // Add street lamps
        this.createStreetLamp(-30, -30);
        this.createStreetLamp(35, -25);
        this.createStreetLamp(-35, 25);
        this.createStreetLamp(40, 35);
    }
    
    createFireHydrant(x, z) {
        const hydrant = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 2, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        hydrant.add(body);
        
        // Top cap
        const capGeometry = new THREE.CylinderGeometry(0.4, 0.6, 0.3, 12);
        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.5,
            metalness: 0.8
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 2.15;
        cap.castShadow = true;
        hydrant.add(cap);
        
        // Side outlets
        const outletGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        
        [-1, 1].forEach(side => {
            const outlet = new THREE.Mesh(outletGeometry, capMaterial);
            outlet.position.set(side * 0.8, 1.3, 0);
            outlet.rotation.z = side * Math.PI/2;
            outlet.castShadow = true;
            hydrant.add(outlet);
        });
        
        hydrant.position.set(x, 0, z);
        this.scene.add(hydrant);
        
        return hydrant;
    }
    
    createTrashCan(x, z) {
        const trashCan = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.7, 2.5, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.25;
        body.castShadow = true;
        trashCan.add(body);
        
        // Lid
        const lidGeometry = new THREE.CylinderGeometry(0.85, 0.8, 0.2, 12);
        const lidMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 2.6;
        lid.castShadow = true;
        trashCan.add(lid);
        
        trashCan.position.set(x, 0, z);
        this.scene.add(trashCan);
        
        return trashCan;
    }
    
    createStreetLamp(x, z) {
        const lamp = new THREE.Group();
        
        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.3, 7, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.6,
            metalness: 0.4
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 3.5;
        pole.castShadow = true;
        lamp.add(pole);
        
        // Lamp head
        const headGeometry = new THREE.CylinderGeometry(0.6, 0.5, 1, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.6,
            metalness: 0.4
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 7;
        head.rotation.x = Math.PI / 2;
        head.castShadow = true;
        lamp.add(head);
        
        // Light bulb
        const bulbGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const bulbMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 1
        });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.y = 6.5;
        lamp.add(bulb);
        
        // Add point light
        const light = new THREE.PointLight(0xffffcc, 1, 20);
        light.position.set(0, 6.5, 0);
        light.castShadow = true;
        lamp.add(light);
        
        lamp.position.set(x, 0, z);
        this.scene.add(lamp);
        
        return lamp;
    }
    
    createBasketballCourt() {
        // Court dimensions
        const courtWidth = 50;
        const courtLength = 30;
        
        // Court base (slightly raised platform)
        const courtBaseGeometry = new THREE.BoxGeometry(courtWidth, 0.5, courtLength);
        const courtBaseMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999, // Concrete color
            roughness: 1,
            metalness: 0
        });
        const courtBase = new THREE.Mesh(courtBaseGeometry, courtBaseMaterial);
        courtBase.position.y = 0.25; // Half of base height
        courtBase.receiveShadow = true;
        this.scene.add(courtBase);
        
        // Court surface
        const courtGeometry = new THREE.PlaneGeometry(courtWidth - 1, courtLength - 1);
        const courtMaterial = new THREE.MeshStandardMaterial({
            color: 0x4f94cd, // NYC blue court color
            roughness: 0.8,
            metalness: 0.1
        });
        const court = new THREE.Mesh(courtGeometry, courtMaterial);
        court.rotation.x = -Math.PI / 2;
        court.position.y = 0.51; // Just above base
        court.receiveShadow = true;
        this.scene.add(court);
        
        // Court lines
        this.createCourtLines(courtWidth, courtLength);
        
        // NYC logo at center court
        this.createCourtLogo();
    }
    
    createCourtLines(courtWidth, courtLength) {
        const lineWidth = 0.1;
        const lineColor = 0xffffff;
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: lineColor,
            roughness: 0.5
        });
        
        // Helper function to create a court line
        const createLine = (width, length, x, z, rotationY = 0) => {
            const lineGeometry = new THREE.PlaneGeometry(width, length);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.rotation.z = rotationY;
            line.position.set(x, 0.52, z); // Slightly above court
            this.scene.add(line);
        };
        
        // Court outline
        createLine(courtWidth - 2, lineWidth, 0, -courtLength/2 + 1 + lineWidth/2); // Bottom
        createLine(courtWidth - 2, lineWidth, 0, courtLength/2 - 1 - lineWidth/2); // Top
        createLine(lineWidth, courtLength - 2, -courtWidth/2 + 1 + lineWidth/2, 0, Math.PI/2); // Left
        createLine(lineWidth, courtLength - 2, courtWidth/2 - 1 - lineWidth/2, 0, Math.PI/2); // Right
        
        // Half court line
        createLine(courtWidth - 2, lineWidth, 0, 0);
        
        // Center circle
        const circleGeometry = new THREE.RingGeometry(6, 6 + lineWidth, 64);
        const circleMaterial = new THREE.MeshStandardMaterial({
            color: lineColor,
            roughness: 0.5,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = 0.52;
        this.scene.add(circle);
        
        // Three-point lines (arcs)
        [-1, 1].forEach(side => {
            const endZ = side * (courtLength/2 - 1);
            const threePointArc = new THREE.RingGeometry(6.75, 6.75 + lineWidth, 64, 1, 0, Math.PI);
            const arc = new THREE.Mesh(threePointArc, circleMaterial);
            arc.rotation.x = -Math.PI / 2;
            arc.position.set(0, 0.52, endZ - side * 5.8);
            if (side > 0) arc.rotation.z = Math.PI;
            this.scene.add(arc);
        });
        
        // Key areas (free throw lanes)
        [-1, 1].forEach(side => {
            const endZ = side * (courtLength/2 - 1);
            
            // Key outline
            createLine(4, lineWidth, 0, endZ - side * 5.8); // Free throw line
            createLine(lineWidth, 11.6, -2, endZ - side * 5.8/2, Math.PI/2); // Left lane
            createLine(lineWidth, 11.6, 2, endZ - side * 5.8/2, Math.PI/2); // Right lane
            
            // Free throw half-circle
            const ftCircle = new THREE.RingGeometry(1.8, 1.8 + lineWidth, 64, 1, 0, Math.PI);
            const ftCircleMesh = new THREE.Mesh(ftCircle, circleMaterial);
            ftCircleMesh.rotation.x = -Math.PI / 2;
            ftCircleMesh.position.set(0, 0.52, endZ - side * 5.8);
            if (side < 0) ftCircleMesh.rotation.z = Math.PI;
            this.scene.add(ftCircleMesh);
            
            // Lane markers (tick marks)
            for (let i = 1; i <= 4; i++) {
                const markerZ = endZ - side * i * 2.8/5;
                createLine(0.3, lineWidth, -2, markerZ);
                createLine(0.3, lineWidth, 2, markerZ);
            }
        });
    }
    
    createCourtLogo() {
        // In a real implementation, you'd use a texture for the NYC logo
        // Here we'll create a simplified version with text
        
        // Create a canvas to draw the logo
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Fill background with transparent
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.fillStyle = 'white';
        context.fillText('NYC', canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create logo mesh
        const logoGeometry = new THREE.PlaneGeometry(8, 8);
        const logoMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8
        });
        
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.rotation.x = -Math.PI / 2;
        logo.position.y = 0.53; // Just above court
        this.scene.add(logo);
    }
    
    createHoops() {
        // Create two hoops
        [-1, 1].forEach(side => {
            const endZ = side * 15;
            this.createHoop(0, endZ);
        });
    }
    
    createHoop(x, z) {
        const hoopGroup = new THREE.Group();
        
        // Backboard
        const backboardGeometry = new THREE.BoxGeometry(6, 4, 0.2);
        const backboardMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1
        });
        const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
        backboard.position.set(0, 5, 0);
        backboard.castShadow = true;
        backboard.receiveShadow = true;
        hoopGroup.add(backboard);
        
        // Backboard frame
        const frameGeometry = new THREE.BoxGeometry(6.2, 4.2, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.8,
            metalness: 0.2
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, 5, -0.1);
        hoopGroup.add(frame);
        
        // Hoop rim (ring)
        const rimGeometry = new THREE.TorusGeometry(0.8, 0.05, 16, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4500, // Orange-red
            roughness: 0.3,
            metalness: 0.8
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.set(0, 3.3, 0.7);
        rim.rotation.x = Math.PI / 2;
        rim.castShadow = true;
        hoopGroup.add(rim);
        
        // Hoop net (simplified as lines)
        const netMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.7,
            transparent: true
        });
        
        // Create net strings
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const netGeometry = new THREE.BufferGeometry();
            
            // Simple curve for the net
            const points = [];
            const x1 = Math.cos(angle) * 0.8;
            const z1 = Math.sin(angle) * 0.8;
            
            for (let j = 0; j <= 10; j++) {
                const y = 3.3 - (j * 0.15);
                const radius = 0.8 - (j * 0.08);
                points.push(
                    new THREE.Vector3(
                        Math.cos(angle) * radius,
                        y,
                        0.7 + Math.sin(angle) * radius + j * 0.03
                    )
                );
            }
            
            netGeometry.setFromPoints(points);
            const netLine = new THREE.Line(netGeometry, netMaterial);
            hoopGroup.add(netLine);
        }
        
        // Support pole
        const poleGeometry = new THREE.BoxGeometry(0.4, 10, 0.4);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.7,
            metalness: 0.3
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(0, 5, -1.0);
        pole.castShadow = true;
        hoopGroup.add(pole);
        
        // Angled support
        const supportGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        const support = new THREE.Mesh(supportGeometry, poleMaterial);
        support.position.set(0, 7, -0.3);
        support.rotation.x = Math.PI / 4;
        support.castShadow = true;
        hoopGroup.add(support);
        
        hoopGroup.position.set(x, 0, z);
        
        // Store reference to one hoop (the closest one)
        if (z > 0) {
            this.hoop = rim;
        }
        
        this.scene.add(hoopGroup);
        return hoopGroup;
    }
    
    createBasketball() {
        // Basketball
        const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        
        // Create texture for basketball
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Draw orange background
        context.fillStyle = '#ff7300';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw black lines
        context.strokeStyle = '#000000';
        context.lineWidth = 6;
        
        // Horizontal center line
        context.beginPath();
        context.moveTo(0, canvas.height / 2);
        context.lineTo(canvas.width, canvas.height / 2);
        context.stroke();
        
        // Vertical lines
        for (let i = 1; i < 8; i++) {
            context.beginPath();
            context.moveTo(i * canvas.width / 8, 0);
            context.lineTo(i * canvas.width / 8, canvas.height);
            context.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const ballMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
        this.ball.position.set(0, 10, 0); // Start somewhere visible
        this.ball.castShadow = true;
        this.ball.velocity = new THREE.Vector3(0, 0, 0);
        this.ball.ownerId = null; // No owner initially
        this.ball.gravity = -9.8; // Gravity constant for the ball
        this.ball.bounceFactor = 0.7; // How much energy is kept on bounce
        this.scene.add(this.ball);
    }
    
    // Add a method to actually start the game logic (networking, animation)
    startGame() {
        if (this.isStarted) return; // Prevent starting multiple times
        console.log("Starting game logic (WebSocket, Animation)...");
        this.isStarted = true;
        this.connectWebSocket();
        this.animate();
    }

    setupControls() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
    }

    handleKeyDown(event) {
        // Check if game has started and player exists
        if (!this.isStarted || !this.player) return;

        const key = event.key.toLowerCase();
        let needsStateSend = false; // Flag if an action requires immediate state update

        if (key === 'w') this.keys.w = true;
        if (key === 'a') this.keys.a = true;
        if (key === 's') this.keys.s = true;
        if (key === 'd') this.keys.d = true;
        if (key === 'shift') { // Use Shift for jump
            if (!this.keys.shift) { // Trigger jump only once per press
                if (this.player) this.player.jump();
                needsStateSend = true; // Send state on jump
            }
            this.keys.shift = true;
        }
        if (key === ' ') {
            if (!this.keys.space && this.player && this.player.hasBall) {
                if (this.player.shoot()) {
                    // Calculate initial velocity for the ball towards the hoop
                    const direction = this.hoop.position.clone().sub(this.player.mesh.position);
                    const distance = direction.length();
                    direction.normalize();

                    // Add some upward angle based on distance (simple approach)
                    const upwardAngle = Math.min(Math.PI / 4, distance * 0.05); // Adjust multiplier
                    direction.applyAxisAngle(new THREE.Vector3(1, 0, 0).cross(direction).normalize(), upwardAngle);

                    const shootPower = Math.min(25, 10 + distance * 0.8);
                    this.ball.velocity.copy(direction).multiplyScalar(shootPower);
                    this.ball.ownerId = null; // Ball is now free

                    this.sendShootMessage(); // Notify server/others about the shot
                }
            }
            this.keys.space = true;
        }

        // Optionally send state immediately on jump or other actions
        if (needsStateSend && this.player) {
            this.sendPlayerState();
        }
    }

    handleKeyUp(event) {
        if (!this.isStarted || !this.player) return;
        const key = event.key.toLowerCase();
        if (key === 'w') this.keys.w = false;
        if (key === 'a') this.keys.a = false;
        if (key === 's') this.keys.s = false;
        if (key === 'd') this.keys.d = false;
        if (key === ' ') this.keys.space = false;
        if (key === 'shift') this.keys.shift = false;
    }

    handleInput() {
        if (!this.player) return;

        const direction = new THREE.Vector3();
        if (this.keys.w) direction.z -= 1;
        if (this.keys.s) direction.z += 1;
        if (this.keys.a) direction.x -= 1;
        if (this.keys.d) direction.x += 1;

        if (direction.lengthSq() > 0) {
            direction.normalize();
            this.player.move(direction);
        }
    }

    connectWebSocket() {
        console.log("Connecting to WebSocket server...");
        // Use window.location.hostname to connect to the same server serving the page
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8080`;
        console.log(`WebSocket URL: ${wsUrl}`);

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('WebSocket connection established.');
        };

        this.socket.onmessage = (event) => this.handleWebSocketMessage(event);

        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed.');
            if (this.sendIntervalId) clearInterval(this.sendIntervalId);
            this.sendIntervalId = null;
            // Reset player on disconnect
            this.player = null;
            this.localPlayerId = null;
            // Clear remote players
            this.players.forEach(p => {
                if (!p.isLocal) this.scene.remove(p.mesh);
            });
            this.players.clear();
        };
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log("Received WebSocket message:", data);

            switch (data.type) {
                case 'assign_id':
                    this.localPlayerId = data.id;
                    console.log(`Received player ID: ${this.localPlayerId}`);
                    // Create the local player
                    this.player = new DuckPlayer(this.localPlayerId, this.scene, true);
                    this.player.setHoopReference(this.hoop); // Give player hoop ref
                    this.players.set(this.localPlayerId, this.player);

                    // Give ball to first player
                    if (this.players.size === 1 && this.ball) {
                        this.player.holdBall(this.ball);
                    }

                    // Start sending player state
                    if (this.sendIntervalId) clearInterval(this.sendIntervalId);
                    this.sendIntervalId = setInterval(() => this.sendPlayerState(), 50);
                    break;

                case 'player_update':
                    if (this.localPlayerId === null || data.id === this.localPlayerId) return;

                    let remotePlayer = this.players.get(data.id);
                    if (!remotePlayer) {
                        console.log(`New player joined: ${data.id}`);
                        remotePlayer = new DuckPlayer(data.id, this.scene, false);
                        remotePlayer.setHoopReference(this.hoop); // Give remote player hoop ref too
                        this.players.set(data.id, remotePlayer);
                    }
                    remotePlayer.mesh.position.set(data.x, data.y, data.z);
                    break;

                case 'player_shoot':
                     if (this.localPlayerId === null || data.id === this.localPlayerId) return;
                     const shootingPlayer = this.players.get(data.id);
                     if (shootingPlayer) {
                         shootingPlayer.shoot(); // Trigger the shoot animation/logic for the remote player
                     }
                     break;

                case 'player_left':
                    console.log(`Player ${data.id} left.`);
                    const playerToRemove = this.players.get(data.id);
                    if (playerToRemove) {
                        this.scene.remove(playerToRemove.mesh);
                        this.players.delete(data.id);
                    }
                    break;
            }
        } catch (e) {
            console.error("Failed to parse WebSocket message:", event.data, e);
        }
    }

    sendPlayerState() {
        if (!this.player || !this.localPlayerId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }
        const state = {
            type: 'player_update',
            x: this.player.mesh.position.x,
            y: this.player.mesh.position.y,
            z: this.player.mesh.position.z,
            // hasBall: this.player.hasBall // Add this later when ball sync is needed
        };
        this.socket.send(JSON.stringify(state));
    }

    sendShootMessage() {
        if (!this.player || !this.localPlayerId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }
        const message = {
            type: 'player_shoot'
            // No other data needed for now, server adds ID
        };
        this.socket.send(JSON.stringify(message));
        console.log("Sent shoot message");
    }

    animate() {
        if (!this.isStarted) {
             // Still render the scene even if game logic hasn't started
             requestAnimationFrame(() => this.animate());
             TWEEN.update(); // Update tweens if any are running before start
             this.renderer.render(this.scene, this.camera);
             return;
        }

        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();

        this.handleInput(); // Handle local player movement input

        // Update physics for all players (local and remote)
        this.players.forEach(p => {
            p.update(delta); // Apply gravity, animations, and ground collision
        });

        // Update ball physics if it exists and is not held
        if (this.ball && this.ball.ownerId === null) {
            // Apply gravity
            this.ball.velocity.y += this.ball.gravity * delta;

            // Update position
            this.ball.position.add(this.ball.velocity.clone().multiplyScalar(delta));

            // Basic ground collision
            const groundY = 0.5; // Ball radius
            if (this.ball.position.y < groundY) {
                this.ball.position.y = groundY;
                // Only bounce if falling downwards significantly
                if (this.ball.velocity.y < -0.1) {
                     this.ball.velocity.y *= -this.ball.bounceFactor; // Reverse and dampen Y velocity
                } else {
                     this.ball.velocity.y = 0; // Stop bouncing if velocity is very low
                }
                // Add friction
                this.ball.velocity.x *= (1 - 0.1 * delta * 10); // Friction dependent on delta
                this.ball.velocity.z *= (1 - 0.1 * delta * 10);
            }

            // Basic Hoop Collision (Scoring - very simple)
            if (this.hoop) {
                const hoopRadius = 1.0;
                const distToHoopCenter = this.ball.position.distanceTo(this.hoop.position);
                // Check if ball is near hoop center horizontally and slightly above/at hoop level
                if (distToHoopCenter < hoopRadius &&
                    Math.abs(this.ball.position.y - this.hoop.position.y) < 0.5 &&
                    this.ball.velocity.y < 0) { // Moving downwards
                        console.log("SCORE!");
                        // Reset ball position (temporary)
                        this.ball.position.set(0, 10, 0);
                        this.ball.velocity.set(0, 0, 0);
                }
            }

            // Check for pickup
            this.players.forEach((p) => {
                // Only local player can pick up for now until ball sync is done
                if (p.isLocal && !p.hasBall) {
                    const distance = p.mesh.position.distanceTo(this.ball.position);
                    const pickupRadius = 1.5; // Player radius + ball radius
                    if (distance < pickupRadius) {
                        p.holdBall(this.ball);
                        console.log(`Player ${p.id} picked up the ball`);
                    }
                }
            });

        } else if (this.ball && this.ball.ownerId !== null) {
            // Ball is held, make it follow the owner
            const owner = this.players.get(this.ball.ownerId);
            if (owner) {
                // Position the ball slightly in front and above the player
                const offset = new THREE.Vector3(0, 1.0, 1.2); // Adjusted offset
                // Create a temporary quaternion for the offset rotation
                const playerQuaternion = owner.mesh.quaternion; // Assuming player mesh has rotation
                const rotatedOffset = offset.clone().applyQuaternion(playerQuaternion);

                this.ball.position.copy(owner.mesh.position).add(rotatedOffset);
                this.ball.velocity.set(0, 0, 0); // Stop ball movement when held
            } else {
                // Owner disconnected or doesn't exist? Drop the ball.
                this.ball.ownerId = null;
            }
        }

        // Update TWEEN
        TWEEN.update();

        this.renderer.render(this.scene, this.camera);
    }
}

// Create the game instance but DON'T start it immediately
// Explicitly create as a global variable by attaching to window
window.gameInstance = null;

window.onload = () => {
    console.log("Window loaded, creating Game instance...");
    // Create the game instance and directly assign to window.gameInstance
    window.gameInstance = new Game();
    // Initialize visual elements immediately
    window.gameInstance.init();
    console.log("Game instance created and initialized:", window.gameInstance);
    // DO NOT call gameInstance.startGame() here
};
