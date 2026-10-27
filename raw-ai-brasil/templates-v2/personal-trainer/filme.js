/* =====================================================================
   RAW AI — Personal Trainer: filme na rolagem + formulário de WhatsApp
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
  var MOBILE_QUERY = '(hover: none) and (pointer: coarse), (max-width: 860px)';
  var CHAPTER_HEIGHT = 1.4;          // alturas de tela por cena (mais = rolagem mais lenta)
  var CROSSFADE = 0.1;               // fração da tela usada na transição entre cenas
  var PRELOAD_DISTANCE = 1.5;        // carrega o vídeo quando está a 1,5 tela de distância
  var EASING = 0.2;                  // suavização do avanço do vídeo por quadro

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = T.fill(text);
    return node;
  }

  function clamp(value, min, max) {
    return Math.min(max == null ? 1 : max, Math.max(min || 0, value));
  }

  function smoothstep(value) {
    var x = clamp(value);
    return x * x * (3 - 2 * x);
  }

  // Desacelera o meio do clipe sem mudar o primeiro nem o último quadro.
  function lingerEase(value, amount) {
    var x = clamp(value);
    var linger = clamp(amount, 0, 0.6);
    var centered = x - 0.5;
    return (1 - linger) * x + linger * (4 * centered * centered * centered + 0.5);
  }

  /* ---------- marca e botões padrão ---------- */
  function initials(name) {
    var words = String(name || '').trim().split(/\s+/).filter(Boolean);
    var letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] || '').slice(0, 2);
    return letters.toUpperCase();
  }

  document.querySelectorAll('[data-iniciais]').forEach(function (node) {
    node.textContent = initials(site.negocio && site.negocio.nome);
  });

  function setWa(node, message) {
    node.href = T.waLink(message);
    node.target = '_blank';
    node.rel = 'noopener';
  }

  document.querySelectorAll('[data-wa-padrao]').forEach(function (node) {
    setWa(node, site.mensagemPadrao);
  });

  /* ---------- filme ---------- */
  function buildFilm(root, scenes) {
    var media = root.querySelector('.film-media');
    var route = root.querySelector('.film-route');
    var story = root.querySelector('.film-story');

    return scenes.map(function (scene, index) {
      var layer = el('figure', 'film-layer');
      var picture = document.createElement('picture');
      if (scene.posterMobile) {
        var source = document.createElement('source');
        source.media = MOBILE_QUERY;
        source.srcset = scene.posterMobile;
        picture.appendChild(source);
      }
      var img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      img.loading = index === 0 ? 'eager' : 'lazy';
      if (index === 0) img.setAttribute('fetchpriority', 'high');
      img.src = scene.poster;
      picture.appendChild(img);
      layer.appendChild(picture);
      media.appendChild(layer);

      var button = el('button', '', scene.rotulo);
      button.type = 'button';
      route.appendChild(button);

      var chapter = el('article', 'chapter');
      chapter.id = scene.id;
      chapter.setAttribute('data-lado', scene.lado || 'esquerda');
      chapter.style.minHeight = (CHAPTER_HEIGHT * 100) + 'dvh';
      var pin = el('div', 'chapter-pin');
      var copy = el('div', 'chapter-copy');
      if (scene.selo) copy.appendChild(el('p', 'chapter-kicker', scene.selo));
      copy.appendChild(el(index === 0 ? 'h1' : 'h2', 'chapter-title', scene.titulo));
      copy.appendChild(el('p', 'chapter-body', scene.texto));
      if (scene.tags && scene.tags.length) {
        var tags = el('ul', 'chapter-tags');
        scene.tags.forEach(function (tag) { tags.appendChild(el('li', '', tag)); });
        copy.appendChild(tags);
      }
      if (scene.botao) {
        var actions = el('div', 'chapter-actions');
        var cta = el('a', 'slab-cta', scene.botao + ' ');
        var arrow = el('span', '', '→');
        arrow.setAttribute('aria-hidden', 'true');
        cta.appendChild(arrow);
        setWa(cta, site.mensagemPadrao);
        actions.appendChild(cta);
        copy.appendChild(actions);
      }
      pin.appendChild(copy);
      chapter.appendChild(pin);
      story.appendChild(chapter);

      return {
        scene: scene, layer: layer, band: chapter, button: button,
        start: 0, end: 0, current: 0, target: 0, visible: index === 0,
        loading: false, ready: false, failed: false, source: '', video: null, url: ''
      };
    });
  }

  function startScrub(root, segments) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    var small = window.matchMedia('(max-width: 860px)');
    var isMobile = function () { return coarse || small.matches; };
    var sourceFor = function (seg) { return isMobile() && seg.scene.videoMobile ? seg.scene.videoMobile : seg.scene.video; };

    var rootTop = 0, total = 1, viewport = window.innerHeight, layoutWidth = window.innerWidth;
    var active = -1, dirty = true, userReady = false;

    function unload(seg) {
      if (seg.video) seg.video.remove();
      if (seg.url) URL.revokeObjectURL(seg.url);
      seg.video = null; seg.url = ''; seg.source = '';
      seg.loading = false; seg.ready = false; seg.failed = false;
      seg.current = seg.target;
      seg.layer.removeAttribute('data-painted');
    }

    function layout() {
      var pageY = window.scrollY;
      rootTop = root.getBoundingClientRect().top + pageY;
      viewport = window.innerHeight;
      layoutWidth = window.innerWidth;
      segments.forEach(function (seg) {
        if (seg.source && seg.source !== sourceFor(seg)) unload(seg);
        var rect = seg.band.getBoundingClientRect();
        seg.start = rect.top + pageY - rootTop;
        seg.end = seg.start + rect.height;
      });
      total = Math.max(segments[segments.length - 1].end, viewport);
      dirty = true;
    }

    function prime(video) {
      if (!video || !isMobile()) return;
      var attempt = video.play();
      if (attempt && attempt.then) {
        attempt.then(function () { video.pause(); }, function () { /* mantém o poster */ });
      }
    }

    // Baixa o clipe inteiro (blob) para a busca de quadro ficar instantânea.
    function load(seg) {
      var source = sourceFor(seg);
      if (reduceMotion || seg.loading || seg.ready || seg.failed || !source) return;
      seg.loading = true;
      seg.source = source;
      fetch(source).then(function (response) {
        if (!response.ok) throw new Error('Clip ' + response.status);
        return response.blob();
      }).then(function (blob) {
        if (seg.source !== source) return;
        var url = URL.createObjectURL(blob);
        var video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.src = url;
        video.addEventListener('loadedmetadata', function () {
          if (seg.video !== video) return;
          seg.ready = true; seg.loading = false; dirty = true;
        }, { once: true });
        video.addEventListener('loadeddata', function () { if (userReady) prime(video); }, { once: true });
        video.addEventListener('seeked', function () {
          if (seg.video === video) seg.layer.setAttribute('data-painted', 'true');
        }, { once: true });
        video.addEventListener('error', function () {
          if (seg.video !== video) return;
          unload(seg);
          seg.failed = true;
        }, { once: true });
        seg.layer.appendChild(video);
        seg.video = video;
        seg.url = url;
      }).catch(function (error) {
        console.error('[template] não carregou o vídeo ' + source, error);
        seg.failed = true;
        seg.loading = false;
      });
    }

    function readScroll() {
      var y = clamp(window.scrollY - rootTop, 0, total);
      var fade = Math.max(CROSSFADE * viewport, 1);
      var current = 0;
      segments.forEach(function (seg, index) {
        if (y >= seg.start) current = index;
        var local = clamp((y - seg.start) / Math.max(seg.end - seg.start, 1));
        seg.target = seg.scene.pausa ? lingerEase(local, seg.scene.pausa) : local;
        var outside = y < seg.start ? seg.start - y : (y > seg.end ? y - seg.end : 0);
        var opacity = reduceMotion ? (outside === 0 ? 1 : 0) : smoothstep(1 - outside / fade);
        seg.visible = opacity > 0.001;
        seg.layer.style.opacity = String(opacity);
        if (y > seg.start - PRELOAD_DISTANCE * viewport && y < seg.end + PRELOAD_DISTANCE * viewport) load(seg);
      });
      segments.forEach(function (seg, index) { seg.layer.style.zIndex = index === current ? '2' : '1'; });
      if (current !== active) {
        active = current;
        segments.forEach(function (seg, index) {
          if (index === active) seg.button.setAttribute('aria-current', 'step');
          else seg.button.removeAttribute('aria-current');
        });
      }
      root.style.setProperty('--progress', String(clamp(y / total)));
    }

    function updateVideos() {
      var epsilon = isMobile() ? 0.02 : 0.008;
      segments.forEach(function (seg) {
        var video = seg.video;
        if (!video || !seg.ready || video.seeking) return;
        if (!seg.visible && Math.abs(seg.current - seg.target) < 0.002) return;
        seg.current += (seg.target - seg.current) * EASING;
        var time = clamp(seg.current, 0, 0.999) * (video.duration || 1);
        if (Math.abs(video.currentTime - time) > epsilon) {
          try { video.currentTime = time; } catch (e) { /* mantém o último quadro */ }
        }
      });
    }

    function tick() {
      if (dirty) { dirty = false; readScroll(); }
      updateVideos();
      window.requestAnimationFrame(tick);
    }

    function onFirstGesture() {
      if (userReady) return;
      userReady = true;
      segments.forEach(function (seg) { prime(seg.video); });
    }

    segments.forEach(function (seg) {
      seg.button.addEventListener('click', function () {
        window.scrollTo({ top: rootTop + seg.start + 0.15 * (seg.end - seg.start), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
    window.addEventListener('resize', function () {
      if (coarse && window.innerWidth === layoutWidth) return;
      layout();
    });
    window.addEventListener('orientationchange', layout);
    window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
    window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
    window.addEventListener('load', layout);
    layout();
    window.requestAnimationFrame(tick);
  }

  var filmRoot = document.getElementById('filme');
  if (filmRoot && Array.isArray(site.filme) && site.filme.length) {
    startScrub(filmRoot, buildFilm(filmRoot, site.filme));
  } else if (filmRoot) {
    filmRoot.remove();
  }

  /* ---------- formulário que monta a mensagem do WhatsApp ---------- */
  function initLeadForm() {
    var form = document.getElementById('leadForm');
    var cfg = site.formulario;
    if (!form || !cfg) return;
    var nameInput = document.getElementById('leadName');
    var error = document.getElementById('leadNameError');
    var preview = document.getElementById('leadPreview');
    var send = document.getElementById('leadSend');
    var choice = {};

    form.querySelectorAll('[data-chips]').forEach(function (fieldset) {
      var key = fieldset.getAttribute('data-chips');
      var options = (cfg[key] || []).map(function (option) { return T.fill(option); });
      var holder = fieldset.querySelector('div');
      choice[key] = options[0] || '';
      options.forEach(function (option, index) {
        var label = document.createElement('label');
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = key;
        input.value = option;
        input.checked = index === 0;
        input.addEventListener('change', function () { choice[key] = option; update(); });
        var span = document.createElement('span');
        span.textContent = option;
        label.appendChild(input);
        label.appendChild(span);
        holder.appendChild(label);
      });
    });

    function message() {
      return 'Olá, {nome}! Meu nome é ' + (nameInput.value.trim() || '...') + '. Vim pelo seu site.\n' +
        'Quero ' + choice.objetivos + ', prefiro treinar de ' + choice.horarios + ', formato ' + choice.formatos + '.\n' +
        'Pode me explicar como funciona?';
    }

    function update() {
      var text = message();
      preview.textContent = T.fill(text);
      send.href = T.waLink(text);
    }

    form.addEventListener('submit', function (event) { event.preventDefault(); });
    nameInput.addEventListener('input', function () {
      if (nameInput.value.trim()) {
        error.hidden = true;
        nameInput.removeAttribute('aria-invalid');
      }
      update();
    });
    // Link real (não window.open) para funcionar dentro do Instagram/Facebook.
    send.addEventListener('click', function (event) {
      if (nameInput.value.trim()) return;
      event.preventDefault();
      error.hidden = false;
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
    });
    update();
  }

  initLeadForm();
})();
