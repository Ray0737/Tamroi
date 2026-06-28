# Phase 3 — Co-op Mode Design
> ตามรอย · NSC 2026 · Team ปลามึกยักษ์

Phase 3 adds collaborative gameplay on top of the existing solo Phase 1 foundation. It introduces four features drawn from the NSC proposal (§11.4): **Guild/Party System**, **Collaborative Missions**, **Raid Encounters**, and **Historical Discussion Threads**.

---

## Decisions Made

| Question | Answer |
|---|---|
| Raid synchrony | Synchronous real-time session (Supabase Broadcast) |
| Party size cap | 2–6 players per guild |
| New dependencies | None — Supabase Broadcast + Presence are already in supabase-js v2 |

---

## Tech Stack

No new npm packages or build steps. Everything runs on the existing zero-tooling stack.

| Layer | What's added |
|---|---|
| **Realtime transport** | Supabase **Broadcast** (raid quiz events) + **Presence** (lobby/online tracking) — both already in the installed `supabase-js v2` client |
| **Database** | 7 new tables + 2 columns on `figures` — delivered as `supabase/patch_coop.sql` |
| **JS modules** | 4 new IIFE modules: `js/guild.js`, `js/coop.js`, `js/raid.js`, `js/discussion.js` |
| **supabase-client.js** | Extended with `window.DB.Coop.*` and `window.DB.Raid.*` API surface |
| **UI** | Guild panel (Leaderboard tab), Co-op Mission UI (Missions tab), Raid Lobby modal, Discussion panel (Archive tab) |
| **Hosting / Auth** | No changes — Vercel + Supabase Auth unchanged |

---

## Feature 1 — Guild / Party System

### Gameplay
- Any authenticated player can **create a guild** (name + auto-generated 6-character alphanumeric invite code).
- Others **join via the code** in Settings or the Leaderboard → Guild tab.
- Maximum **6 members** per guild. One leader (the creator); the leader can remove members.
- A player can only belong to one guild at a time.

### Shared Fog of War
The guild map view shows the **union** of all members' cleared districts — each member's solo progress contributes to the shared picture. This is computed client-side from `user_districts` rows (no new DB column needed); the union polygon is rendered as a second, lighter fog layer on the existing Leaflet map.

### Guild Leaderboard
A new **"กลุ่ม"** pill tab in the Leaderboard screen shows:
- Combined Map Discovery % (distinct cleared districts across all members ÷ total active districts)
- Total figures captured by the guild
- Sum of all members' Legacy Score

Powered by a `guild_leaderboard` VIEW (see DB Schema).

---

## Feature 2 — Collaborative Missions (ภารกิจร่วม)

### Gameplay
1. Seeded co-op missions appear in the **Missions tab** with a **🤝 ภารกิจกลุ่ม** badge.
2. A guild member taps the mission → sees the requirement and a **เริ่มภารกิจ** button that activates the mission for their guild (inserts a guild run token into `collab_mission_checkins`).
3. All guild members are notified (existing `notifications` system). Each member travels to the target location and **checks in** as they would for a solo watchtower (GPS radius check, then `INSERT INTO collab_mission_checkins`).
4. A live **progress bar** (X / N members checked in) updates for all guild members in real-time via a `postgres_changes` subscription on `collab_mission_checkins`.
5. When the checkin count ≥ `required_players` **within `time_window_hours`** → DB trigger fires:
   - Inserts into `collab_mission_completions`
   - Inserts `user_lore` rows for all participants → special Lore node unlocked
   - Calls the existing `addLegacyPoints` path for each participant (`reward_pts`)
6. If the time window expires without reaching the threshold, the mission resets and can be restarted.

### Example Seed Mission
> *"นำสมาชิกกลุ่ม 3 คน Check-in อนุสาวรีย์ประชาธิปไตยภายใน 24 ชั่วโมง เพื่อปลดล็อก Lore พิเศษของเหตุการณ์ 14 ตุลา 2516"*

Non-guild players checking in at the same location solo do not receive co-op rewards.

---

## Feature 3 — Raid Encounters

### What Is a Raid Figure
Certain S-tier figures are marked `raid_only = true` in the `figures` table. They:
- Show a **⚔️** icon on the map (not 🔒 like standard phase-locked figures)
- Cannot be initiated solo — the "Encounter" button is disabled unless the player is in a guild with ≥ `raid_min_players` members online
- Require a live synchronous quiz session to capture

