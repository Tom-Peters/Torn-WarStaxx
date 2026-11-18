import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const part=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function fixture(response){
 const calls=[];
 const scope={console,URLSearchParams,Date,document:{hidden:false},render(){},syncPageBse(){},
  activeWarNow:()=>true,rosterFresh:()=>true,ffIsStale:()=>false,checkFFRegistration:async()=>{},ffRequest:async url=>{calls.push(url);return typeof response==='function'?response(url):response;},
  effectiveKey:()=> 'fixture',positive:v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0,
  n:v=>Number(v)||0,esc:String,fmt:String,age:()=> 'recent',stamp:String,b:()=>'',a:()=>'',card:(h,b)=>h+b,link:String,empty:String,
  cfg:{ffEnabled:true,ffConsent:true,ffKey:'fixture'},MIN:60000,HOUR:3600000,
  state:{data:{meta:{ffRegistration:{premium:true,at:Date.now()}},ffstats:{},enemies:[],ours:[]}}};
 const code=part('  const scouterExtra=','  // Fair Fight from FFScouter')+part('  const ffApiKey=','  function matchup(')+
 part('  function flightCountdown(', '  function inboundReturns(')+
 ';({flightRouteLine,premiumTravelTimer,scouterFlightText,scouterExtra,parseFFRows,ffscouter,parseScouterFlights,parseScouterActivity,scouterRead,scouterScreen,scouterPremiumActive,scouterArrivalAlerts,scouterDistributionText,pollScouterFlights})';
 return {...runInNewContext(code,scope),scope,calls};
}
test('OpenAPI 1.20.0 selected estimate, distribution and spy provenance remain separate',()=>{
 const f=fixture(),at=Date.now();
 const rows=f.parseFFRows([{player_id:11,source:'premium',fair_fight:5.5,bs_estimate:1000,premium_insights_available:true,
  distribution:{last_updated:at/1000,stats_percentage:{strength:70,speed:20}},
  available_estimates:{bss:{bs_estimate:800,fair_fight:2,last_updated:at/1000},premium:{bs_estimate:1000,fair_fight:5.5}},
  spies:[{total:900,source:'tornstats',last_updated:at/1000,strength:500}]}],[11],at);
 f.scope.state.data.ffstats=rows;
 assert.equal(f.ffscouter(11).ff,5.5);assert.equal(rows[11].distribution.percentages.strength,70);
 assert.equal(rows[11].distribution.percentages.dexterity,undefined);assert.equal(rows[11].spies[0].defense,null);
 f.scope.state.data.meta.ffRegistration.premium=false;
 assert.equal(f.ffscouter(11).ff,2);assert.equal(f.ffscouter(11).distribution,null);assert.equal(f.ffscouter(11).source,'bss');
});
test('Flight unknown, absent trip and arrival windows are not converted into Torn location',()=>{
 const f=fixture(),out=f.parseScouterFlights({flights:[{player_id:11,current:null},{player_id:12,current:{status_description:'Traveling to Japan',earliest_arrival_time:1800000000,latest_arrival_time:1800003600}}]},[11,12,13]);
 assert.equal(out[11].current,null);assert.equal(out[13].unknown,true);assert.equal(out[12].current.latest-out[12].current.earliest,3600000);
 assert.throws(()=>f.parseScouterFlights({},[11]));
});
test('Scanner activity rejects wrong identity and keeps zero observations distinct',()=>{
 const f=fixture(),body={meta:{subject_type:'player',subject_id:11,start:100,end:10000,truncated:false},buckets:[{ts:100,activity_score:0},{ts:3700,activity_score:5},{ts:3700,activity_score:5}]};
 assert.equal(f.parseScouterActivity(body,11).rows.length,2);
 assert.equal(f.parseScouterActivity(body,11).rows[0].score,0);
 assert.throws(()=>f.parseScouterActivity(body,12));
});
test('Premium calls are consent-gated, throttled, and never retain echoed key parameters',async()=>{
 const f=fixture({parameters:{key:'never-store-me'},targets:[{player_id:11,name:'Target',fair_fight:2,bs_estimate:100}]});
 await f.scouterRead('targets');assert.equal(f.calls.length,1);assert.equal(f.scouterExtra.targets[0].id,11);
 assert.doesNotMatch(JSON.stringify(f.scouterExtra),/never-store-me/);
 await f.scouterRead('targets');assert.equal(f.calls.length,1);
 f.scope.cfg.ffConsent=false;await f.scouterRead('targets');assert.equal(f.calls.length,1);assert.equal(f.scouterExtra.targets.length,0);
});
test('In-flight Premium responses are discarded after the key changes',async()=>{
 let resolve;const f=fixture(()=>new Promise(r=>resolve=r));
 const request=f.scouterRead('targets');await new Promise(r=>setImmediate(r));
 f.scope.cfg.ffKey='other';resolve({targets:[{player_id:11,name:'Old key result'}]});await request;
 assert.equal(f.scouterExtra.targets.length,0);
});
test('Activity success code zero is accepted by the native FFScouter transport',async()=>{
 const transport=part('  async function ffRequest(url){','  async function checkFFRegistration(');
 const call=runInNewContext(transport+';ffRequest',{PDA_httpGet:async()=>({status:200,responseText:'{"code":0,"buckets":[]}'}),setTimeout:()=>0});
 assert.equal((await call('https://ffscouter.com/api/v1/activity/player')).code,0);
});

