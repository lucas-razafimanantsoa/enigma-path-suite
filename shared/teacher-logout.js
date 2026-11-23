/* Clears the teacher cookie from the builder / results pages. */
(function () {
  'use strict';
  var btn = document.getElementById('teacher-logout');
  if (!btn) return;
  btn.addEventListener('click', function () {
    fetch('../api/logout', { method: 'POST' })
      .finally(function () { window.location.href = 'login.html'; });
  });
}());
