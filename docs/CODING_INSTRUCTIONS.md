# NSC Prototype 06 — Coding Instructions
> Thailand Traveler Discovery App · Bootstrap 5 · Mobile-First

---

## 1. Project Overview

A gamified travel-discovery web app targeting Thai tourists aged 20–30. Players explore Thailand districts, clear "Fog of War," capture historical figures, collect artifacts, and compete on a national leaderboard.

**Primary User:** Tourist / traveler, age 20–30  
**Platform:** Mobile web (375px base, max content width 430px)  
**Tech Stack:** HTML5 + Bootstrap 5.3 + Vanilla JS + Leaflet.js (map)

---

## 2. Color Palette

```css
:root {
  --color-bg:       #2B2D35; /* Dark Charcoal — main backgrounds, dark cards */
  --color-primary:  #FF7E55; /* Vibrant Orange — CTA buttons, S-Class highlights, active tab */
  --color-success:  #7BC67E; /* Sage Green — captured markers, success states, progress */
  --color-surface:  #E1F0E3; /* Pale Mint — secondary cards, fog-of-war cleared zones */
  --color-white:    #FFFFFF; /* Pure White — primary text on dark, main card bodies */
  --color-card-dark:#33363F; /* Slightly lighter than bg — elevated dark cards */
  --color-muted:    #9DA3AE; /* Gray — secondary text, disabled states */
}
```

---

## 3. Typography

```css
/* Use Google Fonts: Inter (body) + Kanit (Thai headings) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Kanit:wght@400;600;700&display=swap');

body        { font-family: 'Inter', sans-serif; font-size: 14px; }
h1, h2, h3  { font-family: 'Kanit', sans-serif; }
.display-score { font-size: 2.5rem; font-weight: 700; }
```

---

## 4. Global Layout Rules

- **Max width:** 430px, centered, `margin: 0 auto`
- **Background:** `var(--color-bg)` full page
- **Top Bar:** fixed, 56px tall
- **Footer Nav:** fixed bottom, 60px tall
- **Content area:** `padding-top: 56px; padding-bottom: 60px;`
- **Border-radius standard:** 16px (cards), 12px (buttons), 50% (icon circles)
- **Shadow standard:** `0 4px 20px rgba(0,0,0,0.25)`
- All cards use `var(--color-card-dark)` background with `var(--color-white)` text

---

## 5. Page Flow

```
[Home / Splash]
      ↓
[Login / Register]
      ↓
[Main App Shell]
  ├── Map (default tab)
  ├── Collection
  ├── Mission
  └── Leaderboard
```

---

## 6. Shared Components

### 6.1 Top Bar
```html
<!-- Fixed top, height 56px, bg: var(--color-bg), border-bottom: 1px solid rgba(255,255,255,0.08) -->
<header class="top-bar">
  <!-- LEFT: Profile avatar circle (32px) + username -->
  <div class="top-bar__left">
    <div class="avatar-sm"><!-- user initials or img --></div>
    <span class="username">Traveler</span>
  </div>

  <!-- CENTER: Page title (shown on non-map pages) -->
  <div class="top-bar__center">
    <span class="page-title"></span>
  </div>

  <!-- RIGHT: Notification bell icon with badge dot -->
  <div class="top-bar__right">
    <button class="icon-btn notif-btn">
      <!-- Bell SVG icon -->
      <span class="notif-badge">3</span> <!-- orange dot badge -->
    </button>
    <!-- Settings gear icon (secondary) -->
    <button class="icon-btn settings-btn"></button>
  </div>
</header>
```

**Styling notes:**
- Avatar circle: 32px, `border: 2px solid var(--color-primary)`
- Notification badge: 8px dot, `background: var(--color-primary)`, absolute top-right of bell
- Icon buttons: 40px tap target, no background, `color: var(--color-white)`

