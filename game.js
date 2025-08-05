// Game state and configuration
class RacingGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.car = null;
        this.track = [];
        this.checkpoints = [];
        this.gameState = 'menu'; // 'menu', 'playing', 'finished'
        this.currentLap = 1;
        this.totalLaps = 3;
        this.startTime = 0;
        this.currentTime = 0;
        this.speed = 0;
        this.maxSpeed = 0.5;
        this.acceleration = 0.02;
        this.friction = 0.98;
        this.turnSpeed = 0.05;
        this.currentCheckpoint = 0;
        
        // Car physics
        this.carVelocity = new THREE.Vector3();
        this.carRotation = 0;
        
        // Input handling
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            brake: false
        };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.createCar();
        this.createTrack();
        this.createLighting();
        this.setupControls();
        this.setupUI();
        this.animate();
    }
    
    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        // Create renderer
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createCar() {
        const carGroup = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.y = 0.5;
        carBody.castShadow = true;
        carGroup.add(carBody);
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x990000 });
        const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        carRoof.position.set(0, 1.1, -0.2);
        carRoof.castShadow = true;
        carGroup.add(carRoof);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        const wheelPositions = [
            [-0.9, 0.3, 1.2],   // Front left
            [0.9, 0.3, 1.2],    // Front right
            [-0.9, 0.3, -1.2],  // Rear left
            [0.9, 0.3, -1.2]    // Rear right
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            carGroup.add(wheel);
        });
        
        // Headlights
        const headlightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.6, 0.7, 2.1);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.6, 0.7, 2.1);
        carGroup.add(rightHeadlight);
        
        this.car = carGroup;
        this.car.position.set(0, 0, 0);
        this.scene.add(this.car);
    }
    
    createTrack() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create oval track
        const trackWidth = 8;
        const trackGeometry = new THREE.RingGeometry(15, 15 + trackWidth, 32);
        const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.rotation.x = -Math.PI / 2;
        track.position.y = 0.01;
        track.receiveShadow = true;
        this.scene.add(track);
        
        // Create track boundaries
        this.createTrackBoundaries();
        this.createCheckpoints();
        
        // Add some decorative elements
        this.createDecorations();
    }
    
    createTrackBoundaries() {
        const barrierGeometry = new THREE.BoxGeometry(1, 1, 1);
        const barrierMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4444 });
        
        // Inner barriers
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const x = Math.cos(angle) * 15;
            const z = Math.sin(angle) * 15;
            
            const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(x, 0.5, z);
            barrier.castShadow = true;
            this.scene.add(barrier);
        }
        
        // Outer barriers
        for (let i = 0; i < 48; i++) {
            const angle = (i / 48) * Math.PI * 2;
            const x = Math.cos(angle) * 23;
            const z = Math.sin(angle) * 23;
            
            const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(x, 0.5, z);
            barrier.castShadow = true;
            this.scene.add(barrier);
        }
    }
    
    createCheckpoints() {
        const checkpointGeometry = new THREE.BoxGeometry(0.5, 3, 0.1);
        const checkpointMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00, 
            transparent: true, 
            opacity: 0.7 
        });
        
        // Create 4 checkpoints around the track
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 19;
            const z = Math.sin(angle) * 19;
            
            const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
            checkpoint.position.set(x, 1.5, z);
            checkpoint.rotation.y = angle;
            this.checkpoints.push({
                mesh: checkpoint,
                position: new THREE.Vector3(x, 0, z),
                passed: false
            });
            this.scene.add(checkpoint);
        }
    }
    
    createDecorations() {
        // Add some trees
        const treeGeometry = new THREE.ConeGeometry(1, 3, 8);
        const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x0F5132 });
        
        for (let i = 0; i < 20; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            tree.position.set(
                Math.cos(angle) * distance,
                1.5,
                Math.sin(angle) * distance
            );
            tree.castShadow = true;
            this.scene.add(tree);
        }
        
        // Add clouds
        const cloudGeometry = new THREE.SphereGeometry(2, 8, 6);
        const cloudMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF, 
            transparent: true, 
            opacity: 0.8 
        });
        
        for (let i = 0; i < 10; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                Math.random() * 100 - 50,
                20 + Math.random() * 10,
                Math.random() * 100 - 50
            );
            cloud.scale.setScalar(0.5 + Math.random() * 0.5);
            this.scene.add(cloud);
        }
    }
    
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
    }
    
    setupControls() {
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'Space':
                    this.keys.brake = true;
                    event.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.brake = false;
                    break;
            }
        });
    }
    
    setupUI() {
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        
        startButton.addEventListener('click', () => {
            this.startRace();
        });
        
        restartButton.addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    startRace() {
        this.gameState = 'playing';
        this.startTime = Date.now();
        document.getElementById('startScreen').classList.add('hidden');
        
        // Reset car position and checkpoints
        this.car.position.set(19, 0, 0);
        this.car.rotation.y = -Math.PI / 2;
        this.carRotation = -Math.PI / 2;
        this.carVelocity.set(0, 0, 0);
        this.currentCheckpoint = 0;
        this.currentLap = 1;
        
        // Reset checkpoints
        this.checkpoints.forEach(cp => cp.passed = false);
    }
    
    resetGame() {
        this.gameState = 'menu';
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        this.currentTime = 0;
        this.speed = 0;
        this.updateHUD();
    }
    
    updateCarPhysics() {
        if (this.gameState !== 'playing') return;
        
        // Handle input
        if (this.keys.up) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        } else if (this.keys.down) {
            this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed * 0.5);
        } else {
            this.speed *= this.friction;
        }
        
        if (this.keys.brake) {
            this.speed *= 0.9;
        }
        
        // Handle turning (only when moving)
        if (Math.abs(this.speed) > 0.01) {
            if (this.keys.left) {
                this.carRotation += this.turnSpeed * Math.abs(this.speed) / this.maxSpeed;
            }
            if (this.keys.right) {
                this.carRotation -= this.turnSpeed * Math.abs(this.speed) / this.maxSpeed;
            }
        }
        
        // Update velocity based on rotation
        this.carVelocity.x = Math.cos(this.carRotation) * this.speed;
        this.carVelocity.z = Math.sin(this.carRotation) * this.speed;
        
        // Update car position
        this.car.position.add(this.carVelocity);
        this.car.rotation.y = this.carRotation;
        
        // Simple collision detection with track boundaries
        const distanceFromCenter = this.car.position.distanceTo(new THREE.Vector3(0, 0, 0));
        if (distanceFromCenter > 22 || distanceFromCenter < 16) {
            // Bounce back
            this.car.position.sub(this.carVelocity);
            this.speed *= -0.3;
        }
    }
    
    checkCheckpoints() {
        if (this.gameState !== 'playing') return;
        
        const carPosition = this.car.position.clone();
        carPosition.y = 0;
        
        const currentCP = this.checkpoints[this.currentCheckpoint];
        const distance = carPosition.distanceTo(currentCP.position);
        
        if (distance < 3 && !currentCP.passed) {
            currentCP.passed = true;
            currentCP.mesh.material.color.setHex(0x0000FF); // Turn blue when passed
            
            this.currentCheckpoint++;
            
            // Check if lap completed
            if (this.currentCheckpoint >= this.checkpoints.length) {
                this.currentCheckpoint = 0;
                this.currentLap++;
                
                // Reset checkpoint colors and states
                this.checkpoints.forEach(cp => {
                    cp.passed = false;
                    cp.mesh.material.color.setHex(0x00FF00);
                });
                
                // Check if race finished
                if (this.currentLap > this.totalLaps) {
                    this.finishRace();
                }
            }
        }
    }
    
    finishRace() {
        this.gameState = 'finished';
        const finalTime = this.formatTime(this.currentTime);
        document.getElementById('finalTime').textContent = `Your time: ${finalTime}`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    updateCamera() {
        if (!this.car) return;
        
        // Third-person camera following the car
        const cameraOffset = new THREE.Vector3(0, 5, 8);
        cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.carRotation);
        
        const desiredCameraPosition = this.car.position.clone().add(cameraOffset);
        
        // Smooth camera movement
        this.camera.position.lerp(desiredCameraPosition, 0.1);
        this.camera.lookAt(this.car.position);
    }
    
    updateHUD() {
        if (this.gameState === 'playing') {
            this.currentTime = (Date.now() - this.startTime) / 1000;
        }
        
        document.getElementById('timer').textContent = `Time: ${this.formatTime(this.currentTime)}`;
        document.getElementById('lapCounter').textContent = `Lap: ${Math.min(this.currentLap, this.totalLaps)}/${this.totalLaps}`;
        document.getElementById('speed').textContent = `Speed: ${Math.round(Math.abs(this.speed) * 200)} mph`;
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateCarPhysics();
        this.checkCheckpoints();
        this.updateCamera();
        this.updateHUD();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new RacingGame();
});