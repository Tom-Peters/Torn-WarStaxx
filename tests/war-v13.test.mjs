import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function slice(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Cannot isolate '+start+' to '+end);
 return source.slice(a,b);
}
function fixture(setup,start,end,out){
 return runInNewContext(setup+'\n'+slice(start,end)+';\n'+out);
}
test('Skull Capo can choose top percentage or minimum BSS without misclassifying unknown players',()=>{
 const setup=[
  'const n=Number,positive=Number;',
  "const cfg={heavyPolicy:{mode:'percent',percent:50,minBss:0}};",
  "const state={data:{enemies:[{id:1,bss:1000,level:10},{id:2,bss:800,level:99},"+
  "{id:3,bss:500,level:20},{id:4,bss:200,level:10},{id:5,bss:null,level:100}]}};",
  'const enemyBattleEstimate=p=>({value:p.bss,source:"spy"});'
 ].join('\n');
 const f=fixture(setup,'  function heavyRule(','  function enemyRole(',
   '({cfg,heavyRule,enemyRoleBands})');
 let band=f.enemyRoleBands();
 assert.equal(band.heavyCount,2);
 assert.ok(band.heavy.has(1)&&band.heavy.has(2));
 assert.ok(!band.heavy.has(5)&&!band.regular.has(5),'No BSS stays unclassified');
 f.cfg.heavyPolicy={mode:'min-bss',percent:50,minBss:500};
 band=f.enemyRoleBands();
 assert.equal(band.heavyCount,3);
 assert.ok(band.heavy.has(3)&&band.regular.has(4));
 assert.equal(f.heavyRule({mode:'percent',percent:4,minBss:0}).percent,5);
 assert.equal(f.heavyRule({mode:'percent',percent:101,minBss:0}).percent,100);
});
test('Black Skulls coverage reports uncovered enemy targets separately from verified assignments',()=>{
 const setup=[
  'const n=Number,positive=Number;',
  "const cfg={blackSkulls:{10:true,11:true},assignments:{10:101}};",
  "const state={data:{ours:[{id:10,name:'Alpha',status:'Okay'}, {id:11,name:'Bravo',status:'Okay'}],"+
  "enemies:[{id:101,name:'Enemy1',status:'Okay'}, {id:102,name:'Enemy2',status:'Okay'}]}};",
  'const rosterFresh=()=>true,memberState=p=>String(p.status).toLowerCase();',
  "const enemyRoleBands=()=>({heavy:new Set([101,102]),ranked:["+
    "{enemy:{id:101,name:'Enemy1',status:'Okay'},value:900,source:'BSS'},"+
    "{enemy:{id:102,name:'Enemy2',status:'Okay'},value:700,source:'BSS'}],"+
    "known:2,unknown:0,rule:{mode:'percent',percent:100,minBss:0}});",
  'const roleMatch=(friend,enemy)=>({match:{ratio:friend.id===10?.2:.3},score:99});'
 ].join('\n');
 const x=fixture(setup,'  function blackSkullsCoverage(','  function personalShortlist(',
    '({blackSkullsCoverage,cfg})');
 const r=x.blackSkullsCoverage();
 assert.equal(r.targets.length,2);
 assert.equal(r.unassigned,1);
 assert.equal(r.assigned,1);
 assert.equal(r.verifiedAssigned,1);
 assert.equal(r.targets[0].enemy.id,102,'Unassigned targets sort first');
 assert.equal(r.targets[0].free[0].player.id,11,'Only an unassigned verified skull can take the gap');
});
test('Enemy scoring hits are tracked as conceded points, not a deduction from our personal score',()=>{
 const setup=[
  'const n=Number,positive=Number,officialNumber=v=>v===null||v===undefined?null:Number(v);',
  "const cfg={ourId:1,blackSkulls:{10:true}};",
  "const state={data:{war:{id:44},ours:[{id:10},{id:20}],updated:{attacks:Date.now()},reports:{}}};",
  "let attacks=[{side:'ours',attacker:10,defender:100,respect:30,at:1},"+
    "{side:'enemies',attacker:100,defender:10,respect:8,at:2},"+
    "{side:'enemies',attacker:101,defender:10,respect:0,at:3},"+
    "{side:'enemies',attacker:100,defender:20,respect:12,at:4}];",
  'const warAttackRows=()=>attacks;'
 ].join('\n');
 const f=fixture(setup,'  function inboundWarImpact(','  function ownHistoricalEfficiency(',
   '({inboundWarImpact,setAttacks:x=>attacks=x})');
 let impact=f.inboundWarImpact(44);
 assert.equal(impact.total,20);
 assert.equal(impact.byMember[10].enemyScore,8);
 assert.equal(impact.byMember[10].attacks,2);
 assert.equal(impact.byMember[10].scoringAttacks,1);
 assert.equal(impact.byMember[20].enemyScore,12);
 f.setAttacks([]);
 assert.equal(f.inboundWarImpact(44).known,false,'No incoming feed must remain unknown, not zero');
});
test('Squad reports preserve in-war Black Skulls identity and use official earned / captured incoming separately',()=>{
 const setup=[
  'const n=Number,positive=Number,officialNumber=v=>v===null||v===undefined?null:Number(v);',
  "const cfg={ourId:1,blackSkulls:{10:true}};",
  "const state={data:{war:{id:44},ours:[{id:10},{id:20}],updated:{attacks:Date.now()},"+
  "reports:{44:{factions:[{id:1,members:[{id:10,name:'Skull',score:200,attacks:10},"+
  "{id:20,name:'Regular',score:90,attacks:6}]}]}}}};",
  "const warAttackRows=()=>[{side:'enemies',attacker:100,defender:10,respect:45,at:1},"+
   "{side:'enemies',attacker:100,defender:20,respect:15,at:2}];"
 ].join('\n');
 const f=fixture(setup,'  function inboundWarImpact(','  function ownHistoricalEfficiency(',
   '({cfg,warSquadSnapshot,snapshotWarSquads,squadWarSummary})');
 f.snapshotWarSquads(44);
 f.cfg.blackSkulls={20:true};
 const skull=f.squadWarSummary(44,'black'),regular=f.squadWarSummary(44,'regular');
 assert.equal(skull.points,200);
 assert.equal(skull.attacks,10);
 assert.equal(skull.enemyPointsReceived,45);
 assert.equal(skull.netProxy,155);
 assert.equal(regular.points,90);
 assert.equal(regular.enemyPointsReceived,15);
 assert.equal(regular.netProxy,75);
 assert.ok(skull.squadSource.includes('during this war'));
});
test('Shared orders include strength policy but no Torn keys or spy records',()=>{
 const setup=[
  "const cfg={key:'SECRET-TORN',ffKey:'SECRET-FF',"+
  "assignments:{10:100},blackSkulls:{10:true},hitterRisk:{},controlAssignments:{},"+
  "heavyPolicy:{mode:'min-bss',percent:50,minBss:400},"+
  "spies:{100:{speed:987}},notes:{10:'PRIVATE'}};",
  'const state={data:{ours:[{id:10}]}};',
  'const hitterRisk=id=>({mode:"balanced"});',
  'const heavyRule=()=>({mode:"min-bss",percent:50,minBss:400});',
  'const currentPlanKey=()=> "war:44",turtlePlan=()=>({mode:"balanced",members:{}});',
  'const hitterPlanStatus=()=> "not-set";'
 ].join('\n');
 const x=fixture(setup,'  function sharedPayload(){','  function sharedHasLocalOrders(){',
   '({sharedPayload})');
 const obj=x.sharedPayload(),body=JSON.stringify(obj);
 assert.equal(obj.heavyPolicy.minBss,400);
 for(const word of ['SECRET-TORN','SECRET-FF','PRIVATE','speed'])
   assert.ok(!body.includes(word),'No secret fields in shared payload: '+word);
});
test('Skull Capo screen, custom controls and dual after-action reports are wired',()=>{
 for(const token of [
  "const ID='war', VER='1.3.0'",
  "leader:'Skull Capo command'",
  "SKULL CAPO | BLACK SKULLS COMMAND",
  "id=\"ws-heavy-mode\"","id=\"ws-heavy-percent\"","id=\"ws-heavy-bss\"",
  "action==='save-heavy-cutoff'",
  "action.startsWith('skull-assign:')",
  "function blackSkullsCoverageCard(",
  "function squadWarSummary(",
  "squadReportCard(r.id,'black')",
  "squadReportCard(r.id,'regular')",
  "function inboundWarImpact(",
  "Net impact proxy","Enemy points conceded",
  "const primary=['overview','enemy','reports']"
 ])assert.ok(source.includes(token),'Missing '+token);
 assert.doesNotMatch(source,/[^\x00-\x7f]/);
 assert.doesNotThrow(()=>new Script(source));
});
