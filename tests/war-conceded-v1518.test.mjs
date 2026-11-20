import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const from=source.indexOf('  function concessionRecord(');
const until=source.indexOf('  function inboundWarImpact(',from);
assert.ok(from>0&&until>from,'Live concession aggregation functions exist');
const excerpt=source.slice(from,until);

function fixture({feed,score={our:0,enemy:109},raw=false}={}){
  const now=Date.now(),start=now-190000;
  const state={data:{war:{id:71},concededWars:{},attacks:[]},open:false,concededBusy:false};
  const cfg={ourId:11,autoConceded:true};
  const record=(id,at,more={})=>({id,at,ranked:true,attackerFaction:22,
    defenderFaction:11,defender:101,respect:1,...more});
  const first=Array.from({length:100},(_,i)=>record(i+1,start+30000+i*1000,
    {respect:i===0?10:1}));
  first[1].ranked=false;first[2].defenderFaction=99;first[3].attackerFaction=99;
  first[4].defender=102;
  const second=[first[99],record(101,start+145000,{defender:102,respect:3}),
    record(102,start+160000,{defender:101,respect:0})];
  const requests=[];
  let calls=0;
  const scope=createContext({
    state,cfg,MIN:60000,HOUR:3600000,Date,URL,Math,Object,Number,String,Boolean,
    positive:value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0,
    n:value=>Number.isFinite(Number(value))?Number(value):0,
    officialNumber:value=>value!==null&&value!==undefined&&value!==''&&
      Number.isFinite(Number(value))?Number(value):null,
    warAttackWindow:()=>({id:71,ourId:11,enemyId:22,start,end:now+1000}),
    activeWarNow:()=>true,isNativeWarPage:()=>true,effectiveKey:()=>true,
    canCall:()=>true,warAttackRows:()=>[],
    warScore:()=>score,
    call:async path=>{requests.push(path);calls++;return feed?feed(calls,start,now):{attacks:calls===1?first:second};},
    validFF:v=>v??null,epochMs:v=>Number(v)*1000||0,
    parseArray:value=>value,unpack:value=>value.attacks,
    attacks:value=>value.attacks,save:()=>true,keepFights:async()=>{},archiveFailure:()=>{},
  });
  if(raw)new Script(source.slice(source.indexOf('  function attacks(j,includePartial=false){'),source.indexOf('  // Attack attribution is conservative:'))).runInContext(scope);
  new Script(excerpt+';globalThis.exposed={concessionSnapshot,refreshWarConcessions,concessionRecord,liveWarMemberImpact,liveEnemyWarImpact,scoreDifference};')
    .runInContext(scope);
  return {state,...scope.exposed,getCalls:()=>calls,first,requests,start,now};
}

test('points conceded count only ranked hits from enemy faction on our own members',async()=>{
  const f=fixture();
  await f.refreshWarConcessions();
  const partial=f.concessionSnapshot(71);
  assert.equal(partial.complete,true);
  assert.equal(partial.partial,false);
  assert.equal(partial.rows,99);
  assert.equal(partial.byMember[101].enemyScore,105);
  await f.refreshWarConcessions();
  const done=f.concessionSnapshot(71);
  assert.equal(done.complete,true);
  assert.equal(done.partial,false);
  assert.equal(done.rows,99,'Overlapping page must not count the same attack twice');
  assert.equal(done.byMember[101].enemyScore,105);
  assert.equal(done.byMember[101].scoringAttacks,96);
  assert.equal(done.byMember[102].enemyScore,4);
  assert.equal(done.byMember[102].scoringAttacks,2);
  assert.equal(done.total,109);
  assert.equal(f.getCalls(),3);
});

test('unavailable data is not rendered as zero and incoming API permission is explained',()=>{
  const f=fixture();
  assert.equal(f.liveWarMemberImpact(101).given,null);
  assert.equal(f.liveWarMemberImpact(101).earned,null);
  assert.ok(source.includes('Incomplete attack-history scan'));
  assert.ok(source.includes('data-wsnw-chip="conceded"'));
  assert.ok(source.includes('data-wsnw-chip="received"'));
  assert.ok(source.includes('data-wsnw-chip="given"'));
  assert.doesNotThrow(()=>new Script(source));
});

