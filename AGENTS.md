# AGENTS.md - Tamroi · NSC Prototype 06

> Project guide for Codex and other coding agents. Keep this file aligned with `CLAUDE.md`, `README.md`, `docs/CODING_INSTRUCTIONS.md`, and the current codebase.

## Project Context

Tamroi (ตามรอย) is a mobile-first web MVP for NSC 2026 by team ปลามึกยักษ์. It is an educational travel game for Thai history: players visit real districts, check in at landmark Watchtowers, clear a Fog of War layer, unlock historical figures, collect artifacts, and compete on The High Chronicler leaderboard.

Current phase: Phase 1 Web MVP. There is no native app, no React, no npm workflow, no bundler, and no framework migration in this phase.

Primary user: Thai tourist/traveler, roughly age 20-30. The UI mixes Thai labels/content with English code and docs. The app is designed as a centered mobile web frame with max width 430px.

## Product Mechanics

- Watchtower check-in clears Fog of War for a district.
- Cleared district state persists through Supabase `user_districts`.
- First-run onboarding asks for location permission, then stores a chosen home district in localStorage before launching the app.
- The map can also prompt for a home district and clears that district locally as the starting base.
- S-Class / Legendary figures are phase-locked behind support-node progress:
  - Visit 2 local cafes for Local Rumors.
  - Visit 1 OTOP/workshop for a Relic.
  - Check in at 3 nature/minor landmarks for Historical Knowledge.
- C-Class figures can be captured with a simple quiz once found.
- Scoring context:
  - C-Class/local figures are about 50 Legacy points.
  - S-Class/Legendary figures can be up to 500 points, e.g. King Taksin.
  - BTS/MRT transport bonus is planned as a x2 points multiplier.
- Leaderboard metrics are Map Discovery %, Archive count, and Legacy Score.

## Tech Stack

- Frontend: HTML5, Bootstrap 5.3.3 CDN, vanilla JavaScript.
- JavaScript style: classic browser scripts, globals, and module objects/IIFEs; do not use ES module imports.
- Map: Leaflet.js 1.9.4 with CartoDB Dark tiles.
- Backend/auth: Supabase JS v2 CDN, Supabase Auth, PostgreSQL, RLS.
- Deployment: Vercel static output with `node build.js` generating `js/env.js`.
- Local dev: VS Code Live Server or any simple static server, usually port 5500.

Do not add npm dependencies, package managers, bundlers, frameworks, or a build step unless the user explicitly changes the project direction.

## Repository Map

