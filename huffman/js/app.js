/* Huffman Coding Lab
 * Builds a genuine Huffman tree from character frequencies using a sorted-array
 * min-priority queue, then shows the codes, encoded bits, compression stats and
 * an SVG tree. Includes a decoder and a password-gated solution reveal. */
(function () {
  'use strict';

  var els = {
    textInput: document.getElementById('text-input'),
    buildHint: document.getElementById('build-hint'),
    btnBuild: document.getElementById('btn-build'),
    bars: document.getElementById('bars'),
    codeBody: document.getElementById('code-body'),
    treeHost: document.getElementById('tree-host'),
    encoded: document.getElementById('encoded'),
    statOrig: document.getElementById('stat-orig'),
    statEnc: document.getElementById('stat-enc'),
    statSaved: document.getElementById('stat-saved'),
    statAvg: document.getElementById('stat-avg'),
    decodeInput: document.getElementById('decode-input'),
    btnDecode: document.getElementById('btn-decode'),
    decodeOutput: document.getElementById('decode-output'),
    btnSolution: document.getElementById('btn-solution'),
    solutionNote: document.getElementById('solution-note')
  };

  var state = { text: '', freqs: Object.create(null), root: null, codes: Object.create(null), bits: '' };
  var HINT = 'Spaces count as characters too. Press Build tree to refresh after editing.';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function charLabel(ch) {
    if (ch === ' ') return '␣';
    if (ch === '\n') return '↵';
    return ch;
  }

  function freqMap(text) {
    var f = Object.create(null);
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      f[ch] = (f[ch] || 0) + 1;
    }
    return f;
  }

  function sortKeys(freqs) {
    return Object.keys(freqs).sort(function (a, b) {
      return freqs[b] - freqs[a] || a.localeCompare(b);
    });
  }

  /* Sorted-array min-priority queue: always merge the two least frequent nodes. */
  function buildHuffmanTree(freqs) {
    var keys = Object.keys(freqs);
    if (!keys.length) return null;
    var seq = 0;
    var queue = keys.map(function (ch) {
      return { freq: freqs[ch], char: ch, left: null, right: null, id: seq++ };
    });

    function sortQueue() {
      queue.sort(function (a, b) { return a.freq - b.freq || a.id - b.id; });
    }

    sortQueue();
    while (queue.length > 1) {
      var a = queue.shift();
      var b = queue.shift();
      queue.push({ freq: a.freq + b.freq, char: null, left: a, right: b, id: seq++ });
      sortQueue();
    }
    return queue[0];
  }

  function makeCodes(root) {
    var codes = Object.create(null);
    if (!root) return codes;
    /* One distinct symbol: a single leaf gets the code "0". */
    if (!root.left && !root.right) {
      codes[root.char] = '0';
      return codes;
    }
    function walk(node, code) {
      if (!node.left && !node.right) {
        codes[node.char] = code || '0';
        return;
      }
      if (node.left) walk(node.left, code + '0');
      if (node.right) walk(node.right, code + '1');
    }
    walk(root, '');
    return codes;
  }

  function encode(text, codes) {
    var out = '';
    for (var i = 0; i < text.length; i++) out += codes[text.charAt(i)] || '';
    return out;
  }

  function decode(bits, root) {
    if (!root) throw new Error('Build a tree first.');
    if (!/^[01]+$/.test(bits)) throw new Error('Use only the bits 0 and 1.');
    if (!root.left && !root.right) {
      if (bits.indexOf('1') !== -1) throw new Error('That bit is not valid for this one-symbol tree.');
      return root.char.repeat(bits.length);
    }
    var out = '';
    var node = root;
    for (var i = 0; i < bits.length; i++) {
      node = bits.charAt(i) === '0' ? node.left : node.right;
      if (!node) throw new Error('Invalid bit at position ' + (i + 1) + '.');
      if (!node.left && !node.right) {
        out += node.char;
        node = root;
      }
    }
    if (node !== root) throw new Error('The bit string ended in the middle of a code.');
    return out;
  }

  function renderBars(freqs) {
    var keys = sortKeys(freqs);
    var max = Math.max.apply(null, keys.map(function (k) { return freqs[k]; }));
    var host = els.bars;
    host.innerHTML = '';
    keys.forEach(function (ch, idx) {
      var row = document.createElement('div');
      row.className = 'bar-row';
      var pct = (freqs[ch] / max * 100).toFixed(1);
      row.innerHTML =
        '<span class="bar-label">' + esc(charLabel(ch)) + '</span>' +
        '<div class="bar-track"><i class="bar-fill" style="--w:' + pct + '%;--delay:' + (idx * 45) + 'ms"></i></div>' +
        '<span class="bar-count">' + freqs[ch] + '</span>';
      host.appendChild(row);
    });
  }

  function renderTable(freqs, codes) {
    var tbody = els.codeBody;
    tbody.innerHTML = '';
    sortKeys(freqs).forEach(function (ch, idx) {
      var tr = document.createElement('tr');
      tr.style.setProperty('--delay', (idx * 35) + 'ms');
      var code = codes[ch] || '';
      tr.innerHTML =
        '<td><span class="chip">' + esc(charLabel(ch)) + '</span></td>' +
        '<td>' + freqs[ch] + '</td>' +
        '<td class="code-cell">' + esc(code) + '</td>' +
        '<td class="bits-cell">' + code.length + '</td>';
      tbody.appendChild(tr);
    });
  }

  function renderEncoded(text, codes) {
    var html = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      html += '<span class="bit-chunk" style="--delay:' + (i * 22) + 'ms" title="' + esc(charLabel(ch)) + '">' +
        esc(codes[ch] || '') + '</span>';
    }
    els.encoded.innerHTML = html;
  }

  function renderStats(text, bitCount) {
    var orig = text.length * 8;
    var saved = orig > 0 ? (1 - bitCount / orig) * 100 : 0;
    if (saved < 0) saved = 0;
    els.statOrig.textContent = orig;
    els.statEnc.textContent = bitCount;
    els.statSaved.textContent = saved.toFixed(1) + '%';
    els.statAvg.textContent = text.length ? (bitCount / text.length).toFixed(2) : '0.00';
  }

  function countLeaves(node) {
    if (!node) return 0;
    if (!node.left && !node.right) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
  }

  /* Assign leaves left-to-right; an internal node sits above its children. */
  function layout(root) {
    var leafX = 0;
    var maxDepth = 0;
    function visit(node, depth) {
      if (depth > maxDepth) maxDepth = depth;
      if (!node.left && !node.right) {
        node.x = leafX++;
        node.y = depth;
      } else {
        if (node.left) visit(node.left, depth + 1);
        if (node.right) visit(node.right, depth + 1);
        node.x = node.left && node.right
          ? (node.left.x + node.right.x) / 2
          : (node.left ? node.left.x : node.right.x);
        node.y = depth;
      }
    }
    visit(root, 0);
    return maxDepth;
  }

  function drawTree(root) {
    if (!root) {
      els.treeHost.innerHTML = '<p class="tree-empty">Build a tree to see the diagram here.</p>';
      return;
    }
    var maxDepth = layout(root);
    var X = 78;
    var Y = 78;
    var PAD = 46;
    var width = Math.max(300, countLeaves(root) * X + PAD * 2);
    var height = (maxDepth + 1) * Y + PAD * 2;
    var edges = [];
    var nodes = [];

    function px(node) { return PAD + node.x * X; }
    function py(node) { return PAD + node.y * Y; }

    function edge(parent, child, bit) {
      var x1 = px(parent);
      var y1 = py(parent);
      var x2 = px(child);
      var y2 = py(child);
      edges.push('<line class="tree-edge" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>');
      edges.push('<text class="tree-bit" x="' + ((x1 + x2) / 2) + '" y="' + ((y1 + y2) / 2 - 6) + '">' + bit + '</text>');
    }

    function draw(node) {
      if (node.left) edge(node, node.left, '0');
      if (node.right) edge(node, node.right, '1');
      var x = px(node);
      var y = py(node);
      if (!node.left && !node.right) {
        nodes.push('<g class="tree-leaf">' +
          '<rect x="' + (x - 27) + '" y="' + (y - 19) + '" width="54" height="38" rx="8"/>' +
          '<text class="leaf-char" x="' + x + '" y="' + (y - 1) + '">' + esc(charLabel(node.char)) + '</text>' +
          '<text class="leaf-freq" x="' + x + '" y="' + (y + 13) + '">' + node.freq + '</text>' +
          '</g>');
      } else {
        nodes.push('<g class="tree-internal">' +
          '<circle cx="' + x + '" cy="' + y + '" r="19"/>' +
          '<text class="internal-freq" x="' + x + '" y="' + (y + 4) + '">' + node.freq + '</text>' +
          '</g>');
      }
      if (node.left) draw(node.left);
      if (node.right) draw(node.right);
    }

    draw(root);
    els.treeHost.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height +
      '" width="' + width + '" height="' + height + '" role="img" aria-label="Huffman tree with 0 and 1 edge labels">' +
      edges.join('') + nodes.join('') + '</svg>';
  }

  function build() {
    var text = els.textInput.value;
    if (text.length === 0) {
      els.buildHint.textContent = 'Type at least one character first.';
      els.buildHint.classList.add('is-error');
      return false;
    }
    els.buildHint.textContent = HINT;
    els.buildHint.classList.remove('is-error');

    var freqs = freqMap(text);
    var root = buildHuffmanTree(freqs);
    var codes = makeCodes(root);
    var bits = encode(text, codes);

    state.text = text;
    state.freqs = freqs;
    state.root = root;
    state.codes = codes;
    state.bits = bits;

    renderBars(freqs);
    renderTable(freqs, codes);
    renderEncoded(text, codes);
    renderStats(text, bits.length);
    drawTree(root);

    els.decodeOutput.textContent = 'Tree ready — enter bits to decode.';
    els.decodeOutput.className = 'decode-output';
    return true;
  }

  function runDecode() {
    var bits = els.decodeInput.value.trim();
    try {
      if (!bits) throw new Error('Enter a bit string to decode.');
      var out = decode(bits, state.root);
      els.decodeOutput.textContent = 'Decoded: ' + (out === '' ? '(empty)' : out);
      els.decodeOutput.className = 'decode-output is-ok';
    } catch (err) {
      els.decodeOutput.textContent = 'Error: ' + err.message;
      els.decodeOutput.className = 'decode-output is-error';
    }
  }

  function init() {
    els.bars.innerHTML = '<p class="tree-empty">Press Build tree to see the frequency chart.</p>';
    els.codeBody.innerHTML = '<tr><td colspan="4" class="tree-empty">No codes yet — press Build tree.</td></tr>';
    drawTree(null);
    els.encoded.innerHTML = '<span class="muted">No encoded bits yet — press Build tree.</span>';

    els.btnBuild.addEventListener('click', build);
    els.btnDecode.addEventListener('click', runDecode);
    els.decodeInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); runDecode(); }
    });
    els.btnSolution.addEventListener('click', function () {
      window.EPGate.withPassword(function () {
        if (build()) els.solutionNote.hidden = false;
      });
    });
  }

  init();
}());
