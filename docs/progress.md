# Tamroi — Implementation Progress

> Last updated: 2026-06-28

---

## Phase 1 — Web MVP (Complete)

| Feature | Status | Notes |
|---|---|---|
| Auth (Email + Google OAuth) | ✅ Done | login.html, supabase-client.js |
| Map + Leaflet | ✅ Done | js/map.js, CartoDB Dark tiles |
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
| BTS/MRT bonus | ✅ Done | Seeded station radius data |
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
| Collaborative missions | ✅ Done | js/coop.js, `collab_missions`, `collab_mission_checkins` |
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
| `supabase/patch_coop.sql` | All Phase 3 schema: guilds, raids, discussions, triggers, views, RLS |

### Known Gaps (Deferred)

- Guild fog union polygon on Leaflet map (MapModule patch needed)
- Raid figure ⚔️ icon on map + Encounter button gate (MapModule patch needed)
- CoopModule GPS gate for mission checkin (currently DB-only, no distance check)
- Raid notification deep-link to open modal

---

## Production Readiness

See `docs/production-smoke.md` for the full smoke-test checklist.
