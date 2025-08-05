import * as THREE from 'three';

export class SceneManager {
    constructor(scene) {
        this.scene = scene;
        this.objects = new Map();
        this.lights = new Map();
        this.groups = new Map();
        this.instancedMeshes = new Map();
        
        // LOD management
        this.lodObjects = [];
        this.camera = null;
        this.lodDistances = {
            high: 100,
            medium: 300,
            low: 500
        };
        
        // Culling
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        
        // Object pools
        this.objectPools = new Map();
        
        console.log('🎬 SceneManager initialized');
    }
    
    setCamera(camera) {
        this.camera = camera;
    }
    
    // Object Management
    addObject(object, id = null, group = null) {
        if (!id) {
            id = this.generateId();
        }
        
        if (group) {
            this.addToGroup(object, group);
        } else {
            this.scene.add(object);
        }
        
        this.objects.set(id, object);
        object.userData.sceneId = id;
        
        return id;
    }
    
    removeObject(id) {
        const object = this.objects.get(id);
        if (object) {
            // Remove from scene or group
            if (object.parent) {
                object.parent.remove(object);
            }
            
            // Dispose of resources
            this.disposeObject(object);
            
            this.objects.delete(id);
        }
    }
    
    getObject(id) {
        return this.objects.get(id);
    }
    
    updateObject(id, updates) {
        const object = this.objects.get(id);
        if (object) {
            if (updates.position) object.position.copy(updates.position);
            if (updates.rotation) object.rotation.copy(updates.rotation);
            if (updates.scale) object.scale.copy(updates.scale);
            if (updates.visible !== undefined) object.visible = updates.visible;
        }
    }
    
    // Group Management
    createGroup(name) {
        const group = new THREE.Group();
        group.name = name;
        this.groups.set(name, group);
        this.scene.add(group);
        return group;
    }
    
    getGroup(name) {
        return this.groups.get(name);
    }
    
    addToGroup(object, groupName) {
        let group = this.groups.get(groupName);
        if (!group) {
            group = this.createGroup(groupName);
        }
        group.add(object);
    }
    
    removeGroup(name) {
        const group = this.groups.get(name);
        if (group) {
            this.scene.remove(group);
            this.disposeObject(group);
            this.groups.delete(name);
        }
    }
    
    // Lighting Management
    addLight(light, id = null) {
        if (!id) {
            id = this.generateId();
        }
        
        this.scene.add(light);
        this.lights.set(id, light);
        light.userData.sceneId = id;
        
        return id;
    }
    
    removeLight(id) {
        const light = this.lights.get(id);
        if (light) {
            this.scene.remove(light);
            this.lights.delete(id);
        }
    }
    
    updateLighting(timeOfDay, weather) {
        // Update directional light (sun)
        const sunLight = this.lights.get('sun');
        if (sunLight) {
            const sunAngle = (timeOfDay / 24) * Math.PI * 2;
            const sunIntensity = Math.max(0, Math.sin(sunAngle));
            
            sunLight.intensity = sunIntensity * 0.8;
            sunLight.position.x = Math.cos(sunAngle) * 100;
            sunLight.position.y = Math.sin(sunAngle) * 100;
            
            // Update color based on time of day
            if (sunAngle < Math.PI * 0.1 || sunAngle > Math.PI * 0.9) {
                // Sunrise/sunset - warm colors
                sunLight.color.setHSL(0.1, 0.6, 1);
            } else {
                // Midday - cool white
                sunLight.color.setHSL(0.6, 0.1, 1);
            }
        }
        
        // Update ambient light
        const ambientLight = this.lights.get('ambient');
        if (ambientLight) {
            const baseIntensity = 0.2;
            const timeIntensity = Math.max(0.1, Math.sin((timeOfDay / 24) * Math.PI * 2));
            ambientLight.intensity = baseIntensity + (timeIntensity * 0.1);
        }
        
        // Update fog based on weather
        if (this.scene.fog) {
            const weatherMultiplier = weather === 'rain' ? 0.5 : weather === 'fog' ? 0.2 : 1.0;
            this.scene.fog.far = 1000 * weatherMultiplier;
        }
    }
    
    // Instanced Rendering
    createInstancedMesh(geometry, material, count, id) {
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        this.instancedMeshes.set(id, instancedMesh);
        this.scene.add(instancedMesh);
        return instancedMesh;
    }
    
