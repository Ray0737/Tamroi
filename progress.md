# Tamroi (ตามรอย) — Development Progress

> NSC 2026 · Team ปลามึกยักษ์ · Last updated: 2026-05-19

---

## Phase 1 — Web MVP · "The Digital Lab Foundation" ← Current Phase

### Scope Summary
Build a mobile-responsive web app that validates the core Watchtower + Fog of War loop with GPS check-ins, sepia→colour map transitions, C-Class figure quizzes, and a leaderboard — before committing to a native mobile build.

---

## Implementation Status

### Pages & UI Shell

| File | Status | Notes |
|---|---|---|
| `index.html` | ✅ Done | Splash / landing page, animated blob, CTA to login |
| `login.html` | ✅ Done | Email + password + Google OAuth, register flow |
| `onboarding.html` | ✅ Done | Location permission request + home district picker |
| `app.html` | ✅ Done | 4-tab shell — Map · Collection · Missions · Leaderboard |

### CSS (Design System)

| File | Status | Notes |
|---|---|---|
| `css/variables.css` | ✅ Done | Full design token set (colors, spacing, radii, transitions) |
| `css/layout.css` | ✅ Done | Fixed top bar (56px), fixed footer nav (60px), max-width 430px |
| `css/components.css` | ✅ Done | Buttons, cards, inputs, bottom sheets, notification badges |
| `css/map.css` | ✅ Done | Leaflet overrides, fog layer, markers, GPS dot, node info card |
| `css/animations.css` | ✅ Done | blobMorph, floatY, locationPulse, and more keyframes |

### JavaScript Modules

| File | Status | Notes |
|---|---|---|
| `js/config.js` | ✅ Done | Reads `window.ENV` → exports `window.APP_CONFIG` |
| `js/env.js` | ✅ Done | Tracked public Supabase anon config for local/static runtime |
| `js/env.example.js` | ✅ Done | Credential template for resetting `env.js` |
| `js/utils.js` | ✅ Done | `escapeHtml()` XSS utility |
| `js/supabase-client.js` | ✅ Done | Full DB & Auth abstraction — Auth, Profiles, Districts, Figures, Leaderboard, Lore, Quiz |
| `js/app.js` | ✅ Done | Boot sequence, auth guard, tab navigation, bottom sheets, toast notifications |
| `js/map.js` | ✅ Done | Leaflet map, Fog of War persistence, live GPS dot, watchtower markers, node card, Lore proximity unlocks |
| `js/collection.js` | ✅ Done | Historical figures + artifacts grid, collection status display, Lore Journal |
| `js/missions.js` | ✅ Done | Active quest list + daily challenge display |
| `js/leaderboard.js` | ✅ Done | Podium + ranked player list with Legacy Score |

### Database (Supabase)

| File | Status | Notes |
|---|---|---|
| `supabase/schema.sql` | ✅ Done | Full schema + Bangkok district seed data |
| `supabase/patch_auth_fix.sql` | ✅ Done | Auth trigger fix + RLS INSERT policy |
| `supabase/patch_lore.sql` | ✅ Done | Lore tables, quiz questions, legacy score trigger, seed lore/quiz content |

### Deployment

| File | Status | Notes |
|---|---|---|
| `build.js` | ✅ Done | Vercel build script — injects `SUPABASE_URL` & `SUPABASE_ANON_KEY` at deploy time |
| `vercel.json` | ✅ Done | Security headers (CSP, X-Frame, Permissions-Policy, HSTS), Supabase + Google OAuth allowed |

### Documentation

| File | Status | Notes |
|---|---|---|
| `README.md` | ✅ Done | Full project overview, roadmap, local dev + Supabase + Vercel setup |
| `CODING_INSTRUCTIONS.md` | ✅ Done | Design system spec, component patterns, layout rules |
| `tam_roi_nsc_proposal.md` | ✅ Done | Detailed game mechanics proposal |
| `document/` | ✅ Done | NSC BOOK (.docx + .pdf), 12 UI screenshots, flowcharts, proposal versions (v0–v7) |

---

## What's Working (Phase 1 Core Loop)

