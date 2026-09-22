const { test } = require('node:test');
const assert = require('node:assert/strict');
require('./package-core.js');
require('./package-catalog.js');
const core = globalThis.PackageCore;
const catalog=globalThis.PackageCatalog;
test('package estimates follow command center tiers, staffing, service and tax', () => {
  assert.ok(core, 'PackageCore must exist');
  const c={styles:{Buffet:{staff:3,tiers:[['Mini',23.9,1,2],['Full',29.9,2,3],['Deluxe',35.9,3,3]]}},mains:[['Chicken',0],['Beef',0]],sides:[['Rice',0]],salads:[],apps:[],boards:[]};
  const e=core.estimate(c,{style:'Buffet',guests:100,mains:['Chicken','Beef'],sides:['Rice'],salads:[],apps:[],boards:[]});
  assert.equal(e.food,2990); assert.equal(e.staff,300); assert.equal(e.service,789.6); assert.equal(e.total,4365.17);
});
test('rejects catalog injection and invalid headcounts',()=>{
  assert.ok(core);
  const c={styles:{Buffet:{staff:3,tiers:[['Mini',23.9,1,2]]}},mains:[['Chicken',0]],sides:[],salads:[],apps:[],boards:[]};
  assert.throws(()=>core.estimate(c,{style:'Buffet',guests:-1,mains:['Chicken']}));
  assert.throws(()=>core.estimate(c,{style:'Buffet',guests:20,mains:['Forged dish']}));
});
test('validates date, full address, phone and callback permission',()=>{
  assert.ok(core);
  assert.ok(core.validate(0,{date:'2020-01-01',guests:20,event:'Birthday',time:'18:00'},'2026-09-21'));
  assert.ok(core.validate(2,{street:'',city:'Boston',state:'MA',zip:'02110'}));
  assert.ok(core.validate(3,{name:'A',email:'a@example.com',phone:'123',consent:false,callback:'Afternoon'}));
  assert.equal(core.validate(3,{name:'Andre',email:'a@example.com',phone:'9783811212',consent:true,callback:'Afternoon'}),'');
});
test('escapes customer content for email rendering',()=>{
  assert.ok(core); assert.equal(core.escape('<img src=x onerror="x">'),'&lt;img src=x onerror=&quot;x&quot;&gt;');
});
test('all service styles and tiers match default command center calculations',()=>{
  for(const style of Object.keys(catalog.styles))for(const count of [1,2,3,4]){
    const s={style,guests:50,mains:catalog.mains.slice(0,count).map(x=>x[0]),sides:[],salads:[],apps:[],boards:[]};
    const e=core.estimate(catalog,s), t=catalog.styles[style].tiers[Math.min(count-1,2)];
    assert.equal(e.food,(t[1]+Math.max(0,count-t[2])*6.5)*50);
    assert.equal(e.staff,catalog.styles[style].staff*50);
    assert.equal(e.chafers,style==='Drop-Off'?64.5:0);
    assert.equal(e.setup,style==='Drop-Off'?60:0);
  }
});
test('premiums, additional sides and salads, appetizers and platters are priced',()=>{
  const e=core.estimate(catalog,{style:'Buffet',guests:10,mains:['Salmon'],sides:['Rice — Mexican','Black Beans','Loaded Garlic Mashed Potato'],salads:['Garden Salad','Antipasto'],apps:['Bruschetta'],boards:['Fresh Fruit Platter']});
  assert.equal(e.food,436.5);
  assert.equal(core.estimate(catalog,{style:'Drop-Off',guests:1}).chafers,25);
});
test('validates each step and specific malformed contact cases',()=>{
  const good={event:'Birthday',date:'2026-12-20',time:'18:00',guests:50,mains:['Salmon'],sides:['Rice'],street:'123 Example St',city:'Boston',state:'MA',zip:'02110',name:'Test Guest',email:'guest@example.com',phone:'(978) 555-0123',callback:'Afternoon',consent:true};
  for(let i=0;i<5;i++)assert.equal(core.validate(i,good,'2026-09-21'),'');
  for(const patch of [{event:''},{date:'no'},{time:''},{guests:1.5},{guests:5001}])assert.ok(core.validate(0,{...good,...patch},'2026-09-21'));
  assert.ok(core.validate(1,{...good,mains:[]}));
  assert.ok(core.validate(1,{...good,sides:[]}));
  for(const patch of [{city:''},{state:'x'},{zip:'abc'}])assert.ok(core.validate(2,{...good,...patch}));
  for(const patch of [{name:''},{email:'a@b'},{phone:'abc1234567890'},{phone:'1234567890123456'},{callback:''},{consent:false}])assert.ok(core.validate(3,{...good,...patch}));
});
test('only treats an explicit receiver success as receipt and posts JSON objects',async()=>{
  assert.equal(typeof core.submit,'function');
  const ok=async()=>({ok:true,json:async()=>({status:'success'})});
  await core.submit(ok,'test-url',new URLSearchParams({name:'test'}));
  let request;
  await core.submit(async(url,options)=>{request={url,options};return {ok:true,json:async()=>({status:'success'})};},'command-center',{name:'test'});
  assert.equal(request.url,'command-center');
  assert.equal(request.options.headers['Content-Type'],'application/json');
  assert.deepEqual(JSON.parse(request.options.body),{name:'test'});
  for(const response of [{ok:false,json:async()=>({status:'success'})},{ok:true,json:async()=>({status:'error'})},{ok:true,json:async()=>({})},{ok:true,json:async()=>{throw Error('invalid JSON');}}]){
    await assert.rejects(()=>core.submit(async()=>response,'test-url',''));
  }
  await assert.rejects(()=>core.submit(async()=>{throw Error('offline');},'test-url',''));
});