### Lobby Flow
1. Guild leader taps the raid figure info card → **"เริ่ม Raid"** button.
2. A `raid_sessions` row is created (`status = 'waiting'`). All online guild members receive a notification with a **"เข้าร่วม"** button.
3. The **Raid Lobby modal** opens (full-screen overlay): shows each member's avatar, name, and ready status (powered by Supabase Presence on channel `presence:raid:{session_id}`).
4. Each joining member presses **"พร้อม"** → `is_ready = true` in `raid_session_members` + Presence state update.
5. Once ≥ `raid_min_players` are ready, the leader can press **"เริ่มได้เลย"** → session transitions to `status = 'active'`.

### Live Quiz (Broadcast)
The host (leader) drives the session via Broadcast channel `broadcast:raid:{session_id}`:

```
Host sends          → Clients receive
─────────────────────────────────────
QUESTION            { index, question_th, options: {A,B,C,D} }
                    (no correct answer included — clients can't see it)

Clients send        → Host receives
─────────────────────────────────────
ANSWER              { user_id, question_index, answer: 'A'|'B'|'C'|'D' }

Host sends          → Clients receive
─────────────────────────────────────
ROUND_RESULT        { index, correct_option, passed: bool,
                      correct_count, total_players }
RAID_COMPLETE       { figure_id, success: true }
RAID_FAILED         { reason: 'timeout' | 'disconnected' | 'wrong_answers' }
```

**Tally logic (host-side):**
- Each question has a **30-second timer**.
- After time expires (or all players answered), host counts correct answers.
- If `correct_count / total_players > 0.5` → question **passes**. One retry allowed per question if it fails (host resends the same question once).
- After second failure → `RAID_FAILED`.
- After `questions_required` (3) questions pass → `RAID_COMPLETE`.

### Completion
On `RAID_COMPLETE`, the host client:
1. Updates `raid_sessions.status = 'completed'` and `completed_at`.
2. Inserts one `user_captures` row for every participant who submitted ≥ 1 answer during the session → existing `on_capture_update_score` DB trigger fires for each, awarding `legacy_pts` to each player's `profiles.legacy_score`.

### Host Failover
If the host disconnects, the Presence `leave` event fires on all clients. The client whose `raid_session_members.joined_at` is earliest (among still-connected members) promotes itself to host and resumes from the current question index (stored in client state). Host writes `raid_sessions.host_user_id` update to DB.

### Failure & Retry
- If connected players drop below `raid_min_players` → `RAID_FAILED`. Session can be retried after **10 minutes** (`completed_at + INTERVAL '10 minutes'` check before allowing new session for same figure + guild).
- A failed session does not deduct any points.

---

## Feature 4 — Historical Discussion Threads (กระดานสนทนาเชิงประวัติศาสตร์)

### Gameplay
- In the **Archive tab**, every figure card gets a **"💬 ถกเถียง"** pill tab alongside the existing Bio tab.
- Shows a flat comment list with **1-level replies** (replies can only be children of top-level posts, not grandchildren).
- Content limit: **500 characters** per post (CHECK constraint on `content`).
- Any authenticated user can post or reply.
- Any authenticated user can **flag** a post as inappropriate. When **3 distinct users** flag the same post → DB trigger sets `is_flagged = true` permanently. Flagged posts are excluded from the public SELECT policy (`WHERE NOT is_flagged`).
- No admin moderation UI in Phase 3 MVP.

---

## Database Schema

### New Columns on `figures`

```sql
raid_only        BOOLEAN NOT NULL DEFAULT false,
raid_min_players INT     NOT NULL DEFAULT 2
```

### New Tables

#### `guilds`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `DEFAULT gen_random_uuid()` |
| `name` | TEXT UNIQUE NOT NULL | |
| `created_by` | UUID FK → auth.users | |
| `invite_code` | TEXT UNIQUE NOT NULL | 6-char alphanumeric, generated at INSERT |
| `max_members` | INT NOT NULL DEFAULT 6 | |
| `created_at` | TIMESTAMPTZ DEFAULT now() | |

RLS: Public SELECT · authenticated INSERT (creates own guild) · leader UPDATE/DELETE

#### `guild_members`
| Column | Type | Notes |
|---|---|---|
| `guild_id` | UUID FK → guilds | |
| `user_id` | UUID FK → auth.users | |
| `role` | TEXT CHECK('leader','member') DEFAULT 'member' | |
| `joined_at` | TIMESTAMPTZ DEFAULT now() | |