- `index.html`: splash / landing page with Supabase session redirect handling.
- `login.html`: centered email/password login, register, Google OAuth, and client-side form validation.
- `onboarding.html`: first-run location permission and home district picker.
- `app.html`: main app shell with Map, Collection, Missions, Leaderboard tabs, Bootstrap offcanvas panels, lore/check-in/home bottom sheets, and figure modal.
- `build.js`: Vercel build-time env injection into `js/env.js`.
- `vercel.json`: deployment config and security headers.
- `restyling/`: seven page-by-page UI restyling concept sets, comparison boards, and a concept index; these assets are not loaded by the runtime.
- `css/variables.css`: authoritative design tokens.
- `css/layout.css`: app wrapper, fixed top bar, bottom nav, tab shell.
- `css/components.css`: buttons, cards, inputs, pills, bottom sheets, badges, toast, collection/missions/leaderboard/lore components.
- `css/map.css`: Leaflet overrides, fog layer, markers, GPS dot, node card.
- `css/animations.css`: shared keyframes and transitions.
- `js/config.js`: reads `window.ENV` and writes `window.APP_CONFIG`.
- `js/env.js`: tracked public Supabase anon config for local/static runtime.
- `js/env.example.js`: credential template for resetting `js/env.js`.
- `js/utils.js`: exposes `escapeHtml()`.
- `js/supabase-client.js`: the only place that should call Supabase directly; exposes `window.DB`.
- `js/app.js`: boot, auth guard, tabs, sheets, lore sheets, toast, notifications, top bar; exposes `window.AppCore`.
- `js/map.js`: Leaflet map, inverted fog polygon, watchtowers, support nodes, GPS dot/ring, home location picker, GPS Lore proximity checks.
- `js/fog-grid.js`: reusable classic-script Thailand grid helper; exposes `window.FogGrid`.
- `js/collection.js`: figures, artifacts grid, Lore Journal, and capture card refresh.
- `js/missions.js`: active mission and daily challenges.
- `js/leaderboard.js`: metric tabs, podium, ranked list.
- `supabase/schema.sql`: schema, seeds, views, and RLS policies.
- `supabase/patch_auth_fix.sql`: robust auth trigger and profile insert policy.
- `supabase/patch_lore.sql`: lore nodes, user lore, persistent support-node visits, quiz questions, score functions/triggers, and seed content.
- `supabase/patch_district_seed.sql`: MVP district seed parity with `js/map.js`.
- `docs/CODING_INSTRUCTIONS.md`: design system and implementation rules.
- `docs/progress.md`: current implementation status.
- `docs/production-smoke.md`: production Supabase/Vercel smoke-test checklist.
- `docs/proposal/tam_roi_nsc_proposal.md`: detailed NSC/game proposal.
- `document/`: NSC assets, screenshots, and generated documents.
- `tests/lore-static.test.mjs`: Node static regression check for Lore integration points.
- `tests/remaining-static.test.mjs`: Node static regression check for support nodes, quiz, discovery, bonus, and Realtime.
- `tests/prod-readiness-static.test.mjs`: Node static regression check for production readiness docs/config.
- `tests/district-seed-static.test.mjs`: Node static regression check that SQL district seeds match MVP map districts.
- `tests/env-policy-static.test.mjs`: Node static regression check for tracked `js/env.js` public-anon policy.
- `tests/grid-fog-static.test.mjs`: Node static regression check for `window.FogGrid`.
- `tests/run-static.mjs`: one-command static regression suite runner.

`js/env.js` is intentionally trackable for this prototype. Keep it limited to public Supabase anon/dev-safe values only.

## Current Implementation Notes

- `restyling/` is an additive design exploration only; the live HTML/CSS/JS UI has not been restyled.
- The current CSS tokens in `css/variables.css` are authoritative. They differ from older docs: background is `#1C1B2E`, primary is `#F6C19E`, card surfaces are `#252240` / `#201E38`.
- `window.APP_CONFIG.appName` is `Tamroi`, version `0.6.0`.
- `window.FogGrid` exposes reusable Thailand grid cell generation and coordinate lookup for future Fog of War work.
- The map currently carries mock Bangkok/Nonthaburi district and node data with Supabase fallback/integration.
- The map carries mock Lore nodes with Supabase fallback/integration, checks proximity in the GPS callback, persists local fallback unlocks in `tam_roi_lore_unlocked`, and renders saved/unlocked lore places as tappable map icons that reopen the lore sheet.
- The database seed in `supabase/schema.sql` currently seeds a smaller Bangkok district set than `js/map.js`.
- `js/map.js` no longer blocks fog check-in on support progress; support progress gates Legendary Encounter instead.
- Support Node Visit buttons call `DB.Districts.updateNodeVisit(userId, districtId, nodeType, nodeId)`, persist exact node IDs in `user_support_node_visits`, and use a loaded/local visited set to prevent duplicate taps across reloads and current session.
- `js/map.js` validates non-localhost Watchtower check-ins within a 500m Haversine radius from the district watchtower/center.
- `js/map.js` renders C-Class/S-Class figure markers in cleared districts and opens DB-backed quiz flows.
- `js/map.js` computes live DB map discovery percentage when Supabase is available.
- `js/map.js` has seeded BTS/MRT station radius data for x2 point multiplier checks.
- Home/base district state uses `tam_roi_home`; `js/map.js` migrates the legacy home key if present.
- Real-time GPS uses `navigator.geolocation.watchPosition`; failures should degrade silently and keep the app usable.
- Collection, missions, and notifications use mock fallback data when Supabase calls fail; leaderboard uses the DB-backed `leaderboard_legacy` view and shows an empty/error state instead of mock rankings.
- Collection figure detail uses a reused Bootstrap modal instance and cleans stale backdrop/body state on close.
- `window.DB` groups `Auth`, `Profiles`, `Districts`, `Figures`, `Artifacts`, `Leaderboard`, `Lore`, `Quiz`, and `Notifications`; `Districts.getVisitedSupportNodes()` loads persisted support-node IDs and `Notifications.subscribe()` wraps Supabase Realtime.
- `window.AppCore` groups `App`, `switchTab`, `openSheet`, `closeAllSheets`, `openLoreSheet`, `openLoreChainSheet`, `showFloatPts`, and `showToast`.

