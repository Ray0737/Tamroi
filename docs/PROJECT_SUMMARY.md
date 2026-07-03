# ตามรอย · Tamroi — Project Summary (Co-op branch)

> **Folder role:** Active co-op development branch. Full guild/party layer (guilds, collaborative missions, synchronous raid encounters, discussion threads, community forum) on top of the solo prototype.
> ⚠️ **The production content dataset (figures/lore/support nodes) is NOT reproducible from this repo's committed SQL files** — the live Supabase project holds a much larger dataset (72 figures) than any committed seed file creates (schema.sql's toy 7-figure example is the only figure INSERT in git history). See "Current Data" below.
> For the solo/base state see the `main`/`Co-op` history before 2026-06-28. For the Next.js/TypeScript production rewrite, see **Website - Tamroi - Round2**.
> Last accurate as of: 2026-07-03 (cross-checked directly against the live Supabase project, not just committed files)

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
│   ├── patch_era.sql                   ⚠️ Never applied live — figures.era column doesn't exist on the DB, see Feature Status
│   ├── patch_daily_challenges.sql      daily_challenges + user_daily_progress
│   ├── patch_support_nodes.sql         figures.lat/lng, support_nodes (51 nodes live), bts_mrt_stations
│   ├── patch_mock_satit.sql            ⚠️ Test-only district/figure/lore/quiz for field test — kept intentionally, not scheduled for removal
│   ├── patch_fix_user_fk.sql           Re-points user_id FKs (community_posts, figure_discussions, discussion_flags,
│   │                                   collab_mission_checkins, raid_session_members) from auth.users → profiles(id)
│   ├── patch_guild_description.sql     guilds.description column
│   ├── patch_prepost.sql               Lore pre/post-test schema + 16 seeded questions — ⚠️ file still has 4 dead
│   │                                   questions using lore IDs that don't exist live (fixed directly on the DB, not in git)
│   ├── patch_remove_rama.sql           ❌ Dead/no-op — targets figure id 'rama-i', which never matched the live dataset
│   ├── patch_remove_all_rama.sql       ❌ Dead/no-op — targets 'rama-ii'..'rama-ix', same mismatch
│   ├── patch_remove_rama_kings_fixed.sql  ✅ The one that actually worked — targets the real fig-s-NN ids; all 9 Rama
│   │                                   kings (I–IX) are confirmed removed live
│   ├── patch_guild_announcements_fk.sql   Fixes guild_announcements.posted_by → profiles(id) FK (was missing;
│   │                                   announcements could be posted but never read back — PostgREST embed failed)
│   └── patch_join_request_leader_delete.sql  Adds the missing leader DELETE policy on guild_join_requests — without
│                                       it, approving/rejecting a request added the member but left the request stuck
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
    ├── coop-features-backlog.md   Player-perspective co-op feature ideas, prioritized (guild expedition log, rally
    │                              pin, territory claiming, raid LFG, role-split raids, relay missions)
    ├── pre-post_test_plan.md      Formal pretest/posttest measurement plan (IMI, learning outcome, SUS, etc.)
    ├── superpowers/               Dated design specs behind COOP.md (coop-mode, coop-community, guild-fog)
    ├── used/                      Archived, already-applied task briefs
    └── proposal/ตามรอย_NSC_2026_v20.md   ⭐ Official NSC 2026 proposal (Thai) — source of truth for game rules
