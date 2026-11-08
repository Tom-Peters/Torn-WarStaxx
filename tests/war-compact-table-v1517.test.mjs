import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(from,to){
  const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
  assert.ok(a>=0&&b>a,'Required source region: '+from);
  return source.slice(a,b);
}
test('v1.5.28 command summary is compact, useful and non-sticky',()=>{
  const bar=region('  function renderWarStrip(force=false){','  function confirmed(message){');
  const scroll=region('  function handleWarScroll(e){','  function renderWarStrip(force=false){');
  assert.match(bar,/position:static;top:auto;z-index:auto/);
  assert.match(bar,/position:static!important;top:auto!important/);
  assert.match(bar,/compact=!state\.stripExpanded/);
  assert.match(bar,/btn\('TURTLE','turtle'\)/);
  assert.match(bar,/btn\(actionLabel,'hit'\)/);
  assert.match(bar,/btn\('Room','war'\)/);
  assert.match(bar,/btn\(compact\?'More':'Less','compact'\)/);
  assert.doesNotMatch(scroll,/renderWarStrip\(true\)/);
});
test('native tactical rows retain Torn columns and align secondary intelligence into five columns',()=>{
  const style=region('  function nativeWarStyle(){',
    '  // An opt-in small, draggable chain indicator.');
  const render=region('  function syncNativeWar(){','  async function pollNativeWar(){');
  assert.match(style,/grid-template-columns:26px minmax/);
  assert.match(style,/wsnw-owner\{display:none!important/);
  for(const key of ['role','status','presence','bss','ff']){
    assert.match(style,new RegExp('data-wsnw-chip=[^;]*'+key),key);
  }
  assert.match(style,/touch-action:pan-y pinch-zoom!important/);
  assert.match(style,/wsnw-expanded .wsnw-intel .wsnw-owner\{display:block/);
  assert.match(render,/nativeWarLegend\(list,rows\)/);
  assert.match(source,/list\.before\(heading\)/);
  assert.match(source,/\.faction-war \.wsnw-legend/);
});
test('PDA ASCII quoting and syntax remain safe',()=>{
  assert.match(source,/^\/\/ @version\s+1\.5\.28$/m);
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
});
