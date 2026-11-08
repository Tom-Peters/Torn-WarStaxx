import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(a,b){const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'Missing '+a+' to '+b);return source.slice(start,end);}
function fixture(){
  const cfg={spies:{},ffEnabled:true,ffConsent:true};
  const state={data:{meta:{ownerId:7},autoSpies:{},ffstats:{},updated:{},errors:{},backoff:{}}};
  const setup='const MIN=60000,HOUR=3600000;'+
    'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;'+
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;'+
    'const epochMs=x=>Number(x)>1e12?Number(x):Number(x)>1e9?Number(x)*1000:0;'+
    'const cfg=globalCfg,state=globalState;';
  const funcs=runInNewContext(setup+region('  function spy(id){',
    '  // Fair Fight from FFScouter')+
    ';({spy,bsScore,exactBattleStats,parseOwnBattleStats,parseStatsReports,applyAutoSpies})',
    {globalCfg:cfg,globalState:state,Date,Math});
  return {...funcs,cfg,state};
}
test('userscript v1.5.28 is ASCII and the PDA probe matches the release',()=>{
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.match(source,/^\/\/ @version\s+1\.5\.27$/m);
  assert.match(source,/const id='war', version='1\.5\.27'/);
  assert.match(source,/const ID='war', VER='1\.5\.27'/);
  assert.doesNotMatch(source,/[^\x00-\x7F]/);
  assert.doesNotThrow(()=>new Script(source));
});
test('BSS correctly sums four roots, treating null and missing as unknown',()=>{
  const f=fixture();
  assert.equal(f.bsScore({strength:10000,speed:10000,defense:10000,dexterity:10000}),400);
  assert.equal(f.bsScore({strength:10000,speed:10000,defense:null,dexterity:10000}),null);
  assert.equal(f.bsScore({strength:10000,speed:10000,defense:'',dexterity:10000}),null);
  assert.equal(f.bsScore({strength:10000,speed:10000,defense:0,dexterity:10000}),300);
});
test('Torn exact stats use nested .value and never substitute stat modifier',()=>{
  const f=fixture(),p={battlestats:{
    strength:{value:1000000,modifier:50},speed:{value:4000000,modifier:-5},
    defense:{value:9000000,modifier:0},dexterity:{value:16000000,modifier:2},
    total:30000000}};
  const s=f.parseOwnBattleStats(p,Date.now());
  assert.equal(s.strength,1000000);
  assert.equal(f.bsScore(s),10000);
  assert.equal(s.source,'Torn owner battlestats');
  p.battlestats.defense.value=null;
  assert.equal(f.parseOwnBattleStats(p,Date.now()),null);
});
test('spy reports import only complete, dated, correctly typed stats',()=>{
  const f=fixture(),t=Math.floor(Date.now()/1000);
  const s={strength:100,speed:400,defense:900,dexterity:1600,total:3000};
  const r=f.parseStatsReports({reports:[
    {type:'stats',target_id:90,timestamp:t-800,report:s},
    {type:'stats',target_id:90,timestamp:t-50,report:{...s,strength:144}},
    {type:'stats',target_id:91,timestamp:t-25,report:{...s,speed:null}},
    {type:'money',target_id:92,timestamp:t-10,report:s},
    {type:'stats',target_id:93,timestamp:t+3600,report:s}
  ]},'Torn faction spy report');
  assert.equal(Object.keys(r).length,1);
  assert.equal(r[90].strength,144);
  assert.equal(r[90].source,'Torn faction spy report');
});
test('owner exact stats win over old legacy data and cannot be overwritten by reports',()=>{
  const f=fixture(),t=Date.now();
  f.cfg.spies[7]={strength:10,speed:10,defense:10,dexterity:10,observedAt:t+1000};
  const v={strength:100,speed:100,defense:100,dexterity:100,
    observedAt:t-5000,source:'Torn owner battlestats'};
  assert.equal(f.applyAutoSpies({7:v}),1);
  assert.equal(f.spy(7).strength,100);
  assert.equal(f.applyAutoSpies({7:{...v,strength:1,observedAt:t,
    source:'Torn faction spy report'}}),0);
  f.cfg.spies[90]={...v,strength:45,observedAt:t-6000,source:'Legacy'};
  assert.equal(f.applyAutoSpies({90:{...v,source:'Torn personal spy report'}}),1);
  assert.equal(f.spy(90).strength,100);
});
test('fair-fight caps attacker BSS but risk ratio uses uncapped values',()=>{
  const code=region('  function matchup(friend,enemy){','  function ffObserved(');
  const fn=runInNewContext('const spy=()=>null;const bsScore=()=>null;'+
    'const ffscouter=id=>({bss:({7:400000,90:90000,91:10000})[id]});'+
    'const ffIsStale=()=>false;'+code+';matchup',{Date,Math});
  const strong=fn({id:7},{id:90});
  assert.equal(strong.exact,false);
  assert.ok(Math.abs(strong.ratio-0.225)<1e-10);
  assert.equal(strong.ff,3);
  const weak=fn({id:7},{id:91});
  assert.ok(weak.ff>1&&weak.ff<2);
});
test('provisional FFScouter guesses never satisfy exact matching gate',()=>{
  const code=region('  function matchEvidence(friend,enemy){','  function battleIntelSummary(){');
  assert.match(code,/const exactStats=Boolean\(m\.exact\)/);
  assert.match(code,/Provisional API candidate/);
  assert.match(code,/verified:exactStats,estimated:externalOnly/);
  const role=region('  function roleMatch(friend,enemy','  function heavyTargetPriorities(');
  assert.match(role,/!ev\.verified/);
  const hit=region('  function efficiencyHits(friend,limit=8){','  function bestEfficiencyHit(){');
  assert.match(hit,/!ev\.verified/);
});
test('official API stats and existing spy reports refresh automatically',()=>{
  assert.match(source,/await refreshBattleIntel\(\)/);
  assert.match(source,/\/user\/battlestats/);
  assert.match(source,/\/user\/reports\?cat=stats&limit=100/);
  assert.match(source,/\/faction\/reports\?cat=stats&limit=100/);
  assert.match(source,/\[\.\.\.state\.data\.enemies,\.\.\.state\.data\.ours\]/);
  assert.match(source,/28\*24\*HOUR/);
  assert.match(source,/base=\(Math\.log\(lvl\)\+1\)\/4/);
});
test('UI keeps manual spies optional, discloses evidence, protects key owner cache',()=>{
  assert.match(source,/AUTOMATIC BATTLE INTELLIGENCE \| DATA QUALITY/);
  assert.match(source,/Exact-source BSS:/);
  assert.match(source,/publicRequested\[id\]/);
  assert.match(source,/Legacy manual spy correction \(optional\)/);
  assert.match(source,/Missing stats remain unknown/);
  assert.match(source,/state\.data\.autoSpies=\{\}/);
  assert.doesNotMatch(source,/method\s*:\s*['"]POST['"]/i);
});
