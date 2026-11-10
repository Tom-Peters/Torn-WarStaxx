import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const src=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function fixture(){
 const state={12:{ff:2.34,at:Date.now()}},location={pathname:'/bounties.php',hash:'#!p=main'};
 const code=src.slice(src.indexOf("  const bountyPrefsKey="),src.indexOf('  function syncNativeProfile(){'));
 const api=runInNewContext(code+';({isBountyMain,bountyMoney,bountyStatus,bountyFacts,bountyHidden,bountyPrefs})',{
  URLSearchParams,location,localStorage:{getItem:()=>null},ffscouter:id=>state[id],ffIsStale:x=>Date.now()-x.at>86400000,pagePlayerId:a=>a.id});
 return {...api,location,state};
}
test('controls are limited to main bounty routes, including pagination',()=>{
 const v=fixture();for(const hash of ['', '#!p=main','#/!p=main&start=20','#/p=main']){v.location.hash=hash;assert.equal(v.isBountyMain(),true);}
 for(const hash of ['#/p=add','#!p=mine']){v.location.hash=hash;assert.equal(v.isBountyMain(),false);}
 v.location.hash='';v.location.pathname='/index.php';assert.equal(v.isBountyMain(),false);
});
test('payout parsing uses advertised money, handles shorthand and rejects other row numbers',()=>{
 const v=fixture();assert.equal(v.bountyMoney(' $2,000,000 '),2000000);assert.equal(v.bountyMoney('$1.5m'),1500000);assert.equal(v.bountyMoney('$900k'),900000);
 for(const value of ['Level 50','Unknown','$-100',''])assert.equal(v.bountyMoney(value),null);
});
test('unavailable and travelling filters are independent and do not assume abroad is unreachable',()=>{
 const v=fixture();for(const status of ['Hospital','Status: Jail','Federal jail','Fallen'])assert.equal(v.bountyStatus(status).unavailable,true);
 for(const status of ['Traveling','Travelling to Canada','Returning to Torn','Flying'])assert.equal(v.bountyStatus(status).travelling,true);
 assert.equal(v.bountyStatus('Okay').unavailable,false);assert.equal(v.bountyStatus('Abroad').travelling,false);
 assert.equal(v.bountyHidden({ff:2,unavailable:false,travelling:true},{max:0,hideUnavailable:true,hideTravelling:false}),false);
});
test('max FFS respects the boundary and leaves unknown or stale estimates visible',()=>{
 const v=fixture(),prefs={max:2.5,hideUnavailable:false,hideTravelling:false};
 assert.equal(v.bountyHidden({ff:2.5},prefs),false);assert.equal(v.bountyHidden({ff:2.51},prefs),true);assert.equal(v.bountyHidden({ff:null},prefs),false);
 const row={querySelector:selector=>selector.startsWith('.target')?{id:12}:selector==='.reward'?{textContent:'$500,000'}:{textContent:'Status: Okay'}};
 assert.equal(v.bountyFacts(row).ff,2.34);v.state[12].at=Date.now()-2*86400000;assert.equal(v.bountyFacts(row).ff,null);
});
test('default controls hide unavailable/travelling players and order by highest payout',()=>{
 const v=fixture();assert.equal(v.bountyPrefs.max,0);assert.equal(v.bountyPrefs.ascending,false);assert.equal(v.bountyPrefs.hideUnavailable,true);assert.equal(v.bountyPrefs.hideTravelling,true);
});
