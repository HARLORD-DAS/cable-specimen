import * as THREE from 'three';

/**
 * EnclosureSystem.js
 * Transparent Polycarbonate Safety Enclosure (fixed guard; no door)
 * and dynamic view mode toggling (Normal View vs Engineering View).
 */
export class EnclosureSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SafetyEnclosureSystem';

    this.isEngineeringView = false;
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

    // 3. Aluminium Sash Frame
    this.matDoorFrame = new THREE.MeshStandardMaterial({
      color: 0x8e8e8a,
      roughness: 0.3,
      metalness: 0.75,
      name: 'GuardAluFrame'
    });

    // 4. Reserved guard hardware
    this.matHandle = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.5
    });

    // 5. Safety Switch Housing
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

    // Fixed transparent polycarbonate enclosure only. No physical doors or door animation.
    const roofGeo = new THREE.BoxGeometry(4.45, 0.008, 1.25);
    this.roofMesh = new THREE.Mesh(roofGeo, this.matPolycarbNormal);
    this.roofMesh.position.set(0.0, 1.68, 0.0);
    this.group.add(this.roofMesh);
    this.guardPanels.push(this.roofMesh);

    const rearGeo = new THREE.BoxGeometry(4.45, 1.15, 0.008);
    this.rearMesh = new THREE.Mesh(rearGeo, this.matPolycarbNormal);
    this.rearMesh.position.set(0.0, 1.05, -0.65);
    this.group.add(this.rearMesh);
    this.guardPanels.push(this.rearMesh);

    const endGeo = new THREE.BoxGeometry(0.008, 1.15, 1.25);
    this.leftMesh = new THREE.Mesh(endGeo, this.matPolycarbNormal);
    this.leftMesh.position.set(-2.25, 1.05, 0.0);
    this.group.add(this.leftMesh);
    this.guardPanels.push(this.leftMesh);

    this.rightMesh = new THREE.Mesh(endGeo, this.matPolycarbNormal);
    this.rightMesh.position.set(2.25, 1.05, 0.0);
    this.group.add(this.rightMesh);
    this.guardPanels.push(this.rightMesh);
  }

  buildSafetyInterlock() {
    // Fixed safety switch housing on the enclosure frame
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


  update(delta) {
    // Fixed enclosure: no door state or door animation.
  }}
