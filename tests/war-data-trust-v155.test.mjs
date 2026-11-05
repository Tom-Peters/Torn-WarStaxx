import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(a,b){
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'Expected source region: '+a);
  return source.slice(start,end);
}
const helpers=[
  'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
  'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
  region('  const parseArray=', '  function detectWar('),
  region('  function report(j,warId){','  const epochMs=')
].join('\n');
const parsed=runInNewContext(helpers+';({parseArray,officialNumber,warHistory,report})');

test('legacy keyed ranked wars keep sibling faction scores and IDs',()=>{
  const wars=parsed.warHistory({rankedwars:{
    9001:{id:0,war:{start:100,end:200,winner:10,target:500},
      factions:{10:{id:0,name:'Own faction',score:850},20:{name:'Opposition',score:620}}}
  }});
  assert.equal(wars.length,1);
  assert.equal(wars[0].id,9001);
  assert.equal(wars[0].factions.length,2);
  assert.deepEqual(Array.from(wars[0].scores,x=>x.score),[850,620]);
  assert.deepEqual(Array.from(wars[0].scores,x=>x.id),[10,20]);
  assert.equal(wars[0].winner,10);
  assert.equal(wars[0].target,500);
});

test('new array shaped wars work and missing scores remain unknown',()=>{
  const wars=parsed.warHistory({rankedwars:[{id:500,war:{start:10,end:20},
    factions:[{id:11,name:'A',score:null},{id:22,name:'B',score:0}]}]});
  assert.equal(wars.length,1);
  assert.equal(wars[0].scores[0].score,null);
  assert.equal(wars[0].scores[1].score,0);
  assert.equal(parsed.officialNumber(undefined),null);
  assert.equal(parsed.officialNumber(''),null);
  assert.equal(parsed.parseArray([null,{id:1}]).length,1);
  assert.equal(parsed.parseArray({42:null,43:{id:0,name:'ok'}})[0].id,43);
});

test('official detailed report does not fabricate missing per-player values',()=>{
  const r=parsed.report({rankedwarreport:{war:{start:10,end:20,winner:11},
    factions:{11:{name:'A',score:320,attacks:null,members:{100:{name:'Player',score:null,attacks:0}}},
      22:{name:'B',score:120,attacks:4}}}},500);
  assert.equal(r.factions[0].attacks,null);
  assert.equal(r.factions[0].members[0].score,null);
  assert.equal(r.factions[0].members[0].attacks,0);
  assert.equal(r.factions[1].score,120);
});

test('missing numbers format as unknown, not zero',()=>{
  const line=source.match(/^  const fmt=.*;$/m)?.[0];
  assert.ok(line);
  const fmt=runInNewContext(line+';fmt');
  assert.equal(fmt(null),'\\u2014');
  assert.equal(fmt(undefined),'\\u2014');
  assert.equal(fmt(''),'\\u2014');
  assert.equal(fmt(0),'0');
  assert.equal(fmt(1234),'1,234');
});

test('war score chart renders the actual first UTC sample timestamp',()=>{
  const fn=runInNewContext('const n=v=>Number(v)||0;'+
    'const stamp=v=>String(v),esc=v=>String(v),empty=v=>v;'+
    region('  function scoreSpark(p){','  function pace(){')+';scoreSpark');
  const output=fn({points:[{at:1700000000000,our:10,enemy:8},{at:1700001000000,our:12,enemy:9}]});
  assert.ok(output.includes('1700000000000'),output.slice(-200));
  assert.ok(!output.includes('undefined'));
});

test('completed war report coverage counts unique IDs and excludes incomplete records',()=>{
  const st={data:{ourWars:[{id:1,end:100},{id:2,end:100}],
    enemyWars:[{id:2,end:100},{id:3,end:0}],reports:{
      1:{war:{end:100},factions:[{id:1},{id:2}]},
      2:{war:{end:0},factions:[]}},backoff:{}}};
  const coverage=runInNewContext('const state=st;const positive=v=>Number(v)>0?Number(v):0;'+
    'const n=v=>Number(v)||0;'+region('  function historyCoverage(){','  async function refreshHistory(force=false){')+
    ';historyCoverage',{st,Date});
  const actual=coverage();
  assert.equal(actual.total,2);
  assert.equal(actual.complete,1);
  assert.equal(actual.missing,1);
});

test('report backfill skips rate-limited war and advances to older reports',async()=>{
  const st={data:{ourWars:[1,2,3,4,5].map(id=>({id,end:100,start:1})),
    enemyWars:[],reports:{},backoff:{'report-1':{until:Date.now()+600000}},
    errors:{}},historicalRead:0,error:''},visited=[];
  const setup=[
    helpers,
    'const MIN=60000;',
    'const state=st,cfg={ourId:10,enemyId:0,historyLimit:12};',
    'const canCall=kind=>!(state.data.backoff[kind]?.until>Date.now());',
    'const call=async(path,kind)=>{visited.push(kind);'+
      'if(kind==="ourWars"||kind==="enemyWars")return null;'+
      'return {rankedwarreport:{war:{end:100,winner:10},factions:{'+
      '10:{name:"Us",score:500},20:{name:"Them",score:300}}}};};',
    'const buildAfterActions=()=>{};',
    region('  function historyCoverage(){','  async function ffRequest(url){')
  ].join('\n');
  const fn=runInNewContext(setup+';refreshHistory',{st,visited,Date});
  await fn(false);
  const reportCalls=visited.filter(x=>x.startsWith('report-'));
  assert.deepEqual(reportCalls,['report-2','report-3','report-4']);
  assert.equal(Object.keys(st.data.reports).length,3);
});

test('release syntax, hub identity and Torn PDA ASCII safety',()=>{
  assert.match(source,/^\\/\\/ @version\\s+1\\.5\\.5$/m);
  assert.match(source,/const ID='war', VER='1\\.5\\.5'/);
  assert.match(source,/version='1\\.5\\.5'/);
  assert.doesNotMatch(source,/[^\\x00-\\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
  assert.match(source,/rosterFresh\\('enemies'\\)\\?fmt\\(them\\.online\\)/);
});
