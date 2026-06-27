# Tamroi (ตามรอย) — Project Context for AI Coding Agent

> **NSC 2026 | Project Code: 28P22C00857**
> Category: Educational Software
> Status: Passed selection round — building real demo

---

## 1. Project Overview

**Tamroi** (ตามรอย, "Trace the Footsteps") is a **web application** for learning Thai history through real-world location exploration, using gamification mechanics. Think Pokémon GO, but every location is tied to a real historical figure or event — not fictional characters.

**Core problem it solves:** Thai high school history scores on the national O-NET exam average only 23–24%, attributed to rote memorization, abstract content with no real-world connection, and lack of intrinsic motivation.

**Core learning loop:** Users physically travel to historical sites → check in via GPS → the map fog clears → they read lore and take quizzes → they "capture" historical figures (like cards) → knowledge is retained through situated, experiential learning.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend / UI | HTML5, CSS3, Vanilla JavaScript ES6+, Bootstrap 5 |
| Map Rendering | Leaflet.js (with OpenStreetMap + CartoDB Positron tiles) |
| Map Data | GeoJSON boundaries for all 77 Thai provinces |
| Geolocation | HTML5 Geolocation API (`watchPosition()`) |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Email/Password + Google OAuth 2.0 |
| Hosting / Deployment | Vercel (auto-deploy from GitHub) |
| Design | Figma |
| Version Control | Git + GitHub |

**No framework** (React, Vue, etc.) — pure Vanilla JS ES6+. Keep this in mind when writing any frontend code.

---

## 3. Application Architecture (3-Layer)

```
┌─────────────────────────────────────────────┐
│  Presentation Layer                         │
│  HTML5 + CSS3 + Bootstrap 5 + Leaflet.js    │
│  (Map rendering, Fog of War, UI components) │
├─────────────────────────────────────────────┤
│  Application Logic Layer                    │
│  Vanilla JS ES6+                            │
│  (Polygon matching, quiz engine, score      │
│   calculation, lore unlock conditions)      │
├─────────────────────────────────────────────┤
│  Data Layer                                 │
│  Supabase (PostgreSQL)                      │
│  (Auth, DB triggers, realtime subscriptions)│
└─────────────────────────────────────────────┘
```

---

## 4. Core Features

### 4.1 Field Exploration System (Map + Check-in)

- On login, the app requests Location permission.
- Leaflet.js loads an **interactive map of Thailand** covered by a **Map Visibility Fog** (dark polygon overlay).
- `watchPosition()` tracks user GPS in real-time with these settings:
  - `maximumAge: 180000` (3 min cache — reduces GPS hardware calls)
  - `enableHighAccuracy: false` (uses cell/Wi-Fi positioning — sufficient for district-level matching, saves battery)
- When user enters a district, **client-side Polygon Matching** against the 77-province GeoJSON boundary data confirms their location.
- The fog layer for that district clears, revealing historical figures and sub-locations.

### 4.2 Historical Figures — Capture Loop

Figures are classified by **Rarity Tier** (based on historical impact):

| Tier | Criteria | Example |
|---|---|---|
| S | National/civilizational impact (founded kingdoms, won major wars) | King Naresuan, Rama V |
| A | Regional/social/cultural impact | Sunthorn Phu, Phraya Phahon |
| B | Significant in specific era or region, historically documented | — |
| C | Local-level, contextual support figures | — |

**Capture flow per tier:**
- **C-Tier:** Capture immediately on area exploration
- **B-Tier:** Must pass a Quiz (multiple choice)
- **S/A-Tier (Phase-Locked):** Must first visit required Support Nodes:
  - 2 local cafes
  - 1 OTOP shop or workshop
  - 3 secondary historical landmarks

### 4.3 Watchtower & Support Nodes

- **Watchtower:** The primary landmark of a district (temple, monument, historical site). Check-in here to unlock ~1 km² of map fog and reveal Phase-Locked figures.
- **Support Nodes:** Secondary locations (local cafes, OTOP shops, minor landmarks) required to unlock S/A-tier figures.

### 4.4 Lore System

