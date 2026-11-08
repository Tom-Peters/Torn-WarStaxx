import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const section=(from,to)=>{
  const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
  assert.ok(a>=0&&b>a,'Missing '+from);
  return source.slice(a,b);
};
test('hospital tiers change to orange at 15m and green at 5m, including friendly chips',()=>{
  const code=section('  function nativeWarHospitalTier(',
    '  function nativeWarStyle(){');
  const {nativeWarHospitalTier,nativeWarPaintHospital}=runInNewContext(
    code+';({nativeWarHospitalTier,nativeWarPaintHospital})',
    {Date,MIN:60000,positive:x=>Number(x)>0?Number(x):0});
  const at=100000000;
  assert.equal(nativeWarHospitalTier(at+15*60000,at),'wsnw-warning');
  assert.equal(nativeWarHospitalTier(at+5*60000,at),'wsnw-soon');
  assert.equal(nativeWarHospitalTier(at+15*60000+1,at),'');
  assert.equal(nativeWarHospitalTier(at+5*60000+1,at),'wsnw-warning');
  const applied=new Map(),removed=[];
  const timer={style:{setProperty:(name,value,priority)=>applied.set(name,[value,priority]),
    removeProperty:name=>{applied.delete(name);removed.push(name);}}};
  nativeWarPaintHospital(timer,'wsnw-warning');
  assert.deepEqual([...applied.get('color')],['#ffe1a1','important']);
  assert.equal(applied.get('background-color')[0],'#794615');
  nativeWarPaintHospital(timer,'wsnw-soon');
  assert.deepEqual([...applied.get('color')],['#c0ffe0','important']);
  assert.equal(applied.get('background-color')[0],'#155840');
  nativeWarPaintHospital(timer,'');
  assert.equal(applied.size,0,'normal/expired status drops the prior colours');
  assert.ok(removed.includes('box-shadow'));
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
test('passive TWSE copies and timers do not block geography grouping',()=>{
  const code=section('  function nativeWarConflict(', '  function observeNativeWarTransitions(');
  const {nativeWarConflict,nativeWarActiveSortConflict}=runInNewContext(
    code+';({nativeWarConflict,nativeWarActiveSortConflict})',{});
  const list={
    getAttribute:()=>null,
    querySelector:selector=>selector.includes('.twse-copy-btn')?{}:null
  };
  assert.equal(nativeWarConflict(list),true,'legacy diagnostic sees TWSE decoration');
  assert.equal(nativeWarActiveSortConflict(list),false,'copy decoration is not a sorter');
  list.getAttribute=name=>name==='data-twse-active-sort'?'true':null;
  assert.equal(nativeWarActiveSortConflict(list),true,'genuine sorter still wins');
  list.getAttribute=name=>name==='data-ffscouter-active-filter'?'true':null;
  assert.equal(nativeWarActiveSortConflict(list),true,'active FFScouter filter still wins');
});
test('both faction rosters use country grouping, plus visible control and live colours',()=>{
  const sorter=section('  function nativeWarSort(list,playerMap,mode){',
    '    function nativeWarFilters(');
  assert.match(sorter,/nativeWarActiveSortConflict\(list\)/);
  assert.match(sorter,/nativeWarCountryCompare\(nativeWarLocation\(pa\)\.country/);
  assert.match(sorter,/nativeWarAvailabilityRank\(pa\)-nativeWarAvailabilityRank\(pb\)/);
  const sync=section('  function syncNativeWar(){','  async function pollNativeWar(){');
  assert.match(sync,/else if\(kind==='hospital'\)message=/);
  assert.match(sync,/nativeWarPaintHospital\(timer,hospitalTier\)/);
  assert.match(sync,/nativeWarSortFriendly\(list,cfg\.nativeFriendlySort/);
  const ticking=section('  function tickNativeWar(){','  \/\/ Remove any newly injected WarStaxx titles');
  assert.match(ticking,/nativeWarPaintHospital\(span,tier\)/);
  assert.match(source,/data-wsnw-action="countries"/);
  assert.match(source,/if\(button\.dataset\.wsnwAction==='countries'\)/);
});
