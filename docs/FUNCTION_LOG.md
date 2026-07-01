# Function Log — ตามรอย
> All functions that touch Supabase or change gameplay logic must have a row here.
> Update this file before ending any coding session.
> See `docs/VERIFYLOGIC.md` Section 7 for the template and update rules.

---

## Core System Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `buildFogLayer()` | js/map.js | Constructs Leaflet evenodd polygon for fog of war; punches holes for unfogged districts | user_districts | ✅ Working |
| `startGPSWatch()` | js/map.js | Starts `navigator.geolocation.watchPosition()`; on position update triggers district polygon match and lore proximity check | — (GPS only) | ✅ Working |
| `renderWatchtowers()` | js/map.js | Draws watchtower markers on the Leaflet map; locked vs. visited state from local district state | — | ✅ Working |
| `renderFigureNodes()` | js/map.js | Draws S/A/B/C figure markers on map in cleared districts; S/A shown as phase-locked if support gate not met | figures | ✅ Working |
| `visitSupportNode(userId, districtId, type, nodeId)` | js/map.js | Records support node visit to Supabase; prevents duplicate visits across sessions using `user_support_node_visits` unique constraint | user_support_node_visits, user_districts | ✅ Working |
| `canCheckIn(districtId)` | js/map.js | Returns true if support node thresholds (2 cafes, 1 OTOP, 3 landmarks) are met for a district | user_districts (local cache) | ✅ Working |
| `openLegendaryEncounter(fig)` | js/map.js | Opens the Legendary Encounter sheet for S/A figures after gate is met | — | ✅ Working |
| `openQuizForFigure(fig)` | js/map.js | Opens the quiz sheet for a figure; fetches question from Supabase `quiz_questions` | quiz_questions | ✅ Working |
| `renderQuizSheet(fig, question)` | js/map.js | Renders 4-option quiz UI inside the check-in bottom sheet | — | ✅ Working |
| `submitQuizAnswer(chosenOption, fig, question)` | js/map.js | Evaluates answer; on correct → capture + challenge progress; on wrong → highlights correct/wrong options; S/A closes sheet after 2s, B/C re-enables after 1.5s | user_captures, user_daily_progress | ✅ Fixed 2026-06-27 |
| `saveLoreUnlock(nodeId, pts)` | js/map.js | Persists lore unlock to `user_lore`; checks chain completion for bonus; adds points to `profiles.legacy_score`; increments lore daily challenge | user_lore, profiles, user_daily_progress | ✅ Working |
| `getTransportMultiplier(lat, lng)` | js/map.js | Returns ×2 if user GPS is within 300m of a BTS/MRT station | — (seeded station list) | ✅ Working |
| `confirmHome(districtId)` | js/map.js | Sets home district during onboarding; clears fog for home district; grants +50 pts | user_districts, profiles | ✅ Working |
| `updateStatsBar()` | js/map.js | Updates the map stats pill (Explored %, Captured count, Legacy score) from live DB profile | profiles | ✅ Working |
| `renderGuildFog(clearedDistrictIds)` | js/map.js | Overlays tinted polygon for guild territory (union of all members' cleared districts); called from GuildModule after init and on member change | — (client-side Leaflet) | ✅ Added 2026-07-01 |

---

## Archive / Collection Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `renderFigures(filter)` | js/collection.js | Loads and renders figure grid from Supabase; filters by S/A/B/C; shows captured/locked state | figures, user_captures | ✅ Working |
| `showDetail(fig)` | js/collection.js | Renders figure bio modal; reads `era` from DB; fallback shows "[Class]-Class · [district]" | figures | ✅ Fixed 2026-06-27 |
| `renderLoreJournal()` | js/collection.js | Loads user's unlocked lore entries; groups by chain_id; renders chain progress bars | user_lore, lore_nodes | ✅ Working |
| `renderStats()` | js/collection.js | Syncs the stats summary row (figures captured, artifacts, legacy score) | profiles, user_captures | ✅ Working |

---

## Missions Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `renderActive()` | js/missions.js | Renders Active Quest card from `_missionCtx` (real DB data); shows first uncaptured S/A figure in unfogged district | user_districts, user_captures, figures | ✅ Working |
| `renderDaily(challenges)` | js/missions.js | Renders Daily Challenges from DB array; shows progress bars for multi-step challenges | daily_challenges, user_daily_progress | ✅ Fixed 2026-06-27 |
| `_renderDailyFallback()` | js/missions.js | Shows loading skeleton for daily challenges section | — | ✅ Added 2026-06-27 |
| `renderSeasonalContent()` | js/missions.js | Checks current date against Thai historical dates; renders seasonal bonus banners | — (calendar check) | ✅ Working |
| `renderBKKBonus()` | js/missions.js | Renders the BTS/MRT ×2 bonus banner when user is in Bangkok | — | ✅ Working |

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
| `openLoreSheet(node)` | js/app.js | Opens lore reading bottom sheet; records open time for read-depth tracking | — | ✅ Working (depth tracking not yet added) |
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
| `DB.Lore.unlock(userId, nodeId)` | user_lore | ✅ Working |
| `DB.Lore.getUserUnlocked(userId)` | user_lore | ✅ Working |
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
| `DB.Coop.approveRequest(requestId)` | guild_join_requests, guild_members | ✅ Updated 2026-07-01: derives guild_id/user_id from the request row instead of caller args |
| `DB.Coop.rejectRequest(requestId)` | guild_join_requests | ✅ Working |
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

## Co-op / Guild Module Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `init(userId)` | js/guild.js | Boot: loads user's guild, subscribes Presence + member changes, renders panel, triggers guild fog refresh | guilds, guild_members | ✅ Working |
| `getState()` | js/guild.js | Returns current `{guild, members}` snapshot for other modules | — | ✅ Working |
| `getOnlineMemberIds()` | js/guild.js | Returns Set of user_ids currently online via Presence | — (Presence) | ✅ Working |
| `renderGuildPanel()` | js/guild.js | Renders guild hub or no-guild CTA in Leaderboard tab | guilds, guild_members, guild_join_requests | ✅ Working |
| `renderFindGroupPanel()` | js/guild.js | Renders searchable guild browser + join request flow | guilds, guild_leaderboard, guild_join_requests | ✅ Working |
| `init()` | js/coop.js | Loads collab missions for current district and renders cards | collab_missions, collab_mission_checkins | ✅ Working |
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

## Notes
- Functions marked ❌ must be built before the NSC demo is "complete per proposal"
- Functions marked ⚠️ have known issues documented in `docs/VERIFYLOGIC.md`
- Functions marked ✅ are working and tested
- When adding a new function, add a row here with status ❌, then change to ✅ when done
