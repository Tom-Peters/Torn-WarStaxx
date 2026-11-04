import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const src=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const start=src.indexOf('/* WarStaxx loader probe');
const end=src.indexOf("\n\n\n(function () {\n  'use strict';\n  if (typeof document === 'undefined'",start);
assert.ok(start>0 && end>start,'Probe exists between canonical shared Hub and main WarStaxx app');
function loadProbe(){
 const events=[],listeners={},timers=[];
 const doc={
  readyState:'complete',hidden:false,body:{appendChild:()=>{}},
  addEventListener:(name,cb)=>{(listeners[name]??=[]).push(cb)},
  dispatchEvent:e=>{events.push(e);for(const cb of listeners[e.type]||[])cb(e)},
  createElement:tag=>({
   tag,style:{},appendChild:()=>{},setAttribute:()=>{},addEventListener:()=>{},
   textContent:'',id:''
  })
 };
 const messages=[];const win={postMessage:(msg,origin)=>messages.push({msg,origin}),addEventListener:()=>{}};win.top=win;win.self=win;
 class E{constructor(type,{detail}={}){this.type=type;this.detail=detail;}}
 const ctx={document:doc,window:win,location:{hostname:'www.torn.com',pathname:'/gym.php'},
 CustomEvent:E,setTimeout:(cb,ms)=>timers.push({cb,ms}),setInterval:(cb,ms)=>timers.push({cb,ms}),navigator:{}};
 runInNewContext(src.slice(start,end),ctx,{timeout:1500});
 return {doc,win,events,timers,messages};
}
test('probe does not falsely mark War running until the full UI is ready',()=>{
 const {doc,win,events,timers}=loadProbe();
 assert.equal(win.__warStaxxProbe,true);
 assert.ok(!events.some(x=>x.type==='staxx:register'),'loader-only must NOT claim War is running');
 assert.ok(events.some(x=>x.type==='staxx:diagnostics'&&x.detail.ui==='missing'));
 assert.equal(win.__warStaxxReady,undefined,'app has not loaded yet');
 assert.ok(timers.some(x=>x.ms===3500),'startup retry scheduled');
 const before=events.length;
 doc.dispatchEvent({type:'staxx:ping'});
 assert.ok(!events.slice(before).some(x=>x.type==='staxx:register'),'reload ping must not create false ready status');
});
test('probe register reflects subsequent app startup success',()=>{
 const {doc,win,events}=loadProbe();
 win.__warStaxxReady=true;
 doc.dispatchEvent({type:'staxx:ping'});
 const last=events.filter(e=>e.type==='staxx:register').at(-1);
 assert.match(last.detail.desc,/command centre/);
});


test('ready probe posts only a safe identity message, not API keys or data',()=>{
 const {messages,doc,win}=loadProbe();
 assert.equal(messages.length,0,'no registration message until UI ready');
 win.__warStaxxReady=true;
 doc.dispatchEvent({type:'staxx:ping'});
 assert.ok(messages.some(x=>x.msg.__tornstaxxBridge==='tornstaxx-war-v1'&&x.msg.kind==='register'&&x.msg.id==='war'));
 for(const x of messages){
   assert.deepEqual(Object.keys(x.msg).sort(),['__tornstaxxBridge','id','kind'].sort());
 }
});
