# ตามรอย · Tamroi

> **แอปพลิเคชันเพื่อการให้ความรู้ทางประวัติศาสตร์ผ่านเกมแผนที่แบบ Open World**
> Active Learning · History · Exploration · Travelling · Edutainment

**NSC 2026** — National Software Contest
ทีม **ปลามึกยักษ์** · โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม)
วิชาเอกวิศวกรรมปัญญาประดิษฐ์ (AI)

---

## What Is This Project?

**Tamroi (ตามรอย)** is a gamified Thailand travel-discovery web app that turns Thai history into a living open-world game. Players physically travel to real districts, check in at landmark "Watchtowers" to clear a Fog of War on a national map, then hunt for phase-locked legendary historical figures by visiting local cafés, OTOP shops, and minor landmarks — earning Legacy Points that rank them on a national leaderboard called **"The High Chronicler"**.

**Primary user:** Tourist / traveler, age 20–30
**Platform:** Mobile-first web app (375–430px base), deployed on Vercel
**Category:** Edutainment — promotes cultural tourism and Thai history through gamification

---

## Core Gameplay Concept

```
Travel to a District
  → Reach Watchtower → Check In → Fog of War Clears
  → GPS proximity triggers Lore narration (historical context)
  → Visit Support Nodes: 2 Cafés + 1 OTOP + 3 Landmarks
  → Phase Lock lifts on Legendary figures
  → Answer Master Quiz (3 questions all correct)
  → Figure Captured → Legacy Points awarded (DB trigger)
  → Map Discovery % increases → National Leaderboard rank up
```

### Figure Class System

| Class | Examples | How to Unlock | Legacy Points |
|---|---|---|---|
| **C-Class** | Local Village Legend, OTOP Craft Master | Instant — 1-question quiz on check-in | 50 pts |
| **A-Class** | Sunthorn Phu, Sri Suriyothai | Support Node gate + 3-question quiz | 200 pts |
| **S-Class / Legendary** | King Taksin, King Rama I | Phase-locked — full Support Node chain required | 500 pts |

### Support Node Chain (Phase Lock)

Legendary figures are locked until these per-district requirements are met:

| Node Type | Requirement | Reward |
|---|---|---|
| Local Cafés | Visit 2 cafés (`cafes_visited >= 2`) | *Local Rumors* |
| OTOP / Workshop | Visit 1 shop (`otops_visited >= 1`) | *Relic / Special Item* |
| Landmarks / Nature | Check-in at 3 sites (`landmarks_visited >= 3`) | *Historical Knowledge* |

> **Bangkok bonus:** GPS proximity to BTS/MRT station activates ×2 points multiplier.
> **Proximity lore:** Entering GPS range of a historic site triggers contextual historical narration.

### Leaderboard — The High Chronicler

| Metric | Description |
|---|---|
| **Map Discovery %** | Percentage of Thailand's Fog of War cleared, district by district |
| **The Archive** | Total Historical Figures and Artifacts captured |
| **Legacy Score** | Points weighted by Impact Value — King Taksin = 500 pts · Local Village Legend = 50 pts |

---

## All Functions — Main & Sub-Functions

### 1. Authentication System (`js/supabase-client.js` → `window.DB.Auth`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Sign In** | `DB.Auth.signIn(email, password)` | Email + password login via Supabase Auth |
| **Sign Up** | `DB.Auth.signUp(email, password, username)` | Register with `emailRedirectTo` back to `login.html` |
| **Google OAuth** | `DB.Auth.signInGoogle()` | OAuth redirect → `onboarding.html` on success |
| **Sign Out** | `DB.Auth.signOut()` | Terminate session |
| **Session Check** | `DB.Auth.getSession()` | Returns current session or null |
| **Get User** | `DB.Auth.getUser()` | Returns authenticated user object |
| **Auth State Watch** | `DB.Auth.onStateChange(callback)` | Listens for login/logout events |
| **Auth Guard** | `app.js` boot sequence | Redirects unauthenticated users to `login.html` |

---

