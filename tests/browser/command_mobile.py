"""Offline Chromium checks of the distributed installer using synthetic Torn rosters."""
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
NOW = int(time.time() * 1000)
def player(i, name, country, status="Okay"):
    return dict(id=i, name=name, status=status, statusText="Abroad in "+country if status=="Abroad" else "Okay",
                daysInFaction=15, lastAt=NOW, lastAction="Online", locationHint=country, updated=NOW, until=0)
cfg = dict(ourId=10, enemyId=20, ffEnabled=True, ffConsent=True, ffKey="offline-fixture", blackSkulls={"1":True}, manualHeavyTargetsByEnemy={"20":{"3":True}})
data = dict(ours=[player(1,"Hitter","Torn"), player(2,"Regular","Canada","Abroad")],
            enemies=[player(3,"Objective","Torn"),player(4,"Visitor","Canada","Abroad")],
            updated=dict(wars=NOW,ours=NOW,enemies=NOW),meta=dict(ownerId=1),
            war=dict(id=7,start=NOW//1000-3600,opponentId=20,opponentName="Rivals",factions=[dict(id=10,score=45),dict(id=20,score=35)],target=500,status="active",observed=NOW),
            attacks=[dict(id=123456,attacker=1,defender=3,attackerFaction=10,defenderFaction=20,at=NOW-300000,result="Stalemate")])

fixture_hour = (NOW // 86400000 - 1) * 24 + 6
data['activity'] = {'enemies:3': {'hours': {str(fixture_hour): {'online': 3, 'count': 4}}}}

def open_view(page, view):
    page.evaluate("(section)=>document.dispatchEvent(new CustomEvent('staxx:open',{detail:{id:'war',section}}))",view)
    page.wait_for_selector("#warstaxx-root .ws-content:visible")
    assert "Panel could not open" not in page.locator(".ws-content").inner_text()

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get("CHROMIUM") or shutil.which("google-chrome") or shutil.which("chromium"),args=["--no-sandbox"])
    context=browser.new_context(viewport={"width":360,"height":780},is_mobile=True,has_touch=True)
    worker=subprocess.Popen(["node",str(ROOT/"tests/browser/worker-fixture.mjs")],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
    history_reads=[]
    def endpoint(request):
        url=urlsplit(request["url"])
        if url.hostname=="ffscouter.com":
            body={"code":0}
            if url.path.endswith("/check-key"):
                body.update(is_registered=True,is_premium=True)
            if url.path.endswith("/activity/player"):
                query=parse_qs(url.query);target=int(query['target'][0])
                history_reads.append(target)
                body.update(meta=dict(subject_type="player",subject_id=target,start=int(query["start"][0]),end=int(query["end"][0]),bucket_seconds=3600,bucket_count=2,truncated=False),
                            buckets=[dict(ts=fixture_hour*3600,activity_score=4),dict(ts=(fixture_hour+1)*3600,activity_score=3)])
            if url.path.endswith("/activity/faction"):
                query=parse_qs(url.query);faction=int(query["faction_id"][0])
                body.update(meta=dict(subject_type="faction",subject_id=faction,start=int(query["start"][0]),end=int(query["end"][0]),bucket_seconds=3600,bucket_count=1,truncated=False,member_count=12),
                            buckets=[dict(ts=fixture_hour*3600,activity_score=8,active_players=4 if faction==20 else 2)])
            return {"status":200,"responseText":json.dumps(body)}
        if "fixture.workers.dev" not in request["url"]:
            return {"status":503,"responseText":"{}"}
        worker.stdin.write(json.dumps(request)+"\n");worker.stdin.flush()
        return json.loads(worker.stdout.readline())
    context.expose_function("offlineWorker",endpoint)
    context.add_init_script("""window.PDA_httpGet=(url,headers)=>window.offlineWorker({url,method:'GET',headers});window.PDA_httpPut=(url,headers,body)=>window.offlineWorker({url,method:'PUT',headers,body});""")
    cfg['shared']={"enabled":True,"endpoint":"https://fixture.workers.dev","token":"fixture-writer","canWrite":True}
    errors=[]
    page=context.new_page()
    page.on("pageerror",lambda exc:errors.append(str(exc)))
    context.route("**/*",lambda route:route.fulfill(status=200,content_type="text/html",body='<meta name="viewport" content="width=device-width,initial-scale=1"><main id="native">Torn fixture</main>') if route.request.is_navigation_request() else route.abort())
    page.goto("https://www.torn.com/factions.php")
    page.evaluate("([cfg,data])=>{localStorage.setItem('warstaxx-config-v1',JSON.stringify(cfg));localStorage.setItem('warstaxx-data-v1',JSON.stringify(data));}",[cfg,data])
    def inject():
        if len(sys.argv)>1: page.add_script_tag(path=str(Path(sys.argv[1]).resolve()))
        page.add_script_tag(path=str(ROOT/"WarStaxx.user.js"))
        page.wait_for_function("window.__warStaxxReady===true")
    inject()
    page.add_script_tag(path=str(ROOT/"WarStaxx.user.js"))
    assert page.locator("#warstaxx-root").count()==1
    for view,expected in [('overview','Leading'),('enemy','Canada'),('reports','Tools'),('squad','Objective'),('heatmap','Our faction'),('flights','All 11'),('brief','Tactical briefing'),('combat','unique attacks')]:
        open_view(page,view)
        text=page.locator(".ws-content").inner_text()
        assert expected.lower() in text.lower(),(view,text[:600])
        assert page.locator(".ws-content").evaluate("e=>e.scrollWidth<=e.clientWidth+2"),(view,"horizontal overflow")
    assert "1 unique attacks" in page.locator(".ws-content").inner_text()
    open_view(page,"enemy")
    page.locator('[data-action="workspace-side:ours"]').click()
    page.locator("#ws-roster-sort").select_option("war")
    effort=page.locator(".ws-player-row").filter(has_text="Hitter").locator(".ws-effort")
    assert "1 / ~25 E" in effort.inner_text()
    assert "Total attack E".lower() in effort.inner_text().lower()
    assert '100%' in effort.inner_text()
    assert 'Pts / 100 E'.lower() in effort.inner_text().lower()
    effort.locator(".ws-flight-log summary").click()
    assert "Flight records unavailable" in effort.inner_text()
    assert effort.evaluate('e=>e.closest("article").scrollWidth<=e.closest("article").clientWidth+2')
    assert effort.evaluate("e=>e.scrollWidth<=e.clientWidth+2")
    page.locator('[data-action="workspace-side:enemies"]').click()
    page.locator("#ws-roster-sort").select_option("status")
    # Both entry points show the date grid. Scope both aggregate counts and named evidence.
    open_view(page, "activity")
    grid=page.locator('.ws-hour-scroll')
    assert grid.locator('table').count()==2
    assert 'Enemy faction' in grid.locator('table').first.get_attribute('aria-label')
    page.locator('#ws-cmd-first').select_option('ours')
    assert 'Our faction' in grid.locator('table').first.get_attribute('aria-label')
    assert grid.evaluate('e=>{const t=[...e.querySelectorAll("table")];return [...t[0].rows[0].cells].every((c,i)=>Math.abs(c.getBoundingClientRect().x-t[1].rows[0].cells[i].getBoundingClientRect().x)<1)}')

    assert grid.locator('table').nth(1).locator('tbody tr').count()==14
    assert grid.locator('table').nth(1).locator('thead th').count()==25
    midnight=(fixture_hour-6)*3600000
    key=f'{midnight}/6'
    enemy_cell=grid.locator(f'[data-action="cmd-cell:enemies/{key}"]')
    page.wait_for_function("(selector)=>document.querySelector(selector)?.textContent==='4'",arg=f'[data-action="cmd-cell:enemies/{key}"]')
    enemy_cell.click()
    assert 'FFScouter faction activity' in grid.locator('.ws-grid-detail').inner_text()
    assert 'Objective' in grid.locator('.ws-grid-detail').inner_text()
    page.get_by_role('button',name='Compare',exact=True).click()
    assert grid.locator(f'[data-action="cmd-cell:compare/{key}"]').inner_text()=='-2'
    page.get_by_role('button',name='Weekday avg').click()
    assert grid.locator('table').first.locator('tbody tr').count()==8
    page.get_by_role('button',name='Hour grid').click()
    page.locator('#ws-cmd-idle').check()
    assert enemy_cell.inner_text()=='1'
    page.locator('#ws-cmd-idle').uncheck()
    assert enemy_cell.inner_text()=='4'
    page.get_by_role('button',name='Heavy hitters',exact=True).click()
    span=page.locator('#ws-cmd-heavy-span')
    assert span.input_value()=='14' and grid.locator('tbody tr').count()==14
    assert grid.locator('thead th').count()==25
    span.select_option('7')
    assert grid.locator('tbody tr').count()==7
    assert grid.evaluate("e=>e.scrollWidth>e.clientWidth && e.parentElement.scrollWidth<=e.parentElement.clientWidth+2")
    page.locator('#ws-cmd-heavy-player').select_option('3')
    key_hour=f'[data-action="cmd-heavycell:range/{(fixture_hour+1)*3600000}"]'
    page.wait_for_function("(selector)=>document.querySelector(selector)?.textContent==='1'",arg=key_hour)
    grid.locator(key_hour).click()
    assert 'Objective' in grid.locator('.ws-grid-detail').inner_text()
    assert 'Individual scanner activity' in grid.locator('.ws-grid-detail').inner_text()
    page.locator('#ws-cmd-heavy-evidence').select_option('online')
    assert grid.locator(key_hour).inner_text()=='\u2013'
    assert grid.locator(f'[data-action="cmd-heavycell:range/{fixture_hour*3600000}"]').inner_text()=='1'
    grid.locator(f'[data-action="cmd-heavyday:{midnight}"]').click()
    assert span.input_value()=='day' and page.locator('#ws-heavy-date').input_value()==str(midnight)
    row=grid.locator('tbody tr').first
    assert 'Objective' in row.inner_text() and 'Visitor' not in grid.inner_text()
    observed=row.locator(f'[data-action="cmd-heavycell:3/{fixture_hour*3600000}"]')
    assert observed.inner_text()=='ON'
    scanned=row.locator(f'[data-action="cmd-heavycell:3/{(fixture_hour+1)*3600000}"]')
    page.wait_for_function("(selector)=>document.querySelector(selector)?.textContent==='S'",arg=f'[data-action="cmd-heavycell:3/{(fixture_hour+1)*3600000}"]')
    scanned.click()
    assert 'Individual FFScouter score 3' in grid.locator('.ws-grid-detail').inner_text()
    observed.click()
    assert 'Observed online during this hour' in grid.locator('.ws-grid-detail').inner_text()
    row.get_by_role('button',name='Objective',exact=True).click()
    assert 'Designated by Skull Capo' in grid.locator('.ws-grid-detail').inner_text()
    grid.get_by_role('button',name='Show latest online hour').click()
    assert page.locator('#ws-heavy-date').input_value()==str((NOW//86400000)*86400000)
    assert 'Online sighting at' in grid.locator('.ws-grid-detail').inner_text()
    assert history_reads==[3]
    assert grid.evaluate("e=>e.scrollWidth>e.clientWidth && e.parentElement.scrollWidth<=e.parentElement.clientWidth+2")
    page.get_by_role('button',name='Hour grid').click()
    page.locator('details[data-ws-disclosure="enemy-brief"] summary').click()
    assert 'Visitor' in page.locator('.ws-content').inner_text()
    assert 'in Canada' in page.locator('.ws-content').inner_text()
    page.locator('details[data-ws-disclosure="old-activity"] summary').click()
    page.locator('[data-action="hour:6"]').click()
    detail = page.locator('#ws-enemy-hour-detail')
    assert '06:00-06:59 TCT' in detail.inner_text()
    detail.get_by_role('button', name='Objective').first.click()
    assert 'stalemates' in page.locator('.ws-content').inner_text().lower()
    open_view(page,"enemy")
    assert page.locator('.ws-country-title').all_text_contents()==["Torn","Canada"]
    page.locator('.ws-roster-grid details[data-ws-disclosure^="roster-"] summary').first.click()
    assert page.locator('.ws-roster-grid details[open]').count()==1
    assert 'Your attack / Stalemate' in page.locator('.ws-roster-grid details[open]').inner_text()
    open_view(page,'heatmap')
    scroll=page.locator('.ws-hour-scroll').first
    assert scroll.evaluate("e=>{const th=e.querySelector('tbody th');const x=th.getBoundingClientRect().x;e.scrollLeft=140;return e.scrollLeft>0&&Math.abs(th.getBoundingClientRect().x-x)<2}")
    page.locator("#ws-cmd-days").select_option("3")
    assert scroll.evaluate("e=>e.scrollLeft")>0
    assert scroll.locator('table').first.locator('tbody tr').count()==3
    assert "3 UTC dates" in page.locator(".ws-content").inner_text()
    page.locator('details[data-ws-disclosure="grid-filters"] summary').click()
    with page.expect_download() as export:
        page.get_by_role('button',name='Export CSV').click()
    lines=Path(export.value.path()).read_text().splitlines()
    assert len(lines)==1+2*3*24
    assert any(line.startswith('20,') and ',users,false,4,,,' in line for line in lines)
    open_view(page,'flights')
    page.locator('#ws-cmd-method').select_option('Airstrip');page.locator('#ws-cmd-book').select_option('no')
    page.get_by_role('button',name='Compare routes').click()
    page.reload();inject();open_view(page,'flights')
    assert page.locator('#ws-cmd-method').input_value()=='Airstrip'
    open_view(page,'combat')
    assert '1 unique attacks' in page.locator('.ws-content').inner_text()
    open_view(page,'squad')
    page.get_by_role('button',name='Heavy hitter activity').click()
    assert page.locator('#ws-cmd-heavy-span').input_value()=='7'
    assert grid.locator('tbody tr').count()==7
    page.get_by_text('last full hour for 1 / 1 targets',exact=False).wait_for()
    assert history_reads==[3]
    # The role is resolved from the bearer by the Worker, never by a UI role label.
    open_view(page,'squad')
    page.locator('details[data-ws-disclosure="target-3"] summary').click()
    page.get_by_role('button',name='Publish assignment').wait_for()
    page.get_by_role('button',name='Publish assignment').click()
    page.get_by_role('button',name='Lock',exact=True).wait_for()
    page.get_by_role('button',name='Lock',exact=True).click()
    page.get_by_role('button',name='Unlock',exact=True).wait_for()
    page.evaluate("""()=>{const c=JSON.parse(localStorage.getItem('warstaxx-config-v1'));c.shared.token='fixture-hitter';c.shared.canWrite=false;localStorage.setItem('warstaxx-config-v1',JSON.stringify(c));}""")
    page.reload();inject();open_view(page,'squad')
    page.locator('details[data-ws-disclosure="target-3"] summary').click()
    page.get_by_role('button',name='Claim for 3 minutes').click()
    page.get_by_role('button',name='Release claim').wait_for()
    assert page.get_by_role('button',name='Unlock',exact=True).count()==0
    page.get_by_role('button',name='Release claim').click()
    page.get_by_role('button',name='Claim for 3 minutes').wait_for()
    open_view(page,'combat')
    backup={"schema":1,"people":[{"id":3,"at":NOW,"name":"Renamed opponent","memberships":[{"faction":20,"first":NOW-600000,"last":NOW}]}],
            "fights":[dict(data['attacks'][0],ff=2.1),dict(id=123457,attacker=3,defender=1,at=NOW-200000,result='Lost')]}
    page.locator('#ws-cmd-import').set_input_files({"name":"fixture.json","mimeType":"application/json","buffer":json.dumps(backup).encode()})
    page.get_by_role('button',name='Merge backup').click()
    page.get_by_text('2 unique attacks',exact=False).first.wait_for()
    open_view(page,'enemy');page.locator('[data-action="player:3"]').first.click()
    assert 'stalemates' in page.locator('.ws-content').inner_text().lower()
    page.goto('https://www.torn.com/loader.php?sid=attack&user2ID=3')
    inject()
    assert page.locator('#warstaxx-root').is_hidden()
    assert page.locator('#native').is_visible()
    # Native war screen, upgraded mid-war with a previously skipped anonymous ranked hit.
    page.goto('https://www.torn.com/factions.php#/war/7')
    roster_html='<div class="faction-war">'+''.join(
        '<ul class="members-list">'+''.join(
            f'<li class="{side}" data-player_id="{i}"><div class="member">Member {i}</div><div class="status">Okay</div></li>'
            for i in ids)+'</ul>' for side,ids in [('your',[1,2]),('enemy',[3,4])])+'</div>'
    page.locator('#native').evaluate("(el,html)=>el.innerHTML=html",roster_html)
    start=data['war']['start']
    page.evaluate('''start=>new Promise((resolve,reject)=>{
      const req=indexedDB.open('warstaxx-intelligence',1);
      req.onsuccess=()=>{
        const db=req.result, tx=db.transaction('hours','readwrite'), at=start*1000;
        tx.objectStore('hours').put({id:['war-flights',7,at,10,1,0].join('/'),source:'war-flights',war:7,faction:10,player:1,
          hour:Math.floor(Date.now()/3600000)*3600000,lastCheck:at+90000,legs:[{after:at+30000,first:at+60000,last:at+80000,country:'Japan'}]});
        tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error);
      };req.onerror=()=>reject(req.error);
    })''',start)
    data['war']['factions']=[dict(id=10,score=93),dict(id=20,score=23)]
    data['concededWars']={"7":dict(version=4,warId=7,ourId=10,enemyId=20,start=start*1000,cursor=NOW//1000,
        total=14.6,rows=1,ourTotal=0,ourRows=0,fetches=1,lastFetch=NOW,caughtUpAt=NOW,complete=True,
        seen={"101":1},byMember={"1":dict(id=1,attacks=1,scoringAttacks=1,enemyScore=14.6)},byAttacker={},enemyAttackers={},winsByDefender={})}
    page.evaluate("""([data,cfg])=>{
      localStorage.setItem('warstaxx-data-v1',JSON.stringify(data));
      localStorage.setItem('warstaxx-config-v1',JSON.stringify({...cfg,key:'fixture',factionAuto:false,ffEnabled:false,shared:{enabled:false}}));
      window.GM_xmlhttpRequest=r=>{
        const path=new URL(r.url).pathname;
        const hit=(id,defender,points,attacker)=>({id,started:data.war.start+12,ended:data.war.start+15,
          attacker,defender:{id:defender,faction:{id:10}},is_ranked_war:true,respect_gain:points,result:'Hospitalized'});
        let body={};
        if(path.endsWith('/wars'))body={wars:{ranked:data.war}};
        if(path.endsWith('/members'))body={members:(path.includes('/10/')?data.ours:data.enemies).map(p=>({id:p.id,name:p.name,status:{state:'Okay'},last_action:{status:'Online'}}))};
        if(path.endsWith('/faction/attacks'))body={attacks:[hit(101,1,14.6,{id:3,faction:{id:20}}),hit(102,2,8.45,null),
          {...hit(103,99,0,{id:1,faction:{id:10}}),is_ranked_war:false,defender:{id:99,faction:{id:30}},result:'Stalemate'}]};
        setTimeout(()=>r.onload({status:200,responseText:JSON.stringify(body)}),0);
      };
    }""",[data,cfg])
    inject()
    summary=page.locator('.wsnw-faction-summary')
    summary.get_by_text('G 23',exact=True).wait_for()
    assert 'NET +70' in summary.inner_text()
    assert '8.4 unaccounted' in summary.inner_text()
    member=page.locator('li.your[data-player_id="2"]')
    assert member.locator('[data-wsnw-chip="given"]').inner_text()=='—'
    page.wait_for_function("""()=>document.querySelector('li[data-player_id="2"] [data-wsnw-chip="given"]')?.textContent==='8.45'""")
    assert '23.05 traced to defenders' in summary.inner_text()
    assert 'unaccounted' not in summary.inner_text()
    member.locator('[data-wsnw-chip="given"]').click()
    assert 'Attacker hidden or unknown / Hospitalized / 8.45 given' in member.inner_text()
    native_log=member.locator('.wsnw-expanded-detail .ws-flight-log')
    native_log.locator('summary').click()
    assert native_log.evaluate('e=>e.open') and member.locator('.wsnw-expanded-detail').is_visible()
    native_log.locator('summary').focus()
    native_log.locator('summary').press('Enter')
    assert not native_log.evaluate('e=>e.open')
    assert member.locator('.wsnw-expanded-detail').evaluate('e=>e.scrollWidth<=e.clientWidth+2')
    print('Native score reconciliation passed at 360px: official score, honest gap, automatic replay and defender evidence.')
    view=page.get_by_role('button',name='Energy and flights roster view')
    countries=page.locator('[data-wsnw-action="countries"]')
    friendly=page.locator('li.your[data-player_id="1"]')
    enemy=page.locator('li.enemy[data-player_id="3"]')
    assert countries.evaluate('e=>e.nextElementSibling.dataset.wsnwAction')=='roster-view'
    assert view.get_attribute('aria-pressed')=='false'
    assert enemy.locator('[data-wsnw-chip="outgoing"]').inner_text()=='1'
    headings=page.locator('li.wsnw-country-heading').all_text_contents()
    assert headings
    view.click()
    assert view.get_attribute('aria-pressed')=='true'
    assert countries.get_attribute('aria-pressed')=='true'
    assert page.locator('li.wsnw-country-heading').all_text_contents()==headings
    assert member.locator('.wsnw-expanded-detail').is_visible()
    for row in [friendly,enemy]:
        assert row.locator('[data-wsnw-chip="war-e"]').inner_text()=='~25 E'
        assert row.locator('[data-wsnw-chip="outgoing"]').count()==0
        assert row.locator('.wsnw-intel').evaluate('e=>e.scrollWidth<=e.clientWidth+2')
    for header in page.locator('.wsnw-legend').all():
        assert 'NON-WAR E' in header.inner_text() and 'FLIGHTS' in header.inner_text()
    assert friendly.locator('[data-wsnw-chip="other-e"]').inner_text()=='~25 E'
    assert friendly.locator('[data-wsnw-chip="flights"]').inner_text()=='1 seen'
    assert enemy.locator('[data-wsnw-chip="other-e"]').inner_text()=='—'
    countries.click()
    assert view.get_attribute('aria-pressed')=='true' and countries.get_attribute('aria-pressed')=='false'
    page.reload()
    page.locator('#native').evaluate("(el,html)=>el.innerHTML=html",roster_html)
    inject()
    view.wait_for()
    assert view.get_attribute('aria-pressed')=='true' and countries.get_attribute('aria-pressed')=='false'
    view.click()
    assert friendly.locator('[data-wsnw-chip="given"]').is_visible() and enemy.locator('[data-wsnw-chip="warpoints"]').is_visible()
    assert enemy.locator('[data-wsnw-chip="outgoing"]').is_visible()
    assert page.locator('[data-wsnw-chip="war-e"]').count()==0
    # The compact faction overview in Torn PDA is a different route from the war roster.
    page.goto('https://www.torn.com/index.php')
    page.goto('https://www.torn.com/factions.php')
    page.evaluate("""data=>{
      const now=Date.now();
      data.war.start=Math.floor(now/1000)-(3*86400+3*3600+33*60+1);
      data.war.factions=[{id:20,name:'Rivals',score:1319},{id:10,name:'Our side',score:2023}];
      data.war.opponentName='Rivals';data.war.target=1392;data.updated.wars=now;
      localStorage.setItem('warstaxx-data-v1',JSON.stringify(data));
      localStorage.setItem('warstaxx-config-v1',JSON.stringify({ourId:10,enemyId:20}));
      document.querySelector('#native').innerHTML='<div class="chain">00:00</div><article id="war-fixture">'+
        '<header>Rivals vs Our side</header><div><b id="left-score">1,319</b><span><small>Lead Target</small><em id="margin">704 / 1,392</em></span><b id="right-score">2,023</b></div>'+
        '<footer style="display:flex;align-items:center;justify-content:space-between"><span>8 / 15</span><time>03:03:33:01</time><span>6 / 11</span></footer></article>';
    }""",data)
    inject()
    note=page.locator('#war-fixture time + #ws-finish-clock')
    assert note.locator('b').inner_text()=='Win in ~23h 27m'
    assert 'if scores hold' in note.inner_text()
    page.locator('#ws-score-energy').filter(has_text='Recorded attack energy: Us ~50 E').wait_for()
    assert page.locator('#war-fixture footer').evaluate('e=>e.scrollWidth<=e.clientWidth')
    page.evaluate("""()=>{document.querySelector('#left-score').textContent='2,023';document.querySelector('#right-score').textContent='1,319';}""")
    note.get_by_text('Loss in ~23h 27m').wait_for(timeout=10000)
    page.evaluate("""()=>{document.querySelector('#margin').textContent='0 / 1,392';document.querySelector('#right-score').textContent='2,023';
      document.querySelector('#war-fixture footer').outerHTML='<footer><time>03:03:33:12</time></footer>';}""")
    note.get_by_text('Tied').wait_for(timeout=10000)
    assert page.locator('#ws-finish-clock').count()==1
    page.locator('#war-fixture').evaluate('el=>el.remove()')
    assert page.locator('#ws-finish-clock').count()==0
    print('Native finish clock passed at 360px: faction overview, winner reversal, tie, card replacement and cleanup.')
    assert not errors, errors
    print('360px Chromium passed: 8 hub routes, installer reinjection, archive reload, country order, inline expansion, horizontal grid, filters, flight settings and attack-page entry.')
    worker.stdin.close();worker.wait(timeout=5)
    print("SQLite Worker + installed client passed: grant discovery, assignment, leadership lock, own claim/release, directional archive import and duplicate ID.")
    browser.close()
