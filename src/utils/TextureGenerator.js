import * as THREE from 'three';

/**
 * TextureGenerator.js
 * Generates ultra-crisp procedural industrial textures, decals, rating plates,
 * warning signs, encoder dials, and metallic micro-textures using HTML5 Canvas.
 */
export class TextureGenerator {

  // 1. Machine Main Certification & Rating Nameplate
  static createMachineNameplate() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Brushed stainless steel background
    const grad = ctx.createLinearGradient(0, 0, 1024, 384);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.5, '#cbd5e1');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 384);

    // Beveled border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 1012, 372);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, 996, 356);

    // Corner rivet screws
    const drawRivet = (x, y) => {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    };
    drawRivet(32, 32);
    drawRivet(992, 32);
    drawRivet(32, 352);
    drawRivet(992, 352);

    // Title text
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 36px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('UNIVERSAL AUTOMATED CABLE SPECIMEN SYSTEM', 60, 68);

    ctx.font = '600 22px "Inter", "Arial", sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.fillText('3D ENGINEERING DIGITAL TWIN &bull; ADVANCED ROBOTIC RIG', 60, 104);

    // Divider line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 124);
    ctx.lineTo(964, 124);
    ctx.stroke();

    // Data grid
    ctx.font = '600 19px "JetBrains Mono", monospace';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('STANDARDS  : IS 10810 (Pt 2, 7, 33) | IS 7098 (Pt 1, 2)', 60, 165);
    ctx.fillText('CAPACITY   : 4.0 mm - 45.0 mm O.D. | Multi-Core / Shielded', 60, 205);
    ctx.fillText('FEED DRIVE : Synchronous Servo Ball-Screw | 0.01 mm Res', 60, 245);
    ctx.fillText('CONTROLLER : Industrial Motion PLC + Vision Telecentric', 60, 285);
    ctx.fillText('SERIAL NO. : ACSP-2026-X4492-DIGITAL-TWIN', 60, 325);

    // QR Code / Cert badge simulation
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(830, 145, 120, 120);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(840, 155, 30, 30);
    ctx.fillRect(910, 155, 30, 30);
    ctx.fillRect(840, 225, 30, 30);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(850, 165, 10, 10);
    ctx.fillRect(920, 165, 10, 10);
    ctx.fillRect(850, 235, 10, 10);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  // 2. Warning Sign (Laser Radiation & Sharp Blades)
  static createSafetyDecal() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Yellow warning background
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 512, 256);

    // Black hazard border
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(8, 8, 496, 240);

    // Danger banner
    ctx.fillStyle = '#000000';
    ctx.fillRect(18, 18, 476, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WARNING / CAUTION', 256, 54);

    // Triangle icon
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(80, 190);
    ctx.lineTo(130, 95);
    ctx.lineTo(180, 190);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.fillRect(127, 125, 6, 36);
    ctx.beginPath();
    ctx.arc(130, 175, 4, 0, Math.PI * 2);
    ctx.fill();

    // Text description
    ctx.textAlign = 'left';
    ctx.font = '800 17px "Inter", "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('AUTOMATIC HIGH-SPEED BLADES', 205, 115);
    ctx.fillText('& LASER MEASUREMENT UNIT', 205, 140);

    ctx.font = '500 14px "Inter", "Arial", sans-serif';
    ctx.fillText('INTERLOCK GUARD MUST BE CLOSED', 205, 175);
    ctx.fillText('DURING AUTO PREPARATION CYCLE', 205, 198);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 3. Millimeter Scale Rule for Linear Rail Beds
  static createLinearScaleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Satin silver base
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 2048, 128);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';

    const mmSpacing = 2048 / 600; // 600mm scale
    for (let mm = 0; mm <= 600; mm++) {
      const x = mm * mmSpacing;
      let tickHeight = 15;
      if (mm % 10 === 0) {
        tickHeight = 50;
        ctx.fillText(`${mm}`, x, 100);
      } else if (mm % 5 === 0) {
        tickHeight = 32;
      }
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, 15 + tickHeight);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // 4. Rotary Encoder Dial Graduations
  static createEncoderDiscTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Outer optical tracks
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const cx = 256;
    const cy = 256;
    const radius = 220;

    for (let a = 0; a < 360; a += 3) {
      const rad = (a * Math.PI) / 180;
      const isMajor = a % 15 === 0;
      const rInner = isMajor ? radius - 40 : radius - 20;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * rInner, cy + Math.sin(rad) * rInner);
      ctx.lineTo(cx + Math.cos(rad) * radius, cy + Math.sin(rad) * radius);
      ctx.stroke();
    }

    // Center hub
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1024 PPR', cx, cy - 10);
    ctx.fillText('OPTICAL', cx, cy + 24);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 5. Rubber Roller Diamond Knurl Grip Texture
  static createRubberKnurlTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    // Diamond grid
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    for (let x = -256; x < 512; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + 256, 0);
      ctx.stroke();
    }

    // High grip dots
    ctx.fillStyle = '#334155';
    for (let x = 8; x < 256; x += 16) {
      for (let y = 8; y < 256; y += 16) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
  }

  // 6. Basket-Weave Wire Armor Texture (Metallic Bronze / Galvanized Braid)
  static createArmorBraidTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark under-compound
    ctx.fillStyle = '#1e1c18';
    ctx.fillRect(0, 0, 512, 512);

    // Bronze wire braid strands (criss-cross weave)
    const weaveSize = 32;
    for (let y = 0; y < 512; y += weaveSize) {
      for (let x = 0; x < 512; x += weaveSize) {
        const isOdd = ((x / weaveSize) + (y / weaveSize)) % 2 === 0;

        if (isOdd) {
          // Horizontal ribbon
          const grad = ctx.createLinearGradient(x, y, x, y + weaveSize);
          grad.addColorStop(0, '#785628');
          grad.addColorStop(0.3, '#d4af37');
          grad.addColorStop(0.7, '#fef08a');
          grad.addColorStop(1, '#5a401a');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, weaveSize, weaveSize);
        } else {
          // Vertical ribbon
          const grad = ctx.createLinearGradient(x, y, x + weaveSize, y);
          grad.addColorStop(0, '#5a401a');
          grad.addColorStop(0.3, '#c59b27');
          grad.addColorStop(0.7, '#fef08a');
          grad.addColorStop(1, '#785628');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, weaveSize, weaveSize);
        }

        // Stranded individual wire micro-lines
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.5;
        for (let w = 4; w < weaveSize; w += 6) {
          if (isOdd) {
            ctx.beginPath();
            ctx.moveTo(x, y + w);
            ctx.lineTo(x + weaveSize, y + w);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(x + w, y);
            ctx.lineTo(x + w, y + weaveSize);
            ctx.stroke();
          }
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 4);
    return texture;
  }

  // 7. Aluminium Foil Shield Texture (Metallic Cyan-Silver sheen with wrap overlaps)
  static createAluFoilTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Metallic teal / aluminium foil gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.3, '#38bdf8');
    grad.addColorStop(0.6, '#e0f2fe');
    grad.addColorStop(0.8, '#0369a1');
    grad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Helical wrap seams & crinkles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    for (let x = -512; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 512);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    for (let x = -512; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x + 4, 0);
      ctx.lineTo(x + 260, 512);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
  }

  // 8. Interstitial Cable Filler Texture (Chalky fibrous cream compound)
  static createFillerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 256);

    // Fibrous yarn flecks
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const len = 4 + Math.random() * 12;
      const angle = Math.random() * Math.PI;
      ctx.fillRect(x, y, len, 2);
    }

    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  // 9. Siemens S7-1500 Style PLC Module Faceplate
  static createPLCModuleTexture(type = 'CPU') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark slate gray module body
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(0, 0, 256, 1024);

    // Top status bezel (Siemens teal accent)
    ctx.fillStyle = '#00646e';
    ctx.fillRect(10, 10, 236, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SIEMENS', 128, 38);

    // Model name
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px "Inter", "Arial", sans-serif';
    ctx.fillText(type === 'CPU' ? 'SIMATIC S7-1500' : 'DI/DQ 32x24VDC', 128, 85);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(type === 'CPU' ? 'CPU 1515-2 PN' : '6ES7 522-1BL01', 128, 110);

    // Display screen for CPU
    if (type === 'CPU') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(25, 140, 206, 180);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(25, 140, 206, 180);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('STATUS: RUN', 40, 175);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('IP: 192.168.0.10', 40, 210);
      ctx.fillText('CYCLE: 2.1 ms', 40, 245);
      ctx.fillText('AXES: 6 SYNCED', 40, 280);
    }

    // LED status array
    const ledYStart = type === 'CPU' ? 360 : 150;
    const labels = type === 'CPU' ? ['RUN', 'STOP', 'ERROR', 'MAINT', 'LINK'] : ['DI0', 'DI1', 'DI2', 'DI3', 'DQ0', 'DQ1', 'DQ2', 'DQ3'];

    labels.forEach((lbl, idx) => {
      const y = ledYStart + idx * 45;
      // LED circle
      ctx.fillStyle = (lbl === 'RUN' || lbl.startsWith('D')) ? '#22c55e' : (lbl === 'STOP' ? '#ef4444' : '#64748b');
      ctx.beginPath();
      ctx.arc(45, y + 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(lbl, 65, y + 15);
    });

    // Terminal block rows at bottom
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 750, 216, 250);
    ctx.strokeStyle = '#475569';
    for (let r = 0; r < 8; r++) {
      const ty = 760 + r * 30;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(30, ty, 15, 18);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`TB-${r + 1}: 24VDC CH${r}`, 60, ty + 14);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 10. Aethonix Logo Decal (Reference 1 Left Front Panel)
  static createAethonixLogoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Clean industrial off-white background
    ctx.fillStyle = '#ededeb';
    ctx.fillRect(0, 0, 512, 256);

    // Chevron logo mark in Cyan / Blue
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(95, 75);
    ctx.lineTo(130, 160);
    ctx.lineTo(105, 160);
    ctx.lineTo(95, 120);
    ctx.lineTo(85, 160);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#19c3c8'; // Teal secondary facet
    ctx.beginPath();
    ctx.moveTo(95, 75);
    ctx.lineTo(130, 160);
    ctx.lineTo(112, 160);
    ctx.lineTo(95, 115);
    ctx.closePath();
    ctx.fill();

    // Text: AETHONIX SOLUTIONS
    ctx.fillStyle = '#1e293b';
    ctx.font = '900 36px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AETHONIX', 150, 120);

    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('SOLUTIONS', 152, 150);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 11. System Title Decal (Reference 1 Right Front Panel)
  static createAethonixTitleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Clean industrial off-white background
    ctx.fillStyle = '#ededeb';
    ctx.fillRect(0, 0, 1024, 256);

    // Title: AUTOMATED CABLE SPECIMEN PREPARATION SYSTEM
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AUTOMATED CABLE', 50, 80);
    ctx.fillText('SPECIMEN PREPARATION SYSTEM', 50, 125);

    // Subtitle tagline: PRECISE | AUTOMATED | STANDARD COMPLIANT
    ctx.fillStyle = '#0284c7';
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillText('PRECISE  |  AUTOMATED  |  STANDARD COMPLIANT', 50, 175);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

