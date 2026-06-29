# CLAUDE.md — Tamroi (ตามรอย) · NSC Prototype 06

> Tamroi · Thailand Gamified Travel App · NSC 2026 · Team ปลามึกยักษ์

---

## Project Context

**Tamroi** is a mobile-first web app for the National Software Contest 2026. Players travel to real Thai districts, check in at landmark Watchtowers to clear Fog of War, and capture historical figures by visiting local outposts. The app is currently in **Phase 1 (Web MVP)** — no native mobile code, no React, no build tooling.

**Primary User:** Tourist / traveler, age 20–30  
**Platform:** Mobile web, max content width 430px  
**Language mix:** Thai (UI labels, figure names) + English (code, docs)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 modules) |
| Map | Leaflet.js + CartoDB Dark tiles |
| Backend / Auth | Supabase — PostgreSQL · Auth · Row Level Security |
| Deployment | Vercel (static + Node.js `build.js` for env injection) |

**No npm install, no webpack, no framework.** Serve with VS Code Live Server for local dev.

---

## File Structure

```
├── index.html           Splash / landing
├── login.html           Email + Google OAuth login & register
├── onboarding.html      First-run: location permission + home district picker
├── app.html             Main app shell — Map · Collection · Mission · Leaderboard
├── build.js             Vercel build — injects Supabase env vars at deploy time
├── vercel.json          Deployment config + security headers
├── css/
│   ├── variables.css    Design tokens (DO NOT override these inline)
│   ├── layout.css       Top bar, bottom nav, tab shell
│   ├── components.css   Buttons, cards, inputs, bottom sheets, badges
│   ├── map.css          Leaflet overrides, fog layer, markers, GPS dot
│   └── animations.css   Keyframes
├── js/
│   ├── config.js        Reads window.ENV → window.APP_CONFIG
│   ├── env.js           Public Supabase anon config for local/static runtime
│   ├── env.example.js   Credential template for resetting env.js
│   ├── utils.js         escapeHtml() — always use for user-visible strings
│   ├── supabase-client.js  All DB & Auth calls live here
│   ├── app.js           Boot · auth guard · tab navigation · notifications
│   ├── map.js           Leaflet · Fog of War · watchtowers · GPS dot · Lore proximity
│   ├── fog-grid.js      Reusable Thailand grid Fog helper exposed as window.FogGrid
│   ├── collection.js    Figures + artifacts grid · Lore Journal
│   ├── missions.js      Active quest + daily challenges
│   └── leaderboard.js   Podium + rank list
└── supabase/
    ├── schema.sql        Full DB schema + Bangkok district seed data
    ├── patch_auth_fix.sql Auth trigger fix + RLS INSERT policy
    ├── patch_lore.sql    Lore/support-node visit/quiz tables + legacy score trigger
    └── patch_district_seed.sql MVP district seed parity with map.js
└── docs/
    ├── CODING_INSTRUCTIONS.md Design system and implementation rules
    ├── dev-plan.md      Phase 1 development plan
    ├── dev-plan-prompt.xml Planning prompt and task history
    ├── progress.md      Current implementation progress
    ├── production-smoke.md Supabase/Vercel smoke-test checklist
    ├── App Plan.md      High-level feature planning
    ├── FUNCTION_AUDIT.md   Function-by-function audit vs. NSC proposal
    ├── VERIFYLOGIC.md   Game logic, rules, and verification status
    ├── PROJECT_SUMMARY.md  Project overview
    ├── system_architect.md System architecture notes
    ├── refactor.md      Refactor notes and decisions
    ├── tamroi_project_context.md Full project context document
    └── proposal/
        └── tam_roi_nsc_proposal.md NSC proposal (ตามรอย_NSC_2026)
└── tests/
    ├── lore-static.test.mjs Static regression check for Lore integration
    ├── remaining-static.test.mjs Static regression check for gameplay loop work
    ├── prod-readiness-static.test.mjs Static regression check for deploy readiness
    ├── district-seed-static.test.mjs Static regression check for DB/map district parity
    ├── env-policy-static.test.mjs Static regression check for tracked env policy
    ├── grid-fog-static.test.mjs Static regression check for window.FogGrid
    └── run-static.mjs One-command static regression suite runner
```

**`js/env.js` is trackable in this prototype.** Keep it limited to public Supabase anon/dev-safe values. Never put service-role keys or private credentials in client code.

---

## Design System

### Colors (use CSS variables only — never hardcode hex)

