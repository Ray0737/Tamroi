# CLAUDE.md — Tamroi (ตามรอย) · NSC Prototype 06

> Tamroi · Thailand Gamified Travel App · NSC 2026 · Team ปลามึกยักษ์

---

## Project Context

**Tamroi** is a mobile-first web app for the National Software Contest 2026. Players travel to real Thai districts, check in at landmark Watchtowers to clear Fog of War, and capture historical figures by visiting local outposts. **Phase 1 (Web MVP) and Phase 3 (Co-op Mode) are both fully implemented.** No native mobile code, no React, no build tooling.

**Primary User:** Tourist / traveler, age 20–30  
**Platform:** Mobile web, max content width 430px  
**Language mix:** Thai (UI labels, figure names) + English (code, docs)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 modules) |
| Map | MapLibre GL JS + CartoDB Light raster tiles (45° pitch camera) |
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
│   ├── map.css          MapLibre GL overrides, fog layer, markers, GPS dot
│   └── animations.css   Keyframes
├── js/
│   ├── config.js        Reads window.ENV → window.APP_CONFIG
│   ├── env.js           Public Supabase anon config for local/static runtime
│   ├── env.example.js   Credential template for resetting env.js
│   ├── utils.js         escapeHtml() — always use for user-visible strings
│   ├── supabase-client.js  All DB & Auth calls live here
│   ├── app.js           Boot · auth guard · tab navigation · notifications
│   ├── map.js           MapLibre GL (45° tilt) · Fog of War · watchtowers · GPS dot · Lore proximity · Guild fog
│   ├── fog-grid.js      Reusable Thailand grid Fog helper exposed as window.FogGrid
│   ├── collection.js    Figures + artifacts grid · Lore Journal
│   ├── missions.js      Active quest + daily challenges
│   ├── leaderboard.js   Podium + rank list (solo + guild tabs)
│   ├── guild.js         Guild create/join/manage · Presence · Find Group panel
│   ├── coop.js          Collaborative mission cards + real-time checkin progress
│   ├── raid.js          Raid lobby · Broadcast quiz · host failover
│   ├── discussion.js    Figure discussion threads (1-level replies + auto-flag)
│   ├── debates.js          Historical Debate bottom sheet · vote form · results
│   └── community-forum.js  Community feed · likes · replies · flag
└── supabase/
    ├── schema.sql              Full DB schema + Bangkok district seed data
    ├── patch_auth_fix.sql      Auth trigger fix + RLS INSERT policy
    ├── patch_lore.sql          Lore/support-node visit/quiz tables + legacy score trigger
    ├── patch_district_seed.sql MVP district seed parity with map.js
    ├── patch_era.sql           era column on figures
    ├── patch_daily_challenges.sql daily_challenges + user_daily_progress tables
    ├── patch_support_nodes.sql figure lat/lng coords + support_nodes + bts_mrt_stations tables
    ├── patch_coop.sql          Phase 3: guilds, raids, discussions, triggers, views, RLS
    ├── patch_coop_fix.sql      guild_join_requests table + split notification RLS
    ├── patch_group_management.sql guilds.announcement column
    ├── patch_notifications_rls.sql split notifications policy (insert for others)
    ├── patch_community.sql     community_posts table + RLS + flag trigger
    ├── patch_community_likes.sql community_post_likes table + RLS
    ├── patch_guild_leader_rls.sql lets non-members see who a guild's leader is (join-request notify)
    ├── patch_notification_ref.sql notifications.ref_id column — links a notif to its source row (e.g. join request)
    ├── patch_retrieval_practice.sql recall_due_at on user_lore · assessment_type on quiz_questions · lore_recall challenge type
    ├── patch_debates.sql       history_debates · debate_votes · get_debate_stats SECURITY DEFINER RPC
    ├── patch_jigsaw.sql        chapter_index on lore_nodes · type on collab_missions · guild_jigsaw_assignments table
    └── patch_mock_satit.sql    Test-only seed data — REMOVE before production
