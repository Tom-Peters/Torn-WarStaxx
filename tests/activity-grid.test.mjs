import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const HOUR=3600000,day=24*HOUR,at=Date.UTC(2026,10,19,13,45),h=Date.UTC(2026,10,18,8);
const src=readFileSync(new URL('../src/activity-grid.js',import.meta.url),'utf8');
const options={source:'users',days:14,period:'all',mode:'hours',idle:false,player:0};
const roster=(player,overrides={})=>({faction:20,hour:h,at:h+60000,source:'roster',player,
  samples:4,online:1,idle:0,idleKnown:4,unknown:0,war:null,roster:2,...overrides});
const scan=(faction,count,overrides={})=>({faction,hour:h,at,source:'scanner',player:0,
  owner:1,active:count,score:45,roster:14,partial:false,...overrides});
function setup(observations=[],premium=true){
  const data={ourWars:[],enemyWars:[],meta:{ownerId:1},updated:{},ours:[],enemies:[],activity:{},factionBasic:{}};
  const archive={people:new Map(),fights:new Map(),hours:new Map(observations.map((r,i)=>[i,r]))};
  const api=runInNewContext(src+';({trackerSeries,trackerModel,trackerCSV})',{
    HOUR,cfg:{ourId:10,enemyId:20},positive:Number,idKey:x=>x>0,scouterPremiumActive:()=>premium,
    state:{data},combatArchive:archive,epochMs:v=>v*1000
  });
  return {data,archive,series:(o={})=>api.trackerSeries(20,{...options,...o},at),
    model:(o={})=>api.trackerModel({...options,...o},at),csv:api.trackerCSV};
}

test('counts distinct IDs in each UTC hour and preserves real zeros, gaps and partial idle coverage',()=>{
  const f=setup([roster(2),roster(2,{war:7}),roster(3,{online:0,idle:2}),
    roster(3,{hour:h+HOUR,online:0,idleKnown:0}),roster(5,{hour:h+2*HOUR,online:0,unknown:4,idleKnown:0}),
    roster(4,{hour:h+3*HOUR,online:0,roster:1})]);
  assert.equal(f.series().get(h).value,1);
  assert.equal(f.series({idle:true}).get(h).value,2);
  assert.equal(f.series().get(h+HOUR).value,0);
  assert.equal(f.series({idle:true}).has(h+HOUR),false);
  assert.equal(f.series().has(h+2*HOUR),false);
  assert.equal(f.series().get(h+3*HOUR).partial,false);
  assert.equal(f.series({player:3}).get(h).value,0);
});

test('Premium counts require entitlement and owner, never sum with local counts or invent player identities',()=>{
  const rows=[roster(3),scan(20,7),scan(20,30,{owner:91}),scan(20,null,{hour:h-HOUR}),scan(20,0,{hour:h-2*HOUR})];
  const f=setup(rows),c=f.series().get(h);
  assert.equal(c.value,7);assert.equal(c.source,'premium');assert.deepEqual([...c.names],[3]);
  assert.equal(f.series().get(h-2*HOUR).value,0);assert.equal(f.series().has(h-HOUR),false);
  assert.equal(f.series({source:'scanner'}).get(h-HOUR).value,45);
  assert.equal(f.series({idle:true}).get(h).source,'local');
  assert.equal(setup(rows,false).series().get(h).value,1);
});

test('only independently attributable legacy sightings count and overlap with the archive once',()=>{
  const f=setup([roster(2)]);f.data.enemies=[{id:2,daysInFaction:5,updated:at},{id:3,daysInFaction:5,updated:at},{id:4,daysInFaction:0,updated:at}];
  for(const id of [2,3,4])f.data.activity['enemies:'+id]={hours:{[h/HOUR]:{count:3,online:2}}};
  let c=f.series().get(h);assert.equal(c.value,2);assert.equal(c.partial,true);assert.deepEqual([...c.names],[2,3]);
  f.archive.people.set(4,{memberships:[{faction:20,first:h-day,last:h+day}]});
  assert.equal(f.series().get(h).value,3);
});

test('period colouring uses each faction history, handles UTC boundaries and leaves uncovered dates unknown',()=>{
  const f=setup([scan(20,7),scan(20,2,{hour:h+HOUR}),scan(20,3,{hour:h+2*HOUR}),scan(20,1,{hour:h-day})]);
  f.data.enemyWars=[{factions:[20,30],start:(h-HOUR)/1000,end:(h+HOUR*1.5)/1000}];f.data.updated.enemyWars=at;
  assert.equal(f.series().get(h).period,'war');assert.equal(f.series().get(h+HOUR).period,'mixed');
  assert.equal(f.series({period:'peace'}).get(h+2*HOUR).value,3);assert.equal(f.series().get(h-day).period,'unknown');
});

test('weekday averages use observed dates in a single source and same-hour comparisons require comparable coverage',()=>{
  const f=setup([scan(20,6),scan(20,2,{hour:h-7*day}),scan(10,9),roster(2,{hour:h-HOUR,roster:1}),
    scan(10,2,{hour:h-HOUR}),scan(20,1,{hour:h+HOUR,partial:true}),scan(10,1,{hour:h+HOUR})]);
  const weekly=f.model({mode:'weekday'}).tables[1].rows;
  assert.equal(weekly.find(r=>r.label==='Wed').cells[8].value,4);
  assert.equal(weekly.find(r=>r.label==='Wed').cells[8].dates,2);
  assert.equal(weekly.find(r=>r.label==='Mon').cells[8],null);
  const m=f.model({mode:'compare'}),r=m.tables[0].rows.find(r=>r.key===h-8*HOUR);
  assert.equal(r.cells[8].value,3);assert.equal(r.cells[7],undefined);assert.equal(r.cells[9],undefined);
  const csv=f.csv(m,{...options,mode:'compare'}).split('\r\n');
  assert.equal(csv.length,14*24+1);assert.ok(csv.some(s=>s.includes('08,users,false,3,9,6,FFScouter')));
  assert.ok(csv.some(s=>s.includes('07,users,false,,,,,')));
});

test('retains dated last-action coverage and keeps individual Premium history inside verified membership',()=>{
  const f=setup([roster(2,{datedChecks:2,recentDated:1,recent:1}),roster(3,{datedChecks:0,recentDated:0,recent:0}),
    scan(20,null,{player:2}),scan(20,null,{player:2,hour:h-day})]);
  assert.equal(f.series({source:'recent'}).get(h).value,50);
  assert.equal(f.series({source:'scanner',player:2}).size,0);
  f.archive.people.set(2,{memberships:[{faction:20,first:h,last:h+HOUR}]});
  const player=f.series({source:'scanner',player:2});
  assert.equal(player.size,1);assert.equal(player.get(h).value,45);
});
