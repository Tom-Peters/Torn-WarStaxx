import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function extract(start,end){
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert.ok(from>=0&&to>from,'Missing source section: '+start+' to '+end);
  return source.slice(from,to);
}
function attacksFixture(){
  const setup=[
    'const MIN=60000,HOUR=3600000;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
    "const officialNumber=v=>v===null||v===undefined||v===''?null:Number(v);",
    'const validFF=v=>v===null||v===undefined||v===""?null:Number(v);',
    'const parseArray=value=>Array.isArray(value)?value:Object.entries(value||{}).map(([id,v])=>({id:Number(id),...v}));',
    'const unpack=(j,k)=>j?.[k]??j;',
    'const cfg={ourId:10,enemyId:20,blackSkulls:{1:true}};',
    'const now=Date.now();',
    "const state={data:{war:{id:500,start:Math.floor((now-3600000)/1000),opponentId:20},"+
      "ourWars:[],attacks:[],updated:{attacks:now},ours:[{id:1,name:'Skull'}],enemies:[{id:101,name:'Enemy'}]}};"
  ].join('\n');
  return runInNewContext(setup+extract('  const epochMs=','  function canCall(')+
    '; ({state,cfg,attacks,warAttackWindow,warAttackRows,warHitLedger})');
}
test('official attack parser retains ranked flag, faction IDs, time and zero respect',()=>{
  const f=attacksFixture(),now=Math.floor(Date.now()/1000)-60;
  const records=f.attacks({attacks:{
    110:{timestamp_started:now-30,timestamp_ended:now,attacker_id:1,defender_id:101,
      attacker_faction:10,defender_faction:20,ranked_war:true,result:'Hospitalized',respect_gain:2.75,
      modifiers:{fair_fight:2.6}},
    111:{timestamp_started:now,attacker_id:101,defender_id:1,attacker_faction:20,defender_faction:10,
      ranked_war:1,result:'Mugged',respect_gain:0,modifiers:{fair_fight:null}},
    112:{timestamp_started:now,attacker_id:1,defender_id:101,attacker_faction:10,defender_faction:20,
      ranked_war:false,result:'Mugged',respect_gain:4},
    113:{timestamp_started:now,attacker_id:1,defender_id:101,attacker_faction:10,defender_faction:99,
      ranked_war:true,respect_gain:8},
    114:{timestamp_started:now-7200,attacker_id:1,defender_id:101,attacker_faction:10,defender_faction:20,
      ranked_war:true,respect_gain:7}
  }});
  assert.equal(records.length,5);
  assert.equal(records[0].ff,2.6);
  assert.equal(records[1].respect,0);
  assert.equal(records[1].ranked,true);
  f.state.data.attacks=records;
  const selected=f.warAttackRows(500);
  assert.equal(selected.length,2);
  assert.deepEqual([...selected.map(x=>x.id)].sort(),[110,111]);
  assert.equal(f.warHitLedger(500).ours.hits,1);
  assert.equal(f.warHitLedger(500).theirs.hits,1);
  assert.equal(f.warHitLedger(500).ours.respect,2.75);
  assert.equal(f.warHitLedger(500).blackSkulls[0].stats.hits,1);
});
test('war ledgers remain unknown or empty rather than attributing unrelated attacks',()=>{
  const f=attacksFixture();
  assert.equal(f.warAttackWindow(999),null);
  assert.equal(f.warHitLedger(999).rows.length,0);
  assert.equal(f.warHitLedger(500).partial,true);
});
test('turtling exposure follows fresh observed states, not manual duty labels',()=>{
  const now=Date.now();
  const setup=[
    'const MIN=60000,HOUR=3600000;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number(v)||0;',
    'const epochMs=v=>v>1e12?v:v>1e9?v*1000:0;',
    "const cfg={enemyId:20,turtlePlans:{'500':{mode:'full',members:{1:'turtle'}}}};",
    "const state={data:{war:{id:500},ours:[{id:1,status:'Okay',lastAction:'Online'},"+
      "{id:2,status:'Hospital',until:Date.now()+10*60000,revivable:true,lastAction:'Idle'},"+
      "{id:3,status:'Abroad',lastAction:'Idle'}],"+
      "enemies:[{id:101,status:'Okay',lastAction:'Online'}],updated:{ours:Date.now(),enemies:Date.now()}}};",
    "const memberState=p=>p.status.toLowerCase()==='okay'?'okay':p.status.toLowerCase()==='hospital'?'hospital':'away';",
    'const isOnline=p=>p.lastAction==="Online";',
    'const rosterFresh=()=>true;',
    'const hitterReadiness=()=>({energyEnough:null});',
    'const warPace=()=>null;',
    'const warScore=()=>null;'
  ].join('\n');
  const f=runInNewContext(setup+extract('  function currentPlanKey(){','  function scoreAcceleration(')+
    '; ({state,cfg,turtleAssessment,turtlePlan})');
  f.state.data.war.start=Math.floor((now-26*3600000)/1000);
  const a=f.turtleAssessment(now);
  assert.equal(a.decayPhase,'24h+ reduction period');
  assert.ok(a.elapsedHours>=25);
  assert.equal(a.plan.mode,'full');
  assert.equal(a.exposed,2,'Landed-abroad member cannot count as sheltered');
  assert.equal(a.sheltered,1);
  assert.equal(a.reviveWarnings,1);
  assert.equal(a.dueSoon,1);
  assert.equal(a.rows.find(x=>x.p.id===1).assigned,'turtle');
  assert.equal(a.rows.find(x=>x.p.id===1).danger,true,'Manual turtle label cannot fake hospital status');
});
test('Black Skulls after-action uses real report values, not invented missing scores',()=>{
  const setup=[
    'const positive=v=>Number(v)||0;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const officialNumber=v=>v===null||v===undefined?null:Number(v);',
    "const cfg={ourId:10,blackSkulls:{1:true,2:true}};",
    "const state={data:{ours:[{id:1,name:'One'},{id:2,name:'Two'}],"+
      "ourWars:[{id:400,end:1}],"+
      "reports:{500:{factions:[{id:10,score:1000,members:[{id:1,name:'One',score:300,attacks:5}]}]},"+
      "400:{factions:[{id:10,score:800,members:[{id:1,name:'One',score:200,attacks:4}]}]}}}};",
    "const warHitLedger=()=>({ours:{players:{}}});"
  ].join('\n');
  const f=runInNewContext(setup+extract('  function blackSkullScorecards(','  function scoreAcceleration(')+
    '; ({blackSkullScorecards})');
  const cards=f.blackSkullScorecards(500);
  assert.equal(cards.length,2);
  assert.equal(cards[0].score,300);
  assert.equal(cards[0].hits,5);
  assert.equal(cards[0].share,30);
  assert.equal(cards[0].previousAvg,200);
  assert.equal(cards[1].score,null);
  assert.equal(cards[1].hits,null);
});
test('all six surfaces and manual defensive controls are connected and parser safe',()=>{
  for(const name of ['commander','ledger','threats','control','turtle','afteraction'])
    assert.match(source,new RegExp('function '+name+'\\('));
  for(const term of ["data-control-target","data-turtle-duty","action.startsWith('turtle-mode:')",
    "action.startsWith('control-target:')","function warHitLedger(","function enemyThreatRows(",
    "function blackSkullScorecards(","function turtleAssessment(","function operationalQueue(",
    "id:'enemy-hitters-active'"])
    assert.ok(source.includes(term),'Missing '+term);
  assert.match(source,/\/\/ @version\s+2\.4\.1/);
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
  const normalised=source.replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"');
  assert.doesNotThrow(()=>new Script(normalised));
});

test('failed or zero-respect attempts never become confirmed enemy scoring threats',()=>{
  const setup=[
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number(v)||0;',
    'const cfg={enemyId:20};',
    "const state={data:{war:{id:500},enemies:[{id:101,name:'Enemy',status:'Okay'}],reports:{}}};",
    'const warHitLedger=()=>({theirs:{players:{101:{hits:2,scoringHits:0,respect:0}}}});',
    'const latestFinished=()=>null;',
    'const memberState=()=> "okay";'
  ].join('\n');
  const f=runInNewContext(setup+extract('  function enemyThreatRows(','  function blackSkullScorecards(')+
    '; ({enemyThreatRows})');
  const result=f.enemyThreatRows();
  assert.equal(result.length,1);
  assert.equal(result[0].live,null);
  assert.equal(result[0].attempted.hits,2);
  assert.equal(result[0].source,'Non-scoring attempts');
});
