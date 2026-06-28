# ตามรอย — Function Audit vs. NSC 2026 Proposal (v20)
> Cross-reference: `Website - Tamroi - Edited` ↔ `ตามรอย_NSC_2026_v20.md`  
> Generated: 2026-06-27

---

## Phase 1 — Core Loop ✅ DONE

Everything the proposal defines as the fundamental gameplay cycle.

| # | Function (from proposal) | File | Status |
|---|---|---|---|
| 1 | **Authentication** — Google OAuth + Email/Password via Supabase | `supabase-client.js`, `login.html`, `onboarding.html` | ✅ Done |
| 2 | **Fog of War (Map Visibility Fog)** — Leaflet evenodd inverted polygon, per-district fog holes | `map.js` `buildFogLayer()` | ✅ Done |
| 3 | **GPS Check-in** — `watchPosition()`, polygon matching vs. district bounding box | `map.js` `startGPSWatch()` | ✅ Done |
| 4 | **Watchtower markers** — Click → check-in sheet; locked vs. visited state | `map.js` `renderWatchtowers()` | ✅ Done |
| 5 | **Support Node markers** (café/OTOP/landmark) — All 13 districts with IDs; visit tracked in DB | `map.js` `MOCK_NODES`, `visitSupportNode()` | ✅ Done |
| 6 | **Figure markers** — S/A/B/C on map; IDs match Supabase `figures` table | `map.js` `FIGURE_NODES`, `renderFigureNodes()` | ✅ Done |
| 7 | **S/A Encounter gate** — Requires support nodes visited before unlock | `map.js` `canCheckIn()`, `openLegendaryEncounter()` | ✅ Done |
| 8 | **B-Class capture** — Quiz only, no support node gate | `map.js` line `class === 'C' \|\| class === 'B'` | ✅ Done |
| 9 | **C-Class capture** — Instant quiz | `map.js` `openQuizForFigure()` | ✅ Done |
| 10 | **Quiz system** — 4-option multiple choice; correct → capture figure | `map.js` `renderQuizSheet()`, `submitQuizAnswer()` | ✅ Done |
| 11 | **Legacy Score** — DB trigger auto-increments on capture; shown in pill + leaderboard | `supabase-client.js` `Profiles.addLegacyPoints()`, DB trigger | ✅ Done |
| 12 | **Map stats pill (dynamic)** — Explored %, captured count, legacy score from real profile | `app.js` `updateMapStatsPill()`, `map.js` `updateStatsBar()` | ✅ Done |
| 13 | **Onboarding** — Location permission request + home district picker | `onboarding.html`, `map.js` `confirmHome()` | ✅ Done |
| 14 | **Archive/Collection — figure grid** — Load from DB; filter S/A/B/C; B-class pill added | `collection.js` `renderFigures()`, `app.html` filter pills | ✅ Done |
| 15 | **Archive — figure bio modal** — Shows `description`, `era` from DB | `collection.js` `showDetail()`, `app.html` `#modal-figure-bio` | ✅ Done |
| 16 | **Archive — Lore Journal tab** — Unlocked lore entries + chain progress bars | `collection.js` `renderLoreJournal()` | ✅ Done |
| 17 | **Lore nodes** — 20 nodes with real Supabase IDs; proximity unlock; chain completion | `map.js` `LORE_NODES`, `saveLoreUnlock()` | ✅ Done |
| 18 | **Leaderboard** — Legacy score ranking; realtime Supabase subscription | `leaderboard.js` | ✅ Done |
| 19 | **Notifications** — DB-loaded; mark as read; realtime push sub | `app.js` `loadNotifications()`, `subscribeNotifications()` | ✅ Done |
| 20 | **Ayutthaya district** — Fog extends to lat 14.50; King Naresuan (S) + Sri Suriyothai (S) | `map.js` `FOG_OUTER`, `FIGURE_NODES`, `MOCK_DISTRICTS` | ✅ Done |
| 21 | **Seasonal content** — Thai historical date bonuses (Songkran, 14 ตุลา, Chulalongkorn, Father's Day, King's Birthday) | `missions.js` `renderSeasonalContent()` | ✅ Done |
| 22 | **BKK transport bonus** — ×2 multiplier near BTS/MRT stations | `map.js` `getTransportMultiplier()`, `missions.js` `renderBKKBonus()` | ✅ Done |
| 23 | **Sign-out** | `app.js` `btn-signout` | ✅ Done |

---

## Phase 2 — Real Data / DB Wiring ✅ DONE (this session)

Removing all mock IDs and wiring everything to real Supabase rows.

| # | What changed | Status |
|---|---|---|
| 1 | `FIGURE_NODES` rewritten — all 26 map figures use real DB `figures.id` values | ✅ Done |
| 2 | `LORE_NODES` rewritten — all 20 lore nodes use real DB `lore_nodes.id` values | ✅ Done |
| 3 | `MOCK_NODES` — all 40 support nodes now have `id` fields for DB visit tracking | ✅ Done |
| 4 | `MOCK_FIGURES` / `MOCK_ARTIFACTS` / `MOCK_CAPTURES` removed from collection.js | ✅ Done |
| 5 | `userDistrictState` initial values reset to zero / all-fogged — DB overrides on boot | ✅ Done |
| 6 | `supabase-client.js` lore unlock — fixed wrong column `lore_id` → `lore_node_id` | ✅ Done |
| 7 | `MOCK_QUIZ` with deleted figure IDs removed; no-quiz fallback shows error toast | ✅ Done |
| 8 | Map stats pill `map-stat-captured` / `map-stat-legacy` wired to `App.profile` at boot | ✅ Done |
| 9 | `collection.js` DB failure shows toast + empty grid (no fake data fallback) | ✅ Done |
| 10 | `renderStats()` syncs map stat pill elements from capture count | ✅ Done |

