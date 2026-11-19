// Run locally after verifying the member controls the specified Torn identity.
import {randomBytes,createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync,realpathSync} from 'node:fs';
import {isAbsolute,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const [directory,idText,role]=process.argv.slice(2),id=Number(idText);
if(!directory||!isAbsolute(directory)||!Number.isSafeInteger(id)||id<=0||
   !['member','skull','officer','capo','revoke'].includes(role))
  throw Error('Usage: node scripts/member-grant.mjs /absolute/private/directory TORN_ID member|skull|officer|capo|revoke');
mkdirSync(directory,{recursive:true,mode:0o700});
const repo=realpathSync(fileURLToPath(new URL('../',import.meta.url))),outside=relative(repo,realpathSync(directory));
if(!outside.startsWith('..'+sep)&&outside!=='..')throw Error('Choose a private directory outside the checkout');
const path=join(directory,'grants.json'),grants=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{};
for(const [k,v] of Object.entries(grants))if(v.id===id||v.expires<=Date.now())delete grants[k];
if(role!=='revoke'){
  const token=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(token).digest('hex');
  grants[hash]={id,faction:57819,role,expires:Date.now()+7*86400000};
  writeFileSync(join(directory,'delivery-'+id+'-'+Date.now()+'.txt'),token,{mode:0o600,flag:'wx'});
}
const temp=path+'.'+randomBytes(8).toString('hex');
writeFileSync(temp,JSON.stringify(grants),{mode:0o600,flag:'wx'});renameSync(temp,path);
console.log('Private grant list prepared. Install the complete grants.json as the MEMBER_GRANTS Worker secret.');
