# WarStaxx 3.0 release candidate

## Operator guide

**Live war** shows the official score and one next action. A shared primary assignment or an existing claim takes precedence in the member's queue. The secondary disclosure contains the war queues. The existing Players screen and native country grids remain available. Tools & reports opens the following specialist views.

| View | What to do |
| --- | --- |
| Black Skull command | Review the BSE boundary, evidence and uncovered targets. Open a target, choose a primary, order backups by Torn ID, set priority and publish. Lock an order when leadership needs to hold it. The existing squad membership controls remain under Legacy orders. |
| War briefing | Use the scheduled opponent's roster before the start. Review threats, roll call, opening matchups, score, previous wars, defensive priorities and available scoring windows. Enter that week's unreported rules from the enlistment panel. |
| Activity and forecasts | Choose 3, 7, 14 or 30 UTC dates. Compare both factions by online samples, recent actions, scanner observations or recorded attacks. Scroll across each grid. Date rows, weekday averages, hourly averages, player filters and CSV use the same evidence. |
| Defensive travel | Select the actual next flight method and book status. Review all 11 published destinations, enemy presence, inbound windows and routes over 30 minutes each way. Confirm landed equipment, ticket availability and the current weekly rules in Torn before taking any action. |
| Combat archive | Export a private JSON backup, merge a backup by attack ID or page further into authorised personal attacks. The dossier separates attack and defence and records stalemates. |

### Where the decisions come from

BSE is FFScouter's estimated total stats. BSS measures the sum of the square roots of the four stats. Recorded Torn FF, owner-specific modelled FF, exact personal stats, dated spy reports, and battle results remain separate. The BSE rule requires a positive estimate, a retrieval under 24 hours old and a provider date no more than 28 days old. Private Premium estimates require a current entitlement. A known enemy above the strongest observed regular can be provisionally heavy while regular coverage is incomplete. A weaker enemy's recorded offensive victory against the strongest known regular can also qualify. Missing strength leaves a scouting requirement. Manual targets survive upgrades.

The installed v2 relative default migrates to BSE for the command view. Explicit percentage and minimum-BSS settings stay legacy. The v1 orders protocol always retains its v2 BSS policy representation. A Capo can publish the command room's independent policy and manual extras. Older clients can read legacy orders but cannot participate in v2 assignments or locks. Use the new command view as the coordination authority when mobilising a squad.

For each target the Worker stores a primary, original primary, ordered backups, priority, lock, operational state, verification time and reason. A trusted officer's fresh roster starts the 300,000 ms grace period on the server. A fresh available sample cancels it. A reassignment needs an unavailable sample observed at or after expiry and an available eligible backup. The Worker checks country, live reservations and backup load. An officer can explicitly keep a locked target uncovered. A return to the original primary respects claims, current workload and the configured return hold (default 10 minutes). A single hitter can have multiple duties, ordered by priority. New assignments and manual overrides require a Capo's explicit publish.

Three-minute claims use Worker time. Disconnecting leaves a claim valid only to its expiry. A claimant can release their own claim. An officer client can confirm completion against a dated, locally captured ranked attack for the correct pairing and war. No attack log, spy report, raw FF estimate, medical inventory or Torn API key enters the command room.

### Data and retention

| Data | Storage and handling |
| --- | --- |
| Combat and identities | Local IndexedDB stores identified encounters and partial records by authoritative attack ID. Names and dated membership intervals use player IDs. The combat archive stops admitting new IDs at 40,000 and reports a capacity warning. A JSON backup can be merged repeatedly. Older records do not vanish on an opponent switch. |
| Historical reports | Official war scorecards and aggregate-only historical snapshots remain aggregates. They do not create fictional encounters. The client can import attributable legacy hourly war snapshots. |
| Activity | Local per-player/per-faction hour buckets cover 30 UTC days. Current roster samples are point observations. Unknown statuses are excluded from online denominators. Scanner scores have their own series. Scanner periods with unknown war attribution are included only under All. CSV has source, UTC hour, sample denominator, roster coverage and latest observation. |
| Shared state | D1 stores assignments, tactical duties, policy, limited officer-observed status, claims, voluntary availability and a bounded audit trail (latest 300 revisions per war). Observations expire after an hour, claim records after a day beyond expiry, old roll calls through scheduled housekeeping. Long-lived plans remain. |
| Forecasts | Rolling historical hourly samples support 30-, 60- and 120-minute windows. Supported periods need at least two distinct sampled dates per hour for both sides, available hitters and credible target opportunities. Black Skull coverage, heavy activity, timing, current scoring pace and known energy constrain the result. Current statuses and historical patterns can change before the window opens. |

