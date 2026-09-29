/**
 * OperativeHMIController
 * Adds an actual touch-friendly operator interface to the physical HMI console.
 * The existing HMIOverlay remains the control engine; this layer makes the
 * physical screen the entry point and collapses auxiliary panels behind icons.
 */
export class OperativeHMIController {
  constructor(app) {
    this.app = app;
    this.hmi = app.hmi;
    this.sim = app.sim;
    this.open = false;
    this.injectStyle();
    this.buildDock();
    this.bindPhysicalHMI();
    this.bindPanelState();
  }

  injectStyle() {
    const style = document.createElement('style');
    style.id = 'operative-hmi-style';
    style.textContent = `
      #operative-hmi-dock{position:fixed;left:14px;top:50%;transform:translateY(-50%);z-index:12000;display:flex;flex-direction:column;gap:8px}
      .op-hmi-icon{width:42px;height:42px;border:1px solid #555a5e;border-radius:10px;background:#202427;color:#e8eaec;display:grid;place-items:center;font:700 17px Arial;cursor:pointer;box-shadow:0 8px 20px #0008}
      .op-hmi-icon:hover,.op-hmi-icon.active{border-color:#f2a900;color:#f2a900}
      #hmi-root.hmi-collapsed #panel-left,#hmi-root.hmi-collapsed #panel-right{display:none!important}
      #hmi-root.hmi-collapsed #hmi-top-tools{display:none}
      #hmi-root.hmi-collapsed #hmi-topbar{pointer-events:none;background:transparent;border:0}
      #hmi-root.hmi-collapsed .hmi-brand,#hmi-root.hmi-collapsed .hmi-top-right{display:none}
      #hmi-root.hmi-collapsed #hmi-bottombar{left:68px;right:14px}
      #hmi-root.hmi-panel-open #hmi-topbar{pointer-events:auto}
      #hmi-root.hmi-panel-open #hmi-bottombar{pointer-events:auto}
      #hmi-root .hmi-panel{max-height:calc(100vh - 145px);overflow:auto}
      .physical-hmi-active{outline:2px solid #f2a900;outline-offset:3px}
      @media(max-width:760px){
        #operative-hmi-dock{left:8px;top:auto;bottom:94px;transform:none;flex-direction:row}
        .op-hmi-icon{width:40px;height:40px}
        #hmi-root.hmi-panel-open #panel-left,#hmi-root.hmi-panel-open #panel-right{position:fixed;left:8px;right:8px;width:auto;max-width:none;top:58px;bottom:145px;max-height:none;z-index:11000}
        #hmi-root.hmi-collapsed #hmi-bottombar{left:8px;right:8px}
        #hmi-bottombar{padding:7px!important;gap:6px!important;flex-wrap:wrap!important}
        .bottom-telemetry-cluster{display:none!important}
        .bottom-mode-cluster,.bottom-cycle-controls{min-width:0!important}
        .mode-btn,.btn-cycle{min-height:38px!important;padding:7px 9px!important;font-size:10px!important}
      }
      @media(pointer:coarse){
        .mode-btn,.btn-cycle,.top-btn,.cfg-pill,.btn-action-primary,.param-range{min-height:42px}
      }
    `;
    document.head.appendChild(style);
  }

  buildDock() {
    const dock = document.createElement('div');
    dock.id = 'operative-hmi-dock';
    dock.innerHTML = `
      <button class="op-hmi-icon" id="op-hmi" title="Open operative HMI">▣</button>
      <button class="op-hmi-icon" id="op-info" title="Instructions">i</button>
      <button class="op-hmi-icon" id="op-controls" title="Controls">☷</button>
      <button class="op-hmi-icon" id="op-close" title="Close panels">×</button>
    `;
    document.body.appendChild(dock);

    document.getElementById('op-hmi').addEventListener('click',()=>this.toggleHMI());
    document.getElementById('op-info').addEventListener('click',()=>this.openPanel('left'));
    document.getElementById('op-controls').addEventListener('click',()=>this.openPanel('right'));
    document.getElementById('op-close').addEventListener('click',()=>this.closePanels());

    const root=document.getElementById('hmi-root');
    root.classList.add('hmi-collapsed');
  }

  openPanel(side) {
    const root=document.getElementById('hmi-root');
    root.classList.remove('hmi-collapsed');
    root.classList.add('hmi-panel-open');
    const left=document.getElementById('panel-left');
    const right=document.getElementById('panel-right');
    if(left) left.style.display=side==='left'?'block':'none';
    if(right) right.style.display=side==='right'?'block':'none';
  }

  closePanels() {
    const root=document.getElementById('hmi-root');
    root.classList.add('hmi-collapsed');
    root.classList.remove('hmi-panel-open');
    const left=document.getElementById('panel-left');
    const right=document.getElementById('panel-right');
    if(left) left.style.display='';
    if(right) right.style.display='';
    this.open=false;
  }

  toggleHMI() {
    this.open=!this.open;
    if(this.open) {
      this.openPanel('right');
      this.hmi.showComponentContext({
        name:'Industrial HMI Touchscreen Operator Console',
        category:'HMI',
        description:'Operative touchscreen control surface. AUTO, MANUAL, recipe parameters, START, STOP, RESET and E-STOP directly command the digital twin.'
      });
      const b=document.getElementById('op-hmi');
      if(b) b.classList.add('active');
    } else {
      this.closePanels();
      const b=document.getElementById('op-hmi');
      if(b) b.classList.remove('active');
    }
  }

  bindPhysicalHMI() {
    const original=this.app.hmi.showComponentContext.bind(this.app.hmi);
    this.app.hmi.showComponentContext=(data)=>{
      original(data);
      if(data?.category==='HMI'){
        this.open=true;
        this.openPanel('right');
        document.getElementById('op-hmi')?.classList.add('active');
      }
    };
  }

  bindPanelState() {
    // Existing close buttons now return to the clean machine view.
    document.getElementById('btn-close-left')?.addEventListener('click',()=>this.closePanels());
    document.getElementById('btn-close-right')?.addEventListener('click',()=>this.closePanels());
  }
}
