# REDO.md — Tamroi Sprint to Submission (single deadline)

> Created 2026-07-06, re-cut for a **single hard deadline**. Everything ships together.
> Source of the mandate: reviewer feedback (UI / figure names / gamification-definition) + the open gaps in `docs/PROJECT_SUMMARY.md` and `docs/GAME_LOGIC.md`.

## Deadline (non-negotiable)

| Milestone | Date | Deliverable |
|---|---|---|
| **Teacher doc** | ~Mon 13 Jul (buffer before submit) | Reworded proposal + name-verified roster to อ.ธนพนธ์ for a review pass |
| **SUBMIT — everything** | **Fri 17 Jul 2026** | (a) working game-feeling UI deployed, (b) full 22-section proposal, (c) working app with integrity fixes, (d) evaluation data in §16, (e) doc sent to teacher |

**11 working days for all of it (6→17 Jul).** This only fits if the tracks run **in parallel** — humans on proposal + evaluation from day 1, agents on UI + integrity in parallel — and if we **triage hard**. Priority tags below are load-bearing: **P0 = submission fails without it**, **P1 = do if on track**, **P2 = cut first**.

## The honest scope call (read this)

You cannot do *literally everything* on the old two-milestone backlog to a high bar in 11 days. Good news: the app **already works** (both phases merged + deployed), so "working app" is mostly already true — the sprint is UI redo + minimum integrity + proposal + evaluation, not a rebuild. The deep backlog items (fog sync, tier rebalance, full coord placement) are **explicitly deferred** — see "What we cut" at the bottom. If the team refuses to cut them, the deadline slips; say so now.

## The one design decision (still stands, harder now)

**No 2.5D/Pokémon-Go rebuild.** Infeasible in 11 days on vanilla-JS/Leaflet, and it invites *"why not just use Pokémon Go?"*. We build a distinct **aged-historical-map / ตามรอย (footsteps) identity** on the existing engine. Confirm before Track B starts.

---

# Parallel lanes (who works what, from day 1)

- **Lane H1 (human — proposal):** Track A.
- **Lane H2 (human — evaluation):** Track E. *Start immediately — it has the longest lead time and is the #1 slip risk.*
- **Lane A1 (agent — UI):** Track B.
- **Lane A2 (agent — integrity + hygiene):** Track C + the P0 items of Track D.

---

# TRACK A — Proposal & Framing  *(Lane H1)*

Root problem: the abstract writes *"game-based learning (Gamification)"* and the title is *"Historical Gamification Application"* — conflating two theories. Separate them.

| ID | P | Task | File | Done when |
|---|---|---|---|---|
| A1 | **P0** | Reframe thesis: primary = **serious game / game-based learning** (Situated Learning — Lave & Wenger; Experiential — Kolb, both already cited); gamification (Deterding) demoted to **retention layer**. Rewrite Abstract + §1.1 + §2 + §4. | docx → v31 | No sentence equates GBL with gamification; roles stated separately |
| A2 | **P0** | Retitle — drop "Gamification" as headline. e.g. *"Tamroi: A Location-Based Serious Game for Thai History Learning."* Update docx, `README.md`, `index.html <title>`. | docx, README, index.html | Title reflects serious-game framing everywhere |
| A3 | **P0** | State two-instrument eval in §1.1 + §16: **pre/post → learning gain**, **IMI → motivation**, **SUS → usability**. | docx §1.1, §16 | §16 names all three + what each proves |
| A4 | **P0** | Figure name verification: `Thai \| RTGS \| accepted-English \| title \| tier \| source`, verified vs an authority; re-check "no Rama-line kings." | new `docs/figure_names.md` + live `figures` | 74 names verified + cited; no Rama-line king remains |
| A5 | **P1** | Citation hygiene: verifiable ref per claim, first-use order, no orphans, no cross-section contradictions; renumber §21. | docx §21 | Passes first-use-order + no-orphan check |
| A6 | **P0** | Swap in new UI screenshots (§12). Blocks on B. | docx §12 | §12 shows redesigned UI |
| A7 | **P0** | Fill §16 with real results. Blocks on E. | docx §16 | Real pre/post + IMI/SUS numbers, no placeholders |
| A8 | **P0** | Send v31 to teacher (~13 Jul) with A1–A5 done (screenshots/results follow). | — | Doc sent with a feedback window before submit |

*Agent note:* docx extracts as mojibake under Windows cp874 — edit in Word/Docs, or convert to UTF-8 `.md` first (`python-docx` installed). Don't hand-edit XML.

---

# TRACK B — UI Redo  *(Lane A1)*

