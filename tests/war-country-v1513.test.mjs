import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(from,to){
  const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
  assert.ok(a>=0&&b>a,'Missing code '+from);
  return source.slice(a,b);
}
function geography(){
  const state={data:{meta:{ownerId:75},ours:[{
    id:75,status:'Abroad',statusText:'In Canada',statusDetails:'',until:0
  }]}};
  const code=region('  // Torn travel destinations and aliases;','  function flightCountdown(ms,at=Date.now()){');
  const values=runInNewContext(code+';({nativeCountryName,nativeWarLocation,'+
    'nativeWarOwnLocation,nativeWarCountryCompare,nativeWarAvailabilityRank,nativeWarLastSeen})',{
      state,Date,Number,MIN:60000,positive:x=>Number(x)>0?Number(x):0,
      memberState:p=>{const q=String(p?.status||'unknown').toLowerCase();return /trav|abroad/.test(q)?'away':/hospital/.test(q)?'hospital':/jail/.test(q)?'jail':/okay/.test(q)?'okay':'unknown';}
    });
  return {state,...values};
}
test('Torn travel routes: Canada outbound joins Canada, Canada return joins Torn',()=>{
  const x=geography();
  const canada=x.nativeWarLocation({status:'Traveling',statusText:'Traveling to Canada',until:Date.now()+1800000});
  assert.equal(canada.country,'Canada');
  assert.equal(canada.phase,'inbound');
  const torn=x.nativeWarLocation({status:'Traveling',statusText:'Returning from Canada',until:Date.now()+1800000});
  assert.equal(torn.country,'Torn');
  assert.equal(torn.phase,'inbound');
  assert.equal(x.nativeWarLocation({status:'Traveling',statusText:'Returning to Torn'}).country,'Torn');
  assert.equal(x.nativeWarLocation({status:'Abroad',statusText:'In Mexico'}).country,'Mexico');
  assert.equal(x.nativeWarLocation({status:'Traveling',statusText:'Traveling'}).country,'Unknown');
  assert.equal(x.nativeWarLocation({status:'Hospital',statusText:'Hospitalized by Canada'}).country,'Torn',
    'A player named Canada is not evidence of being in Canada');
  assert.equal(x.nativeWarLocation({status:'Hospital',statusText:'Hospitalized in Canada'}).country,'Canada');
});
test('Your location first; remaining countries alphabetical; unknown last',()=>{
  const x=geography(),where=x.nativeWarOwnLocation();
  assert.deepEqual({...where},{country:'Canada',known:true,phase:'abroad'});
  const sorted=['Torn','Unknown','Japan','Argentina','Canada'].sort((a,b)=>x.nativeWarCountryCompare(a,b,where));
  assert.deepEqual(sorted,['Canada','Argentina','Japan','Torn','Unknown']);
  x.state.data.ours[0]={id:75,status:'Traveling',statusText:'Traveling to Mexico'};
  assert.equal(x.nativeWarOwnLocation().known,false,'Flying is not the same as physically in Mexico');
});
test('last action is labelled Seen, not an invented confirmed last-online timestamp',()=>{
  const x=geography(),at=1_000_000;
  assert.equal(x.nativeWarLastSeen({lastAction:'Offline',lastAt:at-180000},at),'Seen 3m');
  assert.equal(x.nativeWarLastSeen({lastAction:'Online',lastAt:at-120000},at),'ONLINE');
  assert.equal(x.nativeWarLastSeen({lastAction:'Unknown',lastAt:0},at),'Seen ?');
});
test('native country grouping inserts stable country headings and Okay before hospital/flying',()=>{
  const data=[
    [6,'Torn','Traveling',true],[3,'Canada','Traveling',true],
    [1,'Torn','Okay'],[5,'Argentina','Traveling',true],
    [2,'Canada','Hospital'],[4,'Torn','Hospital'],[7,'Canada','Okay']
  ].map(([id,country,status,flight])=>({id,country,status,flight}));
  const players=new Map(data.map(p=>[p.id,p]));
  const rows=data.map(p=>({
    id:p.id,type:'row',matches:s=>s==='li.enemy,li.your',
    classList:{contains:s=>s==='enemy'},getAttribute:()=>null
  }));
  let list;
  function header(){
    const h={type:'header',dataset:{},textContent:'',attrs:{},
      classList:{contains:s=>s==='wsnw-country-heading'},
      setAttribute(k,v){this.attrs[k]=v},
      remove(){list.children=list.children.filter(x=>x!==this);}};
    return h;
  }
  list={children:rows.slice(),appends:0,getAttribute:()=>null,querySelector:()=>null,
    querySelectorAll(){return this.children.filter(x=>x.type==='header');},
    appendChild(fragment){this.appends++;this.children=fragment.nodes.slice();}};
  const env={
    document:{createDocumentFragment:()=>({nodes:[],appendChild(x){this.nodes.push(x)}})},
    cfg:{nativeWarCountryGroups:true},nativeWarState:{original:new WeakMap()},
    nativeWarConflict:()=>false,nativeWarRows:l=>l.children.filter(x=>x.type==='row'),
    nativeWarPlayerId:r=>r.id,nativeWarLocation:p=>({country:p.country,phase:p.flight?'inbound':'present'}),
    nativeWarOwnLocation:()=>({country:'Canada',known:true,phase:'abroad'}),
    nativeWarCountryCompare:(a,b)=>{
      if(a===b)return 0;if(a==='Canada')return -1;if(b==='Canada')return 1;
      return a.localeCompare(b);
    },
    nativeWarAvailabilityRank:p=>p.status==='Okay'?0:p.status==='Hospital'?1:3,
    nativeWarOrder:p=>[p.id],memberState:p=>p.status.toLowerCase(),
    el:()=>header(),Map,WeakMap,Array,Date
  };
  const code=region('  function nativeWarSort(list,playerMap,mode){','  function nativeWarFilters(p,band,filter){');
  const sort=runInNewContext(code+';nativeWarSort',env);
  assert.equal(sort(list,players,'availability'),true);
  assert.deepEqual(list.children.map(x=>x.type==='header'?x.dataset.wsnwCountry:x.id),
    ['Canada',7,2,3,'Argentina',5,'Torn',1,4,6]);
  const firstCount=list.appends;
  assert.equal(sort(list,players,'availability'),true);
  assert.equal(list.appends,firstCount,'An unchanged roster must not be remounted every 5 seconds');
  assert.equal(sort(list,players,'torn'),true);
  assert.deepEqual(list.children.map(x=>x.id),[6,3,1,5,2,4,7]);
});
test('scroll gesture is vertical on compact intel strips and no attack overlay is introduced',()=>{
  const css=region('  function nativeWarStyle(){','  // An opt-in small, draggable chain indicator.');
  assert.match(css,/overflow-x:hidden!important;overflow-y:hidden!important;white-space:nowrap!important/);
  assert.match(css,/touch-action:pan-y pinch-zoom!important/);
  assert.match(css,/li\.wsnw-country-heading\{display:block!important/);
  assert.match(css,/wsnw-heavy-target > \.wsnw-intel\{background:rgba\(51,27,78/);
  assert.match(source,/nativeWarCountryGroups:true/);
  assert.match(source,/const nativeWarPolling=setInterval/);
  assert.doesNotThrow(()=>new Script(source));
});
