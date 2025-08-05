// AAA Racing Championship - Main Game Engine

class AAACarRacingGame {
    constructor() {
        // Core systems
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null; // For post-processing
        
        // Game systems
        this.carModelManager = null;
        this.physicsEngine = null;
        this.particleSystem = null;
        this.trackManager = null;
        this.aiManager = null;
        
        // Game state
        this.gameState = 'loading'; // 'loading', 'menu', 'carSelection', 'trackSelection', 'racing', 'paused', 'finished'
        this.selectedCar = null;
        this.selectedTrack = 'nurburgring';
        this.playerVehicle = null;
        this.aiVehicles = [];
        
        // Race data
        this.raceStartTime = 0;
        this.currentLap = 1;
        this.totalLaps = 3;
        this.bestLapTime = Infinity;
        this.lapTimes = [];
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        this.position = 1;
        
        // Performance settings
        this.settings = {
            graphics: {
                quality: 'high',
                shadows: true,
                particles: true,
                postProcessing: true
            },
            audio: {
                masterVolume: 0.8,
                engineVolume: 0.7,
                effectsVolume: 0.6
            },
            controls: {
                sensitivity: 1.0,
                autoTransmission: true
            }
        };
        
        // Input handling
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            brake: false,
            turbo: false
        };
        
        // Camera system
        this.cameraMode = 'chase'; // 'chase', 'cockpit', 'orbit'
        this.cameraDistance = 8;
        this.cameraHeight = 4;
        this.cameraSpeed = 0.1;
        
        // HUD elements
        this.hudElements = {
            speedGauge: null,
            miniMap: null,
            raceTimer: null
        };
        
