import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const marker="(function () {\n  'use strict';\n  if (typeof document === 'undefined'";
const appStart=code.lastIndexOf(marker);
class FakeElement {
  constructor(tag){this.tagName=tag;this.style={};this.listeners={};this.attributes={};this.nodes={};this.isConnected=false;this.innerHTML='';this.textContent='';this.scrollTop=0;this.classList={add:()=>{},remove:()=>{},toggle:()=>{}};this.firstChild=null;this.dataset={};}
  appendChild(node){node.isConnected=true;this.child=node;return node;}
  append(node){return this.appendChild(node);}
  insertBefore(node){node.isConnected=true;this.child=node;return node;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  click(){this.listeners.click?.({target:this,preventDefault:()=>{}});}
  setAttribute(name,value){this.attributes[name]=value;}
  closest(){return null;}
  querySelector(sel){
    if (!this.nodes[sel])this.nodes[sel]=new FakeElement('div');
    return this.nodes[sel];
  }
  set innerHTML(value){
    this.markup=value;
    this.details=Array.from(String(value).matchAll(/<details([^>]*)>/g),match=>({
      dataset:{wsDisclosure:match[1].match(/data-ws-disclosure="([^"]+)"/)?.[1]},
      open:/\sopen(?:\s|$)/.test(match[1])
    }));
  }
  get innerHTML(){return this.markup;}
  querySelectorAll(selector){return selector==='details'?this.details:[];}
}
class FakeEvent {
  constructor(type,{detail}={}){this.type=type;this.detail=detail;}
}
function start(path='/factions.php',seed={}){
  const listeners={};const events=[];
  const head=new FakeElement('head'),body=new FakeElement('body'),host=new FakeElement('main');
  const doc={
    readyState:'complete',hidden:false,head,body,
    createElement:tag=>new FakeElement(tag),
    addEventListener:(name,handler)=>{(listeners[name]??=[]).push(handler);},
    dispatchEvent:e=>{events.push(e);for(const fn of listeners[e.type]||[])fn(e);},
    getElementById:()=>null,
    querySelectorAll:()=>[],
    querySelector:selector=>selector.includes('#mainContainer')?host:null,
  };
  const win={};win.top=win;win.self=win;
  win.addEventListener=()=>{};
  const localStorage={getItem:key=>seed[key]?JSON.stringify(seed[key]):null,setItem:()=>{}};
  const timers=[];
  const sandbox={
    document:doc,window:win,location:{hostname:'www.torn.com',pathname:path,search:''},
    CustomEvent:FakeEvent,localStorage,URLSearchParams,
    setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},
    setInterval:()=>1,clearInterval:()=>{},
    console,
  };
  assert.ok(appStart>0,'WarStaxx IIFE found following canonical StaxxHub');
  runInNewContext(code.slice(appStart),sandbox,{timeout:3500});
  return {doc,body,host,events,timers};
}
test('WarStaxx boots on a faction page without API key, registers with StaxxHub and exposes the always-on command strip',()=>{
  const {doc,body,host,events,timers}=start();
  assert.ok(body.child && body.child.id==='warstaxx-root','panel root mounted');
  assert.ok(host.child && host.child.id==='warstaxx-live-strip','always-on Torn command strip mounted');
  assert.match(host.child.innerHTML,/WARSTAXX \| STANDBY/,'safe standby heading shown without an API key');
  assert.ok(events.some(e=>e.type==='staxx:register'&&e.detail.id==='war'),'registered on startup');
  assert.ok(events.some(e=>e.type==='staxx:notice'&&e.detail.id==='war'),'published alerts');
  assert.ok(timers.some(t=>t.delay===2500),'delayed registration retry scheduled');
  doc.dispatchEvent(new FakeEvent('staxx:open',{detail:{id:'war',section:'overview'}}));
  assert.equal(body.child.style.display,'block','Hub opens panel');
  assert.ok(events.some(e=>e.type==='staxx:panel'&&e.detail.id==='war'&&e.detail.open===true),'Hub notified panel opened');
});
test('No extra floating button on normal Torn page; StaxxHub registration still works',()=>{
 const {body,host,events}=start('/index.php');
 assert.equal(host.child?.id,undefined,'ordinary non-war pages must not show the war-only command strip');
 assert.ok(body.child && body.child.id==='warstaxx-root');
 assert.ok(events.some(e=>e.type==='staxx:register'&&e.detail.id==='war'));
});


