class ProceduralGenerator {
    constructor() {
        this.noise = new SimplexNoise();
        this.seed = Math.random() * 1000;
        this.dreamTypes = [
            'floating_city',
            'twisted_cathedral',
            'endless_stairs',
            'mirror_maze',
            'gravity_well',
            'memory_garden',
            'shadow_realm',
            'crystal_cavern'
        ];
        
        // Material presets for different dream aesthetics
        this.materialLibrary = {};
        this.initializeMaterials();
    }
    
    initializeMaterials() {
        // Ethereal glass material
        this.materialLibrary.etherealGlass = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.8,
            opacity: 0.5,
            transparent: true,
            thickness: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        
        // Dream crystal material
        this.materialLibrary.dreamCrystal = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.3,
            roughness: 0.2,
            emissive: 0x332211,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        // Shadow material
        this.materialLibrary.shadowStone = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.0,
            roughness: 0.8,
            emissive: 0x0f0f1a,
            emissiveIntensity: 0.1
        });
        
        // Memory fragment material
        this.materialLibrary.memoryFragment = new THREE.MeshStandardMaterial({
            color: 0xee5a6f,
            metalness: 0.2,
            roughness: 0.3,
            emissive: 0x331122,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        // Floating platform material
        this.materialLibrary.floatingPlatform = new THREE.MeshStandardMaterial({
            color: 0x6a4c93,
            metalness: 0.1,
            roughness: 0.6,
            emissive: 0x1a0f2e,
            emissiveIntensity: 0.1
        });
    }
    
    generateDreamWorld(dreamerProfile, difficulty = 1) {
        const dreamType = this.selectDreamType(dreamerProfile);
        const worldSeed = this.generateSeed(dreamerProfile.name);
        
        console.log(`Generating ${dreamType} for ${dreamerProfile.name}`);
        
        const world = {
            type: dreamType,
            seed: worldSeed,
            objects: [],
            fragments: [],
            lighting: this.generateLighting(dreamType),
            atmosphere: this.generateAtmosphere(dreamType),
            bounds: { min: -100, max: 100 },
            difficulty: difficulty
        };
        
        // Generate world geometry based on dream type
        switch (dreamType) {
            case 'floating_city':
                this.generateFloatingCity(world, dreamerProfile);
                break;
            case 'twisted_cathedral':
                this.generateTwistedCathedral(world, dreamerProfile);
                break;
            case 'endless_stairs':
                this.generateEndlessStairs(world, dreamerProfile);
                break;
            case 'mirror_maze':
                this.generateMirrorMaze(world, dreamerProfile);
                break;
            case 'gravity_well':
                this.generateGravityWell(world, dreamerProfile);
                break;
            case 'memory_garden':
                this.generateMemoryGarden(world, dreamerProfile);
                break;
            case 'shadow_realm':
                this.generateShadowRealm(world, dreamerProfile);
                break;
            case 'crystal_cavern':
                this.generateCrystalCavern(world, dreamerProfile);
                break;
        }
        
        // Add memory fragments to the world
        this.placeMemoryFragments(world, dreamerProfile);
        
        return world;
    }
    
    selectDreamType(dreamerProfile) {
        // Select dream type based on dreamer's personality and emotional state
        const personality = dreamerProfile.personality || 'balanced';
        const emotionalState = dreamerProfile.emotionalState || 'neutral';
        
        const typeWeights = {
            floating_city: 0.1,
            twisted_cathedral: 0.1,
            endless_stairs: 0.1,
            mirror_maze: 0.1,
            gravity_well: 0.1,
            memory_garden: 0.1,
            shadow_realm: 0.1,
            crystal_cavern: 0.3
        };
        
        // Adjust weights based on personality
        if (personality === 'creative') {
            typeWeights.floating_city += 0.3;
            typeWeights.crystal_cavern += 0.2;
        } else if (personality === 'anxious') {
            typeWeights.shadow_realm += 0.3;
            typeWeights.mirror_maze += 0.2;
        } else if (personality === 'nostalgic') {
            typeWeights.memory_garden += 0.4;
            typeWeights.twisted_cathedral += 0.1;
        }
        
        // Weighted random selection
        return this.weightedRandomChoice(typeWeights);
    }
    
    generateFloatingCity(world, dreamer) {
        const platformCount = 15 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < platformCount; i++) {
            const platform = this.createFloatingPlatform(
                (Math.random() - 0.5) * 150,
                Math.random() * 50 + 10,
                (Math.random() - 0.5) * 150,
                5 + Math.random() * 15
            );
            world.objects.push(platform);
            
            // Add connecting bridges occasionally
            if (Math.random() < 0.3 && i > 0) {
                const bridge = this.createEtherealBridge(
                    world.objects[i - 1].position,
                    platform.position
                );
                world.objects.push(bridge);
            }
        }
        
        // Add floating structures
        this.addFloatingStructures(world, 8);
    }
    
    generateTwistedCathedral(world, dreamer) {
        // Central twisted spire
        const spire = this.createTwistedSpire(0, 0, 0, 60);
        world.objects.push(spire);
        
        // Surrounding pillars
        const pillarCount = 12;
        for (let i = 0; i < pillarCount; i++) {
            const angle = (i / pillarCount) * Math.PI * 2;
            const radius = 30 + Math.random() * 20;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const height = 20 + Math.random() * 30;
            
            const pillar = this.createTwistedPillar(x, 0, z, height);
            world.objects.push(pillar);
        }
        
        // Add floating arches
        this.addFloatingArches(world, 6);
    }
    
    generateEndlessStairs(world, dreamer) {
        // Create the illusion of endless stairs using careful positioning
        const stairSets = 20;
        let currentY = 0;
        
        for (let i = 0; i < stairSets; i++) {
            const stairSet = this.createStairSet(
                (Math.random() - 0.5) * 20,
                currentY,
                (Math.random() - 0.5) * 20,
                10 + Math.floor(Math.random() * 5)
            );
            world.objects.push(stairSet);
            currentY += 15;
            
            // Add platforms at intervals
            if (i % 3 === 0) {
                const platform = this.createFloatingPlatform(
                    (Math.random() - 0.5) * 30,
                    currentY,
                    (Math.random() - 0.5) * 30,
                    8
                );
                world.objects.push(platform);
            }
        }
    }
    
    generateCrystalCavern(world, dreamer) {
        // Create cavern walls
        this.createCavernWalls(world);
        
        // Add crystal formations
        const crystalCount = 25 + Math.floor(Math.random() * 15);
        for (let i = 0; i < crystalCount; i++) {
            const crystal = this.createCrystal(
                (Math.random() - 0.5) * 80,
                Math.random() * 5,
                (Math.random() - 0.5) * 80,
                2 + Math.random() * 8
            );
            world.objects.push(crystal);
        }
        
        // Add glowing pools
        this.addGlowingPools(world, 5);
    }
    
    createFloatingPlatform(x, y, z, radius) {
        const geometry = new THREE.CylinderGeometry(radius, radius * 0.8, 2, 8);
        const material = this.materialLibrary.floatingPlatform.clone();
        const platform = new THREE.Mesh(geometry, material);
        
        platform.position.set(x, y, z);
        platform.castShadow = true;
        platform.receiveShadow = true;
        
        // Add slight bobbing animation
        platform.userData = {
            type: 'platform',
            originalY: y,
            bobSpeed: 0.5 + Math.random() * 0.5,
            bobAmount: 0.5 + Math.random() * 1.0
        };
        
        return platform;
    }
    
    createCrystal(x, y, z, height) {
        const geometry = new THREE.ConeGeometry(height * 0.3, height, 6);
        const material = this.materialLibrary.dreamCrystal.clone();
        
        // Add color variation
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 0.7, 0.6);
        material.color = color;
        material.emissive = color.clone().multiplyScalar(0.2);
        
        const crystal = new THREE.Mesh(geometry, material);
        crystal.position.set(x, y + height / 2, z);
        crystal.rotation.y = Math.random() * Math.PI * 2;
        crystal.castShadow = true;
        
        // Add gentle glow animation
        crystal.userData = {
            type: 'crystal',
            glowSpeed: 1 + Math.random(),
            baseEmissive: material.emissiveIntensity
        };
        
        return crystal;
    }
    
    createTwistedSpire(x, y, z, height) {
        const segments = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];
        
        // Create twisted spire geometry
        for (let i = 0; i <= segments; i++) {
            const segmentHeight = (i / segments) * height;
            const twist = (i / segments) * Math.PI * 4;
            const radius = 3 * (1 - i / segments * 0.5);
            
            for (let j = 0; j < 8; j++) {
                const angle = (j / 8) * Math.PI * 2 + twist;
                const px = Math.cos(angle) * radius;
                const pz = Math.sin(angle) * radius;
                positions.push(px, segmentHeight, pz);
            }
        }
        
        // Create faces
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < 8; j++) {
                const a = i * 8 + j;
                const b = i * 8 + ((j + 1) % 8);
                const c = (i + 1) * 8 + j;
                const d = (i + 1) * 8 + ((j + 1) % 8);
                
                indices.push(a, b, c, b, d, c);
            }
        }
        
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.computeVertexNormals();
        
        const material = this.materialLibrary.shadowStone.clone();
        const spire = new THREE.Mesh(geometry, material);
        spire.position.set(x, y, z);
        spire.castShadow = true;
        
        spire.userData = { type: 'spire' };
        
        return spire;
    }
    
    placeMemoryFragments(world, dreamer) {
        const fragmentCount = 3 + Math.floor(Math.random() * 5);
        const fragments = dreamer.memories || this.generateDefaultMemories(dreamer);
        
        for (let i = 0; i < Math.min(fragmentCount, fragments.length); i++) {
            const memory = fragments[i];
            const position = this.findSafeFragmentPosition(world);
            
            const fragment = {
                id: `fragment_${i}`,
                memory: memory,
                position: position,
                collected: false,
                visualObject: this.createFragmentVisual(position, memory)
            };
            
            world.fragments.push(fragment);
            world.objects.push(fragment.visualObject);
        }
    }
    
    createFragmentVisual(position, memory) {
        const geometry = new THREE.OctahedronGeometry(1.5);
        const material = this.materialLibrary.memoryFragment.clone();
        
        // Color based on memory type
        const colorMap = {
            happy: 0xffeb3b,
            sad: 0x2196f3,
            fear: 0x9c27b0,
            love: 0xe91e63,
            anger: 0xf44336,
            peaceful: 0x4caf50
        };
        
        material.color.setHex(colorMap[memory.emotion] || 0xee5a6f);
        material.emissive.setHex(colorMap[memory.emotion] || 0x331122);
        
        const fragment = new THREE.Mesh(geometry, material);
        fragment.position.copy(position);
        fragment.castShadow = true;
        
        fragment.userData = {
            type: 'fragment',
            memory: memory,
            rotationSpeed: 0.5 + Math.random() * 0.5,
            floatSpeed: 0.8 + Math.random() * 0.4,
            floatAmount: 1.0
        };
        
        return fragment;
    }
    
    findSafeFragmentPosition(world) {
        let attempts = 0;
        while (attempts < 50) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 80,
                5 + Math.random() * 30,
                (Math.random() - 0.5) * 80
            );
            
            // Check if position is safe (not too close to other objects)
            let safe = true;
            for (const obj of world.objects) {
                if (obj.position.distanceTo(position) < 5) {
                    safe = false;
                    break;
                }
            }
            
            if (safe) return position;
            attempts++;
        }
        
        // Fallback position
        return new THREE.Vector3(0, 10, 0);
    }
    
    generateDefaultMemories(dreamer) {
        const memories = [
            {
                title: "Childhood Wonder",
                description: "A moment of pure joy from childhood",
                emotion: "happy",
                intensity: 0.8
            },
            {
                title: "Lost Connection",
                description: "Someone important who drifted away",
                emotion: "sad",
                intensity: 0.6
            },
            {
                title: "Hidden Fear",
                description: "An unspoken anxiety",
                emotion: "fear",
                intensity: 0.7
            },
            {
                title: "Peaceful Moment",
                description: "A time of perfect tranquility",
                emotion: "peaceful",
                intensity: 0.5
            }
        ];
        
        return memories;
    }
    
    generateLighting(dreamType) {
        const lightingPresets = {
            floating_city: {
                ambientColor: 0x404060,
                ambientIntensity: 0.4,
                mainColor: 0xffffff,
                mainIntensity: 0.6
            },
            crystal_cavern: {
                ambientColor: 0x602040,
                ambientIntensity: 0.3,
                mainColor: 0xd4af37,
                mainIntensity: 0.8
            },
            shadow_realm: {
                ambientColor: 0x200020,
                ambientIntensity: 0.2,
                mainColor: 0x6a4c93,
                mainIntensity: 0.5
            }
        };
        
        return lightingPresets[dreamType] || lightingPresets.floating_city;
    }
    
    generateAtmosphere(dreamType) {
        const atmospherePresets = {
            floating_city: {
                fogColor: 0x87ceeb,
                fogNear: 20,
                fogFar: 120
            },
            crystal_cavern: {
                fogColor: 0x4a3c28,
                fogNear: 10,
                fogFar: 80
            },
            shadow_realm: {
                fogColor: 0x1a0f2e,
                fogNear: 5,
                fogFar: 60
            }
        };
        
        return atmospherePresets[dreamType] || atmospherePresets.floating_city;
    }
    
    // Utility methods
    generateSeed(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            const char = name.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) / 2147483647; // Normalize to 0-1
    }
    
    weightedRandomChoice(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [choice, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return choice;
        }
        
        return Object.keys(weights)[0]; // Fallback
    }
    
    // Animation update for generated objects
    updateAnimations(world, deltaTime) {
        world.objects.forEach(obj => {
            if (obj.userData.type === 'platform') {
                const time = Date.now() * 0.001;
                obj.position.y = obj.userData.originalY + 
                    Math.sin(time * obj.userData.bobSpeed) * obj.userData.bobAmount;
            } else if (obj.userData.type === 'crystal') {
                const time = Date.now() * 0.001;
                obj.material.emissiveIntensity = obj.userData.baseEmissive + 
                    Math.sin(time * obj.userData.glowSpeed) * 0.1;
            } else if (obj.userData.type === 'fragment') {
                const time = Date.now() * 0.001;
                obj.rotation.y += obj.userData.rotationSpeed * deltaTime;
                obj.position.y += Math.sin(time * obj.userData.floatSpeed) * 
                    obj.userData.floatAmount * deltaTime;
            }
        });
    }
}

// Export for use in other modules
window.ProceduralGenerator = ProceduralGenerator;