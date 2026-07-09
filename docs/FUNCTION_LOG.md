# Function Log — ตามรอย
> All functions that touch Supabase or change gameplay logic must have a row here.
> Update this file before ending any coding session.
> See `docs/VERIFYLOGIC.md` Section 7 for the template and update rules.

---

## Core System Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `buildFogLayer()` | js/map.js | Builds a MapLibre GeoJSON polygon (ring winding marks holes) for fog of war; punches holes for unfogged districts | user_districts | ✅ Working |
| `startGPSWatch()` | js/map.js | Starts `navigator.geolocation.watchPosition()`; on position update triggers district polygon match and lore proximity check | — (GPS only) | ✅ Working |
| `renderWatchtowers()` | js/map.js | Draws watchtower markers on the MapLibre map; locked vs. visited state from local district state | — | ✅ Working |
| `renderFigureNodes()` | js/map.js | Draws S/A/B/C figure markers on map in cleared districts; S/A shown as phase-locked if support gate not met | figures | ✅ Working |
| `visitSupportNode(userId, districtId, type, nodeId)` | js/map.js | Records support node visit to Supabase; prevents duplicate visits across sessions using `user_support_node_visits` unique constraint | user_support_node_visits, user_districts | ✅ Working |
| `canCheckIn(districtId)` | js/map.js | Returns true if support node thresholds (2 cafes, 1 OTOP, 3 landmarks) are met for a district | user_districts (local cache) | ✅ Working |
| `openLegendaryEncounter(fig)` | js/map.js | Opens the Legendary Encounter sheet for S/A figures after gate is met | — | ✅ Working |
| `openQuizForFigure(fig)` | js/map.js | Opens the quiz sheet for a figure; fetches question from Supabase `quiz_questions` | quiz_questions | ✅ Working |
| `renderQuizSheet(fig, question)` | js/map.js | Renders 4-option quiz UI inside the check-in bottom sheet | — | ✅ Working |
| `submitQuizAnswer(chosenOption, fig, question)` | js/map.js | Evaluates answer; on correct → capture + challenge progress; on wrong → highlights correct/wrong options; S/A closes sheet after 2s, B/C re-enables after 1.5s | user_captures, user_daily_progress | ✅ Fixed 2026-06-27 |
| `checkLoreProximity(lat, lng)` / `unlockLore(node)` | js/map.js | Auto-opens the lore sheet once on first GPS entry into a node's radius; "seen" state persists to `tam_roi_lore_seen` in localStorage (mirrors `tam_roi_lore_unlocked`) so it survives page reload and does not re-trigger while lingering/re-entering — re-access via tapping the map marker (`openVisitedLore()`) | — (client-side; unlock itself still writes `user_lore` via `saveLoreUnlock`) | ✅ Fixed 2026-07-01 — was re-popping the sheet on reload because "seen" state was in-memory only |
| `saveLoreUnlock(nodeId, pts)` | js/map.js | Persists lore unlock to `user_lore`; checks chain completion for bonus; adds points to `profiles.legacy_score`; increments lore daily challenge | user_lore, profiles, user_daily_progress | ✅ Working |
| `confirmHome(districtId)` | js/map.js | Sets home district during onboarding; clears fog for home district; grants +50 pts | user_districts, profiles | ✅ Working |
| `updateStatsBar()` | js/map.js | Updates the map stats pill (Explored %, Captured count, Legacy score) from live DB profile | profiles | ✅ Working |
| `renderGuildFog(clearedDistrictIds)` | js/map.js | Overlays tinted GeoJSON polygon for guild territory (union of all members' cleared districts); called from GuildModule after init and on member change | — (client-side MapLibre) | ✅ Added 2026-07-01 · replatformed to MapLibre GL 2026-07-07 |

---

## Archive / Collection Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `renderFigures(filter)` | js/collection.js | Loads and renders figure grid from Supabase; filters by S/A/B/C; shows captured/locked state | figures, user_captures | ✅ Working |
| `showDetail(fig)` | js/collection.js | Renders figure bio modal; reads `era` from DB; fallback shows "[Class]-Class · [district]" | figures | ✅ Fixed 2026-06-27 |
| `renderLoreJournal()` | js/collection.js | Loads user's unlocked lore entries; groups by chain_id; renders chain progress bars + assessment pill (pretest/posttest scores) | user_lore, lore_nodes, user_lore_assessments | ✅ Updated 2026-07-02: now async, displays assessment results |
| `renderStats()` | js/collection.js | Syncs the stats summary row (figures captured, artifacts, legacy score) | profiles, user_captures | ✅ Working |

---

## Missions Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `renderActive()` | js/missions.js | Renders Active Quest card from `_missionCtx` (real DB data); shows first uncaptured S/A figure in unfogged district | user_districts, user_captures, figures | ✅ Working |
| `renderDaily(challenges)` | js/missions.js | Renders Daily Challenges from DB array; shows progress bars for multi-step challenges | daily_challenges, user_daily_progress | ✅ Fixed 2026-06-27 |
| `_renderDailyFallback()` | js/missions.js | Shows loading skeleton for daily challenges section | — | ✅ Added 2026-06-27 |
| `renderSeasonalContent()` | js/missions.js | Checks current date against Thai historical dates; renders seasonal bonus banners | — (calendar check) | ✅ Working |

---

## Leaderboard Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `loadLeaderboard(metric, period)` | js/leaderboard.js | Loads leaderboard from `leaderboard_legacy` VIEW; filters by metric tab | leaderboard_legacy (VIEW) | ✅ Working |
| `renderPodium(top3)` | js/leaderboard.js | Renders Gold/Silver/Bronze podium | — | ✅ Working |
| `renderRankedList(rows, userId)` | js/leaderboard.js | Renders ranked list with "My Rank" card highlighted | — | ✅ Working |
| `subscribeLeaderboard()` | js/leaderboard.js | Subscribes to Supabase Realtime on `profiles` table; re-renders on change | profiles (realtime) | ✅ Working |

---

## App / Auth Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `updateMapStatsPill()` | js/app.js | Updates top map stats pill from `App.profile` at boot and after capture | profiles | ✅ Working |
| `loadNotifications()` | js/app.js | Loads unread notifications from DB; shows bell badge count. `join_request` notifs render Accept/Ignore buttons (via `ref_id` → `guild_join_requests.id`) and stay unread until acted on | notifications | ✅ Updated 2026-07-01 |
| `subscribeNotifications()` | js/app.js | Supabase Realtime sub on `notifications` for this user | notifications (realtime) | ✅ Working |
| `openLoreSheet(node)` | js/app.js | Opens lore reading bottom sheet with pre/post assessment flow; async with phase machine (pretest → read → posttest) | user_lore_assessments | ✅ Updated 2026-07-02: now async, runs pre/post assessment phases |
| `openLoreChainSheet(chain)` | js/app.js | Opens lore chain summary sheet | — | ✅ Working |

---

## Supabase Client (`window.DB`) API

| Method | Supabase Tables | Status |
|--------|-----------------|--------|
| `DB.Auth.*` | auth.users | ✅ Working |
| `DB.Profiles.get(userId)` | profiles | ✅ Working |
| `DB.Profiles.addLegacyPoints(userId, pts)` | profiles | ✅ Working |
| `DB.Districts.getAll()` | districts | ✅ Working |
| `DB.Districts.getUserState(userId)` | user_districts | ✅ Working |
| `DB.Districts.checkin(userId, districtId)` | user_districts | ✅ Working |
| `DB.Districts.updateNodeVisit(userId, districtId, type, nodeId)` | user_support_node_visits, user_districts | ✅ Working |
| `DB.Districts.getVisitedSupportNodes(userId)` | user_support_node_visits | ✅ Working |
| `DB.Figures.getAll()` | figures | ✅ Working |
| `DB.Figures.capture(userId, figureId)` | user_captures | ✅ Working |
| `DB.Lore.getAll()` | lore_nodes | ✅ Filters: is_active=true, review_status='approved', source_ref not null/empty |
| `DB.Lore.unlock(userId, nodeId)` | user_lore | ✅ Fixed 2026-07-05 — upsert used nonexistent column `lore_id` (correct: `lore_node_id`); every write had silently failed since launch |
| `DB.Lore.getUserUnlocked(userId)` | user_lore | ✅ Working |
| `DB.Lore.getLoreQuestions(loreId)` | quiz_questions | ✅ Added 2026-07-02; fetches pretest MCQs for a lore node |
| `DB.Lore.saveAssessment(userId, loreId, phase, score, total)` | user_lore_assessments | ✅ Added 2026-07-02; upserts one phase result (pre/post) |
| `DB.Lore.getAssessments(userId, loreId)` | user_lore_assessments | ✅ Added 2026-07-02; returns pre+post records for journal display |
| `DB.Quiz.getForFigure(figureId, count)` | quiz_questions | ✅ Filters: source_ref not null/empty |
| `DB.Leaderboard.get()` | leaderboard_legacy (VIEW) | ✅ Working |
| `DB.Notifications.getAll(userId)` | notifications | ✅ Working |
| `DB.Notifications.subscribe(userId, cb)` | notifications (realtime) | ✅ Working |
| `DB.Missions.getDailyChallenges(userId)` | daily_challenges, user_daily_progress | ✅ Added 2026-06-27 |
| `DB.Missions.updateChallengeProgress(userId, type)` | user_daily_progress | ✅ Added 2026-06-27; called from saveLoreUnlock, submitQuizAnswer, performCheckIn |
| `DB.Coop.getMyGuild(userId)` | guilds, guild_members | ✅ Working |
| `DB.Coop.getGuildMembers(guildId)` | guild_members, profiles | ✅ Working |
| `DB.Coop.getGuildClearedDistrictIds(guildId)` | guild_members, user_districts | ✅ Added 2026-07-01 |
| `DB.Coop.createGuild(name, userId)` | guilds, guild_members | ✅ Working |
| `DB.Coop.leaveGuild(guildId, userId)` | guild_members | ✅ Working |
| `DB.Coop.kickMember(guildId, targetUserId)` | guild_members | ✅ Working |
| `DB.Coop.deleteGuild(guildId)` | guilds | ✅ Working |
| `DB.Coop.updateGuild(guildId, fields)` | guilds | ✅ Working |
| `DB.Coop.searchGuilds(query)` | guilds, guild_leaderboard | ✅ Working |
| `DB.Coop.sendJoinRequest(guildId, userId)` | guild_join_requests, notifications | ✅ Working |
| `DB.Coop.getMyPendingRequest(userId)` | guild_join_requests | ✅ Working |
| `DB.Coop.getJoinRequests(guildId)` | guild_join_requests, profiles | ✅ Working |
| `DB.Coop.approveRequest(requestId)` | guild_join_requests, guild_members | ✅ Updated 2026-07-01: derives guild_id/user_id from the request row, deletes the request row (instead of marking it approved) after inserting the member |
| `DB.Coop.rejectRequest(requestId)` | guild_join_requests | ✅ Updated 2026-07-01: deletes the request row (instead of marking it rejected) |
| `DB.Coop.getCollabMissions()` | collab_missions | ✅ Working |
| `DB.Coop.checkInToMission(missionId, guildId, userId)` | collab_mission_checkins | ✅ Working |
| `DB.Coop.getMissionCheckins(missionId, guildId)` | collab_mission_checkins | ✅ Working |
| `DB.Coop.getAllGuildCheckins(guildId)` | collab_mission_checkins | ✅ Working |
| `DB.Coop.getGuildLeaderboard()` | guild_leaderboard (VIEW) | ✅ Working |
| `DB.Coop.getMyMemberships(userId)` | guild_members | ✅ Working |
| `DB.Coop.subscribeGuildPresence(guildId, callbacks)` | — (Supabase Presence) | ✅ Working |
| `DB.Coop.subscribeGuildMembers(guildId, callback)` | guild_members (realtime) | ✅ Working |
| `DB.Coop.subscribeGuildChanges(callback)` | guilds, guild_members (realtime) | ✅ Working |
| `DB.Coop.subscribeMissionProgress(missionId, guildId, callback)` | collab_mission_checkins (realtime) | ✅ Working |
| `DB.Raid.createSession(figureId, guildId, hostUserId)` | raid_sessions | ✅ Working |
| `DB.Raid.joinSession(sessionId, userId)` | raid_session_members | ✅ Working |
| `DB.Raid.updateSessionStatus(sessionId, status)` | raid_sessions | ✅ Working |
| `DB.Raid.insertCaptures(sessionId, participantUserIds, figureId)` | user_captures | ✅ Working |
| `DB.Raid.openBroadcast(sessionId)` | — (Supabase Broadcast) | ✅ Working |
| `DB.Raid.openPresence(sessionId)` | — (Supabase Presence) | ✅ Working |
| `DB.Discussion.getComments(figureId)` | figure_discussions, profiles | ✅ Working |
| `DB.Discussion.postComment(figureId, userId, content, parentId)` | figure_discussions | ✅ Working |
| `DB.Discussion.flagComment(discussionId, userId)` | discussion_flags | ✅ Working |
| `DB.Community.getPosts(userId)` | community_posts, community_post_likes, profiles | ✅ Working |
| `DB.Community.getReplies(parentId)` | community_posts, profiles | ✅ Working |
| `DB.Community.postMessage(userId, content, parentId)` | community_posts | ✅ Working |
| `DB.Community.flagPost(postId, userId)` | community_post_flags | ✅ Working |
| `DB.Community.likePost(postId, userId)` | community_post_likes | ✅ Working |
| `DB.Community.unlikePost(postId, userId)` | community_post_likes | ✅ Working |

---

## Map & Capture Additions (2026-07-04 → 07-05)

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `_initWalkGrid()` / `_revealWalkCell(lat, lng)` | js/map.js | Walk-cell fog reveal: FogGrid cell per GPS fix, persisted to localStorage (`tam_roi_walk_cells`), skipped when GPS accuracy > 100m | — (localStorage only, not per-account) | ✅ Working |
| `buildFogLayer()` walk-cell filter | js/map.js | Drops walk cells whose bbox intersects a cleared district so evenodd fill can't re-fog district holes | user_districts | ✅ Fixed 2026-07-05 |
| `DB.Districts.checkIn()` encounter key | js/supabase-client.js | Check-in now also sets `has_encounter_key = true`; A-tier encounters require the key + support chain | user_districts | ✅ Added 2026-07-04 |
| C-class proximity capture (`_pendingCaptureC`, `btn-c-capture`, `_completeCapture`) | js/map.js, app.html | C figures render through fog with an 80m orange circle; tap inside radius opens `#c-capture-sheet`, capture completes without quiz; marker + circle removed on capture | user_captures, profiles | ✅ Added 2026-07-05 |
| Captured-figure hiding at init | js/map.js | `loadDistrictData` fetches the user's captures and skips those figure markers on first render | user_captures | ✅ Added 2026-07-05 |
| `DB.Lore.getRecallQuestions(loreNodeId)` | js/supabase-client.js | Fetches recall MCQs for retrieval practice | quiz_questions | ✅ Added 2026-07-03 |
| `DB.Missions.getRecallMissions(userId)` / `completeRecall(...)` | js/supabase-client.js | Spaced-repetition recall missions due 3 days after lore read | user_lore, user_daily_progress | ✅ Added 2026-07-03 |
| `DB.Debates.getForFigure / getStats / vote` | js/supabase-client.js | Unsolved History debate prompts, aggregate stats RPC, per-user vote | history_debates, debate_votes | ✅ Added 2026-07-03 |
| `DB.Coop.getJigsawAssignments / assignJigsawChapters / postJigsawSummary` | js/supabase-client.js | Jigsaw Learning chapter split + member summaries | guild_jigsaw_assignments | ✅ Added 2026-07-03 |

---

## Co-op / Guild Module Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `init(userId)` | js/guild.js | Boot: loads user's guild, subscribes Presence + member changes, renders panel, triggers guild fog refresh | guilds, guild_members | ✅ Working |
| `getState()` | js/guild.js | Returns current `{guild, members}` snapshot for other modules | — | ✅ Working |
| `getOnlineMemberIds()` | js/guild.js | Returns Set of user_ids currently online via Presence | — (Presence) | ✅ Working |
| `renderGuildPanel()` | js/guild.js | Renders guild hub (with guild) or no-guild CTA + inline guild search (without guild) | guilds, guild_members, guild_join_requests | ✅ Working |
| `load()` | js/coop.js | Renders a locked "unlocks in N days" placeholder — group missions feature-flagged off for now | — | ⏸️ Disabled 2026-07-09 |
| `_liveLoad()` | js/coop.js | The real collab-mission loader (was `load()`); loads collab missions for current district and renders cards | collab_missions, collab_mission_checkins | ✅ Working, unused while disabled |
| `renderMissionCard(mission, checkins, myCheckin)` | js/coop.js | Renders co-op mission card with progress bar and checkin CTA | — | ✅ Working |
| `subscribeProgress(missionId, guildId)` | js/coop.js | Real-time progress bar updates via postgres_changes on checkins | collab_mission_checkins (realtime) | ✅ Working |
| `init(figureId)` | js/raid.js | Attaches click handlers to raid-only figure; validates party size + online count | raid_sessions, profiles | ✅ Working |
| `startSession(figureId)` | js/raid.js | Creates raid session, notifies guild, opens lobby modal | raid_sessions, notifications | ✅ Working |
| `renderLobbyModal()` | js/raid.js | Lobby overlay: member avatars, ready states, start button | — (Presence) | ✅ Working |
| `renderQuizScreen(question)` | js/raid.js | Quiz UI: question + 4 options + 30s countdown ring | — | ✅ Working |
| `handleHostFailover()` | js/raid.js | On Presence leave: earliest joined_at member becomes host | raid_sessions | ✅ Working |
| `init(figureId)` | js/discussion.js | Loads and renders comment thread for a figure | figure_discussions, profiles | ✅ Working |
| `postComment(figureId, content)` | js/discussion.js | Inserts top-level comment | figure_discussions | ✅ Working |
| `postReply(parentId, content)` | js/discussion.js | Inserts reply to a comment | figure_discussions | ✅ Working |
| `flagPost(discussionId)` | js/discussion.js | Flags a post; trigger auto-hides at 3 flags | discussion_flags | ✅ Working |
| `load()` | js/community-forum.js | Loads community feed posts (top-level), renders with likes + reply counts | community_posts, community_post_likes | ✅ Working |

---

## Figure Biography + Graph Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `getBio(figureId)` | js/supabase-client.js → `DB.Figures` | Fetches full figure row incl. bio_th, birth_year, death_year | figures | ✅ Done |
| `getRelations(figureId)` | js/supabase-client.js → `DB.Figures` | Returns neighbours (both directions) joined with figure meta | figure_relations, figures | ✅ Done |
| `getAllRelations()` | js/supabase-client.js → `DB.Figures` | Returns all edges — used by graph builder | figure_relations | ✅ Done |
| `getForFigure(figureId)` | js/supabase-client.js → `DB.Lore` | Lore nodes linked to a figure via figure_id column | lore_nodes | ✅ Done |
| `_fillBioSections(fig, figureId, modal)` | js/collection.js | Async fills relations, lore, locations sections in figure modal | — | ✅ Done |
| `_openLoreFromModal(loreId, e)` | js/collection.js | Opens lore sheet (saved/read-only) from the bio modal | — | ✅ Done |
| `_goToMap(lat, lng)` | js/collection.js | Closes modal, switches to map tab, flies to location | — | ✅ Done |
| `open(figureId)` | js/figure-graph.js → `FigureGraphModule` | Opens full-screen graph overlay, builds neighbourhood, lays out nodes | figure_relations, figures | ✅ Done |
| `close()` | js/figure-graph.js → `FigureGraphModule` | Tears down overlay and clears state | — | ✅ Done |
| `flyToLocation(lat, lng, zoom?)` | js/map.js → `MapModule` | MapLibre flyTo wrapper for bio modal location links | — | ✅ Done |

---

## Notes
- Functions marked ❌ must be built before the NSC demo is "complete per proposal"
- Functions marked ⚠️ have known issues documented in `docs/VERIFYLOGIC.md`
- Functions marked ✅ are working and tested
- When adding a new function, add a row here with status ❌, then change to ✅ when done
