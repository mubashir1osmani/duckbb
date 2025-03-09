// game.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// NYC Court (simple plane for now)
const courtGeometry = new THREE.PlaneGeometry(50, 30);
const courtMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Gray court
const court = new THREE.Mesh(courtGeometry, courtMaterial);
court.rotation.x = -Math.PI / 2; // Lay flat
scene.add(court);

// Hoop (basic cylinder)
const hoopGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
const hoopMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
hoop.position.set(20, 5, 0);
scene.add(hoop);

camera.position.set(0, 20, 30);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Add to game.js
class DuckPlayer {
    constructor(id) {
        this.id = id;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2, 4, 2), // Placeholder duck
            new THREE.MeshBasicMaterial({ color: 0xffff00 }) // Yellow duck
        );
        this.mesh.position.set(0, 2, 0);
        scene.add(this.mesh);
        this.velocity = new THREE.Vector3();
        this.hasBall = true;
    }

    move(direction) {
        this.velocity.x = direction.x * 5;
        this.velocity.z = direction.z * 5;
        this.mesh.position.add(this.velocity);
    }

    shoot() {
        if (this.hasBall) {
            const ball = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 32, 32),
                new THREE.MeshBasicMaterial({ color: 0xffa500 })
            );
            ball.position.copy(this.mesh.position);
            scene.add(ball);
            this.hasBall = false;

            // Simple shot trajectory
            const target = hoop.position.clone();
            const tween = new TWEEN.Tween(ball.position)
                .to({ x: target.x, y: target.y + 5, z: target.z }, 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onComplete(() => {
                    scene.remove(ball);
                    this.hasBall = true; // Reset for prototype
                })
                .start();
        }
    }
}

const player = new DuckPlayer('player1');

// Controls (basic WASD + Space to shoot)
document.addEventListener('keydown', (event) => {
    const direction = new THREE.Vector3();
    if (event.key === 'w') direction.z = -1;
    if (event.key === 's') direction.z = 1;
    if (event.key === 'a') direction.x = -1;
    if (event.key === 'd') direction.x = 1;
    if (event.key === ' ') player.shoot();
    player.move(direction);
});

// Update animate loop for TWEEN
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}
animate();


// Add to game.js
const socket = new WebSocket('ws://localhost:8080');
const players = new Map();

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!players.has(data.id) && data.id !== player.id) {
        players.set(data.id, new DuckPlayer(data.id));
    }
    const remotePlayer = players.get(data.id);
    remotePlayer.mesh.position.set(data.x, data.y, data.z);
};

function sendPlayerState() {
    const state = {
        id: player.id,
        x: player.mesh.position.x,
        y: player.mesh.position.y,
        z: player.mesh.position.z
    };
    socket.send(JSON.stringify(state));
}

setInterval(sendPlayerState, 50);