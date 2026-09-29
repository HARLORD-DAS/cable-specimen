import * as THREE from 'three';

/**
 * ClampingSystem.js
 * Adaptive Precision V-Jaw Clamping Carriage.
 * Firmly clamps and locks the cable specimen during circumferential cutting,
 * longitudinal slitting, and stripping.
 *
 * Sequence:
 * FEED STOPS -> CLAMP CLOSES -> CUTTING BEGINS -> CUTTING FINISHES -> CLAMP OPENS.
 */
export class ClampingSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'AdaptiveClampingCarriage';
    this.group.position.set(-0.45, 0.50, 0.0); // Carriage position on bed

    this.clampProgress = 0.0; // 0.0 = fully open, 1.0 = locked tight on cable
    this.isClamped = false;
    this.targetCableRadius = 0.012; // meters
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildCarriageChassis();
    this.buildVJaws();
    this.buildActuatorCylinder();
  }

  initMaterials() {
    // 1. Carriage Baseplate (Ductile cast iron / heavy steel #334155)
    this.matCarriage = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.65,
      name: 'CarriageBaseplate'
    });

    // 2. Machined Hardened Steel V-Jaws with Serrated Grip Grooves
    this.matVJaws = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.22,
      metalness: 0.88,
      name: 'HardenedVJaws'
    });

    // 3. Pneumatic Double-Acting Cylinder (Anodized Silver Barrel, Brass Fittings)
    this.matCylinderBarrel = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.75
    });
    this.matPistonRod = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.95
    });
    this.matBrassFitting = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.8
    });
    this.matAirTube = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Polyurethane blue pneumatic tube
      roughness: 0.4,
      metalness: 0.1
    });
  }

  buildCarriageChassis() {
    // Linear guide slide block with recirculating ball linear bushings
    const baseGeo = new THREE.BoxGeometry(0.18, 0.035, 0.34);
    const baseMesh = new THREE.Mesh(baseGeo, this.matCarriage);
    baseMesh.position.set(0.0, -0.05, 0.0);
    baseMesh.castShadow = true;
    this.group.add(baseMesh);

    // Vertical mounting uprights
    const uprightGeo = new THREE.BoxGeometry(0.16, 0.22, 0.035);
    const rearUpright = new THREE.Mesh(uprightGeo, this.matCarriage);
    rearUpright.position.set(0.0, 0.05, -0.12);
    rearUpright.castShadow = true;
    this.group.add(rearUpright);

    const frontUpright = new THREE.Mesh(uprightGeo, this.matCarriage);
    frontUpright.position.set(0.0, 0.05, 0.12);
    frontUpright.castShadow = true;
    this.group.add(frontUpright);
  }

  buildVJaws() {
    // Opposing V-Grooved Clamping Jaws:
    // Top V-Jaw (moves down toward Y = 0)
    // Bottom V-Jaw (moves up toward Y = 0)
    const jawWidth = 0.09;
    const jawHeight = 0.045;
    const jawDepth = 0.07;

    this.topJawGroup = new THREE.Group();
    const topJawMesh = new THREE.Mesh(new THREE.BoxGeometry(jawWidth, jawHeight, jawDepth), this.matVJaws);
    topJawMesh.castShadow = true;
    this.topJawGroup.add(topJawMesh);

    this.bottomJawGroup = new THREE.Group();
    const bottomJawMesh = new THREE.Mesh(new THREE.BoxGeometry(jawWidth, jawHeight, jawDepth), this.matVJaws);
    bottomJawMesh.castShadow = true;
    this.bottomJawGroup.add(bottomJawMesh);

    this.group.add(this.topJawGroup);
    this.group.add(this.bottomJawGroup);

    topJawMesh.userData = {
      name: 'Adaptive Clamping V-Jaw (Upper)',
      category: 'CLAMPING_SYSTEM',
      description: 'Pneumatic toggle-actuated hardened steel V-jaw providing positive mechanical locking of cable during slitting.'
    };
    bottomJawMesh.userData = {
      name: 'Adaptive Clamping V-Jaw (Lower)',
      category: 'CLAMPING_SYSTEM',
      description: 'Opposing synchronous clamping jaw.'
    };
    this.interactiveObjects.push(topJawMesh, bottomJawMesh);

    this.updateJawPositions();
  }

  buildActuatorCylinder() {
    // Pneumatic overhead clamping cylinder mounted on top of the clamp carriage
    const cylGroup = new THREE.Group();
    cylGroup.position.set(0.0, 0.17, 0.0);

    const barrelGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.09, 24);
    const barrel = new THREE.Mesh(barrelGeo, this.matCylinderBarrel);
    barrel.castShadow = true;
    cylGroup.add(barrel);

    // Chrome piston rod extending downward into top jaw
    const rodGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.08, 16);
    this.pistonRod = new THREE.Mesh(rodGeo, this.matPistonRod);
    this.pistonRod.position.y = -0.045;
    cylGroup.add(this.pistonRod);

    // Brass pneumatic fittings
    const fitGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.015, 12);
    const fit1 = new THREE.Mesh(fitGeo, this.matBrassFitting);
    fit1.position.set(0.024, 0.03, 0.0);
    fit1.rotateZ(Math.PI / 2);
    cylGroup.add(fit1);

    const fit2 = new THREE.Mesh(fitGeo, this.matBrassFitting);
    fit2.position.set(0.024, -0.03, 0.0);
    fit2.rotateZ(Math.PI / 2);
    cylGroup.add(fit2);

    this.group.add(cylGroup);
  }

  setTargetCableRadius(radiusMeters) {
    this.targetCableRadius = radiusMeters;
    this.updateJawPositions();
  }

  setClampProgress(progress) {
    // progress: 0.0 = open (50mm clearance), 1.0 = clamped firmly on cable
    this.clampProgress = Math.min(1.0, Math.max(0.0, progress));
    this.isClamped = this.clampProgress >= 0.98;
    this.updateJawPositions();
  }

  updateJawPositions() {
    const openOffset = 0.048; // Jaw clearance when open
    // Closed position touches outer surface of cable
    const closedOffset = this.targetCableRadius + 0.0225; // jaw center offset
    const currentOffset = THREE.MathUtils.lerp(openOffset, closedOffset, this.clampProgress);

    this.topJawGroup.position.set(0.0, currentOffset, 0.0);
    this.bottomJawGroup.position.set(0.0, -currentOffset, 0.0);

    if (this.pistonRod) {
      this.pistonRod.position.y = -0.045 - (currentOffset - closedOffset) * 0.5;
    }
  }

  update(delta) {
    // Visual idle state
  }

  setExploded(progress) {
    if (this.topJawGroup) this.topJawGroup.position.y = 0.048 + progress * 0.16;
    if (this.bottomJawGroup) this.bottomJawGroup.position.y = -0.048 - progress * 0.16;
  }
}