## Development Setup

Local credentials:

`js/env.js` is tracked. Edit it only when changing the public Supabase project URL or anon key for local/static runtime. Use `js/env.example.js` as the reset template if needed.

Serve locally with VS Code Live Server or a static server from the repo root. There is no npm install step for normal local development.

Supabase first-time setup:

1. Run `supabase/schema.sql`.
2. Run `supabase/patch_auth_fix.sql`.
3. Run `supabase/patch_lore.sql`.
4. Run `supabase/patch_district_seed.sql`.
5. Disable email confirmation for development if needed.
6. Add `http://127.0.0.1:5500/**` and `http://localhost:5500/**` to Auth redirect URLs.

Vercel setup:

- Set `SUPABASE_URL`.
- Set `SUPABASE_ANON_KEY`.
- `build.js` generates `js/env.js` during deploy.

## Design System Rules

Use CSS variables from `css/variables.css`; do not hardcode colors when a token exists.

Important tokens:

```css
--color-bg: #1C1B2E;
--color-primary: #F6C19E;
--color-on-primary: #1C1B2E;
--color-success: #7BC67E;
--color-primary-dim: rgba(246,193,158,0.15);
--color-success-dim: rgba(123,198,126,0.15);
--color-surface: #E1F0E3;
--color-white: #FFFFFF;
--color-card-dark: #252240;
--color-card-darker: #201E38;
--color-muted: #8986A8;
--color-border: rgba(255,255,255,0.07);
--color-overlay: rgba(0,0,0,0.65);
--top-bar-height: 56px;
--bottom-nav-height: 60px;
--max-width: 430px;
```

Typography:

- Body: Inter.
- Thai headings: Kanit.
- Base size: 14px.

Layout:

- Mobile-first, max content width 430px, centered.
- Fixed top bar is 56px.
- Fixed bottom nav is 60px.
- Cards use dark surfaces and white text.
- Prefer existing radius tokens: 12px buttons, 16px cards, circular icon avatars where applicable.

## Coding Rules

- Keep the project zero-tooling: plain HTML/CSS/JS.
- Preserve the existing global module pattern: IIFEs or module objects exposed on `window`.
- Load order matters because scripts are classic globals: `env.js`, `config.js`, `utils.js` where needed, Supabase CDN, `supabase-client.js`, then page modules.
- Route all Supabase access through `js/supabase-client.js`.
- Do not call `window.supabase` directly from page modules.
- Use `escapeHtml()` for all DB-sourced, user-sourced, or dynamic strings inserted into `innerHTML`.
- Prefer `textContent`, DOM APIs, or safe attributes when practical.
- Guard nullable app state, map state, DOM nodes, and user/session values.
- Keep Bootstrap usage consistent with the repo: utility classes are fine; custom app shell/nav are hand-built.
- Bootstrap offcanvas is used for notifications and settings; custom bottom sheets are used for map actions.
- Bottom sheets should follow the `app.html` `.bottom-sheet` plus `.bottom-sheet-overlay` pattern.
- Avoid inline styles in new code when a reusable class in `css/components.css`, `css/layout.css`, or `css/map.css` is appropriate. The pulled pages still contain substantial inline page styles and SVG styles; avoid expanding that pattern without a practical reason.
- Comments should explain non-obvious why, not repeat what the code does.

