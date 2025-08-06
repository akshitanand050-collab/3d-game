class DreamDealerGame {
    constructor() {
        this.engine = null;
        this.player = null;
        this.proceduralGenerator = null;
        this.fragmentSystem = null;
        this.currentWorld = null;
        this.gameState = 'menu'; // menu, loading, playing, paused
        this.dreamers = [];
        this.currentDreamer = null;
        
        // Game progression
        this.totalDreamsExplored = 0;
        this.playerIdentityProgress = 0;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing Dream Dealer...');
        
        // Show loading screen
        this.showScreen('loading-screen');
        this.updateLoadingProgress(0);
        
        try {
            // Initialize core systems
            await this.initializeSystems();
            this.updateLoadingProgress(30);
            
            // Generate initial dreamers
            this.generateDreamers();
            this.updateLoadingProgress(50);
            
            // Setup UI event listeners
            this.setupUIEvents();
            this.updateLoadingProgress(70);
            
            // Setup game event listeners
            this.setupGameEvents();
            this.updateLoadingProgress(90);
            
            // Complete loading
            await this.delay(1000); // Show completion briefly
            this.updateLoadingProgress(100);
            
            // Show main menu
            await this.delay(500);
            this.showMainMenu();
            
            console.log('Dream Dealer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Dream Dealer:', error);
            this.showError('Failed to initialize the game. Please refresh and try again.');
        }
    }
    
    async initializeSystems() {
        // Initialize 3D engine
        this.engine = new Engine();
        
        // Initialize player
        this.player = new Player(this.engine.camera, this.engine);
        
        // Initialize procedural generator
        this.proceduralGenerator = new ProceduralGenerator();
        
        // Initialize fragment system
        this.fragmentSystem = new FragmentSystem();
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        
        // Start engine
        this.engine.start();
    }
    
    generateDreamers() {
        const dreamerProfiles = [
            {
                name: "Aria Chen",
                age: 28,
                personality: "creative",
                emotionalState: "nostalgic",
                memories: [
                    { title: "First Love", description: "The gentle touch of a first romantic connection", emotion: "love", intensity: 0.9, type: "emotion" },
                    { title: "Art Studio", description: "Hours spent creating in a sunlit studio", emotion: "peaceful", intensity: 0.7, type: "memory" },
                    { title: "Lost Opportunity", description: "A chance not taken, forever wondered about", emotion: "sad", intensity: 0.8, type: "desire" }
                ],
                backstory: "A painter who moved to the city to pursue her dreams but struggles with self-doubt."
            },
            {
                name: "Marcus Thompson",
                age: 45,
                personality: "anxious",
                emotionalState: "conflicted",
                memories: [
                    { title: "Father's Approval", description: "Never quite measuring up to expectations", emotion: "fear", intensity: 0.8, type: "fear" },
                    { title: "Corporate Success", description: "Climbing the ladder but losing himself", emotion: "anger", intensity: 0.6, type: "memory" },
                    { title: "Hidden Passion", description: "A secret love for music he never pursued", emotion: "desire", intensity: 0.9, type: "secret" }
                ],
                backstory: "A successful executive who questions whether his achievements are truly his own."
            },
            {
                name: "Elena Vasquez",
                age: 34,
                personality: "empathetic",
                emotionalState: "healing",
                memories: [
                    { title: "Mother's Illness", description: "Watching a loved one slowly fade away", emotion: "sad", intensity: 0.9, type: "memory" },
                    { title: "Helping Others", description: "Finding purpose in healing and care", emotion: "peaceful", intensity: 0.8, type: "emotion" },
                    { title: "Inner Strength", description: "Discovering resilience in the darkest times", emotion: "happy", intensity: 0.7, type: "emotion" }
                ],
                backstory: "A therapist who helps others while processing her own grief and finding meaning."
            },
            {
                name: "David Kim",
                age: 22,
                personality: "logical",
                emotionalState: "curious",
                memories: [
                    { title: "Code Breakthrough", description: "The moment when complex algorithms suddenly made sense", emotion: "happy", intensity: 0.8, type: "memory" },
                    { title: "Social Anxiety", description: "Feeling disconnected in a crowd of people", emotion: "fear", intensity: 0.7, type: "fear" },
                    { title: "Future Vision", description: "Dreams of changing the world through technology", emotion: "desire", intensity: 0.9, type: "desire" }
                ],
                backstory: "A brilliant programmer who excels with machines but struggles with human connections."
            }
        ];
        
        this.dreamers = dreamerProfiles;
        console.log(`Generated ${this.dreamers.length} dreamers`);
    }
    
    setupUIEvents() {
        // Main menu events
        document.getElementById('start-game')?.addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('continue-game')?.addEventListener('click', () => {
            this.continueGame();
        });
        
        document.getElementById('settings')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('about')?.addEventListener('click', () => {
            this.showAbout();
        });
        
        // Journal events
        document.getElementById('close-journal')?.addEventListener('click', () => {
            this.hideJournal();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }
    
    setupGameEvents() {
        // Fragment collection
        window.addEventListener('fragmentCollected', (e) => {
            this.onFragmentCollected(e.detail);
        });
        
        // Narrative discovery
        window.addEventListener('narrativeDiscovered', (e) => {
            this.onNarrativeDiscovered(e.detail);
        });
        
        // UI toggle events
        window.addEventListener('toggleJournal', () => {
            this.toggleJournal();
        });
        
        window.addEventListener('showGameHUD', () => {
            this.showGameHUD();
        });
        
        window.addEventListener('hideGameHUD', () => {
            this.hideGameHUD();
        });
        
        window.addEventListener('pauseGame', () => {
            this.pauseGame();
        });
        
        // Interaction events
        window.addEventListener('showInteractionPrompt', (e) => {
            this.showInteractionPrompt(e.detail.fragment);
        });
        
        window.addEventListener('hideInteractionPrompt', () => {
            this.hideInteractionPrompt();
        });
        
        // Engine update
        window.addEventListener('engineUpdate', (e) => {
            this.update(e.detail.deltaTime);
        });
        
        // Player respawn
        window.addEventListener('playerRespawned', () => {
            this.onPlayerRespawned();
        });
    }
    
    async startNewGame() {
        this.gameState = 'loading';
        this.showScreen('loading-screen');
        this.updateLoadingText('Entering the realm of dreams...');
        
        // Initialize audio on first user interaction
        await this.audioManager.initialize();
        await this.audioManager.resumeContext();
        
        // Select first dreamer
        this.currentDreamer = this.dreamers[0];
        
        // Generate first dream world
        this.updateLoadingText(`Entering ${this.currentDreamer.name}'s dream...`);
        await this.enterDream(this.currentDreamer);
        
        this.gameState = 'playing';
    }
    
    async enterDream(dreamer) {
        console.log(`Entering dream of ${dreamer.name}`);
        
        // Generate dream world
        this.currentWorld = this.proceduralGenerator.generateDreamWorld(dreamer);
        this.updateLoadingProgress(40);
        
        // Clear previous world
        if (this.currentWorld) {
            this.clearCurrentWorld();
        }
        
        // Add objects to engine scene
        this.currentWorld.objects.forEach(obj => {
            this.engine.addToScene(obj);
        });
        this.updateLoadingProgress(60);
        
        // Apply world atmosphere
        this.applyWorldAtmosphere(this.currentWorld);
        this.updateLoadingProgress(80);
        
        // Position player
        const spawnPosition = new THREE.Vector3(0, 5, 0);
        this.player.enterDream(this.currentWorld, spawnPosition);
        this.updateLoadingProgress(100);
        
        // Update UI
        this.updateDreamerInfo(dreamer);
        
        // Hide loading screen and show game
        await this.delay(500);
        this.hideAllScreens();
        this.showGameHUD();
        
        // Request pointer lock to start playing
        this.engine.canvas.requestPointerLock();
        
        // Start ambient audio for this dream type
        this.audioManager.playAmbientForDreamType(world.type);
        
        this.totalDreamsExplored++;
    }
    
    applyWorldAtmosphere(world) {
        // Apply lighting
        const lighting = world.lighting;
        // Update engine lighting (would need to modify engine)
        
        // Apply atmosphere
        const atmosphere = world.atmosphere;
        this.engine.setFogColor(atmosphere.fogColor);
        this.engine.setFogDistance(atmosphere.fogNear, atmosphere.fogFar);
    }
    
    clearCurrentWorld() {
        if (this.currentWorld) {
            this.currentWorld.objects.forEach(obj => {
                this.engine.removeFromScene(obj);
            });
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update player
        this.player.update(deltaTime, this.currentWorld);
        
        // Update world animations
        if (this.currentWorld) {
            this.proceduralGenerator.updateAnimations(this.currentWorld, deltaTime);
        }
        
        // Update dream stability (decreases over time)
        this.updateDreamStability(deltaTime);
    }
    
    updateDreamStability(deltaTime) {
        if (!this.currentWorld) return;
        
        // Dream becomes less stable over time
        if (!this.currentWorld.stability) {
            this.currentWorld.stability = 100;
        }
        
        this.currentWorld.stability -= deltaTime * 2; // Loses 2% per second
        
        // Update stability bar
        const stabilityFill = document.getElementById('stability-fill');
        if (stabilityFill) {
            stabilityFill.style.width = `${Math.max(0, this.currentWorld.stability)}%`;
        }
        
        // If stability gets too low, trigger dream collapse
        if (this.currentWorld.stability <= 0) {
            this.triggerDreamCollapse();
        }
    }
    
    triggerDreamCollapse() {
        console.log('Dream stability critical - triggering collapse');
        
        // Force exit from current dream
        this.exitCurrentDream();
        
        // Show narrative about dream collapse
        this.showNarrativeModal(
            "The dream begins to fracture and dissolve around you. Reality bleeds through the cracks as the dreamer's subconscious rejects your presence. You must withdraw before becoming trapped in the collapsing mindscape.",
            [{ text: "Withdraw", action: () => this.returnToHub() }]
        );
    }
    
    onFragmentCollected(detail) {
        console.log('Fragment collected:', detail.memory.title);
        
        // Process fragment through fragment system
        const collectedFragment = this.fragmentSystem.collectFragment(
            detail.memory,
            this.currentDreamer
        );
        
        // Update fragment counter
        this.updateFragmentCounter();
        
        // Show fragment preview
        this.showFragmentPreview(collectedFragment);
        
        // Play collection sound
        this.audioManager.playFragmentCollectionSound();
        
        // Increase dream stability slightly (collecting fragments helps maintain dream)
        if (this.currentWorld) {
            this.currentWorld.stability = Math.min(100, this.currentWorld.stability + 15);
        }
        
        // Check if we've collected all fragments in this dream
        const remainingFragments = this.currentWorld.fragments.filter(f => !f.collected);
        if (remainingFragments.length === 0) {
            this.completeDream();
        }
    }
    
    onNarrativeDiscovered(detail) {
        console.log('Narrative discovered:', detail.narrative.result);
        
        // Show narrative modal
        this.showNarrativeModal(
            detail.narrative.narrative,
            [
                { text: "Continue exploring", action: () => this.hideNarrativeModal() },
                { text: "Reflect deeply", action: () => this.deepReflection(detail.narrative) }
            ]
        );
        
        // Update player identity progress
        this.playerIdentityProgress += 10;
        this.checkIdentityRevelation();
    }
    
    completeDream() {
        console.log('Dream completed - all fragments collected');
        
        // Show completion modal
        this.showNarrativeModal(
            `You have successfully extracted all memory fragments from ${this.currentDreamer.name}'s dream. Their subconscious accepts your presence as you gather the essence of their inner world.`,
            [
                { text: "Exit dream", action: () => this.exitCurrentDream() },
                { text: "Explore more", action: () => this.hideNarrativeModal() }
            ]
        );
        
        // Bonus stability for completion
        if (this.currentWorld) {
            this.currentWorld.stability = 100;
        }
    }
    
    exitCurrentDream() {
        this.player.exitDream();
        this.clearCurrentWorld();
        this.currentWorld = null;
        this.hideGameHUD();
        
        // Return to dreamer selection or show next dreamer
        this.selectNextDreamer();
    }
    
    selectNextDreamer() {
        const availableDreamers = this.dreamers.filter(d => d !== this.currentDreamer);
        
        if (availableDreamers.length > 0) {
            this.showDreamerSelection(availableDreamers);
        } else {
            // All dreamers explored - show ending
            this.showGameEnding();
        }
    }
    
    showDreamerSelection(dreamers) {
        // Create dreamer selection UI
        const selectionHTML = dreamers.map((dreamer, index) => `
            <div class="dreamer-card" data-dreamer="${index}">
                <h3>${dreamer.name}</h3>
                <p class="dreamer-age">Age: ${dreamer.age}</p>
                <p class="dreamer-personality">${dreamer.personality.charAt(0).toUpperCase() + dreamer.personality.slice(1)} • ${dreamer.emotionalState}</p>
                <p class="dreamer-backstory">${dreamer.backstory}</p>
            </div>
        `).join('');
        
        this.showNarrativeModal(
            `Choose your next dreamer. Each mind holds different secrets, different architectures of memory and emotion.`,
            [],
            selectionHTML
        );
        
        // Add click handlers for dreamer selection
        document.querySelectorAll('.dreamer-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.currentDreamer = dreamers[index];
                this.hideNarrativeModal();
                this.enterDream(this.currentDreamer);
            });
        });
    }
    
    checkIdentityRevelation() {
        const milestones = [50, 100, 150, 200];
        const revelations = [
            "You begin to sense echoes of your own past in the fragments you collect.",
            "The boundaries between your identity and theirs start to blur.",
            "Memories that feel strangely familiar surface in your consciousness.",
            "The truth about your own nature as a Dream Dealer becomes clear."
        ];
        
        milestones.forEach((milestone, index) => {
            if (this.playerIdentityProgress >= milestone && !this.hasSeenRevelation(milestone)) {
                this.showIdentityRevelation(revelations[index]);
                this.markRevelationSeen(milestone);
            }
        });
    }
    
    // UI Management Methods
    showScreen(screenId) {
        this.hideAllScreens();
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    showMainMenu() {
        this.gameState = 'menu';
        this.showScreen('main-menu');
    }
    
    showGameHUD() {
        document.getElementById('game-hud')?.classList.remove('hidden');
        document.getElementById('controls-help')?.classList.remove('hidden');
    }
    
    hideGameHUD() {
        document.getElementById('game-hud')?.classList.add('hidden');
        document.getElementById('controls-help')?.classList.add('hidden');
    }
    
    updateLoadingProgress(percent) {
        const fill = document.querySelector('.loading-fill');
        if (fill) {
            fill.style.width = `${percent}%`;
        }
    }
    
    updateLoadingText(text) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
    
    updateFragmentCounter() {
        const counter = document.getElementById('fragment-count');
        if (counter) {
            counter.textContent = this.fragmentSystem.getFragmentCount();
        }
    }
    
    updateDreamerInfo(dreamer) {
        const nameEl = document.getElementById('dreamer-name');
        if (nameEl) {
            nameEl.textContent = dreamer.name;
        }
    }
    
    showFragmentPreview(fragment) {
        const preview = document.getElementById('fragment-preview');
        const title = document.getElementById('fragment-title');
        const description = document.getElementById('fragment-description');
        
        if (preview && title && description) {
            title.textContent = fragment.title;
            description.textContent = fragment.description;
            preview.classList.remove('hidden');
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                preview.classList.add('hidden');
            }, 3000);
        }
    }
    
    showInteractionPrompt(fragment) {
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) {
            prompt.classList.remove('hidden');
        }
    }
    
    hideInteractionPrompt() {
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) {
            prompt.classList.add('hidden');
        }
    }
    
    showNarrativeModal(text, choices = [], customHTML = '') {
        const modal = document.getElementById('narrative-modal');
        const textEl = document.getElementById('narrative-text');
        const choicesEl = document.getElementById('narrative-choices');
        
        if (modal && textEl && choicesEl) {
            textEl.innerHTML = customHTML ? `${text}<div class="custom-content">${customHTML}</div>` : text;
            
            choicesEl.innerHTML = choices.map(choice => 
                `<button class="choice-btn" onclick="(${choice.action.toString()})()">${choice.text}</button>`
            ).join('');
            
            modal.classList.remove('hidden');
        }
    }
    
    hideNarrativeModal() {
        const modal = document.getElementById('narrative-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    toggleJournal() {
        const journal = document.getElementById('journal');
        if (journal) {
            journal.classList.toggle('hidden');
            if (!journal.classList.contains('hidden')) {
                this.updateJournalContent();
            }
        }
    }
    
    hideJournal() {
        const journal = document.getElementById('journal');
        if (journal) {
            journal.classList.add('hidden');
        }
    }
    
    updateJournalContent() {
        // Update fragments tab
        this.updateFragmentsTab();
        // Update dreamers tab
        this.updateDreamersTab();
        // Update realm tab
        this.updateRealmTab();
    }
    
    updateFragmentsTab() {
        const grid = document.getElementById('fragment-grid');
        if (grid) {
            const fragments = this.fragmentSystem.getCollectedFragments();
            grid.innerHTML = fragments.map(fragment => `
                <div class="fragment-item" data-fragment-id="${fragment.id}">
                    <h4>${fragment.title}</h4>
                    <p class="fragment-type">${fragment.type}</p>
                    <p class="fragment-description">${fragment.description}</p>
                    <div class="fragment-meta">
                        <span class="fragment-dreamer">From: ${fragment.dreamer}</span>
                        <span class="fragment-power">Power: ${fragment.powerLevel}</span>
                    </div>
                </div>
            `).join('');
        }
    }
    
    updateDreamersTab() {
        const list = document.getElementById('dreamer-list');
        if (list) {
            list.innerHTML = this.dreamers.map(dreamer => `
                <div class="dreamer-profile">
                    <h4>${dreamer.name}</h4>
                    <p class="dreamer-details">Age: ${dreamer.age} • ${dreamer.personality} • ${dreamer.emotionalState}</p>
                    <p class="dreamer-backstory">${dreamer.backstory}</p>
                    <div class="memory-count">Memories: ${dreamer.memories.length}</div>
                </div>
            `).join('');
        }
    }
    
    updateRealmTab() {
        const builder = document.getElementById('realm-builder');
        if (builder) {
            const realm = this.fragmentSystem.getPlayerRealm();
            builder.innerHTML = `
                <div class="realm-stats">
                    <h4>Your Dream Realm</h4>
                    <p>Evolution Level: ${realm.evolution}</p>
                    <p>Atmosphere: ${realm.atmosphere}</p>
                    <p>Structures: ${realm.structures.length}</p>
                </div>
                <div class="realm-structures">
                    ${realm.structures.map(structure => `
                        <div class="structure-item">
                            <h5>${structure.type.replace('_', ' ').toUpperCase()}</h5>
                            <p>Intensity: ${structure.intensity.toFixed(1)}</p>
                            <p>Fragment: ${structure.fragment.title}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const targetContent = document.getElementById(`${tabName}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Add active class to clicked tab button
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // Play interaction sound
        this.audioManager.playInteractionSound();
    }
    
    continueGame() {
        // TODO: Implement save/load system
        alert('Save/Load system not yet implemented. Starting new game instead.');
        this.startNewGame();
    }
    
    showSettings() {
        // TODO: Implement settings modal
        alert('Settings panel not yet implemented.');
    }
    
    showAbout() {
        this.showNarrativeModal(
            `<h3>Dream Dealer</h3>
            <p>A surreal, first-person exploration game where you are a mysterious entity who enters people's dreams to extract fragments of their memories, emotions, and fantasies.</p>
            <p>Created as a demonstration of procedural dream world generation, narrative discovery mechanics, and emotional storytelling through interactive media.</p>
            <p><strong>Controls:</strong><br>
            WASD - Move<br>
            Mouse - Look around<br>
            E - Interact/Extract fragment<br>
            J - Open journal<br>
            ESC - Pause</p>`,
            [{ text: "Close", action: () => this.hideNarrativeModal() }]
        );
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showNarrativeModal(
                "Game Paused",
                [
                    { text: "Resume", action: () => this.resumeGame() },
                    { text: "Settings", action: () => this.showSettings() },
                    { text: "Main Menu", action: () => this.returnToMainMenu() }
                ]
            );
        }
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.hideNarrativeModal();
        
        // Request pointer lock again
        this.engine.canvas.requestPointerLock();
    }
    
    returnToMainMenu() {
        this.gameState = 'menu';
        this.player.exitDream();
        this.clearCurrentWorld();
        this.currentWorld = null;
        this.hideGameHUD();
        this.hideNarrativeModal();
        this.audioManager.stopCurrentAmbient();
        this.showMainMenu();
    }
    
    onPlayerRespawned() {
        console.log('Player respawned');
        // Could add respawn effects or penalties here
    }
    
    deepReflection(narrative) {
        this.hideNarrativeModal();
        
        // Add some bonus identity progress for deep reflection
        this.playerIdentityProgress += 5;
        
        // Show a more philosophical narrative
        setTimeout(() => {
            this.showNarrativeModal(
                `You pause to deeply contemplate the meaning of "${narrative.result}". In the silence of reflection, the boundaries between yourself and the dreamer's experiences become even more blurred. What fragments of yourself do you leave behind in their dreams?`,
                [{ text: "Continue", action: () => this.hideNarrativeModal() }]
            );
        }, 1000);
    }
    
    showIdentityRevelation(revelation) {
        this.showNarrativeModal(
            `<div class="identity-revelation">${revelation}</div>`,
            [{ text: "Accept this truth", action: () => this.hideNarrativeModal() }]
        );
    }
    
    hasSeenRevelation(milestone) {
        // Simple check - in a full game this would use save data
        return window.localStorage.getItem(`revelation_${milestone}`) === 'seen';
    }
    
    markRevelationSeen(milestone) {
        window.localStorage.setItem(`revelation_${milestone}`, 'seen');
    }
    
    showGameEnding() {
        this.gameState = 'ending';
        this.hideGameHUD();
        
        this.showNarrativeModal(
            `You have journeyed through the dreams of all the subjects, collecting fragments of their innermost selves. As you hold these pieces of human experience, you begin to understand your own nature as a Dream Dealer - a being caught between the conscious and unconscious worlds, forever seeking to understand the mystery of identity through the dreams of others.
            
            <div class="ending-stats">
                <p>Dreams Explored: ${this.totalDreamsExplored}</p>
                <p>Fragments Collected: ${this.fragmentSystem.getFragmentCount()}</p>
                <p>Narratives Discovered: ${this.fragmentSystem.getDiscoveredNarratives().length}</p>
                <p>Realm Evolution: ${this.fragmentSystem.getRealmEvolution()}</p>
            </div>
            
            The dreams you've experienced will forever echo in your consciousness, and the realm you've built from their fragments stands as a testament to the complexity of the human mind.`,
            [
                { text: "Start New Journey", action: () => this.startNewGame() },
                { text: "Return to Menu", action: () => this.returnToMainMenu() }
            ]
        );
    }
    
    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showError(message) {
        console.error(message);
        alert(message); // Simple error display for now
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.dreamDealerGame = new DreamDealerGame();
});