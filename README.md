# Torn-WarStaxx

**WarStaxx** is the fourth Torn Staxx tool: ranked-war intelligence, public war records, live roster status, conservative per-player assignments and historical opponent observation. **Author: IamEEKY.**

## Stable Torn PDA installer

https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js

WarStaxx registers in the **existing StaxxHub** sidebar as WS. No second persistent FAB is installed. It shares top navigation, notices, summaries and the action queue with ProfitStaxx, Company Helper and Happy Jump.

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
- **Orders:** assignments for each member; only suggests provisional auto-hits when both sides have comparable known stats; unknown pairs default to scout/support/standby. Manual assignments override auto ones.
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
