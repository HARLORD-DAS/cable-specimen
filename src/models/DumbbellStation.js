import * as THREE from 'three';

/**
 * DumbbellStation.js
 * Standardized Polymer Dumbbell Specimen Punch-and-Die Station (IS 10810 Part 7).
 * Prepared for tensile strength and elongation-at-break testing of insulation and sheath.
 *
 * Sequence:
 * POLYMER SHEET TRANSFERRED -> ALIGNED ON DIE ANVIL -> PNEUMATIC CLAMP CLOSES ->
 * HYDRAULIC/PNEUMATIC PUNCH DESCENDS -> HARDENED DIE CUTS STANDARDIZED DOGBONE ->
 * PUNCH RETRACTS -> DUMBBELL SPECIMEN REMOVED TO ROUTING SHUTTLE -> SCRAP TO WASTE.
 */
export class DumbbellStation {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'DumbbellPunchAndDieStation';
    this.group.position.set(0.85, 0.50, 0.18); // Stationed in polymer prep bay

    this.punchStrokeProgress = 0.0; // 0.0 = fully raised, 1.0 = bottom dead center
    this.hasSpecimenOnBed = false;
    this.isDumbbellCut = false;
    this.specimenType = 'DUMBBELL'; // 'DUMBBELL', 'WAFER'
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildPressFrame();
    this.buildDieBedAndAnvil();
    this.buildPunchRamAndDieTool();
    this.buildPolymerSpecimens();
  }

  initMaterials() {
    // 1. Heavy C-Frame Press Body (Cast Iron / Industrial Slate Gray #334155)
    this.matPressFrame = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.65,
      name: 'PressCFrame'
    });

    // 2. Precision Tool Steel Ground Die Bed / Cutting Anvil
    this.matDieBed = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.92,
      name: 'PrecisionDieBed'
    });

    // 3. Hardened Tool Steel ISO/IS Dumbbell Cutting Die (Razor edge)
    this.matPunchDie = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Hardened blue tool steel coating
      roughness: 0.22,
      metalness: 0.82,
      name: 'HardenedPunchDie'
    });

    // 4. Hydraulic / High-Force Pneumatic Cylinder (10 kN Press Ram)
    this.matPressRam = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.7
    });
    this.matChromeShaft = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.96
    });

    // 5. Polymer Blank & Cut Dumbbell Specimen Material (Translucent XLPE / Black PVC)
    this.matSpecimenPolymer = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Blue XLPE insulation specimen or black sheath
      roughness: 0.35,
      metalness: 0.15,
      name: 'SpecimenPolymer'
    });

    // 6. Laser Specimen Alignment Beam (Green Crosshair)
    this.matCrosshair = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.75
    });
  }

  buildPressFrame() {
    // Rigid C-Frame Press Structure
    const cFrameGroup = new THREE.Group();

    // Base plinth mounting foot
    const footGeo = new THREE.BoxGeometry(0.24, 0.04, 0.32);
    const foot = new THREE.Mesh(footGeo, this.matPressFrame);
    foot.position.set(0.0, -0.05, 0.0);
    cFrameGroup.add(foot);

    // Rear vertical backbone column
    const colGeo = new THREE.BoxGeometry(0.14, 0.38, 0.14);
    const col = new THREE.Mesh(colGeo, this.matPressFrame);
    col.position.set(-0.05, 0.14, -0.09);
    col.castShadow = true;
    cFrameGroup.add(col);

    // Top overhang head
    const headGeo = new THREE.BoxGeometry(0.22, 0.08, 0.22);
    const head = new THREE.Mesh(headGeo, this.matPressFrame);
    head.position.set(0.0, 0.31, 0.0);
    head.castShadow = true;
    cFrameGroup.add(head);

    this.group.add(cFrameGroup);
  }

  buildDieBedAndAnvil() {
    // Precision ground cutting bed / anvil plate (with scrap discharge slot)
    const anvilGeo = new THREE.BoxGeometry(0.18, 0.025, 0.18);
    this.anvilMesh = new THREE.Mesh(anvilGeo, this.matDieBed);
    this.anvilMesh.position.set(0.0, -0.015, 0.03);
    this.anvilMesh.castShadow = true;
    this.anvilMesh.receiveShadow = true;
    this.group.add(this.anvilMesh);

    // Scrap ejection chute slot leading into lower waste hopper
    const chuteSlotGeo = new THREE.BoxGeometry(0.14, 0.005, 0.03);
    const chuteSlot = new THREE.Mesh(chuteSlotGeo, this.matPressFrame);
    chuteSlot.position.set(0.0, -0.002, -0.04);
    this.group.add(chuteSlot);

    this.anvilMesh.userData = {
      name: 'Precision Cutting Anvil & Die Bed',
      category: 'DUMBBELL_STATION',
      description: 'Hardened tool-steel anvil plate ground to ±0.002 mm flatness for standardized tensile specimen stamping.'
    };
    this.interactiveObjects.push(this.anvilMesh);
  }

  buildPunchRamAndDieTool() {
    // 10 kN Linear Press Cylinder mounted on upper overhang
    this.ramAssembly = new THREE.Group();
    this.ramAssembly.position.set(0.0, 0.31, 0.03);

    const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.14, 24), this.matPressRam);
    cylBody.position.y = 0.05;
    this.ramAssembly.add(cylBody);

    // Precision ground chrome guide pillar / ram shaft
    const ramShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 20), this.matChromeShaft);
    ramShaft.position.y = -0.04;
    this.ramAssembly.add(ramShaft);

    // Lower Tool Holder Plate & ISO Dumbbell Punch Die
    this.punchHead = new THREE.Group();
    this.punchHead.position.set(0.0, -0.12, 0.0);

    const holderGeo = new THREE.BoxGeometry(0.14, 0.02, 0.12);
    const holderMesh = new THREE.Mesh(holderGeo, this.matDieBed);
    this.punchHead.add(holderMesh);

    // Standardized ISO / IS Dogbone Dumbbell Knife-Edge Profile
    // Shape: Wide ends (25mm), narrow parallel gauge section (4mm to 6mm), total length ~75mm
    this.punchKnife = this.createDumbbellKnifeMesh();
    this.punchKnife.position.y = -0.015;
    this.punchHead.add(this.punchKnife);

    this.ramAssembly.add(this.punchHead);
    this.group.add(this.ramAssembly);

    holderMesh.userData = {
      name: 'IS 10810 Part 7 Dumbbell Punch Die',
      category: 'DUMBBELL_STATION',
      description: 'CNC wire-EDM machined tool-steel punch die stamping standardized tensile test dumbbell specimens.'
    };
    this.interactiveObjects.push(holderMesh);
  }

  createDumbbellKnifeMesh() {
    // Dogbone outline shape
    const shape = new THREE.Shape();
    const lHalf = 0.038; // 76mm total length
    const wWide = 0.0125; // 25mm wide grip ends
    const wNarrow = 0.0035; // 7mm narrow gauge width
    const rGrip = 0.016; // grip length

    shape.moveTo(-lHalf, -wWide);
    shape.lineTo(-lHalf + rGrip, -wWide);
    shape.bezierCurveTo(-lHalf + rGrip + 0.005, -wWide, 0.0 - 0.008, -wNarrow, -0.008, -wNarrow);
    shape.lineTo(0.008, -wNarrow);
    shape.bezierCurveTo(lHalf - rGrip - 0.005, -wNarrow, lHalf - rGrip, -wWide, lHalf - rGrip, -wWide);
    shape.lineTo(lHalf, -wWide);
    shape.lineTo(lHalf, wWide);
    shape.lineTo(lHalf - rGrip, wWide);
    shape.bezierCurveTo(lHalf - rGrip - 0.005, wWide, 0.008, wNarrow, 0.008, wNarrow);
    shape.lineTo(-0.008, wNarrow);
    shape.bezierCurveTo(-0.008, wNarrow, -lHalf + rGrip + 0.005, wWide, -lHalf + rGrip, wWide);
    shape.lineTo(-lHalf, wWide);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 2
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geom, this.matPunchDie);
    mesh.castShadow = true;
    return mesh;
  }

  buildPolymerSpecimens() {
    // 1. Raw flat polymer blank positioned on the die anvil
    const blankGeo = new THREE.BoxGeometry(0.10, 0.002, 0.045);
    this.rawBlankMesh = new THREE.Mesh(blankGeo, this.matSpecimenPolymer);
    this.rawBlankMesh.position.set(0.0, 0.001, 0.03);
    this.rawBlankMesh.visible = false;
    this.group.add(this.rawBlankMesh);

    // 2. Finished stamped Dumbbell Specimen
    const dumbbellShape = this.createDumbbellKnifeMesh().geometry.clone();
    // Scale slightly to specimen thickness (2mm)
    this.finishedDumbbell = new THREE.Mesh(dumbbellShape, this.matSpecimenPolymer);
    this.finishedDumbbell.scale.set(1.0, 0.18, 1.0);
    this.finishedDumbbell.position.set(0.0, 0.001, 0.03);
    this.finishedDumbbell.visible = false;
    this.finishedDumbbell.castShadow = true;
    this.group.add(this.finishedDumbbell);

    // 3. Stamped outer scrap flash frame
    const flashGeo = new THREE.BoxGeometry(0.10, 0.002, 0.045);
    this.scrapFlashMesh = new THREE.Mesh(flashGeo, this.matSpecimenPolymer);
    this.scrapFlashMesh.position.set(0.0, 0.001, 0.03);
    this.scrapFlashMesh.visible = false;
    this.group.add(this.scrapFlashMesh);

    this.finishedDumbbell.userData = {
      name: 'Prepared Dumbbell Specimen (IS 10810 Pt 7)',
      category: 'SPECIMEN',
      description: 'Precision punched tensile dogbone specimen. Gauge length: 25.0mm, Thickness: 1.8mm.'
    };
    this.interactiveObjects.push(this.finishedDumbbell);
  }

  // -------------------------------------------------------------
  // ANIMATION METHODS
  // -------------------------------------------------------------

  loadBlankMaterial(colorHex = 0x0284c7) {
    this.matSpecimenPolymer.color.setHex(colorHex);
    this.rawBlankMesh.visible = true;
    this.finishedDumbbell.visible = false;
    this.scrapFlashMesh.visible = false;
    this.hasSpecimenOnBed = true;
    this.isDumbbellCut = false;
  }

  setPunchStroke(strokeProgress) {
    // strokeProgress: 0.0 (top dead center) -> 1.0 (bottom dead center cut)
    this.punchStrokeProgress = THREE.MathUtils.clamp(strokeProgress, 0.0, 1.0);

    const raisedY = -0.12;
    const cutY = -0.308; // Touches anvil and penetrates polymer sheet
    const currentY = THREE.MathUtils.lerp(raisedY, cutY, this.punchStrokeProgress);

    this.punchHead.position.y = currentY;

    if (this.punchStrokeProgress >= 0.95 && this.hasSpecimenOnBed && !this.isDumbbellCut) {
      this.isDumbbellCut = true;
      this.rawBlankMesh.visible = false;
      this.finishedDumbbell.visible = true;
      this.scrapFlashMesh.visible = true;
    }
  }

  ejectScrapFlash() {
    if (this.scrapFlashMesh && this.scrapFlashMesh.visible) {
      // Slides down scrap chute into waste
      this.scrapFlashMesh.position.z -= 0.06;
      this.scrapFlashMesh.position.y -= 0.03;
      setTimeout(() => {
        if (this.scrapFlashMesh) this.scrapFlashMesh.visible = false;
      }, 400);
    }
  }

  resetStation() {
    this.setPunchStroke(0.0);
    this.rawBlankMesh.visible = false;
    this.finishedDumbbell.visible = false;
    this.scrapFlashMesh.visible = false;
    this.hasSpecimenOnBed = false;
    this.isDumbbellCut = false;
  }

  setExploded(progress) {
    if (this.ramAssembly) this.ramAssembly.position.y = 0.31 + progress * 0.18;
    if (this.punchHead) this.punchHead.position.y = -0.12 - progress * 0.10;
  }
}

