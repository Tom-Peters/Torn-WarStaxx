import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing code region '+start+' -> '+end);
  return source.slice(a,b);
}
function setup(){
  const stub=[
    'const positive=v=>Number(v)||0;',
    'const cfg={assignments:{7:100},blackSkulls:{7:true}};',
    'const state={data:{enemies:[{id:100,name:"My order",status:"Okay"},{id:200,name:"Bigger yield",status:"Okay"}],updated:{ours:Date.now(),enemies:Date.now()}}};',
    'let fresh=true,eligible=true,roleOkay=true,energy=75;',
    'const ourWarReadiness=()=>({id:7,player:{id:7,name:"Me",status:"Okay"},kind:"okay",energy});',
    'const candidate=id=>({player:state.data.enemies.find(p=>p.id===id),pointsPer25:id===200?100:40,source:"Verified local comparative spy",evidence:{reliability:"Favourable spies"}});',
    'const bestEfficiencyHit=()=>candidate(200);',
    'const efficiencyHits=()=>eligible?[candidate(200),candidate(100)]:[candidate(200)];',
    'const rosterFresh=()=>fresh;',
    'const memberState=p=>p.status.toLowerCase();',
    'const roleAllows=()=>roleOkay;',
    'const matchEvidence=()=>({reason:"Manual comparative evidence needs rechecking"});'
  ].join('\n');
  return runInNewContext(stub+'\n'+region('  function myMission(){','  function turtleWindow(at=Date.now()){')+
    ';({myMission,cfg,state,setFresh(x){fresh=x},setEligible(x){eligible=x},setRole(x){roleOkay=x},setEnergy(x){energy=x}})');
}
test('saved manual order outranks the highest points-per-energy alternative',()=>{
  const f=setup(),mission=f.myMission();
  assert.equal(mission.hasOrder,true);
  assert.equal(mission.assignedId,100);
  assert.equal(mission.target.player.id,100);
  assert.equal(mission.recommended.player.id,200);
});
test('unsafe assigned target is blocked and never swapped automatically',()=>{
  const f=setup();
  f.state.data.enemies[0].status='Hospital';
  const mission=f.myMission();
  assert.equal(mission.target,null);
  assert.equal(mission.recommended.player.id,200);
  assert.match(mission.issue,/hospital/i);
  assert.equal(f.cfg.assignments[7],100);
});
test('stale roster, wrong BSS bracket, missing spy evidence and low energy block saved orders',()=>{
  const f=setup();
  f.setFresh(false);
  assert.equal(f.myMission().target,null);
  assert.match(f.myMission().issue,/five minutes/);
  f.setFresh(true);f.setRole(false);
  assert.match(f.myMission().issue,/BSS bracket/);
  f.setRole(true);f.setEligible(false);
  assert.match(f.myMission().issue,/new matchup check/);
  f.setEligible(true);f.setEnergy(20);
  assert.equal(f.myMission().target,null);
  assert.match(f.myMission().issue,/below 25 E/);
});
test('without a saved order a verified suggestion may be shown as provisional',()=>{
  const f=setup();delete f.cfg.assignments[7];
  assert.equal(f.myMission().hasOrder,false);
  assert.equal(f.myMission().target.player.id,200);
});
test('live strip, healed-hit and main war screen reuse the mission-safe HIT handler',()=>{
  const quick=region('  function warQuick(action){','  async function verifyHealedThenHit(){');
  const strip=region('  function renderWarStrip(force=false){','  function statusNote(){');
  const live=region('  function liveWarRoom(){','  function overview(){');
  const heal=region('  async function verifyHealedThenHit(){','  function focusOpportunity(id){');
  assert.match(quick,/const mission=myMission\(\),target=mission.target;/);
  assert.match(quick,/if\(mission.hasOrder&&!target\)/);
  assert.match(quick,/Saved order blocked/);
  assert.match(strip,/mission\.hasOrder&&!target\?'REVIEW ORDER'/);
  assert.match(strip,/MY ORDER:/);
  assert.match(live,/missionPanel\(\)\+battleIntelCard\(\)\+commandPulse\(\)/);
  assert.match(heal,/warQuick\('hit'\)/);
  assert.match(source,/const primary=\['overview','enemy','reports'\]/);
});
test('high-BSS coverage gaps are prioritised; lower risk labels remain honest',()=>{
  const queue=region('  function operationalQueue(at=Date.now(),coverageOverride=null){','  function operationalBrief(at=Date.now()){');
  assert.match(queue,/heavy-unassigned/);
  assert.match(queue,/heavy-blocked/);
  assert.match(queue,/heavy-intel/);
  assert.match(source,/trendMetric:'Enemy Okay'/);
  assert.match(source,/\{label:'Enemy Okay',value:rosterFresh\('enemies'\)/);
});
test('distributed Torn PDA userscript is ASCII-only, parser safe and versioned',()=>{
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.match(source,/^\/\/ @version\s+1\.5\.5$/m);
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
});
