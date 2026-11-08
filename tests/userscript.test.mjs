import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
test('Torn PDA metadata, author, stable URL',()=>{
  assert.match(code,/\/\/ @name\s+War-TornStaxx/);
  assert.match(code,/\/\/ @author\s+IamEEKY/);
  assert.match(code,/\/\/ @updateURL\s+https:\/\/raw\.githubusercontent\.com\/Tom-Peters\/Torn-WarStaxx\/main\/WarStaxx\.user\.js/);
  assert.match(code,/\/\/ @match\s+https:\/\/www\.torn\.com\/\*/);
  assert.match(code,/\/\/ @connect\s+api\.torn\.com/);
});
test('StaxxHub bundle and event interface',()=>{
  assert.match(code,/\/\* TornStaxx 4\.0 module fallback/);
  assert.match(code,/id=.?war/);
  for(const name of ['register','panel','summary','actions','notice','diagnostics','visit','ping','closeall'])assert.ok(code.includes('staxx:'+name)||code.includes("event('"+name+"'"),name);
  assert.match(code,/never create another floating FAB/);
});
test('no automatic attack or game-write requests',()=>{
  assert.doesNotMatch(code,/method\s*:\s*['"]POST['"]/i);
  assert.match(code,/\/loader\.php\?sid=attack&user2ID=/);
  assert.match(code,/Cannot know|Insufficient samples/i);
});
test('conservative war intelligence boundaries',()=>{
  for(const t of ['warHistory','rankedwarreport','snapshot','ffObserved','bsScore','Unverified','Insufficient samples','slice(-1000)','slice(0,3)']){
    assert.ok(code.toLowerCase().includes(t.toLowerCase()),t);
  }
});

test('missing opponent battle stats never become an auto-safe matchup',()=>{
  assert.match(code,/if\(own===null\|\|opponent===null\)/);
  assert.match(code,/const estimate=x=>x&&!ffIsStale\(x\)/);
  assert.match(code,/Number\(x\.bss\)>0/);
  assert.match(code,/if\(own===null\|\|opponent===null\)/);
  assert.match(code,/return score>0\?score:null/);
});
test('optional FFScouter must be explicitly enabled and use a separate entered registered key',()=>{
  assert.match(code,/\/\/ @connect\s+ffscouter\.com/);
  assert.match(code,/if\(!cfg\.ffEnabled\|\|!cfg\.ffConsent\|\|!ffApiKey\(\)/);
  assert.match(code,/cfg\.ffEnabled=Boolean\(\$\('#ws-ff-enable'/);
  assert.match(code,/get-stats\?key=/);
  assert.match(code,/public BSS/);
});
test('war travel samples are separate from routine checks',()=>{
  assert.match(code,/item\.wars\|\|\(item\.wars=\{\}\)/);
  assert.match(code,/warSamples:/);
  assert.match(code,/warTravel:/);
});

test('installable userscript starts at byte zero with a complete metadata header',()=>{
  assert.ok(code.startsWith('// ==UserScript==\n'),'Torn PDA needs metadata in the downloaded source, not a GitHub HTML page');
  const ending=code.indexOf('// ==/UserScript==');
  assert.ok(ending>0 && ending<2000,'Close metadata block before JavaScript body');
  assert.match(code.slice(0,ending),/\/\/ @downloadURL\s+https:\/\/raw\.githubusercontent\.com\/Tom-Peters\/Torn-WarStaxx\/main\/WarStaxx\.user\.js/);
});


test('current version sideband is restricted to War-TornStaxx and keeps credentials private',()=>{
 assert.match(code,/\/\/ @version\s+1\.5\.26/);
 assert.match(code,/tornstaxx-war-runtime-v1/);
 assert.match(code,/__tornstaxxBridge:bridge/);
 assert.match(code,/e\.source&&e\.source!==window/);
 assert.match(code,/d\.kind==='open'&&d\.id===ID/);
});


test('full War panel readiness is checked before registration and opening is recovered',()=>{
 assert.match(code,/if\(!window\.__warStaxxReady\)/);
 assert.match(code,/if\(!root\.querySelector\('\.ws-panel'\)/);
 assert.match(code,/window\.__warStaxxReady=true;/);
 assert.match(code,/Panel could not open/);
 assert.match(code,/Legacy|malformed legacy/i);
});


test('War exposes a DOM-backed visual-only launch bridge',()=>{
 assert.match(code,/domBridge\.id='warstaxx-dom-open'/);
 assert.match(code,/domBridge\.hidden=true/);
 assert.match(code,/domBridge\.addEventListener\('click'/);
 assert.match(code,/root\.appendChild\(domBridge\)/);
});


test('War 0.2.5 writes cross-world DOM startup marker and repairs emergency launcher failures',()=>{
 assert.match(code,/tornstaxx-war-execution-probe/);
 assert.match(code,/probe\.dataset\.phase=/);
 assert.match(code,/probe\.dataset\.version=version/);
 assert.match(code,/beacon\.dataset\.phase='ready'/);
 assert.match(code,/beacon\.dataset\.phase='error'/);
 assert.match(code,/const safeMount=\(\)=>/);
 assert.match(code,/__TornStaxxFallbackError/);
 assert.doesNotMatch(code,/GM_setValue\(['\"]tornstaxx-war-execution-probe/);
});


test('own faction is discovered automatically using authenticated Torn profile',()=>{
 assert.match(code,/\['\/user\/profile','identity-profile','user-profile'\]/);
 assert.match(code,/\['\/user\/faction','identity-faction','user-faction'\]/);
 assert.match(code,/if\(!result\?\.id\)continue/);
 assert.match(code,/const id=positive\(v\)/);
 assert.match(code,/cfg\.ourId=result\.id/);
 assert.match(code,/state\.data\.errors\.identity/);
 assert.match(code,/Automatically detect my faction from the Torn API/);
});
