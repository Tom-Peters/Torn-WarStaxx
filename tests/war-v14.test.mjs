import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function part(a,b){
 const from=source.indexOf(a),to=source.indexOf(b,from+a.length);
 assert.ok(from>=0&&to>from,'Missing source region '+a+' -> '+b);
 return source.slice(from,to);
}
function fixture(setup,a,b,out){return runInNewContext(setup+'\n'+part(a,b)+';\n'+out);}
test('heavy target priority combines known BSS, last official member war points and partial live scoring',()=>{
 const setup=[
   'const n=v=>Number.isFinite(Number(v))?Number(v):0,positive=Number,officialNumber=v=>v===null||v===undefined?null:Number(v);',
   "const cfg={enemyId:20};",
   "const state={data:{reports:{50:{factions:[{id:20,members:["+
     "{id:101,score:200,attacks:12},{id:102,score:2000,attacks:90}]}]}}}};",
   'const warHitLedger=()=>({theirs:{players:{102:{respect:200,scoringHits:10}}}});',
   'const latestFinished=()=>({id:50});'
 ].join('\n');
 const f=fixture(setup,'  function heavyTargetPriorities(','  function blackSkullsCoverage(',
   '({heavyTargetPriorities})');
 const bands={heavy:new Set([101,102,103]),ranked:[
   {enemy:{id:101},value:800},{enemy:{id:102},value:600},{enemy:{id:103},value:400}]};
 const scores=f.heavyTargetPriorities(bands);
 assert.ok(scores.get(102).score>scores.get(101).score,
   'A historically prolific hitter may be prioritised ahead of a stronger idle target');
 assert.equal(scores.get(102).historyPoints,2000);
 assert.equal(scores.get(101).historyWarId,50);
 assert.equal(scores.get(103).historyPoints,null,'Missing official history is unknown');
 assert.equal(scores.get(103).confidence,'BSS-only priority');
});
test('unavailable Black Skull receives an evidence-gated FREE replacement suggestion, not a silent order change',()=>{
 const setup=[
  'const n=Number,positive=Number;',
  "const cfg={blackSkulls:{10:true,11:true},assignments:{10:101}};",
  "const state={data:{ours:[{id:10,name:'Old',status:'hospital'},{id:11,name:'New',status:'okay'}],"+
    "enemies:[{id:101,name:'High',status:'okay'}]}};",
  'const rosterFresh=()=>true,memberState=p=>p.status.toLowerCase();',
  "const enemyRoleBands=()=>({heavy:new Set([101]),ranked:[{enemy:{id:101,name:'High',status:'okay'},value:800,source:'manual'}],known:1,unknown:0,rule:{mode:'percent',percent:100,minBss:0}});",
  'const heavyTargetPriorities=()=>new Map([[101,{score:75,historyPoints:200}]]);',
  "const roleMatch=(p,e)=>p.status==='okay'?{match:{ratio:.4},score:80}:null;",
  'const hitterReadiness=()=>({energyEnough:true});',
  'const enemyBattleEstimate=p=>({value:800,source:"manual"});'
 ].join('\n');
 const f=fixture(setup,'  function blackSkullsCoverage(','  function blackSkullsCoverageCard(',
   '({blackSkullsCoverage,cfg,state})');
 const first=f.blackSkullsCoverage().targets[0];
 assert.equal(first.covered,true);
 assert.equal(first.blocked,true);
 assert.equal(first.replacement.player.id,11);
 assert.equal(f.cfg.assignments[10],101,'Suggestion must not alter the current assignment');
 assert.equal(f.cfg.assignments[11],undefined);
 f.state.data.ours[1].status='hospital';
 assert.equal(f.blackSkullsCoverage().targets[0].replacement,null);
});
test('Skull Capo chat briefing contains actionable squad orders but never posts or leaks API keys',()=>{
 const setup=[
  'const n=Number,positive=Number,fmt=v=>String(v);',
  "const cfg={key:'PRIVATE-API-KEY',ffKey:'PRIVATE-FF-KEY',enemyId:20,assignments:{10:101}};",
  "const state={data:{war:{id:9,opponentName:'Opponents'},ours:[],"+
    "enemies:[{id:101,name:'BigTarget'}]}};",
  'const warScore=()=>({our:100,enemy:90,net:10}),chainStatus=()=>({fresh:true,count:50,remaining:70});',
  'const rosterFresh=()=>true,memberState=p=>p.status;',
  'const hitterReadiness=()=>({energy:null});',
  "const blackSkullsCoverage=()=>({skulls:[{id:10,name:'Alpha',status:'okay'}],"+
   "bands:{rule:{mode:'percent',percent:40,minBss:0}},"+
   "assigned:1,targets:[{enemy:{id:101,name:'BigTarget'},bss:800,assigned:[{id:10,name:'Alpha'}],"+
    "needsAssignment:false,blocked:false,priority:{score:80,historyPoints:150}}],verifiedAssigned:1});"
 ].join('\n');
 const f=fixture(setup,'  function skullChatBrief(){','  function copiedWarOrders(){',
    '({skullChatBrief})');
 const msg=f.skullChatBrief();
 assert.match(msg,/BLACK SKULLS \| SKULL CAPO/);
 assert.match(msg,/Alpha/);assert.match(msg,/BigTarget/);
 assert.match(msg,/Score 100-90/);
 assert.doesNotMatch(msg,/PRIVATE-/);
 assert.match(msg,/Paste|manual attack|manual actions/i);
 assert.ok(msg.length<=3200);
});
test('observed hospital/travel transitions are captured for high-BSS targets without watchlist or scoring history',()=>{
 const setup=[
   'const n=Number,positive=Number;',
   'const cfg={assignments:{}};',
   'const state={data:{enemies:[]}};',
   'const memberState=p=>p.status.toLowerCase();',
   'const watchedTargetIds=()=>new Set(),enemyThreatRows=()=>[];',
   'const enemyRoleBands=()=>({heavy:new Set([101,102])});'
 ].join('\n');
 const f=fixture(setup,'  function availabilityTransitions(','  function recordAvailability(',
   '({availabilityTransitions})');
 const before=[{id:101,name:'H',status:'hospital'},{id:102,name:'A',status:'away'},{id:103,name:'C',status:'okay'}];
 const after=[{id:101,name:'H',status:'okay'},{id:102,name:'A',status:'okay'},{id:103,name:'C',status:'okay'}];
 const x=f.availabilityTransitions(before,after,99,123);
 assert.equal(x.length,2);
 assert.equal(x[0].previous,'hospital');
 assert.equal(x[1].previous,'away');
 assert.ok(x.every(z=>z.kind==='Black Skulls heavy target'));
 assert.match(source,/skull-heavy-return-/);
 assert.match(source,/priority:97,tab:'leader'/);
});
test('new attack-BSS snapshots use near-time evidence and avoid retroactively reconstructing old wars',()=>{
 const setup=[
  'const HOUR=3600000,n=Number,positive=Number,officialNumber=v=>v===null||v===undefined?null:Number(v);',
  'const activeWarNow=()=>true,rosterFresh=()=>true;',
  "const state={data:{war:{id:55},ours:[{id:10}],enemies:[{id:100}],attackBssSnapshots:{}}};",
  'const enemyBattleEstimate=()=>({value:600,source:"Recent manual battle-stat spy"});',
  'const now=Date.now(),warAttackRows=()=>['+
    '{id:1,side:"ours",attacker:10,defender:100,respect:12,at:now-1000},'+
    '{id:2,side:"ours",attacker:10,defender:100,respect:10,at:now-7*HOUR}];'
 ].join('\n');
 const f=fixture(setup,'  function captureAttackBssObservations(','  function normalizedSimilarHit(',
   '({captureAttackBssObservations,state})');
 assert.equal(f.captureAttackBssObservations(),1);
 assert.equal(f.captureAttackBssObservations(),0,'Never overwrite the initial estimate with later BSS');
 assert.equal(f.state.data.attackBssSnapshots[1].targetBss,600);
 assert.equal(f.state.data.attackBssSnapshots[2],undefined,'Stale historical attacks get no invented BSS');
});
test('similar-strength cohort compares same hitter across two previous wars and rejects wildly different targets',()=>{
 const at=Date.now(),build=(id,warId,bss,respect,bonus=false)=>({
  id,hitterId:10,targetId:id+100,warId,targetBss:bss,respect,attackAt:at-1000,
  observedAt:at,source:'Recent spy',specialBonus:bonus,
  modifierWar:2,modifierGroup:1,modifierRetaliation:1,modifierOverseas:1,chain:5,chainBonus:1
 });
 const samples=[
  build(1,30,500,5),build(2,30,520,5),build(3,30,480,5),build(4,30,510,5),
  build(5,28,500,12),build(6,28,510,12),build(7,28,490,12),
  build(8,29,510,10),build(9,29,500,10),build(10,29,480,10),
  build(11,27,5000,1000),build(12,28,505,999,true)
 ];
 const db=Object.fromEntries(samples.map(x=>[x.id,x]));
 const setup=[
  'const HOUR=3600000,n=Number,positive=Number;',
  'const chainMilestones=[10,25,50,100];',
  'const state={data:{attackBssSnapshots:'+JSON.stringify(db)+','+
    'ourWars:[{id:27,end:100},{id:28,end:200},{id:29,end:300}]}};'
 ].join('\n');
 const f=fixture(setup,'  function normalizedSimilarHit(','  function ownHistoricalEfficiency(',
   '({similarStrengthPerformance})');
 const result=f.similarStrengthPerformance(10,30);
 assert.equal(result.currentSamples,4);
 assert.equal(result.historicalSamples,6);
 assert.equal(result.priorWars,2);
 assert.equal(result.flag,true);
 assert.ok(result.ratio<.7);
 assert.ok(result.referenceBss>=480&&result.referenceBss<=520);
 assert.equal(result.metric,'Chain-normalised captured respect per recorded attack, not official war score');
 const unknown=f.similarStrengthPerformance(99,30);
 assert.equal(unknown.flag,false);
 assert.equal(unknown.actual,null);
});
test('new interface is wired without automatic attack or chat post',()=>{
 for(const marker of [
  "const ID='war', VER='2.6.0'",
  "function heavyTargetPriorities(",
  "function skullChatBrief(",
  "function captureAttackBssObservations(",
  "function similarStrengthPerformance(",
  "function comparableStrengthCard(",
  "'copy-skull-chat'",
  "'skull-replace:'",
  "action.startsWith('skull-replace:')",
  "blackSkullsCoverageCard(40)",
  "comparableStrengthCard(r.id)",
  "blackSkullsCoverage().targets.find(",
  "skull-heavy-return-",
  "const primary=['overview','enemy','reports']"
 ])assert.ok(source.includes(marker),'Missing v1.4 integration: '+marker);
 assert.doesNotThrow(()=>new Script(source));
 assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
