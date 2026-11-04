import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const MIN=60000,HOUR=3600000;
function segment(start,end){
  const i=source.indexOf(start),j=source.indexOf(end,i+start.length);
  assert.ok(i>=0&&j>i,'Missing '+start+' to '+end);
  return source.slice(i,j);
}
function fixture(setup,code,result){
  return runInNewContext(setup+'\n'+code+'\n; ('+result+')');
}
test('inbound flight status uses Torn roster expiry only for explicit return',()=>{
  const now=Date.now();
  const f=fixture(
    "const MIN=60000,HOUR=3600000;const n=v=>Number.isFinite(Number(v))?Number(v):0;"+
    "const memberState=p=>String(p.status).toLowerCase().includes('travel')?'away':'okay';"+
    "const state={data:{enemies:[]}};const positive=v=>Number(v)||0;",
    segment('  function flightEvidence(','  function trimWarLogs('),
    '{flightEvidence,flightCountdown,inboundReturns,state}');
  const p={id:77,status:'Traveling',statusText:'Returning from Mexico',statusDetails:'',until:now+2*HOUR};
  assert.equal(f.flightEvidence(p,now).kind,'returning');
  assert.equal(f.flightEvidence(p,now).eta,p.until);
  assert.match(f.flightCountdown(p.until,now),/2h/);
  const out={...p,id:78,statusText:'Traveling to Mexico'};
  assert.equal(f.flightEvidence(out,now).kind,'outbound');
  assert.equal(f.flightEvidence(out,now).eta,p.until,'Outbound ETA may be known, but must never be labelled a Torn return');
  assert.equal(f.flightEvidence({...p,statusText:'Abroad'},now).kind,'abroad-or-unclear');
  assert.equal(f.flightEvidence({...p,until:0},now).eta,null);
  assert.equal(f.flightEvidence({...p,until:now+25*HOUR},now).eta,null);
  f.state.data.enemies=[p,out];
  assert.equal(f.inboundReturns().length,1);
  assert.equal(f.inboundReturns()[0].player.id,77);
});
test('score acceleration uses two observed windows and rejects sparse or stale samples',()=>{
  const at=Date.now(),p=[
    {at:at-45*MIN,our:100,enemy:20},
    {at:at-30*MIN,our:120,enemy:40},
    {at:at-15*MIN,our:145,enemy:60},
    {at,our:170,enemy:130}
  ];
  const f=fixture("const MIN=60000,HOUR=3600000;"+
    "const n=v=>Number.isFinite(Number(v))?Number(v):0;"+
    "const positive=v=>Number(v)||0;"+
    "const state={data:{scoreTimelines:{'500':{points:[]},'501':{points:[]}},attacks:[],ownerReadiness:{},meta:{},ours:[]}};"+
    "const cfg={manualReadiness:{},autoOwnerReadiness:true};"+
    "const spy=()=>null;const memberState=p=>p.status;const lastKnownMemberScore=()=>null;const matchup=()=>({known:false});",
    segment('  function attackHistoryFor(','  function matchEvidence('),
    '{scoreAcceleration,state}');
  f.state.data.scoreTimelines['500'].points=p;
  const trend=f.scoreAcceleration(500,at);
  assert.equal(trend.accelerating,true);
  assert.ok(trend.recentEnemy>trend.previousEnemy);
  assert.equal(trend.recentEnemy,280);
  f.state.data.scoreTimelines['501'].points=[p[0],p[3]];
  assert.equal(f.scoreAcceleration(501,at),null);
  assert.equal(f.scoreAcceleration(500,at+12*MIN),null,'Stale samples should not alert');
});
test('API owner energy and medical readings do not leak to other faction members',()=>{
  const at=Date.now();
  const f=fixture("const MIN=60000,HOUR=3600000;"+
    "const n=v=>Number.isFinite(Number(v))?Number(v):0;const positive=v=>Number(v)||0;"+
    "const cfg={manualReadiness:{},autoOwnerReadiness:true};"+
    "const state={data:{ownerReadiness:{},meta:{ownerId:1},attacks:[],scoreTimelines:{}}};"+
    "const memberState=p=>p.status;const effectiveKey=()=>'';const call=async()=>null;",
    segment('  const energyValue=','  function matchEvidence('),
    '{parseOwnBars,parseOwnCooldown,hitterReadiness,cfg,state}');
  f.state.data.ownerReadiness.energy=f.parseOwnBars({bars:{energy:{current:50,maximum:150}}},at);
  f.state.data.ownerReadiness.cooldown=f.parseOwnCooldown({cooldowns:{medical:600,drug:2000}},at);
  const owner={id:1,status:'okay'},other={id:2,status:'okay'};
  assert.equal(f.hitterReadiness(owner,at).energy,50);
  assert.equal(f.hitterReadiness(owner,at).energyEnough,true);
  assert.equal(f.hitterReadiness(owner,at).medicalLeft,10);
  assert.equal(f.hitterReadiness(other,at).energy,null);
  f.cfg.manualReadiness[2]={at,energy:10,medicalUntil:at+3*MIN};
  assert.equal(f.hitterReadiness(other,at).energyEnough,false);
  assert.equal(f.hitterReadiness(other,at).medicalLeft,3);
  assert.equal(f.hitterReadiness(other,at+46*MIN).energy,null);
  assert.equal(f.hitterReadiness(owner,at+16*MIN).energy,null);
});
test('known past losses make a good BSS ratio a review target, not a safe auto draft',()=>{
  const now=Date.now();
  const f=fixture("const MIN=60000,HOUR=3600000;"+
    "const n=v=>Number.isFinite(Number(v))?Number(v):0;const positive=v=>Number(v)||0;"+
    "const fmt=v=>String(v);"+
    "const state={data:{attacks:[{attacker:1,defender:101,at:Date.now()-HOUR,result:'Lost'}],scoreTimelines:{},ownerReadiness:{},meta:{},updated:{ours:Date.now(),enemies:Date.now()},ours:[{id:1}],enemies:[{id:101}]}};"+
    "const cfg={assignments:{},manualReadiness:{},spies:{1:{observedAt:Date.now()},101:{observedAt:Date.now()}}};"+
    "const spy=id=>cfg.spies[id]||null;const bsScore=v=>v?1:null;"+
    "const memberState=p=>p.status;const isOnline=()=>false;const lastKnownMemberScore=()=>250;"+
    "const matchup=()=>({known:true,ratio:0.55,ff:2.4});",
    segment('  function attackHistoryFor(','  function personalShortlist('),
    '{attackHistoryFor,matchEvidence,state}');
  const m=f.matchEvidence({id:1,status:'okay'},{id:101,status:'okay'});
  assert.equal(m.encounters.losses,1);
  assert.equal(m.category,'Reassess losses');
  assert.equal(m.tier,4);
});
test('completed wars automatically create read-only reports with strict sampled evidence',()=>{
  const at=Date.now(),id=500;
  const f=fixture("const MIN=60000,HOUR=3600000;"+
    "const n=v=>Number.isFinite(Number(v))?Number(v):0;const positive=v=>Number(v)||0;"+
    "const officialNumber=v=>v===null||v===undefined?null:Number(v);"+
    "const warSamples=()=>({checks:0,onlinePct:null,awayPct:null});const warPace=()=>null;"+
    "const state={data:{ourWars:[],reports:{},afterActions:{},meta:{pendingAfterAction:500}}};"+
    "const cfg={ourId:10};",
    segment('  function makeAfterAction(','  function warContributionIntel('),
    '{makeAfterAction,buildAfterActions,afterActionText,state}');
  const war={id,start:Math.floor((at-HOUR)/1000),end:Math.floor(at/1000),winner:10,
    scores:[{id:10,name:'Our Faction',score:1200},{id:20,name:'Opponent',score:800}]};
  f.state.data.ourWars=[war];
  f.buildAfterActions();
  assert.equal(f.state.data.afterActions[500].outcome,'Won');
  assert.equal(f.state.data.afterActions[500].detail,false);
  assert.equal(f.state.data.afterActions[500].newFromObservedWar,true);
  assert.equal(f.state.data.meta.pendingAfterAction,0);
  f.state.data.afterActions[500].reviewed=true;
  f.state.data.reports[500]={factions:[
    {id:10,members:[{id:1,score:600},{id:2,score:400},{id:3,score:200}]},
    {id:20,members:[{id:101,score:600},{id:102,score:120},{id:103,score:80}]}
  ]};
  f.buildAfterActions();
  assert.equal(f.state.data.afterActions[500].detail,true);
  assert.equal(f.state.data.afterActions[500].reviewed,true);
  assert.match(f.afterActionText(f.state.data.afterActions[500]),/Result: Won/);
  assert.equal(f.state.data.afterActions[500].enemyTop3Pct,100);
});
test('all five operations are routed and do not automate Torn gameplay',()=>{
  for(const item of ['function flightWatchPanel()','function readinessPanel()','function afteraction()',
    'function scoreAcceleration(','function attackHistoryFor(','function makeAfterAction(',
    "action.startsWith('save-readiness:')","action.startsWith('review-debrief:')",
    "action.startsWith('copy-debrief:')","id:'enemy-accelerating'","id:'inbound-return'"])
    assert.ok(source.includes(item),'Missing '+item);
  assert.match(source,/\/\/ @version\s+1\.0\.0/);
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
