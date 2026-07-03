# New Educational Features — Tamroi

> Proposed additions to strengthen the educational value for NSC 2026 submission.
> Basis: evidence-based pedagogy (retrieval practice, collaborative/jigsaw learning, critical thinking).

---

## 1. Retrieval Practice via Daily Mission

**What:** After a player reads and saves a lore node, a spaced-repetition recall mission is queued. It unlocks as a daily mission 3 days later.

**How it works:**
- On lore unlock → record `unlocked_at` in `user_lore`
- Daily mission generator checks: `NOW() - unlocked_at >= 3 days` → surface a "Recall" mission
- Mission format: no re-reading the lore — player must answer 2–3 questions from memory
- Correct → marks mission complete, awards points
- Wrong → shows the original lore excerpt, re-queues recall for 3 more days

**Why it's educational:** Retrieval practice (the "testing effect") produces stronger long-term retention than re-reading. Framing it as a daily mission keeps it lightweight and habit-forming.

**DB touch:**
- Add `recall_due_at` column to `user_lore` (set to `unlocked_at + interval '3 days'` on insert)
- New `recall_questions` table or reuse `quiz_questions` tagged with `type = 'recall'`
- New row type in `daily_challenges`: `type = 'lore_recall'`, references `lore_node_id`

---

## 2. Jigsaw Learning (Guild Co-op)

**What:** For a major historical figure (S/A-class), the lore is split into chapters. Each guild member is assigned a different chapter — they must share knowledge within the guild to assemble the full picture.

**How it works:**
- S/A-class figure lore is authored in 3–4 chapters (e.g., Early Life / Key Battle / Legacy / Controversy)
- On guild mission activation, each member is assigned one chapter (round-robin by `guild_members` order)
- Members can read only their own chapter until they post a summary in guild discussion
- Once all chapters are posted → full lore unlocks for everyone in the guild
- Guild collectively earns a "Full Picture" bonus

**Why it's educational:** Jigsaw is a peer-reviewed cooperative learning structure (Aronson, 1971). Each person becomes the "expert" on their piece and must communicate it clearly — reinforcing their own learning while teaching others.

**DB touch:**
- Add `chapter_index` to `lore_nodes` (nullable; null = single-chapter lore)
- New `guild_jigsaw_assignments` table: `(guild_id, mission_id, user_id, chapter_index, summary_posted)`
- New `collab_mission` type: `type = 'jigsaw'`

---

## 3. Unsolved History (Historical Debate)

**What:** For events where historians genuinely disagree, present both sides of the debate and let players vote + reason, then reveal the community's breakdown.

**How it works:**
- Content: short "Case A" and "Case B" write-ups (real historiographical debate, not fiction)
- Player reads both → casts a vote → optionally writes a reason (1–2 sentences)
- After voting: see the community vote split + top-voted reasons for each side
- No "correct answer" — the educational point is that history is interpreted, not just memorized
- Unlocks after the related figure is captured (gate to prevent spoilers)

**Examples:**
- Was King Naresuan's duel with the Crown Prince of Burma historically documented or legendary?
- Was the fall of Ayutthaya primarily due to internal conflict or Burmese military superiority?

**Why it's educational:** Teaches historical thinking and source criticism — the same skills measured in university-level history curricula. Distinguishes this app from rote-memorization edtech.

**DB touch:**
- New `history_debates` table: `(id, figure_id, title, case_a_text, case_b_text, source_citations)`
- New `debate_votes` table: `(id, debate_id, user_id, vote CHAR(1), reason TEXT)` — unique per `(debate_id, user_id)`
- RLS: users see aggregate counts only, not individual votes (privacy)

---

## Implementation Priority

| Feature | Effort | Educational Impact | Recommended Phase |
|---|---|---|---|
| Retrieval Practice | Medium | High (evidence-based) | Phase 2 |
| Unsolved History | Low–Medium | High (critical thinking) | Phase 2 |
| Jigsaw Learning | Medium–High | High (peer learning) | Phase 3 extension |

Retrieval Practice and Unsolved History are self-contained and can ship without Co-op infrastructure changes. Jigsaw builds on existing guild/collab mission tables and is best tackled as a Phase 3 extension.
