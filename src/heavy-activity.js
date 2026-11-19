  const heavyView={date:0,selection:'',scope:'',timer:0,busy:false,next:0,pause:0,error:''};
  function heavyTargets(){
    if(!cfg.enemyId)return [];
    const bands=enemyRoleBands(),targets=new Map(),roster=new Map(state.data.enemies.map(p=>[p.id,p]));
    function add(id,reason){
      if(!idKey(id))return;
      if(!targets.has(id))targets.set(id,{id,p:roster.get(id),name:playerName(id),reasons:new Set()});
      targets.get(id).reasons.add(reason);
    }
    for(const id of bands.automatic)add(id,'Automatic Black Skull target');
    for(const id of bands.manual)add(id,'Designated by Skull Capo');
    for(const hitter of state.data.ours){
      if(cfg.blackSkulls[hitter.id])add(positive(cfg.assignments[hitter.id]),'Assigned to '+hitter.name);
    }
    for(const [id,a] of Object.entries(commandRoom()?.plan.assignments||{})){
      if(a.primary)add(Number(id),'Shared assignment to '+playerName(a.primary));
    }
    return [...targets.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.id-b.id);
  }
  function heavyHistory(targets,faction,at){
    const day=24*HOUR,today=Math.floor(at/day)*day,cut=today-13*day;
    const result=new Map(targets.map(t=>[t.id,{...t,hours:new Map(),latest:null}]));
    const owner=positive(state.data.meta.ownerId),premium=owner&&scouterPremiumActive();
    function bucket(target,hour){
      if(!target.hours.has(hour))target.hours.set(hour,{checks:0,online:0,onlineAt:0,attacks:0});
      return target.hours.get(hour);
    }
    const inRange=t=>Number.isFinite(t)&&t>=cut&&t<=at;
    const floor=t=>Math.floor(t/HOUR)*HOUR;
    function online(target,hour,time){
      const b=bucket(target,hour);
      b.online=1;
      if(inRange(time)&&floor(time)===hour)b.onlineAt=Math.max(b.onlineAt,time);
      if(!target.latest||hour>=target.latest.hour)target.latest={hour,exact:b.onlineAt};
    }
    for(const r of combatArchive.hours.values()){
      const t=result.get(r.player);
      if(!t||r.faction!==faction||!inRange(r.hour)||floor(r.hour)!==r.hour)continue;
      if(r.source==='roster'){
        const b=bucket(t,r.hour);b.checks+=Math.max(0,r.samples-r.unknown);
        if(r.online>0)online(t,r.hour,r.lastOnlineAt||(r.online===r.samples?r.at:0));
      }else if(r.source==='scanner'&&premium&&r.owner===owner&&Number.isFinite(r.score)&&r.score>=0){
        const b=bucket(t,r.hour);if(!b.scanAt||b.scanAt<=r.at){b.score=r.score;b.partial=r.partial;b.scanAt=r.at;}
      }
    }
    for(const t of result.values()){
      const p=t.p,spans=gridMemberships(faction,p,combatArchive.people.get(t.id));
      for(const [i,s] of Object.entries(state.data.activity?.['enemies:'+t.id]?.hours||{})){
        const hour=Number(i)*HOUR;
        if(inRange(hour)&&s.online>0&&s.online<=s.count&&spans.some(m=>m.first<=hour&&m.last>=Math.min(hour+HOUR,at)))
          online(t,hour,0);
      }
      if(!p||!inRange(p.updated))continue;
      const hour=floor(p.updated);
      if(['Online','Offline','Idle'].includes(p.lastAction)){
        const b=bucket(t,hour);b.checks=Math.max(1,b.checks);
        if(p.lastAction==='Online')online(t,hour,p.updated);
      }
      if(inRange(p.lastAt)&&p.lastAt<=p.updated)bucket(t,floor(p.lastAt)).action=p.lastAt;
    }
    for(const r of combatArchive.fights.values()){
      const t=result.get(r.attacker);
      if(t&&r.attackerFaction===faction&&inRange(r.at))bucket(t,floor(r.at)).attacks++;
    }
    return result;
  }
  function heavyMark(b){
    if(b?.online)return ['ON','Online in Torn roster','peace lvl3'];
    if(b?.action||b?.attacks)return ['A','Torn action or recorded attack','unknown lvl3'];
    if(b?.score>0)return ['S','Individual scanner activity','unknown lvl2'];
    if(b?.checks)return ['\u00b7','Roster checked without an online sighting','even lvl0'];
    if(b?.score===0)return ['0','Scanner returned zero activity','even lvl0'];
    return ['\u2013','No evidence','gap'];
  }
  const heavyVisible=()=>state.open&&!state.playerOpen&&['activity','heatmap'].includes(state.tab)&&activityPrefs.mode==='heavy'&&!document.hidden;
  function heavyRange(faction,owner,id,at){
    const end=Math.floor(at/HOUR)*3600,from=Math.floor(at/(24*HOUR))*86400-13*86400;
    const marker=[faction,owner,id,'heavy-range'].join('/'),prior=combatArchive.hours.get(marker);
    if(prior?.from<=from&&prior.end>=end)return null;
    return {faction,owner,marker,end,coveredFrom:from,from:prior?.from<=from&&prior.end>from&&prior.end<end?prior.end:from};
  }
  // Read one individual at a time only while this view is visible. A complete UTC
  // range survives reloads. On subsequent visits request only new completed hours.
  function scheduleHeavyHistory(){
    if(heavyView.timer||heavyView.busy||!heavyVisible()||!cfg.ffConsent||!cfg.ffEnabled||!ffApiKey()||!state.data.meta.ownerId)return;
    if(!combatArchive.ready||!scouterPremiumActive())return;
    heavyView.timer=setTimeout(async()=>{
      heavyView.timer=0;
      if(!heavyVisible()||!cfg.ffConsent||!cfg.ffEnabled||!scouterPremiumActive()||heavyView.pause>Date.now())return;
      const at=Date.now(),owner=positive(state.data.meta.ownerId),faction=cfg.enemyId,key=scouterContext();
      if(!owner||!faction||!key)return;
      if(scouterExtra.busy){heavyView.next=at+7000;scheduleHeavyHistory();return;}
      const targets=heavyTargets();
      const next=targets.map(t=>({t,range:heavyRange(faction,owner,t.id,at)})).find(x=>x.range&&at-(scouterExtra.attempts['activity:'+x.t.id]||0)>=15*MIN);
      if(!next)return;
      const {t,range}=next;
      range.valid=()=>heavyVisible()&&cfg.enemyId===faction&&positive(state.data.meta.ownerId)===owner&&ffApiKey()===key&&scouterPremiumActive()&&heavyTargets().some(x=>x.id===t.id);
      range.rateLimit=seconds=>{heavyView.pause=Date.now()+seconds*1000;};
      heavyView.busy=true;heavyView.error='';
      try{
        const ok=await scouterRead('activity',t.id,range);
        if(!ok&&range.valid()){
          heavyView.pause=Math.max(heavyView.pause,Date.now()+MIN);
          heavyView.error='Individual scanner history is unavailable. Torn observations are still shown.';
        }
      }finally{
        heavyView.busy=false;heavyView.next=Date.now()+7000;
        if(heavyVisible())render();
      }
    },Math.max(100,heavyView.next-Date.now(),heavyView.pause-Date.now()));
  }
  function openHeavyHistory(){
    if(roomKey()&&(commandSync.scope!==roomKey()||Date.now()-commandSync.attempt>75000))syncCommand();
    if(!scouterPremiumActive())loadFactionScanner();
    archiveReady.then(()=>{if(heavyVisible())render();});
  }
  function heavyClock(t){return new Date(t).toISOString().slice(11,16);}
  function heavyLast(latest){
    if(!latest)return 'No sighting in 14 days';
    const d=new Date(latest.hour).toISOString();
    return d.slice(5,10)+' '+(latest.exact?heavyClock(latest.exact):d.slice(11,13)+'h')+' TCT';
  }
  function heavyCellDetail(t,hour,at){
    const b=t.hours.get(hour),p=t.p;
    const facts=[];
    if(b?.online)facts.push(b.onlineAt?'Online sighting at '+heavyClock(b.onlineAt)+' TCT':'Observed online during this hour');
    if(b?.checks&&!b.online)facts.push('Roster sampled without an online sighting');
    if(b?.action)facts.push('Torn last action '+heavyClock(b.action)+' TCT');
    if(b?.attacks)facts.push(b.attacks+' captured outgoing attack'+(b.attacks===1?'':'s'));
    if(b?.score!=null)facts.push('Individual FFScouter score '+b.score+(b.partial?' (partial)':''));
    const status=p?.updated&&p.updated<=at?String(p.lastAction||'Unknown')+' / checked '+age(p.updated):'Unknown';
    return '<strong>'+esc(t.name+' / '+new Date(hour).toISOString().slice(0,10)+' '+heavyClock(hour)+' TCT')+'</strong><p>'+
      esc(facts.join(' / ')||(hour>at?'This hour has not started.':'No individual evidence for this hour.'))+'</p><p>'+esc([...t.reasons].join(' / '))+
      '</p><p>Latest roster status '+esc(status)+'</p>'+infoButton('Open player dossier',t.id);
  }
  function heavyTargetDetail(t){
    const hours=[...t.hours].filter(([,b])=>b.online).sort(([a],[b])=>b-a);
    const freq=new Map();
    for(const [hour] of hours){
      const utc=heavyClock(hour);freq.set(utc,(freq.get(utc)||0)+1);
    }
    const repeat=[...freq].filter(([,days])=>days>=2).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3);
    return '<strong>'+esc(t.name)+'</strong><p>'+esc([...t.reasons].join(' / '))+'</p>'+
      '<p>Latest online '+esc(heavyLast(t.latest))+'</p>'+
      (repeat.length?'<p>Repeated online sightings '+esc(repeat.map(([utc,n])=>utc+' TCT on '+n+' dates').join(' / '))+'</p>':'')+
      (hours.length?'<p>Recent online hours (TCT) '+esc(hours.slice(0,6).map(([h])=>new Date(h).toISOString().slice(5,13).replace('T',' ')+'h').join(', '))+'</p>':'')+
      (t.latest?b('Show latest online hour','cmd-heavylatest:'+t.id+'/'+t.latest.hour):'')+infoButton('Open player dossier',t.id);
  }
  function heavyActivityScreen(tabs,at=Date.now()){
    const faction=cfg.enemyId,day=24*HOUR,today=Math.floor(at/day)*day;
    const scope=[cfg.ourId,faction,state.data.war?.id||0].join('/');
    if(scope!==heavyView.scope){heavyView.scope=scope;heavyView.selection='';heavyView.date=0;heavyView.error='';}
    const date=heavyView.date>=today-13*day&&heavyView.date<=today?heavyView.date:today;
    const targets=heavyTargets(),hist=heavyHistory(targets,faction,at);
    const dates=Array.from({length:14},(_,i)=>{const d=today-i*day;return '<option value="'+d+'" '+(date===d?'selected':'')+'>'+esc((i===0?'Today / ':'')+new Date(d).toISOString().slice(0,10))+'</option>';}).join('');
    const data=[...hist.values()].sort((a,b)=>(b.latest?.hour??0)-(a.latest?.hour??0)||(b.latest?.exact??0)-(a.latest?.exact??0)||a.name.localeCompare(b.name));
    const headers=Array.from({length:24},(_,h)=>'<th scope="col">'+String(h).padStart(2,'0')+'</th>').join('');
    const rows=data.map(t=>{
      let detail='';
      const cells=Array.from({length:24},(_,h)=>{
        const hour=date+h*HOUR,[mark,label,band]=heavyMark(t.hours.get(hour)),key=t.id+'/'+hour,selected=heavyView.selection===key;
        if(selected)detail='<tr class="ws-grid-detail"><td colspan="25"><div aria-live="polite">'+heavyCellDetail(t,hour,at)+'</div></td></tr>';
        return '<td><button type="button" class="ws-grid-cell '+band+'" aria-label="'+esc(t.name+' '+heavyClock(hour)+' TCT / '+label)+'" aria-pressed="'+selected+'" data-action="cmd-heavycell:'+key+'">'+mark+'</button></td>';
      }).join('');
      if(heavyView.selection===String(t.id))detail='<tr class="ws-grid-detail"><td colspan="25"><div aria-live="polite">'+heavyTargetDetail(t)+'</div></td></tr>';
      return '<tr><th scope="row"><button type="button" data-action="cmd-heavycell:'+t.id+'" aria-expanded="'+(heavyView.selection===String(t.id))+'">'+esc(t.name)+'</button><small>'+esc(heavyLast(t.latest))+'</small></th>'+cells+'</tr>'+detail;
    }).join('');
    scheduleHeavyHistory();
    const grid='<div class="ws-hour-scroll ws-heavy-grid" tabindex="0" role="region" aria-label="Heavy hitter sightings"><table><colgroup><col class="ws-name-col"><col span="24"></colgroup><thead><tr><th scope="col">Target / last online</th>'+headers+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
    const owner=positive(state.data.meta.ownerId),checked=targets.filter(t=>!heavyRange(faction,owner,t.id,at)).length;
    const fresh=targets.filter(t=>t.p?.updated>0&&t.p.updated<=at&&at-t.p.updated<5*MIN&&['Online','Idle','Offline'].includes(t.p.lastAction));
    const live=fresh.filter(t=>t.p.lastAction==='Online');
    const rosterLine=fresh.length?'Online at last check: '+(live.map(t=>t.name).join(', ')||'none seen')+' ('+fresh.length+'/'+targets.length+' checked in 5m).':'Awaiting a fresh Torn roster check.';
    const coverage=combatArchive.error?'Local history archive unavailable.':scouterPremiumActive()?'Individual Premium history checked through the last full hour for '+checked+' / '+targets.length+' targets.':'Individual Premium history requires an enabled, registered Premium key.';
    return card('Heavy hitter activity','<div class="ws-grid-tabs">'+tabs+'</div>'+
      (!targets.length?empty(faction?'No automatic, designated or assigned Black Skull targets for this opponent yet.':'Detect or select an opponent to see heavy hitters.'):
      '<p>'+esc(rosterLine)+'</p><div class="ws-tracker-controls"><label>TCT date <select id="ws-heavy-date">'+dates+'</select></label></div>'+
      '<p class="ws-small"><b>ON</b> Torn online &nbsp; <b>A</b> action or attack &nbsp; <b>S</b> scanner activity<br>&middot; roster checked &nbsp; 0 scanner score &nbsp; &ndash; no evidence</p>'+grid+
      '<p class="ws-small">Times under names are the latest confirmed sightings across 14 days. Tap an hour for the evidence. '+esc(coverage)+'</p>')+
      (heavyView.error?'<p>'+esc(heavyView.error)+'</p>':'')+
      (roomKey()&&!commandRoom()?'<p>Shared assignments pending. '+b('Refresh orders','cmd-sync')+'</p>':'')+
      '<p class="ws-small">History follows the current target list. '+a('Scanner data policy','https://ffscouter.com/volunteer')+'</p>');
  }
