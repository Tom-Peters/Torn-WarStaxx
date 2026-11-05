import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'Missing '+a);
 return source.slice(start,end);
}
const setup=[
 'const MIN=60000,HOUR=3600000;',
 'const positive=x=>Number(x)||0,n=x=>Number(x)||0;',
 'const epochMs=x=>Number(x)>1e12?Number(x):Number(x)*1000;',
 'const bsScore=s=>s&&["strength","speed","defense","dexterity"].every(k=>Number.isFinite(s[k]))?Object.values(s).slice(0,4).reduce((a,v)=>a+Math.sqrt(v),0):null;'
].join('\n');
const f=runInNewContext(setup+'\n'+region('  function exactBattleStats(', '  function applyAutoSpies(')+
 ';({exactBattleStats,parseOwnBattleStats,parseStatsReports})');
test('owner exact stats work in flat and nested Torn API v2 responses',()=>{
 const stats={strength:100,speed:400,defense:900,dexterity:1600};
 assert.equal(f.parseOwnBattleStats({battlestats:stats}).speed,400);
 assert.equal(f.parseOwnBattleStats({user:{battlestats:stats}}).dexterity,1600);
 assert.equal(f.parseOwnBattleStats({battlestats:{...stats,dexterity:null}}),null);
});
test('spy reports from arrays and keyed collections are parsed without inventing unknown stats',()=>{
 const now=Date.now(),ts=Math.floor(now/1000);
 const stats={strength:100,speed:400,defense:900,dexterity:1600};
 const a=f.parseStatsReports({reports:[{type:'stats',target_id:77,timestamp:ts,report:stats}]},'Torn',now);
 assert.equal(a[77].speed,400);
 const b=f.parseStatsReports({reports:{a:{type:'stats',target:{id:78},timestamp:ts,report:{data:{stats}}}}},'Torn',now);
 assert.equal(b[78].defense,900);
 const c=f.parseStatsReports({reports:[{type:'stats',target_id:79,timestamp:ts,report:{...stats,defense:null}}]},'Torn',now);
 assert.equal(c[79],undefined);
 const d=f.parseStatsReports({reports:[{type:'stats',target_id:80,timestamp:ts+86400,report:stats}]},'Torn',now);
 assert.equal(d[80],undefined);
});
test('only recent attack FF samples are labelled as observed evidence',()=>{
 const code=region('  function ffObserved(enemyId,friendId){','  function evaluate(enemy){');
 const now=Date.now();
 const data={attacks:[{defender:7,attacker:1,ff:2,at:now-1000},
 {defender:7,attacker:1,ff:3,at:now-60*86400000},
 {defender:7,attacker:1,ff:1.5,at:now+86400000}]};
 const ff=runInNewContext('const state={data};const n=x=>Number(x)||0,HOUR=3600000;'+code+';ffObserved',{data,Date});
 assert.equal(ff(7).count,1);
 assert.equal(ff(7).avg,2);
});
test('attack refresh does not use a stale cached war ID',()=>{
 const code=region('  async function refreshAttacks(){','  async function refresh(force=false){');
 assert.match(code,/!activeWarNow\(\)/);
});
test('userscript metadata and probes agree at v1.5.6',()=>{
 assert.match(source,/^\/\/ @version\s+1\.5\.6$/m);
 assert.match(source,/const id='war', version='1\.5\.6'/);
 assert.match(source,/const ID='war', VER='1\.5\.6'/);
 assert.doesNotMatch(source,/[^\x00-\x7f]/);
 assert.doesNotThrow(()=>new Script(source));
});