### 2. User Profile System (`window.DB.Profiles`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Get Profile** | `DB.Profiles.get(userId)` | Fetch user's profile row |
| **Get or Create** | `DB.Profiles.getOrCreate(user)` | Upsert profile after Google OAuth (trigger fallback) |
| **Update Profile** | `DB.Profiles.update(userId, fields)` | Update username, avatar, any field |
| **Add Legacy Points** | `DB.Profiles.addLegacyPoints(userId, pts)` | Client-side lore point increment (uses `increment_legacy_score` RPC) |
| **Auto-create Trigger** | DB trigger `handle_new_user` | PostgreSQL trigger auto-creates profile on `auth.users` INSERT |

---

### 3. Fog of War / Map System (`js/map.js` → `window.MapModule`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Map Init** | `MapModule.init()` | Initialises Leaflet.js with CartoDB Dark tiles, re-reads `user_districts` to re-punch fog holes on reload |
| **Fog Layer** | Inverted polygon via `L.polygon` | Dark overlay (`rgba(20,20,25,0.75)`) with district-shaped holes punched per cleared zone |
| **Fog Persistence** | `DB.Districts.getUserState(userId)` | Re-reads cleared districts before render; cleared holes survive page reload |
| **Watchtower Markers** | Custom Leaflet icons | 7+ Bangkok districts seeded; gray pin (unchecked) → orange glow (checked-in) |
| **Watchtower Check-In** | `DB.Districts.checkIn(userId, districtId)` | Validates 500m Haversine distance from watchtower; bypassed on `localhost`; upserts `user_districts` row with `fogged = false` |
| **GPS Live Dot** | `navigator.geolocation.watchPosition` | Real-time user position dot + accuracy ring on map |
| **GPS Proximity Gate** | 500m Haversine check | Distance check before allowing check-in; `toast` shown if too far |
| **Node Info Card** | Tappable bottom sheet | Café / OTOP / Landmark details revealed after fog clears |
| **Support Node Visit** | `DB.Districts.updateNodeVisit(userId, districtId, nodeType, nodeId)` | Tapping "Visit" in node card increments `cafes/otops/landmarks_visited` via `increment_node_visit` RPC; dedupes per `user_support_node_visits` row |
| **Encounter Gate Check** | Progress bars vs. counter | Shows lock progress bars while Support Nodes are incomplete; shows Encounter button when all met |
| **Map Discovery %** | `DB.Districts.getDiscoveryPercent(userId)` | (cleared districts / total active) × 100 from DB; displayed in map stats pill |
| **Fog Grid Helper** | `window.FogGrid` (`js/fog-grid.js`) | Reusable Thailand grid cell generator for future national fog coverage |
| **BTS/MRT Bonus** | Station-radius seed check | Checks if user GPS is near seeded rail station; applies ×2 point multiplier on check-in |

---

### 4. Lore / Proximity System (`js/map.js` + `js/supabase-client.js` → `window.DB.Lore`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Proximity Check** | `haversineDistance()` + `checkLoreProximity()` | Runs on every GPS update; compares user position vs. each `lore_node.radius_m` |
| **Lore Unlock Sheet** | Bottom sheet UI | Displays Thai narrative, optional image (lazy-loaded), optional audio (play/pause), Save button, and point badge |
| **Lore Persist** | `DB.Lore.unlock(userId, loreId)` | Upserts to `user_lore` table; ignores duplicate (idempotent) |
| **Lore Points** | `DB.Profiles.addLegacyPoints(userId, pts)` | Client-side write after `user_lore` insert; amount defined by `lore_nodes.lore_pts` |
| **Lore Chain** | `chain_id` + `chain_part` grouping | 3 nodes share a `chain_id`; completing all 3 → consolidated story sheet + 50 bonus points |
| **Visited Lore Icons** | Tappable Leaflet markers | Saved/unlocked lore places render on map; tapping reopens lore sheet in read-only state without awarding points again |
| **Get All Lore** | `DB.Lore.getAll()` | Fetches all active lore nodes with district info |
| **Get Unlocked** | `DB.Lore.getUserUnlocked(userId)` | Fetches user's unlocked lore entries ordered by unlock date |

---