### 6.2 Footer Navigation
```html
<!-- Fixed bottom, height 60px, bg: var(--color-card-dark) -->
<!-- border-top: 1px solid rgba(255,255,255,0.08) -->
<nav class="bottom-nav">
  <button class="nav-item active" data-page="map">
    <svg><!-- Map pin icon --></svg>
    <span>Map</span>
  </button>
  <button class="nav-item" data-page="collection">
    <svg><!-- Archive/book icon --></svg>
    <span>Collection</span>
  </button>
  <button class="nav-item" data-page="mission">
    <svg><!-- Target/flag icon --></svg>
    <span>Mission</span>
  </button>
  <button class="nav-item" data-page="leaderboard">
    <svg><!-- Trophy icon --></svg>
    <span>Rank</span>
  </button>
</nav>
```

**Styling notes:**
- Each `nav-item`: flex-column, center-align, 25% width, `color: var(--color-muted)`
- Active state: `color: var(--color-primary)`, icon filled, small orange underline bar (3px, 20px wide, rounded)
- Icon size: 22px
- Label: 10px, `font-weight: 500`

### 6.3 Floating Action Button (Map page only)
```html
<!-- Circular FAB, bottom-right, above footer: bottom 80px, right 20px -->
<button class="fab-primary">
  <svg><!-- Plus / Check-in icon --></svg>
</button>
```
- Size: 56px circle
- Background: `var(--color-primary)`
- Shadow: `0 6px 24px rgba(255,126,85,0.45)`
- On tap: triggers "Watchtower Check-in" modal

---

## 7. Page Specifications

### 7.1 Home (Splash Screen)

**Purpose:** App intro shown once before login.

**Layout:**
```
[Full-screen dark background #2B2D35]

  - Centered logo mark (SVG compass / map-pin motif) — 80px
  - App name: "ตามรอย" or "Tamroi" — Kanit Bold 32px, white
  - Tagline: "Explore · Capture · Conquer Thailand" — Inter 14px, muted
  - Hero illustration: stylized Thailand map silhouette with glowing pins
    (use CSS clip-path or SVG, sage green glow effect)

  [Bottom card panel — slides up, bg: var(--color-card-dark), border-radius 24px top]
    - "เริ่มการเดินทาง" (Start Journey) button — full width, orange, 52px tall
    - "มีบัญชีแล้ว? เข้าสู่ระบบ" — text link, muted color
```

### 7.2 Login / Register

**Single page with tab toggle (Login | Register)**

```
[Top: back arrow + "เข้าสู่ระบบ" title]

[Tab toggle — pill style]
  [Login] [Register]
  Active tab: bg white, text dark; inactive: transparent, text muted

[Login Form]
  - Email input (dark card input, border: 1px solid rgba(255,255,255,0.1))
  - Password input (with show/hide toggle eye icon)
  - "จำฉันไว้" checkbox (green accent)
  - [เข้าสู่ระบบ] button — full width, orange, 52px
  - Divider: "หรือ" (or)
  - [Continue with Google] — outlined button, white border

[Register Form]
  - Display Name input
  - Email input
  - Password input
  - Confirm Password input
  - [สร้างบัญชี] button — full width, orange, 52px

[Input styling]
  background: rgba(255,255,255,0.06)
  border: 1px solid rgba(255,255,255,0.1)
  border-radius: 12px
  padding: 14px 16px
  color: white
  focus: border-color: var(--color-primary)
```

### 7.3 Main Map (Default Tab)

**Purpose:** Exploration hub — Fog of War map of Thailand.

#### Map Container
```html
<div id="map-view">
  <!-- Leaflet.js full-screen map -->
  <!-- height: calc(100vh - 116px) -->
  <!-- Default tiles: CartoDB Dark Matter (matches dark theme) -->
  <!-- Tile URL: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png -->
</div>
```

#### Map Overlays (positioned absolute within map-view)

