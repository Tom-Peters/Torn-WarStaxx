  const gridWeekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const gridUnits={users:'players',roster:'% online',recent:'% recently active',scanner:'scanner score',attack:'attacks'};
  const gridSources={premium:'FFScouter faction activity',local:'Torn roster checks',score:'FFScouter scanner score',attack:'Captured attacks',legacy:'Archived roster totals'};

  // The latest ranked-war list covers only the period back to its oldest returned start.
  function gridCalendar(faction,at){
    const side=faction===cfg.ourId?'ourWars':'enemyWars',history=state.data[side]||[];
    const fetched=state.data.updated[side]||0,intervals=[];
    const add=(start,end,ongoing=false)=>{
      if(start>0&&end>=start)intervals.push([start,end,ongoing]);
    };
    for(const war of history)if(war.factions?.includes(faction))
      add(epochMs(war.start),war.end?epochMs(war.end):fetched,!war.end);
    const current=state.data.war;
    if(current&&current.factions?.some(f=>f.id===faction))add(epochMs(current.start),current.observed,true);
    const complete=history.length&&history.every(w=>w.start&&w.factions?.includes(faction));
    const oldest=complete?Math.min(...history.map(w=>epochMs(w.start))):Infinity;
    return (hour,tags)=>{
      const end=Math.min(hour+HOUR,at);
      const overlaps=intervals.filter(([a,b])=>a<end&&b>hour);
      if(overlaps.length)return overlaps.some(([a,b,ongoing])=>a<=hour&&(b>=end||ongoing&&tags?.has('war')))?'war':'mixed';
      if(tags?.has('war'))return tags.has('peace')?'mixed':'war';
      if((hour>=oldest&&end<=fetched)||tags?.has('peace'))return 'peace';
      return 'unknown';
    };
  }
  function gridMemberships(faction,player,record){
    const spans=(record?.memberships||[]).filter(m=>m.faction===faction);
    if(player?.daysInFaction>0&&player.updated>0)spans.push({first:player.updated-player.daysInFaction*24*HOUR,last:player.updated});
    return spans;
  }
  function trackerSeries(faction,opts,at){
    const day=24*HOUR,start=Math.floor(at/day)*day-(opts.days-1)*day;
    const buckets=new Map(),out=new Map(),calendar=gridCalendar(faction,at);
    const owner=positive(state.data.meta.ownerId),premium=owner&&scouterPremiumActive();
    const within=h=>Number.isSafeInteger(h)&&h%HOUR===0&&h>=start&&h<=at;
    const get=h=>{
      if(!buckets.has(h))buckets.set(h,{active:new Set(),seen:new Set(),attackers:new Set(),scoped:new Set(),tags:new Set(),
        checks:0,online:0,recent:0,recentChecks:0,attacks:0,roster:0,unknown:0,idlePartial:false,localAt:0,attackAt:0});
      return buckets.get(h);
    };
    const side=faction===cfg.ourId?'ours':'enemies';
    const roster=state.data[side]||[];
    const memberships=new Map();
    function memberDuring(id,hour){
      if(!memberships.has(id)){
        memberships.set(id,gridMemberships(faction,roster.find(p=>p.id===id),combatArchive.people.get(id)));
      }
      return memberships.get(id).some(m=>m.first<=hour&&m.last>=Math.min(hour+HOUR,at));
    }
    for(const r of combatArchive.hours.values()){
      if(r.faction!==faction||!within(r.hour)||opts.player&&r.player!==opts.player)continue;
      if(r.source==='scanner'){
        if(premium&&r.owner===owner&&r.player===opts.player&&(!r.player||memberDuring(r.player,r.hour))){
          const b=get(r.hour);if(!b.scan||b.scan.at<=r.at)b.scan=r;
        }
        continue;
      }
      if(r.source==='legacy'){if(!opts.player)get(r.hour).legacy=r;continue;}
      if(r.source!=='roster'||!r.player)continue;
      const b=get(r.hour),known=r.samples-r.unknown;
      b.scoped.add(r.player);b.localAt=Math.max(b.localAt,r.at);b.roster=Math.max(b.roster,r.roster||0);
      if(r.war>0)b.tags.add('war');else if(r.war===0&&(r.periodVerified||side==='ours'))b.tags.add('peace');
      if(known>0){
        b.checks+=known;b.online+=r.online;
        if(!opts.idle||r.idleKnown>0||r.online>0)b.seen.add(r.player);
        if(r.online>0||opts.idle&&r.idle>0)b.active.add(r.player);
        if(opts.idle&&(r.idleKnown||0)<known)b.idlePartial=true;
      }
      b.unknown+=r.unknown||0;
      if(r.datedChecks>0){b.recent+=r.recentDated;b.recentChecks+=r.datedChecks;}
      else if(r.datedChecks==null&&r.recent===r.samples&&r.samples>0){b.recent+=r.samples;b.recentChecks+=r.samples;}
    }
    // Side-only records from older installers need independent membership evidence.
    for(const p of roster){
      if(opts.player&&opts.player!==p.id)continue;
      for(const [i,s] of Object.entries(state.data.activity?.[side+':'+p.id]?.hours||{})){
        const hour=Number(i)*HOUR;
        if(!within(hour)||!(s.online>0&&s.online<=s.count)||buckets.get(hour)?.scoped.has(p.id))continue;
        if(!memberDuring(p.id,hour))continue;
        const b=get(hour);b.active.add(p.id);b.seen.add(p.id);
        b.legacyNames=true;if(opts.idle)b.idlePartial=true;
      }
    }
    for(const r of combatArchive.fights.values()){
      const hour=Math.floor(r.at/HOUR)*HOUR;
      if(!within(hour)||r.at>at||r.attackerFaction!==faction||opts.player&&r.attacker!==opts.player)continue;
      const b=get(hour);b.attacks++;b.attackAt=Math.max(b.attackAt,r.at);
      if(r.attacker)b.attackers.add(r.attacker);
      if(r.warId||r.ranked)b.tags.add('war');
    }
    for(const [hour,b] of buckets){
      const period=calendar(hour,b.tags);
      if(opts.period!=='all'&&period!==opts.period)continue;
      const scan=b.scan;
      let value=null,source='',roster=null,partial=false,last=null,checks=null;
      if(opts.source==='users'&&!opts.player&&!opts.idle&&Number.isSafeInteger(scan?.active)&&scan.active>=0){
        value=scan.active;source='premium';roster=scan.roster;partial=scan.partial;last=scan.at;
      }else if(opts.source==='users'&&b.seen.size){
        value=b.active.size;source='local';roster=opts.player?1:b.roster||null;last=b.localAt||null;checks=b.checks||null;
        partial=b.idlePartial||b.legacyNames||!roster||b.seen.size<roster;
      }else if(opts.source==='scanner'&&Number.isFinite(scan?.score)){
        value=scan.score;source='score';roster=scan.roster;partial=scan.partial;last=scan.at;
      }else if(opts.source==='attack'&&b.attacks){
        value=b.attacks;source='attack';last=b.attackAt;
      }else if((opts.source==='roster'&&b.checks)||(opts.source==='recent'&&b.recentChecks)){
        checks=opts.source==='roster'?b.checks:b.recentChecks;
        value=100*(opts.source==='roster'?b.online:b.recent)/checks;
        source='local';last=b.localAt;roster=opts.player?1:b.roster||null;partial=b.unknown>0||!roster||b.seen.size<roster;
      }else if(opts.source==='roster'&&b.legacy?.samples>0){
        checks=b.legacy.samples;value=100*b.legacy.online/checks;source='legacy';last=b.legacy.at;partial=true;
      }
      if(value!==null)out.set(hour,{value,source,period,roster,partial:!!partial,last,checks,dates:1,
        names:b.active,seen:b.seen.size,attackers:b.attackers,attacks:b.attacks});
    }
    return out;
  }
  function trackerAverage(cells){
    if(!cells.length)return null;
    // Do not blend scanner activity and live online statuses into one average.
    const source=cells.find(c=>c.source==='premium')?.source||cells.find(c=>c.source==='local')?.source||cells[0].source;
    const used=cells.filter(c=>c.source===source),dates=used.length,periods=new Set(used.map(c=>c.period));
    return {source,value:used.reduce((v,c)=>v+c.value,0)/dates,dates,excluded:cells.length-dates,
      period:periods.size===1?used[0].period:'mixed',partial:used.some(c=>c.partial),
      last:Math.max(...used.map(c=>c.last||0))||null,
      names:new Set(used.flatMap(c=>[...c.names])),attackers:new Set(used.flatMap(c=>[...c.attackers])),attacks:used.reduce((v,c)=>v+c.attacks,0)};
  }
  function trackerDifference(a,b){
    if(!a||!b||a.source!==b.source||a.partial||b.partial)return null;
    return {value:a.value-b.value,source:a.source,period:a.period===b.period?a.period:'mixed',a,b,dates:1,
      partial:false,last:Math.max(a.last||0,b.last||0)||null};
  }
  function trackerModel(opts=activityPrefs,at=Date.now()){
    const day=24*HOUR,today=Math.floor(at/day)*day;
    const dates=Array.from({length:opts.days},(_,i)=>today-i*day);
    const sides=[['ours',cfg.ourId,'Our faction'],['enemies',cfg.enemyId,'Enemy faction']].filter(([,id])=>idKey(id));
    const groups=sides.map(([key,id,side])=>{
      const name=state.data.factionBasic[id]?.name||state.data.war?.factions?.find(f=>f.id===id)?.name||
        (key==='enemies'&&state.data.war?.opponentId===id?state.data.war.opponentName:'');
      return {key,id,title:side+(name?' / '+name:'')+' #'+id,series:trackerSeries(id,opts,at)};
    });
    const rows=opts.mode==='weekday'?[1,2,3,4,5,6,0,-1].map(d=>({key:d,label:d===-1?'All days':gridWeekdays[d],
      dates:dates.filter(t=>d===-1||new Date(t).getUTCDay()===d)})):
      dates.map(t=>({key:t,label:gridWeekdays[new Date(t).getUTCDay()]+' '+new Date(t).toISOString().slice(5,10),dates:[t]}));
    const compare=opts.mode==='compare';
    let tables=groups.slice();
    if(compare){
      tables=[];
      if(groups.length===2){
        const matched=new Map();
        for(const [hour,ours] of groups[0].series){
          const difference=trackerDifference(ours,groups[1].series.get(hour));
          if(difference)matched.set(hour,difference);
        }
        tables.push({key:'compare',id:0,title:'Our faction minus enemy',series:matched});
      }
    }else if(opts.first==='enemies')tables.reverse();
    let peak=0;
    for(const t of tables)t.rows=rows.map(row=>({...row,cells:Array.from({length:24},(_,h)=>{
      const cells=row.dates.map(d=>t.series.get(d+h*HOUR)).filter(Boolean);
      const c=opts.mode==='weekday'?trackerAverage(cells):cells[0];
      if(c)peak=Math.max(peak,Math.abs(c.value));
      return c;
    })}));
    return {groups,tables,peak,compare};
  }
  function trackerCSV(model,opts){
    const csv=['faction_id,comparison_ours_id,comparison_enemy_id,player_filter,view,utc_date_or_weekday,hour_tct,metric,include_idle,value,our_value,enemy_value,source,period,sampled_dates,partial,last_checked_utc'];
    for(const t of model.tables)for(const row of t.rows)row.cells.forEach((c,h)=>{
      const label=opts.mode==='weekday'?row.label:new Date(row.key).toISOString().slice(0,10);
      csv.push([t.id||'',model.compare?model.groups[0].id:'',model.compare?model.groups[1].id:'',opts.player||'',opts.mode,label,String(h).padStart(2,'0'),opts.source,opts.source==='users'&&opts.idle,
        c?.value??'',c?.a?.value??'',c?.b?.value??'',c?gridSources[c.source]:'',c?.period||'',c?.dates??'',c?.partial??'',c?.last?new Date(c.last).toISOString():''].join(','));
    });
    return csv.join('\r\n');
  }
