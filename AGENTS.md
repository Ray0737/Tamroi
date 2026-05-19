# AGENTS.md - Tamroi / Siam Echo · NSC Prototype 06

> Project guide for Codex and other coding agents. Keep this file aligned with `CLAUDE.md`, `README.md`, `CODING_INSTRUCTIONS.md`, and the current codebase.

## Project Context

Tamroi (ตามรอย), also branded in-app as Siam Echo / ลุยไทย, is a mobile-first web MVP for NSC 2026 by team ปลามึกยักษ์. It is an educational travel game for Thai history: players visit real districts, check in at landmark Watchtowers, clear a Fog of War layer, unlock historical figures, collect artifacts, and compete on The High Chronicler leaderboard.

Current phase: Phase 1 Web MVP. There is no native app, no React, no npm workflow, no bundler, and no framework migration in this phase.

Primary user: Thai tourist/traveler, roughly age 20-30. The UI mixes Thai labels/content with English code and docs. The app is designed as a centered mobile web frame with max width 430px.

## Product Mechanics

- Watchtower check-in clears Fog of War for a district     .
- Cleared district state persists through Supabase `user_districts`.
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

- Frontend: HTML5, Bootstrap 5.3 CDN, vanilla JavaScript.
- JavaScript style: browser globals plus module objects/IIFEs, not ES module imports.
- Map: Leaflet.js with CartoDB Dark tiles.
- Backend/auth: Supabase Auth, PostgreSQL, RLS.
- Deployment: Vercel static output with `node build.js` generating `js/env.js`.
- Local dev: VS Code Live Server or any simple static server, usually port 5500.

Do not add npm dependencies, package managers, bundlers, frameworks, or a build step unless the user explicitly changes the project direction.

## Repository Map

- `index.html`: splash / landing page.
- `login.html`: email/password login, register, Google OAuth.
- `onboarding.html`: first-run location permission and home district picker.
- `app.html`: main app shell with Map, Collection, Missions, Leaderboard tabs.
- `build.js`: Vercel build-time env injection into `js/env.js`.
- `vercel.json`: deployment config and security headers.
- `css/variables.css`: authoritative design tokens.
- `css/layout.css`: app wrapper, fixed top bar, bottom nav, tab shell.
- `css/components.css`: buttons, cards, inputs, pills, bottom sheets, badges.
- `css/map.css`: Leaflet overrides, fog layer, markers, GPS dot, node card.
- `css/animations.css`: shared keyframes and transitions.
- `js/config.js`: reads `window.ENV` and writes `window.APP_CONFIG`.
- `js/env.example.js`: local credential template; copy to `js/env.js`.
- `js/utils.js`: exposes `escapeHtml()`.
- `js/supabase-client.js`: the only place that should call Supabase directly; exposes `window.DB`.
- `js/app.js`: boot, auth guard, tabs, sheets, notifications; exposes `window.AppCore`.
- `js/map.js`: Leaflet map, inverted fog polygon, watchtowers, nodes, GPS, home location.
- `js/collection.js`: figures and artifacts grid.
- `js/missions.js`: active mission and daily challenges.
- `js/leaderboard.js`: metric tabs, podium, ranked list.
- `supabase/schema.sql`: schema, seeds, views, and RLS policies.
- `supabase/patch_auth_fix.sql`: robust auth trigger and profile insert policy.

`js/env.js` is gitignored and must never be committed.

## Current Implementation Notes

- The current CSS tokens in `css/variables.css` are authoritative. They differ from older docs: background is `#1C1B2E`, primary is `#F6C19E`, card surfaces are `#252240` / `#201E38`.
- `window.APP_CONFIG.appName` is `Siam Echo`, version `0.6.0`.
- The map currently carries mock Bangkok/Nonthaburi district and node data with Supabase fallback/integration.
- The database seed in `supabase/schema.sql` currently seeds a smaller Bangkok district set than `js/map.js`.
- Collection, missions, notifications, and leaderboard use mock fallback data when Supabase calls fail.
- `window.DB` groups `Auth`, `Profiles`, `Districts`, `Figures`, `Artifacts`, `Leaderboard`, and `Notifications`.
- `window.AppCore` groups `App`, `switchTab`, `openSheet`, `closeAllSheets`, and `showFloatPts`.

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
3. Disable email confirmation for development if needed.
4. Add `http://127.0.0.1:5500/**` and `http://localhost:5500/**` to Auth redirect URLs.

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
--color-surface: #E1F0E3;
--color-white: #FFFFFF;
--color-card-dark: #252240;
--color-card-darker: #201E38;
--color-muted: #8986A8;
--color-border: rgba(255,255,255,0.07);
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
- Route all Supabase access through `js/supabase-client.js`.
- Do not call `window.supabase` directly from page modules.
- Use `escapeHtml()` for all DB-sourced, user-sourced, or dynamic strings inserted into `innerHTML`.
- Prefer `textContent`, DOM APIs, or safe attributes when practical.
- Guard nullable app state, map state, DOM nodes, and user/session values.
- Keep Bootstrap usage consistent with the repo: utility classes are fine; custom app shell/nav are hand-built.
- Bottom sheets should follow the `app.html` `.bottom-sheet` plus `.bottom-sheet-overlay` pattern.
- Avoid inline styles in new code when a reusable class in `css/components.css`, `css/layout.css`, or `css/map.css` is appropriate. Existing files contain inline styles; do not expand that pattern without a practical reason.
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
- For deployment changes, check `build.js` and `vercel.json` together.

## Known Gaps

- Full Thailand district coverage is not implemented; the app currently relies on Bangkok/Nonthaburi mock data plus partial Supabase seeds.
- C-Class quiz flow and backend answer validation still need completion/testing.
- Fog clearing persistence via `user_districts` needs end-to-end verification.
- BTS/MRT x2 transport bonus detection is represented in UI/context but not fully implemented.
- Proximity lore triggers are planned but not complete.
- Production auth/email-confirmation behavior needs QA.
- Vercel production deployment needs env-var smoke testing.

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

## Do Not Do

- Do not modify existing project documents unless the user explicitly asks. Documentation files include `README.md`, `CLAUDE.md`, `CODING_INSTRUCTIONS.md`, `progress.md`, and proposal files.
- Do not add React, TypeScript, Vite, webpack, npm packages, or a package lock.
- Do not move Supabase calls out of `js/supabase-client.js`.
- Do not hardcode secrets or commit generated credential files.
- Do not add `!important` unless fixing a documented third-party/browser override and there is no cleaner option.
- Do not bypass RLS or assume service-role access from the browser.
- Do not replace the mobile-first 430px app frame with a desktop layout.