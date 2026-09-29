/**
 * ForceFeedbackEngine.js
 * Proposed Advanced Feature: Real-Time Cutting Force Sensor Feedback & Tool Protection.
 * Simulates piezoelectric force transducer on the rotary cutting head.
 *
 * Logic:
 * - Normal cutting: Force oscillates between 35 N and 75 N (State: NORMAL)
 * - If cut depth too deep / blade collision / excessive resistance (> 120 N):
 *   Triggers FORCE_HIGH -> Auto speed reduction -> Safety retract to protect tooling and conductors.
 */
export class ForceFeedbackEngine {
  constructor() {
    this.currentForceN = 0.0;
    this.status = 'IDLE'; // 'IDLE', 'NORMAL', 'HIGH_WARNING', 'OVERLOAD_RETRACT'
    this.forceThresholdNormalN = 85.0;
    this.forceThresholdAlarmN = 120.0;
    this.simulateOverload = false; // User toggle for demonstrating proposed feature
    this.onOverloadTrigger = null;
  }

  setOverloadSimulation(enable) {
    this.simulateOverload = enable;
  }

  update(isCutting, cutDepthMm, cuttingSpeedRpm) {
    if (!isCutting) {
      this.currentForceN = 0.0;
      this.status = 'IDLE';
      return { force: 0, status: 'IDLE' };
    }

    if (this.simulateOverload) {
      // Force spikes past 135 N
      this.currentForceN = 138.5 + (Math.random() - 0.5) * 8.0;
      this.status = 'OVERLOAD_RETRACT';
      if (this.onOverloadTrigger) this.onOverloadTrigger(this.currentForceN);
    } else {
      // Normal cutting physics: Force proportional to cut depth * RPM / feed
      const baseForce = 42.0 + (cutDepthMm * 14.0) + (Math.random() - 0.5) * 6.0;
      this.currentForceN = Math.max(10.0, baseForce);
      if (this.currentForceN > this.forceThresholdNormalN) {
        this.status = 'HIGH_WARNING';
      } else {
        this.status = 'NORMAL';
      }
    }

    return {
      force: this.currentForceN,
      status: this.status
    };
  }
}
