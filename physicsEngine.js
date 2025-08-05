// AAA Racing Championship - Advanced Physics Engine

class PhysicsEngine {
    constructor(scene) {
        this.scene = scene;
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Enhanced collision detection
        this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
        this.world.defaultContactMaterial.contactEquationRelaxation = 4;
        this.world.defaultContactMaterial.friction = 0.4;
        this.world.defaultContactMaterial.restitution = 0.3;
        
        this.timeStep = 1 / 60;
        this.maxSubSteps = 3;
        
        this.vehicles = new Map();
        this.trackBodies = [];
        this.materials = {};
        
        this.init();
    }
    
    init() {
        this.createMaterials();
        this.createGround();
    }
    
    createMaterials() {
        // Tire material
        this.materials.tire = new CANNON.Material('tire');
        this.materials.tire.friction = 0.9;
        this.materials.tire.restitution = 0.1;
        
        // Ground material
        this.materials.ground = new CANNON.Material('ground');
        this.materials.ground.friction = 0.8;
        this.materials.ground.restitution = 0.1;
        
        // Track material (asphalt)
        this.materials.track = new CANNON.Material('track');
        this.materials.track.friction = 1.2;
        this.materials.track.restitution = 0.05;
        
        // Barrier material
        this.materials.barrier = new CANNON.Material('barrier');
        this.materials.barrier.friction = 0.3;
        this.materials.barrier.restitution = 0.8;
        
        // Grass material (off-track)
        this.materials.grass = new CANNON.Material('grass');
        this.materials.grass.friction = 0.4;
        this.materials.grass.restitution = 0.2;
        
        // Contact materials (material interactions)
        const tireGroundContact = new CANNON.ContactMaterial(
            this.materials.tire,
            this.materials.ground,
            { friction: 0.8, restitution: 0.1 }
        );
        
        const tireTrackContact = new CANNON.ContactMaterial(
            this.materials.tire,
            this.materials.track,
            { friction: 1.2, restitution: 0.05 }
        );
        
        const tireGrassContact = new CANNON.ContactMaterial(
            this.materials.tire,
            this.materials.grass,
            { friction: 0.4, restitution: 0.2 }
        );
        
        const carBarrierContact = new CANNON.ContactMaterial(
            this.materials.tire,
            this.materials.barrier,
            { friction: 0.3, restitution: 0.8 }
        );
        
        this.world.addContactMaterial(tireGroundContact);
        this.world.addContactMaterial(tireTrackContact);
        this.world.addContactMaterial(tireGrassContact);
        this.world.addContactMaterial(carBarrierContact);
    }
    
    createGround() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.add(groundBody);
    }
    
    createVehicle(carData, position, rotation) {
        const vehicle = new AdvancedVehicle(this, carData, position, rotation);
        this.vehicles.set(vehicle.id, vehicle);
        return vehicle;
    }
    
    createTrackPhysics(trackGeometry) {
        // Create track collision body
        const trackShape = new CANNON.Box(new CANNON.Vec3(100, 0.1, 100));
        const trackBody = new CANNON.Body({ mass: 0, material: this.materials.track });
        trackBody.addShape(trackShape);
        trackBody.position.set(0, -0.1, 0);
        this.world.add(trackBody);
        this.trackBodies.push(trackBody);
    }
    
    createBarrier(position, size) {
        const barrierShape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
        const barrierBody = new CANNON.Body({ mass: 0, material: this.materials.barrier });
        barrierBody.addShape(barrierShape);
        barrierBody.position.copy(position);
        this.world.add(barrierBody);
        this.trackBodies.push(barrierBody);
        return barrierBody;
    }
    
    update(deltaTime) {
        // Update physics world
        this.world.step(this.timeStep, deltaTime, this.maxSubSteps);
        
        // Update all vehicles
        this.vehicles.forEach(vehicle => {
            vehicle.update(deltaTime);
        });
    }
    
    removeVehicle(vehicleId) {
        const vehicle = this.vehicles.get(vehicleId);
        if (vehicle) {
            vehicle.destroy();
            this.vehicles.delete(vehicleId);
        }
    }
    
    reset() {
        this.vehicles.forEach(vehicle => {
            vehicle.reset();
        });
    }
}

