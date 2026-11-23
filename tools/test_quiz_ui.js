'use strict';
const path = require('path');
const { open } = require('./cdp');
const url = 'file://' + path.resolve(__dirname, '../quiz/index.html');

(async () => {
  const p = await open(url, 1200, 900);
  let bad = 0;
  const expect = (name, cond, extra) => { if (!cond) { bad++; console.log('FAIL', name, extra === undefined ? '' : extra); } else console.log('ok  ', name); };
  expect('8 subject cards', (await p.ev('document.querySelectorAll(".topic-card").length')) === 8);
  expect('a disclaimer is shown', /validated by AI/i.test(await p.ev('document.body.innerText')));
  await p.ev("[...document.querySelectorAll('.topic-card')].find(b => b.textContent.includes('ICT')).click()");
  await p.sleep(250);
  expect('10 level cards for ICT', (await p.ev('document.querySelectorAll(".level-card").length')) === 10);
  expect('no grades shown on the page', !/grade/i.test(await p.ev('document.body.innerText')));
  await p.click('.level-card:nth-child(7)');
  expect('start button follows selection', /Level 7/.test(await p.ev('document.getElementById("btn-start").textContent')));
  await p.type('#count', '6');
  await p.click('#btn-start');
  expect('quiz visible', (await p.ev('!document.getElementById("screen-quiz").hidden')) === true);
  expect('4 options', (await p.ev('document.querySelectorAll(".option").length')) === 4);
  expect('no feedback before answering', (await p.ev('document.getElementById("feedback").hidden')) === true);
  await p.shot('/tmp/opencode/quiz-q.png');
  await p.key('1');
  expect('feedback after answering', (await p.ev('document.getElementById("feedback").hidden')) === false);
  expect('locked after first answer', (await p.ev('document.querySelectorAll(".option input:disabled").length')) === 4);
  await p.shot('/tmp/opencode/quiz-fb.png');
  for (let i = 0; i < 5; i++) { await p.click('#next-btn'); await p.key('2'); }
  await p.click('#next-btn');
  expect('results screen', (await p.ev('!document.getElementById("screen-results").hidden')) === true);
  console.log('     score', await p.ev('document.getElementById("score-value").textContent'));
  await p.shot('/tmp/opencode/quiz-res.png');
  await p.click('#review-btn');
  expect('review lists 6', (await p.ev('document.querySelectorAll(".review-item").length')) === 6);
  await p.click('#topics-btn');
  await p.ev("[...document.querySelectorAll('.topic-card')].find(b => b.textContent.includes('Mathematics')).click()");
  await p.sleep(250);
  expect('maths has 11 levels including A-Level', (await p.ev('document.querySelectorAll(".level-card").length')) === 11 &&
    /A-Level extension/.test(await p.ev('document.querySelectorAll(".level-card")[10].textContent')));
  expect('no console errors', p.logs.filter((l) => /EXCEPTION|error/i.test(l)).length === 0, p.logs.join('|'));
  await p.close();
  console.log(bad ? bad + ' FAILED' : 'quiz UI OK');
  process.exit(bad ? 1 : 0);
})();