└── docs/
    ├── CODING_INSTRUCTIONS.md  Design system and implementation rules
    ├── COOP.md                 Phase 3 Co-op design spec (guilds, raids, discussions)
    ├── Db.md                   Figure roster snapshot from the live Supabase DB
    ├── FUNCTION_LOG.md         Live log of all gameplay/DB functions; update each session
    ├── GAME_LOGIC.md           Player-facing gameplay mechanics reference
    ├── gps-spoofing.md         GPS anti-cheat threat analysis + mitigation status
    ├── pre-post_test_plan.md   Lore pre/post-test measurement plan
    ├── production-smoke.md     Supabase/Vercel smoke-test checklist
    ├── progress.md             Current implementation progress
    ├── PROJECT_SUMMARY.md      Project overview + function completion / errors / security audit
    ├── system_architect.md     System architecture notes
    ├── VERIFYLOGIC.md          Game logic, rules, and verification status
    └── proposal/
        └── ตามรอย_NSC_2026_v20.md NSC proposal (+ v29 docx, flowchart)
└── tests/
    ├── coop-static.test.mjs     Static regression check for Co-op module
    ├── district-seed-static.test.mjs Static regression check for DB/map district parity
    ├── env-policy-static.test.mjs Static regression check for tracked env policy
    ├── grid-fog-static.test.mjs  Static regression check for window.FogGrid
    ├── guild.spec.mjs            Guild module unit tests
    ├── lore-static.test.mjs      Static regression check for Lore integration
    ├── prod-readiness-static.test.mjs Static regression check for deploy readiness
    ├── remaining-static.test.mjs Static regression check for gameplay loop work
    └── run-static.mjs            One-command static regression suite runner
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
- **Commits**: Never commit when a task is done. Output the suggested commit message and let the user run it.
- **Docs sync**: After any change that alters gameplay mechanics, DB schema, file structure, or runtime APIs, update the affected markdown docs in the same task — `docs/progress.md` (implementation status), `docs/FUNCTION_LOG.md` (function/DB object log), `docs/VERIFYLOGIC.md` (game logic/rules), `docs/COOP.md` (Co-op spec), and this `CLAUDE.md` (File Structure / DB Tables / Runtime APIs tables) — so they match current project state, not the state as of the last doc pass. Skip docs a change doesn't touch.
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

Run patches in this order:

1. Create project at supabase.com
2. SQL Editor → `supabase/schema.sql`
3. SQL Editor → `supabase/patch_auth_fix.sql`
4. SQL Editor → `supabase/patch_lore.sql`
5. SQL Editor → `supabase/patch_district_seed.sql`
6. SQL Editor → `supabase/patch_era.sql`
7. SQL Editor → `supabase/patch_daily_challenges.sql`
8. SQL Editor → `supabase/patch_support_nodes.sql`
9. SQL Editor → `supabase/patch_coop.sql`
10. SQL Editor → `supabase/patch_coop_fix.sql`
11. SQL Editor → `supabase/patch_group_management.sql`
12. SQL Editor → `supabase/patch_notifications_rls.sql`
13. SQL Editor → `supabase/patch_community.sql`
14. SQL Editor → `supabase/patch_community_likes.sql`
15. SQL Editor → `supabase/patch_guild_leader_rls.sql`
16. SQL Editor → `supabase/patch_notification_ref.sql`
17. *(Optional, dev/test only)* SQL Editor → `supabase/patch_mock_satit.sql`
18. SQL Editor → `supabase/patch_retrieval_practice.sql`
19. SQL Editor → `supabase/patch_debates.sql`
20. SQL Editor → `supabase/patch_jigsaw.sql`
21. Authentication → Email → **disable "Confirm email"** for dev
22. Authentication → URL Configuration → add `http://127.0.0.1:5500/**`
23. Settings → API → copy URL + anon key into `js/env.js`

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

