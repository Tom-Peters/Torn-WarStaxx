> **Now part of TornStaxx 4.0:** This specialist module is displayed in Torn PDA as **War-TornStaxx** (v0.4.0). The shared command centre has moved to the standalone fifth userscript, [TornStaxx](https://github.com/Tom-Peters/TornStaxx). Install its [raw hub installer](https://raw.githubusercontent.com/Tom-Peters/TornStaxx/main/TornStaxx.user.js) once, then update this module from its **unchanged** [raw userscript URL](https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js). Existing domain functions, local data and API key settings remain in the specialist script. Repository rename will be handled separately.

## v0.4.0 - Fair Fight and ranked-war targeting intelligence (4 November 2026)

**Same permanent Torn PDA installer:** https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

### FFScouter connection repair
- Select **WarStaxx > Settings** and explicitly enable FFScouter and agree to its data policy. A registered FFScouter API key is required. You may leave the optional separate FFScouter key empty to use **your own Torn PDA API key** if already registered with FFScouter. Consent remains mandatory; nothing is sent to FFScouter without it. To switch keys, use **Use PDA key for FF** in Settings.
- The lookup now checks `/api/v1/check-key` and uses native single-argument `PDA_httpGet(url)` on Torn PDA rather than the less reliable `GM_xmlhttpRequest` there. Desktop userscript environments still use GM. Requests go directly to `ffscouter.com`, not to the TornStaxx hub.
- A configurable key is **never automatically registered** with FFScouter. The UI shows registration, key-not-registered errors, current source age, last successful fetch and member coverage. `Refresh FF` and `Check registered key` are explicit buttons; estimates are rate-limited to a 10-minute interval with exponential failure backoff.
- Source-normalised response fields: `fair_fight`, `bss_public`, `bs_estimate`, `bs_estimate_human`, `source` and `last_updated`. A missing or unavailable FF stays **unknown**, never 0 or 1.00. Estimates older than 90 days at source, or local fetches older than 24 hours, are clearly **stale**. Changing the key clears only old per-key FF estimates and registration metadata, retaining manual spies, orders, reports and activity.
- FF values are displayed **beside opponent names** in Players, Enemy Intel, detailed war reports, Matchups, Strategy, Activity, Orders and player dossiers. Player list supports FF sorting and the `Has FF` filter. When enabled, badges open the dossier for evidence details. The War Room displays live coverage and a shortlist of currently Okay, high-FF opponents *for review only*.
- **Important:** a FFScouter value is estimated for the registered API-key owner, **not** necessarily a Black Skulls member. The Matchups/Orders view calculates an *individual hitter's modelled FF* only when comparable battle stat scores are known. Actual FF from past faction attacks is a separate labelled source, never treated as the player's personal prediction.

### Additional intelligence and interaction
- Opponent historical threat index (based on known previous war score and foreground activity, **not** hidden battle strength); sort/filter searchable roster; watch/stop watching individual targets and inspect them from a priority watchlist.
- Last opponent war now includes individual scoring participation, number of contributors, top-three share of all reported player points and faction score per reported attack, with direct access to the full official report.
- Player dossiers show previous encounters retrieved from authorised Torn faction attack records, with recorded attacker, outcome, actual FF and respect. This is read-only; attack-page links remain manual.
- WarStaxx preserves the existing independent startup probe, single hub launcher, automatic own-faction detection, Torn PDA ASCII/quote-safe source, Black Skulls local assignments, consent policy and original raw installer URL.

**Verification:** `tests/ffscouter.test.mjs` covers response parsing, missing FF, source handling, native PDA request preference, HTTP failure, key fallback and source/badge safety. `tests/pda-quote-safety.test.mjs` and existing war-intelligence tests remain part of `npm test`. Source-level tests cannot establish actual results without a registered user key and a running Torn PDA device.

## v0.3.0 - Opponent intelligence overhaul (4 November 2026)

**Update War-TornStaxx using the existing raw installer URL above.** TornStaxx remains the separate shared UI (module ID `war`). All stored API settings, manual spies, orders, historical observations and previous local storage keys stay in place.

### Interactive War Room and Enemy Intel
- War Room now links directly into live opponent roster, last official ranked-war score, faction win/loss history, top recorded scorers, current online/last-day activity, travel and hospital states, tactical assignments, and the time-comparison screen.
- The **Enemy intel** screen aggregates the opponent's latest result and previous official scorelines, win/decided total, mean recorded score, live roster and per-member known prior-war scores.
- Opponent and friendly **faction basics** now show public respect, ranked-war division/rank, lifetime ranked-war wins, roster capacity, leadership and best chain (cached at sensible intervals). **Deep scan 20 wars** increases both history windows to 20 and starts a bounded refresh.
- Selecting a historical war opens a **full official scorecard**: scores, attacks, winner, rank movement, prizes where returned, and every player in each faction with their recorded score, attacks and score contribution percentage. Missing reports can be requested individually without waiting for the next backfill.
- Players in rosters, matchups, scorecards, activity summaries and orders link to a **player intelligence dossier**. It displays the history available for that player, status, recent action, level, observed online/travel rates (including explicitly sampled in-war travel), manual spy data and local notes. Optional public Torn profile/personal-stat lookup is performed only when the player presses the button; unavailable data stays labelled unknown.

### Activity and decisions
- A **24-hour TCT comparison** compares the proportion of sampled online observations for the two sides by hour; tap a cell to inspect its underlying sample counts. Difference is not true hours online, actual sleeping hours, or a guarantee of future activity. War reports cannot reconstruct past travel/status histories.
- Enemy players can be filtered by status and known war participation, searched by ID/name/role, and sorted by live priority, last reported war contribution, last activity, level or sampled online rate. Unknown historical score is **not zero**.
- War Strategy links to sampled favourable hours, opponent top scorers, fair-fight matchup review and local Black Skulls orders. All attacks remain **manual** and the hub never receives keys.
- Official Torn war history, foreground-collected observations, verified manual spy information and FFScouter opt-in estimates are labelled separately. Existing 14-day activity sample limits, scope-based errors and permission checks remain.

### Troubleshooting and verification
The distributed `WarStaxx.user.js` is **ASCII only** (no smart apostrophes) and keeps `// ==UserScript==` at the start for Torn PDA. The new `tests/war-intelligence.test.mjs` validates war scores, individual player contributions, metadata and navigation. Run `npm test` to execute it alongside the existing quote-safety and installation tests.

# Torn-WarStaxx

**WarStaxx** is the fourth Torn Staxx tool: ranked-war intelligence, public war records, live roster status, conservative per-player assignments and historical opponent observation. **Author: IamEEKY.**

## Stable Torn PDA installer

https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

**Torn PDA: Add Script → Remote URL.** Paste the direct URL exactly as shown. The GitHub repository page (`github.com/Tom-Peters/Torn-WarStaxx`) and file page (`github.com/.../blob/main/...`) are HTML, not installable scripts. If Torn PDA displays **No header found**, check you used the **raw.githubusercontent.com** link (or its Raw button) rather than the repository webpage. The file starts immediately with `// ==UserScript==` and ends its metadata with `// ==/UserScript==`.

War-TornStaxx registers with the **fifth, standalone TornStaxx hub** as module ID `war`. It no longer bundles the full StaxxHub code. It retains an emergency compact launcher only if the standalone hub is absent.

**Version 0.1.2 startup diagnostics:** an independent, minimal startup probe now advertises WarStaxx to StaxxHub before the full app boots. If the main script throws or aborts after injection, opening the WarStaxx entry displays a safe status panel rather than silently disappearing. No credentials or private data are included in the status. In Torn PDA, confirm that the WarStaxx script is **enabled**, is using **end-of-document injection**, and that any new permission requests have been accepted. Update to 0.1.2 from the same raw URL and reload Torn. If StaxxHub still shows only the original three tools, WarStaxx likely did not execute at all: inspect Torn PDA’s scripts-on-this-page view or the script’s enable toggle.

**Version 0.1.1 visibility fix:** if Torn PDA loaded WarStaxx before the Hub, registration is re-announced after startup and periodically while the page is visible. On Torn faction/war pages an unobtrusive **Open WarStaxx** button appears inside the page as a fallback. On other Torn pages open **StaxxHub (S) → Tools → WarStaxx**. If you already installed v0.1.0, update the installed script using the same raw URL and reload the Torn page. This is not another floating launcher.

## 2026-11-04 v0.2.5 Torn PDA quote-conversion parse fix

**Root cause reproduced:** v0.2.4 contained two curly apostrophes (U+2019) inside single-quoted JavaScript text. The downloaded JS parsed in normal Node, but simulating smart-quote conversion to ASCII apostrophes caused `SyntaxError: Unexpected identifier 'actual'`. This prevents *all* startup code, Hub registration and in-app diagnostics. Both sentences have been rewritten without apostrophes. The entire War module's source is now ASCII-only; existing UI symbols are retained using JavaScript Unicode escapes.

All five TornStaxx repositories now have automated quote-normalisation parse checks, and the suite development standard mandates the check for future releases. Update War-TornStaxx from the permanent raw installer URL and confirm version **0.2.5** in Torn PDA before testing. No API keys, observations, faction orders or saved user data were intentionally reset.

## 2026-11-04 v0.2.4 cross-context injection diagnosis

The standalone hub **v4.0.4** can now distinguish a War script that was actually injected from an enabled userscript whose code left no evidence on the current Torn page. War publishes a hidden local DOM beacon on loader startup and updates it when the full panel is ready or when startup fails. The hub checks the DOM directly and can open an existing War panel even if local event registration and storage markers are unavailable. The status includes the installed version, loader phase, panel presence and opener presence, without exposing any saved player data, API key or other secret. The raw installer URL has not changed; update both hub and module, then reload Torn.

## 2026-11-04 v0.2.3 visible-panel repair

Update the standalone TornStaxx hub to **v4.0.3** and War-TornStaxx to **v0.2.3** using the existing direct raw URLs, then reload Torn PDA. The War loader no longer reports the full tool as running before its UI has mounted. The hub can invoke a hidden DOM-native open control if normal cross-script events fail, without adding another floating launcher. War now checks legacy cached containers, and failures show a diagnostic rather than disappearing. Existing API-key settings, war histories, spies, and orders remain stored; no records are intentionally reset. If still broken, the hub reports whether a loader, an error, or a visually missing full panel was observed.

## 2026-11-04 v0.2.1 startup connection fix

Install/update **TornStaxx v4.0.1** and **War-TornStaxx v0.2.1** using their existing raw URLs, then fully reload Torn PDA. The module emits identity-only registration over DOM events and a same-origin message bridge, and writes a short-lived local startup marker so the hub can distinguish an injection failure from an inter-script communication failure. It does not share keys, spy stats or private faction data. If the hub says **War-TornStaxx has not executed on this Torn page**, check Torn PDA's **DevTools → Scripts** tab for the current page and verify this exact module version is active. The legacy notes for versions 0.1.1 and 0.1.2 below describe the earlier embedded-hub architecture.

## v0.2.6 — automatically identify your own faction

War-TornStaxx now detects the faction attached to your installed Torn API key. The primary source is **Torn API v2 `/key/info` -> `user.faction_id`**, which is available even for user-owned custom-scoped keys. If that endpoint fails or does not provide an ID, War tries the official `/user/faction` and `/user/profile` endpoints. No manually entered faction ID is required when one of these endpoints succeeds.

On opening WarStaxx, and on foreground refresh, the tool verifies faction membership when needed (at most once every six hours after successful verification, unless you force a refresh). A changed verified faction resets only transient live rosters, opponents, current war state and recent stamps so old enemies are not mislabelled; local spy records, reports and orders stay stored. Settings displays the currently detected ID and its source, a **Detect my faction now** action, and an **automatic detection** checkbox with an optional manual fallback.

An API key must be available through Torn PDA key substitution or the module's own locally stored settings. No API key is sent to the TornStaxx hub. All five current scripts remain protected by no-smart-quote parser regression checks; the War source stays ASCII. This build has automated tests for each API response source, transient failures, faction changes and manual override.

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

## Automatic own-faction detection (v0.2.7)

War-TornStaxx now resolves **your own faction ID** from your authenticated Torn user profile first, with user/faction and key/info fallbacks. A zero faction ID is not treated as a successful result; the next official source is checked. The discovered ID is cached for six hours, with a force-refresh option. If you change factions, old faction-specific roster and opponent information is cleared to prevent misidentification. The Settings panel displays the detection source and any failure; manual faction ID remains an optional fallback. A valid Torn PDA-substituted or locally entered API key is required. The user does not need to type their own faction ID when auto-detection succeeds.
