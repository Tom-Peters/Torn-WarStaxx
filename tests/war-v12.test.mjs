import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function part(a,b){
 const begin=source.indexOf(a),end=source.indexOf(b,begin+a.length);
 assert.ok(begin>=0&&end>begin,'Missing '+a+' or '+b);
 return source.slice(begin,end);
}
function fixture(setup,a,b,out){
 return runInNewContext(setup+'\n'+part(a,b)+';\n'+out);
}
test('FFScouter and manual BSS partition toughest 40% for Black Skulls',()=>{
 const setup=[
   'const positive=Number,n=Number,HOUR=3600000;',
   'const spy=id=>id===1?{bss:500,observedAt:Date.now()}:null;',
   'const bsScore=s=>s?.bss??null;',
   'const ffscouter=id=>({bss:({2:250,3:150,4:100,5:75})[id]||null});',
   'const ffIsStale=()=>false;',
   "const cfg={blackSkulls:{20:true},heavyPolicy:{mode:'percent',percent:40,minBss:0}};",
   'const state={data:{ours:[],enemies:['+
     '{id:1,level:10,status:"Okay"},{id:2,level:99,status:"Okay"},'+
     '{id:3,level:30,status:"Okay"},{id:4,level:40,status:"Hospital"},'+
     '{id:5,level:15,status:"Okay"},{id:6,level:100,status:"Okay"}]}};',
   'const hitterRisk=()=>({mode:"balanced",maxRatio:.70,minWins:0});',
   'const concessionSnapshot=()=>null;',
   'const matchEvidence=()=>null;'
 ].join('\n');
 const f=fixture(setup,'  function enemyBattleEstimate(','  function personalShortlist(',
   '({enemyBattleEstimate,enemyRoleBands,enemyRole,roleAllows,state})');
 const bands=f.enemyRoleBands();
 assert.equal(bands.known,5);
 assert.equal(bands.unknown,1);
 assert.equal(bands.heavyCount,2);
 assert.ok(bands.heavy.has(1)&&bands.heavy.has(2));
 assert.ok(bands.regular.has(3)&&bands.regular.has(4)&&bands.regular.has(5));
 assert.equal(f.enemyRole({id:6},bands),'unclassified','Level alone never substitutes for BSS');
 assert.equal(f.roleAllows({id:20},{id:1},bands),true);
 assert.equal(f.roleAllows({id:21},{id:1},bands),false);
 assert.equal(f.roleAllows({id:21},{id:3},bands),true);
 f.state.data.enemies[0].status='Hospital';
 assert.equal(f.enemyRoleBands().heavy.has(1),true,'Hospital changes do not reallocate the bands');
});
test('suggested manual drafts allocate hardest available known-BSS targets only to Black Skulls',()=>{
 const setup=[
   'const n=Number,positive=Number;',
   'const cfg={blackSkulls:{10:true},assignments:{}};',
   "const state={data:{ours:[{id:10,status:'Okay'},{id:11,status:'Okay'}],"+
     "enemies:[{id:100,status:'Okay',bss:300},{id:101,status:'Okay',bss:80}]}};",
   'const memberState=p=>p.status.toLowerCase(),rosterFresh=()=>true;',
   'const hitterReadiness=()=>({energyEnough:true});',
   'const enemyRoleBands=()=>({heavy:new Set([100]),regular:new Set([101])});',
   'const roleAllows=(friend,enemy)=>Boolean(cfg.blackSkulls[friend.id])=== (enemy.id===100);',
   'const enemyBattleEstimate=p=>({value:p.bss});',
   'const roleMatch=(friend,enemy)=>({score:90,tier:0,reliability:"Verified",reason:"Favourable",category:"Strong candidate"});'
 ].join('\n');
 const f=fixture(setup,'  function suggestedDraft(','  function assignments(',
   '({suggestedDraft})');
 const list=f.suggestedDraft();
 assert.equal(list.length,2);
 assert.equal(list.find(x=>x.friend.id===10).enemy.id,100);
 assert.equal(list.find(x=>x.friend.id===11).enemy.id,101);
});
test('synced orders include turtle strategy and leadership statuses, never API secrets',()=>{
 const setup=[
   'const cfg={key:"TORN-SECRET",ffKey:"FF-SECRET",'+
     'assignments:{10:100},blackSkulls:{10:true},hitterRisk:{10:{mode:"safe"}},'+
     'controlAssignments:{"war:1":{100:10}},notes:{100:"private"},spies:{100:{strength:999}}};',
   'const state={data:{ours:[{id:10},{id:11}]}};',
   'const currentPlanKey=()=> "war:1",hitterRisk=()=>({mode:"safe"});',
   'const turtlePlan=()=>({mode:"full",members:{11:"turtle"}});',
   'const heavyRule=(value)=>value||{mode:"percent",percent:40,minBss:0};',
   'const hitterPlanStatus=id=>id===10?"engaged":"not-set";'
 ].join('\n');
 const x=fixture(setup,'  function sharedPayload(){','  function sharedHasLocalOrders(){',
   '({sharedPayload})');
 const payload=x.sharedPayload();
 assert.equal(payload.turtlePlan.mode,'full');
 assert.equal(payload.turtlePlan.members[11],'turtle');
 assert.equal(payload.leaderDuties[10],'engaged');
 const raw=JSON.stringify(payload);
 for(const forbidden of ['TORN-SECRET','FF-SECRET','private','strength'])
   assert.ok(!raw.includes(forbidden),'Leaked '+forbidden);
});
test('shared role sync applies only scoped war duties without deleting other war plans',()=>{
 const setup=[
   'const positive=Number;',
   'const cfg={assignments:{},ordersByEnemy:{},blackSkulls:{},hitterRisk:{},'+
     'controlAssignments:{},turtlePlans:{"war:2":{mode:"defensive",members:{77:"turtle"}}},'+
     'planStatus:{"war:2:member:88":"support","war:1:member:10":"ready"},enemyId:20};',
   'const state={data:{war:{id:1}}};',
   'const currentPlanKey=()=> "war:1",saveCfg=()=>true;',
   'const heavyRule=(value)=>value||{mode:"percent",percent:40,minBss:0};'
 ].join('\n');
 const x=fixture(setup,'  function applySharedOrders(data){','  async function sharedPull(',
   '({applySharedOrders,cfg})');
 const data={assignments:{10:100},blackSkulls:{10:true},hitterRisk:{10:{mode:"safe"}},
   controlAssignments:{100:10},turtlePlan:{mode:'full',members:{11:'turtle'}},
   leaderDuties:{10:'engaged'}};
 assert.equal(x.applySharedOrders(data),true);
 assert.equal(x.cfg.turtlePlans['war:1'].members[11],'turtle');
 assert.equal(x.cfg.planStatus['war:1:member:10'],'engaged');
 assert.equal(x.cfg.planStatus['war:2:member:88'],'support');
 assert.equal(x.cfg.turtlePlans['war:2'].mode,'defensive');
});
test('past-war hitter comparison needs two comparable reports and five attacks',()=>{
 const setup=[
   'const n=Number,positive=Number,officialNumber=x=>x===null||x===undefined?null:Number(x);',
   'const cfg={ourId:1},state={data:{war:{id:9},'+
     'ourWars:[{id:7,end:100},{id:8,end:200}],'+
     'reports:{'+
       '7:{factions:[{id:1,members:[{id:10,score:120,attacks:10}]}]},'+
       '8:{factions:[{id:1,members:[{id:10,score:100,attacks:10}]}]},'+
       '9:{factions:[{id:1,members:[{id:10,score:35,attacks:10}]}]}'+
     '},ours:[{id:10,name:"Skull"}]}};',
   'const warHitLedger=()=>({ours:{players:{}}});',
   'const inboundWarImpact=()=>({known:false,byMember:{}});',
   'const liveWarMemberImpact=()=>({known:false,earned:null,given:null,net:null});'
 ].join('\n');
 const f=fixture(setup,'  function ownHistoricalEfficiency(','  function bonusHitRecommendation(',
   '({ownHistoricalEfficiency,memberPerformance})');
 assert.equal(f.ownHistoricalEfficiency(10,9).samples,2);
 const current=f.memberPerformance({id:10,name:'Skull'},9);
 assert.equal(current.flag,true);
 assert.equal(current.status,'Below own historical points per attack');
 assert.ok(current.baseline>10);
});
test('four-layer navigation and existing advanced pages remain functional',()=>{
 for(const token of [
   "const sections=['overview','enemy','reports','leader','skulls'",
   "labels={overview:'Live war',enemy:'Players',reports:'Tools & reports'",
   "const primary=['overview','enemy','reports']",
   "if(!activeWarNow()){",
   'WARSTAXX | STANDBY',
   "btn('OPPONENT','enemy')",
   "function enemyScreen()",
   "function reportsScreen()",
   "function leaderScreen()",
   "function blackSkullsRoom()",
   "function bonusTargetCard()",
   "function leaderboardCard(",
   "function blackSkullsPerformanceCard(",
   "function bonusHitRecommendation()",
   "function roleMatch(",
   "markSharedDirty();confirmed('Manual duty",
   "const pages={overview:warWorkspace,enemy:rosterWorkspace,reports:archiveWorkspace,dashboard:overview,scouting:enemyScreen,archive:reportsScreen,leader:leaderScreen",
   "function warQuick(action)"
 ])assert.ok(source.includes(token),'Missing '+token);
 assert.match(source,/\/\/ @version\s+2\.6\.0/);
 assert.doesNotMatch(source,/[^\x00-\x7f]/);
 assert.doesNotThrow(()=>new Script(source));
});
