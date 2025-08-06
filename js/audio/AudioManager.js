class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.effectsGain = null;
        
        this.isInitialized = false;
        this.isMuted = false;
        this.masterVolume = 0.7;
        this.ambientVolume = 0.5;
        this.effectsVolume = 0.8;
        
        // Audio sources
        this.ambientSources = new Map();
        this.currentAmbient = null;
        
        // Audio data for procedural generation
        this.oscillators = new Map();
        this.noiseBuffers = new Map();
        
        console.log('Audio Manager created (will initialize on user interaction)');
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create ambient gain
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.gain.value = this.ambientVolume;
            this.ambientGain.connect(this.masterGain);
            
            // Create effects gain
            this.effectsGain = this.audioContext.createGain();
            this.effectsGain.gain.value = this.effectsVolume;
            this.effectsGain.connect(this.masterGain);
            
            // Generate procedural audio content
            await this.generateAudioContent();
            
            this.isInitialized = true;
            console.log('Audio Manager initialized');
            
        } catch (error) {
            console.warn('Failed to initialize audio:', error);
        }
    }
    
    async generateAudioContent() {
        // Generate different ambient soundscapes for each dream type
        const dreamTypes = [
            'floating_city',
            'crystal_cavern', 
            'shadow_realm',
            'twisted_cathedral',
            'memory_garden'
        ];
        
        for (const dreamType of dreamTypes) {
            await this.generateAmbientForDreamType(dreamType);
        }
        
        // Generate UI sounds
        this.generateUIFounds();
    }
    
    async generateAmbientForDreamType(dreamType) {
        if (!this.audioContext) return;
        
        const duration = 30; // 30 second loops
        const sampleRate = this.audioContext.sampleRate;
        const bufferLength = duration * sampleRate;
        
        const buffer = this.audioContext.createBuffer(2, bufferLength, sampleRate);
        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);
        
        // Generate ambient soundscape based on dream type
        for (let i = 0; i < bufferLength; i++) {
            const time = i / sampleRate;
            let sample = 0;
            
            switch (dreamType) {
                case 'floating_city':
                    sample = this.generateFloatingCityAmbient(time);
                    break;
                case 'crystal_cavern':
                    sample = this.generateCrystalCavernAmbient(time);
                    break;
                case 'shadow_realm':
                    sample = this.generateShadowRealmAmbient(time);
                    break;
                case 'twisted_cathedral':
                    sample = this.generateCathedralAmbient(time);
                    break;
                case 'memory_garden':
                    sample = this.generateGardenAmbient(time);
                    break;
            }
            
            leftChannel[i] = sample;
            rightChannel[i] = sample * 0.9; // Slight stereo separation
        }
        
        this.ambientSources.set(dreamType, buffer);
    }
    
    generateFloatingCityAmbient(time) {
        // Ethereal wind sounds with distant chimes
        const wind = Math.sin(time * 0.1) * 0.1 * this.noise(time * 5);
        const chimes = Math.sin(time * 2 + Math.sin(time * 0.3) * 3) * 0.05 * 
                     Math.exp(-((time % 8) - 1) * 2);
        const harmony = Math.sin(time * 0.7) * 0.03;
        
        return wind + chimes + harmony;
    }
    
    generateCrystalCavernAmbient(time) {
        // Crystal resonance and dripping
        const resonance = Math.sin(time * 1.618) * 0.08 * 
                         Math.sin(time * 0.1) * Math.sin(time * 0.05);
        const drips = Math.sin(time * 3 + Math.sin(time * 0.2) * 10) * 0.03 *
                     Math.exp(-((time % 5) - 0.1) * 20);
        const undertone = Math.sin(time * 0.3) * 0.02;
        
        return resonance + drips + undertone;
    }
    
    generateShadowRealmAmbient(time) {
        // Dark, whispered tones with unsettling harmonics
        const whispers = this.noise(time * 10) * 0.05 * Math.sin(time * 0.1);
        const lowDrone = Math.sin(time * 0.2) * 0.08;
        const disturbing = Math.sin(time * 1.3 + Math.sin(time * 0.07) * 2) * 0.03;
        
        return whispers + lowDrone + disturbing;
    }
    
    generateCathedralAmbient(time) {
        // Organ-like tones with reverb simulation
        const organ = Math.sin(time * 0.8) * 0.06 + 
                     Math.sin(time * 1.2) * 0.04 +
                     Math.sin(time * 1.6) * 0.03;
        const reverb = organ * 0.3 * Math.sin(time * 0.05);
        const echo = Math.sin(time * 0.8 - 0.5) * 0.02;
        
        return organ + reverb + echo;
    }
    
    generateGardenAmbient(time) {
        // Nature sounds with musical elements
        const birds = Math.sin(time * 4 + Math.sin(time * 0.8) * 2) * 0.04 *
                     Math.exp(-((time % 6) - 1) * 1.5);
        const breeze = this.noise(time * 3) * 0.03 * Math.sin(time * 0.2);
        const melody = Math.sin(time * 1.414) * 0.02;
        
        return birds + breeze + melody;
    }
    
    generateUIFounds() {
        // Simple UI sound effects using oscillators
        // These will be generated on-demand
    }
    
    // Simple noise function for procedural audio
    noise(x) {
        const i = Math.floor(x);
        const f = x - i;
        const a = this.hash(i);
        const b = this.hash(i + 1);
        return a * (1 - f) + b * f;
    }
    
    hash(x) {
        x = ((x >> 16) ^ x) * 0x45d9f3b;
        x = ((x >> 16) ^ x) * 0x45d9f3b;
        x = (x >> 16) ^ x;
        return (x % 1000000) / 1000000 - 0.5;
    }
    
    // Public methods
    playAmbientForDreamType(dreamType) {
        if (!this.isInitialized || this.isMuted) return;
        
        this.stopCurrentAmbient();
        
        const buffer = this.ambientSources.get(dreamType);
        if (!buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(this.ambientGain);
        source.start();
        
        this.currentAmbient = source;
        
        // Fade in
        this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(
            this.ambientVolume, 
            this.audioContext.currentTime + 2
        );
        
        console.log(`Playing ambient for ${dreamType}`);
    }
    
    stopCurrentAmbient() {
        if (this.currentAmbient) {
            // Fade out
            this.ambientGain.gain.linearRampToValueAtTime(
                0, 
                this.audioContext.currentTime + 1
            );
            
            setTimeout(() => {
                if (this.currentAmbient) {
                    this.currentAmbient.stop();
                    this.currentAmbient = null;
                }
            }, 1000);
        }
    }
    
    playFragmentCollectionSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // Beautiful, mystical sound for fragment collection
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        
        oscillator.connect(gain);
        gain.connect(this.effectsGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.5);
    }
    
    playInteractionSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // Subtle interaction feedback
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = 220;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gain);
        gain.connect(this.effectsGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    playDreamTransitionSound() {
        if (!this.isInitialized || this.isMuted) return;
        
        // Sweeping transition sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sawtooth';
        
        oscillator1.frequency.setValueAtTime(100, this.audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 2);
        
        oscillator2.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 2);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
        
        oscillator1.connect(gain);
        oscillator2.connect(gain);
        gain.connect(this.effectsGain);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 2);
        oscillator2.stop(this.audioContext.currentTime + 2);
    }
    
    // Volume controls
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        if (this.ambientGain) {
            this.ambientGain.gain.value = this.ambientVolume;
        }
    }
    
    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume));
        if (this.effectsGain) {
            this.effectsGain.gain.value = this.effectsVolume;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
        }
        
        return this.isMuted;
    }
    
    // Resume audio context if suspended (required by some browsers)
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    // Cleanup
    dispose() {
        this.stopCurrentAmbient();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.ambientSources.clear();
        this.oscillators.clear();
        this.noiseBuffers.clear();
    }
}

// Export for use in other modules
window.AudioManager = AudioManager;