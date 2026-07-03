# New Educational Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Retrieval Practice, Unsolved History, and Jigsaw Learning from `docs/NEW_FEATURES.md` into both the live app and the NSC proposal docx.

**Architecture:** Three SQL patches add new tables/columns. Two new JS files (debates.js, plus a Python docx-update script). Four existing JS files are extended (supabase-client.js, missions.js, collection.js, coop.js). app.html gains one new bottom sheet and one Bootstrap modal. Static regression tests gate correctness.

**Tech Stack:** Vanilla JS ES6 modules · Bootstrap 5.3 modals · Supabase PostgreSQL + RLS · python-docx for docx update · Node.js `node:test` for static tests.

## Global Constraints

- No npm install, no build step — zero-tooling project. Serve with VS Code Live Server on port 5500.
- All Supabase calls go through `js/supabase-client.js` only — never call `_sb` from page modules.
- All user-visible strings rendered into innerHTML must use `escapeHtml()` from `js/utils.js`.
- CSS: use `var(--color-*)` tokens only — no hardcoded hex. Use `var(--radius-*)` for border-radius.
- SQL patches: all DDL uses `IF NOT EXISTS` / `OR REPLACE` guards — safe to re-run.
- The `user_lore` table column for lore node FK is `lore_node_id` (not `lore_id`) — confirmed by supabase-client.js line 311.
- JS module pattern: each new file wraps in an IIFE, assigns to `window.<Name>Module`.
- Commit message only — never auto-commit. Output suggested message and let user run it.

---

## Task 1: Retrieval Practice — SQL patch

**Files:**
- Create: `supabase/patch_retrieval_practice.sql`

**Interfaces:**
- Produces: `user_lore.recall_due_at TIMESTAMPTZ`, `daily_challenges.lore_node_id TEXT`, `daily_challenges` type `'lore_recall'`, `quiz_questions.assessment_type` column, `quiz_questions.lore_id` column.

- [ ] **Step 1: Write the SQL patch**

Create `supabase/patch_retrieval_practice.sql`:

```sql
-- ══ Retrieval Practice Patch ══════════════════════════════════════════════════
-- Run after: patch_lore.sql, patch_daily_challenges.sql
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── quiz_questions: ensure lore_id + assessment_type columns exist ────────────
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS lore_id TEXT REFERENCES lore_nodes(id);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS assessment_type TEXT NOT NULL DEFAULT 'capture';

ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_assessment_type_check;
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_assessment_type_check
  CHECK (assessment_type IN ('capture', 'pretest', 'recall'));

-- ── user_lore: add recall_due_at ──────────────────────────────────────────────
ALTER TABLE user_lore ADD COLUMN IF NOT EXISTS recall_due_at TIMESTAMPTZ;

-- ── Trigger: set recall_due_at on new unlock ──────────────────────────────────
CREATE OR REPLACE FUNCTION set_recall_due_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.recall_due_at := COALESCE(NEW.unlocked_at, NOW()) + INTERVAL '3 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_lore_unlock_set_recall ON user_lore;
CREATE TRIGGER on_lore_unlock_set_recall
  BEFORE INSERT ON user_lore
  FOR EACH ROW EXECUTE FUNCTION set_recall_due_at();

-- Backfill existing rows
UPDATE user_lore
   SET recall_due_at = unlocked_at + INTERVAL '3 days'
 WHERE recall_due_at IS NULL;

-- ── daily_challenges: add lore_recall type + lore_node_id column ──────────────
ALTER TABLE daily_challenges DROP CONSTRAINT IF EXISTS daily_challenges_type_check;
ALTER TABLE daily_challenges ADD CONSTRAINT daily_challenges_type_check
  CHECK (type IN ('lore', 'checkin', 'capture', 'quiz', 'lore_recall'));

ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS lore_node_id TEXT REFERENCES lore_nodes(id);

-- ── Seed two recall questions for existing lore nodes ─────────────────────────
INSERT INTO quiz_questions
  (figure_id, district_id, question_th, option_a, option_b, option_c, option_d,
   correct_option, difficulty, lore_id, assessment_type)
VALUES
  (NULL, 'rattanakosin',
   'กำแพงเมืองและคูคลองในเกาะรัตนโกสินทร์มีบทบาทหลักอะไรในยุคแรก',
   'ป้องกันเมืองและกำหนดขอบเขตอำนาจ', 'เส้นทางคมนาคมหลัก',
   'แหล่งน้ำดื่มสาธารณะ', 'แนวระบายน้ำ',
   'A', 'C', 'lore-rattanakosin-wall', 'recall'),
  (NULL, 'rattanakosin',
   'วัดโพธิ์เปรียบได้กับสิ่งใดในอดีต ตามเนื้อหาที่คุณอ่าน',
   'มหาวิทยาลัยกลางเมือง', 'ตลาดการค้าหลัก',
   'พระราชวังสำรอง', 'ป้อมปราการ',
   'A', 'C', 'lore-wat-pho-learning', 'recall')
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Verify the patch runs clean**

Apply in Supabase SQL Editor. Expected: no errors. If column already exists from a prior run, the `IF NOT EXISTS` guards prevent failures.

- [ ] **Step 3: Suggested commit message**

```
feat(db): add retrieval practice — recall_due_at trigger, lore_recall challenge type
```

---

## Task 2: Retrieval Practice — DB API (supabase-client.js)

**Files:**
- Modify: `js/supabase-client.js` — extend `Missions` object

**Interfaces:**
- Consumes: `user_lore.recall_due_at`, `quiz_questions` with `assessment_type='recall'` and `lore_id`
- Produces:
  - `DB.Missions.getRecallMissions(userId: string): Promise<RecallChallenge[]>`
    where `RecallChallenge = { id, type:'lore_recall', title_th, target_count:1, pts_reward:30, current:0, completed:false, lore_node_id }`
  - `DB.Missions.completeRecall(userId, loreNodeId, wasCorrect): Promise<void>`
  - `DB.Lore.getRecallQuestions(loreNodeId): Promise<QuizQuestion[]>`

- [ ] **Step 1: Write a failing static test**

Add a new test file `tests/recall-static.test.mjs`:

```js
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const assert = (c, msg) => { if (!c) throw new Error(msg); };

const db = read('js/supabase-client.js');
assert(db.includes('getRecallMissions'), 'DB.Missions must have getRecallMissions');
assert(db.includes('completeRecall'), 'DB.Missions must have completeRecall');
assert(db.includes('getRecallQuestions'), 'DB.Lore must have getRecallQuestions');
console.log('✓ recall static checks passed');
```

Run: `node tests/recall-static.test.mjs` — expected: FAIL (methods not yet defined).

- [ ] **Step 2: Add `getRecallQuestions` to the `Lore` object in supabase-client.js**

Find the closing brace of the `Lore` object (after `getAssessments`). Add before it:

```js
  async getRecallQuestions(loreNodeId) {
    const { data, error } = await _sb
      .from('quiz_questions')
      .select('id, question_th, option_a, option_b, option_c, option_d, correct_option')
      .eq('lore_id', loreNodeId)
      .eq('assessment_type', 'recall');
    if (error) throw error;
    return data || [];
  },
