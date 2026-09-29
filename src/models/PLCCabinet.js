import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';

/**
 * PLCCabinet.js
 * Industrial Electrical Control Cabinet and Pivoting HMI Touchscreen Console.
 * Features:
 * - Siemens S7-1500 style Motion PLC rack (CPU, Digital I/O, High-Speed Counter)
 * - 24V DC Industrial Switched-Mode Power Supply (SITOP)
 * - Multi-Axis Synchronous Servo Drives (SINAMICS S120) with active status LEDs
 * - Pilz / Siemens SIL-3 Safety Relay Unit
 * - Slotted wiring raceways and DIN-rail terminal blocks
 * - Pivoting articulated arm with 15.6" capacitive HMI touch console
 */
export class PLCCabinet {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ElectricalControlCabinet';
    this.group.position.set(-0.8, 1.0, -0.68); // Rear upper section

    this.interactiveObjects = [];

    this.initMaterials();
    this.buildCabinetEnclosure();
    this.buildPLCRack();
    this.buildServoDrives();
    this.buildPowerSupplyAndSafetyRelay();
    this.buildHMIConsole();
  }

  initMaterials() {
    // 1. Cabinet Body (#C8C8C6 / Powder-coated industrial sheet metal)
    this.matCabinet = new THREE.MeshStandardMaterial({
      color: 0xc8c8c6,
      roughness: 0.35,
      metalness: 0.65,
      name: 'PLCCabinetSheetMetal'
    });

    // 2. Interior Backplate (#E5E7EB)
    this.matBackplate = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb,
      roughness: 0.4,
      metalness: 0.5
    });

    // 3. DIN Rails (Ground Zinc-plated steel)
    this.matDINRail = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.25,
      metalness: 0.85
    });

    // 4. Slotted PVC Cable Raceway Ducting (Industrial Light Gray)
    this.matRaceway = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.55,
      metalness: 0.1
    });

    // 5. Siemens S7-1500 Faceplates
    this.texPLCCPU = TextureGenerator.createPLCModuleTexture('CPU');
    this.texPLCDIO = TextureGenerator.createPLCModuleTexture('DIO');

    this.matPLCCPU = new THREE.MeshStandardMaterial({
      map: this.texPLCCPU,
      roughness: 0.3,
      metalness: 0.4
    });

    this.matPLCDIO = new THREE.MeshStandardMaterial({
      map: this.texPLCDIO,
      roughness: 0.3,
      metalness: 0.4
    });

    // 6. Servo Drives (Sinamics style black chassis with silver heat sink)
    this.matServoDrive = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.65
    });

    // 7. Safety Relay (Vibrant Industrial Yellow / Red)
    this.matSafetyRelay = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.35,
      metalness: 0.15
    });

    // 8. HMI Touchscreen Glass (Deep piano black with subtle reflections)
    this.matHMIGlass = new THREE.MeshPhysicalMaterial({
      color: 0x09090b,
      roughness: 0.1,
      metalness: 0.9,
      reflectivity: 0.8
    });
  }

  buildCabinetEnclosure() {
    // Wall-mounted IP54 industrial control cabinet
    const w = 1.35;
    const h = 0.85;
    const d = 0.28;

    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const boxMesh = new THREE.Mesh(boxGeo, this.matCabinet);
    boxMesh.castShadow = true;
    this.group.add(boxMesh);

    // Front access door cutout frame
    const doorFrameGeo = new THREE.BoxGeometry(w - 0.04, h - 0.04, 0.02);
    const doorFrame = new THREE.Mesh(doorFrameGeo, this.matBackplate);
    doorFrame.position.z = d * 0.5 + 0.005;
    this.group.add(doorFrame);

    // 3 Horizontal DIN Rails
    [-0.24, 0.02, 0.26].forEach(y => {
      const railGeo = new THREE.BoxGeometry(w - 0.12, 0.035, 0.015);
      const rail = new THREE.Mesh(railGeo, this.matDINRail);
      rail.position.set(0, y, d * 0.5 + 0.015);
      this.group.add(rail);

      // Slotted cable duct beneath rail
      const ductGeo = new THREE.BoxGeometry(w - 0.12, 0.03, 0.025);
      const duct = new THREE.Mesh(ductGeo, this.matRaceway);
      duct.position.set(0, y - 0.04, d * 0.5 + 0.018);
      this.group.add(duct);
    });
  }

  buildPLCRack() {
    // S7-1500 PLC Rack on top DIN rail (Y = 0.26)
    const plcGroup = new THREE.Group();
    plcGroup.position.set(-0.25, 0.26, 0.16);

    // CPU 1515-2 PN Module
    const cpuGeo = new THREE.BoxGeometry(0.08, 0.18, 0.08);
    const cpuMesh = new THREE.Mesh(cpuGeo, this.matPLCCPU);
    cpuMesh.position.x = -0.12;
    plcGroup.add(cpuMesh);

    // 3 Digital & Analog I/O Expansion Modules
    for (let m = 0; m < 3; m++) {
      const ioGeo = new THREE.BoxGeometry(0.045, 0.18, 0.08);
      const ioMesh = new THREE.Mesh(ioGeo, this.matPLCDIO);
      ioMesh.position.x = -0.05 + m * 0.055;
      plcGroup.add(ioMesh);
    }

    this.group.add(plcGroup);

    cpuMesh.userData = {
      name: 'Siemens SIMATIC S7-1500 Motion PLC',
      category: 'CONTROL_SYSTEM',
      description: 'Synchronous motion controller orchestrating multi-axis feed, positioning, cutting, and inspection cycles.'
    };
    this.interactiveObjects.push(cpuMesh);
  }

  buildServoDrives() {
    // Multi-Axis Servo Amplifiers on middle DIN rail (Y = 0.02)
    const driveGroup = new THREE.Group();
    driveGroup.position.set(0.0, 0.02, 0.16);

    const driveNames = ['Feed Roller Axis', 'Radial Cut Axis', 'Rotary Ring Axis', 'Longitudinal Slitter'];
    for (let d = 0; d < 4; d++) {
      const dGeo = new THREE.BoxGeometry(0.065, 0.16, 0.09);
      const drive = new THREE.Mesh(dGeo, this.matServoDrive);
      drive.position.x = -0.22 + d * 0.08;
      driveGroup.add(drive);

      // Status LED on drive
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      led.position.set(-0.22 + d * 0.08, 0.06, 0.046);
      driveGroup.add(led);

      drive.userData = {
        name: `Servo Drive Amplifier (${driveNames[d]})`,
        category: 'CONTROL_SYSTEM',
        description: 'SINAMICS S120 precision multi-axis servo inverter with DRIVE-CLiQ feedback.'
      };
      this.interactiveObjects.push(drive);
    }

    this.group.add(driveGroup);
  }

  buildPowerSupplyAndSafetyRelay() {
    // Lower DIN Rail (Y = -0.24)
    const lowerGroup = new THREE.Group();
    lowerGroup.position.set(-0.2, -0.24, 0.16);

    // 24V DC 20A Switched Mode Power Supply
    const psuGeo = new THREE.BoxGeometry(0.12, 0.14, 0.09);
    const psu = new THREE.Mesh(psuGeo, this.matCabinet);
    psu.position.x = -0.15;
    lowerGroup.add(psu);

    // SIL-3 Safety Relay (Yellow housing)
    const relayGeo = new THREE.BoxGeometry(0.05, 0.12, 0.08);
    const relay = new THREE.Mesh(relayGeo, this.matSafetyRelay);
    relay.position.x = 0.02;
    lowerGroup.add(relay);

    // Circuit breakers (MCBs) row
    for (let c = 0; c < 5; c++) {
      const mcbGeo = new THREE.BoxGeometry(0.018, 0.08, 0.06);
      const mcb = new THREE.Mesh(mcbGeo, this.matBackplate);
      mcb.position.x = 0.12 + c * 0.022;
      lowerGroup.add(mcb);
    }

    this.group.add(lowerGroup);

    relay.userData = {
      name: 'Cat 4 / SIL 3 Master Safety Relay',
      category: 'SAFETY',
      description: 'Monitors emergency stop, enclosure door interlocks, and torque-off (STO) circuits.'
    };
    this.interactiveObjects.push(relay);
  }

  buildHMIConsole() {
    // Pivoting Articulated Arm with 15.6" HMI Touchscreen Console mounted on right upright
    this.hmiArmGroup = new THREE.Group();
    this.hmiArmGroup.position.set(0.9, 0.15, 0.35);

    // Swivel mount bracket
    const mountGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 16);
    const mount = new THREE.Mesh(mountGeo, this.matCabinet);
    this.hmiArmGroup.add(mount);

    // Tubular swing arm
    const armGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.38, 16);
    armGeo.rotateZ(Math.PI / 4);
    const arm = new THREE.Mesh(armGeo, this.matDINRail);
    arm.position.set(0.14, 0.12, 0.10);
    this.hmiArmGroup.add(arm);

    // HMI Console Enclosure (Tilted toward operator)
    const consoleGeo = new THREE.BoxGeometry(0.36, 0.24, 0.04);
    const consoleMesh = new THREE.Mesh(consoleGeo, this.matCabinet);
    consoleMesh.position.set(0.28, 0.24, 0.22);
    consoleMesh.rotation.y = -0.35;
    consoleMesh.rotation.x = -0.15;
    consoleMesh.castShadow = true;
    this.hmiArmGroup.add(consoleMesh);

    // Live operative touchscreen rendered directly on the physical 3D HMI.
    const screenGeo = new THREE.PlaneGeometry(0.32, 0.20);
    const hmiCanvas = document.createElement('canvas');
    hmiCanvas.width = 640;
    hmiCanvas.height = 400;
    const hmiTexture = new THREE.CanvasTexture(hmiCanvas);
    hmiTexture.colorSpace = THREE.SRGBColorSpace;
    hmiTexture.minFilter = THREE.LinearFilter;
    hmiTexture.magFilter = THREE.LinearFilter;
    const hmiScreenMaterial = new THREE.MeshBasicMaterial({ map:hmiTexture, toneMapped:false });
    const screen = new THREE.Mesh(screenGeo, hmiScreenMaterial);
    screen.position.set(0.28, 0.24, 0.242);
    screen.rotation.y = -0.35;
    screen.rotation.x = -0.15;
    screen.userData.hmiCanvas = hmiCanvas;
    screen.userData.hmiTexture = hmiTexture;
    screen.userData.hmiWidth = 640;
    screen.userData.hmiHeight = 400;
    screen.userData.hmiTouchSurface = true;
    this.hmiScreen = screen;
    this.hmiCanvas = hmiCanvas;
    this.hmiTexture = hmiTexture;
    this.hmiArmGroup.add(screen);

    const hmiData = {
      name: 'Industrial HMI Touchscreen Operator Console',
      category: 'HMI',
      action: 'OPEN_HMI',
      description: 'Operative capacitive touch HMI. Touch the controls directly on the physical 3D display to command the digital twin.'
    };
    consoleMesh.userData = hmiData;
    screen.userData = hmiData;
    this.interactiveObjects.push(consoleMesh, screen);

    this.group.add(this.hmiArmGroup);
  }

  update(delta) {
    // Visual idle updates
  }
}
