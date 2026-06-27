# VERIFYLOGIC — ตามรอย Game Logic, Intent & Verification
> Cross-reference: `Website - Tamroi - Edited` ↔ `ตามรอย_NSC_2026_v20.md`
> See also: `FUNCTION_AUDIT.md` (code-level status)
> Date: 2026-06-27

---

## 1. How The Game Is Intended To Be Played

The core concept is "**trace the footsteps**" — players physically travel to real historical locations in Thailand, unlock knowledge tied to those places, capture historical figures, and build a mental map of Thai history through experience rather than memorisation.

### Player Journey (start to finish)

```
Open App
  → Login (Google OAuth or Email)
  → Location permission request
  → Onboarding: pick Home District
       ↓ (home fog auto-clears, +50 pts)
  → Main Map (Thailand covered in dark fog)
       ↓
  Go to a real place
       ↓
  Fog clears as you enter a district
       ↓
  Explore Support Nodes in that district
  (cafés ☕ / OTOP shops 🏪 / landmarks 🏛️)
       ↓
  Unlock the Legendary Encounter for S/A figures
       ↓
  Pass the Quiz
       ↓
  Capture the Historical Figure → Card added to Archive
       ↓
  Proximity triggers Lore nodes → historical narratives unlock
       ↓
  Legacy Score climbs → Leaderboard rank improves
       ↓
  New districts beckon (fog still covers most of Thailand)
```

The **key design principle** from the proposal: "Learning as Gateway, not Reward." You must read lore and visit support nodes *before* you can capture — the capture is the outcome of learning, not the shortcut to it.

---

## 2. Game Systems & Rules

### 2.1 Fog of War (Map Visibility Fog)

| Rule | Detail |
|------|--------|
| **Initial state** | Entire Thailand covered in dark fog (`#0d0c1d`, 80% opacity) |
| **Home district** | Auto-cleared on onboarding. Grants +50 pts. |
| **Clearing fog** | Must physically enter a district and check in at its Watchtower |
| **Granularity** | Fog clears one district at a time (~1 km² sector per proposal), not an entire province at once |
| **What appears on clear** | Support nodes, figure markers, and lore nodes for that district become visible |
| **S/A figures** | Appear as **Phase-Locked** (lock overlay) even after fog clears — require support node gate first |
| **Map stat** | "Explored %" = (districts cleared / total) × 100 |

### 2.2 Historical Figure Rarity Tiers

| Tier | Historical Criteria | Capture Method | Legacy Points |
|------|---------------------|----------------|--------------|
| **S** | National/civilisational impact: founded kingdoms, won major wars, changed governance (e.g. พระนเรศวร, รัชกาลที่ 5) | Support node gate → Multi-part quiz (3 questions, all correct) | 500 pts |
| **A** | Regional/social impact: changed culture, national thought (e.g. สุนทรภู่, ปรีดี พนมยงค์) | Support node gate → Multi-part quiz (3 questions, all correct) | 200 pts |
| **B** | Notable in a specific era or area, backed by historical evidence | Quiz only (1 question, no support gate) | 100 pts |
| **C** | Local/community-level role, adds context to a place (e.g. "Bangkok Fishermen") | Instant capture — quiz is optional or trivial | 50 pts |

Tier is determined by **Historical Impact Criteria** across 3 dimensions: (1) scope of impact, (2) durability of impact to present day, (3) archaeological/documentary evidence. Never assigned by AI alone.

### 2.3 Support Node Gate (Unlocking S/A Captures)

Before you can attempt the quiz for an S or A-class figure, you must visit support nodes in that district:

| Node Type | Minimum Required |
|-----------|-----------------|
| Local Cafés ☕ | 2 |
| OTOP / Workshops 🏪 | 1 |
| Secondary Landmarks 🏛️ | 3 |

This is per-district. Once all 3 thresholds are met, the **"Legendary Encounter"** button unlocks in the check-in sheet.

**Why support nodes?** They represent absorbing the local context — community knowledge, local culture, secondary historical sites — before meeting a major historical figure. This enforces the Situated Learning principle: learn in context before the exam.

### 2.4 Quiz Rules

| Rule | C-Class | B-Class | S/A-Class |
|------|---------|---------|-----------|
| Question type | Multiple-choice, 4 options | Multiple-choice, 4 options | Multiple-choice, 4 options |
| Number of questions | 1 | 1 | 3 (sequential) |
| Pass condition | Answer correctly | Answer correctly | All 3 correct |
| Fail state | Not yet defined — currently assumed retry | Not yet defined | Not yet defined |
| Bloom's level | Remember (recall facts) | Remember | Understand (explain relationships) |
| Result on pass | Figure captured, added to Archive, Legacy Score +pts | Same | Same |

