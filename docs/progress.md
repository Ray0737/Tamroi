# Tamroi — Implementation Progress

> Last updated: 2026-07-12

---

## Phase 1 — Web MVP (Complete)

| Feature | Status | Notes |
|---|---|---|
| Auth (Email + Google OAuth) | ✅ Done | login.html, supabase-client.js |
| Map + MapLibre GL (45° tilt) | ✅ Done | js/map.js, CartoDB Light raster tiles |
| Fog of War | ✅ Done | fog-grid.js, `user_districts` table |
| Watchtower check-in (GPS) | ✅ Done | 500 m Haversine, localhost bypass |
| Figure collection grid | ✅ Done | js/collection.js |
| Support Node chain (C/S/A gate) | ✅ Done | `user_support_node_visits` table |
| Lore system (GPS proximity) | ✅ Done | `lore_nodes`, `user_lore` tables |
| Lore journal + chain complete | ✅ Done | Collection tab, chain-sheet |
| Master quiz (S/A tier) | ✅ Done | `quiz_questions`, 3-question flow |
| Leaderboard + Realtime | ✅ Done | `leaderboard_legacy` view, Supabase Realtime |
| Notifications (Realtime) | ✅ Done | `notifications` table, offcanvas |
| Daily challenges | ✅ Done | `daily_challenges`, `user_daily_progress` |
| Seasonal events | ✅ Done | Date-range multipliers in missions.js |

### DB Patches Applied

| Patch | Purpose |
|---|---|
| `supabase/schema.sql` | Full base schema + Bangkok district seed |
| `supabase/patch_auth_fix.sql` | Auth trigger fix + RLS INSERT policy |
| `supabase/patch_lore.sql` | Lore/support-node visit/quiz tables + score trigger |
| `supabase/patch_district_seed.sql` | MVP district seed parity with map.js |

---

## Phase 3 — Co-op Mode (Complete — 2026-06-28)

| Feature | Status | Notes |
|---|---|---|
| Guild system (create/join/kick/leave) | ✅ Done | js/guild.js, `guilds`, `guild_members` tables |
| Guild invite code (6-char auto-gen) | ✅ Done | DB trigger `on_guild_insert_code` |
| Guild Presence (online members) | ✅ Done | Supabase Presence `presence:guild:{id}` |
| Guild leaderboard tab | ✅ Done | `guild_leaderboard` VIEW, leaderboard.js toggle |
| Collaborative missions | ✅ Done | js/coop.js, `collab_missions`, `collab_mission_checkins` — re-enabled 2026-07-09 alongside Jigsaw v2 |
| Real-time mission progress bar | ✅ Done | `subscribeMissionProgress` postgres_changes |
| Threshold trigger (auto-complete) | ✅ Done | `on_collab_checkin_threshold` trigger |
| Raid encounters (Broadcast quiz) | ✅ Done | js/raid.js, `raid_sessions`, `raid_session_members` |
| Raid lobby + Presence | ✅ Done | Supabase Presence `presence:raid:{id}` |
| Host failover | ✅ Done | Earliest `joined_at` among connected members |
| Discussion threads (1-level) | ✅ Done | js/discussion.js, `figure_discussions` |
| Auto-flag at 3 reports | ✅ Done | `on_discussion_flag_count` trigger |

### DB Patches Applied (Phase 3)

| Patch | Purpose |
|---|---|
| `supabase/patch_coop.sql` | Phase 3 base: guilds, raids, discussions, triggers, views, RLS |
| `supabase/patch_coop_fix.sql` | `guild_join_requests` table + RLS; split notification INSERT policy |
| `supabase/patch_group_management.sql` | `guilds.announcement` column |
| `supabase/patch_notifications_rls.sql` | Allow cross-user notification inserts (join request alerts) |
| `supabase/patch_community.sql` | `community_posts` table + RLS + flag trigger |
| `supabase/patch_community_likes.sql` | `community_post_likes` table + RLS |
| `supabase/patch_guild_leader_rls.sql` | Lets non-members see who a guild's leader is (join-request notify) |
| `supabase/patch_notification_ref.sql` | `notifications.ref_id` column — links a notif to its source row |

---

## Post-Phase-3 Additions (2026-07-01)

