import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class LoadingManager {
    constructor() {
        this.loadingManager = new THREE.LoadingManager();
        this.cache = new Map();
        this.loadingQueue = [];
        this.loadedAssets = 0;
        this.totalAssets = 0;
        
        // Loaders
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        this.rgbeLoader = new RGBELoader(this.loadingManager);
        this.audioLoader = new THREE.AudioLoader(this.loadingManager);
        
        // Configure DRACO loader for compressed models
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        this.gltfLoader.setDRACOLoader(dracoLoader);
        
        // Progress callbacks
        this.onProgress = null;
        this.onLoad = null;
        this.onError = null;
        
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.loadingManager.onLoad = () => {
            console.log('✅ All assets loaded!');
            if (this.onLoad) this.onLoad();
        };
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = itemsLoaded / itemsTotal;
            console.log(`📦 Loading progress: ${Math.round(progress * 100)}% (${itemsLoaded}/${itemsTotal})`);
            
            if (this.onProgress) {
                this.onProgress(progress, this.getAssetName(url));
            }
        };
        
        this.loadingManager.onError = (url) => {
            console.error(`❌ Error loading asset: ${url}`);
            if (this.onError) this.onError(url);
        };
    }
    
    async loadAssets(assetPaths) {
        this.totalAssets = assetPaths.length;
        this.loadedAssets = 0;
        
        const promises = assetPaths.map(path => this.loadAsset(path));
        
        try {
            await Promise.all(promises);
            console.log('🎉 All essential assets loaded successfully!');
        } catch (error) {
            console.error('💥 Failed to load some assets:', error);
            throw error;
        }
    }
    
    async loadAsset(path) {
        // Check cache first
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }
        
        const extension = this.getFileExtension(path);
        let asset;
        
        try {
            switch (extension) {
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'webp':
                    asset = await this.loadTexture(path);
                    break;
                case 'hdr':
                case 'exr':
                    asset = await this.loadHDR(path);
                    break;
                case 'glb':
                case 'gltf':
                    asset = await this.loadModel(path);
                    break;
                case 'mp3':
                case 'wav':
                case 'ogg':
                    asset = await this.loadAudio(path);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${extension}`);
            }
            
            // Cache the loaded asset
            this.cache.set(path, asset);
            this.loadedAssets++;
            
            return asset;
            
        } catch (error) {
            console.error(`Failed to load asset ${path}:`, error);
            throw error;
        }
    }
    
    loadTexture(path) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    // Optimize texture settings
                    texture.generateMipmaps = true;
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }
    
    loadHDR(path) {
        return new Promise((resolve, reject) => {
            this.rgbeLoader.load(
                path,
                (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }
    
    loadModel(path) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    // Process model for optimization
                    this.processModel(gltf);
                    resolve(gltf);
                },
                undefined,
                reject
            );
        });
    }
    
    loadAudio(path) {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                path,
                resolve,
                undefined,
                reject
            );
        });
    }
    
    processModel(gltf) {
        // Traverse and optimize the model
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                // Enable shadows
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Optimize materials
                if (child.material) {
                    this.optimizeMaterial(child.material);
                }
                
                // Optimize geometry
                if (child.geometry) {
                    child.geometry.computeBoundingSphere();
                    child.geometry.computeBoundingBox();
                }
            }
        });
        
        // Store animations
        if (gltf.animations && gltf.animations.length > 0) {
            gltf.mixer = new THREE.AnimationMixer(gltf.scene);
            gltf.actions = {};
            
            gltf.animations.forEach((clip) => {
                const action = gltf.mixer.clipAction(clip);
                gltf.actions[clip.name] = action;
            });
        }
    }
    
    optimizeMaterial(material) {
        // Enable proper color space
        if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
        }
        
        // Optimize for performance
        material.transparent = material.opacity < 1.0;
        material.needsUpdate = true;
    }
    
    getAsset(path) {
        return this.cache.get(path);
    }
    
    hasAsset(path) {
        return this.cache.has(path);
    }
    
    removeAsset(path) {
        const asset = this.cache.get(path);
        if (asset) {
            // Dispose of Three.js resources
            if (asset.isTexture) {
                asset.dispose();
            } else if (asset.isGeometry) {
                asset.dispose();
            } else if (asset.isMaterial) {
                asset.dispose();
            } else if (asset.scene) {
                // Dispose GLTF model
                asset.scene.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
            
            this.cache.delete(path);
        }
    }
    
    preloadAssets(assetPaths) {
        // Add to loading queue for background loading
        this.loadingQueue.push(...assetPaths);
    }
    
    async processLoadingQueue() {
        if (this.loadingQueue.length === 0) return;
        
        const batch = this.loadingQueue.splice(0, 5); // Load 5 at a time
        const promises = batch.map(path => this.loadAsset(path));
        
        try {
            await Promise.all(promises);
        } catch (error) {
            console.warn('Some assets in queue failed to load:', error);
        }
        
        // Continue processing if more items in queue
        if (this.loadingQueue.length > 0) {
            setTimeout(() => this.processLoadingQueue(), 100);
        }
    }
    
    getFileExtension(path) {
        return path.split('.').pop().toLowerCase();
    }
    
    getAssetName(path) {
        return path.split('/').pop();
    }
    
    getProgress() {
        return this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 1;
    }
    
    getCacheSize() {
        return this.cache.size;
    }
    
    clearCache() {
        this.cache.forEach((asset, path) => {
            this.removeAsset(path);
        });
        this.cache.clear();
        console.log('🗑️ Asset cache cleared');
    }
    
    // Memory management
    getMemoryUsage() {
        let textureMemory = 0;
        let geometryMemory = 0;
        
        this.cache.forEach((asset) => {
            if (asset.isTexture) {
                const width = asset.image?.width || 1;
                const height = asset.image?.height || 1;
                textureMemory += width * height * 4; // Assume RGBA
            } else if (asset.scene) {
                asset.scene.traverse((child) => {
                    if (child.geometry) {
                        const attributes = child.geometry.attributes;
                        Object.keys(attributes).forEach(key => {
                            geometryMemory += attributes[key].array.length * 4; // Float32
                        });
                    }
                });
            }
        });
        
        return {
            textureMemory: textureMemory / (1024 * 1024), // MB
            geometryMemory: geometryMemory / (1024 * 1024), // MB
            totalAssets: this.cache.size
        };
    }
}