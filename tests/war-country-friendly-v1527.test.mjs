import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const section=(a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'Missing '+a);
  return source.slice(start,end);
};

function fixture(){
  const now=Date.now();
  const members=[
    {id:13,country:'Torn',status:'Okay',given:7},
    {id:12,country:'Canada',status:'Traveling',phase:'inbound',given:13},
    {id:10,country:'Canada',status:'Okay',given:2},
    {id:16,country:'Japan',status:'Okay',given:6},
    {id:15,country:'Unknown',status:'Traveling',given:80},
    {id:11,country:'Canada',status:'Hospital',given:30},
    {id:14,country:'Argentina',status:'Okay',given:11},
    {id:17,country:'Torn',status:'Traveling',phase:'inbound',given:20},
  ];
  let list;
  const header=()=>{
    const h={type:'header',dataset:{},textContent:'',attrs:{},
      classList:{contains:k=>k==='wsnw-country-heading',toggle:()=>{}},
      setAttribute(k,v){this.attrs[k]=v},
      remove(){list.children=list.children.filter(x=>x!==this);}};
    return h;
  };
  const rows=members.map(p=>({id:p.id,type:'row',
    classList:{contains:k=>k==='your'},matches:k=>k==='li.enemy,li.your'}));
  list={children:[...rows],appends:0,querySelectorAll:()=>list.children.filter(x=>x.type==='header'),
    appendChild(frag){this.children=frag.nodes.slice();this.appends++;}};
  const state={data:{ours:members}};
  const cfg={nativeWarCountryGroups:true,nativeFriendlyDesc:true};
  const context={
    state,cfg,Date,Map,WeakMap,Array,Number,Infinity,
    nativeWarState:{ourOriginal:new WeakMap()},
    nativeWarConflict:()=>false,nativeWarRows:()=>list.children.filter(x=>x.type==='row'),
    nativeWarPlayerId:r=>r.id,
    nativeWarLocation:p=>({country:p.country,phase:p.phase||'present'}),
    nativeWarOwnLocation:()=>({country:'Canada',known:true,phase:'abroad'}),
    nativeWarCountryCompare:(a,b,own)=>{
      if(a===b)return 0;
      if(a===own.country)return -1;if(b===own.country)return 1;
      if(a==='Unknown')return 1;if(b==='Unknown')return -1;
      return a.localeCompare(b);
    },
    nativeWarAvailabilityRank:p=>p.status==='Okay'?0:p.status==='Hospital'?1:3,
    memberState:p=>p.status.toLowerCase(),
    liveWarMemberImpact:id=>{
      const p=members.find(x=>x.id===id);
      return {id,given:p.given,net:100-p.given,earned:p.given+2,share:p.given,hits:p.given};
    },
    liveScoringPace:()=>null,
    document:{createDocumentFragment:()=>({nodes:[],appendChild(x){this.nodes.push(x);}})},
    el:()=>header()
  };
  const fn=runInNewContext(section('  function nativeWarSortFriendly(',
    '    function nativeWarFilters(')+';nativeWarSortFriendly',context);
  return {fn,list,rows,cfg};
}

test('our own roster groups by current country, alphabetically elsewhere, ready first',()=>{
  const f=fixture();
  assert.equal(f.fn(f.list,'given'),true);
  assert.deepEqual(f.list.children.map(x=>x.type==='header'?x.dataset.wsnwCountry:x.id),[
    'Canada',10,11,12,'Argentina',14,'Japan',16,'Torn',13,17,'Unknown',15
  ]);
  const heads=f.list.children.filter(x=>x.type==='header');
  assert.match(heads[0].textContent,/YOU ARE HERE/);
  assert.match(heads[0].textContent,/3 members \| 1 ready \| 1 inbound/);
  const mounted=f.list.appends;
  assert.equal(f.fn(f.list,'given'),true);
  assert.equal(f.list.appends,mounted,'unchanged roster must not be re-mounted');
  assert.equal(f.fn(f.list,'torn'),true);
  assert.deepEqual(f.list.children.map(x=>x.id),f.rows.map(x=>x.id),
    'Torn order restores original rows without leftover headings');
  f.cfg.nativeWarCountryGroups=false;
  assert.equal(f.fn(f.list,'given'),true);
  assert.equal(f.list.children.some(x=>x.type==='header'),false);
});
test('hospital tier colour is applied after compact grid styling for both factions',()=>{
  const style=section('  function nativeWarStyle(){',
    '  // An opt-in small, draggable chain indicator.');
  assert.match(style,/li\.wsnw-enhanced:not\(\.wsnw-expanded\) \.wsnw-intel \.wsnw-chip\[data-wsnw-chip="status"\]\.wsnw-warning/);
  assert.match(style,/li\.wsnw-enhanced:not\(\.wsnw-expanded\) \.wsnw-intel \.wsnw-chip\[data-wsnw-chip="status"\]\.wsnw-soon/);
  assert.match(style,/wsnw-hospital-warning > \.status/);
  assert.match(style,/wsnw-hospital-soon > \.status/);
  assert.ok(style.lastIndexOf('wsnw-hospital-soon > .status')>
    style.lastIndexOf('grid-template-columns:minmax(0,1.4fr)'),
    'expiry overrides must be last');
  const code=section('  function nativeWarHospitalTier(',
    '  function nativeWarStyle(){');
  const tier=runInNewContext(code+';nativeWarHospitalTier',{
    Date,MIN:60000,positive:x=>Number(x)>0?Number(x):0
  });
  const at=1000000;
  assert.equal(tier(at+15*60000,at),'wsnw-warning');
  assert.equal(tier(at+5*60000,at),'wsnw-soon');
  assert.equal(tier(at+16*60000,at),'');
  assert.doesNotThrow(()=>new Script(source));
  assert.doesNotMatch(source,/[^\x00-\x7f]/);
});
