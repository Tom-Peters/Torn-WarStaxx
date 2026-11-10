import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const src=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const code=src.slice(src.indexOf('  const pageBseRows=new Map()'),src.indexOf('  function syncNativeProfile(){'));
function fixture(){
 const calls=[],cfg={ffEnabled:true,ffConsent:true},state={data:{ffstats:{},updated:{},errors:{},backoff:{}}},document={hidden:false};let key='fixture';let fail=false;
 const ctx={URL,URLSearchParams,Date,Map,Set,Number,Math,Array,String,cfg,state,document,location:{href:'https://www.torn.com/bounties.php'},MIN:60000,HOUR:3600000,
  n:x=>Number(x)||0,ffscouter:id=>cfg.ffConsent&&cfg.ffEnabled?state.data.ffstats[id]:null,ffIsStale:x=>Date.now()-x.at>=86400000,fmt:String,age:()=> 'recent',nativeCompactTotal:String,
  ffApiKey:()=>key,canCall:(kind,min=0)=>Date.now()-(state.data.updated[kind]||0)>=min&&!(state.data.backoff[kind]?.until>Date.now()),checkFFRegistration:async()=>{},save(){},
  ffRequest:async url=>{calls.push(url);if(fail)throw Error('offline');return [];},parseFFRows:(_,ids)=>Object.fromEntries(ids.map(id=>[id,{at:Date.now(),bsEstimate:null}]))};
 const api=runInNewContext(code+';({pagePlayerId,pageBseValue,refreshPageBse,setBusy(v){rosterFFBusy=v;}})',ctx);
 return {...api,cfg,state,document,calls,key:v=>{key=v;},fail:()=>{fail=true;}};
}
test('profile IDs accept genuine Torn links and reject unrelated, malformed or external IDs',()=>{
 const v=fixture(),id=href=>v.pagePlayerId({getAttribute:()=>href});
 assert.equal(id('/profiles.php?XID=123'),123);assert.equal(id('https://torn.com/profiles.php?xid=456#detail'),456);
 for(const x of ['https://evil.example/profiles.php?XID=123','/profiles.php?XID=12junk','/profiles.php?XID=0','/profiles.php?XID=-12','/factions.php?ID=123','javascript:alert(1)'])assert.equal(id(x),0);
});
test('BSE uses total estimates only, marks stale data and never substitutes BSS',()=>{
 const v=fixture();v.state.data.ffstats[12]={at:Date.now(),bss:999};assert.equal(v.pageBseValue(12).label,'BSE ?');
 v.state.data.ffstats[12]={at:Date.now()-2*86400000,bsEstimate:123456};assert.equal(v.pageBseValue(12).label,'BSE ~123456');assert.equal(v.pageBseValue(12).stale,true);
 v.cfg.ffConsent=false;assert.equal(v.pageBseValue(12).label,'BSE off');
});
test('list lookup works without faction membership, deduplicates IDs and caps batches at 205',async()=>{
 const v=fixture();await v.refreshPageBse([12,12,...Array.from({length:220},(_,i)=>i+20)]);
 assert.equal(v.calls.length,1);const ids=new URL(v.calls[0]).searchParams.get('targets').split(',');assert.equal(ids.length,205);assert.equal(new Set(ids).size,205);
});
test('consent, hidden tabs and roster requests block generic lookup',async()=>{
 const v=fixture();v.cfg.ffConsent=false;await v.refreshPageBse([12]);v.cfg.ffConsent=true;v.document.hidden=true;await v.refreshPageBse([12]);v.document.hidden=false;v.setBusy(true);await v.refreshPageBse([12]);assert.equal(v.calls.length,0);
});
test('positive and missing caches prevent repeated page-navigation requests',async()=>{
 const v=fixture();v.state.data.ffstats[12]={at:Date.now()-3600000,bsEstimate:123};v.state.data.ffstats[13]={at:Date.now()-60000,bsEstimate:null};await v.refreshPageBse([12,13]);assert.equal(v.calls.length,0);
 v.state.data.ffstats[13].at=Date.now()-31*60000;await v.refreshPageBse([12,13]);assert.equal(v.calls.length,1);assert.equal(new URL(v.calls[0]).searchParams.get('targets'),'13');
 await v.refreshPageBse([14]);assert.equal(v.calls.length,1);
});
test('failed requests back off rather than hammering each page list',async()=>{
 const v=fixture();v.fail();await v.refreshPageBse([12]);assert.equal(v.calls.length,1);assert.match(v.state.data.errors.ffscouter,/offline/);v.state.data.updated.fflists=0;await v.refreshPageBse([12]);assert.equal(v.calls.length,1);
});