```css
--color-bg:        #2B2D35  /* Dark Charcoal — page background */
--color-primary:   #FF7E55  /* Vibrant Orange — CTA, active tab, S-Class */
--color-success:   #7BC67E  /* Sage Green — captured markers, progress */
--color-surface:   #E1F0E3  /* Pale Mint — secondary cards, cleared zones */
--color-white:     #FFFFFF  /* Primary text on dark, card bodies */
--color-card-dark: #33363F  /* Elevated dark cards */
--color-muted:     #9DA3AE  /* Secondary text, disabled states */
```

### Typography

- Body: `Inter` (400/500/600/700)
- Thai headings: `Kanit` (400/600/700)
- Base size: 14px

### Layout Rules

- Max content width: **430px**, centered, `margin: 0 auto`
- Fixed top bar: **56px**
- Fixed footer nav: **60px**
- Content padding: `padding-top: 56px; padding-bottom: 60px`
- Card border-radius: **16px** | Button: **12px** | Icon circles: **50%**
- Shadow: `0 4px 20px rgba(0,0,0,0.25)`
- All cards: `var(--color-card-dark)` bg + `var(--color-white)` text

---

## Code Conventions

### Agent Workflow

- **RTK**: Use `rtk` for every shell command in this repo (git, node, find, etc.). The hook rewrites commands automatically; invoke directly when needed. See `~/.claude/RTK.md`.
- **Haiku for context lookups**: Use `claude-haiku-4-5-20251001` (via the `Explore` subagent or Agent tool with `model: "haiku"`) for any task that is purely read-only research — finding files, grepping for symbols, reading docs, answering "where is X defined". Reserve the main model for writing and decision-making.
- **Ponytail**: Default working mode is ponytail full. Shortest diff that solves the problem. No speculative features, no unrequested abstractions. Stop at the first rung of the ladder that holds.
- **Caveman**: Default communication mode. Terse prose — one sentence max per update. No essays, no summaries, no narration. Code first, explanation only if non-obvious.
- **Karpathy rules** (applied in order before touching code):
  1. **Think first** — state assumptions explicitly; if multiple interpretations exist, surface them before picking one.
  2. **Simplicity** — minimum code that solves the problem; if it could be 50 lines, don't write 200.
  3. **Surgical** — touch only what the request requires; don't "improve" adjacent code; remove only the dead code YOUR change creates.
  4. **Goal-driven** — define a verifiable success criterion before starting; loop until it passes.

### JavaScript

- All JS is **module pattern** — wrap each file in an IIFE or named module object (e.g., `const MapModule = (() => { ... })()`)
- Use `utils.escapeHtml()` for **every** user-visible string rendered into the DOM
- All Supabase calls go through `supabase-client.js` — never call `supabase` directly from page modules
- `app.js` handles auth guard — other modules can assume the user is authenticated when they run
- Guard against `null` map/user before operating on them

### HTML

- Follow Bootstrap 5.3 class conventions
- No inline styles — use CSS variables via classes or `css/components.css`
- Bottom sheets use the pattern established in `app.html` (`.bottom-sheet` + `.bottom-sheet-overlay`)

### Security

- XSS: always `escapeHtml()` before `innerHTML`
- Credentials: only public Supabase anon config belongs in `js/env.js`; private credentials stay out of client code and repo files
- Supabase: RLS policies enforce per-user data isolation — do not bypass with service key on the client

---

## Local Development Setup

```bash
# 1. Clone
git clone https://github.com/Ray0737/NSC_2026.git
cd NSC_2026

# 2. Check public Supabase config
# js/env.js is tracked; edit only for public anon/dev-safe values

# 3. Serve
# Open with VS Code Live Server (port 5500)
# No npm install or build step needed
```

### Supabase Setup (first time)

1. Create project at supabase.com
2. SQL Editor → run `supabase/schema.sql`
3. SQL Editor → run `supabase/patch_auth_fix.sql`
4. SQL Editor → run `supabase/patch_lore.sql`
5. SQL Editor → run `supabase/patch_district_seed.sql`
6. Authentication → Email → **disable "Confirm email"** for dev
7. Authentication → URL Configuration → add `http://127.0.0.1:5500/**`
8. Settings → API → copy URL + anon key into `js/env.js`

---

## Key Gameplay Mechanics (for context when editing code)

### Fog of War

- Entire map starts covered by a dark inverted polygon (`fogLayer` in `map.js`)
- Check-in at a Watchtower punches a hole in the polygon for that district
- `window.FogGrid` remains as a reusable Thailand grid helper for future fog work; the old `/demo` screenshot route has been removed
- GPS Tolerance Radius: 500m Haversine check before allowing check-in (bypass on localhost)
- Cleared state persists in Supabase `user_districts` (fogged = false)
- On page reload: re-read `user_districts` in `MapModule.init()` and re-punch all holes
- Map Discovery % = (cleared districts / total active) × 100, computed from DB

