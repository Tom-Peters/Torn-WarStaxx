## v2.4.1 - colour-coded FFS for native target hunting

Player-name badges now pair **FFS** with **BSE** on bounties, people abroad and other supported native lists. The compact badge expands on tap, showing the estimate source/age and a colour legend. Profile action links such as `View profile` and `New tab` no longer receive badges.

| FFS estimate | Colour | Meaning |
|---|---|---|
| 1 to 2 | Green | Easier estimate |
| Over 2 to 3.5 | Cyan | Moderate estimate |
| Over 3.5 to 4.5 | Orange | Difficult estimate |
| Over 4.5 | Red | Very difficult estimate |
| Stale or missing | Grey | No current difficulty colour |

Bands follow [FFScouter's published guide](https://ffscouter.com/guides/fair-fight-explained). FFS is calculated for the API-key owner, remains uncapped above 3 and is not a win guarantee. Observed faction attack FF is never substituted into a personal hunting badge. Numeric values remain visible, so the colours are not the only cue.

Waiting (`...`), provider errors (`!`), unavailable estimates (`?`) and disabled lookups (`off`) are distinct. Tap an error badge for the reason; existing permission and registration settings are respected. Badges repaint as soon as a lookup completes. Partial records are retried after 30 minutes, while complete records use the existing 24-hour cache. The parser supports fields from the provider's selected nested estimate when the top-level equivalent is absent; it never borrows an unrelated model.

Validation: automated colour-boundary, uncapped/stale/unknown, parser and cache checks plus DOM fixtures for combined badges, popup-action exclusion, toggling, recycled rows and route cleanup. No live Torn PDA account test is claimed.

## v2.4.0 - BSE beside player names throughout Torn

- Compact BSE badges attach to visible standard Torn profile-name links, including bounties, people abroad, searches and other player lists. This works without loading a faction roster or being in a war.
- Tap a badge to expand or collapse its source and estimate age. BSE is estimated total battle stats; the different BSS metric is never substituted. Missing estimates show `BSE ?`, disabled lookups show `BSE off`, and stale estimates are marked.
- Uses the existing explicit FFScouter opt-in and registered key. Only near-viewport player IDs are fetched, deduplicated into batches of at most 205 at most once per minute. Positive results are cached for 24 hours, missing results for 30 minutes; failures back off and hidden pages do not fetch. The cache is bounded and shared with roster intelligence.
- Handles list replacements, changed player IDs and navigation without duplicate badges. Attack pages are excluded. Names and their original links remain intact; nothing attacks automatically.

Validation: full Node suite, ASCII/PDA parser checks and DOM fixtures for badge insertion, repeated names, disclosure toggling, row reuse/removal and route cleanup. These are local checks, not a live Torn PDA device test. Update the existing WarStaxx installation; no extra userscript is needed.

## 2.3.0 - Native action details

Known roster members receive expandable intelligence beside their exact native profile attack link. Shows location/status, strength provenance and last seen evidence, marks stale roster information cached, and opens the player dossier. Unknown profiles and unmatched anchors receive nothing. No extra API calls or automated attacks.

## 2.2.0 - Workspace and native-page separation

Preserves the recently redesigned next-step workspace and player roster. The full tools directory is grouped into expandable Command / Performance / Intelligence / Setup sections. Native player intelligence remains on ranked-war lists. Generic war banners no longer appear on unrelated Torn pages, even with a saved everywhere preference. Faction and explicitly requested war-item controls remain available.

Validated with existing regression suites, parser checks and DOM integration scenarios. Live Torn PDA visual/device validation remains separate.

> **Now part of TornStaxx 4.0:** This specialist module is displayed in Torn PDA as **War-TornStaxx** (v2.1.0). The shared command centre has moved to the standalone fifth userscript, [TornStaxx](https://github.com/Tom-Peters/TornStaxx). Install its [raw hub installer](https://raw.githubusercontent.com/Tom-Peters/TornStaxx/main/TornStaxx.user.js) once, then update this module from its **unchanged** [raw userscript URL](https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js). Existing domain functions, local data and API key settings remain in the specialist script. Repository rename will be handled separately.

## v2.1.0 - One next step (9 November 2026)

- Home now presents one actionable recommendation, one short reason and one primary button. Priorities cover connection, stale data, uncovered imminent heavy-target exits, repeated incoming hits, eligible personal targets and orders needing review. When no suitable hit is verified, it says so explicitly.
- The score is a quiet context line. Operational cards, country forecasts and supporting tools are behind an optional disclosure instead of competing for attention.
- Player rows show name, status and one key fact by default; detailed metrics and actions expand on demand.
- Extra native war pulse counters appear only when Sort / filters is open. The main action has stronger depth, contrast and spacing.
- Recommendations reuse existing evidence and manual action paths. They do not execute attacks or imply a guaranteed win. Settings and stored intelligence are retained.

## v2.0.0 - WarStaxx workspace revamp (9 November 2026)

The main interface is rebuilt around three areas, retaining existing specialist tools, stored data and installation URLs.

- **Live war:** a compact score/chain header and four task views: Priorities, My hit, Black Skulls and Defence. Priorities shows the top operational decisions, quick actions, protection and releases. The full country outlook is expandable.
- **Players:** one shared layout for opponents and our faction. Country sections, instant name/ID search, status/Skull/watch filters, country selection and within-country sorting. Names lead each entry; three key metrics sit beneath. Extra actions expand vertically. Stale status filters are blocked; partial attack totals and uncertain net figures are labelled.
- **Tools & reports:** a task directory grouped into Command, Performance, Intelligence and Setup. Every existing screen remains reachable, including the full dashboard, scouting and detailed reports.
- **Navigation:** Back returns from player intelligence to the previous view and scroll position. Disclosure state remains scoped by view/player. No forced jump to an unrelated Reports page when using Back.
- **Visual system:** navy/cyan surfaces, clear score hierarchy, responsive player grids, larger names, purple skull badges, visible keyboard focus and compact mobile navigation. No additional sticky war banner.
- **Native Torn war toolbar:** advanced sort/filter controls fold under Sort / filters. Active filters remain visible with a clear action for both faction lists. Existing country sorting, countdown colouring and attack-page protection remain.
- Uses existing API calls and read-only data engines; no extra network permissions, key migration or automatic gameplay. No real player records in fixtures. Actual Torn PDA appearance still needs device verification.

## v1.7.0 - Action-first war command (9 November 2026)

- **Simpler home:** protection priorities and upcoming heavy-target releases come first. Full chain, intelligence and analytics remain under an expandable section. Direct Now / Skulls / Our team / Find navigation is available throughout.
- **Protect our points:** rank current members by exposed status and captured points conceded, with earned points, recent hits and stale-feed warnings alongside. Defence remains a manual coordination decision.
- **Black Skulls release queue:** hospitalised heavy targets due within 30 minutes, sorted by expiry with country and assigned hitters. Full queue in squad command; expired timers never become available targets.
- **Strong-regular threats:** highlight enemies with at least two captured scoring wins against the three strongest known regulars. Excludes Black Skulls from the reference group, marks incomplete data, and does not reconstruct past battle stats.
- **Cross-war member comparison:** each current member's official points across up to six completed stored own-faction reports, average and change from earlier results. Missing records are unknown, not zero. Reports open directly from column headings.
- **Since last refresh:** session-local roster status/location changes and observed score differences. Comparisons require fresh sequential roster observations and matching faction/war context; no fabricated activity between refreshes.
- **Less reopening and scrolling:** expanded sections survive polling and navigation. Setup and long analytics are folded away; all existing deep links, controls, settings, keys and data remain.
- No new API requests or network permissions. Tests use synthetic players. Browser launch in this workspace was blocked by its socket restriction; actual Torn PDA layout remains to be verified on-device.

## v1.6.0 - Country outlook and assignment audit (9 November 2026)

- **Next 30 minutes:** Live War Room and Operations now compare both factions by country: currently available members and cumulative hospital expiries within 5, 15 and 30 minutes. Hospital exits remain forecasts, never automatic Okay statuses. Stale sides display unknown counts independently.
- **Release timeline:** Expand a combined, chronological hospital expiry list with faction, country, time, and assigned/watched markers. Expired or missing timers are counted separately; unknown countries remain explicit.
- **Assignment audit:** Detect unavailable hitters/targets, different countries, unknown locations, known low energy, duplicate assignments and players missing from fresh rosters. Existing orders are preserved. This audit supplements matchup intelligence; it does not predict wins.
- **Tactical briefing:** The existing copy action includes the country outlook and assignment conflicts for manual sharing. No additional requests, permissions, storage migration or external data sharing.
- Fix the native tactical pulse hospital label rendering a literal Unicode escape.
- Uses the existing single CI job and test suite. Live Torn PDA appearance still requires device verification.

## v1.5.14 - Location grouping and touch refinements (7 November 2026)

- Inbound flights to the player's own destination country now receive the own-country priority, including flights back to Torn.
- Hidden/filtered members no longer create misplaced or duplicate country headings.
- Blue intelligence chips allow vertical touch gestures to scroll Torn's roster, including touch starts directly on text and badges.
- Retains v1.5.13 country grouping, alphabetic countries, available-first sorting, prominent Black Skull highlighting, travel/hospital countdowns and last-online timers.

## v1.5.13 - Country-aware ranked war targeting (7 November 2026)

- **Where people are:** Reads faction-member Torn status/destination hints, recognises the 11 normal travel destinations and Torn, and displays recognised country names rather than a generic "Abroad". Unknown destinations remain Unknown; the tool does not invent location certainty.
- **Travel belongs to the destination:** "Travelling to Canada" joins the Canada group; "Returning from Canada" joins Torn. Torn's confirmed arrival is still required before a flying player becomes attackable. Live inbound flight ETAs are read-only countdowns from status expiry.
- **Country sections and sorting:** Separate country heading rows with opponent, Okay and inbound counts. The API-key owner's current reported country comes first if known, remaining countries follow alphabetical order, and Unknown is last. Within each country, Okay comes first, then hospital, jail, flying and unknown. The original Torn sort option restores the ungrouped native order. Country groups can be disabled in WarStaxx Settings.
- **Black Skulls:** Prominent 5 px purple target stripe, purple-tinted intelligence strip and unambiguous BLACK SKULL/BLACK SKULL TARGET text (no guessing from BSS alone). Existing high-BSS allocation policy and risk checks remain intact.
- **Mobile scrolling:** The compact blue strip no longer captures vertical touch gestures or scrolls horizontally, preventing the no-scroll area reported on Torn PDA. Expanded detail strips still allow inspecting further details while permitting normal gestures.
- **Read-only activity:** Last Torn activity shown as "Seen 8m" or ONLINE, with a minute-updating timer from the official last-action timestamp, not a fabricated last-login time. Hospital countdowns and in-flight landing ETAs continue to update. A foreground-only, throttled refresh of the own faction roster (60 seconds) keeps the user's country current.
- **Compatibility:** If an installed external sorter is active, WarStaxx leaves its row order unchanged; it still annotates rows. All existing data, keys, attack protection, optional FFScouter and hub integration are preserved. Full live Torn PDA appearance still requires testing on the device.

## v1.5.12 - Compact, scan-first ranked-war roster (7 November 2026)

- **Compact default:** Opponent and friendly war rows now reserve 58 CSS px, down from 79 px (about 27% shorter). The first 36 px retain Torn's original member/score/status/Attack cells; the 20 px intelligence strip contains only the decisive information.
- **Scan order:** Always identify the player first (+ Name to expand). Show a short hospital/return timer where relevant, a purple SKULL badge only for Black Skull targets, a clearly sourced FFScouter estimated total or BSS, and a concise FF value. Extreme FF remains highlighted as dangerous, never a recommendation.
- **Tap to expand one player:** The chosen row grows temporarily to 82 px with the full hospital countdown, role name, source-labelled FF, local orders and the preserved Intel / Copy controls. Tap it again to collapse; other players remain compact. The strip supports keyboard Enter/Space as well as touch.
- **Compact top toolbar:** Sort, Show and War Room remain directly visible. The three additional Skulls / Turtle / HIT shortcuts move behind a More/Less button. No automation or new network permissions.
- **Stability:** Preserves existing data, API refresh cadence, sorting, FFS source details, faction roster, attack-page no-overlay guard and native page compatibility. Mobile-specific test fixtures cover both row modes. Device screenshots are still the final visual check.

## v1.5.11 - Accurate uncapped FFScouter values and safer target warnings (7 November 2026)

- **Correct FFScouter reading:** Torn awarded Fair Fight caps at 3.00, but FFScouter calculated FF may legitimately be 9.29 or higher for substantially stronger targets. The previous shared validator incorrectly discarded readings above 3.00. Actual logged Torn FF keeps its separate 1-3 validator.
- Calculated FF above 3 gets a caution colour and above 4.5 a danger colour, including the native war rows. Values above 3 are **not awarded respect multipliers** or automatic win predictions.
- Keeps v1.5.10 named/grouped player layout and explicit FFScouter ~total versus BSS sources; on upgrade a prior FFScouter timestamp is invalidated only for previously consented users. Manual Refresh FF bypasses cache age but not API error backoff.
- Tests include tests/war-ffscouter-uncapped-v1511.test.mjs; live Torn PDA layout/response verification still pending.

## v1.5.10 - Clearly grouped mobile players and honest strength sources (7 November 2026)

- **Each player is unmistakable:** The small intelligence row starts with that player's full Torn name (ellipsis only when necessary); the native 49px name/status/attack row remains intact. A left accent and bottom divider visually group the two lines; Black Skull targets have a purple accent and newly available players a green accent. Removed the duplicate "Okay" badge because Torn already shows it in the Status column.
- **Make the numbers directly comparable:** The first strength figure is **Spy total** when an eligible recent complete spy is available, otherwise **FFS ~total** when FFScouter returns its modelled total-stat \`bs_estimate\`. If only BSS is available the display explicitly says **BSS ~score**, never implying it is a total. Sort/Black Skull allocation still uses its separate BSS evidence. The existing FFScouter data and API permissions are unchanged; **YATA is not fetched automatically**.
- **Understand the source:** On the native row, **Intel** opens that player's full WarStaxx dossier with BSS, estimated total, the record's age and an explanation of why a YATA estimate might be different. Fair Fight is explicitly labelled **Your FF** (FFScouter's API key owner) or **Team FF** (historical logged faction encounters).
- Original Torn player links and attack buttons are untouched. Other existing controls, status refresh, privacy and heavy-target role separation remain intact.
- **Test status:** Syntax and focussed source checks performed; the on-device Torn PDA layout still requires a fresh screenshot to verify.

## v1.5.9 - Mobile ranked-war layout repair (7 November 2026)

- Fixes the Torn PDA player-list overlap shown in the 7 November screenshot. WarStaxx no longer places sizeable BSS, FF, role, order, countdown and copy labels **inside Torn's fixed-height member-name cell**.
- Each enhanced player row now reserves its own 29px high, horizontally scrollable intelligence strip **below the original player/level/score/status/attack cells**. The native row is explicitly extended to 80px so adjacent players do not overlap; the original player graphics and attack links remain in place.
- Tiny, separate chips show hospital countdown / return state, Skull/regular category, verified spy BSS versus estimated BSS, owner-specific FF versus historical team FF and any local assignment/watch. The copy action lives in the new subrow. Narrow mobile widths can scroll the intel subrow horizontally without scrolling the attack interface.
- Removes leftover old-version labels from the native member/status columns when refreshing and cleans up all custom DOM on navigation. Shortens the native war toolbar by removing its verbose explanatory footer.
- Keeps 20-second foreground official roster refresh, one-second read-only hospital countdowns, current Black Skulls policy, risk gates and all existing WarStaxx/hub settings and features. No automatic gameplay actions and no new permissions.
- Regression checks cover script syntax, native row layout invariants, attack-route guard and expected parsing/sorting. Actual Torn PDA WebView rendering still needs a real-device check.

## v1.5.8 - Native faction war monitor (7 November 2026)

- **Torn-native ranked war screen:** On `factions.php#/war/...`, WarStaxx adds a compact in-flow toolbar and annotates Torn's existing opponent and faction member rows. The old sticky bar is hidden on that route (and never appears on the attack interface).
- **Live observed status:** One-second visual hospital countdowns, returning/outbound/abroad labels, green near-expiry indicators (under five minutes), and short foreground-only early-med/revive/return highlights. Only a fresh official Torn roster can confirm a member is Okay.
- **Tactical rows:** Estimated versus verified spy BSS clearly distinguished, owner-specific FFScouter FF or historical team FF labeled separately, Black Skull versus regular opponent bands, existing local assignments, watch markers, own Black Skull identification and direct name/ID copy.
- **Sort & filter:** Sort enemy list by availability, hospital expiry, estimated BSS, owner FF estimate or recent activity; filter to Okay, hospitalised, returning, recently active (five or sixty minutes), offline, heavy, assigned or watched. Original Torn order is restorable; clicking Torn's own sort headers returns control to Torn. When Torn War Stuff Enhanced or an FFScouter active filter is already sorting, WarStaxx defers its sorting to avoid reorder loops.
- **Foreground API freshness:** While the ranked-war page is visible, the official enemy `faction/members` request refreshes every 20 seconds, with normal shared request throttles/backoff. Chain checks reuse the official faction endpoint; all heavy report/history refreshes keep their prior cadence.
- **Optional draggable chain bubble:** Off by default. Enable it in Settings for a small one-second chain counter that can be dragged and minimised; it auto-hides on attacks and defers to an installed TWSE bubble.
- **Configuration:** Settings toggle native enhancement off; Torn's full WarStaxx strip remains available if off. All previous tools, stored config, shared order policies, keys and manual attack safety remain untouched. No new API permissions or external status-sharing provider.
- **Verification:** Automated Node regression fixtures cover native route/sort/transition semantics; live Torn PDA page structure and permission-dependent responses still require device testing.

## v1.5.7 - Attack-safe war controls and enemy status monitoring (7 November 2026)

- **No war bar during attacks:** WarStaxx removes the banner on Torn attack routes, including in-page navigation, so it does not cover the fight. It reappears on the relevant war/faction page.
- **Context-aware layout:** Full quick actions remain on faction/war pages and explicit item-assistance flows. Active wars elsewhere show a tiny non-sticky score/chain/War Room summary; no-war pages have no extra banner outside the faction screen. Settings now let you choose contextual (default), faction-only, or expanded elsewhere. All modes suppress the bar in combat.
- **Enemy roster quality-of-life:** 10-second read-only hospital countdowns from Torn roster expiry, near-release highlighting, flight/return labels, "Availability: Okay first" and "Hospital release soonest" sorting, plus one-tap local copy of Name [ID]. Expired hospital timers explicitly ask for an official refresh; they do not claim the target is Okay.
- **Privacy & data accuracy:** No TWSE community data-sharing service, auto-attack, item use, or extra permissions are introduced. Existing FFScouter remains explicitly opt-in. Timers and states are snapshots, not continuous or guaranteed arrivals.
- **Compatibility:** Existing TornStaxx hub/module interface and installer URL are unchanged.

## v1.5.4 - Automatic battle-stat and opponent API accuracy (5 November 2026)

- Owner's exact four battle stats are read from Torn's `user/battlestats`, including nested API response formats; null or missing stats never become zeros.
- Personal and faction spy reports now support list and keyed report containers and several nested report layouts, accepting only complete, timestamped four-stat records. The freshest eligible exact record is used, with public FFScouter BSS clearly identified as an estimate.
- Recorded attack FF evidence now excludes samples older than 30 days or from future timestamps; attack-feed refresh stops after the active war ends.
- Public opponent profile and personal statistics are fetched **automatically** in a rotating batch of two players per refresh, with a six-hour cache and bounded 100-player retention. API-restricted fields stay unknown instead of requiring manual entry.
- Added `tests/war-battle-accuracy-v154.test.mjs`. The previous optional manual correction remains available only for inaccessible private stats; it is not a prerequisite for API-derived data.
- A precise win chance cannot be inferred from BSS alone: merits, buffs, weapons, temporary effects and hidden private stats can change the outcome. FFScouter's owner-specific FF is not a per-teammate prediction.

## v1.5.2 - Stability release (5 November 2026)

- **No stale-war commands:** Operations and event alerts use the fresh, officially observed active-war state rather than only a cached war ID. The TornStaxx hub's live-war flag, headline and pace labels also observe the same live guard.
- **Reliable strip scrolling:** The permanent on-page war strip reacts only to page/main-scroller movement. Scrolling an intelligence table, other Torn widget or WarStaxx modal no longer unexpectedly minimises the strip.
- **Quicker tactical render:** My Mission scans verified options once for both the suggested and manually assigned opponent, and the Skull Capo 30-second brief reuses one coverage calculation rather than rebuilding it in the operations queue. Removed a redundant live-screen matchup scan.
- **Clearer feedback:** Successful order changes, role settings, manual readiness entries and copy actions use neutral/success confirmation styling; actual errors retain warning styling. Confirmations expire after 30 seconds.
- **Mobile usability:** Scrollable report tables gain a visible first-column identifier on phones, while the Black Skulls leadership cards keep their existing responsive layout.
- **Torn PDA diagnostics:** The embedded loader-probe version now agrees with both the module and install metadata at **1.5.2** (previously the probe still said 0.8.0).
- **Regression tests:** Added `tests/war-stability-v152.test.mjs`; updated historical fixtures to reflect retained current behaviour without weakening the guarded HIT or read-only gameplay rules.
- Existing installer URL, stored config, four-tier UI and shared TornStaxx module ID remain unchanged. **No automated attacks, consumable use or faction chat posting.**

**Device validation:** Physical Torn PDA display and live-war API access are separate from GitHub's Node test suite. See [Stability release verification](docs/STABILITY-RELEASE-1.5.2.md).

## v1.5.1 - Full functionality and mobile usability audit (5 November 2026)

- Fixed two-sided roster freshness on the main status banner and stale enemy "Okay" hub metrics.
- Restored a real ten-second chain display update in the permanent Torn strip.
- Prevented previous faction's current war, rosters or chain from appearing after changing the manual faction ID.
- Hardened incomplete cached member objects and null entries in numeric-keyed API lists.
- Improved the mobile UI with larger touch targets, a compact header, proper search/refresh labels, focus handling, Escape / Tab support and background-scroll locking.
- Player spy fields and local notes no longer disappear during an ordinary rerender of the same player; changing player or explicitly clearing spies does not preserve stale drafts.
- Repaired outdated version pins and isolated historical regression fixtures; added `tests/war-audit-v151.test.mjs`.
- The independent TornStaxx hub and original installer URL are unchanged. No automatic attacks or medical-item usage were added.
- Full audit, exact corrected/remaining issues and device test checklist: [QA audit 2026-11-05](docs/QA-AUDIT-2026-11-05.md).
- **Verification boundary:** JavaScript syntax, ASCII and isolated test checks were performed; real Torn PDA/WebView device rendering, API permissions and external Worker are still unverified.

## v1.5.0 - Mission-first live war command (5 November 2026)

- **My Mission** is at the top of the live war screen: own status, energy, assigned target, verified matchup evidence, any blocker, and next action. A local assignment takes precedence over the highest-scoring model suggestion.
- **HIT safety:** the permanent Torn command strip and post-heal HIT flow respect the user's locally saved target. If that target is missing, not Okay, has a stale roster, is outside the Skull/regular BSS bracket, or fails recent comparative-spy and risk checks, quick HIT stops with an explicit message. It never silently switches targets.
- **30-second Skull Capo brief:** the first war screen surfaces immediate interventions, high-BSS coverage gaps, blocked orders, unknown enemy BSS and qualified free replacements, with manual one-click review/assignment.
- **Operational queue:** unassigned heavy enemies, blocked Black Skull orders and missing comparative battle intelligence are now actionable priorities.
- **Permanent strip:** displays the saved mission and a REVIEW ORDER state when the assigned target is no longer eligible. Hub metric uses **Enemy Okay** rather than suggesting an Okay enemy is proven safely hittable.
- The original four layers are preserved: always-on Torn strip + Act Now + Opponent + Reports. Deep links and TornStaxx hub contract stay the same. Actions do not automatically attack, use consumables or send faction messages.
- Automated regression coverage: `tests/war-v15.test.mjs`. The source is ASCII-only and passes a JavaScript syntax check; the full Node test suite and a live Torn PDA installation still need verification.

## v1.4.0 - Skull Capo operational intelligence (4 November 2026)

All five Skull Capo requests implemented in \`WarStaxx.user.js\`, preserving the always-available Torn command strip, **01 Act Now / 02 Opponent / 03 Reports**, FFScouter BSS badges, manual matchup safety and v1.3 cutoff settings.

### 1. Replacement Black Skulls when the assigned hitter is unavailable

The **Black Skulls target coverage** table identifies heavy targets whose assigned squad member is hospitalised, travelling/away, has confirmed low energy or no longer passes the recent/manual-spy matchup gate. It proposes an *unassigned, observed Okay, role-matched, favourable-verified* Black Skull as a replacement. The table has a **Replace [name] with [name]** action; clicking it revalidates current rosters, target availability, both members, comparative spies, target conflicts and the new hitter's available energy information. It then changes **only the local/order-plan assignments** and optionally syncs them through the previously enabled Worker. It does **not** automatically issue orders, launch attacks or spend energy. If no evidenced substitute exists, it displays the gap.

### 2. Prioritise uncovered heavy enemies by BSS and scored wars

Heavy targets are now ranked using (i) current known BSS, (ii) that same enemy member's official score in the opponent's latest completed ranked war, and (iii) optional captured scoring attacks in the current war. The priority model weights the three signals 60 / 25 / 15; these are **relative planning weights**, *not* the probability of winning. When historical player-level scoring is absent, the UI says **Unknown** and uses the remaining known signals. This can prioritise a repeat high-output opponent over a higher-BSS enemy with little observed scoring. The Skull Capo board shows BSS, last-war points, priority and whether an evidenced squad substitute is free.

### 3. Torn faction-chat briefing in one tap

**Copy squad chat briefing** is available from the Skull Capo command and Black Skulls screens. It copies a concise 3,200-character-or-shorter plaintext briefing with war, official score, sampled chain, chosen strength cutoff, named Black Skulls/current orders and top uncovered targets with suggested manual backups. No automatic Torn chat posting occurs. The briefing excludes API keys, spy stat values and personal local notes; it is for pasting manually into faction chat.

### 4. Heavy-opponent return alerts

When fresh consecutive Torn roster observations show a **high-BSS** enemy changing from **hospital** or **travel/away** to **Okay**, WarStaxx creates a priority Skull Capo tactical alert. Its source is an actually observed status transition, not a guessed flight/medical expiry. The alert routes to the squad command board; the existing live war bar and alert stream also benefit. It is deduplicated by war/player and expires after five minutes. The script runs foreground-only and does not send notifications when Torn PDA is closed.

### 5. Fairer comparisons against similarly strong opponents

WarStaxx now captures a small *attack-time BSS observation* for each same-war own-faction attack when:

- The Torn API confirms a ranked-war attack and its faction pairing,
- the BSS estimate is available from a fresh manual spy or fresh explicitly enabled FFScouter,
- both rosters are recently observed, and
- that attack finished no more than **six hours** before its BSS observation.

The **Black Skulls | matched opponent-strength comparison** analyses those samples at a **+/-25% target-BSS band** around each member's current median observed target BSS. It compares this war against up to three previous **completed** wars; it requires at least three current and three historical comparable captured attempts from at least **two** historical wars. It strips milestone/special bonuses and normalises ordinary chain respect where possible. The displayed measure is *captured, chain-normalised respect per recorded attempt*, **not** total official ranked-war points, true win probability or a fully comprehensive damage ledger. A decline of 30% or more creates a review flag only when the prerequisites are met.

Current squad command, Black Skulls operations, completed-war analysis, and copied Black Skulls squad debriefs all include this comparison. The historical BSS of old targets is **never invented retroactively**. Old wars lacking captured observations show Unknown until future sampled wars create a valid baseline. Per-war squad membership snapshots and existing official per-player scorecards remain separate sources.

### Installation and optional sync

Stable Torn PDA installer (same URL, no need to change it):

https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

The shared-orders Worker is optional, requires manual Cloudflare deployment and a legitimate officer writer token, and shares only explicitly selected planning fields. The strength cutoff and manual replacement orders use the existing revisioned sync protocol; **no Worker migration is required for v1.4**.

### Quality gates

The v1.4 regression file is \`tests/war-v14.test.mjs\` and covers priority scoring, free replacement selection, private copy-only briefing, measured return transitions, BSS snapshots, matched-strength comparisons and integration. Existing WarStaxx and optional Worker regression tests still pass in isolated JS checks. Torn PDA UI interaction, live API entitlements and an actual deployed Worker are **not yet verified on a physical device**.

## v1.3.0 - Skull Capo command, configurable heavy cutoff and squad performance (4 November 2026)

The WarStaxx command view now reflects the correct leadership role: **Skull Capo, commander of the Black Skulls heavy hitters**, rather than overall faction leader. The full faction's regular attackers and defensive/reserve members remain visible for coordination but are clearly marked as context outside the Black Skulls squad.

### Custom enemy strength cutoff

Under **Reports > Skull Capo command**, choose the strength threshold used to reserve enemy opponents for the Black Skulls:

- **Top percentage** (default 40%, adjustable from 5% to 100%) of opponents with current BSS evidence.
- **Absolute minimum BSS** (e.g. reserve opponents with FFScouter/manual BSS at or above your chosen value).

The rest of the **known-BSS** enemy roster is assigned to the regular-member pool. Enemies without fresh FFScouter BSS or recent manually verified spies remain unknown: never guess their strength based only on level. All actual HIT suggestions still require a safe in-role matchup using comparable manual spies, existing conflict checks and per-player risk settings. Existing incompatible manual orders are flagged rather than silently deleted.

An **uncovered heavy-target board** shows each enemy in the chosen Black Skulls bracket, BSS evidence and freshness, current status, the currently assigned Black Skull (if any), and verified available squad alternatives. An **Assign** action is offered only when the candidate has favourable evidence and no conflicting active assignment; it only writes a manually approved order. New alerts warn when opponents in the heavy bracket have no Black Skull assigned.

The cutoff is also included in optional, revision-controlled shared war orders. Deploy the updated Cloudflare Worker before enabling this version for your faction.

### Scoreboard contributions: earned versus conceded

The live and after-war leaderboard has **Points earned**, **Enemy points conceded** (enemy ranked-war score from attacks on that member), **Net impact proxy** (earned minus observed conceded), attacks made and incoming scoring hits. As Torn ranked-war scores are a tug of war, **being hit does not deduct from that player's own earned-points column**; the opponent gets points and the net faction lead changes. Opponent scoring must be derived from enemy-attacker/our-defender attack records with positive ranked-war respect. Because the local attack feed may be incomplete, conceded totals and their net proxy are labelled **partial**; unavailable incoming history displays **Unknown**, not zero.

### Separate Black Skulls and regular after-action reports

Every completed war's after-action dashboard now contains **two dedicated reports**, one for Black Skulls and one for regular faction members. Each calculates official earned points and attacks, points per attack, locally observed enemy score conceded and a clearly labelled net swing proxy. Individual contributors appear in each group, and each report has its **own Copy report** control for manual faction sharing. Nothing is sent automatically.

For wars actually observed by WarStaxx, the script captures a small per-war Black Skulls membership snapshot, so changing membership later does not silently rewrite historical team reports. For older wars without a snapshot, reports explicitly say the grouping uses **current local tags**. The official completed-war scorecard is required for per-member earned totals; otherwise they remain unknown.

### Preserved workflow and limitations

- Persistent Torn command strip plus **01 Act Now / 02 Opponent / 03 Reports** main screens.
- No designated chain-bonus attacker assignment, as requested. Existing bonus-target suggestions remain individual and advisory.
- Torn PDA installation remains at:
  https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js
- Shared orders are opt-in and **not live until the Cloudflare Worker is deployed and connected**. The app never attacks, heals, spends energy or performs medical actions automatically.
- Attack parsing now supports the current Torn API v2 `is_ranked_war`, `modifiers.chain`, `modifiers.group`, and `modifiers.warlord` fields, plus older `ranked_war` and modifier names. Stealthed or otherwise unattributable attacks are not invented. `tests/war-v13.test.mjs` covers both formats.
- See `tests/war-v13.test.mjs` for cutoff, uncovered heavy targets, attacking/defending score attribution, squad role snapshots and shared data privacy.

## v1.2.0 - Black Skulls hard-target allocation and four-layer war workflow (4 November 2026)

### The four parts of WarStaxx

1. **Always-on strip on Torn's own pages**: a small persistent WarStaxx command bar appears even while scouting or between ranked wars, with **Act Now / Opponent / Reports** shortcuts. During a recently verified active ranked war the bar expands to show official score/net, chain/countdown, imminent bonuses, own energy/status, the best evidence-gated target and manual Turtle / Hit / Heal shortcuts. On scrolling it reduces to compact controls.
2. **01 | ACT NOW**: first screen, focused on the live war's score, chain, what to do next, verified target, the most important enemy status facts, near-chain-bonus guidance, a small source-qualified live player leaderboard, and urgent actions. No 20-tab horizontal menu.
3. **02 | OPPONENT**: faction-level scouting. Current availability, online/recent activity, travel/hospital status, their last completed war and scoring, actual enemy top-hitters, FFScouter coverage, a ranked BSS/BSE roster and the Black Skulls versus regular target split. Every opponent row opens a profile, with drilldowns into existing timelines, player intel, hospital control, previous wars and individual matchups.
4. **03 | REPORTS**: advanced tools grouped into Operations & Orders, Results & Performance, Scouting & Strategy, and Configuration. All legacy WarStaxx sections remain accessible here (and old hub deep links still work). A separate **Leader command** view provides role-separated war management.

### Black Skulls = the heavy hitters

**Black Skulls are reserved for the toughest approximately 40% of opponents with known BSS**, sorted by BSS first and level second. Regular attackers are recommended opponents from the lower known-BSS bracket. Any opponent lacking valid BSS evidence is **unclassified**, not automatically treated as weak. The buckets are stable across enemy hospital status changes, so members do not receive a sudden easier/harder assignment simply because someone temporarily goes to hospital.

- Enemy BSS source priority: a **recent (<=30 days) manually entered spy**; otherwise a **fresh FFScouter public BSS estimate**, with FFScouter enabled by that individual user and their own registered key and consent. Never reuse the FF multiplier for the API-key owner as a different member's FF, and never treat an estimate as a verified fight.
- Black Skulls are specifically shown opponent strength, status and the teammates with favourable **recent comparable manual spies**. An in-role target with no verified matchup is marked **scout first**.
- The automatic Hit action and the auto-draft consider **only that member's assigned strength bracket**, verify own/enemy roster freshness, confirmed manual matchup margin, risk profile, wins/losses and conflicting orders. Manual assignment controls reject new orders to the wrong bracket; previously saved wrong-bracket orders are flagged for review instead of silently deleted.
- Leadership sees three coordinated groups: **Black Skulls / regular attackers / defence and reserve**. Each member's status, manually saved role, energy evidence, assigned target and verification state is clickable.

### Five additional upgrades

- **Share more duties**: the opt-in, faction-scoped Cloudflare D1 backend now synchronises **six kinds of information**: member targets, Black Skull tags, individual risk settings, hospital-control watchers, per-war turtle posture/member duties, and per-war leader duty statuses. Each write has an atomic revision check. Shared payloads deliberately exclude Torn keys, FFScouter keys, spy reports, notes and private readiness. The backend still needs deployment and explicit tokens; it is off by default.
- **Underperformance relative to own previous wars**: Black Skulls have a personal performance watch comparing points per attack against their own last three available official ranked-war scorecards. A below-own-baseline flag requires two comparable prior scorecards, at least five current recorded attacks, and a >=30% decline. This is a review prompt, not proof of worse combat ability: live captures may be incomplete and assignments, bonuses and energy use vary. It is available in the Black Skulls screen, Leader command and completed after-action report.
- **Dedicated chain-bonus hit recommendation**: within three successful hits of an observed chain milestone, WarStaxx reserves a potential enemy-faction victim chosen from recent favourable per-member manual spies, prioritising proven winning encounters and larger battle-stat margin. The bonus amount is shown only as unlocked-conditional and is **not** applied if the member hits outside the opposing ranked-war faction. Attack initiation remains manual.
- **Live faction leaderboard**: captured per-member points, attacks, points per attack, individual history baseline, Black Skull identity and source confidence in a small first-screen view and full report/leaderboard. Missing attack API access is labelled **unknown**, not zero.
- **Leader strategic view**: separate tactical coordination dashboard with scores, net scoring pace, Black Skulls high-strength allocation, regular attackers, defensive members, chain/bonus planning, role clashes, sync status, underperformance evidence and one-click navigation to change local leader orders.

### Important accuracy limits

FFScouter provides a probabilistic estimate of battle-stat score; it is not an exact spy. All manual attack recommendations require a favourable, recent comparable **manual** battle-stat spy; FF/BSS alone does not authorise a hit. Role classification itself can use FFScouter BSS, but stale BSS is excluded. Source timestamps and unavailable information are shown honestly.

The live bar, role tabs and post-war metrics are usable without deploying the shared backend. No script automatically attacks, flies, uses an item or changes Torn settings. Refreshes happen only when Torn PDA is visible and API access permits them; the service does not watch while closed.

### Testing

WarStaxx regression checks include old functionality, new role allocation, preserving other-war duties during shared sync, historical performance baseline mathematics and the four-layer navigation. Additional Worker tests verify token roles, faction isolation, revision conflicts and turtle/leader-duty validation. **Live Torn PDA UI and an actual deployed Cloudflare Worker must still be verified on device.**

## v1.1.0 - Adaptive combat learning, Black Skulls risk, chain and shared war orders (4 November 2026)

Install / update at the **existing Torn PDA URL**:
https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

### 1. Learned ranked-war efficiency with evidence gates

- Rank opponents by **predicted respect per standard 25-energy attack**, not their level or headline battle stats.
- Use Torn's revised level-based base-respect formula, manual-spy-based FF model, and the locally observed same-war faction attack log when the API key has permission and **Read faction attacks** is enabled.
- Blend recent attack results with the model (up to eight usable observations). Ordinary chain-scale respect is normalised, fixed chain milestone bonuses excluded, and unusual retaliation, group, Warlord, overseas and mugging effects excluded where identified. Records can be incomplete.
- Require fresh own/enemy rosters, manually verified comparable battle stats and a favourable matchup; known losses and assignment conflicts are excluded. FFScouter estimates alone are not proof of safe fights. The HIT button **opens Torn's attack page only**.

### 2. Individual Black Skulls risk profiles

The new selector in the **Black Skulls** tab supports:

- **Safe:** opponent BSS/own BSS <= 0.55 and at least one recorded winning encounter.
- **Balanced:** opponent BSS/own BSS <= 0.70 (default).
- **Aggressive:** opponent BSS/own BSS <= 0.78, permitting evidence-backed "Possible" tier targets.

These are deliberately conservative **planning thresholds**, not empirical probabilities of winning. A missing or stale spy, loss evidence, assignment collision or target not Okay still prevents one-click HIT suggestions. Risk selections are local unless shared-orders sync is configured.

### 3. Live chain control

Fetches the **official faction/{id}/chain** selection during foreground refreshes. Shows chain count, API modifier, a countdown derived from the observed Torn timeout, next milestones (10, 25, 50, 100 and upward) and hits remaining. The War Room and Black Skulls view show the chain; the on-page bar also displays it. Alerts highlight imminent chain expiry and bonus milestones. This is a **sampled timer** rather than a realtime server push. Check Torn before committing energy.

### 4. Optional, real cross-device faction orders

A runnable Cloudflare Worker + D1 backend lives in [shared-worker](shared-worker/README.md). The Worker is **not deployed just by merging scripts into GitHub**.

A faction officer deploys it, sets a required one-faction ID, and chooses separate strong read and write secrets. In **WarStaxx > Settings > Shared faction war orders**, each member enters the HTTPS base URL and their read token; officers can select Can publish with the write token. While Torn PDA is in the foreground, reader devices automatically poll remote orders. Eligible writer edits publish after a short debounce. Concurrent changes use a revision check; HTTP 409 produces a clear conflict rather than silently replacing newer orders.

Only four selected kinds of data are shared: manual target assignments, Black Skulls membership, per-member risk modes and hospital watchers. Torn API keys, FFScouter credentials, manual spies, notes, player activity, and medical readings are never put in the sync payload. Local data isn't silently discarded when first connecting; the user explicitly chooses to publish their existing orders or replace them with shared ones. **The service is opt-in and disabled by default**. A device with no backend remains completely functional.

### 5. Post-war performance report automatically compiled on next foreground refresh

When the Torn API reports a completed ranked war, WarStaxx saves a debrief with final official score, wins/losses, individual contributions and attack counts, Black Skulls comparisons, available sampled opponent activity, pacing and tactical lessons. With optional faction attack-history permission, it adds captured attempts, positive-respect hits, captured respect per **estimated** 25 E per attack, a hitter breakdown, best observed opponent targets and maximum **observed** chain count.

Official member points divided by reported attacks and estimated energy are labelled **proxies**, not true energy logs. Device-limited attack feeds can omit events. The report can be copied as text, reviewed and revisited. End-of-war detection runs on subsequent visible app refreshes, not while the user's device is closed.

### Compatibility and verification

- Script identity, raw installer URL, configuration keys and TornStaxx hub event integration remain unchanged; original spies, assignments and saved observations are retained.
- Script source uses ASCII only for Torn PDA parser compatibility; no automatic attacks, healing, flights or medical item use.
- Automated tests in **tests/war-v11.test.mjs** supplement the historical regression suite for chain parsing, risk gates, hit-learning treatment, shared-data privacy and post-war analysis.
- Live Torn PDA WebView behaviour, faction API permissions and a deployed Cloudflare Worker need testing in the user's actual game/browser environment. Source checks do **not** constitute live multiplayer end-to-end validation.

## v1.0.0 - Adaptive live war bar, efficient hits, defensive windows and Black Skulls (4 November 2026)

**Unchanged Torn PDA URL:** https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

This is an in-place upgrade of the War specialist module; it does not replace the TornStaxx hub or reset local spies, API keys, alerts or opponent-specific orders.

**1. Auto-collapsing on-page war bar.** The live-war command strip uses in-page sticky positioning and responds to foreground scrolling. After scrolling it presents Turtle / Hit / Open with live score, net and relevant high-priority opponent buttons. Expanding returns the wider controls. Explicit manual compact preference remains available.

**2. Hit ranked by evidence-gated score per 25 energy.** Hit now chooses the highest points-per-energy candidate **among freshly observed, favourably matched opponents** with recent comparable manual spies, no known recent loss and no assignment conflicts. Basic expected war respect uses level-derived base respect, 2x war multiplier and the manual-spy-modelled FF; if at least two successful scored attacks on that particular opponent are present in the optional partial *current-war* attack feed, observed mean respect replaces the simple base estimate. These are comparison aids, **not exact future war points or success probabilities**. The ranking does not invent missing stats, outcomes, chain multipliers, Warlord modifiers or buffs; impossible/unverified targets are excluded. It opens Torn's attack screen only, with no automatic attack.

**3. Time-aware turtling.** The Turtling tab and manual Items shortcut show a suggested 60/90/120-minute coverage window based on current official score, sampled enemy pressure, local turtling posture and hospital time remaining. The shortfall is a *coordination target*, not an instruction to consume an exact number of items; real Ipecac hospital time varies (often 60-90 minutes), and blood compatibility, stock, medical cooldown, revivability and early discharge matter. An active Black Skull hitter is exempted by default to avoid taking attackers offline unnecessarily.

**4. Priority opponent availability.** When a fresh previously observed enemy roster changes a watched, assigned, or evidenced high-scoring opponent from unavailable to Okay, WarStaxx records a short-lived, war-scoped event. It displays an on-page AVAILABLE shortcut and a ranked alert in the TornStaxx hub; opening a hub alert goes to that opponent's dossier. Repeated identical rosters do not retrigger transitions. Alert visibility is configurable in Settings. These checks occur only during active foreground use, not via background push notifications or a server.

**5. Dedicated Black Skulls screen.** A new first-class Black Skulls tab displays own status and energy, assigned target, best evidence-backed points-per-energy hit, saved defensive role, assigned hospital watch targets, and the locally marked heavy-hitter roster with readiness and current orders. Existing Leadership, Matchups and Hospital Control remain accessible, and the War Room button opens the Black Skulls screen for a member marked as one.

Safety and compatibility: all medical interactions use Torn's own native item-use buttons. The script does not click Use, start attacks, modify revive settings, auto-fly, buy supplies or access teammate private API data. Roster freshness gates remain in place. The source stays ASCII-only to protect Torn PDA parsing. Existing installer, module ID and hub event contract are unchanged.

Validation: new `tests/war-v10.test.mjs` adds regression tests for FF-informed score-per-energy ordering, hospital/stale exclusion, 60/90/120-minute defensive windows, active Black Skull exemption, duplicate-free war-scoped availability alerts, and PDA parsing. Version-pinned tests and package metadata have been updated to 1.0.0. Live Torn PDA WebView and API-key scope verification remain device checks.

## v0.9.0 - Live war command screen and quick manual action shortcuts (4 November 2026)

**Permanent Torn PDA installer:** https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

During an officially detected *started* ranked war (recent Torn observation less than ten minutes old), WarStaxx inserts a compact command strip at the top of the Torn content page. The default War Room switches from long-form intelligence to a compact tactical dashboard. Outside active wars, the existing scouting homepage remains.

- **TURTLE:** opens the Torn Items page with Find Ipecac / Find blood bags buttons; these highlight items already visible in the player's inventory. The player verifies blood-type compatibility and taps Torn's own Use button. If already hospitalised, TURTLE opens defensive planning instead.
- **HIT:** if in hospital, opens the manual Heal items flow. On Items, pressing HIT again explicitly refreshes the official own faction roster to confirm you are no longer hospitalised before proposing the attack page. With current status Okay and enough known energy, chooses the strongest available enemy supported by fresh comparative manual spy evidence, excluding unavailable/conflicted targets and known losses. Attack navigation never starts the fight. If own status is unknown, energy is known to be below 25 E, or there is no verified favourable match, Hit stops and explains why instead of guessing.
- **HEAL:** navigates to Items with Find Blood bags, Morphine and First Aid controls. Nothing consumes a medical item automatically. **WAR ROOM**, **MORE STATS** and **Minimise** keep key navigation close to hand.
- The live War Room prioritises official score/net score, current owner status, energy, best evidenced target, opponent Okay/hospital/active counts, observed enemy scoring pace, and the three highest-priority current alerts. **Show other stats** reveals all previous detailed tabs (FF, spies, threats, history, hospital control, turtling, Black Skulls and more), without deleting data.
- A future war, completed war or stale war API observation will not trigger the live shortcut strip. The bar is embedded rather than floating and shares the existing TornStaxx hub. No extra script or new installer.

The script does not initiate fights, use items, infer blood type, request unvisited Torn pages, or modify a member's status. Find item buttons work on the foreground inventory; if the item isn't found, select Torn's Medical category or check your stock.

Validation: tests/war-v09.test.mjs covers active-war freshness, strongest verified target, hospital-to-heal and manual-item safeguards. Version-pinned tests and package metadata updated. Code-level validation does not replace Torn PDA testing.

## v0.8.0 - Ranked-war command, Black Skulls performance, hospital control and turtling (4 November 2026)

**Permanent Torn PDA installer:** https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

The specialist module now has six new or expanded ranked-war operations surfaces:

- **Quick command:** a compact phone-first commander showing the current official score, net advantage, observed points-per-hour, Black Skulls readiness, top enemy scoring threats, and direct manual tactical controls.
- **Hit ledger:** optional faction attack-feed collection; attributes ranked-war events only when the API explicitly marks them as ranked-war hits and both faction IDs and official war dates match. Includes our hitters, enemy hitters, timestamps, result, observed respect, and per-player contributions. A partial local feed is never presented as the authoritative war total.
- **Enemy threats:** ranks actual observed enemy scoring hits when available, with previous official war scores clearly labelled as historical fallback. The tool cannot infer an opponent's hidden stats from activity.
- **Hospital control:** tracks verified enemy scorers, hospital timers, watchlist members, and locally assigned Black Skulls watchers. The current roster status and watcher assignment are shown separately. A hospital exit is an estimated expiry, not a guaranteed opportunity.
- **Turtling:** three manual leadership postures (balanced, defensive, full), a member-by-member defensive duty board, exposed versus temporarily sheltered counts, upcoming hospital/flight expiry, and revivable-member warnings when supported. The War Clock also shows the official 24-hour target-reduction stage without inventing an original target or victory forecast. Travelling abroad is not automatically counted as protected after landing. Posture labels never change Torn status or perform flights, attacks, revives or medical actions.
- **Black Skulls post-war scorecards:** official individual scores and attacks, share of faction score and available prior-war mean, with unknown report rows left unknown instead of fabricated zeroes.

All six surfaces are routed through the existing War-TornStaxx module and TornStaxx hub, with no extra script or installer. The ranked-war attack feed is **opt-in** in Settings and depends on the API key's authorised faction access. Live scoring, travel, status and hit data are only collected while the userscript is active, not by an unattended server. WarStaxx never automatically attacks, uses items, purchases bounties, starts travel or changes revive permissions.

- Official ranked-war rules: https://wiki.torn.com/wiki/Ranked_War (net scoring; target reduction of 1% of the original target per hour after 24 hours).
- Turtling tactics background: https://www.torn.com/forums.php?p=threads&t=16554279 (community guide; verify current mechanics, especially return/expiry windows).

Validation: `tests/war-v08.test.mjs` adds regression coverage for war-specific hit attribution, no guessed attack totals, manual turtle status separation, Black Skulls official report values and mobile screen wiring. PDA ASCII and syntax checks are retained.

## v0.7.0 - Operations, reliable unique match assignments and evidence safeguards (4 November 2026)

**Installer URL stays the same:** https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

### Operations action centre

- New first-class **Operations** tab in the War module, accessible from the War Room and Leadership.
- **Do now** lists missing API/faction/opponent configuration, outdated own/enemy rosters, enemy scoring acceleration, duplicate saved targets, low known Black Skulls energy, and manual orders requiring attention.
- **Watch next** tracks hospital-status expiry and explicitly inbound return ETAs only for watched or already assigned opponents. Expiries are *not* confirmed attacks or proof of return to Okay; verify the latest Torn roster.
- **Close information gaps** flags missing member energy, unverified manual matchup evidence and unread war debriefs. Each item routes to a meaningful WarStaxx screen.
- **Copy operations briefing** copies text locally for optional manual sharing; WarStaxx does not send it or your API key to faction chat.

### Collision-aware, reliability-first Black Skulls draft

- Matching now uses an augmenting-path algorithm to maximise the number of **distinct hitters with verified favourable matches**, rather than letting earlier roster members reserve the scarce safe targets.
- Each draft candidate must have recent (within 30 days) comparable manual spies for *both* players, a favourable modelled battle strength ratio, a currently Okay enemy, a current Okay hitter and no known recent loss on that pairing. A fresh own and enemy roster (within five minutes) is mandatory. Known sub-25 energy blocks automatic drafting; unknown energy is labelled unknown rather than assumed ready.
- The Operations screen previews the suggested hitter-target pairs with confidence notes and separate **Review matchup**, **Save this order** and **Draft all locally** actions. This algorithm optimises the number of evidenced pairings; it does not claim to predict combat wins or optimise hidden battle mechanics.
- A selected opponent is never assigned twice in a fresh draft, previously saved assignments are respected, and auto-drafting does not execute attacks.

### Opponent-specific saved orders

- Manual target assignments are now archived **per enemy faction** on this device. On opponent change, current assignments are safely archived, the new opponent gets its own orders and the old orders can be restored if that faction returns.
- Existing saved assignments are automatically associated with the currently configured opponent; spies, past-war reports, notes, FF consent and historical observations remain intact.
- **Clear this opponent's orders** clears only the active faction's stored assignments. No cross-device intelligence sharing is enabled.

### Other quality fixes and validation

- A new watched-hospital-expiry alert routes to the Operations screen when a currently observed timer is within 20 minutes. Alerts require an opponent roster observed less than five minutes ago.
- The API-key Settings explanation now explicitly clarifies that **FFScouter** receives the opted-in FF key (or Torn PDA key fallback) and requested target IDs, unlike ordinary Torn API calls. It still requires explicit third-party consent.
- \`tests/war-operations-v07.test.mjs\` covers unique matchings, stale-data safeguards, preserved manual orders, opponent switching, hospital time windows and PDA parsing. Existing v0.6 tests remain in the suite.
- Observed data is collected only while the userscript executes on Torn; there is no backend background tracking, continuous monitoring or automatic gameplay.

## v0.6.0 - Reliability-first targeting, enemy acceleration, inbound flights, readiness and after-action (4 November 2026)

**Same installed Torn PDA URL:** https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

### 1. Reliable Black Skulls targets (highest priority)

- The War Room now prioritises **reliable evidenced matchups**, *not* the highest FFScouter fair-fight estimate.
- Each personalised hitter card uses recent comparative *manual* battle-stat spy data, the selected member's **actual recorded attack outcomes** where enabled, and current Torn roster status. The fighter-specific model is distinct from the FFScouter estimate calculated for the API-key owner.
- Recent confirmed losses are flagged as **Reassess losses**, rather than presented as guaranteed safe targets. Prior wins give extra ranking preference only with compatible fight data. Verified strong candidates require both manual spy records to be less than 30 days old and favourable comparison; stale/unknown third-party results remain explicitly unverified.
- Leadership still approves any assignment locally, with no automatic attacks. Readiness unknowns are not assumed to be able to fight.

### 2. Enemy scoring acceleration warnings

- War Pace now compares two **timestamped, non-overlapping** observed scoring windows and shows historical vs recent points per hour.
- A warning in War Pace, Leadership and TornStaxx alerts is raised when the opponent's sampled points/hour increases substantially, with enough observations and a fresh latest point. Observations older than 10 minutes cannot trigger acceleration.
- Acceleration is an observed trend, not a live stream, a predicted future score or a guaranteed outcome. It cannot be reconstructed from old official war final scores.

### 3. Incoming flights, exact source clarity

- WarStaxx recognises explicitly labelled **returning-to-Torn** states in the official enemy roster and uses the roster's future status-expiry timestamp (when provided) as an **inbound ETA**, alongside a countdown and UTC/TCT timestamp.
- Inbound flights appear in the watchlist, the Leadership tactical view and the enemy roster **Inbound flights** filter. An alert is raised when the inbound ETA is within 20 minutes **and the roster was sampled within 5 minutes**.
- Outbound flights and players merely abroad are not treated as returning. When no valid inbound timestamp is available, the UI says **ETA unknown**. Always refresh before acting; travelling targets cannot be attacked mid-flight. The status expiry is not a guarantee of a landing.

### 4. Black Skulls energy and medical readiness

- **Leadership** includes a Black Skulls readiness board showing official **Okay** status, known energy (25 energy is the normal attack cost), medical cooldown remaining, data source and age.
- For the **registered Torn API-key owner only**, WarStaxx can read `/user/bars` and `/user/cooldowns` when permitted. It optionally discovers the key owner's ID and marks those readings as official only while fresh (under 15 minutes). The key owner can disable own-bar polling in Settings.
- For other hitters, input is **manual and local to the device**, time-stamped and considered stale after 45 minutes. There is no shared spy/readiness database, no teammate-private API access, and unknown energy remains unknown.
- Medical cooldown indicates whether medical consumables can be used; it is **not** a blocker for normal attacks. Readiness labels distinguish energy sufficiency from hospital/travel status.

### 5. Automatic read-only After Action

- **After action** is a new War-TornStaxx section. Whenever the next refresh sees a completed ranked war in official history, WarStaxx builds a local debrief. It automatically improves the debrief once Torn's detailed report is available.
- Debriefs include the official result and score, key individual scorers, participant counts, enemy top-three scoring concentration, any locally observed online/travel rates, data gaps and evidence-based leadership discussion prompts.
- A new-war debrief routes into hub alerts; the leader may mark it Reviewed/Unreviewed, open the detailed scorecard or timeline, or copy the report **manually**. Older historical reports remain viewable without generating spurious new-war alerts.
- Historical war online/travel behaviour is **not** reconstructed from scorecards; missing observations stay unavailable.

### Safety and compatibility

- The full TornStaxx suite still uses the standalone hub and the same `war` module ID, existing keys/configuration, original userscript URL and local cache names. Existing spies, notes, orders and war histories are preserved.
- No game-state writes, auto-attack/medical use, shared intelligence service, faction-chat auto-posting, or cross-module key transmissions were added.
- `tests/war-operations.test.mjs` extends the regression tests for travel certainty, acceleration, own-only readiness, old losses and complete war debriefs. Source remains ASCII-only for Torn PDA quote normalisation.

## v0.5.0 - Leadership, personalised hitter targets, live scoring pace and per-war behaviour (4 November 2026)

**Torn PDA URL (unchanged):** https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

### Personalised targets for every faction hitter

- The revamped **Matchups** tab contains a roster-wide per-hitter comparison; choose any member or jump directly to their shortlist. It prioritises comparable manual battle-stat spies, opponent availability and recorded war contributions. Every opponent retains separate FFScouter-for-key-owner, modelled FF-for-selected-hitter and real attack-observed FF labels.
- **Strong candidate** requires favourable comparative manual spies for **both** players dated within 30 days. Stale manual spies show **Recheck old spies**; FFScouter-only estimates show **Verify estimate**, and missing stats show **Scout**. Dangerous, unavailable and already-assigned opponents are labelled clearly. These models are not win probabilities or guaranteed hits.
- **Draft verified Black Skulls orders** is a deliberate local button in Leadership. It uses only currently Okay, unassigned hitters with recent comparative manual spy evidence, avoids duplicate targets, and never overrides existing manual orders or performs a Torn attack. You can still select a manual target explicitly when information is incomplete.

### War Pace

- **War Pace** records official scores returned by the current ranked-war endpoint when the Torn page is open; it shows both factions' last sampled score, score differences, score points per hour in the latest sampled hour window, a small two-line historical score graph, data freshness and an observation confidence label.
- There must be at least two samples separated by five minutes to show an arithmetic rate. The app does **not** invent scoring during gaps, extrapolate a guaranteed victory time or claim the data is continuously collected when Torn PDA is closed.
- An optional war-score momentum alert routes to the Pace screen when the opponent has a sufficiently strong *observed* score-rate advantage; the ordinary TornStaxx hub remains responsible only for navigation and generic notices.

### Multiple-war behaviour history

- **War Timelines** records separate per-war local activity observations for both rosters (online, travelling/abroad, hospital and Okay). Each timeline has TCT hourly breakdowns, player-specific histories, polling coverage and a comparison with other wars captured on this device.
- A player's dossier now provides a **per-war travel and activity comparison** when that player was observed in multiple ranked wars. Old wars without observations remain unknown. Official completed war reports cannot reconstruct old online/travel patterns.
- Separate bounded local stores retain up to 20 score timelines and 20 war-activity histories. Existing 14-day general activity samples, old war reports, FFScouter caches, spies and notes remain intact.

### Leadership command screen

- **Leadership** compares active Black Skulls, currently Okay hitters, the latest official scoreline, locally recorded duties, manual assignment coverage and duplicate-target conflicts.
- Interactive target and duty selectors let you set and monitor each member, filter by Black Skulls/available/all, open their personalised shortlist or Torn's **manual** attack page, and copy a faction briefing. Duties such as Engaged, Support and Complete are **manual leadership notes**, not verified Torn events.
- Leadership can mark/unmark Black Skulls, save war-specific tactical notes and draft strong manual-spy assignments on explicit click. The command board switches to vertically stacked member cards on smaller screens.
- **No cross-device sync, shared spy database, remote service or Torn gameplay writes were introduced.** Keys stay inside War, not in the separate TornStaxx hub.

### Validation and limitations

- The new `tests/war-command.test.mjs` tests timed scoring, unknown history, isolated per-war travel, conservative per-hitter target ranking, Black Skulls drafting and war-scoped leadership statuses.
- Existing integration, FFScouter and Torn PDA source quote/ASCII regression tests remain in `npm test`. Tests do not substitute for live UI verification using your registered Torn API key.
- Data is read-only from the game API; score and activity snapshots exist only while Torn PDA executes the script in the foreground.

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
