/* EnigmaPath maze library (shared by Guide the Robot and the Exam builder).
 *
 * Works in a browser (window.EPMaze) and in Node (module.exports).
 * No DOM access except toSVG(), which only builds a string.
 *
 * Map format (array of equal-length strings):
 *   '#' wall   '.' floor   'S' robot start   'G' goal
 * The robot starts on S facing `dir` ('N' | 'E' | 'S' | 'W').
 *
 * Robot rules (orientation mode):
 *   F = move one cell forward (blocked by walls and by the outside edge)
 *   L = turn 90 degrees anticlockwise (never moves the robot)
 *   R = turn 90 degrees clockwise (never moves the robot)
 */
(function (root, factory) {
  'use strict';
  var lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.EPMaze = lib;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIRS = ['N', 'E', 'S', 'W'];
  var DR = [-1, 0, 1, 0];
  var DC = [0, 1, 0, -1];
  var DIR_NAMES = { N: 'north', E: 'east', S: 'south', W: 'west' };

  /* ---------------------------------------------------------------- parse */

  function parse(map, dir) {
    if (!Array.isArray(map) || map.length < 3) throw new Error('Maze needs at least 3 rows.');
    var rows = map.length;
    var cols = map[0].length;
    var open = [];
    var start = null;
    var goal = null;
    for (var r = 0; r < rows; r++) {
      var line = map[r];
      if (typeof line !== 'string' || line.length !== cols) throw new Error('Row ' + (r + 1) + ' has a different length.');
      var row = [];
      for (var c = 0; c < cols; c++) {
        var ch = line.charAt(c);
        if (ch !== '#' && ch !== '.' && ch !== 'S' && ch !== 'G') throw new Error('Unknown tile "' + ch + '" at row ' + (r + 1) + ', column ' + (c + 1) + '.');
        if (ch === 'S') { if (start) throw new Error('More than one start (S).'); start = { r: r, c: c }; }
        if (ch === 'G') { if (goal) throw new Error('More than one goal (G).'); goal = { r: r, c: c }; }
        row.push(ch === '#' ? 0 : 1);
      }
      open.push(row);
    }
    if (!start) throw new Error('The maze has no start (S).');
    if (!goal) throw new Error('The maze has no goal (G).');
    var d = DIRS.indexOf(dir || 'N');
    if (d < 0) throw new Error('Start direction must be N, E, S or W.');
    return { rows: rows, cols: cols, open: open, start: start, goal: goal, dir: d };
  }

  function toMap(maze) {
    var out = [];
    for (var r = 0; r < maze.rows; r++) {
      var s = '';
      for (var c = 0; c < maze.cols; c++) {
        if (r === maze.start.r && c === maze.start.c) s += 'S';
        else if (r === maze.goal.r && c === maze.goal.c) s += 'G';
        else s += maze.open[r][c] ? '.' : '#';
      }
      out.push(s);
    }
    return out;
  }

  function isOpen(maze, r, c) {
    return r >= 0 && c >= 0 && r < maze.rows && c < maze.cols && maze.open[r][c] === 1;
  }

  function degree(maze, r, c) {
    var n = 0;
    for (var d = 0; d < 4; d++) if (isOpen(maze, r + DR[d], c + DC[d])) n++;
    return n;
  }

  /* ------------------------------------------------------------ simulation */

  function turnLeft(d) { return (d + 3) % 4; }
  function turnRight(d) { return (d + 1) % 4; }

  /* Execute one instruction. Returns { r, c, d, ok, error }.
   * error is 'wall' (hit a wall) or 'edge' (left the maze) when ok is false. */
  function step(maze, state, ins) {
    if (ins === 'L') return { r: state.r, c: state.c, d: turnLeft(state.d), ok: true };
    if (ins === 'R') return { r: state.r, c: state.c, d: turnRight(state.d), ok: true };
    var nr = state.r + DR[state.d];
    var nc = state.c + DC[state.d];
    if (nr < 0 || nc < 0 || nr >= maze.rows || nc >= maze.cols) return { r: state.r, c: state.c, d: state.d, ok: false, error: 'edge' };
    if (!maze.open[nr][nc]) return { r: state.r, c: state.c, d: state.d, ok: false, error: 'wall' };
    return { r: nr, c: nc, d: state.d, ok: true };
  }

  /* Run a whole program (array or string of F/L/R). */
  function run(maze, program) {
    var prog = typeof program === 'string' ? program.split('') : program;
    var st = { r: maze.start.r, c: maze.start.c, d: maze.dir };
    var path = [{ r: st.r, c: st.c }];
    for (var i = 0; i < prog.length; i++) {
      var res = step(maze, st, prog[i]);
      if (!res.ok) return { ok: false, error: res.error, failedAt: i, state: st, path: path, reachedGoal: false };
      st = { r: res.r, c: res.c, d: res.d };
      if (res.r !== path[path.length - 1].r || res.c !== path[path.length - 1].c) path.push({ r: st.r, c: st.c });
    }
    return { ok: true, state: st, path: path, reachedGoal: st.r === maze.goal.r && st.c === maze.goal.c };
  }

  /* -------------------------------------------------------------- solving */

  /* Shortest program (fewest instructions) under the exact robot rules (BFS over r, c, direction).
   * Returns { program: 'FFLF...', length, forward, turns } or null when unsolvable. */
  function solve(maze) {
    var R = maze.rows, C = maze.cols;
    var total = R * C * 4;
    var prev = new Int32Array(total).fill(-2);
    var how = new Uint8Array(total);
    var idx = function (r, c, d) { return (r * C + c) * 4 + d; };
    var q = new Int32Array(total);
    var head = 0, tail = 0;
    var s = idx(maze.start.r, maze.start.c, maze.dir);
    prev[s] = -1;
    q[tail++] = s;
    var found = -1;
    while (head < tail) {
      var cur = q[head++];
      var d = cur % 4;
      var cell = (cur - d) / 4;
      var c = cell % C;
      var r = (cell - c) / C;
      if (r === maze.goal.r && c === maze.goal.c) { found = cur; break; }
      var nexts = [
        [idx(r, c, turnLeft(d)), 1],
        [idx(r, c, turnRight(d)), 2]
      ];
      var nr = r + DR[d], nc = c + DC[d];
      if (isOpen(maze, nr, nc)) nexts.push([idx(nr, nc, d), 0]);
      for (var i = 0; i < nexts.length; i++) {
        var n = nexts[i][0];
        if (prev[n] === -2) { prev[n] = cur; how[n] = nexts[i][1]; q[tail++] = n; }
      }
    }
    if (found < 0) return null;
    var letters = [];
    for (var at = found; prev[at] !== -1; at = prev[at]) letters.push('FLR'.charAt(how[at]));
    letters.reverse();
    var program = letters.join('');
    var forward = letters.filter(function (x) { return x === 'F'; }).length;
    return { program: program, length: program.length, forward: forward, turns: program.length - forward };
  }

  /* Fewest turn instructions over ALL programs that reach the goal (0-1 BFS: F costs 0, L/R cost 1). */
  function minTurns(maze) {
    var R = maze.rows, C = maze.cols;
    var INF = 1e9;
    var dist = new Int32Array(R * C * 4).fill(INF);
    var idx = function (r, c, d) { return (r * C + c) * 4 + d; };
    var first = idx(maze.start.r, maze.start.c, maze.dir);
    dist[first] = 0;
    var layer = [first];
    var turns = 0;
    while (layer.length) {
      var next = [];
      var stack = layer.slice();
      while (stack.length) {
        var cur = stack.pop();
        if (dist[cur] !== turns) continue;
        var d = cur % 4;
        var cell = (cur - d) / 4;
        var c = cell % C;
        var r = (cell - c) / C;
        if (r === maze.goal.r && c === maze.goal.c) return turns;
        var nr = r + DR[d], nc = c + DC[d];
        if (isOpen(maze, nr, nc)) {
          var f = idx(nr, nc, d);
          if (dist[f] > turns) { dist[f] = turns; stack.push(f); }
        }
        var t1 = idx(r, c, turnLeft(d)), t2 = idx(r, c, turnRight(d));
        if (dist[t1] > turns + 1) { dist[t1] = turns + 1; next.push(t1); }
        if (dist[t2] > turns + 1) { dist[t2] = turns + 1; next.push(t2); }
      }
      layer = next;
      turns++;
    }
    return null;
  }

  /* BFS distances (in cells) from a cell over open cells. -1 = unreachable. */
  function cellDistances(maze, from) {
    var dist = [];
    for (var r = 0; r < maze.rows; r++) dist.push(new Array(maze.cols).fill(-1));
    var q = [[from.r, from.c]];
    dist[from.r][from.c] = 0;
    for (var h = 0; h < q.length; h++) {
      var cr = q[h][0], cc = q[h][1];
      for (var d = 0; d < 4; d++) {
        var nr = cr + DR[d], nc = cc + DC[d];
        if (isOpen(maze, nr, nc) && dist[nr][nc] < 0) { dist[nr][nc] = dist[cr][cc] + 1; q.push([nr, nc]); }
      }
    }
    return dist;
  }

  /* Number of distinct shortest cell-paths from start to goal (capped). */
  function countShortestPaths(maze) {
    var dist = cellDistances(maze, maze.start);
    var gd = dist[maze.goal.r][maze.goal.c];
    if (gd < 0) return 0;
    var ways = [];
    for (var r = 0; r < maze.rows; r++) ways.push(new Array(maze.cols).fill(0));
    ways[maze.start.r][maze.start.c] = 1;
    var order = [];
    for (var r2 = 0; r2 < maze.rows; r2++) for (var c2 = 0; c2 < maze.cols; c2++) if (dist[r2][c2] >= 0 && dist[r2][c2] <= gd) order.push([r2, c2]);
    order.sort(function (a, b) { return dist[a[0]][a[1]] - dist[b[0]][b[1]]; });
    for (var i = 0; i < order.length; i++) {
      var cr = order[i][0], cc = order[i][1];
      for (var d = 0; d < 4; d++) {
        var nr = cr + DR[d], nc = cc + DC[d];
        if (isOpen(maze, nr, nc) && dist[nr][nc] === dist[cr][cc] + 1) ways[nr][nc] = Math.min(ways[nr][nc] + ways[cr][cc], 1e9);
      }
    }
    return ways[maze.goal.r][maze.goal.c];
  }

  /* Number of simple (non-self-crossing) routes start -> goal. Capped so large mazes stay fast.
   * Returns { count, capped }. */
  function countSimplePaths(maze, cap, stepCap) {
    cap = cap || 1000;
    stepCap = stepCap || 3000000;
    var seen = [];
    for (var r = 0; r < maze.rows; r++) seen.push(new Array(maze.cols).fill(false));
    var count = 0, steps = 0, capped = false;
    var stack = [{ r: maze.start.r, c: maze.start.c, d: 0 }];
    seen[maze.start.r][maze.start.c] = true;
    while (stack.length && !capped) {
      var top = stack[stack.length - 1];
      if (top.r === maze.goal.r && top.c === maze.goal.c && top.d === 0) {
        count++;
        if (count >= cap) { capped = true; break; }
        top.d = 4;
      }
      if (top.d >= 4) { seen[top.r][top.c] = false; stack.pop(); continue; }
      var d = top.d++;
      if (++steps > stepCap) { capped = true; break; }
      var nr = top.r + DR[d], nc = top.c + DC[d];
      if (isOpen(maze, nr, nc) && !seen[nr][nc]) {
        seen[nr][nc] = true;
        stack.push({ r: nr, c: nc, d: 0 });
      }
    }
    return { count: count, capped: capped };
  }

  /* Maximum number of routes from start to goal that share no corridor (edge-disjoint paths, unit-capacity max flow). */
  function independentRoutes(maze, cap) {
    cap = cap || 8;
    var R = maze.rows, C = maze.cols, N = R * C;
    var flow = new Map(); // key u*N+v -> flow on directed edge u->v (+1 / -1)
    var key = function (u, v) { return u * N + v; };
    var get = function (u, v) { return flow.get(key(u, v)) || 0; };
    var s = maze.start.r * C + maze.start.c, t = maze.goal.r * C + maze.goal.c;
    var total = 0;
    while (total < cap) {
      var parent = new Int32Array(N).fill(-1);
      parent[s] = s;
      var q = [s];
      for (var h = 0; h < q.length && parent[t] < 0; h++) {
        var u = q[h];
        var ur = Math.floor(u / C), uc = u % C;
        for (var d = 0; d < 4; d++) {
          var nr = ur + DR[d], nc = uc + DC[d];
          if (!isOpen(maze, nr, nc)) continue;
          var v = nr * C + nc;
          if (parent[v] >= 0) continue;
          // undirected unit edge: residual capacity 1 - flow(u,v) where flow(u,v) = -flow(v,u)
          if (1 - get(u, v) > 0) { parent[v] = u; q.push(v); }
        }
      }
      if (parent[t] < 0) break;
      for (var v2 = t; v2 !== s; v2 = parent[v2]) {
        var u2 = parent[v2];
        flow.set(key(u2, v2), get(u2, v2) + 1);
        flow.set(key(v2, u2), get(v2, u2) - 1);
      }
      total++;
    }
    return total;
  }

  /* All the numbers a teacher might ask about. */
  function analyze(maze) {
    var open = 0, edges = 0, deadEnds = 0, junctions = 0;
    for (var r = 0; r < maze.rows; r++) {
      for (var c = 0; c < maze.cols; c++) {
        if (!maze.open[r][c]) continue;
        open++;
        var dg = degree(maze, r, c);
        edges += dg;
        var isEnd = (r === maze.start.r && c === maze.start.c) || (r === maze.goal.r && c === maze.goal.c);
        if (dg === 1 && !isEnd) deadEnds++;
        if (dg >= 3) junctions++;
      }
    }
    edges = edges / 2;
    var dist = cellDistances(maze, maze.start);
    var reachable = 0;
    for (var rr = 0; rr < maze.rows; rr++) for (var cc = 0; cc < maze.cols; cc++) if (dist[rr][cc] >= 0) reachable++;
    // loops (independent cycles) = edges - vertices + connected components, counted over the whole open area
    var comps = countComponents(maze);
    var sol = solve(maze);
    var simple = countSimplePaths(maze, 1000);
    return {
      rows: maze.rows,
      cols: maze.cols,
      openCells: open,
      solvable: !!sol,
      cellDistance: dist[maze.goal.r][maze.goal.c],
      fewestInstructions: sol ? sol.length : null,
      forwardMoves: sol ? sol.forward : null,
      turnsInFewestInstructions: sol ? sol.turns : null,
      fewestTurns: minTurns(maze),
      shortestPathCount: countShortestPaths(maze),
      loops: edges - open + comps,
      deadEnds: deadEnds,
      junctions: junctions,
      routes: simple.count,
      routesCapped: simple.capped,
      independentRoutes: independentRoutes(maze, 8),
      bestProgram: sol ? sol.program : null,
      unreachableOpenCells: open - reachable
    };
  }

  function countComponents(maze) {
    var seen = [];
    for (var r = 0; r < maze.rows; r++) seen.push(new Array(maze.cols).fill(false));
    var comps = 0;
    for (var r0 = 0; r0 < maze.rows; r0++) {
      for (var c0 = 0; c0 < maze.cols; c0++) {
        if (!maze.open[r0][c0] || seen[r0][c0]) continue;
        comps++;
        var q = [[r0, c0]];
        seen[r0][c0] = true;
        for (var h = 0; h < q.length; h++) {
          for (var d = 0; d < 4; d++) {
            var nr = q[h][0] + DR[d], nc = q[h][1] + DC[d];
            if (isOpen(maze, nr, nc) && !seen[nr][nc]) { seen[nr][nc] = true; q.push([nr, nc]); }
          }
        }
      }
    }
    return comps;
  }

  /* Check a map typed or drawn by a teacher. Returns an array of problems (empty = fine). */
  function check(map, dir) {
    var maze;
    try { maze = parse(map, dir); } catch (e) { return [e.message]; }
    var problems = [];
    if (!solve(maze)) problems.push('The robot cannot reach the goal from the start.');
    return problems;
  }

  /* ------------------------------------------------------------ generation */

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Build a maze of (2*cellsR+1) x (2*cellsC+1) tiles: a random perfect maze, then `braid` (0..1) is the share of
   * dividing walls knocked down to create loops (= several different routes). Start and goal are chosen far apart. */
  function generate(cellsR, cellsC, seed, braid) {
    var rand = rng(seed);
    var R = cellsR * 2 + 1, C = cellsC * 2 + 1;
    var g = [];
    for (var r = 0; r < R; r++) g.push(new Array(C).fill(0));
    var stack = [[1, 1]];
    g[1][1] = 1;
    while (stack.length) {
      var cur = stack[stack.length - 1];
      var opts = [];
      for (var d = 0; d < 4; d++) {
        var nr = cur[0] + DR[d] * 2, nc = cur[1] + DC[d] * 2;
        if (nr > 0 && nc > 0 && nr < R - 1 && nc < C - 1 && !g[nr][nc]) opts.push(d);
      }
      if (!opts.length) { stack.pop(); continue; }
      var pick = opts[Math.floor(rand() * opts.length)];
      g[cur[0] + DR[pick]][cur[1] + DC[pick]] = 1;
      g[cur[0] + DR[pick] * 2][cur[1] + DC[pick] * 2] = 1;
      stack.push([cur[0] + DR[pick] * 2, cur[1] + DC[pick] * 2]);
    }
    var walls = [];
    for (var r2 = 1; r2 < R - 1; r2++) {
      for (var c2 = 1; c2 < C - 1; c2++) {
        if (g[r2][c2]) continue;
        var horiz = r2 % 2 === 1 && c2 % 2 === 0 && g[r2][c2 - 1] && g[r2][c2 + 1];
        var vert = r2 % 2 === 0 && c2 % 2 === 1 && g[r2 - 1][c2] && g[r2 + 1][c2];
        if (horiz || vert) walls.push([r2, c2]);
      }
    }
    for (var i = walls.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = walls[i]; walls[i] = walls[j]; walls[j] = tmp;
    }
    var knock = Math.round(walls.length * braid);
    for (var k = 0; k < knock; k++) g[walls[k][0]][walls[k][1]] = 1;

    // start in the bottom-left corner cell; goal = the farthest cell by BFS distance
    var tmpMaze = { rows: R, cols: C, open: g, start: { r: R - 2, c: 1 }, goal: { r: 1, c: C - 2 } };
    var dist = cellDistances(tmpMaze, tmpMaze.start);
    var best = null, bestD = -1;
    for (var r3 = 1; r3 < R - 1; r3 += 2) {
      for (var c3 = 1; c3 < C - 1; c3 += 2) {
        if (dist[r3][c3] > bestD) { bestD = dist[r3][c3]; best = { r: r3, c: c3 }; }
      }
    }
    var map = [];
    for (var r4 = 0; r4 < R; r4++) {
      var line = '';
      for (var c4 = 0; c4 < C; c4++) {
        if (r4 === tmpMaze.start.r && c4 === tmpMaze.start.c) line += 'S';
        else if (r4 === best.r && c4 === best.c) line += 'G';
        else line += g[r4][c4] ? '.' : '#';
      }
      map.push(line);
    }
    // start direction: face a wall about half the time so that turning matters straight away
    var dir = 'N';
    var startOpen = [];
    for (var dd = 0; dd < 4; dd++) if (isOpen(tmpMaze, tmpMaze.start.r + DR[dd], tmpMaze.start.c + DC[dd])) startOpen.push(dd);
    var wallDirs = [0, 1, 2, 3].filter(function (x) { return startOpen.indexOf(x) < 0; });
    var pool = rand() < 0.5 && wallDirs.length ? wallDirs : startOpen;
    dir = DIRS[pool[Math.floor(rand() * pool.length)]];
    return { map: map, dir: dir };
  }

  /* ---------------------------------------------------------------- SVG */

  /* Draw a maze as an SVG string (used by the exam pages). opts: cell (px), robot (bool), path (array of {r,c}) */
  function toSVG(maze, opts) {
    opts = opts || {};
    var cs = opts.cell || 18;
    var W = maze.cols * cs, H = maze.rows * cs;
    var out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + (opts.width || W) + '" role="img" aria-label="' + (opts.label || 'Maze') + '">'];
    out.push('<rect width="' + W + '" height="' + H + '" fill="#4682B4"/>');
    for (var r = 0; r < maze.rows; r++) {
      for (var c = 0; c < maze.cols; c++) {
        if (maze.open[r][c]) out.push('<rect x="' + c * cs + '" y="' + r * cs + '" width="' + cs + '" height="' + cs + '" fill="#E0FFFF" stroke="#4682B4" stroke-width="0.5"/>');
        else out.push('<rect x="' + c * cs + '" y="' + r * cs + '" width="' + cs + '" height="' + cs + '" fill="#B0E0E6"/>');
      }
    }
    if (opts.path && opts.path.length) {
      var pts = opts.path.map(function (p) { return (p.c * cs + cs / 2) + ',' + (p.r * cs + cs / 2); }).join(' ');
      out.push('<polyline points="' + pts + '" fill="none" stroke="#87CEEB" stroke-width="' + Math.max(2, cs / 5) + '" stroke-linecap="round" stroke-linejoin="round"/>');
    }
    var gx = maze.goal.c * cs, gy = maze.goal.r * cs;
    out.push('<rect x="' + (gx + cs * 0.15) + '" y="' + (gy + cs * 0.15) + '" width="' + cs * 0.7 + '" height="' + cs * 0.7 + '" rx="' + cs * 0.15 + '" fill="#E0FFFF" stroke="#1E3D56" stroke-width="1"/>');
    out.push('<text x="' + (gx + cs / 2) + '" y="' + (gy + cs * 0.7) + '" font-size="' + cs * 0.55 + '" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#1E3D56">G</text>');
    if (opts.robot !== false) {
      var cx = maze.start.c * cs + cs / 2, cy = maze.start.r * cs + cs / 2;
      var rot = [0, 90, 180, 270][maze.dir];
      out.push('<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rot + ')">' +
        '<circle r="' + cs * 0.38 + '" fill="#1E3D56"/>' +
        '<polygon points="0,' + -cs * 0.32 + ' ' + cs * 0.2 + ',' + cs * 0.08 + ' ' + -cs * 0.2 + ',' + cs * 0.08 + '" fill="#E0FFFF"/></g>');
    }
    out.push('</svg>');
    return out.join('');
  }

  return {
    DIRS: DIRS, DR: DR, DC: DC, DIR_NAMES: DIR_NAMES,
    parse: parse, toMap: toMap, isOpen: isOpen, degree: degree,
    step: step, run: run, solve: solve, minTurns: minTurns,
    cellDistances: cellDistances, countShortestPaths: countShortestPaths,
    countSimplePaths: countSimplePaths, independentRoutes: independentRoutes,
    analyze: analyze, check: check, generate: generate, rng: rng, toSVG: toSVG
  };
}));
