import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing region '+start+' / '+end);
  return source.slice(a,b);
}
function moduleSandbox(){
  const location={pathname:'/factions.php',search:'',hash:'#/war/123'};
  const cfg={nativeWarEnabled:true,nativeWarCountryGroups:false,nativeWarSort:'availability',
    nativeWarFilter:'all',assignments:{},watchlist:{},blackSkulls:{}};
  const state={data:{war:{id:123},enemies:[],ours:[]},open:false};
  const document={hidden:false,hasFocus:()=>true,addEventListener:()=>{},
    createDocumentFragment:()=>({nodes:[],appendChild(el){this.nodes.push(el);}})};
  const stub={document,location,cfg,state,window:{flutter_inappwebview:true},
    positive:x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0,
    memberState:p=>String(p?.status||'unknown').toLowerCase(),
    flightEvidence:p=>({kind:p?.returning?'returning':p?.outbound?'outbound':'abroad-or-unclear',eta:p?.until||null}),
    enemyBattleEstimate:p=>({value:p.bss??null}),ffLabel:id=>({source:'unknown',ff:null}),
    nativeWarLocation:p=>({country:'Torn',phase:'present'}),
    nativeWarOwnLocation:()=>({country:'Torn',known:true,phase:'present'}),
    nativeWarCountryCompare:(a,b)=>a.localeCompare(b),
    nativeWarAvailabilityRank:p=>p.status==='okay'?0:p.status==='hospital'?1:3,
    MIN:60000,Date,URL,Array,Map,Set,WeakMap,
    n:x=>Number(x)||0,el:()=>({}),warQuick:()=>{},saveCfg:()=>{},
    activeWarNow:()=>true,esc:String,rosterFresh:()=>true,warScore:()=>null,chainStatus:()=>({fresh:false}),
    $:()=>null,$$:()=>[],fmt:String};
  const piece=region('  // Torn native ranked-war enhancement:', '  function mountFactionShortcut(){');
  return {...runInNewContext(piece+';({isNativeWarPage,nativeWarClass,nativeWarConflict,'+
     'nativeWarOrder,nativeWarFilters,nativeWarSort,observeNativeWarTransitions,'+
     'nativeWarTransition,nativeWarState})',stub),document,location,cfg,state};
}
function fakeRow(id){
  return {id,
    matches:()=>true,classList:{contains:x=>x==='enemy'},
    querySelector:()=>({href:'https://www.torn.com/profiles.php?XID='+id})};
}
function fakeList(rows){
  return {children:rows,getAttribute:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
    appendChild(fragment){this.children=fragment.nodes.slice();}};
}
test('all userscript registration version surfaces agree and code parses',()=>{
  assert.match(source,/^\/\/ @version\s+1\.5\.13$/m);
  assert.match(source,/const id='war', version='1\.5\.13'/);
  assert.match(source,/const ID='war', VER='1\.5\.13'/);
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
test('native enhancement mounts only on Torn ranked-war route',()=>{
  const x=moduleSandbox();
  assert.equal(x.isNativeWarPage(),true);
  x.location.hash='#/tab=info';
  assert.equal(x.isNativeWarPage(),false);
  x.location.pathname='/loader.php';x.location.hash='#/war/123';
  assert.equal(x.isNativeWarPage(),false);
  x.location.pathname='/page.php';
  assert.equal(x.isNativeWarPage(),false);
});
test('hospital before returning before abroad and early releases first',()=>{
  const x=moduleSandbox();
  assert.equal(x.nativeWarClass({status:'okay'}),1);
  assert.equal(x.nativeWarClass({status:'hospital'}),2);
  assert.equal(x.nativeWarClass({status:'away',returning:true}),3);
  assert.equal(x.nativeWarClass({status:'away',outbound:true}),4);
  assert.equal(x.nativeWarClass({status:'away'}),5);
  const t=Date.now();
  x.observeNativeWarTransitions([{id:5,status:'hospital',until:t+300000}],
    [{id:5,status:'okay',until:0}],123,t);
  const recent=x.nativeWarTransition(5,t+1000);
  assert.equal(recent.kind,'EARLY MED / REVIVE');
  assert.equal(x.nativeWarOrder({id:5,status:'okay'},'availability',t+1000)[0],0);
  assert.equal(x.nativeWarTransition(5,t+20000),null);
  x.document.hasFocus=()=>false;
  x.window={};
});
test('native sorting reorders only validated enemy rows and restores Torn order',()=>{
  const x=moduleSandbox();
  const original=[fakeRow(10),fakeRow(11),fakeRow(12)],list=fakeList(original);
  const players=new Map([
    [10,{id:10,status:'hospital',until:Date.now()+90000}],
    [11,{id:11,status:'okay'}],
    [12,{id:12,status:'hospital',until:Date.now()+30000}]
  ]);
  assert.equal(x.nativeWarSort(list,players,'availability'),true);
  assert.deepEqual(list.children.map(r=>r.id),[11,12,10]);
  assert.equal(x.nativeWarSort(list,players,'torn'),true);
  assert.deepEqual(list.children.map(r=>r.id),[10,11,12]);
  list.querySelector=()=>({className:'twse-copy-btn'});
  assert.equal(x.nativeWarConflict(list),true);
  assert.equal(x.nativeWarSort(list,players,'availability'),false);
});
test('Black Skull classification and assignment filtering use existing policy',()=>{
  const x=moduleSandbox(),p={id:77,status:'okay'};
  assert.equal(x.nativeWarFilters(p,{heavy:new Set([77])},'heavy'),true);
  assert.equal(x.nativeWarFilters(p,{heavy:new Set()},'heavy'),false);
  x.cfg.assignments[44]=77;
  assert.equal(x.nativeWarFilters(p,{heavy:new Set()},'assigned'),true);
  assert.equal(x.nativeWarFilters({id:88,status:'okay'},{heavy:new Set()},'assigned'),false);
});
test('no new permissions or hidden automated game actions; rate-limited official polling only',()=>{
  const native=region('  // Torn native ranked-war enhancement:','  function mountFactionShortcut(){');
  assert.match(native,/call\('\/faction\/'\+cfg\.enemyId\+'\/members','enemies',20000\)/);
  assert.match(native,/nativeWarConflict\(list\)/);
  assert.match(native,/window\.flutter_inappwebview\|\|document\.hasFocus\?\.\(\)/);
  assert.match(source,/const nativeWarPolling=setInterval/);
  assert.doesNotMatch(native,/twse\.dev|GM_xmlhttpRequest|location\.assign\(attackLink/);
  assert.match(source,/^\/\/ @connect\s+api\.torn\.com$/m);
});

test('mobile layout uses a reserved sibling intelligence subrow, never the name/status columns',()=>{
  const native=region('  // Torn native ranked-war enhancement:','  function mountFactionShortcut(){');
  assert.match(native,/li\.wsnw-enhanced\{position:relative!important;height:58px!important;min-height:58px!important/);
  assert.match(native,/> \.wsnw-intel\{position:absolute!important;top:36px!important/);
  assert.match(native,/infoBar=el\('div','wsnw-intel'\)/);
  assert.match(native,/row\.appendChild\(infoBar\)/);
  assert.match(native,/member\.querySelectorAll\('\.wsnw-detail,\.wsnw-badge,\.wsnw-copy'\)\.forEach/);
  assert.doesNotMatch(native,/member\.appendChild\(label\)|member\.appendChild\(desc\)/);
  assert.match(native,/\.wsnw-intel \[data-wsnw-expiry\]/);
  assert.match(native,/\.wsnw-intel \[data-wsnw-eta\]/);
});
