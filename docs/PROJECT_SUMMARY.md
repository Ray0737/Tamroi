# ตามรอย · Tamroi — Project Summary (Co-op branch)

> **Folder role:** Active co-op development branch. Builds on the expanded solo dataset (26 figures, 20 lore nodes, 47 support nodes) with a full guild/party layer: guilds, collaborative missions, synchronous raid encounters, discussion threads, and a community forum.
> For the solo/base state see the `main`/`Co-op` history before 2026-06-28. For the Next.js/TypeScript production rewrite, see **Website - Tamroi - Round2**.
> Last accurate as of: 2026-07-01

---

## Repository

| | |
|---|---|
| **GitHub (primary)** | https://github.com/Ray0737/Tamroi.git — branch `Co-op` |
| **GitHub (mirror)** | https://github.com/Ray0737/tam_roi.git — branch `main` |
| **Local branch** | `coop`, tracks `origin/Co-op`; both remotes currently point at the same commit |
| **Status** | 🔧 Active development — Phase 1 (solo) + Phase 3 (co-op) complete; see Feature Status below for open gaps |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 IIFEs, no bundler) |
| Map engine | Leaflet.js 1.9.4 + CartoDB Dark Matter tiles |
| GPS | `navigator.geolocation.watchPosition` + Haversine distance gating |
| Auth | Supabase Auth — email/password + Google OAuth |
| Database | Supabase PostgreSQL with Row Level Security |
| Realtime | Supabase Realtime `postgres_changes` (leaderboard, notifications, mission progress) + **Presence** (guild online members, raid lobby) + **Broadcast** (raid quiz sync) |
| Build/deploy | Vercel static + `build.js` env injection |
| Security | `escapeHtml()` XSS guard + Vercel security headers + RLS on every table |
| Tests | Node.js static regression suite (10 test files) + 1 Playwright browser e2e spec |

**Zero tooling for the app itself:** no npm install, no webpack. Run with VS Code Live Server on port 5500. Playwright tests need `npm install` for the `playwright` package.

---

## Folder Structure

```
Website - Tamroi - Coop/
│
├── index.html                  Splash / landing page
├── login.html                  Email + Google OAuth + register flow
├── onboarding.html              First-run: location permission + home district picker
├── app.html                    Main app shell — tabs: Map · Collection · Mission · Leaderboard (+ community/discussion panels)
│
├── build.js / vercel.json      Vercel build + env injection + CSP headers
├── playwright.config.mjs       Browser e2e config (⚠️ hardcoded Linux path, see Known Issues)
│
├── css/                        variables · layout · components · map · animations
│
├── js/
│   ├── env.js / env.example.js / config.js
│   ├── utils.js                escapeHtml() XSS guard
│   ├── supabase-client.js      window.DB — Auth, Profiles, Districts, Figures, Lore, Quiz,
│   │                           Leaderboard, Notifications, Missions, Coop, Raid, Discussion, Community
│   ├── app.js                  window.AppCore — boot, auth guard, tabs, toast, notifications (incl. actionable Accept/Ignore)
│   ├── map.js                  window.MapModule — fog, GPS, watchtowers, support nodes, quiz, capture, guild fog overlay
│   ├── fog-grid.js             window.FogGrid — Thailand 1km grid cell generator
│   ├── collection.js           window.CollectionModule — figures grid, lore journal, era display
│   ├── missions.js             window.MissionsModule — active mission + daily challenges, all real DB (no mocks)
│   ├── leaderboard.js          window.LeaderboardModule — podium, ranked list, Realtime
│   ├── coop.js                 window.CoopModule — collaborative mission cards, GPS check-in (haversine gate), live progress
│   ├── guild.js                window.GuildModule — guild CRUD, invite codes, join requests, presence, announcements, find-group search
│   ├── raid.js                 window.RaidModule — synchronous multiplayer raid: lobby, broadcast quiz, host failover
│   ├── community-forum.js      window.CommunityForumModule — site-wide post/reply/like/flag feed
│   └── discussion.js           window.DiscussionModule — per-figure discussion thread
│
├── supabase/
│   ├── schema.sql                      Base schema: tables, RLS, views, triggers
│   ├── patch_auth_fix.sql              Auth trigger hardening
│   ├── patch_lore.sql                  Lore/support/quiz seed + score trigger
│   ├── patch_district_seed.sql         13 district rows
│   ├── patch_coop.sql                  Guilds, collab missions, raid sessions, discussions (Phase 3 base)
│   ├── patch_coop_fix.sql              guild_join_requests + (superseded) community tables
│   ├── patch_group_management.sql      guilds.announcement column
│   ├── patch_community.sql             Canonical community_posts/community_post_flags
│   ├── patch_community_likes.sql       community_post_likes
│   ├── patch_guild_leader_rls.sql      Fix: leaders weren't visible to non-members (broke join-request notifications)
│   ├── patch_notification_ref.sql      notifications.ref_id — deep-link to source row
│   ├── patch_notifications_rls.sql     Allow cross-user notification INSERT (needed for join requests)
│   ├── patch_era.sql                   figures.era column + seed
│   ├── patch_daily_challenges.sql      daily_challenges + user_daily_progress
│   ├── patch_support_nodes.sql         figures.lat/lng, support_nodes (47 nodes), bts_mrt_stations
│   └── patch_mock_satit.sql            ⚠️ Test-only district/figure/lore/quiz for field test — remove before production
│
├── tests/
│   ├── run-static.mjs                  Runner: node tests/run-static.mjs
│   ├── *-static.test.mjs               String/DOM-presence assertions (lore, district-seed, env-policy, grid-fog,
│   │                                   remaining, prod-readiness, coop) — no browser, no runtime checks
│   └── guild.spec.mjs                  Playwright e2e — mocks window.DB, drives real app.html in a browser
│
└── docs/
    ├── PROJECT_SUMMARY.md         This file
    ├── GAME_LOGIC.md               ⭐ Gameplay loop, design rationale, function-to-game-logic map
    ├── COOP.md                    Co-op feature design (guilds/missions/raids/discussions)
    ├── dev-plan.md / progress.md  Phase tracking — Phase 1 + Phase 3 complete, see progress.md for the latest batch
    ├── VERIFYLOGIC.md             ⚠️ Stale (2026-06-27) — 3 of its 4 open tasks are actually already fixed, see Feature Status
    ├── FUNCTION_LOG.md            Function inventory — mostly current, but overstates lore/quiz content-gating as done
    ├── FUNCTION_AUDIT.md          Phase 1 + Phase 2 audit history
    ├── CODING_INSTRUCTIONS.md     Design system, component patterns
    ├── gps-spoofing.md            GPS anti-cheat notes
    ├── production-smoke.md        Vercel + Supabase smoke-test checklist
    ├── system_architect.md        Architecture overview
    ├── superpowers/               Dated design specs behind COOP.md (coop-mode, coop-community, guild-fog)
    ├── used/                      Archived, already-applied task briefs
    └── proposal/ตามรอย_NSC_2026_v20.md   ⭐ Official NSC 2026 proposal (Thai) — source of truth for game rules
```

