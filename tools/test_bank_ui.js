'use strict';
/* Browser test for adding questions from every practice-bank topic and level.
 * Run: node tools/test_bank_ui.js */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { open, sleep } = require('./cdp');

const PORT = 9200 + Math.floor(Math.random() * 300);
const BASE = 'http://127.0.0.1:' + PORT;
const PW = 'Mirija04';
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-bank-'));

async function login(page) {
  await page.type('#password', PW);
  await page.click('#submit');
  await page.sleep(700);
}

(async () => {
  const srv = spawn('python3', [path.resolve(__dirname, '../server.py'), '--port', String(PORT), '--no-browser', '--data', data, '--teacher-password', PW], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(BASE + '/api/exams'); break; } catch (e) { await sleep(150); } }

  let bad = 0;
  const expect = (name, cond, extra) => { if (!cond) { bad++; console.log('FAIL', name, extra === undefined ? '' : extra); } else console.log('ok  ', name); };

  const t = await open(BASE + '/exam/builder.html', 1300, 900);
  await login(t);
  await t.click('#btn-new');
  await t.click('#mode-mcq');
  await t.click('#add-bank');
  await t.sleep(300);

  const topicNames = await t.ev('JSON.stringify([...document.querySelectorAll("#bank-topic option")].map(o=>o.textContent))');
  expect('bank lists all eight subjects', JSON.parse(topicNames).length === 8, topicNames);
  expect('bank includes Mathematics', /Mathematics/.test(topicNames));
  expect('bank includes Chemistry', /Chemistry/.test(topicNames));

  await t.ev('(()=>{const s=document.getElementById("bank-topic");s.value="maths";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await t.sleep(250);
  const levels = await t.ev('document.querySelectorAll("#bank-level option").length');
  expect('maths bank has All levels plus 11 levels', levels === 12, levels);
  expect('maths level 1 has questions', (await t.ev('document.querySelectorAll("#bank-list .bank-item").length')) > 0);

  await t.ev('(()=>{const s=document.getElementById("bank-level");s.value="1";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await t.sleep(200);
  await t.ev('document.querySelector("#bank-list .bank-item input").click()');
  await t.click('#bank-add');
  await t.sleep(300);
  expect('selected question added to the exam', (await t.ev('document.querySelectorAll("#items .item").length')) === 2);
  const added = await t.ev('document.querySelector("#items .item:nth-child(2) textarea").value');
  expect('added question has text and options', !!added && (await t.ev('document.querySelectorAll("#items .item:nth-child(2) .opt-row").length')) === 4, added);
  expect('bank errors', t.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, t.logs.join('|'));

  await t.shot('/tmp/opencode/bank-ui.png', 1300, 900);
  await t.close();
  srv.kill();
  fs.rmSync(data, { recursive: true, force: true });
  console.log(bad ? bad + ' FAILED' : 'bank UI OK');
  process.exit(bad ? 1 : 0);
})();
