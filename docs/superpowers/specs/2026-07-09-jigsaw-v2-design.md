# Jigsaw v2 — GPS Checkpoint + Timeline Reconstruction

**Date:** 2026-07-09  
**Status:** Approved  
**Scope:** Redesign of `type='jigsaw'` collab missions — GPS-gated visits, structured summaries with expert quiz gate, collaborative timeline-ordering merge phase, optional legendary encounter unlock.

---

## Problem

The current jigsaw (v1) is a static 3-chapter text split. Members are assigned a chapter label, write a free-text summary, and when all three are posted the summaries appear side-by-side. There is no GPS requirement, no knowledge gate, no real "merge" mechanic, and no meaningful payoff. It does not feel like a collaborative discovery experience.

---

## Goal

A guild splits a lore chain into GPS checkpoints. Each member physically visits their assigned location(s), reads the lore, passes a short quiz, and writes a structured summary. Once all contributions are in, the guild reconstructs the historical timeline together — dragging shuffled cards into the correct chronological order. All members must agree on the same order before the answer is checked. Correct order = pts awarded + optional legendary encounter unlocked for every participant.

**Success criterion:** A guild of 3–5 members can complete a jigsaw mission end-to-end — visit, contribute, merge — and receive their reward without any single member being able to shortcut the GPS or quiz gate.

---

## Flow

```
Assignment → Visit (GPS) → Contribute (quiz gate) → Merge (vote) → Result
```

---

## Phase 1 — Assignment

**Trigger:** Guild leader opens a `type='jigsaw'` mission in the Mission tab with ≥2 guild members and no existing assignments.

**Change from v1:** `assignJigsawChapters` now writes `lore_node_id` into each assignment row — the specific `lore_nodes.id` the member must physically visit for their chapter. Chapters are distributed round-robin by `chapter_index`; members with fewer chapters get lower indices.

**Member card (locked state):**
- Shows chapter title (e.g. "บทที่ 2: แกนพระราชวัง")
- Shows "ไปที่ [lore_node.name_th] บนแผนที่เพื่อปลดล็อค" with a map deep-link (calls `window.MapModule.flyToLocation(lat, lng)`)
- GPS pin for the assigned node is highlighted on the map

---

## Phase 2 — Visit (GPS gate)

**Mechanism:** Reuses the existing lore proximity system in `map.js` — no new proximity logic needed. When the member enters `lore_nodes.radius_m` of their assigned node, the standard lore sheet opens, they read the content, and `user_lore (user_id, lore_id)` is inserted (existing behavior).

**Gate check:** On jigsaw card render, query `user_lore` for `(current_user_id, assignment.lore_node_id)`. Row exists → Phase 3 unlocked. Row absent → card stays locked with location hint.

**Dev bypass:** `_isDev()` already returns true on localhost — same pattern as the watchtower GPS bypass. No extra work.

---

## Phase 3 — Contribute

### Expert quiz gate

Fetch up to 2 questions: `quiz_questions WHERE lore_id = lore_node_id AND assessment_type = 'recall'`.

- Questions rendered as MCQ (existing quiz UI pattern from `raid.js`)
- Both must be answered correctly before the summary form and submit button appear
- If 0 questions exist for this node → gate skipped silently (`// ponytail: skip gate when no recall questions seeded`)
- Wrong answer → immediate feedback, retry allowed (no limit)

### Structured summary form

Replaces the single freetext textarea with three fields:

| Field | Thai label | Max length |
|---|---|---|
| Period / year | ช่วงเวลา | 60 chars |
| Key figure | บุคคลสำคัญ | 60 chars |
| Key event | เหตุการณ์สำคัญ | 300 chars |

Stored as JSON in `guild_jigsaw_assignments.chapter_summary`:
```json
{ "period": "...", "figure": "...", "event": "..." }
```

### On submit

- `summary_posted = true`, `chapter_summary` written
- Supabase Realtime on `guild_jigsaw_assignments` fires → all guild members online receive a toast: "[username] ส่งสรุป[chapter label]แล้ว!"
- Progress indicator updates: "X/N บทเสร็จสิ้น"

---

## Phase 4 — Merge

**Trigger:** All assignment rows for this `(guild_id, mission_id)` have `summary_posted = true`.

### Display

Cards rendered in **client-side shuffled order** (Fisher-Yates on a copy of the chapter_index array — seed is `guild_id + mission_id` so all members see the same shuffle). Each card shows:

```
[member avatar/username]
ช่วงเวลา: ...
บุคคลสำคัญ: ...
เหตุการณ์: ...
```

### Drag-to-reorder

HTML5 drag events (`dragstart` / `dragover` / `drop`) on the card list — no library. Member drags cards into their proposed chronological order.

### Submitting a vote

