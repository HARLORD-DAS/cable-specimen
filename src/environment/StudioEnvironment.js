import * as THREE from 'three';

/**
 * StudioEnvironment.js
 * Dark Industrial Engineering Workspace (#111315).
 * Implements high-fidelity industrial multi-point lighting, ground grid,
 * soft PCF contact shadows, and specular rim highlights so the graphite & steel
 * machine and metallic/polymeric specimens pop crisply with strong contrast.
 */
export class StudioEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'DarkIndustrialEnvironment';
    this.scene.add(this.group);

    this.initBackground();
    this.initLighting();
    this.initFloorAndGrid();
  }

  initBackground() {
    // Premium Dark Industrial Engineering Background (#111315)
    const darkBg = new THREE.Color(0x111315);
    this.scene.background = darkBg;
    // Gentle distance fog matching the dark workspace
    this.scene.fog = new THREE.Fog(0x111315, 18, 48);
  }

  initLighting() {
    // 1. Natural Ambient Fill (Keeps shaded cavities and lower framework clearly visible)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.group.add(ambientLight);

    // 2. Main Key Directional Light (Top-Front-Right with PCF Soft Shadows)
    const keyLight = new THREE.DirectionalLight(0xfffdfa, 2.2);
    keyLight.position.set(7.5, 11.0, 8.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30.0;
    keyLight.shadow.camera.left = -7.0;
    keyLight.shadow.camera.right = 7.0;
    keyLight.shadow.camera.top = 5.0;
    keyLight.shadow.camera.bottom = -4.0;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.radius = 2.0; // Soft shadow edges
    this.group.add(keyLight);

    // 3. Top-Down Processing Bay Overhead Light (Illuminates cutters, guides, punch die)
    const topLight = new THREE.DirectionalLight(0xf0f6fc, 1.4);
    topLight.position.set(0.0, 12.0, 0.2);
    this.group.add(topLight);

    // 4. Left-Front Fill Light (Cable Reel, inlet guide, and straightener illumination)
    const leftFill = new THREE.DirectionalLight(0xe2e8f0, 1.1);
    leftFill.position.set(-8.0, 6.0, 6.0);
    this.group.add(leftFill);

    // 5. Specular Rim / Silhouette Light (Back-Right, creates crisp edge separation on dark graphite frame)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2); // Subtle cyan technical rim
    rimLight.position.set(6.0, 5.0, -7.0);
    this.group.add(rimLight);

    // 6. Left Rim Light (Back-Left, defines reel contours)
    const rimLightLeft = new THREE.DirectionalLight(0xf2a900, 0.7); // Subtle amber rim
    rimLightLeft.position.set(-7.0, 4.5, -6.0);
    this.group.add(rimLightLeft);
  }

  initFloorAndGrid() {
    // 1. Dark Industrial Engineering Epoxy Floor
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x151719,
      roughness: 0.85,
      metalness: 0.15,
      name: 'IndustrialEpoxyFloor'
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.005;
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. Subtle Precision Engineering Coordinate Grid
    const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    grid.position.y = 0.001;
    this.group.add(grid);

    // 3. Contact Shadow Plane directly beneath machine base and cable reel
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 4.5), contactShadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(-0.3, 0.002, 0.0);
    this.group.add(contactShadow);
  }
}