## Implementation

Edit new client modules under `src/`, then run `npm run build`. The installer contains all code and retains its original raw URL, metadata, ASCII source, module ID and early boot probe. The build checks the embedded source in CI. Existing domain code stays in the installer.

| Source | Responsibility |
| --- | --- |
| src/intelligence.js | Archive transactions, source-preserving merge, dated spy snapshots, identity history, matchup classification and historical feed paging |
| src/coordination.js | Scoped PDA transport adapter, member queue, proposal review, claims, lock UI, notices and refresh handling |
| src/activity.js | Hourly capture, Premium ingestion, legacy migration, UTC aggregation, export and forecast calculation |
| src/planning.js | Source-dated matchups, safe/offensive routes, proposals, defensive priorities, template interpretation and tactical posture |
| src/views.js | Command subviews, manual configuration and local backup controls |
| shared-worker/src/index.js | Origin, faction and credential checks, legacy v1 endpoint and scheduled housekeeping |
| shared-worker/src/command.js | Restricted member identity, field validation, CAS transactions, grace state machine and retention |
| shared-worker/migrations/0002_command.sql | Separate revisioned command rooms and audit events; event rows commit in the same SQLite transaction as the room |
| scripts/member-grant.mjs | Offline issuance and revocation of expiring per-member bearer credentials |

### Network and identity

The original `GET/PUT /v1/factions/{faction}/wars/{war}/orders` remains available. New `GET/PUT /v2/factions/{faction}/wars/{war}/command` uses the existing Worker and D1 binding. GET returns schema 1, revision, server time, actor, permitted plan and operational state. PUT takes `Authorization: Bearer …`, a decimal `If-Match` revision and JSON `{"data":{"type":"…"}}`. Accepted operations are assign, lock, unlock, observe, claim, release, verify, duty, roll and policy. A missing revision gives 428, stale writes give 409, invalid credentials give 401 and insufficient authority gives 403. A missing command migration gives 503 while v1 continues to operate. A successful mutation returns its own committed revision. A subsequent GET reads the latest state. An ambiguous mobile timeout requires a read before retrying.

| Credential | Permission |
| --- | --- |
| Existing read bearer | Read-only team coordination |
| Existing write bearer | Legacy authorised officer administration and Capo coordination. It cannot impersonate a specific claimant or submit a personal roll call. |
| Member-bound Capo | Assign, lock/unlock, publish policy, verify attack references, administer duties, submit trusted observations and participate personally |
| Member-bound officer | Tactical duties, trusted observations and verification, personal roll call and eligible claims |
| Member-bound Black Skull | Squad view, personally eligible claims and roll call |
| Member-bound regular | Own duties, eligible target, relevant claim and own roll call. Read filtering applies to responses as well as writes. |

Every per-member grant is tied to a faction and expires after seven days. A client never declares its effective role. Promote officers only after verifying control of the Torn player ID through a trusted faction channel. The Worker trusts officers to attest observations from their authorised Torn client. It has no Torn credentials with which to independently attest them. An hourly cron performs bounded D1 housekeeping; expiry is also enforced when requests arrive. The cron performs no Torn polling, gameplay action or reassignment.

## Deployment and rollback

**Baseline** — WarStaxx v2.8.8 at `bfaa0728b65f6fcb3fe4987adb92427347da5877`. Save the current Worker deployment version ID from Deployments as a separate rollback reference. Verify the Cloudflare account and the existing database UUID in the dashboard before any remote command. Keep backup SQL and proof of revisions outside the checkout.