"ยืนยันลำดับเวลา" button writes `proposed_order` (array of `chapter_index` values in the member's proposed sequence, e.g. `[2, 0, 1, 4, 3]`) to `guild_jigsaw_assignments` via `DB.Coop.setProposedOrder(assignmentId, order)`.

### All-agree detection

Supabase Realtime subscription on `guild_jigsaw_assignments` for this mission (already pattern-matched by existing `subscribeProgress`). On any update, client checks:

1. All rows have non-null `proposed_order`
2. All `proposed_order` values are equal (JSON stringify comparison)

If both true → trigger correctness check client-side.

### Correctness check

`proposed_order` is correct when it equals `[0, 1, 2, ..., N-1]` — the sorted `chapter_index` sequence, which is the ground truth chronological order set by the content author.

---

## Phase 5 — Result

### Correct

1. Insert `collab_mission_completions` row → existing trigger awards `reward_pts` to each participant
2. If `collab_missions.unlocks_figure_id IS NOT NULL`:
   - Insert `user_jigsaw_encounters (user_id, figure_id)` for every member with a `summary_posted = true` assignment row
   - Push notification to each: "ภารกิจ Jigsaw สำเร็จ! คุณปลดล็อคการพบ [figure.name_th]"
3. UI: celebration banner, then reveal all cards in correct order with full narrative

### Wrong

- Highlight cards whose position differs from the correct order (red border)
- "ลองใหม่" button: `UPDATE guild_jigsaw_assignments SET proposed_order = NULL WHERE guild_id = ? AND mission_id = ?` — clears all votes, resets drag UI for everyone
- No penalty — retry freely

---

## Legendary Encounter Integration

`collab_missions.unlocks_figure_id` (nullable). When set, completing this jigsaw grants each participant a row in `user_jigsaw_encounters`. The legendary encounter button in `collection.js` / `map.js` checks this table in addition to the existing support-node chain gate.

Not all jigsaw missions unlock a legendary. The field is null by default.

---

## Database Changes (`supabase/patch_jigsaw_v2.sql`)

```sql
-- 1. Link each assignment to its GPS lore node
ALTER TABLE guild_jigsaw_assignments
  ADD COLUMN IF NOT EXISTS lore_node_id TEXT REFERENCES lore_nodes(id),
  ADD COLUMN IF NOT EXISTS proposed_order JSONB;

-- 2. Optional legendary unlock per jigsaw mission
ALTER TABLE collab_missions
  ADD COLUMN IF NOT EXISTS unlocks_figure_id TEXT REFERENCES figures(id);

-- 3. Per-user legendary unlock grants from jigsaw completion
CREATE TABLE IF NOT EXISTS user_jigsaw_encounters (
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  figure_id   TEXT REFERENCES figures(id)  ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, figure_id)
);

ALTER TABLE user_jigsaw_encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own jigsaw encounters" ON user_jigsaw_encounters
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Backfill lore_node_id for existing rattanakosin seed mission
UPDATE guild_jigsaw_assignments gja
SET lore_node_id = ln.id
FROM lore_nodes ln
WHERE ln.chapter_index = gja.chapter_index
  AND gja.mission_id = 'jigsaw_rattanakosin_1';
```

---

## JS Changes

### `js/supabase-client.js` — new methods on `window.DB.Coop`

| Method | Action |
|---|---|
| `setProposedOrder(assignmentId, orderArray)` | UPDATE `proposed_order` on one assignment row |
| `getJigsawEncounterUnlocks(userId)` | SELECT from `user_jigsaw_encounters` for this user |
| `unlockJigsawEncounters(missionId, guildId, figureId)` | INSERT into `user_jigsaw_encounters` for all `summary_posted` participants |

### `js/coop.js` — `_renderJigsawCard` redesign

Four render states (determined by data, not flags):

| State | Condition |
|---|---|
| `locked` | `user_lore` row absent for `assignment.lore_node_id` |
| `quiz` | `user_lore` present, `summary_posted = false`, quiz not yet passed |
| `contribute` | Quiz passed, `summary_posted = false` |
| `submitted` | `summary_posted = true`, merge not yet triggered |
| `merge` | All members `summary_posted = true` |
| `result` | `proposed_order` set + all agree check ran |

New functions:
- `_renderMergePhase(assignments, guildId, missionId)` — shuffle + drag UI
- `_handleDrop(event)` — HTML5 drag handler
- `_submitProposedOrder(guildId, missionId)` — writes vote, checks all-agree
- `_checkMergeResult(assignments, missionUnlocksId)` — correctness + triggers result

### `js/collection.js` or `js/map.js`

Add check: if `user_jigsaw_encounters` contains `(userId, figureId)` → treat as equivalent to support-node chain complete for that figure, show legendary encounter button.

---

## What Is NOT in This Spec

- Realtime drag sync across members (Approach C) — add if latency in the vote flow feels off
- Reassign mechanic if a member goes offline — add if guilds report blockage
- Cold-case replay for new members — add later
- Photo proof at checkpoints — out of scope for v2

---

## Open Questions

None — all design decisions resolved before this doc was written.