## Security Rules

- Never commit service-role keys, private Supabase credentials, `.env` files, or production-only tokens.
- Never use a Supabase service role key in client code.
- Maintain RLS assumptions: public catalog reads, user-owned writes for profile/progress/captures/artifacts/notifications.
- Validate URLs before inserting into DOM attributes. Existing avatar handling only accepts `https:`.
- Avoid `eval()` and avoid unescaped `innerHTML`.
- Keep Vercel CSP/OAuth/Supabase allowances in mind when adding external assets.

## Testing And Verification

There is no formal test runner in this MVP. For changes:

- Use a static server/Live Server and test the affected page manually.
- Verify mobile width around 375px and the 430px max frame.
- For auth or DB changes, test with valid `js/env.js` and Supabase RLS enabled.
- For map changes, verify Leaflet loads, tiles render, GPS failures degrade gracefully, and bottom sheets remain tappable.
- For onboarding or home-location changes, verify both `onboarding.html` and the in-app home picker use the same `tam_roi_home` localStorage state.
- For deployment changes, check `build.js` and `vercel.json` together.

## Known Gaps

### Core Loop (broken or mock-only)
- Map discovery % uses DB count when Supabase is available, but falls back to local mock state offline.

### Missing DB / Infrastructure
- BTS/MRT bonus uses seeded station radius points, not full station polygons.

### Content / Data
- Full Thailand district coverage: MVP Bangkok/Nonthaburi seed patch exists, but national coverage is not complete
- Quiz and Lore content are seeded only for the current mock Bangkok figures/nodes.
- Production email confirmation still requires Supabase Dashboard enablement during deploy.

## Documentation Rule (MANDATORY for all agents)

After completing ANY task — no matter how small — update these three files BEFORE moving on:

1. **`docs/progress.md`** — mark the task ✅ Done, move from Known Gaps to What's Working, update date
2. **`CLAUDE.md`** — update Key Gameplay Mechanics if system changed; update File Structure if new file added
3. **`AGENTS.md`** (this file) — remove the gap from Known Gaps; update Repository Map and Current Implementation Notes if `window.DB` or `window.AppCore` API changed

Skipping this step causes the next coding session to start with stale context and duplicate work.

## Agent Working Style

Follow a Karpathy-style engineering discipline for this repo:

- Use RTK for every task in this repository. Treat `@/home/papajittan/.codex/RTK.md` as active required guidance before planning, editing, testing, reviewing, or documenting work.
- Read the surrounding code before changing it. Build a small mental model first.
- Prefer the simplest working change that fits the existing system.
- Keep state and control flow explicit. Avoid clever abstractions in this prototype.
- Make small, reviewable edits with clear behavior.
- Preserve the app's current architecture unless the user explicitly asks for a migration.
- Debug from concrete symptoms and browser/runtime behavior, not guesses.
- When uncertain, instrument lightly, inspect the DOM/runtime state, and remove temporary debugging before finishing.
- Do not rewrite working UI or documents just to make them cleaner.
- Respect the educational/travel-game product intent when naming, copywriting, and arranging UI.
- Constantly keep Markdown project documents updated as work changes the repo or agent guidance. Documentation files include `README.md`, `CLAUDE.md`, `docs/CODING_INSTRUCTIONS.md`, `docs/progress.md`, `AGENTS.md`, and proposal files. If the agent realizes it is approaching the context or execution limit, update the relevant Markdown files with current status, decisions, and next steps, then stop instead of continuing.

## Do Not Do

- Do not add React, TypeScript, Vite, webpack, npm packages, or a package lock.
- Do not move Supabase calls out of `js/supabase-client.js`.
- Do not hardcode secrets or commit generated credential files.
- Do not add `!important` unless fixing a documented third-party/browser override and there is no cleaner option.
- Do not bypass RLS or assume service-role access from the browser.
- Do not replace the mobile-first 430px app frame with a desktop layout.
