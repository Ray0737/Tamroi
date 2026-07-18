# Tamroi System Architecture

> Phase 1 Web MVP architecture for Tamroi (ตามรอย), NSC 2026.
> Extended 2026-07-12 to cover Phase 3 Co-op + educational-feature modules (originally Phase-1-only). For full module/function status see `docs/ALL_FUNCTIONS.md`; for a snapshot with completion/security notes see `docs/PROJECT_SUMMARY_CODE.md`.

## Architecture Summary

Tamroi is a zero-tooling static web application backed by Supabase. The Phase 1 MVP runs as classic browser scripts loaded directly by HTML pages, with no React, no bundler, no npm workflow, and no client-side build pipeline.

The system is intentionally simple:

- Static HTML/CSS/JS files are served from Vercel or a local static server.
- Browser modules expose stable global APIs on `window`.
- Supabase Auth, PostgreSQL, Row Level Security, RPC functions, and Realtime provide backend behavior.
- MapLibre GL JS renders the exploration map (45° tilted camera), district Watchtowers, support nodes, Lore nodes, GPS state, and Fog of War overlays.
- Local fallback state keeps the prototype usable when Supabase or GPS is unavailable.

## Runtime Topology

```text
Browser
  |
  | static files
  v
Vercel / local static server
  |
  | Supabase JS v2 anon client
  v
Supabase
  |-- Auth
  |-- PostgreSQL tables and views
  |-- Row Level Security policies
  |-- RPC functions
  |-- Realtime subscriptions
```

## Page Architecture

| Page | Role | Main Dependencies |
|---|---|---|
| `index.html` | Splash / landing page and session redirect handling | `env.js`, `config.js`, `supabase-client.js` |
| `login.html` | Email/password login, registration, Google OAuth | `env.js`, `config.js`, `supabase-client.js`, Bootstrap |
| `onboarding.html` | First-run location permission and home district picker | `env.js`, `config.js`, `supabase-client.js`, localStorage |
| `app.html` | Main authenticated app shell with Map, Collection, Missions, Leaderboard | All app CSS, MapLibre GL, Bootstrap, `app.js`, feature modules |

`app.html` is the primary runtime shell. It owns the mobile frame, top bar, bottom navigation, tab containers, Bootstrap offcanvas panels, custom bottom sheets, map container, and shared modal surfaces.

## Script Loading Contract

Scripts are classic browser scripts, so load order is part of the architecture:

```text
js/env.js
js/config.js
js/utils.js                app.html only where dynamic HTML helpers are needed
Supabase JS CDN
js/supabase-client.js
MapLibre GL JS CDN         app.html only
Bootstrap bundle CDN
js/app.js
js/map.js
js/fog-grid.js
js/collection.js
js/missions.js
js/leaderboard.js
js/guild.js                Phase 3
js/coop.js                 Phase 3
js/raid.js                 Phase 3
js/discussion.js           Phase 3
js/community-forum.js      Phase 3
js/debates.js              Educational features
js/figure-graph.js         Educational features
```

Do not replace this with ES module imports during Phase 1. Feature modules communicate through globals such as `window.DB`, `window.AppCore`, `window.MapModule`, and `window.FogGrid`.

## Frontend Module Boundaries

| Module | Ownership |
|---|---|
| `js/config.js` | Converts `window.ENV` into `window.APP_CONFIG` |
| `js/utils.js` | Shared escaping helper for dynamic HTML |
| `js/supabase-client.js` | Only approved Supabase access boundary; exposes `window.DB` |
| `js/app.js` | Auth guard, boot state, profile state, navigation, sheets, toast, notifications, shared app API |
| `js/map.js` | MapLibre GL map (45° tilt), districts, Watchtowers, Fog of War, GPS, support nodes, Lore proximity, quiz/capture entry points |
| `js/fog-grid.js` | Reusable Thailand grid cell helper exposed as `window.FogGrid` |
| `js/collection.js` | Captured figures, artifacts, figure detail modal, Lore Journal, figure bio + relation graph launch |
| `js/missions.js` | Active mission and daily challenge rendering |
| `js/leaderboard.js` | DB-backed leaderboard, podium, metric tabs, Realtime refresh |
| `js/guild.js` | Guild CRUD, Presence, guild fog overlay, guild leaderboard |
| `js/coop.js` | Collaborative missions, Jigsaw v2 (GPS checkpoint + timeline merge) |
| `js/raid.js` | Raid lobby, Presence, Broadcast quiz sync, host failover |
| `js/discussion.js` | Per-figure comment threads, auto-flag-hide |
| `js/community-forum.js` | General forum feed, likes, replies, new-account posting probation |
| `js/debates.js` | Unsolved History debate voting + aggregate stats |
| `js/figure-graph.js` | `FigureGraphModule` — SVG pan/zoom/drag relationship graph overlay |

Feature modules should not call Supabase directly. They call `window.DB` and let `js/supabase-client.js` handle table names, RPC calls, and error behavior.

