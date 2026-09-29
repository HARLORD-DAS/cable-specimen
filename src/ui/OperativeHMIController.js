/**
 * OperativeHMIController
 * Collapsed operator/instruction controls.
 * Left and right instruction panels remain available on demand; the physical
 * 3D HMI is a separate operative entry point.
 */
export class OperativeHMIController {
  constructor(app) {
    this.app = app;
    this.hmi = app.hmi;
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
      #operative-hmi-dock{
        position:fixed; inset:0; pointer-events:none; z-index:12000;
      }
      .op-hmi-icon{
        position:fixed; pointer-events:auto;
        width:44px;height:44px;border:1px solid #555a5e;border-radius:10px;
        background:#202427;color:#e8eaec;display:grid;place-items:center;
        font:700 17px Arial;cursor:pointer;box-shadow:0 8px 20px #0008;
        transition:.15s ease;
      }
      .op-hmi-icon:hover,.op-hmi-icon.active{
        border-color:#f2a900;color:#f2a900;transform:scale(1.04);
      }
      #op-info{left:14px;top:50%;transform:translateY(-50%)}
      #op-controls{right:14px;top:50%;transform:translateY(-50%)}
      #op-hmi{right:14px;top:14px}
      #op-hmi-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;background:#151719;color:#e8eaec;border:1px solid #555a5e;border-radius:12px;box-shadow:0 24px 80px #000b;z-index:12500}
      #op-hmi-panel[hidden]{display:none!important}
      .op-hmi-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #3d4145;font-weight:800}
      .op-hmi-close{width:34px;height:34px;border:1px solid #555a5e;border-radius:8px;background:#202427;color:#fff;font-size:20px;cursor:pointer}
      .op-hmi-body{padding:14px;display:grid;gap:12px}
      .op-hmi-status{display:flex;justify-content:space-between;padding:10px;background:#202427;border-radius:8px}
      .op-hmi-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .op-hmi-action{min-height:48px;border:1px solid #555a5e;border-radius:8px;background:#24282b;color:#fff;font-weight:800;cursor:pointer}
      .op-hmi-action:hover{border-color:#f2a900;color:#f2a900}
      .op-hmi-action.start{background:#1c6841}.op-hmi-action.stop{background:#70272b}.op-hmi-action.estop{background:#8d2025}
      #op-info:hover,#op-controls:hover{transform:translateY(-50%) scale(1.04)}

      #hmi-root.hmi-hmi-open #panel-hmi{display:block!important}
      #hmi-root.hmi-hmi-open #hmi-topbar,
      #hmi-root.hmi-hmi-open #hmi-bottombar{pointer-events:none;opacity:.35}
      #panel-hmi{position:fixed!important;left:50%;top:50%;transform:translate(-50%,-50%);width:min(620px,calc(100vw - 32px));max-height:calc(100vh - 80px);overflow:auto;z-index:11500;box-shadow:0 24px 70px #000b}
      .hmi-op-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .hmi-op-btn{min-height:46px;border:1px solid #555a5e;border-radius:8px;background:#202427;color:#e8eaec;font-weight:800;cursor:pointer}
      .hmi-op-btn:hover{border-color:#f2a900;color:#f2a900}
      .hmi-op-start{background:#1d6b43}.hmi-op-stop{background:#6f2528}.hmi-op-estop{background:#8f2024}
      @media(max-width:760px){#panel-hmi{top:10px;transform:translateX(-50%);max-height:calc(100vh - 20px)}}
      #hmi-root.hmi-collapsed #panel-left,
      #hmi-root.hmi-collapsed #panel-right{display:none!important}
      #hmi-root.hmi-collapsed #hmi-top-tools{display:none}
      #hmi-root.hmi-collapsed #hmi-topbar{
        pointer-events:none;background:transparent;border:0
      }
      #hmi-root.hmi-collapsed .hmi-brand,
      #hmi-root.hmi-collapsed .hmi-top-right{display:none}
      #hmi-root.hmi-panel-open #hmi-topbar{pointer-events:auto}
      #hmi-root.hmi-panel-open #hmi-bottombar{pointer-events:auto}
      #hmi-root .hmi-panel{max-height:calc(100vh - 145px);overflow:auto}

      @media(max-width:760px){
        #op-info{left:8px;top:auto;bottom:154px;transform:none}
        #op-controls{right:8px;top:auto;bottom:154px;transform:none}
        #op-hmi{right:8px;top:8px}
        #op-hmi-panel{top:8px;transform:translateX(-50%);max-height:calc(100vh - 16px)}
        #op-info:hover,#op-controls:hover{transform:scale(1.04)}
        #hmi-root.hmi-panel-open #panel-left,
        #hmi-root.hmi-panel-open #panel-right{
          position:fixed;left:8px;right:8px;width:auto;max-width:none;
          top:58px;bottom:145px;max-height:none;z-index:11000
        }
        #hmi-bottombar{
          padding:7px!important;gap:6px!important;flex-wrap:wrap!important
        }
        .bottom-telemetry-cluster{display:none!important}
        .bottom-mode-cluster,.bottom-cycle-controls{min-width:0!important}
        .mode-btn,.btn-cycle{min-height:42px!important;padding:8px 10px!important;font-size:10px!important}
      }
      @media(pointer:coarse){
        .mode-btn,.btn-cycle,.top-btn,.cfg-pill,.btn-action-primary,.param-range,
        .op-hmi-icon{min-height:44px}
      }
    `;
    document.head.appendChild(style);
  }

  buildDock() {
    const dock = document.createElement('div');
    dock.id = 'operative-hmi-dock';
    dock.innerHTML = `
      <button class="op-hmi-icon" id="op-info" title="Open left instructions">☰</button>
      <button class="op-hmi-icon" id="op-controls" title="Open right controls">☷</button>
      <button class="op-hmi-icon" id="op-hmi" title="Open physical HMI operator screen">▣</button>
      <section id="op-hmi-panel" hidden aria-label="Operative HMI">
        <div class="op-hmi-head"><span>HMI MACHINE CONTROL</span><button class="op-hmi-close" id="op-hmi-close" title="Close HMI">×</button></div>
        <div class="op-hmi-body">
          <div class="op-hmi-status"><span>STATUS</span><strong id="op-hmi-state">READY</strong></div>
          <div class="op-hmi-actions">
            <button class="op-hmi-action start" id="op-hmi-start">START</button>
            <button class="op-hmi-action stop" id="op-hmi-stop">STOP / PAUSE</button>
            <button class="op-hmi-action" id="op-hmi-reset">RESET</button>
            <button class="op-hmi-action estop" id="op-hmi-estop">E-STOP</button>
          </div>
          <div class="op-hmi-status"><span>MODE</span><strong id="op-hmi-mode">AUTO</strong></div>
        </div>
      </section>
    `;
    document.body.appendChild(dock);

    document.getElementById('op-info').addEventListener('click',()=>this.openPanel('left'));
    document.getElementById('op-controls').addEventListener('click',()=>this.openPanel('right'));
    document.getElementById('op-hmi').addEventListener('click',()=>this.toggleHMI());

    document.getElementById('hmi-root')?.classList.add('hmi-collapsed');
  }

  openPanel(side) {
    const root=document.getElementById('hmi-root');
    if(!root) return;
    root.classList.remove('hmi-collapsed');
    root.classList.add('hmi-panel-open');

    const left=document.getElementById('panel-left');
    const right=document.getElementById('panel-right');
    if(left) left.style.display = side === 'left' ? 'block' : 'none';
    if(right) right.style.display = side === 'right' ? 'block' : 'none';
    const hmiPanel=document.getElementById('op-hmi-panel');
    if(hmiPanel) hmiPanel.hidden=true;
    root.classList.remove('hmi-hmi-open');

    document.getElementById('op-info')?.classList.toggle('active', side === 'left');
    document.getElementById('op-controls')?.classList.toggle('active', side === 'right');
  }

  openHMIOverlay() {
    const root=document.getElementById('hmi-root');
    if(root){ root.classList.remove('hmi-collapsed','hmi-panel-open'); root.classList.add('hmi-hmi-open'); }
    const left=document.getElementById('panel-left');
    const right=document.getElementById('panel-right');
    if(left) left.style.display='none';
    if(right) right.style.display='none';
    const hmi=document.getElementById('panel-hmi');
    if(hmi) hmi.style.display='none';
    const panel=document.getElementById('op-hmi-panel');
    if(panel) panel.hidden=false;
    document.getElementById('op-info')?.classList.remove('active');
    document.getElementById('op-controls')?.classList.remove('active');
  }

  closeHMI() {
    const root=document.getElementById('hmi-root');
    if(root) root.classList.add('hmi-collapsed');
    root.classList.remove('hmi-hmi-open');
    root.classList.remove('hmi-hmi-open');
    const hmi=document.getElementById('panel-hmi');
    if(hmi) hmi.style.display='';
    const panel=document.getElementById('op-hmi-panel');
    if(panel) panel.hidden=true;
    this.open=false;
    document.getElementById('op-hmi')?.classList.remove('active');
  }

  closeSidePanel(side) {
    const root=document.getElementById('hmi-root');
    const panelId=side==='left'?'panel-left':'panel-right';
    const iconId=side==='left'?'op-info':'op-controls';
    document.getElementById(panelId)?.style.setProperty('display','none');
    document.getElementById(iconId)?.classList.remove('active');
    const other=side==='left'?'panel-right':'panel-left';
    if(root) root.classList.remove('hmi-panel-open');
    // Keep the other panel closed/open state untouched; its icon controls it independently.
    if(document.getElementById(other)?.style.display==='block' && root) root.classList.add('hmi-panel-open');
  }

  updateHMIState(){
    const sim=this.app.sim;
    const state=document.getElementById('op-hmi-state');
    const mode=document.getElementById('op-hmi-mode');
    if(state) state.textContent=sim?.isEStopped?'E-STOP':(sim?.isPaused?'PAUSED':(sim?.state||'READY'));
    if(mode) mode.textContent=sim?.recipeManager?.mode||'AUTO';
  }

  closePanels() {
    const root=document.getElementById('hmi-root');
    if(!root) return;
    root.classList.add('hmi-collapsed');
    root.classList.remove('hmi-panel-open');

    const left=document.getElementById('panel-left');
    const right=document.getElementById('panel-right');
    const hmi=document.getElementById('panel-hmi');
    if(left) left.style.display='';
    if(right) right.style.display='';
    if(hmi) hmi.style.display='';

    document.getElementById('op-info')?.classList.remove('active');
    document.getElementById('op-controls')?.classList.remove('active');
  }

  toggleHMI() {
    this.open=!this.open;
    const button=document.getElementById('op-hmi');
    const panel=document.getElementById('op-hmi-panel');

    if(this.open) {
      this.openHMIOverlay();
      if(panel) panel.hidden=false;
      this.hmi.showComponentContext({
        name:'Industrial HMI Touchscreen Operator Console',
        category:'HMI',
        action:'OPEN_HMI',
        description:'Operative touchscreen control surface. AUTO, MANUAL, recipe parameters, START, STOP, RESET and E-STOP directly command the digital twin.'
      });
      button?.classList.add('active');
    } else {
      this.closeHMI();
      button?.classList.remove('active');
    }
  }

  bindPhysicalHMI() {
    const original=this.app.hmi.showComponentContext.bind(this.app.hmi);
    this.app.hmi.showComponentContext=(data)=>{
      original(data);
      if(data?.category==='HMI'){
        this.open=true;
        this.openHMIOverlay();
        document.getElementById('op-hmi')?.classList.add('active');
      }
    };
  }

  bindPanelState() {
    document.getElementById('op-hmi-start')?.addEventListener('click',()=>this.app.simEngine?.start());
    document.getElementById('op-hmi-stop')?.addEventListener('click',()=>this.app.simEngine?.pause?.());
    document.getElementById('op-hmi-reset')?.addEventListener('click',()=>this.app.simEngine?.reset());
    document.getElementById('op-hmi-estop')?.addEventListener('click',()=>this.app.simEngine?.triggerEStop());
    document.getElementById('btn-close-left')?.addEventListener('click',()=>this.closeSidePanel('left'));
    document.getElementById('btn-close-right')?.addEventListener('click',()=>this.closeSidePanel('right'));
    document.getElementById('op-hmi-close')?.addEventListener('click',()=>this.closeHMI());
    document.getElementById('op-hmi-start')?.addEventListener('click',()=>{ this.app.sim.start(); this.updateHMIState(); });
    document.getElementById('op-hmi-stop')?.addEventListener('click',()=>{ this.app.sim.pause(); this.updateHMIState(); });
    document.getElementById('op-hmi-reset')?.addEventListener('click',()=>{ this.app.sim.reset(); this.updateHMIState(); });
    document.getElementById('op-hmi-estop')?.addEventListener('click',()=>{ this.app.sim.triggerEStop(); this.updateHMIState(); });
  }
}
