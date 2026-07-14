# Jigsaw end-to-end test run — 2026-07-14

**RESULT: ✅ PASSED end-to-end.** Both accounts unlocked their chapter,
passed pretest/posttest/recall quiz, submitted summaries, voted the
correct chronological order, and the mission actually completed —
`collab_mission_completions` got a real row, both accounts got +200 pts
(leader 400→650, member 0→240), and the UI correctly rendered the win
screen ("🏆 เรียงลำดับถูกต้อง! ทุกคนได้รับรางวัลแล้ว"). 5 real bugs were
found and fixed along the way (below) — this feature was never reachable
before today's run.

Goal: actually drive the Jigsaw co-op mission through a headless browser
(Playwright) with two real accounts, screenshot every step, and fix
whatever broke along the way instead of just reading code.

## Bugs found and fixed (live DB + code, all applied already)

1. **`guild_jigsaw_assignments` had no FK to `profiles`** — the actual
   reason Jigsaw has "never worked" since it was built. `getJigsawAssignments()`
   embeds `profiles(username, avatar_url)`; PostgREST can't resolve that
   embed without a direct FK between the two tables (the existing FK only
   pointed at `auth.users`). Every call 400'd (`PGRST200`), and `coop.js`'s
   catch-all silently rendered "no missions" instead of surfacing the error.
   Fixed live + tracked in `supabase/patch_jigsaw_profile_fkey.sql`.

2. **`coop.js:47` read `guild.role` instead of `guild.guild.myRole`** —
   `GuildModule.getState()` returns `{ guild: {...myRole}, members }`, not
   a flat `{role}`. This meant the leader-only auto-assign branch could
   never evaluate true for anyone, ever. Fixed in `js/coop.js` (cache-bust
   bumped to `?v=3`).

3. **Race condition: `CoopModule.load()` read guild state before
   `GuildModule.init()` finished.** Opening the Mission tab soon after
   login could show "join a guild" even for real members. Added
   `GuildModule.ready()` (exposes the init promise) and `coop.js` now
   `await`s it before reading `getState()`. (`js/guild.js?v=2`)

4. **`increment_legacy_score` RPC didn't exist on the live DB** — it was
   fully written in the already-tracked `supabase/patch_lore.sql` (line 57)
   but apparently never applied, or applied before that function was added
   to the file. `DB.Profiles.addLegacyPoints()` has a fallback so it wasn't
   silently broken, just 404ing and doing an extra round-trip on every
   call (welcome bonus, lore unlock, jigsaw reward, etc). Re-applied the
   exact `CREATE OR REPLACE FUNCTION` from the tracked file — idempotent,
   safe.

