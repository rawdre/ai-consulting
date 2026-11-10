/* Fills the "what's included" list inside each package card (nested lists are
   not handled by engine.js). Reads SITE.pacotes[i].inclui. */
(function () {
  'use strict';
  var site = window.TEMPLATE && window.TEMPLATE.site;
  if (!site || !Array.isArray(site.pacotes)) return;
  document.querySelectorAll('[data-list="pacotes"] .pk').forEach(function (card, index) {
    var pack = site.pacotes[index];
    var list = card.querySelector('[data-list-inner]');
    if (!pack || !list) return;
    (pack.inclui || []).forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = window.TEMPLATE.fill(item);
      list.appendChild(li);
    });
  });
})();
