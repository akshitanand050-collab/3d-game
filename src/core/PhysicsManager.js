import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsManager {
    constructor(settings = {}) {
        this.world = new CANNON.World();
        this.bodies = new Map();
        this.debugRenderer = null;
        this.debugEnabled = false;
        
        // Settings
        this.settings = {
            gravity: settings.gravity || -9.82,
            timeStep: settings.timeStep || 1/60,
            maxSubSteps: settings.maxSubSteps || 3,
            broadphase: settings.broadphase || 'naive'
        };
        
        this.initializeWorld();
    }
    
    initializeWorld() {
        // Set gravity
        this.world.gravity.set(0, this.settings.gravity, 0);
        
        // Set broadphase algorithm
        switch (this.settings.broadphase) {
            case 'sap':
                this.world.broadphase = new CANNON.SAPBroadphase(this.world);
                break;
            case 'grid':
                this.world.broadphase = new CANNON.GridBroadphase();
                break;
            default:
                this.world.broadphase = new CANNON.NaiveBroadphase();
        }
        
        // Configure solver
        this.world.solver.iterations = 10;
        
        // Set default contact material
        const defaultMaterial = new CANNON.Material('default');
        const defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            {
                friction: 0.4,
                restitution: 0.3
            }
        );
        this.world.addContactMaterial(defaultContactMaterial);
        this.world.defaultContactMaterial = defaultContactMaterial;
        
        console.log('⚡ Physics world initialized');
    }
    
    createBox(size, position = [0, 0, 0], mass = 1) {
        const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
        const shape = new CANNON.Box(halfExtents);
        const body = new CANNON.Body({ mass });
        
        body.addShape(shape);
        body.position.set(position[0], position[1], position[2]);
        
        return body;
    }
    
    createSphere(radius, position = [0, 0, 0], mass = 1) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({ mass });
        
        body.addShape(shape);
        body.position.set(position[0], position[1], position[2]);
        
        return body;
    }
    
    createCylinder(radiusTop, radiusBottom, height, numSegments = 8, position = [0, 0, 0], mass = 1) {
        const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
        const body = new CANNON.Body({ mass });
        
        body.addShape(shape);
        body.position.set(position[0], position[1], position[2]);
        
        return body;
    }
    
    createPlane(position = [0, 0, 0], rotation = [0, 0, 0], mass = 0) {
        const shape = new CANNON.Plane();
        const body = new CANNON.Body({ mass });
        
        body.addShape(shape);
        body.position.set(position[0], position[1], position[2]);
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), rotation[0]);
        
        return body;
    }
    
    createTrimesh(vertices, indices, position = [0, 0, 0], mass = 0) {
        const shape = new CANNON.Trimesh(vertices, indices);
        const body = new CANNON.Body({ mass });
        
        body.addShape(shape);
        body.position.set(position[0], position[1], position[2]);
        
        return body;
    }
    
    createFromGeometry(geometry, position = [0, 0, 0], mass = 1) {
        const vertices = [];
        const indices = [];
        
        const positionAttribute = geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            vertices.push(
                positionAttribute.getX(i),
                positionAttribute.getY(i),
                positionAttribute.getZ(i)
            );
        }
        
        if (geometry.index) {
            const indexAttribute = geometry.index;
            for (let i = 0; i < indexAttribute.count; i++) {
                indices.push(indexAttribute.getX(i));
            }
        } else {
            for (let i = 0; i < positionAttribute.count; i++) {
                indices.push(i);
            }
        }
        
        return this.createTrimesh(vertices, indices, position, mass);
    }
    
    addBody(body, entityId = null) {
        this.world.addBody(body);
        
        if (entityId) {
            this.bodies.set(entityId, body);
            body.entityId = entityId;
        }
        
        return body;
    }
    
    removeBody(body) {
        this.world.removeBody(body);
        
        if (body.entityId) {
            this.bodies.delete(body.entityId);
        }
    }
    
    getBodyByEntity(entityId) {
        return this.bodies.get(entityId);
    }
    
    syncThreeObject(threeObject, cannonBody) {
        // Copy position
        threeObject.position.copy(cannonBody.position);
        
        // Copy rotation
        threeObject.quaternion.copy(cannonBody.quaternion);
    }
    
    raycast(from, to, options = {}) {
        const result = new CANNON.RaycastResult();
        const ray = new CANNON.Ray(
            new CANNON.Vec3(from.x, from.y, from.z),
            new CANNON.Vec3(to.x, to.y, to.z)
        );
        
        ray.intersectWorld(this.world, options);
        
        return {
            hasHit: result.hasHit,
            hitPoint: result.hitPointWorld,
            hitNormal: result.hitNormalWorld,
            body: result.body,
            distance: result.distance
        };
    }
    
    sphereCast(position, radius, maxDistance = 100) {
        const hits = [];
        const sphere = new CANNON.Sphere(radius);
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(sphere);
        body.position.copy(position);
        
        this.world.bodies.forEach(otherBody => {
            if (otherBody === body) return;
            
            const distance = body.position.distanceTo(otherBody.position);
            if (distance <= maxDistance) {
                hits.push({
                    body: otherBody,
                    distance
                });
            }
        });
        
        hits.sort((a, b) => a.distance - b.distance);
        return hits;
    }
    
    addConstraint(constraint) {
        this.world.addConstraint(constraint);
    }
    
    removeConstraint(constraint) {
        this.world.removeConstraint(constraint);
    }
    
    createDistanceConstraint(bodyA, bodyB, distance, localAnchorA, localAnchorB) {
        return new CANNON.DistanceConstraint(
            bodyA,
            bodyB,
            distance,
            localAnchorA,
            localAnchorB
        );
    }
    
    createSpringConstraint(bodyA, bodyB, options = {}) {
        return new CANNON.Spring(bodyA, bodyB, {
            localAnchorA: options.localAnchorA || new CANNON.Vec3(0, 0, 0),
            localAnchorB: options.localAnchorB || new CANNON.Vec3(0, 0, 0),
            restLength: options.restLength || 1,
            stiffness: options.stiffness || 50,
            damping: options.damping || 1
        });
    }
    
    update(deltaTime) {
        // Step the physics simulation
        this.world.step(this.settings.timeStep, deltaTime, this.settings.maxSubSteps);
        
        // Update debug renderer if enabled
        if (this.debugEnabled && this.debugRenderer) {
            this.debugRenderer.update();
        }
    }
    
    enableDebugRenderer(scene) {
        if (!this.debugRenderer) {
            // Simple debug renderer - you might want to use a more sophisticated one
            this.debugRenderer = {
                scene: scene,
                meshes: [],
                update: () => {
                    // Clear previous debug meshes
                    this.debugRenderer.meshes.forEach(mesh => {
                        this.debugRenderer.scene.remove(mesh);
                    });
                    this.debugRenderer.meshes = [];
                    
                    // Create debug meshes for each body
                    this.world.bodies.forEach(body => {
                        body.shapes.forEach(shape => {
                            let geometry, material;
                            
                            material = new THREE.MeshBasicMaterial({
                                color: 0x00ff00,
                                wireframe: true,
                                transparent: true,
                                opacity: 0.3
                            });
                            
                            if (shape instanceof CANNON.Box) {
                                geometry = new THREE.BoxGeometry(
                                    shape.halfExtents.x * 2,
                                    shape.halfExtents.y * 2,
                                    shape.halfExtents.z * 2
                                );
                            } else if (shape instanceof CANNON.Sphere) {
                                geometry = new THREE.SphereGeometry(shape.radius, 16, 12);
                            } else if (shape instanceof CANNON.Plane) {
                                geometry = new THREE.PlaneGeometry(100, 100);
                            } else {
                                return; // Skip unsupported shapes
                            }
                            
                            const mesh = new THREE.Mesh(geometry, material);
                            mesh.position.copy(body.position);
                            mesh.quaternion.copy(body.quaternion);
                            
                            this.debugRenderer.scene.add(mesh);
                            this.debugRenderer.meshes.push(mesh);
                        });
                    });
                }
            };
        }
        
        this.debugEnabled = true;
        console.log('🔍 Physics debug renderer enabled');
    }
    
    disableDebugRenderer() {
        if (this.debugRenderer) {
            this.debugRenderer.meshes.forEach(mesh => {
                this.debugRenderer.scene.remove(mesh);
            });
            this.debugRenderer.meshes = [];
        }
        
        this.debugEnabled = false;
        console.log('🔍 Physics debug renderer disabled');
    }
    
    applySettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (newSettings.gravity !== undefined) {
            this.world.gravity.set(0, newSettings.gravity, 0);
        }
        
        if (newSettings.broadphase) {
            // Reinitialize broadphase if changed
            this.initializeWorld();
        }
    }
    
    getStats() {
        return {
            bodies: this.world.bodies.length,
            contacts: this.world.contacts.length,
            constraints: this.world.constraints.length,
            gravity: this.world.gravity.y,
            timeStep: this.settings.timeStep
        };
    }
    
    clear() {
        // Remove all bodies
        [...this.world.bodies].forEach(body => {
            this.world.removeBody(body);
        });
        
        // Remove all constraints
        [...this.world.constraints].forEach(constraint => {
            this.world.removeConstraint(constraint);
        });
        
        this.bodies.clear();
        console.log('🗑️ Physics world cleared');
    }
}