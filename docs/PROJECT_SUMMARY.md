# ตามรอย · Tamroi — Full Project Summary

> Single-file reference covering tech stack, layout, UI theme, database/SQL, every feature, and where each thing lives.
> Generated 2026-06-14 from the live source files (not just the docs).

**Tamroi (ตามรอย)** = a gamified Thailand travel-discovery web app that turns Thai history into an open-world game. Players physically travel to real districts, check in at landmark **Watchtowers** to clear a **Fog of War** on a national map, hunt phase-locked legendary **historical figures** by visiting cafés / OTOP shops / landmarks, and earn **Legacy Points** ranked on a national leaderboard called **The High Chronicler**.

- **Contest:** NSC 2026 (National Software Contest) · Team **ปลามึกยักษ์**
- **School:** สาธิต มศว ประสานมิตร (ฝ่ายมัธยม), AI engineering major
- **Primary user:** Tourist / traveler, age 20–30
- **Platform:** Mobile-first web app (375–430px base), deployed on Vercel
- **Phase:** Phase 1 (Web MVP) — *complete except full Thailand district coverage*
- **GitHub:** Ray0737/NSC_2026
- **Language mix:** Thai (UI labels, figure names, lore) + English (code, docs)

---

## 1. Tech Stack

| Layer | Technology | Where |
|---|---|---|
| Frontend shell | HTML5 · Bootstrap 5.3 · Vanilla JS (ES6 IIFE module objects) | `*.html`, `js/` |
| Typography | Google Fonts: **Kanit** (Thai headings) + **Inter** (Latin body) | `css/variables.css` (`@import`) |
| Map engine | **Leaflet.js 1.9.4** + CartoDB Dark Matter tiles | `js/map.js`, `css/map.css` |
| Fog of War | Leaflet `L.polygon` inverted polygon with district-shaped clip holes | `js/map.js` |
| GPS / geolocation | Browser `navigator.geolocation.watchPosition` + custom `haversineDistance()` | `js/map.js` |
| Auth | **Supabase Auth (GoTrue)** — email/password + Google OAuth | `js/supabase-client.js` |
| Database | **Supabase PostgreSQL 15** with Row Level Security | `supabase/*.sql` |
| Realtime | Supabase Realtime (WebSocket Postgres Changes) — leaderboard + notifications | `js/supabase-client.js` |
| RPC / stored procs | PostgreSQL functions (`SECURITY DEFINER`) | `supabase/patch_lore.sql` |
| Design tokens | CSS Custom Properties | `css/variables.css` |
| Animation | CSS keyframes | `css/animations.css` |
| Build / deploy | **Vercel** static + Node.js `build.js` env injection | `build.js`, `vercel.json` |
| Security | `escapeHtml()` XSS guard + edge security headers | `js/utils.js`, `vercel.json` |
| Testing | Node.js static regression suite (7 files) | `tests/run-static.mjs` |

**Zero tooling by design:** no `npm install`, no webpack, no framework, no build step for local dev. Serve with VS Code Live Server (port 5500).

---

## 2. UI Theme (actual values from `css/variables.css`)

> ⚠️ **Doc discrepancy:** `README.md` and `CLAUDE.md` describe an older "Dark Charcoal #2B2D35 / Vibrant Orange #FF7E55" palette. The **live `variables.css` is a different, current theme** — a deep indigo background with a warm cream-peach accent. The values below are the real ones.

### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#1C1B2E` | Deep indigo — page background |
| `--color-primary` | `#F6C19E` | Warm cream-peach — CTA, active tab, S-Class (light, so text on it is dark) |
| `--color-on-primary` | `#1C1B2E` | Dark ink for text on the light primary bg |
| `--color-primary-dim` | `rgba(246,193,158,0.15)` | Tinted primary fills |
| `--color-success` | `#7BC67E` | Sage green — captured markers, progress, success |
| `--color-success-dim` | `rgba(123,198,126,0.15)` | Tinted success fills |
| `--color-surface` | `#E1F0E3` | Pale mint — secondary surfaces, cleared zones |
| `--color-white` | `#FFFFFF` | Primary text on dark |
| `--color-card-dark` | `#252240` | Elevated cards, bottom nav |
| `--color-card-darker` | `#201E38` | Deeper card layer |
| `--color-muted` | `#8986A8` | Secondary text, disabled, inactive nav |
| `--color-border` | `rgba(255,255,255,0.07)` | Hairline borders |
| `--color-overlay` | `rgba(0,0,0,0.65)` | Modal/sheet scrim |