## Backend Boundary

`window.DB` is the browser-facing backend facade:

| Namespace | Purpose |
|---|---|
| `DB.Auth` | Session, user, sign in, sign up, Google OAuth, sign out |
| `DB.Profiles` | Profile read/update, Google profile upsert, lore score increment |
| `DB.Districts` | District catalog, user district state, Watchtower check-in, support-node visits, discovery percentage |
| `DB.Figures` | Figure catalog and user captures |
| `DB.Artifacts` | Artifact catalog and user artifact ownership |
| `DB.Leaderboard` | `leaderboard_legacy` view reads and profile Realtime subscription |
| `DB.Lore` | Lore catalog, unlocked Lore reads, Lore unlock writes, pre/post-test assessments, recall questions |
| `DB.Quiz` | Figure quiz question reads |
| `DB.Notifications` | Notification reads and Realtime insert subscription |
| `DB.Missions` | Daily challenges, active mission, recall missions |
| `DB.Coop` | Guilds, join requests, Presence, collab missions, Jigsaw v2 |
| `DB.Raid` | Raid sessions, Broadcast, Presence, capture insertion |
| `DB.Discussion` | Per-figure comment threads + flags |
| `DB.Community` | Forum posts, likes, flags |
| `DB.Debates` | Unsolved History debate prompts, votes, aggregate stats RPC |

All browser writes use the public anon client and must remain compatible with RLS. Service-role keys do not belong in this application.

## Data Model Overview

Core tables and objects:

| Object | Role |
|---|---|
| `profiles` | Player profile, username, avatar URL, Legacy Score |
| `districts` | Active district catalog, map metadata, Watchtower location |
| `user_districts` | Per-user district state, fog state, check-in timestamp, support counters |
| `figures` | Historical figure catalog and class metadata |
| `user_captures` | Captured figures per user; DB trigger updates Legacy Score |
| `artifacts` | Artifact catalog |
| `user_artifacts` | Artifact ownership per user |
| `lore_nodes` | GPS-triggered lore points, radius, content, optional chain metadata |
| `user_lore` | Per-user unlocked Lore nodes |
| `user_support_node_visits` | Exact support-node visit dedupe by `(user_id, node_id)` |
| `quiz_questions` | Figure-specific quiz questions |
| `notifications` | User notification rows consumed by the offcanvas UI |
| `leaderboard_legacy` | Read model for the High Chronicler leaderboard |

Key SQL patches:

- `supabase/schema.sql` creates the base schema, views, seeds, and RLS policies.
- `supabase/patch_auth_fix.sql` fixes auth profile creation and insert policy behavior.
- `supabase/patch_lore.sql` adds Lore, quiz, support-node visit persistence, scoring RPC/trigger behavior, and seed content.
- `supabase/patch_district_seed.sql` brings MVP district seeds in line with the map data.

## Primary Runtime Flows

### Auth And First Run

```text
User opens app
  -> index.html checks existing Supabase session
  -> unauthenticated user goes to login.html
  -> login/register/Google OAuth creates or resumes session
  -> onboarding.html requests location permission and stores tam_roi_home
  -> app.html runs auth guard in app.js
```

`app.js` owns the authenticated `App.user` and `App.profile` state exposed through `window.AppCore`.

### Watchtower And Fog Clearing

```text
Map loads
  -> MapModule initializes MapLibre GL (45° tilt) and local district data
  -> DB.Districts.getUserState(userId) loads persisted cleared districts
  -> fog polygon renders with punched holes for cleared districts
  -> player taps Watchtower check-in
  -> GPS distance is validated outside localhost
  -> DB.Districts.checkIn(userId, districtId) upserts user_districts
  -> map redraws fog and discovery percentage
```

The map currently uses MVP Bangkok/Nonthaburi district data. `window.FogGrid` exists for future Thailand-wide cell-based Fog of War.

### Support Node Gate

```text
Cleared district reveals nodes
  -> player taps cafe / OTOP / landmark support node
  -> node card opens
  -> Visit button calls DB.Districts.updateNodeVisit(...)
  -> Supabase RPC records exact node visit and increments support counter idempotently
  -> Legendary encounter unlocks when district counters meet requirements
```

Support progress gates S/A-Class encounters. It does not block the Watchtower fog check-in itself.

### Quiz And Capture

```text
Player opens figure encounter
  -> DB.Quiz.getForFigure(figureId, count) loads questions
  -> C-Class uses one question
  -> S/A-Class uses Master Quiz flow
  -> correct completion calls DB.Figures.capture(...)
  -> user_captures insert triggers score update in DB
  -> Collection and Leaderboard refresh
```

Capture scoring should remain DB-triggered. Client-side score increments are reserved for Lore points and Lore chain bonuses.

### GPS Lore

