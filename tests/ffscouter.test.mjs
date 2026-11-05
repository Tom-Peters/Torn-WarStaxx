import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function between(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing FF implementation: '+start);
  return source.slice(a,b);
}
function ffFixture(){
  const code=String.raw`
    const HOUR=3600000;
    const cfg={ffEnabled:true,ffConsent:true,ffKey:'myregisteredkey'};
    const state={data:{ffstats:{},enemies:[{id:101},{id:102},{id:103}],updated:{},attacks:[]}};
    const n=v=>Number.isFinite(Number(v))?Number(v):0;
    const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
    const effectiveKey=()=> 'tornpdakey';
    const age=t=>t?'recent':'never';
    const esc=v=>String(v);
    const b=()=>'<button>Click</button>';
    const ffObserved=()=>({count:0,avg:null});
    `+between('  const ffApiKey=','  function matchup(')+String.raw`
    ({cfg,state,ffApiKey,parseFFRows,ffscouter,ffLabel,ffCoverage,ffBadge,validFF,ffTimestamp})
  `;
  return runInNewContext(code);
}
test('FFScouter returns usable FF, BSS, estimate source, date and missing data',()=>{
  const v=ffFixture(),now=Date.now();
  const result=v.parseFFRows([
    {player_id:101,fair_fight:2.87,bss_public:2500.25,bs_estimate:120000,
      bs_estimate_human:'120k',source:'bss',last_updated:'2026-11-03T12:00:00Z'},
    {player_id:102,fair_fight:null,bss_public:null},
    {player_id:999,fair_fight:3,bss_public:12345}
  ],[101,102,103],now);
  assert.equal(result[101].ff,2.87);
  assert.equal(result[101].bss,2500.25);
  assert.equal(result[101].bsHuman,'120k');
  assert.equal(result[101].source,'bss');
  assert.ok(result[101].updatedAt>0);
  assert.equal(result[101].at,now);
  assert.equal(result[102].ff,null);
  assert.equal(result[102].bss,null);
  assert.equal(result[103].missing,true);
  assert.equal(result[999],undefined);
});
test('FF values outside range and null remain unknown; never fabricated 1.00x',()=>{
  const v=ffFixture(),rows=v.parseFFRows([
    {player_id:101,fair_fight:null},
    {player_id:102,fair_fight:0},
    {player_id:103,fair_fight:4.2}
  ],[101,102,103]);
  assert.deepEqual([rows[101].ff,rows[102].ff,rows[103].ff],[null,null,null]);
  assert.equal(v.validFF(undefined),null);
  assert.equal(v.validFF(''),null);
});
test('FF badge is sourced from FFScouter when consent and data are valid',()=>{
  const v=ffFixture();
  v.state.data.ffstats[101]={ff:2.81,bss:2600,at:Date.now(),source:'bss'};
  assert.equal(v.ffLabel(101).value,'2.81x');
  assert.match(v.ffBadge(101),/FF 2.81x/);
  assert.equal(v.ffCoverage().covered,1);
  v.cfg.ffConsent=false;
  assert.equal(v.ffscouter(101),null);
  assert.equal(v.ffLabel(101).source,'unknown');
});
test('FF key falls back to Torn PDA key only when separate key absent',()=>{
  const v=ffFixture();
  assert.equal(v.ffApiKey(),'myregisteredkey');
  v.cfg.ffKey='';
  assert.equal(v.ffApiKey(),'tornpdakey');
});
test('native Torn PDA transport is preferred over GM XMLHttpRequest',async()=>{
  let calls=0;
  const code=between('  async function ffRequest(url){','  async function checkFFRegistration(');
  const request=runInNewContext(String.raw`
    const PDA_httpGet=async url=>({status:200,responseText:JSON.stringify([{player_id:101,fair_fight:2.7}])});
    const GM_xmlhttpRequest=()=>{throw new Error('GM should not run in PDA')};
    `+code+'; ffRequest',{setTimeout});
  const data=await request('https://ffscouter.com/api/v1/get-stats?key=redacted&targets=101');
  assert.ok(Array.isArray(data));
  assert.equal(data[0].fair_fight,2.7);
});
test('native Torn PDA transport exposes HTTP errors rather than swallowing them',async()=>{
  const code=between('  async function ffRequest(url){','  async function checkFFRegistration(');
  const request=runInNewContext(String.raw`
    const PDA_httpGet=async()=>({status:401,responseText:'{"error":"Invalid key","code":401}'});
    `+code+'; ffRequest',{setTimeout});
  await assert.rejects(request('https://ffscouter.com/api/v1/get-stats'),/FFScouter HTTP 401/);
});
test('FF is next to player names and remains distinct from team-specific matchup FF',()=>{
  assert.match(source,/infoButton\(p\.name,p\.id\)\+' '\+ffBadge\(p\.id\)/);
  assert.match(source,/infoButton\(x\.enemy\.name,x\.enemy\.id\)\+' '\+ffBadge\(x\.enemy\.id\)/);
  assert.match(source,/individual hitter/);
  assert.match(source,/const own=ownExact!==null/);
  assert.match(source,/action==='refresh-ff'/);
  assert.match(source,/action==='check-ff-key'/);
  assert.match(source,/function threatRating\(/);
  assert.match(source,/function warContributionIntel\(/);
  assert.match(source,/function encountersPanel\(/);
});
test('distributed PDA source and smart-quote normalisation are parser-safe',()=>{
  assert.ok(source.startsWith('// ==UserScript==\n'));
  assert.match(source,/\/\/ @version\s+1\.5\.4/);
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
  const normalised=source.replace(/[\u2018\u2019]/gu,"'").replace(/[\u201c\u201d]/gu,'"');
  assert.doesNotThrow(()=>new Script(normalised));
});