### 2.5 Lore System

| Rule | Detail |
|------|--------|
| **Trigger** | GPS proximity — player must be within `radius_m` (80–150m) of the lore node's coordinates |
| **UI** | Proximity banner appears: "Nearby Historic Place" |
| **Action** | Tap to read → "Save to Journal" button |
| **Persistence** | Saved to `user_lore` in Supabase + `tam_roi_lore_unlocked` in localStorage |
| **Chain lore** | Some lore is part of a 3-part series (`chain_id`, `chain_part`). Each part unlocks independently by proximity. |
| **Chain bonus** | Completing all 3 parts of a chain grants +50 pts bonus on top of individual node points |
| **Lore in Archive** | Lore Journal tab in Collection groups entries by chain with progress bars |
| **Lore does NOT unlock on capture** | Lore requires physical proximity. Capturing a figure alone does NOT unlock its associated lore. |

**Lore chains in the current dataset:**
- Rattanakosin Founding (3 parts): City Walls → Grand Palace → Wat Phra Kaew
- 1932 Revolution (3 parts): Royal Plaza → Democracy Monument → Thammasat University
- Ayutthaya Glory (3 parts): Wat Phra Si Sanphet → Elephant Duel → Wat Yai Chaimongkol

### 2.6 Scoring — Legacy Score

| Source | Base Points | Notes |
|--------|-------------|-------|
| Capture C-Class figure | 50 | Before multipliers |
| Capture B-Class figure | 100 | |
| Capture A-Class figure | 200 | |
| Capture S-Class figure | 500 | |
| Unlock a lore node | 25–50 | Varies per node |
| Complete a 3-part lore chain | +50 bonus | On top of the 3 node points |
| District check-in | 150 | ×2 if near BTS/MRT |
| Home district (onboarding) | 50 | One-time |

**Multipliers:**
| Trigger | Multiplier | Applied To |
|---------|-----------|-----------|
| Within 300m of BTS/MRT station | ×2 | All points earned in that session |
| Songkran (Apr 13–15) | ×2 | All figures |
| 14 October Uprising (Oct 14) | ×1.5 | Lore nodes only |
| Chulalongkorn Day (Oct 23) | ×2 | S-Class figures only |
| Father's Day (Dec 5) | ×1.5 | District check-ins |
| King's Birthday (Jul 28) | ×2 | All figures |

Legacy Score is **auto-updated by Supabase DB trigger** — no client-side manual calculation. The trigger fires immediately when a `user_captures` row is inserted.

### 2.7 Leaderboard

| Rule | Detail |
|------|--------|
| **3 metrics** | Legacy Score (primary), Map Discovery %, Archive Count |
| **3 time periods** | All Time, This Month, This Week |
| **Real-time** | Updates via Supabase Realtime Subscriptions |
| **Top 3 podium** | Gold/Silver/Bronze with crown on 1st place |
| **"My Rank" card** | Highlighted row showing your own position |
| **Seasons (proposal)** | Reset every 3 months; Top 3 earns permanent Historical Badge in profile. **Not yet implemented.** |

### 2.8 Progression Gates — Full Unlock Sequence

```
District fog still active
   → Must enter district physically (GPS polygon match)
   → District fog clears
   → C/B figures visible and immediately accessible
   → S/A figures visible but PHASE LOCKED

Phase-locked S/A figure
   → Must visit: 2 cafés + 1 OTOP + 3 landmarks in this district
   → "Legendary Encounter" button unlocks in check-in sheet
   → Must be within 500m of district center to tap Check In
   → Quiz opens (3-part for S/A)
   → Pass all 3 → Figure captured

Lore nodes (independent of capture)
   → Must be physically within 80–150m of node coordinates
   → Proximity banner triggers
   → Tap to read → save to journal

Archive
   → Captured figures appear in Collection grid
   → Figure bio modal unlocks on capture
   → Lore Journal entries grouped by chain
   → Chain progress bar fills as each part is discovered
```

---

## 3. All Features & Unlock Conditions

