import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../WarStaxx.user.js',import.meta.url),'utf8');
function region(from,to){
  const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
  assert.ok(a>=0&&b>a,'Missing source region '+from);
  return source.slice(a,b);
}
test('Torn actual awarded FF remains 1..3 while FFScouter calculated FF may exceed 3',()=>{
  const code=region('  const validFF=v=>','  const ffTimestamp=v=>');
  const {validFF,validScouterFF}=runInNewContext(code+';({validFF,validScouterFF})');
  assert.equal(validFF(3),3);
  assert.equal(validFF(9.29),null);
  assert.equal(validScouterFF(9.29),9.29);
  assert.equal(validScouterFF('9.29'),9.29);
  for(const bad of [null,undefined,'',-1,'garbage',Infinity])assert.equal(validScouterFF(bad),null);
});
test('FFScouter 9.29 FF and 62m total survive parser without being mistaken for awarded attack data',()=>{
  const c=region('  function parseFFRows(rows,ids,at=Date.now()){','  function ffscouter(id){');
  const validators=region('  const validFF=v=>','  const ffTimestamp=v=>');
  const timestamp=region('  const ffTimestamp=v=>','  function parseFFRows(rows,ids,at=Date.now()){');
  const parse=runInNewContext(validators+timestamp+c+';parseFFRows',{
    Date,Number,Set,positive:x=>Math.max(0,Number(x)||0)
  });
  const row={player_id:44,fair_fight:9.29,bss_public:15448,bs_estimate:62000000,
    bs_estimate_human:'62m',last_updated:'2026-11-02T20:45:00Z'};
  const result=parse([row],[44],Date.parse('2026-11-07T20:45:00Z'));
  assert.equal(result[44].ff,9.29);
  assert.equal(result[44].bss,15448);
  assert.equal(result[44].bsEstimate,62000000);
  assert.equal(result[44].missing,false);
});
test('confirmed uncapped FF is visibly marked as high risk not an easy win',()=>{
  const badge=region('  function ffBadge(id,action=true){','  function matchup(friend,enemy){');
  assert.match(badge,/x\.ff>4\.5\?'ws-ff-danger'/);
  const native=region('  function syncNativeWar(){','  async function pollNativeWar(){');
  assert.match(native,/ff\.ff>4\.5\?' RISK'/);
  assert.match(native,/ff\.ff>3\?' HARD'/);
  assert.match(source,/const validScouterFF=/);
  assert.match(source,/validScouterFF\(p\?\.fair_fight\)/);
  assert.match(source,/if\(!canCall\('ffscouter',force\?0:10\*MIN\)\)return/);
  assert.match(source,/ffEstimateParserVersion!==2/);
  assert.doesNotThrow(()=>new Script(source));
});
