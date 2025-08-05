// AAA Racing Championship - Advanced Particle System

class ParticleSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.systems = new Map();
        this.enabled = true;
        
        this.init();
    }
    
    init() {
        // Create different particle systems
        this.createTireSmokeSystem();
        this.createExhaustSystem();
        this.createDustSystem();
        this.createSparkSystem();
        this.createRainSystem();
        this.createDebrisSystem();
    }
    
    createTireSmokeSystem() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        const alphas = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            
            lifetimes[i] = 0;
            sizes[i] = Math.random() * 0.3 + 0.1;
            alphas[i] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.3,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: false
        });
        
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        this.systems.set('tireSmoke', {
            points,
            geometry,
            material,
            positions,
            velocities,
            lifetimes,
            sizes,
            alphas,
            particleCount,
            activeParticles: 0,
            emissionRate: 0
        });
    }
    
    createExhaustSystem() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            
            lifetimes[i] = 0;
            sizes[i] = Math.random() * 0.15 + 0.05;
            
            // Heat shimmer colors (blue to transparent)
            colors[i * 3] = 0.3;     // R
            colors[i * 3 + 1] = 0.3; // G
            colors[i * 3 + 2] = 0.8; // B
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });
        
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        this.systems.set('exhaust', {
            points,
            geometry,
            material,
            positions,
            velocities,
            lifetimes,
            sizes,
            colors,
            particleCount,
            activeParticles: 0,
            emissionRate: 0
        });
    }
    
    createDustSystem() {
        const particleCount = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            
            lifetimes[i] = 0;
            sizes[i] = Math.random() * 0.2 + 0.05;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0xd4af37,
            size: 0.15,
            transparent: true,
            opacity: 0.7,
            blending: THREE.NormalBlending,
            depthWrite: false
        });
        
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        this.systems.set('dust', {
            points,
            geometry,
            material,
            positions,
            velocities,
            lifetimes,
            sizes,
            particleCount,
            activeParticles: 0,
            emissionRate: 0
        });
    }
    
    createSparkSystem() {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            
            lifetimes[i] = 0;
            sizes[i] = Math.random() * 0.1 + 0.02;
            
            // Spark colors (yellow-orange-red)
            const heat = Math.random();
            colors[i * 3] = 1;                    // R
            colors[i * 3 + 1] = 0.5 + heat * 0.5; // G
            colors[i * 3 + 2] = heat * 0.3;       // B
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.08,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });
        
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        this.systems.set('sparks', {
            points,
            geometry,
            material,
            positions,
            velocities,
            lifetimes,
            sizes,
            colors,
            particleCount,
            activeParticles: 0,
            emissionRate: 0
        });
    }
    
    createRainSystem() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;     // X
            positions[i * 3 + 1] = Math.random() * 50 + 20;     // Y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // Z
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = -15 - Math.random() * 5;
            velocities[i * 3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x87ceeb,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.NormalBlending
        });
        
        const points = new THREE.Points(geometry, material);
        points.visible = false; // Hidden by default
        this.scene.add(points);
        
        this.systems.set('rain', {
            points,
            geometry,
            material,
            positions,
            velocities,
            particleCount,
            active: false
        });
    }
    
    createDebrisSystem() {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const rotations = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            
            lifetimes[i] = 0;
            
            rotations[i * 3] = Math.random() * Math.PI * 2;
            rotations[i * 3 + 1] = Math.random() * Math.PI * 2;
            rotations[i * 3 + 2] = Math.random() * Math.PI * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x444444,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending
        });
        
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        
        this.systems.set('debris', {
            points,
            geometry,
            material,
            positions,
            velocities,
            lifetimes,
            rotations,
            particleCount,
            activeParticles: 0
        });
    }
    
    emitTireSmoke(position, velocity, intensity = 1.0) {
        if (!this.enabled) return;
        
        const system = this.systems.get('tireSmoke');
        if (!system) return;
        
        const emitCount = Math.floor(intensity * 5);
        
        for (let i = 0; i < emitCount; i++) {
            const index = this.findDeadParticle(system);
            if (index === -1) continue;
            
            // Position
            system.positions[index * 3] = position.x + (Math.random() - 0.5) * 0.5;
            system.positions[index * 3 + 1] = position.y + Math.random() * 0.2;
            system.positions[index * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
            
            // Velocity
            system.velocities[index * 3] = velocity.x * 0.1 + (Math.random() - 0.5) * 2;
            system.velocities[index * 3 + 1] = Math.random() * 1.5 + 0.5;
            system.velocities[index * 3 + 2] = velocity.z * 0.1 + (Math.random() - 0.5) * 2;
            
            // Properties
            system.lifetimes[index] = 2.0 + Math.random() * 1.5;
            system.alphas[index] = 0.8;
            
            system.activeParticles++;
        }
        
        system.geometry.attributes.position.needsUpdate = true;
        system.geometry.attributes.velocity.needsUpdate = true;
        system.geometry.attributes.lifetime.needsUpdate = true;
        system.geometry.attributes.alpha.needsUpdate = true;
    }
    
    emitExhaust(position, velocity, intensity = 1.0) {
        if (!this.enabled) return;
        
        const system = this.systems.get('exhaust');
        if (!system) return;
        
        const emitCount = Math.floor(intensity * 3);
        
        for (let i = 0; i < emitCount; i++) {
            const index = this.findDeadParticle(system);
            if (index === -1) continue;
            
            // Position
            system.positions[index * 3] = position.x;
            system.positions[index * 3 + 1] = position.y;
            system.positions[index * 3 + 2] = position.z;
            
            // Velocity (behind the car)
            system.velocities[index * 3] = velocity.x * -0.5 + (Math.random() - 0.5) * 0.5;
            system.velocities[index * 3 + 1] = Math.random() * 0.8 + 0.2;
            system.velocities[index * 3 + 2] = velocity.z * -0.5 + (Math.random() - 0.5) * 0.5;
            
            // Properties
            system.lifetimes[index] = 1.0 + Math.random() * 0.5;
            
            system.activeParticles++;
        }
        
        system.geometry.attributes.position.needsUpdate = true;
        system.geometry.attributes.velocity.needsUpdate = true;
        system.geometry.attributes.lifetime.needsUpdate = true;
    }
    
    emitDust(position, velocity, intensity = 1.0) {
        if (!this.enabled) return;
        
        const system = this.systems.get('dust');
        if (!system) return;
        
        const emitCount = Math.floor(intensity * 4);
        
        for (let i = 0; i < emitCount; i++) {
            const index = this.findDeadParticle(system);
            if (index === -1) continue;
            
            // Position
            system.positions[index * 3] = position.x + (Math.random() - 0.5) * 0.8;
            system.positions[index * 3 + 1] = position.y + Math.random() * 0.1;
            system.positions[index * 3 + 2] = position.z + (Math.random() - 0.5) * 0.8;
            
            // Velocity
            system.velocities[index * 3] = velocity.x * 0.3 + (Math.random() - 0.5) * 3;
            system.velocities[index * 3 + 1] = Math.random() * 2 + 0.5;
            system.velocities[index * 3 + 2] = velocity.z * 0.3 + (Math.random() - 0.5) * 3;
            
            // Properties
            system.lifetimes[index] = 1.5 + Math.random() * 1;
            
            system.activeParticles++;
        }
        
        system.geometry.attributes.position.needsUpdate = true;
        system.geometry.attributes.velocity.needsUpdate = true;
        system.geometry.attributes.lifetime.needsUpdate = true;
    }
    
    emitSparks(position, velocity, intensity = 1.0) {
        if (!this.enabled) return;
        
        const system = this.systems.get('sparks');
        if (!system) return;
        
        const emitCount = Math.floor(intensity * 8);
        
        for (let i = 0; i < emitCount; i++) {
            const index = this.findDeadParticle(system);
            if (index === -1) continue;
            
            // Position
            system.positions[index * 3] = position.x;
            system.positions[index * 3 + 1] = position.y + 0.1;
            system.positions[index * 3 + 2] = position.z;
            
            // Velocity (sparks fly in random directions)
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            system.velocities[index * 3] = Math.cos(angle) * speed;
            system.velocities[index * 3 + 1] = Math.random() * 2 + 1;
            system.velocities[index * 3 + 2] = Math.sin(angle) * speed;
            
            // Properties
            system.lifetimes[index] = 0.3 + Math.random() * 0.4;
            
            system.activeParticles++;
        }
        
        system.geometry.attributes.position.needsUpdate = true;
        system.geometry.attributes.velocity.needsUpdate = true;
        system.geometry.attributes.lifetime.needsUpdate = true;
    }
    
    findDeadParticle(system) {
        for (let i = 0; i < system.particleCount; i++) {
            if (system.lifetimes[i] <= 0) {
                return i;
            }
        }
        return -1;
    }
    
    update(deltaTime) {
        if (!this.enabled) return;
        
        this.systems.forEach((system, name) => {
            if (name === 'rain') {
                this.updateRain(system, deltaTime);
            } else {
                this.updateParticleSystem(system, deltaTime);
            }
        });
    }
    
    updateParticleSystem(system, deltaTime) {
        for (let i = 0; i < system.particleCount; i++) {
            if (system.lifetimes[i] > 0) {
                // Update lifetime
                system.lifetimes[i] -= deltaTime;
                
                if (system.lifetimes[i] <= 0) {
                    system.activeParticles--;
                    continue;
                }
                
                // Update position
                system.positions[i * 3] += system.velocities[i * 3] * deltaTime;
                system.positions[i * 3 + 1] += system.velocities[i * 3 + 1] * deltaTime;
                system.positions[i * 3 + 2] += system.velocities[i * 3 + 2] * deltaTime;
                
                // Apply gravity
                system.velocities[i * 3 + 1] -= 9.8 * deltaTime * 0.1;
                
                // Apply air resistance
                system.velocities[i * 3] *= 0.98;
                system.velocities[i * 3 + 2] *= 0.98;
                
                // Update alpha for fade out
                if (system.alphas) {
                    const normalizedLife = system.lifetimes[i] / 3.0;
                    system.alphas[i] = Math.min(normalizedLife * 0.8, 0.8);
                }
            }
        }
        
        system.geometry.attributes.position.needsUpdate = true;
        if (system.alphas) {
            system.geometry.attributes.alpha.needsUpdate = true;
        }
    }
    
    updateRain(system, deltaTime) {
        if (!system.active) return;
        
        for (let i = 0; i < system.particleCount; i++) {
            // Update position
            system.positions[i * 3] += system.velocities[i * 3] * deltaTime;
            system.positions[i * 3 + 1] += system.velocities[i * 3 + 1] * deltaTime;
            system.positions[i * 3 + 2] += system.velocities[i * 3 + 2] * deltaTime;
            
            // Reset if below ground
            if (system.positions[i * 3 + 1] < 0) {
                system.positions[i * 3] = (Math.random() - 0.5) * 200;
                system.positions[i * 3 + 1] = 50 + Math.random() * 20;
                system.positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            }
        }
        
        system.geometry.attributes.position.needsUpdate = true;
    }
    
    setRain(active) {
        const system = this.systems.get('rain');
        if (system) {
            system.active = active;
            system.points.visible = active;
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        
        this.systems.forEach(system => {
            if (system.points) {
                system.points.visible = enabled;
            }
        });
    }
    
    reset() {
        this.systems.forEach(system => {
            if (system.lifetimes) {
                system.lifetimes.fill(0);
                system.activeParticles = 0;
                system.geometry.attributes.lifetime.needsUpdate = true;
            }
        });
    }
}