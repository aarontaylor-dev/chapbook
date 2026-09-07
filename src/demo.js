/* The skin picker. Specimen-only — it is not part of the system, and it is
   not in chapbook.css. It swaps one attribute on the root element and shows
   the matching panel; every visible change after that is the stylesheet's. */
(function () {
  var d = document.documentElement;
  var btns = [].slice.call(document.querySelectorAll('[data-skin-set]'));
  var panels = [].slice.call(document.querySelectorAll('[data-skin-panel]'));
  if (!btns.length) return;

  function show(id) {
    /* "neutral" is the default palette in chapbook.css itself, so it is the
       absence of a skin rather than a skin. */
    if (id === 'neutral') d.removeAttribute('data-skin');
    else d.setAttribute('data-skin', id);

    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.skinSet === id ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      p.hidden = p.dataset.skinPanel !== id;
    });
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      /* Cross-fade the colours, for the same reason and the same duration as
         the theme toggle. */
      d.classList.add('theming');
      show(b.dataset.skinSet);
      setTimeout(function () { d.classList.remove('theming'); }, 320);
    });
  });
})();