test('points conceded auto-refresh and retain the user opt-out setting',()=>{
  assert.ok(source.includes('await refreshWarConcessions(force);'));
  assert.ok(source.includes('await refreshWarConcessions();'));
  assert.ok(source.includes("cfg.autoConceded===false"));
  assert.ok(source.includes('id="ws-conceded"'));
  assert.ok(source.includes('sort=ASC&from='));
  assert.ok(source.includes('rec.seen[a.id]=1'));
});

function attack(id,at,defender,points,overrides={}){
  return {id,started:Math.floor(at/1000)-3,ended:Math.floor(at/1000),
    attacker:{id:201,name:'Rival',faction:{id:22}},defender:{id:defender,faction:{id:11}},
    result:'Hospitalized',is_ranked_war:true,respect_gain:points,respect_loss:1.23,...overrides};
}
test('the real API parser recovers a hidden ranked hit on upgrade without double counting old hits',async()=>{
  const f=fixture({score:{our:0,enemy:23},raw:true,feed:(_i,start)=>({attacks:[
    attack(1,start+5000,101,14.60),attack(2,start+10000,102,8.45,{attacker:null,is_stealthed:true}),
    attack(3,start+20000,102,0,{result:'Stalemate'}),
    attack(4,start+30000,102,5,{is_ranked_war:false,attacker:null}),
    attack(5,start+32000,102,11,{is_ranked_war:true,attacker:{id:301,faction:{id:33}}}),
    attack(6,start-5000,102,30,{attacker:null,is_stealthed:true}),
  ]})});
  const old=f.concessionRecord(71,true);
  Object.assign(old,{total:14.6,rows:1,fetches:3,complete:true,caughtUpAt:f.now,cursor:Math.floor(f.now/1000),
    seen:{1:1},byMember:{101:{id:101,attacks:1,scoringAttacks:1,enemyScore:14.6,hitTimes:[]}}});
  delete old.defenderReplay;
  assert.equal(f.concessionSnapshot(71).incomingComplete,false);
  assert.equal(f.liveWarMemberImpact(102).given,null);
  await f.refreshWarConcessions();
  assert.equal(new URL(f.requests[0],'https://api.torn.com').searchParams.get('from'),String(Math.floor(f.start/1000)-1));
  const x=f.liveWarMemberImpact(102),snap=f.concessionSnapshot(71);
  assert.ok(Math.abs(snap.total-23.05)<1e-9);
  assert.equal(snap.gap,0);
  assert.equal(snap.incomingComplete,true);
  assert.equal(x.given,8.45);
  assert.equal(x.attacks,2);
  assert.equal(x.hits,1);
  assert.equal(x.recentIncoming.find(r=>r.id===2).attacker,'Attacker hidden or unknown');
  assert.equal(x.recentIncoming.find(r=>r.id===4).type,'Non-ranked');
  assert.equal(x.recentIncoming.find(r=>r.id===4).points,null);
  assert.equal(snap.enemyAttackers[0],undefined);
  assert.equal(f.liveEnemyWarImpact(999).scored,null);
  await f.refreshWarConcessions();
  assert.ok(Math.abs(f.concessionSnapshot(71).total-23.05)<1e-9);
  assert.equal(f.liveWarMemberImpact(102).attacks,2);
  assert.equal(f.liveWarMemberImpact(102).recentIncoming.length,4);
});

test('an official score gap keeps unobserved member totals unknown even on a current page',async()=>{
  const f=fixture({score:{our:93,enemy:23},raw:true,feed:(_i,start)=>({attacks:[attack(1,start+5000,101,14.6)]})});
  await f.refreshWarConcessions();
  const snap=f.concessionSnapshot(71);
  assert.equal(snap.scanComplete,true);
  assert.equal(snap.incomingComplete,false);
  assert.equal(snap.gap,8.4);
  assert.equal(f.liveWarMemberImpact(102).given,null);
  assert.equal(f.liveWarMemberImpact(102).attacks,null);
  assert.equal(f.liveWarMemberImpact(101).given,14.6);
  assert.equal(f.liveWarMemberImpact(101).net,null);
  assert.equal(f.scoreDifference(14,23.1),-9.1);
  assert.equal(f.scoreDifference(0,0),0);
  assert.equal(f.scoreDifference(null,10),null);
});

