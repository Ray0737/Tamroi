# AGENTS.md - Tamroi · NSC Prototype 06

> Project guide for Codex and other coding agents. Keep this file aligned with `CLAUDE.md`, `README.md`, `CODING_INSTRUCTIONS.md`, and the current codebase.

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
- `css/variables.css`: authoritative design tokens.
- `css/layout.css`: app wrapper, fixed top bar, bottom nav, tab shell.
- `css/components.css`: buttons, cards, inputs, pills, bottom sheets, badges, toast, collection/missions/leaderboard/lore components.
- `css/map.css`: Leaflet overrides, fog layer, markers, GPS dot, node card.
- `css/animations.css`: shared keyframes and transitions.
- `js/config.js`: reads `window.ENV` and writes `window.APP_CONFIG`.
- `js/env.example.js`: local credential template; copy to `js/env.js`.
- `js/utils.js`: exposes `escapeHtml()`.
- `js/supabase-client.js`: the only place that should call Supabase directly; exposes `window.DB`.
- `js/app.js`: boot, auth guard, tabs, sheets, lore sheets, toast, notifications, top bar; exposes `window.AppCore`.
- `js/map.js`: Leaflet map, inverted fog polygon, watchtowers, support nodes, GPS dot/ring, home location picker, GPS Lore proximity checks.
- `js/collection.js`: figures, artifacts grid, and Lore Journal.
- `js/missions.js`: active mission and daily challenges.
- `js/leaderboard.js`: metric tabs, podium, ranked list.
- `supabase/schema.sql`: schema, seeds, views, and RLS policies.
- `supabase/patch_auth_fix.sql`: robust auth trigger and profile insert policy.
- `supabase/patch_lore.sql`: lore nodes, user lore, quiz questions, score functions/triggers, and seed content.
- `tests/lore-static.test.mjs`: Node static regression check for Lore integration points.

`js/env.js` is gitignored and must never be committed.

## Current Implementation Notes

- The current CSS tokens in `css/variables.css` are authoritative. They differ from older docs: background is `#1C1B2E`, primary is `#F6C19E`, card surfaces are `#252240` / `#201E38`.
- `window.APP_CONFIG.appName` is `Tamroi`, version `0.6.0`.
- The map currently carries mock Bangkok/Nonthaburi district and node data with Supabase fallback/integration.
- The map carries mock Lore nodes with Supabase fallback/integration, checks proximity in the GPS callback, and persists local fallback unlocks in `tam_roi_lore_unlocked`.
- The database seed in `supabase/schema.sql` currently seeds a smaller Bangkok district set than `js/map.js`.
- `js/map.js` gates check-in behind support-node progress, with a Rattanakosin demo shortcut.
- `js/map.js` validates non-localhost Watchtower check-ins within a 500m Haversine radius from the district watchtower/center.
- Home/base district state uses `tam_roi_home`; `js/map.js` migrates the legacy home key if present.
- Real-time GPS uses `navigator.geolocation.watchPosition`; failures should degrade silently and keep the app usable.
- Collection, missions, notifications, and leaderboard use mock fallback data when Supabase calls fail.
- `window.DB` groups `Auth`, `Profiles`, `Districts`, `Figures`, `Artifacts`, `Leaderboard`, `Lore`, `Quiz`, and `Notifications`.
- `window.AppCore` groups `App`, `switchTab`, `openSheet`, `closeAllSheets`, `openLoreSheet`, `openLoreChainSheet`, `showFloatPts`, and `showToast`.

## Development Setup

Local credentials:

```bash
cp js/env.example.js js/env.js
```

Then fill `js/env.js` with the Supabase project URL and anon key. Never commit this file.

Serve locally with VS Code Live Server or a static server from the repo root. There is no npm install step for normal local development.

Supabase first-time setup:

1. Run `supabase/schema.sql`.
2. Run `supabase/patch_auth_fix.sql`.
3. Run `supabase/patch_lore.sql`.
4. Disable email confirmation for development if needed.
5. Add `http://127.0.0.1:5500/**` and `http://localhost:5500/**` to Auth redirect URLs.

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

- Never commit real Supabase credentials, `.env` files, or generated `js/env.js`.
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
- **Support Node visit tracking**: `cafes_visited / otops_visited / landmarks_visited` columns exist but are never incremented by Visit button
- **Support Node gate**: Encounter unlock check not wired — always shows as unlocked in current code
- **C-Class quiz**: modal UI exists but question fetching from DB and capture write are incomplete
- **Legendary Master Quiz**: not implemented — 3-question sequence for S/A figures missing
- **Map discovery %**: currently mock value, not computed from `user_districts`

### Missing DB / Infrastructure
- BTS/MRT ×2 bonus polygon check: not implemented
- Real-time notifications via Supabase Realtime: not implemented

### Content / Data
- Full Thailand district coverage: only Bangkok/Nonthaburi mock data
- Quiz and Lore content are seeded only for the current mock Bangkok figures/nodes.
- Production email-confirmation: disabled for dev, needs re-enable before NSC demo

## Documentation Rule (MANDATORY for all agents)

After completing ANY task — no matter how small — update these three files BEFORE moving on:

1. **`progress.md`** — mark the task ✅ Done, move from Known Gaps to What's Working, update date
2. **`CLAUDE.md`** — update Key Gameplay Mechanics if system changed; update File Structure if new file added
3. **`AGENTS.md`** (this file) — remove the gap from Known Gaps; update Repository Map and Current Implementation Notes if `window.DB` or `window.AppCore` API changed

Skipping this step causes the next coding session to start with stale context and duplicate work.

## Agent Working Style

Follow a Karpathy-style engineering discipline for this repo:

- Read the surrounding code before changing it. Build a small mental model first.
- Prefer the simplest working change that fits the existing system.
- Keep state and control flow explicit. Avoid clever abstractions in this prototype.
- Make small, reviewable edits with clear behavior.
- Preserve the app's current architecture unless the user explicitly asks for a migration.
- Debug from concrete symptoms and browser/runtime behavior, not guesses.
- When uncertain, instrument lightly, inspect the DOM/runtime state, and remove temporary debugging before finishing.
- Do not rewrite working UI or documents just to make them cleaner.
- Respect the educational/travel-game product intent when naming, copywriting, and arranging UI.
- Constantly keep Markdown project documents updated as work changes the repo or agent guidance. Documentation files include `README.md`, `CLAUDE.md`, `CODING_INSTRUCTIONS.md`, `progress.md`, `dev-plan.md`, `AGENTS.md`, and proposal files. Keep `dev-plan-prompt.xml` and the development plan in `dev-plan.md` updated to match the agent's current progress, decisions, blockers, and next steps. If the agent realizes it is approaching the context or execution limit, update the relevant Markdown files, `dev-plan-prompt.xml`, and `dev-plan.md` with current status, decisions, and next steps, then stop instead of continuing.

## Do Not Do

- Do not add React, TypeScript, Vite, webpack, npm packages, or a package lock.
- Do not move Supabase calls out of `js/supabase-client.js`.
- Do not hardcode secrets or commit generated credential files.
- Do not add `!important` unless fixing a documented third-party/browser override and there is no cleaner option.
- Do not bypass RLS or assume service-role access from the browser.
- Do not replace the mobile-first 430px app frame with a desktop layout.
