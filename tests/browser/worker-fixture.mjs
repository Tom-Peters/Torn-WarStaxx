// Offline browser integration transport. Every request goes through the real Worker.
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import worker from '../../shared-worker/src/index.js';
const db=new DatabaseSync(':memory:');
for(const file of ['0001_init','0002_command'])db.exec(readFileSync(new URL('../../shared-worker/migrations/'+file+'.sql',import.meta.url),'utf8'));
const hash=createHash('sha256').update('fixture-hitter').digest('hex');
const env={FACTION_ID:'10',SHARED_READ_TOKEN:'fixture-reader',SHARED_WRITE_TOKEN:'fixture-writer',
  MEMBER_GRANTS:JSON.stringify({[hash]:{id:1,role:'skull',faction:10,expires:Date.now()+86400000}}),
  DB:{prepare(sql){const stmt=db.prepare(sql);return {run:async()=>stmt.run(),bind(...args){return {
    first:async()=>stmt.get(...args),all:async()=>({results:stmt.all(...args)}),run:async()=>({meta:{changes:stmt.run(...args).changes}})};}};}}};
for await(const line of createInterface({input:process.stdin})){
  try{
    const {url,method,headers,body}=JSON.parse(line);
    const response=await worker.fetch(new Request(url,{method,headers,body:method==='PUT'?body:undefined}),env);
    console.log(JSON.stringify({status:response.status,responseText:await response.text()}));
  }catch{console.log(JSON.stringify({status:500,responseText:'{}'}));}
}
