  function activityScreen(){
    const player=activityPrefs.player,choices=[...state.data.ours,...state.data.enemies].map(p=>[p.id,p.name]);
    if(player&&!choices.some(x=>x[0]===player))choices.push([player,playerName(player)]);
    const opts=activityPrefs;
    let html=card('Activity / TCT',commandOption('days',choiceItems([3,7,14,30]),opts.days,'Days')+
      commandOption('period',[['all','All observations'],['war','Wartime'],['peace','Peacetime']],opts.period,'Period')+
      commandOption('source',[['roster','Confirmed online samples'],['recent','Last action within 15m'],['scanner','Premium scanner score'],['attack','Recorded attacking hits']],opts.source,'Evidence')+
      commandOption('player',[[0,'All members'],...choices],player,'Player')+b('Apply filters','cmd-filters')+b('Export CSV','cmd-csv')+
      b('Refresh Premium history','cmd-scanner')+'<p>Percentages describe sampled statuses. A scanner score counts provider observations. '+esc(scannerError)+'</p>');
    for(const [f,title] of [[cfg.ourId,'Our faction'],[cfg.enemyId,'Enemy faction']])if(f)html+=gridTable(f,title,opts);
    return html+forecastCard()+foldCommand('old-activity','Observation summaries',activity());
  }
  function forecastCard(){
    const {windows,context:c}=forecastReport();
    return card('Attack-window forecasts',windows.map(w=>'<p><b>'+w.minutes+' minutes</b> / '+(w.start?esc(stamp(w.start)+' to '+stamp(w.end)+' / '+w.confidence+' / at least '+w.coverage+' sampled dates per hour / '+w.release+' releases / '+w.arrivals+' incoming'):esc(w.confidence))+'</p>').join('')+
      '<p>'+esc(commandPosture()+' / '+c.covered+' planned assignments / '+c.heavy+' heavy targets / '+c.activeHeavy+' heavy opponents seen online')+'</p><p>Current hitters: '+esc(c.hitters.slice(0,8).map(p=>p.name).join(', ')||'Unknown')+
      '. Current target opportunities: '+esc(c.targets.slice(0,8).map(p=>p.name).join(', ')||'None verified')+'. Landing times, energy and future availability can change.</p>');
  }
  let medicalSupplies=null,medicalAttempt=0,lastTravelMethod='';
  async function checkSupplies(){
    if(!effectiveKey()||document.hidden||Date.now()-medicalAttempt<15*MIN)return;
    medicalAttempt=Date.now();
    try{
      const body=await call('/user/inventory?cat=Medical&limit=250','cmd-medical',15*MIN),items=body?.inventory?.items;
      if(!Array.isArray(items))return;
      const travel=await call('/user/travel','cmd-travel-method',15*MIN).catch(()=>null);
      if(flyMethods.includes(travel?.travel?.method))lastTravelMethod=travel.travel.method;
      medicalSupplies={owner:positive(state.data.meta.ownerId),at:epochMs(body.inventory.timestamp),bags:items.filter(i=>/blood bag/i.test(i.name)&&i.amount>0).map(i=>i.name).slice(0,12),ipecac:items.filter(x=>x.name==='Ipecac Syrup').reduce((s,x)=>s+x.amount,0),partial:items.length>=250};
    }catch{medicalSupplies=null;}if(state.open)render();
  }
  function flightScreen(){
    const me=state.data.ours.find(p=>p.id===state.data.meta.ownerId),available=me?hitterReadiness(me):null;
    const self=me&&protectionPriorities().find(x=>x.player.id===me.id&&x.exposed&&x.feedFresh&&x.impact.underFire);
    const routes=travelPlan(),safe=routes.filter(r=>r.safe),offense=routes.filter(r=>r.offensive),local=me?currentLocation(me):null;
    const med=medicalSupplies?.owner===me?.id&&medicalSupplies&&Date.now()-medicalSupplies.at<=20*MIN?medicalSupplies:null;
    const duty=commandRoom()?.plan.duties[me?.id],assigned=Object.values(commandRoom()?.plan.assignments||{}).some(a=>a.primary===me?.id);
    const decision=!me||!rosterFresh('ours')?'Refresh your own status before planning protection.':
      memberState(me)==='hospital'?'Already in hospital. Review discharge time and revive settings.':
      assigned||duty?.duty==='strike'?'Coordinate cover for your attacking duty before leaving.':
      !self?'No fresh repeat-hit evidence for personal protection. Review the route comparison if leadership requests cover.':
      local?.country!=='Torn'?'You are away from Torn. Check local exposure and your return journey.':
      safe.length?'Consider flying to '+safe[0].country+' for approximately '+safe[0].min+' minutes each way. Check enemy locations again before departure.':
      med?.ipecac>0&&available?.medicalLeft===0?'Consider Ipecac in Items. Check your next duty and revive setting before use.':
      'Review self-hospitalisation manually. No defensive flight currently passes the evidence checks.';
    const display=r=>foldCommand('flight-'+r.country,r.country+' / '+(r.min===r.max?r.min:r.min+'-'+r.max)+'m / '+r.here.length+' present / '+r.incoming.length+' inbound',
      '<p>'+esc(r.risk)+' / '+Math.round(r.coverage*100)+'% roster locations observed. '+r.before+' inbound could arrive before you. '+
      esc(r.favourable.length?'Proven opponents: '+r.favourable.map(e=>e.name).join(', '):'No proven overseas target.')+'</p><p>Approximate return '+r.min+'-'+r.max+'m with the same configuration. Standard fare $'+fmt(r.cost)+'. Verify travel slots, equipment and ticket requirements in Torn.</p>');
    return card('Personal protection',esc(decision)+'<p>Medical cooldown: '+esc(available?.medicalLeft==null?'unknown':available.medicalLeft+'m')+
      ' / Ipecac: '+esc(med?(med.partial?'at least ':'')+med.ipecac:'unknown')+' / revives: '+esc(me?.reviveSetting||'Unknown')+
      '. '+esc(med?.bags.length?'Bags recorded: '+med.bags.join(', ')+'. Check your blood type in Torn before considering an incompatible bag. ':'')+'Ipecac typically gives 60-90 minutes in hospital and adds 30 minutes to medical cooldown.</p>'+
      b('Check medical inventory','cmd-medical')+b('Review Items','fast-turtle'))+
      card('Flight configuration',commandOption('method',[['','Show method scenarios'],...choiceItems(flyMethods)],cfg.flightMethod||'','Next flight')+
      commandOption('book',[['unknown','Unknown'],['no','Inactive'],['yes','Active']],cfg.flightBook||'unknown','Mailing Yourself Abroad')+
      b('Compare routes','cmd-flight')+(lastTravelMethod?'<p>Last method reported by Torn: '+esc(lastTravelMethod)+'. Select the method for your next departure.</p>':'')+'<p>Published flight estimates vary by about 3%. Eligibility uses the estimated one-way time. Equipment occupies travel slots. Recheck the weekly overseas rules before attacking.</p>'+
      '<a class="ws-btn" href="https://www.torn.com/travelagency.php">Open travel agency</a>')+
      card('Safest destinations',safe.map(display).join('')||empty('No route meets the current configuration and coverage checks.'))+
      card('Offensive opportunities',offense.map(display).join('')||empty('No proven overseas opportunity with sufficient coverage.'))+
      foldCommand('all-routes','All '+routes.length+' route assessments',routes.map(display).join(''));
  }
  function briefScreen(){
    const w=state.data.war;if(!w)return empty('No confirmed scheduled or active war.');
    const plans=suggestedAssignments(),room=commandRoom(),rules=localWarRules(),score=warScore();
    const risks=protectionPriorities().filter(x=>x.exposed&&x.feedFresh);
    const losses=risks.map(z=>'<p>'+esc(z.player.name)+' / '+z.impact.in30+' incoming in 30m / '+fmt(z.impact.given)+' captured respect conceded / '+fmt(z.impact.earned)+' earned / '+(z.impact.underFire?'repeat pressure':'monitor')+'</p>').join('');
    const roll=room?.ops.roll||{},member=room?.actor.id;
    return card(preparingWar()?'Opening plan':'Tactical briefing',esc(w.opponentName+' / '+commandPosture())+'<p>'+esc(stamp(epochMs(w.start)))+
      ' / score '+(score?fmt(score.our)+' - '+fmt(score.enemy):'unknown')+' / official target '+fmt(w.target||null)+'</p>'+
      '<p>'+plans.length+' heavy targets / '+plans.filter(x=>!x.primary).length+' need matchup evidence. '+state.data.ours.filter(p=>!roll[p.id]).length+' members have no roll-call response.</p>'+
      b('Allocate hitters','tab:squad')+b('Regular matchups','tab:matchups')+b('Review opponent history','tab:scouting'))+
      card('Voluntary roll call',Object.entries(roll).map(([i,x])=>'<p>'+esc(playerName(Number(i))+' / '+x.choice+(x.from?' / '+stamp(x.from):'')+(x.until?' to '+stamp(x.until):''))+'</p>').join('')+
      (member?commandOption('roll',choiceItems(['at start','later','unavailable']),roll[member]?.choice,'My availability')+
        '<label>From (UTC)<input type="datetime-local" id="ws-cmd-from"></label><label>Until (UTC)<input type="datetime-local" id="ws-cmd-until"></label>'+b('Submit my availability','cmd-roll'):
        '<p>A member-bound credential is required to respond.</p>'))+
      openingEvidence()+forecastCard()+card('Defensive priorities',losses||empty('No fresh, captured scoring losses and exposure to report.'))+
      foldCommand('rules','Weekly war rules', '<p>Torn reports a target and scores. Enter any additional conditions shown on this war\'s enlistment panel.</p>'+
      '<label>Winning condition<input maxlength="100" id="ws-cmd-condition" value="'+esc(rules.condition||'')+'"></label>'+
      '<label>Threshold reduction per hour (%)<input type="number" min="0" max="100" id="ws-cmd-decay" value="'+esc(rules.decay??'')+'"></label>'+
      '<label>Overseas score multiplier<input type="number" min="0" max="100" step=".01" id="ws-cmd-overseas" value="'+esc(rules.overseas??'')+'"></label>'+
      '<label>Chain conditions<input maxlength="100" id="ws-cmd-chain" value="'+esc(rules.chain||'')+'"></label>'+
      b('Save local war rules','cmd-rules')+'<p>'+esc(rules.at?'Manual rules updated '+stamp(rules.at):'Template modifiers unknown')+'</p>');
  }
  function archiveScreen(){
    return card('Local combat intelligence',combatArchive.fights.size+' unique attacks / '+combatArchive.people.size+' player identities. '+esc(combatArchive.error)+
      '<p>Exports contain private local combat records. Store them privately. Import merges records by attack ID.</p>'+
      b('Export private backup','cmd-export')+'<label>Import backup<input type="file" id="ws-cmd-import" accept=".json,application/json"></label>'+b('Merge backup','cmd-import')+
      b('Read older personal attacks','cmd-history')+'<p>'+esc(state.data.meta.historyMessage||'Older history loads one page per request.')+'</p>')+
      foldCommand('archived-players','Find a returning opponent',commandOption('archive-player',[...combatArchive.people.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(p=>[p.id,p.name+' #'+p.id]),0,'Player')+b('Open dossier','cmd-dossier'));
  }
  function playerArchiveCard(p){
    const me=state.data.meta.ownerId,history=pairRows(me,p.id),person=combatArchive.people.get(p.id);
    const ev=commandMatch({id:me},p),counts=x=>x.wins+' wins / '+x.losses+' losses / '+x.stalemates+' stalemates';
    return card('Your matchup',esc(ev.category)+'<p>You attacked: '+counts(ev.offense)+'<br>You defended: '+counts(ev.defense)+'</p><p>Most recent '+esc(stamp(ev.last))+' / '+history.length+' captured encounters. Current buffs can change a matchup.</p>'+
      (person?'<p>Observed memberships: '+esc(person.memberships.map(m=>'#'+m.faction+' ('+stamp(m.first)+' to '+stamp(m.last)+')').join(', '))+'</p>':'')+
      b('Player activity grid','cmd-player:'+p.id));
  }
  async function olderPersonal(){
    if(document.hidden||!effectiveKey()||!idKey(state.data.meta.ownerId))return;
    const owner=state.data.meta.ownerId,meta=state.data.meta,cursors=meta.commandCursors||(meta.commandCursors={});
    if(cursors[owner]===0){meta.historyMessage='Reached the end of the accessible personal feed.';return;}
    const before=cursors[owner]||Math.floor(Date.now()/1000),body=await call('/user/attacks?sort=DESC&limit=100&to='+before,'command-backfill',MIN);
    if(!body||state.data.meta.ownerId!==owner)return;
    const rows=attacks(body);await keepFights(rows,'Torn personal');
    const oldest=Math.min(...(body.attacks||[]).map(a=>a.ended).filter(Number.isFinite));
    if(body.attacks?.length<100)cursors[owner]=0;
    else if(oldest<before)cursors[owner]=oldest;
    meta.historyMessage=body.attacks?.length===100&&oldest>=before?'Overlapping timestamp page could not advance. Coverage remains partial.':rows.length+' identifiable records checked.';save();
  }
  async function commandAction(action){
    const [kind,value]=action.split(':'),target=Number(value),ids=v=>String(v||'').split(',').filter(x=>x.trim()).map(Number);
    try{
      if(kind==='sync')await syncCommand();
      else if(['claim','release','lock','unlock'].includes(kind))await syncCommand({type:kind,target,reason:cmdValue('reason-'+target)||''});
      else if(kind==='assign')await syncCommand({type:'assign',target,primary:Number(cmdValue('primary-'+target)),backups:ids(cmdValue('backups-'+target)),priority:Number(cmdValue('priority-'+target))});
      else if(kind==='policy')await syncCommand({type:'policy',metric:cmdValue('metric'),holdMinutes:Number(cmdValue('hold')),manual:ids(cmdValue('manual'))});
      else if(kind==='duty')await syncCommand({type:'duty',duty:cmdValue('duty'),hitter:Number(cmdValue('duty-hitter')),target:Number(cmdValue('duty-target'))});
      else if(kind==='roll'){
        const utc=k=>cmdValue(k)?Date.parse(cmdValue(k)+'Z'):null;
        await syncCommand({type:'roll',choice:cmdValue('roll'),from:utc('from'),until:utc('until')});
      }else if(kind==='scanner')await loadFactionScanner();
      else if(kind==='filters'){Object.assign(activityPrefs,{days:Number(cmdValue('days')),period:cmdValue('period'),source:cmdValue('source'),player:Number(cmdValue('player'))});if(activityPrefs.source==='scanner'&&activityPrefs.player)await scouterRead('activity',activityPrefs.player);}
      else if(kind==='player'){activityPrefs.player=target;navigate('heatmap');}
      else if(kind==='csv'){
        const csv=['faction,player,hour_utc,source,sum,denominator,observed_players,roster_size,unknown_observations,last_observation_utc'];
        for(const f of [cfg.ourId,cfg.enemyId].filter(idKey))for(const [hour,c] of activityCells(f))
          csv.push([f,activityPrefs.player||'',new Date(hour).toISOString(),activityPrefs.source,c.sum,c.count,c.players.size||'',c.roster||'',c.missing,new Date(c.at).toISOString()].join(','));
        fileDownload('warstaxx-activity.csv','text/csv',csv.join('\r\n'));
      }else if(kind==='flight'){cfg.flightMethod=cmdValue('method');cfg.flightBook=cmdValue('book');saveCfg();}
      else if(kind==='medical')await checkSupplies();
      else if(kind==='rules'){
        const num=k=>cmdValue(k)===''?null:Number(cmdValue(k)),decay=num('decay'),overseas=num('overseas');
        if([decay,overseas].some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>100)))throw Error('Use a number from 0 to 100 or leave the field empty.');
        (cfg.commandRules||={})[state.data.war.id]={condition:cmdValue('condition'),chain:cmdValue('chain'),overseas,decay,at:Date.now()};saveCfg();
      }else if(kind==='history')await olderPersonal();
      else if(kind==='export'){await archiveReady;if(!combatArchive.ready)throw Error('Archive unavailable.');
        fileDownload('warstaxx-combat.json','application/json',JSON.stringify({schema:1,exportedAt:Date.now(),fights:await readArchiveStore('fights'),people:await readArchiveStore('people')}));}
      else if(kind==='import'){
        const file=$('#ws-cmd-import',root)?.files?.[0];if(!file||file.size>32*1024*1024)throw Error('Choose a combat backup under 32 MiB.');
        const data=JSON.parse(await file.text());
        if(data.schema!==1||!Array.isArray(data.fights)||data.fights.length>40000||!data.fights.every(r=>cleanFight(r)&&(!r.sources||Array.isArray(r.sources))))throw Error('Invalid combat backup.');
        await archiveReady;if(!combatArchive.ready)throw Error('Local archive unavailable.');
        await keepFights(data.fights,'Local import');
        await importPeople(data.people||[]);
      }else if(kind==='dossier'){const id=Number(cmdValue('archive-player'));if(id)handle('player:'+id);}
      render();
    }catch(e){state.error='WarStaxx: '+String(e.message||'Request failed').slice(0,160);render();}
  }
  function playerActivityDetail(p){
    const places=new Map(),weekday=Array(7).fill(0);
    let recent=0,away=0,samples=0;
    for(const r of combatArchive.hours.values())if(r.player===p.id&&r.source==='roster'){
      recent=Math.max(recent,r.at);samples+=r.samples;away+=r.away;
      if(r.country&&r.country!=='Unknown')places.set(r.country,(places.get(r.country)||0)+1);
    }
    for(const row of combatArchive.fights.values())if(row.attacker===p.id)weekday[new Date(row.at).getUTCDay()]++;
    const visits=[...places.entries()].sort((a,b)=>b[1]-a[1]).map(([c,h])=>c+' ('+h+' sampled hours)').join(', ');
    return foldCommand('player-patterns-'+p.id,'Activity, travel and attack timing','<p>'+samples+' roster samples / '+away+' away observations / last '+esc(stamp(recent))+
      '.</p><p>'+esc(visits||'No reliable country observations')+'</p><p>Captured attacks by UTC weekday: '+weekday.map((n,i)=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]+' '+n).join(', ')+'.</p>'+
      b('Hourly activity and weekday averages','cmd-player:'+p.id));
  }
  function openingEvidence(){
    const sides=[['ours','Our faction'],['enemies','Opponent']];
    return foldCommand('opening-evidence','Previous wars and opening threats',sides.map(([side,label])=>{
      const m=factionWarMetrics(side);
      const seen=state.data[side].map(p=>({p,pat:pattern(side,p.id)})).filter(x=>x.pat.count>=3).sort((a,b)=>b.pat.travel-a.pat.travel);
      const top=side==='enemies'?[...enemyRoleBands().heavy].slice(0,5).map(playerName):state.data.ours.filter(p=>cfg.blackSkulls[p.id]).map(p=>p.name);
      return '<p><b>'+label+'</b> / '+m.wars+' previous wars / '+m.wins+' recorded wins / mean score '+fmt(m.scoreAvg)+'.</p><p>'+esc(top.join(', ')||'Heavy roster unknown')+
        '</p><p>Most often observed away: '+esc(seen.slice(0,3).map(x=>x.p.name+' ('+x.pat.travel+'% of '+x.pat.count+' samples)').join(', ')||'Insufficient observations')+'</p>';
    }).join(''));
  }