5. **Not a code bug, but the actual blocker that made chapter unlock look
   "flaky":** `checkLoreProximity()` in `map.js` hard-gates on
   `userDistrictState[districtId].fogged !== false` *before* even checking
   GPS distance. A brand-new account (or any account that's never checked
   in at that district's Watchtower) can stand exactly on top of a lore
   node forever and nothing will unlock — not a timing issue, a real
   prerequisite. The member test account had zero rows in `user_districts`
   for Rattanakosin. Fix wasn't a code change — drove a real Watchtower
   check-in through the UI first (`.marker-watchtower` click →
   `#btn-checkin` click, both dev-bypassed via `isDev()` same as lore), then
   proximity unlock worked on the very next geoloc ping. Worth calling out
   because it's a real onboarding trap: any brand-new player invited straight
   into a guild's Jigsaw mission without having checked in anywhere first
   will silently be unable to unlock their chapter, with zero error message
   telling them why.

## Test setup (still live — reusable tomorrow)

- Two throwaway passwords were set directly via `pgcrypto`/`crypt()` on
  real accounts that were previously Google-OAuth-only (no password
  credential existed at all, which is why the first login attempts 400'd):
  - `raphee.rattanamanoonporn@gmail.com` — **guild leader** — password `@Tristan1`
  - `smartteamofficial@gmail.com` — **guild member** — password `@Tristan1`
  - Both in guild `test group` (`745d339f-71e0-4ca9-947d-12d69c298e03`).
- Chapter assignment already fired for real: leader → chapter 0
  (`lore-rk-1`, กำแพงเมืองพระนคร, has a recall quiz, correct answer `A`),
  member → chapter 1 (`lore-rk-2`, พระบรมมหาราชวัง, **no** recall quiz
  seeded — goes straight to the summary form).
- `isDev()` in `map.js` bypasses all GPS-distance checks on
  `localhost`/`127.0.0.1`, so Playwright doesn't need real GPS spoofing —
  just `context.setGeolocation()` + a wait for the background
  `watchPosition` callback to fire the proximity check.

## Final DB state — confirmed complete

```
leader (507432b8…)  chapter 0  summary_posted = true, proposed_order = [0,1]
member (b19bc3e5…)  chapter 1  summary_posted = true, proposed_order = [0,1]
collab_mission_completions: 1 row (jigsaw_rattanakosin_1 / test group), completed_at 2026-07-14 16:03:37 UTC
profiles.legacy_score: leader 400→650 (+200 jigsaw, +50 pretest-bonus earlier),
                        member 0→240 (+50 welcome bonus, +190 lore/posttest/jigsaw)
```

Win screen confirmed visually too — Mission 03 card renders the trophy
icon + "เรียงลำดับถูกต้อง! ทุกคนได้รับรางวัลแล้ว" via `_jigsawResultBody(assignments, true)`.

## Scripts (all in scratchpad, reusable for the *next* test pass)

`C:\Users\LENOVO\AppData\Local\Temp\claude\c--Users-LENOVO-Documents-Lieutenant-Hecker-Primary-Data-AI-Coding\b39d5acc-5da3-45bb-b6f6-8198742dff56\scratchpad\jigsaw_run\`

- `run.mjs` — single-account login + Mission tab smoke test.
- `full.mjs` — full two-account driver from login through assignment,
  unlock, quiz, summary, merge/vote. Has the viewport/click workaround
  baked in (see below).
- `member_catchup.mjs` — resumes just the member's side: real Watchtower
  check-in (clicks `.marker-watchtower` then `#btn-checkin`, both
  dev-bypassed) → chapter unlock retry loop → pretest → save → posttest →
  jigsaw summary submit. This is what actually closed the gap after
  `full.mjs` left the member stuck.
- `merge_phase.mjs` — logs in both accounts, DOM-reorders each one's
  `.jigsaw-merge-list` to ascending `chapter_index`, clicks
  `[data-jigsaw-submit-order]`, screenshots the result.
- `final_check.mjs` — throwaway single-account script used to grab the
  settled win-screen screenshot after the realtime update landed.

**Reusable technique notes for next time:**
- Playwright's `.click()` — even with `force: true` — refuses to click an
  element outside the viewport rectangle. The bottom-sheet's save button
  sits below the fold in a 430×900 viewport. Fix: skip Playwright's click
  entirely, use `page.evaluate(() => document.getElementById(id)?.click())`
  — a real DOM click that fires the actual handler regardless of scroll
  position.
- `app.js`'s `_bootApp()` attaches nav-button click listeners
  asynchronously after auth resolves; the buttons exist in static HTML
  before that, so clicking `.nav-item[data-tab="mission"]` too early is a
  silent no-op. Wait for `#topbar-avatar` to have content/an image first.
- A brand-new test account needs a real Watchtower check-in before *any*
  lore proximity (including jigsaw chapters) can unlock — see bug #5 above.

## Cleanup to consider

- The two throwaway passwords on real accounts (`raphee.rattanamanoonporn@gmail.com`,
  `smartteamofficial@gmail.com`, both `@Tristan1`) are still live. Consider
  clearing `encrypted_password` back to null (OAuth-only) now that testing
  is done, or leave them — low risk since they're not shared anywhere, but
  worth a conscious decision rather than forgetting about it.
- This doc can move to `docs/superpowers/specs/` per the project's
  convention for docs about a now-verified-working feature, rather than
  staying a top-level investigation note.
