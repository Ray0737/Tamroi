# Jigsaw v2 — GPS Checkpoint + Timeline Reconstruction

**Date:** 2026-07-09
**Status:** Approved · Implemented 2026-07-09
**Scope:** Redesign of `type='jigsaw'` collab missions — GPS-gated visits, structured summaries with expert quiz gate, collaborative timeline-ordering merge phase, optional legendary encounter unlock.

---

## Problem

The v1 jigsaw was a static 3-chapter text split. Members are assigned a chapter label, write a free-text summary, and when all three are posted the summaries appear side-by-side. There is no GPS requirement, no knowledge gate, no real "merge" mechanic, and no meaningful payoff.

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

**Change from v1:** `assignJigsawChapters` now writes `lore_node_id` into each assignment row — the specific `lore_nodes.id` the member must physically visit for their chapter. Chapters are distributed round-robin by `chapter_index`.

**Member card (locked state):** shows chapter title, the lore node's name with a map deep-link (`window.MapModule.flyToLocation(lat, lng)`), and highlights that node's pin on the map.

---

## Phase 2 — Visit (GPS gate)

**Mechanism:** Reuses the existing lore proximity system in `map.js` — no new proximity logic needed. Entering `lore_nodes.radius_m` of the assigned node opens the standard lore sheet; unlocking inserts `user_lore (user_id, lore_id)` (existing behavior).

**Gate check:** On jigsaw card render, check whether `assignment.lore_node_id` is in the user's unlocked-lore set. Present → Phase 3 unlocked. Absent → card stays locked with a location hint.

**Dev bypass:** existing `_isDev()` localhost bypass applies, same pattern as the watchtower GPS gate.

---

## Phase 3 — Contribute

### Expert quiz gate

Fetch recall questions: `quiz_questions WHERE lore_id = lore_node_id AND assessment_type = 'recall'` (reuses `DB.Lore.getRecallQuestions`, already existed for spaced-repetition).

- MCQ, all must be answered correctly before the summary form appears
- 0 questions seeded for a node → gate skipped silently
- Wrong answer → toast + retry, no limit

### Structured summary form

Three fields instead of one freetext textarea: period/year, key figure, key event. Stored as JSON in `guild_jigsaw_assignments.chapter_summary`:
```json
{ "period": "...", "figure": "...", "event": "..." }
```

### On submit

`summary_posted = true`, `chapter_summary` written. Realtime on `guild_jigsaw_assignments` notifies the rest of the guild.

---

## Phase 4 — Merge

**Trigger:** every assignment row for `(guild_id, mission_id)` has `summary_posted = true`.

**Display:** cards in client-side shuffled order — deterministic seed (`guild_id + mission_id`) so every member sees the same shuffle, purely for group-discussion sanity (doesn't affect correctness).

**Drag-to-reorder:** native HTML5 drag events, no library.

**Submitting a vote:** writes `proposed_order` (array of `chapter_index` in the member's proposed sequence) to their own assignment row via `DB.Coop.setProposedOrder(assignmentId, order)`.

**All-agree + correctness — server-side, not client-side.** The client can only legitimately write its *own* assignment row under RLS, and there is no INSERT policy on `collab_mission_completions` — so the client cannot itself grant rewards or detect-and-announce a win for the whole guild. Instead, a `SECURITY DEFINER` trigger (`on_jigsaw_proposed_order`) fires on every `proposed_order` UPDATE and, once all rows agree and match the ground-truth `chapter_index` order, awards `reward_pts` + any `unlocks_figure_id` to every `summary_posted` participant server-side. The client just polls/subscribes and reads `collab_mission_completions` to know when to show the win screen. Unanimous-but-wrong votes are a silent no-op — client shows a retry button that clears everyone's `proposed_order`.

---

## Phase 5 — Result

**Correct:** trigger has already awarded points + inserted `user_jigsaw_encounters` rows. Client shows a win screen once `DB.Coop.isJigsawComplete()` confirms it.

**Wrong:** highlight the mismatch, "ลองใหม่" clears all `proposed_order` values via `DB.Coop.clearProposedOrders`, no penalty.

---

## Legendary Encounter Integration

`collab_missions.unlocks_figure_id` (nullable). When set, a correct merge grants every `summary_posted` participant a row in `user_jigsaw_encounters`. `MapModule.openLegendaryEncounter()` checks this table as an alternate unlock path alongside the existing support-node chain gate — completing the jigsaw bypasses the support-node requirement entirely for that figure.

Not all jigsaw missions unlock a legendary; the field is null by default.

---

## What Changed From the Original Spec During Implementation

The original spec assumed the *client* could insert a `collab_mission_completions` row and that "the existing trigger" (`check_collab_mission_threshold`) would fan out rewards. Neither holds: there's no client INSERT policy on `collab_mission_completions`, and the existing trigger reads its participant list from `collab_mission_checkins`, which the jigsaw flow never writes to. Fixed by moving both the completion-detection *and* the reward fan-out into a new `SECURITY DEFINER` trigger keyed off each member's own `proposed_order` UPDATE (an RLS-legal write) — see `supabase/patch_jigsaw_v2.sql`.

## What Is NOT in This Spec

- Realtime drag sync across members — add if latency in the vote flow feels off
- Reassign mechanic if a member goes offline — add if guilds report blockage
- Cold-case replay for new members — add later
- Photo proof at checkpoints — out of scope for v2
