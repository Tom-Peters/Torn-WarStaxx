import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function extract(from,to){
  const i=source.indexOf(from),j=source.indexOf(to,i+from.length);
  assert.ok(i>=0&&j>i,'Function bounds missing: '+from+' -> '+to);
  return source.slice(i,j);
}
function scoreFixture(){
  const setup=[
    'const MIN=60000,HOUR=3600000;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
    "const officialNumber=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):null;",
    "const cfg={ourId:10,enemyId:20};",
    'const state={data:{war:null,scoreTimelines:{},warTimelines:{}}};',
    "const memberState=p=>String(p.status||'unknown').toLowerCase();",
    "const isOnline=p=>Boolean(p.online);"
  ].join('\n');
  return runInNewContext(setup+extract('  function trimWarLogs(){','  function snapshot(')+
    '; ({cfg,state,recordWarScore,warPace,recordWarObservation,warSamples,trimWarLogs})');
}
function targetFixture(){
  const setup=[
    'const MIN=60000,HOUR=3600000;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
    'const fmt=v=>String(v);',
    "const cfg={ourId:10,enemyId:20,assignments:{},hitterRisk:{},blackSkulls:{1:true,2:true},planStatus:{},watchlist:{},spies:{1:{known:true,bss:900,observedAt:Date.now()},2:{known:true,bss:800,observedAt:Date.now()},101:{known:true,bss:300,observedAt:Date.now()},103:{known:true,bss:200,observedAt:Date.now()}}};",
    "const state={data:{war:{id:500},updated:{ours:Date.now(),enemies:Date.now()},ours:[{id:1,name:'A',status:'okay',online:true},{id:2,name:'B',status:'okay',online:true}],enemies:[{id:101,name:'Known',status:'okay',ratio:0.65,online:true},{id:102,name:'Estimate',status:'okay',ratio:0.55,online:false},{id:103,name:'Hospital',status:'hospital',ratio:0.2,online:false},{id:104,name:'Unknown',status:'okay',ratio:null,online:false},{id:105,name:'Risky',status:'okay',ratio:1.4,online:true}]}};",
    "const spy=id=>cfg.spies[id]||null;",
    'const bsScore=spy=>spy?.bss??null;',
    'const ffscouter=id=>({bss:({102:120,104:90,105:50})[id]||null});',
    'const ffIsStale=()=>false;',
    'const concessionSnapshot=()=>null;',
    "const memberState=p=>String(p.status||'unknown').toLowerCase();",
    'const isOnline=p=>Boolean(p.online);',
    'const lastKnownMemberScore=(side,id)=>id===101?800:100;',
    'const attackHistoryFor=()=>({wins:0,losses:0,unknown:0,total:0,last:0});',
    'const hitterReadiness=()=>({energyEnough:null});',
    'const hitterRisk=()=>({mode:"balanced",maxRatio:.70,minWins:0});',
    "const matchup=(friend,enemy)=>enemy.ratio===null?{known:false,ratio:null,ff:null}:{known:true,ratio:enemy.ratio,ff:2.2,exact:[101,103].includes(enemy.id),confidence:'model'};"
  ].join('\n');
  return runInNewContext(setup+extract('  function rosterFresh(','  function assignments(){')+
    '; ({cfg,state,matchEvidence,personalShortlist,hitterPlanKey,hitterPlanStatus,leadershipSummary,suggestedDraft})');
}
test('official war score snapshots produce true observed point rates',()=>{
  const f=scoreFixture(),t=1730000000000;
  const war={id:500,opponentId:20,start:1729995000,factions:[{id:10,score:100},{id:20,score:80}]};
  assert.equal(f.recordWarScore(war,t),true);
  war.factions[0].score=110;
  assert.equal(f.recordWarScore(war,t+10000),false,'Too-close samples must not exaggerate rate');
  war.factions[0].score=120;war.factions[1].score=110;
  assert.equal(f.recordWarScore(war,t+12*60000),true);
  const p=f.warPace(500);
  assert.equal(p.samples,2);
  assert.equal(p.rateOur,100);
  assert.equal(p.rateEnemy,150);
  assert.equal(p.netRate,-50);
  assert.equal(p.gap,10);
  assert.equal(p.confidence,'Early');
  assert.equal(f.warPace(999),null);
});
test('score samples stay separated across wars and preserve zero-rate intervals',()=>{
  const f=scoreFixture(),t=1730000000000;
  const war={id:500,opponentId:20,start:1729995000,factions:[{id:10,score:0},{id:20,score:0}]};
  f.recordWarScore(war,t);assert.equal(f.recordWarScore(war,t+2*60000),false);
  f.recordWarScore(war,t+6*60000);
  assert.equal(f.warPace(500).rateOur,0);
  assert.equal(f.warPace(500).rateEnemy,0);
  f.recordWarScore({...war,id:501},t+12*60000);
  assert.equal(f.warPace(501).samples,1);
  assert.equal(f.warPace(500).samples,2);
});
test('per-war activity retains online, travel and hospital only when observed',()=>{
  const f=scoreFixture(),t=1730000000000;
  f.state.data.war={id:700,opponentId:20,opponentName:'Enemy',start:1729995000};
  const a=[{id:1,name:'One',status:'okay',online:true},{id:2,name:'Away',status:'away',online:false},{id:3,name:'Hosp',status:'hospital',online:false}];
  assert.equal(f.recordWarObservation('enemies',a,t),true);
  const r=f.warSamples(700,'enemies');
  assert.equal(r.checks,1);assert.equal(r.samples,3);
  assert.equal(r.online,1);assert.equal(r.away,1);assert.equal(r.hospital,1);
  assert.equal(r.onlinePct,33);assert.equal(r.awayPct,33);
  assert.equal(f.warSamples(700,'ours').onlinePct,null);
  f.state.data.war={id:701,opponentId:20,start:1730001000};
  assert.equal(f.recordWarObservation('enemies',a.slice(0,1),t+3600000),true);
  assert.equal(f.warSamples(701,'enemies').samples,1);
  assert.equal(f.warSamples(700,'enemies').samples,3);
  f.state.data.war=null;
  assert.equal(f.recordWarObservation('enemies',a,t+7200000),false);
});
test('per-hitter shortlist separates confirmed, estimates, unknown, danger and unavailable',()=>{
  const f=targetFixture(),friend=f.state.data.ours[0];
  const items=f.personalShortlist(friend,10),byId=id=>items.find(x=>x.enemy.id===id);
  assert.equal(byId(101).category,'Strong candidate');
  assert.equal(byId(101).tier,0);
  assert.equal(byId(102).category,'Estimate only');
  assert.equal(byId(102).tier,2);
  assert.equal(byId(104).category,'Scout');
  assert.equal(byId(103).category,'Unavailable');
  assert.equal(byId(105).category,'Avoid');
  assert.equal(items[0].enemy.id,101);
  assert.equal(byId(104).ffForHitter,null);
});
test('drafting Black Skulls targets skips unknowns and never overrides or double-books',()=>{
  const f=targetFixture();
  const suggestions=f.suggestedDraft();
  assert.equal(suggestions.length,1,'Only one verified available target');
  assert.equal(suggestions[0].enemy.id,101);
  f.cfg.assignments[1]=101;
  assert.equal(f.suggestedDraft().length,0);
});
test('leadership duties stay local to each war and duplicate manual targets are flagged',()=>{
  const f=targetFixture();
  assert.equal(f.hitterPlanKey(1),'war:500:member:1');
  f.cfg.planStatus['war:500:member:1']='engaged';
  assert.equal(f.hitterPlanStatus(1),'engaged');
  f.state.data.war.id=501;
  assert.equal(f.hitterPlanStatus(1),'not-set');
  f.cfg.assignments[1]=101;f.cfg.assignments[2]=101;
  const summary=f.leadershipSummary();
  assert.equal(summary.manual,2);
  assert.equal(summary.skulls,2);
  assert.equal(summary.duplicateTargets.length,1);
  assert.equal(summary.duplicateTargets[0].id,101);
});
test('new modules and manual-only leadership actions are exposed to the TornStaxx hub',()=>{
  for(const tab of ['command','pace','timeline','matchups'])
    assert.ok(source.includes("'"+tab+"':")||source.includes(tab+':')||source.includes('function '+tab+'('),'Missing '+tab);
  for(const needle of ['function pace(){','function timeline(){','function command(){',
    "action==='copy-leader-brief'","action==='draft-black'","action==='save-leader-note'",
    'data-leader-target','data-leader-duty','data-label="Our hitter"','recordWarScore(w)',
    'recordWarObservation(side,players)','function memberWarTimeline('])
    assert.ok(source.includes(needle),'Missing connection '+needle);
  assert.ok(source.includes('No automatic gameplay')||source.includes('never executes attacks')||
    source.includes('no Torn action performed'));
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
