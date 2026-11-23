/* EnigmaPath exam core: pure logic shared by the teacher builder and the student exam page
 * (and tested in Node by tools/test_exam_core.js).
 *   - session building: block order is shuffled per student, a maze always stays with its questions,
 *     and the options of every question are shuffled per student
 *   - automatic maze questions (shortest path, loops, dead ends, routes, tracing a program ...)
 *   - exam validation (mirrors server.py)
 */
(function (root, factory) {
  'use strict';
  var maze = typeof module === 'object' && module.exports ? require('./maze-lib.js') : root.EPMaze;
  var lib = factory(maze);
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.EPExam = lib;
}(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';

  function shuffle(arr, rand) {
    rand = rand || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function newId(prefix) {
    return (prefix || 'id') + Math.random().toString(36).slice(2, 8);
  }

  function slugify(text) {
    var s = String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/g, '');
    return s || 'exam';
  }

  /* --------------------------------------------------------------- session */

  /* exam = the student view of an exam (no answer key). Returns an array of pages, one per question:
   * { qid, text, options (as shown), order (original index of each shown option), maze, mazeTitle, intro, firstInBlock, blockId } */
  function buildSession(exam, rand) {
    var blocks = shuffle(exam.items, rand);
    var pages = [];
    blocks.forEach(function (item) {
      if (item.type === 'open') {
        pages.push({
          qid: item.id,
          type: 'open',
          text: item.text,
          points: item.points,
          options: [],
          order: [],
          maze: null,
          mazeTitle: null,
          intro: null,
          blockId: item.id,
          firstInBlock: true
        });
        return;
      }
      var qs = item.type === 'maze' ? item.questions : [item];
      qs.forEach(function (q, i) {
        var order = shuffle(q.options.map(function (_, k) { return k; }), rand);
        pages.push({
          qid: q.id,
          type: 'mcq',
          text: q.text,
          points: 1,
          options: order.map(function (k) { return q.options[k]; }),
          order: order,
          maze: item.type === 'maze' ? item.maze : null,
          mazeTitle: item.type === 'maze' ? item.title : null,
          intro: item.type === 'maze' ? item.intro : null,
          blockId: item.id,
          firstInBlock: i === 0
        });
      });
    });
    return pages;
  }

  /* ------------------------------------------------------ automatic questions */

  var LETTER_WORD = { F: 'Forward', L: 'Turn left', R: 'Turn right' };
  var COMPASS = ['North', 'East', 'South', 'West'];

  function numericOptions(correct, rand, min) {
    min = min === undefined ? 0 : min;
    var pool = [];
    [-3, -2, -1, 1, 2, 3, 4, 5].forEach(function (d) { if (correct + d >= min) pool.push(correct + d); });
    if (correct >= 8) { pool.push(Math.round(correct * 1.5)); pool.push(Math.round(correct * 0.75)); }
    pool = pool.filter(function (v, i) { return v !== correct && pool.indexOf(v) === i; });
    // prefer close values: sort by distance with some randomness, then take 3
    var scored = pool.map(function (v) { return { v: v, k: Math.abs(v - correct) + rand() * 2.2 }; });
    scored.sort(function (a, b) { return a.k - b.k; });
    var picks = scored.slice(0, 3).map(function (s) { return s.v; });
    var opts = picks.concat([correct]).sort(function (a, b) { return a - b; });
    return { options: opts.map(String), correct: opts.indexOf(correct) };
  }

  var KINDS = [
    { kind: 'fewestInstructions', label: 'Fewest instructions to reach the goal' },
    { kind: 'cellDistance', label: 'Length of the shortest path (squares)' },
    { kind: 'fewestTurns', label: 'Fewest turns needed' },
    { kind: 'loops', label: 'Number of loops' },
    { kind: 'deadEnds', label: 'Number of dead ends' },
    { kind: 'routes', label: 'Number of different routes' },
    { kind: 'shortestPaths', label: 'Number of different shortest paths' },
    { kind: 'traceFacing', label: 'Direction after running a program' },
    { kind: 'traceOutcome', label: 'Does this program reach the goal?' }
  ];

  var START_DIR_TEXT = function (maze) { return COMPASS[maze.dir]; };

  /* Returns { text, options, correct, auto } or { error }. */
  function autoQuestion(kind, mazeObj, rand) {
    rand = rand || Math.random;
    var maze = M.parse(mazeObj.map, mazeObj.dir);
    var a = M.analyze(maze);
    if (!a.solvable) return { error: 'The robot cannot reach the goal in this maze, so this question cannot be made.' };
    var num;
    switch (kind) {
      case 'fewestInstructions':
        num = numericOptions(a.fewestInstructions, rand, 1);
        return { text: 'The robot starts on S facing ' + START_DIR_TEXT(maze) + '. Each Forward, Turn left or Turn right is one instruction. What is the smallest number of instructions that takes the robot to the goal G?', options: num.options, correct: num.correct, auto: kind };
      case 'cellDistance':
        num = numericOptions(a.cellDistance, rand, 1);
        return { text: 'What is the length of the shortest path from S to G, counted as the number of squares the robot moves (each Forward moves one square, turning does not count)?', options: num.options, correct: num.correct, auto: kind };
      case 'fewestTurns':
        num = numericOptions(a.fewestTurns, rand, 0);
        return { text: 'The robot starts on S facing ' + START_DIR_TEXT(maze) + '. Using any route, what is the smallest number of turn instructions (Turn left or Turn right) it needs to reach G?', options: num.options, correct: num.correct, auto: kind };
      case 'loops':
        num = numericOptions(a.loops, rand, 0);
        return { text: 'A loop is a circuit of path squares that leads back to where it began without using any square twice. Each block of wall that is completely surrounded by path makes one loop. How many loops does this maze have?', options: num.options, correct: num.correct, auto: kind };
      case 'deadEnds':
        num = numericOptions(a.deadEnds, rand, 0);
        return { text: 'A dead end is a path square with only one way out. Not counting S and G, how many dead ends does this maze have?', options: num.options, correct: num.correct, auto: kind };
      case 'routes':
        if (a.routesCapped || a.routes > 40) return { error: 'This maze has too many different routes (more than 40) to ask about. Pick a smaller or less looped maze.' };
        num = numericOptions(a.routes, rand, 1);
        return { text: 'How many different routes lead from S to G if the robot may never visit the same square twice on one route?', options: num.options, correct: num.correct, auto: kind };
      case 'shortestPaths':
        if (a.shortestPathCount > 40) return { error: 'There are too many shortest paths to ask about.' };
        num = numericOptions(a.shortestPathCount, rand, 1);
        return { text: 'How many different shortest paths (same length, different squares) lead from S to G?', options: num.options, correct: num.correct, auto: kind };
      case 'traceFacing': {
        var best = a.bestProgram;
        var len = Math.min(best.length, 6 + Math.floor(rand() * 7));
        var prog = best.slice(0, len);
        if (!/[LR]/.test(prog)) prog = best.slice(0, Math.min(best.length, Math.max(len, best.search(/[LR]/) + 3)));
        var res = M.run(maze, prog);
        if (!res.ok) return { error: 'Could not build a program for this maze.' };
        return { text: 'The robot starts on S facing ' + START_DIR_TEXT(maze) + ' and runs this program (F = Forward, L = Turn left, R = Turn right): ' + prog.split('').join(' ') + '. Which direction is it facing at the end?', options: COMPASS.slice(), correct: res.state.d, auto: kind };
      }
      case 'traceOutcome': {
        if (a.bestProgram.length > 45) return { error: 'The shortest program for this maze is longer than 45 instructions, which is too long to trace by eye. Use a smaller maze.' };
        var progs = [a.bestProgram];
        for (var t = 0; t < 40; t++) {
          var arr = a.bestProgram.split('');
          var at = Math.floor(rand() * arr.length);
          var mode = Math.floor(rand() * 3);
          if (mode === 0 && arr[at] !== 'F') arr[at] = arr[at] === 'L' ? 'R' : 'L';
          else if (mode === 1) arr.splice(at, 1);
          else arr.splice(at, 0, 'F');
          progs.push(arr.join(''));
        }
        var outcomes = progs.map(function (p) {
          var r = M.run(maze, p);
          return { p: p, o: !r.ok ? 1 : r.reachedGoal ? 0 : 2 };
        }).filter(function (x) { return x.p.length > 0; });
        var wantKind = Math.floor(rand() * 3);
        var pool = outcomes.filter(function (x) { return x.o === wantKind; });
        if (!pool.length) pool = outcomes;
        var pick = pool[Math.floor(rand() * pool.length)];
        var texts = ['The robot reaches the goal.', 'The robot hits a wall before the program ends.', 'The program ends but the robot is not on the goal.'];
        return { text: 'The robot starts on S facing ' + START_DIR_TEXT(maze) + ' and runs this program (F = Forward, L = Turn left, R = Turn right): ' + pick.p.split('').join(' ') + '. What happens?', options: texts, correct: pick.o, auto: kind };
      }
      default:
        return { error: 'Unknown question type.' };
    }
  }

  /* ------------------------------------------------------------ validation */

  var TILE = /^[#.SG]+$/;

  function validateQuestion(q, where) {
    if (!q || typeof q !== 'object') return where + ': invalid question.';
    if (!String(q.text || '').trim()) return where + ': the question text is empty.';
    var opts = q.options;
    if (!Array.isArray(opts) || opts.length < 2 || opts.length > 6) return where + ': needs 2 to 6 options.';
    var seen = {};
    for (var i = 0; i < opts.length; i++) {
      var t = String(opts[i] || '').trim().toLowerCase();
      if (!t) return where + ': option ' + (i + 1) + ' is empty.';
      if (seen[t]) return where + ': two options are the same ("' + opts[i] + '").';
      seen[t] = 1;
    }
    if (!(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < opts.length)) return where + ': mark the correct answer.';
    return null;
  }

  function validateOpen(q, where) {
    if (!q || typeof q !== 'object') return where + ': invalid open-ended question.';
    if (!String(q.text || '').trim()) return where + ': the question text is empty.';
    if (!(Number.isInteger(q.points) && q.points >= 1 && q.points <= 100)) {
      return where + ': points must be a whole number from 1 to 100.';
    }
    if (typeof q.modelAnswer !== 'string' || !q.modelAnswer.trim()) {
      return where + ': provide an answer key for this open-ended question.';
    }
    if (q.modelAnswer.length > 4000) return where + ': the answer key is too long.';
    if (q.markingNotes !== undefined && q.markingNotes !== null) {
      if (typeof q.markingNotes !== 'string' || q.markingNotes.length > 4000) {
        return where + ': marking notes are too long.';
      }
    }
    return null;
  }

  function validateExam(exam) {
    if (!String(exam.title || '').trim()) return 'Give the exam a title.';
    var mode = exam.mode || 'mcq';
    if (mode !== 'mcq' && mode !== 'mixed') return 'Choose MCQ only or mixed for the exam type.';
    if (exam.subject !== undefined && (typeof exam.subject !== 'string' || exam.subject.length > 80)) {
      return 'The subject is too long.';
    }
    if (!exam.items || !exam.items.length) return 'Add at least one question.';
    var n = 0;
    for (var i = 0; i < exam.items.length; i++) {
      var it = exam.items[i];
      if (it.type === 'question') {
        n++;
        var e = validateQuestion(it, 'Question ' + n);
        if (e) return e;
      } else if (it.type === 'open') {
        if (mode !== 'mixed') return 'Open-ended questions are only allowed in a mixed exam.';
        n++;
        var eo = validateOpen(it, 'Question ' + n);
        if (eo) return eo;
      } else if (it.type === 'maze') {
        var m = it.maze;
        var label = 'Maze "' + (it.title || (i + 1)) + '"';
        if (!m || !Array.isArray(m.map)) return label + ': no maze.';
        var problems = M.check(m.map, m.dir);
        if (problems.length) return label + ': ' + problems[0];
        if (!it.questions || !it.questions.length) return label + ' needs at least one question.';
        for (var j = 0; j < it.questions.length; j++) {
          n++;
          var e2 = validateQuestion(it.questions[j], 'Question ' + n + ' (' + label + ')');
          if (e2) return e2;
        }
      } else return 'Unknown item type.';
    }
    return null;
  }

  function countQuestions(exam) {
    return exam.items.reduce(function (s, it) {
      return s + (it.type === 'maze' ? it.questions.length : 1);
    }, 0);
  }

  function examPoints(exam) {
    return exam.items.reduce(function (s, it) {
      if (it.type === 'open') return s + (Number(it.points) || 0);
      if (it.type === 'maze') return s + it.questions.length;
      return s + 1;
    }, 0);
  }

  function symbolFor(percent) {
    if (percent === null || percent === undefined || percent === '' || isNaN(Number(percent))) return '';
    var p = Number(percent);
    if (p >= 96) return 'A+';
    if (p >= 90) return 'A';
    if (p >= 86) return 'B+';
    if (p >= 80) return 'B';
    if (p >= 76) return 'C+';
    if (p >= 70) return 'C';
    if (p >= 66) return 'D+';
    if (p >= 60) return 'D';
    if (p >= 56) return 'E+';
    if (p >= 50) return 'E';
    return 'F';
  }

  return {
    shuffle: shuffle, newId: newId, slugify: slugify, buildSession: buildSession,
    autoQuestion: autoQuestion, AUTO_KINDS: KINDS, numericOptions: numericOptions,
    validateExam: validateExam, validateQuestion: validateQuestion, validateOpen: validateOpen,
    countQuestions: countQuestions, examPoints: examPoints, symbolFor: symbolFor, COMPASS: COMPASS
  };
}));
