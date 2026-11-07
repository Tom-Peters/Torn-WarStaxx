import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing source region: '+start);
  return source.slice(a,b);
}
const routeCode=region('  function warStripPageMode(){','  function handleWarScroll(e){');
function mode(url,scope='contextual',faction=false,intent=''){
  const parsed=new URL(url);
  return runInNewContext(routeCode+';warStripPageMode()',{
    location:{pathname:parsed.pathname,search:parsed.search,hash:parsed.hash},
    URLSearchParams,cfg:{warStripScope:scope},
    factionRoute:()=>faction,itemIntent:()=>intent
  });
}
test('attack routes suppress the banner for all modes while faction/item routes retain full controls',()=>{
  for(const scope of ['contextual','faction','everywhere']){
    assert.equal(mode('https://www.torn.com/loader.php?sid=attack&user2ID=123',scope),'hidden');
    assert.equal(mode('https://www.torn.com/attack.php?user2ID=123',scope),'hidden');
    assert.equal(mode('https://www.torn.com/factions.php',scope,true),'full');
    assert.equal(mode('https://www.torn.com/item.php',scope,false,'heal'),'full');
  }
  assert.equal(mode('https://www.torn.com/index.php'),'mini');
  assert.equal(mode('https://www.torn.com/index.php','faction'),'hidden');
  assert.equal(mode('https://www.torn.com/index.php','everywhere'),'full');
});
test('render guard removes the attack bar before mounting it and leaves the hub separate',()=>{
  const render=region('  function renderWarStrip(force=false){','  function confirmed(message){');
  assert.match(render,/if\(mode==='hidden'\|\|\(mode==='mini'&&!activeWarNow\(\)\)\)\{bar\?\.remove\(\);return;\}/);
  assert.match(render,/classList\.toggle\('wsw-mini',mode==='mini'\)/);
  assert.match(source,/const warRouteTimer=setInterval/);
  assert.match(source,/clearInterval\(warRouteTimer\)/);
  assert.doesNotThrow(()=>new Script(source));
});
test('hospital expiry countdown is sourced, precise and never assumes a release',()=>{
  const body=region('  // Times are read-only countdowns','  function targetRows(){');
  const helpers=runInNewContext(body+';({hospitalCountdown,availabilitySortKey})',{
    Date,MIN:60000,positive:x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0,
    memberState:p=>p.status.toLowerCase()==='hospital'?'hospital':
      p.status.toLowerCase()==='okay'?'okay':
      p.status.toLowerCase()==='away'?'away':'unknown',
    flightEvidence:p=>({kind:p.returning?'returning':'outbound',eta:p.until||null})
  });
  const now=1_000_000;
  assert.equal(helpers.hospitalCountdown(now+90_000,now),'1m 30s');
  assert.equal(helpers.hospitalCountdown(now+3_690_000,now),'1h 01m 30s');
  assert.match(helpers.hospitalCountdown(now-1,now),/Due now - refresh/);
  assert.match(helpers.hospitalCountdown(0,now),/unknown/);
  assert.equal(helpers.availabilitySortKey({status:'Okay'})[0],0);
  assert.equal(helpers.availabilitySortKey({status:'Hospital',until:now+60_000})[0],1);
  assert.equal(helpers.availabilitySortKey({status:'Away',returning:true,until:now+60_000})[0],2);
});
test('roster improvements are local/read-only and do not call the third-party community sharing server',()=>{
  assert.match(source,/\['availability','Availability: Okay first'\]/);
  assert.match(source,/\['hospital','Hospital release soonest'\]/);
  assert.match(source,/data-ws-hospital-until/);
  assert.match(source,/action\.startsWith\('copy-player:'\)/);
  assert.match(source,/hospitalClockTimer=setInterval/);
  assert.doesNotMatch(source,/twse\.dev|Torn War Stuff Enhanced\.user\.js/);
});
