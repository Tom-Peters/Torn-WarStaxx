import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const start=code.indexOf('  function ownFactionFrom(');
const end=code.indexOf('  async function refreshHistory(force=false){',start);
assert.ok(start>0&&end>start,'Faction identity logic found');
const extract=code.slice(start,end);
function simulate({cfg={},responses={},fail=[],now=1762250000000}={}){
 const calls=[];
 const data={ours:[{id:77}],enemies:[{id:88}],ourWars:[{id:11}],enemyWars:[{id:22}],
   war:{id:9},updated:{wars:1,ours:1,enemies:1},errors:{},backoff:{},meta:{}};
 const config={factionAuto:true,ourId:0,factionSource:'',factionVerifiedAt:0,enemyId:22,...cfg};
 let saves=0;
 const sandbox={cfg:config,state:{data},Date:{now:()=>now},HOUR:3600000,
 positive:v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0,
 n:v=>Number.isFinite(Number(v))?Number(v):0,
 saveCfg:()=>{saves++;return true},
 call:async(path,kind,minAge)=>{calls.push([path,kind,minAge]);if(fail.includes(path))throw new Error('Denied');return responses[path]??null}
 };
 const fns=runInNewContext(extract+'\n({ownFactionFrom,identify})',sandbox,{timeout:1000});
 return {...fns,config,data,calls,get saves(){return saves}};
}
test('primary source Torn API v2 key/info user.faction_id works with minimal custom key',async()=>{
 const a=simulate({responses:{'/key/info':{user:{id:999,faction_id:4321,company_id:678}}}});
 assert.equal(await a.identify(),4321);
 assert.equal(a.config.ourId,4321);
 assert.equal(a.config.factionSource,'Torn key/info');
 assert.equal(a.calls.length,1,'no redundant requests once authoritative ID is known');
 assert.equal(a.saves,1);
});
test('user/faction fallback if key info denied',async()=>{
 const a=simulate({fail:['/key/info'],responses:{'/user/faction':{faction:{id:4567,name:'Example'}}}});
 assert.equal(await a.identify(),4567);
 assert.equal(a.calls.length,2);
 assert.equal(a.config.factionSource,'Torn user/faction');
});
test('legacy profile fallback handles missing nested factions safely',async()=>{
 const a=simulate({responses:{'/user/profile':{profile:{faction:{faction_id:8701}}}}});
 assert.equal(await a.identify(),8701);
 assert.equal(a.calls.length,3);
 assert.equal(a.config.factionSource,'Torn user/profile');
});
test('player id alone is never mistaken for faction id',async()=>{
 const a=simulate({responses:{'/key/info':{user:{id:999}}}});
 assert.equal(await a.identify(),0);
 assert.equal(a.config.ourId,0);
 assert.equal(a.data.errors.identity.includes('unavailable'),true);
});
test('auto revalidation updates changed faction without keeping stale live targets',async()=>{
 const a=simulate({cfg:{ourId:111,enemyId:222,factionVerifiedAt:0},responses:{'/key/info':{user:{faction_id:333}}}});
 assert.equal(await a.identify(),333);
 assert.equal(a.config.enemyId,0);
 assert.equal(a.data.ours.length,0);
 assert.equal(a.data.enemies.length,0);
 assert.equal(a.data.ourWars.length,0);
 assert.equal(a.data.war,null);
});
test('cached verified faction stays until next six-hour verification window',async()=>{
 const now=1762250000000;
 const a=simulate({now,cfg:{ourId:100,factionVerifiedAt:now-3600000}});
 assert.equal(await a.identify(),100);
 assert.equal(a.calls.length,0);
});
test('manual fallback is preserved and never queries the API',async()=>{
 const a=simulate({cfg:{ourId:88,factionAuto:false}});
 assert.equal(await a.identify(true),88);
 assert.equal(a.calls.length,0);
});
test('key owner with no faction clears stale faction identity',async()=>{
 const a=simulate({cfg:{ourId:111},responses:{'/key/info':{user:{id:9876,faction_id:null}}}});
 assert.equal(await a.identify(),0);
 assert.equal(a.config.ourId,0);
 assert.equal(a.config.enemyId,0);
});
test('temporary API failure preserves previous verified id',async()=>{
 const a=simulate({cfg:{ourId:111},fail:['/key/info','/user/faction','/user/profile']});
 assert.equal(await a.identify(),111);
 assert.equal(a.config.ourId,111);
 assert.equal(a.saves,0);
});
test('metadata, old settings and safety contract remain intact',()=>{
 assert.match(code,/\/\/ @version\s+1\.6\.0/);
 assert.match(code,/factionAuto:true/);
 assert.match(code,/Detect my faction now/);
 assert.match(code,/id="ws-auto-faction"/);
 assert.match(code,/\/key\/info/);
 assert.match(code,/\/user\/faction/);
 assert.match(code,/\/user\/profile/);
 assert.doesNotMatch(code,/[\u2018\u2019\u201C\u201D]/,'Torn PDA smart-quote parser regression');
});