### Figure class badge colors
`--color-class-s: #F6C19E` (peach) · `--color-class-a: #C0A060` (gold) · `--color-class-c: #7BC67E` (green)

### Typography
- Body: `Inter` (400/500/600/700) · Thai headings: `Kanit` (400/600/700) · Base size **14px**
- Scale: xs 10 · sm 12 · base 14 · md 16 · lg 18 · xl 22 · 2xl 28 · 3xl 36 (px)

### Spacing / radius / shadow / transitions
- Spacing: xs 4 · sm 8 · md 16 · lg 24 · xl 32 (px)
- Radius: sm 8 · md 12 · lg 16 · xl 20 · 2xl 24 · full 9999 (px)
- Shadows: card `0 4px 20px rgba(0,0,0,.35)` · primary `0 6px 24px rgba(246,193,158,.30)` · success `0 6px 24px rgba(123,198,126,.28)` · up `0 -4px 24px rgba(0,0,0,.4)`
- Transitions: fast 150ms · base 250ms · slow 350ms (ease)

---

## 3. Layout (from `css/layout.css`)

- **Max content width 430px**, centered (`.app-wrapper { max-width:430px; margin:0 auto }`); `100dvh` min-height.
- **Fixed top bar — 56px** (`--top-bar-height`): `backdrop-filter: blur(12px)`, bottom hairline, z-index 100. Left = avatar + username; center = page title (Kanit); right = icon buttons + notification bell with pulsing badge.
- **Fixed bottom nav — 60px** (`--bottom-nav-height`): 4 equal `.nav-item` tabs; active item turns peach with a 3px underline indicator (`::after`).
- **Page content** padded `top:56px / bottom:60px`. Tabs are `.tab-section` (`display:none` → `.active` shows). Scroll regions hide scrollbars (`.section-scroll`), `.section-inner` padding 16px.
- **Desktop frame (≥768px):** page bg darkens to `#1a1c22`, the 430px column gets side borders + a big drop shadow so it reads like a phone mockup.
- Avatars: 32px circle, peach initial on dark; icon buttons 40px circle with subtle hover lift.

### CSS file map
| File | Contents |
|---|---|
| `css/variables.css` | All design tokens + Google Fonts import |
| `css/layout.css` | Top bar, bottom nav, app wrapper, tab shell, desktop frame |
| `css/components.css` | Buttons, cards, inputs, bottom sheets, badges |
| `css/map.css` | Leaflet overrides, fog layer, markers, GPS dot, node info card |
| `css/animations.css` | Keyframes: blobMorph, floatY, locationPulse, fog-clear, badgePulse, etc. |

---

## 4. Pages

| File | Role |
|---|---|
| `index.html` | Splash / landing — animated blob, CTA to login |
| `login.html` | Email + password + Google OAuth; register flow |
| `onboarding.html` | First-run: location permission + home district picker |
| `app.html` | Main app shell — 4 tabs: **Map · Collection · Mission · Leaderboard** |

---

## 5. JavaScript Modules (`js/`)

| File | Global | Responsibility |
|---|---|---|
| `env.js` | `window.ENV` | Public Supabase URL + anon key (tracked, dev-safe only) |
| `env.example.js` | — | Template for resetting `env.js` |
| `config.js` | `window.APP_CONFIG` | Reads `window.ENV` → exports `supabaseUrl` + `supabaseAnonKey` |
| `utils.js` | `escapeHtml()` | XSS-safe HTML escaping — required for every user string in `innerHTML` |
| `supabase-client.js` | `window.DB` | **All** DB & Auth calls (Auth, Profiles, Districts, Figures, Artifacts, Lore, Quiz, Leaderboard, Notifications) |
| `app.js` | `window.AppCore` | Boot · auth guard · tab nav · toast · bottom sheets · lore sheets · notifications |
| `map.js` | `window.MapModule` | Leaflet map · Fog of War · GPS dot · watchtowers · check-in · support nodes · quiz/capture · lore proximity |
| `fog-grid.js` | `window.FogGrid` | Reusable Thailand grid-cell generator for future national fog |
| `collection.js` | `window.CollectionModule` | Figures + artifacts grid · Lore Journal · filter/search · capture refresh |
| `missions.js` | `window.MissionsModule` | Active quest + daily challenges + BKK transport banner (mock data) |
| `leaderboard.js` | `window.LeaderboardModule` | Podium + ranked list + metric/period toggles + Realtime |

