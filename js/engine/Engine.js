class Engine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.isRunning = false;
        
        // Engine settings
        this.settings = {
            fov: 75,
            near: 0.1,
            far: 1000,
            fogColor: 0x2a1810,
            fogNear: 10,
            fogFar: 100,
            ambientLightColor: 0x404040,
            ambientLightIntensity: 0.3,
            directionalLightColor: 0xffffff,
            directionalLightIntensity: 0.7
        };
        
        // Performance monitoring
        this.stats = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0,
            triangles: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        
        console.log('Dream Dealer Engine initialized');
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Game canvas not found');
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.settings.fogColor);
        
        // Add atmospheric fog for dreamlike effect
        this.scene.fog = new THREE.Fog(
            this.settings.fogColor,
            this.settings.fogNear,
            this.settings.fogFar
        );
    }
    
    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            this.settings.fov,
            aspect,
            this.settings.near,
            this.settings.far
        );
        
        // Start position (will be overridden by player)
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows for dramatic effect
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Enhanced rendering settings for dreamlike quality
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Enable post-processing effects
        this.renderer.autoClear = false;
    }
    
    setupLights() {
        // Ambient light for soft illumination
        const ambientLight = new THREE.AmbientLight(
            this.settings.ambientLightColor,
            this.settings.ambientLightIntensity
        );
        this.scene.add(ambientLight);
        
        // Directional light for main illumination
        this.directionalLight = new THREE.DirectionalLight(
            this.settings.directionalLightColor,
            this.settings.directionalLightIntensity
        );
        this.directionalLight.position.set(10, 20, 5);
        this.directionalLight.castShadow = true;
        
        // Shadow settings
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -20;
        this.directionalLight.shadow.camera.right = 20;
        this.directionalLight.shadow.camera.top = 20;
        this.directionalLight.shadow.camera.bottom = -20;
        
        this.scene.add(this.directionalLight);
        
        // Add some colored lights for atmosphere
        this.addAtmosphericLights();
    }
    
    addAtmosphericLights() {
        // Dream-like colored lights
        const colors = [0x6a4c93, 0x2e86de, 0xee5a6f, 0xd4af37];
        const positions = [
            [-20, 15, -20],
            [20, 15, -20],
            [-20, 15, 20],
            [20, 15, 20]
        ];
        
        colors.forEach((color, index) => {
            const light = new THREE.PointLight(color, 0.5, 30);
            light.position.set(...positions[index]);
            this.scene.add(light);
        });
    }
    
    setupControls() {
        // Will be handled by Player class, but set up basic pointer lock
        this.canvas.addEventListener('click', () => {
            if (document.pointerLockElement !== this.canvas) {
                this.canvas.requestPointerLock();
            }
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Handle visibility change for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }
    
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        this.frameCount++;
        
        // Update frame time for performance monitoring
        this.stats.frameTime = deltaTime;
        this.stats.fps = 1 / deltaTime;
        
        this.update(deltaTime);
        this.render();
    }
    
    update(deltaTime) {
        // Update atmospheric lights for dream effect
        this.updateAtmosphericLights(deltaTime);
        
        // Dispatch update event for other systems
        window.dispatchEvent(new CustomEvent('engineUpdate', {
            detail: { deltaTime, frameCount: this.frameCount }
        }));
    }
    
    updateAtmosphericLights(deltaTime) {
        // Slowly pulsate atmospheric lights
        const time = this.frameCount * 0.01;
        this.scene.traverse((child) => {
            if (child instanceof THREE.PointLight) {
                const baseIntensity = 0.5;
                const pulse = Math.sin(time + child.position.x * 0.1) * 0.2;
                child.intensity = baseIntensity + pulse;
            }
        });
    }
    
    render() {
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
    }
    
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    // Utility methods for dream effects
    setFogDistance(near, far) {
        this.scene.fog.near = near;
        this.scene.fog.far = far;
    }
    
    setFogColor(color) {
        this.scene.fog.color.setHex(color);
        this.scene.background.setHex(color);
    }
    
    // Performance optimization
    setRenderQuality(quality) {
        const pixelRatio = Math.min(window.devicePixelRatio, quality);
        this.renderer.setPixelRatio(pixelRatio);
        
        // Adjust shadow quality
        if (quality < 1.5) {
            this.directionalLight.shadow.mapSize.width = 1024;
            this.directionalLight.shadow.mapSize.height = 1024;
        } else {
            this.directionalLight.shadow.mapSize.width = 2048;
            this.directionalLight.shadow.mapSize.height = 2048;
        }
    }
    
    // Debug methods
    getStats() {
        return {
            ...this.stats,
            drawCalls: this.renderer.info.render.calls,
            triangles: this.renderer.info.render.triangles,
            memoryGeometries: this.renderer.info.memory.geometries,
            memoryTextures: this.renderer.info.memory.textures
        };
    }
    
    dispose() {
        this.pause();
        
        // Clean up resources
        this.scene.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }
}

// Export for use in other modules
window.Engine = Engine;