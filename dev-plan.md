# Tamroi — Development Plan (Phase 1 Web MVP)
> NSC 2026 · Team ปลามึกยักษ์ · Generated: 2026-05-19

---

## What's Already Done

### Pages & Shell
| Item | File |
|---|---|
| Splash / landing page | `index.html` |
| Email + Google OAuth login & register | `login.html` |
| Location permission + home district picker | `onboarding.html` |
| 4-tab app shell (Map · Collection · Missions · Leaderboard) | `app.html` |

### Design System (CSS)
| Item | File |
|---|---|
| Full design token set (colors, spacing, radii) | `css/variables.css` |
| Fixed top bar (56px) + fixed footer nav (60px) | `css/layout.css` |
| Buttons, cards, inputs, bottom sheets, badges | `css/components.css` |
| Leaflet overrides, fog layer, markers, GPS dot | `css/map.css` |
| Keyframes (blobMorph, floatY, locationPulse, etc.) | `css/animations.css` |

### JavaScript Modules
| Item | File | Notes |
|---|---|---|
| Boot, auth guard, tab navigation, toast notifications | `js/app.js` | |
| Leaflet map + Fog of War (inverted polygon) | `js/map.js` | 5+ Bangkok districts seeded |
| Live GPS tracking dot + accuracy ring | `js/map.js` | |
| Watchtower check-in bottom sheet (UI only) | `js/map.js` | DB write implemented |
| Clickable node info card (café / OTOP / landmark) | `js/map.js` | |
| Historical figures + artifacts grid with rarity tiers | `js/collection.js` | Mock data |
| Collection filter (All / S / A / C / Artifacts) + search | `js/collection.js` | |
| Active quest steps display + daily challenges | `js/missions.js` | Mock data, no persistence |
| Leaderboard (podium + ranked list, 3 metric toggles) | `js/leaderboard.js` | Mock data |
| All Supabase DB & Auth abstraction | `js/supabase-client.js` | |
| XSS-safe `escapeHtml()` | `js/utils.js` | |
| Vercel build + env injection | `build.js` + `vercel.json` | |

### Database (Supabase)
| Item | File |
|---|---|
| Full schema (profiles, districts, figures, artifacts, leaderboard view, notifications) | `supabase/schema.sql` |
| RLS policies + auth trigger fix | `supabase/patch_auth_fix.sql` |

---

## What's Left to Build

> Organized by the two core flowcharts. Priority order: **Critical → High → Medium → Low**

---

### FLOWCHART 1 — District Encounter Loop
`เดินทางไปยังอำเภอ → Watchtower Check-in → Fog clears → Encounter`

#### Critical (core loop is broken without these)

- [ ] **Fog clearing persistence** — `user_districts` row is written on check-in but not re-read on reload; fog holes disappear on refresh. Fix: call `Districts.getUserState()` in `MapModule.init()` and re-punch all previously cleared districts.

- [ ] **Support Node visit tracking** — `user_districts` table has `cafes_visited`, `otops_visited`, `landmarks_visited` columns but they are never incremented. When user taps a café/OTOP/landmark node info card and confirms a visit, call `DB.Districts.updateNodeVisit(userId, districtId, nodeType)`.

- [ ] **Support Node completion gate** — before showing the Legendary Encounter option, check `cafes_visited >= 2 && otops_visited >= 1 && landmarks_visited >= 3` in the district's `user_districts` row. Show a locked state with progress bars if not complete (mirrors the decision diamond in Flowchart 1).

- [ ] **C-Class figure basic quiz modal** — when a C-Class figure node is tapped: show a 1-question quiz bottom sheet (question + 4 options). On correct answer → call `DB.Figures.capture(userId, figureId)` → award legacy points → show capture success screen.

#### High

- [ ] **Legendary figure encounter flow** — once Support Nodes are complete for a district, activate the Encounter button. Show a "Master Quiz" or multi-step challenge sheet. On completion → `DB.Figures.capture()` for the S-Class figure → award legacy points.