**Conventions:** every module is an IIFE/named object; never call `supabase` outside `supabase-client.js`; `app.js` owns the auth guard so other modules assume an authenticated user; no inline styles, no `!important`, no npm deps.

---

## 6. Features — full inventory

### Gameplay loop
```
Travel to district → reach Watchtower → check in (500m GPS gate) → fog clears
 → GPS proximity triggers Lore narration
 → visit Support Nodes (2 cafés + 1 OTOP + 3 landmarks)
 → phase lock lifts on Legendary figure
 → Master Quiz (3 Qs all correct) → figure captured → Legacy Points (DB trigger)
 → Map Discovery % rises → leaderboard rank up
```

### Figure class system
| Class | Examples | Unlock | Points |
|---|---|---|---|
| **C-Class** | Local Village Legend, OTOP Craft Master | Instant — 1-question quiz on check-in | 50 |
| **A-Class** | Sunthorn Phu, Sri Suriyothai | Support-node gate + 3-question quiz | 200 |
| **S-Class / Legendary** | King Taksin, King Rama I | Phase-locked — full support-node chain | 500 |

### Support Node chain (phase lock, per district)
- 2 cafés (`cafes_visited >= 2`) → *Local Rumors*
- 1 OTOP/workshop (`otops_visited >= 1`) → *Relic / Special Item*
- 3 landmarks (`landmarks_visited >= 3`) → *Historical Knowledge*
- Bangkok bonus: GPS near BTS/MRT station → **×2 points** multiplier (seeded station radius, MVP).

### Feature modules
1. **Auth** (`DB.Auth`) — signIn, signUp (`emailRedirectTo`→login.html), signInGoogle (→onboarding), signOut, getSession, getUser, onStateChange; auth guard in `app.js`.
2. **Profiles** (`DB.Profiles`) — get, getOrCreate (OAuth upsert), update, addLegacyPoints (uses `increment_legacy_score` RPC); auto-created by `handle_new_user` trigger.
3. **Fog of War / Map** (`MapModule`) — Leaflet init with fog re-punch on reload, inverted-polygon fog (`rgba(20,20,25,0.75)`), fog persistence via `user_districts`, watchtower markers, 500m Haversine check-in (bypassed on localhost), live GPS dot + accuracy ring, node info bottom sheet, support-node visit tracking, encounter gate progress bars, Map Discovery %, BTS/MRT bonus, `FogGrid` helper.
4. **Lore / Proximity** (`DB.Lore`) — per-GPS-update `radius_m` proximity check, lore unlock bottom sheet (Thai narrative + optional lazy image + audio play/pause + Save + point badge), `user_lore` persist, lore points, **3-node chains** (`chain_id`/`chain_part` → consolidated story + 50 bonus pts), tappable read-only visited-lore icons.
5. **Quiz & Capture** (`DB.Quiz`, `DB.Figures`) — `getForFigure(id, count)`, C-Class 1-Q MCQ modal, Legendary 3-Q timed Master Quiz (all correct required), capture insert → **`on_capture_update_score` trigger** updates score + archive_count, collection refresh via `markCaptured`.
6. **Collection** (`CollectionModule`) — 2-col figure grid with class-colored borders, filter pills (All/S/A/C/Artifacts/Journal), live search (Thai+English), figure detail modal (reused instance, backdrop cleanup), artifact scroll row, **Lore Journal** with chain progress (e.g. 2/3), stats summary row.
7. **Missions** (`MissionsModule`) — active quest banner + progress, quest-step checklist, daily challenges, conditional BKK transport ×2 banner, completed-missions collapse. *(UI mock data; persistence is future polish.)*
8. **Leaderboard** (`LeaderboardModule`) — `leaderboard_legacy` view query, top-3 podium, ranked list 4+, "your rank" highlighted card, metric toggle (Map Discovery / Archive / Legacy Score), period toggle (Weekly/Monthly/All-Time), **Realtime** subscription on `profiles` UPDATE.
9. **Notifications** (`DB.Notifications`) — get (last 20), push, markRead, **Realtime** subscribe on INSERT, Bootstrap offcanvas + badge; 4 types (figure unlocked / fog cleared / rank changed / artifact obtained).
10. **App shell** (`AppCore`) — boot sequence, tab nav with slide animation, `showToast`, `openLoreSheet` / `openLoreChainSheet`, unified `.bottom-sheet` + `.bottom-sheet-overlay` pattern, session-expiry redirect.
11. **Onboarding** — location permission request, home district picker, profile init on first run.
12. **Security/utils** — `escapeHtml`, `APP_CONFIG`, `build.js` env injection, `vercel.json` headers.

