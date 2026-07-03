# LEFT_FUNCTIONS.md — ฟังก์ชันที่ยังเหลืออยู่

> Cross-reference: `ตามรอย_NSC_2026_v29.docx`  
> Generated: 2026-07-03  
> Status key: 🐛 Bug · 📋 Planned · 🔮 Future (post-NSC)

---

## Already Done (summary — do not re-implement)

| Area | Done |
|---|---|
| Phase 1 Core Loop | ✅ Auth, GPS check-in, fog, quiz, capture, lore, leaderboard, seasonal, BTS bonus |
| Phase 3 Co-op | ✅ Guild (create/join/manage/transfer), collab missions, raid (lobby/broadcast/failover), discussion, community forum |
| Advanced Educational (§9.1–9.3) | ✅ Retrieval Practice, Historical Debate, Jigsaw Guild Mission |
| Post-Phase-3 | ✅ Guild fog overlay, join-request flow, announcements, rally pin, expedition log wiring, leaderboard seasons |
| Co-op backlog bugs | ✅ ⚔️ raid marker on map, raid notification deeplink (`joinFromNotification`), CoopModule GPS gate |

---

## 🐛 Bugs — Fix Before Public Release

These are listed in v29 §13 (Limitations) and §17 (Problems) as known issues requiring resolution before wider deployment.

### B1 — `review_status` not enforced in queries ✅ Fixed 2026-07-03

**v29 reference:** §13 item 5, §17 item 4, §18.2 item 3  
**Location:** `js/supabase-client.js` — all `lore_nodes` and `quiz_questions` fetch calls  
**Problem:** `lore_nodes.review_status` existed but `quiz_questions.review_status` did not, and neither table had a `source_ref` column (doc previously assumed both existed — verified false against live DB 2026-07-03). Queries don't filter on review_status either way, so unreviewed content can appear in the app.  
**DB side — done (2026-07-03):** `supabase/patch_review_status.sql` adds `quiz_questions.review_status` and backfills all existing `lore_nodes`/`quiz_questions` rows to `'approved'` (23/23 and 173/173). No `source_ref` column added — nothing in the codebase reads/writes it, so it'd be dead schema until something needs source citations.  
**Code side — done (2026-07-03):** Added `.eq('review_status', 'approved')` to `Lore.getAll()`, `Lore.getLoreQuestions()`, `Lore.getRecallQuestions()`, `Quiz.getForDistrict()`, `Quiz.getForFigure()`, and `Quiz.getRaidQuestions()`. `Lore.getUserUnlocked()` intentionally excluded — already-unlocked journal content should remain visible regardless of post-hoc review status changes.

---

### B2 — Figures without `lat`/`lng` silently disappear from map ✅ Fixed 2026-07-03

**v29 reference:** §17 item 7 (ปัญหาที่ 323)  
**Location:** `js/map.js` — `loadFigureNodes()` / `renderFigureNodes()`  
**Problem:** Players have no way to know these figures exist; no fallback pin is shown, no console warning.  
**Fix:** Removed the `.filter()` that dropped null-coord figures. `loadFigureNodes()` now warns to console with the missing IDs. `renderFigureNodes()` renders a dashed `?` marker at the district's `watchtower_lat`/`watchtower_lng` centroid with tooltip "ตำแหน่งยังไม่ระบุ" for any figure missing coordinates.

---

## 📋 Planned Features — Co-op Backlog

From `docs/coop-features-backlog.md` (2026-07-02). Ordered by documented priority.

### P1 — Guild Expedition Log

**Priority:** 1 — Social Glue  
**What:** Running feed inside Guild panel showing recent member activity ("Mook captured X at Y · 5m ago").  
**DB:** No new tables — query `user_captures`, `user_districts`, `user_lore` filtered to guild member IDs with a recency limit.  
**Scope:** One DB view or query + a feed section in `guild.js` `renderGuildPanel()`.

---

### P2 — District Territory Claiming

**Priority:** 2 — Territorial Stakes  
**What:** First guild to complete all collab missions in a district claims it; claim shown as tint on map + guild profile stat "Districts Held: N"; another guild can contest by re-completing all missions.  
**DB:** Add `claimed_by_guild_id` + `claimed_at` to `districts` table (or separate `district_claims` table for contest history). Trigger on `collab_mission_completions` insert.  
**Scope:** Medium — DB column/table, trigger, `MapModule.renderGuildFog()` tint extension, leaderboard stat.

---

