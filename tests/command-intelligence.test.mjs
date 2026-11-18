import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const installer=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
const names=['intelligence','activity','planning','coordination','views'];
const modules=names.map(n=>readFileSync(new URL('../src/'+n+'.js',import.meta.url),'utf8')).join('\n');
const hour=3600000,day=24*hour,now=Date.UTC(2026,10,18,14);
function functions(extra=''){
  return runInNewContext("const HOUR=3600000,MIN=60000,positive=v=>Number(v)||0;const state={data:{war:null,ourWars:[],enemyWars:[],meta:{}}};const cfg={};const spy=()=>null,bsScore=()=>null;const scouterPremiumActive=()=>true;"+modules+
    '\n'+extra+';({pairEvidence,cleanFight,travelRanking,forecastWindows,activityCells,combatArchive,weightedCells})');
}
test('release sources, probe and package version agree',()=>{
  assert.equal(installer.match(/@version\s+(\S+)/)[1],pkg.version);
  for(const field of ["const id='war', version='","const ID='war', VER='"])assert.ok(installer.includes(field+pkg.version+"'"));
});
test('direction, result, freshness and newer conflicting outcomes affect recommendations',()=>{
  const {pairEvidence:e,cleanFight}=functions(),r=(id,result,at,reverse=false)=>({id,attacker:reverse?2:1,defender:reverse?1:2,result,at});
  const rows=[r(1,'Stalemate',now-100),r(2,'Lost',now-300),r(3,'Attacked',now-200,true),r(4,'Lost',now-500,true),r(5,'Stalemate',now-600,true),r(6,'Mugged',now-40*day)];
  const stale=e([rows[5]],1,now);assert.equal(stale.category,'Insufficient evidence');
  let v=e(rows,1,now,0.5);assert.equal(v.category,'Avoid or reassess');assert.equal(v.offense.stalemates,1);
  assert.deepEqual({...v.defense},{wins:1,losses:1,stalemates:1,unknown:0});
  assert.equal(e(rows.concat(r(7,'Attacked',now-1)),1,now,0.6).category,'Proven favourable matchup');
  assert.equal(e([r(7,'Lost',now-1,true)],1,now,null).category,'Insufficient evidence');
  assert.equal(e([r(7,'Attacked',now-1)],1,now,1.4).category,'Avoid or reassess');
  const partial=cleanFight({...rows[0],ff:null,modifierWar:null,ranked:null});assert.equal(partial.ff,undefined);assert.equal(partial.spyEvidence,undefined);assert.equal(partial.ranked,undefined);
});
test('relative BSE threshold, rule B and manual extras survive missing strength',()=>{
  const start=installer.indexOf('  function heavyRule('),end=installer.indexOf('  function enemyRole(',start);
  const g={cfg:{commandMetric:'bse',blackSkulls:{3:true},heavyPolicy:{mode:'relative'}},state:{data:{ours:[{id:1,name:'Regular'},{id:2},{id:3}],enemies:[4,5,6,7].map(id=>({id,name:'r'+id}))}},
    commandRoom:()=>null,reliableBse:p=>({value:({1:100,4:120,5:60})[p.id]??null}),
    manualHeavyTargets:()=>({7:true}),attackHistoryFor:(a,d)=>({wins:a===5&&d===1?1:0}),concessionSnapshot:()=>null,n:Number,positive:Number,fmt:String};
  const f=runInNewContext(installer.slice(start,end)+';enemyRoleBands',g);
  const result=f();assert.deepEqual([...result.heavy].sort(),[4,5,7]);assert.equal(result.missingRegular,1);assert.equal(result.threshold,100);assert.equal(result.unknown,1);assert.equal(result.regular.has(6),false);
});
test('UTC date/hour filtering, missing observations, sample weighting, partial war and peace coverage',()=>{
  const {combatArchive:a,activityCells:cells,weightedCells:mean}=functions(),h=now-hour;
  [{id:'a',hour:h,faction:10,player:3,war:9,source:'roster',samples:2,online:1,unknown:1,recent:2,at:h,roster:4},
   {id:'b',hour:h,faction:10,player:4,war:9,source:'roster',samples:1,online:0,unknown:0,recent:0,at:h,roster:4},
   {id:'c',hour:h-24*hour,faction:10,player:3,war:0,source:'roster',samples:1,online:1,unknown:0,at:h-day,roster:4},
   {id:'d',owner:0,hour:h,faction:10,player:0,war:null,source:'scanner',score:12,at:h,roster:4}].forEach(x=>a.hours.set(x.id,x));
  const opts={days:3,period:'war',player:0,source:'roster'},war=cells(10,opts,now);assert.equal(war.size,1);
  assert.equal(war.get(h).count,2);assert.equal(war.get(h).players.size,2);assert.equal(war.get(h).roster,4);
  assert.equal(mean(war,d=>d.getUTCDay()===3&&d.getUTCHours()===13).mean,0.5);
  assert.equal(cells(10,{...opts,period:'peace'},now).size,1);
  assert.equal(cells(10,{...opts,period:'all',source:'scanner'},now).get(h).sum,12);
  assert.equal(cells(10,{...opts,player:99},now).size,0);
});
test('forecast windows use actual candidate and roster evidence and leave missing periods unknown',()=>{
  const {forecastWindows:forecast}=functions(),o=new Map(),e=new Map();
  for(let d=1;d<=3;d++)for(let h=0;h<24;h++){
    const t=Date.UTC(2026,10,18-d,h);o.set(t,{sum:h>=18&&h<=20?9:2,count:10});e.set(t,{sum:4,count:10});
  }
  const c={hitterCount:2,targetCount:2,releases:[],arrivals:[]},r=forecast(o,e,c,now);
  assert.deepEqual(Array.from(r,x=>(x.end-x.start)/60000),[30,60,120]);assert.ok(r.every(w=>new Date(w.start).getUTCHours()===18));
  assert.ok(forecast(o,e,{...c,targetCount:0},now).every(w=>w.start===undefined));
  assert.ok(forecast(o,new Map(),c,now).every(w=>w.confidence==='Insufficient coverage'));
});
test('all routes, strict duration boundary, modifiers and uncertain travel',()=>{
  const f=functions("flightTable.push(['boundary29',0,[29,29,29,29],[29,29,29,29]],['boundary30',0,[30,30,30,30],[30,30,30,30]],['boundary31',0,[31,31,31,31],[31,31,31,31]]);").travelRanking;
  const c={at:now,method:'Standard',book:'no',enemies:[{country:'Torn',known:true}],overseas:null};
  const results=f(c),by=name=>results.find(r=>r.country===name);
  assert.equal(results.length,14);assert.equal(by('boundary29').eligible,false);assert.equal(by('boundary30').eligible,false);assert.equal(by('boundary31').eligible,true);
  assert.equal(f({...c,method:'Airstrip'}).find(x=>x.country==='Canada').eligible,false);
  assert.equal(f({...c,book:'yes'}).find(x=>x.country==='Canada').eligible,false);
  assert.ok(f({...c,method:''}).every(r=>!r.safe&&!r.eligible));
  assert.ok(f({...c,enemies:[{known:false}]}).every(r=>!r.safe&&!r.offensive));
  const inCanada=(enemies,overseas=null)=>f({...c,enemies,overseas}).find(x=>x.country==='Canada');
  const weak={known:true,country:'Canada',ready:true,proven:true};
  assert.ok(inCanada([weak]).offensive);assert.equal(inCanada([weak]).safe,false);assert.equal(inCanada([weak],0).offensive,false);
  assert.equal(inCanada([weak,{...weak,proven:false}]).offensive,false);
  const inbound={...weak,inbound:true,earliest:now+hour,latest:now+hour};assert.equal(inCanada([inbound]).offensive,false);
  assert.equal(inCanada([{...inbound,earliest:now+1000,latest:now+2000}]).offensive,true);
});