```text
navigator.geolocation.watchPosition emits location
  -> map updates player dot and accuracy ring
  -> MapModule checks nearby lore_nodes with Haversine distance
  -> entering radius opens Lore sheet
  -> Save/unlock calls DB.Lore.unlock(...)
  -> DB.Profiles.addLegacyPoints(...) awards lore points
  -> unlocked Lore appears in Collection Journal and as map icons
```

GPS failures should degrade silently. The app remains usable without live location.

### Leaderboard And Notifications

```text
Leaderboard tab
  -> DB.Leaderboard.getLegacy() reads leaderboard_legacy
  -> DB.Leaderboard.subscribe(...) refreshes on profile changes

Notifications
  -> DB.Notifications.list(userId) renders offcanvas rows
  -> DB.Notifications.subscribe(userId, callback) updates badge and panel on inserts
```

The leaderboard uses real DB data and should not fall back to fake rankings.

## State Ownership

| State | Owner | Persistence |
|---|---|---|
| Supabase session | Supabase Auth client | Supabase browser auth storage |
| Current app user/profile | `js/app.js` | Runtime, refreshed from Supabase |
| Home district | onboarding/app home picker | `localStorage.tam_roi_home` |
| Cleared districts | `js/map.js` through `DB.Districts` | `user_districts`, local fallback for demo/offline |
| Support-node visits | `js/map.js` through `DB.Districts` | `user_support_node_visits`, local fallback for demo/offline |
| Lore unlocks | `js/map.js` / `js/collection.js` through `DB.Lore` | `user_lore`, local fallback key `tam_roi_lore_unlocked` |
| Captures | `js/map.js` / `js/collection.js` through `DB.Figures` | `user_captures` |
| Leaderboard | `js/leaderboard.js` | `leaderboard_legacy` view and Realtime |

## Security Architecture

- Client code only uses the Supabase anon key.
- Private keys, service-role keys, `.env` secrets, and production-only tokens are forbidden in client files.
- Supabase RLS must enforce user-owned writes for profile progress, captures, artifacts, Lore, support visits, and notifications.
- Dynamic HTML must use `escapeHtml()` or safe DOM APIs.
- Avatar and external URLs must be validated before insertion into DOM attributes.
- Vercel security headers in `vercel.json` define CSP, frame, permissions, and HSTS behavior.

## Deployment Architecture

Local development:

```text
repo root
  -> VS Code Live Server or another simple static server
  -> js/env.js supplies public Supabase URL and anon key
```

Vercel production:

```text
Vercel build
  -> build.js reads SUPABASE_URL and SUPABASE_ANON_KEY
  -> build.js writes js/env.js
  -> static assets are served with vercel.json headers
```

There is no local install step for normal development.

## Architectural Constraints

- Keep Phase 1 zero-tooling: no React, TypeScript, Vite, webpack, npm packages, or lockfiles.
- Keep the centered mobile web frame with max width `430px`.
- Keep Supabase access centralized in `js/supabase-client.js`.
- Keep scripts compatible with classic global loading.
- Prefer CSS variables from `css/variables.css` over hardcoded colors.
- Keep GPS and Supabase failures non-fatal for demo usability.
- Use DB-backed leaderboard data only.

## Feature Entry Points (Raid, Debate, Jigsaw)

These three are easy to miss because each is conditionally rendered — nothing shows unless its prerequisites are met.

- **Raid** — Tap a `raid_only` figure's ⚔️ marker on the Map tab. `_startRaidEncounter(figure)` (`js/map.js`) checks `RaidModule.canStartRaid(figure)` (needs ≥ `figure.raid_min_players` online guild members, else toasts an error), then calls `RaidModule.openRaidModal(figure)` directly — raid-only figures skip the normal quiz/legendary-encounter branches entirely.
- **Historical Debate** — Only appears in the figure bio modal's footer (`#figure-modal`, opened from a Collection card) if the figure is already captured **and** `DB.Debates.getForFigure(figureId)` resolves a seeded debate row. No seeded debate = no button. Tapping it calls `DebateModule.open(figureId)` (`js/collection.js`).
- **Jigsaw** — Lives in the Mission tab's co-op missions container, rendered by `CoopModule.load()`/`_liveLoad()`. Requires guild membership and an active `collab_missions` row with `type === 'jigsaw'`. The first member/leader to view it with ≥2 guild members triggers `DB.Coop.assignJigsawChapters`; others see a "waiting for leader" state until then. Each member submits via `CoopModule.postJigsawSummary`; the merge/reorder phase unlocks once all chapters are in.

## Future Architecture Notes

- Full Thailand district coverage should extend the current MVP district seed strategy without changing the browser module architecture.
- `window.FogGrid` is the bridge toward a national grid-cell Fog of War model.
- Phase 2 native mobile work can reuse the Supabase data model, but the web MVP should not be migrated to a framework during Phase 1.
- More advanced content operations may eventually need a CMS or admin tool, but this repo currently treats SQL seeds and patches as the source of truth.