| Feature | How It Unlocks | Available Without GPS? |
|---------|----------------|----------------------|
| Map (fog visible) | Immediate on login | Yes |
| Home district fog clear | Onboarding district picker | No — GPS or manual pick |
| District fog clear | Physically enter district (GPS polygon match) | No |
| Support node visit | Be at node location + tap "Visit" | No (dev mode bypasses) |
| C/B-Class figure card | Pass 1-question quiz in cleared district | Figure must be in cleared district |
| S/A-Class figure card | Clear district + visit all support nodes + pass 3-part quiz | No |
| Lore node unlock | Be within radius_m of lore coords | No |
| Lore chain bonus (+50) | Unlock all 3 parts of the chain | No |
| Legacy Score increase | Any capture or lore unlock | Via capture/lore above |
| Archive Collection | Accumulates on each capture | Viewable any time after login |
| Lore Journal | Accumulates on each lore unlock | Viewable any time after login |
| Leaderboard | Available immediately after login | Yes (read-only without GPS) |
| Missions Tab (Active Quest) | Available any time — **but still mock data** | Yes |
| Seasonal multipliers | Automatic on eligible calendar dates | N/A (calendar-based) |
| BTS/MRT transport bonus | Automatic when GPS is within 300m of a station | No |
| Notifications | Auto-generated by Supabase on fog/capture/rank events | Yes (passive) |

---

## 4. Verification Against Current Project

### ✅ DONE — Fully Working

All items from **FUNCTION_AUDIT Phase 1 (23 items)** and **Phase 2 (10 items)** are complete. Summary:

| System | Status | Key File |
|--------|--------|----------|
| Authentication (Google OAuth + Email) | ✅ | `supabase-client.js`, `login.html` |
| Fog of War — Leaflet evenodd polygon | ✅ | `map.js` `buildFogLayer()` |
| GPS watchPosition + district polygon match | ✅ | `map.js` `startGPSWatch()` |
| Watchtower markers (locked/visited state) | ✅ | `map.js` `renderWatchtowers()` |
| Support node markers + visit tracking | ✅ | `map.js` `MOCK_NODES`, `visitSupportNode()` |
| Figure markers (S/A/B/C on map) | ✅ | `map.js` `FIGURE_NODES` |
| S/A encounter gate (support node check) | ✅ | `map.js` `canCheckIn()` |
| B + C class capture (quiz only) | ✅ | `map.js` lines for class === 'B'/'C' |
| Quiz system (4-option, correct → capture) | ✅ | `map.js` `renderQuizSheet()` |
| Legacy Score via Supabase DB trigger | ✅ | `supabase-client.js`, DB trigger |
| Map stats pill (live from DB profile) | ✅ | `app.js` `updateMapStatsPill()` |
| Onboarding flow | ✅ | `onboarding.html` |
| Archive — figure grid (filter S/A/B/C) | ✅ | `collection.js` `renderFigures()` |
| Archive — figure bio modal | ✅ | `collection.js` `showDetail()` |
| Archive — Lore Journal + chain progress | ✅ | `collection.js` `renderLoreJournal()` |
| Lore nodes (proximity unlock, chains) | ✅ | `map.js` `LORE_NODES`, `saveLoreUnlock()` |
| Leaderboard (realtime Supabase sub) | ✅ | `leaderboard.js` |
| Notifications (DB + realtime push) | ✅ | `app.js` `loadNotifications()` |
| Ayutthaya district (King Naresuan + Sri Suriyothai) | ✅ | `map.js` `MOCK_DISTRICTS` |
| Seasonal date bonuses | ✅ | `missions.js` `renderSeasonalContent()` |
| BTS/MRT ×2 transport bonus | ✅ | `map.js` `getTransportMultiplier()` |
| All 26 figures wired to real Supabase IDs | ✅ | `map.js` `FIGURE_NODES` |
| All 20 lore nodes wired to real Supabase IDs | ✅ | `map.js` `LORE_NODES` |
| All 40 support nodes have real DB IDs | ✅ | `map.js` `MOCK_NODES` |

---

### ⚠️ NEEDS FIX — Logic Is Present But Broken / Wrong

#### Fix 1 — Figure Bio "Era" field shows wrong data
- **File:** `collection.js` `showDetail()` line: `fig.era || fig.period || fig.district_id`
- **Problem:** The `figures` DB table has no `era` or `period` column. Fallback displays raw `district_id` string (e.g. "rattanakosin") in the bio modal, which looks wrong.
- **What the proposal expects:** A human-readable era label (e.g. "อยุธยาตอนปลาย", "รัตนโกสินทร์ยุคแรก") — but this column doesn't exist in the DB schema.
- **Fix options (your call):**
  - A) Add `era` column to `figures` table and populate it
  - B) Show "S-Class · รัตนโกสินทร์" (tier + district name in Thai)
  - C) Hide the era line entirely and just show description

#### Fix 2 — Quiz fail state undefined
- **File:** `map.js` `submitQuizAnswer()`
- **Problem:** The current code handles a correct answer (capture succeeds). There is no visible behaviour defined for a *wrong* answer — does the sheet close? Does the player retry? Is there a penalty?
- **What the proposal implies:** Quiz failure should not instantly allow retry (that defeats the purpose). A cooldown or "try again after visiting more nodes" flow would fit the design intent.
- **Fix needed:** Define and implement a fail state: show "incorrect" feedback, then either allow immediate retry or dismiss and require the player to re-open the encounter.

