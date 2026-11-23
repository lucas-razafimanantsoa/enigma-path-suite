/* Fun Facts page controller. Reads ?n=<id>, or picks a random fact if missing/invalid. */
(function () {
  'use strict';

  var facts = window.EPFacts;
  var el = {
    card: document.getElementById('fact-card'),
    topic: document.getElementById('fact-topic'),
    title: document.getElementById('fact-title'),
    text: document.getElementById('fact-text'),
    detail: document.getElementById('fact-detail'),
    source: document.getElementById('fact-source'),
    sourceName: document.getElementById('fact-source-name'),
    count: document.getElementById('fact-count'),
    another: document.getElementById('btn-another')
  };

  if (!facts || !facts.count) {
    el.title.textContent = 'Facts unavailable';
    el.detail.textContent = 'The shared facts file could not be loaded. Check that shared/fun-facts.js is present.';
    el.count.textContent = '';
    return;
  }

  var current = null;

  function fromUrl() {
    var raw = null;
    try {
      raw = new URLSearchParams(window.location.search).get('n');
    } catch (e) {
      raw = null;
    }
    var n = parseInt(raw, 10);
    if (!isFinite(n) || n < 1 || n > facts.count) return null;
    var fact = facts.get(n - 1);
    return fact && fact.id === n ? fact : null;
  }

  function differentFact() {
    var next = facts.random();
    if (current && next.id === current.id) next = facts.get(current.id);
    return next;
  }

  function render(fact, updateUrl) {
    current = fact;
    el.topic.textContent = fact.topic;
    el.topic.className = 'badge fact-topic fact-topic--' + String(fact.topic).toLowerCase();
    el.title.textContent = fact.title;
    el.text.textContent = fact.text;
    el.detail.textContent = fact.detail;
    el.source.href = fact.source;
    el.sourceName.textContent = fact.sourceName || 'Read the source';
    el.count.textContent = 'Fact ' + fact.id + ' of ' + facts.count + ' · ' + fact.topic;
    document.title = fact.title + ' | Fun Facts | EnigmaPath';

    el.card.classList.remove('is-in');
    void el.card.offsetWidth;
    el.card.classList.add('is-in');

    if (updateUrl && window.history && window.history.replaceState) {
      try {
        window.history.replaceState(null, '', '?n=' + fact.id);
      } catch (e) {
        /* Some browsers block history edits on file:// — the fact still displays. */
      }
    }
  }

  el.another.addEventListener('click', function () {
    render(differentFact(), true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      render(differentFact(), true);
    }
  });

  var initial = fromUrl() || facts.random();
  render(initial, false);
}());