- **Auth flow** — email/password + Google OAuth via Supabase, auth guard on app pages
- **Onboarding** — location permission request, home district selection
- **Fog of War** — inverted Leaflet polygon clears per district on Watchtower check-in
- **Fog persistence** — `user_districts` is re-read before map render and cleared holes survive reload
- **Live GPS tracking** — real-time user dot + accuracy ring on map
- **GPS check-in tolerance** — 500m Haversine gate on Watchtower check-in, bypassed on localhost
- **Watchtower markers** — 5 Bangkok districts (Rattanakosin, Dusit, Pathumwan, Silom, Sukhumvit, Watthana + more)
- **Node info card** — tappable bottom sheet showing outpost/landmark details
- **Support Node tracking** — node Visit button increments district support counters with DB RPC + local fallback
- **Support Node gate** — Watchtower sheet shows progress bars or the Encounter button when requirements are met
- **Lore proximity system** — GPS range checks unlock lore sheets, persist to `user_lore`, and award lore points
- **Lore Journal** — Collection → Journal lists unlocked lore, expands entries, and groups 3-part chains
- **Lore chains** — completing all 3 chain parts shows consolidated story and awards +50 points
- **Collection grid** — historical figures + artifacts display
- **Daily missions** — quest list and challenge tracker
- **Leaderboard** — podium + ranked list with Legacy Score metrics and profile Realtime subscription
- **Design system** — consistent dark charcoal + orange + sage green palette, mobile-first 430px
- **Quiz infrastructure and capture flow** — `quiz_questions` table, C-Class quiz, Master Quiz, and capture writes are wired
- **Legacy score trigger** — `on_capture_update_score` DB trigger awards figure capture points
- **BTS/MRT transport bonus** — station-radius helper applies x2 points where GPS is near seeded rail stations
- **Realtime notifications** — notification inserts subscribe through Supabase Realtime and update the offcanvas/badge

## Known Gaps / Next Steps Within Phase 1

### Core Loop Fixes
- [x] **T01** — Fog clearing persistence — re-read `user_districts` on map load and render cleared holes
- [x] **T02** — Support Node visit tracking — Visit button in node card increments `cafes/otops/landmarks_visited` in DB
- [x] **T03** — Support Node completion gate — check counters after check-in, show progress bars or Encounter button
- [x] **T04** — C-Class quiz modal — fetch from `quiz_questions` table, 4-option MCQ, capture on correct answer
- [x] **T05** — Legendary encounter + Master Quiz (3 questions, all correct) after Support Node gate
- [x] **T06** — `DB.Profiles.addLegacyPoints()` — client-side write for lore pts only (captures handled by DB trigger)
- [x] **T07** — Real map discovery % from DB instead of mock value
- [x] **T08** — Collection grid refresh after capture (re-render card, no full reload)
- [x] **T09** — Leaderboard refresh after score update via Realtime profile updates
- [x] **T10** — BTS/MRT ×2 bonus — seeded station-radius check applies point multiplier

### Lore System
- [x] **T11** — `haversineDistance()` helper + `LORE_NODES` array + `checkLoreProximity()` in GPS callback
- [x] **T12** — Lore unlock bottom sheet UI (title, narrative, image/audio optional, Save button)
- [x] **T13** — `user_lore` table (patch_lore.sql) + `DB.Lore.unlock()` + Journal tab in Collection
- [x] **T14** — Lore Points client-side write after `user_lore` insert
- [x] **T15** — Rich lore content types: image (lazy img), audio (custom play/pause)
- [x] **T24** — Multi-site Lore chain: 3-node, consolidated story sheet, +50 chain bonus, journal grouping

### Missing Infrastructure (from NSC doc)
- [x] **T20** — GPS tolerance radius 500m on check-in, bypass on localhost
- [x] **T21** — Supabase DB trigger `on_capture_update_score` on `user_captures` → `patch_lore.sql`
- [x] **T22** — Supabase Realtime subscription on `profiles` table for live leaderboard
- [x] **T25** — `quiz_questions` table + seed 2 questions per mock figure + `DB.Quiz.getForFigure()`