### 5. Quiz & Capture System (`js/map.js` + `js/supabase-client.js` → `window.DB.Quiz`, `window.DB.Figures`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Get Quiz** | `DB.Quiz.getForFigure(figureId, count)` | Fetches questions from `quiz_questions` table; count=1 for C-Class, count=3 for S/A |
| **C-Class Quiz** | 1-question MCQ modal | Triggered when C-Class figure node is reached; 4 answer options; correct → capture |
| **Master Quiz (Legendary)** | 3-question card flow, all correct required | Opens after Support Node gate is met; timer bar per question; incorrect = fail state |
| **Capture Write** | `DB.Figures.capture(userId, figureId, quizScore)` | Inserts into `user_captures`; **DB trigger** `on_capture_update_score` auto-updates `profiles.legacy_score` |
| **Get All Figures** | `DB.Figures.getAll()` | Fetches all active figures |
| **Get User Captures** | `DB.Figures.getUserCaptures(userId)` | Fetches user's captured figure IDs and quiz scores |
| **Capture Refresh** | `CollectionModule.markCaptured(figureId)` | Updates captured state in grid and re-renders affected card without full reload |

---

### 6. Collection System (`js/collection.js` → `window.CollectionModule`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Figure Grid** | `collection.js` render | 2-column Bootstrap grid of Historical Figures with class-colored borders |
| **Filter Pills** | All / S / A / C / Artifacts / Journal | Filter the grid by class or content type |
| **Search Bar** | Keyword filter | Real-time search over figure names (Thai + English) |
| **Figure Detail Modal** | Bootstrap modal (reused instance) | Portrait, name, class badge, historical snippet; stale backdrop cleanup on close |
| **Artifact Grid** | Horizontal scroll row | Artifact icon + name + rarity dot |
| **Lore Journal** | Journal filter pill | Lists all user-unlocked lore entries; chains show progress (e.g. 2/3 parts); expanding entry shows full narrative |
| **Stats Summary Row** | 3-column card | Figures captured count · Artifacts obtained · Legacy Score total |
| **Get Artifacts** | `DB.Artifacts.getAll()` / `DB.Artifacts.getUserArtifacts(userId)` | Fetches artifact catalog and user's obtained set |
| **Obtain Artifact** | `DB.Artifacts.obtain(userId, artifactId)` | Insert into `user_artifacts`; ignores duplicate (error code 23505) |

---

### 7. Mission System (`js/missions.js` → `window.MissionsModule`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Active Mission Banner** | Full-width card with orange gradient | Shows current quest (e.g. "Unlock Taksin the Great") with progress bar |
| **Quest Step Checklist** | Checkbox rows | Shows sub-steps with green check / orange progress |
| **Daily Challenges** | Challenge card list | Each row: colored icon + task name + location hint + points reward |
| **BKK Transport Banner** | Conditional green card | Shown only when user is in Bangkok; "Using BTS/MRT? ×2 Points Active!" |
| **Completed Missions** | Collapsible section | Muted cards with strikethrough; collapses after completion |

> **Note:** Mission state is currently UI-displayed with mock data; full persistence is Phase 1 Polish.

---

### 8. Leaderboard System (`js/leaderboard.js` → `window.LeaderboardModule`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Get Leaderboard** | `DB.Leaderboard.get(metric, limit)` | Queries `leaderboard_legacy` view; orders by `legacy_score`, `map_discovery`, or `archive_count` |
| **Podium Render** | Top-3 visual | Rank 2 left · Rank 1 center (gold crown) · Rank 3 right; avatar + username + score |
| **Rank List** | Items 4+ | Row: rank number · avatar · username · score · province tag pill |
| **Your Rank Card** | Highlighted row | Orange border-left accent; shows current user's rank and score |
| **Metric Toggle** | Map Discovery / Archive / Legacy Score tabs | Orange underline on active; re-queries DB on switch |
| **Period Toggle** | Weekly / Monthly / All-Time pills | Controls time-range filter on query |
| **Realtime Update** | `DB.Leaderboard.subscribe(callback)` | Supabase Realtime subscription on `profiles` table `UPDATE` events; patches/re-sorts rows live |

---

### 9. Notification System (`js/app.js` + `js/supabase-client.js` → `window.DB.Notifications`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Get Notifications** | `DB.Notifications.get(userId)` | Fetches last 20 notifications ordered by `created_at` |
| **Push Notification** | `DB.Notifications.push(userId, type, title, message)` | Server-side insert into `notifications` table |
| **Mark Read** | `DB.Notifications.markRead(notifId)` | Updates `is_read = true` |
| **Realtime Subscribe** | `DB.Notifications.subscribe(userId, callback)` | Supabase Realtime channel on `notifications` INSERT; updates badge dot count and offcanvas list live |
| **Notification Panel** | Bootstrap Offcanvas | Slides from top-right bell; 4 types: new figure unlocked / fog cleared / leaderboard rank changed / artifact obtained |