UNIQUE(guild_id, user_id). RLS: guild members can SELECT · own INSERT · own DELETE (leave) · leader DELETE others

#### `collab_missions`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `district_id` | TEXT FK → districts | |
| `title_th` | TEXT NOT NULL | |
| `description_th` | TEXT | |
| `required_players` | INT NOT NULL DEFAULT 3 | |
| `time_window_hours` | INT NOT NULL DEFAULT 24 | |
| `reward_lore_id` | TEXT FK → lore_nodes | Special Lore unlocked on completion |
| `reward_pts` | INT NOT NULL DEFAULT 100 | Per participant |
| `is_active` | BOOLEAN DEFAULT true | |

RLS: Public SELECT

#### `collab_mission_checkins`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | |
| `mission_id` | TEXT FK → collab_missions | |
| `guild_id` | UUID FK → guilds | |
| `user_id` | UUID FK → auth.users | |
| `checked_in_at` | TIMESTAMPTZ DEFAULT now() | |

UNIQUE(mission_id, guild_id, user_id). RLS: own INSERT · guild members SELECT

#### `collab_mission_completions`
| Column | Type | Notes |
|---|---|---|
| `mission_id` | TEXT FK → collab_missions | |
| `guild_id` | UUID FK → guilds | |
| `completed_at` | TIMESTAMPTZ DEFAULT now() | |

UNIQUE(mission_id, guild_id). RLS: guild members SELECT · system-only INSERT (via trigger)

#### `raid_sessions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | |
| `guild_id` | UUID FK → guilds | |
| `figure_id` | TEXT FK → figures | Must be `raid_only = true` |
| `host_user_id` | UUID FK → auth.users | Updated on failover |
| `status` | TEXT CHECK('waiting','active','completed','failed') DEFAULT 'waiting' | |
| `questions_required` | INT NOT NULL DEFAULT 3 | |
| `questions_passed` | INT NOT NULL DEFAULT 0 | |
| `started_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ | |

RLS: guild members SELECT · guild members INSERT · host UPDATE

#### `raid_session_members`
| Column | Type | Notes |
|---|---|---|
| `session_id` | UUID FK → raid_sessions | |
| `user_id` | UUID FK → auth.users | |
| `is_ready` | BOOLEAN DEFAULT false | |
| `joined_at` | TIMESTAMPTZ DEFAULT now() | Used for host failover ordering |

UNIQUE(session_id, user_id). RLS: guild members SELECT · own INSERT/UPDATE

#### `figure_discussions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK DEFAULT gen_random_uuid() | |
| `figure_id` | TEXT FK → figures | |
| `user_id` | UUID FK → auth.users | |
| `content` | TEXT NOT NULL CHECK(char_length(content) <= 500) | |
| `parent_id` | UUID FK → figure_discussions (nullable) | 1-level replies only |
| `is_flagged` | BOOLEAN NOT NULL DEFAULT false | Set by trigger when flag count ≥ 3 |
| `created_at` | TIMESTAMPTZ DEFAULT now() | |

RLS: Public SELECT WHERE NOT is_flagged · own INSERT · own DELETE

#### `discussion_flags` (helper for flag counting)
| Column | Type | Notes |
|---|---|---|
| `discussion_id` | UUID FK → figure_discussions | |
| `user_id` | UUID FK → auth.users | |
| `flagged_at` | TIMESTAMPTZ DEFAULT now() | |

UNIQUE(discussion_id, user_id). RLS: own INSERT

### New DB Triggers

| Trigger | On | Action |
|---|---|---|
| `on_collab_checkin_threshold` | AFTER INSERT ON `collab_mission_checkins` | Count checkins for (mission_id, guild_id); if ≥ required_players → INSERT `collab_mission_completions` + INSERT `user_lore` rows for all checkin participants + call `addLegacyPoints` for each |
| `on_discussion_flag_count` | AFTER INSERT ON `discussion_flags` | Count flags for discussion_id; if ≥ 3 → UPDATE `figure_discussions` SET `is_flagged = true` |

### New View

```sql
-- guild_leaderboard
SELECT
  g.id AS guild_id,
  g.name,
  COUNT(DISTINCT ud.district_id) FILTER (WHERE NOT ud.fogged)
    AS guild_discovery_count,
  COUNT(DISTINCT uc.figure_id) AS guild_captures,
  SUM(p.legacy_score) AS guild_legacy_score
FROM guilds g
JOIN guild_members gm ON gm.guild_id = g.id
JOIN profiles p ON p.id = gm.user_id
LEFT JOIN user_districts ud ON ud.user_id = gm.user_id
LEFT JOIN user_captures uc ON uc.user_id = gm.user_id
GROUP BY g.id, g.name;
```

