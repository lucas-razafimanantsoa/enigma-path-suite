'use strict';
const assert = require('assert');
const X = require('../shared/exam-core.js');
const M = require('../shared/maze-lib.js');
const LEVELS = require('../shared/maze-levels.js');

let fails = 0;
const check = (name, fn) => { try { fn(); } catch (e) { fails++; console.log('FAIL', name, '-', e.message); } };
const rng = (seed) => M.rng(seed);

// ---- session building
check('blocks are shuffled, mazes stay with their questions, options are permutations', () => {
  const exam = { items: [
    { type: 'question', id: 'a', text: 'A?', options: ['1', '2', '3', '4'] },
    { type: 'maze', id: 'm1', title: 'M1', intro: '', maze: { map: LEVELS[0].map, dir: LEVELS[0].dir }, questions: [
      { id: 'm1a', text: 'x', options: ['1', '2'] }, { id: 'm1b', text: 'y', options: ['1', '2', '3'] }] },
    { type: 'question', id: 'b', text: 'B?', options: ['1', '2', '3', '4'] },
    { type: 'maze', id: 'm2', title: 'M2', intro: '', maze: { map: LEVELS[1].map, dir: LEVELS[1].dir }, questions: [
      { id: 'm2a', text: 'x', options: ['1', '2'] }] },
    { type: 'question', id: 'c', text: 'C?', options: ['1', '2', '3', '4'] }
  ] };
  const orders = new Set();
  let firstQuestionVaries = new Set();
  for (let s = 1; s <= 200; s++) {
    const pages = X.buildSession(exam, rng(s));
    assert.strictEqual(pages.length, 6);
    // maze questions adjacent and in original order
    const i1 = pages.findIndex((p) => p.qid === 'm1a');
    assert.strictEqual(pages[i1 + 1].qid, 'm1b');
    assert.ok(pages[i1].firstInBlock && !pages[i1 + 1].firstInBlock);
    assert.ok(pages[i1].maze && pages[i1 + 1].maze);
    pages.forEach((p) => {
      assert.deepStrictEqual(p.order.slice().sort(), p.order.map((_, k) => k));
    });
    orders.add(pages.map((p) => p.qid).join(','));
    firstQuestionVaries.add(pages[0].qid);
  }
  assert.ok(orders.size > 20, 'order should vary between students (got ' + orders.size + ')');
  assert.ok(firstQuestionVaries.size >= 4, 'different students should start with different questions');
});

check('correct answer lands in every position over many sessions', () => {
  const q = { id: 'q', text: 't', options: ['right', 'w1', 'w2', 'w3'] };
  const exam = { items: [{ type: 'question', id: 'q', text: 't', options: q.options }] };
  const counts = [0, 0, 0, 0];
  for (let s = 1; s <= 2000; s++) {
    const p = X.buildSession(exam, rng(s))[0];
    counts[p.options.indexOf('right')]++;
  }
  counts.forEach((c) => assert.ok(c > 400 && c < 600, 'position counts ' + counts));
});

// ---- automatic questions
LEVELS.forEach((lv) => {
  X.AUTO_KINDS.forEach((k) => {
    check('level ' + lv.id + ' ' + k.kind, () => {
      const q = X.autoQuestion(k.kind, { map: lv.map, dir: lv.dir }, rng(lv.id * 31 + 7));
      if (q.error) { assert.ok(/too|longer|many/.test(q.error), q.error); return; }
      assert.ok(q.options.length >= 3 && q.options.length <= 6);
      assert.strictEqual(new Set(q.options).size, q.options.length, 'duplicate options');
      assert.ok(q.correct >= 0 && q.correct < q.options.length);
      const maze = M.parse(lv.map, lv.dir);
      const a = M.analyze(maze);
      const answer = q.options[q.correct];
      const expect = { fewestInstructions: a.fewestInstructions, cellDistance: a.cellDistance, fewestTurns: a.fewestTurns, loops: a.loops, deadEnds: a.deadEnds, routes: a.routes, shortestPaths: a.shortestPathCount };
      if (k.kind in expect) {
        assert.strictEqual(answer, String(expect[k.kind]));
        q.options.forEach((o) => assert.ok(Number(o) >= 0));
      }
      if (k.kind === 'traceFacing' || k.kind === 'traceOutcome') {
        const prog = (q.text.match(/: ([FLR ]+)\./) || [])[1].replace(/ /g, '');
        const r = M.run(maze, prog);
        if (k.kind === 'traceFacing') { assert.ok(r.ok); assert.strictEqual(answer, X.COMPASS[r.state.d]); }
        else {
          const o = !r.ok ? 1 : r.reachedGoal ? 0 : 2;
          assert.strictEqual(q.correct, o);
        }
      }
    });
  });
});

