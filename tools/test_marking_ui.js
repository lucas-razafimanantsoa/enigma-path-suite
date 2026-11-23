'use strict';
/* End-to-end browser test for mixed exams, manual marking and the printable report.
 * Run: node tools/test_marking_ui.js */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { open, sleep } = require('./cdp');

const PORT = 8800 + Math.floor(Math.random() * 400);
const BASE = 'http://127.0.0.1:' + PORT;
const PW = 'Mirija04';
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-marking-'));
let cookie = '';

async function teacherApi(pathname, options) {
  options = options || {};
  options.headers = Object.assign({}, options.headers, { Cookie: cookie });
  return fetch(BASE + pathname, options);
}

async function login(page) {
  await page.type('#password', PW);
  await page.click('#submit');
  await page.sleep(700);
}

(async () => {
  const srv = spawn('python3', [path.resolve(__dirname, '../server.py'), '--port', String(PORT), '--no-browser', '--data', data, '--teacher-password', PW], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(BASE + '/api/exams'); break; } catch (e) { await sleep(150); } }
  const loginRes = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: PW }) });
  cookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

  let bad = 0;
  const expect = (name, cond, extra) => { if (!cond) { bad++; console.log('FAIL', name, extra === undefined ? '' : extra); } else console.log('ok  ', name); };

  /* ---------------- build a mixed exam ---------------- */
  const t = await open(BASE + '/exam/builder.html', 1300, 1000);
  await login(t);
  expect('builder opens after login', /builder\.html/.test(await t.ev('location.href')), await t.ev('location.href'));
  await t.click('#btn-new');
  expect('mode chooser opens', (await t.ev('!document.getElementById("mode-modal").hidden')) === true);
  await t.click('#mode-mixed');
  expect('mixed editor shows open-ended button', (await t.ev('!document.getElementById("add-open").hidden')) === true);
  await t.type('#ex-title', 'Mixed E2E test');
  await t.type('#ex-subject', 'ICT');
  await t.type('#items .item:nth-child(1) textarea', 'What is 2 + 2?');
  const opts = ['3', '4', '5', '22'];
  for (let i = 0; i < 4; i++) await t.type('#items .item:nth-child(1) .opt-row:nth-child(' + (i + 1) + ') input[type=text]', opts[i]);
  await t.click('#items .item:nth-child(1) .opt-row:nth-child(2) input[type=radio]');
  await t.click('#add-open');
  await t.type('#items .item:nth-child(2) .q-edit textarea', 'Explain why networks are useful.');
  await t.type('#items .item:nth-child(2) .q-edit input[type=number]', '5');
  await t.type('#items .item:nth-child(2) .q-edit textarea.open-answer-key', 'Devices share files and messages.');
  expect('open question card appears', (await t.ev('document.querySelectorAll("#items .open-card").length')) === 1);
  await t.click('#btn-save');
  await t.sleep(600);
  expect('mixed exam saved', /Saved/.test(await t.ev('document.getElementById("save-msg").textContent')), await t.ev('document.getElementById("save-msg").textContent'));
  expect('builder errors', t.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, t.logs.join('|'));
  const exams = await (await teacherApi('/api/exams')).json();
  expect('server stores mixed mode and points', exams.exams.length === 1 && exams.exams[0].mode === 'mixed' && exams.exams[0].points === 6, JSON.stringify(exams));
  const examId = exams.exams[0].id;

  await t.goto(BASE + '/exam/paper.html?id=' + encodeURIComponent(examId));
  await t.sleep(600);
  const paperText = await t.ev('document.getElementById("paper-page").textContent');
  expect('answered exam shows every question and answer',
    /Answered exam/.test(paperText) && /What is 2 \+ 2\?/.test(paperText) &&
    /Correct answer/.test(paperText) && /Explain why networks are useful\./.test(paperText) &&
    /Answer key/.test(paperText) && /Devices share files and messages\./.test(paperText), paperText.slice(0, 600));
  expect('answered exam has both question cards', (await t.ev('document.querySelectorAll(".paper-question").length')) === 2);
  await t.shot('/tmp/opencode/answered-exam.png', 1100, 1400);
  expect('answered exam errors', t.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, t.logs.join('|'));
  await t.close();

  /* ---------------- student takes it ---------------- */
  const s = await open(BASE + '/exam/index.html', 1200, 900);
  await s.ev('document.getElementById("student-name").value="Mary Jackson";document.getElementById("student-name").dispatchEvent(new Event("input",{bubbles:true}))');
  await s.ev('document.getElementById("student-grade").value="9"');
  await s.click('#start-btn');
  expect('mixed exam starts', (await s.ev('!document.getElementById("screen-question").hidden')) === true);
  let openSeen = false;
  for (let i = 0; i < 2; i++) {
    const isOpen = await s.ev('!document.getElementById("q-open").hidden');
    if (isOpen) {
      openSeen = true;
      await s.type('#q-response', 'Computers can share files and communicate.');
    } else {
      const text = await s.ev('document.getElementById("q-text").textContent');
      expect('mcq text visible', /2 \+ 2/.test(text), text);
      const idx = await s.ev('([...document.querySelectorAll("#q-options .option")].findIndex(o=>o.textContent.includes("4")))');
      await s.click('#q-options .option:nth-child(' + (idx + 1) + ')');
    }
    await s.click('#btn-next');
    await s.sleep(150);
  }
  expect('open answer box seen', openSeen === true);
  await s.click('#ov-submit');
  await s.sleep(600);
  expect('student submitted', (await s.ev('!document.getElementById("screen-result").hidden')) === true);
  expect('student errors', s.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, s.logs.join('|'));
  await s.close();

  const results = await (await teacherApi('/api/results?exam=' + encodeURIComponent(examId))).json();
  expect('mixed result is stored', results.results.length === 1 && results.results[0].status === 'pending', JSON.stringify(results));
  const result = results.results[0];

  /* ---------------- mark the open question ---------------- */
  const m = await open(BASE + '/exam/marking.html', 1300, 1000);
  await login(m);
  await m.sleep(500);
  expect('marking page lists the pending attempt', /Mary Jackson/.test(await m.ev('document.getElementById("marking-body").textContent')));
  expect('marking page shows pending status', /Pending/.test(await m.ev('document.getElementById("marking-body").textContent')));
  await m.click('#marking-body tr.row');
  await m.sleep(500);
  expect('marking panel opens', (await m.ev('!document.getElementById("mark-panel").hidden')) === true);
  expect('one open question is shown', (await m.ev('document.querySelectorAll("#m-open-list .open-question").length')) === 1);
  await m.shot('/tmp/opencode/marking-page.png', 1300, 1400);
  await m.ev('(()=>{const i=document.querySelector("#m-open-list .mark-controls input");i.value="3.5";i.dispatchEvent(new Event("input",{bubbles:true}));const c=document.querySelector("#m-open-list .comment-field textarea");c.value="Good explanation.";c.dispatchEvent(new Event("input",{bubbles:true}));document.getElementById("m-general").value="Keep practising.";})()');
  await m.click('#m-save');
  await m.sleep(800);
  expect('marks saved message', /Marks saved/.test(await m.ev('document.getElementById("m-msg").textContent')), await m.ev('document.getElementById("m-msg").textContent'));
  expect('print link appears', (await m.ev('!document.getElementById("m-print").hidden')) === true);
  expect('list shows marked status', /Marked/.test(await m.ev('document.getElementById("marking-body").textContent')));
  expect('marking errors', m.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, m.logs.join('|'));

  /* ---------------- printable A4 report ---------------- */
  await m.goto(BASE + '/exam/report.html?id=' + encodeURIComponent(result.id));
  await m.sleep(600);
  const reportText = await m.ev('document.getElementById("report-page").textContent');
  expect('report shows the header', /Examination Result/.test(reportText) && /Mary Jackson/.test(reportText) && /ICT/.test(reportText), reportText.slice(0, 400));
  expect('report shows score, symbol and signature', /4\.5 \/ 6/.test(reportText) && /C/.test(reportText) && /Parent's signature/.test(reportText), reportText);
  expect('report shows the marking scheme', /Marking scheme/.test(reportText) && /Open-ended/.test(reportText) && /3\.5/.test(reportText), reportText);
  expect('report shows every question with student and correct answers',
    /Questions and answers/.test(reportText) && /What is 2 \+ 2\?/.test(reportText) &&
    /Student answer/.test(reportText) && /Correct answer/.test(reportText) && /Answer key/.test(reportText) &&
    /Devices share files and messages\./.test(reportText), reportText);
  expect('report shows comments', /Good explanation/.test(reportText) && /Keep practising/.test(reportText), reportText);
  const pdf = await m.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  const pdfBytes = Buffer.from(pdf.result.data, 'base64');
  fs.writeFileSync('/tmp/opencode/enigmaph-path-marked-test.pdf', pdfBytes);
  expect('browser print-to-PDF produces a PDF', pdfBytes.length > 1000 && pdfBytes.slice(0, 4).toString() === '%PDF', pdfBytes.length);
  expect('report errors', m.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, m.logs.join('|'));

  /* ---------------- clear exam history ---------------- */
  await m.goto(BASE + '/exam/results.html');
  await m.sleep(500);
  expect('results page shows saved history', /Mary Jackson/.test(await m.ev('document.getElementById("results-body").textContent')));
  await m.ev('window.confirm = () => true');
  await m.click('#btn-clear-history');
  await m.sleep(800);
  expect('clear history message shown', /Exam history cleared/.test(await m.ev('document.getElementById("toast").textContent')), await m.ev('document.getElementById("toast").textContent'));
  expect('results page is empty after clearing', /No results match/.test(await m.ev('document.getElementById("empty-msg").textContent')));
  const cleared = await (await teacherApi('/api/results')).json();
  expect('server history is empty after clearing', cleared.results.length === 0, JSON.stringify(cleared));
  expect('results page errors', m.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, m.logs.join('|'));
  await m.close();

  srv.kill();
  fs.rmSync(data, { recursive: true, force: true });
  console.log(bad ? bad + ' FAILED' : 'marking e2e OK');
  process.exit(bad ? 1 : 0);
})();
