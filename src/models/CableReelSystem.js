import * as THREE from 'three';

/**
 * CableReelSystem.js
 * Industrial Cable Payout Reel & Heavy-Duty Stand Assembly (Mounted at machine left: X = -2.75).
 * 
 * Features:
 * - Welded steel A-frame reel support stand with industrial graphite finish (#2B2E31)
 * - Ground steel central spindle axle with heavy pillow block bearings
 * - Large diameter wooden/steel cable spool drum with reinforced flanges and tie bolts
 * - Multi-layer coil of wound black cable that rotates during feeding
 * - Tangential payout cable section that unwinds off the reel and enters the Inlet System
 * - Spindle mechanical disc brake and encoder
 * - Exploded view disassembly support
 */
export class CableReelSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'CableReelPayoutSystem';
    this.group.position.set(-2.70, 0.46, 0.0); // Mounted to the left of universal inlet

    this.spoolAngle = 0.0;
    this.remainingCableMeters = 485.0;
    this.totalCableCapacityMeters = 500.0;
    this.tensionN = 45.0;
    this.spoolDiameterMm = 820.0;
    this.isBrakeEngaged = false;

    this.interactiveObjects = [];

    this.initMaterials();
    this.buildReelStand();
    this.buildSpoolDrum();
    this.buildPayoutGuide();
  }

  initMaterials() {
    // 1. Stand Framework: Dark Industrial Graphite (#2B2E31)
    this.matStand = new THREE.MeshStandardMaterial({
      color: 0x2b2e31,
      roughness: 0.45,
      metalness: 0.65,
      name: 'ReelStandGraphite'
    });

    // 2. Structural Steel Frame (#555A5E)
    this.matFrameGray = new THREE.MeshStandardMaterial({
      color: 0x555a5e,
      roughness: 0.40,
      metalness: 0.70,
      name: 'ReelFrameSteel'
    });

    // 3. Spool Wooden / Composite Flanges (Industrial Birch / Phenolic resin)
    this.matSpoolFlange = new THREE.MeshStandardMaterial({
      color: 0xb58b57, // Hardwood timber reel flange
      roughness: 0.75,
      metalness: 0.05,
      name: 'TimberSpoolFlange'
    });

    // 4. Spool Core Drum & Steel Center Flange Reinforcing Plate
    this.matSpoolSteel = new THREE.MeshStandardMaterial({
      color: 0x3e4246,
      roughness: 0.35,
      metalness: 0.80,
      name: 'SpoolHubSteel'
    });

    // 5. Spindle Axle (Ground Machined Chrome Steel)
    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.15,
      metalness: 0.95,
      name: 'ChromeAxle'
    });

    // 6. Wound Cable Coils on Reel (Matte Black PE Sheath)
    this.matWoundCable = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.48,
      metalness: 0.12,
      name: 'WoundCableCoil'
    });

    // 7. Disc Brake & Caliper
    this.matBrakeDisc = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.22,
      metalness: 0.90
    });
    this.matBrakeCaliper = new THREE.MeshStandardMaterial({
      color: 0xf2a900, // Amber accent caliper
      roughness: 0.35,
      metalness: 0.60
    });
  }

  buildReelStand() {
    this.standGroup = new THREE.Group();

    // Heavy floor base plate (welded tubular steel)
    const baseGeo = new THREE.BoxGeometry(0.70, 0.05, 0.85);
    const baseMesh = new THREE.Mesh(baseGeo, this.matStand);
    baseMesh.position.set(0.0, -0.435, 0.0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.standGroup.add(baseMesh);

    // Front & Rear A-Frame Triangular Upright Stanchions
    [-0.32, 0.32].forEach((zPos) => {
      // Left leg
      const legGeo = new THREE.BoxGeometry(0.06, 0.88, 0.06);
      const leftLeg = new THREE.Mesh(legGeo, this.matStand);
      leftLeg.position.set(-0.16, 0.0, zPos);
      leftLeg.rotation.z = -0.22;
      leftLeg.castShadow = true;
      this.standGroup.add(leftLeg);

      // Right leg
      const rightLeg = new THREE.Mesh(legGeo, this.matStand);
      rightLeg.position.set(0.16, 0.0, zPos);
      rightLeg.rotation.z = 0.22;
      rightLeg.castShadow = true;
      this.standGroup.add(rightLeg);

      // Top Pillow Block Bearing Housing
      const bearingGeo = new THREE.BoxGeometry(0.14, 0.10, 0.08);
      const bearing = new THREE.Mesh(bearingGeo, this.matFrameGray);
      bearing.position.set(0.0, 0.38, zPos);
      bearing.castShadow = true;
      this.standGroup.add(bearing);

      // Bearing grease nipple
      const nipple = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.015, 12), this.matChrome);
      nipple.position.set(0.0, 0.44, zPos);
      this.standGroup.add(nipple);
    });

    // Cross brace tie bar
    const braceGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.64, 16);
    const brace = new THREE.Mesh(braceGeo, this.matFrameGray);
    brace.position.set(0.0, -0.15, 0.0);
    this.standGroup.add(brace);

    // Spindle mechanical disc brake on rear side
    const brakeDiscGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.012, 32);
    brakeDiscGeo.rotateX(Math.PI / 2);
    this.brakeDisc = new THREE.Mesh(brakeDiscGeo, this.matBrakeDisc);
    this.brakeDisc.position.set(0.0, 0.38, -0.28);
    this.standGroup.add(this.brakeDisc);

    // Brake caliper
    const caliperGeo = new THREE.BoxGeometry(0.06, 0.08, 0.05);
    const caliper = new THREE.Mesh(caliperGeo, this.matBrakeCaliper);
    caliper.position.set(0.09, 0.42, -0.28);
    this.standGroup.add(caliper);

    this.group.add(this.standGroup);

    baseMesh.userData = {
      name: 'Cable Reel Pay-Off Stand',
      category: 'FEED_SYSTEM',
      status: 'STABLE',
      description: 'Heavy welded steel A-frame payout station with friction tension brake and bearing supports.'
    };
    this.interactiveObjects.push(baseMesh);
  }

  buildSpoolDrum() {
    // Spool Rotor Group (Rotates when feeding)
    this.spoolRotor = new THREE.Group();
    this.spoolRotor.position.set(0.0, 0.38, 0.0); // Spindle center

    // Central Spindle Axle Shaft (X = 0, Y = 0.38, Z across width)
    const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.74, 24);
    shaftGeo.rotateX(Math.PI / 2);
    this.spindleShaft = new THREE.Mesh(shaftGeo, this.matChrome);
    this.spoolRotor.add(this.spindleShaft);

    // Two Large Wooden Circular Flanges (Diameter = 0.82m)
    const flangeRadius = 0.41;
    const flangeThick = 0.028;
    const flangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeThick, 48);
    flangeGeo.rotateX(Math.PI / 2);

    // Steel Hub Reinforcing Plates
    const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, flangeThick + 0.004, 32);
    hubGeo.rotateX(Math.PI / 2);

    // Drive pin holes on flange
    [-0.24, 0.24].forEach((zOffset) => {
      const flange = new THREE.Mesh(flangeGeo, this.matSpoolFlange);
      flange.position.set(0.0, 0.0, zOffset);
      flange.castShadow = true;
      flange.receiveShadow = true;
      this.spoolRotor.add(flange);

      const hub = new THREE.Mesh(hubGeo, this.matSpoolSteel);
      hub.position.set(0.0, 0.0, zOffset);
      this.spoolRotor.add(hub);

      // Bolt heads in circular pattern
      for (let b = 0; b < 6; b++) {
        const angle = (b * Math.PI) / 3;
        const boltGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.008, 12);
        boltGeo.rotateX(Math.PI / 2);
        const bolt = new THREE.Mesh(boltGeo, this.matChrome);
        bolt.position.set(Math.cos(angle) * 0.10, Math.sin(angle) * 0.10, zOffset + (zOffset > 0 ? 0.016 : -0.016));
        this.spoolRotor.add(bolt);
      }
    });

    // Inner Core Barrel (Cylinder where cable is wound)
    const barrelRadius = 0.18;
    const barrelWidth = 0.45;
    const barrelGeo = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelWidth, 36);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, this.matSpoolSteel);
    this.spoolRotor.add(barrel);

    // Wound Cable Coil Layers (Visible cable bundle on spool)
    // Multiple concentric toroidal ridges representing coiled cable turns
    const coilOuterRadius = 0.36; // Full spool wound radius
    const coilWidth = 0.44;
    const coilGeo = new THREE.CylinderGeometry(coilOuterRadius, coilOuterRadius, coilWidth, 48);
    coilGeo.rotateX(Math.PI / 2);
    this.coilMesh = new THREE.Mesh(coilGeo, this.matWoundCable);
    this.coilMesh.castShadow = true;
    this.coilMesh.receiveShadow = true;
    this.spoolRotor.add(this.coilMesh);

    // Toroidal cable turn ridges to give photorealistic grooved coil appearance
    for (let r = -0.19; r <= 0.19; r += 0.038) {
      const turnGeo = new THREE.TorusGeometry(coilOuterRadius, 0.014, 12, 48);
      const turn = new THREE.Mesh(turnGeo, this.matWoundCable);
      turn.position.set(0.0, 0.0, r);
      this.spoolRotor.add(turn);
    }

    this.group.add(this.spoolRotor);

    this.coilMesh.userData = {
      name: 'Master Cable Supply Reel (Drum)',
      category: 'FEED_SYSTEM',
      status: 'READY',
      spoolDiameterMm: 820,
      remainingMeters: this.remainingCableMeters,
      tensionN: this.tensionN,
      description: 'Continuous payout drum wound with heavy-duty multi-core industrial cable. Features mechanical tension brake.'
    };
    this.interactiveObjects.push(this.coilMesh);
  }

  buildPayoutGuide() {
    // Tangential cable payout section leaving top of reel and traveling to Machine Universal Inlet
    // From Reel top (X = 0, Y = 0.38 + 0.36 = 0.74, Z = 0) down to Inlet (X = +0.55 relative, Y = 0.50, Z = 0)
    // In local space: starts at (0.05, 0.72, 0) and curves gently toward (+0.50, 0.50, 0)
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.05, 0.72, 0.0),
      new THREE.Vector3(0.20, 0.68, 0.0),
      new THREE.Vector3(0.35, 0.52, 0.0),
      new THREE.Vector3(0.50, 0.50, 0.0)
    );

    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.012, 16, false);
    this.payoutCable = new THREE.Mesh(tubeGeo, this.matWoundCable);
    this.payoutCable.castShadow = true;
    this.group.add(this.payoutCable);

    // Guide roller cradle at reel exit
    const cradleGroup = new THREE.Group();
    cradleGroup.position.set(0.40, 0.50, 0.0);

    const rGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.08, 16);
    rGeo.rotateX(Math.PI / 2);
    const guideRoller = new THREE.Mesh(rGeo, this.matFrameGray);
    guideRoller.position.y = -0.026;
    cradleGroup.add(guideRoller);

    this.group.add(cradleGroup);
  }

  // -------------------------------------------------------------
  // KINEMATICS & ANIMATION
  // -------------------------------------------------------------

  rotate(deltaDistanceMeters) {
    if (deltaDistanceMeters === 0) return;

    // Angle = Arc Length / Radius (Radius ~ 0.36m)
    const deltaAngle = deltaDistanceMeters / 0.36;
    this.spoolAngle -= deltaAngle; // Unwinds clockwise
    this.spoolRotor.rotation.z = this.spoolAngle;

    // Decrement remaining cable
    this.remainingCableMeters = Math.max(0, this.remainingCableMeters - deltaDistanceMeters);
  }

  setTension(tensionN) {
    this.tensionN = tensionN;
  }

  toggleBrake() {
    this.isBrakeEngaged = !this.isBrakeEngaged;
    this.matBrakeCaliper.color.setHex(this.isBrakeEngaged ? 0xe5484d : 0xf2a900);
    return this.isBrakeEngaged;
  }

  setExploded(progress) {
    // progress: 0.0 = assembled, 1.0 = fully exploded
    // Separates along Z and X axes logically:
    // Left flange moves -Z, Right flange moves +Z, Spindle moves +X, Stand drops -Y
    this.standGroup.position.y = -progress * 0.15;
    this.spindleShaft.position.x = progress * 0.35;
    this.brakeDisc.position.z = -0.28 - progress * 0.20;
    this.coilMesh.scale.set(1 - progress * 0.15, 1 - progress * 0.15, 1);
  }
}