### Infrastructure / Polish
- [ ] **T16** — Full Thailand district coverage (load polygons from DB, not hardcode)
- [ ] **T17** — Re-enable email confirmation for production
- [ ] **T18** — Vercel production smoke test with real env vars
- [x] **T19** — Real-time notifications via Supabase Realtime on `notifications` table

### New Files Added
| File | Purpose |
|---|---|
| `supabase/patch_lore.sql` | `lore_nodes`, `user_lore`, `quiz_questions` tables + legacy score trigger |
| `tests/lore-static.test.mjs` | Static regression check for Lore integration points |
| `tests/remaining-static.test.mjs` | Static regression check for support node, quiz, discovery, bonus, and Realtime work |

---

## Phase 2+ Development Roadmap

> Derived from [README.md](README.md) · Phases 2–5

---

### Phase 2 — Mobile App · "The Immersive Leap"

**Goal:** Migrate from browser to a dedicated iOS/Android application to unlock hardware features unavailable in the web MVP.

**Key Features:**
- Native AR figure-capture sequences using the device camera
- Background GPS tracking — push notifications when proximity lore enters range without opening the app
- QR code scanning at OTOP shops, cafés, and outposts to trigger encounters
- Improved offline map caching for rural areas with poor connectivity

**Tech Stack:**
- React Native (cross-platform iOS + Android)
- ARKit (iOS) / ARCore (Android) for Augmented Reality
- Expo or bare React Native depending on AR integration requirements
- Retain Supabase as backend (existing schema carries forward)

**Migration Priorities:**
1. Port all JS modules to React Native components
2. Implement AR capture scene (replace simple quiz with immersive capture)
3. Background location service + local push notifications
4. QR scanner integration at outpost nodes

---

### Phase 3 — Co-Op & Community · "The Social Layer"

**Goal:** Transform solo exploration into a social experience requiring collaboration for the hardest content.

**Key Features:**
- **Raid Encounters** — Legendary (S-Class) figures require 3+ players to simultaneously solve linked riddles at different locations
- **District Leaderboards** — per-province rankings in addition to the national High Chronicler board
- **Artifact Trading** — player-to-player artifact exchange system with rarity tiers
- **Clan/Party System** — form exploration groups for coordinated Fog clearing

**Tech Stack:**
- Supabase Realtime (WebSocket channels for live raid coordination)
- Socket.io as fallback or alternative for lower-latency party communication
- Push notifications via FCM/APNs for raid invitations and trade requests

---

### Phase 4 — Seasonal Content · "The Live Service Era"

**Goal:** Keep the map alive with rotating story seasons and era-shifting content.

**Key Features:**
- **Main Quest Seasons** — rotating multi-month story arcs: *Ayutthaya Rising → The Silk Road → Modern Revolution*
- **Era Filter Toggle** — map overlay switch to shift historical periods (Sukhothai / Ayutthaya / Rattanakosin / Modern)
- **Limited-Time Figures** — seasonal S-Class characters available only during specific calendar windows
- **Expandable Geography** — framework to extend beyond Thailand to Southeast Asia and global history themes

**Content Pipeline:**
- Historian consultant integration for accuracy review
- CMS layer for district/figure content management without code deploys
- A/B testing seasonal quest structures for engagement

---

### Phase 5 — Business & Media Ecosystem

**Goal:** Monetize and scale through partnerships while preserving the educational core.

**Key Features:**

| Partner Type | Mechanism | Benefit |
|---|---|---|
| **Film Studios** | Thai period drama tie-in characters | Limited-edition S-Class figures, licensed storylines |
| **Certified Brand Outposts** | Cafés/landmarks pay to become Premium Nodes | Real-world discounts for players + in-game Stamina reward |
| **Tourism Authority of Thailand (TAT)** | Government-sponsored rural discovery events | "Bounty" missions for under-visited provinces |
| **Green Logistics** | BTS/MRT/boats/trains grant massive XP multipliers | Incentivize sustainable transport, reduce car dependency |

**Revenue Model:**
- B2B: Outpost certification fees from businesses
- B2G: TAT and provincial tourism board sponsorship
- B2C: Cosmetic season pass (no pay-to-win, educational integrity preserved)
