# Tamroi Production Smoke Test

Run after deploying to Vercel with `SUPABASE_URL` and `SUPABASE_ANON_KEY` set.

## Supabase Setup

1. Run `supabase/schema.sql`.
2. Run `supabase/patch_auth_fix.sql`.
3. Run `supabase/patch_lore.sql`.
4. Run `supabase/patch_district_seed.sql`.
5. Enable email confirmation for production.
6. Add these Auth redirect URLs:
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
7. Open the Map tab and confirm Leaflet tiles, GPS fallback, fog, Watchtowers, nodes, and bottom sheets render.
8. Run a Watchtower check-in within localhost/dev or a valid GPS tolerance area.
9. Visit Support Nodes until the Encounter gate unlocks.
10. Complete a C-Class quiz and confirm the Collection card updates.
11. Unlock one Lore node and confirm Collection -> Journal shows it.
12. Open Leaderboard and confirm the list loads without console errors.

## Console / Network

- No uncaught JavaScript errors.
- Supabase REST calls return 200/201/204 or expected duplicate-safe responses.
- Realtime WebSocket connects for leaderboard and notifications.
- CSP does not block Supabase, Leaflet, Bootstrap, or Google OAuth.
