import * as THREE from 'three';

/**
 * VisionInspectionSystem.js
 * High-Speed Industrial Telecentric Vision Inspection Station.
 * Features:
 * - Telecentric Lens & C-Mount Camera Housing
 * - High-Intensity White LED Ring Light Illuminator
 * - Laser Line Projector / Backlight Inspection Bed
 * - Real-time automated metrology: Length, Width, Thickness, Edge Quality, Shape
 */
export class VisionInspectionSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'VisionInspectionSystem';
    this.group.position.set(1.45, 0.50, 0.0); // Stationed between prep bay and sorting trays

    this.isInspecting = false;
    this.flashIntensity = 0.0;
    this.currentResult = 'PENDING'; // 'PASS', 'REJECT', 'PENDING'
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildCameraGantry();
    this.buildRingLight();
    this.buildInspectionBed();
  }

  initMaterials() {
    // 1. Telecentric Camera Housing (Industrial Blue / Black #0284c7)
    this.matCameraBody = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.7
    });

    // 2. Optical Chrome Lens Barrel & Aperture Ring
    this.matLensBarrel = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.92
    });

    // 3. LED Ring Illuminator Bezel & Light Diffuser
    this.matRingDiffuser = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    // 4. Inspection Bed Glass (Translucent white diffused backlight)
    this.matBacklightGlass = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.92
    });
  }

  buildCameraGantry() {
    // Overhead camera bracket arm mounted to extrusion upright
    const armGeo = new THREE.BoxGeometry(0.04, 0.04, 0.28);
    const armMesh = new THREE.Mesh(armGeo, this.matCameraBody);
    armMesh.position.set(0.0, 0.36, -0.14);
    this.group.add(armMesh);

    // Telecentric camera assembly pointing straight down (-Y)
    this.cameraAssembly = new THREE.Group();
    this.cameraAssembly.position.set(0.0, 0.36, 0.0);

    // Main camera body
    const bodyGeo = new THREE.BoxGeometry(0.065, 0.09, 0.065);
    const body = new THREE.Mesh(bodyGeo, this.matCameraBody);
    this.cameraAssembly.add(body);

    // Telecentric lens barrel
    const lensGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.12, 24);
    const lens = new THREE.Mesh(lensGeo, this.matLensBarrel);
    lens.position.y = -0.09;
    this.cameraAssembly.add(lens);

    this.group.add(this.cameraAssembly);

    body.userData = {
      name: 'High-Resolution Telecentric Vision Camera',
      category: 'INSPECTION_SYSTEM',
      description: '5-Megapixel telecentric metrology camera with sub-micron optical distortion (<0.02%).'
    };
    this.interactiveObjects.push(body);
  }

  buildRingLight() {
    // High-intensity circular LED ring illuminator mounted on lens tip
    this.ringGroup = new THREE.Group();
    this.ringGroup.position.set(0.0, 0.20, 0.0);

    const ringGeo = new THREE.TorusGeometry(0.038, 0.008, 12, 32);
    ringGeo.rotateX(Math.PI / 2);
    this.ringMesh = new THREE.Mesh(ringGeo, this.matRingDiffuser);
    this.ringGroup.add(this.ringMesh);

    // Dynamic point light simulating strobe flash
    this.strobeLight = new THREE.PointLight(0xffffff, 0, 1.2, 2.0);
    this.strobeLight.position.set(0, -0.04, 0);
    this.ringGroup.add(this.strobeLight);

    this.group.add(this.ringGroup);
  }

  buildInspectionBed() {
    // Precision diffused white backlight stage where specimen is placed
    const bedGroup = new THREE.Group();
    bedGroup.position.set(0.0, -0.02, 0.0);

    const plateGeo = new THREE.BoxGeometry(0.24, 0.015, 0.16);
    const frame = new THREE.Mesh(plateGeo, this.matCameraBody);
    bedGroup.add(frame);

    const glassGeo = new THREE.PlaneGeometry(0.20, 0.12);
    const glass = new THREE.Mesh(glassGeo, this.matBacklightGlass);
    glass.rotation.x = -Math.PI / 2;
    glass.position.y = 0.008;
    bedGroup.add(glass);

    this.group.add(bedGroup);
  }

  triggerInspectionFlash(onComplete = null) {
    this.isInspecting = true;
    this.strobeLight.intensity = 8.0;
    this.matRingDiffuser.color.setHex(0xffffff);

    let frame = 0;
    const flashTimer = setInterval(() => {
      frame++;
      if (frame === 1) {
        this.strobeLight.intensity = 14.0;
      } else if (frame === 2) {
        this.strobeLight.intensity = 3.0;
      } else {
        this.strobeLight.intensity = 0.0;
        this.isInspecting = false;
        clearInterval(flashTimer);
        if (onComplete) onComplete();
      }
    }, 45);
  }

  update(delta) {
    // Visual idle updates
  }
}