### DB Tables

| Table / Object | Patch | Purpose |
|---|---|---|
| `lore_nodes` | patch_lore | GPS lore points with radius, content, chain info |
| `user_lore` | patch_lore | Which lore nodes user has unlocked (RLS: own rows) |
| `user_support_node_visits` | patch_lore | Exact Support Node IDs visited; unique per `(user_id, node_id)` |
| `quiz_questions` | patch_lore | Location-specific MCQ questions per figure (public SELECT) |
| `daily_challenges` | patch_daily_challenges | Challenge definitions (checkin/capture/lore/quiz types) |
| `user_daily_progress` | patch_daily_challenges | Per-user daily challenge progress |
| `support_nodes` | patch_support_nodes | Cafe/OTOP/landmark node definitions with lat/lng |
| `bts_mrt_stations` | patch_support_nodes | Station coords for ×2 transport bonus |
| `guilds` | patch_coop | Guild records (name, invite_code, max_members, announcement) |
| `guild_members` | patch_coop | Guild membership + role (leader/member) |
| `guild_join_requests` | patch_coop_fix | Join request flow (pending/approved/rejected) |
| `collab_missions` | patch_coop | Seeded co-op missions per district |
| `collab_mission_checkins` | patch_coop | GPS checkins per user per mission + guild |
| `collab_mission_completions` | patch_coop | Auto-inserted by trigger when threshold met |
| `raid_sessions` | patch_coop | Raid session state (waiting/active/completed/failed) |
| `raid_session_members` | patch_coop | Players in a raid + ready state + joined_at for failover |
| `figure_discussions` | patch_coop | Per-figure comment threads (1-level replies) |
| `discussion_flags` | patch_coop | Flag votes; trigger auto-hides at 3 flags |
| `community_posts` | patch_community | Global community feed posts + replies |
| `community_post_likes` | patch_community_likes | Like/unlike tracking per post per user |
| `user_lore_assessments` | patch_prepost | Pre/post quiz results per user per lore node (one row per phase: pre/post) |
| `guild_leaderboard` VIEW | patch_coop | Aggregated guild stats (discovery, captures, score) |
| `history_debates` | patch_debates | Unsolved History debate prompts per figure (case A/B) |
| `debate_votes` | patch_debates | Per-user votes + optional reason; own-row RLS |
| `get_debate_stats(p_debate_id)` RPC | patch_debates | SECURITY DEFINER — returns aggregate vote counts + reasons |
| `guild_jigsaw_assignments` | patch_jigsaw | Chapter assignments + summaries per member per jigsaw mission |
| `quiz_questions.lore_id` | patch_retrieval_practice | Links recall questions to their source lore node |
| `quiz_questions.assessment_type` | patch_retrieval_practice | `'capture'` / `'pretest'` / `'recall'` |
| `user_lore.recall_due_at` | patch_retrieval_practice | Spaced-repetition due timestamp; auto-set by DB trigger |
| `on_capture_update_score` trigger | patch_lore | Auto-updates `profiles.legacy_score` on `user_captures` insert |
| `on_collab_checkin_threshold` trigger | patch_coop | Auto-completes mission + awards pts when checkin count ≥ required |
| `on_discussion_flag_count` trigger | patch_coop | Sets `is_flagged = true` when flag count ≥ 3 |

### Runtime APIs