---

### 10. App Shell & Navigation (`js/app.js` → `window.AppCore`)

| Function | Sub-Functions | Description |
|---|---|---|
| **Boot Sequence** | `AppCore.init()` | Auth guard check → profile load → module init |
| **Tab Navigation** | Bottom nav `.nav-item[data-page]` | 4 tabs: Map · Collection · Mission · Leaderboard; CSS slide animation on switch |
| **Toast Notification** | `AppCore.showToast(message)` | Non-blocking toast for check-in distance errors or system messages |
| **Lore Sheet Open** | `AppCore.openLoreSheet(node)` | Opens lore unlock bottom sheet for a given lore node |
| **Lore Chain Sheet** | `AppCore.openLoreChainSheet(chain)` | Opens consolidated story sheet after all 3 chain parts are unlocked |
| **Bottom Sheets** | `.bottom-sheet` + `.bottom-sheet-overlay` pattern | Unified pattern for check-in sheet, node info card, lore sheets |
| **Page Flow Guard** | Auth state listener | Redirects to `login.html` on session expiry |

---

### 11. Onboarding System (`onboarding.html`)

| Function | Description |
|---|---|
| **Location Permission** | Requests `navigator.geolocation` permission; explains why GPS is needed |
| **Home District Picker** | Lets user select their home province/district from a seeded list |
| **Profile Init** | Writes home district to `profiles` on first run |

---

### 12. Database / Backend Functions (Supabase PostgreSQL)

| DB Object | Type | Description |
|---|---|---|
| `handle_new_user()` | Trigger Function | Auto-creates `profiles` row on `auth.users` INSERT |
| `on_capture_update_score` | Trigger | Increments `profiles.legacy_score` + `archive_count` on `user_captures` INSERT |
| `increment_legacy_score(p_user_id, p_amount)` | RPC | Atomic add to `profiles.legacy_score`; used for lore points |
| `increment_node_visit(p_user_id, p_district_id, p_node_type, p_node_id)` | RPC | Inserts into `user_support_node_visits`; idempotently increments `user_districts` counter; prevents double-counting across devices/reloads |
| `leaderboard_legacy` | View | Joins `profiles` with district stats for leaderboard queries |
| RLS Policies | Per-table | Each user can only read/write their own rows in `user_districts`, `user_captures`, `user_lore`, `user_artifacts`, `user_support_node_visits`, `notifications` |

---

### 13. Security & Utilities