test('Arrival alerts require recent observations, upcoming windows and enabled Premium',()=>{
 const f=fixture(),now=Date.now();f.scouterExtra.flights={11:{at:now,current:{earliest:now+60000,latest:now+180000}}};
 assert.equal(f.scouterArrivalAlerts(now).length,1);
 assert.equal(f.scouterArrivalAlerts(now+4*60000).length,0);
 f.scope.state.data.enemies=[{id:11,updated:now+1,status:'Okay'}];assert.equal(f.scouterArrivalAlerts(now).length,0);
 f.scope.state.data.enemies=[];f.scope.cfg.scouterFlightAlerts=false;assert.equal(f.scouterArrivalAlerts(now).length,0);
 f.scope.cfg.scouterFlightAlerts=true;f.scope.cfg.ffConsent=false;assert.equal(f.scouterArrivalAlerts(now).length,0);
});
test('Expanded distribution preserves missing stats and entitlement',()=>{
 const f=fixture();f.scope.state.data.ffstats[11]={at:Date.now(),distribution:{percentages:{strength:70,speed:30},at:0}};
 assert.match(f.scouterDistributionText(11),/STR 70% \/ SPD 30%/);
 assert.doesNotMatch(f.scouterDistributionText(11),/DEF 0/);
 f.scope.cfg.ffConsent=false;assert.equal(f.scouterDistributionText(11),'');
});

test('Premium return flight shows countdown, TCT landing and window on a mobile roster',()=>{
 const f=fixture(),time=t=>Date.parse('2026-01-01T'+t+'Z'),now=time('14:45:35');
 const trip={description:'Traveling from South Africa to Torn',method:'PI',
  earliest:time('17:20:00'),latest:time('17:35:00'),approx:0};
 const place={country:'Torn',phase:'inbound'};
 f.scope.nativeWarLocation=()=>place;
 f.scouterExtra.flights[12]={at:now,current:trip};
 assert.equal(f.flightRouteLine(trip),'South Africa → Torn / ~17:28 TCT');
 assert.equal(f.premiumTravelTimer({id:12},place,now),'~2h 42m');
 assert.match(f.scouterFlightText(12),/PI.*17:28 TCT.*17:20 to 17:35 TCT/);
 trip.approx=time('17:25:00');
 assert.equal(f.flightRouteLine(trip),'South Africa → Torn / ~17:25 TCT');
 assert.equal(f.premiumTravelTimer({id:12},place,now+4*60000),'');
});
