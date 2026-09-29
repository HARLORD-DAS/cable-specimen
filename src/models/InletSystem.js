import * as THREE from 'three';

/**
 * InletSystem.js
 * Universal Cable Inlet with 4-Roller Self-Centering Guide Mechanism.
 * Physically animates the radial infeed/centering motion:
 * CABLE DETECTED -> GUIDE ROLLERS MOVE RADIALLY -> CABLE CENTERED -> GUIDES LOCK -> FEED STARTS.
 */
export class InletSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'UniversalInletAssembly';
    this.group.position.set(-2.0, 0.50, 0.0); // Mounted at inlet datum

    this.centeringProgress = 0.0; // 0.0 = wide open (45mm gap), 1.0 = locked on cable
    this.currentGapRadius = 0.045; // meters
    this.targetCableRadius = 0.012; // meters (e.g. 24mm cable)
    this.isLocked = false;
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildMountingFlange();
    this.buildRadialGuideRollers();
    this.buildDetectionSensors();
  }

  initMaterials() {
    // 1. Machined Aluminium Inlet Funnel Flange
    this.matFlange = new THREE.MeshStandardMaterial({
      color: 0xc8c8c6,
      roughness: 0.35,
      metalness: 0.72,
      name: 'InletFlange'
    });

    // 2. Hardened Stainless Steel Guide Rollers
    this.matRollerSteel = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.9,
      name: 'GuideRollerSteel'
    });

    // 3. Linear Slide Carriages & Brass Lead Screws
    this.matSlideCarriage = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.6
    });
    this.matBrassScrew = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.8
    });

    // 4. Optical Cable Entry Proximity Sensor (Amber/Blue)
    this.matSensorHousing = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.5
    });
    this.matSensorLed = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  }

  buildMountingFlange() {
    // Heavy circular mounting ring with conical lead-in funnel
    const ringGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.035, 32);
    ringGeo.rotateZ(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.matFlange);
    ringMesh.castShadow = true;
    this.group.add(ringMesh);

    // Conical entry guide funnel
    const coneGeo = new THREE.ConeGeometry(0.08, 0.06, 32, 1, true);
    coneGeo.rotateZ(Math.PI / 2);
    const coneMesh = new THREE.Mesh(coneGeo, this.matFlange);
    coneMesh.position.x = -0.04;
    this.group.add(coneMesh);
  }

  buildRadialGuideRollers() {
    // 4 Self-Centering Guide Rollers arranged at 90° intervals:
    // Top (Y+), Bottom (Y-), Front (Z+), Rear (Z-)
    this.guideCarriages = [];
    this.guideRollers = [];

    const rollerGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.035, 24);
    const carriageGeo = new THREE.BoxGeometry(0.04, 0.03, 0.04);
    const screwGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.07, 12);

    const orientations = [
      { axis: 'Y', sign: 1, angle: 0, rotZ: 0, rotX: 0 },
      { axis: 'Y', sign: -1, angle: Math.PI, rotZ: 0, rotX: 0 },
      { axis: 'Z', sign: 1, angle: Math.PI / 2, rotZ: Math.PI / 2, rotX: 0 },
      { axis: 'Z', sign: -1, angle: -Math.PI / 2, rotZ: Math.PI / 2, rotX: 0 }
    ];

    orientations.forEach((orient) => {
      const carriageGroup = new THREE.Group();

      // Lead screw shaft
      const screw = new THREE.Mesh(screwGeo, this.matBrassScrew);
      screw.position.set(0, orient.axis === 'Y' ? orient.sign * 0.07 : 0, orient.axis === 'Z' ? orient.sign * 0.07 : 0);
      carriageGroup.add(screw);

      // Slide Carriage block
      const carriage = new THREE.Mesh(carriageGeo, this.matSlideCarriage);
      carriageGroup.add(carriage);

      // Cylindrical ground guide roller
      const roller = new THREE.Mesh(rollerGeo, this.matRollerSteel);
      roller.castShadow = true;
      if (orient.rotZ) roller.rotateZ(orient.rotZ);
      carriageGroup.add(roller);

      carriage.userData = {
        name: `Inlet Self-Centering Guide Roller (${orient.axis}${orient.sign > 0 ? '+' : '-'})`,
        category: 'INLET',
        description: 'Synchronized servo-driven radial centering roller with low-friction needle bearings.'
      };
      this.interactiveObjects.push(carriage);

      this.group.add(carriageGroup);
      this.guideCarriages.push({ group: carriageGroup, orient });
      this.guideRollers.push(roller);
    });

    this.updateRadialPositions();
  }

  buildDetectionSensors() {
    // Optical photoelectric retroreflective sensor detecting raw cable presence
    this.sensorGroup = new THREE.Group();
    this.sensorGroup.position.set(-0.08, 0.08, 0.06);

    const bodyGeo = new THREE.BoxGeometry(0.024, 0.045, 0.024);
    const body = new THREE.Mesh(bodyGeo, this.matSensorHousing);
    this.sensorGroup.add(body);

    const ledGeo = new THREE.SphereGeometry(0.005, 12, 12);
    this.sensorLedMesh = new THREE.Mesh(ledGeo, this.matSensorLed);
    this.sensorLedMesh.position.set(0, 0.02, 0.013);
    this.sensorGroup.add(this.sensorLedMesh);

    // Emitted infrared/laser beam simulation
    const beamGeo = new THREE.CylinderGeometry(0.001, 0.001, 0.12, 8);
    this.sensorBeamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.6
    });
    this.sensorBeam = new THREE.Mesh(beamGeo, this.sensorBeamMat);
    this.sensorBeam.position.set(0, -0.06, -0.04);
    this.sensorBeam.rotateX(Math.PI / 4);
    this.sensorGroup.add(this.sensorBeam);

    this.group.add(this.sensorGroup);
  }

  setTargetCableRadius(radiusMeters) {
    this.targetCableRadius = radiusMeters;
  }

  setCenteringProgress(progress) {
    // progress: 0.0 (wide open) to 1.0 (firmly centered & locked)
    this.centeringProgress = Math.min(1.0, Math.max(0.0, progress));
    const openRadius = 0.042;
    // Closed position equals target cable radius + roller radius (0.018m)
    const closedCenter = this.targetCableRadius + 0.018;
    this.currentGapRadius = THREE.MathUtils.lerp(openRadius, closedCenter, this.centeringProgress);
    this.isLocked = this.centeringProgress >= 0.98;
    this.updateRadialPositions();
  }

  updateRadialPositions() {
    this.guideCarriages.forEach(({ group, orient }) => {
      const pos = orient.sign * this.currentGapRadius;
      if (orient.axis === 'Y') {
        group.position.set(0.02, pos, 0.0);
      } else {
        group.position.set(0.02, 0.0, pos);
      }
    });
  }

  update(delta, isFeeding = false) {
    // Rollers rotate when cable is moving through them
    if (isFeeding) {
      const rollDelta = delta * 4.5;
      this.guideRollers.forEach(r => {
        r.rotation.y += rollDelta;
      });
    }
  }
}
