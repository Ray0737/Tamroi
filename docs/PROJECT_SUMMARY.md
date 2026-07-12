# ตามรอย · Tamroi — Project Summary

> **Folder role:** `Website - Tamroi - Round2` — the active development + production tree. Solo core (Phase 1), Co-op layer (Phase 3), educational features (retrieval practice, debates, jigsaw, pre/post-test), and the July map/capture overhaul are all merged into `main` and deployed on Vercel.
> ⚠️ **The production content dataset (figures/lore/support nodes) is NOT reproducible from this repo's committed SQL files** — the live Supabase project holds a much larger dataset (74 figures) than any committed seed file creates. `docs/Db.md` is the roster snapshot; the live DB is the source of truth.
> Last accurate as of: 2026-07-05 (cross-checked directly against the live Supabase project `NSC`, not just committed files)

---

## Repository

| | |
|---|---|
| **GitHub (dev, primary)** | https://github.com/Ray0737/Tamroi.git — branch `main` |
| **GitHub (release mirror)** | https://github.com/Ray0737/tam_roi.git — branch `main` (README differs; code kept in sync by overwrite-pull) |
| **Status** | 🔧 Active development — all phases merged into `main`; see Feature Status below for open gaps |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 IIFEs, no bundler) |
| Map engine | Leaflet.js 1.9.4 + CartoDB **light** tiles (switched from Dark Matter 2026-07-04) |
| GPS | `navigator.geolocation.watchPosition` + Haversine distance gating |
| Auth | Supabase Auth — email/password + Google OAuth |
| Database | Supabase PostgreSQL with Row Level Security |
| Realtime | Supabase Realtime `postgres_changes` (leaderboard, notifications, mission progress) + **Presence** (guild online members, raid lobby) + **Broadcast** (raid quiz sync) |
| Build/deploy | Vercel static + `build.js` env injection |
| Security | `escapeHtml()` XSS guard + Vercel security headers + RLS on every table |
| Tests | Node.js static regression suite (`tests/run-static.mjs`) + 1 Playwright browser e2e spec |

**Zero tooling for the app itself:** no npm install, no webpack. Run with VS Code Live Server on port 5500.

---

## Current Data

**Verified live against the Supabase project on 2026-07-05:**

| Object | Count | Notes |
|---|---|---|
| Districts | 14 | 13 real + `satit_test` (mock field-test district) |
| Figures | **74** | S:11 · A:20 · B:21 (incl. 1 mock) · C:22 — `fig-c-21`/`fig-c-22` added 2026-07-05 for the C-class proximity-capture pilot |
| Figures without coords | 47 | Render as dashed "?" fallback pins at their district watchtower |
| Support nodes | 51 | Cafés / OTOP / landmarks |
| Lore nodes | 23 | All `review_status = 'approved'` |
| Quiz questions | 173 | Thai MCQ; `assessment_type` = capture / pretest / recall; all approved |
| BTS/MRT stations | 6 | 300m-radius ×2 bonus zones |
| Mock/test data | 1 district, 1 figure, lore chain, quiz Qs | `patch_mock_satit.sql` — kept intentionally for the school field test |

---

## Function Completion, Possible Errors & Security Concerns

> Requested audit view: every functional area, how complete it is, what can realistically go wrong at runtime, and the security exposure. Row-level detail for individual functions lives in `docs/FUNCTION_LOG.md`.

### Solo core

| Area | Completion | Possible errors | Security concerns |
|---|---|---|---|
| Auth + onboarding (`app.js`, `login.html`, `onboarding.html`) | ✅ Complete (incl. PDPA age consent + guidelines acceptance) | OAuth redirect misconfig on new deploy URLs; profile row missing for pre-trigger accounts (has happened — backfilled) | Session token in localStorage (Supabase default); anon key is public by design — RLS is the only barrier |
| Fog of War — district (`map.js buildFogLayer`) | ✅ Complete | **Even-odd trap:** two *overlapping cleared district polygons* would re-fog their intersection (walk-cell overlap is guarded, district-vs-district is not — data constraint: polygons must not overlap) | None (visual layer) |
| Fog of War — walk cells (`_revealWalkCell`) | ✅ Working, ⚠️ device-local | Ignores fixes with accuracy >100m (fixed); storage key bump wiped old trails once | localStorage only — trails shared across accounts on one browser, lost on clear; per-account batched sync planned |
| Watchtower check-in + Encounter Key | ✅ Complete | `checkIn` failure is swallowed (`.catch(() => {})`) — district clears locally but re-fogs on reload if the write failed | GPS trust is client-side; localhost dev bypass must never ship enabled |
| Support Node chain | ✅ Complete | Double-count prevented by unique `(user_id, node_id)` | Client-declared visit — no server-side GPS proof |
| C-class proximity capture | ✅ Complete (pilot: 3 districts) | Marker/circle cleanup verified; capture with stale GPS fix possible within `maximumAge: 5000` | 80m Haversine check is client-side only — spoofable like all GPS gates |
| Quiz + capture (B/A/S) | ✅ Complete | Wrong-answer retry is unlimited (open design question) | **`correct_option` is sent to the client** — answers readable in DevTools before answering |
| Lore (proximity, chains, journal, pre/post-test) | ✅ Complete — `user_lore` persistence bug fixed 2026-07-05 (wrote to nonexistent column; every unlock before that date was silently lost) | DB write failures still only `console.error` — UI shows success regardless | Lore points are **client-side writes** to `profiles.legacy_score` (see Score row) |
| Score + leaderboard | ✅ Complete | Realtime subscription drop = stale board until reload | **Capture points**: safe (DB trigger). **Lore/chain/bonus points**: `DB.Profiles.addLegacyPoints` writes `legacy_score` directly from the client — RLS allows updating your own profile, so a player can inflate their own score from the console. Biggest integrity gap; needs an RPC or trigger |
| Missions / daily challenges / retrieval practice | ✅ Complete | `recall_due_at` timezone edge around midnight; challenge progress writes swallowed on failure | Progress is client-asserted |
| Notifications | ✅ Complete (actionable join requests via `ref_id`) | Realtime drop = badge lag | Cross-user INSERT policy is deliberately open for join-request alerts — content is template-generated, not free text |

