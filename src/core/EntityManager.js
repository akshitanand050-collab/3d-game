import * as THREE from 'three';

export class Entity {
    constructor(id) {
        this.id = id || Entity.generateId();
        this.components = new Map();
        this.active = true;
        this.tags = new Set();
        this.transform = {
            position: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            scale: new THREE.Vector3(1, 1, 1)
        };
    }
    
    static generateId() {
        return 'entity_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    addComponent(component) {
        this.components.set(component.constructor.name, component);
        component.entity = this;
        return this;
    }
    
    removeComponent(ComponentClass) {
        const componentName = ComponentClass.name;
        const component = this.components.get(componentName);
        if (component && component.destroy) {
            component.destroy();
        }
        this.components.delete(componentName);
        return this;
    }
    
    getComponent(ComponentClass) {
        return this.components.get(ComponentClass.name);
    }
    
    hasComponent(ComponentClass) {
        return this.components.has(ComponentClass.name);
    }
    
    addTag(tag) {
        this.tags.add(tag);
        return this;
    }
    
    removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }
    
    hasTag(tag) {
        return this.tags.has(tag);
    }
    
    setPosition(x, y, z) {
        this.transform.position.set(x, y, z);
        return this;
    }
    
    setRotation(x, y, z) {
        this.transform.rotation.set(x, y, z);
        return this;
    }
    
    setScale(x, y, z) {
        this.transform.scale.set(x, y, z);
        return this;
    }
    
    getPosition() {
        return this.transform.position.clone();
    }
    
    getRotation() {
        return this.transform.rotation.clone();
    }
    
    getScale() {
        return this.transform.scale.clone();
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Update all components
        this.components.forEach(component => {
            if (component.update) {
                component.update(deltaTime);
            }
        });
    }
    
    destroy() {
        // Destroy all components
        this.components.forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });
        this.components.clear();
        this.tags.clear();
        this.active = false;
    }
}

export class Component {
    constructor() {
        this.entity = null;
        this.enabled = true;
    }
    
    update(deltaTime) {
        // Override in derived classes
    }
    
    destroy() {
        // Override in derived classes for cleanup
    }
}

export class EntityManager {
    constructor() {
        this.entities = new Map();
        this.entitiesByTag = new Map();
        this.systems = [];
        this.toAdd = [];
        this.toRemove = [];
    }
    
    createEntity(id) {
        const entity = new Entity(id);
        this.toAdd.push(entity);
        return entity;
    }
    
