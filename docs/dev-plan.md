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
| Support Node visit tracking + Encounter gate | `js/map.js` | DB RPC with persistent per-node dedupe and local fallback |
| C-Class quiz + Legendary Master Quiz | `js/map.js` | Uses `DB.Quiz.getForFigure()` |
| GPS Lore proximity trigger + unlock flow | `js/map.js` | Mock + Supabase-backed lore nodes |
| Historical figures + artifacts grid with rarity tiers | `js/collection.js` | Supabase with local fallback; modal backdrop cleanup fixed |
| Collection filter (All / S / A / C / Artifacts / Journal) + search | `js/collection.js` | Journal groups chained lore |
| Collection capture refresh | `js/collection.js` | `markCaptured()` updates affected grid state |
| Active quest steps display + daily challenges | `js/missions.js` | Mock data, no persistence |
| Leaderboard (podium + ranked list, 3 metric toggles) | `js/leaderboard.js` | DB-backed `leaderboard_legacy` data + Supabase Realtime profile updates |
| Real-time notification inserts | `js/app.js` + `js/supabase-client.js` | Badge/offcanvas update |
| All Supabase DB & Auth abstraction | `js/supabase-client.js` | |
| XSS-safe `escapeHtml()` | `js/utils.js` | |
| Vercel build + env injection | `build.js` + `vercel.json` | |
| Thailand grid Fog helper | `js/fog-grid.js` | Reusable helper retained; old `/demo` screenshot page removed |

### Database (Supabase)
| Item | File |
|---|---|
| Full schema (profiles, districts, figures, artifacts, leaderboard view, notifications) | `supabase/schema.sql` |
| RLS policies + auth trigger fix | `supabase/patch_auth_fix.sql` |
| Lore, quiz, and score trigger patch | `supabase/patch_lore.sql` |
| MVP district seed parity patch | `supabase/patch_district_seed.sql` |

---

## What's Left to Build

> Organized by the two core flowcharts. Priority order: **Critical → High → Medium → Low**

---

### FLOWCHART 1 — District Encounter Loop
`เดินทางไปยังอำเภอ → Watchtower Check-in → Fog clears → Encounter`

#### Critical (core loop is broken without these)

- [x] **Fog clearing persistence** — `user_districts` rows are re-read before map render, so cleared holes survive refresh.

- [x] **Support Node visit tracking** — node Visit button calls `DB.Districts.updateNodeVisit(userId, districtId, nodeType, nodeId)`, persists exact node IDs, and disables after persisted/session visit.

- [x] **Support Node completion gate** — Watchtower sheet shows progress bars while locked and Encounter button when complete.

- [x] **C-Class figure basic quiz modal** — C-Class figure nodes show 1-question quiz; correct answer captures via `DB.Figures.capture()`.

#### High

- [x] **Legendary figure encounter flow** — once Support Nodes are complete, Encounter opens a 3-question Master Quiz and captures the S-Class figure.

- [x] **Legacy Points backend persistence** — `supabase/patch_lore.sql` adds `on_capture_update_score`; `DB.Figures.capture()` no longer writes score client-side.

- [x] **Map discovery % real calculation** — computes cleared/active districts via `DB.Districts.getDiscoveryPercent()` with mock fallback.

#### Medium

- [x] **Collection update after capture** — `CollectionModule.markCaptured()` updates captured state and re-renders the grid.

- [x] **Leaderboard refresh after events** — leaderboard subscribes to profile updates via `DB.Leaderboard.subscribe()` and patches/re-sorts rows.
- [x] **Leaderboard DB data only** — leaderboard reads `leaderboard_legacy` and shows empty/error UI instead of mock rankings.
- [x] **Collection figure modal backdrop cleanup** — figure detail modal reuses Bootstrap instance and clears stale modal state after close.

- [x] **BTS/MRT transport bonus** — seeded station radius checks apply x2 point multiplier; full station polygons remain future data polish.

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
- [x] **Realtime notifications** — `DB.Notifications.subscribe()` listens for inserts and updates badge/offcanvas.
- [x] **Persistent Support Node visits** — `user_support_node_visits` stores one row per `(user_id, node_id)`, and `increment_node_visit` increments counters only on first visit.
- [x] **Project structure cleanup** — planning/proposal/support docs live under `docs/`; runnable static app files remain at repo root.
- [x] **Grid Fog helper retained** — `window.FogGrid` creates stable Thailand grid cells; old `/demo` route removed.

#### Medium

- [ ] **Full Thailand district coverage** — MVP Bangkok/Nonthaburi DB seed parity exists in `supabase/patch_district_seed.sql`; national coverage still needs curated production polygons/content.

- [x] **Email verification (production)** — signup now sets `emailRedirectTo` back to `login.html`; Supabase Dashboard must still enable confirmation during deploy.

#### Low

- [x] **Vercel production smoke test checklist** — see `production-smoke.md`; actual deploy walk-through still requires Vercel/Supabase environment access.

- [x] **Real-time notifications** — `DB.Notifications.get()` loads rows and `DB.Notifications.subscribe()` pushes inserts into the UI.

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

Week 4 — Polish
  12. BTS/MRT bonus
  13. Rich lore content (image/audio)
  14. Email verify re-enable
  15. Vercel production smoke test
  16. Grid Fog helper retained; /demo route removed
```

---

## Phase 2+ (Post-NSC Roadmap)
See [README.md](../README.md) and [progress.md](progress.md) for Phases 2–5 (native mobile, co-op raids, seasonal content, business partnerships).
