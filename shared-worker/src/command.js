// Single revision covers plan, transient operations, and the audit trigger.
const graceMs=300000, freshMs=90000;
const roles=['capo','officer','skull','member'];
const id=n=>Number.isSafeInteger(n)&&n>0&&n<=9999999999;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const message=(status,text)=>Object.assign(new Error(text),{status});
const need=(condition,status,text)=>{if(!condition)throw message(status,text);};
const fields=(v,allowed)=>object(v)&&Object.keys(v).every(k=>allowed.includes(k));
const countries=['Torn','Mexico','Canada','Cayman Islands','Hawaii','United Kingdom','Argentina','Switzerland','Japan','China','UAE','South Africa'];
const states=['ready','hospital','jail','travelling','unknown'];
const textField=(v,max)=>typeof v==='string'&&v.length<=max&&!/[\x00-\x1f]/.test(v);
export async function memberIdentity(token,env){
  if(!token||!env.MEMBER_GRANTS)return null;
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  const key=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  const raw=JSON.parse(env.MEMBER_GRANTS)[key];
  return raw&&id(raw.id)&&roles.includes(raw.role)&&raw.faction===Number(env.FACTION_ID)&&Number.isSafeInteger(raw.expires)&&raw.expires>Date.now()?
    {id:raw.id,role:raw.role}:null;
}
function emptyRoom(){return {plan:{assignments:{},duties:{},policy:'bse',manual:[],holdMinutes:10},ops:{claims:{},roll:{},observations:{},states:{}}};}
function prune(ops,now){
  for(const c of Object.values(ops.claims))if(c.status==='claimed'&&c.expires<=now){c.status='expired';c.version++;}
  for(const [k,c] of Object.entries(ops.claims))if(now-c.expires>86400000)delete ops.claims[k];
  for(const [k,o] of Object.entries(ops.observations))if(now-o.at>3600000)delete ops.observations[k];
}
function status(h,t,now){
  if(!h||now-h.at>freshMs||h.at>now)return null;
  if(h.online==='Offline')return 'offline';
  if(['hospital','jail','travelling'].includes(h.state))return h.state;
  if(h.state!=='ready'||!['Online','Idle'].includes(h.online)||!h.country||!t||!t.country||
    now-t.at>freshMs||t.at>now||t.state==='travelling'||t.state==='unknown')return null;
  return h.country===t.country?'available':'different country';
}
function transition(room,now){
  const {plan,ops}=room,loads={};
  for(const a of Object.values(plan.assignments))loads[a.primary]=(loads[a.primary]||0)+1;
  const events=[];
  for(const [target,a] of Object.entries(plan.assignments).sort((x,y)=>y[1].priority-x[1].priority||Number(x[0])-Number(y[0]))){
    const s=ops.states[target]||(ops.states[target]={}),t=ops.observations[target],h=ops.observations[a.primary];
    const condition=status(h,t,now),claimed=ops.claims[target]?.status==='claimed';
    if(!condition){s.phase='UNKNOWN_STATUS';continue;}
    s.verified=h.at;
    if(condition==='available'){
      delete s.since;s.reason='';
      s.phase=a.primary===a.original?'ASSIGNED':'REASSIGNED';
      if(a.primary===a.original||a.lock||claimed||now-(s.changed||0)<plan.holdMinutes*60000||
        status(ops.observations[a.original],t,now)!=='available'||loads[a.original]>0||
        Object.values(ops.claims).some(c=>c.hitter===a.original&&c.status==='claimed'))continue;
      loads[a.primary]--;loads[a.original]=1;a.backups=[...new Set(a.backups.filter(i=>i!==a.original).concat(a.primary))];a.primary=a.original;s.changed=now;s.phase='ASSIGNED';s.reason='original available';
      events.push({target:Number(target),primary:a.primary,reason:s.reason});continue;
    }
    if(s.since==null)s.since=now;
    s.reason=condition;
    if(a.lock){s.phase='LOCKED_UNAVAILABLE';continue;}
    s.phase=now-s.since<graceMs?'UNAVAILABLE_PENDING':'REASSIGNMENT_READY';
    if(s.phase!=='REASSIGNMENT_READY'||h.at<s.since+graceMs||
      (condition==='different country'&&t.at<s.since+graceMs)||claimed)continue;
    const backup=a.backups.filter(i=>i!==a.primary&&status(ops.observations[i],t,now)==='available'&&
      !Object.values(ops.claims).some(c=>c.hitter===i&&c.status==='claimed'))
      .sort((i,j)=>(loads[i]||0)-(loads[j]||0))[0];
    if(!backup)continue;
    const prior=a.primary;loads[prior]--;loads[backup]=(loads[backup]||0)+1;
    a.primary=backup;a.backups=[...new Set(a.backups.filter(i=>i!==backup).concat(prior))];
    s.phase='REASSIGNED';s.changed=now;delete s.since;
    events.push({target:Number(target),prior,primary:backup,reason:condition});
  }
  return events;
}
export function commandMutation(room,cmd,actor,now){
  const {plan,ops}=room;
  need(object(cmd),400,'Command object required');
  const capo=actor.role==='capo',officer=capo||actor.role==='officer',target=cmd.target;
  prune(ops,now);
  const audit={type:cmd.type,actor:actor.id||'authorised writer'};
  if(cmd.type==='assign'){
    need(capo,403,'Skull Capo permission required');
    need(fields(cmd,['type','target','primary','backups','priority'])&&id(target)&&id(cmd.primary)&&Array.isArray(cmd.backups)&&cmd.backups.length<=20&&cmd.backups.every(id)&&!cmd.backups.includes(cmd.primary)&&new Set(cmd.backups).size===cmd.backups.length&&Number.isInteger(cmd.priority)&&cmd.priority>=0&&cmd.priority<=100,400,'Invalid assignment');
    const a=plan.assignments[target];
    need(!a?.lock,409,'Unlock this assignment before editing');
    need(!ops.claims[target]||ops.claims[target].status!=='claimed',409,'Target has an active claim');
    need(a||Object.keys(plan.assignments).length<100,400,'Assignment limit');
    plan.assignments[target]={primary:cmd.primary,original:cmd.primary,backups:cmd.backups,priority:cmd.priority,lock:null};
    ops.states[target]={phase:'ASSIGNED',changed:now};Object.assign(audit,{target,prior:a?.primary||null,primary:cmd.primary});
  }else if(cmd.type==='lock'||cmd.type==='unlock'){
    need(capo,403,'Skull Capo permission required');
    need(id(target)&&plan.assignments[target]&&textField(cmd.reason||'',120),400,'Unknown assignment or invalid reason');
    plan.assignments[target].lock=cmd.type==='lock'?{by:audit.actor,at:now,reason:cmd.reason||''}:null;
    audit.target=target;
  }else if(cmd.type==='observe'){
    need(officer,403,'Trusted roster observer required');
    need(Array.isArray(cmd.rows)&&cmd.rows.length<=200,400,'Invalid roster batch');
    const relevant=new Set(Object.entries(plan.assignments).flatMap(([t,a])=>[Number(t),a.primary,a.original,...a.backups]));
    for(const o of cmd.rows){
      need(fields(o,['id','at','state','online','country'])&&id(o.id)&&Number.isSafeInteger(o.at)&&o.at>0&&o.at<=now&&states.includes(o.state)&&['Online','Offline','Idle','Unknown'].includes(o.online)&&(o.country===null||countries.includes(o.country)),400,'Invalid observation');
      if(relevant.has(o.id)&&now-o.at<=freshMs&&o.at>(ops.observations[o.id]?.at||0))ops.observations[o.id]={...o};
    }
  }else if(['claim','release','complete'].includes(cmd.type)){
    need(id(actor.id),403,'Member-bound credential required');
    need(id(target),400,'Unknown target');
    const c=ops.claims[target],a=plan.assignments[target];
    if(cmd.type==='claim'){
      need(a&&(actor.id===a.primary||a.backups.includes(actor.id))||plan.duties[actor.id]?.target===target,403,'Target outside your orders');
      need(!c||c.status!=='claimed',409,'Target already claimed');
      need(!Object.values(ops.claims).some(x=>x.status==='claimed'&&x.hitter===actor.id),409,'Release your current claim first');
      ops.claims[target]={hitter:actor.id,at:now,expires:now+180000,status:'claimed',version:(c?.version||0)+1};
    }else{
      need(c?.status==='claimed'&&c.hitter===actor.id,403,'Only the current claimant can release');
      need(cmd.type==='release',403,'Completion requires an officer-verified attack');
      c.status='released';c.version++;
    }
    audit.target=target;
  }else if(cmd.type==='verify'){
    need(officer,403,'Officer required');
    const c=ops.claims[target];
    need(id(target)&&id(cmd.attack)&&id(cmd.hitter)&&c?.status==='claimed'&&cmd.hitter===c.hitter&&Number.isSafeInteger(cmd.at)&&cmd.at>=c.at&&cmd.at<=now,400,'No matching active claim');
    c.status='completed';c.version++;audit.target=target;audit.attack=cmd.attack;
  }else if(cmd.type==='roll'){
    need(id(actor.id),403,'Member-bound credential required');
    need(['at start','later','unavailable'].includes(cmd.choice)&&(!cmd.from||Number.isSafeInteger(cmd.from))&&(!cmd.until||Number.isSafeInteger(cmd.until)&&cmd.until>cmd.from),400,'Invalid roll call window');
    need(ops.roll[actor.id]||Object.keys(ops.roll).length<100,400,'Roll call full');
    ops.roll[actor.id]={choice:cmd.choice,from:cmd.from||null,until:cmd.until||null,at:now};
  }else if(cmd.type==='duty'){
    need(officer,403,'Officer required');
    need(id(cmd.hitter)&&(!cmd.target||id(cmd.target))&&['protect','scout','strike','reserve','turtle'].includes(cmd.duty),400,'Invalid duty');
    need(plan.duties[cmd.hitter]||Object.keys(plan.duties).length<100,400,'Duty limit');
    plan.duties[cmd.hitter]={duty:cmd.duty,target:cmd.target||null,by:audit.actor,at:now};
  }else if(cmd.type==='policy'){
    need(capo,403,'Skull Capo permission required');
    need(['legacy','bse'].includes(cmd.metric)&&Number.isInteger(cmd.holdMinutes)&&cmd.holdMinutes>=5&&cmd.holdMinutes<=120&&Array.isArray(cmd.manual)&&cmd.manual.length<=100&&cmd.manual.every(id),400,'Invalid policy');
    plan.policySet=true;plan.policy=cmd.metric;plan.holdMinutes=cmd.holdMinutes;plan.manual=[...new Set(cmd.manual)];
  }else throw message(400,'Unknown coordination command');
  audit.changes=transition(room,now);
  return audit;
}
function visibleRoom(room,actor){
  if(actor.role!=='member')return room;
  const mine=actor.id,a=room.plan.duties[mine],target=a?.target;
  const select=(all,key)=>key&&all[key]?{[key]:all[key]}:{};
  return {plan:{...room.plan,manual:[],assignments:select(room.plan.assignments,target),duties:select(room.plan.duties,mine)},
    ops:{claims:select(room.ops.claims,target),roll:select(room.ops.roll,mine),states:select(room.ops.states,target),observations:{}}};
}
export async function commandRoute(request,env,scope,actor,reply){
  const now=Date.now(),[f,w]=scope;
  const current=await env.DB.prepare('SELECT revision,plan,operations,updated FROM war_command WHERE faction=? AND war=?').bind(f,w).first();
  const revision=current?.revision||0,room=current?{plan:JSON.parse(current.plan),ops:JSON.parse(current.operations)}:emptyRoom();
  if(request.method==='GET'){
    prune(room.ops,now);
    for(const [target,s] of Object.entries(room.ops.states)){
      if(s.since!=null&&now-s.since>=graceMs&&s.phase==='UNAVAILABLE_PENDING')s.phase='REASSIGNMENT_READY';
      else if(!s.since&&s.verified&&now-s.verified>freshMs)s.phase='UNKNOWN_STATUS';
    }
    const events=actor.role==='member'?{results:[]}:await env.DB.prepare("SELECT revision,at,event FROM war_command_event WHERE faction=? AND war=? AND (json_extract(event,'$.type')!='observe' OR json_array_length(event,'$.changes')>0) ORDER BY revision DESC LIMIT 30").bind(f,w).all();
    return reply({schema:1,revision,now,...visibleRoom(room,actor),actor,events:events.results.map(e=>({...e,event:JSON.parse(e.event)}))});
  }
  need(actor.role!=='reader',403,'Read-only credential');
  const expected=request.headers.get('If-Match');
  need(expected!==null&&/^\d+$/.test(expected),428,'If-Match revision required');
  need(Number(expected)===revision,409,'Revision conflict. Refresh orders.');
  const declared=Number(request.headers.get('Content-Length'));
  need(!declared||declared<=48000,413,'Payload too large');
  const reader=request.body?.getReader();need(reader,400,'Missing body');
  const decoder=new TextDecoder();let body='',bytes=0;
  for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.length;
    if(bytes>48000){await reader.cancel();throw message(413,'Payload too large');}body+=decoder.decode(part.value,{stream:true});}
  body+=decoder.decode();
  need(body.length<=48000,413,'Payload too large');
  let cmd;try{cmd=JSON.parse(body).data;}catch{throw message(400,'Invalid JSON');}
  const event=commandMutation(room,cmd,actor,now);
  const plan=JSON.stringify(room.plan),ops=JSON.stringify(room.ops);
  if(cmd.type==='observe'&&plan===current?.plan&&ops===current?.operations)return reply({schema:1,revision,now,...visibleRoom(room,actor),actor});
  const args=[plan,ops,now,JSON.stringify(event),f,w];
  const result=revision===0?await env.DB.prepare('INSERT OR IGNORE INTO war_command(plan,operations,updated,event,faction,war,revision) VALUES(?,?,?,?,?,?,1)').bind(...args).run():
    await env.DB.prepare('UPDATE war_command SET plan=?,operations=?,updated=?,event=?,next_cleanup=0,revision=revision+1 WHERE faction=? AND war=? AND revision=?').bind(...args,revision).run();
  need(result.meta.changes===1,409,'Revision conflict. Refresh orders.');
  return reply({schema:1,revision:revision+1,now,...visibleRoom(room,actor),actor,...(actor.role==='member'?{}:{event})});
}
// Housekeeping never calls Torn. An elapsed grace period cannot authorise a switch.
export async function cleanOperationalData(env,now=Date.now()){
  const rows=await env.DB.prepare('SELECT faction,war,revision,operations FROM war_command WHERE next_cleanup<=? ORDER BY next_cleanup LIMIT 12').bind(now).all();
  for(const row of rows.results){
    const ops=JSON.parse(row.operations);prune(ops,now);
    for(const [key,r] of Object.entries(ops.roll))if(now-Math.max(r.at,r.until||0)>7*86400000)delete ops.roll[key];
    if(JSON.stringify(ops)!==row.operations){
      await env.DB.prepare('UPDATE war_command SET operations=?,revision=revision+1,event=?,updated=?,next_cleanup=? WHERE faction=? AND war=? AND revision=?')
        .bind(JSON.stringify(ops),JSON.stringify({type:'cleanup',actor:'server',changes:[]}),now,now+86400000,row.faction,row.war,row.revision).run();
    }else await env.DB.prepare('UPDATE war_command SET next_cleanup=? WHERE faction=? AND war=? AND revision=?')
      .bind(now+7*86400000,row.faction,row.war,row.revision).run();
  }
}
