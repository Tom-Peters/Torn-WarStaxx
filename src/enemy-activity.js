  // Aggregates from Premium have no identities. Attribute names only to a
  // scoped roster observation or an identified attacker in a captured record.
  let selectedEnemyHour=null,selectedEnemyFaction=0;
  function enemyHours({faction,ourFaction,owner,players,observations,fights,legacy={},premium,at}){
    const hours=Array.from({length:24},()=>({online:new Map(),localCount:0,localOnline:0,localDates:new Set(),lastActions:[],attackers:new Map(),attacks:0,againstUs:0,
      scannerPartial:false,scannerTotal:0,scannerDates:0,scannerLatest:0,scannerScore:0,scoreDates:0}));
    if(!faction)return hours;
    const scoped=new Set(),current=new Set(players.map(p=>p.id)),cutoff=Math.floor(at/(24*HOUR))*24*HOUR-13*24*HOUR;
    for(const r of observations){
      if(r.faction!==faction||r.hour<cutoff||r.hour>at)continue;
      const h=hours[new Date(r.hour).getUTCHours()];
      if(r.source==='roster'&&current.has(r.player)){
        scoped.add(r.player+'/'+r.hour);
        const known=r.samples-r.unknown;
        if(known>0&&r.online>=0&&r.online<=known){
          h.localCount+=known;h.localOnline+=r.online;h.localDates.add(r.hour);
        }
        if(r.online>0)h.online.set(r.player,(h.online.get(r.player)||0)+r.online);
      }else if(premium&&owner&&r.owner===owner&&r.source==='scanner'&&r.player===0){
        if(r.partial)h.scannerPartial=true;
        if(Number.isFinite(r.active)&&r.active>=0){h.scannerTotal+=r.active;h.scannerDates++;}
        if(Number.isFinite(r.score)&&r.score>=0){h.scannerScore+=r.score;h.scoreDates++;}
        h.scannerLatest=Math.max(h.scannerLatest,r.hour);
      }
    }
    // Older installations stored enemy-side hourly records by player ID.
    // Include members of the current roster once per hour across both stores.
    for(const p of players){
      if(Number.isFinite(p.lastAt)&&p.lastAt>=cutoff&&p.lastAt<=at)
        hours[new Date(p.lastAt).getUTCHours()].lastActions.push(p);
      for(const [bucket,sample] of Object.entries(legacy['enemies:'+p.id]?.hours||{})){
        const time=Number(bucket)*HOUR;
        if(!Number.isSafeInteger(time)||time<cutoff||time>at||!Number.isFinite(sample?.online)||sample.online<0||scoped.has(p.id+'/'+time))continue;
        const h=hours[new Date(time).getUTCHours()];
        if(sample.count>0&&sample.online<=sample.count){
          h.localCount+=sample.count;h.localOnline+=sample.online;h.localDates.add(time);
        }
        if(sample.online>0)h.online.set(p.id,(h.online.get(p.id)||0)+sample.online);
      }
    }
    for(const r of fights){
      if(r.attackerFaction!==faction||r.at<cutoff||r.at>at)continue;
      const h=hours[new Date(r.at).getUTCHours()];h.attacks++;
      if(ourFaction&&r.defenderFaction===ourFaction)h.againstUs++;
      if(current.has(r.attacker))h.attackers.set(r.attacker,(h.attackers.get(r.attacker)||0)+1);
    }
    return hours;
  }
  function enemyScannerLabel(h){
    if(h.scannerDates)return fmt(Math.round(h.scannerTotal/h.scannerDates*10)/10)+' avg seen';
    if(h.scoreDates)return fmt(Math.round(h.scannerScore/h.scoreDates*10)/10)+' avg score';
    return '';
  }
  function enemyActivityRange(hours){
    const select=(qualified,measure)=>hours.map((h,i)=>({hour:i,value:qualified(h)?measure(h):null}))
      .filter(r=>r.value!==null).sort((a,b)=>a.value-b.value||a.hour-b.hour);
    let sampled=select(h=>!h.scannerPartial&&h.scannerDates>=2,h=>h.scannerTotal/h.scannerDates);
    let units=' members seen by Premium';
    if(sampled.length<2){
      sampled=select(h=>h.localDates.size>=2&&h.localCount>0,h=>100*h.localOnline/h.localCount);
      units='% of enemy roster checks online';
    }
    if(sampled.length<2)return '';
    const low=sampled[0],high=sampled.at(-1),rounded=v=>Math.round(v*10)/10;
    if(rounded(low.value)===rounded(high.value))return '';
    const show=x=>String(x.hour).padStart(2,'0')+':00 ('+rounded(x.value)+units+')';
    return 'Highest observed: '+show(high)+'. Lowest observed: '+show(low)+'. Compared '+sampled.length+' TCT hours with at least two sampled dates each.';
  }
  function hourMemberLinks(counts){
    return [...counts].sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,5)
      .map(([id,count])=>infoButton(playerName(id),id)+' ('+count+')').join(' ');
  }
  function enemyHourDetail(hour,h){
    const scanner=enemyScannerLabel(h);
    let body='<p><b>'+String(hour).padStart(2,'0')+':00-'+String(hour).padStart(2,'0')+':59 TCT</b> over the last 14 UTC dates.</p>';
    if(scanner)body+='<p>FFScouter: '+scanner+' over '+(h.scannerDates||h.scoreDates)+' sampled date(s). '+(h.scannerPartial?'Provider returned partial history. ':'')+'Latest bucket '+esc(stamp(h.scannerLatest))+'.</p>';
    if(h.online.size)body+='<p>Current members observed online (checks): '+hourMemberLinks(h.online)+'</p>';
    if(h.lastActions.length){
      const recent=[...h.lastActions].sort((a,b)=>b.lastAt-a.lastAt);
      body+='<p>Torn last actions in this hour: '+recent.slice(0,5).map(p=>infoButton(p.name,p.id)+' '+esc(stamp(p.lastAt))).join(' / ')+'</p>';
    }
    if(h.attacks)body+='<p>'+h.attacks+' captured enemy attack(s), '+h.againstUs+' against our faction.'+
      (h.attackers.size?' Identified current members: '+hourMemberLinks(h.attackers):'')+'</p>';
    if(!h.online.size&&!h.lastActions.length&&!h.attackers.size)body+='<p>No named enemy activity recorded for this hour.</p>';
    return body;
  }
  function enemyActivityBrief(at){
    const players=state.data.enemies||[];
    if(!players.length)return empty('Enemy roster unavailable. Refresh to load the scheduled or current opponent.');
    const name=p=>infoButton(p.name,p.id),fresh=rosterFresh('enemies',at);
    const names=list=>list.slice(0,4).map(name).join(' ');
    const lines=[],online=players.filter(isOnline);
    if(fresh&&online.length)lines.push('Online at last check: '+names(online)+(online.length>4?' +'+(online.length-4)+' more':''));
    if(!fresh||!online.length){
      const recent=players.filter(p=>p.lastAt>0&&p.lastAt<=at).sort((a,b)=>b.lastAt-a.lastAt).slice(0,3);
      if(recent.length)lines.push('Latest Torn actions: '+recent.map(p=>name(p)+' '+esc(age(p.lastAt))).join(' / '));
    }
    const strong=players.map(p=>({p,bse:reliableBse(p)})).filter(x=>x.bse.value)
      .sort((a,b)=>b.bse.value-a.bse.value).slice(0,2);
    if(strong.length)lines.push('Highest known FFScouter estimates: '+strong.map(x=>name(x.p)+' ~'+esc(nativeCompactTotal(x.bse.value))+' BSE ('+esc(age(x.bse.at))+')').join(' / '));
    const currentWar=state.data.war;
    if(currentWar?.opponentId===cfg.enemyId&&activeWarNow()){
      const impact=concessionSnapshot(currentWar.id,at);
      const leaders=players.map(p=>({p,scored:impact?.enemyAttackers?.[p.id]?.enemyScore}))
        .filter(x=>Number.isFinite(x.scored)&&x.scored>0).sort((a,b)=>b.scored-a.scored).slice(0,3);
      if(leaders.length)lines.push('Scoring against us this war: '+leaders.map(x=>name(x.p)+' '+(impact.complete?'':'at least ')+fmt(x.scored)+' captured respect').join(' / ')+
        ' ('+esc(age(impact.lastFetch))+')');
    }
    const last=state.data.enemyWars.filter(w=>w.end&&state.data.reports[w.id]?.factions?.some(f=>f.id===cfg.enemyId&&f.members?.length))
      .sort((a,b)=>b.end-a.end)[0];
    const report=last&&state.data.reports[last.id].factions.find(f=>f.id===cfg.enemyId);
    if(report){
      const current=new Map(players.map(p=>[p.id,p]));
      const scorers=(report.members||[]).filter(m=>current.has(m.id)&&Number.isFinite(m.score)&&m.score>0)
        .sort((a,b)=>b.score-a.score).slice(0,3);
      if(scorers.length)lines.push(b('Latest stored scorecard #'+last.id,'war:'+last.id)+' top returning scorers: '+
        scorers.map(m=>name(current.get(m.id))+' '+fmt(m.score)+' pts').join(' / '));
    }
    if(fresh){
      const movements=players.map(p=>({p,place:currentLocation(p,at)}))
        .filter(x=>['inbound','abroad'].includes(x.place.phase)&&x.place.country!=='Unknown')
        .sort((a,b)=>(a.place.eta||Infinity)-(b.place.eta||Infinity)).slice(0,3);
      if(movements.length)lines.push('Travel: '+movements.map(({p,place})=>name(p)+' '+(place.phase==='inbound'?'to ':'in ')+esc(place.country)+
        (place.phase==='inbound'&&place.eta>at?' ~'+esc(flightClock(place.eta))+' TCT':'')).join(' / '));
      const release=players.filter(p=>memberState(p)==='hospital'&&p.until>at).sort((a,b)=>a.until-b.until)[0];
      if(release)lines.push('Next hospital exit: '+name(release)+' ~'+esc(flightClock(release.until))+' TCT');
    }
    return (lines.length?lines.map(line=>'<p>'+line+'</p>').join(''):empty('No named online, strength, travel or scoring evidence available yet.'))+
      '<small>Enemy roster: '+players.length+' members / '+esc(age(state.data.updated.enemies))+'.</small>';
  }

  function latestPersonalEncounter(player){
    const me=positive(state.data.meta.ownerId);
    if(!me)return '';
    const latest=pairRows(me,player.id).filter(x=>x.result&&x.at<=Date.now())
      .reduce((last,row)=>!last||row.at>last.at?row:last,null);
    return latest?'<p class="ws-small">'+esc((latest.attacker===me?'Your attack':'Their attack on you')+' / '+latest.result+' / '+stamp(latest.at))+'</p>':'';
  }
