import * as THREE from 'three';
import { RecipeManager } from './RecipeManager.js';
import { ForceFeedbackEngine } from './ForceFeedbackEngine.js';

/**
 * SimulationEngine.js
 * Master Kinematic Orchestration and State Machine for the Cable Preparation System.
 * 
 * Operating Modes:
 * 1. AUTO: Complete automated sequence (Reel -> Feed -> Straighten -> Measure -> Clamp -> Cut -> Slit -> Peel -> Separate -> Route -> Prep -> Vision Inspect -> Sort -> Carts)
 * 2. MANUAL: Parameter-driven control. Every parameter directly influences kinematics and 3D geometry.
 * 3. AUTO OVERRIDE: Automatic sequence continues using user-modified parameters.
 * 4. ENGINEERING: Disassembly, cross-section, transparent view, and component inspection.
 */
export class SimulationEngine {
  constructor(audio) {
    this.audio = audio;
    this.recipeManager = new RecipeManager();
    this.forceEngine = new ForceFeedbackEngine();

    // Machine operating state
    this.state = 'IDLE';
    this.previousState = 'IDLE';
    this.isPaused = false;
    this.isEStopped = false;
    this.isSafetyDoorOpen = false;

    // Exploded View Animation State
    this.explodedProgress = 0.0; // 0.0 = Assembled, 1.0 = Fully Exploded
    this.targetExplodedProgress = 0.0;
    this.isExploding = false;

    // Cycle & Timer tracking
    this.cycleTimeSec = 0.0;
    this.stateTimer = 0.0;
    this.totalCyclesCompleted = 0;
    this.passCount = 0;
    this.rejectCount = 0;
    this.wasteCount = 0;
    this.wasteDispatched = false;

    // Physical kinematics parameters
    this.feedDisplacementM = 0.0;

    // Specimen Traceability Record Log
    this.specimenLog = [];

    // Real-time Metrology telemetry
    this.liveTelemetry = {
      state: 'IDLE',
      encoderDistanceMm: 0.0,
      encoderPulses: 0,
      feedSpeedMmPerSec: 0.0,
      laserDiameterMm: 24.0,
      laserOvalityMm: 0.03,
      laserCenterX: 0.0,
      laserCenterY: 0.0,
      cuttingForceN: 0.0,
      forceStatus: 'IDLE',
      reelRemainingMeters: 485.0,
      inspection: {
        specimenId: 'SPEC-000',
        standard: 'IS 10810 Pt 7',
        cableType: 'POWER',
        conductor: 'COPPER',
        type: 'DUMBBELL',
        targetLengthMm: 75.0,
        actualLengthMm: 75.02,
        targetWidthMm: 4.0,
        actualWidthMm: 4.01,
        targetThicknessMm: 1.8,
        actualThicknessMm: 1.82,
        toleranceMm: 0.10,
        result: 'PENDING'
      }
    };

    // Subsystem references (bound by DigitalTwinApp)
    this.subsystems = null;

    // Event hooks
    this.onStateChange = null;
    this.onTelemetryUpdate = null;
    this.onInspectionComplete = null;
  }

  bindSubsystems(subsystems) {
    this.subsystems = subsystems;
  }

  start() {
    if (this.isEStopped || this.isSafetyDoorOpen) return;
    if (this.state === 'IDLE' || this.state === 'COMPLETE') {
      this.transitionTo('CABLE_DETECTED');
      this.cycleTimeSec = 0.0;
      this.isPaused = false;
      if (this.subsystems && this.subsystems.frame) {
        this.subsystems.frame.setSignalState('RUNNING');
      }
    } else if (this.isPaused) {
      this.isPaused = false;
      if (this.subsystems && this.subsystems.frame) {
        this.subsystems.frame.setSignalState('RUNNING');
      }
    }
  }

  pause() {
    this.isPaused = !this.isPaused;
    if (this.subsystems && this.subsystems.frame) {
      this.subsystems.frame.setSignalState(this.isPaused ? 'PAUSED' : 'RUNNING');
    }
  }

