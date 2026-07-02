# Pre/Post Test Plan — Lore Knowledge Assessment

> Goal: measure whether players actually learn from lore nodes by showing a short quiz *before* and *after* they read each lore card, then surfacing the delta.

---

## Problem

Right now a player approaches a lore node → bottom sheet opens → they tap "บันทึกลง Journal" → done. There is no signal of whether they read it or retained anything. The NSC judges cannot see knowledge transfer.

---

## Scope (MVP)

| In | Out |
|----|-----|
| 1–2 question pretest before lore content reveals | Per-chain aggregate reports |
| Same questions as posttest after saving | Leaderboard integration |
| Score delta badge shown inline (`+X%`) | Adaptive question difficulty |
| Results stored per user per lore node | Push notifications for improvement |

---

## Flow

```
User enters lore radius
        ↓
[ PRE-TEST SCREEN ]
  "ก่อนอ่านเรื่องราว ลองตอบคำถามนี้ก่อน"
  1–2 MCQ questions (same style as capture quiz)
  → Record pre_score (0–N correct)
        ↓
[ LORE CONTENT ]  ← existing lore sheet, unchanged
  Thai narrative + optional image/audio
  "บันทึกลง Journal" button
        ↓
[ POST-TEST SCREEN ]  ← shown once after save tap
  Same questions, new attempt
  → Record post_score
        ↓
[ RESULT BADGE ]
  "คุณเรียนรู้เพิ่มขึ้น +X%  🎯"
  or "เก่งมาก! คุณรู้เรื่องนี้อยู่แล้ว" if pre = 100%
  (inline in lore sheet before it closes)
```

---

## DB Changes

### 1. Extend `quiz_questions`

Add two nullable columns — no breaking changes to existing capture-quiz rows.

```sql
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS lore_id TEXT REFERENCES lore_nodes(id),
  ADD COLUMN IF NOT EXISTS assessment_type TEXT
    CHECK (assessment_type IN ('pretest','posttest','capture'))
    DEFAULT 'capture';
```

- Existing rows stay `assessment_type = 'capture'` (null → default).
- New lore-assessment rows set `lore_id` + `assessment_type = 'pretest'` (we reuse the same questions for post, so one set per lore node is enough).

### 2. New table `user_lore_assessments`

```sql
CREATE TABLE user_lore_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lore_id     TEXT REFERENCES lore_nodes(id) ON DELETE CASCADE,
  phase       TEXT NOT NULL CHECK (phase IN ('pre','post')),
  score       SMALLINT NOT NULL,   -- correct answers
  total       SMALLINT NOT NULL,   -- questions shown
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, lore_id, phase)   -- one attempt per phase per lore node
);

ALTER TABLE user_lore_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assessments" ON user_lore_assessments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

---

## Question Authoring

Each active lore node that wants assessment needs **4 rows** in `quiz_questions` with:

```sql
INSERT INTO quiz_questions (lore_id, district_id, question_th, option_a, ..., correct_option, assessment_type)
VALUES ('lore-wat-pho-learning', 'rattanakosin', 'วัดโพธิ์เป็นที่รู้จักในฐานะอะไร?',
        'แหล่งความรู้สาธารณะ', 'ตลาดค้าปลี', 'ท่าเรือ', 'สนามกีฬา', 'A', 'pretest');
```

Nodes without questions skip the test flow entirely (no gate, no change to current UX).

---

## API Changes (`supabase-client.js`)

Add to `window.DB.Lore`:

```js
// Fetch assessment questions for a lore node
getLoreQuestions(loreId)           // SELECT WHERE lore_id = ? AND assessment_type = 'pretest'

// Save one phase result
saveAssessment(userId, loreId, phase, score, total)  // UPSERT user_lore_assessments

// Read both phases (for journal display)
getAssessments(userId, loreId)    // SELECT WHERE user_id = ? AND lore_id = ?
```

---

## UI Changes

### `app.js` — `openLoreSheet(node)`

Current: directly shows content + save button.

Proposed state machine inside the sheet (no new sheet, just phase swapping):

```
phase: 'pretest' → 'content' → 'posttest' → 'result'
```

- `'pretest'`: hide narrative, show quiz panel. If no questions for this node → skip straight to `'content'`.
- `'content'`: existing view, save button now reads "อ่านแล้ว บันทึก →" and advances to `'posttest'`.
- `'posttest'`: same questions again. Submit → save both scores → advance to `'result'`.
- `'result'`: show delta badge for 2 seconds, then close sheet normally.

All within the existing `#lore-sheet` bottom sheet — no new HTML sheet element needed. Swap a `<div id="lore-phase-panel">` between phases.

### `css/components.css`

One new utility class for the delta badge:

```css
.lore-delta-badge { ... }   /* reuse .capture-score-badge pattern */
```

---

## Scoring / Points

| Outcome | Bonus |
|---------|-------|
| pre < post (learned something) | +10 pts flat (via `DB.Profiles.addLegacyPoints`) |
| pre = 0, post = 100% | +20 pts |
| pre = 100% (already knew) | 0 bonus, show "เก่งอยู่แล้ว" message |

Base lore pts (`lore_pts` on the node) awarded as-is regardless of test result — tests are opt-in measurement, not a gate.

---

## Journal Integration

In `renderLoreJournal` (collection.js), for unlocked nodes that have both pre+post records, show a small pill:

```
[ ก่อน 0/2 → หลัง 2/2 ↑ ]
```

This requires `DB.Lore.getAssessments()` to be called alongside existing unlock data at journal load.

---

## Files to Touch

| File | Change |
|------|--------|
| `supabase/patch_prepost.sql` | New patch: ALTER quiz_questions + CREATE user_lore_assessments |
| `js/supabase-client.js` | Add `getLoreQuestions`, `saveAssessment`, `getAssessments` to `DB.Lore` |
| `js/app.js` | `openLoreSheet()` — phase state machine |
| `app.html` | Add `#lore-phase-panel` div inside existing `#lore-sheet` |
| `css/components.css` | `.lore-delta-badge` |
| `js/collection.js` | `renderLoreJournal` — fetch + show pre/post pill |
| `docs/CLAUDE.md` | Add `user_lore_assessments` to DB Tables; add new DB.Lore methods |
| `docs/FUNCTION_LOG.md` | Log new functions |

---

## Resolved Decisions

| # | Question | Answer |
|---|----------|--------|
| 1 | Gate on wrong pretest? | No — pure measurement, never blocks |
| 2 | Questions per node | **4** (0/25/50/75/100% delta resolution) |
| 3 | Re-attempt policy | Skip both phases if already recorded; one lifetime attempt |
| 4 | Question language | Thai only |
