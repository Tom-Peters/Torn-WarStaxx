// ==UserScript==
// @name         War-TornStaxx - Ranked War Intelligence
// @namespace    https://github.com/Tom-Peters/Torn-WarStaxx
// @homepageURL  https://github.com/Tom-Peters/Torn-WarStaxx
// @supportURL   https://github.com/Tom-Peters/Torn-WarStaxx/issues
// @version      0.3.0
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
  const id='war', version='0.2.7';
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
  const ID='war', VER='0.3.0', CONFIG='warstaxx-config-v1', DATA='warstaxx-data-v1';
  const API='https://api.torn.com/v2', MIN=60000, HOUR=3600000;
  const sections=['overview','intel','targets','history','activity','matchups','strategy','assignments','alerts','settings','diagnostics'];
  const labels={overview:'War room',intel:'Enemy intel',targets:'Players',matchups:'Matchups',strategy:'Strategy',activity:'Activity',history:'Past wars',assignments:'Orders',alerts:'Alerts',settings:'Settings',diagnostics:'Diagnostics'};
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const positive=v=>Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v):0;
  const fmt=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(Number(v)):'\u2014';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeRead=(k,def)=>{try{return JSON.parse(localStorage.getItem(k))||def;}catch(_){return def;}};
  const stamp=t=>t?new Date(t).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' TCT':'Not recorded';
  const age=t=>t?Math.max(0,Math.floor((Date.now()-t)/MIN))+'m ago':'Not collected';
  const link=id=>'https://www.torn.com/profiles.php?XID='+positive(id);
  const attackLink=id=>'https://www.torn.com/loader.php?sid=attack&user2ID='+positive(id);
  const apiKeyPda=typeof window.PDA_APIKEY==='string'?window.PDA_APIKEY:'###PDA-APIKEY###';
  const defaults={key:'',ourId:0,enemyId:0,factionAuto:true,factionSource:'',factionVerifiedAt:0,refreshSeconds:120,historyLimit:12,enableAttacks:false,ffEnabled:false,ffConsent:false,ffKey:'',assignments:{},blackSkulls:{},spies:{},notes:{},hidden:false};
  const cfg=Object.assign({},defaults,safeRead(CONFIG,{}));
  cfg.assignments=cfg.assignments&&typeof cfg.assignments==='object'?cfg.assignments:{};
  cfg.blackSkulls=cfg.blackSkulls&&typeof cfg.blackSkulls==='object'?cfg.blackSkulls:{};
  cfg.spies=cfg.spies&&typeof cfg.spies==='object'?cfg.spies:{};
  cfg.notes=cfg.notes&&typeof cfg.notes==='object'?cfg.notes:{};
  const freshData=()=>({ours:[],enemies:[],ourWars:[],enemyWars:[],reports:{},activity:{},publicIntel:{},ffstats:{},attacks:[],seenAttacks:{},updated:{},errors:{},backoff:{},war:null,meta:{},sampleCount:0});
  const state={data:Object.assign(freshData(),safeRead(DATA,{})),open:false,tab:'overview',showMore:false,
    filter:'all',sort:'warScore',search:'',loading:false,spinner:'',error:'',scanning:false,alerts:[],chosen:0,
    lastRefresh:0,historicalRead:0,localKeyError:false,warExpected:false,selectedWar:0,detailFrom:'targets'};
  state.data.reports=state.data.reports||{};
  state.data.activity=state.data.activity||{};
  state.data.ffstats=state.data.ffstats||{};
  state.data.publicIntel=state.data.publicIntel||{};
  state.data.updated=state.data.updated||{};
  state.data.errors=state.data.errors||{};
  state.data.backoff=state.data.backoff||{};
  state.data.seenAttacks=state.data.seenAttacks||{};
  // Repair malformed legacy cached containers without wiping valid user data.
  for(const k of ['ours','enemies','ourWars','enemyWars','attacks'])
    if(!Array.isArray(state.data[k]))state.data[k]=[];
  for(const k of ['reports','activity','publicIntel','ffstats','seenAttacks','updated','errors','backoff','meta'])
    if(!state.data[k]||typeof state.data[k]!=='object'||Array.isArray(state.data[k]))state.data[k]={};
  if(state.data.war&&!Array.isArray(state.data.war.factions))state.data.war=null;
  for(const [key,value] of Object.entries(state.data.reports))
    if(!value||typeof value!=='object'||!Array.isArray(value.factions))delete state.data.reports[key];
  const effectiveKey=()=>String(cfg.key||'').trim()||(apiKeyPda.includes('PDA-APIKEY')?'':apiKeyPda);
  const saveCfg=()=>{try{localStorage.setItem(CONFIG,JSON.stringify(cfg));return true;}catch(_){state.localKeyError=true;return false;}};
  const save=()=>{try{localStorage.setItem(DATA,JSON.stringify(state.data));return true;}catch(_){
    // Discard only oldest evidence on quota exhaustion; never purge config, spies or notes.
    for(const key of Object.keys(state.data.activity)) {const hours=state.data.activity[key]?.hours||{};const nums=Object.keys(hours).map(Number).sort((a,b)=>a-b);for(const h of nums.slice(0,Math.ceil(nums.length/2)))delete hours[h];}
    state.data.attacks=(state.data.attacks||[]).slice(-200);
    try{localStorage.setItem(DATA,JSON.stringify(state.data));return true;}catch(e){state.error='Local storage is full; observations cannot be saved.';return false;}
  }};
  const parseArray=(value)=>Array.isArray(value)?value:Object.entries(value&&typeof value==='object'?value:{}).filter(([key])=>/^\d+$/.test(key)).map(([key,v])=>({id:positive(v.id||key),...v}));
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
      until:n(p.status?.until)*1000,
      lastAction:String(p.last_action?.status||'Unknown'),lastAt:n(p.last_action?.timestamp)*1000,
      updated:Date.now()
    })).filter(p=>p.id);
  }
  function warHistory(j){
    return parseArray(unpack(j,'rankedwars')).map(w=>{
      const details=w.war&&typeof w.war==='object'?w.war:w;
      const factions=parseArray(details.factions||details.participants||{});
      const ids=factions.map(f=>positive(f.id||f.faction_id)).filter(Boolean);
      const t=positive(details.start||details.started||details.start_time);
      return {id:positive(w.id||w.war_id||details.id),start:t,end:positive(details.end||details.ended||details.end_time),
        winner:positive(details.winner||details.winner_id),factions:ids,
        scores:factions.map(f=>({id:positive(f.id||f.faction_id),name:String(f.name||''),score:n(f.score||f.points)})),
        target:n(details.target||details.target_score),rawStatus:String(details.status||'')};
    }).filter(w=>w.id).slice(0,80);
  }
  function detectWar(j){
    const d=unpack(j,'wars');const w=d?.ranked||d?.ranked_war||d?.rankedwar||j?.ranked||null;
    if(!w || typeof w!=='object' || Array.isArray(w))return null;
    const factions=parseArray(w.factions||w.participants||{}).map(p=>({id:positive(p.id||p.faction_id),name:String(p.name||''),score:n(p.score||p.points)}));
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
      id:positive(side.id||side.faction_id),name:String(side.name||''),score:n(side.score),attacks:n(side.attacks),
      rankBefore:String(side.rank?.before||side.rank_before||''),rankAfter:String(side.rank?.after||side.rank_after||''),
      rewards:{respect:n(side.rewards?.respect),points:n(side.rewards?.points),
        items:parseArray(side.rewards?.items).map(p=>({id:positive(p.id),name:String(p.name||''),quantity:n(p.quantity)}))},
      members:parseArray(side.members||{}).map(p=>({id:positive(p.id||p.user_id),name:String(p.name||''),
        score:n(p.score),attacks:n(p.attacks),level:n(p.level)})).filter(p=>p.id)
    })),retrieved:Date.now()};
  }
  function attacks(j){
    return parseArray(unpack(j,'attacks')).map(a=>({
      id:positive(a.id||a.attack_id),at:positive(a.started||a.timestamp||a.start)*1000,
      attacker:positive(a.attacker?.id||a.attacker_id),defender:positive(a.defender?.id||a.defender_id),
      ff:Number(a.modifiers?.fair_fight??a.modifiers?.fairfight??a.fair_fight),result:String(a.result||''),
      respect:n(a.respect_gain||a.respect),code:'api'
    })).filter(a=>a.id&&a.at);
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
    const s=p.status.toLowerCase();
    if(s.includes('hospital'))return 'hospital';
    if(s.includes('trav')||s.includes('abroad'))return 'away';
    if(s.includes('jail')||s.includes('federal'))return 'jail';
    if(s.includes('fallen'))return 'fallen';
    if(s.includes('okay'))return 'okay';
    return 'unknown';
  }
  function isOnline(p){return p.lastAction.toLowerCase()==='online';}
  function snapshot(sides=['ours','enemies']){
    const hour=Math.floor(Date.now()/HOUR);
    for(const side of sides){
      const players=state.data[side]||[];
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
    return recentWarRecords(side,id).find(x=>x.covered)?.score??null;
  }
  function spy(id){const s=cfg.spies[String(id)];return s&&typeof s==='object'?s:null;}
  function bsScore(s){
    if(!s)return null;
    const keys=['strength','speed','defense','dexterity'];
    if(keys.some(k=>!Number.isFinite(Number(s[k]))||Number(s[k])<0))return null;
    const score=keys.reduce((sum,k)=>sum+Math.sqrt(Number(s[k])),0);
    return score>0?score:null;
  }
  function ffscouter(id){
    const x=state.data.ffstats[String(id)];
    return cfg.ffEnabled&&x&&Date.now()-n(x.at)<24*HOUR?x:null;
  }
  function matchup(friend,enemy){
    const a=spy(friend.id), b=spy(enemy.id),sa=bsScore(a);
    const manual=bsScore(b),third=ffscouter(enemy.id),sb=manual!==null?manual:(third&&positive(third.bss)?positive(third.bss):null);
    if(sa===null||sb===null)return {known:false,ff:null,ratio:null,verdict:'Unverified stats',confidence:'Unknown'};
    const r=sb/Math.max(1,sa);
    // Approximate uncapped FF curve. Official top-1000 BSS cap varies over time; do not hardcode it.
    const ff=Math.max(1,Math.min(3,1+(8/3)*(sb/Math.max(1,sa))));
    const old=Math.max(n(a?.observedAt),n(b?.observedAt));
    return {known:true,ratio:r,ff,verdict:r>=1.15?'Likely tougher':r>=0.8?'Close fight':'Favourable on BS score',
      confidence:manual===null?'FFScouter public BSS estimate':old&&Date.now()-old<7*24*HOUR?'Recent manual spy':'Older manual spy'};
  }
  function ffObserved(enemyId,friendId){
    const all=(state.data.attacks||[]).filter(a=>a.defender===enemyId&&(!friendId||a.attacker===friendId)&&
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
  function assignments(){
    const ours=state.data.ours.slice().sort((a,b)=>Number(Boolean(cfg.blackSkulls[b.id]))-Number(Boolean(cfg.blackSkulls[a.id])) || Number(isOnline(b))-Number(isOnline(a)));
    const enemies=state.data.enemies.filter(p=>evaluate(p).ready);
    const ranked=enemies.slice().sort((a,b)=>evaluate(b).score-evaluate(a).score);
    const used=new Set();
    return ours.map(p=>{
      if(memberState(p)!=='okay')return {friend:p,enemy:null,reason:memberState(p)==='hospital'?'Recover / monitor hospital expiry':memberState(p)==='away'?'Travelling \u00b7 return and prepare':'Unavailable \u00b7 standby and support',details:null};
      const fixed=positive(cfg.assignments[p.id]);
      let target=ranked.find(e=>e.id===fixed);
      let reason=target?'Your saved manual order':'';
      if(!target){
        const safe=ranked.filter(e=>!used.has(e.id)).map(e=>({enemy:e,m:matchup(p,e)}));
        const confirmed=safe.filter(x=>x.m.known&&x.m.ratio<0.8).sort((a,b)=>evaluate(b.enemy).score-evaluate(a.enemy).score);
        target=confirmed[0]?.enemy||null;
        reason=target?'Provisional BS-score matchup':'No sufficiently evidenced auto-match; scout first';
      }
      if(target)used.add(target.id);
      return {friend:p,enemy:target,reason,details:target?matchup(p,target):null};
    });
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
    if(!our||!theirs)return null;
    return {our:n(our.score),enemy:n(theirs.score),net:n(our.score)-n(theirs.score),target:n(w.target)};
  }
  function currentAlerts(){
    const out=[];
    const w=state.data.war,score=warScore(),t=state.data.updated.enemies||0;
    if(!effectiveKey())out.push({id:'api-key',title:'Connect Torn API',detail:'Add a key in Settings to load live and historical intelligence.',status:'now',priority:95,tab:'settings'});
    if(!positive(cfg.ourId))out.push({id:'faction-id',title:'Detect your faction',detail:'WarStaxx checks your API key identity automatically. Open Settings if you need to retry or use a manual ID.',status:'now',priority:92,tab:'settings'});
    if(w&&t&&Date.now()-t<5*MIN){
      const hittable=state.data.enemies.filter(p=>evaluate(p).ready);
      if(hittable.length)out.push({id:'ready-targets',title:fmt(hittable.length)+' opponents currently Okay',detail:'Review live status and confirmed matchups before choosing your hit.',status:'now',priority:85,tab:'targets'});
      if(score&&score.net<0)out.push({id:'war-score',title:'Ranked war score is behind',detail:'Current net score '+fmt(score.net)+'; review team assignments and coverage.',status:'review',priority:70,tab:'strategy'});
    }
    if(w&&(!t||Date.now()-t>5*MIN))out.push({id:'stale-roster',title:'Refresh opponent statuses',detail:'Last observed status is stale; refresh before hitting.',status:'soon',priority:75,tab:'overview'});
    return out.slice(0,10);
  }
  function event(name,detail){document.dispatchEvent(new CustomEvent('staxx:'+name,{detail}));}
  function announce(){
    event('register',{id:ID,label:'War-TornStaxx',icon:'WS',desc:'Ranked wars \u00b7 Live targets \u00b7 Matchups',trendMetric:'Hittable enemies',freshnessMs:300000,sections:sections.map(id=>({id,label:labels[id]}))});
  }
  function publish(){
    const a=currentAlerts();state.alerts=a;
    announce();
    const observed=Math.max(n(state.data.updated.wars),n(state.data.updated.enemies),n(state.data.updated.ours));
    const hittable=state.data.enemies.filter(e=>evaluate(e).ready).length;
    if(observed)event('summary',{id:ID,headline:state.data.war?'Ranked war detected':'War scouting / standby',
      updated:observed,metrics:[{label:'Hittable enemies',value:String(hittable)},{label:'Enemy roster',value:String(state.data.enemies.length)},
        {label:'Historical reports',value:String(Object.keys(state.data.reports).length)}]});
    event('actions',{id:ID,updated:observed||0,items:a.map(x=>({id:x.id,title:x.title,detail:x.detail,status:x.status,priority:x.priority,reviewMinutes:2}))});
    event('notice',{id:ID,count:a.filter(x=>x.status==='now'||x.status==='urgent').length,
      level:a.some(x=>x.status==='urgent')?'urgent':'warning',summary:a.length?a[0].title:'No verified war alerts',
      alerts:a.filter(x=>x.status==='now'||x.status==='urgent').map(x=>({id:x.id,title:x.title,detail:x.detail}))});
    const completed=Object.values(state.data.reports).filter(r=>n(r.war?.end)>0)
      .sort((a,b)=>n(b.war.end)-n(a.war.end)).slice(0,10);
    if(completed.length)event('activity',{id:ID,events:completed.map(r=>({id:'war-'+r.id,
      at:n(r.war.end)*1000,title:'Ranked war finished',detail:'Official report '+r.id+' available',section:'history',source:'api'}))});
    event('war-context',{id:ID,active:Boolean(state.data.war),ourFactionId:positive(cfg.ourId),
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
  async function refreshHistory(){
    if(!positive(cfg.ourId))return;
    const limit=Math.max(2,Math.min(20,positive(cfg.historyLimit)||8));
    const sides=[['ourWars',cfg.ourId],['enemyWars',cfg.enemyId]];
    for(const [name,fid] of sides){
      if(!positive(fid))continue;
      try{const j=await call('/faction/'+fid+'/rankedwars?limit='+limit,name,30*MIN);
        if(j)state.data[name]=warHistory(j);}catch(e){state.error=String(e.message||e);}
    }
    const ids=[...new Set([...state.data.enemyWars.slice(0,limit),...state.data.ourWars.slice(0,limit)]
      .map(w=>w.id).filter(Boolean))].filter(id=>!state.data.reports[id]);
    // Bounded incremental backfill: at most 3 report calls per refresh.
    for(const id of ids.slice(0,4)){
      try{const j=await call('/faction/'+id+'/rankedwarreport','report-'+id);
        if(j)state.data.reports[id]=report(j,id);}catch(e){state.data.errors['report-'+id]=String(e.message||e);}
    }
    const keep=Object.keys(state.data.reports).map(Number).sort((a,b)=>b-a);
    for(const id of keep.slice(40))delete state.data.reports[id];
    state.historicalRead=Date.now();
  }
  async function refreshFF(){
    if(!cfg.ffEnabled||!cfg.ffConsent||!cfg.ffKey||!state.data.enemies.length||!canCall('ffscouter',10*MIN))return;
    // The separately entered user-owned FFScouter key is only ever sent to ffscouter.com.
    const ids=state.data.enemies.map(p=>p.id).filter(Boolean).slice(0,205);
    const url='https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(cfg.ffKey)+'&targets='+ids.join(',');
    try{
      const results=await new Promise((resolve,reject)=>{
        if(typeof GM_xmlhttpRequest!=='function'){reject(new Error('Torn PDA cross-origin request unavailable'));return;}
        GM_xmlhttpRequest({method:'GET',url,timeout:16000,
          onload:r=>{try{const j=JSON.parse(r.responseText);if(r.status>=400||!Array.isArray(j))throw Error('FFScouter returned no compatible player list');resolve(j);}catch(e){reject(e);}},
          onerror:()=>reject(new Error('FFScouter connection failed')),ontimeout:()=>reject(new Error('FFScouter timed out'))});
      });
      const now=Date.now();
      for(const p of results){
        const id=positive(p.player_id);
        if(!ids.includes(id))continue;
        const raw=Number(p.fair_fight),bs=Number(p.bss_public);
        state.data.ffstats[id]={ff:Number.isFinite(raw)&&raw>=1&&raw<=3?raw:null,bss:Number.isFinite(bs)&&bs>0?bs:null,at:now};
      }
      state.data.updated.ffscouter=now;delete state.data.errors.ffscouter;delete state.data.backoff.ffscouter;
      for(const id of Object.keys(state.data.ffstats))if(now-n(state.data.ffstats[id].at)>7*24*HOUR)delete state.data.ffstats[id];
    }catch(e){
      const b=state.data.backoff.ffscouter||{count:0};const count=Math.min(6,n(b.count)+1);
      state.data.backoff.ffscouter={count,until:Date.now()+Math.min(HOUR,2**count*MIN)};
      state.data.errors.ffscouter=String(e.message||e).slice(0,140);
    }
  }
  async function refreshAttacks(){
    if(!cfg.enableAttacks||!state.data.war||!positive(cfg.ourId))return;
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
    state.loading=true;state.error='';state.spinner='Fetching official Torn data';
    render();
    try{
      await identify(force);
      if(!positive(cfg.ourId))throw new Error('Unable to detect your faction from Torn API. Check your API key or use the optional manual faction ID in Settings.');
      const wars=await call('/faction/'+cfg.ourId+'/wars','wars',force?0:90*1000);
      if(wars){
        const w=detectWar(wars);state.data.war=w;
        if(w&&w.opponentId&&w.opponentId!==positive(cfg.enemyId)){cfg.enemyId=w.opponentId;saveCfg();}
      }
      const own=await call('/faction/'+cfg.ourId+'/members','ours',force?0:90*1000);
      if(own)state.data.ours=roster(own);
      if(positive(cfg.enemyId)){
        const enemy=await call('/faction/'+cfg.enemyId+'/members','enemies',force?0:90*1000);
        if(enemy)state.data.enemies=roster(enemy);
        if(own||enemy)snapshot([...(own?['ours']:[]),...(enemy?['enemies']:[])]);
      }
      await refreshHistory();
      await refreshAttacks();
      await refreshFF();
      state.lastRefresh=Date.now();
    }catch(e){state.error=String(e.message||e);}
    finally{state.loading=false;state.spinner='';save();publish();render();}
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
    '<div class="ws-head-buttons"><button type="button" data-action="refresh">\u21bb Refresh</button><button type="button" data-action="find">\u2315</button><button type="button" data-close aria-label="Close">\u00d7</button></div></header>'+
    '<nav class="ws-tabs" aria-label="WarStaxx sections"></nav><main class="ws-content"></main>'+
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
    '#warstaxx-root .ws-warn{border-left-color:#ff8094}#warstaxx-root .ws-small{font-size:11px;color:#a8c4d7}',
    '#warstaxx-root .ws-pct{height:8px;background:#132a44;border-radius:8px;overflow:hidden;margin:9px 0}#warstaxx-root .ws-pct i{display:block;height:100%;background:#2eafd6}',
    '@media(max-width:640px){#warstaxx-root .ws-panel{top:0;bottom:0;width:100%;border-radius:0}#warstaxx-root .ws-head{padding:8px}#warstaxx-root .ws-head strong{font-size:18px}#warstaxx-root .ws-head small{font-size:8px}#warstaxx-root .ws-content{padding:8px}#warstaxx-root .ws-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#warstaxx-root .ws-card{padding:9px}#warstaxx-root .ws-number{font-size:21px}}'
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
  function publicStatsHtml(id){
    const item=state.data.publicIntel[id];
    if(!item)return empty('Public profile and personal statistics not yet loaded. Select the lookup button to fetch them from Torn.');
    const p=item.profile||{},stats=publicMetricItems(item.stats||{}).slice(0,65);
    return '<p>Last checked '+esc(age(item.at))+' | Torn public API. These may be lifetime stats, not ranked-war totals.</p>'+
      '<div class="ws-grid">'+
      stat('Profile rank',p.rank||'\u2014','Torn public profile')+
      stat('Account age',p.age===null||p.age===undefined?'\u2014':fmt(p.age)+' days','Torn public profile')+
      stat('Public awards',p.awards===null||p.awards===undefined?'\u2014':fmt(p.awards),'Torn public profile')+
      '</div>'+(stats.length?'<div class="ws-table-wrap"><table class="ws-compact-table"><thead><tr><th>Public statistic</th><th>Value</th></tr></thead><tbody>'+
      stats.map(x=>'<tr><td>'+esc(x.name.replace(/_/g,' '))+'</td><td>'+fmt(x.value)+'</td></tr>').join('')+'</tbody></table></div>':
      empty('This key returned no numerical public personal-stat fields.'));
  }
  async function loadPublicIntel(id){
    if(!positive(id)||state.loading)return;
    const item=state.data.publicIntel[id];
    if(item&&Date.now()-n(item.at)<6*HOUR){state.error='Public lookup is cached '+age(item.at)+'. Refresh after six hours.';render();return;}
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
      if(data)state.data.reports[id]=report(data,id);
      else if(!state.data.reports[id])state.error='War report not available yet. Check Diagnostics for endpoint errors.';
    }catch(e){state.error='Cannot load official report: '+String(e.message||e);}
    finally{state.loading=false;save();render();}
  }
  function statusNote(){
    const latest=Math.max(n(state.data.updated.enemies),n(state.data.updated.ours));
    const fresh=latest&&Date.now()-latest<5*MIN;
    return '<div class="ws-note'+(fresh?'':' ws-warn')+'">'+
      (state.loading?'Refreshing official data\u2026 ':fresh?'Live roster sampled '+esc(age(latest))+'. ':'Status may be stale. Latest roster: '+esc(age(latest))+'. ')+
      'Travel, online and hospital data are observed snapshots\u2014not a continuous historical log. '+'<span class="ws-small">Times shown in TCT (UTC).</span></div>'+
      (state.error?'<div class="ws-note ws-warn">'+esc(state.error)+'</div>':'');
  }
  function overview(){
    const w=state.data.war,score=warScore();
    const online=state.data.enemies.filter(isOnline).length;
    const ready=state.data.enemies.filter(p=>evaluate(p).ready).length;
    let html=statusNote()+'<div class="ws-grid">'+
      stat('War status',w?'ACTIVE':'Scouting',w?'vs '+(w.opponentName||('Faction '+w.opponentId)):'No active ranked war confirmed')+
      stat('Net war score',score?fmt(score.net):'\u2014',score&&score.target?'Target '+fmt(score.target):'Current score requires verified war data')+
      stat('Enemy Okay',state.data.enemies.length?fmt(ready):'\u2014','Based on latest roster snapshot')+
      stat('Enemy online',state.data.enemies.length?fmt(online):'\u2014','Current online flag, not a prediction')+
      stat('War reports',fmt(Object.keys(state.data.reports).length),'Incremental official report backfill')+
      stat('Activity snapshots',fmt(state.data.sampleCount),'Accumulated on this device')+'</div>';
    if(score&&score.target){
      const percentage=Math.max(0,Math.min(100,(score.net+score.target)/(2*score.target)*100));
      html+=card('Scoreline','<div class="ws-row"><b>Our score '+fmt(score.our)+'</b><b>Enemy '+fmt(score.enemy)+'</b></div><div class="ws-pct"><i style="width:'+percentage+'%"></i></div><small>Net difference is official data; this bar is illustrative, not win probability.</small>');
    }
    html+=card('Next best decisions','<div class="ws-toolbar">'+b('Review hittable targets','tab:targets')+' '+b('Suggested assignments','tab:assignments')+
      ' '+b('Compare past wars','tab:history')+'</div>'+
      (currentAlerts().length?currentAlerts().map(x=>'<div class="ws-row"><span>'+esc(x.title)+'<br><small>'+esc(x.detail)+'</small></span>'+b('Review','alert:'+x.id)+'</div>').join(''):empty('No verified urgent war tasks.')))+
      card('Other Staxx tools','<p>Use the same StaxxHub launcher and jump between tools without duplicating panels.</p>'+
      '<div class="ws-toolbar">'+b('Happy Jump \u00b7 energy','tool:happy')+b('ProfitStaxx \u00b7 supplies','tool:profit')+b('Company Helper','tool:company')+'</div>');
    return html;
  }
  function targetRows(){
    const q=state.search.trim().toLowerCase();
    const filter=state.filter;
    return state.data.enemies.filter(p=>{
      const ev=evaluate(p);
      if(q&&!((p.name+' '+p.id).toLowerCase().includes(q)))return false;
      if(filter==='ready'&&!ev.ready)return false;
      if(filter==='online'&&!isOnline(p))return false;
      if(filter==='away'&&ev.kind!=='away')return false;
      if(filter==='hospital'&&ev.kind!=='hospital')return false;
      return true;
    }).sort((a,b)=>evaluate(b).score-evaluate(a).score||a.level-b.level);
  }
  function targets(){
    const row=targetRows();
    const chips=['all','ready','online','hospital','away'].map(f=>'<button class="ws-btn '+(state.filter===f?'':'secondary')+'" data-filter="'+f+'">'+esc(f==='ready'?'Okay':f)+'</button>').join('');
    let html=statusNote()+'<div class="ws-toolbar"><input type="search" id="ws-search" placeholder="Search player or ID" value="'+esc(state.search)+'" aria-label="Find enemy player">'+chips+'</div>';
    if(!row.length)return html+empty('No opponent records match. Set an enemy faction in Settings or refresh the current war.');
    return html+'<div class="ws-table-wrap"><table><thead><tr><th>Opponent</th><th>State</th><th>Activity</th><th>Previous wars</th><th>Travel pattern</th><th>Action</th></tr></thead><tbody>'+
      row.map(p=>{const ev=evaluate(p),pat=ev.pat,ff=ffObserved(p.id);
        return '<tr><td><a href="'+link(p.id)+'">'+esc(p.name)+'</a><small> ['+p.id+'] \u00b7 L'+fmt(p.level)+'</small><br>'+pill(ev.reason,ev.ready?'good':ev.kind==='hospital'?'bad':'')+'</td>'+
          '<td>'+pill(p.status,ev.ready?'good':'')+'<br><small>'+esc(p.statusText)+'</small></td>'+
          '<td>'+pill(p.lastAction,isOnline(p)?'good':'')+'<br><small>'+esc(age(p.lastAt))+'</small></td>'+
          '<td>'+fmt(ev.hist.wars)+' wars'+(ev.hist.avg===null?'':' \u00b7 avg '+fmt(ev.hist.avg)+' points')+
          '<br><small>Observed FF '+(ff.avg===null?'unknown':ff.avg.toFixed(2)+'x ('+ff.count+')')+'</small><br><small>FFScouter '+(ffscouter(p.id)?.ff!==null&&ffscouter(p.id)?.ff!==undefined?ffscouter(p.id).ff.toFixed(2)+'x estimated':'unavailable')+'</small></td>'+
          '<td>'+esc(pat.warSamples?pat.warTravel+'% in observed wars ('+pat.warSamples+' checks)':'No in-war samples')+'<br><small>'+esc(pat.reliability)+'</small></td>'+
          '<td>'+a('Profile',link(p.id))+' '+a('Attack',attackLink(p.id))+' '+b('Intel','player:'+p.id)+'</td></tr>';
      }).join('')+'</tbody></table></div><p class="ws-small">Priority is an advisory shortlist, never a proven win chance. Attack buttons only navigate to Torn.</p>';
  }
  function playerIntel(id){
    const p=[...state.data.enemies,...state.data.ours].find(x=>x.id===id);
    if(!p)return empty('Player not found in the latest roster.');
    const ours=state.data.ours.some(x=>x.id===id),side=ours?'ours':'enemies';
    const pat=pattern(side,id),hist=pastPerformance(id,side),s=spy(id);
    const myFf=ffObserved(id),third=ffscouter(id);
    return card(p.name+' ['+id+']','<div class="ws-grid">'+
      '<div><h3>Live observation</h3><p>'+pill(p.status)+' \u00b7 '+pill(p.lastAction)+'</p><p>'+esc(p.statusText)+'</p>'+
      '<small>Last action '+esc(age(p.lastAt))+'; snapshot '+esc(age(p.updated))+'</small></div>'+
      '<div><h3>Historical output</h3><p>'+hist.wars+' official war reports</p><p>'+fmt(hist.score)+' total score \u00b7 '+fmt(hist.attacks)+' attacks</p>'+
      '<small>Same member ID, no assumption about changed faction membership</small></div>'+
      '<div><h3>Travel/activity sampling</h3><p>'+pat.count+' checks \u00b7 '+pat.travel+'% away \u00b7 '+pat.online+'% online</p>'+
      '<small>Coverage '+esc(pat.reliability)+(pat.peak===null?'':'; peak sampled '+pat.peak+':00 TCT')+'</small><br><small>In-war: '+esc(pat.warSamples?pat.warTravel+'% travelling/abroad in '+pat.warSamples+' checks':'No in-war samples')+'</small></div>'+
      '<div><h3>Fair fight</h3><p>'+esc(myFf.avg===null?'No observed FF':myFf.avg.toFixed(2)+'x observed')+'</p>'+
      '<small>'+myFf.count+' recorded encounters from faction attacks</small><br><small>FFScouter (your key): '+esc(third&&third.ff!==null?third.ff.toFixed(2)+'x estimated':'Unavailable')+' \u00b7 public BSS '+esc(third&&third.bss?fmt(third.bss):'unknown')+'</small></div></div>'+
      '<h3>Manual spy or verified battle stats</h3>'+
      '<p>Enter all four stats only if known. Predictions use the weighted battle-stat score, and remain estimates; they do not guarantee a hit.</p>'+
      ['strength','speed','defense','dexterity'].map(k=>'<label>'+esc(k)+'<input type="number" min="0" step="1" data-spy="'+esc(k)+'" value="'+esc(s&&s[k]!==undefined?s[k]:'')+'"></label>').join('')+
      b('Save spy stats','spy:'+id)+' '+b('Clear spy stats','clear-spy:'+id)+
      '<label>Local tactical note<textarea id="ws-note" maxlength="500">'+esc(cfg.notes[id]||'')+'</textarea></label>'+
      b('Save note','note:'+id)+' '+a('Open profile',link(id))+(ours?'':' '+a('Open attack page',attackLink(id))))+
      b('Back to targets','tab:targets');
  }
  function matchups(){
    const friends=state.data.ours,enemies=state.data.enemies;
    if(!friends.length||!enemies.length)return empty('Refresh both rosters to compare your hitters with enemy targets.');
    const chosen=positive(state.chosen)||friends[0].id;
    const friend=friends.find(p=>p.id===chosen)||friends[0];
    const rows=enemies.filter(e=>evaluate(e).ready).map(e=>({e,m:matchup(friend,e),ff:ffObserved(e.id,friend.id)}))
      .sort((a,b)=>Number(b.m.known)-Number(a.m.known)||(a.m.known?a.m.ratio-b.m.ratio:evaluate(b.e).score-evaluate(a.e).score));
    return statusNote()+card('Choose your hitter','<label>Friendly player<select id="ws-friend">'+friends.map(p=>
      '<option value="'+p.id+'" '+(p.id===friend.id?'selected':'')+'>'+esc(p.name)+' ['+p.id+']</option>').join('')+'</select></label>'+
      '<p>'+fmt(rows.filter(x=>x.m.known).length)+' of '+fmt(rows.length)+' Okay opponents have both sets of battle stats. Unknown matchups are not marked safe.</p>')+
      '<div class="ws-table-wrap"><table><thead><tr><th>Enemy</th><th>BS score comparison</th><th>Estimated FF</th><th>Observed FF</th><th>Decision</th></tr></thead><tbody>'+
      rows.map(x=>'<tr><td>'+esc(x.e.name)+'<br><small>L'+fmt(x.e.level)+'</small></td>'+
        '<td>'+pill(x.m.verdict,x.m.known&&x.m.ratio<0.8?'good':'')+'<br><small>'+esc(x.m.confidence)+'</small></td>'+
        '<td>'+esc(x.m.ff===null?'Unknown':x.m.ff.toFixed(2)+'x modelled')+'</td>'+
        '<td>'+esc(x.ff.avg===null?'Not observed':x.ff.avg.toFixed(2)+'x \u00b7 '+x.ff.count+' recorded')+'</td>'+
        '<td>'+b('Set manual order','assign:'+friend.id+':'+x.e.id)+' '+b('Spy','player:'+x.e.id)+' '+a('Attack',attackLink(x.e.id))+'</td></tr>').join('')+
      '</tbody></table></div>';
  }
  function strategy(){
    const e=state.data.enemies,o=state.data.ours;
    const onlineO=o.filter(isOnline).length,onlineE=e.filter(isOnline).length;
    const histO=state.data.ourWars.filter(w=>w.end),histE=state.data.enemyWars.filter(w=>w.end);
    const win=(arr,id)=>{const won=arr.filter(w=>w.winner===id).length;return arr.length?won+'/'+arr.length:'unknown';};
    const observed=state.data.war;
    return statusNote()+'<div class="ws-grid">'+stat('Online coverage',onlineO+' vs '+onlineE,'Our faction / enemy faction now')+
      stat('Our previous wins',win(histO,positive(cfg.ourId)),'Completed wars loaded '+histO.length)+
      stat('Enemy previous wins',win(histE,positive(cfg.enemyId)),'Completed wars loaded '+histE.length)+'</div>'+
      card('Per-player battle plan','<p>1. Members with a confirmed favourable matchup get provisional attack assignments.'+
        ' 2. Members without reliable matchup data scout, support, maintain readiness or monitor hospital exits.'+
        ' 3. Update orders as roster statuses change; every attack remains a deliberate Torn action.</p>'+
        '<div class="ws-toolbar">'+b('View personalised orders','tab:assignments')+b('Review opponent activity','tab:activity')+'</div>')+
      card('Tactical recommendations',[
        'Compare observed online coverage for both factions before committing energy. Current online counts are snapshots, not guaranteed future availability.',
        'Focus on opponents your members can actually beat; a high fair-fight multiplier is useful only when the battle is winnable.',
        'Monitor enemy hospital expiry and travel returns, then manually coordinate strikes using confirmed live statuses.',
        'Use past war reports to identify consistently high scorers; score alone is not proof of battle-stat strength.',
        'Keep reserve hitters and energy available for counterattacks. Open Happy Jump to review energy and training preparation.'
      ].map(s=>'<p>\u2022 '+esc(s)+'</p>').join('')+
      '<div class="ws-toolbar">'+b('Happy Jump','tool:happy')+b('War targets','tab:targets')+'</div>');
  }
  function activity(){
    const enemies=state.data.enemies;
    const summary=enemies.map(p=>({p,pat:pattern('enemies',p.id)})).sort((a,b)=>b.pat.count-a.pat.count);
    return statusNote()+card('Activity evidence','<p>Sampled online, travelling and abroad states are collected only while Torn PDA is open with WarStaxx installed. Percentages are percentages of sampled checks, not real time spent.</p>'+
      '<p>Moderate confidence requires at least 60 observations across 12 distinct UTC hours. No past-war travel history can be reconstructed from official war reports alone.</p>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Enemy</th><th>Samples</th><th>Online checks</th><th>Travelling/abroad</th><th>Observed peak TCT</th><th>Confidence</th></tr></thead><tbody>'+
      summary.map(x=>'<tr><td>'+esc(x.p.name)+'</td><td>'+fmt(x.pat.count)+'</td><td>'+fmt(x.pat.online)+'%</td>'+
        '<td>'+fmt(x.pat.travel)+'% overall / '+esc(x.pat.warTravel===null?'no war samples':x.pat.warTravel+'% during war')+'</td><td>'+esc(x.pat.peak===null?'\u2014':x.pat.peak+':00')+'</td><td>'+pill(x.pat.reliability)+'</td></tr>').join('')+
      '</tbody></table></div>')+
      card('Next development of intelligence','<p>Coverage improves with foreground checks across multiple days and war windows. This version does not claim to identify individual player sleep schedules from a handful of polls.</p>');
  }
  function history(){
    const ours=state.data.ourWars,enemies=state.data.enemyWars,all=[['Our faction',ours,cfg.ourId],['Opponent faction',enemies,cfg.enemyId]];
    return statusNote()+'<div class="ws-grid">'+all.map(([label,wars,faction])=>card(label,'<p>'+fmt(wars.length)+' ranked wars loaded \u00b7 '+fmt(wars.filter(w=>w.winner===positive(faction)).length)+' wins recorded</p>'+
      (wars.length?'<div class="ws-table-wrap"><table><thead><tr><th>War ID / Start</th><th>Outcome</th><th>Scores</th><th>Details</th></tr></thead><tbody>'+
        wars.slice(0,20).map(w=>'<tr><td>#'+w.id+'<br><small>'+esc(stamp(w.start*1000))+'</small></td>'+
          '<td>'+pill(w.end?(w.winner===positive(faction)?'Won':'Lost'):'Ongoing')+'</td>'+
          '<td>'+esc(w.scores.map(s=>s.id+': '+fmt(s.score)).join(' / ')||'Not reported')+'</td>'+
          '<td>'+pill(state.data.reports[w.id]?'Report stored':'Awaiting backfill')+'</td></tr>').join('')+'</tbody></table></div>':empty('No reports loaded yet.')))).join('')+'</div>'+
      card('Player score leaders','<div class="ws-grid">'+
        [['Our highest recorded',state.data.ours,'ours'],['Enemy highest recorded',state.data.enemies,'enemies']].map(([title,roster,side])=>
          '<div><h3>'+esc(title)+'</h3>'+roster.map(p=>({p,h:pastPerformance(p.id,side)})).filter(x=>x.h.wars).sort((a,b)=>b.h.score-a.h.score).slice(0,8)
          .map(x=>'<p>'+esc(x.p.name)+' \u00b7 '+fmt(x.h.score)+' total points / '+x.h.wars+' report(s)</p>').join('')+'</div>').join('')+'</div>');
  }
  function orders(){
    const rows=assignments();
    return statusNote()+card('Member-by-member orders','<p>Auto-assigned targets require manually entered, comparable battle stats for both players. Otherwise the tool recommends reconnaissance rather than pretending a hit is safe. Saved manual orders always take priority.</p>'+
      (!rows.length?empty('Your faction roster is missing. Refresh to load members.'):
      '<div class="ws-toolbar">'+b('Copy war orders','copy-orders')+'</div>'+ 
      '<div class="ws-table-wrap"><table><thead><tr><th>Our member</th><th>Next assignment</th><th>Reason / confidence</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(x=>'<tr><td>'+esc(x.friend.name)+(cfg.blackSkulls[x.friend.id]?' '+pill('Black Skull','good'):'')+(isOnline(x.friend)?' '+pill('Online','good'):'')+'</td>'+
        '<td>'+esc(x.enemy?x.enemy.name:'Scout / Support / Standby')+'</td>'+
        '<td>'+esc(x.reason)+(x.details?.known?'<br><small>'+x.details.verdict+'; model FF '+x.details.ff.toFixed(2)+'x</small>':'')+'</td>'+
        '<td>'+(x.enemy?a('Profile',link(x.enemy.id))+' '+a('Attack',attackLink(x.enemy.id)):'')+
          ' '+b(cfg.blackSkulls[x.friend.id]?'Unmark Black Skull':'Mark Black Skull','black-skill:'+x.friend.id)+
          ' '+b('Clear order','clear-assign:'+x.friend.id)+'</td></tr>').join('')+'</tbody></table></div>'))+
      '<p class="ws-small">Orders are local on this device; they are not sent to other members, posted to faction chat, or executed automatically.</p>';
  }
  function alertView(){
    return statusNote()+(state.alerts.length?state.alerts.map(x=>card(x.title,'<p>'+esc(x.detail)+'</p>'+b('Review now','tab:'+x.tab))).join(''):empty('No active actionable war alerts.')) ;
  }
  function settings(){
    return card('Torn API connection','<p>Use your Torn PDA API placeholder when supported, or save a personal key on this device. The key is sent only to the official api.torn.com endpoint. Do not export it.</p>'+
      '<label>API key (saved locally, never displayed on diagnostics)<input id="ws-key" type="password" autocomplete="off" placeholder="'+(effectiveKey()?'Key available \u00b7 leave blank to keep':'Enter custom-scoped Torn API key')+'"></label>'+
      '<label><input type="checkbox" id="ws-auto-faction" '+(cfg.factionAuto!==false?'checked':'')+'> Automatically detect my faction from the Torn API (recommended)</label>'+
      '<p class="ws-small">Detected faction: '+(positive(cfg.ourId)?fmt(cfg.ourId):'Not detected yet')+
      ' | Source: '+esc(cfg.factionSource||'Awaiting API check')+
      (state.data.errors.identity?' | '+esc(state.data.errors.identity):'')+'</p>'+
      '<label>My faction ID (manual fallback when automatic detection is disabled)<input type="number" id="ws-our" min="1" value="'+(positive(cfg.ourId)||'')+'"></label>'+
      '<label>Opponent faction ID (auto-updated if a ranked war is detected)<input type="number" id="ws-enemy" min="1" value="'+(positive(cfg.enemyId)||'')+'"></label>'+
      '<label>Automatic refresh<select id="ws-interval">'+[90,120,180,300].map(s=>'<option value="'+s+'" '+(cfg.refreshSeconds===s?'selected':'')+'>'+s+' seconds while visible</option>').join('')+'</select></label>'+
      '<label>Historical wars per side<select id="ws-limit">'+[3,5,8,12,20].map(s=>'<option value="'+s+'" '+(cfg.historyLimit===s?'selected':'')+'>'+s+' wars</option>').join('')+'</select></label>'+
      '<label><input type="checkbox" id="ws-attacks" '+(cfg.enableAttacks?'checked':'')+'> Read my faction attacks for observed fair-fight data (extra API permission)</label>'+ 
      '<h3>FFScouter \u00b7 optional, independent service</h3><p>Enter your own Torn API key that you have registered with FFScouter. This sends that key and selected opponent IDs to FFScouter; unlike the standard Torn API requests, this is a third-party service. Read the <a href="https://ffscouter.com/#data-policy" target="_blank" rel="noopener noreferrer">FFScouter data policy</a> and consider their premium plans if useful.</p>'+ 
      '<label>Registered FFScouter API key<input id="ws-ffkey" type="password" autocomplete="off" placeholder="'+(cfg.ffKey?'Key saved \u00b7 leave blank to keep':'Torn key registered with FFScouter')+'"></label>'+ 
      '<label><input type="checkbox" id="ws-ff-consent" '+(cfg.ffConsent?'checked':'')+'> I have read the FFScouter data policy and knowingly enable this third-party lookup.</label>'+ 
      '<label><input type="checkbox" id="ws-ff-enable" '+(cfg.ffEnabled?'checked':'')+'> Fetch FFScouter estimates using my registered key, no more than once per 10 minutes.</label>'+
      '<div class="ws-toolbar">'+b('Save settings','save-settings')+b('Detect my faction now','detect-faction')+b('Refresh all now','refresh')+b('Clear stored API key','clear-key')+'</div>'+
      '<p class="ws-small">API access depends on your custom key scope. Opponent member lists and ranked-war history use public selections; your own detailed attacks require faction access.</p>')+
      card('Local intelligence controls','<p>War histories, observations, manual spy reports and assignments remain in this browser storage. No central database or cross-device sync is active.</p>'+
      b('Reset activity samples only','reset-activity')+' '+b('Reset manual orders','reset-orders'))+
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
      '<h3>Source freshness and API errors</h3>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Endpoint</th><th>Last success</th><th>Last error</th></tr></thead><tbody>'+
      [...new Set([...Object.keys(d.updated),...Object.keys(d.errors)])].slice(0,60).map(k=>
        '<tr><td>'+esc(k)+'</td><td>'+esc(age(d.updated[k]))+'</td><td>'+esc(d.errors[k]||'\u2014')+'</td></tr>').join('')+
      '</tbody></table></div><p class="ws-small">This diagnostic screen deliberately excludes keys, imported spy values, saved notes and individual activity samples.</p>');
  }
  function render(){
    if(!root.isConnected)return;
    root.style.display=state.open?'block':'none';
    if(!state.open)return;
    const simple=(()=>{try{return JSON.parse(localStorage.getItem('staxx-hub-mode-v1'))!=='advanced';}catch(_){return true;}})();
    const basics=['overview','intel','targets','history','activity','matchups','strategy','assignments','alerts'];
    const displayed=simple&&!state.showMore?sections.filter(s=>basics.includes(s)||s===state.tab):sections;
    $('.ws-tabs',root).innerHTML=displayed.map(s=>'<button type="button" class="'+(s===state.tab?'on':'')+'" data-tab="'+s+'">'+esc(labels[s])+'</button>').join('')+
      (simple?'<button type="button" data-action="more">'+(state.showMore?'Less':'More')+'</button>':'');
    const pages={overview,intel,targets,matchups,strategy,activity,history,assignments:orders,alerts:alertView,settings,diagnostics};
    const content=$('.ws-content',root);
    const scroll=content.scrollTop;
    const form=state.tab==='settings'?Array.from(content.querySelectorAll('input,select,textarea')).map(x=>({id:x.id,checked:x.checked,value:x.value,type:x.type})):null;
    try{content.innerHTML=state.tab==='targets'&&state.playerOpen?playerIntel(state.chosen):(pages[state.tab]||overview)();}catch(e){content.innerHTML=empty('Render error: '+String(e.message||e));}
    if(form)for(const prior of form){if(!prior.id)continue;const field=content.querySelector('#'+prior.id);
      if(!field)continue;if(prior.type==='checkbox')field.checked=prior.checked;else field.value=prior.value;}
    content.scrollTop=scroll;
    $('.ws-sync',root).textContent=state.loading?'Checking Torn\u2026':Math.max(n(state.data.updated.enemies),n(state.data.updated.ours))?'Last observation '+age(Math.max(n(state.data.updated.enemies),n(state.data.updated.ours))):'Not connected yet';
    $('.ws-head [data-action="refresh"]',root).disabled=state.loading;
  }
  function navigate(tab,focus){
    if(!sections.includes(tab))tab='overview';
    state.tab=tab;state.open=true;state.playerOpen=false;if(tab!=='intel')state.selectedWar=0;
    root.style.display='block';render();
    $('.ws-content',root).scrollTop=0;
    if(focus)setTimeout(()=>$('#ws-alert-'+focus,root)?.scrollIntoView({block:'center'}),100);
  }
  function open(detail={}){
    try{
      if(!root.isConnected)document.body.appendChild(root);
      state.open=true;
      root.style.display='block';
      root.style.visibility='visible';
      root.style.pointerEvents='auto';
      if(detail.alertId){const alert=currentAlerts().find(a=>a.id===detail.alertId);navigate(alert?.tab||'alerts',detail.alertId);}
      else navigate(sections.includes(detail.section)?detail.section:state.tab);
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
  function close(){state.open=false;render();event('panel',{id:ID,open:false});}
  function handle(action){
    if(action==='refresh'){refresh(true);return;}
    if(action==='war-list'){state.selectedWar=0;navigate('history');return;}
    if(action.startsWith('war:')){navigate('intel');state.selectedWar=positive(action.slice(4));render();return;}
    if(action.startsWith('load-report:')){loadWarReport(positive(action.slice(12)));return;}
    if(action.startsWith('public:')){loadPublicIntel(positive(action.slice(7)));return;}
    if(action==='find'){close();event('find',{});return;}
    if(action==='more'){state.showMore=!state.showMore;render();return;}
    if(action.startsWith('tab:')){navigate(action.slice(4));event('visit',{id:ID,section:state.tab});return;}
    if(action.startsWith('alert:')){const x=currentAlerts().find(a=>a.id===action.slice(6));navigate(x?.tab||'alerts');return;}
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
    if(action.startsWith('clear-spy:')){delete cfg.spies[positive(action.slice(10))];saveCfg();render();return;}
    if(action.startsWith('note:')){cfg.notes[positive(action.slice(5))]=String($('#ws-note',root)?.value||'').slice(0,500);saveCfg();render();return;}
    if(action.startsWith('assign:')){const [friend,enemy]=action.slice(7).split(':').map(positive);
      if(friend&&enemy){cfg.assignments[friend]=enemy;saveCfg();navigate('assignments');}return;}
    if(action.startsWith('clear-assign:')){delete cfg.assignments[positive(action.slice(13))];saveCfg();render();return;}
    if(action.startsWith('black-skill:')){const id=positive(action.slice(12));if(cfg.blackSkulls[id])delete cfg.blackSkulls[id];else if(id)cfg.blackSkulls[id]=true;saveCfg();render();return;}
    if(action==='copy-orders'){
      const text=copiedWarOrders();
      if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
        navigator.clipboard.writeText(text).then(()=>{state.error='War plan copied to clipboard; paste it into faction chat when ready.';render();}).catch(()=>{state.error='Clipboard permission denied. The plan remains available here.';render();});
      }else{
        const el=document.createElement('textarea');el.value=text;el.style.position='fixed';el.style.left='-9999px';document.body.appendChild(el);el.select();
        let ok=false;try{ok=document.execCommand('copy');}catch(_){}el.remove();
        state.error=ok?'War plan copied; paste into faction chat when ready.':'Clipboard unavailable; use the visible orders table.';render();
      }
      return;
    }
    if(action==='clear-key'){cfg.key='';cfg.factionVerifiedAt=0;saveCfg();render();return;}
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
    if(action==='reset-orders'){cfg.assignments={};saveCfg();render();return;}
    if(action==='save-settings'){
      const supplied=$('#ws-key',root)?.value?.trim();if(supplied)cfg.key=supplied;
      const ffSupplied=$('#ws-ffkey',root)?.value?.trim();if(ffSupplied)cfg.ffKey=ffSupplied;
      cfg.ffConsent=Boolean($('#ws-ff-consent',root)?.checked);
      cfg.ffEnabled=Boolean($('#ws-ff-enable',root)?.checked)&&cfg.ffConsent&&Boolean(cfg.ffKey);
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
      cfg.enemyId=positive($('#ws-enemy',root)?.value);
      cfg.refreshSeconds=Math.max(90,Math.min(300,positive($('#ws-interval',root)?.value)||120));
      cfg.historyLimit=Math.max(2,Math.min(20,positive($('#ws-limit',root)?.value)||8));
      cfg.enableAttacks=Boolean($('#ws-attacks',root)?.checked);
      saveCfg();state.error='';state.data.backoff={};state.data.updated={};save();publish();navigate('overview');refresh(true);return;
    }
  }
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
    if(e.target.id==='ws-friend'){state.chosen=positive(e.target.value);render();}
    if(e.target.id==='ws-sort'){state.sort=e.target.value;render();}
  });
  root.addEventListener('input',e=>{
    if(e.target.id==='ws-search'){
      state.search=e.target.value;
      const pos=e.target.selectionStart,scroll=$('.ws-content',root).scrollTop;
      render();const input=$('#ws-search',root);
      if(input){input.focus();try{input.setSelectionRange(pos,pos);}catch(_){}}
      $('.ws-content',root).scrollTop=scroll;
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
  const styleSheet=()=>{if(!$('#warstaxx-css')){css.id='warstaxx-css';document.head.appendChild(css);}};
  function factionRoute(){
    return /^\/(factions|war)\.php$/i.test(location.pathname) ||
      (/^\/page\.php$/i.test(location.pathname) && /^(rankedwar|factionwar|war)$/i.test(new URLSearchParams(location.search).get('sid')||''));
  }
  function mountFactionShortcut(){
    if(!factionRoute() || document.getElementById('warstaxx-faction-open'))return;
    const host=document.querySelector('#mainContainer, #mainWrapper, #mainContent, #main-content, main, [role="main"]');
    if(!host || host.closest('#staxx-hub-root, #warstaxx-root'))return;
    const bar=document.createElement('div');
    bar.id='warstaxx-faction-open';
    bar.style.cssText='display:flex;justify-content:flex-end;align-items:center;gap:6px;margin:8px 0;padding:4px 0;clear:both;';
    const button=document.createElement('button');
    button.type='button';button.textContent='\u2694 Open WarStaxx';
    button.setAttribute('aria-label','Open WarStaxx ranked-war intelligence');
    button.style.cssText='border:1px solid #54d7fa;border-radius:9px;background:#103b60;color:#ddf8ff;padding:8px 12px;font:600 12px/1.3 system-ui,sans-serif;cursor:pointer;min-height:38px;';
    button.addEventListener('click',()=>{open({section:'overview'});});
    bar.appendChild(button);
    host.insertBefore(bar,host.firstChild);
  }
  function boot(){
    if(!document.body){document.addEventListener('DOMContentLoaded',boot,{once:true});return;}
    styleSheet();document.body.appendChild(root);
    // Show a low-profile, on-page fallback on faction routes; never create another floating FAB.
    mountFactionShortcut();
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
    announce();mountFactionShortcut();
    document.dispatchEvent(new CustomEvent('staxx:ping'));
  }},45000);
  const refreshTimer=setInterval(()=>{
    if(!document.hidden&&effectiveKey()&&!state.loading&&Date.now()-state.lastRefresh>cfg.refreshSeconds*1000)refresh(false);
  },30000);
  window.addEventListener('beforeunload',()=>{clearInterval(refreshTimer);clearInterval(registrationTimer);},{once:true});
  try{boot();}catch(err){
    window.__warStaxxReady=false;
    window.__warStaxxStartError='Startup failed ('+(err?.name||'Error')+')';
    const beacon=document.getElementById('tornstaxx-war-execution-probe');
    if(beacon){beacon.dataset.phase='error';beacon.dataset.observed=String(Date.now());}
    try{document.dispatchEvent(new CustomEvent('staxx:ping'));}catch(_){}
  }
})();
