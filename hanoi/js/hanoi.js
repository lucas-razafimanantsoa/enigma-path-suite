/* ==========================================================================
   Tower of Hanoi - user interface. Uses HanoiLogic (hanoi-logic.js) for all rules.
   Classic script, no modules: works when opened straight from file://.
   ========================================================================== */
(function () {
  'use strict';

  var L = window.HanoiLogic;

  // ---------------------------------------------------------------- constants
  var STORAGE_KEY = 'enigmapath.hanoi.best';
  var DEFAULT_DISCS = 3;
  var MAX_DISCS = 8;
  var DRAG_THRESHOLD = 6;     // px of pointer travel before a press becomes a drag
  var DEFAULT_MOVE_MS = 220;  // disc travel time (CSS transition)
  var DISC_STOPS = ['#4682B4', '#87CEEB', '#B0E0E6', '#E0FFFF']; // palette, dark to light

  // ---------------------------------------------------------------- DOM
  function $(id) { return document.getElementById(id); }

  var board = $('board');
  var discLayer = $('discs');
  var pegEls = [$('peg-0'), $('peg-1'), $('peg-2')];
  var statusEl = $('status');
  var els = {
    moves: $('stat-moves'),
    min: $('stat-min'),
    time: $('stat-time'),
    best: $('stat-best'),
    count: $('disc-count'),
    newGame: $('btn-new'),
    undo: $('btn-undo'),
    reset: $('btn-reset'),
    hint: $('btn-hint'),
    auto: $('btn-auto'),
    stop: $('btn-stop'),
    speed: $('speed'),
    learn: $('learn'),
    tableBody: $('moves-table-body'),
    backdrop: $('win-backdrop'),
    modal: $('win-modal'),
    winEyebrow: $('win-eyebrow'),
    winTitle: $('win-title'),
    winStars: $('win-stars'),
    winMessage: $('win-message'),
    winMoves: $('win-moves'),
    winMin: $('win-min'),
    winTime: $('win-time'),
    winRecord: $('win-record'),
    winAgain: $('win-again'),
    winNext: $('win-next'),
    winClose: $('win-close')
  };

  // ---------------------------------------------------------------- state
  var game;                 // HanoiLogic game object
  var discEls = [];         // discEls[k] = element of disc k (index 0 unused)
  var selected = null;      // peg index whose top disc is lifted, or null
  var hint = null;          // { from, to } currently highlighted, or null
  var won = false;
  var autoUsed = false;     // the computer helped in this game -> no rating or record
  var auto = { mode: 'off', timer: null }; // mode: 'off' | 'running' | 'paused'
  var startTime = null;     // Date.now() of the first move
  var finalMs = 0;
  var clock = null;         // interval id of the on-screen timer
  var drag = null;          // active pointer gesture
  var suppressClick = false;
  var lastFocus = null;
  var records = loadRecords();

  // ---------------------------------------------------------------- storage (may be unavailable)
  function loadRecords() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveRecords() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) { /* storage blocked or full: the game still works, records just are not kept */ }
  }

  // ---------------------------------------------------------------- small helpers
  function hexToRgb(hex) {
    var v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  /** Colour for disc k of n: the largest is the darkest palette tone, the smallest the lightest. */
  function discColor(k, n) {
    var t = n === 1 ? 0.5 : (n - k) / (n - 1);
    var scaled = t * (DISC_STOPS.length - 1);
    var i = Math.min(Math.floor(scaled), DISC_STOPS.length - 2);
    var f = scaled - i;
    var a = hexToRgb(DISC_STOPS[i]);
    var b = hexToRgb(DISC_STOPS[i + 1]);
    var rgb = a.map(function (c, j) { return Math.round(c + (b[j] - c) * f); });
    return 'rgb(' + rgb.join(',') + ')';
  }

  /** Width of disc k as a percentage of the whole board (a peg column is 33.33%). */
  function discWidth(k, n) {
    var frac = n === 1 ? 0.7 : 0.3 + 0.66 * (k - 1) / (n - 1);
    return (100 / 3 * frac).toFixed(2) + '%';
  }

  function humanDuration(seconds) {
    if (seconds < 60) return seconds + ' s';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ' + (seconds % 60) + ' s';
    return Math.floor(seconds / 3600) + ' h ' + Math.floor((seconds % 3600) / 60) + ' min';
  }

  function elapsedMs() {
    if (won) return finalMs;
    return startTime === null ? 0 : Date.now() - startTime;
  }

  function topDisc(peg) {
    var p = game.pegs[peg];
    return p.length ? p[p.length - 1] : null;
  }

  function isLocked() {
    return won || auto.mode !== 'off';
  }

  // ---------------------------------------------------------------- status line
  function say(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' is-' + kind : '');
  }

  function shake(elements) {
    elements.forEach(function (el) {
      if (!el) return;
      el.classList.remove('is-shake');
      void el.offsetWidth; // restart the animation
      el.classList.add('is-shake');
      setTimeout(function () { el.classList.remove('is-shake'); }, 450);
    });
  }

  function flagError(message, fromPeg, toPeg) {
    say(message, 'error');
    var targets = [];
    var top = fromPeg === null ? null : topDisc(fromPeg);
    if (top !== null) targets.push(discEls[top]);
    var target = toPeg === null ? fromPeg : toPeg;
    if (target !== null) {
      targets.push(pegEls[target]);
      pegEls[target].classList.add('is-error');
      setTimeout(function () { pegEls[target].classList.remove('is-error'); }, 450);
    }
    shake(targets);
  }

  // ---------------------------------------------------------------- timer
  function startClock() {
    if (startTime !== null) return;
    startTime = Date.now();
    clock = setInterval(updateTime, 250);
  }

  function stopClock() {
    if (clock !== null) clearInterval(clock);
    clock = null;
  }

  function updateTime() {
    els.time.textContent = L.formatTime(elapsedMs());
  }

  // ---------------------------------------------------------------- rendering
  function pegLabel(p) {
    var pile = game.pegs[p];
    var text = 'Peg ' + (p + 1) + ', ';
    if (!pile.length) {
      text += 'empty';
    } else {
      text += pile.length + (pile.length === 1 ? ' disc' : ' discs') + ', top disc size ' + pile[pile.length - 1] + ' of ' + game.n;
    }
    if (selected === p) text += ', top disc lifted';
    if (hint && hint.from === p) text += ', hint: move from here';
    if (hint && hint.to === p) text += ', hint: move to here';
    return text;
  }

  function render() {
    board.style.setProperty('--n', game.n);

    for (var p = 0; p < 3; p++) {
      var pile = game.pegs[p];
      for (var i = 0; i < pile.length; i++) {
        var el = discEls[pile[i]];
        var isTop = i === pile.length - 1;
        var lifted = isTop && selected === p;
        el.style.setProperty('--peg', p);
        el.style.setProperty('--level', lifted ? game.n + 0.9 : i);
        el.dataset.peg = p;
        el.classList.toggle('is-top', isTop);
        el.classList.toggle('is-selected', lifted);
      }

      var btn = pegEls[p];
      btn.setAttribute('aria-label', pegLabel(p));
      btn.setAttribute('aria-pressed', selected === p ? 'true' : 'false');
      btn.classList.toggle('is-held', selected === p);
      btn.classList.toggle('is-hint-from', !!hint && hint.from === p);
      btn.classList.toggle('is-hint-to', !!hint && hint.to === p);
      btn.querySelector('.peg__tag').textContent =
        hint && hint.from === p ? 'from' : hint && hint.to === p ? 'to' : '';
    }

    var moves = game.history.length;
    els.moves.textContent = moves;
    els.min.textContent = L.minMoves(game.n);
    els.best.textContent = typeof records[game.n] === 'number' ? records[game.n] : '-';
    updateTime();
    board.classList.toggle('is-locked', isLocked());
    updateControls();
  }

  function updateControls() {
    var autoOn = auto.mode !== 'off';
    els.undo.disabled = game.history.length === 0 || won || autoOn;
    els.hint.disabled = won || autoOn;
    els.auto.disabled = won;
    els.auto.textContent = auto.mode === 'running' ? 'Pause' : auto.mode === 'paused' ? 'Resume' : 'Auto-solve';
    els.stop.hidden = !autoOn;
  }

  function buildDiscs() {
    discLayer.textContent = '';
    discEls = [null];
    for (var k = 1; k <= game.n; k++) {
      var el = document.createElement('div');
      el.className = 'disc';
      el.style.setProperty('--c', discColor(k, game.n));
      el.style.width = discWidth(k, game.n);
      el.dataset.size = k;
      discLayer.appendChild(el);
      discEls.push(el);
    }
  }

  function buildTable() {
    els.tableBody.textContent = '';
    L.movesTable(MAX_DISCS).forEach(function (row) {
      var tr = document.createElement('tr');
      tr.dataset.n = row.n;
      [row.n, row.moves, humanDuration(row.moves)].forEach(function (value) {
        var td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      els.tableBody.appendChild(tr);
    });
  }

  function markTableRow() {
    var rows = els.tableBody.children;
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('is-current', +rows[i].dataset.n === game.n);
    }
  }

  // ---------------------------------------------------------------- game flow
  function newGame(n) {
    stopAuto(true);
    closeWin(true);
    stopClock();
    game = L.createGame(n);
    selected = null;
    hint = null;
    won = false;
    autoUsed = false;
    startTime = null;
    finalMs = 0;
    els.count.value = String(n);
    buildDiscs();
    markTableRow();
    render();
    say('New game with ' + n + ' discs. Move them all to peg 3 in as few moves as you can (minimum ' + L.minMoves(n) + ').');
  }

  function resetGame() {
    stopAuto(true);
    closeWin(true);
    stopClock();
    L.reset(game);
    selected = null;
    hint = null;
    won = false;
    autoUsed = false;
    startTime = null;
    finalMs = 0;
    render();
    say('Back to the start. All discs are on peg 1.');
  }

  function clearHint() {
    hint = null;
  }

  /** The one place where a move is applied (player, drag, keyboard and auto-solve all end up here). */
  function attemptMove(from, to) {
    var res = L.tryMove(game, from, to);
    if (!res.ok) {
      flagError(res.message, from, to);
      return false;
    }
    clearHint();
    selected = null;
    startClock();
    render();
    say('Moved disc ' + res.disc + ' from peg ' + (from + 1) + ' to peg ' + (to + 1) + '.');
    if (res.won) handleWin();
    return true;
  }

  function activatePeg(p) {
    if (won) {
      say('Puzzle solved! Press Reset to try again, or New game to change the number of discs.', 'ok');
      return;
    }
    if (auto.mode !== 'off') {
      say('The computer is solving the puzzle. Press Stop to take over.');
      return;
    }
    clearHint();

    if (selected === null) {
      if (!game.pegs[p].length) {
        render();
        flagError('Peg ' + (p + 1) + ' is empty - there is no disc to pick up.', null, p);
        return;
      }
      selected = p;
      render();
      say('Picked up disc ' + topDisc(p) + ' from peg ' + (p + 1) + '. Now choose a peg to drop it on.');
    } else if (selected === p) {
      selected = null;
      render();
      say('Put the disc back. Pick any top disc to continue.');
    } else {
      attemptMove(selected, p);
    }
  }

  function undoMove() {
    if (isLocked()) return;
    var last = L.undo(game);
    if (!last) return;
    selected = null;
    clearHint();
    if (!game.history.length) { // back at the start: the timer starts again on the next move
      stopClock();
      startTime = null;
    }
    render();
    say('Undid the move of disc ' + last.disc + ' (peg ' + (last.to + 1) + ' back to peg ' + (last.from + 1) + ').');
  }

  function showHint() {
    if (isLocked()) return;
    var m = L.nextMove(game.pegs);
    if (!m) return;
    selected = null;
    hint = { from: m.from, to: m.to };
    render();
    say('Hint: move disc ' + m.disc + ' from peg ' + (m.from + 1) + ' to peg ' + (m.to + 1) + '. This is the start of a shortest route from here.', 'hint');
  }

  // ---------------------------------------------------------------- auto-solve
  function stepDelay() {
    return 1300 - (Number(els.speed.value) - 1) * 130; // 1300 ms (slow) .. 130 ms (fast)
  }

  function applyMoveSpeed() {
    var ms = auto.mode === 'off' ? DEFAULT_MOVE_MS : Math.max(60, Math.min(260, Math.round(stepDelay() * 0.45)));
    board.style.setProperty('--move-ms', ms + 'ms');
  }

  function scheduleAuto(delay) {
    clearTimeout(auto.timer);
    auto.timer = setTimeout(autoStep, delay);
  }

  /** One auto-solve step: lift the disc, then (after a short beat) drop it. Recomputed every time, so it works from any state. */
  function autoStep() {
    if (auto.mode !== 'running') return;
    var m = L.nextMove(game.pegs);
    if (!m) { stopAuto(false); return; }
    selected = m.from;
    render();
    var lift = Math.max(40, Math.min(220, Math.round(stepDelay() * 0.4)));
    auto.timer = setTimeout(function () {
      if (auto.mode !== 'running') return;
      attemptMove(m.from, m.to);
      if (auto.mode === 'running' && !won) scheduleAuto(Math.max(40, stepDelay() - lift));
    }, lift);
  }

  function startAuto() {
    if (won) return;
    autoUsed = true;
    auto.mode = 'running';
    clearHint();
    selected = null;
    applyMoveSpeed();
    render();
    say('The computer is solving it from the current position. Use Pause or Stop at any time.');
    scheduleAuto(250);
  }

  function pauseAuto() {
    clearTimeout(auto.timer);
    auto.mode = 'paused';
    selected = null;
    render();
    say('Paused. Press Resume to continue, or Stop to take over yourself.');
  }

  /** Leave auto mode and give control back to the player. */
  function stopAuto(silent) {
    clearTimeout(auto.timer);
    var was = auto.mode;
    auto.mode = 'off';
    applyMoveSpeed();
    if (was === 'off') return;
    selected = null;
    if (!silent) {
      render();
      if (!won) say('You are back in control. Carry on from here!');
    }
  }

  function toggleAuto() {
    if (auto.mode === 'off') startAuto();
    else if (auto.mode === 'running') pauseAuto();
    else {
      auto.mode = 'running';
      render();
      say('Continuing...');
      scheduleAuto(150);
    }
  }

  // ---------------------------------------------------------------- winning
  function handleWin() {
    won = true;
    finalMs = Date.now() - startTime;
    stopClock();
    stopAuto(true);
    selected = null;
    render();

    var moves = game.history.length;
    var min = L.minMoves(game.n);

    if (autoUsed) {
      showWin({
        eyebrow: 'Solved by the computer',
        title: 'The computer solved it',
        message: 'Solved with the computer\'s help, so there is no rating or record this time. Try again on your own!',
        stars: null,
        record: '',
        moves: moves, min: min
      });
      say('Solved with the computer\'s help.', 'ok');
      return;
    }

    var stars = L.rating(moves, game.n);
    var upd = L.updateBest(records, game.n, moves);
    if (upd.isNew) {
      records = upd.records;
      saveRecords();
    }
    var message = stars === 3
      ? 'Perfect! You used the fewest possible moves.'
      : stars === 2
        ? 'Great job! Very close to the minimum of ' + min + ' moves.'
        : 'You solved it! Can you get closer to the minimum of ' + min + ' moves?';
    var record = upd.isNew
      ? (upd.previous === null ? 'First record for ' + game.n + ' discs!' : 'New best for ' + game.n + ' discs! (before: ' + upd.previous + ')')
      : 'Your best for ' + game.n + ' discs is ' + upd.previous + ' moves.';
    showWin({
      eyebrow: 'Puzzle solved',
      title: 'Well done!',
      message: message,
      stars: stars,
      record: record,
      moves: moves, min: min
    });
    say('Solved in ' + moves + ' moves. ' + message, 'ok');
    render();
  }

  function showWin(info) {
    els.winEyebrow.textContent = info.eyebrow;
    els.winTitle.textContent = info.title;
    els.winMessage.textContent = info.message;
    els.winMoves.textContent = info.moves;
    els.winMin.textContent = info.min;
    els.winTime.textContent = L.formatTime(finalMs);
    els.winRecord.textContent = info.record;

    els.winStars.textContent = '';
    if (info.stars === null) {
      els.winStars.hidden = true;
    } else {
      els.winStars.hidden = false;
      els.winStars.setAttribute('role', 'img');
      els.winStars.setAttribute('aria-label', info.stars + ' out of 3 stars');
      for (var s = 1; s <= 3; s++) {
        var star = document.createElement('span');
        star.textContent = '\u2605';
        if (s > info.stars) star.className = 'is-off';
        els.winStars.appendChild(star);
      }
    }

    els.winNext.hidden = game.n >= MAX_DISCS;
    els.winNext.textContent = 'Try ' + (game.n + 1) + ' discs';

    lastFocus = document.activeElement;
    els.backdrop.hidden = false;
    els.winAgain.focus();
  }

  function closeWin(skipFocus) {
    if (els.backdrop.hidden) return;
    els.backdrop.hidden = true;
    if (!skipFocus && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // ---------------------------------------------------------------- pointer: click and drag
  function pegFromPoint(x, y) {
    var r = board.getBoundingClientRect();
    if (x < r.left - 20 || x > r.right + 20 || y < r.top - 60 || y > r.bottom + 30) return -1;
    var col = Math.floor((x - r.left) / r.width * 3);
    return Math.max(0, Math.min(2, col));
  }

  function setOverPeg(p) {
    pegEls.forEach(function (el, i) { el.classList.toggle('is-over', i === p); });
  }

  board.addEventListener('click', function (e) {
    if (suppressClick) return;
    var pegEl = e.target.closest('.peg');
    var discEl = e.target.closest('.disc');
    var index = pegEl ? +pegEl.dataset.peg : discEl ? +discEl.dataset.peg : -1;
    if (index >= 0) activatePeg(index);
  });

  discLayer.addEventListener('pointerdown', function (e) {
    var disc = e.target.closest('.disc.is-top');
    if (!disc || isLocked() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { el: disc, from: +disc.dataset.peg, id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false };
    try { disc.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety only */ }
  });

  discLayer.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0;
    var dy = e.clientY - drag.y0;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.active = true;
      clearHint();
      if (selected !== null) { selected = null; render(); }
      drag.el.classList.add('is-dragging');
      say('Dragging disc ' + drag.el.dataset.size + '. Drop it on a peg.');
    }
    drag.el.style.setProperty('--dx', dx + 'px');
    drag.el.style.setProperty('--dy', dy + 'px');
    setOverPeg(pegFromPoint(e.clientX, e.clientY));
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    var g = drag;
    drag = null;
    if (!g.active) return; // a plain tap: the click event takes over

    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);

    var target = cancelled ? -1 : pegFromPoint(e.clientX, e.clientY);
    setOverPeg(-1);
    g.el.classList.remove('is-dragging');
    g.el.style.removeProperty('--dx');
    g.el.style.removeProperty('--dy');

    if (target === -1 || target === g.from) {
      say('Disc put back on peg ' + (g.from + 1) + '.');
      return;
    }
    attemptMove(g.from, target); // on an illegal drop the disc slides back and shakes
  }

  discLayer.addEventListener('pointerup', function (e) { endDrag(e, false); });
  discLayer.addEventListener('pointercancel', function (e) { endDrag(e, true); });

  // ---------------------------------------------------------------- keyboard
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (!els.backdrop.hidden) {
      if (e.key === 'Escape') { closeWin(); return; }
      if (e.key === 'Tab') trapFocus(e);
      return;
    }

    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (e.key === '1' || e.key === '2' || e.key === '3') {
      e.preventDefault();
      activatePeg(Number(e.key) - 1);
    } else if (e.key === 'u' || e.key === 'U') {
      undoMove();
    } else if (e.key === 'h' || e.key === 'H') {
      showHint();
    }
  });

  function trapFocus(e) {
    var items = Array.prototype.filter.call(els.modal.querySelectorAll('button'), function (b) { return !b.hidden; });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === els.modal)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  // ---------------------------------------------------------------- buttons
  els.newGame.addEventListener('click', function () { newGame(Number(els.count.value)); });
  els.count.addEventListener('change', function () { newGame(Number(els.count.value)); });
  els.undo.addEventListener('click', undoMove);
  els.reset.addEventListener('click', resetGame);
  els.hint.addEventListener('click', showHint);
  els.auto.addEventListener('click', toggleAuto);
  els.stop.addEventListener('click', function () { stopAuto(false); });
  els.speed.addEventListener('input', applyMoveSpeed);

  els.winAgain.addEventListener('click', function () { newGame(game.n); });
  els.winNext.addEventListener('click', function () { newGame(Math.min(MAX_DISCS, game.n + 1)); });
  els.winClose.addEventListener('click', function () { closeWin(); });
  els.backdrop.addEventListener('click', function (e) { if (e.target === els.backdrop) closeWin(); });

  // ---------------------------------------------------------------- start
  buildTable();
  newGame(DEFAULT_DISCS);
})();
