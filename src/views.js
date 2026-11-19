  function gridNumber(n,signed=false){
    const v=Math.round(n*10)/10;return (signed&&v>0?'+':'')+String(v);
  }
  function gridDetail(t,row,h,c,model,opts){
    const hour=String(h).padStart(2,'0')+':00 TCT',title=row.label+' / '+hour;
    if(!c){
      let reason='No matching observations for this hour.';
      if(opts.mode!=='weekday'&&row.key+h*HOUR>Date.now())reason='This hour has not started.';
      else if(model.compare){
        const pair=model.groups.map(g=>g.series.get(row.key+h*HOUR));
        reason=model.groups.map((g,i)=>g.title+': '+(pair[i]?gridNumber(pair[i].value)+' / '+gridSources[pair[i].source]+(pair[i].partial?' / partial':''):'no sample')).join('. ')+'. A difference needs comparable coverage from the same source.';
      }
      return '<strong>'+esc(title)+'</strong><p>'+esc(reason)+'</p>';
    }
    const label=opts.source==='users'?(c.source==='premium'?'players seen by Premium':'players observed '+(opts.idle?'online or idle':'online')):gridUnits[opts.source];
    const facts=[gridSources[c.source],c.period==='unknown'?'war status unknown':c.period==='mixed'?'mixed periods':c.period==='war'?'wartime':'peacetime'];
    if(c.a)facts.push('Our faction '+gridNumber(c.a.value)+' / enemy '+gridNumber(c.b.value));
    if(opts.mode==='weekday')facts.push('Mean of '+c.dates+' sampled date'+(c.dates===1?'':'s')+' out of '+row.dates.length+(c.excluded?' / '+c.excluded+' other-source hours excluded':''));
    if(c.checks!=null)facts.push(c.checks+' known status checks');
    if(c.roster&&c.source==='local')facts.push(c.seen+' of '+c.roster+' members sampled');
    if(c.source==='premium'&&c.roster)facts.push('Provider roster '+c.roster);
    if(c.partial)facts.push('Partial coverage');
    if(c.last)facts.push('Last checked '+new Date(c.last).toISOString().slice(0,16).replace('T',' ')+' UTC');
    const links=set=>[...(set||[])].sort((a,b)=>playerName(a).localeCompare(playerName(b))).map(id=>infoButton(playerName(id),id)).join(' ');
    const named=links(c.names),attackers=links(c.attackers);
    return '<strong>'+esc(title+' / '+gridNumber(c.value,model.compare)+' '+label)+'</strong><p>'+esc(facts.join(' / '))+'</p>'+
      (named?'<p>Seen by this device '+named+'</p>':'')+
      (c.attacks?'<p>'+c.attacks+' captured attack'+(c.attacks===1?'':'s')+' '+attackers+'</p>':'');
  }
  function trackerTable(t,model,opts){
    const cols=Array.from({length:24},(_,h)=>'<th scope="col">'+String(h).padStart(2,'0')+'</th>').join('');
    const counts=new Map();
    for(const c of t.series.values())counts.set(c.source,(counts.get(c.source)||0)+1);
    const sourceNames={premium:'Premium',local:'Torn',score:'scanner',legacy:'archive',attack:'attack log'};
    const coverage=[...counts].map(([k,n])=>n+'h '+sourceNames[k]).join(' / ')||'No sampled hours';
    const title='<div class="ws-matrix-title">'+esc(t.title)+' <small>'+esc(coverage)+'</small></div>';
    const rows=t.rows.map(row=>{
      let detail='';
      const cells=row.cells.map((c,h)=>{
        const selected=gridSelection===t.key+'/'+row.key+'/'+h;
        const band=!c?'gap':model.compare?(c.value>0?'lead':c.value<0?'trail':'even'):c.period;
        const level=c&&c.value&&model.peak?Math.ceil(4*Math.abs(c.value)/model.peak):0;
        const value=c?gridNumber(c.value,model.compare):'\u2013';
        if(selected)detail='<tr class="ws-grid-detail"><td colspan="25"><div aria-live="polite">'+gridDetail(t,row,h,c,model,opts)+'</div></td></tr>';
        return '<td><button type="button" class="ws-grid-cell '+band+' lvl'+level+(c?.partial?' partial':'')+'" aria-pressed="'+selected+'" aria-label="'+
          esc(t.title+', '+row.label+', '+h+':00 TCT, '+(c?value+' '+gridUnits[opts.source]:'no comparable sample'))+'" data-action="cmd-cell:'+t.key+'/'+row.key+'/'+h+'">'+value+'</button></td>';
      }).join('');
      return '<tr><th scope="row">'+esc(row.label)+'</th>'+cells+'</tr>'+detail;
    }).join('');
    return title+'<table aria-label="'+esc(t.title)+'"><colgroup><col class="ws-date-col"><col span="24"></colgroup><thead><tr><th scope="col">TCT</th>'+cols+'</tr></thead><tbody>'+rows+'</tbody></table>';
  }
  function activityScreen(){
    const opts=activityPrefs;
    const tabs=[['hours','Hour grid'],['weekday','Weekday avg'],['compare','Compare'],['heavy','Heavy hitters']].map(([v,label])=>
      '<button type="button" data-action="cmd-mode:'+v+'" aria-pressed="'+(opts.mode===v)+'">'+label+'</button>').join('');
    if(opts.mode==='heavy')return heavyActivityScreen(tabs);
    const model=trackerModel(opts),choices=[...state.data.ours,...state.data.enemies].map(p=>[p.id,p.name]);
    if(opts.player&&!choices.some(([id])=>id===opts.player))choices.push([opts.player,playerName(opts.player)]);
    const controls='<div class="ws-tracker-controls">'+commandOption('days',choiceItems([3,7,14,30]),opts.days,'Days')+
      commandOption('source',[['users','Players seen'],['roster','Online checks %'],['recent','Recent action %'],['scanner','Scanner score'],['attack','Captured attacks']],opts.source,'Show')+
      (opts.mode!=='compare'?commandOption('first',[['enemies','Enemy first'],['ours','Ours first']],opts.first,'Order'):'')+
      (opts.source==='users'?'<label class="ws-idle"><input type="checkbox" id="ws-cmd-idle" '+(opts.idle?'checked':'')+'> Include idle (Torn)</label>':'')+
      '</div>'+foldCommand('grid-filters','Filters and export'+(opts.player?' / '+playerName(opts.player):'')+(opts.period!=='all'?' / '+opts.period:''),
      '<div class="ws-tracker-controls">'+commandOption('period',[['all','All periods'],['war','Wartime'],['peace','Peacetime']],opts.period,'Period')+
      commandOption('player',[[0,'All members'],...choices],opts.player,'Player')+'</div>'+b('Export CSV','cmd-csv')+b('Refresh Premium history','cmd-scanner')+
      '<p>Players seen uses the Premium faction count when available. Local counts use distinct players observed online that hour. Include idle uses local Torn observations. '+a('Scanner data policy','https://ffscouter.com/volunteer')+'</p>');
    const legend=model.compare?'<span class="lead">Our lead</span><span class="trail">Enemy lead</span>':
      '<span class="peace">Peace</span><span class="war">War</span><span class="unknown">Unknown / mixed</span>';
    const filters='<div class="ws-grid-tabs">'+tabs+'</div>'+controls+
      '<div class="ws-grid-key">'+legend+'<small>Brighter = higher'+(model.peak?' / peak '+gridNumber(model.peak):'')+' &middot; &ndash; no sample &middot; corner mark = partial</small></div>';
    let note='';
    if(!cfg.enemyId)note='Set or detect an opponent to see enemy activity.';
    else if(opts.mode==='compare')note='Positive numbers favour our faction. Gaps need comparable observations on both sides.';
    else if(opts.source==='scanner'&&!scouterPremiumActive())note='Enable FFScouter Premium in Settings to view scanner scores.';
    else if(!model.groups.find(g=>g.key==='enemies')?.series.size)note=opts.player?'No enemy observations match this player and period.':'No enemy observations in this period. Foreground roster checks and authorised Premium history can fill these hours.';
    const width=64+25+24*Math.max(19,(gridNumber(model.peak).length+(model.compare?1:0)+(opts.mode==='weekday'?2:0))*7+3);
    const grid='<div class="ws-hour-scroll" style="--ws-grid-width:'+width+'px" role="region" aria-label="Faction activity grids, swipe for later hours" tabindex="0">'+model.tables.map(t=>trackerTable(t,model,opts)).join('')+'</div>';
    return card('Faction activity',filters+(note?'<p>'+esc(note)+'</p>':'')+(scannerError?'<p>'+esc(scannerError)+'</p>':'')+grid+
      '<small>'+opts.days+' UTC dates / swipe for later hours / tap a cell for evidence</small>')+
      foldCommand('enemy-brief','Enemy intelligence',enemyActivityBrief(Date.now()))+
      foldCommand('grid-forecast','Attack-window forecasts',forecastCard())+
      foldCommand('old-activity','Enemy activity summary and player reports',activity(false));
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
    const self=me&&defensivePriorities().find(x=>x.player.id===me.id&&x.exposed&&x.feedFresh&&x.impact.underFire);
    const routes=travelPlan(),safe=routes.filter(r=>r.safe),offense=routes.filter(r=>r.offensive),local=me?currentLocation(me):null;
    const med=medicalSupplies?.owner===me?.id&&medicalSupplies&&Date.now()-medicalSupplies.at<=20*MIN?medicalSupplies:null;
    const duty=commandRoom()?.plan.duties[me?.id],assigned=Object.values(commandRoom()?.plan.assignments||{}).some(a=>a.primary===me?.id);
    const decision=!me||!rosterFresh('ours')?'Refresh your own status before planning protection.':
      memberState(me)==='hospital'?'Already in hospital. Review discharge time and revive settings.':
      assigned||duty?.duty==='strike'||self?.opportunities>0?'Coordinate cover for your attacking duty before leaving.':
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
    const assessment=templateAssessment(w,score,rules),risks=defensivePriorities().filter(x=>x.exposed);
    const losses=risks.map(z=>'<p>'+esc(z.player.name+' / '+z.priority+' / '+z.country)+' / '+z.impact.in30+' incoming in 30m / '+fmt(z.impact.given)+' captured respect conceded / '+fmt(z.impact.earned)+' earned / '+(z.impact.underFire?'repeat pressure':'monitor')+' / '+fmt(z.opportunities)+' proven offensive options / '+z.orders+' primary duties</p>').join('');
    const roll=room?.ops.roll||{},member=room?.actor.id;
    return card(preparingWar()?'Opening plan':'Tactical briefing',esc(w.opponentName+' / '+commandPosture())+'<p>'+esc(stamp(epochMs(w.start)))+
      ' / score '+(score?fmt(score.our)+' - '+fmt(score.enemy):'unknown')+' / official target '+fmt(w.target||null)+'</p><p>'+esc(assessment.source)+' / '+(assessment.remaining===null?'Winning margin needs confirmed rules.':fmt(assessment.remaining)+' points to the configured winning condition.')+'</p>'+
      '<p>'+plans.length+' heavy targets / '+plans.filter(x=>!x.primary).length+' need matchup evidence. '+state.data.ours.filter(p=>!roll[p.id]).length+' members have no roll-call response.</p>'+
      b('Allocate hitters','tab:squad')+b('Regular matchups','tab:matchups')+b('Review opponent history','tab:scouting'))+
      card('Voluntary roll call',Object.entries(roll).map(([i,x])=>'<p>'+esc(playerName(Number(i))+' / '+x.choice+(x.from?' / '+stamp(x.from):'')+(x.until?' to '+stamp(x.until):''))+'</p>').join('')+
      (member?commandOption('roll',choiceItems(['at start','later','unavailable']),roll[member]?.choice,'My availability')+
        '<label>From (UTC)<input type="datetime-local" id="ws-cmd-from"></label><label>Until (UTC)<input type="datetime-local" id="ws-cmd-until"></label>'+b('Submit my availability','cmd-roll'):
        '<p>A member-bound credential is required to respond.</p>'))+
      openingEvidence()+forecastCard()+card('Defensive priorities',losses||empty('No fresh, captured scoring losses and exposure to report.'))+
      foldCommand('rules','Weekly war rules', '<p>Torn reports a target and scores. Enter any additional conditions shown on this war\'s enlistment panel.</p>'+
      commandOption('mode',[['unknown','Unknown'],['net','Lead over opponent'],['own','Own score threshold']],rules.mode||'unknown','Winning condition type')+'<label>Initial threshold<input type="number" min="1" id="ws-cmd-opening" value="'+esc(rules.opening??'')+'"></label><label>Reduction starts after hours<input type="number" min="0" id="ws-cmd-after" value="'+esc(rules.after??'')+'"></label>'+commandOption('chainon',[['unknown','Unknown'],['yes','Counts'],['no','Does not count']],rules.chainOn||'unknown','Chain contribution')+'<label>Weekly condition<input maxlength="100" id="ws-cmd-condition" value="'+esc(rules.condition||'')+'"></label>'+
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
      else if(kind==='filters'){
        const source=cmdValue('source'),player=Number(cmdValue('player')),days=Number(cmdValue('days'));
        const loadPlayer=source==='scanner'&&player&&(source!==activityPrefs.source||player!==activityPrefs.player||days!==activityPrefs.days);
        Object.assign(activityPrefs,{days,source,first:cmdValue('first')||activityPrefs.first,period:cmdValue('period'),player,idle:$('#ws-cmd-idle',root)?.checked||false});
        gridSelection=null;
        const {mode,period,idle,first}=activityPrefs;cfg.activityGrid={days,source,mode,period,idle,first};saveCfg();
        if(loadPlayer)await scouterRead('activity',player);
      }else if(kind==='heavyview'){
        activityPrefs.mode='heavy';navigate('heatmap');return;
      }else if(kind==='heavyday'){
        heavyView.single=true;heavyView.date=target;heavyView.selection='';
      }else if(kind==='heavylatest'){
        const [id,hour]=value.split('/').map(Number);
        if(!idKey(id)||!Number.isSafeInteger(hour)||hour%HOUR!==0)return;
        heavyView.single=true;heavyView.date=Math.floor(hour/(24*HOUR))*24*HOUR;
        heavyView.selection=id+'/'+hour;render();
        const cell=root.querySelector('[data-action="cmd-heavycell:'+heavyView.selection+'"]');
        cell?.scrollIntoView({block:'nearest',inline:'center'});return;
      }else if(kind==='heavycell'){heavyView.selection=heavyView.selection===value?'':value;}
      else if(kind==='mode'&&['hours','weekday','compare','heavy'].includes(value)){
        activityPrefs.mode=value;gridSelection=null;cfg.activityGrid={...cfg.activityGrid,mode:value};saveCfg();
        if(value==='heavy')openHeavyHistory();
      }else if(kind==='cell'){gridSelection=gridSelection===value?null:value;}
      else if(kind==='player'){activityPrefs.player=target;if(activityPrefs.mode==='heavy')activityPrefs.mode='hours';gridSelection=null;navigate('heatmap');}
      else if(kind==='csv'){fileDownload('warstaxx-activity.csv','text/csv',trackerCSV(trackerModel(),activityPrefs));}
      else if(kind==='flight'){cfg.flightMethod=cmdValue('method');cfg.flightBook=cmdValue('book');saveCfg();}
      else if(kind==='medical')await checkSupplies();
      else if(kind==='rules'){
        const num=k=>cmdValue(k)===''?null:Number(cmdValue(k)),decay=num('decay'),overseas=num('overseas');
        if([decay,overseas].some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>100)))throw Error('Use a number from 0 to 100 or leave the field empty.');
        (cfg.commandRules||={})[state.data.war.id]={mode:cmdValue('mode'),opening:num('opening'),after:num('after'),condition:cmdValue('condition'),chain:cmdValue('chain'),chainOn:cmdValue('chainon'),overseas,decay,at:Date.now()};saveCfg();
      }else if(kind==='history')await historicalPage('user');
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
