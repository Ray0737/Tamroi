# VERIFYLOGIC — ตามรอย Game Logic, Intent & Agent Task Board
> Cross-reference: `Website - Tamroi - Edited` ↔ `ตามรอย_NSC_2026_v20.md`
> See also: `FUNCTION_LOG.md` (code-level status), `AGENTS.md` (coding rules)
> Last updated: 2026-06-27

---

## STANDING RULE — NO MOCK DATA

**All features must use real Supabase data. No `MOCK_*` constant or hardcoded array may appear in a user-facing code path.**

If Supabase is unavailable (network error), show an error state (toast + empty UI). Never fall back to fake data silently — that would make the NSC demo misleading.

---

## STANDING RULE — FUNCTION DOCUMENTATION

**Every function you add or modify must be logged in `docs/FUNCTION_LOG.md`.**  
Format: one row per function with file, function name, what it does, what Supabase table(s) it touches, and current status. See Section 7 for the template.

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

### 2.4 Quiz Rules

| Rule | C-Class | B-Class | S/A-Class |
|------|---------|---------|-----------|
| Question type | Multiple-choice, 4 options | Multiple-choice, 4 options | Multiple-choice, 4 options |
| Number of questions | 1 | 1 | 3 (sequential) |
| Pass condition | Answer correctly | Answer correctly | All 3 correct |
| **Fail state** | Show "wrong answer" feedback; allow immediate retry | Same | Show "wrong answer" feedback; dismiss quiz; require re-tap to retry |
| Bloom's level | Remember (recall facts) | Remember | Understand (explain relationships) |
| Result on pass | Figure captured, added to Archive, Legacy Score +pts | Same | Same |

### 2.5 Lore System

| Rule | Detail |
|------|--------|
| **Trigger** | GPS proximity — player must be within `radius_m` (80–150m) of the lore node's coordinates. Auto-opens **once per lore node** on first arrival, even across page reloads — a "seen" flag persists to `tam_roi_lore_seen` in localStorage so lingering or re-entering the radius does not reopen the sheet. |
| **UI** | Proximity banner appears: "Nearby Historic Place" (first arrival only) |
| **Action** | Tap to read → "Save to Journal" button. After the first auto-open, the lore node renders as a tappable map marker — re-open it any time by tapping the marker (`openVisitedLore()`) instead of walking back into the radius. |
| **Persistence** | Saved to `user_lore` in Supabase + `tam_roi_lore_unlocked` in localStorage |
| **Chain lore** | Some lore is part of a 3-part series (`chain_id`, `chain_part`). Each part unlocks independently by proximity. |
| **Chain bonus** | Completing all 3 parts of a chain grants +50 pts bonus on top of individual node points |
| **Lore in Archive** | Lore Journal tab in Collection groups entries by chain with progress bars |
| **Lore does NOT unlock on capture** | Lore requires physical proximity. Capturing a figure alone does NOT unlock its associated lore. |
| **review_status filter** | Only lore where `review_status = 'approved'` should appear in the app. Pending/rejected lore must be invisible to users. |
| **source_ref gate** | Any lore node where `source_ref` is NULL or empty must NOT display in the app. This is an NSC content accuracy requirement. |

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
| Active Mission | Derived from real user_districts + user_captures data | Yes (read-only) |
| Daily Challenges | From DB daily_challenges table, per user per day | Yes (read-only) |
| Seasonal multipliers | Automatic on eligible calendar dates | N/A (calendar-based) |
| BTS/MRT transport bonus | Automatic when GPS is within 300m of a station | No |
| Notifications | Auto-generated by Supabase on fog/capture/rank events | Yes (passive) |

---

## 4. Verification Against Current Project

### ✅ DONE — Fully Working

All items from the Phase 1 (23 items) and Phase 2 (10 items) function audit are complete (audit doc since removed; history in git). Summary:

