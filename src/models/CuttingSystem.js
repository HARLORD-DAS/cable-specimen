import * as THREE from 'three';

/**
 * CuttingSystem.js
 * Dual-Function Precision Cable Cutting Head:
 * 1. Rotary Circumferential Scoring Head:
 *    - Annular rotary ring bearing driven by high-speed servo
 *    - Radial blade slide approaching and penetrating exact programmed sheath depth
 *    - 360° circumferential score orbit around the cable
 *    - Blade retract
 * 2. Longitudinal Slitting Head:
 *    - Linear ball-screw driven axial carriage
 *    - Slitter blade plunges into scored section and travels axially along cable axis
 */
export class CuttingSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'PrecisionCuttingSystem';
    this.group.position.set(-0.10, 0.50, 0.0); // Stationed right after clamp

    // Mechanical animation states
    this.circumferentialAngle = 0.0;
    this.radialPenetrationDepthMm = 0.0; // mm into outer layer
    this.maxCutDepthMm = 1.8; // mm (sheath thickness)
    this.isCircumferentialCutting = false;

    this.longitudinalSlitPositionMm = 0.0; // mm along X
    this.targetSlitLengthMm = 120.0; // mm
    this.isLongitudinalSlitting = false;

    this.interactiveObjects = [];

    this.initMaterials();
    this.buildRotaryCircumferentialHead();
    this.buildLongitudinalSlitter();
  }

  initMaterials() {
    // 1. Annular Ring Housing & Bearing Frame (Machined Aluminium #C8C8C6)
    this.matRotaryRing = new THREE.MeshStandardMaterial({
      color: 0xc8c8c6,
      roughness: 0.3,
      metalness: 0.75,
      name: 'RotaryRingHousing'
    });

    // 2. High-Hardness Ground Blade Steel (Mirror ground razor edge)
    this.matBladeSteel = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.96,
      name: 'HardenedBladeSteel'
    });

    // 3. Radial Blade Tool-Holder Slide (Anodized Dark Gray #1E293B)
    this.matToolHolder = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.65
    });

    // 4. Longitudinal Linear Carriage & Ball Screw
    this.matSlitterCarriage = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.7
    });
    this.matBallScrew = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.92
    });

    // 5. Servo Drive Motor for Ring Orbit
    this.matRingServo = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.6
    });
  }

  buildRotaryCircumferentialHead() {
    // Annular ring bearing surrounding the cable path
    this.ringAssembly = new THREE.Group();
    this.ringAssembly.position.set(0.0, 0.0, 0.0);

    // Outer stationary bearing housing
    const outerRingGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.045, 36, 1, true);
    outerRingGeo.rotateZ(Math.PI / 2);
    const outerRing = new THREE.Mesh(outerRingGeo, this.matRotaryRing);
    this.ringAssembly.add(outerRing);

    // Inner rotating ring rotor (Driven by servo to spin 360°)
    this.rotorGroup = new THREE.Group();

    const innerRotorGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.04, 36, 1, true);
    innerRotorGeo.rotateZ(Math.PI / 2);
    const innerRotor = new THREE.Mesh(innerRotorGeo, this.matRotaryRing);
    this.rotorGroup.add(innerRotor);

    // Radial Blade Slide mounted on rotating rotor
    this.radialSlide = new THREE.Group();
    this.radialSlide.position.set(0.0, 0.075, 0.0); // Starts retracted at R = 75mm

    const holderGeo = new THREE.BoxGeometry(0.02, 0.035, 0.025);
    const holderMesh = new THREE.Mesh(holderGeo, this.matToolHolder);
    this.radialSlide.add(holderMesh);

    // Precision ground circular scoring blade disc / chisel point
    const bladeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.0015, 24);
    bladeGeo.rotateX(Math.PI / 2);
    const bladeMesh = new THREE.Mesh(bladeGeo, this.matBladeSteel);
    bladeMesh.position.set(0.0, -0.016, 0.0);
    bladeMesh.castShadow = true;
    this.radialSlide.add(bladeMesh);

    this.rotorGroup.add(this.radialSlide);
    this.ringAssembly.add(this.rotorGroup);

    // Ring drive servo motor on top of housing
    const servoGroup = new THREE.Group();
    servoGroup.position.set(0.0, 0.18, 0.0);
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.12), this.matRingServo);
    servoGroup.add(sBody);
    this.ringAssembly.add(servoGroup);

    bladeMesh.userData = {
      name: 'Circumferential Rotary Scoring Blade',
      category: 'CUTTING_SYSTEM',
      description: 'Ultra-precision hardened tool steel rotary scoring disc with micrometer depth servo control.'
    };
    this.interactiveObjects.push(bladeMesh);

    this.group.add(this.ringAssembly);
  }

  buildLongitudinalSlitter() {
    // Longitudinal Slitter Unit mounted on an axial ball-screw rail
    this.slitterAssembly = new THREE.Group();
    this.slitterAssembly.position.set(0.12, 0.0, 0.0);

    // Overhead guide rail beam
    const beamGeo = new THREE.BoxGeometry(0.28, 0.025, 0.04);
    const railBeam = new THREE.Mesh(beamGeo, this.matSlitterCarriage);
    railBeam.position.set(0.08, 0.12, 0.0);
    this.slitterAssembly.add(railBeam);

    // Miniature ball screw shaft
    const screwGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.28, 16);
    screwGeo.rotateZ(Math.PI / 2);
    const ballScrew = new THREE.Mesh(screwGeo, this.matBallScrew);
    ballScrew.position.set(0.08, 0.10, 0.0);
    this.slitterAssembly.add(ballScrew);

    // Axial Traveling Slitter Carriage
    this.travelingCarriage = new THREE.Group();
    this.travelingCarriage.position.set(0.0, 0.0, 0.0);

    const cBodyGeo = new THREE.BoxGeometry(0.045, 0.06, 0.035);
    const cBody = new THREE.Mesh(cBodyGeo, this.matSlitterCarriage);
    cBody.position.y = 0.09;
    this.travelingCarriage.add(cBody);

    // Vertical slitter plunge cylinder
    const plungeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.045, 16);
    this.plungeRod = new THREE.Mesh(plungeGeo, this.matBallScrew);
    this.plungeRod.position.y = 0.055;
    this.travelingCarriage.add(this.plungeRod);

    // Hardened Razor-Sharp Slitting Blade
    const bladeGeo = new THREE.BoxGeometry(0.022, 0.028, 0.0015);
    this.slitterBlade = new THREE.Mesh(bladeGeo, this.matBladeSteel);
    this.slitterBlade.position.y = 0.026;
    this.slitterBlade.castShadow = true;
    this.travelingCarriage.add(this.slitterBlade);

    this.slitterAssembly.add(this.travelingCarriage);

    this.slitterBlade.userData = {
      name: 'Longitudinal Slitting Blade',
      category: 'CUTTING_SYSTEM',
      description: 'Axially traversing carbide slitting blade controlled by servo ball-screw for controlled outer jacket splitting.'
    };
    this.interactiveObjects.push(this.slitterBlade);

    this.group.add(this.slitterAssembly);
  }

  // -------------------------------------------------------------
  // ANIMATION METHODS
  // -------------------------------------------------------------

  setCircumferentialCut(orbitAngleRad, penetrationProgress, cableRadiusM = 0.012) {
    this.circumferentialAngle = orbitAngleRad;
    this.rotorGroup.rotation.x = orbitAngleRad;

    // penetrationProgress: 0.0 (retracted) -> 1.0 (cutting sheath depth)
    const retractedR = 0.055;
    // Cutting position: touches outer surface and penetrates sheath depth
    const cuttingR = cableRadiusM - 0.0005; // 0.5mm into layer
    const currentR = THREE.MathUtils.lerp(retractedR, cuttingR, penetrationProgress);

    this.radialSlide.position.y = currentR + 0.016; // Adjust for blade length
  }

  setLongitudinalSlit(axialTravelProgress, plungeProgress, targetCableRadiusM = 0.012) {
    // Plunge blade down to touch cable sheath
    const retractedY = 0.048;
    const slitY = targetCableRadiusM;
    const currentY = THREE.MathUtils.lerp(retractedY, slitY, plungeProgress);
    this.slitterBlade.position.y = currentY + 0.014;
    this.plungeRod.position.y = currentY + 0.038;

    // Travel axially along cable (+X)
    const maxTravel = (this.targetSlitLengthMm / 1000); // meters
    this.travelingCarriage.position.x = maxTravel * axialTravelProgress;
  }

  update(delta) {
    // Dynamic updates
  }

  setExploded(progress) {
    if (this.ringAssembly) this.ringAssembly.position.x = -progress * 0.15;
    if (this.radialSlide) this.radialSlide.position.y = 0.055 + progress * 0.12;
    if (this.slitterAssembly) this.slitterAssembly.position.y = progress * 0.18;
    if (this.travelingCarriage) this.travelingCarriage.position.z = -progress * 0.12;
  }
}