- [ ] **Legacy Points backend persistence** — after every capture, update `profiles.legacy_score += points` in Supabase. Currently the score is only shown from mock data; reading from `profiles` is wired but the write is missing.

- [ ] **Map discovery % real calculation** — compute `(user_districts with fogged=false) / (total districts)` from Supabase instead of the hardcoded mock percentage shown in the stats bar.

#### Medium

- [ ] **Collection update after capture** — after a successful capture call, re-fetch `user_captures` and re-render the collection grid without a full page reload so the newly captured figure shows its green ribbon.

- [ ] **Leaderboard refresh after events** — after legacy score updates, call `LeaderboardModule.load()` to pull fresh data from the `leaderboard` view.

- [ ] **BTS/MRT transport bonus** — detect if the user checked in while near a BTS/MRT station polygon (add station polygons to map data) and apply ×2 points multiplier before writing to `profiles.legacy_score`.

---

### FLOWCHART 2 — Lore/Proximity Loop
`เดินสำรวจพื้นที่ → GPS range check → ปลดล็อค Lore → Lore Journal → Lore Points`

#### High

- [ ] **GPS proximity trigger for lore nodes** — in `MapModule`, on each GPS position update check if user is within `radius_m` of any lore node (store `lore_nodes` as a separate array with lat/lng/radius). If yes and lore not yet unlocked → fire the lore unlock sequence.

- [ ] **Lore unlock UI** — bottom sheet that displays: title, historical narrative text, and optionally image/audio. Trigger animation matching proximity reveal (fade in from map layer).

- [ ] **Lore Journal persistence** — add a `lore_journal` table (`user_id, lore_id, unlocked_at`) in Supabase. Write a row on unlock. On Collection tab, add a "Journal" section listing all discovered lore entries.

- [ ] **Lore Points** — define point value per lore node. After unlocking, add to `profiles.legacy_score` just like a figure capture.

#### Medium

- [ ] **Rich lore content types** — extend lore nodes to support `content_type` field: `text`, `image`, `audio`, `document`. Render accordingly in the lore unlock sheet (audio via `<audio>` element, image via `<img>` with lazy load).

---

### General / Infrastructure

#### Medium

- [ ] **Full Thailand district coverage** — currently only 5–12 Bangkok districts are seeded as mock polygon data in `map.js`. Seed the remaining Bangkok districts (77 provinces × N districts) via the `districts` table in Supabase and load polygons from DB instead of hardcode.

- [ ] **Email verification (production)** — currently disabled in Supabase for dev. Before NSC demo, re-enable email confirmation and test the full signup→verify→login flow.

#### Low

- [ ] **Vercel production smoke test** — deploy to Vercel, inject real `SUPABASE_URL` + `SUPABASE_ANON_KEY`, run through complete flow: sign up → onboarding → check in → capture figure → leaderboard update.

- [ ] **Real-time notifications** — currently notifications are static mock rows. Wire `DB.Notifications.get()` and subscribe to Supabase Realtime for live push (capture events, raid invites, etc.).

---

## Recommended Build Order

```
Week 1 — Fix the core loop
  1. Fog clearing persistence (reload fix)
  2. Support Node visit tracking (tap-to-visit)
  3. Support Node completion gate (lock check)
  4. C-Class quiz modal + capture write

Week 2 — Legendary path + scoring
  5. Legendary encounter flow + Master Quiz
  6. Legacy Points DB write
  7. Map discovery % from DB
  8. Collection + Leaderboard refresh after capture

Week 3 — Lore system
  9.  GPS proximity trigger
  10. Lore unlock UI
  11. Lore Journal persistence + Lore Points

Week 4 — Polish & demo prep
  12. BTS/MRT bonus
  13. Rich lore content (image/audio)
  14. Email verify re-enable
  15. Vercel production smoke test
```

---

## Phase 2+ (Post-NSC Roadmap)
See [README.md](README.md) and [progress.md](progress.md) for Phases 2–5 (native mobile, co-op raids, seasonal content, business partnerships).
