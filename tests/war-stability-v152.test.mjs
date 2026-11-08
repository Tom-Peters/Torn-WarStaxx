import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Source region not found: '+start+' -> '+end);
  return source.slice(a,b);
}

test('all three Torn PDA version surfaces match 1.5.28 and script remains parser safe',()=>{
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.match(source,/^\/\/ @version\s+1\.5\.27$/m);
  assert.match(source,/const id='war', version='1\.5\.27'/);
  assert.match(source,/const ID='war', VER='1\.5\.27'/);
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
});

test('stale stored war ID cannot open live operations and rankings',()=>{
  const queue=region('  function operationalQueue(at=Date.now(),coverageOverride=null){',
    '  function operationalBrief(at=Date.now()){');
  assert.match(queue,/const active=activeWarNow\(\)/);
  assert.match(queue,/if\(active&&ownFresh&&enemyFresh\)/);
  const alerts=region('  function currentAlerts(){','  function event(name,detail){');
  assert.match(alerts,/const w=activeWarNow\(\)\?state\.data\.war:null/);
  assert.match(alerts,/score=w\?warScore\(\):null/);
});

test('hub signal, headline and pace respect confirmed active-war status',()=>{
  const publish=region('  function publish(){','  function ownFactionFrom(j,source){');
  assert.match(publish,/const liveWar=activeWarNow\(\)/);
  assert.match(publish,/headline:liveWar\?/);
  assert.match(publish,/active:liveWar,ourFactionId/);
  assert.match(publish,/label:liveWar\?/);
});

test('war summary is in page flow and never changes size on any scrolling',()=>{
  let rerenders=0;
  const document={body:{},documentElement:{},scrollingElement:{scrollTop:200}};
  const window={scrollY:350},state={stripScrolled:false,stripExpanded:true};
  const code=region('  function handleWarScroll(e){',
    '  function renderWarStrip(force=false){');
  const handler=runInNewContext(code+';handleWarScroll',{
    document,window,state,renderWarStrip:()=>{rerenders++;}
  });
  handler({target:{scrollTop:390,matches:()=>false,closest:()=>null}});
  handler({target:document});
  handler({target:document.scrollingElement});
  assert.equal(rerenders,0);
  assert.equal(state.stripScrolled,false);
  assert.equal(state.stripExpanded,true);
  assert.match(source,/warstaxx-live-strip\{position:static/);
  assert.doesNotMatch(code,/state\.stripScrolled=/);
});

test('assigned mission computes eligible targets once, without re-querying a second time',()=>{
  const mission=region('  function myMission(){','  function missionPanel(){');
  assert.equal((mission.match(/efficiencyHits\(/g)||[]).length,1);
  assert.match(mission,/options\.find\(hit=>hit\.player\.id===assignedId\)/);
  assert.match(mission,/recommended=options\[0\]\|\|null/);
  assert.match(mission,/if\(assignedId\)/);
});

test('Skull Capo brief passes precomputed coverage into operational queue',()=>{
  const pulse=region('  function commandPulse(){','  function turtleWindow(at=Date.now()){');
  assert.match(pulse,/squad=blackSkullsCoverage\(at\)/);
  assert.match(pulse,/operationalQueue\(at,squad\)/);
  const queue=region('  function operationalQueue(at=Date.now(),coverageOverride=null){',
    '  function operationalBrief(at=Date.now()){');
  assert.match(queue,/coverageOverride\|\|blackSkullsCoverage\(at\)/);
  const live=region('  function liveWarRoom(){','  function overview(){');
  assert.doesNotMatch(live,/target=bestEfficiencyHit\(\)/);
});

test('successful local actions are not displayed as warning errors',()=>{
  const state={error:'Prior error',notice:null,loading:false,
    data:{updated:{ours:Date.now(),enemies:Date.now()}}};
  const code=region('  function confirmed(message){','  function scoreSpark(p){');
  const f=runInNewContext(code+';({confirmed,statusNote})',{
    state,Date,n:x=>Number(x)||0,esc:String,age:()=> '0m',
    rosterFresh:()=>true,MIN:60000
  });
  f.confirmed('Order saved');
  assert.equal(state.error,'');
  assert.equal(state.notice.message,'Order saved');
  assert.match(f.statusNote(),/ws-success/);
  assert.doesNotMatch(f.statusNote(),/ws-warn/);
  state.error='Cannot assign';
  assert.match(f.statusNote(),/ws-warn/);
  assert.doesNotMatch(f.statusNote(),/ws-success/);
  state.error='';state.notice.at=Date.now()-40000;
  assert.doesNotMatch(f.statusNote(),/ws-success/);
});

test('small-screen report identifiers remain visible without altering leader cards',()=>{
  assert.match(source,/@media\(max-width:600px\).*ws-table-wrap/);
  assert.match(source,/table:not\(\.ws-leader-table\) td:first-child/);
  assert.match(source,/overscroll-behavior-x:contain/);
  assert.match(source,/@media\(pointer:coarse\)/);
});

test('existing actions remain manual and Torn API metadata is preserved',()=>{
  assert.match(source,/\/\/ @grant\s+GM_xmlhttpRequest/);
  assert.match(source,/\/\/ @connect\s+api\.torn\.com/);
  assert.match(source,/\/\/ @downloadURL\s+https:\/\/raw\.githubusercontent\.com\/Tom-Peters\/Torn-WarStaxx\/main\/WarStaxx\.user\.js/);
  assert.match(source,/location\.assign\(attackLink\(target\.player\.id\)\)/);
  assert.match(source,/The script does not use medical items/);
});
