# Tamroi — Development Plan

> NSC 2026 · Team ปลามึกยักษ์

---

## Phase 1 — Web MVP

Goals: working app on mobile web, all core gameplay loops functional, deployable to Vercel.

Key milestones completed:
- Auth (email + Google OAuth)
- Map + Fog of War + Watchtower check-in
- Figure capture flow (quiz → DB trigger → score)
- Lore system (GPS proximity + Journal)
- Support Node chain gate for S/A figures
- Leaderboard with Realtime updates
- Daily challenges + seasonal events
- BTS/MRT transport bonus
- District seed via `patch_district_seed.sql`
- Production smoke-test checklist: `docs/production-smoke.md`

---

## Phase 3 — Co-op Mode

Goals: guild system, collaborative missions, raid encounters, discussion threads.

Spec: `docs/COOP.md`  
Implementation plan: `docs/superpowers/plans/2026-06-28-coop-mode.md`  
Progress: `docs/progress.md`

DB patch: `supabase/patch_coop.sql`

---

## Deferred / Future

- Phase 2: PWA offline support
- Admin moderation dashboard for flagged discussions
- Cross-guild competition
- Voice/text chat
