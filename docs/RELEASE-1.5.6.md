# War-TornStaxx 1.5.6 | In-app usability and official API intelligence

## Changes
- Integrated in-panel search behind the existing header search icon. Finds current faction members, opponents, historical report members, IDs and named WarStaxx screens without closing the War panel. Search runs entirely against on-device records.
- Finder supports tap and Enter, scrollable results, Escape-to-close, mobile-friendly touch rows, explicit data freshness for roster matches and clear labels for historical-only members.
- Prominent automatic API coverage report in Opponent and Reports. Displays public player profiles, popular personal stats, complete dossiers and historical war report coverage.
- Source-health list for war state, own/opponent roster, official history, own battle stats and permitted spy reports. Each source distinguishes recent read, older data, error or retry backoff, without displaying API credentials.
- Public profile scouting prioritises assigned and watched opponents. It automatically rotates 3 opponents per active-war refresh, 2 otherwise, subject to 6-hour player cache and per-endpoint backoff.
- Added explicit user-triggered 'Scout up to 6 more players' for fast foreground backfill. It remains read-only, bounded and never requests extra manual player details.
- Promoted API-verified public popular combat counters in player dossiers (e.g., attacks won/lost and ranked-war wins where returned). These are explicitly lifetime public counters, not exact hidden battle stats, live war points or win probability.
- Existing single dedicated TornStaxx hub, identity probing, BSS bracket separation, manual assignments, conserved histories and established installer URL unchanged.
- Bumped distributed userscript, hub probe and package versions to 1.5.6; added API/navigation regression tests.

## API constraints / security
- The new player scanner uses existing /user/{id}/profile and /user/{id}/personalstats?cat=popular requests only. Both are official public API v2 selections and are throttled with the existing cache and backoff logic.
- No hidden player battle stats can be inferred from public counters. Exact battle stats require an authorised existing spy report. FFScouter remains opt-in.
- Never post Torn messages or perform game actions. No API keys, manual spy values or player-specific private snapshots are committed.
- WarStaxx.user.js is ASCII-only to protect Torn PDA's script parser.

## Verification
- `npm test` in GitHub Actions checks all legacy regressions, loader/parser safety and new local-finder/API-coverage tests.
- The design has not been visually tested on a physical Torn PDA device or validated with a live user API key.