        this.init();
    }
    
    async init() {
        this.showLoadingScreen();
        
        try {
            await this.setupRenderer();
            await this.setupScene();
            await this.setupCamera();
            await this.setupLighting();
            await this.setupPostProcessing();
            await this.initializeSystems();
            await this.setupControls();
            await this.setupUI();
            
            this.hideLoadingScreen();
            this.showMainMenu();
            
            this.animate();
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Failed to initialize game. Please refresh and try again.');
        }
    }
    
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = loadingScreen.querySelector('.loading-progress');
        const loadingText = document.getElementById('loadingText');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = progress + '%';
            
            const messages = [
                'Loading graphics engine...',
                'Initializing physics...',
                'Creating car models...',
                'Building race tracks...',
                'Setting up audio...',
                'Preparing race environment...',
                'Almost ready...'
            ];
            
            const messageIndex = Math.floor((progress / 100) * messages.length);
            loadingText.textContent = messages[Math.min(messageIndex, messages.length - 1)];
        }, 100);
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    showError(message) {
        const loadingText = document.getElementById('loadingText');
        loadingText.textContent = `Error: ${message}`;
        loadingText.style.color = '#ff4444';
    }
    
    async setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: this.settings.graphics.quality !== 'low',
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enhanced rendering settings
        this.renderer.shadowMap.enabled = this.settings.graphics.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }
    
    async setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.CubeTextureLoader()
            .load([
                'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#87CEEB"/></svg>'), // px
                'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#87CEEB"/></svg>'), // nx
                'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#4A90E2"/></svg>'), // py
                'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#228B22"/></svg>'), // ny
                'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#87CEEB"/></svg>'), // pz
                'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#87CEEB"/></svg>')  // nz
            ]);
        
        // Add fog for atmosphere
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    async setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
    }
    
    async setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = this.settings.graphics.shadows;
        
        if (this.settings.graphics.shadows) {
            directionalLight.shadow.mapSize.width = this.settings.graphics.quality === 'high' ? 4096 : 2048;
            directionalLight.shadow.mapSize.height = this.settings.graphics.quality === 'high' ? 4096 : 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
            directionalLight.shadow.bias = -0.0001;
        }
        
        this.scene.add(directionalLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4A90E2, 0.3);
        fillLight.position.set(-50, 30, -50);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffa500, 0.2);
        rimLight.position.set(0, 10, -100);
        this.scene.add(rimLight);
    }
    
    async setupPostProcessing() {
        if (!this.settings.graphics.postProcessing) return;
        
        // Import post-processing passes (would need actual imports in real implementation)
        // For now, we'll skip advanced post-processing to avoid external dependencies
        this.composer = null;
    }
    
    async initializeSystems() {
        // Initialize car model manager
        this.carModelManager = new CarModelManager();
        
        // Initialize physics engine
        this.physicsEngine = new PhysicsEngine(this.scene);
        
        // Initialize particle system
        if (this.settings.graphics.particles) {
            this.particleSystem = new ParticleSystem(this.scene, this.renderer);
            this.scene.particleSystem = this.particleSystem;
        }
        
        // Create the track
        this.createTrack();
    }
    
    createTrack() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(400, 400);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create track surface
        const trackGeometry = new THREE.RingGeometry(25, 35, 64);
        const trackMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 30
        });
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.rotation.x = -Math.PI / 2;
        track.position.y = 0.01;
        track.receiveShadow = true;
        this.scene.add(track);
        
        // Create track physics
        this.physicsEngine.createTrackPhysics(trackGeometry);
        
        // Create barriers
        this.createTrackBarriers();
        
        // Create checkpoints
        this.createCheckpoints();
        
        // Add environment details
        this.createEnvironment();
    }
    
    createTrackBarriers() {
        const barrierGeometry = new THREE.BoxGeometry(1, 1.5, 1);
        const barrierMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
        
        // Inner barriers
        for (let i = 0; i < 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            const x = Math.cos(angle) * 25;
            const z = Math.sin(angle) * 25;
            
            const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(x, 0.75, z);
            barrier.castShadow = true;
            this.scene.add(barrier);
            
            // Create physics body for barrier
            this.physicsEngine.createBarrier(
                new CANNON.Vec3(x, 0.75, z),
                { x: 1, y: 1.5, z: 1 }
            );
        }
        
        // Outer barriers
        for (let i = 0; i < 80; i++) {
            const angle = (i / 80) * Math.PI * 2;
            const x = Math.cos(angle) * 35;
            const z = Math.sin(angle) * 35;
            
            const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(x, 0.75, z);
            barrier.castShadow = true;
            this.scene.add(barrier);
            
            // Create physics body for barrier
            this.physicsEngine.createBarrier(
                new CANNON.Vec3(x, 0.75, z),
                { x: 1, y: 1.5, z: 1 }
            );
        }
    }
    
    createCheckpoints() {
        const checkpointGeometry = new THREE.BoxGeometry(0.5, 4, 0.2);
        const checkpointMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        });
        
        this.checkpoints = [];
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 30;
            const z = Math.sin(angle) * 30;
            
            const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
            checkpoint.position.set(x, 2, z);
            checkpoint.rotation.y = angle;
            this.scene.add(checkpoint);
            
            this.checkpoints.push({
                mesh: checkpoint,
                position: new THREE.Vector3(x, 0, z),
                passed: false,
                index: i
            });
        }
    }
    
    createEnvironment() {
        // Trees
        const treeGeometry = new THREE.ConeGeometry(2, 8, 8);
        const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x0F5132 });
        
        for (let i = 0; i < 50; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            tree.position.set(
                Math.cos(angle) * distance,
                4,
                Math.sin(angle) * distance
            );
            tree.castShadow = true;
            this.scene.add(tree);
        }
        
        // Buildings in distance
        for (let i = 0; i < 20; i++) {
            const buildingGeometry = new THREE.BoxGeometry(
                5 + Math.random() * 10,
                10 + Math.random() * 20,
                5 + Math.random() * 10
            );
            const buildingMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(0.6, 0.2, 0.3 + Math.random() * 0.4)
            });
            
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 100;
            building.position.set(
                Math.cos(angle) * distance,
                building.geometry.parameters.height / 2,
                Math.sin(angle) * distance
            );
            building.castShadow = true;
            this.scene.add(building);
        }
        
        // Street lights around track
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const x = Math.cos(angle) * 40;
            const z = Math.sin(angle) * 40;
            
            this.createStreetLight(x, z);
        }
    }
    
    createStreetLight(x, z) {
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6);
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 3, z);
        pole.castShadow = true;
        this.scene.add(pole);
        
        const lightGeometry = new THREE.SphereGeometry(0.3);
        const lightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa,
            emissive: 0xffffaa,
            emissiveIntensity: 0.5
        });
        const lightBulb = new THREE.Mesh(lightGeometry, lightMaterial);
        lightBulb.position.set(x, 5.8, z);
        this.scene.add(lightBulb);
        
        // Add point light
        const pointLight = new THREE.PointLight(0xffffaa, 0.5, 20);
        pointLight.position.set(x, 5.8, z);
        pointLight.castShadow = this.settings.graphics.shadows;
        if (this.settings.graphics.shadows) {
            pointLight.shadow.mapSize.width = 512;
            pointLight.shadow.mapSize.height = 512;
        }
        this.scene.add(pointLight);
    }
    
    async setupControls() {
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
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.turbo = true;
                    break;
                case 'KeyC':
                    this.switchCameraMode();
                    break;
                case 'Escape':
                    if (this.gameState === 'racing') {
                        this.pauseGame();
                    }
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
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.turbo = false;
                    break;
            }
        });
    }
    
    async setupUI() {
        this.setupMenuHandlers();
        this.setupHUD();
    }
    
    setupMenuHandlers() {
        // Main menu buttons
        document.getElementById('quickRaceBtn').addEventListener('click', () => {
            this.selectRandomCarAndTrack();
            this.startRace();
        });
        
        document.getElementById('carSelectBtn').addEventListener('click', () => {
            this.showCarSelection();
        });
        
        document.getElementById('trackSelectBtn').addEventListener('click', () => {
            this.showTrackSelection();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // Car selection
        document.getElementById('backFromCarBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        document.getElementById('prevCarBtn').addEventListener('click', () => {
            this.previousCar();
        });
        
        document.getElementById('nextCarBtn').addEventListener('click', () => {
            this.nextCar();
        });
        
        document.getElementById('selectCarBtn').addEventListener('click', () => {
            this.confirmCarSelection();
        });
        
        // Results screen
        document.getElementById('raceAgainBtn').addEventListener('click', () => {
            this.restartRace();
        });
        
        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
    }
    
    setupHUD() {
        // Initialize speedometer canvas
        this.hudElements.speedGauge = document.getElementById('speedGauge');
        this.hudElements.miniMap = document.getElementById('miniMapCanvas');
        
        // Setup speedometer
        this.setupSpeedometer();
        this.setupMiniMap();
    }
    
    setupSpeedometer() {
        const canvas = this.hudElements.speedGauge;
        const ctx = canvas.getContext('2d');
        
        this.drawSpeedometer = (speed, rpm, gear) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;
            
            // Draw outer circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw speed marks
            for (let i = 0; i <= 200; i += 20) {
                const angle = (i / 200) * Math.PI * 1.5 - Math.PI * 0.75;
                const x1 = centerX + Math.cos(angle) * (radius - 15);
                const y1 = centerY + Math.sin(angle) * (radius - 15);
                const x2 = centerX + Math.cos(angle) * (radius - 5);
                const y2 = centerY + Math.sin(angle) * (radius - 5);
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Speed labels
                if (i % 40 === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.font = '12px Orbitron';
                    ctx.textAlign = 'center';
                    ctx.fillText(i.toString(), 
                        centerX + Math.cos(angle) * (radius - 25),
                        centerY + Math.sin(angle) * (radius - 25) + 4
                    );
                }
            }
            
            // Draw speed needle
            const speedAngle = (Math.min(speed, 200) / 200) * Math.PI * 1.5 - Math.PI * 0.75;
            const needleX = centerX + Math.cos(speedAngle) * (radius - 20);
            const needleY = centerY + Math.sin(speedAngle) * (radius - 20);
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(needleX, needleY);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Center dot
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#f1c40f';
            ctx.fill();
        };
    }
    
    setupMiniMap() {
        const canvas = this.hudElements.miniMap;
        const ctx = canvas.getContext('2d');
        
        this.drawMiniMap = (playerPos, aiPositions) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const scale = 2;
            
            // Draw track outline
            ctx.beginPath();
            ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw checkpoints
            this.checkpoints.forEach((checkpoint, index) => {
                const angle = (index / this.checkpoints.length) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * 50;
                const y = centerY + Math.sin(angle) * 50;
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fillStyle = checkpoint.passed ? '#4ecdc4' : '#00ff00';
                ctx.fill();
            });
            
            // Draw player car
            if (playerPos) {
                const playerX = centerX + playerPos.x / scale;
                const playerZ = centerY + playerPos.z / scale;
                
                ctx.beginPath();
                ctx.arc(playerX, playerZ, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#f1c40f';
                ctx.fill();
            }
            
            // Draw AI cars
            if (aiPositions) {
                aiPositions.forEach(pos => {
                    const aiX = centerX + pos.x / scale;
                    const aiZ = centerY + pos.z / scale;
                    
                    ctx.beginPath();
                    ctx.arc(aiX, aiZ, 3, 0, 2 * Math.PI);
                    ctx.fillStyle = '#e74c3c';
                    ctx.fill();
                });
            }
        };
    }
    
    showMainMenu() {
        this.gameState = 'menu';
        this.hideAllScreens();
        document.getElementById('mainMenu').classList.remove('hidden');
    }
    
    showCarSelection() {
        this.gameState = 'carSelection';
        this.hideAllScreens();
        document.getElementById('carSelection').classList.remove('hidden');
        this.setupCarPreview();
    }
    
    showTrackSelection() {
        this.gameState = 'trackSelection';
        this.hideAllScreens();
        document.getElementById('trackSelection').classList.remove('hidden');
    }
    
    showSettings() {
        this.gameState = 'settings';
        this.hideAllScreens();
        document.getElementById('settings').classList.remove('hidden');
    }
    
    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        document.getElementById('raceHUD').classList.add('hidden');
    }
    
    setupCarPreview() {
        const currentCar = this.carModelManager.getCurrentCar();
        this.updateCarStats(currentCar);
        
        // Create preview scene (simplified for this implementation)
        // In a full AAA game, this would show a 3D preview of the car
    }
    
    updateCarStats(car) {
        document.getElementById('carName').textContent = car.name;
        document.getElementById('speedStat').style.width = car.stats.speed + '%';
        document.getElementById('accelStat').style.width = car.stats.acceleration + '%';
        document.getElementById('handlingStat').style.width = car.stats.handling + '%';
        document.getElementById('brakingStat').style.width = car.stats.braking + '%';
    }
    
    previousCar() {
        const car = this.carModelManager.previousCar();
        this.updateCarStats(car);
    }
    
    nextCar() {
        const car = this.carModelManager.nextCar();
        this.updateCarStats(car);
    }
    
    confirmCarSelection() {
        this.selectedCar = this.carModelManager.getCurrentCar();
        this.showTrackSelection();
    }
    
    selectRandomCarAndTrack() {
        this.selectedCar = this.carModelManager.getCurrentCar();
        this.selectedTrack = 'nurburgring';
    }
    
    startRace() {
        this.gameState = 'racing';
        this.hideAllScreens();
        document.getElementById('raceHUD').classList.remove('hidden');
        
        this.initializeRace();
        this.startCountdown();
    }
    
    initializeRace() {
        // Reset race data
        this.currentLap = 1;
        this.raceStartTime = 0;
        this.bestLapTime = Infinity;
        this.lapTimes = [];
        this.currentCheckpoint = 0;
        this.position = 1;
        
        // Reset checkpoints
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
            checkpoint.mesh.material.color.setHex(0x00ff00);
        });
        
        // Create player vehicle
        if (this.playerVehicle) {
            this.physicsEngine.removeVehicle(this.playerVehicle.id);
        }
        
        this.playerVehicle = this.physicsEngine.createVehicle(
            this.selectedCar,
            new CANNON.Vec3(30, 1, 0),
            -Math.PI / 2
        );
        
        // Create visual car model
        this.playerCarModel = this.carModelManager.createCarModel(this.selectedCar, this.scene);
        this.scene.add(this.playerCarModel);
        
        // Reset particle system
        if (this.particleSystem) {
            this.particleSystem.reset();
        }
    }
    
    startCountdown() {
        const countdownElement = document.getElementById('countdown');
        const numberElement = document.getElementById('countdownNumber');
        
        countdownElement.classList.remove('hidden');
        
        let count = 3;
        const interval = setInterval(() => {
            if (count > 0) {
                numberElement.textContent = count;
                count--;
            } else {
                numberElement.textContent = 'GO!';
                setTimeout(() => {
                    countdownElement.classList.add('hidden');
                    this.raceStartTime = Date.now();
                }, 500);
                clearInterval(interval);
            }
        }, 1000);
    }
    
    switchCameraMode() {
        const modes = ['chase', 'cockpit', 'orbit'];
        const currentIndex = modes.indexOf(this.cameraMode);
        this.cameraMode = modes[(currentIndex + 1) % modes.length];
    }
    
    pauseGame() {
        if (this.gameState === 'racing') {
            this.gameState = 'paused';
            // Show pause menu
        }
    }
    
    restartRace() {
        this.startRace();
    }
    
    finishRace() {
        this.gameState = 'finished';
        this.hideAllScreens();
        document.getElementById('resultsScreen').classList.remove('hidden');
        
        // Calculate final stats
        const totalTime = this.lapTimes.reduce((sum, time) => sum + time, 0);
        const topSpeed = this.playerVehicle ? this.playerVehicle.getCurrentSpeed() : 0;
        
        document.getElementById('finalPosition').textContent = this.getPositionText(this.position);
        document.getElementById('bestLapTime').textContent = this.formatTime(this.bestLapTime / 1000);
        document.getElementById('totalTime').textContent = this.formatTime(totalTime / 1000);
        document.getElementById('topSpeed').textContent = Math.round(topSpeed) + ' mph';
    }
    
    update(deltaTime) {
        if (this.gameState !== 'racing') return;
        
        // Update physics
        this.physicsEngine.update(deltaTime);
        
        // Update particles
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
        
        // Update player vehicle
        this.updatePlayerVehicle(deltaTime);
        
        // Update camera
        this.updateCamera(deltaTime);
        
        // Update HUD
        this.updateHUD();
        
        // Check race progress
        this.checkRaceProgress();
    }
    
    updatePlayerVehicle(deltaTime) {
        if (!this.playerVehicle) return;
        
        // Calculate input
        let throttle = 0;
        let brake = 0;
        let steering = 0;
        
        if (this.keys.up) throttle = 1;
        if (this.keys.down) brake = 1;
        if (this.keys.left) steering = -1;
        if (this.keys.right) steering = 1;
        if (this.keys.brake) brake = Math.max(brake, 0.5);
        
        // Apply turbo boost
        if (this.keys.turbo && this.playerVehicle.getTurboBoost() > 0.1) {
            throttle *= 1.3;
        }
        
        // Apply input to vehicle
        this.playerVehicle.applyInput(throttle, brake, steering);
        
        // Update visual model position
        if (this.playerCarModel) {
            const pos = this.playerVehicle.getPosition();
            const rot = this.playerVehicle.getRotation();
            
            this.playerCarModel.position.copy(pos);
            this.playerCarModel.quaternion.copy(rot);
            
            // Update wheel rotation
            const speed = this.playerVehicle.getCurrentSpeed();
            this.carModelManager.updateWheelRotation(this.playerCarModel, speed * 0.01);
            
            // Emit particles based on driving conditions
            if (this.particleSystem && speed > 20) {
                const velocity = this.playerVehicle.getVelocity();
                const position = new THREE.Vector3(pos.x, pos.y, pos.z);
                const vel = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
                
                if (Math.abs(steering) > 0.5 && speed > 40) {
                    // Tire smoke during hard turning
                    this.particleSystem.emitTireSmoke(position, vel, Math.abs(steering) * speed * 0.01);
                }
                
                if (throttle > 0.8) {
                    // Exhaust particles during acceleration
                    this.particleSystem.emitExhaust(position, vel, throttle * 0.5);
                }
            }
        }
    }
    
    updateCamera(deltaTime) {
        if (!this.playerVehicle) return;
        
        const vehiclePos = this.playerVehicle.getPosition();
        const vehicleRot = this.playerVehicle.getRotation();
        
        switch (this.cameraMode) {
            case 'chase':
                this.updateChaseCamera(vehiclePos, vehicleRot, deltaTime);
                break;
            case 'cockpit':
                this.updateCockpitCamera(vehiclePos, vehicleRot, deltaTime);
                break;
            case 'orbit':
                this.updateOrbitCamera(vehiclePos, deltaTime);
                break;
        }
    }
    
    updateChaseCamera(vehiclePos, vehicleRot, deltaTime) {
        const cameraOffset = new THREE.Vector3(0, this.cameraHeight, -this.cameraDistance);
        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(vehicleRot);
        cameraOffset.applyMatrix4(rotationMatrix);
        
        const targetPosition = new THREE.Vector3().copy(vehiclePos).add(cameraOffset);
        
        // Smooth camera movement
        this.camera.position.lerp(targetPosition, this.cameraSpeed);
        
        // Look at vehicle
        const lookAtTarget = new THREE.Vector3().copy(vehiclePos);
        lookAtTarget.y += 1;
        this.camera.lookAt(lookAtTarget);
    }
    
    updateCockpitCamera(vehiclePos, vehicleRot, deltaTime) {
        const cockpitOffset = new THREE.Vector3(0, 1.2, 0.5);
        const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(vehicleRot);
        cockpitOffset.applyMatrix4(rotationMatrix);
        
        this.camera.position.copy(vehiclePos).add(cockpitOffset);
        this.camera.quaternion.copy(vehicleRot);
    }
    
    updateOrbitCamera(vehiclePos, deltaTime) {
        const time = Date.now() * 0.001;
        const radius = 15;
        
        this.camera.position.x = vehiclePos.x + Math.cos(time * 0.5) * radius;
        this.camera.position.z = vehiclePos.z + Math.sin(time * 0.5) * radius;
        this.camera.position.y = vehiclePos.y + 8;
        
        this.camera.lookAt(vehiclePos);
    }
    
    updateHUD() {
        if (!this.playerVehicle) return;
        
        const speed = this.playerVehicle.getCurrentSpeed();
        const rpm = this.playerVehicle.getEngineRPM();
        const gear = this.playerVehicle.getGear();
        const turbo = this.playerVehicle.getTurboBoost();
        
        // Update speedometer
        this.drawSpeedometer(speed, rpm, gear);
        
        // Update gear display
        document.getElementById('gearDisplay').textContent = gear;
        
        // Update performance bars
        const throttle = this.keys.up ? 1 : 0;
        const brake = (this.keys.down || this.keys.brake) ? 1 : 0;
        
        document.getElementById('throttleBar').style.width = (throttle * 100) + '%';
        document.getElementById('brakeBar').style.width = (brake * 100) + '%';
        document.getElementById('turboBar').style.width = (turbo * 100) + '%';
        
        // Update race info
        const currentTime = this.raceStartTime > 0 ? Date.now() - this.raceStartTime : 0;
        document.getElementById('raceTime').textContent = this.formatTime(currentTime / 1000);
        document.getElementById('currentLap').textContent = this.currentLap;
        document.getElementById('totalLaps').textContent = this.totalLaps;
        document.getElementById('position').textContent = this.position;
        
        // Update mini-map
        const playerPos = this.playerVehicle.getPosition();
        this.drawMiniMap(playerPos, []);
    }
    
    checkRaceProgress() {
        if (!this.playerVehicle) return;
        
        const playerPos = this.playerVehicle.getPosition();
        const currentCP = this.checkpoints[this.currentCheckpoint];
        
        if (currentCP && !currentCP.passed) {
            const distance = playerPos.distanceTo(currentCP.position);
            
            if (distance < 5) {
                currentCP.passed = true;
                currentCP.mesh.material.color.setHex(0x4ecdc4);
                
                this.currentCheckpoint++;
                
                // Check if lap completed
                if (this.currentCheckpoint >= this.checkpoints.length) {
                    this.completeLap();
                }
            }
        }
    }
    
    completeLap() {
        const lapTime = Date.now() - this.raceStartTime;
        this.lapTimes.push(lapTime);
        
        if (lapTime < this.bestLapTime) {
            this.bestLapTime = lapTime;
        }
        
        this.currentLap++;
        this.currentCheckpoint = 0;
        
        // Reset checkpoints
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
            checkpoint.mesh.material.color.setHex(0x00ff00);
        });
        
        // Check if race finished
        if (this.currentLap > this.totalLaps) {
            this.finishRace();
        } else {
            // Continue to next lap
            this.raceStartTime = Date.now();
        }
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    getPositionText(position) {
        const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
        const suffix = suffixes[position % 10];
        return `${position}${suffix}`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = 1/60; // Fixed timestep for consistent physics
        
        this.update(deltaTime);
        
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new AAACarRacingGame();
});