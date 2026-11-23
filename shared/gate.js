/* EnigmaPath teacher gate.
 * withPassword(fn) asks for the teacher password, then calls fn() on success.
 * Used by the "Show solution" buttons in the offline activity pages.
 * This is a classroom-level gate, not security: the password is visible in source. */
(function () {
  'use strict';

  var PASSWORD = 'Mirija04';
  var overlay = null;
  var field = null;
  var error = null;
  var action = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'ep-gate';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="ep-gate__card" role="dialog" aria-modal="true" aria-labelledby="ep-gate-title">' +
        '<h2 id="ep-gate-title">Teacher only</h2>' +
        '<p>Enter the teacher password to reveal the solution.</p>' +
        '<input type="password" id="ep-gate-input" autocomplete="off" spellcheck="false" placeholder="Password" aria-label="Teacher password">' +
        '<div class="ep-gate__error" id="ep-gate-error" role="alert"></div>' +
        '<div class="ep-gate__actions">' +
          '<button type="button" class="btn btn--small" id="ep-gate-cancel">Cancel</button>' +
          '<button type="button" class="btn btn--primary btn--small" id="ep-gate-ok">Unlock</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    field = overlay.querySelector('#ep-gate-input');
    error = overlay.querySelector('#ep-gate-error');
    overlay.querySelector('#ep-gate-cancel').addEventListener('click', close);
    overlay.querySelector('#ep-gate-ok').addEventListener('click', submit);
    field.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) close(); });
  }

  function close() {
    overlay.hidden = true;
    field.value = '';
    error.textContent = '';
    action = null;
  }

  function submit() {
    if (field.value === PASSWORD) {
      var fn = action;
      close();
      if (fn) fn();
      return;
    }
    error.textContent = 'That password is not right. Try again.';
    error.classList.remove('shake');
    void error.offsetWidth;
    error.classList.add('shake');
    field.focus();
    field.select();
  }

  window.EPGate = {
    withPassword: function (fn) {
      if (!overlay) build();
      action = fn;
      error.textContent = '';
      overlay.hidden = false;
      field.focus();
    }
  };
}());