| Function | File | Description |
|---|---|---|
| `escapeHtml(str)` | `js/utils.js` | XSS-safe HTML escaping; must be used for every user-visible string in `innerHTML` |
| `window.APP_CONFIG` | `js/config.js` | Reads `window.ENV` → exports `supabaseUrl` + `supabaseAnonKey`; used by `supabase-client.js` |
| Vercel build inject | `build.js` | Node.js script; runs at Vercel deploy time; injects `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars into `js/env.js` |
| Security headers | `vercel.json` | CSP, X-Frame-Options, Permissions-Policy, HSTS applied at edge |
| `js/env.js` | Public config | Tracked file containing only public Supabase anon key + URL — never service-role keys |

---

## Tech Stack by Function Sector

| Sector | Function | Technology |
|---|---|---|
| **Frontend Shell** | Pages, routing, UI components | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 IIFE modules) |
| **Typography** | Thai headings + body text | Google Fonts: Kanit (Thai) + Inter (Latin) |
| **Map Engine** | Interactive map tiles, fog layer, markers, GPS dot | Leaflet.js 1.9.4 + CartoDB Dark Matter tiles |
| **Fog of War** | Inverted polygon rendering, district holes | Leaflet.js `L.polygon` with clip holes |
| **GPS / Geolocation** | Live tracking, proximity checks, haversine | Browser `navigator.geolocation.watchPosition` + custom `haversineDistance()` |
| **Authentication** | Email/password + Google OAuth | Supabase Auth (GoTrue) |
| **Database** | User state, districts, figures, lore, leaderboard | Supabase PostgreSQL 15 with RLS |
| **Realtime** | Live leaderboard updates, notification inserts | Supabase Realtime (WebSocket Postgres Changes) |
| **RPC / Stored Procedures** | Atomic point increments, idempotent node visits | Supabase PostgreSQL Functions (SECURITY DEFINER) |
| **Design Tokens** | Colors, spacing, radii | CSS Custom Properties in `css/variables.css` |
| **Animation** | Fog clear, blob morph, GPS pulse | CSS Keyframes in `css/animations.css` |
| **Build / Deploy** | Static site + env injection | Vercel (Node.js `build.js` pre-deploy step) |
| **Security** | XSS prevention, CSP, headers | `utils.escapeHtml()` + `vercel.json` security headers |
| **Testing** | Static regression checks | Node.js `tests/run-static.mjs` (7 test files) |

---

## Project Structure

```
Website - NSC prototype 06/
│
├── index.html               Splash / landing — animated blob, CTA to login
├── login.html               Email + password + Google OAuth; register flow
├── onboarding.html          First-run: location permission + home district picker
├── app.html                 Main app shell — Map · Collection · Mission · Leaderboard
│
├── build.js                 Vercel build — injects SUPABASE_URL + SUPABASE_ANON_KEY
├── vercel.json              Deployment config + security headers (CSP, X-Frame, HSTS)
│
├── css/
│   ├── variables.css        Design tokens (colors, spacing, radii, transitions)
│   ├── layout.css           Fixed top bar (56px), fixed footer nav (60px), max-width 430px
│   ├── components.css       Buttons, cards, inputs, bottom sheets, badges
│   ├── map.css              Leaflet overrides, fog layer, markers, GPS dot, node info card
│   └── animations.css       Keyframes: blobMorph, floatY, locationPulse, fog-clear, etc.
│
├── js/
│   ├── env.js               Public Supabase anon config (tracked, dev-safe values only)
│   ├── env.example.js       Credential template for resetting env.js
│   ├── config.js            Reads window.ENV → window.APP_CONFIG
│   ├── utils.js             escapeHtml() — XSS protection
│   ├── supabase-client.js   All DB & Auth calls — exposes window.DB
│   ├── app.js               Boot · auth guard · tab nav · toast · lore sheets
│   ├── map.js               Leaflet map · Fog of War · GPS · watchtowers · Lore proximity
│   ├── fog-grid.js          window.FogGrid — Thailand grid cell helper
│   ├── collection.js        Figures + artifacts grid · Lore Journal · filter/search
│   ├── missions.js          Active quest list + daily challenges
│   └── leaderboard.js       Podium + ranked list + metric toggles + Realtime
│
├── supabase/
│   ├── schema.sql               Full DB schema + Bangkok district + figure seed data
│   ├── patch_auth_fix.sql       Auth trigger fix + RLS INSERT policy
│   ├── patch_lore.sql           lore_nodes, user_lore, user_support_node_visits,
│   │                            quiz_questions tables + on_capture_update_score trigger
│   └── patch_district_seed.sql  MVP district seed parity with map.js watchtower array
│
├── tests/
│   ├── lore-static.test.mjs             Lore integration points
│   ├── remaining-static.test.mjs        Support node, quiz, discovery, bonus, Realtime
│   ├── prod-readiness-static.test.mjs   Production readiness docs/config
│   ├── district-seed-static.test.mjs    SQL seed parity with map.js districts
│   ├── env-policy-static.test.mjs       Public anon env policy check
│   ├── grid-fog-static.test.mjs         window.FogGrid helper
│   └── run-static.mjs                   One-command test suite runner
│
├── docs/
│   ├── CODING_INSTRUCTIONS.md   Design system spec, component patterns, layout rules
│   ├── dev-plan.md              Phase 1 development plan and task checklist
│   ├── progress.md              Implementation status (all features tracked)
│   ├── production-smoke.md      Supabase + Vercel smoke-test checklist
│   └── proposal/
│       └── tam_roi_nsc_proposal.md  NSC 2026 formal project proposal (Thai)
│
├── document/                NSC BOOK (.docx + .pdf), UI screenshots, flowcharts
├── AGENTS.md                Agent workflow instructions (RTK required)
├── CLAUDE.md                Claude Code project guide
└── README.md
```

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `profiles` | User profile: username, avatar, legacy_score, map_discovery, archive_count |
| `districts` | District metadata: coordinates, watchtower GPS, polygon, support node requirements |
| `figures` | Historical figures: class (S/A/C), legacy points, district, description |
| `artifacts` | Artifact catalog: name, rarity, description |
| `user_districts` | Per-user fog state + support node visit counters per district |
| `user_captures` | Which figures each user has captured + quiz score |
| `user_artifacts` | Which artifacts each user has obtained |
| `user_support_node_visits` | Exact support node IDs visited — prevents double-counting across devices |
| `lore_nodes` | GPS lore points with radius, narrative, chain_id, chain_part, lore_pts |
| `user_lore` | User's unlocked lore entries |
| `quiz_questions` | MCQ questions per figure (4 options, correct_answer index) |
| `notifications` | In-app notification feed per user |
| `leaderboard_legacy` | View joining profiles + district stats for leaderboard |

---

## Commands

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Ray0737/NSC_2026.git
cd NSC_2026

# 2. No npm install or build step needed for local dev
# Edit js/env.js with your Supabase project URL and anon key

# 3. Serve with VS Code Live Server (right-click index.html → Open with Live Server)
# Default port: http://127.0.0.1:5500
```

