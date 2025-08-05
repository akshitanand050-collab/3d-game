export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            buttons: new Map(),
            wheel: 0
        };
        this.touch = {
            touches: new Map(),
            gestures: {
                pinchScale: 1,
                pinchDelta: 0
            }
        };
        this.gamepad = {
            connected: false,
            buttons: new Map(),
            axes: new Map()
        };
        
        // Key bindings
        this.keyBindings = new Map([
            ['forward', ['KeyW', 'ArrowUp']],
            ['backward', ['KeyS', 'ArrowDown']],
            ['left', ['KeyA', 'ArrowLeft']],
            ['right', ['KeyD', 'ArrowRight']],
            ['jump', ['Space']],
            ['sprint', ['ShiftLeft']],
            ['crouch', ['KeyC']],
            ['interact', ['KeyE']],
            ['inventory', ['KeyI']],
            ['menu', ['Escape']],
            ['map', ['KeyM']],
            ['camera', ['KeyV']],
            ['brake', ['Space']],
            ['handbrake', ['Space']],
            ['honk', ['KeyH']]
        ]);
        
        // Mouse bindings
        this.mouseBindings = new Map([
            ['look', 'mousemove'],
            ['fire', 0], // Left mouse button
            ['aim', 2], // Right mouse button
            ['zoom', 'wheel']
        ]);
        
        // Input states
        this.inputStates = new Map();
        this.previousInputStates = new Map();
        
        // Event callbacks
        this.callbacks = new Map();
        
        // Settings
        this.settings = {
            mouseSensitivity: 1.0,
            invertMouse: false,
            keyRepeat: false,
            deadzone: 0.1 // For gamepad
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupGamepadSupport();
        console.log('🎮 InputManager initialized');
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Mouse events
        document.addEventListener('mousedown', (event) => {
            this.handleMouseDown(event);
        });
        
        document.addEventListener('mouseup', (event) => {
            this.handleMouseUp(event);
        });
        
        document.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });
        
        document.addEventListener('wheel', (event) => {
            this.handleMouseWheel(event);
        });
        
        // Touch events
        document.addEventListener('touchstart', (event) => {
            this.handleTouchStart(event);
        });
        
        document.addEventListener('touchmove', (event) => {
            this.handleTouchMove(event);
        });
        
        document.addEventListener('touchend', (event) => {
            this.handleTouchEnd(event);
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Handle pointer lock
        document.addEventListener('pointerlockchange', () => {
            this.handlePointerLockChange();
        });
    }
    
    setupGamepadSupport() {
        window.addEventListener('gamepadconnected', (event) => {
            console.log(`🎮 Gamepad connected: ${event.gamepad.id}`);
            this.gamepad.connected = true;
        });
        
        window.addEventListener('gamepaddisconnected', (event) => {
            console.log(`🎮 Gamepad disconnected: ${event.gamepad.id}`);
            this.gamepad.connected = false;
        });
    }
    
    handleKeyDown(event) {
        const keyCode = event.code;
        
        if (!this.keys.has(keyCode) || this.settings.keyRepeat) {
            this.keys.set(keyCode, true);
            this.triggerAction('keydown', keyCode, event);
        }
        
        // Update input states based on key bindings
        this.updateInputStates();
        
        // Prevent default for game keys
        if (this.isGameKey(keyCode)) {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        const keyCode = event.code;
        this.keys.set(keyCode, false);
        this.triggerAction('keyup', keyCode, event);
        
        // Update input states
        this.updateInputStates();
        
        if (this.isGameKey(keyCode)) {
            event.preventDefault();
        }
    }
    
    handleMouseDown(event) {
        this.mouse.buttons.set(event.button, true);
        this.triggerAction('mousedown', event.button, event);
        
        // Update input states for mouse bindings
        this.updateInputStates();
    }
    
    handleMouseUp(event) {
        this.mouse.buttons.set(event.button, false);
        this.triggerAction('mouseup', event.button, event);
        
        this.updateInputStates();
    }
    
    handleMouseMove(event) {
        const deltaX = event.movementX || event.mozMovementX || 0;
        const deltaY = event.movementY || event.mozMovementY || 0;
        
        this.mouse.deltaX = deltaX * this.settings.mouseSensitivity;
        this.mouse.deltaY = deltaY * this.settings.mouseSensitivity * (this.settings.invertMouse ? -1 : 1);
        
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        
        this.triggerAction('mousemove', { deltaX: this.mouse.deltaX, deltaY: this.mouse.deltaY }, event);
    }
    
    handleMouseWheel(event) {
        this.mouse.wheel = event.deltaY;
        this.triggerAction('wheel', event.deltaY, event);
        event.preventDefault();
    }
    
    handleTouchStart(event) {
        for (const touch of event.changedTouches) {
            this.touch.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now()
            });
        }
        
        this.updateTouchGestures();
        this.triggerAction('touchstart', this.touch.touches, event);
        event.preventDefault();
    }
    
    handleTouchMove(event) {
        for (const touch of event.changedTouches) {
            const touchData = this.touch.touches.get(touch.identifier);
            if (touchData) {
                touchData.x = touch.clientX;
                touchData.y = touch.clientY;
            }
        }
        
        this.updateTouchGestures();
        this.triggerAction('touchmove', this.touch.touches, event);
        event.preventDefault();
    }
    
    handleTouchEnd(event) {
        for (const touch of event.changedTouches) {
            this.touch.touches.delete(touch.identifier);
        }
        
        this.updateTouchGestures();
        this.triggerAction('touchend', this.touch.touches, event);
    }
    
    updateTouchGestures() {
        const touches = Array.from(this.touch.touches.values());
        
        if (touches.length === 2) {
            // Pinch gesture
            const touch1 = touches[0];
            const touch2 = touches[1];
            
            const currentDistance = Math.sqrt(
                Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
            );
            
            const startDistance = Math.sqrt(
                Math.pow(touch2.startX - touch1.startX, 2) + Math.pow(touch2.startY - touch1.startY, 2)
            );
            
            const newScale = currentDistance / startDistance;
            this.touch.gestures.pinchDelta = newScale - this.touch.gestures.pinchScale;
            this.touch.gestures.pinchScale = newScale;
        }
    }
    
    handlePointerLockChange() {
        const isLocked = document.pointerLockElement === document.body;
        this.triggerAction('pointerlockchange', isLocked);
    }
    
    updateGamepad() {
        if (!this.gamepad.connected) return;
        
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0]; // Use first gamepad
        
        if (gamepad) {
            // Update buttons
            gamepad.buttons.forEach((button, index) => {
                this.gamepad.buttons.set(index, {
                    pressed: button.pressed,
                    value: button.value
                });
            });
            
            // Update axes with deadzone
            gamepad.axes.forEach((value, index) => {
                const adjustedValue = Math.abs(value) > this.settings.deadzone ? value : 0;
                this.gamepad.axes.set(index, adjustedValue);
            });
        }
    }
    
    updateInputStates() {
        // Store previous states
        this.previousInputStates.clear();
        this.inputStates.forEach((value, key) => {
            this.previousInputStates.set(key, value);
        });
        
        // Update current states based on key bindings
        this.keyBindings.forEach((keys, action) => {
            const isPressed = keys.some(key => this.keys.get(key));
            this.inputStates.set(action, isPressed);
        });
        
        // Update mouse button states
        this.mouseBindings.forEach((binding, action) => {
            if (typeof binding === 'number') {
                this.inputStates.set(action, this.mouse.buttons.get(binding) || false);
            }
        });
    }
    
    // Public API
    isPressed(action) {
        return this.inputStates.get(action) || false;
    }
    
    wasPressed(action) {
        return this.isPressed(action) && !this.wasDown(action);
    }
    
    wasReleased(action) {
        return !this.isPressed(action) && this.wasDown(action);
    }
    
    wasDown(action) {
        return this.previousInputStates.get(action) || false;
    }
    
    getMouseDelta() {
        return { x: this.mouse.deltaX, y: this.mouse.deltaY };
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    getMouseWheel() {
        return this.mouse.wheel;
    }
    
    getTouches() {
        return Array.from(this.touch.touches.values());
    }
    
    getPinchScale() {
        return this.touch.gestures.pinchScale;
    }
    
    getPinchDelta() {
        return this.touch.gestures.pinchDelta;
    }
    
    getGamepadAxis(index) {
        return this.gamepad.axes.get(index) || 0;
    }
    
    getGamepadButton(index) {
        return this.gamepad.buttons.get(index) || { pressed: false, value: 0 };
    }
    
    // Pointer lock
    requestPointerLock() {
        if (document.body.requestPointerLock) {
            document.body.requestPointerLock();
        }
    }
    
    exitPointerLock() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
    
    isPointerLocked() {
        return document.pointerLockElement === document.body;
    }
    
    // Key binding management
    setKeyBinding(action, keys) {
        this.keyBindings.set(action, Array.isArray(keys) ? keys : [keys]);
    }
    
    getKeyBinding(action) {
        return this.keyBindings.get(action) || [];
    }
    
    // Event callbacks
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }
    
    off(event, callback) {
        const callbacks = this.callbacks.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    triggerAction(event, data, originalEvent = null) {
        const callbacks = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                callback(data, originalEvent);
            });
        }
    }
    
    // Settings
    setSensitivity(sensitivity) {
        this.settings.mouseSensitivity = Math.max(0.1, Math.min(5.0, sensitivity));
    }
    
    setInvertMouse(invert) {
        this.settings.invertMouse = invert;
    }
    
    setDeadzone(deadzone) {
        this.settings.deadzone = Math.max(0, Math.min(0.5, deadzone));
    }
    
    // Utility methods
    isGameKey(keyCode) {
        return Array.from(this.keyBindings.values()).some(keys => keys.includes(keyCode));
    }
    
    update(deltaTime) {
        // Update gamepad state
        this.updateGamepad();
        
        // Reset mouse delta
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.wheel = 0;
        
        // Reset touch gesture deltas
        this.touch.gestures.pinchDelta = 0;
    }
    
    // Input profiles for different contexts
    setProfile(profileName) {
        const profiles = {
            'fps': {
                forward: ['KeyW'],
                backward: ['KeyS'],
                left: ['KeyA'],
                right: ['KeyD'],
                jump: ['Space'],
                sprint: ['ShiftLeft'],
                crouch: ['KeyC'],
                interact: ['KeyE'],
                reload: ['KeyR'],
                weapon1: ['Digit1'],
                weapon2: ['Digit2'],
                weapon3: ['Digit3']
            },
            'driving': {
                accelerate: ['KeyW', 'ArrowUp'],
                brake: ['KeyS', 'ArrowDown'],
                steerLeft: ['KeyA', 'ArrowLeft'],
                steerRight: ['KeyD', 'ArrowRight'],
                handbrake: ['Space'],
                honk: ['KeyH'],
                gear: ['KeyG'],
                camera: ['KeyV']
            },
            'flying': {
                forward: ['KeyW'],
                backward: ['KeyS'],
                left: ['KeyA'],
                right: ['KeyD'],
                up: ['Space'],
                down: ['ShiftLeft'],
                boost: ['ShiftLeft'],
                brake: ['KeyS']
            }
        };
        
        const profile = profiles[profileName];
        if (profile) {
            this.keyBindings.clear();
            Object.entries(profile).forEach(([action, keys]) => {
                this.keyBindings.set(action, keys);
            });
            console.log(`🎮 Input profile set to: ${profileName}`);
        }
    }
    
    // Save/load settings
    saveSettings() {
        const settings = {
            keyBindings: Object.fromEntries(this.keyBindings),
            mouseSensitivity: this.settings.mouseSensitivity,
            invertMouse: this.settings.invertMouse,
            deadzone: this.settings.deadzone
        };
        
        localStorage.setItem('inputSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('inputSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            if (settings.keyBindings) {
                this.keyBindings.clear();
                Object.entries(settings.keyBindings).forEach(([action, keys]) => {
                    this.keyBindings.set(action, keys);
                });
            }
            
            if (settings.mouseSensitivity !== undefined) {
                this.settings.mouseSensitivity = settings.mouseSensitivity;
            }
            
            if (settings.invertMouse !== undefined) {
                this.settings.invertMouse = settings.invertMouse;
            }
            
            if (settings.deadzone !== undefined) {
                this.settings.deadzone = settings.deadzone;
            }
        }
    }
    
    getStats() {
        return {
            keysPressed: Array.from(this.keys.entries()).filter(([k, v]) => v).length,
            mouseButtons: this.mouse.buttons.size,
            activeTouches: this.touch.touches.size,
            gamepadConnected: this.gamepad.connected,
            totalBindings: this.keyBindings.size
        };
    }
}