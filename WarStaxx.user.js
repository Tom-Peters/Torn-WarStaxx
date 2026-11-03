// ==UserScript==
// @name         Torn WarStaxx - Ranked War Intelligence
// @namespace    https://github.com/Tom-Peters/Torn-WarStaxx
// @homepageURL  https://github.com/Tom-Peters/Torn-WarStaxx
// @supportURL   https://github.com/Tom-Peters/Torn-WarStaxx/issues
// @version      0.1.2
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
/* StaxxHub v3.4 · shared Torn PDA launcher · IamEEKY · no external dependencies */
(function () {
  "use strict";
  if (typeof location === "undefined" || typeof document === "undefined" ||
      !document.documentElement || typeof document.createElement !== "function" ||
      !/^(www\.)?torn\.com$/i.test(location.hostname) || window.top !== window.self) return;
  function startHub() {
    if (document.getElementById("staxx-hub-root")) return;
    const root = document.createElement("div");
    root.id = "staxx-hub-root";
    root.innerHTML =
      '<button type="button" id="staxx-hub-toggle" aria-label="Open Staxx tools" aria-expanded="false"><b>S</b><span id="staxx-hub-count" hidden></span></button>' +
      '<div id="staxx-hub-veil" hidden></div>' +
      '<aside id="staxx-hub-drawer" aria-label="Staxx tools and notifications" hidden>' +
      '<header class="staxx-head"><div><strong>Staxx<span>Hub</span></strong><small>YOUR TORN COMMAND CENTRE</small></div><div class="staxx-head-actions"><button type="button" data-hub-find aria-label="Find tools, sections and actions" aria-expanded="false" title="Find tools and actions">⌕</button><button type="button" data-hub-close aria-label="Close sidebar">×</button></div></header>' +
      '<nav class="staxx-main-tabs" aria-label="StaxxHub sections"><button type="button" data-hub-view="today" aria-pressed="true">Today</button><button type="button" data-hub-view="dashboard" aria-pressed="false">Dashboard</button><button type="button" data-hub-view="activity" aria-pressed="false">Activity</button><button type="button" data-hub-view="tools" aria-pressed="false">Tools</button><button type="button" data-hub-view="alerts" aria-pressed="false">Alerts</button><button type="button" data-hub-view="more" aria-pressed="false">More</button></nav>' +
      '<section id="staxx-hub-find" aria-label="Find Staxx tools and actions" hidden><label for="staxx-hub-find-input">FIND TOOLS, ACTIONS &amp; ALERTS</label><input id="staxx-hub-find-input" type="search" maxlength="100" autocomplete="off" spellcheck="false" placeholder="e.g. trains, stocks, gym" aria-controls="staxx-hub-find-results"><p id="staxx-hub-find-status" role="status" aria-live="polite"></p><div id="staxx-hub-find-results" role="group" aria-label="Search results"></div></section>' +
      '<div class="staxx-scroll">' +
      '<section data-hub-section="today"><section id="staxx-hub-welcome" hidden></section><section id="staxx-hub-source-status" aria-label="Tool evidence status"></section><section id="staxx-hub-page-shortcut" aria-label="Current Torn page shortcut"></section><section id="staxx-hub-early" aria-label="Upcoming source-dated recommendations"></section><section id="staxx-hub-changes" aria-label="Changed source recommendations"></section><section id="staxx-hub-session" aria-label="Available play time"></section><section id="staxx-hub-checklist" aria-label="Daily verified checklist"></section><div class="staxx-label"><h3>BEST NEXT REVIEW</h3><span>From current tool evidence</span></div><section id="staxx-hub-best" aria-label="Best currently available review"></section><div class="staxx-label"><h3>OTHER NEXT STEPS</h3><span>Priority and estimated review time</span></div><div id="staxx-hub-task-filters" role="group" aria-label="Filter actions by urgency"></div><section id="staxx-hub-tasks" aria-label="Prioritised Torn actions"></section><div class="staxx-label"><h3>YOUR SHORTCUTS</h3><span>Learns from your taps</span></div><div id="staxx-hub-frequent"></div><div class="staxx-label"><h3>OPEN A TOOL</h3><span>One tap</span></div><div id="staxx-hub-quick-tools"></div><p class="staxx-trendnote">Marking a recommendation checked only clears your review queue for up to 4 hours. It does not complete a Torn action.</p></section>' +
      '<section data-hub-section="dashboard" hidden><div class="staxx-label"><h3>SUITE DASHBOARD</h3><span>All three helpers</span></div><section id="staxx-hub-daily" aria-label="Daily evidence report"></section><section id="staxx-hub-dashboard"></section></section>' +
      '<section data-hub-section="activity" hidden><div class="staxx-label"><h3>RECENT ACTIVITY</h3><button type="button" data-activity-clear>Clear history</button></div><section id="staxx-hub-activity"></section></section>' +
      '<section data-hub-section="tools" hidden><div class="staxx-label"><h3>YOUR TOOLS</h3><button type="button" data-arrange aria-pressed="false">Reorder</button></div><div id="staxx-hub-tools"></div></section>' +
      '<section data-hub-section="alerts" hidden><div class="staxx-label"><h3>NOTIFICATIONS</h3><span id="staxx-hub-total"></span></div><div id="staxx-hub-alerts"></div></section>' +
      '<section data-hub-section="more" hidden><button class="staxx-overview-switch" type="button" data-overview>▦ &nbsp; Daily dashboard · all tools</button>' +
      '<section id="staxx-hub-overview" hidden></section><button class="staxx-overview-switch" type="button" data-diagnostics>⚙ &nbsp; Tool diagnostics</button><section id="staxx-hub-diagnostics" hidden></section>' +
      '<button class="staxx-context-control" type="button" data-usage-reset>Reset learned shortcuts</button><button class="staxx-context-control" type="button" data-vote-reset>Reset recommendation preferences</button><button class="staxx-context-control" type="button" data-change-clear>Mark all changes seen</button><button class="staxx-context-control" type="button" data-hub-mode>Display: Simple</button><button class="staxx-context-control" type="button" data-hub-guide>Show getting-started guide</button>' +
      '<button class="staxx-context-control" type="button" data-context-toggle>On-page guidance: On</button><p class="staxx-foot">Alerts use last known data · Drag the S tab vertically to reposition · No gameplay actions are submitted automatically</p></section>' +
      '</div></aside>';
    const css = document.createElement("style");
    css.id = "staxx-hub-css";
    css.textContent = [
      '#staxx-hub-root{position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif!important;color:#e7f2ff!important}',
      '#staxx-hub-root *{box-sizing:border-box}#staxx-hub-root [hidden]{display:none!important}#staxx-hub-root button{font:inherit;color:inherit;cursor:pointer}',
      '#staxx-hub-root button:focus-visible{outline:2px solid #73dfff;outline-offset:2px}',
      '#staxx-hub-toggle{position:fixed;left:5px;top:43%;width:43px;height:49px;pointer-events:auto;border:1px solid #69dfff99;border-radius:0 13px 13px 0;background:linear-gradient(150deg,#0b74ba,#082a4a);box-shadow:0 6px 24px #000b;align-items:center;justify-content:center;touch-action:none;user-select:none}',
      '#staxx-hub-toggle b{font-size:22px;font-weight:900;color:#baf1ff}#staxx-hub-count{position:absolute;top:-8px;right:-8px;padding:2px 5px;min-width:20px;border-radius:14px;background:#38cfa9;border:2px solid #08192d;color:#062821;font-size:11px;font-weight:900}',
      '#staxx-hub-toggle.staxx-urgent{border-color:#ff778d;background:linear-gradient(150deg,#a83b54,#4b1734)}#staxx-hub-toggle.staxx-urgent #staxx-hub-count{background:#ff6b83;color:#fff}',
      '#staxx-hub-toggle.staxx-warning{border-color:#ffd17e;background:linear-gradient(150deg,#9b5b19,#433322)}#staxx-hub-toggle.staxx-warning #staxx-hub-count{background:#ffd17e;color:#32220a}',
      '#staxx-hub-veil{position:fixed;inset:0;pointer-events:auto;background:#020a17ba}',
      '#staxx-hub-drawer{position:fixed;inset:0 auto 0 0;width:min(302px,calc(100vw - 36px));height:100vh;height:100dvh;pointer-events:auto;background:#08192d;border-right:1px solid #28506e;box-shadow:10px 0 45px #000b;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top)}',
      '#staxx-hub-drawer .staxx-head{display:flex;align-items:center;justify-content:space-between;padding:15px 13px;background:linear-gradient(120deg,#0c3358,#0b203b);border-bottom:1px solid #28506e;flex-shrink:0}',
      '#staxx-hub-drawer .staxx-head strong{display:block;font-size:20px;font-weight:850;letter-spacing:-.4px}#staxx-hub-drawer .staxx-head strong span{color:#54d7fa}',
      '#staxx-hub-drawer .staxx-head small{font-size:9px;letter-spacing:1px;color:#8fabca}',
      '#staxx-hub-drawer [data-hub-close]{background:#1c3b59;border:0;border-radius:9px;width:34px;height:34px;font-size:24px}',
      '#staxx-hub-drawer .staxx-scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:12px 10px 26px}',
      '#staxx-hub-drawer h3{color:#8faec9;font-size:10px;letter-spacing:1.1px;margin:9px 4px 10px}',
      '#staxx-hub-drawer .staxx-overview-switch{width:100%;text-align:left;background:linear-gradient(120deg,#124a71,#0c2d4b);border:1px solid #4384ad;border-radius:10px;padding:11px;margin-bottom:10px;font-weight:750}',
      '#staxx-hub-drawer .staxx-overview-switch.selected{border-color:#71d9fd;background:#19527b}',
      '#staxx-hub-drawer .staxx-toolrow{display:flex;align-items:center;gap:4px;margin-bottom:8px}#staxx-hub-drawer .staxx-toolrow .staxx-tool{margin-bottom:0;flex:1;min-width:0}#staxx-hub-drawer .staxx-move{height:31px;width:27px;flex:0 0 27px;border-radius:7px;background:#1a4364;border:1px solid #416c8e;color:#ccecff;font-weight:900}#staxx-hub-drawer .staxx-move:disabled{opacity:.25}#staxx-hub-drawer .staxx-tool{display:flex;align-items:center;gap:8px;text-align:left;width:100%;background:#102844;border:1px solid #284b6b;border-radius:11px;padding:10px 8px;min-height:62px;margin-bottom:8px}',
      '#staxx-hub-drawer .staxx-icon{width:35px;height:35px;display:grid;place-items:center;border-radius:9px;background:linear-gradient(135deg,#0b79b9,#123c65);border:1px solid #4f9dc8;color:#cff6ff;font-weight:900;flex-shrink:0;font-size:12px}',
      '#staxx-hub-drawer .staxx-info{flex:1;min-width:0}#staxx-hub-drawer .staxx-info b{display:block;font-size:13px}#staxx-hub-drawer .staxx-info small{display:block;font-size:10px;color:#94b1c9;margin-top:3px;overflow-wrap:anywhere}',
      '#staxx-hub-drawer .staxx-pill{border-radius:14px;background:#1b486c;padding:2px 6px;font-size:11px;font-weight:800;color:#bdeaff}#staxx-hub-drawer .staxx-pill.on{background:#145f58;color:#89edca}',
      '#staxx-hub-drawer .staxx-label{display:flex;align-items:center;justify-content:space-between;margin-top:15px}#staxx-hub-drawer .staxx-label span{color:#a4c1d8;font-size:10px}#staxx-hub-drawer .staxx-label button{background:#173958;border:1px solid #365b79;border-radius:8px;padding:5px 9px;font-size:10px}#staxx-hub-drawer .staxx-label button[aria-pressed="true"]{background:#175f91;color:#fff}',
      '#staxx-hub-drawer .staxx-alert{background:#0e2945;border:1px solid #315977;border-radius:10px;padding:10px;margin-bottom:9px}',
      '#staxx-hub-drawer .staxx-alert.urgent{border-color:#e56785}#staxx-hub-drawer .staxx-alert.warning{border-color:#ae8450}',
      '#staxx-hub-drawer .staxx-alert-title{border:0;background:none;padding:0;text-align:left;width:100%;font-size:12px;font-weight:750;color:#81dbfa!important}',
      '#staxx-hub-drawer .staxx-alert.urgent .staxx-alert-title{color:#ff9bad!important}',
      '#staxx-hub-drawer .staxx-alert span{display:block;color:#daecf9;font-size:12px;margin:5px 0;overflow-wrap:anywhere}',
      '#staxx-hub-drawer .staxx-alert small{display:block;color:#91aec6;font-size:11px;margin:4px 0}',
      '#staxx-hub-drawer .staxx-alert-item{display:block;width:100%;margin:7px 0 3px;padding:9px 10px;background:#123c60;border:1px solid #427b9f;color:#e3f5ff;border-radius:8px;text-align:left;font-size:12px;font-weight:750;line-height:1.35;min-height:38px}#staxx-hub-drawer .staxx-alert-item:focus-visible{outline:2px solid #54d7fa}#staxx-hub-drawer .staxx-alert-description{padding:0 3px 3px}',
      '#staxx-hub-drawer .staxx-alert-actions{display:flex;gap:7px;margin-top:10px}',
      '#staxx-hub-drawer .staxx-snooze-menu{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}#staxx-hub-drawer .staxx-snooze-menu button{background:#174463;border:1px solid #3e7593;border-radius:7px;padding:6px 8px;min-height:32px;font-size:11px}#staxx-hub-drawer .staxx-snooze-menu input{background:#071d32;border:1px solid #527b9b;border-radius:7px;color:#fff;min-width:56px;width:64px;padding:6px;font-size:12px}#staxx-hub-drawer .staxx-snooze-menu label{display:flex;align-items:center;gap:4px;color:#bfd9ec;font-size:11px}#staxx-hub-drawer .staxx-due{font-size:11px;color:#b8e4ff!important;font-weight:700}#staxx-hub-drawer .staxx-spark{display:flex;align-items:end;gap:3px;height:40px;margin:11px 0 4px}#staxx-hub-drawer .staxx-spark span{flex:1;min-width:0;max-width:30px;border-radius:3px 3px 0 0;background:linear-gradient(#50d5f8,#17649c)}#staxx-hub-drawer .staxx-spark span.missing{background:#1e3a52;height:3px!important}#staxx-hub-drawer .staxx-trendnote{font-size:10px!important;color:#9ab5cf!important}#staxx-hub-drawer .staxx-alert-actions button{background:#1c3e5b;border:1px solid #365978;border-radius:8px;padding:6px 9px;font-size:11px;flex:1;min-height:32px}',
      '#staxx-hub-drawer .staxx-empty{color:#9db7cd;background:#0c243e;border:1px dashed #305473;border-radius:10px;font-size:11px;padding:14px 10px}',
      '#staxx-hub-drawer .staxx-overview-card{background:#0d2945;border:1px solid #2d5574;border-radius:11px;padding:11px;margin-bottom:8px}',
      '#staxx-hub-drawer .staxx-overview-card b{color:#83dbfa;font-size:12px}#staxx-hub-drawer .staxx-overview-card p{margin:5px 0;color:#d4eafa;font-size:11px}',
      '#staxx-hub-drawer .staxx-overview-card dl{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 0}',
      '#staxx-hub-drawer .staxx-overview-card dt{font-size:10px;color:#96b6cf}#staxx-hub-drawer .staxx-overview-card dd{font-size:13px;font-weight:750;margin:0;overflow-wrap:anywhere}',
      '#staxx-hub-drawer .staxx-task{width:100%;text-align:left;display:block;border:1px solid #315b79;border-radius:10px;background:#102b46;color:#eef8ff;padding:10px;margin-bottom:8px;line-height:1.45}#staxx-hub-drawer .staxx-task.urgent{border-color:#e56785}#staxx-hub-drawer .staxx-task.soon{border-color:#ae8450}#staxx-hub-drawer .staxx-task b{display:block;font-size:12px}#staxx-hub-drawer .staxx-task small{display:block;font-size:10px;color:#8fb7d2;margin-top:4px}#staxx-hub-drawer .staxx-task .staxx-step{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.4px;color:#67dfff;margin-bottom:4px}#staxx-hub-drawer .staxx-task:focus-visible{outline:2px solid #67dfff}',
      '#staxx-hub-drawer .staxx-foot{font-size:10px;color:#6d90ab;margin-top:17px}#staxx-hub-drawer .staxx-diagnostic-actions{display:flex;gap:8px;margin-bottom:12px}#staxx-hub-drawer .staxx-diagnostic-actions button{flex:1;background:#17496d;border:1px solid #3e789f;border-radius:8px;padding:9px;font-size:11px}#staxx-hub-drawer #staxx-safe-report{width:100%;min-height:130px;white-space:pre;color:#cfeeff;background:#091f34;border:1px solid #5182a3;border-radius:8px;font-size:10px}'
    ].join("");
    css.textContent += '#staxx-hub-drawer .staxx-context-control{display:block;width:100%;background:#0b314e;color:#8bdffc;border:1px solid #315775;border-radius:9px;padding:8px;margin:7px 0 14px;text-align:left}' +
      '#staxx-page-tip{box-sizing:border-box;display:flex;flex-wrap:wrap;gap:7px;align-items:center;background:#0c2944;color:#e9f5ff;border:1px solid #345f7d;border-left:4px solid #54d7fa;border-radius:9px;padding:10px 12px;margin:10px 0;font:13px/1.4 system-ui,Arial,sans-serif;max-width:720px;min-width:0;overflow-wrap:anywhere}' +
      '@media (max-width:849px),(pointer:coarse){#staxx-page-tip{display:none!important}}' +
      '#staxx-page-tip strong{color:#84e0fb}#staxx-page-tip small{color:#a9cce5;flex-basis:100%}' +
      '#staxx-page-tip button{background:#0879bd;color:#fff;border:1px solid #69cef5;border-radius:8px;padding:7px 10px;font:inherit;font-weight:700;cursor:pointer}';
    css.textContent += [
      '#staxx-hub-drawer .staxx-main-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:9px 10px;background:#08192d;border-bottom:1px solid #284b6b;flex-shrink:0}',
      '#staxx-hub-drawer .staxx-main-tabs button{min-width:0;min-height:42px;background:#102b46;border:1px solid #315d7d;border-radius:9px;font-size:11px;font-weight:800;padding:5px 2px;color:#cce9f7}',
      '#staxx-hub-drawer .staxx-main-tabs button[aria-pressed="true"]{background:#0879bd;border-color:#54d7fa;color:#fff}',
      '#staxx-hub-drawer #staxx-hub-quick-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:4px 0 13px}',
      '#staxx-hub-drawer .staxx-quick-tool{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;min-height:64px;min-width:0;padding:8px 3px;background:#103756;border:1px solid #366d94;border-radius:10px;text-align:center;font-weight:800;font-size:11px;line-height:1.25;overflow-wrap:anywhere}',
      '#staxx-hub-drawer .staxx-quick-tool small{color:#8ddfff;font-size:10px;font-weight:700}',
      '#staxx-hub-drawer .staxx-quick-tool:disabled{opacity:.52;cursor:not-allowed}',
      '#staxx-hub-drawer .staxx-more-tasks{width:100%;margin:2px 0 8px;padding:9px;border:1px solid #376a8c;background:#0e3452;border-radius:9px;color:#9edfff;font-size:11px;font-weight:800}',
      '#staxx-hub-drawer [data-hub-section]>.staxx-label:first-child{margin-top:2px}'
    ].join("");
    css.textContent += '#staxx-hub-welcome{border:1px solid #367194;background:#103552;border-radius:11px;padding:11px;margin:0 0 12px}#staxx-hub-welcome strong{display:block;color:#9ce7ff;font-size:13px}#staxx-hub-welcome p{font-size:11px;line-height:1.45;color:#c4dfed;margin:7px 0}#staxx-hub-welcome button{background:#0879bd;border:1px solid #64c6ea;border-radius:8px;padding:8px 10px;min-height:36px;font-size:11px;font-weight:800;width:100%}';
    css.textContent += [
      '#staxx-hub-drawer .staxx-head-actions{display:flex;align-items:center;gap:7px}',
      '#staxx-hub-drawer [data-hub-find]{background:#125074;color:#d1f5ff;border:1px solid #4a99bd;border-radius:9px;min-width:38px;height:38px;font-size:24px;line-height:1}',
      '#staxx-hub-drawer [data-hub-find][aria-expanded="true"]{background:#0879bd;border-color:#80d9ff}',
      '#staxx-hub-drawer #staxx-hub-find{display:flex;flex:1;flex-direction:column;min-height:0;padding:12px 10px 18px;gap:8px;overflow:hidden}',
      '#staxx-hub-drawer #staxx-hub-find>label{font-size:10px;font-weight:850;letter-spacing:.8px;color:#9fcbe1}',
      '#staxx-hub-drawer #staxx-hub-find-input{width:100%;min-height:44px;background:#112e48;color:#f1fbff;border:1px solid #5e96b8;border-radius:10px;padding:10px 12px;font-size:14px;outline-offset:2px}',
      '#staxx-hub-drawer #staxx-hub-find-input:focus-visible{outline:2px solid #54d7fa}',
      '#staxx-hub-drawer #staxx-hub-find-status{font-size:11px;color:#a7c8dc;margin:2px 0 0}',
      '#staxx-hub-drawer #staxx-hub-find-results{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-bottom:12px}',
      '#staxx-hub-drawer .staxx-find-item{width:100%;display:flex;flex-direction:column;gap:4px;text-align:left;min-height:48px;margin:0 0 7px;padding:10px 11px;color:#e8f7ff;border:1px solid #366180;background:#10314f;border-radius:10px}',
      '#staxx-hub-drawer .staxx-find-item b{font-size:12px;line-height:1.3}',
      '#staxx-hub-drawer .staxx-find-item small{font-size:10px;color:#a8c8de;line-height:1.4;overflow-wrap:anywhere}',
      '#staxx-hub-drawer .staxx-find-item.urgent{border-color:#ff778d}',
      '#staxx-hub-drawer .staxx-find-item:disabled{opacity:.52;cursor:not-allowed}',
      '#staxx-hub-drawer .staxx-find-item:focus-visible{outline:2px solid #54d7fa}'
    ].join('');
    css.textContent += [
      '#staxx-hub-drawer #staxx-hub-best{padding:10px;margin-bottom:8px;border:1px solid #397fa3;border-radius:11px;background:#103756}',
      '#staxx-hub-drawer #staxx-hub-best .staxx-task{margin:0}',
      '#staxx-hub-drawer #staxx-hub-best .staxx-empty{margin:2px 0;color:#b4cbdb}',
      '#staxx-hub-drawer .staxx-advice{font-size:11px;color:#a7cde5;margin:7px 0 0;line-height:1.4}',
      '#staxx-hub-drawer #staxx-hub-task-filters{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0 10px}',
      '#staxx-hub-drawer #staxx-hub-task-filters button{flex:1 0 auto;min-height:34px;padding:6px;background:#132d48;border:1px solid #345b7a;border-radius:8px;font-size:10px;font-weight:700}',
      '#staxx-hub-drawer #staxx-hub-task-filters button[aria-pressed=true]{background:#0879bd;border-color:#54d7fa}',
      '#staxx-hub-drawer #staxx-hub-dashboard .staxx-overview-card{margin-bottom:11px}',
      '#staxx-hub-drawer #staxx-hub-dashboard dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}',
      '#staxx-hub-drawer #staxx-hub-dashboard dt{font-size:10px;color:#a9c4d7}',
      '#staxx-hub-drawer #staxx-hub-dashboard dd{font-size:13px;font-weight:800;margin:2px 0;overflow-wrap:anywhere}',
      '#staxx-hub-drawer #staxx-hub-frequent{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}',
      '#staxx-hub-drawer #staxx-hub-frequent button{padding:10px 8px;min-height:48px;background:#102d49;border:1px solid #386788;border-radius:9px;text-align:left;font-size:11px;font-weight:800}',
      '#staxx-hub-drawer #staxx-hub-frequent small{display:block;margin-top:3px;font-size:10px;color:#96c2d9}',
      '#staxx-hub-drawer #staxx-hub-activity .staxx-overview-card{margin-bottom:8px}',
      '#staxx-hub-drawer #staxx-hub-activity time{display:block;margin-top:3px;font-size:10px;color:#9ebdcf}',
      '#staxx-hub-drawer .staxx-review-minutes{color:#9ce6fa;font-size:10px;font-weight:750}',
      '#staxx-hub-drawer .staxx-category{color:#d8edfa;font-size:10px;font-weight:850}',
      '#staxx-hub-drawer #staxx-hub-source-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:2px 0 12px}',
      '#staxx-hub-drawer .staxx-source-pill{min-width:0;border:1px solid #335c79;border-radius:8px;background:#0c2944;padding:7px 4px;text-align:center;overflow-wrap:anywhere;font-size:10px}',
      '#staxx-hub-drawer .staxx-source-pill b{display:block;color:#bdeeff;font-size:10px}',
      '#staxx-hub-drawer .staxx-source-pill small{display:block;color:#a8c2d4;font-size:9px}',
      '#staxx-hub-drawer .staxx-source-pill.fresh{border-color:#328f8d}',
      '#staxx-hub-drawer .staxx-review-button{width:100%;margin:-6px 0 10px;min-height:34px;padding:6px 8px;text-align:center;background:#143b59;border:1px solid #32688b;border-radius:0 0 9px 9px;color:#c8eafa;font-size:11px;font-weight:750}',
      '#staxx-hub-drawer #staxx-hub-best .staxx-review-button{margin:3px 0 0;border-radius:8px}',
      '#staxx-hub-drawer .staxx-queue-info{font-size:10px;color:#aecbdf;margin:5px 2px 9px}'
    ].join('');
    css.textContent += [
      '#staxx-hub-drawer .staxx-intel{border:1px solid #326284;border-radius:10px;background:#0e2d49;padding:9px;margin:7px 0 11px}',
      '#staxx-hub-drawer .staxx-intel strong{display:block;color:#a8eaff;font-size:12px}',
      '#staxx-hub-drawer .staxx-intel p{font-size:10px;margin:4px 0;color:#b2ccdf}',
      '#staxx-hub-drawer .staxx-intel button{background:#134b70;border:1px solid #4186ae;border-radius:8px;padding:8px;font-size:11px;min-height:36px;width:100%;text-align:left;margin:5px 0 0}',
      '#staxx-hub-drawer .staxx-intel .staxx-intel-foot{font-size:10px;color:#9bbdd3}',
      '#staxx-hub-drawer .staxx-changed{color:#9decf7;font-size:10px;font-weight:800}',
      '#staxx-hub-drawer .staxx-pref{display:flex;gap:5px;margin:0 0 9px}',
      '#staxx-hub-drawer .staxx-pref button{flex:1;min-height:33px;border:1px solid #315f7e;border-radius:8px;background:#112f4b;color:#c1e7fb;font-size:10px;font-weight:750}',
      '#staxx-hub-drawer .staxx-pref button[aria-pressed=true]{border-color:#67dcfa;background:#165c80}',
      '#staxx-hub-drawer #staxx-hub-daily .staxx-overview-card{margin:6px 0}'
    ].join('');
    document.documentElement.append(css, root);

    const entries = [
      {id:"profit",label:"ProfitStaxx",icon:"PS",desc:"Markets · Stocks · Income"},
      {id:"company",label:"Company Helper",icon:"CO",desc:"Staff · Training · Growth"},
      {id:"happy",label:"Happy Jump",icon:"HJ",desc:"Gym · Schedule · Recovery"}
    ];
    const sectionsByTool={
      profit:[["daily","Today"],["alerts","Alerts"],["best","Best opportunities"],["scan","Item deals"],["travel","Travel"],["stocks","Stock market"],["capital","Capital"],["history","Price charts"],["income","Income"],["museum","Museum"],["portfolio","Trading ledger"],["settings","Settings"],["diagnostics","Diagnostics"]],
      company:[["overview","Today"],["alerts","Alerts"],["employees","Staff"],["training","Training"],["growth","Growth"],["stock","Stock or services"],["settings","Settings"],["diagnostics","Diagnostics"]],
      happy:[["today","Today"],["alerts","Alerts"],["compare","Compare methods"],["plan","Schedule"],["supplies","Supplies"],["gyms","Gyms"],["perks","Perks and books"],["progress","Progress"],["lab","Upgrades"],["settings","Settings"],["diagnostics","Diagnostics"]]
    };
    const active = Object.create(null), notices = Object.create(null), summaries = Object.create(null), controls = Object.create(null), actionSets=Object.create(null), healthReports=Object.create(null);
    const registeredAt=Object.create(null);
    let trends=Object.create(null), arrangeShown=false;
    const toggle=root.querySelector("#staxx-hub-toggle"),veil=root.querySelector("#staxx-hub-veil"),drawer=root.querySelector("#staxx-hub-drawer");
    const tools=root.querySelector("#staxx-hub-tools"),alerts=root.querySelector("#staxx-hub-alerts"),bubble=root.querySelector("#staxx-hub-count");
    const overview=root.querySelector("#staxx-hub-overview"),overviewButton=root.querySelector("[data-overview]"),taskList=root.querySelector("#staxx-hub-tasks"),diagnostics=root.querySelector("#staxx-hub-diagnostics"),diagnosticButton=root.querySelector("[data-diagnostics]");
    let expanded=false, panelOpen=false, overviewShown=false, diagnosticsShown=false, moving=null, suppressClickUntil=0;
    let hubView="today", expandedTaskList=false, findOpen=false, taskFilter='all';
    const activityKey='staxx-hub-activity-v1',usageKey='staxx-hub-usage-v1',reviewKey='staxx-hub-reviewed-v1';
    const observedKey='staxx-hub-action-signatures-v1',baselineKey='staxx-hub-action-baselines-v1';
    const changeKey='staxx-hub-action-changes-v1',feedbackKey='staxx-hub-feedback-v1',sessionKey='staxx-hub-session-minutes-v1';
    const reviewWindowMs=4*3600000;
    const validTab=/^[a-z][a-z0-9-]{0,31}$/;
    let activity=[],usage=[],reviewed=Object.create(null);
    let observedActions=Object.create(null),baselines=Object.create(null),changeFlags=Object.create(null),feedback=Object.create(null);
    let uiMode=safeRead('staxx-hub-mode-v1','simple')==='advanced'?'advanced':'simple';
    let sessionMinutes=[5,10,15,30,60].includes(safeRead(sessionKey,0))?safeRead(sessionKey,0):0;
    const findPanel=root.querySelector('#staxx-hub-find'),findInput=root.querySelector('#staxx-hub-find-input');
    const findResults=root.querySelector('#staxx-hub-find-results'),findStatus=root.querySelector('#staxx-hub-find-status');
    function setFindOpen(value){
      findOpen=Boolean(value);
      if(findPanel)findPanel.hidden=!findOpen;
      const content=root.querySelector('.staxx-scroll');if(content)content.hidden=findOpen;
      const btn=root.querySelector('[data-hub-find]');if(btn)btn.setAttribute('aria-expanded',String(findOpen));
      if(findOpen){renderFind();findInput?.focus?.();}
      else if(findInput){findInput.value='';}
    }
    function publishMode(){document.dispatchEvent(new CustomEvent('staxx:mode',{detail:{mode:uiMode}}));}
    function switchHubView(view){
      if(!["today","dashboard","activity","tools","alerts","more"].includes(view))return;
      hubView=view;
      for(const btn of root.querySelectorAll?.("[data-hub-view]")||[])
        btn.setAttribute("aria-pressed",String(btn.dataset.hubView===view));
      for(const section of root.querySelectorAll?.("[data-hub-section]")||[])
        section.hidden=section.dataset.hubSection!==view;
      const scroll=root.querySelector(".staxx-scroll");
      if(scroll)scroll.scrollTop=0; // Never scroll due to an event-driven data refresh.
    }
    let lastDataRequestV26=0;
    function refreshConnectedV26(force=false){
      if(document.hidden||!entries.some(x=>active[x.id]))return false;
      const time=Date.now();
      if(!force&&time-lastDataRequestV26<120000)return false;
      lastDataRequestV26=time;
      document.dispatchEvent(new CustomEvent("staxx:refresh-request",{detail:{reason:force?"manual":"hub-open",force}}));
      return true;
    }
    const openPanels=new Set();
    const idOk = v=>typeof v==="string" && /^[a-z][a-z0-9-]{0,31}$/.test(v);
    function node(tag,cls,value) {const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;}
    function safeRead(key, fallback) {try {const v=JSON.parse(localStorage.getItem(key)||"null");return v===null?fallback:v;}catch(_){return fallback;}}
    function saveLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
    function remember(){
      try{sessionStorage.setItem("staxx-hub-state-v2",JSON.stringify({at:Date.now(),notices,summaries,actionSets}));}catch(_){}
    }
    try {
      const known=safeRead("staxx-hub-registry-v2",[]);
      if(Array.isArray(known))for(const e of known.slice(0,25)){
        if(idOk(e.id)&&!entries.some(x=>x.id===e.id))entries.push({id:e.id,label:String(e.label||e.id).slice(0,40),icon:String(e.icon||"S").slice(0,3),desc:String(e.desc||"Staxx tool").slice(0,70)});
      }
    }catch(_){}
    try {
      const old=JSON.parse(sessionStorage.getItem("staxx-hub-state-v2")||"null");
      if(old&&Date.now()-old.at<4*3600000){
        for(const id of Object.keys(old.notices||{}))if(idOk(id)){const n=old.notices[id];if(n&&Number(n.count)>=0)notices[id]=Object.assign({},n,{cached:true});}
        for(const id of Object.keys(old.summaries||{}))if(idOk(id)){const d=old.summaries[id];if(d&&typeof d==="object")summaries[id]=d;}
        for(const id of Object.keys(old.actionSets||{}))if(idOk(id)){const d=old.actionSets[id];if(d&&Array.isArray(d.items))actionSets[id]={items:d.items.slice(0,8),updated:d.updated,cached:true};}
      }
    }catch(_){}
    for(const e of entries)controls[e.id]=safeRead("staxx-hub-alert-control-"+e.id,{});
    const savedOrder=safeRead("staxx-hub-order-v3",[]);
    if(Array.isArray(savedOrder)){
      entries.sort((a,b)=>{
        const ai=savedOrder.indexOf(a.id),bi=savedOrder.indexOf(b.id);
        return (ai<0?1000:ai)-(bi<0?1000:bi);
      });
    }
    const savedTrends=safeRead("staxx-hub-trends-v3",{});
    if(savedTrends&&typeof savedTrends==="object"&&!Array.isArray(savedTrends))trends=savedTrends;
    const storedActivity=safeRead(activityKey,[]);
    if(Array.isArray(storedActivity))activity=storedActivity.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&Number(x.at)>Date.now()-30*86400000&&Number(x.at)<=Date.now()+60000).slice(-120);
    const storedReviews=safeRead(reviewKey,{});
    if(storedReviews&&typeof storedReviews==='object'&&!Array.isArray(storedReviews)){
      for(const [key,value] of Object.entries(storedReviews).slice(-60)){
        if(/^[a-z][a-z0-9-]{0,31}[/][a-z][a-z0-9-]{0,63}$/.test(key)&&
          value&&typeof value.sig==='string'&&value.sig.length<=700&&
          Number.isFinite(Number(value.at))&&Number(value.at)<=Date.now()&&
          Date.now()-Number(value.at)<reviewWindowMs)reviewed[key]={sig:value.sig,at:Number(value.at)};
      }
    }
    const ownMap=(value)=>value&&typeof value==='object'&&!Array.isArray(value)?value:Object.create(null);
    const safeActionKey=(key)=>/^[a-z][a-z0-9-]{0,31}[/][a-z][a-z0-9-]{0,63}$/.test(key);
    observedActions=Object.fromEntries(Object.entries(ownMap(safeRead(observedKey,{})))
      .filter(([k,v])=>safeActionKey(k)&&typeof v==='string'&&/^[a-z0-9]{1,12}$/.test(v)).slice(-160));
    baselines=Object.fromEntries(Object.entries(ownMap(safeRead(baselineKey,{})))
      .filter(([k,v])=>idOk(k)&&v===true).slice(-25));
    changeFlags=Object.fromEntries(Object.entries(ownMap(safeRead(changeKey,{})))
      .filter(([k,v])=>safeActionKey(k)&&v&&['new','updated'].includes(v.kind)&&
        /^[a-z0-9]{1,12}$/.test(v.hash||'')&&Number(v.at)<=Date.now()&&
        Date.now()-Number(v.at)<7*86400000).slice(-80));
    feedback=Object.fromEntries(Object.entries(ownMap(safeRead(feedbackKey,{})))
      .filter(([k,v])=>safeActionKey(k)&&v&&[-1,1].includes(v.vote)&&
        Number(v.at)<=Date.now()&&Date.now()-Number(v.at)<60*86400000).slice(-80));
    const storedUsage=safeRead(usageKey,[]);
    if(Array.isArray(storedUsage))usage=storedUsage.filter(x=>x&&idOk(x.tool)&&(!x.section||validTab.test(x.section))&&Number(x.count)>0&&Number(x.last)>Date.now()-30*86400000).slice(-50);
    const pos=safeRead("staxx-hub-position-v2",0.43);
    function position(value) {
      const height=Math.max(160,window.innerHeight||600),buttonHeight=49;
      const top=Math.max(18,Math.min(height-buttonHeight-18,Math.round(height*Math.max(0,Math.min(1,Number(value)||0)))));
      toggle.style.top=top+"px";
      return top/height;
    }
    position(typeof pos==="number"?pos:0.43);
    function launcherVisibility(){
      const hide=expanded||panelOpen;
      toggle.hidden=hide;
      toggle.style.setProperty("display",hide?"none":"flex","important");
      toggle.style.setProperty("pointer-events",hide?"none":"auto","important");
      toggle.setAttribute("aria-expanded",String(expanded));
    }
    function setExpanded(value){
      if(value&&!expanded){expandedTaskList=false;switchHubView("today");renderTasks();}
      if(!value)setFindOpen(false);
      expanded=Boolean(value);veil.hidden=drawer.hidden=!expanded;launcherVisibility();renderContext();
    }
    function activeNotice(id){
      const n=notices[id];if(!n||!(n.count>0))return null;
      const control=controls[id]||{};
      if(control.dismissed===n.fingerprint || Number(control.snoozeUntil)>Date.now())return null;
      return n;
    }
    function recordUse(tool,section){
      const key=tool+'/'+(section||''),now=Date.now();
      const old=storedUse(key);
      usage=usage.filter(x=>x&&x.key!==key&&now-Number(x.last)<30*86400000);
      const record={key,tool,section:section||'',count:Math.min(99,(old?.count||0)+1),last:now};
      usage.push(record);usage=usage.slice(-50);saveLocal(usageKey,usage);renderFrequent();
    }
    function storedUse(key){return usage.find(x=>x.key===key);}
    function openTool(id,alertId,section){
      const routes=sectionsByTool[id]||entries.find(e=>e.id===id)?.sections||[];
      const validSection=routes.some(item=>item[0]===section)?section:null;
      if(entries.some(e=>e.id===id))recordUse(id,validSection);
      if(id==="company"&&!/^\/companies\.php$/i.test(location.pathname)){
        try{
          sessionStorage.setItem("staxx-open-company","1");
          sessionStorage.setItem("staxx-open-company-at",String(Date.now()));
          if(alertId)sessionStorage.setItem("staxx-open-company-alert",alertId);
          else sessionStorage.removeItem("staxx-open-company-alert");
          if(validSection&&!alertId)sessionStorage.setItem("staxx-open-company-section",validSection);
          else sessionStorage.removeItem("staxx-open-company-section");
        }catch(_){}
        location.assign(location.origin+"/companies.php");return;
      }
      if(!active[id]){
        alerts.replaceChildren(node("p","staxx-empty","This tool is not active on this page. Enable its script in Torn PDA and reload."));
        return;
      }
      panelOpen=true;setExpanded(false);launcherVisibility();
      document.dispatchEvent(new CustomEvent("staxx:closeall"));
      document.dispatchEvent(new CustomEvent("staxx:open",{detail:{id,alertId:alertId||null,section:alertId?null:validSection}}));
    }
    function timeUntil(ms) {
      if(!Number.isFinite(ms)||ms<=0)return "";
      const diff=ms-Date.now(),minutes=Math.max(1,Math.ceil(Math.abs(diff)/60000));
      const text=minutes<60?minutes+"m":minutes<1440?Math.ceil(minutes/60)+"h":Math.ceil(minutes/1440)+"d";
      return diff<=0?"Overdue "+text: "Due in "+text;
    }
    function trendValue(value) {
      const match=String(value??"").replace(/,/g,"").trim().match(/^[$£]?\s*(-?\d+(?:\.\d+)?)\s*([kmb])?/i);
      if(!match)return null;
      const multiplier={k:1000,m:1000000,b:1000000000}[String(match[2]||"").toLowerCase()]||1;
      const n=Number(match[1])*multiplier;
      return Number.isFinite(n)?n:null;
    }
    const trendMetric={profit:"Fresh deals",company:"Star rating",happy:"24h projected gains"};
    const trendTitle={profit:"Fresh deals",company:"Company stars",happy:"24h projected gains (forecast)"};
    function dayKey(time){const d=new Date(time);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
    function recordTrend(id,entry) {
      const own=entries.find(x=>x.id===id);const key=own?.trendMetric||trendMetric[id]||entry?.metrics?.find(x=>trendValue(x.value)!==null)?.label;
      if(!key||!entry||!Array.isArray(entry.metrics))return;
      const metric=entry.metrics.find(x=>x.label===key);
      const timestamp=Number(entry.updated)||Date.now(),value=metric?trendValue(metric.value):null;
      if(value===null||timestamp>Date.now()+60000||Date.now()-timestamp>86400000)return;
      const list=Array.isArray(trends[id])?trends[id]:[];
      const day=dayKey(timestamp);
      const next=list.filter(x=>x&&typeof x.day==="string"&&x.day!==day&&Date.now()-Number(x.timestamp)<8*86400000);
      next.push({day,value,timestamp});next.sort((a,b)=>a.timestamp-b.timestamp);
      trends[id]=next.slice(-8);saveLocal("staxx-hub-trends-v3",trends);
    }
    function trendCard(id){
      const list=Array.isArray(trends[id])?trends[id]:[];
      if(!trendMetric[id]&&!entries.find(x=>x.id===id)?.trendMetric&&!(summaries[id]?.metrics||[]).some(x=>trendValue(x.value)!==null))return null;
      const wrap=node("div","staxx-trend");
      const title=node("small","staxx-trendnote","7-day trend · "+(entries.find(x=>x.id===id)?.trendMetric||trendTitle[id]||"first numeric summary metric")+" · observed snapshots");wrap.append(title);
      const bar=node("div","staxx-spark");
      const values=[];
      for(let offset=6;offset>=0;offset--){
        const time=new Date();time.setHours(12,0,0,0);time.setDate(time.getDate()-offset);
        const date=dayKey(time.getTime()),point=list.find(x=>x.day===date);values.push(point?point.value:null);
      }
      const max=Math.max(1,...values.filter(x=>x!==null).map(x=>Math.max(0,x)));
      for(const [i,value] of values.entries()){
        const b=node("span",value===null?"missing":"");
        b.style.height=value===null?"3px":Math.max(4,Math.min(40,Math.round(Math.max(0,value)/max*40)))+"px";
        b.title=(i===6?"Today":"Day "+(i+1))+" · "+(value===null?"Not recorded":String(value));
        bar.append(b);
      }
      wrap.append(bar);
      const recorded=values.filter(v=>v!==null);
      wrap.append(node("p","staxx-trendnote",recorded.length>1?
        "Change: "+(recorded.at(-1)-recorded[0]>0?"+":"")+String(Math.round((recorded.at(-1)-recorded[0])*100)/100)+" · "+recorded.length+"/7 recorded days":
        recorded.length+"/7 recorded days · comparison appears after two days"));
      return wrap;
    }

    // V2.5: everything registered through the normal Staxx event protocol joins the dashboard.
    // Never promote old or cross-page cached observations to a verified urgent instruction.
    function freshnessMs(id){
      const entry=entries.find(x=>x.id===id);
      return Math.max(60000,Math.min(86400000,Number(entry?.freshnessMs)||({profit:600000,company:86400000,happy:900000}[id]||3600000)));
    }
    function taskRowsV25(){
      const rows=[];
      for(const e of entries){
        const set=actionSets[e.id],control=controls[e.id]||{};
        if(!set||!Array.isArray(set.items)||Number(control.snoozeUntil)>Date.now())continue;
        const old=Boolean(set.cached)||!Number.isFinite(Number(set.updated))||Date.now()-Number(set.updated)>freshnessMs(e.id);
        const hidden=control.dismissed===notices[e.id]?.fingerprint?new Set((notices[e.id]?.alerts||[]).map(x=>x.id)):null;
        for(const a of set.items)if(!hidden?.has(a.id))rows.push({...a,owner:e.id,tool:e.label,cached:old,updated:set.updated});
      }
      const rank={urgent:4,now:3,soon:2,review:1,optional:0};
      return rows.sort((a,b)=>Number(a.cached)-Number(b.cached)||
        (rank[b.status]??0)-(rank[a.status]??0)||
        (Number(a.dueAt)||Infinity)-(Number(b.dueAt)||Infinity)||
        (feedbackPriority(b)+sessionFitScore(b))-(feedbackPriority(a)+sessionFitScore(a)));
    }
    // 3.2: local advisory review queue; never interprets a check as completed gameplay.
    // 3.3: all preference and change tracking stays on this device.
    function actionKey(owner,id){return owner+'/'+id;}
    function shortHash(value){
      let hash=2166136261;const str=String(value).slice(0,700);
      for(let i=0;i<str.length;i++){hash^=str.charCodeAt(i);hash=Math.imul(hash,16777619);}
      return (hash>>>0).toString(36);
    }
    function flagOf(item){
      const flag=changeFlags[actionKey(item.owner,item.id)];
      return !item.cached&&flag&&flag.hash===shortHash(reviewSignature(item))?flag.kind:null;
    }
    function feedbackVote(item){return feedback[actionKey(item.owner,item.id)]?.vote||0;}
    function feedbackPriority(item){return Number(item.priority||0)+feedbackVote(item)*10;}
    function sessionFitScore(item){
      if(!sessionMinutes||!Number.isInteger(item.reviewMinutes))return 0;
      return item.reviewMinutes<=sessionMinutes?8:-8;
    }
    function fitsSession(item){
      return sessionMinutes>0&&!item.cached&&Number.isInteger(item.reviewMinutes)&&item.reviewMinutes>=1&&item.reviewMinutes<=sessionMinutes;
    }
    function completionFor(item){
      if(item.cached||!active[item.owner])return null;
      const signature=shortHash(reviewSignature(item)),today=ukDay(Date.now());
      return activity.find(e=>e.source==='api'&&e.tool===item.owner&&e.completedActionId===item.id&&
        e.completedSig===signature&&ukDay(e.at)===today)||null;
    }
    function noteObservedActions(id,items,updated){
      if(!active[id]||!Number.isFinite(updated)||updated>Date.now()+60000||
        Date.now()-updated>freshnessMs(id))return;
      const hasBaseline=Boolean(baselines[id]);let modified=false;
      for(const item of items.slice(0,12)){
        const key=actionKey(id,item.id),hash=shortHash(reviewSignature(item)),prior=observedActions[key];
        if(hasBaseline&&prior!==hash){
          changeFlags[key]={kind:prior?'updated':'new',hash,at:Date.now()};
          modified=true;
        }
        if(prior!==hash){observedActions[key]=hash;modified=true;}
      }
      if(!hasBaseline){baselines[id]=true;saveLocal(baselineKey,baselines);}
      if(modified){
        observedActions=Object.fromEntries(Object.entries(observedActions).slice(-160));
        changeFlags=Object.fromEntries(Object.entries(changeFlags)
          .filter(([key,value])=>value&&Date.now()-Number(value.at)<7*86400000).slice(-80));
        saveLocal(observedKey,observedActions);saveLocal(changeKey,changeFlags);
      }
    }
    function feedbackControls(item){
      const bar=node('div','staxx-pref');
      if(item.cached||!active[item.owner])return bar;
      for(const [vote,label] of [[1,'Useful'],[-1,'Less relevant']]){
        const button=node('button','',label);button.type='button';
        button.dataset.voteOwner=item.owner;button.dataset.voteId=item.id;button.dataset.voteValue=String(vote);
        button.setAttribute('aria-pressed',String(feedbackVote(item)===vote));
        bar.append(button);
      }
      return bar;
    }
    function clearChangeFlags(){changeFlags=Object.create(null);saveLocal(changeKey,changeFlags);renderTasks();}
    function reviewIdentity(item){return item.owner+'/'+item.id;}
    function reviewSignature(item){return JSON.stringify([item.title,item.detail,item.status,item.priority,item.dueAt]);}
    function isReviewed(item){
      const r=reviewed[reviewIdentity(item)];
      return !!(r&&Number(r.at)<=Date.now()&&Date.now()-Number(r.at)<reviewWindowMs&&r.sig===reviewSignature(item));
    }
    function markReviewed(item,checked){
      if(!item||item.status==='urgent'||item.cached||!active[item.owner])return false;
      const key=reviewIdentity(item);
      if(checked)reviewed[key]={sig:reviewSignature(item),at:Date.now()};
      else delete reviewed[key];
      reviewed=Object.fromEntries(Object.entries(reviewed)
        .filter(([k,v])=>v&&Date.now()-Number(v.at)<reviewWindowMs)
        .sort((a,b)=>Number(b[1].at)-Number(a[1].at)).slice(0,60));
      saveLocal(reviewKey,reviewed);renderTasks();return true;
    }
    function renderSourceStatus(){
      const host=root.querySelector('#staxx-hub-source-status');if(!host)return;
      host.replaceChildren();
      for(const e of entries.slice(0,3)){
        const set=actionSets[e.id],ts=Number(set?.updated),fresh=Boolean(active[e.id]&&set&&!set.cached&&
          Number.isFinite(ts)&&ts<=Date.now()+60000&&Date.now()-ts<=freshnessMs(e.id));
        const cell=node('div','staxx-source-pill'+(fresh?' fresh':''));
        cell.append(node('b','',e.label),node('small','',!active[e.id]?'Not active':fresh?'Recent report':set?'Last observed':'Awaiting report'));
        host.append(cell);
      }
    }
    function pendingActions(){return taskRowsV25().filter(x=>!isReviewed(x)&&!completionFor(x));}
    function findCatalog(){
      const rows=[],hiddenAlertIds=new Set();
      for(const e of entries){
        const available=Boolean(active[e.id]);
        rows.push({kind:'tool',owner:e.id,title:e.label,detail:e.desc,available});
        const routes=sectionsByTool[e.id]||e.sections||[];
        for(const route of routes)rows.push({kind:'section',owner:e.id,section:route[0],title:route[1],detail:e.label+' · Section',available});
        const current=activeNotice(e.id),raw=notices[e.id];
        if(raw?.count>0&&!current)for(const item of raw.alerts||[])hiddenAlertIds.add(e.id+'/'+item.id);
        if(current){
          if(current.alerts?.length){
            for(const item of current.alerts.slice(0,24))
              rows.push({kind:'alert',owner:e.id,alertId:item.id,title:item.title,detail:e.label+' · '+item.detail+(current.cached?' · Last observed':''),available,cached:Boolean(current.cached)});
          }else rows.push({kind:'alert',owner:e.id,title:current.summary||'Review alerts',detail:e.label+(current.cached?' · Last observed':''),available,cached:Boolean(current.cached)});
        }
      }
      for(const task of taskRowsV25()){
        if(hiddenAlertIds.has(task.owner+'/'+task.id))continue;
        // A matching actionable alert is represented once, not twice.
        if(activeNotice(task.owner)?.alerts?.some(x=>x.id===task.id))continue;
        rows.push({kind:'action',owner:task.owner,alertId:task.id,title:task.title,
          detail:task.tool+' · '+task.detail+(task.cached?' · Last observed':''),available:Boolean(active[task.owner]),
          cached:Boolean(task.cached),status:task.status});
      }
      return rows;
    }
    function renderFind(){
      if(!findOpen||!findResults||!findInput)return;
      findResults.replaceChildren();
      const query=String(findInput.value||'').trim().toLocaleLowerCase().slice(0,100);
      const tokens=query.split(/\s+/).filter(Boolean);
      let results=findCatalog();
      if(tokens.length){
        results=results.filter(item=>{
          const hay=(item.title+' '+item.detail+' '+item.owner).toLocaleLowerCase();
          return tokens.every(word=>hay.includes(word)||(word.length>4&&word.endsWith('s')&&!word.endsWith('ss')&&hay.includes(word.slice(0,-1))));
        });
        results.sort((a,b)=>{
          const score=item=>(item.title.toLocaleLowerCase()===query?0:item.title.toLocaleLowerCase().startsWith(query)?1:2)*10+
            (item.kind==='action'?0:item.kind==='alert'?1:item.kind==='section'?2:3);
          return score(a)-score(b);
        });
      }else results=results.filter(x=>x.kind==='tool');
      if(findStatus)findStatus.textContent=tokens.length?results.length+' matching destination'+(results.length===1?'':'s')+' · Showing up to 12':'Select a tool or type to find a section, alert or recommendation';
      for(const item of results.slice(0,12)){
        const btn=node('button','staxx-find-item'+(item.status==='urgent'?' urgent':''));btn.type='button';
        if(item.kind==='section'){btn.dataset.hubSectionTool=item.owner;btn.dataset.hubSectionTab=item.section;}
        else if(item.alertId){btn.dataset.openAlertTool=item.owner;btn.dataset.openAlertId=item.alertId;}
        else btn.dataset.openStaxx=item.owner;
        if(!item.available&&item.owner!=='company'){btn.disabled=true;btn.title='Enable '+item.owner+' in TornPDA first';}
        const type=item.kind==='action'?'Action':item.kind==='alert'?'Alert':item.kind==='section'?'Section':'Tool';
        btn.append(node('b','',item.title),node('small','',type+' · '+item.detail+(btn.disabled?' · Script not active':'')));
        findResults.append(btn);
      }
      if(!results.length)findResults.append(node('p','staxx-empty','No matching active tool data. Try a shorter term or open a helper to refresh.'));
    }
    function diagnosticReportV25(){
      const time=Date.now();
      return {hub:"3.1",capturedAt:new Date(time).toISOString(),page:String(location.pathname||""),
        connectedCount:entries.filter(x=>active[x.id]).length,knownCount:entries.length,tools:entries.map(e=>{
          const sum=summaries[e.id],actions=actionSets[e.id],notice=notices[e.id],h=healthReports[e.id];
          const age=Number(sum?.updated),lastAction=Number(actions?.updated);
          return {id:e.id,label:e.label,connected:Boolean(active[e.id]),registeredSecondsAgo:
            registeredAt[e.id]?Math.max(0,Math.floor((time-registeredAt[e.id])/1000)):null,
            summaryAgeMinutes:age>0?Math.max(0,Math.floor((time-age)/60000)):null,
            actionAgeMinutes:lastAction>0?Math.max(0,Math.floor((time-lastAction)/60000)):null,
            actionCount:Array.isArray(actions?.items)?actions.items.length:0,
            alertCount:Number(notice?.count)||0,
            stale:!actions||Boolean(actions.cached)||time-lastAction>freshnessMs(e.id),
            health:h?{version:h.version,api:h.api,storage:h.storage,ui:h.ui,detail:h.detail,observedAt:h.observedAt}:null};
        })};
    }
    function showDiagnosticsV25(){
      if(!diagnostics)return;
      diagnostics.replaceChildren();
      if(!diagnosticsShown){diagnostics.hidden=true;diagnosticButton.classList.remove("selected");return;}
      diagnostics.hidden=false;diagnosticButton.classList.add("selected");
      diagnostics.append(node("p","staxx-trendnote","Local health indicators only. No API keys, financial records, employee names, battle stats or personal IDs are collected in this report."));
      const buttons=node("div","staxx-diagnostic-actions"),check=node("button","","Check installed tools"),copy=node("button","","Copy safe report");
      check.type=copy.type="button";check.dataset.checkDiagnostics="1";copy.dataset.copyDiagnostics="1";
      buttons.append(check,copy);diagnostics.append(buttons);
      for(const row of diagnosticReportV25().tools){
        const card=node("div","staxx-overview-card");
        card.append(node("b","",row.label+" · "+(row.connected?"connected":"not running on this page")),
          node("p","",row.health?.version?"Version "+row.health.version:"Version not reported"),
          node("p","",row.health?"API "+row.health.api+" · Storage "+row.health.storage+" · UI "+row.health.ui:
            "No recent health response; open this tool or check whether it is enabled in TornPDA."),
          node("p","",row.stale?"Last action data stale or unverified":"Last action data within declared freshness window"),
          node("p","",row.actionCount+" recommendations · "+row.alertCount+" alerts"));
        if(row.health?.detail)card.append(node("small","staxx-trendnote",row.health.detail));
        diagnostics.append(card);
      }
      const output=node("textarea");output.id="staxx-safe-report";output.readOnly=true;output.hidden=true;
      output.value=JSON.stringify(diagnosticReportV25(),null,2);diagnostics.append(output);
    }

    function showOverview(){
      overview.replaceChildren();
      overview.append(node("p","staxx-trendnote","All registered tools automatically appear here, including future Staxx scripts. Stale suggestions are labelled and sorted after current data."));
      const syncButton=node("button","staxx-overview-switch","↻ Check current data across connected tools");
      syncButton.type="button";syncButton.dataset.syncAll="1";overview.append(syncButton);
      for(const [i,item] of taskRowsV25().slice(0,5).entries()){
        const row=node("button","staxx-task "+(!item.cached&&item.status==="urgent"?"urgent":""));
        row.dataset.openAlertTool=item.owner;row.dataset.openAlertId=item.id;
        row.append(node("span","staxx-step",(i+1)+" · "+item.tool+(item.cached?" · CHECK FRESHNESS":"")),node("b","",item.title));
        if(item.detail)row.append(node("small","",item.detail));overview.append(row);
      }
      for(const e of entries){
        const s=summaries[e.id],card=node("article","staxx-overview-card");
        card.append(node("b","",e.label),node("p","",s?.headline || (active[e.id]?"No verified figures yet":"Open tool for the latest figures")));
        const d=node("dl");
        for(const m of (Array.isArray(s?.metrics)?s.metrics:[]).slice(0,4)){
          const group=node("div");group.append(node("dt","",m.label),node("dd","",m.value));d.append(group);
        }
        if(d.childElementCount)card.append(d);
        const trend=trendCard(e.id);if(trend)card.append(trend);
        const btn=node("button","staxx-overview-switch","Open "+e.label);btn.dataset.openStaxx=e.id;card.append(btn);
        overview.append(card);
      }
      overview.hidden=!overviewShown;
      overviewButton.classList.toggle("selected",overviewShown);
      overviewButton.setAttribute("aria-expanded",String(overviewShown));
    }

    // Contextual, non-invasive Torn page tip. It never fills fields or performs gameplay.
    function currentContext(){
      const path=String(location.pathname||"").toLowerCase();
      if(path==="/gym.php")return {id:"happy",name:"Gym"};
      if(path==="/companies.php")return {id:"company",name:"Company"};
      if(path==="/page.php"&&/\bsid=itemmarket\b/i.test(String(location.search||"")))return {id:"profit",name:"Item Market"};
      if(path==="/page.php"&&/\bsid=stocks\b/i.test(String(location.search||"")))return {id:"profit",name:"Stock Market"};
      return null;
    }
    function contextEnabled(){return safeRead("staxx-hub-context-v1",true)!==false;}
    function renderContext(){
      const old=document.getElementById("staxx-page-tip");
      const control=root.querySelector("[data-context-toggle]");
      if(control){control.textContent="On-page guidance: "+(contextEnabled()?"On":"Off");
        control.setAttribute("aria-pressed",String(contextEnabled()));}
      const ctx=currentContext();
      // TornPDA can display desktop-width pages within a narrow touch viewport.
      // Never insert guidance into a native heading on a touch device or small layout.
      const touch=typeof navigator!=="undefined"&&Number(navigator.maxTouchPoints)>0;
      const coarse=typeof window.matchMedia==="function"&&window.matchMedia("(pointer: coarse)").matches;
      const width=Math.min(Number(window.innerWidth)||9999,Number(document.documentElement.clientWidth)||9999);
      if(!ctx||!contextEnabled()||touch||coarse||width<850||!active[ctx.id]||openPanels.size||panelOpen||expanded){
        if(old)old.remove();return;
      }
      const anchor=document.querySelector?.("#gymroot h1, #mainContainer h1, .content-wrapper h1, h1");
      const safeParent=anchor?.parentElement;
      const parentWidth=typeof safeParent?.getBoundingClientRect==="function"?safeParent.getBoundingClientRect().width:0;
      if(!anchor||typeof anchor.insertAdjacentElement!=="function"||parentWidth<540||anchor.closest?.("#staxx-hub-root, [role=dialog], #hhj-compact-panel")){if(old)old.remove();return;}
      const set=actionSets[ctx.id],fresh=set&&!set.cached&&Date.now()-Number(set.updated)<(ctx.id==="company"?86400000:ctx.id==="happy"?900000:480000);
      const ranks={urgent:5,now:4,soon:3,review:2,optional:1};
      const items=fresh&&Array.isArray(set.items)?set.items.slice().sort((a,b)=>(ranks[b.status]||0)-(ranks[a.status]||0)||(b.priority||0)-(a.priority||0)):[];
      // Stale/missing data triggers automatic refresh inside each tool; never cover Torn
      // with a large "refresh" prompt or present cached recommendations as live.
      const first=items.find(x=>!/^((refresh|recheck|scan)(-|$))/i.test(String(x.id||"")));
      if(!first){if(old)old.remove();return;}
      const title=first.title;
      const detail=first.detail||"";
      // Reuse existing element to avoid mutating Torn's DOM during every heartbeat.
      const fingerprint=ctx.id+"|"+title+"|"+detail+"|"+String(first?.id||"");
      if(old&&old.dataset.fingerprint===fingerprint&&old.previousElementSibling===anchor)return;
      if(old)old.remove();
      const bar=node("div");bar.id="staxx-page-tip";bar.dataset.fingerprint=fingerprint;
      bar.setAttribute("role","region");bar.setAttribute("aria-label","Staxx contextual guidance");
      const heading=node("strong","",ctx.name+" · NEXT ACTION");
      const message=node("span","",title),sub=node("small","",detail);
      const button=node("button","","Review action ›");
      button.type="button";button.addEventListener("click",()=>openTool(ctx.id,first.id));
      bar.append(heading,message,button,sub);
      anchor.insertAdjacentElement("afterend",bar);
    }
    function renderWelcome(){
      const host=root.querySelector('#staxx-hub-welcome');if(!host)return;
      const done=safeRead('staxx-hub-onboarded-v1',false)===true;
      host.hidden=done;host.replaceChildren();if(done)return;
      host.append(node('strong','','Welcome to StaxxHub'),node('p','','1. Today shows your next verified action. 2. Tools opens each installed helper. 3. Alerts takes you to the exact issue.'));
      host.append(node('p','','Simple mode keeps the important tabs visible; Advanced restores every section. You can change this under More.'));
      const finish=node('button','','Got it · Start using Staxx');finish.type='button';finish.dataset.hubGuideDone='1';host.append(finish);
    }
    function categoryFor(item){return item.status==='urgent'||item.status==='now'?'now':item.status==='soon'?'soon':'optional';}
    function taskLabel(item){return item.cached?'LAST OBSERVED':categoryFor(item)==='now'?'DO NOW':categoryFor(item)==='soon'?'SOON':'OPTIONAL';}
    function effortLabel(item){return Number.isInteger(item.reviewMinutes)&&item.reviewMinutes>=1&&item.reviewMinutes<=60?'≈ '+item.reviewMinutes+' min review':'Review time not estimated';}
    function bestAction(){return pendingActions().find(x=>!x.cached&&Boolean(active[x.owner]))||null;}
    function renderBest(){
      const host=root.querySelector('#staxx-hub-best');if(!host)return;
      host.replaceChildren();
      const first=bestAction();
      if(!first){host.append(node('p','staxx-empty','No verified current recommendation. Open a tool or use Dashboard to request a fresh check.'));return;}
      const go=node('button','staxx-task '+(first.status==='urgent'?'urgent':''));
      go.type='button';go.dataset.openAlertTool=first.owner;go.dataset.openAlertId=first.id;
      go.append(node('span','staxx-step','BEST NEXT · '+first.tool+' · '+taskLabel(first)),node('b','',first.title));
      if(first.detail)go.append(node('small','',first.detail));
      go.append(node('small','staxx-review-minutes',effortLabel(first)));
      if(flagOf(first))go.append(node('small','staxx-changed',flagOf(first)==='new'?'NEW RECOMMENDATION':'UPDATED SINCE LAST REVIEW'));
      host.append(go);
      if(first.status!=='urgent'){
        const checked=node('button','staxx-review-button','Checked for now · 4h');
        checked.type='button';checked.dataset.reviewOwner=first.owner;checked.dataset.reviewId=first.id;host.append(checked);
      }
      host.append(feedbackControls(first));
      const why=first.status==='urgent'?'Urgent advisory reported by '+first.tool+'.':first.dueAt&&first.dueAt<=Date.now()?'Source reports this is due.':first.status==='now'?'The tool reports it is actionable now.':first.status==='soon'?'Upcoming step before optional reviews.':'Top-ranked currently reported review.';
      host.append(node('p','staxx-advice',why+' Ranked using source urgency, due time, and priority. Always verify the live Torn page before acting.'));
    }
    function renderPageShortcut(){
      const host=root.querySelector('#staxx-hub-page-shortcut');if(!host)return;
      host.replaceChildren();
      const path=String(location.pathname||'').toLowerCase(),search=String(location.search||'').toLowerCase();
      let route=null;
      if(path==='/gym.php')route=['happy','today','Gym','Training overview'];
      else if(path==='/companies.php')route=['company','overview','Company','Director overview'];
      else if(path==='/item.php')route=['happy','supplies','Inventory','Training supplies'];
      else if(path==='/points.php')route=['happy','supplies','Points','Point refill planning'];
      else if(path==='/page.php'&&/(?:[?&])sid=itemmarket(?:&|$)/.test(search))route=['profit','scan','Item Market','Item deals'];
      else if(path==='/page.php'&&/(?:[?&])sid=stocks(?:&|$)/.test(search))route=['profit','stocks','Stocks','Stock analysis'];
      if(!route)return;
      const [id,section,page,title]=route;
      const group=node('div','staxx-intel');group.append(node('strong','','ON THIS TORN PAGE · '+page));
      group.append(node('p','','Context shortcut only. No Torn fields are changed.'));
      const button=node('button','','Open '+title);button.type='button';
      button.dataset.hubSectionTool=id;button.dataset.hubSectionTab=section;
      button.disabled=!active[id];if(!active[id])button.textContent='Enable '+id+' helper to review';
      group.append(button);host.append(group);
    }
    function renderEarlyWarnings(){
      const host=root.querySelector('#staxx-hub-early');if(!host)return;host.replaceChildren();
      const now=Date.now(),soon=taskRowsV25().filter(x=>!x.cached&&active[x.owner]&&!completionFor(x)&&
        ['urgent','now','soon'].includes(x.status)&&Number.isFinite(x.dueAt)&&
        x.dueAt>now&&x.dueAt<=now+3600000).slice(0,3);
      if(!soon.length)return;
      const panel=node('div','staxx-intel');panel.append(node('strong','','COMING UP · SOURCE-DATED'));
      for(const item of soon){
        const btn=node('button','',item.tool+' · '+item.title+' · '+timeUntil(item.dueAt));
        btn.type='button';btn.dataset.openAlertTool=item.owner;btn.dataset.openAlertId=item.id;panel.append(btn);
      }
      panel.append(node('p','staxx-intel-foot','Due times are reported by the tool, not guaranteed outcomes. Checking a recommendation does not silence these reminders.'));
      host.append(panel);
    }
    function renderChangedActions(){
      const host=root.querySelector('#staxx-hub-changes');if(!host)return;host.replaceChildren();
      const changed=taskRowsV25().filter(x=>!x.cached&&active[x.owner]&&!completionFor(x)&&flagOf(x)).slice(0,4);
      if(!changed.length)return;
      const panel=node('div','staxx-intel');panel.append(node('strong','','NEW OR UPDATED RECOMMENDATIONS'));
      for(const item of changed){
        const kind=flagOf(item);
        const btn=node('button','',(kind==='new'?'NEW':'UPDATED')+' · '+item.tool+' · '+item.title);
        btn.type='button';btn.dataset.openAlertTool=item.owner;btn.dataset.openAlertId=item.id;panel.append(btn);
      }
      const clear=node('button','','Mark changes seen');clear.type='button';clear.dataset.changeClear='1';panel.append(clear);
      panel.append(node('p','staxx-intel-foot','Highlights compare source recommendations observed on this device. They do not confirm completed gameplay.'));
      host.append(panel);
    }
    function ukDay(ms){
      const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
      return fmt.format(ms);
    }
    function renderDailyReport(){
      const host=root.querySelector('#staxx-hub-daily');if(!host)return;host.replaceChildren();
      const today=ukDay(Date.now()),captured=activity.filter(x=>ukDay(x.at)===today);
      const panel=node('div','staxx-intel');panel.append(node('strong','','TODAY · '+today+' · UK TIME'));
      panel.append(node('p','','Device-observed activity only. No record means no captured evidence, not that nothing happened in Torn.'));
      for(const e of entries.slice(0,3)){
        const rows=captured.filter(x=>x.tool===e.id);
        const api=rows.filter(x=>x.source==='api').length;
        const snapshot=rows.filter(x=>x.source==='snapshot').length;
        const recorded=rows.filter(x=>x.source==='recorded').length;
        const card=node('article','staxx-overview-card');
        card.append(node('b','',e.label),
          node('p','','Verified Torn logs: '+api+' · Observed changes: '+snapshot+' · Locally recorded: '+recorded));
        const sum=summaries[e.id],updated=Number(sum?.updated);
        const fresh=Boolean(active[e.id]&&updated>0&&updated<=Date.now()+60000&&Date.now()-updated<=freshnessMs(e.id));
        card.append(node('small','staxx-trendnote',sum?.headline?
          'Last-reported snapshot'+(fresh?' (recent)':' (last observed)')+': '+sum.headline:'No tool summary received'));
        panel.append(card);
      }
      panel.append(node('p','staxx-intel-foot','Estimated gains, modelled P/L and scheduled actions are not counted as verified activity.'));
      host.append(panel);
    }
    function renderFrequent(){
      const host=root.querySelector('#staxx-hub-frequent');if(!host)return;
      host.replaceChildren();
      const now=Date.now(),ranked=usage.filter(x=>x.count>=2&&now-Number(x.last)<=30*86400000&&active[x.tool])
        .sort((a,b)=>(b.count*10+Math.max(0,30-Math.floor((now-b.last)/86400000)))-(a.count*10+Math.max(0,30-Math.floor((now-a.last)/86400000))));
      for(const x of ranked.slice(0,4)){
        const e=entries.find(item=>item.id===x.tool);if(!e)continue;
        const route=(sectionsByTool[x.tool]||e.sections||[]).find(r=>r[0]===x.section);
        if(x.section&&!route)continue;
        const btn=node('button');btn.type='button';
        if(route){btn.dataset.hubSectionTool=x.tool;btn.dataset.hubSectionTab=x.section;}else btn.dataset.openStaxx=x.tool;
        btn.append(node('span','',route?route[1]:e.label),node('small','',e.label+' · '+x.count+' visits'));
        host.append(btn);
      }
      if(!host.children.length)host.append(node('p','staxx-empty','Shortcuts appear here after you open a tool or section twice.'));
    }
    function renderDashboard(){
      const host=root.querySelector('#staxx-hub-dashboard');if(!host)return;
      host.replaceChildren();
      renderDailyReport();
      const check=node('button','staxx-overview-switch','↻ Refresh connected tools');check.type='button';check.dataset.syncAll='1';host.append(check);
      host.append(node('p','staxx-trendnote','Last-reported figures from each helper. Forecasts and estimates are not completed Torn actions.'));
      for(const e of entries){
        const sum=summaries[e.id],card=node('article','staxx-overview-card');
        card.append(node('b','',e.label));
        card.append(node('p','',sum?.headline||(active[e.id]?'Awaiting data':'Enable script to see figures')));
        const date=Number(sum?.updated),known=Number.isFinite(date)&&date>0&&date<=Date.now()+60000;
        card.append(node('small','staxx-trendnote',known?'Reported '+new Date(date).toLocaleString('en-GB')+(Date.now()-date>freshnessMs(e.id)?' · Stale':''):'No timestamped data'));
        const dl=node('dl');
        for(const metric of (Array.isArray(sum?.metrics)?sum.metrics:[]).slice(0,4)){
          const group=node('div');group.append(node('dt','',metric.label),node('dd','',metric.value));dl.append(group);
        }
        if(dl.childElementCount)card.append(dl);
        const go=node('button','staxx-overview-switch','Open '+e.label);go.type='button';go.dataset.openStaxx=e.id;card.append(go);
        host.append(card);
      }
    }
    function renderActivity(){
      const host=root.querySelector('#staxx-hub-activity');if(!host)return;
      host.replaceChildren();
      host.append(node('p','staxx-trendnote','API logs are verified events; snapshots are observed changes; manual entries are labelled locally recorded. Nothing here confirms a suggested action was completed.'));
      let shown=0;
      for(const event of activity.slice(0,30)){
        const e=entries.find(x=>x.id===event.tool);
        if(!e)continue;
        const row=node('article','staxx-overview-card');
        const type=event.source==='api'?'Verified Torn log':event.source==='snapshot'?'Observed snapshot':'Locally recorded';
        row.append(node('b','',e.label+' · '+type),node('p','',event.title));
        if(event.detail)row.append(node('small','staxx-trendnote',event.detail));
        const when=node('time','',new Date(event.at).toLocaleString('en-GB'));row.append(when);
        const go=node('button','staxx-overview-switch','View '+e.label);go.type='button';
        if(event.section){go.dataset.hubSectionTool=event.tool;go.dataset.hubSectionTab=event.section;}else go.dataset.openStaxx=event.tool;
        row.append(go);host.append(row);shown++;
      }
      if(!shown)host.append(node('p','staxx-empty','No source-backed events recorded yet. Activity appears after a helper observes a confirmed log, snapshot change, or local record.'));
    }
    function renderSessionAndChecklist(){
      const picker=root.querySelector('#staxx-hub-session'),host=root.querySelector('#staxx-hub-checklist');
      if(picker){
        picker.replaceChildren();
        const card=node('div','staxx-intel');
        card.append(node('strong','','PLAY TIME · PRIORITISE THE NEXT REVIEW'));
        const options=node('div','staxx-session-options');
        for(const value of [0,5,10,15,30,60]){
          const b=node('button','',value?value+' min':'Any');
          b.type='button';b.dataset.sessionMinutes=String(value);
          b.setAttribute('aria-pressed',String(sessionMinutes===value));options.append(b);
        }
        card.append(options,node('p','staxx-intel-foot',
          'Only source-estimated review time is used. Urgency and verified deadlines always come first; gameplay duration is not predicted.'));
        picker.append(card);
      }
      if(host){
        host.replaceChildren();
        const all=taskRowsV25();
        const fresh=all.filter(x=>!x.cached&&active[x.owner]);
        const completed=fresh.filter(x=>completionFor(x));
        const pending=fresh.filter(x=>!completionFor(x)&&!isReviewed(x));
        const checked=fresh.filter(x=>!completionFor(x)&&isReviewed(x));
        const card=node('div','staxx-intel');
        card.append(node('strong','','DAILY CHECKLIST · '+ukDay(Date.now())),
          node('p','','Pending '+pending.length+' · Verified complete '+completed.length+' · Checked (not complete) '+checked.length));
        for(const item of completed.slice(0,4)){
          const done=completionFor(item),line=node('p','staxx-completed','✓ '+item.tool+' · '+item.title);
          card.append(line,node('small','staxx-intel-foot','Matched Torn API event · '+new Date(done.at).toLocaleTimeString('en-GB')));
        }
        card.append(node('p','staxx-intel-foot',
          'Only exact matching source-published Torn API events can close a recommendation today. Unverified or changed tasks remain pending.'));
        host.append(card);
      }
    }
    function renderTasks(){
      if(!taskList)return;
      renderSessionAndChecklist();
      taskList.replaceChildren();
      renderBest();renderFrequent();renderSourceStatus();renderPageShortcut();renderEarlyWarnings();renderChangedActions();
      const filters=root.querySelector('#staxx-hub-task-filters');
      const all=taskRowsV25();
      if(filters){
        filters.replaceChildren();
        for(const [value,label] of [['all','Pending'],['now','Do now'],['soon','Soon'],['optional','Optional'],['fit','Fits time'],['reviewed','Checked'],['changed','Changed']]){
          const count=all.filter(x=>!completionFor(x)&&(value==='reviewed'?isReviewed(x):value==='changed'?Boolean(flagOf(x)):!isReviewed(x)&&(value==='all'||value==='fit'&&fitsSession(x)||categoryFor(x)===value))).length;
          const btn=node('button','',label+' · '+count);btn.type='button';btn.dataset.taskFilter=value;btn.setAttribute('aria-pressed',String(taskFilter===value));filters.append(btn);
        }
      }
      const rows=all.filter(x=>!completionFor(x)&&(taskFilter==='reviewed'?isReviewed(x):taskFilter==='changed'?Boolean(flagOf(x)):!isReviewed(x)&&(taskFilter==='all'||taskFilter==='fit'&&fitsSession(x)||categoryFor(x)===taskFilter)));
      if(taskFilter==='reviewed')taskList.append(node('p','staxx-queue-info','Checked items return after 4 hours, or immediately if their reported evidence changes. This is not confirmation of a Torn action.'));
      for(const item of rows.slice(0,(expandedTaskList||uiMode==='advanced')?6:2)){
        const btn=node("button","staxx-task "+(!item.cached&&item.status==="urgent"?"urgent":!item.cached&&item.status==="soon"?"soon":""));
        btn.type="button";btn.dataset.openAlertTool=item.owner;btn.dataset.openAlertId=item.id;
        btn.append(node("span","staxx-step",taskLabel(item)+" · "+item.tool),
          node("b","",item.title));
        if(item.detail)btn.append(node("small","",item.detail));
        if(flagOf(item))btn.append(node('small','staxx-changed',flagOf(item)==='new'?'NEW':'UPDATED SINCE LAST REVIEW'));
        btn.append(node('small','staxx-review-minutes',effortLabel(item)));
        if(item.dueAt)btn.append(node("small","",timeUntil(item.dueAt)));
        if(item.cached)btn.append(node("small","","Verify current Torn data before acting"));
        taskList.append(btn);
        taskList.append(feedbackControls(item));
        if(item.status!=='urgent'&&!item.cached){
          const checked=node('button','staxx-review-button',taskFilter==='reviewed'?'Return to queue':'Checked for now · 4h');
          checked.type='button';checked.dataset.reviewOwner=item.owner;checked.dataset.reviewId=item.id;
          checked.dataset.reviewUndo=taskFilter==='reviewed'?'1':'0';taskList.append(checked);
        }
      }
      if(!rows.length)taskList.append(node('p','staxx-empty',taskFilter==='reviewed'?'No checked recommendations.':taskFilter==='fit'?'No fresh recommendations have an estimated review time within this session.':taskFilter==='changed'?'No new or updated recommendations since the last marked review.':'Nothing pending in this category. Open a tool for new evidence.'));
      if(rows.length>2&&uiMode!=='advanced'){
        const more=node("button","staxx-more-tasks",expandedTaskList?"Show fewer actions":"Show "+Math.min(rows.length-2,4)+" more actions");
        more.type="button";more.dataset.toggleTasks="1";taskList.append(more);
      }
      if(rows.length>6&&(expandedTaskList||uiMode==='advanced'))taskList.append(node("p","staxx-foot",String(rows.length-6)+" further recommendations inside your tools"));
    }
    function render(){
      renderWelcome();
      const modeButton=root.querySelector('[data-hub-mode]');if(modeButton)modeButton.textContent='Display: '+(uiMode==='simple'?'Simple':'Advanced')+' · change';
      tools.replaceChildren();alerts.replaceChildren();
      const quick=root.querySelector("#staxx-hub-quick-tools");
      if(quick)quick.replaceChildren();
      let total=0,maxLevel=0,visible=0,muted=0;
      for(const [index,e] of entries.entries()){
        const n=activeNotice(e.id),count=n?Math.min(99,Number(n.count)||0):0;
        total+=count;visible+=Number(count>0);
        if(n)maxLevel=Math.max(maxLevel,n.level==="urgent"?2:n.level==="warning"?1:0);
        if(!n && notices[e.id]?.count>0)muted++;
        const btn=node("button","staxx-tool");btn.type="button";btn.dataset.openStaxx=e.id;
        const info=node("span","staxx-info");info.append(node("b","",e.label),node("small","",active[e.id]?e.desc:"Enable script to open"));
        btn.append(node("span","staxx-icon",e.icon),info,node("span","staxx-pill"+(count?" on":""),count||"›"));
        if(arrangeShown){
          const row=node("div","staxx-toolrow"),up=node("button","staxx-move","↑"),down=node("button","staxx-move","↓");
          up.type=down.type="button";up.dataset.moveId=down.dataset.moveId=e.id;up.dataset.moveDir="-1";down.dataset.moveDir="1";
          up.disabled=index===0;down.disabled=index===entries.length-1;
          up.title="Move "+e.label+" up";down.title="Move "+e.label+" down";
          row.append(btn,up,down);tools.append(row);
        }else tools.append(btn);
        if(quick&&index<3){
          const shortcut=node("button","staxx-quick-tool");
          shortcut.type="button";shortcut.dataset.openStaxx=e.id;
          shortcut.disabled=!active[e.id];
          shortcut.append(node("span","",e.label),node("small","",!active[e.id]?"Not active":count?count+" alerts":"Open"));
          quick.append(shortcut);
        }
      }
      toggle.classList.toggle("staxx-urgent",maxLevel===2);
      toggle.classList.toggle("staxx-warning",maxLevel===1);
      bubble.hidden=total===0;bubble.textContent=total>=100?"99+":String(total);
      toggle.setAttribute("aria-label",total?total+" Staxx notifications; open tools":"Open Staxx tools");
      root.querySelector("#staxx-hub-total").textContent=visible?visible+" tools":muted?muted+" muted":"All clear";
      const alertsTab=root.querySelector('[data-hub-view="alerts"]');
      if(alertsTab)alertsTab.textContent=total?"Alerts · "+(total>99?"99+":total):"Alerts";
      for(const e of entries){
        const n=activeNotice(e.id);if(!n)continue;
        const card=node("div","staxx-alert "+n.level);
        const title=node("button","staxx-alert-title",e.label+" · "+n.count+" alert"+(n.count===1?"":"s"));
        title.type="button";title.dataset.openStaxx=e.id;card.append(title);
        card.append(node("span","",n.summary||"Needs attention"));
        if(Array.isArray(n.alerts)&&n.alerts.length){
          for(const item of n.alerts.slice(0,8)){
            const go=node("button","staxx-alert-item",item.title);
            go.type="button";go.dataset.openAlertTool=e.id;go.dataset.openAlertId=item.id;
            go.title=item.detail||item.title;
            card.append(go);
            if(item.detail)card.append(node("small","staxx-alert-description",item.detail));
          }
          if(n.alerts.length>8)card.append(node("small","",String(n.alerts.length-8)+" more — open the tool's Alerts tab"));
        }else for(const item of n.items.slice(0,2))card.append(node("small","",item));
        if(n.cached)card.append(node("small","","Last observed on a previous page"));
        if(n.dueAt){const countdown=node("small","staxx-due",timeUntil(n.dueAt));card.append(countdown);}
        const buttons=node("div","staxx-alert-actions");
        const dismiss=node("button","","Dismiss"),snooze=node("button","","Snooze ▾");
        dismiss.type=snooze.type="button";dismiss.dataset.dismissStaxx=e.id;snooze.dataset.snoozeStaxx=e.id;
        buttons.append(dismiss,snooze);card.append(buttons);
        const menu=node("div","staxx-snooze-menu");menu.hidden=true;
        for(const [minutes,label] of [[15,"15m"],[60,"1h"],[240,"4h"],[1440,"24h"]]){
          const option=node("button","",label);option.type="button";option.dataset.snoozeId=e.id;option.dataset.snoozeMinutes=String(minutes);menu.append(option);
        }
        const custom=node("label","","Custom");const input=node("input");input.type="number";input.min="1";input.max="10080";input.value="120";input.title="Snooze duration in minutes";
        const units=node("span","","min");custom.append(input,units);
        const set=node("button","","Set");set.type="button";set.dataset.snoozeCustom=e.id;menu.append(custom,set);
        card.append(menu);alerts.append(card);
      }
      if(!visible)alerts.append(node("p","staxx-empty",muted?"Alerts dismissed or snoozed. New alerts will still appear.":"Nothing needs your attention right now."));
      renderTasks();
      renderDashboard();
      renderActivity();
      if(findOpen)renderFind();
      showOverview();
      showDiagnosticsV25();
      launcherVisibility();
      renderContext();
    }
    root.addEventListener("click",e=>{
      const b=e.target.closest("button");if(!b)return;
      if(b.dataset.hubView){setFindOpen(false);switchHubView(b.dataset.hubView);return;}
      if(b.dataset.sessionMinutes!==undefined){
        const minutes=Number(b.dataset.sessionMinutes);
        if(![0,5,10,15,30,60].includes(minutes))return;
        sessionMinutes=minutes;saveLocal(sessionKey,minutes);
        document.dispatchEvent(new CustomEvent('staxx:time-budget',{detail:{minutes}}));
        renderTasks();return;
      }
      if(b.dataset.taskFilter){taskFilter=b.dataset.taskFilter;expandedTaskList=false;renderTasks();return;}
      if(b.hasAttribute('data-change-clear')){clearChangeFlags();return;}
      if(b.hasAttribute('data-vote-reset')){feedback=Object.create(null);saveLocal(feedbackKey,feedback);renderTasks();return;}
      if(b.dataset.voteOwner&&b.dataset.voteId){
        const item=taskRowsV25().find(x=>x.owner===b.dataset.voteOwner&&x.id===b.dataset.voteId);
        if(!item||item.cached||!active[item.owner])return;
        const vote=Number(b.dataset.voteValue);
        if(vote!==1&&vote!==-1)return;
        const key=actionKey(item.owner,item.id),prior=feedback[key]?.vote||0;
        if(prior===vote)delete feedback[key];else feedback[key]={vote,at:Date.now()};
        feedback=Object.fromEntries(Object.entries(feedback).slice(-80));
        saveLocal(feedbackKey,feedback);renderTasks();return;
      }
      if(b.dataset.reviewOwner&&b.dataset.reviewId){
        const item=taskRowsV25().find(x=>x.owner===b.dataset.reviewOwner&&x.id===b.dataset.reviewId);
        if(item)markReviewed(item,b.dataset.reviewUndo!=='1');return;
      }
      if(b.hasAttribute('data-usage-reset')){usage=[];saveLocal(usageKey,usage);renderFrequent();return;}
      if(b.hasAttribute('data-activity-clear')){activity=[];saveLocal(activityKey,activity);renderActivity();renderDailyReport();return;}
      if(b.hasAttribute('data-hub-find')){setFindOpen(!findOpen);return;}
      if(b.dataset.hubSectionTool){openTool(b.dataset.hubSectionTool,null,b.dataset.hubSectionTab);return;}
      if(b.dataset.hubGuideDone){saveLocal('staxx-hub-onboarded-v1',true);renderWelcome();return;}
      if(b.hasAttribute('data-hub-guide')){saveLocal('staxx-hub-onboarded-v1',false);switchHubView('today');renderWelcome();return;}
      if(b.hasAttribute('data-hub-mode')){uiMode=uiMode==='simple'?'advanced':'simple';saveLocal('staxx-hub-mode-v1',uiMode);expandedTaskList=false;publishMode();render();return;}
      if(b.dataset.toggleTasks){expandedTaskList=!expandedTaskList;renderTasks();return;}
      if(b.dataset.contextToggle!==undefined){saveLocal("staxx-hub-context-v1",!contextEnabled());renderContext();return;}
      if(b.dataset.dismissStaxx){const id=b.dataset.dismissStaxx,n=notices[id];if(n){controls[id]={...controls[id],dismissed:n.fingerprint,snoozeUntil:0};saveLocal("staxx-hub-alert-control-"+id,controls[id]);render();}return;}
      if(b.dataset.snoozeStaxx){const menu=b.parentNode?.nextSibling;if(menu)menu.hidden=!menu.hidden;return;}
      if(b.dataset.snoozeId || b.dataset.snoozeCustom){
        const id=b.dataset.snoozeId||b.dataset.snoozeCustom;
        const minutes=b.dataset.snoozeCustom?Number(b.parentNode?.querySelector("input")?.value):Number(b.dataset.snoozeMinutes);
        if(!Number.isInteger(minutes)||minutes<1||minutes>10080)return;
        controls[id]={...controls[id],snoozeUntil:Date.now()+minutes*60000};
        saveLocal("staxx-hub-alert-control-"+id,controls[id]);render();return;
      }
      if(b.dataset.moveId){
        const from=entries.findIndex(x=>x.id===b.dataset.moveId),to=from+Number(b.dataset.moveDir);
        if(from>=0&&to>=0&&to<entries.length){
          const [entry]=entries.splice(from,1);entries.splice(to,0,entry);
          saveLocal("staxx-hub-order-v3",entries.map(x=>x.id));render();
        }return;
      }
      if(b.hasAttribute("data-arrange")){
        arrangeShown=!arrangeShown;b.setAttribute("aria-pressed",String(arrangeShown));b.textContent=arrangeShown?"Done":"Reorder";render();return;
      }
      if(b.dataset.openAlertTool){openTool(b.dataset.openAlertTool,b.dataset.openAlertId);return;}
      if(b.dataset.openStaxx){openTool(b.dataset.openStaxx);return;}
      if(b.hasAttribute("data-overview")){overviewShown=!overviewShown;if(overviewShown){diagnosticsShown=false;refreshConnectedV26();}render();return;}
       if(b.dataset.syncAll){refreshConnectedV26(true);return;}
       if(b.hasAttribute("data-diagnostics")){diagnosticsShown=!diagnosticsShown;if(diagnosticsShown){overviewShown=false;
         document.dispatchEvent(new CustomEvent("staxx:diagnostics-request"));}render();return;}
       if(b.dataset.checkDiagnostics){document.dispatchEvent(new CustomEvent("staxx:ping"));
         document.dispatchEvent(new CustomEvent("staxx:diagnostics-request"));showDiagnosticsV25();return;}
       if(b.dataset.copyDiagnostics){const report=JSON.stringify(diagnosticReportV25(),null,2);
         const clipboard=window.navigator?.clipboard;
         if(clipboard?.writeText){clipboard.writeText(report).catch(()=>{const box=diagnostics.querySelector("#staxx-safe-report");if(box){box.hidden=false;box.value=report;}});}
         else{const box=diagnostics.querySelector("#staxx-safe-report");if(box){box.hidden=false;box.value=report;box.select?.();}}
         return;}
      if(b===toggle){if(Date.now()<suppressClickUntil)return;setExpanded(true);refreshConnectedV26();return;}
      if(b.hasAttribute("data-hub-close"))setExpanded(false);
    });
    veil.addEventListener("click",()=>setExpanded(false));
    findInput?.addEventListener?.('input',renderFind);
    findInput?.addEventListener?.('keydown',e=>{
      if(e.key==='Enter'){
        const first=findResults?.querySelector?.('button:not(:disabled)');
        if(first){e.preventDefault?.();first.click();}
      }
    });
    document.addEventListener('staxx:find',()=>{
      document.dispatchEvent(new CustomEvent('staxx:closeall'));
      openPanels.clear();panelOpen=false;
      setExpanded(true);setFindOpen(true);
    });
    document.addEventListener("keydown",e=>{
      if(e.key==='Escape'&&findOpen){e.preventDefault?.();setFindOpen(false);return;}
      if(e.key==='Escape'&&expanded){setExpanded(false);return;}
      if(expanded&&(e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){
        e.preventDefault?.();setFindOpen(true);
      }
    });
    toggle.addEventListener("pointerdown",e=>{
      if(e.button!==undefined&&e.button!==0)return;
      moving={id:e.pointerId,startY:e.clientY,top:toggle.getBoundingClientRect().top,dragged:false};
      try{toggle.setPointerCapture?.(e.pointerId);}catch(_){}
    });
    toggle.addEventListener("pointermove",e=>{
      if(!moving||e.pointerId!==moving.id)return;
      if(Math.abs(e.clientY-moving.startY)>7)moving.dragged=true;
      if(moving.dragged){const height=Math.max(160,window.innerHeight||600);
        const y=Math.max(18,Math.min(height-67,moving.top+e.clientY-moving.startY));
        toggle.style.top=Math.round(y)+"px";}
    });
    function endMove(e){if(!moving||e.pointerId!==moving.id)return;
      if(moving.dragged){suppressClickUntil=Date.now()+350;saveLocal("staxx-hub-position-v2",position((parseFloat(toggle.style.top)||0)/Math.max(1,window.innerHeight)));
        // Prevent a post-drag synthetic click from reopening the drawer.
        e.preventDefault?.();}
      moving=null;
    }
    toggle.addEventListener("pointerup",endMove);toggle.addEventListener("pointercancel",endMove);
    window.addEventListener("resize",()=>position(safeRead("staxx-hub-position-v2",0.43)));
    document.addEventListener("staxx:panel",e=>{
      if(!e.detail||!idOk(e.detail.id))return;
      if(e.detail.open){openPanels.add(e.detail.id);panelOpen=true;setExpanded(false);}
      else{openPanels.delete(e.detail.id);panelOpen=openPanels.size>0;launcherVisibility();}
      renderContext();
    });
    document.addEventListener('staxx:mode',e=>{const m=e.detail?.mode;if((m==='simple'||m==='advanced')&&m!==uiMode){uiMode=m;saveLocal('staxx-hub-mode-v1',m);expandedTaskList=false;render();}});
    document.addEventListener('staxx:visit',e=>{
      const d=e.detail||{},id=d.id;
      if(!idOk(id)||!active[id])return;
      const entry=entries.find(x=>x.id===id),routes=sectionsByTool[id]||entry?.sections||[];
      if(!routes.some(route=>route[0]===d.section))return;
      const key=id+'/'+d.section,prior=storedUse(key);
      if(prior&&Date.now()-Number(prior.last)<10000)return;
      recordUse(id,d.section);
    });
    document.addEventListener("staxx:register",e=>{
      const d=e.detail||{},id=d.id;if(!idOk(id))return;
      let entry=entries.find(x=>x.id===id);
      if(!entry && entries.length<25){
        entry={id,label:String(d.label||id).slice(0,40),icon:String(d.icon||"S").slice(0,3),desc:String(d.desc||"Staxx tool").slice(0,70)};
        entries.push(entry);controls[id]=safeRead("staxx-hub-alert-control-"+id,{});
        saveLocal("staxx-hub-registry-v2",entries.slice(3));
      }
      if(entry){
        if(d.label)entry.label=String(d.label).slice(0,40);
        if(d.icon)entry.icon=String(d.icon).slice(0,3);
        if(d.desc)entry.desc=String(d.desc).slice(0,70);
        if(Array.isArray(d.sections))entry.sections=d.sections.slice(0,20)
          .filter(x=>x&&/^[a-z][a-z0-9-]{0,31}$/.test(String(x.id||'')))
          .map(x=>[String(x.id),String(x.label||x.id).slice(0,45)]);
        if(typeof d.trendMetric==='string')entry.trendMetric=d.trendMetric.slice(0,36);
        if(Number(d.freshnessMs)>=60000&&Number(d.freshnessMs)<=86400000)entry.freshnessMs=Number(d.freshnessMs);
        if(!registeredAt[id])registeredAt[id]=Date.now();
        active[id]=true;render();}
    });

    document.addEventListener("staxx:diagnostics",e=>{
      const d=e.detail||{},id=d.id;if(!idOk(id)||!entries.some(x=>x.id===id))return;
      const allow=(value,valid)=>valid.includes(value)?value:"unknown";
      healthReports[id]={version:String(d.version||"not-reported").slice(0,20),
        api:allow(d.api,["ready","stale","missing","error","unknown"]),
        storage:allow(d.storage,["ready","missing","error","unknown"]),
        ui:allow(d.ui,["ready","missing","error","unknown"]),
        detail:String(d.detail||"").replace(/[A-Za-z0-9]{20,}/g,"[redacted]").slice(0,110),
        observedAt:Date.now()};
      if(diagnosticsShown)showDiagnosticsV25();
    });
    document.addEventListener("staxx:notice",e=>{
      const d=e.detail||{},id=d.id;if(!idOk(id)||!entries.some(x=>x.id===id))return;
      const count=Math.min(99,Math.max(0,Math.floor(Number(d.count)||0)));
      const n={count,summary:String(d.summary||"").slice(0,180),
        items:Array.isArray(d.items)?d.items.slice(0,5).map(x=>String(x).slice(0,160)):[],
        level:["urgent","warning","info"].includes(d.level)?d.level:"info",cached:false};
      n.alerts=Array.isArray(d.alerts)?d.alerts.slice(0,30).filter(x=>x&&/^[a-z][a-z0-9-]{0,63}$/.test(String(x.id||""))).map(x=>({id:String(x.id),title:String(x.title||x.id).slice(0,100),detail:String(x.detail||"").slice(0,190)})):[];
      n.dueAt=Number.isFinite(Number(d.dueAt))&&Number(d.dueAt)>0?Number(d.dueAt):null;
      n.fingerprint=JSON.stringify([n.count,n.summary,n.items,n.alerts,n.level,n.dueAt]);
      if(JSON.stringify(notices[id])!==JSON.stringify(n)){notices[id]=n;remember();render();}
    });
    document.addEventListener("staxx:actions",e=>{
      const d=e.detail||{},id=d.id;if(!idOk(id)||!entries.some(x=>x.id===id))return;
      const items=Array.isArray(d.items)?d.items.slice(0,12).filter(a=>a&&/^[a-z][a-z0-9-]{0,63}$/.test(String(a.id||""))).map(a=>({
        id:String(a.id),title:String(a.title||"Review action").slice(0,100),detail:String(a.detail||"").slice(0,160),
        status:["urgent","now","soon","review","optional"].includes(a.status)?a.status:"review",
        priority:Math.max(0,Math.min(100,Number(a.priority)||0)),
        dueAt:Number.isFinite(Number(a.dueAt))&&Number(a.dueAt)>0?Number(a.dueAt):null,
        reviewMinutes:Number.isInteger(Number(a.reviewMinutes))&&Number(a.reviewMinutes)>=1&&Number(a.reviewMinutes)<=60?Number(a.reviewMinutes):null
      })):[];
      const next={items,updated:Number(d.updated)||Date.now(),cached:false};
      noteObservedActions(id,items,next.updated);
      if(JSON.stringify(actionSets[id])!==JSON.stringify(next)){actionSets[id]=next;remember();render();}
    });
    document.addEventListener('staxx:activity',e=>{
      const d=e.detail||{},tool=d.id;
      if(!idOk(tool)||!entries.some(x=>x.id===tool)||!Array.isArray(d.events))return;
      let changed=false;
      const now=Date.now();
      for(const item of d.events.slice(0,30)){
        if(!item||typeof item.id!=='string'||!/^[a-z0-9][a-z0-9_.:-]{0,98}$/i.test(item.id))continue;
        if(!['api','snapshot','recorded'].includes(item.source))continue;
        const at=Number(item.at);
        if(!Number.isFinite(at)||at<=now-30*86400000||at>now+60000)continue;
        if(activity.some(x=>x.tool===tool&&x.id===item.id))continue;
        const routes=sectionsByTool[tool]||entries.find(x=>x.id===tool)?.sections||[];
        const section=routes.some(x=>x[0]===item.section)?item.section:null;
        const action=typeof item.completedActionId==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(item.completedActionId)&&
          item.source==='api'&&ukDay(at)===ukDay(now)&&active[tool]?
          actionSets[tool]?.items?.find(x=>x.id===item.completedActionId):null;
        const complete=action&&!actionSets[tool]?.cached&&now-Number(actionSets[tool].updated)<=freshnessMs(tool);
        activity.push({tool,id:item.id,at,source:item.source,
          title:String(item.title||'Observed update').slice(0,100),
          detail:String(item.detail||'').slice(0,180),section,
          ...(complete?{completedActionId:action.id,completedSig:shortHash(reviewSignature(action))}:{})});
        changed=true;
      }
      if(changed){activity=activity.filter(x=>x.at>Date.now()-30*86400000)
        .sort((a,b)=>b.at-a.at).slice(0,120);saveLocal(activityKey,activity);renderActivity();renderDailyReport();renderTasks();}
    });
    document.addEventListener("staxx:summary",e=>{
      const d=e.detail||{},id=d.id;if(!idOk(id)||!entries.some(x=>x.id===id))return;
      const entry={headline:String(d.headline||"").slice(0,90),
        metrics:Array.isArray(d.metrics)?d.metrics.slice(0,4).map(x=>({label:String(x.label||"").slice(0,36),value:String(x.value??"—").slice(0,45)})):[],
        updated:Number(d.updated)||Date.now()};
      if(JSON.stringify(summaries[id])!==JSON.stringify(entry)){summaries[id]=entry;recordTrend(id,entry);remember();if(expanded&&overviewShown)showOverview();renderDashboard();}
    });
    window.setInterval(()=>{if(!document.hidden&&entries.some(e=>Number(controls[e.id]?.snoozeUntil)>0&&Number(controls[e.id]?.snoozeUntil)<=Date.now())){for(const e of entries){if(Number(controls[e.id]?.snoozeUntil)>0&&Number(controls[e.id]?.snoozeUntil)<=Date.now()){controls[e.id]={...controls[e.id],snoozeUntil:0};saveLocal("staxx-hub-alert-control-"+e.id,controls[e.id]);}}render();}else if(!document.hidden&&expanded&&entries.some(e=>activeNotice(e.id)?.dueAt)){render();}},60000);
    window.addEventListener?.("hashchange",()=>{renderContext();renderPageShortcut();});
    window.addEventListener?.("popstate",()=>{renderContext();renderPageShortcut();});
    window.addEventListener?.("resize",renderContext);
    window.setInterval?.(()=>{if(!document.hidden){renderContext();if(expanded)renderPageShortcut();}},15000);
    window.setInterval?.(()=>{if(!document.hidden&&expanded){renderEarlyWarnings();if(hubView==='dashboard')renderDailyReport();}},60000);
    document.addEventListener('staxx:time-budget-request',()=>document.dispatchEvent(new CustomEvent('staxx:time-budget',{detail:{minutes:sessionMinutes}})));
    // Older v1 notifications cannot be trusted for dismiss-state comparisons.
    render();
    document.dispatchEvent(new CustomEvent("staxx:ping"));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startHub,{once:true});else startHub();
})();

/* WarStaxx loader probe · independent of the optional API and full WarStaxx UI */
(function () {
  'use strict';
  if (typeof document === 'undefined' || typeof window === 'undefined' ||
      !/^(www\.)?torn\.com$/i.test(location.hostname) ||
      window.top !== window.self || window.__warStaxxProbe) return;
  window.__warStaxxProbe = true;
  const id='war', version='0.1.2';
  function emit(name,detail) {
    try{document.dispatchEvent(new CustomEvent('staxx:'+name,{detail}));}catch(_){}
  }
  function register() {
    emit('register',{id,label:'WarStaxx',icon:'WS',
      desc:window.__warStaxxReady?'Ranked war command centre':'Ranked war intelligence · checking startup',
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
      status.textContent='Version '+version+' · App entered: '+(window.__warStaxxBooted?'yes':'no')+' · App ready: '+(window.__warStaxxReady?'yes':'no');
      const copy=document.createElement('button');copy.type='button';copy.textContent='Copy startup status';
      copy.style.cssText='padding:9px 12px;background:#19547a;color:#fff;border:1px solid #67c6ed;border-radius:8px;margin-right:8px;';
      copy.addEventListener('click',()=>{
        const t='WarStaxx '+version+' · main-entry='+!!window.__warStaxxBooted+' · ready='+!!window.__warStaxxReady+' · page='+location.pathname;
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
  const ID='war', VER='0.1.2', CONFIG='warstaxx-config-v1', DATA='warstaxx-data-v1';
  const API='https://api.torn.com/v2', MIN=60000, HOUR=3600000;
  const sections=['overview','targets','matchups','strategy','activity','history','assignments','alerts','settings','diagnostics'];
  const labels={overview:'Command',targets:'Targets',matchups:'Matchups',strategy:'Strategy',activity:'Activity',history:'History',assignments:'Orders',alerts:'Alerts',settings:'Settings',diagnostics:'Diagnostics'};
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const positive=v=>Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v):0;
  const fmt=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(Number(v)):'—';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeRead=(k,def)=>{try{return JSON.parse(localStorage.getItem(k))||def;}catch(_){return def;}};
  const stamp=t=>t?new Date(t).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' TCT':'Not recorded';
  const age=t=>t?Math.max(0,Math.floor((Date.now()-t)/MIN))+'m ago':'Not collected';
  const link=id=>'https://www.torn.com/profiles.php?XID='+positive(id);
  const attackLink=id=>'https://www.torn.com/loader.php?sid=attack&user2ID='+positive(id);
  const apiKeyPda=typeof window.PDA_APIKEY==='string'?window.PDA_APIKEY:'###PDA-APIKEY###';
  const defaults={key:'',ourId:0,enemyId:0,refreshSeconds:120,historyLimit:8,enableAttacks:false,ffEnabled:false,ffConsent:false,ffKey:'',assignments:{},blackSkulls:{},spies:{},notes:{},hidden:false};
  const cfg=Object.assign({},defaults,safeRead(CONFIG,{}));
  cfg.assignments=cfg.assignments&&typeof cfg.assignments==='object'?cfg.assignments:{};
  cfg.blackSkulls=cfg.blackSkulls&&typeof cfg.blackSkulls==='object'?cfg.blackSkulls:{};
  cfg.spies=cfg.spies&&typeof cfg.spies==='object'?cfg.spies:{};
  cfg.notes=cfg.notes&&typeof cfg.notes==='object'?cfg.notes:{};
  const freshData=()=>({ours:[],enemies:[],ourWars:[],enemyWars:[],reports:{},activity:{},ffstats:{},attacks:[],seenAttacks:{},updated:{},errors:{},backoff:{},war:null,meta:{},sampleCount:0});
  const state={data:Object.assign(freshData(),safeRead(DATA,{})),open:false,tab:'overview',showMore:false,
    filter:'all',search:'',loading:false,spinner:'',error:'',scanning:false,alerts:[],chosen:0,
    lastRefresh:0,historicalRead:0,localKeyError:false,warExpected:false};
  state.data.reports=state.data.reports||{};
  state.data.activity=state.data.activity||{};
  state.data.ffstats=state.data.ffstats||{};
  state.data.updated=state.data.updated||{};
  state.data.errors=state.data.errors||{};
  state.data.backoff=state.data.backoff||{};
  state.data.seenAttacks=state.data.seenAttacks||{};
  const effectiveKey=()=>cfg.key.trim()||(apiKeyPda.includes('PDA-APIKEY')?'':apiKeyPda);
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
      position:String(p.position||''),status:String(p.status?.state||p.status||'Unknown'),
      statusText:String(p.status?.description||''),until:n(p.status?.until)*1000,
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
    const r=unpack(j,'rankedwarreport');const f=parseArray(r.factions||r.participants);
    return {id:warId,war:r.war||{},factions:f.map(side=>({
      id:positive(side.id||side.faction_id),name:String(side.name||''),score:n(side.score),attacks:n(side.attacks),
      members:parseArray(side.members||{}).map(p=>({id:positive(p.id||p.user_id),name:String(p.name||''),score:n(p.score),attacks:n(p.attacks),level:n(p.level)})).filter(p=>p.id)
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
  function snapshot(){
    const hour=Math.floor(Date.now()/HOUR);
    for(const [side,players] of [['ours',state.data.ours],['enemies',state.data.enemies]]){
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
      if(memberState(p)!=='okay')return {friend:p,enemy:null,reason:memberState(p)==='hospital'?'Recover / monitor hospital expiry':memberState(p)==='away'?'Travelling · return and prepare':'Unavailable · standby and support',details:null};
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
    return 'WarStaxx · '+(state.data.war?.opponentName||('Opponent faction '+(positive(cfg.enemyId)||'unknown')))+'\n'+
      'Generated '+new Date().toISOString()+' · roster '+age(last)+'\n'+
      rows.map(x=>(cfg.blackSkulls[x.friend.id]?'[BLACK SKULL] ':'')+x.friend.name+' ['+x.friend.id+'] → '+
        (x.enemy?x.enemy.name+' ['+x.enemy.id+']':'Scout / Support / Standby')+' — '+x.reason+
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
    if(!positive(cfg.ourId))out.push({id:'faction-id',title:'Confirm your faction',detail:'Choose your own faction ID in Settings if autodetection has not completed.',status:'now',priority:92,tab:'settings'});
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
    event('register',{id:ID,label:'WarStaxx',icon:'WS',desc:'Ranked wars · Live targets · Matchups',trendMetric:'Hittable enemies',freshnessMs:300000,sections:sections.map(id=>({id,label:labels[id]}))});
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
  async function identify(){
    if(positive(cfg.ourId))return;
    const j=await call('/user/profile','identity',24*HOUR);
    if(!j)return;
    const f=j.faction||j.profile?.faction||{};
    const id=positive(f.faction_id||f.id);
    if(id){cfg.ourId=id;saveCfg();}
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
    const ids=[...new Set([...state.data.ourWars.slice(0,limit),...state.data.enemyWars.slice(0,limit)]
      .map(w=>w.id).filter(Boolean))].filter(id=>!state.data.reports[id]);
    // Bounded incremental backfill: at most 3 report calls per refresh.
    for(const id of ids.slice(0,3)){
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
      await identify();
      if(!positive(cfg.ourId))throw new Error('Could not detect your faction. Enter the faction ID in Settings.');
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
        if(own||enemy)snapshot();
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
  root.innerHTML='<div class="ws-veil" data-close></div><section class="ws-panel" role="dialog" aria-label="WarStaxx command centre" aria-modal="true">'+
    '<header class="ws-head"><div><strong>War<span>Staxx</span></strong><small>RANKED WAR INTELLIGENCE · v'+VER+'</small></div>'+
    '<div class="ws-head-buttons"><button type="button" data-action="refresh">↻ Refresh</button><button type="button" data-action="find">⌕</button><button type="button" data-close aria-label="Close">×</button></div></header>'+
    '<nav class="ws-tabs" aria-label="WarStaxx sections"></nav><main class="ws-content"></main>'+
    '<footer class="ws-footer"><span class="ws-sync"></span><span>Observations, not automated attacks</span></footer></section>';
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
  function statusNote(){
    const latest=Math.max(n(state.data.updated.enemies),n(state.data.updated.ours));
    const fresh=latest&&Date.now()-latest<5*MIN;
    return '<div class="ws-note'+(fresh?'':' ws-warn')+'">'+
      (state.loading?'Refreshing official data… ':fresh?'Live roster sampled '+esc(age(latest))+'. ':'Status may be stale. Latest roster: '+esc(age(latest))+'. ')+
      'Travel, online and hospital data are observed snapshots—not a continuous historical log. '+'<span class="ws-small">Times shown in TCT (UTC).</span></div>'+
      (state.error?'<div class="ws-note ws-warn">'+esc(state.error)+'</div>':'');
  }
  function overview(){
    const w=state.data.war,score=warScore();
    const online=state.data.enemies.filter(isOnline).length;
    const ready=state.data.enemies.filter(p=>evaluate(p).ready).length;
    let html=statusNote()+'<div class="ws-grid">'+
      stat('War status',w?'ACTIVE':'Scouting',w?'vs '+(w.opponentName||('Faction '+w.opponentId)):'No active ranked war confirmed')+
      stat('Net war score',score?fmt(score.net):'—',score&&score.target?'Target '+fmt(score.target):'Current score requires verified war data')+
      stat('Enemy Okay',state.data.enemies.length?fmt(ready):'—','Based on latest roster snapshot')+
      stat('Enemy online',state.data.enemies.length?fmt(online):'—','Current online flag, not a prediction')+
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
      '<div class="ws-toolbar">'+b('Happy Jump · energy','tool:happy')+b('ProfitStaxx · supplies','tool:profit')+b('Company Helper','tool:company')+'</div>');
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
        return '<tr><td><a href="'+link(p.id)+'">'+esc(p.name)+'</a><small> ['+p.id+'] · L'+fmt(p.level)+'</small><br>'+pill(ev.reason,ev.ready?'good':ev.kind==='hospital'?'bad':'')+'</td>'+
          '<td>'+pill(p.status,ev.ready?'good':'')+'<br><small>'+esc(p.statusText)+'</small></td>'+
          '<td>'+pill(p.lastAction,isOnline(p)?'good':'')+'<br><small>'+esc(age(p.lastAt))+'</small></td>'+
          '<td>'+fmt(ev.hist.wars)+' wars'+(ev.hist.avg===null?'':' · avg '+fmt(ev.hist.avg)+' points')+
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
      '<div><h3>Live observation</h3><p>'+pill(p.status)+' · '+pill(p.lastAction)+'</p><p>'+esc(p.statusText)+'</p>'+
      '<small>Last action '+esc(age(p.lastAt))+'; snapshot '+esc(age(p.updated))+'</small></div>'+
      '<div><h3>Historical output</h3><p>'+hist.wars+' official war reports</p><p>'+fmt(hist.score)+' total score · '+fmt(hist.attacks)+' attacks</p>'+
      '<small>Same member ID, no assumption about changed faction membership</small></div>'+
      '<div><h3>Travel/activity sampling</h3><p>'+pat.count+' checks · '+pat.travel+'% away · '+pat.online+'% online</p>'+
      '<small>Coverage '+esc(pat.reliability)+(pat.peak===null?'':'; peak sampled '+pat.peak+':00 TCT')+'</small><br><small>In-war: '+esc(pat.warSamples?pat.warTravel+'% travelling/abroad in '+pat.warSamples+' checks':'No in-war samples')+'</small></div>'+
      '<div><h3>Fair fight</h3><p>'+esc(myFf.avg===null?'No observed FF':myFf.avg.toFixed(2)+'x observed')+'</p>'+
      '<small>'+myFf.count+' recorded encounters from faction attacks</small><br><small>FFScouter (your key): '+esc(third&&third.ff!==null?third.ff.toFixed(2)+'x estimated':'Unavailable')+' · public BSS '+esc(third&&third.bss?fmt(third.bss):'unknown')+'</small></div></div>'+
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
        '<td>'+esc(x.ff.avg===null?'Not observed':x.ff.avg.toFixed(2)+'x · '+x.ff.count+' recorded')+'</td>'+
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
        'Compare both factions’ actual online coverage before committing energy. Current online counts are snapshots, not guaranteed future availability.',
        'Focus on opponents your members can actually beat; a high fair-fight multiplier is useful only when the battle is winnable.',
        'Monitor enemy hospital expiry and travel returns, then manually coordinate strikes using confirmed live statuses.',
        'Use past war reports to identify consistently high scorers; score alone is not proof of battle-stat strength.',
        'Keep reserve hitters and energy available for counterattacks. Open Happy Jump to review energy and training preparation.'
      ].map(s=>'<p>• '+esc(s)+'</p>').join('')+
      '<div class="ws-toolbar">'+b('Happy Jump','tool:happy')+b('War targets','tab:targets')+'</div>');
  }
  function activity(){
    const enemies=state.data.enemies;
    const summary=enemies.map(p=>({p,pat:pattern('enemies',p.id)})).sort((a,b)=>b.pat.count-a.pat.count);
    return statusNote()+card('Activity evidence','<p>Sampled online, travelling and abroad states are collected only while Torn PDA is open with WarStaxx installed. Percentages are percentages of sampled checks, not real time spent.</p>'+
      '<p>Moderate confidence requires at least 60 observations across 12 distinct UTC hours. No past-war travel history can be reconstructed from official war reports alone.</p>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Enemy</th><th>Samples</th><th>Online checks</th><th>Travelling/abroad</th><th>Observed peak TCT</th><th>Confidence</th></tr></thead><tbody>'+
      summary.map(x=>'<tr><td>'+esc(x.p.name)+'</td><td>'+fmt(x.pat.count)+'</td><td>'+fmt(x.pat.online)+'%</td>'+
        '<td>'+fmt(x.pat.travel)+'% overall / '+esc(x.pat.warTravel===null?'no war samples':x.pat.warTravel+'% during war')+'</td><td>'+esc(x.pat.peak===null?'—':x.pat.peak+':00')+'</td><td>'+pill(x.pat.reliability)+'</td></tr>').join('')+
      '</tbody></table></div>')+
      card('Next development of intelligence','<p>Coverage improves with foreground checks across multiple days and war windows. This version does not claim to identify an individual’s sleep schedule from a handful of polls.</p>');
  }
  function history(){
    const ours=state.data.ourWars,enemies=state.data.enemyWars,all=[['Our faction',ours,cfg.ourId],['Opponent faction',enemies,cfg.enemyId]];
    return statusNote()+'<div class="ws-grid">'+all.map(([label,wars,faction])=>card(label,'<p>'+fmt(wars.length)+' ranked wars loaded · '+fmt(wars.filter(w=>w.winner===positive(faction)).length)+' wins recorded</p>'+
      (wars.length?'<div class="ws-table-wrap"><table><thead><tr><th>War ID / Start</th><th>Outcome</th><th>Scores</th><th>Details</th></tr></thead><tbody>'+
        wars.slice(0,20).map(w=>'<tr><td>#'+w.id+'<br><small>'+esc(stamp(w.start*1000))+'</small></td>'+
          '<td>'+pill(w.end?(w.winner===positive(faction)?'Won':'Lost'):'Ongoing')+'</td>'+
          '<td>'+esc(w.scores.map(s=>s.id+': '+fmt(s.score)).join(' / ')||'Not reported')+'</td>'+
          '<td>'+pill(state.data.reports[w.id]?'Report stored':'Awaiting backfill')+'</td></tr>').join('')+'</tbody></table></div>':empty('No reports loaded yet.')))).join('')+'</div>'+
      card('Player score leaders','<div class="ws-grid">'+
        [['Our highest recorded',state.data.ours,'ours'],['Enemy highest recorded',state.data.enemies,'enemies']].map(([title,roster,side])=>
          '<div><h3>'+esc(title)+'</h3>'+roster.map(p=>({p,h:pastPerformance(p.id,side)})).filter(x=>x.h.wars).sort((a,b)=>b.h.score-a.h.score).slice(0,8)
          .map(x=>'<p>'+esc(x.p.name)+' · '+fmt(x.h.score)+' total points / '+x.h.wars+' report(s)</p>').join('')+'</div>').join('')+'</div>');
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
      '<label>API key (saved locally, never displayed on diagnostics)<input id="ws-key" type="password" autocomplete="off" placeholder="'+(effectiveKey()?'Key available · leave blank to keep':'Enter custom-scoped Torn API key')+'"></label>'+
      '<label>Your faction ID<input type="number" id="ws-our" min="1" value="'+(positive(cfg.ourId)||'')+'"></label>'+
      '<label>Opponent faction ID (auto-updated if a ranked war is detected)<input type="number" id="ws-enemy" min="1" value="'+(positive(cfg.enemyId)||'')+'"></label>'+
      '<label>Automatic refresh<select id="ws-interval">'+[90,120,180,300].map(s=>'<option value="'+s+'" '+(cfg.refreshSeconds===s?'selected':'')+'>'+s+' seconds while visible</option>').join('')+'</select></label>'+
      '<label>Historical wars per side<select id="ws-limit">'+[3,5,8,12,20].map(s=>'<option value="'+s+'" '+(cfg.historyLimit===s?'selected':'')+'>'+s+' wars</option>').join('')+'</select></label>'+
      '<label><input type="checkbox" id="ws-attacks" '+(cfg.enableAttacks?'checked':'')+'> Read my faction attacks for observed fair-fight data (extra API permission)</label>'+ 
      '<h3>FFScouter · optional, independent service</h3><p>Enter your own Torn API key that you have registered with FFScouter. This sends that key and selected opponent IDs to FFScouter; unlike the standard Torn API requests, this is a third-party service. Read the <a href="https://ffscouter.com/#data-policy" target="_blank" rel="noopener noreferrer">FFScouter data policy</a> and consider their premium plans if useful.</p>'+ 
      '<label>Registered FFScouter API key<input id="ws-ffkey" type="password" autocomplete="off" placeholder="'+(cfg.ffKey?'Key saved · leave blank to keep':'Torn key registered with FFScouter')+'"></label>'+ 
      '<label><input type="checkbox" id="ws-ff-consent" '+(cfg.ffConsent?'checked':'')+'> I have read the FFScouter data policy and knowingly enable this third-party lookup.</label>'+ 
      '<label><input type="checkbox" id="ws-ff-enable" '+(cfg.ffEnabled?'checked':'')+'> Fetch FFScouter estimates using my registered key, no more than once per 10 minutes.</label>'+
      '<div class="ws-toolbar">'+b('Save settings','save-settings')+b('Refresh all now','refresh')+b('Clear stored API key','clear-key')+'</div>'+
      '<p class="ws-small">API access depends on your custom key scope. Opponent member lists and ranked-war history use public selections; your own detailed attacks require faction access.</p>')+
      card('Local intelligence controls','<p>War histories, observations, manual spy reports and assignments remain in this browser storage. No central database or cross-device sync is active.</p>'+
      b('Reset activity samples only','reset-activity')+' '+b('Reset manual orders','reset-orders'))+
      card('Other tools','<div class="ws-toolbar">'+b('Happy Jump','tool:happy')+b('ProfitStaxx','tool:profit')+b('Company Helper','tool:company')+'</div>');
  }
  function diagnostics(){
    const d=state.data;
    return card('Safe diagnostics','<p>Version '+VER+' · API key '+(effectiveKey()?'available':'missing')+' · local storage '+(state.localKeyError?'problem':'available')+'</p>'+
      '<p>Own ID: '+(positive(cfg.ourId)?'configured':'missing')+' · Opponent ID: '+(positive(cfg.enemyId)?'configured':'missing')+'</p>'+
      '<p>Last known roster: '+esc(age(Math.max(n(d.updated.enemies),n(d.updated.ours))))+'</p>'+
      '<h3>Source freshness and API errors</h3>'+
      '<div class="ws-table-wrap"><table><thead><tr><th>Endpoint</th><th>Last success</th><th>Last error</th></tr></thead><tbody>'+
      [...new Set([...Object.keys(d.updated),...Object.keys(d.errors)])].slice(0,60).map(k=>
        '<tr><td>'+esc(k)+'</td><td>'+esc(age(d.updated[k]))+'</td><td>'+esc(d.errors[k]||'—')+'</td></tr>').join('')+
      '</tbody></table></div><p class="ws-small">This diagnostic screen deliberately excludes keys, imported spy values, saved notes and individual activity samples.</p>');
  }
  function render(){
    if(!root.isConnected)return;
    root.style.display=state.open?'block':'none';
    if(!state.open)return;
    const simple=(()=>{try{return JSON.parse(localStorage.getItem('staxx-hub-mode-v1'))!=='advanced';}catch(_){return true;}})();
    const basics=['overview','targets','matchups','strategy','assignments','alerts'];
    const displayed=simple&&!state.showMore?sections.filter(s=>basics.includes(s)||s===state.tab):sections;
    $('.ws-tabs',root).innerHTML=displayed.map(s=>'<button type="button" class="'+(s===state.tab?'on':'')+'" data-tab="'+s+'">'+esc(labels[s])+'</button>').join('')+
      (simple?'<button type="button" data-action="more">'+(state.showMore?'Less':'More')+'</button>':'');
    const pages={overview,targets,matchups,strategy,activity,history,assignments:orders,alerts:alertView,settings,diagnostics};
    const content=$('.ws-content',root);
    const scroll=content.scrollTop;
    const form=state.tab==='settings'?Array.from(content.querySelectorAll('input,select,textarea')).map(x=>({id:x.id,checked:x.checked,value:x.value,type:x.type})):null;
    try{content.innerHTML=(pages[state.tab]||overview)();}catch(e){content.innerHTML=empty('Render error: '+String(e.message||e));}
    if(form)for(const prior of form){if(!prior.id)continue;const field=content.querySelector('#'+prior.id);
      if(!field)continue;if(prior.type==='checkbox')field.checked=prior.checked;else field.value=prior.value;}
    content.scrollTop=scroll;
    $('.ws-sync',root).textContent=state.loading?'Checking Torn…':Math.max(n(state.data.updated.enemies),n(state.data.updated.ours))?'Last observation '+age(Math.max(n(state.data.updated.enemies),n(state.data.updated.ours))):'Not connected yet';
    $('.ws-head [data-action="refresh"]',root).disabled=state.loading;
  }
  function navigate(tab,focus){
    if(!sections.includes(tab))tab='overview';
    state.tab=tab;state.open=true;
    root.style.display='block';render();
    $('.ws-content',root).scrollTop=0;
    if(focus)setTimeout(()=>$('#ws-alert-'+focus,root)?.scrollIntoView({block:'center'}),100);
  }
  function open(detail={}){
    event('panel',{id:ID,open:true});
    state.open=true;
    if(detail.alertId){const alert=currentAlerts().find(a=>a.id===detail.alertId);navigate(alert?.tab||'alerts',detail.alertId);}
    else navigate(sections.includes(detail.section)?detail.section:state.tab);
    if(effectiveKey() && !state.loading && Date.now()-state.lastRefresh>90*1000)refresh(false);
  }
  function close(){state.open=false;render();event('panel',{id:ID,open:false});}
  function handle(action){
    if(action==='refresh'){refresh(true);return;}
    if(action==='find'){close();event('find',{});return;}
    if(action==='more'){state.showMore=!state.showMore;render();return;}
    if(action.startsWith('tab:')){navigate(action.slice(4));event('visit',{id:ID,section:state.tab});return;}
    if(action.startsWith('alert:')){const x=currentAlerts().find(a=>a.id===action.slice(6));navigate(x?.tab||'alerts');return;}
    if(action.startsWith('tool:')){close();event('open',{id:action.slice(5)});return;}
    if(action.startsWith('player:')){state.tab='targets';state.chosen=positive(action.slice(7));
      const c=$('.ws-content',root);c.innerHTML=playerIntel(state.chosen);c.scrollTop=0;return;}
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
    if(action.startsWith('clear-spy:')){delete cfg.spies[positive(action.slice(10))];saveCfg();navigate('targets');return;}
    if(action.startsWith('note:')){cfg.notes[positive(action.slice(5))]=String($('#ws-note',root)?.value||'').slice(0,500);saveCfg();navigate('targets');return;}
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
    if(action==='clear-key'){cfg.key='';saveCfg();render();return;}
    if(action==='reset-activity'){state.data.activity={};state.data.sampleCount=0;save();render();return;}
    if(action==='reset-orders'){cfg.assignments={};saveCfg();render();return;}
    if(action==='save-settings'){
      const supplied=$('#ws-key',root)?.value?.trim();if(supplied)cfg.key=supplied;
      const ffSupplied=$('#ws-ffkey',root)?.value?.trim();if(ffSupplied)cfg.ffKey=ffSupplied;
      cfg.ffConsent=Boolean($('#ws-ff-consent',root)?.checked);
      cfg.ffEnabled=Boolean($('#ws-ff-enable',root)?.checked)&&cfg.ffConsent&&Boolean(cfg.ffKey);
      cfg.ourId=positive($('#ws-our',root)?.value);
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
    button.type='button';button.textContent='⚔ Open WarStaxx';
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
    publish();
    window.__warStaxxReady=true;
    // Torn PDA can load userscripts in any order. Re-announce after the Hub has mounted.
    document.dispatchEvent(new CustomEvent('staxx:ping'));
    setTimeout(announce,2500);
    setTimeout(announce,9000);
    if(effectiveKey())setTimeout(()=>{if(!document.hidden)refresh(false);},2000);
  }
  // Registration maintenance is local-only; it does not query the Torn API.
  const registrationTimer=setInterval(()=>{if(!document.hidden){announce();mountFactionShortcut();}},45000);
  const refreshTimer=setInterval(()=>{
    if(!document.hidden&&effectiveKey()&&!state.loading&&Date.now()-state.lastRefresh>cfg.refreshSeconds*1000)refresh(false);
  },30000);
  window.addEventListener('beforeunload',()=>{clearInterval(refreshTimer);clearInterval(registrationTimer);},{once:true});
  boot();
})();
