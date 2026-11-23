  // Model an unchanged scoreboard at discrete, war-start-aligned target reductions.
  function fixedScoreFinish({start,net,target,opening,rules={},at}){
    if(!Number.isFinite(start)||start<=0||!Number.isFinite(at)||at<start||
       !Number.isFinite(net)||!Number.isFinite(target)||target<=0)return {text:'Awaiting score'};
    const day=rules.mode==='day',manual=rules.decay!=null||rules.after!=null;
    const basis=day?'Day War':manual?'Configured rules':'Standard decay';
    if(rules.mode==='own'||rules.mode==='other'||(rules.condition&&!day&&rules.mode!=='net'&&!manual))
      return {text:'Check war rules'};
    if(net===0)return {text:'Tied',basis};
    const gap=Math.abs(net),side=net>0?'Win':'Loss';
    if(gap>=target)return {text:'Target reached',basis};
    if(day){
      const end=start+24*HOUR;
      return at>=end?{text:'Checking result',basis}:{side,end,basis};
    }
    const rate=rules.decay??1,first=rules.after??24;
    if(!Number.isFinite(rate)||rate<0||rate>100||!Number.isInteger(first)||first<0)
      return {text:'Check war rules'};
    if(rate===0)return {text:'More points needed',basis};
    const steps=Math.max(0,Math.floor((at-start)/HOUR)-first+1);
    const remaining=100-steps*rate;
    if(remaining<=0)return {text:'Check war rules'};
    // A device opened mid-war can use the current target and its elapsed hour.
    // Prefer an initial target observed before decay, or a configured opening.
    const base=rules.opening??opening??target*100/remaining;
    if(!Number.isFinite(base)||base<=0||Math.abs(base*remaining/100-target)>1)
      return {text:'Check target',basis};
    const needed=Math.max(steps+1,Math.ceil((base-gap)*100/(base*rate)-1e-9));
    const end=start+(first+needed-1)*HOUR;
    return {side,end,basis};
  }

  function elapsedSeconds(node){
    const text=node?.textContent?.trim()||'';
    if(text.length>45||!text)return null;
    let match=text.match(/^(\d{1,3})\s*:\s*(\d{1,2})\s*:\s*(\d{2})\s*:\s*(\d{2})$/);
    if(!match&&node.children.length===4){
      const parts=Array.from(node.children,e=>e.textContent.trim());
      if(parts.every(v=>/^\d{1,2}$/.test(v)))match=['',...parts];
    }
    if(!match&&/^\d{8}$/.test(text)&&/time|duration|elapsed/i.test(node.className||node.parentElement?.className||''))
      match=text.match(/^(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if(!match)return null;
    const [days,hours,minutes,seconds]=match.slice(1).map(Number);
    return hours<24&&minutes<60&&seconds<60?((days*24+hours)*60+minutes)*60+seconds:null;
  }

  // Locate the Lead Target card on the faction overview as well as the full war page.
  // The elapsed clock and war start identify the match without relying on CSS hashes.
  let finishAnchor=null,finishNote=null;
  function findFinishAnchor(start,now){
    function clockMatches(clock){
      const seconds=elapsedSeconds(clock);
      return seconds!==null&&Math.abs(now-start-seconds*1000)<=120000;
    }
    if(finishAnchor?.box.isConnected&&finishAnchor.box.contains(finishAnchor.clock)&&finishAnchor.box.contains(finishAnchor.label)&&clockMatches(finishAnchor.clock))return finishAnchor;
    const scope=document.querySelector('#mainContainer')||document.body;
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
    for(let text=walker.nextNode();text;text=walker.nextNode()){
      if(!/^\s*lead(?:\s*target(?:\s*[\d,]+\s*\/\s*[\d,]+)?)?\s*$/i.test(text.nodeValue))continue;
      const label=text.parentElement;
      if(label.closest('#warstaxx-root,#warstaxx-live-strip,script,style'))continue;
      let box=label;
      for(let i=0;box&&i<9&&box!==scope&&box!==document.body;i++,box=box.parentElement){
        if(box.childElementCount>40||box.textContent.length>3500)break;
        if(!/lead\s*target/i.test(box.textContent))continue;
        let clock=Array.from(box.querySelectorAll('*')).reverse().find(clockMatches);
        if(clock){
          while(clock.parentElement!==box&&clock.parentElement.matches('span,time,[class*="timer" i],[class*="elapsed" i]')&&
            clockMatches(clock.parentElement))clock=clock.parentElement;
          return {label,clock,box};
        }
      }
    }
    return null;
  }
  function shownWarTarget(anchor){
    // Read the margin/target pair beside the label before reaching the footer's roster counts.
    for(let el=anchor.label;el;el=el.parentElement){
      const tokens=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),parts=[];
      for(let t=tokens.nextNode();t;t=tokens.nextNode())parts.push(t.nodeValue);
      const m=parts.join(' ').match(/lead\s*target\s*([\d,]+)\s*\/\s*([\d,]+)/i);
      if(m)return {block:el,lead:Number(m[1].replace(/,/g,'')),target:Number(m[2].replace(/,/g,''))};
      if(el===anchor.box)break;
    }
    return null;
  }
  function widgetMargin(anchor,shown,w,score){
    if(!shown)return null;
    const ours=w.factions?.find(f=>f.id===positive(cfg.ourId))?.name?.toLowerCase();
    const theirs=w.opponentName?.toLowerCase();
    if(ours&&theirs&&!ours.includes(theirs)&&!theirs.includes(ours)){
      // Torn puts its two faction scores on either side of the central lead target.
      const row=shown.block.parentElement;
      if(row&&anchor.box.contains(row)){
        const numbers=Array.from(row.querySelectorAll('span,div,b,strong,p')).filter(el=>
          !el.childElementCount&&!shown.block.contains(el)&&/^[\d,]+$/.test(el.textContent.trim()));
        if(numbers.length===2&&(numbers[0].compareDocumentPosition(shown.block)&Node.DOCUMENT_POSITION_FOLLOWING)&&
          (numbers[1].compareDocumentPosition(shown.block)&Node.DOCUMENT_POSITION_PRECEDING)){
          const [left,right]=numbers.map(e=>Number(e.textContent.trim().replace(/,/g,'')));
          const header=(anchor.box.innerText||'').toLowerCase();
          const a=header.indexOf(ours),b=header.indexOf(theirs);
          if(a>=0&&b>=0&&Math.abs(left-right)===shown.lead)return a<b?left-right:right-left;
        }
      }
    }
    return score&&Math.abs(score.net)===shown.lead?score.net:null;
  }
  function syncFinishClock(){
    const w=state.data.war,now=Date.now();
    const viewed=location.pathname==='/factions.php'?positive(new URLSearchParams(location.search).get('ID')):0;
    const factionPage=(!viewed||viewed===cfg.ourId||viewed===w?.opponentId)&&location.pathname==='/factions.php'&&cfg.nativeWarEnabled!==false&&activeWarNow()&&w?.start>0;
    finishAnchor=factionPage?findFinishAnchor(w.start*1000,now):null;
    if(!finishAnchor){
      finishNote?.remove();finishNote=null;return;
    }
    const shown=shownWarTarget(finishAnchor),score=warScore(),rules=localWarRules();
    const entry=state.data.scoreTimelines?.[w.id]?.firstTarget;
    const opening=entry?.at<w.start*1000+(rules.after??24)*HOUR?entry.value:null;
    const net=widgetMargin(finishAnchor,shown,w,score);
    const result=net!==null?
      fixedScoreFinish({start:w.start*1000,net,target:shown.target,opening,rules,at:now}):
      {text:'Checking score'};
    if(!finishNote){
      finishNote=document.createElement('span');finishNote.id='ws-finish-clock';
      finishNote.style.cssText='display:inline-grid;vertical-align:middle;margin-inline-start:4px;text-align:center;font:600 11px/1.1 system-ui;color:#cdefff;pointer-events:none;white-space:nowrap';
      finishNote.append(document.createElement('b'),document.createElement('small'));
    }
    const minutes=result.end?Math.max(0,Math.ceil((result.end-now)/MIN)):0;
    const duration=minutes>=60?Math.floor(minutes/60)+'h '+minutes%60+'m':minutes+'m';
    const line=result.end?result.side+' in ~'+duration:result.text;
    const sub=result.end?'if scores hold':'';
    if(finishNote.firstChild.textContent!==line)finishNote.firstChild.textContent=line;
    if(finishNote.lastChild.textContent!==sub)finishNote.lastChild.textContent=sub;
    finishNote.style.color=result.side==='Loss'?'#ffc1b9':result.side==='Win'?'#acedd0':'#cdefff';
    finishNote.setAttribute('aria-label',result.end?line+' if scores hold. '+result.basis+' estimate, '+stamp(result.end):line);
    if(finishAnchor.clock.nextElementSibling!==finishNote)finishAnchor.clock.after(finishNote);
  }
