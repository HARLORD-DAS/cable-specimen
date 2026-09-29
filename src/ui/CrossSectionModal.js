/**
 * CrossSectionModal.js
 * Interactive Cable Cross-Section & Stepped Cutaway Modal.
 * Directly visualizes Reference Image 1 (Multi-Core Power Cable) and
 * Reference Image 2 (Shielded Instrumentation Cable) with detailed layer callouts,
 * material specifications, and standard compliance data.
 */
export class CrossSectionModal {
  constructor(simEngine) {
    this.simEngine = simEngine;
    this.isOpen = false;
    this.currentViewType = 'POWER'; // 'POWER', 'SHIELDED'
    this.createDOM();
  }

  createDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'cross-section-modal';
    this.overlay.className = 'cs-modal-overlay hidden';

    this.overlay.innerHTML = `
      <div class="cs-modal-container">
        <div class="cs-modal-header">
          <div class="cs-header-left">
            <span class="cs-badge">ENGINEERING CUTAWAY</span>
            <h2 class="cs-title" id="cs-modal-title">CABLE CROSS-SECTION & LAYER SPECIFICATION</h2>
          </div>
          <div class="cs-header-controls">
            <div class="cs-cable-toggle">
              <button class="cs-tab-btn active" id="btn-cs-power">Multi-Core Power (Ref 1)</button>
              <button class="cs-tab-btn" id="btn-cs-shielded">Shielded Control (Ref 2)</button>
            </div>
            <button class="cs-close-btn" id="btn-cs-close">&times;</button>
          </div>
        </div>

        <div class="cs-modal-body">
          <div class="cs-diagram-container">
            <canvas id="cs-canvas" width="600" height="480"></canvas>
            <div class="cs-diagram-hint">Hover over layers to inspect physical properties</div>
          </div>

          <div class="cs-specs-container">
            <div class="cs-section-header">INTERNAL LAYER ARCHITECTURE</div>
            <div class="cs-layers-list" id="cs-layers-list">
              <!-- Dynamically populated -->
            </div>

            <div class="cs-specimen-info">
              <div class="cs-info-title">APPLICABLE PREPARATION PROCEDURES</div>
              <div class="cs-info-grid" id="cs-applicable-tests">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>
        </div>

        <div class="cs-modal-footer">
          <span class="cs-footer-note">&bull; Reference standard: IS 10810 / IS 7098 Part 1 & 2 / IEEE 1580 &bull; Simulated CAD layer thickness</span>
          <button class="cs-btn-apply" id="btn-cs-apply">Load Cable into Digital Twin</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Bind DOM events
    document.getElementById('btn-cs-close').addEventListener('click', () => this.close());
    document.getElementById('btn-cs-power').addEventListener('click', () => this.switchView('POWER'));
    document.getElementById('btn-cs-shielded').addEventListener('click', () => this.switchView('SHIELDED'));
    document.getElementById('btn-cs-apply').addEventListener('click', () => {
      this.simEngine.recipeManager.setCableType(this.currentViewType);
      if (this.simEngine.subsystems && this.simEngine.subsystems.cable) {
        this.simEngine.subsystems.cable.updateConfiguration({
          cableType: this.currentViewType,
          outerDiameter: this.currentViewType === 'POWER' ? 24.0 : 18.0
        });
      }
      this.close();
    });

    this.canvas = document.getElementById('cs-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  open(cableType = null) {
    if (cableType) this.currentViewType = cableType;
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    this.updateView();
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.add('hidden');
  }

  switchView(type) {
    this.currentViewType = type;
    document.getElementById('btn-cs-power').classList.toggle('active', type === 'POWER');
    document.getElementById('btn-cs-shielded').classList.toggle('active', type === 'SHIELDED');
    this.updateView();
  }

  updateView() {
    if (this.currentViewType === 'POWER') {
      document.getElementById('cs-modal-title').textContent = 'MULTI-CORE POWER CABLE CROSS-SECTION (REF 1)';
      this.renderPowerCableDiagram();
      this.renderPowerSpecs();
    } else {
      document.getElementById('cs-modal-title').textContent = 'SHIELDED INSTRUMENTATION CABLE STRIP VIEW (REF 2)';
      this.renderShieldedCableDiagram();
      this.renderShieldedSpecs();
    }
  }

  // -------------------------------------------------------------
  // REFERENCE 1: MULTI-CORE POWER CABLE CANVAS DIAGRAM
  // -------------------------------------------------------------
  renderPowerCableDiagram() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.45;
    const cy = h * 0.5;
    const outerR = 190;
    const sheathThick = 24;
    const innerR = outerR - sheathThick;

    // 1. Black Outer Sheath (PE/PVC)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Interstitial Filler (Chalky Cream)
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Subtle fibrous flecks
    ctx.fillStyle = '#e5e7eb';
    for (let i = 0; i < 200; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * innerR;
      ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 2);
    }

    // 3. Four Shaped / Circular Cores per Ref 1
    // Neutral at Top (Blue), Phase Red (Right), Phase Yellow (Bottom), Phase Green/Teal (Left)
    const cores = [
      { name: 'Neutral', color: '#0284c7', angle: -Math.PI / 2, rOffset: 85, coreR: 54, condR: 35, shape: 'circle' },
      { name: 'Phase Red', color: '#dc2626', angle: 0, rOffset: 85, coreR: 62, condR: 44, shape: 'sector' },
      { name: 'Phase Yellow', color: '#eab308', angle: Math.PI / 2, rOffset: 85, coreR: 62, condR: 44, shape: 'sector' },
      { name: 'Phase Green', color: '#059669', angle: Math.PI, rOffset: 85, coreR: 62, condR: 44, shape: 'sector' }
    ];

    cores.forEach(c => {
      const coreCx = cx + Math.cos(c.angle) * c.rOffset;
      const coreCy = cy + Math.sin(c.angle) * c.rOffset;

      // Insulation Jacket
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(coreCx, coreCy, c.coreR, 0, Math.PI * 2);
      ctx.fill();

      // Stranded Copper Conductor (Cluster of circles)
      ctx.fillStyle = '#c86432';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;

      const numStrands = c.shape === 'circle' ? 7 : 19;
      const strandR = c.shape === 'circle' ? 11 : 7.5;

      if (c.shape === 'circle') {
        // Center strand
        ctx.beginPath();
        ctx.arc(coreCx, coreCy, strandR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 6 outer strands
        for (let s = 0; s < 6; s++) {
          const sa = (s * Math.PI) / 3;
          const sx = coreCx + Math.cos(sa) * (strandR * 1.95);
          const sy = coreCy + Math.sin(sa) * (strandR * 1.95);
          ctx.beginPath();
          ctx.arc(sx, sy, strandR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // Sector stranded layout
        for (let s = 0; s < 15; s++) {
          const sa = (s / 15) * Math.PI * 2;
          const sr = ((s % 3) + 1) * (c.condR * 0.28);
          const sx = coreCx + Math.cos(sa) * sr;
          const sy = coreCy + Math.sin(sa) * sr;
          ctx.beginPath();
          ctx.arc(sx, sy, strandR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    });

    // Dimension callout lines
    this.drawCallout(cx + 140, cy - 130, cx + 195, cy - 165, 'Sheath: PE/PVC (1.8mm)');
    this.drawCallout(cx - 30, cy - 70, cx - 120, cy - 110, 'Neutral XLPE (Blue)');
    this.drawCallout(cx, cy, cx - 140, cy, 'Fibrous Filler Compound');
    this.drawCallout(cx + 80, cy + 20, cx + 185, cy + 30, 'Stranded Copper Conductor');
    this.drawCallout(cx + 30, cy + 120, cx + 160, cy + 140, 'Phase Insulation: XLPE');
  }

  // -------------------------------------------------------------
  // REFERENCE 2: SHIELDED INSTRUMENTATION CABLE STRIP DIAGRAM
  // -------------------------------------------------------------
  renderShieldedCableDiagram() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const startX = 60;
    const cy = h * 0.5;

    // Stepped layered peel-back profile matching Ref 2
    // Layer 1: Outer Sheath (Black)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(startX, cy - 70, 110, 140);

    // Layer 2: Basket-Weave Wire Armor (Bronze braid)
    const armorGrad = ctx.createLinearGradient(0, cy - 60, 0, cy + 60);
    armorGrad.addColorStop(0, '#785628');
    armorGrad.addColorStop(0.5, '#d4af37');
    armorGrad.addColorStop(1, '#5a401a');
    ctx.fillStyle = armorGrad;
    ctx.fillRect(startX + 100, cy - 60, 90, 120);

    // Criss-cross weave lines
    ctx.strokeStyle = '#3e2a0f';
    ctx.lineWidth = 1;
    for (let x = startX + 100; x < startX + 190; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 60);
      ctx.lineTo(x + 15, cy + 60);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 15, cy - 60);
      ctx.lineTo(x, cy + 60);
      ctx.stroke();
    }

    // Layer 3: Inner Flame-Retardant Jacket (Black)
    ctx.fillStyle = '#27272a';
    ctx.fillRect(startX + 180, cy - 50, 75, 100);

    // Layer 4: Polyester-Backed Aluminium Foil Shield (Metallic Cyan-Silver)
    const foilGrad = ctx.createLinearGradient(0, cy - 40, 0, cy + 40);
    foilGrad.addColorStop(0, '#0284c7');
    foilGrad.addColorStop(0.4, '#38bdf8');
    foilGrad.addColorStop(0.7, '#e0f2fe');
    foilGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = foilGrad;
    ctx.fillRect(startX + 245, cy - 40, 90, 80);

    // Layer 5: Twisted Triad (Black, White, Red insulated cores)
    const triadColors = ['#18181b', '#f1f5f9', '#dc2626'];
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = triadColors[c];
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      const yOffset = (c - 1) * 22;
      ctx.fillRect(startX + 325, cy + yOffset - 10, 110, 20);
      ctx.strokeRect(startX + 325, cy + yOffset - 10, 110, 20);

      // Bare flexible stranded conductor protruding at right tip
      ctx.fillStyle = '#c86432';
      ctx.fillRect(startX + 430, cy + yOffset - 6, 45, 12);
    }

    // Drain wire (Silver tinned copper wire)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(startX + 325, cy + 28, 120, 4);

    // Callout labels
    this.drawCallout(startX + 55, cy - 70, startX + 55, cy - 120, 'Outer Sheath (PE/PVC)');
    this.drawCallout(startX + 145, cy - 60, startX + 145, cy - 100, 'Basket Weave Wire Armor');
    this.drawCallout(startX + 215, cy - 50, startX + 215, cy - 80, 'Inner Jacket');
    this.drawCallout(startX + 290, cy - 40, startX + 290, cy - 60, 'Al-Foil Tape Shield');
    this.drawCallout(startX + 380, cy - 30, startX + 380, cy - 40, 'Twisted Triad (Gexol Polyolefin)');
    this.drawCallout(startX + 450, cy, startX + 450, cy + 80, 'Flexible Stranded Conductor');
  }

  drawCallout(xStart, yStart, xEnd, yEnd, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#0f172a';

    // Dot at start
    ctx.beginPath();
    ctx.arc(xStart, yStart, 3, 0, Math.PI * 2);
    ctx.fill();

    // Leader line
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.lineTo(xEnd + 20, yEnd);
    ctx.stroke();

    // Text badge
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, xEnd + 26, yEnd + 4);
  }

  renderPowerSpecs() {
    const list = document.getElementById('cs-layers-list');
    list.innerHTML = `
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#18181b"></span>
        <div class="cs-layer-text">
          <strong>1. Outer Sheath:</strong> Heavy-duty PE / PVC extruded polymer (Thickness: 1.8 mm, OD: 24.0 mm).
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#f4f1ea; border: 1px solid #cbd5e1"></span>
        <div class="cs-layer-text">
          <strong>2. Interstitial Filler:</strong> Non-hygroscopic polypropylene / fibrous compound filling core valleys.
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#0284c7"></span>
        <div class="cs-layer-text">
          <strong>3. Neutral Insulation:</strong> Cross-linked Polyethylene (XLPE) in blue color (Thickness: 1.2 mm).
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#dc2626"></span>
        <div class="cs-layer-text">
          <strong>4. Phase Insulation:</strong> Cross-linked Polyethylene (XLPE) in Red, Yellow, Green/Teal (Thickness: 1.4 mm).
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#c86432"></span>
        <div class="cs-layer-text">
          <strong>5. Conductor Cores:</strong> Class 2 stranded compacted high-conductivity Copper or Aluminium.
        </div>
      </div>
    `;

    const tests = document.getElementById('cs-applicable-tests');
    tests.innerHTML = `
      <div class="cs-test-card">
        <span class="cs-test-tag">IS 10810 PART 7</span>
        <strong>Dumbbell Tensile & Elongation:</strong> Punched from XLPE insulation and PE/PVC sheath.
      </div>
      <div class="cs-test-card">
        <span class="cs-test-tag">IS 10810 PART 2</span>
        <strong>Conductor Tensile & Resistance:</strong> Calibrated length copper/aluminium wire shear.
      </div>
      <div class="cs-test-card">
        <span class="cs-test-tag">IS 10810 PART 33</span>
        <strong>Insulation Thickness:</strong> Radial optical projector cross-section wafer slice.
      </div>
    `;
  }

  renderShieldedSpecs() {
    const list = document.getElementById('cs-layers-list');
    list.innerHTML = `
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#18181b"></span>
        <div class="cs-layer-text">
          <strong>1. Outer Sheath:</strong> Black arctic-grade flame-retardant mud-resistant compound per NEK 606.
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#d4af37"></span>
        <div class="cs-layer-text">
          <strong>2. Basket Weave Armor:</strong> Bronze / tinned copper wire braid per IEEE 1580 & UL 1309.
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#27272a"></span>
        <div class="cs-layer-text">
          <strong>3. Inner Jacket:</strong> Flame retardant thermosetting compound meeting UL 1309/CSA 245.
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#38bdf8"></span>
        <div class="cs-layer-text">
          <strong>4. Shielding:</strong> 100% coverage polyester-backed aluminum foil tape with bare tinned drain wire.
        </div>
      </div>
      <div class="cs-layer-item">
        <span class="cs-layer-dot" style="background:#cbd5e1"></span>
        <div class="cs-layer-text">
          <strong>5. Triad Cores & Conductor:</strong> Flexible stranded tinned copper with Gexol cross-linked polyolefin.
        </div>
      </div>
    `;

    const tests = document.getElementById('cs-applicable-tests');
    tests.innerHTML = `
      <div class="cs-test-card">
        <span class="cs-test-tag">IS 10810 PART 7</span>
        <strong>Polyolefin Dumbbell:</strong> High-precision dogbone stamp from triad insulation.
      </div>
      <div class="cs-test-card">
        <span class="cs-test-tag">IEEE 1580 / IS 10810 PT 2</span>
        <strong>Flexible Conductor Test:</strong> Tensile and continuity test on stranded tinned conductors.
      </div>
      <div class="cs-test-card">
        <span class="cs-test-tag">ARMOR / SHIELD STRIP</span>
        <strong>Shield & Armor Peeling:</strong> Multi-layer sequential stripping and scrap separation.
      </div>
    `;
  }
}