| System | Status | Key File |
|--------|--------|----------|
| Authentication (Google OAuth + Email) | ✅ | `supabase-client.js`, `login.html` |
| Fog of War — MapLibre GeoJSON polygon (ring winding) | ✅ | `map.js` `buildFogLayer()` |
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
- **What the proposal expects:** A human-readable era label (e.g. "อยุธยาตอนปลาย", "รัตนโกสินทร์ยุคแรก")
- **Chosen fix:** Add `era` column to `figures` table (TEXT, nullable) and populate it. Show "S-Class · [era]" in the bio modal. If `era` is NULL, show "[class]-Class · [district name in Thai]" as fallback.
- **Agent task:** (1) Write SQL `ALTER TABLE figures ADD COLUMN era TEXT;` and add to a new `supabase/patch_era.sql`. (2) Populate `era` for all 26 figures. (3) Update `showDetail()` to use `fig.era` directly.

#### Fix 2 — Quiz fail state undefined
- **File:** `map.js` `submitQuizAnswer()`
- **Problem:** The current code handles a correct answer (capture succeeds). Wrong answers have no visible behaviour.
- **What the proposal requires:** B/C fail → show "ตอบผิด" feedback with correct answer highlighted in red; allow one immediate retry. S/A fail → show "ตอบผิด" + dismiss the quiz sheet; player must re-open the Legendary Encounter to retry. No penalty points.
- **Agent task:** In `submitQuizAnswer()`, add an `else` branch for wrong answers. For S/A (multi-question), reset `currentQuestionIndex` and close the sheet. For B/C, re-render the question with the correct answer highlighted. Log this in `FUNCTION_LOG.md`.

#### Fix 3 — Lore `review_status` not filtered in queries
- **File:** `supabase-client.js` `Lore.getNodes()` (or wherever lore nodes are fetched)
- **Problem:** The `lore_nodes` table has `review_status CHECK('pending','approved','needs_edit','rejected')`. The frontend may be fetching all lore nodes regardless of status.
- **What the proposal requires (§2.8.3):** Only `review_status = 'approved'` lore is visible to users.
- **Agent task:** In `supabase-client.js`, ensure every `lore_nodes` query includes `.eq('review_status', 'approved')`. Also ensure the Supabase RLS public SELECT policy on `lore_nodes` is `WHERE is_active = true AND review_status = 'approved'` — update `supabase/schema.sql` if needed.

#### Fix 4 — `source_ref` gate not enforced
- **File:** `supabase-client.js` lore queries, `map.js` `LORE_NODES`
- **Problem:** The proposal (§2.10.3) states content with empty `source_ref` must NOT display. This gate is not currently enforced in client queries.
- **Agent task:** Add `.not('source_ref', 'is', null).neq('source_ref', '')` to every `lore_nodes` and `quiz_questions` Supabase query. This filters out any content that hasn't been source-verified.

#### Fix 5 — Check-in range uses bounding boxes, not real polygons
- **File:** `map.js` `canCheckIn()`, `MOCK_DISTRICTS`
- **Problem:** District "polygons" are simplified rectangular bounding boxes, not real GeoJSON polygons.
- **Impact for NSC demo:** Low — Bangkok districts are roughly rectangular. Accept this limitation for now.
- **Status:** Deferred to post-NSC (real GeoJSON 77-province matching is listed as Phase 2 future work).

---

### ❌ NOT YET DONE — Needs To Be Built

#### Task A — Active Mission tab: replace `MOCK_ACTIVE` with real DB data

**Priority: HIGH — last remaining mock data in user-facing code**

- **File:** `missions.js`
- **Current state:** `MOCK_ACTIVE` is a hardcoded object for สมเด็จพระเจ้าตากสิน with static step counts.
- **Required behaviour:**
  1. Query `user_districts` for districts where `fogged = false` (user has visited).
  2. For each unfogged district, check `user_captures` for whether the S-class figure in that district has been captured.
  3. Find the first district where the S-class figure is NOT yet captured → that's the active mission.
  4. Show: figure name (from `figures` table), district name, and live support node progress from `user_districts.cafes_visited`, `otops_visited`, `landmarks_visited` vs. required thresholds.
  5. If all S-class figures are captured → show "All missions complete" state.
  6. If no district is unfogged yet → show "Explore a new district to start a mission" state.