#### Fix 3 — Check-in range tolerance uses square bounding boxes, not polygons
- **File:** `map.js` `canCheckIn()`, `MOCK_DISTRICTS`
- **Problem:** District "polygons" in the code are simplified rectangular bounding boxes, not real geographic polygons. The proposal requires real GeoJSON polygon matching to determine if a user is inside a district.
- **Impact:** A player could be outside a district's actual boundary but inside its bounding box and still trigger a check-in. Less severe for Bangkok districts (roughly rectangular) but wrong for irregular provinces.
- **Fix required for full proposal compliance:** Load actual GeoJSON data for each district and use point-in-polygon (e.g. `leaflet-pip` or `turf.js`). See Phase 4 note below.

---

### ❌ NOT YET DONE — Needs To Be Built

#### Add 1 — Active Mission tab: real DB data (Phase 3A)
- **File:** `missions.js` — `MOCK_ACTIVE` is still hardcoded to สมเด็จพระเจ้าตากสิน with static step counts
- **What it should do:** Derive the active mission dynamically — find the first district the user has unfogged but hasn't captured the S/A figure yet, show current support node progress (cafés/OTOP/landmarks visited vs. required), and display it live.
- **Simplest approach:** Query `user_districts` for unfogged districts where `user_captures` does not contain the S-class figure for that district → show the first one as Active Quest. No new DB table needed.
- **Proposal section:** §2.1.2 Capture Loop, §1.2.2 System Workflow

#### Add 2 — Daily Challenges: real or remove (Phase 3A)
- **File:** `missions.js` — `MOCK_DAILY` is 4 static hardcoded challenges
- **What it should do per proposal:** Challenges should be dynamic — different each day, completable once, tracked per user. E.g. "Visit 2 lore nodes today", "Check in to a new district", "Capture a B-class figure".
- **Simplest approach:** Either (a) store a `daily_challenges` table in Supabase and generate tasks server-side, or (b) accept that for the NSC demo this remains static/visual.
- **Proposal section:** §1.3.5 (Seasonal content + Leaderboard Seasons implies dynamic challenge cadence)

#### Add 3 — Quiz retry / fail flow
- See Fix 2 above. The system needs a defined failure state before the app is feature-complete.

---

### 📋 FUTURE / OUT OF SCOPE (Proposal Phase 2–3)

These are explicitly described in the proposal as next-phase or future work. They are **not** required for the NSC demo.

| Feature | Proposal Section |
|---------|-----------------|
| Real GeoJSON 77-province polygon matching | §2.1.1 item 4, §9 item 3 |
| Server-side check-in validation (GPS spoofing protection via Edge Functions) | §9 item 2 |
| Leaderboard Seasons (3-month reset + permanent Historical Badges) | §1.3.5 item 2 |
| Collaborative Missions (multi-player check-in at same location) | §10.2 / Phase 3 |
| Guild / Party System | Phase 3 |
| Historical Discussion Threads | Phase 3 |
| Raid Encounters (multi-player S-tier) | Phase 3 |
| Historical Vision AI (photo → lore unlock) | §11 item 3 |
| PWA / Offline support | §5.2 item 6 |
| Full English language support | §11 item 5 |
| Leaderboard Discovery % and Archive metrics beyond Legacy Score | Partially present in leaderboard UI |

---

## 5. Summary

| Phase | What | Status |
|-------|------|--------|
| **Core Loop** | Fog, GPS, quiz, capture, lore, leaderboard, archive, notifications, onboarding | ✅ Complete |
| **Real Data** | All 26 figures, 20 lore nodes, 40 support nodes wired to Supabase | ✅ Complete |
| **Fix 1** | Figure bio modal "era" field shows district ID string | ⚠️ Needs fix |
| **Fix 2** | Quiz wrong-answer flow is undefined | ⚠️ Needs fix |
| **Fix 3** | Bounding-box polygon vs. real GeoJSON polygon matching | ⚠️ Low priority for demo |
| **Add 1** | Active Mission derived from real user progress | ❌ Not built |
| **Add 2** | Daily Challenges — live or remove | ❌ Not built |
| **Future** | GeoJSON, server validation, seasons, multiplayer, PWA, AI, English | 📋 Out of scope |

**Bottom line:**
The core gameplay loop is **fully functional** end-to-end. The two items blocking a "complete per proposal" status are the Missions tab (still showing static mock data) and the quiz fail state (undefined). The era field cosmetic fix is small. Everything else is either done or intentionally deferred.
