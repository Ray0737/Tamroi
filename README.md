# Siam Echo — ลุยไทย 🧭

> **NSC 2026** · วิชาเอกวิศวกรรมปัญญาประดิษฐ์ (AI)  
> โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม)

Gamified Thailand travel-discovery web app. Players explore Bangkok districts, clear **Fog of War** on a live map, capture historical figures, collect artifacts, and compete on a national leaderboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Bootstrap 5.3 · Vanilla JS |
| Map | Leaflet.js + CartoDB Dark tiles |
| Backend / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Deployment | Vercel (static + Node.js build step) |

---

## Project Structure

```
├── index.html          Splash / landing
├── login.html          Email + Google OAuth login & register
├── onboarding.html     First-run: location permission + home district
├── app.html            Main app shell (Map · Collection · Mission · Leaderboard)
├── build.js            Vercel build — injects Supabase env vars into js/env.js
├── vercel.json         Deployment config + security headers (CSP, X-Frame, etc.)
├── css/
│   ├── variables.css   Design tokens (colors, spacing, radii)
│   ├── layout.css      Top bar, bottom nav, tab sections
│   ├── components.css  Buttons, cards, inputs, sheets, badges
│   ├── map.css         Leaflet overrides, fog layer, markers, node info card
│   └── animations.css  Keyframes (blobMorph, floatY, locationPulse, …)
├── js/
│   ├── env.example.js  Template — copy to env.js for local dev
│   ├── config.js       Reads window.ENV → window.APP_CONFIG
│   ├── utils.js        escapeHtml() XSS utility
│   ├── supabase-client.js  DB & Auth helpers
│   ├── app.js          Boot, auth guard, tab navigation, notifications
│   ├── map.js          Leaflet map, fog of war, watchtowers, GPS dot
│   ├── collection.js   Figures + artifacts grid
│   ├── missions.js     Active quest + daily challenges
│   └── leaderboard.js  Podium + rank list
└── supabase/
    ├── schema.sql       Full DB schema + seed data (run first)
    └── patch_auth_fix.sql  Auth trigger + RLS INSERT policy fix
```

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/Ray0737/NSC_2026.git
cd NSC_2026

# 2. Create your credentials file (gitignored — never commit)
cp js/env.example.js js/env.js
# Edit js/env.js with your Supabase URL and anon key

# 3. Open with VS Code Live Server or any static server
# The app runs entirely client-side — no npm install needed
```

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. **SQL Editor → New Query** → run `supabase/schema.sql`
3. **SQL Editor → New Query** → run `supabase/patch_auth_fix.sql`
4. **Authentication → Providers → Email** → toggle "Confirm email" **OFF** (for dev)
5. **Authentication → URL Configuration** → add `http://127.0.0.1:5500/**` as redirect URL
6. Copy your **Project URL** and **anon key** into `js/env.js`

---

## Vercel Deployment

1. Import repo in [vercel.com](https://vercel.com)
2. Set **Root Directory** to the repo root
3. Vercel auto-detects `vercel.json` — build command is `node build.js`
4. **Settings → Environment Variables** → add:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGci...`
5. Deploy — `build.js` generates `js/env.js` from env vars at build time

---

## Game Flow

```
Splash → Login/Register → Onboarding (GPS + Home District) → Map

Map:  Watchtower check-in → clears Fog of War → reveals nodes
      Visit cafes/OTOPs/landmarks → unlock Legendary figures → Master Quiz

Leaderboard ranks by: Legacy Score · Map Discovery % · Archive count
```

---

## Developer

**ปลามึกยักษ์** · [Ray0737](https://github.com/Ray0737) · raphee.rattanamanoonporn@gmail.com
