// AAA Racing Championship - Car Models System

class CarModelManager {
    constructor() {
        this.cars = [
            {
                id: 'sport_coupe',
                name: 'Sport Coupe GT',
                type: 'sports',
                stats: {
                    speed: 85,
                    acceleration: 75,
                    handling: 80,
                    braking: 70
                },
                performance: {
                    maxSpeed: 320, // km/h
                    acceleration: 0.028,
                    turnSpeed: 0.06,
                    brakeForce: 0.95,
                    weight: 1200,
                    downforce: 0.3
                },
                colors: {
                    primary: 0xe63946,
                    secondary: 0x8b0000,
                    details: 0x333333
                }
            },
            {
                id: 'formula_racer',
                name: 'Formula X1',
                type: 'formula',
                stats: {
                    speed: 100,
                    acceleration: 95,
                    handling: 100,
                    braking: 90
                },
                performance: {
                    maxSpeed: 380,
                    acceleration: 0.035,
                    turnSpeed: 0.08,
                    brakeForce: 0.98,
                    weight: 700,
                    downforce: 0.8
                },
                colors: {
                    primary: 0x1d3557,
                    secondary: 0x457b9d,
                    details: 0xf1c40f
                }
            },
            {
                id: 'muscle_car',
                name: 'Thunder Muscle',
                type: 'muscle',
                stats: {
                    speed: 90,
                    acceleration: 85,
                    handling: 60,
                    braking: 75
                },
                performance: {
                    maxSpeed: 350,
                    acceleration: 0.032,
                    turnSpeed: 0.045,
                    brakeForce: 0.88,
                    weight: 1600,
                    downforce: 0.1
                },
                colors: {
                    primary: 0x2d5016,
                    secondary: 0x52734d,
                    details: 0x91a3b0
                }
            },
            {
                id: 'super_car',
                name: 'Apex Hypercar',
                type: 'supercar',
                stats: {
                    speed: 95,
                    acceleration: 90,
                    handling: 90,
                    braking: 85
                },
                performance: {
                    maxSpeed: 360,
                    acceleration: 0.033,
                    turnSpeed: 0.07,
                    brakeForce: 0.92,
                    weight: 1400,
                    downforce: 0.5
                },
                colors: {
                    primary: 0x6f2da8,
                    secondary: 0x9d4edd,
                    details: 0xc77dff
                }
            }
        ];
        
        this.currentCarIndex = 0;
        this.selectedCar = this.cars[0];
    }
    
    createCarModel(carData, scene) {
        const carGroup = new THREE.Group();
        carGroup.name = 'car_' + carData.id;
        
        switch(carData.type) {
            case 'sports':
                return this.createSportsCoupe(carData, carGroup);
            case 'formula':
                return this.createFormulaRacer(carData, carGroup);
            case 'muscle':
                return this.createMuscleCar(carData, carGroup);
            case 'supercar':
                return this.createSuperCar(carData, carGroup);
            default:
                return this.createSportsCoupe(carData, carGroup);
        }
    }
    
    createSportsCoupe(carData, carGroup) {
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(2.2, 0.6, 4.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.primary,
            shininess: 100,
            specular: 0x444444
        });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.set(0, 0.5, 0);
        carBody.castShadow = true;
        carGroup.add(carBody);
        
