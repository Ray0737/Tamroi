# ตามรอย · Tamroi

> **แอปพลิเคชันเพื่อการให้ความรู้ทางประวัติศาสตร์ผ่านเกมแผนที่แบบ Open World**  
> Active Learning · History · Exploration · Travelling · Edutainment

**NSC 2026** — National Software Contest  
ทีม **ปลามึกยักษ์** · โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม)  
วิชาเอกวิศวกรรมปัญญาประดิษฐ์ (AI)

---

## Concept

**Tamroi (ตามรอย)** turns Thailand's history into a living open-world game. Players travel to real districts, check in at landmark "Watchtowers" to clear a Fog of War, then hunt for phase-locked legendary historical figures by visiting local cafés, OTOP shops, and minor landmarks — earning points that rank them on a national leaderboard called **"The High Chronicler"**.

**Primary user:** Tourist / traveler, age 20–30

---

## Gameplay

### Phase 1 — Free Exploration (Clearing the Fog)

The **Watchtower Mechanic**: travel to any province or district, reach the main landmark and check in → the Fog of War disappears for that zone, revealing nearby cafés, OTOP shops, and minor historical clues.

### Phase 2 — The Unlock Chain (Capturing Historical Figures)

| Class | Description | How to unlock |
|---|---|---|
| **C-Class** | Low-impact figures | Captured immediately with a simple quiz once found |
| **S-Class / Legendary** | Famous Kings, National Heroes | **Phase-Locked** — must first build Support Node progress |

**Support Nodes required to unlock Legendary figures:**
- Visit **2 Local Cafés** → gather *Local Rumors*
- Visit **1 OTOP / Workshop** → obtain a *Relic* or *Special Item*
- Check-in at **3 Nature / Minor Landmarks** → build *Historical Knowledge*
- *(Hidden mechanic: identity concealed for the rarest characters)*

> **Bangkok bonus:** Using public transport (BTS/MRT) activates a ×2 points buff.  
> **Proximity lore:** Entering GPS range of a historic site triggers contextual historical narration.

### Full Game Flow

```
Travel to District
  → Reach Watchtower → Clear Fog
  → Phase-Locked Legendary Figure revealed
  → Visit 3–5 local Cafés / OTOPs to unlock encounter
  → Complete Artifact Hunt → Answer Master Quiz
  → Figure Captured → Legacy Points earned
  → Map Discovery % increases → National Leaderboard rank up
```

---

## The High Chronicler (Leaderboard)

Three metrics determine the most influential traveler in Thailand:

| Metric | Description |
|---|---|
| **Map Discovery %** | Percentage of Thailand's Fog of War cleared, district by district |
| **The Archive** | Total Historical Figures and Artifacts successfully captured |
| **Legacy Score** | Points weighted by *Impact Value* (King Taksin = 500 pts · Local Village Legend = 50 pts) |

---

## Development Roadmap

### Phase 1 — Web MVP · *"The Digital Lab Foundation"* ← **Current**
- Launch a mobile-responsive web app to validate the Watchtower and Fog logic
- GPS-based check-ins at landmarks · map colour transition (sepia → full colour on exploration) · simple multiple-choice quizzes for C-Class figures
- **Tech:** Leaflet.js · Supabase (Auth + PostgreSQL + RLS) · Bootstrap 5 · Vanilla JS

### Phase 2 — Mobile App · *"The Immersive Leap"*
- Migrate from browser to dedicated iOS / Android app
- Native AR captures · background GPS tracking for proximity lore alerts · QR code scanning at OTOP / Café outposts
- **Tech:** React Native · AR engines (ARKit / ARCore)

### Phase 3 — Co-Op & Community · *"The Social Layer"*
- Raid Encounters: Legendary figures require 3+ players to solve riddles together
- District Leaderboards · artifact trading system between players
- **Tech:** Real-time sockets (Supabase Realtime / Socket.io)

### Phase 4 — Seasonal Content · *"The Live Service Era"*
- Rotating Main Quest seasons: *Ayutthaya Rising* → *The Silk Road* → *Modern Revolution*
- Era Filters toggle on the map to shift historical periods
- Expandable beyond Thailand to international and global history themes

### Phase 5 — Business & Media Ecosystem
- **Media Tie-ins:** Partner with film studios for limited-edition characters from Thai period dramas
- **Brand Outposts:** Certified cafés and landmarks become Premium Nodes offering real-world discounts in exchange for in-game Stamina
- **Government Bounties:** Tourism Authority of Thailand (TAT) sponsored events for rural discovery
- **Green Logistics:** Boats and trains grant massive XP multipliers and rare rewards

---

