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

test('v1.5.16 country separators have strong hierarchy and readable counters',()=>{
  assert.ok(css.includes('li.wsnw-country-heading{display:flex!important'));
  assert.ok(css.includes('margin:12px 0 4px!important'));
  assert.ok(css.includes('border-top:2px solid #56cfff!important'));
  assert.ok(css.includes('wsnw-country-title'));
  assert.ok(css.includes('wsnw-country-meta'));
  assert.ok(css.includes('wsnw-your-country'));
  assert.ok(source.includes('heading.replaceChildren(title,stats)'));
});

test('Black Skull target is a single purple icon, never a long badge',()=>{
  assert.ok(native.includes("if(enemy)role=band.heavy.has(id)?'\\u2620'"));
  assert.ok(css.includes('.wsnw-role.wsnw-heavy{'));
  assert.ok(css.includes('width:24px!important'));
  assert.ok(!css.includes('wsnw-role.wsnw-heavy::after'));
  assert.ok(native.includes('BLACK SKULL TARGET: high-strength opponent'));
});

test('expanded details grow down, do not create a sideways scroller',()=>{
  assert.ok(css.includes('wsnw-expanded{height:var(--wsnw-expanded-height'));
  assert.ok(css.includes('flex-wrap:wrap!important'));
  assert.ok(css.includes('wsnw-expanded > .wsnw-intel{top:36px!important;height:auto!important'));
  assert.ok(css.includes('white-space:normal!important;overflow-x:hidden!important'));
  assert.ok(native.includes('Math.ceil(infoBar.scrollHeight)'));
  assert.ok(native.includes("row.style.setProperty('--wsnw-expanded-height'"));
  assert.ok(native.includes("window.addEventListener('resize'"));
  assert.ok(!css.includes('overflow-x:auto!important;touch-action:auto!important'));
  assert.doesNotThrow(()=>new Script(source));
});