- **Supabase tables used:** `user_districts`, `user_captures`, `figures`, `districts`
- **Agent implementation steps:**
  1. In `supabase-client.js`, add `DB.Missions.getActiveMission(userId)` — joins `user_districts` with `figures` to find first incomplete S/A mission.
  2. In `missions.js`, replace `MOCK_ACTIVE` usage with `await DB.Missions.getActiveMission(userId)`.
  3. Render the result into the existing Active Quest card UI (`#active-mission-card`).
  4. If DB call fails → show empty state card, not mock data.
- **No new DB table needed.** Use existing tables.
- **Proposal reference:** §2.1.2 Capture Loop, §1.2.2 System Workflow

#### Task B — Daily Challenges: replace `MOCK_DAILY` with real DB data

**Priority: MEDIUM**

- **File:** `missions.js`
- **Current state:** `MOCK_DAILY` is an array of 4 static hardcoded challenges.
- **Required behaviour (simplest approach for NSC demo):**
  1. Add a `daily_challenges` table to Supabase with columns: `id, title_th, title_en, type CHECK('lore','checkin','capture','quiz'), target_count, pts_reward, is_active`.
  2. Seed 4-6 recurring challenge rows (same each day for NSC demo is acceptable).
  3. Add a `user_daily_progress` table: `user_id, challenge_id, date DATE, current_count, completed BOOLEAN` — unique on `(user_id, challenge_id, date)`.
  4. On app load, create today's progress rows if they don't exist (upsert).
  5. Increment `current_count` when the user completes a relevant action (lore unlock, check-in, capture, quiz).
  6. Render challenges from DB, showing live progress.
- **SQL files to create/update:** Add `supabase/patch_daily_challenges.sql`
- **Supabase tables to add:** `daily_challenges`, `user_daily_progress`
- **Agent implementation steps:**
  1. Write `supabase/patch_daily_challenges.sql` (create tables + seed 4 challenges).
  2. Add `DB.Missions.getDailyChallenges(userId)` and `DB.Missions.updateChallengeProgress(userId, type)` to `supabase-client.js`.
  3. Call `updateChallengeProgress` at the end of: `saveLoreUnlock()`, `submitQuizAnswer()` (correct), `visitSupportNode()`, and the watchtower check-in handler.
  4. Replace `MOCK_DAILY` in `missions.js` with a DB call.
  5. Log all 4 new functions in `FUNCTION_LOG.md`.
- **Proposal reference:** §1.3.5 (Seasonal content + challenge cadence)

#### Task C — Lore Reading Depth tracking

**Priority: LOW (NSC evaluation metric, not gameplay)**

- **File:** `app.js` or `map.js` lore sheet rendering
- **Proposal requirement (§8.2):** Users must spend ≥30 seconds on a lore sheet AND scroll ≥70% of the content before the lore is counted as "read" for behavioural analytics.
- **Implementation:**
  1. When lore sheet opens, record `loreOpenTime = Date.now()`.
  2. Add a scroll listener on the lore sheet content div; track max scroll depth as `(scrollTop + clientHeight) / scrollHeight`.
  3. When lore sheet closes (or "Save to Journal" is tapped), check: `(Date.now() - loreOpenTime) >= 30000 && maxScrollDepth >= 0.7`.
  4. If both met, mark as "deeply read" — store in `user_lore.read_depth_met BOOLEAN` (add this column).
  5. This metric is for NSC evaluation — does not affect gameplay points.
- **SQL:** Add `ALTER TABLE user_lore ADD COLUMN read_depth_met BOOLEAN DEFAULT false;` to a new `supabase/patch_lore_depth.sql`.

#### Task D — Profile Settings: Account Deletion & Location Control

**Priority: LOW (PDPA compliance, §2.7)**

- **File:** The settings offcanvas in `app.html` / `app.js`
- **Required by proposal (§2.7):**
  1. Users can view and revoke location permission from settings.
  2. Users can delete their account + all data within 30 days of request.
