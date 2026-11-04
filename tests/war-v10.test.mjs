import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function slice(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing source region '+start+' to '+end);
  return source.slice(a,b);
}
function fixture(setup,from,to,expose){
  return runInNewContext(setup+'\n'+slice(from,to)+';\n'+expose);
}
test('highest reliable points per 25 energy outranks level and excludes unavailable opponents',()=>{
  const setup=[
    'const MIN=60000,n=Number,positive=Number;',
    "const self={id:1,name:'Us',status:'Okay'};",
    "const cfg={enableAttacks:false,blackSkulls:{}},state={data:{war:{id:500},enemies:["+
      "{id:101,status:'Okay',level:95},{id:102,status:'Okay',level:20},"+
      "{id:103,status:'Hospital',level:100}]}};",
    'const memberState=p=>p.status.toLowerCase();',
    'const activeWarNow=()=>true,rosterFresh=()=>true;',
    'const bsScore=x=>x?100:null,spy=id=>({id});',
    'let blocked=new Set();',
    'const matchEvidence=(friend,enemy)=>({tier:blocked.has(enemy.id)?4:0,'+
      'rosterVerified:true,verified:true,conflict:false,encounters:{losses:0},'+
      'match:{ff:enemy.id===102?3:1.1,ratio:0.5},score:60});',
    "const ourWarReadiness=()=>({kind:'okay',player:self});",
    'const warAttackRows=()=>[];',
    'const hitterRisk=()=>({mode:"balanced",maxRatio:0.70,minWins:0});',
    'const enemyRoleBands=()=>({heavy:new Set([102,101]),regular:new Set(),known:2});',
    'const roleAllows=()=>true;',
    'const learnedYield=(f,p,model)=>({pointsPer25:model,actual:null,samples:0,confidence:"Model only"});'
  ].join('\n');
  const x=fixture(setup,'  function efficiencyHits(','  function turtleWindow(',
    '({bestEfficiencyHit,efficiencyHits,blocked,state})');
  assert.equal(x.bestEfficiencyHit().player.id,102);
  assert.ok(x.bestEfficiencyHit().pointsPerEnergy>0);
  x.blocked.add(102);
  assert.equal(x.bestEfficiencyHit().player.id,101);
  x.state.data.enemies[0].status='Hospital';
  assert.equal(x.bestEfficiencyHit(),null);
});
test('turtle coverage responds to pressure, posture, hospital time and Black Skull duty',()=>{
  const setup=[
    'const MIN=60000,n=Number;',
    "let self={id:1,kind:'okay',player:{until:0}};",
    'const cfg={blackSkulls:{}};',
    'const t={ownFresh:true,enemyFresh:true,score:{net:100},plan:{mode:"balanced"},'+
      'online:2,enemyOnline:10,pace:{measurable:true,last:{at:Date.now()},rateEnemy:80}};',
    'const ourWarReadiness=()=>self,turtleAssessment=()=>t,activeWarNow=()=>true;'
  ].join('\n');
  const x=fixture(setup,'  function turtleWindow(','  function availabilityTransitions(',
    '({turtleWindow,cfg,t,setSelf(v){self=v}})');
  assert.equal(x.turtleWindow().minutes,90);
  x.t.plan.mode='full';
  assert.equal(x.turtleWindow().minutes,120);
  x.setSelf({id:1,kind:'hospital',player:{until:Date.now()+70*60000}});
  assert.ok(x.turtleWindow().shortfall>=49&&x.turtleWindow().shortfall<=51);
  x.setSelf({id:1,kind:'okay',player:{until:0}});
  x.cfg.blackSkulls[1]=true;
  assert.equal(x.turtleWindow().minutes,null);
});
test('high-priority transition alerts require observed state change and stay war-scoped',()=>{
  const setup=[
    'const MIN=60000,n=Number,positive=Number;',
    'const cfg={assignments:{},priorityNotifications:true};',
    "const state={data:{war:{id:500},enemies:[{id:101,name:'Watcher',status:'Okay'}],availabilityEvents:{}}};",
    'const memberState=p=>p.status.toLowerCase();',
    'const watchedTargetIds=()=>new Set([101]),enemyThreatRows=()=>[];',
    'const activeWarNow=()=>true,rosterFresh=()=>true;'
  ].join('\n');
  const x=fixture(setup,'  function availabilityTransitions(','  function strongestVerifiedHit(',
    '({availabilityTransitions,recordAvailability,priorityOpportunities,state,cfg})');
  const before=[{id:101,name:'Watcher',status:'Hospital'}],
    after=[{id:101,name:'Watcher',status:'Okay'}];
  assert.equal(x.recordAvailability([],after,500).length,0,'Never alert on initial discovery');
  assert.equal(x.recordAvailability(before,after,500).length,1);
  assert.equal(x.priorityOpportunities().length,1);
  assert.equal(x.recordAvailability(after,after,500).length,0,'No repeated transition');
  x.cfg.priorityNotifications=false;
  assert.equal(x.priorityOpportunities().length,0,'Respects user preference');
  x.cfg.priorityNotifications=true;
  x.state.data.war.id=501;
  assert.equal(x.priorityOpportunities().length,0,'No alerts from previous wars');
});
test('live strip supports automatic compact mode, alert links, skull orders and manual actions',()=>{
  for(const term of ['function handleWarScroll(e)','position:sticky;top:3px',
    "btn('TURTLE','turtle')",'function bestEfficiencyHit()',
    'function blackSkullsRoom()',"skulls:blackSkullsRoom",
    'function focusOpportunity(id)','availabilityEvents',
    'function turtleWindow(','async function verifyHealedThenHit()',
    "cfg.priorityNotifications=Boolean($('#ws-priority-notifications'"]){
    assert.ok(source.includes(term),'Missing integration '+term);
  }
  assert.match(source,/\/\/ @version\s+1\.4\.0/);
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotThrow(()=>new Script(source.replace(/[\u2018\u2019]/g,"'")));
});
