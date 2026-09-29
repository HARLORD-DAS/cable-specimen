import * as THREE from 'three';
import { TextureGenerator } from '../utils/TextureGenerator.js';

/**
 * FeedStraightenerSystem.js
 * Implements:
 * 1. Dual Motorized Rubber Feed Rollers with Servo Motor, Flexible Coupling & Drive Shaft.
 * 2. Precision Shaft-Mounted Optical Rotary Encoder with live pulse tracking.
 * 3. 7-Roller Alternating Straightening Unit with manual/auto micrometer gap lead screw.
 *
 * Mechanical Relationship:
 * SERVO MOTOR -> COUPLING -> DRIVE SHAFT -> FEED ROLLER -> FRICTION -> CABLE MOVEMENT -> ENCODER COUNTER.
 */
export class FeedStraightenerSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FeedAndStraightenerSystem';
    this.group.position.set(-1.45, 0.50, 0.0); // Mounted along cable axis

    // State telemetry
    this.rollerAngle = 0.0;
    this.accumulatedDistanceMm = 0.0;
    this.encoderPulses = 0;
    this.straightenerGapMm = 2.4; // mm gap offset
    this.isFeeding = false;
    this.feedSpeedMmPerSec = 80.0;
    this.interactiveObjects = [];

    this.initMaterials();
    this.buildFeedDriveStation();
    this.buildShaftEncoder();
    this.buildStraighteningUnit();
  }

  initMaterials() {
    // 1. Vulcanized Nitrile Rubber Feed Rollers with High-Grip Knurl Texture
    this.knurlTexture = TextureGenerator.createRubberKnurlTexture();
    this.matFeedRoller = new THREE.MeshStandardMaterial({
      map: this.knurlTexture,
      roughness: 0.82,
      metalness: 0.05,
      name: 'NitrileRubberRoller'
    });

    // 2. Industrial AC Servo Motor (Industrial Charcoal Blue with Aluminium Fins)
    this.matServoHousing = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.65,
      name: 'ServoMotorHousing'
    });

    // 3. Flexible Metallic Bellows Coupling
    this.matCoupling = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.85,
      name: 'BellowsCoupling'
    });

    // 4. Ground Steel Precision Drive Shafts & Bearing Blocks
    this.matDriveShaft = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.18,
      metalness: 0.92,
      name: 'DriveShaftSteel'
    });
    this.matBearingBlock = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.45,
      metalness: 0.55
    });

    // 5. Hardened Tool Steel Straightening Rollers (Mirror Ground finish)
    this.matStraightenerRoller = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.12,
      metalness: 0.95,
      name: 'MirrorGroundStraightenerSteel'
    });

    // 6. Micrometer Dial for Straightener Gap Adjustment
    this.matDialBrass = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.82
    });

    // 7. Optical Rotary Encoder Housing & Disc
    this.encoderDiscTex = TextureGenerator.createEncoderDiscTexture();
    this.matEncoderDisc = new THREE.MeshStandardMaterial({
      map: this.encoderDiscTex,
      roughness: 0.3,
      metalness: 0.6
    });
  }

  buildFeedDriveStation() {
    const feedGroup = new THREE.Group();
    feedGroup.position.set(-0.35, 0.0, 0.0);

    // Bearing Stanchion / Pillow Blocks
    const stanchionGeo = new THREE.BoxGeometry(0.12, 0.26, 0.18);
    const stanchion = new THREE.Mesh(stanchionGeo, this.matBearingBlock);
    stanchion.position.set(0.0, 0.0, -0.16);
    feedGroup.add(stanchion);

    // UPPER FEED ROLLER (Adjustable pinch downforce)
    const rollerGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.055, 32);
    rollerGeo.rotateX(Math.PI / 2);

    this.topRoller = new THREE.Mesh(rollerGeo, this.matFeedRoller);
    this.topRoller.position.set(0.0, 0.048, 0.0);
    this.topRoller.castShadow = true;
    feedGroup.add(this.topRoller);

    // LOWER FEED ROLLER (Motorized main drive)
    this.bottomRoller = new THREE.Mesh(rollerGeo, this.matFeedRoller);
    this.bottomRoller.position.set(0.0, -0.048, 0.0);
    this.bottomRoller.castShadow = true;
    feedGroup.add(this.bottomRoller);

    // MAIN DRIVE SHAFT (Runs from Lower Roller to rear through bearings and coupling)
    const shaftGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 24);
    shaftGeo.rotateX(Math.PI / 2);
    this.driveShaft = new THREE.Mesh(shaftGeo, this.matDriveShaft);
    this.driveShaft.position.set(0.0, -0.048, -0.15);
    this.driveShaft.castShadow = true;
    feedGroup.add(this.driveShaft);

    // FLEXIBLE BELLOWS COUPLING
    const couplingGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.05, 24);
    couplingGeo.rotateX(Math.PI / 2);
    this.coupling = new THREE.Mesh(couplingGeo, this.matCoupling);
    this.coupling.position.set(0.0, -0.048, -0.32);
    feedGroup.add(this.coupling);

    // HIGH-TORQUE AC SERVO MOTOR
    this.motorGroup = new THREE.Group();
    this.motorGroup.position.set(0.0, -0.048, -0.46);

    const motorBodyGeo = new THREE.BoxGeometry(0.09, 0.09, 0.18);
    const motorBody = new THREE.Mesh(motorBodyGeo, this.matServoHousing);
    motorBody.castShadow = true;
    this.motorGroup.add(motorBody);

    // Cooling fins on servo
    const finGeo = new THREE.BoxGeometry(0.096, 0.096, 0.006);
    for (let f = -0.06; f <= 0.06; f += 0.02) {
      const fin = new THREE.Mesh(finGeo, this.matDriveShaft);
      fin.position.z = f;
      this.motorGroup.add(fin);
    }

    // Servo connector plug and cable
    const plugGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 16);
    const plug = new THREE.Mesh(plugGeo, this.matBearingBlock);
    plug.position.set(0.0, 0.06, -0.04);
    this.motorGroup.add(plug);

    feedGroup.add(this.motorGroup);

    this.topRoller.userData = {
      name: 'Pneumatic Pinch Feed Roller (Upper)',
      category: 'FEED_SYSTEM',
      description: 'Adjustable pneumatic pressure roller with high-friction nitrile rubber knurl.'
    };
    this.bottomRoller.userData = {
      name: 'Synchronous Drive Feed Roller (Lower)',
      category: 'FEED_SYSTEM',
      description: 'Direct servo-driven traction roller coupled to optical incremental encoder.'
    };
    this.interactiveObjects.push(this.topRoller, this.bottomRoller);

    this.group.add(feedGroup);
  }

  buildShaftEncoder() {
    // High-Resolution Optical Shaft Encoder mounted directly on rear extension of drive shaft
    this.encoderGroup = new THREE.Group();
    this.encoderGroup.position.set(-0.35, -0.048, -0.62);

    // Anodized encoder housing (Flanged barrel)
    const encHousingGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 24);
    encHousingGeo.rotateX(Math.PI / 2);
    const encHousing = new THREE.Mesh(encHousingGeo, this.matServoHousing);
    this.encoderGroup.add(encHousing);

    // Transparent window revealing spinning optical graduation disc
    const discGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.002, 32);
    discGeo.rotateX(Math.PI / 2);
    this.encoderDisc = new THREE.Mesh(discGeo, this.matEncoderDisc);
    this.encoderDisc.position.z = -0.031;
    this.encoderGroup.add(this.encoderDisc);

    // Pulse sensing optical read head
    const headGeo = new THREE.BoxGeometry(0.015, 0.02, 0.015);
    const headMesh = new THREE.Mesh(headGeo, this.matCoupling);
    headMesh.position.set(0.022, 0.0, -0.031);
    this.encoderGroup.add(headMesh);

    // Encoder LED pulse indicator (green blinks or stays bright during motion)
    const ledGeo = new THREE.SphereGeometry(0.004, 12, 12);
    this.matEncoderLed = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    this.encoderLed = new THREE.Mesh(ledGeo, this.matEncoderLed);
    this.encoderLed.position.set(0.028, 0.012, -0.031);
    this.encoderGroup.add(this.encoderLed);

    encHousing.userData = {
      name: 'High-Resolution Optical Shaft Encoder',
      category: 'FEED_SYSTEM',
      description: '1024 PPR optical quadrature encoder measuring real-time cable feed distance and velocity.'
    };
    this.interactiveObjects.push(encHousing);

    this.group.add(this.encoderGroup);
  }

  buildStraighteningUnit() {
    // 7-Roller Alternating Straightening Unit:
    // 4 Bottom fixed ground rollers (Y = -0.025)
    // 3 Top adjustable rollers (Y = +0.025 + gapOffset)
    const straightenerGroup = new THREE.Group();
    straightenerGroup.position.set(0.20, 0.0, 0.0);

    // Heavy rigid mounting stanchion frame
    const frameGeo = new THREE.BoxGeometry(0.48, 0.22, 0.16);
    const frame = new THREE.Mesh(frameGeo, this.matBearingBlock);
    frame.position.set(0.0, 0.0, -0.12);
    straightenerGroup.add(frame);

    const rollerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.045, 24);
    rollerGeo.rotateX(Math.PI / 2);

    this.straightenerRollers = [];
    this.topStraightenerBank = new THREE.Group();

    // 4 Bottom Rollers (at X = -0.18, -0.06, +0.06, +0.18)
    const xOffsetsBottom = [-0.18, -0.06, 0.06, 0.18];
    xOffsetsBottom.forEach((x, idx) => {
      const roller = new THREE.Mesh(rollerGeo, this.matStraightenerRoller);
      roller.position.set(x, -0.032, 0.0);
      roller.castShadow = true;
      straightenerGroup.add(roller);
      this.straightenerRollers.push({ mesh: roller, isTop: false });

      roller.userData = {
        name: `Bottom Straightening Roller #${idx + 1}`,
        category: 'STRAIGHTENER',
        description: 'Fixed precision-ground hardened tool steel straightening roller.'
      };
      this.interactiveObjects.push(roller);
    });

    // 3 Top Adjustable Rollers (at X = -0.12, 0.0, +0.12)
    const xOffsetsTop = [-0.12, 0.0, 0.12];
    xOffsetsTop.forEach((x, idx) => {
      const roller = new THREE.Mesh(rollerGeo, this.matStraightenerRoller);
      roller.position.set(x, 0.032, 0.0);
      roller.castShadow = true;
      this.topStraightenerBank.add(roller);
      this.straightenerRollers.push({ mesh: roller, isTop: true });

      roller.userData = {
        name: `Top Straightening Roller #${idx + 1}`,
        category: 'STRAIGHTENER',
        description: 'Adjustable precision straightening roller for curvature leveling.'
      };
      this.interactiveObjects.push(roller);
    });

    straightenerGroup.add(this.topStraightenerBank);

    // Micrometer gap adjustment knob on top of unit
    const knobGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.035, 24);
    const knob = new THREE.Mesh(knobGeo, this.matDialBrass);
    knob.position.set(0.0, 0.14, -0.08);
    knob.castShadow = true;
    straightenerGroup.add(knob);

    this.group.add(straightenerGroup);
  }

  setStraightenerGap(gapMm) {
    this.straightenerGapMm = gapMm;
    // gapMm = 1.0 to 10.0mm -> maps to Y offset
    const yOffset = (gapMm - 2.5) * 0.001;
    this.topStraightenerBank.position.y = yOffset;
  }

  update(delta, isFeeding = false, feedSpeedMmPerSec = 80.0) {
    this.isFeeding = isFeeding;
    this.feedSpeedMmPerSec = feedSpeedMmPerSec;

    if (isFeeding) {
      // 1 revolution of 38mm radius roller = 2 * PI * 38mm = ~238.76 mm
      const circumferenceMm = 2 * Math.PI * 38.0;
      const rotationSpeed = (feedSpeedMmPerSec / circumferenceMm) * Math.PI * 2; // rad/sec
      const dAngle = rotationSpeed * delta;

      this.rollerAngle += dAngle;

      // Rotate upper and lower feed rollers in opposing directions
      this.bottomRoller.rotation.z -= dAngle;
      this.topRoller.rotation.z += dAngle;

      // Rotate drive shaft, coupling, and encoder
      this.driveShaft.rotation.z -= dAngle;
      this.coupling.rotation.z -= dAngle;
      this.encoderDisc.rotation.z -= dAngle;

      // Rotate all 7 straightening rollers
      this.straightenerRollers.forEach(r => {
        if (r.isTop) {
          r.mesh.rotation.z += dAngle * 0.9;
        } else {
          r.mesh.rotation.z -= dAngle * 0.9;
        }
      });

      // Pulse generation: 1024 pulses per rev
      this.accumulatedDistanceMm += feedSpeedMmPerSec * delta;
      this.encoderPulses = Math.floor((this.accumulatedDistanceMm / circumferenceMm) * 1024);

      // Blink encoder LED during feed
      if (this.matEncoderLed) {
        this.matEncoderLed.color.setHex((this.encoderPulses % 4 < 2) ? 0x22c55e : 0x15803d);
      }
    } else {
      if (this.matEncoderLed) {
        this.matEncoderLed.color.setHex(0x22c55e);
      }
    }
  }

  resetDistance() {
    this.accumulatedDistanceMm = 0.0;
    this.encoderPulses = 0;
  }

  setExploded(progress) {
    // Logical disassembly: Motor -> Coupling -> Shaft -> Roller -> Encoder
    if (this.motorGroup) this.motorGroup.position.z = -0.46 - progress * 0.28;
    if (this.coupling) this.coupling.position.z = -0.32 - progress * 0.16;
    if (this.driveShaft) this.driveShaft.position.z = -0.15 - progress * 0.08;
    if (this.topRoller) this.topRoller.position.y = 0.048 + progress * 0.14;
    if (this.bottomRoller) this.bottomRoller.position.y = -0.048 - progress * 0.14;
    if (this.encoderGroup) this.encoderGroup.position.z = -0.62 - progress * 0.35;
    if (this.topStraightenerBank) this.topStraightenerBank.position.y = progress * 0.15;
  }
}

