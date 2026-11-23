/* Knight's Tour — playable puzzle, with a Warnsdorff + backtracking solver for hints and the gated solution. */
(function () {
  'use strict';

  var MOVES = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  var AUTOPICK_LIMIT = 300000;
  var HINT_LIMIT = 200000;
  var SOLVE_LIMIT = 5000000;

  var board = document.getElementById('board');
  var knight = document.getElementById('knight');
  var sizeSel = document.getElementById('size');
  var btnNew = document.getElementById('btn-new');
  var btnAutopick = document.getElementById('btn-autopick');
  var btnUndo = document.getElementById('btn-undo');
  var btnRestart = document.getElementById('btn-restart');
  var btnHint = document.getElementById('btn-hint');
  var btnSolution = document.getElementById('btn-solution');
  var speed = document.getElementById('speed');
  var msg = document.getElementById('msg');
  var statMoves = document.getElementById('stat-moves');
  var statLeft = document.getElementById('stat-left');

  var n = 8;
  var squares = [];
  var path = [];             // visited squares in order; path[0] is the start
  var marks = [];            // marks[r*n+c] = step number, or -1
  var current = null;        // [row, col] where the knight stands
  var hint = null;           // [row, col] suggested by the Hint button
  var replayPath = null;     // verified tour being animated
  var replaying = false;
  var replayTimer = null;
  var solutionShown = false; // a finished replay is on the board
  var shakeSq = null;
  var shakeTimer = null;

  /* ---------- geometry and solver ---------- */
  function inside(r, c) { return r >= 0 && r < n && c >= 0 && c < n; }
  function idx(r, c) { return r * n + c; }

  function isKnightMove(ar, ac, br, bc) {
    var dr = Math.abs(ar - br), dc = Math.abs(ac - bc);
    return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
  }

  function makeMarks() {
    var m = new Array(n * n);
    for (var i = 0; i < m.length; i++) m[i] = -1;
    return m;
  }

  function onward(r, c, marked) {
    var count = 0;
    for (var i = 0; i < MOVES.length; i++) {
      var nr = r + MOVES[i][0], nc = c + MOVES[i][1];
      if (inside(nr, nc) && marked[idx(nr, nc)] === -1) count++;
    }
    return count;
  }

  // Warnsdorff ordering (fewest onward moves first) with bounded backtracking.
  function dfs(marked, out, r, c, step, limit, counter) {
    if (counter.nodes >= limit) return false;
    counter.nodes++;
    marked[idx(r, c)] = step;
    out.push([r, c]);
    if (step === n * n - 1) return true;

    var cands = [];
    for (var i = 0; i < MOVES.length; i++) {
      var nr = r + MOVES[i][0], nc = c + MOVES[i][1];
      if (inside(nr, nc) && marked[idx(nr, nc)] === -1) {
        cands.push([nr, nc, onward(nr, nc, marked)]);
      }
    }
    cands.sort(function (a, b) { return a[2] - b[2]; });
    for (var j = 0; j < cands.length; j++) {
      if (dfs(marked, out, cands[j][0], cands[j][1], step + 1, limit, counter)) return true;
      counter.bt++;
    }
    marked[idx(r, c)] = -1;
    out.pop();
    return false;
  }

  function verifyTour(tour) {
    if (!tour || tour.length !== n * n) return false;
    var seen = Object.create(null);
    for (var i = 0; i < tour.length; i++) {
      var key = tour[i][0] + ',' + tour[i][1];
      if (seen[key]) return false;
      seen[key] = true;
      if (i > 0 && !isKnightMove(tour[i - 1][0], tour[i - 1][1], tour[i][0], tour[i][1])) return false;
    }
    return true;
  }

  function solveFrom(sr, sc, limit) {
    var marked = makeMarks();
    var out = [];
    var counter = { nodes: 0, bt: 0 };
    var found = dfs(marked, out, sr, sc, 0, limit, counter);
    return { success: found && verifyTour(out), path: out, backtracks: counter.bt, nodes: counter.nodes };
  }

  // Continue the student's own prefix; returns the full verified tour on success.
  function solveContinuation(prefix, limit) {
    var marked = makeMarks();
    var i, out = [];
    for (i = 0; i < prefix.length; i++) marked[idx(prefix[i][0], prefix[i][1])] = i;
    var last = prefix[prefix.length - 1];
    var counter = { nodes: 0, bt: 0 };
    var found = dfs(marked, out, last[0], last[1], prefix.length - 1, limit, counter);
    if (!found) return { success: false, path: null, backtracks: counter.bt, nodes: counter.nodes };
    var full = prefix.concat(out.slice(1));
    return { success: verifyTour(full), path: full, backtracks: counter.bt, nodes: counter.nodes };
  }

  function searchFromAnyStart(limit) {
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var res = solveFrom(r, c, limit);
        if (res.success) { res.start = [r, c]; return res; }
      }
    }
    return null;
  }

  function legalMovesFrom(r, c) {
    var out = [];
    for (var i = 0; i < MOVES.length; i++) {
      var nr = r + MOVES[i][0], nc = c + MOVES[i][1];
      if (inside(nr, nc) && marks[idx(nr, nc)] === -1) out.push([nr, nc]);
    }
    return out;
  }

  /* ---------- board and rendering ---------- */
  function buildBoard() {
    var existing = board.querySelectorAll('.square');
    for (var i = 0; i < existing.length; i++) existing[i].remove();
    board.style.setProperty('--kt-n', String(n));
    squares = [];
    for (var r = 0; r < n; r++) {
      squares[r] = [];
      for (var c = 0; c < n; c++) {
        (function (row, col) {
          var sq = document.createElement('div');
          sq.className = 'square ' + (((row + col) % 2 === 0) ? 'square--light' : 'square--dark');
          sq.setAttribute('role', 'gridcell');
          sq.setAttribute('aria-label', 'Row ' + (row + 1) + ', column ' + (col + 1));
          sq.addEventListener('click', function () { onSquareClick(row, col); });
          board.appendChild(sq);
          squares[row][col] = sq;
        })(r, c);
      }
    }
  }

  function toggle(el, cls, on) {
    if (on) el.classList.add(cls);
    else el.classList.remove(cls);
  }

  function moveKnight(r, c, animate) {
    knight.style.transition = animate ? '' : 'none';
    knight.classList.remove('is-hidden');
    knight.style.transform = 'translate(' + (c * 100) + '%, ' + (r * 100) + '%)';
    if (!animate) {
      void knight.offsetWidth;
      knight.style.transition = '';
    }
  }

  function renderState(animate) {
    var reachable = Object.create(null);
    if (current && !replaying) {
      var opts = legalMovesFrom(current[0], current[1]);
      for (var k = 0; k < opts.length; k++) reachable[idx(opts[k][0], opts[k][1])] = true;
    }
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var sq = squares[r][c];
        var id = idx(r, c);
        var step = marks[id];
        toggle(sq, 'is-visited', step >= 0);
        toggle(sq, 'is-start', path.length > 0 && r === path[0][0] && c === path[0][1]);
        toggle(sq, 'is-current', !!current && r === current[0] && c === current[1]);
        toggle(sq, 'is-reachable', !!reachable[id]);
        toggle(sq, 'is-hint', !!hint && r === hint[0] && c === hint[1]);
        toggle(sq, 'is-shake', false);
        var badge = sq.querySelector('.sq-num');
        if (step >= 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'sq-num';
            sq.appendChild(badge);
          }
          var label = String(step + 1);
          if (badge.textContent !== label) badge.textContent = label;
        } else if (badge) {
          badge.remove();
        }
      }
    }
    if (current) moveKnight(current[0], current[1], animate);
    else knight.classList.add('is-hidden');
    setStats();
    refreshButtons();
  }

  function setStats() {
    statMoves.textContent = String(Math.max(0, path.length - 1));
    statLeft.textContent = String(n * n - path.length);
  }

  function setMessage(text, kind) {
    msg.textContent = text;
    msg.className = 'kt-msg' + (kind ? ' is-' + kind : '');
  }

  function isSolved() { return path.length === n * n; }
  function hasMoves() { return !!current && legalMovesFrom(current[0], current[1]).length > 0; }

  function refreshButtons() {
    btnUndo.disabled = replaying || path.length === 0;
    btnHint.disabled = replaying || solutionShown || !hasMoves();
    btnAutopick.disabled = replaying;
    btnRestart.disabled = replaying;
    btnSolution.disabled = replaying;
    sizeSel.disabled = replaying;
  }

  /* ---------- play ---------- */
  function shake(sq) {
    if (shakeTimer) { clearTimeout(shakeTimer); shakeTimer = null; }
    if (shakeSq) shakeSq.classList.remove('is-shake');
    sq.classList.remove('is-shake');
    void sq.offsetWidth;
    sq.classList.add('is-shake');
    shakeSq = sq;
    shakeTimer = setTimeout(function () {
      sq.classList.remove('is-shake');
      if (shakeSq === sq) shakeSq = null;
      shakeTimer = null;
    }, 380);
  }

  function cancelReplay() {
    if (replayTimer) { clearTimeout(replayTimer); replayTimer = null; }
    replaying = false;
    replayPath = null;
  }

  function resetAll(text) {
    cancelReplay();
    if (shakeTimer) { clearTimeout(shakeTimer); shakeTimer = null; }
    shakeSq = null;
    path = [];
    marks = makeMarks();
    current = null;
    hint = null;
    solutionShown = false;
    renderState(false);
    setMessage(text || 'Pick a starting square');
  }

  function statusAfterMove() {
    if (isSolved()) {
      setMessage('Well done! You completed the tour in ' + (n * n - 1) + ' moves', 'ok');
    } else if (!hasMoves()) {
      setMessage('No legal moves left — undo or restart', 'bad');
    } else {
      setMessage('Legal moves highlighted — choose one');
    }
  }

  function startAt(r, c) {
    solutionShown = false;
    path = [[r, c]];
    marks[idx(r, c)] = 0;
    current = [r, c];
    hint = null;
    renderState(false);
    statusAfterMove();
  }

  function pushCell(r, c, animate) {
    path.push([r, c]);
    marks[idx(r, c)] = path.length - 1;
    current = [r, c];
    hint = null;
    renderState(animate);
  }

  function onSquareClick(r, c) {
    if (replaying) return;
    if (solutionShown) { startAt(r, c); return; }
    if (!current) { startAt(r, c); return; }
    if (r === current[0] && c === current[1]) {
      setMessage('The knight is already on this square — choose a highlighted square.', 'bad');
      shake(squares[r][c]);
      return;
    }
    if (marks[idx(r, c)] !== -1) {
      setMessage('That square has already been visited — choose a highlighted square.', 'bad');
      shake(squares[r][c]);
      return;
    }
    if (!isKnightMove(current[0], current[1], r, c)) {
      setMessage('Not a knight move — hop two squares one way and one across.', 'bad');
      shake(squares[r][c]);
      return;
    }
    pushCell(r, c, true);
    statusAfterMove();
  }

  function onUndo() {
    if (replaying || path.length === 0) return;
    solutionShown = false;
    marks[idx(current[0], current[1])] = -1;
    path.pop();
    current = path.length ? path[path.length - 1] : null;
    hint = null;
    renderState(false);
    if (current) statusAfterMove();
    else setMessage('Pick a starting square');
  }

  function onRestart() {
    if (replaying) return;
    if (current && !solutionShown) startAt(current[0], current[1]);
    else resetAll('Pick a starting square');
  }

  function onAutopick() {
    if (replaying) return;
    resetAll();
    var res = searchFromAnyStart(AUTOPICK_LIMIT);
    var r, c;
    if (res) { r = res.start[0]; c = res.start[1]; }
    else { r = Math.floor(Math.random() * n); c = Math.floor(Math.random() * n); }
    startAt(r, c);
    if (!res) setMessage('Start picked at random — choose a highlighted square.');
  }

  function onHint() {
    if (replaying || solutionShown || !hasMoves()) return;
    var res = solveContinuation(path, HINT_LIMIT);
    if (res.success && res.path && res.path.length > path.length) {
      hint = [res.path[path.length][0], res.path[path.length][1]];
      renderState(false);
      setMessage('Hint: the pulsing square keeps a full tour possible.');
      return;
    }
    var opts = legalMovesFrom(current[0], current[1]);
    var best = opts[0], bestCount = 9;
    for (var i = 0; i < opts.length; i++) {
      var count = onward(opts[i][0], opts[i][1], marks);
      if (count < bestCount) { bestCount = count; best = opts[i]; }
    }
    hint = [best[0], best[1]];
    renderState(false);
    setMessage('Hint: try the pulsing square — it has the fewest onward hops.');
  }

  /* ---------- password-gated solution replay ---------- */
  function delayMs() { return Math.round(660 / Number(speed.value)); }

  function startReplay(res) {
    cancelReplay();
    replayPath = res.path.slice();
    replaying = true;
    solutionShown = false;
    path = [];
    marks = makeMarks();
    current = null;
    hint = null;
    board.style.setProperty('--kt-move', Math.round(delayMs() * 0.8) + 'ms');
    pushCell(replayPath[0][0], replayPath[0][1], false);
    setMessage('Replaying a verified tour — watch every hop.');
    replayTimer = setTimeout(tickReplay, delayMs());
  }

  function tickReplay() {
    replayTimer = null;
    if (!replaying || !replayPath) return;
    var next = path.length;
    if (next < replayPath.length) {
      pushCell(replayPath[next][0], replayPath[next][1], true);
      if (path.length >= replayPath.length) { finishReplay(); return; }
      replayTimer = setTimeout(tickReplay, delayMs());
    } else {
      finishReplay();
    }
  }

  function finishReplay() {
    cancelReplay();
    solutionShown = true;
    setMessage('Verified solution: ' + (n * n) + ' squares visited in ' + (n * n - 1) + ' legal knight moves.', 'ok');
    refreshButtons();
  }

  function onSolution() {
    window.EPGate.withPassword(function () {
      if (replaying) return;
      var res = null;
      if (current && !isSolved()) {
        var cont = solveContinuation(path, SOLVE_LIMIT);
        if (cont.success) res = cont;
      }
      if (!res) res = searchFromAnyStart(SOLVE_LIMIT);
      if (!res || !verifyTour(res.path)) {
        setMessage('No complete tour could be verified for this board within the search limit.', 'bad');
        return;
      }
      startReplay(res);
    });
  }

  /* ---------- wiring and init ---------- */
  sizeSel.addEventListener('change', function () {
    n = Number(sizeSel.value);
    buildBoard();
    resetAll('Pick a starting square');
  });
  btnNew.addEventListener('click', function () { resetAll('Pick a starting square'); });
  btnAutopick.addEventListener('click', onAutopick);
  btnUndo.addEventListener('click', onUndo);
  btnRestart.addEventListener('click', onRestart);
  btnHint.addEventListener('click', onHint);
  btnSolution.addEventListener('click', onSolution);
  speed.addEventListener('input', function () {
    if (replaying) board.style.setProperty('--kt-move', Math.round(delayMs() * 0.8) + 'ms');
  });

  n = Number(sizeSel.value);
  marks = makeMarks();
  buildBoard();
  resetAll('Pick a starting square');
}());
