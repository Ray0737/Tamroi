# ตามรอย · Tamroi — Project Summary (Edited / main branch)

> **Folder role:** Current active development version. Same HTML5/Bootstrap/Vanilla JS stack as the base prototype, but with a fully expanded dataset (26 figures, 20 lore nodes, 40 support nodes), all IDs wired to real Supabase rows, and the B-class tier added.
> For the full Next.js/TypeScript production rewrite, see **Website - Tamroi - Round2**.
> Last accurate as of: 2026-06-27

---

## Repository

| | |
|---|---|
| **GitHub** | https://github.com/Ray0737/Tamroi.git |
| **Branch** | `main` |
| **Status** | 🔧 Active development — core loop complete; 4 open tasks remain (see VERIFYLOGIC.md) |

All three Tamroi folders share the same repo. Branch mapping:
- `base` → Website - Tamroi (original prototype, small seed)
- `main` → this folder (expanded data, all 26 figures wired to real Supabase)
- `refactored-2` → Website - Tamroi - Round2 (Next.js/TypeScript full rewrite)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 IIFEs, no bundler) |
| Map engine | Leaflet.js 1.9.4 + CartoDB Dark Matter tiles |
| GPS | `navigator.geolocation.watchPosition` + Haversine |
| Auth | Supabase Auth — email/password + Google OAuth |
| Database | Supabase PostgreSQL with Row Level Security |
| Realtime | Supabase Realtime — leaderboard + notifications |
| Build/deploy | Vercel static + `build.js` env injection |
| Security | `escapeHtml()` XSS guard + Vercel security headers |
| Tests | Node.js static regression suite (6 test files) |

**Zero tooling:** no npm install, no webpack. Run with VS Code Live Server on port 5500.

---

## Folder Structure

```
Website - Tamroi - Edited/      ← main branch root
│
├── index.html                  Splash / landing page (animated blob, CTA)
├── login.html                  Email + Google OAuth + register flow
├── onboarding.html             First-run: location permission + home district picker
├── app.html                    Main app shell — 4 tabs: Map · Collection · Mission · Leaderboard
│
├── build.js                    Vercel build: injects SUPABASE_URL + SUPABASE_ANON_KEY into env.js
├── vercel.json                 Vercel config: static build + CSP/security headers
│
├── README.md                   Setup guide (local dev, Supabase, Vercel)
├── AGENTS.md                   Agent coding rules, repository map, known gaps
├── CLAUDE.md                   Claude Code project guide
│
├── css/
│   ├── variables.css           All --color-* design tokens + Google Fonts import
│   ├── layout.css              Top bar (56px), bottom nav (60px), tab shell, desktop frame
│   ├── components.css          Buttons, cards, inputs, bottom sheets, badges, rarity chips
│   ├── map.css                 Leaflet overrides, fog, markers (S/A/B/C), GPS dot, node card
│   └── animations.css          Keyframes: fog-clear, badgePulse, floatY, locationPulse
│
├── js/
│   ├── env.js                  Public Supabase URL + anon key (tracked, dev-safe)
│   ├── env.example.js          Credential reset template
│   ├── config.js               window.ENV → window.APP_CONFIG
│   ├── utils.js                escapeHtml() — required for all innerHTML (XSS guard)
│   ├── supabase-client.js      window.DB — ALL Supabase DB + Auth calls live here
│   ├── app.js                  window.AppCore — boot, auth guard, tabs, toast, lore sheets, notifications
│   ├── map.js                  window.MapModule — fog, GPS, watchtowers, support nodes, quiz, capture
│   ├── fog-grid.js             window.FogGrid — Thailand 1km grid cell generator
│   ├── collection.js           window.CollectionModule — figures grid (S/A/B/C filter), lore journal
│   ├── missions.js             window.MissionsModule — active mission (❌ MOCK), daily (❌ MOCK), seasonal ✅
│   └── leaderboard.js          window.LeaderboardModule — podium, ranked list, Realtime subscription
│
├── supabase/
│   ├── schema.sql              Full schema: all tables, RLS policies, views, triggers
│   ├── patch_auth_fix.sql      Auth trigger hardening (run after schema.sql)
│   ├── patch_lore.sql          Lore nodes, support nodes, quiz questions, score trigger
│   └── patch_district_seed.sql 13 district rows matching map.js DISTRICT_CONFIG constants
│
├── tests/
│   ├── run-static.mjs                    Test runner: node tests/run-static.mjs
│   ├── lore-static.test.mjs              Lore node IDs match Supabase
│   ├── remaining-static.test.mjs         Support nodes, BTS/MRT, Realtime
│   ├── prod-readiness-static.test.mjs    Production readiness checks
│   ├── district-seed-static.test.mjs     SQL seed ↔ map.js district parity
│   ├── env-policy-static.test.mjs        Public anon key policy
│   └── grid-fog-static.test.mjs          window.FogGrid helper
│
└── docs/
    ├── PROJECT_SUMMARY.md         This file
    ├── VERIFYLOGIC.md             ⭐ Primary agent task board — open tasks + implementation instructions
    ├── FUNCTION_LOG.md            All functions: purpose, Supabase tables, ✅/⚠️/❌ status
    ├── FUNCTION_AUDIT.md          Phase 1 + Phase 2 audit history
    ├── CODING_INSTRUCTIONS.md     Design system, component patterns, layout rules
    ├── production-smoke.md        Vercel + Supabase smoke-test checklist
    ├── system_architect.md        Architecture overview
    └── proposal/
        └── ตามรอย_NSC_2026_v20.md  ⭐ Official NSC 2026 proposal (Thai, 993 lines) — source of truth
```

