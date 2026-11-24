import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../src/war-effort.js',import.meta.url),'utf8');
function fixture(){
  const now=Date.now(),w={id:1,start:now-3600000,end:now,active:true,ourId:10,enemyId:20};
  const state={open:true,tab:'enemy',data:{meta:{ownerId:1},war:{id:1},attacks:[],ours:[{id:1}],enemies:[{id:2}]}};
  const archive={ready:true,db:{},fights:new Map(),hours:new Map(),fightRevision:0};
  const scan={effortArchived:true,complete:true,caughtUpAt:now};
  const scope={state,combatArchive:archive,MIN:60000,HOUR:3600000,n:Number,positive:Number,fmt:String,warPoints:String,stamp:String,esc:String,Date,
    cfg:{ourId:10,enemyId:20},warAttackWindow:()=>w,concessionRecord:()=>scan,scouterPremiumActive:()=>true,
    memberState:p=>p.status.toLowerCase(),nativeWarLocation:p=>({country:p.country||p.statusText?.split(' to ')[1]||'Unknown'}),archiveReady:Promise.resolve(),archiveFailure:e=>{throw e;},
    activeWarNow:()=>true,scouterExtra:{},ffApiKey:()=>'fixture',document:{hidden:false},isNativeWarPage:()=>true,
    ffTimestamp:v=>v*1000||0,URLSearchParams,render:()=>{}};
  const disk=new Map();
  scope.transact=async(_,callback)=>{
    const reads=[];
    callback({get(id){const req={result:structuredClone(disk.get(id))};reads.push(req);return req;},
      put(row){disk.set(row.id,structuredClone(row));}});
    for(const req of reads)req.onsuccess();
  };
  const api=runInNewContext(source+';({effortFor,effortFields,observedFlights,flightDisclosure,factionEnergyLine,observeFlight,backfillFlightHistory,captureBatchDepartures,flightHistoryQueue,flightStoreKey})',scope);
  return {now,w,state,archive,scan,scope,disk,...api};
}
test('initiator, war window and attack ID determine energy independently of points and outcome',()=>{
  const f=fixture(),at=f.w.start+2000;
  const attack=(id,extras={})=>({id,attacker:1,attackerFaction:10,defender:2,defenderFaction:20,ranked:true,at,...extras});
  for(const row of [attack(1,{result:'Lost',respect:0}),attack(2,{result:'Stalemate',ranked:null}),attack(3,{result:'Assist'}),
    attack(4,{result:'Mugged',ranked:false,defenderFaction:30}),attack(5,{startedAt:f.w.start-1}),attack(6,{at:f.w.end+1}),
    attack(7,{attacker:2,defender:1,attackerFaction:20,defenderFaction:10}),attack(8,{defenderFaction:0,ranked:null})]){
    f.archive.fights.set(row.id,row);
  }
  f.state.data.attacks=[attack(1),attack(9,{result:'Lost',ranked:false,defenderFaction:0})];
  const own=f.effortFor(f.w,10,1);
  assert.deepEqual({...own},{war:3,other:2,total:6,unknown:1,warShare:null,pointsPer100:null,flights:null,log:null});
  const labels=f.effortFields(own,(k,v)=>k+' '+v+' ');
  assert.match(labels,/War hits \/ E 3 \/ ~75 E/);
  assert.match(labels,/Total attack E ~150 E/);
  assert.equal(f.effortFor(f.w,20,2).war,1);
  assert.equal(f.effortFor(f.w,20,2).other,null);
  assert.equal(f.effortFor(f.w,10,3).other,0);
  f.scan.effortArchived=false;
  assert.equal(f.effortFor(f.w,10,3).other,null);
  f.scan.effortArchived=true;
  f.archive.fights.set(10,attack(10,{attackerFaction:0,attacker:0,defenderFaction:10}));
  f.archive.fightRevision++;
  assert.equal(f.effortFor(f.w,20,3).war,null);
  assert.equal(f.effortFor(f.w,10,3).war,0);
});
test('a flight already underway, repeated checks, landings and scanner history count distinct wartime departures',()=>{
  const f=fixture(),row={};
  const see=(status,country,at)=>f.observeFlight(row,{status,country},at);
  see('Traveling','Japan',10);
  see('Traveling','Japan',20);
  see('Unknown','',23);
  assert.equal(f.observedFlights(row,null,100).length,0);
  see('Abroad','Japan',30);
  see('Travelling','Torn',40);
  see('Traveling','Torn',45);
  see('Traveling','Canada',80);
  see('Traveling','Canada',88);
  see('Okay','Torn',35); // late response
  assert.equal(row.legs.length,3);
  assert.equal(f.observedFlights(row,null,100).length,2);
  assert.equal(f.observedFlights(row,{departures:[5,37,50,95]},100).length,4);
  assert.equal(f.observedFlights(row,{departures:[5,37,95]},100).length,4);
  assert.equal(f.observedFlights(null,null,100),null);
  assert.equal(f.observedFlights(null,{historyAt:99,departures:[]},100).length,0);
});
test('Premium history reuses takeoff times across batches, reloads and recent history with entitlement and identity checks',async()=>{
  const f=fixture(),start=Math.ceil(f.w.start/1000),takeoff=start+300,requests=[];
  f.scope.ffRequest=async url=>{
    requests.push(new URL(url));
    return {player_id:1,current:{takeoff_time:takeoff,status_description:'Traveling to Canada'},recent_flights:[{takeoff_time:takeoff},{takeoff_time:start-60},{takeoff_time:start+10}]};
  };
  await f.backfillFlightHistory();
  assert.equal(requests[0].searchParams.get('target'),'1');
  f.captureBatchDepartures({1:{current:{takeoff:takeoff*1000}}});
  await new Promise(resolve=>setImmediate(resolve));
  const effort=f.effortFor(f.w,10,1);
  assert.equal(effort.flights,2);
  assert.equal(effort.log[0].country,'Canada');
  assert.equal(effort.log[1].country,'Unknown');
  assert.match(f.flightDisclosure(effort,'1-10-1'),/To Canada/);
  f.archive.hours.clear();
  for(const [k,v] of f.disk)f.archive.hours.set(k,structuredClone(v));
  assert.equal(f.effortFor(f.w,10,1).flights,2);
  f.flightHistoryQueue.next=0;
  await f.backfillFlightHistory();
  assert.equal(requests[1].searchParams.get('target'),'2');
  assert.equal(f.effortFor(f.w,20,2).flights,null,'wrong player response discarded');
  f.scope.scouterPremiumActive=()=>false;
  assert.equal(f.effortFor(f.w,10,1).flights,null);
});

