> **Now part of TornStaxx 4.0:** This specialist module is displayed in Torn PDA as **War-TornStaxx** (v0.2.4). The shared command centre has moved to the standalone fifth userscript, [TornStaxx](https://github.com/Tom-Peters/TornStaxx). Install its [raw hub installer](https://raw.githubusercontent.com/Tom-Peters/TornStaxx/main/TornStaxx.user.js) once, then update this module from its **unchanged** [raw userscript URL](https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js). Existing domain functions, local data and API key settings remain in the specialist script. Repository rename will be handled separately.

# Torn-WarStaxx

**WarStaxx** is the fourth Torn Staxx tool: ranked-war intelligence, public war records, live roster status, conservative per-player assignments and historical opponent observation. **Author: IamEEKY.**

## Stable Torn PDA installer

https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

**Torn PDA: Add Script → Remote URL.** Paste the direct URL exactly as shown. The GitHub repository page (`github.com/Tom-Peters/Torn-WarStaxx`) and file page (`github.com/.../blob/main/...`) are HTML, not installable scripts. If Torn PDA displays **No header found**, check you used the **raw.githubusercontent.com** link (or its Raw button) rather than the repository webpage. The file starts immediately with `// ==UserScript==` and ends its metadata with `// ==/UserScript==`.

War-TornStaxx registers with the **fifth, standalone TornStaxx hub** as module ID `war`. It no longer bundles the full StaxxHub code. It retains an emergency compact launcher only if the standalone hub is absent.

**Version 0.1.2 startup diagnostics:** an independent, minimal startup probe now advertises WarStaxx to StaxxHub before the full app boots. If the main script throws or aborts after injection, opening the WarStaxx entry displays a safe status panel rather than silently disappearing. No credentials or private data are included in the status. In Torn PDA, confirm that the WarStaxx script is **enabled**, is using **end-of-document injection**, and that any new permission requests have been accepted. Update to 0.1.2 from the same raw URL and reload Torn. If StaxxHub still shows only the original three tools, WarStaxx likely did not execute at all: inspect Torn PDA’s scripts-on-this-page view or the script’s enable toggle.

**Version 0.1.1 visibility fix:** if Torn PDA loaded WarStaxx before the Hub, registration is re-announced after startup and periodically while the page is visible. On Torn faction/war pages an unobtrusive **Open WarStaxx** button appears inside the page as a fallback. On other Torn pages open **StaxxHub (S) → Tools → WarStaxx**. If you already installed v0.1.0, update the installed script using the same raw URL and reload the Torn page. This is not another floating launcher.

## 2026-11-04 v0.2.4 cross-context injection diagnosis

The standalone hub **v4.0.4** can now distinguish a War script that was actually injected from an enabled userscript whose code left no evidence on the current Torn page. War publishes a hidden local DOM beacon on loader startup and updates it when the full panel is ready or when startup fails. The hub checks the DOM directly and can open an existing War panel even if local event registration and storage markers are unavailable. The status includes the installed version, loader phase, panel presence and opener presence, without exposing any saved player data, API key or other secret. The raw installer URL has not changed; update both hub and module, then reload Torn.

## 2026-11-04 v0.2.3 visible-panel repair

Update the standalone TornStaxx hub to **v4.0.3** and War-TornStaxx to **v0.2.3** using the existing direct raw URLs, then reload Torn PDA. The War loader no longer reports the full tool as running before its UI has mounted. The hub can invoke a hidden DOM-native open control if normal cross-script events fail, without adding another floating launcher. War now checks legacy cached containers, and failures show a diagnostic rather than disappearing. Existing API-key settings, war histories, spies, and orders remain stored; no records are intentionally reset. If still broken, the hub reports whether a loader, an error, or a visually missing full panel was observed.

## 2026-11-04 v0.2.1 startup connection fix

Install/update **TornStaxx v4.0.1** and **War-TornStaxx v0.2.1** using their existing raw URLs, then fully reload Torn PDA. The module emits identity-only registration over DOM events and a same-origin message bridge, and writes a short-lived local startup marker so the hub can distinguish an injection failure from an inter-script communication failure. It does not share keys, spy stats or private faction data. If the hub says **War-TornStaxx has not executed on this Torn page**, check Torn PDA's **DevTools → Scripts** tab for the current page and verify this exact module version is active. The legacy notes for versions 0.1.1 and 0.1.2 below describe the earlier embedded-hub architecture.

## Getting started

1. Add the above URL to Torn PDA as a userscript.
2. Open StaxxHub (S), choose WarStaxx, then Settings.
3. Use a personal custom-scoped Torn API key or Torn PDA's automatic API-key placeholder. Do not publish your key.
4. WarStaxx tries to identify your faction automatically from the official user profile; set your faction ID manually if necessary.
5. During war it attempts to identify the enemy from faction wars. Outside wars, select an opposing faction manually for scouting.
6. Refresh, then review Targets, Matchups, Strategy, Activity, History and Orders.
7. Optionally enable faction attacks if your key permits it, for verified fair-fight observations.

## Included in v0.1.0

- **Command:** war detection, live score where official fields exist, member coverage, verified next reviews.
- **Targets:** live status, last action, hospitalization, travel/abroad flags, profile and attack-page navigation.
- **Matchups:** personal manual spies with Strength/Speed/Defense/Dexterity, modelled relative battle-stat scores and modelled fair-fight multiplier. Unknown pairs always show as unverified.
- **Optional observed fair fights:** actual modifier from own faction attack records, separately labelled from estimates.
- **Opt-in FFScouter:** with your independently entered *Torn API key already registered with FFScouter*, read public estimated fair-fight / public battle-stat scores for up to 205 opponents, no more than once per 10 minutes. The key and opponent IDs go to FFScouter only after explicit consent, not automatically.
- **Orders / Black Skulls:** an instruction for every member, including unavailable members (recover/return/support). Tag your heavy-hitter squad as **Black Skulls** to put them first. Only suggests provisional auto-hits when both sides have comparable known stats; unknown pairs default to scout/support/standby. Manual assignments override auto ones. The **Copy war orders** button prepares a text briefing for manual pasting into faction chat.
- **History:** fetches up to 20 ranked wars per faction and incrementally stores up to 40 official detailed war reports, with individual points/attacks and winners.
- **Activity:** keeps a 14-day capped sample history for both rosters from foreground checks. Separates the travel share *observed during wars* from general samples; shows online proportions, sample counts and confidence (insufficient/early/moderate).
- **StaxxHub:** registration, summary, notices, action cards, deep links, diagnostics, read-only context event, and links to the other three helpers.
- **Reliability:** API cooldown/backoff, evidence age, local persistence, no gameplay writes.

## Verified endpoints and bounds

| Official Torn API v2 endpoint | Use |
| --- | --- |
| /user/profile | Own faction discovery |
| /faction/{factionId}/wars | Current ranked war |
| /faction/{factionId}/members | Online, travel, hospital and last-action states |
| /faction/{factionId}/rankedwars | Previous ranked-war history for either side |
| /faction/{warId}/rankedwarreport | Official war reports, incremental bounded backfill |
| /faction/attacks | Optional faction attacks and actual observed FF modifiers |

Torn API returns only data permitted by your key. An unavailable or denied endpoint stays missing and appears in Diagnostics rather than being silently estimated.

**External service, only if you opt in:** FFScouter `GET https://ffscouter.com/api/v1/get-stats` with your own registered Torn API key and up to 205 opponent IDs. Estimates are not official Torn measurements. See [FFScouter's API data policy](https://ffscouter.com/openapi). This optional external lookup shares your submitted key with the independent service; turning it off prevents further FFScouter calls.

## Confidence and limitations

War reports do **not** provide a complete historical online/travel timeline. Travel habits are learned only from observations while Torn is open, and activity percentages reflect sampled checks rather than actual hours spent in each state. Moderate confidence requires 60+ observations over 12+ distinct hour buckets; early signal requires 12+ observations over 3+ distinct hour buckets.

Battle-stat matchup ratios and projected fair-fight values are **models**, not guaranteed win probabilities. Exact enemy battle stats require a spy or other legitimate record. Historic score is not proof of battle-stat strength.

All data, keys, spy stats, notes and personal orders remain **on the current device**. There is no shared faction server, cross-device synchronisation, automatic war-chat messaging, auto-attack or automatic item consumption. Refreshing is foreground-only; Torn PDA must be open.

## Suite source of truth

- https://github.com/Tom-Peters/Torn-ProfitStaxx/blob/main/docs/TORN-SUITE-STANDARD.md
- https://github.com/Tom-Peters/Torn-ProfitStaxx/blob/main/docs/STAXX-HUB-INTEGRATION.md