## Tech Stack (Phase 1)

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS |
| Map & Fog | Leaflet.js + CartoDB Dark tiles |
| Backend / Auth | Supabase — PostgreSQL · Auth · Row Level Security |
| Deployment | Vercel (static + Node.js build step for env injection) |

---

## Project Structure

```
├── index.html          Splash / landing
├── login.html          Email + Google OAuth login & register
├── onboarding.html     First-run: location permission + home district picker
├── app.html            Main app shell — Map · Collection · Mission · Leaderboard
├── build.js            Vercel build script — injects Supabase env vars at deploy time
├── vercel.json         Deployment config + security headers (CSP, X-Frame, Permissions-Policy)
├── css/
│   ├── variables.css   Design tokens (colors, spacing, radii, transitions)
│   ├── layout.css      Top bar, bottom nav, tab shell
│   ├── components.css  Buttons, cards, inputs, bottom sheets, badges
│   ├── map.css         Leaflet overrides, fog layer, markers, node info card, GPS dot
│   └── animations.css  Keyframes (blobMorph, floatY, locationPulse, …)
├── js/
│   ├── env.js          Public Supabase anon config for local/static runtime
│   ├── env.example.js  Credentials template for resetting env.js
│   ├── config.js       Reads window.ENV → window.APP_CONFIG
│   ├── utils.js        escapeHtml() XSS utility
│   ├── supabase-client.js  DB & Auth helpers (Auth · Profiles · Districts · Figures · Leaderboard)
│   ├── app.js          Boot · auth guard · tab navigation · notifications
│   ├── map.js          Leaflet · Fog of War (inverted polygon) · watchtowers · GPS dot
│   ├── fog-grid.js     Reusable Thailand grid helper for future fog work
│   ├── collection.js   Figures + artifacts grid
│   ├── missions.js     Active quest + daily challenges
│   └── leaderboard.js  Podium + rank list
└── supabase/
    ├── schema.sql           Full DB schema + Bangkok district seed data
    ├── patch_auth_fix.sql   Auth trigger fix + RLS INSERT policy
    ├── patch_lore.sql       Lore/support-node visit/quiz tables + score trigger
    └── patch_district_seed.sql MVP district seed parity with map.js
├── tests/
│   └── run-static.mjs       One-command static regression suite
├── docs/
│   ├── CODING_INSTRUCTIONS.md Design system and implementation rules
│   ├── dev-plan.md         Phase 1 development plan
│   ├── dev-plan-prompt.xml Planning prompt and task history
│   ├── progress.md         Current implementation progress
│   ├── production-smoke.md Supabase/Vercel smoke-test checklist
│   └── proposal/
│       └── tam_roi_nsc_proposal.md NSC proposal
├── document/               NSC assets, screenshots, and generated documents
├── AGENTS.md               Agent instructions
├── CLAUDE.md               Claude/Codex project guide
└── README.md
```

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Ray0737/NSC_2026.git
cd NSC_2026

# 2. Check local Supabase config
# js/env.js is tracked; keep it to public anon/dev-safe values only
# Edit js/env.js if you need a different Supabase URL or anon key

# 3. Serve with VS Code Live Server or any static server
# No npm install or build step needed for local development
```

Static regression checks:

```bash
node tests/run-static.mjs
```

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. **SQL Editor → New Query** → run `supabase/schema.sql`
3. **SQL Editor → New Query** → run `supabase/patch_auth_fix.sql`
4. **SQL Editor → New Query** → run `supabase/patch_lore.sql`
5. **SQL Editor → New Query** → run `supabase/patch_district_seed.sql`
6. **Authentication → Providers → Email** → disable *"Confirm email"* for development
7. **Authentication → URL Configuration** → add `http://127.0.0.1:5500/**` as a redirect URL
8. **Settings → API** → copy *Project URL* and *anon public key* into `js/env.js`

`js/env.js` is intentionally trackable for this prototype. Only store the Supabase project URL and anon public key there. Never place service-role keys, private tokens, `.env` secrets, or production-only credentials in client-side files.

---

## Vercel Deployment

1. Import the repo in [vercel.com](https://vercel.com)
2. Root Directory: leave as `.` (repo root)
3. **Settings → Environment Variables** → add:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGci...`
4. Deploy — `build.js` generates `js/env.js` from env vars at build time

---

## Team — ปลามึกยักษ์

| ชื่อ | อีเมล |
|---|---|
| รพี รัตนมนูญพร | raphee.rattanamanoonporn@gmail.com |
| รชยา เชวงกิจวณิช | charlotte.kamoshita00@gmail.com |
| ปภาวิชญ์ แซ่หลิ่ว | papawit@proton.me |

GitHub: [Ray0737](https://github.com/Ray0737)
