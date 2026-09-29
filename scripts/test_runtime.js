import { spawn } from 'child_process';

async function runTest() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeArgs = [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--enable-webgl',
    '--use-gl=angle',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + process.env.TEMP + '\\chrome_test_profile_' + Date.now(),
    'http://localhost:3000/'
  ];

  console.log('Starting headless Chrome...');
  const chromeProc = spawn(chromePath, chromeArgs);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const target = tabs.find(t => t.url.includes('3000')) || tabs[0];
    if (!target) throw new Error('No target tab found');

    console.log('Connecting to target:', target.title);
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    const errors = [];
    const logs = [];

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id && pending.has(data.id)) {
        const { resolve } = pending.get(data.id);
        pending.delete(data.id);
        resolve(data.result);
      } else if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        logs.push(`[Console ${data.params.type}] ${text}`);
        if (data.params.type === 'error') {
          errors.push(`Console error: ${text}`);
        }
      } else if (data.method === 'Runtime.exceptionThrown') {
        const text = data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text;
        errors.push(`Exception: ${text}`);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    console.log('Enabling CDP...');
    await send('Runtime.enable');
    await send('Console.enable');
    await send('Page.enable');

    await new Promise(r => setTimeout(r, 3000));

    // 1. Initial State Check
    console.log('Step 1: Check initial DOM and machine state...');
    const initCheck = await send('Runtime.evaluate', {
      expression: `({
        state: document.getElementById('lbl-machine-state')?.innerText,
        encoder: document.getElementById('lbl-encoder-dist')?.innerText,
        laser: document.getElementById('lbl-laser-dia')?.innerText,
        door: document.getElementById('lbl-door-stat')?.innerText,
        startBtn: document.getElementById('btn-start-cycle')?.innerText
      })`,
      returnByValue: true
    });
    console.log('Initial State:', initCheck.result?.value);

    // 2. Start Cycle
    console.log('Step 2: Clicking START CYCLE...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-start-cycle')?.click();`
    });

    // Wait 3.5 seconds during execution
    await new Promise(r => setTimeout(r, 3500));
    const runningCheck = await send('Runtime.evaluate', {
      expression: `({
        state: document.getElementById('lbl-machine-state')?.innerText,
        encoder: document.getElementById('lbl-encoder-dist')?.innerText,
        force: document.getElementById('lbl-cut-force')?.innerText,
        cycleTime: document.getElementById('val-cycle-time')?.innerText
      })`,
      returnByValue: true
    });
    console.log('Running State (after 3.5s):', runningCheck.result?.value);

    // 3. Pause Cycle
    console.log('Step 3: Clicking PAUSE...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-pause-cycle')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));
    const pausedState = await send('Runtime.evaluate', {
      expression: `document.getElementById('lbl-machine-state')?.innerText`,
      returnByValue: true
    });
    console.log('Paused State:', pausedState.result?.value);

    // Resume
    console.log('Step 4: Resuming...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-start-cycle')?.click();`
    });
    await new Promise(r => setTimeout(r, 1000));

    // 4. Test Exploded View
    console.log('Step 5: Clicking EXPLODE...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-asm-explode')?.click();`
    });
    await new Promise(r => setTimeout(r, 1200));

    // 5. Test Assemble View
    console.log('Step 6: Clicking ASSEMBLE...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-asm-assemble')?.click();`
    });
    await new Promise(r => setTimeout(r, 1200));

    // 6. Test Transparent View Mode
    console.log('Step 7: Clicking TRANSPARENT View...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-view-transparent')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));

    // Restore Normal View
    console.log('Step 8: Clicking NORMAL View...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-view-normal')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));

    // 7. Test Cross-Section Modal
    console.log('Step 9: Opening Cross-Section Modal...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-view-cross-section')?.click();`
    });
    await new Promise(r => setTimeout(r, 800));

    const csCheck = await send('Runtime.evaluate', {
      expression: `({
        visible: !document.getElementById('cross-section-modal')?.classList.contains('hidden'),
        title: document.getElementById('cs-modal-title')?.innerText
      })`,
      returnByValue: true
    });
    console.log('Cross-Section Modal:', csCheck.result?.value);

    // Switch to Shielded tab
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-cs-shielded')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));

    // Close Modal
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-cs-close')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));

    // 8. Test Manual Mode & Slider Interactions
    console.log('Step 10: Switching to MANUAL mode and modifying sliders...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-mode-manual')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `
        const dia = document.getElementById('sl-dia');
        if (dia) {
          dia.value = '32.0';
          dia.dispatchEvent(new Event('input'));
        }
        const feed = document.getElementById('sl-feed-speed');
        if (feed) {
          feed.value = '150';
          feed.dispatchEvent(new Event('input'));
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const sliderCheck = await send('Runtime.evaluate', {
      expression: `({
        diaText: document.getElementById('val-dia')?.innerText,
        feedText: document.getElementById('val-feed-speed')?.innerText
      })`,
      returnByValue: true
    });
    console.log('Manual slider check:', sliderCheck.result?.value);

    // 9. Test 3D Click Raycast
    console.log('Step 11: Testing 3D Canvas Click Raycasting...');
    await send('Runtime.evaluate', {
      expression: `
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const evt = new MouseEvent('click', {
            clientX: rect.left + rect.width * 0.5,
            clientY: rect.top + rect.height * 0.5,
            bubbles: true
          });
          canvas.dispatchEvent(evt);
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // 10. Test E-Stop and Reset
    console.log('Step 12: Testing E-STOP button...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-estop-cycle')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));
    const estopCheck = await send('Runtime.evaluate', {
      expression: `document.getElementById('lbl-machine-state')?.innerText`,
      returnByValue: true
    });
    console.log('State after E-STOP:', estopCheck.result?.value);

    console.log('Step 13: Testing RESET button...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-reset-cycle')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));
    const resetCheck = await send('Runtime.evaluate', {
      expression: `document.getElementById('lbl-machine-state')?.innerText`,
      returnByValue: true
    });
    console.log('State after RESET:', resetCheck.result?.value);

    console.log('\n--- ALL CONSOLE LOGS ---');
    logs.forEach(l => console.log(l));

    console.log('\n--- VERIFICATION RESULT ---');
    if (errors.length === 0) {
      console.log('SUCCESS: ZERO RUNTIME ERRORS OR WARNINGS DETECTED!');
    } else {
      console.error('FAIL: Captured the following errors:');
      errors.forEach(e => console.error(e));
    }

    ws.close();
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    chromeProc.kill();
  }
}

runTest();
