# WarStaxx optional shared orders service

This Cloudflare Worker and D1 database store only faction war assignments, Black Skulls tags, per-hitter risk modes, and hospital-control watchers. No Torn API keys, manual spies, notes or private player statistics are uploaded.

Deployment:
1. Install Node.js and use npx wrangler login inside shared-worker.
2. Run npx wrangler d1 create warstaxx-shared, and paste its database ID into wrangler.toml.
3. Run npx wrangler d1 migrations apply warstaxx-shared --remote.
4. Generate two distinct strong random secrets (at least 32 random bytes each). Set them with npx wrangler secret put SHARED_READ_TOKEN and npx wrangler secret put SHARED_WRITE_TOKEN. Never commit the secrets.
5. Run npx wrangler deploy. Copy the resulting HTTPS Worker URL to WarStaxx Settings > Shared orders.
6. Give members the read-only token, and only trusted officers the write token. Officers tick Can publish in WarStaxx.

Scope and safety:
- Both GET and PUT require a valid bearer token. PUT additionally requires the write token.
- One deployment is bound to exactly one FACTION_ID. Read/write tokens cannot query records for a different faction.
- Only Torn main-site browser origins are permitted. D1 stores the records in a faction ID + war ID namespace.
- Updates are revision-checked in an atomic D1 UPSERT. Conflicting writes return HTTP 409. No silent last-write-wins.
- No script deploys this Worker automatically; you must provision it in your own Cloudflare account.
- Shared orders are visible to your D1 account admins and Cloudflare. Do not use this for secrets or API keys.
- A single officer write token has no per-user audit controls. Rotate both tokens if a member's access changes.
