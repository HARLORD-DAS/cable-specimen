import * as THREE from 'three';
import { StudioEnvironment } from './environment/StudioEnvironment.js';
import { CameraController } from './utils/CameraController.js';
import { AudioSynthesizer } from './utils/AudioSynthesizer.js';

// Machine Subsystems
import { CableReelSystem } from './models/CableReelSystem.js';
import { OutputTraysSystem } from './models/OutputTraysSystem.js';
import { MachineFrame } from './models/MachineFrame.js';
import { EnclosureSystem } from './models/EnclosureSystem.js';
import { InletSystem } from './models/InletSystem.js';
import { FeedStraightenerSystem } from './models/FeedStraightenerSystem.js';
import { LaserMeasurementSystem } from './models/LaserMeasurementSystem.js';
import { ClampingSystem } from './models/ClampingSystem.js';
import { CuttingSystem } from './models/CuttingSystem.js';
import { StrippingSystem } from './models/StrippingSystem.js';
import { DumbbellStation } from './models/DumbbellStation.js';
import { ConductorStation } from './models/ConductorStation.js';
import { VisionInspectionSystem } from './models/VisionInspectionSystem.js';
import { RoutingSystem } from './models/RoutingSystem.js';
import { PLCCabinet } from './models/PLCCabinet.js';
import { Cable3DModel } from './models/Cable3DModel.js';

// Simulation Engine & UI
import { SimulationEngine } from './simulation/SimulationEngine.js';
import { CrossSectionModal } from './ui/CrossSectionModal.js';
import { HMIOverlay } from './ui/HMIOverlay.js';
import { OperativeHMIController } from './ui/OperativeHMIController.js';

/**
 * Universal Automated Cable Specimen Preparation System
 * 3D Interactive Engineering Digital Twin.
 */
class DigitalTwinApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.selectedMesh = null;
    this.prevEmissive = new THREE.Color(0, 0, 0);

    this.initRenderer();
    this.initSceneAndCamera();
    this.initAudioAndSimulation();
    this.initMachineModels();
    this.initUI();
    this.initInteractions();
    this.initKeyboardShortcuts();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  initSceneAndCamera() {
    this.scene = new THREE.Scene();

    // 40 degree FOV matching CAD perspective view
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    this.camCtrl = new CameraController(this.camera, this.renderer.domElement);
  }

  initAudioAndSimulation() {
    this.audio = new AudioSynthesizer();
    this.sim = new SimulationEngine(this.audio);
  }

  initMachineModels() {
    // 1. Dark Industrial Engineering Workspace (#111315)
    this.environment = new StudioEnvironment(this.scene);

    // 2. Heavy Industrial Base Framework (#2B2E31 Graphite, #555A5E Extrusions, Aethonix Branding)
    this.frame = new MachineFrame();
    this.scene.add(this.frame.group);

    // 3. Cable Supply Reel (Mounted on Left: X = -2.7m)
    this.reel = new CableReelSystem();
    this.scene.add(this.reel.group);

    // 4. Front Specimen Output Collection Carts (4 Trays matching Reference Image 1)
    this.outputTrays = new OutputTraysSystem();
    this.scene.add(this.outputTrays.group);

    // 5. Transparent Polycarbonate Safety Enclosure & Interlocks
    this.enclosure = new EnclosureSystem();
    this.scene.add(this.enclosure.group);

    // 6. Universal Cable Inlet & 4-Roller Self-Centering Guide
    this.inlet = new InletSystem();
    this.scene.add(this.inlet.group);

    // 7. Motorized Feed System & 7-Roller Straightener
    this.feedStraightener = new FeedStraightenerSystem();
    this.scene.add(this.feedStraightener.group);

    // 8. Dual-Axis Optical Laser Micrometer Profile Frame (4 Sensors)
    this.laser = new LaserMeasurementSystem();
    this.scene.add(this.laser.group);

    // 9. Adaptive Precision V-Jaw Clamping Carriage
    this.clamping = new ClampingSystem();
    this.scene.add(this.clamping.group);

    // 10. Precision Cutting System (Rotary Circumferential Ring & Longitudinal Slitter)
    this.cutting = new CuttingSystem();
    this.scene.add(this.cutting.group);

    // 11. Articulated Stripping & Peeling Fingers + Core Separation Wedge
    this.stripping = new StrippingSystem();
    this.scene.add(this.stripping.group);

    // 12. Polymer Dumbbell Specimen Punch-and-Die Press (IS 10810 Pt 7)
    this.dumbbell = new DumbbellStation();
    this.scene.add(this.dumbbell.group);

    // 13. Conductor Wire Straightener & Shear Station (IS 10810 Pt 2)
    this.conductor = new ConductorStation();
    this.scene.add(this.conductor.group);

    // 14. Telecentric Optical Vision Inspection Camera & Ring Illuminator
    this.vision = new VisionInspectionSystem();
    this.scene.add(this.vision.group);

    // 15. 2-Axis Servo Transfer Shuttle & Sorting Diverter Gate
    this.routing = new RoutingSystem();
    this.scene.add(this.routing.group);

    // 16. Siemens S7-1500 PLC Cabinet & Pivoting HMI Console
    this.plcCabinet = new PLCCabinet();
    this.scene.add(this.plcCabinet.group);

    // 17. Realistic Multi-Layer 3D Physical Cable Model
    this.cable = new Cable3DModel({
      cableType: 'POWER',
      conductorMaterial: 'COPPER',
      outerDiameter: 24.0
    });
    this.cable.group.position.set(-0.85, 0.50, 0.0);
    this.scene.add(this.cable.group);

    // Bind all physical subsystems to simulation engine
    this.subsystems = {
      frame: this.frame,
      reel: this.reel,
      outputTrays: this.outputTrays,
      enclosure: this.enclosure,
      inlet: this.inlet,
      feedStraightener: this.feedStraightener,
      laser: this.laser,
      clamping: this.clamping,
      cutting: this.cutting,
      stripping: this.stripping,
      dumbbell: this.dumbbell,
      conductor: this.conductor,
      vision: this.vision,
      routing: this.routing,
      plcCabinet: this.plcCabinet,
      cable: this.cable
    };

    this.sim.bindSubsystems(this.subsystems);

    // Selection highlight indicator ring
    const ringGeo = new THREE.RingGeometry(0.04, 0.055, 32);
    ringGeo.rotateX(-Math.PI / 2);
    this.highlightRing = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: 0xf2a900, side: THREE.DoubleSide })
    );
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);

    // Aggregate all interactive objects for direct raycast inspection
    this.interactiveObjects = [
      ...this.reel.interactiveObjects,
      ...this.outputTrays.interactiveObjects,
      ...this.frame.interactiveObjects,
      ...this.enclosure.interactiveObjects,
      ...this.inlet.interactiveObjects,
      ...this.feedStraightener.interactiveObjects,
      ...this.laser.interactiveObjects,
      ...this.clamping.interactiveObjects,
      ...this.cutting.interactiveObjects,
      ...this.stripping.interactiveObjects,
      ...this.dumbbell.interactiveObjects,
      ...this.conductor.interactiveObjects,
      ...this.vision.interactiveObjects,
      ...this.routing.interactiveObjects,
      ...this.plcCabinet.interactiveObjects
    ];
  }

  initUI() {
    this.csModal = new CrossSectionModal(this.sim);
    this.hmi = new HMIOverlay(this.sim, this.camCtrl, this.csModal, this.audio);
    // The physical 3D HMI is an operative entry point; auxiliary UI stays collapsed until requested.
    this.operativeHMI = new OperativeHMIController(this);
  }

  initInteractions() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Object click raycasting: Direct component interaction
    // Strict requirement: THE CAMERA MUST STAY WHERE IT IS!
    this.renderer.domElement.addEventListener('click', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      // Restore previously highlighted mesh
      if (this.selectedMesh && this.selectedMesh.material && this.selectedMesh.material.emissive) {
        this.selectedMesh.material.emissive.copy(this.prevEmissive);
        this.selectedMesh = null;
      }
      this.highlightRing.visible = false;

      if (intersects.length > 0) {
        let hit = null;
        for (let i = 0; i < intersects.length; i++) {
          if (intersects[i].object.userData && intersects[i].object.userData.name) {
            hit = intersects[i].object;
            break;
          }
        }

        if (hit) {
          // Highlight with subtle amber glow
          if (hit.material && hit.material.emissive) {
            this.selectedMesh = hit;
            this.prevEmissive.copy(hit.material.emissive);
            hit.material.emissive.setHex(0xf2a900);
            hit.material.emissiveIntensity = 0.35;
          }

          // Position highlight ring on ground below object
          const worldPos = new THREE.Vector3();
          hit.getWorldPosition(worldPos);
          this.highlightRing.position.set(worldPos.x, 0.005, worldPos.z);
          this.highlightRing.visible = true;

          // CAMERA REMAINS FIRMLY FIXED
          // Open contextual panel
          this.hmi.showComponentContext(hit.userData);
        } else {
          this.hmi.showComponentContext(null);
        }
      } else {
        this.hmi.showComponentContext(null);
      }
    });
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Space: Start / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.sim.state === 'IDLE' || this.sim.state === 'COMPLETE') {
          this.sim.start();
        } else {
          this.sim.pause();
        }
      }
      // 'E': Toggle Exploded View
      if (e.key === 'e' || e.key === 'E') {
        if (this.sim.explodedProgress > 0.5) this.sim.assemble();
        else this.sim.explode();
      }
      // 'T': Toggle Transparent Enclosure
      if (e.key === 't' || e.key === 'T') {
        const isEng = !this.enclosure.isEngineeringView;
        this.enclosure.setEngineeringView(isEng);
      }
      // 'C': Open Cross Section Modal
      if (e.key === 'c' || e.key === 'C') {
        this.csModal.open(this.sim.recipeManager.selectedCableType);
      }
      // 'R': Reset Camera View
      if (e.key === 'r' || e.key === 'R') {
        this.camCtrl.resetView();
      }
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(0.1, this.clock.getDelta());

    // Update Camera
    this.camCtrl.update(delta);

    // Update Subsystems
    this.enclosure.update(delta);
    this.laser.update(delta);

    // Update Master Kinematic Simulation Engine
    this.sim.update(delta);

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate Master Application
function bootApplication() {
  try {
    new DigitalTwinApp();
  } catch (err) {
    console.error('Fatal initialization error:', err);
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:20px;left:20px;background:#7f1d1d;color:#fecaca;padding:16px;border-radius:8px;z-index:99999;font-family:monospace;max-width:80%;border:1px solid #ef4444;';
    errDiv.innerHTML = `<strong>Failed to initialize 3D Digital Twin:</strong><br><pre>${err.stack || err.message}</pre>`;
    document.body.appendChild(errDiv);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootApplication);
} else {
  bootApplication();
}
