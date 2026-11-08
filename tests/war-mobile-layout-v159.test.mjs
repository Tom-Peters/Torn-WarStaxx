import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function section(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Missing WarStaxx source section');
  return source.slice(a,b);
}
function element(tag='div',name=''){
  const node={tag,className:name,children:[],dataset:{},style:{},attrs:{},isConnected:false,textContent:'',title:''};
  node.querySelector=function(sel){
    if(sel==='.wsnw-owner')return this.children.find(x=>x.className.includes('wsnw-owner'))||null;
    if(sel==='.wsnw-intel-link')return this.children.find(x=>x.className.includes('wsnw-intel-link'))||null;
    if(sel===':scope > .wsnw-intel')return this.children.find(x=>x.className.includes('wsnw-intel'))||null;
    if(sel==='.twse-copy-btn')return null;
    if(sel==='.wsnw-copy')return this.children.find(x=>x.className.includes('wsnw-copy'))||null;
    if(sel.startsWith('[data-wsnw-chip=')){
      const key=sel.match(/"([^"]+)"/)?.[1];
      return this.children.find(x=>x.dataset.wsnwChip===key)||null;
    }
    return null;
  };
  node.querySelectorAll=()=>[];
  node.setAttribute=(k,v)=>{node.attrs[k]=v;};
  node.removeAttribute=k=>{delete node.attrs[k];if(k==='data-wsnw-expiry')delete node.dataset.wsnwExpiry;};
  node.hasAttribute=k=>k in node.attrs;
  node.appendChild=child=>{if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);child.parentNode=node;child.isConnected=true;node.children.push(child);return child;};
  node.insertBefore=(child,reference)=>{if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);child.parentNode=node;child.isConnected=true;const i=node.children.indexOf(reference);node.children.splice(i<0?0:i,0,child);return child;};
  Object.defineProperty(node,'nextElementSibling',{get(){const a=node.parentNode?.children||[];return a[a.indexOf(node)+1]||null;}});
  Object.defineProperty(node,'firstChild',{get(){return node.children[0]||null;}});
  node.remove=()=>{node.isConnected=false;};
  node.classList={
    add(k){node.className+=' '+k;},
    contains(k){return node.className.split(/\s+/).includes(k);},
    toggle(k,yes){node.className=node.className.split(/\s+/).filter(x=>x!==k).join(' ')+(yes?' '+k:'');}
  };
  return node;
}
test('Torn PDA: compact rows keep the native player/status cells intact',()=>{
  const row=element('li','enemy'),member=element('div','member'),status=element('div','status');
  row.id=123;
  row.querySelector=sel=>sel==='div.member'?member:sel==='div.status'?status:
    sel===':scope > .wsnw-intel'?row.children.find(x=>x.className.includes('wsnw-intel'))||null:null;
  const list={children:[row]},box={parentNode:{},querySelectorAll:()=>[list]};
  const state={data:{war:{id:200},enemies:[{id:123,name:'Example enemy',status:'Hospital',
    until:Date.now()+180000,lastAction:'Offline'}],ours:[],updated:{enemies:Date.now(),ours:Date.now()}}};
  const cfg={nativeWarEnabled:true,nativeWarFilter:'all',nativeWarSort:'availability',
    assignments:{},watchlist:{},blackSkulls:{}};
  const nativeWarState={expandedId:0};
  const context={
    document:{getElementById:()=>({}),querySelector:()=>box},state,cfg,nativeWarState,Date,Map,Set,
    isNativeWarPage:()=>true,activeWarNow:()=>true,nativeWarStyle:()=>{},nativeWarToolbar:()=>{},
    renderNativeChainBubble:()=>{},inboundWarImpact:()=>null,nativeWarLegend:()=>{},nativeWarRows:()=>[row],nativeWarPlayerId:x=>x.id,
    nativeWarConflict:()=>false,enemyRoleBands:()=>({heavy:new Set([123]),regular:new Set()}),
    rosterFresh:()=>true,warScore:()=>null,chainStatus:()=>({fresh:false}),
    positive:x=>Number(x)>0?Number(x):0,memberState:p=>p.status.toLowerCase(),
    nativeWarFilters:()=>true,nativeWarTransition:()=>null,MIN:60000,
    nativeWarLocation:()=>({country:'Torn',phase:'present',source:'Official roster'}),
    nativeWarLastSeen:()=> 'Seen 4m',nativeWarHospitalTier:()=> 'wsnw-soon',
    isOnline:()=>false,
    el:(tag,cls,text)=>{const n=element(tag,cls);n.textContent=text||'';return n;},
    age:()=> '20s',hospitalCountdown:()=> '3m 00s',nativeWarHospitalShort:()=> 'H 3m',flightEvidence:()=>({kind:'returning'}),
    enemyBattleEstimate:()=>({value:1500,verified:false,source:'FFScouter'}),
    nativeWarStrength:()=>({short:'FFS ~62m',detail:'Modelled 62m; public BSS 15,500'}),
    ffLabel:()=>({source:'estimate',value:'1.32x'}),fmt:String,nativeWarSort:()=>{}
  };
  const code=section('  function syncNativeWar(){','  async function pollNativeWar(){');
  const render=runInNewContext(code+';syncNativeWar',context);
  render();render();
  assert.equal(member.children.length,0,'Member image and name cell must not receive labels');
  assert.equal(status.children.length,0,'Torn status cell must remain untouched');
  assert.equal(row.children.length,1,'One intel subrow even after repeated refreshes');
  assert.match(row.children[0].className,/wsnw-intel/);
  const labels=row.children[0].children.map(x=>x.textContent);
  assert.deepEqual(labels,['+ Example enemy','\u2620','H 3m','Seen 4m','FFS ~62m','FF 1.32x','Intel','Copy']);
  const detailButtons=row.children[0].children.filter(x=>['Intel','Copy'].includes(x.textContent));
  assert.ok(detailButtons.every(x=>x.className.includes('wsnw-details-only')));
  nativeWarState.expandedId=123;render();
  assert.equal(row.classList.contains('wsnw-expanded'),true);
  assert.deepEqual(row.children[0].children.map(x=>x.textContent),
    ['- Example enemy','\u2620','HOSP 3m 00s','Seen 4m','FFS ~62m','Your FF 1.32x','Intel','Copy']);
  assert.ok(detailButtons.every(x=>!x.className.includes('wsnw-details-only')));
});
test('original Torn attack cells are allocated a separate fixed-height lane from the intelligence subrow',()=>{
  const css=section('  function nativeWarStyle(){','  // An opt-in small, draggable chain indicator.');
  assert.match(css,/li\.wsnw-enhanced\{position:relative!important;height:58px!important;min-height:58px!important/);
  assert.match(css,/li\.wsnw-enhanced > \.wsnw-intel\{position:absolute!important;top:36px!important/);
  assert.match(css,/li\.wsnw-enhanced > \.attack\{height:36px!important;max-height:36px!important/);
  assert.match(css,/overflow-x:hidden!important;overflow-y:visible!important/);
  assert.match(css,/overflow-x:hidden!important;overflow-y:hidden!important/);
  assert.match(css,/touch-action:pan-y pinch-zoom!important/);
  assert.match(css,/li\.wsnw-country-heading\{display:flex!important/);
  assert.match(css,/li\.wsnw-expanded\{height:var\(--wsnw-expanded-height/);
  assert.match(css,/li\.wsnw-expanded \.wsnw-details-only\{display:inline-flex!important/);
  assert.match(css,/\.wsnw-owner\{position:sticky!important;left:0!important/);
  assert.doesNotThrow(()=>new Script(source));
});
test('combat navigation still hides both live strip and optional chain bubble',()=>{
  assert.match(source,/if\(path==='\/attack\.php'\|\|path==='\/attack'/);
  assert.match(source,/document\.getElementById\('warstaxx-live-strip'\)\?\.remove\(\)/);
  assert.match(source,/document\.getElementById\('wsnw-chain-bubble'\)\?\.remove\(\)/);
});

test('FFScouter modelled total and its square-root BSS remain separate provenance-aware metrics',()=>{
  const helper=section('  function nativeCompactTotal(value){','  function nativeWarStyle(){');
  const context={
    Number,Date,fmt:String,age:()=> '5d',positive:Number,
    enemyBattleEstimate:()=>({value:15448,source:'FFScouter BSS',verified:false}),
    spy:()=>null,bsScore:()=>null,ffscouter:()=>({
      bsEstimate:62000000,bss:15448,updatedAt:Date.now()-5*86400000,at:Date.now()
    }),ffIsStale:()=>false
  };
  const result=runInNewContext(helper+';({nativeCompactTotal,nativeWarStrength})',context);
  const summary=result.nativeWarStrength({id:123});
  assert.equal(result.nativeCompactTotal(62000000),'62m');
  assert.equal(summary.short,'FFS ~62m');
  assert.match(summary.detail,/public BSS 15448/);
  assert.match(summary.detail,/YATA uses another model/);
  context.ffscouter=()=>null;
});
