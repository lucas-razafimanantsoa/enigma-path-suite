/* EnigmaPath Practice Quiz.
 * Eight subjects, each with ten levels. Questions are drawn at random, options
 * shuffled, feedback after each answer, review at the end. Works from file://. */
(function () {
  'use strict';

  var FALLBACK_LEVELS = [
    { title: 'Computer basics', blurb: 'Parts of a computer, keyboard and mouse, simple Office skills' },
    { title: 'Office and internet skills', blurb: 'Files, email, safe browsing, simple ciphers' },
    { title: 'Spreadsheets and security', blurb: 'Formulas, documents, passwords, networks intro' },
    { title: 'Digital foundations', blurb: 'Hardware, storage, files, presentations, first algorithms' },
    { title: 'Data, networks and algorithms', blurb: 'Binary, networks, spreadsheets, databases, flowcharts' },
    { title: 'Protocols, web and code', blurb: 'Validation, topologies, HTML, security threats, programming' },
    { title: 'Systems and devices', blurb: 'Computer systems, input and output devices, storage media' },
    { title: 'Networks and ICT in society', blurb: 'Networking, effects of ICT, real-world applications' },
    { title: 'Life cycle and security', blurb: 'Systems life cycle, safety and security, communication, files' },
    { title: 'Documents, data and the web', blurb: 'Layout, databases, HTML/CSS, spreadsheets, web authoring' }
  ];
  var DIFF_LABEL = { 'Term 1': 'Easy', 'Term 2': 'Medium', 'Term 3': 'Hard', Mixed: 'Mixed' };
  var STORE = 'enigmapath.quiz.v2';
  var LETTERS = ['A', 'B', 'C', 'D'];

  var $ = function (id) { return document.getElementById(id); };
  var bank = window.QUESTION_BANK || {};
  var topics = Array.isArray(window.QUESTION_TOPICS) && window.QUESTION_TOPICS.length
    ? window.QUESTION_TOPICS
    : [{ id: 'ict', name: 'ICT', blurb: 'Computing, Office skills and online safety', icon: '💻', levels: FALLBACK_LEVELS }];

  var best = {};
  try {
    var saved = JSON.parse(window.localStorage.getItem(STORE) || 'null');
    if (saved && saved.best) best = saved.best;
    else {
      var old = JSON.parse(window.localStorage.getItem('enigmapath.quiz.v1') || '{}').best || {};
      Object.keys(old).forEach(function (n) { best['ict:' + n] = old[n]; });
    }
  } catch (e) { best = {}; }

  var st = { topic: topics[0], level: 1, questions: [], answers: [], index: 0, difficulty: 'Mixed', done: false };
  var screens = { topics: $('screen-topics'), setup: $('screen-setup'), quiz: $('screen-quiz'), results: $('screen-results'), review: $('screen-review') };

  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].hidden = k !== name; });
    $('ctx-badge').hidden = name === 'topics' || name === 'setup';
    window.scrollTo(0, 0);
  }

  function bankKey(topic, n) { return topic.id === 'ict' ? 'level' + n : topic.id + n; }
  function poolFor(topic, n) { return bank[bankKey(topic, n)] || []; }
  function poolSize(topic, n) { return poolFor(topic, n).length; }
  function totalFor(topic) {
    var total = 0;
    for (var n = 1; n <= topic.levels.length; n++) total += poolSize(topic, n);
    return total;
  }
  function bestKey(topic, n) { return topic.id + ':' + n; }

  /* ----------------------------------------------------------------- topics */
  function renderTopics() {
    var grid = $('topic-grid');
    grid.textContent = '';
    topics.forEach(function (topic) {
      var total = totalFor(topic);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'topic-card';
      b.dataset.topic = topic.id;

      var icon = document.createElement('span');
      icon.className = 'topic-card__icon';
      icon.textContent = topic.icon || '✦';

      var body = document.createElement('span');
      body.className = 'topic-card__body';
      var name = document.createElement('span'); name.className = 'topic-card__name'; name.textContent = topic.name;
      var blurb = document.createElement('span'); blurb.className = 'topic-card__blurb'; blurb.textContent = topic.blurb;
      var meta = document.createElement('span'); meta.className = 'topic-card__meta';
      meta.textContent = topic.levels.length + ' levels · ' + total + ' question' + (total === 1 ? '' : 's');
      body.append(name, blurb, meta);

      var arrow = document.createElement('span');
      arrow.className = 'topic-card__arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';

      b.append(icon, body, arrow);
      b.setAttribute('aria-label', topic.name + ': ' + topic.blurb);
      b.addEventListener('click', function () { chooseTopic(topic); });
      grid.appendChild(b);
    });
  }

  function chooseTopic(topic) {
    st.topic = topic;
    st.level = 1;
    var levelCount = topic.levels.length;
    var topTitle = topic.levels[levelCount - 1].title;
    $('setup-eyebrow').textContent = topic.name + ' · practice quiz';
    $('setup-lede').textContent = topic.blurb + '. ' + levelCount + ' levels, from first steps to ' + topTitle + '.';
    renderLevels();
    updateStart();
    show('setup');
  }

  /* ------------------------------------------------------------------ setup */
  function renderLevels() {
    var grid = $('level-grid');
    grid.textContent = '';
    var levels = st.topic.levels || FALLBACK_LEVELS;
    levels.forEach(function (lv, i) {
      var n = i + 1;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'level-card' + (n === st.level ? ' is-selected' : '');
      var pips = '';
      for (var p = 1; p <= levels.length; p++) pips += '<i' + (p <= n ? ' class="on"' : '') + '></i>';
      b.innerHTML = '<span class="n">Level ' + n + '</span><span class="t"></span><span class="m"></span><span class="pips">' + pips + '</span>';
      b.querySelector('.t').textContent = lv.title;
      var bScore = best[bestKey(st.topic, n)];
      var count = poolSize(st.topic, n);
      b.querySelector('.m').textContent = (bScore !== undefined ? 'Best score: ' + bScore + '%' : lv.blurb) +
        (count ? ' · ' + count + ' questions' : '');
      b.title = lv.blurb;
      b.addEventListener('click', function () { st.level = n; renderLevels(); updateStart(); });
      grid.appendChild(b);
    });
  }

  function updateStart() {
    $('btn-start').textContent = 'Start Level ' + st.level + ' →';
    var count = poolSize(st.topic, st.level);
    $('bank-status').textContent = count ? count + ' questions in this level' : 'No questions found for this level yet.';
    $('count').max = String(Math.max(1, count));
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function start(ev) {
    ev.preventDefault();
    var err = $('form-error');
    err.hidden = true;
    var requested = Math.floor(Number($('count').value));
    var diff = $('difficulty').value;
    if (!(requested >= 1)) { err.textContent = 'Please enter how many questions you want.'; err.hidden = false; return; }
    var pool = poolFor(st.topic, st.level).slice();
    if ($('revision').checked) for (var n = 1; n < st.level; n++) pool = pool.concat(poolFor(st.topic, n));
    var filtered = diff === 'Mixed' ? pool : pool.filter(function (q) { return q.term_category === diff; });
    if (filtered.length < requested) filtered = pool; // not enough in that difficulty: use the whole pool
    if (!filtered.length) { err.textContent = 'No questions are available for this selection.'; err.hidden = false; return; }
    var picked = shuffle(filtered.slice()).slice(0, Math.min(requested, filtered.length));
    st.questions = picked.map(prepare);
    st.answers = new Array(st.questions.length).fill(null);
    st.index = 0;
    st.difficulty = diff;
    st.done = false;
    $('ctx-badge').textContent = st.topic.name + ' · Level ' + st.level + ' · ' + DIFF_LABEL[diff];
    show('quiz');
    renderQuestion();
  }

  function prepare(q) {
    var entries = q.options.map(function (text, i) { return { text: String(text), correct: i === q.correct_answer_index }; });
    shuffle(entries);
    return {
      text: q.question_text,
      diff: q.term_category,
      options: entries.map(function (e) { return e.text; }),
      correct: entries.findIndex(function (e) { return e.correct; })
    };
  }

  /* --------------------------------------------------------------- question */
  function renderQuestion() {
    var total = st.questions.length;
    var q = st.questions[st.index];
    var a = st.answers[st.index];
    $('progress-label').textContent = 'Question ' + (st.index + 1) + ' of ' + total;
    $('progress-track').setAttribute('aria-valuemax', String(total));
    $('progress-track').setAttribute('aria-valuenow', String(st.index + 1));
    $('progress-fill').style.width = ((st.index + 1) / total * 100) + '%';
    $('question-level').textContent = st.topic.name + ' · Level ' + st.level;
    $('question-diff').textContent = DIFF_LABEL[q.diff] || '';
    $('question-text').textContent = q.text;
    var box = $('options');
    box.textContent = '';
    var locked = a !== null;
    box.classList.toggle('is-locked', locked);
    q.options.forEach(function (text, i) {
      var label = document.createElement('label');
      label.className = 'option';
      var input = document.createElement('input');
      input.type = 'radio'; input.name = 'opt'; input.value = String(i); input.checked = a === i; input.disabled = locked;
      var key = document.createElement('span'); key.className = 'option__key'; key.textContent = LETTERS[i];
      var t = document.createElement('span'); t.textContent = text;
      label.append(input, key, t);
      if (locked) {
        if (i === q.correct) label.classList.add('is-correct');
        if (a === i) label.classList.add('is-selected');
        if (a === i && i !== q.correct) label.classList.add('is-incorrect');
      }
      input.addEventListener('change', function () { answer(i); });
      box.appendChild(label);
    });
    var fb = $('feedback');
    if (!locked) fb.hidden = true;
    else {
      var ok = a === q.correct;
      fb.className = 'feedback ' + (ok ? 'feedback--correct' : 'feedback--incorrect');
      fb.textContent = '';
      var strong = document.createElement('strong');
      strong.textContent = ok ? 'Correct!' : 'Not quite.';
      fb.appendChild(strong);
      if (!ok) { fb.append(' The correct answer is '); var b = document.createElement('b'); b.textContent = q.options[q.correct]; fb.append(b, '.'); }
      fb.hidden = false;
    }
    $('prev-btn').disabled = st.index === 0;
    $('next-btn').textContent = st.index === total - 1 ? 'Finish quiz' : 'Next →';
  }

  function answer(i) {
    if (st.answers[st.index] !== null) return;
    st.answers[st.index] = i;
    renderQuestion();
    $('next-btn').focus({ preventScroll: true });
  }

  function next() {
    if (st.index >= st.questions.length - 1) { finish(); return; }
    st.index++;
    renderQuestion();
    $('question-text').focus({ preventScroll: true });
  }

  function prev() {
    if (st.index === 0) return;
    st.index--;
    renderQuestion();
  }

  function endQuiz() {
    var answered = st.answers.filter(function (a) { return a !== null; }).length;
    var msg = answered === st.questions.length ? 'Finish the quiz and see your result?' :
      'You answered ' + answered + ' of ' + st.questions.length + ' questions. Finish now? Unanswered questions count as skipped.';
    if (window.confirm(msg)) finish();
  }

  /* ---------------------------------------------------------------- results */
  function finish() {
    st.done = true;
    var total = st.questions.length;
    var correct = 0, skipped = 0;
    st.questions.forEach(function (q, i) {
      if (st.answers[i] === null) skipped++;
      else if (st.answers[i] === q.correct) correct++;
    });
    var pct = total ? correct / total * 100 : 0;
    var shown = Number.isInteger(pct) ? String(pct) : pct.toFixed(1);
    $('results-title').textContent = st.topic.name + ' · Level ' + st.level + ' result';
    $('score-value').textContent = correct + ' / ' + total;
    $('score-percent').textContent = shown + '%';
    var ring = $('score-ring');
    ring.style.setProperty('--pct', String(pct));
    ring.style.setProperty('--ring', pct >= 75 ? 'var(--ok)' : pct >= 50 ? 'var(--warn)' : 'var(--bad)');
    $('correct-count').textContent = correct;
    $('incorrect-count').textContent = total - correct - skipped;
    $('unattempted-count').textContent = skipped;
    $('result-message').textContent = pct >= 90 ? 'Outstanding work!' : pct >= 75 ? 'Great job - a strong result.' : pct >= 50 ? 'Good effort. Review the answers and try again.' : 'Keep going. Review the answers and try again.';
    var key = bestKey(st.topic, st.level);
    var prevBest = best[key];
    var newBest = prevBest === undefined || pct > prevBest;
    if (newBest) {
      best[key] = Math.round(pct * 10) / 10;
      try { window.localStorage.setItem(STORE, JSON.stringify({ best: best })); } catch (e) { /* storage unavailable: still playable */ }
    }
    $('result-best').textContent = newBest ? 'New best score for this level.' : 'Best for this level: ' + prevBest + '%';
    show('results');
  }

  function renderReview() {
    var list = $('review-list');
    list.textContent = '';
    st.questions.forEach(function (q, i) {
      var a = st.answers[i];
      var ok = a === q.correct;
      var item = document.createElement('article');
      item.className = 'review-item review-item--' + (a === null ? 'skipped' : ok ? 'correct' : 'incorrect');
      var status = document.createElement('span');
      status.className = 'review-status';
      status.textContent = a === null ? 'Skipped' : ok ? 'Correct' : 'Incorrect';
      var h = document.createElement('h3');
      h.textContent = (i + 1) + '. ' + q.text;
      item.append(status, h);
      if (a !== null) {
        var l1 = document.createElement('p'); l1.className = 'review-line';
        l1.append('Your answer: ');
        var b1 = document.createElement('b'); b1.className = ok ? 'ok' : 'bad'; b1.textContent = q.options[a];
        l1.append(b1); item.append(l1);
      }
      if (!ok) {
        var l2 = document.createElement('p'); l2.className = 'review-line';
        l2.append('Correct answer: ');
        var b2 = document.createElement('b'); b2.className = 'ok'; b2.textContent = q.options[q.correct];
        l2.append(b2); item.append(l2);
      }
      list.appendChild(item);
    });
  }

  /* ----------------------------------------------------------------- events */
  $('setup-form').addEventListener('submit', start);
  $('prev-btn').addEventListener('click', function (e) { if (e.detail <= 1) prev(); });
  $('next-btn').addEventListener('click', function (e) { if (e.detail <= 1) next(); });
  $('end-quiz').addEventListener('click', endQuiz);
  $('review-btn').addEventListener('click', function () { renderReview(); show('review'); });
  $('back-results').addEventListener('click', function () { show('results'); });
  $('again-btn').addEventListener('click', function () { $('setup-form').requestSubmit(); });
  $('levels-btn').addEventListener('click', function () { renderLevels(); show('setup'); });
  $('topics-btn').addEventListener('click', function () { renderTopics(); show('topics'); });
  $('change-topic').addEventListener('click', function () { renderTopics(); show('topics'); });
  document.addEventListener('keydown', function (e) {
    if (screens.quiz.hidden || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var tag = e.target && e.target.tagName;
    if (tag === 'BUTTON' && e.key === 'Enter') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (/^[1-4]$/.test(e.key)) {
      var q = st.questions[st.index];
      var i = Number(e.key) - 1;
      if (q && i < q.options.length) { e.preventDefault(); answer(i); }
    }
  });

  renderTopics();
  show('topics');
}());