test('faction totals retain anonymous ranked attacks and member ratios use all recorded attack energy',()=>{
  const f=fixture(),at=f.w.start+1000;
  for(const row of [
    {id:1,attacker:1,attackerFaction:10,defenderFaction:20,ranked:true,respect:12},
    {id:2,attacker:1,attackerFaction:10,defenderFaction:30,ranked:false,respect:10},
    {id:3,attacker:1,attackerFaction:10,defenderFaction:20,ranked:true,result:'Lost',respect:0},
    {id:4,attacker:1,attackerFaction:10,defenderFaction:20,ranked:true,result:'Stalemate',respect:0},
    {id:5,attacker:0,attackerFaction:0,defenderFaction:10,ranked:true,respect:3}
  ])f.archive.fights.set(row.id,{at,...row});
  const e=f.effortFor(f.w,10,1);
  assert.equal(e.warShare,75);
  assert.equal(e.pointsPer100,12);
  assert.equal(f.effortFor(f.w,10,2).pointsPer100,null);
  assert.match(f.factionEnergyLine(f.w),/Us ~100 E \/ Them ~25 E/);
  f.archive.fights.set(6,{id:6,at,attacker:1,attackerFaction:10,defenderFaction:20,ranked:true});
  f.archive.fightRevision++;
  assert.equal(f.effortFor(f.w,10,1).pointsPer100,null);
});

test('legacy takeoffs acquire roster destinations and Torn-only legs retain the observed time interval',()=>{
  const f=fixture();
  const roster={lastCheck:90,legs:[{after:12,first:30,last:40,country:'Torn'},{after:50,first:70,last:75,country:'Japan'}]};
  const log=f.observedFlights(roster,{departures:[20]},90);
  assert.equal(log.length,2);
  assert.equal(log[1].country,'Torn');
  const html=f.flightDisclosure({log,flights:2},'1-10-1');
  assert.match(html,/To Japan.*Departed between 50 and 70/);
  assert.match(html,/To Torn.*Takeoff 20/);
});
