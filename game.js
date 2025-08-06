// Dream Dealer - A Surreal First-Person Exploration Game
class DreamDealer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, fragmentUI
        this.dreamFragments = 0;
        this.currentDreamer = 'Unknown';
        this.dreamLevel = 1;
        this.currentFragment = null;
        
        // Dream world elements
        this.dreamObjects = [];
        this.fragments = [];
        this.floatingStructures = [];
        this.ambientParticles = [];
        
        // Dreamer data
        this.dreamers = [
            { name: 'Sarah', emotion: 'melancholy', fragments: [] },
            { name: 'Marcus', emotion: 'nostalgia', fragments: [] },
            { name: 'Elena', emotion: 'wonder', fragments: [] },
            { name: 'David', emotion: 'fear', fragments: [] },
            { name: 'Luna', emotion: 'joy', fragments: [] }
        ];
        
        this.fragmentTexts = {
            melancholy: [
                "A forgotten melody echoes through empty halls...",
                "The weight of memories too heavy to carry...",
                "Shadows dance with the ghosts of what could have been...",
                "Time flows like honey, slow and golden...",
                "The heart remembers what the mind tries to forget..."
            ],
            nostalgia: [
                "The scent of old books and summer afternoons...",
                "Childhood laughter echoing through time...",
                "A familiar street that no longer exists...",
                "The warmth of a grandmother's embrace...",
                "Songs that speak of days long past..."
            ],
            wonder: [
                "Stars falling like diamonds from the sky...",
                "Mountains that touch the clouds and beyond...",
                "Oceans of light in impossible colors...",
                "Cities built on the backs of giant creatures...",
                "The first breath of a newborn universe..."
            ],
            fear: [
                "Darkness that moves when you're not looking...",
                "Whispers from behind closed doors...",
                "Shadows that follow your every step...",
                "The feeling of being watched in empty rooms...",
                "Nightmares that refuse to stay in dreams..."
            ],
            joy: [
                "Sunlight that dances on morning dew...",
                "The pure laughter of children at play...",
                "Flowers that bloom in impossible colors...",
                "Music that makes the heart sing...",
                "The first taste of something wonderful..."
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupThreeJS();
        this.setupControls();
        this.setupEventListeners();
        this.createDreamWorld();
        this.animate();
    }
    
    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000011, 50, 200);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000011);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        this.setupLighting();
        
        // Raycaster for interactions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0x8a2be2, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Colored point lights for dream atmosphere
        const colors = [0xff69b4, 0x00ffff, 0xffff00, 0xff4500];
        colors.forEach((color, index) => {
            const pointLight = new THREE.PointLight(color, 0.5, 50);
            pointLight.position.set(
                Math.sin(index * Math.PI / 2) * 20,
                5 + Math.sin(index * Math.PI / 2) * 3,
                Math.cos(index * Math.PI / 2) * 20
            );
            this.scene.add(pointLight);
        });
    }
    
    setupControls() {
        this.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            velocity: new THREE.Vector3(),
            direction: new THREE.Vector3(),
            speed: 0.1
        };
        
        // Mouse controls
        document.addEventListener('mousemove', (event) => {
            if (this.gameState === 'playing') {
                const movementX = event.movementX || 0;
                const movementY = event.movementY || 0;
                
                this.camera.rotation.y -= movementX * 0.002;
                this.camera.rotation.x -= movementY * 0.002;
                
                // Clamp vertical rotation
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (this.gameState === 'playing') {
                switch(event.code) {
                    case 'KeyW':
                    case 'ArrowUp':
                        this.controls.moveForward = true;
                        break;
                    case 'KeyS':
                    case 'ArrowDown':
                        this.controls.moveBackward = true;
                        break;
                    case 'KeyA':
                    case 'ArrowLeft':
                        this.controls.moveLeft = true;
                        break;
                    case 'KeyD':
                    case 'ArrowRight':
                        this.controls.moveRight = true;
                        break;
                }
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.controls.moveForward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.controls.moveBackward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.controls.moveLeft = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.controls.moveRight = false;
                    break;
            }
        });
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Fragment UI buttons
        document.getElementById('collectFragment').addEventListener('click', () => {
            this.collectFragment();
        });
        
        document.getElementById('closeFragment').addEventListener('click', () => {
            this.closeFragmentUI();
        });
        
        // Mouse click for interactions
        document.addEventListener('click', (event) => {
            if (this.gameState === 'playing') {
                this.handleClick(event);
            }
        });
        
        // Pointer lock for mouse controls
        document.getElementById('gameCanvas').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                document.getElementById('gameCanvas').requestPointerLock();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createDreamWorld() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create floating structures
        this.createFloatingStructures();
        
        // Create dream fragments
        this.createDreamFragments();
        
        // Create ambient particles
        this.createAmbientParticles();
    }
    
    createFloatingStructures() {
        const structureCount = 15;
        
        for (let i = 0; i < structureCount; i++) {
            const structure = this.createRandomStructure();
            structure.position.set(
                (Math.random() - 0.5) * 80,
                Math.random() * 20 + 5,
                (Math.random() - 0.5) * 80
            );
            structure.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            this.scene.add(structure);
            this.floatingStructures.push(structure);
        }
    }
    
    createRandomStructure() {
        const group = new THREE.Group();
        
        // Random geometry type
        const geometries = [
            new THREE.BoxGeometry(2, 4, 2),
            new THREE.CylinderGeometry(1, 1, 6),
            new THREE.SphereGeometry(2),
            new THREE.TorusGeometry(2, 0.5, 8, 16),
            new THREE.OctahedronGeometry(2)
        ];
        
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        group.add(mesh);
        
        return group;
    }
    
    createDreamFragments() {
        const fragmentCount = 8;
        
        for (let i = 0; i < fragmentCount; i++) {
            const fragment = this.createDreamFragment();
            fragment.position.set(
                (Math.random() - 0.5) * 60,
                Math.random() * 10 + 2,
                (Math.random() - 0.5) * 60
            );
            this.scene.add(fragment);
            this.fragments.push(fragment);
        }
    }
    
    createDreamFragment() {
        const group = new THREE.Group();
        
        // Crystal-like geometry
        const geometry = new THREE.OctahedronGeometry(1);
        const material = new THREE.MeshLambertMaterial({
            color: 0x8a2be2,
            transparent: true,
            opacity: 0.9,
            emissive: 0x8a2be2,
            emissiveIntensity: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        
        // Add glow effect
        const glowGeometry = new THREE.OctahedronGeometry(1.5);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x8a2be2,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        group.add(mesh);
        group.add(glow);
        
        // Store fragment data
        group.userData = {
            type: 'fragment',
            collected: false,
            emotion: Object.keys(this.fragmentTexts)[Math.floor(Math.random() * Object.keys(this.fragmentTexts).length)],
            text: this.getRandomFragmentText()
        };
        
        return group;
    }
    
    getRandomFragmentText() {
        const emotions = Object.keys(this.fragmentTexts);
        const emotion = emotions[Math.floor(Math.random() * emotions.length)];
        const texts = this.fragmentTexts[emotion];
        return texts[Math.floor(Math.random() * texts.length)];
    }
    
    createAmbientParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = Math.random() * 50;
            positions[i + 2] = (Math.random() - 0.5) * 100;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x8a2be2,
            size: 0.5,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.ambientParticles.push(particles);
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameCanvas').requestPointerLock();
        this.updateHUD();
    }
    
    restartGame() {
        this.dreamFragments = 0;
        this.dreamLevel = 1;
        this.currentDreamer = this.dreamers[Math.floor(Math.random() * this.dreamers.length)].name;
        
        // Reset fragments
        this.fragments.forEach(fragment => {
            fragment.userData.collected = false;
            fragment.visible = true;
        });
        
        // Clear scene and recreate
        this.scene.clear();
        this.setupLighting();
        this.createDreamWorld();
        
        this.gameState = 'playing';
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.add('hidden');
        this.updateHUD();
    }
    
    handleClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.fragments, true);
        
        if (intersects.length > 0) {
            const fragment = intersects[0].object.parent;
            if (fragment && fragment.userData.type === 'fragment' && !fragment.userData.collected) {
                this.showFragmentUI(fragment);
            }
        }
    }
    
    showFragmentUI(fragment) {
        this.currentFragment = fragment;
        this.gameState = 'fragmentUI';
        
        document.getElementById('fragmentText').textContent = fragment.userData.text;
        document.getElementById('dreamFragmentUI').classList.remove('hidden');
    }
    
    collectFragment() {
        if (this.currentFragment) {
            this.currentFragment.userData.collected = true;
            this.currentFragment.visible = false;
            this.dreamFragments++;
            
            // Check if all fragments collected
            const collectedCount = this.fragments.filter(f => f.userData.collected).length;
            if (collectedCount >= this.fragments.length) {
                this.completeDreamLevel();
            }
            
            this.closeFragmentUI();
            this.updateHUD();
        }
    }
    
    closeFragmentUI() {
        document.getElementById('dreamFragmentUI').classList.add('hidden');
        this.gameState = 'playing';
        this.currentFragment = null;
    }
    
    completeDreamLevel() {
        this.dreamLevel++;
        this.gameState = 'menu';
        
        document.getElementById('finalStats').innerHTML = `
            <p>Dream Level ${this.dreamLevel - 1} Complete!</p>
            <p>Fragments Collected: ${this.dreamFragments}</p>
            <p>Next Dreamer: ${this.dreamers[Math.floor(Math.random() * this.dreamers.length)].name}</p>
        `;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    updateHUD() {
        document.getElementById('dreamFragments').textContent = `Fragments: ${this.dreamFragments}`;
        document.getElementById('currentDreamer').textContent = `Dreamer: ${this.currentDreamer}`;
        document.getElementById('dreamLevel').textContent = `Dream Level: ${this.dreamLevel}`;
    }
    
    updateMovement() {
        if (this.gameState !== 'playing') return;
        
        const time = Date.now() * 0.001;
        
        // Movement
        this.controls.velocity.x -= this.controls.velocity.x * 10.0 * 0.016;
        this.controls.velocity.z -= this.controls.velocity.z * 10.0 * 0.016;
        
        this.controls.direction.z = Number(this.controls.moveForward) - Number(this.controls.moveBackward);
        this.controls.direction.x = Number(this.controls.moveRight) - Number(this.controls.moveLeft);
        this.controls.direction.normalize();
        
        if (this.controls.moveForward || this.controls.moveBackward) {
            this.controls.velocity.z -= this.controls.direction.z * 400.0 * 0.016;
        }
        if (this.controls.moveLeft || this.controls.moveRight) {
            this.controls.velocity.x -= this.controls.direction.x * 400.0 * 0.016;
        }
        
        // Apply movement
        const moveX = this.controls.velocity.x * 0.016;
        const moveZ = this.controls.velocity.z * 0.016;
        
        this.camera.translateZ(-moveZ);
        this.camera.translateX(-moveX);
        
        // Keep camera within bounds
        this.camera.position.x = Math.max(-50, Math.min(50, this.camera.position.x));
        this.camera.position.z = Math.max(-50, Math.min(50, this.camera.position.z));
        this.camera.position.y = Math.max(1, Math.min(20, this.camera.position.y));
    }
    
    updateDreamWorld() {
        const time = Date.now() * 0.001;
        
        // Animate floating structures
        this.floatingStructures.forEach((structure, index) => {
            structure.rotation.y += 0.005 * (index % 3 + 1);
            structure.position.y += Math.sin(time + index) * 0.01;
        });
        
        // Animate fragments
        this.fragments.forEach((fragment, index) => {
            if (!fragment.userData.collected) {
                fragment.rotation.y += 0.02;
                fragment.position.y += Math.sin(time * 2 + index) * 0.005;
            }
        });
        
        // Animate ambient particles
        this.ambientParticles.forEach((particles, index) => {
            particles.rotation.y += 0.001 * (index + 1);
            particles.position.y += Math.sin(time * 0.5 + index) * 0.01;
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateMovement();
        this.updateDreamWorld();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new DreamDealer();
});