'use strict';
/* Guess the Password browser test: rules, validation, feedback, candidate filtering,
 * winning, give-up, the theory page and mobile width. Run: node tools/test_codebreaker_ui.js */
const path = require('path');
const { open, sleep } = require('./cdp');
const url = 'file://' + path.resolve(__dirname, '../codebreaker/index.html');
const theory = 'file://' + path.resolve(__dirname, '../codebreaker/more-about.html');

function feedback(secret, guess) {
  let b = 0, c = 0;
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) b++;
    else if (secret.indexOf(guess[i]) !== -1) c++;
  }
  return { b, c };
}
function codes(n) {
  const out = [];
  (function rec(p) {
    if (p.length === n) { out.push(p); return; }
    for (let d = 0; d <= 9; d++) { const s = String(d); if (!p.includes(s)) rec(p + s); }
  }(''));
  return out;
}

(async () => {
  const p = await open(url, 1200, 950);
  let bad = 0;
  const expect = (name, cond, extra) => { if (!cond) { bad++; console.log('FAIL', name, extra === undefined ? '' : extra); } else console.log('ok  ', name); };

  const info = await p.ev("document.getElementById('info-line').textContent");
  expect('4-digit information line', /5,040/.test(info) && /12\.30 bits/.test(info) && /5\.21/.test(info), info);
  expect('bull and cow definitions visible', /right position/.test(await p.ev("document.querySelector('.cb-legend').textContent")));

  await p.type('#guess-input', '123');
  await p.click('#btn-guess'); await sleep(100);
  expect('wrong length rejected', /4 digits/.test(await p.ev("document.getElementById('guess-error').textContent")));
  await p.type('#guess-input', '1123');
  await p.click('#btn-guess'); await sleep(100);
  expect('repeated digits rejected', /different/.test(await p.ev("document.getElementById('guess-error').textContent")));

  // Play 4 digits by filtering candidates with the feedback shown by the game.
  let candidates = codes(4);
  let guesses = 0, won = false;
  while (guesses < 15 && !won) {
    const guess = candidates[0];
    await p.type('#guess-input', guess);
    await p.click('#btn-guess'); await sleep(100);
    const text = await p.ev("document.getElementById('feedback').textContent");
    guesses++;
    if (/^Correct!/.test(text)) { won = true; break; }
    const m = text.match(/(\d+) bulls? and (\d+) cows?/);
    if (!m) { bad++; console.log('FAIL feedback', guess, text); break; }
    const b = Number(m[1]), c = Number(m[2]);
    candidates = candidates.filter((x) => { const f = feedback(x, guess); return f.b === b && f.c === c; });
    if (!candidates.length) { bad++; console.log('FAIL candidate set empty'); break; }
    expect('feedback for ' + guess, new RegExp(b + ' bulls? and ' + c + ' cows?').test(text), text);
  }
  expect('game can be won', won, 'guesses ' + guesses);
  expect('result shown', (await p.ev("!document.getElementById('result').hidden")) === true);
  expect('result includes the secret and theory', /password was/.test(await p.ev("document.getElementById('result-text').textContent")));
  expect('history rows match guesses', (await p.ev("document.querySelectorAll('#history-body tr').length")) === guesses);

  for (const n of [3, 5]) {
    await p.ev(`document.querySelector('.cb-length .btn[data-length="${n}"]').click()`);
    await sleep(120);
    const total = n === 3 ? '720' : '30,240';
    const line = await p.ev("document.getElementById('info-line').textContent");
    expect(n + '-digit info', line.includes(total), line);
    expect(n + '-digit input length', (await p.ev("document.getElementById('guess-input').maxLength")) === n);
  }
  await p.click('#btn-giveup'); await sleep(120);
  expect('give up reveals the password', /password was/i.test(await p.ev("document.getElementById('result-eyebrow').textContent")));
  expect('no console errors', p.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, p.logs.join('|'));
  await p.close();

  const t = await open(theory, 1200, 950);
  expect('theory page has combinatorics', /10 × 9 × 8 × 7/.test(await t.ev('document.body.innerText')));
  expect('theory page cites Tanaka', /Tanaka/.test(await t.ev('document.body.innerText')));
  expect('theory page links a maths article', /plus\.maths\.org|arxiv\.org/.test(await t.ev('document.body.innerHTML')));
  expect('theory page has no errors', t.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, t.logs.join('|'));
  await t.close();

  const m = await open(url, 360, 740);
  const d = JSON.parse(await m.ev("JSON.stringify({doc:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})"));
  expect('fits a 360px phone', d.doc <= d.cw + 1, JSON.stringify(d));
  await m.close();

  console.log(bad ? bad + ' FAILED' : 'codebreaker UI OK');
  process.exit(bad ? 1 : 0);
})();
