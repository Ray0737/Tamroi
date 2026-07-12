# Tamroi Production Smoke Test

> Last updated: 2026-07-12 (previous version referenced Leaflet and only 4 SQL patches — both stale; the app moved to MapLibre GL 2026-07-07, and 30+ patches now exist).

Run after deploying to Vercel with `SUPABASE_URL` and `SUPABASE_ANON_KEY` set.

## Supabase Setup

Run every patch in the order listed in `CLAUDE.md` → "Supabase Setup" (canonical, kept current there — do not duplicate the list here). Then:

1. Enable email confirmation for production.
2. Add these Auth redirect URLs:
   - `https://<vercel-domain>/**`
   - `https://<vercel-domain>/login.html`
   - `https://<vercel-domain>/onboarding.html`

## Vercel Checks

1. Confirm build log prints `[build] js/env.js generated from environment variables.`
2. Open `/js/env.js` and confirm it contains the public Supabase URL and anon key.
3. Open `/login.html` on mobile width around 375px.
4. Register with a real email and confirm the app shows the email verification message.
5. Click the email verification link and confirm it returns to `/login.html`.
6. Sign in, complete onboarding, and choose a home district.

## Solo Core

7. Open the Map tab and confirm MapLibre GL tiles (CartoDB Positron light basemap), GPS fallback, fog of war, Watchtowers, support nodes, and bottom sheets render.
8. Run a Watchtower check-in within localhost/dev or a valid GPS tolerance area; confirm the Encounter Key is granted.
9. Visit Support Nodes until the S/A Encounter gate unlocks.
10. Complete a C-Class proximity capture (tap inside the 80m circle, no quiz).
11. Complete a B or S/A-Class quiz and confirm the Collection card updates, including the capture-tier celebration overlay.
12. Unlock one Lore node (single-point and one chain part) and confirm Collection → Journal shows it with chain progress.
13. Confirm a Lore node with pre/post-test questions shows the pretest → content → posttest → delta-badge flow.
14. Trigger a Retrieval Practice recall mission and confirm it completes.
15. Open Leaderboard and confirm the list loads without console errors.
16. Open Notifications and confirm the bell badge + offcanvas panel work.

## Co-op

17. Create a guild, confirm the 6-character invite code generates, and join it from a second account.
18. Confirm guild Presence (online members) and the guild fog overlay render.
19. Start and complete a Collaborative Mission; confirm the real-time progress bar updates for both accounts.
20. Start a Raid on a `raid_only` figure (⚔️ marker) with 2+ guild members online; confirm lobby, broadcast quiz sync, and host failover work.
21. Post a figure discussion comment and a community forum post; confirm a new (<24h) account's post is held pending until liked/approved.
22. Open a Jigsaw v2 collab mission; confirm the GPS-gated visit, quiz gate, and drag-to-reorder merge phase complete.
23. Vote on an Unsolved History debate and confirm the aggregate stats render.

## Console / Network

- No uncaught JavaScript errors.
- Supabase REST calls return 200/201/204 or expected duplicate-safe responses.
- Realtime WebSocket connects for leaderboard, notifications, guild presence, and raid broadcast.
- CSP does not block Supabase, MapLibre GL, Bootstrap, or Google OAuth.

## Known Gaps To Not Mistake For Bugs

See `docs/PROJECT_SUMMARY.md` → "Feature Status" for the current list (co-op mission check-in has no GPS gate, walk-cell fog is device-local, `figures.era` column not yet populated, tier ratio off-target, mock Satit test data present intentionally).
