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
| `submitQuizAnswer(chosenOption, fig, question)` | js/map.js | Evaluates answer; on correct → calls capture; on wrong → **fail state not yet implemented** | user_captures | ⚠️ Fail state missing (see Fix 2) |
| `saveLoreUnlock(nodeId, pts)` | js/map.js | Persists lore unlock to `user_lore`; checks chain completion for bonus; adds points to `profiles.legacy_score` | user_lore, profiles | ✅ Working |
| `getTransportMultiplier(lat, lng)` | js/map.js | Returns ×2 if user GPS is within 300m of a BTS/MRT station | — (seeded station list) | ✅ Working |
| `confirmHome(districtId)` | js/map.js | Sets home district during onboarding; clears fog for home district; grants +50 pts | user_districts, profiles | ✅ Working |
| `updateStatsBar()` | js/map.js | Updates the map stats pill (Explored %, Captured count, Legacy score) from live DB profile | profiles | ✅ Working |

---

## Archive / Collection Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `renderFigures(filter)` | js/collection.js | Loads and renders figure grid from Supabase; filters by S/A/B/C; shows captured/locked state | figures, user_captures | ✅ Working |
| `showDetail(fig)` | js/collection.js | Renders figure bio modal; reads `description`, `era` from DB — **era column missing** | figures | ⚠️ era field fallback shows district ID (see Fix 1) |
| `renderLoreJournal()` | js/collection.js | Loads user's unlocked lore entries; groups by chain_id; renders chain progress bars | user_lore, lore_nodes | ✅ Working |
| `renderStats()` | js/collection.js | Syncs the stats summary row (figures captured, artifacts, legacy score) | profiles, user_captures | ✅ Working |

---

## Missions Functions

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `renderActiveMission()` | js/missions.js | Renders Active Quest card — **currently uses MOCK_ACTIVE** | — (mock) | ❌ Must be replaced with DB (see Task A) |
| `renderDailyChallenges()` | js/missions.js | Renders Daily Challenges list — **currently uses MOCK_DAILY** | — (mock) | ❌ Must be replaced with DB (see Task B) |
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
| `loadNotifications()` | js/app.js | Loads unread notifications from DB; shows bell badge count | notifications | ✅ Working |
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
| `DB.Lore.getNodes()` | lore_nodes | ⚠️ Missing review_status + source_ref filter (Fix 3+4) |
| `DB.Lore.unlock(userId, nodeId)` | user_lore | ✅ Working |
| `DB.Lore.getUserUnlocked(userId)` | user_lore | ✅ Working |
| `DB.Quiz.getQuestion(figureId, difficulty)` | quiz_questions | ⚠️ Missing source_ref filter (Fix 4) |
| `DB.Leaderboard.get()` | leaderboard_legacy (VIEW) | ✅ Working |
| `DB.Notifications.getAll(userId)` | notifications | ✅ Working |
| `DB.Notifications.subscribe(userId, cb)` | notifications (realtime) | ✅ Working |
| `DB.Missions.getActiveMission(userId)` | user_districts, user_captures, figures, districts | ❌ Not yet built (Task A) |
| `DB.Missions.getDailyChallenges(userId)` | daily_challenges, user_daily_progress | ❌ Not yet built (Task B) |
| `DB.Missions.updateChallengeProgress(userId, type)` | user_daily_progress | ❌ Not yet built (Task B) |

---

## Notes
- Functions marked ❌ must be built before the NSC demo is "complete per proposal"
- Functions marked ⚠️ have known issues documented in `docs/VERIFYLOGIC.md`
- Functions marked ✅ are working and tested
- When adding a new function, add a row here with status ❌, then change to ✅ when done
