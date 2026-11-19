import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const installer=new URL('WarStaxx.user.js',base);
const source=readFileSync(installer,'utf8');
let result=source;
for(const name of readdirSync(new URL('src/',base)).filter(x=>x.endsWith('.js')).sort()){
  const start='  // BEGIN bundled '+name,end='  // END bundled '+name;
  const block=start+'\n'+readFileSync(new URL('src/'+name,base),'utf8').trimEnd()+'\n'+end;
  if(result.includes(start)){
    const i=result.indexOf(start),j=result.indexOf(end,i);
    if(j<0)throw Error('Missing end marker for '+name);
    result=result.slice(0,i)+block+result.slice(j+end.length);
  }else result=result.replace('  const effectiveKey=',()=>block+'\n  const effectiveKey=');
}
if(process.argv.includes('--check')){
  if(result!==source)throw Error('Rebuild the userscript with npm run build');
}else writeFileSync(installer,result);
