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
test('only treats an explicit webhook success as receipt',async()=>{
  assert.equal(typeof core.submit,'function');
  const ok=async()=>({ok:true,json:async()=>({status:'success'})});
  await core.submit(ok,'test-url',new URLSearchParams({name:'test'}));
  for(const response of [{ok:false,json:async()=>({status:'success'})},{ok:true,json:async()=>({status:'error'})},{ok:true,json:async()=>({})},{ok:true,json:async()=>{throw Error('invalid JSON');}}]){
    await assert.rejects(()=>core.submit(async()=>response,'test-url',''));
  }
  await assert.rejects(()=>core.submit(async()=>{throw Error('offline');},'test-url',''));
});
