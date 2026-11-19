  const activityPrefs={days:14,period:'all',player:0,source:'users',mode:'hours',idle:false,first:'enemies'};
  const savedGrid=cfg.activityGrid||{};
  if([3,7,14,30].includes(savedGrid.days))activityPrefs.days=savedGrid.days;
  if(['all','war','peace'].includes(savedGrid.period))activityPrefs.period=savedGrid.period;
  if(['users','roster','recent','scanner','attack'].includes(savedGrid.source))activityPrefs.source=savedGrid.source;
  if(['hours','weekday','compare','heavy'].includes(savedGrid.mode))activityPrefs.mode=savedGrid.mode;
  activityPrefs.idle=savedGrid.idle===true;
  if(savedGrid.first==='ours')activityPrefs.first='ours';
  let gridSelection=null;
  let activitySweep=0,scannerBusy=false,scannerError='';
  let scannerScope='',scannerAttempts=new Map();
  function warAt(faction,at){
    const current=state.data.war;
    if(current&&[cfg.ourId,current.opponentId].includes(faction)&&at>=epochMs(current.start)&&at<=n(current.observed))return current.id;
    for(const w of [...state.data.ourWars,...state.data.enemyWars])
      if(w.factions?.includes(faction)&&at>=epochMs(w.start)&&at<=epochMs(w.end))return w.id;
    return null;
  }
  async function captureRoster(side,players,at,war){
    const faction=side==='ours'?cfg.ourId:cfg.enemyId,hour=Math.floor(at/HOUR)*HOUR;
    await archiveReady;if(!combatArchive.db||!faction||!players.length)return;
    const rows=[];
    await transact('hours',store=>{
      for(const p of players){
        const key=[hour,faction,p.id,war??'unknown','roster'].join('/');
        const req=store.get(key);
        req.onsuccess=()=>{
          const r=req.result||{id:key,hour,faction,player:p.id,war,source:'roster',samples:0,online:0,recent:0,unknown:0,away:0};
          if(r.at>=at) return;
          const status=String(p.lastAction||'').toLowerCase(),known=['online','idle','offline'].includes(status);
          r.samples++;r.online+=Number(status==='online');r.unknown+=Number(!known);
          if(status==='online')r.lastOnlineAt=at;
          r.idle=(r.idle||0)+Number(status==='idle');
          r.idleKnown=(r.idleKnown||0)+Number(known);
          const dated=p.lastAt>0&&p.lastAt<=at;
          // Only new observations have a denominator for last-action coverage.
          r.datedChecks=(r.datedChecks||0)+Number(dated);
          r.recentDated=(r.recentDated||0)+Number(dated&&at-p.lastAt<=15*MIN);
          r.recent+=Number(dated&&at-p.lastAt<=15*MIN);
          r.periodVerified=war!=null;
          r.away+=Number(memberState(p)==='away');r.at=at;r.country=nativeWarLocation(p).country;r.roster=players.length;
          store.put(r);rows.push(r);
        };
      }
    });
    rows.forEach(x=>combatArchive.hours.set(x.id,x));
    const observedIds=new Set(players.map(p=>p.id));
    const people=[];
    await transact('people',store=>{
      for(const entry of combatArchive.people.values()){
        const last=entry.memberships.at(-1);
        if(last?.faction!==faction||last.departed||entry.at>=at||observedIds.has(entry.id))continue;
        const read=store.get(entry.id);read.onsuccess=()=>{
          const stored=read.result,h=stored?.memberships.at(-1);
          if(h?.faction===faction&&!h.departed&&stored.at<at){h.departed=at;stored.at=at;store.put(stored);people.push(stored);}
        };
      }
      for(const p of players){
        const req=store.get(p.id);
        req.onsuccess=()=>{
          const r=req.result||{id:p.id,memberships:[]};
          if(r.at>=at)return;
          if(r.memberships.at(-1)?.faction!==faction||r.memberships.at(-1)?.departed)r.memberships.push({faction,first:at});
          r.name=p.name.slice(0,80);r.at=at;r.memberships.at(-1).last=at;
          store.put(r);people.push(r);
        };
      }
    });people.forEach(p=>combatArchive.people.set(p.id,p));
    if(at-activitySweep>HOUR){
      activitySweep=at;const expired=[...combatArchive.hours.values()].filter(x=>x.hour<hour-30*24*HOUR);
      if(expired.length)await transact('hours',s=>expired.forEach(x=>s.delete(x.id)));
      expired.forEach(x=>combatArchive.hours.delete(x.id));
    }
  }
  async function captureScanner(body,faction,player=0,range=null){
    await archiveReady;
    const meta=body?.meta,at=Date.now(),owner=positive(state.data.meta.ownerId);
    if(range&&(!range.valid()||range.from!==meta?.start||range.end!==meta?.end))return false;
    if(!combatArchive.db||meta?.subject_type!==(player?'player':'faction')||Number(meta.subject_id)!==(player||faction)||
      meta.bucket_seconds!==3600||!Array.isArray(body.buckets)||body.buckets.length>744)throw Error('Unrecognised activity response');
    const rows=[];
    for(const b of body.buckets){
      const hour=b?.ts*1000;
      if(!Number.isInteger(b?.ts)||hour%HOUR!==0||b.ts<meta.start||b.ts>=meta.end||hour>at||hour<at-31*24*HOUR||!Number.isFinite(b.activity_score)||b.activity_score<0)continue;
      const parts=[hour,faction,player,'scanner'];if(player)parts.push(owner);
      rows.push({id:parts.join('/'),hour,faction,player,war:warAt(faction,hour),
        owner,source:'scanner',score:b.activity_score,active:officialNumber(b.active_players),roster:officialNumber(meta.member_count),
        ratio:officialNumber(b.active_ratio),partial:meta.truncated===true,at});
    }
    if(range&&meta.truncated===false&&new Set(rows.map(r=>r.hour)).size===body.buckets.length){
      rows.push({id:range.marker,source:'scanner-range',faction,player,owner:range.owner,at,hour:Math.floor(at/HOUR)*HOUR,
        from:range.coveredFrom,end:range.end});
    }
    await transact('hours',s=>rows.forEach(r=>s.put(r)));rows.forEach(r=>combatArchive.hours.set(r.id,r));
    return true;
  }
  async function loadFactionScanner(){
    if(scannerBusy||document.hidden||!cfg.ffConsent||!cfg.ffEnabled)return;
    const key=ffApiKey(),owner=positive(state.data.meta.ownerId);
    const factions=[...new Set([cfg.enemyId,cfg.ourId].filter(idKey))];
    if(!key||!owner||!factions.length)return;
    if(scannerScope!==key+'/'+owner){scannerScope=key+'/'+owner;scannerAttempts.clear();scannerError='';}
    const due=factions.filter(f=>Date.now()-(scannerAttempts.get(f)||0)>=15*MIN);
    if(!due.length)return;
    scannerBusy=true;scannerError='';
    const valid=()=>cfg.ffConsent&&cfg.ffEnabled&&ffApiKey()===key&&positive(state.data.meta.ownerId)===owner&&!document.hidden;
    try{
      await checkFFRegistration();
      if(!valid())return;
      if(!scouterPremiumActive()){for(const f of due)scannerAttempts.set(f,Date.now());return;}
      for(const faction of due){
        if(!valid()||![cfg.ourId,cfg.enemyId].includes(faction))continue;
        scannerAttempts.set(faction,Date.now());
        const end=Math.floor(Date.now()/HOUR)*3600;
        const q=new URLSearchParams({key,faction_id:faction,start:end-30*86400,end,bucket:3600});
        try{
          const body=await ffRequest('https://ffscouter.com/api/v1/activity/faction?'+q);
          if(!valid()||!scouterPremiumActive())return;
          await captureScanner(body,faction);
        }catch{if(valid())scannerError+=(faction===cfg.enemyId?'Enemy':'Own')+' scanner history unavailable. ';}
      }
    }catch{if(valid()){for(const f of due)scannerAttempts.set(f,Date.now());scannerError='Scanner registration unavailable.';}}
    finally{scannerBusy=false;if(state.open)render();}
  }
  function activityCells(faction,options=activityPrefs,at=Date.now()){
    const cells=new Map();
    if(options.source==='scanner'&&!scouterPremiumActive())return cells;
    const today=Math.floor(at/(24*HOUR))*24*HOUR,cut=today-(options.days-1)*24*HOUR;
    const allowed=(war)=>options.period==='all'||(options.period==='war'?war>0:war===0);
    function bucket(hour){
      if(!cells.has(hour))cells.set(hour,{sum:0,count:0,players:new Set(),roster:0,at:0,received:0,missing:0});
      return cells.get(hour);
    }
    if(options.source==='attack'){
      for(const r of combatArchive.fights.values()){
        if(r.attackerFaction!==faction||r.at<cut||!allowed(r.warId??(r.ranked===false?0:null))||options.player&&r.attacker!==options.player)continue;
        const c=bucket(Math.floor(r.at/HOUR)*HOUR);c.sum++;c.count=1;c.players.add(r.attacker);c.at=Math.max(c.at,r.at);
      }
    }else for(const r of combatArchive.hours.values()){
      if(r.hour<cut||r.hour>at||r.faction!==faction||!allowed(r.war)||r.source!==(options.source==='recent'?'roster':options.source))continue;
      if(r.source==='scanner'&&r.owner!==positive(state.data.meta.ownerId))continue;
      if(options.player?r.player!==options.player:r.source==='scanner'&&r.player)continue;
      const c=bucket(r.hour);if(r.source==='scanner'&&c.at>r.at)continue;
      c.at=Math.max(c.at,r.at);c.roster=Math.max(c.roster,r.roster||0);c.received++;
      if(r.source==='scanner'){c.sum=r.score;c.count=1;c.missing=Number(!!r.partial);c.received=1;}
      else{c.players.add(r.player);c.sum+=options.source==='recent'?r.recent:r.online;c.count+=options.source==='recent'?r.samples:r.samples-r.unknown;c.missing+=r.unknown;}
    }
    if(options.source==='roster'&&!options.player)for(const r of combatArchive.hours.values()){
      if(r.source!=='legacy'||r.hour<cut||r.faction!==faction||!allowed(r.war)||cells.has(r.hour))continue;
      const c=bucket(r.hour);c.sum=r.online;c.count=r.samples;c.at=r.at;c.received=1;
    }
    return cells;
  }
  function weightedCells(cells,filter){
    let sum=0,count=0,days=0;
    for(const [h,c] of cells)if(filter(new Date(h))&&c.count){sum+=c.sum;count+=c.count;days++;}
    return {mean:count?sum/count:null,days,count};
  }
  function forecastWindows(own,enemy,conditions,at){
    const results=[];
    for(const minutes of [30,60,120]){
      let best=null;
      const byHour=new Map();
      for(let step=0;step<48;step++){
        const start=Math.ceil(at/(30*MIN))*30*MIN+step*30*MIN,end=start+minutes*MIN;
        let score=0,coverage=Infinity;
        for(let t=start;t<end;t+=30*MIN){
          const h=new Date(t).getUTCHours();
          if(!byHour.has(h))byHour.set(h,[weightedCells(own,d=>d.getUTCHours()===h),weightedCells(enemy,d=>d.getUTCHours()===h)]);
          const [a,b]=byHour.get(h);
          if(a.days<2||b.days<2){coverage=0;break;}
          coverage=Math.min(coverage,a.days,b.days);
          const heavy=conditions.heavyHours?.[h],skulls=conditions.skullHours?.[h];
          score+=2*a.mean-b.mean+(skulls?.count?0.4*skulls.sum/skulls.count:0)-(heavy?.count?0.5*heavy.sum/heavy.count:0);
        }
        if(!coverage||!conditions.hitterCount||!conditions.targetCount)continue;
        score/=minutes/30;
        const release=conditions.releases.filter(t=>t>=start&&t<end).length;
        const arrivals=conditions.arrivals.filter(t=>t>=start&&t<end).length;
        score+=0.05*Math.min(3,release)-0.05*Math.min(3,arrivals);
        if(start-at<HOUR){
          score+=Math.min(0.3,conditions.targetCount*0.03)+Math.min(0.2,conditions.hitterCount*0.02);
          if(conditions.heavy)score-=0.15*Math.max(0,conditions.heavy-conditions.covered)/conditions.heavy;
          if(conditions.netRate!=null)score+=Math.max(-0.15,Math.min(0.15,conditions.netRate/1000));
          if(conditions.activeHeavy)score-=Math.min(0.2,conditions.activeHeavy*0.025);
        }
        if(!best||score>best.score)best={minutes,start,end,score,coverage,release,arrivals,confidence:coverage>=5?'Moderate':'Limited'};
      }
      results.push(best||{minutes,confidence:'Insufficient coverage'});
    }
    return results;
  }
  function fileDownload(name,type,body){
    const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async function migrateLegacyActivity(){
    if(!combatArchive.db||state.data.meta.hourMigration)return;
    const oldest=Date.now()-30*24*HOUR,rows=[];
    for(const r of Object.values(state.data.warTimelines||{})){
      for(const side of ['ours','enemies']){
        const faction=side==='ours'?r.ourId:r.enemyId;if(!idKey(faction))continue;
        for(const [index,h] of Object.entries(r.sides?.[side]?.hours||{})){
          const hour=Number(index)*HOUR;if(hour<oldest||!h.samples)continue;
          const war=hour>=r.start?r.id:hour+HOUR<=r.start?0:null;
          rows.push({id:[hour,faction,0,war,'legacy'].join('/'),hour,faction,player:0,war,source:'legacy',samples:h.samples,online:h.online,unknown:0,at:Math.min(hour+HOUR,r.updated)});
        }
      }
    }
    await transact('hours',s=>rows.forEach(r=>s.put(r)));rows.forEach(r=>combatArchive.hours.set(r.id,r));
    state.data.meta.hourMigration=1;save();
  }
