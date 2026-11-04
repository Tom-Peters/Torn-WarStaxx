import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../shared-worker/src/index.js',import.meta.url),'utf8');
const sandbox={Response,URL};
runInNewContext(source.replace('export default','globalThis.__worker ='),sandbox);
const worker=sandbox.__worker;
const READ='r'.repeat(48),WRITE='w'.repeat(48);
const data={assignments:{'4':88},blackSkulls:{'4':true},
  hitterRisk:{'4':{mode:'balanced'}},controlAssignments:{'88':4}};
function env(){
  const rooms=new Map(),db={prepare(sql){
    return {bind(...args){return {
      async first(){
        const [faction,war]=args;
        return rooms.get(faction+':'+war)||null;
      },
      async run(){
        assert.ok(sql.includes('ON CONFLICT'), 'Must enforce compare-and-swap in SQL');
        const [faction,war,body,updatedAt,expected]=args,key=faction+':'+war,
          previous=rooms.get(key)||null;
        if(previous&&previous.revision!==expected)return {meta:{changes:0}};
        rooms.set(key,{revision:previous?previous.revision+1:1,data:body,updated_at:updatedAt});
        return {meta:{changes:1}};
      }
    };}};
  }};
  return {FACTION_ID:'1234',SHARED_READ_TOKEN:READ,SHARED_WRITE_TOKEN:WRITE,DB:db};
}
function request(method,token,faction=1234,revision=null,payload=data){
  const headers=new Headers({Origin:'https://www.torn.com'});
  if(token)headers.set('Authorization','Bearer '+token);
  if(revision!==null)headers.set('If-Match',String(revision));
  return new Request('https://shared.example/v1/factions/'+faction+'/wars/123/orders',
    {method,headers,...(method==='PUT'?{body:JSON.stringify({data:payload})}: {})});
}
test('shared orders deny anonymous readers and readers who attempt writes',async()=>{
  const e=env();
  const anonymous=await worker.fetch(request('GET',''),e);
  assert.equal(anonymous.status,401);
  const denied=await worker.fetch(request('PUT',READ,1234,0),e);
  assert.equal(denied.status,403);
});
test('faction ID is locked to Worker deployment even with a valid token',async()=>{
  const response=await worker.fetch(request('GET',READ,5678),env());
  assert.equal(response.status,403);
});
test('only revision zero may create a new room; stale writes never win',async()=>{
  const e=env();
  const stale=await worker.fetch(request('PUT',WRITE,1234,99),e);
  assert.equal(stale.status,409);
  const created=await worker.fetch(request('PUT',WRITE,1234,0),e);
  assert.equal(created.status,200);
  assert.equal((await created.json()).revision,1);
  const conflict=await worker.fetch(request('PUT',WRITE,1234,0),e);
  assert.equal(conflict.status,409);
  const updated=await worker.fetch(request('PUT',WRITE,1234,1),e);
  assert.equal(updated.status,200);
  assert.equal((await updated.json()).revision,2);
  const pulled=await worker.fetch(request('GET',READ),e);
  assert.equal((await pulled.json()).data.assignments[4],88);
});
test('sensitive or malformed maps are rejected and not stored',async()=>{
  const e=env();
  const secretPayload={...data,spies:{4:{strength:100}}};
  const bad=await worker.fetch(request('PUT',WRITE,1234,0,secretPayload),e);
  assert.equal(bad.status,400);
  const badRisk={...data,hitterRisk:{'4':{mode:'trust-everything'}}};
  const invalid=await worker.fetch(request('PUT',WRITE,1234,0,badRisk),e);
  assert.equal(invalid.status,400);
});
test('normal browser CORS preflight is accepted only for Torn origins',async()=>{
  const e=env();
  const ok=await worker.fetch(new Request('https://shared.example/v1/factions/1234/wars/123/orders',{
    method:'OPTIONS',headers:{Origin:'https://www.torn.com'}}),e);
  assert.equal(ok.status,204);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'),'https://www.torn.com');
  const bad=await worker.fetch(new Request('https://shared.example/v1/factions/1234/wars/123/orders',{
    method:'OPTIONS',headers:{Origin:'https://evil.example'}}),e);
  assert.equal(bad.status,403);
});
