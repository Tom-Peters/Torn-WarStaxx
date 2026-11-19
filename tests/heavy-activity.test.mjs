import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=name=>readFileSync(new URL('../src/'+name+'.js',import.meta.url),'utf8');
const HOUR=3600000,at=Date.UTC(2026,10,19,13,40),hour=Date.UTC(2026,10,18,8);
function setup(){
  const data={ours:[{id:1,name:'Skull'},{id:2,name:'Regular'}],enemies:[8,9,10,11,12].map(id=>({id,name:'P'+id,daysInFaction:5,updated:at,lastAction:'Offline'})),meta:{ownerId:99},activity:{}};
  const cfg={enemyId:20,blackSkulls:{1:true},assignments:{1:10,2:12}};
  const archive={hours:new Map(),fights:new Map(),people:new Map()};
  const bands={automatic:new Set([8]),manual:new Set([9])};
  const env={HOUR,MIN:60000,cfg,state:{data},combatArchive:archive,positive:Number,idKey:id=>Number.isSafeInteger(id)&&id>0,
    scouterPremiumActive:()=>true,enemyRoleBands:()=>bands,commandRoom:()=>({plan:{assignments:{11:{primary:1},8:{primary:1}}}}),
    playerName:id=>'P'+id,esc:String,infoButton:()=>'',b:()=>''};
  const api=runInNewContext(read('activity-grid')+read('heavy-activity')+';({heavyTargets,heavyHistory,heavyMark,heavyRange,heavyLast,heavyTargetDetail})',env);
  const add=(player,fields)=>{archive.hours.set(archive.hours.size,{faction:20,player,source:'roster',hour,at:hour+55000,samples:2,unknown:0,online:1,...fields});};
  return {api,env,archive,data,add,history:()=>api.heavyHistory(api.heavyTargets(),20,at)};
}
test('target list unites automatic, designated, scoped shared and Skull orders, without double-counting or regular orders',()=>{
  const f=setup(),targets=f.api.heavyTargets();assert.deepEqual(Array.from(targets,t=>t.id).sort((a,b)=>a-b),[8,9,10,11]);
  assert.equal(targets.find(t=>t.id===8).reasons.size,2);
  f.env.cfg.enemyId=0;assert.equal(f.api.heavyTargets().length,0);
});
test('online timestamp is only exact with evidence; idle, action, attack and individual scans retain their provenance',()=>{
  const f=setup();f.add(8,{});f.add(8,{hour:hour-24*HOUR,lastOnlineAt:hour-24*HOUR+14000});
  f.add(9,{online:0});f.add(10,{source:'scanner',owner:99,score:12});
  f.add(10,{source:'scanner',hour:hour+HOUR,owner:99,score:0});
  f.add(11,{faction:22});f.add(11,{source:'scanner',owner:88,score:25});
  f.add(0,{source:'scanner',owner:99,score:30,active:9});
  f.archive.fights.set(123,{attacker:9,at:hour+60000,attackerFaction:20});
  f.data.enemies.find(p=>p.id===11).lastAt=hour+120000;
  const h=f.history();assert.equal(h.get(8).latest.exact,0);assert.match(f.api.heavyLast(h.get(8).latest),/08h TCT/);
  assert.match(f.api.heavyTargetDetail(h.get(8)),/08:00 TCT on 2 dates/);
  const mark=(id,time=hour)=>f.api.heavyMark(h.get(id).hours.get(time))[0];
  assert.equal(mark(8),'ON');assert.equal(mark(9),'A');assert.equal(mark(10),'S');assert.equal(mark(10,hour+HOUR),'0');
  assert.equal(mark(11),'A');assert.equal(mark(8,hour-HOUR),'\u2013');
  assert.equal(h.get(10).latest,null);assert.equal(h.get(11).hours.get(hour).score,undefined);
  f.add(8,{lastOnlineAt:hour+19000});assert.equal(f.history().get(8).latest.exact,hour+19000);
  f.env.scouterPremiumActive=()=>false;assert.equal(f.history().get(10).hours.has(hour),false);
});
test('legacy sightings retain UTC hour precision and require known membership',()=>{
  const f=setup();f.data.activity['enemies:8']={hours:{[hour/HOUR]:{online:1,count:2},[hour/HOUR-24*12]:{online:1,count:1}}};
  const h=f.history().get(8);assert.equal(h.latest.hour,hour);assert.equal(h.latest.exact,0);
  assert.equal(h.hours.has(hour-12*24*HOUR),false);
});
test('incremental coverage is scoped to owner, faction and target; completed hours are reused after reload',()=>{
  const f=setup(),r=f.api.heavyRange(20,99,8,at);assert.equal(r.end,Date.UTC(2026,10,19,13)/1000);
  f.archive.hours.set(r.marker,{from:r.from,end:r.end});
  assert.equal(f.api.heavyRange(20,99,8,at),null);
  assert.equal(f.api.heavyRange(20,99,8,at+HOUR).from,r.end);
  for(const args of [[20,100,8],[21,99,8],[20,99,9]])assert.ok(f.api.heavyRange(...args,at));
});
test('individual scanner range persists with valid data only and competing account rows coexist',async()=>{
  const activity=read('activity');
  const handler=activity.slice(activity.indexOf('  async function captureScanner('),activity.indexOf('  async function loadFactionScanner('));
  const h=Math.floor(Date.now()/HOUR)*HOUR-HOUR,ts=h/1000;
  const state={data:{meta:{ownerId:3}}},hours=new Map(),stored=new Map();
  const capture=runInNewContext(handler+';captureScanner',{HOUR,positive:Number,officialNumber:x=>x??null,state,archiveReady:Promise.resolve(),
    combatArchive:{db:true,hours},warAt:()=>null,transact:async(_,write)=>write({put:r=>stored.set(r.id,r)})});
  const range={from:ts,end:ts+3600,coveredFrom:ts,marker:'mark-3',owner:3,valid:()=>true};
  const response={meta:{subject_type:'player',subject_id:8,start:ts,end:ts+3600,truncated:false,bucket_seconds:3600},buckets:[{ts,activity_score:4}]};
  await capture({...response,meta:{...response.meta,truncated:true}},20,8,range);
  assert.ok(!hours.has(range.marker));
  await capture({...response,buckets:[{ts,activity_score:-1}]},20,8,range);assert.ok(!hours.has(range.marker));
  assert.equal(await capture(response,20,8,{...range,valid:()=>false}),false);
  await assert.rejects(()=>capture({...response,meta:{...response.meta,subject_id:9}},20,8,range),/Unrecognised/);
  await capture(response,20,8,range);assert.equal(stored.get(range.marker).end,ts+3600);
  state.data.meta.ownerId=4;await capture(response,20,8,{...range,owner:4,marker:'mark-4'});
  assert.deepEqual([...stored.values()].filter(r=>r.source==='scanner').map(r=>r.owner),[3,4]);
});
