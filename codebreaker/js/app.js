/* Guess the Password — Bulls and Cows.
 * The computer picks a secret digit string with no repeated digits (3-5 digits).
 * Each guess returns bulls (right digit, right place) and cows (right digit,
 * wrong place). We also keep every candidate consistent with the clues, so the
 * player can see how much information each answer removed. */
(function () {
  'use strict';

  var STORE = 'enigmapath.codebreaker.v1';
  var INFO = {
    3: { outcomes: 9, lower: 3.00, optimal: null, max: null },
    4: { outcomes: 14, lower: 3.23, optimal: 5.21, max: 7 },
    5: { outcomes: 20, lower: 3.44, optimal: null, max: null }
  };
  var CODE_CACHE = {};

  var $ = function (id) { return document.getElementById(id); };
  var input = $('guess-input');
  var form = $('guess-form');
  var errorEl = $('guess-error');
  var feedbackEl = $('feedback');
  var historyWrap = $('history-wrap');
  var historyBody = $('history-body');
  var result = $('result');
  var resultEyebrow = $('result-eyebrow');
  var resultTitle = $('result-title');
  var resultText = $('result-text');
  var statGuesses = $('stat-guesses');
  var statLeft = $('stat-left');
  var statBest = $('stat-best');
  var infoLine = $('info-line');
  var bestLine = $('best-line');

  var best = {};
  try { best = JSON.parse(window.localStorage.getItem(STORE) || '{}') || {}; } catch (e) { best = {}; }

  var st = { length: 4, secret: '', candidates: [], history: [], done: false };

  function generateCodes(n) {
    if (CODE_CACHE[n]) return CODE_CACHE[n];
    var out = [];
    function rec(prefix) {
      if (prefix.length === n) { out.push(prefix); return; }
      for (var d = 0; d <= 9; d++) {
        var ch = String(d);
        if (prefix.indexOf(ch) === -1) rec(prefix + ch);
      }
    }
    rec('');
    CODE_CACHE[n] = out;
    return out;
  }

  function feedback(secret, guess) {
    var bulls = 0;
    var cows = 0;
    for (var i = 0; i < secret.length; i++) {
      if (secret[i] === guess[i]) bulls++;
      else if (secret.indexOf(guess[i]) !== -1) cows++;
    }
    return { bulls: bulls, cows: cows };
  }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function guessCount(n) { return n + (n === 1 ? ' guess' : ' guesses'); }

  function spaced(code) { return code.split('').join(' '); }

  function theoryText() {
    var total = generateCodes(st.length).length;
    var bits = Math.log2(total);
    var meta = INFO[st.length];
    var text = spaced(String(st.length)) + ' digits · <b>' + total.toLocaleString() +
      '</b> possible passwords · <b>' + bits.toFixed(2) +
      ' bits</b> of information · each answer has up to <b>' + meta.outcomes +
      '</b> outcomes · no strategy can average fewer than <b>' + meta.lower.toFixed(2) + '</b> guesses.';
    if (meta.optimal) {
      text += ' The known optimal strategy averages <b>' + meta.optimal.toFixed(2) +
        '</b> guesses, and never needs more than <b>' + meta.max + '</b>.';
    }
    return text;
  }

  function updateInfo() {
    infoLine.innerHTML = theoryText();
    var b = best[st.length];
    statBest.textContent = b === undefined ? '—' : b + (b === 1 ? ' guess' : ' guesses');
    bestLine.textContent = b === undefined
      ? 'No best score for ' + st.length + ' digits yet.'
      : 'Your best for ' + st.length + ' digits: ' + b + (b === 1 ? ' guess' : ' guesses') + '.';
  }

  function updateStats() {
    statGuesses.textContent = String(st.history.length);
    statLeft.textContent = st.candidates.length.toLocaleString();
  }

  function setError(text) {
    errorEl.textContent = text;
    errorEl.hidden = !text;
  }

  function setFeedback(text, kind) {
    feedbackEl.textContent = text;
    feedbackEl.className = 'cb-feedback' + (kind ? ' is-' + kind : '');
  }

  function renderHistory() {
    historyBody.textContent = '';
    historyWrap.hidden = st.history.length === 0;
    st.history.forEach(function (row, i) {
      var tr = document.createElement('tr');
      if (i === st.history.length - 1) tr.className = 'is-latest';
      var cells = [String(i + 1), spaced(row.guess), String(row.bulls), String(row.cows), row.left.toLocaleString()];
      cells.forEach(function (text, j) {
        var td = document.createElement('td');
        td.textContent = text;
        if (j === 2) td.className = 'bull-cell';
        if (j === 3) td.className = 'cow-cell';
        tr.appendChild(td);
      });
      historyBody.appendChild(tr);
    });
  }

  function resetResult() {
    result.hidden = true;
    resultEyebrow.textContent = 'Cracked';
    resultTitle.textContent = '';
    resultText.textContent = '';
  }

  function showResult(title, text, won) {
    result.hidden = false;
    resultEyebrow.textContent = won ? 'Cracked' : 'The password was';
    resultTitle.textContent = title;
    resultText.textContent = text;
  }

  function finish(win) {
    st.done = true;
    input.disabled = true;
    $('btn-guess').disabled = true;
    $('btn-giveup').disabled = true;
    if (win) {
      var used = st.history.length;
      var previous = best[st.length];
      if (previous === undefined || used < previous) {
        best[st.length] = used;
        try { window.localStorage.setItem(STORE, JSON.stringify(best)); } catch (e) { /* ignore */ }
        updateInfo();
      }
      var meta = INFO[st.length];
      var target = meta.optimal ? ' The optimal average for 4 digits is ' + meta.optimal.toFixed(2) + ' guesses.' : '';
      showResult('You cracked it in ' + guessCount(used) + '!',
        'The password was ' + spaced(st.secret) + '. Information theory says no strategy can average fewer than ' +
        meta.lower.toFixed(2) + ' guesses for ' + st.length + ' digits.' + target, true);
      setFeedback('Correct! ' + spaced(st.secret) + ' was the password — ' + guessCount(used) + '.', 'win');
    } else {
      showResult(spaced(st.secret),
        'You used ' + guessCount(st.history.length) + '. A bull is a right digit in the right place; a cow is a right digit in the wrong place.', false);
      setFeedback('The password was ' + spaced(st.secret) + '. Start a new game and try a different opening guess.', '');
    }
  }

  function newGame(length) {
    if (length) st.length = length;
    st.secret = generateCodes(st.length)[Math.floor(Math.random() * generateCodes(st.length).length)];
    st.candidates = generateCodes(st.length).slice();
    st.history = [];
    st.done = false;
    input.value = '';
    input.disabled = false;
    input.maxLength = st.length;
    input.placeholder = 'Type a ' + st.length + '-digit password';
    $('btn-guess').disabled = false;
    $('btn-giveup').disabled = false;
    document.querySelectorAll('.cb-length .btn').forEach(function (b) {
      b.classList.toggle('is-active', Number(b.dataset.length) === st.length);
    });
    setError('');
    resetResult();
    renderHistory();
    updateStats();
    updateInfo();
    setFeedback('New game with ' + st.length + ' digits. Every digit is different. Make your first guess.', '');
    input.focus({ preventScroll: true });
  }

  function normalize(raw) {
    return raw.replace(/\s+/g, '');
  }

  function validate(guess) {
    if (!guess) return 'Type a guess first.';
    if (!/^\d+$/.test(guess)) return 'Use digits 0–9 only.';
    if (guess.length !== st.length) return 'Your guess must have exactly ' + st.length + ' digits.';
    if (new Set(guess.split('')).size !== guess.length) return 'Every digit in the guess must be different.';
    if (st.history.some(function (row) { return row.guess === guess; })) return 'You already tried that guess.';
    return '';
  }

  function submit(ev) {
    ev.preventDefault();
    setError('');
    if (st.done) return;
    var guess = normalize(input.value);
    input.value = guess;
    var problem = validate(guess);
    if (problem) { setError(problem); input.focus({ preventScroll: true }); return; }

    var f = feedback(st.secret, guess);
    st.candidates = st.candidates.filter(function (code) {
      var cf = feedback(code, guess);
      return cf.bulls === f.bulls && cf.cows === f.cows;
    });
    st.history.push({ guess: guess, bulls: f.bulls, cows: f.cows, left: st.candidates.length });
    renderHistory();
    updateStats();
    input.value = '';
    input.focus({ preventScroll: true });

    var meaning = ' A bull is a correct digit in the correct position; a cow is a correct digit in the wrong position.';
    if (f.bulls === st.length) {
      finish(true);
      return;
    }
    var leftText = st.candidates.length === 1
      ? ' Only one password fits all the clues now.'
      : ' Possible passwords left: ' + st.candidates.length.toLocaleString() + '.';
    setFeedback(plural(f.bulls, 'bull') + ' and ' + plural(f.cows, 'cow') + '.' + meaning + leftText,
      f.bulls + f.cows >= st.length - 1 ? 'close' : '');
  }

  $('guess-form').addEventListener('submit', submit);
  $('btn-new').addEventListener('click', function () { newGame(); });
  $('btn-giveup').addEventListener('click', function () {
    if (!st.done) finish(false);
  });
  $('result-new').addEventListener('click', function () { newGame(); });
  document.querySelectorAll('.cb-length .btn').forEach(function (b) {
    b.addEventListener('click', function () { newGame(Number(b.dataset.length)); });
  });

  newGame(4);
}());
