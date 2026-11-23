/* EnigmaPath marked result paper (teacher). Uses the browser's Print / Save as PDF. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var page = $('report-page');
  var H = window.EP_RESULT_HEADER || {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function fmtNum(value) {
    if (value === null || value === undefined || value === '') return '—';
    var n = Number(value);
    if (!isFinite(n)) return String(value);
    return String(Math.round(n * 100) / 100);
  }
  function fieldValue(key, result, marked) {
    switch (key) {
      case 'name': return result.student || '';
      case 'date': return result.finishedAt || '';
      case 'grade': return result.grade === undefined ? '' : String(result.grade);
      case 'subject': return result.subject || 'General';
      case 'score': return fmtNum(marked.score) + ' / ' + fmtNum(marked.total) + ' (' + fmtNum(marked.percent) + '%)';
      case 'symbol': return marked.symbol || '';
      default: return '';
    }
  }
  function displayLabel(key) {
    return (H.labels && H.labels[key]) || key;
  }

  function showMessage(text, linkHref, linkText) {
    page.textContent = '';
    var box = el('div', 'report-error');
    box.appendChild(el('h2', null, 'Result paper'));
    box.appendChild(el('p', 'report-empty', text));
    if (linkHref) {
      var a = el('a', 'btn', linkText || 'Back to marking');
      a.href = linkHref;
      box.appendChild(a);
    }
    page.appendChild(box);
  }

  function render(result, marked) {
    page.textContent = '';
    document.title = 'EnigmaPath - ' + result.student + ' - ' + result.examTitle;

    var header = el('header', 'report-header');
    if (H.school) header.appendChild(el('p', 'report-header__school', H.school));
    header.appendChild(el('h1', null, H.title || 'Examination Result'));
    header.appendChild(el('p', 'report-header__exam', result.examTitle));
    var fields = el('div', 'report-fields');
    (H.fields || ['name', 'date', 'grade', 'subject', 'score', 'symbol']).forEach(function (key) {
      var row = el('dl', 'report-field');
      row.appendChild(el('dt', null, displayLabel(key)));
      row.appendChild(el('dd', null, fieldValue(key, result, marked)));
      fields.appendChild(row);
    });
    header.appendChild(fields);
    var sig = el('div', 'report-signature');
    sig.appendChild(el('span', null, H.parentSignature || "Parent's signature"));
    header.appendChild(sig);
    page.appendChild(header);

    var scheme = el('section', 'report-section');
    scheme.appendChild(el('h2', null, 'Marking scheme'));
    var table = el('table', 'report-table');
    var thead = el('thead');
    var hr = el('tr');
    ['Q', 'Type', 'Max', 'Awarded', 'Comment'].forEach(function (h, i) {
      var th = el('th', i === 2 || i === 3 ? 'is-number' : '', h);
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el('tbody');
    var answers = marked.answers || [];
    answers.forEach(function (a) {
      var tr = el('tr');
      tr.appendChild(el('td', null, 'Q' + a.n));
      tr.appendChild(el('td', null, a.type === 'open' ? 'Open-ended' : 'MCQ'));
      tr.appendChild(el('td', 'is-number', fmtNum(a.maxPoints || a.points)));
      tr.appendChild(el('td', 'is-number', fmtNum(a.awarded)));
      tr.appendChild(el('td', null, a.comment || ''));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var tfoot = el('tfoot');
    var totalRow = el('tr');
    var totalLabel = el('td', null, 'Total');
    totalLabel.colSpan = 3;
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(el('td', 'is-number', fmtNum(marked.score) + ' / ' + fmtNum(marked.total)));
    totalRow.appendChild(el('td', null, fmtNum(marked.percent) + '% · ' + (marked.symbol || '')));
    tfoot.appendChild(totalRow);
    table.appendChild(tfoot);
    scheme.appendChild(table);
    page.appendChild(scheme);

    var questions = el('section', 'report-section');
    questions.appendChild(el('h2', null, 'Questions and answers'));
    answers.forEach(function (a) {
      var isOpen = a.type === 'open';
      var max = a.maxPoints || a.points || 1;
      var card = el('article', 'report-question');
      card.appendChild(el('h3', null, 'Q' + a.n + ' · ' + (isOpen ? 'Open-ended' : 'MCQ') +
        ' · ' + fmtNum(a.awarded) + ' / ' + fmtNum(max) + ' points'));
      card.appendChild(el('p', 'report-question__text', a.text));
      var grid = el('div', 'report-answer-grid');
      var student = el('div', 'report-answer');
      student.appendChild(el('span', 'report-answer__label', 'Student answer'));
      student.appendChild(el('div', 'report-answer__value', isOpen ? (a.response || 'No answer.') : (a.chosenText || 'No answer.')));
      var key = el('div', 'report-answer');
      key.appendChild(el('span', 'report-answer__label', isOpen ? 'Answer key' : 'Correct answer'));
      key.appendChild(el('div', 'report-answer__value', isOpen ? (a.modelAnswer || 'No answer key recorded.') : (a.correctText || '—')));
      grid.append(student, key);
      card.appendChild(grid);
      if (a.comment) card.appendChild(el('p', 'report-question__comment', 'Comment: ' + a.comment));
      questions.appendChild(card);
    });
    page.appendChild(questions);

    if (marked.generalComment) {
      var general = el('section', 'report-section');
      general.appendChild(el('h2', null, 'General comment'));
      general.appendChild(el('p', 'report-general', marked.generalComment));
      page.appendChild(general);
    }

    if (H.footer) page.appendChild(el('footer', 'report-footer', H.footer));
    $('btn-print').disabled = false;
  }

  function load() {
    var id = new URLSearchParams(location.search).get('id');
    if (!id) { showMessage('No result was selected.', 'marking.html'); return; }
    fetch('../api/results/' + encodeURIComponent(id)).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || ('Server error ' + r.status));
        return d;
      });
    }).then(function (d) {
      if (!d.marked) {
        showMessage('This submission has not been marked yet. Open the marking page, enter the marks, then print it.', 'marking.html');
        return;
      }
      render(d.result, d.marked);
    }).catch(function (e) {
      showMessage(e.message === 'Teacher login required.' ? 'Your teacher session has expired. Sign in again from the marking page.' : ('Could not load the result: ' + e.message), 'marking.html');
    });
  }

  $('btn-print').addEventListener('click', function () { window.print(); });
  $('btn-print').disabled = true;
  load();
}());
