import * as THREE from 'three';

/**
 * OutputTraysSystem.js
 * High-Fidelity 3D Front Specimen Collection Carts (Directly matching Reference Image 1).
 * 
 * Features 4 distinct mobile carts docked along the front lower chassis:
 * 1. Cart 1 (Orange Header): "Aluminium / Copper Conductor Specimens (IS 10810 Part 2)"
 * 2. Cart 2 (Blue Header):   "Insulation Specimens (Dumbbell) (IS 10810 Part 7)"
 * 3. Cart 3 (Green Header):  "Insulation / Sheath Specimens (Sheets) (IS 10810 Part 33)"
 * 4. Cart 4 (Purple Header): "Reject / Scrap"
 *
 * Each mobile cart has:
 * - Extruded aluminium framework (#555A5E & #2B2E31) with swivel caster wheels
 * - Angled transparent polycarbonate safety lid with brushed stainless handle
 * - Inset illuminated colored nameplate with test standard designation
 * - Progressive physical accumulation of 3D specimens (rods, dumbbells, sheets, scrap)
 * - Clickable interactive objects for contextual metrology reporting
 */
export class OutputTraysSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FrontSpecimenCollectionCarts';
    this.group.position.set(0.0, 0.0, 0.76); // Mounted along front lower apron

    this.interactiveObjects = [];
    this.carts = {};
    this.wasteTransfers = [];

    this.initMaterials();
    this.buildWasteChutes();
    this.buildFourCarts();
  }

  initMaterials() {
    // 1. Cart Frame Structure (#2B2E31 and #555A5E)
    this.matCartDark = new THREE.MeshStandardMaterial({
      color: 0x2b2e31,
      roughness: 0.45,
      metalness: 0.65,
      name: 'CartFrameGraphite'
    });

    this.matCartAlu = new THREE.MeshStandardMaterial({
      color: 0x555a5e,
      roughness: 0.35,
      metalness: 0.75,
      name: 'CartAluExtrusion'
    });

    // 2. Stainless Steel Basin Liner (#D4D4D8)
    this.matBasinStainless = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.28,
      metalness: 0.85,
      name: 'BasinStainless'
    });

    // 3. Transparent Polycarbonate Angled Lid
    this.matLidGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.90,
      opacity: 0.35,
      transparent: true,
      roughness: 0.10,
      metalness: 0.05,
      depthWrite: false,
      name: 'CartPolycarbLid'
    });

    // 4. Chrome Handles & Fasteners
    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.15,
      metalness: 0.95
    });

    // 5. Caster Wheels (Nitrile Rubber with Swivel Fork)
    this.matWheelRubber = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1
    });

    // 6. Specimen Materials
    this.matCopperRod = new THREE.MeshStandardMaterial({
      color: 0xc86432,
      roughness: 0.25,
      metalness: 0.90
    });

    this.matAluRod = new THREE.MeshStandardMaterial({
      color: 0xd4d8de,
      roughness: 0.30,
      metalness: 0.85
    });

    this.matDumbbellPolymer = new THREE.MeshStandardMaterial({
      color: 0xfaf5ee, // Cream white tensile polymer specimen
      roughness: 0.40,
      metalness: 0.08
    });

    this.matSheetPolymer = new THREE.MeshStandardMaterial({
      color: 0xe8e4dc,
      roughness: 0.45,
      metalness: 0.05
    });

    this.matScrapJacket = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.55,
      metalness: 0.1
    });
  }

  buildWasteChutes() {
    // Physical waste-transfer path from the processing area into the reject/scrap cart.
    // The carts are mounted on the front apron, so the chute is kept in the same
    // local coordinate system as the carts and remains visibly connected to them.
    const chuteMat = new THREE.MeshStandardMaterial({
      color: 0x555a5e,
      roughness: 0.38,
      metalness: 0.76
    });

    const addChuteSegment = (a, b, width = 0.16) => {
      const start = new THREE.Vector3(...a);
      const end = new THREE.Vector3(...b);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const length = start.distanceTo(end);
      const chute = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.055, width),
        chuteMat
      );
      chute.position.copy(mid);
      chute.lookAt(end);
      chute.rotateY(Math.PI / 2);
      chute.castShadow = true;
      chute.receiveShadow = true;
      this.group.add(chute);
    };

    // Two-stage receiving chute: upper processing outlet -> lower reject bin.
    addChuteSegment([-0.10, 0.40, -0.70], [0.55, 0.30, -0.28], 0.18);
    addChuteSegment([0.55, 0.30, -0.28], [1.35, 0.19, 0.04], 0.18);

    // Side walls keep small scrap pieces on the chute.
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x8e8e8a,
      roughness: 0.42,
      metalness: 0.68
    });
    [
      { x: 0.38, y: 0.34, z: -0.43, r: -0.42 },
      { x: 0.96, y: 0.25, z: -0.11, r: -0.24 }
    ].forEach(({ x, y, z, r }) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.025, 0.025), railMat);
      rail.position.set(x, y, z);
      rail.rotation.z = r;
      rail.castShadow = true;
      this.group.add(rail);
    });
  }
  buildFourCarts() {
    // 4 Cart configurations matching Reference Image 1 exactly:
    const cartConfigs = [
      {
        id: 'CONDUCTOR',
        name: 'Conductor Specimens',
        standard: 'IS 10810 Part 2',
        xPos: -1.35,
        colorHex: 0xd97706, // Industrial Orange
        badgeTitle: 'Aluminium / Copper Conductor Specimens',
        badgeSub: '(IS 10810 Part 2)'
      },
      {
        id: 'DUMBBELL',
        name: 'Insulation Dumbbell Specimens',
        standard: 'IS 10810 Part 7',
        xPos: -0.45,
        colorHex: 0x0284c7, // Industrial Blue
        badgeTitle: 'Insulation Specimens (Dumbbell)',
        badgeSub: '(IS 10810 Part 7)'
      },
      {
        id: 'SHEET',
        name: 'Insulation / Sheath Sheets',
        standard: 'IS 10810 Part 33',
        xPos: 0.45,
        colorHex: 0x16a34a, // Industrial Green
        badgeTitle: 'Insulation / Sheath Specimens (Sheets)',
        badgeSub: '(IS 10810 Part 33)'
      },
      {
        id: 'REJECT',
        name: 'Reject / Scrap Bin',
        standard: 'Defect / Off-Spec',
        xPos: 1.35,
        colorHex: 0x7c3aed, // Industrial Purple
        badgeTitle: 'Reject / Scrap',
        badgeSub: 'Quality Control Reject'
      }
    ];

    cartConfigs.forEach((cfg) => {
      const cart = this.createCartAssembly(cfg);
      this.group.add(cart.group);
      this.carts[cfg.id] = cart;
    });

    // Populate initial pre-existing specimens inside trays so they look authentic
    this.seedInitialSpecimens();
  }

  createCartAssembly(cfg) {
    const cartGroup = new THREE.Group();
    cartGroup.position.set(cfg.xPos, 0.0, 0.0);

    const cartW = 0.82;
    const cartH = 0.32;
    const cartD = 0.36;

    // 1. Lower Welded Chassis Box (Dark Graphite #2B2E31)
    const boxGeo = new THREE.BoxGeometry(cartW, cartH, cartD);
    const boxMesh = new THREE.Mesh(boxGeo, this.matCartDark);
    boxMesh.position.set(0.0, cartH * 0.5 + 0.04, 0.0);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    cartGroup.add(boxMesh);

    // 2. Perimeter Aluminium Sash Trim (#555A5E)
    const trimGeo = new THREE.BoxGeometry(cartW + 0.015, 0.02, cartD + 0.015);
    const topTrim = new THREE.Mesh(trimGeo, this.matCartAlu);
    topTrim.position.set(0.0, cartH + 0.04, 0.0);
    cartGroup.add(topTrim);

    // 3. Four Swivel Caster Wheels beneath cart
    [-cartW * 0.42, cartW * 0.42].forEach((x) => {
      [-cartD * 0.38, cartD * 0.38].forEach((z) => {
        const wheelFork = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 0.025), this.matCartAlu);
        wheelFork.position.set(x, 0.03, z);
        cartGroup.add(wheelFork);

        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.016, 16), this.matWheelRubber);
        wheel.rotateZ(Math.PI / 2);
        wheel.position.set(x, 0.022, z);
        cartGroup.add(wheel);
      });
    });

    // 4. Sloped Interior Specimen Basin Liner (Recessed top)
    const basinGeo = new THREE.BoxGeometry(cartW - 0.06, 0.14, cartD - 0.06);
    const basinMesh = new THREE.Mesh(basinGeo, this.matBasinStainless);
    basinMesh.position.set(0.0, cartH * 0.5 + 0.11, 0.0);
    cartGroup.add(basinMesh);

    // 5. Overhead Angled Transparent Polycarbonate Viewing Lid
    const lidGeo = new THREE.BoxGeometry(cartW - 0.04, 0.008, cartD * 0.75);
    const lidMesh = new THREE.Mesh(lidGeo, this.matLidGlass);
    lidMesh.position.set(0.0, cartH + 0.10, 0.04);
    lidMesh.rotation.x = 0.28; // Tilted toward front viewer
    cartGroup.add(lidMesh);

    // Lid Brushed Stainless Handle
    const handleGeo = new THREE.CylinderGeometry(0.006, 0.006, cartW * 0.6, 12);
    handleGeo.rotateZ(Math.PI / 2);
    const handle = new THREE.Mesh(handleGeo, this.matChrome);
    handle.position.set(0.0, cartH + 0.07, cartD * 0.42);
    cartGroup.add(handle);

    // 6. High-Contrast Printed Nameplate Badge (Matching Ref 1 exactly)
    const badgeTex = this.createBadgeTexture(cfg.badgeTitle, cfg.badgeSub, cfg.colorHex);
    const badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTex,
      roughness: 0.35,
      metalness: 0.2
    });
    const badgeGeo = new THREE.PlaneGeometry(cartW - 0.10, 0.075);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0.0, cartH + 0.08, cartD * 0.505);
    cartGroup.add(badgeMesh);

    // Overhead subtle LED accent glow strip
    const ledGeo = new THREE.BoxGeometry(cartW - 0.12, 0.006, 0.012);
    const ledMat = new THREE.MeshBasicMaterial({ color: cfg.colorHex });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.0, cartH + 0.125, cartD * 0.50);
    cartGroup.add(ledMesh);

    // Group for containing dynamically added 3D specimen meshes
    const specimenContainer = new THREE.Group();
    specimenContainer.position.set(0.0, cartH + 0.05, 0.0);
    cartGroup.add(specimenContainer);

    boxMesh.userData = {
      name: cfg.name,
      category: 'OUTPUT_CART',
      standard: cfg.standard,
      cartId: cfg.id,
      specimenCount: 0,
      description: `Mobile specimen collection cart for ${cfg.badgeTitle}. Standard: ${cfg.standard}.`
    };
    this.interactiveObjects.push(boxMesh);

    return {
      id: cfg.id,
      config: cfg,
      group: cartGroup,
      boxMesh: boxMesh,
      specimenContainer: specimenContainer,
      specimens: []
    };
  }

  createBadgeTexture(title, subtitle, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Colored banner box
    const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.fillStyle = hexStr;
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, 512, 128, 12);
    } else {
      ctx.fillRect(0, 0, 512, 128);
    }
    ctx.fill();

    // Subtle dark gradient vignette
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 128);

    // Primary Title text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 48);

    // Subtitle text (Standard)
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.fillText(subtitle, 256, 88);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    return tex;
  }

  seedInitialSpecimens() {
    // Seed realistic sample items as seen in Reference Image 1
    // Cart 1: Conductor rods
    for (let i = 0; i < 6; i++) {
      this.addConductorRod('COPPER', i * 0.024 - 0.06, i * 0.015);
    }
    // Cart 2: Dumbbells
    for (let i = 0; i < 4; i++) {
      this.addDumbbellSpecimen((i % 2 === 0 ? -0.16 : 0.16), (i < 2 ? -0.04 : 0.04));
    }
    // Cart 3: Sheets
    for (let i = 0; i < 3; i++) {
      this.addSheetSpecimen(i * 0.18 - 0.18);
    }
    // Cart 4: Scrap
    for (let i = 0; i < 8; i++) {
      this.addScrapItem(i);
    }
  }

  // -------------------------------------------------------------
  // DYNAMIC PHYSICAL SPECIMEN ACCUMULATION
  // -------------------------------------------------------------

  addSpecimen(type, material = 'COPPER', isPass = true) {
    if (!isPass) {
      this.addScrapItem(this.carts.REJECT.specimens.length);
      this.carts.REJECT.boxMesh.userData.specimenCount++;
      return;
    }

    if (type === 'CONDUCTOR') {
      const idx = this.carts.CONDUCTOR.specimens.length;
      this.addConductorRod(material, (idx % 8) * 0.022 - 0.08, Math.floor(idx / 8) * 0.016);
      this.carts.CONDUCTOR.boxMesh.userData.specimenCount++;
    } else if (type === 'DUMBBELL') {
      const idx = this.carts.DUMBBELL.specimens.length;
      const xOff = (idx % 2 === 0 ? -0.16 : 0.16);
      const zOff = (idx % 4 < 2 ? -0.05 : 0.05);
      this.addDumbbellSpecimen(xOff, zOff);
      this.carts.DUMBBELL.boxMesh.userData.specimenCount++;
    } else if (type === 'SHEET') {
      const idx = this.carts.SHEET.specimens.length;
      this.addSheetSpecimen((idx % 4) * 0.16 - 0.24);
      this.carts.SHEET.boxMesh.userData.specimenCount++;
    }
  }

  addConductorRod(material, zOffset = 0, yOffset = 0) {
    const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.32, 16);
    rodGeo.rotateZ(Math.PI / 2);
    const rodMat = material === 'COPPER' ? this.matCopperRod : this.matAluRod;
    const rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.position.set((Math.random() - 0.5) * 0.04, yOffset + 0.01, zOffset);
    rodMesh.rotation.y = (Math.random() - 0.5) * 0.08;
    rodMesh.castShadow = true;
    this.carts.CONDUCTOR.specimenContainer.add(rodMesh);
    this.carts.CONDUCTOR.specimens.push(rodMesh);
  }

  addDumbbellSpecimen(xOffset = 0, zOffset = 0) {
    // 3D Dumbbell Tensile specimen geometry (IS 10810 Part 7)
    // Central narrow gauge section (75mm x 4mm x 2mm) with wide tab shoulders on both ends
    const dumbbellGroup = new THREE.Group();
    dumbbellGroup.position.set(xOffset, 0.008, zOffset);

    // Center gauge
    const gauge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.004, 0.024), this.matDumbbellPolymer);
    gauge.castShadow = true;
    dumbbellGroup.add(gauge);

    // Left & Right wide shoulder tabs
    [-0.07, 0.07].forEach((x) => {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.048), this.matDumbbellPolymer);
      tab.position.x = x;
      tab.castShadow = true;
      dumbbellGroup.add(tab);
    });

    this.carts.DUMBBELL.specimenContainer.add(dumbbellGroup);
    this.carts.DUMBBELL.specimens.push(dumbbellGroup);
  }

  addSheetSpecimen(xOffset = 0) {
    const sheetGeo = new THREE.BoxGeometry(0.14, 0.012, 0.22);
    const sheetMesh = new THREE.Mesh(sheetGeo, this.matSheetPolymer);
    sheetMesh.position.set(xOffset, 0.01, 0.0);
    sheetMesh.rotation.y = (Math.random() - 0.5) * 0.06;
    sheetMesh.castShadow = true;
    this.carts.SHEET.specimenContainer.add(sheetMesh);
    this.carts.SHEET.specimens.push(sheetMesh);
  }

  // Start a visible waste transfer. The scrap is created at the source, travels
  // along a simple physical chute path, and is only accepted by the reject cart
  // when it reaches the cart. This prevents instant spawning inside the bin.
  transportWaste(kind = 'PROCESS_WASTE', source = { x: 0, y: 0.2, z: -0.76 }, duration = 1.0) {
    const scrapGeo = (kind === 'PUNCH_SCRAP' || kind === 'REJECTED_SPECIMEN')
      ? new THREE.BoxGeometry(0.07, 0.012, 0.035)
      : new THREE.CylinderGeometry(0.014, 0.014, 0.10 + Math.random() * 0.06, 12);
    if (kind !== 'PUNCH_SCRAP') scrapGeo.rotateZ(Math.PI / 2);
    const scrap = new THREE.Mesh(scrapGeo, this.matScrapJacket);
    scrap.position.set(source.x, source.y, source.z);
    scrap.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    scrap.castShadow = true;
    this.group.add(scrap);

    const targetCart = this.carts.REJECT;
    const target = new THREE.Vector3(
      targetCart.config.xPos,
      0.18,
      0.04
    );

    // Waste follows the visible chute in two physical stages rather than moving
    // in a straight line through empty space.
    const start = scrap.position.clone();
    const chuteMid = new THREE.Vector3(0.55, 0.30, -0.28);
    const path = (kind === 'REJECTED_SPECIMEN')
      ? [start, target]
      : [start, chuteMid, target];

    this.wasteTransfers.push({
      scrap,
      kind,
      start,
      target,
      path,
      elapsed: 0,
      duration: Math.max(0.4, duration)
    });
  }

  transportRejectedSpecimen(source = { x: 1.82, y: 0.16, z: 0.04 }, duration = 0.8) {
    this.transportWaste('REJECTED_SPECIMEN', source, duration);
  }

  update(delta) {
    if (!this.wasteTransfers.length) return;
    for (let i = this.wasteTransfers.length - 1; i >= 0; i--) {
      const t = this.wasteTransfers[i];
      t.elapsed += delta;
      const p = THREE.MathUtils.clamp(t.elapsed / t.duration, 0, 1);
      const eased = p * p * (3 - 2 * p);

      if (t.path.length === 3) {
        // Piecewise interpolation follows the two visible chute sections.
        if (eased < 0.5) {
          const localP = eased * 2;
          t.scrap.position.lerpVectors(t.path[0], t.path[1], localP);
        } else {
          const localP = (eased - 0.5) * 2;
          t.scrap.position.lerpVectors(t.path[1], t.path[2], localP);
        }
      } else {
        t.scrap.position.lerpVectors(t.start, t.target, eased);
      }

      // Small physical bounce while travelling down the chute.
      t.scrap.position.y += Math.sin(p * Math.PI) * 0.025;
      t.scrap.rotation.x += delta * 4;
      if (p >= 1) {
        this.group.remove(t.scrap);
        this.addWaste(t.kind);
        this.wasteTransfers.splice(i, 1);
      }
    }
  }

  // Final receiving operation after the physical transfer reaches the cart.
  addWaste(kind = 'PROCESS_WASTE') {
    const cart = this.carts.REJECT;
    if (!cart) return;
    const idx = cart.specimens.length;
    const scrapGeo = (kind === 'PUNCH_SCRAP' || kind === 'REJECTED_SPECIMEN')
      ? new THREE.BoxGeometry(0.07, 0.012, 0.035)
      : new THREE.CylinderGeometry(0.014, 0.014, 0.10 + Math.random() * 0.06, 12);
    if (kind !== 'PUNCH_SCRAP') scrapGeo.rotateZ(Math.PI / 2);
    const scrap = new THREE.Mesh(scrapGeo, this.matScrapJacket);
    const layer = Math.floor(idx / 10);
    scrap.position.set((Math.random() - 0.5) * 0.28, 0.012 + layer * 0.009, (Math.random() - 0.5) * 0.18);
    scrap.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    scrap.castShadow = true;
    cart.specimenContainer.add(scrap);
    cart.specimens.push(scrap);
    cart.boxMesh.userData.specimenCount++;
  }

  addScrapItem(idx) {
    const scrapGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.08 + Math.random() * 0.08, 12, 1, false, 0, Math.PI * 1.4);
    scrapGeo.rotateZ(Math.PI / 2);
    const scrap = new THREE.Mesh(scrapGeo, this.matScrapJacket);
    scrap.position.set((Math.random() - 0.5) * 0.28, 0.01 + (idx * 0.006), (Math.random() - 0.5) * 0.18);
    scrap.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
    scrap.castShadow = true;
    this.carts.REJECT.specimenContainer.add(scrap);
    this.carts.REJECT.specimens.push(scrap);
  }

  setExploded(progress) {
    // Disassemble carts outward along +Z
    Object.values(this.carts).forEach((cart, i) => {
      cart.group.position.z = progress * (0.25 + i * 0.04);
    });
  }
}