---

## Phase 3 — Partial / Needs Decision

These exist in the codebase but rely on **mock/static data**, not DB rows.

### 3A — Missions Tab content
The missions tab has full UI but the data is still designed/static:

| Section | Current State | Proposal Requirement |
|---|---|---|
| **Active Quest** | `MOCK_ACTIVE` hardcoded object (สมเด็จพระเจ้าตากสิน) | Should reflect the user's actual current mission progress from DB |
| **Daily Challenges** | `MOCK_DAILY` array (4 static challenges) | Should be generated/stored in DB per user per day |

> **These are the last two things in the app still using mock data.**  
> The proposal describes them as real gameplay features, not decorative UI.

### 3B — Figure era field
`collection.js` `showDetail()` tries `fig.era || fig.period || fig.district_id`.  
The DB `figures` table schema in the proposal does **not** list an `era` or `period` column — only `id, name_th, name_en, class, legacy_pts, district_id, description, image_emoji, is_active`.

> Currently showing `district_id` as era fallback (e.g. "rattanakosin").  
> This looks wrong in the UI.

---

## Phase 4 — Not Implemented (Proposal Phase 2 / 3 / Future)

These are explicitly listed in the proposal as future or out-of-scope for the current demo:

| Feature | Proposal Section | Notes |
|---|---|---|
| **Real GeoJSON 77-province polygon matching** | §2.1.1 item 4 | Currently uses simplified bounding boxes in `MOCK_DISTRICTS`. Full GeoJSON Polygon Matching would need actual province GeoJSON files |
| **Server-side check-in validation** (GPS Spoofing protection) | §9 item 2 | Proposal mentions Supabase Edge Functions for server-side validation. Current: client-side only |
| **Leaderboard Seasons** (3-month reset + badges) | §1.3.5 item 2 | Not implemented. Would require a cron + badge system |
| **Collaborative Missions** | §11 item 4a | Phase 3 feature. Multi-player check-in at same location |
| **Guild / Party System** | §11 item 4b | Phase 3 feature |
| **Historical Discussion Threads** | §11 item 4c | Phase 3 feature |
| **Raid Encounters** (multi-player S-tier) | §11 item 4d | Phase 3 feature |
| **Historical Vision AI** (photo → lore) | §11 item 3 | Future feature using GPS-scoped image recognition |
| **PWA / Offline support** | §5.2 item 6, §11 item 1 | Future feature |
| **Multi-language (English)** | §11 item 5 | Future feature |

---

## Questions for You

Before I touch Phase 3A, I need answers to these:

### Q1 — Active Mission: should it be real DB data?
The proposal says the Active Quest shows **the user's current progress** toward capturing an S-tier figure (support nodes visited, etc.).  
To make this real I would need a `missions` or `active_quests` table in Supabase, or derive it from `user_districts` + `user_captures`.

**Options:**
- A) **Keep static** — Leave MOCK_ACTIVE as a visual demo only, not interactive. Fine for NSC presentation where judges won't log in and play.
- B) **Derive from DB** — Compute the active mission from: find the first unfogged district where S/A figure isn't captured yet → show its support node progress. No new table needed.
- C) **Add `missions` table** — Full implementation. Most correct but most work.

### Q2 — Daily Challenges: real or static?
**Options:**
- A) **Keep static** — Same 4 challenges every day, visual only.
- B) **DB-driven** — Store daily challenges in Supabase, track completion per user per day.

### Q3 — Figure era / period in the bio card
The DB `figures` table doesn't have an `era` column based on the proposal schema.  
What should the era line show in the collection modal?

**Options:**
- A) **Show the district name** in Thai — e.g. "รัตนโกสินทร์"
- B) **Show the tier + district** — e.g. "S-Class · Ayutthaya"
- C) **Add `era` column to DB** and populate it (e.g. "อยุธยาตอนปลาย", "รัตนโกสินทร์ยุคแรก")
- D) **Hide the era line entirely** — just show the bio description

### Q4 — GeoJSON province polygons
Right now fog/check-in uses simplified square bounding boxes for each district.  
The proposal says 77-province GeoJSON for real polygon matching.

Do you have GeoJSON files for the districts/provinces, or should I write a script to generate them from a public source?

### Q5 — Home district default
For judges demoing without GPS, the map currently starts with all districts fogged.  
Should the demo default to Rattanakosin unfogged (so there's something to see immediately), or leave it fully fogged and let them use the "set home" flow?

---

## Summary Table

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Core gameplay loop (fog, GPS, quiz, capture, leaderboard, lore, collection) | ✅ Complete |
| **Phase 2** | Real Supabase data wired in; all mock IDs removed | ✅ Complete |
| **Phase 3A** | Active Mission + Daily Challenges from DB | ⏳ Awaiting Q1/Q2 answer |
| **Phase 3B** | Figure era field fix | ⏳ Awaiting Q3 answer |
| **Phase 4** | GeoJSON, server validation, leaderboard seasons, multi-player, AI, PWA | ❌ Future / out of scope for NSC demo |
