  const commandSync={room:null,scope:'',token:'',readAt:0,error:'',busy:false,attempt:0};
  function roomKey(){const s=sharedScope();return s&&state.data.war.opponentId===cfg.enemyId&&sharedEndpoint()?sharedEndpoint()+'/'+s.faction+'/'+s.war:'';}
  function commandRoom(){
    return roomKey()&&roomKey()===commandSync.scope&&commandSync.token===cfg.shared.token?commandSync.room:null;
  }
  function roomClock(){const r=commandRoom();return r?r.now+Math.max(0,Date.now()-commandSync.readAt):Date.now();}
  function claimLive(c){return c?.status==='claimed'&&c.expires>roomClock();}
  async function syncCommand(cmd=null,observe=false){
    const key=roomKey(),token=cfg.shared.token;
    if(!key||document.hidden||commandSync.busy)return;
    if(key!==commandSync.scope||commandSync.token!==token)Object.assign(commandSync,{room:null,scope:key,token,error:'',attempt:0});
    commandSync.busy=true;commandSync.attempt=Date.now();
    const valid=()=>key===roomKey()&&token===cfg.shared.token;
    try{
      const request=async action=>{
        if(!valid())throw Error('War or access changed');
        const response=await sharedTransport(action?'PUT':'GET',commandSync.room?.revision||0,action,'command');
        if(!valid())return false;
        if(!response.ok){
          if(response.status===409&&action){await request(null);throw Error('Orders changed. Review the latest revision before retrying.');}
          throw Error(response.status===404?'The installed Worker does not yet offer command rooms.':response.status===503?'Command database or migration unavailable.':response.result?.error||'Worker request failed');
        }
        const r=response.result;
        if(r.schema!==1||!r.plan?.assignments||!r.ops?.states||!Number.isSafeInteger(r.revision)||!r.actor)throw Error('Unsupported command schema');
        commandSync.room={...r,events:r.events||commandSync.room?.events||[]};commandSync.readAt=Date.now();commandSync.error='';return true;
      };
      if(cmd&&!commandSync.room)throw Error('Read current orders before publishing.');
      if(!await request(cmd))return;
      if(observe&&['capo','officer'].includes(commandSync.room.actor.role)&&Object.keys(commandSync.room.plan.assignments).length){
        const rows=[...state.data.ours,...state.data.enemies].filter(p=>Date.now()-p.updated<=90000&&p.updated<=Date.now()).map(p=>{
          const loc=nativeWarLocation(p),kind=memberState(p);
          return {id:p.id,at:p.updated,state:kind==='okay'||loc.phase==='abroad'?'ready':
            kind==='hospital'?'hospital':kind==='jail'?'jail':loc.phase==='inbound'||/travel/i.test(p.status)?'travelling':'unknown',
            online:['Online','Idle','Offline'].includes(p.lastAction)?p.lastAction:'Unknown',
            country:loc.country==='Unknown'||loc.source.startsWith('Prior')?null:loc.country};
        });
        if(rows.length)await request({type:'observe',rows});
        if(valid()&&commandSync.room.event?.changes?.length)await request(null);
        // An authorised officer submits only a verified attack reference.
        if(valid())for(const [target,claim] of Object.entries(commandSync.room.ops.claims)){
          if(!claimLive(claim))continue;
          const record=pairRows(claim.hitter,Number(target)).find(r=>r.attacker===claim.hitter&&r.warId===state.data.war.id&&r.startedAt>=claim.at);
          if(record){await request({type:'verify',target:Number(target),hitter:claim.hitter,attack:record.id,at:record.at});break;}
        }
      }
      if(cmd&&valid())await request(null);
    }catch(e){if(valid())commandSync.error=String(e.message||'Command service unavailable').slice(0,180);}
    finally{commandSync.busy=false;if(valid()){publish();if(state.open)render();}}
  }
  function coordinationAlerts(){
    if(!state.data.war?.id)return [];
    const out=commandSignals.scope===state.data.war.id&&Date.now()-commandSignals.at<5*MIN?[...commandSignals.alerts]:[],room=commandRoom(),add=(id,title,detail,tab,priority)=>out.push({id,title,detail,tab,priority,status:'now'});
    if(roomKey()&&commandSync.error)add('cmd-sync','Shared coordination needs attention',commandSync.error,'squad',84);
    if(preparingWar()&&(!room||!Object.keys(room.ops.roll).length))add('cmd-ready','Opening roll call outstanding','Review opening coverage and voluntary availability.','brief',75);
    if(!room||Date.now()-commandSync.readAt>5*MIN)return out;
    const ids=Object.keys(room.plan.assignments);
    if(ids.some(id=>room.ops.states[id]?.phase==='REASSIGNMENT_READY'))add('cmd-grace','Five-minute grace elapsed','Check current status, backup coverage and reservations.','squad',94);
    if(ids.some(id=>room.ops.states[id]?.phase==='LOCKED_UNAVAILABLE'))add('cmd-lock','Locked target needs cover','An officer must review the locked allocation.','squad',95);
    if(room.events?.some(x=>roomClock()-x.at<10*MIN&&x.event.changes?.length))add('cmd-moved','Black Skull assignment changed','Open the revised hitter queue.','squad',92);
    if(ids.some(id=>claimLive(room.ops.claims[id])&&room.ops.claims[id].hitter!==state.data.meta.ownerId))add('cmd-claim','Target reserved by another hitter','Check active reservations before selecting a target.','squad',80);
    return out;
  }
  function sharedNextStep(){
    const r=commandRoom(),me=state.data.meta.ownerId;
    if(!r||Date.now()-commandSync.readAt>3*MIN||!me)return null;
    const row=sharedQueue(me)[0];
    if(!row)return null;
    const [id]=row,claim=r.ops.claims[id],stateNow=r.ops.states[id];
    const title=claimLive(claim)&&claim.hitter!==me?'Wait for the active target claim':
      ['LOCKED_UNAVAILABLE','UNKNOWN_STATUS','UNAVAILABLE_PENDING','REASSIGNMENT_READY'].includes(stateNow?.phase)?'Review your coverage warning':'Review your first Black Skull target';
    return {title,reason:playerName(Number(id))+' / priority '+row[1].priority+' / shared revision '+r.revision,label:'Open assignment',action:'tab:squad',tone:'attention'};
  }
  function playerName(id){return state.data.ours.find(x=>x.id===id)?.name||state.data.enemies.find(x=>x.id===id)?.name||combatArchive.people.get(id)?.name||'#'+id;}
  const commandOption=(id,items,value,label)=>'<label>'+esc(label)+'<select id="ws-cmd-'+id+'">'+items.map(([v,t])=>'<option value="'+esc(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label>';
  const foldCommand=(id,title,html)=>'<details class="ws-tool-group" data-ws-disclosure="'+esc(id)+'"><summary>'+esc(title)+'</summary>'+html+'</details>';
  const choiceItems=values=>values.map(v=>[v,v]);
  const cmdValue=k=>$('#ws-cmd-'+k,root)?.value;
  function squadScreen(){
    const room=commandRoom(),role=room?.actor.role,mayPlan=role==='capo',actor=room?.actor.id;
    let html=card('Black Skull command',esc(commandSync.error||(!room?'Local proposals. Connect shared orders in Settings to publish.':
      'Shared revision '+room.revision+' / '+role+' / checked '+age(commandSync.readAt)))+
      '<div class="ws-toolbar">'+b('Refresh orders','cmd-sync')+b('Settings','tab:settings')+'</div>');
    const proposals=suggestedAssignments(),map=new Map(proposals.map(p=>[p.target.id,p]));
    const ids=[...new Set([...Object.keys(room?.plan.assignments||{}).map(Number),...map.keys()])].sort((i,j)=>
      (room?.plan.assignments[j]?.priority??map.get(j)?.priority??0)-(room?.plan.assignments[i]?.priority??map.get(i)?.priority??0));
    const skulls=state.data.ours.filter(p=>cfg.blackSkulls[p.id]).map(p=>[p.id,p.name]);
    for(const id of ids){
      const a=room?.plan.assignments[id],s=room?.ops.states[id],c=room?.ops.claims[id],proposal=map.get(id);
      const primary=a?.primary||proposal?.primary;
      const status=s?.phase?.replaceAll('_',' ').toLowerCase()||(a?'assigned':primary?'proposal':'uncovered');
      let body='<p>'+esc(proposal?.reasons.join('. ')||'Shared leadership order')+'</p><p>Primary '+esc(primary?playerName(primary):'Needs intelligence')+
        ' / backups '+esc((a?.backups||proposal?.backups||[]).map(playerName).join(', ')||'None')+'</p>';
      if(s?.since)body+='<p>First unavailable '+esc(stamp(s.since))+' / grace ends '+esc(stamp(s.since+5*MIN))+' / '+esc(s.reason)+'</p>';
      if(s?.verified)body+='<p>Roster verified '+esc(stamp(s.verified))+'</p>';
      if(a?.lock)body+='<p>Locked by '+esc(a.lock.by)+' / '+esc(stamp(a.lock.at))+' '+esc(a.lock.reason)+'</p>';
      body+='<p>'+esc(claimLive(c)?'Claimed by '+playerName(c.hitter)+' until '+stamp(c.expires):'Claim '+(c?.status==='claimed'?'expired':c?.status||'available'))+'</p>';
      body+=(proposal?.candidates||[]).slice(0,6).map(x=>'<p>'+esc(x.p.name+' / '+x.ev.category+' / '+(x.available?'available':'availability needs review')+' / last fight '+stamp(x.ev.last))+'</p>').join('');
      if(actor&&a&&(actor===a.primary||a.backups.includes(actor)))body+=claimLive(c)?(c.hitter===actor?b('Release claim','cmd-release:'+id):''):b('Claim for 3 minutes','cmd-claim:'+id);
      if(mayPlan){
        body+=commandOption('primary-'+id,skulls,primary,'Primary')+
          '<label>Ordered backup IDs<input id="ws-cmd-backups-'+id+'" value="'+esc((a?.backups||proposal?.backups||[]).join(','))+'"></label>'+
          '<label>Priority<input type="number" min="0" max="100" id="ws-cmd-priority-'+id+'" value="'+(a?.priority??proposal?.priority??50)+'"></label>';
        if(!a?.lock)body+=b('Publish assignment','cmd-assign:'+id);
        if(a)body+='<label>Lock reason<input maxlength="120" id="ws-cmd-reason-'+id+'"></label>'+b(a.lock?'Unlock':'Lock',a.lock?'cmd-unlock:'+id:'cmd-lock:'+id);
      }
      html+=foldCommand('target-'+id,playerName(id)+' / '+status+(primary?' / '+playerName(primary):''),body);
    }
    if(!ids.length)html+=empty('No classified Black Skull targets. Check roster coverage or designate a manual target.');
    if(mayPlan)html+=foldCommand('policy','Shared policy',commandOption('metric',choiceItems(['bse','legacy']),room.plan.policy,'Strength policy')+
      '<label>Manual target IDs<input id="ws-cmd-manual" value="'+esc((room.revision?room.plan.manual:Object.keys(manualHeavyTargets())).join(','))+'"></label>'+
      '<label>Return hold (minutes)<input id="ws-cmd-hold" type="number" min="5" max="120" value="'+room.plan.holdMinutes+'"></label>'+b('Save shared policy','cmd-policy'));
    if(room&&['officer','capo'].includes(role))html+=foldCommand('duties','Tactical duties',commandOption('duty-hitter',state.data.ours.map(p=>[p.id,p.name]),0,'Member')+
      commandOption('duty',choiceItems(['protect','scout','strike','reserve','turtle']),'reserve','Duty')+commandOption('duty-target',[[0,'None'],...state.data.enemies.map(p=>[p.id,p.name])],0,'Eligible target')+b('Publish duty','cmd-duty'));
    if(room)html+=foldCommand('audit','Orders and assignment history',Object.entries(room.plan.duties).map(([i,d])=>'<p>'+esc(playerName(Number(i))+' / '+d.duty+' / '+(d.target?playerName(d.target):'No target'))+
      (Number(i)===actor&&d.target?(claimLive(room.ops.claims[d.target])?room.ops.claims[d.target].hitter===actor?b('Release','cmd-release:'+d.target):'':b('Claim','cmd-claim:'+d.target)):'')+'</p>').join('')+
      (room.events||[]).map(x=>'<p>'+esc(stamp(x.at)+' / revision '+x.revision+' / '+x.event.type+' / '+(x.event.target?playerName(x.event.target):'')+' '+(x.event.changes||[]).map(c=>playerName(c.target)+' to '+playerName(c.primary)+' ('+c.reason+')').join(', '))+'</p>').join(''));
    return html+b('Legacy orders and squad membership','tab:leader');
  }
  let commandSignals={scope:'',at:0,alerts:[]};
  function refreshCommandSignals(){
    const now=Date.now(),w=state.data.war;if(!w||!rosterFresh('ours')||!rosterFresh('enemies'))return;
    const alerts=[],add=(id,title,detail,tab,priority)=>alerts.push({id,title,detail,tab,priority,status:'now'});
    const room=commandRoom(),bands=enemyRoleBands();
    if(room&&[...bands.heavy].some(id=>!room.plan.assignments[id]))add('cmd-uncovered','High-priority target needs a hitter','Review the available matchups and ordered backups.','squad',91);
    if(activeWarNow()&&protectionPriorities().some(x=>x.player.id===state.data.meta.ownerId&&x.exposed&&x.feedFresh&&x.impact.underFire)&&travelPlan().some(r=>r.safe))
      add('cmd-flight','Consider defensive travel','Compare flight cover and your next attacking duty.','flights',90);
    if(activeWarNow()&&forecastReport().windows.some(w=>w.start&&w.start-now<30*MIN))add('cmd-window','Attack window approaching','Review availability, operational risks and confidence.','heatmap',83);
    commandSignals={scope:w.id,at:now,alerts};
  }
  function sharedQueue(id){
    const r=commandRoom();if(!r)return [];
    const entries=Object.entries(r.plan.assignments);
    return entries.filter(([t,a])=>a.primary===id||claimLive(r.ops.claims[t])&&r.ops.claims[t].hitter===id)
      .sort(([i,a],[j,b])=>Number(claimLive(r.ops.claims[j])&&r.ops.claims[j].hitter===id)-
        Number(claimLive(r.ops.claims[i])&&r.ops.claims[i].hitter===id)||b.priority-a.priority||Number(i)-Number(j));
  }
  function sharedRestriction(target,hitter){
    const r=commandRoom();if(!r)return '';
    const claim=r.ops.claims[target],a=r.plan.assignments[target];
    if(claimLive(claim)&&claim.hitter!==hitter)return 'This target is reserved by '+playerName(claim.hitter)+'.';
    if(!a)return '';
    if(commandSync.error||Date.now()-commandSync.readAt>3*MIN)return 'Refresh the shared order before acting.';
    if(a.primary!==hitter&&!(claimLive(claim)&&claim.hitter===hitter))return 'Another hitter holds this shared assignment.';
    return '';
  }
