/* =====================================================================
   RAW AI — Imobiliária: vitrine de imóveis, busca e avaliação gratuita
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
  var ESTIMATE_SPREAD = 0.12;        // faixa de ±12% em torno da estimativa
  var MIN_AREA = 10;
  var MAX_AREA = 5000;
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = T.fill(String(text));
    return node;
  }

  function setWa(node, message) {
    node.href = T.waLink(message);
    node.target = '_blank';
    node.rel = 'noopener';
  }

  /* ---------- vitrine ---------- */
  var imoveis = Array.isArray(site.imoveis) ? site.imoveis : [];
  var filtro = { finalidade: '', tipo: '', quartos: 0 };

  function card(imovel) {
    var article = el('article', 'listing');
    var media = el('div', 'listing-img');
    var img = document.createElement('img');
    img.src = imovel.imagem;
    img.alt = T.fill(imovel.titulo);
    img.loading = 'lazy';
    img.width = 1168;
    img.height = 880;
    media.appendChild(img);
    var tag = el('span', 'tag', imovel.finalidade === 'aluguel' ? 'Aluguel' : 'Venda');
    tag.setAttribute('data-finalidade', imovel.finalidade);
    media.appendChild(tag);
    if (imovel.codigo) media.appendChild(el('span', 'code', imovel.codigo));

    var body = el('div', 'listing-body');
    body.appendChild(el('span', 'listing-type', imovel.tipo));
    body.appendChild(el('h3', '', imovel.titulo));
    body.appendChild(el('span', 'listing-place', imovel.bairro + ' · ' + site.negocio.cidade));
    var specs = el('div', 'specs');
    [['quartos', 'qts'], ['vagas', 'vagas'], ['area', '']].forEach(function (pair) {
      var value = imovel[pair[0]];
      if (!value) return;
      var span = document.createElement('span');
      span.appendChild(el('b', '', value));
      if (pair[1]) span.appendChild(document.createTextNode(' ' + pair[1]));
      specs.appendChild(span);
    });
    body.appendChild(specs);
    var foot = el('div', 'listing-foot');
    foot.appendChild(el('span', 'price', imovel.preco));
    var cta = el('a', 'btn btn-green', 'Tenho interesse');
    setWa(cta, 'Olá! Tenho interesse no imóvel ' + (imovel.codigo || '') + ' — ' + imovel.titulo + ' (' + imovel.preco + '). Vi no site da {nome}.');
    foot.appendChild(cta);
    body.appendChild(foot);

    article.appendChild(media);
    article.appendChild(body);
    return article;
  }

  function matches(imovel) {
    if (filtro.finalidade && imovel.finalidade !== filtro.finalidade) return false;
    if (filtro.tipo && imovel.tipo !== filtro.tipo) return false;
    if (filtro.quartos && !(parseInt(imovel.quartos, 10) >= filtro.quartos)) return false;
    return true;
  }

  function renderListings() {
    var grid = $('listings');
    if (!grid) return;
    grid.replaceChildren();
    var visible = imoveis.filter(matches);
    visible.forEach(function (imovel) { grid.appendChild(card(imovel)); });
    if (!visible.length) {
      var empty = el('div', 'empty', 'Nenhum imóvel com esse filtro na vitrine agora. ');
      var ask = el('a', '', 'Peça ao corretor pelo WhatsApp →');
      ask.style.fontWeight = '700';
      ask.style.color = 'var(--ink)';
      setWa(ask, 'Olá! Procuro ' + (filtro.tipo || 'um imóvel') + (filtro.finalidade === 'aluguel' ? ' para alugar' : ' para comprar') + (filtro.quartos ? ' com ' + filtro.quartos + '+ quartos' : '') + '. Vi o site da {nome}.');
      empty.appendChild(ask);
      grid.appendChild(empty);
    }
  }

  function pressOnly(buttons, active) {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === active)); });
  }

  function initFilters() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filtro]'));
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        filtro = { finalidade: chip.getAttribute('data-filtro'), tipo: '', quartos: 0 };
        pressOnly(chips, chip);
        renderListings();
      });
    });

    var form = $('search');
    if (!form) return;
    var tipoSelect = $('searchTipo');
    imoveis.map(function (i) { return i.tipo; })
      .filter(function (tipo, index, all) { return tipo && all.indexOf(tipo) === index; })
      .forEach(function (tipo) {
        var option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
      });
    var seg = Array.prototype.slice.call(form.querySelectorAll('[data-finalidade]'));
    var finalidade = 'venda';
    seg.forEach(function (button) {
      button.addEventListener('click', function () {
        finalidade = button.getAttribute('data-finalidade');
        pressOnly(seg, button);
      });
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      filtro = { finalidade: finalidade, tipo: tipoSelect.value, quartos: parseInt($('searchQuartos').value, 10) || 0 };
      pressOnly(chips, chips.filter(function (c) { return c.getAttribute('data-filtro') === finalidade; })[0]);
      renderListings();
      $('imoveis').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- avaliação gratuita ---------- */
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  function estimate(area, objetivo) {
    var cfg = site.avaliacao || {};
    var m2 = objetivo === 'aluguel' ? cfg.m2Aluguel : cfg.m2Venda;
    if (!m2 || !(area >= MIN_AREA && area <= MAX_AREA)) return null;
    var base = area * m2;
    return { min: base * (1 - ESTIMATE_SPREAD), max: base * (1 + ESTIMATE_SPREAD) };
  }

  function initValuation() {
    var form = $('valuationForm');
    var cfg = site.avaliacao;
    if (!form || !cfg) return;
    var tipo = $('vTipo');
    (cfg.tipos || []).forEach(function (t) {
      var option = document.createElement('option');
      option.textContent = t;
      tipo.appendChild(option);
    });
    var send = $('vEnviar');
    var error = $('vErro');

    function rangeText(objetivo) {
      var range = estimate(parseFloat($('vArea').value), objetivo);
      if (!range) return '';
      var suffix = objetivo === 'aluguel' ? '/mês' : '';
      return brl.format(range.min) + ' a ' + brl.format(range.max) + suffix;
    }

    function update() {
      var objetivo = $('vObjetivo').value;
      var range = rangeText(objetivo);
      $('estimateLabel').textContent = objetivo === 'aluguel' ? 'Aluguel estimado' : 'Valor de venda estimado';
      $('estimateValue').textContent = range || 'Preencha a área';
      var message = 'Olá! Quero a avaliação gratuita da {nome}.\n' +
        'Meu nome: ' + ($('vNome').value.trim() || '...') + '\n' +
        'Quero ' + (objetivo === 'aluguel' ? 'alugar' : 'vender') + ': ' + tipo.value + ', ' + ($('vArea').value || '?') + ' m², ' + $('vQuartos').value + ' quarto(s)\n' +
        'Local: ' + ($('vBairro').value.trim() || '{bairro}') +
        (range ? '\nEstimativa do site: ' + range : '');
      send.href = T.waLink(message);
    }

    form.addEventListener('input', function () { error.hidden = true; update(); });
    form.addEventListener('change', update);
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    // Link real (não window.open) para funcionar dentro do Instagram/Facebook.
    send.addEventListener('click', function (event) {
      var area = parseFloat($('vArea').value);
      if ($('vNome').value.trim() && area >= MIN_AREA && area <= MAX_AREA) return;
      event.preventDefault();
      error.hidden = false;
    });
    update();
  }

  /* ---------- bairros e contato ---------- */
  function initAreas() {
    var box = $('areas');
    if (!box) return;
    var seen = {};
    (site.bairros || []).map(function (b) { return T.fill(b); }).forEach(function (bairro) {
      var key = bairro.toLowerCase();
      if (!bairro || seen[key]) return;
      seen[key] = true;
      box.appendChild(el('span', '', bairro));
    });
  }

  var email = $('emailLink');
  if (email && site.contato && site.contato.email) email.href = 'mailto:' + site.contato.email;

  renderListings();
  initFilters();
  initValuation();
  initAreas();
})();
