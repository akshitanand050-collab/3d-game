import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

import { SceneManager } from './SceneManager.js';
import { EntityManager } from './EntityManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { CameraController } from '../systems/CameraController.js';
import { WorldGenerator } from '../world/WorldGenerator.js';
import { PlayerController } from '../systems/PlayerController.js';
import { WeatherSystem } from '../systems/WeatherSystem.js';
import { DayNightCycle } from '../systems/DayNightCycle.js';
import { TrafficSystem } from '../systems/TrafficSystem.js';
import { PerformanceManager } from '../systems/PerformanceManager.js';

export class GameEngine {
    constructor(options = {}) {
        this.canvas = options.canvas;
        this.loadingManager = options.loadingManager;
        this.inputManager = options.inputManager;
        this.audioManager = options.audioManager;
        this.uiManager = options.uiManager;
        
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        
        // Managers
        this.sceneManager = null;
        this.entityManager = null;
        this.physicsManager = null;
        this.cameraController = null;
        this.performanceManager = null;
        
        // Systems
        this.worldGenerator = null;
        this.playerController = null;
        this.weatherSystem = null;
        this.dayNightCycle = null;
        this.trafficSystem = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.deltaTime = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        
        // Settings
        this.settings = {
            graphics: {
                shadows: true,
                antialiasing: true,
                bloom: true,
                ssao: true,
                renderDistance: 1000,
                lodDistance: 500
            },
            physics: {
                enabled: true,
                timeStep: 1/60,
                gravity: -9.82
            },
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.7,
                sfxVolume: 0.8
            }
        };
        
        // Performance tracking
        this.stats = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0,
            triangles: 0,
            memoryUsage: 0
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing Game Engine...');
        
