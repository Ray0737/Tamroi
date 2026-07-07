# ตามรอย · Tamroi

> แอปพลิเคชันเพื่อการให้ความรู้ทางประวัติศาสตร์ผ่านเกมแผนที่แบบ Open World  
> Active Learning · History · Exploration · Travelling · Edutainment · NSC 2026

**NSC 2026** — National Software Contest  
ทีม **ปลามึกยักษ์** · โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม)  
วิชาเอกวิศวกรรมปัญญาประดิษฐ์ (AI)

> **Branch: `main`** — `Co-op` (guilds, collaborative missions, raid encounters, discussion threads, community feed) plus Retrieval Practice, Historical Debates (Unsolved History), and Jigsaw Learning are all merged into main. Deployed on Vercel.  
> **Latest:** figure biography detail view with an interactive relationship graph between historical figures (`figure_relations` table, force-directed via `js/figure-graph.js`), multi-watchtower districts (Wattana now requires checking in at both Satit PSM and Terminal 21 before the district fully clears, via a Supabase completion trigger — other districts unchanged), watchtower check-in reveal switched from the district's placeholder-rectangle polygon to a real circle radius (also fixes the growing fog-clear sweep animation to match), walk-trail fog switched from blocky grid cells to smooth circles-per-GPS-point, real-time fog sync now reconnects with backoff instead of silently going stale on a dropped websocket, closed a proximity-check gap on B/A/S quiz capture (every other interaction already required being physically close — this one didn't), map camera got a pitch toggle (top-down ⇄ 60° tilt) and full 360° rotation, 3D building extrusion with a Starry-Night-inspired color palette plus a matching blue tint over the whole map, and map engine replatformed from Leaflet to MapLibre GL for the tilted camera view, locate-me FAB (flies to live GPS), map zoom lock, Collection class filter as a dropdown with a combinable "Owned" toggle, C-Class proximity capture (80m radius circle, always-visible markers, tap-to-capture sheet) with new C-Class figures, captured figures hidden from the map at init, lore unlocks persisting to `user_lore` correctly, figure cameo on lore chain completion, watchtower check-in Encounter Key gating A-tier encounters, forum moderation with probation, and a PDPA age-consent step at onboarding.

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

### Educational Features

| Feature | What it does |
|---|---|
| **Retrieval Practice** | Spaced-repetition recall mission queued 3 days after a lore node is read — no re-reading, answer from memory |
| **Unsolved History** | Present both sides of a real historiographical debate, players vote + reason, then see the community breakdown — no "correct answer" |
| **Jigsaw Learning** | Legendary figure lore is split into chapters across guild members, who must share summaries to unlock the full picture together |

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
