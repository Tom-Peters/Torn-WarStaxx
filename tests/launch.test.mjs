import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const marker="(function () {\n  'use strict';\n  if (typeof document === 'undefined'";
const appStart=code.lastIndexOf(marker);
class FakeElement {
  constructor(tag){this.tagName=tag;this.style={};this.listeners={};this.attributes={};this.nodes={};this.isConnected=false;this.innerHTML='';this.textContent='';this.scrollTop=0;this.firstChild=null;this.dataset={};}
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
  querySelectorAll(){return [];}
}
class FakeEvent {
  constructor(type,{detail}={}){this.type=type;this.detail=detail;}
}
function start(path='/factions.php'){
  const listeners={};const events=[];
  const head=new FakeElement('head'),body=new FakeElement('body'),host=new FakeElement('main');
  const doc={
    readyState:'complete',hidden:false,head,body,
    createElement:tag=>new FakeElement(tag),
    addEventListener:(name,handler)=>{(listeners[name]??=[]).push(handler);},
    dispatchEvent:e=>{events.push(e);for(const fn of listeners[e.type]||[])fn(e);},
    getElementById:()=>null,
    querySelector:selector=>selector.includes('#mainContainer')?host:null,
  };
  const win={};win.top=win;win.self=win;
  win.addEventListener=()=>{};
  const localStorage={getItem:()=>null,setItem:()=>{}};
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
test('WarStaxx boots on a faction page without API key, registers with StaxxHub and exposes inline launcher',()=>{
  const {doc,body,host,events,timers}=start();
  assert.ok(body.child && body.child.id==='warstaxx-root','panel root mounted');
  assert.ok(host.child && host.child.id==='warstaxx-faction-open','non-floating faction shortcut mounted');
  assert.ok(host.child.child && host.child.child.textContent.includes('Open WarStaxx'),'faction button text');
  assert.ok(events.some(e=>e.type==='staxx:register'&&e.detail.id==='war'),'registered on startup');
  assert.ok(events.some(e=>e.type==='staxx:notice'&&e.detail.id==='war'),'published alerts');
  assert.ok(timers.some(t=>t.delay===2500),'delayed registration retry scheduled');
  doc.dispatchEvent(new FakeEvent('staxx:open',{detail:{id:'war',section:'overview'}}));
  assert.equal(body.child.style.display,'block','Hub opens panel');
  assert.ok(events.some(e=>e.type==='staxx:panel'&&e.detail.id==='war'&&e.detail.open===true),'Hub notified panel opened');
});
test('No extra floating button on normal Torn page; StaxxHub registration still works',()=>{
 const {body,host,events}=start('/index.php');
 assert.equal(host.child ?? null,null);
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