        try {
            // Initialize core Three.js components
            this.initializeRenderer();
            this.initializeScene();
            this.initializeCamera();
            this.initializePostProcessing();
            
            // Initialize managers
            this.sceneManager = new SceneManager(this.scene);
            this.entityManager = new EntityManager();
            this.physicsManager = new PhysicsManager(this.settings.physics);
            this.performanceManager = new PerformanceManager();
            
            // Initialize camera controller
            this.cameraController = new CameraController(this.camera, this.inputManager);
            
            // Initialize world generator
            this.worldGenerator = new WorldGenerator({
                sceneManager: this.sceneManager,
                physicsManager: this.physicsManager,
                loadingManager: this.loadingManager
            });
            
            // Initialize game systems
            this.playerController = new PlayerController({
                inputManager: this.inputManager,
                physicsManager: this.physicsManager,
                entityManager: this.entityManager,
                audioManager: this.audioManager
            });
            
            this.weatherSystem = new WeatherSystem(this.scene);
            this.dayNightCycle = new DayNightCycle(this.scene);
            this.trafficSystem = new TrafficSystem({
                entityManager: this.entityManager,
                physicsManager: this.physicsManager
            });
            
            // Generate initial world
            await this.generateWorld();
            
            // Start render loop
            this.startRenderLoop();
            
            console.log('✅ Game Engine initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize Game Engine:', error);
            throw error;
        }
    }
    
    initializeRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.settings.graphics.antialiasing,
            alpha: false,
            logarithmicDepthBuffer: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows
        if (this.settings.graphics.shadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Set up color management
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Performance optimizations
        this.renderer.info.autoReset = false;
    }
    
    initializeScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);
        
        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.setScalar(2048);
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    initializeCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            this.settings.graphics.renderDistance
        );
        this.camera.position.set(0, 50, 100);
    }
    
    initializePostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // SSAO pass
        if (this.settings.graphics.ssao) {
            const ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
            ssaoPass.kernelRadius = 16;
            ssaoPass.minDistance = 0.005;
            ssaoPass.maxDistance = 0.1;
            this.composer.addPass(ssaoPass);
        }
        
        // Bloom pass
        if (this.settings.graphics.bloom) {
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.5, 0.4, 0.85
            );
            this.composer.addPass(bloomPass);
        }
        
        // Anti-aliasing pass
        if (this.settings.graphics.antialiasing) {
            const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
            this.composer.addPass(smaaPass);
        }
    }
    
    async generateWorld() {
        console.log('🌍 Generating world...');
        
        // Generate terrain
        await this.worldGenerator.generateTerrain();
        
        // Generate cities and roads
        await this.worldGenerator.generateCities();
        await this.worldGenerator.generateRoads();
        
        // Populate with objects
        await this.worldGenerator.populateWorld();
        
        // Spawn player
        await this.spawnPlayer();
        
        console.log('✅ World generation complete!');
    }
    
    async spawnPlayer() {
        const spawnPosition = new THREE.Vector3(0, 10, 0);
        await this.playerController.spawn(spawnPosition);
        
        // Set up camera to follow player
        this.cameraController.setTarget(this.playerController.getEntity());
    }
    
    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        
        // Start game systems
        this.weatherSystem.start();
        this.dayNightCycle.start();
        this.trafficSystem.start();
        
        console.log('🎮 Game started!');
    }
    
    pauseGame() {
        this.isPaused = true;
        console.log('⏸️ Game paused');
    }
    
    resumeGame() {
        this.isPaused = false;
        console.log('▶️ Game resumed');
    }
    
    stopGame() {
        this.isRunning = false;
        this.isPaused = false;
        
        // Stop game systems
        this.weatherSystem.stop();
        this.dayNightCycle.stop();
        this.trafficSystem.stop();
        
        console.log('⏹️ Game stopped');
    }
    
    startRenderLoop() {
        const animate = (currentTime) => {
            // Calculate delta time
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            this.frameCount++;
            
            // Update performance stats
            this.updatePerformanceStats();
            
            // Update game if running and not paused
            if (this.isRunning && !this.isPaused) {
                this.update(this.deltaTime);
            }
            
            // Render
            this.render();
            
            // Continue loop
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    update(deltaTime) {
        // Update physics
        this.physicsManager.update(deltaTime);
        
        // Update player
        this.playerController.update(deltaTime);
        
        // Update camera
        this.cameraController.update(deltaTime);
        
        // Update world systems
        this.weatherSystem.update(deltaTime);
        this.dayNightCycle.update(deltaTime);
        this.trafficSystem.update(deltaTime);
        
        // Update entities
        this.entityManager.update(deltaTime);
        
        // Update world streaming
        this.worldGenerator.updateStreaming(this.playerController.getPosition());
        
        // Update performance manager
        this.performanceManager.update(deltaTime);
    }
    
    render() {
        // Reset renderer info
        this.renderer.info.reset();
        
        // Render with post-processing
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    updatePerformanceStats() {
        // Calculate FPS
        if (this.frameCount % 60 === 0) {
            this.stats.fps = Math.round(1 / this.deltaTime);
            this.stats.frameTime = this.deltaTime * 1000;
            this.stats.drawCalls = this.renderer.info.render.calls;
            this.stats.triangles = this.renderer.info.render.triangles;
            
            // Memory usage (approximate)
            this.stats.memoryUsage = this.renderer.info.memory.geometries + 
                                   this.renderer.info.memory.textures;
            
            // Update UI
            this.uiManager.updatePerformanceStats(this.stats);
        }
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(width, height);
        
        // Update composer
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }
    
    applySettings(newSettings) {
        // Merge settings
        this.settings = { ...this.settings, ...newSettings };
        
        // Apply graphics settings
        if (newSettings.graphics) {
            this.applyGraphicsSettings(newSettings.graphics);
        }
        
        // Apply physics settings
        if (newSettings.physics) {
            this.physicsManager.applySettings(newSettings.physics);
        }
    }
    
    applyGraphicsSettings(graphics) {
        // Update shadows
        if (graphics.shadows !== undefined) {
            this.renderer.shadowMap.enabled = graphics.shadows;
        }
        
        // Update render distance
        if (graphics.renderDistance !== undefined) {
            this.camera.far = graphics.renderDistance;
            this.camera.updateProjectionMatrix();
        }
        
        // Reinitialize post-processing if needed
        if (graphics.bloom !== undefined || graphics.ssao !== undefined) {
            this.initializePostProcessing();
        }
    }
    
    saveGame() {
        const saveData = {
            player: this.playerController.getSaveData(),
            world: this.worldGenerator.getSaveData(),
            timestamp: Date.now()
        };
        
        localStorage.setItem('openworld-save', JSON.stringify(saveData));
        console.log('💾 Game saved!');
    }
    
    loadGame() {
        const saveData = localStorage.getItem('openworld-save');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.playerController.loadSaveData(data.player);
            this.worldGenerator.loadSaveData(data.world);
            console.log('📁 Game loaded!');
        }
    }
    
    getStats() {
        return this.stats;
    }
    
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    getRenderer() {
        return this.renderer;
    }
}