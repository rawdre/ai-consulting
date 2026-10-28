/* =====================================================================
   DRINX — loja, carrinho e pedido pelo WhatsApp.
   Lê window.SITE (config.js) e window.TEMPLATE (engine.js).
   O pedido sai pronto no WhatsApp da loja: itens, total, endereço,
   link do mapa para o entregador, horário e pagamento.
   ===================================================================== */
(function () {
  'use strict';

  var T = window.TEMPLATE;
  if (!T) return;
  var site = T.site;
  var KEY_CART = 'drinx_cart';
  var KEY_CLIENT = 'drinx_cliente';
  var KEY_LAST = 'drinx_ultimo';
  var KEY_AGE = 'drinx_18';
  var AD_INTERVAL_MS = 6000;
  var TOAST_MS = 1800;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- helpers ---------- */
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'class') node.className = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function brl(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
    return val;
  }
  function track(name, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
    if (typeof window.fbq === 'function' && name === 'pedido_whatsapp') window.fbq('track', 'Lead', params);
  }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, TOAST_MS);
  }

  /* ---------- catálogo ---------- */
  var catalog = {};
  (site.produtos || []).forEach(function (p) { catalog[p.id] = p; });
  (site.kits || []).forEach(function (k) { catalog[k.id] = { id: k.id, nome: k.titulo, detalhe: k.itens, preco: k.preco }; });
  var catIcon = {};
  (site.categorias || []).forEach(function (c) { catIcon[c.id] = c.icone; });

  /* ---------- carrinho (estado imutável) ---------- */
  var cart = (store(KEY_CART) || []).filter(function (l) { return catalog[l.id] && l.qty > 0; });

  function qtyOf(id) {
    var line = cart.filter(function (l) { return l.id === id; })[0];
    return line ? line.qty : 0;
  }
  function setQty(id, qty) {
    var exists = cart.some(function (l) { return l.id === id; });
    var next = exists
      ? cart.map(function (l) { return l.id === id ? { id: id, qty: qty } : l; })
      : cart.concat([{ id: id, qty: qty }]);
    cart = next.filter(function (l) { return l.qty > 0; });
    store(KEY_CART, cart);
    refresh();
  }
  function add(id) {
    setQty(id, qtyOf(id) + 1);
    toast('✓ ' + catalog[id].nome + ' no carrinho');
    track('add_to_cart', { item: id });
  }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function subtotal() { return cart.reduce(function (s, l) { return s + catalog[l.id].preco * l.qty; }, 0); }

  function stepper(id) {
    return el('div', { class: 'stepper' }, [
      el('button', { type: 'button', 'aria-label': 'Menos', text: '−', onclick: function () { setQty(id, qtyOf(id) - 1); } }),
      el('span', { text: String(qtyOf(id)) }),
      el('button', { type: 'button', 'aria-label': 'Mais', text: '+', onclick: function () { setQty(id, qtyOf(id) + 1); } })
    ]);
  }
  function buyControl(id, label) {
    return qtyOf(id) > 0
      ? stepper(id)
      : el('button', { class: 'add', type: 'button', text: label || '+ Adicionar', onclick: function () { add(id); } });
  }

  /* ---------- loja: filtros + produtos ---------- */
  var filter = 'todos';
  var query = '';

  function renderChips() {
    var box = $('#chips');
    var all = [{ id: 'todos', titulo: 'Tudo', icone: '✨' }].concat(site.categorias || []);
    box.textContent = '';
    all.forEach(function (c) {
      box.appendChild(el('button', {
        class: 'chip' + (filter === c.id ? ' on' : ''), type: 'button', 'aria-pressed': String(filter === c.id),
        text: c.icone + ' ' + c.titulo,
        onclick: function () { filter = c.id; renderChips(); renderProducts(); }
      }));
    });
  }

  function normalize(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function renderProducts() {
    var grid = $('#products');
    var q = normalize(query);
    var list = (site.produtos || []).filter(function (p) {
      var inCat = filter === 'todos' || p.cat === filter;
      return inCat && (!q || normalize(p.nome + ' ' + p.detalhe).indexOf(q) > -1);
    });
    grid.textContent = '';
    if (!list.length) {
      grid.appendChild(el('p', { class: 'empty', text: 'Nada encontrado. Chama no WhatsApp que a gente procura pra você.' }));
      return;
    }
    list.forEach(function (p) {
      var ico = el('div', { class: 'prod-ico', 'aria-hidden': 'true' });
      if (p.imagem) ico.appendChild(el('img', { src: p.imagem, alt: '', loading: 'lazy' }));
      else ico.textContent = catIcon[p.cat] || '🍾';
      grid.appendChild(el('article', { class: 'prod' }, [
        p.selo ? el('span', { class: 'selo', text: p.selo }) : null,
        ico,
        el('h3', { text: p.nome }),
        el('small', { text: p.detalhe }),
        el('div', { class: 'prod-foot' }, [el('span', { class: 'price', text: brl(p.preco) }), buyControl(p.id)])
      ]));
    });
  }

  function renderKits() {
    var grid = $('#kitsGrid');
    grid.textContent = '';
    (site.kits || []).forEach(function (k) {
      grid.appendChild(el('article', { class: 'kit' }, [
        el('img', { src: k.imagem, alt: '', loading: 'lazy' }),
        k.selo ? el('span', { class: 'flag', text: k.selo }) : null,
        el('div', { class: 'kit-body' }, [
          el('span', { class: 'occ', text: k.ocasiao }),
          el('h3', { text: k.titulo }),
          el('p', { text: k.itens }),
          el('div', { class: 'prod-foot' }, [el('span', { class: 'price', text: brl(k.preco) }), buyControl(k.id, '+ Kit')])
        ])
      ]));
    });
  }

  /* ---------- anúncios (carrossel) ---------- */
  function renderAds() {
    var rail = $('#adsTrack');
    var dots = $('#adsDots');
    var ads = site.anuncios || [];
    var current = 0;
    var paused = false;
    function go(i) { rail.scrollTo({ left: rail.clientWidth * i, behavior: 'smooth' }); }
    ads.forEach(function (a, i) {
      rail.appendChild(el('article', { class: 'ad', 'aria-roledescription': 'anúncio', 'aria-label': (i + 1) + ' de ' + ads.length }, [
        el('div', { class: 'ad-body' }, [
          el('span', { class: 'ad-tag', text: a.tag }),
          el('h3', { text: a.titulo }),
          el('p', { text: a.texto }),
          el('a', { class: 'btn btn-gold', href: T.waLink(a.whatsapp), target: '_blank', rel: 'noopener', text: a.cta })
        ]),
        el('div', { class: 'ad-img', style: 'background-image:url("' + a.imagem + '")' })
      ]));
      dots.appendChild(el('button', { type: 'button', 'aria-label': 'Anúncio ' + (i + 1), onclick: function () { go(i); } }));
    });
    function mark() {
      current = Math.round(rail.scrollLeft / Math.max(rail.clientWidth, 1));
      $$('button', dots).forEach(function (d, i) { d.classList.toggle('on', i === current); });
    }
    rail.addEventListener('scroll', function () { window.requestAnimationFrame(mark); }, { passive: true });
    rail.addEventListener('pointerenter', function () { paused = true; });
    rail.addEventListener('pointerleave', function () { paused = false; });
    rail.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    mark();
    if (ads.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(function () { if (!paused && !document.hidden) go((current + 1) % ads.length); }, AD_INTERVAL_MS);
    }
  }

  /* ---------- topo, horários, status aberto ---------- */
  function renderTicker() {
    var items = site.topo || [];
    var box = $('#ticker');
    items.concat(items).forEach(function (t) { box.appendChild(el('span', { text: t })); });
  }

  function minutes(hhmm) { var p = String(hhmm).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function nowInBrasilia() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { day: days.indexOf(get('weekday')), min: (+get('hour') % 24) * 60 + (+get('minute')) };
  }
  function span(h) {
    if (!h || !h.abre) return null;
    var a = minutes(h.abre);
    var f = minutes(h.fecha);
    return { a: a, f: f <= a ? f + 1440 : f };
  }
  function openStatus(now) {
    var hs = site.horarios || [];
    if (hs.length !== 7) return null;
    var y = (now.day + 6) % 7;
    var today = span(hs[now.day]);
    var yest = span(hs[y]);
    if (today && now.min >= today.a && now.min < today.f) return { open: true, until: hs[now.day].fecha };
    if (yest && now.min + 1440 < yest.f) return { open: true, until: hs[y].fecha };
    return { open: false };
  }
  function renderHours() {
    var box = $('#hours');
    var now = nowInBrasilia();
    (site.horarios || []).forEach(function (h, i) {
      box.appendChild(el('div', { class: 'h-row' + (i === now.day ? ' today' : '') }, [
        el('span', { text: h.dia + (i === now.day ? ' · hoje' : '') }),
        el('strong', { text: h.abre ? h.abre + ' — ' + h.fecha : 'Fechado' })
      ]));
    });
    var st = openStatus(now);
    var pill = $('#openPill');
    if (!st || !pill) return;
    if (st.open) pill.textContent = 'Aberto agora · até ' + st.until;
    else {
      pill.classList.add('closed');
      pill.textContent = 'Fechado agora · agende seu pedido';
    }
  }

  /* ---------- área de entrega ---------- */
  function feeLabel(r) {
    if (r.taxa === null || r.taxa === undefined) return 'a combinar';
    return r.taxa === 0 ? 'Grátis' : brl(r.taxa);
  }
  function renderZones() {
    var ul = $('#zones');
    var sel = $('#regiao');
    var bits = [];
    (site.regioes || []).forEach(function (r, i) {
      ul.appendChild(el('li', {}, [
        el('span', {}, [document.createTextNode(r.nome), el('small', { text: r.prazo })]),
        el('span', { text: feeLabel(r) })
      ]));
      sel.appendChild(el('option', { value: String(i), text: r.nome + ' — ' + feeLabel(r) }));
    });
    if (site.pedidoMinimo) bits.push('Pedido mínimo ' + brl(site.pedidoMinimo) + '.');
    if (site.freteGratisAcima) bits.push('Entrega grátis acima de ' + brl(site.freteGratisAcima) + '.');
    $('#zoneNote').textContent = bits.join(' ');
  }

  /* ---------- drawer + checkout ---------- */
  var form = $('#checkout');
  var drawer = $('#drawer');
  var scrim = $('#scrim');
  var sent = false;

  function openCart() {
    drawer.classList.add('on');
    scrim.classList.add('on');
    document.body.classList.add('locked');
    track('abrir_carrinho', { itens: count() });
  }
  function closeCart() {
    drawer.classList.remove('on');
    scrim.classList.remove('on');
    document.body.classList.remove('locked');
    if (sent) { sent = false; refresh(); }
  }

  function data() {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    o.maior = form.elements.maior.checked;
    return o;
  }
  function fee(d) {
    if (d.tipo === 'retirada') return { val: 0, label: 'Retirada', known: true };
    var r = (site.regioes || [])[+d.regiao];
    if (!r || r.taxa === null || r.taxa === undefined) return { val: 0, label: 'a combinar', known: false };
    if (site.freteGratisAcima && subtotal() >= site.freteGratisAcima) return { val: 0, label: 'Grátis', known: true };
    return { val: r.taxa, label: r.taxa === 0 ? 'Grátis' : brl(r.taxa), known: true };
  }

  function renderEmpty(box) {
    var last = store(KEY_LAST);
    box.appendChild(el('div', { class: 'd-empty' }, [
      el('i', { text: '🛒' }),
      el('p', { text: 'Seu carrinho está vazio.' }),
      el('a', { class: 'btn btn-gold', href: '#loja', text: 'Ver bebidas', onclick: closeCart }),
      last && last.length ? el('button', {
        class: 'btn btn-ghost', type: 'button', text: '↻ Repetir meu último pedido',
        onclick: function () {
          cart = last.filter(function (l) { return catalog[l.id]; });
          store(KEY_CART, cart);
          refresh();
          track('repetir_pedido');
        }
      }) : null
    ]));
  }

  function renderLines() {
    var box = $('#lines');
    box.textContent = '';
    form.hidden = !cart.length;
    if (!cart.length) { renderEmpty(box); return; }
    cart.forEach(function (l) {
      var p = catalog[l.id];
      box.appendChild(el('div', { class: 'line' }, [
        el('div', { class: 'li-name' }, [el('strong', { text: p.nome }), el('small', { text: p.detalhe })]),
        stepper(l.id),
        el('span', { class: 'li-total', text: brl(p.preco * l.qty) })
      ]));
    });
  }

  function renderSummary() {
    var d = data();
    var f = fee(d);
    var sub = subtotal();
    var hint = $('#hint');
    var btn = $('#sendOrder');
    $('#sSub').textContent = brl(sub);
    $('#sFee').textContent = f.label;
    $('#sTot').textContent = brl(sub + f.val) + (f.known ? '' : ' + entrega');
    hint.classList.remove('good');
    if (cart.length && site.pedidoMinimo && sub < site.pedidoMinimo) {
      hint.textContent = 'Faltam ' + brl(site.pedidoMinimo - sub) + ' para o pedido mínimo.';
    } else if (cart.length && d.tipo === 'entrega' && site.freteGratisAcima && sub < site.freteGratisAcima) {
      hint.textContent = '🚚 Faltam ' + brl(site.freteGratisAcima - sub) + ' para entrega grátis.';
      hint.classList.add('good');
    } else hint.textContent = '';
    btn.disabled = !cart.length || sent;
    btn.style.opacity = btn.disabled ? '.5' : '1';
  }

  function syncFormVisibility() {
    var d = data();
    $$('[data-only="entrega"]', form).forEach(function (n) { n.hidden = d.tipo !== 'entrega'; });
    $('#agendaRow').hidden = d.quando !== 'agendar';
    $('#trocoRow').hidden = d.pagamento !== 'Dinheiro';
    renderSummary();
  }

  function refreshBadges() {
    var n = count();
    $$('[data-count]').forEach(function (b) { b.textContent = String(n); b.classList.toggle('on', n > 0); });
    $('#mbarCart').textContent = n ? '🛒 Ver pedido · ' + brl(subtotal()) : '🛒 Montar pedido';
  }

  function refresh() {
    refreshBadges();
    if (!sent) renderLines();
    renderSummary();
    renderProducts();
    renderKits();
  }

  function validate(d) {
    var errors = [];
    function mark(name, msg) {
      var input = form.elements[name];
      (input.type === 'checkbox' ? input.closest('label') : input).classList.add('bad');
      errors.push(msg);
    }
    $$('.bad', form).forEach(function (n) { n.classList.remove('bad'); });
    if (site.pedidoMinimo && subtotal() < site.pedidoMinimo) errors.push('Pedido mínimo de ' + brl(site.pedidoMinimo) + '.');
    if (d.tipo === 'entrega' && d.endereco.length < 6) mark('endereco', 'Informe o endereço completo.');
    if (d.quando === 'agendar' && (!d.dia || !d.hora)) { mark('dia', 'Escolha dia e horário.'); form.elements.hora.classList.add('bad'); }
    if (d.nome.length < 2) mark('nome', 'Informe seu nome.');
    if (!d.maior) mark('maior', 'Confirme que tem 18 anos ou mais.');
    return errors;
  }

  function orderId() {
    var n = new Date();
    var pad = function (x) { return ('0' + x).slice(-2); };
    return 'DRX-' + pad(n.getDate()) + pad(n.getMonth() + 1) + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  function buildMessage(d, id) {
    var f = fee(d);
    var sub = subtotal();
    var L = ['🍻 *NOVO PEDIDO · ' + site.negocio.nome + '*', 'Pedido *#' + id + '*', '', '*Itens*'];
    cart.forEach(function (l) {
      var p = catalog[l.id];
      L.push('• ' + l.qty + 'x ' + p.nome + ' (' + p.detalhe + ') — ' + brl(p.preco * l.qty));
    });
    L.push('', 'Subtotal: ' + brl(sub), 'Entrega: ' + f.label, '*Total: ' + brl(sub + f.val) + (f.known ? '' : ' + entrega') + '*', '');
    if (d.tipo === 'retirada') L.push('🏪 *Retirada na loja*');
    else {
      var r = (site.regioes || [])[+d.regiao];
      L.push('🚚 *Entrega* — ' + (r ? r.nome : ''), '📍 ' + d.endereco);
      if (d.referencia) L.push('Referência: ' + d.referencia);
      L.push('🗺️ Mapa p/ entregador: https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.endereco + ', Brasília - DF'));
    }
    if (d.quando === 'agendar') {
      var dp = d.dia.split('-');
      L.push('🕒 *Agendado:* ' + dp[2] + '/' + dp[1] + ' às ' + d.hora);
    } else L.push('⚡ *Quando:* o quanto antes');
    L.push('💳 *Pagamento:* ' + d.pagamento + (d.pagamento === 'Dinheiro' && d.troco ? ' (troco p/ R$ ' + d.troco + ')' : ''));
    L.push('', '👤 ' + d.nome + (d.fone ? ' · ' + d.fone : ''));
    if (d.obs) L.push('📝 ' + d.obs);
    L.push('✅ Cliente confirmou ter 18 anos ou mais.');
    return L.join('\n');
  }

  function showSuccess(id, url) {
    var box = $('#lines');
    sent = true;
    form.hidden = true;
    box.textContent = '';
    box.appendChild(el('div', { class: 'ok' }, [
      el('i', { text: '🎉' }),
      el('h3', { text: 'Pedido #' + id + ' pronto!' }),
      el('p', { text: 'Agora é só tocar em enviar no WhatsApp. Um atendente confirma estoque, total e horário em minutos.' }),
      el('a', { class: 'btn btn-wa', href: url, target: '_blank', rel: 'noopener', text: 'O WhatsApp não abriu? Toque aqui' }),
      el('button', { class: 'btn btn-ghost', type: 'button', text: 'Fazer novo pedido', onclick: function () { sent = false; refresh(); } })
    ]));
  }

  function sendOrder() {
    var d = data();
    var errors = validate(d);
    if (errors.length) {
      var bad = $('.bad', form);
      $('#hint').classList.remove('good');
      $('#hint').textContent = errors[0];
      if (bad) bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var id = orderId();
    var url = T.waLink(buildMessage(d, id));
    store(KEY_CLIENT, { nome: d.nome, fone: d.fone, endereco: d.endereco, referencia: d.referencia, regiao: d.regiao, pagamento: d.pagamento });
    store(KEY_LAST, cart);
    track('pedido_whatsapp', { pedido: id, valor: subtotal(), itens: count() });
    window.open(url, '_blank', 'noopener');
    showSuccess(id, url);
    cart = [];
    store(KEY_CART, cart);
    refresh();
  }

  function restoreClient() {
    var c = store(KEY_CLIENT);
    if (!c) return;
    Object.keys(c).forEach(function (k) {
      var input = form.elements[k];
      if (input && c[k]) input.value = c[k];
    });
  }

  /* ---------- portão 18+ e menu ---------- */
  function ageGate() {
    var gate = $('#gate');
    if (store(KEY_AGE)) return;
    gate.hidden = false;
    document.body.classList.add('locked');
    $('#gateYes').addEventListener('click', function () {
      store(KEY_AGE, true);
      gate.hidden = true;
      document.body.classList.remove('locked');
    });
  }
  function menuAria() {
    var nav = $('.nav');
    var toggle = $('.nav-toggle');
    new MutationObserver(function () {
      var open = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- init ---------- */
  renderTicker();
  renderAds();
  renderChips();
  renderZones();
  renderHours();
  restoreClient();
  syncFormVisibility();
  refresh();
  ageGate();
  menuAria();

  $('#q').addEventListener('input', function (e) { query = e.target.value; renderProducts(); });
  form.addEventListener('change', syncFormVisibility);
  form.addEventListener('input', function (e) { e.target.classList.remove('bad'); });
  $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  $('#closeCart').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
  $('#sendOrder').addEventListener('click', sendOrder);
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="https://wa.me"]');
    if (a && !a.closest('.drawer')) track('whatsapp_click', { origem: a.textContent.trim().slice(0, 40) });
  });
})();
