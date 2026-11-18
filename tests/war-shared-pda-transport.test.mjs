import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext, Script} from 'node:vm';

const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
const start=source.indexOf('  async function sharedRequest(method,revision,payload){');
const end=source.indexOf('  function applySharedOrders(data){',start);
assert.ok(start>0&&end>start);
const fn=source.slice(start,end);

test('shared orders use Torn PDA native GET and PUT with authorization and revision',async()=>{
  const requests=[];
  const context={
    cfg:{shared:{token:'synthetic-token'}},
    sharedEndpoint:()=> 'https://warstaxx-shared-orders.tom-peters.workers.dev',
    sharedScope:()=>({faction:57819,war:12345}),
    PDA_httpGet:(url,headers)=>{
      requests.push({method:'GET',url,headers});
      return Promise.resolve({status:200,responseText:'{"revision":0,"data":null}'});
    },
    PDA_httpPut:(url,headers,body)=>{
      requests.push({method:'PUT',url,headers,body});
      return Promise.resolve({status:200,responseText:'{"revision":1}'});
    },
    fetch:()=>{throw new Error('Browser fetch must not run in Torn PDA');},
    Promise,setTimeout,clearTimeout,AbortController,Error,Number,JSON,String
  };
  runInNewContext(fn+';globalThis.issue=sharedRequest;',context);
  const get=await context.issue('GET');
  const put=await context.issue('PUT',0,{assignments:{}});
  assert.equal(get.status,200);
  assert.equal(put.status,200);
  assert.equal(requests.length,2);
  assert.match(requests[0].url,/\/v1\/factions\/57819\/wars\/12345\/orders$/);
  assert.equal(requests[0].headers.Authorization,'Bearer synthetic-token');
  assert.equal(requests[1].headers['If-Match'],'0');
  assert.deepEqual(JSON.parse(requests[1].body),{data:{assignments:{}}});
});
test('HTTP 401 stays distinguishable from network connection failure',async()=>{
  const context={
    cfg:{shared:{token:'synthetic-token'}},
    sharedEndpoint:()=> 'https://warstaxx-shared-orders.tom-peters.workers.dev',
    sharedScope:()=>({faction:57819,war:12345}),
    PDA_httpGet:()=>Promise.resolve({status:401,responseText:'{"error":"invalid shared token"}'}),
    Promise,setTimeout,clearTimeout,AbortController,Error,Number,JSON,String
  };
  runInNewContext(fn+';globalThis.issue=sharedRequest;',context);
  const response=await context.issue('GET');
  assert.equal(response.status,401);
  assert.equal(response.result.error,'invalid shared token');
});
test('Torn PDA userscript parses with updated version and Worker network grant',()=>{
  assert.doesNotThrow(()=>new Script(source));
  assert.match(source,/\/\/ @version\s+2\.8\.7/);
  assert.match(source,/\/\/ @connect\s+\*\.workers\.dev/);
});