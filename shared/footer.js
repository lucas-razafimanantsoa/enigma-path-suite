/* EnigmaPath shared footer - injected so every page shows the same contact and repository links. */
(function () {
  'use strict';

  var prev = document.querySelector('footer.ep-footer');
  var footer = document.createElement('footer');
  footer.className = 'ep-footer ep-footer--links';

  // Resolve the About page from wherever this script was loaded, so the link
  // works from the home page and from every nested app folder.
  var aboutUrl = 'about/index.html';
  try {
    if (document.currentScript && document.currentScript.src) {
      aboutUrl = new URL('../about/index.html', document.currentScript.src).href;
    }
  } catch (e) { /* keep the relative fallback */ }

  var inner = document.createElement('div');
  inner.className = 'ep-footer__inner';
  inner.innerHTML =
    '<span class="ep-footer__copy">Lucas M.R 2026, with vibes · v0.1.0</span>' +
    '<span class="ep-footer__links">' +
      '<a href="' + aboutUrl + '">About the app</a>' +
      '<span class="ep-footer__sep" aria-hidden="true">·</span>' +
      '<a href="mailto:lucas.mirija@pm.me">Contact</a>' +
      '<span class="ep-footer__sep" aria-hidden="true">·</span>' +
      '<a href="https://lucas-mirija-pf.netlify.app" target="_blank" rel="noopener noreferrer">Portfolio</a>' +
      '<span class="ep-footer__sep" aria-hidden="true">·</span>' +
      '<a href="https://github.com/lucas-razafimanantsoa/enigma-path-suite" target="_blank" rel="noopener noreferrer">GitHub repository</a>' +
    '</span>';
  footer.appendChild(inner);

  if (prev) prev.replaceWith(footer);
  else document.body.appendChild(footer);
}());