class AdvancedVehicle {
    constructor(physicsEngine, carData, position, rotation) {
        this.physicsEngine = physicsEngine;
        this.world = physicsEngine.world;
        this.carData = carData;
        this.id = 'vehicle_' + Date.now();
        
        // Vehicle parameters
        this.mass = carData.performance.weight || 1200;
        this.maxSpeed = carData.performance.maxSpeed / 3.6; // Convert km/h to m/s
        this.acceleration = carData.performance.acceleration || 0.03;
        this.brakeForce = carData.performance.brakeForce || 0.9;
        this.turnSpeed = carData.performance.turnSpeed || 0.06;
        this.downforce = carData.performance.downforce || 0.3;
        
        // Physics bodies
        this.chassisBody = null;
        this.wheelBodies = [];
        this.constraints = [];
        
        // Vehicle state
        this.throttle = 0;
        this.brake = 0;
        this.steering = 0;
        this.currentSpeed = 0;
        this.engineRPM = 800;
        this.gear = 1;
        this.turboBoost = 0;
        
        // Tire physics
        this.tireGrip = 1.0;
        this.tireTempFL = 80; // Front Left
        this.tireTempFR = 80; // Front Right
        this.tireTempRL = 80; // Rear Left
        this.tireTempRR = 80; // Rear Right
        
        // Suspension
        this.suspensionStiffness = 100000;
        this.suspensionDamping = 2300;
        this.suspensionCompression = 4.4;
        this.suspensionRestLength = 0.6;
        
        // Aerodynamics
        this.dragCoefficient = 0.3;
        this.frontalArea = 2.2;
        this.airDensity = 1.225;
        
        this.init(position, rotation);
    }
    
    init(position, rotation) {
        this.createChassis(position, rotation);
        this.createWheels();
        this.createSuspension();
    }
    
