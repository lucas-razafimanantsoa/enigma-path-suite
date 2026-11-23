/* EnigmaPath exam builder (teacher). Needs the local server to save exams. */
(function () {
  'use strict';

  var X = window.EPExam;
  var M = window.EPMaze;
  var LIB = window.EP_MAZE_LEVELS || [];
  var $ = function (id) { return document.getElementById(id); };

  var st = { list: [], exam: null, dirty: false };
  var toastTimer = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function toast(msg, tone) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast is-visible' + (tone ? ' toast--' + tone : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3200);
  }
  function setDirty(v) {
    st.dirty = v;
    if (v) setMsg('Unsaved changes', '');
  }
  function setMsg(text, tone) {
    var m = $('save-msg');
    m.textContent = text;
    m.className = 'save-msg' + (tone ? ' is-' + tone : '');
  }
  function api(path, options) {
    return fetch(path, options).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || ('Server error ' + r.status));
        return d;
      });
    });
  }

  /* ----------------------------------------------------------- exam list */
  function refreshList() {
    if (location.protocol === 'file:') { $('server-hint').hidden = false; $('list-hint').textContent = 'Server not running.'; return Promise.resolve(); }
    return api('../api/exams').then(function (d) {
      st.list = d.exams;
      var ul = $('exam-list');
      ul.textContent = '';
      d.exams.forEach(function (e) {
        var li = el('li');
        var b = el('button');
        b.type = 'button';
        if (st.exam && st.exam.id === e.id) b.className = 'is-active';
        b.append(el('b', null, e.title), el('small', null, e.questions + ' questions'));
        b.addEventListener('click', function () { openExam(e.id); });
        li.appendChild(b);
        ul.appendChild(li);
      });
      $('list-hint').textContent = d.exams.length ? '' : 'No exams yet. Create the first one.';
    }).catch(function () { $('server-hint').hidden = false; $('list-hint').textContent = 'Server not reachable.'; });
  }

  function confirmLeave() {
    return !st.dirty || window.confirm('You have unsaved changes in the exam you are editing. Discard them?');
  }

  function blankQuestion() {
    return { id: X.newId('q'), text: '', options: ['', '', '', ''], correct: 0 };
  }
  function blankMaze() {
    var lv = LIB[0];
    return { type: 'maze', id: X.newId('m'), title: 'Maze 1', intro: 'Study the maze, then answer the questions.', maze: { name: 'Maze 1', map: lv.map.slice(), dir: lv.dir, from: 'library:' + lv.id }, questions: [] };
  }

  function newExam() {
    if (!confirmLeave()) return;
    var q = blankQuestion(); q.type = 'question';
    st.exam = { id: '', title: '', description: '', items: [q] };
    st.dirty = false;
    openEditor();
    setMsg('New exam, not saved yet', '');
  }

  function openExam(id) {
    if (!confirmLeave()) return;
    api('../api/exams/' + encodeURIComponent(id)).then(function (e) {
      e.items.forEach(function (it) { if (it.type === 'maze') it.maze.from = it.maze.from || 'custom'; });
      st.exam = e;
      st.dirty = false;
      openEditor();
      setMsg('', '');
      refreshList();
    }).catch(function (e) { toast(e.message, 'error'); });
  }

  /* -------------------------------------------------------------- editor */
  function openEditor() {
    $('empty').hidden = true;
    $('editor').hidden = false;
    $('savebar').hidden = false;
    $('ex-title').value = st.exam.title;
    $('ex-desc').value = st.exam.description || '';
    renderItems();
    window.scrollTo(0, 0);
  }

  function renderItems() {
    var scroll = window.scrollY;
    var host = $('items');
    host.textContent = '';
    var n = 0;
    var items = st.exam.items;
    items.forEach(function (it, i) {
      var card = el('div', 'card item' + (it.type === 'maze' ? ' maze-card' : ''));
      var head = el('div', 'item-head');
      var tools = el('div', 'tools');
      addTools(tools, items, i, function () { return clone(it); });
      if (it.type === 'question') {
        n++;
        head.appendChild(el('h3', null, 'Question ' + n));
        head.appendChild(tools);
        card.appendChild(head);
        card.appendChild(questionEditor(it, null));
      } else {
        head.appendChild(el('h3', null, 'Maze block: ' + (it.title || 'untitled')));
        head.appendChild(tools);
        card.appendChild(head);
        n = mazeBlock(card, it, n);
      }
      host.appendChild(card);
    });
    window.scrollTo(0, scroll);
  }

  function addTools(box, arr, i, copy) {
    var defs = [
      ['↑', 'Move up', function () { if (i > 0) { swap(arr, i, i - 1); } }],
      ['↓', 'Move down', function () { if (i < arr.length - 1) { swap(arr, i, i + 1); } }],
      ['Duplicate', 'Duplicate', function () { var c = copy(); reId(c); arr.splice(i + 1, 0, c); }],
      ['Delete', 'Delete', function () { if (window.confirm('Delete this item?')) arr.splice(i, 1); else return false; }]
    ];
    defs.forEach(function (d) {
      var b = el('button', 'btn' + (d[0] === 'Delete' ? ' btn--danger' : ''), d[0]);
      b.type = 'button'; b.title = d[1];
      b.addEventListener('click', function () {
        if (d[2]() === false) return;
        setDirty(true);
        renderItems();
      });
      box.appendChild(b);
    });
  }
  function swap(a, i, j) { var t = a[i]; a[i] = a[j]; a[j] = t; }
  function reId(o) {
    o.id = X.newId(o.type === 'maze' ? 'm' : 'q');
    if (o.questions) o.questions.forEach(function (q) { q.id = X.newId('q'); });
  }

  /* One multiple-choice question (used standalone and inside maze blocks). */
  function questionEditor(q, extra) {
    var box = el('div', extra ? 'q-block' : 'q-edit');
    if (extra) {
      var h = el('div', 'item-head');
      var title = el('h3', null, extra.label);
      if (q.auto) title.appendChild(el('span', 'tag', 'automatic'));
      h.appendChild(title);
      h.appendChild(extra.tools);
      box.appendChild(h);
    }
    var f = el('div', 'field');
    f.appendChild(el('label', null, 'Question'));
    var ta = el('textarea');
    ta.rows = 3; ta.maxLength = 1000; ta.value = q.text;
    ta.placeholder = 'Type the question here';
    ta.addEventListener('input', function () { q.text = ta.value; setDirty(true); });
    f.appendChild(ta);
    box.appendChild(f);

    var legend = el('p', 'legend', 'Answers: tick the circle next to the correct one. Their position is shuffled for every student.');
    box.appendChild(legend);
    var rows = el('div');
    var name = 'c-' + q.id;
    function renderOptions() {
      rows.textContent = '';
      q.options.forEach(function (text, i) {
        var r = el('div', 'opt-row');
        var radio = el('input'); radio.type = 'radio'; radio.name = name; radio.checked = q.correct === i;
        radio.setAttribute('aria-label', 'Correct answer: option ' + (i + 1));
        radio.addEventListener('change', function () { q.correct = i; setDirty(true); });
        var inp = el('input'); inp.type = 'text'; inp.value = text; inp.maxLength = 300; inp.placeholder = 'Answer ' + (i + 1);
        inp.addEventListener('input', function () { q.options[i] = inp.value; setDirty(true); });
        var x = el('button', 'btn btn--small x', '✕');
        x.type = 'button'; x.title = 'Remove this answer'; x.disabled = q.options.length <= 2;
        x.addEventListener('click', function () {
          q.options.splice(i, 1);
          if (q.correct === i) q.correct = 0; else if (q.correct > i) q.correct--;
          setDirty(true); renderOptions();
        });
        r.append(radio, inp, x);
        rows.appendChild(r);
      });
      add.disabled = q.options.length >= 6;
    }
    var add = el('button', 'btn btn--small', '+ Add an answer');
    add.type = 'button';
    add.addEventListener('click', function () { if (q.options.length < 6) { q.options.push(''); setDirty(true); renderOptions(); } });
    box.appendChild(rows);
    box.appendChild(add);
    renderOptions();
    return box;
  }

  /* A maze plus its questions. Returns the updated question counter. */
  function mazeBlock(card, it, n) {
    var f1 = el('div', 'field');
    f1.appendChild(el('label', null, 'Maze name (shown to students)'));
    var t = el('input'); t.type = 'text'; t.maxLength = 120; t.value = it.title;
    t.addEventListener('input', function () { it.title = t.value; it.maze.name = t.value; setDirty(true); });
    f1.appendChild(t);
    var f2 = el('div', 'field');
    f2.appendChild(el('label', null, 'Introduction (optional)'));
    var intro = el('textarea'); intro.rows = 2; intro.maxLength = 1000; intro.value = it.intro || '';
    intro.addEventListener('input', function () { it.intro = intro.value; setDirty(true); });
    f2.appendChild(intro);
    card.append(f1, f2);

    var sub = el('div', 'maze-sub');
    sub.appendChild(el('h4', null, 'The maze'));
    var host = el('div');
    sub.appendChild(host);
    var staleNote = el('p', 'stale');
    staleNote.hidden = true;
    staleNote.textContent = 'The maze changed after the automatic questions were made. Press "Recalculate automatic questions" so their answers match.';
    sub.appendChild(staleNote);
    card.appendChild(sub);

    var firstCall = true;
    var qBox = el('div', 'maze-sub');
    var errBox = el('p', 'error-text');
    errBox.hidden = true;

    window.setTimeout(function () {
      window.MazeEditor.create(host, it.maze, function (m, problems) {
        if (firstCall) { firstCall = false; return; }
        it.maze = { name: it.title, map: m.map, dir: m.dir, from: m.from };
        if (it.questions.some(function (q) { return q.auto; })) { it._stale = true; staleNote.hidden = false; }
        setDirty(true);
      });
    }, 0);

    qBox.appendChild(el('h4', null, 'Questions about this maze'));
    it.questions.forEach(function (q, j) {
      n++;
      var tools = el('div', 'tools');
      addTools(tools, it.questions, j, function () { return clone(q); });
      qBox.appendChild(questionEditor(q, { label: 'Question ' + n, tools: tools }));
    });

    var controls = el('div', 'auto-row');
    var sel = el('select');
    X.AUTO_KINDS.forEach(function (k) { var o = el('option', null, k.label); o.value = k.kind; sel.appendChild(o); });
    var addAuto = el('button', 'btn btn--primary', '+ Add automatic question');
    addAuto.type = 'button';
    addAuto.addEventListener('click', function () {
      var r = X.autoQuestion(sel.value, it.maze);
      if (r.error) { errBox.textContent = r.error; errBox.hidden = false; return; }
      it.questions.push({ id: X.newId('q'), text: r.text, options: r.options, correct: r.correct, auto: r.auto });
      setDirty(true); renderItems();
    });
    var addOwn = el('button', 'btn', '+ Write my own question');
    addOwn.type = 'button';
    addOwn.addEventListener('click', function () {
      var q = blankQuestion();
      q.text = '';
      it.questions.push(q);
      setDirty(true); renderItems();
    });
    var recalc = el('button', 'btn btn--small', 'Recalculate automatic questions');
    recalc.type = 'button';
    recalc.hidden = !it.questions.some(function (q) { return q.auto; });
    recalc.addEventListener('click', function () {
      var problems = [];
      it.questions.forEach(function (q) {
        if (!q.auto) return;
        var r = X.autoQuestion(q.auto, it.maze);
        if (r.error) problems.push(r.error); else { q.text = r.text; q.options = r.options; q.correct = r.correct; }
      });
      it._stale = false;
      if (problems.length) toast(problems[0], 'error');
      else toast('Automatic questions recalculated.', 'ok');
      setDirty(true); renderItems();
    });
    controls.append(sel, addAuto, addOwn, recalc);
    qBox.appendChild(controls);
    qBox.appendChild(errBox);
    qBox.appendChild(el('p', 'hint', 'Automatic questions are worked out from the maze; wrong answers are made up automatically. You can edit any of them afterwards.'));
    card.appendChild(qBox);
    if (it._stale) staleNote.hidden = false;
    return n;
  }

  /* -------------------------------------------------------------- saving */
  function cleaned() {
    var e = clone(st.exam);
    e.title = e.title.trim();
    e.items.forEach(function (it) {
      delete it._stale;
      if (it.type === 'maze') {
        it.maze.name = it.title;
        it.questions.forEach(tidy);
      } else tidy(it);
    });
    function tidy(q) {
      q.text = q.text.trim();
      q.options = q.options.map(function (o) { return o.trim(); });
      if (!q.auto) delete q.auto;
    }
    return e;
  }

  function save() {
    if (location.protocol === 'file:') { setMsg('The server is not running.', 'error'); return; }
    var e = cleaned();
    var err = X.validateExam(e);
    if (err) { setMsg(err, 'error'); toast(err, 'error'); return; }
    if (!e.id) {
      var base = X.slugify(e.title);
      var taken = st.list.map(function (x) { return x.id; });
      e.id = base + '-' + Math.random().toString(36).slice(2, 6);
      while (taken.indexOf(e.id) >= 0) e.id = base + '-' + Math.random().toString(36).slice(2, 6);
    }
    $('btn-save').disabled = true;
    api('../api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) })
      .then(function (r) {
        st.exam.id = r.id;
        st.dirty = false;
        setMsg('Saved ✓ (' + r.questions + ' questions)', 'ok');
        toast('Exam saved.', 'ok');
        return refreshList();
      })
      .catch(function (er) { setMsg('Not saved: ' + er.message, 'error'); toast('Not saved: ' + er.message, 'error'); })
      .then(function () { $('btn-save').disabled = false; });
  }

  function exportFile() {
    var e = cleaned();
    var blob = new Blob([JSON.stringify(e, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (X.slugify(e.title) || 'exam') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var e = JSON.parse(reader.result);
        if (!e || !Array.isArray(e.items)) throw new Error('This file is not an EnigmaPath exam.');
        if (!confirmLeave()) return;
        var taken = st.list.map(function (x) { return x.id; });
        if (!e.id || taken.indexOf(e.id) >= 0) e.id = '';
        e.description = e.description || '';
        st.exam = e;
        openEditor();
        setDirty(true);
        setMsg('Imported. Press Save exam to keep it.', '');
      } catch (er) { toast(er.message, 'error'); }
    };
    reader.readAsText(file);
  }

  /* ------------------------------------------------------- practice bank */
  var bankPicked = {};
  function openBank() {
    var sel = $('bank-level');
    if (!sel.options.length) {
      for (var n = 1; n <= 10; n++) { var o = el('option', null, 'Level ' + n); o.value = String(n); sel.appendChild(o); }
    }
    bankPicked = {};
    $('bank-modal').hidden = false;
    renderBank();
  }
  function renderBank() {
    var bank = window.QUESTION_BANK || {};
    var list = (bank['level' + $('bank-level').value] || []);
    var term = $('bank-search').value.trim().toLowerCase();
    var shown = list.filter(function (q) { return !term || q.question_text.toLowerCase().indexOf(term) >= 0; }).slice(0, 150);
    var box = $('bank-list');
    box.textContent = '';
    shown.forEach(function (q) {
      var lab = el('label', 'bank-item');
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!bankPicked[q.question_text];
      cb.addEventListener('change', function () { if (cb.checked) bankPicked[q.question_text] = q; else delete bankPicked[q.question_text]; });
      var d = el('div');
      d.append(q.question_text);
      d.appendChild(el('small', null, 'Answer: ' + q.options[q.correct_answer_index]));
      lab.append(cb, d);
      box.appendChild(lab);
    });
    $('bank-count').textContent = shown.length + ' shown' + (list.length > shown.length ? ' (of ' + list.length + ', type words to narrow down)' : '');
  }
  function addFromBank() {
    var picked = Object.keys(bankPicked).map(function (k) { return bankPicked[k]; });
    picked.forEach(function (q) {
      st.exam.items.push({ type: 'question', id: X.newId('q'), text: q.question_text, options: q.options.slice(), correct: q.correct_answer_index });
    });
    $('bank-modal').hidden = true;
    if (picked.length) { setDirty(true); renderItems(); toast(picked.length + ' question(s) added at the end.', 'ok'); }
  }

  /* -------------------------------------------------------------- events */
  $('btn-new').addEventListener('click', newExam);
  $('btn-save').addEventListener('click', save);
  $('btn-export').addEventListener('click', exportFile);
  $('file-import').addEventListener('change', function (e) { if (e.target.files[0]) importFile(e.target.files[0]); e.target.value = ''; });
  $('ex-title').addEventListener('input', function (e) { st.exam.title = e.target.value; setDirty(true); });
  $('ex-desc').addEventListener('input', function (e) { st.exam.description = e.target.value; setDirty(true); });
  $('add-q').addEventListener('click', function () { var q = blankQuestion(); q.type = 'question'; st.exam.items.push(q); setDirty(true); renderItems(); });
  $('add-maze').addEventListener('click', function () { st.exam.items.push(blankMaze()); setDirty(true); renderItems(); });
  $('add-bank').addEventListener('click', openBank);
  $('bank-level').addEventListener('change', renderBank);
  $('bank-search').addEventListener('input', renderBank);
  $('bank-add').addEventListener('click', addFromBank);
  $('bank-close').addEventListener('click', function () { $('bank-modal').hidden = true; });
  window.addEventListener('beforeunload', function (e) { if (st.dirty) { e.preventDefault(); e.returnValue = ''; } });

  $('savebar').hidden = true;
  refreshList();
}());
