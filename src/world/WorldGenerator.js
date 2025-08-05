import * as THREE from 'three';
import { SimplexNoise } from 'simplex-noise';

export class WorldGenerator {
    constructor(options = {}) {
        this.sceneManager = options.sceneManager;
        this.physicsManager = options.physicsManager;
        this.loadingManager = options.loadingManager;
        
        // World parameters
        this.worldSize = 10000; // 10km x 10km world
        this.chunkSize = 500; // 500m x 500m chunks
        this.chunksPerSide = this.worldSize / this.chunkSize;
        
        // Noise generators
        this.terrainNoise = new SimplexNoise();
        this.cityNoise = new SimplexNoise();
        this.detailNoise = new SimplexNoise();
        
        // Generated chunks and objects
        this.chunks = new Map();
        this.loadedChunks = new Set();
        this.cities = [];
        this.roads = [];
        
        // Streaming
        this.playerPosition = new THREE.Vector3();
        this.loadDistance = 1000; // Load chunks within 1km
        this.unloadDistance = 1500; // Unload chunks beyond 1.5km
        
        // Asset pools
        this.assetPools = {
            trees: [],
            buildings: [],
            vehicles: [],
            props: []
        };
        
        console.log('🌍 WorldGenerator initialized');
    }
    
    async generateTerrain() {
        console.log('🏔️ Generating terrain...');
        
        // Generate base terrain
        const terrainGeometry = this.generateTerrainGeometry();
        const terrainMaterial = await this.createTerrainMaterial();
        const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
        
        terrainMesh.receiveShadow = true;
        terrainMesh.position.set(0, 0, 0);
        
        // Add to scene
        this.sceneManager.addObject(terrainMesh, 'terrain', 'world');
        
        // Create physics body for terrain
        const terrainBody = this.physicsManager.createFromGeometry(
            terrainGeometry,
            [0, 0, 0],
            0 // Static body
        );
        this.physicsManager.addBody(terrainBody, 'terrain');
        
        console.log('✅ Terrain generated');
    }
    
    generateTerrainGeometry() {
        const size = this.worldSize;
        const segments = 512; // High detail terrain
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        // Apply height map using noise
        const vertices = geometry.attributes.position.array;
        const heightScale = 50; // Max height variation
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Multi-octave noise for realistic terrain
            let height = 0;
            height += this.terrainNoise.noise2D(x * 0.001, z * 0.001) * heightScale;
            height += this.terrainNoise.noise2D(x * 0.005, z * 0.005) * heightScale * 0.3;
            height += this.terrainNoise.noise2D(x * 0.01, z * 0.01) * heightScale * 0.1;
            
            vertices[i + 1] = height;
        }
        