**District Stats Bar** — top of map, below top-bar
```html
<!-- Semi-transparent pill card, centered, top: 8px -->
<div class="map-stats-pill">
  <span class="stat-item">
    <span class="stat-value text-success">34%</span>
    <span class="stat-label">Explored</span>
  </span>
  <div class="stat-divider"></div>
  <span class="stat-item">
    <span class="stat-value text-orange">12</span>
    <span class="stat-label">Captured</span>
  </span>
  <div class="stat-divider"></div>
  <span class="stat-item">
    <span class="stat-value text-white">1,850</span>
    <span class="stat-label">Legacy Pts</span>
  </span>
</div>
```
Styling: `background: rgba(43,45,53,0.85)`, `backdrop-filter: blur(8px)`, `border-radius: 20px`, `padding: 8px 20px`

#### Map Markers (Leaflet custom icons)
```
Watchtower (unchecked): gray pin icon, 28px
Watchtower (checked-in): orange glow pin, 28px — clears fog
Historical Figure (C-Class): green circular badge, letter "C"
Historical Figure (S-Class, locked): locked padlock badge, orange border
OTOP/Workshop: small orange square icon
Cafe/Local spot: small sage green dot
Landmark: white star icon
```

#### Fog of War Layer
- Unexplored districts: dark overlay polygon `rgba(20,20,25,0.75)` on top of map
- On Watchtower check-in: animate overlay fade out for that district
- Cleared districts: no overlay, subtle `var(--color-surface)` tint on district boundary

#### Proximity Banner (shown when user is near historic place)
```html
<!-- Slides down from top when GPS proximity triggers -->
<div class="proximity-banner">
  <div class="proximity-icon">🏛</div>
  <div class="proximity-text">
    <p class="proximity-title">วัดพระแก้ว nearby</p>
    <p class="proximity-sub">+50 Historical Knowledge XP on visit</p>
  </div>
</div>
```
Styling: `background: var(--color-success)`, green gradient, `color: var(--color-bg)`, slide-down animation 0.3s

#### Check-in Bottom Sheet (triggered by FAB)
```
[Bottom Sheet — slides up 60% screen height]
  Header: "Watchtower Check-in"
  
  [Location Card]
    - District name + province
    - Fog clearance preview (mini map thumbnail)
    - "Reveals X Cafes, Y OTOPs, Z Landmarks"
  
  [Unlock Conditions — progress checklist]
    ☑ 2/2 Local Cafes visited     (green check)
    ☑ 1/1 OTOP visited             (green check)
    ☐ 1/3 Landmarks checked        (orange progress "1 of 3")
  
  [Action Button]
    - If unlocked: [Check In & Clear Fog] — orange, full width
    - If locked: [View Requirements] — outlined, muted
```

### 7.4 Collection Page

**Purpose:** Archive of captured Historical Figures and Artifacts.

#### Layout
```
[Top bar title: "Collection"]
[Search bar — full width, with filter icon]

[Filter Pills — horizontal scroll]
  [All] [S-Class] [A-Class] [C-Class] [Artifacts]

[Stats Summary Row]
  [ Figures: 12 ]  [ Artifacts: 7 ]  [ Legacy: 1,850pts ]
  (3-column dark card row)

[Figure Grid — 2 columns]
  Each card (figure-card):
    - Portrait image (80px, circle, border color by class)
    - Name (Thai + English)
    - Class badge (S / A / C — color coded)
    - Legacy Points value
    - "Captured" green check ribbon OR "Locked" overlay with padlock
  
  S-Class locked card:
    - Blurred portrait
    - Orange glowing border
    - "PHASE LOCKED" label
    - Lock icon center

[Artifacts Section]
  Section header: "Artifacts & Relics"
  [Horizontal scroll row of artifact cards]
    Each artifact: icon + name + rarity dot
```

**Class badge colors:**
- S-Class / Legendary: `var(--color-primary)` orange border + badge
- A-Class: `#C0A060` gold border
- C-Class: `var(--color-success)` green border

### 7.5 Mission Page

**Purpose:** Active quests and daily challenges.

