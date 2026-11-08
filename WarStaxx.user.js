// ==UserScript==
// @name         War-TornStaxx - Ranked War Intelligence
// @namespace    https://github.com/Tom-Peters/Torn-WarStaxx
// @homepageURL  https://github.com/Tom-Peters/Torn-WarStaxx
// @supportURL   https://github.com/Tom-Peters/Torn-WarStaxx/issues
// @version      1.5.20
// @description  Ranked-war strategy, roster monitoring, prior-war intelligence, verified FF observations and player assignments.
// @author       IamEEKY
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      ffscouter.com
// @updateURL    https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js
// @downloadURL  https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js
// ==/UserScript==
/* TornStaxx 4.0 module fallback \u2014 compact, local-only and no remote dependencies. */
(function(){
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||typeof location==='undefined'||window.top!==window.self||
     !/^(www\.)?torn\.com$/i.test(location.hostname)||window.__TornStaxxFallbackBooted)return;
  window.__TornStaxxFallbackBooted=true;
  function mount(){
    if(!document.body||typeof document.body.append!=='function'||typeof document.getElementById!=='function'||typeof document.createElement!=='function')return;
    if(document.getElementById('staxx-hub-root')||document.getElementById('staxx-fallback-root'))return;
    const entries=new Map(),root=document.createElement('div'),button=document.createElement('button'),menu=document.createElement('div');
    root.id='staxx-fallback-root';
    root.style.cssText='position:fixed;left:5px;top:42%;z-index:2147483645;font:13px system-ui,sans-serif;color:#effaff;';
    button.type='button';button.textContent='S';button.title='Open TornStaxx tools (install TornStaxx for the full hub)';
    button.setAttribute('aria-label','Open installed TornStaxx tools');
    button.style.cssText='width:42px;height:48px;border-radius:0 12px 12px 0;border:1px solid #55d7fa;background:#0a4d76;color:#c9f5ff;font-size:22px;font-weight:900;';
    menu.hidden=true;
    menu.style.cssText='position:absolute;top:0;left:49px;width:min(246px,calc(100vw - 62px));padding:12px;background:#08192d;border:1px solid #396e93;border-radius:12px;box-shadow:0 10px 24px #0009;max-height:65vh;overflow:auto;';
    const title=document.createElement('strong');title.textContent='TornStaxx \u00b7 module mode';title.style.color='#65d9ff';menu.append(title);
    const note=document.createElement('p');note.textContent='Install the separate TornStaxx script for the full dashboard and shared alerts.';note.style.cssText='font-size:11px;color:#b6d0e6;line-height:1.4';menu.append(note);
    const links=document.createElement('div');menu.append(links);
    function draw(){
      links.replaceChildren();
      for(const [id,entry] of entries){
        const item=document.createElement('button');item.type='button';item.textContent=entry.label;
        item.style.cssText='display:block;width:100%;text-align:left;margin:6px 0;padding:10px;background:#113452;border:1px solid #34749a;border-radius:8px;color:#e8f6ff;font:inherit;';
        item.addEventListener('click',()=>{menu.hidden=true;document.dispatchEvent(new CustomEvent('staxx:open',{detail:{id}}));});
        links.append(item);
      }
    }
    button.addEventListener('click',()=>{menu.hidden=!menu.hidden;if(!menu.hidden)draw();});
    root.append(button,menu);
    document.body.append(root);
    document.addEventListener('staxx:register',e=>{
      const d=e.detail||{};
      if(!/^[a-z][a-z0-9-]{0,31}$/.test(d.id||''))return;
      entries.set(d.id,{label:String(d.label||d.id).slice(0,64)});if(!menu.hidden)draw();
    });
    document.addEventListener('staxx:panel',e=>{root.style.display=e.detail?.open?'none':'';});
    document.dispatchEvent(new CustomEvent('staxx:ping'));
    const timer=setInterval(()=>{if(document.getElementById('staxx-hub-root'))root.remove();if(!root.isConnected)clearInterval(timer);},2500);
  }
  // Emergency launcher must never prevent the dedicated War module from loading.
  const safeMount=()=>{try{mount();}catch(err){
    window.__TornStaxxFallbackError='Emergency launcher failed ('+(err?.name||'Error')+')';
  }};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',safeMount,{once:true});else safeMount();
})();

/* WarStaxx loader probe \u00b7 independent of the optional API and full WarStaxx UI */
(function () {
  'use strict';
  if (typeof document === 'undefined' || typeof window === 'undefined' ||
      !/^(www\.)?torn\.com$/i.test(location.hostname) ||
      window.top !== window.self || window.__warStaxxProbe) return;
  window.__warStaxxProbe = true;
  const id='war', version='1.5.17';
  function emit(name,detail) {
    try{document.dispatchEvent(new CustomEvent('staxx:'+name,{detail}));}catch(_){}
  }
  const bridge='tornstaxx-war-v1';
  // DOM elements are visible to all userscript worlds even when globals, events,
  // session storage or GM storage are isolated by the Torn PDA WebView.
  function domEvidence(){
    try{
      if(!document.documentElement)return;
      let probe=document.getElementById('tornstaxx-war-execution-probe');
      if(!probe){
        probe=document.createElement('span');
        probe.id='tornstaxx-war-execution-probe';
        probe.hidden=true;
        probe.style.display='none';
        document.documentElement.appendChild(probe);
      }
      probe.dataset.id=id;
      probe.dataset.version=version;
      probe.dataset.phase=window.__warStaxxReady?'ready':window.__warStaxxStartError?'error':'loader';
      probe.dataset.observed=String(Date.now());
    }catch(_){/* Never block normal userscript execution for diagnostics. */}
  }
  domEvidence();
  function runtimeMarker(){
    try {
      localStorage.setItem('tornstaxx-war-runtime-v1',JSON.stringify({
        id,version,at:Date.now(),path:location.pathname,
        phase:window.__warStaxxReady?'ready':window.__warStaxxStartError?'error':'loader'
      }));
    }catch(_){} // Storage can be blocked in Torn PDA; DOM bridge still works.
  }
  function register() {
    domEvidence();
    runtimeMarker();
    // A running loader is not proof that the full War UI has started.
    if(!window.__warStaxxReady){
      emit('diagnostics',{id,version,api:'unknown',storage:'unknown',ui:'missing',
        detail:window.__warStaxxStartError?'War module startup failed':'War loader detected; waiting for panel'});
      return;
    }
    // Identity-only registration fallback for Torn PDA isolated script contexts.
    try {window.postMessage({__tornstaxxBridge:bridge,kind:'register',id},location.origin);}catch(_){}
    emit('register',{id,label:'War-TornStaxx',icon:'WS',
      desc:'Ranked war command centre',
      sections:[{id:'overview',label:'Command'},{id:'targets',label:'Targets'},
        {id:'matchups',label:'Matchups'},{id:'strategy',label:'Strategy'},
        {id:'assignments',label:'Orders'},{id:'settings',label:'Settings'}]});
  }
  let fallback=null;
  function closeFallback(){
    if(fallback){fallback.remove();fallback=null;}
    emit('panel',{id,open:false});
  }
  function openFallback(){
    if(window.__warStaxxReady)return;
    if(!fallback){
      fallback=document.createElement('section');
      fallback.id='warstaxx-startup-help';
      fallback.setAttribute('role','dialog');
      fallback.setAttribute('aria-label','WarStaxx startup diagnostics');
      fallback.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:#021024dd;padding:14px;font:14px/1.5 system-ui,sans-serif;color:#e4f6ff;';
      const card=document.createElement('div');
      card.style.cssText='width:min(480px,100%);border:1px solid #458bb8;border-radius:12px;padding:20px;background:#09233d;box-shadow:0 15px 45px #0009;';
      const title=document.createElement('h2');
      title.textContent='WarStaxx is loaded but could not open';
      title.style.cssText='margin:0 0 12px;font-size:18px;color:#6cdfff;';
      const message=document.createElement('p');
      message.textContent='The lightweight launcher is active, but the full WarStaxx interface has not completed startup. Reload Torn; if this persists, share the status below (no API keys are included).';
      const status=document.createElement('p');
      status.textContent='Version '+version+' \u00b7 App entered: '+(window.__warStaxxBooted?'yes':'no')+
        ' \u00b7 App ready: '+(window.__warStaxxReady?'yes':'no')+
        (window.__warStaxxStartError?' \u00b7 Failure: '+window.__warStaxxStartError:'');
      const copy=document.createElement('button');copy.type='button';copy.textContent='Copy startup status';
      copy.style.cssText='padding:9px 12px;background:#19547a;color:#fff;border:1px solid #67c6ed;border-radius:8px;margin-right:8px;';
      copy.addEventListener('click',()=>{
        const t='WarStaxx '+version+' \u00b7 main-entry='+!!window.__warStaxxBooted+' \u00b7 ready='+!!window.__warStaxxReady+' \u00b7 page='+location.pathname;
        if(navigator.clipboard?.writeText)navigator.clipboard.writeText(t).catch(()=>{status.textContent=t;});
        else status.textContent=t;
      });
      const close=document.createElement('button');close.type='button';close.textContent='Close';
      close.style.cssText='padding:9px 12px;background:#17334c;color:#fff;border:1px solid #466e8c;border-radius:8px;';
      close.addEventListener('click',closeFallback);
      card.append(title,message,status,copy,close);fallback.appendChild(card);
      (document.body||document.documentElement).appendChild(fallback);
    }
    emit('panel',{id,open:true});
  }
  document.addEventListener('staxx:ping',register);
  window.addEventListener('message',e=>{
    if((e.source&&e.source!==window)||e.origin!==location.origin)return;
    const d=e.data;
    if(d?.__tornstaxxBridge!==bridge||d.kind!=='open'||d.id!==id)return;
    if(!window.__warStaxxReady)openFallback();
  });
  document.addEventListener('staxx:open',e=>{
    if(e.detail?.id===id&&!window.__warStaxxReady)openFallback();
  });
  document.addEventListener('staxx:closeall',closeFallback);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});
  register();
  setTimeout(register,1000);
  setTimeout(register,3500);
  setInterval(()=>{if(!document.hidden)register();},30000);
})();


(function () {
  'use strict';
  if (typeof document === 'undefined' || !/^(www\.)?torn\.com$/i.test(location.hostname) ||
      window.top !== window.self || window.__warStaxxBooted) return;
  window.__warStaxxBooted = true;
  const ID='war', VER='1.5.20', CONFIG='warstaxx-config-v1', DATA='warstaxx-data-v1';
  const API='https://api.torn.com/v2', MIN=60000, HOUR=3600000;
  const sections=['overview','enemy','reports','leader','skulls','commander','operations','ledger','threats','control','turtle','command','pace','afteraction','targets','matchups','timeline','intel','history','activity','strategy','assignments','alerts','settings','diagnostics'];
  const labels={overview:'01 | ACT NOW',enemy:'02 | OPPONENT',reports:'03 | REPORTS',leader:'Skull Capo command',skulls:'Black Skulls',commander:'Quick command',operations:'Operations',ledger:'Hit ledger',threats:'Enemy threats',control:'Hospital control',turtle:'Turtling',command:'Leadership',pace:'War pace',afteraction:'After action',intel:'Enemy intel',targets:'Players',matchups:'Matchups',timeline:'War timelines',strategy:'Strategy',activity:'Activity',history:'Past wars',assignments:'Orders',alerts:'Alerts',settings:'Settings',diagnostics:'Diagnostics'};
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const positive=v=>Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v):0;
  const fmt=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(Number(v)):'\u2014';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeRead=(k,def)=>{try{return JSON.parse(localStorage.getItem(k))||def;}catch(_){return def;}};
  const stamp=t=>t?new Date(t).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' TCT':'Not recorded';
  const age=t=>t?Math.max(0,Math.floor((Date.now()-t)/MIN))+'m ago':'Not collected';
  const link=id=>'https://www.torn.com/profiles.php?XID='+positive(id);
  const attackLink=id=>'https://www.torn.com/loader.php?sid=attack&user2ID='+positive(id);
  const apiKeyPda=typeof window.PDA_APIKEY==='string'?window.PDA_APIKEY:'###PDA-APIKEY###';
  const defaults={key:'',ourId:0,enemyId:0,factionAuto:true,factionSource:'',factionVerifiedAt:0,refreshSeconds:120,historyLimit:12,enableAttacks:false,autoConceded:true,ffEnabled:false,ffConsent:false,ffKey:'',assignments:{},ordersByEnemy:{},turtlePlans:{},controlAssignments:{},blackSkulls:{},spies:{},notes:{},watchlist:{},planStatus:{},leaderNotes:{},manualReadiness:{},autoOwnerReadiness:true,warStripCompact:true,warStripScope:'contextual',nativeWarEnabled:true,nativeWarCountryGroups:true,nativeWarSort:'availability',nativeFriendlySort:'given',nativeFriendlyDesc:true,nativeWarFilter:'all',nativeChainBubble:false,priorityNotifications:true,hitterRisk:{},heavyPolicy:{mode:'percent',percent:40,minBss:0},shared:{enabled:false,endpoint:'',token:'',canWrite:false},hidden:false};
  const cfg=Object.assign({},defaults,safeRead(CONFIG,{}));
  cfg.assignments=cfg.assignments&&typeof cfg.assignments==='object'?cfg.assignments:{};
  cfg.ordersByEnemy=cfg.ordersByEnemy&&typeof cfg.ordersByEnemy==='object'?cfg.ordersByEnemy:{};
  // Treat existing local orders as belonging to the currently configured opponent.
  if(positive(cfg.enemyId)&&!Object.prototype.hasOwnProperty.call(cfg.ordersByEnemy,String(cfg.enemyId))&&
     Object.keys(cfg.assignments).length)cfg.ordersByEnemy[String(cfg.enemyId)]={...cfg.assignments};
  cfg.turtlePlans=cfg.turtlePlans&&typeof cfg.turtlePlans==='object'?cfg.turtlePlans:{};
  cfg.controlAssignments=cfg.controlAssignments&&typeof cfg.controlAssignments==='object'?cfg.controlAssignments:{};
  cfg.blackSkulls=cfg.blackSkulls&&typeof cfg.blackSkulls==='object'?cfg.blackSkulls:{};
  cfg.spies=cfg.spies&&typeof cfg.spies==='object'?cfg.spies:{};
  cfg.notes=cfg.notes&&typeof cfg.notes==='object'?cfg.notes:{};
  cfg.watchlist=cfg.watchlist&&typeof cfg.watchlist==='object'?cfg.watchlist:{};
  cfg.planStatus=cfg.planStatus&&typeof cfg.planStatus==='object'?cfg.planStatus:{};
  cfg.leaderNotes=cfg.leaderNotes&&typeof cfg.leaderNotes==='object'?cfg.leaderNotes:{};
  cfg.manualReadiness=cfg.manualReadiness&&typeof cfg.manualReadiness==='object'?cfg.manualReadiness:{};
  cfg.hitterRisk=cfg.hitterRisk&&typeof cfg.hitterRisk==='object'?cfg.hitterRisk:{};
  cfg.heavyPolicy=Object.assign({mode:'percent',percent:40,minBss:0},
    cfg.heavyPolicy&&typeof cfg.heavyPolicy==='object'?cfg.heavyPolicy:{});
  cfg.shared=Object.assign({enabled:false,endpoint:'',token:'',canWrite:false},
    cfg.shared&&typeof cfg.shared==='object'?cfg.shared:{});
  const freshData=()=>({autoSpies:{},ours:[],enemies:[],ourWars:[],enemyWars:[],reports:{},activity:{},factionBasic:{},publicIntel:{},ffstats:{},attacks:[],seenAttacks:{},updated:{},errors:{},backoff:{},war:null,meta:{},scoreTimelines:{},warTimelines:{},afterActions:{},ownerReadiness:{},availabilityEvents:{},chain:{},squadSnapshots:{},attackBssSnapshots:{},concededWars:{},sampleCount:0});
  const state={data:Object.assign(freshData(),safeRead(DATA,{})),open:false,tab:'overview',showMore:false,
    filter:'all',sort:'warScore',search:'',publicRequested:{},commanderFilter:'black',controlFocus:0,loading:false,ffLoading:false,spinner:'',error:'',notice:null,scanning:false,alerts:[],chosen:0,
    lastRefresh:0,historicalRead:0,localKeyError:false,sharedBusy:false,sharedDirty:false,sharedRevision:0,sharedSyncAt:0,sharedEditVersion:0,sharedError:'',warMore:false,quickHitPending:false,stripScrolled:false,stripExpanded:false,warExpected:false,selectedWar:0,selectedTimeline:0,selectedPace:0,selectedDebrief:0,detailFrom:'targets',leaderFilter:'all',hitterFilter:'all',renderedPlayerId:0,skipDraftRestore:false};
  state.data.reports=state.data.reports||{};
  state.data.squadSnapshots=state.data.squadSnapshots||{};
  state.data.attackBssSnapshots=state.data.attackBssSnapshots||{};
  state.data.concededWars=state.data.concededWars&&typeof state.data.concededWars==='object'&&!Array.isArray(state.data.concededWars)?state.data.concededWars:{};
  state.data.activity=state.data.activity||{};
  state.data.ffstats=state.data.ffstats||{};
  state.data.publicIntel=state.data.publicIntel||{};
  state.data.factionBasic=state.data.factionBasic||{};
  state.data.updated=state.data.updated||{};
  state.data.errors=state.data.errors||{};
  state.data.backoff=state.data.backoff||{};
  state.data.seenAttacks=state.data.seenAttacks||{};
  // Repair malformed legacy cached containers without wiping valid user data.
  for(const k of ['ours','enemies','ourWars','enemyWars','attacks'])
    if(!Array.isArray(state.data[k]))state.data[k]=[];
  for(const k of ['autoSpies','reports','activity','factionBasic','publicIntel','ffstats','seenAttacks','updated','errors','backoff','meta','scoreTimelines','warTimelines','afterActions','ownerReadiness','availabilityEvents','chain'])
    if(!state.data[k]||typeof state.data[k]!=='object'||Array.isArray(state.data[k]))state.data[k]={};
  if(state.data.war&&!Array.isArray(state.data.war.factions))state.data.war=null;
  for(const [key,value] of Object.entries(state.data.reports))
    if(!value||typeof value!=='object'||!Array.isArray(value.factions))delete state.data.reports[key];
  // v1.5.11 fixes the old parser's incorrect 3.00 cap on FFScouter estimates.
  // Invalidate only its lookup timestamp so previously rejected >3 estimates can refetch.
  if(state.data.meta.ffEstimateParserVersion!==2){
    if(cfg.ffConsent&&cfg.ffEnabled)state.data.updated.ffscouter=0;
    state.data.meta.ffEstimateParserVersion=2;
  }
  const effectiveKey=()=>String(cfg.key||'').trim()||(apiKeyPda.includes('PDA-APIKEY')?'':apiKeyPda);
  const saveCfg=()=>{try{localStorage.setItem(CONFIG,JSON.stringify(cfg));return true;}catch(_){state.localKeyError=true;return false;}};
  const save=()=>{try{localStorage.setItem(DATA,JSON.stringify(state.data));return true;}catch(_){
    // Discard only oldest evidence on quota exhaustion; never purge config, spies or notes.
    for(const key of Object.keys(state.data.activity)) {const hours=state.data.activity[key]?.hours||{};const nums=Object.keys(hours).map(Number).sort((a,b)=>a-b);for(const h of nums.slice(0,Math.ceil(nums.length/2)))delete hours[h];}
    state.data.attacks=(state.data.attacks||[]).slice(-200);
    try{localStorage.setItem(DATA,JSON.stringify(state.data));return true;}catch(e){state.error='Local storage is full; observations cannot be saved.';return false;}
  }};
  const parseArray=(value)=>Array.isArray(value)?value.filter(v=>v&&typeof v==='object'):Object.entries(value&&typeof value==='object'?value:{}).filter(([key])=>/^\d+$/.test(key)).map(([key,v])=>({...(v&&typeof v==='object'&&!Array.isArray(v)?v:{}),id:positive(v?.id)||positive(v?.faction_id)||positive(key)}));
  const unpack=(j,k)=>j?.[k]??j;
  function roster(j){
    const list=parseArray(unpack(j,'members'));
    return list.map(p=>({
      id:positive(p.id||p.user_id||p.player_id),name:String(p.name||('Player '+p.id)),level:n(p.level),
      position:String(p.position||''),daysInFaction:n(p.days_in_faction),
      revivable:p.is_revivable===true,onWall:p.is_on_wall===true,inOc:p.is_in_oc===true,
      earlyDischarge:p.has_early_discharge===true,
      status:String(p.status?.state||p.status||'Unknown'),
      statusText:String(p.status?.description||''),statusDetails:String(p.status?.details||''),
      locationHint:String(p.location?.name||p.location||p.status?.location||''),
      destinationHint:String(p.travel?.destination?.name||p.travel?.destination||p.status?.destination||''),
      until:n(p.status?.until)*1000,
      lastAction:String(p.last_action?.status||'Unknown'),lastAt:n(p.last_action?.timestamp)*1000,
      updated:Date.now()
    })).filter(p=>p.id);
  }
  const officialNumber=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
  function warHistory(j){
    return parseArray(unpack(j,'rankedwars')).map(w=>{
      const details=w.war&&typeof w.war==='object'?w.war:w;
      // Keyed ranked-war data keeps faction scores beside the nested war times.
      const factions=parseArray(w.factions??w.participants??details.factions??details.participants??{});
      const ids=factions.map(f=>positive(f.id||f.faction_id)).filter(Boolean);
      const t=positive(details.start||details.started||details.start_time);
      return {id:positive(w.id||w.war_id||details.id),start:t,end:positive(details.end||details.ended||details.end_time),
        winner:positive(details.winner||details.winner_id),factions:ids,
        scores:factions.map(f=>({id:positive(f.id||f.faction_id),name:String(f.name||''),score:officialNumber(f.score??f.points)})),
        target:n(details.target||details.target_score),rawStatus:String(details.status||'')};
    }).filter(w=>w.id).slice(0,80);
  }
  function detectWar(j){
    const d=unpack(j,'wars');const w=d?.ranked||d?.ranked_war||d?.rankedwar||j?.ranked||null;
    if(!w || typeof w!=='object' || Array.isArray(w))return null;
    const factions=parseArray(w.factions||w.participants||{}).map(p=>({id:positive(p.id||p.faction_id),name:String(p.name||''),score:officialNumber(p.score??p.points)}));
    const own=positive(cfg.ourId);
    const other=factions.find(p=>p.id&&p.id!==own);
    const id=positive(w.id||w.war_id);
    if(!id || !factions.some(p=>p.id===own) || !other)return null;
    if(w.end || w.ended || String(w.status||'').toLowerCase()==='ended')return null;
    return {id,opponentId:other.id,opponentName:other.name,factions,target:n(w.target||w.target_score),
      start:positive(w.start||w.started),status:String(w.status||'active'),observed:Date.now()};
  }
  function report(j,warId){
    const r=unpack(j,'rankedwarreport');
    const f=parseArray(r?.factions||r?.participants);
    const w=r?.war&&typeof r.war==='object'?r.war:r||{};
    return {id:warId,war:{start:positive(w.start),end:positive(w.end),winner:positive(w.winner),
      forfeit:Boolean(w.forfeit),target:n(w.target)},factions:f.map(side=>({
      id:positive(side.id||side.faction_id),name:String(side.name||''),score:officialNumber(side.score),attacks:officialNumber(side.attacks),
      rankBefore:String(side.rank?.before||side.rank_before||''),rankAfter:String(side.rank?.after||side.rank_after||''),
      rewards:{respect:n(side.rewards?.respect),points:n(side.rewards?.points),
        items:parseArray(side.rewards?.items).map(p=>({id:positive(p.id),name:String(p.name||''),quantity:n(p.quantity)}))},
      members:parseArray(side.members||{}).map(p=>({id:positive(p.id||p.user_id),name:String(p.name||''),
        score:officialNumber(p.score),attacks:officialNumber(p.attacks),level:officialNumber(p.level)})).filter(p=>p.id)
    })),retrieved:Date.now()};
  }
  const epochMs=value=>{
    const v=Number(value);
    return Number.isFinite(v)&&v>1e9?(v>1e12?v:v*1000):0;
  };
  function attacks(j){
    return parseArray(unpack(j,'attacks')).map(a=>{
      const rawFF=a.modifiers?.fair_fight??a.modifiers?.fairfight??a.fair_fight;
      const rawGain=a.respect_gain??a.respect;
      const attacker=positive(a.attacker?.id||a.attacker_id);
      const defender=positive(a.defender?.id||a.defender_id);
      const attackerFaction=positive(a.attacker_faction??a.attacker_faction_id??
        a.attacker?.faction?.id??a.attacker?.faction_id);
      const defenderFaction=positive(a.defender_faction??a.defender_faction_id??
        a.defender?.faction?.id??a.defender?.faction_id);
      const warFlag=a.is_ranked_war??a.ranked_war;
      const ranked=warFlag===true||warFlag===1||warFlag==='1';
      return {id:positive(a.id||a.attack_id),
        at:epochMs(a.timestamp_ended||a.ended||a.timestamp_started||a.started||a.timestamp||a.start),
        startedAt:epochMs(a.timestamp_started||a.started||a.start),
        attacker,defender,attackerFaction,defenderFaction,ranked,
        attackerName:String(a.attacker?.name||a.attacker_name||'').slice(0,80),
        defenderName:String(a.defender?.name||a.defender_name||'').slice(0,80),
        ff:validFF(rawFF),result:String(a.result||'').slice(0,50),
        respect:officialNumber(rawGain),chain:officialNumber(a.chain),
        chainBonus:officialNumber(a.modifiers?.chain??a.modifiers?.chain_bonus),
        modifierWar:officialNumber(a.modifiers?.war),
        modifierRetaliation:officialNumber(a.modifiers?.retaliation),
        modifierOverseas:officialNumber(a.modifiers?.overseas),
        modifierGroup:officialNumber(a.modifiers?.group??a.modifiers?.group_attack),
        specialBonus:Boolean(Number(a.modifiers?.warlord??a.modifiers?.warlord_bonus)>1),
        code:'api'};
    }).filter(a=>a.id&&a.at&&a.attacker&&a.defender);
  }
  // Attack attribution is conservative: only explicitly ranked-war hits with
  // faction IDs and a matching official war time window enter the ledger.
  function warAttackWindow(id){
    const wanted=positive(id);
    if(!wanted)return null;
    const active=state.data.war;
    if(positive(active?.id)===wanted){
      return {id:wanted,ourId:positive(cfg.ourId),enemyId:positive(active.opponentId),
        start:epochMs(active.start),end:Date.now(),active:true};
    }
    const past=state.data.ourWars.find(w=>positive(w.id)===wanted&&positive(w.end));
    if(!past)return null;
    const ourId=positive(cfg.ourId),enemyId=positive(past.factions.find(x=>positive(x)!==ourId));
    if(!enemyId)return null;
    return {id:wanted,ourId,enemyId,start:epochMs(past.start),end:epochMs(past.end),active:false};
  }
  function warAttackRows(id){
    const w=warAttackWindow(id);
    if(!w||!w.start||!w.end||!w.ourId||!w.enemyId)return [];
    return (state.data.attacks||[]).filter(a=>a.ranked===true&&
      n(a.at)>=w.start&&n(a.at)<=w.end+60*1000&&
      (a.attackerFaction===w.ourId&&a.defenderFaction===w.enemyId||
       a.attackerFaction===w.enemyId&&a.defenderFaction===w.ourId))
      .map(a=>({...a,side:a.attackerFaction===w.ourId?'ours':'enemies'}))
      .sort((a,b)=>b.at-a.at);
  }

  // Torn's chain endpoint supplies an observed chain count, remaining timeout and modifier.
  const chainMilestones=[10,25,50,100,250,500,1000,2500,5000,10000,25000,50000,100000];
  const chainBonusRespect={10:10,25:20,50:40,100:80,250:160,500:320,
    1000:640,2500:1280,5000:2560,10000:5120,25000:10240,
    50000:20480,100000:40960};
  function chainSnapshot(raw,at=Date.now()){
    const c=raw?.chain&&typeof raw.chain==='object'?raw.chain:raw;
    if(!c||typeof c!=='object'||officialNumber(c.current)===null)return null;
    const count=Math.max(0,Math.floor(n(c.current))),next=chainMilestones.find(x=>x>count)||null;
    return {count,timeout:Math.max(0,n(c.timeout)),modifier:officialNumber(c.modifier),
      cooldown:n(c.cooldown),next,nextIn:next===null?null:next-count,
      max:officialNumber(c.max),at};
  }
  function chainStatus(at=Date.now()){
    const c=state.data.chain||{},fresh=at-n(c.at)<2*MIN&&n(c.at)>0;
    return {count:fresh?c.count:null,
      remaining:fresh?Math.max(0,n(c.timeout)-Math.floor((at-c.at)/1000)):null,
      next:fresh?c.next:null,nextIn:fresh?c.nextIn:null,
      nextBonus:fresh&&c.next?chainBonusRespect[c.next]??null:null,
      modifier:fresh?c.modifier:null,at:n(c.at),fresh};
  }
  function hitterRisk(id){
    const entry=cfg.hitterRisk[positive(id)]||{},
      mode=['safe','balanced','aggressive'].includes(entry.mode)?entry.mode:'balanced';
    return {mode,maxRatio:mode==='safe'?0.55:mode==='aggressive'?0.78:0.70,
      minWins:mode==='safe'?1:0};
  }
  function learnedYield(friend,player,model,entries){
    const clean=(entries||[]).filter(a=>a.attacker===positive(friend.id)&&
      a.defender===positive(player.id)&&officialNumber(a.respect)!==null&&n(a.respect)>0&&
      !chainMilestones.includes(n(a.chain))&&!/mugged/i.test(String(a.result||''))&&
      !a.specialBonus&&
      (!a.modifierWar||a.modifierWar===2)&&
      (!a.modifierRetaliation||a.modifierRetaliation===1)&&
      (!a.modifierOverseas||a.modifierOverseas===1)&&
      (!a.modifierGroup||a.modifierGroup===1))
      .sort((a,b)=>b.at-a.at).slice(0,8);
    if(clean.length<2)return {pointsPer25:model,actual:null,samples:clean.length,confidence:'Model only'};
    const count=clean.length,values=clean.map(x=>{
      // Ordinary chain scale is not a fixed milestone award.
      // Use the API modifier when available; otherwise the official chain-scale formula.
      const chain=n(x.chain),apiScale=n(x.chainBonus);
      const scale=chain>=10?
        (apiScale>=1&&apiScale<=2.1?apiScale:Math.max(1,.25*Math.log10(chain)+.75)):1;
      return n(x.respect)/scale;
    }),mean=values.reduce((a,b)=>a+b,0)/count;
    const med=values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)],
      capped=Math.min(Math.max(mean,model*0.25),model*3),
      stable=Math.min(capped,med*1.6),weight=count>=5?0.7:count>=3?0.55:0.35;
    return {pointsPer25:model*(1-weight)+stable*weight,actual:mean,samples:count,
      confidence:count>=5?'Chain-adjusted observed + model (higher sample)':'Chain-adjusted observed + model (limited sample)'};
  }
  function warAttackInsights(id){
    const rows=warAttackRows(id).filter(a=>a.side==='ours'),
      scored=rows.filter(a=>officialNumber(a.respect)!==null&&n(a.respect)>0),
      total=scored.reduce((z,a)=>z+n(a.respect),0);
    const per=Object.values(rows.reduce((db,a)=>{
      const p=db[a.attacker]||(db[a.attacker]={id:a.attacker,name:a.attackerName||('Player '+a.attacker),
        attacks:0,positive:0,respect:0,estimatedEnergy:0});
      p.attacks++;p.estimatedEnergy+=25;
      if(n(a.respect)>0){p.positive++;p.respect+=n(a.respect);}
      return db;
    },{})).sort((a,b)=>b.respect-a.respect||a.id-b.id);
    return {known:rows.length>0,partial:true,attempts:rows.length,scored:scored.length,total,
      estimatedEnergy:rows.length*25,pointsPerEnergy:rows.length?total/(rows.length*25):null,per};
  }
  function warHitLedger(id=positive(state.data.war?.id)){
    const w=warAttackWindow(id),rows=warAttackRows(id),roster=state.data.ours;
    const known=Boolean(state.data.updated.attacks&&state.data.attacks.length);
    const summarise=(side)=>rows.filter(a=>a.side===side).reduce((acc,a)=>{
      acc.hits++;acc.scoringHits+=Number((officialNumber(a.respect)??0)>0);
      acc.respect+=Math.max(0,officialNumber(a.respect)??0);
      if(/hospitaliz|hospitalis/i.test(a.result))acc.hospitalised++;
      if(/mugged/i.test(a.result))acc.mugged++;
      acc.lastAt=Math.max(acc.lastAt,a.at);
      const id=a.attacker,member=acc.players[id]||(acc.players[id]={id,name:a.attackerName||
        [...state.data.ours,...state.data.enemies].find(p=>p.id===id)?.name||('Player '+id),
        hits:0,scoringHits:0,respect:0,hospitalised:0,lastAt:0});
      member.hits++;member.scoringHits+=Number((officialNumber(a.respect)??0)>0);
      member.respect+=Math.max(0,officialNumber(a.respect)??0);
      member.hospitalised+=Number(/hospitaliz|hospitalis/i.test(a.result));
      member.lastAt=Math.max(member.lastAt,a.at);
      return acc;
    },{hits:0,scoringHits:0,respect:0,hospitalised:0,mugged:0,lastAt:0,players:{}});
    const ours=summarise('ours'),theirs=summarise('enemies');
    const lastFetch=n(state.data.updated.attacks);
    return {id:positive(id),window:w,rows,ours,theirs,known,
      lastFetch,stale:!lastFetch||Date.now()-lastFetch>5*MIN,
      partial:true,
      blackSkulls:roster.filter(p=>cfg.blackSkulls[p.id]).map(p=>({
        player:p,stats:ours.players[p.id]||null})),
      enemyPlayers:Object.values(theirs.players).sort((a,b)=>b.respect-a.respect||b.hits-a.hits)};
  }

  function canCall(kind,minAge=0){
    const b=state.data.backoff[kind];
    if(b && Date.now()<n(b.until))return false;
    return !minAge || Date.now()-n(state.data.updated[kind])>minAge;
  }
  async function call(path,kind,minAge=0){
    if(!canCall(kind,minAge))return null;
    const key=effectiveKey();
    if(!key)throw new Error('Set an API key in Settings or use Torn PDA key substitution.');
    const url=API+path+(path.includes('?')?'&':'?')+'comment=WarStaxx';
    const request=()=>new Promise((resolve,reject)=>{
      if(typeof GM_xmlhttpRequest==='function'){
        GM_xmlhttpRequest({method:'GET',url,headers:{Authorization:'ApiKey '+key},
          timeout:15000,onload:r=>{try{resolve(JSON.parse(r.responseText));}catch(e){reject(new Error('Invalid API response'));}},
          onerror:()=>reject(new Error('Torn API connection failed')),ontimeout:()=>reject(new Error('Torn API request timed out'))});
      } else if(typeof PDA_httpGet==='function'){
        // Torn PDA compatibility fallback; key is sent only to the official Torn endpoint.
        Promise.resolve(PDA_httpGet(url+'&key='+encodeURIComponent(key))).then(x=>resolve(typeof x==='string'?JSON.parse(x):x)).catch(reject);
      } else {
        fetch(url,{headers:{Authorization:'ApiKey '+key}}).then(r=>r.json()).then(resolve).catch(reject);
      }
    });
    try{
      const data=await request();
      if(data?.error)throw new Error('Torn API '+String(data.error.code||'error')+': '+String(data.error.error||'Access denied'));
      if(!data||typeof data!=='object')throw new Error('Empty Torn API response');
      state.data.updated[kind]=Date.now();
      delete state.data.errors[kind]; delete state.data.backoff[kind];
      return data;
    }catch(err){
      const fail=state.data.backoff[kind]||{count:0};
      const count=Math.min(7,n(fail.count)+1);
      state.data.backoff[kind]={count,until:Date.now()+Math.min(30*MIN,Math.pow(2,count)*30000)};
      state.data.errors[kind]=String(err.message||err).slice(0,180);
      throw err;
    }
  }
  function memberState(p){
    const s=String(p?.status||'').toLowerCase();
    if(s.includes('hospital'))return 'hospital';
    if(s.includes('trav')||s.includes('abroad'))return 'away';
    if(s.includes('jail')||s.includes('federal'))return 'jail';
    if(s.includes('fallen'))return 'fallen';
    if(s.includes('okay'))return 'okay';
    return 'unknown';
  }
  function isOnline(p){return String(p?.lastAction||'').toLowerCase()==='online';}
  function flightEvidence(p,at=Date.now()){
    if(!p||memberState(p)!=='away')return {kind:'not-travelling',eta:null,source:'roster'};
    const desc=String(p.statusText||'')+' '+String(p.statusDetails||'');
    // Explicitly distinguish an inbound return from an outbound flight.
    // A generic status expiry is NOT proof of a return-to-Torn flight.
    const inbound=/(returning from|returning to torn|travell?ing (?:from [^,.;|]{1,50} )?to torn|flight back|flying back|back to torn)/i.test(desc);
    const outbound=!inbound&&/(travell?ing (?:from [^,.;|]{1,50} )?to|flying to|departing for|flight to)/i.test(desc);
    const kind=inbound?'returning':outbound?'outbound':'abroad-or-unclear';
    const eta=n(p.until);
    const valid=eta>at-5*MIN&&eta<at+20*HOUR;
    return {kind,eta:valid?eta:null,source:valid&&inbound?'inbound Torn roster expiry':'status only',
      statusText:desc.trim().slice(0,140)};
  }
  // Torn travel destinations and aliases; unknown flight destinations stay unknown.
  const nativeCountries=[
    ['Argentina',/\bArgentina\b/i],['Canada',/\bCanada\b/i],
    ['Cayman Islands',/\b(?:Cayman\s+Islands|Caymans?)\b/i],
    ['China',/\bChina\b/i],['Hawaii',/\bHawaii\b/i],['Japan',/\bJapan\b/i],
    ['Mexico',/\bMexico\b/i],['South Africa',/\bSouth\s+Africa\b/i],
    ['Switzerland',/\b(?:Switzerland|Swiss)\b/i],
    ['United Kingdom',/\b(?:United\s+Kingdom|Great\s+Britain|U\.?K\.?)\b/i],
    ['UAE',/\b(?:United\s+Arab\s+Emirates|U\.?A\.?E\.?)\b/i],
    ['Torn',/\b(?:Torn\s+City|Torn)\b/i]
  ];
  function nativeCountryName(value){
    const text=String(value||'');
    for(const [country,pattern] of nativeCountries)if(pattern.test(text))return country;
    return '';
  }
  function nativeWarLocation(p){
    if(!p)return {country:'Unknown',phase:'unknown',source:'Missing player'};
    const kind=memberState(p);
    const desc=[p.statusText,p.statusDetails].filter(Boolean).join(' ').trim();
    const explicit=nativeCountryName(p.destinationHint),current=nativeCountryName(p.locationHint);
    if(kind==='away'){
      const to=desc.match(/\bto\s+([^.,;|]+)/i);
      const dest=explicit||nativeCountryName(to?.[1]);
      if(dest)return {country:dest,phase:'inbound',eta:positive(p.until),source:'Torn flight destination'};
      if(/\b(?:returning from|flying back from|flight back|flying back|back to torn)\b/i.test(desc))
        return {country:'Torn',phase:'inbound',eta:positive(p.until),source:'Torn return flight'};
      if(/^abroad$/i.test(String(p.status||''))){
        const where=current||nativeCountryName(desc);
        if(where)return {country:where,phase:'abroad',source:'Torn abroad status'};
      }
      return {country:'Unknown',phase:'unknown-travel',eta:positive(p.until),source:'Destination not provided'};
    }
    if(['okay','hospital','jail','fallen'].includes(kind)){
      // Hospital descriptions can include player names: do not treat a name "Canada" as a country.
      const where=current||(/\b(?:in|at|abroad)\s+/i.test(desc)?nativeCountryName(desc):'');
      if(where)return {country:where,phase:'present',source:'Torn member status'};
      return {country:'Torn',phase:'present',source:'Inferred from non-travel status'};
    }
    return {country:current||'Unknown',phase:'unknown',source:'Location not provided'};
  }
  function nativeWarOwnLocation(){
    const id=positive(state.data.meta?.ownerId),me=state.data.ours.find(p=>p.id===id);
    if(me){const info=nativeWarLocation(me);if(info.phase==='inbound')return {country:'Torn',known:false,phase:'inbound'};
      if(info.country!=='Unknown')return {country:info.country,known:true,phase:info.phase};}
    return {country:'Torn',known:false,phase:'unknown'};
  }
  function nativeWarCountryCompare(a,b,own=nativeWarOwnLocation()){
    if(a===b)return 0;
    if(own.known&&a===own.country)return -1;
    if(own.known&&b===own.country)return 1;
    if(a==='Unknown')return 1;
    if(b==='Unknown')return -1;
    return a.localeCompare(b,'en',{sensitivity:'base'});
  }
  function nativeWarAvailabilityRank(p){
    const kind=memberState(p);
    return kind==='okay'?0:kind==='hospital'?1:kind==='jail'?2:kind==='away'?3:4;
  }
  function nativeWarLastSeen(p,at=Date.now()){
    const last=positive(p?.lastAt),state=String(p?.lastAction||'').toLowerCase();
    if(state==='online'&&last&&at-last<15*MIN)return 'ONLINE';
    if(!last||last>at+MIN)return 'Seen ?';
    const min=Math.max(0,Math.floor((at-last)/MIN));
    return min<1?'Seen now':min<60?'Seen '+min+'m':min<1440?
      'Seen '+Math.floor(min/60)+'h':'Seen '+Math.floor(min/1440)+'d';
  }
  function flightCountdown(ms,at=Date.now()){
    if(!ms)return 'Unknown';
    const diff=Math.ceil((ms-at)/MIN);
    if(diff<=0)return 'Due / refresh';
    const hr=Math.floor(diff/60),mins=diff%60;
    return (hr?hr+'h ':'')+mins+'m';
  }
  function inboundReturns(){
    return state.data.enemies.map(p=>({player:p,flight:flightEvidence(p)}))
      .filter(x=>x.flight.kind==='returning').sort((a,b)=>
        (a.flight.eta||Infinity)-(b.flight.eta||Infinity)||a.player.id-b.player.id);
  }

  // Historical war scoring can only be sampled while this device is active.
  // Never manufacture a continuous score or reconstruct earlier timestamps.
  function trimWarLogs(){
    for(const key of ['scoreTimelines','warTimelines']){
      const data=state.data[key],ids=Object.keys(data).sort((a,b)=>
        n(data[b]?.lastAt||data[b]?.updated)-n(data[a]?.lastAt||data[a]?.updated));
      for(const id of ids.slice(20))delete data[id];
    }
  }
  function recordWarScore(w,at=Date.now()){
    if(!w||!positive(w.id))return false;
    const us=w.factions?.find(p=>positive(p.id)===positive(cfg.ourId));
    const them=w.factions?.find(p=>positive(p.id)===positive(w.opponentId));
    if(!us||!them||officialNumber(us.score)===null||officialNumber(them.score)===null)return false;
    const id=String(w.id),r=state.data.scoreTimelines[id]||
      (state.data.scoreTimelines[id]={id:w.id,ourId:positive(cfg.ourId),enemyId:positive(w.opponentId),
        start:positive(w.start)*1000,points:[],lastAt:0});
    if(r.ourId!==positive(cfg.ourId)||r.enemyId!==positive(w.opponentId))return false;
    const p={at,our:n(us.score),enemy:n(them.score)},last=r.points[r.points.length-1];
    if(last&&(at-last.at<20000||last.our===p.our&&last.enemy===p.enemy&&at-last.at<5*MIN))return false;
    r.points.push(p);
    if(r.points.length>360)r.points=r.points.slice(-360);
    r.lastAt=at;trimWarLogs();return true;
  }
  function warPace(id=positive(state.data.war?.id)){
    const r=state.data.scoreTimelines[String(positive(id))];
    if(!r||!Array.isArray(r.points)||!r.points.length)return null;
    const points=r.points.filter(x=>x&&Number.isFinite(n(x.at))).slice().sort((a,b)=>a.at-b.at);
    const last=points[points.length-1],cutoff=last.at-60*MIN;
    const recent=points.filter(x=>x.at>=cutoff);
    const start=recent[0]||points[0],span=(last.at-start.at)/MIN;
    const measurable=recent.length>=2&&span>=5;
    const deltaOur=n(last.our)-n(start.our),deltaEnemy=n(last.enemy)-n(start.enemy);
    const rateOur=measurable?deltaOur*60/span:null,rateEnemy=measurable?deltaEnemy*60/span:null;
    const fullSpan=(last.at-points[0].at)/MIN;
    return {id:r.id,ourId:r.ourId,enemyId:r.enemyId,points,
      last,first:points[0],samples:points.length,span,fullSpan,
      deltaOur:measurable?deltaOur:null,deltaEnemy:measurable?deltaEnemy:null,
      rateOur,rateEnemy,netRate:measurable?rateOur-rateEnemy:null,
      gap:n(last.our)-n(last.enemy),measurable,
      confidence:!measurable?'Insufficient':span>=40&&recent.length>=4?'Moderate':'Early'};
  }
  function recordWarObservation(side,players,at=Date.now()){
    const war=state.data.war;
    if(!war||!positive(war.id)||!Array.isArray(players)||!players.length)return false;
    const id=String(war.id),hour=Math.floor(at/HOUR);
    const rec=state.data.warTimelines[id]||
      (state.data.warTimelines[id]={id:war.id,ourId:positive(cfg.ourId),enemyId:positive(war.opponentId),
        name:String(war.opponentName||''),start:positive(war.start)*1000,updated:0,
        sides:{ours:{hours:{},players:{}},enemies:{hours:{},players:{}}}});
    if(rec.ourId!==positive(cfg.ourId)||rec.enemyId!==positive(war.opponentId))return false;
    const target=rec.sides[side];if(!target)return false;
    const bucket=target.hours[hour]||(target.hours[hour]={checks:0,samples:0,online:0,away:0,hospital:0,okay:0});
    bucket.checks++;
    for(const p of players){
      const status=memberState(p),online=isOnline(p);
      bucket.samples++;bucket.online+=Number(online);bucket.away+=Number(status==='away');
      bucket.hospital+=Number(status==='hospital');bucket.okay+=Number(status==='okay');
      const h=target.players[p.id]||(target.players[p.id]={id:p.id,name:p.name,
        samples:0,online:0,away:0,hospital:0,okay:0,firstAt:at,lastAt:at});
      h.name=p.name;h.samples++;h.online+=Number(online);h.away+=Number(status==='away');
      h.hospital+=Number(status==='hospital');h.okay+=Number(status==='okay');h.lastAt=at;
    }
    rec.updated=at;trimWarLogs();return true;
  }
  function warSamples(id,side){
    const rec=state.data.warTimelines[String(positive(id))];
    const dat=rec?.sides?.[side],hours=Object.entries(dat?.hours||{}).sort((a,b)=>Number(a[0])-Number(b[0]));
    const aggregate=hours.reduce((z,[_,x])=>{
      z.checks+=n(x.checks);z.samples+=n(x.samples);z.online+=n(x.online);
      z.away+=n(x.away);z.hospital+=n(x.hospital);z.okay+=n(x.okay);return z;
    },{checks:0,samples:0,online:0,away:0,hospital:0,okay:0});
    const pct=k=>aggregate.samples?Math.round(100*aggregate[k]/aggregate.samples):null;
    return {id:positive(id),side,hours,players:Object.values(dat?.players||{}),
      ...aggregate,onlinePct:pct('online'),awayPct:pct('away'),hospitalPct:pct('hospital'),
      first:hours.length?Number(hours[0][0])*HOUR:0,
      last:hours.length?Number(hours[hours.length-1][0])*HOUR:0,
      coverage:aggregate.checks>=12&&hours.length>=4?'Moderate':
        aggregate.checks>=3&&hours.length>=2?'Early':'Insufficient'};
  }
  function snapshot(sides=['ours','enemies']){
    const hour=Math.floor(Date.now()/HOUR);
    for(const side of sides){
      const players=state.data[side]||[];
      if(state.data.war)recordWarObservation(side,players);
      for(const p of players){
        const id=side+':'+p.id;
        const item=state.data.activity[id]||(state.data.activity[id]={hours:{},count:0});
        const h=item.hours[hour]||(item.hours[hour]={count:0,online:0,travel:0,abroad:0,hospital:0,okay:0});
        const stateName=memberState(p);
        h.count++;h.online+=Number(isOnline(p));h.travel+=Number(stateName==='away');
        h.abroad+=Number(p.status.toLowerCase().includes('abroad'));
        h.hospital+=Number(stateName==='hospital');h.okay+=Number(stateName==='okay');
        item.count++;item.lastAt=Date.now();item.lastState=stateName;
        if(state.data.war&&positive(state.data.war.id)){
          const wars=item.wars||(item.wars={});const wid=String(state.data.war.id);
          const rec=wars[wid]||(wars[wid]={n:0,travel:0,online:0});
          rec.n++;rec.travel+=Number(stateName==='away');rec.online+=Number(isOnline(p));
          for(const ancient of Object.keys(wars).slice(0,-20))delete wars[ancient];
        }
        for(const old of Object.keys(item.hours))if(Number(old)<hour-24*14)delete item.hours[old];
      }
    }
    state.data.sampleCount=n(state.data.sampleCount)+1;
  }
  function pattern(side,id){
    const item=state.data.activity[side+':'+id];
    if(!item)return {count:0,travel:0,online:0,warSamples:0,warTravel:null,peak:null,reliability:'Not sampled'};
    const h=Object.entries(item.hours||{}).filter(([k])=>Number(k)>=Math.floor(Date.now()/HOUR)-24*14);
    const totals=h.reduce((z,[_,v])=>({n:z.n+n(v.count),online:z.online+n(v.online),travel:z.travel+n(v.travel)}),{n:0,online:0,travel:0});
    const buckets=Array.from({length:24},(_,i)=>({hour:i,samples:0,active:0}));
    for(const [k,v] of h){let b=buckets[(Number(k)%24+24)%24];b.samples+=n(v.count);b.active+=n(v.online);}
    const valid=buckets.filter(b=>b.samples>=3).sort((a,b)=>b.active/b.samples-a.active/a.samples);
    const war=Object.values(item.wars||{}).reduce((acc,v)=>({n:acc.n+n(v.n),travel:acc.travel+n(v.travel)}),{n:0,travel:0});
    return {count:totals.n,warSamples:war.n,warTravel:war.n?Math.round(war.travel/war.n*100):null,
      travel:totals.n?Math.round(totals.travel/totals.n*100):0,
      online:totals.n?Math.round(totals.online/totals.n*100):0,peak:valid.length?valid[0].hour:null,
      reliability:totals.n>=60 && h.length>=12?'Moderate':totals.n>=12 && h.length>=3?'Early signal':'Insufficient samples',hours:h.length};
  }
  function pastPerformance(id,side){
    const faction=side==='ours'?positive(cfg.ourId):positive(cfg.enemyId);
    const all=Object.values(state.data.reports).filter(r=>r.factions?.some(s=>s.id===faction));
    const records=all.map(r=>r.factions.find(s=>s.id===faction)?.members?.find(m=>m.id===id)).filter(Boolean);
    const total=records.reduce((s,m)=>s+n(m.score),0);
    return {wars:records.length,score:total,avg:records.length?total/records.length:null,
      attacks:records.reduce((s,m)=>s+n(m.attacks),0)};
  }
  function normaliseFactionBasic(j){
    const p=j?.basic||j||{},r=p.rank&&typeof p.rank==='object'?p.rank:{};
    return {id:positive(p.id),name:String(p.name||''),tag:String(p.tag||''),
      respect:p.respect===undefined?null:n(p.respect),members:p.members===undefined?null:n(p.members),
      capacity:p.capacity===undefined?null:n(p.capacity),
      daysOld:p.days_old===undefined?null:n(p.days_old),
      leader:positive(p.leader_id),coLeader:positive(p.co_leader_id),
      rankName:String(r.name||''),rankLevel:r.level===undefined?null:n(r.level),
      rankPosition:r.position===undefined?null:n(r.position),
      division:r.division===undefined?null:n(r.division),
      rankedWins:r.wins===undefined?null:n(r.wins),
      bestChain:p.best_chain===undefined?null:n(p.best_chain),
      observed:Date.now()};
  }
  async function refreshFactionBasics(force=false){
    for(const id of [positive(cfg.ourId),positive(cfg.enemyId)]){
      if(!id)continue;
      try{
        const j=await call('/faction/'+id+'/basic','basic-'+id,force?0:30*MIN);
        if(j)state.data.factionBasic[id]=normaliseFactionBasic(j);
      }catch(e){state.data.errors['basic-'+id]=String(e.message||e);}
    }
    const latest=Object.keys(state.data.factionBasic).sort((a,b)=>n(state.data.factionBasic[b]?.observed)-n(state.data.factionBasic[a]?.observed));
    for(const id of latest.slice(20))delete state.data.factionBasic[id];
  }
  function factionBasicsHtml(){
    const groups=[['Our faction',positive(cfg.ourId)],['Enemy faction',positive(cfg.enemyId)]];
    return '<div class="ws-grid">'+groups.map(([label,id])=>{
      const x=state.data.factionBasic[id];
      if(!x)return card(label,empty('Basic faction data not collected yet.'));
      return card(label+' | '+(x.name||('Faction #'+id)),
        '<p>'+pill(x.tag||'No tag')+' '+pill(x.rankName||'Rank unknown')+'</p>'+
        '<div class="ws-inline-metrics"><span>Respect '+scoreLabel(x.respect)+'</span>'+
        '<span>Members '+scoreLabel(x.members)+' / '+scoreLabel(x.capacity)+'</span>'+
        '<span>Ranked wins '+scoreLabel(x.rankedWins)+'</span>'+
        '<span>Best chain '+scoreLabel(x.bestChain)+'</span></div>'+
        '<p>Rank level '+scoreLabel(x.rankLevel)+' | Division '+scoreLabel(x.division)+
        ' | Position '+scoreLabel(x.rankPosition)+' | Age '+scoreLabel(x.daysOld)+' days</p>'+
        '<div class="ws-toolbar">'+(x.leader?infoButton('Leader #'+x.leader,x.leader):'')+
        (x.coLeader?infoButton('Co-leader #'+x.coLeader,x.coLeader):'')+
        a('View faction',factionLink(id))+'</div>'+
        '<p class="ws-small">Torn official public faction basics | '+esc(age(x.observed))+'</p>');
    }).join('')+'</div>';
  }
  function recentWarRecords(side,id){
    const fid=positive(side==='ours'?cfg.ourId:cfg.enemyId);
    const wars=(side==='ours'?state.data.ourWars:state.data.enemyWars)
      .filter(w=>w.end&&w.factions.includes(fid)).slice().sort((a,b)=>(b.end||b.start)-(a.end||a.start));
    return wars.map(w=>{
      const r=state.data.reports[w.id];
      const member=r?.factions?.find(f=>f.id===fid)?.members?.find(p=>p.id===id);
      return {war:w,member:member||null,covered:Boolean(r),score:member?n(member.score):null,
        attacks:member?n(member.attacks):null};
    });
  }
  function setOpponent(id){
    const next=positive(id),previous=positive(cfg.enemyId);
    if(next===previous)return false;
    // Preserve each opponents local assignments separately; never show old
    // target orders as if they applied to a newly detected enemy faction.
    if(previous)cfg.ordersByEnemy[String(previous)]={...cfg.assignments};
    cfg.enemyId=next;
    cfg.assignments=next?{...(cfg.ordersByEnemy[String(next)]||{})}:{};
    state.data.enemies=[];
    state.data.enemyWars=[];
    state.data.updated.enemies=0;
    state.data.updated.enemyWars=0;
    // Historical war reports, spies, local notes and saved opponents orders survive.
    saveCfg();
    return true;
  }
  function latestFinished(side){
    return (side==='ours'?state.data.ourWars:state.data.enemyWars)
      .filter(w=>w.end).slice().sort((a,b)=>(b.end||b.start)-(a.end||a.start))[0]||null;
  }
  function factionWarMetrics(side){
    const id=positive(side==='ours'?cfg.ourId:cfg.enemyId);
    const wars=(side==='ours'?state.data.ourWars:state.data.enemyWars).filter(w=>w.end).slice()
      .sort((a,b)=>(b.end||b.start)-(a.end||a.start));
    const known=wars.filter(w=>w.winner);
    const scores=wars.map(w=>w.scores.find(f=>f.id===id)?.score).filter(v=>Number.isFinite(v));
    const last=wars[0]||null,ours=last?.scores?.find(f=>f.id===id);
    const opposite=last?.scores?.find(f=>f.id!==id);
    return {wars:wars.length,wins:known.filter(w=>w.winner===id).length,decided:known.length,
      scoreAvg:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,
      last,lastScore:ours?ours.score:null,lastAgainst:opposite?opposite.score:null};
  }
  function sideActivity(side){
    const roster=state.data[side]||[],time=Date.now();
    return {total:roster.length,online:roster.filter(isOnline).length,
      active24:roster.filter(p=>p.lastAt&&time-p.lastAt<=24*HOUR).length,
      active7:roster.filter(p=>p.lastAt&&time-p.lastAt<=7*24*HOUR).length,
      okay:roster.filter(p=>memberState(p)==='okay').length,
      away:roster.filter(p=>memberState(p)==='away').length,
      hospital:roster.filter(p=>memberState(p)==='hospital').length,
      last:n(state.data.updated[side]),fresh:time-n(state.data.updated[side])<5*MIN};
  }
  function hourlyEvidence(side){
    const slots=Array.from({length:24},(_,hour)=>({hour,samples:0,online:0,travel:0}));
    for(const p of state.data[side]||[]){
      const rec=state.data.activity[side+':'+p.id];
      for(const [h,v] of Object.entries(rec?.hours||{})){
        if(Number(h)<Math.floor(Date.now()/HOUR)-24*14)continue;
        const slot=slots[((Number(h)%24)+24)%24];
        slot.samples+=n(v.count);slot.online+=n(v.online);slot.travel+=n(v.travel);
      }
    }
    return slots.map(p=>({...p,pct:p.samples?Math.round(100*p.online/p.samples):null}));
  }
  function strongHours(){
    const ours=hourlyEvidence('ours'),them=hourlyEvidence('enemies');
    return ours.map((p,i)=>({hour:i,ours:p,theirs:them[i],
      advantage:p.samples>=3&&them[i].samples>=3?p.pct-them[i].pct:null}))
      .filter(x=>x.advantage!==null).sort((a,b)=>b.advantage-a.advantage);
  }
  function lastKnownMemberScore(side,id){
    return recentWarRecords(side,id).find(x=>x.covered&&x.member)?.score??null;
  }
  function spy(id){
    const idKey=String(positive(id)),legacy=cfg.spies[idKey],api=state.data.autoSpies[idKey],
      saved=bsScore(legacy)!==null?legacy:null,automatic=bsScore(api)!==null?api:null;
    if(automatic&&automatic.source==='Torn owner battlestats'&&
      positive(id)===positive(state.data.meta?.ownerId))return automatic;
    if(automatic&&(!saved||n(automatic.observedAt)>=n(saved.observedAt)))return automatic;
    return saved;
  }
  // BSS = sqrt(STR) + sqrt(SPD) + sqrt(DEF) + sqrt(DEX).
  // Never treat missing or null battle stats as actual zeroes.
  function bsScore(s){
    if(!s||typeof s!=='object')return null;
    const keys=['strength','speed','defense','dexterity'];
    if(keys.some(k=>s[k]===null||s[k]===undefined||s[k]===''||
      !Number.isFinite(Number(s[k]))||Number(s[k])<0))return null;
    const score=keys.reduce((sum,k)=>sum+Math.sqrt(Number(s[k])),0);
    return score>0?score:null;
  }
  function exactBattleStats(raw,at,source){
    if(!raw||typeof raw!=='object'||!at||at>Date.now()+MIN)return null;
    const record={};
    for(const k of ['strength','speed','defense','dexterity']){
      const entry=raw[k],v=entry&&typeof entry==='object'?entry.value:entry;
      if(v===null||v===undefined||v===''||!Number.isFinite(Number(v))||Number(v)<0)return null;
      record[k]=Number(v);
    }
    return bsScore(record)!==null?{...record,observedAt:at,source}:null;
  }
  function parseOwnBattleStats(json,at=Date.now()){
    return exactBattleStats(json?.battlestats??json?.user?.battlestats??json,at,'Torn owner battlestats');
  }
  function parseStatsReports(json,source,at=Date.now()){
    const records={};
    const raw=json?.reports??json?.data?.reports??[];
    const rows=Array.isArray(raw)?raw:raw&&typeof raw==='object'?Object.values(raw):[];
    for(const entry of rows){
      const report=entry?.report&&typeof entry.report==='object'?entry.report:entry;
      const type=String(entry?.type??report?.type??'').toLowerCase();
      if(type&&type!=='stats'&&type!=='stat')continue;
      const id=positive(entry?.target_id??entry?.target?.id??report?.target_id??report?.target?.id);
      const time=epochMs(entry?.timestamp??entry?.created_at??report?.timestamp??report?.created_at);
      const rawStats=report?.stats??report?.battlestats??report?.data?.stats??
        report?.data?.battlestats??report?.data??report;
      const stats=exactBattleStats(rawStats,time,source);
      if(!id||!stats||time>at+MIN)continue;
      if(!records[id]||records[id].observedAt<time)records[id]=stats;
    }
    return records;
  }
  function applyAutoSpies(records,owner=positive(state.data.meta?.ownerId)){
    if(!owner)return 0;
    let count=0;
    for(const [id,entry] of Object.entries(records||{})){
      if(!positive(id)||bsScore(entry)===null)continue;
      const prev=state.data.autoSpies[id],own=positive(id)===owner;
      if(own&&prev?.source==='Torn owner battlestats'&&
        entry.source!=='Torn owner battlestats')continue;
      if(!prev||n(entry.observedAt)>n(prev.observedAt)||
        own&&entry.source==='Torn owner battlestats'){
        state.data.autoSpies[id]=entry;count++;
      }
    }
    const ordered=Object.keys(state.data.autoSpies).sort((a,b)=>
      n(state.data.autoSpies[b]?.observedAt)-n(state.data.autoSpies[a]?.observedAt));
    for(const id of ordered.slice(300))delete state.data.autoSpies[id];
    return count;
  }
  // Fair Fight from FFScouter uses the API-key owner's battle stats, not a
  // selected teammate's. A true per-hitter figure needs both BSS inputs.
  const ffApiKey=()=>String(cfg.ffKey||'').trim()||effectiveKey();
  // Torn awarded attack FF is capped at 3.00. FFScouter's calculated / modelled
  // attacker-relative FF is UNcapped and may legitimately be above 3 (e.g. 9.29).
  const validFF=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=1&&Number(v)<=3?
    Number(v):null;
  const validScouterFF=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&
    Number(v)>=1&&Number(v)<=1e6?Number(v):null;
  const ffTimestamp=v=>{
    if(typeof v==='number')return v>1e12?v:v>1e9?v*1000:0;
    if(typeof v==='string'&&/^\d+$/.test(v))return ffTimestamp(Number(v));
    const parsed=Date.parse(String(v||''));return Number.isFinite(parsed)?parsed:0;
  };
  function parseFFRows(rows,ids,at=Date.now()){
    if(!Array.isArray(rows))throw new Error('FFScouter response is not a list');
    const allowed=new Set(ids.map(positive)),out={};
    for(const p of rows){
      const id=positive(p?.player_id);
      if(!allowed.has(id))continue;
      const ff=validScouterFF(p?.fair_fight);
      const bss=Number(p?.bss_public),estimate=Number(p?.bs_estimate);
      out[id]={ff,bss:Number.isFinite(bss)&&bss>0?bss:null,
        bsEstimate:Number.isFinite(estimate)&&estimate>0?estimate:null,
        bsHuman:String(p?.bs_estimate_human||'').slice(0,70),
        source:String(p?.source||'public estimate').slice(0,35),
        updatedAt:ffTimestamp(p?.last_updated),
        premium:Boolean(p?.premium_insights_available),
        missing:ff===null&&!(Number.isFinite(bss)&&bss>0),
        at};
    }
    // A missing response entry is explicitly unknown. Never imply a zero FF.
    for(const id of allowed)if(!out[id])out[id]={ff:null,bss:null,missing:true,at};
    return out;
  }
  function ffscouter(id){
    if(!cfg.ffEnabled||!cfg.ffConsent)return null;
    const x=state.data.ffstats[String(id)];
    return x&&x.at&&Date.now()-n(x.at)<7*24*HOUR?x:null;
  }
  function ffIsStale(x){return !x||Date.now()-n(x.at)>=24*HOUR||
    Boolean(x.updatedAt&&Date.now()-n(x.updatedAt)>28*24*HOUR);}
  function ffCoverage(){
    let covered=0,unknown=0,stale=0;
    for(const p of state.data.enemies){
      const x=ffscouter(p.id);
      if(!x||x.ff===null||x.ff===undefined){unknown++;continue;}
      if(ffIsStale(x))stale++;
      else covered++;
    }
    return {covered,unknown,stale,total:state.data.enemies.length,
      last:n(state.data.updated.ffscouter),enabled:Boolean(cfg.ffEnabled&&cfg.ffConsent),
      keyAvailable:Boolean(ffApiKey())};
  }
  function ffLabel(id){
    const x=ffscouter(id);
    if(x&&x.ff!==null&&x.ff!==undefined){
      const stale=ffIsStale(x);
      return {value:x.ff.toFixed(2)+'x',tag:stale?'FF stale':'FFScouter',
        age:age(x.at),source:stale?'stale':'estimate',ff:x.ff};
    }
    const hit=ffObserved(id);
    if(hit.count&&hit.avg!==null)return {value:hit.avg.toFixed(2)+'x',
      tag:'Observed team FF',age:hit.count+' attack(s)',source:'observed',ff:hit.avg};
    return {value:'--',tag:cfg.ffEnabled?'FF unknown':'FF off',age:'No usable fair-fight data',
      source:'unknown',ff:null};
  }
  function ffBadge(id,action=true){
    const x=ffLabel(id),cl=x.source==='unknown'?'ws-ff-none':x.source==='stale'?'ws-ff-stale':
      x.source==='observed'?'ws-ff-actual':x.ff>4.5?'ws-ff-danger':
      x.ff>3?'ws-ff-risk':x.ff>=2.5?'ws-ff-high':x.ff>=2?'ws-ff-mid':'ws-ff-low';
    const title=x.tag+' | '+x.age+' | '+(x.source==='estimate'?
      'FFScouter calculated FF for API-key owner; over 3.00 is uncapped difficulty, NOT awarded Torn FF. Other hitters have different FF':
      x.source==='observed'?'Actual recorded FF from faction attacks; not a personal matchup':
      'No guaranteed win probability');
    const html='<span class="ws-ff '+cl+'" title="'+esc(title)+'">FF '+esc(x.value)+'</span>';
    return action?'<button type="button" class="ws-ff-button" data-action="player:'+positive(id)+'" title="'+esc(title)+'">'+html+'</button>':html;
  }
  function matchup(friend,enemy){
    const ownStats=spy(friend.id),enemyStats=spy(enemy.id),
      ownExact=bsScore(ownStats),enemyExact=bsScore(enemyStats),
      ownFF=ffscouter(friend.id),enemyFF=ffscouter(enemy.id);
    const estimate=x=>x&&!ffIsStale(x)&&Number.isFinite(Number(x.bss))&&Number(x.bss)>0?
      Number(x.bss):null;
    const own=ownExact!==null?ownExact:estimate(ownFF),
      opponent=enemyExact!==null?enemyExact:estimate(enemyFF);
    if(own===null||opponent===null)return {known:false,ff:null,ratio:null,
      exact:false,verdict:'Stats unavailable',confidence:'No comparable API data'};
    const ratio=opponent/Math.max(1,own),exact=ownExact!==null&&enemyExact!==null,
      // Torn caps attacking BSS at 100k in the FF formula, not in strength comparisons.
      ff=Math.max(1,Math.min(3,1+(8/3)*(opponent/Math.max(1,Math.min(100000,own)))));
    const observed=Math.min(Number(ownStats?.observedAt)||Infinity,
      Number(enemyStats?.observedAt)||Infinity);
    return {known:true,ratio,ff,exact,
      verdict:ratio>=1.15?'Likely tougher':ratio>=0.8?'Close fight':'Favourable modelled BSS',
      confidence:exact?(observed&&Date.now()-observed<7*24*HOUR?
        'Recent exact API / spy figures':'Exact figures; check ages'):
        'FFScouter public BSS estimates (not exact)',
      friendSource:ownExact!==null?'Exact Torn API / report':'FFScouter estimate',
      enemySource:enemyExact!==null?'Exact Torn spy report':'FFScouter estimate'};
  }
  function ffObserved(enemyId,friendId){
    const all=(state.data.attacks||[]).filter(a=>a.defender===enemyId&&(!friendId||a.attacker===friendId)&&
      n(a.at)>Date.now()-30*24*HOUR&&n(a.at)<=Date.now()&&
      Number.isFinite(a.ff)&&a.ff>=1&&a.ff<=3);
    return {count:all.length,avg:all.length?all.reduce((s,a)=>s+a.ff,0)/all.length:null};
  }
  function evaluate(enemy){
    const kind=memberState(enemy),pat=pattern('enemies',enemy.id),hist=pastPerformance(enemy.id,'enemies');
    const live=kind==='okay'&&isOnline(enemy);
    const ready=kind==='okay'&&!isOnline(enemy);
    let score=live?80:ready?65:kind==='hospital'?25:kind==='away'?10:20;
    score+=Math.min(10,hist.wars*2);
    if(hist.avg!==null)score+=Math.min(10,Math.floor(hist.avg/40));
    const sampled=pat.count>=12;
    return {score:Math.min(100,score),kind,pat,hist,ready:live||ready,
      reason:live?'Currently Okay and online':ready?'Currently Okay; last action not online':kind==='hospital'?'Hospitalised; check expiry':kind==='away'?'Travelling/abroad':'Check live status'};
  }
  const energyValue=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
  function parseOwnBars(j,at=Date.now()){
    const source=j?.bars??j?.user?.bars??j;
    const energy=source?.energy??source?.bars?.energy??null;
    const current=energyValue(energy?.current??energy?.value??(typeof energy==='number'?energy:null));
    const max=energyValue(energy?.maximum??energy?.max);
    return {current,max,at};
  }
  function parseOwnCooldown(j,at=Date.now()){
    const c=j?.cooldowns??j?.user?.cooldowns??j;
    const medical=energyValue(c?.medical);
    const drug=energyValue(c?.drug);
    return {medicalUntil:medical===null?null:at+medical*1000,
      drugUntil:drug===null?null:at+drug*1000,at};
  }
  async function refreshOwnReadiness(){
    if(!effectiveKey()||!cfg.autoOwnerReadiness)return;
    if(!positive(state.data.meta.ownerId)){
      try{const j=await call('/user/basic','owner-id-readiness',6*HOUR);
        const id=positive(j?.basic?.id||j?.user?.id||j?.id||j?.player_id);
        if(id)state.data.meta.ownerId=id;}catch(_){}
    }
    try{
      const j=await call('/user/bars','own-bars',4*MIN);
      if(j){const parsed=parseOwnBars(j);if(parsed.current!==null)state.data.ownerReadiness.energy=parsed;}
    }catch(_){}
    try{
      const j=await call('/user/cooldowns','own-cooldowns',4*MIN);
      if(j){const parsed=parseOwnCooldown(j);if(parsed.medicalUntil!==null)state.data.ownerReadiness.cooldown=parsed;}
    }catch(_){}
    state.data.ownerReadiness.ownerId=positive(state.data.meta.ownerId);
  }
  // Existing owned reports are read automatically; no one needs to type stats.
  // Private teammate/opponent battle stats outside shared spy reports are not public.
  async function refreshBattleIntel(){
    const owner=positive(state.data.meta?.ownerId);
    if(!effectiveKey()||!owner)return;
    try{
      const response=await call('/user/battlestats','own-battlestats',10*MIN);
      if(response){
        const stats=parseOwnBattleStats(response);
        if(stats)applyAutoSpies({[owner]:stats},owner);
        else state.data.errors['own-battlestats']='No complete battle stats in API response';
      }
    }catch(_){}
    for(const [url,kind,source] of [
      ['/user/reports?cat=stats&limit=100','user-stat-reports','Torn personal spy report'],
      ['/faction/reports?cat=stats&limit=100','faction-stat-reports','Torn faction spy report']]){
      try{
        const response=await call(url,kind,20*MIN);
        if(response)applyAutoSpies(parseStatsReports(response,source),owner);
      }catch(_){}
    }
    state.data.meta.autoBattleCount=Object.keys(state.data.autoSpies).length;
  }
  function manualReadinessFor(id,at=Date.now()){
    const r=cfg.manualReadiness[String(positive(id))];
    if(!r||!r.at||at-n(r.at)>45*MIN)return null;
    return r;
  }
  function hitterReadiness(p,at=Date.now()){
    if(!p)return {energy:null,medicalLeft:null,status:'Unknown',source:'No member'};
    const okay=memberState(p)==='okay',owner=positive(state.data.meta.ownerId)===positive(p.id)&&positive(p.id)>0;
    const automatic=owner&&cfg.autoOwnerReadiness!==false?state.data.ownerReadiness:null;
    const recentEnergy=automatic?.energy?.at&&at-n(automatic.energy.at)<15*MIN?automatic.energy:null;
    const recentMed=automatic?.cooldown?.at&&at-n(automatic.cooldown.at)<15*MIN?automatic.cooldown:null;
    const manual=manualReadinessFor(p.id,at);
    const energy=recentEnergy?.current??manual?.energy??null;
    const medicalUntil=recentMed?.medicalUntil??manual?.medicalUntil??null;
    const medLeft=medicalUntil===null?null:Math.max(0,Math.ceil((medicalUntil-at)/MIN));
    const energyEnough=energy===null?null:energy>=25;
    const status=!okay?'Unavailable':energyEnough===false?'Low energy':energyEnough===true?'Attack energy ready':'Energy unknown';
    return {energy,medicalLeft:medLeft,status,energyEnough,
      source:recentEnergy?'Own Torn API':manual?'Manual (<45m)':'Unknown',
      medicalSource:recentMed?'Own Torn API':manual?'Manual (<45m)':'Unknown',okay};
  }
  function attackHistoryFor(friendId,enemyId,at=Date.now()){
    const recent=(state.data.attacks||[]).filter(x=>positive(x.attacker)===positive(friendId)&&
      positive(x.defender)===positive(enemyId)&&n(x.at)>at-30*24*HOUR&&n(x.at)<=at);
    let wins=0,losses=0,unknown=0;
    for(const a of recent){
      const result=String(a.result||'').toLowerCase();
      if(/hospitali[sz]ed|mugged|left|victory|won/.test(result))wins++;
      else if(/lost|defeated|stalemate|timeout|escaped|escape/.test(result))losses++;
      else unknown++;
    }
    return {wins,losses,unknown,total:recent.length,last:recent.length?Math.max(...recent.map(x=>x.at)):0};
  }
  function currentPlanKey(){
    return String(positive(state.data.war?.id)||('scout-'+positive(cfg.enemyId)));
  }
  function turtlePlan(){
    const key=currentPlanKey(),stored=cfg.turtlePlans[key]||{};
    return {key,mode:['balanced','defensive','full'].includes(stored.mode)?stored.mode:'balanced',
      members:stored.members&&typeof stored.members==='object'?stored.members:{},
      updated:n(stored.updated)};
  }
  function turtleAssessment(at=Date.now()){
    const plan=turtlePlan(),ownFresh=rosterFresh('ours',at),enemyFresh=rosterFresh('enemies',at),
      all=state.data.ours,enemy=state.data.enemies;
    let exposed=0,sheltered=0,unclear=0,dueSoon=0,reviveWarnings=0;
    const rows=all.map(p=>{
      const kind=memberState(p),readiness=hitterReadiness(p,at);
      const raw=String(p.status||'').toLowerCase();
      const airborne=kind==='away'&&raw.includes('trav');
      const abroad=kind==='away'&&!airborne;
      const expiry=kind==='hospital'||airborne?n(p.until):0;
      const approaching=expiry>at&&expiry-at<=15*MIN;
      const assigned=String(plan.members[p.id]||'auto');
      const observed=airborne?'Flying':abroad?'Abroad (may be hittable)':
        kind==='hospital'?'Hospital timer':kind==='okay'?'Exposed (Okay)':
        kind==='jail'?'In jail':'Unknown';
      const cover=ownFresh&&(airborne||kind==='hospital'||kind==='jail');
      const danger=ownFresh&&(kind==='okay'||abroad);
      if(cover)sheltered++;else if(danger)exposed++;else unclear++;
      if(approaching)dueSoon++;
      if(ownFresh&&kind==='hospital'&&p.revivable===true)reviveWarnings++;
      return {p,observed,kind,airborne,abroad,assigned,cover,danger,expiry,approaching,readiness};
    });
    const online=all.filter(isOnline).length,enemyOnline=enemy.filter(isOnline).length;
    const pace=warPace(),score=warScore(),warStart=epochMs(state.data.war?.start),
      elapsedHours=warStart&&at>=warStart?(at-warStart)/HOUR:null;
    const losing=pace?.measurable&&Date.now()-pace.last.at<10*MIN&&pace.netRate<-30;
    const suggestion=!ownFresh||!enemyFresh?'Refresh both rosters before changing posture':
      !state.data.war?'Scout opponent before selecting a war defence posture':
      losing&&online<enemyOnline?'Consider defensive turtling for exposed non-hitters; keep proven hitters coordinated':
      exposed>=Math.max(3,Math.ceil(all.length*0.6))&&enemyOnline>online?
        'High exposure against a more online opposition; consider a controlled defensive phase':
      score&&score.net>0?'Lead protection may help, but do not surrender all scoring capability':
      'Balance safe, evidenced hits with protection for members who cannot contribute right now';
    return {plan,rows,ownFresh,enemyFresh,exposed,sheltered,unclear,dueSoon,reviveWarnings,
      online,enemyOnline,pace,score,suggestion,elapsedHours,
      decayPhase:elapsedHours===null?'Unknown':elapsedHours<24?'Before 24h':'24h+ reduction period'};
  }
  function controlTargets(at=Date.now()){
    const fresh=rosterFresh('enemies',at),key=currentPlanKey();
    const stored=cfg.controlAssignments[key]||{};
    const threats=enemyThreatRows(positive(state.data.war?.id));
    const priority=new Map(threats.map((x,i)=>[x.player.id,Math.max(0,40-i*3)]));
    return state.data.enemies.map(p=>{
      const kind=memberState(p),expiry=kind==='hospital'&&n(p.until)>at?n(p.until):0,
        due=expiry?Math.max(0,Math.ceil((expiry-at)/MIN)):null;
      const leader=positive(stored[p.id]),watch=Boolean(cfg.watchlist[p.id]),
        highThreat=priority.get(p.id)||0;
      const score=highThreat+(watch?20:0)+(leader?18:0)+
        (kind==='hospital'&&due!==null&&due<20?25:0);
      return {p,kind,expiry,due,leader,watch,highThreat,score,active:fresh,
        note:kind==='hospital'?'Observed in hospital':
          kind==='okay'?'Currently Okay; monitor for a new hospital state':
          kind==='away'?'Travelling/abroad; not an immediate hit':'Status unverified'};
    }).filter(x=>x.leader||x.watch||x.highThreat||x.kind==='hospital')
      .sort((a,b)=>b.score-a.score||((a.due??Infinity)-(b.due??Infinity))||a.p.id-b.p.id);
  }
  function enemyThreatRows(warId=positive(state.data.war?.id)){
    const ledger=warHitLedger(warId),last=latestFinished('enemies');
    const lastReport=last?state.data.reports[last.id]?.factions?.find(x=>x.id===positive(cfg.enemyId)):null;
    const officialPrev=new Map((lastReport?.members||[]).map(p=>[p.id,p]));
    return state.data.enemies.map(player=>{
      const attempted=ledger.theirs.players[player.id]||null;
      const live=attempted&&attempted.scoringHits>0?attempted:null;
      const previous=officialPrev.get(player.id)||null;
      const threat=live?live.respect*1.8+live.scoringHits*12:previous?Math.min(150,n(previous.score)/10):0;
      const label=live?'Recorded scoring ranked-war attacks':
        previous?'Previous official completed-war score':attempted?'Recorded non-scoring attempts':'No usable scoring evidence';
      const status=memberState(player);
      return {player,live,attempted,previous,score:threat,label,status,
        source:live?'Recorded scoring attacks':previous?'Prior war report':attempted?'Non-scoring attempts':'Unknown',
        confidence:live?'Observed partial ledger':previous?'Historical only':attempted?'Attempts only':'Unknown'};
    }).sort((a,b)=>b.score-a.score||a.player.id-b.player.id);
  }
  function blackSkullScorecards(warId){
    const id=positive(warId),r=state.data.reports[id],side=r?.factions?.find(x=>x.id===positive(cfg.ourId));
    const reportNames=new Map((side?.members||[]).map(x=>[x.id,x]));
    const roster=new Map(state.data.ours.map(p=>[p.id,p]));
    const records=[],observedHits=warHitLedger(id).ours.players;
    for(const [sid,yes] of Object.entries(cfg.blackSkulls)){
      if(!yes)continue;
      const playerId=positive(sid),report=reportNames.get(playerId);
      const historical=(state.data.ourWars||[]).filter(w=>w.end&&positive(w.id)!==id)
        .sort((a,b)=>b.end-a.end).map(w=>state.data.reports[w.id]?.factions
          ?.find(x=>x.id===positive(cfg.ourId))?.members?.find(x=>x.id===playerId))
        .filter(Boolean).slice(0,3);
      const prev=historical.length?historical.reduce((z,p)=>z+n(p.score),0)/historical.length:null;
      const observed=observedHits[playerId]||null;
      records.push({id:playerId,name:String(report?.name||roster.get(playerId)?.name||('Player '+playerId)),
        score:report?officialNumber(report.score):null,
        hits:report?officialNumber(report.attacks):null,
        share:side?.score&&report?100*n(report.score)/n(side.score):null,
        previousAvg:prev,source:report?'Official report':'Not in report',
        sampled:observed});
    }
    return records.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.id-b.id);
  }
  function scoreAcceleration(id=positive(state.data.war?.id),now=Date.now()){
    const line=state.data.scoreTimelines[String(positive(id))];
    const points=(line?.points||[]).filter(x=>n(x.at)&&x.at<=now).slice().sort((a,b)=>a.at-b.at);
    if(points.length<3)return null;
    const last=points[points.length-1];
    if(now-last.at>10*MIN)return null;
    const boundary=last.at-15*MIN,mid=[...points].reverse().find(x=>x.at<=boundary);
    if(!mid)return null;
    const old=[...points].reverse().find(x=>x.at<=mid.at-10*MIN&&x.at>=mid.at-60*MIN);
    if(!old)return null;
    const recentDuration=(last.at-mid.at)/HOUR,oldDuration=(mid.at-old.at)/HOUR;
    if(recentDuration<10/60||recentDuration>35/60||oldDuration<10/60||oldDuration>60/60)return null;
    const recentEnemy=Math.max(0,n(last.enemy)-n(mid.enemy))/recentDuration;
    const previousEnemy=Math.max(0,n(mid.enemy)-n(old.enemy))/oldDuration;
    const recentOurs=Math.max(0,n(last.our)-n(mid.our))/recentDuration;
    const previousOurs=Math.max(0,n(mid.our)-n(old.our))/oldDuration;
    const increase=recentEnemy-previousEnemy;
    const accelerating=recentEnemy>=60&&increase>=35&&
      (previousEnemy<1||recentEnemy/previousEnemy>=1.35);
    return {recentEnemy,previousEnemy,recentOurs,previousOurs,increase,
      accelerating,observedAt:last.at,coverage:[old.at,mid.at,last.at],
      label:accelerating?'Enemy scoring accelerating':increase>0?'Enemy scoring rising':'Enemy scoring steady or slowing'};
  }
  function rosterFresh(side,at=Date.now(),maxAge=5*MIN){
    const stamp=n(state.data.updated?.[side]);
    return stamp>0&&at>=stamp&&at-stamp<maxAge&&Array.isArray(state.data[side])&&state.data[side].length>0;
  }
  function enemyHospitalExit(player,at=Date.now()){
    if(!player||memberState(player)!=='hospital')return null;
    const until=n(player.until);
    if(until<=at-2*MIN||until>at+4*HOUR)return null;
    return {player,eta:until,minutes:Math.max(0,Math.ceil((until-at)/MIN)),
      source:'Torn roster hospital expiry',fresh:rosterFresh('enemies',at)};
  }
  function watchedTargetIds(){
    const ids=new Set(Object.keys(cfg.watchlist).filter(id=>cfg.watchlist[id]).map(positive).filter(Boolean));
    for(const [id,target] of Object.entries(cfg.assignments)){
      if(state.data.ours.some(p=>p.id===positive(id))&&state.data.enemies.some(p=>p.id===positive(target)))ids.add(positive(target));
    }
    return ids;
  }
  function matchEvidence(friend,enemy){
    const m=matchup(friend,enemy),official=lastKnownMemberScore('enemies',enemy.id);
    const enemySpy=spy(enemy.id),friendSpy=spy(friend.id);
    const latest=enemySpy?.observedAt||0;
    const exactStats=Boolean(m.exact);
    const encounters=attackHistoryFor(friend.id,enemy.id);
    const knownLoss=encounters.losses>0;
    const rosterVerified=rosterFresh('ours')&&rosterFresh('enemies');
    const freshSpies=exactStats&&n(latest)>0&&n(friendSpy?.observedAt)>0&&
      Date.now()-latest<30*24*HOUR&&Date.now()-n(friendSpy?.observedAt)<30*24*HOUR;
    const externalOnly=m.known&&!exactStats;
    const active=memberState(enemy)==='okay';
    const conflict=Object.entries(cfg.assignments).some(([id,target])=>
      positive(id)!==positive(friend.id)&&positive(target)===positive(enemy.id));
    let category='Scout',reason='Missing comparable stats',tier=3;
    if(!rosterVerified){category='Refresh roster';reason='One or both rosters older than five minutes; current status unverified';tier=3;}
    else if(!active){category='Unavailable';reason=memberState(enemy)==='hospital'?'In hospital':memberState(enemy)==='away'?'Travelling / abroad':'Not Okay';tier=5;}
    else if(m.known&&m.ratio>=1.15){category='Avoid';reason='Enemy modelled battle strength is higher';tier=4;}
    else if(exactStats&&m.known&&m.ratio<0.8&&!freshSpies){
      category='Recheck old spies';reason='One or both spy records are older than 30 days or undated';tier=2;
    }else if(knownLoss){category='Reassess losses';reason=encounters.losses+' recent recorded loss(es) for this hitter';tier=4;
    }else if(exactStats&&m.known&&m.ratio<0.7){
      category='Strong candidate';reason='Recent favourable exact API / spy stats'+(encounters.wins?' + '+encounters.wins+' confirmed recent win(s)':'')+'; verify buffs';tier=0;
    }else if(exactStats&&m.known&&m.ratio<0.8){
      category='Possible';reason='Exact BSS margin; verify buffs';tier=1;
    }else if(externalOnly&&m.known&&m.ratio<0.4){
      category='Provisional API candidate';reason='Recent FFScouter public estimates suggest a wide BSS margin; win not confirmed';tier=1;
    }else if(externalOnly&&m.known&&m.ratio<0.8){
      category='Estimate only';reason='FFScouter public BSS model, not an exact matchup';tier=2;
    }else if(m.known){category='Risky';reason='Close or unfavourable modelled battle score';tier=4;}
    const threat=null; // History influences ranking below; avoid quadratic roster-wide threat recalculation.
    const statusBonus=isOnline(enemy)?5:0;
    const points=official===null?0:Math.min(18,Math.round(Math.log10(official+1)*4));
    const score=Math.max(0,100-tier*18+points+statusBonus-(conflict?12:0)+
      (encounters.wins&&!knownLoss?Math.min(22,encounters.wins*8):0)-
      (knownLoss?25:0)-(m.known?Math.round(Math.min(20,m.ratio*16)):0));
    const reliability=tier===0&&encounters.wins>=2?'Repeat observed wins':
      tier===0?'Favourable exact API / spy figures':tier===1?'Provisional; check buffs':
      knownLoss?'Past losses recorded':tier===2?'Evidence needs checking':'Not demonstrated';
    return {friend,enemy,match:m,category,reason,tier,score,threat,reliability,encounters,rosterVerified,
      official,conflict,verified:exactStats,estimated:externalOnly,
      ffForHitter:m.known?m.ff:null};
  }

  // FFScouter BSS is a public statistical estimate; never confuse it with
  // the API-key owner's personal FF multiplier or a verified spy.
  function battleIntelSummary(){
    const total=state.data.enemies.length;
    let exact=0,estimated=0;
    for(const p of state.data.enemies){
      if(bsScore(spy(p.id))!==null){exact++;continue;}
      const f=ffscouter(p.id);
      if(f&&!ffIsStale(f)&&Number.isFinite(Number(f.bss))&&Number(f.bss)>0)
        estimated++;
    }
    return {total,exact,estimated,unknown:total-exact-estimated,
      ownKnown:state.data.ours.filter(p=>bsScore(spy(p.id))!==null).length};
  }
  function battleIntelCard(){
    const x=battleIntelSummary();
    return card('AUTOMATIC BATTLE INTELLIGENCE | DATA QUALITY',
      '<div class="ws-inline-metrics"><span>Enemy exact: '+fmt(x.exact)+'</span>'+
      '<span>Enemy estimates: '+fmt(x.estimated)+'</span>'+
      '<span>Enemy unknown: '+fmt(x.unknown)+'</span>'+
      '<span>Own exact: '+fmt(x.ownKnown)+' / '+fmt(state.data.ours.length)+'</span></div>'+
      '<p class="ws-small">Exact: own authorised Torn battlestats and readable spy reports. Public FFScouter BSS is an estimate. Hidden enemy stats are not obtainable from a public player request.</p>'+
      '<p class="ws-small">Own API '+esc(age(state.data.updated['own-battlestats']))+
      ' | Personal reports '+esc(age(state.data.updated['user-stat-reports']))+
      ' | Faction reports '+esc(age(state.data.updated['faction-stat-reports']))+
      ' | FFScouter '+esc(age(state.data.updated.ffscouter))+'</p>'+
      '<div class="ws-toolbar">'+b('Modelled matchups','tab:matchups')+
      b('Source diagnostics','tab:diagnostics')+'</div>');
  }
  function enemyBattleEstimate(enemy){
    if(!enemy)return {value:null,source:'Unknown',verified:false};
    const report=spy(enemy.id),known=bsScore(report),
      freshManual=known!==null&&n(report?.observedAt)>0&&
        Date.now()>=n(report.observedAt)&&Date.now()-n(report.observedAt)<=30*24*HOUR;
    if(freshManual)return {value:known,source:'Recent '+String(report.source||'local spy'),verified:true};
    const third=ffscouter(enemy.id);
    if(third&&!ffIsStale(third)&&Number.isFinite(third.bss)&&third.bss>0)
      return {value:third.bss,source:'Fresh FFScouter public BSS estimate',verified:false};
    return {value:null,source:'Unknown - no readable Torn report or enabled FFScouter estimate',verified:false};
  }
  // Skull Capo can choose percent-of-known-opponents or an absolute BSS threshold.
  // Never label a missing estimate as a weak opponent or shuffle by hospital state.
  function heavyRule(input=cfg.heavyPolicy){
    const mode=input?.mode==='min-bss'?'min-bss':'percent',
      percentage=Number(input?.percent),
      threshold=Number(input?.minBss);
    return {mode,percent:Number.isFinite(percentage)?
        Math.max(5,Math.min(100,Math.round(percentage))):40,
      minBss:Number.isFinite(threshold)&&threshold>=0?
        Math.min(1e15,threshold):0};
  }
  function enemyRoleBands(){
    const rule=heavyRule(),ranked=state.data.enemies.map(enemy=>({
      enemy,...enemyBattleEstimate(enemy)
    })).filter(x=>x.value!==null).sort((a,b)=>b.value-a.value||
      n(b.enemy.level)-n(a.enemy.level)||a.enemy.id-b.enemy.id);
    const heavyCount=rule.mode==='percent'?
      (ranked.length?Math.max(1,Math.ceil(ranked.length*rule.percent/100)):0):
      ranked.filter(x=>x.value>=rule.minBss).length,
      heavy=new Set(ranked.slice(0,heavyCount).map(x=>x.enemy.id)),
      regular=new Set(ranked.slice(heavyCount).map(x=>x.enemy.id));
    return {heavy,regular,heavyCount,regularCount:regular.size,
      known:ranked.length,unknown:state.data.enemies.length-ranked.length,
      threshold:ranked[heavyCount-1]?.value??null,ranked,rule};
  }
  function enemyRole(enemy,band=enemyRoleBands()){
    if(!enemy)return 'unknown';
    return band.heavy.has(positive(enemy.id))?'heavy':
      band.regular.has(positive(enemy.id))?'regular':'unclassified';
  }
  function roleAllows(friend,enemy,band=enemyRoleBands()){
    return enemyRole(enemy,band)===(cfg.blackSkulls[positive(friend?.id)]?'heavy':'regular');
  }
  function roleMatch(friend,enemy,band=enemyRoleBands()){
    if(!friend||!enemy||memberState(friend)!=='okay'||memberState(enemy)!=='okay'||
      !roleAllows(friend,enemy,band))return null;
    const ev=matchEvidence(friend,enemy),r=hitterRisk(friend.id),ratio=ev.match?.ratio;
    if(!ev.verified||!ev.rosterVerified||!Number.isFinite(ratio)||
       ratio>r.maxRatio||ev.encounters.losses>0||ev.conflict||
       ev.encounters.wins<r.minWins||
       (ev.tier!==0&&!(r.mode==='aggressive'&&ev.tier===1)))return null;
    return ev;
  }

  // Explicit coverage inventory for the Skull Capo. An assignment is not proof
  // of a successful or even currently possible fight.

  // Rank squad targets by known enemy BSS and verified historical performance.
  // Missing per-player score is UNKNOWN, not 0 points scored.
  function heavyTargetPriorities(bands=enemyRoleBands()){
    const heavy=bands.ranked.filter(x=>bands.heavy.has(x.enemy.id));
    const ledger=warHitLedger(),live=ledger.theirs.players||{},
      last=latestFinished('enemies'),
      prior=last?state.data.reports[String(last.id)]?.factions
        ?.find(f=>positive(f.id)===positive(cfg.enemyId)):null,
      past=new Map((prior?.members||[]).map(p=>[positive(p.id),p])),
      maxBss=Math.max(1,...heavy.map(x=>x.value)),minBss=Math.min(maxBss,...heavy.map(x=>x.value)),
      knownHistorical=heavy.map(x=>past.get(x.enemy.id)).filter(Boolean),
      maxPast=Math.max(1,...knownHistorical.map(x=>n(x.score))),
      maxLive=Math.max(1,...heavy.map(x=>n(live[x.enemy.id]?.respect)));
    return new Map(heavy.map(x=>{
      const h=past.get(x.enemy.id)||null,l=live[x.enemy.id]||null,
        power=maxBss===minBss?1:
          Math.max(0,Math.min(1,(Math.log10(x.value)-Math.log10(minBss))/
            (Math.log10(maxBss)-Math.log10(minBss)))),
        history=h?Math.max(0,Math.min(1,n(h.score)/maxPast)):null,
        recent=l&&n(l.scoringHits)>0?
          Math.max(0,Math.min(1,n(l.respect)/maxLive)):null;
      const score=60*power+(history===null?0:25*history)+
        (recent===null?0:15*recent);
      return [x.enemy.id,{score,historyPoints:h?officialNumber(h.score):null,
        historyAttacks:h?officialNumber(h.attacks):null,historyWarId:h?last.id:null,
        liveRespect:recent===null?null:n(l.respect),
        source:history===null?'No official per-player historical score loaded':
          'Official last completed war #'+last.id,
        confidence:history===null?'BSS-only priority':'BSS + official historical war score'}];
    }));
  }
  function blackSkullsCoverage(at=Date.now()){
    const bands=enemyRoleBands(),skulls=state.data.ours.filter(p=>cfg.blackSkulls[p.id]),
      teamReady=rosterFresh('ours',at),enemiesReady=rosterFresh('enemies',at),
      rankedPriorities=heavyTargetPriorities(bands);
    const targets=bands.ranked.filter(x=>bands.heavy.has(x.enemy.id)).map(x=>{
      const assigned=skulls.filter(p=>positive(cfg.assignments[p.id])===positive(x.enemy.id));
      const viable=teamReady&&enemiesReady&&memberState(x.enemy)==='okay'?
        skulls.map(player=>({player,evidence:roleMatch(player,x.enemy,bands)}))
          .filter(z=>z.evidence).sort((a,b)=>a.evidence.match.ratio-b.evidence.match.ratio||
            b.evidence.score-a.evidence.score):[];
      const free=viable.filter(z=>!positive(cfg.assignments[z.player.id])&&
        hitterReadiness(z.player,at).energyEnough!==false);
      const covered=assigned.length>0,verified=assigned.some(p=>
        viable.some(v=>v.player.id===p.id&&
          hitterReadiness(p,at).energyEnough!==false));
      const blocked=covered&&assigned.every(p=>memberState(p)!=='okay'||
        hitterReadiness(p,at).energyEnough===false||
        !viable.some(v=>v.player.id===p.id));
      const replacement=blocked&&assigned.length===1&&free.length&&
        memberState(x.enemy)==='okay'?free[0]:null;
      const priority=rankedPriorities.get(x.enemy.id)||null;
      const reason=!teamReady||!enemiesReady?'Roster stale - refresh':
        memberState(x.enemy)!=='okay'?'Enemy not available at this moment':
        covered?verified?'Assigned Black Skull has favourable verified evidence':
          replacement?'Assigned hitter unavailable / unsuitable; verified replacement suggested':
          'Assigned, but matchup or hitter readiness needs verification':
        free.length?'Unassigned - eligible Black Skull available':
        viable.length?'Unassigned - verified hitters already have other orders':
          'Unassigned - no verified favourable Black Skull matchup';
      return {enemy:x.enemy,bss:x.value,source:x.source,assigned,viable,free,
        covered,verified,blocked,replacement,priority,reason,needsAssignment:!covered};
    }).sort((a,b)=>Number(b.needsAssignment||b.blocked)-
      Number(a.needsAssignment||a.blocked)||
      n(b.priority?.score)-n(a.priority?.score)||b.bss-a.bss||a.enemy.id-b.enemy.id);
    return {bands,skulls,targets,unassigned:targets.filter(x=>x.needsAssignment).length,
      assigned:targets.filter(x=>x.covered).length,
      verifiedAssigned:targets.filter(x=>x.verified).length,
      blocked:targets.filter(x=>x.blocked).length,
      replacements:targets.filter(x=>x.replacement).length,
      missingEvidence:targets.filter(x=>!x.covered&&!x.viable.length).length};
  }
  function blackSkullsCoverageCard(maxItems=30){
    const data=blackSkullsCoverage(),cutoff=data.bands.rule;
    return card('Black Skulls target coverage | Skull Capo',
      '<p><b>'+fmt(data.assigned)+' / '+fmt(data.targets.length)+'</b> heavy targets have a saved Black Skull assignment; '+
      fmt(data.verifiedAssigned)+' assigned targets currently pass a verified hitter matchup. '+
      'Not assigned: <b>'+fmt(data.unassigned)+'</b>. '+
      'Unavailable/unsafe assigned hitters: '+fmt(data.blocked)+
      ' | verified free replacement suggestions: '+fmt(data.replacements)+
      '. An order does not prove a target is hittable.</p>'+
      '<p>Heavy policy: '+(cutoff.mode==='min-bss'?
        'minimum BSS '+fmt(cutoff.minBss):
        'top '+fmt(cutoff.percent)+'% of '+fmt(data.bands.known)+' known BSS opponents')+
        '. '+fmt(data.bands.unknown)+' opponents have unknown BSS and need scouting.</p>'+
      (data.targets.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>High-strength opponent</th><th>BSS</th><th>Last war points</th><th>Priority</th>'+
        '<th>Current status</th>'+
        '<th>Assigned Black Skull</th><th>Coverage / next move</th></tr></thead><tbody>'+
        data.targets.slice(0,maxItems).map(x=>'<tr><td>'+infoButton(x.enemy.name,x.enemy.id)+
          ' '+ffBadge(x.enemy.id)+'<br><small>Lv '+fmt(x.enemy.level)+'</small></td>'+
          '<td>'+fmt(x.bss)+'<br><small>'+esc(x.source)+'</small></td>'+
          '<td>'+(x.priority?.historyPoints===null?'Unknown':
            fmt(x.priority.historyPoints)+' in war #'+x.priority.historyWarId)+'</td>'+
          '<td>'+fmt(x.priority?.score)+' / 100<br><small>'+
            esc(x.priority?.confidence||'Unrated')+'</small></td>'+
          '<td>'+pill(x.enemy.status,memberState(x.enemy)==='okay'?'good':'')+'</td>'+
          '<td>'+(x.assigned.length?x.assigned.map(p=>infoButton(p.name,p.id)).join(', '):
            pill('UNASSIGNED','bad'))+'</td>'+
          '<td>'+pill(x.reason,x.verified?'good':x.needsAssignment||x.blocked?'bad':'')+
            '<br>'+(x.replacement?
              b('Replace '+x.assigned[0].name+' with '+x.replacement.player.name,
                'skull-replace:'+x.assigned[0].id+':'+x.replacement.player.id+':'+x.enemy.id):
              !x.covered&&x.free.length?
                b('Assign '+x.free[0].player.name,'skull-assign:'+x.free[0].player.id+':'+x.enemy.id):
                b('Inspect enemy','player:'+x.enemy.id))+'</td></tr>').join('')+
        '</tbody></table></div>':empty('No known high-strength targets at this cutoff. Change policy or collect BSS evidence.'))+
      '<div class="ws-toolbar">'+b('Manage cutoff','tab:leader')+
        b('Black Skulls', 'tab:skulls')+
        b('Copy Black Skulls briefing','copy-skull-chat')+
        b('Manual orders','tab:command')+b('Refresh status','refresh')+'</div>');
  }
  function personalShortlist(friend,limit=8){
    if(!friend)return [];
    return state.data.enemies.map(e=>matchEvidence(friend,e))
      .sort((a,b)=>a.tier-b.tier||b.score-a.score||a.enemy.id-b.enemy.id)
      .slice(0,limit);
  }
  function hitterPlanKey(friendId){
    return (positive(state.data.war?.id)?'war:'+state.data.war.id:'scout:'+positive(cfg.enemyId))+
      ':member:'+positive(friendId);
  }
  function hitterPlanStatus(friendId){
    return String(cfg.planStatus[hitterPlanKey(friendId)]||'not-set');
  }
  function hitterPlanStatuses(){
    return [['not-set','Unassigned status'],['ready','Ready'],['engaged','Engaged'],['monitor','Monitoring target'],
      ['standby','Standby'],['support','Support'],['needs-spy','Need intelligence'],['complete','Complete']];
  }
  function leadershipSummary(){
    const ours=state.data.ours,enemy=state.data.enemies;
    const skulls=ours.filter(p=>Boolean(cfg.blackSkulls[p.id]));
    const ready=ours.filter(p=>memberState(p)==='okay'),skullReady=skulls.filter(p=>memberState(p)==='okay');
    const manual=ours.filter(p=>state.data.enemies.some(e=>e.id===positive(cfg.assignments[p.id]))).length;
    const inProgress=ours.filter(p=>['engaged','monitor'].includes(hitterPlanStatus(p.id))).length;
    const conflicts=new Map();
    for(const member of ours){
      const target=positive(cfg.assignments[member.id]);
      if(target&&enemy.some(e=>e.id===target))conflicts.set(target,(conflicts.get(target)||0)+1);
    }
    return {members:ours.length,enemy:enemy.length,ready:ready.length,skulls:skulls.length,skullReady:skullReady.length,
      manual,inProgress,unassigned:ours.length-manual,
      duplicateTargets:[...conflicts].filter(([_,count])=>count>1).map(([id,count])=>({id,count})),
      tracked:enemy.filter(p=>Boolean(cfg.watchlist[p.id])).length};
  }
  // Augmenting-path matching prioritises covering the maximum number of
  // evidenced Black Skulls instead of giving the first roster member every
  // strong target. It is a plan preview, never an attack or game-state write.

  function suggestedDraft(at=Date.now()){
    if(!rosterFresh('ours',at)||!rosterFresh('enemies',at))return [];
    const bands=enemyRoleBands(),claimed=new Set(Object.entries(cfg.assignments)
      .filter(([id,target])=>state.data.ours.some(p=>p.id===positive(id))&&
        state.data.enemies.some(p=>p.id===positive(target)))
      .map(([,target])=>positive(target)));
    const candidates=state.data.ours.filter(p=>memberState(p)==='okay'&&
      !positive(cfg.assignments[p.id])&&hitterReadiness(p,at).energyEnough!==false)
      .map(friend=>{
        const black=Boolean(cfg.blackSkulls[friend.id]);
        const options=state.data.enemies.filter(p=>memberState(p)==='okay'&&
          !claimed.has(p.id)&&roleAllows(friend,p,bands))
          .map(enemy=>({enemy,evidence:roleMatch(friend,enemy,bands),
            bss:enemyBattleEstimate(enemy).value}))
          .filter(x=>x.evidence)
          .sort((a,b)=>black?(b.bss-a.bss||b.evidence.score-a.evidence.score):
            b.evidence.score-a.evidence.score||a.bss-b.bss);
        return {friend,options,black};
      }).filter(x=>x.options.length)
      .sort((a,b)=>a.options.length-b.options.length||
        Number(b.black)-Number(a.black)||a.friend.id-b.friend.id);
    const byId=new Map(candidates.map(x=>[x.friend.id,x]));
    const booked=new Map(),matched=new Map();
    function place(friendId,seen){
      const entry=byId.get(friendId);if(!entry)return false;
      for(const choice of entry.options){
        const target=choice.enemy.id;
        if(seen.has(target))continue;
        seen.add(target);
        const current=booked.get(target);
        if(!current||place(current,seen)){
          booked.set(target,friendId);matched.set(friendId,choice);
          return true;
        }
      }
      return false;
    }
    for(const entry of candidates)place(entry.friend.id,new Set());
    return [...matched.entries()].map(([id,choice])=>{
      const friend=byId.get(id).friend;
      return {friend,enemy:choice.enemy,reason:cfg.blackSkulls[id]?
        'Black Skull: difficult enemy in top BSS bracket, verified relative matchup':
        'Regular member: lower-BSS bracket, verified relative matchup',
        evidence:choice.evidence.reliability,score:choice.evidence.score,
        category:choice.evidence.category,bss:choice.bss};
    }).sort((a,b)=>Number(Boolean(cfg.blackSkulls[b.friend.id]))-
      Number(Boolean(cfg.blackSkulls[a.friend.id]))||
      (cfg.blackSkulls[a.friend.id]?b.bss-a.bss:b.score-a.score)||
      a.friend.id-b.friend.id);
  }

  function assignments(){
    const ours=state.data.ours.slice().sort((a,b)=>
      Number(Boolean(cfg.blackSkulls[b.id]))-Number(Boolean(cfg.blackSkulls[a.id]))||
      Number(isOnline(b))-Number(isOnline(a)));
    const bands=enemyRoleBands(),available=state.data.enemies.filter(p=>evaluate(p).ready),
      claimed=new Set(Object.entries(cfg.assignments)
        .filter(([id,target])=>state.data.ours.some(p=>p.id===positive(id))&&
          available.some(e=>e.id===positive(target))).map(([,target])=>positive(target)));
    const used=new Set();
    return ours.map(p=>{
      if(memberState(p)!=='okay')return {friend:p,enemy:null,
        reason:memberState(p)==='hospital'?'Recover / monitor hospital expiry':
          memberState(p)==='away'?'Travelling / return and prepare':'Standby / unavailable',details:null};
      const fixed=positive(cfg.assignments[p.id]),manual=available.find(x=>x.id===fixed);
      const invalid=manual&&!roleAllows(p,manual,bands);
      let selected=manual&&!invalid?manual:null,reason=selected?
        'Manual order - '+(cfg.blackSkulls[p.id]?'Black Skulls heavy bracket':'Regular target bracket'):'';
      if(!selected){
        const options=available.filter(x=>!claimed.has(x.id)&&!used.has(x.id)&&
          roleAllows(p,x,bands)).map(enemy=>({enemy,evidence:roleMatch(p,enemy,bands),
            strength:enemyBattleEstimate(enemy).value})).filter(x=>x.evidence);
        options.sort((a,b)=>cfg.blackSkulls[p.id]?b.strength-a.strength||
          b.evidence.score-a.evidence.score:b.evidence.score-a.evidence.score||
          a.strength-b.strength);
        selected=options[0]?.enemy||null;
        reason=invalid?'Saved order is outside the member role - reassign manually':
          selected?cfg.blackSkulls[p.id]?'Best evidenced tougher enemy reserved for a Black Skull':
          'Favourable lower-BSS member target':'No verified in-role matchup; scout opponents';
      }
      if(selected)used.add(selected.id);
      return {friend:p,enemy:selected,reason,details:selected?matchup(p,selected):null};
    });
  }
  function leadershipBrief(){
    const plan=leadershipSummary(),pace=warPace(),time=new Date().toISOString();
    return 'WarStaxx local leadership briefing | '+time+'\n'+
      'War #'+(state.data.war?.id||'scouting')+' vs faction #'+(positive(cfg.enemyId)||'unknown')+'\n'+
      'Our ready '+plan.ready+'/'+plan.members+' | Black Skulls '+plan.skullReady+'/'+plan.skulls+
      ' | Manual assignments '+plan.manual+'/'+plan.members+'\n'+
      (pace?'Observed last-hour score pace: ours '+(pace.rateOur===null?'unknown':pace.rateOur.toFixed(1))+
        ' pts/h, theirs '+(pace.rateEnemy===null?'unknown':pace.rateEnemy.toFixed(1))+' pts/h ('+pace.confidence+')\n':'')+
      state.data.ours.map(p=>{
        const id=positive(cfg.assignments[p.id]);
        const enemy=state.data.enemies.find(x=>x.id===id);
        return (cfg.blackSkulls[p.id]?'[BLACK SKULL] ':'')+p.name+
          ' ['+p.id+'] | '+p.status+' | '+hitterPlanStatus(p.id)+
          ' | '+(enemy?'Target '+enemy.name+' ['+id+'] | '+enemy.status:'No manual target');
      }).join('\n')+'\n'+
      'Notes: '+(cfg.leaderNotes[positive(state.data.war?.id)||('scout-'+positive(cfg.enemyId))]||'None')+'\n'+
      'Source: recent Torn API rosters + locally saved assignments/observations. Verify all statuses and hits manually.';
  }

  function skullChatBrief(){
    const war=state.data.war,cover=blackSkullsCoverage(),score=warScore(),
      chain=chainStatus(),fresh=rosterFresh('ours')&&rosterFresh('enemies'),
      heavy=cover.targets.slice().sort((a,b)=>
        n(b.priority?.score)-n(a.priority?.score)||b.bss-a.bss);
    const role=cover.bands.rule,cutoff=role.mode==='percent'?
      'top '+role.percent+'% of known enemy BSS':'estimated BSS >= '+fmt(role.minBss);
    const header=['BLACK SKULLS | SKULL CAPO',
      'War #'+(positive(war?.id)||'scouting')+' vs '+(war?.opponentName||('Faction #'+positive(cfg.enemyId))),
      'Score '+(score?fmt(score.our)+'-'+fmt(score.enemy)+' (net '+fmt(score.net)+')':'not observed')+
        ' | Chain '+(chain.fresh?'#'+chain.count+' / '+chain.remaining+'s':'unknown'),
      'Cutoff: '+cutoff+' | Heavy coverage '+cover.assigned+'/'+cover.targets.length+
        ' assigned, '+cover.verifiedAssigned+' matchup-verified',
      'Roster: '+(fresh?'fresh':'STALE - refresh before acting')];
    const team=cover.skulls.slice().sort((a,b)=>a.name.localeCompare(b.name))
      .map(p=>{
        const enemy=state.data.enemies.find(x=>x.id===positive(cfg.assignments[p.id])),
          ready=hitterReadiness(p);
        return p.name+' ['+p.id+'] | '+memberState(p)+
          ' | '+(enemy?'Target '+enemy.name+' ['+enemy.id+']':'No target')+
          ' | E '+(ready.energy===null?'unknown':fmt(ready.energy));
      });
    const pending=heavy.filter(x=>x.needsAssignment||x.blocked).slice(0,7).map(x=>
      x.enemy.name+' ['+x.enemy.id+'] BSS '+fmt(x.bss)+
      ' | last war '+(x.priority?.historyPoints===null?'unknown':fmt(x.priority.historyPoints)+' pts')+
      ' | '+(x.replacement?'Suggest '+x.replacement.player.name+' for '+x.assigned[0].name:
        !x.covered&&x.free.length?'Suggest '+x.free[0].player.name:
          'Need verified free hitter'));
    return [...header,'ORDERS:',...(team.length?team:['No tagged Black Skulls']),
      'HEAVY TARGETS NEEDING COVERAGE:',...(pending.length?pending:['None identified']),
      'Check live status and individual spies before any manual attack. Orders are suggestions, not automatic actions.'
    ].join('\n').slice(0,3200);
  }
  function copiedWarOrders(){
    const rows=assignments(),last=Math.max(n(state.data.updated.enemies),n(state.data.updated.ours));
    return 'WarStaxx \u00b7 '+(state.data.war?.opponentName||('Opponent faction '+(positive(cfg.enemyId)||'unknown')))+'\n'+
      'Generated '+new Date().toISOString()+' \u00b7 roster '+age(last)+'\n'+
      rows.map(x=>(cfg.blackSkulls[x.friend.id]?'[BLACK SKULL] ':'')+x.friend.name+' ['+x.friend.id+'] \u2192 '+
        (x.enemy?x.enemy.name+' ['+x.enemy.id+']':'Scout / Support / Standby')+' \u2014 '+x.reason+
        (x.details?.known?'; FF approx. '+x.details.ff.toFixed(2)+'x':'')).join('\n')+'\n'+
      'Review live Torn status & verify targets before attacking. No orders were executed.';
  }
  function warScore(){
    const w=state.data.war,our=w?.factions?.find(f=>f.id===positive(cfg.ourId)),theirs=w?.factions?.find(f=>f.id!==positive(cfg.ourId));
    if(!our||!theirs||officialNumber(our.score)===null||officialNumber(theirs.score)===null)return null;
    return {our:n(our.score),enemy:n(theirs.score),net:n(our.score)-n(theirs.score),target:n(w.target)};
  }
  function currentAlerts(){
    const out=[];
    const w=activeWarNow()?state.data.war:null,score=w?warScore():null,t=state.data.updated.enemies||0;
    if(!effectiveKey())out.push({id:'api-key',title:'Connect Torn API',detail:'Add a key in Settings to load live and historical intelligence.',status:'now',priority:95,tab:'settings'});
    if(!positive(cfg.ourId))out.push({id:'faction-id',title:'Detect your faction',detail:'WarStaxx checks your API key identity automatically. Open Settings if you need to retry or use a manual ID.',status:'now',priority:92,tab:'settings'});
    if(w&&t&&Date.now()-t<5*MIN){
      const hittable=state.data.enemies.filter(p=>evaluate(p).ready);
      if(hittable.length)out.push({id:'ready-targets',title:fmt(hittable.length)+' opponents currently Okay',detail:'Review live status and confirmed matchups before choosing your hit.',status:'now',priority:85,tab:'targets'});
      if(score&&score.net<0)out.push({id:'war-score',title:'Ranked war score is behind',detail:'Current net score '+fmt(score.net)+'; review team assignments and coverage.',status:'review',priority:70,tab:'strategy'});
    }
    if(w&&(!t||Date.now()-t>5*MIN))out.push({id:'stale-roster',title:'Refresh opponent statuses',detail:'Last observed status is stale; refresh before hitting.',status:'soon',priority:75,tab:'overview'});
    // Only current, time-stamped Torn status may trigger a watched hospital alert.
    if(w&&rosterFresh('enemies')){
      if(activeWarNow()){
        const bands=enemyRoleBands(),wrong=state.data.ours.filter(p=>{
          const target=state.data.enemies.find(e=>e.id===positive(cfg.assignments[p.id]));
          return target&&!roleAllows(p,target,bands);
        });
        const unassigned=[...bands.heavy].filter(id=>
          !state.data.ours.some(p=>cfg.blackSkulls[p.id]&&
            positive(cfg.assignments[p.id])===id));
        if(unassigned.length)out.push({id:'skulls-uncovered-heavy',
          title:unassigned.length+' high-BSS opponents without Black Skull coverage',
          detail:'These enemies fall within your chosen Skull Capo strength cutoff. '+
            'Review uncovered opponents and identify a verified heavy hitter before assigning.',
          status:'review',priority:90,tab:'leader'});
        if(wrong.length)out.push({id:'role-target-conflict',
          title:wrong.length+' assigned hitter(s) in the wrong enemy BSS bracket',
          detail:'Black Skulls must receive top-BSS enemies; regular members take the lower bracket. '+
            'Unclassified enemies require scouting. Review saved manual orders.',
          status:'now',priority:93,tab:'leader'});
      }
      if(activeWarNow()&&rosterFresh('ours')&&cfg.priorityNotifications!==false){
        const heavy=enemyRoleBands().heavy,at=Date.now(),
          highReturns=Object.values(state.data.availabilityEvents||{})
            .filter(x=>x.warId===positive(w.id)&&
              (x.previous==='hospital'||x.previous==='away')&&heavy.has(x.id)&&
              at>=n(x.at)&&at-n(x.at)<=5*MIN&&
              state.data.enemies.some(p=>p.id===x.id&&memberState(p)==='okay'))
            .sort((a,b)=>b.at-a.at).slice(0,3);
        for(const x of highReturns)out.push({
          id:'skull-heavy-return-'+x.id,
          title:'Black Skulls heavy target '+x.name+' returned to Okay',
          detail:'Previously '+x.previous+'. Latest observed Torn roster shows Okay, '+
            'sampled '+age(x.at)+'. Review the high-BSS matchup and Skull Capo assignments; '+
            'availability or buffs may have changed.',
          status:'now',priority:97,tab:'leader'});
      }
      for(const x of priorityOpportunities().slice(0,3))out.push({
        id:'enemy-available-'+x.id,title:x.name+' now available',
        detail:'Changed from '+x.previous+' to Okay in the latest Torn roster. '+x.kind+
          ' priority: verify matchup and current status before attacking.',
        status:'now',priority:94,tab:'targets',targetId:x.id});
      const watched=watchedTargetIds();
      const exits=state.data.enemies.map(p=>enemyHospitalExit(p)).filter(x=>
        x&&watched.has(x.player.id)&&x.minutes<=20&&x.eta>Date.now());
      if(exits.length)out.push({id:'hospital-exit-watch',title:exits.length+
        ' watched hospital exit(s) approaching',detail:exits.slice(0,3).map(x=>
        x.player.name+' '+flightCountdown(x.eta)).join(', ')+
        '. Estimated roster expiry, not proof they are Okay; refresh before any action.',
        status:exits.some(x=>x.minutes<=10)?'now':'review',priority:87,tab:'operations'});
    }
    if(w&&cfg.enableAttacks&&Date.now()-n(state.data.updated.attacks)<5*MIN){
      const ledger=warHitLedger(w.id),leaders=ledger.enemyPlayers.filter(p=>
        p.scoringHits>=2&&Date.now()-n(p.lastAt)<10*MIN);
      if(leaders.length)out.push({id:'enemy-hitters-active',
        title:leaders.length+' enemy scorer(s) with recent recorded attacks',
        detail:leaders.slice(0,3).map(p=>p.name+' ('+p.scoringHits+' scoring attacks captured)').join(', ')+
          '. Partial attack feed; check hospital control and status.',
        status:'review',priority:83,tab:'threats'});
    }
    // Alert only for freshly captured repeat attacks. One grouped alert prevents
    // alert-spam when several members are under pressure.
    if(w&&activeWarNow()&&cfg.autoConceded!==false){
      const captured=concessionSnapshot(w.id),at=Date.now();
      if(captured?.lastFetch&&at-captured.lastFetch<=5*MIN){
        const pressured=state.data.ours.map(p=>({p,x:liveWarMemberImpact(p.id,w.id,at)}))
          .filter(z=>z.x.underFire).sort((a,b)=>b.x.in30-a.x.in30);
        if(pressured.length)out.push({
          id:'friendly-repeat-hits',
          title:pressured.length+' member'+(pressured.length===1?'':'s')+' under repeated attack',
          detail:pressured.slice(0,3).map(z=>z.p.name+' ('+z.x.in30+' incoming / 30m)').join(', ')+
            '. Based on captured ranked-war attacks; review exposure and turtling.',
          status:'review',priority:88,tab:pressured.some(z=>cfg.blackSkulls[z.p.id])?'skulls':'overview'
        });
      }
    }
    if(w&&activeWarNow()){
      const chain=chainStatus();
      if(chain.fresh&&chain.count>=10&&chain.remaining!==null&&chain.remaining<=80)
        out.push({id:'chain-critical',title:'Chain expires in '+chain.remaining+'s',
          detail:'Official chain #'+chain.count+' | '+(chain.nextIn??'unknown')+
            ' hits to next milestone. Coordinate manually; verify in Torn.',
          status:'now',priority:96,tab:'skulls'});
      if(chain.fresh&&chain.count>=10&&chain.nextIn!==null&&chain.nextIn<=2&&
         chain.remaining!==null&&chain.remaining>0)
        out.push({id:'chain-milestone',title:chain.nextIn+' hits until chain #'+chain.next,
          detail:'Torn chain milestone approaching. Coordinate a verified manual attack; the bonus is not guaranteed.',
          status:'review',priority:88,tab:'skulls'});
    }
    if(w&&rosterFresh('ours')){
      const defence=turtleAssessment();
      const exposedDuty=defence.rows.filter(x=>x.assigned==='turtle'&&x.danger);
      const uncovered=defence.plan.mode==='full'&&defence.exposed>0;
      if(exposedDuty.length||uncovered)
        out.push({id:'turtle-exposure',title:'Turtling exposure requires review',
          detail:(exposedDuty.length?exposedDuty.length+' manually marked turtle member(s) are currently targetable. ':
            '')+(uncovered?defence.exposed+' faction member(s) are still exposed in full-turtle posture. ':'')+
            'Local duties are not proof of hospital or travel protection.',
          status:'review',priority:89,tab:'turtle'});
      if(defence.plan.mode!=='balanced'&&defence.dueSoon>0)
        out.push({id:'turtle-expiry',title:defence.dueSoon+' defensive status expiry(s) approaching',
          detail:'Observed own hospital or flight timer within 15 minutes. Recheck Torn status and coordinate manually.',
          status:'review',priority:85,tab:'turtle'});
    }
    const newDebrief=Object.values(state.data.afterActions).find(x=>x.newFromObservedWar&&!x.reviewed);
    if(newDebrief)out.push({id:'after-action-'+newDebrief.id,title:'Ranked war after-action ready',detail:'War #'+newDebrief.id+' '+newDebrief.outcome+'; review the scoreline, known contributors and tactical lessons.',status:'review',priority:81,tab:'afteraction'});
    if(w){const pace=warPace();
      const acceleration=scoreAcceleration();
      if(acceleration?.accelerating)
        out.push({id:'enemy-accelerating',title:'Enemy scoring is accelerating',detail:'Scoring increased from '+fmt(acceleration.previousEnemy)+' to '+fmt(acceleration.recentEnemy)+' pts/hour across sampled windows. Recheck coverage and assignments.',status:'review',priority:91,tab:'pace'});
      if(pace&&pace.measurable&&pace.span>=20&&Date.now()-pace.last.at<10*MIN&&pace.netRate<-20)
        out.push({id:'score-pace-falling',title:'Enemy gaining score momentum',detail:'Observed net pace '+fmt(pace.netRate)+' points/hour; review your hitters and coverage.',status:'review',priority:79,tab:'pace'});
      const arrivals=inboundReturns().filter(x=>x.flight.eta&&x.flight.eta>Date.now()&&x.flight.eta-Date.now()<=20*MIN);
      if(arrivals.length&&Date.now()-n(state.data.updated.enemies)<5*MIN)
        out.push({id:'inbound-return',title:arrivals.length+' enemy flight return(s) approaching',detail:arrivals.slice(0,3).map(x=>x.player.name+' '+flightCountdown(x.flight.eta)).join(', ')+'. Return ETA from Torn roster; refresh status before targeting.',status:'review',priority:86,tab:'targets'});
      const plan=leadershipSummary();
      if(plan.duplicateTargets.length)out.push({id:'overlapping-orders',title:'Overlapping Black Skulls targets',detail:plan.duplicateTargets.length+' opponent targets assigned to multiple hitters; review local leadership orders.',status:'review',priority:67,tab:'command'});
    }
    return out.sort((a,b)=>n(b.priority)-n(a.priority)).slice(0,12);
  }
  function event(name,detail){document.dispatchEvent(new CustomEvent('staxx:'+name,{detail}));}
  function announce(){
    event('register',{id:ID,label:'War-TornStaxx',icon:'WS',desc:'Ranked wars \u00b7 Live targets \u00b7 Matchups',trendMetric:'Enemy Okay',freshnessMs:300000,sections:sections.map(id=>({id,label:labels[id]}))});
  }
  function publish(){
    const a=currentAlerts();state.alerts=a;
    const liveWar=activeWarNow();
    announce();
    const observed=Math.max(n(state.data.updated.wars),n(state.data.updated.enemies),n(state.data.updated.ours));
    const hittable=rosterFresh('enemies')?state.data.enemies.filter(e=>evaluate(e).ready).length:0;
    const enemyActivity=sideActivity('enemies'),enemyHistory=factionWarMetrics('enemies');
    const observedPace=warPace();
    if(observed)event('summary',{id:ID,headline:liveWar?'Ranked war detected':'War scouting / standby',
      updated:observed,metrics:[{label:'Enemy active 24h',value:rosterFresh('enemies')?enemyActivity.active24+' / '+enemyActivity.total:'--'},
        {label:liveWar?'Net pace per hour':'Last war points',value:liveWar?
          observedPace?.netRate===null||!observedPace?'--':fmt(observedPace.netRate):
          enemyHistory.lastScore===null?'--':fmt(enemyHistory.lastScore)},
        {label:'Enemy Okay',value:rosterFresh('enemies')?String(hittable):'--'}]});
    event('actions',{id:ID,updated:observed||0,items:a.map(x=>({id:x.id,title:x.title,detail:x.detail,status:x.status,priority:x.priority,reviewMinutes:2}))});
    event('notice',{id:ID,count:a.filter(x=>x.status==='now'||x.status==='urgent').length,
      level:a.some(x=>x.status==='urgent')?'urgent':'warning',summary:a.length?a[0].title:'No verified war alerts',
      alerts:a.filter(x=>x.status==='now'||x.status==='urgent').map(x=>({id:x.id,title:x.title,detail:x.detail}))});
    const completed=Object.values(state.data.reports).filter(r=>n(r.war?.end)>0)
      .sort((a,b)=>n(b.war.end)-n(a.war.end)).slice(0,10);
    if(completed.length)event('activity',{id:ID,events:completed.map(r=>({id:'war-'+r.id,
      at:n(r.war.end)*1000,title:'Ranked war finished',detail:'Official report '+r.id+' available',section:'history',source:'api'}))});
    event('war-context',{id:ID,active:liveWar,ourFactionId:positive(cfg.ourId),
      opponentFactionId:positive(cfg.enemyId),observedAt:observed||0,hittable:hittable});
  }
  // Torn API v2 key/info reports user.faction_id for the key owner even when
  // a custom key has no faction management permissions.
  // Never treat the player's own user ID as a faction ID.
  function ownFactionFrom(j,source){
    if(!j||typeof j!=='object')return null;
    const d=j.info&&typeof j.info==='object'?j.info:j;
    const candidate=(v,label)=>{
      const id=positive(v);
      return id?{id,source:label}:null;
    };
    if(source==='key-info'){
      const user=d.user||d.key?.user||d.key?.owner||null;
      // A valid key may have faction_id: 0. Never treat zero as detected.
      return candidate(user?.faction_id??user?.faction?.id??user?.faction?.faction_id,
        'Torn key/info');
    }
    const label=source==='user-faction'?'Torn user/faction':'Torn user/profile';
    const faction=d.faction||d.profile?.faction||d.user?.faction||
      d.data?.faction||d.profile?.data?.faction||null;
    if(faction&&typeof faction==='object'){
      const found=candidate(faction.faction_id??faction.id??faction.ID,label);
      if(found)return found;
    }
    // Some selections expose faction ID directly or inside a member profile.
    return candidate(d.faction_id??d.factionID??d.user?.faction_id??d.profile?.faction_id,label);
  }
  async function identify(force=false){
    if(cfg.factionAuto===false)return positive(cfg.ourId);
    if(!force&&positive(cfg.ourId)&&positive(cfg.factionVerifiedAt)&&
       Date.now()-n(cfg.factionVerifiedAt)<6*HOUR)return positive(cfg.ourId);
    const sources=[
      ['/key/info','identity-key','key-info'],
      ['/user/faction','identity-faction','user-faction'],
      ['/user/profile','identity-profile','user-profile']
    ];
    let lastError='';
    for(const [path,kind,source] of sources){
      let result=null;
      try{
        const response=await call(path,kind,force?0:6*HOUR);
        if(response){
          // Key ownership explicitly showing no faction is authoritative, unlike
          // a missing or permission-restricted faction field.
          const owner=response?.info?.user||response?.user||response?.key?.user;
          if(source==='key-info'&&owner){const ownId=positive(owner.id||owner.user_id||owner.player_id);
            if(ownId){if(positive(state.data.meta?.ownerId)&&positive(state.data.meta.ownerId)!==ownId)state.data.autoSpies={};state.data.meta.ownerId=ownId;}}
          if(source==='key-info'&&owner&&Object.prototype.hasOwnProperty.call(owner,'faction_id')&&
             (owner.faction_id===null||Number(owner.faction_id)===0)){
            cfg.ourId=0;cfg.enemyId=0;cfg.factionVerifiedAt=Date.now();
            cfg.factionSource='Torn key/info (no faction)';
            state.data.ours=[];state.data.enemies=[];state.data.ourWars=[];state.data.enemyWars=[];
            state.data.war=null;saveCfg();
            state.data.errors.identity='Your Torn account is not currently in a faction.';
            return 0;
          }
          result=ownFactionFrom(response,source);
        }
      }catch(e){lastError=String(e?.message||e).slice(0,140);}
      if(!result?.id)continue;
      const previous=positive(cfg.ourId);
      cfg.ourId=result.id;
      cfg.factionSource=result.source;
      cfg.factionVerifiedAt=Date.now();
      delete state.data.errors.identity;
      if(previous&&previous!==result.id){
        // Clear faction-specific observations when membership changes.
        cfg.enemyId=0;
        state.data.ours=[];
        state.data.enemies=[];
        state.data.ourWars=[];
        state.data.enemyWars=[];
        state.data.war=null;
        state.data.updated.wars=0;
        state.data.updated.ours=0;
        state.data.updated.enemies=0;
      }
      saveCfg();
      return result.id;
    }
    if(!positive(cfg.ourId))state.data.errors.identity=
      'Faction auto-detection unavailable: '+(lastError||'check your Torn PDA API key and its profile permission.');
    return positive(cfg.ourId);
  }
  function historyCoverage(){
    const wars=[...(state.data.ourWars||[]),...(state.data.enemyWars||[])]
      .filter(w=>positive(w?.id)&&positive(w?.end));
    const ids=[...new Set(wars.map(w=>positive(w.id)))];
    const complete=ids.filter(id=>{
      const r=state.data.reports[String(id)];
      return Array.isArray(r?.factions)&&r.factions.length>=2&&positive(r.war?.end);
    }).length;
    const waiting=ids.filter(id=>n(state.data.backoff['report-'+id]?.until)>Date.now()).length;
    return {total:ids.length,complete,missing:ids.length-complete,waiting};
  }
  async function refreshHistory(force=false){
    if(!positive(cfg.ourId))return;
    const limit=Math.max(2,Math.min(20,positive(cfg.historyLimit)||12));
    const sides=[['ourWars',cfg.ourId],['enemyWars',cfg.enemyId]];
    for(const [name,fid] of sides){
      if(!positive(fid))continue;
      try{const j=await call('/faction/'+fid+'/rankedwars?limit='+limit,name,force?0:30*MIN);
        if(j)state.data[name]=warHistory(j);}catch(e){state.error=String(e.message||e);}
    }
    const ids=[...new Set([...state.data.enemyWars.slice(0,limit),...state.data.ourWars.slice(0,limit)]
      .filter(w=>positive(w?.end)).map(w=>positive(w.id)).filter(Boolean))]
      .filter(id=>!state.data.reports[id]||
        !Array.isArray(state.data.reports[id]?.factions)||
        state.data.reports[id].factions.length<2||
        !positive(state.data.reports[id]?.war?.end));
    // Cap at three actual read-only requests. A failed report must never block the rest.
    let attempted=0;
    for(const id of ids){
      const kind='report-'+id;
      if(!canCall(kind,15*MIN))continue;
      if(attempted>=3)break;
      attempted++;
      try{
        const j=await call('/faction/'+id+'/rankedwarreport',kind);
        if(j){
          const parsed=report(j,id);
          if(parsed.factions.length>=2&&positive(parsed.war?.end))
            state.data.reports[id]=parsed;
          else{
            state.data.errors[kind]='Official war report is incomplete; retry later.';
            state.data.backoff[kind]={count:1,until:Date.now()+30*MIN};
          }
        }
      }catch(e){state.data.errors[kind]=String(e.message||e).slice(0,180);}
    }
    const keep=Object.keys(state.data.reports).map(Number).sort((a,b)=>b-a);
    for(const id of keep.slice(40))delete state.data.reports[id];
    buildAfterActions();
    state.historicalRead=Date.now();
  }
  async function ffRequest(url){
    // Current Torn PDA uses its native one-argument HTTP bridge; GM requests can
    // silently time out inside its WebView. Avoid browser fetch/CORS entirely.
    const toJson=response=>{
      if(response===undefined||response===null)throw new Error('FFScouter transport returned an empty response');
      const status=Number(response?.status||0),raw=response?.responseText??response;
      let json;
      try{json=typeof raw==='string'?JSON.parse(raw):raw;}
      catch(_){throw new Error('FFScouter returned invalid JSON');}
      if(status>=400)throw new Error('FFScouter HTTP '+status+(json?.error?' - '+String(json.error).slice(0,90):''));
      if(json?.code!==undefined||json?.error)throw new Error('FFScouter '+String(json.error||json.code).slice(0,100));
      return json;
    };
    if(typeof PDA_httpGet==='function'){
      return await Promise.race([
        Promise.resolve().then(()=>PDA_httpGet(url)).then(toJson),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('FFScouter Torn PDA bridge timed out')),18000))
      ]);
    }
    if(typeof GM_xmlhttpRequest==='function'){
      return await new Promise((resolve,reject)=>GM_xmlhttpRequest({method:'GET',url,timeout:18000,
        onload:r=>{try{resolve(toJson(r));}catch(e){reject(e);}},
        onerror:()=>reject(new Error('FFScouter cross-origin connection failed')),
        ontimeout:()=>reject(new Error('FFScouter request timed out'))}));
    }
    throw new Error('No FFScouter cross-origin transport available (PDA/GM)');
  }
  async function checkFFRegistration(force=false){
    const old=state.data.meta.ffRegistration||{};
    if(!force&&old.at&&Date.now()-n(old.at)<6*HOUR){
      if(old.registered===false)throw new Error('FFScouter key is not registered. Use Check registered key after signing up.');
      return old;
    }
    const data=await ffRequest('https://ffscouter.com/api/v1/check-key?key='+encodeURIComponent(ffApiKey()));
    const registered=data?.is_registered===true||data?.registered===true;
    const result={registered,premium:Boolean(data?.is_premium),at:Date.now()};
    state.data.meta.ffRegistration=result;
    if(!registered)throw new Error('Your Torn key is not registered with FFScouter. Register it on ffscouter.com or use another registered key.');
    return result;
  }
  async function refreshFF(force=false){
    if(!cfg.ffEnabled||!cfg.ffConsent||!ffApiKey()||!state.data.enemies.length)return;
    if(!canCall('ffscouter',force?0:10*MIN))return;
    const ids=[...new Set([...state.data.enemies,...state.data.ours].map(p=>p.id).concat(positive(state.data.meta?.ownerId)).filter(Boolean))].slice(0,205);
    if(!ids.length)return;
    const url='https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(ffApiKey())+
      '&targets='+ids.join(',');
    try{
      await checkFFRegistration();
      const results=await ffRequest(url);
      const now=Date.now();
      const parsed=parseFFRows(results,ids,now);
      for(const [id,data] of Object.entries(parsed))state.data.ffstats[id]=data;
      state.data.updated.ffscouter=now;
      state.data.meta.ffCount=Object.values(parsed).filter(p=>p.ff!==null).length;
      delete state.data.errors.ffscouter;
      delete state.data.backoff.ffscouter;
      for(const id of Object.keys(state.data.ffstats))
        if(now-n(state.data.ffstats[id].at)>7*24*HOUR)delete state.data.ffstats[id];
    }catch(e){
      const b=state.data.backoff.ffscouter||{count:0};
      const count=Math.min(6,n(b.count)+1);
      state.data.backoff.ffscouter={count,until:Date.now()+Math.min(HOUR,2**count*MIN)};
      state.data.errors.ffscouter=String(e.message||e).slice(0,150);
    }
    save();
  }
  async function refreshAttacks(){
    if(!cfg.enableAttacks||!activeWarNow()||!positive(cfg.ourId))return;
    try{
      const j=await call('/faction/attacks?limit=100','attacks',3*MIN);
      if(!j)return;
      const seen=new Map((state.data.attacks||[]).map(a=>[a.id,a]));
      for(const a of attacks(j))seen.set(a.id,a);
      state.data.attacks=[...seen.values()].sort((a,b)=>a.at-b.at).slice(-1000);
    }catch(e){state.data.errors.attacks=String(e.message||e);}
  }
  async function refresh(force=false){
    if(state.loading||document.hidden)return;
    if(!effectiveKey()){publish();render();return;}
    state.loading=true;state.error='';state.notice=null;state.spinner='Fetching official Torn data';
    render();
    try{
      await identify(force);
      if(!positive(cfg.ourId))throw new Error('Unable to detect your faction from Torn API. Check your API key or use the optional manual faction ID in Settings.');
      const previousWarId=positive(state.data.war?.id);
      const wars=await call('/faction/'+cfg.ourId+'/wars','wars',force?0:90*1000);
      if(wars){
        const w=detectWar(wars);state.data.war=w;
        if(previousWarId&&(!w||positive(w.id)!==previousWarId))state.data.meta.pendingAfterAction=previousWarId;
        if(w)recordWarScore(w);
        if(w&&w.opponentId)setOpponent(w.opponentId);
      }
      const own=await call('/faction/'+cfg.ourId+'/members','ours',force?0:90*1000);
      if(own)state.data.ours=roster(own);
      if(state.data.war?.id&&state.data.ours.length)snapshotWarSquads(state.data.war.id);
      if(positive(cfg.enemyId)){
        const old=state.data.enemies.slice(),oldAt=n(state.data.updated.enemies);
        const enemy=await call('/faction/'+cfg.enemyId+'/members','enemies',force?0:90*1000);
        if(enemy){
          const fresh=roster(enemy);
          if(oldAt&&Date.now()-oldAt<5*MIN&&activeWarNow())observeNativeWarTransitions(old,fresh,positive(state.data.war?.id));
          state.data.enemies=fresh;
          if(previousWarId&&state.data.war&&previousWarId===positive(state.data.war.id)&&
            oldAt&&Date.now()-oldAt<5*MIN)recordAvailability(old,fresh,previousWarId);
        }
        if(own||enemy)snapshot([...(own?['ours']:[]),...(enemy?['enemies']:[])]);
      }
      await refreshFactionBasics(force);
      const pendingReport=positive(state.data.meta?.pendingAfterAction)>0;
      const urgentReport=pendingReport&&Date.now()-n(state.data.meta.lastDebriefAttempt)>5*MIN;
      if(urgentReport)state.data.meta.lastDebriefAttempt=Date.now();
      await refreshHistory(force||urgentReport);
      await refreshAttacks();
      await refreshWarConcessions(force);
      try{
        const chain=await call('/faction/'+cfg.ourId+'/chain','chain',30*1000);
        if(chain){const snapshot=chainSnapshot(chain);if(snapshot)state.data.chain=snapshot;}
      }catch(e){state.data.errors.chain=String(e.message||e).slice(0,150);}
      captureAttackBssObservations();
      await refreshOwnReadiness();
      await refreshBattleIntel();
      await refreshPublicIntel(activeWarNow()?3:2);
      await refreshFF();
      if(sharedEndpoint()&&sharedScope())sharedPull(false);
      state.lastRefresh=Date.now();
    }catch(e){state.error=String(e.message||e);}
    finally{state.loading=false;state.spinner='';save();publish();render();syncNativeWar();}
  }
  function el(tag,cls,text){const a=document.createElement(tag);if(cls)a.className=cls;if(text!==undefined)a.textContent=String(text);return a;}
  const root=el('div');root.id='warstaxx-root';
  // A real DOM click crosses Torn PDA isolated userscript contexts reliably.
  // This control only opens a visual panel and never performs gameplay actions.
  const domBridge=el('button');
  domBridge.id='warstaxx-dom-open';
  domBridge.type='button';
  domBridge.hidden=true;
  domBridge.setAttribute('aria-hidden','true');
  domBridge.style.display='none';
  domBridge.addEventListener('click',()=>open({
    section:domBridge.dataset.section||'overview',
    alertId:domBridge.dataset.alertId||null
  }));
  root.innerHTML='<div class="ws-veil" data-close></div><section class="ws-panel" role="dialog" aria-label="WarStaxx command centre" aria-modal="true">'+
    '<header class="ws-head"><div><strong>War<span>Staxx</span></strong><small>RANKED WAR INTELLIGENCE \u00b7 v'+VER+'</small></div>'+
    '<div class="ws-head-buttons"><button type="button" data-action="refresh" aria-label="Refresh war intelligence" title="Refresh official war intelligence">\u21bb <span class="ws-refresh-label">Refresh</span></button><button type="button" data-action="find" aria-label="Find a player or WarStaxx section" title="Find a player or section">\u2315</button><button type="button" data-close aria-label="Close WarStaxx">\u00d7</button></div></header>'+
    '<nav class="ws-tabs" aria-label="WarStaxx sections"></nav>'+ 
    '<div id="ws-finder" class="ws-finder" hidden><div class="ws-finder-row"><input id="ws-find-input" type="search" autocomplete="off" placeholder="Search players, IDs or tools" aria-label="Find players or tools"><button type="button" data-action="finder-close" aria-label="Close search">Close</button></div><div id="ws-finder-results" class="ws-finder-results" aria-live="polite"></div></div>'+ 
    '<main class="ws-content"></main>'+
    '<footer class="ws-footer"><span class="ws-sync"></span><span>Observations, not automated attacks</span></footer></section>';
  root.appendChild(domBridge);
  const css=el('style');css.textContent=[
    '#warstaxx-root{position:fixed;inset:0;z-index:2147483646;display:none;font:13px/1.45 system-ui,Arial,sans-serif;color:#eaf4ff}',
    '#warstaxx-root *{box-sizing:border-box}#warstaxx-root button,#warstaxx-root input,#warstaxx-root select,#warstaxx-root textarea{font:inherit}',
    '#warstaxx-root button{cursor:pointer;min-height:35px;color:#d9f5ff}#warstaxx-root button:focus-visible{outline:2px solid #54d7fa;outline-offset:2px}',
    '#warstaxx-root .ws-veil{position:absolute;inset:0;background:#030b18c8}',
    '#warstaxx-root .ws-panel{position:absolute;top:3vh;bottom:3vh;left:50%;transform:translateX(-50%);width:min(1060px,calc(100vw - 16px));display:flex;flex-direction:column;background:#08192d;border:1px solid #396b8e;box-shadow:0 16px 70px #000d;border-radius:14px;overflow:hidden}',
    '#warstaxx-root .ws-head{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;background:linear-gradient(100deg,#0b365a,#071b32);border-bottom:1px solid #315c7c}',
    '#warstaxx-root .ws-head strong{font-size:21px;font-weight:850}#warstaxx-root .ws-head strong span{color:#54d7fa}',
    '#warstaxx-root .ws-head small{display:block;color:#95bad5;font-size:9px;letter-spacing:1px}',
    '#warstaxx-root .ws-head-buttons{display:flex;align-items:center;gap:5px}#warstaxx-root .ws-head button{border:1px solid #3b6686;background:#173b5a;border-radius:8px;padding:4px 9px}',
    '#warstaxx-root .ws-tabs{display:flex;gap:4px;overflow-x:auto;white-space:nowrap;flex-shrink:0;background:#0a233c;padding:7px 9px;border-bottom:1px solid #244d6e}',
    '#warstaxx-root .ws-tabs button{background:#13334f;border:1px solid #244e6f;border-radius:7px;padding:7px 10px;font-size:12px}',
    '#warstaxx-root .ws-tabs button.on{background:#066caa;border-color:#54d7fa;color:white}',
    '#warstaxx-root .ws-finder[hidden]{display:none}#warstaxx-root .ws-finder{background:#0b2944;border-bottom:1px solid #326184;padding:8px 12px;flex-shrink:0}',
    '#warstaxx-root .ws-finder-row{display:flex;gap:8px;align-items:center}#warstaxx-root .ws-finder-row input{flex:1;max-width:none;min-width:0}',
    '#warstaxx-root .ws-finder-row button{border:1px solid #497a9b;background:#153b5c;border-radius:8px;padding:8px 12px}',
    '#warstaxx-root .ws-finder-results{max-height:36vh;overflow-y:auto;overscroll-behavior:contain;margin-top:7px}',
    '#warstaxx-root .ws-finder-result{display:flex;align-items:center;justify-content:space-between;width:100%;gap:10px;padding:10px;border:1px solid #294e69;background:#123551;border-radius:7px;margin:4px 0;text-align:left}',
    '#warstaxx-root .ws-finder-result small{font-size:11px;white-space:normal}',
    '#warstaxx-root .ws-finder-result strong{font-size:12px;color:#e1f5ff}',
    '#warstaxx-root .ws-content{flex:1;overflow:auto;overscroll-behavior:contain;padding:12px;min-height:0}',
    '#warstaxx-root .ws-footer{display:flex;justify-content:space-between;gap:6px;padding:7px 12px;border-top:1px solid #254765;background:#071a2d;color:#92b4cf;font-size:10px}',
    '#warstaxx-root .ws-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:9px}',
    '#warstaxx-root .ws-card{background:#0d2945;border:1px solid #294f70;border-radius:11px;padding:12px;margin-bottom:10px;min-width:0}',
    '#warstaxx-root h2{font-size:15px;margin:0 0 8px;color:#a8e9fd}#warstaxx-root h3{font-size:13px;margin:0 0 8px;color:#85d9f7}',
    '#warstaxx-root p{margin:6px 0;color:#c4dcf0}#warstaxx-root small,#warstaxx-root .ws-muted{color:#90aec6}',
    '#warstaxx-root .ws-number{font-size:27px;font-weight:850;line-height:1.2;color:#e4f8ff}',
    '#warstaxx-root .ws-badge{display:inline-block;border:1px solid #467c9d;border-radius:10px;padding:2px 6px;font-size:10px;background:#133b59;color:#bdefff}',
    '#warstaxx-root .ws-badge.good{color:#68efb9;border-color:#378c74}#warstaxx-root .ws-badge.bad{color:#ff96aa;border-color:#9c5469}',
    '#warstaxx-root .ws-row{display:flex;align-items:center;gap:8px;justify-content:space-between;flex-wrap:wrap;margin:5px 0}',
    '#warstaxx-root .ws-toolbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-bottom:10px}',
    '#warstaxx-root input,#warstaxx-root select,#warstaxx-root textarea{background:#07192c;color:#e7f7ff;border:1px solid #47718f;border-radius:7px;padding:9px;min-width:0}',
    '#warstaxx-root input[type=search]{flex:1;max-width:350px}#warstaxx-root input[type=number]{width:150px;max-width:100%}',
    '#warstaxx-root textarea{width:100%;min-height:70px}#warstaxx-root label{display:flex;flex-direction:column;gap:5px;margin-bottom:10px;color:#aacfe7;font-weight:600}',
    '#warstaxx-root .ws-btn{display:inline-flex;justify-content:center;align-items:center;gap:5px;border:1px solid #3f81a9;background:#13527d;padding:7px 11px;border-radius:8px;text-decoration:none;color:#e8f8ff;font-weight:650}',
    '#warstaxx-root .ws-btn.secondary{background:#16364f;border-color:#42647e}#warstaxx-root .ws-btn:disabled{opacity:.4}',
    '#warstaxx-root .ws-table-wrap{overflow-x:auto}#warstaxx-root table{border-collapse:collapse;width:100%;min-width:590px}',
    '#warstaxx-root th,#warstaxx-root td{text-align:left;border-bottom:1px solid #294a65;padding:8px 7px;vertical-align:middle}',
    '#warstaxx-root th{color:#8fbdd9;font-size:11px}#warstaxx-root td{color:#e2eff9;font-size:12px}',
    '#warstaxx-root tr:hover td{background:#12334e}#warstaxx-root a{color:#89dfff;text-decoration:none}',
    '#warstaxx-root .ws-empty{border:1px dashed #3a6280;border-radius:9px;padding:16px;color:#adc9da}',
    '#warstaxx-root .ws-note{border-left:3px solid #54d7fa;background:#0c2f4f;padding:10px;border-radius:6px;margin:9px 0}',
    '#warstaxx-root .ws-warn{border-left-color:#ff8094}#warstaxx-root .ws-success{border-left-color:#51cabc;background:#0b353b;color:#d7fff8}#warstaxx-root .ws-small{font-size:11px;color:#a8c4d7}',
    '#warstaxx-root .ws-pct{height:8px;background:#132a44;border-radius:8px;overflow:hidden;margin:9px 0}#warstaxx-root .ws-pct i{display:block;height:100%;background:#2eafd6}',
    '#warstaxx-root .ws-stat-action{display:flex;flex-direction:column;align-items:flex-start;text-align:left;color:#e5f5ff;gap:4px;min-height:106px;width:100%;cursor:pointer}',
    '#warstaxx-root .ws-health-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;border-bottom:1px solid #30536e;gap:8px;padding:7px 0}',
    '#warstaxx-root .ws-health-row small{font-size:11px;display:block}',
    '#warstaxx-root .ws-health-row strong{color:#d9f4ff;font-size:12px}',
    '#warstaxx-root .ws-stat-action:active{background:#15436b}#warstaxx-root .ws-stat-title{color:#acd7ec;font-weight:700;font-size:12px}#warstaxx-root .ws-stat-link{color:#63d9f6;font-size:11px;margin-top:auto}',
    '#warstaxx-root .ws-lead{padding:14px;background:linear-gradient(110deg,#103e63,#0b2948);border:1px solid #397a9e;border-radius:12px;margin-bottom:10px}',
    '#warstaxx-root .ws-lead h2{font-size:18px;margin:0 0 8px}#warstaxx-root .ws-score{font-size:22px;font-weight:800}',
    '#warstaxx-root .ws-table-wrap button.ws-inline{border:0;background:none;color:#8ae3ff;padding:2px;min-height:28px;text-align:left;font-weight:700;text-decoration:underline}',
    '#warstaxx-root .ws-hour-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:3px;margin:8px 0}#warstaxx-root .ws-hour{border:1px solid #426781;border-radius:5px;text-align:center;padding:5px 1px;background:#103652}',
    '#warstaxx-root .ws-hour.positive{background:#125d61;border-color:#4d9c99}#warstaxx-root .ws-hour.negative{background:#633144;border-color:#a26b7c}#warstaxx-root .ws-hour.unknown{opacity:.5;background:#1e3249}',
    '#warstaxx-root .ws-hour b{display:block;font-size:11px}#warstaxx-root .ws-hour small{font-size:9px}',
    '#warstaxx-root .ws-data-label{color:#77dfef;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px}#warstaxx-root .ws-inline-metrics{display:flex;flex-wrap:wrap;gap:6px}',
    '#warstaxx-root .ws-inline-metrics span{border:1px solid #315f7e;border-radius:7px;background:#0d3452;padding:5px 9px;color:#bde5f6}',
    '#warstaxx-root .ws-compact-table{min-width:340px}#warstaxx-root .ws-focus-row{cursor:pointer}#warstaxx-root .ws-btn{min-height:36px}',
    '#warstaxx-root .ws-ff-button{border:0;background:transparent;padding:1px;min-height:24px;display:inline-flex;align-items:center;vertical-align:middle}',
    '#warstaxx-root .ws-ff{display:inline-block;white-space:nowrap;font-size:11px;font-weight:850;border-radius:7px;line-height:19px;padding:1px 6px;background:#193d58;color:#cdf0ff;border:1px solid #4c7195;letter-spacing:.1px}',
    '#warstaxx-root .ws-ff-high{color:#a3ffe2;border-color:#2f9374;background:#12443b}',
    '#warstaxx-root .ws-ff-risk{color:#ffdcaa;border-color:#b88738;background:#55411b}',
    '#warstaxx-root .ws-ff-danger{color:#ffc0ca;border-color:#be6475;background:#4e2132}',
    '#warstaxx-root .ws-ff-mid{color:#bdefff;border-color:#387b9f;background:#17415e}',
    '#warstaxx-root .ws-ff-low{color:#ffb6bf;border-color:#a04e5c;background:#4d2934}',
    '#warstaxx-root .ws-ff-actual{color:#d5ecff;border-color:#778ed0;background:#253e68}',
    '#warstaxx-root .ws-ff-stale{color:#ecb99a;border-color:#8e715c;background:#47342f}',
    '#warstaxx-root .ws-ff-none{color:#a5b8c8;border-color:#4d5c70;background:#25344a}',
    '#warstaxx-root .ws-card .ws-ff-button{flex-shrink:0}',
    '#warstaxx-root .ws-score-chart{display:block;width:100%;height:auto;min-height:110px;max-height:260px;background:#0a2238;border:1px solid #274960;border-radius:8px;padding:7px;margin:8px 0}',
    '#warstaxx-root .ws-legend-own{color:#61d9ff;font-weight:750}#warstaxx-root .ws-legend-enemy{color:#ff809e;font-weight:750}',
    '#warstaxx-root .ws-leader-table select{min-width:170px;max-width:260px;width:100%;padding:7px}#warstaxx-root .ws-leader-table .ws-btn{margin:3px 0}',
    '@media(max-width:680px){#warstaxx-root .ws-leader-table,#warstaxx-root .ws-leader-table tbody,#warstaxx-root .ws-leader-table tr,#warstaxx-root .ws-leader-table td{display:block;width:100%;min-width:0}#warstaxx-root .ws-leader-table thead{display:none}#warstaxx-root .ws-leader-table tr{border:1px solid #3d627e;border-radius:9px;padding:8px;margin-bottom:10px;background:#0b2742}#warstaxx-root .ws-leader-table td{border:0;padding:6px 4px}#warstaxx-root .ws-leader-table td::before{content:attr(data-label);display:block;font-size:10px;color:#82bedc;text-transform:uppercase;font-weight:750;letter-spacing:.5px;margin-bottom:3px}#warstaxx-root .ws-leader-table select{max-width:none;width:100%}}',
    '#warstaxx-root .ws-commander-member{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 8px;border-bottom:1px solid #305672;flex-wrap:wrap}',
    '#warstaxx-root .ws-commander-member>div:first-child{min-width:170px;flex:1}',
    '#warstaxx-root .ws-commander-member small{display:block;margin-top:4px}',
    '#warstaxx-root .ws-commander-member .ws-toolbar{margin:0}',
    '@media(max-width:600px){#warstaxx-root .ws-commander-member{display:block}#warstaxx-root .ws-commander-member .ws-toolbar{margin:9px 0 0}#warstaxx-root .ws-commander-member .ws-toolbar .ws-btn{flex:1}#warstaxx-root .ws-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#warstaxx-root .ws-stat-action{min-width:0}}',
    '@media(max-width:640px){#warstaxx-root .ws-panel{height:100dvh;bottom:auto}#warstaxx-root .ws-hour-grid{grid-template-columns:repeat(8,minmax(0,1fr))}#warstaxx-root .ws-stat-action{min-height:112px}#warstaxx-root .ws-lead{padding:10px}#warstaxx-root .ws-score{font-size:19px}}',
    '@media(max-width:640px){#warstaxx-root .ws-panel{top:0;bottom:0;width:100%;border-radius:0}#warstaxx-root .ws-head{padding:8px}#warstaxx-root .ws-head strong{font-size:18px}#warstaxx-root .ws-head small{font-size:8px}#warstaxx-root .ws-content{padding:8px}#warstaxx-root .ws-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#warstaxx-root .ws-card{padding:9px}#warstaxx-root .ws-number{font-size:21px}}',
    '@media(pointer:coarse){#warstaxx-root button,#warstaxx-root a.ws-btn{min-height:44px}#warstaxx-root .ws-ff-button{min-height:40px}}',
    '@media(max-width:600px){#warstaxx-root .ws-table-wrap{max-width:100%;border:1px solid #294f70;border-radius:8px;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}#warstaxx-root .ws-table-wrap table:not(.ws-leader-table) th:first-child,#warstaxx-root .ws-table-wrap table:not(.ws-leader-table) td:first-child{position:sticky;left:0;z-index:1;background:#102d49;box-shadow:1px 0 0 #335c7b}#warstaxx-root .ws-table-wrap table:not(.ws-leader-table) td:first-child{max-width:180px;overflow-wrap:anywhere}}',
    '@media(max-width:420px){#warstaxx-root .ws-head-buttons{flex-shrink:0}#warstaxx-root .ws-head-buttons button{padding:6px 9px;min-width:42px}#warstaxx-root .ws-refresh-label{display:none}#warstaxx-root .ws-head strong{font-size:17px}#warstaxx-root .ws-head small{letter-spacing:0;font-size:8px}#warstaxx-root .ws-row{align-items:flex-start}}'
  ].join('');
  function card(title,body){return '<section class="ws-card"><h2>'+esc(title)+'</h2>'+body+'</section>';}
  function stat(name,value,detail){return card(name,'<div class="ws-number">'+esc(value)+'</div><small>'+esc(detail||'')+'</small>');}
  function pill(label,cls=''){return '<span class="ws-badge '+cls+'">'+esc(label)+'</span>';}
  function empty(s){return '<p class="ws-empty">'+esc(s)+'</p>';}
  function b(text,action,extra=''){return '<button class="ws-btn" type="button" data-action="'+esc(action)+'" '+extra+'>'+esc(text)+'</button>';}
  function a(text,url){return '<a href="'+esc(url)+'" target="_self" class="ws-btn secondary">'+esc(text)+'</a>';}
  function infoButton(text,id){return b(text,'player:'+id);}
  function scoreLabel(value){return value===null||value===undefined?'\u2014':fmt(value);}
  function lastWarLine(side,id){
    const rec=recentWarRecords(side,id).find(x=>x.covered);
    return rec?'War #'+rec.war.id+' | '+fmt(rec.score)+' score | '+fmt(rec.attacks)+' attacks':
      'No official member report loaded';
  }
  function reportSide(r,id){return r?.factions?.find(x=>x.id===positive(id))||null;}
  function factionLink(id){return 'https://www.torn.com/factions.php?step=profile&ID='+positive(id);}
  function perMemberRows(side,limit=50){
    return (state.data[side]||[]).map(p=>({p,last:lastKnownMemberScore(side,p.id),
      lifetime:pastPerformance(p.id,side),activity:pattern(side,p.id)}))
      .sort((a,b)=>(b.last??-1)-(a.last??-1)||b.lifetime.score-a.lifetime.score)
      .slice(0,limit);
  }
  function statAction(title,value,detail,action){
    return '<button type="button" class="ws-card ws-stat-action" data-action="'+esc(action)+'">'+
      '<span class="ws-stat-title">'+esc(title)+'</span><span class="ws-number">'+esc(value)+'</span>'+
      '<small>'+esc(detail)+'</small><span class="ws-stat-link">Explore \u2192</span></button>';
  }
  function publicMetricItems(value,depth=0,prefix=''){
    if(depth>3||!value||typeof value!=='object')return [];
    const out=[];
    for(const [key,v] of Object.entries(value)){
      if(['_metadata','id','name','player_id','faction_id'].includes(key))continue;
      if(typeof v==='number'&&Number.isFinite(v))out.push({name:(prefix?prefix+' / ':'')+key,value:v});
      else if(v&&typeof v==='object'&&!Array.isArray(v))out.push(...publicMetricItems(v,depth+1,prefix?prefix+' / '+key:key));
      if(out.length>=100)break;
    }
    return out.slice(0,100);
  }
  function publicIntelCoverage(at=Date.now()){
    const players=Array.isArray(state.data.enemies)?state.data.enemies:[],
      result={total:players.length,profile:0,stats:0,complete:0,restricted:0,fresh:0};
    for(const player of players){
      const item=state.data.publicIntel[positive(player.id)];
      if(!item)continue;
      const profile=item.profile||{},metrics=publicMetricItems(item.stats||{});
      const hasProfile=Boolean(profile.rank||profile.age!==null&&profile.age!==undefined||
        profile.awards!==null&&profile.awards!==undefined);
      const hasStats=metrics.length>0;
      result.profile+=Number(hasProfile);
      result.stats+=Number(hasStats);
      result.complete+=Number(hasProfile&&hasStats);
      result.restricted+=Number(Boolean(item.restricted));
      result.fresh+=Number(item.at>0&&at>=item.at&&at-item.at<6*HOUR);
    }
    return result;
  }
  function publicCombatHighlights(stats){
    const names={attackswon:'Attacks won',attackslost:'Attacks lost',
      defendswon:'Defends won',defendslost:'Defends lost',
      rankedwarwins:'Ranked-war wins',rankedwarhits:'Ranked-war hits',
      factionrespect:'Faction respect',attackdamage:'Total attack damage'};
    const found=new Map();
    for(const x of publicMetricItems(stats||{})){
      const key=x.name.split(' / ').pop().toLowerCase().replace(/[^a-z0-9]/g,'');
      if(Object.hasOwn(names,key)&&!found.has(key))found.set(key,x.value);
    }
    return Object.entries(names).filter(([key])=>found.has(key)).map(([key,label])=>
      ({label,value:found.get(key)}));
  }
  function apiSources(){
    const sources=[['War state','wars',10*MIN],['Our roster','ours',5*MIN],
      ['Opponent roster','enemies',5*MIN],['Our history','ourWars',40*MIN],
      ['Opponent history','enemyWars',40*MIN],['Own exact battle stats','own-battlestats',30*MIN],
      ['Personal spy reports','user-stat-reports',40*MIN],
      ['Faction spy reports','faction-stat-reports',40*MIN]];
    const at=Date.now();
    return sources.map(([label,key,ttl])=>{
      const updated=n(state.data.updated[key]),error=String(state.data.errors[key]||''),
        until=n(state.data.backoff[key]?.until);
      return {label,key,updated,error,until,
        status:until>at?'Retry delayed':error?'Error':updated&&at-updated<=ttl?'Fresh':
          updated?'Older data':'Not collected'};
    });
  }
  function apiCoverageCard(){
    const x=publicIntelCoverage(),history=historyCoverage(),sources=apiSources();
    return card('AUTOMATIC API COVERAGE | KNOW WHAT IS VERIFIED',
      '<p>Current opponent profiles '+x.profile+' / '+x.total+
      ' | Public lifetime stats '+x.stats+' / '+x.total+
      ' | Both '+x.complete+' / '+x.total+
      ' | History reports '+history.complete+' / '+history.total+'.</p>'+
      '<p class="ws-small">Torn profile and popular lifetime counters are public and do not reveal hidden battle stats. Up to three opponent dossiers are checked automatically per active-war refresh; older data and failed calls obey a six-hour cache / API backoff.</p>'+
      '<div class="ws-toolbar">'+b(state.scanning?'Scouting public API...':'Scout up to 6 more players',
        'scan-public',state.scanning||state.loading?'disabled':'')+
      b('Official API diagnostics','tab:diagnostics')+
      b('Find a player','find')+'</div>'+
      sources.map(x=>'<div class="ws-health-row"><span><strong>'+esc(x.label)+'</strong>'+
        '<small>Last successful read: '+esc(age(x.updated))+
        (x.error?' | '+esc(x.error):'')+
        (x.until>Date.now()?' | retry '+esc(stamp(x.until)):'')+'</small></span>'+
        pill(x.status,x.status==='Fresh'?'good':x.status==='Error'||x.status==='Retry delayed'?'bad':'')+
        '</div>').join('')+
      (x.restricted?'<p class="ws-small">'+x.restricted+
        ' recent player reads returned no permitted public data. These are unknown, not zero.</p>':''));
  }
  function publicStatsHtml(id){
    const item=state.data.publicIntel[id];
    if(!item)return empty('Public profile and personal statistics are being collected automatically from Torn.');
    const p=item.profile||{},stats=publicMetricItems(item.stats||{}).slice(0,65);
    const highlights=publicCombatHighlights(item.stats||{});
    return '<p>Last checked '+esc(age(item.at))+
      ' | Torn public API. Popular lifetime counters are not battle stats or current-war performance.</p>'+
      (highlights.length?'<div class="ws-inline-metrics">'+
        highlights.map(x=>'<span>'+esc(x.label)+': <b>'+fmt(x.value)+'</b></span>').join('')+
        '</div>':'')+
      '<div class="ws-grid">'+
      stat('Profile rank',p.rank||'\u2014','Torn public profile')+
      stat('Account age',p.age===null||p.age===undefined?'\u2014':fmt(p.age)+' days','Torn public profile')+
      stat('Public awards',p.awards===null||p.awards===undefined?'\u2014':fmt(p.awards),'Torn public profile')+
      '</div>'+(stats.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Public statistic</th><th>Value</th></tr></thead><tbody>'+
      stats.map(x=>'<tr><td>'+esc(x.name.replace(/_/g,' '))+'</td><td>'+fmt(x.value)+'</td></tr>').join('')+'</tbody></table></div>':
      empty('This key returned no numerical public personal-stat fields.'));
  }
  // Public player details are API-backed. Fetch a small rotating batch in the
  // background rather than requiring individual profile clicks or manual fields.
  // Collect automatically from the official public profile and popular-stats
  // endpoints. Prioritise assigned and watched targets; no extra API key needed.
  async function refreshPublicIntel(batch=2){
    if(!effectiveKey()||!state.data.enemies.length)return 0;
    const now=Date.now(),assigned=new Set(Object.values(cfg.assignments||{}).map(positive)),
      importance=p=>(assigned.has(p.id)?100:0)+(cfg.watchlist?.[p.id]?70:0),
      candidates=state.data.enemies.slice().filter(p=>
        !state.data.publicIntel[p.id]||now-n(state.data.publicIntel[p.id].at)>=6*HOUR)
        .sort((a,b)=>importance(b)-importance(a)||
          n(state.data.publicIntel[a.id]?.at)-n(state.data.publicIntel[b.id]?.at))
        .slice(0,Math.max(1,Math.min(8,Math.floor(Number(batch)||2))));
    let scanned=0;
    for(const p of candidates){
      const id=positive(p.id);
      if(!id)continue;
      const prior=state.data.publicIntel[id]||{},
        obj={profile:prior.profile||{},stats:prior.stats||{},at:now,
          profileAt:n(prior.profileAt),statsAt:n(prior.statsAt)};
      let obtained=false;
      try{
        const profile=await call('/user/'+id+'/profile','public-profile-'+id,6*HOUR);
        if(profile){
          const pr=profile.profile||profile;
          obj.profile={rank:String(pr.rank||''),age:officialNumber(pr.age),
            awards:officialNumber(pr.awards)};
          obj.profileAt=Date.now();
          obtained=true;
        }
      }catch(_){}
      try{
        const stats=await call('/user/'+id+'/personalstats?cat=popular',
          'public-stats-'+id,6*HOUR);
        if(stats){obj.stats=stats.personalstats||stats;obj.statsAt=Date.now();obtained=true;}
      }catch(_){}
      state.data.publicIntel[id]={...obj,restricted:!obtained&&
        !Object.keys(obj.profile).length&&!publicMetricItems(obj.stats).length};
      scanned++;
    }
    const ids=Object.keys(state.data.publicIntel).sort((a,b)=>
      n(state.data.publicIntel[b]?.at)-n(state.data.publicIntel[a]?.at));
    for(const id of ids.slice(100))delete state.data.publicIntel[id];
    return scanned;
  }
  async function loadPublicIntel(id){
    if(!positive(id)||state.loading)return;
    const item=state.data.publicIntel[id];
    if(item&&Date.now()-n(item.at)<6*HOUR){confirmed('Public Torn profile cached '+age(item.at)+'. Latest existing data shown.');render();return;}
    state.loading=true;state.error='';render();
    const obj={profile:item?.profile||{},stats:item?.stats||{},at:Date.now()};
    try{
      const profile=await call('/user/'+id+'/profile','public-profile-'+id,6*HOUR);
      const pr=profile?.profile||profile||{};
      if(profile)obj.profile={rank:String(pr.rank||''),age:pr.age===undefined?null:n(pr.age),
        awards:pr.awards===undefined?null:n(pr.awards)};
    }catch(e){state.data.errors['public-profile-'+id]=String(e.message||e);}
    try{
      const stats=await call('/user/'+id+'/personalstats?cat=popular','public-stats-'+id,6*HOUR);
      if(stats)obj.stats=stats.personalstats||stats;
    }catch(e){state.data.errors['public-stats-'+id]=String(e.message||e);}
    if(Object.keys(obj.profile).length||Object.keys(obj.stats).length){
      state.data.publicIntel[id]=obj;
      const keys=Object.keys(state.data.publicIntel).sort((a,b)=>n(state.data.publicIntel[b]?.at)-n(state.data.publicIntel[a]?.at));
      for(const old of keys.slice(80))delete state.data.publicIntel[old];
    }else state.error='Public profile and stats unavailable. Check Diagnostics for denied selections.';
    state.loading=false;save();render();
  }
  async function loadWarReport(id){
    if(!positive(id)||state.loading)return;
    state.loading=true;state.error='';render();
    try{
      const data=await call('/faction/'+id+'/rankedwarreport','report-'+id);
      if(data){
         const parsed=report(data,id);
         if(parsed.factions.length>=2&&positive(parsed.war?.end)){
           state.data.reports[id]=parsed;state.selectedWar=id;state.tab='intel';
         }else state.error='Torn returned an incomplete report. No totals were invented.';
       }
      else if(!state.data.reports[id])state.error='War report not available yet. Check Diagnostics for endpoint errors.';
    }catch(e){state.error='Cannot load official report: '+String(e.message||e);}
    finally{state.loading=false;save();render();}
  }
  function makeAfterAction(w){
    if(!w?.id||!n(w.end))return null;
    const ourId=positive(cfg.ourId),ours=w.scores?.find(f=>positive(f.id)===ourId),
      theirs=w.scores?.find(f=>positive(f.id)!==ourId);
    if(!ours||!theirs)return null;
    const enemyId=positive(theirs.id),r=state.data.reports[String(w.id)]||null;
    const ourReport=r?.factions?.find(f=>positive(f.id)===ourId);
    const enemyReport=r?.factions?.find(f=>positive(f.id)===enemyId);
    const ownContributors=(ourReport?.members||[]).filter(p=>n(p.score)>0).sort((a,b)=>n(b.score)-n(a.score));
    const enemyContributors=(enemyReport?.members||[]).filter(p=>n(p.score)>0).sort((a,b)=>n(b.score)-n(a.score));
    const sumTop=arr=>arr.slice(0,3).reduce((total,p)=>total+n(p.score),0);
    const sumAll=arr=>arr.reduce((total,p)=>total+n(p.score),0);
    const enemyTop3Pct=sumAll(enemyContributors)?Math.round(sumTop(enemyContributors)/sumAll(enemyContributors)*100):null;
    const oursTop3Pct=sumAll(ownContributors)?Math.round(sumTop(ownContributors)/sumAll(ownContributors)*100):null;
    const ownObserved=warSamples(w.id,'ours'),enemyObserved=warSamples(w.id,'enemies'),pace=warPace(w.id);
    const hitEvidence=warAttackInsights(w.id),rows=warAttackRows(w.id).filter(a=>a.side==='ours');
    const chains=rows.map(a=>officialNumber(a.chain)).filter(v=>v!==null&&v>0);
    const maxObservedChain=chains.length?Math.max(...chains):null;
    const targets=Object.values(rows.reduce((db,a)=>{
      const item=db[a.defender]||(db[a.defender]={
        id:a.defender,name:a.defenderName||('Player '+a.defender),attacks:0,score:0});
      item.attacks++;if(n(a.respect)>0)item.score+=n(a.respect);
      return db;
    },{})).map(p=>({...p,perEnergy:p.attacks?p.score/(p.attacks*25):null}))
      .sort((a,b)=>(b.perEnergy??-1)-(a.perEnergy??-1)||b.score-a.score).slice(0,10);
    const squads={black:squadWarSummary(w.id,'black'),regular:squadWarSummary(w.id,'regular')};
    const outcome=positive(w.winner)?w.winner===ourId?'Won':'Lost':'Undecided';
    const lessons=[];
    if(enemyTop3Pct!==null&&enemyContributors.length>=4&&enemyTop3Pct>=65)
      lessons.push('Opponent scoring was concentrated in its top three recorded contributors ('+enemyTop3Pct+'% of recorded player points). Review these hitters next war.');
    if(ownObserved.checks>=5&&ownObserved.onlinePct!==null&&ownObserved.onlinePct<35)
      lessons.push('Only '+ownObserved.onlinePct+'% of our sampled member checks were online in this war. Review roster coverage at critical times.');
    if(enemyObserved.checks>=5&&enemyObserved.awayPct!==null&&enemyObserved.awayPct>=25)
      lessons.push('Opponent was travelling in '+enemyObserved.awayPct+'% of sampled member checks. Compare flight timing with the next opponent.');
    if(ownContributors.length&&ownContributors.length<Math.max(2,Math.ceil(n(ourReport?.members?.length)*0.4)))
      lessons.push('A limited share of members listed in our report scored points. Review deployment and energy readiness.');
    if(outcome==='Lost')lessons.push('Review our manual assignments against confirmed matchup evidence before the next ranked war.');
    if(!ourReport||!enemyReport)lessons.push('Detailed player scorecards are not available yet. Refresh Past wars for an upgraded debrief.');
    if(!ownObserved.checks&&!enemyObserved.checks)lessons.push('No online/travel telemetry was collected during this war; historical behaviour is unknown.');
    if(!pace?.measurable)lessons.push('No reliable timed scoring trend was observed; final score alone cannot establish momentum changes.');
    if(hitEvidence.known){
      const efficient=hitEvidence.per.filter(p=>p.attacks>=3)
        .sort((a,b)=>b.respect/b.attacks-a.respect/a.attacks);
      if(efficient.length)lessons.push('Compare recorded respect per attack: '+
        efficient[0].name+' led eligible observed hitters. Recorded feed is partial and total energy is estimated.');
      if(hitEvidence.attempts>=5&&hitEvidence.pointsPerEnergy!==null)
        lessons.push('Partial attack ledger: '+hitEvidence.attempts+' own attempts, '+
          hitEvidence.scored+' with positive respect and '+hitEvidence.pointsPerEnergy.toFixed(3)+
          ' observed respect per estimated energy. Validate against official report.');
    }
    return {id:positive(w.id),start:n(w.start),end:n(w.end),ourId,enemyId,enemyName:String(theirs.name||''),
      ourScore:officialNumber(ours.score),enemyScore:officialNumber(theirs.score),outcome,detail:Boolean(ourReport&&enemyReport),
      ownContributors:ownContributors.slice(0,12),enemyContributors:enemyContributors.slice(0,12),
      ownCount:ownContributors.length,enemyCount:enemyContributors.length,
      ownTop3Pct:oursTop3Pct,enemyTop3Pct,ownSamples:ownObserved.checks,enemySamples:enemyObserved.checks,
      ourOnlinePct:ownObserved.onlinePct,enemyOnlinePct:enemyObserved.onlinePct,
      enemyTravelPct:enemyObserved.awayPct,paceSamples:pace?.samples||0,
      hitEvidence,topTargets:targets,maxObservedChain,squads,
      lessons,computedAt:Date.now()};
  }
  function buildAfterActions(){
    const wars=(state.data.ourWars||[]).filter(w=>n(w.end)).slice()
      .sort((a,b)=>n(b.end)-n(a.end)).slice(0,20);
    for(const w of wars){
      const summary=makeAfterAction(w);
      if(!summary)continue;
      const key=String(w.id),prior=state.data.afterActions[key];
      const pending=positive(state.data.meta.pendingAfterAction)===positive(w.id);
      state.data.afterActions[key]={...summary,reviewed:Boolean(prior?.reviewed),
        newFromObservedWar:Boolean(prior?.newFromObservedWar||pending),
        firstSeen:prior?.firstSeen||Date.now()};
      if(pending)state.data.meta.pendingAfterAction=0;
    }
    const keep=new Set(wars.map(w=>String(w.id)));
    for(const id of Object.keys(state.data.afterActions))if(!keep.has(id))delete state.data.afterActions[id];
  }
  function afterActionText(x){
    return 'War-TornStaxx after-action | War #'+x.id+'\n'+
      'Result: '+x.outcome+' | Us '+(x.ourScore??'unknown')+' / Opponent '+(x.enemyScore??'unknown')+
      ' | Opponent faction #'+x.enemyId+'\n'+
      'Detailed report: '+(x.detail?'available':'awaiting')+
      ' | Our recorded scorers: '+x.ownCount+' | Enemy scorers: '+x.enemyCount+'\n'+
      'Opponent top-three recorded share: '+(x.enemyTop3Pct===null?'unknown':x.enemyTop3Pct+'%')+'\n'+
      'Observed our online: '+(x.ourOnlinePct===null?'unknown':x.ourOnlinePct+'%')+
      ' | Enemy travel: '+(x.enemyTravelPct===null?'unknown':x.enemyTravelPct+'%')+'\n'+
      'Sampled attacks: '+(x.hitEvidence?.known?x.hitEvidence.attempts+' captured, '+
          x.hitEvidence.scored+' scored, respect/E '+(x.hitEvidence.pointsPerEnergy===null?
          'unknown':x.hitEvidence.pointsPerEnergy.toFixed(3)):'not captured')+'\n'+
      'Best sampled target: '+(x.topTargets?.length?x.topTargets[0].name+
          ' ('+x.topTargets[0].score.toFixed(1)+' respect / '+x.topTargets[0].attacks+
          ' attempts)':'not captured')+'\n'+
      'Max observed chain: '+(x.maxObservedChain??'unknown')+'\n'+
      ['black','regular'].map(k=>{
        const y=x.squads?.[k];
        return (k==='black'?'Black Skulls':'Regular members')+
          ' official earned: '+(y?.points??'unknown')+
          ' | Enemy points conceded (partial): '+(y?.enemyPointsReceived??'unknown')+
          ' | Net swing proxy: '+(y?.netProxy??'unknown');
      }).join('\n')+'\n'+
      'Review:\n'+x.lessons.map((z,i)=>(i+1)+'. '+z).join('\n')+'\n'+
      'Sources: official completed-war results and optional local foreground observations. No gameplay actions were performed.';
  }
  function warContributionIntel(){
    const last=latestFinished('enemies');
    const side=last?reportSide(state.data.reports[last.id],cfg.enemyId):null;
    if(!side)return {known:false};
    const players=side.members.filter(p=>p.score>0).sort((a,b)=>b.score-a.score);
    const top3=players.slice(0,3),sum=players.reduce((total,p)=>total+p.score,0);
    return {known:true,id:last.id,total:side.score,attacks:side.attacks,
      contributors:players.length,players:side.members.length,
      top3Score:top3.reduce((total,p)=>total+p.score,0),
      top3Share:sum?Math.round(100*top3.reduce((total,p)=>total+p.score,0)/sum):null,
      avgPerAttack:side.attacks?side.score/side.attacks:null,leaders:top3};
  }
  function flightWatchPanel(){
    const arrivals=inboundReturns(),fresh=Date.now()-n(state.data.updated.enemies)<5*MIN;
    return card('Inbound enemy flights | Torn roster status',
      '<p>Return times appear only when Torn explicitly identifies an inbound flight and publishes a usable status expiry. This is an ETA to verify, not permission to attack a player still travelling.</p>'+
      (arrivals.length?arrivals.slice(0,15).map(({player:p,flight:x})=>
        '<div class="ws-row"><span>'+infoButton(p.name,p.id)+' '+ffBadge(p.id)+
        '<br><small>'+esc(x.statusText||p.status)+' | '+(x.eta?'Torn return ETA '+esc(stamp(x.eta)):'No official return ETA')+
        ' | Roster '+esc(age(state.data.updated.enemies))+'</small></span>'+
        '<span>'+(x.eta?pill(flightCountdown(x.eta),fresh?'good':''):'ETA unknown')+
        ' '+b(cfg.watchlist[p.id]?'Unwatch':'Watch','watch:'+p.id)+'</span></div>').join(''):
        empty('No explicitly inbound opponents in the latest roster. Outbound flights and players merely abroad are intentionally excluded.'))+
      (fresh?'':'<p class="ws-note ws-warn">Roster stale: refresh before relying on an inbound ETA.</p>')+
      '<div class="ws-toolbar">'+b('Refresh status','refresh')+b('Open enemy activity','tab:activity')+'</div>');
  }
  function readinessPanel(){
    const skulls=state.data.ours.filter(p=>Boolean(cfg.blackSkulls[p.id]));
    const ownerId=positive(state.data.meta.ownerId),now=Date.now();
    return card('Black Skulls attack readiness | energy and medical',
      '<p><b>Energy:</b> a standard Torn attack costs 25 E. <b>Medical cooldown:</b> shows ability to use medical items, not whether an attack is possible. The registered key owner may be read from their own API; other members require a local, time-stamped entry and are not assumed ready.</p>'+
      '<div class="ws-toolbar">'+b('Refresh own energy/cooldown','refresh-readiness')+b('Open personal hitter lists','tab:matchups')+'</div>'+
      (skulls.length?'<div class="ws-table-wrap"><table class="ws-leader-table"><thead><tr><th>Black Skull</th><th>Status</th><th>Energy / source</th><th>Medical cooldown</th><th>Local update (optional)</th></tr></thead><tbody>'+
      skulls.sort((a,b)=>Number(isOnline(b))-Number(isOnline(a))).map(p=>{
        const r=hitterReadiness(p,now),manual=manualReadinessFor(p.id,now),
          canManual=positive(p.id)!==ownerId||r.source!=='Own Torn API';
        return '<tr><td data-label="Black Skull">'+infoButton(p.name,p.id)+'</td>'+
          '<td data-label="Readiness">'+pill(r.status,r.status==='Attack energy ready'?'good':r.status==='Low energy'?'bad':'')+
          '<br><small>'+esc(p.status)+'</small></td>'+
          '<td data-label="Energy">'+(r.energy===null?'Unknown':fmt(r.energy)+' E')+
          '<br><small>'+esc(r.source)+'</small></td>'+
          '<td data-label="Medical cooldown">'+(r.medicalLeft===null?'Unknown':r.medicalLeft+'m remaining')+
          '<br><small>'+esc(r.medicalSource)+'</small></td>'+
          '<td data-label="Local update">'+
          (canManual?'<input inputmode="numeric" type="number" min="0" max="1000" data-ready-energy="'+p.id+
            '" aria-label="Known energy '+esc(p.name)+'" placeholder="Energy E" value="'+(manual?.energy??'')+'">'+
            '<input inputmode="numeric" type="number" min="0" max="720" data-ready-medical="'+p.id+
            '" aria-label="Medical minutes '+esc(p.name)+'" placeholder="Med minutes" value="'+(manual?.medicalUntil?Math.max(0,Math.ceil((manual.medicalUntil-now)/MIN)):'')+'">'+
            b('Save local reading','save-readiness:'+p.id):
            '<small>Own key auto-read. Refresh for current values.</small>')+'</td></tr>';
      }).join('')+'</tbody></table></div>':
      empty('No Black Skulls tagged yet. Mark your hitters in the Leadership command member table.'))+
      '<p class="ws-small">Manual readings expire after 45 minutes; own API readings after 15 minutes. Unknown energy never becomes \"ready\" by assumption. Neither route shares personal bars with other faction members.</p>');
  }
  function watchlistPanel(){
    const watched=state.data.enemies.filter(p=>Boolean(cfg.watchlist[p.id]));
    return card('Priority watchlist | '+watched.length+' opponents',
      watched.length?watched.sort((a,b)=>threatRating(b).score-threatRating(a).score).slice(0,12)
        .map(p=>'<div class="ws-row"><span>'+infoButton(p.name,p.id)+' '+ffBadge(p.id)+
          '<br><small>'+esc(p.status)+' | '+esc(p.lastAction)+' | Last score '+scoreLabel(lastKnownMemberScore('enemies',p.id))+
          ' | Threat '+threatRating(p).score+
          (flightEvidence(p).kind==='returning'?' | Inbound '+(flightEvidence(p).eta?flightCountdown(flightEvidence(p).eta):'ETA unknown'):'')+'</small></span>'+
          '<span>'+b('Unwatch','watch:'+p.id)+' '+a('Attack',attackLink(p.id))+'</span></div>').join('')+
          '<div class="ws-toolbar">'+b('See all watched','watched-list')+'</div>':
        empty('Tap Watch beside any enemy to pin them here across refreshes and return to their dossier quickly.'));
  }
  function reliabilityPanel(){
    const available=state.data.ours.filter(p=>Boolean(cfg.blackSkulls[p.id])&&memberState(p)==='okay');
    const ranked=available.flatMap(p=>personalShortlist(p,6).filter(x=>x.tier===0).map(x=>({...x,hitter:p})))
      .sort((a,b)=>b.encounters.wins-a.encounters.wins||b.score-a.score||a.enemy.id-b.enemy.id)
      .slice(0,8);
    return card('Black Skulls | most reliable evidenced matchups',
      '<p>Ranked by current favourable manual battle-stat evidence and recorded wins for the selected hitter. Unknown and stale spies never appear as confirmed candidates. FFScouter remains beside each opponent but does not by itself establish reliability.</p>'+
      (ranked.length?ranked.map(x=>'<div class="ws-row"><span>'+
        infoButton(x.hitter.name,x.hitter.id)+' vs '+infoButton(x.enemy.name,x.enemy.id)+' '+ffBadge(x.enemy.id)+
        '<br><small>'+esc(x.reliability)+' | Previous recorded wins '+x.encounters.wins+
        ' | Modelled hitter FF '+(x.ffForHitter===null?'unknown':x.ffForHitter.toFixed(2)+'x')+
        ' | Enemy status '+esc(x.enemy.status)+'</small></span>'+
        b('Save manual assignment','assign:'+x.hitter.id+':'+x.enemy.id)+'</div>').join(''):
        empty('No confirmed favourable Black Skulls matchups yet. Add fresh comparable manual spies for both sides; third-party estimates alone are insufficient.'))+
      '<div class="ws-toolbar">'+b('Every hitter shortlist','tab:matchups')+
      b('Leadership board','tab:command')+'</div>');
  }
  function ffReviewShortlist(){
    const rows=state.data.enemies.map(p=>({p,intel:ffLabel(p.id)}))
      .filter(x=>x.intel.source==='estimate'&&memberState(x.p)==='okay')
      .sort((a,b)=>b.intel.ff-a.intel.ff).slice(0,8);
    return card('High-FF opponents to review | FFScouter',
      rows.length?'<p>Highest calculated FFScouter multipliers for the API-key owner. Values above 3.00 are uncapped difficulty estimates (Torn awarded FF stays capped at 3.00). High values can mean a much stronger, unsafe opponent. Verify strength and status.</p>'+
        rows.map(x=>'<div class="ws-row"><span>'+infoButton(x.p.name,x.p.id)+' '+ffBadge(x.p.id)+
        '<br><small>Previous reported score '+scoreLabel(lastKnownMemberScore('enemies',x.p.id))+
        ' | '+esc(x.p.lastAction)+'</small></span>'+b('Compare','tab:matchups')+'</div>').join(''):
        empty('No current FFScouter estimates for Okay opponents. Enable lookup or wait for the next scheduled refresh.'));
  }
  function ffStatusPanel(){
    const d=ffCoverage(),reg=state.data.meta.ffRegistration||{},
      enabled=d.enabled&&d.keyAvailable;
    const status=!cfg.ffConsent?'Third-party consent required':
      !cfg.ffEnabled?'FFScouter lookup switched off':!d.keyAvailable?'No usable Torn key':
      reg.registered===false?'Key not registered':reg.registered?'Registered '+(reg.premium?'Premium':'Free'):'Registration not yet checked';
    return card('Fair Fight intelligence | source: FFScouter',
      '<p><b>'+esc(status)+'</b> | FF available for '+d.covered+' / '+d.total+' opponents'+
      (d.stale?' | '+d.stale+' stale estimates':'')+' | '+d.unknown+' unknown.</p>'+
      '<p>Last successful fetch: '+esc(age(d.last))+
      '. Estimates are for the registered API-key owner. Individual Black Skulls FF values are calculated separately when you have comparable spy/BSS data for both players.</p>'+
      (state.data.errors.ffscouter?'<div class="ws-note ws-warn">FFScouter: '+esc(state.data.errors.ffscouter)+'</div>':'')+
      '<div class="ws-toolbar">'+b('Refresh FF','refresh-ff')+b('Check registered key','check-ff-key')+
      b('FF settings','tab:settings')+'</div>'+
      '<p class="ws-small">FFScouter calculated FF can exceed 3.00: that means an increasingly tough opponent, NOT bonus respect above 3.00. Torn awarded FF stays between 1.00 and 3.00; logged attacks are labelled observed.</p>');
  }
  async function manualFFCheck(onlyCheck=false){
    if(state.loading||state.ffLoading)return;
    if(!cfg.ffConsent||!cfg.ffEnabled||!ffApiKey()){navigate('settings');state.error='Enable FFScouter with explicit consent, then save Settings before checking the key.';render();return;}
    state.ffLoading=true;state.error='';render();
    try{
      if(onlyCheck){delete state.data.meta.ffRegistration;await checkFFRegistration(true);}
      else await refreshFF(true);
      state.error=state.data.errors.ffscouter?'FF lookup: '+state.data.errors.ffscouter:
        onlyCheck?'FFScouter key is registered.':'FF coverage checked. Last data '+age(state.data.updated.ffscouter)+'.';
    }catch(e){
      state.data.errors.ffscouter=String(e?.message||e).slice(0,150);
      state.error=state.data.errors.ffscouter;
    }finally{state.ffLoading=false;save();render();}
  }

  // War shortcuts are a navigational overlay, never a gameplay automator.
  // Require an official recent war update before exposing live controls.
  function activeWarNow(){
    const w=state.data.war,at=Date.now(),update=n(state.data.updated.wars);
    return Boolean(w?.id&&update&&at>=update&&at-update<=10*MIN&&
      (!n(w.start)||n(w.start)*1000<=at)&&
      !/pending|upcoming|scheduled|waiting|matching|ended|complete/i.test(String(w.status||'')));
  }
  function ourWarReadiness(){
    const id=positive(state.data.meta?.ownerId),player=state.data.ours.find(p=>p.id===id),
      fresh=rosterFresh('ours'),kind=fresh&&player?memberState(player):'unknown',
      readiness=player?hitterReadiness(player):null;
    return {id,player,fresh,kind,energy:readiness?.energy??null};
  }

  // Relative ranked-war score yield: base respect * war factor * manual-spy FF.
  // Confidence is an eligibility gate, not an invented probability of winning.

  function efficiencyHits(friend,limit=8){
    if(!friend||!activeWarNow()||!rosterFresh('ours')||!rosterFresh('enemies')||
      memberState(friend)!=='okay')return [];
    const ownBss=bsScore(spy(friend.id)),observed=cfg.enableAttacks?
      warAttackRows(positive(state.data.war?.id)):[];
    const risk=hitterRisk(friend.id),bands=enemyRoleBands();
    return state.data.enemies.filter(p=>memberState(p)==='okay'&&
      roleAllows(friend,p,bands)).map(player=>{
      const ev=matchEvidence(friend,player),otherBss=bsScore(spy(player.id)),
        ratio=ev.match?.ratio;
      if(!ownBss||!otherBss||!ev.verified||!ev.rosterVerified||
        ev.encounters.losses>0||ev.conflict||
        (ev.tier!==0&&!(risk.mode==='aggressive'&&ev.tier===1))||
        !Number.isFinite(ratio)||ratio>risk.maxRatio||
        ev.encounters.wins<risk.minWins)return null;
      const ff=ev.match?.ff;
      if(!Number.isFinite(ff)||ff<1||ff>3)return null;
      // Torn base respect is (ln(target level) + 1) / 4; actual war points vary.
      const lvl=Math.max(1,Math.min(100,n(player.level))),
        base=(Math.log(lvl)+1)/4,model=base*2*ff,
        learned=learnedYield(friend,player,model,observed);
      return {player,evidence:ev,ff,modeled:model,actual:learned.actual,
        sampleCount:learned.samples,pointsPer25:learned.pointsPer25,
        pointsPerEnergy:learned.pointsPer25/25,source:learned.confidence,
        riskMode:risk.mode,ratio,role:cfg.blackSkulls[friend.id]?'Black Skull':'Regular'};
    }).filter(Boolean).sort((x,y)=>y.pointsPerEnergy-x.pointsPerEnergy||
      y.evidence.score-x.evidence.score||x.player.id-y.player.id).slice(0,limit);
  }
  function bestEfficiencyHit(){
    const self=ourWarReadiness();
    return self.kind==='okay'&&self.player?efficiencyHits(self.player,1)[0]||null:null;
  }
  // The quick hit button respects a Skull Capo / locally saved order.
  // A stale or unsafe order must NEVER silently redirect to another opponent.
  function myMission(){
    const self=ourWarReadiness(),assignedId=positive(cfg.assignments[self.id]),
      assigned=state.data.enemies.find(p=>p.id===assignedId)||null,
      // One verified scan serves both the recommended option and any saved order.
      options=self.kind==='okay'&&self.player?
        efficiencyHits(self.player,Math.max(1,state.data.enemies.length)):[],
      recommended=options[0]||null;
    let target=assignedId?null:recommended,issue='',evidence=null;
    if(assignedId){
      if(!assigned)issue='The assigned opponent is missing from the current roster.';
      else if(!self.player||self.kind!=='okay')issue='Your official status is not confirmed Okay.';
      else if(!rosterFresh('ours')||!rosterFresh('enemies'))
        issue='An official roster is older than five minutes.';
      else if(memberState(assigned)!=='okay')
        issue='The assigned opponent is '+memberState(assigned)+', not Okay.';
      else if(!roleAllows(self.player,assigned))
        issue='The assigned opponent is outside your Black Skulls / regular BSS bracket.';
      else{
        evidence=matchEvidence(self.player,assigned);
        target=options.find(hit=>hit.player.id===assignedId)||null;
        if(!target)issue='Assignment requires a new matchup check: '+evidence.reason+
          '. Verify manual spy age, observed losses, risk settings and energy.';
      }
    }
    if(self.energy!==null&&self.energy<25){
      target=null;issue='Your last known energy is below 25 E.';
    }
    return {self,assignedId,assigned,recommended,target,issue,evidence,
      hasOrder:Boolean(assignedId)};
  }
  function missionPanel(){
    const m=myMission(),self=m.self,
      role=cfg.blackSkulls[self.id]?'Black Skull':'Regular attacker',
      target=m.target?.player||null,
      buttonAction=m.hasOrder&&!m.target?(self.id?'hitter:'+self.id:'tab:matchups'):
        target?'fast-hit':'tab:matchups',
      buttonText=m.hasOrder&&!m.target?'REVIEW ORDER':target?
        m.hasOrder?'HIT MY ORDER':'HIT SUGGESTED TARGET':'FIND VERIFIED MATCHUP';
    return card('MY MISSION | '+role,
      '<div class="ws-row"><span><b>My status: '+esc(self.kind)+'</b>'+
      '<br><small>Energy '+(self.energy===null?'unknown':fmt(self.energy)+' E')+
      ' | own roster '+esc(age(state.data.updated.ours))+'</small></span>'+
      pill(m.hasOrder?'SAVED ORDER':'NO SAVED ORDER',m.hasOrder?'good':'')+'</div>'+
      '<p><b>Assigned opponent:</b> '+(m.assigned?
        infoButton(m.assigned.name,m.assigned.id)+' '+ffBadge(m.assigned.id):
        m.assignedId?'#'+m.assignedId+' (not in roster)':'None')+'</p>'+
      '<p><b>Decision:</b> '+(m.hasOrder?(target?
        'Saved assignment is currently eligible under your local verified risk checks.':
        'Do not use a quick-hit shortcut until this assignment is reviewed.'):
        target?'No manual order. A verified provisional option is available.':
        'No eligible verified option has been identified.')+'</p>'+
      (m.issue?'<div class="ws-note ws-warn">'+esc(m.issue)+'</div>':'')+
      (target?'<p><b>Hit candidate:</b> '+infoButton(target.name,target.id)+
        ' | '+fmt(m.target.pointsPer25)+' estimated / sampled points per 25 E'+
        '<br><small>'+esc(m.target.source)+' | '+esc(m.target.evidence.reliability)+
        '. Buffs and live availability still require checking.</small></p>':
        m.recommended&&m.hasOrder?
          '<p class="ws-small">A different verified opportunity exists ('+
          esc(m.recommended.player.name)+'), but your saved assignment will not be bypassed.</p>':'')+
      '<div class="ws-toolbar">'+b(buttonText,buttonAction)+
      (m.assigned?b('Inspect assigned enemy','player:'+m.assigned.id):'')+
      b('My matchups',self.id?'hitter:'+self.id:'tab:matchups')+
      b('Squad orders','tab:command')+'</div>');
  }
  function commandPulse(){
    const at=Date.now(),fresh=rosterFresh('ours',at)&&rosterFresh('enemies',at),
      squad=blackSkullsCoverage(at),actions=operationalQueue(at,squad).filter(x=>x.group==='now').slice(0,4),
      holes=squad.targets.filter(x=>x.needsAssignment||x.blocked).slice(0,3);
    return card('SKULL CAPO | 30-SECOND WAR BRIEF',
      '<div class="ws-inline-metrics"><span>Heavy targets: '+fmt(squad.targets.length)+'</span>'+
      '<span>Unassigned: '+fmt(squad.unassigned)+'</span>'+
      '<span>Blocked orders: '+fmt(squad.blocked)+'</span>'+
      '<span>Matchup-verified coverage: '+fmt(squad.verifiedAssigned)+'</span>'+
      '<span>Unknown enemy BSS: '+fmt(squad.bands.unknown)+'</span></div>'+
      '<p class="ws-small">'+(fresh?
        'Fresh official rosters. Coverage comes from local orders and verified manual comparative matchups.':
        'STALE ROSTERS: all live availability and replacement recommendations require a new refresh.')+
      '</p>'+
      '<h3>What needs action</h3>'+
      (actions.length?actions.map(x=>'<div class="ws-row"><span><b>'+esc(x.title)+
        '</b><br><small>'+esc(x.detail)+'</small></span>'+
        b('Review',x.action)+'</div>').join(''):
        empty('No urgent intervention evidenced; continue monitoring.'))+
      '<h3>High-strength targets needing coverage</h3>'+
      (holes.length?holes.map(x=>'<div class="ws-row"><span>'+
        infoButton(x.enemy.name,x.enemy.id)+' '+ffBadge(x.enemy.id)+
        '<br><small>BSS '+fmt(x.bss)+' | '+esc(x.reason)+
        ' | '+esc(x.priority?.confidence||'BSS only')+'</small></span>'+
        (fresh&&x.replacement?
          b('Replace hitter','skull-replace:'+x.assigned[0].id+':'+
            x.replacement.player.id+':'+x.enemy.id):
        fresh&&!x.covered&&x.free.length?
          b('Assign hitter','skull-assign:'+x.free[0].player.id+':'+x.enemy.id):
          b('Inspect','player:'+x.enemy.id))+'</div>').join(''):
        empty(squad.targets.length?'No heavy-target gaps identified in the saved local orders.':
          'No known high-BSS targets yet. Collect BSS or adjust the heavy cutoff.'))+
      '<div class="ws-toolbar">'+b('Full Black Skulls coverage','tab:leader')+
        b('All operations','tab:operations')+
        b('Copy squad brief','copy-skull-chat')+
        b('Refresh official statuses','refresh')+'</div>');
  }
  function turtleWindow(at=Date.now()){
    const self=ourWarReadiness(),t=turtleAssessment(at),score=t.score,
      skull=Boolean(cfg.blackSkulls[self.id]),
      remaining=self.kind==='hospital'&&self.player?.until>at?
        Math.ceil((self.player.until-at)/MIN):0;
    if(!activeWarNow()||!t.ownFresh||!t.enemyFresh||!score)
      return {minutes:null,remaining,shortfall:null,advice:'Refresh official score and both rosters.',
        reason:'Insufficient fresh information'};
    if(skull&&self.kind==='okay')return {minutes:null,remaining,shortfall:null,
      advice:'Stay available for verified hits unless leadership assigns you a defensive duty.',
      reason:'Black Skulls are designated hitters'};
    const pace=t.pace,enemyRate=pace?.measurable&&pace.last?.at&&at-pace.last.at<10*MIN?pace.rateEnemy:null,
      pressure=t.enemyOnline>Math.max(1,t.online)||(enemyRate!==null&&enemyRate>=60),
      minutes=score.net>0&&t.plan.mode==='full'?120:score.net>0&&pressure?90:60;
    return {minutes,remaining,shortfall:Math.max(0,minutes-remaining),
      advice:score.net<0?'Defence for non-hitters only; keep proven hitters available to recover points.':
        minutes===120?'Long coordinated defensive window. Watch revives and hospital expiry.':
        minutes===90?'Maintain cover while the opponent is more active.':
        'Short defensive window; reassess after the next status refresh.',
      reason:'Suggested coverage window, not a selectable or guaranteed item duration'};
  }
  function availabilityTransitions(before,after,warId,at=Date.now()){
    if(!warId||!before?.length||!after?.length)return [];
    const old=new Map(before.map(p=>[p.id,p])),watched=watchedTargetIds();
    const heavy=enemyRoleBands().heavy;
    const high=new Set(enemyThreatRows(warId).slice(0,8).filter(x=>
      x.live?.scoringHits>0||x.previous?.score>0).map(x=>x.player.id));
    return after.filter(p=>{
      const prev=old.get(p.id),assigned=Object.values(cfg.assignments).some(id=>positive(id)===p.id);
      return prev&&memberState(prev)!=='okay'&&memberState(p)==='okay'&&
        (watched.has(p.id)||assigned||high.has(p.id)||heavy.has(p.id));
    }).map(p=>({id:p.id,name:p.name,warId,at,previous:memberState(old.get(p.id)),
      kind:heavy.has(p.id)?'Black Skulls heavy target':watched.has(p.id)?'watched':'scorer'}));
  }
  function recordAvailability(before,after,warId,at=Date.now()){
    const db=state.data.availabilityEvents;
    for(const [key,x] of Object.entries(db))if(!x||x.warId!==warId||
      at-n(x.at)>10*MIN||!after.some(p=>p.id===x.id&&memberState(p)==='okay'))delete db[key];
    const results=availabilityTransitions(before,after,warId,at);
    for(const event of results)db[event.warId+':'+event.id]=event;
    return results;
  }
  function priorityOpportunities(at=Date.now()){
    return activeWarNow()&&rosterFresh('enemies',at)&&cfg.priorityNotifications!==false?
      Object.values(state.data.availabilityEvents||{}).filter(x=>
        x.warId===positive(state.data.war?.id)&&at-n(x.at)<5*MIN&&
        state.data.enemies.some(p=>p.id===x.id&&memberState(p)==='okay'))
        .sort((a,b)=>b.at-a.at||a.id-b.id).slice(0,4):[];
  }

  function strongestVerifiedHit(){
    const self=ourWarReadiness();
    if(!activeWarNow()||self.kind!=='okay'||!rosterFresh('enemies'))return null;
    return state.data.enemies.filter(p=>memberState(p)==='okay').map(player=>{
      const evidence=matchEvidence(self.player,player);
      return {player,evidence,strength:bsScore(spy(player.id))};
    }).filter(x=>x.strength!==null&&x.evidence.tier===0&&x.evidence.rosterVerified&&
      !x.evidence.encounters.losses&&!x.evidence.conflict)
      .sort((a,b)=>b.strength-a.strength||b.evidence.score-a.evidence.score||a.player.id-b.player.id)[0]||null;
  }
  function itemIntent(){
    try{
      const x=JSON.parse(sessionStorage.getItem('warstaxx-item-intent')||'null');
      return x&&['heal','turtle'].includes(x.mode)&&Date.now()-n(x.at)<20*MIN?x.mode:'';
    }catch(_){return '';}
  }
  function itemFlow(mode){
    try{sessionStorage.setItem('warstaxx-item-intent',JSON.stringify({mode,at:Date.now()}));}catch(_){}
    if(location.pathname.toLowerCase()==='/item.php')renderWarStrip(true);
    else location.assign('https://www.torn.com/item.php');
  }
  function locateItem(mode){
    if(location.pathname.toLowerCase()!=='/item.php')return;
    const patterns={ipecac:/\bipecac\b/i,blood:/\bblood bag\b/i,morphine:/\bmorphine\b/i,firstaid:/\bfirst aid kit\b/i};
    const rule=patterns[mode],info=document.querySelector('#warstaxx-live-strip [data-ws-note]');
    if(!rule)return;
    // Inspect only the current foreground Torn item page, never request other pages.
    const rows=Array.from(document.querySelectorAll('li,tr,[class*="itemRow"],[class*="item-row"],[class*="itemCard"],[class*="item-card"],[data-item-id]')).slice(0,1800);
    const node=rows.filter(el=>!el.closest('#warstaxx-live-strip,#warstaxx-root,#staxx-hub-root')&&
      rule.test((el.textContent||'').slice(0,260))).sort((a,b)=>(a.textContent||'').length-(b.textContent||'').length)[0];
    if(!node){if(info)info.textContent='Not found in loaded items. Open Medical or check stock, then retry.';return;}
    node.scrollIntoView({block:'center',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth'});
    const old=node.style.outline;
    node.style.outline='3px solid #58dfff';
    setTimeout(()=>{if(node.isConnected)node.style.outline=old;},5000);
    if(info)info.textContent='Located. Tap Torn native Use yourself. Check blood compatibility first.';
  }

  // The shared service holds ONLY faction orders and policy. Torn keys, spies, notes,
  // FFScouter credentials and personal activity never appear in this payload.
  function sharedScope(){
    const faction=positive(cfg.ourId),war=positive(state.data.war?.id);
    return faction&&war?{faction,war}:null;
  }
  function sharedEndpoint(){
    if(!cfg.shared?.enabled||!cfg.shared.endpoint||!cfg.shared.token)return '';
    try{
      const url=new URL(String(cfg.shared.endpoint).trim());
      if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return '';
      return url.href.replace(/\/+$/,'');
    }catch(_){return '';}
  }
  function sharedPayload(){
    const plan=turtlePlan(),members=state.data.ours;
    return {assignments:{...cfg.assignments},blackSkulls:Object.fromEntries(
      Object.entries(cfg.blackSkulls).filter(([,yes])=>yes===true)),
      hitterRisk:Object.fromEntries(Object.entries(cfg.hitterRisk).map(([id,x])=>
        [id,{mode:hitterRisk(id).mode}])),
      controlAssignments:{...(cfg.controlAssignments[currentPlanKey()]||{})},
      turtlePlan:{mode:plan.mode,members:{...plan.members}},
      heavyPolicy:heavyRule(),
      leaderDuties:Object.fromEntries(members.filter(p=>
        hitterPlanStatus(p.id)!=='not-set').map(p=>[p.id,hitterPlanStatus(p.id)]))};
  }
  function sharedHasLocalOrders(){
    return Boolean(Object.keys(cfg.assignments).length||
      Object.values(cfg.blackSkulls).some(Boolean)||Object.keys(cfg.hitterRisk).length||
      Object.keys(cfg.controlAssignments[currentPlanKey()]||{}).length||
      Object.keys(turtlePlan().members).length||
      heavyRule().mode!=='percent'||heavyRule().percent!==40||heavyRule().minBss!==0||
      state.data.ours.some(p=>hitterPlanStatus(p.id)!=='not-set'));
  }
  function sharedResetScope(){
    const scope=sharedScope();if(!scope)return;
    const value=scope.faction+':'+scope.war;
    if(cfg.shared.scope===value)return;
    cfg.shared.scope=value;cfg.shared.revision=0;cfg.shared.localDirty=false;
    state.sharedRevision=0;state.sharedSyncAt=0;state.sharedError='';
    saveCfg();
  }
  async function sharedRequest(method,revision,payload){
    const base=sharedEndpoint(),scope=sharedScope();
    if(!base||!scope)throw new Error('Shared orders require HTTPS endpoint, token, faction and active war');
    const url=base+'/v1/factions/'+scope.faction+'/wars/'+scope.war+'/orders';
    const headers={'Authorization':'Bearer '+String(cfg.shared.token),
      'Accept':'application/json'};
    if(method==='PUT'){headers['Content-Type']='application/json';
      headers['If-Match']=String(revision);}
    // Deliberately uses CORS fetch: never sends the Torn API key or credentials.
    const controller=typeof AbortController==='function'?new AbortController():null;
    const timer=setTimeout(()=>controller?.abort(),12000);
    try{
      const response=await fetch(url,{method,mode:'cors',credentials:'omit',cache:'no-store',
        headers,...(controller?{signal:controller.signal}:{}),
        ...(method==='PUT'?{body:JSON.stringify({data:payload})}:{})});
      let result;try{result=await response.json();}catch(_){result={error:'Invalid server response'};}
      return {ok:response.ok,status:response.status,result};
    }finally{clearTimeout(timer);}
  }
  function applySharedOrders(data){
    if(!data||typeof data!=='object')return false;
    const maps=['assignments','blackSkulls','hitterRisk','controlAssignments','leaderDuties'];
    if(maps.some(k=>!data[k]||typeof data[k]!=='object'||Array.isArray(data[k])))return false;
    const turtle=data.turtlePlan;
    if(!turtle||typeof turtle!=='object'||!['balanced','defensive','full'].includes(turtle.mode)||
      !turtle.members||typeof turtle.members!=='object'||Array.isArray(turtle.members))return false;
    const incomingHeavy=data.heavyPolicy||{mode:'percent',percent:40,minBss:0};
    if(!['percent','min-bss'].includes(incomingHeavy.mode)||
      !Number.isInteger(incomingHeavy.percent)||incomingHeavy.percent<5||
      incomingHeavy.percent>100||!Number.isFinite(incomingHeavy.minBss)||
      incomingHeavy.minBss<0||incomingHeavy.minBss>1e15)return false;
    // Only share allowed namespaces; protect against prototype-pollution keys.
    const positiveMap=value=>Object.fromEntries(Object.entries(value)
      .filter(([id])=>/^[1-9][0-9]{0,9}$/.test(id)));
    cfg.heavyPolicy=heavyRule(incomingHeavy);
    cfg.assignments=Object.fromEntries(Object.entries(positiveMap(data.assignments))
      .map(([k,v])=>[k,positive(v)]).filter(([,v])=>v>0));
    if(positive(cfg.enemyId))cfg.ordersByEnemy[String(cfg.enemyId)]={...cfg.assignments};
    cfg.blackSkulls=Object.fromEntries(Object.entries(positiveMap(data.blackSkulls))
      .filter(([,v])=>v===true));
    cfg.hitterRisk=Object.fromEntries(Object.entries(positiveMap(data.hitterRisk))
      .filter(([,v])=>v&&['safe','balanced','aggressive'].includes(v.mode))
      .map(([id,v])=>[id,{mode:v.mode}]));
    cfg.controlAssignments[currentPlanKey()]=Object.fromEntries(
      Object.entries(positiveMap(data.controlAssignments)).map(([k,v])=>[k,positive(v)])
        .filter(([,v])=>v>0));
    cfg.turtlePlans[currentPlanKey()]={mode:turtle.mode,members:Object.fromEntries(
      Object.entries(positiveMap(turtle.members)).filter(([,role])=>
        ['auto','strike','turtle','reserve'].includes(role))),updated:Date.now()};
    const prefix='war:'+positive(state.data.war?.id)+':member:';
    for(const key of Object.keys(cfg.planStatus))if(key.startsWith(prefix))delete cfg.planStatus[key];
    for(const [id,status] of Object.entries(positiveMap(data.leaderDuties)))
      if(['ready','engaged','monitor','standby','support','needs-spy','complete'].includes(status))
        cfg.planStatus[prefix+id]=status;
    saveCfg();return true;
  }
  async function sharedPull(discardLocal=false){
    if(state.sharedBusy||!sharedEndpoint()||!sharedScope()||document.hidden)return;
    sharedResetScope();
    if(cfg.shared.localDirty&&!discardLocal){
      state.sharedError='Unpublished local orders: publish, or choose Discard local and pull.';
      return;
    }
    if(!discardLocal&&Date.now()-n(state.sharedSyncAt)<75*1000)return;
    state.sharedBusy=true;
    try{
      const response=await sharedRequest('GET');
      if(!response.ok)throw new Error('Shared GET '+response.status+': '+String(response.result.error||'denied'));
      const remote=response.result;
      if(remote.faction!==positive(cfg.ourId)||remote.war!==positive(state.data.war?.id))
        throw new Error('Wrong faction or war in shared response');
      if(remote.data){
        if(!discardLocal&&n(cfg.shared.revision)===0&&sharedHasLocalOrders()){
          state.sharedError='Local orders already exist. Publish local as officer or choose Discard local and pull.';
          state.sharedRevision=0;state.sharedSyncAt=Date.now();return;
        }
        if(!applySharedOrders(remote.data))throw new Error('Invalid shared orders schema');
      }
      cfg.shared.revision=positive(remote.revision)||0;cfg.shared.localDirty=false;
      state.sharedRevision=cfg.shared.revision;state.sharedSyncAt=Date.now();
      state.sharedError='';saveCfg();publish();render();
    }catch(e){state.sharedError=String(e.message||e).slice(0,160);render();}
    finally{state.sharedBusy=false;}
  }
  async function sharedPush(){
    if(state.sharedBusy||!sharedEndpoint()||!sharedScope()||!cfg.shared.canWrite||
      document.hidden)return;
    sharedResetScope();state.sharedBusy=true;
    try{
      const scope=sharedScope(),before=sharedPayload(),editVersion=state.sharedEditVersion,
        response=await sharedRequest('PUT',n(cfg.shared.revision),before);
      if(response.status===409){
        state.sharedError='CONFLICT: a newer shared plan exists. Review before discarding or reapplying local changes.';
        cfg.shared.localDirty=true;saveCfg();render();return;
      }
      if(!response.ok)throw new Error('Shared PUT '+response.status+': '+String(response.result.error||'denied'));
      if(response.result.faction!==scope.faction||response.result.war!==scope.war)
        throw new Error('Shared response scope mismatch');
      cfg.shared.revision=positive(response.result.revision);
      cfg.shared.localDirty=state.sharedEditVersion!==editVersion;
      state.sharedRevision=cfg.shared.revision;state.sharedSyncAt=Date.now();
      state.sharedError=cfg.shared.localDirty?'Newer local edits are queued for the next publish.':'';
      saveCfg();publish();render();
      if(cfg.shared.localDirty&&cfg.shared.canWrite)
        setTimeout(()=>{if(!document.hidden)sharedPush();},1000);
    }catch(e){state.sharedError=String(e.message||e).slice(0,160);render();}
    finally{state.sharedBusy=false;}
  }
  function markSharedDirty(){
    if(!cfg.shared?.enabled)return;
    cfg.shared.localDirty=true;state.sharedEditVersion++;saveCfg();
    if(!cfg.shared.canWrite){
      state.sharedError='Read-only shared mode: local edits are not published. Discard local to restore official shared orders.';
      return;
    }
    if(state.sharedPushTimer)clearTimeout(state.sharedPushTimer);
    state.sharedPushTimer=setTimeout(()=>{if(!document.hidden)sharedPush();},1500);
  }

  function warQuick(action){
    const self=ourWarReadiness();
    if(action==='compact'){
      state.stripExpanded=!state.stripExpanded;
      renderWarStrip(true);return;
    }
    if(action==='war'){open({section:'overview'});return;}
    if(action==='skulls'){open({section:'skulls'});return;}
    if(action==='stats'){open({section:'reports'});return;}
    if(action==='enemy'){open({section:'enemy'});return;}
    if(action.startsWith('opportunity:')){focusOpportunity(positive(action.slice(12)));return;}
    if(action==='heal'){itemFlow('heal');return;}
    if(action==='turtle'){
      if(self.kind==='hospital'||turtleWindow().minutes===null){open({section:'turtle'});return;}
      itemFlow('turtle');return;
    }
    if(action==='clear-item'){try{sessionStorage.removeItem('warstaxx-item-intent');}catch(_){}renderWarStrip(true);return;}
    if(action.startsWith('item:')){locateItem(action.slice(5));return;}
    if(action!=='hit')return;
    // After a manual heal, one more Hit checks the official roster immediately.
    if(location.pathname.toLowerCase()==='/item.php'&&itemIntent()==='heal'&&self.kind!=='okay'){
      verifyHealedThenHit();return;
    }
    if(self.kind==='hospital'){itemFlow('heal');return;}
    if(self.kind!=='okay'||!self.fresh){
      open({section:'overview'});state.error='Hit unavailable: own Torn roster status is not confirmed Okay. Refresh before acting.';render();return;
    }
    if(self.energy!==null&&self.energy<25){
      open({section:'overview'});state.error='Hit unavailable: last known energy is below 25 E.';render();return;
    }
    const mission=myMission(),target=mission.target;
    if(mission.hasOrder&&!target){
      open({section:'overview'});
      state.error='Saved order blocked: '+mission.issue+' Open MY MISSION to review or change the local assignment.';
      render();return;
    }
    if(!target){
      open({section:'overview'});state.error='No verified favourable target. Open Matchups and obtain recent comparable spies; FFScouter alone cannot confirm a win.';render();return;
    }
    try{sessionStorage.removeItem('warstaxx-item-intent');}catch(_){}
    location.assign(attackLink(target.player.id));
  }
  async function verifyHealedThenHit(){
    if(state.quickHitPending)return;
    if(!effectiveKey()||!positive(cfg.ourId)){
      open({section:'overview'});
      state.error='Cannot recheck healing without a configured Torn API key and faction ID.';
      render();return;
    }
    state.quickHitPending=true;renderWarStrip(true);
    try{
      // This is a read-only official request initiated by the player's HIT tap.
      const response=await call('/faction/'+cfg.ourId+'/members','ours',0);
      if(!response)throw new Error('Current roster is temporarily unavailable; refresh then press HIT.');
      state.data.ours=roster(response);
      const now=ourWarReadiness();
      if(now.kind==='hospital'){
        open({section:'overview'});
        state.error='Torn still reports you hospitalised. Verify the item was used; press HIT again after Torn updates.';
        render();return;
      }
      if(now.kind!=='okay'){
        open({section:'overview'});
        state.error='Your current status is '+now.kind+'. HIT is limited to confirmed Okay status.';
        render();return;
      }
      if(!rosterFresh('enemies')){
        const enemies=await call('/faction/'+cfg.enemyId+'/members','enemies',0);
        if(enemies)state.data.enemies=roster(enemies);
      }
      save();warQuick('hit');
    }catch(e){
      open({section:'overview'});
      state.error='Could not confirm healed status: '+String(e.message||e).slice(0,140);
      render();
    }finally{
      state.quickHitPending=false;save();renderWarStrip(true);
    }
  }

  function focusOpportunity(id){
    if(!activeWarNow()||!positive(id)||!state.data.enemies.some(p=>p.id===id))return;
    open({section:'targets'});state.chosen=id;state.playerOpen=true;render();
  }
  function warStripPageMode(){
    const path=location.pathname.toLowerCase();
    const sid=(new URLSearchParams(location.search).get('sid')||'').toLowerCase();
    if(path==='/attack.php'||path==='/attack'||(['/loader.php','/page.php'].includes(path)&&sid.startsWith('attack'))||
      /(?:^|[?#&])sid=attack(?:[&#]|$)/i.test(location.hash))return 'hidden';
    if(isNativeWarPage()&&cfg.nativeWarEnabled!==false)return 'hidden';
    if(factionRoute()||(path==='/item.php'&&itemIntent()))return 'full';
    if(cfg.warStripScope==='faction')return 'hidden';
    return cfg.warStripScope==='everywhere'?'full':'mini';
  }
  function handleWarScroll(e){
    // Never resize the compact war commands on page scroll.
    return;
  }
  function renderWarStrip(force=false){
    const mode=warStripPageMode();
    state.stripRouteKey=location.pathname+location.search+location.hash;
    let bar=document.getElementById('warstaxx-live-strip');
    if(mode==='hidden'||(mode==='mini'&&!activeWarNow())){bar?.remove();return;}
    let host=document.querySelector('#mainContent,#main-content,#mainContainer,#mainWrapper,main,[role="main"]')||document.body;
    if(!host||host.closest('#warstaxx-root,#staxx-hub-root'))return;
    document.getElementById('warstaxx-faction-open')?.remove();
    if(!document.getElementById('warstaxx-live-style')){
      const style=document.createElement('style');style.id='warstaxx-live-style';
      style.textContent='#warstaxx-live-strip{position:static;top:auto;z-index:auto;clear:both;margin:5px 4px 7px;padding:6px 8px;border-radius:12px;border:1px solid #448db0;background:linear-gradient(110deg,#091c30,#0d3b5b);color:#eafbff;font:13px/1.4 system-ui,Arial,sans-serif;box-sizing:border-box;box-shadow:0 8px 25px #0004}'+
        '#warstaxx-live-strip *{box-sizing:border-box}#warstaxx-live-strip .wsw-top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}'+
        '#warstaxx-live-strip .wsw-top strong{font-size:14px}#warstaxx-live-strip .wsw-kicker{color:#6dd6fb;font-size:10px;font-weight:900}'+
        '#warstaxx-live-strip .wsw-meta{display:flex;gap:6px 15px;flex-wrap:wrap;color:#bdd9e8;font-size:11px;margin:6px 0}'+
        '#warstaxx-live-strip .wsw-actions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:8px}'+
        '#warstaxx-live-strip button{background:#154a6d;border:1px solid #3f8db9;color:white;font:750 12px system-ui,Arial,sans-serif;min-height:29px;padding:4px 7px;border-radius:6px;cursor:pointer}'+
        '#warstaxx-live-strip button[data-ws-quick=hit]{background:#076fad;border-color:#61d5ff}'+
        '#warstaxx-live-strip button[data-ws-quick=compact]{margin-left:auto;background:#10314b;font-size:11px}'+
        '#warstaxx-live-strip .wsw-item-controls{border-top:1px solid #3b7794;margin-top:10px;padding-top:8px;display:flex;gap:7px;flex-wrap:wrap}'+
        '#warstaxx-live-strip .wsw-item-controls small{display:block;width:100%;color:#c6ddeb}'+
        '#warstaxx-live-strip .wsw-opportunities{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:#ffdaa1;margin-top:7px;font-size:11px}'+
        '#warstaxx-live-strip .wsw-opportunities button{min-height:31px;background:#394365;border-color:#849adc}'+
        '#warstaxx-live-strip.wsw-standby{padding:4px 8px;border-color:#28415a;'+
        'background:#0b2036;box-shadow:none}'+
        '#warstaxx-live-strip.wsw-standby .wsw-top strong{font-size:11px;font-weight:650}'+
        '#warstaxx-live-strip .wsw-standby-actions{margin-left:auto;display:flex;gap:5px;align-items:center}'+
        '#warstaxx-live-strip .wsw-standby-actions button{min-height:31px;padding:4px 8px;font-size:10px}'+
        '#warstaxx-live-strip.wsw-mini{position:static;z-index:auto;margin:2px 4px 4px;padding:4px 8px;box-shadow:none;border-color:#284f69;background:#0b2239}'+
        '#warstaxx-live-strip.wsw-mini .wsw-top{flex-wrap:nowrap;gap:8px}'+
        '#warstaxx-live-strip.wsw-mini .wsw-top strong{font-size:12px;white-space:nowrap}'+
        '#warstaxx-live-strip.wsw-mini button{margin-left:auto;min-height:30px;padding:3px 9px;font-size:11px}'+
        '@media(max-width:600px){#warstaxx-live-strip{margin:3px 2px;padding:5px 6px}#warstaxx-live-strip .wsw-actions{grid-template-columns:repeat(3,minmax(0,1fr))}#warstaxx-live-strip button{font-size:10px;min-height:28px}#warstaxx-live-strip.wsw-mini{padding:3px 5px}#warstaxx-live-strip.wsw-mini .wsw-top{gap:5px}#warstaxx-live-strip.wsw-mini .wsw-top strong{font-size:10px}#warstaxx-live-strip.wsw-mini button{min-height:30px}}';
      style.textContent+="#warstaxx-live-strip{position:static!important;top:auto!important;z-index:auto!important;box-shadow:none!important}\n#warstaxx-live-strip .wsw-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n#warstaxx-live-strip .wsw-shortcuts{display:inline-flex;align-items:center;gap:4px;margin-left:auto}\n#warstaxx-live-strip .wsw-shortcuts button{min-height:29px;padding:4px 7px;white-space:nowrap}\n#warstaxx-live-strip .wsw-shortcuts button[data-ws-quick=\"hit\"]{background:#0875a9;border-color:#4dc8fc}\n#warstaxx-live-strip .wsw-shortcuts button[data-ws-quick=\"compact\"]{background:#12334a;border-color:#416b85}\n#warstaxx-live-strip .wsw-actions{grid-template-columns:repeat(3,minmax(0,1fr))}\n#warstaxx-live-strip .wsw-meta{margin:5px 0}\n@media(max-width:600px){#warstaxx-live-strip .wsw-top{gap:4px}#warstaxx-live-strip .wsw-shortcuts{gap:3px}#warstaxx-live-strip .wsw-shortcuts button{font-size:10px;padding:3px 5px;min-height:27px}}\n";
      document.head.appendChild(style);
    }
    if(!bar){
      bar=document.createElement('section');bar.id='warstaxx-live-strip';
      bar.setAttribute('aria-label','WarStaxx live war command bar');
      bar.addEventListener('click',e=>{
        const b=e.target.closest('[data-ws-quick]');if(!b||!bar.contains(b))return;
        e.preventDefault();warQuick(String(b.dataset.wsQuick||''));
      });
    }
    if(bar.parentNode!==host)host.insertBefore(bar,host.firstChild);
    bar.classList.toggle('wsw-mini',mode==='mini');
    const btn=(name,action)=>'<button type="button" data-ws-quick="'+esc(action)+'">'+esc(name)+'</button>';
    if(mode==='mini'){
      const score=warScore(),chain=chainStatus(),sig=['mini',state.data.war?.id,score?.our,score?.enemy,
        chain.fresh?chain.count:0,chain.fresh?chain.remaining:0].join(':');
      if(!force&&bar.dataset.signature===sig)return;
      bar.dataset.signature=sig;bar.classList.remove('wsw-standby');
      bar.innerHTML='<div class="wsw-top"><span class="wsw-kicker">WAR</span>'+
        '<strong>Us '+(score?fmt(score.our):'?')+' / Them '+(score?fmt(score.enemy):'?')+'</strong>'+
        (chain.fresh?'<span class="wsw-kicker">Chain '+fmt(chain.count)+' ('+chain.remaining+'s)</span>':'')+
        btn('WAR ROOM','war')+'</div>';
      return;
    }
    // Full commands remain on faction and war pages or while using item shortcuts.
    if(!activeWarNow()){
      const signature=['standby',cfg.enemyId,state.lastRefresh>0,Math.floor(Date.now()/MIN)].join(':');
      if(!force&&bar.dataset.signature===signature)return;
      bar.dataset.signature=signature;
      bar.classList.add('wsw-standby');
      bar.innerHTML='<div class="wsw-top"><span class="wsw-kicker">WARSTAXX | STANDBY</span>'+
        '<strong>'+esc(positive(cfg.enemyId)?'Scouting faction #'+cfg.enemyId:'Ready for the next ranked war')+'</strong>'+
        '<div class="wsw-standby-actions">'+btn('ACT NOW','war')+
          btn('OPPONENT','enemy')+btn('REPORTS','stats')+'</div></div>';
      return;
    }
    bar.classList.remove('wsw-standby');
    const mission=myMission(),self=mission.self,score=warScore(),target=mission.target,
      opportunities=priorityOpportunities(),defence=turtleWindow(),chain=chainStatus(),
      compact=!state.stripExpanded,
      intent=location.pathname.toLowerCase()==='/item.php'?itemIntent():'',
      sig=[state.data.war.id,score?.our,score?.enemy,self.kind,self.energy,target?.player.id,
        intent,compact,mission.assignedId,mission.issue,opportunities.map(x=>x.id+':'+x.at).join(','),state.quickHitPending,location.pathname,Math.floor(Date.now()/10000),chain.fresh?chain.count:0].join(':');
    if(!force&&bar.dataset.signature===sig)return;
    bar.dataset.signature=sig;
    const actionLabel=state.quickHitPending?'CHECKING':self.kind==='hospital'?'HEAL':
      mission.hasOrder&&!target?'REVIEW ORDER':'HIT';
    bar.innerHTML='<div class="wsw-top"><span class="wsw-kicker">WAR</span>'+
      '<strong class="wsw-score">'+(score?fmt(score.our)+' - '+fmt(score.enemy):'? - ?')+'</strong>'+
      '<span class="wsw-kicker">NET '+(score?(score.net>=0?'+':'')+fmt(score.net):'?')+'</span>'+
      (chain.fresh&&chain.count>0?'<span class="wsw-kicker">CHAIN '+fmt(chain.count)+' / '+chain.remaining+'s</span>':'')+
      '<span class="wsw-shortcuts">'+btn('TURTLE','turtle')+
      btn(actionLabel,'hit')+btn('Room','war')+btn(compact?'More':'Less','compact')+'</span></div>'+
      (compact?'':'<div class="wsw-meta"><span>YOU: '+esc(self.kind)+
        (self.energy===null?'':' | '+fmt(self.energy)+' E')+'</span>'+
        '<span>'+(mission.hasOrder?'MY ORDER: '+(mission.assigned?esc(mission.assigned.name):'#'+mission.assignedId)+
          (target?' | verified':' | review: '+esc(mission.issue)):
          target?'Suggested: '+esc(target.player.name)+' | '+fmt(target.pointsPer25)+' pts / 25 E':
            'No verified safe hit')+'</span>'+
        '<span>War '+esc(age(state.data.updated.wars))+
        ' | roster '+esc(age(state.data.updated.ours))+
        ' | turtle window '+(defence.minutes===null?'unknown':defence.minutes+'m')+'</span></div>'+
        '<div class="wsw-actions">'+btn('Heal items','heal')+
        btn(cfg.blackSkulls[self.id]?'My Skulls':'Skulls',cfg.blackSkulls[self.id]?'skulls':'war')+
        btn('Reports','stats')+'</div>'+
        (opportunities.length?'<div class="wsw-opportunities"><b>READY:</b> '+
          opportunities.slice(0,2).map(x=>btn(x.name,'opportunity:'+x.id)).join('')+'</div>':''))+
      (intent?'<div class="wsw-item-controls"><b>'+(intent==='turtle'?'Turtle items:':'Healing items:')+'</b>'+
        (intent==='turtle'?btn('Find Ipecac','item:ipecac')+btn('Find blood bags','item:blood'):
          btn('Find blood bags','item:blood')+btn('Find Morphine','item:morphine')+btn('Find First Aid','item:firstaid'))+
        btn('Close shortcuts','clear-item')+
        (intent==='turtle'?'<small>Suggested protection window '+(defence.minutes===null?'unavailable':
          defence.minutes+' minutes; remaining '+defence.remaining+' minutes; gap '+defence.shortfall+' minutes')+
          '. Actual Ipecac hospital duration is variable.</small>':'')+
        '<small data-ws-note>Locate an item, then tap Torn native Use. The script does not use medical items. Incompatible blood bags require your own blood-type check.</small></div>':'');
  }

  function confirmed(message){
    state.error='';state.notice={message:String(message),at:Date.now()};
  }
  function statusNote(){
    const own=n(state.data.updated.ours),enemy=n(state.data.updated.enemies);
    const fresh=rosterFresh('ours')&&rosterFresh('enemies');
    return '<div class="ws-note'+(fresh?'':' ws-warn')+'">'+
      (state.loading?'Refreshing official data... ':
        fresh?'Both rosters checked within five minutes. ':
          'One or both rosters need refresh. Our roster '+esc(age(own))+
            '; opponent '+esc(age(enemy))+'. ')+
      'Travel, online and hospital data are observed snapshots, not continuous records. '+
      '<span class="ws-small">Times shown in TCT (UTC).</span></div>'+
      (state.error?'<div class="ws-note ws-warn" role="alert">'+esc(state.error)+'</div>':
        state.notice&&Date.now()-state.notice.at<30000?
          '<div class="ws-note ws-success" role="status">'+esc(state.notice.message)+'</div>':'');
  }
  function scoreSpark(p){
    const pts=p?.points||[];
    if(!pts.length)return empty('No locally sampled score points yet.');
    const subset=pts.slice(-90),first=subset[0].at,last=subset[subset.length-1].at;
    const max=Math.max(1,...subset.map(x=>Math.max(n(x.our),n(x.enemy))));
    const xy=(v,i)=>{const x=10+320*(last===first?(i/(Math.max(1,subset.length-1))):(v.at-first)/(last-first));
      return x.toFixed(1);};
    const line=key=>subset.map((x,i)=>xy(x,i)+','+(94-85*Math.max(0,n(x[key]))/max).toFixed(1)).join(' ');
    return '<svg class="ws-score-chart" viewBox="0 0 340 110" role="img" aria-label="Locally sampled war scoring trend. Blue our faction; pink opponent.">'+
      '<line x1="10" y1="94" x2="330" y2="94" stroke="#52738e"/>'+
      '<polyline points="'+line('our')+'" fill="none" stroke="#61d9ff" stroke-width="2.8"/>'+
      '<polyline points="'+line('enemy')+'" fill="none" stroke="#ff809e" stroke-width="2.8"/>'+
      '<text x="10" y="106" fill="#a5bed0" font-size="9">'+
      esc(stamp(first))+'</text><text x="245" y="106" fill="#a5bed0" font-size="9">Latest sample</text></svg>'+
      '<p class="ws-small"><span class="ws-legend-own">Our score</span> | <span class="ws-legend-enemy">Enemy score</span>. '+
      subset.length+' official score samples observed in Torn PDA, not reconstructed game history.</p>';
  }
  function pace(){
    const active=positive(state.data.war?.id);
    const tracked=Object.values(state.data.scoreTimelines).filter(x=>Array.isArray(x?.points)&&x.points.length)
      .sort((a,b)=>n(b.lastAt)-n(a.lastAt)).slice(0,20);
    const selected=positive(state.selectedPace)||active||positive(tracked[0]?.id);
    const w=warPace(selected),current=state.data.war&&active===selected,score=current?warScore():null;
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">RANKED WAR | OFFICIAL SCORE SAMPLES</span>'+
      '<h2>Score pace and momentum</h2>'+
      '<p>Watch the scoreline and how quickly each faction is gaining points. Pace requires multiple score observations collected while Torn PDA is running; it is not continuous tracking.</p>'+
      '<div class="ws-toolbar">'+b('Refresh live score','refresh')+b('Follow current war','pace-live')+b('Leadership command','tab:command')+
      b('Opponent war records','tab:history')+'</div></div>';
    if(tracked.length>1)html+=card('Select a war', '<div class="ws-toolbar">'+
      tracked.map(x=>b('#'+x.id+(active===x.id?' active':''),'pace-war:'+x.id)).join('')+'</div>');
    if(!w)return html+empty('No scored war snapshots collected yet. Open WarStaxx while a ranked war is active and refresh; past war scores are available in Past wars, but their minute-by-minute pace cannot be reconstructed.');
    const stale=Date.now()-w.last.at>10*MIN;
    html+='<div class="ws-grid">'+
      stat('Our last recorded score',fmt(w.last.our),stale?'Snapshot stale: '+age(w.last.at):'Sampled '+age(w.last.at))+
      stat('Enemy last recorded score',fmt(w.last.enemy),'Net '+fmt(w.gap))+
      stat('Our scoring pace',w.rateOur===null?'\u2014':fmt(w.rateOur)+' /h',w.confidence+' | observed in '+fmt(w.span)+' mins')+
      stat('Enemy scoring pace',w.rateEnemy===null?'\u2014':fmt(w.rateEnemy)+' /h','Same sample window')+
      stat('Net scoring pace',w.netRate===null?'\u2014':(w.netRate>=0?'+':'')+fmt(w.netRate)+' /h',
        'Score difference change, not a win prediction')+
      stat('Observation coverage',fmt(w.samples)+' checks',fmt(w.fullSpan)+' min between first and latest samples')+'</div>';
    const acceleration=scoreAcceleration(selected);
    if(acceleration)html+=card('Enemy scoring acceleration | observed',
      '<p>'+pill(acceleration.label,acceleration.accelerating?'bad':'')+'</p>'+ 
      '<div class="ws-inline-metrics"><span>Previous enemy rate '+fmt(acceleration.previousEnemy)+' pts/h</span>'+ 
      '<span>Recent enemy rate '+fmt(acceleration.recentEnemy)+' pts/h</span>'+ 
      '<span>Change '+(acceleration.increase>=0?'+':'')+fmt(acceleration.increase)+' pts/h</span></div>'+ 
      '<p>Two timestamped, non-overlapping windows. Accelerating requires a meaningful increase, recent observations, and adequate coverage. This is not a guarantee of future scoring.</p>'+ 
      b('Open Black Skulls command','tab:command'));
    html+=card('War #'+selected+' | sampled score trend',scoreSpark(w)+
      '<p>Current sample: Our faction <b>'+fmt(w.last.our)+'</b>, enemy <b>'+fmt(w.last.enemy)+'</b>'+
      (score&&score.target?' | Ranked-war target '+fmt(score.target):'')+
      '. The chart uses only observed official score values, without filling unknown gaps.</p>'+
      (w.measurable?'<p>Observed score change during sampled window: us '+(w.deltaOur>=0?'+':'')+fmt(w.deltaOur)+
        ' / them '+(w.deltaEnemy>=0?'+':'')+fmt(w.deltaEnemy)+' points. '+'<b>'+
        (w.netRate>0?'Our side has gained ground in this window':w.netRate<0?'Opponent has gained ground in this window':'Score difference was unchanged')+
        '</b>.</p>':'<p class="ws-note ws-warn">Not enough timed samples for a meaningful points-per-hour figure. A second sample at least five minutes apart is needed.</p>')+
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Observed TCT</th><th>Our score</th><th>Enemy score</th><th>Net lead</th></tr></thead><tbody>'+
      w.points.slice(-25).reverse().map(x=>'<tr><td>'+esc(stamp(x.at))+'</td><td>'+fmt(x.our)+'</td><td>'+
        fmt(x.enemy)+'</td><td>'+fmt(n(x.our)-n(x.enemy))+'</td></tr>').join('')+'</tbody></table></div>');
    return html+card('How to read this','<p>Official scores are genuine Torn values; sampling intervals vary. Rates are arithmetic changes between the first and last snapshot within the observed last-hour window. Missing time is not treated as zero scoring. No automatic gameplay occurs.</p>');
  }
  function observedPlayerWars(playerId){
    return Object.values(state.data.warTimelines).map(r=>({
      id:r.id,name:r.name,start:n(r.start),enemyId:r.enemyId,
      player:r.sides?.enemies?.players?.[positive(playerId)]||null}))
      .filter(x=>x.player&&n(x.player.samples)).sort((a,b)=>b.start-a.start);
  }
  function memberWarTimeline(playerId){
    const wars=observedPlayerWars(playerId);
    return card('Observed opponent behaviour across ranked wars',
      wars.length?'<p>Only times observed while Torn PDA was open. Each war has separate samples, so older unobserved wars remain unknown.</p>'+
        '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>War</th><th>Checks</th><th>Online</th><th>Travelling</th><th>Hospital</th><th>View</th></tr></thead><tbody>'+
        wars.slice(0,16).map(w=>{const p=w.player;return '<tr><td>#'+w.id+'</td><td>'+p.samples+'</td><td>'+
          fmt(100*p.online/p.samples)+'%</td><td>'+fmt(100*p.away/p.samples)+'%</td><td>'+
          fmt(100*p.hospital/p.samples)+'%</td><td>'+b('Timeline','timeline-war:'+w.id)+'</td></tr>';}).join('')+
        '</tbody></table></div>':empty('No war-specific observations for this opponent yet. Earlier wars cannot be reconstructed from official result reports.'));
  }
  function timeline(){
    const records=Object.values(state.data.warTimelines).filter(r=>r&&r.sides)
      .sort((a,b)=>n(b.updated)-n(a.updated)).slice(0,20);
    const active=positive(state.data.war?.id),selected=positive(state.selectedTimeline)||active||positive(records[0]?.id);
    const rec=state.data.warTimelines[String(selected)];
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">PER-WAR ACTIVITY AND TRAVEL | ON-DEVICE OBSERVATIONS</span>'+
      '<h2>Opponent behaviour across wars</h2>'+
      '<p>Online, travelling, hospital and available states are sampled separately for each ranked war. Compare real observed patterns without inventing historic travel or sleep schedules.</p>'+
      '<div class="ws-toolbar">'+b('Latest observed war','timeline-latest')+b('General 24-hour activity','tab:activity')+b('Review enemy players','tab:targets')+
      b('Live scoring pace','tab:pace')+'</div></div>';
    if(!records.length)return html+empty('No ranked-war-specific snapshots exist on this device yet. Keep WarStaxx open during upcoming wars; each completed war with recorded observations will appear separately.');
    html+=card('Wars with local observations',
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>War</th><th>Opponent</th><th>Our checks</th><th>Enemy checks</th><th>Enemy online</th><th>Enemy travel</th><th>Data quality</th><th>Open</th></tr></thead><tbody>'+
      records.map(r=>{const o=warSamples(r.id,'ours'),e=warSamples(r.id,'enemies');
        return '<tr><td>#'+r.id+'</td><td>'+esc(r.name||('#'+r.enemyId))+'</td><td>'+fmt(o.checks)+
          '</td><td>'+fmt(e.checks)+'</td><td>'+scoreLabel(e.onlinePct)+(e.onlinePct===null?'':'%')+
          '</td><td>'+scoreLabel(e.awayPct)+(e.awayPct===null?'':'%')+
          '</td><td>'+pill(e.coverage)+'</td><td>'+b('Compare','timeline-war:'+r.id)+'</td></tr>';}).join('')+
      '</tbody></table></div>');
    if(!rec)return html;
    const ours=warSamples(rec.id,'ours'),enemy=warSamples(rec.id,'enemies');
    html+=card('War #'+rec.id+' | '+(rec.name||('Faction #'+rec.enemyId)),
      '<p>Our samples: '+ours.samples+' member-status checks in '+ours.checks+
      ' roster polls. Opponent: '+enemy.samples+' member-status checks in '+enemy.checks+
      ' roster polls. Confidence: '+esc(enemy.coverage)+'.</p>'+
      '<div class="ws-grid">'+
      stat('Opponent online',scoreLabel(enemy.onlinePct)+(enemy.onlinePct===null?'':'%'),'Share of recorded member-checks')+
      stat('Opponent travelling',scoreLabel(enemy.awayPct)+(enemy.awayPct===null?'':'%'),'Share of observed member-checks')+
      stat('Opponent hospitalised',scoreLabel(enemy.hospitalPct)+(enemy.hospitalPct===null?'':'%'),'Observed member-checks only')+
      stat('Our online',scoreLabel(ours.onlinePct)+(ours.onlinePct===null?'':'%'),'Same war, separate roster samples')+'</div>');
    const hours=new Set([...ours.hours.map(x=>x[0]),...enemy.hours.map(x=>x[0])]);
    const oHour=Object.fromEntries(ours.hours),eHour=Object.fromEntries(enemy.hours);
    html+=card('Observed hourly timeline | TCT (UTC)',
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>UTC hour</th><th>Our online</th><th>Enemy online</th><th>Enemy travelling</th><th>Enemy hospital</th><th>Polling coverage</th></tr></thead><tbody>'+
      [...hours].sort((a,b)=>Number(b)-Number(a)).slice(0,60).map(h=>{
        const o=oHour[h],e=eHour[h],pct=(obj,k)=>obj?.samples?fmt(100*obj[k]/obj.samples)+'%':'--';
        return '<tr><td>'+esc(stamp(Number(h)*HOUR))+'</td><td>'+pct(o,'online')+
          '</td><td>'+pct(e,'online')+'</td><td>'+pct(e,'away')+'</td><td>'+pct(e,'hospital')+
          '</td><td>'+n(o?.checks)+' / '+n(e?.checks)+' polls</td></tr>';}).join('')+
      '</tbody></table></div>');
    const players=enemy.players.slice().sort((a,b)=>
      (b.samples?b.away/b.samples:0)-(a.samples?a.away/a.samples:0)).slice(0,25);
    html+=card('Individual opponent travel during war #'+rec.id,
      players.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Member</th><th>Checks</th><th>Travelling</th><th>Online</th><th>Hospital</th><th>Intel</th></tr></thead><tbody>'+
      players.map(p=>'<tr><td>'+infoButton(p.name,p.id)+'</td><td>'+p.samples+'</td><td>'+
        fmt(100*p.away/p.samples)+'%</td><td>'+fmt(100*p.online/p.samples)+'%</td><td>'+
        fmt(100*p.hospital/p.samples)+'%</td><td>'+infoButton('Profile',p.id)+'</td></tr>').join('')+
      '</tbody></table></div>':empty('Enemy member samples are missing in this war.'));
    return html;
  }
  function afteraction(){
    const all=Object.values(state.data.afterActions).filter(x=>positive(x.id)).sort((a,b)=>n(b.end)-n(a.end));
    const selected=positive(state.selectedDebrief)||positive(all[0]?.id),
      r=state.data.afterActions[String(selected)]||null;
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">AUTOMATIC AFTER-ACTION REVIEW | OFFICIAL + OBSERVED EVIDENCE</span>'+
      '<h2>What happened, and what should we change?</h2>'+
      '<p>A debrief is generated locally when a completed ranked war appears in the official history. It improves when Torn returns the detailed scorecard. Activity and scoring trends only appear if this device captured them.</p>'+
      '<div class="ws-toolbar">'+b('Refresh official reports','refresh')+b('Leadership command','tab:command')+
      b('Past wars','tab:history')+'</div></div>';
    if(!all.length)return html+empty('No finished ranked wars have loaded yet. On the next foreground refresh after a war ends, WarStaxx generates a read-only full performance report from the official result and available evidence.');
    html+=card('War results and analysis status',
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>War</th><th>Result</th><th>Score</th><th>Player report</th><th>Review</th><th>Open</th></tr></thead><tbody>'+
      all.map(x=>'<tr><td>#'+x.id+'<br><small>'+esc(stamp(x.end*1000))+'</small></td>'+
        '<td>'+pill(x.outcome,x.outcome==='Won'?'good':x.outcome==='Lost'?'bad':'')+'</td>'+
        '<td>'+scoreLabel(x.ourScore)+' / '+scoreLabel(x.enemyScore)+'</td>'+
        '<td>'+pill(x.detail?'Detailed':'Summary only')+'</td>'+
        '<td>'+pill(x.reviewed?'Reviewed':x.newFromObservedWar?'New debrief':'Historical')+'</td>'+
        '<td>'+b('Analyse','debrief:'+x.id)+'</td></tr>').join('')+'</tbody></table></div>');
    if(!r)return html;
    html+=card('War #'+r.id+' | '+r.outcome,
      '<div class="ws-grid">'+
      stat('Our score',scoreLabel(r.ourScore),'Official war result')+
      stat('Opponent score',scoreLabel(r.enemyScore),'Opponent #'+r.enemyId)+
      stat('Our scoring members',fmt(r.ownCount),r.detail?'Detailed report':'Incomplete report')+
      stat('Enemy scoring members',fmt(r.enemyCount),r.detail?'Detailed report':'Incomplete report')+
      stat('Enemy top 3 share',r.enemyTop3Pct===null?'\u2014':fmt(r.enemyTop3Pct)+'%',
        'Of summed recorded enemy member points')+
      stat('Observed coverage',r.ourSamples+' / '+r.enemySamples,'Our / their roster polls')+'</div>'+
      '<p>End '+esc(stamp(r.end*1000))+' | Enemy '+esc(r.enemyName||('#'+r.enemyId))+
      ' | '+(r.detail?'Official player scorecards loaded':'Waiting for official individual reports')+'</p>'+
      '<div class="ws-toolbar">'+b('See detailed official scorecard','war:'+r.id)+
      b('View war timeline','debrief-timeline:'+r.id)+
      b('View score samples','debrief-pace:'+r.id)+
      b('Copy report','copy-debrief:'+r.id)+
      b(r.reviewed?'Mark unreviewed':'Mark reviewed','review-debrief:'+r.id)+'</div>');
    html+=card('Evidence-based lessons and action items',
      '<p>These are prompts derived from known scores and sampled data, not proof of hidden battle stats or unrecorded activity.</p>'+
      (r.lessons.length?'<ol>'+r.lessons.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>':
        empty('No evidence-backed action items found in the currently loaded data.'))+
      (r.ourOnlinePct===null?'':'<p>Our observed online member-check share '+r.ourOnlinePct+'%.</p>')+
      (r.enemyOnlinePct===null?'':'<p>Enemy observed online share '+r.enemyOnlinePct+'%.</p>')+
      (r.enemyTravelPct===null?'':'<p>Enemy travel share '+r.enemyTravelPct+'% of recorded checks.</p>'));
    const table=(title,players)=>
      card(title,
        players.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Player</th><th>Points</th><th>Attacks</th><th>Open</th></tr></thead><tbody>'+
          players.map(p=>'<tr><td>'+infoButton(p.name||('Player '+p.id),p.id)+'</td><td>'+
            fmt(p.score)+'</td><td>'+fmt(p.attacks)+'</td><td>'+a('Torn profile',link(p.id))+'</td></tr>').join('')+
          '</tbody></table></div>':empty('Individual contributions not available in the stored Torn report.'));
    html+=table('Our top recorded contributors',r.ownContributors)+table('Opponent top recorded contributors',r.enemyContributors);
    const attacks=r.hitEvidence||{},hasHits=Boolean(attacks.known);
    html+=card('Attack efficiency and energy use | partial captured ledger',
      '<div class="ws-grid">'+
      stat('Observed own attempts',hasHits?fmt(attacks.attempts):'Unknown',
        'Partial API feed for the official war window')+
      stat('Hits producing respect',hasHits?fmt(attacks.scored):'Unknown',
        'Does not prove every missed API attack was a loss')+
      stat('Estimated energy spent',hasHits?fmt(attacks.estimatedEnergy)+' E':'Unknown',
        'Assumes 25 E for each captured attack')+
      stat('Captured respect / E',hasHits&&attacks.pointsPerEnergy!==null?
        attacks.pointsPerEnergy.toFixed(3):'Unknown',
        'Captured respect / estimated energy, not total war points / actual energy')+
      stat('Highest observed chain',r.maxObservedChain===null?'Unknown':'#'+fmt(r.maxObservedChain),
        'Only captured chain values, not a complete chain history')+'</div>'+
      '<p class="ws-small">Final war score and member attack totals above are official where the completed war report is available. '+
      'The energy calculations below use only matching captured attacks, and are not a full Torn energy ledger.</p>'+
      (hasHits&&attacks.per.length?'<div class="ws-table-wrap"><table><thead><tr><th>Hitter</th><th>Captured attacks</th><th>Captured respect</th><th>Approx E</th><th>Respect / E</th></tr></thead><tbody>'+
        attacks.per.slice(0,20).map(p=>'<tr><td>'+infoButton(p.name,p.id)+'</td><td>'+fmt(p.attacks)+'</td>'+
          '<td>'+fmt(p.respect)+'</td><td>'+fmt(p.estimatedEnergy)+'</td>'+
          '<td>'+(p.attacks?(p.respect/p.estimatedEnergy).toFixed(3):'Unknown')+'</td></tr>').join('')+
        '</tbody></table></div>':empty('No same-war own-faction ranked attacks captured by this device.'))+
      (r.topTargets?.length?'<h3>Most efficient observed enemy targets</h3>'+
        '<div class="ws-table-wrap"><table><thead><tr><th>Target</th><th>Recorded attempts</th><th>Captured respect</th><th>Respect / E</th></tr></thead><tbody>'+
        r.topTargets.map(p=>'<tr><td>'+infoButton(p.name,p.id)+'</td><td>'+fmt(p.attacks)+
          '</td><td>'+fmt(p.score)+'</td><td>'+p.perEnergy.toFixed(3)+'</td></tr>').join('')+
        '</tbody></table></div>':''));
    if(r.detail)html+=card('Official points per attack | all available contributors',
      '<p>The ratio below uses official reported score / official attack count. It is a performance proxy, '+
      'not an exact energy measurement. Unknown or zero-attack rows are shown as unknown.</p>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Contributor</th><th>Points</th><th>Attacks</th><th>Score / attack</th><th>Score / approx E</th></tr></thead><tbody>'+
      r.ownContributors.map(p=>'<tr><td>'+infoButton(p.name,p.id)+'</td><td>'+fmt(p.score)+
        '</td><td>'+fmt(p.attacks)+'</td><td>'+(p.attacks?(p.score/p.attacks).toFixed(2):'Unknown')+
        '</td><td>'+(p.attacks?(p.score/(p.attacks*25)).toFixed(3):'Unknown')+'</td></tr>').join('')+
      '</tbody></table></div>');
    const skulls=blackSkullScorecards(r.id);
    const scorecard='<p>Official individual score and attack totals are taken from the completed-war report, if available. The comparison is against up to three prior fetched official reports and is not a skill rating. Black Skulls are identified using your CURRENT local tags.</p>'+
      (skulls.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Black Skull</th><th>Official score</th><th>Official attacks</th><th>Faction score share</th><th>Previous-war mean</th><th>Performance review</th></tr></thead><tbody>'+
      skulls.map(z=>'<tr><td>'+infoButton(z.name,z.id)+'</td><td>'+scoreLabel(z.score)+'</td>'+
        '<td>'+scoreLabel(z.hits)+'</td><td>'+(z.share===null?'Unknown':fmt(z.share)+'%')+'</td>'+
        '<td>'+scoreLabel(z.previousAvg)+'</td><td>'+
        (z.score===null?'Not in the official report; do not infer zero':
         z.previousAvg===null?'No comparable prior report':
         z.score>z.previousAvg?'Above available historical mean':
         z.score<z.previousAvg?'Below available historical mean':'Similar to historical mean')+
        '</td></tr>').join('')+'</tbody></table></div>':
       empty('No locally tagged Black Skulls. Mark hitters under Leadership to compare their recorded scores.'))+
      '<p class="ws-small">Scoring totals are official when the report exists. Earlier-wars comparisons use only fetched report rows, with unknown values preserved. Prior battle stats or combat wins cannot be inferred from scoring alone.</p>';
    html+=card('Black Skulls | individual post-war scorecards',scorecard)+
      blackSkullsPerformanceCard(r.id)+comparableStrengthCard(r.id)+squadReportCard(r.id,'black')+
      squadReportCard(r.id,'regular');
    return html;
  }
  function command(){
    const plan=leadershipSummary(),p=warPace(),score=warScore(),
      noteKey=positive(state.data.war?.id)||('scout-'+positive(cfg.enemyId)),
      notes=String(cfg.leaderNotes[noteKey]||'');
    const filtered=state.data.ours.slice().sort((a,b)=>
      Number(Boolean(cfg.blackSkulls[b.id]))-Number(Boolean(cfg.blackSkulls[a.id]))||
      Number(isOnline(b))-Number(isOnline(a))||a.name.localeCompare(b.name))
      .filter(x=>state.leaderFilter==='all'||state.leaderFilter==='black'&&cfg.blackSkulls[x.id]||
        state.leaderFilter==='ready'&&memberState(x)==='okay');
    const draft=suggestedDraft(),busy=['engaged','monitor'];
    const acceleration=scoreAcceleration();
    const readyE=state.data.ours.filter(p=>cfg.blackSkulls[p.id]&&hitterReadiness(p).energyEnough===true&&memberState(p)==='okay').length;
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">LEADERSHIP COMMAND | LOCAL TACTICAL BOARD</span>'+
      '<h2>Ranked war command centre</h2>'+
      '<p>Manage Black Skulls, set individual targets and monitor live Torn roster statuses alongside locally assigned duties. Nothing is automatically posted to faction chat or executed.</p>'+
      '<div class="ws-toolbar">'+b('Refresh war intelligence','refresh')+b('Copy leadership briefing','copy-leader-brief')+
      b('Operations queue','tab:operations')+b('View war pace','tab:pace')+b('Player shortlists','tab:matchups')+b('War timelines','tab:timeline')+'</div></div>'+
      '<div class="ws-grid">'+
      stat('Black Skulls ready',plan.skullReady+' / '+plan.skulls,'Current Okay status / tagged Black Skulls')+
      stat('Known attack energy',readyE+' / '+plan.skulls,'25+ E known, fresh owner or manual reading')+
      stat('Manual target coverage',plan.manual+' / '+plan.members,'Members with locally saved manual assignments')+
      stat('Leadership duties active',fmt(plan.inProgress),'Engaged or monitoring, manually marked')+
      stat('Enemy Okay',rosterFresh('enemies')?state.data.enemies.filter(x=>memberState(x)==='okay').length+' / '+plan.enemy:'Stale','Last official roster snapshot')+
      stat('Scoring momentum',p?.netRate===null||!p?'\u2014':(p.netRate>=0?'+':'')+fmt(p.netRate)+'/h','Recent observed net score pace')+
      stat('Current score',score?fmt(score.our)+' / '+fmt(score.enemy):'\u2014','Our faction / enemy official snapshot')+'</div>';
    if(acceleration?.accelerating)html+=card('Opponent pace warning',
      '<p>Enemy scoring accelerated from '+fmt(acceleration.previousEnemy)+' to '+fmt(acceleration.recentEnemy)+
      ' points/hour in two observed windows. Check your available Black Skulls and assignments.</p>'+b('See score evidence','tab:pace'));
    html+=readinessPanel()+flightWatchPanel();
    html+=card('Operational checks',
      (plan.duplicateTargets.length?'<div class="ws-note ws-warn"><b>Overlapping manual targets:</b> '+
      plan.duplicateTargets.map(x=>'#'+x.id+' assigned '+x.count+' times').join(', ')+
      '. Coordinate to avoid unintentional duplication.</div>':'')+
      (plan.skulls&&!plan.skullReady?'<div class="ws-note ws-warn">No Black Skulls currently Okay in the observed roster.</div>':'')+
      (Date.now()-n(state.data.updated.enemies)>5*MIN?'<div class="ws-note ws-warn">Enemy roster is stale. Refresh before issuing orders.</div>':'')+
      '<p><b>Auto-draft:</b> '+draft.length+' available, unassigned Black Skulls have a strong candidate with manual battle-stat evidence. '+
      'Drafting makes role-separated local target assignments and never executes attacks.</p>'+
      '<div class="ws-toolbar">'+b('Draft '+draft.length+' verified role-appropriate orders','draft-black',draft.length?'':'disabled')+
      b('View existing orders','tab:assignments')+b('Manage targets','tab:targets')+'</div>');
    if(!plan.members)return html+empty('No own-faction roster has loaded. WarStaxx will automatically detect your faction using your configured Torn API key.');
    html+=card('Assign and monitor every team member',
      '<p>Choose a target explicitly. The <b>Target</b> selector saves locally; the <b>Duty</b> selector is a manually recorded leadership status, not an automated Torn action.</p>'+
      '<div class="ws-toolbar"><label>Roster view<select id="ws-leader-filter">'+
      [['all','All members'],['black','Black Skulls'],['ready','Currently Okay']].map(([val,name])=>
        '<option value="'+val+'" '+(state.leaderFilter===val?'selected':'')+'>'+name+'</option>').join('')+
      '</select></label></div>'+
      (filtered.length?'<div class="ws-table-wrap"><table class="ws-leader-table"><thead><tr><th>Our hitter</th><th>Observed status</th><th>Assigned target</th><th>Manual duty</th><th>Personal best option</th><th>Actions</th></tr></thead><tbody>'+
      filtered.map(member=>{
        const assigned=positive(cfg.assignments[member.id]),target=state.data.enemies.find(x=>x.id===assigned);
        const best=personalShortlist(member,1)[0];
        const options=['<option value="0">No manual target</option>'].concat(
          state.data.enemies.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(enemy=>
            '<option value="'+enemy.id+'" '+(assigned===enemy.id?'selected':'')+'>'+
            esc(enemy.name)+' ['+enemy.id+'] - '+esc(enemy.status)+'</option>'));
        const status=memberState(member),working=hitterPlanStatus(member.id);
        return '<tr><td data-label="Our hitter">'+infoButton(member.name,member.id)+
          '<br>'+(cfg.blackSkulls[member.id]?pill('Black Skull','good'):'<span class="ws-muted">Regular member</span>')+
          '<br>'+b(cfg.blackSkulls[member.id]?'Remove from Black Skulls':'Add to Black Skulls','black-skill:'+member.id)+'</td>'+
          '<td data-label="Official roster status">'+pill(member.status,status==='okay'?'good':status==='hospital'?'bad':'')+
          '<br><small>'+esc(member.lastAction)+' | '+esc(age(member.lastAt))+'</small></td>'+
          '<td data-label="Assigned target"><select data-leader-target="'+member.id+'" aria-label="Manual target for '+esc(member.name)+'">'+options.join('')+'</select>'+
          '<br><small>'+(target?esc(matchEvidence(member,target).category)+' | '+esc(matchEvidence(member,target).reason):
            assigned?'Target #'+assigned+' not in current roster':'No manual target')+'</small></td>'+
          '<td data-label="Manual duty"><select data-leader-duty="'+member.id+'" aria-label="Manual duty for '+esc(member.name)+'">'+
          hitterPlanStatuses().map(([value,label])=>'<option value="'+value+'" '+(working===value?'selected':'')+'>'+label+'</option>').join('')+
          '</select><br><small>Leadership entry only</small></td>'+
          '<td data-label="Personal option">'+(best?infoButton(best.enemy.name,best.enemy.id)+' '+ffBadge(best.enemy.id)+
            '<br>'+pill(best.category)+
            '<br><small>'+esc(best.reliability)+' | '+esc(best.reason)+'</small>':'No opponents loaded')+'</td>'+
          '<td data-label="Actions">'+b('Personal shortlist','hitter:'+member.id)+
          (target?' '+a('Attack (manual)',attackLink(target.id)):'')+'</td></tr>';
      }).join('')+'</tbody></table></div>':empty('No members match the selected roster filter.'))+
      '<p class="ws-small">A manually marked duty can remain set even after the roster status changes. Verify the current official status; an engaged status here is not confirmation of an attack.</p>');
    html+=card('Leadership notes and briefing',
      '<label>Local war notes<textarea id="ws-leader-note" maxlength="1800" placeholder="Coordination notes, coverage gaps, hospital exits, target priorities...">'+esc(notes)+'</textarea></label>'+
      '<div class="ws-toolbar">'+b('Save leadership notes','save-leader-note')+b('Copy war orders','copy-orders')+
      b('Copy command briefing','copy-leader-brief')+'</div>');
    return html+watchlistPanel();
  }
  function operationalQueue(at=Date.now(),coverageOverride=null){
    const items=[],add=(group,id,priority,title,detail,action,source,dueAt=0)=>{
      if(!items.some(x=>x.id===id))items.push({group,id,priority,title,detail,action,source,dueAt});
    };
    const ownFresh=rosterFresh('ours',at),enemyFresh=rosterFresh('enemies',at);
    const active=activeWarNow();
    if(!effectiveKey())add('now','connect',100,'Connect your Torn API key',
      'Without a valid personal key, war roster and score facts are unavailable.','tab:settings','Connection');
    if(!positive(cfg.ourId))add('now','faction',98,'Detect your faction',
      'Auto-detect your official faction ID from your key.','detect-faction','Torn API');
    if(!positive(cfg.enemyId))add('now','opponent',90,'Choose an opponent',
      'No opposing faction is selected or detected.','tab:settings','Local war setup');
    if(!ownFresh||!enemyFresh)add('now','stale-rosters',96,'Refresh faction rosters',
      'Our roster '+age(state.data.updated.ours)+'; opponent '+age(state.data.updated.enemies)+
      '. Live availability and reliable draft targets are blocked until both are under five minutes old.',
      'refresh','Official roster freshness');
    const accel=active?scoreAcceleration(positive(state.data.war.id),at):null;
    if(accel?.accelerating)add('now','scoring',92,'Opposition scoring rate has accelerated',
      'Enemy pace rose from '+fmt(accel.previousEnemy)+' to '+fmt(accel.recentEnemy)+
      ' points/hour over independently observed windows. Review available hitters.',
      'tab:pace','Observed official scores',accel.observedAt);
    if(active&&ownFresh&&enemyFresh){
      const defence=turtleAssessment(at);
      const pressure=defence.pace?.measurable&&at-defence.pace.last.at<10*MIN&&defence.pace.netRate<-35;
      if(pressure&&defence.exposed>=Math.max(3,Math.ceil(defence.rows.length/3)))
        add('now','review-turtle',82,'Consider coordinated defensive turtling',
          defence.exposed+' members currently Okay while the opponent is gaining ground. '+
          'Balance denying enemy targets with preserving a proven scoring team.',
          'tab:turtle','Observed net pace + fresh faction rosters');
    }
    const plan=leadershipSummary();
    if(active&&ownFresh&&enemyFresh){
      const coverage=coverageOverride||blackSkullsCoverage(at);
      if(!coverage.skulls.length)add('intel','skulls-unset',65,
        'Mark your Black Skulls heavy-hitter squad',
        'No hitters are locally tagged as Black Skulls. Assign squad members before drafting heavy-target coverage.',
        'tab:leader','Local leadership roster');
      if(coverage.unassigned)add('now','heavy-unassigned',91,
        coverage.unassigned+' high-BSS targets without a squad order',
        'Review top-strength opponent priorities. Only verified free Black Skulls can receive a suggested local order.',
        'tab:leader','Known enemy BSS + local orders');
      if(coverage.blocked)add('now','heavy-blocked',93,
        coverage.blocked+' heavy-target order(s) currently blocked',
        'Assigned hitter availability or matchup no longer supports a safe quick recommendation. Review replacements.',
        'tab:leader','Current rosters + verified matchup checks');
      if(coverage.missingEvidence)add('intel','heavy-intel',62,
        coverage.missingEvidence+' uncovered heavy targets need comparative spies',
        'Missing evidence is not a weak target; obtain recent comparable battle stats to identify a suitable hitter.',
        'tab:matchups','Missing verified matchup evidence');
    }
    if(plan.duplicateTargets.length)add('now','double-booked',88,
      'Resolve '+plan.duplicateTargets.length+' duplicate target assignments',
      'The same opponent is assigned to multiple hitters. Review deliberately before updating local orders.',
      'tab:command','Local assignments');
    if(ownFresh){
      const skulls=state.data.ours.filter(p=>cfg.blackSkulls[p.id]&&memberState(p)==='okay');
      const low=skulls.filter(p=>hitterReadiness(p,at).energyEnough===false);
      const unknown=skulls.filter(p=>hitterReadiness(p,at).energyEnough===null);
      if(low.length)add('now','low-energy',76,low.length+' Black Skulls below known attack-energy requirement',
        'Based only on fresh owned/manual energy readings. Check regeneration before assigning an attack.',
        'tab:command','Owned or manual readings');
      if(unknown.length)add('intel','energy-unknown',58,unknown.length+' Black Skulls with unknown energy',
        'Check permitted personal bars or enter a recent manual reading; other members have no automatic energy lookup.',
        'tab:command','Unverified energy');
    }
    if(enemyFresh){
      const interest=watchedTargetIds();
      const hospitals=state.data.enemies.map(p=>enemyHospitalExit(p,at)).filter(Boolean)
        .filter(x=>x.eta>=at&&x.minutes<=90).sort((a,b)=>a.eta-b.eta);
      const near=hospitals.filter(x=>interest.has(x.player.id));
      for(const x of near.slice(0,6))add(x.minutes<=15?'now':'soon','hospital-'+x.player.id,
        x.minutes<=15?89:73,x.player.name+' hospital expiry '+flightCountdown(x.eta,at),
        'Torn roster hospital timer, not confirmation that the player is Okay. Refresh before considering any hit.',
        'player:'+x.player.id,'Official roster status',x.eta);
      const flights=inboundReturns().filter(x=>x.flight.eta&&x.flight.eta>=at&&x.flight.eta-at<=90*MIN)
        .sort((a,b)=>a.flight.eta-b.flight.eta);
      for(const x of flights.filter(x=>interest.has(x.player.id)).slice(0,5)){
        const minutes=Math.ceil((x.flight.eta-at)/MIN);
        add(minutes<=15?'now':'soon','inbound-'+x.player.id,minutes<=15?87:70,
          x.player.name+' inbound ETA '+flightCountdown(x.flight.eta,at),
          'Explicitly inbound from Torn status. Arrival timing is an estimate; do not treat as an attack-ready state.',
          'player:'+x.player.id,'Torn inbound status',x.flight.eta);
      }
      const watchers=state.data.enemies.filter(p=>cfg.watchlist[p.id]).length;
      if(watchers&&!near.length&&!flights.length)add('soon','watchlist',45,
        'Monitor '+watchers+' watched opponents','Your saved watchlist is active. Check status when new roster data arrives.',
        'watched-list','Local watchlist');
    }
    if(ownFresh&&enemyFresh){
      const draft=suggestedDraft(at);
      if(draft.length)add('now','draft',86,draft.length+' strong hitter-target pairs available',
        'Unique provisional matches use favourable comparative manual spies and currently Okay statuses.'+
        ' Preview and review every suggestion before writing local orders.',
        'tab:operations','Manual spy evidence + fresh rosters');
      const noIntel=state.data.ours.filter(p=>cfg.blackSkulls[p.id]&&memberState(p)==='okay'&&
        !positive(cfg.assignments[p.id])&&personalShortlist(p,1)[0]?.tier!==0);
      if(noIntel.length)add('intel','spy-needed',56,noIntel.length+' unassigned Black Skulls need better target evidence',
        'No first-choice, fresh, favourable manual matchup. Request recent comparative spies rather than assuming a high FF means easy.',
        'tab:matchups','Evidence gaps');
      const bad=[];
      for(const p of state.data.ours){
        const target=state.data.enemies.find(e=>e.id===positive(cfg.assignments[p.id]));
        if(!target)continue;
        const x=matchEvidence(p,target);
        if(x.tier>=2)bad.push({p,x});
      }
      if(bad.length)add('now','review-assignments',78,bad.length+' saved manual target orders need review',
        'The latest status or matchup evidence is unavailable, stale or unfavourable. Existing orders are preserved.',
        'tab:command','Local assignments + official roster');
    }
    const unread=Object.values(state.data.afterActions).filter(x=>x.newFromObservedWar&&!x.reviewed);
    if(unread.length)add('intel','debrief',48,unread.length+' new ranked-war debrief(s) to review',
      'Examine actual contributors, score pace and observation coverage for lessons.',
      'tab:afteraction','Official reports + local samples');
    return items.sort((a,b)=>b.priority-a.priority||(a.dueAt||Infinity)-(b.dueAt||Infinity)||a.id.localeCompare(b.id));
  }
  function operationalBrief(at=Date.now()){
    const tasks=operationalQueue(at),groups=[['now','NOW'],['soon','WATCH NEXT'],['intel','INTELLIGENCE GAPS']];
    return 'WarStaxx operations briefing | '+new Date(at).toISOString()+'\n'+
      'War '+(state.data.war?.id||'not active')+' | enemy faction '+(positive(cfg.enemyId)||'unknown')+'\n'+
      'Our roster '+age(state.data.updated.ours)+' | enemy roster '+age(state.data.updated.enemies)+'\n'+
      groups.map(([id,label])=>label+'\n'+tasks.filter(x=>x.group===id).map(x=>
        '- '+x.title+' | '+x.detail+' | '+x.source).join('\n')).join('\n\n')+
      '\n\nInformation is read-only or local. Timers are last observed estimates; no Torn action is performed.';
  }
  function operations(){
    const tasks=operationalQueue(),groups=[
      ['now','Do now','Most important current checks and opportunities'],
      ['soon','Watch next','Estimated status changes; verify again at the time'],
      ['intel','Close information gaps','Get the evidence needed for safer assignments']];
    const draft=suggestedDraft();
    const haveFresh=rosterFresh('ours')&&rosterFresh('enemies');
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">RANKED WAR | ACTIONABLE DECISION SUPPORT</span>'+
      '<h2>Operations: what needs doing now?</h2>'+
      '<p>A prioritised command queue based on official roster freshness, observed score momentum, manual matchup evidence and leadership orders. No unattended polling, automatic attacks or faction chat posting.</p>'+
      '<div class="ws-toolbar">'+b('Refresh official intelligence','refresh')+
      b('Copy operations briefing','copy-ops')+b('Leadership board','tab:command')+
      b('Player matchups','tab:matchups')+'</div></div>'+
      '<div class="ws-grid">'+
      stat('Immediate',fmt(tasks.filter(x=>x.group==='now').length),'Current actions or checks')+
      stat('Watch next',fmt(tasks.filter(x=>x.group==='soon').length),'Forecast, not confirmed availability')+
      stat('Intel gaps',fmt(tasks.filter(x=>x.group==='intel').length),'Missing evidence')+
      stat('Verified draft pairs',fmt(draft.length),haveFresh?'Fresh rosters and recent comparative spies':'Both rosters must be refreshed')+'</div>';
    for(const [id,title,desc] of groups){
      const rows=tasks.filter(x=>x.group===id);
      html+=card(title,'<p>'+desc+'.</p>'+
        (rows.length?rows.slice(0,12).map(x=>
          '<div class="ws-row"><span><b>'+esc(x.title)+'</b><br><small>'+
          esc(x.detail)+'</small><br><small>Source: '+esc(x.source)+
          (x.dueAt&&x.dueAt>Date.now()?' | TCT '+esc(stamp(x.dueAt)):'')+
          '</small></span>'+b('Review',x.action)+'</div>').join(''):
          empty(id==='now'?'No new immediate interventions are evidenced.':
            id==='soon'?'No watched opponents with approaching confirmed roster timers.':
            'No additional actionable gaps in the current sample.')));
    }
    html+=card('Black Skulls | collision-aware draft preview',
      '<p>Unique proposals prioritise getting more hitters a fresh, favourable manual matchup, not reserving the best opponent for the first hitter in the roster. The preview changes nothing in Torn or your saved assignments.</p>'+
      (draft.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Hitter</th><th>Target</th><th>Evidence</th><th>Decision</th></tr></thead><tbody>'+
      draft.map(x=>'<tr><td>'+infoButton(x.friend.name,x.friend.id)+'</td><td>'+
        infoButton(x.enemy.name,x.enemy.id)+' '+ffBadge(x.enemy.id)+'</td><td>'+
        esc(x.evidence||'Current manual spies')+'</td><td>'+
        b('Review matchup','hitter:'+x.friend.id)+' '+b('Save this order','assign:'+x.friend.id+':'+x.enemy.id)+
        '</td></tr>').join('')+'</tbody></table></div>':
        empty(haveFresh?'No unique strong proposals. Confirm battle stats, status and existing orders first.':
          'Drafting is blocked while either roster is missing or older than five minutes.'))+
      '<div class="ws-toolbar">'+b('Draft all '+draft.length+' unique orders locally','draft-black',
        draft.length?'':'disabled')+b('Review manual assignments','tab:command')+'</div>');
    return html+flightWatchPanel();
  }
  function ledger(){
    const id=positive(state.data.war?.id)||positive(latestFinished('ours')?.id);
    const d=warHitLedger(id);
    let h=statusNote()+'<div class="ws-lead"><span class="ws-data-label">PARTIAL OFFICIAL ATTACK FEED</span>'+
      '<h2>Ranked-war hit ledger</h2><p>Real API attack events, filtered by ranked-war flag, opposing faction IDs and official war dates. It is a local sample, not the authoritative total score.</p>'+
      '<div class="ws-toolbar">'+b('Refresh attacks','refresh')+b('Enemy scorers','tab:threats')+
      b('Black Skulls after-action','tab:afteraction')+'</div></div>';
    if(!cfg.enableAttacks)h+=card('Optional attack API permission',
      '<p>Enable the faction attacks selection in Settings to collect hits. Only authorised key scopes can read these records.</p>'+
      b('Settings','tab:settings'));
    if(!d.window)return h+empty('No identified active or past ranked war yet.');
    h+='<div class="ws-grid">'+
      stat('Our sampled attacks',fmt(d.ours.hits),'Partial API records')+
      stat('Enemy sampled attacks',fmt(d.theirs.hits),'Only if incoming attacks are accessible')+
      stat('Our sampled respect',fmt(d.ours.respect),'Not official total')+
      stat('Enemy sampled respect',fmt(d.theirs.respect),'Not official total')+
      stat('Feed freshness',age(d.lastFetch),'Limited to recent attack pages')+
      stat('Verified war events',fmt(d.rows.length),'Faction and time verified')+'</div>';
    let skullContent='<p>These are locally captured hits, not complete war contribution. See official post-war scorecards for definitive totals.</p>';
    if(d.blackSkulls.length){
      skullContent+='<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Black Skull</th><th>Recorded hits</th><th>Recorded respect</th><th>Hospitalised</th><th>Latest</th></tr></thead><tbody>'+
        d.blackSkulls.map(x=>'<tr><td>'+infoButton(x.player.name,x.player.id)+'</td><td>'+
          scoreLabel(x.stats?.hits)+'</td><td>'+scoreLabel(x.stats?.respect)+'</td><td>'+
          scoreLabel(x.stats?.hospitalised)+'</td><td>'+esc(age(x.stats?.lastAt))+'</td></tr>').join('')+
        '</tbody></table></div>';
    }else skullContent+=empty('Mark your Black Skulls in Leadership to display member-specific records.');
    h+=card('Black Skulls | sampled hit contribution',skullContent);
    let rowsHtml=d.rows.length?
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>TCT</th><th>Side</th><th>Attacker</th><th>Defender</th><th>Result</th><th>Respect</th></tr></thead><tbody>'+
      d.rows.slice(0,60).map(x=>'<tr><td>'+esc(stamp(x.at))+'</td><td>'+
        pill(x.side==='ours'?'Ours':'Enemy',x.side==='ours'?'good':'bad')+'</td><td>'+
        infoButton(x.attackerName||('#'+x.attacker),x.attacker)+'</td><td>'+
        infoButton(x.defenderName||('#'+x.defender),x.defender)+'</td><td>'+esc(x.result)+
        '</td><td>'+scoreLabel(x.respect)+'</td></tr>').join('')+'</tbody></table></div>':
      empty('No ranked-war attacks have been collected. This is not proof that neither side attacked.');
    h+=card('Last '+Math.min(60,d.rows.length)+' observed war attacks',
      rowsHtml+'<p class="ws-small">Source: authorised faction attacks API. Paginated and missed records are not reconstructed; official end-of-war reports are authoritative.</p>');
    return h;
  }
  function threats(){
    const rows=enemyThreatRows(),hit=warHitLedger(),fresh=rosterFresh('enemies'),
      live=rows.filter(x=>x.live).length;
    let h=statusNote()+'<div class="ws-lead"><span class="ws-data-label">SCORING THREAT INTELLIGENCE</span>'+
      '<h2>Who is driving enemy war scoring?</h2>'+
      '<p>Prioritise observed incoming ranked-war attacks where available, with clearly labelled prior-war scores when live evidence is missing. No hidden combat strength is inferred.</p>'+
      '<div class="ws-toolbar">'+b('Refresh','refresh')+b('Hospital control','tab:control')+
      b('Score pace','tab:pace')+'</div></div>'+
      '<div class="ws-grid">'+stat('Observed enemy scorers',fmt(live),
      'Verified war attack events in current local cache')+
      stat('Attack feed',cfg.enableAttacks?'Opted in':'Off','Last fetched '+age(hit.lastFetch))+
      stat('Roster',fresh?'Fresh':'Stale','Current status requires fresh official roster')+'</div>';
    let body=rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Enemy</th><th>Recorded hits / respect</th><th>Previous-war score</th><th>Evidence</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
      rows.slice(0,40).map(x=>'<tr><td>'+infoButton(x.player.name,x.player.id)+' '+ffBadge(x.player.id)+'</td>'+
        '<td>'+(x.live?fmt(x.live.scoringHits)+' scoring / '+fmt(x.live.respect):
         x.attempted?fmt(x.attempted.hits)+' attempts, no scored hits':'No scored hits observed')+'</td>'+
        '<td>'+scoreLabel(x.previous?.score)+'</td><td>'+pill(x.confidence)+'</td><td>'+
        pill(x.player.status,fresh&&x.status==='okay'?'good':'')+'</td><td>'+
        b('Hospital control','control-target:'+x.player.id)+' '+
        b(cfg.watchlist[x.player.id]?'Unwatch':'Watch','watch:'+x.player.id)+'</td></tr>').join('')+
        '</tbody></table></div>':empty('No enemy roster yet.');
    body+='<p class="ws-small">Sampled incoming hits may be missing. Historical-only players have not been verified to score in this war. Threat priority is not a win probability.</p>';
    return h+card('Opponent scoring priority | evidence labelled',body);
  }
  function control(){
    const targets=controlTargets(),fresh=rosterFresh('enemies'),threatMap=new Map(enemyThreatRows().map(z=>[z.player.id,z]));
    let h=statusNote()+'<div class="ws-lead"><span class="ws-data-label">BLACK SKULLS | HOSPITAL-CONTROL COORDINATION</span>'+
      '<h2>Keep their high scorers off the board</h2>'+
      '<p>Assign a human watcher to enemy hospital exits, prioritise verified scorers and review hospital timers. A hospital exit is an estimated state change, never a guaranteed attack opportunity.</p>'+
      '<div class="ws-toolbar">'+b('Refresh target status','refresh')+b('Top enemy scorers','tab:threats')+
      b('Quick commander','tab:commander')+'</div></div>'+
      '<div class="ws-grid">'+stat('Tracked opponents',fmt(targets.length),'Watched, assigned, scoring threats or hospitalised')+
      stat('Hospitalised',fmt(targets.filter(x=>x.kind==='hospital').length),'Latest official enemy roster')+
      stat('Upcoming exits',fmt(targets.filter(x=>x.due!==null&&x.due<=20).length),'Observed expiry within 20 minutes')+
      stat('Roster check',fresh?'Fresh':'Stale','Refresh before using any timer')+'</div>';
    const leaders=state.data.ours.filter(p=>cfg.blackSkulls[p.id]);
    const rows=targets.slice(0,30);
    if(!rows.length)return h+empty('Enemy roster has no watched or hospitalised targets. Select opponents in Threats or add them to the watchlist.');
    const body='<div class="ws-table-wrap"><table class="ws-leader-table"><thead><tr><th>Opponent</th><th>Observed state / timer</th><th>Recorded scoring</th><th>Assigned watcher</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(x=>{
        const options=['<option value="0">No watcher</option>'].concat(leaders.map(p=>
          '<option value="'+p.id+'" '+(x.leader===p.id?'selected':'')+'>'+esc(p.name)+'</option>'));
        const threat=threatMap.get(x.p.id);
        return '<tr><td data-label="Opponent">'+infoButton(x.p.name,x.p.id)+' '+ffBadge(x.p.id)+
          '</td><td data-label="Official state">'+pill(x.p.status,x.kind==='hospital'?'bad':'')+
          '<br><small>'+(x.expiry?'Hospital expiry '+esc(stamp(x.expiry))+' | '+flightCountdown(x.expiry):
            'No confirmed hospital expiry')+'</small></td>'+
          '<td data-label="Scoring evidence">'+(threat?.live?
            fmt(threat.live.hits)+' recorded hits / '+fmt(threat.live.respect)+' respect':
            threat?.previous?'Previous report '+fmt(threat.previous.score)+' points':'No player scoring evidence')+
          '</td><td data-label="Local watcher"><select data-control-target="'+x.p.id+'" aria-label="Watcher for '+esc(x.p.name)+'">'+
          options.join('')+'</select><small>Manual coordination only</small></td>'+
          '<td data-label="Actions">'+b(cfg.watchlist[x.p.id]?'Unwatch':'Watch','watch:'+x.p.id)+' '+
          a('Profile',link(x.p.id))+
          (x.kind==='okay'&&fresh?' '+a('Attack manually',attackLink(x.p.id)):'')+'</td></tr>';
      }).join('')+'</tbody></table></div>';
    h+=card('Opponent hospital-control watchboard',body+
      '<p class="ws-small">Assigning a watcher only records an instruction on this device. WarStaxx does not perform hospital locks, announce a successful hit, or access teammates personal energy data.</p>');
    if(state.controlFocus&&targets.some(x=>x.p.id===state.controlFocus)){
      const item=targets.find(x=>x.p.id===state.controlFocus);
      h+=card('Focused opponent | '+esc(item.p.name),
        '<p>Observed state: '+esc(item.p.status)+
        (item.expiry?' | hospital expiry '+esc(stamp(item.expiry)):'')+
        ' | Roster '+esc(age(state.data.updated.enemies))+'</p>'+
        b('Open player intel','player:'+item.p.id)+' '+b('Watch','watch:'+item.p.id));
    }
    return h;
  }
  function turtle(){
    const x=turtleAssessment(),p=x.plan,windowPlan=turtleWindow();
    let h=statusNote()+'<div class="ws-lead"><span class="ws-data-label">DEFENSIVE RANKED-WAR PLAN | TURTLING</span>'+
      '<h2>Protect points by denying enemy attacks</h2>'+
      '<p>Turtling means deliberately limiting exposed faction members while a smaller, proven hitting team seeks reliable points. Set a posture locally; this tool never starts flights, uses medical items, toggles revives or attacks.</p>'+
      '<div class="ws-toolbar">'+b('Refresh roster','refresh')+b('Phone commander','tab:commander')+
      b('Black Skulls targets','tab:matchups')+'</div></div>'+
      '<div class="ws-grid">'+
      stat('Exposed (Okay)',x.ownFresh?fmt(x.exposed):'Unknown','May be hittable; official current status')+
      stat('Hospital / flight / jail',x.ownFresh?fmt(x.sheltered):'Unknown','Airborne only; abroad after landing is NOT counted protected')+
      stat('Unknown coverage',fmt(x.unclear),'Missing or stale roster state')+
      stat('Expiries within 15m',x.ownFresh?fmt(x.dueSoon):'Unknown','Time-limited Torn roster statuses')+'</div>';
    h+=card('Recommended self-hospital window | manual',
      '<p><b>Suggested coverage:</b> '+
      (windowPlan.minutes===null?'Unavailable / hitter exemption':windowPlan.minutes+' minutes')+
      '</p><p>'+esc(windowPlan.advice)+'</p><p>'+esc(windowPlan.reason)+
      '</p><p><b>Observed hospital remaining:</b> '+windowPlan.remaining+'m | '+
      '<b>Additional desired cover:</b> '+(windowPlan.shortfall===null?'Unknown':windowPlan.shortfall+'m')+
      '</p><p class="ws-small">A suggested coordination window, not a guaranteed medicine duration. '+
      'Ipecac can cause around 60-90m in hospital; stock, compatibility, medical cooldown and Torn rules apply.</p>'+
      b('Find turtle item','fast-turtle'));
    if(x.reviveWarnings)h+=card('Revive exposure warning',
      '<p>'+fmt(x.reviveWarnings)+' hospitalised member(s) currently appear revivable. If your faction intends to turtle in hospital, coordinate revive settings and hospital exits in Torn. WarStaxx will not change revival permissions.</p>');
    h+=card('War clock and net-score pressure',
      '<div class="ws-inline-metrics"><span>Elapsed '+(x.elapsedHours===null?'Unknown':fmt(x.elapsedHours)+' hours')+
      '</span><span>Target stage '+esc(x.decayPhase)+'</span><span>Official net score '+
      (x.score?fmt(x.score.net):'Unknown')+'</span><span>Target from API '+
      scoreLabel(x.score?.target)+'</span></div>'+
      '<p>The ranked-war target begins reducing by 1% of the ORIGINAL target per hour after 24 hours, according to the Torn wiki. This tool does not reconstruct that original target or claim a precise victory forecast. Turtling may deny score but it also delays your own progress.</p>'+
      a('Check official ranked-war rules','https://wiki.torn.com/wiki/Ranked_War'));
    h+=card('Choose a coordinated team posture',
      '<p><b>Current:</b> '+pill(p.mode==='full'?'Full turtle':p.mode==='defensive'?'Defensive':'Balanced')+
      '. This is a local leadership instruction, not an automated game state.</p>'+
      '<div class="ws-toolbar">'+
      [['balanced','Balanced','Strike with reliable hitters, protect vulnerable members'],
       ['defensive','Defensive','Limit exposure; prioritise strong hit windows'],
       ['full','Full turtle','Maximum defensive coordination; still track how to gain points']].map(([mode,label])=>
        b(label,'turtle-mode:'+mode,p.mode===mode?'disabled':'')).join('')+
      '</div><p class="ws-note">'+esc(x.suggestion)+'</p>'+
      '<p class="ws-small">Net-score objective: preserving a lead does not guarantee winning, and full turtling can prevent your own side from reaching the target. Compare live score, enemy pace and available hitters before changing posture.</p>');
    let rows='<div class="ws-table-wrap"><table class="ws-leader-table"><thead><tr><th>Our member</th><th>Observed status</th><th>Local duty</th><th>Expiry / warning</th><th>Actions</th></tr></thead><tbody>'+
      x.rows.slice().sort((a,b)=>Number(b.danger)-Number(a.danger)||Number(b.approaching)-Number(a.approaching)||a.p.id-b.p.id)
      .map(z=>'<tr><td data-label="Our member">'+infoButton(z.p.name,z.p.id)+
        (cfg.blackSkulls[z.p.id]?' '+pill('Black Skull','good'):'')+'</td>'+
        '<td data-label="Official status">'+pill(z.observed,z.danger?'bad':z.cover?'good':'')+
        '<br><small>'+esc(z.p.lastAction||'Unknown')+'</small></td>'+
        '<td data-label="Local defensive duty"><select data-turtle-duty="'+z.p.id+'">'+
        [['auto','Not assigned'],['strike','Reliable hitter'],['turtle','Defensive turtle'],['reserve','Reserve / return window']].map(([v,label])=>
          '<option value="'+v+'" '+(z.assigned===v?'selected':'')+'>'+label+'</option>').join('')+
        '</select></td><td data-label="Expiry / risk">'+
        (z.expiry&&z.expiry>Date.now()?esc(stamp(z.expiry))+' | '+flightCountdown(z.expiry):
         z.danger?'Currently Okay and potentially targetable':'No known near-term expiry')+
        '</td><td data-label="Actions">'+b('Review readiness','tab:command')+'</td></tr>').join('')+
      '</tbody></table></div>';
    h+=card('Member-by-member defensive assignments',rows+
      '<p class="ws-small">Turtle duty labels are explicitly manual. Marking someone as turtling does not mean Torn reports them protected; the adjacent official status is the source of truth.</p>');
    h+=card('Turtling methods | manual planning checklist',
      '<div class="ws-row"><span><b>Flights</b><br><small>Air travel can make a member inaccessible while airborne. Plan destination, return window and reconnection; being abroad after landing is not guaranteed protection.</small></span>'+
      a('Travel agency','https://www.torn.com/travelagency.php')+'</div>'+
      '<div class="ws-row"><span><b>Self-hospitalisation</b><br><small>Incompatible blood bags or Ipecac can create temporary defensive hospital time where allowed. Verify education, medical cooldown and available inventory; players choose and use items manually.</small></span>'+
      a('Hospital','https://www.torn.com/hospitalview.php')+'</div>'+
      '<div class="ws-row"><span><b>Revive coordination</b><br><small>Unexpected revives, med-outs and hospital expiry can expose a member. Review revivable state and keep the chosen team posture coordinated.</small></span>'+
      b('Readiness','tab:command')+'</div>'+
      '<div class="ws-row"><span><b>Emergency backups</b><br><small>Bounties, mercenary hospitalisations and prepared in-game devices have costs and timing trade-offs. Treat them as manual contingency plans, not guaranteed protection.</small></span>'+
      b('Operations','tab:operations')+'</div>'+
      '<p class="ws-small">Community strategy reference: Torn forum Neat Turtling Guide (8 April 2026). Verify game rules and time windows before using any method. No item is purchased or consumed by WarStaxx.</p>'+
      '<div class="ws-toolbar">'+b('Live score / net target','tab:pace')+
      b('Copy leadership briefing','copy-leader-brief')+'</div>');
    return h;
  }
  function commander(){
    const score=warScore(),pace=warPace(),lead=leadershipSummary(),
      t=turtleAssessment(),threat=enemyThreatRows().slice(0,3),
      tasks=operationalQueue().slice(0,4),ours=state.data.ours.filter(p=>
        state.commanderFilter==='all'||cfg.blackSkulls[p.id]);
    let h=statusNote()+'<div class="ws-lead"><span class="ws-data-label">PHONE FIRST | TACTICAL COMMAND</span>'+
      '<h2>War commander</h2><p>Read the score, check top threats and issue local duties without opening multiple large tables. Source freshness is shown; actions are always manual.</p>'+
      '<div class="ws-toolbar">'+b('Refresh','refresh')+b('Turtling','tab:turtle')+
      b('Hospital control','tab:control')+b('Hit ledger','tab:ledger')+'</div></div>'+
      '<div class="ws-grid">'+
      stat('Official war score',score?fmt(score.our)+' / '+fmt(score.enemy):'Unknown','Ours / enemy')+
      stat('Net advantage',score?fmt(score.net):'Unknown','Official sampled score')+
      stat('Observed enemy pace',pace?.measurable?fmt(pace.rateEnemy)+'/h':'Unknown','Requires timed samples')+
      stat('Black Skulls Okay',lead.skullReady+' / '+lead.skulls,'Roster '+age(state.data.updated.ours))+
      stat('Exposed members',t.ownFresh?fmt(t.exposed):'Unknown','Current Okay status')+
      stat('Turtle posture',t.plan.mode,'Local leadership choice')+'</div>';
    h+=card('Immediate commander attention',
      tasks.length?tasks.map(x=>'<div class="ws-row"><span><b>'+esc(x.title)+'</b>'+
        '<br><small>'+esc(x.detail)+'</small></span>'+b('Review',x.action)+'</div>').join(''):
        empty('No immediate tasks evidenced in the current sample.'));
    h+=card('Enemy scorers to monitor',
      threat.length?threat.map(x=>'<div class="ws-row"><span>'+infoButton(x.player.name,x.player.id)+
        ' '+ffBadge(x.player.id)+'<br><small>'+esc(x.source)+' | '+esc(x.player.status)+
        '</small></span>'+b('Control','control-target:'+x.player.id)+'</div>').join(''):
        empty('No opponents have been loaded.'));
    h+=card('Black Skulls quick actions',
      '<div class="ws-toolbar">'+b(state.commanderFilter==='all'?'Black Skulls only':'Show all members','commander-filter')+
      b('Full Leadership','tab:command')+'</div>'+
      (ours.length?ours.slice(0,20).map(p=>{
        const selected=state.data.enemies.find(e=>e.id===positive(cfg.assignments[p.id]));
        const best=personalShortlist(p,1)[0],read=hitterReadiness(p),kind=memberState(p);
        return '<div class="ws-commander-member"><div><b>'+esc(p.name)+'</b> '+
          pill(p.status,kind==='okay'?'good':'')+
          '<small>Energy: '+(read.energy===null?'unknown':fmt(read.energy)+' E')+
          ' | duty '+esc(hitterPlanStatus(p.id))+'</small><small>Target: '+
          (selected?esc(selected.name)+' (manual)':best?esc(best.enemy.name)+' ('+esc(best.category)+')':'not chosen')+
          '</small></div><div class="ws-toolbar">'+b('Matchup','hitter:'+p.id)+
          (selected?a('Attack',attackLink(selected.id)):'')+
          b('Defence','tab:turtle')+'</div></div>';
      }).join(''):empty('No Black Skulls roster members yet. Mark them in Leadership.')));
    return h;
  }





  // Enemy scored attacks against our members count toward their faction's
  // ranked-war score, not deductions from the defender's personal score.

  // Respect earned on enemy ranked-war hits is score gained against our faction.
  // The attack IDs and defender IDs are from the official Torn faction attack feed.
  function concessionRecord(warId,create=false){
    const w=warAttackWindow(warId),key=String(positive(warId));
    if(!w||!positive(w.ourId)||!positive(w.enemyId)||!positive(Math.floor(w.start/1000)))return null;
    let rec=state.data.concededWars[key];
    if(rec&&(rec.version!==2||positive(rec.ourId)!==w.ourId||positive(rec.enemyId)!==w.enemyId||
        n(rec.start)!==w.start))rec=null;
    if(!rec&&create){
      rec={version:2,warId:positive(warId),ourId:w.ourId,enemyId:w.enemyId,start:w.start,
        cursor:Math.max(0,Math.floor(w.start/1000)-1),seen:{},byMember:{},byAttacker:{},
        total:0,rows:0,ourTotal:0,ourRows:0,fetches:0,lastFetch:0,caughtUpAt:0,complete:false,error:''};
      state.data.concededWars[key]=rec;
    }
    return rec||null;
  }
  // One deduplicated, chronological feed covers BOTH sides of the current war.
  // Torn attack respect is an observed score proxy; the final official scorecard
  // is authoritative after the war. Uncaptured history must never become zero.
  function captureConcessionAttacks(rec,records){
    if(!rec)return 0;
    const w=warAttackWindow(rec.warId);
    if(!w||w.start!==n(rec.start))return 0;
    let added=0;
    for(const a of records){
      if(!positive(a.id)||rec.seen[a.id]||a.ranked!==true||
        !n(a.at)||a.at<w.start||a.at>w.end+60000)continue;
      const againstUs=a.attackerFaction===w.enemyId&&a.defenderFaction===w.ourId&&positive(a.defender);
      const forUs=a.attackerFaction===w.ourId&&a.defenderFaction===w.enemyId&&positive(a.attacker);
      if(!againstUs&&!forUs)continue;
      rec.seen[a.id]=1;added++;
      const points=officialNumber(a.respect);
      if(forUs){
        rec.ourRows++;
        const hitter=rec.byAttacker[a.attacker]||
          (rec.byAttacker[a.attacker]={id:a.attacker,attacks:0,scoringAttacks:0,ourScore:0,lastAt:0});
        hitter.attacks++;
        if(points!==null&&points>0){hitter.scoringAttacks++;hitter.ourScore+=points;rec.ourTotal+=points;}
        hitter.lastAt=Math.max(n(hitter.lastAt),a.at);
      }else{
        rec.rows++;
        const defender=rec.byMember[a.defender]||
          (rec.byMember[a.defender]={id:a.defender,attacks:0,scoringAttacks:0,enemyScore:0,
            lastAt:0,hitTimes:[]});
        defender.attacks++;
        if(points!==null&&points>0){defender.enemyScore+=points;defender.scoringAttacks++;rec.total+=points;}
        defender.lastAt=Math.max(n(defender.lastAt),a.at);
        // Retain only a few recent attack timestamps for pressure alerts.
        defender.hitTimes=(Array.isArray(defender.hitTimes)?defender.hitTimes:[])
          .concat(a.at).sort((a,b)=>a-b).slice(-30);
      }
    }
    return added;
  }
    function concessionSnapshot(warId=positive(state.data.war?.id),at=Date.now()){
    const rec=concessionRecord(warId,false);
    if(!rec||!rec.fetches)return null;
    const active=positive(state.data.war?.id)===positive(warId);
    // Complete means all pages scanned from war start through a recent fetch.
    // It is not a claim that the live opponent score can no longer change.
    const complete=Boolean(rec.complete&&rec.caughtUpAt&&
      (!active||at-n(rec.caughtUpAt)<2*MIN));
    return {known:true,partial:!complete,complete,byMember:rec.byMember,byAttacker:rec.byAttacker,
      rows:rec.rows,total:rec.total,ourRows:rec.ourRows,ourTotal:rec.ourTotal,
      lastFetch:rec.lastFetch,caughtUpAt:rec.caughtUpAt,
      error:String(rec.error||''),warId:rec.warId};
  }
  async function refreshWarConcessions(force=false){
    if(cfg.autoConceded===false||!activeWarNow()||
       (!isNativeWarPage()&&!state.open)||!positive(cfg.ourId)||!effectiveKey()||
       state.concededBusy||!canCall('concessions',force?0:40*1000))return;
    const w=warAttackWindow(state.data.war.id),rec=concessionRecord(state.data.war.id,true);
    if(!w||!rec)return;
    state.concededBusy=true;
    try{
      if(!rec.fetches)captureConcessionAttacks(rec,warAttackRows(w.id));
      // A maximum of three API pages per refresh catches up active wars without
      // flooding Torn. Each page advances an inclusive, deduplicated cursor.
      for(let page=0;page<3;page++){
        const from=Math.max(Math.floor(w.start/1000)-1,n(rec.cursor)),
          to=Math.floor(Date.now()/1000);
        const response=await call('/faction/attacks?limit=100&sort=ASC&from='+from+'&to='+to,
          'concessions',0);
        if(!response)break;
        const source=parseArray(unpack(response,'attacks')),parsed=attacks(response);
        captureConcessionAttacks(rec,parsed);
        rec.fetches++;rec.lastFetch=Date.now();rec.error='';
        if(source.length<100){
          rec.cursor=to;rec.complete=true;rec.caughtUpAt=rec.lastFetch;
          break;
        }
        const highest=Math.max(0,...parsed.map(a=>Math.floor(a.at/1000)));
        if(highest<=from){
          rec.complete=false;
          rec.error='Attack pagination did not advance. Totals remain partial.';
          break;
        }
        rec.cursor=highest;rec.complete=false;
      }
      for(const key of Object.keys(state.data.concededWars)
        .sort((a,b)=>n(state.data.concededWars[b]?.lastFetch)-n(state.data.concededWars[a]?.lastFetch))
        .slice(4))delete state.data.concededWars[key];
      save();
    }catch(e){
      rec.error=String(e.message||e).slice(0,150);
      save();
    }finally{state.concededBusy=false;}
  }

  function liveWarMemberImpact(memberId,warId=positive(state.data.war?.id),at=Date.now()){
    const id=positive(memberId),data=concessionSnapshot(warId,at),
      incoming=data?.byMember?.[id]||null,outgoing=data?.byAttacker?.[id]||null,
      complete=data?.complete===true,known=Boolean(data?.known);
    const earned=known&&(complete||outgoing)?n(outgoing?.ourScore):null,
      given=known&&(complete||incoming)?n(incoming?.enemyScore):null,
      hits=known&&(complete||incoming)?n(incoming?.scoringAttacks):null,
      attacks=known&&(complete||incoming)?n(incoming?.attacks):null,
      ownHits=known&&(complete||outgoing)?n(outgoing?.attacks):null,
      net=earned!==null&&given!==null?earned-given:null;
    const times=Array.isArray(incoming?.hitTimes)?incoming.hitTimes:[],
      in30=times.filter(t=>t>=at-30*MIN&&t<=at+MIN).length,
      in60=times.filter(t=>t>=at-60*MIN&&t<=at+MIN).length,
      underFire=in30>=3||in60>=5;
    const enemyScore=positive(state.data.war?.id)===positive(warId)?warScore()?.enemy:null;
    // Score share is observed attack respect / official live enemy score, not
    // an official member-specific war score. Reject inconsistent >100% shares.
    const share=given!==null&&enemyScore!==null&&enemyScore!==undefined&&enemyScore>0&&
      given<=enemyScore*1.0001?100*given/enemyScore:null;
    return {id,known,complete,partial:!complete,earned,given,hits,attacks,ownHits,net,
      share,in30,in60,underFire,lastAt:n(incoming?.lastAt),
      lastFetch:n(data?.lastFetch),error:String(data?.error||'')};
  }

    function inboundWarImpact(warId=positive(state.data.war?.id)){
    const captured=concessionSnapshot(warId);
    if(captured)return captured;
    const rows=warAttackRows(warId).filter(a=>a.side==='enemies'),
      known=rows.length>0,
      byMember={},safePoints=a=>officialNumber(a.respect)!==null?
        Math.max(0,n(a.respect)):0;
    for(const a of rows){
      if(!positive(a.defender))continue;
      const id=positive(a.defender),row=byMember[id]||
        (byMember[id]={id,attacks:0,scoringAttacks:0,enemyScore:0,
          lastAt:0,source:'Captured enemy ranked-war attacks'});
      row.attacks++;
      if(safePoints(a)>0){row.scoringAttacks++;row.enemyScore+=safePoints(a);}
      row.lastAt=Math.max(row.lastAt,n(a.at));
    }
    return {known,partial:true,byMember,rows:rows.length,
      total:rows.reduce((sum,a)=>sum+safePoints(a),0)};
  }
  // Per-war role snapshot prevents past reports changing when local tags change.
  function snapshotWarSquads(warId=positive(state.data.war?.id),at=Date.now()){
    if(!positive(warId)||!state.data.ours?.length)return null;
    const key=String(warId),db=state.data.squadSnapshots||
      (state.data.squadSnapshots={}),prev=db[key]||{},
      ids=state.data.ours.map(p=>positive(p.id)),
      skullIds=ids.filter(id=>cfg.blackSkulls[id]===true);
    db[key]={warId,at,memberIds:ids,blackSkullIds:skullIds,
      source:'Local Black Skulls tags observed during this war',firstAt:prev.firstAt||at};
    for(const old of Object.keys(db).sort((a,b)=>n(db[b].at)-n(db[a].at)).slice(30))
      delete db[old];
    return db[key];
  }
  function warSquadSnapshot(warId){
    const snap=state.data.squadSnapshots?.[String(positive(warId))]||null;
    if(snap?.memberIds?.length)return {
      black:new Set((snap.blackSkullIds||[]).map(positive).filter(Boolean)),
      source:snap.source||'Local squad tags observed during war',observedAt:snap.at,
      historical:true};
    return {black:new Set(Object.keys(cfg.blackSkulls)
      .filter(id=>cfg.blackSkulls[id]).map(positive)),
      source:'CURRENT local Black Skulls tags (no in-war snapshot)',
      observedAt:0,historical:false};
  }
  function squadWarSummary(warId,side){
    const snap=warSquadSnapshot(warId),source='Official completed-war scorecards',
      report=state.data.reports[String(positive(warId))]
        ?.factions?.find(x=>positive(x.id)===positive(cfg.ourId)),
      members=report?.members||[],
      selected=members.filter(p=>(side==='black')===snap.black.has(positive(p.id))),
      inbound=inboundWarImpact(warId),known=Boolean(report),
      ids=new Set(selected.map(p=>positive(p.id)));
    const points=known?selected.reduce((sum,p)=>sum+n(p.score),0):null,
      attacks=known?selected.reduce((sum,p)=>sum+n(p.attacks),0):null,
      received=known&&inbound.known?
        Object.values(inbound.byMember).filter(p=>ids.has(p.id))
          .reduce((sum,p)=>sum+p.enemyScore,0):null;
    return {side,warId,source:known?source:'Official member scorecard unavailable',
      squadSource:snap.source,members:known?selected.length:null,points,attacks,
      perHit:attacks?points/attacks:null,enemyPointsReceived:received,
      netProxy:points!==null&&received!==null?points-received:null,
      incomingPartial:inbound.known,
      rows:selected.slice().sort((a,b)=>n(b.score)-n(a.score)).map(p=>({
        id:p.id,name:p.name,score:officialNumber(p.score),
        attacks:officialNumber(p.attacks),
        received:inbound.known&&(inbound.complete||inbound.byMember[p.id])?inbound.byMember[p.id]?.enemyScore||0:null,
        incomingHits:inbound.known&&(inbound.complete||inbound.byMember[p.id])?inbound.byMember[p.id]?.scoringAttacks||0:null
      }))};
  }

  // Only capture opponent BSS near the attack, while both rosters are fresh.
  // Do not reconstruct old enemy strength using today's stats.
  function captureAttackBssObservations(at=Date.now()){
    if(!activeWarNow()||!rosterFresh('ours',at)||!rosterFresh('enemies',at))return 0;
    const id=positive(state.data.war?.id),db=state.data.attackBssSnapshots||
      (state.data.attackBssSnapshots={}),enemyById=new Map(
        state.data.enemies.map(p=>[p.id,p])),ourIds=new Set(
        state.data.ours.map(p=>p.id));
    let added=0;
    for(const a of warAttackRows(id)){
      if(a.side!=='ours'||!positive(a.id)||db[String(a.id)]||
        !ourIds.has(a.attacker)||!enemyById.has(a.defender)||
        !n(a.at)||a.at>at||at-a.at>6*HOUR||
        officialNumber(a.respect)===null)continue;
      const estimate=enemyBattleEstimate(enemyById.get(a.defender));
      if(estimate.value===null||estimate.value<=0)continue;
      db[String(a.id)]={id:a.id,warId:id,hitterId:a.attacker,targetId:a.defender,
        targetBss:estimate.value,source:estimate.source,
        respect:Math.max(0,n(a.respect)),chain:n(a.chain),
        chainBonus:officialNumber(a.chainBonus),
        specialBonus:Boolean(a.specialBonus),
        modifierWar:officialNumber(a.modifierWar),
        modifierRetaliation:officialNumber(a.modifierRetaliation),
        modifierGroup:officialNumber(a.modifierGroup),
        modifierOverseas:officialNumber(a.modifierOverseas),
        attackAt:n(a.at),observedAt:at};
      added++;
    }
    for(const [key] of Object.entries(db).sort((a,b)=>n(b[1].observedAt)-n(a[1].observedAt)).slice(900))
      delete db[key];
    return added;
  }
  function normalizedSimilarHit(sample){
    if(!sample||!Number.isFinite(Number(sample.targetBss))||n(sample.targetBss)<=0||
      !Number.isFinite(Number(sample.respect))||n(sample.respect)<0||
      sample.specialBonus||chainMilestones.includes(n(sample.chain))||
      sample.modifierRetaliation!==null&&sample.modifierRetaliation!==undefined&&
        sample.modifierRetaliation!==1||
      sample.modifierGroup!==null&&sample.modifierGroup!==undefined&&
        sample.modifierGroup!==1||
      sample.modifierOverseas!==null&&sample.modifierOverseas!==undefined&&
        sample.modifierOverseas!==1||
      sample.modifierWar!==null&&sample.modifierWar!==undefined&&
        sample.modifierWar!==2)return null;
    const chain=n(sample.chain),apiScale=n(sample.chainBonus),
      scale=chain>=10?(apiScale>=1&&apiScale<=2.1?apiScale:
        Math.max(1,.25*Math.log10(chain)+.75)):1;
    return {bss:n(sample.targetBss),respect:n(sample.respect)/scale,
      warId:positive(sample.warId),source:String(sample.source||'BSS recorded near attack')};
  }
  function similarStrengthPerformance(memberId,warId=positive(state.data.war?.id)){
    const id=positive(memberId),currentWar=positive(warId),
      all=Object.values(state.data.attackBssSnapshots||{})
        .filter(x=>positive(x.hitterId)===id&&
          positive(x.warId)>0&&n(x.attackAt)>0&&
          n(x.observedAt)>=n(x.attackAt)&&
          n(x.observedAt)-n(x.attackAt)<=6*HOUR)
        .map(normalizedSimilarHit).filter(Boolean),
      current=all.filter(x=>x.warId===currentWar).sort((a,b)=>a.bss-b.bss),
      priorIds=new Set((state.data.ourWars||[])
        .filter(w=>n(w.end)>0&&positive(w.id)!==currentWar)
        .sort((a,b)=>n(b.end)-n(a.end)).slice(0,3).map(w=>positive(w.id))),
      baseline=all.filter(x=>priorIds.has(x.warId));
    const reference=current.length?current[Math.floor(current.length/2)].bss:null;
    const comparable=x=>reference!==null&&x.bss>=reference*0.75&&
      x.bss<=reference*1.25,
      now=current.filter(comparable),before=baseline.filter(comparable),
      priorWars=new Set(before.map(x=>x.warId)).size,
      mean=a=>a.length?a.reduce((z,x)=>z+x.respect,0)/a.length:null,
      actual=mean(now),historical=mean(before),
      enough=now.length>=3&&before.length>=3&&priorWars>=2&&historical>0,
      ratio=enough?actual/historical:null,
      label=reference===null?'No time-stamped current target BSS evidence':
        !enough?'Not enough comparable attacks across two previous wars':
        ratio<0.70?'Below similar-strength historical pace':
        ratio>=1.15?'Above similar-strength historical pace':'Similar to previous comparable fights';
    return {memberId:id,warId:currentWar,referenceBss:reference,currentSamples:now.length,
      historicalSamples:before.length,priorWars,actual,historical,ratio,
      flag:ratio!==null&&ratio<0.7,label,
      source:'Captured attacks matched to opponent BSS observed within 6h; +/-25% BSS band',
      metric:'Chain-normalised captured respect per recorded attack, not official war score'};
  }
  function ownHistoricalEfficiency(memberId,excludeWar=0){
    const list=state.data.ourWars.filter(w=>w.end&&positive(w.id)!==positive(excludeWar))
      .sort((a,b)=>n(b.end)-n(a.end));
    const samples=[];
    for(const w of list){
      const member=state.data.reports[String(w.id)]?.factions
        ?.find(x=>x.id===positive(cfg.ourId))?.members?.find(x=>x.id===positive(memberId));
      if(!member||officialNumber(member.score)===null||
        officialNumber(member.attacks)===null||member.attacks<3)continue;
      samples.push({warId:w.id,score:n(member.score),attacks:n(member.attacks),
        ratio:n(member.score)/n(member.attacks)});
      if(samples.length===3)break;
    }
    const points=samples.reduce((z,x)=>z+x.score,0),
      attacks=samples.reduce((z,x)=>z+x.attacks,0);
    return {samples:samples.length,history:samples,
      perHit:attacks?points/attacks:null};
  }
  function memberPerformance(player,warId=positive(state.data.war?.id)){
    if(!player||!positive(warId))return null;
    const report=state.data.reports[String(warId)]?.factions
        ?.find(x=>x.id===positive(cfg.ourId))?.members?.find(p=>p.id===positive(player.id)),
      impact=liveWarMemberImpact(player.id,warId),
      ledger=warHitLedger(warId).ours.players[positive(player.id)]||null,
      source=report?'Official completed-war report':impact.earned!==null?'Captured ranked-war attacks':
        ledger?'Partial captured attack feed':'Unknown',
      hits=report?officialNumber(report.attacks):impact.ownHits??ledger?.hits??null,
      points=report?officialNumber(report.score):impact.earned??ledger?.respect??null,
      incoming=inboundWarImpact(warId),
      received=incoming.known?incoming.byMember[positive(player.id)]||null:null,
      enemyPointsReceived=incoming.known&&(incoming.complete||received)?received?.enemyScore||0:null,
      enemyScoringHits=incoming.known&&(incoming.complete||received)?received?.scoringAttacks||0:null,
      base=ownHistoricalEfficiency(player.id,warId),
      perHit=hits&&points!==null?points/hits:null;
    let status='Insufficient comparable evidence',ratio=null;
    if(base.samples>=2&&hits!==null&&hits>=5&&perHit!==null&&base.perHit!==null&&base.perHit>0){
      ratio=perHit/base.perHit;
      status=ratio<0.7?'Below own historical points per attack':
        ratio>=1.15?'Above own historical average':
          'In line with own historical average';
    }
    return {player,hits,points,enemyPointsReceived,enemyScoringHits,
      share:impact.share,underFire:impact.underFire,recentIncoming:impact.in30,
      netProxy:points!==null&&enemyPointsReceived!==null?points-enemyPointsReceived:null,
      inboundSource:incoming.known?'Partial captured enemy attack feed':'Inbound history unavailable',
      perHit,baseline:base.perHit,priorWars:base.samples,
      ratio,status,source,limited:!report,flag:ratio!==null&&ratio<0.7};
  }
  function performanceLeaderboard(warId=positive(state.data.war?.id)){
    return state.data.ours.map(p=>memberPerformance(p,warId))
      .filter(Boolean).sort((a,b)=>(b.points??-1)-(a.points??-1)||
        (b.perHit??-1)-(a.perHit??-1)||a.player.id-b.player.id);
  }
  function bonusHitRecommendation(){
    const chain=chainStatus(),self=ourWarReadiness();
    if(!activeWarNow()||!chain.fresh||chain.nextIn===null||
      chain.nextIn<1||chain.nextIn>3||self.kind!=='okay'||
      !self.player||!rosterFresh('enemies'))return null;
    const band=enemyRoleBands(),candidates=state.data.enemies
      .filter(enemy=>memberState(enemy)==='okay'&&roleAllows(self.player,enemy,band))
      .map(enemy=>({enemy,evidence:roleMatch(self.player,enemy,band),
        strength:enemyBattleEstimate(enemy)}))
      .filter(x=>x.evidence)
      .sort((a,b)=>
        Number(b.evidence.encounters.wins>0)-Number(a.evidence.encounters.wins>0)||
        a.evidence.match.ratio-b.evidence.match.ratio||
        n(b.enemy.level)-n(a.enemy.level));
    return {chain,target:candidates[0]||null,available:candidates.length,
      reason:'Reserve a verified in-war target; the milestone hit must defeat an opponent in the rival faction.'};
  }



  function squadReportText(warId,side){
    const report=squadWarSummary(warId,side),
      name=side==='black'?'Black Skulls | Skull Capo':'Regular faction members';
    return 'WarStaxx '+name+' report - war #'+warId+'\n'+
      'Membership source: '+report.squadSource+'\n'+
      'Official score source: '+report.source+'\n'+
      'Points earned: '+(report.points??'Unknown')+
      ' | Official attacks: '+(report.attacks??'Unknown')+
      ' | Points per attack: '+(report.perHit===null?'Unknown':report.perHit.toFixed(2))+'\n'+
      'Enemy score gained by attacking this squad (PARTIAL CAPTURE): '+
      (report.enemyPointsReceived??'Unknown')+'\n'+
      'Earned - enemy score conceded (PROXY): '+(report.netProxy??'Unknown')+'\n'+
      report.rows.map(p=>p.name+' ['+p.id+'] | earned '+(p.score??'Unknown')+
        ' | own attacks '+(p.attacks??'Unknown')+
        ' | enemy points on this member '+(p.received??'Unknown (not captured)')+
        ' | captured incoming scoring hits '+(p.incomingHits??'Unknown')).join('\n')+'\n'+
      (side==='black'?'SIMILAR-STRENGTH OPPONENTS (partial, chain-normalised respect per captured attempt):\n'+
        report.rows.map(p=>{
          const x=similarStrengthPerformance(p.id,warId);
          return p.name+' ['+p.id+'] | median target BSS '+(x.referenceBss??'unknown')+
            ' | current '+(x.actual===null?'unknown':x.actual.toFixed(2))+
            ' ('+x.currentSamples+' attempts) | past '+(x.historical===null?'unknown':x.historical.toFixed(2))+
            ' ('+x.historicalSamples+' attempts, '+x.priorWars+' wars) | '+x.label;
        }).join('\n')+'\n':'')+
      'Enemy points conceded are not deductions from player points. Incoming feed may be incomplete.';
  }
  function squadReportCard(warId,side){
    const data=squadWarSummary(warId,side),label=side==='black'?
      'Black Skulls | heavy-hitter war report':'Regular members | war report';
    return card(label,
      '<p><b>Group:</b> '+esc(label)+' | <b>Group evidence:</b> '+
      esc(data.squadSource)+'. <b>Score:</b> '+esc(data.source)+'.</p>'+
      '<div class="ws-grid">'+
      stat('Official points earned',data.points===null?'Unknown':fmt(data.points),
        'Official scorecard points summed for this group')+
      stat('Official attacks',data.attacks===null?'Unknown':fmt(data.attacks),
        'Reported attacks by these members')+
      stat('Points per attack',data.perHit===null?'Unknown':fmt(data.perHit),
        'Official score / official attacks')+
      stat('Enemy points from hits received',data.enemyPointsReceived===null?
        'Unknown':fmt(data.enemyPointsReceived),
        'Only enemy ranked-war scoring attacks captured by this device')+
      stat('Group net swing proxy',data.netProxy===null?'Unknown':fmt(data.netProxy),
        'Official earned - partial enemy score conceded')+'</div>'+
      '<p class="ws-small">Opponents earn score by hitting us. These are not personal point deductions. '+
      'The incoming attack feed may be incomplete, so a net proxy is not a verified group net score.</p>'+
      (data.rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Member</th><th>Official earned</th><th>Official attacks</th>'+
        '<th>Enemy points from hits received</th><th>Enemy scoring hits received</th></tr></thead><tbody>'+
        data.rows.map(p=>'<tr><td>'+infoButton(p.name||('Player '+p.id),p.id)+'</td>'+
          '<td>'+scoreLabel(p.score)+'</td><td>'+scoreLabel(p.attacks)+'</td>'+
          '<td>'+(p.received===null?'Unknown':fmt(p.received)+' (partial)')+'</td>'+
          '<td>'+(p.incomingHits===null?'Unknown':fmt(p.incomingHits))+'</td></tr>').join('')+
        '</tbody></table></div>':
        empty('Official per-member war scorecard not loaded yet. Do not infer zero output.'))+
      '<div class="ws-toolbar">'+b('Copy '+(side==='black'?'Black Skulls':'regular-member')+
        ' report','copy-squad:'+warId+':'+side)+'</div>');
  }
  function leaderboardCard(limit=8,warId=positive(state.data.war?.id)){
    const rows=performanceLeaderboard(warId).filter(x=>x.hits!==null||x.enemyScoringHits!==null);
    return card('Attacking vs defending | observed net-impact leaderboard',
      '<p>During war, totals use the captured optional faction-attack feed and can be incomplete. '+
      'After war, the completed official report takes precedence when available. '+
      'Points earned stay distinct from the opposing faction points earned by hitting a member. '+
      'Concessions are sourced from a partial enemy attack feed, not a personal point deduction. '+
      'A net-impact calculation is only a proxy, not an official personal Torn stat.</p>'+
      (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Member</th><th>Points earned</th><th>Enemy points conceded</th><th>Net impact proxy</th>'+
        '<th>Attacks made</th><th>Enemy scoring hits received</th><th>Enemy %</th><th>Pressure 30m</th>'+
        '<th>Earned / attack</th><th>Own baseline</th><th>Trend</th></tr></thead><tbody>'+
        rows.slice(0,limit).map(x=>'<tr><td>'+infoButton(x.player.name,x.player.id)+
          (cfg.blackSkulls[x.player.id]?' '+pill('BLACK SKULL','good'):'')+
          '<br><small>'+esc(x.source)+'</small></td>'+
          '<td>'+(x.points===null?'Unknown':fmt(x.points))+'</td>'+
          '<td>'+(x.enemyPointsReceived===null?'Unknown':fmt(x.enemyPointsReceived)+' (partial)')+'</td>'+
          '<td>'+(x.netProxy===null?'Unknown':fmt(x.netProxy)+' (proxy)')+'</td>'+
          '<td>'+(x.hits===null?'Unknown':fmt(x.hits))+'</td>'+
          '<td>'+(x.enemyScoringHits===null?'Unknown':fmt(x.enemyScoringHits))+'</td>'+ 
          '<td>'+(x.share===null?'Unknown':fmt(x.share)+'% observed')+'</td>'+ 
          '<td>'+(x.underFire?pill(fmt(x.recentIncoming)+' incoming','bad'):fmt(x.recentIncoming))+'</td>'+
          '<td>'+(x.perHit===null?'Unknown':fmt(x.perHit))+'</td>'+
          '<td>'+(x.baseline===null?'Unknown':fmt(x.baseline)+' ('+x.priorWars+' wars)')+'</td>'+
          '<td>'+pill(x.status,x.flag?'bad':x.ratio!==null&&x.ratio>=1.15?'good':'')+
          '</td></tr>').join('')+
        '</tbody></table></div>':empty('No ranked-war own-faction hits captured yet. Enable faction attacks to populate a live leaderboard.'))+
      '<div class="ws-toolbar">'+b('Full hit ledger','tab:ledger')+
        b('After-action reports','tab:afteraction')+'</div>');
  }

  function comparableStrengthCard(warId=positive(state.data.war?.id)){
    const snap=warSquadSnapshot(warId),ids=[...snap.black],
      official=state.data.reports[String(warId)]?.factions
        ?.find(x=>positive(x.id)===positive(cfg.ourId)),
      roster=new Map([...state.data.ours,...(official?.members||[])].map(p=>[positive(p.id),p])),
      rows=ids.map(id=>({id,member:roster.get(id),result:similarStrengthPerformance(id,warId)}))
        .sort((a,b)=>Number(b.result.flag)-Number(a.result.flag)||
          (b.result.currentSamples-a.result.currentSamples)||a.id-b.id);
    return card('Black Skulls | matched opponent-strength comparison',
      '<p>Compares a Skull against their own attacks on opponents with BSS within 25% '+
      'of their current target-strength median. Only BSS observed within 6 hours of '+
      'the actual recorded attack is used. Respect is chain-normalised and unusual '+
      'bonuses are excluded. This is <b>captured respect per recorded attempt</b>, not '+
      'official war points or a battle win-rate.</p>'+
      (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Black Skull</th><th>Target BSS reference</th><th>This war</th>'+
        '<th>Previous 3 wars</th><th>Compared pace</th><th>Evidence</th></tr></thead><tbody>'+
        rows.map(x=>{
          const y=x.result;
          return '<tr><td>'+infoButton(x.member?.name||('Player '+x.id),x.id)+'</td>'+
            '<td>'+(y.referenceBss===null?'Unknown':fmt(y.referenceBss))+'</td>'+
            '<td>'+(y.actual===null?'Unknown':fmt(y.actual)+' respect/attempt')+
              '<br><small>'+y.currentSamples+' comparable captured attempts</small></td>'+
            '<td>'+(y.historical===null?'Unknown':fmt(y.historical)+' respect/attempt')+
              '<br><small>'+y.historicalSamples+' attempts across '+y.priorWars+' wars</small></td>'+
            '<td>'+pill(y.label,y.flag?'bad':y.ratio!==null&&y.ratio>=1.15?'good':'')+'</td>'+
            '<td><small>'+esc(y.source)+'</small></td></tr>';
        }).join('')+'</tbody></table></div>':
        empty('No Black Skulls identified for this war. Tag members or load their past-war records.'))+
      '<p class="ws-small">Requires at least 3 comparable captured attempts this war, '+
      '3 from at least 2 past completed wars, and a reliable nonzero baseline. '+
      'Otherwise performance stays unclassified. Historical BSS is never '+
      'inferred from the present enemy roster.</p>');
  }
  function liveBlackSkullsImpactCard(){
    if(!activeWarNow())return '';
    const rows=state.data.ours.filter(p=>cfg.blackSkulls[p.id])
      .map(p=>({p,x:liveWarMemberImpact(p.id)}))
      .sort((a,b)=>(b.x.given??-1)-(a.x.given??-1)),
      known=rows.filter(z=>z.x.known),totalEarned=known.reduce((z,x)=>z+n(x.x.earned),0),
      totalGiven=known.reduce((z,x)=>z+n(x.x.given),0),
      hot=rows.filter(z=>z.x.underFire).length;
    return card('Black Skulls | live earned, conceded and pressure',
      '<p>Current war, captured ranked-war attacks only. E/G are observed respect contributions; '+
      'net is an estimated swing rather than an official personal war score. '+
      'An incomplete scan can change the rankings. Black Skull tags are your local selections.</p>'+
      '<p><b>Captured squad E/G:</b> '+(known.length?fmt(totalEarned)+' / '+fmt(totalGiven):'Unknown')+
      ' | <b>Net proxy:</b> '+(known.length?fmt(totalEarned-totalGiven):'Unknown')+
      ' | <b>Under repeated attack:</b> '+hot+
      ' | <b>Full scan:</b> '+(known.length&&known.every(z=>z.x.complete)?'Yes':'Not yet')+'</p>'+
      (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Black Skull</th><th>Earned</th><th>Given</th><th>Net</th>'+
        '<th>Enemy %</th><th>Own hits</th><th>Earn / hit</th><th>Enemy hits / 30m</th></tr></thead><tbody>'+
        rows.map(({p,x})=>'<tr><td>'+infoButton(p.name,p.id)+
          (x.underFire?' '+pill('UNDER FIRE','bad'):'')+'</td>'+
          '<td>'+(x.earned===null?'—':(x.complete?'':'≥')+fmt(x.earned))+'</td>'+
          '<td>'+(x.given===null?'—':(x.complete?'':'≥')+fmt(x.given))+'</td>'+
          '<td>'+(x.net===null?'—':'~'+(x.net>=0?'+':'')+fmt(x.net))+'</td>'+
          '<td>'+(x.share===null?'—':(x.complete?'':'≥')+fmt(x.share)+'%')+'</td>'+
          '<td>'+(x.ownHits===null?'—':fmt(x.ownHits))+'</td>'+
          '<td>'+(x.ownHits&&x.earned!==null?fmt(x.earned/x.ownHits):'—')+'</td>'+
          '<td>'+fmt(x.in30)+'</td></tr>').join('')+
        '</tbody></table></div>':empty('No Black Skulls tagged. Tag members under Skull Capo command.')));
  }

  function enemyScoreShareCard(limit=10){
    if(!activeWarNow())return '';
    const rows=state.data.ours.map(p=>({p,x:liveWarMemberImpact(p.id)}))
      .filter(z=>z.x.given!==null)
      .sort((a,b)=>b.x.given-a.x.given).slice(0,limit),
      covered=concessionSnapshot();
    return card('Where the enemy scored | our defensive exposure',
      '<p>Ranked by captured enemy points gained against each member. Percentage compares '+
      'their observed attack points to the current official enemy war score. '+
      'Values marked ≥ are incomplete minima, not final allocations. '+
      'Repeated attacks = 3+ in 30m or 5+ in 60m.</p>'+
      (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Member</th><th>Given</th><th>Enemy score %</th><th>Scoring hits</th>'+
        '<th>Incoming 30m</th><th>Net proxy</th></tr></thead><tbody>'+
        rows.map(({p,x})=>'<tr><td>'+infoButton(p.name,p.id)+
          (cfg.blackSkulls[p.id]?' '+pill('SKULL'):'')+
          (x.underFire?' '+pill('REPEAT HITS','bad'):'')+'</td>'+
          '<td>'+(x.complete?'':'≥')+fmt(x.given)+'</td>'+
          '<td>'+(x.share===null?'—':(x.complete?'':'≥')+fmt(x.share)+'%')+'</td>'+
          '<td>'+(x.hits===null?'—':fmt(x.hits))+'</td>'+
          '<td>'+fmt(x.in30)+'</td>'+
          '<td>'+(x.net===null?'—':'~'+(x.net>=0?'+':'')+fmt(x.net))+
          '</td></tr>').join('')+'</tbody></table></div>':
        empty(covered?.known?'Scan catching up: no member totals yet.':
          'Waiting for the current-war faction attack-history scan.'))+
      '<p class="ws-small">Scans run while Torn is open; a missing attack or bonus can change the attribution. '+
      'Enemy score remains the authoritative faction-wide total.</p>');
  }

    function blackSkullsPerformanceCard(warId=positive(state.data.war?.id)){
    const players=state.data.ours.filter(p=>cfg.blackSkulls[p.id]),
      rows=players.map(p=>memberPerformance(p,warId)).filter(Boolean),
      flagged=rows.filter(x=>x.flag);
    return card('Black Skulls | compared with their own war history',
      '<p>Uses points per attack, rather than raw totals across different war lengths. '+
      'A flag requires at least two previous official scorecards and five current attacks, '+
      'then a decline of at least 30%. Current-war figures can be partial, and a changed role '+
      'or chain bonus allocation can explain a difference.</p>'+
      (rows.length?rows.map(x=>'<div class="ws-row"><span>'+
          infoButton(x.player.name,x.player.id)+'<br><small>'+
          (x.perHit===null?'No current attack rate':fmt(x.perHit)+' pts / captured attack')+
          ' | baseline '+(x.baseline===null?'Unknown':fmt(x.baseline)+' pts / attack')+
          ' | '+x.priorWars+' comparable previous wars</small></span>'+
          pill(x.status,x.flag?'bad':x.ratio!==null&&x.ratio>=1.15?'good':'')+
        '</div>').join(''):empty('Mark your heavy hitters in Leadership, or load official war reports.'))+
      (flagged.length?'<div class="ws-note ws-warn">'+flagged.length+
        ' Black Skull(s) below their own historical points/attack baseline; review specific assignments and attack conditions before changing duties.</div>':''));
  }
  function bonusTargetCard(){
    const bns=bonusHitRecommendation(),chain=chainStatus();
    if(!chain.fresh||chain.next===null||chain.nextIn===null||chain.nextIn>3)return '';
    return card('CHAIN BONUS | reserve the right opponent',
      '<p><b>Hit #'+fmt(chain.next)+'</b> | '+fmt(chain.nextIn)+
      ' chain hits until bonus | +'+fmt(chain.nextBonus)+
      ' respect if faction bonus unlocked. Only a successful attack on the enemy faction '+
      'counts as ranked-war score; finishing on an outsider can waste this opportunity.</p>'+
      (bns?.target?'<p><b>Verified suitable target for you:</b> '+
        infoButton(bns.target.enemy.name,bns.target.enemy.id)+
        ' '+ffBadge(bns.target.enemy.id)+
        ' | matchup ratio '+fmt(bns.target.evidence.match.ratio)+
        ' | '+esc(bns.target.evidence.reliability)+'</p>'+
        a('Attack manually',attackLink(bns.target.enemy.id)):
        '<p>No verified suitable bonus target for the current key owner. Coordinate with other hitters; do not guess from FFScouter alone.</p>')+
      '<p class="ws-small">Torn reports the chain state as a snapshot. Refresh before assigning a decisive bonus attack. No attack is started by this card.</p>');
  }
  function enemyScreen(){
    const enemy=sideActivity('enemies'),history=factionWarMetrics('enemies'),
      bands=enemyRoleBands(),threat=enemyThreatRows().slice(0,5),
      active=rosterFresh('enemies'),ff=ffCoverage(),last=history.last,
      latest=last?state.data.reports[last.id]?.factions
        ?.find(x=>x.id===positive(cfg.enemyId)):null;
    let h=statusNote()+'<div class="ws-lead"><span class="ws-data-label">02 / OPPONENT INTELLIGENCE</span>'+
      '<h2>Know who we are fighting</h2>'+
      '<p>Strength, activity, travel, previous wars and who scores their points. '+
      'FFScouter BSS is an estimate, not a confirmed spy or an individual hitter FF.</p>'+
      '<div class="ws-toolbar">'+b('Refresh','refresh')+
      b('Detailed enemy dossiers','tab:targets')+b('Find player','find')+b('Last wars','tab:history')+'</div></div>'+
      '<div class="ws-grid">'+
      statAction('Enemy available',active?enemy.okay+' / '+enemy.total:'Stale',
        'Observed Okay status','tab:targets')+
      statAction('Active last 24 hours',enemy.total?enemy.active24+' / '+enemy.total:'Unknown',
        'Based on last action, not sustained uptime','tab:activity')+
      statAction('Travelling',active?fmt(enemy.away):'Stale',
        'Observed current roster','tab:timeline')+
      statAction('Hospitalised',active?fmt(enemy.hospital):'Stale',
        'Hospital expiry and return watches','tab:control')+
      statAction('Last war score',history.lastScore===null?'Unknown':fmt(history.lastScore),
        'Official opponent score in latest completed war','tab:history')+
      statAction('Recent war wins',history.decided?history.wins+' / '+history.decided:'Unknown',
        'Official completed wars in local sample','tab:history')+
      statAction('Known enemy BSS',bands.known+' / '+enemy.total,
        bands.unknown+' need a fresh BSS estimate / spy','tab:targets')+
      statAction('FFScouter FF coverage',ff.total?ff.covered+' / '+ff.total:'Unknown',
        'Registered user-key FF, not per-faction-member','tab:settings')+'</div>'+
      apiCoverageCard()+
      card('Enemy strength partition | who should tackle whom',
        '<p><b>Black Skulls:</b> '+bands.heavyCount+
        ' toughest opponents among the '+bands.known+
        ' players with known BSS evidence. <b>Regular members:</b> '+
        bands.regularCount+' lower-BSS opponents. <b>Unclassified:</b> '+
        bands.unknown+' require scouting. Brackets are relative to this opponent faction, '+
        'not absolute battle-stat thresholds; status changes do not reshuffle the bracket.</p>'+
        (bands.ranked.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Enemy</th><th>Est. BSS</th><th>Role</th><th>Status</th><th>FF for key owner</th><th>Inspect</th>'+
        '</tr></thead><tbody>'+bands.ranked.slice(0,14).map(x=>
          '<tr><td>'+infoButton(x.enemy.name,x.enemy.id)+
          '<br><small>Lv '+fmt(x.enemy.level)+'</small></td>'+
          '<td>'+fmt(x.value)+'<br><small>'+esc(x.source)+'</small></td>'+
          '<td>'+pill(bands.heavy.has(x.enemy.id)?'BLACK SKULL':'REGULAR',
            bands.heavy.has(x.enemy.id)?'good':'')+'</td>'+
          '<td>'+pill(x.enemy.status,memberState(x.enemy)==='okay'?'good':'')+'</td>'+
          '<td>'+ffBadge(x.enemy.id)+'</td><td>'+infoButton('Profile',x.enemy.id)+'</td></tr>').join('')+
        '</tbody></table></div>':empty('No usable BSS. Enable FFScouter or enter manual battle stats on player dossiers.')))+
      card('Enemy threats | actual scoring evidence',
        threat.length?threat.map(x=>'<div class="ws-row"><span>'+infoButton(x.player.name,x.player.id)+
          ' '+ffBadge(x.player.id)+'<br><small>'+esc(x.source)+
          ' | '+(x.live?fmt(x.live.respect)+' respect from captured current hits':
            x.previous?fmt(x.previous.score)+' points in latest available report':'Unknown contribution')+
          ' | '+esc(x.player.status)+'</small></span>'+
          b('Intel','player:'+x.player.id)+'</div>').join(''):
          empty('No sourced threat history available yet.'))+
      card('Their last completed war',
        last?'<p>War #'+last.id+' | '+(last.winner===positive(cfg.enemyId)?'Won':
          last.winner?'Lost':'Unknown')+' | score '+scoreLabel(history.lastScore)+
          ' against '+scoreLabel(history.lastAgainst)+'. '+
          (latest?'Member-level scorecard available.':'Load the official detailed report for member scores.')+
          '</p><div class="ws-toolbar">'+b('War scorecard','war:'+last.id)+
          b('Enemy war timeline','tab:timeline')+'</div>':
          empty('No completed opponent history loaded; refresh to fetch official war records.'))+
      '<div class="ws-toolbar">'+b('Enemy player dossiers','tab:targets')+
        b('Activity heatmap','tab:activity')+b('Travel during wars','tab:timeline')+
        b('Hospital control','tab:control')+
        b('Player matchups','tab:matchups')+b('Previous wars','tab:history')+
        b('Full enemy intelligence','tab:intel')+'</div>';
    return h;
  }
  function reportsScreen(){
    const last=Object.values(state.data.afterActions||{}).filter(x=>positive(x.id))
        .sort((a,b)=>n(b.end)-n(a.end))[0]||null,
      live=warHitLedger(),chain=chainStatus(),coverage=historyCoverage();
    let h=statusNote()+'<div class="ws-lead"><span class="ws-data-label">03 / REPORTS AND MANAGEMENT</span>'+
      '<h2>Analysis, history and every advanced tool</h2>'+
      '<p>Dig into the evidence, plan future wars, manage settings, inspect hit logs and review completed wars.</p>'+
      '<div class="ws-toolbar">'+b('Latest after-action report','tab:afteraction')+
        b('Skull Capo squad command','tab:leader')+
        b('Torn and FF settings','tab:settings')+b('Find player','find')+'</div></div>'+
      '<div class="ws-grid">'+
      statAction('Latest after-action',last?'#'+last.id:'No report',
        last?last.outcome+' / '+(last.detail?'official detail':'summary only'):'Refresh after a war ends','tab:afteraction')+
      statAction('Current war observed hits',live.known?fmt(live.ours.hits):'Unknown',
        'Partial feed if enabled','tab:ledger')+
      statAction('Chain',chain.fresh?'#'+fmt(chain.count):'Unknown',
        'Observed current chain state','tab:skulls')+
      statAction('Stored opponent wars',fmt(state.data.enemyWars.filter(x=>x.end).length),
        'Past official wars','tab:history')+
      statAction('Detailed reports ready',coverage.total?coverage.complete+' / '+coverage.total:'No completed wars',
        coverage.missing+' missing; '+coverage.waiting+' on API backoff','tab:history')+'</div>';
    h+=apiCoverageCard()+leaderboardCard(24);
    const groups=[
      ['OPERATIONS & ORDERS',[
        ['Skull Capo command','leader'],['Black Skulls','skulls'],
        ['Quick commander','commander'],['Daily operations','operations'],
        ['Turtling','turtle'],['Hospital watchers','control'],
        ['Assignments','assignments'],['Full leadership orders','command']]],
      ['RESULTS & PERFORMANCE',[
        ['After-action reports','afteraction'],['Hit ledger','ledger'],
        ['Ranked-war score pace','pace'],['Current / previous war timelines','timeline'],
        ['Official war history','history'],['Enemy threat report','threats']]],
      ['SCOUTING & STRATEGY',[
        ['Enemy dossiers','targets'],['Detailed opponent intel','intel'],
        ['Member-by-member matchups','matchups'],['Activity analysis','activity'],
        ['Tactical strategy','strategy'],['Alerts','alerts']]],
      ['CONFIGURATION',[
        ['Settings / FFScouter / Sync','settings'],['Diagnostics','diagnostics']]]
    ];
    for(const [heading,links] of groups)h+=card(heading,
      '<div class="ws-toolbar">'+links.map(([label,tab])=>b(label,'tab:'+tab)).join('')+'</div>');
    return h;
  }
  function leaderScreen(){
    const data=leadershipSummary(),bands=enemyRoleBands(),score=warScore(),
      chain=chainStatus(),pace=warPace(),plan=turtlePlan(),
      own=state.data.ours;
    const black=own.filter(p=>cfg.blackSkulls[p.id]),
      defensive=own.filter(p=>!cfg.blackSkulls[p.id]&&
        ['turtle','reserve'].includes(plan.members[p.id])),
      regular=own.filter(p=>!cfg.blackSkulls[p.id]&&
        !['turtle','reserve'].includes(plan.members[p.id]));
    const teamRows=(people,kind)=>people.length?people.map(p=>{
      const target=state.data.enemies.find(x=>x.id===positive(cfg.assignments[p.id])),
        roleValid=target&&roleAllows(p,target,bands),read=hitterReadiness(p),
        evidence=target?matchEvidence(p,target):null;
      return '<div class="ws-row"><span><b>'+infoButton(p.name,p.id)+'</b>'+
        ' '+pill(p.status,memberState(p)==='okay'?'good':'')+
        '<br><small>'+esc(hitterPlanStatus(p.id))+' | energy '+
        (read.energy===null?'unknown':fmt(read.energy)+' E')+
        ' | target '+(target?esc(target.name):'unassigned')+
        (target&&!roleValid?' | WRONG BSS BRACKET':'')+
        (evidence?.tier===0?' | favourable manual spies':' | matchup unverified')+
        '</small></span><span>'+
        b('Assign','tab:command')+' '+b('Matchups','hitter:'+p.id)+'</span></div>';
    }).join(''):empty('No members currently allocated to '+kind+'.');
    return statusNote()+'<div class="ws-lead"><span class="ws-data-label">SKULL CAPO | BLACK SKULLS COMMAND</span>'+
      '<h2>Black Skulls squad command</h2>'+
      '<p>You lead the Black Skulls heavy hitters, not the whole faction. This board prioritises '+
      'high-BSS assignments and squad readiness. Regular attackers and defenders appear for wider coordination only.</p>'+
      '<div class="ws-toolbar">'+b('Refresh','refresh')+
        b('Draft role-safe orders','draft-black')+b('Coordinate orders','tab:command')+
        b('Sync orders','tab:settings')+
        b('Copy squad chat briefing','copy-skull-chat')+'</div></div>'+
      '<div class="ws-grid">'+
      stat('Score',score?fmt(score.our)+' / '+fmt(score.enemy):'Unknown','Official live score')+
      stat('Net lead',score?(score.net>=0?'+':'')+fmt(score.net):'Unknown','Current ranked war')+
      stat('Black Skulls',fmt(black.length),'Your heavy-hitter squad')+
      stat('Regular attackers',fmt(regular.length),'Coordination context only')+
      stat('Defence and reserve',fmt(defensive.length),'Wider faction context')+
      stat('Current chain',chain.fresh?'#'+fmt(chain.count):'Unknown',
        chain.fresh?chain.remaining+' seconds left':'Refresh chain')+
      stat('Net scoring pace',pace?.measurable?fmt(pace.netRate)+' points/h':'Unknown',
        'Locally observed timeline')+'</div>'+
      (data.duplicateTargets.length?card('Assignments collision warning',
        '<p>'+data.duplicateTargets.map(x=>'Enemy #'+x.id+' assigned '+x.count+' times').join('; ')+
        '. Review manual orders before coordinating attacks.</p>'+b('Fix orders','tab:command')):'')+
      (cfg.shared.enabled?card('Shared orders', '<p>Revision '+fmt(cfg.shared.revision||0)+
        ' | '+(cfg.shared.localDirty?'Unpublished changes':'No pending local edits')+
        (state.sharedError?' | '+esc(state.sharedError):'')+'</p>'+
        '<div class="ws-toolbar">'+b('Pull orders','shared-pull')+
        (cfg.shared.canWrite?b('Publish orders','shared-push'):'')+'</div>'):'')+
      card('Skull Capo | define heavy targets',
        '<p>Choose the top percentage of opponents with known BSS or an absolute minimum BSS. '+
        'Lower-BSS opponents remain in the regular-member pool. Unknown BSS requires scouting.</p>'+
        '<div class="ws-toolbar"><label>Strength cutoff method<select id="ws-heavy-mode">'+
        [['percent','Top percentage'],['min-bss','Minimum BSS']].map(([v,label])=>
          '<option value="'+v+'" '+(bands.rule.mode===v?'selected':'')+'>'+label+'</option>').join('')+
        '</select></label>'+
        '<label>Top % (5-100)<input id="ws-heavy-percent" type="number" min="5" max="100" step="1" value="'+bands.rule.percent+'"></label>'+
        '<label>Minimum BSS<input id="ws-heavy-bss" type="number" min="0" max="1000000000000000" step="any" value="'+bands.rule.minBss+'"></label></div>'+
        '<p class="ws-small">Current buckets: '+fmt(bands.heavyCount)+' heavy, '+
          fmt(bands.regularCount)+' regular, '+fmt(bands.unknown)+' unknown. '+
          'This controls targets only; it does not prove a win.</p>'+
        b('Save strength cutoff','save-heavy-cutoff'))+
      blackSkullsCoverageCard(40)+
      liveBlackSkullsImpactCard()+blackSkullsPerformanceCard()+comparableStrengthCard()+bonusTargetCard()+leaderboardCard(12)+
      card('BLACK SKULLS | strongest enemy targets',teamRows(black,'Black Skulls'))+
      card('REGULAR ATTACKERS | lower BSS targets',teamRows(regular,'regular attackers'))+
      card('DEFENCE / RESERVE | coordinated cover',teamRows(defensive,'defence'))+
      '<div class="ws-toolbar">'+b('Black Skulls control','tab:skulls')+
        b('Turtling duties','tab:turtle')+b('Hospital control','tab:control')+
        b('Performance leaderboard','tab:reports')+
        b('Full planning','tab:command')+'</div>';
  }
  function blackSkullsRoom(){
    const self=ourWarReadiness(),skulls=state.data.ours.filter(p=>cfg.blackSkulls[p.id]),
      bands=enemyRoleBands(),personal=bestEfficiencyHit(),myId=positive(self.id),
      chosen=state.data.enemies.find(p=>p.id===positive(cfg.assignments[myId])),
      duty=turtlePlan().members[myId]||'not assigned',
      control=cfg.controlAssignments[currentPlanKey()]||{},
      watched=Object.entries(control).filter(([,owner])=>positive(owner)===myId)
        .map(([id])=>state.data.enemies.find(p=>p.id===positive(id))).filter(Boolean);
    return statusNote()+'<div class="ws-lead"><span class="ws-data-label">BLACK SKULLS | HEAVY HITTER CONTROL</span>'+
      '<h2>Strike, hold and hospital control</h2>'+
      '<p>Personal efficient target, saved orders, hospital watches and team readiness. All actions are manual.</p></div>'+
      '<div class="ws-grid">'+
      stat('Black Skulls',fmt(skulls.length),'Locally marked members')+
      stat('Observed Okay',fmt(skulls.filter(p=>memberState(p)==='okay').length),
        'Not proof of 25+ energy')+
      stat('My energy',self.energy===null?'Unknown':fmt(self.energy)+' E','Own bars / manual')+
      stat('My duty',duty,'Per-war defensive role')+
      stat('Chain',chainStatus().fresh?'#'+fmt(chainStatus().count):'Unknown','Official Torn chain')+
      stat('Chain timeout',chainStatus().fresh?chainStatus().remaining+'s':'Unknown',
        'Observed countdown, verify on Torn')+
      stat('Next chain bonus',chainStatus().fresh&&chainStatus().next!==null?
        '#'+fmt(chainStatus().next)+' | +'+fmt(chainStatus().nextBonus)+' respect':'Unknown',
        chainStatus().fresh?chainStatus().nextIn+' successful hits remaining, if unlocked':'Unknown')+'</div>'+
      card('My next move',cfg.blackSkulls[myId]?
        '<p><b>Status:</b> '+esc(self.kind)+'</p>'+
        '<p><b>Assigned enemy:</b> '+(chosen?infoButton(chosen.name,chosen.id)+
          ' '+ffBadge(chosen.id)+' | '+esc(chosen.status):'None saved')+'</p>'+
        '<p><b>Best verified score / 25 E:</b> '+(personal?
          infoButton(personal.player.name,personal.player.id)+' | '+fmt(personal.pointsPer25)+
          ' | '+esc(personal.source):'No verified safe current hit')+'</p>'+
        '<div class="ws-toolbar">'+b(self.kind==='hospital'?'HEAL TO HIT':'HIT','fast-hit')+
          b('My matchups','hitter:'+myId)+b('Defend','tab:turtle')+'</div>':
        '<p>You are not marked as a Black Skull on this device. Use Leadership to set membership.</p>'+
        b('Leadership','tab:command'))+
      bonusTargetCard()+blackSkullsCoverageCard(20)+
      card('Black Skulls priority targets | toughest known BSS',
        '<p>Only the top relative BSS bracket is available for Black Skulls automatic target suggestions. '+
        'Opponent strength combines verified manual spies and fresh FFScouter estimates; '+
        'the latter are NOT guaranteed outcomes. Members must still have favourable comparable spy evidence.</p>'+
        (bands.ranked.filter(x=>bands.heavy.has(x.enemy.id)).length?
          '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
          '<th>Opponent</th><th>Public/manual BSS</th><th>Current status</th>'+
          '<th>Verified Black Skull matchup</th><th>Action</th></tr></thead><tbody>'+
          bands.ranked.filter(x=>bands.heavy.has(x.enemy.id)).slice(0,15).map(x=>{
            const matches=skulls.map(hitter=>({hitter,evidence:roleMatch(hitter,x.enemy,bands)}))
              .filter(entry=>entry.evidence).sort((a,b)=>a.evidence.match.ratio-b.evidence.match.ratio);
            return '<tr><td>'+infoButton(x.enemy.name,x.enemy.id)+' '+ffBadge(x.enemy.id)+
              '<br><small>Lv '+fmt(x.enemy.level)+'</small></td>'+
              '<td>'+fmt(x.value)+'<br><small>'+esc(x.source)+'</small></td>'+
              '<td>'+esc(x.enemy.status)+'</td>'+
              '<td>'+(matches.length?matches.slice(0,2).map(k=>
                infoButton(k.hitter.name,k.hitter.id)+' (ratio '+fmt(k.evidence.match.ratio)+')').join(', '):
                'No verified favourable hitter; scout')+'</td>'+
              '<td>'+infoButton('Inspect',x.enemy.id)+'</td></tr>';
          }).join('')+'</tbody></table></div>':
          empty('No comparable enemy BSS estimates; fetch FFScouter or enter manual spies.')))+
      blackSkullsPerformanceCard()+comparableStrengthCard()+
      card('My hospital-control assignments',watched.length?watched.map(p=>{
        const expiry=memberState(p)==='hospital'&&p.until>Date.now()?
          ' | approximate hospital expiry '+flightCountdown(p.until):'';
        return '<div class="ws-row"><span>'+infoButton(p.name,p.id)+' '+ffBadge(p.id)+
          '<br><small>'+esc(p.status)+esc(expiry)+'</small></span>'+
          b('Control','control-target:'+p.id)+'</div>';
      }).join(''):empty('No enemy hospital watches currently assigned to your account.'))+
      card('Heavy hitters duty board',
      '<p>Choose the individual risk. Safe: spy ratio at most 55% and at least one recorded win. '+
      'Balanced: at most 70%. Aggressive: at most 78%. No profile bypasses fresh spies, known losses or team target conflicts.</p>'+
      (skulls.length?skulls.map(p=>{
        const read=hitterReadiness(p),assigned=state.data.enemies.find(x=>
          x.id===positive(cfg.assignments[p.id])),
          watches=Object.values(control).filter(id=>positive(id)===p.id).length;
        return '<div class="ws-commander-member"><div><b>'+esc(p.name)+'</b> '+
          pill(p.status,memberState(p)==='okay'?'good':'')+
          '<small>Energy '+(read.energy===null?'unknown':fmt(read.energy)+' E')+
          ' | watches '+watches+' | assigned '+(assigned?esc(assigned.name):'none')+
          '</small></div><div class="ws-toolbar">'+b('Matchups','hitter:'+p.id)+
          b('Hospital control','tab:control')+
          '<label>Risk <select data-skull-risk="'+p.id+'">'+
          [['safe','Safe'],['balanced','Balanced'],['aggressive','Aggressive']].map(([v,name])=>
            '<option value="'+v+'" '+(hitterRisk(p.id).mode===v?'selected':'')+'>'+name+'</option>').join('')+
          '</select></label></div></div>';
      }).join(''):empty('Mark Black Skulls in Leadership to populate the board.')))+
      '<div class="ws-toolbar">'+b('Copy squad chat briefing','copy-skull-chat')+
        b('Leadership','tab:command')+
      b('War room','tab:overview')+b('All targets','tab:targets')+'</div>';
  }
  function liveWarRoom(){
    const w=state.data.war,score=warScore(),own=ourWarReadiness(),
      enemies=sideActivity('enemies'),pace=warPace(),alerts=currentAlerts().slice(0,3),
      fresh=rosterFresh('enemies');
    const chain=chainStatus();
    let body=statusNote()+'<div class="ws-lead"><span class="ws-data-label">LIVE WAR | ACT NOW</span>'+
      '<h2>Vs '+esc(w.opponentName||('Faction #'+positive(cfg.enemyId)))+'</h2>'+
      '<div class="ws-score">Us '+(score?fmt(score.our):'?')+' / Them '+(score?fmt(score.enemy):'?')+
      ' | Net '+(score?(score.net>=0?'+':'')+fmt(score.net):'?')+'</div>'+
      '<p>Official points '+esc(age(state.data.updated.wars))+
      (score?.target?' | Target '+fmt(score.target):'')+'</p></div>'+
      '<div class="ws-grid">'+
      statAction('Chain',chain.fresh?'#'+fmt(chain.count):'Unknown','Official count','tab:skulls')+
      statAction('Chain time',chain.fresh?chain.remaining+'s':'Unknown','Countdown from last observation','tab:skulls')+
      statAction('Next chain bonus',chain.fresh&&chain.next!==null?
        '#'+fmt(chain.next)+' | +'+fmt(chain.nextBonus)+' respect':'Unknown',
        chain.fresh?fmt(chain.nextIn)+' hits away if bonus unlocked':'No data','tab:skulls')+
      statAction('Chain modifier',chain.fresh&&chain.modifier!==null?fmt(chain.modifier)+'x':'Unknown',
        'Official chain API','tab:skulls')+'</div>'+
      '<div class="ws-toolbar">'+b('TURTLE','fast-turtle')+b(own.kind==='hospital'?'HEAL TO HIT':'HIT','fast-hit')+
      b('HEAL','fast-heal')+b('Refresh','refresh')+b('Black Skulls','fast-skulls')+'</div>'+
      missionPanel()+battleIntelCard()+commandPulse()+
      '<div class="ws-grid">'+
      statAction('Enemy Okay',fresh?fmt(enemies.okay)+' / '+fmt(enemies.total):'Unknown','Current roster','tab:targets')+
      statAction('Enemy hospital',fresh?fmt(enemies.hospital):'Unknown','Watch expiry windows','tab:control')+
      statAction('Enemy active 24h',enemies.total?fmt(enemies.active24)+' / '+fmt(enemies.total):'Unknown','Last actions, not uptime','tab:activity')+
      statAction('Enemy points / hour',pace?.measurable?fmt(pace.rateEnemy):'Unknown','Sampled observations','tab:pace')+'</div>'+
      hospitalWatchCard()+bonusTargetCard()+
      enemyScoreShareCard(10)+leaderboardCard(5)+
      card('Immediate priorities',alerts.length?alerts.map(x=>'<div class="ws-row"><span><b>'+
        esc(x.title)+'</b><br><small>'+esc(x.detail)+'</small></span>'+
        b('Review','alert:'+x.id)+'</div>').join(''):empty('No verified urgent alerts. Keep statuses fresh.'))+
      '<div class="ws-toolbar">'+b('Opponent intelligence','tab:enemy')+
      b('Reports and advanced tools','tab:reports')+b('Skull Capo','tab:leader')+'</div>';
    return body;
  }
  function overview(){
    if(activeWarNow())return liveWarRoom();
    const w=state.data.war,score=warScore(),our=sideActivity('ours'),them=sideActivity('enemies');
    const ff=ffCoverage();
    const historyStats=factionWarMetrics('enemies'),last=historyStats.last;
    const now=Date.now(),recent=state.data.enemies.filter(p=>p.lastAt&&now-p.lastAt<24*HOUR);
    let html=statusNote()+
      '<div class="ws-lead"><span class="ws-data-label">WAR ROOM | OFFICIAL + OBSERVED</span>'+
      '<h2>'+(w?'Ranked war: '+esc(w.opponentName||('Faction '+cfg.enemyId)):
       positive(cfg.enemyId)?'Scouting faction #'+cfg.enemyId:'No opponent selected')+'</h2>'+
      '<p>'+(score?'Official score: Our faction '+fmt(score.our)+' / Opponent '+fmt(score.enemy)+' | Net '+fmt(score.net):
        'Live ranked-war score not available. Historical scouting remains available.')+'</p>'+
      '<div class="ws-toolbar">'+b('Enemy intelligence','tab:intel')+b('Players and targets','tab:targets')+
      b('Previous wars','tab:history')+b('What to do now','tab:operations')+b('After-action reports','tab:afteraction')+b('Our war orders','tab:assignments')+
      b('Leadership board','tab:command')+b('Live points/hour','tab:pace')+b('War timelines','tab:timeline')+'</div></div>'+
      '<div class="ws-grid">'+
      statAction('Enemy online now',rosterFresh('enemies')?fmt(them.online)+' / '+them.total:'Stale',
        'Latest observed roster | '+age(them.last),'tab:activity')+
      statAction('Active in last 24h',them.total?fmt(them.active24)+' / '+them.total:'\u2014',
        'Last action timestamps; not sustained online time','tab:targets')+
      statAction('Enemy Okay now',rosterFresh('enemies')?fmt(them.okay)+' / '+them.total:'Stale',
        'Possible candidates | check again before hitting','tab:targets')+
      statAction('Enemy last war',last&&historyStats.lastScore!==null?fmt(historyStats.lastScore)+' pts':'\u2014',
        last?'Against '+scoreLabel(historyStats.lastAgainst)+' | #'+last.id:'History not yet loaded','tab:intel')+
      statAction('Enemy war wins',historyStats.decided?fmt(historyStats.wins)+' / '+fmt(historyStats.decided):'\u2014',
        'Last '+historyStats.wars+' completed wars loaded','tab:history')+
      statAction('FFScouter coverage',ff.total?ff.covered+' / '+ff.total:'\u2014',
        'Fresh estimates; click to inspect source and connection','tab:targets')+
      statAction('Enemy status',rosterFresh('enemies')?fmt(them.away)+' away / '+fmt(them.hospital)+' hosp.':'Stale',
        'Observed travel and hospital states','tab:activity')+'</div>';
    if(score&&score.target){
      const pct=Math.max(0,Math.min(100,(score.net+score.target)/(2*score.target)*100));
      html+=card('Current war scoreline | official','<div class="ws-row"><b>Us '+fmt(score.our)+'</b><b>Them '+fmt(score.enemy)+'</b></div>'+
        '<div class="ws-pct"><i style="width:'+pct+'%"></i></div>'+
        '<p class="ws-small">Target '+fmt(score.target)+'. Bar illustrates score difference, not win probability.</p>');
    }
    const strong=strongHours();
    if(strong.length){
      const best=strong[0];
      html+=card('Observed time advantage','<p>Most favourable sampled hour: <b>'+String(best.hour).padStart(2,'0')+
        ':00 TCT</b> | Our online checks '+best.ours.pct+'% vs enemy '+best.theirs.pct+'%.</p>'+
        '<p class="ws-small">Based on local foreground samples only ('+best.ours.samples+' ours / '+best.theirs.samples+
        ' enemy observations for this hour). Not a guarantee or accurate live member count.</p>'+b('See 24h comparison','tab:activity'));
    }
    const contribution=warContributionIntel();
    if(contribution.known){
      html+=card('Enemy latest war - participation intelligence | official',
        '<div class="ws-inline-metrics"><span>Scored '+fmt(contribution.total)+' points</span>'+ 
        '<span>'+fmt(contribution.attacks)+' attacks</span>'+ 
        '<span>'+fmt(contribution.contributors)+' / '+fmt(contribution.players)+' scored</span>'+ 
        '<span>Top 3 contributed '+scoreLabel(contribution.top3Share)+'% of summed member score</span>'+ 
        '<span>'+scoreLabel(contribution.avgPerAttack)+' points / attack (faction total)</span></div>'+ 
        '<p class="ws-small">Concentration is based only on the latest stored official report, not a prediction.</p>'+ 
        b('Full player contribution breakdown','war:'+contribution.id));
    }
    html+=watchlistPanel()+reliabilityPanel()+ffStatusPanel();
    const leaders=perMemberRows('enemies',5).filter(x=>x.last!==null);
    html+=card('Enemy last-war top scorers',leaders.length?
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Enemy</th><th>Latest known war score</th><th>Action</th></tr></thead><tbody>'+
      leaders.map(x=>'<tr><td>'+infoButton(x.p.name,x.p.id)+' '+ffBadge(x.p.id)+'</td><td>'+scoreLabel(x.last)+'</td><td>'+a('Profile',link(x.p.id))+'</td></tr>').join('')+
      '</tbody></table></div>'+b('Full opponent dossier','tab:intel'):
      empty('Official per-player scores appear as historical reports load. Select the opponent in Settings if not currently at war.')+
      '<div class="ws-toolbar">'+b('Load enemy history','tab:history')+b('See all players','tab:targets')+'</div>');
    html+=card('What needs attention',currentAlerts().length?currentAlerts().map(x=>'<div class="ws-row"><span><b>'+
      esc(x.title)+'</b><br><small>'+esc(x.detail)+'</small></span>'+b('Review','alert:'+x.id)+'</div>').join(''):
      empty('No verified urgent war tasks.'))+
      card('Related TornStaxx tools','<div class="ws-toolbar">'+b('Training and energy','tool:happy')+
      b('Profit and supplies','tool:profit')+b('Company','tool:company')+'</div>');
    return html;
  }
  function warReportView(id){
    const r=state.data.reports[id],known=state.data.enemyWars.concat(state.data.ourWars).find(w=>w.id===id);
    let html=statusNote()+'<div class="ws-toolbar">'+b('Back to war history','war-list')+
      b('Opponent intelligence','tab:intel')+'</div>';
    if(!r)return html+card('Official report #'+id,'<p>War #'+id+' is listed in the Torn API, but its detailed report is not stored on this device yet.</p>'+
      b(state.loading?'Loading...':'Fetch this official report','load-report:'+id)+
      (known?'<p>Recorded '+esc(stamp(known.end*1000))+'</p>':''));
    const won=r.war?.winner;
    html+='<div class="ws-lead"><span class="ws-data-label">OFFICIAL RANKED WAR REPORT</span><h2>War #'+id+
      ' | '+(won?'Winner: faction #'+won:'Winner unknown')+'</h2><p>Started '+
      esc(stamp(n(r.war?.start)*1000))+' | Ended '+esc(stamp(n(r.war?.end)*1000))+
      (r.war?.forfeit?' | Forfeit recorded':'')+'</p></div>';
    html+='<div class="ws-grid">'+r.factions.map(f=>card(f.name||('Faction #'+f.id),
      '<div class="ws-score">'+fmt(f.score)+' pts</div>'+
      '<p>'+fmt(f.attacks)+' attacks | '+(f.id===won?'Winner':'Did not win')+'</p>'+
      '<p>Rank '+esc(f.rankBefore||'unknown')+' to '+esc(f.rankAfter||'unknown')+'</p>'+
      '<p>Rewards: '+fmt(f.rewards?.points)+' points, '+fmt(f.rewards?.respect)+' respect</p>'+
      '<p class="ws-small">'+(f.rewards?.items||[]).map(item=>esc(item.name)+' x'+fmt(item.quantity)).join(', ')+'</p>'+
      a('Faction',factionLink(f.id)))).join('')+'</div>';
    html+=r.factions.map(f=>card((f.name||('Faction '+f.id))+' - individual contributions',
      '<p>Each score and attack count below comes from Torn official war report #'+id+'. Click a player to open their full dossier.</p>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Member</th><th>Score</th><th>Attacks</th><th>Share of faction score</th><th>Torn</th></tr></thead><tbody>'+
      f.members.slice().sort((a,b)=>b.score-a.score).map(p=>'<tr><td>'+infoButton(p.name||('Player '+p.id),p.id)+(f.id===positive(cfg.enemyId)?' '+ffBadge(p.id):'')+
      '<br><small>#'+p.id+' | Lv '+fmt(p.level)+'</small></td><td>'+fmt(p.score)+'</td><td>'+fmt(p.attacks)+'</td><td>'+
      (f.score>0?fmt(100*p.score/f.score)+'%':'\u2014')+'</td><td>'+a('Profile',link(p.id))+'</td></tr>').join('')+
      '</tbody></table></div>')).join('');
    return html;
  }
  function intel(){
    if(state.selectedWar)return warReportView(state.selectedWar);
    const fid=positive(cfg.enemyId),m=factionWarMetrics('enemies'),last=m.last,
      ours=sideActivity('ours'),them=sideActivity('enemies');
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">OPPONENT DOSSIER | CLICK TO INVESTIGATE</span>'+
      '<h2>'+(state.data.war?.opponentName?esc(state.data.war.opponentName):fid?'Faction #'+fid:'No opponent selected')+'</h2>'+
      '<p>Official history, current roster, player contributions, observed online behaviour and your own tactical notes in one place.</p>'+
      '<div class="ws-toolbar">'+(fid?a('Open faction in Torn',factionLink(fid)):'')+
      b('View all players','tab:targets')+b('Full war history','tab:history')+b('After-action reports','tab:afteraction')+b('Scan 20 past wars','deep-scan')+b('Activity hours','tab:activity')+'</div></div>'+
      '<div class="ws-grid">'+
      statAction('Last war score',scoreLabel(m.lastScore),m.last?'War #'+m.last.id+' | '+esc(stamp(m.last.end*1000)):'No completed war','tab:history')+
      statAction('Enemy faced',scoreLabel(m.lastAgainst),m.last?'Opponent score in latest war':'No historical score','tab:history')+
      statAction('Wins / decided',m.decided?m.wins+' / '+m.decided:'\u2014','Loaded ranked-war records','tab:history')+
      statAction('Average war score',scoreLabel(m.scoreAvg),'Official completed-war scores in this sample','tab:history')+
      statAction('Active last 24h',them.total?them.active24+' / '+them.total:'\u2014','From last-action timestamps only','tab:activity')+
      statAction('Online now',them.total?them.online+' / '+them.total:'\u2014','Latest observed enemy roster','tab:activity')+'</div>';
    html+=card('Faction strength, leadership and rank | official',factionBasicsHtml());
    if(last){
      const reportStored=state.data.reports[last.id];
      html+=card('Most recent completed ranked war | #'+last.id,
        '<p><b>Enemy '+scoreLabel(m.lastScore)+' / Opponent '+scoreLabel(m.lastAgainst)+'</b> | '+
        (last.winner===fid?'Victory':last.winner?'Defeat':'Outcome pending')+'</p>'+
        '<p>'+esc(stamp(last.start*1000))+' to '+esc(stamp(last.end*1000))+'</p>'+
        '<div class="ws-toolbar">'+b('Open scorecard and every player','war:'+last.id)+
        (reportStored?'':b('Fetch detailed report','load-report:'+last.id))+'</div>');
    }
    const leaders=perMemberRows('enemies',80),covered=leaders.filter(x=>x.last!==null);
    html+=card('Enemy roster | latest officially recorded individual scores',
      '<p>'+covered.length+' of '+leaders.length+' current members have a score in a fetched historical report. These scores may refer to different wars where the latest report is missing.</p>'+
      (leaders.length?'<div class="ws-table-wrap"><table><thead><tr><th>Player (open dossier)</th><th>War score</th><th>Historic avg</th><th>Last action</th><th>Status</th><th>Action</th></tr></thead><tbody>'+
      leaders.map(x=>'<tr><td>'+infoButton(x.p.name,x.p.id)+' '+ffBadge(x.p.id)+'<br><small>#'+x.p.id+' Lv '+fmt(x.p.level)+'</small></td>'+
      '<td><b>'+scoreLabel(x.last)+'</b></td><td>'+scoreLabel(x.lifetime.avg)+'</td>'+
      '<td>'+esc(x.p.lastAction)+'<br><small>'+esc(age(x.p.lastAt))+'</small></td>'+
      '<td>'+pill(x.p.status,memberState(x.p)==='okay'?'good':'')+'</td>'+
      '<td>'+a('Profile',link(x.p.id))+' '+a('Attack',attackLink(x.p.id))+'</td></tr>').join('')+
      '</tbody></table></div>':empty('No enemy roster yet. Set an opponent or open War during active matchmaking.')));
    html+=ffStatusPanel();
    const matches=(state.data.enemyWars||[]).filter(w=>w.end).slice().sort((a,b)=>b.end-a.end).slice(0,6);
    html+=card('Previous enemy wars | official scorelines',
      matches.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>War</th><th>Result</th><th>Enemy / Opponent</th><th>Details</th></tr></thead><tbody>'+
      matches.map(w=>{const one=w.scores.find(x=>x.id===fid),other=w.scores.find(x=>x.id!==fid);return '<tr><td>'+
        b('#'+w.id,'war:'+w.id)+'<br><small>'+esc(stamp(w.end*1000))+'</small></td><td>'+
        pill(w.winner===fid?'Won':w.winner?'Lost':'Unknown',w.winner===fid?'good':'')+'</td><td>'+
        scoreLabel(one?.score)+' / '+scoreLabel(other?.score)+'</td><td>'+b('Scorecard','war:'+w.id)+'</td></tr>';}).join('')+
      '</tbody></table></div>':empty('No completed ranked wars have loaded yet. Refresh or select an enemy faction in Settings.'))+
      '<div class="ws-toolbar">'+b('See all past wars','tab:history')+'</div>';
    return html;
  }
  function threatRating(p){
    const last=lastKnownMemberScore('enemies',p.id);
    const hist=pastPerformance(p.id,'enemies');
    const max=state.data.enemies.reduce((m,e)=>Math.max(m,lastKnownMemberScore('enemies',e.id)||0),0);
    const scoreImpact=max>0&&last!==null?Math.round(65*last/max):0;
    const active24=Boolean(p.lastAt&&Date.now()-p.lastAt<24*HOUR);
    const online=isOnline(p),available=memberState(p)==='okay';
    const score=scoreImpact+(active24?15:0)+(online?10:0)+(available?10:0);
    const reason=last===null?'Low confidence; no official individual score':
      'Last score '+fmt(last)+' | '+(active24?'recently active':'not active in 24h');
    return {score:Math.min(100,Math.max(0,score)),reason,known:last!==null,
      note:'Priority index is derived from historical points and observed activity, never hidden battle strength.'};
  }
  // Times are read-only countdowns from the most recent Torn API roster, not predicted releases.
  function hospitalCountdown(until,at=Date.now()){
    if(!positive(until))return 'Hospital time unknown';
    const seconds=Math.ceil((until-at)/1000);
    if(seconds<=0)return 'Due now - refresh status';
    const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),sec=seconds%60;
    return h?h+'h '+String(m).padStart(2,'0')+'m '+String(sec).padStart(2,'0')+'s':
      m+'m '+String(sec).padStart(2,'0')+'s';
  }
  function rosterStatusExtra(p){
    const kind=memberState(p);
    if(kind==='hospital'){
      const until=positive(p.until);
      return '<div class="ws-roster-timing"><span data-ws-hospital-until="'+until+
        '" class="'+(until&&until-Date.now()<=5*MIN?'ws-timer-soon':'')+'">'+
        esc(hospitalCountdown(until))+'</span><small>Observed expiry, not a confirmed release</small></div>';
    }
    if(kind==='away'){
      const flight=flightEvidence(p);
      const label=flight.kind==='returning'?'Returning to Torn':
        flight.kind==='outbound'?'Departing / flying out':'Abroad / flight unclear';
      return '<div class="ws-roster-timing"><span>'+esc(label)+
        (flight.kind==='returning'&&flight.eta?' | '+esc(flightCountdown(flight.eta)):'')+
        '</span></div>';
    }
    return '';
  }
  function updateHospitalCountdowns(){
    if(!state.open)return;
    for(const el of $$('[data-ws-hospital-until]',root)){
      const until=positive(el.getAttribute('data-ws-hospital-until'));
      el.textContent=hospitalCountdown(until);
      const remaining=until-Date.now();
      el.classList.toggle('ws-timer-soon',Boolean(until&&remaining>0&&remaining<=5*MIN));
      el.classList.toggle('ws-timer-warning',Boolean(until&&remaining>5*MIN&&remaining<=15*MIN));
    }
  }
  function hospitalWatchCard(){
    if(!rosterFresh('enemies'))return card('Next hospital exits',
      '<p>Opponent roster is stale. Refresh before using any release window.</p>'+b('Refresh roster','refresh'));
    const releases=state.data.enemies.filter(p=>memberState(p)==='hospital'&&positive(p.until))
      .sort((a,b)=>a.until-b.until||a.id-b.id).slice(0,5);
    return card('Next hospital exits | observed Torn status',
      releases.length?'<p class="ws-small">Expiry is a countdown from the last official roster. A target may med out or be revived earlier; confirm Okay before attacking.</p>'+
      releases.map(p=>'<div class="ws-row"><span>'+infoButton(p.name,p.id)+' '+ffBadge(p.id)+
        '<br><small>Hospital until '+esc(stamp(p.until))+' | <b data-ws-hospital-until="'+positive(p.until)+'">'+
        esc(hospitalCountdown(p.until))+'</b></small></span>'+
        b('Intel','player:'+p.id)+' '+b(cfg.watchlist[p.id]?'Unwatch':'Watch','watch:'+p.id)+'</div>').join('')+
        '<div class="ws-toolbar">'+b('Sort all by hospital exit','tab:targets')+'</div>':
        empty('No opponents with known hospital-expiry data in the current roster.'));
  }
  function availabilitySortKey(p){
    const kind=memberState(p),flight=kind==='away'?flightEvidence(p):null;
    const rank=kind==='okay'?0:kind==='hospital'?1:
      flight?.kind==='returning'?2:flight?.kind==='outbound'?3:kind==='away'?4:5;
    return [rank,kind==='hospital'?positive(p.until)||Infinity:
      flight?.kind==='returning'?flight.eta||Infinity:Infinity];
  }
  function targetRows(){
    const q=state.search.trim().toLowerCase(),filter=state.filter;
    return state.data.enemies.filter(p=>{
      const ev=evaluate(p);
      if(q&&!((p.name+' '+p.id+' '+p.position).toLowerCase().includes(q)))return false;
      if(filter==='ready'&&!ev.ready)return false;
      if(filter==='online'&&!isOnline(p))return false;
      if(filter==='away'&&ev.kind!=='away')return false;
      if(filter==='returning'&&flightEvidence(p).kind!=='returning')return false;
      if(filter==='hospital'&&ev.kind!=='hospital')return false;
      if(filter==='scorers'&&lastKnownMemberScore('enemies',p.id)===null)return false;
      if(filter==='watched'&&!cfg.watchlist[p.id])return false;
      if(filter==='ff'&&ffLabel(p.id).source!=='estimate')return false;
      return true;
    }).sort((a,b)=>{
      if(state.sort==='availability'||state.sort==='hospital'){
        const ak=availabilitySortKey(a),bk=availabilitySortKey(b);
        if(state.sort==='hospital'){
          if(ak[0]===1&&bk[0]!==1)return -1;
          if(bk[0]===1&&ak[0]!==1)return 1;
        }
        return ak[0]-bk[0]||ak[1]-bk[1]||evaluate(b).score-evaluate(a).score||a.id-b.id;
      }
      if(state.sort==='ff')return (ffLabel(b.id).source==='estimate'?ffLabel(b.id).ff:-1)-(ffLabel(a.id).source==='estimate'?ffLabel(a.id).ff:-1)||a.id-b.id;
      if(state.sort==='threat')return threatRating(b).score-threatRating(a).score||a.id-b.id;
      if(state.sort==='lastwar')return (lastKnownMemberScore('enemies',b.id)??-1)-(lastKnownMemberScore('enemies',a.id)??-1)||a.id-b.id;
      if(state.sort==='activity')return n(b.lastAt)-n(a.lastAt)||a.id-b.id;
      if(state.sort==='level')return b.level-a.level||a.id-b.id;
      if(state.sort==='online')return pattern('enemies',b.id).online-pattern('enemies',a.id).online||a.id-b.id;
      return evaluate(b).score-evaluate(a).score||a.id-b.id;
    });
  }
  function targets(){
    const row=targetRows(),total=state.data.enemies.length;
    const chips=['all','ready','online','hospital','away','returning','scorers','ff','watched'].map(f=>
      '<button class="ws-btn '+(state.filter===f?'':'secondary')+'" data-filter="'+f+'">'+
      esc(f==='ready'?'Okay':f==='scorers'?'War scorers':f==='ff'?'Has FF':f==='watched'?'Watched':f==='returning'?'Inbound flights':f)+'</button>').join('');
    let html=statusNote()+
      '<div class="ws-lead"><span class="ws-data-label">ENEMY PLAYERS | OPEN ANY NAME FOR FULL INTELLIGENCE</span>'+
      '<h2>'+row.length+' shown / '+total+' current enemies</h2>'+
      '<p>Live state, last action, official war performance and observed travel are separate evidence sources. Unknown scores are never treated as zero.</p></div>'+
      '<div class="ws-toolbar"><input type="search" id="ws-search" placeholder="Search name, ID or role" value="'+esc(state.search)+'" aria-label="Find enemy player">'+
      '<select id="ws-sort" aria-label="Sort enemy players">'+
      [['warScore','Recommended priority'],['availability','Availability: Okay first'],['hospital','Hospital release soonest'],['ff','FF highest first'],['threat','Historical threat index'],['lastwar','Last reported war score'],['activity','Most recently active'],['online','Observed online rate'],['level','Level high to low']]
      .map(x=>'<option value="'+x[0]+'" '+(state.sort===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></div>'+
      '<div class="ws-toolbar">'+chips+'</div>'+ffStatusPanel();
    if(!row.length)return html+empty('No matching opponents. Clear filters, refresh, or configure a faction in Settings.');
    return html+'<div class="ws-table-wrap"><table><thead><tr><th>Opponent + FF</th><th>Current state</th><th>Last activity</th><th>Last reported score</th><th>War priority</th><th>Travel / intel</th><th>Go to</th></tr></thead><tbody>'+
      row.map(p=>{const ev=evaluate(p),pat=ev.pat,ff=ffObserved(p.id),third=ffscouter(p.id);
        const score=lastKnownMemberScore('enemies',p.id);
        return '<tr><td>'+infoButton(p.name,p.id)+' '+ffBadge(p.id)+'<br><small>#'+p.id+' | Lv'+fmt(p.level)+
          (p.position?' | '+esc(p.position):'')+'</small></td>'+
          '<td>'+pill(p.status,ev.ready?'good':ev.kind==='hospital'?'bad':'')+
          '<br><small>'+esc(p.statusText)+'</small>'+rosterStatusExtra(p)+'</td>'+
          '<td>'+pill(p.lastAction,isOnline(p)?'good':'')+'<br><small>'+esc(age(p.lastAt))+'</small></td>'+
          '<td><b>'+scoreLabel(score)+'</b><br><small>'+ev.hist.wars+' report(s) | avg '+scoreLabel(ev.hist.avg)+'</small></td>'+ 
          '<td>'+pill('Threat '+threatRating(p).score+'/100')+'<br><small>'+esc(threatRating(p).reason)+'</small></td>'+
          '<td><small>In-war travel: '+(pat.warTravel===null?'No samples':pat.warTravel+'% away')+
          (flightEvidence(p).kind==='returning'?'<br>Inbound '+(flightEvidence(p).eta?esc(stamp(flightEvidence(p).eta))+' ('+esc(flightCountdown(flightEvidence(p).eta))+')':'ETA unknown'):'')+
          '<br>Recorded team FF: '+(ff.avg===null?'No hits':ff.avg.toFixed(2)+'x / '+ff.count+' hits')+
          (third?.bss?'<br>Estimated BSS: '+fmt(third.bss):'')+'</small></td>'+
          '<td>'+b(cfg.watchlist[p.id]?'Unwatch':'Watch','watch:'+p.id)+' '+b('Copy ID','copy-player:'+p.id)+' '+infoButton('Full intel',p.id)+' '+a('Attack',attackLink(p.id))+' '+a('Profile',link(p.id))+'</td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<p class="ws-small">Scores shown only where official detailed reports exist. Attack links open Torn for manual action; no attack is submitted.</p>';
  }
  function encountersPanel(id){
    const rows=(state.data.attacks||[]).filter(a=>a.defender===positive(id)||a.attacker===positive(id))
      .sort((a,b)=>b.at-a.at).slice(0,20);
    if(!rows.length)return card('Recorded faction encounters',
      empty('No faction attack records for this player. If you have permission, enable Read faction attacks in Settings.'));
    return card('Recorded faction encounters | Torn attacks',
      '<p>Only attacks returned by your authorised faction API. FF values here are actual logged outcomes for the listed attacker, not predictions for other hitters.</p>'+
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Date</th><th>Attacker</th><th>Result</th><th>Actual FF</th><th>Respect</th></tr></thead><tbody>'+
      rows.map(a=>'<tr><td>'+esc(stamp(a.at))+'</td><td>'+
        (a.attacker?infoButton('Player #'+a.attacker,a.attacker):'Unknown')+'</td><td>'+esc(a.result)+
        '</td><td>'+(validFF(a.ff)===null?'--':a.ff.toFixed(2)+'x')+'</td><td>'+fmt(a.respect)+'</td></tr>').join('')+
      '</tbody></table></div>');
  }
  function playerIntel(id){
    let p=[...state.data.enemies,...state.data.ours].find(x=>x.id===id),side=state.data.ours.some(x=>x.id===id)?'ours':'enemies';
    if(!p){
      for(const rep of Object.values(state.data.reports)){
        const rs=rep.factions?.find(f=>f.members?.some(m=>m.id===id));
        if(!rs)continue;
        side=rs.id===positive(cfg.ourId)?'ours':'enemies';
        const member=rs.members.find(m=>m.id===id);
        p={id,name:member.name,level:member.level,position:'Previous war participant',status:'Unknown',
          statusText:'Not in current roster',lastAction:'Unknown',lastAt:0,updated:0,until:0,daysInFaction:0};
        break;
      }
    }
    if(!p)return empty('Player was not found in current rosters or stored official reports.');
    const pat=pattern(side,id),hist=pastPerformance(id,side),s=spy(id),
      myFf=ffObserved(id),third=ffscouter(id),records=recentWarRecords(side,id),
      current=state.data[side].some(x=>x.id===id),currentStatus=current?memberState(p):'unknown';
    const last=records.find(x=>x.covered&&x.member)||null;
    const note=cfg.notes[id]||'';
    if(!state.loading&&(!state.data.publicIntel[id]||
      Date.now()-n(state.data.publicIntel[id].at)>6*HOUR)&&
      Date.now()-n(state.publicRequested[id])>15*MIN){
      state.publicRequested[id]=Date.now();
      setTimeout(()=>{if(root.isConnected&&state.open&&!state.loading&&
        state.tab==='targets'&&positive(state.chosen)===positive(id))
        loadPublicIntel(id);},100);
    }
    let html=statusNote()+
      '<div class="ws-toolbar">'+b('Back to enemy players','tab:targets')+b('Opponent dossier','tab:intel')+
      a('Torn profile',link(id))+(side==='enemies'?a('Attack page',attackLink(id)):'')+'</div>'+
      '<div class="ws-lead"><span class="ws-data-label">PLAYER INTELLIGENCE | '+(side==='ours'?'OUR MEMBER':'OPPONENT')+'</span>'+
      '<h2>'+esc(p.name)+' ['+id+'] '+(side==='enemies'?ffBadge(id):'')+'</h2>'+
      '<div class="ws-inline-metrics"><span>Level '+fmt(p.level)+'</span><span>'+esc(p.position||'Role unknown')+'</span>'+
      '<span>'+esc(p.status)+'</span><span>Last action: '+esc(p.lastAction)+'</span></div>'+
      '<p>'+esc(p.statusText)+(p.statusDetails?' | '+esc(p.statusDetails):'')+
      (p.until&&p.until>Date.now()?' | Timer to '+esc(stamp(p.until)):'')+'</p>'+
      '<p class="ws-small">Roster '+age(p.updated)+' | Last action '+age(p.lastAt)+
      (p.daysInFaction?' | '+p.daysInFaction+' days in faction':'')+
      ' | Status is an observation, not a forecast.</p></div>'+
      '<div class="ws-grid">'+
      stat('Last reported war score',last?fmt(last.score):'\u2014',last?'War #'+last.war.id+' | '+fmt(last.attacks)+' attacks':'No detailed member report')+
      stat('All known war score',hist.wars?fmt(hist.score):'\u2014',hist.wars+' official reports | avg '+scoreLabel(hist.avg))+
      stat('Recent activity',current?esc(p.lastAction):'Unknown','Last action '+age(p.lastAt))+
      stat('Online checks',pat.count?pat.online+'%':'\u2014',pat.count+' samples | '+pat.reliability)+
      stat('Travel checks',pat.count?pat.travel+'%':'\u2014','War sample '+(pat.warTravel===null?'unknown':pat.warTravel+'%'))+
      stat('Observed FF',myFf.avg===null?'\u2014':myFf.avg.toFixed(2)+'x',myFf.count+' faction encounters')+'</div>';
    if(current){
      html+=card('More official roster indicators',
        '<div class="ws-inline-metrics"><span>Member for '+fmt(p.daysInFaction)+' days</span>'+
        '<span>'+(p.onWall?'Defending a wall':'Not defending a wall')+'</span>'+
        '<span>'+(p.revivable?'Revivable':'Revive disabled')+'</span>'+
        (p.earlyDischarge?'<span>Early hospital discharge available</span>':'')+
        (side==='ours'?'<span>'+(p.inOc?'Currently in OC':'Not currently in OC')+'</span>':'')+
        '</div><p class="ws-small">Torn public member record from '+esc(age(p.updated))+
        '. Opponent OC participation is not made available in this selection.</p>');
    }
    html+=card('Historical ranked-war performance',
      records.length?'<p>Official points and attacks from reports are shown per war. A dash means report or member data is unavailable, not zero.</p>'+
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>War</th><th>Score</th><th>Attacks</th><th>Outcome</th><th>Open</th></tr></thead><tbody>'+
      records.slice(0,20).map(x=>'<tr><td>'+esc(stamp(x.war.end*1000))+'<br><small>#'+x.war.id+'</small></td>'+
      '<td>'+scoreLabel(x.score)+'</td><td>'+scoreLabel(x.attacks)+'</td><td>'+
      pill(x.war.winner===positive(side==='ours'?cfg.ourId:cfg.enemyId)?'Won':x.war.winner?'Lost':'Unknown')+
      '</td><td>'+b('Scorecard','war:'+x.war.id)+'</td></tr>').join('')+'</tbody></table></div>':
      empty('No previous wars for this player are loaded on this device.'));
    if(side==='enemies')html+=memberWarTimeline(id);
    html+=encountersPanel(id);
    html+=card('Online and travel evidence',
      '<p>Observed '+pat.count+' foreground checks. Online '+(pat.count?pat.online+'%':'unknown')+
      ', away '+(pat.count?pat.travel+'%':'unknown')+
      '. During ranked wars: '+(pat.warTravel===null?'not sampled':pat.warTravel+'% away across '+pat.warSamples+' checks')+'.</p>'+
      '<p>Most-active observed TCT hour: '+(pat.peak===null?'Unknown':pat.peak+':00')+
      ' | Confidence '+esc(pat.reliability)+'. These figures are sample proportions, not proven hours awake or a past-war travel history.</p>'+
      b('See faction activity heatmap','tab:activity'));
    html+=card('Battle strength and fair-fight evidence',
      '<p><b>FFScouter for your registered key:</b> '+(third&&third.ff!==null?third.ff.toFixed(2)+'x estimated':'no estimate')+
      ' | Public BSS estimate: '+(third&&third.bss?fmt(third.bss):'unknown')+
      ' | Exact battle stats: '+(bsScore(s)===null?'unknown':esc(s.source||'Legacy spy'))+'</p>'+ 
      '<p><b>Do not compare different scales:</b> Public BSS is a square-root strength score; ' +
      'FFScouter estimated total ('+esc(third?.bsEstimate&&third.bsEstimate>0?nativeCompactTotal(third.bsEstimate):'unknown')+
      ') is a separate modelled guess. YATA can show a different estimate because it uses different evidence. '+
      'WarStaxx does not currently fetch YATA estimates.</p>'+
      '<p>FFScouter data source '+esc(third?.source||'unknown')+' | Public estimate updated '+esc(third?.updatedAt?age(third.updatedAt):'unknown')+
      ' | Retrieved '+esc(third?.at?age(third.at):'never')+
      ' | Approximate total stats '+esc(third?.bsHuman||'unknown')+'.</p>'+
      '<p><b>Exact-source BSS:</b> '+(bsScore(s)===null?'Unknown':fmt(bsScore(s)))+
      ' | Source '+esc(s?.source||'not available')+
      ' | Observation '+esc(s?.observedAt?age(s.observedAt):'unknown')+
      '. Exact enemy stats require an authorised existing Torn spy report.</p>'+
      '<p>Auto-loaded: own exact battle stats, readable Torn personal/faction spy reports and consented FFScouter public estimates. Missing stats remain unknown. Fair Fight is not a win probability.</p>'+
      '<details><summary>Legacy manual spy correction (optional)</summary>'+['strength','speed','defense','dexterity'].map(k=>'<label>'+esc(k)+
        '<input type="number" min="0" step="1" data-spy="'+esc(k)+'" value="'+esc(s&&s[k]!==undefined?s[k]:'')+'"></label>').join('')+
      '<div class="ws-toolbar">'+b('Save legacy spy','spy:'+id)+b('Clear legacy spy','clear-spy:'+id)+'</div></details>'+      '<div class="ws-toolbar">'+b('Refresh Torn API intel','refresh')+b('Matchups','tab:matchups')+b(cfg.watchlist[id]?'Unwatch player':'Watch player','watch:'+id)+'</div>');
    html+=card('Public Torn profile and personal stats',
      '<p>Public Torn profile and lifetime counters load automatically on opening this dossier, cached for six hours. They are not hidden battle stats.</p>'+
      b(state.loading?'Checking official profile...':'Refresh public stats','public:'+id)+publicStatsHtml(id));
    html+=card('Local player notes',
      '<label>Useful observations / tactical notes<textarea id="ws-note" maxlength="500">'+esc(note)+'</textarea></label>'+
      '<div class="ws-toolbar">'+b('Save note','note:'+id)+a('Open profile',link(id))+
      (side==='enemies'?a('Open manual attack',attackLink(id)):'')+'</div>');
    return html;
  }
  function matchups(){
    const friends=state.data.ours.slice().sort((a,b)=>
      Number(Boolean(cfg.blackSkulls[b.id]))-Number(Boolean(cfg.blackSkulls[a.id]))||a.name.localeCompare(b.name));
    const enemies=state.data.enemies;
    if(!friends.length||!enemies.length)return statusNote()+
      empty('Refresh both faction rosters before generating a personalised target list. Unknown matchups will remain unverified.');
    const chosen=positive(state.chosen)||friends[0].id,friend=friends.find(p=>p.id===chosen)||friends[0];
    const rows=personalShortlist(friend,state.showAllMatchups?enemies.length:25),
      verified=rows.filter(x=>x.tier===0).length;
    const friendly=state.hitterFilter==='black'?friends.filter(p=>cfg.blackSkulls[p.id]):
      state.hitterFilter==='ready'?friends.filter(p=>memberState(p)==='okay'):friends;
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">PERSONALISED TARGET INTELLIGENCE | EACH HITTER</span>'+
      '<h2>Who should each member consider attacking?</h2>'+
      '<p>Ranked by battle-stat matchup evidence first, then opponent availability and historical war contribution. An FFScouter badge relates to the API-key owner, not automatically the selected hitter.</p>'+
      '<div class="ws-toolbar">'+b('Leadership command','tab:command')+b('Opponent dossier','tab:intel')+
      b('Update rosters','refresh')+'</div></div>'+
      card('Choose hitter',
      '<label>Our faction member<select id="ws-friend">'+friends.map(p=>
        '<option value="'+p.id+'" '+(p.id===friend.id?'selected':'')+'>'+esc(p.name)+
        (cfg.blackSkulls[p.id]?' [BLACK SKULL]':'')+' ['+p.id+']</option>').join('')+'</select></label>'+
      '<div class="ws-inline-metrics"><span>Current status '+esc(friend.status)+'</span>'+
      '<span>Battle stats '+(bsScore(spy(friend.id))===null?'Unknown':esc(spy(friend.id)?.source||'Existing local spy'))+'</span>'+
      '<span>Confirmed favourable '+verified+' in the displayed sample</span>'+
      '<span>Active manual target '+(positive(cfg.assignments[friend.id])?'#'+cfg.assignments[friend.id]:'none')+'</span></div>'+
      '<p class="ws-small">Confirmed matchups require two recent exact stat records from the Torn API or existing reports. FFScouter public BSS estimates also provide provisional models for both factions without typing stats. Win probabilities remain unknown.</p>');
    html+=card('All our hitters | open an individual shortlist',
      '<div class="ws-toolbar"><label>Show<select id="ws-hitter-filter">'+
      [['all','Everyone'],['black','Black Skulls only'],['ready','Okay status only']].map(([value,label])=>
        '<option value="'+value+'" '+(state.hitterFilter===value?'selected':'')+'>'+label+'</option>').join('')+
      '</select></label></div>'+
      (friendly.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Hitter</th><th>Status</th><th>Top evidenced option</th><th>Matchup evidence</th><th>Open</th></tr></thead><tbody>'+
      friendly.map(p=>{
        const top=personalShortlist(p,1)[0];
        const confirmed=top?.tier===0;
        return '<tr><td>'+infoButton(p.name,p.id)+(cfg.blackSkulls[p.id]?' '+pill('Black Skull','good'):'')+
          '</td><td>'+pill(p.status,memberState(p)==='okay'?'good':'')+'</td>'+
          '<td>'+(top?infoButton(top.enemy.name,top.enemy.id)+' '+ffBadge(top.enemy.id):'No enemy loaded')+
          '</td><td>'+(top?pill(top.category,confirmed?'good':'')+'<br><small>'+esc(top.reason)+'</small>':'Unknown')+
          '</td><td>'+b('Personal shortlist','hitter:'+p.id)+'</td></tr>';
      }).join('')+'</tbody></table></div>':empty('No hitters match this filter.')));
    html+=card('Personal target shortlist | '+friend.name,
      '<p>'+(memberState(friend)==='okay'?'Member currently Okay.':'Member currently unavailable for hits; assignments below are for future planning.')+
      ' Results are advisory and require manual confirmation in Torn.</p>'+
      '<div class="ws-toolbar">'+b(state.showAllMatchups?'Show top 25':'Show all opponents','match-more')+
      b('Open leadership board','tab:command')+'</div>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Opponent + FF</th><th>Recommendation</th><th>Individual hitter model</th><th>Historical war score</th><th>Current status</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(x=>{
        const actual=ffObserved(x.enemy.id,friend.id);
        const evidence=x.match.known?'BS score ratio '+fmt(x.match.ratio)+' | '+esc(x.match.confidence):
          'Relative battle stats unavailable';
        return '<tr><td>'+infoButton(x.enemy.name,x.enemy.id)+' '+ffBadge(x.enemy.id)+
          '<br><small>Lv '+fmt(x.enemy.level)+' | #'+x.enemy.id+'</small></td>'+
          '<td>'+pill(x.category,x.tier===0?'good':x.tier===4?'bad':'')+
          '<br><small><b>'+esc(x.reliability)+'</b> | '+esc(x.reason)+
          ' | Prior recorded wins '+x.encounters.wins+' / losses '+x.encounters.losses+
          (x.conflict?' | Already assigned elsewhere':'')+'</small></td>'+
          '<td>'+(x.ffForHitter===null?'Unknown':x.ffForHitter.toFixed(2)+'x modelled')+
          '<br><small>'+evidence+
          (actual.avg!==null?'<br>Observed for this hitter '+actual.avg.toFixed(2)+'x ('+actual.count+')':'')+
          '</small></td><td>'+scoreLabel(x.official)+
          '<br><small>'+esc(x.official===null?'No official player score':'Stored war report')+'</small></td>'+
          '<td>'+pill(x.enemy.status,memberState(x.enemy)==='okay'?'good':'')+
          '<br><small>'+esc(x.enemy.lastAction)+'</small></td>'+
          '<td>'+b('Save manual target','assign:'+friend.id+':'+x.enemy.id)+
          ' '+infoButton('Full intel',x.enemy.id)+' '+a('Attack (manual)',attackLink(x.enemy.id))+'</td></tr>';
      }).join('')+'</tbody></table></div>');
    return html;
  }
  function strategy(){
    // Compare observed online coverage for both factions; never infer guaranteed availability.
    const ours=sideActivity('ours'),enemy=sideActivity('enemies'),wins=factionWarMetrics('enemies'),
      best=strongHours(),top=perMemberRows('enemies',10).filter(x=>x.last!==null).slice(0,5);
    let html=statusNote()+
      '<div class="ws-lead"><span class="ws-data-label">TACTICAL ANALYSIS | EVIDENCE FIRST</span><h2>How to approach this opponent</h2>'+
      '<p>Each recommendation leads to the actual supporting intelligence. A score, level or observed FF is not proof of an easy fight.</p>'+
      '<div class="ws-toolbar">'+b('Leadership command','tab:command')+b('Assign our hitters','tab:assignments')+b('Compare matchups','tab:matchups')+
      b('Review their wars','tab:history')+b('Compare war timelines','tab:timeline')+'</div></div>'+
      '<div class="ws-grid">'+
      statAction('Our online / their online',ours.total&&enemy.total?ours.online+' / '+enemy.online:'\u2014',
        'At last roster checks; our '+age(ours.last)+' | enemy '+age(enemy.last),'tab:activity')+
      statAction('Active in past 24h',enemy.total?enemy.active24+' / '+enemy.total:'\u2014',
        'Based on last-action timestamps','tab:targets')+
      statAction('Their historical wins',wins.decided?wins.wins+' / '+wins.decided:'\u2014',
        'Completed wars in this local sample','tab:history')+
      statAction('Known targets',top.length?String(top.length):'\u2014',
        'Top scorers with official reports','tab:intel')+'</div>';
    if(best.length){
      html+=card('Potential sampled strike windows',
        '<p>These are hourly sample comparisons from a limited set of checks; not predicted sleeping hours. Hours are TCT (UTC).</p>'+
        '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Hour</th><th>Our online checks</th><th>Their online checks</th><th>Difference</th><th>Sample coverage</th></tr></thead><tbody>'+
        best.slice(0,6).map(x=>'<tr><td>'+String(x.hour).padStart(2,'0')+':00</td><td>'+x.ours.pct+'%</td><td>'+x.theirs.pct+'%</td>'+
          '<td>'+fmt(x.advantage)+' percentage points</td><td>'+x.ours.samples+' / '+x.theirs.samples+'</td></tr>').join('')+
        '</tbody></table></div>'+b('Full 24h chart','tab:activity'));
    }
    html+=card('Highest scoring enemy players | official war reports',
      top.length?top.map(x=>'<div class="ws-row"><span>'+infoButton(x.p.name,x.p.id)+' '+ffBadge(x.p.id)+
      '<small> Last reported: '+fmt(x.last)+' pts | '+x.lifetime.wars+' reports | '+esc(x.p.lastAction)+'</small></span>'+
      a('Profile',link(x.p.id))+'</div>').join(''):
      empty('No individual scorecards stored yet. Open previous wars and fetch available reports.'));
    html+=card('Practical decisions',
      '<div class="ws-row"><span><b>1. Match capable hitters first</b><br><small>Do not turn an estimated FF into an assumed win.</small></span>'+b('Matchups','tab:matchups')+'</div>'+
      '<div class="ws-row"><span><b>2. Monitor their previous top contributors</b><br><small>Use official player scorecards and observed states.</small></span>'+b('Enemy intel','tab:intel')+'</div>'+
      '<div class="ws-row"><span><b>3. Choose coverage windows from evidence</b><br><small>Use the comparative 24-hour grid; gaps are unknown.</small></span>'+b('Activity','tab:activity')+'</div>'+
      '<div class="ws-row"><span><b>4. Coordinate Black Skulls assignments</b><br><small>Local manual instructions, ready for faction chat.</small></span>'+b('Orders','tab:assignments')+'</div>'+
      '<div class="ws-row"><span><b>5. Maintain energy and reserves</b><br><small>Review training and energy in the separate module.</small></span>'+b('Training','tool:happy')+'</div>');
    return html;
  }
  function activity(){
    // Avoid claiming individual player sleep schedules from sparse local observations.
    const ours=sideActivity('ours'),them=sideActivity('enemies'),o=hourlyEvidence('ours'),e=hourlyEvidence('enemies');
    const both=o.map((x,i)=>({hour:i,o:x,e:e[i],difference:x.pct===null||e[i].pct===null?null:x.pct-e[i].pct,
      enough:x.samples>=3&&e[i].samples>=3}));
    const summary=(state.data.enemies||[]).map(p=>({p,pat:pattern('enemies',p.id)}))
      .sort((a,b)=>b.pat.online-a.pat.online||b.pat.count-a.pat.count);
    let html=statusNote()+
      '<div class="ws-lead"><span class="ws-data-label">ACTIVITY INTELLIGENCE | 14-DAY OBSERVATIONS</span>'+
      '<h2>When are they actually active?</h2>'+
      '<p>Current online flags and last-action timestamps come from Torn. The hour-by-hour grid uses only samples collected while this script is running in the foreground.</p>'+
      '<div class="ws-toolbar">'+b('Enemy player intel','tab:targets')+b('Plan around activity','tab:strategy')+'</div></div>'+
      '<div class="ws-grid">'+
      stat('Our active in 24h',ours.total?ours.active24+' / '+ours.total:'\u2014','Official last-action timestamps')+
      stat('Enemy active in 24h',them.total?them.active24+' / '+them.total:'\u2014','Official last-action timestamps')+
      stat('Our online now',rosterFresh('ours')?ours.online+' / '+ours.total:'Stale','Snapshot '+age(ours.last))+
      stat('Enemy online now',rosterFresh('enemies')?them.online+' / '+them.total:'Stale','Snapshot '+age(them.last))+
      stat('Enemies away',rosterFresh('enemies')?fmt(them.away):'Stale','Travelling / abroad in last snapshot')+
      stat('Enemies hospitalised',rosterFresh('enemies')?fmt(them.hospital):'Stale','Last observed state')+'</div>';
    html+=card('24-hour online coverage | our faction vs enemy',
      '<p>Tap individual hourly cells to see the comparative evidence below. Green means more of our checks were online; red means more of theirs. Faded cells lack sufficient samples.</p>'+
      '<div class="ws-hour-grid">'+both.map(x=>'<button type="button" data-action="hour:'+x.hour+'" class="ws-hour '+(!x.enough?'unknown':x.difference>0?'positive':x.difference<0?'negative':'')+
      '" title="TCT '+x.hour+':00 | Us '+scoreLabel(x.o.pct)+'% ('+x.o.samples+' samples) | Them '+scoreLabel(x.e.pct)+'% ('+x.e.samples+' samples)">'+
      '<b>'+String(x.hour).padStart(2,'0')+'</b><small>'+(!x.enough?'?':(x.difference>0?'+':'')+x.difference+'%')+'</small></button>').join('')+'</div>'+
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Hour TCT</th><th>Us: online / samples</th><th>Them: online / samples</th><th>Advantage</th></tr></thead><tbody>'+
      both.map(x=>'<tr id="ws-hour-row-'+x.hour+'"><td>'+String(x.hour).padStart(2,'0')+':00</td><td>'+
        (x.o.pct===null?'Not observed':x.o.pct+'% | '+x.o.samples+' checks')+'</td><td>'+
        (x.e.pct===null?'Not observed':x.e.pct+'% | '+x.e.samples+' checks')+'</td><td>'+
        (x.enough?((x.difference>0?'+':'')+x.difference+' points'):'Not enough data')+'</td></tr>').join('')+
      '</tbody></table></div>'+
      '<p class="ws-small">Each check contributes once per member; this is not a continuous online record or a verified prediction of sleep. Both rosters need samples in the same hour for comparison.</p>');
    html+=card('Player-by-player activity and travel',
      summary.length?'<div class="ws-table-wrap"><table><thead><tr><th>Opponent</th><th>Online checks</th><th>General travel</th><th>War travel</th><th>Peak observed hour</th><th>Coverage</th><th>Intel</th></tr></thead><tbody>'+
      summary.map(x=>'<tr><td>'+infoButton(x.p.name,x.p.id)+' '+ffBadge(x.p.id)+'</td><td>'+
      (x.pat.count?x.pat.online+'%':'\u2014')+'</td><td>'+
      (x.pat.count?x.pat.travel+'%':'\u2014')+'</td><td>'+
      (x.pat.warTravel===null?'No war samples':x.pat.warTravel+'% / '+x.pat.warSamples+' checks')+'</td>'+
      '<td>'+(x.pat.peak===null?'Unknown':String(x.pat.peak).padStart(2,'0')+':00 TCT')+'</td>'+
      '<td>'+pill(x.pat.reliability)+'<br><small>'+x.pat.count+' checks</small></td><td>'+
      infoButton('Full intel',x.p.id)+'</td></tr>').join('')+'</tbody></table></div>':
      empty('No opponent observations yet. Open WarStaxx in the foreground during different hours to build reliable evidence.'))+
      '<p class="ws-small">An official war report cannot reconstruct how often someone travelled or was online during previous wars. In-war travel is shown only where this device actually sampled them during a war.</p>';
    return html;
  }
  function history(){
    const groups=[['Our faction','ours',cfg.ourId,state.data.ourWars],['Enemy faction','enemies',cfg.enemyId,state.data.enemyWars]];
    const coverage=historyCoverage();
    let html=statusNote()+'<div class="ws-lead"><span class="ws-data-label">OFFICIAL TORN RANKED-WAR RECORDS</span>'+
      '<h2>Previous war results, scores and detailed contributions</h2>'+
      '<p>Open any war to see total points, attacks, rank movement, rewards and individual score tables. Detailed reports: '+coverage.complete+' / '+coverage.total+' completed wars; '+coverage.missing+' missing ('+coverage.waiting+' on temporary Torn backoff). Missing reports retry automatically when permitted.</p>'+
      '<div class="ws-toolbar">'+b('Opponent summary','tab:intel')+b('Refresh war history','refresh')+b('Deep scan 20 wars','deep-scan')+'</div></div>';
    for(const [title,side,fid,history] of groups){
      const stats=factionWarMetrics(side);
      const wars=history.slice().sort((a,b)=>(b.end||b.start)-(a.end||a.start)).slice(0,20);
      html+=card(title+' | '+stats.wins+' wins in '+stats.decided+' decided wars',
        '<p>'+wars.length+' war records | average official score '+scoreLabel(stats.scoreAvg)+
        ' | latest '+(stats.last?'#'+stats.last.id:'unknown')+'</p>'+
        (wars.length?'<div class="ws-table-wrap"><table><thead><tr><th>War ID / Date</th><th>Result</th><th>Our side</th><th>Other side</th><th>Report</th><th>Action</th></tr></thead><tbody>'+
        wars.map(w=>{const thisSide=w.scores.find(x=>x.id===positive(fid)),
          other=w.scores.find(x=>x.id!==positive(fid));
          return '<tr><td>'+b('#'+w.id,'war:'+w.id)+'<br><small>'+esc(stamp(w.end*1000||w.start*1000))+'</small></td>'+
          '<td>'+pill(!w.end?'Ongoing':w.winner===positive(fid)?'Won':w.winner?'Lost':'Unknown',w.winner===positive(fid)?'good':'')+'</td>'+
          '<td>'+scoreLabel(thisSide?.score)+'<br><small>'+esc(thisSide?.name||'')+'</small></td>'+
          '<td>'+scoreLabel(other?.score)+'<br><small>'+esc(other?.name||'')+'</small></td>'+
          '<td>'+pill(state.data.reports[w.id]?'Stored official report':'Summary only')+'</td>'+
          '<td>'+b('War breakdown','war:'+w.id)+'</td></tr>';}).join('')+
        '</tbody></table></div>':empty('No previous wars loaded. Confirm the faction ID in Settings and refresh.')));
    }
    html+=card('Top recorded performers',
      '<div class="ws-grid">'+[['Our side','ours'],['Opponent','enemies']].map(([label,side])=>
      '<div><h3>'+label+'</h3>'+perMemberRows(side,10).filter(x=>x.last!==null)
      .map(x=>'<div class="ws-row">'+infoButton(x.p.name,x.p.id)+(side==='enemies'?' '+ffBadge(x.p.id):'')+
      '<span>'+fmt(x.last)+' recent score</span></div>').join('')+'</div>').join('')+'</div>');
    return html;
  }
  function orders(){
    const rows=assignments();
    return statusNote()+card('Member-by-member orders','<p>FF badges are FFScouter estimates for your key, not for each Black Skulls member. A modelled per-hitter FF appears in the reason column only when comparable BSS data exists. Unverified hits stay manual.</p>'+
      (!rows.length?empty('Your faction roster is missing. Refresh to load members.'):
      '<div class="ws-toolbar">'+b('Copy war orders','copy-orders')+'</div>'+ 
      '<div class="ws-table-wrap"><table><thead><tr><th>Our member</th><th>Next assignment</th><th>Reason / confidence</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(x=>'<tr><td>'+infoButton(x.friend.name,x.friend.id)+(cfg.blackSkulls[x.friend.id]?' '+pill('Black Skull','good'):'')+(isOnline(x.friend)?' '+pill('Online','good'):'')+'</td>'+
        '<td>'+(x.enemy?infoButton(x.enemy.name,x.enemy.id)+' '+ffBadge(x.enemy.id):'Scout / Support / Standby')+'</td>'+
        '<td>'+esc(x.reason)+(x.details?.known?'<br><small>'+x.details.verdict+'; '+x.friend.name+' model FF '+x.details.ff.toFixed(2)+'x</small>':'<br><small>Specific hitter FF unknown</small>')+'</td>'+
        '<td>'+(x.enemy?a('Profile',link(x.enemy.id))+' '+a('Attack',attackLink(x.enemy.id)):'')+
          ' '+b(cfg.blackSkulls[x.friend.id]?'Unmark Black Skull':'Mark Black Skull','black-skill:'+x.friend.id)+
          ' '+b('Clear order','clear-assign:'+x.friend.id)+'</td></tr>').join('')+'</tbody></table></div>'))+
      '<p class="ws-small">Orders are local unless optional officer-authorised shared sync is enabled. Nothing is posted to faction chat and no attacks run automatically.</p>';
  }
  function alertView(){
    return statusNote()+(state.alerts.length?state.alerts.map(x=>card(x.title,'<p>'+esc(x.detail)+'</p>'+b('Review now','tab:'+x.tab))).join(''):empty('No active actionable war alerts.')) ;
  }
  function settings(){
    return card('Torn API connection','<p>Use your Torn PDA API placeholder when supported, or save a personal key on this device. Torn API requests use api.torn.com. If you separately opt in to FFScouter below, your FFScouter key (or PDA key fallback) and requested target IDs are also sent to FFScouter. Do not export keys.</p>'+
      '<label>API key (saved locally, never displayed on diagnostics)<input id="ws-key" type="password" autocomplete="off" placeholder="'+(effectiveKey()?'Key available \u00b7 leave blank to keep':'Enter custom-scoped Torn API key')+'"></label>'+
      '<label><input type="checkbox" id="ws-auto-faction" '+(cfg.factionAuto!==false?'checked':'')+'> Automatically detect my faction from the Torn API (recommended)</label>'+
      '<p class="ws-small">Detected faction: '+(positive(cfg.ourId)?fmt(cfg.ourId):'Not detected yet')+
      ' | Source: '+esc(cfg.factionSource||'Awaiting API check')+
      (state.data.errors.identity?' | '+esc(state.data.errors.identity):'')+'</p>'+
      '<label>My faction ID (manual fallback when automatic detection is disabled)<input type="number" id="ws-our" min="1" value="'+(positive(cfg.ourId)||'')+'"></label>'+
      '<label>Opponent faction ID (auto-updated if a ranked war is detected)<input type="number" id="ws-enemy" min="1" value="'+(positive(cfg.enemyId)||'')+'"></label>'+
      '<label><input type="checkbox" id="ws-native-bubble" '+(cfg.nativeChainBubble===true?'checked':'')+'> Optional draggable chain bubble on the ranked-war page (off by default, never on attacks)</label>'+
      '<label><input type="checkbox" id="ws-native-war" '+(cfg.nativeWarEnabled!==false?'checked':'')+'> Enhance Torn native ranked-war player rows (status countdowns, Black Skulls, filters, copy)</label>'+
      '<label><input type="checkbox" id="ws-native-countries" '+(cfg.nativeWarCountryGroups!==false?'checked':'')+'> Group enemies by country (your location first, then alphabetical; Okay first)</label>'+
      '<label>Native ranked-war default sorting<select id="ws-native-sort">'+
      [['availability','Available first'],['hospital','Hospital first'],['bss','Highest BSS first'],['ff','Highest FF first'],['activity','Most recently active'],['torn','Leave Torn order unchanged']].map(([value,label])=>
        '<option value="'+value+'" '+((cfg.nativeWarSort||'availability')===value?'selected':'')+'>'+label+'</option>').join('')+
      '</select></label><p class="ws-small">Native controls appear inside Torn faction ranked-war lists, not on attack pages. If TWSE or FFScouter is sorting, WarStaxx will not override their order. Official read-only status polls every 20 seconds while the ranked-war page is visible; Torn API backoff is respected.</p>'+
      '<label>War bar visibility<select id="ws-strip-scope">'+
      [['contextual','Compact summary outside war pages (recommended)'],
       ['faction','Only show on faction / war pages'],
       ['everywhere','Full bar elsewhere (never while attacking)']].map(([value,label])=>
         '<option value="'+value+'" '+((cfg.warStripScope||'contextual')===value?'selected':'')+'>'+label+'</option>').join('')+
      '</select></label><p class="ws-small">WarStaxx always hides the bar on the Torn attack screen. The TornStaxx launcher remains available.</p>'+
      '<label>Automatic refresh<select id="ws-interval">'+[90,120,180,300].map(s=>'<option value="'+s+'" '+(cfg.refreshSeconds===s?'selected':'')+'>'+s+' seconds while visible</option>').join('')+'</select></label>'+
      '<label>Historical wars per side<select id="ws-limit">'+[3,5,8,12,20].map(s=>'<option value="'+s+'" '+(cfg.historyLimit===s?'selected':'')+'>'+s+' wars</option>').join('')+'</select></label>'+
      '<label><input type="checkbox" id="ws-conceded" '+(cfg.autoConceded!==false?'checked':'')+'> Automatically count enemy ranked-war points earned against each of our members. Requires Limited faction attacks permission on your Torn API key; partial data is clearly marked.</label>'+ 
      '<label><input type="checkbox" id="ws-attacks" '+(cfg.enableAttacks?'checked':'')+'> Read faction attacks (optional faction API permission): FF observations, sampled ranked-war hit ledger and live opponent scoring where available</label>'+ 
      '<label><input type="checkbox" id="ws-owner-ready" '+(cfg.autoOwnerReadiness!==false?'checked':'')+'> Read my own energy and medical cooldown (only the Torn API-key owner; requires user bars/cooldowns permissions)</label>'+
      '<label><input type="checkbox" id="ws-priority-notifications" '+(cfg.priorityNotifications!==false?'checked':'')+
      '> Show enemy newly available alerts when a verified important opponent changes to Okay (foreground observation only)</label>'+ 
      '<h3>FFScouter \u00b7 optional, independent service</h3><p>When enabled with explicit consent, WarStaxx uses your registered FFScouter key or your existing Torn PDA key if the separate field is empty. It sends that key and target player IDs to FFScouter, not to TornStaxx hub. You must first register the key with FFScouter. Read the <a href="https://ffscouter.com/#data-policy" target="_blank" rel="noopener noreferrer">FFScouter data policy</a>; free and premium plans may offer different data.</p>'+ 
      '<label>Optional FFScouter-specific API key<input id="ws-ffkey" type="password" autocomplete="off" placeholder="'+(cfg.ffKey?'Separate key saved; blank keeps it':effectiveKey()?'Uses your Torn PDA key when opted in':'Enter a registered key or connect Torn PDA key')+'"></label>'+ 
      '<label><input type="checkbox" id="ws-ff-consent" '+(cfg.ffConsent?'checked':'')+'> I have read the FFScouter data policy and knowingly enable this third-party lookup.</label>'+ 
      '<label><input type="checkbox" id="ws-ff-enable" '+(cfg.ffEnabled?'checked':'')+'> Show estimated FF next to players and fetch no more than once per 10 minutes.</label>'+
      '<div class="ws-toolbar">'+b('Save settings','save-settings')+b('Verify FF key','check-ff-key')+b('Refresh FF','refresh-ff')+b('Use PDA key for FF','clear-ff-key')+b('Detect my faction now','detect-faction')+b('Refresh all now','refresh')+b('Clear stored API key','clear-key')+'</div>'+
      '<p class="ws-small">API access depends on your custom key scope. Opponent member lists and ranked-war history use public selections; your own detailed attacks require faction access.</p>')+
      card('Local intelligence controls','<p>War histories, observations and spy reports stay in this device browser storage. Only selected role/order fields sync to an explicitly configured Worker.</p>'+
      b('Reset activity samples only','reset-activity')+' '+b('Clear this opponents orders','reset-orders'))+
      card('Shared faction war orders | opt-in synchronisation',
        '<p>Requires your own deployed WarStaxx Cloudflare Worker and D1 database. Share ONLY assignments, Black Skull tags, per-hitter risk profiles, hospital watchers, defensive duties, leadership statuses and the agreed heavy-target strength cutoff. Torn API keys and manual spies stay on this device.</p>'+
        '<p><b>State:</b> '+(cfg.shared.enabled?'Enabled':'Off')+
        ' | <b>Revision:</b> '+fmt(cfg.shared.revision||0)+
        ' | <b>Local changes:</b> '+(cfg.shared.localDirty?'Not published':'None')+
        (state.sharedError?' | '+esc(state.sharedError):'')+'</p>'+
        '<label><input type="checkbox" id="ws-shared-enable" '+(cfg.shared.enabled?'checked':'')+
        '> Enable shared faction orders (foreground only)</label>'+
        '<label>Worker HTTPS base URL<input id="ws-shared-endpoint" type="url" autocomplete="off" placeholder="https://your-worker.workers.dev" value="'+esc(cfg.shared.endpoint||'')+'"></label>'+
        '<label>Shared read/write token (stored locally; leave blank to keep)<input id="ws-shared-token" type="password" autocomplete="off" placeholder="'+(cfg.shared.token?'Token saved; leave blank to keep':'Shared faction token')+'"></label>'+
        '<label><input type="checkbox" id="ws-shared-write" '+(cfg.shared.canWrite?'checked':'')+
        '> I have the officer write token and may publish orders</label>'+
        '<p class="ws-small">Click Save settings first. Readers get automatic updates while Torn PDA is visible. Writer edits publish after a short delay. Revisions prevent silently overwriting newer orders. If you already have local orders, choose explicitly whether to publish or replace them.</p>'+
        '<div class="ws-toolbar">'+b('Pull shared orders','shared-pull')+
        b('Publish my local orders','shared-push')+
        b('Discard local and pull shared','shared-adopt')+'</div>')+
      card('Other tools','<div class="ws-toolbar">'+b('Happy Jump','tool:happy')+b('ProfitStaxx','tool:profit')+b('Company Helper','tool:company')+'</div>');
  }
  function diagnostics(){
    const d=state.data;
    return card('Safe diagnostics','<p>Version '+VER+' \u00b7 API key '+(effectiveKey()?'available':'missing')+' \u00b7 local storage '+(state.localKeyError?'problem':'available')+'</p>'+
      '<p>Own faction: '+(positive(cfg.ourId)?fmt(cfg.ourId):'unknown')+
      ' | Source: '+esc(cfg.factionSource||'Not detected')+
      ' | Mode: '+(cfg.factionAuto===false?'manual':'automatic')+
      ' | Verified: '+esc(age(cfg.factionVerifiedAt))+'</p>'+
      '<p>Opponent ID: '+(positive(cfg.enemyId)?'configured':'missing')+'</p>'+
      '<p>Last known roster: '+esc(age(Math.max(n(d.updated.enemies),n(d.updated.ours))))+'</p>'+ 
      '<p>Own energy/cooldown: '+(cfg.autoOwnerReadiness?'enabled':'disabled')+' | owner ID '+(positive(d.meta?.ownerId)?'detected':'unknown')+
      ' | exact owner stats '+esc(age(d.autoSpies?.[positive(d.meta?.ownerId)]?.observedAt))+
      ' | cached exact stat readings '+fmt(Object.keys(d.autoSpies||{}).length)+
      ' | energy last read '+esc(age(d.ownerReadiness?.energy?.at))+
      ' | medical last read '+esc(age(d.ownerReadiness?.cooldown?.at))+'</p>'+ 
      '<p>FFScouter: '+(cfg.ffEnabled?'enabled':'disabled')+' | consent '+(cfg.ffConsent?'yes':'no')+
      ' | registration '+(d.meta?.ffRegistration?.registered?'verified':d.meta?.ffRegistration?.registered===false?'not registered':'unchecked')+
      ' | API bridge '+(typeof PDA_httpGet==='function'?'Torn PDA':typeof GM_xmlhttpRequest==='function'?'GM':'missing')+
      ' | last success '+esc(age(d.updated.ffscouter))+' | '+ffCoverage().covered+' fresh results</p>'+
      '<h3>Source freshness and API errors</h3>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Endpoint</th><th>Last success</th><th>Last error</th></tr></thead><tbody>'+
      [...new Set([...Object.keys(d.updated),...Object.keys(d.errors)])].slice(0,60).map(k=>
        '<tr><td>'+esc(k)+'</td><td>'+esc(age(d.updated[k]))+'</td><td>'+esc(d.errors[k]||'\u2014')+'</td></tr>').join('')+
      '</tbody></table></div><p class="ws-small">This diagnostic screen deliberately excludes keys, imported spy values, saved notes and individual activity samples.</p>');
  }
  // Local-only search across current rosters, stored reports and tool sections.
  function finderMatches(term){
    const q=String(term||'').trim().toLowerCase();
    if(q.length<2)return [];
    const out=[],seen=new Set(),max=14;
    const addPlayer=(p,side,live)=>{
      const id=positive(p?.id),name=String(p?.name||('Player '+id));
      if(!id||seen.has(id)||!(name.toLowerCase().includes(q)||String(id).includes(q)))return;
      seen.add(id);
      out.push({kind:'player',id,label:name+' ['+id+']',
        detail:live?(side==='ours'?'Our faction':'Opponent')+
          (rosterFresh(side)?' | '+String(p.status||'Unknown'):' | cached status (stale)'):
          'Stored official war report (not current roster)'});
    };
    for(const side of ['ours','enemies'])for(const p of state.data[side]||[]){
      if(out.length>=max)break;
      addPlayer(p,side,true);
    }
    if(out.length<max)for(const record of Object.values(state.data.reports||{})){
      for(const faction of record?.factions||[]){
        for(const p of faction.members||[]){
          if(out.length>=max)break;
          addPlayer(p,'',false);
        }
        if(out.length>=max)break;
      }
      if(out.length>=max)break;
    }
    const tabs=sections.filter(id=>String(labels[id]||id).toLowerCase().includes(q)||id.includes(q))
      .map(id=>({kind:'tab',id,label:labels[id]||id,detail:'WarStaxx screen'}));
    return [...out,...tabs].slice(0,max);
  }
  function drawFinder(){
    const field=$('#ws-find-input',root),results=$('#ws-finder-results',root),panel=$('#ws-finder',root);
    if(!field||!results||!panel||panel.hidden)return;
    const query=String(field.value||'').trim();
    if(query.length<2){
      results.innerHTML='<small>Type at least two characters to find stored players or WarStaxx screens.</small>';
      return;
    }
    const found=finderMatches(query);
    results.innerHTML=found.length?found.map(x=>
      '<button type="button" class="ws-finder-result" data-action="finder-'+x.kind+':'+esc(x.id)+'">'+
      '<span><strong>'+esc(x.label)+'</strong><small>'+esc(x.detail)+'</small></span>'+
      '<span aria-hidden="true">View</span></button>').join(''):
      '<small>No stored matches. Refresh rosters or collect more official history.</small>';
  }
  function closeFinder(){
    const panel=$('#ws-finder',root),field=$('#ws-find-input',root),results=$('#ws-finder-results',root);
    if(panel)panel.hidden=true;
    if(field)field.value='';
    if(results)results.textContent='';
  }
  let previousBodyOverflow=null,previousModalFocus=null;
  function render(){
    if(!root.isConnected)return;
    root.style.display=state.open?'block':'none';
    renderWarStrip();
    if(!state.open)return;
    const simple=(()=>{try{return JSON.parse(localStorage.getItem('staxx-hub-mode-v1'))!=='advanced';}catch(_){return true;}})();
    // The permanent Torn strip is layer 0; the modal has exactly three primary screens.
    // All legacy deep links remain valid and are reachable from Reports / Opponent.
    const primary=['overview','enemy','reports'];
    const detailGroup=['intel','targets','matchups','timeline','activity','history','threats']
      .includes(state.tab)?'enemy':'reports';
    $('.ws-tabs',root).innerHTML=primary.map(tab=>
      '<button type="button" class="'+((state.tab===tab||
        !primary.includes(state.tab)&&tab===detailGroup)?'on':'')+
      '" data-tab="'+tab+'">'+esc(labels[tab])+'</button>').join('');
    const pages={overview,enemy:enemyScreen,reports:reportsScreen,leader:leaderScreen,skulls:blackSkullsRoom,commander,operations,ledger,threats,control,turtle,command,pace,afteraction,intel,targets,matchups,timeline,strategy,activity,history,assignments:orders,alerts:alertView,settings,diagnostics};
    const content=$('.ws-content',root);
    const scroll=content.scrollTop;
    const active=document.activeElement;
    // Preserve keyboard focus when polling redraws the current view.
    const focusData=active&&content.contains(active)?{
      id:active.id||'',action:active.getAttribute('data-action')||'',
      field:['data-spy','data-ready-energy','data-ready-medical','data-leader-target',
        'data-leader-duty','data-skull-risk','data-control-target','data-turtle-duty']
        .map(name=>[name,active.getAttribute(name)]).find(([,value])=>value!==null),
      selection:typeof active.selectionStart==='number'?active.selectionStart:null
    }:null;
    const form=state.tab==='settings'?Array.from(content.querySelectorAll('input,select,textarea')).map(x=>({id:x.id,checked:x.checked,value:x.value,type:x.type})):null;
    const priorLeaderNote=state.tab==='command'&&$('#ws-leader-note',content)?$('#ws-leader-note',content).value:null;
    // Do not lose manually typed spy readings and notes when a refresh redraws
    // the same profile. Never carry a draft to a DIFFERENT opponent.
    const samePlayer=state.tab==='targets'&&state.playerOpen&&
      state.renderedPlayerId===positive(state.chosen);
    const playerDraft=samePlayer&&!state.skipDraftRestore?
      Array.from(content.querySelectorAll('[data-spy],#ws-note')).map(x=>({
        id:x.id||'',stat:x.getAttribute('data-spy'),value:x.value
      })):null;
    try{
      const detail=!primary.includes(state.tab)?
        '<div class="ws-toolbar">'+b('Back to '+(detailGroup==='enemy'?'Opponent':'Reports'),
          'tab:'+detailGroup)+' '+pill(labels[state.tab]||state.tab)+'</div>':'';
      content.innerHTML=detail+(state.tab==='targets'&&state.playerOpen?
        playerIntel(state.chosen):(pages[state.tab]||overview)());
    }catch(e){content.innerHTML=empty('Render error: '+String(e.message||e));}
    if(form)for(const prior of form){if(!prior.id)continue;const field=content.querySelector('#'+prior.id);
      if(!field)continue;if(prior.type==='checkbox')field.checked=prior.checked;else field.value=prior.value;}
    if(priorLeaderNote!==null&&$('#ws-leader-note',content))$('#ws-leader-note',content).value=priorLeaderNote;
    if(playerDraft)for(const old of playerDraft){
      const field=old.stat!==null?
        Array.from(content.querySelectorAll('[data-spy]')).find(x=>x.getAttribute('data-spy')===old.stat):
        old.id==="ws-note"?$('#ws-note',content):null;
      if(field)field.value=old.value;
    }
    state.renderedPlayerId=state.tab==='targets'&&state.playerOpen?positive(state.chosen):0;
    state.skipDraftRestore=false;
    content.scrollTop=scroll;
    if(focusData){
      const controls=Array.from(content.querySelectorAll('button,input,select,textarea,a[href]'));
      const same=controls.find(x=>(focusData.id&&x.id===focusData.id)||
        (focusData.action&&x.getAttribute('data-action')===focusData.action)||
        (focusData.field&&x.getAttribute(focusData.field[0])===focusData.field[1]));
      if(same)try{
        same.focus({preventScroll:true});
        if(focusData.selection!==null&&typeof same.setSelectionRange==='function')
          same.setSelectionRange(focusData.selection,focusData.selection);
      }catch(_){}
    }
    drawFinder();
    $('.ws-sync',root).textContent=state.loading?'Checking Torn\u2026':Math.max(n(state.data.updated.enemies),n(state.data.updated.ours))?'Last observation '+age(Math.max(n(state.data.updated.enemies),n(state.data.updated.ours))):'Not connected yet';
    $('.ws-head [data-action="refresh"]',root).disabled=state.loading;
  }
  function navigate(tab,focus){
    if(!sections.includes(tab))tab='overview';
    state.tab=tab;state.open=true;state.playerOpen=false;state.selectedWar=0;
    root.style.display='block';render();
    $('.ws-content',root).scrollTop=0;
    if(focus)setTimeout(()=>$('#ws-alert-'+focus,root)?.scrollIntoView({block:'center'}),100);
  }
  function open(detail={}){
    try{
      if(!root.isConnected)document.body.appendChild(root);
      const wasClosed=!state.open;
      if(wasClosed){
        previousModalFocus=document.activeElement;
        if(document.body){
          previousBodyOverflow=document.body.style.overflow;
          document.body.style.overflow='hidden';
        }
      }
      state.open=true;
      root.style.display='block';
      root.style.visibility='visible';
      root.style.pointerEvents='auto';
      if(detail.alertId){
        const alert=currentAlerts().find(a=>a.id===detail.alertId);
        if(alert?.targetId&&state.data.enemies.some(p=>p.id===positive(alert.targetId))){
          navigate('targets');state.chosen=positive(alert.targetId);state.playerOpen=true;render();
        }else navigate(alert?.tab||'alerts',detail.alertId);
      }
      else navigate(sections.includes(detail.section)?detail.section:state.tab);
      // Take focus into the dialog on first open; do not jump focus on internal navigation.
      if(wasClosed)try{$('.ws-tabs button',root)?.focus({preventScroll:true});}catch(_){}
      // Announce opening only after mounting the real visible UI.
      event('panel',{id:ID,open:true});
      if(effectiveKey() && !state.loading && Date.now()-state.lastRefresh>90*1000)refresh(false);
    }catch(err){
      window.__warStaxxStartError='Panel could not open ('+(err?.name||'Error')+')';
      state.open=true;root.style.display='block';
      const area=$('.ws-content',root);
      if(area)area.textContent='War-TornStaxx could not render its panel. '+
        window.__warStaxxStartError+'. Reload Torn and review TornStaxx diagnostics. Saved data was not deleted.';
      event('panel',{id:ID,open:true});
    }
  }
  function close(){
    state.open=false;render();
    if(previousBodyOverflow!==null&&document.body)document.body.style.overflow=previousBodyOverflow;
    previousBodyOverflow=null;
    if(previousModalFocus?.isConnected)try{previousModalFocus.focus({preventScroll:true});}catch(_){}
    previousModalFocus=null;
    event('panel',{id:ID,open:false});
  }
  function handle(action){
    if(action==='refresh'){refresh(true);return;}
    if(action.startsWith('copy-player:')){
      const id=positive(action.slice(12));
      const p=[...state.data.enemies,...state.data.ours].find(x=>x.id===id);
      if(!p)return;
      const value=p.name+' ['+p.id+']';
      const done=()=>{confirmed('Copied '+p.name+' ['+p.id+']');render();};
      const failed=()=>{state.error='Copy unavailable on this device.';render();};
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(done).catch(failed);
      else{
        const area=document.createElement('textarea');
        area.value=value;area.style.cssText='position:fixed;left:-9999px';
        document.body.appendChild(area);area.select();
        let ok=false;try{ok=document.execCommand('copy');}catch(_){}
        area.remove();ok?done():failed();
      }
      return;
    }
    if(action==='scan-public'){
      if(state.scanning||state.loading)return;
      if(!effectiveKey()||!state.data.enemies.length){
        state.error='Official public scouting needs a Torn API key and a loaded opponent roster.';
        render();return;
      }
      state.scanning=true;state.loading=true;state.spinner='Scanning public Torn profiles';
      const before=publicIntelCoverage();render();
      refreshPublicIntel(6).then(count=>{
        const after=publicIntelCoverage();
        confirmed('Checked '+count+' opponent(s) with the public Torn API. Complete public dossiers '+
          before.complete+' to '+after.complete+' / '+after.total+'. Restricted data stays unknown.');
      }).catch(e=>{state.error='Public scouting failed: '+String(e.message||e).slice(0,120);})
        .finally(()=>{state.scanning=false;state.loading=false;state.spinner='';save();publish();render();});
      return;
    }
    if(action==='shared-pull'){sharedPull(false);return;}
    if(action==='shared-adopt'){sharedPull(true);return;}
    if(action==='shared-push'){sharedPush();return;}
    if(action==='war-more'){state.warMore=!state.warMore;render();return;}
    if(action==='fast-turtle'){warQuick('turtle');return;}
    if(action==='fast-skulls'){warQuick('skulls');return;}
    if(action==='fast-hit'){warQuick('hit');return;}
    if(action==='fast-heal'){warQuick('heal');return;}
    if(action==='commander-filter'){
      state.commanderFilter=state.commanderFilter==='black'?'all':'black';render();return;
    }
    if(action.startsWith('control-target:')){
      const id=positive(action.slice(15));
      if(state.data.enemies.some(p=>p.id===id)){state.controlFocus=id;navigate('control');}
      return;
    }
    if(action.startsWith('turtle-mode:')){
      const mode=action.slice(12);
      if(!['balanced','defensive','full'].includes(mode))return;
      const key=currentPlanKey(),prior=turtlePlan();
      cfg.turtlePlans[key]={mode,members:{...prior.members},updated:Date.now()};
      saveCfg();markSharedDirty();confirmed('Local defensive posture saved. No travel, medical or attack action occurred.');render();return;
    }
    if(action==='copy-ops'){
      const content=operationalBrief();
      if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
        navigator.clipboard.writeText(content).then(()=>{
          confirmed('Operations brief copied locally; share it manually if needed.');render();
        }).catch(()=>{state.error='Clipboard permission denied; no brief was shared.';render();});
      }else{
        const textarea=document.createElement('textarea');textarea.value=content;
        textarea.style.cssText='position:fixed;left:-9999px';document.body.appendChild(textarea);
        textarea.select();let copied=false;
        try{copied=document.execCommand('copy');}catch(_){}
        textarea.remove();copied?confirmed('Operations brief copied for manual sharing.'):state.error='Clipboard unavailable; no brief was shared.';render();
      }
      return;
    }
    if(action==='refresh-readiness'){refreshOwnReadiness().then(()=>{save();render();});return;}
    if(action.startsWith('debrief:')){state.selectedDebrief=positive(action.slice(8));navigate('afteraction');return;}
    if(action.startsWith('debrief-timeline:')){state.selectedTimeline=positive(action.slice(17));navigate('timeline');return;}
    if(action.startsWith('debrief-pace:')){state.selectedPace=positive(action.slice(13));navigate('pace');return;}
    if(action.startsWith('review-debrief:')){const id=positive(action.slice(15));const record=state.data.afterActions[id];
      if(record){record.reviewed=!record.reviewed;save();publish();render();}return;}
    if(action.startsWith('copy-squad:')){
      const [idText,side]=action.slice(11).split(':'),id=positive(idText);
      if(!id||!['black','regular'].includes(side)||!state.data.afterActions[id])return;
      const value=squadReportText(id,side);
      const success=()=>{confirmed((side==='black'?'Black Skulls':'Regular-member')+
        ' report copied for manual sharing.');render();};
      const failure=()=>{state.error='Clipboard unavailable; no report was shared.';render();};
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(success).catch(failure);
      else{const area=document.createElement('textarea');area.value=value;
        area.style.cssText='position:fixed;left:-9999px';document.body.appendChild(area);
        area.select();let ok=false;try{ok=document.execCommand('copy');}catch(_){}
        area.remove();if(ok)success();else failure();}
      return;
    }
    if(action.startsWith('copy-debrief:')){const id=positive(action.slice(13)),record=state.data.afterActions[id];
      if(!record)return;
      const value=afterActionText(record);
      if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(()=>{confirmed('After-action report copied for manual sharing.');render();}).catch(()=>{state.error='Clipboard access denied. Nothing was sent.';render();});}
      else{const area=document.createElement('textarea');area.value=value;area.style.cssText='position:fixed;left:-9999px';document.body.appendChild(area);area.select();let copied=false;try{copied=document.execCommand('copy');}catch(_){}area.remove();copied?confirmed('After-action report copied.'):state.error='Clipboard unavailable.';render();}return;
    }
    if(action.startsWith('save-readiness:')){
      const id=positive(action.slice(15));if(!state.data.ours.some(p=>p.id===id))return;
      const energyRaw=$('[data-ready-energy="'+id+'"]',root)?.value??'',
        medRaw=$('[data-ready-medical="'+id+'"]',root)?.value??'';
      const energy=energyRaw.trim()===''?null:energyValue(energyRaw);
      const med=medRaw.trim()===''?null:energyValue(medRaw);
      if(energyRaw.trim()!==''&&(energy===null||energy>1000)||
         medRaw.trim()!==''&&(med===null||med>720)){
         state.error='Energy must be 0-1000 E; medical remaining must be 0-720 minutes.';render();return;}
      if(energy===null&&med===null)delete cfg.manualReadiness[id];
      else cfg.manualReadiness[id]={energy,medicalUntil:med===null?null:Date.now()+med*MIN,at:Date.now()};
      saveCfg();confirmed('Readiness saved locally for 45 minutes. No teammate API data was accessed.');render();return;
    }
    if(action==='match-more'){state.showAllMatchups=!state.showAllMatchups;render();return;}
    if(action.startsWith('hitter:')){const id=positive(action.slice(7));if(state.data.ours.some(p=>p.id===id)){state.chosen=id;navigate('matchups');}return;}
    if(action.startsWith('pace-war:')){state.selectedPace=positive(action.slice(9));navigate('pace');return;}
    if(action==='pace-live'){state.selectedPace=0;navigate('pace');return;}
    if(action==='timeline-latest'){state.selectedTimeline=0;navigate('timeline');return;}
    if(action.startsWith('timeline-war:')){state.selectedTimeline=positive(action.slice(13));navigate('timeline');return;}
    if(action==='save-heavy-cutoff'){
      const mode=String($('#ws-heavy-mode',root)?.value||'percent'),
        percent=Number($('#ws-heavy-percent',root)?.value),
        minBss=Number($('#ws-heavy-bss',root)?.value);
      if(!['percent','min-bss'].includes(mode)||!Number.isInteger(percent)||
        percent<5||percent>100||!Number.isFinite(minBss)||minBss<0||minBss>1e15){
        state.error='Cutoff must use 5-100% or a non-negative BSS up to 1e15.';
        render();return;
      }
      cfg.heavyPolicy=heavyRule({mode,percent,minBss});saveCfg();markSharedDirty();
      confirmed('Black Skulls strength cutoff saved. Check coverage and existing orders.');
      render();return;
    }
    if(action.startsWith('skull-assign:')){
      const [id,targetId]=action.slice(13).split(':').map(positive),
        member=state.data.ours.find(p=>p.id===id),
        target=state.data.enemies.find(p=>p.id===targetId);
      if(!member||!target||!cfg.blackSkulls[id]||positive(cfg.assignments[id])||
        Object.entries(cfg.assignments).some(([other,enemy])=>
          positive(other)!==id&&positive(enemy)===targetId)||
        !roleMatch(member,target)){
        state.error='Cannot assign: need a free Black Skull, in-role target and verified favourable current matchup.';
        render();return;
      }
      cfg.assignments[id]=targetId;saveCfg();markSharedDirty();
      confirmed('Assigned '+member.name+' to review '+target.name+'. No Torn attack performed.');
      render();return;
    }
    if(action==='draft-black'){
      const drafts=suggestedDraft();
      for(const x of drafts)if(!positive(cfg.assignments[x.friend.id]))cfg.assignments[x.friend.id]=x.enemy.id;
      saveCfg();markSharedDirty();drafts.length?confirmed('Drafted '+drafts.length+' role-appropriate target orders locally. Verify each manually.'):state.error='No evidenced unassigned role-appropriate targets; improve BSS coverage and comparable spies first.';render();return;
    }
    if(action==='save-leader-note'){
      const key=positive(state.data.war?.id)||('scout-'+positive(cfg.enemyId));
      cfg.leaderNotes[key]=String($('#ws-leader-note',root)?.value||'').slice(0,1800);
      saveCfg();confirmed('Local leadership notes saved.');render();return;
    }
    if(action==='copy-skull-chat'){
      const value=skullChatBrief();
      const success=()=>{confirmed('Black Skulls briefing copied. Paste it manually into Torn faction chat.');render();};
      const failure=()=>{state.error='Could not copy the briefing; no message was sent.';render();};
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(success).catch(failure);
      else{const area=document.createElement('textarea');area.value=value;
        area.style.cssText='position:fixed;left:-9999px';
        document.body.appendChild(area);area.select();
        let copied=false;try{copied=document.execCommand('copy');}catch(_){}
        area.remove();if(copied)success();else failure();}
      return;
    }
    if(action.startsWith('skull-replace:')){
      const [oldId,newId,enemyId]=action.slice(14).split(':').map(positive),
        target=state.data.enemies.find(x=>x.id===enemyId),
        old=state.data.ours.find(x=>x.id===oldId),
        replacement=state.data.ours.find(x=>x.id===newId),
        current=blackSkullsCoverage().targets.find(x=>x.enemy.id===enemyId);
      // Reconfirm everything because a roster refresh or another local order
      // may have changed after the button was drawn.
      if(!target||!old||!replacement||oldId===newId||
        !cfg.blackSkulls[oldId]||!cfg.blackSkulls[newId]||
        positive(cfg.assignments[oldId])!==enemyId||
        positive(cfg.assignments[newId])||
        !current?.replacement||current.assigned.length!==1||
        current.assigned[0].id!==oldId||
        current.replacement.player.id!==newId||
        !rosterFresh('ours')||!rosterFresh('enemies')||
        hitterReadiness(replacement).energyEnough===false||
        Object.entries(cfg.assignments).some(([h,t])=>
          positive(h)!==oldId&&positive(t)===enemyId)||
        !roleMatch(replacement,target)){
        state.error='Replacement not saved. Refresh and re-check verified roles, matchup and existing orders.';
        render();return;
      }
      delete cfg.assignments[oldId];cfg.assignments[newId]=enemyId;
      if(positive(cfg.enemyId))cfg.ordersByEnemy[String(cfg.enemyId)]={...cfg.assignments};
      saveCfg();markSharedDirty();
      confirmed('Moved this local heavy-target order from '+old.name+' to '+replacement.name+
        '. Verify the order with your squad; no Torn action was performed.');
      render();return;
    }
    if(action==='copy-leader-brief'){
      const content=leadershipBrief();
      if(navigator.clipboard?.writeText){navigator.clipboard.writeText(content).then(()=>{confirmed('Leadership briefing copied for manual sharing.');render();}).catch(()=>{state.error='Clipboard not permitted; no briefing was sent.';render();});}
      else{const textArea=document.createElement('textarea');textArea.value=content;textArea.style.cssText='position:fixed;left:-9999px;';document.body.appendChild(textArea);textArea.select();let copied=false;try{copied=document.execCommand('copy');}catch(_){}textArea.remove();copied?confirmed('Leadership briefing copied for manual sharing.'):state.error='Clipboard unavailable; no briefing was sent.';render();}return;
    }
    if(action==='refresh-ff'){manualFFCheck(false);return;}
    if(action==='watched-list'){state.filter='watched';navigate('targets');return;}
    if(action==='check-ff-key'){manualFFCheck(true);return;}
    if(action.startsWith('watch:')){const id=positive(action.slice(6));if(id){if(cfg.watchlist[id])delete cfg.watchlist[id];else cfg.watchlist[id]=true;saveCfg();render();}return;}
    if(action==='war-list'){state.selectedWar=0;navigate('history');return;}
    if(action==='deep-scan'){cfg.historyLimit=20;saveCfg();navigate('history');refresh(true);return;}
    if(action.startsWith('hour:')){const h=Number(action.slice(5));if(Number.isInteger(h)&&h>=0&&h<24){const tr=$('#ws-hour-row-'+h,root);if(tr){tr.scrollIntoView({block:'center'});tr.style.outline='2px solid #54d7fa';}}return;}
    if(action.startsWith('war:')){navigate('intel');state.selectedWar=positive(action.slice(4));render();return;}
    if(action.startsWith('load-report:')){loadWarReport(positive(action.slice(12)));return;}
    if(action.startsWith('public:')){loadPublicIntel(positive(action.slice(7)));return;}
    if(action==='find'){
      const panel=$('#ws-finder',root);
      if(!panel)return;
      panel.hidden=!panel.hidden;
      if(panel.hidden)closeFinder();
      else{drawFinder();$('#ws-find-input',root)?.focus({preventScroll:true});}
      return;
    }
    if(action==='finder-close'){closeFinder();return;}
    if(action.startsWith('finder-player:')){
      const id=positive(action.slice(14));
      if(id){closeFinder();handle('player:'+id);}
      return;
    }
    if(action.startsWith('finder-tab:')){
      const tab=action.slice(11);
      if(sections.includes(tab)){closeFinder();navigate(tab);}
      return;
    }
    if(action==='more'){state.showMore=!state.showMore;render();return;}
    if(action.startsWith('tab:')){navigate(action.slice(4));event('visit',{id:ID,section:state.tab});return;}
    if(action.startsWith('alert:')){const x=currentAlerts().find(a=>a.id===action.slice(6));if(x?.targetId){focusOpportunity(x.targetId);return;}navigate(x?.tab||'alerts');return;}
    if(action.startsWith('tool:')){close();event('open',{id:action.slice(5)});return;}
    if(action.startsWith('player:')){state.tab='targets';state.chosen=positive(action.slice(7));state.playerOpen=true;render();$('.ws-content',root).scrollTop=0;return;}
    if(action.startsWith('spy:')){
      const id=positive(action.slice(4));const box=$('.ws-content',root);
      const s={observedAt:Date.now()};
      for(const k of ['strength','speed','defense','dexterity']){
        const raw=$('[data-spy="'+k+'"]',box)?.value;
        if(raw===''||!Number.isFinite(Number(raw))||Number(raw)<0){state.error='Enter all four known stats, or leave spy data unknown.';render();return;}
        s[k]=Number(raw);
      }
      cfg.spies[id]=s;saveCfg();navigate('targets');return;
    }
    if(action.startsWith('clear-spy:')){delete cfg.spies[positive(action.slice(10))];saveCfg();state.skipDraftRestore=true;render();return;}
    if(action.startsWith('note:')){cfg.notes[positive(action.slice(5))]=String($('#ws-note',root)?.value||'').slice(0,500);saveCfg();render();return;}
    if(action.startsWith('assign:')){const [friend,enemy]=action.slice(7).split(':').map(positive);
      if(friend&&enemy){
        const hitter=state.data.ours.find(p=>p.id===friend),
          target=state.data.enemies.find(p=>p.id===enemy);
        if(!hitter||!target||!roleAllows(hitter,target)){
          state.error='Order blocked: Black Skulls require higher enemy BSS; regular members take the lower bracket.';render();return;
        }
        cfg.assignments[friend]=enemy;saveCfg();markSharedDirty();navigate('assignments');
      }return;}
    if(action.startsWith('clear-assign:')){delete cfg.assignments[positive(action.slice(13))];saveCfg();markSharedDirty();render();return;}
    if(action.startsWith('black-skill:')){const id=positive(action.slice(12));if(cfg.blackSkulls[id])delete cfg.blackSkulls[id];else if(id)cfg.blackSkulls[id]=true;saveCfg();markSharedDirty();render();return;}
    if(action==='copy-orders'){
      const text=copiedWarOrders();
      if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
        navigator.clipboard.writeText(text).then(()=>{confirmed('War plan copied to clipboard; paste it into faction chat when ready.');render();}).catch(()=>{state.error='Clipboard permission denied. The plan remains available here.';render();});
      }else{
        const el=document.createElement('textarea');el.value=text;el.style.position='fixed';el.style.left='-9999px';document.body.appendChild(el);el.select();
        let ok=false;try{ok=document.execCommand('copy');}catch(_){}el.remove();
        ok?confirmed('War plan copied; paste into faction chat when ready.'):state.error='Clipboard unavailable; use the visible orders table.';render();
      }
      return;
    }
    if(action==='clear-key'){cfg.key='';cfg.factionVerifiedAt=0;delete state.data.meta.ffRegistration;delete state.data.meta.ownerId;state.data.ownerReadiness={};state.data.autoSpies={};state.data.ffstats={};state.data.updated.ffscouter=0;saveCfg();save();render();return;}
    if(action==='clear-ff-key'){cfg.ffKey='';state.data.ffstats={};delete state.data.meta.ffRegistration;state.data.updated.ffscouter=0;saveCfg();save();state.error='FFScouter will use your Torn PDA key if you enabled and consented to FF lookup.';render();return;}
    if(action==='detect-faction'){
      cfg.factionAuto=true;
      cfg.factionVerifiedAt=0;
      saveCfg();
      state.data.updated['identity-key']=0;
      state.data.updated['identity-faction']=0;
      state.data.updated['identity-profile']=0;
      state.data.backoff['identity-key']=null;
      state.data.backoff['identity-faction']=null;
      state.data.backoff['identity-profile']=null;
      navigate('overview');
      refresh(true);
      return;
    }
    if(action==='reset-activity'){state.data.activity={};state.data.sampleCount=0;save();render();return;}
    if(action==='reset-orders'){cfg.assignments={};if(positive(cfg.enemyId))cfg.ordersByEnemy[String(positive(cfg.enemyId))]={};saveCfg();markSharedDirty();render();return;}
    if(action==='save-settings'){
      const priorFFKey=ffApiKey();
      const previousOwnerKey=effectiveKey(),previousFactionId=positive(cfg.ourId);
      const supplied=$('#ws-key',root)?.value?.trim();if(supplied&&supplied!==cfg.key){cfg.key=supplied;delete state.data.meta.ffRegistration;state.data.updated.ffscouter=0;state.data.ffstats={};}
      const ffSupplied=$('#ws-ffkey',root)?.value?.trim();if(ffSupplied&&ffSupplied!==cfg.ffKey){cfg.ffKey=ffSupplied;delete state.data.meta.ffRegistration;state.data.updated.ffscouter=0;state.data.ffstats={};}
      cfg.ffConsent=Boolean($('#ws-ff-consent',root)?.checked);
      cfg.ffEnabled=Boolean($('#ws-ff-enable',root)?.checked)&&cfg.ffConsent&&Boolean(cfg.ffKey||effectiveKey());
      const manualId=positive($('#ws-our',root)?.value);
      cfg.factionAuto=Boolean($('#ws-auto-faction',root)?.checked);
      if(cfg.factionAuto){
        cfg.factionVerifiedAt=0;
        // Leave the prior verified ID in place until an official API answer.
      }else{
        cfg.ourId=manualId;
        cfg.factionSource=manualId?'Manual override':'Not set';
        cfg.factionVerifiedAt=0;
      }
      if(!cfg.factionAuto&&previousFactionId!==positive(cfg.ourId)){
        // Never show the last faction's roster or score as the new manual identity.
        state.data.ours=[];state.data.ourWars=[];state.data.enemies=[];state.data.enemyWars=[];
        state.data.war=null;state.data.chain={};
        for(const key of ['ours','ourWars','enemies','enemyWars','wars','chain'])
          state.data.updated[key]=0;
      }
      if(setOpponent(positive($('#ws-enemy',root)?.value)))state.data.war=null;
      cfg.nativeChainBubble=Boolean($('#ws-native-bubble',root)?.checked);
      cfg.nativeWarEnabled=Boolean($('#ws-native-war',root)?.checked);
      cfg.nativeWarCountryGroups=Boolean($('#ws-native-countries',root)?.checked);
      const nativeSort=String($('#ws-native-sort',root)?.value||'availability');
      cfg.nativeWarSort=['availability','hospital','bss','ff','activity','torn'].includes(nativeSort)?nativeSort:'availability';
      const stripScope=String($('#ws-strip-scope',root)?.value||'contextual');
      cfg.warStripScope=['contextual','faction','everywhere'].includes(stripScope)?stripScope:'contextual';
      cfg.refreshSeconds=Math.max(90,Math.min(300,positive($('#ws-interval',root)?.value)||120));
      cfg.historyLimit=Math.max(2,Math.min(20,positive($('#ws-limit',root)?.value)||8));
      cfg.enableAttacks=Boolean($('#ws-attacks',root)?.checked);
      cfg.autoConceded=Boolean($('#ws-conceded',root)?.checked);
      cfg.autoOwnerReadiness=Boolean($('#ws-owner-ready',root)?.checked);
      cfg.priorityNotifications=Boolean($('#ws-priority-notifications',root)?.checked);
      const oldEndpoint=String(cfg.shared.endpoint||'').trim();
      const newEndpoint=String($('#ws-shared-endpoint',root)?.value||'').trim();
      cfg.shared.enabled=Boolean($('#ws-shared-enable',root)?.checked);
      cfg.shared.canWrite=Boolean($('#ws-shared-write',root)?.checked);
      cfg.shared.endpoint=newEndpoint;
      const token=String($('#ws-shared-token',root)?.value||'').trim();
      if(token)cfg.shared.token=token;
      if(oldEndpoint!==newEndpoint){
        cfg.shared.scope='';cfg.shared.revision=0;cfg.shared.localDirty=false;
        state.sharedRevision=0;state.sharedSyncAt=0;
      }
      if(cfg.shared.enabled&&!sharedEndpoint())state.error='Shared orders need an HTTPS Worker URL and a read/write token.';
      if(previousOwnerKey!==effectiveKey()){
        state.data.ownerReadiness={};state.data.autoSpies={};delete state.data.meta.ownerId;
        for(const name of ['own-bars','own-cooldowns','owner-id-readiness']){
          delete state.data.updated[name];delete state.data.errors[name];delete state.data.backoff[name];
        }
      }
      if(priorFFKey!==ffApiKey()){
        state.data.ffstats={};state.data.updated.ffscouter=0;
        delete state.data.meta.ffRegistration;
        delete state.data.backoff.ffscouter;
      }
      // Force official Torn refresh without bypassing FFScouter's ten-minute
      // refresh window or its temporary error backoff.
      const ffStamp=n(state.data.updated.ffscouter);
      const ffBackoff=state.data.backoff.ffscouter||null;
      saveCfg();if(!state.error)state.error='';
      state.data.backoff=ffBackoff?{ffscouter:ffBackoff}:{};
      state.data.updated=ffStamp?{ffscouter:ffStamp}:{};
      save();publish();navigate('overview');refresh(true);return;
    }
  }
  document.addEventListener('keydown',e=>{
    if(!state.open)return;
    if(e.key==='Escape'){e.preventDefault();if(!$('#ws-finder',root)?.hidden){closeFinder();return;}close();return;}
    if(e.key!=='Tab')return;
    const focusable=Array.from(root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])'))
      .filter(x=>!x.hidden&&typeof x.getClientRects==='function'&&x.getClientRects().length);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1],active=document.activeElement;
    if(!root.contains(active)||e.shiftKey&&active===first){
      e.preventDefault();(e.shiftKey?last:first).focus();return;
    }
    if(!e.shiftKey&&active===last){e.preventDefault();first.focus();}
  });
  root.addEventListener('click',e=>{
    if(e.target.closest('[data-close]')){close();return;}
    const tab=e.target.closest('[data-tab]');if(tab){navigate(tab.dataset.tab);event('visit',{id:ID,section:state.tab});return;}
    const act=e.target.closest('[data-action]');if(act){e.preventDefault();handle(act.dataset.action);}
    const filter=e.target.closest('[data-filter]');if(filter){
      const x=$('#ws-search',root);if(x)state.search=x.value;
      state.filter=filter.dataset.filter;render();
    }
  });
  root.addEventListener('change',e=>{
    const risk=e.target.closest('[data-skull-risk]');
    if(risk){
      const id=positive(risk.dataset.skullRisk),mode=String(risk.value);
      if(!id||!state.data.ours.some(p=>p.id===id)||!cfg.blackSkulls[id]||
        !['safe','balanced','aggressive'].includes(mode))return;
      cfg.hitterRisk[id]={mode,at:Date.now()};saveCfg();markSharedDirty();
      confirmed('Per-player risk saved. Actual win probability remains unknown.');render();return;
    }
    const control=e.target.closest('[data-control-target]');
    if(control){
      const enemyId=positive(control.dataset.controlTarget),watcher=positive(control.value);
      if(!state.data.enemies.some(p=>p.id===enemyId))return;
      if(watcher&&!state.data.ours.some(p=>p.id===watcher&&cfg.blackSkulls[p.id]))return;
      const key=currentPlanKey(),prior=cfg.controlAssignments[key]||{};
      if(watcher)prior[enemyId]=watcher;else delete prior[enemyId];
      cfg.controlAssignments[key]=prior;saveCfg();markSharedDirty();
      confirmed('Hospital watcher assigned locally. No attack or hospitalisation performed.');render();return;
    }
    const turtleDuty=e.target.closest('[data-turtle-duty]');
    if(turtleDuty){
      const id=positive(turtleDuty.dataset.turtleDuty),value=String(turtleDuty.value);
      if(!state.data.ours.some(p=>p.id===id)||!['auto','strike','turtle','reserve'].includes(value))return;
      const key=currentPlanKey(),plan=turtlePlan();
      if(value==='auto')delete plan.members[id];else plan.members[id]=value;
      cfg.turtlePlans[key]={mode:plan.mode,members:plan.members,updated:Date.now()};
      saveCfg();markSharedDirty();confirmed('Defensive duty saved locally. Torn player status is unchanged.');render();return;
    }
    const target=e.target.closest('[data-leader-target]');
    if(target){const ourId=positive(target.dataset.leaderTarget),enemyId=positive(target.value);
      if(!state.data.ours.some(p=>p.id===ourId))return;
      if(enemyId&&state.data.enemies.some(p=>p.id===enemyId)){
        const hitter=state.data.ours.find(p=>p.id===ourId),
          target=state.data.enemies.find(p=>p.id===enemyId);
        if(!roleAllows(hitter,target)){
          state.error='Role separation: reserve top estimated BSS opponents for Black Skulls.';render();return;
        }
        cfg.assignments[ourId]=enemyId;
      }
      else if(!enemyId)delete cfg.assignments[ourId];
      else return;
      saveCfg();markSharedDirty();confirmed(enemyId?'Manual target saved locally; no Torn action performed.':'Manual target cleared.');render();return;
    }
    const duty=e.target.closest('[data-leader-duty]');
    if(duty){const id=positive(duty.dataset.leaderDuty),value=String(duty.value);
      if(!state.data.ours.some(p=>p.id===id)||!hitterPlanStatuses().some(x=>x[0]===value))return;
      if(value==='not-set')delete cfg.planStatus[hitterPlanKey(id)];else cfg.planStatus[hitterPlanKey(id)]=value;
      saveCfg();markSharedDirty();confirmed('Manual duty updated locally; this is not a verified Torn action.');render();return;
    }
    if(e.target.id==='ws-leader-filter'){state.leaderFilter=e.target.value;render();return;}
    if(e.target.id==='ws-hitter-filter'){state.hitterFilter=e.target.value;render();return;}
    if(e.target.id==='ws-friend'){state.chosen=positive(e.target.value);render();}
    if(e.target.id==='ws-sort'){state.sort=e.target.value;render();}
  });
  root.addEventListener('input',e=>{
    if(e.target.id==='ws-find-input'){drawFinder();return;}
    if(e.target.id==='ws-search'){
      state.search=e.target.value;
      const pos=e.target.selectionStart,scroll=$('.ws-content',root).scrollTop;
      render();const input=$('#ws-search',root);
      if(input){input.focus();try{input.setSelectionRange(pos,pos);}catch(_){}}
      $('.ws-content',root).scrollTop=scroll;
    }
  });
  root.addEventListener('keydown',e=>{
    if(e.target?.id==='ws-find-input'&&e.key==='Enter'){
      const first=$('#ws-finder-results [data-action]',root);
      if(first){e.preventDefault();first.click();}
    }
  });
  document.addEventListener('staxx:open',e=>{if(e.detail?.id===ID)open(e.detail);});
  window.addEventListener('message',e=>{
    if((e.source&&e.source!==window)||e.origin!==location.origin)return;
    const d=e.data;
    if(d?.__tornstaxxBridge==='tornstaxx-war-v1'&&d.kind==='open'&&d.id===ID)
      open({section:d.section||'overview',alertId:d.alertId||null});
  });
  document.addEventListener('staxx:closeall',()=>{if(state.open)close();});
  document.addEventListener('staxx:ping',publish);
  document.addEventListener('staxx:mode',render);
  document.addEventListener('staxx:diagnostics-request',()=>event('diagnostics',{
    id:ID,version:VER,api:!effectiveKey()?'missing':state.data.errors.wars?'error':state.data.updated.wars?'ready':'unknown',
    storage:state.localKeyError?'error':'ready',ui:root.isConnected?'ready':'missing',
    detail:'War data sampled while Torn is in the foreground; no automatic game actions.'
  }));
  const styleSheet=()=>{if(!$('#warstaxx-css')){css.id='warstaxx-css';document.head.appendChild(css);}
    if(!document.getElementById('ws-status-clock-css')){
      const clockCss=document.createElement('style');clockCss.id='ws-status-clock-css';
      clockCss.textContent='.ws-roster-timing{display:grid;gap:3px;margin-top:4px;font-size:11px;color:#98d8f2;white-space:normal}'+
        '.ws-roster-timing small{color:#98aabb;font-size:10px}'+
        '.ws-roster-timing .ws-timer-soon{color:#9bf1bd;font-weight:850}'+
        '.ws-roster-timing .ws-timer-warning{color:#ffca79;font-weight:850}';
      document.head.appendChild(clockCss);
    }
  };
  function factionRoute(){
    return /^\/(factions|war)\.php$/i.test(location.pathname) ||
      (/^\/page\.php$/i.test(location.pathname) && /^(rankedwar|factionwar|war)$/i.test(new URLSearchParams(location.search).get('sid')||''));
  }

  // Torn native ranked-war enhancement: use Torn's own member rows, not a floating overlay.
  // All source data is from existing WarStaxx API observations and opt-in FFScouter.
  const nativeWarState={transitions:new Map(),original:new WeakMap(),ourOriginal:new WeakMap(),lastWar:0,expandedId:0,toolbarExpanded:false};
  function isNativeWarPage(){
    return /^\/factions\.php$/i.test(location.pathname)&&/^#\/war(?:\/|$)/i.test(location.hash||'');
  }
  function nativeWarForeground(){
    return !document.hidden&&Boolean(window.flutter_inappwebview||document.hasFocus?.());
  }
  function nativeWarRows(list){
    return Array.from(list?.children||[]).filter(el=>el.matches?.('li.enemy,li.your'));
  }
  function nativeWarPlayerId(row){
    const anchor=row.querySelector('a[href*="profiles.php"]');
    if(!anchor)return 0;
    try{return positive(new URL(anchor.href,location.href).searchParams.get('XID'));}catch(_){return 0;}
  }
  function nativeWarConflict(list){
    return list?.getAttribute('data-ffscouter-active-filter')==='true'||
      Boolean(list?.querySelector('.twse-copy-btn,[data-twse-overridden],[data-twse-last-action-timestamp]'));
  }
  function observeNativeWarTransitions(before,after,warId,at=Date.now()){
    if(!positive(warId)||!Array.isArray(before)||!Array.isArray(after))return;
    if(nativeWarState.lastWar&&nativeWarState.lastWar!==warId)nativeWarState.transitions.clear();
    nativeWarState.lastWar=warId;
    for(const [id,x] of nativeWarState.transitions)if(at-x.at>20000)nativeWarState.transitions.delete(id);
    // A state-change observation is not proof of the actual exact release time.
    for(const next of after){
      const prev=before.find(p=>p.id===next.id);
      if(!prev||memberState(next)!=='okay'||!['hospital','away'].includes(memberState(prev)))continue;
      const early=memberState(prev)==='hospital'&&positive(prev.until)>at+2000;
      nativeWarState.transitions.set(next.id,{at,warId,kind:early?'EARLY MED / REVIVE':
        memberState(prev)==='away'?'LANDED / RETURNED':'NEWLY OKAY'});
    }
  }
  function nativeWarTransition(id,at=Date.now()){
    const t=nativeWarState.transitions.get(id);
    return t&&t.warId===positive(state.data.war?.id)&&at-t.at<15000&&at>=t.at&&
      nativeWarForeground()?t:null;
  }
  function nativeWarClass(p){
    const m=memberState(p),flight=m==='away'?flightEvidence(p):null;
    if(m==='okay')return 1;
    if(m==='hospital')return 2;
    if(flight?.kind==='returning')return 3;
    if(flight?.kind==='outbound')return 4;
    if(m==='away')return 5;
    return 6;
  }
  function nativeWarOrder(p,mode,at=Date.now()){
    const t=nativeWarTransition(p.id,at),kind=memberState(p),group=nativeWarClass(p);
    const eta=kind==='hospital'?positive(p.until)||Infinity:
      kind==='away'&&flightEvidence(p).kind==='returning'?flightEvidence(p).eta||Infinity:Infinity;
    if(mode==='activity')return [p.lastAt?-p.lastAt:Infinity,p.id];
    if(mode==='bss'){
      const est=enemyBattleEstimate(p).value;
      return [est===null?1:0,est===null?0:-est,p.id];
    }
    if(mode==='ff'){
      const info=ffLabel(p.id),ff=info.source==='estimate'?Number(info.ff):NaN;
      return [Number.isFinite(ff)?0:1,Number.isFinite(ff)?-ff:0,p.id];
    }
    if(mode==='hospital')return [kind==='hospital'?0:1,kind==='hospital'?eta:group,p.id];
    return [t?0:group,t?-t.at:eta,p.id];
  }
  function nativeWarSort(list,playerMap,mode){
    if(!list)return false;
    const priorHeaders=Array.from(list.querySelectorAll(':scope > li.wsnw-country-heading'));
    if(nativeWarConflict(list)){
      // An external sorter wins. Remove only WarStaxx-generated group headings.
      priorHeaders.forEach(h=>h.remove());
      return false;
    }
    const children=Array.from(list.children),all=children.filter(el=>!el.classList.contains('wsnw-country-heading')),
      rows=nativeWarRows(list);
    if(!rows.length||all.length!==rows.length||rows.some(r=>!r.classList.contains('enemy'))){
      priorHeaders.forEach(h=>h.remove());
      return false;
    }
    if(!nativeWarState.original.has(list)){
      nativeWarState.original.set(list,new Map(rows.map((r,i)=>[nativeWarPlayerId(r),i])));
    }
    const original=nativeWarState.original.get(list),own=nativeWarOwnLocation(),
      grouping=mode!=='torn'&&cfg.nativeWarCountryGroups!==false;
    const sorted=rows.slice().sort((a,b)=>{
      const pa=playerMap.get(nativeWarPlayerId(a)),pb=playerMap.get(nativeWarPlayerId(b));
      if(!pa||!pb)return (original.get(nativeWarPlayerId(a))??Infinity)-
        (original.get(nativeWarPlayerId(b))??Infinity);
      if(grouping){
        const country=nativeWarCountryCompare(nativeWarLocation(pa).country,
          nativeWarLocation(pb).country,own);
        if(country)return country;
      }
      // Okay targets always precede hospitalised/jailed/flying players in each country.
      if(mode!=='torn'){
        const availability=nativeWarAvailabilityRank(pa)-nativeWarAvailabilityRank(pb);
        if(availability)return availability;
      }
      const ak=mode==='torn'?[original.get(pa.id)??Infinity]:nativeWarOrder(pa,mode);
      const bk=mode==='torn'?[original.get(pb.id)??Infinity]:nativeWarOrder(pb,mode);
      for(let i=0;i<Math.max(ak.length,bk.length);i++){
        if((ak[i]??0)!==(bk[i]??0))return (ak[i]??0)-(bk[i]??0);
      }
      return pa.id-pb.id;
    });
    const expected=[],headersByCountry=new Map(priorHeaders.map(h=>[h.dataset.wsnwCountry,h]));
    if(grouping){
      const counts=new Map();
      for(const row of sorted){
        if(row.classList.contains('wsnw-filtered'))continue;
        const player=playerMap.get(nativeWarPlayerId(row));
        if(!player)continue;
        const info=nativeWarLocation(player),rec=counts.get(info.country)||{total:0,okay:0,flights:0};
        rec.total++;
        if(memberState(player)==='okay')rec.okay++;
        if(info.phase==='inbound')rec.flights++;
        counts.set(info.country,rec);
      }
      let lastCountry=null;
      for(const row of sorted){
        const player=playerMap.get(nativeWarPlayerId(row)),
          country=player?nativeWarLocation(player).country:'Unknown';
        if(!row.classList.contains('wsnw-filtered')&&country!==lastCountry&&counts.has(country)){
          let heading=headersByCountry.get(country);
          if(!heading){heading=el('li','wsnw-country-heading');heading.dataset.wsnwCountry=country;}
          const amount=counts.get(country);
          const isHome=own.known&&own.phase!=='inbound'&&own.country===country;
          const name=country+(isHome?' | YOU ARE HERE':'');
          const summary=amount.total+' player'+(amount.total===1?'':'s')+
            ' | '+amount.okay+' ready'+(amount.flights?' | '+amount.flights+' inbound':'');
          const headline=name+' | '+summary;
          // Preserve the simple text fallback used by non-browser diagnostics.
          if(typeof heading.querySelector==='function'&&typeof heading.replaceChildren==='function'){
            let title=heading.querySelector('.wsnw-country-title'),
              stats=heading.querySelector('.wsnw-country-meta');
            if(!title||!stats){
              title=el('strong','wsnw-country-title');
              stats=el('span','wsnw-country-meta');
              heading.replaceChildren(title,stats);
            }
            if(title.textContent!==name)title.textContent=name;
            if(stats.textContent!==summary)stats.textContent=summary;
          }else if(heading.textContent!==headline)heading.textContent=headline;
          heading.classList.toggle?.('wsnw-your-country',isHome);
          heading.setAttribute('aria-label',headline);
          heading.title=headline;
          expected.push(heading);
        }
        expected.push(row);
        if(!row.classList.contains('wsnw-filtered'))lastCountry=country;
      }
    }else expected.push(...sorted);
    for(const old of priorHeaders)if(!expected.includes(old))old.remove();
    const existing=Array.from(list.children);
    if(existing.length!==expected.length||expected.some((row,i)=>row!==existing[i])){
      const frag=document.createDocumentFragment();
      for(const row of expected)frag.appendChild(row);
      list.appendChild(frag);
    }
    return true;
  }
  // The friendly roster has a separate sort: enemy country/availability
  // grouping remains untouched and Torn's native sort is still available.
  function nativeWarSortFriendly(list,mode='given'){
    if(!list||nativeWarConflict(list))return false;
    const rows=nativeWarRows(list),all=Array.from(list.children);
    if(!rows.length||rows.length!==all.length||rows.some(r=>!r.classList.contains('your')))return false;
    if(!nativeWarState.ourOriginal.has(list))
      nativeWarState.ourOriginal.set(list,new Map(rows.map((r,i)=>[nativeWarPlayerId(r),i])));
    const original=nativeWarState.ourOriginal.get(list),desc=cfg.nativeFriendlyDesc!==false;
    const measure=impact=>{
      if(mode==='earned')return impact.earned;
      if(mode==='net')return impact.net;
      if(mode==='share')return impact.share;
      if(mode==='hits')return impact.hits;
      return impact.given;
    };
    const keys=new Map(rows.map(row=>{
      const id=nativeWarPlayerId(row);return [id,liveWarMemberImpact(id)];
    }));
    const sorted=rows.slice().sort((a,b)=>{
      const idA=nativeWarPlayerId(a),idB=nativeWarPlayerId(b);
      if(mode==='torn')return (original.get(idA)??Infinity)-(original.get(idB)??Infinity);
      const x=measure(keys.get(idA)),y=measure(keys.get(idB));
      if(x===null&&y!==null)return 1;
      if(y===null&&x!==null)return -1;
      const diff=desc?(y??0)-(x??0):(x??0)-(y??0);
      return diff||(original.get(idA)??Infinity)-(original.get(idB)??Infinity);
    });
    if(sorted.some((row,i)=>row!==rows[i])){
      const frag=document.createDocumentFragment();
      sorted.forEach(row=>frag.appendChild(row));list.appendChild(frag);
    }
    return true;
  }
    function nativeWarFilters(p,band,filter){
    if(filter==='okay')return memberState(p)==='okay';
    if(filter==='hospital')return memberState(p)==='hospital';
    if(filter==='returning')return flightEvidence(p).kind==='returning';
    if(filter==='active5')return positive(p.lastAt)>0&&Date.now()-p.lastAt<5*MIN;
    if(filter==='active60')return positive(p.lastAt)>0&&Date.now()-p.lastAt<60*MIN;
    if(filter==='offline')return String(p.lastAction||'').toLowerCase()==='offline';
    if(filter==='heavy')return band.heavy.has(p.id);
    if(filter==='assigned')return Object.values(cfg.assignments).some(id=>positive(id)===p.id);
    if(filter==='watched')return Boolean(cfg.watchlist[p.id]);
    return true;
  }
  function nativeCompactTotal(value){
    const num=Number(value);
    if(!Number.isFinite(num)||num<=0)return '';
    const fmtUnit=(div,suffix)=>{
      const v=num/div,dp=v>=100?0:v>=10?1:2;
      return Number(v.toFixed(dp)).toLocaleString('en-GB')+suffix;
    };
    return num>=1e12?fmtUnit(1e12,'t'):num>=1e9?fmtUnit(1e9,'b'):
      num>=1e6?fmtUnit(1e6,'m'):num>=1e3?fmtUnit(1e3,'k'):fmt(num);
  }
  // Total stats and the square-root Battle Stat Score are separate measures.
  function nativeWarStrength(p){
    const estimate=enemyBattleEstimate(p),report=spy(p.id);
    if(estimate.verified&&bsScore(report)!==null){
      const total=['strength','speed','defense','dexterity'].reduce((sum,k)=>sum+Number(report[k]),0);
      return {short:'Spy '+nativeCompactTotal(total),source:estimate.source,
        detail:'Torn spy total '+fmt(total)+' | BSS '+fmt(bsScore(report))+
          ' | observed '+age(report.observedAt)+' ago'};
    }
    const f=ffscouter(p.id);
    if(f&&!ffIsStale(f)&&Number.isFinite(f.bsEstimate)&&f.bsEstimate>0){
      const when=positive(f.updatedAt)||positive(f.at);
      return {short:'FFS ~'+nativeCompactTotal(f.bsEstimate),source:'FFScouter model',
        detail:'FFScouter modelled total '+fmt(f.bsEstimate)+
          ' | public BSS '+(Number.isFinite(f.bss)?fmt(f.bss):'unknown')+
          ' | updated '+age(when)+' | YATA uses another model'};
    }
    if(estimate.value!==null)return {short:'BSS '+(estimate.verified?'':'~')+fmt(estimate.value),
      source:estimate.source,detail:'Battle Stat Score, not total stats. '+estimate.source};
    return {short:'Stats unknown',source:'None',detail:'No usable current estimate'};
  }
  function nativeWarHospitalTier(until,at=Date.now()){
    const remaining=positive(until)-at;
    if(!positive(until)||remaining<=0)return '';
    return remaining<=5*MIN?'wsnw-soon':remaining<=15*MIN?'wsnw-warning':'';
  }
  function nativeWarHospitalShort(until,at=Date.now()){
    if(!positive(until))return 'H ?';
    const seconds=Math.ceil((until-at)/1000);
    if(seconds<=0)return 'H due';
    const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60);
    return h?'H '+h+'h '+String(m).padStart(2,'0')+'m':
      m?'H '+m+'m':'H '+seconds+'s';
  }
  function nativeWarStyle(){
    if(document.getElementById('wsnw-style'))return;
    const style=document.createElement('style');style.id='wsnw-style';
    style.textContent=
      '#wsnw-toolbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 9px;margin:6px 0;border:1px solid #315d79;border-radius:9px;background:#0b253c;color:#e4f5fc;font:11px system-ui,sans-serif}'+
      '#wsnw-toolbar strong{font-size:12px}#wsnw-toolbar button,#wsnw-toolbar select{background:#14405d;border:1px solid #387493;border-radius:6px;color:#eaf8ff;padding:5px 7px;min-height:30px;font:inherit}'+
      '#wsnw-toolbar .wsnw-note{color:#97bdcf;font-size:10px}'+
      // Compact by default: a 36px Torn row and 19px intelligence line, 58px total.
      '.faction-war ul.members-list li.wsnw-enhanced{position:relative!important;height:58px!important;min-height:58px!important;box-sizing:border-box!important;border-left:3px solid #32718e!important;border-bottom:2px solid #34536b!important}'+
      '.faction-war ul.members-list li.wsnw-heavy-target{border-left:5px solid #bb84f5!important}'+
      '.faction-war ul.members-list li.wsnw-heavy-target > .wsnw-intel{background:rgba(51,27,78,.98)!important;border-top-color:#9b70c9!important}'+
      '.faction-war ul.members-list li.wsnw-country-heading{display:flex!important;position:relative!important;float:none!important;clear:both!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:3px 12px!important;width:100%!important;height:auto!important;min-height:41px!important;max-height:none!important;margin:12px 0 4px!important;padding:7px 11px!important;box-sizing:border-box!important;border:0!important;border-top:2px solid #56cfff!important;border-bottom:2px solid #286b89!important;border-left:6px solid #56cfff!important;border-radius:4px!important;box-shadow:0 3px 8px #0007!important;background:linear-gradient(95deg,#155375,#102d46)!important;color:#f1fbff!important;font:800 11px/1.3 system-ui,sans-serif!important;white-space:normal!important;overflow:visible!important;pointer-events:none!important}'+
      '.faction-war ul.members-list li.wsnw-country-heading:first-child{margin-top:3px!important}'+
      '.faction-war ul.members-list li.wsnw-country-heading.wsnw-your-country{border-left-color:#5be2b3!important;border-top-color:#5be2b3!important;background:linear-gradient(95deg,#17564e,#123848)!important}'+
      '.faction-war ul.members-list li.wsnw-country-heading .wsnw-country-title{flex:0 1 auto!important;min-width:0!important;font:900 13px/1.3 system-ui,sans-serif!important;letter-spacing:.5px!important;text-transform:uppercase!important;color:#fff!important}'+
      '.faction-war ul.members-list li.wsnw-country-heading .wsnw-country-meta{flex:0 1 auto!important;min-width:0!important;color:#c1e8fa!important;font:750 11px/1.3 system-ui,sans-serif!important;text-align:right!important}'+
      '.faction-war ul.members-list li.wsnw-newly-okay{border-left-color:#42d69f!important}'+
      '.faction-war ul.members-list li.wsnw-enhanced > .member,.faction-war ul.members-list li.wsnw-enhanced > .level,.faction-war ul.members-list li.wsnw-enhanced > .points,.faction-war ul.members-list li.wsnw-enhanced > .status,.faction-war ul.members-list li.wsnw-enhanced > .attack{height:36px!important;max-height:36px!important;box-sizing:border-box!important}'+
      '.faction-war ul.members-list li.wsnw-enhanced > .wsnw-intel{position:absolute!important;top:36px!important;left:0!important;right:0!important;width:auto!important;height:20px!important;z-index:2;box-sizing:border-box!important;padding:1px 3px!important;display:flex!important;flex-direction:row!important;align-items:center!important;gap:4px!important;background:rgba(11,31,49,.98)!important;border-top:1px solid rgba(109,172,207,.25)!important;overflow-x:hidden!important;overflow-y:hidden!important;white-space:nowrap!important;scrollbar-width:none;touch-action:pan-y pinch-zoom!important;cursor:pointer}'+
      '.faction-war ul.members-list li.wsnw-enhanced > .wsnw-intel::-webkit-scrollbar{display:none}'+
      '.faction-war ul.members-list li.wsnw-enhanced > .wsnw-intel *{touch-action:pan-y pinch-zoom!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-owner{position:sticky!important;left:0!important;z-index:3!important;float:none!important;flex:0 0 auto!important;max-width:105px!important;min-width:40px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#fff!important;font:850 12px system-ui,sans-serif!important;margin-right:2px!important;padding:0 3px 0 2px!important;background:#0b1f31!important;box-shadow:3px 0 5px #0b1f31!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-chip{position:static!important;float:none!important;flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;max-width:140px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;padding:1px 3px!important;margin:0!important;border-radius:4px!important;background:#123d56!important;border:1px solid #2b617d!important;color:#b7dffa!important;font:800 11px/1.2 system-ui,sans-serif!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-ff-danger{background:#5a2434!important;color:#ffd5d9!important;border-color:#af6470!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-ff-risk{background:#554422!important;color:#ffe6aa!important;border-color:#a58141!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-status{background:#123b4a!important;color:#95e8df!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-status.wsnw-hospital{background:#502e38!important;color:#ffe2e5!important;border-color:#97616c!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-status.wsnw-warning{background:#694821!important;color:#fff0b7!important;border-color:#d8a44c!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-status.wsnw-soon{background:#15543c!important;color:#caffe2!important;border-color:#42d493!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-role.wsnw-heavy{display:inline-flex!important;justify-content:center!important;align-items:center!important;flex:0 0 24px!important;width:24px!important;min-width:24px!important;max-width:24px!important;height:20px!important;padding:0!important;background:#7132a3!important;border:2px solid #e1baff!important;border-radius:4px!important;color:#fff!important;font:900 15px/1 system-ui,sans-serif!important;box-shadow:0 0 0 1px #2e1740!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-presence{color:#afcde0!important;background:#203549!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-online{color:#bbffe6!important;background:#14553e!important;border-color:#42d69b!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-country{color:#e7ddff!important;background:#23425d!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-intel-link,.faction-war ul.members-list li .wsnw-intel .wsnw-copy{position:static!important;float:none!important;flex:0 0 auto!important;min-height:23px!important;height:23px!important;padding:1px 6px!important;margin:0!important;background:#1b526f!important;border:1px solid #568fb0!important;border-radius:5px!important;color:#ecfaff!important;font:700 10px system-ui,sans-serif!important;cursor:pointer!important}'+
      '.faction-war ul.members-list li.wsnw-enhanced .wsnw-details-only{display:none!important}'+
      '.faction-war ul.members-list li.wsnw-expanded{height:var(--wsnw-expanded-height,132px)!important;min-height:var(--wsnw-expanded-height,132px)!important;overflow:visible!important}'+
      '.faction-war ul.members-list li.wsnw-expanded > .wsnw-intel{top:36px!important;height:auto!important;min-height:24px!important;max-height:none!important;gap:5px!important;padding:5px 6px!important;flex-wrap:wrap!important;align-content:flex-start!important;align-items:center!important;white-space:normal!important;overflow-x:hidden!important;overflow-y:visible!important;touch-action:pan-y pinch-zoom!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-intel .wsnw-owner{position:static!important;flex:0 0 100%!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;box-shadow:none!important;padding:0 3px 3px!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-intel .wsnw-chip{max-width:100%!important;height:auto!important;min-height:18px!important;white-space:normal!important;overflow:visible!important;overflow-wrap:anywhere!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-details-only{display:inline-flex!important}'+
      '.faction-war ul.members-list li.wsnw-recent{outline:2px solid #e8a558;outline-offset:-2px}'+
      '.faction-war ul.members-list li.wsnw-enhanced:nth-child(even):not(.wsnw-heavy-target) > .wsnw-intel{background:rgba(20,43,61,.98)!important}'+
      '.faction-war ul.members-list li.wsnw-hospital-soon > .wsnw-intel{border-top-color:#42ce95!important}'+
      '.faction-war ul.members-list li.wsnw-hospital-warning > .wsnw-intel{border-top-color:#d8a44c!important}'+
      '.faction-war ul.members-list li.wsnw-filtered{display:none!important}'+
      '#wsnw-chain-bubble{position:fixed;right:9px;bottom:64px;z-index:150;max-width:185px;min-width:95px;padding:7px;background:#0b273c;border:1px solid #4ba6d0;border-radius:10px;box-shadow:0 4px 14px #0008;color:#ecfaff;font:11px system-ui,sans-serif;touch-action:none;user-select:none;cursor:move}'+
      '#wsnw-chain-bubble button{margin-left:4px;background:#164d6a;border:1px solid #438caa;border-radius:5px;color:white;padding:3px 6px;font:10px system-ui,sans-serif;cursor:pointer}'+
      '@media(max-width:600px){#wsnw-toolbar{gap:3px;padding:4px 5px}#wsnw-toolbar button,#wsnw-toolbar select{min-height:27px;padding:3px 6px} .faction-war ul.members-list li.wsnw-enhanced > .wsnw-intel{gap:3px!important;padding:1px 2px!important} .faction-war ul.members-list li .wsnw-intel .wsnw-chip{font-size:11px!important;padding:1px 3px!important}}';
    style.textContent+=".faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded){height:56px!important;min-height:56px!important}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{display:grid!important;grid-template-columns:26px minmax(0,1.35fr) minmax(0,.8fr) minmax(0,1.15fr) minmax(0,.85fr)!important;gap:3px!important;top:36px!important;height:20px!important;min-height:20px!important;padding:0 4px!important;align-content:center!important;align-items:center!important;overflow:hidden!important;white-space:nowrap!important;touch-action:pan-y pinch-zoom!important}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-owner{display:none!important}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip=\"role\"]{grid-column:1;grid-row:1;justify-self:center}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip=\"status\"]{grid-column:2;grid-row:1}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip=\"presence\"]{grid-column:3;grid-row:1}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip=\"bss\"]{grid-column:4;grid-row:1}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip=\"ff\"]{grid-column:5;grid-row:1}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip=\"country\"],.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip=\"order\"]{display:none!important}\n.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip:not(.wsnw-heavy){min-width:0!important;max-width:100%!important;justify-content:flex-start!important;font-size:10px!important;padding:1px 2px!important;border-radius:2px!important}\n.faction-war ul.members-list li.wsnw-expanded .wsnw-intel .wsnw-owner{display:block!important;position:static!important}\n.faction-war ul.members-list li.wsnw-country-heading{min-height:32px!important;margin:6px 0 2px!important;padding:5px 8px!important;box-shadow:none!important}\n.faction-war ul.members-list li.wsnw-country-heading .wsnw-country-title{font-size:12px!important}\n.faction-war ul.members-list li.wsnw-country-heading .wsnw-country-meta{font-size:10px!important}\n.faction-war .wsnw-legend{display:grid;grid-template-columns:26px minmax(0,1.35fr) minmax(0,.8fr) minmax(0,1.15fr) minmax(0,.85fr);align-items:center;gap:3px;padding:4px 7px;margin:3px 0 0;border:1px solid #2c536c;border-bottom:0;background:#173347;color:#a6d3e7;font:800 9px/1.1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.15px;box-sizing:border-box}\n.faction-war .wsnw-legend span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.faction-war .wsnw-legend span:first-child{text-align:center}\n#wsnw-toolbar{gap:5px;padding:5px 7px;margin:4px 0;border-radius:6px}\n#wsnw-toolbar strong{font-size:11px}\n#wsnw-toolbar button,#wsnw-toolbar select{min-height:27px;padding:3px 6px}\n@media(max-width:600px){.faction-war .wsnw-legend{font-size:8px;gap:2px;padding:3px 4px}.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{gap:2px!important;padding:0 3px!important}}\n";
    style.textContent+='.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="conceded"]{grid-column:4;grid-row:1}'+
      '.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="received"]{grid-column:5;grid-row:1}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-conceded{background:#50303b!important;border-color:#976371!important;color:#ffe1e1!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-conceded.wsnw-unknown{color:#a4b5c3!important;background:#203549!important;border-color:#395168!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-friendly-skull{color:#efd9ff!important;background:#613189!important;border-color:#b67af2!important}'+
      '.faction-war .wsnw-legend.wsnw-our-legend{background:#233142;border-color:#425a70}'+
      '.faction-war .wsnw-legend.wsnw-our-legend{grid-template-columns:26px minmax(0,1.1fr) minmax(0,1.65fr) minmax(0,.72fr) minmax(0,1fr)}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{grid-template-columns:26px minmax(0,1.1fr) minmax(0,1.65fr) minmax(0,.72fr) minmax(0,1fr)!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="presence"]{display:none!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="impact"]{grid-column:3;grid-row:1}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="net"]{grid-column:4;grid-row:1}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="share"]{grid-column:5;grid-row:1}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-net-negative{color:#ffc7c7!important;background:#542b3a!important;border-color:#9d5165!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-net-positive{color:#a4f1cf!important;background:#184b42!important;border-color:#37937a!important}'+
      '.faction-war ul.members-list li .wsnw-intel .wsnw-under-fire-chip{color:#ffe9a2!important;background:#674021!important;border-color:#e4a64d!important;font-weight:900!important}'+
      '.faction-war ul.members-list li.your.wsnw-under-fire{border-left:4px solid #f9ae51!important}';
    // Six aligned mobile-friendly columns: status, earned, given, net,
    // enemy share, incoming scoring hits. Keep Torn's native name/actions.
    style.textContent +=
      '.faction-war .wsnw-legend.wsnw-our-legend,'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{'+
        'grid-template-columns:minmax(0,1.4fr) repeat(4,minmax(0,1fr)) minmax(0,.72fr)!important}'+
      '.faction-war .wsnw-legend.wsnw-our-legend{gap:2px!important;padding:3px 4px!important;'+
        'background:#132e43!important;border-top:2px solid #3caccb!important}'+
      '.faction-war .wsnw-legend.wsnw-our-legend>span,'+
      '.faction-war .wsnw-legend.wsnw-our-legend>button{'+
        'min-width:0!important;box-sizing:border-box!important;text-align:center!important;'+
        'font:800 10px/1.1 system-ui,sans-serif!important;letter-spacing:0!important}'+
      '.faction-war .wsnw-legend.wsnw-our-legend>span{display:flex;align-items:center;'+
        'justify-content:flex-start;color:#a9cddd;padding-left:2px}'+
      '.faction-war .wsnw-legend.wsnw-our-legend .wsnw-sort-heading{display:flex;'+
        'align-items:center;justify-content:center;min-height:32px;padding:3px 1px;'+
        'border:1px solid transparent;border-radius:4px;background:#193a51;'+
        'color:#c2deed;touch-action:manipulation;cursor:pointer;white-space:nowrap;overflow:hidden}'+
      '.faction-war .wsnw-legend.wsnw-our-legend .wsnw-sort-heading.wsnw-sort-active{'+
        'background:#155277;border-color:#61caff;color:#fff;box-shadow:inset 0 -2px #61caff}'+
      '.faction-war .wsnw-legend.wsnw-our-legend .wsnw-sort-heading:focus-visible{'+
        'outline:2px solid #9df1ff;outline-offset:1px}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded){'+
        'height:65px!important;min-height:65px!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{'+
        'height:29px!important;min-height:29px!important;top:36px!important;'+
        'padding:2px 4px!important;gap:2px!important;background:#102d42!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:nth-child(even):not(.wsnw-expanded)>.wsnw-intel{'+
        'background:#17364b!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip{'+
        'box-sizing:border-box!important;min-width:0!important;max-width:100%!important;'+
        'font:800 12px/1.1 system-ui,sans-serif!important;'+
        'font-variant-numeric:tabular-nums!important;text-align:right!important;'+
        'justify-content:flex-end!important;padding:4px 2px!important;'+
        'height:24px!important;border-radius:3px!important;overflow:hidden!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="role"]{'+
        'grid-column:1!important;grid-row:1!important;justify-self:start!important;'+
        'width:23px!important;min-width:23px!important;max-width:23px!important;'+
        'justify-content:center!important;font-size:16px!important;padding:1px!important;z-index:1}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="status"]{'+
        'grid-column:1!important;grid-row:1!important;justify-self:end!important;'+
        'width:100%!important;max-width:100%!important;justify-content:flex-start!important;'+
        'font-size:10px!important;color:#d5ebf6!important;background:transparent!important;border:0!important}'+
      '.faction-war ul.members-list li.your.wsnw-has-skull:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="status"]{'+
        'max-width:calc(100% - 23px)!important;padding-left:2px!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="status"].wsnw-warning{'+
        'color:#ffca79!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="status"].wsnw-soon{'+
        'color:#9bf1bd!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="presence"],'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="country"],'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="underfire"],'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="skullperf"]{'+
        'display:none!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="earned"]{'+
        'grid-column:2!important;grid-row:1!important;color:#b5efff!important;background:#17475d!important;border-color:#32687e!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="given"]{'+
        'grid-column:3!important;grid-row:1!important;color:#ffd3d0!important;background:#54323a!important;border-color:#7d4b56!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="net"]{'+
        'grid-column:4!important;grid-row:1!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="share"]{'+
        'grid-column:5!important;grid-row:1!important;color:#d5d5ff!important;background:#333a5a!important;border-color:#4a5478!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="hits"]{'+
        'grid-column:6!important;grid-row:1!important;justify-content:center!important;'+
        'text-align:center!important;color:#d9e8f3!important;background:#234254!important;border-color:#36576c!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="hits"].wsnw-under-fire-chip{'+
        'color:#ffe9a2!important;background:#674021!important;border-color:#e4a64d!important}'+
      '#wsnw-toolbar [data-wsnw-friendly-sort]{max-width:105px}'+
      '#wsnw-toolbar [data-wsnw-action="friendly-direction"]{'+
        'min-width:28px!important;padding:3px 6px!important;color:#a8ecff!important;font-weight:900!important}'+
      '@media(max-width:430px){'+
        '.faction-war .wsnw-legend.wsnw-our-legend{gap:1px!important;padding:2px 3px!important}'+
        '.faction-war .wsnw-legend.wsnw-our-legend>span,.faction-war .wsnw-legend.wsnw-our-legend>button{'+
          'font-size:9px!important}'+
        '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{'+
          'gap:1px!important;padding:2px 3px!important}'+
        '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip{'+
          'font-size:11px!important;padding:4px 1px!important}'+
      '}';
    document.head.appendChild(style);
  }
  // An opt-in small, draggable chain indicator. Never mounted over an attack page.
  // The user's saved screen position stays on-device; external TWSE bubbles take precedence.
  function renderNativeChainBubble(chain){
    if(cfg.nativeChainBubble!==true||!isNativeWarPage()||
      cfg.nativeWarEnabled===false||document.getElementById('twse-chain-bubble')){
      document.getElementById('wsnw-chain-bubble')?.remove();return;
    }
    let bubble=document.getElementById('wsnw-chain-bubble');
    if(!bubble){
      bubble=document.createElement('div');bubble.id='wsnw-chain-bubble';
      bubble.setAttribute('aria-label','Optional WarStaxx chain bubble; drag to reposition');
      document.body.appendChild(bubble);
      const place=cfg.nativeBubblePosition;
      if(place&&Number.isFinite(Number(place.x))&&Number.isFinite(Number(place.y))){
        bubble.style.right='auto';bubble.style.bottom='auto';
        bubble.style.left=Math.max(0,Math.min(window.innerWidth-100,Number(place.x)))+'px';
        bubble.style.top=Math.max(0,Math.min(window.innerHeight-42,Number(place.y)))+'px';
      }
      bubble.addEventListener('pointerdown',e=>{
        if(e.target.closest('button')||e.button>0)return;
        const rect=bubble.getBoundingClientRect();
        nativeWarState.drag={id:e.pointerId,dx:e.clientX-rect.left,dy:e.clientY-rect.top};
        try{bubble.setPointerCapture(e.pointerId);}catch(_){}
      });
      bubble.addEventListener('pointermove',e=>{
        if(nativeWarState.drag?.id!==e.pointerId)return;
        const x=Math.max(0,Math.min(window.innerWidth-bubble.offsetWidth,e.clientX-nativeWarState.drag.dx));
        const y=Math.max(0,Math.min(window.innerHeight-bubble.offsetHeight,e.clientY-nativeWarState.drag.dy));
        bubble.style.right='auto';bubble.style.bottom='auto';
        bubble.style.left=x+'px';bubble.style.top=y+'px';
      });
      const end=e=>{
        if(nativeWarState.drag?.id!==e.pointerId)return;
        nativeWarState.drag=null;
        cfg.nativeBubblePosition={x:parseFloat(bubble.style.left)||0,y:parseFloat(bubble.style.top)||0};
        saveCfg();
      };
      bubble.addEventListener('pointerup',end);
      bubble.addEventListener('pointercancel',end);
      bubble.addEventListener('click',e=>{
        const btn=e.target.closest('[data-wsnw-bubble]');
        if(!btn)return;
        e.preventDefault();e.stopPropagation();
        if(btn.dataset.wsnwBubble==='toggle'){
          cfg.nativeBubbleMinimized=!cfg.nativeBubbleMinimized;saveCfg();
          bubble.dataset.signature='';
          renderNativeChainBubble(chainStatus());
        }else if(btn.dataset.wsnwBubble==='war')warQuick('war');
      });
    }
    const mini=Boolean(cfg.nativeBubbleMinimized),
      signature=[mini,chain.fresh,chain.count,chain.remaining,chain.nextIn].join(':');
    if(bubble.dataset.signature===signature)return;
    bubble.dataset.signature=signature;
    bubble.innerHTML='<span>'+(!chain.fresh?'Chain unknown':
      'Chain #'+fmt(chain.count)+(mini?'':' | '+chain.remaining+'s'))+'</span>'+
      '<button type="button" data-wsnw-bubble="toggle" aria-label="'+(mini?'Expand':'Minimise')+
      ' chain bubble">'+(mini?'+':'-')+'</button>'+
      (mini?'':'<button type="button" data-wsnw-bubble="war">War</button>');
  }
  function clearNativeWar(){
    document.getElementById('wsnw-toolbar')?.remove();
    document.querySelectorAll('.faction-war .wsnw-legend').forEach(el=>el.remove());
    document.getElementById('wsnw-chain-bubble')?.remove();
    for(const h of document.querySelectorAll('.faction-war ul.members-list li.wsnw-country-heading'))h.remove();
    for(const row of document.querySelectorAll('.faction-war ul.members-list li.wsnw-enhanced')){
      row.classList.remove('wsnw-enhanced','wsnw-recent','wsnw-hospital-soon','wsnw-hospital-warning','wsnw-filtered');
      row.classList.remove('wsnw-heavy-target','wsnw-newly-okay','wsnw-expanded','wsnw-under-fire','wsnw-has-skull');
      row.querySelectorAll('.wsnw-intel,.wsnw-detail,.wsnw-badge,.wsnw-copy').forEach(el=>el.remove());
    }
  }
  function nativeWarLegend(list,rows){
    const enemy=rows.some(row=>row.classList.contains('enemy')),
      ours=!enemy&&rows.some(row=>row.classList.contains('your'));
    if((!enemy&&!ours)||typeof list.before!=='function')return;
    let heading=list.previousElementSibling;
    if(!heading?.classList?.contains('wsnw-legend')){
      heading=el('div','wsnw-legend');
      heading.setAttribute('aria-label','WarStaxx tactical table column headings');
      list.before(heading);
    }
    heading.classList.toggle('wsnw-our-legend',ours);
    const chosen=['given','net','earned','share','hits','torn'].includes(cfg.nativeFriendlySort)?
      cfg.nativeFriendlySort:'given',desc=cfg.nativeFriendlyDesc!==false;
    const sortable=(key,label,help)=>{
      const active=chosen===key;
      return '<button type="button" data-wsnw-sort-field="'+key+'" '+
        'class="wsnw-sort-heading'+(active?' wsnw-sort-active':'')+'" '+
        'title="'+esc(help)+' | Tap again to reverse" '+
        'aria-label="Sort our members by '+esc(help)+
        (active?'; currently '+(desc?'highest first':'lowest first'):'')+'" '+
        'aria-pressed="'+(active?'true':'false')+'">'+label+
        (active?(desc?' ↓':' ↑'):' ↕')+'</button>';
    };
    const columns=ours?
      '<span title="Skull marker, timer or last seen">STATUS</span>'+
      sortable('earned','EARNED','points our member earned attacking the other faction')+
      sortable('given','GIVEN','points the opponent earned attacking this member')+
      sortable('net','NET','observed earned minus given (net proxy)')+
      sortable('share','THEM %','observed proportion of the enemy faction score')+
      sortable('hits','HITS','enemy scoring hits received'):
      '<span>Skull</span><span>Timer / travel</span><span>Seen</span><span>Stats</span><span>FF</span>';
    if(heading.innerHTML!==columns)heading.innerHTML=columns;
    heading.title=ours?'Tap a column to sort; tap again to reverse. ≥ partial minimum, ~ net proxy.':
      'Opponent travel, activity and strength estimates';
  }
  function nativeWarToolbar(box,conflict,score,chain){
    let toolbar=document.getElementById('wsnw-toolbar');
    if(!toolbar){toolbar=document.createElement('div');toolbar.id='wsnw-toolbar';
      toolbar.setAttribute('aria-label','WarStaxx native ranked war controls');}
    if(toolbar.nextElementSibling!==box)box.before(toolbar);
    const mode=['availability','hospital','bss','ff','activity','torn'].includes(cfg.nativeWarSort)?
      cfg.nativeWarSort:'availability';
    const filter=['all','okay','hospital','returning','heavy','assigned','watched','active5','active60','offline'].includes(cfg.nativeWarFilter)?
      cfg.nativeWarFilter:'all';
    const friendlySort=['given','net','earned','share','hits','torn'].includes(cfg.nativeFriendlySort)?cfg.nativeFriendlySort:'given';
    const friendlyDesc=cfg.nativeFriendlyDesc!==false;
    const signature=[mode,filter,friendlySort,friendlyDesc,conflict,nativeWarState.toolbarExpanded,cfg.nativeWarCountryGroups].join(':');
    const scoreText=score?'Us '+fmt(score.our)+' / Them '+fmt(score.enemy):'LIVE WAR';
    const chainText=chain.fresh?'Chain '+fmt(chain.count)+' ('+chain.remaining+'s)':'Chain unknown';
    if(toolbar.dataset.signature===signature){
      const headline=toolbar.querySelector('[data-wsnw-score]'),clock=toolbar.querySelector('[data-wsnw-chain]');
      if(headline&&headline.textContent!=='WARSTAXX | '+scoreText)headline.textContent='WARSTAXX | '+scoreText;
      if(clock&&clock.textContent!==chainText)clock.textContent=chainText;
      return;
    }
    toolbar.dataset.signature=signature;
    toolbar.innerHTML='<strong data-wsnw-score>WARSTAXX | '+scoreText+'</strong>'+
      '<span data-wsnw-chain>'+chainText+'</span>'+
      '<label>Our <select data-wsnw-friendly-sort title="Sort our faction by">'+
      [['given','Given'],['net','Net'],['earned','Earned'],['share','Enemy %'],
        ['hits','Scoring hits'],['torn','Torn order']].map(x=>
        '<option value="'+x[0]+'" '+(friendlySort===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label>'+
      '<button type="button" data-wsnw-action="friendly-direction" title="Reverse our faction sort" '+
        'aria-label="Sort our faction '+(friendlyDesc?'highest first':'lowest first')+
        '; tap to reverse">'+(friendlyDesc?'↓':'↑')+'</button>'+
      '<label>Enemy <select data-wsnw-sort title="Sort opponents by">'+
      [['availability','Availability'],['hospital','Hospital expiry'],['bss','BSS highest'],
        ['ff','FF highest'],['activity','Recent activity'],['torn','Torn order']].map(x=>
        '<option value="'+x[0]+'" '+(mode===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label>'+
      '<label>Show <select data-wsnw-filter>'+
      [['all','All'],['okay','Okay'],['hospital','Hospital'],['returning','Returning'],
        ['active5','Active 5m'],['active60','Active 1h'],['offline','Offline'],
        ['heavy','Black Skull targets'],['assigned','Assigned'],['watched','Watched']].map(x=>
        '<option value="'+x[0]+'" '+(filter===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label>'+
      '<button type="button" data-wsnw-action="war">War Room</button>'+
      '<button type="button" data-wsnw-action="more" aria-expanded="'+
        (nativeWarState.toolbarExpanded?'true':'false')+'">'+(nativeWarState.toolbarExpanded?'Less':'More')+'</button>'+
      (nativeWarState.toolbarExpanded?'<button type="button" data-wsnw-action="skulls">Skulls</button>'+
        '<button type="button" data-wsnw-action="turtle">Turtle</button>'+
        '<button type="button" data-wsnw-action="hit">HIT</button>':'')+
      (conflict?'<span class="wsnw-note">Another script controls row order</span>':'');
  }
    function syncNativeWar(){
    if(!isNativeWarPage()||cfg.nativeWarEnabled===false||!activeWarNow()){
      if(document.getElementById('wsnw-toolbar'))clearNativeWar();return;
    }
    const box=document.querySelector('.faction-war');
    if(!box||!box.parentNode)return;
    const lists=Array.from(box.querySelectorAll('ul.members-list'));
    if(!lists.length)return;
    nativeWarStyle();
    const enemyMap=new Map(state.data.enemies.map(p=>[p.id,p])),
      ourMap=new Map(state.data.ours.map(p=>[p.id,p])),
      band=enemyRoleBands(),fresh=rosterFresh('enemies'),score=warScore(),chain=chainStatus(),
      concessions=cfg.autoConceded===false?null:inboundWarImpact(state.data.war.id);
    const conflict=lists.some(nativeWarConflict);
    nativeWarToolbar(box,conflict,score,chain);
    renderNativeChainBubble(chain);
    const orders=new Map();
    for(const [friendId,targetId] of Object.entries(cfg.assignments)){
      const name=ourMap.get(positive(friendId))?.name;
      if(name&&positive(targetId))orders.set(positive(targetId),name);
    }
    for(const list of lists){
      const rows=nativeWarRows(list);
      if(typeof nativeWarLegend==='function')nativeWarLegend(list,rows);
      for(const row of rows){
        const id=nativeWarPlayerId(row),enemy=row.classList.contains('enemy'),
          p=(enemy?enemyMap:ourMap).get(id);
        if(!p)continue;
        const status=row.querySelector('div.status'),member=row.querySelector('div.member');
        if(!status||!member)continue;
        row.classList.add('wsnw-enhanced');
        row.classList.toggle('wsnw-filtered',enemy&&!nativeWarFilters(p,band,cfg.nativeWarFilter||'all'));
        const now=Date.now(),recent=enemy&&fresh?nativeWarTransition(id,now):null;
        row.classList.toggle('wsnw-recent',Boolean(recent));
        row.classList.toggle('wsnw-newly-okay',Boolean(recent));
        const expanded=nativeWarState.expandedId===id;
        row.classList.toggle('wsnw-expanded',expanded);
        row.classList.toggle('wsnw-heavy-target',enemy&&band.heavy.has(id));
        row.classList.toggle('wsnw-has-skull',!enemy&&Boolean(cfg.blackSkulls[id]));
        const kind=memberState(p);
        const hospitalTier=kind==='hospital'&&(!enemy||fresh)?nativeWarHospitalTier(p.until,now):'';
        row.classList.toggle('wsnw-hospital-soon',hospitalTier==='wsnw-soon');
        row.classList.toggle('wsnw-hospital-warning',hospitalTier==='wsnw-warning');
        const other=Boolean(status.hasAttribute('data-twse-overridden')||row.querySelector('.twse-copy-btn'));
        // v1.5.9 migration: remove the former labels from the fixed-height player-name cell.
        member.querySelectorAll('.wsnw-detail,.wsnw-badge,.wsnw-copy').forEach(x=>x.remove());
        status.querySelectorAll('.wsnw-detail,.wsnw-badge,.wsnw-copy').forEach(x=>x.remove());
        let infoBar=row.querySelector(':scope > .wsnw-intel');
        if(!infoBar){
          infoBar=el('div','wsnw-intel');infoBar.setAttribute('aria-label','WarStaxx player intelligence');
          row.appendChild(infoBar);
        }
        infoBar.dataset.wsnwToggle=String(id);
        infoBar.setAttribute('role','button');
        infoBar.setAttribute('tabindex','0');
        infoBar.setAttribute('aria-expanded',expanded?'true':'false');
        infoBar.setAttribute('aria-label',(expanded?'Collapse':'Expand')+' WarStaxx intelligence for '+p.name);
        let name=infoBar.querySelector('.wsnw-owner');
        if(!name){name=el('strong','wsnw-owner');infoBar.insertBefore(name,infoBar.firstChild);}
        const nameLabel=(expanded?'- ':'+ ')+p.name;
        if(name.textContent!==nameLabel)name.textContent=nameLabel;
        name.title=p.name+' ['+id+']';
        const chip=(key,value,variant='',title='')=>{
          let x=infoBar.querySelector('[data-wsnw-chip="'+key+'"]');
          if(value===null||value===undefined||value===''){x?.remove();return;}
          if(!x){x=el('span','wsnw-chip');x.dataset.wsnwChip=key;infoBar.appendChild(x);}
          const cls='wsnw-chip '+(key==='status'?'wsnw-status':key==='role'?'wsnw-role':'')+' '+variant;
          if(x.className!==cls)x.className=cls;
          if(x.textContent!==value)x.textContent=value;
          if(title&&x.title!==title)x.title=title;
          return x;
        };
        let message='';
        if(enemy&&!fresh)message='STALE';
        else if(other)message=''; // External timer already sits in Torn's normal status cell.
        else if(kind==='hospital')message=expanded?'HOSP '+hospitalCountdown(p.until,now):nativeWarHospitalShort(p.until,now);
        else if(kind==='away'){
          const place=nativeWarLocation(p);
          if(place.phase==='inbound')message='TO '+place.country+(place.eta?' '+flightCountdown(place.eta,now):'');
          else if(place.phase==='abroad')message='In '+place.country;
          else message=place.phase==='unknown-travel'?'FLIGHT | DEST HIDDEN':'LOCATION UNKNOWN';
        }else if(kind==='okay')message=enemy?'':nativeWarLastSeen(p,now); // Own last action when no timer.
        if(recent)message=recent.kind+' | '+(message||'OKAY');
        const place=nativeWarLocation(p);
        const timer=chip('status',message,(kind==='hospital'&&(!enemy||fresh)?'wsnw-hospital ':'')+hospitalTier,'Torn roster observed '+age(state.data.updated[enemy?'enemies':'ours'])+
          ' | '+place.country+' ('+place.source+')');
        if(timer){
          if(kind==='hospital'&&!other&&(!enemy||fresh))timer.dataset.wsnwExpiry=String(positive(p.until));
          else timer.removeAttribute('data-wsnw-expiry');
          if(kind==='away'&&place.phase==='inbound'&&positive(place.eta)){
            timer.dataset.wsnwEta=String(place.eta);
            timer.dataset.wsnwCountry=place.country;
          }else{timer.removeAttribute('data-wsnw-eta');timer.removeAttribute('data-wsnw-country');}
        }
        let role='';
        if(enemy)role=band.heavy.has(id)?'\u2620':
          expanded?(band.regular.has(id)?'REGULAR':'UNKNOWN'):'';
        else if(cfg.blackSkulls[id])role='☠';
        const roleChip=chip('role',role,enemy&&band.heavy.has(id)?'wsnw-heavy':
          !enemy&&cfg.blackSkulls[id]?'wsnw-friendly-skull':'',
          enemy?'BLACK SKULL TARGET: high-strength opponent reserved for Black Skulls; not a guaranteed win':'Your Black Skulls member');
        if(roleChip&&enemy&&band.heavy.has(id)&&timer&&roleChip.nextElementSibling!==timer)
          infoBar.insertBefore(roleChip,timer);
        const country=chip('country',place.country!=='Torn'&&place.country!=='Unknown'&&kind!=='away'?place.country:'',
          'wsnw-country','Reported location: '+place.country+' | '+place.source);
        const seen=chip('presence',enemy||expanded?nativeWarLastSeen(p,now):'',isOnline(p)?'wsnw-online':'wsnw-presence',
          'Last Torn action '+age(p.lastAt)+' | status '+p.lastAction);
        if(seen){seen.dataset.wsnwLastAt=String(positive(p.lastAt));
          seen.dataset.wsnwAction=String(p.lastAction||'Unknown');}
        if(enemy){
          const strength=nativeWarStrength(p);
          const strengthChip=chip('bss',strength.short,'',strength.detail);
          if(country&&strengthChip&&country.nextElementSibling!==strengthChip)infoBar.insertBefore(country,strengthChip);
          if(seen&&strengthChip&&seen.nextElementSibling!==strengthChip)infoBar.insertBefore(seen,strengthChip);
          const ff=ffLabel(id);
          chip('ff',ff.source==='estimate'?(expanded?'Your FF ':'FF ')+ff.value+
              (ff.ff>4.5?(expanded?' RISK':' !'):ff.ff>3?(expanded?' HARD':' !'):''):
            ff.source==='observed'?(expanded?'Team FF ':'FF ')+ff.value:'',
            ff.source==='estimate'&&ff.ff>4.5?'wsnw-ff-danger':
              ff.source==='estimate'&&ff.ff>3?'wsnw-ff-risk':'',
            ff.source==='estimate'?'Uncapped FFScouter strength/difficulty estimate for the API-key owner. Torn awarded FF max 3.00; an FF above 4.5 can indicate a much stronger target.':
              'Historical team FF from attacks, never a predicted win');
          chip('order',expanded?(orders.has(id)?'TO '+orders.get(id):cfg.watchlist[id]?'WATCH':''):
            orders.has(id)?'ORDER':cfg.watchlist[id]?'WATCH':'',
            '',orders.has(id)?'Local assigned hitter':'Watchlisted target');
        }else{
          for(const key of ['bss','ff','order','conceded','received','impact'])chip(key,'');
          const impact=cfg.autoConceded===false?null:liveWarMemberImpact(id),
            captured=Boolean(impact?.known),complete=Boolean(impact?.complete),
            observed=value=>value===null||value===undefined?'—':
              (complete?'':'≥')+(nativeCompactTotal(value)||'0'),
            earned=observed(impact?.earned??null),given=observed(impact?.given??null),
            net=impact?.net===null||impact?.net===undefined?'—':
              (complete?'~':'')+(impact.net>=0?'+':'−')+
                (nativeCompactTotal(Math.abs(impact.net))||'0'),
            share=impact?.share===null||impact?.share===undefined?'—':
              (complete?'':'≥')+fmt(impact.share)+'%',
            hits=observed(impact?.hits??null),hot=Boolean(impact?.underFire),
            source=cfg.autoConceded===false?'Live impact scanning disabled in Settings':
              !captured?'Awaiting current-war attack-history scan':
              complete?'Scanned through '+stamp(impact.lastFetch):
                'Incomplete attack-history scan; earned/given are minimums and net is uncertain',
            detail='Earned: points we gained against the opponent. Given: points the enemy gained hitting this member. '+
              'These are observed ranked-war attack respect gains, not a verified official per-member score. '+source+
              (impact?.error?' | '+impact.error:'');
          row.classList.toggle('wsnw-under-fire',hot);
          chip('earned',expanded?'EARNED '+earned:earned,'wsnw-earned',detail);
          chip('given',expanded?'GIVEN '+given:given,'wsnw-conceded',detail);
          chip('net',expanded?'NET '+net:net,
            impact?.net===null?'wsnw-unknown':impact.net<0?'wsnw-net-negative':'wsnw-net-positive',
            'Net = earned minus given, a proxy, not an official personal war score. '+source);
          chip('share',expanded?'ENEMY SCORE SHARE '+share:share,'',
            'Observed share of the official live enemy faction score from attacks on this member. '+source);
          chip('hits',expanded?'ENEMY SCORING HITS '+hits:hits+(hot?'!':''),
            hot?'wsnw-under-fire-chip':'',
            'Scoring enemy attacks received; ! = repeated attacks recently. '+source);
          chip('underfire',expanded&&hot?'REPEATED HITS: '+impact.in30+
            ' in 30m / '+impact.in60+' in 60m':'','wsnw-under-fire-chip',
            'Repeated incoming attack pressure; review turtling or protection');
          chip('skullperf',expanded&&cfg.blackSkulls[id]?
            'BLACK SKULL | OUR HITS '+observed(impact?.ownHits??null)+
            ' | EARN / HIT '+(impact?.ownHits&&impact.earned!==null?fmt(impact.earned/impact.ownHits):'—'):'',
            'wsnw-friendly-skull','Observed Black Skull offensive performance. '+source);
        }
        let intel=infoBar.querySelector('.wsnw-intel-link');
        if(enemy){
          if(!intel){intel=el('button','wsnw-intel-link','Intel');intel.type='button';infoBar.appendChild(intel);}
          intel.dataset.wsnwIntel=String(id);
          intel.classList.toggle('wsnw-details-only',!expanded);
          intel.setAttribute('aria-label','Open full intelligence for '+p.name);
        }else intel?.remove();
        let copy=infoBar.querySelector('.wsnw-copy');
        if(!row.querySelector('.twse-copy-btn')){
          if(!copy){copy=el('button','wsnw-copy','Copy');copy.type='button';infoBar.appendChild(copy);}
          copy.dataset.wsnwCopy=String(id);
          copy.classList.toggle('wsnw-details-only',!expanded);
          copy.setAttribute('aria-label','Copy '+p.name+' ['+id+']');
        }else copy?.remove();
        // The intelligence bar is absolutely positioned above the Torn row; its
        // wrapped height must be reflected on the parent or the next row overlaps it.
        if(expanded){
          const rowHeight=Math.max(90,36+Math.ceil(Number(infoBar.scrollHeight)||0)+5);
          row.style?.setProperty?.('--wsnw-expanded-height',rowHeight+'px');
        }else row.style?.removeProperty?.('--wsnw-expanded-height');
      }
      if(!conflict){
        if(rows.some(row=>row.classList.contains('enemy'))){
          if(fresh)nativeWarSort(list,enemyMap,cfg.nativeWarSort||'availability');
        }else if(rows.some(row=>row.classList.contains('your'))){
          nativeWarSortFriendly(list,cfg.nativeFriendlySort||'given');
        }
      }
    }
  }
  if(typeof window!=='undefined'&&typeof window.addEventListener==='function')
    window.addEventListener('resize',()=>{
      if(nativeWarState.expandedId&&isNativeWarPage())syncNativeWar();
    },{passive:true});
  async function pollNativeWar(){
    if(!isNativeWarPage()||document.hidden||cfg.nativeWarEnabled===false||
      !effectiveKey()||!positive(cfg.enemyId)||!activeWarNow()||
      state.loading||nativeWarState.pollBusy)return;
    nativeWarState.pollBusy=true;
    try{
      const prior=state.data.enemies.slice(),oldAt=n(state.data.updated.enemies);
      // Only the existing official Torn faction-members endpoint; never scrape opponent pages.
      const fresh=await call('/faction/'+cfg.enemyId+'/members','enemies',20000);
      if(fresh){
        const next=roster(fresh);
        if(oldAt&&Date.now()-oldAt<5*MIN)
          observeNativeWarTransitions(prior,next,positive(state.data.war?.id));
        state.data.enemies=next;
        if(oldAt&&Date.now()-oldAt<5*MIN)
          recordAvailability(prior,next,positive(state.data.war?.id));
        save();publish();if(state.open)render();syncNativeWar();
      }
      // Keep the API-key owner's real location current without adding a new endpoint.
      if(positive(cfg.ourId)&&canCall('ours',60000)){
        try{
          const ours=await call('/faction/'+cfg.ourId+'/members','ours',60000);
          if(ours){state.data.ours=roster(ours);save();}
        }catch(_){}
      }
      if(canCall('chain',30000)){
        try{
          const chain=await call('/faction/'+cfg.ourId+'/chain','chain',30000);
          if(chain){const data=chainSnapshot(chain);if(data){state.data.chain=data;save();}}
        }catch(_){}
      }
      await refreshWarConcessions();
      syncNativeWar();
    }catch(e){
      // Shared call() already handles API rate-limit/error backoff. Keep the native UI stable.
      state.data.errors.nativeWar=String(e.message||e).slice(0,150);
    }finally{nativeWarState.pollBusy=false;}
  }
  function tickNativeWar(){
    if(!isNativeWarPage()||document.hidden)return;
    const now=Date.now();
    if(cfg.nativeChainBubble===true&&activeWarNow())renderNativeChainBubble(chainStatus());
    for(const span of document.querySelectorAll('.faction-war .wsnw-intel [data-wsnw-expiry],.faction-war .wsnw-intel [data-wsnw-eta]')){
      const expiry=positive(span.dataset.wsnwExpiry)||positive(span.dataset.wsnwEta);
      const row=span.closest('li.enemy,li.your');
      if(!row||!expiry)continue;
      const id=nativeWarPlayerId(row),p=state.data.enemies.find(x=>x.id===id)||
        state.data.ours.find(x=>x.id===id);
      if(!p)continue;
      const recent=nativeWarTransition(id,now),kind=memberState(p),place=nativeWarLocation(p);
      let value='';
      if(kind==='hospital'&&expiry){
        value=(recent?recent.kind+' | ':'')+
          (row.classList.contains('wsnw-expanded')?'HOSP '+hospitalCountdown(expiry,now):nativeWarHospitalShort(expiry,now));
      }else if(kind==='away'&&place.phase==='inbound'){
        value='TO '+place.country+(place.eta?' '+flightCountdown(place.eta,now):'');
      }else continue;
      if(span.textContent!==value)span.textContent=value;
      const tier=kind==='hospital'?nativeWarHospitalTier(expiry,now):'';
      span.classList.toggle('wsnw-soon',tier==='wsnw-soon');
      span.classList.toggle('wsnw-warning',tier==='wsnw-warning');
      row.classList.toggle('wsnw-hospital-soon',tier==='wsnw-soon');
      row.classList.toggle('wsnw-hospital-warning',tier==='wsnw-warning');
    }
    for(const span of document.querySelectorAll('.faction-war .wsnw-intel [data-wsnw-last-at]')){
      const next=nativeWarLastSeen({lastAt:Number(span.dataset.wsnwLastAt),lastAction:span.dataset.wsnwAction},now);
      if(span.textContent!==next)span.textContent=next;
    }
  }
  document.addEventListener('click',e=>{
    const intel=e.target?.closest?.('[data-wsnw-intel]');
    if(intel&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      focusOpportunity(positive(intel.dataset.wsnwIntel));return;
    }
    const copy=e.target?.closest?.('[data-wsnw-copy]');
    if(copy&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      const id=positive(copy.dataset.wsnwCopy),
        p=state.data.enemies.find(x=>x.id===id)||state.data.ours.find(x=>x.id===id);
      if(!p)return;
      const value=p.name+' ['+p.id+']';
      const done=()=>{if(copy.isConnected){copy.textContent='Copied';setTimeout(()=>{
        if(copy.isConnected)copy.textContent='Copy';},1300);}};
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(done).catch(()=>{});
      else{const t=el('textarea');t.value=value;t.style.cssText='position:fixed;left:-9999px';
        document.body.appendChild(t);t.select();try{if(document.execCommand('copy'))done();}catch(_){}t.remove();}
      return;
    }
    const sortHeading=e.target?.closest?.('.faction-war .wsnw-our-legend [data-wsnw-sort-field]');
    if(sortHeading&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      const next=String(sortHeading.dataset.wsnwSortField);
      if(!['earned','given','net','share','hits'].includes(next))return;
      if(cfg.nativeFriendlySort===next)cfg.nativeFriendlyDesc=cfg.nativeFriendlyDesc===false;
      else {cfg.nativeFriendlySort=next;cfg.nativeFriendlyDesc=true;}
      saveCfg();syncNativeWar();return;
    }
    const toggle=e.target?.closest?.('.faction-war .wsnw-intel[data-wsnw-toggle]');
    if(toggle&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      const id=positive(toggle.dataset.wsnwToggle);
      nativeWarState.expandedId=nativeWarState.expandedId===id?0:id;
      syncNativeWar();return;
    }
    const button=e.target?.closest?.('#wsnw-toolbar [data-wsnw-action]');
    if(button&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      if(button.dataset.wsnwAction==='friendly-direction'){
        cfg.nativeFriendlyDesc=cfg.nativeFriendlyDesc===false;
        saveCfg();syncNativeWar();return;
      }
      if(button.dataset.wsnwAction==='more'){
        nativeWarState.toolbarExpanded=!nativeWarState.toolbarExpanded;
        syncNativeWar();return;
      }
      warQuick(String(button.dataset.wsnwAction));
    }
  },true);
  document.addEventListener('keydown',e=>{
    const bar=e.target?.closest?.('.faction-war .wsnw-intel[data-wsnw-toggle]');
    if(!bar||!isNativeWarPage()||!['Enter',' '].includes(e.key))return;
    e.preventDefault();e.stopPropagation();
    const id=positive(bar.dataset.wsnwToggle);
    nativeWarState.expandedId=nativeWarState.expandedId===id?0:id;
    syncNativeWar();
  },true);
  // An explicit Torn column-header click hands ordering back to Torn instead of
  // continually undoing the player's native sort choice.
  document.addEventListener('click',e=>{
    if(!isNativeWarPage()||cfg.nativeWarEnabled===false)return;
    const header=e.target?.closest?.(
      '.faction-war .white-grad .member,.faction-war .white-grad .level,'+
      '.faction-war .white-grad .points,.faction-war .white-grad .status');
    if(!header||(cfg.nativeWarSort==='torn'&&cfg.nativeFriendlySort==='torn'))return;
    cfg.nativeWarSort='torn';cfg.nativeFriendlySort='torn';saveCfg();
    setTimeout(()=>{
      const box=document.querySelector('.faction-war');
      for(const list of box?.querySelectorAll('ul.members-list')||[]){
        nativeWarState.original.delete(list);nativeWarState.ourOriginal.delete(list);
      }
      syncNativeWar();
    },350);
  },true);
  document.addEventListener('change',e=>{
    const sort=e.target?.closest?.('#wsnw-toolbar [data-wsnw-sort]'),
      friendlySort=e.target?.closest?.('#wsnw-toolbar [data-wsnw-friendly-sort]'),
      filter=e.target?.closest?.('#wsnw-toolbar [data-wsnw-filter]');
    if(sort){cfg.nativeWarSort=String(sort.value);saveCfg();syncNativeWar();}
    if(friendlySort){cfg.nativeFriendlySort=String(friendlySort.value);cfg.nativeFriendlyDesc=true;saveCfg();syncNativeWar();}
    if(filter){cfg.nativeWarFilter=String(filter.value);saveCfg();syncNativeWar();}
  });
  function mountFactionShortcut(){
    // The persistent strip replaces the old faction-only duplicate shortcut.
    document.getElementById('warstaxx-faction-open')?.remove();
  }
  function boot(){
    if(!document.body){document.addEventListener('DOMContentLoaded',boot,{once:true});return;}
    styleSheet();document.body.appendChild(root);
    // Show a low-profile, on-page fallback on faction routes; never create another floating FAB.
    renderWarStrip();mountFactionShortcut();syncNativeWar();
    if(!root.querySelector('.ws-panel')||!root.querySelector('.ws-tabs')||
       !root.querySelector('.ws-content')||!root.querySelector('.ws-sync'))
       throw new Error('War panel elements are missing');
    window.__warStaxxReady=true;
    window.__warStaxxStartError='';
    // Update the real DOM beacon without relying on cross-script events or shared storage.
    const beacon=document.getElementById('tornstaxx-war-execution-probe');
    if(beacon){beacon.dataset.phase='ready';beacon.dataset.observed=String(Date.now());}
    publish();
    document.dispatchEvent(new CustomEvent('staxx:ping'));
    setTimeout(announce,2500);
    setTimeout(announce,9000);
    if(effectiveKey())setTimeout(()=>{if(!document.hidden)refresh(false);},2000);
  }
  // Registration maintenance is local-only; it does not query the Torn API.
  const registrationTimer=setInterval(()=>{if(!document.hidden){
    announce();renderWarStrip();mountFactionShortcut();syncNativeWar();
    document.dispatchEvent(new CustomEvent('staxx:ping'));
  }},45000);
  const warStripTimer=setInterval(()=>{if(!document.hidden)renderWarStrip();},10000);
  const hospitalClockTimer=setInterval(()=>{if(!document.hidden)updateHospitalCountdowns();},10000);
  const nativeWarTimer=setInterval(()=>{if(!document.hidden)syncNativeWar();},5000);
  const nativeWarClock=setInterval(tickNativeWar,1000);
  const nativeWarPolling=setInterval(()=>{if(!document.hidden)pollNativeWar();},20000);
  // Torn can navigate to an attack without a full reload.
  const warRouteTimer=setInterval(()=>{if(!document.hidden&&
    state.stripRouteKey!==location.pathname+location.search+location.hash){renderWarStrip(true);syncNativeWar();}},1000);
  document.addEventListener('click',e=>{
    const a=e.target?.closest?.('a[href]');if(!a)return;
    try{
      const u=new URL(a.href,location.href);
      if(u.hostname===location.hostname&&['/loader.php','/page.php'].includes(u.pathname.toLowerCase())&&
        (u.searchParams.get('sid')||'').toLowerCase().startsWith('attack')){
        document.getElementById('warstaxx-live-strip')?.remove();
        document.getElementById('wsnw-chain-bubble')?.remove();
      }
    }catch(_){}
  },true);
  const sharedPolling=setInterval(()=>{if(!document.hidden&&sharedEndpoint()&&sharedScope())
    sharedPull(false);},90000);
  window.addEventListener('scroll',handleWarScroll,{passive:true});
  document.addEventListener('scroll',handleWarScroll,{passive:true,capture:true});
  window.addEventListener('popstate',()=>{renderWarStrip(true);syncNativeWar();});
  window.addEventListener('hashchange',()=>{renderWarStrip(true);syncNativeWar();});
  const refreshTimer=setInterval(()=>{
    if(!document.hidden&&effectiveKey()&&!state.loading&&Date.now()-state.lastRefresh>cfg.refreshSeconds*1000)refresh(false);
  },30000);
  window.addEventListener('beforeunload',()=>{clearInterval(refreshTimer);clearInterval(registrationTimer);clearInterval(warStripTimer);clearInterval(warRouteTimer);clearInterval(hospitalClockTimer);clearInterval(nativeWarTimer);clearInterval(nativeWarClock);clearInterval(nativeWarPolling);clearNativeWar();},{once:true});
  try{boot();}catch(err){
    window.__warStaxxReady=false;
    window.__warStaxxStartError='Startup failed ('+(err?.name||'Error')+')';
    const beacon=document.getElementById('tornstaxx-war-execution-probe');
    if(beacon){beacon.dataset.phase='error';beacon.dataset.observed=String(Date.now());}
    try{document.dispatchEvent(new CustomEvent('staxx:ping'));}catch(_){}
  }
})();
