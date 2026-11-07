/* =====================================================================
   BARBEARIA DO IMPÉRIO — agenda online por cadeira (Supabase)
   Fluxo: cadeira → serviço → dia → horário livre → nome + WhatsApp → sinal 50%.
   Sem choque: o banco recusa horários sobrepostos (constraint imperio_no_clash).
   Se o backend não estiver configurado/acessível, o botão cai no WhatsApp.
   ===================================================================== */
(function () {
  'use strict';
  var SITE = window.SITE || {}, B = SITE.backend || {};
  if (!B.url || !B.anonKey || !window.supabase) return;
  var sb = window.supabase.createClient(B.url, B.anonKey);
  var TZ = '-03:00'; // Brasília
  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  var DIAS_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var state = { chairs: [], services: [], settings: {}, chair: null, service: null, day: null, slot: null, booking: null };
  var brl = function (v) { return v == null ? '—' : 'R$ ' + Number(v).toFixed(2).replace('.', ','); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var at = function (dayStr, hm) { return new Date(dayStr + 'T' + hm + ':00' + TZ); };
  var hm = function (d) { var s = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }); return s; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- dados ---------- */
  async function load() {
    var r = await Promise.all([
      sb.from('imperio_chairs').select('id,numero,barbeiro,especialidade').eq('ativo', true).order('ordem'),
      sb.from('imperio_services').select('id,nome,preco,duracao_min').eq('ativo', true).order('ordem'),
      sb.from('imperio_settings').select('key,value')
    ]);
    if (r[0].error || r[1].error || r[2].error) throw (r[0].error || r[1].error || r[2].error);
    state.chairs = r[0].data; state.services = r[1].data;
    state.settings = {}; r[2].data.forEach(function (s) { state.settings[s.key] = s.value; });
    return state;
  }
  async function takenFor(chairId, dayStr) {
    var ini = at(dayStr, '00:00').toISOString(), fim = at(dayStr, '23:59').toISOString();
    var q = await sb.from('imperio_slots_taken').select('inicio,fim').eq('chair_id', chairId).gte('inicio', ini).lte('inicio', fim);
    if (q.error) throw q.error;
    return q.data.map(function (x) { return { i: new Date(x.inicio).getTime(), f: new Date(x.fim).getTime() }; });
  }
  function openDays() {
    var n = Number(state.settings.dias_a_frente || 14), hor = state.settings.horario || {}, out = [];
    var d = new Date();
    for (var k = 0; k < n + 7 && out.length < n; k++) {
      var day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
      var key = DIAS[day.getDay()];
      if (hor[key]) out.push({ str: ymd(day), label: DIAS_LABEL[day.getDay()] + ' ' + day.getDate() + '/' + MESES[day.getMonth()], hours: hor[key] });
    }
    return out;
  }
  function freeSlots(day, taken) {
    var step = Number(state.settings.slot_min || 30), dur = Number(state.service.duracao_min || 30);
    var lead = Number(state.settings.antecedencia_min || 60);
    var start = at(day.str, day.hours[0]).getTime(), end = at(day.str, day.hours[1]).getTime();
    var minStart = Date.now() + lead * 60000, out = [];
    for (var t = start; t + dur * 60000 <= end; t += step * 60000) {
      if (t < minStart) continue;
      var tf = t + dur * 60000, clash = taken.some(function (x) { return t < x.f && tf > x.i; });
      if (!clash) out.push(t);
    }
    return out;
  }

  /* ---------- UI ---------- */
  var modal = document.createElement('div');
  modal.className = 'ag-modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = '<div class="ag-box"><button class="ag-close" aria-label="Fechar">✕</button><div class="ag-body"></div></div>';
  document.body.appendChild(modal);
  var body = modal.querySelector('.ag-body');
  function close() { modal.classList.remove('open'); document.body.style.overflow = ''; }
  modal.querySelector('.ag-close').addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function header(step, title) {
    var c = state.chair;
    return '<div class="ag-head"><span class="ag-step">Passo ' + step + ' de 4</span><h3>' + esc(title) + '</h3>' +
      (c ? '<p class="ag-chair">Cadeira ' + esc(c.numero) + ' · <strong>' + esc(c.barbeiro) + '</strong></p>' : '') + '</div>';
  }
  function waFallback(msg) { return (window.TEMPLATE && window.TEMPLATE.waLink) ? window.TEMPLATE.waLink(msg) : '#'; }

  function stepService() {
    body.innerHTML = header(1, 'Qual serviço?') + '<div class="ag-grid">' + state.services.map(function (s) {
      return '<button class="ag-opt" data-id="' + s.id + '"><strong>' + esc(s.nome) + '</strong><span>' + brl(s.preco) + ' · ' + s.duracao_min + ' min</span></button>';
    }).join('') + '</div><p class="ag-alt"><a href="' + waFallback('Olá! Quero agendar na Cadeira ' + state.chair.numero + ' (' + state.chair.barbeiro + ').') + '" target="_blank" rel="noopener">Prefiro combinar pelo WhatsApp →</a></p>';
    body.querySelectorAll('.ag-opt').forEach(function (b) { b.addEventListener('click', function () {
      state.service = state.services.find(function (s) { return String(s.id) === b.dataset.id; }); stepDay();
    }); });
  }
  function stepDay() {
    var days = openDays();
    body.innerHTML = header(2, 'Que dia?') + '<p class="ag-sub">' + esc(state.service.nome) + ' · ' + state.service.duracao_min + ' min</p><div class="ag-days">' +
      days.map(function (d) { return '<button class="ag-day" data-d="' + d.str + '">' + d.label + '</button>'; }).join('') + '</div><div class="ag-slots"></div><p class="ag-alt"><a href="#" data-back>← trocar serviço</a></p>';
    body.querySelector('[data-back]').addEventListener('click', function (e) { e.preventDefault(); stepService(); });
    body.querySelectorAll('.ag-day').forEach(function (b) { b.addEventListener('click', function () {
      body.querySelectorAll('.ag-day').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
      state.day = days.find(function (d) { return d.str === b.dataset.d; }); showSlots();
    }); });
    if (days[0]) body.querySelector('.ag-day').click();
  }
  async function showSlots() {
    var box = body.querySelector('.ag-slots'); box.innerHTML = '<p class="ag-sub">Buscando horários…</p>';
    try {
      var taken = await takenFor(state.chair.id, state.day.str), slots = freeSlots(state.day, taken);
      if (!slots.length) { box.innerHTML = '<p class="ag-sub">Nenhum horário livre nesse dia. Tente outro dia.</p>'; return; }
      box.innerHTML = '<div class="ag-grid ag-times">' + slots.map(function (t) { return '<button class="ag-time" data-t="' + t + '">' + hm(new Date(t)) + '</button>'; }).join('') + '</div>';
      box.querySelectorAll('.ag-time').forEach(function (b) { b.addEventListener('click', function () { state.slot = Number(b.dataset.t); stepClient(); }); });
    } catch (e) { box.innerHTML = '<p class="ag-sub">Não consegui carregar os horários. <a href="' + waFallback('Olá! Quero agendar na Cadeira ' + state.chair.numero + '.') + '" target="_blank">Agendar pelo WhatsApp →</a></p>'; }
  }
  function stepClient() {
    var when = new Date(state.slot);
    body.innerHTML = header(3, 'Seus dados') + '<p class="ag-sub">' + esc(state.service.nome) + ' · ' + state.day.label + ' às ' + hm(when) + '</p>' +
      '<form class="ag-form"><label>Nome<input name="nome" required maxlength="80" autocomplete="name" placeholder="Seu nome"></label>' +
      '<label>WhatsApp<input name="zap" required inputmode="tel" autocomplete="tel" placeholder="(61) 9 9999-9999"></label>' +
      '<p class="ag-err" hidden></p><button class="btn btn-primary" type="submit">Confirmar horário</button></form><p class="ag-alt"><a href="#" data-back>← trocar horário</a></p>';
    body.querySelector('[data-back]').addEventListener('click', function (e) { e.preventDefault(); stepDay(); });
    body.querySelector('form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var f = e.target, err = f.querySelector('.ag-err'), btn = f.querySelector('button');
      var nome = f.nome.value.trim(), zap = f.zap.value.replace(/\D/g, '');
      if (zap.length === 10 || zap.length === 11) zap = '55' + zap;
      if (!nome || zap.length < 12) { err.textContent = 'Confira o nome e o WhatsApp com DDD.'; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = 'Reservando…';
      var pct = Number(state.settings.sinal_pct || 50), preco = state.service.preco;
      var sinal = preco == null ? null : Math.round(preco * pct) / 100;
      var ins = await sb.from('imperio_appointments').insert({
        chair_id: state.chair.id, service_id: state.service.id, cliente_nome: nome, cliente_whatsapp: zap,
        inicio: new Date(state.slot).toISOString(), fim: new Date(state.slot + state.service.duracao_min * 60000).toISOString(),
        servico_nome: state.service.nome, servico_preco: preco, sinal_valor: sinal, origem: 'site'
      });
      if (ins.error) {
        btn.disabled = false; btn.textContent = 'Confirmar horário';
        if (ins.error.code === '23P01') { err.textContent = 'Esse horário acabou de ser reservado. Escolha outro.'; err.hidden = false; setTimeout(stepDay, 1800); }
        else { err.textContent = 'Não consegui reservar agora. Tente de novo ou chame no WhatsApp.'; err.hidden = false; }
        return;
      }
      state.booking = { nome: nome, zap: zap, sinal: sinal, pct: pct, when: new Date(state.slot) };
      stepDeposit();
    });
  }
  function stepDeposit() {
    var b = state.booking, s = state.settings, pix = (typeof s.pix_chave === 'string' ? s.pix_chave : '') || '';
    var quando = state.day.label + ' às ' + hm(b.when);
    var msg = 'Olá! Agendei pelo site: Cadeira ' + state.chair.numero + ' (' + state.chair.barbeiro + ') · ' + state.service.nome + ' · ' + quando + ' · ' + b.nome + '.' +
      (b.sinal != null ? ' Segue o comprovante do sinal de ' + brl(b.sinal) + '.' : ' Como faço o sinal?');
    body.innerHTML = header(4, 'Horário reservado ✂️') +
      '<div class="ag-ok"><p><strong>' + esc(b.nome) + '</strong>, seu horário está guardado:<br>' + esc(state.service.nome) + ' · ' + esc(quando) + '</p>' +
      '<p class="ag-sub">Para confirmar, envie o sinal de <strong>' + b.pct + '%</strong>' + (b.sinal != null ? ' (<strong>' + brl(b.sinal) + '</strong>)' : '') + ' pelo Pix e mande o comprovante no WhatsApp. O restante você paga na barbearia.</p>' +
      (pix ? '<div class="ag-pix"><small>Chave Pix · ' + esc(typeof s.pix_nome === 'string' ? s.pix_nome : '') + '</small><code>' + esc(pix) + '</code><button class="ag-copy" type="button">Copiar chave</button></div>'
           : '<p class="ag-sub">A chave Pix será enviada pelo WhatsApp.</p>') +
      '<a class="btn btn-primary" href="' + waFallback(msg) + '" target="_blank" rel="noopener">Enviar comprovante no WhatsApp</a>' +
      '<p class="ag-sub ag-small">Sem o sinal em até 2 horas o horário pode ser liberado.</p></div>';
    var cp = body.querySelector('.ag-copy');
    if (cp) cp.addEventListener('click', function () { navigator.clipboard && navigator.clipboard.writeText(pix).then(function () { cp.textContent = 'Copiado ✓'; }); });
  }

  async function open(numero) {
    modal.classList.add('open'); document.body.style.overflow = 'hidden';
    body.innerHTML = '<p class="ag-sub" style="padding:30px 0">Carregando agenda…</p>';
    try {
      if (!state.chairs.length) await load();
      state.chair = state.chairs.find(function (c) { return c.numero === numero; }) || state.chairs[0];
      state.service = null; state.day = null; state.slot = null; stepService();
    } catch (e) {
      body.innerHTML = '<p class="ag-sub">Agenda indisponível agora. <a href="' + waFallback('Olá! Quero agendar um horário na Barbearia do Império.') + '" target="_blank">Agendar pelo WhatsApp →</a></p>';
    }
  }

  /* intercepta "Agendar nesta cadeira" dos cards (renderizados pelo engine) */
  document.querySelectorAll('.chair').forEach(function (card) {
    var numEl = card.querySelector('.num span'), btn = card.querySelector('a.btn');
    if (!btn) return;
    btn.textContent = 'Agendar nesta cadeira';
    btn.addEventListener('click', function (e) { e.preventDefault(); open(numEl ? numEl.textContent.trim() : ''); });
  });
  window.IMPERIO_AGENDA = { open: open };
})();
