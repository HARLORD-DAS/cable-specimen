import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';

/**
 * MachineFrame.js
 * Heavy-duty industrial chassis, aluminium extrusion framework, precision bedplate,
 * mounting rails, signal tower, and branding.
 * 
 * Machine Color System per Specification:
 * - Primary Machine Body: Dark Industrial Graphite (#2B2E31)
 * - Secondary Structural Frame: Dark Industrial Gray (#555A5E)
 * - Metal components: Brushed aluminium, stainless steel, chrome, machined steel
 */
export class MachineFrame {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'MachineBaseFramework';

    this.interactiveObjects = [];

    this.initMaterials();
    this.buildBaseChassis();
    this.buildExtrusionFrame();
    this.buildWorkbedPlate();
    this.buildLinearGuideRails();
    this.buildFrontBrandingPanels();
    this.buildSignalTower();
    this.buildPhysicalEStop();
  }

  initMaterials() {
    // 1. Primary Machine Body: Dark Industrial Graphite (#2B2E31)
    this.matPrimaryFrame = new THREE.MeshStandardMaterial({
      color: 0x2b2e31,
      roughness: 0.42,
      metalness: 0.65,
      name: 'PrimaryIndustrialGraphite'
    });

    // 2. Secondary Structural Frame: Dark Industrial Gray (#555A5E)
    this.matSecondaryExtrusion = new THREE.MeshStandardMaterial({
      color: 0x555a5e,
      roughness: 0.35,
      metalness: 0.72,
      name: 'SecondaryIndustrialGrayExtrusion'
    });

    // 3. Workbed Tool Plate (Ground Machine Tool Surface)
    this.matWorkbed = new THREE.MeshStandardMaterial({
      color: 0x3e4246,
      roughness: 0.35,
      metalness: 0.60,
      name: 'WorkbedPlate'
    });

    // 4. Ground Chrome Linear Shafts / Guide Rails
    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.15,
      metalness: 0.92,
      name: 'ChromeGuideShafts'
    });

    // 5. Stainless Steel Sheet Metal
    this.matStainless = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.28,
      metalness: 0.85,
      name: 'StainlessSteel'
    });

    // 6. Industrial Leveling Feet (Nitrile Rubber with Steel Spindle)
    this.matRubberFoot = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1,
      name: 'RubberDampingFeet'
    });

    // 7. Safety Emergency Stop
    this.matEStopRed = new THREE.MeshStandardMaterial({
      color: 0xe5484d,
      roughness: 0.25,
      metalness: 0.15,
      name: 'EmergencyStopRed'
    });

    this.matEStopYellow = new THREE.MeshStandardMaterial({
      color: 0xf2a900,
      roughness: 0.3,
      metalness: 0.1,
      name: 'EmergencyStopYellowBezel'
    });

    // 8. Signal Tower Stack Light Materials
    this.matStackGreen = new THREE.MeshStandardMaterial({
      color: 0x35b86b,
      emissive: 0x35b86b,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    this.matStackAmber = new THREE.MeshStandardMaterial({
      color: 0xf2a900,
      emissive: 0xf2a900,
      emissiveIntensity: 0.1,
      roughness: 0.2
    });

    this.matStackRed = new THREE.MeshStandardMaterial({
      color: 0xe5484d,
      emissive: 0xe5484d,
      emissiveIntensity: 0.1,
      roughness: 0.2
    });
  }

  buildBaseChassis() {
    // Solid welded steel lower cabinet plinth (Length 4.6m, Width 1.4m, Height 0.42m)
    const baseGeo = new THREE.BoxGeometry(4.6, 0.42, 1.4);
    this.baseMesh = new THREE.Mesh(baseGeo, this.matPrimaryFrame);
    this.baseMesh.position.set(0.0, 0.21, 0.0);
    this.baseMesh.castShadow = true;
    this.baseMesh.receiveShadow = true;
    this.group.add(this.baseMesh);

    // 8 Vibration-Isolated Heavy-Duty Leveling Feet
    const footGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.05, 24);
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16);

    const footPositions = [
      [-2.1, 0.6], [-0.7, 0.6], [0.7, 0.6], [2.1, 0.6],
      [-2.1, -0.6], [-0.7, -0.6], [0.7, -0.6], [2.1, -0.6]
    ];

    footPositions.forEach(([x, z]) => {
      const foot = new THREE.Mesh(footGeo, this.matRubberFoot);
      foot.position.set(x, 0.025, z);
      foot.castShadow = true;
      foot.receiveShadow = true;
      this.group.add(foot);

      const stem = new THREE.Mesh(stemGeo, this.matChrome);
      stem.position.set(x, 0.06, z);
      this.group.add(stem);
    });

    // Base side ventilation louvers (Machined black slots)
    const louverGeo = new THREE.BoxGeometry(0.02, 0.18, 0.32);
    const leftLouver = new THREE.Mesh(louverGeo, this.matSecondaryExtrusion);
    leftLouver.position.set(-2.301, 0.21, 0.0);
    this.group.add(leftLouver);

    const rightLouver = new THREE.Mesh(louverGeo, this.matSecondaryExtrusion);
    rightLouver.position.set(2.301, 0.21, 0.0);
    this.group.add(rightLouver);
  }

  buildExtrusionFrame() {
    this.cagePillars = [];

    // 80x80 Anodized Aluminium Extrusions forming the upper structural safety cage (#555A5E)
    const pillarGeo = new THREE.BoxGeometry(0.08, 1.25, 0.08);
    const pillarCoords = [
      [-2.25, 0.65], [-1.15, 0.65], [0.0, 0.65], [1.15, 0.65], [2.25, 0.65],
      [-2.25, -0.65], [-1.15, -0.65], [0.0, -0.65], [1.15, -0.65], [2.25, -0.65]
    ];

    pillarCoords.forEach(([x, z]) => {
      const pillar = new THREE.Mesh(pillarGeo, this.matSecondaryExtrusion);
      pillar.position.set(x, 1.05, z);
      pillar.castShadow = true;
      this.group.add(pillar);
      this.cagePillars.push(pillar);
    });

    // Top horizontal crossbeams
    const beamLongGeo = new THREE.BoxGeometry(4.58, 0.08, 0.08);
    this.topFrontBeam = new THREE.Mesh(beamLongGeo, this.matSecondaryExtrusion);
    this.topFrontBeam.position.set(0.0, 1.68, 0.65);
    this.topFrontBeam.castShadow = true;
    this.group.add(this.topFrontBeam);

    this.topRearBeam = new THREE.Mesh(beamLongGeo, this.matSecondaryExtrusion);
    this.topRearBeam.position.set(0.0, 1.68, -0.65);
    this.topRearBeam.castShadow = true;
    this.group.add(this.topRearBeam);

    // Cross-tie bars
    const beamCrossGeo = new THREE.BoxGeometry(0.08, 0.08, 1.22);
    [-2.25, -1.15, 0.0, 1.15, 2.25].forEach(x => {
      const crossBeam = new THREE.Mesh(beamCrossGeo, this.matSecondaryExtrusion);
      crossBeam.position.set(x, 1.68, 0.0);
      crossBeam.castShadow = true;
      this.group.add(crossBeam);
    });
  }

  buildWorkbedPlate() {
    // Precision ground tool plate with M6 grid tapped holes (Y: 0.44)
    const bedGeo = new THREE.BoxGeometry(4.5, 0.04, 1.25);
    const bedMesh = new THREE.Mesh(bedGeo, this.matWorkbed);
    bedMesh.position.set(0.0, 0.44, 0.0);
    bedMesh.castShadow = true;
    bedMesh.receiveShadow = true;
    this.group.add(bedMesh);

    // Bedplate laser scale rule decal running parallel to processing line
    const scaleTex = TextureGenerator.createLinearScaleTexture();
    const scaleMat = new THREE.MeshStandardMaterial({
      map: scaleTex,
      roughness: 0.3,
      metalness: 0.8
    });
    const scaleGeo = new THREE.PlaneGeometry(3.6, 0.045);
    const scaleMesh = new THREE.Mesh(scaleGeo, scaleMat);
    scaleMesh.rotation.x = -Math.PI / 2;
    scaleMesh.position.set(0.2, 0.461, 0.22);
    this.group.add(scaleMesh);
  }

  buildLinearGuideRails() {
    // Dual precision chrome linear guide shafts on which clamping carriage & carriages ride
    const railGeo = new THREE.CylinderGeometry(0.016, 0.016, 3.8, 24);
    railGeo.rotateZ(Math.PI / 2);

    const railFront = new THREE.Mesh(railGeo, this.matChrome);
    railFront.position.set(0.1, 0.485, 0.14);
    railFront.castShadow = true;
    this.group.add(railFront);

    const railRear = new THREE.Mesh(railGeo, this.matChrome);
    railRear.position.set(0.1, 0.485, -0.14);
    railRear.castShadow = true;
    this.group.add(railRear);

    // Rail support blocks
    const blockGeo = new THREE.BoxGeometry(0.06, 0.035, 0.34);
    for (let x = -1.6; x <= 1.8; x += 0.85) {
      const block = new THREE.Mesh(blockGeo, this.matSecondaryExtrusion);
      block.position.set(x, 0.475, 0.0);
      block.castShadow = true;
      this.group.add(block);
    }
  }

  buildFrontBrandingPanels() {
    // Reference Image 1 Front Base Enclosure Panels with authentic Aethonix branding:
    // Left panel: AETHONIX SOLUTIONS
    const aethonixTex = TextureGenerator.createAethonixLogoTexture();
    const aethonixMat = new THREE.MeshStandardMaterial({ map: aethonixTex, roughness: 0.4, metalness: 0.1 });
    const aethonixMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.28), aethonixMat);
    aethonixMesh.position.set(-1.15, 0.26, 0.702);
    this.group.add(aethonixMesh);

    // Right panel: AUTOMATED CABLE SPECIMEN PREPARATION SYSTEM
    const titleTex = TextureGenerator.createAethonixTitleTexture();
    const titleMat = new THREE.MeshStandardMaterial({ map: titleTex, roughness: 0.4, metalness: 0.1 });
    const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.28), titleMat);
    titleMesh.position.set(0.85, 0.26, 0.702);
    this.group.add(titleMesh);

    // Maintenance access door divider lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    [-1.75, -0.55, 0.0, 1.75].forEach(x => {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.32, 0.01), lineMat);
      seam.position.set(x, 0.24, 0.704);
      this.group.add(seam);
    });
  }

  buildSignalTower() {
    // Industrial 3-Tier Stack Light (Signal Tower: Red, Amber, Green) mounted above right upright (X = 2.25, Y = 1.68)
    this.stackGroup = new THREE.Group();
    this.stackGroup.position.set(2.25, 1.72, 0.65);

    // Stanchion pipe
    const pipeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 16);
    const pipe = new THREE.Mesh(pipeGeo, this.matChrome);
    pipe.position.y = 0.08;
    this.stackGroup.add(pipe);

    // 3 Light tiers
    const lensGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.045, 24);

    // Green (Bottom) - Ready / Running
    this.greenLight = new THREE.Mesh(lensGeo, this.matStackGreen);
    this.greenLight.position.y = 0.18;
    this.stackGroup.add(this.greenLight);

    // Amber (Middle) - Warning / Paused
    this.amberLight = new THREE.Mesh(lensGeo, this.matStackAmber);
    this.amberLight.position.y = 0.23;
    this.stackGroup.add(this.amberLight);

    // Red (Top) - Fault / E-Stop
    this.redLight = new THREE.Mesh(lensGeo, this.matStackRed);
    this.redLight.position.y = 0.28;
    this.stackGroup.add(this.redLight);

    // Black cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 24), this.matRubberFoot);
    cap.position.y = 0.31;
    this.stackGroup.add(cap);

    this.group.add(this.stackGroup);
  }

  setSignalState(state) {
    if (state === 'FAULT' || state === 'SAFETY_STOP') {
      this.matStackRed.emissiveIntensity = 1.0;
      this.matStackAmber.emissiveIntensity = 0.0;
      this.matStackGreen.emissiveIntensity = 0.0;
    } else if (state === 'PAUSED' || state === 'IDLE') {
      this.matStackRed.emissiveIntensity = 0.0;
      this.matStackAmber.emissiveIntensity = 0.8;
      this.matStackGreen.emissiveIntensity = 0.0;
    } else {
      this.matStackRed.emissiveIntensity = 0.0;
      this.matStackAmber.emissiveIntensity = 0.0;
      this.matStackGreen.emissiveIntensity = 1.0;
    }
  }

  buildPhysicalEStop() {
    const eStopGroup = new THREE.Group();
    eStopGroup.name = 'PhysicalEStopAssembly';
    eStopGroup.position.set(2.25, 0.95, 0.69);

    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24), this.matEStopYellow);
    bezel.rotateX(Math.PI / 2);
    eStopGroup.add(bezel);

    const mushroomGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.035, 24);
    mushroomGeo.rotateX(Math.PI / 2);
    this.eStopMushroom = new THREE.Mesh(mushroomGeo, this.matEStopRed);
    this.eStopMushroom.position.z = 0.025;
    this.eStopMushroom.castShadow = true;
    eStopGroup.add(this.eStopMushroom);

    this.eStopMushroom.userData = {
      name: 'Emergency Stop Pushbutton (SIL-3)',
      category: 'SAFETY',
      type: 'ESTOP',
      description: 'Hardwired SIL-3 rated emergency stop. Trips master safety relay and engages all mechanical brakes.'
    };
    this.interactiveObjects.push(this.eStopMushroom);

    this.group.add(eStopGroup);
  }

  setExploded(progress) {
    // Gently expands framework pillars outward during exploded view
    this.topFrontBeam.position.y = 1.68 + progress * 0.25;
    this.topRearBeam.position.y = 1.68 + progress * 0.25;
    this.cagePillars.forEach(p => {
      p.position.y = 1.05 + progress * 0.12;
    });
  }
}
