import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const HOUR=3600000,start=Date.UTC(2026,10,20,20);
const source=readFileSync(new URL('../src/finish-clock.js',import.meta.url),'utf8');
const model=runInNewContext(source+'\n;fixedScoreFinish',{HOUR});
const forecast=(hours,net,target,extra={})=>model({start,net,target,at:start+hours*HOUR,...extra});

test('elapsed 3d 3h 33m at 704 / 1,392 projects the same finish for either leader',()=>{
  for(const [net,side] of [[704,'Win'],[-704,'Loss']]){
    const hours=75+33/60+1/3600;
    const result=forecast(hours,net,1392);
    assert.equal(result.side,side);assert.equal(result.end,start+99*HOUR);
    assert.equal(Math.ceil((result.end-start-hours*HOUR)/60000),1407);
    assert.equal(forecast(hours,net,1392,{opening:2900}).end,result.end);
  }
});
test('the first reduction is at hour 24 and equality wins on that step',()=>{
  assert.equal(forecast(0,990,1000).end,start+24*HOUR);
  assert.equal(forecast(23.999,989,1000).end,start+25*HOUR);
  assert.equal(forecast(24,-989,990).end,start+25*HOUR);
  assert.equal(forecast(25,-980,980).text,'Target reached');
  assert.equal(forecast(40,0,830).text,'Tied');
});
test('manual rules, original target mismatches and unavailable observations',()=>{
  assert.equal(forecast(3,-15,500,{rules:{mode:'day'}}).end,start+24*HOUR);
  assert.equal(forecast(25,15,500,{rules:{mode:'day'}}).text,'Checking result');
  assert.equal(forecast(3,15,500,{rules:{decay:0}}).text,'More points needed');
  assert.equal(forecast(12,700,800,{rules:{opening:1000,decay:10,after:11}}).end,start+13*HOUR);
  assert.equal(forecast(55,200,1000,{opening:1000}).text,'Check target');
  assert.equal(forecast(3,15,500,{rules:{mode:'own'}}).end,undefined);
  assert.equal(forecast(-1,15,500).end,undefined);
  assert.equal(forecast(3,null,500).end,undefined);
  assert.equal(forecast(3,15,0).end,undefined);
});