---

## Design Tokens (`css/variables.css`)

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#1C1B2E` | Deep indigo background |
| `--color-primary` | `#F6C19E` | Warm peach — CTA, active tab, S-Class |
| `--color-success` | `#7BC67E` | Sage green — captured, progress |
| `--color-card-dark` | `#252240` | Elevated card surfaces |
| `--color-muted` | `#8986A8` | Secondary text, inactive |

**Layout:** max-width 430px · fixed top bar 56px · fixed bottom nav 60px

---

## Gameplay Loop

```
Travel to district → Watchtower check-in (500m GPS gate) → fog clears
 → GPS proximity → Lore narration unlocks (80–150m)
 → visit Support Nodes: 2 cafés + 1 OTOP + 3 landmarks per district
 → gate lifts for S/A figures → Legendary Encounter
 → Quiz: B/C = 1Q · S/A = 3Q all correct → figure captured
 → DB trigger adds Legacy Points → leaderboard rank up
```

### Figure class system (all 4 tiers: S / A / B / C)

| Class | Unlock | Legacy Points |
|---|---|---|
| **S-Class** | Support-node gate + 3-question quiz | 500 |
| **A-Class** | Support-node gate + 3-question quiz | 200 |
| **B-Class** | 1-question quiz only (no support gate) | 100 |
| **C-Class** | 1-question quiz | 50 |

---

## Current Data (expanded real dataset)

| Object | Count | Notes |
|---|---|---|
| Districts | 13 | Bangkok (12) + Ayutthaya (1) |
| Figures | **26** | All wired to real Supabase `figures.id` values |
| Support nodes | **40** | All have real `node_id` for deduplication |
| Lore nodes | **20** | All wired to real `lore_nodes.id` values |
| Quiz questions | **164** | Thai MCQ, 4-option, mapped to real `figure_id` values |

---

## `window.DB` API — `js/supabase-client.js`

All Supabase calls route through `window.DB`. Feature modules never call `supabase` directly.

| Method | Tables | Status |
|---|---|---|
| `DB.Auth.*` | auth.users | ✅ |
| `DB.Profiles.get(userId)` | profiles | ✅ |
| `DB.Profiles.addLegacyPoints(userId, pts)` | profiles | ✅ |
| `DB.Districts.getAll()` | districts | ✅ |
| `DB.Districts.getUserState(userId)` | user_districts | ✅ |
| `DB.Districts.checkin(userId, districtId)` | user_districts | ✅ |
| `DB.Districts.updateNodeVisit(userId, districtId, type, nodeId)` | user_support_node_visits, user_districts | ✅ |
| `DB.Figures.getAll()` | figures | ✅ |
| `DB.Figures.capture(userId, figureId)` | user_captures | ✅ |
| `DB.Lore.getNodes()` | lore_nodes | ⚠️ Missing `review_status` + `source_ref` filter |
| `DB.Lore.unlock(userId, nodeId)` | user_lore | ✅ |
| `DB.Quiz.getQuestion(figureId)` | quiz_questions | ⚠️ Missing `source_ref` filter |
| `DB.Leaderboard.get()` | leaderboard_legacy | ✅ |
| `DB.Notifications.getAll(userId)` | notifications | ✅ |
| `DB.Missions.getActiveMission(userId)` | — | ❌ Not built yet (Task A) |
| `DB.Missions.getDailyChallenges(userId)` | — | ❌ Not built yet (Task B) |