```

- [ ] **Step 3: Add `getRecallMissions` and `completeRecall` to the `Missions` object**

Find the closing brace of the `Missions` object (after `updateChallengeProgress`). Add before it:

```js
  async getRecallMissions(userId) {
    const today = new Date().toISOString().split('T')[0];
    const { data: dueNodes, error } = await _sb
      .from('user_lore')
      .select('lore_node_id, recall_due_at, lore_nodes(name_th)')
      .eq('user_id', userId)
      .lte('recall_due_at', new Date().toISOString());
    if (error || !dueNodes?.length) return [];

    const { data: done } = await _sb
      .from('user_daily_progress')
      .select('challenge_id')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('completed', true);
    const doneIds = new Set((done || []).map(d => d.challenge_id));

    return dueNodes
      .filter(n => n.lore_node_id && !doneIds.has(`recall_${n.lore_node_id}`))
      .map(n => ({
        id: `recall_${n.lore_node_id}`,
        type: 'lore_recall',
        title_th: `ทบทวน: ${n.lore_nodes?.name_th || 'Lore'}`,
        target_count: 1,
        pts_reward: 30,
        current: 0,
        completed: false,
        lore_node_id: n.lore_node_id,
      }));
  },

  async completeRecall(userId, loreNodeId, wasCorrect) {
    const today = new Date().toISOString().split('T')[0];
    if (wasCorrect) {
      await _sb.from('user_daily_progress').upsert(
        { user_id: userId, challenge_id: `recall_${loreNodeId}`, date: today,
          current_count: 1, completed: true },
        { onConflict: 'user_id,challenge_id,date' }
      );
      await _sb.rpc('increment_legacy_score', { p_user_id: userId, p_amount: 30 });
    } else {
      // Re-queue for 3 more days
      await _sb.from('user_lore')
        .update({ recall_due_at: new Date(Date.now() + 3 * 86400000).toISOString() })
        .eq('user_id', userId)
        .eq('lore_node_id', loreNodeId);
    }
  },
```

- [ ] **Step 4: Run test to verify it passes**

```
node tests/recall-static.test.mjs
```

Expected: `✓ recall static checks passed`

- [ ] **Step 5: Suggested commit message**

```
feat(db-api): add getRecallMissions, completeRecall, getRecallQuestions
```

---

## Task 3: Retrieval Practice — Missions UI

**Files:**
- Modify: `js/missions.js` — add recall type styling, recall quiz modal
- Modify: `app.html` — add `#recall-modal` Bootstrap modal

**Interfaces:**
- Consumes: `DB.Missions.getRecallMissions(userId)`, `DB.Lore.getRecallQuestions(loreNodeId)`, `DB.Missions.completeRecall(userId, loreNodeId, wasCorrect)`
- Produces: `MissionModule.openRecall(challenge)` (called from click handler on recall challenge card)

- [ ] **Step 1: Add `#recall-modal` to app.html**

Insert before `</div><!-- end app-wrapper -->` (line 606):