- **Implementation:**
  1. Add "Delete Account" button to the settings offcanvas.
  2. Show a confirmation modal ("This will delete all your progress permanently").
  3. On confirm: call `DB.Auth.deleteAccount(userId)` which deletes from `profiles`, `user_districts`, `user_captures`, `user_lore`, `user_support_node_visits`, `user_quiz_attempts`, then calls `supabase.auth.signOut()`.
  4. For location: show current permission status (read from browser). Link to browser permission settings. Cannot revoke programmatically, but must show instructions.
- **Note:** Supabase service-role is needed for user deletion from `auth.users`. Use a Supabase Edge Function `delete-account` for this — do NOT put service-role key in client code.

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
| Session duration tracking (§8.2) | Post-NSC analytics |

---

## 5. Agent Implementation Instructions

This section gives step-by-step coding instructions for agents picking up open tasks. Read `AGENTS.md` for coding rules before starting.

---

### INSTRUCTION SET A — Fix Quiz Fail State (Fix 2)
**File:** `js/map.js` → `submitQuizAnswer()`  
**Effort:** ~30 min

1. Locate `submitQuizAnswer()` in `map.js`. Find the `if (isCorrect)` block.
2. Add an `else` block:
   ```js
   } else {
     // Wrong answer
     const opts = sheet.querySelectorAll('.quiz-option');
     opts.forEach(btn => {
       btn.disabled = true;
       if (btn.dataset.option === correctOption) btn.classList.add('quiz-correct');
       if (btn.dataset.option === chosenOption) btn.classList.add('quiz-wrong');
     });
     const feedbackEl = sheet.querySelector('.quiz-feedback') || (() => {
       const el = document.createElement('p');
       el.className = 'quiz-feedback text-danger mt-2 small';
       sheet.querySelector('.quiz-body').appendChild(el);
       return el;
     })();
     feedbackEl.textContent = 'ตอบผิด — ลองใหม่อีกครั้ง';
     
     if (fig.class === 'S' || fig.class === 'A') {
       // S/A: dismiss after 2s, require re-open
       setTimeout(() => { window.AppCore.closeAllSheets(); }, 2000);
     } else {
       // B/C: re-enable after 1.5s for immediate retry
       setTimeout(() => {
         opts.forEach(btn => {
           btn.disabled = false;
           btn.classList.remove('quiz-correct', 'quiz-wrong');
         });
         feedbackEl.textContent = '';
       }, 1500);
     }
   }
   ```
3. Add CSS for `.quiz-correct` (green bg) and `.quiz-wrong` (red bg) in `css/components.css`.
4. Test: open a B-class quiz, answer wrong → feedback appears → retry allowed. Open an S-class quiz, answer one wrong → sheet closes.
5. Log in `docs/FUNCTION_LOG.md`.

---

### INSTRUCTION SET B — Fix Figure Bio Era Field (Fix 1)
**Files:** `supabase/` (new SQL patch), `js/collection.js` `showDetail()`  
**Effort:** ~45 min

1. Create `supabase/patch_era.sql`:
   ```sql
   ALTER TABLE figures ADD COLUMN IF NOT EXISTS era TEXT;
   -- Populate for current 26 figures
   UPDATE figures SET era = 'อยุธยาตอนต้น' WHERE id = 'naresuan';
   UPDATE figures SET era = 'รัตนโกสินทร์ยุคแรก' WHERE id = 'rama5';
   -- ... fill in all 26
   ```
2. Run this SQL in Supabase SQL Editor.
3. In `collection.js` `showDetail()`, replace:
   ```js
   fig.era || fig.period || fig.district_id
   ```
   with:
   ```js
   fig.era || `${fig.class}-Class · ${fig.district_id}`
   ```
4. Verify: open Collection, tap a figure → bio modal shows era correctly, not district ID.
5. Log in `docs/FUNCTION_LOG.md`.

---

### INSTRUCTION SET C — Fix Lore review_status Filter (Fix 3 + Fix 4)
**File:** `js/supabase-client.js`  
**Effort:** ~20 min