    updateInstancedMesh(id, index, matrix) {
        const instancedMesh = this.instancedMeshes.get(id);
        if (instancedMesh) {
            instancedMesh.setMatrixAt(index, matrix);
            instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }
    
    // LOD (Level of Detail) Management
    addLODObject(object, distances = null) {
        if (!distances) {
            distances = [this.lodDistances.high, this.lodDistances.medium, this.lodDistances.low];
        }
        
        const lodObject = {
            object,
            distances,
            currentLOD: 0,
            highDetailMesh: object.children[0] || object,
            mediumDetailMesh: object.children[1] || null,
            lowDetailMesh: object.children[2] || null
        };
        
        this.lodObjects.push(lodObject);
    }
    
    updateLOD() {
        if (!this.camera) return;
        
        const cameraPosition = this.camera.position;
        
        this.lodObjects.forEach(lodObj => {
            const distance = cameraPosition.distanceTo(lodObj.object.position);
            let newLOD = 0;
            
            if (distance > lodObj.distances[2]) {
                newLOD = 3; // Cull completely
            } else if (distance > lodObj.distances[1]) {
                newLOD = 2; // Low detail
            } else if (distance > lodObj.distances[0]) {
                newLOD = 1; // Medium detail
            }
            
            if (newLOD !== lodObj.currentLOD) {
                lodObj.currentLOD = newLOD;
                
                // Hide all LOD levels
                if (lodObj.highDetailMesh) lodObj.highDetailMesh.visible = false;
                if (lodObj.mediumDetailMesh) lodObj.mediumDetailMesh.visible = false;
                if (lodObj.lowDetailMesh) lodObj.lowDetailMesh.visible = false;
                
                // Show appropriate LOD level
                switch (newLOD) {
                    case 0:
                        if (lodObj.highDetailMesh) lodObj.highDetailMesh.visible = true;
                        break;
                    case 1:
                        if (lodObj.mediumDetailMesh) {
                            lodObj.mediumDetailMesh.visible = true;
                        } else if (lodObj.highDetailMesh) {
                            lodObj.highDetailMesh.visible = true;
                        }
                        break;
                    case 2:
                        if (lodObj.lowDetailMesh) {
                            lodObj.lowDetailMesh.visible = true;
                        } else if (lodObj.mediumDetailMesh) {
                            lodObj.mediumDetailMesh.visible = true;
                        } else if (lodObj.highDetailMesh) {
                            lodObj.highDetailMesh.visible = true;
                        }
                        break;
                    case 3:
                        // Object culled
                        break;
                }
            }
        });
    }
    
    // Frustum Culling
    updateFrustumCulling() {
        if (!this.camera) return;
        
        this.cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        this.objects.forEach(object => {
            if (object.isMesh || object.isGroup) {
                object.visible = this.frustum.intersectsObject(object);
            }
        });
    }
    
    // Object Pooling
    createObjectPool(type, createFunction, resetFunction, initialSize = 10) {
        const pool = {
            objects: [],
            createFunction,
            resetFunction,
            activeObjects: new Set()
        };
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            const obj = createFunction();
            obj.visible = false;
            pool.objects.push(obj);
            this.scene.add(obj);
        }
        
        this.objectPools.set(type, pool);
    }
    
    getFromPool(type) {
        const pool = this.objectPools.get(type);
        if (!pool) return null;
        
        let object = pool.objects.pop();
        if (!object) {
            // Pool empty, create new object
            object = pool.createFunction();
            this.scene.add(object);
        }
        
        object.visible = true;
        pool.activeObjects.add(object);
        return object;
    }
    
    returnToPool(type, object) {
        const pool = this.objectPools.get(type);
        if (!pool || !pool.activeObjects.has(object)) return;
        
        pool.resetFunction(object);
        object.visible = false;
        pool.activeObjects.delete(object);
        pool.objects.push(object);
    }
    
    // Resource Management
    disposeObject(object) {
        object.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => this.disposeMaterial(material));
                } else {
                    this.disposeMaterial(child.material);
                }
            }
        });
    }
    
    disposeMaterial(material) {
        // Dispose textures
        Object.keys(material).forEach(key => {
            if (material[key] && material[key].isTexture) {
                material[key].dispose();
            }
        });
        
        material.dispose();
    }
    
    // Utility methods
    generateId() {
        return 'obj_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    update() {
        // Update LOD system
        this.updateLOD();
        
        // Update frustum culling
        this.updateFrustumCulling();
    }
    
    getStats() {
        return {
            objects: this.objects.size,
            lights: this.lights.size,
            groups: this.groups.size,
            instancedMeshes: this.instancedMeshes.size,
            lodObjects: this.lodObjects.length,
            pooledObjects: Array.from(this.objectPools.values()).reduce((total, pool) => 
                total + pool.objects.length + pool.activeObjects.size, 0)
        };
    }
    
    clear() {
        // Remove all objects
        this.objects.forEach((object, id) => {
            this.removeObject(id);
        });
        
        // Remove all lights
        this.lights.forEach((light, id) => {
            this.removeLight(id);
        });
        
        // Remove all groups
        this.groups.forEach((group, name) => {
            this.removeGroup(name);
        });
        
        // Clear pools
        this.objectPools.clear();
        
        // Clear arrays
        this.lodObjects.length = 0;
        
        console.log('🗑️ Scene cleared');
    }
}