1. Review the feature branch. From its root run `npm test`. Run the offline Chrome harness with `python tests/browser/command_mobile.py /path/to/TornStaxx.user.js` after installing Python Playwright and Chrome. Set `CHROMIUM` for a specific headless executable.
2. In Workers & Pages → **warstaxx-shared-orders** → Settings → Builds confirm the connected repository, production branch **main**, root **/shared-worker**, and deploy command **npx wrangler deploy**. Open the build API token setting. If Cloudflare reports an unavailable token, select an active Workers Builds deploy token for this Worker/account or create its replacement using the build settings. Keep the binding and the two runtime secrets in place. Build credentials are separate from application bearer tokens.
3. Verify a fresh build for an identified commit and its logs. Confirm the deployment version and source revision in Cloudflare. A green GitHub Action or an earlier 401 health response cannot verify a future production build. A feature preview must use isolated D1 before performing test writes. Do not send a test write to production.
4. From `shared-worker/`, run the following **after verifying the account and existing D1 ID**. Save the export privately. Check that the exported table definition and an existing revision are present. The original Worker may already have created `faction_orders` without a migration ledger entry. Applying 0001 is idempotent. 0002 creates new tables, indexes and triggers.

   ```sh
   npx wrangler whoami
   npx wrangler d1 info warstaxx-shared
   npx wrangler d1 time-travel info warstaxx-shared
   npx wrangler d1 export warstaxx-shared --remote --output=/private/backup/warstaxx-before-v3.sql
   npx wrangler d1 migrations list warstaxx-shared --remote
   npx wrangler d1 migrations apply warstaxx-shared --remote
   npx wrangler d1 migrations list warstaxx-shared --remote
   ```

   Substitute a private writable backup path. If Wrangler requests a database ID for a name-only binding, use a private copy of the existing config in the same directory with the verified `database_id` under `[[d1_databases]]`, and pass `--config <copy>`. Stop if Wrangler offers to provision a different database.
5. Release the backward-compatible Worker **before** distributing the client. From the reviewed branch run `npx wrangler deploy` in `shared-worker/` to the existing named Worker with the verified binding, or merge a Worker-only release first using the established GitHub build. Record its deployment ID. Check the original v1 orders and revision for a known war using the existing read credential. Read v2 on the same scope and verify schema 1, server time and the expected actor. No production writes are required for this check.
6. For multi-member use, keep a private canonical grants directory outside Git. Verify each member's Torn identity, for example by having them return a one-time challenge from their known Torn profile through your faction channel. From the repo root run `node scripts/member-grant.mjs /absolute/private/warstaxx PLAYER_ID skull`. Choose member, skull, officer or capo. Deliver only that member's private delivery file to them through the verified channel. From `shared-worker/` run `npx wrangler secret put MEMBER_GRANTS < /absolute/private/warstaxx/grants.json`. This replaces the entire grants secret, so maintain one authoritative grant list. For revocation use the same script with `revoke` and reinstall the grants secret. Renew grants before expiry. Do not distribute the broad write token.
7. On Samsung Torn PDA, check a scheduled war, an active war and completed-war behaviour. Check both rosters, a foreign hospital, return flights, timers at 5 and 15 minutes, long expanded rows and scrolling. Use two identities against staging for a claim, disconnect, expiry, lock, fresh five-minute reconfirmation and pre-war roll call. Compare scanner buckets and flight windows to one authorised Premium account. Confirm the hub opens each alert and TrainingStaxx pauses only during a verified active war.
8. After the checks, merge the client release and update the same installer URL. Verify the automatic main-branch build for that exact SHA, then repeat the read-only v1/v2 checks. Export local combat intelligence before changing devices or clearing site data.

**Rollback** — Revert the client release on main to the installer at the baseline commit. In Cloudflare roll the Worker back to the recorded v2.8.8-era deployment version if needed. Leave additive D1 tables, original orders, runtime secrets and local IndexedDB in place. Verify v1 GET on a known room. D1 Time Travel restores the whole database and can discard intervening orders; use it only for confirmed data corruption after taking another export and agreeing the recovery point. A normal code rollback needs no D1 restore. Baseline clients can ignore the new local stores; a later 3.0 installer can reopen them.

## Validation boundaries

The repository tests exercise synthetic Torn and FFScouter records, a real SQLite schema with migrations/triggers behind the Worker handler, and the distributed installer in mobile-width Chromium. The browser integration can run with the actual hub installer and exercises native HTTP bridge calls against the Worker fixture. Live PDA, subscriber-only responses, production D1 data, account build-token settings and future production builds need separate evidence.

## Specifications

- [Torn OpenAPI](https://www.torn.com/swagger/openapi.json)
- [FFScouter OpenAPI](https://ffscouter.com/openapi/spec.yaml) and [provider guidance](https://ffscouter.com/api-docs/guidance)
- [Torn travel rules and flight times](https://wiki.torn.com/wiki/Travel), [Ipecac](https://wiki.torn.com/wiki/Ipecac_Syrup) and [ranked-war templates](https://wiki.torn.com/wiki/Ranked_War)
- [Cloudflare build troubleshooting](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) and [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
