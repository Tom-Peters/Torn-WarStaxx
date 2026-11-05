# War-TornStaxx v1.5.2 | Stability release

Date: 5 November 2026

## Changes

| Area | Before | v1.5.2 |
|---|---|---|
| Live operation state | A cached nonzero ranked-war ID could trigger operational warnings outside a verified live-war window | Operations, current alerts and hub live-war context require `activeWarNow()` |
| Torn page scrolling | Scrolling a nested table or separate widget could collapse the sticky war bar | Only document scrolling or direct scrolling on Torn's main page container is considered |
| My Mission | When an order was saved, both the best recommendation and assigned target scanned the same opponents | One shared verified scan retains assignment precedence and safety blocks |
| Black Skulls command | Briefing coverage was calculated again by the operations queue | Same-interval coverage object is passed into the queue |
| Act Now | A previously calculated best target was not used | Removed redundant expensive call |
| Confirmation feedback | Successful manual changes appeared red like errors | Typed 30-second success notice, with actual errors shown separately |
| Small reports | Long tables scrolled sideways and lost the player label | First column stays visible on narrow screens, except the existing mobile leadership-card view |
| Torn PDA debug probe | Version marker did not match userscript / module | All three report v1.5.2 |

## Guardrails

- The saved local target still wins over the higher-yield recommendation. If the target is ineligible, quick HIT stops rather than selecting a substitute.
- Available Black Skulls opponents must be in the high-BSS bracket, with manually verified battle-stat evidence.
- The script only navigates to Torn's attack or item pages. It does not submit an attack, use a medical item or send squad orders by itself.
- No local configuration format, secrets, third-party consent or shared Worker contract was changed.
- The installer remains `https://raw.githubusercontent.com/Tom-Peters/Torn-WarStaxx/main/WarStaxx.user.js`.

## Test and device verification

- CI definition: `.github/workflows/ci.yml` executes `npm test` on Node 22 for pushes to `main`.
- New regression suite: `tests/war-stability-v152.test.mjs` tests version and syntax, stale-war guards, isolated scrolling, single-pass matching, command coverage reuse, success feedback and mobile CSS contracts.
- Prior test fixtures have been revised where they assumed the removed faction shortcut, pre-1.5 API BSS handling or lacked mocks for recent policies and reports.
- An actual Android Torn PDA WebView, current external FFScouter credentials, shared Worker, and a live ranked war still require on-device testing. A CI pass is not proof that those integrations work on the user's phone.
- Priority device smoke tests: launch from hub and direct strip; scroll a report without collapsing the strip; verify a saved Skull assignment; check an invalid/hospital target; open the correct Torn attack page; view the 360px layout; inspect chain countdown and medical shortcuts.

For preceding findings, refer to [QA audit 2026-11-05](QA-AUDIT-2026-11-05.md).
