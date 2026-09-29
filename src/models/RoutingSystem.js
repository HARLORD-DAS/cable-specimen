import * as THREE from 'three';

/**
 * RoutingSystem.js
 * 2-Axis Overhead Servo Transfer Shuttle & Physical Sorting Diverters.
 * Moves finished specimens from preparation stations -> vision stage -> PASS / REJECT trays.
 *
 * Mechanically includes:
 * - Linear servo gantry along X & Z axes
 * - Vacuum pickup head / pneumatic gripper that physically picks and places specimens
 * - Pneumatic sorting diverter gate
 * - Stainless steel PASS Tray
 * - Stainless steel REJECT Tray
 * - Conductor Specimen Tray
 *
 * Adheres strictly to the NO TELEPORTATION rule: Every transfer is physically animated.
 */
export class RoutingSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SpecimenRoutingAndSortingSystem';

    this.shuttlePosX = 0.85; // Initial X over prep stations
    this.shuttlePosZ = 0.0;
    this.shuttlePosY = 0.72; // Gantry height
    this.gripperDropY = 0.0; // Gripper extension downward
    this.diverterAngle = 0.0; // 0 = neutral, +0.32 = PASS, -0.32 = REJECT

    this.heldSpecimenType = null; // 'DUMBBELL', 'CONDUCTOR', null
    this.passCount = 0;
    this.rejectCount = 0;
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildGantryTrack();
    this.buildTransferShuttle();
    this.buildDiverterGate();
    this.buildTrays();
    this.buildMobileSpecimen();
  }

  initMaterials() {
    // 1. Gantry Extrusion Rail (#8E8E8A)
    this.matGantryRail = new THREE.MeshStandardMaterial({
      color: 0x8e8e8a,
      roughness: 0.3,
      metalness: 0.75
    });

    // 2. Shuttle Carriage Body (#334155)
    this.matShuttle = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.65
    });

    // 3. Ground Chrome Shafts & Air Cylinders
    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.15,
      metalness: 0.92
    });

    // 4. Stainless Steel Trays (Brushed satin)
    this.matTrayStainless = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.28,
      metalness: 0.85,
      name: 'TrayStainless'
    });

    // 5. Suction Vacuum Gripper Pad (Silicone rubber blue)
    this.matVacuumPad = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.6,
      metalness: 0.1
    });

    // 6. Diverter Gate Flap (Polished Anodized Aluminium)
    this.matDiverterFlap = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.85
    });
  }

  buildGantryTrack() {
    // Overhead linear guide beam running along machine line (X: 0.6 to 2.1, Y: 0.78, Z: 0.0)
    const beamGeo = new THREE.BoxGeometry(1.6, 0.045, 0.06);
    const beam = new THREE.Mesh(beamGeo, this.matGantryRail);
    beam.position.set(1.35, 0.78, 0.0);
    beam.castShadow = true;
    this.group.add(beam);

    // Twin chrome guide shafts on beam
    const shaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.58, 16);
    shaftGeo.rotateZ(Math.PI / 2);

    const sFront = new THREE.Mesh(shaftGeo, this.matChrome);
    sFront.position.set(1.35, 0.75, 0.025);
    this.group.add(sFront);

    const sRear = new THREE.Mesh(shaftGeo, this.matChrome);
    sRear.position.set(1.35, 0.75, -0.025);
    this.group.add(sRear);
  }

  buildTransferShuttle() {
    // Traveling Shuttle Carriage
    this.shuttleGroup = new THREE.Group();
    this.shuttleGroup.position.set(this.shuttlePosX, 0.75, 0.0);

    const carriageBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), this.matShuttle);
    carriageBody.castShadow = true;
    this.shuttleGroup.add(carriageBody);

    // Vertical Pneumatic Gripper Stroke Cylinder
    const cylGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.16, 16);
    const cylMesh = new THREE.Mesh(cylGeo, this.matChrome);
    cylMesh.position.y = 0.04;
    this.shuttleGroup.add(cylMesh);

    // Dropping gripper rod and suction head
    this.gripperAssembly = new THREE.Group();
    this.gripperAssembly.position.set(0.0, -0.04, 0.0);

    const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 16);
    const rod = new THREE.Mesh(rodGeo, this.matChrome);
    this.gripperAssembly.add(rod);

    // Dual vacuum suction pads
    const padGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.012, 16);
    const pad1 = new THREE.Mesh(padGeo, this.matVacuumPad);
    pad1.position.set(-0.025, -0.11, 0.0);
    this.gripperAssembly.add(pad1);

    const pad2 = new THREE.Mesh(padGeo, this.matVacuumPad);
    pad2.position.set(0.025, -0.11, 0.0);
    this.gripperAssembly.add(pad2);

    this.shuttleGroup.add(this.gripperAssembly);
    this.group.add(this.shuttleGroup);

    carriageBody.userData = {
      name: '2-Axis Servo Specimen Transfer Shuttle',
      category: 'ROUTING_SYSTEM',
      description: 'High-speed pick-and-place servo carriage with vacuum suction cup array for specimen transfer.'
    };
    this.interactiveObjects.push(carriageBody);
  }

  buildDiverterGate() {
    // Mechanical Sorting Diverter Gate positioned at X = 1.78
    this.diverterGroup = new THREE.Group();
    this.diverterGroup.position.set(1.78, 0.46, 0.0);

    // Diverter actuator housing
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), this.matShuttle);
    box.position.set(0, 0.04, -0.12);
    this.diverterGroup.add(box);

    // Pivoting stainless flap
    const flapGeo = new THREE.BoxGeometry(0.14, 0.008, 0.16);
    this.diverterFlap = new THREE.Mesh(flapGeo, this.matDiverterFlap);
    this.diverterFlap.position.set(0.06, 0.01, 0.0);
    this.diverterGroup.add(this.diverterFlap);

    this.group.add(this.diverterGroup);

    this.diverterFlap.userData = {
      name: 'Pneumatic Sorting Diverter Gate',
      category: 'ROUTING_SYSTEM',
      description: 'High-speed directional diverter sorting specimens into PASS or REJECT trays based on vision metrology.'
    };
    this.interactiveObjects.push(this.diverterFlap);
  }

  buildTrays() {
    this.traysGroup = new THREE.Group();
    this.traysGroup.position.set(1.95, 0.44, 0.0);

    // 1. Stainless Steel PASS Tray (Front side: Z = +0.18)
    this.passTray = this.createCollectionTray(0.32, 0.06, 0.22, 'PASS SPECIMENS', 0x22c55e);
    this.passTray.position.set(0.0, 0.0, 0.16);
    this.traysGroup.add(this.passTray);

    // 2. Stainless Steel REJECT Tray (Rear side: Z = -0.18)
    this.rejectTray = this.createCollectionTray(0.32, 0.06, 0.22, 'REJECT / REWORK', 0xef4444);
    this.rejectTray.position.set(0.0, 0.0, -0.16);
    this.traysGroup.add(this.rejectTray);

    this.group.add(this.traysGroup);
  }

  createCollectionTray(length, height, width, label, badgeColorHex) {
    const tray = new THREE.Group();

    // Bottom plate
    const botGeo = new THREE.BoxGeometry(length, 0.008, width);
    const bot = new THREE.Mesh(botGeo, this.matTrayStainless);
    bot.position.y = -height * 0.5;
    tray.add(bot);

    // 4 Walls
    const wallThick = 0.006;
    // Left & Right
    const sideGeo = new THREE.BoxGeometry(wallThick, height, width);
    const leftW = new THREE.Mesh(sideGeo, this.matTrayStainless);
    leftW.position.x = -length * 0.5;
    tray.add(leftW);

    const rightW = new THREE.Mesh(sideGeo, this.matTrayStainless);
    rightW.position.x = length * 0.5;
    tray.add(rightW);

    // Front & Back
    const fbGeo = new THREE.BoxGeometry(length, height, wallThick);
    const frontW = new THREE.Mesh(fbGeo, this.matTrayStainless);
    frontW.position.z = width * 0.5;
    tray.add(frontW);

    const backW = new THREE.Mesh(fbGeo, this.matTrayStainless);
    backW.position.z = -width * 0.5;
    tray.add(backW);

    // Status Label Badge on front wall
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + badgeColorHex.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 128, 42);

    const badgeTex = new THREE.CanvasTexture(canvas);
    const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTex });
    const badgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.04), badgeMat);
    badgeMesh.position.set(0, 0.0, width * 0.5 + 0.004);
    tray.add(badgeMesh);

    bot.userData = {
      name: `${label} Collection Tray`,
      category: 'ROUTING_SYSTEM',
      description: `Removable stainless steel receptacle for ${label.toLowerCase()}.`
    };
    this.interactiveObjects.push(bot);

    return tray;
  }

  buildMobileSpecimen() {
    // 3D Specimen carried by the shuttle during transfer
    this.mobileSpecimen = new THREE.Group();
    this.mobileSpecimen.position.set(0.0, -0.125, 0.0);

    // Dumbbell representation
    const shape = new THREE.BoxGeometry(0.075, 0.003, 0.02);
    this.mobileDumbbellMesh = new THREE.Mesh(shape, this.matVacuumPad);
    this.mobileSpecimen.add(this.mobileDumbbellMesh);

    // Conductor wire representation
    const wire = new THREE.CylinderGeometry(0.002, 0.002, 0.16, 12);
    wire.rotateZ(Math.PI / 2);
    this.mobileWireMesh = new THREE.Mesh(wire, new THREE.MeshStandardMaterial({ color: 0xc86432, metalness: 0.9 }));
    this.mobileSpecimen.add(this.mobileWireMesh);

    this.mobileSpecimen.visible = false;
    this.gripperAssembly.add(this.mobileSpecimen);
  }

  // -------------------------------------------------------------
  // ANIMATION METHODS
  // -------------------------------------------------------------

  setShuttlePosition(x, dropProgress = 0.0) {
    this.shuttlePosX = x;
    this.shuttleGroup.position.x = x;

    // dropProgress: 0.0 = fully raised, 1.0 = lowered to pick/place level
    const raisedY = -0.04;
    const loweredY = -0.18; // touches stage
    this.gripperAssembly.position.y = THREE.MathUtils.lerp(raisedY, loweredY, dropProgress);
  }

  attachSpecimen(type = 'DUMBBELL') {
    this.heldSpecimenType = type;
    this.mobileSpecimen.visible = true;
    this.mobileDumbbellMesh.visible = type === 'DUMBBELL';
    this.mobileWireMesh.visible = type === 'CONDUCTOR';
  }

  detachSpecimen() {
    this.heldSpecimenType = null;
    this.mobileSpecimen.visible = false;
  }

  setDiverter(state = 'NEUTRAL') {
    // state: 'NEUTRAL', 'PASS', 'REJECT'
    if (state === 'PASS') {
      this.diverterAngle = 0.35;
      this.passCount++;
    } else if (state === 'REJECT') {
      this.diverterAngle = -0.35;
      this.rejectCount++;
    } else {
      this.diverterAngle = 0.0;
    }
    this.diverterFlap.rotation.x = this.diverterAngle;
  }

  update(delta) {
    // Visual idle updates
  }
}
