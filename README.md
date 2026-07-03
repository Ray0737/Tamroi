# ตามรอย · Tamroi

> แอปพลิเคชันเพื่อการให้ความรู้ทางประวัติศาสตร์ผ่านเกมแผนที่แบบ Open World  
> Active Learning · History · Exploration · Travelling · Edutainment · NSC 2026

**NSC 2026** — National Software Contest  
ทีม **ปลามึกยักษ์** · โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม)  
วิชาเอกวิศวกรรมปัญญาประดิษฐ์ (AI)

> **Branch: `main`** — `Co-op` (guilds, collaborative missions, raid encounters, discussion threads) has been merged into main. Deployed on Vercel.

---

## What Is This?

**Tamroi (ตามรอย)** turns Thai history into a living open-world game. Players physically travel to real districts, check in at landmark Watchtowers to clear a Fog of War on a national map, then hunt for phase-locked legendary historical figures by visiting local cafés, OTOP shops, and minor landmarks — earning Legacy Points that rank them on a national leaderboard called **"The High Chronicler"**.

---

## Core Gameplay

```
Travel to a District
  → Reach Watchtower → Check In → Fog of War Clears
  → GPS proximity triggers Lore narration
  → Visit Support Nodes: 2 Cafés + 1 OTOP + 3 Landmarks
  → Phase Lock lifts on Legendary figures
  → Answer Quiz → Figure Captured → Legacy Points awarded
  → Map Discovery % increases → National Leaderboard rank up
```

Lore narration now runs a short pre-test/post-test knowledge check either side of each entry, so learning gains from reading Lore in the field can be measured directly (feeds into the NSC learning-outcome evaluation methodology — see `docs/pre-post_test_plan.md` for the full measurement plan).

The Collection/Archive tab sorts captured figures by class (S → A → B → C) and has an "Owned" filter pill to show only figures you've actually captured.

### Figure Classes

| Class | Points | Unlock |
|---|---|---|
| C-Class | 50 pts | Instant — 1-question quiz |
| B-Class | 100 pts | 1-question quiz only, no Support Node gate |
| A-Class | 200 pts | Support Node gate + 3-question quiz |
| S-Class / Legendary | 500 pts | Full Support Node chain required (or a group Raid for `raid_only` figures) |

### Leaderboard — The High Chronicler

| Metric | Description |
|---|---|
| Map Discovery % | Fog of War cleared across Thailand |
| The Archive | Total figures and artifacts captured |
| Legacy Score | Points by figure impact — King Taksin = 500 pts |

Player avatars (from Google OAuth or a custom profile picture) now show throughout — leaderboard rows, guild member lists, raid lobbies — instead of just initials.

---

## Team — ปลามึกยักษ์

| ชื่อ | อีเมล |
|---|---|
| รพี รัตนมนูญพร | raphee.rattanamanoonporn@gmail.com |
| รชยา เชวงกิจวณิช | charlotte.kamoshita00@gmail.com |
| ปภาวิชญ์ แซ่หลิ่ว | papawit@proton.me |

GitHub: [Ray0737/tam_roi](https://github.com/Ray0737/tam_roi)
