class FragmentSystem {
    constructor() {
        this.collectedFragments = [];
        this.fragmentCombinations = new Map();
        this.discoveredNarratives = [];
        this.playerRealm = {
            structures: [],
            atmosphere: 'neutral',
            evolution: 0
        };
        
        // Fragment type definitions
        this.fragmentTypes = {
            memory: {
                color: 0xee5a6f,
                emissive: 0x331122,
                power: 1.0
            },
            emotion: {
                color: 0x6a4c93,
                emissive: 0x1a0f2e,
                power: 1.5
            },
            fear: {
                color: 0x9c27b0,
                emissive: 0x2e0a3f,
                power: 2.0
            },
            desire: {
                color: 0xe91e63,
                emissive: 0x3f0a1e,
                power: 1.8
            },
            secret: {
                color: 0x2e86de,
                emissive: 0x0a1e3f,
                power: 2.5
            }
        };
        
        // Combination patterns for creating new narrative elements
        this.initializeCombinations();
        
        console.log('Fragment System initialized');
    }
    
    initializeCombinations() {
        // Define how different fragments combine to unlock new content
        this.fragmentCombinations.set('memory+emotion', {
            result: 'emotional_insight',
            narrative: 'A deeper understanding emerges from the intersection of memory and feeling.',
            realmEffect: 'emotional_resonance',
            unlocks: ['empathy_bridge']
        });
        
        this.fragmentCombinations.set('fear+desire', {
            result: 'inner_conflict',
            narrative: 'The tension between what is feared and what is wanted reveals hidden truths.',
            realmEffect: 'shadow_manifestation',
            unlocks: ['conflict_resolution_space']
        });
        
        this.fragmentCombinations.set('memory+memory+emotion', {
            result: 'core_experience',
            narrative: 'Multiple memories coalesce around a central emotional truth.',
            realmEffect: 'memory_palace_expansion',
            unlocks: ['personal_history_chamber']
        });
        
        this.fragmentCombinations.set('secret+emotion+memory', {
            result: 'hidden_truth',
            narrative: 'A long-buried secret finally reveals its emotional significance.',
            realmEffect: 'revelation_space',
            unlocks: ['truth_sanctuary']
        });
        
        this.fragmentCombinations.set('fear+fear+memory', {
            result: 'trauma_integration',
            narrative: 'Confronting multiple fears through the lens of memory brings healing.',
            realmEffect: 'healing_transformation',
            unlocks: ['recovery_garden']
        });
        
        // Meta-combinations for advanced players
        this.fragmentCombinations.set('emotional_insight+inner_conflict', {
            result: 'psychological_balance',
            narrative: 'Understanding both emotion and conflict leads to inner harmony.',
            realmEffect: 'balance_manifestation',
            unlocks: ['harmony_chamber']
        });
    }
    
    collectFragment(fragment, dreamerProfile) {
        const collectedFragment = {
            id: `${dreamerProfile.name}_${Date.now()}`,
            type: fragment.type || 'memory',
            title: fragment.title,
            description: fragment.description,
            emotion: fragment.emotion,
            intensity: fragment.intensity || 0.5,
            dreamer: dreamerProfile.name,
            dreamerPersonality: dreamerProfile.personality,
            collectedAt: new Date(),
            powerLevel: this.calculateFragmentPower(fragment, dreamerProfile)
        };
        
        this.collectedFragments.push(collectedFragment);
        
        // Check for automatic combinations
        this.checkForCombinations();
        
        // Update player realm
        this.updatePlayerRealm(collectedFragment);
        
        // Dispatch events
        window.dispatchEvent(new CustomEvent('fragmentSystemUpdate', {
            detail: {
                fragment: collectedFragment,
                totalFragments: this.collectedFragments.length,
                realmEvolution: this.playerRealm.evolution
            }
        }));
        
        console.log(`Fragment collected: ${collectedFragment.title} (Power: ${collectedFragment.powerLevel})`);
        
        return collectedFragment;
    }
    
