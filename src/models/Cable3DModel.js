import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';

/**
 * Cable3DModel.js
 * High-Fidelity 3D Physical Cable Model.
 * Accurately implements Reference Image 1 (Multi-Core Power Cable with outer sheath,
 * filler, 4 XLPE insulated cores with distinct phase colors and stranded conductors)
 * and Reference Image 2 (Shielded Instrumentation Cable with outer sheath, basket-weave
 * wire armor, jacket, aluminium foil shield, and twisted triad).
 *
 * Physically simulates:
 * - Dynamic continuous feed along the machine axis
 * - Progressive straightening (curved input -> straight output)
 * - Circumferential scoring ring
 * - Longitudinal slit opening
 * - Mechanical peeling (outer flaps peel backward and curl, exposing internal layers)
 * - Layer separation and core isolation
 */
export class Cable3DModel {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.group.name = 'PhysicalCableAssembly';

    // Cable specification configuration
    this.cableType = options.cableType || 'POWER'; // 'POWER', 'SHIELDED', 'CUSTOM'
    this.conductorMaterial = options.conductorMaterial || 'COPPER'; // 'COPPER', 'ALUMINIUM'
    this.insulationType = options.insulationType || 'XLPE'; // 'XLPE', 'PVC'
    this.sheathType = options.sheathType || 'PE_PVC'; // 'PE_PVC'
    this.coreCount = options.coreCount || 4; // 1, 2, 3, 4
    this.hasArmor = options.hasArmor ?? (this.cableType === 'SHIELDED');
    this.outerDiameter = options.outerDiameter || (this.cableType === 'POWER' ? 24.0 : 18.0); // mm

    // Physical state variables
    this.feedDistance = 0.0; // mm
    this.straightnessFactor = 0.0; // 0.0 = curved inlet, 1.0 = fully straight
    this.cutState = 'INTACT'; // 'INTACT', 'SCORED', 'SLIT', 'PEELED', 'SEPARATED'
    this.peelAngle = 0.0; // 0 to 1.2 rad (peeling open)
    this.slitLength = 100.0; // mm

