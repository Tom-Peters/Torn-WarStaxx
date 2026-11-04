// Optional WarStaxx shared-orders Cloudflare Worker. NEVER send Torn API keys here.
const ORIGINS=new Set(['https://www.torn.com','https://torn.com']);
function reply(data,status=200,origin=''){
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
    'Access-Control-Allow-Methods':'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers':'Authorization,Content-Type,If-Match'};
  if(ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
  return new Response(status===204?null:JSON.stringify(data),{status,headers});
}
function secureEqual(a,b){
  a=String(a||'');b=String(b||'');if(!a||!b)return false;
  let z=a.length^b.length;
  for(let i=0;i<Math.max(a.length,b.length);i++)z|=a.charCodeAt(i%a.length)^b.charCodeAt(i%b.length);
  return z===0;
}
function validMap(m,kind){
  if(!m||typeof m!=='object'||Array.isArray(m)||Object.keys(m).length>220)return false;
  return Object.entries(m).every(([k,v])=>{
    if(!/^[1-9][0-9]{0,9}$/.test(k))return false;
    if(kind==='assign')return Number.isSafeInteger(v)&&v>=0&&v<=9999999999;
    if(kind==='black')return v===true;
    if(kind==='risk')return !!v&&typeof v==='object'&&['safe','balanced','aggressive'].includes(v.mode);
    if(kind==='control')return Number.isSafeInteger(v)&&v>0&&v<=9999999999;
    return false;
  });
}
function clean(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>
    !['assignments','blackSkulls','hitterRisk','controlAssignments'].includes(k)))return null;
  const data={assignments:input.assignments||{},blackSkulls:input.blackSkulls||{},
    hitterRisk:Object.fromEntries(Object.entries(input.hitterRisk||{}).map(([id,x])=>
      [id,{mode:x?.mode}])),controlAssignments:input.controlAssignments||{}};
  return validMap(data.assignments,'assign')&&validMap(data.blackSkulls,'black')&&
    validMap(data.hitterRisk,'risk')&&validMap(data.controlAssignments,'control')?data:null;
}
export default {async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  if(request.method==='OPTIONS')
    return ORIGINS.has(origin)?reply(null,204,origin):reply({error:'origin not allowed'},403,origin);
  if(origin&&!ORIGINS.has(origin))return reply({error:'origin not allowed'},403,origin);
  const match=new URL(request.url).pathname.match(
    /^\/v1\/factions\/([1-9][0-9]{0,9})\/wars\/([1-9][0-9]{0,9})\/orders$/);
  if(!match||!['GET','PUT'].includes(request.method))
    return reply({error:'not found'},404,origin);
  const auth=request.headers.get('Authorization')||'',
    token=auth.startsWith('Bearer ')?auth.slice(7):'',
    writer=secureEqual(token,env.SHARED_WRITE_TOKEN),
    reader=writer||secureEqual(token,env.SHARED_READ_TOKEN);
  if(!reader)return reply({error:'invalid shared token'},401,origin);
  if(request.method==='PUT'&&!writer)return reply({error:'write permission required'},403,origin);
  if(!env.DB)return reply({error:'D1 database unavailable'},503,origin);
  const faction=Number(match[1]),war=Number(match[2]);
  // A deployed Worker belongs to exactly one faction. Tokens must not
  // grant access to another faction's records on the same Worker.
  if(!Number.isSafeInteger(Number(env.FACTION_ID))||
     Number(env.FACTION_ID)!==faction)
    return reply({error:'faction not permitted on this Worker'},403,origin);
  const read=()=>env.DB.prepare(
    'SELECT revision,data,updated_at FROM faction_orders WHERE faction_id=? AND war_id=?'
  ).bind(faction,war).first();
  if(request.method==='GET'){
    const row=await read();
    return reply({faction,war,revision:row?.revision||0,updatedAt:row?.updated_at||0,
      data:row?JSON.parse(row.data):null},200,origin);
  }
  const expected=Number(request.headers.get('If-Match'));
  if(!request.headers.has('If-Match')||!Number.isSafeInteger(expected)||expected<0)
    return reply({error:'If-Match revision required'},428,origin);
  let body;try{body=await request.json();}catch(_){return reply({error:'Invalid JSON'},400,origin);}
  const data=clean(body?.data),payload=data?JSON.stringify(data):'';
  if(!data)return reply({error:'Invalid shared orders data'},400,origin);
  if(payload.length>80000)return reply({error:'Payload too large'},413,origin);
  const time=Date.now();
  const result=await env.DB.prepare(
    'INSERT INTO faction_orders (faction_id,war_id,revision,data,updated_at) VALUES (?,?,1,?,?) '+
    'ON CONFLICT(faction_id,war_id) DO UPDATE SET revision=faction_orders.revision+1,'+
    'data=excluded.data,updated_at=excluded.updated_at WHERE faction_orders.revision=?'
  ).bind(faction,war,payload,time,expected).run();
  if(result?.meta?.changes!==1){
    const latest=await read();
    return reply({error:'revision conflict',revision:latest?.revision||0},409,origin);
  }
  const latest=await read();
  return reply({faction,war,revision:latest.revision,updatedAt:time,data},200,origin);
}};