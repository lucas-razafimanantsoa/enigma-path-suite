/* Tiny headless-Chromium driver for smoke tests (Chrome DevTools Protocol, no dependencies).
 *   const { open } = require('./cdp'); const p = await open(url, 1200, 800);
 *   await p.ev('document.title'); await p.click('#btn'); await p.shot('/tmp/x.png'); p.logs; await p.close();
 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let portCounter = 9400 + Math.floor(Math.random() * 400);

async function open(url, width, height) {
  const port = portCounter++;
  const ch = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=' + port,
    '--user-data-dir=/tmp/opencode/chrome-' + port, '--window-size=' + (width || 1200) + ',' + (height || 800), 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); if (targets.length) break; } catch (e) { /* wait */ }
    await sleep(200);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });
  let id = 0;
  const pending = {};
  const logs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
    else if (d.method === 'Runtime.consoleAPICalled') logs.push(d.params.type + ': ' + d.params.args.map((a) => a.value).join(' '));
    else if (d.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + JSON.stringify(d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text));
    else if (d.method === 'Log.entryAdded') logs.push('LOG ' + d.params.entry.level + ': ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
  };
  const send = (method, params) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method: method, params: params || {} })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: width || 1200, height: height || 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: url });
  await sleep(900);

  const api = {
    logs: logs,
    send: send,
    sleep: sleep,
    async ev(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) return 'ERR ' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description || r.result.exceptionDetails.text);
      return r.result.result.value;
    },
    async click(sel) {
      // Scroll instantly: the shared theme uses smooth scrolling, which would
      // otherwise leave the element's rect stale when we read it straight after.
      const pos = JSON.parse(await api.ev("(()=>{const e=document.querySelector(" + JSON.stringify(sel) + ");if(!e)return 'null';e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return JSON.stringify([r.x+r.width/2,r.y+r.height/2])})()"));
      if (!pos) throw new Error('click: no element ' + sel);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type: type, x: pos[0], y: pos[1], button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
      }
      await sleep(120);
    },
    async type(sel, text) {
      await api.ev("(()=>{const e=document.querySelector(" + JSON.stringify(sel) + ");e.focus();e.value=" + JSON.stringify(text) + ";e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    },
    async key(k) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: ({ ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, Enter: 13, Backspace: 8 })[k] || 0 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k });
      await sleep(120);
    },
    async shot(file, w, h) {
      if (w) await send('Emulation.setDeviceMetricsOverride', { width: w, height: h || height || 800, deviceScaleFactor: 1, mobile: false });
      await sleep(250);
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    },
    async goto(u) { await send('Page.navigate', { url: u }); await sleep(800); },
    async close() { try { ws.close(); } catch (e) { /* ignore */ } ch.kill(); }
  };
  return api;
}

module.exports = { open: open, sleep: sleep };
