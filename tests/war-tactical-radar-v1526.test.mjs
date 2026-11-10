import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const from=source.indexOf('  function nativeWarTacticalPulse(');
const until=source.indexOf('  function nativeWarToolbar(',from);
assert.ok(from>0&&until>from,'Tactical pulse exposes a self-contained evidence boundary');
const excerpt=source.slice(from,until);

function fixture({enemyFresh=true,ourFresh=true,scanKnown=true}={}){
  const at=Date.now();
  const enemies=[
    {id:1,status:'Okay'},{id:2,status:'Okay'},
    {id:3,status:'Hospital',until:at+4*60000},
    {id:4,status:'Hospital',until:at+6*60000},
    {id:5,status:'Okay'},
  ];
  const data={enemies,ours:[{id:51},{id:52}]};
  const state={data},cfg={autoConceded:true};
  const scope=createContext({
    Date,MIN:60000,String,Boolean,Set,state,cfg,
    rosterFresh:side=>side==='enemies'?enemyFresh:ourFresh,
    enemyRoleBands:()=>({heavy:new Set([1,2])}),
    memberState:p=>p.status==='Hospital'?'hospital':'okay',
    positive:v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0,
    n:v=>Number.isFinite(Number(v))?Number(v):0,
    concessionSnapshot:()=>scanKnown?{known:true,complete:false,
      enemyAttackers:{1:{enemyScore:12},2:{enemyScore:0},5:{enemyScore:5}}}:null,
    liveWarMemberImpact:id=>({underFire:id===51}),
  });
  new Script(excerpt+';globalThis.exposed={nativeWarTacticalPulse,nativeWarPulseMarkup};')
    .runInContext(scope);
  return {...scope.exposed,at};
}

test('pulse counts only fresh, observed tactical opportunities',()=>{
  const f=fixture(),p=f.nativeWarTacticalPulse(undefined,f.at);
  assert.equal(p.ready,3);
  assert.equal(p.heavyReady,2);
  assert.equal(p.closeExit,1);
  assert.equal(p.scorers,2);
  assert.equal(p.underFire,1);
  assert.equal(p.scanState,'PARTIAL');
  const markup=f.nativeWarPulseMarkup(p,'heavy');
  assert.match(markup,/data-wsnw-action="pulse-heavy" aria-pressed="true"/);
  assert.match(markup,/SCORERS/);
  assert.match(markup,/Feed PARTIAL/);
});
test('stale rosters never invent counts or claim confirmed zeros',()=>{
  const f=fixture({enemyFresh:false,ourFresh:false,scanKnown:false});
  const p=f.nativeWarTacticalPulse(undefined,f.at);
  for(const key of ['ready','heavyReady','closeExit','scorers','underFire'])
    assert.equal(p[key],null,key);
  assert.equal(p.scanState,'WAIT');
  const markup=f.nativeWarPulseMarkup(p,'all');
  assert.match(markup,/ROSTER STALE/);
  assert.match(markup,/SKULL \?/);
  assert.match(markup,/UNDER FIRE \?/);
});
test('published script, loader, application and package share one release version',()=>{
  const packageJson=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  assert.match(source,/^\/\/ @version\s+2\.3\.0$/m);
  assert.match(source,/const id='war', version='2\.3\.0';/);
  assert.match(source,/const ID='war', VER='2\.3\.0'/);
  assert.equal(packageJson.version,'2.3.0');
  assert.doesNotMatch(source,/[^\x00-\x7f]/,'Torn PDA must parse ASCII-only userscript source');
  assert.doesNotThrow(()=>new Script(source));
});
test('enemy table keeps six aligned columns, three swappable observed metrics, and native scroll',()=>{
  assert.match(source,/nativeEnemyMetric:'points'/);
  assert.match(source,/data-wsnw-metric/);
  assert.match(source,/\['points','War points'\],\['pace','Points per hour'\],\['hits','Scoring hits'\]/);
  assert.match(source,/nativeWarTacticalPulse\(bands\)/);
  assert.match(source,/item\('pulse-hospital'/);
  assert.match(source,/if\(filter==='scorers'\)/);
  assert.match(source,/if\(mode==='tactical'\)/);
  assert.match(source,/touch-action:pan-y pinch-zoom!important/);
  assert.match(source,/clearWarStaxxStickyTitles\(\)/);
});
