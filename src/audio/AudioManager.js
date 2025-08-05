import { Howl, Howler } from 'howler';
import * as THREE from 'three';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.listener = null;
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.currentMusic = null;
        this.ambientSounds = new Map();
        
        // Audio categories
        this.categories = {
            master: { volume: 1.0, muted: false },
            music: { volume: 0.7, muted: false },
            sfx: { volume: 0.8, muted: false },
            voice: { volume: 1.0, muted: false },
            ambient: { volume: 0.6, muted: false },
            ui: { volume: 0.8, muted: false }
        };
        
        // 3D Audio settings
        this.spatialSettings = {
            rolloffFactor: 1,
            refDistance: 1,
            maxDistance: 100,
            distanceModel: 'inverse'
        };
        
        // Dynamic music system
        this.musicState = {
            currentTrack: null,
            intensity: 0, // 0-1 scale
            location: 'outdoor', // outdoor, indoor, underground, etc.
            timeOfDay: 'day', // day, night, dawn, dusk
            weather: 'clear' // clear, rain, storm, fog
        };
        
        // Audio pools for performance
        this.soundPools = new Map();
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Set up Howler global settings
            Howler.autoSuspend = false;
            Howler.html5PoolSize = 10;
            
            // Set up 3D listener
            this.setupSpatialAudio();
            
            console.log('🔊 AudioManager initialized');
            
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
        }
    }
    
    setupSpatialAudio() {
        // Set up Howler 3D settings
        Howler.orientation(0, 0, -1, 0, 1, 0);
        Howler.pos(0, 0, 0);
    }
    
    // Sound loading and management
    async loadSound(id, src, options = {}) {
        const soundOptions = {
            src: Array.isArray(src) ? src : [src],
            html5: options.streaming || false,
            loop: options.loop || false,
            volume: options.volume || 1.0,
            preload: options.preload !== false,
            spatial: options.spatial || false,
            ...options
        };
        
        const sound = new Howl(soundOptions);
        
        return new Promise((resolve, reject) => {
            sound.once('load', () => {
                this.sounds.set(id, sound);
                console.log(`🎵 Sound loaded: ${id}`);
                resolve(sound);
            });
            
            sound.once('loaderror', (id, error) => {
                console.error(`Failed to load sound ${id}:`, error);
                reject(error);
            });
        });
    }
    
    // Play 2D sound
    playSound(id, options = {}) {
        const sound = this.sounds.get(id);
        if (!sound) {
            console.warn(`Sound not found: ${id}`);
            return null;
        }
        
        const category = options.category || 'sfx';
        const categorySettings = this.categories[category];
        const volume = (options.volume || 1.0) * categorySettings.volume * this.categories.master.volume;
        
        if (categorySettings.muted || this.categories.master.muted) {
            return null;
        }
        
        const soundId = sound.play();
        sound.volume(volume, soundId);
        
        if (options.fade) {
            sound.fade(0, volume, options.fade.duration || 1000, soundId);
        }
        
        return soundId;
    }
    
    // Play 3D positioned sound
    play3DSound(id, position, options = {}) {
        const sound = this.sounds.get(id);
        if (!sound) {
            console.warn(`Sound not found: ${id}`);
            return null;
        }
        
        const category = options.category || 'sfx';
        const categorySettings = this.categories[category];
        const volume = (options.volume || 1.0) * categorySettings.volume * this.categories.master.volume;
        
        if (categorySettings.muted || this.categories.master.muted) {
            return null;
        }
        
        const soundId = sound.play();
        
        // Set 3D position
        sound.pos(position.x, position.y, position.z, soundId);
        sound.volume(volume, soundId);
        
        // Set 3D properties
        const refDistance = options.refDistance || this.spatialSettings.refDistance;
        const maxDistance = options.maxDistance || this.spatialSettings.maxDistance;
        const rolloffFactor = options.rolloffFactor || this.spatialSettings.rolloffFactor;
        
        sound.pannerAttr({
            panningModel: 'HRTF',
            refDistance: refDistance,
            rolloffFactor: rolloffFactor,
            maxDistance: maxDistance,
            distanceModel: this.spatialSettings.distanceModel
        }, soundId);
        
        return soundId;
    }
    
    // Stop sound
    stopSound(id, soundId = null) {
        const sound = this.sounds.get(id);
        if (sound) {
            if (soundId) {
                sound.stop(soundId);
            } else {
                sound.stop();
            }
        }
    }
    
    // Pause/Resume
    pauseSound(id, soundId = null) {
        const sound = this.sounds.get(id);
        if (sound) {
            if (soundId) {
                sound.pause(soundId);
            } else {
                sound.pause();
            }
        }
    }
    
    resumeSound(id, soundId = null) {
        const sound = this.sounds.get(id);
        if (sound) {
            if (soundId) {
                sound.play(soundId);
            } else {
                sound.play();
            }
        }
    }
    
    // Music system
    async loadMusic(id, src, options = {}) {
        const musicOptions = {
            src: Array.isArray(src) ? src : [src],
            html5: true, // Use HTML5 for streaming
            loop: options.loop !== false,
            volume: options.volume || 0.7,
            preload: options.preload !== false,
            ...options
        };
        
        const music = new Howl(musicOptions);
        
        return new Promise((resolve, reject) => {
            music.once('load', () => {
                this.musicTracks.set(id, music);
                console.log(`🎼 Music loaded: ${id}`);
                resolve(music);
            });
            
            music.once('loaderror', (id, error) => {
                console.error(`Failed to load music ${id}:`, error);
                reject(error);
            });
        });
    }
    
    playMusic(id, options = {}) {
        const music = this.musicTracks.get(id);
        if (!music) {
            console.warn(`Music not found: ${id}`);
            return;
        }
        
        // Stop current music
        if (this.currentMusic && this.currentMusic !== music) {
            this.stopMusic(options.fadeOut || 1000);
        }
        
        const volume = (options.volume || 0.7) * this.categories.music.volume * this.categories.master.volume;
        
        if (this.categories.music.muted || this.categories.master.muted) {
            return;
        }
        
        const musicId = music.play();
        music.volume(volume, musicId);
        
        if (options.fadeIn) {
            music.fade(0, volume, options.fadeIn, musicId);
        }
        
        this.currentMusic = music;
        this.musicState.currentTrack = id;
        
        console.log(`🎵 Playing music: ${id}`);
    }
    
    stopMusic(fadeOut = 0) {
        if (this.currentMusic) {
            if (fadeOut > 0) {
                this.currentMusic.fade(this.currentMusic.volume(), 0, fadeOut);
                setTimeout(() => {
                    if (this.currentMusic) {
                        this.currentMusic.stop();
                        this.currentMusic = null;
                        this.musicState.currentTrack = null;
                    }
                }, fadeOut);
            } else {
                this.currentMusic.stop();
                this.currentMusic = null;
                this.musicState.currentTrack = null;
            }
        }
    }
    
    // Dynamic music system
    updateMusicState(state) {
        this.musicState = { ...this.musicState, ...state };
        this.selectAppropriateMusic();
    }
    
    selectAppropriateMusic() {
        const { intensity, location, timeOfDay, weather } = this.musicState;
        
        // Define music selection logic
        let trackId = null;
        
        if (intensity > 0.8) {
            trackId = 'battle_intense';
        } else if (intensity > 0.5) {
            trackId = 'battle_medium';
        } else if (location === 'indoor') {
            trackId = 'ambient_indoor';
        } else if (timeOfDay === 'night') {
            trackId = 'ambient_night';
        } else if (weather === 'rain') {
            trackId = 'ambient_rain';
        } else {
            trackId = 'ambient_day';
        }
        
        // Switch music if different
        if (trackId && trackId !== this.musicState.currentTrack) {
            this.playMusic(trackId, { fadeIn: 2000, fadeOut: 2000 });
        }
    }
    
    // Ambient sound system
    playAmbientSound(id, options = {}) {
        const sound = this.sounds.get(id);
        if (!sound) {
            console.warn(`Ambient sound not found: ${id}`);
            return;
        }
        
        const volume = (options.volume || 0.6) * this.categories.ambient.volume * this.categories.master.volume;
        
        if (this.categories.ambient.muted || this.categories.master.muted) {
            return;
        }
        
        const soundId = sound.play();
        sound.volume(volume, soundId);
        sound.loop(true, soundId);
        
        this.ambientSounds.set(id, { sound, soundId });
        
        if (options.fadeIn) {
            sound.fade(0, volume, options.fadeIn, soundId);
        }
    }
    
    stopAmbientSound(id, fadeOut = 0) {
        const ambient = this.ambientSounds.get(id);
        if (ambient) {
            const { sound, soundId } = ambient;
            
            if (fadeOut > 0) {
                sound.fade(sound.volume(soundId), 0, fadeOut, soundId);
                setTimeout(() => {
                    sound.stop(soundId);
                    this.ambientSounds.delete(id);
                }, fadeOut);
            } else {
                sound.stop(soundId);
                this.ambientSounds.delete(id);
            }
        }
    }
    
    // 3D Audio listener update
    updateListener(position, forward, up) {
        if (this.audioContext && this.audioContext.listener) {
            // Update Howler listener
            Howler.pos(position.x, position.y, position.z);
            Howler.orientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
        }
    }
    
    // Update 3D sound positions
    updateSoundPosition(id, soundId, position) {
        const sound = this.sounds.get(id);
        if (sound && soundId) {
            sound.pos(position.x, position.y, position.z, soundId);
        }
    }
    
    // Sound pools for frequent sounds
    createSoundPool(id, poolSize = 5) {
        const baseSound = this.sounds.get(id);
        if (!baseSound) {
            console.warn(`Cannot create pool for non-existent sound: ${id}`);
            return;
        }
        
        const pool = [];
        for (let i = 0; i < poolSize; i++) {
            // Create copies of the sound
            const soundCopy = new Howl({
                src: baseSound._src,
                volume: baseSound._volume,
                loop: baseSound._loop
            });
            pool.push({ sound: soundCopy, inUse: false });
        }
        
        this.soundPools.set(id, pool);
        console.log(`🎵 Created sound pool for ${id} with ${poolSize} instances`);
    }
    
    playPooledSound(id, options = {}) {
        const pool = this.soundPools.get(id);
        if (!pool) {
            // Fallback to regular sound
            return this.playSound(id, options);
        }
        
        // Find available sound in pool
        const availableSound = pool.find(item => !item.inUse);
        if (!availableSound) {
            console.warn(`No available sounds in pool for: ${id}`);
            return null;
        }
        
        availableSound.inUse = true;
        const soundId = availableSound.sound.play();
        
        // Mark as available when sound ends
        availableSound.sound.once('end', () => {
            availableSound.inUse = false;
        }, soundId);
        
        return soundId;
    }
    
    // Volume and settings
    setMasterVolume(volume) {
        this.categories.master.volume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    
    setCategoryVolume(category, volume) {
        if (this.categories[category]) {
            this.categories[category].volume = Math.max(0, Math.min(1, volume));
            this.updateCategoryVolumes(category);
        }
    }
    
    muteMaster(muted = true) {
        this.categories.master.muted = muted;
        if (muted) {
            Howler.mute(true);
        } else {
            Howler.mute(false);
        }
    }
    
    muteCategory(category, muted = true) {
        if (this.categories[category]) {
            this.categories[category].muted = muted;
            this.updateCategoryVolumes(category);
        }
    }
    
    updateAllVolumes() {
        // Update all sound volumes
        this.sounds.forEach(sound => {
            // This would need to track which category each sound belongs to
            // For now, just update based on master volume
            const currentVolume = sound.volume();
            sound.volume(currentVolume * this.categories.master.volume);
        });
    }
    
    updateCategoryVolumes(category) {
        // Implementation would depend on tracking which sounds belong to which category
        // This is a simplified version
        if (category === 'music' && this.currentMusic) {
            const volume = this.categories.music.volume * this.categories.master.volume;
            if (!this.categories.music.muted && !this.categories.master.muted) {
                this.currentMusic.volume(volume);
            }
        }
    }
    
    // Audio effects
    applyReverbEffect(id, reverbSettings) {
        // This would require Web Audio API integration
        // Simplified placeholder
        console.log(`Applying reverb to ${id}:`, reverbSettings);
    }
    
    applyLowPassFilter(id, frequency) {
        // Placeholder for audio filtering
        console.log(`Applying low-pass filter to ${id} at ${frequency}Hz`);
    }
    
    // Environment audio
    setAudioEnvironment(environment) {
        const environments = {
            'indoor': {
                reverb: { roomSize: 0.3, damping: 0.8 },
                filter: { type: 'lowpass', frequency: 8000 }
            },
            'outdoor': {
                reverb: { roomSize: 0.8, damping: 0.2 },
                filter: null
            },
            'underwater': {
                reverb: { roomSize: 0.9, damping: 0.9 },
                filter: { type: 'lowpass', frequency: 2000 }
            },
            'cave': {
                reverb: { roomSize: 0.95, damping: 0.1 },
                filter: { type: 'bandpass', frequency: 1000 }
            }
        };
        
        const env = environments[environment];
        if (env) {
            console.log(`🌍 Setting audio environment: ${environment}`);
            // Apply environment effects to active sounds
        }
    }
    
    // Cleanup
    dispose() {
        // Stop all sounds
        this.sounds.forEach(sound => sound.stop());
        this.musicTracks.forEach(music => music.stop());
        
        // Clear maps
        this.sounds.clear();
        this.musicTracks.clear();
        this.ambientSounds.clear();
        this.soundPools.clear();
        
        // Unload Howler
        Howler.unload();
        
        console.log('🔇 AudioManager disposed');
    }
    
    // Save/load settings
    applySettings(settings) {
        if (settings.masterVolume !== undefined) {
            this.setMasterVolume(settings.masterVolume);
        }
        
        Object.entries(settings).forEach(([key, value]) => {
            if (key.endsWith('Volume') && key !== 'masterVolume') {
                const category = key.replace('Volume', '');
                this.setCategoryVolume(category, value);
            }
            
            if (key.endsWith('Muted')) {
                const category = key.replace('Muted', '');
                this.muteCategory(category, value);
            }
        });
    }
    
    getSettings() {
        const settings = {};
        Object.entries(this.categories).forEach(([category, data]) => {
            settings[`${category}Volume`] = data.volume;
            settings[`${category}Muted`] = data.muted;
        });
        return settings;
    }
    
    // Statistics
    getStats() {
        return {
            loadedSounds: this.sounds.size,
            loadedMusic: this.musicTracks.size,
            activeAmbient: this.ambientSounds.size,
            soundPools: this.soundPools.size,
            currentMusic: this.musicState.currentTrack,
            masterVolume: this.categories.master.volume,
            masterMuted: this.categories.master.muted
        };
    }
}