/**
 * HMIOverlay.js
 * Industrial Engineering Human-Machine Interface & CAD Control HUD.
 * 
 * Strict Architectural Compliance:
 * - Dark industrial workspace theme (#111315)
 * - 85-90% viewport ratio dedicated to the 3D machine
 * - Strictly NO permanent workflow banners or process text strips
 * - Three operating modes: AUTO, MANUAL, AUTO OVERRIDE
 * - Engineering View & Disassembly controls: NORMAL, TRANSPARENT, CROSS-SECTION, EXPLODE, ASSEMBLE
 * - Non-intrusive Contextual Panel that opens when a component is clicked while CAMERA STAYS FIXED
 * - Fully functional manual parameter inputs that directly drive the 3D simulation
 */
export class HMIOverlay {
  constructor(simEngine, camCtrl, crossSectionModal, audio) {
    this.simEngine = simEngine;
    this.camCtrl = camCtrl;
    this.csModal = crossSectionModal;
    this.audio = audio;

    this.selectedComponent = null;

    this.createUI();
    this.bindEvents();
  }

  createUI() {
    const root = document.createElement('div');
    root.id = 'hmi-root';

    root.innerHTML = `
      <!-- TOP MASTER ENGINEERING BAR -->
      <header id="hmi-topbar">
        <div class="hmi-brand">
          <div class="hmi-logo-icon">⚙</div>
          <div class="hmi-brand-titles">
            <span class="hmi-brand-main">AUTOMATED CABLE SPECIMEN PREPARATION SYSTEM</span>
            <span class="hmi-brand-sub">INTERACTIVE 3D ENGINEERING DIGITAL TWIN &bull; IS 10810 / IS 7098</span>
          </div>
        </div>

        <!-- Engineering View & Assembly Tools -->
        <div class="hmi-top-tools">
          <div class="tool-cluster">
            <span class="cluster-label">View</span>
            <button class="top-btn active" id="btn-view-normal">NORMAL</button>
            <button class="top-btn cyan-btn" id="btn-view-transparent" title="Transparent Safety Enclosure">TRANSPARENT</button>
            <button class="top-btn cyan-btn" id="btn-view-cross-section" title="Internal Cross-Section & Layers">CROSS-SECTION</button>
          </div>

          <div class="tool-cluster">
            <span class="cluster-label">Assembly</span>
            <button class="top-btn purple-btn" id="btn-asm-explode" title="Exploded View Disassembly">EXPLODE</button>
            <button class="top-btn purple-btn active" id="btn-asm-assemble" title="Assemble Components">ASSEMBLE</button>
          </div>
        </div>

        <!-- Camera Presets & Audio -->
        <div class="hmi-top-right">
          <select class="camera-preset-select" id="sel-cam-preset">
            <option value="overview" selected>Camera: 3/4 Front Overview</option>
            <option value="reel">Camera: Cable Reel & Inlet</option>
            <option value="feed">Camera: Feed & Straightener</option>
            <option value="cutting">Camera: Cutter & Clamp</option>
            <option value="punch">Camera: Dumbbell Die Press</option>
            <option value="trays">Camera: Output Collection Carts</option>
            <option value="hmi">Camera: Electrical & HMI</option>
          </select>

          <button class="btn-icon" id="btn-reset-cam" title="Reset Camera View (R)">⟲ Reset</button>
          <button class="btn-icon" id="btn-sound-toggle" title="Toggle Audio (M)">🔊</button>
        </div>
      </header>

      <!-- MAIN WORKSPACE: DOCKED FLOATING PANELS -->
      <main id="hmi-workspace">
        
        <!-- LEFT PANEL: Standards & Cable Architecture Selection -->
        <aside class="hmi-panel hmi-left-panel" id="panel-left">
          <div class="panel-header">
            <span class="panel-title">STANDARDS & RECIPE</span>
            <button class="panel-close-btn" id="btn-close-left">&times;</button>
          </div>

          <div class="panel-body">
            <!-- Cable Specification -->
            <div class="hmi-card">
              <span class="card-tag">CABLE ARCHITECTURE</span>
              <div class="cfg-row">
                <span class="cfg-label">Cable Model:</span>
                <div class="cfg-pills" id="pills-cable-type">
                  <button class="cfg-pill active" data-type="POWER">Power (Ref 1)</button>
                  <button class="cfg-pill" data-type="SHIELDED">Shielded (Ref 2)</button>
                </div>
              </div>

              <div class="cfg-row">
                <span class="cfg-label">Conductor Metal:</span>
                <div class="cfg-pills" id="pills-conductor-mat">
                  <button class="cfg-pill active" data-cond="COPPER">Copper (Cu)</button>
                  <button class="cfg-pill" data-cond="ALUMINIUM">Aluminium (Al)</button>
                </div>
              </div>
            </div>

            <!-- Standard Specification -->
            <div class="hmi-card">
              <span class="card-tag">STANDARD TEST SPECIFICATION</span>
              <div class="cfg-row">
                <span class="cfg-label">Test Standard:</span>
                <div class="cfg-pills" id="pills-standard">
                  <button class="cfg-pill active" data-std="IS_10810">IS 10810</button>
                  <button class="cfg-pill" data-std="IS_7098_P1">IS 7098-1</button>
                  <button class="cfg-pill" data-std="IS_7098_P2">IS 7098-2</button>
                </div>
              </div>

              <div class="cfg-row">
                <span class="cfg-label">Specimen Procedure:</span>
                <div class="cfg-pills" id="pills-part">
                  <button class="cfg-pill active" data-part="PART_7">Part 7: Dumbbell</button>
                  <button class="cfg-pill" data-part="PART_2">Part 2: Conductor</button>
                  <button class="cfg-pill" data-part="PART_33">Part 33: Sheet</button>
                </div>
              </div>

              <div class="std-info-box" id="lbl-std-desc">
                IS 10810 Part 7: Tensile strength and elongation at break of thermoplastic & elastomeric insulation/sheath (Dumbbell).
              </div>
            </div>

            <!-- Current Recipe Card -->
            <div class="hmi-card">
              <span class="card-tag">LOADED RECIPE PARAMETERS</span>
              <div class="context-row"><span class="context-lbl">Cable Diameter:</span><span class="context-val" id="rcp-dia">24.0 mm</span></div>
              <div class="context-row"><span class="context-lbl">Feed Distance:</span><span class="context-val" id="rcp-feed-dist">320 mm</span></div>
              <div class="context-row"><span class="context-lbl">Feed Speed:</span><span class="context-val" id="rcp-feed-speed">80 mm/s</span></div>
              <div class="context-row"><span class="context-lbl">Cut Depth:</span><span class="context-val" id="rcp-cut-depth">1.8 mm</span></div>
              <div class="context-row"><span class="context-lbl">Slit Length:</span><span class="context-val" id="rcp-slit-len">120 mm</span></div>
              <div class="context-row"><span class="context-lbl">Specimen Form:</span><span class="context-val" id="rcp-spec-form">Dumbbell Type 1</span></div>
              <div class="context-row"><span class="context-lbl">Inspection Tol:</span><span class="context-val" id="rcp-tol">±0.12 mm</span></div>
            </div>

            <!-- Engineering Simulation Disclaimer -->
            <div class="disclaimer-banner">
              CONCEPT SIMULATION / DIGITAL TWIN<br>
              FINAL TESTING PERFORMED USING APPROPRIATE LABORATORY TEST EQUIPMENT.
            </div>
          </div>
        </aside>

        <!-- RIGHT PANEL: Contextual Component Inspector & Manual Parameter Editor -->
        <aside class="hmi-panel hmi-right-panel" id="panel-right">
          <div class="panel-header">
            <span class="panel-title" id="right-panel-title">COMPONENT INSPECTION</span>
            <button class="panel-close-btn" id="btn-close-right">&times;</button>
          </div>

          <div class="panel-body">
            <!-- VIEW A: Contextual Component Info (Visible when 3D object is clicked) -->
            <div id="view-contextual-component">
              <div class="hmi-card">
                <span class="card-tag" id="ctx-cat">MECHANISM</span>
                <h3 style="font-size: 13px; font-weight: 800; color: #ffffff;" id="ctx-name">Select Component</h3>
                <p style="font-size: 11px; color: var(--text-muted); line-height: 1.45;" id="ctx-desc">Click any mechanism in the 3D view to inspect its mechanical parameters and telemetry.</p>
              </div>

              <div class="hmi-card" id="ctx-details-card">
                <span class="card-tag">STATUS & KINEMATICS</span>
                <div class="context-row"><span class="context-lbl">Status:</span><span class="context-val" id="ctx-status" style="color: var(--accent-green);">READY</span></div>
                <div class="context-row"><span class="context-lbl">Primary Parameter:</span><span class="context-val" id="ctx-param1">120 mm/s</span></div>
                <div class="context-row"><span class="context-lbl">Current Position:</span><span class="context-val" id="ctx-pos">500.0 mm</span></div>
              </div>

              <div class="hmi-card">
                <span class="card-tag">MECHANICAL RELATIONSHIP</span>
                <div class="kinematic-chain" id="ctx-chain">
                  SERVO MOTOR &rarr; COUPLING &rarr; SHAFT &rarr; ROLLER &rarr; ENCODER
                </div>
              </div>

              <div class="hmi-card" id="ctx-actions-card">
                <span class="card-tag">MANUAL MECHANISM ACTION</span>
                <button class="btn-action-primary" id="btn-ctx-action">RUN SELECTED MECHANISM</button>
              </div>
            </div>

            <!-- VIEW B: Manual Parameter Editor (Visible in MANUAL mode) -->
            <div id="view-manual-editor" class="hidden">
              <div class="hmi-card">
                <span class="card-tag" style="color: var(--accent-amber);">MANUAL PARAMETER EDITOR</span>
                <p style="font-size: 10.5px; color: var(--text-muted);">Adjust functional parameters below. All values directly alter the 3D mechanisms.</p>
              </div>

              <div class="accordion-group">
                <!-- CABLE -->
                <div class="accordion-item">
                  <div class="accordion-header" data-acc="cable">CABLE PARAMETERS <span>▼</span></div>
                  <div class="accordion-content" id="acc-cable">
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Outer Diameter:</span><span class="slider-val" id="val-dia">24.0 mm</span></div>
                      <input type="range" class="param-range" id="sl-dia" min="8.0" max="45.0" step="0.5" value="24.0">
                    </div>
                  </div>
                </div>

                <!-- FEED -->
                <div class="accordion-item">
                  <div class="accordion-header" data-acc="feed">FEED PARAMETERS <span>▼</span></div>
                  <div class="accordion-content" id="acc-feed">
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Feed Speed:</span><span class="slider-val" id="val-feed-speed">80 mm/s</span></div>
                      <input type="range" class="param-range" id="sl-feed-speed" min="10" max="250" step="5" value="80">
                    </div>
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Feed Distance:</span><span class="slider-val" id="val-feed-dist">320 mm</span></div>
                      <input type="range" class="param-range" id="sl-feed-dist" min="50" max="600" step="10" value="320">
                    </div>
                  </div>
                </div>

                <!-- STRAIGHTENER -->
                <div class="accordion-item">
                  <div class="accordion-header" data-acc="straightener">STRAIGHTENER PARAMETERS <span>▼</span></div>
                  <div class="accordion-content hidden" id="acc-straightener">
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Roller Gap:</span><span class="slider-val" id="val-gap">2.6 mm</span></div>
                      <input type="range" class="param-range" id="sl-gap" min="0.5" max="12.0" step="0.1" value="2.6">
                    </div>
                  </div>
                </div>

                <!-- CUT & SLIT -->
                <div class="accordion-item">
                  <div class="accordion-header" data-acc="cut">CUTTING & SLITTING <span>▼</span></div>
                  <div class="accordion-content hidden" id="acc-cut">
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Sheath Cut Depth:</span><span class="slider-val" id="val-cut-depth">1.8 mm</span></div>
                      <input type="range" class="param-range" id="sl-cut-depth" min="0.2" max="6.0" step="0.1" value="1.8">
                    </div>
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Slit Length:</span><span class="slider-val" id="val-slit-len">120 mm</span></div>
                      <input type="range" class="param-range" id="sl-slit-len" min="20" max="250" step="5" value="120">
                    </div>
                  </div>
                </div>

                <!-- PEELING -->
                <div class="accordion-item">
                  <div class="accordion-header" data-acc="peel">STRIPPING & PEELING <span>▼</span></div>
                  <div class="accordion-content hidden" id="acc-peel">
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Peel Distance:</span><span class="slider-val" id="val-peel-dist">110 mm</span></div>
                      <input type="range" class="param-range" id="sl-peel-dist" min="20" max="200" step="5" value="110">
                    </div>
                  </div>
                </div>

                <!-- SPECIMEN & PUNCH -->
                <div class="accordion-item">
                  <div class="accordion-header" data-acc="specimen">SPECIMEN & PUNCH <span>▼</span></div>
                  <div class="accordion-content hidden" id="acc-specimen">
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Punch Stroke:</span><span class="slider-val" id="val-punch-stroke">28 mm</span></div>
                      <input type="range" class="param-range" id="sl-punch-stroke" min="5" max="45" step="1" value="28">
                    </div>
                    <div class="param-slider-row">
                      <div class="slider-labels"><span class="slider-lbl">Inspection Tolerance:</span><span class="slider-val" id="val-tol">±0.10 mm</span></div>
                      <input type="range" class="param-range" id="sl-tol" min="0.02" max="0.50" step="0.01" value="0.10">
                    </div>
                  </div>
                </div>
              </div>

              <div class="hmi-card">
                <button class="btn-action-primary" id="btn-apply-manual">APPLY PARAMETERS & RUN</button>
              </div>
            </div>

            <!-- Recent Inspection Result Card -->
            <div class="hmi-card" id="card-recent-inspection">
              <span class="card-tag">LATEST SPECIMEN INSPECTION</span>
              <div class="context-row"><span class="context-lbl">Specimen ID:</span><span class="context-val" id="insp-id">SPEC-000</span></div>
              <div class="context-row"><span class="context-lbl">Type:</span><span class="context-val" id="insp-type">Dumbbell Type 1</span></div>
              <div class="context-row"><span class="context-lbl">Actual Length:</span><span class="context-val" id="insp-len">-- mm</span></div>
              <div class="context-row"><span class="context-lbl">Actual Width:</span><span class="context-val" id="insp-width">-- mm</span></div>
              <div class="context-row"><span class="context-lbl">Metrology Verdict:</span><span class="context-val" id="insp-verdict" style="color: var(--accent-green);">READY</span></div>
            </div>
          </div>
        </aside>

      </main>

      <!-- BOTTOM MACHINE CONTROL BAR (NO WORKFLOW TEXT / NO PATHWAY STRIP!) -->
      <footer id="hmi-bottombar">
        <!-- Operating Mode Buttons -->
        <div class="bottom-mode-cluster">
          <button class="mode-btn active" id="btn-mode-auto" data-mode="AUTO">AUTO</button>
          <button class="mode-btn" id="btn-mode-manual" data-mode="MANUAL">MANUAL</button>
          <button class="mode-btn" id="btn-mode-override" data-mode="AUTO_OVERRIDE">AUTO OVERRIDE</button>
        </div>

        <!-- Master Cycle Actions -->
        <div class="bottom-cycle-controls">
          <button class="btn-cycle btn-start" id="btn-start-cycle">▶ START</button>
          <button class="btn-cycle btn-pause" id="btn-pause-cycle">⏸ PAUSE</button>
          <button class="btn-cycle btn-reset" id="btn-reset-cycle">🔄 RESET</button>
          <button class="btn-cycle btn-estop" id="btn-estop-cycle" title="SIL-3 Emergency Stop">🛑 E-STOP</button>
        </div>

        <!-- Real-Time Machine Telemetry -->
        <div class="bottom-telemetry-cluster">
          <div class="state-badge">
            <div class="state-dot" id="dot-state"></div>
            <span id="lbl-machine-state">IDLE</span>
            <span style="color: var(--text-dim); margin-left: 4px;">(<span id="val-cycle-time">0.0s</span>)</span>
          </div>

          <div class="telemetry-pills">
            <div class="telem-pill">
              <span class="telem-lbl">Encoder:</span>
              <span class="telem-val" id="lbl-encoder-dist">0.0 mm</span>
            </div>
            <div class="telem-pill">
              <span class="telem-lbl">Laser OD:</span>
              <span class="telem-val" id="lbl-laser-dia">24.00 mm</span>
            </div>
            <div class="telem-pill">
              <span class="telem-lbl">Force:</span>
              <span class="telem-val" id="lbl-cut-force">0.0 N</span>
            </div>
            <div class="telem-pill">
              <span class="telem-lbl">Safety Door:</span>
              <span class="telem-val" id="lbl-door-stat" style="color: var(--accent-green);">CLOSED</span>
            </div>
          </div>
        </div>
      </footer>
    `;

    document.body.appendChild(root);
  }

