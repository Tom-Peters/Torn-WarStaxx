import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const part=(start,end)=>{
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert.ok(from>=0&&to>from,'Missing section '+start+' through '+end);
  return source.slice(from,to);
};
function matchingFixture(){
  const setup=[
    'const MIN=60000,HOUR=3600000;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
    'const fmt=v=>String(v);',
    'const now=Date.now();',
    "const cfg={ourId:10,enemyId:20,assignments:{},watchlist:{},hitterRisk:{},blackSkulls:{1:true,2:true},heavyPolicy:{mode:'min-bss',minBss:0,percent:100},"+
      'spies:{1:{observedAt:now,bss:1000},2:{observedAt:now,bss:900},101:{observedAt:now,bss:300},102:{observedAt:now,bss:200}},'+
      'manualReadiness:{},planStatus:{}};',
    "const state={data:{war:{id:500},ours:[{id:1,name:'Alpha',status:'okay'},"+
      "{id:2,name:'Bravo',status:'okay'}],enemies:[{id:101,name:'Target One',status:'okay',until:0},"+
      "{id:102,name:'Target Two',status:'okay',until:0}, {id:103,name:'Hospital3',status:'hospital',until:0},{id:104,name:'Hospital4',status:'hospital',until:0}],updated:{ours:now,enemies:now},attacks:[]}};",
    'const spy=id=>cfg.spies[id]||null;',
    'const bsScore=p=>p?.bss??null;',
    "const memberState=p=>String(p.status||'unknown').toLowerCase();",
    'const isOnline=()=>false;',
    'const lastKnownMemberScore=()=>null;',
    'const attackHistoryFor=()=>({wins:0,losses:0,unknown:0,total:0,last:0});',
    'const hitterReadiness=()=>({energyEnough:null});',
    'const hitterRisk=()=>({mode:"balanced",maxRatio:.70,minWins:0});',
    'const ffscouter=id=>({bss:({103:80,104:60})[id]||null});',
    'const ffIsStale=()=>false;',
    'const concessionSnapshot=()=>null;',
    'const matchup=(friend,enemy)=>{const ratios={1:{101:0.35,102:0.45},2:{101:0.38,102:1.35}};'+
      "return {known:true,ratio:ratios[friend.id]?.[enemy.id],ff:2.5,exact:[101,102].includes(enemy.id),confidence:'Two recent spies'};};"
  ].join('\n');
  return runInNewContext(setup+part('  function rosterFresh(','  function assignments(){')+
    '; ({cfg,state,rosterFresh,enemyHospitalExit,watchedTargetIds,matchEvidence,personalShortlist,suggestedDraft})');
}
test('collision-aware matching covers two hitters instead of greedy double-booking',()=>{
  const m=matchingFixture(),drafted=m.suggestedDraft();
  assert.equal(drafted.length,2);
  const byHitter=Object.fromEntries(drafted.map(x=>[x.friend.id,x.enemy.id]));
  assert.equal(byHitter[1],102);
  assert.equal(byHitter[2],101);
  assert.equal(new Set(drafted.map(x=>x.enemy.id)).size,2);
  assert.ok(drafted.every(x=>x.category==='Strong candidate'));
});
test('manual assignments are never overwritten, and taken targets cannot be double booked',()=>{
  const m=matchingFixture();
  m.cfg.assignments[1]=101;
  assert.equal(m.suggestedDraft().length,0);
  assert.equal(m.cfg.assignments[1],101);
  delete m.cfg.assignments[1];
  m.cfg.assignments[2]=101;
  assert.equal(m.suggestedDraft().length,1);
  assert.equal(m.suggestedDraft()[0].enemy.id,102);
});
test('stale Torn roster prevents strong recommendations and any auto-draft',()=>{
  const m=matchingFixture();
  m.state.data.updated.enemies=Date.now()-8*60000;
  assert.equal(m.rosterFresh('enemies'),false);
  assert.equal(m.matchEvidence(m.state.data.ours[0],m.state.data.enemies[0]).category,'Refresh roster');
  assert.equal(m.suggestedDraft().length,0);
});
test('hospital timers come from current observed enemy status only',()=>{
  const m=matchingFixture(),now=Date.now(),p=m.state.data.enemies[0];
  p.status='hospital';p.until=now+14*60000;
  assert.equal(m.enemyHospitalExit(p,now).minutes,14);
  assert.equal(m.enemyHospitalExit(p,now).fresh,true);
  assert.equal(m.enemyHospitalExit({...p,status:'okay'},now),null);
  assert.equal(m.enemyHospitalExit({...p,until:0},now),null);
  assert.equal(m.enemyHospitalExit({...p,until:now+5*3600000},now),null);
  m.cfg.watchlist[101]=true;
  assert.equal(m.watchedTargetIds().has(101),true);
  m.state.data.updated.enemies=now-10*60000;
  assert.equal(m.enemyHospitalExit(p,now).fresh,false);
});
test('unknown energy is not reported as verified and known low energy blocks draft',()=>{
  const m=matchingFixture();
  assert.equal(m.suggestedDraft().length,2);
  assert.match(source,/hitterReadiness\(p,at\)\.energyEnough!==false/);
  assert.match(source,/unknown energy/i);
});
test('Operations tab, manual controls and safe user-script installer remain wired',()=>{
  for(const fragment of ['function operationalQueue(','function operations(){',
    'function operationalBrief(',"action==='copy-ops'","id:'hospital-exit-watch'",
    "b('Operations queue','tab:operations')","b('What to do now','tab:operations')",
    "'operations','ledger'"]){
    assert.ok(source.includes(fragment),'Missing integration: '+fragment);
  }
  assert.match(source,/\/\/ @version\s+2\.3\.0/);
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotThrow(()=>new Script(source.replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"')));
});

test('switching opponent isolates manual orders and restores previous faction on return',()=>{
  const setup=[
    'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
    'const cfg={enemyId:20,assignments:{1:101},ordersByEnemy:{}};',
    'const state={data:{enemies:[{id:101}],enemyWars:[],updated:{enemies:Date.now(),enemyWars:Date.now()}}};',
    'let writes=0;const saveCfg=()=>writes++;'
  ].join('\n');
  const x=runInNewContext(setup+part('  function setOpponent(','  function latestFinished(')+
    '; ({cfg,state,setOpponent,get writes(){return writes}})');
  assert.equal(x.setOpponent(30),true);
  assert.equal(x.cfg.enemyId,30);
  assert.equal(Object.keys(x.cfg.assignments).length,0);
  assert.equal(x.cfg.ordersByEnemy['20'][1],101);
  x.cfg.assignments[1]=201;
  assert.equal(x.setOpponent(20),true);
  assert.equal(x.cfg.assignments[1],101);
  assert.equal(x.cfg.ordersByEnemy['30'][1],201);
  assert.equal(x.setOpponent(20),false);
  assert.equal(x.state.data.enemies.length,0,'Old live roster must not survive the switch');
  assert.equal(x.writes,2);
});
test('ops data and copy controls never send API keys through the hub or automate attacks',()=>{
  assert.match(source,/const cfg=Object\.assign/);
  assert.match(source,/cfg\.ordersByEnemy/);
  assert.match(source,/function operationalBrief/);
  assert.match(source,/copy-ops/);
  assert.doesNotMatch(part('  function operationalBrief(','  function overview('),/PDA_httpGet\(|GM_xmlhttpRequest\(|POST|GM_setValue\(/);
  assert.match(source,/If you separately opt in to FFScouter/);
});

function planningFixture(){
  return runInNewContext(`
    const MIN=60000, at=1800000000000;
    const n=v=>Number.isFinite(Number(v))?Number(v):0;
    const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
    const cfg={assignments:{1:101},watchlist:{101:true}};
    const state={data:{updated:{ours:at,enemies:at},
      ours:[{id:1,name:'Hitter',status:'okay',country:'Torn'}],
      enemies:[{id:101,name:'Target',status:'hospital',country:'Canada',until:at+5*MIN},
      {id:102,name:'Other',status:'hospital',country:'Canada',until:at+15*MIN},
      {id:103,name:'Expired',status:'hospital',country:'Torn',until:at-1},
      {id:104,name:'Abroad',status:'away',country:'Canada',phase:'abroad'},
      {id:105,name:'Flying',status:'away',country:'Canada',phase:'inbound'},
      {id:106,name:'Unknown',status:'hospital',country:'Unknown',until:0}]}};
    const rosterFresh=(side,now)=>now-state.data.updated[side]<5*MIN;
    const memberState=p=>p.status;
    const nativeWarLocation=p=>({country:p.country,phase:p.phase||'present'});
    const hitterReadiness=p=>({energyEnough:p.energyEnough??null});
  `+part('  function warAvailabilityHorizon(', '  function warPlanningBrief(')+
    ';({at,cfg,state,warAvailabilityHorizon,assignmentAudit})');
}
test('country outlook keeps cumulative boundaries, abroad, flights and expired timers distinct',()=>{
  const m=planningFixture(),h=m.warAvailabilityHorizon(m.at);
  const canada=h.countries.find(x=>x.country==='Canada');
  assert.equal(canada.enemies.available,1);
  assert.deepEqual(Array.from(canada.enemies.exits),[1,2,2]);
  assert.equal(h.countries.find(x=>x.country==='Torn').enemies.overdue,1);
  assert.equal(h.countries.find(x=>x.country==='Unknown').enemies.untimed,1);
  assert.equal(h.events.length,2);
  assert.equal(h.events[0].assigned,true);
  assert.equal(h.events[0].watched,true);
});
test('country outlook independently suppresses stale sides and never turns expired hospitals into available',()=>{
  const m=planningFixture();m.state.data.updated.enemies=m.at-5*60000;
  const h=m.warAvailabilityHorizon(m.at);
  assert.equal(h.fresh.enemies,false);
  assert.equal(h.events.length,0);
  assert.equal(h.countries.length,1);
  assert.equal(h.countries[0].ours.available,1);
  assert.equal(h.countries[0].enemies.available,0); // rendered as ? via fresh flag
});
test('assignment audit flags country, availability, energy, collisions and removed members without mutation',()=>{
  const m=planningFixture();
  m.cfg.assignments[2]=101;
  m.state.data.ours[0].energyEnough=false;
  const before=JSON.stringify(m.cfg);
  const a=m.assignmentAudit(m.at);
  assert.equal(a.rows.length,2);
  assert.match(a.rows[0].reasons.join(' '),/Target unavailable.*Different countries.*energy.*assigned to 2/);
  assert.match(a.rows[1].reasons.join(' '),/no longer.*assigned to 2/);
  assert.equal(JSON.stringify(m.cfg),before);
  m.state.data.updated.ours=m.at-6*60000;
  const stale=m.assignmentAudit(m.at);
  assert.match(stale.rows[0].reasons[0],/Refresh both/);
  assert.doesNotMatch(stale.rows[0].reasons.join(' '),/Different countries/);
});

export function advancedDeskFixture(){
  const at=Date.now();
  const state={data:{war:{id:9},updated:{ours:at,enemies:at,wars:at},
    ours:[{id:1,name:'Regular Alpha',status:'okay',country:'Torn',bss:100},
      {id:2,name:'Regular Beta',status:'hospital',country:'Torn',bss:80},
      {id:3,name:'Skull Gamma',status:'okay',country:'Torn',bss:500}],
    enemies:[{id:101,name:'Heavy Delta',status:'hospital',country:'Canada',until:at+5*60000},
      {id:102,name:'Heavy Epsilon',status:'hospital',country:'Torn',until:at+31*60000}],reports:{}}};
  const cfg={ourId:10,enemyId:20,blackSkulls:{3:true},assignments:{3:101}};
  const snapshot={complete:false,lastFetch:at,winsByDefender:{1:{101:{wins:2}},2:{101:{wins:1}},3:{102:{wins:9}}}};
  const impacts={1:{known:true,given:10,earned:30,lastFetch:at,in30:3},2:{known:true,given:100,earned:5,lastFetch:at,in30:5}};
  const context={state,cfg,snapshot,impacts,MIN:60000,n:v=>Number(v)||0,positive:v=>Number(v)>0?Number(v):0,
    officialNumber:v=>v===null||v===undefined?null:Number(v),
    activeWarNow:()=>Boolean(state.data.war),
    rosterFresh:(side,now=Date.now())=>now-state.data.updated[side]<5*60000,
    liveWarMemberImpact:id=>impacts[id]||{known:false},memberState:p=>p.status,
    nativeWarLocation:p=>({country:p.country}),
    friendlyBattleEstimate:p=>({value:p.bss??null}),concessionSnapshot:()=>snapshot,
    enemyRoleBands:()=>({heavy:new Set([101,102]),reasons:new Map()}),
    warScore:()=>state.score||{our:100,enemy:80},fmt:v=>String(Math.round(v*10)/10),age:()=> 'just now',
    esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
  const helper=part('  function card(title,body){','  function lastWarLine(');
  return runInNewContext(helper+part('  function protectionPriorities(','  function warAvailabilityHorizon(')+
    ';({state,cfg,snapshot,impacts,protectionPriorities,skullReleaseQueue,regularBreakers,recentMemberComparisons,captureDeskSnapshot,recordDeskChanges,decisionDesk,memberComparisonCard})',context);
}
test('protection prioritises exposed donors, releases exclude expired and distant targets, and repeat wins exclude skull victims',()=>{
  const m=advancedDeskFixture(),at=Date.now();
  assert.equal(m.protectionPriorities(at)[0].player.id,1);
  assert.equal(m.skullReleaseQueue(at).length,1);
  assert.equal(m.skullReleaseQueue(at)[0].assigned[0].id,3);
  assert.equal(m.regularBreakers(at).rows[0].wins,3);
  assert.equal(m.regularBreakers(at).rows.length,1);
  m.state.data.updated.enemies=at-6*60000;
  assert.equal(m.skullReleaseQueue(at).length,0);
  m.state.data.war=null;
  assert.equal(m.protectionPriorities(at).length,0);
  assert.equal(m.regularBreakers(at).rows.length,0);
});
test('recent member comparison preserves missing points, excludes active/foreign wars, and compares actual samples',()=>{
  const m=advancedDeskFixture();
  const report=(id,end,score,faction=10)=>({id,war:{end},factions:[{id:faction,members:[{id:1,score}]}]});
  m.state.data.reports={1:report(1,100,20),2:report(2,200,null),3:report(3,300,40),9:report(9,900,999),8:report(8,800,999,77)};
  const x=m.recentMemberComparisons(),row=x.rows.find(r=>r.player.id===1);
  assert.equal(x.reports.length,3);assert.equal(row.samples,2);
  assert.equal(row.average,30);assert.equal(row.change,20);
  assert.equal(x.rows.find(r=>r.player.id===2).average,null);
  assert.match(m.memberComparisonCard(),/data-action="war:3"/);
});
test('refresh comparison scopes observations and ignores stale/no-refresh baselines',()=>{
  const m=advancedDeskFixture(),at=Date.now(),before=m.captureDeskSnapshot();
  m.state.data.enemies[0].status='okay';m.state.data.updated.enemies=at+1;
  m.recordDeskChanges(before,at+2);
  assert.equal(m.state.deskChanges.rows[0].id,101);
  const old=m.captureDeskSnapshot();old.updated.enemies=at-6*60000;
  m.state.data.updated.enemies=at+3;m.recordDeskChanges(old,at+4);
  assert.equal(m.state.deskChanges.total,0);
  m.state.data.war.id=10;m.recordDeskChanges(old,at+5);
  assert.equal(m.state.deskChanges,null);
});
test('decision cards escape player text and retain manual navigation controls',()=>{
  const m=advancedDeskFixture();m.state.data.ours[0].name='<img onerror="bad">';
  const html=m.decisionDesk();
  assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
  assert.match(html,/data-action="fast-hit"/);
  assert.match(html,/data-ws-disclosure="breakers"/);
});

function workspaceRosterFixture(){
 const now=Date.now(),workspace={side:'enemies',query:'',filter:'all',country:'all',sort:'status'};
 const player=(id,name,country,status='okay')=>({id,name,country,status,lastAt:now-id,until:now+id*60000});
 const state={data:{enemies:[player(1,'Zulu','Canada'),player(2,'Alpha','Canada','hospital'),player(3,'Beta','Torn'),player(4,'Hidden','Unknown')],ours:[]}};
 let fresh=true;
 const context={workspace,state,cfg:{watchlist:{2:true},blackSkulls:{}},n:v=>Number(v)||0,
  rosterFresh:()=>fresh,enemyRoleBands:()=>({heavy:new Set([2])}),memberState:p=>p.status,
  nativeWarLocation:p=>({country:p.country}),nativeWarOwnLocation:()=>({known:true,country:'Torn'}),
  liveEnemyWarImpact:id=>({scored:id===2?20:null}),liveWarMemberImpact:()=>({net:null})};
 const api=runInNewContext(part('  function workspacePlayers(','  function workspacePlayerRow(')+';({workspacePlayers})',context);
 return {...api,workspace,state,setFresh:value=>{fresh=value;}};
}
test('unified roster groups current country first, sorts within countries and applies combined filters',()=>{
 const m=workspaceRosterFixture();
 assert.deepEqual(Array.from(m.workspacePlayers().rows,x=>x.player.id),[3,1,2,4]);
 m.workspace.sort='points';assert.deepEqual(Array.from(m.workspacePlayers().rows,x=>x.player.id),[3,2,1,4]);
 m.workspace.country='Canada';m.workspace.filter='watched';m.workspace.query='alpha';
 assert.deepEqual(Array.from(m.workspacePlayers().rows,x=>x.player.id),[2]);
 m.workspace.query='no match';assert.equal(m.workspacePlayers().rows.length,0);
});
test('unified roster blocks live status filters on stale data without hiding cached all view',()=>{
 const m=workspaceRosterFixture();m.setFresh(false);m.workspace.filter='okay';
 assert.equal(m.workspacePlayers().rows.length,0);
 m.workspace.filter='all';assert.equal(m.workspacePlayers().rows.length,4);
 m.workspace.side='ours';m.state.data.ours=[{id:9,name:'Own',country:'Torn',status:'okay'}];m.workspace.sort='net';
 assert.equal(m.workspacePlayers().rows[0].player.id,9);
});

function nextStepFixture(){
 const context={cfg:{ourId:10},effectiveKey:()=>true,positive:Number,activeWarNow:()=>true,
  rosterFresh:()=>true,skullReleaseQueue:()=>[],protectionPriorities:()=>[],
  myMission:()=>({self:{id:1,energy:100},target:null,hasOrder:false})};
 const build=()=>runInNewContext(part('  function nextWarStep(){','  function warWorkspace(){')+';nextWarStep()',context);
 return {context,build};
}
test('one-step recommendation gates tactical advice behind connection and fresh data',()=>{
 const x=nextStepFixture();x.context.effectiveKey=()=>false;
 assert.equal(x.build().action,'tab:settings');
 x.context.effectiveKey=()=>true;x.context.rosterFresh=()=>false;
 x.context.myMission=()=>{throw Error('Stale advice must not evaluate hits');};
 assert.equal(x.build().action,'refresh');
});
test('one-step recommendation prioritises imminent uncovered heavy targets and known repeated pressure',()=>{
 const x=nextStepFixture();x.context.skullReleaseQueue=()=>[{player:{name:'Example'},minutes:4,assigned:[]}];
 assert.equal(x.build().action,'tab:command');
 x.context.skullReleaseQueue=()=>[];
 x.context.protectionPriorities=()=>[{player:{name:'Example'},exposed:true,feedFresh:true,impact:{underFire:true}}];
 assert.equal(x.build().action,'tab:turtle');
});
test('one-step recommendation opens intelligence for eligible targets and never invents a hit',()=>{
 const x=nextStepFixture();assert.equal(x.build().title,'No verified hit right now');
 x.context.myMission=()=>({self:{id:1,energy:100},target:{player:{id:50,name:'Example'}},hasOrder:true});
 assert.equal(x.build().action,'player:50');
 x.context.myMission=()=>({self:{id:1,energy:10},target:null,hasOrder:false});
 assert.equal(x.build().title,'Check your energy');
});
