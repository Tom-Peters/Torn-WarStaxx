import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const between=(start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Expected WarStaxx region '+start);
  return source.slice(a,b);
};
const css=between('  function nativeWarStyle(){','  // An opt-in small, draggable chain indicator.');
const native=between('  function syncNativeWar(){','  async function pollNativeWar(){');

test('v1.5.16 country separators have strong visual hierarchy and clear counters',()=>{
  assert.match(css,/li\\.wsnw-country-heading\\{display:flex!important/);
  assert.match(css,/margin:12px 0 4px!important/);
  assert.match(css,/border-top:2px solid #56cfff!important/);
  assert.match(css,/wsnw-country-title/);
  assert.match(css,/wsnw-country-meta/);
  assert.match(css,/wsnw-your-country/);
  assert.match(source,/heading\\.replaceChildren\\(title,stats\\)/);
});

test('Black Skull target is a single purple icon, never a long badge',()=>{
  assert.match(native,/if\\(enemy\\)role=band\\.heavy\\.has\\(id\\)\\?'\\\\u2620'/);
  assert.match(css,/\.wsnw-role\.wsnw-heavy\\{/);
  assert.match(css,/width:24px!important/);
  assert.doesNotMatch(css,/wsnw-role\.wsnw-heavy::after/);
  assert.match(native,/BLACK SKULL TARGET: high-strength opponent/);
});

test('expanded details grow down, do not create a sideways scroller',()=>{
  assert.match(css,/wsnw-expanded\\{height:var\\(--wsnw-expanded-height/);
  assert.match(css,/flex-wrap:wrap!important/);
  assert.match(css,/wsnw-expanded > \.wsnw-intel\\{top:36px!important;height:auto!important/);
  assert.match(css,/white-space:normal!important;overflow-x:hidden!important/);
  assert.match(native,/Math\\.ceil\\(infoBar\\.scrollHeight\\)/);
  assert.match(native,/row\\.style\\.setProperty\\('--wsnw-expanded-height'/);
  assert.match(native,/window\\.addEventListener\\('resize'/);
  assert.doesNotMatch(css,/overflow-x:auto!important;touch-action:auto!important/);
  assert.doesNotThrow(()=>new Script(source));
});