#### Layout
```
[Top bar title: "Missions"]

[Active Mission Banner — full-width card, orange gradient top]
  Title: "Unlock Taksin the Great"
  Progress bar (green fill on dark track)
  Sub-steps listed with checkboxes:
    ☑ Visit 2 Local Cafes (gathering Local Rumors)
    ☑ Obtain 1 Relic from OTOP
    ☐ Check-in at 3 Nature/Minor Landmarks
    ☐ Complete Master Quiz

[Daily Challenges — section]
  Card list, each row:
    Left: colored icon square (16px rounded)
    Center: task name + location hint
    Right: "+Xpts" in orange OR green checkmark if done
  
  Examples:
    📍 Visit a cafe in Rattanakosin Island   +50pts
    🏛  Check-in at a riverside landmark     +75pts
    🎯  Answer a C-Class quiz               +30pts

[BKK Transport Bonus Banner]
  (only visible when user is in Bangkok)
  "Using BTS/MRT? +2x Points Active!"
  bg: rgba(123,198,126,0.15), green border-left accent

[Completed Missions]
  Collapsible section, muted cards with strikethrough text
```

### 7.6 Leaderboard Page

**Purpose:** National ranking by three metrics.

#### Layout
```
[Top bar title: "The High Chronicler"]

[Period Toggle Pills]
  [Weekly] [Monthly] [All-Time]

[Metric Tab Selector]
  [Map Discovery] [Archive] [Legacy Score]
  Active: orange underline, white text

[Your Rank Card — highlighted]
  bg: rgba(255,126,85,0.12), orange border-left 3px
  Rank #24  |  Avatar  |  "Your Name"  |  34% / 1,850pts

[Top 3 Podium — visual]
  Rank 2 (left, slightly smaller)
  Rank 1 (center, tallest, gold crown icon)
  Rank 3 (right, smallest)
  Each: avatar circle + username + score

[Ranked List — items 4 onwards]
  Each row:
    Rank number (bold, 18px) | Avatar | Username | Score
    Province tag (small pill, muted)
  Alternating subtle row bg for readability
  
[Friend Filter Toggle]
  "Show Friends Only" toggle switch (green when active)
```

---

## 8. Modals & Overlays

### 8.1 Figure Encounter Modal
Triggered when user reaches a C-Class figure for first time.
```
[Dark overlay 0.7 opacity]
[Center card, border-radius 20px]
  - Animated "DISCOVERED" stamp entrance
  - Figure portrait (100px circle, class-colored border)
  - Name + Class badge
  - Historical snippet (2-3 sentences)
  - [Start Quiz] orange button — leads to quiz flow
  - [Save for Later] text link
```

### 8.2 Master Quiz Flow
Simple 3-question card swipe:
```
[Question card]
  - Question text
  - 4 answer options (list of tappable rows)
  - Timer bar (orange, drains left to right)
  
[Result card]
  - ✓ or ✗ icon
  - Correct answer explanation
  - [Next Question] / [Finish]
  
[Completion card]
  - Score X/3
  - Legacy points earned: "+100pts"
  - Figure added to Collection animation
```

### 8.3 Notification Panel
Slides down from top-right bell:
```
[Panel, width: 90vw, right-aligned, max-width: 360px]
[bg: var(--color-card-dark), shadow, border-radius 16px bottom]

Notification row types:
  🟠 New figure unlocked nearby
  🟢 District explored — fog cleared
  🏆 Leaderboard rank changed
  📦 New artifact obtained
```

---

## 9. Animations & Micro-interactions

| Trigger | Animation |
|---|---|
| Page navigation | Slide left/right (CSS transform translateX) 250ms ease |
| Bottom sheet open | translateY from 100% to 0, 300ms ease-out |
| Fog cleared | District overlay fades out, scale(1.02) pulse, 600ms |
| Figure captured | Stamp drop + confetti burst (JS canvas or CSS keyframe) |
| Points earned | Float-up "+Xpts" label, fade out, 1s |
| Tab switch in footer | Active indicator slides smoothly (CSS transition 200ms) |
| Progress bar fill | Width transition 0.5s ease-in-out on mount |
| Notification badge | Pulse scale animation on new notif |

---

## 10. File Structure

