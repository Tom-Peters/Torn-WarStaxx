import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const region=(a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'Missing source section '+a);
  return source.slice(start,end);
};
function locationHarness(){
  const code=region('  // Torn travel destinations and aliases;',
    '  function nativeWarOwnLocation(){')+
    region('  function roster(j,previous=[]){','  const officialNumber');
  const memberState=p=>{
    const s=String(p?.status||'').toLowerCase();
    if(s.includes('hospital'))return 'hospital';
    if(/travel|abroad/.test(s))return 'away';
    return s.includes('okay')?'okay':'unknown';
  };
  return runInNewContext(code+';({roster,nativeWarLocation,nativeHospitalCountry})',{
    memberState,Date,MIN:60000,Map,Number,
    positive:x=>Number(x)>0?Number(x):0,
    n:x=>Number.isFinite(Number(x))?Number(x):0,
    parseArray:j=>Array.isArray(j)?j:[],
    unpack:(j,k)=>j?.[k]??j
  });
}
const hospital=(id,description,location)=>({
  id,name:'Example',status:{state:'Hospital',description,until:1234},
  ...(location?{location:{name:location}}:{})
});
test('actual overseas Torn hospital descriptions resolve all twelve countries',()=>{
  const {nativeWarLocation:native}=locationHarness();
  const cases=[
    ['In an Argentinian hospital for 18 mins','Argentina'],
    ['In a Canadian hospital for 30 mins','Canada'],
    ['In a Cayman hospital for 9 mins','Cayman Islands'],
    ['In a Chinese hospital for 43 mins','China'],
    ['In an Emirati hospital for 57 mins','UAE'],
    ['In a Hawaiian hospital for 15 mins','Hawaii'],
    ['In a Japanese hospital for 2 hrs 10 mins','Japan'],
    ['In a Mexican hospital for 5 mins','Mexico'],
    ['In a South African hospital for 1 hrs 43 mins','South Africa'],
    ['In a Swiss hospital for 25 mins','Switzerland'],
    ['In a UK hospital for 12 mins','United Kingdom'],
    ['In hospital for 22 mins','Torn']
  ];
  for(const [desc,country] of cases){
    assert.equal(native({status:'Hospital',statusText:desc}).country,country,desc);
  }
});
test('hospital description is authoritative over generic roster location',()=>{
  const {roster,nativeWarLocation:location}=locationHarness();
  const hospitalised=roster({members:[hospital(100,'In a Japanese hospital for 2 hrs','Torn')]});
  assert.equal(location(hospitalised[0]).country,'Japan');
  assert.equal(hospitalised[0].hospitalCountry,'Japan');
  const repeat=roster({members:[hospital(100,'Hospitalized by an enemy')]},hospitalised);
  assert.equal(location(repeat[0]).country,'Japan');
});
test('country follows both own and enemy roster parse without earlier travel records',()=>{
  const {roster,nativeWarLocation:location}=locationHarness();
  for(const id of [100,200]){
    const list=roster({members:[hospital(id,'In a Canadian hospital for 30 mins')]});
    assert.equal(location(list[0]).country,'Canada');
    assert.equal(list[0].hospitalCountry,'Canada');
  }
});
test('maliciously similar status names are not interpreted as place evidence',()=>{
  const {nativeWarLocation:location}=locationHarness();
  assert.equal(location({status:'Hospital',statusText:'Hospitalized by Canadian'}).country,'Unknown');
  assert.equal(location({status:'Hospital',statusText:'Lost fight against Mexican'}).country,'Unknown');
  assert.equal(location({status:'Hospital',statusText:'Hospitalized in Canada'}).country,'Canada');
  assert.equal(location({status:'Hospital',statusText:'In hospital in Mexico'}).country,'Mexico');
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