### Run Static Tests

```bash
node tests/run-static.mjs
```

### Vercel Deployment (Production Build)

```bash
# Vercel runs this automatically at deploy time:
node build.js
# Injects SUPABASE_URL and SUPABASE_ANON_KEY from Vercel env vars into js/env.js
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

> `js/env.js` stores only the public Supabase anon key and project URL. Never put service-role keys, private tokens, or production credentials in client-side files.

---

## Vercel Deployment

1. Import the repo at [vercel.com](https://vercel.com)
2. Root Directory: leave as `.` (repo root)
3. **Settings → Environment Variables** → add:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGci...`
4. Deploy — `build.js` generates `js/env.js` from env vars at build time

---

## Development Roadmap

> Aligned with NSC 2026 proposal (ตามรอย_NSC_2026_Primary1.pdf)

---

### Phase 1 — Web MVP · *"The Digital Lab Foundation"* ← **Current Phase**

**Goal:** Launch a mobile-responsive web app to validate the Watchtower and Fog logic before committing to native mobile.

**Status: Complete**

| Feature | Status |
|---|---|
| Auth flow (email + Google OAuth) | ✅ Done |
| Onboarding (location permission + home district) | ✅ Done |
| Fog of War map with persistence across reloads | ✅ Done |
| Live GPS tracking dot + accuracy ring | ✅ Done |
| 500m Haversine GPS gate on Watchtower check-in | ✅ Done |
| Support Node visit tracking (idempotent, cross-device) | ✅ Done |
| Support Node completion gate (progress bars → Encounter button) | ✅ Done |
| C-Class quiz modal (1-question, DB-backed) | ✅ Done |
| Legendary Master Quiz (3-question, all correct required) | ✅ Done |
| Legacy score DB trigger on capture | ✅ Done |
| GPS Lore proximity unlock system | ✅ Done |
| Lore Journal in Collection with chain grouping | ✅ Done |
| Visited Lore map icons (tappable, read-only) | ✅ Done |
| Collection grid with filter, search, figure modal | ✅ Done |
| Mission quest list and daily challenges | ✅ Done |
| DB-backed leaderboard with Realtime subscription | ✅ Done |
| BTS/MRT ×2 transport bonus | ✅ Done |
| Realtime in-app notifications | ✅ Done |
| Vercel deployment + env injection + security headers | ✅ Done |
| Static regression test suite (7 test files) | ✅ Done |
| **Full Thailand district coverage** (beyond Bangkok MVP) | ⏳ Remaining |

**Tech Stack (Phase 1):**
`HTML5` · `Bootstrap 5.3` · `Vanilla JS` · `Leaflet.js` · `CartoDB Dark tiles` · `Supabase (PostgreSQL + Auth + RLS + Realtime)` · `Vercel`

---

### Phase 2 — Mobile App · *"The Immersive Leap"*

**Goal:** Migrate from browser to a dedicated iOS/Android app to unlock hardware features.

**Key Features:**
- Native AR figure-capture sequences using device camera
- Background GPS tracking — push alerts when proximity lore enters range without opening the app
- QR code scanning at OTOP shops, cafés, and outposts to trigger encounters
- Improved offline map caching for rural areas with poor connectivity

