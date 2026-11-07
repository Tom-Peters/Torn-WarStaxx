import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext, Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(a,b){
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'Missing source region '+a);
  return source.slice(start,end);
}
const positive=x=>Number.isFinite(Number(x))&&Number(x)>0?Number(x):0;
const memberState=p=>{
  const v=String(p?.status||'').toLowerCase();
  return /trav|abroad/.test(v)?'away':/hospital/.test(v)?'hospital':/okay/.test(v)?'okay':'unknown';
};
function geographical(){
  return runInNewContext(region('  // Torn travel destinations and aliases;',
    '  function flightCountdown(ms,at=Date.now()){')+
    ';({nativeWarLocation,nativeWarOwnLocation})',{
      state:{data:{meta:{ownerId:1},ours:[{id:1,status:'Abroad',statusText:'In Canada'}]}},
      Date,MIN:60000,Number,positive,memberState
    });
}
test('Torn v2 from-to flight description is recognized without a separate travel API call',()=>{
  const x=geographical();
  const cases=[
    ['Traveling from Torn to China','China'],
    ['Traveling from Japan to Torn','Torn'],
    ['Traveling to Canada','Canada'],
    ['Returning from Canada','Torn'],
    ['Torn to China','China'],
    ['Traveling from Torn to South Africa','South Africa']
  ];
  for(const [statusText,country] of cases){
    const place=x.nativeWarLocation({status:'Traveling',statusText});
    assert.equal(place.country,country,statusText);
    assert.equal(place.phase,'inbound');
  }
  assert.equal(x.nativeWarLocation({status:'Traveling',statusText:'Traveling'}).country,'Unknown');
  assert.equal(x.nativeWarLocation({status:'Hospital',statusText:'Hospitalized by Canada'}).country,'Torn');
  assert.deepEqual({...x.nativeWarOwnLocation()},{country:'Canada',known:true,phase:'abroad'});
});
test('hospital warning threshold is orange at 15m and green at 5m',()=>{
  const {nativeWarHospitalTier}=runInNewContext(region('  function nativeWarHospitalTier(',
    '  function nativeWarStyle(){')+';({nativeWarHospitalTier})',{
      Date,MIN:60000,positive
    });
  const at=1_000_000;
  for(const [minutes,expected] of [[20,''],[16,''],[15,'wsnw-warning'],
    [10,'wsnw-warning'],[5,'wsnw-soon'],[1,'wsnw-soon'],[0,'']]){
    assert.equal(nativeWarHospitalTier(at+minutes*60000,at),expected,minutes+' minutes');
  }
});
test('compact strip keeps accessible scrolling, colored status, Skull badge and legible phone text',()=>{
  const css=region('  function nativeWarStyle(){',
    '  // An opt-in small, draggable chain indicator.');
  assert.match(css,/touch-action:pan-y pinch-zoom!important/);
  assert.match(css,/wsnw-status\.wsnw-warning/);
  assert.match(css,/wsnw-status\.wsnw-soon/);
  assert.match(css,/wsnw-role\.wsnw-heavy\{display:inline-flex!important/);
  assert.match(css,/width:24px!important/);
  assert.doesNotMatch(css,/wsnw-role\.wsnw-heavy::after/);
  assert.match(css,/font-size:11px!important;padding:1px 3px!important/);
  assert.match(source,/FLIGHT \| DEST HIDDEN/);
  assert.doesNotThrow(()=>new Script(source));
  assert.ok([...source].every(x=>x.charCodeAt(0)<128),'Torn PDA must receive ASCII-only source');
});
