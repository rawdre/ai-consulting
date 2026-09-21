const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.existsSync(__dirname + '/package-core.js') ? fs.readFileSync(__dirname + '/package-core.js', 'utf8') : '';
const context = { globalThis: {} }; vm.runInNewContext(code, context);
const core = context.globalThis.PackageCore;
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
