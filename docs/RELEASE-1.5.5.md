# War-TornStaxx 1.5.5 | Official-data accuracy and reports reliability

Release date: 5 November 2026

## Data correctness
- Read completed-war faction scores from the correct sibling `rankedwars[].factions` object when the `war` object holds start/end times. Handles arrays and integer-keyed Torn API maps.
- Resolve numeric map keys when the nested faction/member record does not provide a valid ID. Ignore null map/array entries.
- Distinguish a missing score, attack count or level from a real zero in detailed reports and summary formatting.
- Fix first timestamp in the locally observed score trend chart (it previously used a property on a numeric timestamp).
- Require a complete two-sided, ended ranked-war report before caching one as fully available.

## Reliability
- Incremental automatic backfill requests up to three eligible official reports per refresh and skips rate-limited/backed-off war IDs instead of repeatedly blocking later wars.
- Report coverage is visible in Reports and Past wars as complete/total/missing with temporary backoff counts; unknown data stays explicitly unknown.
- Recent-status metrics on standby, activity and commander screens, and the hub's activity summary, now require fresh roster data. Expired status is labelled "Stale" instead of "online now".

## Preserved behaviour
- Same standalone War module, TornStaxx hub contract and installer URL.
- Same Black Skulls upper-BSS target separation and guarded manual HIT behaviour.
- Read-only Torn API; no automatic attacks, items, transfers or state-changing requests.
- Existing settings, keys, assignments, spies and saved history remain stored locally.
- The distributed userscript remains ASCII-only for Torn PDA quote-normalisation safety.

## QA
- Added regression tests for keyed/array war history, score preservation, unknown versus zero, report coverage, fair report backfill, chart timestamps and ASCII/version safety.
- Review the GitHub Actions Node test results before release; full device integration and live-key access require testing on Torn PDA.
