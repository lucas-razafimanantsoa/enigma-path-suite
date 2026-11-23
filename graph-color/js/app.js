/* Graph / Map Colouring — interactive recolouring, live conflict detection, exact chromatic-number solver. */
(function () {
  'use strict';

  // Four clearly different colours, paired with letters so colour vision never matters.
  var COLORS = ['#E8705F', '#F2C14E', '#4CAF88', '#6C8EEF'];
  var COLOR_NAMES = ['Coral', 'Amber', 'Green', 'Indigo'];
  var COLOR_LETTERS = ['A', 'B', 'C', 'D'];
  var NODE_OUTLINE = '#1E3D56';

  // Larger presets are generated so the coordinates stay tidy.
  function gridGraph(n, name) {
    var nodes = [];
    var edges = [];
    var margin = n >= 6 ? 8 : 10;
    var step = (100 - 2 * margin) / (n - 1);
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) nodes.push([margin + c * step, margin + r * step]);
    }
    function id(r, c) { return r * n + c; }
    for (var r2 = 0; r2 < n; r2++) {
      for (var c2 = 0; c2 < n; c2++) {
        if (c2 < n - 1) edges.push([id(r2, c2), id(r2, c2 + 1)]);
        if (r2 < n - 1) edges.push([id(r2, c2), id(r2 + 1, c2)]);
      }
    }
    return { name: name, nodes: nodes, edges: edges };
  }

  function mapGraph(cols, rows, name) {
    var nodes = [];
    var edges = [];
    var mx = 9;
    var my = 12;
    var sx = (100 - 2 * mx) / (cols - 1);
    var sy = (100 - 2 * my) / (rows - 1);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) nodes.push([mx + c * sx, my + r * sy]);
    }
    function id(r, c) { return r * cols + c; }
    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        if (c2 < cols - 1) edges.push([id(r2, c2), id(r2, c2 + 1)]);
        if (r2 < rows - 1) edges.push([id(r2, c2), id(r2 + 1, c2)]);
        if (r2 < rows - 1 && c2 < cols - 1) edges.push([id(r2, c2), id(r2 + 1, c2 + 1)]);
      }
    }
    return { name: name, nodes: nodes, edges: edges };
  }

  // Each preset stores fixed node coordinates in the 0-100 viewBox and edges as index pairs.
  var PRESETS = [
    {
      name: 'Map of 6 regions',
      nodes: [[30, 25], [65, 22], [20, 55], [52, 52], [80, 55], [45, 82]],
      edges: [[0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [2, 3], [2, 5], [3, 4], [3, 5], [4, 5]]
    },
    {
      name: 'Wheel (6 rim + hub)',
      nodes: [[50, 50], [82, 50], [66, 78], [34, 78], [18, 50], [34, 22], [66, 22]],
      edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1]]
    },
    {
      name: 'Grid 3 × 3',
      nodes: [[25, 25], [50, 25], [75, 25], [25, 50], [50, 50], [75, 50], [25, 75], [50, 75], [75, 75]],
      edges: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]]
    },
    {
      name: 'Randomish 8 nodes',
      nodes: [[20, 20], [48, 14], [78, 24], [86, 55], [65, 82], [35, 86], [12, 58], [50, 48]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [7, 0], [7, 2], [7, 4], [7, 6], [1, 6]]
    },
    {
      // A triangulated 4-by-3 patch — a small, planar "map of regions".
      name: 'Map of 12 regions',
      nodes: [
        [18, 18], [39, 18], [61, 18], [82, 18],
        [18, 50], [39, 50], [61, 50], [82, 50],
        [18, 82], [39, 82], [61, 82], [82, 82]
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [8, 9], [9, 10], [10, 11],
        [0, 4], [4, 8], [1, 5], [5, 9], [2, 6], [6, 10], [3, 7], [7, 11],
        [1, 4], [2, 5], [3, 6], [5, 8], [6, 9], [7, 10]
      ]
    },
    {
      name: 'Grid 4 × 4 (16 nodes)',
      nodes: [
        [18, 18], [39, 18], [61, 18], [82, 18],
        [18, 39], [39, 39], [61, 39], [82, 39],
        [18, 61], [39, 61], [61, 61], [82, 61],
        [18, 82], [39, 82], [61, 82], [82, 82]
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7],
        [8, 9], [9, 10], [10, 11], [12, 13], [13, 14], [14, 15],
        [0, 4], [4, 8], [8, 12], [1, 5], [5, 9], [9, 13],
        [2, 6], [6, 10], [10, 14], [3, 7], [7, 11], [11, 15]
      ]
    },
    {
      // Seven rim nodes = an odd cycle on the rim, so the hub forces a 4th colour.
      name: 'Wheel (7 rim + hub)',
      nodes: [
        [50, 50],
        [50, 17], [75.8, 29.4], [82.2, 57.3], [64.3, 79.7],
        [35.7, 79.7], [17.8, 57.3], [24.2, 29.4]
      ],
      edges: [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
        [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 1]
      ]
    },
    {
      name: 'Bipartite K3,3',
      nodes: [[24, 25], [24, 50], [24, 76], [76, 25], [76, 50], [76, 76]],
      edges: [
        [0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5]
      ]
    },
    {
      name: 'Odd cycle C5 (needs 3)',
      nodes: [[50, 17], [81.4, 39.8], [69.4, 76.7], [30.6, 76.7], [18.6, 39.8]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
    },
    {
      // K4 drawn planar: a triangle with one node inside. Needs all four colours.
      name: 'Complete graph K4 (needs 4)',
      nodes: [[50, 18], [82, 72], [18, 72], [50, 52]],
      edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
    },
    mapGraph(5, 4, 'Map of 20 regions'),
    gridGraph(5, 'Grid 5 × 5 (25 nodes)'),
    gridGraph(6, 'Grid 6 × 6 (36 nodes)')
  ];

  var svgNS = 'http://www.w3.org/2000/svg';
  var edgesGroup = document.getElementById('edges');
  var nodesGroup = document.getElementById('nodes');
  var presetName = document.getElementById('preset-name');
  var presetSelect = document.getElementById('preset-select');
  var colorBadge = document.getElementById('color-count-badge');
  var chromaticLine = document.getElementById('chromatic-line');
  var legend = document.getElementById('legend');
  var msg = document.getElementById('msg');
  var statConflicts = document.getElementById('stat-conflicts');
  var statMoves = document.getElementById('stat-moves');
  var statUsed = document.getElementById('stat-used');
  var btnNew = document.getElementById('btn-new');
  var btnCheck = document.getElementById('btn-check');
  var btnReset = document.getElementById('btn-reset');
  var btnSolution = document.getElementById('btn-solution');

  var presetIndex = 0;
  var nodeCount = 0;
  var edges = [];
  var chromatic = 1;
  var colors = [];
  var moves = 0;
  var prevConflicts = Object.create(null);
  var nodeEls = [];
  var edgeEls = [];

  function setMessage(text, kind) {
    msg.textContent = text;
    msg.className = 'gc-msg' + (kind ? ' is-' + kind : '');
  }

  function colorsUsed(list) {
    var seen = Object.create(null);
    for (var i = 0; i < list.length; i++) seen[list[i]] = true;
    return Object.keys(seen).length;
  }

  function buildPresetSelect() {
    for (var i = 0; i < PRESETS.length; i++) {
      var option = document.createElement('option');
      option.value = String(i);
      option.textContent = PRESETS[i].name;
      presetSelect.appendChild(option);
    }
    presetSelect.addEventListener('change', function () {
      var index = parseInt(presetSelect.value, 10);
      loadPreset(index, 'New graph: ' + PRESETS[index].name + '. Colour it so no edge conflicts.');
    });
  }

  function buildLegend() {
    for (var c = 0; c < COLORS.length; c++) {
      var item = document.createElement('span');
      item.className = 'swatch';
      var chip = document.createElement('i');
      chip.style.background = COLORS[c];
      chip.style.borderColor = NODE_OUTLINE;
      chip.textContent = COLOR_LETTERS[c];
      chip.className = 'swatch__chip';
      item.appendChild(chip);
      item.appendChild(document.createTextNode(COLOR_LETTERS[c] + ' · ' + COLOR_NAMES[c]));
      legend.appendChild(item);
    }
  }

  function renderGraph() {
    while (edgesGroup.firstChild) edgesGroup.removeChild(edgesGroup.firstChild);
    while (nodesGroup.firstChild) nodesGroup.removeChild(nodesGroup.firstChild);
    nodeEls = [];
    edgeEls = [];

    var preset = PRESETS[presetIndex];
    nodeCount = preset.nodes.length;
    edges = preset.edges;
    var graphEl = document.getElementById('graph');
    graphEl.classList.toggle('graph--big', nodeCount >= 20);
    graphEl.classList.toggle('graph--huge', nodeCount >= 30);
    var radius = nodeCount >= 30 ? '2.9' : nodeCount >= 20 ? '3.2' : '3.6';

    edges.forEach(function (e) {
      var a = preset.nodes[e[0]], b = preset.nodes[e[1]];
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', a[0]);
      line.setAttribute('y1', a[1]);
      line.setAttribute('x2', b[0]);
      line.setAttribute('y2', b[1]);
      line.setAttribute('class', 'edge');
      edgesGroup.appendChild(line);
      edgeEls.push(line);
    });

    preset.nodes.forEach(function (pt, i) {
      var g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'node');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', 'Node ' + (i + 1) + ', click to change colour');

      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', pt[0]);
      circle.setAttribute('cy', pt[1]);
      circle.setAttribute('r', radius);
      g.appendChild(circle);

      var label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', pt[0]);
      label.setAttribute('y', pt[1]);
      label.textContent = COLOR_LETTERS[0];
      g.appendChild(label);

      g.addEventListener('click', function (ev) { cycleNode(i, ev.shiftKey ? -1 : 1); });
      g.addEventListener('contextmenu', function (ev) { ev.preventDefault(); cycleNode(i, -1); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cycleNode(i, 1); }
        else if (ev.key === 'Backspace') { ev.preventDefault(); cycleNode(i, -1); }
      });

      nodesGroup.appendChild(g);
      nodeEls.push(g);
    });
  }

  function applyColor(i, bump) {
    var g = nodeEls[i];
    var circle = g.querySelector('circle');
    circle.style.fill = COLORS[colors[i]];
    circle.style.stroke = NODE_OUTLINE;
    g.querySelector('text').textContent = COLOR_LETTERS[colors[i]];
    g.setAttribute('aria-label', 'Node ' + (i + 1) + ', colour ' + COLOR_NAMES[colors[i]] + ', click to change');
    if (bump) {
      g.classList.remove('node--bump');
      void g.getBoundingClientRect();
      g.classList.add('node--bump');
      setTimeout(function () { g.classList.remove('node--bump'); }, 260);
    }
  }

  function currentConflicts() {
    var list = [];
    for (var i = 0; i < edges.length; i++) {
      if (colors[edges[i][0]] === colors[edges[i][1]]) list.push(i);
    }
    return list;
  }

  function keyFor(i) { return edges[i][0] + '-' + edges[i][1]; }

  function updateVisuals(conflicts, allowShake) {
    var now = Object.create(null);
    conflicts.forEach(function (i) { now[keyFor(i)] = true; });

    for (var i = 0; i < edgeEls.length; i++) {
      var isConflict = !!now[keyFor(i)];
      edgeEls[i].classList.toggle('edge--conflict', isConflict);
      if (allowShake !== false && isConflict && !prevConflicts[keyFor(i)]) {
        edgeEls[i].classList.remove('edge--shake');
        void edgeEls[i].getBoundingClientRect();
        edgeEls[i].classList.add('edge--shake');
        setTimeout(function (el) {
          return function () { el.classList.remove('edge--shake'); };
        }(edgeEls[i]), 380);
      }
    }
    prevConflicts = now;

    statConflicts.textContent = String(conflicts.length);
    statMoves.textContent = String(moves);
    statUsed.textContent = String(colorsUsed(colors));
  }

  function tooManyMessage(used) {
    return 'You used ' + used + ' colours, but ' + chromatic + ' is enough — try again!';
  }

  function cycleNode(i, dir) {
    colors[i] = (colors[i] + dir + 4) % 4;
    moves++;
    applyColor(i, true);
    var conflicts = currentConflicts();
    updateVisuals(conflicts);
    var used = colorsUsed(colors);
    if (conflicts.length === 0 && used > chromatic) {
      setMessage(tooManyMessage(used), 'warn');
    } else {
      setMessage('Node ' + (i + 1) + ' is now colour ' + COLOR_LETTERS[colors[i]] + ' (' + COLOR_NAMES[colors[i]] + ').');
    }
  }

  function loadPreset(index, note) {
    presetIndex = index;
    var preset = PRESETS[index];
    nodeCount = preset.nodes.length;
    edges = preset.edges;
    chromatic = chromaticNumber(edges, nodeCount);
    colors = new Array(nodeCount);
    for (var i = 0; i < colors.length; i++) colors[i] = 0;
    moves = 0;
    prevConflicts = Object.create(null);

    renderGraph();
    for (var j = 0; j < nodeCount; j++) applyColor(j, false);

    presetName.textContent = preset.name;
    presetSelect.value = String(index);
    colorBadge.textContent = 'Minimum colours: ' + chromatic;
    chromaticLine.textContent = 'This graph needs at least ' + chromatic + ' colours.';
    updateVisuals(currentConflicts(), false);
    setMessage(note || 'Colour the nodes so no edge joins two of the same colour.');
  }

  // Backtracking colouring. Vertices are ordered by descending degree, and new
  // colour labels are introduced one at a time (symmetry breaking). With
  // requireAll=true the solution uses exactly maxColors colours.
  function solveColoring(edgeList, count, maxColors, requireAll) {
    var adj = [];
    for (var i = 0; i < count; i++) adj.push([]);
    edgeList.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });

    var order = [];
    for (var v = 0; v < count; v++) order.push(v);
    order.sort(function (a, b) { return adj[b].length - adj[a].length || a - b; });

    var assign = new Array(count);
    for (var k = 0; k < count; k++) assign[k] = -1;

    function allowed(vertex, color) {
      for (var t = 0; t < adj[vertex].length; t++) {
        if (assign[adj[vertex][t]] === color) return false;
      }
      return true;
    }

    function dfs(pos, used) {
      if (pos === order.length) return !requireAll || used === maxColors;
      var vertex = order[pos];
      var remaining = order.length - pos - 1;
      var maxC = Math.min(maxColors - 1, used);
      for (var c = 0; c <= maxC; c++) {
        if (!allowed(vertex, c)) continue;
        var nextUsed = (c === used) ? used + 1 : used;
        if (requireAll && nextUsed + remaining < maxColors) continue;
        assign[vertex] = c;
        if (dfs(pos + 1, nextUsed)) return true;
        assign[vertex] = -1;
      }
      return false;
    }

    return dfs(0, 0) ? assign : null;
  }

  function solutionIsValid(solution, edgeList) {
    for (var i = 0; i < edgeList.length; i++) {
      if (solution[edgeList[i][0]] === solution[edgeList[i][1]]) return false;
    }
    return true;
  }

  // Exact chromatic number: the smallest k for which a proper colouring exists.
  function chromaticNumber(edgeList, count) {
    for (var k = 1; k <= count; k++) {
      var solution = solveColoring(edgeList, count, k, false);
      if (solution && solutionIsValid(solution, edgeList)) return k;
    }
    return count;
  }

  btnNew.addEventListener('click', function () {
    var next = (presetIndex + 1) % PRESETS.length;
    loadPreset(next, 'New graph: ' + PRESETS[next].name + '. Colour it so no edge conflicts.');
  });

  btnCheck.addEventListener('click', function () {
    var conflicts = currentConflicts();
    if (conflicts.length === 0) {
      var used = colorsUsed(colors);
      if (used > chromatic) {
        setMessage(tooManyMessage(used), 'warn');
      } else {
        setMessage('Valid colouring! Every neighbouring pair differs — and you used the minimum ' + chromatic + ' colours.', 'ok');
      }
    } else {
      setMessage(conflicts.length + ' conflict' + (conflicts.length === 1 ? '' : 's') + ' remain — a dashed red edge joins equal colours.', 'bad');
    }
  });

  btnReset.addEventListener('click', function () {
    for (var i = 0; i < nodeCount; i++) colors[i] = 0;
    moves = 0;
    for (var j = 0; j < nodeCount; j++) applyColor(j, false);
    updateVisuals(currentConflicts(), false);
    setMessage('Colours reset. This graph needs at least ' + chromatic + ' colours — try again.');
  });

  btnSolution.addEventListener('click', function () {
    window.EPGate.withPassword(function () {
      var solution = solveColoring(edges, nodeCount, chromatic, true);
      if (!solution || !solutionIsValid(solution, edges) || colorsUsed(solution) !== chromatic) {
        setMessage('No verified colouring using exactly ' + chromatic + ' colours was found for this graph.', 'bad');
        return;
      }
      colors = solution.slice();
      moves++;
      var stagger = nodeCount >= 20 ? 12 : 50;
      for (var i = 0; i < nodeCount; i++) {
        var g = nodeEls[i];
        g.classList.remove('node--reveal');
        g.style.animationDelay = (i * stagger) + 'ms';
        applyColor(i, false);
        void g.getBoundingClientRect();
        g.classList.add('node--reveal');
        (function (el) {
          setTimeout(function () { el.classList.remove('node--reveal'); el.style.animationDelay = ''; }, 500 + i * stagger);
        }(g));
      }
      updateVisuals(currentConflicts(), false);
      setMessage('Verified proper colouring applied with exactly ' + chromatic + ' colours — every edge joins different colours.', 'ok');
    });
  });

  buildPresetSelect();
  buildLegend();
  loadPreset(0);
}());
