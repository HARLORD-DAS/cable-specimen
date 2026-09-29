import * as THREE from 'three';

/**
 * LaserMeasurementSystem.js
 * Dual-Axis Laser Micrometer Optical Measurement Frame.
 * Incorporates 4 Precision Optical Heads:
 * - TOP SENSOR (Laser Transmitter)
 * - BOTTOM SENSOR (Optical CCD/CMOS Receiver)
 * - LEFT / REAR SENSOR (Laser Transmitter)
 * - RIGHT / FRONT SENSOR (Optical CCD/CMOS Receiver)
 *
 * Real-time measures: Outer Diameter (OD), Ovality, X-center, Y-center, Cross-Section Profile.
 * Feeds live geometric feedback into PLC positioning and adaptive clamping.
 */
export class LaserMeasurementSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LaserProfileMeasurementSystem';
    this.group.position.set(-0.82, 0.50, 0.0); // Stationed right after straightener

    this.measuredDiameterMm = 24.0;
    this.measuredOvalityMm = 0.04;
    this.measuredCenterX = 0.0;
    this.measuredCenterY = 0.0;
    this.isActive = true;
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildMeasurementGantry();
    this.buildLaserSensors();
    this.buildLaserBeams();
  }

  initMaterials() {
    // 1. Black Anodized Aluminium Sensor Frame Body
    this.matGantry = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.7,
      name: 'LaserGantryFrame'
    });

    // 2. Optical Glass Emitter & Receiver Windows
    this.matOpticGlass = new THREE.MeshPhysicalMaterial({
      color: 0xdcfce7,
      transmission: 0.9,
      roughness: 0.05,
      transparent: true,
      name: 'LaserOpticWindow'
    });

    // 3. Precision Laser Sheet Projection Material (Vibrant Red with Edge Glow)
    this.matLaserSheet = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.matLaserCenterLine = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.85
    });

    // 4. Sensor Status LED
    this.matSensorLed = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  }

  buildMeasurementGantry() {
    // Square annular gantry frame enclosing cable pass-through centerline
    const outerW = 0.28;
    const outerH = 0.28;
    const thickness = 0.045;
    const depth = 0.06;

    const frameGroup = new THREE.Group();

    // Top beam
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(outerW, thickness, depth), this.matGantry);
    topBeam.position.set(0, outerH * 0.5 - thickness * 0.5, 0);
    frameGroup.add(topBeam);

    // Bottom beam
    const botBeam = new THREE.Mesh(new THREE.BoxGeometry(outerW, thickness, depth), this.matGantry);
    botBeam.position.set(0, -(outerH * 0.5 - thickness * 0.5), 0);
    frameGroup.add(botBeam);

    // Left (Rear) upright
    const leftBeam = new THREE.Mesh(new THREE.BoxGeometry(thickness, outerH, depth), this.matGantry);
    leftBeam.position.set(0, 0, -(outerW * 0.5 - thickness * 0.5));
    frameGroup.add(leftBeam);

    // Right (Front) upright
    const rightBeam = new THREE.Mesh(new THREE.BoxGeometry(thickness, outerH, depth), this.matGantry);
    rightBeam.position.set(0, 0, outerW * 0.5 - thickness * 0.5);
    frameGroup.add(rightBeam);

    // Mounting stanchion to machine bed
    const mountStanchion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), this.matGantry);
    mountStanchion.position.set(0, -0.18, 0);
    frameGroup.add(mountStanchion);

    this.group.add(frameGroup);
  }

  buildLaserSensors() {
    // 4 Discrete Optical Heads:
    // 1. TOP SENSOR: Vertical Laser Transmitter
    this.topEmitter = this.createSensorHead('Top Laser Emitter (Y-Axis Transmitter)', 0, 0.11, 0, 0);
    this.group.add(this.topEmitter);

    // 2. BOTTOM SENSOR: Vertical CCD/CMOS Receiver
    this.bottomReceiver = this.createSensorHead('Bottom Laser Receiver (Y-Axis Detector)', 0, -0.11, 0, Math.PI);
    this.group.add(this.bottomReceiver);

    // 3. LEFT/REAR SENSOR: Horizontal Laser Transmitter
    this.leftEmitter = this.createSensorHead('Left Laser Emitter (Z-Axis Transmitter)', 0, 0, -0.11, -Math.PI / 2);
    this.group.add(this.leftEmitter);

    // 4. RIGHT/FRONT SENSOR: Horizontal CCD/CMOS Receiver
    this.rightReceiver = this.createSensorHead('Right Laser Receiver (Z-Axis Detector)', 0, 0, 0.11, Math.PI / 2);
    this.group.add(this.rightReceiver);
  }

  createSensorHead(name, x, y, z, rotZ) {
    const headGroup = new THREE.Group();
    headGroup.position.set(x, y, z);
    headGroup.rotation.z = rotZ;

    const bodyGeo = new THREE.BoxGeometry(0.05, 0.024, 0.04);
    const body = new THREE.Mesh(bodyGeo, this.matGantry);
    headGroup.add(body);

    const windowGeo = new THREE.BoxGeometry(0.035, 0.005, 0.03);
    const opticWin = new THREE.Mesh(windowGeo, this.matOpticGlass);
    opticWin.position.y = -0.012;
    headGroup.add(opticWin);

    const ledGeo = new THREE.SphereGeometry(0.003, 8, 8);
    const led = new THREE.Mesh(ledGeo, this.matSensorLed);
    led.position.set(0.018, 0.012, 0.015);
    headGroup.add(led);

    body.userData = {
      name,
      category: 'MEASUREMENT_SYSTEM',
      description: 'High-speed telecentric dual-plane laser micrometer sensor (sampling rate: 2500 Hz, accuracy: ±0.001 mm).'
    };
    this.interactiveObjects.push(body);

    return headGroup;
  }

  buildLaserBeams() {
    // Projected red laser fan planes across the aperture:
    // Vertical laser sheet from Top to Bottom
    const vSheetGeo = new THREE.PlaneGeometry(0.03, 0.22);
    this.vLaserSheet = new THREE.Mesh(vSheetGeo, this.matLaserSheet);
    this.vLaserSheet.rotation.y = Math.PI / 2;
    this.group.add(this.vLaserSheet);

    // Horizontal laser sheet from Rear to Front
    const hSheetGeo = new THREE.PlaneGeometry(0.03, 0.22);
    this.hLaserSheet = new THREE.Mesh(hSheetGeo, this.matLaserSheet);
    this.hLaserSheet.rotation.x = Math.PI / 2;
    this.group.add(this.hLaserSheet);
  }

  setMeasuredCableDiameter(diameterMm) {
    this.measuredDiameterMm = diameterMm;
    // Slight simulated dynamic noise
    const noise = (Math.random() - 0.5) * 0.02;
    this.measuredOvalityMm = 0.03 + Math.abs(noise);
  }

  update(delta) {
    if (this.isActive) {
      // Subtle pulse on laser sheets to convey active high-speed optical scanning
      const pulse = 0.32 + Math.sin(Date.now() * 0.008) * 0.06;
      this.matLaserSheet.opacity = pulse;
    }
  }
}