| Feature | Status | Notes |
|---|---|---|
| Guild fog overlay on map | ✅ Done | `MapModule.renderGuildFog()` + `DB.Coop.getGuildClearedDistrictIds()` wired in `GuildModule.init()` |
| Guild join request flow | ✅ Done | Search → request → leader approve/reject; `guild_join_requests` table |
| Guild announcements | ✅ Done | `guilds.announcement` column; shown in guild hub + find-group cards |
| Find Group panel | ✅ Done | Search by name, shows member count + score; `DB.Coop.searchGuilds()` |
| Guild management overhaul | ✅ Done | Transfer leadership, edit name/announcement, pending requests list |
| Community forum | ✅ Done | `js/community-forum.js` · `community_posts` + `community_post_likes` · likes + replies + flag |
| Class-tiered capture animation | ✅ Done | CSS reveal animation varies by figure class (C/B/A/S) |
| Themed dialogs | ✅ Done | Native `confirm`/`alert` replaced with styled modals throughout |
| Leaderboard filter dropdowns | ✅ Done | Replaced filter pills with `<select>` dropdowns |
| Actionable join-request notification | ✅ Done | Notification tab shows Accept/Ignore buttons on `join_request` notifs (via `ref_id`); stays unread until acted on |
| Guild leaderboard realtime | ✅ Done | `subscribeGuildChanges()` on guilds + guild_members tables |
| Seven full UI restyling concept sets | ✅ Done | `restyling/` contains seven visual directions with seven user-facing states and comparison boards per direction |
| Bangkok Street Quest login restyle (Task 6) | ✅ Done | `login.html` now uses a parchment explorer-pass card, dark stamp logo treatment, and decorative explorer stickers |
| Bangkok Street Quest full runtime theme | ✅ Done | Generated Bangkok collage/route artwork plus `css/street-quest.css` theme landing, auth, onboarding, map, collection, missions, and community; all ten 430px reference screenshots were browser-captured and refreshed |
| Bangkok Street Quest texture + spacing QA | ✅ Done | Generated cream/ink/map/kraft UI materials plus dedicated Collection archive-collage and Community podium-collage artwork replace flat panels; Collection now uses an ink archive, torn toolbox, and poster cards; Community uses a three-poster hero, MY RANK ticket, dark leaderboard/group ledgers, and parchment forum; MapLibre keeps the illustrated route map visible until Carto tiles load; ten 430px captures include populated My Group and Forum states, with automated 375px/430px overflow checks |

---

## Educational Features + Content Safety (2026-07-02 → 07-04)

| Feature | Status | Notes |
|---|---|---|
| Retrieval Practice (spaced recall) | ✅ Done | `patch_retrieval_practice.sql` · recall mission 3 days after lore read |
| Unsolved History debates | ✅ Done | js/debates.js · `history_debates`, `debate_votes`, stats RPC |
| Jigsaw Learning v2 (GPS checkpoint + timeline merge) | ✅ Done | `patch_jigsaw_v2.sql` · GPS-gated visit + recall quiz gate + structured summary + drag-to-reorder merge vote, server-side reward trigger |
| Lore pre/post-test | ✅ Done | `patch_prepost.sql` · `user_lore_assessments`, per-phase scores |
| Review-status enforcement | ✅ Done | `patch_review_status.sql` · client filters `review_status = 'approved'` |
| Forum probation + PDPA consent | ✅ Done | `patch_child_safety.sql` · new-account post hold, age consent at onboarding |
| Raid figure ⚔️ icon + raid-only gate | ✅ Done | Was a deferred gap; raid figures no longer solo-capturable |
| Raid notification deep-link | ✅ Done | Was a deferred gap; notification opens the raid lobby |
| Rama-line kings removed from pool | ✅ Done | `patch_remove_all_rama.sql` (two earlier attempts had silently failed) |

## Map & Capture Overhaul (2026-07-04 → 07-05)

