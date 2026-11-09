import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const part=(start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing section '+start);
  return source.slice(a,b);
};
function fixture(){
  const setup=[
    'const MIN=60000;',
    'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
    'const positive=v=>Number(v)||0;',
    'const cfg={};',
    "const state={data:{war:{id:500,start:Math.floor((Date.now()-600000)/1000),status:'active'},"+
       "updated:{wars:Date.now(),ours:Date.now(),enemies:Date.now()},meta:{ownerId:1},"+
       "ours:[{id:1,status:'Okay'}],enemies:[{id:101,status:'Okay',level:30},"+
       "{id:102,status:'Okay',level:100},{id:103,status:'Hospital',level:90}]}};",
    'const memberState=p=>p.status.toLowerCase();',
    'const rosterFresh=s=>Date.now()-state.data.updated[s]<5*MIN;',
    'const hitterReadiness=()=>({energy:75});',
    'const spy=id=>({101:{strength:10000},102:{strength:2000},103:{strength:30000}}[id]||null);',
    'const bsScore=x=>x?Math.sqrt(x.strength):null;',
    'const unsafe=new Set();',
    'const matchEvidence=(a,b)=>({tier:unsafe.has(b.id)?2:0,rosterVerified:true,'+
      'encounters:{losses:0},conflict:false,score:80});'
  ].join('\n');
  return runInNewContext(setup+part('  function activeWarNow(){','  function itemIntent(){')+
    '; ({state,unsafe,activeWarNow,ourWarReadiness,strongestVerifiedHit})');
}
test('live war requires a recent officially observed started war',()=>{
  const x=fixture();
  assert.equal(x.activeWarNow(),true);
  x.state.data.updated.wars=Date.now()-11*60000;
  assert.equal(x.activeWarNow(),false);
  x.state.data.updated.wars=Date.now();
  x.state.data.war.start=Math.floor((Date.now()+600000)/1000);
  assert.equal(x.activeWarNow(),false);
  x.state.data.war.start=Math.floor((Date.now()-600000)/1000);
  x.state.data.war.status='ended';
  assert.equal(x.activeWarNow(),false);
});
test('hit selector prioritises strongest verified fight, not player level',()=>{
  const x=fixture();
  assert.equal(x.strongestVerifiedHit().player.id,101);
  x.unsafe.add(101);
  assert.equal(x.strongestVerifiedHit().player.id,102);
  x.state.data.updated.enemies=Date.now()-6*60000;
  assert.equal(x.strongestVerifiedHit(),null);
  x.state.data.updated.enemies=Date.now();
  x.state.data.ours[0].status='Hospital';
  assert.equal(x.strongestVerifiedHit(),null);
});
test('hospital hit opens manual medical page; ready hit opens attack link only',()=>{
  const setup=[
    "let status='hospital',route='',opened='';",
    'const MIN=60000;',
    'const n=v=>Number(v)||0,positive=v=>Number(v)||0,esc=v=>String(v);',
    'const sessionStorage={setItem(){},removeItem(){},getItem(){return null}};',
    "const location={pathname:'/factions.php',assign(url){route=url}};",
    'const cfg={warStripCompact:false},state={warMore:false,error:\"\"};',
    'const saveCfg=()=>{},render=()=>{},renderWarStrip=()=>{};',
    'const open=d=>{opened=d.section};',
    'const ourWarReadiness=()=>({kind:status,fresh:true,energy:75});',
    'const bestEfficiencyHit=()=>({player:{id:55}});',
    'const myMission=()=>({hasOrder:false,target:bestEfficiencyHit()});',
    "const attackLink=id=>'https://www.torn.com/loader.php?sid=attack&user2ID='+id;"
  ].join('\n');
  const x=runInNewContext(setup+part('  function itemIntent(){','  function renderWarStrip(force=false){')+
    '; ({warQuick,get route(){return route},set status(x){status=x},get opened(){return opened}})');
  x.warQuick('hit');
  assert.equal(x.route,'https://www.torn.com/item.php');
  x.status='okay';x.warQuick('hit');
  assert.equal(x.route,'https://www.torn.com/loader.php?sid=attack&user2ID=55');
  x.status='unknown';x.warQuick('hit');
  assert.equal(x.opened,'overview');
});
test('pressing HIT after manual heal rechecks Torn before attacking',async()=>{
  const setup=[
    "let current='Hospital',cached='hospital',route='',calls=0,opened='';",
    'const MIN=60000;',
    'const n=v=>Number(v)||0,positive=v=>Number(v)||0;',
    "const cfg={ourId:10,enemyId:20,warStripCompact:false};",
    "const state={data:{ours:[],enemies:[]},quickHitPending:false,error:''};",
    'const render=()=>{},renderWarStrip=()=>{},save=()=>{};',
    'const open=d=>{opened=d.section};',
    'const roster=j=>j.members;',
    "const memberState=p=>p.status.toLowerCase();",
    "const location={pathname:'/item.php',assign(v){route=v}};",
    "const sessionStorage={getItem:()=>JSON.stringify({mode:'heal',at:Date.now()}),removeItem(){},setItem(){}};",
    "const ourWarReadiness=()=>({kind:cached,fresh:true,energy:75});",
    "const bestEfficiencyHit=()=>({player:{id:77}});",
    'const myMission=()=>({hasOrder:false,target:bestEfficiencyHit()});',
    'const rosterFresh=()=>true;',
    "const attackLink=id=>'https://www.torn.com/loader.php?sid=attack&user2ID='+id;",
    "const effectiveKey=()=> 'test-key';",
    "const call=async()=>{calls++;cached=current.toLowerCase();return {members:[{id:1,status:current}]}};"
  ].join('\n');
  const x=runInNewContext(setup+part('  function itemIntent(){','  function renderWarStrip(force=false){')+
    '; ({warQuick,verifyHealedThenHit,state,get route(){return route},get calls(){return calls},set current(x){current=x},get opened(){return opened}})');
  x.warQuick('hit');
  await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(x.calls,1);
  assert.equal(x.route,'','Still hospitalised must never open attack page');
  x.current='Okay';
  x.warQuick('hit');
  await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(x.calls,2);
  assert.equal(x.route,'https://www.torn.com/loader.php?sid=attack&user2ID=77');
  assert.equal(x.state.quickHitPending,false);
});
test('command strip and item shortcuts are manual, PDA parser safe',()=>{
  for(const token of ['function renderWarStrip(','function liveWarRoom(',
    "btn('TURTLE','turtle')","btn('Room','war')",
    "btn(compact?'More':'Less','compact')",'function locateItem(',
    "if(activeWarNow())return liveWarRoom();",
    "if(action==='war-more')","function strongestVerifiedHit("]){
    assert.ok(source.includes(token),'Missing '+token);
  }
  assert.match(source,/\/\/ @version\s+2\.0\.0/);
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
  const actionPart=part('  function warQuick(action){','  function focusOpportunity(id){');
  assert.match(actionPart,/async function verifyHealedThenHit\(/);
  assert.ok(actionPart.includes("await call('/faction/'+cfg.ourId+'/members','ours',0)"),
    'Post-heal HIT must read a fresh official own roster');
  assert.ok(actionPart.includes('state.quickHitPending=true'),
    'The post-heal flow must block duplicate HIT taps');
  assert.doesNotMatch(actionPart,/\.click\(\)|GM_xmlhttpRequest|PDA_httpGet|\bfetch\(/);
});
