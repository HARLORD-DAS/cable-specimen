import * as THREE from 'three';

/**
 * EnclosureSystem.js
 * Transparent Polycarbonate Safety Enclosure with interlock switch
 * and dynamic view mode toggling (Normal View vs Engineering View).
 */
export class EnclosureSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SafetyEnclosureSystem';

    this.isDoorOpen = false;
    this.isEngineeringView = false;
    this.doorSlideOffset = 0.0;
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildEnclosurePanels();
    this.buildSafetyInterlock();
  }

  initMaterials() {
    // 1. Transparent Polycarbonate Guard Panels (Physical Material)
    this.matPolycarbNormal = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.88,
      opacity: 0.38,
      transparent: true,
      roughness: 0.08,
      metalness: 0.05,
      ior: 1.58, // Polycarbonate index of refraction
      reflectivity: 0.6,
      depthWrite: false,
      name: 'PolycarbonateGuard'
    });

    // 2. Engineering View Ghosted Material (Near Invisible to expose inner mechanisms)
    this.matPolycarbEngineering = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.98,
      opacity: 0.08,
      transparent: true,
      roughness: 0.05,
      depthWrite: false,
      name: 'PolycarbEngineeringView'
    });

    // 3. Aluminium Sash Frame for Door Panels
    this.matDoorFrame = new THREE.MeshStandardMaterial({
      color: 0x8e8e8a,
      roughness: 0.3,
      metalness: 0.75,
      name: 'DoorAluFrame'
    });

    // 4. Door Handles
    this.matHandle = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.5
    });

    // 5. Interlock Safety Switch Housing
    this.matInterlockHousing = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Red safety switch body
      roughness: 0.4,
      metalness: 0.2
    });
    this.matInterlockKey = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.9
    });
  }

  buildEnclosurePanels() {
    this.guardPanels = [];

    // Fixed Top Polycarbonate Roof Panels (X: -2.25 to 2.25, Z: -0.65 to 0.65, Y: 1.68)
    const roofGeo = new THREE.BoxGeometry(4.45, 0.008, 1.25);
    this.roofMesh = new THREE.Mesh(roofGeo, this.matPolycarbNormal);
    this.roofMesh.position.set(0.0, 1.68, 0.0);
    this.group.add(this.roofMesh);
    this.guardPanels.push(this.roofMesh);

    // Fixed Rear Polycarbonate Panels
    const rearGeo = new THREE.BoxGeometry(4.45, 1.15, 0.008);
    this.rearMesh = new THREE.Mesh(rearGeo, this.matPolycarbNormal);
    this.rearMesh.position.set(0.0, 1.05, -0.65);
    this.group.add(this.rearMesh);
    this.guardPanels.push(this.rearMesh);

    // Fixed Left End Panel (Cable Inlet aperture cutout)
    const endGeo = new THREE.BoxGeometry(0.008, 1.15, 1.25);
    this.leftMesh = new THREE.Mesh(endGeo, this.matPolycarbNormal);
    this.leftMesh.position.set(-2.25, 1.05, 0.0);
    this.group.add(this.leftMesh);
    this.guardPanels.push(this.leftMesh);

    // Fixed Right End Panel (Specimen exit / maintenance)
    this.rightMesh = new THREE.Mesh(endGeo, this.matPolycarbNormal);
    this.rightMesh.position.set(2.25, 1.05, 0.0);
    this.group.add(this.rightMesh);
    this.guardPanels.push(this.rightMesh);

    // Front Sliding Polycarbonate Safety Doors (Left Door & Right Door)
    this.doorGroup = new THREE.Group();
    this.doorGroup.name = 'SlidingSafetyDoors';

    // Left Front Door Assembly
    this.leftDoorAssembly = this.createDoorAssembly(1.15, 1.15, -0.58);
    this.doorGroup.add(this.leftDoorAssembly);

    // Right Front Door Assembly
    this.rightDoorAssembly = this.createDoorAssembly(1.15, 1.15, 0.58);
    this.doorGroup.add(this.rightDoorAssembly);

    this.group.add(this.doorGroup);
  }

  createDoorAssembly(width, height, defaultX) {
    const assembly = new THREE.Group();
    assembly.position.set(defaultX, 1.05, 0.65);

    // Polycarbonate Pane
    const paneGeo = new THREE.BoxGeometry(width - 0.04, height - 0.04, 0.008);
    const pane = new THREE.Mesh(paneGeo, this.matPolycarbNormal);
    assembly.add(pane);
    this.guardPanels.push(pane);

    // Aluminium Sash Border Frame
    const frameGeo = new THREE.BoxGeometry(width, height, 0.024);
    // Cutout center
    const sash = new THREE.Mesh(frameGeo, this.matDoorFrame);
    sash.scale.set(1, 1, 0.5);
    // Outer edges
    assembly.add(sash);

    // Door Handle
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 16);
    const handle = new THREE.Mesh(handleGeo, this.matHandle);
    handle.position.set(defaultX < 0 ? width * 0.4 : -width * 0.4, 0.0, 0.025);
    assembly.add(handle);

    // User data for clicking
    sash.userData = {
      name: 'Safety Enclosure Interlocked Door',
      category: 'ENCLOSURE',
      action: 'TOGGLE_DOOR',
      description: 'Transparent polycarbonate safety door with Cat 4 / SIL 3 RFID interlock switch.'
    };
    this.interactiveObjects.push(sash);

    return assembly;
  }

  buildSafetyInterlock() {
    // Interlock Switch mounted between door frame and pillar
    this.interlockGroup = new THREE.Group();
    this.interlockGroup.name = 'SafetyInterlockSwitch';
    this.interlockGroup.position.set(0.0, 1.62, 0.66);

    const switchBodyGeo = new THREE.BoxGeometry(0.06, 0.12, 0.04);
    this.interlockBody = new THREE.Mesh(switchBodyGeo, this.matInterlockHousing);
    this.interlockGroup.add(this.interlockBody);

    // Key actuator pin
    const keyGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.05, 12);
    this.interlockKey = new THREE.Mesh(keyGeo, this.matInterlockKey);
    this.interlockKey.position.y = -0.04;
    this.interlockGroup.add(this.interlockKey);

    // Safety status LED indicator
    const ledGeo = new THREE.SphereGeometry(0.008, 12, 12);
    this.matInterlockLed = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Green = closed & safe
    this.interlockLed = new THREE.Mesh(ledGeo, this.matInterlockLed);
    this.interlockLed.position.set(0, 0.035, 0.022);
    this.interlockGroup.add(this.interlockLed);

    this.group.add(this.interlockGroup);
  }

  setEngineeringView(enabled) {
    this.isEngineeringView = enabled;
    const targetMat = enabled ? this.matPolycarbEngineering : this.matPolycarbNormal;
    this.guardPanels.forEach(p => {
      p.material = targetMat;
    });
  }

  toggleDoor() {
    this.isDoorOpen = !this.isDoorOpen;
    return this.isDoorOpen;
  }

  update(delta) {
    // Smooth door slide open / close animation
    const targetSlide = this.isDoorOpen ? 0.85 : 0.0;
    this.doorSlideOffset = THREE.MathUtils.lerp(this.doorSlideOffset, targetSlide, delta * 6.0);

    // Left door slides left (-X), right door slides right (+X)
    if (this.leftDoorAssembly) {
      this.leftDoorAssembly.position.x = -0.58 - this.doorSlideOffset;
    }
    if (this.rightDoorAssembly) {
      this.rightDoorAssembly.position.x = 0.58 + this.doorSlideOffset;
    }

    // Interlock key follows door
    if (this.interlockKey) {
      this.interlockKey.position.x = this.doorSlideOffset * 0.1;
    }

    // Interlock LED turns red when open, green when closed
    if (this.matInterlockLed) {
      this.matInterlockLed.color.setHex(this.isDoorOpen ? 0xef4444 : 0x22c55e);
    }
  }
}