    // Textures & shared materials
    this.initMaterials();
    this.buildCableGeometry();
  }

  initMaterials() {
    this.armorTexture = TextureGenerator.createArmorBraidTexture();
    this.foilTexture = TextureGenerator.createAluFoilTexture();
    this.fillerTexture = TextureGenerator.createFillerTexture();

    // 1. Black Outer Sheath (PE/PVC matte polymer with subtle specular)
    this.matSheath = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.42,
      metalness: 0.12,
      name: 'Sheath_PE_PVC'
    });

    // 2. Interstitial Filler (Chalky cream fibrous polymer)
    this.matFiller = new THREE.MeshStandardMaterial({
      map: this.fillerTexture,
      color: 0xf4f1ea,
      roughness: 0.85,
      metalness: 0.02,
      name: 'Filler_Fibrous'
    });

    // 3. Conductors: Authentic Copper vs Aluminium
    this.matCopper = new THREE.MeshStandardMaterial({
      color: 0xc86432,
      roughness: 0.28,
      metalness: 0.85,
      name: 'Conductor_Copper'
    });

    this.matAluminium = new THREE.MeshStandardMaterial({
      color: 0xd4d8de,
      roughness: 0.32,
      metalness: 0.82,
      name: 'Conductor_Aluminium'
    });

    // 4. XLPE Insulation Core Colors (Ref 1: Neutral Blue, Phase Red, Yellow, Green/Teal)
    this.matXLPEBlue = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Neutral blue
      roughness: 0.35,
      metalness: 0.15,
      name: 'Insulation_XLPE_Neutral'
    });

    this.matXLPERed = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Phase Red
      roughness: 0.35,
      metalness: 0.15,
      name: 'Insulation_XLPE_Red'
    });

    this.matXLPEYellow = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Phase Yellow
      roughness: 0.35,
      metalness: 0.15,
      name: 'Insulation_XLPE_Yellow'
    });

    this.matXLPEGreen = new THREE.MeshStandardMaterial({
      color: 0x059669, // Phase Green/Teal
      roughness: 0.35,
      metalness: 0.15,
      name: 'Insulation_XLPE_Green'
    });

    this.matXLPEWhite = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.38,
      metalness: 0.1,
      name: 'Insulation_XLPE_White'
    });

    // 5. Shielding & Armor (Ref 2)
    this.matArmor = new THREE.MeshStandardMaterial({
      map: this.armorTexture,
      roughness: 0.45,
      metalness: 0.75,
      name: 'Armor_BasketWeave'
    });

    this.matFoilShield = new THREE.MeshStandardMaterial({
      map: this.foilTexture,
      roughness: 0.25,
      metalness: 0.88,
      name: 'Shield_AluFoil'
    });

    this.matJacket = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.5,
      metalness: 0.08,
      name: 'Jacket_Inner'
    });

    // Scoring line material (sharp cut groove)
    this.matCutGroove = new THREE.MeshBasicMaterial({
      color: 0x09090b,
      wireframe: false
    });
  }

  buildCableGeometry() {
    // Clear any previous meshes
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }

    const scaleMmToM = 0.001; // 1 unit = 1 meter in world space
    const radius = (this.outerDiameter * 0.5) * scaleMmToM;
    this.cableRadiusM = radius;

    // Cable is composed of 3 physical sections along X axis:
    // 1. Input curved section (before straightener: X < -1.4)
    // 2. Straightened body section (-1.4 <= X <= 0.0)
    // 3. Processed / stripped lead section (X > 0.0)

    this.cableRoot = new THREE.Group();
    this.group.add(this.cableRoot);

    // Build internal cores assembly
    this.coresGroup = new THREE.Group();
    this.cableRoot.add(this.coresGroup);

    // Build outer sheath assembly (including peel flaps)
    this.sheathGroup = new THREE.Group();
    this.cableRoot.add(this.sheathGroup);

    if (this.cableType === 'POWER') {
      this.buildMultiCorePowerCable(radius);
    } else if (this.cableType === 'SHIELDED') {
      this.buildShieldedInstrumentationCable(radius);
    } else {
      this.buildCustomCable(radius);
    }
  }

  // -------------------------------------------------------------
  // CABLE TYPE A: MULTI-CORE POWER CABLE (REFERENCE 1)
  // -------------------------------------------------------------
  buildMultiCorePowerCable(outerRadius) {
    const cableLength = 2.4; // 2.4 meters long cable path
    const sheathThickness = outerRadius * 0.16;
    const coreRadius = outerRadius * 0.36;
    const conductorRadius = coreRadius * 0.62;
    const coreOffset = outerRadius * 0.44;

    const conductorMat = this.conductorMaterial === 'COPPER' ? this.matCopper : this.matAluminium;

    // 1. Interstitial Filler Core Body (Fills space inside sheath)
    const fillerGeo = new THREE.CylinderGeometry(outerRadius - sheathThickness, outerRadius - sheathThickness, cableLength, 32);
    fillerGeo.rotateZ(Math.PI / 2);
    this.fillerMesh = new THREE.Mesh(fillerGeo, this.matFiller);
    this.fillerMesh.castShadow = true;
    this.fillerMesh.receiveShadow = true;
    this.coresGroup.add(this.fillerMesh);

    // 2. Four Physical Insulated Cores with Individual Conductors
    // Angles: Neutral at top (90°), Phase Red (0°), Phase Yellow (270°), Phase Green (180°)
    const coreConfigs = [
      { angle: Math.PI / 2, matInsul: this.matXLPEBlue, name: 'Neutral_Core' },
      { angle: 0, matInsul: this.matXLPERed, name: 'Phase_Red_Core' },
      { angle: -Math.PI / 2, matInsul: this.matXLPEYellow, name: 'Phase_Yellow_Core' },
      { angle: Math.PI, matInsul: this.matXLPEGreen, name: 'Phase_Green_Core' }
    ];

    this.coreMeshes = [];
    this.conductorMeshes = [];

    coreConfigs.forEach((cfg) => {
      const coreSubGroup = new THREE.Group();
      const cy = Math.sin(cfg.angle) * coreOffset;
      const cz = Math.cos(cfg.angle) * coreOffset;
      coreSubGroup.position.set(0, cy, cz);

      // Insulation cylinder
      const insulGeo = new THREE.CylinderGeometry(coreRadius, coreRadius, cableLength, 24);
      insulGeo.rotateZ(Math.PI / 2);
      const insulMesh = new THREE.Mesh(insulGeo, cfg.matInsul);
      insulMesh.castShadow = true;
      insulMesh.receiveShadow = true;
      coreSubGroup.add(insulMesh);
      this.coreMeshes.push(insulMesh);

      // Stranded Conductor (Center + 6 outer strands)
      const strandRadius = conductorRadius * 0.36;
      const strandGeo = new THREE.CylinderGeometry(strandRadius, strandRadius, cableLength, 12);
      strandGeo.rotateZ(Math.PI / 2);

      // Center strand
      const centerStrand = new THREE.Mesh(strandGeo, conductorMat);
      centerStrand.castShadow = true;
      coreSubGroup.add(centerStrand);
      this.conductorMeshes.push(centerStrand);

      // Outer 6 twisted/ring strands
      for (let s = 0; s < 6; s++) {
        const sAngle = (s * Math.PI) / 3;
        const sMesh = new THREE.Mesh(strandGeo, conductorMat);
        sMesh.position.set(0, Math.sin(sAngle) * (conductorRadius * 0.65), Math.cos(sAngle) * (conductorRadius * 0.65));
        sMesh.castShadow = true;
        coreSubGroup.add(sMesh);
        this.conductorMeshes.push(sMesh);
      }

      this.coresGroup.add(coreSubGroup);
    });

    // 3. Outer Sheath Cylinder (Main body)
    const mainSheathLen = cableLength * 0.75;
    const sheathGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, mainSheathLen, 32);
    sheathGeo.rotateZ(Math.PI / 2);
    this.mainSheathMesh = new THREE.Mesh(sheathGeo, this.matSheath);
    this.mainSheathMesh.position.x = -cableLength * 0.125;
    this.mainSheathMesh.castShadow = true;
    this.mainSheathMesh.receiveShadow = true;
    this.sheathGroup.add(this.mainSheathMesh);

    // 4. Peeling Sheath Flaps (Upper and Lower articulated halves for peeling animation)
    const peelLen = 0.18; // 180mm stripped section
    this.peelFlapTop = this.createSheathHalfFlap(outerRadius, peelLen, 'TOP');
    this.peelFlapBottom = this.createSheathHalfFlap(outerRadius, peelLen, 'BOTTOM');

    this.peelFlapTop.position.set(mainSheathLen * 0.5 - cableLength * 0.125, 0, 0);
    this.peelFlapBottom.position.set(mainSheathLen * 0.5 - cableLength * 0.125, 0, 0);
    this.peelBaseX = this.peelFlapTop.position.x;

    this.sheathGroup.add(this.peelFlapTop);
    this.sheathGroup.add(this.peelFlapBottom);

    // 5. Score ring indicator (groove)
    const scoreGeo = new THREE.TorusGeometry(outerRadius * 1.002, 0.0006, 8, 32);
    scoreGeo.rotateY(Math.PI / 2);
    this.scoreRingMesh = new THREE.Mesh(scoreGeo, this.matCutGroove);
    this.scoreRingMesh.position.copy(this.peelFlapTop.position);
    this.scoreRingMesh.visible = false;
    this.sheathGroup.add(this.scoreRingMesh);
  }

  // -------------------------------------------------------------
  // CABLE TYPE B: SHIELDED CONTROL / INSTRUMENTATION (REFERENCE 2)
  // -------------------------------------------------------------
  buildShieldedInstrumentationCable(outerRadius) {
    const cableLength = 2.4;
    const sheathR = outerRadius;
    const armorR = outerRadius * 0.90;
    const jacketR = outerRadius * 0.80;
    const shieldR = outerRadius * 0.68;
    const triadCoreR = outerRadius * 0.28;
    const condR = triadCoreR * 0.55;

    const conductorMat = this.conductorMaterial === 'COPPER' ? this.matCopper : this.matAluminium;

    // 1. Twisted Triad Cores (Black, White, Red) per Ref 2
    const triadColors = [this.matXLPERed, this.matXLPEWhite, this.matSheath];
    this.triadGroup = new THREE.Group();

    for (let c = 0; c < 3; c++) {
      const angle = (c * 2 * Math.PI) / 3;
      const coreG = new THREE.Group();
      coreG.position.set(0, Math.sin(angle) * (outerRadius * 0.32), Math.cos(angle) * (outerRadius * 0.32));

      const insulGeo = new THREE.CylinderGeometry(triadCoreR, triadCoreR, cableLength, 20);
      insulGeo.rotateZ(Math.PI / 2);
      const insMesh = new THREE.Mesh(insulGeo, triadColors[c]);
      insMesh.castShadow = true;
      coreG.add(insMesh);

      // Bare tinned copper conductor inside
      const cGeo = new THREE.CylinderGeometry(condR, condR, cableLength, 12);
      cGeo.rotateZ(Math.PI / 2);
      const cMesh = new THREE.Mesh(cGeo, conductorMat);
      coreG.add(cMesh);

      this.triadGroup.add(coreG);
    }

    // Bare tinned drain wire alongside triad
    const drainGeo = new THREE.CylinderGeometry(condR * 0.5, condR * 0.5, cableLength, 8);
    drainGeo.rotateZ(Math.PI / 2);
    const drainMesh = new THREE.Mesh(drainGeo, this.matAluminium);
    drainMesh.position.set(0, 0, 0);
    this.triadGroup.add(drainMesh);

    this.coresGroup.add(this.triadGroup);

    // 2. Aluminium Foil Shield layer
    const foilGeo = new THREE.CylinderGeometry(shieldR, shieldR, cableLength * 0.92, 28);
    foilGeo.rotateZ(Math.PI / 2);
    this.foilMesh = new THREE.Mesh(foilGeo, this.matFoilShield);
    this.foilMesh.position.x = -cableLength * 0.04;
    this.coresGroup.add(this.foilMesh);

    // 3. Flame Retardant Inner Jacket
    const jacketGeo = new THREE.CylinderGeometry(jacketR, jacketR, cableLength * 0.86, 28);
    jacketGeo.rotateZ(Math.PI / 2);
    this.jacketMesh = new THREE.Mesh(jacketGeo, this.matJacket);
    this.jacketMesh.position.x = -cableLength * 0.07;
    this.coresGroup.add(this.jacketMesh);

    // 4. Basket-Weave Wire Armor (Bronze braid)
    const armorGeo = new THREE.CylinderGeometry(armorR, armorR, cableLength * 0.80, 28);
    armorGeo.rotateZ(Math.PI / 2);
    this.armorMesh = new THREE.Mesh(armorGeo, this.matArmor);
    this.armorMesh.position.x = -cableLength * 0.10;
    this.coresGroup.add(this.armorMesh);

    // 5. Outer Sheath Cylinder
    const sheathLen = cableLength * 0.74;
    const sheathGeo = new THREE.CylinderGeometry(sheathR, sheathR, sheathLen, 32);
    sheathGeo.rotateZ(Math.PI / 2);
    this.mainSheathMesh = new THREE.Mesh(sheathGeo, this.matSheath);
    this.mainSheathMesh.position.x = -cableLength * 0.13;
    this.sheathGroup.add(this.mainSheathMesh);

    // 6. Peeling Flaps
    const peelLen = 0.16;
    this.peelFlapTop = this.createSheathHalfFlap(sheathR, peelLen, 'TOP');
    this.peelFlapBottom = this.createSheathHalfFlap(sheathR, peelLen, 'BOTTOM');

    this.peelFlapTop.position.set(sheathLen * 0.5 - cableLength * 0.13, 0, 0);
    this.peelFlapBottom.position.set(sheathLen * 0.5 - cableLength * 0.13, 0, 0);
    this.peelBaseX = this.peelFlapTop.position.x;

    this.sheathGroup.add(this.peelFlapTop);
    this.sheathGroup.add(this.peelFlapBottom);

    // Score ring
    const scoreGeo = new THREE.TorusGeometry(sheathR * 1.002, 0.0006, 8, 32);
    scoreGeo.rotateY(Math.PI / 2);
    this.scoreRingMesh = new THREE.Mesh(scoreGeo, this.matCutGroove);
    this.scoreRingMesh.position.copy(this.peelFlapTop.position);
    this.scoreRingMesh.visible = false;
    this.sheathGroup.add(this.scoreRingMesh);
  }

  // -------------------------------------------------------------
  // CABLE TYPE C: CUSTOM CONFIGURABLE CABLE
  // -------------------------------------------------------------
  buildCustomCable(outerRadius) {
    this.buildMultiCorePowerCable(outerRadius);
  }

  // Creates an articulated semi-cylindrical flap that can rotate/peel outward
  createSheathHalfFlap(radius, length, position = 'TOP') {
    const flapGroup = new THREE.Group();

    // Semi-cylinder geometry (arc from 0 to PI)
    const arcStart = position === 'TOP' ? 0 : Math.PI;
    const flapGeo = new THREE.CylinderGeometry(radius, radius, length, 24, 1, false, arcStart, Math.PI);
    flapGeo.rotateZ(Math.PI / 2);
    // Offset pivot to flap root so rotation peels it backward
    flapGeo.translate(-length * 0.5, 0, 0);

    const flapMesh = new THREE.Mesh(flapGeo, this.matSheath);
    flapMesh.castShadow = true;
    flapGroup.add(flapMesh);

    flapGroup.position.set(0, 0, 0);
    return flapGroup;
  }

  // -------------------------------------------------------------
  // DYNAMIC PHYSICAL SIMULATION UPDATES
  // -------------------------------------------------------------

  setFeedDisplacement(displacementMeters) {
    this.feedDistance = displacementMeters * 1000; // to mm
    this.cableRoot.position.x = displacementMeters;
  }

  setStraightness(factor) {
    this.straightnessFactor = Math.min(1.0, Math.max(0.0, factor));
    // Apply slight realistic curvature to unstraightened inlet portion
    const curveAmount = (1.0 - this.straightnessFactor) * 0.015;
    this.group.rotation.z = Math.sin(this.feedDistance * 0.01) * curveAmount;
  }

  setCutState(state, progress = 0.0) {
    this.cutState = state;

    if (state === 'INTACT') {
      if (this.scoreRingMesh) this.scoreRingMesh.visible = false;
      this.peelFlapTop.rotation.z = 0;
      this.peelFlapBottom.rotation.z = 0;
      this.peelFlapTop.position.y = 0;
      this.peelFlapBottom.position.y = 0;
      if (this.peelBaseX !== undefined) {
        this.peelFlapTop.position.x = this.peelBaseX;
        this.peelFlapBottom.position.x = this.peelBaseX;
      }
    } else if (state === 'SCORED') {
      if (this.scoreRingMesh) this.scoreRingMesh.visible = true;
    } else if (state === 'SLIT') {
      if (this.scoreRingMesh) this.scoreRingMesh.visible = true;
      // Slight seam opening
      this.peelFlapTop.position.y = 0.0005;
      this.peelFlapBottom.position.y = -0.0005;
    } else if (state === 'PEELED') {
      if (this.scoreRingMesh) this.scoreRingMesh.visible = true;
      // Articulated peeling open of top and bottom flaps
      const maxPeelAngle = 0.85; // ~50 degrees open
      const currentAngle = maxPeelAngle * progress;

      this.peelFlapTop.rotation.z = currentAngle;
      this.peelFlapBottom.rotation.z = -currentAngle;
      const peelTravel = 0.10 * progress; // 100 mm equivalent physical peel-back stroke
      this.peelFlapTop.position.x = this.peelBaseX + peelTravel;
      this.peelFlapBottom.position.x = this.peelBaseX + peelTravel;
      this.peelFlapTop.position.y = Math.sin(currentAngle) * 0.012;
      this.peelFlapBottom.position.y = -Math.sin(currentAngle) * 0.012;
    } else if (state === 'SEPARATED') {
      this.peelFlapTop.rotation.z = 0.95;
      this.peelFlapBottom.rotation.z = -0.95;
    }
  }

  updateConfiguration(options) {
    if (options.cableType !== undefined) this.cableType = options.cableType;
    if (options.conductorMaterial !== undefined) this.conductorMaterial = options.conductorMaterial;
    if (options.insulationType !== undefined) this.insulationType = options.insulationType;
    if (options.coreCount !== undefined) this.coreCount = options.coreCount;
    if (options.outerDiameter !== undefined) this.outerDiameter = options.outerDiameter;
    this.buildCableGeometry();
  }

  setExploded(progress) {
    if (this.sheathGroup) {
      this.sheathGroup.position.z = progress * 0.12;
    }
    if (this.coresGroup) {
      this.coresGroup.position.z = -progress * 0.06;
      this.coresGroup.children.forEach((child, i) => {
        if (child.isGroup) {
          const angle = (i * Math.PI) / 2;
          child.position.y = Math.sin(angle) * (this.cableRadiusM * 0.44 + progress * 0.08);
          child.position.z = Math.cos(angle) * (this.cableRadiusM * 0.44 + progress * 0.08);
        }
      });
    }
  }
}

