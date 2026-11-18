import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from '../shared-worker/src/index.js';
import {commandMutation} from '../shared-worker/src/command.js';
function database(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../shared-worker/migrations/0001_init.sql',import.meta.url),'utf8'));
  sqlite.prepare('INSERT INTO faction_orders VALUES(57819,7,1,?,100)').run('{}');
  for(const name of ['0001_init','0002_command'])sqlite.exec(readFileSync(new URL('../shared-worker/migrations/'+name+'.sql',import.meta.url),'utf8'));
  const db={prepare(sql){const statement=sqlite.prepare(sql);return {bind(...args){return {
    first:async()=>statement.get(...args),all:async()=>({results:statement.all(...args)}),run:async()=>({meta:{changes:statement.run(...args).changes}})
  };},run:async()=>statement.run()};}};
  const grants={};
  for(const [token,id,role] of [['skull-1',1,'skull'],['skull-2',2,'skull'],['regular',3,'member'],['officer',4,'officer']]){
    grants[createHash('sha256').update(token).digest('hex')]={id,role,faction:57819};
  }
  return {sqlite,env:{DB:db,FACTION_ID:'57819',SHARED_WRITE_TOKEN:'writer',SHARED_READ_TOKEN:'reader',MEMBER_GRANTS:JSON.stringify(grants)}};
}
function request(env,token,cmd=null,revision=0,war=7,faction=57819){
  const request=new Request('https://room.example/v2/factions/'+faction+'/wars/'+war+'/command',{
    method:cmd?'PUT':'GET',headers:{Authorization:'Bearer '+token,'If-Match':String(revision)},body:cmd?JSON.stringify({data:cmd}):undefined});
  return worker.fetch(request,env);
}
const assign={type:'assign',target:90,primary:1,backups:[2,3],priority:80};
const officer={role:'capo',id:4};
const sample=(id,at,overrides={})=>({id,at,state:'ready',online:'Online',country:'Canada',...overrides});
const initial=()=>({plan:{assignments:{},duties:{},holdMinutes:10},ops:{claims:{},states:{},observations:{},roll:{}}});
function observation(room,time,overrides={},extra=[]){
  return commandMutation(room,{type:'observe',rows:[sample(1,time,overrides),sample(2,time),sample(3,time),sample(90,time,{online:'Offline'}),...extra]},officer,time);
}
test('existing D1 orders survive additive migrations, roles and war/faction boundaries',async()=>{
  const {sqlite,env}=database();assert.equal(sqlite.prepare('SELECT revision FROM faction_orders').get().revision,1);
  assert.equal((await request(env,'reader',assign)).status,403);
  assert.equal((await request(env,'officer',assign)).status,403);
  assert.equal((await request(env,'regular',{...assign,role:'capo'})).status,403);
  assert.equal((await request(env,'reader',null,0,7,12)).status,403);
  assert.equal((await request(env,'wrong')).status,401);
  assert.equal((await request({...env,SHARED_READ_TOKEN:''},'writer')).status,503);
  const writers=await Promise.all([request(env,'writer',assign),request(env,'writer',assign)]);
  assert.deepEqual(writers.map(x=>x.status).sort(),[200,409]);
  const isolated=await (await request(env,'reader',null,0,8)).json();assert.equal(isolated.revision,0);
  const bad=await request(env,'writer',{...assign,target:0},1);assert.equal(bad.status,400);
  const claims=await Promise.all([request(env,'skull-1',{type:'claim',target:90},1),request(env,'skull-2',{type:'claim',target:90},1)]);
  assert.deepEqual(claims.map(x=>x.status).sort(),[200,409]);
  const room=await(await request(env,'reader')).json();
  assert.equal(room.revision,2);assert.equal(room.events.length,2);assert.equal(room.ops.claims[90].at,room.ops.claims[90].expires-180000);
  assert.equal((await request(env,'regular',{type:'release',target:90,hitter:1},2)).status,403);
  assert.equal((await request(env,'regular',{type:'roll',choice:'later',hitter:1},2)).status,200);
  assert.equal((await(await request(env,'reader')).json()).ops.roll[3].choice,'later');
});
for(const [reason,unavailable] of Object.entries({offline:{online:'Offline'},hospital:{state:'hospital'},jail:{state:'jail'},'different country':{country:'Torn'},travelling:{state:'travelling'}})){
  test('fresh '+reason+' confirmation at exactly five minutes',()=>{
    const r=initial(),t=1800000000000;commandMutation(r,assign,officer,t);
    observation(r,t,unavailable);assert.equal(r.ops.states[90].since,t);
    observation(r,t+299999,unavailable);assert.equal(r.plan.assignments[90].primary,1);assert.equal(r.ops.states[90].since,t);
    commandMutation(r,{type:'observe',rows:[]},officer,t+300000);assert.equal(r.plan.assignments[90].primary,1);
    const event=observation(r,t+300000,unavailable);assert.equal(r.plan.assignments[90].primary,2);assert.equal(event.changes[0].reason,reason);
  });
}
test('same country abroad, unknown status, recovery, leadership lock, no backup, active claims and returning primary',()=>{
  const t=1800000000000,r=initial();commandMutation(r,assign,officer,t);observation(r,t);assert.equal(r.ops.states[90].phase,'ASSIGNED');
  observation(r,t+1,{online:'Unknown'});assert.equal(r.ops.states[90].phase,'UNKNOWN_STATUS');
  observation(r,t+2,{online:'Offline'});observation(r,t+60000);assert.equal(r.ops.states[90].since,undefined);
  commandMutation(r,{type:'lock',target:90,reason:'opening duty'},officer,t+60000);
  observation(r,t+60001,{online:'Offline'});observation(r,t+400001,{online:'Offline'});assert.equal(r.plan.assignments[90].primary,1);assert.equal(r.ops.states[90].phase,'LOCKED_UNAVAILABLE');
  assert.throws(()=>commandMutation(r,{type:'unlock',target:90},{role:'member',id:2},t+400001));
  commandMutation(r,{type:'claim',target:90},{role:'skull',id:2},t+400001);
  commandMutation(r,{type:'unlock',target:90},officer,t+400002);
  observation(r,t+400003,{online:'Offline'});assert.equal(r.plan.assignments[90].primary,1);
  observation(r,t+600000,{online:'Offline'});assert.equal(r.plan.assignments[90].primary,2);assert.equal(r.ops.claims[90].status,'expired');
  observation(r,t+601000);assert.equal(r.plan.assignments[90].primary,2);
  observation(r,t+1200001);assert.equal(r.plan.assignments[90].primary,1);assert.deepEqual(r.plan.assignments[90].backups.sort(),[2,3]);
  const no=initial();commandMutation(no,{...assign,backups:[]},officer,t);
  observation(no,t,{online:'Offline'});observation(no,t+400000,{online:'Offline'});assert.equal(no.ops.states[90].phase,'REASSIGNMENT_READY');
});
test('spare coverage precedes overloading; same hitter can be queued for multiple targets',()=>{
  const r=initial(),t=1800000000000;commandMutation(r,assign,officer,t);
  commandMutation(r,{...assign,target:91,primary:2,backups:[1,3]},officer,t);
  observation(r,t,{online:'Offline'});observation(r,t+300000,{online:'Offline'});assert.equal(r.plan.assignments[90].primary,3);
  commandMutation(r,{...assign,target:92,primary:3,backups:[]},officer,t+300001);
  assert.equal(Object.values(r.plan.assignments).filter(a=>a.primary===3).length,2);
});
test('scheduled cleanup expires claims without ever confirming a hitter or changing primary',async()=>{
  const {env,sqlite}=database();
  await request(env,'writer',assign);await request(env,'skull-1',{type:'claim',target:90},1);
  const row=sqlite.prepare('SELECT operations FROM war_command').get(),ops=JSON.parse(row.operations);
  ops.claims[90].expires=Date.now()-1000;ops.states[90]={phase:'UNAVAILABLE_PENDING',since:Date.now()-600000};
  sqlite.prepare('UPDATE war_command SET operations=?').run(JSON.stringify(ops));
  let pending;worker.scheduled({},env,{waitUntil:p=>{pending=p;}});await pending;
  const state=await(await request(env,'reader')).json();
  assert.equal(state.ops.claims[90].status,'expired');assert.equal(state.plan.assignments[90].primary,1);assert.equal(state.ops.states[90].phase,'REASSIGNMENT_READY');
  assert.equal(state.revision,3);assert.equal(state.events[0].event.type,'cleanup');
});