### Support Node Chain (Phase Lock)

- **C-Class figures**: capturable immediately after check-in + 1-question quiz (no gate)
- **S/A-Class (Legendary)**: LOCKED until Support Node requirements met for that district:
  - `cafes_visited >= 2` → *Local Rumors*
  - `otops_visited >= 1` → *Relic*
  - `landmarks_visited >= 3` → *Historical Knowledge*
- Support Node visit: tap node info card → Visit button → increments counter in `user_districts`
- Exact Support Node visits persist in `user_support_node_visits` with one row per `(user_id, node_id)`, so reloads and second devices cannot double-count the same node
- Progress bars shown per counter while locked; Encounter button appears when all met
- Watchtower fog check-in is independent of support progress; support progress gates only S/A encounters

### Capture Flow

1. Quiz modal fetches question from `quiz_questions` DB table (location-specific)
2. C-Class: 1 question. S/A Master Quiz: 3 questions, all correct required
3. Correct → `INSERT INTO user_captures` → **Supabase DB trigger** auto-updates `profiles.legacy_score`
4. Capture success animation → collection grid re-renders affected card
5. Leaderboard row updates via Supabase Realtime subscription

### Lore System (GPS Proximity)

- Lore nodes: GPS points with `radius_m` field (not district-wide)
- `haversineDistance()` helper checks user position vs each lore node on every GPS update
- Entering radius → Lore unlock bottom sheet (Thai narrative, optional image/audio)
- Persisted in `user_lore` table; `lore_pts` added client-side to `profiles.legacy_score`
- Saved/unlocked lore places render as tappable map icons; tapping one reopens the lore sheet in saved/read-only state without awarding points again
- **Multi-site chains**: 3 nodes share `chain_id`; completing all 3 → consolidated story + 50 bonus pts
- **Lore Journal**: Collection tab → Journal filter pill; chains show progress (e.g. 2/3 parts)

### Scoring

- C-Class figure captured: ~50 pts (via DB trigger on `user_captures`)
- S-Class/Legendary: up to 500 pts (King Taksin = 500) (via DB trigger)
- Lore node unlocked: defined per node in `lore_nodes.lore_pts` (client-side write)
- Lore chain complete bonus: +50 pts
- BTS/MRT transport bonus: ×2 points multiplier on check-in
- Current BTS/MRT MVP uses seeded station-radius points, not full rail polygons
- Leaderboard metrics: Map Discovery % · Archive count · Legacy Score
- Real-time leaderboard: Supabase Realtime subscription on `profiles` table
- Real-time notifications: Supabase Realtime subscription on `notifications` inserts updates the badge/offcanvas

### New DB Tables / Patches (add via `supabase/patch_lore.sql`)

| Table / Object | Purpose |
|---|---|
| `lore_nodes` | GPS lore points with radius, content, chain info |
| `user_lore` | Which lore nodes user has unlocked (RLS: own rows) |
| `user_support_node_visits` | Exact Support Node IDs visited by each user; unique per `(user_id, node_id)` |
| `quiz_questions` | Location-specific MCQ questions per figure (public SELECT) |
| `on_capture_update_score` trigger | Auto-updates `profiles.legacy_score` on `user_captures` insert |

### Runtime APIs Added

- `window.DB.Lore`: `getAll()`, `getUserUnlocked(userId)`, `unlock(userId, loreId)`
- `window.DB.Quiz`: `getForFigure(figureId, count)`
- `window.DB.Districts.getVisitedSupportNodes(userId)`: returns persisted Support Node IDs for reload-safe visit dedupe
- `window.DB.Districts.updateNodeVisit(userId, districtId, nodeType, nodeId)`: records exact node visit and idempotently increments district support counters
- `window.DB.Profiles.addLegacyPoints(userId, pts)`: lore-only score increment
- `window.DB.Leaderboard.subscribe(callback)`: wrapped Supabase Realtime subscription
- `window.DB.Notifications.subscribe(userId, callback)`: live notification inserts
- `window.AppCore.openLoreSheet(node)` and `openLoreChainSheet(chain)`: lore bottom sheets
- `window.AppCore.showToast(message)`: app-level toast for check-in distance errors

---

## What to Avoid

- Do not add npm dependencies or a build step — this is intentionally zero-tooling
- Do not use `eval()` or `innerHTML` with unescaped strings
- Do not commit service-role keys, private Supabase credentials, `.env` secrets, or production-only tokens
- Do not add `!important` to CSS — use the variable system instead
- Do not write comments explaining what code does — only write them for non-obvious WHY
- Do not call Supabase outside of `supabase-client.js`
