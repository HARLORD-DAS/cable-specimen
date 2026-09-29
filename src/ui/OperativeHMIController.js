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
    this.lastScreenState = '';
    this.screen = app.plcCabinet?.hmiScreen || null;
    this.screenCanvas = app.plcCabinet?.hmiCanvas || null;
    this.screenTexture = app.plcCabinet?.hmiTexture || null;
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
      #op-info:hover,#op-controls:hover{transform:translateY(-50%) scale(1.04)}

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
    `;
    document.body.appendChild(dock);

    document.getElementById('op-info').addEventListener('click',()=>this.openPanel('left'));
    document.getElementById('op-controls').addEventListener('click',()=>this.openPanel('right'));
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

  drawPhysicalScreen() {
    if(!this.screenCanvas || !this.screenTexture) return;
    const ctx=this.screenCanvas.getContext('2d');
    ctx.fillStyle='#111315'; ctx.fillRect(0,0,640,400);
    ctx.fillStyle='#202427'; ctx.fillRect(0,0,640,62);
    ctx.fillStyle='#f2a900'; ctx.fillRect(0,58,640,4);
    ctx.font='700 25px Arial'; ctx.fillStyle='#f4f5f6'; ctx.fillText('CABLE SPECIMEN SYSTEM',22,38);
    const sim=this.app.sim;
    const state=sim?.isEStopped?'E-STOP':(sim?.isPaused?'PAUSED':(sim?.state||'READY'));
    const mode=sim?.recipeManager?.mode||'AUTO';
    ctx.font='700 18px Arial'; ctx.fillStyle=sim?.isEStopped?'#e5484d':'#35b86b'; ctx.fillText(state,24,94);
    ctx.font='600 15px Arial'; ctx.fillStyle='#b9bec2'; ctx.fillText('MODE',24,120); ctx.fillStyle='#f4f5f6'; ctx.fillText(mode,82,120);
    const buttons=[{x:20,w:140,label:'START',fill:'#1d6b43'},{x:170,w:140,label:'STOP',fill:'#6f2528'},{x:320,w:140,label:'RESET',fill:'#30353a'},{x:470,w:150,label:'E-STOP',fill:'#8f2024'}];
    buttons.forEach(b=>{ctx.fillStyle=b.fill;ctx.fillRect(b.x,145,b.w,72);ctx.strokeStyle='#697077';ctx.lineWidth=2;ctx.strokeRect(b.x,145,b.w,72);ctx.fillStyle='#fff';ctx.font='800 18px Arial';ctx.textAlign='center';ctx.fillText(b.label,b.x+b.w/2,188);});
    ctx.textAlign='left'; ctx.fillStyle='#202427';ctx.fillRect(20,238,600,140);ctx.fillStyle='#9fa6ab';ctx.font='600 14px Arial';ctx.fillText('LIVE OPERATOR SCREEN',34,265);ctx.fillStyle='#e8eaec';ctx.font='600 16px Arial';ctx.fillText('Touch the controls directly on the machine HMI.',34,296);ctx.fillText('The 3D machine responds to each command.',34,324);ctx.fillStyle='#f2a900';ctx.font='700 14px Arial';ctx.fillText('CONCEPT SIMULATION / DIGITAL TWIN',34,356);
    this.screenTexture.needsUpdate=true;
  }

  handlePhysicalTouch(uv) {
    if(!uv) return true;
    const x=uv.x*640, y=(1-uv.y)*400;
    if(y>=145 && y<=217){
      if(x>=20&&x<=160) this.app.sim.start();
      else if(x>=170&&x<=310) this.app.sim.pause();
      else if(x>=320&&x<=460) this.app.sim.reset();
      else if(x>=470&&x<=620) this.app.sim.triggerEStop();
      this.lastScreenState='';
      this.drawPhysicalScreen();
    }
    return true;
  }

  update() {
    if(!this.screenCanvas || !this.screenTexture) return;
    const sim=this.app.sim;
    const state=sim?.isEStopped?'E-STOP':(sim?.isPaused?'PAUSED':(sim?.state||'READY'));
    const mode=sim?.recipeManager?.mode||'AUTO';
    const sig=state+'|'+mode;
    if(sig!==this.lastScreenState){this.lastScreenState=sig;this.drawPhysicalScreen();}
  }

  bindPhysicalHMI() {
    // The physical 3D HMI screen is the only HMI operator surface.
    // Component selection must never open a floating HMI window.
  }

  bindPanelState() {
    document.getElementById('btn-close-left')?.addEventListener('click',()=>this.closeSidePanel('left'));
    document.getElementById('btn-close-right')?.addEventListener('click',()=>this.closeSidePanel('right'));
  }
}
