(() => {
  'use strict';
  const API='https://comeketo-command-center.onrender.com';
  const content=document.getElementById('payment-content');
  const esc=PackageCore.escape;
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
  let token=window.menuBookingToken||'',current=null,version=0,processing=false;
  try{token=token||sessionStorage.getItem('comeketo-booking')||'';}catch{}
  const preview=new URLSearchParams(location.search).has('preview');
  async function call(route,data){
    const r=await fetch(API+'/public/menu-payment/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,...data}),signal:AbortSignal.timeout(30000)});
    const result=await r.json();if(!r.ok||!result.ok)throw Error(result.error||'Could not reach payments. Please contact André.');return result;
  }
  function paid(data){content.innerHTML=`<div class="payment-received"><strong>Payment received: ${money(data.amount)}</strong><p>Thank you. Your payment is recorded with your catering request. André will follow up with your event details.</p></div>`;}
  function draw(a,enabled){
    content.innerHTML=`<div class="payment-totals"><div>Event total <strong>${money(a.total)}</strong></div>${a.travel?`<div>Includes confirmed delivery/travel <strong>${money(a.travel)}</strong></div>`:''}<div>Minimum to reserve your date <strong>${money(a.minimum)}</strong></div></div>
      <label class="pay-choice"><input type="radio" name="paymentMode" value="custom" checked><span><strong>Choose your payment</strong><small>20% minimum. The rest is due on your agreed payment schedule.</small></span></label>
      <label for="pay-amount">Amount to pay now (USD)</label><input id="pay-amount" type="number" min="${(a.minimum/100).toFixed(2)}" max="${((a.full-1)/100).toFixed(2)}" step="0.01" inputmode="decimal" value="${(a.minimum/100).toFixed(2)}">
      <label class="pay-choice"><input type="radio" name="paymentMode" value="full"><span><strong>Pay in full · ${money(a.full)}</strong><small>Save ${money(a.discount)} with your 3% full-payment discount.</small></span></label>
      <p id="pay-balance" class="muted"></p><p class="payment-terms">Your date-reservation payment is applied to this event. Full-payment savings apply when the entire event total is paid in one payment. Menu changes after payment must be arranged with André.</p>
      <button type="button" id="pay-now" class="primary" ${enabled?'':'disabled'}>${preview?'Preview · payments disabled':enabled?'Continue to Stripe →':'Payments not connected yet'}</button><p id="pay-error" role="alert"></p><small>Secure payment on Stripe. Your card details are never entered on this page.</small>`;
    const amount=document.getElementById('pay-amount'),button=document.getElementById('pay-now');
    function update(){const full=content.querySelector('input[name="paymentMode"]:checked').value==='full';amount.disabled=full||processing;const value=full?a.full:Math.round(Number(amount.value)*100);document.getElementById('pay-balance').textContent=full?'Remaining balance: $0.00':`Remaining balance: ${money(Math.max(0,a.total-(Number.isFinite(value)?value:0)))}`;if(enabled&&!processing)button.textContent=`Pay ${money(Number.isFinite(value)?value:0)} on Stripe →`;}
    content.querySelectorAll('input').forEach(input=>input.addEventListener('input',update));update();
    button.addEventListener('click',async()=>{
      if(!enabled||processing)return;
      const mode=content.querySelector('input[name="paymentMode"]:checked').value;
      const err=document.getElementById('pay-error');err.textContent='';
      if(mode==='custom'&&!amount.reportValidity())return;
      processing=true;button.disabled=true;button.textContent='Opening secure payment…';
      try{const result=await call('checkout',{event:current,mode,amount:amount.value});if(!result.url.startsWith('https://checkout.stripe.com/'))throw Error('Could not open secure checkout.');location.assign(result.url);}
      catch(e){err.textContent=e.message;processing=false;button.disabled=false;update();}
    });
  }
  window.addEventListener('menu-review',async event=>{
    current=event.detail.state;const seq=++version;
    if(preview){const total=Math.round(event.detail.estimate.total*100),discount=Math.round(total*.03);draw({total,minimum:Math.ceil(total*.2),full:total-discount,discount},false);return;}
    if(!token){content.innerHTML='<p class="notice">Open the personalized menu link André sent you to pay and reserve your date. Or send your menu below and we’ll help you finalize it.</p>';return;}
    content.textContent='Checking your total and payment options…';
    try{const a=await call('options',{event:current});if(seq!==version)return;if(a.paid)paid(a);else draw(a,a.ready);}catch(e){if(seq===version)content.innerHTML=`<p role="alert">${esc(e.message)}</p>`;}
  });
  if(token&&!preview&&new URLSearchParams(location.search).has('payment')){
    call('status',{}).then(data=>{
      if(data.event)window.restoreMenuPayment(data.event);
      if(data.paid){version++;paid(data);}
    }).catch(e=>{const error=document.getElementById('error');error.textContent='Payment confirmation: '+e.message+' If you completed payment, contact André before trying again.';error.hidden=false;error.focus();});
  }
})();
