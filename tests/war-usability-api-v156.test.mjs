import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing '+start+' -> '+end);
  return source.slice(a,b);
}
const common=[
  'const n=v=>Number.isFinite(Number(v))?Number(v):0;',
  'const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;',
  'const MIN=60000,HOUR=3600000;',
  region('  function publicMetricItems(value,depth=0,prefix=', '  function publicIntelCoverage(at=Date.now()){'),
  region('  function publicIntelCoverage(at=Date.now()){','  function publicStatsHtml(id){')
].join('\n');

test('local finder prioritises current roster players, supports IDs and labels cached reports clearly',()=>{
  const state={data:{
    ours:[{id:11,name:'Skull Bravo',status:'Okay'}],
    enemies:[{id:22,name:'Skullhunter',status:'Hospital'}],
    reports:{100:{factions:[{members:[{id:33,name:'Old Skull'}]}]}}
  }};
  const fx=runInNewContext([
    'const state=given;',
    'const sections=["overview","enemy","reports","skulls"];',
    'const labels={overview:"01 | ACT NOW",enemy:"02 | OPPONENT",reports:"03 | REPORTS",skulls:"Black Skulls"};',
    'const rosterFresh=side=>side==="ours";',
    'const positive=v=>Number(v)||0;',
    region('  function finderMatches(term){','  function drawFinder(){'),
    ';finderMatches'
  ].join('\n'),{given:state});
  assert.equal(fx('s').length,0);
  assert.equal(fx('skull')[0].id,11);
  assert.equal(fx('22')[0].id,22);
  assert.match(fx('22')[0].detail,/stale/i);
  assert.equal(fx('33')[0].id,33);
  assert.match(fx('33')[0].detail,/stored official war report/i);
  assert.ok(fx('black skulls').some(x=>x.kind==='tab'&&x.id==='skulls'));
});

test('coverage keeps missing profile and popular stats unknown instead of zero',()=>{
  const at=Date.now();
  const state={data:{
    enemies:[{id:22},{id:23},{id:24}],
    publicIntel:{
      22:{at,profile:{rank:'Elite',age:100,awards:15},stats:{attackswon:0,ranked_war_wins:10}},
      23:{at,profile:{rank:'',age:null,awards:null},stats:{},restricted:true}
    },
    updated:{},errors:{},backoff:{},ourWars:[],enemyWars:[],reports:{}
  }};
  const f=runInNewContext(common+';({publicIntelCoverage,publicCombatHighlights})',
    {state});
  const c=f.publicIntelCoverage(at);
  assert.equal(c.total,3);
  assert.equal(c.profile,1);
  assert.equal(c.stats,1);
  assert.equal(c.complete,1);
  assert.equal(c.restricted,1);
  const summary=f.publicCombatHighlights(state.data.publicIntel[22].stats);
  assert.deepEqual(Array.from(summary,x=>x.label),['Attacks won','Ranked-war wins']);
  assert.equal(summary[0].value,0);
  assert.equal(f.publicCombatHighlights({secret_battle_stats:100}).length,0);
});

test('API source health distinguishes stale, backoff and genuine recent success',()=>{
  const now=Date.now(),state={data:{updated:{wars:now,ours:now-6*60000},
    errors:{enemies:'Torn API permission denied'},
    backoff:{enemies:{until:now+60000}}}};
  const f=runInNewContext(common+';apiSources',{state,Date});
  const rows=f();
  assert.equal(rows.find(x=>x.key==='wars').status,'Fresh');
  assert.equal(rows.find(x=>x.key==='ours').status,'Older data');
  assert.equal(rows.find(x=>x.key==='enemies').status,'Retry delayed');
});

test('public scouting prioritises assigned and watched players and caps each manual batch',async()=>{
  const now=Date.now(),enemyIds=[40,41,42,43,44,45,46,47];
  const state={data:{enemies:enemyIds.map(id=>({id,name:'Enemy '+id})),
    publicIntel:{47:{at:now,profile:{rank:'V'},stats:{attackswon:10}}},
    updated:{},errors:{},backoff:{}}};
  const cfg={assignments:{200:43},watchlist:{45:true}},calls=[];
  const code=[
    common.split(region('  function publicIntelCoverage(at=Date.now()){','  function publicStatsHtml(id){'))[0],
    'const state=st,cfg=config;',
    'const effectiveKey=()=>"test-present";',
    'const officialNumber=value=>value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value))?Number(value):null;',
    'const call=async(path)=>{calls.push(path);return path.includes("personalstats")?'+
      '{personalstats:{attackswon:10}}:{profile:{rank:"Elite",age:120,awards:55}};};',
    region('  async function refreshPublicIntel(batch=2){','  async function loadPublicIntel(id){'),
    ';refreshPublicIntel'
  ].join('\n');
  const scan=runInNewContext(code,{st:state,config:cfg,calls,Date});
  const scanned=await scan(6);
  assert.equal(scanned,6);
  assert.equal(calls.length,12);
  assert.ok(calls[0].includes('/user/43/profile'));
  assert.ok(calls[2].includes('/user/45/profile'));
  assert.ok(!calls.some(x=>x.includes('/user/47/')));
  assert.equal(state.data.publicIntel[43].profile.rank,'Elite');
  assert.equal(state.data.publicIntel[43].stats.attackswon,10);
});

test('new navigation remains in WarStaxx and does not route queries to external APIs',()=>{
  assert.match(source,/id="ws-finder"/);
  assert.match(source,/function finderMatches\(term\)/);
  assert.match(source,/if\(action==='finder-close'\)/);
  assert.match(source,/if\(action==='scan-public'\)/);
  assert.match(source,/await refreshPublicIntel\(activeWarNow\(\)\?3:2\)/);
  assert.match(source,/apiCoverageCard\(\)/);
  assert.match(source,/if\(e\.target\.id==='ws-find-input'\)\{drawFinder\(\);return;\}/);
  assert.doesNotMatch(region('  function finderMatches(term){','  function closeFinder(){'),/fetch\(|PDA_httpGet|GM_xmlhttpRequest/);
});

test('Torn PDA userscript remains parser safe and versioned',()=>{
  assert.match(source,/^\/\/ @version\s+2\.2\.0$/m);
  assert.match(source,/const ID='war', VER='2\.2\.0'/);
  assert.match(source,/version='2\.2\.0'/);
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
  assert.doesNotThrow(()=>new Script(source));
});