### Co-op layer

| Area | Completion | Possible errors | Security concerns |
|---|---|---|---|
| Guilds (CRUD, invite codes, join requests, presence, announcements) | ✅ Complete | Presence flaps on poor connections (online count jitter); historical RLS/FK bugs (stuck requests, unreadable announcements) are fixed | Invite code is 6 chars — brute-forceable in theory; low value target |
| Collaborative missions | ✅ Complete | ⚠️ **No GPS gate on mission check-in** — DB-only, any member can "check in" from home (known deferred gap); mission cards render in 2 places without shared refresh | Same client-trust issue as check-ins generally |
| Raids | ✅ Complete (lobby, broadcast quiz, host failover, ⚔️ marker, notification deep-link) | Broadcast packet loss can desync a question; host failover races if two members leave simultaneously | `DB.Raid.insertCaptures` inserts capture rows for *other participants* from the host's client — RLS must stay tight or a crafted call could award captures to arbitrary users; worth an RLS review |
| Discussions + community forum | ✅ Complete (auto-hide at 3 flags; new-account 24h posting probation; auto-approve on first like) | Flag threshold is gameable by 3 coordinated accounts (both directions) | All rendering goes through `escapeHtml()`; probation trigger is `SECURITY DEFINER` (safe); user content moderation is reactive, not proactive |
| Debates (Unsolved History) | ✅ Complete | Stats RPC returns raw reasons — long/abusive reasons rendered escaped but unmoderated | `get_debate_stats` is `SECURITY DEFINER` — exposes aggregate votes + reasons to any authenticated user by design |
| Jigsaw Learning | ✅ Complete | Chapter assignment assumes stable member list; member leaving mid-jigsaw orphans a chapter | Summaries are user content — escaped on render |

### Cross-cutting security summary (priority order)

1. **Client-side score writes** (`addLegacyPoints`) — self-inflation possible; move lore/bonus scoring into a DB trigger or `SECURITY DEFINER` RPC.
2. **GPS is fully client-trusted** — all distance gates (check-in, support nodes, C-capture, lore) are client Haversine + plausibility heuristics (reject 0m accuracy, >50 m/s jumps). Spoofable with fake-GPS tooling; server-side validation is out of scope for NSC but documented in `docs/gps-spoofing.md`.
3. **Quiz answers shipped to the client** — move correctness checking server-side (RPC) if quiz integrity ever matters competitively.
4. **`DB.Raid.insertCaptures` writes for other users** — audit the `user_captures` INSERT policy.
5. **Silent error swallowing** (`console.error` / empty `.catch`) — hid the lore-persistence bug for weeks; failures should surface a toast at minimum.
6. **XSS posture is good** — `escapeHtml()` consistently used on user strings; keep it mandatory for every new `innerHTML`.
7. **Mock Satit data** still in production DB — intentional for the field test; remove before public launch.

---

## Feature Status

### ✅ Working

Fog of War (district + walk-cell) · GPS watchPosition (accuracy-gated) · Watchtower check-in + Encounter Key · Support node tracking · S/A encounter gate · C-class proximity capture · Quiz capture (all tiers) · Legacy Score trigger · Archive grid (class-sorted, "Owned" filter, captured figures hidden on map) · Lore proximity + chains + journal + pre/post-test + figure cameo on chain completion · Retrieval practice (spaced recall) · Unsolved History debates · Jigsaw Learning · Review-status content gating (enforced client-side since 2026-07-04) · Leaderboard (Realtime) · Notifications (Realtime, actionable) · Seasonal/BTS-MRT bonuses · Guild system (full CRUD + presence + fog overlay + leaderboard + announcements) · Collaborative missions · Raids · Discussions · Community forum (with probation moderation) · PDPA age consent · Settings (username, notifications, GPS status, home district, profile picture) · Light-theme map

### ⚠️ Broken / incomplete