    calculateFragmentPower(fragment, dreamerProfile) {
        let basePower = this.fragmentTypes[fragment.type]?.power || 1.0;
        
        // Intensity modifier
        basePower *= (fragment.intensity || 0.5);
        
        // Dreamer personality compatibility
        const personalityMultipliers = {
            creative: { memory: 1.2, emotion: 1.1, desire: 1.3 },
            anxious: { fear: 1.4, emotion: 1.2, secret: 1.1 },
            nostalgic: { memory: 1.5, emotion: 1.3, desire: 1.0 },
            logical: { secret: 1.3, memory: 1.1, fear: 0.9 },
            empathetic: { emotion: 1.4, memory: 1.2, desire: 1.1 }
        };
        
        const personality = dreamerProfile.personality || 'balanced';
        const multiplier = personalityMultipliers[personality]?.[fragment.type] || 1.0;
        
        return Math.round((basePower * multiplier) * 100) / 100;
    }
    
    checkForCombinations() {
        const fragmentsByType = this.groupFragmentsByType();
        
        // Check all possible combinations
        for (const [pattern, combination] of this.fragmentCombinations) {
            if (this.canCreateCombination(pattern, fragmentsByType)) {
                this.createCombination(pattern, combination);
            }
        }
    }
    
    groupFragmentsByType() {
        const groups = {};
        
        this.collectedFragments.forEach(fragment => {
            if (!groups[fragment.type]) {
                groups[fragment.type] = [];
            }
            groups[fragment.type].push(fragment);
        });
        
        return groups;
    }
    
    canCreateCombination(pattern, fragmentsByType) {
        const requiredTypes = pattern.split('+');
        const typeCounts = {};
        
        // Count required types
        requiredTypes.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        // Check if we have enough fragments of each type
        for (const [type, requiredCount] of Object.entries(typeCounts)) {
            const availableCount = fragmentsByType[type]?.length || 0;
            if (availableCount < requiredCount) {
                return false;
            }
        }
        
        return true;
    }
    
    createCombination(pattern, combination) {
        // Check if this combination has already been discovered
        if (this.discoveredNarratives.find(n => n.pattern === pattern)) {
            return;
        }
        
        const newNarrative = {
            id: `narrative_${Date.now()}`,
            pattern: pattern,
            result: combination.result,
            narrative: combination.narrative,
            realmEffect: combination.realmEffect,
            unlocks: combination.unlocks,
            discoveredAt: new Date()
        };
        
        this.discoveredNarratives.push(newNarrative);
        
        // Apply realm effect
        this.applyRealmEffect(combination.realmEffect);
        
        // Unlock new areas/abilities
        combination.unlocks.forEach(unlock => {
            this.unlockRealmFeature(unlock);
        });
        
        // Dispatch narrative discovery event
        window.dispatchEvent(new CustomEvent('narrativeDiscovered', {
            detail: {
                narrative: newNarrative,
                fragments: this.getFragmentsForCombination(pattern)
            }
        }));
        
        console.log(`New narrative discovered: ${combination.result}`);
    }
    
    getFragmentsForCombination(pattern) {
        const requiredTypes = pattern.split('+');
        const usedFragments = [];
        const fragmentsByType = this.groupFragmentsByType();
        
        requiredTypes.forEach(type => {
            const fragment = fragmentsByType[type]?.[0];
            if (fragment) {
                usedFragments.push(fragment);
            }
        });
        
        return usedFragments;
    }
    
    updatePlayerRealm(fragment) {
        // Add new structural elements based on fragment type
        const structureTypes = {
            memory: 'memory_crystal',
            emotion: 'emotion_fountain',
            fear: 'shadow_spire',
            desire: 'desire_garden',
            secret: 'hidden_chamber'
        };
        
        const structureType = structureTypes[fragment.type] || 'memory_crystal';
        
        const newStructure = {
            type: structureType,
            fragment: fragment,
            position: this.findRealmPosition(),
            intensity: fragment.powerLevel,
            createdAt: new Date()
        };
        
        this.playerRealm.structures.push(newStructure);
        
        // Evolve the realm based on total fragment power
        const totalPower = this.collectedFragments.reduce((sum, f) => sum + f.powerLevel, 0);
        this.playerRealm.evolution = Math.floor(totalPower / 10);
        
        // Update atmosphere based on dominant fragment types
        this.updateRealmAtmosphere();
    }
    
