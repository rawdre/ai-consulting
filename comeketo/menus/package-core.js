/* Pure customer-builder rules. Monetary estimates mirror the command center's
   default Mex/Ital catalog; final delivery/travel is confirmed by the team. */
globalThis.PackageCore = (() => {
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
    const extras = Math.max(0,selected.mains.length-tier[2])*6.5 + Math.max(0,selected.sides.length-tier[3])*3.5 + Math.max(0,selected.salads.length-1)*3.5;
    const upgrades = Object.keys(selected).reduce((sum,k) => sum + selected[k].reduce((v,n) => v + c[k].find(x=>x[0]===n)[1],0),0);
    const food = (tier[1]+extras+upgrades)*guests;
    const staff = style.staff*guests;
    const drop = s.style === 'Drop-Off';
    const chafers = drop ? Math.max(25,1.29*guests) : 0;
    const setup = drop ? 1.2*guests : 0;
    const subtotal = food+staff+chafers+setup;
    const service = drop ? 0 : subtotal*.24;
    const tax = (subtotal+service)*.07;
    return {tier:tier[0],includedMains:tier[2],includedSides:tier[3],food:round(food),staff:round(staff),chafers:round(chafers),setup:round(setup),subtotal:round(subtotal),service:round(service),tax:round(tax),total:round(subtotal+service+tax),perGuest:round((subtotal+service+tax)/guests)};
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
  return { estimate, validate, escape, submit };
})();