```html
  <!-- ════ RECALL QUIZ MODAL ════ -->
  <div class="modal fade" id="recall-modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered" style="max-width:330px;margin:auto">
      <div class="modal-content">
        <div class="modal-header" style="border:none;padding-bottom:4px">
          <span style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;
                       color:#7BC67E;font-weight:700">Recall Quiz</span>
          <button type="button" class="btn-close" data-bs-dismiss="modal"
                  style="filter:invert(1);margin-left:auto"></button>
        </div>
        <div class="modal-body" style="padding:0 var(--space-md) var(--space-md)">
          <h6 id="recall-modal-title"
              style="font-family:var(--font-heading);font-weight:700;margin-bottom:10px"></h6>
          <p id="recall-modal-question"
             style="font-size:13px;color:var(--color-muted);margin-bottom:12px"></p>
          <div id="recall-modal-options"
               style="display:flex;flex-direction:column;gap:8px"></div>
          <div id="recall-modal-result" hidden
               style="margin-top:12px;padding:10px;border-radius:var(--radius-md);font-size:12px"></div>
        </div>
        <div class="modal-footer" style="border:none;padding-top:0">
          <button class="btn btn-primary btn-full" id="recall-modal-done"
                  data-bs-dismiss="modal" hidden>ปิด</button>
        </div>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Add `lore_recall` to `_DAILY_TYPE_STYLE` in missions.js**

Find the `_DAILY_TYPE_STYLE` object and add:

```js
    lore_recall: { color: '#CE93D8', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>` },
```

- [ ] **Step 3: Merge recall missions into `_loadMissionData` in missions.js**

Replace:
```js
      const [figures, captureRows, districtRows, challenges] = await Promise.all([
        DB.Figures.getAll(),
        DB.Figures.getUserCaptures(user.id),
        DB.Districts.getUserState(user.id),
        DB.Missions.getDailyChallenges(user.id),
      ]);
```

With:
```js
      const [figures, captureRows, districtRows, challenges, recallMissions] = await Promise.all([
        DB.Figures.getAll(),
        DB.Figures.getUserCaptures(user.id),
        DB.Districts.getUserState(user.id),
        DB.Missions.getDailyChallenges(user.id),
        DB.Missions.getRecallMissions(user.id),
      ]);
```

And replace the `renderDaily(challenges || [])` call with:
```js
      renderDaily([...(challenges || []), ...(recallMissions || [])]);
```

- [ ] **Step 4: Wire click handler on recall challenge cards in `renderDaily`**

In `renderDaily`, find where each challenge card `<div>` is rendered. Change the outer `<div>` for `lore_recall` type to be clickable:

Replace the card `<div>` open tag pattern:
```js
          <div style="
            display:flex;align-items:center;gap:10px;
            background:var(--color-card-dark);
```
with a conditional that adds `cursor:pointer` and `onclick` for recall type:
```js
          <div onclick="${c.type === 'lore_recall' && !c.completed ? `MissionModule.openRecall(${JSON.stringify(c).replace(/"/g,"'")})` : ''}"
               style="
            display:flex;align-items:center;gap:10px;
            background:var(--color-card-dark);
            ${c.type === 'lore_recall' && !c.completed ? 'cursor:pointer;' : ''}
```

- [ ] **Step 5: Add `openRecall` function to missions.js, inside the IIFE before the `return` statement**

```js
  async function openRecall(challenge) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    const questions = await DB.Lore.getRecallQuestions(challenge.lore_node_id);
    const modal = document.getElementById('recall-modal');
    if (!modal) return;

    const titleEl    = document.getElementById('recall-modal-title');
    const questionEl = document.getElementById('recall-modal-question');
    const optionsEl  = document.getElementById('recall-modal-options');
    const resultEl   = document.getElementById('recall-modal-result');
    const doneBtn    = document.getElementById('recall-modal-done');

    resultEl.hidden = true;
    doneBtn.hidden  = true;

    if (!questions?.length) {
      titleEl.textContent    = challenge.title_th;
      questionEl.textContent = 'ยังไม่มีคำถามสำหรับ Recall นี้';
      optionsEl.innerHTML    = '';
      bootstrap.Modal.getOrCreateInstance(modal).show();
      return;
    }

    const q = questions[0];
    titleEl.textContent    = challenge.title_th;
    questionEl.textContent = q.question_th;

    optionsEl.innerHTML = ['A','B','C','D'].map(k => {
      const text = q[`option_${k.toLowerCase()}`];
      if (!text) return '';
      return `<button class="btn btn-outline btn-full" style="text-align:left;font-size:13px"
                      data-opt="${k}"
                      onclick="MissionModule._handleRecallAnswer('${q.correct_option}','${challenge.lore_node_id}',this)">
                ${escapeHtml(k + '. ' + text)}
              </button>`;
    }).join('');

    bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  async function _handleRecallAnswer(correctOpt, loreNodeId, btn) {
    const user     = window.AppCore?.App?.user;
    const chosen   = btn.dataset.opt;
    const correct  = chosen === correctOpt;
    const resultEl = document.getElementById('recall-modal-result');
    const doneBtn  = document.getElementById('recall-modal-done');

    // Disable all option buttons
    document.querySelectorAll('#recall-modal-options button')
            .forEach(b => { b.disabled = true; b.style.opacity = '0.6'; });

    resultEl.style.background = correct ? 'rgba(123,198,126,0.12)' : 'rgba(255,126,85,0.12)';
    resultEl.style.border      = `1px solid ${correct ? 'rgba(123,198,126,0.3)' : 'rgba(255,126,85,0.3)'}`;
    resultEl.style.color       = correct ? 'var(--color-success)' : 'var(--color-primary)';
    resultEl.textContent       = correct
      ? '✓ ถูกต้อง! +30 pts · ยอดเยี่ยม'
      : '✗ ไม่ถูกต้อง — จะนำกลับมาทบทวนใน 3 วัน';
    resultEl.hidden = false;
    doneBtn.hidden  = false;

    if (user) await DB.Missions.completeRecall(user.id, loreNodeId, correct);
  }
```

- [ ] **Step 6: Expose `openRecall` and `_handleRecallAnswer` in the module return**

Change:
```js
  return { load };
```
to:
```js
  return { load, openRecall, _handleRecallAnswer };
```

- [ ] **Step 7: Suggested commit message**

```
feat: retrieval practice — recall daily missions with quiz modal
```

---

## Task 4: Unsolved History — SQL patch

**Files:**
- Create: `supabase/patch_debates.sql`

**Interfaces:**
- Produces: `history_debates` table, `debate_votes` table, `get_debate_stats(UUID) → JSON` RPC.

- [ ] **Step 1: Write the SQL patch**

Create `supabase/patch_debates.sql`:

```sql
-- ══ Unsolved History (Debate) Patch ══════════════════════════════════════════
-- Run after: patch_lore.sql (figures table must exist)
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── history_debates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS history_debates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id        TEXT REFERENCES figures(id) ON DELETE CASCADE,
  title_th         TEXT NOT NULL,
  case_a_title     TEXT NOT NULL DEFAULT 'กรณี A',
  case_a_text      TEXT NOT NULL,
  case_b_title     TEXT NOT NULL DEFAULT 'กรณี B',
  case_b_text      TEXT NOT NULL,
  source_citations TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE history_debates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debates_select" ON history_debates;
CREATE POLICY "debates_select" ON history_debates FOR SELECT USING (is_active = true);

-- ── debate_votes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debate_votes (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id  UUID    NOT NULL REFERENCES history_debates(id) ON DELETE CASCADE,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote       CHAR(1) NOT NULL CHECK (vote IN ('A','B')),
  reason     TEXT    CHECK (char_length(reason) <= 200),
  voted_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (debate_id, user_id)
);

ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own vote; aggregate counts come via RPC.
DROP POLICY IF EXISTS "debate_votes_own" ON debate_votes;
CREATE POLICY "debate_votes_own" ON debate_votes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── get_debate_stats RPC ──────────────────────────────────────────────────────
-- Returns aggregate counts + caller's own vote. SECURITY DEFINER bypasses RLS
-- so callers see totals without seeing who voted what.
CREATE OR REPLACE FUNCTION get_debate_stats(p_debate_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'count_a',    COUNT(*) FILTER (WHERE vote = 'A'),
    'count_b',    COUNT(*) FILTER (WHERE vote = 'B'),
    'total',      COUNT(*),
    'user_vote',  MAX(vote) FILTER (WHERE user_id = auth.uid()),
    'reasons_a',  COALESCE(
      (SELECT json_agg(r.reason)
       FROM (SELECT reason FROM debate_votes
             WHERE debate_id = p_debate_id AND vote = 'A'
               AND reason IS NOT NULL ORDER BY voted_at DESC LIMIT 3) r),
      '[]'::json),
    'reasons_b',  COALESCE(
      (SELECT json_agg(r.reason)
       FROM (SELECT reason FROM debate_votes
             WHERE debate_id = p_debate_id AND vote = 'B'
               AND reason IS NOT NULL ORDER BY voted_at DESC LIMIT 3) r),
      '[]'::json)
  ) INTO result
  FROM debate_votes
  WHERE debate_id = p_debate_id;
  RETURN COALESCE(result, json_build_object(
    'count_a',0,'count_b',0,'total',0,'user_vote',NULL,'reasons_a','[]'::json,'reasons_b','[]'::json
  ));
END;
$$;

-- ── Seed two example debates ──────────────────────────────────────────────────
INSERT INTO history_debates (id, figure_id, title_th, case_a_title, case_a_text, case_b_title, case_b_text, source_citations)
VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'king-taksin',
    'การดวลยุทธช้างของพระนเรศวร — ประวัติศาสตร์หรือตำนาน?',
    'มีหลักฐานทางประวัติศาสตร์',
    'พงศาวดารไทยหลายฉบับบันทึกเหตุการณ์ยุทธหัตถีอย่างสอดคล้องกัน และมีหลักฐานร่วมสมัยจากฝั่งพม่าที่อ้างถึงการสูญเสียรัชทายาทในสงครามกับสยาม นักประวัติศาสตร์บางคนมองว่าเหตุการณ์นี้เกิดขึ้นจริงในรูปแบบใดรูปแบบหนึ่ง แม้รายละเอียดจะถูกเสริมแต่งในภายหลัง',
    'เป็นตำนานที่สร้างขึ้นภายหลัง',
    'นักวิชาการสมัยใหม่ชี้ว่าการดวลช้างแบบตัวต่อตัวระหว่างกษัตริย์เป็นเรื่องผิดปกติทางยุทธวิธี และรูปแบบที่บันทึกไว้มีลักษณะใกล้เคียงกับวรรณคดีมากกว่าบันทึกทางทหาร พงศาวดารพม่ากล่าวถึงการสูญเสียรัชทายาทแต่ไม่ได้ยืนยันการดวลช้างโดยตรง',
    'พงศาวดารกรุงศรีอยุธยา ฉบับหลวงประเสริฐ; Lieberman, V. (2003). Strange Parallels.'
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'si-suriyothai',
    'การล่มสลายของอยุธยา — ความขัดแย้งภายในหรือแสนยานุภาพพม่า?',
    'ความขัดแย้งภายในเป็นสาเหตุหลัก',
    'นักประวัติศาสตร์หลายคนชี้ว่าการแย่งชิงอำนาจภายในราชสำนักอยุธยาและการทุจริตของขุนนางทำให้กองทัพอ่อนแอลงก่อนพม่าจะบุกโจมตี การแตกแยกของชนชั้นนำทำให้ไม่สามารถระดมกำลังป้องกันเมืองได้อย่างมีประสิทธิภาพ',
    'แสนยานุภาพพม่าเป็นปัจจัยชี้ขาด',
    'กองทัพพม่าสมัยอลองพญาและมังระมีการจัดระเบียบและอาวุธยุทโธปกรณ์ที่เหนือกว่าชัดเจน การล้อมเมืองนาน 14 เดือนแสดงถึงศักยภาพทางทหารขั้นสูง และอยุธยาก็ต้านทานได้นานกว่าที่ทฤษฎีความอ่อนแอภายในจะอธิบายได้',
    'Baker, C. & Phongpaichit, P. (2009). A History of Thailand; Wyatt, D. (2003). Thailand: A Short History.'
  )
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Apply in Supabase SQL Editor and verify no errors**

- [ ] **Step 3: Suggested commit message**

```
feat(db): add history_debates + debate_votes + get_debate_stats RPC
```

---

## Task 5: Unsolved History — DB API + Module + UI

**Files:**
- Modify: `js/supabase-client.js` — add `Debates` namespace
- Create: `js/debates.js` — `DebateModule`
- Modify: `app.html` — add `#debate-sheet` + `<script src="js/debates.js">`
- Modify: `js/collection.js` — add "ประวัติศาสตร์ที่ยังถกเถียง" button in `showDetail()`

**Interfaces:**
- Produces:
  - `DB.Debates.getForFigure(figureId): Promise<Debate|null>`
  - `DB.Debates.getStats(debateId): Promise<DebateStats>`
  - `DB.Debates.vote(debateId, userId, vote, reason): Promise<void>`
  - `window.DebateModule.open(figureId): Promise<void>`

- [ ] **Step 1: Add `Debates` namespace to supabase-client.js**

Find the line `window.DB = {` (near the end of the file) and add before it:

```js
// ── Debates ────────────────────────────────────────────
const Debates = {
  async getForFigure(figureId) {
    const { data, error } = await _sb
      .from('history_debates')
      .select('*')
      .eq('figure_id', figureId)
      .eq('is_active', true)
      .single();
    if (error?.code === 'PGRST116') return null; // no debate for this figure
    if (error) throw error;
    return data;
  },

  async getStats(debateId) {
    const { data, error } = await _sb.rpc('get_debate_stats', { p_debate_id: debateId });
    if (error) throw error;
    return data || { count_a: 0, count_b: 0, total: 0, user_vote: null, reasons_a: [], reasons_b: [] };
  },

  async vote(debateId, userId, vote, reason) {
    const { error } = await _sb.from('debate_votes').upsert(
      { debate_id: debateId, user_id: userId, vote, reason: reason || null },
      { onConflict: 'debate_id,user_id' }
    );
    if (error) throw error;
  }
};
```

Then add `Debates,` to the `window.DB = { ... }` export object.

- [ ] **Step 2: Write a failing static check**

In `tests/recall-static.test.mjs`, add:

```js
assert(db.includes('const Debates'), 'supabase-client.js must define Debates namespace');
assert(db.includes('getForFigure'), 'DB.Debates must have getForFigure');
assert(db.includes('get_debate_stats'), 'DB.Debates must call get_debate_stats RPC');
```

Run: `node tests/recall-static.test.mjs` — expected: FAIL.

- [ ] **Step 3: Add `#debate-sheet` bottom sheet to app.html**

Insert directly before `</div><!-- end app-wrapper -->`:

```html
  <!-- ════ UNSOLVED HISTORY DEBATE SHEET ════ -->
  <div class="bottom-sheet" id="debate-sheet">
    <div class="sheet-handle"></div>
    <div class="lore-sheet-head">
      <span class="lore-type-badge">ประวัติศาสตร์ที่ถกเถียง</span>
      <span class="lore-pts-badge" id="debate-vote-count">0 เสียง</span>
    </div>
    <h3 class="sheet-title lore-title" id="debate-title"></h3>
    <div id="debate-body" style="overflow-y:auto;max-height:55vh;padding-bottom:var(--space-md)"></div>
  </div>
  <div class="bottom-sheet-overlay" id="debate-overlay" onclick="DebateModule.close()"></div>
```

- [ ] **Step 4: Add `js/debates.js` script tag to app.html**

In the scripts block, add after `<script src="js/community-forum.js"></script>`:

```html
<script src="js/debates.js"></script>
```

- [ ] **Step 5: Create `js/debates.js`**

```js
// ── Debate Module ─────────────────────────────────────
const DebateModule = (() => {
  let _debate = null;
  let _stats  = null;

  async function open(figureId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;

    try {
      _debate = await DB.Debates.getForFigure(figureId);
      if (!_debate) { window.AppCore?.showToast?.('ยังไม่มีประเด็นถกเถียงสำหรับบุคคลนี้'); return; }
      _stats = await DB.Debates.getStats(_debate.id);
      _render();
      document.getElementById('debate-sheet')?.classList.add('open');
      document.getElementById('debate-overlay')?.classList.add('open');
    } catch { window.AppCore?.showToast?.('ไม่สามารถโหลดข้อมูลได้'); }
  }

  function close() {
    document.getElementById('debate-sheet')?.classList.remove('open');
    document.getElementById('debate-overlay')?.classList.remove('open');
  }

  function _render() {
    const d     = _debate;
    const s     = _stats;
    const voted = s.user_vote;
    const total = s.total || 0;
    const pctA  = total ? Math.round((s.count_a / total) * 100) : 50;
    const pctB  = 100 - pctA;

    document.getElementById('debate-title').textContent     = escapeHtml(d.title_th);
    document.getElementById('debate-vote-count').textContent = `${total} เสียง`;

    const body = document.getElementById('debate-body');
    if (!body) return;

    body.innerHTML = `
      ${voted ? _renderResults(s, pctA, pctB) : _renderVoteForm(d)}
      ${d.source_citations ? `
        <p style="margin-top:12px;font-size:10px;color:var(--color-muted);line-height:1.5">
          <strong>แหล่งอ้างอิง:</strong> ${escapeHtml(d.source_citations)}
        </p>` : ''}
    `;

    if (!voted) {
      document.getElementById('btn-vote-a')?.addEventListener('click', () => _openReasonInput('A'));
      document.getElementById('btn-vote-b')?.addEventListener('click', () => _openReasonInput('B'));
    }
  }

  function _renderVoteForm(d) {
    return `
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:var(--space-md)">
        <div style="background:var(--color-card-dark);border:1px solid var(--color-border);
                    border-left:3px solid #7BC67E;border-radius:var(--radius-md);padding:var(--space-md)">
          <p style="font-size:10px;text-transform:uppercase;font-weight:700;
                    color:#7BC67E;margin-bottom:6px">${escapeHtml(d.case_a_title)}</p>
          <p style="font-size:13px;color:var(--color-muted);line-height:1.55;margin:0">${escapeHtml(d.case_a_text)}</p>
        </div>
        <div style="background:var(--color-card-dark);border:1px solid var(--color-border);
                    border-left:3px solid #FF7E55;border-radius:var(--radius-md);padding:var(--space-md)">
          <p style="font-size:10px;text-transform:uppercase;font-weight:700;
                    color:var(--color-primary);margin-bottom:6px">${escapeHtml(d.case_b_title)}</p>
          <p style="font-size:13px;color:var(--color-muted);line-height:1.55;margin:0">${escapeHtml(d.case_b_text)}</p>
        </div>
      </div>
      <div id="debate-reason-form" hidden style="margin-bottom:12px">
        <p style="font-size:11px;color:var(--color-muted);margin-bottom:6px">
          เหตุผลของคุณ (ไม่บังคับ, สูงสุด 200 ตัวอักษร)
        </p>
        <textarea id="debate-reason-input" maxlength="200" rows="2"
          style="width:100%;background:var(--color-card-dark);border:1px solid var(--color-border);
                 border-radius:var(--radius-md);color:var(--color-white);font-size:12px;
                 padding:8px;resize:none;box-sizing:border-box"></textarea>
        <button class="btn btn-primary btn-full" style="margin-top:8px"
                onclick="DebateModule._submitVote()">ยืนยันคำตอบ</button>
      </div>
      <div style="display:flex;gap:8px">
        <button id="btn-vote-a" class="btn btn-full"
                style="flex:1;background:rgba(123,198,126,0.12);border:1px solid #7BC67E;
                       color:#7BC67E;font-size:12px;font-weight:700">
          เลือก ${escapeHtml(d.case_a_title)}
        </button>
        <button id="btn-vote-b" class="btn btn-full"
                style="flex:1;background:rgba(255,126,85,0.12);border:1px solid var(--color-primary);
                       color:var(--color-primary);font-size:12px;font-weight:700">
          เลือก ${escapeHtml(d.case_b_title)}
        </button>
      </div>
    `;
  }

  function _renderResults(s, pctA, pctB) {
    const userSide = s.user_vote === 'A' ? _debate.case_a_title : _debate.case_b_title;
    const reasons = side => {
      const list = side === 'A' ? (s.reasons_a || []) : (s.reasons_b || []);
      if (!list.length) return '<p style="font-size:11px;color:var(--color-muted)">ยังไม่มีเหตุผล</p>';
      return list.map(r => `<p style="font-size:11px;color:var(--color-muted);
        border-left:2px solid var(--color-border);padding-left:8px;margin:4px 0">
        "${escapeHtml(r)}"</p>`).join('');
    };

    return `
      <p style="font-size:11px;color:var(--color-success);margin-bottom:10px">
        ✓ คุณเลือก: <strong>${escapeHtml(userSide)}</strong>
      </p>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
        <div style="flex:${pctA};height:8px;background:#7BC67E;border-radius:4px 0 0 4px"></div>
        <div style="flex:${pctB};height:8px;background:var(--color-primary);border-radius:0 4px 4px 0"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;
                  color:var(--color-muted);margin-bottom:16px">
        <span>${escapeHtml(_debate.case_a_title)} ${pctA}%</span>
        <span>${pctB}% ${escapeHtml(_debate.case_b_title)}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <p style="font-size:9px;text-transform:uppercase;font-weight:700;
                    color:#7BC67E;margin-bottom:4px">${escapeHtml(_debate.case_a_title)}</p>
          ${reasons('A')}
        </div>
        <div>
          <p style="font-size:9px;text-transform:uppercase;font-weight:700;
                    color:var(--color-primary);margin-bottom:4px">${escapeHtml(_debate.case_b_title)}</p>
          ${reasons('B')}
        </div>
      </div>
    `;
  }

  let _pendingVote = null;

  function _openReasonInput(vote) {
    _pendingVote = vote;
    const form = document.getElementById('debate-reason-form');
    if (form) { form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }

  async function _submitVote() {
    const user   = window.AppCore?.App?.user;
    if (!user || !_pendingVote || !_debate) return;
    const reason = document.getElementById('debate-reason-input')?.value?.trim() || null;
    try {
      await DB.Debates.vote(_debate.id, user.id, _pendingVote, reason);
      _stats = await DB.Debates.getStats(_debate.id);
      _render();
    } catch { window.AppCore?.showToast?.('ไม่สามารถบันทึกคำตอบได้'); }
    _pendingVote = null;
  }

  return { open, close, _submitVote };
})();

window.DebateModule = DebateModule;
```

- [ ] **Step 6: Add "ประวัติศาสตร์ที่ยังถกเถียง" button to figure modal in collection.js**

In `showDetail()`, after `const bsModal = bootstrap.Modal.getOrCreateInstance(modal); bsModal.show();`, add:

```js
    // Inject "Unsolved History" button if figure is captured and has a debate
    const footerEl = modal.querySelector('.modal-footer');
    const existingDebateBtn = document.getElementById('btn-figure-debate');
    if (existingDebateBtn) existingDebateBtn.remove();

    if (captures.has(figureId)) {
      DB.Debates.getForFigure(figureId).then(debate => {
        if (!debate) return;
        const btn = document.createElement('button');
        btn.id        = 'btn-figure-debate';
        btn.type      = 'button';
        btn.className = 'btn btn-outline btn-full';
        btn.style.cssText = 'font-size:11px;margin-bottom:4px';
        btn.textContent   = 'ประวัติศาสตร์ที่ยังถกเถียง';
        btn.onclick       = () => {
          bsModal.hide();
          DebateModule.open(figureId);
        };
        footerEl.insertBefore(btn, footerEl.firstChild);
      }).catch(() => {});
    }
```

- [ ] **Step 7: Run static tests**

```
node tests/recall-static.test.mjs
```

Expected: all assertions pass.

- [ ] **Step 8: Suggested commit message**

```
feat: unsolved history debates — sheet UI, vote flow, collection hook
```

---

## Task 6: Jigsaw Learning — SQL patch

**Files:**
- Create: `supabase/patch_jigsaw.sql`

**Interfaces:**
- Produces: `lore_nodes.chapter_index INT`, `collab_missions.type TEXT`, `guild_jigsaw_assignments` table.

- [ ] **Step 1: Write the SQL patch**

Create `supabase/patch_jigsaw.sql`:

```sql
-- ══ Jigsaw Learning Patch ════════════════════════════════════════════════════
-- Run after: patch_coop.sql
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE guards.

-- ── lore_nodes: chapter support ──────────────────────────────────────────────
ALTER TABLE lore_nodes ADD COLUMN IF NOT EXISTS chapter_index INT;
-- chapter_index NULL = standalone lore; 0,1,2,3 = jigsaw chapter

-- ── collab_missions: add type column ─────────────────────────────────────────
ALTER TABLE collab_missions ADD COLUMN IF NOT EXISTS
  type TEXT NOT NULL DEFAULT 'checkin' CHECK (type IN ('checkin', 'jigsaw'));

-- ── guild_jigsaw_assignments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_jigsaw_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id        UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  mission_id      TEXT NOT NULL REFERENCES collab_missions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_index   INT  NOT NULL,
  chapter_summary TEXT CHECK (char_length(chapter_summary) <= 600),
  summary_posted  BOOLEAN NOT NULL DEFAULT false,
  assigned_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (guild_id, mission_id, user_id)
);

ALTER TABLE guild_jigsaw_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jigsaw_select" ON guild_jigsaw_assignments;
CREATE POLICY "jigsaw_select" ON guild_jigsaw_assignments FOR SELECT USING (
  guild_id IN (SELECT gm.guild_id FROM guild_members gm WHERE gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "jigsaw_insert" ON guild_jigsaw_assignments;
CREATE POLICY "jigsaw_insert" ON guild_jigsaw_assignments FOR INSERT WITH CHECK (
  guild_id IN (SELECT gm.guild_id FROM guild_members gm WHERE gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "jigsaw_update_own" ON guild_jigsaw_assignments;
CREATE POLICY "jigsaw_update_own" ON guild_jigsaw_assignments
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Seed a jigsaw collab mission ──────────────────────────────────────────────
-- Tag the existing rattanakosin chain lore nodes as jigsaw chapters
UPDATE lore_nodes SET chapter_index = 0 WHERE id = 'lore-rattanakosin-wall';
UPDATE lore_nodes SET chapter_index = 1 WHERE id = 'lore-grand-palace-axis';
UPDATE lore_nodes SET chapter_index = 2 WHERE id = 'lore-wat-pho-learning';

INSERT INTO collab_missions
  (id, district_id, title_th, description_th, required_players, time_window_hours, reward_pts, is_active, type)
VALUES
  ('jigsaw_rattanakosin_1', 'rattanakosin',
   'ปริศนารัตนโกสินทร์ (Jigsaw)',
   'สมาชิกแต่ละคนได้รับบทที่ต่างกันเกี่ยวกับการก่อตั้งกรุงรัตนโกสินทร์ อ่านและแบ่งปันสาระสำคัญให้กิลด์ เมื่อทุกบทเสร็จสิ้น — ภาพรวมสมบูรณ์จะปรากฏขึ้น',
   3, 72, 200, true, 'jigsaw')
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Apply in Supabase SQL Editor and verify no errors**

- [ ] **Step 3: Suggested commit message**

```
feat(db): jigsaw learning — chapter_index, collab_missions.type, guild_jigsaw_assignments
```

---

## Task 7: Jigsaw Learning — DB API + Coop UI

**Files:**
- Modify: `js/supabase-client.js` — add jigsaw methods to `Coop`
- Modify: `js/coop.js` — jigsaw mission card rendering + assignment + summary flow

**Interfaces:**
- Consumes: `guild_jigsaw_assignments`, `collab_missions.type`
- Produces:
  - `DB.Coop.getJigsawAssignments(guildId, missionId): Promise<JigsawAssignment[]>`
  - `DB.Coop.assignJigsawChapters(guildId, missionId, memberIds): Promise<void>`
  - `DB.Coop.postJigsawSummary(guildId, missionId, userId, summary): Promise<void>`

- [ ] **Step 1: Add jigsaw methods to `Coop` in supabase-client.js**

Inside the `Coop` object, before its closing `};`, add:

```js
  async getJigsawAssignments(guildId, missionId) {
    const { data, error } = await _sb
      .from('guild_jigsaw_assignments')
      .select('*, profiles(username)')
      .eq('guild_id', guildId)
      .eq('mission_id', missionId);
    if (error) throw error;
    return data || [];
  },

  async assignJigsawChapters(guildId, missionId, memberIds) {
    const rows = memberIds.map((uid, i) => ({
      guild_id: guildId, mission_id: missionId,
      user_id: uid, chapter_index: i % 3, // 3 chapters for rattanakosin seed
    }));
    const { error } = await _sb.from('guild_jigsaw_assignments')
      .upsert(rows, { onConflict: 'guild_id,mission_id,user_id', ignoreDuplicates: true });
    if (error) throw error;
  },

  async postJigsawSummary(guildId, missionId, userId, summary) {
    const { error } = await _sb.from('guild_jigsaw_assignments')
      .update({ chapter_summary: summary, summary_posted: true })
      .eq('guild_id', guildId)
      .eq('mission_id', missionId)
      .eq('user_id', userId);
    if (error) throw error;
  },
```

- [ ] **Step 2: Write a failing static test**

In `tests/recall-static.test.mjs`, add:

```js
assert(db.includes('getJigsawAssignments'), 'DB.Coop must have getJigsawAssignments');
assert(db.includes('assignJigsawChapters'), 'DB.Coop must have assignJigsawChapters');
assert(db.includes('postJigsawSummary'), 'DB.Coop must have postJigsawSummary');
```

Run: expected FAIL.

- [ ] **Step 3: Modify coop.js — render jigsaw mission cards**

In `coop.js`, find the function that renders individual collab mission cards (likely `_renderMissionCard` or similar — search for `collab_missions` or `mission.title_th`).

When `mission.type === 'jigsaw'`, show a jigsaw card instead of the standard checkin card:

```js
function _renderJigsawCard(mission, assignments, currentUserId, guildId) {
  const myAssign   = assignments.find(a => a.user_id === currentUserId);
  const allPosted  = assignments.length >= 3 && assignments.every(a => a.summary_posted);
  const CHAPTER_LABELS = ['บทที่ 1: กำแพงเมือง', 'บทที่ 2: แกนพระราชวัง', 'บทที่ 3: วัดโพธิ์'];

  let bodyHtml;
  if (!myAssign) {
    bodyHtml = `<p style="font-size:12px;color:var(--color-muted)">
      รอผู้นำกิลด์กดปุ่ม <strong>แจกบทอ่าน</strong> เพื่อเริ่ม Jigsaw</p>`;
  } else if (allPosted) {
    bodyHtml = `<p style="font-size:12px;color:var(--color-success)">
      ✓ ทุกบทเสร็จสิ้น — ภาพรวมสมบูรณ์ปรากฏแล้ว!</p>
      <p style="font-size:11px;color:var(--color-muted)">
        ${assignments.map(a => `<strong>${escapeHtml(a.profiles?.username || '?')}:</strong>
        ${escapeHtml(a.chapter_summary || '')}`).join('<br>')}
      </p>`;
  } else if (!myAssign.summary_posted) {
    bodyHtml = `
      <p style="font-size:11px;color:var(--color-muted);margin-bottom:8px">
        บทของคุณ: <strong style="color:var(--color-white)">${escapeHtml(CHAPTER_LABELS[myAssign.chapter_index] || `บทที่ ${myAssign.chapter_index + 1}`)}</strong>
      </p>
      <p style="font-size:11px;color:var(--color-muted);margin-bottom:8px">
        ความคืบหน้า: ${assignments.filter(a => a.summary_posted).length}/${assignments.length} บทเสร็จสิ้น
      </p>
      <textarea id="jigsaw-summary-${escapeHtml(mission.id)}" maxlength="600" rows="3"
        style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--color-border);
               border-radius:var(--radius-md);color:var(--color-white);font-size:12px;
               padding:8px;resize:none;box-sizing:border-box;margin-bottom:8px"
        placeholder="สรุปสาระสำคัญจากบทที่คุณได้รับ (สูงสุด 600 ตัวอักษร)"></textarea>
      <button class="btn btn-primary btn-full" style="font-size:12px"
              onclick="CoopModule.postJigsawSummary('${escapeHtml(guildId)}','${escapeHtml(mission.id)}')">
        ส่งสรุปบท
      </button>`;
  } else {
    bodyHtml = `<p style="font-size:12px;color:var(--color-success)">
      ✓ คุณส่งสรุปแล้ว รอสมาชิกคนอื่น (${assignments.filter(a => a.summary_posted).length}/${assignments.length})</p>`;
  }

  return `
    <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                border:1px solid rgba(206,147,216,0.25);overflow:hidden;margin-bottom:12px">
      <div style="background:linear-gradient(135deg,rgba(206,147,216,0.15),rgba(206,147,216,0.04));
                  padding:var(--space-md);border-bottom:1px solid rgba(206,147,216,0.12)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:9px;text-transform:uppercase;font-weight:700;
                       color:#CE93D8;letter-spacing:1px">Jigsaw Mission</span>
          <span style="font-size:9px;color:var(--color-muted)">+${mission.reward_pts} pts</span>
        </div>
        <h4 style="font-family:var(--font-heading);font-size:14px;font-weight:700;margin:0">
          ${escapeHtml(mission.title_th)}
        </h4>
      </div>
      <div style="padding:var(--space-md)">
        ${bodyHtml}
      </div>
    </div>
  `;
}
```

- [ ] **Step 4: Wire `CoopModule.postJigsawSummary` and auto-assign in coop.js**

Inside the `CoopModule` IIFE, add:

```js
  async function postJigsawSummary(guildId, missionId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    const textarea = document.getElementById(`jigsaw-summary-${missionId}`);
    const summary  = textarea?.value?.trim();
    if (!summary) { window.AppCore?.showToast?.('กรุณาเขียนสรุปบทก่อน'); return; }
    try {
      await DB.Coop.postJigsawSummary(guildId, missionId, user.id, summary);
      window.AppCore?.showToast?.('✓ ส่งสรุปบทเรียบร้อยแล้ว');
      CoopModule.init(); // re-render
    } catch { window.AppCore?.showToast?.('ไม่สามารถส่งสรุปได้'); }
  }
```

And expose it: change the existing `return` at the end of the CoopModule IIFE (currently `return { load, renderMissionCard, subscribeProgress };`) to:

```js
return { load, renderMissionCard, subscribeProgress, postJigsawSummary };
```

- [ ] **Step 5: In `load()` in coop.js, detect `type === 'jigsaw'` and branch rendering**

`load()` has this loop at line 36–44:

```js
for (const m of missions) {
  const checkins  = existingCheckins.filter(c => c.mission_id === m.id);
  const myCheckin = checkins.find(c => c.user_id === user.id);
  const wrapper   = document.createElement('div');
  wrapper.dataset.missionId = m.id;
  wrapper.innerHTML = renderMissionCard(m, checkins.length, myCheckin);
  wrapper.querySelector('[data-checkin-btn]')?.addEventListener('click', () => _doCheckin(m, guild, user, wrapper));
  cardsEl.appendChild(wrapper);
  subscribeProgress(m.id, guild.guild.id, wrapper, m, user);
}
```

Replace the entire `for` block with:

```js
for (const m of missions) {
  const wrapper = document.createElement('div');
  wrapper.dataset.missionId = m.id;

  if (m.type === 'jigsaw') {
    const assignments = await DB.Coop.getJigsawAssignments(guild.guild.id, m.id);
    // Auto-assign chapters if leader and not yet assigned
    if (guild.role === 'leader' && assignments.length === 0) {
      const members = await DB.Coop.getGuildMembers(guild.guild.id);
      const memberIds = members.map(mem => mem.user_id);
      if (memberIds.length >= 2) {
        await DB.Coop.assignJigsawChapters(guild.guild.id, m.id, memberIds);
        assignments.push(...(await DB.Coop.getJigsawAssignments(guild.guild.id, m.id)));
      }
    }
    wrapper.innerHTML = _renderJigsawCard(m, assignments, user.id, guild.guild.id);
  } else {
    const checkins  = existingCheckins.filter(c => c.mission_id === m.id);
    const myCheckin = checkins.find(c => c.user_id === user.id);
    wrapper.innerHTML = renderMissionCard(m, checkins.length, myCheckin);
    wrapper.querySelector('[data-checkin-btn]')?.addEventListener('click',
      () => _doCheckin(m, guild, user, wrapper));
    subscribeProgress(m.id, guild.guild.id, wrapper, m, user);
  }

  cardsEl.appendChild(wrapper);
}
```

- [ ] **Step 6: Run static tests**

```
node tests/recall-static.test.mjs
```

Expected: all assertions pass.

- [ ] **Step 7: Suggested commit message**

```
feat: jigsaw learning — chapter assignment, summary post, full-picture reveal
```

---

## Task 8: Update NSC Proposal Docx

**Files:**
- Modify: `docs/ตามรอย_NSC_2026_v29.docx` via python-docx

- [ ] **Step 1: Run the update script**

Create `/tmp/update_docx.py` (temp file, not committed):

```python
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
import copy

path = '/home/papajittan/Documents/Tamroi/docs/ตามรอย_NSC_2026_v29.docx'
doc = Document(path)

def add_section(doc, heading, body_paragraphs):
    h = doc.add_paragraph(heading)
    h.style = doc.styles['Normal']
    for run in h.runs:
        run.bold = True
        run.font.size = Pt(13)

    for text in body_paragraphs:
        p = doc.add_paragraph(text)
        p.style = doc.styles['Normal']
        for run in p.runs:
            run.font.size = Pt(11)
    doc.add_paragraph('')  # spacing

# ── Heading for new section ──────────────────────────────────────────────────
sep = doc.add_paragraph('9. ฟีเจอร์การเรียนรู้ขั้นสูง (Advanced Educational Features)')
sep.style = doc.styles['Normal']
for run in sep.runs:
    run.bold = True
    run.font.size = Pt(14)
doc.add_paragraph('')

# ── 9.1 Retrieval Practice ───────────────────────────────────────────────────
add_section(doc, '9.1 การฝึกดึงความจำเชิงพื้นที่ (Retrieval Practice via Daily Mission)', [
    'หลังจากผู้เล่นอ่านและบันทึก Lore Node แล้ว ระบบจะจัดคิว "ภารกิจทบทวน" โดยอัตโนมัติ โดยล็อคให้ปลดล็อคได้ใน 3 วันหลังจากอ่าน',
    'รูปแบบ: ผู้เล่นต้องตอบคำถาม 1–2 ข้อจากความจำ โดยไม่ได้อ่านข้อมูลเดิมซ้ำ ถ้าตอบถูก — ได้รับคะแนนและภารกิจเสร็จสิ้น ถ้าตอบผิด — ระบบแสดงข้อความจาก Lore เดิมและตั้งคิวทบทวนใหม่อีก 3 วัน',
    'หลักการทางการศึกษา: Retrieval Practice (Testing Effect) ได้รับการพิสูจน์ว่าสร้างความจำระยะยาวได้แข็งแกร่งกว่าการอ่านซ้ำ การ "บังคับ" ให้ดึงข้อมูลจากความจำแทนการอ่านใหม่จึงเพิ่มประสิทธิภาพการเรียนรู้ได้อย่างมีนัยสำคัญ',
    'การ Implement: เพิ่ม recall_due_at ใน user_lore และ trigger SQL อัตโนมัติ, เพิ่ม type = "lore_recall" ใน daily_challenges, แสดงผลในหน้า Mission Tab',
])

# ── 9.2 Unsolved History ─────────────────────────────────────────────────────
add_section(doc, '9.2 ประวัติศาสตร์ที่ยังถกเถียง (Unsolved History)', [
    'สำหรับเหตุการณ์ทางประวัติศาสตร์ที่นักวิชาการยังมีความเห็นต่างกัน ระบบนำเสนอทั้งสองฝ่ายให้ผู้เล่นได้ศึกษาและลงคะแนนเสียง',
    'รูปแบบ: นำเสนอ "กรณี A" และ "กรณี B" ที่อิงจากการถกเถียงทางวิชาการจริง → ผู้เล่นอ่านทั้งสองฝ่ายแล้วลงคะแนนพร้อมให้เหตุผลสั้น ๆ → หลังจากโหวตแล้วจะเห็น % เสียงของชุมชนและตัวอย่างเหตุผลจากทั้งสองฝ่าย (โดยไม่เปิดเผยว่าใครโหวตอะไร)',
    'ตัวอย่างประเด็น: การดวลยุทธช้างของพระนเรศวร — มีหลักฐานทางประวัติศาสตร์หรือเป็นตำนาน? การล่มสลายของอยุธยา — ความขัดแย้งภายในหรือแสนยานุภาพพม่า?',
    'จุดปลดล็อค: ปลดล็อคหลังจากจับบุคคลสำคัญที่เกี่ยวข้องได้แล้ว ไม่มีคำตอบที่ถูกต้อง — จุดประสงค์คือฝึกทักษะการคิดวิเคราะห์ทางประวัติศาสตร์และการอ่านแหล่งข้อมูลอย่างมีวิจารณญาณ',
    'หลักการทางการศึกษา: สอดคล้องกับ Historical Thinking Skills ที่ใช้ในหลักสูตรมหาวิทยาลัย ช่วยให้ผู้เล่นเข้าใจว่าประวัติศาสตร์คือการตีความ ไม่ใช่แค่การท่องจำ',
])

# ── 9.3 Jigsaw Learning ──────────────────────────────────────────────────────
add_section(doc, '9.3 การเรียนรู้แบบ Jigsaw (Jigsaw Guild Mission)', [
    'สำหรับบุคคลสำคัญระดับ S/A Lore จะถูกแบ่งออกเป็น 3–4 บท แต่ละสมาชิกในกิลด์ได้รับบทที่ต่างกัน และต้องแบ่งปันสาระสำคัญให้กับกลุ่มก่อนที่จะปลดล็อคภาพรวมสมบูรณ์',
    'รูปแบบ: เมื่อกิลด์เปิดใช้งาน Jigsaw Mission → ระบบแจกบทอ่านให้สมาชิกแต่ละคนแบบ Round-Robin → แต่ละคนอ่านบทของตนเองและเขียนสรุปสาระสำคัญ → เมื่อทุกคนส่งสรุปครบ → ภาพรวมสมบูรณ์ปรากฏขึ้นพร้อมโบนัสคะแนนกิลด์',
    'หลักการทางการศึกษา: Jigsaw Cooperative Learning (Aronson, 1971) เป็นรูปแบบการเรียนแบบร่วมมือที่ได้รับการวิจัยรองรับ การที่แต่ละคนกลายเป็น "ผู้เชี่ยวชาญ" ในส่วนของตนและต้องสื่อสารกับคนอื่นช่วยเสริมความเข้าใจของตัวเองขณะสอนผู้อื่น',
    'การ Implement: เพิ่ม chapter_index ใน lore_nodes, เพิ่ม type = "jigsaw" ใน collab_missions, ตาราง guild_jigsaw_assignments สำหรับ track การแจกบทและสรุปที่ส่ง',
])

doc.save(path)
print('✓ Docx updated successfully')
```

Run: `python3 /tmp/update_docx.py`

Expected output: `✓ Docx updated successfully`

- [ ] **Step 2: Verify the docx opens correctly**

Open `docs/ตามรอย_NSC_2026_v29.docx` in LibreOffice Writer. Confirm section 9 appears at the end with three subsections.

- [ ] **Step 3: Suggested commit message**

```
docs: add section 9 (Retrieval Practice, Unsolved History, Jigsaw) to NSC proposal v29
```

---

## Task 9: Docs sync + Static regression test

**Files:**
- Modify: `CLAUDE.md` — add new DB tables + Runtime APIs
- Modify: `docs/FUNCTION_LOG.md` — add new DB objects
- Modify: `docs/VERIFYLOGIC.md` — add recall/debate/jigsaw game logic
- Modify: `tests/run-static.mjs` — add `recall-static.test.mjs` to suite
- Rename/finalize: `tests/recall-static.test.mjs` to cover all 3 features

- [ ] **Step 1: Rename and finalize `tests/recall-static.test.mjs` as `tests/new-features-static.test.mjs`**

Final contents of `tests/new-features-static.test.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (c, msg) => { if (!c) throw new Error(msg); };

// ── Retrieval Practice SQL ────────────────────────────────────────────────────
assert(existsSync(new URL('supabase/patch_retrieval_practice.sql', root)),
       'patch_retrieval_practice.sql must exist');
const rpSql = read('supabase/patch_retrieval_practice.sql');
assert(rpSql.includes('recall_due_at'), 'user_lore must gain recall_due_at');
assert(rpSql.includes('set_recall_due_at'), 'recall_due_at trigger must be defined');
assert(rpSql.includes('lore_recall'), 'daily_challenges must support lore_recall type');
console.log('✓ Retrieval Practice SQL checks passed');

// ── Retrieval Practice API ────────────────────────────────────────────────────
const db = read('js/supabase-client.js');
assert(db.includes('getRecallMissions'), 'DB.Missions must have getRecallMissions');
assert(db.includes('completeRecall'), 'DB.Missions must have completeRecall');
assert(db.includes('getRecallQuestions'), 'DB.Lore must have getRecallQuestions');
console.log('✓ Retrieval Practice API checks passed');

// ── Retrieval Practice UI ─────────────────────────────────────────────────────
const missionsJs = read('js/missions.js');
assert(missionsJs.includes('lore_recall'), 'missions.js must handle lore_recall type');
assert(missionsJs.includes('openRecall'), 'missions.js must export openRecall');
assert(missionsJs.includes('_handleRecallAnswer'), 'missions.js must have _handleRecallAnswer');
const appHtml = read('app.html');
assert(appHtml.includes('recall-modal'), 'app.html must have #recall-modal');
console.log('✓ Retrieval Practice UI checks passed');

// ── Unsolved History SQL ──────────────────────────────────────────────────────
assert(existsSync(new URL('supabase/patch_debates.sql', root)),
       'patch_debates.sql must exist');
const debateSql = read('supabase/patch_debates.sql');
assert(debateSql.includes('history_debates'), 'history_debates table must be defined');
assert(debateSql.includes('debate_votes'), 'debate_votes table must be defined');
assert(debateSql.includes('get_debate_stats'), 'get_debate_stats RPC must be defined');
assert(debateSql.includes('SECURITY DEFINER'), 'get_debate_stats must be SECURITY DEFINER');
console.log('✓ Unsolved History SQL checks passed');

// ── Unsolved History API + UI ────────────────────────────────────────────────
assert(db.includes('const Debates'), 'supabase-client.js must define Debates namespace');
assert(db.includes('getForFigure'), 'DB.Debates must have getForFigure');
assert(db.includes('get_debate_stats'), 'DB.Debates must call get_debate_stats RPC');
assert(existsSync(new URL('js/debates.js', root)), 'js/debates.js must exist');
const debatesJs = read('js/debates.js');
assert(debatesJs.includes('DebateModule'), 'debates.js must define DebateModule');
assert(debatesJs.includes('open'), 'DebateModule must have open()');
assert(appHtml.includes('debate-sheet'), 'app.html must have #debate-sheet');
assert(appHtml.includes('js/debates.js'), 'app.html must load js/debates.js');
const collectionJs = read('js/collection.js');
assert(collectionJs.includes('DebateModule.open'), 'collection.js must call DebateModule.open');
console.log('✓ Unsolved History API + UI checks passed');

// ── Jigsaw Learning SQL ───────────────────────────────────────────────────────
assert(existsSync(new URL('supabase/patch_jigsaw.sql', root)),
       'patch_jigsaw.sql must exist');
const jigsawSql = read('supabase/patch_jigsaw.sql');
assert(jigsawSql.includes('chapter_index'), 'lore_nodes must gain chapter_index');
assert(jigsawSql.includes('guild_jigsaw_assignments'),
       'guild_jigsaw_assignments table must be defined');
assert(jigsawSql.includes("type IN ('checkin', 'jigsaw')"),
       'collab_missions must support jigsaw type');
console.log('✓ Jigsaw Learning SQL checks passed');

// ── Jigsaw Learning API ───────────────────────────────────────────────────────
assert(db.includes('getJigsawAssignments'), 'DB.Coop must have getJigsawAssignments');
assert(db.includes('assignJigsawChapters'), 'DB.Coop must have assignJigsawChapters');
assert(db.includes('postJigsawSummary'), 'DB.Coop must have postJigsawSummary');
const coopJs = read('js/coop.js');
assert(coopJs.includes('jigsaw'), 'coop.js must handle jigsaw mission type');
console.log('✓ Jigsaw Learning API checks passed');

console.log('\n✓ All new-features-static checks passed');
```

- [ ] **Step 2: Add to test runner**

In `tests/run-static.mjs`, add `'tests/new-features-static.test.mjs'` to the `tests` array.

- [ ] **Step 3: Update CLAUDE.md — DB Tables table**

Add these rows to the DB Tables table in `CLAUDE.md`:

```
| `recall_due_at` column | patch_retrieval_practice | Auto-set on user_lore INSERT (trigger) — spaced recall gate |
| `quiz_questions.assessment_type` | patch_retrieval_practice | Distinguishes capture / pretest / recall questions |
| `history_debates` | patch_debates | Per-figure debate topics (case A vs B, citations) |
| `debate_votes` | patch_debates | One vote per user per debate; aggregate via get_debate_stats() RPC |
| `guild_jigsaw_assignments` | patch_jigsaw | Chapter-to-member assignment for jigsaw collab missions |
| `collab_missions.type` column | patch_jigsaw | 'checkin' (default) or 'jigsaw' |
| `lore_nodes.chapter_index` column | patch_jigsaw | Jigsaw chapter ordering (null = standalone lore) |
```

- [ ] **Step 4: Update CLAUDE.md — Runtime APIs table**

Add these entries under the Runtime APIs section:

```
- `window.DebateModule`: `open(figureId)`, `close()`, `_submitVote()`
- `window.DB.Debates`: `getForFigure(figureId)`, `getStats(debateId)`, `vote(debateId, userId, vote, reason)`
- `window.DB.Missions.getRecallMissions(userId)`, `completeRecall(userId, loreNodeId, wasCorrect)`
- `window.DB.Lore.getRecallQuestions(loreNodeId)`
- `window.DB.Coop.getJigsawAssignments(guildId, missionId)`, `assignJigsawChapters(guildId, missionId, memberIds)`, `postJigsawSummary(guildId, missionId, userId, summary)`
- `window.MissionModule.openRecall(challenge)`, `_handleRecallAnswer(correctOpt, loreNodeId, btn)`
```

- [ ] **Step 5: Update CLAUDE.md — Supabase Setup order**

Add after step 17 (`patch_notification_ref.sql`):

```
18. SQL Editor → `supabase/patch_retrieval_practice.sql`
19. SQL Editor → `supabase/patch_debates.sql`
20. SQL Editor → `supabase/patch_jigsaw.sql`
```

- [ ] **Step 6: Run full static suite to confirm all pass**

```
node tests/run-static.mjs
```

Expected: all tests pass including new `new-features-static.test.mjs`.

- [ ] **Step 7: Suggested commit message**

```
feat: new educational features — retrieval practice, debates, jigsaw (full implementation)

- patch_retrieval_practice.sql: recall_due_at trigger, lore_recall challenge type
- patch_debates.sql: history_debates, debate_votes, get_debate_stats SECURITY DEFINER RPC
- patch_jigsaw.sql: chapter_index, collab_missions.type, guild_jigsaw_assignments
- js/debates.js: DebateModule — vote form, results reveal, SECURITY DEFINER privacy
- js/missions.js: recall challenge cards + inline Bootstrap quiz modal
- js/collection.js: Unsolved History button in captured figure modal
- js/coop.js: jigsaw mission card — chapter assignment, summary post, full reveal
- js/supabase-client.js: DB.Debates, DB.Missions.getRecallMissions/completeRecall,
  DB.Lore.getRecallQuestions, DB.Coop jigsaw methods
- app.html: #recall-modal, #debate-sheet, js/debates.js script tag
- docs: NSC proposal v29 section 9, CLAUDE.md DB tables + APIs updated
- tests/new-features-static.test.mjs: 30-assertion regression gate
```
