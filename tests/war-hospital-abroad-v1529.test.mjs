import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const region=(a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'Expected source section: '+a);
  return source.slice(start,end);
};
function harness(){
  const memberState=p=>{
    const text=String(p?.status||'').toLowerCase();
    if(text.includes('hospital'))return 'hospital';
    if(/trav|abroad/.test(text))return 'away';
    if(text.includes('jail'))return 'jail';
    if(text.includes('okay'))return 'okay';
    return 'unknown';
  };
  const code=region('  // Torn travel destinations and aliases;',
    '  function nativeWarOwnLocation(){')+
    region('  function roster(j,previous=[]){','  const officialNumber');
  return runInNewContext(code+';({nativeWarLocation,roster})',{
    Date,Map,Number,MIN:60000,positive:x=>Number(x)>0?Number(x):0,
    n:x=>Number.isFinite(Number(x))?Number(x):0,
    memberState,parseArray:j=>Array.isArray(j)?j:[],
    unpack:(j,k)=>j?.[k]??j
  });
}
const fixture=(id,state,description='',location='')=>({
  id,name:'Test member '+id,level:20,status:{state,description,until:100},
  ...(location?{location:{name:location}}:{}),
  last_action:{status:'Offline',timestamp:99}
});

test('hospital abroad keeps last observed destination for enemy and friendly rosters',()=>{
  const {roster,nativeWarLocation:place}=harness();
  for(const id of [101,201]){
    const abroad=roster({members:[fixture(id,'Abroad','In Japan')]});
    assert.equal(place(abroad[0]).country,'Japan');
    const hospital=roster({members:[fixture(id,'Hospital','In hospital')]},abroad);
    assert.equal(place(hospital[0]).country,'Japan');
    assert.equal(hospital[0].hospitalCountry,'Japan');
    const repeated=roster({members:[fixture(id,'Hospital','In hospital')]},hospital);
    assert.equal(place(repeated[0]).country,'Japan','hospital country survives subsequent refreshes');
    const after=roster({members:[fixture(id,'Okay','') ]},repeated);
    assert.equal(place(after[0]).country,'Torn','hospital-specific cache must clear after status change');
    assert.equal(after[0].hospitalCountry,undefined);
  }
});
test('flight transition uses destination, but a flight returning home records Torn',()=>{
  const {roster,nativeWarLocation:place}=harness();
  const outbound=roster({members:[fixture(3,'Traveling','Traveling to Canada')]});
  const admitted=roster({members:[fixture(3,'Hospital','In hospital')]},outbound);
  assert.equal(place(admitted[0]).country,'Canada');
  const inbound=roster({members:[fixture(4,'Traveling','Returning from Canada')]});
  const home=roster({members:[fixture(4,'Hospital','In hospital')]},inbound);
  assert.equal(place(home[0]).country,'Torn');
});
test('unknown hospital country never silently becomes Torn',()=>{
  const {roster,nativeWarLocation:place}=harness();
  const unknown=roster({members:[fixture(6,'Hospital','In hospital for 3h')]});
  assert.equal(place(unknown[0]).country,'Unknown');
  assert.equal(place(unknown[0]).phase,'unknown-hospital');
  assert.equal(place({status:'Hospital',statusText:'Hospitalized by Canada'}).country,'Unknown');
  assert.equal(place({status:'Hospital',statusText:'In hospital in Mexico'}).country,'Mexico');
  const explicit=roster({members:[fixture(7,'Hospital','In hospital','South Africa')]});
  assert.equal(place(explicit[0]).country,'South Africa');
  const rechecked=roster({members:[fixture(7,'Hospital','In hospital')]},explicit);
  assert.equal(place(rechecked[0]).country,'South Africa');
  assert.equal(place({status:'Hospital',statusText:'Hospitalized in the Cayman Islands'}).country,'Cayman Islands');
});
test('both roster refresh pathways merge prior evidence without new API requests',()=>{
  assert.match(source,/const fresh=roster\(enemy,old\)/);
  assert.match(source,/const next=roster\(fresh,prior\)/);
  assert.match(source,/state\.data\.ours=roster\(own,state\.data\.ours\)/);
  assert.match(source,/state\.data\.ours=roster\(ours,state\.data\.ours\)/);
  assert.match(source,/state\.data\.enemies=roster\(enemies,state\.data\.enemies\)/);
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