### P3 — Raid LFG (Looking for Group) Listing

**Priority:** 3 — Raid Discovery  
**What:** "Find Raid Party" button on a raid-only figure's info card — posts a public LFG listing visible to all players (not just guildmates). Listings expire after 24 h or when the raid fires. Resolves the "Start Raid" discovery friction noted in v29 §17.  
**DB:** New `raid_lfg` table: `(id, figure_id, host_user_id, created_at, expires_at, status)`.  
**Scope:** Medium — DB table + RLS + LFG panel in raid UI. Separate from marker fix (already done).

---

### P4 — Raid Role Split

**Priority:** 3 — Raid Quality  
**What:** Divide raid question pool by role (Historian = who/what, Navigator = where/when). Players pick a role in lobby; both roles must pass for raid success.  
**DB:** Add `question_type` column to `quiz_questions`. Update `patch_debates.sql` or add new patch.  
**Scope:** Medium — DB column, lobby role-pick UI in `raid.js`, scoring split logic.

---

### P5 — Guild vs. Guild Sprint Event

**Priority:** 2 — Rivalry  
**What:** Timed 48-hour race between two guilds to check in at a shared set of 5 landmarks first. Challenger issues invite by guild code; results posted to community forum automatically.  
**DB:** New `guild_challenges` table with challenge metadata, target locations, expiry, and result.  
**Scope:** Large — DB table, challenge UI, event-expiry logic, community forum auto-post.

---

### P6 — Guild Relay Mission

**Priority:** 4 — Async Collaboration  
**What:** Chained mission where each step must be completed by a *different* member at a *different* location. No live coordination needed.  
**DB:** New mission type in `collab_missions` with `chain_steps` JSONB field.  
**Scope:** Large — new mission type, step-unlock logic, UI display.

---

## 🔮 Future — Next Phase (Post-NSC, §18)

Listed explicitly in v29 §18 as "แนวทางพัฒนาต่อในอนาคต". Not required for the current NSC submission.

| # | Feature | Notes |
|---|---|---|
| F1 | **PWA / Offline support** | Service worker + cached map tiles; required for rural provinces |
| F2 | **Sector-based Fog Clearing while walking** | Repurpose existing `window.FogGrid` to reveal cells per GPS update, not just on check-in |
| F3 | **Historical Vision AI** | Camera → GPS-scoped image recognition → auto-surface lore |
| F4 | **Native app + AR camera** | S/A figures visible through phone camera in real world; QR check-in |
| F5 | **Trading system + rotating seasonal lore** | Figure trading between players; season-specific content |
| F6 | **Multi-language (English)** | i18n layer; required for foreign tourists use case |
| F7 | **Real GeoJSON 77-province polygon matching** | Replace simplified bounding-box `MOCK_DISTRICTS` with official polygon data |
| F8 | **Formal IMI / Pre-Post-test data collection** | Google Form integration or in-app survey for academic evaluation (§16) |
| F9 | **In-app onboarding tutorial** | First-run interactive guide for new players |
| F10 | **Achievement badge system** | Badges beyond seasonal (exploration milestones, capture streaks, etc.) |
| F11 | **Institutional partnerships** | TAT / Fine Arts Dept. co-branding; official curriculum tie-in |

---

## Content Gaps (Data, Not Code)

These require content work, not engineering, but block full coverage:

| Gap | Details |
|---|---|
| Figure B/C ratio | Current: 43% gated (S/A) vs. target 20%. Need to add B/C-tier figures or reclassify borderline A-tier entries. v29 §13 item 4. |
| Figures missing `lat`/`lng` | Some figures have no coordinates — visible once B2 fallback pin is implemented. |
| `review_status` population | Once B1 enforcement lands, any `review_status != 'approved'` content will become invisible. Audit existing rows before deploying the filter. |
| Historical content coverage | Currently only Bangkok (14 districts) + Ayutthaya + Nonthaburi seeded. 77-province expansion is long-term. |

---

## Fix Order Recommendation

```
B1 (review_status)        ← data integrity before public
B2 (fallback pin)         ← UX, very small diff
P1 (expedition log)       ← small, high feel
P3 (raid LFG)             ← resolves last raid discovery issue
P2 (territory claiming)   ← medium, high retention
P4 (raid roles)           ← medium, improves co-op depth
P5 (guild sprint)         ← large, ship after P2
P6 (relay mission)        ← largest, ship last
F1–F11                    ← post-NSC roadmap
```
