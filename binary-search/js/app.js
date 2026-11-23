/* Binary Search Lab — a playable guessing game.
 * The computer picks a secret number and answers only "higher" / "lower".
 * Each reply narrows a live search interval; the midpoint of that interval is
 * the next binary-search guess. No library, no network, no per-number nodes. */
(function () {
  'use strict';

  var ABS_MIN = 1;
  var ABS_MAX = 10000;

  var els = {
    rangeMin: document.getElementById('range-min'),
    rangeMax: document.getElementById('range-max'),
    setupError: document.getElementById('setup-error'),
    btnNew: document.getElementById('btn-new'),
    guessForm: document.getElementById('guess-form'),
    guessInput: document.getElementById('guess-input'),
    btnGuess: document.getElementById('btn-guess'),
    btnGiveup: document.getElementById('btn-giveup'),
    reply: document.getElementById('reply'),
    roundStatus: document.getElementById('round-status'),
    guessCount: document.getElementById('guess-count'),
    optimum: document.getElementById('optimum'),
    rangeLabel: document.getElementById('range-label'),
    intervalText: document.getElementById('interval-text'),
    intervalBar: document.getElementById('interval-bar'),
    intervalFill: document.getElementById('interval-fill'),
    markerLow: document.getElementById('marker-low'),
    markerMid: document.getElementById('marker-mid'),
    markerHigh: document.getElementById('marker-high'),
    scaleMin: document.getElementById('scale-min'),
    scaleMax: document.getElementById('scale-max'),
    guessLog: document.getElementById('guess-log'),
    resultCard: document.getElementById('result-card'),
    resultTitle: document.getElementById('result-title'),
    resultSecret: document.getElementById('result-secret'),
    resultText: document.getElementById('result-text'),
    btnSolution: document.getElementById('btn-solution'),
    solutionPanel: document.getElementById('solution-panel'),
    solutionSecret: document.getElementById('solution-secret'),
    solutionSteps: document.getElementById('solution-steps'),
    solutionSummary: document.getElementById('solution-summary')
  };

  var state = {
    min: 1,
    max: 100,
    secret: null,
    low: 1,
    high: 100,
    guesses: [],
    over: false,
    won: false,
    rangePending: false
  };

  function readInt(value) {
    var text = String(value).trim();
    if (!/^[+-]?\d+$/.test(text)) return null;
    var n = Number(text);
    return isFinite(n) && Math.floor(n) === n ? n : null;
  }

  function validateRange(minRaw, maxRaw) {
    var min = readInt(minRaw);
    var max = readInt(maxRaw);
    if (min === null || max === null || min < ABS_MIN || min > ABS_MAX || max < ABS_MIN || max > ABS_MAX) {
      return { ok: false, message: 'Enter whole numbers between 1 and 10000.' };
    }
    if (min >= max) {
      return { ok: false, message: 'The minimum must be smaller than the maximum.' };
    }
    return { ok: true, min: min, max: max };
  }

  function optimumFor(min, max) {
    return Math.ceil(Math.log2(max - min + 1));
  }

  function plural(count) {
    return count === 1 ? 'guess' : 'guesses';
  }

  function showSetupError(message) {
    els.setupError.textContent = message;
    els.setupError.hidden = false;
  }

  function clearSetupError() {
    els.setupError.textContent = '';
    els.setupError.hidden = true;
  }

  function setReply(text, kind) {
    els.reply.textContent = text;
    els.reply.className = 'reply' + (kind ? ' reply--' + kind : '');
  }

  function pct(value) {
    return (value - state.min) / (state.max - state.min) * 100;
  }

  function renderInterval() {
    var low = state.over ? state.secret : state.low;
    var high = state.over ? state.secret : state.high;
    var mid = Math.floor((low + high) / 2);
    var left = pct(low);
    var right = pct(high);

    els.intervalFill.style.left = left + '%';
    els.intervalFill.style.width = Math.max(0, right - left) + '%';
    els.markerLow.style.left = left + '%';
    els.markerMid.style.left = pct(mid) + '%';
    els.markerHigh.style.left = right + '%';
    els.markerLow.title = 'Low: ' + low;
    els.markerMid.title = 'Midpoint: ' + mid;
    els.markerHigh.title = 'High: ' + high;

    els.intervalText.textContent = state.over
      ? 'Secret revealed: ' + state.secret
      : 'Possible: ' + low + '–' + high + ' · midpoint ' + mid;
    els.intervalBar.classList.toggle('interval__bar--over', state.over);
  }

  function renderStats() {
    els.guessCount.textContent = String(state.guesses.length);
    els.optimum.textContent = String(optimumFor(state.min, state.max));
    els.rangeLabel.textContent = state.min + '–' + state.max;
    els.scaleMin.textContent = String(state.min);
    els.scaleMax.textContent = String(state.max);
    els.guessInput.setAttribute('min', String(state.min));
    els.guessInput.setAttribute('max', String(state.max));
  }

  function renderLog() {
    els.guessLog.innerHTML = '';
    if (!state.guesses.length) {
      var emptyRow = document.createElement('tr');
      emptyRow.className = 'empty-row';
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 3;
      emptyCell.textContent = 'No guesses yet — enter a number above.';
      emptyRow.appendChild(emptyCell);
      els.guessLog.appendChild(emptyRow);
      return;
    }
    state.guesses.forEach(function (guess, index) {
      var row = document.createElement('tr');
      if (guess.reply === 'Correct!') row.className = 'row--win';
      var num = document.createElement('td');
      num.textContent = String(index + 1);
      var value = document.createElement('td');
      value.textContent = String(guess.value);
      var reply = document.createElement('td');
      reply.textContent = guess.reply;
      row.appendChild(num);
      row.appendChild(value);
      row.appendChild(reply);
      els.guessLog.appendChild(row);
    });
  }

  function updateControls() {
    var locked = state.over || state.rangePending;
    els.btnGuess.disabled = locked;
    els.guessInput.disabled = locked;
    els.btnGiveup.disabled = locked;
    els.roundStatus.textContent = state.rangePending ? 'Fix the range' : (state.over ? (state.won ? 'Found!' : 'Revealed') : 'In progress');
    els.roundStatus.className = 'badge' + (locked ? (state.over && state.won ? ' badge--ok' : ' badge--warn') : '');
  }

  function clearSolution() {
    els.solutionPanel.hidden = true;
    els.solutionSecret.textContent = '—';
    els.solutionSteps.innerHTML = '';
    els.solutionSummary.textContent = '';
  }

  function showResult() {
    var used = state.guesses.length;
    var best = optimumFor(state.min, state.max);

    els.resultCard.className = 'card result ' + (state.won ? 'result--win' : 'result--giveup');
    els.resultTitle.textContent = state.won ? 'You found it!' : 'Round over — the number was revealed';
    els.resultSecret.textContent = String(state.secret);

    if (state.won) {
      if (used <= best) {
        els.resultText.textContent = 'You found it in ' + used + ' ' + plural(used) + '. Binary search would need at most ' +
          best + '. ' + (used < best ? 'That is even better than the binary-search worst case — brilliant!' : 'You matched the optimum — excellent work!');
      } else {
        els.resultText.textContent = 'You found it in ' + used + ' ' + plural(used) + '. Binary search would need at most ' +
          best + '. Hint: guess the midpoint so each reply cuts the possible range roughly in half.';
      }
    } else {
      els.resultText.textContent = 'The secret was ' + state.secret + '. Binary search would need at most ' + best +
        ' ' + plural(best) + ' for ' + state.min + '–' + state.max + '. You used ' + used + ' ' + plural(used) +
        ' this round — try the midpoint of the interval next time.';
    }
    els.resultCard.hidden = false;
  }

  function newGame() {
    var range = validateRange(els.rangeMin.value, els.rangeMax.value);
    if (!range.ok) {
      showSetupError(range.message);
      state.rangePending = true;
      setReply('Fix the range above, then press New game to keep playing.', 'range');
      updateControls();
      return;
    }
    clearSetupError();
    state.rangePending = false;

    state.min = range.min;
    state.max = range.max;
    state.secret = state.min + Math.floor(Math.random() * (state.max - state.min + 1));
    state.low = state.min;
    state.high = state.max;
    state.guesses = [];
    state.over = false;
    state.won = false;

    els.rangeMin.value = String(state.min);
    els.rangeMax.value = String(state.max);
    els.guessInput.value = '';
    els.resultCard.hidden = true;
    clearSolution();
    setReply('I have a secret number between ' + state.min + ' and ' + state.max + '. What is your first guess?', 'info');

    renderStats();
    renderInterval();
    renderLog();
    updateControls();
    els.guessInput.focus();
  }

  function makeGuess(raw) {
    if (state.over || state.rangePending) return;

    var value = readInt(raw);
    if (value === null || value < state.min || value > state.max) {
      setReply('Out of range, pick between ' + state.min + ' and ' + state.max, 'range');
      els.guessInput.value = '';
      els.guessInput.focus();
      return;
    }

    var reply;
    if (value === state.secret) {
      reply = 'Correct!';
      state.over = true;
      state.won = true;
    } else if (value < state.secret) {
      reply = 'Higher — try a bigger number';
      state.low = Math.max(state.low, value + 1);
    } else {
      reply = 'Lower — try a smaller number';
      state.high = Math.min(state.high, value - 1);
    }

    state.guesses.push({ value: value, reply: reply });
    els.guessInput.value = '';

    if (state.over) {
      setReply('Correct! The number was ' + state.secret + '.', 'win');
    } else {
      setReply(reply, value < state.secret ? 'higher' : 'lower');
    }

    renderStats();
    renderInterval();
    renderLog();
    updateControls();
    if (state.over) showResult();
    else els.guessInput.focus();
  }

  function giveUp() {
    if (state.over || state.rangePending) return;
    state.over = true;
    state.won = false;
    setReply('The number was ' + state.secret + '.', 'giveup');
    renderInterval();
    updateControls();
    showResult();
  }

  function buildSolution(min, max, secret) {
    var lo = min;
    var hi = max;
    var steps = [];
    var count = 0;
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2);
      count++;
      if (mid === secret) {
        steps.push(count + '. Guess ' + mid + ' → correct!');
        break;
      }
      if (secret < mid) {
        steps.push(count + '. Guess ' + mid + ' → Lower — try a smaller number (now ' + lo + '–' + (mid - 1) + ')');
        hi = mid - 1;
      } else {
        steps.push(count + '. Guess ' + mid + ' → Higher — try a bigger number (now ' + (mid + 1) + '–' + hi + ')');
        lo = mid + 1;
      }
    }
    return { steps: steps, count: count };
  }

  function fillSteps(items) {
    els.solutionSteps.innerHTML = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      els.solutionSteps.appendChild(li);
    });
  }

  function showSolution() {
    if (!window.EPGate || typeof window.EPGate.withPassword !== 'function') {
      setReply('The teacher gate is not available on this page.', 'range');
      return;
    }
    window.EPGate.withPassword(function () {
      var solution = buildSolution(state.min, state.max, state.secret);
      els.solutionSecret.textContent = String(state.secret);
      fillSteps(solution.steps);
      els.solutionSummary.textContent = 'Binary search finds ' + state.secret + ' in ' + solution.count + ' ' +
        plural(solution.count) + ' between ' + state.min + ' and ' + state.max +
        ' (at most ' + optimumFor(state.min, state.max) + ' for this range).';
      els.solutionPanel.hidden = false;
    });
  }

  els.btnNew.addEventListener('click', newGame);
  els.rangeMin.addEventListener('change', newGame);
  els.rangeMax.addEventListener('change', newGame);
  [els.rangeMin, els.rangeMax].forEach(function (input) {
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        newGame();
      }
    });
  });
  els.guessForm.addEventListener('submit', function (event) {
    event.preventDefault();
    makeGuess(els.guessInput.value);
  });
  els.btnGiveup.addEventListener('click', giveUp);
  els.btnSolution.addEventListener('click', showSolution);

  newGame();
}());
