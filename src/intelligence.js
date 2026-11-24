  // Locally stored evidence is shared between sessions on this Torn origin.
  const combatArchive = {db:null, fights:new Map(), fightRevision:0, pairs:new Map(), people:new Map(), hours:new Map(), error:'', ready:false};
  const idKey = v => Number.isSafeInteger(v) && v>0 && v<=9999999999;
  const pairKey = (a,b) => Math.min(a,b)+'/'+Math.max(a,b);
  function indexFight(row){
    combatArchive.fightRevision++;
    combatArchive.fights.set(row.id,row);
    if(!row.attacker||!row.defender)return;
    const key=pairKey(row.attacker,row.defender);
    if(!combatArchive.pairs.has(key))combatArchive.pairs.set(key,new Map());
    combatArchive.pairs.get(key).set(row.id,row);
  }
  function pairRows(a,b){return Array.from(combatArchive.pairs.get(pairKey(a,b))?.values()||[]);}
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
    if(!raw||!idKey(raw.id)||(!idKey(raw.attacker)&&!idKey(raw.defender))||raw.attacker===raw.defender||
      !Number.isSafeInteger(raw.at)||raw.at<1e12||raw.at>Date.now()+60000)return null;
    const row={id:raw.id};if(idKey(raw.attacker))row.attacker=raw.attacker;if(idKey(raw.defender))row.defender=raw.defender;
    for(const k of archiveNumbers)if(typeof raw[k]==='number'&&Number.isFinite(raw[k])&&raw[k]>=0&&(!['attackerFaction','defenderFaction','warId','startedAt','endedAt'].includes(k)||raw[k]>0))row[k]=raw[k];
    for(const k of ['result','attackerName','defenderName'])if(typeof raw[k]==='string'&&raw[k])row[k]=raw[k].slice(0,80);
    if(typeof raw.ranked==='boolean')row.ranked=raw.ranked;
    if(raw.defenderFactionless===true&&!row.defenderFaction)row.defenderFactionless=true;
    const dated={};
    for(const [side,who] of [['attacker',row.attacker],['defender',row.defender]]){
      const prior=raw.spyEvidence?.[side],live=spy(who);
      const valid=v=>v?.observedAt>0&&v.observedAt<=row.at&&bsScore(v)!==null;
      const evidence=valid(prior)?prior:valid(live)?live:null;
      if(evidence)dated[side]={observedAt:evidence.observedAt,source:String(evidence.source||'Local dated spy').slice(0,60),
        ...Object.fromEntries(['strength','speed','defense','dexterity'].map(k=>[k,Number(evidence[k])]))};
    }
    if(Object.keys(dated).length)row.spyEvidence=dated;
    return row;
  }
  function transact(store,callback){
    return new Promise((resolve,reject)=>{
      const tx=combatArchive.db.transaction(store,'readwrite');
      tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||Error('Local archive write failed'));
      callback(tx.objectStore(store),tx);
    });
  }
  const archiveFailure=()=>{combatArchive.error='Local intelligence could not be saved. Export a backup and check device storage.';};
  const permittedSources=['Torn personal','Torn faction','Torn ranked attacks','Legacy local','Local import'];
  async function keepFights(rows,source){
    await archiveReady;
    if(!combatArchive.db)return false;
    if(!rows.length)return true;
    const staged=new Map();let newCount=0,existingCount=0;
    await transact('fights',store=>{
      const total=store.count();total.onsuccess=()=>{existingCount=total.result;};
      for(const raw of rows){
        const row=cleanFight(raw);if(!row||staged.has(row.id))continue;
        staged.set(row.id,null);
        const req=store.get(row.id);
        req.onsuccess=()=>{
          const old=req.result;
          if(old&&['attacker','defender'].some(k=>old[k]&&row[k]&&old[k]!==row[k]))return;
          if(!old&&existingCount+newCount>=40000){combatArchive.error='Combat archive capacity reached. Export your archive before collecting more.';return;}
          if(!old)newCount++;
          const sources=[...new Set([...(old?.sources||[]),...(source==='Local import'?(raw.sources||[]).filter(x=>permittedSources.includes(x)):[]),source])];
          const merged={...row,...old,sources,capturedAt:old?.capturedAt||(source==='Local import'&&Number.isSafeInteger(raw.capturedAt)?Math.min(Date.now(),raw.capturedAt):Date.now())};
          // Prefer detailed live fields over a partial or legacy record.
          if(source==='Torn faction'||source==='Torn ranked attacks')Object.assign(merged,row);
          if(old?.spyEvidence||row.spyEvidence)merged.spyEvidence={...row.spyEvidence,...old?.spyEvidence};
          merged.quality=merged.ff!==undefined&&merged.startedAt&&merged.endedAt?'detailed':'partial';
          if(JSON.stringify(old)!==JSON.stringify(merged))store.put(merged);
          staged.set(row.id,merged);
        };
      }
    });
    for(const row of staged.values())if(row)indexFight(row);
    return rows.every(raw=>staged.get(raw.id));
  }
  function readArchiveStore(name){
    return new Promise((resolve,reject)=>{
      const req=combatArchive.db.transaction(name).objectStore(name).getAll();
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  const archiveReady=(async()=>{
    try{
      combatArchive.db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open('warstaxx-intelligence',1);
        req.onupgradeneeded=()=>{for(const store of ['fights','people','hours'])req.result.createObjectStore(store,{keyPath:'id'});};
        req.onblocked=()=>reject(Error('Archive open in another tab'));
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      });
      const [fights,people,hours]=await Promise.all(['fights','people','hours'].map(readArchiveStore));
      for(const row of fights)indexFight(row);
      for(const row of people)combatArchive.people.set(row.id,row);
      for(const row of hours)combatArchive.hours.set(row.id,row);
      combatArchive.ready=true;
    }catch(_){archiveFailure();}
  })();
  function reliableBse(player){
    const x=ffscouter(player.id),at=Date.now();
    return x&&!ffIsStale(x)&&x.updatedAt>0&&x.updatedAt<=at&&x.at<=at&&x.bsEstimate>0?
      {value:x.bsEstimate,source:'FFScouter BSE',at:x.updatedAt}:{value:null,source:'BSE needs intelligence'};
  }
  async function importPeople(rows){
    if(!Array.isArray(rows)||rows.length>40000)throw Error('Invalid membership backup');
    const staged=[];
    await transact('people',store=>{
      for(const row of rows){
        if(!idKey(row.id)||typeof row.name!=='string'||!Number.isSafeInteger(row.at)||!Array.isArray(row.memberships))continue;
        const incoming=row.memberships.filter(m=>idKey(m.faction)&&Number.isSafeInteger(m.first)&&Number.isSafeInteger(m.last)&&m.first<=m.last&&m.last<=Date.now()+MIN)
          .map(m=>({faction:m.faction,first:m.first,last:m.last}));
        const req=store.get(row.id);req.onsuccess=()=>{
          const old=req.result,history=new Map();
          for(const m of [...incoming,...(old?.memberships||[])]){
            const k=m.faction+'/'+m.first,prior=history.get(k);if(!prior||m.last>prior.last)history.set(k,m);
          }
          const newest=old&&old.at>=row.at?old:row,merged={id:row.id,name:newest.name.slice(0,80),at:newest.at,memberships:[...history.values()].sort((a,b)=>a.first-b.first)};
          store.put(merged);staged.push(merged);
        };
      }
    });staged.forEach(p=>combatArchive.people.set(p.id,p));
  }
  function attributedWar(row){
    if(row.ranked!==true||!row.attackerFaction||!row.defenderFaction)return null;
    const wars=new Set([state.data.war?.id,...state.data.ourWars.map(w=>w.id)].filter(Boolean)),matches=[];
    for(const id of wars){
      const w=warAttackWindow(id);if(w?.start&&w.end>=row.at&&row.at>=w.start&&
        ((row.attackerFaction===w.ourId&&row.defenderFaction===w.enemyId)||(row.attackerFaction===w.enemyId&&row.defenderFaction===w.ourId)))matches.push(id);
    }
    return matches.length===1?matches[0]:null;
  }
  async function historicalPage(feed){
    const personal=feed==='user',owner=positive(personal?state.data.meta.ownerId:cfg.ourId),meta=state.data.meta;
    if(!owner||!effectiveKey()||document.hidden||(!personal&&!cfg.enableAttacks))return;
    const cursors=meta.commandCursors||(meta.commandCursors={}),key=feed+'/'+owner;
    if(cursors[key]===0){meta.historyMessage='Reached the end of this authorised attack feed.';return;}
    const before=cursors[key]||Math.floor(Date.now()/1000);
    const body=await call('/'+feed+'/attacks?sort=DESC&limit=100&to='+before,'command-history-'+key,5*MIN);
    if(!Array.isArray(body?.attacks)||owner!==positive(personal?state.data.meta.ownerId:cfg.ourId))return;
    const rows=attacks(body,true).map(a=>({...a,warId:attributedWar(a)}));
    await keepFights(rows,personal?'Torn personal':'Torn faction');
    if(!combatArchive.ready||combatArchive.error)return;
    const times=body.attacks.map(a=>a.ended).filter(t=>Number.isSafeInteger(t)&&t>0);
    const oldest=times.length?Math.min(...times):0;
    if(body.attacks.length<100)cursors[key]=0;
    else if(oldest>0&&oldest<before)cursors[key]=oldest;
    meta.historyMessage=body.attacks.length===100&&(!oldest||oldest>=before)?'Inclusive timestamp page did not advance. Coverage remains partial.':
      rows.length+' '+feed+' attack records checked.';save();
  }
