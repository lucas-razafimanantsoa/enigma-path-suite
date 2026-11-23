/* EnigmaPath marking page (teacher). MCQ marks are automatic; open answers are marked here. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var all = [];
  var exams = [];
  var current = null;
  var toastTimer = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function toast(msg, tone) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast is-visible' + (tone ? ' toast--' + tone : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3500);
  }
  function api(path, options) {
    return fetch(path, options).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || ('Server error ' + r.status));
        return d;
      });
    });
  }
  function fmtTime(s) { return s === null || s === undefined ? '' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s'; }
  function statusOf(r) {
    if (r.status === 'auto-marked') return 'auto';
    if (r.marked) return 'marked';
    if (r.status === 'pending') return 'pending';
    return 'unmarked';
  }
  function statusLabel(r) {
    var s = statusOf(r);
    return s === 'auto' ? 'Auto-marked' : s === 'marked' ? 'Marked' : s === 'pending' ? 'Pending marking' : 'Unmarked';
  }
  function scoreInfo(r) {
    var marked = r.marked === true && typeof r.finalScore === 'number';
    return {
      marked: marked,
      score: marked ? r.finalScore : r.score,
      pct: marked ? r.finalPercent : r.percent,
      symbol: marked ? r.symbol : (r.status === 'auto-marked' ? r.symbol : ''),
      pending: !marked && r.status === 'pending'
    };
  }

  /* ------------------------------------------------------------------ load */
  function load() {
    if (location.protocol === 'file:') {
      $('marking-empty').textContent = 'Start the EnigmaPath server (start.bat / start.sh) to mark exams.';
      return Promise.resolve();
    }
    return Promise.all([api('../api/results'), api('../api/exams')]).then(function (rs) {
      all = rs[0].results;
      exams = rs[1].exams;
      fillFilters();
      render();
    }).catch(function (e) {
      $('marking-empty').textContent = 'Could not load submissions: ' + e.message;
    });
  }

  function fillFilters() {
    var sel = $('m-exam');
    var keep = sel.value;
    sel.textContent = '';
    var o = el('option', null, 'All exams'); o.value = ''; sel.appendChild(o);
    var seen = {};
    exams.forEach(function (e) { seen[e.id] = e.title; });
    all.forEach(function (r) { if (!seen[r.examId]) seen[r.examId] = r.examTitle + ' (removed)'; });
    Object.keys(seen).forEach(function (id) {
      var op = el('option', null, seen[id]); op.value = id; sel.appendChild(op);
    });
    sel.value = keep;
    var g = $('m-grade');
    if (g.options.length === 1) {
      for (var n = 3; n <= 12; n++) {
        var go = el('option', null, 'Grade ' + n); go.value = String(n); g.appendChild(go);
      }
    }
  }

  function filtered() {
    var ex = $('m-exam').value;
    var st = $('m-status').value;
    var gr = $('m-grade').value;
    var nm = $('m-name').value.trim().toLowerCase();
    return all.filter(function (r) {
      if (ex && r.examId !== ex) return false;
      if (st && statusOf(r) !== st) return false;
      if (gr && String(r.grade) !== gr) return false;
      if (nm && r.student.toLowerCase().indexOf(nm) < 0) return false;
      return true;
    });
  }

  /* ----------------------------------------------------------------- table */
  function render() {
    var rows = filtered();
    var body = $('marking-body');
    body.textContent = '';
    var pending = rows.filter(function (r) { return statusOf(r) === 'pending'; }).length;
    var marked = rows.filter(function (r) { return statusOf(r) === 'marked'; }).length;
    var auto = rows.filter(function (r) { return statusOf(r) === 'auto'; }).length;
    var sum = $('m-summary');
    sum.textContent = '';
    [['Attempts', rows.length], ['Pending', pending], ['Marked', marked], ['Auto-marked', auto]].forEach(function (s) {
      var d = el('div', 'sum'); d.append(el('b', null, String(s[1])), el('span', null, s[0])); sum.appendChild(d);
    });
    $('marking-empty').textContent = rows.length ? '' : 'No submissions match. Results appear here after students submit an exam.';

    rows.forEach(function (r) {
      var info = scoreInfo(r);
      var tr = el('tr', 'row');
      var pct = info.pct === null || info.pct === undefined ? '—' : info.pct + '%';
      var autoScore = typeof r.autoScore === 'number' ? r.autoScore : '';
      var openScore = r.mode === 'mcq' ? '—' : (info.marked ? (r.openScore === null || r.openScore === undefined ? '—' : r.openScore) : (statusOf(r) === 'pending' ? 'pending' : '—'));
      var actions = el('td');
      var openBtn = el('button', 'btn btn--small', info.marked || !info.pending ? 'Open' : 'Mark');
      openBtn.type = 'button';
      openBtn.addEventListener('click', function (ev) { ev.stopPropagation(); openMark(r.id); });
      actions.appendChild(openBtn);
      if (info.marked) {
        var print = el('a', 'btn btn--small', 'Print');
        print.href = 'report.html?id=' + encodeURIComponent(r.id);
        print.target = '_blank'; print.rel = 'noopener';
        print.addEventListener('click', function (ev) { ev.stopPropagation(); });
        actions.appendChild(print);
      }
      tr.append(
        el('td', null, r.finishedAt), el('td', null, r.student), el('td', null, String(r.grade)),
        el('td', null, r.examTitle), el('td', null, r.mode === 'mixed' ? 'Mixed' : 'MCQ'),
        el('td', null, String(autoScore)), el('td', null, String(openScore)),
        el('td', null, String(r.total)), el('td', null, pct), el('td', null, info.symbol || '—'),
        el('td', null, statusLabel(r)), actions
      );
      tr.addEventListener('click', function () { openMark(r.id); });
      body.appendChild(tr);
    });
  }

  /* ------------------------------------------------------------ mark panel */
  function openMark(id) {
    $('m-msg').textContent = '';
    $('m-msg').className = 'mark-msg';
    api('../api/results/' + encodeURIComponent(id)).then(function (d) {
      current = { id: id, result: d.result, marked: d.marked || null, open: {} };
      $('mark-panel').hidden = false;
      $('m-exam-title').textContent = d.result.examTitle;
      $('m-student').textContent = d.result.student;
      $('m-meta').textContent = 'Grade ' + d.result.grade + ' · ' +
        (d.result.mode === 'mixed' ? 'Mixed exam' : 'MCQ only') + ' · ' +
        (d.result.finishedAt || '') + (d.result.durationSec ? ' · ' + fmtTime(d.result.durationSec) : '');
      renderAutoSummary(d.result, d.marked);
      renderOpenQuestions(d.result, d.marked);
      $('m-general').value = d.marked && d.marked.generalComment ? d.marked.generalComment : '';
      setPrintLink(d.marked);
      $('mark-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function (e) { toast(e.message, 'error'); });
  }

  function setPrintLink(marked) {
    var link = $('m-print');
    if (marked) {
      link.hidden = false;
      link.href = 'report.html?id=' + encodeURIComponent(current.id);
    } else {
      link.hidden = true;
      link.href = '#';
    }
  }

  function renderAutoSummary(result, marked) {
    var open = result.answers.filter(function (a) { return a.type === 'open'; });
    var openPoints = open.reduce(function (s, a) { return s + (a.points || 0); }, 0);
    var mcqPoints = result.total - openPoints;
    var autoScore = marked && typeof marked.autoScore === 'number' ? marked.autoScore : result.autoScore;
    var box = $('m-auto-summary');
    box.textContent = '';
    var text = open.length
      ? 'Multiple choice: ' + autoScore + ' / ' + mcqPoints + ' marked automatically. ' +
        'Open-ended: ' + open.length + ' question' + (open.length === 1 ? '' : 's') +
        ', ' + openPoints + ' point' + (openPoints === 1 ? '' : 's') + '. ' +
        'Total: ' + result.total + ' points.'
      : 'All ' + result.answers.length + ' questions are multiple-choice and were marked automatically. ' +
        'Total: ' + result.total + ' points.';
    box.appendChild(el('b', null, 'Marking scheme: '));
    box.appendChild(document.createTextNode(text));
  }

  function renderOpenQuestions(result, marked) {
    var host = $('m-open-list');
    host.textContent = '';
    var open = result.answers.filter(function (a) { return a.type === 'open'; });
    if (!open.length) {
      host.appendChild(el('p', 'muted', 'There are no open-ended questions. You can still add a general comment and print the auto-marked report.'));
      return;
    }
    open.forEach(function (a) {
      var max = a.points || a.maxPoints || 0;
      var saved = null;
      if (marked && Array.isArray(marked.answers)) {
        saved = marked.answers.filter(function (m) { return m.qid === a.qid; })[0] || null;
      }
      var awarded = saved && typeof saved.awarded === 'number' ? saved.awarded : '';
      var comment = saved && saved.comment ? saved.comment : '';

      var card = el('div', 'open-question');
      card.appendChild(el('h3', null, 'Question ' + a.n + ' · Open-ended · ' + max + ' point' + (max === 1 ? '' : 's')));
      card.appendChild(el('p', 'open-question__text', a.text));

      var response = el('div', 'open-question__response' + (a.response ? '' : ' is-empty'), a.response || 'No answer.');
      card.appendChild(response);

      if (a.modelAnswer) {
        var expected = el('p', 'open-question__notes');
        expected.appendChild(el('b', null, 'Answer key: '));
        expected.appendChild(document.createTextNode(a.modelAnswer));
        card.appendChild(expected);
      }
      if (a.markingNotes) {
        var notes = el('p', 'open-question__notes');
        notes.appendChild(el('b', null, 'Marking notes: '));
        notes.appendChild(document.createTextNode(a.markingNotes));
        card.appendChild(notes);
      }

      var state = { max: max, awarded: awarded, comment: comment, input: null, full: null, zero: null };
      current.open[a.qid] = state;

      var controls = el('div', 'mark-controls');
      var full = el('button', 'btn btn--small', 'Full (' + max + ')');
      full.type = 'button';
      full.addEventListener('click', function () { setMark(state, max); });
      var partial = el('button', 'btn btn--small', 'Partial');
      partial.type = 'button';
      partial.addEventListener('click', function () { state.input.focus(); state.input.select(); });
      var zero = el('button', 'btn btn--small', '0');
      zero.type = 'button';
      zero.addEventListener('click', function () { setMark(state, 0); });
      var label = el('label', null, 'Partial mark');
      var input = el('input'); input.type = 'number'; input.min = '0'; input.max = String(max); input.step = '0.5';
      input.value = awarded === '' ? '' : String(awarded); input.placeholder = '0 – ' + max;
      input.addEventListener('input', function () { state.awarded = input.value; updateMarkButtons(state); });
      label.appendChild(input);
      controls.append(full, partial, zero, label);
      card.appendChild(controls);

      var cf = el('div', 'comment-field');
      var clabel = el('label', null, 'Comment for this question');
      var cta = el('textarea'); cta.rows = 2; cta.maxLength = 4000; cta.value = comment;
      cta.placeholder = 'Optional feedback shown on the result paper.';
      cta.addEventListener('input', function () { state.comment = cta.value; });
      cf.append(clabel, cta);
      card.appendChild(cf);

      state.input = input; state.full = full; state.zero = zero;
      updateMarkButtons(state);
      host.appendChild(card);
    });
  }

  function setMark(state, value) {
    state.awarded = value;
    state.input.value = String(value);
    updateMarkButtons(state);
  }
  function updateMarkButtons(state) {
    var v = state.awarded === '' ? null : Number(state.awarded);
    state.full.classList.toggle('is-active', v === state.max);
    state.zero.classList.toggle('is-active', v === 0);
  }

  function save() {
    if (!current) return;
    var marks = {};
    var comments = {};
    var bad = null;
    Object.keys(current.open).forEach(function (qid) {
      var state = current.open[qid];
      var raw = state.input.value.trim();
      var value = Number(raw);
      if (!raw || !isFinite(value) || value < 0 || value > state.max) {
        if (!bad) bad = 'Enter a mark from 0 to ' + state.max + ' for every open-ended question.';
        return;
      }
      marks[qid] = Math.round(value * 100) / 100;
      comments[qid] = state.comment.trim();
    });
    if (bad) { showMsg(bad, true); return; }
    $('m-save').disabled = true;
    showMsg('Saving…', false);
    api('../api/results/' + encodeURIComponent(current.id) + '/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marks: marks, comments: comments, generalComment: $('m-general').value })
    }).then(function (d) {
      current.marked = d.marked;
      setPrintLink(d.marked);
      showMsg('Marks saved. You can print the result paper now.', false);
      toast('Marks saved.', 'ok');
      return load();
    }).catch(function (e) {
      showMsg(e.message, true);
    }).then(function () { $('m-save').disabled = false; });
  }

  function showMsg(text, error) {
    var m = $('m-msg');
    m.textContent = text;
    m.className = 'mark-msg' + (error ? ' is-error' : '');
  }

  ['m-exam', 'm-status', 'm-grade'].forEach(function (id) { $(id).addEventListener('change', render); });
  $('m-name').addEventListener('input', render);
  $('m-close').addEventListener('click', function () { $('mark-panel').hidden = true; current = null; });
  $('m-save').addEventListener('click', save);

  load();
}());
