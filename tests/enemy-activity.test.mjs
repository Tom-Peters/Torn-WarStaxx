import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const HOUR=3600000,at=Date.UTC(2026,10,19,7,30),hour=at-30*60000;
const source=readFileSync(new URL('../src/enemy-activity.js',import.meta.url),'utf8');
const {enemyHours,enemyScannerLabel,enemyActivityRange}=runInNewContext(source+';({enemyHours,enemyScannerLabel,enemyActivityRange})',{HOUR,fmt:String});
const recorded=(fields={})=>({hour,faction:20,source:'roster',player:8,online:2,...fields});
const scan=(fields={})=>recorded({source:'scanner',player:0,owner:1,active:8,score:12,...fields});
const args={at,ourFaction:10,faction:20,owner:1,premium:true,players:[{id:8,lastAt:at-1000}],observations:[],fights:[]};

test('enemy hours retain evidence with no friendly checks and separate named actions from faction scanner totals',()=>{
  const result=enemyHours({...args,observations:[recorded(),scan(),scan({hour:hour-24*HOUR,active:2}),
    scan({faction:99}),scan({owner:2}),scan({hour:hour+HOUR}),scan({hour:hour-15*24*HOUR})],
    legacy:{'enemies:8':{hours:{[hour/HOUR]:{online:4},[hour/HOUR-24]:{online:1}}}},
    fights:[{at,attackerFaction:20,defenderFaction:10,attacker:8},{at,attackerFaction:20,defenderFaction:99},
      {at,attackerFaction:99,attacker:8,defenderFaction:10}]})[7];
  assert.equal(enemyScannerLabel(result),'5 avg seen');
  assert.equal(result.scannerDates,2);
  assert.equal(result.online.size,1);assert.equal(result.online.get(8),3);
  assert.equal(result.attackers.size,1);assert.equal(result.attackers.get(8),1);
  assert.equal(result.lastActions[0].id,8);
  assert.equal(result.attacks,2);
  assert.equal(result.againstUs,1);
});
test('observed zero, provider score, entitlement and missing samples remain distinct',()=>{
  const label=observations=>enemyScannerLabel(enemyHours({...args,observations})[7]);
  assert.equal(label([scan({active:0,score:0})]),'0 avg seen');
  assert.equal(label([scan({active:null,score:4})]),'4 avg score');
  const partial=enemyHours({...args,observations:[scan({partial:true})]})[7];
  assert.equal(partial.scannerPartial,true);assert.equal(enemyScannerLabel(partial),'8 avg seen');
  assert.equal(label([]),'');
  assert.equal(enemyScannerLabel(enemyHours({...args,premium:false,observations:[scan()]})[7]),'');
});
test('a failed faction lookup does not suppress another faction or an opponent change',async()=>{
  const activity=readFileSync(new URL('../src/activity.js',import.meta.url),'utf8');
  const loader=activity.slice(activity.indexOf('  async function loadFactionScanner()'),activity.indexOf('  function activityCells('));
  const cfg={enemyId:20,ourId:10,ffConsent:true,ffEnabled:true},calls=[],stored=[];
  const load=runInNewContext("let scannerBusy=false,scannerScope='',scannerError='',scannerAttempts=new Map();"+loader+';loadFactionScanner',{
    cfg,document:{hidden:false},state:{data:{meta:{ownerId:1}},open:false},MIN:60000,HOUR,positive:Number,
    idKey:x=>x>0,ffApiKey:()=> 'fixture',URLSearchParams,checkFFRegistration:async()=>{},scouterPremiumActive:()=>true,
    ffRequest:async url=>{const faction=Number(new URL(url).searchParams.get('faction_id'));calls.push(faction);if(faction===20)throw Error();return {};},
    captureScanner:async (_,id)=>stored.push(id)
  });
  await load();await load();cfg.enemyId=30;await load();
  assert.deepEqual(calls,[20,10,30]);assert.deepEqual(stored,[10,30]);
});

test('enemy peak and low hours require repeated dates and do not infer a low from missing hours',()=>{
  const history=[scan(),scan({hour:hour-24*HOUR}),scan({hour:hour-HOUR,active:0}),scan({hour:hour-25*HOUR,active:0})];
  const compared=enemyActivityRange(enemyHours({...args,observations:history}));
  assert.match(compared,/Highest observed: 07:00/);assert.match(compared,/Lowest observed: 06:00/);
  assert.match(compared,/Compared 2 TCT hours/);
  assert.equal(enemyActivityRange(enemyHours({...args,observations:history.slice(0,3)})),'');
});
