# WarStaxx optional shared orders service

This Cloudflare Worker and D1 database store only six per-war shared planning fields: faction war assignments, Black Skulls membership, individual hitter risk modes, hospital-control watchers, turtle posture/member duties, and leader duty statuses. No Torn API keys, manual spies, notes, medical readings or private player statistics are uploaded.

Deployment:
1. Install Node.js and use npx wrangler login inside shared-worker.
2. Run npx wrangler d1 create warstaxx-shared, and paste its database ID into wrangler.toml.
3. Run npx wrangler d1 migrations apply warstaxx-shared --remote.
4. Generate two distinct strong random secrets (at least 32 random bytes each). Set them with npx wrangler secret put SHARED_READ_TOKEN and npx wrangler secret put SHARED_WRITE_TOKEN. Never commit the secrets.
5. Run npx wrangler deploy. Copy the resulting HTTPS Worker URL to WarStaxx Settings > Shared orders.
6. Give members the read-only token, and only trusted officers the write token. Officers tick Can publish in WarStaxx.

Scope and safety:
- Both GET and PUT require a valid bearer token. PUT additionally requires the write token.
- All turtle plans and leader duties are keyed to a single war ID. A new war cannot overwrite prior-war tasks.
- One deployment is bound to exactly one FACTION_ID. Read/write tokens cannot query records for a different faction.
- Only Torn main-site browser origins are permitted. D1 stores the records in a faction ID + war ID namespace.
- Updates are revision-checked in an atomic D1 UPSERT. Conflicting writes return HTTP 409. No silent last-write-wins.
- No script deploys this Worker automatically; you must provision it in your own Cloudflare account.
- Shared orders are visible to your D1 account admins and Cloudflare. Do not use this for secrets or API keys.
- A single officer write token has no per-user audit controls. Rotate both tokens if a member's access changes.

## WarStaxx v1.2 deployment notes

The client now pulls and publishes the additional `turtlePlan` and `leaderDuties` fields in the same compare-and-swap revision as targets and risk settings. A new database migration is **not required** for these additions: the document remains JSON in the existing D1 `data` column. Deploy the **updated Worker source** before enabling the new clients for the faction. Older Worker versions will reject the expanded payload.

Access control remains token-based: readers see shared planning orders and only write-token officers may publish. Keep these secrets private and rotate them when membership changes. The Worker is not automatically hosted merely because it was committed to GitHub.
