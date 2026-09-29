import * as THREE from 'three';

/**
 * StrippingSystem.js
 * Articulated Peeling Fingers & Layer Separation Mechanism.
 * Physically simulates:
 * APPROACH -> GRIP -> PULL -> PEEL -> SEPARATE -> REVEAL INTERNAL CORES & FILLER.
 *
 * Scored polymer outer sheath material is visibly peeled back and routed,
 * never magically disappearing.
 */
export class StrippingSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'StrippingAndPeelingSystem';
    this.group.position.set(0.24, 0.50, 0.0); // Mounted right after cutting head

    this.peelStrokeProgress = 0.0; // 0.0 to 1.0 (axial pulling stroke)
    this.gripCloseProgress = 0.0; // 0.0 = open, 1.0 = gripping flap
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildPeelingGantry();
    this.buildGripperFingers();
    this.buildCoreSeparatorWedge();
  }

  initMaterials() {
    // 1. Gripper Carrier & Linear Carriage (#334155)
    this.matCarriage = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.65
    });

    // 2. Articulated Gripping Fingers (Hardened Alloy Steel with Serrations)
    this.matGripperFingers = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
      name: 'PeelingGripperFingers'
    });

    // 3. Core Separation Wedge (Polished Smooth Stainless Steel)
    this.matSeparatorWedge = new THREE.MeshStandardMaterial({
      color: 0xdcfce7,
      roughness: 0.15,
      metalness: 0.85,
      name: 'CoreSeparatorWedge'
    });

    // 4. Pneumatic Pull Cylinders
    this.matPneumaticCyl = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.28,
      metalness: 0.78
    });
    this.matChromeRod = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.96
    });
  }

  buildPeelingGantry() {
    // Linear slide frame along X axis allowing axial peel pull stroke
    this.slideFrame = new THREE.Group();

    // Twin chrome guide shafts
    const shaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 16);
    shaftGeo.rotateZ(Math.PI / 2);

    const shaftTop = new THREE.Mesh(shaftGeo, this.matChromeRod);
    shaftTop.position.set(0.04, 0.12, 0.0);
    this.slideFrame.add(shaftTop);

    const shaftBot = new THREE.Mesh(shaftGeo, this.matChromeRod);
    shaftBot.position.set(0.04, -0.12, 0.0);
    this.slideFrame.add(shaftBot);

    // Pulling carriage sliding on the shafts
    this.pullingCarriage = new THREE.Group();
    this.pullingCarriage.position.set(0.0, 0.0, 0.0);

    const cBlockGeo = new THREE.BoxGeometry(0.06, 0.26, 0.08);
    const cBlock = new THREE.Mesh(cBlockGeo, this.matCarriage);
    this.pullingCarriage.add(cBlock);

    this.slideFrame.add(this.pullingCarriage);
    this.group.add(this.slideFrame);
  }

  buildGripperFingers() {
    // Upper and Lower Articulated Peeling Fingers
    // Upper Finger
    this.topFingerAssembly = new THREE.Group();
    this.topFingerAssembly.position.set(-0.03, 0.06, 0.0);

    const fingerGeo = new THREE.BoxGeometry(0.045, 0.012, 0.024);
    const topFinger = new THREE.Mesh(fingerGeo, this.matGripperFingers);
    topFinger.castShadow = true;
    this.topFingerAssembly.add(topFinger);

    // Knurled grip pad on tip
    const padGeo = new THREE.BoxGeometry(0.015, 0.006, 0.02);
    const topPad = new THREE.Mesh(padGeo, this.matCarriage);
    topPad.position.set(-0.018, -0.006, 0.0);
    this.topFingerAssembly.add(topPad);

    this.pullingCarriage.add(this.topFingerAssembly);

    // Lower Finger
    this.bottomFingerAssembly = new THREE.Group();
    this.bottomFingerAssembly.position.set(-0.03, -0.06, 0.0);

    const botFinger = new THREE.Mesh(fingerGeo, this.matGripperFingers);
    botFinger.castShadow = true;
    this.bottomFingerAssembly.add(botFinger);

    const botPad = new THREE.Mesh(padGeo, this.matCarriage);
    botPad.position.set(-0.018, 0.006, 0.0);
    this.bottomFingerAssembly.add(botPad);

    this.pullingCarriage.add(this.bottomFingerAssembly);

    topFinger.userData = {
      name: 'Pneumatic Peeling Gripper Finger (Upper)',
      category: 'STRIPPING_SYSTEM',
      description: 'Serrated pneumatic clamping claw for securing scored outer sheath during controlled peeling.'
    };
    botFinger.userData = {
      name: 'Pneumatic Peeling Gripper Finger (Lower)',
      category: 'STRIPPING_SYSTEM',
      description: 'Opposing synchronous gripper jaw.'
    };
    this.interactiveObjects.push(topFinger, botFinger);
  }

  buildCoreSeparatorWedge() {
    // Conical stainless steel wedge that gently spreads revealed cores apart
    this.separatorWedge = new THREE.Group();
    this.separatorWedge.position.set(0.12, 0.0, 0.0);

    const coneGeo = new THREE.ConeGeometry(0.018, 0.05, 24);
    coneGeo.rotateZ(-Math.PI / 2); // Points backwards into cable core center
    const coneMesh = new THREE.Mesh(coneGeo, this.matSeparatorWedge);
    coneMesh.castShadow = true;
    this.separatorWedge.add(coneMesh);

    // Mounting arm to machine bed
    const armGeo = new THREE.BoxGeometry(0.012, 0.12, 0.012);
    const armMesh = new THREE.Mesh(armGeo, this.matCarriage);
    armMesh.position.set(0.02, -0.06, 0.0);
    this.separatorWedge.add(armMesh);

    coneMesh.userData = {
      name: 'Internal Core Separation Wedge',
      category: 'STRIPPING_SYSTEM',
      description: 'Low-friction PTFE-coated core diverter wedge separating individual insulated phase cores from filler.'
    };
    this.interactiveObjects.push(coneMesh);

    this.group.add(this.separatorWedge);
  }

  setPeelState(gripProgress, pullProgress, cableRadiusM = 0.012) {
    this.gripCloseProgress = THREE.MathUtils.clamp(gripProgress, 0.0, 1.0);
    this.peelStrokeProgress = THREE.MathUtils.clamp(pullProgress, 0.0, 1.0);

    // Grip fingers move inward to touch cable flap
    const openY = 0.045;
    const gripY = cableRadiusM + 0.003;
    const currentY = THREE.MathUtils.lerp(openY, gripY, this.gripCloseProgress);

    this.topFingerAssembly.position.y = currentY;
    this.bottomFingerAssembly.position.y = -currentY;

    // Pull carriage travels backward along +X
    const maxPullM = 0.12; // 120mm pull stroke
    this.pullingCarriage.position.x = maxPullM * this.peelStrokeProgress;

    // Slight outward divergence of fingers during pull to peel flaps open
    if (this.peelStrokeProgress > 0.1) {
      this.topFingerAssembly.position.y += this.peelStrokeProgress * 0.018;
      this.bottomFingerAssembly.position.y -= this.peelStrokeProgress * 0.018;
    }
  }

  update(delta) {
    // Visual idle updates
  }
}
