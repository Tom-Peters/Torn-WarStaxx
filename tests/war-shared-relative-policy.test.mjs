import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const worker=readFileSync(new URL('../shared-worker/src/index.js',import.meta.url),'utf8');
const script=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const between=(text,start,end)=>{
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing code region '+start);
  return text.slice(a,b);
};
const clean=runInNewContext(
  between(worker,'function validMap(','// Initialise the same schema')+';clean',
  {Number,Object,Array,JSON});
const plan={
  assignments:{10:900},blackSkulls:{10:true},
  hitterRisk:{10:{mode:'balanced'}},controlAssignments:{},
  turtlePlan:{mode:'balanced',members:{}},leaderDuties:{},
  heavyPolicy:{version:2,mode:'relative',percent:40,minBss:0}
};

test('Worker accepts current relative heavy targeting and retains policy version',()=>{
  const value=clean(plan);
  assert.ok(value,'Current default WarStaxx policy must not cause PUT 400');
  assert.equal(value.heavyPolicy.mode,'relative');
  assert.equal(value.heavyPolicy.version,2);
  assert.equal(value.assignments[10],900);
});
test('Worker remains compatible with old policy and rejects invalid modes/versions',()=>{
  assert.equal(clean({...plan,heavyPolicy:{mode:'percent',percent:40,minBss:0}}).heavyPolicy.mode,'percent');
  assert.equal(clean({...plan,heavyPolicy:{mode:'min-bss',percent:40,minBss:500}}).heavyPolicy.mode,'min-bss');
  assert.equal(clean({...plan,heavyPolicy:{version:3,mode:'relative',percent:40,minBss:0}}),null);
  assert.equal(clean({...plan,heavyPolicy:{version:2,mode:'invalid',percent:40,minBss:0}}),null);
});
test('WarStaxx can apply a shared relative policy without losing Black Skull orders',()=>{
  const cfg={ourId:57819,enemyId:800,heavyPolicy:{mode:'percent',percent:40,minBss:0},
    assignments:{},ordersByEnemy:{},blackSkulls:{},hitterRisk:{},
    controlAssignments:{},turtlePlans:{},planStatus:{}};
  const state={data:{war:{id:1234},ours:[]}};
  const ctx={cfg,state,Number,Object,Array,Math,Date,
    positive:v=>Number(v)>0?Number(v):0,
    currentPlanKey:()=> '1234',
    saveCfg:()=>true
  };
  const heavy=between(script,'  function heavyRule(','  function enemyRoleBands(){');
  const apply=between(script,'  function applySharedOrders(data){','  async function sharedPull(');
  runInNewContext(heavy+apply+';globalThis.acceptPlan=applySharedOrders;',ctx);
  assert.equal(ctx.acceptPlan(clean(plan)),true);
  assert.equal(cfg.heavyPolicy.mode,'relative');
  assert.equal(cfg.heavyPolicy.version,2);
  assert.equal(cfg.assignments[10],900);
  assert.equal(cfg.blackSkulls[10],true);
});