  bindEvents() {
    // 1. Cycle Controls
    document.getElementById('btn-start-cycle').addEventListener('click', () => this.simEngine.start());
    document.getElementById('btn-pause-cycle').addEventListener('click', () => this.simEngine.pause());
    document.getElementById('btn-reset-cycle').addEventListener('click', () => this.simEngine.reset());
    document.getElementById('btn-estop-cycle').addEventListener('click', () => this.simEngine.triggerEStop());

    // 2. Sound Toggle
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      document.getElementById('btn-sound-toggle').textContent = isMuted ? '🔇' : '🔊';
    });

    // 3. View Modes (Normal, Transparent, Cross-Section)
    document.getElementById('btn-view-normal').addEventListener('click', () => {
      this.setActiveTopBtn('btn-view-normal');
      this.simEngine.subsystems.enclosure.setEngineeringView(false);
    });

    document.getElementById('btn-view-transparent').addEventListener('click', () => {
      this.setActiveTopBtn('btn-view-transparent');
      this.simEngine.subsystems.enclosure.setEngineeringView(true);
    });

    document.getElementById('btn-view-cross-section').addEventListener('click', () => {
      this.csModal.open(this.simEngine.recipeManager.selectedCableType);
    });

    // 4. Assembly Disassembly (Explode / Assemble)
    document.getElementById('btn-asm-explode').addEventListener('click', () => {
      document.getElementById('btn-asm-explode').classList.add('active');
      document.getElementById('btn-asm-assemble').classList.remove('active');
      this.simEngine.explode();
    });

    document.getElementById('btn-asm-assemble').addEventListener('click', () => {
      document.getElementById('btn-asm-assemble').classList.add('active');
      document.getElementById('btn-asm-explode').classList.remove('active');
      this.simEngine.assemble();
    });

    // 5. Camera Presets (Manual button/dropdown selection)
    document.getElementById('sel-cam-preset').addEventListener('change', (e) => {
      this.camCtrl.setViewPreset(e.target.value);
    });

    document.getElementById('btn-reset-cam').addEventListener('click', () => {
      this.camCtrl.resetView();
      document.getElementById('sel-cam-preset').value = 'overview';
    });

    // 6. Panel close controls are owned by their own panel.
    document.getElementById('btn-close-left').addEventListener('click', () => {
      document.getElementById('panel-left').classList.add('collapsed');
    });

    document.getElementById('btn-close-right').addEventListener('click', () => {
      document.getElementById('panel-right').classList.add('collapsed');
      this.selectedComponent = null;
    });

    // 7. Operating Mode Selector
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.simEngine.recipeManager.setMode(mode);
        this.onModeChange(mode);
      });
    });

    // 8. Cable Selection
    const cablePills = document.querySelectorAll('#pills-cable-type .cfg-pill');
    cablePills.forEach(pill => {
      pill.addEventListener('click', () => {
        cablePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const type = pill.dataset.type;
        this.simEngine.recipeManager.setCableType(type);
        if (this.simEngine.subsystems && this.simEngine.subsystems.cable) {
          this.simEngine.subsystems.cable.updateConfiguration({
            cableType: type,
            outerDiameter: type === 'POWER' ? 24.0 : 18.0
          });
        }
        this.updateRecipeUI();
      });
    });

    // 9. Conductor Metal Selection
    const condPills = document.querySelectorAll('#pills-conductor-mat .cfg-pill');
    condPills.forEach(pill => {
      pill.addEventListener('click', () => {
        condPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const cond = pill.dataset.cond;
        this.simEngine.recipeManager.selectedConductor = cond;
        if (this.simEngine.subsystems && this.simEngine.subsystems.cable) {
          this.simEngine.subsystems.cable.updateConfiguration({ conductorMaterial: cond });
        }
        if (this.simEngine.subsystems && this.simEngine.subsystems.conductor) {
          this.simEngine.subsystems.conductor.setConductorMaterial(cond);
        }
      });
    });

    // 10. Standards & Procedures
    const stdPills = document.querySelectorAll('#pills-standard .cfg-pill');
    stdPills.forEach(pill => {
      pill.addEventListener('click', () => {
        stdPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.simEngine.recipeManager.setStandard(pill.dataset.std);
        document.getElementById('lbl-std-desc').textContent = this.simEngine.recipeManager.getStandardDescription();
        this.updateRecipeUI();
      });
    });

    const partPills = document.querySelectorAll('#pills-part .cfg-pill');
    partPills.forEach(pill => {
      pill.addEventListener('click', () => {
        partPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.simEngine.recipeManager.setStandard(this.simEngine.recipeManager.selectedStandard, pill.dataset.part);
        document.getElementById('lbl-std-desc').textContent = this.simEngine.recipeManager.getStandardDescription();
        this.updateRecipeUI();
      });
    });

    // 11. Accordions in Manual Editor
    const accHeaders = document.querySelectorAll('.accordion-header');
    accHeaders.forEach(hdr => {
      hdr.addEventListener('click', () => {
        const id = hdr.dataset.acc;
        const content = document.getElementById(`acc-${id}`);
        content.classList.toggle('hidden');
      });
    });

    // 12. Manual Parameter Sliders
    this.bindManualSliders();

    // 13. Engine Callbacks
    this.simEngine.onStateChange = (state) => this.onStateUpdate(state);
    this.simEngine.onTelemetryUpdate = (t) => this.onTelemetry(t);
    this.simEngine.onInspectionComplete = (insp) => this.onInspection(insp);

    // Apply manual button
    document.getElementById('btn-apply-manual')?.addEventListener('click', () => {
      this.simEngine.start();
    });

    // Contextual single-operation trigger
    document.getElementById('btn-ctx-action')?.addEventListener('click', () => {
      if (this.selectedComponent) {
        if (this.selectedComponent.type === 'ESTOP') {
          this.simEngine.triggerEStop();
        } else {
          this.simEngine.start();
        }
      }
    });
  }

  setActiveTopBtn(activeId) {
    ['btn-view-normal', 'btn-view-transparent'].forEach(id => {
      document.getElementById(id)?.classList.toggle('active', id === activeId);
    });
  }

  onModeChange(mode) {
    const viewComp = document.getElementById('view-contextual-component');
    const viewManual = document.getElementById('view-manual-editor');
    const rightTitle = document.getElementById('right-panel-title');
    const rightPanel = document.getElementById('panel-right');

    rightPanel.classList.remove('collapsed');

    if (mode === 'MANUAL') {
      viewComp.classList.add('hidden');
      viewManual.classList.remove('hidden');
      rightTitle.textContent = 'MANUAL PARAMETERS';
    } else {
      viewComp.classList.remove('hidden');
      viewManual.classList.add('hidden');
      rightTitle.textContent = 'COMPONENT INSPECTION';
    }
  }

  bindManualSliders() {
    const bind = (id, paramKey, unit = 'mm', decimals = 1) => {
      const slider = document.getElementById(`sl-${id}`);
      const valDisplay = document.getElementById(`val-${id}`);
      if (!slider || !valDisplay) return;

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valDisplay.textContent = `${val.toFixed(decimals)} ${unit}`;
        this.simEngine.recipeManager.updateParam(paramKey, val);

        // Direct 3D mechanism updates
        if (paramKey === 'cableDiameterMm' && this.simEngine.subsystems.cable) {
          this.simEngine.subsystems.cable.updateConfiguration({ outerDiameter: val });
          this.simEngine.subsystems.inlet.setTargetCableRadius((val * 0.5) * 0.001);
          this.simEngine.subsystems.clamping.setTargetCableRadius((val * 0.5) * 0.001);
        }
        if (paramKey === 'straightenerGapMm' && this.simEngine.subsystems.feedStraightener) {
          this.simEngine.subsystems.feedStraightener.setStraightenerGap(val);
        }
        if (paramKey === 'cutDepthMm' && this.simEngine.subsystems.cutting) {
          this.simEngine.subsystems.cutting.maxCutDepthMm = val;
        }
      });
    };

    bind('dia', 'cableDiameterMm', 'mm', 1);
    bind('feed-speed', 'feedSpeedMmPerSec', 'mm/s', 0);
    bind('feed-dist', 'feedDistanceMm', 'mm', 0);
    bind('gap', 'straightenerGapMm', 'mm', 1);
    bind('cut-depth', 'cutDepthMm', 'mm', 1);
    bind('slit-len', 'slitLengthMm', 'mm', 0);
    bind('peel-dist', 'peelDistanceMm', 'mm', 0);
    bind('punch-stroke', 'punchStrokeMm', 'mm', 0);
    bind('tol', 'inspectionToleranceMm', 'mm', 2);
  }

  updateRecipeUI() {
    const p = this.simEngine.recipeManager.params;
    document.getElementById('rcp-dia').textContent = `${p.cableDiameterMm} mm`;
    document.getElementById('rcp-feed-dist').textContent = `${p.feedDistanceMm} mm`;
    document.getElementById('rcp-feed-speed').textContent = `${p.feedSpeedMmPerSec} mm/s`;
    document.getElementById('rcp-cut-depth').textContent = `${p.cutDepthMm} mm`;
    document.getElementById('rcp-slit-len').textContent = `${p.slitLengthMm} mm`;
    document.getElementById('rcp-spec-form').textContent = p.specimenType;
    document.getElementById('rcp-tol').textContent = `±${p.inspectionToleranceMm.toFixed(2)} mm`;
  }

  showComponentContext(userData) {
    this.selectedComponent = userData;
    const panel = document.getElementById('panel-right');
    panel.classList.remove('collapsed');

    // Switch view to contextual component view
    document.getElementById('view-contextual-component').classList.remove('hidden');
    document.getElementById('view-manual-editor').classList.add('hidden');
    document.getElementById('right-panel-title').textContent = 'MECHANISM INSPECTION';

    if (!userData) {
      document.getElementById('ctx-cat').textContent = 'SYSTEM';
      document.getElementById('ctx-name').textContent = 'Automated Rig Overview';
      document.getElementById('ctx-desc').textContent = 'Click any physical 3D mechanism to view parameters and controls.';
      document.getElementById('ctx-status').textContent = 'ONLINE';
      document.getElementById('ctx-param1').textContent = '--';
      document.getElementById('ctx-pos').textContent = '--';
      document.getElementById('ctx-chain').textContent = 'MACHINE BASE &bull; ENCLOSURE &bull; WORKBED';
      return;
    }

    document.getElementById('ctx-cat').textContent = userData.category || 'SUBSYSTEM';
    document.getElementById('ctx-name').textContent = userData.name || 'Component';
    document.getElementById('ctx-desc').textContent = userData.description || 'Precision industrial subassembly.';

    // Populate dynamic properties
    document.getElementById('ctx-status').textContent = userData.status || 'READY';
    document.getElementById('ctx-param1').textContent = userData.param1 || `${this.simEngine.recipeManager.params.feedSpeedMmPerSec} mm/s`;
    document.getElementById('ctx-pos').textContent = userData.pos || `${this.simEngine.feedDisplacementM * 1000} mm`;

    // Mechanical kinship chain
    let chain = 'STAND &bull; ENCLOSURE &bull; WORKBED';
    if (userData.category === 'FEED_SYSTEM') {
      chain = 'SERVO MOTOR &rarr; COUPLING &rarr; SHAFT &rarr; ROLLER &rarr; ENCODER';
    } else if (userData.category === 'CUTTING_SYSTEM') {
      chain = 'SERVO ORBIT RING &rarr; RADIAL SLIDE &rarr; CARBIDE BLADE';
    } else if (userData.category === 'DUMBBELL_STATION') {
      chain = 'C-FRAME &rarr; 10 kN CYLINDER &rarr; DIE TOOL &rarr; HARDENED ANVIL';
    } else if (userData.category === 'ROUTING_SYSTEM') {
      chain = 'OVERHEAD BEAM &rarr; SHUTTLE &rarr; VACUUM PAD &rarr; DIVERTER';
    } else if (userData.category === 'OUTPUT_CART') {
      chain = `CART FRAME &rarr; ${userData.standard || 'STANDARD'} &rarr; SPECIMEN ACCUMULATOR`;
    }
    document.getElementById('ctx-chain').innerHTML = chain;

    // Action button label
    const btnAction = document.getElementById('btn-ctx-action');
    if (userData.type === 'ESTOP') {
      btnAction.textContent = 'TRIP / RESET EMERGENCY STOP';
    } else {
      btnAction.textContent = `OPERATE ${userData.name.toUpperCase().slice(0, 24)}`;
    }
  }

  onStateUpdate(state) {
    const lbl = document.getElementById('lbl-machine-state');
    const dot = document.getElementById('dot-state');

    lbl.textContent = state.replace('_', ' ');

    if (state === 'FAULT' || state === 'SAFETY_STOP') {
      dot.style.background = 'var(--accent-red)';
      dot.style.boxShadow = '0 0 8px var(--accent-red)';
    } else if (state === 'IDLE' || state === 'COMPLETE') {
      dot.style.background = 'var(--accent-green)';
      dot.style.boxShadow = '0 0 8px var(--accent-green)';
    } else {
      dot.style.background = 'var(--accent-amber)';
      dot.style.boxShadow = '0 0 8px var(--accent-amber)';
    }
  }

  onTelemetry(t) {
    document.getElementById('val-cycle-time').textContent = `${this.simEngine.cycleTimeSec.toFixed(1)}s`;
    document.getElementById('lbl-encoder-dist').textContent = `${t.encoderDistanceMm.toFixed(1)} mm`;
    document.getElementById('lbl-laser-dia').textContent = `${t.laserDiameterMm.toFixed(2)} mm`;
    document.getElementById('lbl-cut-force').textContent = `${t.cuttingForceN.toFixed(1)} N`;

  }

  onInspection(insp) {
    document.getElementById('insp-id').textContent = insp.specimenId;
    document.getElementById('insp-type').textContent = insp.type;
    document.getElementById('insp-len').textContent = `${insp.actualLengthMm.toFixed(2)} mm`;
    document.getElementById('insp-width').textContent = `${insp.actualWidthMm.toFixed(2)} mm`;

    const verdict = document.getElementById('insp-verdict');
    verdict.textContent = `${insp.result} (±${insp.toleranceMm}mm)`;
    verdict.style.color = (insp.result === 'PASS') ? 'var(--accent-green)' : 'var(--accent-red)';
  }
}