- Each figure and location has **deep historical lore content**.
- Lore is **unlocked only after completing all required Checkpoints** in that area.
- Lore uses `lore_nodes` with `radius_m` + Haversine distance check for location validation.
- Supports **Lore Series** (`chain_id` + `chain_part`) — multi-point sequential unlocks.

**Example:** The October 14, 1973 event lore unlocks only after checking in at:
1. Democracy Monument
2. Thammasat University
3. Ratchadamnoen Avenue

### 4.5 Scoring & Leaderboard

- **Legacy Score:** Accumulated by capturing figures. Auto-updated via **Supabase Database Trigger** (no manual update needed).
- **Map Discovery Percentage:** % of district fog cleared.
- **Archive Count:** Number of figures captured.
- Leaderboard updates in **real-time** via Supabase Realtime Subscriptions.
- **Leaderboard Seasons:** Reset every 3 months. Top 3 get permanent Historical Badges.

### 4.6 Seasonal Content & Long-Term Motivation

- On historically significant dates (e.g., October 14), special Lore and Legacy Bonuses activate.
- **Collaborative Missions:** Multiple users must check in at the same location within a time window.

---

## 5. Database Schema (Supabase / PostgreSQL)

### Core Tables

```sql
-- User profile (linked to Supabase Auth UUID)
profiles (
  id UUID,               -- links to auth.users
  username TEXT,
  avatar_url TEXT,
  legacy_score INT,      -- auto-updated via DB trigger
  map_discovery FLOAT,   -- % of map explored
  archive_count INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Districts (77 provinces, subdivided into districts)
districts (
  id UUID,
  name_th TEXT,
  name_en TEXT,
  province TEXT,
  center_lat FLOAT,
  center_lng FLOAT,
  watchtower_lat FLOAT,
  watchtower_lng FLOAT,
  required_cafes INT,
  required_otops INT,
  required_landmarks INT,
  polygon_coords JSONB,  -- GeoJSON polygon for fog-of-war matching
  is_active BOOLEAN
)

-- Historical figures
figures (
  id UUID,
  name_th TEXT,
  name_en TEXT,
  class TEXT,            -- 'S', 'A', 'B', 'C'
  legacy_pts INT,
  district_id UUID,      -- FK → districts
  description TEXT,
  image_emoji TEXT,
  is_active BOOLEAN
)

-- Collectible artifacts
artifacts (
  id UUID,
  name TEXT,
  rarity TEXT,           -- 'common', 'rare', 'legendary'
  district_id UUID,
  icon TEXT,
  description TEXT
)

-- Notifications
notifications (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
```

### Per-User State Tables

```sql
-- Per-user district fog & support node progress
user_districts (
  user_id UUID,
  district_id UUID,
  fogged BOOLEAN,
  cafes_visited INT,
  otops_visited INT,
  landmarks_visited INT,
  checked_in_at TIMESTAMPTZ
)

-- Captures (DB trigger auto-increments legacy_score on insert)
user_captures (
  user_id UUID,
  figure_id UUID,
  captured_at TIMESTAMPTZ,
  quiz_score INT
)

user_artifacts (user_id, artifact_id, obtained_at)
user_lore (user_id, lore_id, unlocked_at)

-- Prevents double-counting support node visits
user_support_node_visits (
  user_id UUID,
  district_id UUID,
  node_id UUID,
  node_type TEXT,        -- 'cafe', 'otop', 'landmark'
  visited_at TIMESTAMPTZ,
  UNIQUE(user_id, node_id)
)
```

### Lore & Quiz Tables

```sql
-- Lore nodes (location-locked content)
lore_nodes (
  id UUID,
  name_th TEXT,
  name_en TEXT,
  lat FLOAT,
  lng FLOAT,
  radius_m INT,          -- Haversine distance check radius
  lore_pts INT,
  content_type TEXT,
  content_th TEXT,
  content_en TEXT,
  media_url TEXT,
  chain_id UUID,         -- for sequential lore series
  chain_part INT,
  district_id UUID,
  is_active BOOLEAN
)

-- Quiz questions
quiz_questions (
  id UUID,
  figure_id UUID,
  district_id UUID,
  question_th TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT,   -- 'a', 'b', 'c', or 'd'
  difficulty TEXT        -- matched to figure class
)
```

---

## 6. Key Technical Logic

