import { GameEngine } from './core/GameEngine.js';
import { LoadingManager } from './core/LoadingManager.js';
import { InputManager } from './systems/InputManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { UIManager } from './ui/UIManager.js';

class OpenWorldGame {
    constructor() {
        this.engine = null;
        this.loadingManager = null;
        this.inputManager = null;
        this.audioManager = null;
        this.uiManager = null;
        
        this.gameState = 'loading'; // 'loading', 'menu', 'playing', 'paused'
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize core managers
            this.loadingManager = new LoadingManager();
            this.inputManager = new InputManager();
            this.audioManager = new AudioManager();
            this.uiManager = new UIManager();
            
            // Initialize game engine
            this.engine = new GameEngine({
                canvas: document.getElementById('gameCanvas'),
                loadingManager: this.loadingManager,
                inputManager: this.inputManager,
                audioManager: this.audioManager,
                uiManager: this.uiManager
            });
            
            // Load essential game assets
            await this.loadEssentialAssets();
            
            // Initialize game systems
            await this.engine.initialize();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Hide loading screen and show main menu
            this.hideLoadingScreen();
            this.showMainMenu();
            
            this.isInitialized = true;
            this.gameState = 'menu';
            
            console.log('🎮 Open World Game initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showErrorScreen(error.message);
        }
    }
    
    async loadEssentialAssets() {
        const essentialAssets = [
            // Textures
            'textures/terrain/grass.jpg',
            'textures/terrain/road.jpg',
            'textures/sky/skybox.hdr',
            
            // Models
            'models/player/player.glb',
            'models/vehicles/car.glb',
            'models/environment/tree.glb',
            'models/environment/building.glb',
            
            // Audio
            'audio/ambient/nature.mp3',
            'audio/engine/car_engine.mp3',
            'audio/ui/menu_click.mp3'
        ];
        
        await this.loadingManager.loadAssets(essentialAssets);
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.handleResize();
        });
        
        // Handle visibility change for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        });
        
        // Handle before unload for saving
        window.addEventListener('beforeunload', () => {
            this.engine.saveGame();
        });
    }
    
    showLoadingScreen() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        loadingDiv.innerHTML = `
            <div class="loading-container">
                <h1>OPEN WORLD</h1>
                <div class="loading-bar">
                    <div class="loading-progress" id="loading-progress"></div>
                </div>
                <p id="loading-text">Initializing game engine...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Update loading progress
        this.loadingManager.onProgress = (progress, item) => {
            const progressBar = document.getElementById('loading-progress');
            const loadingText = document.getElementById('loading-text');
            if (progressBar) progressBar.style.width = `${progress * 100}%`;
            if (loadingText) loadingText.textContent = `Loading ${item}...`;
        };
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.remove(), 500);
        }
    }
    
    showMainMenu() {
        this.uiManager.showMainMenu({
            onStartGame: () => this.startGame(),
            onSettings: () => this.showSettings(),
            onCredits: () => this.showCredits()
        });
    }
    
    showErrorScreen(message) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'error-screen';
        errorDiv.innerHTML = `
            <div class="error-container">
                <h1>⚠️ Error</h1>
                <p>${message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
    
    startGame() {
        if (!this.isInitialized) return;
        
        this.gameState = 'playing';
        this.uiManager.hideMainMenu();
        this.uiManager.showGameHUD();
        this.engine.startGame();
        
        console.log('🎯 Game started!');
    }
    
    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        this.engine.pauseGame();
        this.uiManager.showPauseMenu({
            onResume: () => this.resumeGame(),
            onSettings: () => this.showSettings(),
            onMainMenu: () => this.returnToMainMenu()
        });
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.gameState = 'playing';
        this.uiManager.hidePauseMenu();
        this.engine.resumeGame();
    }
    
    returnToMainMenu() {
        this.gameState = 'menu';
        this.engine.stopGame();
        this.uiManager.hideAllMenus();
        this.showMainMenu();
    }
    
    showSettings() {
        this.uiManager.showSettingsMenu({
            onApply: (settings) => this.applySettings(settings),
            onCancel: () => this.uiManager.hideSettingsMenu()
        });
    }
    
    showCredits() {
        this.uiManager.showCreditsMenu({
            onBack: () => this.uiManager.hideCreditsMenu()
        });
    }
    
    applySettings(settings) {
        this.engine.applySettings(settings);
        this.audioManager.applySettings(settings.audio);
        this.uiManager.hideSettingsMenu();
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new OpenWorldGame();
});

// Handle errors gracefully
window.addEventListener('error', (event) => {
    console.error('Game Error:', event.error);
    // Could send error reports to analytics service
});

export { OpenWorldGame };