```

---

## Gameplay Loop & Game Logic

> Moved to **[`docs/GAME_LOGIC.md`](GAME_LOGIC.md)** — full solo + co-op gameplay loop, design rationale from the NSC proposal (theories, tier classification, content review pipeline, anti-spoofing, motivation system, roadmap), and the `window.DB` function reference mapped to the game logic each function implements.

---

## Current Data

**Verified live against the Supabase project on 2026-07-03** (not just read from committed SQL — the actual production dataset is bigger than any file in this repo creates):

| Object | Count | Notes |
|---|---|---|
| Districts | 14 | 13 real + `satit_test` (mock field-test district) |
| Figures | **72** | S:11 · A:20 · B:21 (20 real + 1 mock) · C:20. IDs follow `fig-{class}-{NN}` (e.g. `fig-a-07`); the base INSERT for this set is not in git — only patches that reference/update these ids (`patch_era.sql`, `patch_support_nodes.sql`, `patch_remove_rama_kings_fixed.sql`) are committed |
| Support nodes | 51 | Up from the 47 documented previously |
| Lore nodes | 23 | Up from 20 |
| Quiz questions | 171 | Thai MCQ, 4-option; `is_raid_question` flag for raid mode, `lore_id`/`assessment_type` columns for pre/post-test |
| BTS/MRT stations | 6 | 300m radius bonus zones |
| King Rama figures | **0** | All 9 (Rama I–IX) confirmed removed — see Feature Status for the fix history |
| Mock/test data | 1 district, 1 figure, lore chain, quiz Qs | `patch_mock_satit.sql` — kept intentionally for a school field test, not scheduled for removal |

---

## Feature Status

### ✅ Working

Fog of War · GPS watchPosition · Watchtower check-in · Support node tracking · S/A encounter gate · Quiz capture (all tiers) · Legacy Score trigger · Archive grid (class-sorted S→A→B→C, "Owned" filter) · Lore Journal + proximity · Pre/post-test knowledge check on Lore entries (`docs/pre-post_test_plan.md`) · Leaderboard (Realtime, flattened plain-row style, no more duplicate podium) · Notifications (Realtime, actionable, plain Bootstrap icons) · Seasonal/BTS-MRT bonuses · Active Mission + Daily Challenges (real DB) · Guild create/join/leave/kick/delete/transfer · Invite-code + join-request flow (now correctly clears on approve/reject, see fixes below) · Guild presence · Guild fog overlay on map · Guild leaderboard (Realtime) · Guild announcements (now actually readable after the FK fix below) · Collaborative missions with live progress + auto-complete trigger · Raid encounters (lobby/broadcast quiz/host failover, distinct ⚔️ map marker, notification deep-link) · Discussion threads · Community forum · Profile pictures propagated across leaderboard/guild/raid UI

### ✅ Fixed this session (real bugs found and resolved)

| Issue | Fix | Detail |
|---|---|---|
| Guild join requests stuck as "pending" forever | `patch_join_request_leader_delete.sql` | `guild_join_requests` only had a DELETE policy for the requester canceling their own request — no policy let the **leader** delete someone else's request on approve/reject. Supabase RLS silently filters instead of erroring, so the member got added but the request row never cleared. Confirmed live and one stale request manually cleaned up |
| Guild announcements postable but never readable | `patch_guild_announcements_fk.sql` | `guild_announcements.posted_by` had no FK to `profiles`, and PostgREST needs a real FK to resolve the `profiles(username)` embed — so every read failed even though writes worked fine |
| `community_posts` FK violation for some users | `patch_fix_user_fk.sql` (already existed) + manual backfill | 3 old accounts (incl. one teammate) had auth records but no matching `profiles` row — any FK-to-profiles write (posting, capturing, joining a guild) failed for them. Backfilled the missing profile rows directly |
| Raid figures bypassable via solo quiz | Fixed in `js/map.js` (prior session) | `raid_only` figures previously routed through the normal Legendary Encounter solo quiz, completely skipping the raid requirement |
| Two Rama-removal patches were no-ops | `patch_remove_rama_kings_fixed.sql` | `patch_remove_rama.sql`/`patch_remove_all_rama.sql` targeted figure ids (`rama-i`..`rama-ix`) that never matched the live dataset's actual ids (`fig-s-NN`) — silently deleted 0 rows. All 9 Rama kings are now confirmed actually gone |

### ⚠️ Broken / incomplete

| Issue | File | Detail |
|---|---|---|
| Lore/quiz content gating | `js/supabase-client.js` | Missing `.eq('review_status','approved')` and `.not('source_ref','is',null)` on `DB.Lore.getAll()` / `DB.Quiz.getForFigure()` — `FUNCTION_LOG.md` incorrectly marks this as done; `VERIFYLOGIC.md` (stale, 2026-06-27) still has full fix instructions for it |
| `figures.era` column doesn't exist live | `supabase/patch_era.sql` | Despite being committed and despite docs previously claiming this was fixed, the `era` column was **never actually applied** to the live database — every figure silently falls back to the generic `${class}-Class · district` string in `js/collection.js`. Needs the migration actually run |
| Playwright portability | `playwright.config.mjs` | Hardcoded Linux paths (`/home/papajittan/...`) for both the static server root and the `playwright` import — won't run as-is on this Windows machine without editing |
| Mock Satit test data | `supabase/patch_mock_satit.sql` | Field-test-only district/figure/lore/quiz seed; kept intentionally for now, not scheduled for removal |
| `patch_prepost.sql` seed has 4 dead rows | `supabase/patch_prepost.sql` | Seed data references lore ids (`lore-rattanakosin-wall`, `lore-grand-palace-axis`, `lore-wat-pho-learning`, `lore-silom-trade`, `lore-chatuchak-market`) that don't exist live; the real 16 working questions were inserted directly against the correct ids (`lore-rk-1`, `lore-rk-2`, `lore-silom`, `lore-chatuchak`) on the DB, but the committed file itself is unfixed — a fresh run would silently seed 0 of these 4 |

### ❌ Out of scope / deferred

PWA offline support · GeoJSON district polygons (currently approximate) · server-side GPS validation (anti-spoofing beyond client haversine, see `docs/gps-spoofing.md`) · cross-guild competition modes · voice chat

---

## Key Tables

| Table | Purpose |
|---|---|
| `profiles` | username, legacy_score, map_discovery, archive_count |
| `districts` / `user_districts` | Watchtower coords, support thresholds, polygon coords, per-user fog + node counters |
| `figures` | name_th/en, class S/A/B/C, legacy_pts, district_id, lat/lng, `raid_only`, `raid_min_players` — **no `era` column live**, despite `patch_era.sql` |
| `user_captures` | Captured figures + quiz_score |
| `lore_nodes` / `user_lore` | Lore content (lat/lng/radius/chain_id/review_status) + per-user unlock state |
| `user_support_node_visits` | Deduplicated visit tracking |
| `quiz_questions` | figure_id, Thai question/options, correct answer, `source_ref`, `is_raid_question`, `lore_id`, `assessment_type` (pretest/posttest/capture) |
| `user_lore_assessments` | Pre/post-test scores per user per lore node (`phase`: pre/post) |
| `support_nodes` / `bts_mrt_stations` | 51 support nodes + 6 transit bonus stations |
| `leaderboard_legacy` (view) | Solo ranking |
| `guilds` (incl. `description`) / `guild_members` / `guild_join_requests` / `guild_announcements` | Party system: membership, invite codes, pending requests, leader posts |
| `guild_leaderboard` (view) | Guild ranking (discovery, captures, summed score) |
| `collab_missions` / `collab_mission_checkins` / `collab_mission_completions` | Async group missions + auto-complete trigger |
| `raid_sessions` / `raid_session_members` | Synchronous multiplayer raid state |
| `figure_discussions` / `discussion_flags` | Per-figure comment threads + auto-flag trigger |
| `community_posts` / `community_post_likes` / `community_post_flags` | Site-wide forum |
| `daily_challenges` / `user_daily_progress` | Daily challenge tracking |
| `notifications` | Includes `ref_id` for deep-linking (e.g. to a join request) |

**SQL run order:** `schema.sql` → `patch_auth_fix.sql` → `patch_lore.sql` → `patch_district_seed.sql` → `patch_coop.sql` → `patch_coop_fix.sql` → `patch_group_management.sql` → `patch_community.sql` → `patch_community_likes.sql` → `patch_guild_leader_rls.sql` → `patch_notification_ref.sql` → `patch_notifications_rls.sql` → `patch_era.sql` / `patch_daily_challenges.sql` / `patch_support_nodes.sql` (order-independent) → `patch_fix_user_fk.sql` → `patch_guild_description.sql` → `patch_guild_announcements_fk.sql` → `patch_join_request_leader_delete.sql` → `patch_prepost.sql` (⚠️ fix the 4 dead lore ids first, see Feature Status) → `patch_remove_rama_kings_fixed.sql` (skip the two older `patch_remove_rama*.sql` files — dead/no-op) → `patch_mock_satit.sql` (test only, skip in production)

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
| Co-op feature design | `docs/COOP.md`, `docs/superpowers/`, `docs/coop-features-backlog.md` |
| Phase tracking | `docs/dev-plan.md`, `docs/progress.md` |
| Pre/post-test evaluation plan | `docs/pre-post_test_plan.md` |
| Static tests | `tests/run-static.mjs` |
| Browser e2e test | `tests/guild.spec.mjs` (via `playwright.config.mjs`) |
| Game rules (authoritative) | `docs/proposal/ตามรอย_NSC_2026_v20.md` |