  reset() {
    this.isPaused = false;
    this.isEStopped = false;
    this.feedDisplacementM = 0.0;
    this.stateTimer = 0.0;
    this.cycleTimeSec = 0.0;
    this.wasteDispatched = false;

    if (this.subsystems) {
      const {
        cable,
        inlet,
        feedStraightener,
        clamping,
        cutting,
        stripping,
        dumbbell,
        conductor,
        routing,
        frame
      } = this.subsystems;

      if (cable) {
        cable.setFeedDisplacement(0.0);
        cable.setStraightness(0.0);
        cable.setCutState('INTACT');
      }
      if (inlet) inlet.setCenteringProgress(0.0);
      if (feedStraightener) {
        feedStraightener.resetDistance();
        feedStraightener.setStraightenerGap(this.recipeManager.params.straightenerGapMm);
      }
      if (clamping) clamping.setClampProgress(0.0);
      if (cutting) {
        cutting.setCircumferentialCut(0, 0);
        cutting.setLongitudinalSlit(0, 0);
      }
      if (stripping) stripping.setPeelState(0, 0);
      if (dumbbell) dumbbell.resetStation();
      if (conductor) conductor.resetStation();
      if (routing) {
        routing.setShuttlePosition(0.85, 0.0);
        routing.detachSpecimen();
        routing.setDiverter('NEUTRAL');
      }
      if (frame) frame.setSignalState('IDLE');
    }

    this.transitionTo('IDLE');
  }

  triggerEStop() {
    this.isEStopped = !this.isEStopped;
    if (this.isEStopped) {
      this.transitionTo('FAULT');
      if (this.audio) this.audio.playSafetyAlarm();
      if (this.subsystems && this.subsystems.frame) {
        this.subsystems.frame.setSignalState('FAULT');
      }
    } else {
      this.reset();
    }
  }

  toggleSafetyDoor() {
    if (!this.subsystems || !this.subsystems.enclosure) return;
    this.isSafetyDoorOpen = this.subsystems.enclosure.toggleDoor();

    if (this.isSafetyDoorOpen) {
      if (this.state !== 'IDLE' && this.state !== 'COMPLETE') {
        this.transitionTo('SAFETY_STOP');
        if (this.audio) this.audio.playSafetyAlarm();
        if (this.subsystems && this.subsystems.frame) {
          this.subsystems.frame.setSignalState('SAFETY_STOP');
        }
      }
    } else {
      if (this.state === 'SAFETY_STOP') {
        this.transitionTo(this.previousState);
        if (this.subsystems && this.subsystems.frame) {
          this.subsystems.frame.setSignalState('RUNNING');
        }
      }
    }
  }

  transitionTo(newState) {
    this.previousState = this.state;
    this.state = newState;
    this.stateTimer = 0.0;
    this.liveTelemetry.state = newState;

    if (this.onStateChange) this.onStateChange(newState, this.previousState);
  }

  // -------------------------------------------------------------
  // EXPLODED VIEW & ASSEMBLY TRANSITIONS
  // -------------------------------------------------------------

  explode() {
    this.targetExplodedProgress = 1.0;
    this.isExploding = true;
  }

  assemble() {
    this.targetExplodedProgress = 0.0;
    this.isExploding = true;
  }

  updateExplodedView(delta) {
    if (!this.isExploding) return;

    const speed = 2.0; // Complete transition in ~0.5s
    if (this.explodedProgress < this.targetExplodedProgress) {
      this.explodedProgress = Math.min(this.targetExplodedProgress, this.explodedProgress + delta * speed);
    } else if (this.explodedProgress > this.targetExplodedProgress) {
      this.explodedProgress = Math.max(this.targetExplodedProgress, this.explodedProgress - delta * speed);
    }

    if (Math.abs(this.explodedProgress - this.targetExplodedProgress) < 0.001) {
      this.explodedProgress = this.targetExplodedProgress;
      this.isExploding = false;
    }

    const t = this.explodedProgress;
    const s = this.subsystems;
    if (!s) return;

    if (s.frame) s.frame.setExploded(t);
    if (s.reel) s.reel.setExploded(t);
    if (s.feedStraightener) s.feedStraightener.setExploded(t);
    if (s.clamping) s.clamping.setExploded(t);
    if (s.cutting) s.cutting.setExploded(t);
    if (s.dumbbell) s.dumbbell.setExploded(t);
    if (s.cable) s.cable.setExploded(t);
    if (s.outputTrays) s.outputTrays.setExploded(t);
  }

  // -------------------------------------------------------------
  // MASTER TICK LOOP
  // -------------------------------------------------------------

