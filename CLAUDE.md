# CLAUDE.md — Tamroi (ตามรอย) · NSC Prototype 06

> Thailand Gamified Travel App · NSC 2026 · Team ปลามึกยักษ์

---

## Project Context

**Tamroi** is a mobile-first web app for the National Software Contest 2026. Players travel to real Thai districts, check in at landmark Watchtowers to clear Fog of War, and capture historical figures by visiting local outposts. The app is currently in **Phase 1 (Web MVP)** — no native mobile code, no React, no build tooling.

**Primary User:** Tourist / traveler, age 20–30  
**Platform:** Mobile web, max content width 430px  
**Language mix:** Thai (UI labels, figure names) + English (code, docs)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 modules) |
| Map | Leaflet.js + CartoDB Dark tiles |
| Backend / Auth | Supabase — PostgreSQL · Auth · Row Level Security |
| Deployment | Vercel (static + Node.js `build.js` for env injection) |

**No npm install, no webpack, no framework.** Serve with VS Code Live Server for local dev.

---

## File Structure

```
├── index.html           Splash / landing
├── login.html           Email + Google OAuth login & register
├── onboarding.html      First-run: location permission + home district picker
├── app.html             Main app shell — Map · Collection · Mission · Leaderboard
├── build.js             Vercel build — injects Supabase env vars at deploy time
├── vercel.json          Deployment config + security headers
├── css/
│   ├── variables.css    Design tokens (DO NOT override these inline)
│   ├── layout.css       Top bar, bottom nav, tab shell
│   ├── components.css   Buttons, cards, inputs, bottom sheets, badges
│   ├── map.css          Leaflet overrides, fog layer, markers, GPS dot
│   └── animations.css   Keyframes
├── js/
│   ├── config.js        Reads window.ENV → window.APP_CONFIG
│   ├── env.example.js   Credential template — copy to env.js for local dev
│   ├── utils.js         escapeHtml() — always use for user-visible strings
│   ├── supabase-client.js  All DB & Auth calls live here
│   ├── app.js           Boot · auth guard · tab navigation · notifications
│   ├── map.js           Leaflet · Fog of War · watchtowers · GPS dot
│   ├── collection.js    Figures + artifacts grid
│   ├── missions.js      Active quest + daily challenges
│   └── leaderboard.js   Podium + rank list
└── supabase/
    ├── schema.sql        Full DB schema + Bangkok district seed data
    └── patch_auth_fix.sql Auth trigger fix + RLS INSERT policy
```

**`js/env.js` is gitignored.** Never commit it. Copy from `env.example.js`.

---

## Design System

### Colors (use CSS variables only — never hardcode hex)

```css
--color-bg:        #2B2D35  /* Dark Charcoal — page background */
--color-primary:   #FF7E55  /* Vibrant Orange — CTA, active tab, S-Class */
--color-success:   #7BC67E  /* Sage Green — captured markers, progress */
--color-surface:   #E1F0E3  /* Pale Mint — secondary cards, cleared zones */
--color-white:     #FFFFFF  /* Primary text on dark, card bodies */
--color-card-dark: #33363F  /* Elevated dark cards */
--color-muted:     #9DA3AE  /* Secondary text, disabled states */
```

### Typography

- Body: `Inter` (400/500/600/700)
- Thai headings: `Kanit` (400/600/700)
- Base size: 14px

### Layout Rules

- Max content width: **430px**, centered, `margin: 0 auto`
- Fixed top bar: **56px**
- Fixed footer nav: **60px**
- Content padding: `padding-top: 56px; padding-bottom: 60px`
- Card border-radius: **16px** | Button: **12px** | Icon circles: **50%**
- Shadow: `0 4px 20px rgba(0,0,0,0.25)`
- All cards: `var(--color-card-dark)` bg + `var(--color-white)` text

---

## Code Conventions

### JavaScript

- All JS is **module pattern** — wrap each file in an IIFE or named module object (e.g., `const MapModule = (() => { ... })()`)
- Use `utils.escapeHtml()` for **every** user-visible string rendered into the DOM
- All Supabase calls go through `supabase-client.js` — never call `supabase` directly from page modules
- `app.js` handles auth guard — other modules can assume the user is authenticated when they run
- Guard against `null` map/user before operating on them

### HTML

- Follow Bootstrap 5.3 class conventions
- No inline styles — use CSS variables via classes or `css/components.css`
- Bottom sheets use the pattern established in `app.html` (`.bottom-sheet` + `.bottom-sheet-overlay`)

### Security

- XSS: always `escapeHtml()` before `innerHTML`
- Credentials: only in `js/env.js` (gitignored) or Vercel env vars — never hardcoded
- Supabase: RLS policies enforce per-user data isolation — do not bypass with service key on the client

---

## Local Development Setup

```bash
# 1. Clone
git clone https://github.com/Ray0737/NSC_2026.git
cd NSC_2026

# 2. Set up credentials
cp js/env.example.js js/env.js
# Edit js/env.js — paste Supabase URL and anon key

# 3. Serve
# Open with VS Code Live Server (port 5500)
# No npm install or build step needed
```

### Supabase Setup (first time)

1. Create project at supabase.com
2. SQL Editor → run `supabase/schema.sql`
3. SQL Editor → run `supabase/patch_auth_fix.sql`
4. Authentication → Email → **disable "Confirm email"** for dev
5. Authentication → URL Configuration → add `http://127.0.0.1:5500/**`
6. Settings → API → copy URL + anon key into `js/env.js`

---

## Key Gameplay Mechanics (for context when editing code)

### Fog of War

- Entire map starts covered by a dark inverted polygon (`fogLayer` in `map.js`)
- Check-in at a Watchtower punches a hole in the polygon for that district
- Cleared state persists via Supabase `districts_explored` table

### Support Node Chain (Phase Lock)

Legendary S-Class figures require before unlock:
- 2 Local Cafés visited → *Local Rumors*
- 1 OTOP/Workshop visited → *Relic*
- 3 Nature/Minor Landmarks checked in → *Historical Knowledge*

### Scoring

- C-Class figure captured: ~50 pts
- S-Class/Legendary: up to 500 pts (King Taksin = 500)
- BTS/MRT transport bonus: ×2 points multiplier
- Leaderboard metrics: Map Discovery % · Archive count · Legacy Score

---

## What to Avoid

- Do not add npm dependencies or a build step — this is intentionally zero-tooling
- Do not use `eval()` or `innerHTML` with unescaped strings
- Do not commit `js/env.js` or any file with real Supabase credentials
- Do not add `!important` to CSS — use the variable system instead
- Do not write comments explaining what code does — only write them for non-obvious WHY
- Do not call Supabase outside of `supabase-client.js`
