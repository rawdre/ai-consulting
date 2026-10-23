/* =====================================================================
   RAW AI — Template Engine (white-label)
   Lê window.SITE (config.js) e preenche a página.
   Você NÃO precisa editar este arquivo: edite só o config.js.

   Marcadores usados no HTML:
     data-t="caminho"        → texto   (ex: data-t="negocio.nome")
     data-href="caminho"     → link
     data-img="caminho"      → <img src> ou background-image
     data-wa="mensagem"      → link de WhatsApp com texto pronto
     data-show="caminho"     → remove o elemento se o valor estiver vazio
     data-list="caminho"     → repete o <template> filho para cada item
       dentro do template: data-f="campo", data-fimg="campo", data-fwa="campo"

   Demo personalizada por URL (para prospecção):
     index.html?nome=Pet%20Star&bairro=Sobradinho&wa=5561999999999
   ===================================================================== */
(function () {
  'use strict';

  var MAX_PARAM_LENGTH = 60;
  var URL_OVERRIDES = { nome: 'negocio.nome', bairro: 'negocio.bairro', cidade: 'negocio.cidade' };

  var SITE = window.SITE;
  if (!SITE) {
    console.error('[template] config.js não carregou: window.SITE ausente.');
    return;
  }

  function get(obj, path) {
    if (path === '.') return obj;
    return path.split('.').reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  function withOverride(base, path, value) {
    var keys = path.split('.');
    var copy = Object.assign({}, base);
    var cursor = copy;
    keys.slice(0, -1).forEach(function (key) {
      cursor[key] = Object.assign({}, cursor[key]);
      cursor = cursor[key];
    });
    cursor[keys[keys.length - 1]] = value;
    return copy;
  }

  function cleanText(value) {
    return String(value).replace(/[<>]/g, '').trim().slice(0, MAX_PARAM_LENGTH);
  }

  function applyUrlOverrides(site) {
    var params = new URLSearchParams(window.location.search);
    var result = site;
    Object.keys(URL_OVERRIDES).forEach(function (param) {
      var raw = params.get(param);
      if (raw) result = withOverride(result, URL_OVERRIDES[param], cleanText(raw));
    });
    var wa = (params.get('wa') || '').replace(/\D/g, '');
    if (wa.length >= 10 && wa.length <= 13) {
      result = withOverride(result, 'contato.whatsapp', wa);
    }
    return result;
  }

  var site = applyUrlOverrides(SITE);

  function fill(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/\{(\w+)\}/g, function (match, key) {
      var value = get(site.negocio, key);
      return value == null ? match : value;
    });
  }

  function waLink(message) {
    var number = String(get(site, 'contato.whatsapp') || '').replace(/\D/g, '');
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(fill(message || ''));
  }

  function setImage(el, src) {
    if (!src) return;
    if (el.tagName === 'IMG') el.src = src;
    else el.style.backgroundImage = 'url("' + src.replace(/"/g, '') + '")';
  }

  function bind(root, source, attrs) {
    root.querySelectorAll('[' + attrs.text + ']').forEach(function (el) {
      var value = get(source, el.getAttribute(attrs.text));
      if (value != null) el.textContent = fill(value);
    });
    root.querySelectorAll('[' + attrs.img + ']').forEach(function (el) {
      setImage(el, get(source, el.getAttribute(attrs.img)));
    });
    root.querySelectorAll('[' + attrs.wa + ']').forEach(function (el) {
      var key = el.getAttribute(attrs.wa);
      var message = attrs.wa === 'data-fwa' ? get(source, key) : key;
      el.href = waLink(message);
      el.target = '_blank';
      el.rel = 'noopener';
    });
  }

  function renderLists() {
    document.querySelectorAll('[data-list]').forEach(function (container) {
      var items = get(site, container.getAttribute('data-list'));
      var tpl = container.querySelector('template');
      if (!Array.isArray(items) || !tpl) return;
      items.forEach(function (item) {
        var node = tpl.content.cloneNode(true);
        bind(node, item, { text: 'data-f', img: 'data-fimg', wa: 'data-fwa' });
        node.querySelectorAll('[data-fhide]').forEach(function (el) {
          if (!get(item, el.getAttribute('data-fhide'))) el.remove();
        });
        container.appendChild(node);
      });
    });
  }

  function renderMeta() {
    var seo = site.seo || {};
    if (seo.titulo) document.title = fill(seo.titulo);
    var desc = document.querySelector('meta[name="description"]');
    if (desc && seo.descricao) desc.setAttribute('content', fill(seo.descricao));
    if (site.tema && site.tema.cor) {
      document.documentElement.style.setProperty('--accent', site.tema.cor);
    }
    document.querySelectorAll('[data-href]').forEach(function (el) {
      var value = get(site, el.getAttribute('data-href'));
      if (value) el.href = value;
      else el.remove();
    });
    document.querySelectorAll('[data-show]').forEach(function (el) {
      if (!get(site, el.getAttribute('data-show'))) el.remove();
    });
    var map = document.querySelector('[data-map]');
    if (map) {
      var query = get(site, 'contato.mapa') || get(site, 'contato.endereco');
      map.src = 'https://www.google.com/maps?q=' + encodeURIComponent(fill(query || '')) + '&output=embed';
    }
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  function revealOnScroll() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function navBehaviour() {
    var nav = document.querySelector('.nav');
    var toggle = document.querySelector('.nav-toggle');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    if (toggle && nav) {
      toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
      nav.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); });
      });
    }
  }

  window.TEMPLATE = { site: site, fill: fill, waLink: waLink };

  bind(document, site, { text: 'data-t', img: 'data-img', wa: 'data-wa' });
  renderLists();
  renderMeta();
  // Listas renderizadas podem conter data-wa no nível do site
  document.querySelectorAll('[data-list] [data-wa]').forEach(function (el) {
    el.href = waLink(el.getAttribute('data-wa'));
    el.target = '_blank';
    el.rel = 'noopener';
  });
  revealOnScroll();
  navBehaviour();
})();
