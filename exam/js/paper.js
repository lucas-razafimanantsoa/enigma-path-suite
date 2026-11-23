/* EnigmaPath printable exam paper. The answered copy shows answers and answer keys;
 * the blank copy shows the questions, checkboxes and space to write answers. */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var blank = params.get('blank') === '1';
  var page = document.getElementById('paper-page');
  var X = window.EPExam;
  var M = window.EPMaze;
  var H = window.EP_RESULT_HEADER || {};
  var P = window.EP_PAPER_HEADER || {};
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function setPageName(name) {
    document.title = name;
    var small = document.querySelector('.ep-brand small');
    if (small) small.textContent = name;
  }

  function showMessage(text) {
    page.textContent = '';
    var box = el('div', 'paper-error');
    box.appendChild(el('h2', null, blank ? 'Exam paper' : 'Answered exam'));
    box.appendChild(el('p', 'muted', text));
    var back = el('a', 'btn', 'Back to the exam builder');
    back.href = 'builder.html';
    box.appendChild(back);
    page.appendChild(box);
  }

  function metaRow(exam) {
    var meta = el('div', 'paper-meta');
    [['Subject', exam.subject || 'General'],
     ['Mode', exam.mode === 'mixed' ? 'Mixed' : 'MCQ only'],
     ['Questions', X.countQuestions(exam)],
     ['Total points', X.examPoints(exam)]].forEach(function (row) {
      var item = el('span');
      item.appendChild(el('b', null, row[0] + ': '));
      item.appendChild(document.createTextNode(String(row[1])));
      meta.appendChild(item);
    });
    return meta;
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

  /* ------------------------------------------------------ answered teacher copy */

  function answeredQuestionBlock(q, n, mazeTitle) {
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

  function answeredOpenBlock(q, n) {
    var card = el('article', 'paper-question');
    card.appendChild(el('h3', null, 'Q' + n + ' · Open-ended · ' + q.points + ' point' + (q.points === 1 ? '' : 's')));
    card.appendChild(el('p', 'paper-question__text', q.text));
    var key = el('p', 'paper-answer');
    key.appendChild(el('b', null, 'Answer key: '));
    key.appendChild(document.createTextNode(q.modelAnswer || 'No answer key.'));
    card.appendChild(key);
    if (q.markingNotes) {
      var notes = el('p', 'paper-notes');
      notes.appendChild(el('b', null, 'Marking notes: '));
      notes.appendChild(document.createTextNode(q.markingNotes));
      card.appendChild(notes);
    }
    return card;
  }

  function renderAnswered(exam) {
    setPageName('Answered exam');
    page.textContent = '';
    document.title = 'Answered exam - ' + exam.title;

    var header = el('header', 'report-header');
    if (H.school) header.appendChild(el('p', 'report-header__school', H.school));
    header.appendChild(el('h1', null, 'Answered exam'));
    header.appendChild(el('p', 'report-header__exam', exam.title));
    page.appendChild(header);
    page.appendChild(metaRow(exam));

    var section = el('section', 'paper-section');
    section.appendChild(el('h2', null, 'Questions, answers and answer keys'));
    var n = 0;
    exam.items.forEach(function (item) {
      if (item.type === 'maze') {
        section.appendChild(mazeBlock(item));
        item.questions.forEach(function (q) {
          n++;
          section.appendChild(answeredQuestionBlock(q, n, 'Maze: ' + (item.title || 'Maze')));
        });
      } else if (item.type === 'open') {
        n++;
        section.appendChild(answeredOpenBlock(item, n));
      } else {
        n++;
        section.appendChild(answeredQuestionBlock(item, n, ''));
      }
    });
    page.appendChild(section);
  }

  /* ------------------------------------------------------------- blank paper */

  function candidateFields() {
    var fields = Array.isArray(P.fields) && P.fields.length ? P.fields : ['name', 'grade', 'date'];
    var box = el('div', 'paper-candidate');
    fields.forEach(function (key) {
      var field = el('div', 'paper-candidate__field');
      field.appendChild(el('span', 'paper-candidate__label', (P.labels && P.labels[key]) || key));
      field.appendChild(el('span', 'paper-candidate__line'));
      box.appendChild(field);
    });
    return box;
  }

  function blankQuestionBlock(q, n, mazeTitle) {
    var card = el('article', 'paper-question');
    var head = el('div', 'paper-question__head');
    head.appendChild(el('b', 'paper-question__number', 'Q' + n));
    head.appendChild(el('span', 'paper-question__points', '1 point'));
    if (mazeTitle) head.appendChild(el('span', 'paper-question__maze', mazeTitle));
    card.appendChild(head);
    card.appendChild(el('p', 'paper-question__text', q.text));
    var list = el('ul', 'paper-options paper-options--blank');
    q.options.forEach(function (text, i) {
      var li = el('li', 'paper-option');
      li.appendChild(el('span', 'paper-checkbox'));
      li.appendChild(el('span', 'paper-options__key', LETTERS[i] || String(i + 1)));
      li.appendChild(el('span', 'paper-option__text', text));
      list.appendChild(li);
    });
    card.appendChild(list);
    return card;
  }

  function blankOpenBlock(q, n) {
    var card = el('article', 'paper-question');
    var head = el('div', 'paper-question__head');
    head.appendChild(el('b', 'paper-question__number', 'Q' + n));
    head.appendChild(el('span', 'paper-question__points', q.points + ' point' + (q.points === 1 ? '' : 's')));
    card.appendChild(head);
    card.appendChild(el('p', 'paper-question__text', q.text));
    var area = el('div', 'paper-answer-space');
    area.appendChild(el('span', 'paper-answer-label', 'Answer:'));
    var lines = Math.min(15, Math.max(3, Number(q.points) || 3));
    for (var i = 0; i < lines; i++) area.appendChild(el('div', 'paper-answer-line'));
    card.appendChild(area);
    return card;
  }

  function renderBlank(exam) {
    setPageName('Exam paper');
    page.textContent = '';
    document.title = 'Exam paper - ' + exam.title;

    var header = el('header', 'report-header');
    if (P.school) header.appendChild(el('p', 'report-header__school', P.school));
    header.appendChild(el('h1', null, P.title || 'Examination Paper'));
    header.appendChild(el('p', 'report-header__exam', exam.title));
    if (exam.description) header.appendChild(el('p', 'report-header__exam', exam.description));
    page.appendChild(header);
    page.appendChild(metaRow(exam));
    page.appendChild(candidateFields());
    if (P.instructions) page.appendChild(el('p', 'paper-instructions', P.instructions));

    var section = el('section', 'paper-section');
    section.appendChild(el('h2', null, 'Questions'));
    var n = 0;
    exam.items.forEach(function (item) {
      if (item.type === 'maze') {
        section.appendChild(mazeBlock(item));
        item.questions.forEach(function (q) {
          n++;
          section.appendChild(blankQuestionBlock(q, n, 'Maze: ' + (item.title || 'Maze')));
        });
      } else if (item.type === 'open') {
        n++;
        section.appendChild(blankOpenBlock(item, n));
      } else {
        n++;
        section.appendChild(blankQuestionBlock(item, n, ''));
      }
    });
    page.appendChild(section);
    if (P.footer) page.appendChild(el('footer', 'paper-footer', P.footer));
  }

  function render(exam) {
    if (blank) renderBlank(exam);
    else renderAnswered(exam);
    document.getElementById('btn-print').disabled = false;
  }

  function load() {
    var id = params.get('id');
    if (!id) { showMessage('No exam was selected.'); return; }
    var url = '../api/exams/' + encodeURIComponent(id) + (blank ? '/student' : '');
    fetch(url).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || 'Could not load the exam.');
        return data;
      });
    }).then(render).catch(function (error) {
      showMessage(/Teacher login/i.test(error.message)
        ? 'Teacher login has expired. Sign in again from the builder.'
        : ('Could not load the exam: ' + error.message));
    });
  }

  document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
  document.getElementById('btn-print').disabled = true;
  load();
}());