---

## Gameplay Loop & Game Logic

> Moved to **[`docs/GAME_LOGIC.md`](GAME_LOGIC.md)** — full solo + co-op gameplay loop, design rationale from the NSC proposal (theories, tier classification, content review pipeline, anti-spoofing, motivation system, roadmap), and the `window.DB` function reference mapped to the game logic each function implements.

---

## Current Data

| Object | Count | Notes |
|---|---|---|
| Districts | 13 | Bangkok (12) + Ayutthaya (1) |
| Figures | 26 | All wired to real Supabase `figures.id`; `era` field seeded via `patch_era.sql` |
| Support nodes | **47** | Up from 40 — expanded by `patch_support_nodes.sql` |
| Lore nodes | 20 | All wired to real `lore_nodes.id` |
| Quiz questions | 164 | Thai MCQ, 4-option; `is_raid_question` flag added for raid mode |
| BTS/MRT stations | 6 | 300m radius bonus zones |
| Mock/test data | +1 district, +1 figure, +1 lore chain (3 nodes), +3 quiz Qs | `patch_mock_satit.sql` — **scoped to a school field test, remove before production** |

---

## Feature Status

### ✅ Working

Fog of War · GPS watchPosition · Watchtower check-in · Support node tracking · S/A encounter gate · Quiz capture (all tiers) · Legacy Score trigger · Archive grid · Lore Journal + proximity · Leaderboard (Realtime) · Notifications (Realtime, actionable) · Seasonal/BTS-MRT bonuses · Active Mission + Daily Challenges (real DB) · Guild create/join/leave/kick/delete/transfer · Invite-code + join-request flow · Guild presence · Guild fog overlay on map · Guild leaderboard (Realtime) · Guild announcements · Collaborative missions with live progress + auto-complete trigger · Raid encounters (lobby/broadcast quiz/host failover) core logic · Discussion threads · Community forum

### ⚠️ Broken / incomplete