---

## 7. Database / SQL

### Run order (Supabase SQL Editor)
1. `supabase/schema.sql`
2. `supabase/patch_auth_fix.sql`
3. `supabase/patch_lore.sql`
4. `supabase/patch_district_seed.sql`

### Tables & objects
| Object | Type | Purpose | Defined in |
|---|---|---|---|
| `profiles` | table | username, avatar_url, legacy_score, map_discovery(0–100), archive_count | schema |
| `districts` | table | name_th/en, province, center + watchtower lat/lng, required_cafes/otops/landmarks, polygon_coords (JSONB), is_active | schema |
| `figures` | table | name_th/en, class S/A/C (CHECK), legacy_pts, district_id, description, image_emoji | schema |
| `artifacts` | table | name, rarity common/rare/legendary, district_id, icon, description | schema |
| `user_districts` | table | per-user fog state (`fogged`) + cafes/otops/landmarks_visited counters, `UNIQUE(user_id,district_id)` | schema |
| `user_captures` | table | captured figures + quiz_score, `UNIQUE(user_id,figure_id)` | schema |
| `user_artifacts` | table | obtained artifacts, `UNIQUE(user_id,artifact_id)` | schema |
| `notifications` | table | type, title, message, is_read, created_at | schema |
| `leaderboard_legacy` | view | profiles + `RANK()` over legacy_score / map_discovery / archive_count | schema |
| `lore_nodes` | table | lat/lng, radius_m, lore_pts, content_type/th/en, media_url, chain_id, chain_part, district_id | patch_lore |
| `user_lore` | table | unlocked lore, PK `(user_id, lore_id)` | patch_lore |
| `user_support_node_visits` | table | exact node visits, node_type CHECK(cafe/otop/landmark), `UNIQUE(user_id,node_id)` — cross-device dedupe | patch_lore |
| `quiz_questions` | table | figure_id, district_id, question_th, option_a–d, correct_option CHAR(1) A–D, difficulty | patch_lore |

### Functions / triggers
| Object | Type | Purpose |
|---|---|---|
| `handle_new_user()` + `on_auth_user_created` | trigger | Auto-create profile on `auth.users` INSERT. **patch_auth_fix** hardens it: sanitizes username, dedupes with counter, `ON CONFLICT DO NOTHING`, never blocks signup (`EXCEPTION WHEN OTHERS`), `search_path=public`. |
| `increment_legacy_score(p_user_id, p_amount)` | RPC | Atomic add to `legacy_score` (lore points). |
| `increment_node_visit(p_user_id, p_district_id, p_node_type, p_node_id)` | RPC | Inserts visit row (idempotent), increments district counter **only on first visit**; rejects acting for another user. |
| `update_legacy_score()` + `on_capture_update_score` | trigger | On `user_captures` INSERT: adds figure's `legacy_pts` + `archive_count += 1`. |

### Row Level Security
- Public SELECT on catalogs: `profiles`, `districts`, `figures`, `artifacts`, `lore_nodes` (active), `quiz_questions`.
- Owner-only (`auth.uid() = user_id`) on: `user_districts`, `user_captures`, `user_artifacts`, `notifications`, `user_lore`, `user_support_node_visits`.
- `profiles`: public read, own INSERT/UPDATE.

### Seed data
- **Districts (12 total):** schema seeds 5 (rattanakosin, silom, sukhumvit, chatuchak, ladphrao); `patch_district_seed.sql` adds 7 more (dusit, pathumwan, watthana, bang_kapi, phra_khanong, bang_na, nonthaburi) to match `map.js`.
- **Figures (7):** king-taksin (S/500), rama-i (S/500), sunthon-phu (A/200), si-suriyothai (A/200), village-elder (C/50), otop-master (C/50), river-merchant (C/50).
- **Artifacts (5):** bronze-sword (legendary), old-map (rare), ceramic-bowl (common), silk-fragment (rare), temple-bell (common).
- **Lore (5 nodes):** 3 form chain `chain-rattanakosin-founding` (city wall → grand palace → Wat Pho), plus silom-trade & chatuchak-market standalone.
- **Quiz (14 questions):** 2 per figure, Thai MCQs.