    addEntity(entity) {
        if (this.entities.has(entity.id)) {
            console.warn(`Entity with id ${entity.id} already exists`);
            return;
        }
        
        this.entities.set(entity.id, entity);
        
        // Add to tag indices
        entity.tags.forEach(tag => {
            if (!this.entitiesByTag.has(tag)) {
                this.entitiesByTag.set(tag, new Set());
            }
            this.entitiesByTag.get(tag).add(entity);
        });
        
        console.log(`➕ Entity ${entity.id} added`);
    }
    
    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
            this.toRemove.push(entity);
        }
    }
    
    destroyEntity(entity) {
        if (!this.entities.has(entity.id)) return;
        
        // Remove from tag indices
        entity.tags.forEach(tag => {
            const taggedEntities = this.entitiesByTag.get(tag);
            if (taggedEntities) {
                taggedEntities.delete(entity);
                if (taggedEntities.size === 0) {
                    this.entitiesByTag.delete(tag);
                }
            }
        });
        
        // Destroy entity
        entity.destroy();
        this.entities.delete(entity.id);
        
        console.log(`➖ Entity ${entity.id} removed`);
    }
    
    getEntity(id) {
        return this.entities.get(id);
    }
    
    getEntitiesByTag(tag) {
        return Array.from(this.entitiesByTag.get(tag) || []);
    }
    
    getEntitiesWithComponent(ComponentClass) {
        const result = [];
        this.entities.forEach(entity => {
            if (entity.hasComponent(ComponentClass)) {
                result.push(entity);
            }
        });
        return result;
    }
    
    getEntitiesWithComponents(...ComponentClasses) {
        const result = [];
        this.entities.forEach(entity => {
            if (ComponentClasses.every(ComponentClass => entity.hasComponent(ComponentClass))) {
                result.push(entity);
            }
        });
        return result;
    }
    
    findEntitiesInRadius(position, radius, tag = null) {
        const result = [];
        const radiusSquared = radius * radius;
        
        const entitiesToCheck = tag ? this.getEntitiesByTag(tag) : Array.from(this.entities.values());
        
        entitiesToCheck.forEach(entity => {
            const distance = entity.transform.position.distanceToSquared(position);
            if (distance <= radiusSquared) {
                result.push({
                    entity,
                    distance: Math.sqrt(distance)
                });
            }
        });
        
        // Sort by distance
        result.sort((a, b) => a.distance - b.distance);
        
        return result;
    }
    
    findNearestEntity(position, tag = null, maxDistance = Infinity) {
        let nearest = null;
        let nearestDistance = maxDistance;
        
        const entitiesToCheck = tag ? this.getEntitiesByTag(tag) : Array.from(this.entities.values());
        
        entitiesToCheck.forEach(entity => {
            const distance = entity.transform.position.distanceTo(position);
            if (distance < nearestDistance) {
                nearest = entity;
                nearestDistance = distance;
            }
        });
        
        return nearest ? { entity: nearest, distance: nearestDistance } : null;
    }
    
    addSystem(system) {
        this.systems.push(system);
        system.entityManager = this;
        console.log(`⚙️ System ${system.constructor.name} added`);
    }
    
    removeSystem(SystemClass) {
        const index = this.systems.findIndex(system => system instanceof SystemClass);
        if (index !== -1) {
            this.systems.splice(index, 1);
            console.log(`⚙️ System ${SystemClass.name} removed`);
        }
    }
    
    update(deltaTime) {
        // Process pending additions and removals
        this.processPendingChanges();
        
        // Update all entities
        this.entities.forEach(entity => {
            entity.update(deltaTime);
        });
        
        // Update all systems
        this.systems.forEach(system => {
            if (system.update) {
                system.update(deltaTime);
            }
        });
    }
    
    processPendingChanges() {
        // Add pending entities
        this.toAdd.forEach(entity => {
            this.addEntity(entity);
        });
        this.toAdd.length = 0;
        
        // Remove pending entities
        this.toRemove.forEach(entity => {
            this.destroyEntity(entity);
        });
        this.toRemove.length = 0;
    }
    
    clear() {
        // Destroy all entities
        this.entities.forEach(entity => {
            entity.destroy();
        });
        
        this.entities.clear();
        this.entitiesByTag.clear();
        this.toAdd.length = 0;
        this.toRemove.length = 0;
        
        console.log('🗑️ EntityManager cleared');
    }
    
    getStats() {
        const componentCounts = new Map();
        const tagCounts = new Map();
        
        this.entities.forEach(entity => {
            // Count components
            entity.components.forEach((component, name) => {
                componentCounts.set(name, (componentCounts.get(name) || 0) + 1);
            });
            
            // Count tags
            entity.tags.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });
        
        return {
            totalEntities: this.entities.size,
            activeEntities: Array.from(this.entities.values()).filter(e => e.active).length,
            systems: this.systems.length,
            components: Object.fromEntries(componentCounts),
            tags: Object.fromEntries(tagCounts)
        };
    }
    
    // Serialization for save/load
    serialize() {
        const data = {
            entities: [],
            nextId: Entity.nextId
        };
        
        this.entities.forEach(entity => {
            const entityData = {
                id: entity.id,
                active: entity.active,
                tags: Array.from(entity.tags),
                transform: {
                    position: entity.transform.position.toArray(),
                    rotation: entity.transform.rotation.toArray(),
                    scale: entity.transform.scale.toArray()
                },
                components: {}
            };
            
            // Serialize components that support it
            entity.components.forEach((component, name) => {
                if (component.serialize) {
                    entityData.components[name] = component.serialize();
                }
            });
            
            data.entities.push(entityData);
        });
        
        return data;
    }
    
    deserialize(data) {
        this.clear();
        
        if (data.nextId) {
            Entity.nextId = data.nextId;
        }
        
        data.entities.forEach(entityData => {
            const entity = new Entity(entityData.id);
            entity.active = entityData.active;
            
            // Restore tags
            entityData.tags.forEach(tag => entity.addTag(tag));
            
            // Restore transform
            entity.transform.position.fromArray(entityData.transform.position);
            entity.transform.rotation.fromArray(entityData.transform.rotation);
            entity.transform.scale.fromArray(entityData.transform.scale);
            
            // TODO: Restore components (requires component registry)
            
            this.addEntity(entity);
        });
    }
}