  // Cost is estimated at the standard attack price. Score and result never decide
  // whether the initiator spent energy. Defending a hit contributes no attempts.
  let effortCache=null;
  function effortAttacks(w){
    const legacy=state.data.attacks,revision=combatArchive.fightRevision;
    const key=[w.id,w.ourId,w.enemyId,w.start,w.active?0:w.end].join('/');
    if(effortCache?.key===key&&effortCache.revision===revision&&effortCache.legacy===legacy)return effortCache;
    const members=new Map(),unattributed=new Set();
    function count(a){
      const at=a.startedAt||a.at;
      if(!at||at<w.start||at>w.end)return;
      const side=a.attackerFaction,opponent=side===w.ourId?w.enemyId:side===w.enemyId?w.ourId:0;
      if(!opponent||!a.attacker){
        if(opponent)unattributed.add(side);
        else if(!side){
          const defender=a.defenderFaction;
          if(a.ranked===true&&defender===w.ourId)unattributed.add(w.enemyId);
          else if(a.ranked===true&&defender===w.enemyId)unattributed.add(w.ourId);
          else {unattributed.add(w.ourId);unattributed.add(w.enemyId);}
        }
        return;
      }
      const id=side+'/'+a.attacker,row=members.get(id)||{id:a.attacker,side,name:a.attackerName,war:0,other:0,unknown:0};
      if(a.defenderFaction===opponent||(a.ranked===true&&!a.defenderFaction))row.war++;
      else if(a.ranked===false||(a.defenderFaction&&a.ranked!==true))row.other++;
      else row.unknown++;
      members.set(id,row);
    }
    for(const a of combatArchive.fights.values())count(a);
    // Older installations have a unique-by-ID local cache while IndexedDB opens.
    for(const a of legacy)if(a.id&&!combatArchive.fights.has(a.id))count(a);
    effortCache={key,legacy,revision,members,unattributed};
    return effortCache;
  }

  function flightStoreKey(w,faction,player,owner=0){
    return ['war-flights',w.id,w.start,faction,player,owner].join('/');
  }
  // Record the interval in which each observed departure could have happened.
  // A flight already in progress at the first check can predate the war.
  function observeFlight(row,p,at){
    if(at<=n(row.lastCheck))return;
    const flying=/^travell?ing$/i.test(p.status);
    if(!flying&&!['okay','hospital','jail','fallen'].includes(memberState(p))&&!/^abroad$/i.test(p.status))return;
    const legs=row.legs||(row.legs=[]),last=legs.at(-1);
    if(flying){
      const country=nativeWarLocation(p).country;
      if(!row.flying||!last||(country!=='Unknown'&&last.country!=='Unknown'&&country!==last.country)){
        legs.push({after:row.lastCheck||0,first:at,last:at,country});
      }else{
        last.last=at;
        if(country!=='Unknown')last.country=country;
      }
    }
    row.flying=flying;row.lastCheck=at;
  }
  async function writeFlightObservations(w,faction,entries,at,owner,update){
    await archiveReady;
    if(!combatArchive.db||!entries.length)return;
    const staged=[];
    await transact('hours',store=>{
      for(const entry of entries){
        const id=flightStoreKey(w,faction,entry.id,owner),req=store.get(id);
        req.onsuccess=()=>{
          const row=req.result||{id,source:'war-flights',war:w.id,faction,player:entry.id,owner};
          update(row,entry);
          row.hour=Math.max(row.hour||0,Math.floor(at/HOUR)*HOUR);
          store.put(row);staged.push(row);
        };
      }
    });
    for(const r of staged)combatArchive.hours.set(r.id,r);
  }
  function captureWarFlights(side,players,at){
    const w=warAttackWindow(state.data.war?.id);
    if(!w?.start||at<w.start||!activeWarNow()||side==='enemies'&&cfg.enemyId!==w.enemyId)return;
    const faction=side==='ours'?w.ourId:w.enemyId;
    writeFlightObservations(w,faction,players,at,0,(row,p)=>observeFlight(row,p,at)).catch(archiveFailure);
  }
  function storePremiumFlights(w,faction,rows,at,owner,history=false){
    return writeFlightObservations(w,faction,rows,at,owner,(record,entry)=>{
      const times=new Set(record.departures||[]);
      for(const takeoff of entry.times)if(Number.isSafeInteger(takeoff)&&takeoff>=w.start&&takeoff<=Math.min(at,w.end))times.add(takeoff);
      record.departures=[...times].sort((a,b)=>a-b);
      if(history)record.historyAt=Math.max(at,record.historyAt||0);
    });
  }
  function captureBatchDepartures(batch){
    const w=warAttackWindow(state.data.war?.id),owner=positive(state.data.meta.ownerId);
    if(!owner||!w?.start||!activeWarNow()||cfg.enemyId!==w.enemyId)return;
    for(const [side,faction] of [['ours',w.ourId],['enemies',w.enemyId]]){
      const entries=state.data[side].filter(p=>batch[p.id]?.current?.takeoff>=w.start)
        .map(p=>({id:p.id,times:[batch[p.id].current.takeoff]}));
      if(entries.length)storePremiumFlights(w,faction,entries,Date.now(),owner).catch(archiveFailure);
    }
  }
  function countedFlights(roster,premium,end){
    const dated=(premium?.departures||[]).filter(t=>t<=end);
    if(!roster?.lastCheck&&!dated.length&&!premium?.historyAt)return null;
    let count=dated.length;
    for(const leg of roster?.legs||[]){
      // Independent observations of the same leg share one departure. The
      // scanner may first detect takeoff after Torn already showed travelling.
      if(leg.after&&leg.first<=end&&!dated.some(t=>t>leg.after&&t<=leg.last))count++;
    }
    return count;
  }
  function effortWindow(id=state.data.war?.id){
    const w=warAttackWindow(id);
    if(w?.active&&!activeWarNow())w.end=Math.min(w.end,state.data.war?.observed||state.data.updated.wars||0);
    return w?.start&&w.end>=w.start&&w.ourId&&w.enemyId?w:null;
  }
  function effortFor(w,faction,id){
    const indexed=effortAttacks(w),counts=indexed.members.get(faction+'/'+id);
    const scan=concessionRecord(w.id);
    const covered=combatArchive.ready&&!combatArchive.error&&scan?.effortArchived&&scan.complete&&!scan.error&&
      (w.active?w.end-scan.caughtUpAt<2*MIN:scan.cursor*1000>=w.end)&&!indexed.unattributed.has(faction);
    const own=faction===w.ourId,classified=!counts?.unknown;
    const war=counts?.war||((covered&&classified)?0:null);
    const other=counts?.other||((own&&covered&&classified)?0:null);
    const roster=combatArchive.hours.get(flightStoreKey(w,faction,id));
    const owner=positive(state.data.meta.ownerId);
    const premium=owner&&scouterPremiumActive()?combatArchive.hours.get(flightStoreKey(w,faction,id,owner)):null;
    const total=counts?counts.war+counts.other+counts.unknown:(war===0&&other===0?0:null);
    return {war,other,total,unknown:counts?.unknown||0,flights:countedFlights(roster,premium,w.end)};
  }
  const effortCostLabel=count=>count===null?'\u2014':fmt(count)+' / ~'+fmt(count*25)+' E';
  const effortEnergyLabel=count=>count===null?'\u2014':'~'+fmt(count*25)+' E';
  const effortFlightLabel=count=>count===null?'\u2014':fmt(count)+' seen';
  function effortFields(e,field){
    return field('War hits / E',effortCostLabel(e.war))+field('Non-war hits / E',effortCostLabel(e.other))+
      (e.unknown?field('Unclassified / E',effortCostLabel(e.unknown)):'')+field('Flights',effortFlightLabel(e.flights))+
      field('Total attack E',effortEnergyLabel(e.total));
  }
  const effortGuide='Each recorded outgoing attempt counts, including losses, stalemates and assists. Energy uses the standard 25 E per attack. Enemy attacks on third parties are usually outside our feed. Flights count observed one-way departures, including returns. Gaps can hide hits or flights. A dash means unknown.';
  function effortReport(w){
    if(!w)return '';
    const index=effortAttacks(w);
    const groups=[['Our faction',w.ourId,'ours'],['Opponents',w.enemyId,'enemies']];
    return card('Attack energy and flights', '<p>'+effortGuide+' '+a('FFScouter data policy','https://ffscouter.com/#data-policy')+'</p>'+
      groups.map(([title,faction,side])=>{
        const timeline=state.data.warTimelines[w.id]?.sides?.[side]?.players||{};
        const members=new Map();
        for(const r of combatArchive.hours.values()){
          if(r.source==='war-flights'&&r.war===w.id&&r.faction===faction)members.set(r.player,{id:r.player,name:combatArchive.people.get(r.player)?.name});
        }
        for(const p of [...index.members.values()].filter(p=>p.side===faction))members.set(p.id,p);
        for(const p of [...Object.values(timeline),...(state.data.reports[w.id]?.factions?.find(f=>f.id===faction)?.members||[]),
          ...(w.active&&(side==='ours'||cfg.enemyId===w.enemyId)?state.data[side]:[])])members.set(p.id,p);
        const rows=[...members.values()].map(p=>({name:p.name||'#'+p.id,...effortFor(w,faction,p.id)}))
          .sort((a,b)=>(b.war??-1)-(a.war??-1)||a.name.localeCompare(b.name));
        return '<details data-ws-disclosure="effort-'+w.id+'-'+side+'"><summary>'+title+' ('+rows.length+')</summary>'+
          (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Player</th><th>War hits / E</th><th>Non-war / E</th><th>Total E</th><th>Flights</th></tr></thead><tbody>'+
          rows.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+effortCostLabel(r.war)+'</td><td>'+effortCostLabel(r.other)+
            (r.unknown?'<br><small>Unclassified '+effortCostLabel(r.unknown)+'</small>':'')+'</td><td>'+effortEnergyLabel(r.total)+'</td><td>'+effortFlightLabel(r.flights)+'</td></tr>').join('')+'</tbody></table></div>':empty('No players recorded for this faction.'))+'</details>';
      }).join(''));
  }
  const flightHistoryQueue={busy:false,next:0,attempts:new Map(),scope:''};
  function flightHistoryVisible(){
    return !document.hidden&&(isNativeWarPage()||state.open&&['enemy','ledger'].includes(state.tab));
  }
  async function backfillFlightHistory(){
    const q=flightHistoryQueue,at=Date.now(),owner=positive(state.data.meta.ownerId);
    if(q.busy||at<q.next||!flightHistoryVisible()||!activeWarNow()||!combatArchive.ready||!scouterPremiumActive()||!owner||scouterExtra.busy)return;
    const w=effortWindow(),key=ffApiKey();
    if(!w||!key||w.enemyId!==cfg.enemyId)return;
    const scope=[w.id,w.start,owner].join('/');
    if(q.scope!==scope){q.scope=scope;q.attempts.clear();}
    const candidates=[];
    for(const [side,faction] of [['ours',w.ourId],['enemies',w.enemyId]]){
      for(const {id} of state.data[side]){
        const prior=combatArchive.hours.get(flightStoreKey(w,faction,id,owner));
        const checked=Math.max(prior?.historyAt||0,q.attempts.get(id)||0);
        if(at-checked>=30*MIN)candidates.push({id,faction,side,checked});
      }
    }
    const next=candidates.sort((a,b)=>a.checked-b.checked)[0];
    if(!next)return;
    q.busy=true;q.attempts.set(next.id,at);
    try{
      const body=await ffRequest('https://ffscouter.com/api/v1/player-flights?'+new URLSearchParams({key,target:next.id}));
      if(!flightHistoryVisible()||!activeWarNow()||!scouterPremiumActive()||ffApiKey()!==key||state.data.meta.ownerId!==owner||
        state.data.war?.id!==w.id||cfg.ourId!==w.ourId||cfg.enemyId!==w.enemyId||!state.data[next.side].some(p=>p.id===next.id))return;
      if(Number(body?.player_id)!==next.id||!Array.isArray(body.recent_flights))return;
      const times=[body.current,...body.recent_flights].map(t=>ffTimestamp(t?.takeoff_time));
      await storePremiumFlights(w,next.faction,[{id:next.id,times}],at,owner,true);
      if(state.open&&['enemy','ledger'].includes(state.tab))render();
    }catch(e){
      q.next=Date.now()+Math.max(60,Number(e.retryAfter)||0)*1000;
    }finally{q.busy=false;q.next=Math.max(q.next,Date.now()+5000);}
  }
