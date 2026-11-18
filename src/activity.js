  const activityPrefs={days:7,period:'all',player:0,source:'roster'};
  let activitySweep=0,scannerAttempt=0,scannerBusy=false,scannerError='';
  function warAt(faction,at){
    const current=state.data.war;
    if(current&&[cfg.ourId,current.opponentId].includes(faction)&&at>=epochMs(current.start)&&at<=n(current.observed))return current.id;
    for(const w of [...state.data.ourWars,...state.data.enemyWars])
      if(w.factions?.includes(faction)&&at>=epochMs(w.start)&&at<=epochMs(w.end))return w.id;
    return null;
  }
  async function captureRoster(side,players,at,war){
    await archiveReady;if(!combatArchive.db||!players.length)return;
    const faction=side==='ours'?cfg.ourId:cfg.enemyId,hour=Math.floor(at/HOUR)*HOUR;
    const rows=[];
    await transact('hours',store=>{
      for(const p of players){
        const key=[hour,faction,p.id,war??'unknown','roster'].join('/');
        const req=store.get(key);
        req.onsuccess=()=>{
          const r=req.result||{id:key,hour,faction,player:p.id,war,source:'roster',samples:0,online:0,recent:0,unknown:0,away:0};
          if(r.at>=at) return;
          r.samples++;r.online+=Number(isOnline(p));r.unknown+=Number(!['Online','Idle','Offline'].includes(p.lastAction));
          r.recent+=Number(p.lastAt>0&&at-p.lastAt>=0&&at-p.lastAt<=15*MIN);
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
  async function captureScanner(body,faction,player=0){
    await archiveReady;
    const meta=body?.meta,at=Date.now();
    if(!combatArchive.db||meta?.subject_type!==(player?'player':'faction')||Number(meta.subject_id)!==(player||faction)||
      meta.bucket_seconds!==3600||!Array.isArray(body.buckets)||body.buckets.length>744)throw Error('Unrecognised activity response');
    const rows=[];
    for(const b of body.buckets){
      const hour=b.ts*1000;
      if(!Number.isInteger(b.ts)||b.ts<meta.start||b.ts>=meta.end||hour>at||hour<at-31*24*HOUR||!Number.isFinite(b.activity_score)||b.activity_score<0)continue;
      rows.push({id:[hour,faction,player,'scanner'].join('/'),hour,faction,player,war:warAt(faction,hour),
        owner:positive(state.data.meta.ownerId),source:'scanner',score:b.activity_score,active:officialNumber(b.active_players),roster:officialNumber(meta.member_count),
        ratio:officialNumber(b.active_ratio),partial:meta.truncated===true,at});
    }
    await transact('hours',s=>rows.forEach(r=>s.put(r)));rows.forEach(r=>combatArchive.hours.set(r.id,r));
  }
  async function loadFactionScanner(){
    if(scannerBusy||document.hidden||Date.now()-scannerAttempt<15*MIN||!cfg.ffConsent||!cfg.ffEnabled)return;
    const key=ffApiKey(),factions=[...new Set([cfg.ourId,cfg.enemyId].filter(idKey))];
    if(!key||!factions.length)return;
    scannerBusy=true;scannerAttempt=Date.now();scannerError='';
    try{
      await checkFFRegistration();if(!scouterPremiumActive())throw Error('Premium entitlement required');
      for(const faction of factions){
        const end=Math.floor(Date.now()/HOUR)*3600;
        const q=new URLSearchParams({key,faction_id:faction,start:end-30*86400,end,bucket:3600});
        const body=await ffRequest('https://ffscouter.com/api/v1/activity/faction?'+q);
        if(key!==ffApiKey()||!scouterPremiumActive()||document.hidden)return;
        await captureScanner(body,faction);
      }
    }catch{scannerError='Scanner history unavailable. Check Premium entitlement and provider coverage.';}
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
      const c=bucket(r.hour);c.at=Math.max(c.at,r.at);c.roster=Math.max(c.roster,r.roster||0);c.received++;
      if(r.source==='scanner'){c.sum+=r.score;c.count++;if(r.partial)c.missing++;}
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
  function gridValue(c,source){
    if(!c||!c.count)return '-';
    return source==='roster'||source==='recent'?Math.round(100*c.sum/c.count)+'%':fmt(c.sum/c.count);
  }
  function gridTable(faction,title,opts){
    const cells=activityCells(faction,opts),midnight=Math.floor(Date.now()/(24*HOUR))*24*HOUR;
    const headers=Array.from({length:24},(_,i)=>'<th>'+String(i).padStart(2,'0')+'</th>').join('');
    const tr=(name,items)=>'<tr><th scope="row">'+esc(name)+'</th>'+items.join('')+'</tr>';
    const td=(c)=>'<td style="background:'+(c?.count?'rgba(0,178,207,'+(0.13+0.67*Math.min(1,c.sum/c.count/(opts.source==='scanner'?10:1)))+')':'transparent')+'">'+gridValue(c,opts.source)+'</td>';
    let rows='';
    for(let day=0;day<opts.days;day++){
      const date=midnight-day*24*HOUR;
      rows+=tr(new Date(date).toISOString().slice(5,10),Array.from({length:24},(_,i)=>td(cells.get(date+i*HOUR))));
    }
    const means=(filter)=>Array.from({length:24},(_,i)=>{const v=weightedCells(cells,d=>filter(d)&&d.getUTCHours()===i);return td(v.mean===null?null:{count:1,sum:v.mean});});
    rows+=tr('Average',means(()=>true));
    for(let d=0;d<7;d++)rows+=tr(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d],means(x=>x.getUTCDay()===d));
    const last=Math.max(0,...[...cells.values()].map(c=>c.at)),coverage=[...cells.values()].filter(c=>c.count).length;
    return card(title,'<p>'+coverage+' sampled hour(s) / '+opts.days+' UTC dates. Latest '+esc(stamp(last))+'. Dash = missing.</p><div class="ws-hour-scroll" tabindex="0"><table><thead><tr><th>TCT</th>'+headers+'</tr></thead><tbody>'+rows+'</tbody></table></div>');
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
