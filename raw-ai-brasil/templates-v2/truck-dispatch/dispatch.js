/* =====================================================================
   RAW AI — Truck Dispatch: calculadora de lucro por carga + cotação
   Roda depois do engine.js e usa window.TEMPLATE (site já personalizado).
   Você NÃO precisa editar este arquivo: edite só o config.js.
   ===================================================================== */
(function () {
  'use strict';

  var T = window.TEMPLATE;
  if (!T) {
    console.error('[template] engine.js não carregou: window.TEMPLATE ausente.');
    return;
  }
  var site = T.site;
  var $ = function (id) { return document.getElementById(id); };
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------- calculadora ---------- */
  var CALC_FIELDS = { cFrete: 'frete', cMilhas: 'milhas', cDeadhead: 'deadhead', cMpg: 'mpg', cDiesel: 'diesel', cTaxa: 'taxa' };

  function num(id) {
    var value = parseFloat($(id).value);
    return isFinite(value) && value >= 0 ? value : 0;
  }

  function calculate() {
    var gross = num('cFrete');
    var loaded = num('cMilhas');
    var deadhead = num('cDeadhead');
    var mpg = num('cMpg');
    var total = loaded + deadhead;
    if (!gross || !loaded || !mpg) {
      ['oRpm', 'oRpmAll', 'oFuel', 'oFee', 'oDh', 'oNet'].forEach(function (id) { $(id).textContent = '—'; });
      $('oNetMile').textContent = 'Fill in rate, loaded miles and MPG.';
      return;
    }
    var fuel = (total / mpg) * num('cDiesel');
    var fee = gross * num('cTaxa') / 100;
    var net = gross - fuel - fee;
    $('oRpm').textContent = usd2.format(gross / loaded) + '/mi';
    $('oRpmAll').textContent = usd2.format(gross / total) + '/mi';
    $('oFuel').textContent = '− ' + usd.format(fuel);
    $('oFee').textContent = '− ' + usd.format(fee);
    $('oDh').textContent = Math.round(deadhead / total * 100) + '% of miles';
    $('oNet').textContent = usd.format(net);
    $('oNetMile').textContent = usd2.format(net / total) + ' per total mile, before truck payment, insurance and maintenance.';
  }

  function initCalculator() {
    var form = $('calcForm');
    if (!form) return;
    var defaults = site.calculadora || {};
    Object.keys(CALC_FIELDS).forEach(function (id) {
      var value = defaults[CALC_FIELDS[id]];
      if (value != null) $(id).value = value;
    });
    form.addEventListener('input', calculate);
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    calculate();
  }

  /* ---------- cotação pelo WhatsApp ---------- */
  function initQuote() {
    var form = $('quoteForm');
    var cfg = site.onboarding;
    if (!form || !cfg) return;
    var equip = $('qEquip');
    (cfg.equipamentos || []).forEach(function (item) {
      var option = document.createElement('option');
      option.textContent = item;
      equip.appendChild(option);
    });
    var send = $('qSend');
    var error = $('qErro');

    function message() {
      var mc = $('qMc').value.replace(/[^\d]/g, '');
      return 'Hi {nome}! I want a free dispatch quote.\n' +
        'Name: ' + ($('qNome').value.trim() || '...') + '\n' +
        'MC: ' + (mc ? 'MC-' + mc : 'not yet') + '\n' +
        'Equipment: ' + equip.value + ' · Trucks: ' + $('qTrucks').value + '\n' +
        'Home base / lanes: ' + ($('qLanes').value.trim() || '...');
    }

    function update() {
      var text = message();
      $('qPreview').textContent = T.fill(text);
      send.href = T.waLink(text);
    }

    form.addEventListener('input', function () { error.hidden = true; update(); });
    form.addEventListener('change', update);
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    // Link real (não window.open) para funcionar dentro do Instagram/Facebook.
    send.addEventListener('click', function (event) {
      if ($('qNome').value.trim()) return;
      event.preventDefault();
      error.hidden = false;
      $('qNome').focus();
    });
    update();
  }

  var email = $('emailLink');
  if (email && site.contato && site.contato.email) email.href = 'mailto:' + site.contato.email;

  initCalculator();
  initQuote();
})();