### GPS + Polygon Matching (Client-Side)

```javascript
// watchPosition config
navigator.geolocation.watchPosition(callback, errorCb, {
  maximumAge: 180000,      // 3-min cache
  enableHighAccuracy: false,
  timeout: 10000
});

// On position update: point-in-polygon check against GeoJSON
// Match user lat/lng against districts.polygon_coords (JSONB)
// Use Leaflet's L.polygon().getBounds().contains() or
// a point-in-polygon algorithm (ray casting)
```

### Fog of War

- All 77 province polygons start as opaque dark overlay on Leaflet map
- On successful district check-in → remove that district's polygon layer
- User's fogged/unfogged state persists in `user_districts.fogged`

### Lore Unlock Condition

```javascript
// Haversine distance check
function haversineDistance(lat1, lng1, lat2, lng2) { ... }

// Lore unlocks when:
// 1. User is within lore_node.radius_m of lore_node lat/lng
// 2. All chain parts (if chain_id != null) are completed in order
```

### Legacy Score — Auto via DB Trigger

```sql
-- Trigger fires on INSERT into user_captures
-- Adds figure.legacy_pts to profiles.legacy_score automatically
CREATE OR REPLACE FUNCTION update_legacy_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET legacy_score = legacy_score + (
    SELECT legacy_pts FROM figures WHERE id = NEW.figure_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. App Screens (UI Reference)

| Screen | Description |
|---|---|
| Login / Register | Email+password or Google OAuth |
| Onboarding | Location permission + select home district |
| Main Map | Leaflet map with fog overlay, % discovery shown |
| Mission / Outpost | GPS-triggered — shows nearby figures to capture |
| Figure Encounter | Figure card reveal, quiz modal for B/S/A-tier |
| Watchtower | Figure detail, bio, lock/unlocked states |
| Archive / Collections | All captured figures sorted by S/A/B/C rarity |
| Lore Viewer | Deep historical content, unlocked by checkpoint completion |
| Leaderboard | Real-time ranked list (Legacy Score + Map % + Archive count) |
| Notifications | New outpost alerts, ranking changes |
| Settings | Account management, location toggle, privacy |

---

## 8. Constraints & Known Issues

- **GPS accuracy:** Intermittent errors in ~20m radius areas or low-signal zones. Solution: configurable Tolerance Radius, to be tuned via field testing.
- **GPS Spoofing risk:** Users may fake location. Future mitigations: movement speed validation, photo verification before check-in, mock location flag detection via HTML5 Geolocation API.
- **GeoJSON size:** 77-province polygon data is large. Needs data simplification (Douglas-Peucker or similar) to reduce load time on slow connections.
- **No offline support yet.** Future plan: PWA with caching for map tiles + lore content.
- **Content coverage:** Currently only Bangkok and Ayutthaya have full figure/lore data. Other provinces to be added iteratively.
- **Battery usage:** `watchPosition()` is throttled via `maximumAge` and `timeout`. Users advised to carry power bank for >2-3 hour field sessions.

---

## 9. Target Users

- **Primary:** High school students (Grades 10–12), ages 15–23, studying history / social studies
- **Secondary:** University students, teachers (for field trip activities), parents, history enthusiasts, domestic tourists

---

## 10. Future Roadmap

- **PWA:** Installable app + offline support
- **Full 77-province content:** Complete historical figure and lore database
- **Historical Vision AI:** Point camera at monument/statue → GPS-scoped image recognition → auto-display relevant lore
- **Multiplayer / Social:** Guild system, collaborative exploration
- **Multilingual:** English support for foreign tourists
- **Official curriculum integration:** Partner with Thai Ministry of Education (OBEC) and Tourism Authority of Thailand

---

## 11. Scope Note for Demo Build

The demo should prioritize:
1. **Core map + fog of war** (Leaflet + GeoJSON polygon matching)
2. **GPS check-in flow** (location detection → fog clear → figure reveal)
3. **Capture loop** (quiz modal → figure card → legacy score update)
4. **Archive / collection view**
5. **Leaderboard** (real-time via Supabase)
6. **Auth** (Google OAuth + email/password via Supabase)

Content focus: **Bangkok + Ayutthaya** districts for the demo.