        // Hood
        const hoodGeometry = new THREE.BoxGeometry(2, 0.2, 1.5);
        const hoodMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.primary,
            shininess: 100
        });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.set(0, 0.9, 1.5);
        hood.castShadow = true;
        carGroup.add(hood);
        
        // Roof
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2.2);
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.secondary,
            shininess: 100
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 1.2, -0.3);
        roof.castShadow = true;
        carGroup.add(roof);
        
        // Spoiler
        const spoilerGeometry = new THREE.BoxGeometry(1.6, 0.1, 0.3);
        const spoilerMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.details
        });
        const spoiler = new THREE.Mesh(spoilerGeometry, spoilerMaterial);
        spoiler.position.set(0, 1.1, -2.3);
        spoiler.castShadow = true;
        carGroup.add(spoiler);
        
        // Wheels
        this.addWheels(carGroup, carData, [
            [-1.1, 0.35, 1.4],   // Front left
            [1.1, 0.35, 1.4],    // Front right
            [-1.1, 0.35, -1.4],  // Rear left
            [1.1, 0.35, -1.4]    // Rear right
        ], 0.35, 0.25);
        
        // Headlights
        this.addHeadlights(carGroup, [
            [-0.7, 0.8, 2.3],
            [0.7, 0.8, 2.3]
        ]);
        
        // Taillights
        this.addTaillights(carGroup, [
            [-0.8, 0.7, -2.3],
            [0.8, 0.7, -2.3]
        ]);
        
        return carGroup;
    }
    
    createFormulaRacer(carData, carGroup) {
        // Chassis (lower, longer, narrower)
        const chassisGeometry = new THREE.BoxGeometry(1.2, 0.3, 5);
        const chassisMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.primary,
            shininess: 150
        });
        const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassis.position.set(0, 0.3, 0);
        chassis.castShadow = true;
        carGroup.add(chassis);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.secondary,
            transparent: true,
            opacity: 0.3
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.8, 0.5);
        cockpit.castShadow = true;
        carGroup.add(cockpit);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(0.3, 1, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.details
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0.4, 3);
        nose.rotation.x = Math.PI / 2;
        nose.castShadow = true;
        carGroup.add(nose);
        
        // Front wing
        const frontWingGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.3);
        const frontWingMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.details
        });
        const frontWing = new THREE.Mesh(frontWingGeometry, frontWingMaterial);
        frontWing.position.set(0, 0.2, 2.2);
        frontWing.castShadow = true;
        carGroup.add(frontWing);
        
        // Rear wing
        const rearWingGeometry = new THREE.BoxGeometry(1.4, 0.1, 0.4);
        const rearWing = new THREE.Mesh(rearWingGeometry, frontWingMaterial);
        rearWing.position.set(0, 1.2, -2.2);
        rearWing.castShadow = true;
        carGroup.add(rearWing);
        
        // Wing supports
        const supportGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
        const leftSupport = new THREE.Mesh(supportGeometry, frontWingMaterial);
        leftSupport.position.set(-0.6, 0.8, -2.2);
        carGroup.add(leftSupport);
        
        const rightSupport = new THREE.Mesh(supportGeometry, frontWingMaterial);
        rightSupport.position.set(0.6, 0.8, -2.2);
        carGroup.add(rightSupport);
        
        // Formula wheels (larger, more exposed)
        this.addWheels(carGroup, carData, [
            [-0.8, 0.4, 1.8],    // Front left
            [0.8, 0.4, 1.8],     // Front right
            [-0.9, 0.45, -1.8],  // Rear left
            [0.9, 0.45, -1.8]    // Rear right
        ], 0.4, 0.2, true);
        
        return carGroup;
    }
    
    createMuscleCar(carData, carGroup) {
        // Wider, more aggressive body
        const bodyGeometry = new THREE.BoxGeometry(2.4, 0.7, 4.8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.primary,
            shininess: 80
        });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.set(0, 0.6, 0);
        carBody.castShadow = true;
        carGroup.add(carBody);
        
        // Aggressive hood with scoop
        const hoodGeometry = new THREE.BoxGeometry(2.2, 0.3, 1.8);
        const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
        hood.position.set(0, 1.0, 1.5);
        hood.castShadow = true;
        carGroup.add(hood);
        
        // Hood scoop
        const scoopGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.8);
        const scoopMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.details
        });
        const scoop = new THREE.Mesh(scoopGeometry, scoopMaterial);
        scoop.position.set(0, 1.25, 1.5);
        scoop.castShadow = true;
        carGroup.add(scoop);
        
        // Lower roof
        const roofGeometry = new THREE.BoxGeometry(2, 0.9, 2.5);
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.secondary
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 1.4, -0.2);
        roof.castShadow = true;
        carGroup.add(roof);
        
        // Wide wheels
        this.addWheels(carGroup, carData, [
            [-1.3, 0.4, 1.6],    // Front left
            [1.3, 0.4, 1.6],     // Front right
            [-1.3, 0.4, -1.6],   // Rear left
            [1.3, 0.4, -1.6]     // Rear right
        ], 0.4, 0.3);
        
        // Exhaust pipes
        const exhaustGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8);
        const exhaustMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            shininess: 100
        });
        
        const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        leftExhaust.position.set(-0.3, 0.3, -2.5);
        leftExhaust.rotation.x = Math.PI / 2;
        carGroup.add(leftExhaust);
        
        const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        rightExhaust.position.set(0.3, 0.3, -2.5);
        rightExhaust.rotation.x = Math.PI / 2;
        carGroup.add(rightExhaust);
        
        this.addHeadlights(carGroup, [
            [-0.8, 0.9, 2.5],
            [0.8, 0.9, 2.5]
        ]);
        
        this.addTaillights(carGroup, [
            [-0.9, 0.8, -2.5],
            [0.9, 0.8, -2.5]
        ]);
        
        return carGroup;
    }
    
    createSuperCar(carData, carGroup) {
        // Sleek, low-profile body
        const bodyGeometry = new THREE.BoxGeometry(2.1, 0.5, 4.6);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.primary,
            shininess: 150,
            specular: 0x666666
        });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.set(0, 0.4, 0);
        carBody.castShadow = true;
        carGroup.add(carBody);
        
        // Angular hood
        const hoodGeometry = new THREE.BoxGeometry(1.9, 0.15, 1.6);
        const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
        hood.position.set(0, 0.75, 1.6);
        hood.castShadow = true;
        carGroup.add(hood);
        
        // Low profile cockpit
        const cockpitGeometry = new THREE.BoxGeometry(1.6, 0.6, 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.secondary,
            transparent: true,
            opacity: 0.2
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 1.0, 0);
        cockpit.castShadow = true;
        carGroup.add(cockpit);
        
        // Active aerodynamics - rear wing
        const wingGeometry = new THREE.BoxGeometry(1.8, 0.08, 0.5);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.details
        });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set(0, 1.1, -2.4);
        wing.castShadow = true;
        carGroup.add(wing);
        
        // Side air intakes
        const intakeGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.8);
        const intakeMaterial = new THREE.MeshPhongMaterial({ 
            color: carData.colors.details
        });
        
        const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        leftIntake.position.set(-1.1, 0.7, 0.5);
        carGroup.add(leftIntake);
        
        const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
        rightIntake.position.set(1.1, 0.7, 0.5);
        carGroup.add(rightIntake);
        
        // Performance wheels
        this.addWheels(carGroup, carData, [
            [-1.15, 0.35, 1.5],  // Front left
            [1.15, 0.35, 1.5],   // Front right
            [-1.15, 0.35, -1.5], // Rear left
            [1.15, 0.35, -1.5]   // Rear right
        ], 0.35, 0.2);
        
        // LED headlights
        this.addHeadlights(carGroup, [
            [-0.6, 0.65, 2.4],
            [0.6, 0.65, 2.4]
        ], true);
        
        this.addTaillights(carGroup, [
            [-0.7, 0.6, -2.4],
            [0.7, 0.6, -2.4]
        ]);
        
        return carGroup;
    }
    
    addWheels(carGroup, carData, positions, radius, width, isFormula = false) {
        const wheelGeometry = new THREE.CylinderGeometry(radius, radius, width, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x222222,
            shininess: 30
        });
        
        const rimGeometry = new THREE.CylinderGeometry(radius * 0.7, radius * 0.7, width + 0.02, 8);
        const rimMaterial = new THREE.MeshPhongMaterial({ 
            color: isFormula ? 0xffd700 : 0x888888,
            shininess: 100
        });
        
        positions.forEach((pos, index) => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            carGroup.add(wheel);
            
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.position.set(pos[0], pos[1], pos[2]);
            rim.rotation.z = Math.PI / 2;
            rim.castShadow = true;
            carGroup.add(rim);
            
            // Store wheel reference for animation
            wheel.name = `wheel_${index}`;
            carGroup.wheels = carGroup.wheels || [];
            carGroup.wheels.push(wheel);
        });
    }
    
    addHeadlights(carGroup, positions, isLED = false) {
        const lightGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({ 
            color: isLED ? 0xaaaaff : 0xffffff,
            emissive: isLED ? 0x4444aa : 0x444444
        });
        
        positions.forEach(pos => {
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(pos[0], pos[1], pos[2]);
            carGroup.add(light);
        });
    }
    
    addTaillights(carGroup, positions) {
        const lightGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const lightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0x440000
        });
        
        positions.forEach(pos => {
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(pos[0], pos[1], pos[2]);
            carGroup.add(light);
        });
    }
    
    getCurrentCar() {
        return this.cars[this.currentCarIndex];
    }
    
    nextCar() {
        this.currentCarIndex = (this.currentCarIndex + 1) % this.cars.length;
        return this.getCurrentCar();
    }
    
    previousCar() {
        this.currentCarIndex = (this.currentCarIndex - 1 + this.cars.length) % this.cars.length;
        return this.getCurrentCar();
    }
    
    selectCar(carId) {
        const carIndex = this.cars.findIndex(car => car.id === carId);
        if (carIndex !== -1) {
            this.currentCarIndex = carIndex;
            this.selectedCar = this.cars[carIndex];
            return this.selectedCar;
        }
        return null;
    }
    
    getSelectedCar() {
        return this.selectedCar;
    }
    
    updateWheelRotation(carGroup, speed) {
        if (carGroup.wheels) {
            const rotation = speed * 0.1;
            carGroup.wheels.forEach(wheel => {
                wheel.rotation.x += rotation;
            });
        }
    }
}