    findRealmPosition() {
        // Generate position that doesn't overlap with existing structures
        let attempts = 0;
        while (attempts < 20) {
            const position = {
                x: (Math.random() - 0.5) * 60,
                y: Math.random() * 5,
                z: (Math.random() - 0.5) * 60
            };
            
            const tooClose = this.playerRealm.structures.some(structure => {
                const dx = structure.position.x - position.x;
                const dz = structure.position.z - position.z;
                return Math.sqrt(dx * dx + dz * dz) < 8;
            });
            
            if (!tooClose) {
                return position;
            }
            
            attempts++;
        }
        
        // Fallback position
        return {
            x: (Math.random() - 0.5) * 80,
            y: Math.random() * 8,
            z: (Math.random() - 0.5) * 80
        };
    }
    
    updateRealmAtmosphere() {
        const typeCounts = this.groupFragmentsByType();
        const dominantType = Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a].length > typeCounts[b].length ? a : b
        );
        
        const atmosphereMap = {
            memory: 'nostalgic',
            emotion: 'passionate',
            fear: 'haunting',
            desire: 'yearning',
            secret: 'mysterious'
        };
        
        this.playerRealm.atmosphere = atmosphereMap[dominantType] || 'neutral';
    }
    
    applyRealmEffect(effectType) {
        const effects = {
            emotional_resonance: () => {
                // Enhance emotional fragments' visual effects
                this.playerRealm.structures.forEach(structure => {
                    if (structure.type === 'emotion_fountain') {
                        structure.intensity *= 1.2;
                    }
                });
            },
            shadow_manifestation: () => {
                // Create shadow connections between fear-based structures
                this.playerRealm.shadowConnections = true;
            },
            memory_palace_expansion: () => {
                // Increase the size and complexity of memory structures
                this.playerRealm.expansionLevel = (this.playerRealm.expansionLevel || 0) + 1;
            },
            revelation_space: () => {
                // Unlock secret chambers and hidden areas
                this.playerRealm.hasSecretAreas = true;
            },
            healing_transformation: () => {
                // Transform fear structures into healing spaces
                this.playerRealm.structures.forEach(structure => {
                    if (structure.type === 'shadow_spire') {
                        structure.type = 'healing_spire';
                        structure.transformed = true;
                    }
                });
            },
            balance_manifestation: () => {
                // Create harmonious connections between all structures
                this.playerRealm.harmony = true;
            }
        };
        
        const effect = effects[effectType];
        if (effect) {
            effect();
            console.log(`Realm effect applied: ${effectType}`);
        }
    }
    
    unlockRealmFeature(featureType) {
        if (!this.playerRealm.unlockedFeatures) {
            this.playerRealm.unlockedFeatures = [];
        }
        
        if (!this.playerRealm.unlockedFeatures.includes(featureType)) {
            this.playerRealm.unlockedFeatures.push(featureType);
            
            window.dispatchEvent(new CustomEvent('realmFeatureUnlocked', {
                detail: { feature: featureType }
            }));
            
            console.log(`Realm feature unlocked: ${featureType}`);
        }
    }
    
    // Manual combination system for players
    attemptManualCombination(fragmentIds) {
        const fragments = fragmentIds.map(id => 
            this.collectedFragments.find(f => f.id === id)
        ).filter(f => f);
        
        if (fragments.length < 2) {
            return { success: false, message: 'Need at least 2 fragments to combine' };
        }
        
        // Create pattern from fragment types
        const pattern = fragments.map(f => f.type).sort().join('+');
        const combination = this.fragmentCombinations.get(pattern);
        
        if (combination) {
            this.createCombination(pattern, combination);
            return { 
                success: true, 
                result: combination.result,
                narrative: combination.narrative 
            };
        } else {
            // Experimental combination - create something unique
            return this.createExperimentalCombination(fragments);
        }
    }
    
    createExperimentalCombination(fragments) {
        const experimentalResult = {
            id: `experimental_${Date.now()}`,
            pattern: 'experimental',
            result: 'unique_insight',
            narrative: this.generateExperimentalNarrative(fragments),
            realmEffect: 'experimental_structure',
            discoveredAt: new Date()
        };
        
        this.discoveredNarratives.push(experimentalResult);
        
        // Create unique structure in realm
        const newStructure = {
            type: 'experimental_fusion',
            fragments: fragments,
            position: this.findRealmPosition(),
            intensity: fragments.reduce((sum, f) => sum + f.powerLevel, 0) / fragments.length,
            experimental: true,
            createdAt: new Date()
        };
        
        this.playerRealm.structures.push(newStructure);
        
        return {
            success: true,
            result: experimentalResult.result,
            narrative: experimentalResult.narrative,
            experimental: true
        };
    }
    
    generateExperimentalNarrative(fragments) {
        const narrativeTemplates = [
            "The fragments resonate in unexpected ways, creating new understanding.",
            "A unique synthesis emerges from the combination of disparate memories.",
            "The boundaries between different experiences blur, revealing hidden connections.",
            "Something new is born from the fusion of these emotional echoes."
        ];
        
        return narrativeTemplates[Math.floor(Math.random() * narrativeTemplates.length)];
    }
    
    // Getters for UI and other systems
    getCollectedFragments() {
        return [...this.collectedFragments];
    }
    
    getDiscoveredNarratives() {
        return [...this.discoveredNarratives];
    }
    
    getPlayerRealm() {
        return { ...this.playerRealm };
    }
    
    getFragmentCount() {
        return this.collectedFragments.length;
    }
    
    getRealmEvolution() {
        return this.playerRealm.evolution;
    }
    
    // Save/Load system
    getStateData() {
        return {
            collectedFragments: this.collectedFragments,
            discoveredNarratives: this.discoveredNarratives,
            playerRealm: this.playerRealm
        };
    }
    
    loadStateData(data) {
        if (data.collectedFragments) {
            this.collectedFragments = data.collectedFragments;
        }
        if (data.discoveredNarratives) {
            this.discoveredNarratives = data.discoveredNarratives;
        }
        if (data.playerRealm) {
            this.playerRealm = data.playerRealm;
        }
        
        console.log('Fragment system state loaded');
    }
    
    // Analytics and insights
    getFragmentAnalytics() {
        const byType = this.groupFragmentsByType();
        const byDreamer = {};
        const byEmotion = {};
        
        this.collectedFragments.forEach(fragment => {
            // By dreamer
            if (!byDreamer[fragment.dreamer]) {
                byDreamer[fragment.dreamer] = 0;
            }
            byDreamer[fragment.dreamer]++;
            
            // By emotion
            if (fragment.emotion) {
                if (!byEmotion[fragment.emotion]) {
                    byEmotion[fragment.emotion] = 0;
                }
                byEmotion[fragment.emotion]++;
            }
        });
        
        return {
            totalFragments: this.collectedFragments.length,
            byType: Object.keys(byType).map(type => ({
                type,
                count: byType[type].length,
                totalPower: byType[type].reduce((sum, f) => sum + f.powerLevel, 0)
            })),
            byDreamer: Object.keys(byDreamer).map(dreamer => ({
                dreamer,
                count: byDreamer[dreamer]
            })),
            byEmotion: Object.keys(byEmotion).map(emotion => ({
                emotion,
                count: byEmotion[emotion]
            })),
            narrativesDiscovered: this.discoveredNarratives.length,
            realmEvolution: this.playerRealm.evolution,
            realmStructures: this.playerRealm.structures.length
        };
    }
}

// Export for use in other modules
window.FragmentSystem = FragmentSystem;