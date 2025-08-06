class Player {
    constructor(camera, engine) {
        this.camera = camera;
        this.engine = engine;
        this.position = new THREE.Vector3(0, 5, 10);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        // Movement settings
        this.movementSpeed = 15;
        this.sprintSpeed = 25;
        this.jumpSpeed = 8;
        this.gravity = -20;
        this.friction = 0.9;
        this.airResistance = 0.95;
        
        // Look settings
        this.mouseSensitivity = 0.002;
        this.verticalAngle = 0;
        this.horizontalAngle = 0;
        this.maxVerticalAngle = Math.PI / 2 - 0.1;
        
        // State
        this.isGrounded = false;
        this.isSprinting = false;
        this.canJump = true;
        this.isMoving = false;
        this.isInDream = false;
        
        // Interaction
        this.interactionRange = 5;
        this.nearbyFragment = null;
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false,
            interact: false
        };
        
        // Raycaster for interaction and ground detection
        this.raycaster = new THREE.Raycaster();
        this.downRay = new THREE.Raycaster();
        
        // Initialize
        this.setupEventListeners();
        this.updateCameraPosition();
        
        console.log('Player initialized');
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Mouse events
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('click', this.onClick.bind(this));
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onKeyDown(event) {
        if (event.repeat) return;
        
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = true;
                break;
            case 'KeyE':
                this.keys.interact = true;
                this.interact();
                break;
            case 'KeyJ':
                // Open journal
                window.dispatchEvent(new CustomEvent('toggleJournal'));
                break;
            case 'Escape':
                // Pause/menu
                document.exitPointerLock();
                window.dispatchEvent(new CustomEvent('pauseGame'));
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.sprint = false;
                break;
            case 'KeyE':
                this.keys.interact = false;
                break;
        }
    }
    
    onMouseMove(event) {
        if (document.pointerLockElement === this.engine.canvas) {
            const deltaX = event.movementX * this.mouseSensitivity;
            const deltaY = event.movementY * this.mouseSensitivity;
            
            this.horizontalAngle -= deltaX;
            this.verticalAngle -= deltaY;
            
            // Clamp vertical angle
            this.verticalAngle = Math.max(
                -this.maxVerticalAngle,
                Math.min(this.maxVerticalAngle, this.verticalAngle)
            );
            
            this.updateCameraRotation();
        }
    }
    
    onClick(event) {
        // Request pointer lock if not already locked
        if (document.pointerLockElement !== this.engine.canvas) {
            this.engine.canvas.requestPointerLock();
        }
    }
    
    onPointerLockChange() {
        const isLocked = document.pointerLockElement === this.engine.canvas;
        
        if (isLocked) {
            // Show game HUD
            window.dispatchEvent(new CustomEvent('showGameHUD'));
        } else {
            // Hide game HUD or show pause menu
            window.dispatchEvent(new CustomEvent('hideGameHUD'));
        }
    }
    
    update(deltaTime, world) {
        if (!this.isInDream) return;
        
        this.updateMovement(deltaTime);
        this.updateGroundDetection(world);
        this.updateInteraction(world);
        this.updateCameraPosition();
        
        // Apply dream-specific effects
        this.applyDreamEffects(deltaTime, world);
    }
    
    updateMovement(deltaTime) {
        const speed = this.keys.sprint ? this.sprintSpeed : this.movementSpeed;
        const moveVector = new THREE.Vector3();
        
        // Calculate movement direction relative to camera
        if (this.keys.forward) moveVector.z -= 1;
        if (this.keys.backward) moveVector.z += 1;
        if (this.keys.left) moveVector.x -= 1;
        if (this.keys.right) moveVector.x += 1;
        
        // Normalize diagonal movement
        if (moveVector.length() > 0) {
            moveVector.normalize();
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        
        // Apply camera rotation to movement
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0; // Remove vertical component
        cameraDirection.normalize();
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        
        const worldMoveVector = new THREE.Vector3();
        worldMoveVector.addScaledVector(cameraDirection, -moveVector.z);
        worldMoveVector.addScaledVector(cameraRight, moveVector.x);
        
        // Apply movement to velocity
        this.velocity.x += worldMoveVector.x * speed * deltaTime;
        this.velocity.z += worldMoveVector.z * speed * deltaTime;
        
        // Apply friction
        if (this.isGrounded) {
            this.velocity.x *= this.friction;
            this.velocity.z *= this.friction;
        } else {
            this.velocity.x *= this.airResistance;
            this.velocity.z *= this.airResistance;
        }
        
        // Handle jumping
        if (this.keys.jump && this.isGrounded && this.canJump) {
            this.velocity.y = this.jumpSpeed;
            this.isGrounded = false;
            this.canJump = false;
            
            // Prevent immediate re-jumping
            setTimeout(() => { this.canJump = true; }, 200);
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Prevent falling through world
        if (this.position.y < -50) {
            this.respawn();
        }
    }
    
    updateGroundDetection(world) {
        if (!world) return;
        
        // Cast ray downward to detect ground
        this.downRay.set(this.position, new THREE.Vector3(0, -1, 0));
        
        const intersects = this.downRay.intersectObjects(world.objects, true);
        
        if (intersects.length > 0) {
            const groundDistance = intersects[0].distance;
            
            if (groundDistance < 1.5) {
                this.isGrounded = true;
                this.position.y = intersects[0].point.y + 1.5;
                
                if (this.velocity.y < 0) {
                    this.velocity.y = 0;
                }
            } else {
                this.isGrounded = false;
            }
        } else {
            this.isGrounded = false;
        }
    }
    
    updateInteraction(world) {
        if (!world) return;
        
        // Cast ray forward to detect interactable objects
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        this.raycaster.set(this.position, cameraDirection);
        const intersects = this.raycaster.intersectObjects(world.objects, true);
        
        let nearestFragment = null;
        let nearestDistance = this.interactionRange;
        
        for (const intersect of intersects) {
            if (intersect.distance > this.interactionRange) break;
            
            const object = intersect.object;
            if (object.userData.type === 'fragment' && intersect.distance < nearestDistance) {
                nearestFragment = object;
                nearestDistance = intersect.distance;
            }
        }
        
        // Update UI prompt
        if (nearestFragment !== this.nearbyFragment) {
            this.nearbyFragment = nearestFragment;
            
            if (nearestFragment) {
                window.dispatchEvent(new CustomEvent('showInteractionPrompt', {
                    detail: { fragment: nearestFragment.userData.memory }
                }));
            } else {
                window.dispatchEvent(new CustomEvent('hideInteractionPrompt'));
            }
        }
    }
    
    interact() {
        if (this.nearbyFragment && !this.nearbyFragment.userData.collected) {
            // Collect the fragment
            const memory = this.nearbyFragment.userData.memory;
            
            window.dispatchEvent(new CustomEvent('fragmentCollected', {
                detail: { fragment: this.nearbyFragment, memory: memory }
            }));
            
            // Mark as collected and hide the object
            this.nearbyFragment.userData.collected = true;
            this.nearbyFragment.visible = false;
            this.nearbyFragment = null;
            
            window.dispatchEvent(new CustomEvent('hideInteractionPrompt'));
        }
    }
    
    updateCameraPosition() {
        this.camera.position.copy(this.position);
    }
    
    updateCameraRotation() {
        // Apply rotation to camera
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.horizontalAngle;
        this.camera.rotation.x = this.verticalAngle;
    }
    
    applyDreamEffects(deltaTime, world) {
        // Apply dream-specific movement modifications
        if (world.type === 'floating_city') {
            // Slightly reduced gravity in floating city
            this.gravity = -15;
        } else if (world.type === 'gravity_well') {
            // Variable gravity based on position
            const distanceFromCenter = this.position.distanceTo(new THREE.Vector3(0, 0, 0));
            this.gravity = -20 - (50 / Math.max(distanceFromCenter, 1));
        } else if (world.type === 'shadow_realm') {
            // Slower movement in shadow realm
            this.movementSpeed = 10;
        } else {
            // Reset to default
            this.gravity = -20;
            this.movementSpeed = 15;
        }
        
        // Add slight camera sway for dreamlike effect
        const time = Date.now() * 0.001;
        const swayAmount = 0.002;
        this.camera.rotation.z = Math.sin(time * 0.5) * swayAmount;
    }
    
    enterDream(world, spawnPosition) {
        this.isInDream = true;
        
        if (spawnPosition) {
            this.position.copy(spawnPosition);
        } else {
            // Find a safe spawn position
            this.position.set(0, 10, 0);
        }
        
        this.velocity.set(0, 0, 0);
        this.updateCameraPosition();
        
        console.log(`Player entered dream: ${world.type}`);
    }
    
    exitDream() {
        this.isInDream = false;
        document.exitPointerLock();
        
        console.log('Player exited dream');
    }
    
    respawn() {
        // Respawn at a safe location
        this.position.set(0, 10, 0);
        this.velocity.set(0, 0, 0);
        this.updateCameraPosition();
        
        window.dispatchEvent(new CustomEvent('playerRespawned'));
    }
    
    // Utility methods
    getPosition() {
        return this.position.clone();
    }
    
    getLookDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
    
    teleportTo(position) {
        this.position.copy(position);
        this.velocity.set(0, 0, 0);
        this.updateCameraPosition();
    }
    
    // Dream-specific abilities
    enableFloating() {
        this.gravity = 0;
        this.canFly = true;
    }
    
    disableFloating() {
        this.gravity = -20;
        this.canFly = false;
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            position: this.position.toArray(),
            velocity: this.velocity.toArray(),
            isGrounded: this.isGrounded,
            isMoving: this.isMoving,
            nearbyFragment: this.nearbyFragment ? this.nearbyFragment.userData.memory.title : null
        };
    }
    
    dispose() {
        // Clean up event listeners
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('click', this.onClick.bind(this));
        document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    }
}

// Export for use in other modules
window.Player = Player;