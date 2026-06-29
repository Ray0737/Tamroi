# Satit Prasarnmit On-Site Beta Test Guide

**Location:** โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร  
**District ID:** `satit_test`  
**Date of test:** ___________  
**Tester(s):** ___________

> All test data is labeled `[TEST]` / `[MOCK]` and will be removed before production.

---

## Prerequisites

- [ ] Device with GPS enabled (real device, not emulator)
- [ ] Mobile browser: Chrome for Android / Safari for iOS
- [ ] Logged in to the app with a valid account
- [ ] Network connection (Supabase calls required)
- [ ] Physical location: Satit Prasarnmit campus, Bangkok

---

## Test 1 — District Discovery & Watchtower Check-In

**Objective:** Verify the `satit_test` district loads from the DB, the fog covers the campus, and GPS check-in works.

### Steps

1. Open the app map.
2. Navigate to the Sukhumvit / Asok area on the map.
3. Locate the watchtower icon (🏯) near Satit Prasarnmit campus (approx 13.7430°N, 100.5658°E).
4. Stand at or near the **main gate** of the school (13°44'35.6"N 100°33'57.0"E).
5. Tap the watchtower marker.
6. Tap **"Check In"** in the bottom sheet.

### Expected Results

| # | Expected | Pass/Fail |
|---|----------|-----------|
| 1 | `สาธิตประสานมิตร [TEST]` district visible on map, covered by dark fog | |
| 2 | Tapping the watchtower opens a bottom sheet with district name and support node progress | |
| 3 | GPS validates within 500 m — check-in button is active (not greyed out) | |
| 4 | On check-in: fog lifts over the school polygon, +150 pts floats on screen | |
| 5 | Watchtower marker changes to "visited" style (lighter colour) | |
| 6 | Support node icons (cafe/OTOP/landmark) appear on the map | |

### Notes / Observations
```
_______________________________________________
_______________________________________________
```

---

## Test 2 — Support Node Visits

**Objective:** Verify all 4 support nodes register visits and the encounter gate counts correctly.

> Support nodes only appear after the fog clears (Test 1 must pass first).

### Node Locations

| Node | Type | Name | Coords |
|------|------|------|--------|
| `node-satit-cafe-1` | cafe | โรงอาหารสาธิต ฝั่งเหนือ [TEST] | 13.74333, 100.56597 |
| `node-satit-cafe-2` | cafe | คาเฟ่ตึกอาจารย์ [TEST] | 13.74342, 100.56561 |
| `node-satit-otop-1` | otop | ร้านสหกรณ์ มศว [TEST] | 13.74292, 100.56594 |
| `node-satit-landmark-1` | landmark | ป้ายหน้าโรงเรียนสาธิตประสานมิตร [TEST] | 13.74256, 100.56586 |

### Steps

For each node:
1. Walk to the node's physical location (all within ~100 m of each other on campus).
2. Tap the node icon on the map.
3. Confirm the visit registers in the district bottom sheet progress bar.

### Expected Results

| # | Expected | Pass/Fail |
|---|----------|-----------|
| 1 | Each node tap shows a confirmation toast or visual feedback | |
| 2 | Cafe counter increments: 0 → 1 → 2 after visiting both cafes | |
| 3 | OTOP counter increments: 0 → 1 after visiting the co-op | |
| 4 | Landmark counter increments: 0 → 1 after visiting the front gate sign | |
| 5 | After all 4 visited: "ปลดล็อค Encounter" button appears in the district sheet | |
| 6 | Required thresholds shown: ☕ 2 · 🛍 1 · 🏛 1 (not the default 2/1/3) | |

### Notes / Observations
```
_______________________________________________
_______________________________________________
```

---

## Test 3 — Figure Encounter & Quiz

**Objective:** Verify the B-tier quiz encounter triggers correctly and all 3 questions are answerable.

### Steps

1. Tap "ปลดล็อค Encounter" in the district sheet (available after Test 2).
2. Complete the 3-question quiz.

### Questions (Reference)

| # | Question | Correct Answer |
|---|----------|---------------|
| Q1 | วิทยาลัยประสานมิตรก่อตั้งขึ้นในปี พ.ศ. ใด | **A — พ.ศ. 2492** |
| Q2 | ชื่อ "ศรีนครินทรวิโรฒ" ได้รับพระราชทานเพื่อเป็นเกียรติแก่ผู้ใด | **A — สมเด็จพระศรีนครินทราบรมราชชนนี** |
| Q3 | โรงเรียนสาธิตประสานมิตรทำหน้าที่สำคัญใดควบคู่กับการเป็นโรงเรียนปกติ | **A — เป็นสถานที่ฝึกสอนสำหรับนิสิตคณะศึกษาศาสตร์** |

### Expected Results

| # | Expected | Pass/Fail |
|---|----------|-----------|
| 1 | Encounter sheet opens showing `ผู้บุกเบิกสาธิต [TEST]` (🎓, B-tier) | |
| 2 | Exactly 3 questions appear, one at a time | |
| 3 | Correct answer highlights green; wrong answer highlights red | |
| 4 | Passing all 3: figure captured, +40 pts awarded | |
| 5 | Figure appears in the collection grid with 🎓 icon and B badge | |
| 6 | Failing any question: encounter fails gracefully (no crash, retry option shown) | |

### Notes / Observations
```
_______________________________________________
_______________________________________________
```

---

## Test 4 — Lore Chain Unlock

**Objective:** Verify GPS-proximity lore unlock works across all 3 chain nodes.

> Each node requires the tester to be within **80 m** of the node's coordinate.

### Lore Node Locations

| Part | Name | Coords | Pts |
|------|------|--------|-----|
| 1 | กำเนิดวิทยาลัยประสานมิตร | 13.74333, 100.56597 | 25 |
| 2 | ก้าวสู่มหาวิทยาลัยศรีนครินทรวิโรฒ | 13.74342, 100.56561 | 25 |
| 3 | โรงเรียนสาธิตฯ: ห้องทดลองทางการศึกษา | 13.74292, 100.56594 | 30 |

> Parts 1 & 2 overlap with `node-satit-cafe-1/2`. Walk to the same spots.

### Steps

1. Walk within 80 m of each lore node coordinate.
2. Wait for the lore unlock notification (auto-triggered by GPS proximity).
3. Open the Lore Journal tab and verify the chain.

### Expected Results

| # | Expected | Pass/Fail |
|---|----------|-----------|
| 1 | Lore part 1 unlocks automatically when within 80 m of the north canteen area | |
| 2 | Lore part 2 unlocks near the faculty building | |
| 3 | Lore part 3 unlocks near the co-op / bookshop area | |
| 4 | Each unlock shows a toast with +25/+25/+30 pts | |
| 5 | Lore Journal shows chain `chain-satit-history` with all 3 parts filled | |
| 6 | "Chain Complete" banner appears after part 3 unlocks | |

### Notes / Observations
```
_______________________________________________
_______________________________________________
```

---

## Test 5 — Score & Leaderboard Sync

**Objective:** Verify all points accumulate correctly and sync to the leaderboard.

### Expected Point Total (clean run)

| Source | Points |
|--------|--------|
| Watchtower check-in | +150 |
| Figure capture (B-tier) | +40 |
| Lore node 1 | +25 |
| Lore node 2 | +25 |
| Lore node 3 | +30 |
| **Total** | **270 pts** |

> BTS/MRT transport multiplier may add bonus if tester arrived via Asok BTS (nearest station, ~450 m).

### Steps

1. Open the Leaderboard tab after completing Tests 1–4.
2. Verify the tester's score reflects the points above.

### Expected Results

| # | Expected | Pass/Fail |
|---|----------|-----------|
| 1 | Profile score increased by ~270 pts (exact value depends on transport bonus) | |
| 2 | Leaderboard row updates in real-time (no page reload required) | |
| 3 | Daily challenge progress registers at least 1 check-in and 1 capture | |

### Notes / Observations
```
_______________________________________________
_______________________________________________
```

---

## Known Limitations (Non-blocking for Beta)

| Item | Detail |
|------|--------|
| Watchtower pin offset | Map pin renders at `center_lat` (13.74299); GPS gate validates against `watchtower_lat` (13.74322). ~20 m difference — no practical impact. |
| No Co-op collab missions seeded for satit_test | Guild missions exist for rattanakosin & ayutthaya only. Co-op flow not testable at this location. |
| Raid not applicable | `fig-mock-satit-b-01` is B-tier (not raid_only). Raid encounter requires S-tier raid figure. |
| `[TEST]` data in production view | All satit_test rows are visible in the app. Remove `patch_mock_satit.sql` data before production deploy. |

---

## Sign-Off

| Tester | Date | All Tests Pass |
|--------|------|----------------|
| | | ☐ Yes ☐ No — see notes |

**Blocking issues found:** ☐ None ☐ Yes — listed above in notes
