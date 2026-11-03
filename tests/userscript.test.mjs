import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
test('Torn PDA metadata, author, stable URL',()=>{
  assert.match(code,/\/\/ @name\s+Torn WarStaxx/);
  assert.match(code,/\/\/ @author\s+IamEEKY/);
  assert.match(code,/\/\/ @updateURL\s+https:\/\/raw\.githubusercontent\.com\/Tom-Peters\/Torn-WarStaxx\/main\/WarStaxx\.user\.js/);
  assert.match(code,/\/\/ @match\s+https:\/\/www\.torn\.com\/\*/);
  assert.match(code,/\/\/ @connect\s+api\.torn\.com/);
});
test('StaxxHub bundle and event interface',()=>{
  assert.match(code,/\/\* StaxxHub v3\.4/);
  assert.match(code,/id=.?war/);
  for(const name of ['register','panel','summary','actions','notice','diagnostics','visit','ping','closeall'])assert.ok(code.includes('staxx:'+name)||code.includes("event('"+name+"'"),name);
  assert.match(code,/Shared sidebar is the only persistent launcher/);
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
