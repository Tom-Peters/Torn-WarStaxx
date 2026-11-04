import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const part=(start,end)=>{
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert.ok(from>=0&&to>from,'Missing section '+start+' through '+end);
  return source.slice(from,to);
};
function matchingFixture(){
  const setup=[
    'const MIN=60000,HOUR=3600000;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
    'const fmt=v=>String(v);',
    'const now=Date.now();',
    'const cfg={ourId:10,enemyId:20,assignments:{},watchlist:{},blackSkulls:{1:true,2:true},'+
      'spies:{1:{observedAt:now},2:{observedAt:now},101:{observedAt:now},102:{observedAt:now}},'+
      'manualReadiness:{},planStatus:{}};',
    "const state={data:{war:{id:500},ours:[{id:1,name:'Alpha',status:'okay'},"+
      "{id:2,name:'Bravo',status:'okay'}],enemies:[{id:101,name:'Target One',status:'okay',until:0},"+
      "{id:102,name:'Target Two',status:'okay',until:0}],updated:{ours:now,enemies:now},attacks:[]}};",
    'const spy=id=>cfg.spies[id]||null;',
    'const bsScore=p=>p?1:null;',
    "const memberState=p=>String(p.status||'unknown').toLowerCase();",
    'const isOnline=()=>false;',
    'const lastKnownMemberScore=()=>null;',
    'const attackHistoryFor=()=>({wins:0,losses:0,unknown:0,total:0,last:0});',
    'const hitterReadiness=()=>({energyEnough:null});',
    'const matchup=(friend,enemy)=>{const ratios={1:{101:0.35,102:0.45},2:{101:0.38,102:1.35}};'+
      "return {known:true,ratio:ratios[friend.id]?.[enemy.id],ff:2.5,confidence:'Two recent spies'};};"
  ].join('\n');
  return runInNewContext(setup+part('  function rosterFresh(','  function assignments(){')+
    '; ({cfg,state,rosterFresh,enemyHospitalExit,watchedTargetIds,matchEvidence,personalShortlist,suggestedDraft})');
}
test('collision-aware matching covers two hitters instead of greedy double-booking',()=>{
  const m=matchingFixture(),drafted=m.suggestedDraft();
  assert.equal(drafted.length,2);
  const byHitter=Object.fromEntries(drafted.map(x=>[x.friend.id,x.enemy.id]));
  assert.equal(byHitter[1],102);
  assert.equal(byHitter[2],101);
  assert.equal(new Set(drafted.map(x=>x.enemy.id)).size,2);
  assert.ok(drafted.every(x=>x.category==='Strong candidate'));
});
test('manual assignments are never overwritten, and taken targets cannot be double booked',()=>{
  const m=matchingFixture();
  m.cfg.assignments[1]=101;
  assert.equal(m.suggestedDraft().length,0);
  assert.equal(m.cfg.assignments[1],101);
  delete m.cfg.assignments[1];
  m.cfg.assignments[2]=101;
  assert.equal(m.suggestedDraft().length,1);
  assert.equal(m.suggestedDraft()[0].enemy.id,102);
});
test('stale Torn roster prevents strong recommendations and any auto-draft',()=>{
  const m=matchingFixture();
  m.state.data.updated.enemies=Date.now()-8*60000;
  assert.equal(m.rosterFresh('enemies'),false);
  assert.equal(m.matchEvidence(m.state.data.ours[0],m.state.data.enemies[0]).category,'Refresh roster');
  assert.equal(m.suggestedDraft().length,0);
});
test('hospital timers come from current observed enemy status only',()=>{
  const m=matchingFixture(),now=Date.now(),p=m.state.data.enemies[0];
  p.status='hospital';p.until=now+14*60000;
  assert.equal(m.enemyHospitalExit(p,now).minutes,14);
  assert.equal(m.enemyHospitalExit(p,now).fresh,true);
  assert.equal(m.enemyHospitalExit({...p,status:'okay'},now),null);
  assert.equal(m.enemyHospitalExit({...p,until:0},now),null);
  assert.equal(m.enemyHospitalExit({...p,until:now+5*3600000},now),null);
  m.cfg.watchlist[101]=true;
  assert.equal(m.watchedTargetIds().has(101),true);
  m.state.data.updated.enemies=now-10*60000;
  assert.equal(m.enemyHospitalExit(p,now).fresh,false);
});
test('unknown energy is not reported as verified and known low energy blocks draft',()=>{
  const m=matchingFixture();
  assert.equal(m.suggestedDraft().length,2);
  assert.match(source,/hitterReadiness\(p,at\)\.energyEnough!==false/);
  assert.match(source,/unknown energy/i);
});
test('Operations tab, manual controls and safe user-script installer remain wired',()=>{
  for(const fragment of ['function operationalQueue(','function operations(){',
    'function operationalBrief(',"action==='copy-ops'","id:'hospital-exit-watch'",
    "b('Operations queue','tab:operations')","b('What to do now','tab:operations')",
    "'operations','command'"]){
    assert.ok(source.includes(fragment),'Missing integration: '+fragment);
  }
  assert.match(source,/\/\/ @version\s+0\.7\.0/);
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotThrow(()=>new Script(source.replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"')));
});