**Phase 1**
- `window.DB.Lore`: `getAll()`, `getUserUnlocked(userId)`, `unlock(userId, loreId)`, `getLoreQuestions(loreId)`, `getRecallQuestions(loreNodeId)`, `saveAssessment(userId, loreId, phase, score, total)`, `getAssessments(userId, loreId)`
- `window.DB.Missions`: `getRecallMissions(userId)`, `completeRecall(userId, loreNodeId, wasCorrect)`
- `window.DB.Quiz`: `getForFigure(figureId, count)`
- `window.DB.Districts.getVisitedSupportNodes(userId)`, `updateNodeVisit(userId, districtId, nodeType, nodeId)`
- `window.DB.Profiles.addLegacyPoints(userId, pts)`
- `window.DB.Leaderboard.subscribe(callback)`
- `window.DB.Notifications.subscribe(userId, callback)`
- `window.AppCore.openLoreSheet(node)`, `openLoreChainSheet(chain)`, `showToast(message)`
- `window.MapModule.renderGuildFog(clearedDistrictIds)`: overlays tinted fog for guild territory
- `window.MapModule.renderRallyPin(userId, username, lat, lng)`: places/updates a rally pin marker on the map

**Phase 3 — Co-op**
- `window.DB.Coop`: `getMyGuild(userId)`, `getGuildMembers(guildId)`, `getGuildClearedDistrictIds(guildId)`, `createGuild(name, userId)`, `leaveGuild(guildId, userId)`, `kickMember(guildId, targetUserId)`, `deleteGuild(guildId)`, `updateGuild(guildId, fields)`, `searchGuilds(query)`, `sendJoinRequest(guildId, userId)`, `getMyPendingRequest(userId)`, `getJoinRequests(guildId)`, `approveRequest(requestId, guildId, targetUserId)`, `rejectRequest(requestId)`, `getCollabMissions()`, `checkInToMission(missionId, guildId, userId)`, `getMissionCheckins(missionId, guildId)`, `getAllGuildCheckins(guildId)`, `getGuildLeaderboard()`, `subscribeGuildPresence(guildId, {onSync, onJoin, onLeave})`, `subscribeGuildMembers(guildId, callback)`, `subscribeGuildChanges(callback)`, `subscribeMissionProgress(missionId, guildId, callback)`, `getMyMemberships(userId)`, `getExpeditionLog(memberIds, limit?)`, `openRallyChannel(guildId)`, `getJigsawAssignments(guildId, missionId)`, `assignJigsawChapters(guildId, missionId, memberIds)`, `postJigsawSummary(guildId, missionId, userId, summary)`
- `window.DB.Debates`: `getForFigure(figureId)`, `getStats(debateId)`, `vote(debateId, userId, vote, reason)`
- `window.DB.Raid`: `createSession(figureId, guildId, hostUserId)`, `joinSession(sessionId, userId)`, `updateSessionStatus(sessionId, status)`, `insertCaptures(sessionId, participantUserIds, figureId)`, `openBroadcast(sessionId)`, `openPresence(sessionId)`
- `window.DB.Discussion`: `getComments(figureId)`, `postComment(figureId, userId, content, parentId)`, `flagComment(discussionId, userId)`
- `window.DB.Community`: `getPosts(userId)`, `getReplies(parentId)`, `postMessage(userId, content, parentId)`, `flagPost(postId, userId)`, `likePost(postId, userId)`, `unlikePost(postId, userId)`
- `window.GuildModule`: `init(userId)`, `getState()`, `getOnlineMemberIds()`, `renderGuildPanel()`
- `window.CoopModule`: `init()`, `postJigsawSummary(guildId, missionId)`
- `window.DebateModule`: `open(figureId)`, `close()`
- `window.RaidModule`: `init(figureId)`
- `window.DiscussionModule`: `init(figureId)`, `load(figureId)`
- `window.CommunityForumModule`: `load()`

---

## What to Avoid

- Do not add npm dependencies or a build step — this is intentionally zero-tooling
- Do not use `eval()` or `innerHTML` with unescaped strings
- Do not commit service-role keys, private Supabase credentials, `.env` secrets, or production-only tokens
- Do not add `!important` to CSS — use the variable system instead
- Do not write comments explaining what code does — only write them for non-obvious WHY
- Do not call Supabase outside of `supabase-client.js`

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