| Issue | Where | Detail |
|---|---|---|
| `figures.era` column doesn't exist live | `supabase/patch_era.sql` | Verified again 2026-07-05: never applied — every figure falls back to the generic "[Class]-Class · district" string. Needs the migration actually run |
| Co-op mission check-in has no GPS gate | `js/coop.js` | DB-only; any member can check in remotely |
| Walk-cell fog is device-local | `js/map.js` | localStorage only; per-account batched sync planned (see proposal §13/§18) |
| Group missions render twice | Mission tab + Guild panel | Same data fetched independently, no shared refresh |
| 47 of 74 figures have no coords | live `figures` table | Fallback "?" pin works, but real placement missing for most of the roster |
| Tier ratio off-target | live `figures` table | 42% gated (S/A) vs 58% ungated (B/C); design target is 20/80 |
| Playwright config not portable | `playwright.config.mjs` | Hardcoded Linux paths |
| `patch_prepost.sql` has 4 dead seed rows | `supabase/` | References lore ids that don't exist live; real questions were inserted directly on the DB |
| Mock Satit test data | `supabase/patch_mock_satit.sql` | Kept intentionally for the school field test |

### ❌ Out of scope / deferred

PWA offline support · precise GeoJSON district polygons · server-side GPS validation · cross-guild competition · voice chat · Historical AI (Gemini) assistant

---

## Key Tables

| Table | Purpose |
|---|---|
| `profiles` | username, legacy_score, avatar, `age_consent_at`, `guidelines_accepted_at` |
| `districts` / `user_districts` | Watchtower coords, support thresholds, polygons, per-user fog + node counters + `has_encounter_key` |
| `figures` | 74 rows; class S/A/B/C, `raid_only`, lat/lng — **no `era` column live** |
| `user_captures` | Captured figures + quiz score (score trigger fires here) |
| `lore_nodes` / `user_lore` | Lore content + per-user unlocks (**column is `lore_node_id`**, not `lore_id`) + `recall_due_at` |
| `user_lore_assessments` | Pre/post-test scores (`phase`: pre/post) |
| `user_support_node_visits` | Deduplicated visit tracking |
| `quiz_questions` | 173 rows; `assessment_type`, `review_status`, `is_raid_question`, `lore_id` |
| `support_nodes` / `bts_mrt_stations` | 51 nodes + 6 transit bonus stations |
| `guilds` / `guild_members` / `guild_join_requests` / `guild_announcements` | Party system |
| `guild_leaderboard` / `leaderboard_legacy` (views) | Rankings |
| `collab_missions` / `collab_mission_checkins` / `collab_mission_completions` | Group missions + auto-complete trigger |
| `raid_sessions` / `raid_session_members` | Synchronous raid state |
| `figure_discussions` / `discussion_flags` | Per-figure threads + auto-flag trigger |
| `community_posts` (incl. `pending_approval`) / `community_post_likes` / `community_post_flags` | Forum + probation moderation |
| `history_debates` / `debate_votes` | Unsolved History |
| `guild_jigsaw_assignments` | Jigsaw chapters + summaries |
| `daily_challenges` / `user_daily_progress` | Daily challenges + recall missions |
| `notifications` | `ref_id` deep-links |

**SQL run order:** see `CLAUDE.md` → "Supabase Setup" (canonical, kept current). Recent additions run last: `patch_review_status.sql` → `patch_child_safety.sql` → `patch_encounter_key.sql` → `patch_c_class_proximity.sql`.

---

## Quick Reference

| What | Where |
|---|---|
| Gameplay loop + mechanics (player-facing) | `docs/GAME_LOGIC.md` |
| Function inventory (per-function status) | `docs/FUNCTION_LOG.md` |
| Figure roster snapshot | `docs/Db.md` |
| Phase tracking | `docs/progress.md` |
| Co-op feature design (archived — shipped 2026-06-28) | `docs/superpowers/specs/2026-06-28-coop-design.md` |
| Figure bio + relation graph design (archived — shipped 2026-07-05) | `docs/superpowers/specs/2026-07-05-figure-bio-graph-plan.md` |
| Jigsaw v2 design (shipped 2026-07-09) | `docs/superpowers/specs/2026-07-09-jigsaw-v2-design.md` |
| GPS anti-cheat notes | `docs/gps-spoofing.md` |
| Pre/post-test evaluation plan | `docs/pre-post_test_plan.md` |
| Smoke-test checklist | `docs/production-smoke.md` |
| Architecture overview | `docs/system_architect.md` |
| Design system | `CLAUDE.md` → "Design System" |
| SQL run order | `CLAUDE.md` → "Supabase Setup" |
| All DB/Auth calls | `js/supabase-client.js` (`window.DB`) |
| Static tests | `node tests/run-static.mjs` |
| Game rules (authoritative) | `docs/proposal/ตามรอย_NSC_2026_v20.md` (+ v29 docx) |

> `docs/CODING_INSTRUCTIONS.md` and `docs/VERIFYLOGIC.md` were deleted 2026-07-12 — both described a Leaflet-era/26-figure prototype fully superseded by this file, `FUNCTION_LOG.md`, `progress.md`, and `Db.md`. `docs/jigsaw-v2-design.md` was deleted as a duplicate of the fuller `docs/superpowers/specs/` version.