```
Website - NSC prototype 06/
├── index.html           ← Splash / Home
├── login.html           ← Login & Register
├── onboarding.html      ← First-run location permission and home district
├── app.html             ← Main app shell (all tab pages)
├── build.js             ← Vercel env injection
├── vercel.json          ← Static deployment config and security headers
├── css/
│   ├── variables.css    ← CSS custom properties (colors, spacing)
│   ├── layout.css       ← Top bar, footer, page shell
│   ├── components.css   ← Cards, buttons, badges, inputs
│   ├── map.css          ← Map overlays, fog effect, markers
│   └── animations.css   ← Keyframes and transitions
├── js/
│   ├── env.js           ← Public Supabase anon config for local/static runtime
│   ├── env.example.js   ← Credential template
│   ├── config.js        ← window.ENV → window.APP_CONFIG
│   ├── utils.js         ← escapeHtml()
│   ├── supabase-client.js ← DB/Auth facade
│   ├── app.js           ← Tab navigation, page switching
│   ├── map.js           ← Leaflet init, fog layer, markers
│   ├── missions.js      ← Mission state logic
│   ├── collection.js    ← Figure/artifact data rendering
│   └── leaderboard.js   ← Rank data, metric switching
├── supabase/            ← Schema and patch SQL files
├── tests/               ← Node static regression checks
├── docs/                ← Planning, progress, production, and proposal docs
└── document/            ← NSC assets, screenshots, and generated documents
```

---

## 11. Bootstrap 5 Usage Notes

- Use Bootstrap's **grid** only for 2-col figure cards (`col-6`)
- Use Bootstrap **utilities** for spacing (`p-3`, `mb-2`, `d-flex`, `gap-2`)
- **Override** Bootstrap's default blue with our orange via CSS variables
- Use Bootstrap **modals** for figure encounter (customize backdrop opacity)
- Use Bootstrap **offcanvas** for notification panel
- Use Bootstrap **progress** component for quest bars (override color)
- Do NOT use Bootstrap navbar — build custom top-bar and bottom-nav from scratch

```html
<!-- Bootstrap CDN in <head> -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<!-- Leaflet CSS -->
<link href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" rel="stylesheet">

<!-- Before </body> -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

---

## 12. Key Gameplay Data Structure (JS mock data)

```js
// Mock user state for prototype
const userState = {
  name: "Traveler",
  level: 5,
  legacy: 1850,
  exploredDistricts: ["rattanakosin", "silom", "sukhumvit"],
  capturedFigures: ["king-taksin", "sunthon-phu"],
  artifacts: ["bronze-sword", "old-map"],
  activeQuest: "unlock-taksin"
};

// Figure class
const figures = [
  { id: "king-taksin",   name: "King Taksin",    class: "S", legacy: 500, locked: false },
  { id: "sunthon-phu",   name: "Sunthorn Phu",   class: "A", legacy: 200, locked: false },
  { id: "village-elder", name: "Village Legend",  class: "C", legacy: 50,  locked: true  }
];

// District data
const districts = [
  { id: "rattanakosin", name: "Rattanakosin", fogged: false, watchtower: true,
    supportNodes: { cafes: 3, otops: 1, landmarks: 4 } },
  { id: "dusit",        name: "Dusit",         fogged: true,  watchtower: false,
    supportNodes: { cafes: 2, otops: 2, landmarks: 3 } }
];
```

---

## 13. Responsive Breakpoints

```css
/* Mobile base — design target */
@media (max-width: 430px) { /* primary */ }

/* Slightly larger phones */
@media (min-width: 431px) and (max-width: 767px) {
  .app-wrapper { max-width: 430px; margin: 0 auto; }
}

/* Tablet / desktop — center the mobile frame */
@media (min-width: 768px) {
  body { background: #1a1c22; }
  .app-wrapper {
    max-width: 430px;
    margin: 0 auto;
    box-shadow: 0 0 60px rgba(0,0,0,0.5);
    min-height: 100vh;
  }
}
```