test('DOM click launch bridge opens the War interface without CustomEvent communication',()=>{
 const {body,events}=start('/gym.php');
 const bridge=body.child.child;
 assert.ok(bridge && bridge.id==='warstaxx-dom-open','real DOM bridge is mounted inside War root');
 assert.equal(body.child.style.display,undefined,'War panel starts closed');
 bridge.dataset.section='overview';
 bridge.click();
 assert.equal(body.child.style.display,'block','DOM .click() opens War modal even without hub events');
 assert.ok(events.some(e=>e.type==='staxx:panel'&&e.detail.id==='war'&&e.detail.open),
  'War acknowledges that its visible panel opened');
});


test('active war home, squad, reports and disclosures render across navigation without losing expansion',()=>{
 const now=Date.now();
 const member=(id,name,status)=>({id,name,status,lastAction:'Online',lastAt:now,level:50,statusText:status,until:now+240000});
 const seed={'warstaxx-config-v1':{ourId:10,enemyId:20,blackSkulls:{3:true},assignments:{3:101}},
  'warstaxx-data-v1':{ours:[member(1,'Regular Alpha','Okay'),member(3,'Skull Gamma','Okay')],
    enemies:[member(101,'Heavy Delta','Hospital')],updated:{ours:now,enemies:now,wars:now},
    war:{id:9,opponentId:20,opponentName:'Example enemy',start:Math.floor(now/1000)-3600,status:'active',factions:[{id:10,score:120},{id:20,score:80}]},
    reports:{8:{id:8,war:{end:Math.floor(now/1000)-5000},factions:[{id:10,members:[{id:1,name:'Regular Alpha',score:50}]}]}}}};
 const {doc,body}=start('/index.php',seed),content=body.child.querySelector('.ws-content');
 const open=section=>doc.dispatchEvent(new FakeEvent('staxx:open',{detail:{id:'war',section}}));
 open('overview');
 assert.doesNotMatch(content.innerHTML,/Render error:/);
 assert.match(content.innerHTML,/ws-primary-action/);
 const section=content.querySelectorAll('details').find(x=>x.dataset.wsDisclosure==='war-evidence');
 assert.equal(section.open,false);section.open=true;
 open('overview');
 assert.equal(content.querySelectorAll('details').find(x=>x.dataset.wsDisclosure==='war-evidence').open,true);
 for(const tab of ['leader','turtle','enemy','reports','archive']){open(tab);assert.doesNotMatch(content.innerHTML,/Render error:/);}
 assert.match(content.innerHTML,/data-action="war:8"/);
 open('enemy');content.scrollTop=314;
 const click=action=>body.child.listeners.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action}}:null},preventDefault:()=>{}});
 click('player:101');assert.match(content.innerHTML,/PLAYER INTELLIGENCE/);
 click('workspace-back');assert.match(content.innerHTML,/One roster/);assert.equal(content.scrollTop,314);
 click('workspace-side:ours');assert.match(content.innerHTML,/Regular Alpha/);
 assert.doesNotMatch(content.innerHTML,/Render error:/);

 open('overview');
 assert.equal(content.querySelectorAll('details').find(x=>x.dataset.wsDisclosure==='war-evidence').open,true);
 for(const lane of ['mission','skulls','defence','priorities']){click('workspace-lane:'+lane);assert.doesNotMatch(content.innerHTML,/Render error:/);}
});