  update(delta) {
    this.updateExplodedView(delta);

    if (this.isPaused || this.isEStopped || this.state === 'SAFETY_STOP') return;

    if (this.state !== 'IDLE' && this.state !== 'COMPLETE') {
      this.cycleTimeSec += delta;
    }
    this.stateTimer += delta;

    const s = this.subsystems;
    if (!s) return;
    if (s.outputTrays && typeof s.outputTrays.update === 'function') s.outputTrays.update(delta);

    const p = this.recipeManager.params;

    // -------------------------------------------------------------
    // AUTOMATED / PARAMETER-DRIVEN KINEMATIC SEQUENCE
    // -------------------------------------------------------------
    switch (this.state) {
      case 'IDLE':
        break;

      case 'CABLE_DETECTED':
        if (this.stateTimer > 0.5) {
          this.transitionTo('CENTERING');
        }
        break;

      case 'CENTERING':
        // Universal Inlet guide rollers center the cable
        const centerProgress = Math.min(1.0, this.stateTimer / 0.8);
        s.inlet.setCenteringProgress(centerProgress);
        if (centerProgress >= 1.0) {
          if (this.audio) this.audio.playPneumaticClamp();
          this.transitionTo('FEEDING');
        }
        break;

      case 'FEEDING': {
        // Feed first: reel -> payout guide -> inlet -> feed rollers.
        const feedDuration = p.feedDistanceMm / p.feedSpeedMmPerSec;
        const feedProgress = Math.min(1.0, this.stateTimer / Math.max(0.4, feedDuration));
        const currentMm = p.feedDistanceMm * feedProgress;
        const deltaMm = p.feedSpeedMmPerSec * delta;

        this.feedDisplacementM = currentMm * 0.001;
        s.cable.setFeedDisplacement(this.feedDisplacementM);
        s.cable.setStraightness(0.0);

        if (s.reel) {
          s.reel.rotate(deltaMm * 0.001);
          this.liveTelemetry.reelRemainingMeters = s.reel.remainingCableMeters;
        }
        s.feedStraightener.update(delta, true, p.feedSpeedMmPerSec);
        s.inlet.update(delta, true);

        this.liveTelemetry.encoderDistanceMm = currentMm;
        this.liveTelemetry.encoderPulses = s.feedStraightener.encoderPulses;
        this.liveTelemetry.feedSpeedMmPerSec = p.feedSpeedMmPerSec;

        if (feedProgress >= 1.0) {
          s.feedStraightener.update(0, false);
          this.transitionTo('STRAIGHTENING');
        }
        break;
      }

      case 'STRAIGHTENING': {
        // Feed stops; the straightener completes its mechanical settling before measurement.
        const straightProgress = Math.min(1.0, this.stateTimer / 0.8);
        s.feedStraightener.update(delta, true, Math.max(1, p.feedSpeedMmPerSec * (1 - straightProgress)));
        s.cable.setStraightness(straightProgress);
        if (straightProgress >= 1.0) {
          s.feedStraightener.update(0, false);
          this.transitionTo('MEASUREMENT');
        }
        break;
      }

      case 'MEASUREMENT':
        // Optical laser micrometer measures outer profile
        s.laser.setMeasuredCableDiameter(p.cableDiameterMm);
        this.liveTelemetry.laserDiameterMm = p.cableDiameterMm + (Math.random() - 0.5) * 0.02;
        this.liveTelemetry.laserOvalityMm = s.laser.measuredOvalityMm;

        if (this.stateTimer > 0.7) {
          this.transitionTo('POSITIONING');
        }
        break;

      case 'POSITIONING':
        // Servo positioning carriage brings cable to exact target cutting datum
        if (this.stateTimer > 0.4) {
          this.transitionTo('CLAMPING');
        }
        break;

      case 'CLAMPING':
        // Adaptive V-jaws clamp the cable securely
        const clampProgress = Math.min(1.0, this.stateTimer / 0.6);
        s.clamping.setClampProgress(clampProgress);

        if (clampProgress >= 1.0) {
          if (this.audio) this.audio.playPneumaticClamp();
          this.transitionTo('CIRCUMFERENTIAL_CUT');
        }
        break;

      case 'CIRCUMFERENTIAL_CUT':
        // Rotary blade penetrates outer jacket and orbits 360 degrees
        const cutDuration = 2.0;
        const cutProgress = Math.min(1.0, this.stateTimer / cutDuration);

        const orbitAngle = cutProgress * Math.PI * 2;
        const penetration = Math.sin(cutProgress * Math.PI);

        s.cutting.setCircumferentialCut(orbitAngle, penetration, s.cable.cableRadiusM);

        if (cutProgress > 0.25 && s.cable.cutState === 'INTACT') {
          s.cable.setCutState('SCORED');
          if (this.audio) this.audio.playBladeScore(1.5);
        }

        const forceData = this.forceEngine.update(true, p.cutDepthMm, p.cuttingSpeedRpm);
        this.liveTelemetry.cuttingForceN = forceData.force;
        this.liveTelemetry.forceStatus = forceData.status;

        if (cutProgress >= 1.0) {
          this.forceEngine.update(false, 0, 0);
          this.transitionTo('LONGITUDINAL_SLIT');
        }
        break;

      case 'LONGITUDINAL_SLIT':
        // Linear slitter carriage travels along cable axis
        const slitDuration = 1.5;
        const slitProgress = Math.min(1.0, this.stateTimer / slitDuration);

        s.cutting.setLongitudinalSlit(slitProgress, Math.sin(slitProgress * Math.PI), s.cable.cableRadiusM);

        if (slitProgress > 0.2 && s.cable.cutState === 'SCORED') {
          s.cable.setCutState('SLIT');
        }

        if (slitProgress >= 1.0) {
          this.transitionTo('PEELING');
        }
        break;

      case 'PEELING':
        // Peeling fingers grip and peel back outer jacket flap
        const peelDuration = 1.6;
        const peelProgress = Math.min(1.0, this.stateTimer / peelDuration);

        const grip = Math.min(1.0, peelProgress * 2.5);
        const pull = Math.max(0.0, (peelProgress - 0.3) * 1.45);

        s.stripping.setPeelState(grip, pull, s.cable.cableRadiusM);
        s.cable.setCutState('PEELED', pull);

        if (peelProgress >= 1.0) {
          this.transitionTo('SEPARATING');
        }
        break;

      case 'SEPARATING':
        // Layer separation wedge divides cores; jacket waste drops
        s.cable.setCutState('SEPARATED');
        // Dispatch peeled-jacket waste once; the cart receives it only after transport.
        if (this.wasteDispatched) {
          if (this.stateTimer > 0.6) this.transitionTo('ROUTING');
          break;
        }
        this.wasteDispatched = true;
        // Physically collect the peeled jacket/waste in the reject-scrap cart.
        // The waste is added only after separation has completed.
        if (s.outputTrays && typeof s.outputTrays.addWaste === 'function') {
          s.outputTrays.transportWaste('PEELED_JACKET', { x: -0.10, y: 0.42, z: -0.76 }, 1.1);
        }
        this.wasteCount++;

        // Release clamp
        s.clamping.setClampProgress(0.0);

        if (this.stateTimer > 0.6) {
          this.transitionTo('ROUTING');
        }
        break;

      case 'ROUTING':
        // Servo shuttle transfers blank material to preparation station
        const routeDuration = 1.2;
        const routeProgress = Math.min(1.0, this.stateTimer / routeDuration);

        const startX = 0.55;
        const targetX = p.specimenType === 'CONDUCTOR' ? 0.75 : 0.85;
        const shuttleX = THREE.MathUtils.lerp(startX, targetX, routeProgress);
        s.routing.setShuttlePosition(shuttleX, Math.sin(routeProgress * Math.PI));

        if (routeProgress >= 1.0) {
          if (p.specimenType === 'CONDUCTOR') {
            s.conductor.setConductorMaterial(this.recipeManager.selectedConductor);
          } else if (p.specimenType === 'SHEET') {
            // Sheet/wafer preparation uses the sheet specimen path rather than the dumbbell press.
            s.dumbbell.loadBlankMaterial(0xe8e4dc);
          } else {
            const specColor = this.recipeManager.selectedCableType === 'POWER' ? 0x0284c7 : 0x27272a;
            s.dumbbell.loadBlankMaterial(specColor);
          }
          this.transitionTo('SPECIMEN_PREPARATION');
        }
        break;

      case 'SPECIMEN_PREPARATION':
        // Punch press stamps tensile dumbbell or Conductor shear cuts rod
        const prepDuration = 1.6;
        const prepProgress = Math.min(1.0, this.stateTimer / prepDuration);

        if (p.specimenType === 'CONDUCTOR') {
          s.conductor.setShearStroke(Math.sin(prepProgress * Math.PI));
        } else if (p.specimenType === 'SHEET') {
          // Sheet path: keep the polymer blank on the preparation bed and use the transfer shuttle.
          s.dumbbell.setPunchStroke(0.0);
        } else {
          s.dumbbell.setPunchStroke(Math.sin(prepProgress * Math.PI));
          if (prepProgress > 0.5 && !s.dumbbell.isDumbbellCut) {
            if (this.audio) this.audio.playPunchStamp();
            s.dumbbell.ejectScrapFlash();
            // Punching creates a real scrap slug which is collected in the reject cart.
            if (s.outputTrays && typeof s.outputTrays.addWaste === 'function') {
              s.outputTrays.transportWaste('PUNCH_SCRAP', { x: 0.85, y: 0.18, z: -0.58 }, 0.9);
            }
            this.wasteCount++;
          }
        }

        if (prepProgress >= 1.0) {
          s.routing.attachSpecimen(p.specimenType);
          this.transitionTo('INSPECTION');
        }
        break;

      case 'INSPECTION':
        // Specimen moves under telecentric vision camera
        const inspMoveDuration = 1.0;
        const inspMoveProgress = Math.min(1.0, this.stateTimer / inspMoveDuration);

        const vStartX = p.specimenType === 'CONDUCTOR' ? 0.75 : 0.85;
        const vX = THREE.MathUtils.lerp(vStartX, 1.45, inspMoveProgress);
        s.routing.setShuttlePosition(vX, 0.0);

        if (inspMoveProgress >= 1.0 && !s.vision.isInspecting && this.liveTelemetry.inspection.result === 'PENDING') {
          if (this.audio) this.audio.playCameraShutter();
          s.vision.triggerInspectionFlash(() => {
            this.evaluateInspectionResults();
          });
        }
        break;

      case 'PASS':
      case 'REJECT':
        // Sorting shuttle and diverter gate deposit specimen into output trays
        const sortDuration = 1.2;
        const sortProgress = Math.min(1.0, this.stateTimer / sortDuration);

        const sortX = THREE.MathUtils.lerp(1.45, 1.82, sortProgress);
        s.routing.setShuttlePosition(sortX, Math.sin(sortProgress * Math.PI));

        if (sortProgress >= 1.0) {
          s.routing.detachSpecimen();
          s.routing.setDiverter(this.state);
          if (this.audio) this.audio.playDiverterSort();

          const isPass = (this.state === 'PASS');
          if (isPass) this.passCount++;
          else this.rejectCount++;

          // PASS material is accepted by its physical collection cart. A failed specimen
          // is routed through the reject path instead of appearing instantly in the bin.
          if (s.outputTrays) {
            if (isPass) {
              s.outputTrays.addSpecimen(p.specimenType, this.recipeManager.selectedConductor, true);
            } else {
              s.outputTrays.transportRejectedSpecimen({ x: 1.82, y: 0.16, z: 0.08 }, 0.8);
            }
          }

          this.totalCyclesCompleted++;
          this.transitionTo('COMPLETE');
        }
        break;

      case 'COMPLETE':
        break;

      case 'FAULT':
      case 'SAFETY_STOP':
        break;
    }

    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate(this.liveTelemetry);
    }
  }

  evaluateInspectionResults() {
    const p = this.recipeManager.params;
    const tol = p.inspectionToleranceMm;

    // Measured dimensions with natural gaussian distribution
    const actualLen = p.specimenLengthMm + (Math.random() - 0.48) * (tol * 0.95);
    const actualWidth = p.specimenWidthMm + (Math.random() - 0.48) * (tol * 0.90);
    const actualThick = p.specimenThicknessMm + (Math.random() - 0.48) * (tol * 0.85);

    const isPass = Math.abs(actualLen - p.specimenLengthMm) <= tol &&
                   Math.abs(actualWidth - p.specimenWidthMm) <= tol;

    const result = isPass ? 'PASS' : 'REJECT';

    const sampleRecord = {
      specimenId: `SPEC-${(this.totalCyclesCompleted + 1).toString().padStart(3, '0')}`,
      standard: this.recipeManager.selectedStandard.replace('_', ' '),
      cableType: this.recipeManager.selectedCableType,
      conductor: this.recipeManager.selectedConductor,
      cableDiameterMm: p.cableDiameterMm,
      type: p.specimenType,
      targetLengthMm: p.specimenLengthMm,
      actualLengthMm: parseFloat(actualLen.toFixed(3)),
      targetWidthMm: p.specimenWidthMm,
      actualWidthMm: parseFloat(actualWidth.toFixed(3)),
      targetThicknessMm: p.specimenThicknessMm,
      actualThicknessMm: parseFloat(actualThick.toFixed(3)),
      toleranceMm: tol,
      cycleTimeSec: parseFloat(this.cycleTimeSec.toFixed(1)),
      result: result
    };

    this.liveTelemetry.inspection = sampleRecord;
    this.specimenLog.unshift(sampleRecord); // Prepend to history

    if (this.onInspectionComplete) {
      this.onInspectionComplete(sampleRecord);
    }

    this.transitionTo(result);
  }
}
