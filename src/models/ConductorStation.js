import * as THREE from 'three';

/**
 * ConductorStation.js
 * Dedicated Conductor Wire Specimen Preparation Station (IS 10810 Part 2).
 * Prepared for conductor resistance, tensile strength, and wrapping tests.
 *
 * Sequence:
 * CONDUCTOR ISOLATED -> MICRO-STRAIGHTENING ROLLERS -> OPTICAL LENGTH MEASURE ->
 * HIGH-SPEED SHEAR CUT -> WIRE SPECIMEN EXTRACTED TO CONDUCTOR TRAY.
 */
export class ConductorStation {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ConductorPreparationStation';
    this.group.position.set(0.75, 0.50, -0.18); // Stationed along conductor prep bay

    this.shearProgress = 0.0; // 0.0 = open, 1.0 = shearing cut
    this.conductorType = 'COPPER'; // 'COPPER', 'ALUMINIUM'
    this.isCut = false;
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildConductorStraightener();
    this.buildShearCutter();
    this.buildConductorSpecimen();
  }

  initMaterials() {
    // 1. Station Mounting Bracket (#334155)
    this.matBracket = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.7
    });

    // 2. Micro-Straightener Steel Rollers
    this.matMicroRoller = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.92
    });

    // 3. Rotary Shear Blade Disc (High-hardness Tungsten Carbide)
    this.matShearBlade = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.98,
      name: 'TungstenShearBlade'
    });

    // 4. Conductor Specimens: Copper vs Aluminium
    this.matCopperWire = new THREE.MeshStandardMaterial({
      color: 0xc86432,
      roughness: 0.28,
      metalness: 0.85,
      name: 'SpecimenCopperWire'
    });

    this.matAluWire = new THREE.MeshStandardMaterial({
      color: 0xd4d8de,
      roughness: 0.3,
      metalness: 0.85,
      name: 'SpecimenAluWire'
    });
  }

  buildConductorStraightener() {
    // Micro 5-roller straightener for wire conductor alignment
    this.straightenerGroup = new THREE.Group();
    this.straightenerGroup.position.set(-0.10, 0.0, 0.0);

    const rollerGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 16);
    rollerGeo.rotateX(Math.PI / 2);

    // 3 bottom rollers
    [-0.04, 0.0, 0.04].forEach(x => {
      const r = new THREE.Mesh(rollerGeo, this.matMicroRoller);
      r.position.set(x, -0.014, 0.0);
      this.straightenerGroup.add(r);
    });

    // 2 top rollers
    [-0.02, 0.02].forEach(x => {
      const r = new THREE.Mesh(rollerGeo, this.matMicroRoller);
      r.position.set(x, 0.014, 0.0);
      this.straightenerGroup.add(r);
    });

    this.group.add(this.straightenerGroup);
  }

  buildShearCutter() {
    // High-speed guillotine / rotary wire shear
    this.shearGroup = new THREE.Group();
    this.shearGroup.position.set(0.06, 0.0, 0.0);

    const housingGeo = new THREE.BoxGeometry(0.04, 0.09, 0.05);
    const housing = new THREE.Mesh(housingGeo, this.matBracket);
    this.shearGroup.add(housing);

    // Moving upper shear blade
    const bladeGeo = new THREE.BoxGeometry(0.012, 0.035, 0.003);
    this.upperShearBlade = new THREE.Mesh(bladeGeo, this.matShearBlade);
    this.upperShearBlade.position.set(0.0, 0.03, 0.0);
    this.shearGroup.add(this.upperShearBlade);

    // Fixed lower shear anvil
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.012), this.matMicroRoller);
    anvil.position.set(0.0, -0.015, 0.0);
    this.shearGroup.add(anvil);

    this.upperShearBlade.userData = {
      name: 'Conductor Precision Wire Shear (IS 10810 Pt 2)',
      category: 'CONDUCTOR_STATION',
      description: 'Zero-deformation rotary shear cutting calibrated test wires to exact gauge length.'
    };
    this.interactiveObjects.push(this.upperShearBlade);

    this.group.add(this.shearGroup);
  }

  buildConductorSpecimen() {
    // Conductor test specimen wire (180mm length, 2.5mm dia)
    const wireGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.18, 16);
    wireGeo.rotateZ(Math.PI / 2);

    this.specimenWire = new THREE.Mesh(wireGeo, this.matCopperWire);
    this.specimenWire.position.set(0.16, 0.0, 0.0);
    this.specimenWire.visible = false;
    this.specimenWire.castShadow = true;
    this.group.add(this.specimenWire);

    this.specimenWire.userData = {
      name: 'Prepared Conductor Specimen (IS 10810 Pt 2)',
      category: 'SPECIMEN',
      description: 'Clean cut straightened wire conductor ready for tensile, wrapping, and resistance testing.'
    };
    this.interactiveObjects.push(this.specimenWire);
  }

  setConductorMaterial(type = 'COPPER') {
    this.conductorType = type;
    this.specimenWire.material = type === 'COPPER' ? this.matCopperWire : this.matAluWire;
  }

  setShearStroke(strokeProgress) {
    this.shearProgress = THREE.MathUtils.clamp(strokeProgress, 0.0, 1.0);
    const openY = 0.032;
    const cutY = -0.008;
    this.upperShearBlade.position.y = THREE.MathUtils.lerp(openY, cutY, this.shearProgress);

    if (this.shearProgress >= 0.95 && !this.isCut) {
      this.isCut = true;
      this.specimenWire.visible = true;
    }
  }

  resetStation() {
    this.setShearStroke(0.0);
    this.isCut = false;
    this.specimenWire.visible = false;
  }
}
