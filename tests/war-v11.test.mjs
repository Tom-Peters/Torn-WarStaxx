import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const part=(start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Expected '+start+' before '+end);
  return source.slice(a,b);
};
const fixture=(setup,a,b,expose)=>runInNewContext(setup+'\n'+part(a,b)+';\n'+expose);

test('official chain count, timeout and next 10/25/50 milestone',()=>{
  const setup=[
    'const MIN=60000,n=Number,officialNumber=x=>x===null||x===undefined?null:Number(x);',
    'const state={data:{chain:{}}};'
  ].join('\n');
  const f=fixture(setup,'  const chainMilestones=','  function hitterRisk(',
    '({chainSnapshot,chainStatus,state})');
  const at=Date.now();
  f.state.data.chain=f.chainSnapshot({chain:{current:24,timeout:271,modifier:1.24,max:2000}},at);
  assert.equal(f.state.data.chain.next,25);
  assert.equal(f.state.data.chain.nextIn,1);
  assert.equal(f.chainStatus(at+1000).remaining,270);
  assert.equal(f.chainStatus(at+200000).fresh,false);
});
test('individual hitter risk threshold and recorded-win minimum',()=>{
  const setup='const positive=Number,cfg={hitterRisk:{3:{mode:"safe"},4:{mode:"aggressive"}}};';
  const f=fixture(setup,'  function hitterRisk(','  function learnedYield(',
    '({hitterRisk,cfg})');
  assert.equal(f.hitterRisk(3).maxRatio,0.55);
  assert.equal(f.hitterRisk(3).minWins,1);
  assert.equal(f.hitterRisk(4).maxRatio,0.78);
  assert.equal(f.hitterRisk(0).mode,'balanced');
});
test('learning excludes milestone hits, unusual bonuses and nonwinning attempts',()=>{
  const setup=[
    'const n=Number,positive=Number,officialNumber=v=>v===null||v===undefined?null:Number(v);',
    'const chainMilestones=[10,25,50,100];'
  ].join('\n');
  const f=fixture(setup,'  function learnedYield(','  function warAttackInsights(',
    '({learnedYield})');
  const rows=[
    {attacker:2,defender:3,respect:12,chain:11,at:100},
    {attacker:2,defender:3,respect:14,chain:12,at:200},
    {attacker:2,defender:3,respect:1000,chain:25,at:300},
    {attacker:2,defender:3,respect:80,chain:13,at:400,modifierRetaliation:1.5},
    {attacker:2,defender:3,respect:0,chain:14,at:500}
  ];
  const result=f.learnedYield({id:2},{id:3},10,rows);
  assert.equal(result.samples,2);
  assert.ok(result.actual>12&&result.actual<15);
  assert.ok(result.pointsPer25>10&&result.pointsPer25<15);
  assert.equal(f.learnedYield({id:2},{id:3},10,[rows[0]]).source,undefined);
  assert.equal(f.learnedYield({id:2},{id:3},10,[rows[0]]).pointsPer25,10);
});
test('risk-aware recommendations require verified comparable manual spies',()=>{
  const setup=[
    'const MIN=60000,n=Number,positive=Number,spy=id=>({id}),bsScore=()=>100;',
    'const activeWarNow=()=>true,rosterFresh=()=>true;',
    "const memberState=p=>p.status.toLowerCase();",
    "const friend={id:7,status:'Okay'},state={data:{war:{id:5},enemies:[{id:88,status:'Okay',level:40}]}};",
    "const cfg={enableAttacks:false,blackSkulls:{}},warAttackRows=()=>[];",
    'let mode="safe",ratio=0.5,wins=0,verified=true;',
    'const hitterRisk=()=>({mode,maxRatio:mode==="safe"?.55:mode==="aggressive"?.78:.70,minWins:mode==="safe"?1:0});',
    'const matchEvidence=()=>({verified,rosterVerified:true,tier:ratio>=.7?1:0,conflict:false,'+
      'encounters:{wins,losses:0},match:{ff:2,ratio},score:90});',
    'const learnedYield=(f,p,model)=>({pointsPer25:model,actual:null,samples:0,confidence:"Model only"});',
    'const enemyRoleBands=()=>({}),roleAllows=()=>true;',
    "const ourWarReadiness=()=>({kind:'okay',player:friend});"
  ].join('\n');
  const f=fixture(setup,'  function efficiencyHits(','  function turtleWindow(',
    '({bestEfficiencyHit,setMode:x=>mode=x,setWins:x=>wins=x,setVerified:x=>verified=x,setRatio:x=>ratio=x})');
  assert.equal(f.bestEfficiencyHit(),null,'Safe mode demands a recorded win');
  f.setWins(1);
  assert.equal(f.bestEfficiencyHit().player.id,88);
  f.setRatio(.75);
  assert.equal(f.bestEfficiencyHit(),null,'Safe mode rejects closer opponent');
  f.setMode('aggressive');
  assert.equal(f.bestEfficiencyHit().player.id,88);
  f.setVerified(false);
  assert.equal(f.bestEfficiencyHit(),null,'No mode bypasses verified spies');
});
test('shared payload explicitly excludes keys, spies, notes and private readiness',()=>{
  const setup=[
    "const cfg={key:'TORN-SECRET',ffKey:'FF-SECRET',assignments:{5:100},blackSkulls:{5:true},",
    "hitterRisk:{5:{mode:'safe'}},controlAssignments:{'war:4':{100:5}},spies:{100:{strength:999}},",
    "notes:{100:'private'},shared:{enabled:true,endpoint:'https://unit.test',token:'READ-SECRET'}};",
    'const currentPlanKey=()=>"war:4",hitterRisk=()=>({mode:"safe"});',
    'const state={data:{ours:[{id:5}]}};',
    'const turtlePlan=()=>({mode:"balanced",members:{5:"strike"}});',
    'const heavyRule=()=>({mode:"percent",percent:40,minBss:0});',
    'const hitterPlanStatus=()=>("engaged");'
  ].join('\n');
  const f=fixture(setup,'  function sharedPayload(){','  function sharedHasLocalOrders(){',
    '({sharedPayload})');
  const payload=f.sharedPayload();
  assert.equal(payload.assignments[5],100);
  assert.equal(payload.blackSkulls[5],true);
  const body=JSON.stringify(payload);
  for(const secret of ['TORN-SECRET','FF-SECRET','READ-SECRET','private','strength'])
    assert.ok(!body.includes(secret),'Leaked forbidden value '+secret);
});
test('automatic sync has scoped path, revision conflicts, foreground-only polling and controls',()=>{
  for(const token of ['function sharedScope()','function sharedEndpoint()',
    'function sharedRequest(method,revision,payload)','If-Match',
    'function applySharedOrders(data)','function sharedPull(discardLocal=false)',
    'function sharedPush()','function markSharedDirty()',
    'state.sharedEditVersion!==editVersion',
    "b('Discard local and pull shared','shared-adopt')",
    "b('Publish my local orders','shared-push')",
    "data-skull-risk","if(!document.hidden&&sharedEndpoint()&&sharedScope())"])
    assert.ok(source.includes(token),'Missing sync wiring '+token);
  assert.ok(!source.includes('GM_xmlhttpRequest({method:"POST"'));
  assert.match(source,/\/\/ @version\s+1\.6\.0/);
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
});
test('after-action reports contain energy proxy, leader efficiency and target scoring',()=>{
  for(const token of ['function warAttackInsights(id)','hitEvidence,topTargets:targets,maxObservedChain',
    'Observed own attempts','Estimated energy spent','Captured respect / E',
    'Most efficient observed enemy targets','Official points per attack',
    'pendingAfterAction','lastDebriefAttempt'])
    assert.ok(source.includes(token),'Missing post-war report detail '+token);
  assert.ok(source.includes('sources')===false||source.length>0);
});
