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
| GPS Lore proximity trigger + unlock flow | `js/map.js` | Mock + Supabase-backed lore nodes |
| Historical figures + artifacts grid with rarity tiers | `js/collection.js` | Mock data |
| Collection filter (All / S / A / C / Artifacts / Journal) + search | `js/collection.js` | Journal groups chained lore |
| Active quest steps display + daily challenges | `js/missions.js` | Mock data, no persistence |
| Leaderboard (podium + ranked list, 3 metric toggles) | `js/leaderboard.js` | Supabase Realtime profile updates |
| All Supabase DB & Auth abstraction | `js/supabase-client.js` | |
| XSS-safe `escapeHtml()` | `js/utils.js` | |
| Vercel build + env injection | `build.js` + `vercel.json` | |

### Database (Supabase)
| Item | File |
|---|---|
| Full schema (profiles, districts, figures, artifacts, leaderboard view, notifications) | `supabase/schema.sql` |
| RLS policies + auth trigger fix | `supabase/patch_auth_fix.sql` |
| Lore, quiz, and score trigger patch | `supabase/patch_lore.sql` |

---

## What's Left to Build

> Organized by the two core flowcharts. Priority order: **Critical → High → Medium → Low**

---

### FLOWCHART 1 — District Encounter Loop
`เดินทางไปยังอำเภอ → Watchtower Check-in → Fog clears → Encounter`

#### Critical (core loop is broken without these)

- [x] **Fog clearing persistence** — `user_districts` rows are re-read before map render, so cleared holes survive refresh.

- [ ] **Support Node visit tracking** — `user_districts` table has `cafes_visited`, `otops_visited`, `landmarks_visited` columns but they are never incremented. When user taps a café/OTOP/landmark node info card and confirms a visit, call `DB.Districts.updateNodeVisit(userId, districtId, nodeType)`.

- [ ] **Support Node completion gate** — before showing the Legendary Encounter option, check `cafes_visited >= 2 && otops_visited >= 1 && landmarks_visited >= 3` in the district's `user_districts` row. Show a locked state with progress bars if not complete (mirrors the decision diamond in Flowchart 1).

- [ ] **C-Class figure basic quiz modal** — when a C-Class figure node is tapped: show a 1-question quiz bottom sheet (question + 4 options). On correct answer → call `DB.Figures.capture(userId, figureId)` → award legacy points → show capture success screen.

#### High

- [ ] **Legendary figure encounter flow** — once Support Nodes are complete for a district, activate the Encounter button. Show a "Master Quiz" or multi-step challenge sheet. On completion → `DB.Figures.capture()` for the S-Class figure → award legacy points.

- [x] **Legacy Points backend persistence** — `supabase/patch_lore.sql` adds `on_capture_update_score`; `DB.Figures.capture()` no longer writes score client-side.

- [ ] **Map discovery % real calculation** — compute `(user_districts with fogged=false) / (total districts)` from Supabase instead of the hardcoded mock percentage shown in the stats bar.

#### Medium

- [ ] **Collection update after capture** — after a successful capture call, re-fetch `user_captures` and re-render the collection grid without a full page reload so the newly captured figure shows its green ribbon.

- [x] **Leaderboard refresh after events** — leaderboard subscribes to profile updates via `DB.Leaderboard.subscribe()` and patches/re-sorts rows.

- [ ] **BTS/MRT transport bonus** — detect if the user checked in while near a BTS/MRT station polygon (add station polygons to map data) and apply ×2 points multiplier before writing to `profiles.legacy_score`.

---

### FLOWCHART 2 — Lore/Proximity Loop
`เดินสำรวจพื้นที่ → GPS range check → ปลดล็อค Lore → Lore Journal → Lore Points`

#### High

- [x] **GPS proximity trigger for lore nodes** — in `MapModule`, each GPS update checks `radius_m`; new lore opens the unlock sheet.

- [x] **Lore unlock UI** — bottom sheet displays title, narrative, optional image/audio, Save button, and point badge.

- [x] **Lore Journal persistence** — `user_lore` table and `DB.Lore.unlock()` persist entries; Collection has a Journal filter.

- [x] **Lore Points** — lore unlocks call `DB.Profiles.addLegacyPoints()` after `user_lore` insert.

#### Medium

- [x] **Rich lore content types** — lore sheet supports `text`, lazy image, and audio play/pause rendering.

---

### General / Infrastructure

#### Done

- [x] **GPS tolerance radius** — Watchtower check-in validates 500m Haversine distance outside localhost.
- [x] **Quiz questions table** — `quiz_questions` table, public read policy, seed questions, and `DB.Quiz.getForFigure()`.

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
