import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Professional Engineering 3D Camera Controller
 * Supports smooth Orbit, Pan, and Manual Zoom.
 * 
 * STRICT ENGINEERING CRITICAL RULES:
 * - NO automatic zoom on selecting components
 * - NO automatic camera movement or jumps
 * - NO fly-to-component animation
 * - Camera stays firmly where it is when user clicks components
 * - Hard limits prevent clipping through machine walls or going beneath ground level
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.4; // Prevents entering inside components
    this.controls.maxDistance = 16.0; // Prevents extreme zoom out
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevents looking from beneath ground level
    this.controls.minPolarAngle = 0.05; // Prevents camera gimbal lock/flipping

    // Initial Three-Quarter Front Engineering View:
    // Left: Cable Reel (X = -2.7)
    // Center: Long Processing Machine (X: -2.2 to +2.2)
    // Right: HMI Cabinet & Signal Tower (X = +2.3)
    // Front/Lower: 4 Specimen Output Carts
    this.defaultCamPos = new THREE.Vector3(0.5, 2.3, 5.2);
    this.defaultLookAt = new THREE.Vector3(-0.35, 0.60, 0.15);

    this.targetCamPos = this.defaultCamPos.clone();
    this.targetLookAt = this.defaultLookAt.clone();
    this.isTransitioning = false;

    this.camera.position.copy(this.defaultCamPos);
    this.controls.target.copy(this.defaultLookAt);
    this.controls.update();
  }

  setViewPreset(presetName) {
    switch (presetName) {
      case 'overview':
        this.targetCamPos.set(0.5, 2.3, 5.2);
        this.targetLookAt.set(-0.35, 0.60, 0.15);
        break;

      case 'reel':
        // Cable Reel & Universal Inlet
        this.targetCamPos.set(-2.2, 1.6, 2.2);
        this.targetLookAt.set(-2.4, 0.55, 0.0);
        break;

      case 'feed':
        // Feed Rollers & 7-Roller Straightener
        this.targetCamPos.set(-1.2, 1.4, 1.9);
        this.targetLookAt.set(-1.3, 0.55, 0.0);
        break;

      case 'cutting':
        // Circumferential Cutter, Clamp & Slitter
        this.targetCamPos.set(-0.2, 1.3, 1.8);
        this.targetLookAt.set(-0.15, 0.55, 0.0);
        break;

      case 'punch':
        // Dumbbell Die Press & Conductor Station
        this.targetCamPos.set(0.9, 1.3, 1.8);
        this.targetLookAt.set(0.95, 0.55, 0.0);
        break;

      case 'trays':
        // Front Specimen Collection Carts (All 4 trays)
        this.targetCamPos.set(0.0, 1.2, 2.6);
        this.targetLookAt.set(0.0, 0.35, 0.7);
        break;

      case 'hmi':
        // Electrical Cabinet & HMI Console
        this.targetCamPos.set(2.4, 1.6, 1.8);
        this.targetLookAt.set(2.0, 0.8, 0.2);
        break;

      default:
        this.targetCamPos.copy(this.defaultCamPos);
        this.targetLookAt.copy(this.defaultLookAt);
    }
    this.isTransitioning = true;
  }

  resetView() {
    this.targetCamPos.copy(this.defaultCamPos);
    this.targetLookAt.copy(this.defaultLookAt);
    this.isTransitioning = true;
  }

  // Strictly disabled automatic zoom or jumping on component selection per master prompt
  focusOnComponent() {
    // Intentionally no-op: Camera remains firmly fixed when selecting components
  }

  update(delta) {
    if (this.isTransitioning) {
      this.camera.position.lerp(this.targetCamPos, delta * 6.0);
      this.controls.target.lerp(this.targetLookAt, delta * 6.0);

      if (
        this.camera.position.distanceTo(this.targetCamPos) < 0.01 &&
        this.controls.target.distanceTo(this.targetLookAt) < 0.01
      ) {
        this.camera.position.copy(this.targetCamPos);
        this.controls.target.copy(this.targetLookAt);
        this.isTransitioning = false;
      }
    }
    this.controls.update();
  }
}