---

## 8. Deploy & Security (`build.js` + `vercel.json`)

- **Build:** `node build.js` (Vercel `buildCommand`) injects `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars into `js/env.js` at deploy time; `outputDirectory: "."`, `cleanUrls: true`.
- **Security headers (all routes):** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(), microphone=()`, and a **CSP** allowing self + jsdelivr/unpkg (scripts), Google Fonts (styles/fonts), `*.supabase.co` + `wss://*.supabase.co` + Google accounts (connect/frame), `object-src 'none'`.
- `js/env.js` served `no-store` (always fresh config).
- `js/env.js` currently holds a real public anon key + URL (project `lnvpolwznueiklfgycei`). Only public anon values belong here — never service-role keys.

---

## 9. Tests (`tests/`)

Run all: `node tests/run-static.mjs`

| File | Checks |
|---|---|
| `lore-static.test.mjs` | Lore integration points |
| `remaining-static.test.mjs` | Support node, quiz, discovery, bonus, Realtime |
| `prod-readiness-static.test.mjs` | Production readiness docs/config |
| `district-seed-static.test.mjs` | SQL seed ↔ `map.js` district parity |
| `env-policy-static.test.mjs` | Public anon env policy |
| `grid-fog-static.test.mjs` | `window.FogGrid` helper |
| `run-static.mjs` | One-command runner |

---

## 10. Docs & assets

| Path | Contents |
|---|---|
| `README.md` | Full public overview (note: stale theme values) |
| `CLAUDE.md` | Claude Code project guide / conventions |
| `AGENTS.md` | Agent workflow (RTK required) |
| `system_architect.md` | Architecture notes |
| `docs/dev-plan.md` | Phase 1 plan + done/remaining checklist |
| `docs/progress.md` | Implementation status |
| `docs/CODING_INSTRUCTIONS.md` | Design system + component patterns |
| `docs/production-smoke.md` | Supabase/Vercel smoke-test checklist |
| `docs/dev-plan-prompt.xml` | Planning prompt history |
| `docs/proposal/tam_roi_nsc_proposal.md` | Formal NSC 2026 proposal (Thai) |
| `ตามรอย_NSC_2026_Primary1.pdf` | NSC submission PDF |

---

## 11. Roadmap (post-MVP)

- **Phase 1 — Web MVP** ✅ done (remaining: full Thailand district coverage).
- **Phase 2 — Mobile** *(The Immersive Leap)*: React Native + Expo, ARKit/ARCore AR capture, background GPS push, QR scanning at outposts, offline map caching, FCM/APNs.
- **Phase 3 — Co-Op** *(Social Layer)*: multiplayer raid encounters, district leaderboards, artifact trading, clan/party (Supabase Realtime + Socket.io).
- **Phase 4 — Seasonal** *(Live Service)*: rotating story seasons, era filter (Sukhothai/Ayutthaya/Rattanakosin/Modern), limited-time figures, CMS + expandable geography.
- **Phase 5 — Business**: film-studio tie-ins, certified brand outposts, TAT/B2G sponsorship, green-transport XP, cosmetic season pass (no pay-to-win).

---

## Quick reference — "where is X?"

- **Theme tokens** → `css/variables.css`  ·  **Layout/nav** → `css/layout.css`
- **All DB/Auth calls** → `js/supabase-client.js` (`window.DB`)
- **Map / fog / GPS / quiz / capture** → `js/map.js`
- **Schema + seed** → `supabase/schema.sql`  ·  **lore/quiz/triggers** → `supabase/patch_lore.sql`  ·  **auth hardening** → `supabase/patch_auth_fix.sql`  ·  **extra districts** → `supabase/patch_district_seed.sql`
- **Env injection / headers** → `build.js`, `vercel.json`  ·  **Public config** → `js/env.js`
- **Tabs/pages** → `index.html`, `login.html`, `onboarding.html`, `app.html`
</content>
</invoke>