test('later amounts and identities enrich the same incoming attack exactly once',async()=>{
  const f=fixture({score:{our:0,enemy:8},raw:true,feed:(i,start)=>({attacks:[
    attack(9,start+5000,101,i===1?null:i===3?null:8,i<=2?{attacker:null}:{}),
  ]})});
  await f.refreshWarConcessions();
  assert.equal(f.liveWarMemberImpact(101).attacks,1);
  assert.equal(f.liveWarMemberImpact(101).given,null);
  await f.refreshWarConcessions();
  assert.equal(f.liveWarMemberImpact(101).given,8);
  assert.equal(f.liveEnemyWarImpact(201).scored,null);
  await f.refreshWarConcessions();await f.refreshWarConcessions();
  assert.equal(f.liveEnemyWarImpact(201).scored,8);
  assert.equal(f.liveEnemyWarImpact(201).attacks,1);
  assert.equal(f.liveWarMemberImpact(101).attacks,1);
  assert.equal(f.concessionSnapshot(71).total,8);
});

test('a short page follows the Torn cursor and retries a malformed response without inventing zeroes',async()=>{
  const f=fixture({score:{our:0,enemy:9},raw:true,feed:(i,start)=>i===1?{
    attacks:[attack(1,start+5000,101,2)],_metadata:{links:{next:'https://api.torn.com/v2/faction/attacks?from='+Math.floor((start+5000)/1000)}}
  }:i===2?{timestamp:123}:{
    attacks:[attack(1,start+5000,101,2),attack(2,start+8000,102,7)],_metadata:{links:{next:null}}
  }});
  await f.refreshWarConcessions();
  assert.equal(f.getCalls(),2);
  assert.equal(f.concessionSnapshot(71).incomingComplete,false);
  assert.equal(f.liveWarMemberImpact(102).given,null);
  assert.match(f.concessionSnapshot(71).error,/list unavailable/);
  await f.refreshWarConcessions();
  assert.equal(f.liveWarMemberImpact(102).given,7);
  assert.equal(f.concessionSnapshot(71).total,9);
});

test('repeated inclusive links verify the remaining seconds before declaring the scan caught up',async()=>{
  const f=fixture({score:{our:0,enemy:5},raw:true,feed:(i,start)=>{
    const boundary=Math.floor((start+10000)/1000);
    return i<3?{attacks:[attack(11,start+10000,101,2)],_metadata:{links:{next:'?from='+boundary}}}:
      {attacks:[attack(12,start+15000,102,3)],_metadata:{links:{next:null}}};
  }});
  await f.refreshWarConcessions();
  const cursor=path=>Number(new URL(path,'https://api.torn.com').searchParams.get('from'));
  assert.equal(cursor(f.requests[2]),cursor(f.requests[1])+1);
  assert.equal(f.concessionSnapshot(71).rows,2);
  assert.equal(f.concessionSnapshot(71).incomingComplete,true);
});

test('a persistent deficit triggers a rate-limited replay without clearing credited hits',async()=>{
  const f=fixture({score:{our:0,enemy:9},raw:true,feed:(i,start)=>({attacks:i<2?[attack(1,start+10000,101,4)]:
    [attack(1,start+10000,101,4),attack(2,start+5000,102,3)]})});
  await f.refreshWarConcessions();
  const old=f.concessionRecord(71);
  old.gapSince=f.now-6*60000;
  await f.refreshWarConcessions();
  assert.equal(new URL(f.requests[1],'https://api.torn.com').searchParams.get('from'),String(Math.floor(f.start/1000)-1));
  assert.equal(f.liveWarMemberImpact(102).given,3);
  assert.equal(f.concessionSnapshot(71).rows,2);
  await f.refreshWarConcessions();
  assert.notEqual(f.requests[1],f.requests[2]);
});