**Tech Stack (Phase 2):**
`React Native` · `ARKit (iOS)` · `ARCore (Android)` · `Expo` · `Supabase (carry-over schema)` · `FCM / APNs (push notifications)`

**Migration Priorities:**
1. Port all JS modules to React Native components
2. Implement AR capture scene (replace quiz with immersive AR capture)
3. Background location service + local push notifications
4. QR scanner integration at outpost nodes

---

### Phase 3 — Co-Op & Community · *"The Social Layer"*

**Goal:** Transform solo exploration into a social experience requiring collaboration for the hardest content.

**Key Features:**
- **Raid Encounters** — S-Class figures require 3+ players to simultaneously solve linked riddles at different physical locations
- **District Leaderboards** — per-province rankings in addition to the national High Chronicler board
- **Artifact Trading** — player-to-player artifact exchange with rarity tiers
- **Clan / Party System** — form exploration groups for coordinated Fog clearing

**Tech Stack (Phase 3):**
`Supabase Realtime (WebSocket channels)` · `Socket.io (fallback for party communication)` · `FCM / APNs (raid invitation push notifications)`

---

### Phase 4 — Seasonal Content · *"The Live Service Era"*

**Goal:** Keep the map alive with rotating story seasons and era-shifting content.

**Key Features:**
- **Main Quest Seasons** — rotating multi-month story arcs: *Ayutthaya Rising → The Silk Road → Modern Revolution*
- **Era Filter Toggle** — map overlay switch to shift historical periods (Sukhothai / Ayutthaya / Rattanakosin / Modern)
- **Limited-Time Figures** — seasonal S-Class characters available only during specific calendar windows
- **Expandable Geography** — framework to extend beyond Thailand to Southeast Asia and global history

**Content Pipeline:**
- Historian consultant integration for accuracy review
- CMS layer for district/figure content management without code deploys
- A/B testing seasonal quest structures for engagement

---

### Phase 5 — Business & Media Ecosystem

**Goal:** Monetize and scale through partnerships while preserving the educational core.

| Partner Type | Mechanism | In-Game Benefit |
|---|---|---|
| **Film Studios** | Thai period drama tie-in characters | Limited-edition S-Class figures with licensed storylines |
| **Certified Brand Outposts** | Cafés/landmarks pay to become Premium Nodes | Real-world discounts + in-game Stamina for players |
| **Tourism Authority of Thailand (TAT)** | Government-sponsored rural discovery events | "Bounty" missions for under-visited provinces |
| **Green Logistics** | BTS/MRT/boats/trains grant massive XP multipliers | Incentivize sustainable transport |

**Revenue Model:**
- B2B: Outpost certification fees from businesses
- B2G: TAT and provincial tourism board sponsorship
- B2C: Cosmetic season pass (no pay-to-win, educational integrity preserved)

---

## Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#2B2D35` | Dark Charcoal — page background, dark cards |
| `--color-primary` | `#FF7E55` | Vibrant Orange — CTA buttons, active tab, S-Class highlights |
| `--color-success` | `#7BC67E` | Sage Green — captured markers, progress bars, success states |
| `--color-surface` | `#E1F0E3` | Pale Mint — secondary cards, cleared fog zones |
| `--color-white` | `#FFFFFF` | Primary text on dark, main card bodies |
| `--color-card-dark` | `#33363F` | Elevated dark cards |
| `--color-muted` | `#9DA3AE` | Secondary text, disabled states |

### Typography

- **Body:** `Inter` (400 / 500 / 600 / 700)
- **Thai Headings:** `Kanit` (400 / 600 / 700)
- **Base size:** 14px

### Layout

- Max content width: **430px**, centered (`margin: 0 auto`)
- Fixed top bar: **56px**
- Fixed footer nav: **60px**
- Content padding: `padding-top: 56px; padding-bottom: 60px`

---

## Team — ปลามึกยักษ์

| ชื่อ | อีเมล |
|---|---|
| รพี รัตนมนูญพร | raphee.rattanamanoonporn@gmail.com |
| รชยา เชวงกิจวณิช | charlotte.kamoshita00@gmail.com |
| ปภาวิชญ์ แซ่หลิ่ว | papawit@proton.me |

GitHub: [Ray0737/NSC_2026](https://github.com/Ray0737/NSC_2026)
