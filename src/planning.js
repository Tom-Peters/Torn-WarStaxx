  // Published one-way minutes with and without Mailing Yourself Abroad. Method order
  // is Standard, Airstrip, Private (WLT), Business. Book rounding differs by route.
  const flightTable=[
    ['Mexico',6500,[24,17,12,7],[18,13,9,5]],['Cayman Islands',10000,[33,23,17,10],[25,17,13,8]],
    ['Canada',9000,[39,27,19,12],[29,20,15,9]],['Hawaii',11000,[127,89,63,38],[95,67,48,29]],
    ['United Kingdom',18000,[151,106,75,45],[113,80,57,34]],['Argentina',21000,[158,111,79,47],[119,83,59,35]],
    ['Switzerland',27000,[166,116,83,50],[125,97,62,38]],['Japan',32000,[213,149,107,64],[160,112,80,48]],
    ['China',35000,[229,160,114,69],[172,120,86,52]],['UAE',32000,[257,180,128,77],[193,135,97,58]],
    ['South Africa',40000,[282,197,141,85],[212,148,106,64]]
  ];
  const flyMethods=['Standard','Airstrip','Private','Business'];
  function currentLocation(p,at=Date.now()){
    const place=nativeWarLocation(p);
    if(!['inbound','unknown-travel'].includes(place.phase)||!scouterPremiumActive())return place;
    const o=scouterExtra.flights[p.id],trip=o?.current;
    if(!trip||at<o.at||at-o.at>3*MIN||!(trip.latest>=at))return place;
    const flight=nativeWarLocation({status:'Traveling',statusText:trip.description});
    if(flight.country==='Unknown'||place.country!=='Unknown'&&place.country!==flight.country)return place;
    return {country:flight.country,phase:'inbound',eta:flightLandingEstimate(trip),earliest:trip.earliest,latest:trip.latest,source:'FFScouter flight window'};
  }
  function commandMatch(hitter,enemy){
    const m=matchup(hitter,enemy);
    const dated=id=>{const s=spy(id);return bsScore(s)!==null?s?.observedAt&&Date.now()-s.observedAt<=30*24*HOUR&&s.observedAt<=Date.now():!!reliableBse({id}).value;};
    const ratio=m.known&&dated(hitter.id)&&dated(enemy.id)?m.ratio:null;
    const rows=pairRows(hitter.id,enemy.id),ev=pairEvidence(rows,hitter.id,Date.now(),ratio);
    return {...ev,ratio,last:rows.reduce((a,r)=>Math.max(a,r.at),0)};
  }
  function travelRanking({method,book,enemies,at,overseas}){
    const i=flyMethods.indexOf(method);
    return flightTable.map(([country,cost,normal,withBook])=>{
      const possibilities=(book==='yes'?[withBook]:book==='no'?[normal]:[normal,withBook])
        .flatMap(times=>i<0?times:[times[i]]);
      const min=Math.min(...possibilities),max=Math.max(...possibilities),known=i>=0&&['yes','no'].includes(book);
      const here=enemies.filter(e=>e.known&&e.country===country&&!e.inbound),incoming=enemies.filter(e=>e.known&&e.country===country&&e.inbound);
      const unknown=enemies.filter(e=>!e.known).length,landing=at+max*60000;
      const available=e=>e.ready||(e.hospital&&e.until>0&&e.until<=landing);
      const favourable=[...here.filter(available),...incoming.filter(e=>e.latest&&e.latest+15000<=landing)]
        .filter(e=>e.proven&&!e.hiding);
      const danger=[...here,...incoming].filter(e=>!e.proven);
      const before=incoming.filter(e=>!e.earliest||e.earliest<=landing).length;
      const eligible=known&&min>30,coverage=enemies.length?(enemies.length-unknown)/enemies.length:0;
      const safe=eligible&&coverage===1&&here.length===0&&incoming.length===0;
      const offensive=eligible&&coverage===1&&favourable.length>0&&!danger.length&&overseas!==0;
      const risk=!eligible?(known?'Flight too short':'Choose method and active book'):
        coverage<1?'Enemy locations incomplete':danger.length?'Unproven opponent at or inbound to destination':
        before?'Enemy could arrive before you':incoming.length?'Enemy due after landing':here.length?'Exposed after landing':'Enemies may move after observation';
      const score=(safe?100:0)+(offensive?60:0)+Math.min(180,min)/10-15*danger.length-5*incoming.length-5*unknown;
      return {country,cost,min,max,known,eligible,safe,offensive,here,incoming,before,favourable,coverage,risk,score};
    }).sort((a,b)=>b.score-a.score||a.country.localeCompare(b.country));
  }
  function localWarRules(){
    return cfg.commandRules?.[state.data.war?.id]||{};
  }
  function travelPlan(){
    const me=state.data.ours.find(p=>p.id===state.data.meta.ownerId),at=Date.now();
    const enemies=state.data.enemies.map(p=>{
      const loc=currentLocation(p,at),kind=memberState(p);
      return {id:p.id,name:p.name,country:loc.country,inbound:loc.phase==='inbound',
        known:p.updated<=at&&at-p.updated<=3*MIN&&loc.country!=='Unknown'&&
          ['present','abroad','inbound'].includes(loc.phase)&&!loc.source.startsWith('Prior'),
        earliest:loc.earliest||loc.eta,latest:loc.latest||loc.eta,ready:kind==='okay'||loc.phase==='abroad',
        hospital:kind==='hospital',until:p.until,hiding:!p.lastAt||at-p.lastAt>168*HOUR,
        proven:!!me&&commandMatch(me,p).category==='Proven favourable matchup'};
    });
    const expected=state.data.factionBasic[cfg.enemyId];
    if(expected?.observed&&at-expected.observed<30*MIN&&expected.members>enemies.length){
      for(let i=enemies.length;i<Math.min(100,expected.members);i++)enemies.push({known:false});
    }
    return travelRanking({method:cfg.flightMethod,book:cfg.flightBook,enemies,at,overseas:localWarRules().overseas});
  }
  function suggestedAssignments(){
    const bands=enemyRoleBands(),loads={},assignments=commandRoom()?.plan.assignments||{};
    for(const a of Object.values(assignments))loads[a.primary]=(loads[a.primary]||0)+1;
    const result=[],skulls=state.data.ours.filter(p=>cfg.blackSkulls[p.id]);
    const targets=state.data.enemies.filter(p=>bands.heavy.has(p.id)).sort((a,b)=>
      (reliableBse(b).value||0)-(reliableBse(a).value||0)||a.id-b.id);
    for(const [index,target] of targets.entries()){
      const candidates=skulls.map(p=>{
        const ev=commandMatch(p,target),loc=currentLocation(p),targetPlace=currentLocation(target);
        const available=p.updated<=Date.now()&&Date.now()-p.updated<3*MIN&&
          ['Online','Idle'].includes(p.lastAction)&&['abroad','present'].includes(loc.phase)&&
          ['okay','away'].includes(memberState(p))&&loc.country!=='Unknown'&&loc.country===targetPlace.country&&hitterReadiness(p).energyEnough!==false;
        return {p,ev,available};
      }).filter(x=>['Proven favourable matchup','Possible favourable matchup'].includes(x.ev.category))
        .sort((a,b)=>Number(b.available)-Number(a.available)||Number(b.ev.category.startsWith('Proven'))-Number(a.ev.category.startsWith('Proven'))||
          (loads[a.p.id]||0)-(loads[b.p.id]||0)||a.p.id-b.p.id);
      const saved=Object.entries(cfg.assignments).find(([i,t])=>t===target.id&&candidates.some(x=>x.p.id===Number(i)));
      if(saved&&!assignments[target.id]){
        const index=candidates.findIndex(x=>x.p.id===Number(saved[0]));
        candidates.unshift(...candidates.splice(index,1));
      }
      const first=candidates[0];
      if(first&&!assignments[target.id])loads[first.p.id]=(loads[first.p.id]||0)+1;
      result.push({target,candidates,primary:first?.p.id,backups:candidates.slice(1,21).map(x=>x.p.id),priority:Math.max(1,100-index),reasons:bands.reasons.get(target.id)||[]});
    }
    return result;
  }
  function forecastContext(){
    const scope=commandRoom(),at=Date.now(),bands=enemyRoleBands();
    const hitters=state.data.ours.filter(p=>p.updated<=at&&at-p.updated<=5*MIN&&['Online','Idle'].includes(p.lastAction)&&
      ['okay','away'].includes(memberState(p))&&['present','abroad'].includes(currentLocation(p).phase)&&hitterReadiness(p).energyEnough!==false);
    const suitable=new Set();
    const targets=state.data.enemies.filter(p=>p.updated<=at&&at-p.updated<=5*MIN&&['okay','away'].includes(memberState(p))&&
      ['abroad','present'].includes(currentLocation(p).phase)).filter(p=>{
      let viable=false;
      for(const h of hitters)if(currentLocation(h).country===currentLocation(p).country&&roleAllows(h,p,bands)&&
        !['Avoid or reassess','Insufficient evidence'].includes(commandMatch(h,p).category)){suitable.add(h.id);viable=true;}
      return viable;
    });
    const enemyFresh=state.data.enemies.filter(p=>p.updated<=at&&at-p.updated<=5*MIN);
    const releases=enemyFresh.filter(p=>memberState(p)==='hospital'&&p.until>at).map(p=>p.until);
    const arrivals=enemyFresh.map(p=>currentLocation(p)).filter(l=>l.phase==='inbound'&&l.eta>at).map(l=>l.eta);
    const heavyHours={},skullHours={};
    for(const r of combatArchive.hours.values()){
      if(r.source!=='roster'||at-r.hour>30*24*HOUR)continue;
      const profile=r.faction===cfg.ourId&&cfg.blackSkulls[r.player]?skullHours:r.faction===cfg.enemyId&&bands.heavy.has(r.player)?heavyHours:null;
      if(profile){const h=new Date(r.hour).getUTCHours(),bucket=profile[h]||(profile[h]={sum:0,count:0});bucket.sum+=r.online;bucket.count+=r.samples-r.unknown;}
    }
    const pace=warPace();
    return {hitters:hitters.filter(h=>suitable.has(h.id)),targets,hitterCount:suitable.size,targetCount:targets.length,releases,arrivals,heavyHours,skullHours,
      netRate:pace?.measurable&&at-pace.last.at<5*MIN?pace.netRate:null,
      covered:Object.keys(scope?.plan.assignments||{}).length,heavy:bands.heavy.size,
      activeHeavy:enemyFresh.filter(p=>isOnline(p)&&bands.heavy.has(p.id)).length};
  }
  function forecastReport(){
    const opts={days:30,source:'roster',period:'all',player:0},context=forecastContext();
    const at=preparingWar()?Math.max(Date.now(),epochMs(state.data.war.start)):Date.now();
    const windows=forecastWindows(activityCells(cfg.ourId,opts),activityCells(cfg.enemyId,opts),context,at);
    return {context,windows};
  }
  function commandPosture(){
    if(preparingWar())return 'Pre-war';
    if(!activeWarNow()||!rosterFresh('ours')||!rosterFresh('enemies'))return 'Recovery';
    const chain=chainStatus();
    if(chain.fresh&&chain.count>=10&&chain.remaining>0&&chain.remaining<=80)return 'Chain focus';
    const room=commandRoom();
    if(Object.values(room?.ops.states||{}).some(s=>['LOCKED_UNAVAILABLE','REASSIGNMENT_READY'].includes(s.phase)))return 'Black Skull suppression';
    const exposed=protectionPriorities().filter(x=>x.exposed&&x.feedFresh&&x.impact.underFire);
    if(exposed.length)return 'Defensive turtling';
    const pace=warPace();if(pace?.measurable&&Date.now()-pace.last.at<5*MIN&&pace.netRate>0)return 'Aggressive scoring';
    return 'Balanced';
  }
