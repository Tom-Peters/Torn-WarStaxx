  // Cost is estimated at the standard attack price. Score and result never decide
  // whether the initiator spent energy. Defending a hit contributes no attempts.
  let effortCache=null;
  function effortAttacks(w){
    const legacy=state.data.attacks,revision=combatArchive.fightRevision;
    const key=[w.id,w.ourId,w.enemyId,w.start,w.active&&!w.stale?0:w.end].join('/');
    if(effortCache?.key===key&&effortCache.revision===revision&&effortCache.legacy===legacy)return effortCache;
    const members=new Map(),factionAttempts=new Map(),unattributed=new Set(),hours=new Map();
    function count(a){
      const at=a.startedAt||a.at;
      if(!at||at<w.start||at>w.end)return;
      // A hidden ranked attacker can still be attributed to the opposing faction.
      const defender=a.defenderFaction;
      const side=a.attackerFaction||(a.ranked===true?(defender===w.ourId?w.enemyId:defender===w.enemyId?w.ourId:0):0);
      const opponent=side===w.ourId?w.enemyId:side===w.enemyId?w.ourId:0;
      if(!opponent){
        if(!side){unattributed.add(w.ourId);unattributed.add(w.enemyId);}
        return;
      }
      let kind='unknown';
      if(defender===opponent||(a.ranked===true&&!defender))kind='war';
      else if(defender===side)kind='friendly';
      else if(defender||a.defenderFactionless===true)kind='outside';
      else if(a.ranked===false)kind='unknownNonWar';
      factionAttempts.set(side,(factionAttempts.get(side)||0)+1);
      const hour=Math.floor(at/HOUR)*HOUR;
      if(!hours.has(hour))hours.set(hour,new Map());
      const bucket=hours.get(hour).get(side)||{war:0,friendly:0,outside:0,unknown:0,total:0};
      bucket[kind==='unknownNonWar'?'unknown':kind]++;bucket.total++;
      hours.get(hour).set(side,bucket);
      if(!a.attacker){unattributed.add(side);return;}
      const id=side+'/'+a.attacker,row=members.get(id)||{id:a.attacker,side,name:a.attackerName,
        war:0,friendly:0,outside:0,unknownNonWar:0,unknown:0,total:0,points:0};
      row[kind]++;row.total++;
      if(kind==='war'){
        if(a.ranked===true&&Number.isFinite(a.respect)&&a.respect>=0){
          if(row.points!==null)row.points+=a.respect;
        }else if(a.ranked!==false&&a.respect!==0&&!/^(lost|defeated|stalemate|timeout)$/i.test(a.result||''))row.points=null;
      }else if(kind==='unknown')row.points=null;
      members.set(id,row);
    }
    for(const a of combatArchive.fights.values())count(a);
    // Older installations have a unique-by-ID local cache while IndexedDB opens.
    for(const a of legacy)if(a.id&&!combatArchive.fights.has(a.id))count(a);
    effortCache={key,legacy,revision,members,factionAttempts,unattributed,hours};
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
      const destinations=record.destinations||(record.destinations={});
      for(const leg of entry.legs){
        const takeoff=leg.takeoff;
        if(!Number.isSafeInteger(takeoff)||takeoff<w.start||takeoff>Math.min(at,w.end))continue;
        times.add(takeoff);
        if(leg.description){
          const country=nativeWarLocation({status:'Traveling',statusText:leg.description}).country;
          if(country&&country!=='Unknown')destinations[takeoff]=country;
        }
      }
      record.departures=[...times].sort((a,b)=>a-b);
      if(history)record.historyAt=Math.max(at,record.historyAt||0);
    });
  }
  function captureBatchDepartures(batch){
    const w=warAttackWindow(state.data.war?.id),owner=positive(state.data.meta.ownerId);
    if(!owner||!w?.start||!activeWarNow()||cfg.enemyId!==w.enemyId)return;
    for(const [side,faction] of [['ours',w.ourId],['enemies',w.enemyId]]){
      const entries=state.data[side].filter(p=>batch[p.id]?.current?.takeoff>=w.start)
        .map(p=>({id:p.id,legs:[batch[p.id].current]}));
      if(entries.length)storePremiumFlights(w,faction,entries,Date.now(),owner).catch(archiveFailure);
    }
  }
  function observedFlights(roster,premium,end){
    const flights=(premium?.departures||[]).filter(t=>t<=end)
      .map(t=>({at:t,country:premium.destinations?.[t]||'Unknown',dated:true}));
    if(!roster?.lastCheck&&!flights.length&&!premium?.historyAt)return null;
    for(const leg of roster?.legs||[]){
      if(leg.first>end)continue;
      // Match one dated departure to the nearest compatible roster observation.
      let match=null;
      for(const f of flights){
        if(!f.dated||f.matched||f.at<=leg.after||f.at>leg.last||
          (f.country!=='Unknown'&&leg.country!=='Unknown'&&f.country!==leg.country))continue;
        if(!match||Math.abs(f.at-leg.first)<Math.abs(match.at-leg.first))match=f;
      }
      if(match){
        match.matched=true;
        if(match.country==='Unknown')match.country=leg.country;
      }else if(leg.after)flights.push({at:leg.first,after:leg.after,country:leg.country,dated:false});
    }
    return flights.sort((a,b)=>b.at-a.at);
  }
  function effortWindow(id=state.data.war?.id){
    const w=warAttackWindow(id);
    if(w?.active&&!activeWarNow()){
      w.end=Math.min(w.end,state.data.war?.observed||state.data.updated.wars||0);w.stale=true;
    }
    return w?.start&&w.end>=w.start&&w.ourId&&w.enemyId?w:null;
  }
  function effortScanCovered(w){
    const scan=concessionRecord(w.id);
    return combatArchive.ready&&!combatArchive.error&&scan?.effortArchived&&scan.complete&&!scan.error&&
      (w.active?w.end-scan.caughtUpAt<2*MIN:scan.cursor*1000>=w.end);
  }
  function factionEnergyLine(w){
    if(!w)return '';
    const index=effortAttacks(w);
    const energy=id=>effortEnergyLabel(index.factionAttempts.get(id)??
      (id===w.ourId&&effortScanCovered(w)&&!index.unattributed.has(id)?0:null));
    return 'Recorded attack energy: Us '+energy(w.ourId)+' / Them '+energy(w.enemyId);
  }
  function effortFor(w,faction,id){
    const indexed=effortAttacks(w),counts=indexed.members.get(faction+'/'+id);
    const covered=effortScanCovered(w)&&!indexed.unattributed.has(faction);
    const own=faction===w.ourId,classified=!counts?.unknown;
    const war=counts?.war||((covered&&classified)?0:null);
    const knownNonWar=own&&covered&&classified&&!counts?.unknownNonWar;
    const outside=counts?.outside||(knownNonWar?0:null);
    const friendly=counts?.friendly||(knownNonWar?0:null);
    const roster=combatArchive.hours.get(flightStoreKey(w,faction,id));
    const owner=positive(state.data.meta.ownerId);
    const premium=owner&&scouterPremiumActive()?combatArchive.hours.get(flightStoreKey(w,faction,id,owner)):null;
    const total=counts?.total??(war===0&&outside===0&&friendly===0?0:null);
    const warShare=total&&classified?100*counts.war/total:null;
    const pointsPer100=total&&Number.isFinite(counts.points)?100*counts.points/(total*25):null;
    const log=observedFlights(roster,premium,w.end);
    return {war,outside,friendly,total,unknown:(counts?.unknown||0)+(counts?.unknownNonWar||0),warShare,pointsPer100,flights:log?.length??null,log};
  }
  const effortCostLabel=count=>count===null?'\u2014':fmt(count)+' / ~'+fmt(count*25)+' E';
  const effortEnergyLabel=count=>count===null?'\u2014':'~'+fmt(count*25)+' E';
  const effortFlightLabel=count=>count===null?'\u2014':fmt(count)+' seen';
  const effortShareLabel=e=>e.warShare===null?'\u2014':fmt(e.warShare)+'%';
  const effortRateLabel=e=>e.pointsPer100===null?'\u2014':warPoints(e.pointsPer100);
  function flightDisclosure(e,key){
    const entries=e.log?.map(f=>{
      const time=f.dated?'Takeoff '+stamp(f.at)+' (FFScouter)':
        'Departed between '+stamp(f.after)+' and '+stamp(f.at)+' (Torn roster)';
      return '<li><b>'+esc(f.country==='Unknown'?'Destination unknown':'To '+f.country)+'</b><br>'+esc(time)+'</li>';
    }).join('');
    return '<details class="ws-flight-log" data-ws-disclosure="flight-'+key+'"><summary aria-label="Flights, '+(e.flights??'unknown')+
      ' recorded. Show destinations and departures"><small>Flights</small><b>'+effortFlightLabel(e.flights)+'</b></summary>'+
      (entries?'<ul>'+entries+'</ul>':'<p>'+(e.flights===null?'Flight records unavailable.':'No wartime departures recorded.')+'</p>')+'</details>';
  }
  function effortFields(e,field,key){
    return field('War hits / E',effortCostLabel(e.war))+field('Outside hits / E',effortCostLabel(e.outside))+
      field('Own-member hits / E',effortCostLabel(e.friendly))+
      (e.unknown?field('Unclassified / E',effortCostLabel(e.unknown)):'')+flightDisclosure(e,key)+
      field('Total attack E',effortEnergyLabel(e.total))+field('Recorded war E %',effortShareLabel(e))+
      field('Pts / 100 E',effortRateLabel(e));
  }
  const effortGuide='Energy uses 25 E per recorded outgoing attempt, including losses and stalemates. Own-member E covers hits on the same faction. Outside E covers other identified targets. War E % is the share of recorded attack energy spent on war targets. Pts / 100 E divides captured ranked points by all recorded attack energy, including non-war hits. Enemy attacks on third parties are usually outside our feed. Tap Flights for destinations and departure times in TCT. A dash means the figure is unavailable.';
  function hourlyEffort(w,hours){
    const cell=(bucket,hour,faction)=>{
      if(!bucket)return '<td aria-label="No attacks recorded">&#8212;</td>';
      const split=[['War',bucket.war],['Outside',bucket.outside],['Own-member',bucket.friendly],['Unclassified',bucket.unknown]]
        .filter(([,count])=>count).map(([label,count])=>label+' '+effortEnergyLabel(count)).join('<br>');
      return '<td><details data-ws-disclosure="hourly-'+w.id+'-'+hour+'-'+faction+'"><summary>'+effortEnergyLabel(bucket.total)+'</summary>'+split+'</details></td>';
    };
    const rows=[...hours.keys()].sort((a,b)=>b-a).map(hour=>{
      const factions=hours.get(hour);
      return '<tr><th scope="row">'+esc(stamp(hour))+'</th>'+cell(factions.get(w.ourId),hour,w.ourId)+cell(factions.get(w.enemyId),hour,w.enemyId)+'</tr>';
    });
    return '<details class="ws-hourly-effort" data-ws-disclosure="hourly-effort-'+w.id+'"><summary>Hourly attack energy (TCT)</summary>'+
      (rows.length?'<p>Recorded attacks by start hour. Tap a total for the split. A dash means no attacks were recorded for that side in that hour.</p>'+
        '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Hour starting</th><th>Our E</th><th>Enemy E</th></tr></thead><tbody>'+
        rows.join('')+'</tbody></table></div>':'<p>No wartime attacks recorded yet.</p>')+'</details>';
  }
  function effortReport(w){
    if(!w)return '';
    const index=effortAttacks(w);
    const groups=[['Our faction',w.ourId,'ours'],['Opponents',w.enemyId,'enemies']];
    return card('Attack energy and flights', '<p>'+effortGuide+' '+a('FFScouter data policy','https://ffscouter.com/#data-policy')+'</p>'+
      hourlyEffort(w,index.hours)+groups.map(([title,faction,side])=>{
        const timeline=state.data.warTimelines[w.id]?.sides?.[side]?.players||{};
        const members=new Map();
        for(const r of combatArchive.hours.values()){
          if(r.source==='war-flights'&&r.war===w.id&&r.faction===faction)members.set(r.player,{id:r.player,name:combatArchive.people.get(r.player)?.name});
        }
        for(const p of [...index.members.values()].filter(p=>p.side===faction))members.set(p.id,p);
        for(const p of [...Object.values(timeline),...(state.data.reports[w.id]?.factions?.find(f=>f.id===faction)?.members||[]),
          ...(w.active&&(side==='ours'||cfg.enemyId===w.enemyId)?state.data[side]:[])])members.set(p.id,p);
        const rows=[...members.values()].map(p=>({id:p.id,name:p.name||'#'+p.id,...effortFor(w,faction,p.id)}))
          .sort((a,b)=>(b.war??-1)-(a.war??-1)||a.name.localeCompare(b.name));
        return '<details data-ws-disclosure="effort-'+w.id+'-'+side+'"><summary>'+title+' ('+rows.length+')</summary>'+
          (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Player</th><th>War hits / E</th><th>Outside hits / E</th><th>Own-member hits / E</th><th>Total E</th><th>War E %</th><th>Pts / 100 E</th><th>Flights</th></tr></thead><tbody>'+
          rows.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+effortCostLabel(r.war)+'</td><td>'+effortCostLabel(r.outside)+'</td><td>'+effortCostLabel(r.friendly)+'</td><td>'+
            effortEnergyLabel(r.total)+
            (r.unknown?'<br><small>Unclassified '+effortCostLabel(r.unknown)+'</small>':'')+'</td><td>'+effortShareLabel(r)+'</td><td>'+effortRateLabel(r)+'</td><td>'+flightDisclosure(r,[w.id,faction,r.id].join('-'))+'</td></tr>').join('')+'</tbody></table></div>':empty('No players recorded for this faction.'))+'</details>';
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
      const legs=[body.current,...body.recent_flights].filter(Boolean)
        .map(t=>({takeoff:ffTimestamp(t.takeoff_time),description:t.status_description}));
      await storePremiumFlights(w,next.faction,[{id:next.id,legs}],at,owner,true);
      if(state.open&&['enemy','ledger'].includes(state.tab))render();
    }catch(e){
      q.next=Date.now()+Math.max(60,Number(e.retryAfter)||0)*1000;
    }finally{q.busy=false;q.next=Math.max(q.next,Date.now()+5000);}
  }
