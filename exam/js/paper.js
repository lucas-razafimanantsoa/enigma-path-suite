/* EnigmaPath answered exam (teacher copy). Prints every question, answer and answer key. */
(function () {
  'use strict';

  var page = document.getElementById('paper-page');
  var X = window.EPExam;
  var M = window.EPMaze;
  var H = window.EP_RESULT_HEADER || {};
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function showMessage(text) {
    page.textContent = '';
    var box = el('div', 'paper-error');
    box.appendChild(el('h2', null, 'Answered exam'));
    box.appendChild(el('p', 'muted', text));
    var a = el('a', 'btn', 'Back to the exam builder');
    a.href = 'builder.html';
    box.appendChild(a);
    page.appendChild(box);
  }

  function questionBlock(q, n, mazeTitle) {
    var card = el('article', 'paper-question');
    card.appendChild(el('h3', null, 'Q' + n + ' · MCQ · 1 point' + (mazeTitle ? ' · ' + mazeTitle : '')));
    card.appendChild(el('p', 'paper-question__text', q.text));
    var list = el('ol', 'paper-options');
    q.options.forEach(function (text, i) {
      var li = el('li', i === q.correct ? 'is-correct' : '');
      li.appendChild(el('span', 'paper-options__key', LETTERS[i] || String(i + 1)));
      li.appendChild(document.createTextNode(' ' + text));
      list.appendChild(li);
    });
    card.appendChild(list);
    var answer = el('p', 'paper-answer');
    answer.appendChild(el('b', null, 'Correct answer: '));
    answer.appendChild(document.createTextNode((LETTERS[q.correct] || String(q.correct + 1)) + ' — ' + q.options[q.correct]));
    card.appendChild(answer);
    return card;
  }

  function openBlock(q, n) {
    var card = el('article', 'paper-question');
    card.appendChild(el('h3', null, 'Q' + n + ' · Open-ended · ' + q.points + ' point' + (q.points === 1 ? '' : 's')));
    card.appendChild(el('p', 'paper-question__text', q.text));
    var key = el('p', 'paper-answer');
    key.appendChild(el('b', null, 'Answer key: '));
    key.appendChild(document.createTextNode(q.modelAnswer || 'No answer key provided.'));
    card.appendChild(key);
    if (q.markingNotes) {
      var notes = el('p', 'paper-notes');
      notes.appendChild(el('b', null, 'Marking notes: '));
      notes.appendChild(document.createTextNode(q.markingNotes));
      card.appendChild(notes);
    }
    return card;
  }

  function mazeBlock(item) {
    var box = el('section', 'paper-maze');
    box.appendChild(el('h3', null, 'Maze: ' + (item.title || 'Maze')));
    if (item.intro) box.appendChild(el('p', 'paper-maze__intro', item.intro));
    var figure = el('div', 'paper-maze__figure');
    try {
      figure.innerHTML = M.toSVG(M.parse(item.maze.map, item.maze.dir), {
        cell: 18,
        label: 'Maze: ' + (item.title || 'Maze')
      });
    } catch (e) {
      figure.textContent = 'Could not draw this maze.';
    }
    box.appendChild(figure);
    return box;
  }

  function render(exam) {
    page.textContent = '';
    document.title = 'Answered exam - ' + exam.title;

    var header = el('header', 'report-header');
    if (H.school) header.appendChild(el('p', 'report-header__school', H.school));
    header.appendChild(el('h1', null, 'Answered exam'));
    header.appendChild(el('p', 'report-header__exam', exam.title));
    page.appendChild(header);

    var meta = el('div', 'paper-meta');
    [['Subject', exam.subject || 'General'], ['Mode', exam.mode === 'mixed' ? 'Mixed' : 'MCQ only'],
     ['Questions', X.countQuestions(exam)], ['Total points', X.examPoints(exam)]].forEach(function (row) {
      var item = el('span');
      item.appendChild(el('b', null, row[0] + ': '));
      item.appendChild(document.createTextNode(String(row[1])));
      meta.appendChild(item);
    });
    page.appendChild(meta);

    var section = el('section', 'paper-section');
    section.appendChild(el('h2', null, 'Questions, answers and answer keys'));
    var n = 0;
    exam.items.forEach(function (item) {
      if (item.type === 'maze') {
        section.appendChild(mazeBlock(item));
        item.questions.forEach(function (q) {
          n++;
          section.appendChild(questionBlock(q, n, 'Maze: ' + (item.title || 'Maze')));
        });
      } else if (item.type === 'open') {
        n++;
        section.appendChild(openBlock(item, n));
      } else {
        n++;
        section.appendChild(questionBlock(item, n, ''));
      }
    });
    page.appendChild(section);

    document.getElementById('btn-print').disabled = false;
  }

  function load() {
    var id = new URLSearchParams(location.search).get('id');
    if (!id) { showMessage('No exam was selected.'); return; }
    fetch('../api/exams/' + encodeURIComponent(id)).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || ('Server error ' + r.status));
        return d;
      });
    }).then(render).catch(function (e) {
      showMessage(e.message === 'Teacher login required.' ? 'Your teacher session has expired. Sign in again from the builder.' : ('Could not load the exam: ' + e.message));
    });
  }

  document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
  document.getElementById('btn-print').disabled = true;
  load();
}());