1. Find every `.from('lore_nodes')` query in `supabase-client.js`.
2. Add to each: `.eq('review_status', 'approved').not('source_ref', 'is', null).neq('source_ref', '')`
3. Find every `.from('quiz_questions')` query and add: `.not('source_ref', 'is', null).neq('source_ref', '')`
4. Update the Supabase RLS policy for `lore_nodes` public SELECT in `supabase/schema.sql`:
   ```sql
   CREATE POLICY "Public lore read" ON lore_nodes
   FOR SELECT USING (is_active = true AND review_status = 'approved');
   ```
5. Test: ensure quiz questions and lore nodes without `source_ref` don't appear.
6. Log in `docs/FUNCTION_LOG.md`.

---

### INSTRUCTION SET D — Active Mission from Real DB (Task A)
**Files:** `js/supabase-client.js`, `js/missions.js`  
**Effort:** ~2 hours  
**No new DB tables needed**

**Step 1 — Add `DB.Missions.getActiveMission(userId)` to `supabase-client.js`:**
```js
async getActiveMission(userId) {
  // 1. Get all districts the user has unfogged
  const { data: visited } = await window._supabase
    .from('user_districts')
    .select('district_id, cafes_visited, otops_visited, landmarks_visited')
    .eq('user_id', userId)
    .eq('fogged', false);
  if (!visited || visited.length === 0) return null;

  // 2. Get all S+A figures captured by this user
  const { data: captures } = await window._supabase
    .from('user_captures')
    .select('figure_id')
    .eq('user_id', userId);
  const capturedIds = new Set((captures || []).map(c => c.figure_id));

  // 3. For each unfogged district, find an S/A figure not yet captured
  for (const ud of visited) {
    const { data: fig } = await window._supabase
      .from('figures')
      .select('id, name_th, name_en, class, district_id')
      .eq('district_id', ud.district_id)
      .in('class', ['S', 'A'])
      .eq('is_active', true)
      .limit(1)
      .single();
    if (fig && !capturedIds.has(fig.id)) {
      // Found an active mission
      const { data: dist } = await window._supabase
        .from('districts')
        .select('name_th, required_cafes, required_otops, required_landmarks')
        .eq('id', ud.district_id)
        .single();
      return {
        figure: fig,
        district: dist,
        progress: {
          cafes: ud.cafes_visited,
          otops: ud.otops_visited,
          landmarks: ud.landmarks_visited
        }
      };
    }
  }
  return 'complete'; // All missions done
}
```

**Step 2 — Update `missions.js`:**
1. Remove `const MOCK_ACTIVE = { ... }` entirely.
2. In the missions init function, replace `MOCK_ACTIVE` usage with:
   ```js
   const mission = await window.DB.Missions.getActiveMission(userId);
   if (!mission) {
     renderNoMission(); return;
   }
   if (mission === 'complete') {
     renderAllComplete(); return;
   }
   renderActiveMission(mission);
   ```
3. `renderActiveMission(mission)` should update the existing Active Quest card: title = mission.figure.name_th, district = mission.district.name_th, progress bars for cafes/otops/landmarks.
4. Handle DB failure → show empty state card with "ไม่สามารถโหลดภารกิจได้" message. No mock fallback.
5. Log all new/changed functions in `docs/FUNCTION_LOG.md`.

---

### INSTRUCTION SET E — Daily Challenges from Real DB (Task B)
**Files:** `supabase/patch_daily_challenges.sql` (new), `js/supabase-client.js`, `js/missions.js`  
**Effort:** ~3 hours

**Step 1 — Create `supabase/patch_daily_challenges.sql`:**
```sql
CREATE TABLE IF NOT EXISTS daily_challenges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title_th TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lore','checkin','capture','quiz')),
  target_count INT NOT NULL DEFAULT 1,
  pts_reward INT NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_daily_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT REFERENCES daily_challenges(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_count INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, challenge_id, date)
);

ALTER TABLE user_daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own daily progress" ON user_daily_progress
  FOR ALL USING (auth.uid() = user_id);

-- Seed 4 recurring challenges
INSERT INTO daily_challenges (id, title_th, type, target_count, pts_reward) VALUES
  ('dc-lore',    'ปลดล็อคเรื่องราวเชิงลึก 1 จุด',     'lore',    1, 50),
  ('dc-checkin', 'เช็คอินจุดสังเกตการณ์ใหม่',           'checkin', 1, 75),
  ('dc-capture', 'จับบุคคลสำคัญระดับ B ขึ้นไป',          'capture', 1, 100),
  ('dc-quiz',    'ตอบแบบทดสอบถูกต้องครบ 3 ข้อ',          'quiz',    3, 30)
ON CONFLICT (id) DO NOTHING;
```

