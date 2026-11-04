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
  assert.match(code,/sb=manual!==null\?manual:\(third&&positive\(third\.bss\)\?positive\(third\.bss\):null\)/);
  assert.match(code,/if\(sa===null\|\|sb===null\)/);
  assert.match(code,/return score>0\?score:null/);
});
test('optional FFScouter must be explicitly enabled and use a separate entered registered key',()=>{
  assert.match(code,/\/\/ @connect\s+ffscouter\.com/);
  assert.match(code,/if\(!cfg\.ffEnabled\|\|!cfg\.ffConsent\|\|!cfg\.ffKey/);
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


test('v0.2.1 sideband is restricted to War-TornStaxx and keeps credentials private',()=>{
 assert.match(code,/\/\/ @version\s+0\.2\.1/);
 assert.match(code,/tornstaxx-war-runtime-v1/);
 assert.match(code,/__tornstaxxBridge:'tornstaxx-war-v1'/);
 assert.match(code,/e\.source!==window\|\|e\.origin!==location\.origin/);
 assert.match(code,/d\.kind==='open'&&d\.id===ID/);
});
