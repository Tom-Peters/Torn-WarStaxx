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
  node.appendChild=child=>{child.isConnected=true;node.children.push(child);return child;};
  node.remove=()=>{node.isConnected=false;};
  node.classList={
    add(k){node.className+=' '+k;},
    contains(k){return node.className.split(/\s+/).includes(k);},
    toggle(k,yes){node.className=node.className.split(/\s+/).filter(x=>x!==k).join(' ')+(yes?' '+k:'');}
  };
  return node;
}
test('Torn PDA: v1.5.9 never inserts intel labels inside the existing player or status columns',()=>{
  const row=element('li','enemy'),member=element('div','member'),status=element('div','status');
  row.id=123;
  row.querySelector=sel=>sel==='div.member'?member:sel==='div.status'?status:
    sel===':scope > .wsnw-intel'?row.children.find(x=>x.className.includes('wsnw-intel'))||null:null;
  const list={children:[row]},box={parentNode:{},querySelectorAll:()=>[list]};
  const state={data:{enemies:[{id:123,name:'Example enemy',status:'Hospital',
    until:Date.now()+180000,lastAction:'Offline'}],ours:[],updated:{enemies:Date.now(),ours:Date.now()}}};
  const cfg={nativeWarEnabled:true,nativeWarFilter:'all',nativeWarSort:'availability',
    assignments:{},watchlist:{},blackSkulls:{}};
  const context={
    document:{getElementById:()=>({}),querySelector:()=>box},state,cfg,Date,Map,Set,
    isNativeWarPage:()=>true,activeWarNow:()=>true,nativeWarStyle:()=>{},nativeWarToolbar:()=>{},
    renderNativeChainBubble:()=>{},nativeWarRows:()=>[row],nativeWarPlayerId:x=>x.id,
    nativeWarConflict:()=>false,enemyRoleBands:()=>({heavy:new Set([123]),regular:new Set()}),
    rosterFresh:()=>true,warScore:()=>null,chainStatus:()=>({fresh:false}),
    positive:x=>Number(x)>0?Number(x):0,memberState:p=>p.status.toLowerCase(),
    nativeWarFilters:()=>true,nativeWarTransition:()=>null,MIN:60000,
    el:(tag,cls,text)=>{const n=element(tag,cls);n.textContent=text||'';return n;},
    age:()=> '20s',hospitalCountdown:()=> '3m 00s',flightEvidence:()=>({kind:'returning'}),
    enemyBattleEstimate:()=>({value:1500,verified:false,source:'FFScouter'}),
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
  assert.deepEqual(labels,['HOSP 3m 00s','SKULL','~BSS 1500','FF 1.32x','Copy']);
});
test('original Torn attack cells are allocated a separate fixed-height lane from the intelligence subrow',()=>{
  const css=section('  function nativeWarStyle(){','  // An opt-in small, draggable chain indicator.');
  assert.match(css,/li\.wsnw-enhanced\{position:relative!important;height:80px!important;min-height:80px!important/);
  assert.match(css,/li\.wsnw-enhanced > \.wsnw-intel\{position:absolute!important;top:49px!important/);
  assert.match(css,/li\.wsnw-enhanced > \.attack\{height:49px!important;max-height:49px!important/);
  assert.match(css,/overflow-x:auto!important/);
  assert.doesNotThrow(()=>new Script(source));
});
test('combat navigation still hides both live strip and optional chain bubble',()=>{
  assert.match(source,/if\(path==='\/attack\.php'\|\|path==='\/attack'/);
  assert.match(source,/document\.getElementById\('warstaxx-live-strip'\)\?\.remove\(\)/);
  assert.match(source,/document\.getElementById\('wsnw-chain-bubble'\)\?\.remove\(\)/);
});