check('numericOptions distinct and >= min', () => {
  for (let c = 0; c < 60; c++) for (let s = 0; s < 20; s++) {
    const r = X.numericOptions(c, rng(s + c), c > 0 ? 1 : 0);
    assert.strictEqual(new Set(r.options).size, 4);
    assert.strictEqual(r.options[r.correct], String(c));
    r.options.forEach((o) => assert.ok(Number(o) >= (c > 0 ? 1 : 0)));
  }
});

check('validateExam accepts a good exam and rejects bad ones', () => {
  const good = { title: 'T', items: [{ type: 'question', id: 'a', text: 'Q?', options: ['x', 'y'], correct: 1 }] };
  assert.strictEqual(X.validateExam(good), null);
  assert.ok(X.validateExam({ title: '', items: good.items }));
  assert.ok(X.validateExam({ title: 'T', items: [] }));
  assert.ok(X.validateExam({ title: 'T', items: [{ type: 'question', id: 'a', text: 'Q?', options: ['x', 'X'], correct: 0 }] }));
  assert.ok(X.validateExam({ title: 'T', items: [{ type: 'question', id: 'a', text: 'Q?', options: ['x', 'y'], correct: 5 }] }));
  const unsolvable = { title: 'T', items: [{ type: 'maze', id: 'm', title: 'x', maze: { map: ['#####', '#S#G#', '#####'], dir: 'N' }, questions: [{ id: 'q', text: 'q', options: ['a', 'b'], correct: 0 }] }] };
  assert.ok(/cannot reach/.test(X.validateExam(unsolvable)));
});

check('mixed exams, open questions, points and symbol', () => {
  const open = { type: 'open', id: 'o1', text: 'Explain?', points: 5 };
  const mcq = { type: 'question', id: 'q1', text: 'Q?', options: ['a', 'b'], correct: 0 };
  const exam = { title: 'Mixed', mode: 'mixed', subject: 'ICT', items: [mcq, open] };
  assert.strictEqual(X.validateExam(exam), null);
  assert.strictEqual(X.countQuestions(exam), 2);
  assert.strictEqual(X.examPoints(exam), 6);
  assert.ok(/only allowed in a mixed exam/.test(X.validateExam({ ...exam, mode: 'mcq' })));
  assert.ok(/points must be a whole number/.test(X.validateExam({ ...exam, items: [mcq, { ...open, points: 0 }] })));
  assert.ok(/points must be a whole number/.test(X.validateExam({ ...exam, items: [mcq, { ...open, points: 2.5 }] })));

  const pages = X.buildSession(exam, rng(1));
  const openPage = pages.filter((p) => p.qid === 'o1')[0];
  const mcqPage = pages.filter((p) => p.qid === 'q1')[0];
  assert.strictEqual(openPage.type, 'open');
  assert.strictEqual(openPage.points, 5);
  assert.deepStrictEqual(openPage.options, []);
  assert.strictEqual(mcqPage.type, 'mcq');
  assert.strictEqual(mcqPage.points, 1);

  const symbols = [[100, 'A+'], [96, 'A+'], [95.9, 'A'], [90, 'A'], [86, 'B+'], [80, 'B'],
    [76, 'C+'], [70, 'C'], [66, 'D+'], [60, 'D'], [56, 'E+'], [50, 'E'], [49.9, 'F']];
  symbols.forEach(([p, s]) => assert.strictEqual(X.symbolFor(p), s, p + ' -> ' + X.symbolFor(p)));
});

console.log(fails ? fails + ' check(s) FAILED' : 'exam-core checks passed');
process.exit(fails ? 1 : 0);
