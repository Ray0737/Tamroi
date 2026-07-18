# Framing Fix Report — Gamification → Serious Game / Game-Based Learning

> Report for proposal edit (Track A1 in `REDO.md`). Answers reviewer comment #3:
> *"the นิยาม of gamification… ดูนิยามอีกที — ไม่แน่ใจว่าเป็นเกมเพื่อการเรียนรู้หรือเปล่า"*
>
> **Root problem:** the proposal conflates two distinct theories. The Abstract literally writes *"game-based learning (Gamification)"* and the title is *"Historical Gamification Application."* A judge reads this as the team not knowing which theory it stands on. The fix is one conceptual move applied in ~5 places.

---

## 0. The spine — the distinction to embed everywhere

Arm the doc with citable definitions so the correction is defensible, not a word swap:

- **Gamification** = *"the use of game **design elements** in **non-game contexts**"* (Deterding, Dixon, Khaled & Nacke, 2011). → points, badges, leaderboards, streaks, collection bolted onto a non-game activity (e.g. a coffee loyalty card: buy 10 get 1 free).
- **Serious Game / Game-Based Learning (GBL)** = a **full game** whose primary purpose is learning; learning happens *through playing the game itself* (Michael & Chen, 2006) — grounded in **Situated Learning** (Lave & Wenger, 1991) and **Experiential Learning** (Kolb, 1984).

### The winning argument (put this reasoning in §2)

> By Deterding et al.'s own definition, gamification applies game elements to a *non-game context*. Tamroi is not a non-game context — it **is** a game (a map-exploration game with quests, capture, and quizzes). Therefore Tamroi is properly classified as a **location-based serious game for game-based learning**, which **additionally employs gamification elements** (points, leaderboard, collection, streaks, guild competition) as a **motivation and retention layer**.

That single paragraph answers the reviewer's entire comment.

### The clean model in one line

> Tamroi is a **location-based serious game** for Thai history learning (**game-based learning**) that **additionally uses gamification** as a motivation/retention layer — with each claim backed by its own instrument (learning → Pre/Post-test; motivation → IMI; usability → SUS).

---

## 1. Title

| | |
|---|---|
| **Now (EN)** | *"Tamroi" — Historical Gamification Application via Open-World Map Game* |
| **→ EN** | *"Tamroi": A Location-Based **Serious Game** for Thai History Learning* |
| **Now (TH)** | *…แอปพลิเคชันเพื่อการเรียนรู้…(Gamification)…* |
| **→ TH** | *"ตามรอย": **เกมเพื่อการเรียนรู้**ประวัติศาสตร์ไทยแบบอิงพิกัดสถานที่จริงบนแผนที่แบบเปิดโลก* |

Drop "Gamification" as the headline noun — it is the retention layer, not the thesis. Also update `README.md` and `index.html <title>`.

---

## 2. Abstract (the core conflation)

**Delete** the parenthetical equation *"game-based learning (Gamification)."*

**→ Replace (EN):**

> "Tamroi" is a **location-based serious game** for Thai history learning, in which learning occurs through gameplay grounded in **Situated Learning** (Lave & Wenger, 1991) and **Experiential Learning** (Kolb, 1984). The game **additionally employs gamification elements** — points, leaderboards, a collection archive, and guild competition — as a **motivation and retention layer** (Deterding et al., 2011).

**→ Replace (TH):**

> "ตามรอย" เป็น**เกมเพื่อการเรียนรู้ (Serious Game) แบบอิงพิกัดสถานที่จริง** ที่ให้ผู้เรียนเกิดการเรียนรู้ประวัติศาสตร์ไทย**ผ่านการเล่นเกม** ตามแนวคิดการเรียนรู้เชิงสถานการณ์ (Situated Learning) และการเรียนรู้เชิงประสบการณ์ (Experiential Learning) ทั้งนี้ระบบยัง**นำกลไกเกมมิฟิเคชัน (Gamification)** เช่น คะแนน กระดานจัดอันดับ คลังสะสม และการแข่งขันแบบกิลด์ มาใช้เป็น**ชั้นเสริมแรงจูงใจและการคงอยู่ (Retention)** อีกด้วย

---

## 3. Keywords

| | |
|---|---|
| **Now** | *Game-Based Learning Mechanisms, Situated Learning, …* |
| **→** | **Serious Game, Game-Based Learning, Situated Learning, Experiential Learning, Gamification (retention layer), Interactive Map, Thai History, Historical Figures** |

Lead with GBL; keep gamification as a distinct, subordinate term.

---

## 4. §1.1 Objectives — split into two measurable objectives

Wherever an objective bundles design + learning under "(Gamification)", split it so evaluation maps cleanly:

**→ Add / replace (TH):**

> - เพื่อพัฒนา**เกมเพื่อการเรียนรู้ (serious game)** ที่ให้ผู้เรียนเรียนรู้ประวัติศาสตร์ผ่านการเล่นและการเดินทางไปสถานที่จริง — วัดผล**การเรียนรู้**ด้วยแบบทดสอบก่อน/หลังเรียน (Pre/Post-test)
> - เพื่อ**นำกลไกเกมมิฟิเคชัน (gamification)** มาเสริม**แรงจูงใจและการมีส่วนร่วม (engagement)** — วัดผลด้วย Intrinsic Motivation Inventory (IMI)

This is what makes *"is it really for learning?"* answerable with **data**: two claims, two instruments.

---

## 5. §2 Theory — add the "why not gamification" paragraph

You already cite Deterding, Lave & Wenger, and Kolb. Immediately after the Deterding citation, insert **the winning argument from §0** ("Tamroi is not a non-game context — it *is* a game…"). This converts the reviewer's objection into a demonstration of conceptual rigor.

---

## 6. §16 Evaluation — state the three-instrument split

Make §16 explicitly map each instrument to the claim it proves:

| Instrument | Proves | Claim it defends |
|---|---|---|
| **Pre/Post-test** (knowledge delta) | Learning happened | The **serious-game / GBL** thesis |
| **IMI** (Intrinsic Motivation Inventory) | Players were motivated | The **gamification** retention layer |
| **SUS** (System Usability Scale) | The app is usable | Product quality |

---

## Checklist before submit

- [ ] Title changed in docx, `README.md`, `index.html`
- [ ] Abstract parenthetical *"(Gamification)"* after "game-based learning" removed (TH + EN)
- [ ] Keywords reordered — Serious Game / GBL lead
- [ ] §1.1 has two separate, instrument-mapped objectives
- [ ] §2 contains the "not a non-game context" paragraph
- [ ] §16 has the three-instrument table with real numbers
- [ ] No remaining sentence equates GBL with gamification anywhere in the doc
- [ ] References (§21) include Deterding et al. 2011, Lave & Wenger 1991, Kolb 1984, Michael & Chen 2006 — in first-use order, no orphans

---

## References to have in §21

- Deterding, S., Dixon, D., Khaled, R., & Nacke, L. (2011). *From game design elements to gamefulness: defining "gamification."* Proceedings of the 15th International Academic MindTrek Conference.
- Lave, J., & Wenger, E. (1991). *Situated Learning: Legitimate Peripheral Participation.* Cambridge University Press.
- Kolb, D. A. (1984). *Experiential Learning: Experience as the Source of Learning and Development.* Prentice Hall.
- Michael, D., & Chen, S. (2006). *Serious Games: Games That Educate, Train, and Inform.* Thomson Course Technology.

> **Note:** verify each citation's exact page/edition against the actual source before submission — do not ship a reference you haven't opened.
