/**
 * RecipeManager.js
 * Comprehensive Recipe and Standard Parameters Engine.
 * Supports:
 * - Standards: IS 10810 (Part 2, Part 7, Part 33) & IS 7098 (Part 1, Part 2)
 * - Cable Types: Multi-Core Power (Ref 1), Shielded Control/Instrumentation (Ref 2), Custom
 * - Three Operating Modes: AUTO, MANUAL, AUTO_OVERRIDE
 */
export class RecipeManager {
  constructor() {
    this.mode = 'AUTO'; // 'AUTO', 'MANUAL', 'AUTO_OVERRIDE'
    this.selectedStandard = 'IS_10810'; // 'IS_10810', 'IS_7098_P1', 'IS_7098_P2'
    this.selectedPart = 'PART_7'; // 'PART_2', 'PART_7', 'PART_33'
    this.selectedCableType = 'POWER'; // 'POWER', 'SHIELDED', 'CUSTOM'
    this.selectedConductor = 'COPPER'; // 'COPPER', 'ALUMINIUM'
    this.selectedInsulation = 'XLPE'; // 'XLPE', 'PVC'
    this.coreCount = 4;

    // Active working parameters
    this.params = {
      cableDiameterMm: 24.0,
      feedSpeedMmPerSec: 90.0,
      feedDistanceMm: 320.0,
      targetPositionMm: 240.0,
      straightenerGapMm: 2.8,
      clampPositionMm: 24.0,
      cutDepthMm: 1.8,
      slitLengthMm: 120.0,
      peelDistanceMm: 110.0,
      punchStrokeMm: 28.0,
      cuttingSpeedRpm: 550,
      specimenType: 'DUMBBELL', // 'DUMBBELL', 'CONDUCTOR', 'WAFER'
      specimenLengthMm: 75.0,
      specimenWidthMm: 4.0,
      specimenThicknessMm: 1.8,
      numberOfSpecimens: 5,
      routingPath: 'AUTO',
      inspectionToleranceMm: 0.10
    };

    // Load initial standard recipe
    this.loadAutoRecipe();
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'AUTO') {
      this.loadAutoRecipe();
    }
  }

  setStandard(standard, part = null) {
    this.selectedStandard = standard;
    if (part) this.selectedPart = part;

    // If IS 7098 selected, route to applicable test requirements
    if (standard === 'IS_7098_P1' || standard === 'IS_7098_P2') {
      // IS 7098 references IS 10810 test methods for cross-linked polyethylene cables
      if (!this.selectedPart) this.selectedPart = 'PART_7';
    }

    if (this.mode === 'AUTO' || this.mode === 'AUTO_OVERRIDE') {
      this.loadAutoRecipe();
    }
  }

  setCableType(cableType) {
    this.selectedCableType = cableType;
    if (cableType === 'POWER') {
      this.params.cableDiameterMm = 24.0;
      this.coreCount = 4;
    } else if (cableType === 'SHIELDED') {
      this.params.cableDiameterMm = 18.0;
      this.coreCount = 3;
    }

    if (this.mode === 'AUTO') {
      this.loadAutoRecipe();
    }
  }

  /**
   * Loads simulated standardized parameters.
   * Note: These are simulated engineering recipes based on IS standard test procedures.
   */
  loadAutoRecipe() {
    const isPower = this.selectedCableType === 'POWER';
    const dia = isPower ? 24.0 : 18.0;

    if (this.selectedPart === 'PART_2') {
      // IS 10810 Part 2: Conductor Resistance, Tensile & Wrapping Test
      this.params = {
        cableDiameterMm: dia,
        feedSpeedMmPerSec: 100.0,
        feedDistanceMm: 380.0,
        targetPositionMm: 280.0,
        straightenerGapMm: isPower ? 3.0 : 2.2,
        clampPositionMm: dia,
        cutDepthMm: isPower ? 1.8 : 1.4, // Outer sheath depth
        slitLengthMm: 160.0,
        peelDistanceMm: 150.0,
        punchStrokeMm: 0.0,
        cuttingSpeedRpm: 600,
        specimenType: 'CONDUCTOR',
        specimenLengthMm: 200.0,
        specimenWidthMm: isPower ? 2.5 : 1.8, // Conductor diameter
        specimenThicknessMm: isPower ? 2.5 : 1.8,
        numberOfSpecimens: 3,
        routingPath: 'CONDUCTOR_TRAY',
        inspectionToleranceMm: 0.08
      };
    } else if (this.selectedPart === 'PART_33') {
      // IS 10810 Part 33: Measurement of Insulation and Sheath Thickness
      this.params = {
        cableDiameterMm: dia,
        feedSpeedMmPerSec: 60.0,
        feedDistanceMm: 210.0,
        targetPositionMm: 160.0,
        straightenerGapMm: isPower ? 2.8 : 2.0,
        clampPositionMm: dia,
        cutDepthMm: dia * 0.5, // Complete radial wafer slice
        slitLengthMm: 0.0,
        peelDistanceMm: 0.0,
        punchStrokeMm: 0.0,
        cuttingSpeedRpm: 800,
        specimenType: 'WAFER',
        specimenLengthMm: 1.0, // 1mm thick cross section wafer
        specimenWidthMm: dia,
        specimenThicknessMm: isPower ? 1.8 : 1.2,
        numberOfSpecimens: 5,
        routingPath: 'VISION_STAGE',
        inspectionToleranceMm: 0.04
      };
    } else {
      // IS 10810 Part 7 (Default): Dumbbell Tensile Strength & Elongation
      // Applicable to IS 7098 Part 1 & Part 2 cables
      const sheathThick = isPower ? 1.8 : 1.4;
      this.params = {
        cableDiameterMm: dia,
        feedSpeedMmPerSec: 80.0,
        feedDistanceMm: 320.0,
        targetPositionMm: 220.0,
        straightenerGapMm: isPower ? 2.6 : 1.9,
        clampPositionMm: dia,
        cutDepthMm: sheathThick,
        slitLengthMm: 120.0,
        peelDistanceMm: 110.0,
        punchStrokeMm: 28.0,
        cuttingSpeedRpm: 520,
        specimenType: 'DUMBBELL',
        specimenLengthMm: 75.0, // Standard ISO/IS dogbone length
        specimenWidthMm: 4.0, // Narrow gauge width
        specimenThicknessMm: sheathThick,
        numberOfSpecimens: 5,
        routingPath: 'DUMBBELL_TRAY',
        inspectionToleranceMm: 0.12
      };
    }
  }

  updateParam(key, value) {
    if (this.mode === 'AUTO') {
      // In Auto mode, user must switch to MANUAL or AUTO_OVERRIDE to edit
      console.warn('Cannot edit parameters directly in AUTO mode. Enable AUTO_OVERRIDE or switch to MANUAL.');
      return false;
    }
    this.params[key] = value;
    return true;
  }

  getStandardDescription() {
    if (this.selectedStandard === 'IS_7098_P1') {
      return 'IS 7098 (Part 1): XLPE insulated PVC sheathed cables for working voltages up to 1100 V (References IS 10810 methods).';
    }
    if (this.selectedStandard === 'IS_7098_P2') {
      return 'IS 7098 (Part 2): XLPE insulated PVC sheathed cables for voltages 3.3 kV to 33 kV (References IS 10810 methods).';
    }
    if (this.selectedPart === 'PART_2') {
      return 'IS 10810 Part 2: Conductor resistance, tensile and elongation test on copper & aluminium wires.';
    }
    if (this.selectedPart === 'PART_33') {
      return 'IS 10810 Part 33: Measurement of thickness of polymer insulation and outer sheath.';
    }
    return 'IS 10810 Part 7: Tensile strength and elongation at break of thermoplastic/elastomeric insulation & sheath (Dumbbell Test).';
  }
}
