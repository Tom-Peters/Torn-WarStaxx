import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing source region '+start+' / '+end);
  return source.slice(a,b);
}
test('older or malformed cached roster states fail closed rather than crashing',()=>{
  const code=region('  function memberState(p){','  function flightEvidence(p,at=Date.now()){');
  const x=runInNewContext(code+';({memberState,isOnline})');
  assert.equal(x.memberState({status:'Okay'}),'okay');
  assert.equal(x.memberState({status:'Hospital'}),'hospital');
  assert.equal(x.memberState({}), 'unknown');
  assert.equal(x.memberState(null),'unknown');
  assert.equal(x.isOnline({}),false);
  assert.equal(x.isOnline({lastAction:'Online'}),true);
});
test('numeric-object API parsing tolerates sparse or null members',()=>{
  const code=region('  const parseArray=(value)=>','  const unpack=(j,k)=>');
  const x=runInNewContext('const positive=v=>Number(v)||0;\n'+code+';({parseArray})');
  const values=x.parseArray({'31':null,'32':{name:'Valid',id:32},'skip':{name:'Ignored'}});
  assert.equal(values.length,2);
  assert.equal(values[0].id,31);
  assert.equal(values[1].name,'Valid');
});
test('unsaved player notes and stats survive same-profile refresh, but not opponent switching or explicit clear',()=>{
  const code=region('  function render(){','  function navigate(tab,focus){');
  assert.match(code,/state\.renderedPlayerId===positive\(state\.chosen\)/);
  assert.match(code,/!state\.skipDraftRestore/);
  assert.match(code,/Array\.from\(content\.querySelectorAll\('\[data-spy\],#ws-note'\)\)/);
  assert.match(code,/state\.renderedPlayerId=state\.tab==='targets'/);
  assert.match(source,/state\.skipDraftRestore=true;render\(\);return/);
});
test('permanent strip refreshes chain countdown at 10s ticks rather than freezing up to a minute',()=>{
  const code=region('  function renderWarStrip(force=false){','  function statusNote(){');
  assert.match(code,/Math\.floor\(Date\.now\(\)\/10000\)/);
  assert.match(code,/chain\.fresh\?chain\.count:0/);
  assert.match(source,/setInterval\(\(\)=>\{if\(!document\.hidden\)renderWarStrip\(\);\},10000\)/);
});
test('roster freshness banner requires both factions, not merely the newer timestamp',()=>{
  const sourcePart=region('  function statusNote(){','  function scoreSpark(p){');
  assert.match(sourcePart,/rosterFresh\('ours'\)&&rosterFresh\('enemies'\)/);
  assert.match(sourcePart,/One or both rosters need refresh/);
  assert.match(sourcePart,/Our roster/);
  assert.match(sourcePart,/opponent/);
});
test('hub no longer labels expired enemy roster data as current available opponents',()=>{
  assert.match(source,/const hittable=rosterFresh\('enemies'\)\?state\.data\.enemies\.filter/);
  assert.match(source,/trendMetric:'Enemy Okay'/);
  assert.match(source,/value:rosterFresh\('enemies'\)\?String\(hittable\):'--'/);
});
test('small-screen use, keyboard navigation and reduced-motion respect stay wired',()=>{
  assert.match(source,/@media\(max-width:420px\)/);
  assert.match(source,/@media\(pointer:coarse\)/);
  assert.match(source,/ws-refresh-label/);
  assert.match(source,/aria-label="Open TornStaxx search"/);
  assert.match(source,/e\.key==='Escape'/);
  assert.match(source,/e\.key!=='Tab'/);
  assert.match(source,/previousModalFocus\.focus/);
  assert.match(source,/document\.body\.style\.overflow='hidden'/);
  assert.match(source,/prefers-reduced-motion: reduce/);
  assert.match(source,/focus\(\{preventScroll:true\}\)/);
});
test('manual faction identity change invalidates live rosters, score and chain, not historical records',()=>{
  const code=region("    if(action==='save-settings'){","  root.addEventListener('click',e=>{");
  assert.match(code,/previousFactionId=positive\(cfg\.ourId\)/);
  assert.match(code,/previousFactionId!==positive\(cfg\.ourId\)/);
  assert.match(code,/state\.data\.ours=\[\];state\.data\.ourWars=\[\]/);
  assert.match(code,/state\.data\.war=null;state\.data\.chain=\{\}/);
  assert.doesNotMatch(code,/state\.data\.reports=\{\}/);
  assert.doesNotMatch(code,/cfg\.spies=\{\}/);
});
test('public script preserves pinned installer, suite ownership and read-only Torn API',()=>{
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.match(source,/^\/\/ @version\s+1\.5\.4$/m);
  assert.match(source,/^\/\/ @author\s+IamEEKY$/m);
  assert.match(source,/^\/\/ @downloadURL\s+https:\/\/raw\.githubusercontent\.com\/Tom-Peters\/Torn-WarStaxx\/main\/WarStaxx\.user\.js/m);
  assert.match(source,/const ID='war', VER='1\.5\.4'/);
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
});
