export class UIManager {
    constructor() {
        this.elements = new Map();
        this.menus = new Map();
        this.currentMenu = null;
        this.hudVisible = false;
        this.isMobile = this.detectMobile();
        
        // UI state
        this.state = {
            inventory: { open: false, selectedItem: null },
            map: { open: false, zoom: 1 },
            settings: { open: false, currentTab: 'graphics' },
            chat: { messages: [], visible: false }
        };
        
        // Performance stats
        this.performanceStats = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0,
            triangles: 0,
            memoryUsage: 0
        };
        
        // Notifications
        this.notifications = [];
        this.maxNotifications = 5;
        
        this.init();
    }
    
    init() {
        this.createBaseElements();
        this.setupEventListeners();
        this.setupMobileUI();
        console.log('🖥️ UIManager initialized');
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }
    
    createBaseElements() {
        // Create main UI container
        const uiContainer = document.createElement('div');
        uiContainer.id = 'ui-container';
        uiContainer.className = 'ui-container';
        document.body.appendChild(uiContainer);
        this.elements.set('container', uiContainer);
        
        // Create HUD
        this.createHUD();
        
        // Create menus
        this.createMainMenu();
        this.createPauseMenu();
        this.createSettingsMenu();
        this.createInventoryMenu();
        this.createMapMenu();
        
        // Create notification area
        this.createNotificationArea();
        
        // Apply styles
        this.injectStyles();
    }
    
    createHUD() {
        const hud = document.createElement('div');
        hud.id = 'game-hud';
        hud.className = 'game-hud hidden';
        
        hud.innerHTML = `
            <div class="hud-top">
                <div class="health-bar">
                    <div class="bar-fill health-fill" style="width: 100%"></div>
                    <span class="bar-text">Health: 100/100</span>
                </div>
                <div class="minimap">
                    <canvas id="minimap-canvas" width="150" height="150"></canvas>
                </div>
            </div>
            
            <div class="hud-center">
                <div class="crosshair"></div>
                <div class="interaction-prompt hidden">
                    <span id="interaction-text">Press E to interact</span>
                </div>
            </div>
            
            <div class="hud-bottom">
                <div class="speed-display">
                    <span id="speed-text">0 km/h</span>
                </div>
                <div class="inventory-hotbar">
                    ${Array.from({length: 10}, (_, i) => 
                        `<div class="hotbar-slot" data-slot="${i}">
                            <div class="slot-item"></div>
                            <span class="slot-number">${i + 1}</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="hud-right">
                <div class="performance-stats ${this.isMobile ? 'hidden' : ''}">
                    <div>FPS: <span id="fps-counter">0</span></div>
                    <div>Frame: <span id="frame-time">0</span>ms</div>
                    <div>Calls: <span id="draw-calls">0</span></div>
                    <div>Tris: <span id="triangles">0</span>K</div>
                </div>
            </div>
        `;
        
        this.elements.get('container').appendChild(hud);
        this.elements.set('hud', hud);
    }
    
    createMainMenu() {
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.className = 'menu-overlay hidden';
        
        menu.innerHTML = `
            <div class="menu-container">
                <h1 class="game-title">OPEN WORLD</h1>
                <div class="menu-buttons">
                    <button class="menu-btn" id="start-game-btn">Start Game</button>
                    <button class="menu-btn" id="load-game-btn">Load Game</button>
                    <button class="menu-btn" id="settings-btn">Settings</button>
                    <button class="menu-btn" id="credits-btn">Credits</button>
                    <button class="menu-btn" id="exit-game-btn">Exit</button>
                </div>
                <div class="version-info">v1.0.0</div>
            </div>
        `;
        
        this.elements.get('container').appendChild(menu);
        this.menus.set('main', menu);
    }
    
    createPauseMenu() {
        const menu = document.createElement('div');
        menu.id = 'pause-menu';
        menu.className = 'menu-overlay hidden';
        
        menu.innerHTML = `
            <div class="menu-container">
                <h2>Game Paused</h2>
                <div class="menu-buttons">
                    <button class="menu-btn" id="resume-btn">Resume</button>
                    <button class="menu-btn" id="save-game-btn">Save Game</button>
                    <button class="menu-btn" id="pause-settings-btn">Settings</button>
                    <button class="menu-btn" id="main-menu-btn">Main Menu</button>
                </div>
            </div>
        `;
        
        this.elements.get('container').appendChild(menu);
        this.menus.set('pause', menu);
    }
    
    createSettingsMenu() {
        const menu = document.createElement('div');
        menu.id = 'settings-menu';
        menu.className = 'menu-overlay hidden';
        
        menu.innerHTML = `
            <div class="menu-container settings-container">
                <h2>Settings</h2>
                <div class="settings-tabs">
                    <button class="tab-btn active" data-tab="graphics">Graphics</button>
                    <button class="tab-btn" data-tab="audio">Audio</button>
                    <button class="tab-btn" data-tab="controls">Controls</button>
                    <button class="tab-btn" data-tab="gameplay">Gameplay</button>
                </div>
                
                <div class="settings-content">
                    <div class="tab-panel active" id="graphics-panel">
                        <div class="setting-group">
                            <label>Graphics Quality</label>
                            <select id="graphics-quality">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="ultra">Ultra</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>Resolution</label>
                            <select id="resolution">
                                <option value="1920x1080">1920x1080</option>
                                <option value="1680x1050">1680x1050</option>
                                <option value="1366x768">1366x768</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="fullscreen"> Fullscreen
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="vsync"> VSync
                            </label>
                        </div>
                    </div>
                    
                    <div class="tab-panel" id="audio-panel">
                        <div class="setting-group">
                            <label>Master Volume</label>
                            <input type="range" id="master-volume" min="0" max="1" step="0.1" value="1">
                            <span class="volume-value">100%</span>
                        </div>
                        <div class="setting-group">
                            <label>Music Volume</label>
                            <input type="range" id="music-volume" min="0" max="1" step="0.1" value="0.7">
                            <span class="volume-value">70%</span>
                        </div>
                        <div class="setting-group">
                            <label>SFX Volume</label>
                            <input type="range" id="sfx-volume" min="0" max="1" step="0.1" value="0.8">
                            <span class="volume-value">80%</span>
                        </div>
                    </div>
                    
                    <div class="tab-panel" id="controls-panel">
                        <div class="setting-group">
                            <label>Mouse Sensitivity</label>
                            <input type="range" id="mouse-sensitivity" min="0.1" max="3" step="0.1" value="1">
                            <span class="sensitivity-value">1.0</span>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="invert-mouse"> Invert Mouse
                            </label>
                        </div>
                        <div class="key-bindings">
                            <h3>Key Bindings</h3>
                            <div id="key-binding-list"></div>
                        </div>
                    </div>
                    
                    <div class="tab-panel" id="gameplay-panel">
                        <div class="setting-group">
                            <label>Difficulty</label>
                            <select id="difficulty">
                                <option value="easy">Easy</option>
                                <option value="normal">Normal</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="auto-save"> Auto Save
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-btn" id="apply-settings-btn">Apply</button>
                    <button class="menu-btn" id="cancel-settings-btn">Cancel</button>
                </div>
            </div>
        `;
        
        this.elements.get('container').appendChild(menu);
        this.menus.set('settings', menu);
    }
    
    createInventoryMenu() {
        const menu = document.createElement('div');
        menu.id = 'inventory-menu';
        menu.className = 'menu-overlay hidden';
        
        menu.innerHTML = `
            <div class="inventory-container">
                <h2>Inventory</h2>
                <div class="inventory-grid">
                    ${Array.from({length: 40}, (_, i) => 
                        `<div class="inventory-slot" data-slot="${i}">
                            <div class="slot-item"></div>
                        </div>`
                    ).join('')}
                </div>
                <div class="item-details">
                    <h3 id="item-name">Select an item</h3>
                    <p id="item-description">Item description will appear here</p>
                    <div class="item-actions">
                        <button class="action-btn" id="use-item-btn">Use</button>
                        <button class="action-btn" id="drop-item-btn">Drop</button>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.get('container').appendChild(menu);
        this.menus.set('inventory', menu);
    }
    
    createMapMenu() {
        const menu = document.createElement('div');
        menu.id = 'map-menu';
        menu.className = 'menu-overlay hidden';
        
        menu.innerHTML = `
            <div class="map-container">
                <h2>Map</h2>
                <div class="map-controls">
                    <button class="map-btn" id="zoom-in-btn">+</button>
                    <button class="map-btn" id="zoom-out-btn">-</button>
                    <button class="map-btn" id="center-map-btn">Center</button>
                </div>
                <canvas id="game-map" width="800" height="600"></canvas>
                <div class="map-legend">
                    <div class="legend-item">
                        <span class="legend-color player"></span>
                        <span>Player</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color city"></span>
                        <span>City</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color road"></span>
                        <span>Road</span>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.get('container').appendChild(menu);
        this.menus.set('map', menu);
    }
    
    createNotificationArea() {
        const notifications = document.createElement('div');
        notifications.id = 'notifications';
        notifications.className = 'notification-area';
        
        this.elements.get('container').appendChild(notifications);
        this.elements.set('notifications', notifications);
    }
    
    setupMobileUI() {
        if (!this.isMobile) return;
        
        // Create mobile controls
        const mobileControls = document.createElement('div');
        mobileControls.id = 'mobile-controls';
        mobileControls.className = 'mobile-controls';
        
        mobileControls.innerHTML = `
            <div class="mobile-joystick left-joystick">
                <div class="joystick-base">
                    <div class="joystick-stick"></div>
                </div>
            </div>
            
            <div class="mobile-buttons">
                <button class="mobile-btn jump-btn">Jump</button>
                <button class="mobile-btn interact-btn">Use</button>
                <button class="mobile-btn inventory-btn">📦</button>
                <button class="mobile-btn map-btn">🗺️</button>
            </div>
            
            <div class="mobile-joystick right-joystick">
                <div class="joystick-base">
                    <div class="joystick-stick"></div>
                </div>
            </div>
        `;
        
        this.elements.get('container').appendChild(mobileControls);
        this.elements.set('mobileControls', mobileControls);
        
        this.setupMobileControlHandlers();
    }
    
    setupMobileControlHandlers() {
        // Implement mobile joystick and button handlers
        // This would handle touch events for mobile controls
    }
    
    setupEventListeners() {
        // Menu button handlers
        this.setupMenuHandlers();
        
        // Settings handlers
        this.setupSettingsHandlers();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupMenuHandlers() {
        // Main menu
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            this.triggerCallback('onStartGame');
        });
        
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettingsMenu();
        });
        
        // Pause menu
        document.getElementById('resume-btn')?.addEventListener('click', () => {
            this.triggerCallback('onResume');
        });
        
        document.getElementById('main-menu-btn')?.addEventListener('click', () => {
            this.triggerCallback('onMainMenu');
        });
        
        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSettingsTab(btn.dataset.tab);
            });
        });
    }
    
    setupSettingsHandlers() {
        // Volume sliders
        const volumeSliders = ['master-volume', 'music-volume', 'sfx-volume'];
        volumeSliders.forEach(id => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.updateVolumeDisplay(id, e.target.value);
                });
            }
        });
        
        // Mouse sensitivity
        const sensitivitySlider = document.getElementById('mouse-sensitivity');
        if (sensitivitySlider) {
            sensitivitySlider.addEventListener('input', (e) => {
                this.updateSensitivityDisplay(e.target.value);
            });
        }
    }
    
    handleKeyboardShortcuts(event) {
        switch (event.key) {
            case 'Escape':
                this.togglePauseMenu();
                break;
            case 'i':
            case 'I':
                this.toggleInventory();
                break;
            case 'm':
            case 'M':
                this.toggleMap();
                break;
        }
    }
    
    handleResize() {
        this.isMobile = this.detectMobile();
        
        // Update mobile controls visibility
        const mobileControls = this.elements.get('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = this.isMobile ? 'flex' : 'none';
        }
        
        // Update performance stats visibility
        const perfStats = document.querySelector('.performance-stats');
        if (perfStats) {
            perfStats.classList.toggle('hidden', this.isMobile);
        }
    }
    
    // Public API
    showMainMenu(callbacks = {}) {
        this.callbacks = callbacks;
        this.showMenu('main');
    }
    
    hideMainMenu() {
        this.hideMenu('main');
    }
    
    showPauseMenu(callbacks = {}) {
        this.callbacks = callbacks;
        this.showMenu('pause');
    }
    
    hidePauseMenu() {
        this.hideMenu('pause');
    }
    
    showSettingsMenu(callbacks = {}) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        this.showMenu('settings');
    }
    
    hideSettingsMenu() {
        this.hideMenu('settings');
    }
    
    showGameHUD() {
        const hud = this.elements.get('hud');
        if (hud) {
            hud.classList.remove('hidden');
            this.hudVisible = true;
        }
    }
    
    hideGameHUD() {
        const hud = this.elements.get('hud');
        if (hud) {
            hud.classList.add('hidden');
            this.hudVisible = false;
        }
    }
    
    toggleInventory() {
        const inventory = this.menus.get('inventory');
        if (inventory) {
            this.state.inventory.open = !this.state.inventory.open;
            inventory.classList.toggle('hidden', !this.state.inventory.open);
        }
    }
    
    toggleMap() {
        const map = this.menus.get('map');
        if (map) {
            this.state.map.open = !this.state.map.open;
            map.classList.toggle('hidden', !this.state.map.open);
        }
    }
    
    togglePauseMenu() {
        if (this.currentMenu === 'pause') {
            this.hidePauseMenu();
            this.triggerCallback('onResume');
        } else {
            this.showPauseMenu();
        }
    }
    
    showMenu(menuName) {
        // Hide current menu
        if (this.currentMenu) {
            this.hideMenu(this.currentMenu);
        }
        
        const menu = this.menus.get(menuName);
        if (menu) {
            menu.classList.remove('hidden');
            this.currentMenu = menuName;
        }
    }
    
    hideMenu(menuName) {
        const menu = this.menus.get(menuName);
        if (menu) {
            menu.classList.add('hidden');
            if (this.currentMenu === menuName) {
                this.currentMenu = null;
            }
        }
    }
    
    hideAllMenus() {
        this.menus.forEach((menu, name) => {
            this.hideMenu(name);
        });
    }
    
    // HUD Updates
    updateHealth(current, max) {
        const healthFill = document.querySelector('.health-fill');
        const healthText = document.querySelector('.health-bar .bar-text');
        
        if (healthFill && healthText) {
            const percentage = (current / max) * 100;
            healthFill.style.width = `${percentage}%`;
            healthText.textContent = `Health: ${current}/${max}`;
        }
    }
    
    updateSpeed(speed) {
        const speedText = document.getElementById('speed-text');
        if (speedText) {
            speedText.textContent = `${Math.round(speed)} km/h`;
        }
    }
    
    updatePerformanceStats(stats) {
        this.performanceStats = stats;
        
        const fpsCounter = document.getElementById('fps-counter');
        const frameTime = document.getElementById('frame-time');
        const drawCalls = document.getElementById('draw-calls');
        const triangles = document.getElementById('triangles');
        
        if (fpsCounter) fpsCounter.textContent = stats.fps;
        if (frameTime) frameTime.textContent = stats.frameTime.toFixed(1);
        if (drawCalls) drawCalls.textContent = stats.drawCalls;
        if (triangles) triangles.textContent = Math.round(stats.triangles / 1000);
    }
    
    showInteractionPrompt(text) {
        const prompt = document.querySelector('.interaction-prompt');
        const promptText = document.getElementById('interaction-text');
        
        if (prompt && promptText) {
            promptText.textContent = text;
            prompt.classList.remove('hidden');
        }
    }
    
    hideInteractionPrompt() {
        const prompt = document.querySelector('.interaction-prompt');
        if (prompt) {
            prompt.classList.add('hidden');
        }
    }
    
    // Notifications
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const notificationArea = this.elements.get('notifications');
        if (notificationArea) {
            notificationArea.appendChild(notification);
            this.notifications.push(notification);
            
            // Remove old notifications if too many
            while (this.notifications.length > this.maxNotifications) {
                const old = this.notifications.shift();
                old.remove();
            }
            
            // Auto-remove after duration
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                    const index = this.notifications.indexOf(notification);
                    if (index > -1) {
                        this.notifications.splice(index, 1);
                    }
                }, 300);
            }, duration);
        }
    }
    
    // Settings
    switchSettingsTab(tabName) {
        // Hide all panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show selected panel
        const panel = document.getElementById(`${tabName}-panel`);
        if (panel) {
            panel.classList.add('active');
        }
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
        
        this.state.settings.currentTab = tabName;
    }
    
    updateVolumeDisplay(sliderId, value) {
        const valueSpan = document.querySelector(`#${sliderId} + .volume-value`);
        if (valueSpan) {
            valueSpan.textContent = `${Math.round(value * 100)}%`;
        }
    }
    
    updateSensitivityDisplay(value) {
        const valueSpan = document.querySelector('.sensitivity-value');
        if (valueSpan) {
            valueSpan.textContent = parseFloat(value).toFixed(1);
        }
    }
    
    // Utility
    triggerCallback(callbackName, ...args) {
        if (this.callbacks && this.callbacks[callbackName]) {
            this.callbacks[callbackName](...args);
        }
    }
    
    injectStyles() {
        const styles = `
            <style>
                .ui-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1000;
                    font-family: 'Arial', sans-serif;
                }
                
                .game-hud {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                
                .hud-top {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    display: flex;
                    justify-content: space-between;
                }
                
                .health-bar {
                    width: 200px;
                    height: 30px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid #333;
                    position: relative;
                }
                
                .bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ff4444, #ffaa00);
                    transition: width 0.3s ease;
                }
                
                .health-fill {
                    background: linear-gradient(90deg, #ff4444, #44ff44);
                }
                
                .bar-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                }
                
                .minimap {
                    width: 150px;
                    height: 150px;
                    border: 2px solid #333;
                    background: rgba(0, 0, 0, 0.5);
                }
                
                .crosshair {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    border-radius: 50%;
                }
                
                .crosshair::before,
                .crosshair::after {
                    content: '';
                    position: absolute;
                    background: rgba(255, 255, 255, 0.8);
                }
                
                .crosshair::before {
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 2px;
                    height: 10px;
                }
                
                .crosshair::after {
                    left: -5px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 10px;
                    height: 2px;
                }
                
                .interaction-prompt {
                    position: absolute;
                    bottom: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    font-weight: bold;
                }
                
                .hud-bottom {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                
                .speed-display {
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-size: 18px;
                    font-weight: bold;
                }
                
                .inventory-hotbar {
                    display: flex;
                    gap: 5px;
                }
                
                .hotbar-slot {
                    width: 50px;
                    height: 50px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid #333;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .slot-number {
                    position: absolute;
                    top: 2px;
                    right: 4px;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                }
                
                .hud-right {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                }
                
                .performance-stats {
                    background: rgba(0, 0, 0, 0.7);
                    color: #00ff00;
                    padding: 10px;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 12px;
                }
                
                .menu-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: all;
                }
                
                .menu-container {
                    background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                }
                
                .game-title {
                    color: #ffffff;
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 30px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                }
                
                .menu-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .menu-btn {
                    background: linear-gradient(135deg, #3a3a3a, #4a4a4a);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 5px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .menu-btn:hover {
                    background: linear-gradient(135deg, #4a4a4a, #5a5a5a);
                    transform: translateY(-2px);
                }
                
                .settings-container {
                    max-width: 600px;
                    width: 95%;
                }
                
                .settings-tabs {
                    display: flex;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #333;
                }
                
                .tab-btn {
                    background: none;
                    border: none;
                    color: #ccc;
                    padding: 10px 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .tab-btn.active {
                    color: white;
                    border-bottom: 2px solid #4CAF50;
                }
                
                .tab-panel {
                    display: none;
                    text-align: left;
                }
                
                .tab-panel.active {
                    display: block;
                }
                
                .setting-group {
                    margin-bottom: 20px;
                }
                
                .setting-group label {
                    display: block;
                    color: white;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                
                .setting-group select,
                .setting-group input[type="range"] {
                    width: 100%;
                    padding: 8px;
                    background: #333;
                    color: white;
                    border: 1px solid #555;
                    border-radius: 3px;
                }
                
                .notification-area {
                    position: absolute;
                    top: 20px;
                    right: 200px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none;
                }
                
                .notification {
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    border-left: 4px solid #4CAF50;
                    animation: slideIn 0.3s ease;
                }
                
                .notification-warning {
                    border-left-color: #FF9800;
                }
                
                .notification-error {
                    border-left-color: #F44336;
                }
                
                .notification.fade-out {
                    animation: fadeOut 0.3s ease;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateX(100%); }
                }
                
                .hidden {
                    display: none !important;
                }
                
                /* Mobile styles */
                @media (max-width: 768px) {
                    .game-title {
                        font-size: 32px;
                    }
                    
                    .menu-container {
                        padding: 20px;
                        max-width: 300px;
                    }
                    
                    .hud-top {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .minimap {
                        width: 100px;
                        height: 100px;
                    }
                    
                    .inventory-hotbar {
                        justify-content: center;
                    }
                    
                    .hotbar-slot {
                        width: 40px;
                        height: 40px;
                    }
                }
                
                .mobile-controls {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 200px;
                    display: none;
                    align-items: flex-end;
                    justify-content: space-between;
                    padding: 20px;
                    pointer-events: all;
                }
                
                .mobile-joystick {
                    width: 100px;
                    height: 100px;
                }
                
                .joystick-base {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.4);
                    position: relative;
                }
                
                .joystick-stick {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                
                .mobile-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .mobile-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.4);
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}