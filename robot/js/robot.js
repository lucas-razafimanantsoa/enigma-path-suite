/* Guide the Robot - orientation mode (turn, then move forward).
 * Event-driven: the canvas only repaints when something changes. */
(function () {
  'use strict';

  var M = window.EPMaze;
  var LEVELS = window.EP_MAZE_LEVELS;
  var STORE = 'enigmapath.robot.v1';
  var SYMBOL = { F: '↑', L: '↶', R: '↷' };
  var WORD = { F: 'Forward', L: 'Turn left', R: 'Turn right' };
  var SPEEDS = [900, 520, 300, 150, 60];

  var $ = function (id) { return document.getElementById(id); };
  var dom = {
    levels: $('screen-levels'), game: $('screen-game'), grid: $('level-grid'),
    progressText: $('progress-text'), progressFill: $('progress-fill'), unlockAll: $('unlock-all'),
    resetProgress: $('reset-progress'), badge: $('level-badge'), btnLevels: $('btn-levels'),
    name: $('maze-name'), meta: $('maze-meta'), wrap: $('canvas-wrap'), canvas: $('maze-canvas'),
    count: $('stat-count'), par: $('stat-par'), best: $('stat-best'), face: $('stat-face'),
    program: $('program'), message: $('message'), speed: $('speed'),
    run: $('btn-run'), step: $('btn-step'), pause: $('btn-pause'), reset: $('btn-reset'),
    left: $('btn-left'), right: $('btn-right'), remove: $('btn-remove'), clear: $('btn-clear'),
    winRow: $('win-row'), next: $('btn-next'), solution: $('btn-solution')
  };
  var ctx = dom.canvas.getContext('2d');

  /* ------------------------------------------------------------- storage */
  var save = { done: {}, unlockAll: false, speed: 3 };
  try { var raw = window.localStorage.getItem(STORE); if (raw) save = Object.assign(save, JSON.parse(raw)); } catch (e) { /* playable without storage */ }
  function persist() { try { window.localStorage.setItem(STORE, JSON.stringify(save)); } catch (e) { /* ignore */ } }

  /* --------------------------------------------------------------- state */
  var cur = null;             // { index, level, maze, info }
  var program = [];           // array of 'F' | 'L' | 'R'
  var selected = -1;
  var robot = null;           // logical state { r, c, d }
  var view = null;            // drawn state { x, y, angle } (cell units / radians)
  var visited = {};
  var execIndex = 0;          // next instruction to run
  var timer = null;
  var running = false;
  var failedAt = -1;
  var solved = false;
  var layout = { cell: 20, ox: 0, oy: 0 };
  var anim = null;

  /* ------------------------------------------------------------ level UI */
  function isUnlocked(i) {
    return save.unlockAll || i === 0 || !!save.done[LEVELS[i - 1].id];
  }

  function renderLevels() {
    dom.grid.textContent = '';
    var doneCount = 0;
    var firstOpen = -1;
    LEVELS.forEach(function (lv, i) {
      var done = !!save.done[lv.id];
      if (done) doneCount++;
      if (!done && firstOpen < 0 && isUnlocked(i)) firstOpen = i;
    });
    LEVELS.forEach(function (lv, i) {
      var done = save.done[lv.id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'level-card' + (done ? ' is-done' : '') + (i === firstOpen ? ' is-current' : '');
      b.disabled = !isUnlocked(i);
      b.innerHTML = '<span class="s">' + (done ? '✓' : b.disabled ? '🔒' : '') + '</span><span class="n">' + lv.id + '</span><span class="t"></span><span class="m"></span>';
      b.querySelector('.t').textContent = lv.name;
      b.querySelector('.m').textContent = lv.stats.size.replace('x', '×') + ' · fewest ' + lv.stats.fewestInstructions + (done ? ' · best ' + done.best : '');
      b.addEventListener('click', function () { openLevel(i); });
      dom.grid.appendChild(b);
    });
    dom.progressText.textContent = doneCount + ' / ' + LEVELS.length + ' completed';
    dom.progressFill.style.width = (doneCount / LEVELS.length * 100) + '%';
    dom.unlockAll.checked = !!save.unlockAll;
  }

  function showLevels() {
    stopRun();
    dom.game.hidden = true;
    dom.levels.hidden = false;
    dom.badge.hidden = true;
    dom.btnLevels.hidden = true;
    renderLevels();
  }

  function openLevel(i) {
    stopRun();
    var level = LEVELS[i];
    var maze = M.parse(level.map, level.dir);
    cur = { index: i, level: level, maze: maze, par: M.solve(maze).length };
    program = [];
    selected = -1;
    dom.levels.hidden = true;
    dom.game.hidden = false;
    dom.badge.hidden = false;
    dom.btnLevels.hidden = false;
    dom.badge.textContent = 'Level ' + level.id + ' / ' + LEVELS.length;
    dom.name.textContent = level.name;
    dom.meta.textContent = maze.rows + '×' + maze.cols + ' tiles · ' + level.stats.loops + ' loops · ' + level.stats.deadEnds + ' dead ends';
    dom.par.textContent = cur.par;
    var d = save.done[level.id];
    dom.best.textContent = d ? d.best : '–';
    dom.speed.value = String(save.speed || 3);
    resetRobot();
    renderProgram();
    setMessage('Build a program, then press Run. Turn first, then move forward.', '');
    layoutCanvas();
    draw();
  }

  /* ------------------------------------------------------------ program UI */
  function renderProgram() {
    dom.program.textContent = '';
    program.forEach(function (ins, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      if (i === selected) b.classList.add('is-selected');
      if (i === failedAt) b.classList.add('is-failed');
      else if (running && i === execIndex - 1) b.classList.add('is-current');
      else if (i < execIndex && (running || execIndex > 0)) b.classList.add('is-done');
      b.innerHTML = '<small>' + (i + 1) + '</small>' + SYMBOL[ins];
      b.title = WORD[ins];
      b.setAttribute('aria-label', (i + 1) + ': ' + WORD[ins]);
      b.addEventListener('click', function () { if (!running) { selected = selected === i ? -1 : i; renderProgram(); } });
      li.appendChild(b);
      dom.program.appendChild(li);
    });
    dom.program.classList.toggle('is-locked', running);
    dom.count.textContent = program.length;
    var cl = dom.program.querySelector('.is-current, .is-failed');
    if (cl && cl.scrollIntoView) cl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function editable() { return !running && cur; }

  function addIns(ins) {
    if (!editable()) return;
    if (execIndex > 0 || solved || failedAt >= 0) resetRobot();
    var at = selected >= 0 ? selected + 1 : program.length;
    program.splice(at, 0, ins);
    selected = selected >= 0 ? at : -1;
    renderProgram();
  }

  function removeIns() {
    if (!editable() || !program.length) return;
    if (execIndex > 0 || solved || failedAt >= 0) resetRobot();
    var at = selected >= 0 ? selected : program.length - 1;
    program.splice(at, 1);
    selected = selected >= 0 ? Math.min(at, program.length - 1) : -1;
    renderProgram();
  }

  function moveIns(delta) {
    if (!editable() || selected < 0) return;
    var to = selected + delta;
    if (to < 0 || to >= program.length) return;
    var t = program[selected]; program[selected] = program[to]; program[to] = t;
    selected = to;
    resetRobot();
    renderProgram();
  }

  /* ------------------------------------------------------------- execution */
  function resetRobot() {
    stopRun();
    if (!cur) return;
    robot = { r: cur.maze.start.r, c: cur.maze.start.c, d: cur.maze.dir };
    view = { x: robot.c, y: robot.r, angle: robot.d * Math.PI / 2 };
    visited = {}; visited[robot.r + ',' + robot.c] = 1;
    execIndex = 0; failedAt = -1; solved = false;
    dom.winRow.hidden = true;
    dom.face.textContent = M.DIRS[robot.d];
    setButtons();
    renderProgram();
    draw();
  }

  function setButtons() {
    dom.run.disabled = running;
    dom.step.disabled = running;
    dom.pause.disabled = !running;
    dom.reset.disabled = running ? false : false;
  }

  function stopRun() {
    if (timer) { clearTimeout(timer); timer = null; }
    running = false;
    if (dom.run) setButtons();
  }

  function setMessage(text, kind) {
    dom.message.textContent = text;
    dom.message.className = 'message' + (kind ? ' is-' + kind : '');
  }

  /* Execute one instruction. Returns true when the program should keep going. */
  function execOne() {
    if (execIndex >= program.length) return false;
    var ins = program[execIndex];
    var res = M.step(cur.maze, robot, ins);
    if (!res.ok) {
      failedAt = execIndex;
      execIndex++;
      animateTo(robot, robot, true);
      dom.canvas.classList.remove('shake');
      void dom.canvas.offsetWidth;
      dom.canvas.classList.add('shake');
      setMessage(res.error === 'edge' ? 'Oops! The robot tried to leave the maze at instruction ' + (failedAt + 1) + '.' : 'Oops! The robot hit a wall at instruction ' + (failedAt + 1) + '. Fix it and try again.', 'bad');
      stopRun();
      renderProgram();
      return false;
    }
    var prev = { r: robot.r, c: robot.c, d: robot.d };
    robot = { r: res.r, c: res.c, d: res.d };
    visited[robot.r + ',' + robot.c] = 1;
    execIndex++;
    dom.face.textContent = M.DIRS[robot.d];
    animateTo(prev, robot, false);
    renderProgram();
    if (robot.r === cur.maze.goal.r && robot.c === cur.maze.goal.c) { win(); return false; }
    if (execIndex >= program.length) {
      setMessage('Your program finished, but the robot has not reached the goal yet. Add more instructions or change some.', 'info');
      stopRun();
      return false;
    }
    return true;
  }

  function tick() {
    timer = null;
    if (!running) return;
    if (execOne()) timer = setTimeout(tick, SPEEDS[(Number(dom.speed.value) || 3) - 1]);
  }

  function run() {
    if (!cur || running) return;
    if (!program.length) { setMessage('Add some instructions first.', 'info'); return; }
    if (execIndex >= program.length || solved || failedAt >= 0) resetRobot();
    running = true;
    selected = -1;
    setButtons();
    setMessage('Running…', '');
    tick();
  }

  function step() {
    if (!cur || running) return;
    if (!program.length) { setMessage('Add some instructions first.', 'info'); return; }
    if (execIndex >= program.length || solved || failedAt >= 0) resetRobot();
    selected = -1;
    setMessage('Step ' + (execIndex + 1) + ' of ' + program.length, '');
    execOne();
    renderProgram();
  }

  function pause() {
    if (!running) return;
    stopRun();
    setMessage('Paused after instruction ' + execIndex + '. Press Run to continue from the start, Step to go one at a time.', 'info');
    renderProgram();
  }

  function win() {
    solved = true;
    stopRun();
    var id = cur.level.id;
    var prev = save.done[id];
    var best = prev ? Math.min(prev.best, program.length) : program.length;
    save.done[id] = { best: best };
    persist();
    dom.best.textContent = best;
    var par = cur.par;
    var note = program.length === par ? ' That is the fewest possible instructions!' : program.length < par ? '' : ' A shorter route needs only ' + par + ' instructions - can you find it?';
    setMessage('Great job! You found the exit with ' + program.length + ' instructions.' + note, 'ok');
    dom.winRow.hidden = false;
    dom.next.hidden = cur.index >= LEVELS.length - 1;
    dom.solution.hidden = !save.unlockAll;
    draw();
  }

  /* -------------------------------------------------------------- drawing */
  function layoutCanvas() {
    if (!cur) return;
    var m = cur.maze;
    var avail = Math.max(240, dom.wrap.clientWidth - 16);
    var maxH = Math.max(320, window.innerHeight - 190);
    var cell = Math.floor(Math.min(avail / m.cols, maxH / m.rows, 44));
    cell = Math.max(cell, 10);
    var dpr = window.devicePixelRatio || 1;
    dom.canvas.width = Math.round(cell * m.cols * dpr);
    dom.canvas.height = Math.round(cell * m.rows * dpr);
    dom.canvas.style.width = cell * m.cols + 'px';
    dom.canvas.style.height = cell * m.rows + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout.cell = cell;
  }

  function draw() {
    if (!cur) return;
    var m = cur.maze, cs = layout.cell;
    ctx.clearRect(0, 0, m.cols * cs, m.rows * cs);
    for (var r = 0; r < m.rows; r++) {
      for (var c = 0; c < m.cols; c++) {
        var open = m.open[r][c];
        ctx.fillStyle = open ? (visited[r + ',' + c] ? '#87CEEB' : '#E0FFFF') : '#1E3D56';
        ctx.fillRect(c * cs, r * cs, cs, cs);
        if (!open) {
          ctx.fillStyle = '#4682B4';
          ctx.fillRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2);
        } else {
          // A faint outline makes each square of a corridor visible.
          ctx.strokeStyle = 'rgba(70, 130, 180, 0.32)';
          ctx.lineWidth = 1;
          ctx.strokeRect(c * cs + 0.5, r * cs + 0.5, cs - 1, cs - 1);
        }
      }
    }
    // start marker
    ctx.strokeStyle = '#2C7562';
    ctx.lineWidth = 2;
    ctx.strokeRect(m.start.c * cs + 2, m.start.r * cs + 2, cs - 4, cs - 4);
    // goal
    var g = m.goal;
    ctx.fillStyle = '#E0FFFF';
    roundRect(g.c * cs + cs * 0.14, g.r * cs + cs * 0.14, cs * 0.72, cs * 0.72, cs * 0.16);
    ctx.fill();
    ctx.strokeStyle = '#1E3D56';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#1E3D56';
    ctx.font = '700 ' + Math.round(cs * 0.5) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', g.c * cs + cs / 2, g.r * cs + cs / 2 + 1);
    drawRobot();
  }

  function roundRect(x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawRobot() {
    var cs = layout.cell;
    var cx = (view.x + 0.5) * cs, cy = (view.y + 0.5) * cs;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(view.angle);
    ctx.fillStyle = failedAt >= 0 ? '#A94A5A' : '#1E3D56';
    ctx.beginPath();
    ctx.arc(0, 0, cs * 0.36, 0, Math.PI * 2);
    ctx.fill();
    // Light arrow on a dark robot so the facing direction is unmistakable.
    ctx.fillStyle = '#E0FFFF';
    ctx.beginPath();
    ctx.moveTo(0, -cs * 0.32);
    ctx.lineTo(cs * 0.19, cs * 0.08);
    ctx.lineTo(-cs * 0.19, cs * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* Short tween between two logical states; the loop only runs while moving. */
  function animateTo(from, to, none) {
    if (anim) { cancelAnimationFrame(anim.id); anim = null; }
    var targetAngle = view.angle;
    var wanted = to.d * Math.PI / 2;
    var diff = ((wanted - view.angle) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    targetAngle = view.angle + diff;
    var fx = view.x, fy = view.y, fa = view.angle;
    var dur = Math.min(160, SPEEDS[(Number(dom.speed.value) || 3) - 1] * 0.6);
    if (none || reduced() || dur < 30 || (fx === to.c && fy === to.r && fa === targetAngle)) {
      view = { x: to.c, y: to.r, angle: targetAngle };
      draw();
      return;
    }
    var t0 = performance.now();
    function frame(now) {
      var k = Math.min(1, (now - t0) / dur);
      view = { x: fx + (to.c - fx) * k, y: fy + (to.r - fy) * k, angle: fa + (targetAngle - fa) * k };
      draw();
      anim = k < 1 ? { id: requestAnimationFrame(frame) } : null;
    }
    anim = { id: requestAnimationFrame(frame) };
  }

  /* --------------------------------------------------------------- events */
  document.querySelectorAll('.ins').forEach(function (b) {
    b.addEventListener('click', function () { addIns(b.getAttribute('data-ins')); });
  });
  dom.run.addEventListener('click', run);
  dom.step.addEventListener('click', step);
  dom.pause.addEventListener('click', pause);
  dom.reset.addEventListener('click', function () { resetRobot(); setMessage('Robot is back at the start.', ''); });
  dom.clear.addEventListener('click', function () {
    if (!editable()) return;
    program = []; selected = -1; resetRobot(); setMessage('Program cleared.', '');
  });
  dom.remove.addEventListener('click', removeIns);
  dom.left.addEventListener('click', function () { moveIns(-1); });
  dom.right.addEventListener('click', function () { moveIns(1); });
  dom.next.addEventListener('click', function () { if (cur && cur.index < LEVELS.length - 1) openLevel(cur.index + 1); });
  dom.solution.addEventListener('click', function () {
    if (!cur || running) return;
    program = M.solve(cur.maze).program.split('');
    selected = -1;
    resetRobot();
    setMessage('Teacher mode: a shortest program (' + program.length + ' instructions) was loaded. Press Run.', 'info');
  });
  dom.btnLevels.addEventListener('click', showLevels);
  dom.speed.addEventListener('input', function () { save.speed = Number(dom.speed.value); persist(); });
  dom.unlockAll.addEventListener('change', function () { save.unlockAll = dom.unlockAll.checked; persist(); renderLevels(); });
  dom.resetProgress.addEventListener('click', function () {
    if (window.confirm('Erase all Guide the Robot progress on this computer?')) { save.done = {}; persist(); renderLevels(); }
  });
  window.addEventListener('resize', function () { layoutCanvas(); draw(); });
  document.addEventListener('keydown', function (e) {
    if (!cur || dom.game.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    var map = { ArrowUp: 'F', ArrowLeft: 'L', ArrowRight: 'R' };
    if (map[e.key]) { e.preventDefault(); addIns(map[e.key]); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); removeIns(); }
    else if (e.key === 'Enter' && tag !== 'BUTTON') { e.preventDefault(); run(); }
  });

  showLevels();
}());
