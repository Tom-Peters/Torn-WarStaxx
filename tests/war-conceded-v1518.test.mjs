import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const from=source.indexOf('  function concessionRecord(');
const until=source.indexOf('  function inboundWarImpact(',from);
assert.ok(from>0&&until>from,'Live concession aggregation functions exist');
const excerpt=source.slice(from,until);

function fixture(){
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
  let calls=0;
  const scope=createContext({
    state,cfg,MIN:60000,Date,Math,Object,Number,String,Boolean,
    positive:value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0,
    n:value=>Number.isFinite(Number(value))?Number(value):0,
    officialNumber:value=>value!==null&&value!==undefined&&value!==''&&
      Number.isFinite(Number(value))?Number(value):null,
    warAttackWindow:()=>({id:71,ourId:11,enemyId:22,start,end:now+1000}),
    activeWarNow:()=>true,isNativeWarPage:()=>true,effectiveKey:()=>true,
    canCall:()=>true,warAttackRows:()=>[],
    call:async()=>({attacks:++calls===1?first:second}),
    parseArray:value=>value,unpack:value=>value.attacks,
    attacks:value=>value.attacks,save:()=>true,
  });
  new Script(excerpt+';globalThis.exposed={concessionSnapshot,refreshWarConcessions,concessionRecord};')
    .runInContext(scope);
  return {state,...scope.exposed,getCalls:()=>calls,first};
}

test('points conceded count only ranked hits from enemy faction on our own members',async()=>{
  const f=fixture();
  await f.refreshWarConcessions();
  const partial=f.concessionSnapshot(71);
  assert.equal(partial.complete,false);
  assert.equal(partial.partial,true);
  assert.equal(partial.rows,97);
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
  assert.equal(f.getCalls(),2);
});

test('unavailable data is not rendered as zero and incoming API permission is explained',()=>{
  assert.match(source,/present=Boolean\(concessions\?\.known&&\(concessions\.complete\|\|received\)\)/);
  assert.ok(source.includes(String.raw`present?prefix+fmt(received?.enemyScore||0):'\u2014'`));
  assert.ok(source.includes('Limited faction attacks API data'));
  assert.ok(source.includes('data-wsnw-chip="conceded"'));
  assert.ok(source.includes('data-wsnw-chip="received"'));
  assert.ok(source.includes('Given pts'));
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
