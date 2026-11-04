import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext, Script } from 'node:vm';

const source = readFileSync(new URL('../WarStaxx.user.js', import.meta.url), 'utf8');
const helpers = `
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
  const parseArray=value=>Array.isArray(value)?value:Object.entries(
    value&&typeof value==='object'?value:{}).filter(([key])=>/^\\d+$/.test(key))
    .map(([key,v])=>({id:positive(v.id||key),...v}));
  const unpack=(j,k)=>j?.[k]??j;
`;
function extract(start,end) {
  const begin=source.indexOf('  function '+start+'(');
  const finish=source.indexOf('  function '+end+'(',begin+1);
  assert.ok(begin>0&&finish>begin, 'Expected adjacent source parsers: '+start+' / '+end);
  return source.slice(begin,finish);
}
const report = runInNewContext(helpers+extract('report','attacks')+'; report');
const warHistory = runInNewContext(helpers+extract('roster','detectWar')+'; warHistory');
const roster = runInNewContext(helpers+extract('roster','warHistory')+'; roster');

const basicStart=source.indexOf('  function normaliseFactionBasic(');
const basicEnd=source.indexOf('  async function refreshFactionBasics(',basicStart);
assert.ok(basicStart>0&&basicEnd>basicStart,'Expected public faction-basic parser');
const normaliseFactionBasic=runInNewContext(
  helpers+source.slice(basicStart,basicEnd)+'; normaliseFactionBasic');

test('public faction basic comparison retains respect, rank, winning history, leadership and capacity',()=>{
  const basic=normaliseFactionBasic({basic:{
    id:123,name:'Example A',tag:'EX',respect:5500000,days_old:1200,capacity:100,members:95,
    leader_id:111,co_leader_id:222,best_chain:5000,
    rank:{name:'Gold',level:10,division:3,position:4,wins:17}
  }});
  assert.equal(basic.id,123);
  assert.equal(basic.name,'Example A');
  assert.equal(basic.respect,5500000);
  assert.equal(basic.members,95);
  assert.equal(basic.capacity,100);
  assert.equal(basic.rankName,'Gold');
  assert.equal(basic.rankedWins,17);
  assert.equal(basic.leader,111);
  assert.equal(basic.bestChain,5000);
});

test('deep scan and opponent-switch safeguards remain wired',()=>{
  assert.match(source,/action==='deep-scan'/);
  assert.ok(source.includes('function setOpponent('));
  assert.ok(source.includes('state.data.enemies=[]'));
  assert.ok(source.includes('function refreshFactionBasics('));
});

test('source remains ASCII and parses after smart-quote conversion',()=>{
  assert.doesNotMatch(source,/[^\x00-\x7f]/u);
  assert.doesNotThrow(()=>new Script(source));
  const normalised=source.replace(/[\u2018\u2019]/gu,"'").replace(/[\u201c\u201d]/gu,'"');
  assert.doesNotThrow(()=>new Script(normalised));
});
test('official ranked war report includes actual end, winner, ranks, rewards and each player score',()=>{
  const result=report({rankedwarreport:{
    id:900,start:1730000000,end:1730100000,winner:123,forfeit:false,
    factions:[
      {id:123,name:'Example A',score:2500,attacks:41,
        rank:{before:'Silver',after:'Gold'},rewards:{points:25,respect:400,items:[{id:88,name:'Cache',quantity:2}]},
        members:[{id:11,name:'Player A',score:1700,attacks:21,level:75},{id:12,name:'Player B',score:800,attacks:20,level:60}]},
      {id:456,name:'Example B',score:1400,attacks:31,members:[{id:21,name:'Player C',score:900,attacks:15,level:80}]}
    ]}},900);
  assert.equal(result.id,900);
  assert.equal(result.war.end,1730100000);
  assert.equal(result.war.winner,123);
  assert.equal(result.factions[0].score,2500);
  assert.equal(result.factions[0].attacks,41);
  assert.equal(result.factions[0].rankAfter,'Gold');
  assert.equal(result.factions[0].rewards.points,25);
  assert.equal(result.factions[0].rewards.items[0].quantity,2);
  assert.equal(result.factions[0].members[0].score,1700);
  assert.equal(result.factions[0].members[0].attacks,21);
  assert.equal(result.factions[1].members[0].id,21);
});
test('ranked-war history retains official opposing side scores and winner',()=>{
  const history=warHistory({rankedwars:[{id:900,start:1730000000,end:1730100000,winner:123,
    factions:[{id:123,name:'Example A',score:2500},{id:456,name:'Example B',score:1400}]}]});
  assert.equal(history.length,1);
  assert.equal(history[0].id,900);
  assert.equal(history[0].end,1730100000);
  assert.equal(history[0].winner,123);
  assert.equal(history[0].scores[0].score,2500);
  assert.equal(history[0].scores[1].score,1400);
});
test('roster keeps status, last-action timestamps and publicly supplied member metadata',()=>{
  const result=roster({members:[{id:21,name:'Example Player',level:65,position:'Member',days_in_faction:100,
    status:{state:'Hospital',description:'Hospitalised',until:1730100000},
    last_action:{status:'Online',timestamp:1730000000},is_on_wall:true}]});
  assert.equal(result[0].id,21);
  assert.equal(result[0].name,'Example Player');
  assert.equal(result[0].status,'Hospital');
  assert.equal(result[0].lastAction,'Online');
  assert.equal(result[0].lastAt,1730000000000);
  assert.equal(result[0].daysInFaction,100);
  assert.equal(result[0].onWall,true);
});
test('every major intel view has navigation and manual-player controls',()=>{
  for(const view of ['overview','intel','warReportView','targets','playerIntel','activity','history','strategy']){
    assert.match(source,new RegExp('function '+view+'\\('));
  }
  for(const action of ['player:','war:','load-report:','public:','hour:','tab:assignments']){
    assert.ok(source.includes(action),'Missing routed action '+action);
  }
  assert.ok(source.includes("const sections=['overview','command','pace','targets'"));
});