    createChassis(position, rotation) {
        // Create chassis collision shape
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.3, 2));
        this.chassisBody = new CANNON.Body({ mass: this.mass });
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.position.set(position.x, position.y + 0.5, position.z);
        this.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
        
        // Add center of mass offset for better handling
        this.chassisBody.shapeOffsets[0].set(0, -0.2, 0);
        
        this.world.add(this.chassisBody);
    }
    
    createWheels() {
        const wheelPositions = [
            [-1, 0, 1.2],   // Front left
            [1, 0, 1.2],    // Front right
            [-1, 0, -1.2],  // Rear left
            [1, 0, -1.2]    // Rear right
        ];
        
        wheelPositions.forEach((pos, index) => {
            const wheelShape = new CANNON.Cylinder(0.35, 0.35, 0.2, 8);
            const wheelBody = new CANNON.Body({ 
                mass: 50,
                material: this.physicsEngine.materials.tire
            });
            wheelBody.addShape(wheelShape);
            
            // Position relative to chassis
            const worldPos = new CANNON.Vec3();
            this.chassisBody.pointToWorldFrame(new CANNON.Vec3(pos[0], pos[1], pos[2]), worldPos);
            wheelBody.position.copy(worldPos);
            
            // Rotate wheel to correct orientation
            wheelBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
            
            this.world.add(wheelBody);
            this.wheelBodies.push(wheelBody);
        });
    }
    
    createSuspension() {
        this.wheelBodies.forEach((wheelBody, index) => {
            const isFront = index < 2;
            
            // Point-to-point constraint for suspension
            const constraint = new CANNON.PointToPointConstraint(
                this.chassisBody,
                new CANNON.Vec3(
                    index % 2 === 0 ? -1 : 1,  // Left/Right
                    0,
                    isFront ? 1.2 : -1.2       // Front/Rear
                ),
                wheelBody,
                new CANNON.Vec3(0, 0, 0)
            );
            
            this.world.addConstraint(constraint);
            this.constraints.push(constraint);
            
            // Add spring behavior
            wheelBody.addEventListener('collide', (e) => {
                this.handleWheelCollision(index, e);
            });
        });
    }
    
    handleWheelCollision(wheelIndex, event) {
        const contact = event.contact;
        const other = event.target === this.wheelBodies[wheelIndex] ? event.body : event.target;
        
        // Calculate tire temperature based on sliding
        const relativeVelocity = new CANNON.Vec3();
        this.wheelBodies[wheelIndex].velocity.vsub(other.velocity, relativeVelocity);
        const sliding = relativeVelocity.length();
        
        // Update tire temperature
        this.updateTireTemperature(wheelIndex, sliding);
        
        // Emit particles based on surface type
        this.emitParticlesFromWheel(wheelIndex, contact, other.material, sliding);
    }
    
    updateTireTemperature(wheelIndex, sliding) {
        const heatGeneration = sliding * 0.5;
        const cooling = 0.02;
        
        switch(wheelIndex) {
            case 0: // Front Left
                this.tireTempFL = Math.min(150, this.tireTempFL + heatGeneration - cooling);
                break;
            case 1: // Front Right
                this.tireTempFR = Math.min(150, this.tireTempFR + heatGeneration - cooling);
                break;
            case 2: // Rear Left
                this.tireTempRL = Math.min(150, this.tireTempRL + heatGeneration - cooling);
                break;
            case 3: // Rear Right
                this.tireTempRR = Math.min(150, this.tireTempRR + heatGeneration - cooling);
                break;
        }
        
        // Update tire grip based on temperature
        this.updateTireGrip();
    }
    
    updateTireGrip() {
        const avgTemp = (this.tireTempFL + this.tireTempFR + this.tireTempRL + this.tireTempRR) / 4;
        
        // Optimal tire temperature is around 90-110°C
        if (avgTemp < 80) {
            this.tireGrip = 0.8; // Cold tires
        } else if (avgTemp > 120) {
            this.tireGrip = 0.7; // Overheated tires
        } else {
            this.tireGrip = 1.0; // Optimal temperature
        }
    }
    
    emitParticlesFromWheel(wheelIndex, contact, material, sliding) {
        if (!this.physicsEngine.scene.particleSystem) return;
        
        const wheelPos = this.wheelBodies[wheelIndex].position;
        const wheelVel = this.wheelBodies[wheelIndex].velocity;
        
        const position = new THREE.Vector3(wheelPos.x, wheelPos.y, wheelPos.z);
        const velocity = new THREE.Vector3(wheelVel.x, wheelVel.y, wheelVel.z);
        
        if (sliding > 2 && material === this.physicsEngine.materials.track) {
            // Tire smoke on asphalt
            this.physicsEngine.scene.particleSystem.emitTireSmoke(position, velocity, sliding * 0.2);
        } else if (material === this.physicsEngine.materials.grass) {
            // Dust on grass/dirt
            this.physicsEngine.scene.particleSystem.emitDust(position, velocity, sliding * 0.3);
        }
    }
    
    applyInput(throttle, brake, steering) {
        this.throttle = Math.max(0, Math.min(1, throttle));
        this.brake = Math.max(0, Math.min(1, brake));
        this.steering = Math.max(-1, Math.min(1, steering));
    }
    
    update(deltaTime) {
        this.updateEngine(deltaTime);
        this.updateSteering(deltaTime);
        this.updateAerodynamics(deltaTime);
        this.updateDownforce(deltaTime);
        this.updateTraction(deltaTime);
        this.updateStats();
    }
    
    updateEngine(deltaTime) {
        // Calculate engine force
        const targetRPM = 800 + this.throttle * 6000;
        this.engineRPM += (targetRPM - this.engineRPM) * deltaTime * 5;
        
        // Gear simulation
        const speed = this.chassisBody.velocity.length();
        this.currentSpeed = speed * 3.6; // Convert to km/h
        
        // Simple gear calculation
        if (this.currentSpeed > 60 && this.gear < 6) {
            this.gear = Math.min(6, Math.floor(this.currentSpeed / 50) + 1);
        } else if (this.currentSpeed < 30 && this.gear > 1) {
            this.gear = Math.max(1, Math.floor(this.currentSpeed / 50) + 1);
        }
        
        // Engine force calculation
        const engineForce = this.throttle * this.acceleration * this.mass * 20;
        const brakeForce = this.brake * this.brakeForce * this.mass * 15;
        
        // Apply forces to rear wheels (RWD simulation)
        const rearWheels = [this.wheelBodies[2], this.wheelBodies[3]];
        const forwardDirection = new CANNON.Vec3();
        this.chassisBody.quaternion.vmult(new CANNON.Vec3(0, 0, 1), forwardDirection);
        
        rearWheels.forEach(wheel => {
            if (this.throttle > 0) {
                const force = forwardDirection.scale(engineForce / 2);
                wheel.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));
            }
            
            if (this.brake > 0) {
                const brakeDirection = forwardDirection.scale(-brakeForce / 4);
                wheel.applyLocalForce(brakeDirection, new CANNON.Vec3(0, 0, 0));
            }
        });
        
        // Apply brake force to front wheels as well
        if (this.brake > 0) {
            const frontWheels = [this.wheelBodies[0], this.wheelBodies[1]];
            frontWheels.forEach(wheel => {
                const brakeDirection = forwardDirection.scale(-brakeForce / 4);
                wheel.applyLocalForce(brakeDirection, new CANNON.Vec3(0, 0, 0));
            });
        }
    }
    
    updateSteering(deltaTime) {
        if (Math.abs(this.steering) > 0.01) {
            const steerForce = this.steering * this.turnSpeed * this.tireGrip;
            const speed = this.chassisBody.velocity.length();
            const speedFactor = Math.min(1, speed / 10); // Reduce steering at low speeds
            
            // Apply steering torque
            const torque = new CANNON.Vec3(0, steerForce * speedFactor * this.mass, 0);
            this.chassisBody.applyTorque(torque);
            
            // Front wheel steering (visual and physics)
            const frontWheels = [this.wheelBodies[0], this.wheelBodies[1]];
            const rightDirection = new CANNON.Vec3();
            this.chassisBody.quaternion.vmult(new CANNON.Vec3(1, 0, 0), rightDirection);
            
            frontWheels.forEach(wheel => {
                const lateralForce = rightDirection.scale(steerForce * this.mass * 5);
                wheel.applyLocalForce(lateralForce, new CANNON.Vec3(0, 0, 0));
            });
        }
    }
    
    updateAerodynamics(deltaTime) {
        const velocity = this.chassisBody.velocity;
        const speed = velocity.length();
        
        if (speed > 1) {
            // Air resistance
            const dragForce = 0.5 * this.airDensity * this.dragCoefficient * this.frontalArea * speed * speed;
            const dragDirection = velocity.unit().negate();
            const drag = dragDirection.scale(dragForce);
            
            this.chassisBody.applyForce(drag, this.chassisBody.position);
        }
    }
    
    updateDownforce(deltaTime) {
        const speed = this.chassisBody.velocity.length();
        const downforceAmount = this.downforce * speed * speed * 0.01;
        
        // Apply downforce to improve grip at high speeds
        const downforce = new CANNON.Vec3(0, -downforceAmount, 0);
        this.chassisBody.applyForce(downforce, this.chassisBody.position);
    }
    
    updateTraction(deltaTime) {
        // Anti-lock braking system simulation
        if (this.brake > 0.8) {
            this.wheelBodies.forEach(wheel => {
                const wheelSpeed = wheel.angularVelocity.length();
                const chassisSpeed = this.chassisBody.velocity.length();
                
                if (wheelSpeed < chassisSpeed * 0.1) {
                    // Wheel is locking, reduce brake force
                    this.brake *= 0.8;
                }
            });
        }
    }
    
    updateStats() {
        // Update turbo boost
        if (this.throttle > 0.9 && this.currentSpeed > 100) {
            this.turboBoost = Math.min(1, this.turboBoost + 0.02);
        } else {
            this.turboBoost = Math.max(0, this.turboBoost - 0.01);
        }
    }
    
    getPosition() {
        return this.chassisBody.position;
    }
    
    getRotation() {
        return this.chassisBody.quaternion;
    }
    
    getVelocity() {
        return this.chassisBody.velocity;
    }
    
    getCurrentSpeed() {
        return this.currentSpeed;
    }
    
    getEngineRPM() {
        return this.engineRPM;
    }
    
    getGear() {
        return this.gear;
    }
    
    getTurboBoost() {
        return this.turboBoost;
    }
    
    getTireTemperatures() {
        return {
            frontLeft: this.tireTempFL,
            frontRight: this.tireTempFR,
            rearLeft: this.tireTempRL,
            rearRight: this.tireTempRR
        };
    }
    
    reset() {
        // Reset vehicle state
        this.chassisBody.position.set(0, 1, 0);
        this.chassisBody.quaternion.set(0, 0, 0, 1);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
        
        this.wheelBodies.forEach(wheel => {
            wheel.velocity.set(0, 0, 0);
            wheel.angularVelocity.set(0, 0, 0);
        });
        
        this.throttle = 0;
        this.brake = 0;
        this.steering = 0;
        this.currentSpeed = 0;
        this.engineRPM = 800;
        this.gear = 1;
        this.turboBoost = 0;
        
        this.tireTempFL = this.tireTempFR = this.tireTempRL = this.tireTempRR = 80;
        this.tireGrip = 1.0;
    }
    
    destroy() {
        // Remove physics bodies
        this.world.removeBody(this.chassisBody);
        this.wheelBodies.forEach(wheel => {
            this.world.removeBody(wheel);
        });
        
        // Remove constraints
        this.constraints.forEach(constraint => {
            this.world.removeConstraint(constraint);
        });
    }
}