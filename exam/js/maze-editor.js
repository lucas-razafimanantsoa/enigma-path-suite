/* Maze editor widget for the exam builder: paint walls/floor, place start and goal,
 * load a library maze or generate a random one, and see live statistics.
 * MazeEditor.create(host, { map, dir }, onChange) -> { getMaze() } */
(function () {
  'use strict';
  var M = window.EPMaze;
  var LEVELS = window.EP_MAZE_LEVELS || [];
  var DIR_LABEL = { N: 'North (up)', E: 'East (right)', S: 'South (down)', W: 'West (left)' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function create(host, initial, onChange) {
    var state = { grid: initial.map.map(function (r) { return r.split(''); }), dir: initial.dir || 'N', from: initial.from || 'custom', tool: 'wall' };

    host.textContent = '';
    host.classList.add('maze-editor');

    /* ---- toolbar ---- */
    var bar = el('div', 'me-bar');
    var tools = [['wall', '▪ Wall'], ['floor', '□ Floor'], ['start', '▲ Start'], ['goal', 'G Goal']];
    var toolButtons = {};
    tools.forEach(function (t) {
      var b = el('button', 'btn btn--small', t[1]);
      b.type = 'button';
      b.addEventListener('click', function () { state.tool = t[0]; markTools(); });
      toolButtons[t[0]] = b;
      bar.appendChild(b);
    });
    var dirWrap = el('label', 'me-inline', 'Robot faces ');
    var dirSel = el('select');
    Object.keys(DIR_LABEL).forEach(function (d) { var o = el('option', null, DIR_LABEL[d]); o.value = d; dirSel.appendChild(o); });
    dirSel.value = state.dir;
    dirSel.addEventListener('change', function () { state.dir = dirSel.value; changed(); });
    dirWrap.appendChild(dirSel);
    bar.appendChild(dirWrap);
    host.appendChild(bar);

    var bar2 = el('div', 'me-bar');
    var libWrap = el('label', 'me-inline', 'Load a maze ');
    var libSel = el('select');
    var o0 = el('option', null, 'Choose…'); o0.value = ''; libSel.appendChild(o0);
    LEVELS.forEach(function (lv) {
      var o = el('option', null, 'Library: ' + lv.id + '. ' + lv.name + ' (' + lv.stats.size.replace('x', '×') + ')');
      o.value = 'lib:' + lv.id; libSel.appendChild(o);
    });
    [['blank:11x11', 'Blank room 11×11'], ['blank:15x15', 'Blank room 15×15']].forEach(function (b) { var o = el('option', null, b[1]); o.value = b[0]; libSel.appendChild(o); });
    libSel.addEventListener('change', function () {
      var v = libSel.value;
      if (!v) return;
      if (v.indexOf('lib:') === 0) {
        var lv = LEVELS.filter(function (l) { return 'lib:' + l.id === v; })[0];
        load(lv.map, lv.dir, 'library:' + lv.id);
      } else {
        var dims = v.split(':')[1].split('x').map(Number);
        load(blank(dims[0], dims[1]), 'N', 'custom');
      }
      libSel.value = '';
    });
    libWrap.appendChild(libSel);
    bar2.appendChild(libWrap);

    var rcWrap = el('label', 'me-inline', 'Random maze: ');
    var rIn = el('input'); rIn.type = 'number'; rIn.min = 3; rIn.max = 15; rIn.value = 6; rIn.title = 'Cells tall';
    var cIn = el('input'); cIn.type = 'number'; cIn.min = 3; cIn.max = 15; cIn.value = 6; cIn.title = 'Cells wide';
    var braid = el('input'); braid.type = 'range'; braid.min = 0; braid.max = 40; braid.value = 15; braid.title = 'More loops = more different routes';
    rcWrap.append(rIn, ' × ', cIn, ' cells, loops ', braid);
    var gen = el('button', 'btn btn--small', 'Generate');
    gen.type = 'button';
    gen.addEventListener('click', function () {
      var r = Math.max(3, Math.min(15, Number(rIn.value) || 6));
      var c = Math.max(3, Math.min(15, Number(cIn.value) || 6));
      var g = M.generate(r, c, Math.floor(Math.random() * 1e9), Number(braid.value) / 100);
      load(g.map, g.dir, 'random');
    });
    bar2.append(rcWrap, gen);
    host.appendChild(bar2);

    var bar3 = el('div', 'me-bar');
    var sizeWrap = el('label', 'me-inline', 'Size: ');
    var rowsIn = el('input'); rowsIn.type = 'number'; rowsIn.min = 5; rowsIn.max = 41;
    var colsIn = el('input'); colsIn.type = 'number'; colsIn.min = 5; colsIn.max = 41;
    sizeWrap.append(rowsIn, ' rows × ', colsIn, ' columns');
    var apply = el('button', 'btn btn--small', 'Resize');
    apply.type = 'button';
    apply.addEventListener('click', function () { resize(Number(rowsIn.value), Number(colsIn.value)); });
    var walls = el('button', 'btn btn--small', 'All walls');
    walls.type = 'button';
    walls.addEventListener('click', function () {
      var s = find('S'), g = find('G');
      state.grid = state.grid.map(function (row) { return row.map(function () { return '#'; }); });
      state.grid[s.r][s.c] = 'S'; state.grid[g.r][g.c] = 'G';
      draw(); changed();
    });
    var room = el('button', 'btn btn--small', 'Open room');
    room.type = 'button';
    room.addEventListener('click', function () { load(blank(state.grid.length, state.grid[0].length), state.dir, 'custom'); });
    bar3.append(sizeWrap, apply, walls, room);
    host.appendChild(bar3);

    var hint = el('p', 'hint', 'Click or drag on the grid with the chosen tool. The border should stay wall. Every maze must be solvable.');
    host.appendChild(hint);

    var wrap = el('div', 'me-canvas-wrap');
    var canvas = el('canvas');
    wrap.appendChild(canvas);
    host.appendChild(wrap);

    var stats = el('div', 'me-stats');
    stats.setAttribute('aria-live', 'polite');
    host.appendChild(stats);

    var cs = 20;
    var ctx = canvas.getContext('2d');

    function blank(rows, cols) {
      var out = [];
      for (var r = 0; r < rows; r++) {
        var s = '';
        for (var c = 0; c < cols; c++) {
          if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1) s += '#';
          else if (r === rows - 2 && c === 1) s += 'S';
          else if (r === 1 && c === cols - 2) s += 'G';
          else s += '.';
        }
        out.push(s);
      }
      return out;
    }

    function find(ch) {
      for (var r = 0; r < state.grid.length; r++) for (var c = 0; c < state.grid[0].length; c++) if (state.grid[r][c] === ch) return { r: r, c: c };
      return null;
    }

    function load(map, dir, from) {
      state.grid = map.map(function (r) { return r.split(''); });
      state.dir = dir;
      state.from = from;
      dirSel.value = dir;
      draw(); changed();
    }

    function resize(rows, cols) {
      rows = Math.max(5, Math.min(41, Math.round(rows) || 11));
      cols = Math.max(5, Math.min(41, Math.round(cols) || 11));
      var old = state.grid;
      var next = [];
      for (var r = 0; r < rows; r++) {
        var line = [];
        for (var c = 0; c < cols; c++) {
          var border = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
          var v = old[r] && old[r][c] ? old[r][c] : '.';
          line.push(border ? '#' : v);
        }
        next.push(line);
      }
      var hasS = next.some(function (row) { return row.indexOf('S') >= 0; });
      var hasG = next.some(function (row) { return row.indexOf('G') >= 0; });
      if (!hasS) next[rows - 2][1] = 'S';
      if (!hasG) next[1][cols - 2] = 'G';
      state.grid = next;
      state.from = 'custom';
      draw(); changed();
    }

    function markTools() {
      Object.keys(toolButtons).forEach(function (k) { toolButtons[k].classList.toggle('btn--primary', k === state.tool); });
    }

    function layout() {
      var rows = state.grid.length, cols = state.grid[0].length;
      cs = Math.max(10, Math.min(26, Math.floor(Math.min(640, host.clientWidth - 24 || 560) / cols)));
      var dpr = window.devicePixelRatio || 1;
      canvas.width = cols * cs * dpr; canvas.height = rows * cs * dpr;
      canvas.style.width = cols * cs + 'px'; canvas.style.height = rows * cs + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rowsIn.value = rows; colsIn.value = cols;
    }

    function draw() {
      layout();
      var rows = state.grid.length, cols = state.grid[0].length;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var ch = state.grid[r][c];
          ctx.fillStyle = ch === '#' ? '#1E3D56' : '#E0FFFF';
          ctx.fillRect(c * cs, r * cs, cs, cs);
          if (ch === '#') { ctx.fillStyle = '#4682B4'; ctx.fillRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2); }
          else { ctx.strokeStyle = 'rgba(30,61,86,0.18)'; ctx.strokeRect(c * cs + 0.5, r * cs + 0.5, cs - 1, cs - 1); }
        }
      }
      var g = find('G');
      if (g) {
        ctx.fillStyle = '#E0FFFF'; ctx.fillRect(g.c * cs + 2, g.r * cs + 2, cs - 4, cs - 4);
        ctx.fillStyle = '#1E3D56'; ctx.font = '700 ' + Math.round(cs * 0.6) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('G', g.c * cs + cs / 2, g.r * cs + cs / 2 + 1);
      }
      var s = find('S');
      if (s) {
        ctx.save();
        ctx.translate(s.c * cs + cs / 2, s.r * cs + cs / 2);
        ctx.rotate(['N', 'E', 'S', 'W'].indexOf(state.dir) * Math.PI / 2);
        ctx.fillStyle = '#1E3D56'; ctx.beginPath(); ctx.arc(0, 0, cs * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#E0FFFF'; ctx.beginPath(); ctx.moveTo(0, -cs * 0.32); ctx.lineTo(cs * 0.2, cs * 0.08); ctx.lineTo(-cs * 0.2, cs * 0.08); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    function paint(ev) {
      var rect = canvas.getBoundingClientRect();
      var c = Math.floor((ev.clientX - rect.left) / cs), r = Math.floor((ev.clientY - rect.top) / cs);
      if (r < 0 || c < 0 || r >= state.grid.length || c >= state.grid[0].length) return;
      var cur = state.grid[r][c];
      var t = state.tool;
      if (t === 'wall' || t === 'floor') {
        if (cur === 'S' || cur === 'G') return;
        var v = t === 'wall' ? '#' : '.';
        if (cur === v) return;
        state.grid[r][c] = v;
      } else {
        var ch = t === 'start' ? 'S' : 'G';
        var other = t === 'start' ? 'G' : 'S';
        if (cur === other || cur === ch) return;
        var old = find(ch);
        if (old) state.grid[old.r][old.c] = '.';
        state.grid[r][c] = ch;
      }
      state.from = 'custom';
      draw();
    }

    var painting = false;
    canvas.addEventListener('pointerdown', function (ev) { painting = true; canvas.setPointerCapture(ev.pointerId); paint(ev); });
    canvas.addEventListener('pointermove', function (ev) { if (painting && (state.tool === 'wall' || state.tool === 'floor')) paint(ev); });
    function stop() { if (painting) { painting = false; changed(); } }
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.style.touchAction = 'none';

    function getMaze() {
      return { map: state.grid.map(function (r) { return r.join(''); }), dir: state.dir, from: state.from };
    }

    function changed() {
      var m = getMaze();
      var problems = M.check(m.map, m.dir);
      stats.textContent = '';
      if (problems.length) {
        stats.appendChild(el('p', 'me-problem', '⚠ ' + problems[0]));
      } else {
        var a = M.analyze(M.parse(m.map, m.dir));
        var items = [
          ['Size', a.rows + '×' + a.cols], ['Fewest instructions', a.fewestInstructions], ['Shortest path', a.cellDistance + ' squares'],
          ['Fewest turns', a.fewestTurns], ['Loops', a.loops], ['Dead ends', a.deadEnds],
          ['Different routes', a.routes + (a.routesCapped ? '+' : '')], ['Shortest paths', a.shortestPathCount]
        ];
        items.forEach(function (it) {
          var d = el('div', 'me-stat');
          d.append(el('b', null, String(it[1])), el('span', null, it[0]));
          stats.appendChild(d);
        });
        if (a.unreachableOpenCells) stats.appendChild(el('p', 'hint', a.unreachableOpenCells + ' floor squares cannot be reached from the start (fine, but they are never used).'));
      }
      onChange(m, problems);
    }

    markTools();
    draw();
    changed();
    return { getMaze: getMaze };
  }

  window.MazeEditor = { create: create };
}());
