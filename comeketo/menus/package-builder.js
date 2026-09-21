(() => {
  'use strict';
  const C = globalThis.PackageCatalog, core = globalThis.PackageCore, esc = core.escape;
  const $ = id => document.getElementById(id), form = $('builder');
  const preview = new URLSearchParams(location.search).has('preview');
  // Existing tray-menu intake. Zapier must map both email deliveries before launch.
  const endpoint = 'https://hooks.zapier.com/hooks/catch/10501573/4yvjcgt/';
  const team = 'team@comeketocatering.com';
  const labels = ['Event','Menu','Location','Contact','Review'];
  const titles = ['Let’s start with your event.','Make the menu your own.','Where are we gathering?','Let’s stay in touch.','Everything look delicious?'];
  const descriptions = ['A few details help us plan something just right.','Mix your favorites across cuisines. Your estimate updates as you choose.','The full address helps us plan delivery and service.','We’ll review your choices together and answer your questions.','Check your details, then send your menu and request a personal call.'];
  const groups = {mains:'Mains',sides:'Sides',salads:'Salads',apps:'Appetizers',boards:'Sharing platters'};
  const styleCopy = {'Buffet':'A welcoming spread, with our team on hand.','Family Style':'Shared dishes brought to your tables.','Plated':'A seated meal, served to each guest.','Drop-Off':'Delivered with warming trays and setup.'};
  const expanded = new Set();
  const favorites=['Boneless Stuffed Chicken','Beef or Chicken Fajitas','Chicken Marsala','Baked Ziti','Lasagna — Meat (Bolognese)','Tacos — Beef or Chicken','Eggplant Parmesan over Penne','Salmon'];
  let step=0, furthest=0, busy=false, sent=false, lastPayload;
  const state={style:'Buffet',mains:[],sides:[],salads:[],apps:[],boards:[]};
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
  const today=new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
  const todayISO=today.toISOString().slice(0,10);
  form.elements.date.min=todayISO;
  const states='AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  states.forEach(s=>form.elements.state.add(new Option(s,s)));
  $('preview-note').hidden=!preview;
  function read(){
    for(const [k,v] of new FormData(form)) if(!k.startsWith('dish-')) state[k]=String(v).trim();
    state.consent=form.elements.consent.checked;
    return state;
  }
  function estimate(){try{return core.estimate(C,read());}catch{return null;}}
  function drawStyles(){
    $('styles').innerHTML=Object.keys(C.styles).map(s=>`<button type="button" class="style" data-style="${esc(s)}" aria-pressed="${s===state.style}"><strong>${esc(s)}</strong><span>${styleCopy[s]}</span></button>`).join('');
    let help=$('package-help');
    if(!help){help=document.createElement('details');help.id='package-help';help.className='package-help';$('menu-guide').after(help);}
    help.innerHTML=`<summary>What’s included & how pricing works</summary>
      <p>A <strong>main</strong> is a dish you choose for your event, such as chicken, fajitas, or pasta. Choosing 2 mains means your guests have 2 different dishes to enjoy.</p>
      <table><caption>${esc(state.style)} packages · base food price per guest</caption><thead><tr><th scope="col">Package</th><th scope="col">Dishes included</th><th scope="col">Food / guest</th></tr></thead><tbody>${C.styles[state.style].tiers.map(([name,price,mains,sides])=>`<tr><th scope="row">${esc(name)}</th><td>${mains} main${mains===1?'':'s'} + ${sides} sides + 1 salad</td><td>${money(price)}</td></tr>`).join('')}</tbody></table>
      <p><strong>Your package follows your choices.</strong> Pick 1 main for Mini, 2 for Full, or 3 for Deluxe. Adding a second or third main moves you to the next package and its price; it is not a free extra dish.</p>
      <ul><li><strong>Standard dishes:</strong> no premium surcharge when chosen as one of your package’s included dishes.</li><li><strong>Premium dishes:</strong> the displayed surcharge is added per guest, even when the dish is one of your included choices.</li><li><strong>Extra dishes:</strong> each main beyond 3 adds $6.50 per guest. Each side beyond your package’s included number, or each salad beyond the first, adds $3.50 per guest. Premium surcharges also apply.</li><li><strong>Appetizers and sharing platters:</strong> optional additions, charged per guest at the price shown.</li></ul>
      <p class="muted">For example, 2 standard mains with up to ${C.styles[state.style].tiers[1][3]} standard sides and 1 standard salad use the ${money(C.styles[state.style].tiers[1][1])}/guest Full food package. Staffing, setup, service fees, and tax are added where applicable in your estimate. Delivery and travel are quoted separately.</p>`;
  }
  function drawMenu(){
    $('menu').innerHTML=Object.entries(groups).map(([k,label],i)=>`<details ${i===0?'open':''}><summary>${label}<small id="count-${k}"></small></summary><div class="dishes">${C[k].map(([n,p],j)=>`<label class="dish" data-name="${esc(n.toLowerCase())}"><input type="checkbox" name="dish-${k}-${j}" data-group="${k}" value="${esc(n)}" ${state[k].includes(n)?'checked':''}><span>${esc(n)}<small>${p?`+${money(p)} / guest${k==='apps'||k==='boards'?'':' premium'}`:'Standard dish · no premium surcharge'}</small></span></label>`).join('')}</div><p class="no-results muted" hidden>No matches in this category.</p></details>`).join('');
    const mainDishes=$('menu').querySelector('details .dishes');
    favorites.slice().reverse().forEach(name=>{const row=[...mainDishes.children].find(l=>l.querySelector('input').value===name);if(row)mainDishes.prepend(row);});
    $('menu').querySelectorAll('details').forEach((details,i)=>{
      const key=Object.keys(groups)[i];details.dataset.group=key;
      const button=document.createElement('button');button.type='button';button.className='more-dishes';button.dataset.expand=key;button.textContent=`See all ${groups[key].toLowerCase()} (${C[key].length})`;details.append(button);
    });
    filterMenu();
  }
  function filterMenu(){
    const q=$('search').value.trim().toLowerCase();
    let totalMatches=0;
    $('menu').querySelectorAll('details').forEach(d=>{
      let count=0;
      d.querySelectorAll('.dish').forEach((label,i)=>{
        label.hidden=q?!label.dataset.name.includes(q):(!expanded.has(d.dataset.group)&&i>=8&&!label.querySelector('input').checked);
        if(!label.hidden)count++;
      });
      d.querySelector('.no-results').hidden=count>0;
      totalMatches+=count;
      d.querySelector('.more-dishes').hidden=!!q||expanded.has(d.dataset.group)||C[d.dataset.group].length<=8;
      if(q)d.open=count>0;
    });
    let status=$('search-status');
    if(!status){status=document.createElement('p');status.id='search-status';status.className='muted';status.setAttribute('role','status');$('search').parentElement.after(status);}
    status.hidden=!q;status.textContent=totalMatches?`${totalMatches} matching dish${totalMatches===1?'':'es'}`:'No dishes match. Try chicken, pasta, or tacos.';
  }
  function breakdown(e){
    return [['Food',e.food],['Staffing',e.staff],['Warming trays',e.chafers],['Buffet setup',e.setup],['Service, fuel & admin (24%)',e.service],['Meals tax (7%)',e.tax]].filter(([,v])=>v>0).map(([n,v])=>`<div class="estimate-line"><span>${n}</span><span>${money(v)}</span></div>`).join('')+`<div class="estimate-line estimate-total"><span>Estimated total</span><strong>${money(e.total)}</strong></div><div class="estimate-line"><span>Per guest, before delivery</span><span>${money(e.perGuest)}</span></div>`;
  }
  function update(){
    read(); const e=estimate();
    $('event-summary').textContent=state.guests?`${state.guests} guests · ${state.style}${state.date?' · '+state.date:''}`:'Your choices, all in one place.';
    $('selection-summary').innerHTML=Object.entries(groups).filter(([k])=>state[k].length).map(([k,v])=>`<div class="selected-group"><strong>${v}</strong><ul>${state[k].map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`).join('') || '<p class="muted" style="font-size:12px;padding:18px 0">Your selected dishes will appear here.</p>';
    $('estimate').innerHTML=e&&state.mains.length?breakdown(e):'<div class="estimate-line estimate-total">Choose your mains to see your estimate.</div>';
    const tier=e||{tier:'Mini',includedMains:1,includedSides:2};
    $('menu-guide').innerHTML=`<strong>${esc(state.style)} · ${tier.tier} menu</strong><br>Your food package includes ${tier.includedMains} main dish${tier.includedMains===1?'':'es'}, ${tier.includedSides} side dishes & 1 salad for your guests.<br>Pick 1, 2, or 3 mains to choose the Mini, Full, or Deluxe package. Premium dishes and extra choices cost more—see the breakdown below.`;
    if(e&&state.mains.length)$('menu-guide').innerHTML+=`<br><strong class="menu-price">Estimated ${money(e.total)} · ${money(e.perGuest)}/guest</strong><br>Includes staffing, fees, and tax where applicable. Delivery/travel quoted separately.`;
    Object.keys(groups).forEach(k=>{$('count-'+k).textContent=`${state[k].length} selected`;});
  }
  function clearError(){$('error').hidden=true;}
  function error(message){$('error').textContent=message;$('error').hidden=false;$('error').focus();}
  function summaryText(){
    const e=estimate();
    return [`Catering menu & callback request`,`${state.name} · ${state.email} · ${state.phone}`,`Preferred callback: ${state.callback}`,`Event: ${state.event} · ${state.date} · ${state.time} (event local time)`,`${state.guests} guests · ${state.style}`,`Venue: ${state.venue||'Not specified'}`,`${state.street}${state.unit?', '+state.unit:''}, ${state.city}, ${state.state} ${state.zip}`,...Object.keys(groups).map(k=>`${groups[k]}: ${state[k].join(', ')||'None selected'}`),`Dietary needs: ${state.diet||'None noted'}`,`Access: ${state.access||'None noted'}`,`Notes: ${state.notes||'None'}`,`Food: ${money(e.food)}`,`Staffing: ${money(e.staff)}`,`Warming trays: ${money(e.chafers)}; setup: ${money(e.setup)}`,`Service, fuel & admin: ${money(e.service)}`,`Meals tax: ${money(e.tax)}`,`Estimated total: ${money(e.total)}`,`Delivery/travel quoted separately. Availability and final pricing to be confirmed.`, `Permission to email and call about this event: Yes.`].join('\n');
  }
  function drawReview(){
    const entries=[['Your event',`${state.event}\n${state.date} at ${state.time} (event local time)\n${state.guests} guests · ${state.style}`,0],['Your menu',Object.keys(groups).filter(k=>state[k].length).map(k=>`${groups[k]}: ${state[k].join(', ')}`).join('\n')+`\nDietary needs: ${state.diet||'None noted'}`,1],['Event location',`${state.venue||''}\n${state.street} ${state.unit||''}\n${state.city}, ${state.state} ${state.zip}\n${state.access||''}`,2],['Your contact details',`${state.name}\n${state.email}\n${state.phone}\nCall: ${state.callback}\n${state.notes||''}`,3]];
    $('review').innerHTML=entries.map(([title,body,i])=>`<div class="review-section"><h3>${title}<button type="button" class="edit" data-edit="${i}">Edit<span class="sr-only"> ${title}</span></button></h3><p>${esc(body)}</p></div>`).join('');
  }
  function show(n){
    step=n;furthest=Math.max(furthest,n);clearError();read();
    document.querySelectorAll('[data-step]').forEach(s=>s.hidden=Number(s.dataset.step)!==n);
    $('progress').innerHTML=labels.map((l,i)=>`<li><button type="button" data-step-nav="${i}" ${i===n?'aria-current="step"':''} ${i>furthest?'disabled':''}><b>${i<n?'✓':i+1}</b>${l}</button></li>`).join('');
    $('step-number').textContent=`STEP ${String(n+1).padStart(2,'0')} OF 05`;
    $('step-title').textContent=titles[n];$('step-description').textContent=descriptions[n];
    $('back').hidden=n===0;
    $('next').textContent=['Choose your menu →','Add event location →','Add contact details →','Review your request →',preview?'Preview complete · sending disabled':'Send My Menu & Request a Call'][n];
    $('next').disabled=preview&&n===4;
    update();if(n===4){drawReview();window.dispatchEvent(new CustomEvent('menu-review',{detail:{state:structuredClone(state),estimate:estimate(),preview}}));}
    if(n!==0||furthest>0)$('step-title').focus({preventScroll:true});
    if(furthest>0)$('progress').scrollIntoView({block:'start',behavior:'instant'});
  }
  async function send(){
    if(busy||sent||preview)return;
    const e=estimate(), text=summaryText(), items=Object.keys(groups).flatMap(k=>state[k].map(name=>({name,section:groups[k],qty:1,guests:+state.guests})));
    const emailHTML=`<!doctype html><html><body style="font-family:Arial,sans-serif;color:#252b26;background:#f7f4ee;padding:24px"><h1 style="font-family:Georgia,serif">Your Comeketo menu request</h1><p>Thank you for planning your gathering with us. Our team will call to discuss your menu, availability, and final quote.</p><pre style="font:14px/1.7 Arial,sans-serif;white-space:pre-wrap">${esc(text)}</pre></body></html>`;
    const payload={source:'Customer Catering Package Builder',request_id:crypto.randomUUID(),submitted_at:new Date().toISOString(),subject:`Callback requested · ${state.name} · ${state.event} · ${state.date}`,customer_name:state.name,email:state.email,phone:state.phone,event_date:state.date,event_date_iso:state.date,event_time:state.time,guests:+state.guests,event_type:state.event,service_style:state.style,venue:state.venue||'',street_address:state.street,address_line_2:state.unit||'',city:state.city,state:state.state,zip_code:state.zip,full_address:[state.street,state.unit,state.city,state.state,state.zip].filter(Boolean).join(', '),callback_requested:true,callback_time:state.callback,contact_consent:true,notes:[state.notes,state.diet,state.access].filter(Boolean).join('\n'),dietary_needs:state.diet||'',access_notes:state.access||'',items,items_count:items.length,order_summary_text:text,customer_quote_html:emailHTML,team_notification_html:emailHTML,notification_email:team,catering_total:e.food,staff_fee:e.staff,service_charge:e.service,ma_tax:e.tax,event_total:e.total,event_total_formatted:money(e.total),estimated_subtotal:e.subtotal,estimated_subtotal_formatted:money(e.subtotal),pricing_status:'Estimate only; delivery and travel pending',callback_action:'Call customer to finalize catering quote',wants_service:state.style==='Drop-Off'?'No':'Yes'};
    // Keep the same ID when retrying so the receiver can deduplicate uncertain deliveries.
    if(lastPayload && lastPayload.order_summary_text===text)payload.request_id=lastPayload.request_id;
    lastPayload=payload;
    busy=true;$('next').disabled=true;$('back').disabled=true;$('next').textContent='Sending your request…';
    form.setAttribute('aria-busy','true');
    $('progress').querySelectorAll('button').forEach(b=>b.disabled=true);
    $('review').querySelectorAll('button').forEach(b=>b.disabled=true);
    const body=new URLSearchParams();Object.entries(payload).forEach(([k,v])=>body.set(k,typeof v==='object'?JSON.stringify(v):String(v)));
    try {
      await core.submit(fetch,endpoint,body,AbortSignal.timeout(15000));
      sent=true;form.hidden=true;['step-number','step-title','step-description'].forEach(id=>$(id).hidden=true);
      $('success').hidden=false;$('customer').textContent=state.name;
      $('receipt').textContent=`Request reference: ${payload.request_id.slice(0,8).toUpperCase()}. Your request has been received. You can save a copy below.`;
      $('success-title').focus();
    } catch {
      error('We couldn’t confirm receipt. Your menu is still here. Please call (978) 381-1212 before retrying if you may already have sent it.');
      $('next').textContent='Try sending again';
    } finally {
      busy=false;form.removeAttribute('aria-busy');$('next').disabled=false;$('back').disabled=false;
      if(!sent){$('progress').querySelectorAll('button').forEach(b=>b.disabled=false);$('review').querySelectorAll('button').forEach(b=>b.disabled=false);}
    }
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();if(busy||sent)return;read();
    const invalid=form.querySelector(`[data-step="${step}"] :invalid:not(#pay-amount)`);
    if(invalid){invalid.reportValidity();return;}
    if(step===4){for(let i=0;i<4;i++){const message=core.validate(i,state,todayISO);if(message){show(i);error(message);return;}}send();}
    else{const message=core.validate(step,state,todayISO);if(message){error(message);return;}show(step+1);}
  });
  $('back').addEventListener('click',()=>{if(!busy)show(step-1);});
  $('styles').addEventListener('click',e=>{const b=e.target.closest('[data-style]');if(b){state.style=b.dataset.style;drawStyles();update();[...$('styles').children].find(x=>x.dataset.style===state.style).focus();}});
  form.addEventListener('input',e=>{
    if(e.target.dataset.group){const k=e.target.dataset.group,n=e.target.value;state[k]=e.target.checked?[...new Set([...state[k],n])]:state[k].filter(x=>x!==n);}
    clearError();update();
  });
  $('search').addEventListener('input',filterMenu);
  $('menu').addEventListener('click',e=>{const b=e.target.closest('[data-expand]');if(b){expanded.add(b.dataset.expand);filterMenu();}});
  $('review').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b&&!busy)show(+b.dataset.edit);});
  $('progress').addEventListener('click',e=>{const b=e.target.closest('[data-step-nav]');if(b&&!busy&&!sent){const n=+b.dataset.stepNav;if(n>step){read();for(let i=0;i<n;i++){const msg=core.validate(i,state,todayISO);if(msg){show(i);error(msg);return;}}}show(n);}});
  $('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([lastPayload.order_summary_text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Comeketo-menu-request.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  window.restoreMenuPayment=function(saved){
    if(!saved)return;
    for(const k of Object.keys(state))if(Array.isArray(state[k])&&Array.isArray(saved[k]))state[k]=saved[k];
    state.style=Object.hasOwn(C.styles,saved.style)?saved.style:'Buffet';
    for(const [k,v]of Object.entries(saved)){const field=form.elements.namedItem(k);if(field&&typeof v!=='object'){if(field.type==='checkbox')field.checked=v===true;else field.value=String(v);}}
    drawStyles();drawMenu();read();show(4);
  };
  drawStyles();drawMenu();show(0);
})();