| Issue | File | Detail |
|---|---|---|
| Lore/quiz content gating | `js/supabase-client.js` | Missing `.eq('review_status','approved')` and `.not('source_ref','is',null)` on `DB.Lore.getAll()` / `DB.Quiz.getForFigure()` — `FUNCTION_LOG.md` incorrectly marks this as done; `VERIFYLOGIC.md` (stale, 2026-06-27) still has full fix instructions for it |
| Raid map affordance | `js/map.js` | `raid_only` figures aren't yet given a distinct ⚔️ map icon or an "Encounter" button gate — noted as a known gap in `docs/progress.md` |
| Raid notification deep-link | `js/app.js` / `js/raid.js` | Raid-start notification doesn't yet open the raid modal directly |
| Playwright portability | `playwright.config.mjs` | Hardcoded Linux paths (`/home/papajittan/...`) for both the static server root and the `playwright` import — won't run as-is on this Windows machine without editing |
| Mock Satit test data | `supabase/patch_mock_satit.sql` | Field-test-only district/figure/lore/quiz seed; must be removed before production deploy per its own header comment |

### ❌ Out of scope / deferred

PWA offline support · GeoJSON district polygons (currently approximate) · server-side GPS validation (anti-spoofing beyond client haversine, see `docs/gps-spoofing.md`) · cross-guild competition modes · voice chat

---

## Key Tables

| Table | Purpose |
|---|---|
| `profiles` | username, legacy_score, map_discovery, archive_count |
| `districts` / `user_districts` | Watchtower coords, support thresholds, polygon coords, per-user fog + node counters |
| `figures` | name_th/en, class S/A/B/C, era, legacy_pts, district_id, lat/lng, `raid_only`, `raid_min_players` |
| `user_captures` | Captured figures + quiz_score |
| `lore_nodes` / `user_lore` | Lore content (lat/lng/radius/chain_id/review_status) + per-user unlock state |
| `user_support_node_visits` | Deduplicated visit tracking |
| `quiz_questions` | figure_id, Thai question/options, correct answer, `source_ref`, `is_raid_question` |
| `support_nodes` / `bts_mrt_stations` | 47 support nodes + 6 transit bonus stations |
| `leaderboard_legacy` (view) | Solo ranking |
| `guilds` / `guild_members` / `guild_join_requests` / `guild_announcements` | Party system: membership, invite codes, pending requests, leader posts |
| `guild_leaderboard` (view) | Guild ranking (discovery, captures, summed score) |
| `collab_missions` / `collab_mission_checkins` / `collab_mission_completions` | Async group missions + auto-complete trigger |
| `raid_sessions` / `raid_session_members` | Synchronous multiplayer raid state |
| `figure_discussions` / `discussion_flags` | Per-figure comment threads + auto-flag trigger |
| `community_posts` / `community_post_likes` / `community_post_flags` | Site-wide forum |
| `daily_challenges` / `user_daily_progress` | Daily challenge tracking |
| `notifications` | Includes `ref_id` for deep-linking (e.g. to a join request) |

**SQL run order:** `schema.sql` → `patch_auth_fix.sql` → `patch_lore.sql` → `patch_district_seed.sql` → `patch_coop.sql` → `patch_coop_fix.sql` → `patch_group_management.sql` → `patch_community.sql` → `patch_community_likes.sql` → `patch_guild_leader_rls.sql` → `patch_notification_ref.sql` → `patch_notifications_rls.sql` → `patch_era.sql` / `patch_daily_challenges.sql` / `patch_support_nodes.sql` (order-independent) → `patch_mock_satit.sql` (test only, skip in production)

**Key triggers:** `handle_new_user` · `on_capture_update_score` · `increment_legacy_score` · `increment_node_visit` · `check_collab_mission_threshold` (auto-completes collab missions) · `check_discussion_flag_count` (auto-flags at 3 reports)

---

## Quick Reference

| What | Where |
|---|---|
| Gameplay loop + game design logic + function map | `docs/GAME_LOGIC.md` |
| All DB/Auth calls | `js/supabase-client.js` (`window.DB`) |
| Guild / party system | `js/guild.js` |
| Raid encounters | `js/raid.js` |
| Collaborative missions | `js/coop.js` |
| Discussion + community forum | `js/discussion.js`, `js/community-forum.js` |
| Map / fog / GPS / quiz / capture | `js/map.js` |
| Schema + patches | `supabase/schema.sql`, `supabase/patch_*.sql` |
| Co-op feature design | `docs/COOP.md`, `docs/superpowers/` |
| Phase tracking | `docs/dev-plan.md`, `docs/progress.md` |
| Static tests | `tests/run-static.mjs` |
| Browser e2e test | `tests/guild.spec.mjs` (via `playwright.config.mjs`) |
| Game rules (authoritative) | `docs/proposal/ตามรอย_NSC_2026_v20.md` |
