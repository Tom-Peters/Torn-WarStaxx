  // Locally stored evidence is shared between sessions on this Torn origin.
  const intel = {db:null, fights:new Map(), pairs:new Map(), people:new Map(), hours:new Map(), error:'', ready:false};
  const idKey = v => Number.isSafeInteger(v) && v>0 && v<=9999999999;
  const pairKey = (a,b) => Math.min(a,b)+'/'+Math.max(a,b);
  function indexFight(row){
    const key=pairKey(row.attacker,row.defender);
    if(!intel.pairs.has(key))intel.pairs.set(key,new Map());
    intel.pairs.get(key).set(row.id,row);intel.fights.set(row.id,row);
  }
  function pairRows(a,b){return Array.from(intel.pairs.get(pairKey(a,b))?.values()||[]);}
  function fightOutcome(result){
    if(/^(attacked|left|hospitali[sz]ed|mugged|looted|won|victory)$/i.test(result))return 'wins';
    if(/^(lost|defeated)$/i.test(result))return 'losses';
    return /^stalemate$/i.test(result)?'stalemates':'unknown';
  }
  function pairEvidence(rows,hitter,at,ratio=null){
    const totals=()=>({wins:0,losses:0,stalemates:0,unknown:0});
    const offense=totals(),defense=totals(),recent=[];
    for(const row of rows.filter(r=>r.at>0&&r.at<=at).sort((a,b)=>b.at-a.at)){
      const outcome=fightOutcome(row.result);
      if(row.attacker===hitter){
        offense[outcome]++;
        if(outcome!=='unknown'&&at-row.at<=30*86400000)recent.push(outcome);
      }else defense[outcome==='wins'?'losses':outcome==='losses'?'wins':outcome]++;
    }
    const category=recent[0]==='losses'||recent[0]==='stalemates'||ratio>=1.15?'Avoid or reassess':
      recent[0]==='wins'&&ratio!==null&&ratio<1?'Proven favourable matchup':
      recent[0]==='wins'||(ratio!==null&&ratio<0.8)?'Possible favourable matchup':'Insufficient evidence';
    return {offense,defense,recent,category};
  }
  const archiveNumbers=['at','startedAt','endedAt','attackerFaction','defenderFaction','warId','ff','respect','respectLoss','chain','chainBonus','modifierWar','modifierRetaliation','modifierOverseas','modifierGroup','modifierWarlord'];
  function cleanFight(raw){
    if(!raw||![raw.id,raw.attacker,raw.defender].every(idKey)||raw.attacker===raw.defender||
      !Number.isSafeInteger(raw.at)||raw.at<1e12||raw.at>Date.now()+60000)return null;
    const row={id:raw.id,attacker:raw.attacker,defender:raw.defender};
    for(const k of archiveNumbers)if(typeof raw[k]==='number'&&Number.isFinite(raw[k])&&raw[k]>=0&&(!['attackerFaction','defenderFaction','warId','startedAt','endedAt'].includes(k)||raw[k]>0))row[k]=raw[k];
    for(const k of ['result','attackerName','defenderName'])if(typeof raw[k]==='string'&&raw[k])row[k]=raw[k].slice(0,80);
    if(typeof raw.ranked==='boolean')row.ranked=raw.ranked;
    return row;
  }
  function transact(store,callback){
    return new Promise((resolve,reject)=>{
      const tx=intel.db.transaction(store,'readwrite');
      tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||Error('Local archive write failed'));
      callback(tx.objectStore(store),tx);
    });
  }
  const archiveFailure=()=>{intel.error='Local intelligence could not be saved. Export a backup and check device storage.';};
  const permittedSources=['Torn personal','Torn faction','Torn ranked attacks','Legacy local','Local import'];
  async function keepFights(rows,source){
    await archiveReady;
    if(!intel.db||!rows.length)return;
    const staged=new Map();
    await transact('fights',store=>{
      for(const raw of rows){
        const row=cleanFight(raw);if(!row||staged.has(row.id))continue;
        staged.set(row.id,null);
        const req=store.get(row.id);
        req.onsuccess=()=>{
          const old=req.result;
          if(old&&(old.attacker!==row.attacker||old.defender!==row.defender))return;
          if(!old&&intel.fights.size+staged.size>40000){intel.error='Combat archive capacity reached. Export your archive before collecting more.';return;}
          const sources=[...new Set([...(old?.sources||[]),...(source==='Local import'?(raw.sources||[]).filter(x=>permittedSources.includes(x)):[]),source])];
          const merged={...row,...old,sources,capturedAt:old?.capturedAt||(source==='Local import'&&Number.isSafeInteger(raw.capturedAt)?Math.min(Date.now(),raw.capturedAt):Date.now())};
          // Prefer detailed live fields over a partial or legacy record.
          if(source==='Torn faction'||source==='Torn ranked attacks')Object.assign(merged,row);
          merged.quality=merged.ff!==undefined&&merged.startedAt&&merged.endedAt?'detailed':'partial';
          if(JSON.stringify(old)!==JSON.stringify(merged))store.put(merged);
          staged.set(row.id,merged);
        };
      }
    });
    for(const row of staged.values())if(row)indexFight(row);
  }
  function readArchiveStore(name){
    return new Promise((resolve,reject)=>{
      const req=intel.db.transaction(name).objectStore(name).getAll();
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  const archiveReady=(async()=>{
    try{
      intel.db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open('warstaxx-intelligence',1);
        req.onupgradeneeded=()=>{for(const store of ['fights','people','hours'])req.result.createObjectStore(store,{keyPath:'id'});};
        req.onblocked=()=>reject(Error('Archive open in another tab'));
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      });
      const [fights,people,hours]=await Promise.all(['fights','people','hours'].map(readArchiveStore));
      for(const row of fights)indexFight(row);
      for(const row of people)intel.people.set(row.id,row);
      for(const row of hours)intel.hours.set(row.id,row);
      intel.ready=true;
    }catch(_){archiveFailure();}
  })();
  function reliableBse(player){
    const x=ffscouter(player.id),at=Date.now();
    return x&&!ffIsStale(x)&&x.updatedAt>0&&x.updatedAt<=at&&x.at<=at&&x.bsEstimate>0?
      {value:x.bsEstimate,source:'FFScouter BSE',at:x.updatedAt}:{value:null,source:'BSE needs intelligence'};
  }
