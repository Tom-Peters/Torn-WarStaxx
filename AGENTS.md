# AGENTS.md — War-TornStaxx

Read the current standalone hub architecture and module contract first:
https://raw.githubusercontent.com/Tom-Peters/TornStaxx/main/AGENTS.md
https://raw.githubusercontent.com/Tom-Peters/TornStaxx/main/docs/INTEGRATION.md

- The fifth dedicated TornStaxx script owns the full shared command-centre UI. **Do not** embed the legacy StaxxHub into the War module.
- War module entrypoint: `WarStaxx.user.js`; displayed as **War-TornStaxx**, stable tool ID `war`. Preserve the existing GitHub/raw URL until the user renames the repository and installer migration is verified.
- Preserve independent early boot probe, war-page shortcut, observed enemy activity, ranking reports, member-by-member conservative strategy, Black Skulls assignments and FFScouter explicit opt-in.
- Separate official war results, foreground-observed statuses, manual spies, verified FF records and external/modelled estimates. Never make up historical travel/online data or exact hidden battle stats.
- API access is read-only and rate-limited; no automatic attack, consumables, transfers, faction orders or state-changing Torn requests.
- Public author **IamEEKY** only; do not commit keys, spy values, personally identifying player data or private imported history.
- Include the small fallback launcher and hub event adapters; check `npm test`, CI, script injection timing and Torn PDA device behaviour separately.

- **Torn PDA parse reliability:** The distributed `WarStaxx.user.js` must contain only ASCII source. Use JS `\\uXXXX` escapes for decorative glyphs; avoid curly apostrophes U+2018/U+2019 and curly quotes U+201C/U+201D. War 0.2.4 had two smart apostrophes in single-quoted JavaScript strings that broke parsing when normalized to straight quotes. Keep `tests/pda-quote-safety.test.mjs` and CI green on every edit. Avoid touching the user's local API key or war history when fixing injection bugs.