---

## Feature Status

### ✅ Working

Fog of War · GPS watchPosition · Watchtower check-in (500m) · Support node tracking (DB) · S/A encounter gate · B/C quiz capture · S/A 3-question capture · Legacy Score (DB trigger) · Map stats pill · Archive figure grid · Lore Journal + chains · Lore proximity (all 20 nodes) · Leaderboard (Realtime) · Notifications (Realtime) · Seasonal date bonuses · BTS/MRT ×2 bonus · All 26 figures / 20 lore nodes / 40 support nodes wired to real Supabase IDs

### ⚠️ Broken — needs fix

| Fix | File | Issue |
|---|---|---|
| Fix 1 — `era` field | `js/collection.js` `showDetail()` | Shows raw `district_id` slug not a human-readable era |
| Fix 2 — Quiz fail state | `js/map.js` `submitQuizAnswer()` | Wrong answer does nothing; no feedback shown |
| Fix 3 — `review_status` filter | `js/supabase-client.js` | Missing `.eq('review_status','approved')` on lore queries |
| Fix 4 — `source_ref` gate | `js/supabase-client.js` | Missing `.not('source_ref','is',null)` on lore + quiz queries |

### ❌ Not yet built

| Task | File | What's needed |
|---|---|---|
| Task A — Active Mission | `js/missions.js` | Replace `MOCK_ACTIVE` with real `DB.Missions.getActiveMission()` |
| Task B — Daily Challenges | `js/missions.js` | `daily_challenges` + `user_daily_progress` tables; replace `MOCK_DAILY` |
| Task C — Lore read depth | `js/app.js` | Track ≥30s open time + ≥70% scroll before counting as "read" |
| Task D — Account deletion | Settings offcanvas | PDPA §2.7 — confirm modal → delete all user rows → sign out |

See **`docs/VERIFYLOGIC.md`** for full step-by-step code instructions for each task above.

---

## Key Tables

| Table | Purpose |
|---|---|
| `profiles` | username, legacy_score, map_discovery, archive_count |
| `districts` | name_th/en, watchtower coords, support thresholds, polygon_coords |
| `figures` | name_th/en, class S/A/B/C, legacy_pts, district_id, description |
| `user_districts` | per-user fog state + cafes/otops/landmarks counters |
| `user_captures` | captured figures + quiz_score |
| `lore_nodes` | lat/lng, radius_m, content, chain_id, **review_status** |
| `user_lore` | unlocked lore per user |
| `user_support_node_visits` | deduplicated visit tracking per node |
| `quiz_questions` | figure_id, question_th, A–D options, correct_option, **source_ref** |
| `leaderboard_legacy` | VIEW: RANK() over legacy_score / map_discovery / archive_count |

**SQL run order:** `schema.sql` → `patch_auth_fix.sql` → `patch_lore.sql` → `patch_district_seed.sql`

**Key triggers:** `handle_new_user` (profile on signup) · `on_capture_update_score` (legacy_pts + archive_count) · `increment_legacy_score(userId, pts)` · `increment_node_visit(userId, districtId, type, nodeId)`

---

## Quick Reference

| What | Where |
|---|---|
| All DB/Auth calls | `js/supabase-client.js` (`window.DB`) |
| Map / fog / GPS / quiz / capture | `js/map.js` |
| Theme tokens | `css/variables.css` |
| Schema | `supabase/schema.sql` |
| Lore / quiz / triggers | `supabase/patch_lore.sql` |
| Open task instructions | `docs/VERIFYLOGIC.md` |
| Function inventory | `docs/FUNCTION_LOG.md` |
| Game rules (authoritative) | `docs/proposal/ตามรอย_NSC_2026_v20.md` |
