"""Offline Chromium checks of the distributed installer using synthetic Torn rosters."""
import json
import os
import shutil
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
NOW = int(time.time() * 1000)
def player(i, name, country, status="Okay"):
    return dict(id=i, name=name, status=status, statusText="Abroad in "+country if status=="Abroad" else "Okay",
                lastAt=NOW, lastAction="Online", locationHint=country, updated=NOW, until=0)
cfg = dict(ourId=10, enemyId=20, blackSkulls={"1":True}, manualHeavyTargetsByEnemy={"20":{"3":True}})
data = dict(ours=[player(1,"Hitter","Torn"), player(2,"Regular","Canada","Abroad")],
            enemies=[player(3,"Objective","Torn"),player(4,"Visitor","Canada","Abroad")],
            updated=dict(wars=NOW,ours=NOW,enemies=NOW),meta=dict(ownerId=1),
            war=dict(id=7,start=NOW//1000-3600,opponentId=20,opponentName="Rivals",factions=[dict(id=10,score=45),dict(id=20,score=35)],target=500,status="active",observed=NOW),
            attacks=[dict(id=123456,attacker=1,defender=3,attackerFaction=10,defenderFaction=20,at=NOW-300000,result="Stalemate")])

def open_view(page, view):
    page.evaluate("(section)=>document.dispatchEvent(new CustomEvent('staxx:open',{detail:{id:'war',section}}))",view)
    page.wait_for_selector("#warstaxx-root .ws-content:visible")
    assert "Panel could not open" not in page.locator(".ws-content").inner_text()

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get("CHROMIUM") or shutil.which("google-chrome") or shutil.which("chromium"),args=["--no-sandbox"])
    context=browser.new_context(viewport={"width":360,"height":780},is_mobile=True,has_touch=True)
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
    assert page.locator('.ws-country-title').all_text_contents()==["Torn","Canada"]
    page.locator('.ws-roster-grid details summary').first.click()
    assert page.locator('.ws-roster-grid details[open]').count()==1
    open_view(page,'heatmap')
    scroll=page.locator('.ws-hour-scroll').first
    assert scroll.evaluate("e=>{e.scrollLeft=140;return e.scrollLeft>0}")
    page.locator("#ws-cmd-days").select_option("3")
    page.get_by_role("button",name="Apply filters").click()
    assert "3 UTC dates" in page.locator(".ws-content").inner_text()
    open_view(page,'flights')
    page.locator('#ws-cmd-method').select_option('Airstrip');page.locator('#ws-cmd-book').select_option('no')
    page.get_by_role('button',name='Compare routes').click()
    page.reload();inject();open_view(page,'flights')
    assert page.locator('#ws-cmd-method').input_value()=='Airstrip'
    open_view(page,'combat')
    assert '1 unique attacks' in page.locator('.ws-content').inner_text()
    page.goto('https://www.torn.com/loader.php?sid=attack&user2ID=3')
    inject()
    assert page.locator('#warstaxx-root').is_hidden()
    assert page.locator('#native').is_visible()
    assert not errors, errors
    print('360px Chromium passed: 8 hub routes, installer reinjection, archive reload, country order, inline expansion, horizontal grid, filters, flight settings and attack-page entry.')
    browser.close()
