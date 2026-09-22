/* Pure customer-builder rules. Monetary estimates mirror the command center's
   default Mex/Ital catalog; final delivery/travel is confirmed by the team. */
globalThis.PackageCore = (() => {
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0);
  const dateUS = value => {
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[2]}/${m[3]}/${m[1]}` : String(value||'');
  };
  function estimate(c, s) {
    const guests = Number(s.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > 5000 || !Object.hasOwn(c.styles,s.style)) throw Error('Check the guest count and service style.');
    const selected = {};
    for (const k of ['mains','sides','salads','apps','boards']) {
      selected[k] = [...new Set(s[k] || [])];
      if (selected[k].some(n => !c[k].some(x => x[0] === n))) throw Error('Choose dishes from the menu.');
    }
    const style = c.styles[s.style];
    const tier = style.tiers.find(t => t[2] >= selected.mains.length) || style.tiers.at(-1);
    const extraMains = Math.max(0,selected.mains.length-tier[2])*6.5;
    const extraSides = Math.max(0,selected.sides.length-tier[3])*3.5;
    const extraSalads = Math.max(0,selected.salads.length-1)*3.5;
    const groupPrices=Object.fromEntries(Object.keys(selected).map(k=>[k,selected[k].reduce((v,n)=>v+c[k].find(x=>x[0]===n)[1],0)]));
    const extras = extraMains+extraSides+extraSalads;
    const upgrades = Object.values(groupPrices).reduce((sum,n)=>sum+n,0);
    const food = (tier[1]+extras+upgrades)*guests;
    const staff = style.staff*guests;
    const drop = s.style === 'Drop-Off';
    const chafers = drop ? Math.max(25,1.29*guests) : 0;
    const setup = drop ? 1.2*guests : 0;
    const subtotal = food+staff+chafers+setup;
    const service = drop ? 0 : subtotal*.24;
    const tax = (subtotal+service)*.07;
    return {tier:tier[0],includedMains:tier[2],includedSides:tier[3],basePerGuest:tier[1],extraMainsPerGuest:round(extraMains),extraSidesPerGuest:round(extraSides+groupPrices.sides),extraSaladsPerGuest:round(extraSalads+groupPrices.salads),premiumMainsPerGuest:round(groupPrices.mains),appsPerGuest:round(groupPrices.apps),boardsPerGuest:round(groupPrices.boards),food:round(food),staffPerGuest:style.staff,staff:round(staff),chafers:round(chafers),setup:round(setup),subtotal:round(subtotal),service:round(service),tax:round(tax),total:round(subtotal+service+tax),perGuest:round((subtotal+service+tax)/guests)};
  }

  function estimateNumber(requestId){
    let hash=2166136261;
    for(const ch of String(requestId||'')){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}
    return `CMK-${String(10000+(hash>>>0)%90000)}`;
  }

  function quoteEmailHTMLRaw(s,e,{estimateNo=estimateNumber('')}={}){
    const g=Number(s.guests)||0;
    const list=k=>(s[k]||[]).map(escape).join(' · ');
    const amountRow=(label,perGuest,amount,detail='')=>`<tr><td style="padding:10px 12px;border-top:1px solid #eadfce;vertical-align:top"><div style="font-weight:700;color:#1e1a16">${escape(label)}</div>${detail?`<div style="font-size:11px;color:#8a7a63;line-height:1.45;margin-top:3px">${detail}</div>`:''}</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right;white-space:nowrap">${money(perGuest)}</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right">${g}</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right;white-space:nowrap">${money(amount)}</td></tr>`;
    const flatRow=(label,amount,detail='')=>`<tr><td style="padding:10px 12px;border-top:1px solid #eadfce;vertical-align:top"><div style="font-weight:700;color:#1e1a16">${escape(label)}</div>${detail?`<div style="font-size:11px;color:#8a7a63;line-height:1.45;margin-top:3px">${detail}</div>`:''}</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right">—</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right">—</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right;white-space:nowrap">${money(amount)}</td></tr>`;
    const rows=[
      amountRow(`${s.style} ${e.tier} — Food`,e.basePerGuest,e.basePerGuest*g,`Mains: ${list('mains')}<br>Sides: ${list('sides')}${s.salads?.length?` · ${list('salads')}`:''}`),
      e.extraMainsPerGuest?amountRow(`Extra proteins (${Math.max(0,(s.mains||[]).length-e.includedMains)} beyond ${e.tier})`,e.extraMainsPerGuest,e.extraMainsPerGuest*g):'',
      e.premiumMainsPerGuest?amountRow('Premium protein upcharge',e.premiumMainsPerGuest,e.premiumMainsPerGuest*g):'',
      e.extraSidesPerGuest?amountRow('Sides — extras / premium',e.extraSidesPerGuest,e.extraSidesPerGuest*g,list('sides')):'',
      e.extraSaladsPerGuest?amountRow('Salad — extras / premium',e.extraSaladsPerGuest,e.extraSaladsPerGuest*g,list('salads')):'',
      e.appsPerGuest?amountRow('Appetizers',e.appsPerGuest,e.appsPerGuest*g,list('apps')):'',
      e.boardsPerGuest?amountRow('Boards & Platters',e.boardsPerGuest,e.boardsPerGuest*g,list('boards')):'',
      e.staff?amountRow('Staffing',e.staffPerGuest,e.staff):'',
      e.chafers?flatRow('Wire chafers & sternos',e.chafers,'$1.29/guest · $25 minimum'):'',
      e.setup?flatRow('Buffet setup',e.setup,'$1.20/guest'):''
    ].join('');
    const payments=[.2,.35,.3,.15].map(p=>round(e.total*p));
    payments[3]=round(e.total-payments[0]-payments[1]-payments[2]);
    const payRow=(label,sub,amount)=>`<tr><td style="padding:9px 12px;border-top:1px solid #eadfce"><strong>${label}</strong><div style="font-size:10px;color:#8a7a63">${sub}</div></td><td style="padding:9px 12px;border-top:1px solid #eadfce;text-align:right;color:#8a2d18;font-weight:800">${money(amount)}</td></tr>`;
    const location=[s.venue,s.city,s.state].filter(Boolean).map(escape).join(', ');
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#eceae6;color:#1e1a16;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:680px;background:#fff;border-top:5px solid #161616"><tr><td style="padding:24px 30px 8px;text-align:center"><div style="font-size:11px;letter-spacing:2px;color:#8a2d18;font-weight:800">CATERING ESTIMATE</div><div style="font-family:Georgia,serif;font-size:28px;color:#8a2d18;margin:6px 0">Your Event Estimate</div><div style="font-size:11px;color:#c27e22;font-weight:700">Estimate #: ${escape(estimateNo)} &nbsp;·&nbsp; Valid 14 days &nbsp;·&nbsp; a 20% deposit price-locks this quote</div><div style="font-size:12px;margin-top:14px;line-height:1.7"><strong>Client:</strong> ${escape(s.name)} &nbsp;&nbsp; <strong>Date:</strong> ${escape(dateUS(s.date))} &nbsp;&nbsp; <strong>Location:</strong> ${location} &nbsp;&nbsp; <strong>Guests:</strong> ${g} &nbsp;&nbsp; <strong>Service:</strong> ${escape(`${s.style} ${e.tier}`)}</div></td></tr><tr><td style="padding:8px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:12px"><tr style="background:#f3ece0;color:#5c5148"><th style="padding:9px 12px;text-align:left">Description</th><th style="padding:9px 12px;text-align:right">Per guest</th><th style="padding:9px 12px;text-align:right">× ${g}</th><th style="padding:9px 12px;text-align:right">Amount</th></tr>${rows}<tr style="background:#faf5ec;font-weight:800"><td colspan="3" style="padding:10px 12px;border-top:1px solid #eadfce">Food Service Subtotal</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right">${money(e.subtotal)}</td></tr>${e.service?`<tr><td colspan="3" style="padding:10px 12px;border-top:1px solid #eadfce">Service, Fuel &amp; Admin (24%)</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right">${money(e.service)}</td></tr>`:''}<tr><td colspan="3" style="padding:10px 12px;border-top:1px solid #eadfce">MA Meals Tax (7%)</td><td style="padding:10px 12px;border-top:1px solid #eadfce;text-align:right">${money(e.tax)}</td></tr><tr style="background:#8a2d18;color:#fff;font-weight:800;font-size:14px"><td colspan="3" style="padding:11px 12px">EVENT TOTAL · ≈ ${money(e.perGuest)}/guest, all in</td><td style="padding:11px 12px;text-align:right">${money(e.total)}</td></tr></table></td></tr><tr><td style="padding:6px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dccdb8;border-collapse:collapse;font-size:12px"><tr><td colspan="2" style="background:#5a6f76;color:#fff;padding:9px 12px;font-weight:800">Example Payment Schedule</td></tr>${payRow('20% Downpayment','due at booking',payments[0])}${payRow('35% Second Payment','60 days after deposit',payments[1])}${payRow('30% Third Payment','due 60 days before the event',payments[2])}${payRow('15% Final Payment','due 30 days before the event',payments[3])}</table></td></tr><tr><td style="padding:16px 30px 26px;font-size:10.5px;color:#75695e;line-height:1.6"><strong style="color:#6b2013">Terms. Important:</strong> Estimate may change depending on venue requirements, delivery or travel. Your quote is valid for 14 days. A 20% down payment is required to price-lock the quote. Availability and final details are confirmed by the Comeketo team.<div style="border-top:1px solid #eadfce;margin-top:16px;padding-top:14px;text-align:center;font-size:12px;color:#5c5148"><strong>André | Comeketo Catering</strong><br>(978) 381-1212 · team@comeketocatering.com</div></td></tr></table></td></tr></table></body></html>`;
  }

  function quoteEmailHTML(s,e,options={}){
    return quoteEmailHTMLRaw(s,e,options).replace('<td style="padding:18px"><table role="presentation" width="100%"','<td style="padding:4px"><table role="presentation" width="100%"');
  }

  function buildQuoteEmail(s,e,{requestId='',estimateNo=estimateNumber(requestId)}={}){
    return {estimateNo,deliveryMode:'email_html',createNote:false,subject:`Your Comeketo Event Estimate — #${estimateNo}`,html:quoteEmailHTML(s,e,{estimateNo}),text:`Your Comeketo Event Estimate #${estimateNo}\nEvent total: ${money(e.total)}\nCall (978) 381-1212 with any questions.`};
  }
  function validate(step, s, today = new Date().toLocaleDateString('en-CA')) {
    if(step===0) {
      if(!s.event) return 'Choose your event type.';
      if(!/^\d{4}-\d{2}-\d{2}$/.test(s.date||'') || Number.isNaN(Date.parse(s.date)) || s.date<today) return 'Choose an event date today or later.';
      if(!/^\d{2}:\d{2}$/.test(s.time||'')) return 'Choose your serving time.';
      if(!Number.isInteger(+s.guests) || +s.guests<1 || +s.guests>5000) return 'Enter a guest count between 1 and 5,000.';
    }
    if(step===1 && (!s.mains?.length || !s.sides?.length)) return 'Choose at least one main and one side to build your menu.';
    if(step===2 && (!s.street?.trim() || !s.city?.trim() || !/^[A-Z]{2}$/.test(s.state||'') || !/^\d{5}(-\d{4})?$/.test(s.zip||''))) return 'Enter the full event address, state, and ZIP code.';
    if(step===3) {
      if(!s.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email||'') || !/^\+?[\d\s().-]+$/.test(s.phone||'') || s.phone.replace(/\D/g,'').length<10 || s.phone.replace(/\D/g,'').length>15) return 'Enter your name, a valid email, and a complete phone number.';
      if(!s.callback || !s.consent) return 'Choose a callback time and confirm we may contact you about this request.';
    }
    return '';
  }
  async function submit(transport, endpoint, body, signal) {
    const response=await transport(endpoint,{method:'POST',body,signal});
    const data=await response.json().catch(()=>null);
    if(!response.ok || data?.status!=='success')throw Error('No confirmed receipt');
    return data;
  }
  return { estimate, validate, escape, submit, estimateNumber, quoteEmailHTML, buildQuoteEmail };
})();
