// ==UserScript==
// @name         War-TornStaxx - Ranked War Intelligence
// @namespace    https://github.com/Tom-Peters/Torn-WarStaxx
// @homepageURL  https://github.com/Tom-Peters/Torn-WarStaxx
// @supportURL   https://github.com/Tom-Peters/Torn-WarStaxx/issues
// @version      3.0.3
// @description  Ranked-war strategy, roster monitoring, prior-war intelligence, verified FF observations and player assignments.
// @author       IamEEKY
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      ffscouter.com
// @connect      *.workers.dev
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
  const id='war', version='3.0.3';
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
  const ID='war', VER='3.0.3', CONFIG='warstaxx-config-v1', DATA='warstaxx-data-v1';
  const API='https://api.torn.com/v2', MIN=60000, HOUR=3600000;
  const sections=['overview','enemy','reports','leader','skulls','commander','operations','ledger','threats','control','turtle','command','pace','afteraction','targets','matchups','timeline','intel','history','activity','strategy','assignments','alerts','settings','diagnostics','dashboard','scouting','archive','scouter','squad','brief','heatmap','flights','combat'];
  const labels={scouter:'FFScouter Premium',overview:'Live war',enemy:'Players',reports:'Tools & reports',leader:'Skull Capo command',skulls:'Black Skulls',commander:'Quick command',operations:'Operations',ledger:'Hit ledger',threats:'Enemy threats',control:'Hospital control',turtle:'Turtling',command:'Leadership',pace:'War pace',afteraction:'After action',intel:'Enemy intel',targets:'Players',matchups:'Matchups',timeline:'War timelines',strategy:'Strategy',activity:'Activity',history:'Past wars',assignments:'Orders',alerts:'Alerts',settings:'Settings',diagnostics:'Diagnostics',dashboard:'Full dashboard',scouting:'Faction scouting',archive:'Detailed reports',squad:'Black Skull command',brief:'War briefing',heatmap:'Activity and forecasts',flights:'Defensive travel',combat:'Combat archive'};
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
  const defaults={key:'',ourId:0,enemyId:0,factionAuto:true,factionSource:'',factionVerifiedAt:0,refreshSeconds:120,historyLimit:12,enableAttacks:false,autoConceded:true,ffEnabled:false,ffConsent:false,ffKey:'',assignments:{},ordersByEnemy:{},turtlePlans:{},controlAssignments:{},blackSkulls:{},spies:{},notes:{},watchlist:{},planStatus:{},leaderNotes:{},manualReadiness:{},autoOwnerReadiness:true,warStripCompact:true,warStripScope:'contextual',nativeWarEnabled:true,nativeWarCountryGroups:true,nativeWarSort:'availability',nativeEnemyMetric:'points',nativeFriendlySort:'given',nativeFriendlyDesc:true,nativeWarFilter:'all',nativeFriendlyFilter:'all',nativeChainBubble:false,priorityNotifications:true,hitterRisk:{},heavyPolicy:{version:2,mode:'relative',percent:40,minBss:0},manualHeavyTargetsByEnemy:{},shared:{enabled:false,endpoint:'',token:'',canWrite:false},hidden:false};
  const cfg=Object.assign({},defaults,safeRead(CONFIG,{}));
  if(!cfg.commandMetric)cfg.commandMetric=['percent','min-bss'].includes(cfg.heavyPolicy?.mode)?'legacy':'bse';
  if(cfg.nativeWarCountryGroups!==false){
    if(cfg.nativeWarSort==='torn')cfg.nativeWarSort='availability';
    if(cfg.nativeFriendlySort==='torn')cfg.nativeFriendlySort='given';
  }
  cfg.assignments=cfg.assignments&&typeof cfg.assignments==='object'?cfg.assignments:{};
  cfg.ordersByEnemy=cfg.ordersByEnemy&&typeof cfg.ordersByEnemy==='object'?cfg.ordersByEnemy:{};
  // Treat existing local orders as belonging to the currently configured opponent.
  if(positive(cfg.enemyId)&&!Object.prototype.hasOwnProperty.call(cfg.ordersByEnemy,String(cfg.enemyId))&&
     Object.keys(cfg.assignments).length)cfg.ordersByEnemy[String(cfg.enemyId)]={...cfg.assignments};
  cfg.turtlePlans=cfg.turtlePlans&&typeof cfg.turtlePlans==='object'?cfg.turtlePlans:{};
  cfg.controlAssignments=cfg.controlAssignments&&typeof cfg.controlAssignments==='object'?cfg.controlAssignments:{};
  cfg.blackSkulls=cfg.blackSkulls&&typeof cfg.blackSkulls==='object'?cfg.blackSkulls:{};
  cfg.manualHeavyTargetsByEnemy=cfg.manualHeavyTargetsByEnemy&&
    typeof cfg.manualHeavyTargetsByEnemy==='object'&&!Array.isArray(cfg.manualHeavyTargetsByEnemy)?
    cfg.manualHeavyTargetsByEnemy:{};
  // Migrate earlier percentage-based installations to the newly requested
  // default once; retain their old percentage and BSS values as alternatives.
  const heavyRuleMigrated=cfg.heavyPolicy?.version!==2;
  if(heavyRuleMigrated)cfg.heavyPolicy={...cfg.heavyPolicy,version:2,mode:'relative'};
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
  // BEGIN bundled intelligence.js
  // Locally stored evidence is shared between sessions on this Torn origin.
  const combatArchive = {db:null, fights:new Map(), pairs:new Map(), people:new Map(), hours:new Map(), error:'', ready:false};
  const idKey = v => Number.isSafeInteger(v) && v>0 && v<=9999999999;
  const pairKey = (a,b) => Math.min(a,b)+'/'+Math.max(a,b);
  function indexFight(row){
    combatArchive.fights.set(row.id,row);
    if(!row.attacker||!row.defender)return;
    const key=pairKey(row.attacker,row.defender);
    if(!combatArchive.pairs.has(key))combatArchive.pairs.set(key,new Map());
    combatArchive.pairs.get(key).set(row.id,row);
  }
  function pairRows(a,b){return Array.from(combatArchive.pairs.get(pairKey(a,b))?.values()||[]);}
  function fightOutcome(result){
    if(/^(attacked|left|hospitali[sz]ed|mugged|looted|won|victory)$/i.test(result))return 'wins';
    if(/^(lost|defeated)$/i.test(result))return 'losses';
    return /^stalemate$/i.test(result)?'stalemates':'unknown';
  }
  function pairEvidence(rows,hitter,at,ratio=null){
    const totals=()=>({wins:0,losses:0,stalemates:0,unknown:0});
    const offense=totals(),defense=totals(),recent=[];
    for(const row of rows.filter(r=>r.at>0&&r.at<=at).sort((a,b)=>b.at-a.at)){
      const outcome=fightOutcome(row.result);
      if(row.attacker===hitter){
        offense[outcome]++;
        if(outcome!=='unknown'&&at-row.at<=30*86400000)recent.push(outcome);
      }else defense[outcome==='wins'?'losses':outcome==='losses'?'wins':outcome]++;
    }
    const category=recent[0]==='losses'||recent[0]==='stalemates'||ratio>=1.15?'Avoid or reassess':
      recent[0]==='wins'&&ratio!==null&&ratio<1?'Proven favourable matchup':
      recent[0]==='wins'||(ratio!==null&&ratio<0.8)?'Possible favourable matchup':'Insufficient evidence';
    return {offense,defense,recent,category};
  }
  const archiveNumbers=['at','startedAt','endedAt','attackerFaction','defenderFaction','warId','ff','respect','respectLoss','chain','chainBonus','modifierWar','modifierRetaliation','modifierOverseas','modifierGroup','modifierWarlord'];
  function cleanFight(raw){
    if(!raw||!idKey(raw.id)||(!idKey(raw.attacker)&&!idKey(raw.defender))||raw.attacker===raw.defender||
      !Number.isSafeInteger(raw.at)||raw.at<1e12||raw.at>Date.now()+60000)return null;
    const row={id:raw.id};if(idKey(raw.attacker))row.attacker=raw.attacker;if(idKey(raw.defender))row.defender=raw.defender;
    for(const k of archiveNumbers)if(typeof raw[k]==='number'&&Number.isFinite(raw[k])&&raw[k]>=0&&(!['attackerFaction','defenderFaction','warId','startedAt','endedAt'].includes(k)||raw[k]>0))row[k]=raw[k];
    for(const k of ['result','attackerName','defenderName'])if(typeof raw[k]==='string'&&raw[k])row[k]=raw[k].slice(0,80);
    if(typeof raw.ranked==='boolean')row.ranked=raw.ranked;
    const dated={};
    for(const [side,who] of [['attacker',row.attacker],['defender',row.defender]]){
      const prior=raw.spyEvidence?.[side],live=spy(who);
      const valid=v=>v?.observedAt>0&&v.observedAt<=row.at&&bsScore(v)!==null;
      const evidence=valid(prior)?prior:valid(live)?live:null;
      if(evidence)dated[side]={observedAt:evidence.observedAt,source:String(evidence.source||'Local dated spy').slice(0,60),
        ...Object.fromEntries(['strength','speed','defense','dexterity'].map(k=>[k,Number(evidence[k])]))};
    }
    if(Object.keys(dated).length)row.spyEvidence=dated;
    return row;
  }
  function transact(store,callback){
    return new Promise((resolve,reject)=>{
      const tx=combatArchive.db.transaction(store,'readwrite');
      tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error||Error('Local archive write failed'));
      callback(tx.objectStore(store),tx);
    });
  }
  const archiveFailure=()=>{combatArchive.error='Local intelligence could not be saved. Export a backup and check device storage.';};
  const permittedSources=['Torn personal','Torn faction','Torn ranked attacks','Legacy local','Local import'];
  async function keepFights(rows,source){
    await archiveReady;
    if(!combatArchive.db||!rows.length)return;
    const staged=new Map();let newCount=0,existingCount=0;
    await transact('fights',store=>{
      const total=store.count();total.onsuccess=()=>{existingCount=total.result;};
      for(const raw of rows){
        const row=cleanFight(raw);if(!row||staged.has(row.id))continue;
        staged.set(row.id,null);
        const req=store.get(row.id);
        req.onsuccess=()=>{
          const old=req.result;
          if(old&&['attacker','defender'].some(k=>old[k]&&row[k]&&old[k]!==row[k]))return;
          if(!old&&existingCount+newCount>=40000){combatArchive.error='Combat archive capacity reached. Export your archive before collecting more.';return;}
          if(!old)newCount++;
          const sources=[...new Set([...(old?.sources||[]),...(source==='Local import'?(raw.sources||[]).filter(x=>permittedSources.includes(x)):[]),source])];
          const merged={...row,...old,sources,capturedAt:old?.capturedAt||(source==='Local import'&&Number.isSafeInteger(raw.capturedAt)?Math.min(Date.now(),raw.capturedAt):Date.now())};
          // Prefer detailed live fields over a partial or legacy record.
          if(source==='Torn faction'||source==='Torn ranked attacks')Object.assign(merged,row);
          if(old?.spyEvidence||row.spyEvidence)merged.spyEvidence={...row.spyEvidence,...old?.spyEvidence};
          merged.quality=merged.ff!==undefined&&merged.startedAt&&merged.endedAt?'detailed':'partial';
          if(JSON.stringify(old)!==JSON.stringify(merged))store.put(merged);
          staged.set(row.id,merged);
        };
      }
    });
    for(const row of staged.values())if(row)indexFight(row);
  }
  function readArchiveStore(name){
    return new Promise((resolve,reject)=>{
      const req=combatArchive.db.transaction(name).objectStore(name).getAll();
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  const archiveReady=(async()=>{
    try{
      combatArchive.db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open('warstaxx-intelligence',1);
        req.onupgradeneeded=()=>{for(const store of ['fights','people','hours'])req.result.createObjectStore(store,{keyPath:'id'});};
        req.onblocked=()=>reject(Error('Archive open in another tab'));
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      });
      const [fights,people,hours]=await Promise.all(['fights','people','hours'].map(readArchiveStore));
      for(const row of fights)indexFight(row);
      for(const row of people)combatArchive.people.set(row.id,row);
      for(const row of hours)combatArchive.hours.set(row.id,row);
      combatArchive.ready=true;
    }catch(_){archiveFailure();}
  })();
  function reliableBse(player){
    const x=ffscouter(player.id),at=Date.now();
    return x&&!ffIsStale(x)&&x.updatedAt>0&&x.updatedAt<=at&&x.at<=at&&x.bsEstimate>0?
      {value:x.bsEstimate,source:'FFScouter BSE',at:x.updatedAt}:{value:null,source:'BSE needs intelligence'};
  }
  async function importPeople(rows){
    if(!Array.isArray(rows)||rows.length>40000)throw Error('Invalid membership backup');
    const staged=[];
    await transact('people',store=>{
      for(const row of rows){
        if(!idKey(row.id)||typeof row.name!=='string'||!Number.isSafeInteger(row.at)||!Array.isArray(row.memberships))continue;
        const incoming=row.memberships.filter(m=>idKey(m.faction)&&Number.isSafeInteger(m.first)&&Number.isSafeInteger(m.last)&&m.first<=m.last&&m.last<=Date.now()+MIN)
          .map(m=>({faction:m.faction,first:m.first,last:m.last}));
        const req=store.get(row.id);req.onsuccess=()=>{
          const old=req.result,history=new Map();
          for(const m of [...incoming,...(old?.memberships||[])]){
            const k=m.faction+'/'+m.first,prior=history.get(k);if(!prior||m.last>prior.last)history.set(k,m);
          }
          const newest=old&&old.at>=row.at?old:row,merged={id:row.id,name:newest.name.slice(0,80),at:newest.at,memberships:[...history.values()].sort((a,b)=>a.first-b.first)};
          store.put(merged);staged.push(merged);
        };
      }
    });staged.forEach(p=>combatArchive.people.set(p.id,p));
  }
  function attributedWar(row){
    if(row.ranked!==true||!row.attackerFaction||!row.defenderFaction)return null;
    const wars=new Set([state.data.war?.id,...state.data.ourWars.map(w=>w.id)].filter(Boolean)),matches=[];
    for(const id of wars){
      const w=warAttackWindow(id);if(w?.start&&w.end>=row.at&&row.at>=w.start&&
        ((row.attackerFaction===w.ourId&&row.defenderFaction===w.enemyId)||(row.attackerFaction===w.enemyId&&row.defenderFaction===w.ourId)))matches.push(id);
    }
    return matches.length===1?matches[0]:null;
  }
  async function historicalPage(feed){
    const personal=feed==='user',owner=positive(personal?state.data.meta.ownerId:cfg.ourId),meta=state.data.meta;
    if(!owner||!effectiveKey()||document.hidden||(!personal&&!cfg.enableAttacks))return;
    const cursors=meta.commandCursors||(meta.commandCursors={}),key=feed+'/'+owner;
    if(cursors[key]===0){meta.historyMessage='Reached the end of this authorised attack feed.';return;}
    const before=cursors[key]||Math.floor(Date.now()/1000);
    const body=await call('/'+feed+'/attacks?sort=DESC&limit=100&to='+before,'command-history-'+key,5*MIN);
    if(!Array.isArray(body?.attacks)||owner!==positive(personal?state.data.meta.ownerId:cfg.ourId))return;
    const rows=attacks(body,true).map(a=>({...a,warId:attributedWar(a)}));
    await keepFights(rows,personal?'Torn personal':'Torn faction');
    if(!combatArchive.ready||combatArchive.error)return;
    const times=body.attacks.map(a=>a.ended).filter(t=>Number.isSafeInteger(t)&&t>0);
    const oldest=times.length?Math.min(...times):0;
    if(body.attacks.length<100)cursors[key]=0;
    else if(oldest>0&&oldest<before)cursors[key]=oldest;
    meta.historyMessage=body.attacks.length===100&&(!oldest||oldest>=before)?'Inclusive timestamp page did not advance. Coverage remains partial.':
      rows.length+' '+feed+' attack records checked.';save();
  }
  // END bundled intelligence.js
  // BEGIN bundled activity.js
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
  // END bundled activity.js
  // BEGIN bundled planning.js
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
  function travelRanking({method,book,enemies,at,overseas,coverMinutes=90,gear=null}){
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
      const interval=Math.min(1,min/coverMinutes),excess=Math.max(0,min-coverMinutes);
      const yieldWeight=overseas==null?0:Math.min(3,Math.max(0,overseas));
      const score=(safe?100:0)+(offensive?60+yieldWeight*favourable.length:0)+15*interval-
        Math.min(12,excess/18)-15*danger.length-5*incoming.length-5*unknown-(i===0?cost/20000:0)-
        (offensive&&gear!==true?3:0);
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
    const cover=turtleWindow(at).minutes||90;
    return travelRanking({coverMinutes:cover,method:cfg.flightMethod,book:cfg.flightBook,enemies,at,overseas:localWarRules().overseas});
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
    if(localWarRules().chainOn!=='no'&&chain.fresh&&chain.count>=10&&chain.remaining>0&&chain.remaining<=80)return 'Chain focus';
    const room=commandRoom();
    if(Object.values(room?.ops.states||{}).some(s=>['LOCKED_UNAVAILABLE','REASSIGNMENT_READY'].includes(s.phase)))return 'Black Skull suppression';
    const exposed=protectionPriorities().filter(x=>x.exposed&&x.feedFresh&&x.impact.underFire);
    if(exposed.length)return 'Defensive turtling';
    const pace=warPace();if(pace?.measurable&&Date.now()-pace.last.at<5*MIN&&pace.netRate>0)return 'Aggressive scoring';
    return 'Balanced';
  }
  function templateAssessment(w,score,manual,at=Date.now()){
    const mode=['net','own','unknown'].includes(manual.mode)?manual.mode:'unknown';
    const official=w?.target>0?w.target:null,base=manual.opening>0?manual.opening:null;
    const step=base&&manual.decay!=null&&manual.after!=null&&w?.start>0?
      Math.max(0,Math.floor((at-w.start*1000)/HOUR)-manual.after+1):null;
    const modeled=step===null?null:Math.max(0,base*(1-step*manual.decay/100));
    const target=official??modeled,progress=mode==='net'?score?.net:mode==='own'?score?.our:null;
    return {mode,target,modeled,source:official!==null?'Official current target':modeled!==null?'Manual template model':'Unknown',
      remaining:target!==null&&Number.isFinite(progress)?Math.max(0,target-progress):null,chain:manual.chainOn!=='no'};
  }
  function defensivePriorities(){
    const room=commandRoom(),bands=enemyRoleBands();
    return protectionPriorities().filter(z=>z.feedFresh).map(z=>{
      const p=z.player,loc=currentLocation(p),fresh=rosterFresh('ours'),duty=room?.plan.duties[p.id]?.duty;
      const orders=Object.values(room?.plan.assignments||{}).filter(a=>a.primary===p.id).length;
      const opportunities=rosterFresh('enemies')?state.data.enemies.filter(e=>['present','abroad'].includes(currentLocation(e).phase)&&currentLocation(e).country===loc.country&&
        ['okay','away'].includes(memberState(e))&&roleAllows(p,e,bands)&&commandMatch(p,e).category==='Proven favourable matchup').length:null;
      const exposed=fresh&&['okay','away'].includes(memberState(p))&&['present','abroad'].includes(loc.phase);
      const repeat=z.impact.underFire,net=z.impact.net,contributes=net!==null&&net>0;
      const priority=exposed&&repeat&&!orders&&duty!=='strike'&&!contributes&&opportunities===0?'Protect now':
        exposed&&repeat?'Coordinate relief':exposed&&net!==null&&net<0?'Watch exposure':'Monitor';
      return {...z,priority,orders,opportunities,country:loc.country,exposed};
    }).sort((a,b)=>['Protect now','Coordinate relief','Watch exposure','Monitor'].indexOf(a.priority)-['Protect now','Coordinate relief','Watch exposure','Monitor'].indexOf(b.priority)||b.impact.in30-a.impact.in30);
  }
  // END bundled planning.js
  // BEGIN bundled coordination.js
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
      '<div class="ws-toolbar">'+b('Heavy hitter activity','cmd-heavyview')+b('Refresh orders','cmd-sync')+b('Settings','tab:settings')+'</div>');
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
  // END bundled coordination.js
  // BEGIN bundled views.js
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
      }else if(kind==='heavylatest'){
        const [id,hour]=value.split('/').map(Number);
        if(!idKey(id)||!Number.isSafeInteger(hour)||hour%HOUR!==0)return;
        heavyView.date=Math.floor(hour/(24*HOUR))*24*HOUR;
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
  // END bundled views.js
  // BEGIN bundled enemy-activity.js
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
  // END bundled enemy-activity.js
  // BEGIN bundled activity-grid.js
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
  // END bundled activity-grid.js
  // BEGIN bundled heavy-activity.js
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
  // END bundled heavy-activity.js
  const effectiveKey=()=>String(cfg.key||'').trim()||(apiKeyPda.includes('PDA-APIKEY')?'':apiKeyPda);
  const saveCfg=()=>{try{localStorage.setItem(CONFIG,JSON.stringify(cfg));return true;}catch(_){state.localKeyError=true;return false;}};
  const save=()=>{try{localStorage.setItem(DATA,JSON.stringify(state.data));return true;}catch(_){
    // Discard only oldest evidence on quota exhaustion; never purge config, spies or notes.
    for(const key of Object.keys(state.data.activity)) {const hours=state.data.activity[key]?.hours||{};const nums=Object.keys(hours).map(Number).sort((a,b)=>a-b);for(const h of nums.slice(0,Math.ceil(nums.length/2)))delete hours[h];}
    state.data.attacks=(state.data.attacks||[]).slice(-200);
    try{localStorage.setItem(DATA,JSON.stringify(state.data));return true;}catch(e){state.error='Local storage is full; observations cannot be saved.';return false;}
  }};
  if(heavyRuleMigrated)saveCfg();
  archiveReady.then(migrateLegacyActivity).catch(archiveFailure);
  archiveReady.then(()=>keepFights(state.data.attacks,'Legacy local')).catch(archiveFailure);
  const parseArray=(value)=>Array.isArray(value)?value.filter(v=>v&&typeof v==='object'):Object.entries(value&&typeof value==='object'?value:{}).filter(([key])=>/^\d+$/.test(key)).map(([key,v])=>({...(v&&typeof v==='object'&&!Array.isArray(v)?v:{}),id:positive(v?.id)||positive(v?.faction_id)||positive(key)}));
  const unpack=(j,k)=>j?.[k]??j;
  function roster(j,previous=[]){
    const list=parseArray(unpack(j,'members'));
    const prior=new Map((Array.isArray(previous)?previous:[]).map(p=>[positive(p?.id),p]));
    return list.map(p=>{
      const member={
      id:positive(p.id||p.user_id||p.player_id),name:String(p.name||('Player '+p.id)),level:n(p.level),
      position:String(p.position||''),daysInFaction:n(p.days_in_faction),
      revivable:p.is_revivable===true,onWall:p.is_on_wall===true,inOc:p.is_in_oc===true,
      earlyDischarge:p.has_early_discharge===true,
      status:String(p.status?.state||p.status||'Unknown'),reviveSetting:String(p.revive_setting||'Unknown'),
      statusText:String(p.status?.description||''),statusDetails:String(p.status?.details||''),
      locationHint:String(p.location?.name||p.location||p.status?.location||''),
      destinationHint:String(p.travel?.destination?.name||p.travel?.destination||p.status?.destination||''),
      until:n(p.status?.until)*1000,
      lastAction:String(p.last_action?.status||'Unknown'),lastAt:n(p.last_action?.timestamp)*1000,
      updated:Date.now()
      };
      // A hospital status can hide the country. Carry genuine travel/abroad
      // evidence (or a prior hospital location), not a default Torn guess.
      if(memberState(member)==='hospital'){
        const reported=nativeWarLocation(member);
        if(reported.country!=='Unknown'&&reported.source!=='Torn local hospital status')member.hospitalCountry=reported.country;
        else{
          const earlier=prior.get(member.id);
          if(earlier&&['away','hospital'].includes(memberState(earlier))){
            const previousLocation=nativeWarLocation(earlier);
            if(previousLocation.country!=='Unknown')
              member.hospitalCountry=previousLocation.country;
          }
        }
      }
      return member;
    }).filter(p=>p.id);
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
  function attacks(j,includePartial=false){
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
        attacker,defender,attackerFaction,defenderFaction,ranked:warFlag==null?null:ranked,
        endedAt:epochMs(a.timestamp_ended||a.ended),respectLoss:officialNumber(a.respect_loss),
        modifierWarlord:officialNumber(a.modifiers?.warlord),
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
    }).filter(a=>a.id&&a.at&&(includePartial?(a.attacker||a.defender):a.attacker&&a.defender));
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
        Promise.resolve(PDA_httpGet(url+'&key='+encodeURIComponent(key))).then(x=>{const raw=x?.responseText??x;resolve(typeof raw==='string'?JSON.parse(raw):raw);}).catch(reject);
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
  // Match a country immediately after a place preposition. A player named
  // "Canada" in "Hospitalized by Canada" is not evidence of geography.
  function nativeCountryInStatus(value){
    const parts=String(value||'').split(/\b(?:in|at|abroad(?:\s+in)?)\s+(?:the\s+)?/i);
    for(const part of parts.slice(1)){
      const text=part.trim();
      for(const [country,pattern] of nativeCountries){
        const match=text.match(pattern);
        if(match&&match.index===0)return country;
      }
    }
    return '';
  }
  // Torn describes foreign hospitals with demonyms, not country names:
  // e.g. "In a Canadian hospital" or "In an Emirati hospital".
  function nativeHospitalCountry(value){
    const text=String(value||'');
    const phrase=text.match(/\b(?:in|at)\s+(?:(?:a|an|the)\s+)?(Argentinian|Argentine|Canadian|Cayman(?:ian| Islands)?|Chinese|Emirati|Hawaiian|Japanese|Mexican|South African|Swiss|British|UK|United Kingdom|UAE|United Arab Emirates|Torn(?: City)?)\s+(?:hospital|clinic|medical\s+cent(?:er|re))\b/i);
    if(!phrase)return '';
    const descriptor=phrase[1];
    const aliases=[
      ['Argentina',/^(?:Argentinian|Argentine)$/i],
      ['Canada',/^Canadian$/i],
      ['Cayman Islands',/^Cayman(?:ian| Islands)?$/i],
      ['China',/^Chinese$/i],
      ['UAE',/^(?:Emirati|UAE|United Arab Emirates)$/i],
      ['Hawaii',/^Hawaiian$/i],
      ['Japan',/^Japanese$/i],
      ['Mexico',/^Mexican$/i],
      ['South Africa',/^South African$/i],
      ['Switzerland',/^Swiss$/i],
      ['United Kingdom',/^(?:British|UK|United Kingdom)$/i],
      ['Torn',/^Torn(?: City)?$/i]
    ];
    return aliases.find(([,rule])=>rule.test(descriptor))?.[0]||'';
  }
  function nativeWarLocation(p){
    if(!p)return {country:'Unknown',phase:'unknown',source:'Missing player'};
    const kind=memberState(p);
    const desc=[p.statusText,p.statusDetails].filter(Boolean).join(' ').trim();
    const explicit=nativeCountryName(p.destinationHint),current=nativeCountryName(p.locationHint);
    if(kind==='away'){
      const to=desc.match(/\bto\s+([^.,;|]+)/i);
      const dest=explicit||nativeCountryName(to?.[1]);
      if(/\b(?:returning from|flying back from|flight back|flying back|back to torn)\b/i.test(desc))
        return {country:'Torn',phase:'inbound',eta:positive(p.until),source:'Torn return flight'};
      if(dest)return {country:dest,phase:'inbound',eta:positive(p.until),source:'Torn flight destination'};
      if(/^abroad$/i.test(String(p.status||''))){
        const where=current||nativeCountryName(desc);
        if(where)return {country:where,phase:'abroad',source:'Torn abroad status'};
      }
      return {country:'Unknown',phase:'unknown-travel',eta:positive(p.until),source:'Destination not provided'};
    }
    if(kind==='hospital'){
      // The status description is stronger evidence than generic roster location.
      // Demonyms must be resolved before interpreting "In hospital" as Torn.
      const hospital=nativeHospitalCountry(desc);
      const described=hospital||nativeCountryInStatus(desc);
      const cached=nativeCountryName(p.hospitalCountry);
      const where=described||current||cached;
      if(where)return {country:where,phase:'present',
        source:hospital?'Torn hospital country':
          described?'Torn hospital status':current?'Torn location field':'Prior observed location/destination'};
      // A generic "In hospital" describes Torn City, unless stronger overseas
      // evidence was already preserved above. Do not guess from patient names.
      if(/\b(?:in|at)\s+(?:the\s+)?hospital\b/i.test(desc))
        return {country:'Torn',phase:'present',source:'Torn local hospital status'};
      return {country:'Unknown',phase:'unknown-hospital',source:'Hospital location not provided by Torn'};
    }
    if(['okay','jail','fallen'].includes(kind)){
      const where=current||nativeCountryInStatus(desc);
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
  // FFScouter OpenAPI 1.20.0. Additional intelligence stays local and read-only.
  const scouterExtra={context:'',busy:false,error:'',selected:0,flights:{},activity:{},history:{},targets:[],targetsAt:0,attempts:{}};
  function scouterContext(){
    const key=ffApiKey();
    if(scouterExtra.context!==key||!cfg.ffEnabled||!cfg.ffConsent){
      Object.assign(scouterExtra,{context:key,error:'',flights:{},activity:{},history:{},targets:[],targetsAt:0,attempts:{}});
    }
    return key;
  }
  function parseScouterFlights(body,ids,at=Date.now()){
    if(!Array.isArray(body?.flights))throw Error('Flight response is missing its list');
    const allowed=new Set(ids.map(Number)),out={};
    for(const row of body.flights){
      const id=positive(row?.player_id);if(!allowed.has(id))continue;
      const x=row.current;
      if(x===null){out[id]={at,current:null};continue;}
      if(!x||typeof x.status_description!=='string')continue;
      const early=ffTimestamp(x.earliest_arrival_time),late=ffTimestamp(x.latest_arrival_time);
      out[id]={at,current:{description:x.status_description.slice(0,100),method:String(x.travel_method||'Unknown').slice(0,40),
        earliest:early>0&&late>=early?early:null,latest:early>0&&late>=early?late:null,approx:ffTimestamp(x.approx_landing_time),takeoff:ffTimestamp(x.takeoff_time)}};
    }
    for(const id of allowed)if(!out[id])out[id]={at,unknown:true,current:null};
    return out;
  }
  function parseScouterActivity(body,id,at=Date.now()){
    if(body?.meta?.subject_type!=='player'||Number(body.meta.subject_id)!==id||!Array.isArray(body.buckets))throw Error('Activity response does not match this player');
    const start=Number(body.meta.start),end=Number(body.meta.end),seen=new Set();
    const rows=body.buckets.filter(x=>Number.isFinite(x?.ts)&&x.ts>=start&&x.ts<end&&Number.isFinite(x.activity_score)&&x.activity_score>=0)
      .filter(x=>{if(seen.has(x.ts))return false;seen.add(x.ts);return true;}).slice(0,744).sort((a,b)=>a.ts-b.ts)
      .map(x=>({ts:x.ts*1000,score:x.activity_score}));
    return {at,rows,truncated:body.meta.truncated===true};
  }
  async function scouterRead(kind,id=0,range=null){
    const key=scouterContext();id=positive(id);
    if(scouterExtra.busy||document.hidden)return;
    if(!cfg.ffEnabled||!cfg.ffConsent||!key){scouterExtra.error='Enable FFScouter and save your registered key in WarStaxx Settings.';render();return;}
    const token=kind+':'+id,ttl=kind==='flights'?MIN:kind==='targets'?5*MIN:kind==='stats'?HOUR:15*MIN;
    if(Date.now()-n(scouterExtra.attempts[token])<ttl){scouterExtra.error='Recent check cached. Try again after '+Math.ceil((ttl-(Date.now()-scouterExtra.attempts[token]))/MIN)+' minute(s).';render();return;}
    if(!['flights','targets','stats','activity','history'].includes(kind)||(!id&&!['flights','targets'].includes(kind)))return;
    scouterExtra.busy=true;scouterExtra.error='';scouterExtra.attempts[token]=Date.now();render();
    const current=()=>cfg.ffConsent&&cfg.ffEnabled&&ffApiKey()===key&&!document.hidden&&(!range||range.valid());
    try{
      await checkFFRegistration();if(!current())return;
      if(!scouterPremiumActive())throw Error('Premium is not active for this key. Verify the key linked to your subscription in Settings.');
      const query=new URLSearchParams({key});let path,ids=[];
      if(kind==='flights'){
        ids=id?[id]:[...new Set([...state.data.enemies,...state.data.ours].sort((a,b)=>Number(/travel/i.test(b.status))-Number(/travel/i.test(a.status))).map(p=>positive(p.id)).filter(Boolean))].slice(0,100);
        if(!ids.length)throw Error('Load a war roster or choose a player first.');
        path='player-flights/batch';query.set('targets',ids.join(','));
      }else if(kind==='targets'){
        path='get-targets';query.set('preset','respect');query.set('limit','20');
      }else if(kind==='stats'){
        path='get-stats';query.set('targets',String(id));
      }else if(kind==='history'){
        path='get-stats-history';query.set('target',String(id));query.set('limit','28');query.set('sort','asc');
        query.set('from',String(Math.floor(Date.now()/1000)-7*86400));
      }else{
        path='activity/player';query.set('target',String(id));query.set('bucket','3600');
        const end=range?.end??Math.floor(Date.now()/HOUR)*3600;query.set('end',String(end));query.set('start',String(range?.from??(end-(['activity','heatmap'].includes(state.tab)?activityPrefs.days:1)*86400)));
      }
      const body=await ffRequest('https://ffscouter.com/api/v1/'+path+'?'+query);if(!current())return;
      const at=Date.now();
      if(kind==='flights')Object.assign(scouterExtra.flights,parseScouterFlights(body,ids,at));
      else if(kind==='activity'){if(!range)scouterExtra.activity[id]=parseScouterActivity(body,id,at);
        const faction=state.data.ours.some(p=>p.id===id)?cfg.ourId:state.data.enemies.some(p=>p.id===id)?cfg.enemyId:0;
        if(range||faction)return await captureScanner(body,range?.faction??faction,id,range);}
      else if(kind==='history'){
        if(Number(body?.player_id)!==id||!Array.isArray(body.history))throw Error('History response does not match this player');
        scouterExtra.history[id]={at,rows:body.history.filter(x=>Number.isFinite(x.bs_estimate)&&x.bs_estimate>0&&ffTimestamp(x.timestamp)>0).slice(0,28)
          .map(x=>({total:x.bs_estimate,at:ffTimestamp(x.timestamp),source:String(x.source||'Unknown').slice(0,30)})).sort((a,b)=>a.at-b.at)};
      }else if(kind==='stats')Object.assign(state.data.ffstats,parseFFRows(body,[id],at));
      else{
        if(!Array.isArray(body?.targets))throw Error('Target response is missing its list');
        // The API echoes the key in parameters. Never retain that object.
        scouterExtra.targets=body.targets.filter(x=>positive(x.player_id)).slice(0,20).map(x=>({id:positive(x.player_id),name:String(x.name||'Player').slice(0,60),
          level:positive(x.level),ff:validScouterFF(x.fair_fight),total:Number.isFinite(Number(x.bs_estimate))&&Number(x.bs_estimate)>0?Number(x.bs_estimate):null,
          last:ffTimestamp(x.last_action),source:String(x.source||'Unknown').slice(0,30),hospital:ffTimestamp(x.hospital_until)}));
        scouterExtra.targetsAt=at;
      }
    }catch(e){if(!current())return;
      if(range&&e.retryAfter)range.rateLimit(e.retryAfter);
      scouterExtra.error=String(e.message||e).split(key).join('[redacted]').slice(0,180);
      if(/premium.*required|subscription.*required/i.test(scouterExtra.error)&&state.data.meta.ffRegistration)state.data.meta.ffRegistration.premium=false;}
    finally{scouterExtra.busy=false;render();syncPageBse(false);}
  }
  function scouterFlightText(id){
    const f=scouterExtra.flights[id];if(!f)return '';
    const old=Date.now()-f.at>5*MIN?'STALE / ':'';
    if(f.unknown)return old+'FFScouter flight not reported; location unknown.';
    if(!f.current)return old+'FFScouter reports no current trip; this does not establish location.';
    const x=f.current;
    return old+'FFScouter: '+x.description+' / '+x.method+(flightLandingEstimate(x)?' / landing ~'+flightClock(flightLandingEstimate(x))+' TCT':'')+(x.earliest?' / estimated arrival window '+flightClock(x.earliest)+' to '+flightClock(x.latest)+' TCT':' / arrival window unknown')+' / checked '+age(f.at);
  }
  function scouterDistributionText(id){
    if(!scouterPremiumActive())return '';
    const x=ffscouter(id),d=x?.distribution;if(!d)return '';
    const labels={strength:'STR',speed:'SPD',defense:'DEF',dexterity:'DEX'};
    return (ffIsStale(x)?'STALE / ':'')+'Estimated '+Object.entries(d.percentages).map(([k,v])=>labels[k]+' '+v+'%').join(' / ')+
      ' / '+(d.at?age(d.at):'date unknown')+'. Missing stats unknown; not exact battle stats.';
  }
  function scouterArrivalAlerts(at=Date.now()){
    if(cfg.scouterFlightAlerts===false||!scouterPremiumActive())return [];
    const rows=Object.entries(scouterExtra.flights).filter(([id,f])=>{
      const x=f.current;if(!x||!x.earliest||!x.latest||at-f.at>3*MIN||f.at>at||x.latest<at||x.earliest>at+15*MIN)return false;
      const p=[...state.data.enemies,...state.data.ours].find(p=>p.id===Number(id));
      return !(p&&p.updated>f.at&&!/travel/i.test(p.status||''));
    });
    return rows.length?[{id:'scouter-arrivals',title:rows.length+' estimated flight arrival(s) approaching',
      detail:'FFScouter arrival windows overlap the next 15 minutes. Observations are under three minutes old. Review flight details; landing and attack availability are not confirmed.',
      status:'now',priority:82,tab:'scouter'}]:[];
  }
  function pollScouterFlights(){
    if(document.hidden||!cfg.ffConsent||!cfg.ffEnabled||!ffApiKey()||scouterExtra.busy||(!activeWarNow()&&!preparingWar())||!rosterFresh('enemies'))return;
    const registration=state.data.meta.ffRegistration;
    if(registration&&!registration.premium&&Date.now()-n(registration.at)<HOUR)return;
    if(Date.now()-n(scouterExtra.attempts['flights:0'])<2*MIN)return;
    scouterRead('flights');
  }
  function premiumTravelTimer(player,place,at){
    if(!scouterPremiumActive()||!['inbound','unknown-travel'].includes(place.phase))return '';
    const observation=scouterExtra.flights[player.id],trip=observation?.current;
    if(!trip||observation.at>at||at-observation.at>3*MIN)return '';
    const dest=nativeWarLocation({status:'Traveling',statusText:trip.description}).country;
    if(place.country!=='Unknown'&&dest!=='Unknown'&&place.country!==dest)return '';
    const estimate=flightLandingEstimate(trip);
    if(!estimate||(trip.latest||estimate)<at)return '';
    return estimate<=at?'Landing window':'~'+flightCountdown(estimate,at);
  }
  function flightLandingEstimate(trip){
    return trip.approx||((trip.earliest&&trip.latest)?(trip.earliest+trip.latest)/2:0);
  }
  function flightClock(ms){
    return new Date(Math.round(ms/MIN)*MIN).toISOString().slice(11,16);
  }
  function flightRouteLine(trip){
    const route=trip.description.replace(/^travel(?:l)?ing from /i,'').replace(/ to /i,' \u2192 ');
    return route+' / ~'+flightClock(flightLandingEstimate(trip))+' TCT';
  }
  function scouterStrengthHTML(id){
    const x=ffscouter(id);if(!x)return '<p>No cached strength estimate. Check stats to load this player.</p>';
    const parts={strength:'STR',speed:'SPD',defense:'DEF',dexterity:'DEX'};
    return '<p>Selected by FFScouter: <b>'+esc(x.source)+'</b> / '+(x.bsEstimate?'~'+fmt(x.bsEstimate):'Unknown')+' total / '+(x.ff!==null?x.ff.toFixed(2)+' FFS':'FFS unknown')+' / '+esc(age(x.updatedAt||x.at))+(ffIsStale(x)?' / STALE':'')+'</p>'+
      (x.distribution?'<p>Estimated distribution: '+Object.entries(x.distribution.percentages).map(([k,v])=>parts[k]+' '+v+'%').join(' / ')+' / '+esc(age(x.distribution.at))+'. Omitted stats are unknown.</p>':'<p>Stat distribution not supplied.</p>')+
      '<details data-ws-disclosure="scouter-sources-'+id+'"><summary>Compare sources and spy snapshots</summary>'+
      Object.entries(x.estimates||{}).map(([source,v])=>'<p>'+esc(source)+': ~'+fmt(v.total)+' total / '+(v.ff===null?'FFS unknown':v.ff.toFixed(2)+' FFS')+' / '+esc(age(v.at))+'</p>').join('')+
      (x.spies||[]).map(v=>'<p>Spy snapshot / '+esc(v.source)+' / '+esc(stamp(v.at))+': '+fmt(v.total)+' total. '+Object.keys(parts).map(k=>parts[k]+' '+(v[k]===null?'?':fmt(v[k]))).join(' / ')+'</p>').join('')+
      '<p>Spy snapshots can age. Estimates and distribution are models, not exact current stats or win guarantees. FFS belongs to the key owner.</p></details>';
  }
  function scouterScreen(){
    scouterContext();const id=positive(scouterExtra.selected),active=scouterPremiumActive(),reg=state.data.meta.ffRegistration;
    const policy='<p class="ws-small">Source: FFScouter. Uses your own registered key only. <a href="https://ffscouter.com/#data-policy" target="_blank" rel="noopener noreferrer">Data policy</a> / <a href="https://ffscouter.com/volunteer" target="_blank" rel="noopener noreferrer">Scanner data policy</a>. Checks are requested here; no attacks or claims are submitted.</p>';
    let html=card('FFScouter Premium',policy+'<p>Flight alerts '+(cfg.scouterFlightAlerts===false?'off':'on')+': automatic foreground checks during ranked wars; checked player flights can also generate alerts. Manage in Settings.</p>'+ '<p>'+(!cfg.ffEnabled||!cfg.ffConsent?'Enable FFScouter in Settings.':active?'Premium verified':reg?.premium?'Premium verification needs refreshing':'Premium not verified for the configured key')+'</p>'+
      '<div class="ws-toolbar">'+b('Settings','tab:settings')+b('Verify key','check-ff-key')+b('Check roster flights (up to 100)','scouter:flights:0')+b('Find respect targets','scouter:targets:0')+'</div>'+
      '<label>Player Torn ID <input id="ws-scouter-id" inputmode="numeric" type="number" min="1" value="'+(id||'')+'"></label>'+b('Open player','scouter-open')+
      (scouterExtra.busy?'<p role="status">Checking FFScouter...</p>':'')+(scouterExtra.error?'<p class="ws-note ws-warn">'+esc(scouterExtra.error)+'</p>':''));
    if(!active)return html;
    if(id){
      html+=card('Player #'+id,a('Torn profile',link(id))+'<div class="ws-toolbar">'+b('Check stats','scouter:stats:'+id)+b('Check flight','scouter:flights:'+id)+b('Activity / 24h','scouter:activity:'+id)+b('Estimate history / 7d','scouter:history:'+id)+'</div>'+scouterStrengthHTML(id)+'<p>'+esc(scouterFlightText(id))+'</p>');
      const activity=scouterExtra.activity[id],history=scouterExtra.history[id];
      if(activity){const rows=activity.rows,signals=rows.filter(x=>x.score>0);html+=card('Scanner activity / completed hours',
        '<p>'+signals.length+' of '+rows.length+' returned hourly buckets contain an activity signal. This is not time online; no signal does not prove inactivity. '+(activity.truncated?'Response truncated. ':'')+'Checked '+esc(age(activity.at))+'.</p>'+
        '<div style="display:flex;gap:2px;align-items:end;height:70px" aria-label="Hourly scanner activity">'+rows.map(x=>'<span title="'+esc(stamp(x.ts)+' / score '+x.score)+'" style="flex:1;min-width:2px;background:#49bbef;height:'+Math.max(4,60*x.score/Math.max(1,...rows.map(r=>r.score)))+'px"></span>').join('')+'</div>'+
        '<details data-ws-disclosure="scouter-hours"><summary>Hourly observations (Torn time / UTC)</summary>'+rows.map(x=>'<p>'+esc(stamp(x.ts))+' / score '+x.score+'</p>').join('')+'</details>');}
      if(history)html+=card('Estimate history / not gym gains','<p>'+history.rows.length+' six-hour buckets returned / checked '+esc(age(history.at))+'. Source changes can move the estimate.</p>'+history.rows.map(x=>'<p>'+esc(stamp(x.at))+' / ~'+fmt(x.total)+' / '+esc(x.source)+'</p>').join(''));
    }
    const flights=Object.keys(scouterExtra.flights);
    if(flights.length)html+=card('Flight checks / separate from Torn status',flights.map(key=>'<p><b>'+esc([...state.data.enemies,...state.data.ours].find(p=>p.id===Number(key))?.name||'#'+key)+'</b> '+esc(scouterFlightText(key))+'</p>').join(''));
    if(scouterExtra.targetsAt)html+=card('Respect candidates / not bounty payouts','<p>FFScouter respect preset. Last check '+esc(age(scouterExtra.targetsAt))+'. Recheck current status, faction and matchup in Torn. No payout or victory is implied.</p>'+
      (scouterExtra.targets.length?scouterExtra.targets.map(x=>'<div class="ws-note"><strong>'+esc(x.name)+' ['+x.id+']</strong><p>Level '+x.level+' / '+(x.ff===null?'FFS unknown':x.ff.toFixed(2)+' FFS')+' / '+(x.total?'~'+fmt(x.total):'BSE unknown')+' / '+esc(x.source)+' / last action '+esc(age(x.last))+(x.hospital>Date.now()?' / reported hospital until '+esc(stamp(x.hospital)):' / availability unverified')+'</p>'+b('Player intelligence','scouter-player:'+x.id)+' '+a('Profile',link(x.id))+'</div>').join(''):empty('No candidates returned.')));
    return html;
  }
  function openScouterPlayer(id){
    scouterExtra.selected=positive(id);state.open=true;navigate('scouter');
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
  function scouterPremiumActive(){
    const reg=state.data.meta?.ffRegistration;
    return cfg.ffEnabled&&cfg.ffConsent&&reg?.premium===true&&Date.now()-n(reg.at)<HOUR&&
      (!reg.expires||reg.expires>Date.now());
  }
  function parseScouterExtras(p){
    const value=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
    const parts=['strength','speed','defense','dexterity'];
    const percentages={};
    for(const k of parts){const v=value(p?.distribution?.stats_percentage?.[k]);if(v!==null&&v<=100)percentages[k]=v;}
    const distribution=Object.keys(percentages).length&&Object.values(percentages).reduce((a,b)=>a+b,0)<=100.01?
      {percentages,at:ffTimestamp(p.distribution.last_updated)}:null;
    const estimates={};
    for(const k of ['bss','premium','spies']){
      const x=p?.available_estimates?.[k],total=value(x?.bs_estimate);
      if(total!==null&&total>0)estimates[k]={total,ff:validScouterFF(x.fair_fight),at:ffTimestamp(x.last_updated)};
    }
    const spies=(Array.isArray(p?.spies)?p.spies:[]).slice(0,5).map(x=>({total:value(x.total),at:ffTimestamp(x.last_updated),source:String(x.source||'Unknown').slice(0,40),
      ...Object.fromEntries(parts.map(k=>[k,value(x[k])]))})).filter(x=>x.total>0&&x.at>0);
    return {distribution,estimates,spies};
  }
  function parseFFRows(rows,ids,at=Date.now()){
    if(!Array.isArray(rows))throw new Error('FFScouter response is not a list');
    const allowed=new Set(ids.map(positive)),out={};
    for(const p of rows){
      const id=positive(p?.player_id);
      if(!allowed.has(id))continue;
      const chosen=['bss','premium','spies'].includes(p?.source)?p?.available_estimates?.[p.source]:null;
      const ff=validScouterFF(p?.fair_fight??chosen?.fair_fight);
      const bss=Number(p?.bss_public??chosen?.bss_public),estimate=Number(p?.bs_estimate??chosen?.bs_estimate);
      out[id]={ff,bss:Number.isFinite(bss)&&bss>0?bss:null,
        bsEstimate:Number.isFinite(estimate)&&estimate>0?estimate:null,
        bsHuman:String(p?.bs_estimate_human||chosen?.bs_estimate_human||'').slice(0,70),
        source:String(p?.source||'public estimate').slice(0,35),
        updatedAt:ffTimestamp(p?.last_updated??chosen?.last_updated),
        premium:Boolean(p?.premium_insights_available),...parseScouterExtras(p),
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
    if(!x||!x.at||Date.now()-n(x.at)>=7*24*HOUR)return null;
    if(!scouterPremiumActive()){
      const base=x.estimates?.bss;
      if(x.source==='premium'||x.source==='spies')return base?
        {...x,ff:base.ff,bsEstimate:base.total,updatedAt:base.at,source:'bss',premium:false,distribution:null,spies:[],estimates:{bss:base}}:null;
      return {...x,distribution:null,spies:[],estimates:base?{bss:base}:{}};
    }
    return x;
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
    const pool=new Map((state.data.attacks||[]).filter(a=>a.attacker===friendId&&a.defender===enemyId).map((a,i)=>[a.id??-i,a]));
    for(const row of pairRows(friendId,enemyId))pool.set(row.id,row);
    const recent=[...pool.values()].filter(x=>positive(x.attacker)===positive(friendId)&&
      positive(x.defender)===positive(enemyId)&&n(x.at)>at-30*24*HOUR&&n(x.at)<=at);
    let wins=0,losses=0,stalemates=0,unknown=0;
    for(const a of recent){
      const result=String(a.result||'').toLowerCase();
      if(/^(attacked|looted|hospitali[sz]ed|mugged|left|victory|won)$/.test(result))wins++;
      else if(result==='stalemate')stalemates++;
      else if(/^(lost|defeated)$/.test(result))losses++;
      else unknown++;
    }
    return {wins,losses,stalemates,unknown,total:recent.length,last:recent.length?Math.max(...recent.map(x=>x.at)):0};
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
    const evidence=pairEvidence(pairRows(friend.id,enemy.id),friend.id,Date.now(),m.known?m.ratio:null);
    const knownLoss=encounters.losses>0&&evidence.recent[0]!=='wins';
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
    }else if(encounters.stalemates&&(!encounters.wins||evidence.recent[0]==='stalemates')){category='Previous stalemate';reason='This hitter previously attacked and stalemated';tier=3;
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
  // Black Skull targets are based on the strongest known REGULAR member.
  // Positive enemy ranked-war scoring attacks against that member prove a
  // previous successful hit, including opponents with a lower BSS estimate.
  // Unknown teammate stats are explicitly reported, not assumed to be zero.
  function friendlyBattleEstimate(friend){
    if(!friend)return {value:null,source:'Unknown',verified:false};
    const record=spy(friend.id),known=bsScore(record);
    if(known!==null&&n(record?.observedAt)>0&&Date.now()-n(record.observedAt)<=30*24*HOUR)
      return {value:known,verified:true,source:String(record.source||'Torn spy')};
    const ff=ffscouter(friend.id);
    if(ff&&!ffIsStale(ff)&&Number.isFinite(Number(ff.bss))&&Number(ff.bss)>0)
      return {value:Number(ff.bss),verified:false,source:'FFScouter BSS estimate'};
    return {value:null,verified:false,source:'Teammate stats unknown'};
  }
  function manualHeavyTargets(){
    const shared=commandRoom();if(shared?.plan.policySet)return Object.fromEntries(shared.plan.manual.map(id=>[id,true]));
    const per=cfg.manualHeavyTargetsByEnemy?.[String(positive(cfg.enemyId))];
    return per&&typeof per==='object'&&!Array.isArray(per)?per:{};
  }
  function toggleManualHeavyTarget(id){
    const wanted=positive(id),enemy=state.data.enemies.find(p=>p.id===wanted),
      factionId=positive(cfg.enemyId);
    if(!enemy||!factionId)return null;
    const key=String(factionId),extras={...manualHeavyTargets()};
    if(extras[wanted]===true)delete extras[wanted];
    else extras[wanted]=true;
    cfg.manualHeavyTargetsByEnemy[key]=extras;
    saveCfg();markSharedDirty();
    return {enemy,added:extras[wanted]===true};
  }
  function heavyRule(input=cfg.heavyPolicy){
    const mode=['relative','percent','min-bss'].includes(input?.mode)?input.mode:'relative',
      percentage=Number(input?.percent),threshold=Number(input?.minBss);
    return {version:2,mode,percent:Number.isFinite(percentage)?
        Math.max(5,Math.min(100,Math.round(percentage))):40,
      minBss:Number.isFinite(threshold)&&threshold>=0?
        Math.min(1e15,threshold):0};
  }
  function enemyRoleBands(){
    const rule=heavyRule(),useBse=(commandRoom()?.plan.policySet?commandRoom().plan.policy:cfg.commandMetric)==='bse',ranked=state.data.enemies.map(enemy=>({
      enemy,...(useBse?reliableBse(enemy):enemyBattleEstimate(enemy))
    })).filter(x=>x.value!==null).sort((a,b)=>b.value-a.value||
      n(b.enemy.level)-n(a.enemy.level)||a.enemy.id-b.enemy.id),
      regulars=state.data.ours.filter(p=>!cfg.blackSkulls[positive(p.id)]),
      knownRegular=regulars.map(p=>({p,...(useBse?reliableBse(p):friendlyBattleEstimate(p))}))
        .filter(x=>x.value!==null).sort((a,b)=>b.value-a.value),
      strongest=knownRegular[0]||null,missingRegular=regulars.length-knownRegular.length,
      manual=manualHeavyTargets(),reasons=new Map(),automatic=new Set(),
      heavy=new Set(),regular=new Set(),
      legacyHeavy=rule.mode==='percent'?
        new Set(ranked.slice(0,ranked.length?
          Math.max(1,Math.ceil(ranked.length*rule.percent/100)):0).map(x=>x.enemy.id)):
        new Set(ranked.filter(x=>x.value>=rule.minBss).map(x=>x.enemy.id)),
      captured=concessionSnapshot();
    for(const x of ranked){
      const id=positive(x.enemy.id),notes=[];
      if((useBse||rule.mode==='relative')&&strongest){
        if(x.value>strongest.value){
          automatic.add(id);
          notes.push('Above strongest known regular '+strongest.p.name+
            ' ('+fmt(strongest.value)+ (useBse?' BSE)':' BSS)')+(missingRegular?' \u00b7 '+missingRegular+
              ' regular member(s) unknown':''));
        }else{
          const capturedWins=n(captured?.winsByDefender?.[strongest.p.id]?.[id]?.wins),
            history=attackHistoryFor(id,strongest.p.id);
          if(capturedWins>0||history.wins>0){
            automatic.add(id);
            notes.push('Observed win against strongest known regular '+
              strongest.p.name+' ('+Math.max(capturedWins,history.wins)+' recorded)');
          }
        }
      }else if(!useBse&&rule.mode!=='relative'&&legacyHeavy.has(id)){
        automatic.add(id);notes.push(rule.mode==='percent'?
          'Legacy top '+rule.percent+'% BSS selection':
          'Legacy minimum '+fmt(rule.minBss)+' BSS selection');
      }
      if(manual[id]===true)notes.push('Manually added by Skull Capo');
      if(automatic.has(id)||manual[id]===true)heavy.add(id);
      else if(!useBse||strongest&&!missingRegular)regular.add(id);
      if(notes.length)reasons.set(id,notes);
    }
    // Also classify an unknown-BSS opponent after a CONFIRMED scoring win
    // against the top regular. Evidence takes precedence over missing models.
    for(const enemy of state.data.enemies){
      const id=positive(enemy.id);
      if(!ranked.some(x=>x.enemy.id===id)&&(useBse||rule.mode==='relative')&&strongest){
        const wins=n(captured?.winsByDefender?.[strongest.p.id]?.[id]?.wins),
          prior=attackHistoryFor(id,strongest.p.id).wins;
        if(wins>0||prior>0){
          automatic.add(id);heavy.add(id);
          reasons.set(id,['Observed winning hit against '+strongest.p.name+
            ' despite unknown opponent BSS ('+Math.max(wins,prior)+' recorded)']);
        }
      }
      if(manual[id]===true){
        heavy.add(id);regular.delete(id);
        const existing=reasons.get(id)||[];
        existing.push('Manual Black Skull extra');
        reasons.set(id,existing);
      }
    }
    const unknown=state.data.enemies.filter(e=>!ranked.some(x=>x.enemy.id===e.id)&&
      !heavy.has(e.id)).length;
    return {heavy,regular,automatic,
      manual:new Set(state.data.enemies.filter(p=>manual[p.id]===true).map(p=>p.id)),
      reasons,heavyCount:heavy.size,regularCount:regular.size,
      metric:useBse?'BSE':'BSS',known:ranked.length,unknown:useBse?state.data.enemies.length-heavy.size-regular.size:unknown,missingRegular,strongestRegular:strongest,
      regularCountOurs:regulars.length,knownRegular:knownRegular.length,
      threshold:strongest?.value??null,ranked,rule};
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
        confidence:history===null?(bands.metric||'BSS')+'-only priority':(bands.metric||'BSS')+' + official historical war score'}];
    }));
  }
  function blackSkullsCoverage(at=Date.now()){
    const bands=enemyRoleBands(),skulls=state.data.ours.filter(p=>cfg.blackSkulls[p.id]),
      teamReady=rosterFresh('ours',at),enemiesReady=rosterFresh('enemies',at),
      rankedPriorities=heavyTargetPriorities(bands);
    const targets=state.data.enemies.filter(p=>bands.heavy.has(p.id)).map(enemy=>{
      const estimate=enemyBattleEstimate(enemy),x={enemy,value:estimate.value,source:estimate.source};
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
      n(b.priority?.score)-n(a.priority?.score)||(b.bss??-1)-(a.bss??-1)||a.enemy.id-b.enemy.id);
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
      '<p>Heavy policy: '+(cutoff.mode==='relative'?
        (data.bands.strongestRegular?'Above strongest known regular ('+
        fmt(data.bands.strongestRegular.value)+' '+data.bands.metric+', '+
        esc(data.bands.strongestRegular.p.name)+') plus recorded wins and manual extras':
        'No known regular threshold yet; manual extras still work'):
        cutoff.mode==='min-bss'?
        'minimum BSS '+fmt(cutoff.minBss):
        'top '+fmt(cutoff.percent)+'% of '+fmt(data.bands.known)+' known BSS opponents')+
        '. '+fmt(data.bands.unknown)+' enemies need intelligence; '+
        fmt(data.bands.missingRegular)+' / '+fmt(data.bands.regularCountOurs)+
        ' regular members missing strength evidence (boundary provisional).</p>'+
      (data.targets.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Black Skull target / reason</th><th>BSS</th><th>Last war points</th><th>Priority</th>'+
        '<th>Current status</th>'+
        '<th>Assigned Black Skull</th><th>Coverage / next move</th></tr></thead><tbody>'+
        data.targets.slice(0,maxItems).map(x=>'<tr><td>'+infoButton(x.enemy.name,x.enemy.id)+
          ' '+ffBadge(x.enemy.id)+'<br><small>Lv '+fmt(x.enemy.level)+
          ' \u00b7 '+esc(data.bands.reasons.get(x.enemy.id)?.join('; ')||'No classification reason')+
          '</small></td>'+
          '<td>'+fmt(x.bss)+'<br><small>'+esc(x.source)+'</small></td>'+
          '<td>'+(x.priority?.historyPoints==null?'Unknown':
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
        '</tbody></table></div>':empty('No automatic targets yet. Load regular-member and enemy BSS, or pin manual extras.'))+
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
    const out=[...scouterArrivalAlerts(),...coordinationAlerts()];
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
      if(status>=400){
        const error=new Error('FFScouter HTTP '+status+(json?.error?' - '+String(json.error).slice(0,90):''));
        if(status===429)error.retryAfter=Math.max(60,Number(json?.retry_after_seconds)||0);
        throw error;
      }
      if((json?.code!==undefined&&Number(json.code)!==0)||json?.error)throw new Error('FFScouter '+String(json.error||json.code).slice(0,100));
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
    if(!force&&old.at&&Date.now()-n(old.at)<HOUR&&(!old.expires||old.expires>Date.now())){
      if(old.registered===false)throw new Error('FFScouter key is not registered. Use Check registered key after signing up.');
      return old;
    }
    const key=ffApiKey();
    const data=await ffRequest('https://ffscouter.com/api/v1/check-key?key='+encodeURIComponent(key));
    if(ffApiKey()!==key||!cfg.ffEnabled||!cfg.ffConsent)throw Error('FFScouter settings changed; retry with the current key.');
    const registered=data?.is_registered===true||data?.registered===true;
    const result={registered,premium:Boolean(data?.is_premium),expires:Math.max(ffTimestamp(data?.premium_expires_at),ffTimestamp(data?.faction_premium_expires_at)),at:Date.now()};
    state.data.meta.ffRegistration=result;
    if(!result.premium){scouterExtra.flights={};scouterExtra.activity={};scouterExtra.history={};scouterExtra.targets=[];scouterExtra.targetsAt=0;}
    if(!registered)throw new Error('Your Torn key is not registered with FFScouter. Register it on ffscouter.com or use another registered key.');
    return result;
  }
  async function refreshFF(force=false){
    if(pageBseBusy||rosterFFBusy)return;
    if(!cfg.ffEnabled||!cfg.ffConsent||!ffApiKey()||!state.data.enemies.length)return;
    if(!canCall('ffscouter',force?MIN:HOUR))return;
    const ids=[...new Set([...state.data.enemies,...state.data.ours].map(p=>p.id).concat(positive(state.data.meta?.ownerId)).filter(Boolean))].slice(0,205);
    if(!ids.length)return;
    const key=ffApiKey();
    const url='https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(key)+
      '&targets='+ids.join(',');
    rosterFFBusy=true;
    try{
      await checkFFRegistration();
      const results=await ffRequest(url);
      if(key!==ffApiKey()||!cfg.ffEnabled||!cfg.ffConsent)return;
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
    rosterFFBusy=false;save();
  }
  async function refreshAttacks(){
    if(!cfg.enableAttacks||!activeWarNow()||!positive(cfg.ourId))return;
    try{
      const j=await call('/faction/attacks?limit=100','attacks',3*MIN);
      if(!j)return;
      const seen=new Map((state.data.attacks||[]).map(a=>[a.id,a]));
      const parsed=attacks(j);await keepFights(attacks(j,true),'Torn faction').catch(archiveFailure);
      for(const a of parsed)seen.set(a.id,a);
      state.data.attacks=[...seen.values()].sort((a,b)=>a.at-b.at).slice(-1000);
    }catch(e){state.data.errors.attacks=String(e.message||e);}
  }
  async function refresh(force=false){
    if(state.loading||document.hidden)return;
    if(!effectiveKey()){publish();render();return;}
    const deskBefore=captureDeskSnapshot();
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
      const ownStart=Date.now(),own=await call('/faction/'+cfg.ourId+'/members?timestamp='+Math.floor(ownStart/1000),'ours',force?0:90*1000);
      if(own){state.data.ours=roster(own,state.data.ours).map(p=>({...p,updated:ownStart}));captureRoster('ours',state.data.ours,state.data.updated.ours,wars?(activeWarNow()?state.data.war.id:0):null).catch(archiveFailure);}
      if(state.data.war?.id&&state.data.ours.length)snapshotWarSquads(state.data.war.id);
      if(positive(cfg.enemyId)){
        const old=state.data.enemies.slice(),oldAt=n(state.data.updated.enemies);
        const enemyStart=Date.now(),enemy=await call('/faction/'+cfg.enemyId+'/members?timestamp='+Math.floor(enemyStart/1000),'enemies',force?0:90*1000);
        if(enemy){
          const fresh=roster(enemy,old).map(p=>({...p,updated:enemyStart}));
          if(oldAt&&Date.now()-oldAt<5*MIN&&activeWarNow())observeNativeWarTransitions(old,fresh,positive(state.data.war?.id));
          state.data.enemies=fresh;captureRoster('enemies',fresh,state.data.updated.enemies,wars&&state.data.war?.opponentId===cfg.enemyId?(activeWarNow()?state.data.war.id:0):warAt(cfg.enemyId,enemyStart)).catch(archiveFailure);
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
      if(state.open&&state.data.war){
        await checkPersonalFights();
        if(Date.now()-n(state.data.meta.lastCommandBackfill)>15*MIN){
          state.data.meta.lastCommandBackfill=Date.now();
          const feed=cfg.enableAttacks&&state.data.meta.commandLastFeed!=='faction'?'faction':'user';
          state.data.meta.commandLastFeed=feed;
          await historicalPage(feed).catch(()=>{state.data.meta.historyMessage='History read unavailable. Latest local evidence retained.';});
        }
      }
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
      if(state.open&&['activity','heatmap'].includes(state.tab))loadFactionScanner();
      if(!document.hidden&&sharedEndpoint()&&sharedScope()){sharedPull(false);await syncCommand(null,true);}
      refreshCommandSignals();
      state.lastRefresh=Date.now();
    }catch(e){state.error=String(e.message||e);}
    finally{recordDeskChanges(deskBefore);state.loading=false;state.spinner='';save();publish();render();syncNativeWar();}
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
    '#warstaxx-root details{border:1px solid #315c7c;border-radius:9px;margin:10px 0;padding:0 10px;background:#0a223b}#warstaxx-root summary{cursor:pointer;min-height:44px;padding:12px 0;font-weight:700;color:#a8e9fd;line-height:1.5}#warstaxx-root details[open]>summary{border-bottom:1px solid #315c7c;margin-bottom:10px}',
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
    '#warstaxx-root details label{display:grid;min-width:0}#warstaxx-root select,#warstaxx-root input{max-width:100%;box-sizing:border-box}',
    '#warstaxx-root .ws-grid-tabs,#warstaxx-root .ws-tracker-controls,#warstaxx-root .ws-grid-key{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin:6px 0}',
    '#warstaxx-root .ws-grid-tabs button{background:#122f46;color:#bcd9e7;border:1px solid #34556a;border-radius:5px;min-height:32px;padding:3px 9px;font:inherit}#warstaxx-root .ws-grid-tabs button[aria-pressed=true]{background:#105274;color:white;border-color:#64d7e8}',
    '#warstaxx-root .ws-tracker-controls label{display:flex;align-items:center;gap:4px;font-size:12px;margin:0;max-width:100%}#warstaxx-root .ws-tracker-controls select{width:auto;max-width:145px;min-height:30px;margin:0;padding:3px}',
    '#warstaxx-root .ws-tracker-controls .ws-idle{display:inline-flex;flex-direction:row;gap:3px}#warstaxx-root .ws-idle input{width:15px;height:15px;min-height:0;margin:0}',
    '#warstaxx-root details[data-ws-disclosure="grid-filters"]{margin:5px 0}#warstaxx-root details[data-ws-disclosure="grid-filters"]>summary{padding:5px 7px;min-height:24px;font-size:12px}',
    '#warstaxx-root .ws-grid-key{color:#c7dce7;font-size:11px;gap:7px}#warstaxx-root .ws-grid-key span:before{content:"";display:inline-block;background:#46768b;width:8px;height:8px;margin-right:3px;border-radius:2px}#warstaxx-root .ws-grid-key .peace:before,#warstaxx-root .ws-grid-key .lead:before{background:#4bcc8a}#warstaxx-root .ws-grid-key .war:before,#warstaxx-root .ws-grid-key .trail:before{background:#f3a54c}',
    '#warstaxx-root .ws-hour-scroll{overflow-x:auto;max-width:100%;container-type:inline-size;font-variant-numeric:tabular-nums;scrollbar-color:#527186 #0a1a2a}',
    '#warstaxx-root .ws-hour-scroll table{border-collapse:separate;border-spacing:1px;width:max(100%,var(--ws-grid-width,550px));min-width:0;table-layout:fixed;margin:0;background:#0c1c2b}',
    '#warstaxx-root .ws-date-col{width:64px}#warstaxx-root .ws-heavy-grid table{width:max(100%,680px)}#warstaxx-root .ws-name-col{width:119px}#warstaxx-root .ws-heavy-grid th small{display:block;font-size:10px;color:#b2cad8;font-weight:400}#warstaxx-root .ws-heavy-grid th button{background:none;border:0;color:#94e2fc;text-align:left;padding:3px 0;max-width:114px;overflow:hidden;text-overflow:ellipsis;min-height:24px;vertical-align:middle}#warstaxx-root .ws-heavy-grid .ws-grid-cell{min-height:38px}',
    '#warstaxx-root .ws-hour-scroll th,#warstaxx-root .ws-hour-scroll td{font-size:11px;line-height:17px;text-align:center;padding:0;border:0;min-width:0;color:#bed8e2;font-weight:500}',
    '#warstaxx-root .ws-hour-scroll th:first-child,#warstaxx-root .ws-matrix-title{position:sticky;left:0;background:#142b3e;text-align:left;z-index:1}',
    '#warstaxx-root .ws-hour-scroll th:first-child{padding:0 4px;min-width:64px;color:#e6f3fa;white-space:nowrap}#warstaxx-root .ws-matrix-title{padding:4px 5px;margin:6px 0 1px;font-size:13px;font-weight:700;color:#dcf4fa}#warstaxx-root .ws-matrix-title small{font-size:10px;font-weight:400}',
    '#warstaxx-root .ws-grid-cell{appearance:none;display:block;width:100%;min-width:0;min-height:20px;padding:0 1px;border:0;border-radius:2px;box-shadow:none;font:600 11px/20px system-ui,sans-serif;color:#f0f8fa}',
    '#warstaxx-root .ws-grid-cell[aria-pressed=true],#warstaxx-root .ws-grid-cell:focus-visible{outline:2px solid white;outline-offset:-2px}#warstaxx-root .ws-grid-cell.gap{background:transparent;color:#748799}',
    '#warstaxx-root .ws-grid-cell.partial{background-image:linear-gradient(225deg,#cee7ec 3px,transparent 3px)}',
    '#warstaxx-root .ws-grid-detail td{text-align:left;background:#102c41}#warstaxx-root .ws-grid-detail td>div{position:sticky;left:0;width:min(82vw,660px);max-width:100cqi;box-sizing:border-box;padding:6px;font:12px/1.4 system-ui,sans-serif;white-space:normal;color:#e0f1fa}#warstaxx-root .ws-grid-detail p{margin:4px 0}',
    '#warstaxx-root .ws-grid-cell.peace.lvl0,#warstaxx-root .ws-grid-cell.lead.lvl0{background-color:#19372f;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.peace.lvl1,#warstaxx-root .ws-grid-cell.lead.lvl1{background-color:#20513d;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.peace.lvl2,#warstaxx-root .ws-grid-cell.lead.lvl2{background-color:#2a684a;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.peace.lvl3,#warstaxx-root .ws-grid-cell.lead.lvl3{background-color:#51a370;color:#0b1c27}',
    '#warstaxx-root .ws-grid-cell.peace.lvl4,#warstaxx-root .ws-grid-cell.lead.lvl4{background-color:#8fe3a7;color:#0b1c27}',
    '#warstaxx-root .ws-grid-cell.war.lvl0,#warstaxx-root .ws-grid-cell.trail.lvl0{background-color:#3e2f23;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.war.lvl1,#warstaxx-root .ws-grid-cell.trail.lvl1{background-color:#624024;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.war.lvl2,#warstaxx-root .ws-grid-cell.trail.lvl2{background-color:#855021;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.war.lvl3,#warstaxx-root .ws-grid-cell.trail.lvl3{background-color:#ce8945;color:#0b1c27}',
    '#warstaxx-root .ws-grid-cell.war.lvl4,#warstaxx-root .ws-grid-cell.trail.lvl4{background-color:#ffc270;color:#0b1c27}',
    '#warstaxx-root .ws-grid-cell.unknown.lvl0,#warstaxx-root .ws-grid-cell.mixed.lvl0,#warstaxx-root .ws-grid-cell.even.lvl0{background-color:#243440;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.unknown.lvl1,#warstaxx-root .ws-grid-cell.mixed.lvl1,#warstaxx-root .ws-grid-cell.even.lvl1{background-color:#304b62;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.unknown.lvl2,#warstaxx-root .ws-grid-cell.mixed.lvl2,#warstaxx-root .ws-grid-cell.even.lvl2{background-color:#375c75;color:#f1f8fa}',
    '#warstaxx-root .ws-grid-cell.unknown.lvl3,#warstaxx-root .ws-grid-cell.mixed.lvl3,#warstaxx-root .ws-grid-cell.even.lvl3{background-color:#719ab3;color:#0b1c27}',
    '#warstaxx-root .ws-grid-cell.unknown.lvl4,#warstaxx-root .ws-grid-cell.mixed.lvl4,#warstaxx-root .ws-grid-cell.even.lvl4{background-color:#a8cbd9;color:#0b1c27}',
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
    '#warstaxx-root .ws-panel{width:min(1180px,100%);background:#081523;border-color:#254660}#warstaxx-root .ws-head{background:#0b1c30;padding:9px 14px}#warstaxx-root .ws-tabs{display:grid;grid-template-columns:repeat(3,1fr);overflow:visible;padding:6px;gap:6px}#warstaxx-root .ws-tabs button{min-height:44px;border-radius:9px;font-weight:750}#warstaxx-root .ws-content{padding:16px;background:#081523}#warstaxx-root .ws-footer{padding:5px 12px}',
    '#warstaxx-root .ws-workspace-head{margin:0 0 14px}#warstaxx-root .ws-workspace-head>small{color:#55d5f4;letter-spacing:1.4px;font-size:10px;font-weight:800}#warstaxx-root h1{font-size:clamp(21px,3vw,29px);line-height:1.2;margin:5px 0 8px}#warstaxx-root .ws-workspace-head p{max-width:72ch;font-size:12px}#warstaxx-root .ws-card{background:#102438;border-color:#29435a;border-radius:12px}#warstaxx-root .ws-row small{display:block;margin-top:4px}#warstaxx-root .ws-row{gap:10px}#warstaxx-root .ws-row>span:first-child{min-width:0;overflow-wrap:anywhere}',
    '#warstaxx-root .ws-scoreboard{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:linear-gradient(120deg,#11334d,#102138);border:1px solid #31516c;border-radius:12px;padding:14px 8px;text-align:center}#warstaxx-root .ws-scoreboard small{display:block;font-size:10px;letter-spacing:.7px}#warstaxx-root .ws-scoreboard strong{display:block;font-size:clamp(19px,3vw,30px);font-variant-numeric:tabular-nums}#warstaxx-root .ws-positive{color:#71e6b4}#warstaxx-root .ws-negative{color:#ff929e}#warstaxx-root .ws-live-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 12px;font-size:11px;color:#a7bdd0}',
    '#warstaxx-root .ws-segments{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0 14px}#warstaxx-root .ws-segments button{background:#112a40;border:1px solid #31516a;border-radius:8px;min-height:40px;padding:7px 11px;font-size:12px;color:#c7daeb}#warstaxx-root .ws-segments button[aria-pressed=true]{background:#135a83;border-color:#62d7f5;color:#fff}#warstaxx-root .ws-priority-grid,#warstaxx-root .ws-roster-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#warstaxx-root .ws-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '#warstaxx-root .ws-launch-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}#warstaxx-root .ws-tool-group{margin:18px 0 24px}#warstaxx-root .ws-tool-tile{display:flex;flex-direction:column;gap:6px;text-align:left;padding:14px;border:1px solid #294b66;border-radius:10px;background:#10273b;min-height:83px;color:#e3f5ff}#warstaxx-root .ws-tool-tile:hover{border-color:#55c6f4;background:#16354d}#warstaxx-root .ws-tool-tile span{color:#a7bfd3;font-size:12px}',
    '#warstaxx-root .ws-roster-controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}#warstaxx-root .ws-roster-controls>*{width:100%;min-width:0;min-height:42px}#warstaxx-root .ws-country-title{padding:10px 12px;margin:16px 0 8px;background:#153b56;border-left:4px solid #59d2ef;border-radius:5px;color:#def8ff}#warstaxx-root .ws-player-row{min-width:0;background:#102438;border:1px solid #2b465d;border-radius:11px;padding:11px}#warstaxx-root .ws-player-heading{display:flex;flex-wrap:wrap;align-items:center;gap:6px}#warstaxx-root .ws-player-heading>.ws-btn{font-size:16px;font-weight:800;background:none;border:0;text-align:left;padding:4px 0;color:#c5f1ff;max-width:100%;overflow-wrap:anywhere}#warstaxx-root .ws-player-status{margin-left:auto;font-size:11px;padding:4px 7px;background:#24384b;border-radius:6px}#warstaxx-root .ws-player-status.soon{background:#163e32;color:#86f6b8}#warstaxx-root .ws-player-status.near{background:#513415;color:#ffcc82}#warstaxx-root .ws-skull-mark{background:#6332a0;color:white;border-radius:5px;padding:2px 7px}',
    '#warstaxx-root .ws-player-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0;padding:9px 0;border-block:1px solid #294256}#warstaxx-root .ws-player-metrics small{display:block;font-size:10px;text-transform:uppercase}#warstaxx-root .ws-player-metrics b{font-size:14px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}#warstaxx-root .ws-player-foot{display:flex;align-items:center;justify-content:space-between;gap:6px;color:#a7bfd3;font-size:10px}#warstaxx-root .ws-player-row details{margin-bottom:0}#warstaxx-root .ws-player-row summary{font-size:11px;padding:7px 0;min-height:34px}#warstaxx-root .ws-route-back{margin-bottom:8px}#warstaxx-root button:focus-visible,#warstaxx-root summary:focus-visible{outline:2px solid #70dcff;outline-offset:3px}',
    '@media(max-width:680px){#warstaxx-root .ws-content{padding:10px}#warstaxx-root .ws-priority-grid,#warstaxx-root .ws-roster-grid{grid-template-columns:1fr}#warstaxx-root .ws-launch-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#warstaxx-root .ws-roster-controls{grid-template-columns:1fr 1fr}#warstaxx-root .ws-roster-controls input{grid-column:1/-1}#warstaxx-root .ws-tabs button{padding:6px 3px;font-size:12px}#warstaxx-root .ws-segments button{flex:1 0 auto}#warstaxx-root .ws-tool-tile{padding:11px}#warstaxx-root .ws-head small{letter-spacing:0}}',
    '#warstaxx-root .ws-focus-home{max-width:760px;margin:8px auto}#warstaxx-root .ws-focus-context{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-weight:700;color:#cee8f8;margin:6px 4px 24px}#warstaxx-root .ws-focus-context span{font-size:12px;color:#91abc1;font-weight:400}#warstaxx-root .ws-next-step{position:relative;padding:32px;background:radial-gradient(ellipse at top right,#164f70,transparent 75%),linear-gradient(150deg,#15334f,#0c1e32);border:1px solid #3b7297;border-radius:20px;box-shadow:0 18px 45px #0005}#warstaxx-root .ws-step-marker{display:grid;place-items:center;background:#1b5579;color:#b9eeff;width:40px;height:40px;border-radius:12px;font-size:24px;margin-bottom:18px}#warstaxx-root .ws-next-step.attention{border-left:4px solid #f4aa62}#warstaxx-root .ws-next-step.ready{border-left:4px solid #75dfae}#warstaxx-root .ws-next-step h1{font-size:clamp(25px,5vw,36px);max-width:25ch;margin:0 0 14px}#warstaxx-root .ws-next-step p{font-size:15px;line-height:1.7;max-width:52ch;color:#b8cfe0;margin-bottom:25px}#warstaxx-root .ws-primary-action{display:flex;align-items:center;justify-content:space-between;gap:22px;width:100%;min-height:54px;border:1px solid #75d4ff;border-radius:11px;padding:13px 18px;background:linear-gradient(110deg,#1775ac,#135588);color:white;font-weight:800;box-shadow:0 6px 16px #0004}#warstaxx-root .ws-primary-action:disabled{opacity:.6;cursor:wait}#warstaxx-root .ws-focus-freshness{font-size:11px;text-align:center;color:#8da9bd;margin:14px}#warstaxx-root .ws-focus-extra{margin-top:28px;background:transparent;border-color:#243b50}#warstaxx-root .ws-player-glance{font-size:12px;color:#a9bfd1}#warstaxx-root .ws-focus-extra>summary{font-weight:500} @media(max-width:600px){#warstaxx-root .ws-next-step{padding:23px}#warstaxx-root .ws-focus-context{margin-bottom:18px}}',
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
      b('FF settings','tab:settings')+b('Premium intelligence','tab:scouter')+
      '<label><input type="checkbox" id="ws-ff-flight-alerts" '+(cfg.scouterFlightAlerts!==false?'checked':'')+'> Notify me when a Premium flight could land within 15 minutes. Flight times on the roster update independently.</label>'+'</div>'+
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
      !/pending|upcoming|scheduled|prepar|waiting|matching|ended|complete|cancel/i.test(String(w.status||'')));
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
    const self=ourWarReadiness(),assignedId=positive(sharedQueue(self.id)[0]?.[0]||cfg.assignments[self.id]),
      assigned=state.data.enemies.find(p=>p.id===assignedId)||null,
      // One verified scan serves both the recommended option and any saved order.
      options=self.kind==='okay'&&self.player?
        efficiencyHits(self.player,Math.max(1,state.data.enemies.length)).filter(hit=>!sharedRestriction(hit.player.id,self.id)):[],
      recommended=options[0]||null;
    let target=assignedId?null:recommended,issue='',evidence=null;
    if(assignedId){
      if(sharedRestriction(assignedId,self.id))issue=sharedRestriction(assignedId,self.id);
      else if(!assigned)issue='The assigned opponent is missing from the current roster.';
      else if(!self.player||self.kind!=='okay')issue='Your official status is not confirmed Okay.';
      else if(!rosterFresh('ours')||!rosterFresh('enemies'))
        issue='An official roster is older than five minutes.';
      else if(memberState(assigned)!=='okay')
        issue='The assigned opponent is '+memberState(assigned)+', not Okay.';
      else if(!roleAllows(self.player,assigned))
        issue='The assigned opponent is outside your selected Black Skull strength bracket.';
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
    return sharedTransport(method,revision,payload,'orders');
  }
  async function sharedTransport(method,revision,payload,resource){
    const base=sharedEndpoint(),scope=sharedScope();
    if(!base||!scope)throw new Error('Shared orders require HTTPS endpoint, token, faction and active war');
    const url=base+(resource==='command'?'/v2/factions/':'/v1/factions/')+scope.faction+'/wars/'+scope.war+'/'+resource;
    const headers={'Authorization':'Bearer '+String(cfg.shared.token),
      'Accept':'application/json'};
    if(method==='PUT'){headers['Content-Type']='application/json';
      headers['If-Match']=String(revision);}
    const body=method==='PUT'?JSON.stringify({data:payload}):undefined;
    const parseTransport=response=>{
      const status=Number(response?.status);
      if(!Number.isFinite(status)||status<100)
        throw new Error('Worker native transport returned no HTTP status');
      let result;
      try{result=JSON.parse(String(response?.responseText??''));}
      catch(_){result={error:'Invalid JSON response from Worker'};}
      return {ok:status>=200&&status<300,status,result};
    };
    // Torn PDA native HTTP bridges cross-origin GET/PUT, avoiding WebView CORS.
    const pdaTransport=method==='GET'?typeof PDA_httpGet==='function':
      method==='PUT'?typeof PDA_httpPut==='function':false;
    if(pdaTransport){
      let timer;
      try{
        return await Promise.race([
          Promise.resolve().then(()=>method==='GET'?PDA_httpGet(url,headers):
            PDA_httpPut(url,headers,body)).then(parseTransport),
          new Promise((_,reject)=>{timer=setTimeout(()=>
            reject(new Error('Worker native HTTP request timed out')),12000);})
        ]);
      }catch(e){
        const reason=/timed out/i.test(String(e?.message||e))?'timed out':
          'could not complete request';
        throw new Error('Worker Torn PDA connection '+reason+'. Check the Worker URL and PDA network access.');
      }finally{clearTimeout(timer);}
    }
    if(typeof GM_xmlhttpRequest==='function'){
      return await new Promise((resolve,reject)=>GM_xmlhttpRequest({
        method,url,headers,...(body===undefined?{}:{data:body}),timeout:12000,
        onload:r=>{try{resolve(parseTransport(r));}catch(e){reject(e);}},
        onerror:()=>reject(new Error('Worker GM cross-origin connection failed')),
        ontimeout:()=>reject(new Error('Worker GM request timed out'))
      }));
    }
    // Browser fallback for contexts where neither privileged bridge exists.
    const controller=typeof AbortController==='function'?new AbortController():null;
    const timer=setTimeout(()=>controller?.abort(),12000);
    try{
      const response=await fetch(url,{method,mode:'cors',credentials:'omit',cache:'no-store',
        headers,...(controller?{signal:controller.signal}:{}),
        ...(body===undefined?{}:{body})});
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
    if(!['relative','percent','min-bss'].includes(incomingHeavy.mode)||
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
      state.data.ours=roster(response,state.data.ours);
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
        if(enemies)state.data.enemies=roster(enemies,state.data.enemies);
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
    return 'hidden'; // No unrelated-page war banner, including old everywhere preferences.
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
  // Snapshot-based planning: hospital expiries are never promoted to Okay.
  function protectionPriorities(at=Date.now()){
    if(!activeWarNow())return [];
    return state.data.ours.map(player=>({player,impact:liveWarMemberImpact(player.id,undefined,at)}))
      .filter(x=>x.impact.known&&n(x.impact.given)>0)
      .map(x=>({...x,exposed:rosterFresh('ours',at)&&memberState(x.player)==='okay',
        fresh:rosterFresh('ours',at),feedFresh:n(x.impact.lastFetch)>0&&at-n(x.impact.lastFetch)<5*MIN}))
      .sort((a,b)=>Number(b.exposed&&b.feedFresh)-Number(a.exposed&&a.feedFresh)||
        n(b.impact.given)-n(a.impact.given)||a.player.id-b.player.id);
  }
  function skullReleaseQueue(at=Date.now()){
    if(!activeWarNow()||!rosterFresh('enemies',at))return [];
    const bands=enemyRoleBands();
    return state.data.enemies.filter(p=>bands.heavy.has(p.id)&&memberState(p)==='hospital'&&
      n(p.until)>at&&n(p.until)<=at+30*MIN).map(player=>({player,
        country:nativeWarLocation(player).country,minutes:Math.ceil((player.until-at)/MIN),
        assigned:state.data.ours.filter(p=>positive(cfg.assignments[p.id])===player.id),
        reasons:bands.reasons.get(player.id)||[]}))
      .sort((a,b)=>a.player.until-b.player.until||a.player.id-b.player.id);
  }
  function regularBreakers(at=Date.now()){
    if(!activeWarNow())return {regulars:[],rows:[],missing:0};
    const regulars=state.data.ours.filter(p=>!cfg.blackSkulls[p.id]),
      ranked=regulars.map(player=>({player,value:friendlyBattleEstimate(player).value}))
        .filter(x=>x.value!==null).sort((a,b)=>b.value-a.value||a.player.id-b.player.id),
      top=ranked.slice(0,3),snap=concessionSnapshot(undefined,at);
    const rows=state.data.enemies.map(player=>{
      const victims=top.map(x=>({player:x.player,record:snap?.winsByDefender?.[x.player.id]?.[player.id]}))
        .filter(x=>n(x.record?.wins)>0);
      return {player,victims,wins:victims.reduce((sum,x)=>sum+n(x.record.wins),0),
        partial:!snap?.complete,lastFetch:n(snap?.lastFetch)};
    }).filter(x=>x.wins>=2).sort((a,b)=>b.wins-a.wins||a.player.id-b.player.id);
    return {regulars:top,rows,missing:regulars.length-ranked.length};
  }
  function recentMemberComparisons(limit=6){
    const reports=Object.values(state.data.reports||{}).filter(r=>n(r.war?.end)>0&&
      positive(r.id)!==positive(state.data.war?.id)&&r.factions?.some(f=>f.id===positive(cfg.ourId)))
      .sort((a,b)=>n(b.war.end)-n(a.war.end)||b.id-a.id).slice(0,limit);
    const rows=state.data.ours.map(player=>{
      const results=reports.map(r=>({warId:r.id,member:r.factions.find(f=>f.id===positive(cfg.ourId))?.members?.find(p=>p.id===player.id)}));
      const scored=results.filter(x=>x.member&&officialNumber(x.member.score)!==null),
        scores=scored.map(x=>Number(x.member.score)),
        earlier=scores.slice(1),mean=earlier.length?earlier.reduce((a,b)=>a+b,0)/earlier.length:null;
      return {player,results,samples:scores.length,total:scores.length?scores.reduce((a,b)=>a+b,0):null,
        average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,
        change:scores.length>=2?scores[0]-mean:null};
    }).sort((a,b)=>(b.average??-1)-(a.average??-1)||a.player.id-b.player.id);
    return {reports,rows};
  }
  // In-memory refresh comparison only; never invent activity between observations.
  function captureDeskSnapshot(){
    return {scope:[positive(cfg.ourId),positive(cfg.enemyId),positive(state.data.war?.id)].join(':'),
      score:warScore(),updated:{...state.data.updated},
      ours:state.data.ours.map(p=>({...p})),enemies:state.data.enemies.map(p=>({...p}))};
  }
  function recordDeskChanges(before,at=Date.now()){
    if(!before||before.scope!==captureDeskSnapshot().scope){state.deskChanges=null;return;}
    const rows=[];
    for(const side of ['ours','enemies']){
      const oldAt=n(before.updated[side]),newAt=n(state.data.updated[side]);
      if(newAt<=oldAt||!oldAt||at-oldAt>=5*MIN||!rosterFresh(side,at))continue;
      const old=new Map(before[side].map(p=>[p.id,p]));
      for(const player of state.data[side]){
        const prior=old.get(player.id);if(!prior)continue;
        const from=nativeWarLocation(prior).country,to=nativeWarLocation(player).country,
          a=memberState(prior),b=memberState(player);
        if(a!==b||from!==to)rows.push({id:player.id,name:player.name,side,
          detail:prior.status+' / '+from+' -> '+player.status+' / '+to});
      }
    }
    const score=warScore(),prior=before.score;
    const delta=n(state.data.updated.wars)>n(before.updated.wars)&&score&&prior?
      {ours:score.our-prior.our,enemies:score.enemy-prior.enemy}:null;
    const refreshed=['ours','enemies','wars'].some(key=>n(state.data.updated[key])>n(before.updated[key]));
    if(refreshed)state.deskChanges={at,rows:rows.slice(0,30),total:rows.length,delta};
  }
  function deskChangesCard(){
    const x=state.deskChanges;
    if(!x)return '<p class="ws-small">Changes appear after two recent observations in this session.</p>';
    return '<details data-ws-disclosure="changes"><summary>Since last refresh: '+x.total+' status/location changes'+
      (x.delta?' | Score '+(x.delta.ours>=0?'+':'')+fmt(x.delta.ours)+' / '+(x.delta.enemies>=0?'+':'')+fmt(x.delta.enemies):'')+'</summary><p class="ws-small">Observed '+esc(age(x.at))+
      '. Compared snapshots only; no inferred online/travel activity.</p>'+x.rows.map(p=>
      '<div class="ws-row"><span>'+pill(p.side==='ours'?'OUR':'ENEMY')+' '+infoButton(p.name,p.id)+
      '<br><small>'+esc(p.detail)+'</small></span></div>').join('')+
      (x.total>30?'<p>Showing first 30 changes.</p>':'')+'</details>';
  }
  function protectionCard(limit=5){
    const rows=protectionPriorities().slice(0,limit);
    return card('Protect our points', '<p class="ws-small">Exposed members first, then most observed points conceded. Keep proven scorers active where appropriate; review before assigning defence.</p>'+
      (rows.length?rows.map(x=>'<div class="ws-row"><span>'+infoButton(x.player.name,x.player.id)+' '+
        pill(!x.fresh?'Roster stale':x.exposed?'Exposed':x.player.status,x.exposed?'bad':'')+
        '<br><small>Given '+(!x.impact.complete?'at least ':'')+fmt(x.impact.given)+' | Earned '+scoreLabel(x.impact.earned)+
        ' | '+x.impact.in30+' hits / 30m'+(!x.feedFresh?' | Attack feed stale':'')+
        '</small></span>'+b('Defence','tab:turtle')+'</div>').join(''):
        empty('No captured scoring attacks against our current members yet.'))+
      '<p class="ws-small">Captured ranked-war respect, not official member scores.</p>'+b('All members / defence','tab:turtle'));
  }
  function skullReleaseCard(limit=8){
    const rows=skullReleaseQueue();
    return card('Black Skulls | next releases',
      '<p class="ws-small">Heavy targets leaving hospital within 30m. Expiry is not confirmed availability.</p>'+
      (!rosterFresh('enemies')?empty('Refresh the enemy roster to see releases.'):
        rows.length?rows.slice(0,limit).map(x=>'<div class="ws-row"><span>'+infoButton(x.player.name,x.player.id)+' '+
          pill(x.minutes+'m',x.minutes<=5?'good':x.minutes<=15?'warn':'')+
          '<br><small>'+esc(x.country)+' | '+(x.assigned.length?'Assigned: '+esc(x.assigned.map(p=>p.name).join(', ')):'No hitter assigned')+
          '</small></span>'+b('Coordinate','tab:command')+'</div>').join(''):empty('No heavy-target hospital expiries in the next 30m.'))+
      (rows.length>limit?'<p>'+rows.length+' releases total. Open squad command for the full queue.</p>':'')+
      b('Squad command','tab:leader'));
  }
  function regularBreakersCard(){
    const x=regularBreakers();
    return card('Enemies beating our strongest regulars',
      '<p class="ws-small">Two or more captured scoring wins against the top three known regulars by current BSS. '+
      x.missing+' regulars have unknown strength. This does not reconstruct their stats at the time of a hit.</p>'+
      (x.rows.length?x.rows.slice(0,8).map(row=>'<div class="ws-row"><span>'+infoButton(row.player.name,row.player.id)+
        ' '+pill(row.wins+' wins','bad')+'<br><small>'+esc(row.victims.map(v=>v.player.name+' ('+v.record.wins+')').join(', '))+
        (row.partial?' | Partial feed':'')+' | '+esc(age(row.lastFetch))+'</small></span>'+
        b('Review target','player:'+row.player.id)+'</div>').join(''):empty('No repeat wins evidenced in the captured current-war feed.')));
  }
  function memberComparisonCard(){
    const x=recentMemberComparisons();
    return card('Our members | last '+x.reports.length+' completed reports',
      '<p class="ws-small">Official report points. Change compares the latest available member result with their earlier average. Missing records stay unknown; war length and opposition differ.</p>'+
      (!x.reports.length?empty('Completed own-faction reports load through the existing history refresh.'):
        '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Member</th><th>Average</th><th>Change</th>'+x.reports.map(r=>'<th>'+b('#'+r.id,'war:'+r.id)+'</th>').join('')+'</tr></thead><tbody>'+
        x.rows.map(row=>'<tr><td>'+infoButton(row.player.name,row.player.id)+'</td><td>'+scoreLabel(row.average)+'<br><small>'+row.samples+' samples</small></td><td>'+
          (row.change===null?'Unknown':(row.change>=0?'+':'')+fmt(row.change))+'</td>'+row.results.map(r=>'<td>'+scoreLabel(r.member?.score)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'));
  }
  function decisionDesk(){
    return '<div class="ws-toolbar">'+b('HIT','fast-hit')+b('HEAL','fast-heal')+b('Orders','tab:command')+b('Refresh','refresh')+'</div>'+
      deskChangesCard()+protectionCard(3)+skullReleaseCard(3)+
      '<details data-ws-disclosure="breakers"><summary>Repeat threats: '+regularBreakers().rows.length+' enemies beating strong regulars</summary>'+regularBreakersCard()+'</details>';
  }
  function warAvailabilityHorizon(at=Date.now()){
    const fresh={ours:rosterFresh('ours',at),enemies:rosterFresh('enemies',at)};
    const countries=new Map(),events=[],windows=[5,15,30];
    const blank=()=>({available:0,exits:[0,0,0],overdue:0,untimed:0});
    for(const side of ['ours','enemies']){
      if(!fresh[side])continue;
      for(const player of state.data[side]){
        const location=nativeWarLocation(player),country=location.country;
        if(!countries.has(country))countries.set(country,{country,ours:blank(),enemies:blank()});
        const row=countries.get(country)[side],kind=memberState(player);
        if(kind==='okay'||location.phase==='abroad')row.available++;
        if(kind!=='hospital')continue;
        const until=n(player.until);
        if(until<=0){row.untimed++;continue;}
        if(until<=at){row.overdue++;continue;}
        windows.forEach((minutes,i)=>{if(until-at<=minutes*MIN)row.exits[i]++;});
        if(until-at<=30*MIN)events.push({side,player,country,until,
          minutes:Math.ceil((until-at)/MIN),
          assigned:side==='enemies'&&Object.values(cfg.assignments).some(id=>positive(id)===player.id),
          watched:side==='enemies'&&Boolean(cfg.watchlist[player.id])});
      }
    }
    return {at,fresh,windows,countries:[...countries.values()].sort((a,b)=>
      a.country==='Unknown'?1:b.country==='Unknown'?-1:a.country.localeCompare(b.country)),
      events:events.sort((a,b)=>a.until-b.until||a.side.localeCompare(b.side)||a.player.id-b.player.id)};
  }
  function assignmentAudit(at=Date.now()){
    const fresh=rosterFresh('ours',at)&&rosterFresh('enemies',at),rows=[];
    const counts=new Map();
    for(const target of Object.values(cfg.assignments)){
      const id=positive(target);if(id)counts.set(id,(counts.get(id)||0)+1);
    }
    for(const [id,value] of Object.entries(cfg.assignments)){
      const targetId=positive(value);if(!targetId)continue;
      const friend=state.data.ours.find(p=>p.id===positive(id));
      const enemy=state.data.enemies.find(p=>p.id===targetId);
      const reasons=[],add=(text)=>reasons.push(text);
      if(!fresh)add('Refresh both rosters before reviewing this order');
      else if(!friend||!enemy)add(!friend?'Hitter is no longer in the loaded roster':'Target is no longer in the loaded roster');
      else{
        const own=nativeWarLocation(friend),target=nativeWarLocation(enemy);
        const available=p=>memberState(p)==='okay'||nativeWarLocation(p).phase==='abroad';
        if(!available(friend))add('Hitter unavailable: '+friend.status);
        if(!available(enemy))add('Target unavailable: '+enemy.status);
        if(own.country==='Unknown'||target.country==='Unknown')add('Location unverified');
        else if(own.country!==target.country)add('Different countries: '+own.country+' / '+target.country);
        if(hitterReadiness(friend,at).energyEnough===false)add('Known energy below 25');
      }
      if(counts.get(targetId)>1)add('Target assigned to '+counts.get(targetId)+' hitters');
      if(reasons.length)rows.push({friend,enemy,friendId:positive(id),targetId,reasons});
    }
    return {fresh,rows,total:Object.values(cfg.assignments).filter(positive).length};
  }
  function warPlanningBrief(at=Date.now()){
    const horizon=warAvailabilityHorizon(at),audit=assignmentAudit(at);
    return 'COUNTRY OUTLOOK (our / enemy; snapshot, not win odds)\n'+
      horizon.countries.map(row=>row.country+': available '+
        (horizon.fresh.ours?row.ours.available:'?')+'/'+(horizon.fresh.enemies?row.enemies.available:'?')+
        '; hospital expiries within 15m '+(horizon.fresh.ours?row.ours.exits[1]:'?')+'/'+
        (horizon.fresh.enemies?row.enemies.exits[1]:'?')).join('\n')+
      '\nASSIGNMENT CHECKS\n'+(audit.rows.length?audit.rows.map(row=>
        (row.friend?.name||'#'+row.friendId)+' -> '+(row.enemy?.name||'#'+row.targetId)+': '+row.reasons.join('; ')).join('\n'):
        'No status/location conflicts found. Matchup and energy still require verification.')+
      '\nHospital timers can change through early medical use or new attacks. Expiry is not confirmed availability.';
  }
  function warPlanningCard(){
    const h=warAvailabilityHorizon(),audit=assignmentAudit();
    const pair=(row,field,index)=>['ours','enemies'].map(side=>!h.fresh[side]?'?':
      index===undefined?row[side][field]:row[side][field][index]).join(' / ');
    let body='<p><b>Our / enemy</b> in each cell. Available includes Okay and confirmed abroad statuses; counts do not establish a favourable matchup. Hospital columns are cumulative expiry windows, not guaranteed releases.</p>';
    if(!h.fresh.ours||!h.fresh.enemies)body+='<p class="ws-note ws-warn">Stale or missing roster: '+
      (!h.fresh.ours?'our faction ':'')+(!h.fresh.enemies?'opponent':'')+'. Affected counts stay unknown.</p>';
    body+=h.countries.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Country</th><th>Available</th><th>H &lt;=5m</th><th>H &lt;=15m</th><th>H &lt;=30m</th></tr></thead><tbody>'+
      h.countries.map(row=>'<tr><td>'+esc(row.country)+'</td><td>'+pair(row,'available')+'</td>'+
        h.windows.map((_,i)=>'<td>'+pair(row,'exits',i)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':empty('Refresh rosters to build the country outlook.');
    const overdue=h.countries.reduce((sum,row)=>sum+row.ours.overdue+row.enemies.overdue,0),
      untimed=h.countries.reduce((sum,row)=>sum+row.ours.untimed+row.enemies.untimed,0);
    if(overdue||untimed)body+='<p class="ws-small">'+overdue+' expired hospital timers need confirmation; '+untimed+' hospitalised players have no usable expiry. Neither is counted as available.</p>';
    body+='<details data-ws-disclosure="hospital-timeline"><summary>Next 30 minutes: '+h.events.length+' hospital expiries</summary>'+
      (h.events.length?h.events.slice(0,20).map(x=>'<div class="ws-row"><span>'+pill(x.side==='ours'?'OUR':'ENEMY')+' '+
        infoButton(x.player.name,x.player.id)+'<br><small>'+esc(x.country)+' | '+x.minutes+'m | TCT '+esc(stamp(x.until))+
        (x.assigned?' | Assigned':'')+(x.watched?' | Watched':'')+'</small></span></div>').join('')+
        (h.events.length>20?'<p>Showing earliest 20 of '+h.events.length+' expiries.</p>':''):empty('No fresh hospital expiries observed in this window.'))+'</details>';
    body+='<details data-ws-disclosure="assignment-audit"'+(audit.rows.length?' open':'')+'><summary>Assignment checks: '+audit.rows.length+' / '+audit.total+' orders need review</summary>'+
      (audit.rows.length?audit.rows.slice(0,20).map(row=>'<div class="ws-row"><span><b>'+esc(row.friend?.name||'#'+row.friendId)+' &rarr; '+
        esc(row.enemy?.name||'#'+row.targetId)+'</b><br><small>'+esc(row.reasons.join(' | '))+'</small></span>'+
        b('Review','tab:command')+'</div>').join('')+(audit.rows.length>20?'<p>Showing first 20 checks; use the leadership board for all orders.</p>':''):
        empty('No status/location conflicts found. This is not a battle-strength or energy clearance.'))+'</details>'+
      '<div class="ws-toolbar">'+b('Refresh','refresh')+b('Copy tactical briefing','copy-ops')+b('Review all orders','tab:command')+'</div>';
    return card('Next 30 minutes | country outlook',body);
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
      '\n\n'+warPlanningBrief(at)+'\n\nInformation is read-only or local. Timers are last observed estimates; no Torn action is performed.';
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
    return html+warPlanningCard()+flightWatchPanel();
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
    h+=b('Compare self-hospitalisation and flights','tab:flights');
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
    h+=protectionCard(100);
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
    if(rec&&(rec.version!==4||positive(rec.ourId)!==w.ourId||positive(rec.enemyId)!==w.enemyId||
        n(rec.start)!==w.start))rec=null;
    if(!rec&&create){
      rec={version:4,warId:positive(warId),ourId:w.ourId,enemyId:w.enemyId,start:w.start,
        cursor:Math.max(0,Math.floor(w.start/1000)-1),seen:{},byMember:{},byAttacker:{},enemyAttackers:{},winsByDefender:{},
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
        if(points!==null&&points>0){
          hitter.pointEvents=(Array.isArray(hitter.pointEvents)?hitter.pointEvents:[])
            .concat({at:a.at,points}).filter(x=>x.at>=Date.now()-2*HOUR).slice(-300);
        }
      }else{
        rec.rows++;
        // Enemy offense can be ranked independently of the friendly defender.
        if(positive(a.attacker)){
          const attacker=rec.enemyAttackers[a.attacker]||
            (rec.enemyAttackers[a.attacker]={id:a.attacker,attacks:0,scoringAttacks:0,
              enemyScore:0,lastAt:0});
          attacker.attacks++;
          if(points!==null&&points>0){attacker.scoringAttacks++;attacker.enemyScore+=points;}
          attacker.lastAt=Math.max(n(attacker.lastAt),a.at);
          if(points!==null&&points>0){
            attacker.pointEvents=(Array.isArray(attacker.pointEvents)?attacker.pointEvents:[])
              .concat({at:a.at,points}).filter(x=>x.at>=Date.now()-2*HOUR).slice(-300);
            const perDefender=rec.winsByDefender[a.defender]||
              (rec.winsByDefender[a.defender]={});
            const witness=perDefender[a.attacker]||
              (perDefender[a.attacker]={wins:0,lastAt:0});
            witness.wins++;witness.lastAt=Math.max(n(witness.lastAt),a.at);
          }
        }
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
      enemyAttackers:rec.enemyAttackers||{},winsByDefender:rec.winsByDefender||{},
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
        await keepFights(attacks(response,true).map(a=>a.ranked&&a.at>=w.start&&a.at<=w.end&&[a.attackerFaction,a.defenderFaction].sort().join() === [w.ourId,w.enemyId].sort().join()?{...a,warId:w.id}:a),'Torn ranked attacks').catch(archiveFailure);
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

  function liveEnemyWarImpact(memberId,warId=positive(state.data.war?.id),at=Date.now()){
    const id=positive(memberId),snapshot=concessionSnapshot(warId,at),
      rec=snapshot?.enemyAttackers?.[id]||null,
      complete=Boolean(snapshot?.complete),known=Boolean(snapshot?.known);
    return {id,complete,known,
      scored:known&&(complete||rec)?n(rec?.enemyScore):null,
      hits:known&&(complete||rec)?n(rec?.scoringAttacks):null,
      attacks:known&&(complete||rec)?n(rec?.attacks):null,
      lastAt:n(rec?.lastAt),lastFetch:n(snapshot?.lastFetch),
      source:!known?'Awaiting current-war attack history':
        complete?'Scanned from war start through last refresh':
        'Partial captured ranked-war attack history',
      error:String(snapshot?.error||'')};
  }

  function liveScoringPace(side,memberId,at=Date.now()){
    const w=warAttackWindow(positive(state.data.war?.id)),
      snap=concessionSnapshot(w?.id,at),id=positive(memberId);
    if(!w||!snap?.known||!id||at<=w.start)return null;
    const interval=Math.min(HOUR,at-w.start);
    // Very short windows give misleading per-hour extrapolations.
    if(interval<10*MIN)return null;
    const record=(side==='enemy'?snap.enemyAttackers:snap.byAttacker)?.[id]||null;
    if(!snap.complete&&!record)return null;
    const events=Array.isArray(record?.pointEvents)?record.pointEvents:[],
      selected=events.filter(x=>n(x.at)>at-interval&&n(x.at)<=at&&
        officialNumber(x.points)!==null&&n(x.points)>0),
      points=selected.reduce((sum,x)=>sum+n(x.points),0),
      rate=points*HOUR/interval;
    return {memberId:id,side,points,rate,hits:selected.length,
      minutes:interval/MIN,complete:Boolean(snap.complete),
      partial:!snap.complete,lastFetch:n(snap.lastFetch),
      source:'Observed current-war ranked scoring attacks in rolling 60m window'};
  }
  function liveScoringPaceCard(limit=8){
    if(!activeWarNow())return '';
    const groups=[['OUR FACTION','ours',state.data.ours],
      ['ENEMY FACTION','enemy',state.data.enemies]];
    return card('Current war scoring leaders | rolling points per hour',
      '<p>Computed from captured ranked-war attack timestamps and positive respect gains. '+
      'An early-war sample of 10\u201360 minutes is normalised to one hour. '+
      '\u2265 = attack-history scan incomplete; figures are NOT official per-player scores.</p>'+
      groups.map(([heading,side,people])=>{
        const rows=people.map(p=>({p,pace:liveScoringPace(side,p.id)}))
          .filter(x=>x.pace!==null).sort((a,b)=>b.pace.rate-a.pace.rate).slice(0,limit);
        return '<h3>'+heading+'</h3>'+
          (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table">'+
            '<thead><tr><th>Member</th><th>Pts/h</th><th>In window</th>'+
            '<th>Scoring hits</th><th>Period</th></tr></thead><tbody>'+
            rows.map(({p,pace},i)=>'<tr><td>'+(i+1)+'. '+infoButton(p.name,p.id)+
              (side==='ours'&&cfg.blackSkulls[p.id]?' '+pill('\u2620'):'')+'</td>'+
              '<td>'+(!pace.complete?'\u2265':'')+fmt(pace.rate)+'</td>'+
              '<td>'+(!pace.complete?'\u2265':'')+fmt(pace.points)+'</td>'+
              '<td>'+(!pace.complete?'\u2265':'')+fmt(pace.hits)+'</td>'+
              '<td>'+fmt(pace.minutes)+'m</td></tr>').join('')+
            '</tbody></table></div>':empty('Waiting for enough current-war attack history.'))
      }).join(''));
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
          '<td>'+(x.earned===null?'\u2014':(x.complete?'':'\u2265')+fmt(x.earned))+'</td>'+
          '<td>'+(x.given===null?'\u2014':(x.complete?'':'\u2265')+fmt(x.given))+'</td>'+
          '<td>'+(x.net===null?'\u2014':'~'+(x.net>=0?'+':'')+fmt(x.net))+'</td>'+
          '<td>'+(x.share===null?'\u2014':(x.complete?'':'\u2265')+fmt(x.share)+'%')+'</td>'+
          '<td>'+(x.ownHits===null?'\u2014':fmt(x.ownHits))+'</td>'+
          '<td>'+(x.ownHits&&x.earned!==null?fmt(x.earned/x.ownHits):'\u2014')+'</td>'+
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
      'Values marked \u2265 are incomplete minima, not final allocations. '+
      'Repeated attacks = 3+ in 30m or 5+ in 60m.</p>'+
      (rows.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Member</th><th>Given</th><th>Enemy score %</th><th>Scoring hits</th>'+
        '<th>Incoming 30m</th><th>Net proxy</th></tr></thead><tbody>'+
        rows.map(({p,x})=>'<tr><td>'+infoButton(p.name,p.id)+
          (cfg.blackSkulls[p.id]?' '+pill('SKULL'):'')+
          (x.underFire?' '+pill('REPEAT HITS','bad'):'')+'</td>'+
          '<td>'+(x.complete?'':'\u2265')+fmt(x.given)+'</td>'+
          '<td>'+(x.share===null?'\u2014':(x.complete?'':'\u2265')+fmt(x.share)+'%')+'</td>'+
          '<td>'+(x.hits===null?'\u2014':fmt(x.hits))+'</td>'+
          '<td>'+fmt(x.in30)+'</td>'+
          '<td>'+(x.net===null?'\u2014':'~'+(x.net>=0?'+':'')+fmt(x.net))+
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
      memberComparisonCard()+'<details data-ws-disclosure="all-report-tools"><summary>All reports, history, settings and advanced tools</summary>'+
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
    const extra=apiCoverageCard()+leaderboardCard(24);
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
    return h+extra+'</details>';
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
      skullReleaseCard(100)+regularBreakersCard()+
      '<details data-ws-disclosure="leader-tools"><summary>Squad setup, assignments and full performance</summary>'+
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
        '<p>Default: a higher BSS than the strongest known regular automatically reserves a target for Black Skulls. '+
        'Enemies with a recorded win against that regular also qualify, even at lower BSS. '+
        'Pin extras manually below. Incomplete regular BSS makes the boundary provisional.</p>'+
        '<div class="ws-toolbar"><label>Strength cutoff method<select id="ws-heavy-mode">'+
        [['bse','Estimated total stats (BSE) + observed victories'],['relative','Legacy relative BSS'],
          ['percent','Legacy top percentage'],['min-bss','Legacy minimum BSS']].map(([v,label])=>
          '<option value="'+v+'" '+((cfg.commandMetric==='bse'?'bse':bands.rule.mode)===v?'selected':'')+'>'+label+'</option>').join('')+
        '</select></label>'+
        '<label>Top % (5-100)<input id="ws-heavy-percent" type="number" min="5" max="100" step="1" value="'+bands.rule.percent+'"></label>'+
        '<label>Minimum BSS<input id="ws-heavy-bss" type="number" min="0" max="1000000000000000" step="any" value="'+bands.rule.minBss+'"></label></div>'+
        '<p class="ws-small">Current buckets: '+fmt(bands.heavyCount)+' heavy, '+
          fmt(bands.regularCount)+' regular, '+fmt(bands.unknown)+' unknown. '+
          'This controls targets only; it does not prove a win.</p>'+
        b('Save strength cutoff','save-heavy-cutoff'))+
      blackSkullsCoverageCard(40)+manualBlackSkullTargetsCard()+
      liveBlackSkullsImpactCard()+liveScoringPaceCard(8)+blackSkullsPerformanceCard()+comparableStrengthCard()+bonusTargetCard()+leaderboardCard(12)+
      card('BLACK SKULLS | strongest enemy targets',teamRows(black,'Black Skulls'))+
      card('REGULAR ATTACKERS | lower BSS targets',teamRows(regular,'regular attackers'))+
      card('DEFENCE / RESERVE | coordinated cover',teamRows(defensive,'defence'))+
      '<div class="ws-toolbar">'+b('Black Skulls control','tab:skulls')+
        b('Turtling duties','tab:turtle')+b('Hospital control','tab:control')+
        b('Performance leaderboard','tab:reports')+
        b('Full planning','tab:command')+'</div></details>';
  }
  function manualBlackSkullTargetsCard(limit=60){
    const bands=enemyRoleBands(),ranked=state.data.enemies.map(p=>({
      p,estimate:enemyBattleEstimate(p)
    })).sort((a,b)=>(b.estimate.value??-1)-(a.estimate.value??-1)||
      a.p.name.localeCompare(b.p.name));
    return card('Manual Black Skull targets | extra opponents',
      '<p>Pin or unpin enemies as additional Black Skull targets. Overrides are stored per enemy faction. '+
      'Unpinning does not remove a target that still meets the automatic rule.</p>'+
      (ranked.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
        '<th>Opponent</th><th>BSS</th><th>Classification</th><th>Manual action</th></tr></thead><tbody>'+
        ranked.slice(0,limit).map(({p,estimate})=>
          '<tr><td>'+infoButton(p.name,p.id)+'</td><td>'+
          (estimate.value===null?'Unknown':fmt(estimate.value)+(estimate.verified?'':' ~'))+
          '</td><td>'+esc(bands.reasons.get(p.id)?.join('; ')||
            (estimate.value===null?'Unclassified (scout required)':'Regular target'))+
          '</td><td>'+b(bands.manual.has(p.id)?'Unpin':'Pin extra',
            'toggle-heavy-target:'+p.id)+'</td></tr>').join('')+
        '</tbody></table></div>':empty('Enemy roster not loaded.')));
  }

  function blackSkullsRoom(){
    const self=ourWarReadiness(),skulls=state.data.ours.filter(p=>cfg.blackSkulls[p.id]),
      bands=enemyRoleBands(),personal=bestEfficiencyHit(),myId=positive(self.id),
      chosen=state.data.enemies.find(p=>p.id===positive(cfg.assignments[myId])),
      duty=turtlePlan().members[myId]||'not assigned',
      control=cfg.controlAssignments[currentPlanKey()]||{},
      watched=Object.entries(control).filter(([,owner])=>positive(owner)===myId)
        .map(([id])=>state.data.enemies.find(p=>p.id===positive(id))).filter(Boolean),
      priorityTargets=state.data.enemies.filter(p=>bands.heavy.has(p.id))
        .map(enemy=>({enemy,...enemyBattleEstimate(enemy)}))
        .sort((a,b)=>(b.value??-1)-(a.value??-1)||a.enemy.id-b.enemy.id);
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
      card('Black Skulls priority targets | automatic and manual',
        '<p>Auto-classification compares enemy BSS against the strongest known regular teammate, '+
        'then includes enemies who have recorded a win against that member. '+ 
        'Manual additions are extra targets. A high-BSS tag does not confirm a winning matchup.</p>'+
        (priorityTargets.length?
          '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr>'+
          '<th>Opponent</th><th>Public/manual BSS</th><th>Current status</th>'+
          '<th>Verified Black Skull matchup</th><th>Action</th></tr></thead><tbody>'+
          priorityTargets.slice(0,30).map(x=>{
            const matches=skulls.map(hitter=>({hitter,evidence:roleMatch(hitter,x.enemy,bands)}))
              .filter(entry=>entry.evidence).sort((a,b)=>a.evidence.match.ratio-b.evidence.match.ratio);
            return '<tr><td>'+infoButton(x.enemy.name,x.enemy.id)+' '+ffBadge(x.enemy.id)+
              '<br><small>Lv '+fmt(x.enemy.level)+
                ' | '+esc(bands.reasons.get(x.enemy.id)?.join('; ')||'No role explanation')+
                '</small></td>'+
              '<td>'+fmt(x.value)+'<br><small>'+esc(x.source)+'</small></td>'+
              '<td>'+esc(x.enemy.status)+'</td>'+
              '<td>'+(matches.length?matches.slice(0,2).map(k=>
                infoButton(k.hitter.name,k.hitter.id)+' (ratio '+fmt(k.evidence.match.ratio)+')').join(', '):
                'No verified favourable hitter; scout')+'</td>'+
              '<td>'+infoButton('Inspect',x.enemy.id)+' '+
                b(bands.manual.has(x.enemy.id)?'Unpin':'Pin extra',
                  'toggle-heavy-target:'+x.enemy.id)+'</td></tr>';
          }).join('')+'</tbody></table></div>':
          empty('No Black Skull targets yet. Load member BSS or pin an extra target.')))+
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
  function liveWarImpactSummaryCard(){
    if(!activeWarNow())return '';
    const captured=concessionSnapshot(),score=warScore(),
      known=Boolean(captured?.known),prefix=captured?.complete?'':'\u2265',
      earned=known?prefix+fmt(captured.ourTotal):'Unknown',
      given=known?prefix+fmt(captured.total):'Unknown',
      difference=known?captured.ourTotal-captured.total:null,
      net=difference===null?'Unknown':'~'+(difference>=0?'+':'')+fmt(difference);
    return card('Our faction war impact | earned vs conceded',
      '<div class="ws-inline-metrics">'+
      '<span><b>Earned:</b> '+earned+'</span>'+
      '<span><b>Conceded:</b> '+given+'</span>'+
      '<span><b>Observed net:</b> '+net+'</span>'+
      '<span><b>Official score:</b> '+(score?
        fmt(score.our)+' / '+fmt(score.enemy):'Unknown')+'</span></div>'+
      '<p class="ws-small">Earned/conceded are captured attack-respect points, not official complete scorecards. '+
      '\u2265 = incomplete attack-history scan. Net is an approximate swing, not an official personal metric. '+
      (captured?.lastFetch?'Last checked '+esc(age(captured.lastFetch))+'.':
        'Awaiting current-war attack history.')+'</p>');
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
      (score?.target?' | Target '+fmt(score.target):'')+'</p><p><b>'+
      (chain.fresh?'Chain #'+fmt(chain.count)+' | '+chain.remaining+'s remaining':'Chain: awaiting fresh data')+'</b></p></div>'+
      decisionDesk()+
      '<details data-ws-disclosure="live-analysis"><summary>Full war analysis, chain and tactical tools</summary>'+
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
      warPlanningCard()+hospitalWatchCard()+bonusTargetCard()+
      liveWarImpactSummaryCard()+liveScoringPaceCard(6)+enemyScoreShareCard(10)+leaderboardCard(5)+
      card('Immediate priorities',alerts.length?alerts.map(x=>'<div class="ws-row"><span><b>'+
        esc(x.title)+'</b><br><small>'+esc(x.detail)+'</small></span>'+
        b('Review','alert:'+x.id)+'</div>').join(''):empty('No verified urgent alerts. Keep statuses fresh.'))+
      '<div class="ws-toolbar">'+b('Opponent intelligence','tab:enemy')+
      b('Reports and advanced tools','tab:reports')+b('Skull Capo','tab:leader')+'</div>';
    return body+'</details>';
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
    const rows=[...combatArchive.fights.values()].filter(a=>a.defender===positive(id)||a.attacker===positive(id))
      .sort((a,b)=>b.at-a.at).slice(0,20);
    if(!rows.length)return card('Recorded encounters',
      empty('No faction attack records for this player. If you have permission, enable Read faction attacks in Settings.'));
    return card('Recorded personal and faction encounters',
      '<p>Stored encounters from authorised feeds. FF values here are actual logged outcomes for the listed attacker, not predictions for other hitters.</p>'+
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
    if(!p&&combatArchive.people.has(id))p={id,name:combatArchive.people.get(id).name,status:'Unknown',position:'Archived member',lastAction:'Unknown'};
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
    let html=statusNote()+(scouterDistributionText(id)?card('Estimated stat distribution',esc(scouterDistributionText(id))):'')+b('FFScouter Premium details','scouter-player:'+id)+
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
    html+=playerArchiveCard(p)+playerActivityDetail(p)+encountersPanel(id);
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
  function activity(showBrief=true){
    // Avoid claiming individual player sleep schedules from sparse local observations.
    const ours=sideActivity('ours'),them=sideActivity('enemies'),o=hourlyEvidence('ours'),e=hourlyEvidence('enemies');
    const both=o.map((x,i)=>({hour:i,o:x,e:e[i],difference:x.pct===null||e[i].pct===null?null:x.pct-e[i].pct,
      enough:x.samples>=3&&e[i].samples>=3}));
    const summary=(state.data.enemies||[]).map(p=>({p,pat:pattern('enemies',p.id)}))
      .sort((a,b)=>b.pat.online-a.pat.online||b.pat.count-a.pat.count);
    const now=Date.now(),hours=enemyHours({faction:cfg.enemyId,ourFaction:cfg.ourId,owner:positive(state.data.meta.ownerId),
      players:state.data.enemies,observations:combatArchive.hours.values(),fights:combatArchive.fights.values(),
      legacy:state.data.activity,premium:scouterPremiumActive(),at:now});
    const selected=selectedEnemyFaction===cfg.enemyId&&selectedEnemyHour!==null?selectedEnemyHour:new Date(now).getUTCHours();
    let html=statusNote()+(showBrief?card('Enemy intelligence',enemyActivityBrief(now)):'')+
      '<div class="ws-grid">'+
      stat('Our active in 24h',ours.total?ours.active24+' / '+ours.total:'\u2014','Official last-action timestamps')+
      stat('Enemy active in 24h',them.total?them.active24+' / '+them.total:'\u2014','Official last-action timestamps')+
      stat('Our online now',rosterFresh('ours')?ours.online+' / '+ours.total:'Stale','Snapshot '+age(ours.last))+
      stat('Enemy online now',rosterFresh('enemies')?them.online+' / '+them.total:'Stale','Snapshot '+age(them.last))+
      stat('Enemies away',rosterFresh('enemies')?fmt(them.away):'Stale','Travelling / abroad in last snapshot')+
      stat('Enemies hospitalised',rosterFresh('enemies')?fmt(them.hospital):'Stale','Last observed state')+'</div>';
    const range=enemyActivityRange(hours);
    html+=card('Enemy activity by hour | TCT',
      (range?'<p>'+esc(range)+'</p>':'')+
      '<p>~ shows the average number seen by Premium. % shows enemy checks online. A dot means other enemy evidence. Tap an hour for names and attacks.</p>'+
      '<div class="ws-hour-grid">'+both.map(x=>{
        const h=hours[x.hour],metric=enemyScannerLabel(h)||(x.e.pct!==null?x.e.pct+'% online':h.attacks?h.attacks+' attacks':h.lastActions.length?h.lastActions.length+' acted':'?');
        const cell=h.scannerDates?'~'+fmt(Math.round(h.scannerTotal/h.scannerDates*10)/10):x.e.pct!==null?x.e.pct+'%':metric==='?'?'?':'\u2022';
        return '<button type="button" data-action="hour:'+x.hour+'" aria-label="'+esc(String(x.hour).padStart(2,'0')+':00 TCT / '+metric)+'" aria-pressed="'+(selected===x.hour)+'" class="ws-hour '+
          (!x.enough?'unknown':x.difference>0?'positive':x.difference<0?'negative':'')+'"><b>'+
          String(x.hour).padStart(2,'0')+'</b><small>'+esc(cell)+'</small></button>';
      }).join('')+'</div><div id="ws-enemy-hour-detail" aria-live="polite">'+enemyHourDetail(selected,hours[selected])+'</div>'+
      (scannerError?'<p>'+esc(scannerError)+'</p>':'')+
      '<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Hour TCT</th><th>Enemy evidence</th><th>Our checks</th><th>Online gap</th></tr></thead><tbody>'+
      both.map(x=>{const scan=enemyScannerLabel(hours[x.hour]);
        const enemy=[scan?'Premium: '+scan:'',x.e.pct!==null?x.e.pct+'% online / '+x.e.samples+' checks':'',
          hours[x.hour].attacks?hours[x.hour].attacks+' captured attacks':'',hours[x.hour].lastActions.length?hours[x.hour].lastActions.length+' last actions':''].filter(Boolean);
        return '<tr><td>'+String(x.hour).padStart(2,'0')+':00</td><td>'+esc(enemy.join(' | ')||'No observations')+'</td><td>'+
          (x.o.pct===null?'No observations':x.o.pct+'% / '+x.o.samples+' checks')+'</td><td>'+
          (x.enough?((x.difference>0?'+':'')+x.difference+' pp'):'-')+'</td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<p class="ws-small">Green or red compares our sampled online rate with theirs. Premium counts are scanner observations. A gap means coverage is missing.</p>'+
      b('Compare dates and forecasts','tab:heatmap'));
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
      '<label><input type="checkbox" id="ws-native-countries" '+(cfg.nativeWarCountryGroups!==false?'checked':'')+'> Group both factions by country (your location first, then alphabetical; Okay first)</label>'+
      '<label>Native ranked-war default sorting<select id="ws-native-sort">'+
      [['availability','Available first'],['hospital','Hospital first'],['bss','Highest BSS first'],['ff','Highest FF first'],['activity','Most recently active'],['torn','Leave Torn order unchanged']].map(([value,label])=>
        '<option value="'+value+'" '+((cfg.nativeWarSort||'availability')===value?'selected':'')+'>'+label+'</option>').join('')+
      '</select></label><p class="ws-small">Native controls appear inside Torn faction ranked-war lists, not on attack pages. If TWSE or FFScouter is sorting, WarStaxx will not override their order. Official read-only status polls every 20 seconds while the ranked-war page is visible; Torn API backoff is respected.</p>'+
      '<label>War bar visibility<select id="ws-strip-scope">'+
      [['contextual','Relevant faction and war-item controls'],
       ['faction','Faction / war pages'],
       ['everywhere','Legacy setting (now relevant pages only)']].map(([value,label])=>
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
      '<label><input type="checkbox" id="ws-ff-enable" '+(cfg.ffEnabled?'checked':'')+'> Show FF and BSE estimates. Roster estimates refresh hourly; new visible players are checked in batches at most once per minute and cached for one hour.</label>'+
      '<p class="ws-small">Premium intelligence includes supplied stat distributions and spy snapshots. Open Premium intelligence for on-demand flight checks, scanner activity, estimate history and target search. '+a('API guidance','https://ffscouter.com/api-docs/guidance')+' / '+a('Scanner data policy','https://ffscouter.com/volunteer')+'</p>'+b('Premium intelligence','tab:scouter')+
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
  const workspace={lane:'priorities',side:'enemies',query:'',filter:'all',country:'all',sort:'status'};
  const routeTrail=[];
  function rememberRoute(){
    const route={tab:state.tab,chosen:state.chosen,playerOpen:state.playerOpen,
      selectedWar:state.selectedWar,scroll:n($('.ws-content',root)?.scrollTop)};
    const last=routeTrail[routeTrail.length-1];
    if(last&&last.tab===route.tab&&last.chosen===route.chosen&&last.playerOpen===route.playerOpen){
      routeTrail[routeTrail.length-1]=route;
    }else routeTrail.push(route);
    if(routeTrail.length>30)routeTrail.shift();
  }
  function workspaceBack(){
    const prior=routeTrail.pop();
    if(!prior){navigate('overview');return;}
    Object.assign(state,{tab:prior.tab,chosen:prior.chosen,playerOpen:prior.playerOpen,selectedWar:prior.selectedWar});
    render();$('.ws-content',root).scrollTop=prior.scroll;
  }
  function workspaceTabs(items,current,prefix){
    return '<div class="ws-segments">'+items.map(([id,label])=>
      '<button type="button" data-action="'+esc(prefix+id)+'" aria-pressed="'+(id===current)+'">'+esc(label)+'</button>').join('')+'</div>';
  }
  function workspaceHeader(kicker,title,detail=''){
    return '<header class="ws-workspace-head"><small>'+esc(kicker)+'</small><h1>'+esc(title)+'</h1>'+
      (detail?'<p>'+esc(detail)+'</p>':'')+'</header>';
  }
  function preparingWar(at=Date.now()){
    const war=state.data.war,checked=n(state.data.updated.wars);
    if(!war?.id||!war.opponentId||positive(cfg.enemyId)!==positive(war.opponentId)||
      !checked||checked>at||at-checked>10*MIN)return false;
    return !/ended|complete|cancel/i.test(war.status||'')&&
      (n(war.start)*1000>at||/pending|upcoming|scheduled|prepar|waiting/i.test(war.status||''));
  }
  function prepStartLabel(war){
    return war.start?'Scheduled start '+stamp(war.start*1000):'Awaiting start time';
  }
  function nextWarStep(){
    const step=(title,reason,label,action,tone='calm')=>({title,reason,label,action,tone});
    if(!effectiveKey())return step('Connect WarStaxx', 'Add your Torn API key once so I can show you a useful next step.', 'Connect', 'tab:settings');
    if(!positive(cfg.ourId))return step('Find your faction', 'Your faction has not been identified yet.', 'Detect faction', 'detect-faction');
    if(preparingWar())return step('Scout '+state.data.war.opponentName,prepStartLabel(state.data.war)+'. Both faction rosters are available for preparation.','Open briefing','tab:brief');
    if(!activeWarNow())return step('Check for a war', 'No current war is confirmed. Check Torn before making a war decision.', 'Check now', 'refresh');
    if(!rosterFresh('ours')||!rosterFresh('enemies'))return step('Update before acting', 'The roster is too old to recommend a target or defensive action.', 'Update now', 'refresh','attention');
    const release=skullReleaseQueue().find(x=>x.minutes<=5&&!x.assigned.length);
    if(release)return step('Cover '+release.player.name,
      'This Black Skull target has no assigned hitter and its hospital timer ends in about '+release.minutes+'m. Confirm availability after expiry.',
      'Choose a hitter','tab:command','attention');
    const exposed=protectionPriorities().find(x=>x.exposed&&x.feedFresh&&x.impact.underFire);
    if(exposed)return step('Review protection for '+exposed.player.name,
      'They are exposed and taking repeated hits. Coordinate cover while keeping useful scorers active.',
      'Review defence','tab:turtle','attention');
    const mission=myMission();
    if(mission.target)return step('Review '+mission.target.player.name,
      mission.hasOrder?'Your saved target passes the current checks. Check the latest status and matchup before attacking.':
        'This is an eligible option found by your current matchup checks. Review the evidence before deciding to hit.',
      'Open target','player:'+mission.target.player.id,'ready');
    if(mission.self.energy!==null&&mission.self.energy<25)return step('Check your energy',
      'Your last known energy is below the 25 needed for an attack. Review readiness before choosing a hit.',
      'Review readiness','tab:command');
    if(mission.hasOrder)return step('Check your saved order',
      mission.issue||'Your assigned target is not currently verified as suitable.',
      'Review my order',mission.self.id?'hitter:'+mission.self.id:'tab:matchups','attention');
    return step('No verified hit right now',
      'There is not enough evidence for a suitable hit. You do not need to force one; update the information or inspect possible targets.',
      'Check again','refresh');
  }
  const queueLanes=[['coverage','Skull cover'],['watch','Watched & assigned'],['expiry','Hospital exits']];
  let queueLane='coverage';
  function warQueueRows(lane,players,heavy,watch,owners,at){
    const rows=[];
    for(const player of players){
      const kind=memberState(player),assigned=owners.get(player.id)||[];
      const release=kind==='hospital'&&player.until>at&&player.until<=at+30*MIN;
      if(lane==='expiry'&&!release)continue;
      if(lane==='watch'&&!watch.has(player.id))continue;
      if(lane==='coverage'&&(!heavy.has(player.id)||assigned.some(h=>cfg.blackSkulls[h.id])||!(kind==='okay'||release)))continue;
      rows.push({player,kind,release,assigned});
    }
    const order=row=>row.kind==='okay'?0:row.release?1:2;
    return rows.sort((a,b)=>order(a)-order(b)||(a.release&&b.release?a.player.until-b.player.until:0)||a.player.name.localeCompare(b.player.name)||a.player.id-b.player.id);
  }
  function liveQueueCard(){
    if(!activeWarNow())return '';
    if(!rosterFresh('ours')||!rosterFresh('enemies'))return card('War queues','<p>Refresh both rosters to check assignments and release times.</p>'+b('Refresh rosters','refresh'));
    const owners=new Map();
    for(const hitter of state.data.ours){
      const id=positive(cfg.assignments[hitter.id]);if(!id)continue;
      if(!owners.has(id))owners.set(id,[]);owners.get(id).push(hitter);
    }
    const at=Date.now(),heavy=enemyRoleBands().heavy,watched=watchedTargetIds();
    const queues=new Map(queueLanes.map(([lane])=>[lane,warQueueRows(lane,state.data.enemies,heavy,watched,owners,at)]));
    const rows=queues.get(queueLane);
    const line=row=>{
      const p=row.player,place=currentLocation(p),expiry=row.release?'Hospital ~'+Math.ceil((p.until-at)/MIN)+'m':p.status||'Unknown';
      const owner=row.assigned.length?'Assigned: '+row.assigned.map(h=>h.name).join(', '):'Unassigned';
      return '<div class="ws-note"><div class="ws-player-heading">'+infoButton(p.name,p.id)+'<strong>'+esc(expiry)+'</strong></div><small>'+esc(place.country+' / '+owner)+'</small></div>';
    };
    const descriptions={coverage:'Black Skull targets currently Okay or due out within 30 minutes without an assigned Black Skull.',watch:'Your watched opponents and current faction assignments.',expiry:'Enemy hospital timers ending in the next 30 minutes, earliest first.'};
    return card('War queues',workspaceTabs(queueLanes.map(([lane,name])=>[lane,name+' ('+queues.get(lane).length+')']),queueLane,'war-queue:')+
      '<p class="ws-small">'+descriptions[queueLane]+'</p>'+rows.slice(0,3).map(line).join('')+
      (rows.length>3?'<details data-ws-disclosure="queue-'+queueLane+'"><summary>Show '+(rows.length-3)+' more</summary>'+rows.slice(3).map(line).join('')+'</details>':'')+
      (!rows.length?'<p>No matching opponents in the latest roster.</p>':'')+
      (queueLane==='coverage'&&rows.length?b('Manage assignments','tab:command'):''));
  }
  function warWorkspace(){
    const live=activeWarNow(),next=(live&&sharedNextStep())||nextWarStep(),score=live?warScore():null;
    const situation=preparingWar()?'War preparation':score?(score.net>=0?'Leading by ':'Behind by ')+fmt(Math.abs(score.net))+' points':'No confirmed live score';
    return '<div class="ws-focus-home">'+
      (state.error?'<p class="ws-note ws-warn" role="alert">'+esc(state.error)+'</p>':'')+
      '<p class="ws-focus-context">'+esc(live?(state.data.war.opponentName||'Current war'):'WarStaxx')+'<span>'+esc(situation+(score?' / '+fmt(score.our)+' - '+fmt(score.enemy):''))+'</span></p>'+
      '<section class="ws-next-step '+next.tone+'"><div class="ws-step-marker" aria-hidden="true">'+
        (next.tone==='attention'?'!':next.tone==='ready'?'\u2197':'\u2022')+'</div><h1>'+esc(next.title)+'</h1>'+
      '<p>'+esc(next.reason)+'</p><button class="ws-primary-action" type="button" data-action="'+esc(next.action)+'" '+
      (state.loading?'disabled':'')+'>'+esc(state.loading?'Updating...':next.label)+' <span aria-hidden="true">\u2192</span></button></section>'+
      '<p class="ws-focus-freshness">'+(state.loading?'Checking Torn now...':live?'Roster checked '+esc(age(Math.min(n(state.data.updated.ours),n(state.data.updated.enemies)))):'Connect / refresh to check current conditions.')+'</p>'+
      '<details class="ws-focus-extra" data-ws-disclosure="war-evidence"><summary>Show the wider picture</summary>'+
      '<div class="ws-toolbar">'+b('Squad command','tab:squad')+b('War briefing','tab:brief')+b('My mission','workspace-mission')+b('All operations','tab:operations')+'</div>'+
      (live?liveQueueCard()+deskChangesCard()+warPlanningCard():b('Past wars','tab:history'))+'</details></div>';
  }
  function workspacePlayers(at=Date.now()){
    const side=workspace.side,fresh=rosterFresh(side,at),bands=enemyRoleBands(),q=workspace.query.trim().toLowerCase();
    const own=nativeWarOwnLocation();
    const localKnown=own.known&&rosterFresh('ours',at);
    const rows=state.data[side].map(player=>({player,location:currentLocation(player),kind:memberState(player),
      skull:side==='ours'?Boolean(cfg.blackSkulls[player.id]):bands.heavy.has(player.id),
      impact:side==='ours'?liveWarMemberImpact(player.id):liveEnemyWarImpact(player.id)}));
    const countries=[...new Set(rows.map(x=>x.location.country))].sort((a,b)=>a==='Unknown'?1:b==='Unknown'?-1:a.localeCompare(b));
    const selected=rows.filter(x=>{
      const p=x.player;
      if(q&&!String(p.name+' '+p.id+' '+(p.position||'')).toLowerCase().includes(q))return false;
      if(workspace.country!=='all'&&x.location.country!==workspace.country)return false;
      if(workspace.filter==='skulls'&&!x.skull)return false;
      if(workspace.filter==='watched'&&!cfg.watchlist[p.id])return false;
      if(workspace.filter==='here'&&(!fresh||!localKnown||x.location.country!==own.country||
        !['present','abroad'].includes(x.location.phase)))return false;
      if(workspace.filter==='releasing'&&(!fresh||x.kind!=='hospital'||!Number.isFinite(p.until)||p.until<=at||p.until>at+15*MIN))return false;
      if(['okay','hospital','away'].includes(workspace.filter)&&(!fresh||x.kind!==workspace.filter))return false;
      return true;
    });
    const countryOrder=(a,b)=>
      own.known&&(a===own.country||b===own.country)?(a===b?0:a===own.country?-1:1):
      a==='Unknown'?1:b==='Unknown'?-1:a.localeCompare(b);
    const rank={okay:0,hospital:1,away:2,jail:3,fallen:4,unknown:5};
    const strengthOrder=workspace.sort==='lowest'||workspace.sort==='highest';
    if(workspace.sort==='ffs')for(const row of selected){const source=ffscouter(row.player.id);row.personalFF=source&&!ffIsStale(source)&&Number.isFinite(source.ff)?source.ff:Infinity;}
    if(strengthOrder)for(const row of selected)row.total=nativeWarStrength(row.player).total;
    selected.sort((a,b)=>{
      const group=countryOrder(a.location.country,b.location.country);if(a.location.country!==b.location.country)return group;
      let order=0;
      if(strengthOrder){
        const aKnown=Number.isFinite(a.total),bKnown=Number.isFinite(b.total);
        order=Number(bKnown)-Number(aKnown);
        if(aKnown&&bKnown)order=(workspace.sort==='lowest'?1:-1)*(a.total-b.total);
      }else if(workspace.sort==='ffs')order=a.personalFF===b.personalFF?0:a.personalFF-b.personalFF;
      else if(workspace.sort==='name')order=a.player.name.localeCompare(b.player.name);
      else if(workspace.sort==='recent')order=n(b.player.lastAt)-n(a.player.lastAt);
      else if(workspace.sort==='points')order=(b.impact.given??b.impact.scored??-1)-(a.impact.given??a.impact.scored??-1);
      else if(workspace.sort==='net')order=(b.impact.net??-Infinity)-(a.impact.net??-Infinity);
      else if(workspace.sort==='hospital')order=(a.kind==='hospital'&&a.player.until>at?a.player.until:Infinity)-(b.kind==='hospital'&&b.player.until>at?b.player.until:Infinity);
      else order=(rank[a.kind]??5)-(rank[b.kind]??5);
      return (Number.isNaN(order)?0:order)||a.player.name.localeCompare(b.player.name)||a.player.id-b.player.id;
    });
    return {side,fresh,localKnown,rows:selected,total:rows.length,countries};
  }
  function workspacePlayerRow(row,side,fresh){
    const p=row.player,own=side==='ours',impact=row.impact,
      strength=nativeWarStrength(p),remaining=n(p.until)-Date.now(),
      timer=row.kind==='hospital'?(remaining>0?Math.ceil(remaining/MIN)+'m':'Refresh status'):'',
      tone=fresh&&row.kind==='hospital'&&remaining>0?(remaining<=5*MIN?'soon':remaining<=15*MIN?'near':''):'';
    const metric=(label,value)=>'<span><small>'+esc(label)+'</small><b>'+(value!==null&&value!==undefined&&!impact.complete?(label==='Net*'?'~':'\u2265'):'')+scoreLabel(value)+'</b></span>';
    return '<article class="ws-player-row"><div class="ws-player-heading">'+
      infoButton(p.name,p.id)+(row.skull?'<span class="ws-skull-mark" aria-label="Black Skull">\u2620</span>':'')+
      '<span class="ws-player-status '+tone+'">'+esc(fresh?p.status:'Cached: '+p.status)+(timer?' / '+timer:'')+'</span></div>'+
      '<p class="ws-player-glance">'+esc(own?'Given '+(!impact.complete&&impact.given!==null?'at least ':'')+scoreLabel(impact.given)+' captured points':strength.short)+(workspace.sort==='ffs'?' / FFS '+(Number.isFinite(row.personalFF)?row.personalFF.toFixed(2):'unknown'):'')+'</p>'+
      '<details data-ws-disclosure="roster-'+side+'-'+p.id+'"><summary>Details and actions</summary>'+
      (own?'':latestPersonalEncounter(p))+
      (scouterDistributionText(p.id)?'<p class="ws-small">'+esc(scouterDistributionText(p.id))+'</p>':'')+
      '<div class="ws-player-metrics">'+(own?metric('Earned',impact.earned)+metric('Given',impact.given)+metric('Net*',impact.net):
        metric('Scored',impact.scored)+metric('Hits',impact.hits)+'<span><small>STRENGTH</small><b>'+esc(strength.short)+'</b></span>')+'</div>'+
      '<div class="ws-player-foot"><span>'+esc(nativeWarLastSeen(p))+'</span><span>'+
      (impact.known?(impact.complete?'Captured feed':'Partial feed')+' / '+age(impact.lastFetch):'Awaiting attacks')+'</span>'+b('Intel','player:'+p.id)+'</div>'+
      '<p class="ws-small">'+esc(strength.detail)+
      '</p>'+(own?'':ffBadge(p.id))+'<div class="ws-toolbar">'+a('Profile',link(p.id))+b('Copy ID','copy-player:'+p.id)+
      (own?b('Matchups','hitter:'+p.id):b(cfg.watchlist[p.id]?'Unwatch':'Watch','watch:'+p.id))+'</div></details></article>';
  }
  function rosterWorkspace(){
    let data=workspacePlayers();
    if(workspace.country!=='all'&&!data.countries.includes(workspace.country)){workspace.country='all';data=workspacePlayers();}
    const own=data.side==='ours';
    const options=(id,items,current)=>'<select id="'+id+'" aria-label="'+id.replace('ws-roster-','')+'">'+
      items.map(([v,t])=>'<option value="'+esc(v)+'" '+(current===v?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select>';
    let h=statusNote()+workspaceHeader(preparingWar()?'WAR PREPARATION':'PLAYERS',preparingWar()?state.data.war.opponentName+' / '+prepStartLabel(state.data.war):'One roster. Both factions.', 'Tap a name for full intelligence. Countries stay grouped; the selected sort applies within each country.')+
      workspaceTabs([['enemies','Opponents'],['ours','Our faction']],data.side,'workspace-side:')+
      '<div class="ws-roster-controls"><input id="ws-roster-query" type="search" value="'+esc(workspace.query)+'" placeholder="Find name or ID" aria-label="Search roster">'+
      options('ws-roster-country',[['all','All countries'],...data.countries.map(x=>[x,x])],workspace.country)+
      options('ws-roster-sort',[['status','Okay first'],['hospital','Hospital expiry'],['name','Name A-Z'],['recent','Recent activity'],['lowest','Lowest total stats'],['highest','Highest total stats'],...(!own?[['ffs','Lowest personal FFS']]:[]),['points',own?'Most points given':'Most points scored'],...(own?[['net','Best net']]:[])],workspace.sort)+'</div>'+
      workspaceTabs([['all','All'],['okay','Okay'],['hospital','Hospital'],['away','Away'],['here','Here'],['releasing','Hospital within 15m'],['skulls','Skulls'],['watched','Watched']],workspace.filter,'workspace-filter:')+
      '<div class="ws-live-meta"><span>'+data.rows.length+' / '+data.total+' players | '+(data.fresh?'Roster '+esc(age(state.data.updated[data.side])):'STALE ROSTER')+'</span>'+b('Reset filters','workspace-reset')+'</div>'+
      '<p class="ws-small">Points are captured ranked-war attack respect, not official member scores. Partial values are minimums; net* is uncertain when either side is incomplete.</p>';
    let country=null;
    for(const row of data.rows){
      if(country!==row.location.country){if(country!==null)h+='</div>';country=row.location.country;
        h+='<h2 class="ws-country-title">'+esc(country)+'</h2><div class="ws-roster-grid">';}
      h+=workspacePlayerRow(row,data.side,data.fresh);
    }
    if(country!==null)h+='</div>';
    return h+(data.rows.length?'':empty(data.total?(!data.fresh?'Refresh the roster for live filters.':workspace.filter==='here'&&!data.localKnown?'Refresh your faction roster to verify your location.':'No players match. Reset filters to see the full roster.'):'No roster loaded. Refresh or check Settings.'));
  }
  function workspaceTile(title,detail,tab){
    return '<button type="button" class="ws-tool-tile" data-action="tab:'+esc(tab)+'"><strong>'+esc(title)+'</strong><span>'+esc(detail)+'</span></button>';
  }
  function archiveWorkspace(){
    const groups=[['Command',[
      ['Black Skull command','Primary hitters, backups, locks and claims','squad'],['War briefing','Roll call, opening plan and weekly rules','brief'],['Defensive travel','Safe routes and overseas opportunities','flights'],
      ['Squad command','Black Skulls, roles and coverage','leader'],['Orders','Assign hitters and review duties','command'],
      ['Defence','Protect exposed members','turtle'],['Operations','All current checks and warnings','operations'],
      ['Hospital control','Watcher assignments','control'],['My matchups','Compare hitter and target evidence','matchups']]],
      ['Performance',[
      ['Member comparison','Official results across recent wars','archive'],['After-action','Completed war review','afteraction'],
      ['Hit ledger','Captured attacks and outcomes','ledger'],['Score pace','Momentum and observed scoring','pace'],
      ['War history','Official reports and scorecards','history'],['Timelines','Observed war progress','timeline']]],
      ['Intelligence',[
      ['FFScouter Premium','Stat distribution, flights, activity and target search','scouter'],['Faction scouting','Opponent history and strength','scouting'],['Player dossiers','Detailed enemy analysis','targets'],
      ['Activity and forecasts','Compare both factions hour by hour','heatmap'],['Combat archive','Encounters, memberships and private backups','combat'],['Activity summaries','Sampled online and travel patterns','activity'],['Threats','Enemy impact and priorities','threats'],
      ['Strategy','Member-by-member planning','strategy'],['Full dashboard','All legacy metrics','dashboard']]],
      ['Setup',[
      ['Settings','Keys, FFScouter and shared orders','settings'],['Diagnostics','Data access and freshness','diagnostics'],
      ['Alerts','All current alerts','alerts'],['Black Skulls tools','Chain, bonuses and squad performance','skulls'],
      ['Quick commander','Compact member controls','commander'],['Saved assignments','Review stored orders','assignments']]]];
    return statusNote()+workspaceHeader('TOOLS & REPORTS','Everything has a place.', 'Choose a task. Your existing intelligence and controls are retained.')+
      '<div class="ws-toolbar">'+b('Find a player or tool','find')+b('Refresh reports','refresh')+'</div>'+
      groups.map(([name,items])=>'<details class="ws-tool-group" data-ws-disclosure="tools-'+name+'"><summary>'+name+' / '+items.length+' tools</summary><div class="ws-launch-grid">'+
        items.map(([title,detail,tab])=>workspaceTile(title,detail,tab)).join('')+'</div></details>').join('');
  }
  const disclosureViews=new Map();
  let previousDisclosureView=null;
  let previousBodyOverflow=null,previousModalFocus=null;
  function render(){
    if(!root.isConnected)return;
    root.style.display=state.open?'block':'none';
    renderWarStrip();
    if(!state.open){clearWarStaxxStickyTitles();return;}
    const simple=(()=>{try{return JSON.parse(localStorage.getItem('staxx-hub-mode-v1'))!=='advanced';}catch(_){return true;}})();
    // The permanent Torn strip is layer 0; the modal has exactly three primary screens.
    // All legacy deep links remain valid and are reachable from Reports / Opponent.
    const primary=['overview','enemy','reports'];
    const detailGroup=['intel','targets','matchups','timeline','activity','history','threats','scouting']
      .includes(state.tab)?'enemy':'reports';
    $('.ws-tabs',root).innerHTML=primary.map(tab=>
      '<button type="button" class="'+((state.tab===tab||
        !primary.includes(state.tab)&&tab===detailGroup)?'on':'')+
      '" data-tab="'+tab+'">'+esc(labels[tab])+'</button>').join('');
    const pages={scouter:scouterScreen,overview:warWorkspace,enemy:rosterWorkspace,reports:archiveWorkspace,dashboard:overview,scouting:enemyScreen,archive:reportsScreen,leader:leaderScreen,skulls:blackSkullsRoom,commander,operations,ledger,threats,control,turtle,command,pace,afteraction,intel,targets,matchups,timeline,strategy,activity:activityScreen,history,assignments:orders,alerts:alertView,settings,diagnostics,squad:squadScreen,brief:briefScreen,heatmap:activityScreen,flights:flightScreen,combat:archiveScreen};
    const content=$('.ws-content',root);
    const scroll=content.scrollTop;
    if(previousDisclosureView){
      disclosureViews.set(previousDisclosureView,Array.from(content.querySelectorAll('details')).map((x,i)=>({key:x.dataset.wsDisclosure||String(i),open:x.open})));
      if(disclosureViews.size>100)disclosureViews.delete(disclosureViews.keys().next().value);
    }
    const disclosureView=state.tab+':'+(state.playerOpen?positive(state.chosen):0);
    const trackerScroll=previousDisclosureView===disclosureView?content.querySelector('.ws-hour-scroll')?.scrollLeft:0;
    const active=document.activeElement;
    // Preserve keyboard focus when polling redraws the current view.
    const focusData=active&&content.contains(active)?{
      id:active.id||'',action:active.getAttribute('data-action')||'',
      field:['data-spy','data-ready-energy','data-ready-medical','data-leader-target',
        'data-leader-duty','data-skull-risk','data-control-target','data-turtle-duty']
        .map(name=>[name,active.getAttribute(name)]).find(([,value])=>value!==null),
      selection:typeof active.selectionStart==='number'?active.selectionStart:null
    }:null;
    const form=['settings','squad','brief','heatmap','flights'].includes(state.tab)?Array.from(content.querySelectorAll('input,select,textarea')).map(x=>({id:x.id,checked:x.checked,value:x.value,type:x.type})):null;
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
        '<div class="ws-toolbar">'+b((detailGroup==='enemy'?'All players':'All tools'),
          'tab:'+detailGroup)+' '+pill(labels[state.tab]||state.tab)+'</div>':'';
      content.innerHTML=(routeTrail.length?'<div class="ws-route-back">'+b('Back','workspace-back')+'</div>':'')+detail+(state.tab==='targets'&&state.playerOpen?
        playerIntel(state.chosen):(pages[state.tab]||overview)());
    }catch(e){content.innerHTML=empty('Render error: '+String(e.message||e));}
    const savedDisclosures=disclosureViews.get(disclosureView);
    if(savedDisclosures){const all=Array.from(content.querySelectorAll('details'));
      for(const [i,element] of all.entries()){
        const prior=savedDisclosures.find(x=>x.key===(element.dataset.wsDisclosure||String(i)));
        if(prior)element.open=prior.open;
      }
    }
    previousDisclosureView=disclosureView;
    if(form)for(const prior of form){if(!prior.id||prior.id==='ws-heavy-date')continue;const field=content.querySelector('#'+prior.id);
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
    if(trackerScroll&&content.querySelector('.ws-hour-scroll'))content.querySelector('.ws-hour-scroll').scrollLeft=trackerScroll;
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
    clearWarStaxxStickyTitles();
  }
  function navigate(tab,focus){
    if(!sections.includes(tab))tab='overview';
    if(state.open&&(state.tab!==tab||state.playerOpen))rememberRoute();
    state.tab=tab;state.open=true;state.playerOpen=false;state.selectedWar=0;
    root.style.display='block';render();
    if(['squad','brief'].includes(tab)&&Date.now()-commandSync.attempt>30000)syncCommand();
    if(['activity','heatmap'].includes(tab)){if(activityPrefs.mode==='heavy')openHeavyHistory();else loadFactionScanner();}
    if(tab==='flights')checkSupplies();
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
    if(action.startsWith('cmd-')){commandAction(action.slice(4));return;}
    if(action.startsWith('war-queue:')){const lane=action.slice(10);if(queueLanes.some(([id])=>lane===id)){queueLane=lane;render();}return;}
    if(action==='workspace-mission'){const id=positive(state.data.meta?.ownerId);if(id)handle('hitter:'+id);else navigate('matchups');return;}
    if(action==='workspace-back'){workspaceBack();return;}
    if(action.startsWith('workspace-lane:')){
      const value=action.slice(15);if(['priorities','mission','skulls','defence'].includes(value)){workspace.lane=value;render();}return;
    }
    if(action.startsWith('workspace-side:')){
      const value=action.slice(15);if(['ours','enemies'].includes(value)){workspace.side=value;workspace.country='all';if(value==='ours'&&workspace.sort==='ffs')workspace.sort='status';if(value==='enemies'&&workspace.sort==='net')workspace.sort='points';render();}return;
    }
    if(action.startsWith('workspace-filter:')){
      const value=action.slice(17);if(['all','okay','hospital','away','here','releasing','skulls','watched'].includes(value)){workspace.filter=value;render();}return;
    }
    if(action==='workspace-reset'){Object.assign(workspace,{query:'',filter:'all',country:'all',sort:'status'});render();return;}
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
    if(action.startsWith('hitter:')){const id=positive(action.slice(7));if(state.data.ours.some(p=>p.id===id)){navigate('matchups');state.chosen=id;render();}return;}
    if(action.startsWith('pace-war:')){state.selectedPace=positive(action.slice(9));navigate('pace');return;}
    if(action==='pace-live'){state.selectedPace=0;navigate('pace');return;}
    if(action==='timeline-latest'){state.selectedTimeline=0;navigate('timeline');return;}
    if(action.startsWith('timeline-war:')){state.selectedTimeline=positive(action.slice(13));navigate('timeline');return;}
    if(action.startsWith('toggle-heavy-target:')){
      const targetId=positive(action.slice('toggle-heavy-target:'.length)),
        changed=toggleManualHeavyTarget(targetId);
      if(!changed)state.error='Target not in the current opponent faction roster.';
      else confirmed((changed.added?'Pinned ':'Unpinned ')+changed.enemy.name+
        ' as a manual Black Skull target. Automatic classification still applies.');
      render();syncNativeWar();return;
    }
    if(action==='save-heavy-cutoff'){
      const mode=String($('#ws-heavy-mode',root)?.value||'relative'),
        percent=Number($('#ws-heavy-percent',root)?.value),
        minBss=Number($('#ws-heavy-bss',root)?.value);
      if(!['bse','relative','percent','min-bss'].includes(mode)||!Number.isInteger(percent)||
        percent<5||percent>100||!Number.isFinite(minBss)||minBss<0||minBss>1e15){
        state.error='Cutoff must use 5-100% or a non-negative BSS up to 1e15.';
        render();return;
      }
      cfg.commandMetric=mode==='bse'?'bse':'legacy';cfg.heavyPolicy=heavyRule({mode:mode==='bse'?'relative':mode,percent,minBss});saveCfg();markSharedDirty();
      confirmed('Black Skull target policy saved. Review automatic and manual targets.');
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
    if(action==='scouter-open'){openScouterPlayer($('#ws-scouter-id',root)?.value);return;}
    if(action.startsWith('scouter-player:')){openScouterPlayer(action.split(':')[1]);return;}
    if(action.startsWith('scouter:')){const [,kind,id]=action.split(':');void scouterRead(kind,Number(id));return;}
    if(action==='check-ff-key'){manualFFCheck(true);return;}
    if(action.startsWith('watch:')){const id=positive(action.slice(6));if(id){if(cfg.watchlist[id])delete cfg.watchlist[id];else cfg.watchlist[id]=true;saveCfg();render();}return;}
    if(action==='war-list'){state.selectedWar=0;navigate('history');return;}
    if(action==='deep-scan'){cfg.historyLimit=20;saveCfg();navigate('history');refresh(true);return;}
    if(action.startsWith('hour:')){
      const hour=Number(action.slice(5));
      if(!Number.isInteger(hour)||hour<0||hour>23)return;
      selectedEnemyHour=hour;selectedEnemyFaction=cfg.enemyId;render();
      const detail=$('#ws-enemy-hour-detail',root);if(detail)detail.scrollIntoView({block:'nearest'});
      return;
    }
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
    if(action.startsWith('player:')){rememberRoute();state.tab='targets';state.chosen=positive(action.slice(7));state.playerOpen=true;render();$('.ws-content',root).scrollTop=0;return;}
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
      cfg.scouterFlightAlerts=Boolean($('#ws-ff-flight-alerts',root)?.checked);
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
    if(e.target.id==='ws-heavy-date'){heavyView.date=Number(e.target.value);heavyView.selection='';render();return;}
    if(e.target.closest('.ws-tracker-controls')){commandAction('filters');return;}
    if(e.target.id==='ws-roster-country'){workspace.country=e.target.value;render();return;}
    if(e.target.id==='ws-roster-sort'){workspace.sort=e.target.value;render();return;}
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
    if(e.target.id==='ws-roster-query'){workspace.query=e.target.value;const pos=e.target.selectionStart;render();const input=$('#ws-roster-query',root);if(input){input.focus({preventScroll:true});try{input.setSelectionRange(pos,pos);}catch(_){}}return;}
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
    const nativeId=positive(row.getAttribute?.('data-player_id'));
    if(nativeId)return nativeId;
    const anchor=row.querySelector('a[href*="profiles.php"]');
    if(!anchor)return 0;
    try{return positive(new URL(anchor.href,location.href).searchParams.get('XID'));}catch(_){return 0;}
  }
  function nativeWarConflict(list){
    // Diagnostics: TWSE badges and timers may be present without owning the order.
    return list?.getAttribute('data-ffscouter-active-filter')==='true'||
      Boolean(list?.querySelector('.twse-copy-btn,[data-twse-overridden],[data-twse-last-action-timestamp]'));
  }
  function nativeWarActiveSortConflict(list){
    // Decoration (copy, last seen, hospital timer) is not an active sorter.
    // Explicit ownership calls for visual ordering that preserves the external DOM order.
    return list?.getAttribute?.('data-ffscouter-active-filter')==='true'||
      list?.getAttribute?.('data-twse-active-sort')==='true'||
      Boolean(list?.querySelector?.('[data-ffscouter-active-sort="true"],[data-twse-active-sort="true"]'));
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
    if(mode==='warpace'){
      const pace=liveScoringPace('enemy',p.id);
      return [pace===null?1:0,pace===null?0:-pace.rate,p.id];
    }
    if(mode==='warpoints'||mode==='warhits'){
      const impact=liveEnemyWarImpact(p.id),value=mode==='warhits'?impact.hits:impact.scored;
      return [value===null?1:0,value===null?0:-value,p.id];
    }
    if(mode==='tactical'){
      // Observed scorer activity and historical threat increase review priority,
      // never imply a favourable matchup or authorise an attack.
      const impact=liveEnemyWarImpact(p.id);
      const recent=positive(p.lastAt)>0&&at-p.lastAt<15*MIN;
      const danger=threatRating(p).score+
        (impact?.scored>0?20:0)+(recent?10:0);
      return [-danger,impact?.scored===null||impact?.scored===undefined?1:0,
        -(impact?.scored||0),p.id];
    }
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
    if(nativeWarActiveSortConflict(list)&&(cfg.nativeWarCountryGroups===false||mode==='torn')){
      clearCountryOrder(list);
      // In ungrouped mode, release the list to the external sorter.
      priorHeaders.forEach(h=>h.remove());
      return false;
    }
    const children=Array.from(list.children),all=children.filter(el=>!el.classList.contains('wsnw-country-heading')),
      rows=nativeWarRows(list);
    if(!rows.length||rows.some(r=>!r.classList.contains('enemy'))){
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
      if(grouping||!['torn','warpoints','warhits','warpace'].includes(mode)){
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
        if(nativeCountryRowHidden(row))continue;
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
        if(!nativeCountryRowHidden(row)&&country!==lastCountry&&counts.has(country)){
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
        if(!nativeCountryRowHidden(row))lastCountry=country;
      }
    }else expected.push(...sorted);
    for(const old of priorHeaders)if(!expected.includes(old))old.remove();
    if(grouping&&(nativeWarActiveSortConflict(list)||rows.length!==all.length)){
      applyCountryOrder(list,expected,rows);
      return true;
    }
    clearCountryOrder(list);
    if(rows.length!==all.length)return false;
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
  // Our faction follows the same country-first layout as the enemy roster.
  // The selected impact metric sorts within each country/availability group.
  function nativeWarSortFriendly(list,mode='given'){
    if(!list)return false;
    const priorHeaders=Array.from(list.querySelectorAll(':scope > li.wsnw-country-heading'));
    if(nativeWarActiveSortConflict(list)&&(cfg.nativeWarCountryGroups===false||mode==='torn')){
      clearCountryOrder(list);
      priorHeaders.forEach(h=>h.remove());
      return false;
    }
    const rows=nativeWarRows(list),
      all=Array.from(list.children).filter(el=>!el.classList.contains('wsnw-country-heading'));
    if(!rows.length||rows.some(r=>!r.classList.contains('your'))){
      priorHeaders.forEach(h=>h.remove());
      return false;
    }
    if(!nativeWarState.ourOriginal.has(list))
      nativeWarState.ourOriginal.set(list,new Map(rows.map((r,i)=>[nativeWarPlayerId(r),i])));
    const original=nativeWarState.ourOriginal.get(list),desc=cfg.nativeFriendlyDesc!==false,
      grouping=cfg.nativeWarCountryGroups!==false&&mode!=='torn',
      own=nativeWarOwnLocation(),players=new Map(state.data.ours.map(p=>[p.id,p]));
    const measure=impact=>{
      if(mode==='earned')return impact.earned;
      if(mode==='net')return impact.net;
      if(mode==='share')return impact.share;
      if(mode==='pace')return liveScoringPace('ours',impact.id)?.rate??null;
      if(mode==='hits')return impact.hits;
      return impact.given;
    };
    const keys=new Map(rows.map(row=>{
      const id=nativeWarPlayerId(row);return [id,liveWarMemberImpact(id)];
    }));
    const sorted=rows.slice().sort((a,b)=>{
      const idA=nativeWarPlayerId(a),idB=nativeWarPlayerId(b);
      if(mode==='torn')return (original.get(idA)??Infinity)-(original.get(idB)??Infinity);
      const pa=players.get(idA),pb=players.get(idB);
      if(grouping&&pa&&pb){
        const country=nativeWarCountryCompare(nativeWarLocation(pa).country,
          nativeWarLocation(pb).country,own);
        if(country)return country;
        const availability=nativeWarAvailabilityRank(pa)-nativeWarAvailabilityRank(pb);
        if(availability)return availability;
      }
      const x=measure(keys.get(idA)),y=measure(keys.get(idB));
      if(x===null&&y!==null)return 1;
      if(y===null&&x!==null)return -1;
      const diff=desc?(y??0)-(x??0):(x??0)-(y??0);
      return diff||(original.get(idA)??Infinity)-(original.get(idB)??Infinity);
    });
    const expected=[],headersByCountry=new Map(priorHeaders.map(h=>[h.dataset.wsnwCountry,h]));
    if(grouping){
      const counts=new Map();
      for(const row of sorted){
        if(nativeCountryRowHidden(row))continue;
        const player=players.get(nativeWarPlayerId(row));
        if(!player)continue;
        const info=nativeWarLocation(player),
          rec=counts.get(info.country)||{total:0,okay:0,flights:0};
        rec.total++;
        if(memberState(player)==='okay')rec.okay++;
        if(info.phase==='inbound')rec.flights++;
        counts.set(info.country,rec);
      }
      let lastCountry=null;
      for(const row of sorted){
        const player=players.get(nativeWarPlayerId(row)),
          country=player?nativeWarLocation(player).country:'Unknown';
        if(!nativeCountryRowHidden(row)&&country!==lastCountry&&counts.has(country)){
          let heading=headersByCountry.get(country);
          if(!heading){heading=el('li','wsnw-country-heading');heading.dataset.wsnwCountry=country;}
          const amount=counts.get(country),
            isHome=own.known&&own.phase!=='inbound'&&own.country===country,
            name=country+(isHome?' | YOU ARE HERE':''),
            summary=amount.total+' member'+(amount.total===1?'':'s')+
              ' | '+amount.okay+' ready'+(amount.flights?' | '+amount.flights+' inbound':''),
            headline=name+' | '+summary;
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
        if(!nativeCountryRowHidden(row))lastCountry=country;
      }
    }else expected.push(...sorted);
    for(const old of priorHeaders)if(!expected.includes(old))old.remove();
    if(grouping&&(nativeWarActiveSortConflict(list)||rows.length!==all.length)){
      applyCountryOrder(list,expected,rows);
      return true;
    }
    clearCountryOrder(list);
    if(rows.length!==all.length)return false;
    const existing=Array.from(list.children);
    if(existing.length!==expected.length||expected.some((row,i)=>row!==existing[i])){
      const frag=document.createDocumentFragment();
      for(const row of expected)frag.appendChild(row);
      list.appendChild(frag);
    }
    return true;
  }
  // Use visual ordering when an add-on filters the native list or inserts sibling rows.
  // Its own DOM order and player event handlers remain under its control.
  function nativeCountryRowHidden(row){
    return row.hidden||row.hasAttribute?.('data-ffscouter-hidden')||row.classList.contains('wsnw-filtered');
  }
  function applyCountryOrder(list,expected,rows){
    const members=new Set(rows),companions=new Map();
    let owner=null;
    for(const child of list.children){
      if(members.has(child)){owner=child;continue;}
      if(child.classList.contains('wsnw-country-heading'))continue;
      if(owner){
        if(!companions.has(owner))companions.set(owner,[]);
        companions.get(owner).push(child);
      }
    }
    list.classList.add('wsnw-country-order');
    let order=0;
    for(const item of expected){
      if(item.parentNode!==list)list.appendChild(item);
      for(const node of [item,...(companions.get(item)||[])]){
        const value=String(++order);
        if(node.style.getPropertyValue('--wsnw-order')!==value)node.style.setProperty('--wsnw-order',value);
      }
    }
  }
  function clearCountryOrder(list){
    if(!list.classList?.contains('wsnw-country-order'))return;
    list.classList.remove('wsnw-country-order');
    for(const node of list.children)node.style.removeProperty('--wsnw-order');
  }
    function nativeWarFilters(p,band,filter){
    if(filter==='okay')return rosterFresh('enemies')&&memberState(p)==='okay';
    if(filter==='hospital')return memberState(p)==='hospital';
    if(filter==='returning')return flightEvidence(p).kind==='returning';
    if(filter==='active5')return positive(p.lastAt)>0&&Date.now()-p.lastAt<5*MIN;
    if(filter==='active60')return positive(p.lastAt)>0&&Date.now()-p.lastAt<60*MIN;
    if(filter==='offline')return String(p.lastAction||'').toLowerCase()==='offline';
    if(filter==='heavy')return band.heavy.has(p.id);
    if(filter==='assigned')return Object.values(cfg.assignments).some(id=>positive(id)===p.id);
    if(filter==='watched')return Boolean(cfg.watchlist[p.id]);
    if(filter==='scorers')return (liveEnemyWarImpact(p.id)?.scored||0)>0;
    if(filter==='exit5')return memberState(p)==='hospital'&&
      positive(p.until)>Date.now()&&positive(p.until)-Date.now()<=5*MIN;
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
      return {short:'Spy '+nativeCompactTotal(total),total,source:estimate.source,
        detail:'Torn spy total '+fmt(total)+' | BSS '+fmt(bsScore(report))+
          ' | observed '+age(report.observedAt)+' ago'};
    }
    const f=ffscouter(p.id);
    if(f&&!ffIsStale(f)&&Number.isFinite(f.bsEstimate)&&f.bsEstimate>0){
      const when=positive(f.updatedAt)||positive(f.at);
      return {short:'FFS ~'+nativeCompactTotal(f.bsEstimate),total:f.bsEstimate,source:'FFScouter model',
        detail:'FFScouter modelled total '+fmt(f.bsEstimate)+
          ' | public BSS '+(Number.isFinite(f.bss)?fmt(f.bss):'unknown')+
          ' | updated '+age(when)+' | YATA uses another model'};
    }
    if(estimate.value!==null)return {short:'BSS '+(estimate.verified?'':'~')+fmt(estimate.value),
      source:estimate.source,detail:'Battle Stat Score, not total stats. '+estimate.source};
    return {short:'Stats unknown',source:'None',detail:'No usable current estimate'};
  }
  // Generic profile links cover bounties, abroad, searches, faction lists and forums.
  // BSE is a total-stat estimate. Never substitute the different BSS metric.
  const pageBseRows=new Map();let pageBseBusy=false,rosterFFBusy=false;
  function pagePlayerId(anchor){
    try{const u=new URL(anchor.getAttribute('href'),location.href);
      if(!/^(www\.)?torn\.com$/i.test(u.hostname)||u.protocol!=='https:'||u.pathname.toLowerCase()!=='/profiles.php')return 0;
      const value=Array.from(u.searchParams).find(([k])=>k.toLowerCase()==='xid')?.[1];
      return /^[1-9][0-9]{0,9}$/.test(value||'')?Number(value):0;
    }catch(_){return 0;}
  }
  function pagePlayerName(anchor){
    // Profile-action links are not names (e.g. the PDA mini-profile footer).
    const text=String(anchor.textContent||'').trim();
    return /^[A-Za-z0-9_-]{1,40}(?:\s*\[\d+\])?$/.test(text)&&
      !anchor.closest('.faction-war ul.members-list,[role="tooltip"],[role="menu"],.ws-page-bse,#warstaxx-root,#staxx-hub-root,#tch-root,#hhj-compact-panel,[contenteditable="true"]');
  }
  function pageLookupStatus(id){
    if(!cfg.ffEnabled||!cfg.ffConsent)return {mark:'off',detail:'Enable FFScouter in WarStaxx Settings to look up player estimates.'};
    if(!ffApiKey())return {mark:'!',detail:'No FFScouter key available. Check WarStaxx Settings.'};
    if(state.data.errors.ffscouter)return {mark:'!',detail:state.data.errors.ffscouter+' / Open WarStaxx Settings to verify the registered key. Failed lookups retry with backoff.'};
    if(!state.data.ffstats[id])return {mark:'...',detail:pageBseBusy?'Fetching player estimates...':'Waiting for a visible-player lookup. New IDs are checked in rate-limited batches.'};
    return {mark:'?',detail:'FFScouter has no usable estimate for this value. Unknown does not mean zero.'};
  }
  function pageBseValue(id){
    const x=ffscouter(id);
    if(x&&Number.isFinite(x.bsEstimate)&&x.bsEstimate>0)return {label:'BSE ~'+nativeCompactTotal(x.bsEstimate),
      detail:'Estimated total battle stats: '+fmt(x.bsEstimate)+' / FFScouter '+x.source+' / '+(ffIsStale(x)?'STALE / ':'')+'estimate updated '+age(x.updatedAt||x.at),stale:ffIsStale(x)};
    const status=pageLookupStatus(id);
    return {label:'BSE '+status.mark,detail:status.detail,stale:false};
  }
  function pageFfsValue(id){
    // Never use observed team FF as an API-key-owner matchup.
    const x=ffscouter(id),ff=x?.ff;
    if(!Number.isFinite(ff)||ff<1){const status=pageLookupStatus(id);return {label:'FFS '+status.mark,band:'unknown',detail:status.detail};}
    const stale=ffIsStale(x),band=stale?'stale':ff<=2?'easy':ff<=3.5?'moderate':ff<=4.5?'hard':'extreme';
    const names={easy:'Easier estimate',moderate:'Moderate estimate',hard:'Difficult estimate',extreme:'Very difficult estimate',stale:'Stale estimate - refresh before judging'};
    return {label:'FFS '+ff.toFixed(2)+(stale?'*':''),band,detail:names[band]+' / FFScouter calculated Fair Fight for the API-key owner. Not a win guarantee; equipment and bonuses matter. Values above 3 are uncapped estimates, not awarded Torn FF. Updated '+age(x.updatedAt||x.at)+'. Green <=2; cyan >2 to 3.5; orange >3.5 to 4.5; red >4.5.'};
  }
  function syncPageBse(fetchData=true){
    if(document.hidden)return;
    const attack=['/attack.php','/attack'].includes(location.pathname.toLowerCase())||(new URLSearchParams(location.search).get('sid')||'').toLowerCase().startsWith('attack');
    const links=attack?[]:Array.from(document.querySelectorAll('a[href*="profiles.php" i]')).filter(a=>
      pagePlayerName(a)&&a.getClientRects().length).slice(0,1000);
    const live=new Set(links),ids=new Set();
    for(const [a,row] of pageBseRows)if(!a.isConnected||!live.has(a)||pagePlayerId(a)!==row.id){row.wrap.remove();pageBseRows.delete(a);}
    if(!document.getElementById('ws-page-bse-style')){const css=document.createElement('style');css.id='ws-page-bse-style';
      css.textContent='.ws-page-bse{display:inline-block;position:static;vertical-align:middle;margin:2px 0 2px 4px;max-width:100%;font:11px/1.4 system-ui}.ws-page-bse>button{display:inline-flex;position:static;float:none;align-items:center;gap:0;width:auto;min-width:0;height:auto;min-height:24px;margin:0;border:1px solid #416584;border-radius:4px;padding:0;background:#122e47;color:#c6eaff;font:inherit;white-space:nowrap;cursor:pointer;touch-action:manipulation}.ws-page-bse .ws-page-ffs,.ws-page-bse .ws-page-total{display:inline-block;position:static;padding:3px 4px;white-space:nowrap}.ws-page-ffs{font-weight:700;border-right:1px solid #416584}.ws-page-ffs[data-band=easy]{background:#164e3a;color:#bdffdb}.ws-page-ffs[data-band=moderate]{background:#103e5a;color:#b8eeff}.ws-page-ffs[data-band=hard]{background:#64350e;color:#ffe0bc}.ws-page-ffs[data-band=extreme]{background:#681f32;color:#ffd5dc}.ws-page-ffs[data-band=unknown],.ws-page-ffs[data-band=stale]{background:#303b49;color:#e0e5ec}.ws-page-bse[data-stale=true] .ws-page-total{color:#cbd2db}.ws-page-bse small:not([hidden]){display:block;max-width:280px;white-space:normal;padding:7px;background:#10283f;color:#eaf6ff;line-height:1.5}.ws-page-bse small[hidden]{display:none}.ws-page-bse>button:focus-visible{outline:2px solid #a8e9ff;outline-offset:2px}';document.head.appendChild(css);}
    for(const a of links){const id=pagePlayerId(a);if(!id)continue;let row=pageBseRows.get(a);
      if(!row){const wrap=document.createElement('span');wrap.className='ws-page-bse';const button=document.createElement('button'),detail=document.createElement('small'),ffs=document.createElement('span'),total=document.createElement('span');
        ffs.className='ws-page-ffs';total.className='ws-page-total';button.append(ffs,total);
        button.type='button';button.setAttribute('aria-expanded','false');detail.hidden=true;
        button.onclick=e=>{e.preventDefault();e.stopPropagation();detail.hidden=!detail.hidden;button.setAttribute('aria-expanded',String(!detail.hidden));};
        wrap.append(button,detail);a.insertAdjacentElement('afterend',wrap);row={id,wrap,button,detail,ffs,total};pageBseRows.set(a,row);}
      const value=pageBseValue(id),fair=pageFfsValue(id);row.total.textContent=value.label;row.ffs.textContent=fair.label;row.ffs.dataset.band=fair.band;
      row.button.setAttribute('aria-label',fair.label+' / '+value.label+' for '+a.textContent.trim()+'. '+fair.band+'. Tap for details.');row.detail.textContent=fair.detail+' '+value.detail;
      const intelligence=ffscouter(id);
      if(scouterPremiumActive()&&intelligence?.distribution)row.detail.append(' Estimated distribution: '+Object.entries(intelligence.distribution.percentages).map(([k,v])=>k+' '+v+'%').join(' / ')+'.');
      if(scouterPremiumActive()){if(scouterFlightText(id))row.detail.append(' '+scouterFlightText(id));const more=document.createElement('button');more.type='button';more.textContent='Premium player details';more.onclick=e=>{e.preventDefault();e.stopPropagation();openScouterPlayer(id);};row.detail.append(more);}row.wrap.dataset.stale=String(value.stale);
      if(row.wrap.previousElementSibling!==a)a.insertAdjacentElement('afterend',row.wrap);
      const r=a.getBoundingClientRect();if(r.bottom>=-300&&r.top<window.innerHeight+600)ids.add(id);
    }
    syncBountyControls();
    if(fetchData)void refreshPageBse(Array.from(ids));
  }
  async function refreshPageBse(ids){
    if(document.hidden||pageBseBusy||rosterFFBusy||!cfg.ffEnabled||!cfg.ffConsent||!ffApiKey()||!canCall('ffscouter')||!canCall('fflists',MIN))return;
    const now=Date.now(),key=ffApiKey(),needed=[...new Set(ids)].filter(id=>Number.isSafeInteger(id)&&id>0).filter(id=>{const x=state.data.ffstats[id];return !x||now-n(x.at)>(x.bsEstimate>0&&Number.isFinite(x.ff)&&x.ff>=1?HOUR:30*MIN);}).slice(0,205);
    if(!needed.length)return;
    pageBseBusy=true;state.data.updated.fflists=now;if(pageBseRows.size)syncPageBse(false);
    try{await checkFFRegistration();if(document.hidden||!cfg.ffEnabled||!cfg.ffConsent||ffApiKey()!==key)return;
      const parsed=parseFFRows(await ffRequest('https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(key)+'&targets='+needed.join(',')),needed);
      if(!cfg.ffEnabled||!cfg.ffConsent||ffApiKey()!==key)return;
      Object.assign(state.data.ffstats,parsed);delete state.data.errors.ffscouter;delete state.data.backoff.ffscouter;
      const oldest=Object.keys(state.data.ffstats).sort((a,b)=>n(state.data.ffstats[b].at)-n(state.data.ffstats[a].at));
      for(const id of oldest.slice(5000))delete state.data.ffstats[id];
    }catch(e){const count=Math.min(6,n(state.data.backoff.ffscouter?.count)+1);
      state.data.backoff.ffscouter={count,until:Date.now()+Math.min(HOUR,2**count*MIN)};state.data.errors.ffscouter=String(e.message||e).slice(0,150);
    }finally{pageBseBusy=false;save();if(pageBseRows.size)syncPageBse(false);}
  }
  // Native bounty controls act only on the loaded main-list rows, never game actions.
  const bountyPrefsKey='warstaxx-bounty-view-v1';
  const bountyPrefs=(()=>{let saved={};try{saved=JSON.parse(localStorage.getItem(bountyPrefsKey)||'{}')||{};}catch(_){}
    return {max:Number.isFinite(saved.max)&&saved.max>=1&&saved.max<=1e6?saved.max:0,ascending:saved.ascending===true,
      hideUnavailable:saved.hideUnavailable!==false,hideTravelling:saved.hideTravelling!==false};})();
  const bountyLists=new Map();
  function isBountyMain(){
    if(location.pathname.toLowerCase()!=='/bounties.php')return false;
    const route=new URLSearchParams(String(location.hash||'').replace(/^#\/?!?/, '')).get('p');
    return !route||route==='main';
  }
  function bountyMoney(text){
    const match=String(text||'').replace(/\s/g,'').match(/^\$([\d,]+(?:\.\d+)?)([kmb])?$/i);
    if(!match)return null;const value=Number(match[1].replace(/,/g,''))*({k:1e3,m:1e6,b:1e9}[match[2]?.toLowerCase()]||1);
    return Number.isFinite(value)&&value>=0?value:null;
  }
  function bountyStatus(text){
    const value=String(text||'').replace(/^\s*Status\s*:\s*/i,'').trim();
    return {unavailable:/\b(hospital|jail|federal|fallen|unavailable|deceased)\b/i.test(value),
      travelling:/\b(travel(?:l)?ing|flying|returning|in transit)\b/i.test(value)};
  }
  function bountyFacts(row){
    const anchor=row.querySelector('.target a[href*="profiles.php" i]'),id=anchor?pagePlayerId(anchor):0;
    if(!id)return null;
    const amount=bountyMoney(row.querySelector('.reward')?.textContent),status=bountyStatus(row.querySelector('.status')?.textContent);
    const cached=ffscouter(id),ff=cached&&!ffIsStale(cached)&&Number.isFinite(cached.ff)&&cached.ff>=1?cached.ff:null;
    return {id,amount,ff,...status};
  }
  function bountyHidden(facts,prefs=bountyPrefs){return Boolean(facts&&(
    prefs.hideUnavailable&&facts.unavailable||prefs.hideTravelling&&facts.travelling||
    prefs.max>0&&facts.ff!==null&&facts.ff>prefs.max));}
  function orderBountyRows(list,ordered){
    const rows=Array.from(list.children).filter(row=>ordered.includes(row));
    if(rows.every((row,i)=>row===ordered[i]))return;
    // Move existing nodes into their original row slots; preserve native handlers and extra rows.
    const slots=rows.map(row=>{const slot=document.createComment('ws-bounty-slot');list.insertBefore(slot,row);return slot;});
    slots.forEach((slot,i)=>slot.replaceWith(ordered[i]));
  }
  function clearBountyControls(){
    document.getElementById('ws-bounty-controls')?.remove();
    for(const [list,original] of bountyLists){
      const rows=Array.from(list.children).filter(row=>original.has(row));
      for(const row of rows)row.classList.remove('ws-bounty-hidden');
      orderBountyRows(list,rows.sort((a,b)=>original.get(a)-original.get(b)));
    }
    bountyLists.clear();
  }
  function syncBountyControls(){
    const template=isBountyMain()?document.querySelector('.page-template-cont'):null;
    const lists=template?Array.from(template.querySelectorAll('.bounties-list')):[];
    if(!lists.length){clearBountyControls();return;}
    for(const [list] of bountyLists)if(!lists.includes(list)){for(const row of list.children)row.classList.remove('ws-bounty-hidden');bountyLists.delete(list);}
    if(!document.getElementById('ws-bounty-css')){const css=document.createElement('style');css.id='ws-bounty-css';css.textContent=
      '.bounties-list>li.ws-bounty-hidden{display:none!important}#ws-bounty-controls{position:static;clear:both;padding:9px;margin:8px 0;background:#10283d;color:#edf7ff;border:1px solid #385d76;border-radius:7px;font:12px/1.4 system-ui}#ws-bounty-controls .ws-bounty-buttons{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:6px}#ws-bounty-controls button{position:static;float:none;background:#173950;color:#e5f5ff;border:1px solid #4c718b;border-radius:5px;font:inherit;padding:6px 8px;min-height:32px;touch-action:manipulation}#ws-bounty-controls button[aria-pressed=true]{background:#125878;border-color:#6bdaff}#ws-bounty-controls input{width:64px;min-width:0;background:#102337;color:white;padding:5px;border:1px solid #527891;border-radius:4px;font:inherit}#ws-bounty-controls p{font-size:11px;line-height:1.4;margin:5px 0 0;color:#b5d0e1}';document.head.appendChild(css);}
    let bar=document.getElementById('ws-bounty-controls');
    if(!bar){bar=document.createElement('section');bar.id='ws-bounty-controls';bar.setAttribute('aria-label','WarStaxx bounty filters');
      bar.innerHTML='<div class="ws-bounty-buttons"><strong>Max FFS</strong>'+[0,2,3.5,4.5].map(value=>'<button type="button" data-max="'+value+'">'+(value?'Up to '+value:'Any')+'</button>').join('')+
        '<label>Custom <input type="number" min="1" max="1000000" step="0.01" inputmode="decimal" aria-label="Custom maximum FFS" placeholder="Any"></label></div>'+
        '<div class="ws-bounty-buttons"><button type="button" data-toggle="ascending"></button><button type="button" data-toggle="hideUnavailable"></button><button type="button" data-toggle="hideTravelling"></button><button type="button" data-reset>Reset</button></div><p role="status"></p>';
      const changed=()=>{try{localStorage.setItem(bountyPrefsKey,JSON.stringify(bountyPrefs));}catch(_){}syncBountyControls();syncPageBse();};
      bar.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||!bar.contains(button))return;e.preventDefault();e.stopPropagation();
        if(button.hasAttribute('data-max'))bountyPrefs.max=Number(button.dataset.max);
        else if(['ascending','hideUnavailable','hideTravelling'].includes(button.dataset.toggle))bountyPrefs[button.dataset.toggle]=!bountyPrefs[button.dataset.toggle];
        else if(button.hasAttribute('data-reset'))Object.assign(bountyPrefs,{max:0,ascending:false,hideUnavailable:true,hideTravelling:true});else return;
        changed();});
      bar.querySelector('input').addEventListener('change',e=>{const value=Number(e.target.value);if(e.target.value!==''&&(!Number.isFinite(value)||value<1||value>1e6)){e.target.setCustomValidity('Enter a maximum FFS of at least 1, or clear for Any.');e.target.reportValidity();return;}e.target.setCustomValidity('');bountyPrefs.max=value||0;changed();});
    }
    if(bar.parentElement!==template||template.firstElementChild!==bar)template.prepend(bar);
    for(const button of bar.querySelectorAll('[data-max]'))button.setAttribute('aria-pressed',String(Number(button.dataset.max)===bountyPrefs.max));
    const input=bar.querySelector('input');if(document.activeElement!==input){input.value=bountyPrefs.max?String(bountyPrefs.max):'';input.setCustomValidity('');}
    for(const [key,label] of [['ascending',bountyPrefs.ascending?'Payout: lowest first':'Payout: highest first'],['hideUnavailable','Hide unavailable'],['hideTravelling','Hide travelling']]){
      const button=bar.querySelector('[data-toggle="'+key+'"]');button.textContent=label;button.setAttribute('aria-pressed',String(bountyPrefs[key]));}
    let total=0,shown=0,unknown=0;
    for(const list of lists){
      const original=bountyLists.get(list)||new Map();bountyLists.set(list,original);
      for(const [row] of original)if(row.parentElement!==list){row.classList.remove('ws-bounty-hidden');original.delete(row);}
      let next=Math.max(-1,...original.values())+1;
      const entries=Array.from(list.children).map(row=>{const facts=bountyFacts(row);if(!facts)row.classList.remove('ws-bounty-hidden');return {row,facts};}).filter(x=>x.facts);
      for(const {row,facts} of entries){if(!original.has(row))original.set(row,next++);total++;
        const hide=bountyHidden(facts);row.classList.toggle('ws-bounty-hidden',hide);if(!hide){shown++;if(facts.ff===null)unknown++;}}
      const sorted=entries.slice().sort((a,b)=>a.facts.amount===null?(b.facts.amount===null?0:1):b.facts.amount===null?-1:
        (bountyPrefs.ascending?1:-1)*(a.facts.amount-b.facts.amount)).map(x=>x.row);
      orderBountyRows(list,sorted);
    }
    bar.querySelector('p').textContent=shown+' / '+total+' loaded bounties match. Payout sorts this page only.'+
      (unknown?' '+unknown+' have no current FFS and stay visible.':'')+' Filters use Torn status; expand a row to inspect before attacking.';
  }
  function syncNativeProfile(){
    let box=document.getElementById('warstaxx-profile-detail');
    const id=positive(new URLSearchParams(location.search).get('XID'));
    const side=state.data.enemies.some(p=>p.id===id)?'enemies':state.data.ours.some(p=>p.id===id)?'ours':null;
    if(location.pathname!=='/profiles.php'||!id||!side||cfg.nativeWarEnabled===false){box?.remove();return;}
    const anchor=Array.from(document.querySelectorAll('a[href]')).find(a=>{
      try{const u=new URL(a.href,location.origin);return u.origin===location.origin&&positive(u.searchParams.get('user2ID'))===id&&
        (u.pathname==='/attack.php'||u.searchParams.get('sid')==='attack');}catch(_){return false;}
    });
    if(!anchor){box?.remove();return;}
    const p=state.data[side].find(p=>p.id===id),strength=nativeWarStrength(p),fresh=rosterFresh(side);
    const place=currentLocation(p),now=Date.now();
    if(memberState(p)==='away'&&place.phase!=='abroad'&&scouterPremiumActive()&&!scouterExtra.busy&&
      now-Math.max(n(scouterExtra.flights[id]?.at),n(scouterExtra.attempts['flights:'+id]))>=2*MIN)
      scouterRead('flights',id);
    const timer=premiumTravelTimer(p,place,now);
    const travel=timer?flightRouteLine(scouterExtra.flights[id].current)+' / '+timer:place.country+' / '+p.status;
    const text=(fresh?'':'Cached roster / ')+travel+' / '+strength.short;
    const signature=JSON.stringify([id,text,strength.detail,side]);
    if(box?.dataset.signature===signature&&box.previousElementSibling===anchor)return;
    box?.remove();box=document.createElement('details');box.id='warstaxx-profile-detail';box.dataset.signature=signature;
    box.style.cssText='display:block;clear:both;margin:8px 0;padding:8px;border:1px solid #355d7a;border-radius:6px;background:#10283f;color:#eaf6ff;font:12px/1.5 system-ui';
    const summary=document.createElement('summary');summary.textContent='WarStaxx / '+text;
    const evidence=document.createElement('p');evidence.textContent=strength.detail+' / '+nativeWarLastSeen(p);
    const button=document.createElement('button');button.type='button';button.textContent='Open player intelligence';
    button.onclick=()=>{open({section:'targets'});state.chosen=id;state.playerOpen=true;render();};
    box.append(summary,evidence,button);anchor.insertAdjacentElement('afterend',box);
  }
  function nativeWarHospitalTier(until,at=Date.now()){
    const remaining=positive(until)-at;
    if(!positive(until)||remaining<=0)return '';
    return remaining<=5*MIN?'wsnw-soon':remaining<=15*MIN?'wsnw-warning':'';
  }
  function nativeWarPaintHospital(timer,tier){
    // Inline !important beats Torn's native theme and competing add-on styles.
    // Only touch the WarStaxx-owned status chip, never a Torn-owned status cell.
    const colors=tier==='wsnw-soon'?
      ['#c0ffe0','#155840','#48df9b']:
      tier==='wsnw-warning'?['#ffe1a1','#794615','#ffb44e']:null;
    const style=timer?.style;
    if(!style||typeof style.setProperty!=='function')return;
    for(const name of ['color','background-color','border-color','box-shadow']){
      if(!colors){style.removeProperty?.(name);continue;}
      const value=name==='color'?colors[0]:
        name==='background-color'?colors[1]:
        name==='border-color'?colors[2]:'inset 3px 0 '+colors[2];
      style.setProperty(name,value,'important');
    }
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
    // Readability pass: stronger column separation, legible values and larger
    // touch targets without changing Torn's player-name and attack controls.
    style.textContent +=
      '#wsnw-toolbar .wsnw-quick-sort{display:inline-flex;gap:3px;align-items:center;flex-wrap:wrap}'+
      '#wsnw-toolbar .wsnw-quick-sort button{font-weight:900;font-size:11px;min-height:34px;padding:5px 9px}'+
      '#wsnw-toolbar .wsnw-quick-sort button[aria-pressed="true"]{background:#17648b;color:#fff;border-color:#75d7ff;box-shadow:inset 0 -2px #75d7ff}'+
      '.faction-war .wsnw-legend.wsnw-our-legend .wsnw-sort-heading{font-size:11px!important;font-weight:900!important}'+
      '.faction-war .wsnw-legend.wsnw-our-legend .wsnw-sort-heading.wsnw-sort-active{background:#146b91!important;border-color:#82e4ff!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded){height:72px!important;min-height:72px!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{height:36px!important;min-height:36px!important;top:36px!important;padding:3px 4px!important;gap:3px!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip{font-size:13px!important;font-weight:900!important;height:29px!important;padding:5px 3px!important;letter-spacing:0!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="earned"]{color:#baf1ff!important;background:#16475e!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="given"]{color:#ffe0db!important;background:#61343e!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="net"]{border-width:2px!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="share"]{color:#e4edff!important;background:#273e61!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="hits"]{color:#fff1bf!important;background:#4a442d!important}'+
      '@media(max-width:480px){#wsnw-toolbar .wsnw-quick-sort{order:2;width:100%}#wsnw-toolbar .wsnw-quick-sort button{flex:1}'+
      '.faction-war .wsnw-legend.wsnw-our-legend .wsnw-sort-heading{font-size:10px!important}'+
      '.faction-war ul.members-list li.your.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip{font-size:12px!important}}';
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
    style.textContent+=
      '#wsnw-toolbar{display:flex!important;flex-direction:column!important;gap:5px!important;'+
        'padding:7px 9px!important;margin:5px 0!important}'+
      '#wsnw-toolbar .wsnw-topline{width:100%;display:flex;align-items:center;gap:7px;flex-wrap:wrap}'+
      '#wsnw-toolbar .wsnw-topline strong{font-size:12px;flex:0 1 auto}'+
      '#wsnw-toolbar .wsnw-topline [data-wsnw-chain]{font-size:10px;color:#a9d4e5;flex:1 1 auto}'+
      '#wsnw-toolbar .wsnw-topline button{min-height:29px!important;padding:4px 7px!important}'+
      '#wsnw-toolbar .wsnw-controls{display:grid;grid-template-columns:minmax(0,1fr) 28px '+
        'minmax(0,1.3fr) minmax(0,1fr);gap:5px;align-items:center;width:100%}'+
      '#wsnw-toolbar .wsnw-controls label{display:flex;align-items:center;gap:4px;min-width:0;'+
        'color:#a8d8ed;font-weight:900;font-size:10px}'+
      '#wsnw-toolbar .wsnw-controls select{width:100%;min-width:0;max-width:100%!important;'+
        'font-size:11px!important;height:32px!important}'+
      '#wsnw-toolbar .wsnw-controls button{height:32px!important;min-height:32px!important}'+
      '#wsnw-toolbar .wsnw-extra{display:flex;align-items:center;gap:5px;flex-wrap:wrap}'+
      '#wsnw-toolbar .wsnw-extra span{font-size:10px;color:#a8cadd;flex:1 1 100%}'+
      '@media(max-width:440px){#wsnw-toolbar .wsnw-controls{'+
        'grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr);gap:4px}'+
        '#wsnw-toolbar .wsnw-controls label:last-child{grid-column:1/-1}'+
        '#wsnw-toolbar .wsnw-controls label:last-child select{max-width:220px!important}}';
    // Both sides use equal-width data columns and a collapsible evidence panel.
    style.textContent+=
      '.faction-war .wsnw-legend:not(.wsnw-our-legend),'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{'+
        'grid-template-columns:26px minmax(0,1.33fr) minmax(0,.8fr) minmax(0,1.14fr) '+
          'minmax(0,.73fr) minmax(0,.74fr)!important;gap:3px!important}'+
      '.faction-war .wsnw-legend:not(.wsnw-our-legend){background:#122e43!important;'+
        'border-top:2px solid #48b6e3!important;padding:5px 5px!important;font-size:10px!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded){'+
        'height:64px!important;min-height:64px!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{'+
        'top:36px!important;height:28px!important;min-height:28px!important;'+
        'padding:2px 4px!important;align-items:center!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip{'+
        'height:23px!important;box-sizing:border-box!important;font-size:11px!important;'+
        'font-weight:800!important;padding:3px 2px!important;justify-content:center!important;'+
        'min-width:0!important;max-width:100%!important;overflow:hidden!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="status"]{'+
        'grid-column:2!important;grid-row:1!important;justify-content:flex-start!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="presence"]{'+
        'grid-column:3!important;grid-row:1!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="bss"]{'+
        'grid-column:4!important;grid-row:1!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="ff"]{'+
        'grid-column:5!important;grid-row:1!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="warpoints"]{'+
        'display:inline-flex!important;grid-column:6!important;grid-row:1!important;color:#ffdfbf!important;'+
        'background:#49372d!important;border-color:#856449!important;text-align:center!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="warpoints"].wsnw-unknown{'+
        'color:#a5c0d1!important;background:#223b4e!important;border-color:#38556a!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="status"].wsnw-ready{'+
        'color:#baffdf!important;background:#174c3d!important;border-color:#318467!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel [data-wsnw-chip="status"].wsnw-hospital{'+
        'color:#ffe0e0!important;background:#552b37!important;border-color:#925060!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enhanced:nth-child(even):not(.wsnw-expanded)>.wsnw-intel{'+
        'background:#17384e!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-expanded-detail{'+
        'display:block!important;flex:0 0 100%!important;width:100%!important;'+
        'margin-top:5px!important;padding:7px!important;box-sizing:border-box!important;'+
        'background:#0a2437!important;border:1px solid #325f7c!important;border-radius:7px!important;'+
        'white-space:normal!important;overflow:visible!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-detail-grid{'+
        'display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;'+
        'gap:5px!important;width:100%!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-detail-field{'+
        'display:flex!important;flex-direction:column!important;gap:3px!important;'+
        'padding:6px!important;background:#16394f!important;border:1px solid #31546d!important;'+
        'border-radius:5px!important;min-width:0!important;overflow-wrap:anywhere!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-detail-field small{'+
        'font:800 10px/1.2 system-ui,sans-serif!important;color:#aacedd!important;text-transform:uppercase!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-detail-field strong{'+
        'font:750 12px/1.4 system-ui,sans-serif!important;color:#f0faff!important;white-space:normal!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-detail-field.wsnw-detail-alert{'+
        'background:#56382e!important;border-color:#a47e4c!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-expanded-detail p{'+
        'font-size:10px!important;line-height:1.5!important;color:#a5c8d8!important;margin:7px 0 0!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-open-attack{'+
        'display:inline-flex!important;align-items:center!important;min-height:30px!important;'+
        'padding:6px 11px!important;background:#235a46!important;border:1px solid #63bb8a!important;'+
        'border-radius:5px!important;color:#e5fff0!important;font:850 11px system-ui,sans-serif!important;'+
        'text-decoration:none!important}'+
      '@media(max-width:430px){.faction-war .wsnw-legend:not(.wsnw-our-legend){'+
        'font-size:9px!important;gap:2px!important;padding:3px 3px!important}'+
        '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded)>.wsnw-intel{'+
          'gap:2px!important;padding:2px 3px!important}'+
        '.faction-war ul.members-list li.enemy.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip{'+
          'font-size:10px!important;padding:3px 1px!important}}';
    style.textContent+=
      '.faction-war .wsnw-faction-summary{display:flex!important;align-items:center!important;'+
        'gap:6px!important;justify-content:space-between!important;flex-wrap:wrap!important;'+
        'padding:5px 7px!important;margin:6px 0 2px!important;'+
        'background:#132e42!important;color:#effaff!important;'+
        'border:1px solid #365e79!important;border-radius:6px!important;'+
        'font:850 11px/1.25 system-ui,sans-serif!important}'+
      '.faction-war .wsnw-faction-summary .wsnw-summary-values{display:inline-flex!important;'+
        'gap:9px!important;align-items:center!important;font-variant-numeric:tabular-nums!important}'+
      '.faction-war .wsnw-faction-summary .wsnw-positive{color:#a1f4c9!important}'+
      '.faction-war .wsnw-faction-summary .wsnw-negative{color:#ffb7bd!important}'+
      '.faction-war .wsnw-faction-summary .wsnw-summary-filters{display:inline-flex!important;gap:4px!important}'+
      '.faction-war .wsnw-faction-summary button{min-height:32px!important;padding:5px 8px!important;'+
        'background:#244459!important;border:1px solid #49788f!important;'+
        'border-radius:5px!important;color:#d5ebf7!important;'+
        'font:900 11px/1.1 system-ui,sans-serif!important;touch-action:manipulation!important}'+
      '.faction-war .wsnw-faction-summary button[aria-pressed="true"]{'+
        'background:#165b82!important;border-color:#76d3f8!important;color:#fff!important}'+
      '#wsnw-toolbar [data-wsnw-action="quick-ready"][aria-pressed="true"]{'+
        'background:#206c50!important;border-color:#74d1a4!important;color:#fff!important}'+
      '.faction-war ul.members-list li.your.wsnw-net-up:not(.wsnw-expanded){'+
        'border-left:4px solid #46c992!important}'+
      '.faction-war ul.members-list li.your.wsnw-net-down:not(.wsnw-expanded){'+
        'border-left:4px solid #f07a84!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enemy-scorer:not(.wsnw-heavy-target){'+
        'border-left:4px solid #f1b15a!important}'+
      '.faction-war ul.members-list li.enemy.wsnw-enemy-scorer .wsnw-intel [data-wsnw-chip="warpoints"]{'+
        'background:#674222!important;border-color:#d9a155!important;color:#fff0c7!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-pin-heavy{'+
        'display:inline-flex!important;align-items:center!important;min-height:30px!important;'+
        'padding:6px 10px!important;border:1px solid #bd91fa!important;'+
        'background:#422a64!important;color:#f5eaff!important;border-radius:5px!important;'+
        'font:850 11px system-ui,sans-serif!important;touch-action:manipulation!important}'+
      '@media(max-width:470px){.faction-war .wsnw-faction-summary{gap:5px!important;padding:4px!important}'+
        '.faction-war .wsnw-faction-summary .wsnw-summary-values{gap:6px!important}'+
        '.faction-war .wsnw-faction-summary button{padding:4px 6px!important}}';
    style.textContent+=
      '#wsnw-toolbar .wsnw-radar{display:flex;align-items:center;gap:4px;flex-wrap:wrap;'+
        'width:100%;padding:4px 0 0;border-top:1px solid #345f77;font-variant-numeric:tabular-nums}'+
      '#wsnw-toolbar .wsnw-radar-label{font:900 10px system-ui;color:#83bdd8;letter-spacing:.4px}'+
      '#wsnw-toolbar .wsnw-radar button{min-height:28px;padding:4px 7px;font-weight:900;'+
        'border-color:#416984;background:#19384d}'+
      '#wsnw-toolbar .wsnw-radar button[aria-pressed="true"]{'+
        'background:#245c80;border-color:#8bdfff;color:white}'+
      '#wsnw-toolbar .wsnw-radar-source{margin-left:auto;color:#a4cadc;'+
        'font:750 10px system-ui;white-space:nowrap}'+
      '@media(max-width:450px){#wsnw-toolbar .wsnw-radar{gap:3px}'+
        '#wsnw-toolbar .wsnw-radar button{min-height:27px;padding:3px 5px;font-size:10px}'+
        '#wsnw-toolbar .wsnw-radar-source{flex-basis:100%;margin-left:0}}';
    // Late, high-specificity rules: compact grid styling must never erase
    // the orange/green hospital countdown colours (including friendly rows).
    style.textContent+=
      '.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip[data-wsnw-chip="status"].wsnw-warning,'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-intel .wsnw-chip[data-wsnw-chip="status"].wsnw-warning{'+
        'background:#794615!important;color:#ffe1a1!important;'+
        'border:1px solid #ffb44e!important;box-shadow:inset 3px 0 #ffb44e!important}'+
      '.faction-war ul.members-list li.wsnw-enhanced:not(.wsnw-expanded) .wsnw-intel .wsnw-chip[data-wsnw-chip="status"].wsnw-soon,'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-intel .wsnw-chip[data-wsnw-chip="status"].wsnw-soon{'+
        'background:#155840!important;color:#c0ffe0!important;'+
        'border:1px solid #48df9b!important;box-shadow:inset 3px 0 #48df9b!important}'+
      // If another Torn add-on owns the status timer, highlight its native cell
      // instead of showing a duplicate status chip.
      '.faction-war ul.members-list li.wsnw-hospital-warning > .status{'+
        'box-shadow:inset 0 -4px #ffb44e!important;outline:1px solid #b37a37!important}'+
      '.faction-war ul.members-list li.wsnw-hospital-soon > .status{'+
        'box-shadow:inset 0 -4px #48df9b!important;outline:1px solid #319a74!important}';
    style.textContent+=
      '.faction-war .wsnw-expanded-detail .wsnw-personal-fights{grid-column:1/-1!important}'+
      '.faction-war ul.members-list li.wsnw-expanded .wsnw-detail-field.wsnw-personal-fights strong{white-space:pre-line!important}'+
      '.faction-war ul.members-list.wsnw-country-order:not([hidden]){display:flex!important;flex-direction:column!important}'+
      '.faction-war ul.members-list.wsnw-country-order>*{order:var(--wsnw-order,0)!important}'+
      '.faction-war ul.members-list li.wsnw-enhanced.wsnw-flight-row:not(.wsnw-expanded){height:88px!important;min-height:88px!important}'+
      '.faction-war ul.members-list li.wsnw-flight-row>.wsnw-flight-line{position:absolute!important;bottom:0;left:0;right:0;padding:2px 6px;background:#102d40;color:#b1e6f1;font:600 11px/16px system-ui;text-align:left;touch-action:pan-y}';
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
    document.querySelectorAll('.faction-war .wsnw-legend,.faction-war .wsnw-faction-summary').forEach(el=>el.remove());
    document.getElementById('wsnw-chain-bubble')?.remove();
    document.querySelectorAll('.faction-war .wsnw-country-order').forEach(clearCountryOrder);
    for(const h of document.querySelectorAll('.faction-war ul.members-list li.wsnw-country-heading'))h.remove();
    for(const row of document.querySelectorAll('.faction-war ul.members-list li.wsnw-enhanced')){
      row.classList.remove('wsnw-enhanced','wsnw-recent','wsnw-hospital-soon','wsnw-hospital-warning','wsnw-filtered');
      row.classList.remove('wsnw-heavy-target','wsnw-newly-okay','wsnw-expanded','wsnw-under-fire','wsnw-has-skull',
        'wsnw-net-up','wsnw-net-down','wsnw-enemy-scorer');
      row.classList.remove('wsnw-flight-row');
      row.querySelectorAll('.wsnw-flight-line,.wsnw-intel,.wsnw-detail,.wsnw-badge,.wsnw-copy').forEach(el=>el.remove());
    }
  }
  let personalFights=null;
  function personalFightCache(){
    const owner=positive(state.data.meta.ownerId),key=effectiveKey();
    if(!personalFights||personalFights.owner!==owner||personalFights.key!==key)
      personalFights={owner,key,rows:[],checked:0,attempt:0,busy:false,error:''};
    return personalFights;
  }
  async function checkPersonalFights(){
    const cache=personalFightCache(),now=Date.now();
    if(!cache.owner||!cache.key||cache.busy||now-cache.attempt<5*MIN||document.hidden)return;
    cache.busy=true;cache.attempt=now;
    try{
      const body=await call('/user/attacksfull?sort=DESC&limit=1000','personalFights');
      if(cache!==personalFightCache())return;
      if(!Array.isArray(body?.attacks))throw Error('No personal attack records returned');
      cache.rows=attacks(body).filter(a=>a.attacker===cache.owner||a.defender===cache.owner);
      await keepFights(attacks(body,true).filter(a=>a.attacker===cache.owner||a.defender===cache.owner),'Torn personal').catch(archiveFailure);
      cache.count=body.attacks.length;cache.checked=Date.now();cache.error='';
    }catch(e){cache.error='Personal history unavailable. Check that your Torn key can read personal attacks.';}
    finally{cache.busy=false;if(cache===personalFightCache()&&nativeWarState.expandedId)syncNativeWar();}
  }
  function personalFightHistory(id){
    const cache=personalFightCache(),me=cache.owner,matches=new Map();
    if(!me)return 'Waiting for your Torn player ID.';
    for(const a of [...pairRows(me,id),...(state.data.attacks||[]),...cache.rows]){
      if((a.attacker===me&&a.defender===id)||(a.defender===me&&a.attacker===id))matches.set(a.id,a);
    }
    const rows=[...matches.values()].sort((a,b)=>b.at-a.at||b.id-a.id);
    const lines=rows.slice(0,3).map(a=>{
      const date=new Date(a.at).toISOString();
      return (a.attacker===me?'You attacked':'They attacked you')+' / '+(a.result||'Result unavailable')+' / '+
        date.slice(8,10)+'/'+date.slice(5,7)+'/'+date.slice(0,4)+' '+date.slice(11,19)+' TCT';
    });
    const coverage=cache.error||(cache.busy?'Checking personal attack history...':cache.checked?
      'Checked '+cache.count+' recent personal attack records (limit 1,000) and locally captured faction fights.':
      !cache.key?'Torn key needed for personal history.':'Personal history not checked yet.');
    const draws=rows.filter(a=>/^stalemate$/i.test(a.result)).length;
    const summary=rows.length?rows.length+' recorded encounter'+(rows.length===1?'':'s')+' / '+
      draws+' stalemate'+(draws===1?'':'s'):'No matching encounter in the records available.';
    return [summary,...lines,coverage].join('\n');
  }
  function nativeWarDetailHTML(p,enemy,kind,place,band,orders){
    const field=(label,value,accent='')=>
      '<span class="wsnw-detail-field '+esc(accent)+'"><small>'+esc(label)+
      '</small><strong>'+esc(value===null||value===undefined?'\u2014':value)+'</strong></span>';
    const last=nativeWarLastSeen(p),status=kind==='hospital'?
      'Hospital \u00b7 '+nativeWarHospitalShort(p.until):
      kind==='away'?(place.phase==='inbound'?'Flying to ':'In ')+place.country+
        (positive(place.eta)?' \u00b7 '+flightCountdown(place.eta):''):
      kind==='okay'?'Ready (last Torn roster)':String(p.status||'Unknown'),
      rosterAge=age(state.data.updated[enemy?'enemies':'ours']);
    let html=field('Torn status',status,kind==='hospital'?'wsnw-detail-alert':'')+
      field('Location',place.country+' \u00b7 '+place.source)+
      field('Last action',last+' \u00b7 '+String(p.lastAction||'Unknown'))+
      field('Roster observation',rosterAge);
    if(enemy){
      const power=nativeWarStrength(p),ff=ffLabel(p.id),
        incoming=cfg.autoConceded===false?null:liveEnemyWarImpact(p.id),
        points=incoming?.scored===null||incoming?.scored===undefined?'Unknown':
          (incoming.complete?'':'\u2265')+fmt(incoming.scored),
        hits=incoming?.hits===null||incoming?.hits===undefined?'Unknown':
          (incoming.complete?'':'\u2265')+fmt(incoming.hits),
        targetGroup=band.heavy.has(p.id)?'BLACK SKULL \u00b7 '+
          (band.reasons.get(p.id)?.join('; ')||'Manual target'):
          band.regular.has(p.id)?'Regular target bracket':'Needs strength classification',
        previous=lastKnownMemberScore('enemies',p.id);
      const room=commandRoom(),order=room?.plan.assignments[p.id],claim=room?.ops.claims[p.id];
      if(order)html+=field('Shared primary',playerName(order.primary)+(order.lock?' (locked)':'')+' / revision '+room.revision);
      if(claimLive(claim))html+=field('Reserved',playerName(claim.hitter)+' to '+stamp(claim.expires));
      html=field('Your fight history',personalFightHistory(p.id),'wsnw-personal-fights')+html;
      html+=field('Battle intelligence',power.detail)+
        field('FF / difficulty',ff.source==='estimate'?
          'Model '+ff.value+' \u00b7 strength estimate, not a win prediction':
          ff.source==='observed'?'Recorded team FF '+ff.value:
          'Not currently available')+
        field('Captured current-war points',points)+
        field('Recent scoring pace',(()=>{const pace=liveScoringPace('enemy',p.id);
          return pace?(pace.complete?'':'\u2265')+fmt(pace.rate)+' pts/h over '+
            fmt(pace.minutes)+'m':'Not enough current-war attack data';})())+
        field('Captured scored war hits',hits)+
        field('Last captured attack',incoming?.lastAt?age(incoming.lastAt)+' ago':'Not captured')+
        field('War capture',incoming?.source||'Not enabled')+
        field('Assigned / watched',orders.has(p.id)?'Assigned to '+orders.get(p.id):
          cfg.watchlist[p.id]?'Watchlisted':'No current local assignment')+
        field('Target role and evidence',targetGroup)+
        field('Strongest known regular',band.strongestRegular?
          band.strongestRegular.p.name+' \u00b7 '+fmt(band.strongestRegular.value)+
          ' '+band.metric+(band.missingRegular?' \u00b7 '+band.missingRegular+' regular stats unknown':''):
          'No reliable regular-member threshold')+
        field('Past recorded member score',previous===null||previous===undefined?'No completed scorecard':fmt(previous));
    }else{
      const impact=cfg.autoConceded===false?null:liveWarMemberImpact(p.id),
        shown=(v)=>v===null||v===undefined?'Unknown':(impact?.complete?'':'\u2265')+fmt(v),
        recent=impact?.known?impact.in30+' in 30m \u00b7 '+impact.in60+' in 60m':'Unknown',
        perHit=impact?.ownHits&&impact.earned!==null?
          fmt(impact.earned/impact.ownHits)+' / attack':'Not enough evidence';
      html+=field('Our attacking attempts',shown(impact?.ownHits))+
        field('Our current scoring pace',(()=>{const pace=liveScoringPace('ours',p.id);
          return pace?(pace.complete?'':'\u2265')+fmt(pace.rate)+' pts/h over '+
            fmt(pace.minutes)+'m':'Not enough current-war attack data';})())+
        field('Earned per observed attack',perHit)+
        field('Enemy attacks received',shown(impact?.attacks))+
        field('Enemy scoring hits received',shown(impact?.hits))+
        field('Recent incoming attacks',recent,impact?.underFire?'wsnw-detail-alert':'')+
        field('Enemy score share',impact?.share===null||impact?.share===undefined?
          'Unknown':shown(impact.share)+'%')+
        field('Role',cfg.blackSkulls[p.id]?'Black Skull \u00b7 heavy hitter':'Faction member')+
        field('Attack-history coverage',cfg.autoConceded===false?'Disabled in Settings':
          !impact?.known?'Awaiting API capture':impact.complete?'Current scan caught up':
          'Partial data \u00b7 counts are minimums'+(impact.error?' \u00b7 '+impact.error:''));
    }
    const flight=scouterPremiumActive()?scouterFlightText(p.id):'';
    if(flight)html+=field('Flight observation',flight);
    const distribution=scouterDistributionText(p.id);
    if(distribution)html+=field('FFScouter distribution',distribution);
    return '<div class="wsnw-expanded-detail" aria-label="Detailed player intelligence">'+
      '<div class="wsnw-detail-grid">'+html+'</div>'+
      '<p>WarStaxx uses cached Torn observations. Unknown is not zero; \u2265 is a captured minimum.'+
      (enemy?' Estimated stats and FF do not prove a win.':
        ' Net is an earned-minus-conceded estimate, not official personal war score.')+
      '</p></div>';
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
    const chosen=['given','net','earned','share','hits','pace','torn'].includes(cfg.nativeFriendlySort)?
      cfg.nativeFriendlySort:'given',desc=cfg.nativeFriendlyDesc!==false;
    const sortable=(key,label,help)=>{
      const active=chosen===key;
      return '<button type="button" data-wsnw-sort-field="'+key+'" '+
        'class="wsnw-sort-heading'+(active?' wsnw-sort-active':'')+'" '+
        'aria-label="Sort our members by '+esc(help)+
        (active?'; currently '+(desc?'highest first':'lowest first'):'')+'" '+
        'aria-pressed="'+(active?'true':'false')+'">'+label+
        (active?(desc?' \u2193':' \u2191'):' \u2195')+'</button>';
    };
    const enemyMetricLabel={points:'PTS',pace:'PTS/H',hits:'HITS'}[cfg.nativeEnemyMetric]||'PTS';
    const columns=ours?
      '<span aria-label="Skull marker, status timer and last seen">STATUS</span>'+
      sortable('earned','EARN','points our member earned attacking the other faction')+
      sortable('given','GIVEN','points the opponent earned attacking this member')+
      sortable('net','NET','observed earned minus given (net proxy)')+
      sortable('share','ENEMY %','observed proportion of the enemy faction score')+
      sortable('hits','HITS','enemy scoring hits received'):
      '<span>ROLE</span><span>STATUS / PLACE</span><span>SEEN</span><span>BSS</span><span>FF</span><span>'+enemyMetricLabel+'</span>';
    if(heading.innerHTML!==columns)heading.innerHTML=columns;
    heading.removeAttribute('title');
    // Compact faction-wide observed impact and an explicit Black Skulls-only
    // filter immediately above our native Torn member roster.
    if(ours){
      let bar=heading.previousElementSibling;
      if(!bar?.classList?.contains('wsnw-faction-summary')){
        bar=el('div','wsnw-faction-summary');heading.before(bar);
      }
      const snap=concessionSnapshot(),complete=Boolean(snap?.complete),
        known=Boolean(snap?.known),prefix=complete?'':'\u2265',
        earned=known?prefix+(nativeCompactTotal(snap.ourTotal)||'0'):'\u2014',
        conceded=known?prefix+(nativeCompactTotal(snap.total)||'0'):'\u2014',
        delta=known?snap.ourTotal-snap.total:null,
        net=delta===null?'\u2014':'~'+(delta>=0?'+':'\u2212')+
          (nativeCompactTotal(Math.abs(delta))||'0'),
        black=cfg.nativeFriendlyFilter==='black',
        count=state.data.ours.filter(p=>cfg.blackSkulls[p.id]).length;
      const html='<span class="wsnw-summary-values">'+
        '<b>E '+earned+'</b><b>G '+conceded+'</b><strong class="'+
        (delta===null?'':delta>=0?'wsnw-positive':'wsnw-negative')+
        '">NET '+net+'</strong></span>'+
        '<span class="wsnw-summary-filters">'+
        '<button type="button" data-wsnw-friendly-filter="all" aria-pressed="'+
          (!black?'true':'false')+'">All '+state.data.ours.length+'</button>'+
        '<button type="button" data-wsnw-friendly-filter="black" aria-pressed="'+
          (black?'true':'false')+'">\u2620 Skulls '+count+'</button></span>';
      if(bar.innerHTML!==html)bar.innerHTML=html;
      bar.setAttribute('aria-label','Captured faction earned and conceded attack points, '+
        (complete?'scan caught up':'partial scan')+'; net is an estimate');
    }
  }
  // Android/Torn PDA can leave WebView title tooltips stuck on screen.
  // Keep extended explanations in expanded rows and screen-reader aria labels,
  // never in native long-press title bubbles.
  function suppressWarStaxxTitles(scope){
    if(!scope||typeof scope.querySelectorAll!=='function')return;
    const nodes=[scope,...scope.querySelectorAll('[title]')];
    for(const node of nodes){
      if(!node.hasAttribute?.('title'))continue;
      const info=node.getAttribute('title');
      if(info&&!node.hasAttribute('aria-label'))node.setAttribute('aria-label',info);
      node.removeAttribute('title');
    }
  }
  function clearWarStaxxStickyTitles(){
    document.querySelectorAll('#warstaxx-root,#warstaxx-live-strip,#wsnw-toolbar,'+
      '.faction-war .wsnw-legend,.faction-war .wsnw-intel,#wsnw-chain-bubble')
      .forEach(suppressWarStaxxTitles);
  }
  // Deliberately compact live-war pulse. Every count is derived from a
  // fresh roster; partial attack scans are marked as observed minimums.
  function nativeWarTacticalPulse(bands=enemyRoleBands(),at=Date.now()){
    const fresh=rosterFresh('enemies',at),friendlyFresh=rosterFresh('ours',at),
      scan=cfg.autoConceded===false?null:concessionSnapshot();
    const enemies=fresh?state.data.enemies:[],
      ready=enemies.filter(p=>memberState(p)==='okay');
    const closeExit=enemies.filter(p=>memberState(p)==='hospital'&&
      positive(p.until)>at&&positive(p.until)-at<=5*MIN);
    const heavyReady=ready.filter(p=>bands.heavy.has(p.id)).length;
    const scorers=scan?.known?ready.filter(p=>
      n(scan.enemyAttackers?.[p.id]?.enemyScore)>0).length:null;
    const underFire=friendlyFresh&&scan?.known?
      state.data.ours.filter(p=>liveWarMemberImpact(p.id)?.underFire).length:null;
    return {fresh,friendlyFresh,ready:fresh?ready.length:null,
      heavyReady:fresh?heavyReady:null,closeExit:fresh?closeExit.length:null,
      scorers:fresh?scorers:null,underFire,
      scanState:cfg.autoConceded===false?'OFF':
        !scan?.known?'WAIT':scan.complete?'LIVE':'PARTIAL'};
  }
  function nativeWarPulseMarkup(p,filter){
    const count=(value,partial=false)=>value===null?'?':
      (partial?'\u2265':'')+String(value);
    const item=(action,label,active=false)=>
      '<button type="button" data-wsnw-action="'+action+'" aria-pressed="'+
      (active?'true':'false')+'">'+label+'</button>';
    return '<div class="wsnw-radar" aria-label="Live war tactical pulse">'+
      '<span class="wsnw-radar-label">PULSE</span>'+
      item('pulse-heavy','SKULL '+count(p.heavyReady),filter==='heavy')+
      item('pulse-hospital','H\u22645 '+count(p.closeExit),filter==='exit5')+
      item('pulse-scorers','SCORERS '+count(p.scorers,p.scanState==='PARTIAL'),filter==='scorers')+
      item('pulse-turtle','UNDER FIRE '+count(p.underFire,p.scanState==='PARTIAL'))+
      '<span class="wsnw-radar-source">'+
      (p.fresh?'Roster fresh':'ROSTER STALE')+' | Feed '+p.scanState+
      '</span></div>';
  }
  function nativeWarToolbar(box,conflict,score,chain,bands,preparation=false){
    let toolbar=document.getElementById('wsnw-toolbar');
    if(!toolbar){toolbar=document.createElement('div');toolbar.id='wsnw-toolbar';
      toolbar.setAttribute('aria-label','WarStaxx native ranked war controls');}
    if(toolbar.nextElementSibling!==box)box.before(toolbar);
    const mode=['availability','tactical','hospital','bss','ff','activity','warpoints','warhits','warpace','torn'].includes(cfg.nativeWarSort)?
      cfg.nativeWarSort:'availability';
    const filter=['all','okay','hospital','exit5','returning','heavy','assigned','watched','scorers','active5','active60','offline'].includes(cfg.nativeWarFilter)?
      cfg.nativeWarFilter:'all';
    const friendlySort=['given','net','earned','share','hits','pace','torn'].includes(cfg.nativeFriendlySort)?
      cfg.nativeFriendlySort:'given',friendlyDesc=cfg.nativeFriendlyDesc!==false;
    const metric=['points','pace','hits'].includes(cfg.nativeEnemyMetric)?
      cfg.nativeEnemyMetric:'points';
    const pulse=nativeWarTacticalPulse(bands),pulseHtml=nativeWarPulseMarkup(pulse,filter);
    const signature=[preparation,mode,filter,friendlySort,friendlyDesc,metric,conflict,nativeWarState.toolbarExpanded,
      cfg.nativeWarCountryGroups,cfg.nativeFriendlyFilter].join(':');
    const scoreText=preparation?'War preparation':score?'Us '+fmt(score.our)+' / Them '+fmt(score.enemy):'LIVE WAR',
      chainText=preparation?prepStartLabel(state.data.war):chain.fresh?'Chain '+fmt(chain.count)+' ('+chain.remaining+'s)':'Chain unknown';
    if(toolbar.dataset.signature===signature){
      const headline=toolbar.querySelector('[data-wsnw-score]'),
        clock=toolbar.querySelector('[data-wsnw-chain]');
      if(headline&&headline.textContent!=='WARSTAXX | '+scoreText)
        headline.textContent='WARSTAXX | '+scoreText;
      if(clock&&clock.textContent!==chainText)clock.textContent=chainText;
      const ready=toolbar.querySelector('[data-wsnw-action="quick-ready"]'),
        readyLabel='\u2713 Ready '+(rosterFresh('enemies')?
          state.data.enemies.filter(p=>memberState(p)==='okay').length:'?');
      if(ready&&ready.textContent!==readyLabel)ready.textContent=readyLabel;
      const radar=toolbar.querySelector('.wsnw-radar');
      if(radar){
        const holder=document.createElement('div');holder.innerHTML=pulseHtml;
        if(holder.firstElementChild&&radar.innerHTML!==holder.firstElementChild.innerHTML)
          radar.innerHTML=holder.firstElementChild.innerHTML;
      }
      return;
    }
    toolbar.dataset.signature=signature;
    // Two compact lines; sorting by a native friendly heading is also a direct tap.
    toolbar.innerHTML=
      '<div class="wsnw-topline"><strong data-wsnw-score>WARSTAXX | '+scoreText+'</strong>'+
      '<span data-wsnw-chain>'+chainText+'</span>'+
      '<button type="button" data-wsnw-action="quick-ready" '+
        'aria-pressed="'+(filter==='okay'?'true':'false')+'" '+
        'aria-label="Show only opponents currently Okay">\u2713 Ready '+
        (rosterFresh('enemies')?state.data.enemies.filter(p=>memberState(p)==='okay').length:'?')+
        '</button>'+
      '<button type="button" data-wsnw-action="war">War Room</button>'+
        '<button type="button" data-wsnw-action="countries" aria-pressed="'+
          (cfg.nativeWarCountryGroups!==false?'true':'false')+'">'+
          (cfg.nativeWarCountryGroups!==false?'Countries ON':'Countries OFF')+'</button>'+
      '<button type="button" data-wsnw-action="more" aria-expanded="'+
        (nativeWarState.toolbarExpanded?'true':'false')+'">'+
        (nativeWarState.toolbarExpanded?'Close filters':'Sort / filters')+'</button>'+
      (filter!=='all'||cfg.nativeFriendlyFilter!=='all'?'<button type="button" data-wsnw-action="reset-filters">'+esc(filter)+(cfg.nativeFriendlyFilter==='black'?' / Our skulls':'')+' / clear</button>':'')+'</div>'+
      '<div class="wsnw-controls"'+(nativeWarState.toolbarExpanded?'':' style="display:none"')+'>'+
      '<label>OUR <select data-wsnw-friendly-sort aria-label="Sort our faction">'+
      [['given','Given'],['net','Net'],['earned','Earned'],['share','Enemy %'],
        ['hits','Received hits'],['pace','Pts / hour'],['torn','Torn order']].map(x=>
        '<option value="'+x[0]+'" '+(friendlySort===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label>'+
      '<button type="button" data-wsnw-action="friendly-direction" '+
        'aria-label="Reverse our faction sorting: currently '+(friendlyDesc?'highest':'lowest')+
        ' first">'+(friendlyDesc?'\u2193':'\u2191')+'</button>'+
      '<label>ENEMY <select data-wsnw-sort aria-label="Sort opposing faction">'+
      [['availability','Availability'],['tactical','Tactical priority'],['hospital','Hospital expiry'],['bss','BSS highest'],
        ['ff','FF highest'],['activity','Recent activity'],['warpoints','War points'],
        ['warhits','War hits'],['warpace','Pts / hour'],['torn','Torn order']].map(x=>
        '<option value="'+x[0]+'" '+(mode===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label>'+
      '<label>METRIC <select data-wsnw-metric aria-label="Last enemy table column">'+
      [['points','War points'],['pace','Points per hour'],['hits','Scoring hits']].map(x=>
        '<option value="'+x[0]+'" '+(metric===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label>'+
      '<label>SHOW <select data-wsnw-filter aria-label="Filter opponents">'+
      [['all','All'],['okay','Okay'],['hospital','Hospital'],['exit5','Hospital <=5m'],
        ['returning','Returning'],['active5','Active 5m'],['active60','Active 1h'],
        ['offline','Offline'],['heavy','Heavy targets'],['scorers','War scorers'],['assigned','Assigned'],
        ['watched','Watched']].map(x=>
        '<option value="'+x[0]+'" '+(filter===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+
      '</select></label></div>'+(nativeWarState.toolbarExpanded?pulseHtml:'')+
      (nativeWarState.toolbarExpanded?'<div class="wsnw-extra">'+
        '<button type="button" data-wsnw-action="skulls">Black Skulls</button>'+
        '<button type="button" data-wsnw-action="turtle">Turtle</button>'+
        '<button type="button" data-wsnw-action="hit">HIT</button>'+
        '<span>Tap a stat heading to sort. Tap a player info row for details.</span></div>':'')+
      (conflict?'<div class="wsnw-note">External roster filter active.</div>':'');
    suppressWarStaxxTitles(toolbar);
  }

  function syncNativeWar(){
    const live=activeWarNow();
    if(!isNativeWarPage()||cfg.nativeWarEnabled===false||(!live&&!preparingWar())){
      if(document.getElementById('wsnw-toolbar'))clearNativeWar();return;
    }
    const box=document.querySelector('.faction-war');
    if(!box||!box.parentNode)return;
    const lists=Array.from(box.querySelectorAll('ul.members-list'));
    if(!lists.length)return;
    pollScouterFlights();
    nativeWarStyle();
    const enemyMap=new Map(state.data.enemies.map(p=>[p.id,p])),
      ourMap=new Map(state.data.ours.map(p=>[p.id,p])),
      band=enemyRoleBands(),fresh=rosterFresh('enemies'),score=warScore(),chain=chainStatus(),
      concessions=cfg.autoConceded===false?null:inboundWarImpact(state.data.war.id);
    const conflict=lists.some(nativeWarActiveSortConflict);
    nativeWarToolbar(box,conflict,score,chain,band,!live);
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
        row.classList.toggle('wsnw-filtered',enemy?
          !nativeWarFilters(p,band,cfg.nativeWarFilter||'all'):
          cfg.nativeFriendlyFilter==='black'&&!cfg.blackSkulls[id]);
        const now=Date.now(),recent=enemy&&fresh?nativeWarTransition(id,now):null;
        row.classList.toggle('wsnw-recent',Boolean(recent));
        row.classList.toggle('wsnw-newly-okay',Boolean(recent));
        const expanded=nativeWarState.expandedId===id;
        row.classList.toggle('wsnw-expanded',expanded);
        row.classList.toggle('wsnw-heavy-target',enemy&&band.heavy.has(id));
        row.classList.toggle('wsnw-has-skull',!enemy&&Boolean(cfg.blackSkulls[id]));
        const ownImpact=!enemy?liveWarMemberImpact(id):null,
          enemyImpact=enemy?liveEnemyWarImpact(id):null,
          enemyScoreValue=score?.enemy??0;
        row.classList.toggle('wsnw-net-up',!enemy&&ownImpact?.net!==null&&
          ownImpact?.net!==undefined&&ownImpact.net>0);
        row.classList.toggle('wsnw-net-down',!enemy&&ownImpact?.net!==null&&
          ownImpact?.net!==undefined&&ownImpact.net<0);
        row.classList.toggle('wsnw-enemy-scorer',enemy&&
          enemyImpact?.scored!==null&&enemyImpact?.scored!==undefined&&
          enemyScoreValue>0&&enemyImpact.scored>=enemyScoreValue*0.12);
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
        name.setAttribute('aria-label',p.name+' ['+id+']');
        name.removeAttribute('title');
        const chip=(key,value,variant='',title='')=>{
          let x=infoBar.querySelector('[data-wsnw-chip="'+key+'"]');
          if(value===null||value===undefined||value===''){x?.remove();return;}
          if(!x){x=el('span','wsnw-chip');x.dataset.wsnwChip=key;infoBar.appendChild(x);}
          const cls='wsnw-chip '+(key==='status'?'wsnw-status':key==='role'?'wsnw-role':'')+' '+variant;
          if(x.className!==cls)x.className=cls;
          if(x.textContent!==value)x.textContent=value;
          if(title&&x.getAttribute('aria-label')!==title)x.setAttribute('aria-label',title);
          x.removeAttribute('title');
          return x;
        };
        let message='';
        if(enemy&&!fresh)message='STALE';
        else if(kind==='hospital')message=expanded?'HOSP '+hospitalCountdown(p.until,now):nativeWarHospitalShort(p.until,now);
        else if(other&&kind!=='away')message=''; // Keep the external status for non-hospital states.
        else if(kind==='away'){
          const place=currentLocation(p);
          if(place.phase==='inbound')message='TO '+place.country+(place.eta?' '+flightCountdown(place.eta,now):'');
          else if(place.phase==='abroad')message='In '+place.country;
          else message=place.phase==='unknown-travel'?'FLIGHT | DEST HIDDEN':'LOCATION UNKNOWN';
        }else if(kind==='okay')message=enemy?'READY':nativeWarLastSeen(p,now); // Readable readiness without a tooltip.
        if(recent)message=recent.kind+' | '+(message||'OKAY');
        const place=currentLocation(p);
        const flightTimer=kind==='away'&&(!enemy||fresh)?premiumTravelTimer(p,place,now):'';
        if(flightTimer)message=flightTimer;
        let flightLine=row.querySelector('.wsnw-flight-line');
        row.classList.toggle('wsnw-flight-row',Boolean(flightTimer)&&!expanded);
        if(flightTimer&&!expanded){
          if(!flightLine){flightLine=el('div','wsnw-flight-line');row.appendChild(flightLine);}
          const label=flightRouteLine(scouterExtra.flights[id].current);
          if(flightLine.textContent!==label)flightLine.textContent=label;
        }else if(!expanded&&kind==='away'&&place.phase!=='abroad'&&(!enemy||fresh)&&!(place.eta>now)){
          if(!flightLine){flightLine=el('div','wsnw-flight-line');row.appendChild(flightLine);}
          row.classList.add('wsnw-flight-row');
          const label=scouterPremiumActive()?(scouterExtra.flights[id]?'FFScouter: no current landing estimate':'Awaiting FFScouter flight data'):'Flight ETA unavailable';
          if(flightLine.textContent!==label)flightLine.textContent=label;
        }else flightLine?.remove();
        const timer=chip('status',message,(kind==='hospital'&&(!enemy||fresh)?'wsnw-hospital ':'')+
          (enemy&&kind==='okay'&&fresh?'wsnw-ready ':'')+hospitalTier,'Torn roster observed '+age(state.data.updated[enemy?'enemies':'ours'])+
          ' | '+place.country+' ('+place.source+')');
        if(timer){
          nativeWarPaintHospital(timer,hospitalTier);
          if(kind==='hospital'&&(!enemy||fresh)&&positive(p.until))
            timer.dataset.wsnwExpiry=String(positive(p.until));
          else timer.removeAttribute('data-wsnw-expiry');
          if(!flightTimer&&kind==='away'&&place.phase==='inbound'&&positive(place.eta)){
            timer.dataset.wsnwEta=String(place.eta);
            timer.dataset.wsnwCountry=place.country;
          }else{timer.removeAttribute('data-wsnw-eta');timer.removeAttribute('data-wsnw-country');}
        }
        let role='';
        if(enemy)role=band.heavy.has(id)?'\u2620':
          expanded?(band.regular.has(id)?'REGULAR':'UNKNOWN'):'';
        else if(cfg.blackSkulls[id])role='\u2620';
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
          const warImpact=cfg.autoConceded===false?null:liveEnemyWarImpact(id);
          const enemyPoints=warImpact?.scored===null||warImpact?.scored===undefined?'\u2014':
            (warImpact.complete?'':'\u2265')+(nativeCompactTotal(warImpact.scored)||'0');
          const metric=expanded?'points':(['points','pace','hits'].includes(cfg.nativeEnemyMetric)?
            cfg.nativeEnemyMetric:'points'),
            pace=metric==='pace'?liveScoringPace('enemy',id):null,
            metricHits=warImpact?.hits===null||warImpact?.hits===undefined?'\u2014':
              (warImpact.complete?'':'\u2265')+fmt(warImpact.hits),
            metricPace=pace?(pace.complete?'':'\u2265')+fmt(pace.rate):'\u2014',
            metricText=metric==='pace'?'PH '+metricPace:
              metric==='hits'?'H '+metricHits:enemyPoints,
            metricLong=metric==='pace'?'Captured scoring pace in points per hour':
              metric==='hits'?'Captured scoring ranked-war attacks':
              'Captured enemy ranked-war attack points';
          chip('warpoints',expanded?'WAR POINTS '+enemyPoints:metricText,
            warImpact?.scored>0?'wsnw-war-points':'wsnw-unknown',
            metricLong+'. This is attack-feed evidence, not an official player score. '+
              (warImpact?.source||'War attack capture disabled'));
          chip('order',expanded?(orders.has(id)?'TO '+orders.get(id):cfg.watchlist[id]?'WATCH':''):
            orders.has(id)?'ORDER':cfg.watchlist[id]?'WATCH':'',
            '',orders.has(id)?'Local assigned hitter':'Watchlisted target');
        }else{
          for(const key of ['bss','ff','warpoints','order','conceded','received','impact'])chip(key,'');
          const impact=cfg.autoConceded===false?null:liveWarMemberImpact(id),
            captured=Boolean(impact?.known),complete=Boolean(impact?.complete),
            observed=value=>value===null||value===undefined?'\u2014':
              (complete?'':'\u2265')+(nativeCompactTotal(value)||'0'),
            earned=observed(impact?.earned??null),given=observed(impact?.given??null),
            net=impact?.net===null||impact?.net===undefined?'\u2014':
              (complete?'~':'')+(impact.net>=0?'+':'\u2212')+
                (nativeCompactTotal(Math.abs(impact.net))||'0'),
            share=impact?.share===null||impact?.share===undefined?'\u2014':
              (complete?'':'\u2265')+fmt(impact.share)+'%',
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
            impact?.net==null?'wsnw-unknown':impact.net<0?'wsnw-net-negative':'wsnw-net-positive',
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
            ' | EARN / HIT '+(impact?.ownHits&&impact.earned!==null?fmt(impact.earned/impact.ownHits):'\u2014'):'',
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
        // Expand once for the secondary facts; keep compact rows free of prose.
        let expandedInfo=infoBar.querySelector('.wsnw-expanded-detail');
        if(expanded){
          if(enemy)checkPersonalFights();
          if(!expandedInfo){expandedInfo=el('div','wsnw-expanded-detail');infoBar.appendChild(expandedInfo);}
          const detailHtml=nativeWarDetailHTML(p,enemy,kind,place,band,orders);
          // Preserve this container and the row's scroll position during 40s refreshes.
          const wrapper=document.createElement('div');wrapper.innerHTML=detailHtml;
          const generated=wrapper.firstElementChild;
          if(generated&&expandedInfo.innerHTML!==generated.innerHTML)
            expandedInfo.innerHTML=generated.innerHTML;
        }else expandedInfo?.remove();
        let pinTarget=infoBar.querySelector('.wsnw-pin-heavy');
        if(enemy&&expanded){
          if(!pinTarget){pinTarget=el('button','wsnw-pin-heavy');pinTarget.type='button';
            infoBar.appendChild(pinTarget);}
          pinTarget.dataset.wsnwHeavy=String(id);
          const pinned=band.manual.has(id);
          const nextLabel=pinned?'Unpin manual Black Skull target':'Pin extra Black Skull target';
          if(pinTarget.textContent!==nextLabel)pinTarget.textContent=nextLabel;
          pinTarget.setAttribute('aria-label',nextLabel+' for '+p.name);
        }else pinTarget?.remove();
        let manualAttack=infoBar.querySelector('.wsnw-open-attack');
        if(live&&enemy&&expanded&&fresh&&kind==='okay'){
          if(!manualAttack){manualAttack=el('a','wsnw-open-attack','Attack manually');
            infoBar.appendChild(manualAttack);}
          manualAttack.href=attackLink(id);manualAttack.setAttribute('aria-label',
            'Open manual attack page for '+p.name);
        }else manualAttack?.remove();
        // The intelligence bar is absolutely positioned above the Torn row;
        // its wrapped height must be reflected on the parent or the next row overlaps it.
        if(expanded){
          const rowHeight=Math.max(90,36+Math.ceil(Number(infoBar.scrollHeight)||0)+5);
          row.style?.setProperty?.('--wsnw-expanded-height',rowHeight+'px');
        }else row.style?.removeProperty?.('--wsnw-expanded-height');
      }
      if(rows.some(row=>row.classList.contains('enemy'))){
        nativeWarSort(list,enemyMap,cfg.nativeWarSort||'availability');
      }else if(rows.some(row=>row.classList.contains('your'))){
        nativeWarSortFriendly(list,cfg.nativeFriendlySort||'given');
      }
    }
    clearWarStaxxStickyTitles();
  }
  if(typeof window!=='undefined'&&typeof window.addEventListener==='function')
    window.addEventListener('resize',()=>{
      if(nativeWarState.expandedId&&isNativeWarPage())syncNativeWar();
    },{passive:true});
  async function pollNativeWar(){
    if(!isNativeWarPage()||document.hidden||cfg.nativeWarEnabled===false||
      !effectiveKey()||!positive(cfg.enemyId)||(!activeWarNow()&&!preparingWar())||
      state.loading||nativeWarState.pollBusy)return;
    nativeWarState.pollBusy=true;
    const deskBefore=captureDeskSnapshot();
    try{
      const prior=state.data.enemies.slice(),oldAt=n(state.data.updated.enemies);
      // Only the existing official Torn faction-members endpoint; never scrape opponent pages.
      const fresh=await call('/faction/'+cfg.enemyId+'/members','enemies',20000);
      if(fresh){
        const next=roster(fresh,prior);
        if(activeWarNow()&&oldAt&&Date.now()-oldAt<5*MIN)
          observeNativeWarTransitions(prior,next,positive(state.data.war?.id));
        state.data.enemies=next;
        if(activeWarNow()&&oldAt&&Date.now()-oldAt<5*MIN)
          recordAvailability(prior,next,positive(state.data.war?.id));
        save();publish();if(state.open)render();syncNativeWar();
      }
      // Keep the API-key owner's real location current without adding a new endpoint.
      if(positive(cfg.ourId)&&canCall('ours',60000)){
        try{
          const ours=await call('/faction/'+cfg.ourId+'/members','ours',60000);
          if(ours){state.data.ours=roster(ours,state.data.ours);save();}
        }catch(_){}
      }
      if(!activeWarNow()){syncNativeWar();return;}
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
    }finally{recordDeskChanges(deskBefore);nativeWarState.pollBusy=false;if(state.open)render();}
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
      const recent=nativeWarTransition(id,now),kind=memberState(p),place=currentLocation(p);
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
      nativeWarPaintHospital(span,tier);
      row.classList.toggle('wsnw-hospital-soon',tier==='wsnw-soon');
      row.classList.toggle('wsnw-hospital-warning',tier==='wsnw-warning');
    }
    for(const span of document.querySelectorAll('.faction-war .wsnw-intel [data-wsnw-last-at]')){
      const next=nativeWarLastSeen({lastAt:Number(span.dataset.wsnwLastAt),lastAction:span.dataset.wsnwAction},now);
      if(span.textContent!==next)span.textContent=next;
    }
  }
  // Remove any newly injected WarStaxx titles before a touch can show a sticky
  // native WebView tooltip. Never touch Torn-owned elements.
  document.addEventListener('pointerdown',e=>{
    const scope=e.target?.closest?.('#warstaxx-root,#warstaxx-live-strip,'+
      '#wsnw-toolbar,.faction-war .wsnw-legend,.faction-war .wsnw-intel,#wsnw-chain-bubble');
    if(scope)suppressWarStaxxTitles(scope);
  },{capture:true,passive:true});
  document.addEventListener('click',e=>{
    const manualPin=e.target?.closest?.('.faction-war [data-wsnw-heavy]');
    if(manualPin&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      const changed=toggleManualHeavyTarget(manualPin.dataset.wsnwHeavy);
      if(changed){syncNativeWar();if(state.open)render();}
      return;
    }
    const manual=e.target?.closest?.('.faction-war .wsnw-open-attack');
    if(manual&&isNativeWarPage()){e.stopPropagation();return;}
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
    const ourFilter=e.target?.closest?.('.faction-war [data-wsnw-friendly-filter]');
    if(ourFilter&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      cfg.nativeFriendlyFilter=ourFilter.dataset.wsnwFriendlyFilter==='black'?'black':'all';
      saveCfg();syncNativeWar();return;
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
    const quick=e.target?.closest?.('#wsnw-toolbar [data-wsnw-quick-sort]');
    if(quick&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      const mode=String(quick.dataset.wsnwQuickSort||'');
      if(['net','given','earned'].includes(mode)){
        if(cfg.nativeFriendlySort===mode)cfg.nativeFriendlyDesc=cfg.nativeFriendlyDesc===false;
        else {cfg.nativeFriendlySort=mode;cfg.nativeFriendlyDesc=true;}
        saveCfg();syncNativeWar();
      }
      return;
    }
    const button=e.target?.closest?.('#wsnw-toolbar [data-wsnw-action]');
    if(button&&isNativeWarPage()){
      e.preventDefault();e.stopPropagation();
      if(button.dataset.wsnwAction==='reset-filters'){cfg.nativeWarFilter='all';cfg.nativeFriendlyFilter='all';saveCfg();syncNativeWar();return;}
      if(button.dataset.wsnwAction==='countries'){
        cfg.nativeWarCountryGroups=cfg.nativeWarCountryGroups===false;
        if(cfg.nativeWarCountryGroups){
          // Torn order intentionally disables grouping. Restore useful defaults.
          if(cfg.nativeWarSort==='torn')cfg.nativeWarSort='availability';
          if(cfg.nativeFriendlySort==='torn')cfg.nativeFriendlySort='given';
        }
        saveCfg();syncNativeWar();return;
      }
      if(button.dataset.wsnwAction==='friendly-direction'){
        cfg.nativeFriendlyDesc=cfg.nativeFriendlyDesc===false;
        saveCfg();syncNativeWar();return;
      }
      if(button.dataset.wsnwAction.startsWith('pulse-')){
        const name=button.dataset.wsnwAction.slice(6);
        if(name==='turtle'){warQuick('turtle');return;}
        const next={heavy:'heavy',hospital:'exit5',scorers:'scorers'}[name];
        if(next){
          cfg.nativeWarFilter=cfg.nativeWarFilter===next?'all':next;
          saveCfg();syncNativeWar();
        }
        return;
      }
      if(button.dataset.wsnwAction==='quick-ready'){
        cfg.nativeWarFilter=cfg.nativeWarFilter==='okay'?'all':'okay';
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
    if(!header||cfg.nativeWarCountryGroups!==false||(cfg.nativeWarSort==='torn'&&cfg.nativeFriendlySort==='torn'))return;
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
      metric=e.target?.closest?.('#wsnw-toolbar [data-wsnw-metric]'),
      friendlySort=e.target?.closest?.('#wsnw-toolbar [data-wsnw-friendly-sort]'),
      filter=e.target?.closest?.('#wsnw-toolbar [data-wsnw-filter]');
    if(sort){cfg.nativeWarSort=String(sort.value);if(sort.value==='torn')cfg.nativeWarCountryGroups=false;saveCfg();syncNativeWar();}
    if(metric&&['points','pace','hits'].includes(metric.value)){
      cfg.nativeEnemyMetric=String(metric.value);saveCfg();syncNativeWar();
    }
    if(friendlySort){cfg.nativeFriendlySort=String(friendlySort.value);if(friendlySort.value==='torn')cfg.nativeWarCountryGroups=false;cfg.nativeFriendlyDesc=true;saveCfg();syncNativeWar();}
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
    renderWarStrip();mountFactionShortcut();syncNativeWar();syncPageBse();
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
  const scouterFlightTimer=setInterval(()=>{if(!document.hidden){pollScouterFlights();publish();if(state.open&&state.tab==='alerts')render();}},30000);
  const hospitalClockTimer=setInterval(()=>{if(!document.hidden)updateHospitalCountdowns();},10000);
  const nativeWarTimer=setInterval(()=>{if(!document.hidden){syncNativeWar();syncNativeProfile();syncPageBse();}},5000);
  window.addEventListener('hashchange',syncPageBse);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPageBse();});
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
    {sharedPull(false);if(Date.now()-commandSync.attempt>=75000)syncCommand();}},90000);
  window.addEventListener('scroll',handleWarScroll,{passive:true});
  document.addEventListener('scroll',handleWarScroll,{passive:true,capture:true});
  window.addEventListener('popstate',()=>{renderWarStrip(true);syncNativeWar();});
  window.addEventListener('hashchange',()=>{renderWarStrip(true);syncNativeWar();});
  const refreshTimer=setInterval(()=>{
    if(!document.hidden&&effectiveKey()&&!state.loading&&Date.now()-state.lastRefresh>cfg.refreshSeconds*1000)refresh(false);
  },30000);
  window.addEventListener('beforeunload',()=>{clearInterval(refreshTimer);clearInterval(registrationTimer);clearInterval(warStripTimer);clearInterval(warRouteTimer);clearInterval(hospitalClockTimer);clearInterval(nativeWarTimer);clearInterval(nativeWarClock);clearInterval(scouterFlightTimer);clearInterval(nativeWarPolling);clearNativeWar();},{once:true});
  try{boot();}catch(err){
    window.__warStaxxReady=false;
    window.__warStaxxStartError='Startup failed ('+(err?.name||'Error')+')';
    const beacon=document.getElementById('tornstaxx-war-execution-probe');
    if(beacon){beacon.dataset.phase='error';beacon.dataset.observed=String(Date.now());}
    try{document.dispatchEvent(new CustomEvent('staxx:ping'));}catch(_){}
  }
})();