Sits on the existing Leaflet + Bootstrap shell. Use `css/variables.css` tokens; no hardcoded hex.

| ID | P | Task | Files | Done when |
|---|---|---|---|---|
| B1 | **P0** | Aged-map skin: CSS `filter` on `.leaflet-tile` (sepia/contrast/hue) + parchment texture under fog; fall back to Stamen/Stadia tiles if muddy. | `css/map.css`, `js/map.js` | Map reads as aged chart; fog still contrasts |
| B2 | **P0** | Avatar token replacing the blue GPS dot (footprint/character, subtle pulse). | `js/map.js`, `css/map.css`, `css/animations.css` | Position renders as themed avatar |
| B3 | **P0** | Illustrated markers: watchtower, per-tier figure frames (S/A/B/C), support nodes, "?" fallback — inline SVG data-URIs. | `js/map.js`, `css/map.css` | Each object type distinct; tiers visually distinct |
| B4 | **P0** | Capture juice: tier-scaled overlay, glow ring, S/A confetti (exists), + sound + `navigator.vibrate` + fog-clear sweep. | `css/animations.css`, `js/map.js` | Capture + fog-clear feel like game events |
| B5 | **P1** | Shell re-skin (top bar / nav / bottom sheets → parchment/seal motifs) + first-run **tutorial overlay** (judges demo cold). | `css/layout.css`, `css/components.css`, `app.html` | Stranger understands the loop; UI reads themed |
| B6 | **P1** | Themed loading/empty/error states (pairs with C4). | `css/components.css`, render paths | No silent/blank states |
| B7 | **P0** | Screenshot pass for §12 + submission. Feeds A6. | — | 6–10 clean framed screenshots |

**UI gate:** cold phone demo reads as a Thai-history *game*; capture/fog have motion; loop is self-explanatory. `node tests/run-static.mjs` green after each task.

---

# TRACK C — Learning-Loop Integrity  *(Lane A2)*

The substance behind reviewer comment #3 — right now capture proves persistence, not knowledge. Root-cause fixes in `supabase-client.js` / SQL.

| ID | P | Task | Files | Done when |
|---|---|---|---|---|
| C1 | **P0** | Stop shipping `correct_option`. Move correctness to a `SECURITY DEFINER` RPC `check_quiz_answer(question_id, choice)`. | new `supabase/patch_quiz_rpc.sql`, `js/supabase-client.js`, quiz flow | No answer key in client payload; capture still works |
| C4 | **P0** | Kill silent failures — score/lore/check-in write failures surface a toast (empty `.catch` hid the lore bug for weeks). | `js/supabase-client.js`, `map.js`, `coop.js` | Forced write failure shows a toast, not false success |
| C2 | **P1** | Retry cap on quiz (e.g. 3 + cooldown). | quiz flow / C1 RPC | Nth wrong answer blocks with cooldown |
| C3 | **P1** | Gate S/A capture on reading the tied lore first (teaching on the critical path). | capture gate, `collection.js`/`map.js` | S/A blocked until tied lore unlocked |
| C5 | **P2** | Server-authoritative lore/bonus scoring (RPC/trigger) — closes console self-inflation. | new `supabase/patch_score_rpc.sql`, `supabase-client.js` | Client can't set `legacy_score` directly |

---

# TRACK D — Production Hygiene  *(Lane A2, P0 subset only)*

Only the submission-blocking subset survives the compression. Rest deferred (see cuts).

| ID | P | Task | Files | Done when |
|---|---|---|---|---|
| D1 | **P0** | Apply `patch_era.sql` live + seed era text (column never existed → all figures show fallback). | `patch_era.sql`, live DB | Real era labels show |
| D8 | **P0** | Remove mock Satit data from prod **after** E3 field test, before the submit build. | `patch_mock_satit.sql`, live DB | No `satit_test` in submission build |
| D11 | **P0** | Production smoke pass on the deployed Vercel build. | `docs/production-smoke.md` | Smoke green on prod URL |
| D5 | **P1** | Audit `DB.Raid.insertCaptures` RLS (host inserts for other users). | `patch_coop.sql` RLS | Non-participant can't be awarded a capture |
| D3 | **P1** | GPS gate on co-op mission check-in (`_doCheckin` is DB-only). | `js/coop.js` | Remote co-op check-in rejected |
| D2 | **P1** | Place coords for **priority figures only** (all S/A + 14 headline figures) — not the full 47. | live `figures`, `docs/Db.md` | Priority figures pinned; "?" only on long-tail C |
| D9 | **P2** | Fix `playwright.config.mjs` Windows paths. | `playwright.config.mjs` | e2e spec runs locally |

