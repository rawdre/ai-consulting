/* =====================================================================
   BARBEARIA DO IMPÉRIO — Admin (dono e barbeiros). Supabase Auth + RLS.
   Abas: Hoje (agenda por cadeira) · Painel (TV) · Comanda (POS) · Vendas · Config
   ===================================================================== */
(function () {
  'use strict';
  var B = (window.SITE || {}).backend || {};
  if (!B.url || !B.anonKey || !window.supabase) { document.body.innerHTML = '<p style="padding:40px">Backend não configurado (config.js → backend).</p>'; return; }
  var sb = window.supabase.createClient(B.url, B.anonKey);
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TZ = '-03:00', DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'], DIAS_L = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var D = { chairs: [], services: [], products: [], settings: {} };
  var brl = function (v) { return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var todayStr = function () { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var hm = function (x) { return new Date(x).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }); };
  var dmy = function (x) { return new Date(x).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var dayRange = function (d) { return [new Date(d + 'T00:00:00' + TZ).toISOString(), new Date(d + 'T23:59:59' + TZ).toISOString()]; };
  var toast = function (m, bad) { var t = $('#toast'); t.textContent = m; t.style.borderColor = bad ? 'var(--bad)' : 'var(--accent)'; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 2600); };
  var fail = function (e) { console.error(e); toast((e && e.message) || 'Erro', true); };
  var chairName = function (id) { var c = D.chairs.find(function (x) { return x.id === id; }); return c ? c.barbeiro : '—'; };

  /* ---------- auth ---------- */
  $('#loginForm').addEventListener('submit', async function (e) {
    e.preventDefault(); var f = e.target, err = $('#loginErr'); err.hidden = true; f.querySelector('button').disabled = true;
    var r = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    f.querySelector('button').disabled = false;
    if (r.error) { err.textContent = 'E-mail ou senha incorretos.'; err.hidden = false; return; }
  });
  $('#logout').addEventListener('click', function () { sb.auth.signOut(); });
  sb.auth.onAuthStateChange(function (_ev, session) { if (session) enter(); else { $('#app').style.display = 'none'; $('#login').style.display = 'grid'; } });
  sb.auth.getSession().then(function (r) { if (r.data.session) enter(); });

  var entered = false;
  async function enter() {
    $('#login').style.display = 'none'; $('#app').style.display = 'block';
    if (entered) return; entered = true;
    try { await loadBase(); } catch (e) { fail(e); return; }
    initHoje(); initPainel(); initComanda(); initVendas(); initConfig();
    show(location.hash.replace('#', '') || 'hoje');
  }
  async function loadBase() {
    var r = await Promise.all([
      sb.from('imperio_chairs').select('*').order('ordem'),
      sb.from('imperio_services').select('*').order('ordem'),
      sb.from('imperio_products').select('*').order('nome'),
      sb.from('imperio_settings').select('*')
    ]);
    r.forEach(function (x) { if (x.error) throw x.error; });
    D.chairs = r[0].data; D.services = r[1].data; D.products = r[2].data; D.settings = {};
    r[3].data.forEach(function (s) { D.settings[s.key] = s.value; });
  }

  /* ---------- tabs ---------- */
  function show(v) {
    $$('.tab[data-v]').forEach(function (t) { t.classList.toggle('on', t.dataset.v === v); });
    $$('.view').forEach(function (s) { s.classList.toggle('on', s.id === v); });
    document.body.classList.toggle('tv', false);
    location.hash = v;
    if (v === 'hoje') renderHoje(); if (v === 'painel') renderPainel(); if (v === 'vendas') loadVendas(); if (v === 'comanda') renderComanda();
  }
  $$('.tab[data-v]').forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.v); }); });

  /* ================= HOJE ================= */
  var H = { day: todayStr(), appts: [], timer: null };
  function initHoje() {
    $('#dPick').value = H.day;
    $('#dPick').addEventListener('change', function () { H.day = this.value; renderHoje(); });
    $('#dPrev').addEventListener('click', function () { shift(-1); }); $('#dNext').addEventListener('click', function () { shift(1); });
    $('#dToday').addEventListener('click', function () { H.day = todayStr(); $('#dPick').value = H.day; renderHoje(); });
    $('#dRefresh').addEventListener('click', renderHoje);
    H.timer = setInterval(function () { if (!document.hidden && $('#hoje').classList.contains('on')) renderHoje(); }, 60000);
  }
  function shift(n) { var d = new Date(H.day + 'T12:00:00'); d.setDate(d.getDate() + n); H.day = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); $('#dPick').value = H.day; renderHoje(); }
  async function fetchAppts(day) {
    var r = dayRange(day);
    var q = await sb.from('imperio_appointments').select('*').gte('inicio', r[0]).lte('inicio', r[1]).order('inicio');
    if (q.error) throw q.error; return q.data;
  }
  async function renderHoje() {
    var cols = $('#cols'); cols.style.setProperty('--n', D.chairs.filter(function (c) { return c.ativo; }).length);
    try { H.appts = await fetchAppts(H.day); } catch (e) { fail(e); return; }
    var d = new Date(H.day + 'T12:00:00'); $('#hojeInfo').textContent = DIAS_L[d.getDay()] + ', ' + dmy(d) + ' · ' + H.appts.filter(function (a) { return a.status !== 'cancelado'; }).length + ' agendamentos';
    cols.innerHTML = D.chairs.filter(function (c) { return c.ativo; }).map(function (c) {
      var list = H.appts.filter(function (a) { return a.chair_id === c.id; });
      return '<div class="col"><h3>' + esc(c.barbeiro) + '</h3><div class="sub">Cadeira ' + esc(c.numero) + ' · ' + list.filter(function (a) { return a.status !== 'cancelado'; }).length + ' hoje</div>' +
        (list.length ? list.map(apptCard).join('') : '<p class="empty">Nenhum agendamento.</p>') +
        '<button class="btn btn-sm" data-encaixe="' + c.id + '">+ Encaixe</button></div>';
    }).join('');
    $$('[data-act]', cols).forEach(function (b) { b.addEventListener('click', function () { act(b.dataset.act, b.dataset.id); }); });
    $$('[data-encaixe]', cols).forEach(function (b) { b.addEventListener('click', function () { encaixe(Number(b.dataset.encaixe)); }); });
  }
  function apptCard(a) {
    var sinal = a.sinal_valor != null ? brl(a.sinal_valor) : '—';
    var acts = '';
    if (a.status === 'agendado') acts = btn('sinal', a.id, 'Sinal recebido', 'btn-ok') + btn('cancel', a.id, 'Cancelar', 'btn-bad');
    else if (a.status === 'confirmado') acts = btn('comanda', a.id, 'Atendido → comanda', 'btn-primary') + btn('faltou', a.id, 'Faltou') + btn('cancel', a.id, 'Cancelar', 'btn-bad');
    else if (a.status === 'atendido') acts = '<span class="badge">atendido ✓</span>';
    else acts = '<span class="badge">' + a.status + '</span>' + btn('reabrir', a.id, 'Reabrir');
    return '<div class="appt ' + a.status + '"><div class="row" style="justify-content:space-between"><span class="t">' + hm(a.inicio) + ' – ' + hm(a.fim) + '</span><span class="badge ' + a.sinal_status + '">sinal ' + a.sinal_status + (a.sinal_valor != null ? ' · ' + sinal : '') + '</span></div>' +
      '<div class="n">' + esc(a.cliente_nome) + (a.cliente_whatsapp ? ' <a class="small gold" href="https://wa.me/' + esc(a.cliente_whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') + '</div>' +
      '<div class="s">' + esc(a.servico_nome || '') + (a.servico_preco != null ? ' · ' + brl(a.servico_preco) : '') + ' · ' + a.origem + (a.obs ? ' · ' + esc(a.obs) : '') + '</div><div class="acts">' + acts + '</div></div>';
  }
  function btn(act, id, label, cls) { return '<button class="btn btn-sm ' + (cls || '') + '" data-act="' + act + '" data-id="' + id + '">' + label + '</button>'; }
  async function act(kind, id) {
    var a = H.appts.find(function (x) { return x.id === id; }); if (!a) return;
    var patch = null;
    if (kind === 'sinal') patch = { sinal_status: 'pago', status: 'confirmado' };
    if (kind === 'cancel') { if (!confirm('Cancelar o horário de ' + a.cliente_nome + '?')) return; patch = { status: 'cancelado' }; }
    if (kind === 'faltou') patch = { status: 'faltou' };
    if (kind === 'reabrir') patch = { status: 'confirmado' };
    if (kind === 'comanda') { openComandaFor(a); show('comanda'); return; }
    var r = await sb.from('imperio_appointments').update(patch).eq('id', id);
    if (r.error) return fail(r.error);
    toast('Atualizado'); renderHoje();
  }
  async function encaixe(chairId) {
    var c = D.chairs.find(function (x) { return x.id === chairId; });
    var nome = prompt('Encaixe na cadeira de ' + c.barbeiro + ' (' + dmy(new Date(H.day + 'T12:00:00')) + ')\nNome do cliente:'); if (!nome) return;
    var hora = prompt('Horário (HH:MM):', hm(Date.now() + 5 * 60000)); if (!hora || !/^\d{1,2}:\d{2}$/.test(hora)) return;
    var svcs = D.services.filter(function (s) { return s.ativo; });
    var pick = prompt('Serviço:\n' + svcs.map(function (s, i) { return (i + 1) + ') ' + s.nome + ' · ' + s.duracao_min + ' min'; }).join('\n'), '1');
    var s = svcs[Number(pick) - 1]; if (!s) return;
    var ini = new Date(H.day + 'T' + pad(hora.split(':')[0]) + ':' + hora.split(':')[1] + ':00' + TZ);
    var r = await sb.from('imperio_appointments').insert({ chair_id: chairId, service_id: s.id, cliente_nome: nome.trim(), inicio: ini.toISOString(), fim: new Date(ini.getTime() + s.duracao_min * 60000).toISOString(), status: 'confirmado', origem: 'balcao', sinal_status: 'dispensado', servico_nome: s.nome, servico_preco: s.preco });
    if (r.error) return fail(r.error.code === '23P01' ? { message: 'Choca com outro horário dessa cadeira.' } : r.error);
    toast('Encaixe criado'); renderHoje();
  }

  /* ================= PAINEL (TV) ================= */
  var P = { timer: null };
  function initPainel() {
    $('#tvFull').addEventListener('click', function () { document.body.classList.toggle('tv'); if (document.body.classList.contains('tv') && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {}); });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement) document.body.classList.remove('tv'); });
    setInterval(function () { $('#tvClock').textContent = hm(Date.now()); }, 1000);
    P.timer = setInterval(function () { if (!document.hidden && $('#painel').classList.contains('on')) renderPainel(); }, 30000);
  }
  async function renderPainel() {
    var g = $('#tvgrid'); var active = D.chairs.filter(function (c) { return c.ativo; }); g.style.setProperty('--n', active.length);
    var appts; try { appts = await fetchAppts(todayStr()); } catch (e) { return fail(e); }
    var now = Date.now();
    g.innerHTML = active.map(function (c) {
      var list = appts.filter(function (a) { return a.chair_id === c.id && (a.status === 'confirmado' || a.status === 'agendado'); });
      var cur = list.find(function (a) { return new Date(a.inicio) <= now && new Date(a.fim) > now; });
      var next = list.filter(function (a) { return new Date(a.inicio) > now; });
      var first = function (n) { return esc((n || '').split(' ')[0]); };
      return '<div class="tvcol"><h3>' + esc(c.barbeiro) + '</h3>' +
        '<div class="lbl">Agora</div><div class="now">' + (cur ? first(cur.cliente_nome) + ' <span class="muted" style="font-size:1.1rem">' + hm(cur.inicio) + ' · ' + esc(cur.servico_nome || '') + '</span>' : '<span class="muted">livre</span>') + '</div>' +
        '<div class="lbl">Próximo</div><div class="next">' + (next[0] ? hm(next[0].inicio) + ' · ' + first(next[0].cliente_nome) + (next[0].status === 'agendado' ? ' <span class="badge pendente">sinal?</span>' : '') : '<span class="muted">—</span>') + '</div>' +
        (next.length > 1 ? '<div class="lbl">Depois</div><div class="rest">' + next.slice(1, 6).map(function (a) { return hm(a.inicio) + ' · ' + first(a.cliente_nome); }).join('<br>') + '</div>' : '') + '</div>';
    }).join('');
  }

  /* ================= COMANDA ================= */
  var C = { items: [], appt: null };
  function initComanda() {
    $('#cmdNew').addEventListener('click', function () { C.items = []; C.appt = null; renderComanda(); });
    $('#cmdAddSvc').addEventListener('click', function () { var s = D.services.find(function (x) { return String(x.id) === $('#cmdSvc').value; }); if (s) addItem('servico', s.nome, s.preco == null ? 0 : s.preco); });
    $('#cmdAddProd').addEventListener('click', function () { var p = D.products.find(function (x) { return String(x.id) === $('#cmdProd').value; }); if (p) addItem('produto', p.nome, p.preco); });
    $('#cmdAddOther').addEventListener('click', function () { var n = $('#cmdOtherName').value.trim(), v = Number($('#cmdOtherPrice').value); if (n && v >= 0) { addItem('outro', n, v); $('#cmdOtherName').value = ''; $('#cmdOtherPrice').value = ''; } });
    $$('input[name=pay]').forEach(function (r) { r.addEventListener('change', renderTotals); });
    $('#cmdSave').addEventListener('click', saveComanda);
  }
  function openComandaFor(a) { C.appt = a; C.items = []; if (a.servico_nome) C.items.push({ tipo: 'servico', nome: a.servico_nome, preco: Number(a.servico_preco || 0), qtd: 1 }); renderComanda(); $('#cmdChair').value = a.chair_id; }
  function addItem(tipo, nome, preco) { var ex = C.items.find(function (i) { return i.tipo === tipo && i.nome === nome && i.preco === Number(preco); }); if (ex) ex.qtd++; else C.items.push({ tipo: tipo, nome: nome, preco: Number(preco), qtd: 1 }); renderItems(); }
  function renderComanda() {
    $('#cmdChair').innerHTML = D.chairs.filter(function (c) { return c.ativo; }).map(function (c) { return '<option value="' + c.id + '">' + esc(c.barbeiro) + ' · cadeira ' + esc(c.numero) + '</option>'; }).join('');
    $('#cmdSvc').innerHTML = D.services.filter(function (s) { return s.ativo; }).map(function (s) { return '<option value="' + s.id + '">' + esc(s.nome) + ' · ' + (s.preco == null ? 'a combinar' : brl(s.preco)) + '</option>'; }).join('');
    $('#cmdProd').innerHTML = D.products.filter(function (p) { return p.ativo; }).map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + ' · ' + brl(p.preco) + '</option>'; }).join('') || '<option value="">(cadastre produtos em Config)</option>';
    if (C.appt) { $('#cmdChair').value = C.appt.chair_id; $('#cmdInfo').textContent = 'Cliente: ' + C.appt.cliente_nome + ' · ' + hm(C.appt.inicio) + (C.appt.sinal_status === 'pago' ? ' · sinal de ' + brl(C.appt.sinal_valor) + ' já pago' : ''); }
    else $('#cmdInfo').textContent = 'Feche a conta do cliente: serviços, produtos, forma de pagamento.';
    $('#cmdObs').value = ''; $('#cmdErr').hidden = true;
    renderItems();
  }
  function renderItems() {
    var box = $('#cmdItems');
    box.innerHTML = C.items.length ? C.items.map(function (i, k) {
      return '<div class="item"><span class="nm">' + esc(i.nome) + ' <span class="muted small">' + i.tipo + '</span></span><input type="number" min="1" value="' + i.qtd + '" data-k="' + k + '" data-f="qtd"><input type="number" step="0.01" min="0" value="' + i.preco + '" data-k="' + k + '" data-f="preco"><button class="btn btn-sm btn-bad" data-rm="' + k + '">✕</button></div>';
    }).join('') : '<p class="empty">Adicione serviços ou produtos.</p>';
    $$('input[data-k]', box).forEach(function (inp) { inp.addEventListener('change', function () { C.items[Number(inp.dataset.k)][inp.dataset.f] = Number(inp.value); renderTotals(); }); });
    $$('[data-rm]', box).forEach(function (b) { b.addEventListener('click', function () { C.items.splice(Number(b.dataset.rm), 1); renderItems(); }); });
    renderTotals();
  }
  function total() { return C.items.reduce(function (s, i) { return s + i.preco * i.qtd; }, 0); }
  function renderTotals() {
    var t = total(), paid = (C.appt && C.appt.sinal_status === 'pago') ? Number(C.appt.sinal_valor || 0) : 0;
    $('#cmdTotal').textContent = brl(t);
    $('#cmdDeposit').textContent = paid ? 'Sinal já pago: ' + brl(paid) + ' → a receber agora: ' + brl(Math.max(0, t - paid)) : '';
    var pay = ($('input[name=pay]:checked') || {}).value, pix = typeof D.settings.pix_chave === 'string' ? D.settings.pix_chave : '';
    $('#cmdPix').style.display = pay === 'pix' ? 'grid' : 'none';
    $('#cmdPix').innerHTML = pix ? '<small class="muted">Chave Pix · ' + esc(D.settings.pix_nome || '') + '</small><code>' + esc(pix) + '</code><button class="btn btn-sm" id="pixCopy">Copiar</button>' : '<span class="muted small">Cadastre a chave Pix em Config.</span>';
    var cp = $('#pixCopy'); if (cp) cp.addEventListener('click', function () { navigator.clipboard.writeText(pix); cp.textContent = 'Copiado ✓'; });
  }
  async function saveComanda() {
    var err = $('#cmdErr'); err.hidden = true;
    if (!C.items.length) { err.textContent = 'Comanda vazia.'; err.hidden = false; return; }
    var chairId = Number($('#cmdChair').value), c = D.chairs.find(function (x) { return x.id === chairId; });
    var t = total(), pct = Number(c.comissao_pct || 0), pay = $('input[name=pay]:checked').value, b = $('#cmdSave'); b.disabled = true;
    var obs = $('#cmdObs').value.trim(); if (C.appt && C.appt.sinal_status === 'pago') obs = ('sinal ' + brl(C.appt.sinal_valor) + ' já recebido. ' + obs).trim();
    var r = await sb.from('imperio_sales').insert({ chair_id: chairId, appointment_id: C.appt ? C.appt.id : null, itens: C.items, total: t, pagamento: pay, comissao_pct: pct, comissao_valor: Math.round(t * pct) / 100, obs: obs || null });
    if (r.error) { b.disabled = false; return fail(r.error); }
    if (C.appt) await sb.from('imperio_appointments').update({ status: 'atendido' }).eq('id', C.appt.id);
    b.disabled = false; toast('Comanda fechada: ' + brl(t) + ' · comissão ' + brl(Math.round(t * pct) / 100));
    C.items = []; C.appt = null; renderComanda();
  }

  /* ================= VENDAS ================= */
  var V = { from: todayStr(), to: todayStr(), rows: [] };
  function initVendas() {
    $$('#vendas [data-p]').forEach(function (b) { b.addEventListener('click', function () { period(b.dataset.p); }); });
    $('#vGo').addEventListener('click', function () { V.from = $('#vFrom').value || V.from; V.to = $('#vTo').value || V.to; loadVendas(); });
    $('#vCsv').addEventListener('click', csv);
  }
  function period(p) {
    var d = new Date(), f = new Date(d);
    if (p === 'semana') f.setDate(d.getDate() - d.getDay()); if (p === 'mes') f.setDate(1);
    V.from = f.getFullYear() + '-' + pad(f.getMonth() + 1) + '-' + pad(f.getDate()); V.to = todayStr(); loadVendas();
  }
  async function loadVendas() {
    $('#vFrom').value = V.from; $('#vTo').value = V.to;
    var q = await sb.from('imperio_sales').select('*').gte('data', dayRange(V.from)[0]).lte('data', dayRange(V.to)[1]).order('data', { ascending: false });
    if (q.error) return fail(q.error); V.rows = q.data;
    var tot = V.rows.reduce(function (s, r) { return s + Number(r.total); }, 0), com = V.rows.reduce(function (s, r) { return s + Number(r.comissao_valor || 0); }, 0);
    $('#vInfo').textContent = dmy(new Date(V.from + 'T12:00:00')) + ' a ' + dmy(new Date(V.to + 'T12:00:00'));
    $('#kpis').innerHTML = [[brl(tot), 'faturamento'], [V.rows.length, 'comandas'], [brl(V.rows.length ? tot / V.rows.length : 0), 'ticket médio'], [brl(com), 'comissões']].map(function (k) { return '<div class="kpi"><strong>' + k[0] + '</strong><span>' + k[1] + '</span></div>'; }).join('');
    var byC = {}, byP = {};
    V.rows.forEach(function (r) { var k = chairName(r.chair_id); byC[k] = byC[k] || { n: 0, t: 0, c: 0 }; byC[k].n++; byC[k].t += Number(r.total); byC[k].c += Number(r.comissao_valor || 0); byP[r.pagamento] = (byP[r.pagamento] || 0) + Number(r.total); });
    $('#vByChair').innerHTML = '<table><tr><th>Barbeiro</th><th class="r">Comandas</th><th class="r">Total</th><th class="r">Comissão</th></tr>' + Object.keys(byC).map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="r">' + byC[k].n + '</td><td class="r">' + brl(byC[k].t) + '</td><td class="r">' + brl(byC[k].c) + '</td></tr>'; }).join('') + '</table>';
    $('#vByPay').innerHTML = '<table><tr><th>Pagamento</th><th class="r">Total</th></tr>' + Object.keys(byP).map(function (k) { return '<tr><td>' + k + '</td><td class="r">' + brl(byP[k]) + '</td></tr>'; }).join('') + '</table>';
    var byD = {};
    V.rows.forEach(function (r) { var d = dmy(r.data), k = d + '|' + chairName(r.chair_id); byD[k] = byD[k] || { d: d, b: chairName(r.chair_id), n: 0, t: 0, c: 0, pix: 0, cartao: 0, dinheiro: 0 }; byD[k].n++; byD[k].t += Number(r.total); byD[k].c += Number(r.comissao_valor || 0); byD[k][r.pagamento] = (byD[k][r.pagamento] || 0) + Number(r.total); });
    $('#vByDay').innerHTML = '<table><tr><th>Dia</th><th>Barbeiro</th><th class="r">Comandas</th><th class="r">Pix</th><th class="r">Cartão</th><th class="r">Dinheiro</th><th class="r">Total</th><th class="r">Comissão</th><th class="r">Fica na casa</th></tr>' + Object.keys(byD).map(function (k) { var x = byD[k]; return '<tr><td>' + x.d + '</td><td>' + esc(x.b) + '</td><td class="r">' + x.n + '</td><td class="r">' + brl(x.pix) + '</td><td class="r">' + brl(x.cartao) + '</td><td class="r">' + brl(x.dinheiro) + '</td><td class="r"><strong>' + brl(x.t) + '</strong></td><td class="r">' + brl(x.c) + '</td><td class="r">' + brl(x.t - x.c) + '</td></tr>'; }).join('') + '</table>' + (V.rows.length ? '' : '<p class="empty">Sem comandas no período.</p>');
    $('#vList').innerHTML = '<table><tr><th>Data</th><th>Barbeiro</th><th>Itens</th><th>Pgto</th><th class="r">Total</th><th></th></tr>' + V.rows.map(function (r) {
      return '<tr><td>' + dmy(r.data) + ' ' + hm(r.data) + '</td><td>' + esc(chairName(r.chair_id)) + '</td><td>' + (r.itens || []).map(function (i) { return esc(i.nome) + (i.qtd > 1 ? ' ×' + i.qtd : ''); }).join(', ') + (r.obs ? '<br><span class="muted small">' + esc(r.obs) + '</span>' : '') + '</td><td>' + r.pagamento + '</td><td class="r">' + brl(r.total) + '</td><td class="r"><button class="btn btn-sm btn-bad" data-del="' + r.id + '">✕</button></td></tr>';
    }).join('') + '</table>' + (V.rows.length ? '' : '<p class="empty">Nenhuma venda no período.</p>');
    $$('[data-del]').forEach(function (b) { b.addEventListener('click', async function () { if (!confirm('Apagar esta venda?')) return; var r = await sb.from('imperio_sales').delete().eq('id', b.dataset.del); if (r.error) return fail(r.error); loadVendas(); }); });
  }
  function csv() {
    var lines = [['data', 'barbeiro', 'itens', 'pagamento', 'total', 'comissao_pct', 'comissao_valor', 'obs']].concat(V.rows.map(function (r) {
      return [new Date(r.data).toISOString(), chairName(r.chair_id), (r.itens || []).map(function (i) { return i.nome + ' x' + i.qtd + ' @' + i.preco; }).join(' | '), r.pagamento, r.total, r.comissao_pct, r.comissao_valor, r.obs || ''];
    }));
    var txt = lines.map(function (l) { return l.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';'); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + txt], { type: 'text/csv' })); a.download = 'vendas_' + V.from + '_' + V.to + '.csv'; a.click();
  }

  /* ================= CONFIG ================= */
  function initConfig() {
    renderCfg();
    $('#cfgAddSvc').addEventListener('click', async function () { var r = await sb.from('imperio_services').insert({ nome: 'Novo serviço', preco: 0, duracao_min: 30, ordem: D.services.length + 1 }); if (r.error) return fail(r.error); await loadBase(); renderCfg(); });
    $('#cfgAddProd').addEventListener('click', async function () { var r = await sb.from('imperio_products').insert({ nome: 'Novo produto', preco: 0 }); if (r.error) return fail(r.error); await loadBase(); renderCfg(); });
    $('#sSave1').addEventListener('click', async function () { await saveSettings({ pix_chave: $('#sPix').value.trim(), pix_nome: $('#sPixNome').value.trim(), sinal_pct: Number($('#sSinal').value || 50), whatsapp: $('#sZap').value.replace(/\D/g, '') }); });
    $('#sSave2').addEventListener('click', async function () {
      var hor = {}; DIAS.forEach(function (d) { var on = $('#h_' + d + '_on').checked; hor[d] = on ? [$('#h_' + d + '_a').value, $('#h_' + d + '_b').value] : null; });
      await saveSettings({ slot_min: Number($('#sSlot').value || 30), antecedencia_min: Number($('#sLead').value || 60), dias_a_frente: Number($('#sDays').value || 14), horario: hor });
    });
    $('#pwSave').addEventListener('click', async function () { var p = $('#newPw').value; if (p.length < 8) return toast('Mínimo 8 caracteres', true); var r = await sb.auth.updateUser({ password: p }); if (r.error) return fail(r.error); $('#newPw').value = ''; toast('Senha atualizada'); });
  }
  async function saveSettings(obj) {
    var rows = Object.keys(obj).map(function (k) { return { key: k, value: obj[k] }; });
    var r = await sb.from('imperio_settings').upsert(rows, { onConflict: 'key' }); if (r.error) return fail(r.error);
    await loadBase(); toast('Configurações salvas');
  }
  function renderCfg() {
    var S = D.settings;
    $('#cfgChairs').innerHTML = D.chairs.map(function (c) {
      return '<div class="cfg-row" style="--c:5" data-chair="' + c.id + '"><label>Nº<input value="' + esc(c.numero) + '" data-f="numero"></label><label>Barbeiro<input value="' + esc(c.barbeiro) + '" data-f="barbeiro"></label><label>Especialidade<input value="' + esc(c.especialidade || '') + '" data-f="especialidade"></label><label>Dias (texto do site)<input value="' + esc(c.dias || '') + '" data-f="dias"></label><label>Comissão %<input type="number" value="' + c.comissao_pct + '" data-f="comissao_pct"></label><div class="row"><label style="text-transform:none;letter-spacing:0"><span style="display:flex;gap:6px;align-items:center"><input type="checkbox" style="width:auto" ' + (c.ativo ? 'checked' : '') + ' data-f="ativo"> ativa</span></label><button class="btn btn-sm" data-save-chair="' + c.id + '">Salvar</button></div></div>';
    }).join('');
    $$('[data-save-chair]').forEach(function (b) { b.addEventListener('click', async function () { var row = b.closest('[data-chair]'), p = {}; $$('[data-f]', row).forEach(function (i) { p[i.dataset.f] = i.type === 'checkbox' ? i.checked : (i.type === 'number' ? Number(i.value) : i.value.trim()); }); var r = await sb.from('imperio_chairs').update(p).eq('id', Number(row.dataset.chair)); if (r.error) return fail(r.error); await loadBase(); toast('Cadeira salva'); }); });
    $('#cfgSvcs').innerHTML = D.services.map(function (s) {
      return '<div class="cfg-row" style="--c:4" data-svc="' + s.id + '"><label>Serviço<input value="' + esc(s.nome) + '" data-f="nome"></label><label>Preço (vazio = consulte)<input type="number" step="0.01" value="' + (s.preco == null ? '' : s.preco) + '" data-f="preco"></label><label>Duração (min)<input type="number" value="' + s.duracao_min + '" data-f="duracao_min"></label><label>Ordem<input type="number" value="' + s.ordem + '" data-f="ordem"></label><div class="row"><label style="text-transform:none;letter-spacing:0"><span style="display:flex;gap:6px;align-items:center"><input type="checkbox" style="width:auto" ' + (s.ativo ? 'checked' : '') + ' data-f="ativo"> ativo</span></label><button class="btn btn-sm" data-save-svc="' + s.id + '">Salvar</button></div></div>';
    }).join('');
    $$('[data-save-svc]').forEach(function (b) { b.addEventListener('click', async function () { var row = b.closest('[data-svc]'), p = {}; $$('[data-f]', row).forEach(function (i) { p[i.dataset.f] = i.type === 'checkbox' ? i.checked : (i.type === 'number' ? (i.value === '' ? null : Number(i.value)) : i.value.trim()); }); var r = await sb.from('imperio_services').update(p).eq('id', Number(row.dataset.svc)); if (r.error) return fail(r.error); await loadBase(); toast('Serviço salvo'); }); });
    $('#cfgProds').innerHTML = D.products.map(function (p) {
      return '<div class="cfg-row" style="--c:4" data-prod="' + p.id + '"><label>Produto<input value="' + esc(p.nome) + '" data-f="nome"></label><label>Categoria<input value="' + esc(p.categoria || '') + '" data-f="categoria"></label><label>Preço<input type="number" step="0.01" value="' + p.preco + '" data-f="preco"></label><label>Estoque<input type="number" value="' + (p.estoque == null ? '' : p.estoque) + '" data-f="estoque"></label><div class="row"><label style="text-transform:none;letter-spacing:0"><span style="display:flex;gap:6px;align-items:center"><input type="checkbox" style="width:auto" ' + (p.ativo ? 'checked' : '') + ' data-f="ativo"> ativo</span></label><button class="btn btn-sm" data-save-prod="' + p.id + '">Salvar</button></div></div>';
    }).join('') || '<p class="empty">Nenhum produto cadastrado.</p>';
    $$('[data-save-prod]').forEach(function (b) { b.addEventListener('click', async function () { var row = b.closest('[data-prod]'), p = {}; $$('[data-f]', row).forEach(function (i) { p[i.dataset.f] = i.type === 'checkbox' ? i.checked : (i.type === 'number' ? (i.value === '' ? null : Number(i.value)) : i.value.trim()); }); var r = await sb.from('imperio_products').update(p).eq('id', Number(row.dataset.prod)); if (r.error) return fail(r.error); await loadBase(); toast('Produto salvo'); }); });
    $('#sPix').value = typeof S.pix_chave === 'string' ? S.pix_chave : ''; $('#sPixNome').value = typeof S.pix_nome === 'string' ? S.pix_nome : ''; $('#sSinal').value = S.sinal_pct || 50; $('#sZap').value = typeof S.whatsapp === 'string' ? S.whatsapp : '';
    $('#sSlot').value = S.slot_min || 30; $('#sLead').value = S.antecedencia_min || 60; $('#sDays').value = S.dias_a_frente || 14;
    var hor = S.horario || {};
    $('#sHours').innerHTML = DIAS.map(function (d, i) { var h = hor[d]; return '<div class="row"><label style="text-transform:none;letter-spacing:0;width:110px"><span style="display:flex;gap:6px;align-items:center"><input type="checkbox" style="width:auto" id="h_' + d + '_on" ' + (h ? 'checked' : '') + '> ' + DIAS_L[i] + '</span></label><input type="time" id="h_' + d + '_a" value="' + (h ? h[0] : '08:30') + '" style="width:auto"><input type="time" id="h_' + d + '_b" value="' + (h ? h[1] : '20:00') + '" style="width:auto"></div>'; }).join('');
  }
})();