**Step 2 — Add to `supabase-client.js`:**
```js
Missions: {
  getActiveMission: async (userId) => { /* ... see Task A */ },

  getDailyChallenges: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: challenges } = await window._supabase
      .from('daily_challenges')
      .select('*')
      .eq('is_active', true);
    if (!challenges) return [];

    // Upsert today's progress rows
    const upserts = challenges.map(c => ({
      user_id: userId, challenge_id: c.id, date: today,
      current_count: 0, completed: false
    }));
    await window._supabase.from('user_daily_progress').upsert(upserts, {
      onConflict: 'user_id,challenge_id,date', ignoreDuplicates: true
    });

    const { data: progress } = await window._supabase
      .from('user_daily_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    return challenges.map(c => ({
      ...c,
      current: progress?.find(p => p.challenge_id === c.id)?.current_count ?? 0,
      completed: progress?.find(p => p.challenge_id === c.id)?.completed ?? false
    }));
  },

  updateChallengeProgress: async (userId, type) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: challenges } = await window._supabase
      .from('daily_challenges')
      .select('id, target_count')
      .eq('type', type)
      .eq('is_active', true);
    if (!challenges || challenges.length === 0) return;

    for (const c of challenges) {
      const { data: row } = await window._supabase
        .from('user_daily_progress')
        .select('current_count, completed')
        .eq('user_id', userId).eq('challenge_id', c.id).eq('date', today)
        .single();
      if (!row || row.completed) continue;
      const newCount = (row.current_count || 0) + 1;
      const done = newCount >= c.target_count;
      await window._supabase.from('user_daily_progress').upsert({
        user_id: userId, challenge_id: c.id, date: today,
        current_count: newCount, completed: done
      }, { onConflict: 'user_id,challenge_id,date' });
    }
  }
}
```

**Step 3 — Update call sites in `map.js` and `missions.js`:**
- After `saveLoreUnlock()` succeeds → call `await DB.Missions.updateChallengeProgress(userId, 'lore')`
- After `submitQuizAnswer()` correct → call `await DB.Missions.updateChallengeProgress(userId, 'quiz')`
- After watchtower check-in succeeds → call `await DB.Missions.updateChallengeProgress(userId, 'checkin')`
- After figure capture → call `await DB.Missions.updateChallengeProgress(userId, 'capture')`
- Remove `MOCK_DAILY` from `missions.js`. Replace with `await DB.Missions.getDailyChallenges(userId)`.
- Log all functions in `docs/FUNCTION_LOG.md`.

---

## 6. Testing Checklist Per Task

After implementing each task, verify the following before marking done:

### Fix 2 (Quiz fail state)
- [ ] B-class quiz: wrong answer → red highlight + "ตอบผิด" shown → 1.5s later options re-enabled
- [ ] S/A-class quiz: wrong answer on any question → red highlight → sheet closes after 2s
- [ ] B-class quiz: correct answer after retry → capture succeeds, toast shown

### Fix 1 (Era field)
- [ ] Open any figure in Collection → bio modal shows era text (not a district ID slug)
- [ ] Figure with NULL era → shows "[Class]-Class · [district]" fallback correctly

### Fix 3+4 (review_status + source_ref)
- [ ] Seed a test lore node with `review_status = 'pending'` → confirm it does NOT appear on map
- [ ] Seed a test quiz question with NULL `source_ref` → confirm it does NOT appear in quiz flow
- [ ] Normal approved nodes still appear correctly

### Task A (Active Mission)
- [ ] New user with no districts unfogged → shows "Explore a district to start" state
- [ ] User with 1 unfogged district, S-class not captured → shows that figure as active mission with live support node progress
- [ ] User who captured all S/A in all visited districts → shows "All missions complete"
- [ ] DB unavailable → shows error state (not MOCK_ACTIVE data)