        // Recompute normals for proper lighting
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    async createTerrainMaterial() {
        // Load terrain textures
        const grassTexture = this.loadingManager.getAsset('textures/terrain/grass.jpg') || 
                           await this.createProceduralTexture('grass');
        const roadTexture = this.loadingManager.getAsset('textures/terrain/road.jpg') || 
                          await this.createProceduralTexture('road');
        
        // Configure texture settings
        [grassTexture, roadTexture].forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(100, 100);
        });
        
        // Create material with texture blending
        const material = new THREE.MeshLambertMaterial({
            map: grassTexture,
            // TODO: Implement texture blending shader for roads/paths
        });
        
        return material;
    }
    
    async createProceduralTexture(type) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        switch (type) {
            case 'grass':
                ctx.fillStyle = '#4a7c59';
                ctx.fillRect(0, 0, size, size);
                
                // Add grass noise
                for (let x = 0; x < size; x += 4) {
                    for (let y = 0; y < size; y += 4) {
                        const brightness = 0.8 + Math.random() * 0.4;
                        ctx.fillStyle = `hsl(120, 60%, ${brightness * 30}%)`;
                        ctx.fillRect(x, y, 4, 4);
                    }
                }
                break;
                
            case 'road':
                ctx.fillStyle = '#404040';
                ctx.fillRect(0, 0, size, size);
                
                // Add road markings
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(size/2 - 2, 0, 4, size);
                break;
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    async generateCities() {
        console.log('🏙️ Generating cities...');
        
        const numCities = 5;
        const minDistance = 1000; // Minimum distance between cities
        
        for (let i = 0; i < numCities; i++) {
            let position;
            let attempts = 0;
            
            // Find valid position for city
            do {
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * this.worldSize * 0.8,
                    0,
                    (Math.random() - 0.5) * this.worldSize * 0.8
                );
                attempts++;
            } while (attempts < 50 && this.cities.some(city => 
                city.position.distanceTo(position) < minDistance
            ));
            
            // Get terrain height at position
            position.y = this.getTerrainHeight(position.x, position.z);
            
            const city = {
                position: position.clone(),
                size: 300 + Math.random() * 200,
                population: Math.floor(1000 + Math.random() * 9000),
                buildings: []
            };
            
            await this.generateCityBuildings(city);
            this.cities.push(city);
        }
        
        console.log(`✅ Generated ${this.cities.length} cities`);
    }
    
    async generateCityBuildings(city) {
        const numBuildings = Math.floor(city.size / 20);
        const buildingRadius = city.size / 2;
        
        for (let i = 0; i < numBuildings; i++) {
            // Generate building position within city bounds
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * buildingRadius;
            const buildingPos = new THREE.Vector3(
                city.position.x + Math.cos(angle) * distance,
                city.position.y,
                city.position.z + Math.sin(angle) * distance
            );
            
            // Create building
            const building = this.createBuilding(buildingPos);
            city.buildings.push(building);
            
            // Add to scene with LOD
            const buildingId = this.sceneManager.addObject(building.mesh, null, 'buildings');
            this.sceneManager.addLODObject(building.mesh);
            
            // Add physics
            if (building.body) {
                this.physicsManager.addBody(building.body);
            }
        }
    }
    
    createBuilding(position) {
        const width = 10 + Math.random() * 20;
        const depth = 10 + Math.random() * 20;
        const height = 20 + Math.random() * 80;
        
        // Create geometry
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create material
        const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color().setHSL(
                Math.random() * 0.1 + 0.05, // Brownish/gray colors
                0.2 + Math.random() * 0.3,
                0.4 + Math.random() * 0.3
            )
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.position.y += height / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Create physics body
        const body = this.physicsManager.createBox(
            { x: width, y: height, z: depth },
            [position.x, position.y + height / 2, position.z],
            0 // Static
        );
        
        return { mesh, body };
    }
    
    async generateRoads() {
        console.log('🛣️ Generating roads...');
        
        // Connect cities with roads
        for (let i = 0; i < this.cities.length; i++) {
            for (let j = i + 1; j < this.cities.length; j++) {
                const cityA = this.cities[i];
                const cityB = this.cities[j];
                
                // Create road between cities if close enough
                const distance = cityA.position.distanceTo(cityB.position);
                if (distance < 2000) {
                    this.createRoad(cityA.position, cityB.position);
                }
            }
        }
        
        console.log(`✅ Generated ${this.roads.length} road segments`);
    }
    
    createRoad(start, end) {
        const roadWidth = 8;
        const points = this.generateRoadPath(start, end);
        
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const direction = new THREE.Vector3().subVectors(next, current);
            const length = direction.length();
            
            // Create road segment
            const geometry = new THREE.BoxGeometry(length, 0.1, roadWidth);
            const material = new THREE.MeshLambertMaterial({ color: 0x404040 });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position and orient road segment
            mesh.position.copy(current).add(direction.clone().multiplyScalar(0.5));
            mesh.lookAt(next);
            mesh.receiveShadow = true;
            
            // Add to scene
            this.sceneManager.addObject(mesh, null, 'roads');
            
            // Create physics body
            const body = this.physicsManager.createBox(
                { x: length, y: 0.1, z: roadWidth },
                mesh.position.toArray(),
                0
            );
            this.physicsManager.addBody(body);
            
            this.roads.push({ mesh, body, start: current, end: next });
        }
    }
    
    generateRoadPath(start, end) {
        const points = [start.clone()];
        const segments = Math.floor(start.distanceTo(end) / 100); // 100m segments
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3().lerpVectors(start, end, t);
            
            // Add some curvature based on terrain
            const noiseX = this.terrainNoise.noise2D(point.x * 0.001, point.z * 0.001) * 50;
            const noiseZ = this.terrainNoise.noise2D(point.x * 0.001 + 100, point.z * 0.001 + 100) * 50;
            
            point.x += noiseX;
            point.z += noiseZ;
            point.y = this.getTerrainHeight(point.x, point.z) + 0.1; // Slightly above terrain
            
            points.push(point);
        }
        
        points.push(end.clone());
        return points;
    }
    
    async populateWorld() {
        console.log('🌲 Populating world with objects...');
        
        // Generate trees
        await this.generateVegetation();
        
        // Generate props and details
        await this.generateProps();
        
        console.log('✅ World population complete');
    }
    
    async generateVegetation() {
        const treeCount = 5000;
        const treeSpacing = 50; // Minimum spacing between trees
        
        for (let i = 0; i < treeCount; i++) {
            // Random position
            const x = (Math.random() - 0.5) * this.worldSize * 0.9;
            const z = (Math.random() - 0.5) * this.worldSize * 0.9;
            const y = this.getTerrainHeight(x, z);
            
            // Check if position is suitable for trees
            if (this.isSuitableForVegetation(x, z)) {
                const tree = this.createTree(new THREE.Vector3(x, y, z));
                this.sceneManager.addObject(tree.mesh, null, 'vegetation');
                this.sceneManager.addLODObject(tree.mesh, [100, 300, 500]);
            }
        }
    }
    
    createTree(position) {
        const trunkHeight = 5 + Math.random() * 10;
        const trunkRadius = 0.3 + Math.random() * 0.3;
        const foliageRadius = 2 + Math.random() * 3;
        
        const group = new THREE.Group();
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Create foliage
        const foliageGeometry = new THREE.SphereGeometry(foliageRadius);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = trunkHeight + foliageRadius * 0.7;
        foliage.castShadow = true;
        group.add(foliage);
        
        group.position.copy(position);
        
        return { mesh: group };
    }
    
    async generateProps() {
        // Generate rocks, signs, and other environmental objects
        const propCount = 2000;
        
        for (let i = 0; i < propCount; i++) {
            const x = (Math.random() - 0.5) * this.worldSize * 0.9;
            const z = (Math.random() - 0.5) * this.worldSize * 0.9;
            const y = this.getTerrainHeight(x, z);
            
            if (Math.random() < 0.3) { // 30% chance for prop
                const prop = this.createProp(new THREE.Vector3(x, y, z));
                this.sceneManager.addObject(prop.mesh, null, 'props');
            }
        }
    }
    
    createProp(position) {
        const propType = Math.random();
        let mesh;
        
        if (propType < 0.6) {
            // Rock
            const size = 0.5 + Math.random() * 2;
            const geometry = new THREE.SphereGeometry(size, 8, 6);
            const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
            mesh = new THREE.Mesh(geometry, material);
        } else if (propType < 0.8) {
            // Bush
            const size = 0.8 + Math.random() * 1.2;
            const geometry = new THREE.SphereGeometry(size, 8, 6);
            const material = new THREE.MeshLambertMaterial({ color: 0x556B2F });
            mesh = new THREE.Mesh(geometry, material);
        } else {
            // Sign post
            const geometry = new THREE.BoxGeometry(0.1, 3, 0.1);
            const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            mesh = new THREE.Mesh(geometry, material);
        }
        
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return { mesh };
    }
    
    // Streaming system
    updateStreaming(playerPosition) {
        this.playerPosition.copy(playerPosition);
        
        // Calculate which chunks should be loaded
        const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
        const loadRadius = Math.ceil(this.loadDistance / this.chunkSize);
        
        // Load nearby chunks
        for (let x = playerChunkX - loadRadius; x <= playerChunkX + loadRadius; x++) {
            for (let z = playerChunkZ - loadRadius; z <= playerChunkZ + loadRadius; z++) {
                const chunkKey = `${x},${z}`;
                if (!this.loadedChunks.has(chunkKey)) {
                    this.loadChunk(x, z);
                }
            }
        }
        
        // Unload distant chunks
        const unloadRadius = Math.ceil(this.unloadDistance / this.chunkSize);
        this.loadedChunks.forEach(chunkKey => {
            const [x, z] = chunkKey.split(',').map(Number);
            const distance = Math.sqrt(
                Math.pow(x - playerChunkX, 2) + Math.pow(z - playerChunkZ, 2)
            );
            
            if (distance > unloadRadius) {
                this.unloadChunk(x, z);
            }
        });
    }
    
    loadChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        this.loadedChunks.add(chunkKey);
        
        // Generate chunk content if needed
        if (!this.chunks.has(chunkKey)) {
            this.generateChunk(chunkX, chunkZ);
        }
        
        // Make chunk objects visible
        const chunk = this.chunks.get(chunkKey);
        if (chunk) {
            chunk.objects.forEach(obj => {
                obj.visible = true;
            });
        }
    }
    
    unloadChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        this.loadedChunks.delete(chunkKey);
        
        // Hide chunk objects
        const chunk = this.chunks.get(chunkKey);
        if (chunk) {
            chunk.objects.forEach(obj => {
                obj.visible = false;
            });
        }
    }
    
    generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = {
            x: chunkX,
            z: chunkZ,
            objects: []
        };
        
        // Generate chunk-specific content
        // This could include detailed objects, vegetation, etc.
        
        this.chunks.set(chunkKey, chunk);
    }
    
    // Utility methods
    getTerrainHeight(x, z) {
        // Calculate terrain height at given position
        let height = 0;
        height += this.terrainNoise.noise2D(x * 0.001, z * 0.001) * 50;
        height += this.terrainNoise.noise2D(x * 0.005, z * 0.005) * 50 * 0.3;
        height += this.terrainNoise.noise2D(x * 0.01, z * 0.01) * 50 * 0.1;
        return height;
    }
    
    isSuitableForVegetation(x, z) {
        // Check if position is suitable for trees (not in cities, on roads, etc.)
        
        // Check distance from cities
        for (const city of this.cities) {
            if (Math.sqrt(Math.pow(x - city.position.x, 2) + Math.pow(z - city.position.z, 2)) < city.size) {
                return false;
            }
        }
        
        // Check distance from roads
        for (const road of this.roads) {
            // Simplified road distance check
            const roadCenter = new THREE.Vector3().addVectors(road.start, road.end).multiplyScalar(0.5);
            if (Math.sqrt(Math.pow(x - roadCenter.x, 2) + Math.pow(z - roadCenter.z, 2)) < 20) {
                return false;
            }
        }
        
        return true;
    }
    
    // Save/Load system
    getSaveData() {
        return {
            worldSize: this.worldSize,
            chunkSize: this.chunkSize,
            cities: this.cities.map(city => ({
                position: city.position.toArray(),
                size: city.size,
                population: city.population
            })),
            roads: this.roads.map(road => ({
                start: road.start.toArray(),
                end: road.end.toArray()
            }))
        };
    }
    
    loadSaveData(data) {
        this.worldSize = data.worldSize;
        this.chunkSize = data.chunkSize;
        
        // Restore cities
        this.cities = data.cities.map(cityData => ({
            position: new THREE.Vector3().fromArray(cityData.position),
            size: cityData.size,
            population: cityData.population,
            buildings: []
        }));
        
        // Restore roads
        this.roads = data.roads.map(roadData => ({
            start: new THREE.Vector3().fromArray(roadData.start),
            end: new THREE.Vector3().fromArray(roadData.end)
        }));
    }
}