---

# TRACK E — Evaluation  *(Lane H2 — START DAY 1, top slip risk)*

§16 needs real data and data needs testers — this is the tightest constraint under a single deadline.

| ID | P | Task | When | Done when |
|---|---|---|---|---|
| E1 | **P0** | Build eval Google Form: IMI + SUS + satisfaction/NPS. | 6–7 Jul | Form live |
| E2 | **P0** | Verify in-app pre/post flow writes to `user_lore_assessments` + shows delta. | 6–8 Jul | Test run records pre+post+delta |
| E3 | **P0** | Run the field test (Satit pilot). **Reduced n acceptable** — aim ≥ 10 testers for a defensible sample under time pressure. | **9–14 Jul** | Pre/post + IMI/SUS collected |
| E4 | **P0** | Analyze + write §16 (knowledge gain, IMI, SUS). Feeds A7. | 14–15 Jul | §16 filled with real numbers |

---

# Compressed schedule (11 days, parallel)

| Dates | H1 proposal | H2 eval | A1 UI | A2 integrity/hygiene |
|---|---|---|---|---|
| **Sun 6 – Tue 8** | A1 reframe draft, A2 retitle | E1 form, E2 verify pre/post | B1 skin, B2 avatar | C1 quiz RPC, C4 toasts |
| **Wed 9 – Fri 11** | A3 eval story, A4 names | **E3 field test begins** | B3 markers, B4 capture juice | D1 era, C2 retry cap |
| **Sat 12 – Sun 13** | A5 citations, **A8 send to teacher** | E3 continues | B5 shell + tutorial, **UI freeze** | D5 raid RLS, D3 coop gate |
| **Mon 14** | teacher-feedback fixes | **E3 ends**, E4 analysis | B7 screenshots → A6 | D2 priority coords, C3 lore gate |
| **Tue 15** | A6 screenshots in, **A7 §16 from E4** | E4 writeup done | B6 states | C5 (if P1 clear), D8 remove mock |
| **Wed 16** | full-doc proofread + citation check | — | polish/buffer | D11 prod smoke, final regression |
| **Thu 16 pm / Fri 17** | **SUBMIT everything** | — | — | — |

Note: teacher doc goes out **13 Jul** (A8) with framing + names locked; screenshots/§16 numbers follow by 15 Jul so the teacher review overlaps the last polish.

---

# What we cut (explicit deferrals — post-submission)

These were on the old 23-Jul backlog and **do not fit** an all-in-17 sprint. Log them as "future work" in §18 of the proposal so they read as roadmap, not gaps:
- **D6 walk-cell fog DB sync** — stays localStorage-only (documented limitation §13).
- **D7 tier rebalance to 20/80** — stays ~43/57; note as tuning in progress.
- **D2 full 47-figure coord placement** — only priority figures get coords; long-tail keeps the "?" fallback.
- **D4 group-mission double-render de-dupe** — cosmetic; cards still work.
- **D10 dead prepost seed rows** — harmless; clean later.
- **C5 server-side scoring** — only if the P0/P1 work finishes early.
- Full offline/PWA, server-side GPS validation (PostGIS), Historical AI — already out of scope.

---

# How coding agents work this plan

1. **One task ID per session/PR** — each row names files, why, and the "done when" check. Don't batch unrelated IDs.
2. **Ponytail mode** — shortest diff that passes the check; reuse existing helpers (`escapeHtml`, Haversine gate, capture-trigger pattern, tokens). Stop at the first rung that holds.
3. **Root-cause, not symptom** — fix shared functions once; grep callers before patching one path.
4. **DB calls stay in `supabase-client.js`**; new SQL → new `supabase/patch_*.sql` added to the CLAUDE.md run order.
5. **One runnable check per non-trivial task** (extend `tests/run-static.mjs`); run it green before finishing.
6. **After changes:** update `docs/progress.md`, `docs/FUNCTION_LOG.md`, `docs/GAME_LOGIC.md`, `CLAUDE.md` tables, then `graphify update .`.
7. **Never commit** — output the suggested message, human runs it.
8. **Verify in the real app** (Live Server :5500) for anything with runtime surface.

# Definition of done (17 Jul)

Cold phone demo reads as a Thai-history *game* with motion; full 22-section proposal reflects the serious-game framing with verified names and **real §16 evaluation numbers**; integrity is visible (answers not shipped, failures surfaced); mock data gone, prod smoke green; doc in the teacher's hands with a feedback pass done.
