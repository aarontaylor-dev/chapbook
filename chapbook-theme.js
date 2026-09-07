/*
 * Chapbook — theme bootstrap (optional)
 * https://style.aarontaylor.me
 *
 * Rule 08: the toggle ships hidden and script reveals it, so a visitor
 * without JavaScript is never offered a button that cannot work.
 *
 * INLINE THIS IN <head>, before the stylesheet. Fetching it as a file costs a
 * round trip, and a round trip here is a flash of the wrong colour on every
 * load for anyone who chose dark.
 *
 * Inlining normally costs 'unsafe-inline' in a Content-Security-Policy, which
 * admits every other script too. Admit this one by hash instead:
 *
 *   script-src 'sha256-<base64 of the exact bytes between the script tags>'
 *
 * Generate the hash at build time from the same file the page inlines, or the
 * two drift and the toggle is silently blocked. build.js in this repo shows
 * the pattern.
 *
 * The markup it expects:
 *
 *   <button class="theme" id="theme" type="button" hidden>
 *     <svg class="tsvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
 *       <circle class="ring" cx="12" cy="12" r="8.4" fill="none"/>
 *       <path class="half" d="M12 3.6 A8.4 8.4 0 0 1 12 20.4 Z"/>
 *     </svg>
 *     <span class="vh">Switch theme</span>
 *   </button>
 */
(function () {
  var d = document.documentElement;
  var K = 'theme';

  /* Runs before first paint. Everything below it can wait for the DOM. */
  try {
    var saved = localStorage.getItem(K);
    if (saved === 'light' || saved === 'dark') d.setAttribute('data-theme', saved);
  } catch (e) {}

  function current() {
    return d.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme');
    if (!btn) return;
    btn.hidden = false;
    btn.setAttribute('aria-pressed', current() === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      /* Colours cross-fade only while the theme is actually changing. */
      d.classList.add('theming');
      d.setAttribute('data-theme', next);
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
      try { localStorage.setItem(K, next); } catch (e) {}
      setTimeout(function () { d.classList.remove('theming'); }, 320);
    });
  });
})();