| Feature | Status | Notes |
|---|---|---|
| Light-theme map | ✅ Done | White CartoDB tiles, darker fog, adapted marker/UI colors |
| Walk-cell fog reveal | ✅ Done | FogGrid cells revealed by walking; gated on GPS accuracy ≤100m; localStorage-only (per-device) |
| Fog rebuild fixes | ✅ Done | Thailand-bbox outer ring; walk cells no longer cancel cleared district holes (bbox intersection) |
| Encounter Key | ✅ Done | `patch_encounter_key.sql` · watchtower check-in gates A-tier encounters |
| C-Class proximity capture | ✅ Done | 80m circle, fog-visible markers, tap-to-capture sheet; `patch_c_class_proximity.sql` (fig-c-21/22 + fig-c-14 coords) |
| Captured figures hidden at init | ✅ Done | Map fetches user captures in `loadDistrictData` |
| Lore unlock persistence fix | ✅ Done | `user_lore` upsert used wrong column name (`lore_id` → `lore_node_id`); writes silently failed since launch |
| Figure cameo on chain completion | ✅ Done | Linked figure + speech bubble in the chain-complete sheet |
| Settings overhaul | ✅ Done | Edit username, notifications toggle, GPS permission status, home district picker, profile picture |

| Figure Biography + Relation Graph | ✅ Done | `patch_figure_bio.sql` · `figure_relations` table · extended figure modal (bio_th, birth/death year, relation chips, related lore, related locations) · `FigureGraphModule` SVG canvas with pan/zoom/drag/focus animations · `MapModule.flyToLocation` |

### UI Polish — 2026-07-12

| Change | Files |
|---|---|
| Collection filter | ✅ Done | Exclusive Thai pills (ทั้งหมด/ที่มี/บุคคล/ของสะสม/บันทึก) with proper single-select active state |
| Collection figure/class filters | ✅ Done | Added บุคคล view button and S/A/B/C class dropdown; class filtering is available only in figure views and disabled for artifacts/journal |
| Collection filter visual polish | ✅ Done | Added scrapbook paper texture, ink offset shadows, pressed active states, focus/hover motion, and dashed disabled styling |
| Collection class menu restyle | ✅ Done | Replaced the native class `<select>` popup with an accessible custom S/A/B/C menu so the open list inherits the scrapbook theme |
| Collection class menu clipping fix | ✅ Done | Temporarily disables the toolbox torn-edge clip while the class menu is open so every class option, including C, remains visible |
| Collection locked-figure icon visibility | ✅ Done | Enlarged the lock and added a high-contrast circular backing so phase-locked figures remain legible over portraits |
| Collection stat labels aligned with Map (Captured/Artifacts/Legacy) and summary height tightened | `app.html`, `js/collection.js`, `css/street-quest.css` |
| Collection archive hero updated to Thailand-wide labels (`TH`, `แฟ้มสะสม`, `EXPLORE THAILAND`) | `app.html` |
| Community hero: removed ชุมชนนักล่ารอย subtitle; rank "2" moved below title | `app.html`, `css/street-quest.css` |
| Community leaderboard control deck restyle: numbered route tabs plus labeled paper selector cards with accessible active states | `app.html`, `js/app.js`, `css/street-quest.css` |
| Community leaderboard menu layering and frame containment fix: open selector menus stay above rank cards; desktop chrome and dynamic lists stay within the 430px frame | `app.html`, `js/leaderboard.js`, `css/street-quest.css`, `css/layout.css` |
| Branding: "Bangkok Street Quest" → "Thailand Street Quest" throughout | `app.html`, `css/street-quest.css`, `CLAUDE.md` |
| Top bar: removed avatar element; removed dashed separator line | `app.html`, `css/street-quest.css` |
| Class badges (S/A/B/C): refreshed letterpress treatment with generated paper label texture, ink shadow, and slight handmade skew | `css/components.css`, `assets/street-quest/badge-class-*.png`, `assets/street-quest/class-label-paper.png` |
| Removed stale empty top-bar profile chip after avatar removal | `css/street-quest.css` |

### Known Gaps (Deferred)

- CoopModule GPS gate for mission checkin (currently DB-only, no distance check)
- Walk-cell fog is device-local (localStorage), not synced per account — batched-write sync planned
- Group mission cards render in two places (Mission tab + Guild panel) without shared refresh
- `figures.era` column never applied to live DB — era text always falls back to generic label

---

## Production Readiness

See `docs/production-smoke.md` for the full smoke-test checklist.