### Task B (Daily Challenges)
- [ ] First load of the day → `user_daily_progress` rows are created for today
- [ ] Complete a lore unlock → lore challenge count increments in real time
- [ ] Complete a capture → capture challenge updates
- [ ] Same day, refresh → progress persists (from DB, not localStorage)
- [ ] Next day, refresh → progress resets to 0 (new date = new rows)

---

## 7. Function Documentation Template

All agents **must** maintain `docs/FUNCTION_LOG.md`. After any task, add a row per new/modified function.

**Template for `docs/FUNCTION_LOG.md`:**

```markdown
# Function Log — ตามรอย

| Function | File | Purpose | Supabase Tables | Status |
|----------|------|---------|-----------------|--------|
| `submitQuizAnswer()` | js/map.js | Evaluates quiz answer; captures figure on correct; shows fail UI on wrong | user_captures, figures | ⚠️ Fail state added 2026-06-27 |
| `getActiveMission(userId)` | js/supabase-client.js | Finds first unfogged district with uncaptured S/A figure | user_districts, user_captures, figures, districts | ❌ Not yet built |
| `getDailyChallenges(userId)` | js/supabase-client.js | Loads today's challenges + user progress; upserts missing rows | daily_challenges, user_daily_progress | ❌ Not yet built |
| `updateChallengeProgress(userId, type)` | js/supabase-client.js | Increments user progress for a challenge type | user_daily_progress | ❌ Not yet built |
| `showDetail(fig)` | js/collection.js | Renders figure bio modal; reads era from DB | figures | ⚠️ era field fix needed |
| `saveLoreUnlock(nodeId, pts)` | js/map.js | Persists lore unlock to Supabase; triggers chain bonus check | user_lore, profiles | ✅ Working |
| `buildFogLayer()` | js/map.js | Builds a MapLibre GeoJSON polygon (ring winding marks holes) for fog of war | user_districts | ✅ Working |
| `visitSupportNode(userId, districtId, type, nodeId)` | js/map.js | Records support node visit to DB; updates local counter | user_support_node_visits, user_districts | ✅ Working |
| ... | ... | ... | ... | ... |
```

**When to update:** Before you close the PR / end the coding session. Every function that touches Supabase or changes gameplay logic must have a row.

---

## 8. Summary Status Table

| Phase | What | Status |
|-------|------|--------|
| **Core Loop** | Fog, GPS, quiz, capture, lore, leaderboard, archive, notifications, onboarding | ✅ Complete |
| **Real Data** | All 26 figures, 20 lore nodes, 40 support nodes wired to Supabase | ✅ Complete |
| **Fix 1** | Figure bio modal "era" field shows district ID string | ⚠️ Agent Task |
| **Fix 2** | Quiz wrong-answer flow is undefined | ⚠️ Agent Task |
| **Fix 3** | Lore `review_status` filter not applied | ⚠️ Agent Task |
| **Fix 4** | `source_ref` gate not enforced on lore/quiz queries | ⚠️ Agent Task |
| **Fix 5** | Bounding-box polygon vs. real GeoJSON polygon matching | 📋 Deferred |
| **Task A** | Active Mission derived from real user progress — no mock data | ❌ Not built |
| **Task B** | Daily Challenges — live DB, not MOCK_DAILY | ❌ Not built |
| **Task C** | Lore reading depth tracking (≥30s, ≥70% scroll) | ❌ Not built |
| **Task D** | Profile Settings: account deletion + location control | ❌ Not built |
| **Function Log** | `docs/FUNCTION_LOG.md` — all functions documented | ❌ Not created yet |
| **Future** | GeoJSON, server validation, seasons, multiplayer, PWA, AI, English | 📋 Out of scope |

**Bottom line for NSC demo:**
The core gameplay loop is fully functional. Blockers before the demo is "complete per proposal": (1) Active Mission still shows mock data — replace with Task A. (2) Daily Challenges still show mock data — replace with Task B or remove entirely. (3) Quiz fail state is undefined — fix with Instruction Set A. Everything else is either done or intentionally deferred.