---

## Realtime Channels

| Channel name | Type | Who uses it | Events / payload |
|---|---|---|---|
| `presence:guild:{guild_id}` | Presence | GuildModule, CoopModule | Online/offline per member; used in Guild tab + Raid lobby |
| `broadcast:raid:{session_id}` | Broadcast | RaidModule (host + clients) | `QUESTION`, `ANSWER`, `ROUND_RESULT`, `READY`, `RAID_COMPLETE`, `RAID_FAILED` |
| `postgres_changes` on `collab_mission_checkins` | DB change | CoopModule | Update live progress bar (filter by mission_id + guild_id) |

All channels are opened via the existing `window.DB` surface in `supabase-client.js` — no direct `supabase` calls in the new modules.

---

## New JS Modules

All modules follow the existing **IIFE pattern**: `const XModule = (() => { ... })()`.  
All DB/Realtime calls go through extensions added to `window.DB.*` in `supabase-client.js`.  
All user-visible strings rendered into the DOM use `utils.escapeHtml()`.

### `js/guild.js` → `window.GuildModule`

```
init()                    Boot: load current user's guild if any
createGuild(name)         INSERT guilds + guild_members (role=leader)
joinByCode(code)          Lookup guilds.invite_code → INSERT guild_members
leaveGuild()              DELETE own guild_members row
kickMember(userId)        Leader: DELETE target guild_members row (RLS enforced)
loadMembers()             SELECT guild_members + profiles for current guild
subscribePresence()       Open presence:guild:{guild_id} channel, update UI
renderGuildPanel()        Render guild info + member list in Leaderboard tab
```

### `js/coop.js` → `window.CoopModule`

```
init()                    Load active collab missions for current district
loadMissions(districtId)  SELECT collab_missions WHERE district_id + is_active
startMission(missionId)   INSERT first collab_mission_checkins row for guild
checkIn(missionId)        INSERT collab_mission_checkins for current user
subscribeProgress(missionId, guildId)
                          postgres_changes subscription → update progress bar
renderMissionCard(mission, checkinCount)
                          Render co-op mission card with 🤝 badge + progress bar
```

### `js/raid.js` → `window.RaidModule`

```
init()                    Attach click handlers to raid-only figure markers
canStartRaid(figureId)    Check: user in guild, ≥ min_players online in Presence
startSession(figureId)    INSERT raid_sessions, notify guild members
joinSession(sessionId)    INSERT raid_session_members, open Broadcast channel
setReady()                UPDATE is_ready = true, send READY broadcast
startRaid()               Host: set status=active, pull questions, send QUESTION
handleAnswer(answer)      Client: send ANSWER broadcast
tallyAnswers(answers)     Host: count correct, send ROUND_RESULT, advance or retry
completeRaid()            Host: send RAID_COMPLETE, UPDATE session, INSERT user_captures
failRaid(reason)          Host: send RAID_FAILED, UPDATE session status=failed
handleHostFailover()      On Presence leave: check if self is new host, resume
renderLobbyModal()        Show lobby overlay with member avatars + ready states
renderQuizScreen()        Show question + 4 options + 30s countdown timer
renderResultScreen()      Show round result (pass/fail) + running score
```

### `js/discussion.js` → `window.DiscussionModule`

```
init(figureId)            Load top-level comments + reply counts
loadComments(figureId)    SELECT figure_discussions WHERE figure_id + NOT is_flagged
postComment(figureId, content)
                          INSERT figure_discussions
postReply(parentId, content)
                          INSERT figure_discussions WITH parent_id
flagPost(discussionId)    INSERT discussion_flags (trigger handles threshold)
renderThread(comments)    Render comment list + reply threads in Archive tab
```

### `supabase-client.js` additions (new `window.DB.Coop` and `window.DB.Raid` namespaces)