test('renders the completed request as a Quote Maker style email instead of a plain-text note',()=>{
  const state={
    event:'Wedding',date:'2028-10-07',time:'17:30',guests:150,style:'Buffet',
    name:'Hiago Victor',email:'hiagovbf@gmail.com',phone:'7746159114',callback:'Morning',
    venue:'hacienda',street:'115 Blake Corner Rd',unit:'',city:'Phillipston',state:'MA',zip:'01331',
    mains:['Chicken Carbonara','Pasta Primavera','Eggplant Parmesan over Penne','Garlic Steak Medallions'],
    sides:['Rice — Plain','Garlic Mashed Potato','Vegetables'],salads:['Caesar Salad'],
    apps:['Bruschetta','Shrimp Cocktail','Mini Empanadas'],
    boards:['Cheese & Cracker Platter','Fresh Fruit Platter'],diet:'',access:'',notes:''
  };
  const estimate=core.estimate(catalog,state);
  const html=core.quoteEmailHTML(state,estimate,{estimateNo:'CMK-27854'});

  assert.equal(estimate.subtotal,10972.5);
  assert.equal(estimate.service,2633.4);
  assert.equal(estimate.tax,952.41);
  assert.equal(estimate.total,14558.31);
  assert.match(html,/Your Event Estimate/);
  assert.match(html,/Estimate #:\s*CMK-27854/);
  assert.match(html,/Hiago Victor/);
  assert.match(html,/Buffet Deluxe/);
  assert.match(html,/Extra proteins \(1 beyond Deluxe\)/);
  assert.match(html,/Premium protein upcharge/);
  assert.match(html,/Appetizers/);
  assert.match(html,/Boards &amp; Platters/);
  assert.match(html,/Food Service Subtotal/);
  assert.match(html,/Service, Fuel &amp; Admin \(24%\)/);
  assert.match(html,/MA Meals Tax \(7%\)/);
  assert.match(html,/EVENT TOTAL/);
  assert.match(html,/Example Payment Schedule/);
  assert.match(html,/20% Downpayment/);
  for(const amount of ['$10,972.50','$2,633.40','$952.41','$14,558.31','$2,911.66','$5,095.41','$4,367.49','$2,183.75'])assert.match(html,new RegExp(amount.replace(/[$,.]/g,'\\$&')));
  assert.match(html,/width="100%"[^>]+max-width:680px/);
  assert.match(html,/<td style="padding:4px"><table role="presentation" width="100%"/);
  assert.doesNotMatch(html,/width="680"/);
  assert.doesNotMatch(html,/<pre\b/i);
  assert.doesNotMatch(html,/Catering menu &amp; callback request/i);
});

test('quote email escapes customer content and exposes a stable email-only delivery contract',()=>{
  const state={
    event:'Wedding',date:'2028-10-07',time:'17:30',guests:10,style:'Buffet',
    name:'<img src=x onerror="boom">',email:'guest@example.com',phone:'9783811212',callback:'Afternoon',
    venue:'<script>alert(1)</script>',street:'1 Main St',unit:'',city:'Boston',state:'MA',zip:'02110',
    mains:['Chicken Carbonara'],sides:['Rice — Plain'],salads:[],apps:[],boards:[],diet:'',access:'',notes:''
  };
  const estimate=core.estimate(catalog,state);
  const quote=core.buildQuoteEmail(state,estimate,{requestId:'request-123',estimateNo:'CMK-12345'});

  assert.equal(quote.deliveryMode,'email_html');
  assert.equal(quote.createNote,false);
  assert.equal(quote.estimateNo,'CMK-12345');
  assert.match(quote.subject,/CMK-12345/);
  assert.match(quote.html,/&lt;img src=x onerror=&quot;boom&quot;&gt;/);
  assert.match(quote.html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(quote.html,/<script/i);
});