```
window.DB.Coop.getMyGuild(userId)
window.DB.Coop.getGuildMembers(guildId)
window.DB.Coop.createGuild(name, userId)
window.DB.Coop.joinGuild(inviteCode, userId)
window.DB.Coop.getCollabMissions(districtId)
window.DB.Coop.checkInToMission(missionId, guildId, userId)
window.DB.Coop.subscribeGuildPresence(guildId, callback)

window.DB.Raid.createSession(figureId, guildId, hostUserId)
window.DB.Raid.joinSession(sessionId, userId)
window.DB.Raid.updateSessionStatus(sessionId, status)
window.DB.Raid.insertCaptures(sessionId, participantUserIds, figureId)
                          // participantUserIds = only members who answered ≥ 1 question
window.DB.Raid.openBroadcast(sessionId)   → returns Supabase channel
window.DB.Raid.openPresence(sessionId)    → returns Supabase channel

window.DB.Discussion.getComments(figureId)
window.DB.Discussion.postComment(figureId, userId, content, parentId)
window.DB.Discussion.flagComment(discussionId, userId)
```

---

## UI Changes

### Leaderboard tab
- New **"กลุ่ม"** pill tab alongside the existing solo leaderboard pills
- Shows guild stats (Discovery %, captures, Legacy Score sum)
- If user has no guild: CTA card to create or join one (shows invite code input)

### Missions tab
- Co-op missions render with 🤝 badge and a progress bar "X / N สมาชิกเช็คอินแล้ว"
- On mission tap: expanded card shows member avatar list (who's checked in vs. pending)

### Map tab
- Raid-only S-tier figures show ⚔️ icon (not 🔒)
- Tapping one: info card shows ⚔️ Raid Required + party status (if in guild with enough online members → "เริ่ม Raid" active; otherwise grayed out)
- Guild Fog layer: a second lighter polygon overlay showing union of guild members' cleared districts (rendered after `MapModule.init()` loads guild member districts)

### Archive tab (Collection)
- Figure cards gain a **"💬 ถกเถียง"** pill tab
- Discussion panel: comment list → tap to reply → flag button on each post

### Raid Lobby modal (new)
- Full-screen overlay (above all tabs, below top bar)
- Member grid: avatar + name + ready badge
- Host sees "เริ่มได้เลย" once min players ready; clients see "รอผู้นำ..."
- Transitions to Quiz screen on start

### Raid Quiz screen (inside same modal)
- Question text (Thai)
- 4 answer buttons (A/B/C/D) — disabled after selection
- 30-second ring timer (CSS animation)
- Round X of 3 progress indicator
- After each round: result overlay (✅ ผ่าน / ❌ ลองใหม่) before next question

---

## File Delivery

All Phase 3 database changes go into a single new SQL patch file:

```
supabase/patch_coop.sql
```

Containing (in order):
1. New columns on `figures`
2. `guilds` table
3. `guild_members` table
4. `collab_missions` table + seed rows (Bangkok + Ayutthaya districts)
5. `collab_mission_checkins` table
6. `collab_mission_completions` table
7. `raid_sessions` table
8. `raid_session_members` table
9. `figure_discussions` table
10. `discussion_flags` table
11. `guild_leaderboard` VIEW
12. RLS policies for all new tables
13. `on_collab_checkin_threshold` trigger + function
14. `on_discussion_flag_count` trigger + function
15. UPDATE existing S-tier `figures` rows to set `raid_only = true` where applicable

New JS files to create:
```
js/guild.js
js/coop.js
js/raid.js
js/discussion.js
```

Load order in `app.html` (after existing scripts, before `app.js` `DOMContentLoaded`):
```html
<script src="js/guild.js"></script>
<script src="js/coop.js"></script>
<script src="js/raid.js"></script>
<script src="js/discussion.js"></script>
```
Each file is an IIFE exposing its module on `window.*`, consistent with the existing pattern (`MapModule`, `CollectionModule`, etc.).

---

## Scope Boundary

Phase 3 does **not** include:
- Voice/text chat between players (no chat infrastructure)
- Cross-guild competition (no guild vs. guild raids)
- PWA offline support (deferred to separate track)
- Multilingual discussion threads (Thai only, matching Phase 1)
- Admin moderation dashboard (flagging auto-hides; manual review deferred)

---

## Open Questions for Implementation

1. **Collab mission GPS radius**: reuse the existing 500 m watchtower radius, or define a tighter per-mission radius? Recommend reuse for consistency.
2. **Raid question source**: pull from existing `quiz_questions` table (filter `difficulty = 'S'`), or add a `raid_only` flag to `quiz_questions`? Recommend adding `is_raid_question BOOLEAN DEFAULT false` to `quiz_questions`.
3. **Guild fog rendering performance**: computing the union polygon client-side from multiple district polygons could be slow. Recommend pre-computing the union in a Supabase `guild_fog` VIEW or computing lazily only when the Guild Fog toggle is active.
