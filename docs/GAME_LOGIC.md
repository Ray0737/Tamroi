# ตามรอย · Tamroi — Game Logic Reference

> Pure gameplay mechanics: what each part of the game is, and exactly when/how it triggers. No theory, no code/file references — see `docs/PROJECT_SUMMARY.md` for the technical side.
> Last accurate as of: 2026-07-05 — re-verified against live code (`js/`) and the live Supabase DB (project `NSC`), not just prior notes.

---

## Core Solo Loop

- **Login** — sign in with Google or email/password, then grant location permission.
- **Onboarding** — pick a home district → that district's fog clears immediately and you get +50 points.
- **Fog of War** — the whole map starts covered in dark fog. It only clears where you've actually physically been — nothing unlocks remotely.
- **Watchtower check-in** — every district has one main landmark (a temple, monument, or historic site). Get within 500 meters of it to check in. A successful check-in clears about 1km² of fog around that spot (not the whole district at once, so there's always more to explore), reveals any locked figures hiding in that area, and awards that district's **Encounter Key** — a one-per-district item (like the Master Ball in Pokémon GO) that is required, together with the Support Node chain, before a Rare (A-tier) encounter can be started.
- **Support Nodes** — smaller real spots in each district: 2 cafés, 1 local craft/OTOP shop, and 3 secondary landmarks. Visiting all of them is required before the rarest figures (S/A) become capturable. Common figures (B/C) don't need this step.
- **Lore** — deeper story entries that unlock in two ways: either just by walking close to a specific spot, or by visiting a whole set of connected locations that together tell one story (for example, three different real sites that together unlock the story of a historical event). Reading Lore adds bonus points and gets saved to your personal archive. Some Lore now runs a quick 1-2 question quiz right before the story is shown, then the same questions again right after you finish reading — the point is to measure whether reading actually taught you something, and you'll see a score delta once both are answered.
- **Quiz** — pops up once a figure becomes available to capture. Common figures need one easy question. Rare figures need three questions, and you have to get all three right.
- **Capture** — answering the quiz correctly (or just discovering a common figure) adds that figure to your collection and increases your score automatically.
- **Score & Leaderboard** — your score goes up automatically every time you capture a figure or unlock Lore. The leaderboard updates instantly for everyone whenever anyone's score changes.
- **Notifications** — you get alerted when new places to explore open up nearby, when your leaderboard rank changes, or when something needs your action (like a group invite you can accept or decline).
- **Mission tab** — one shared screen that stacks several panels: a seasonal-event banner (if today matches a special date), a public-transport bonus banner, your personal **Active Quest** card (auto-picks the next uncaptured Rare/Legendary figure in a district you've unlocked and tracks a 4-step checklist toward it), your group's shared mission cards (if you're in one), and your **Daily Challenges** list (small tasks that reset every 24 hours). ⚠️ Group mission cards now show up in *two* places — this same Mission tab, and again inside the Guild panel's own "ภารกิจ" tab (see below) — same data, shown twice, not de-duplicated.

## Figure Rarity Tiers

- **Common (C)** — visible on the map even through un-cleared fog, each surrounded by an 80-meter capture circle. Walk inside the circle and tap the figure to capture it on the spot — no quiz, no check-in required. Tapping from outside the circle shows a "get closer" message instead.
- **Uncommon (B)** — one quiz question to capture.
- **Rare (A)** — must hold the district's Encounter Key (from the Watchtower check-in) *and* visit all Support Nodes in the district first, then answer 3 quiz questions correctly.
- **Legendary (S)** — same requirement as Rare, unless it's a Raid-only figure, in which case it can only be captured through a group Raid (see below).
- **How rarity is decided** — figures are ranked by how big their historical impact was, how long that impact lasted, and how well-documented it is in real history.
- **Content rule — no Rama-line kings** — reigning/historical Kings of the Chakri dynasty (Rama I–IX) are excluded from the figure pool entirely, regardless of tier. This is a permanent content restriction, not a future task — verified: all 9 were actually still in the figure pool as of 2026-07-02 despite two earlier removal attempts, both of which silently failed (see Bugs & Fixes Needed history); confirmed gone as of 2026-07-03.

## Keeping the Game Interesting Over Time

- **Special-date content** — some Lore only unlocks on the real calendar date the event happened, so it feels timed to something real rather than always available.
- **Bonus point events** — certain figures or activities earn double points during specific real-world periods or anniversaries.
- **Seasonal leaderboard** — the ranking resets every 3 months so newcomers always have a fresh shot at the top, and the top 3 players each season keep a permanent badge to show for it.

## Group / Co-op Play

- **Creating and joining a group (Guild)** — one player creates a group (up to 6 people) and gets a 6-digit invite code to share; anyone else joins just by entering that code, or by requesting to join a group they found through search. The invite code lives inside the group panel's Members tab now (with a one-tap copy button), not in the group's header.
- **Group panel layout** — the group screen opens on a compact header (group emblem showing its initials, name, online count, score) with quick action buttons (Rally, Discuss, Leave/Delete group) right underneath. Below that, the rest of the group's content — Members, Announcements, Activity Log, and Missions — is organized into its own row of tabs at the top of the content area, the same visual style as the app's main bottom navigation (icon + label, one highlighted at a time), so you switch between them instead of scrolling through one long stacked page.
- **Group status** — you can see which of your groupmates are currently online, and a live activity log shows recent group actions (someone captured a figure, cleared fog, unlocked Lore) as they happen.
- **Rally Pin** — any member can drop a one-tap map pin broadcasting "I'm here, come join me" to the rest of the group; it notifies everyone and expires after 2 hours.
- **Shared exploration map** — a group's combined "explored" map shows every district any member has personally cleared, so the whole group benefits from each other's travel.
- **Group leaderboard** — groups are ranked against each other too, based on their combined discovery, captures, and score.
- **Group management** — the group's leader can remove members, hand off leadership to someone else, post announcements to the group, or disband the group entirely.
- **Group missions** — the group picks a shared objective that requires a minimum number of members to check in at the same real location within a set time limit. Once enough members do it in time, everyone in the group automatically gets a reward — bonus Lore and points — without needing to do anything else.
- **Raid encounters** — reserved for the rarest, hardest-to-get figures. Requires a minimum number of players. The group leader starts it, everyone readies up, and then the whole group answers a set of harder questions together at the same time, in real time, rather than each person doing it separately. Enough correct answers from the group passes the round; getting it wrong allows one retry. If the person who started the raid disconnects, someone else automatically takes over as leader so the raid isn't ruined. Anyone who participated by answering at least one question gets the figure if the raid succeeds.
- **Discussion threads** — under each figure, players can leave comments and one reply to a comment; a comment gets automatically hidden if enough other players report it.
- **Community forum** — a separate general discussion feed for the whole player base, not tied to any specific figure, with posts, replies, and likes. Brand-new accounts (younger than 24 hours) are on **posting probation**: their forum posts are held as pending until an admin approves them or the post earns its first like, whichever comes first. Everyone also confirms a PDPA age-consent step (and accepts the community guidelines) during onboarding before any personal data — like location — is processed.

## Fair Play

- **Location double-checking** — the game doesn't just trust whatever location your device reports; it's independently re-checked before letting your fog clear, so simple spoofing tricks don't work.
- **Tolerance margins** — Watchtower check-ins and Support Node visits allow up to 500 meters from the real spot (GPS can drift a lot outdoors, especially near large sites); Lore proximity is stricter, capped at 50 meters (or the node's own smaller radius if set). Neither margin is loose enough to fake being somewhere you're not — outside that range the game blocks the action with an in-app "you're too far away" message.
- **Basic spoofing checks already in place** — a position is rejected if the device reports 0m accuracy (a known DevTools/emulator spoof signature) or if it implies traveling faster than ~50 m/s (180 km/h) since the last reading, which is impossible on foot or public transit.
- **Planned future protections** — detecting known fake-GPS apps more directly, requiring a photo at high-value locations, and limiting how often someone can check in — none of these exist yet, they're just planned.

## Known Rough Edges

- Content only covers Bangkok (12 districts), Ayutthaya (1), and Nonthaburi (1) — 14 districts total — even though the map itself covers the whole country. 23 Lore entries exist, all reviewed/approved.
- Most figures (roughly 47 of 74 live figures) have no saved map coordinates yet. They still show a dashed "?" fallback marker at their district's watchtower spot (see Bugs & Fixes Needed) rather than disappearing, but a real pinned location is still missing for most of the roster.
- Only one figure in the whole game is currently marked as Raid-only.
- GPS can occasionally be a little off, especially indoors, near large multi-entrance sites, or in areas with weak signal — this is being manually corrected for major locations over time.
- No offline mode yet — you need a live internet connection the whole time you're playing.
- Long play sessions use up battery quickly because of continuous location tracking.

## Bugs & Fixes Needed (cross-checked against the live game code and the live database, 2026-07-05)

- ✅ **Fixed — Lore unlocks now actually save to your account.** Saving a Lore entry looked successful but silently never wrote to the database (the code wrote to a column name that didn't exist), so nothing appeared in the Journal after a reload and no Lore survived switching devices. Anything "unlocked" before 2026-07-05 was never really saved and has to be unlocked again.
- ✅ **Fixed — Already-captured figures no longer reappear on the map after a reload.** The map now fetches your captures at startup and skips their markers, instead of only hiding them in the moment of capture.
- ✅ **Fixed — Walking no longer reveals fog from bad GPS fixes.** Walk-cell reveal now ignores position readings with worse than 100m accuracy, and the stored trail was reset once to clear holes created by earlier bad fixes.
- ✅ **Fixed — Figures without a map location now show a fallback marker.** A figure missing lat/lng no longer silently disappears — it now renders a dashed "?" pin at its district's watchtower spot with a "ตำแหน่งยังไม่ระบุ" tooltip, and the missing IDs are logged to the console. The underlying content gap is still large though — 47 of 74 live figures (roughly two-thirds) still have no real coordinates, so most figures a player finds are on this fallback pin, not their actual location.
- ✅ **Fixed — Raid figures now have a distinct map marker.** Figures that require a group Raid show a red ⚔️ icon instead of the normal locked-figure marker, and tapping one now checks whether enough guild members are online and opens the raid lobby directly — it no longer offers a regular solo quiz at all (previously it silently let players solo-capture a raid figure through the normal encounter flow, skipping the raid entirely).
- ✅ **Fixed — Raid-start notifications now open the raid.** Tapping a "Raid เริ่มแล้ว!" notification now joins you straight into that raid's lobby instead of just marking it read.
- ✅ **Fixed — Guild join requests no longer get stuck.** Approving or rejecting a request used to add the member (or not) but leave the request itself sitting there forever, showing up as a phantom pending request for someone already in the group. The permission that let a group leader clear someone else's request was simply missing.
- ✅ **Fixed — Group announcements can now actually be read.** Posting an announcement always worked, but reading the list back was silently failing for everyone due to a missing data link between an announcement and its poster's name — the leader could write but nobody, including the leader, could see what was written.
- ✅ **Fixed — Two earlier "no Rama kings" removal attempts didn't work.** Both silently failed to remove anything (wrong figure identifiers), so all 9 Rama-line kings stayed capturable despite the content rule saying otherwise. Re-verified live: zero reigning Rama-line kings remain in the figure pool — the only name matches left are 3 C-tier figures about craftspeople/teachers *from the era of* a given king (e.g. "Royal Craftsmen of Rama I"), which don't violate the rule.
- ✅ **Fixed — Lore/quiz review-status is now enforced.** Only content marked `approved` is ever served to players; live-checked and every existing Lore node and quiz question is already marked approved, so nothing got hidden by turning the filter on.
- **Historical era text still isn't showing** — the display code is ready (it reads a per-figure era label and falls back to a generic "[Tier]-Class · [district]" string only if that's missing), but the database was never actually given that data — the column that's supposed to hold it doesn't exist on the live figures table yet. Until that one DB update is applied, every figure shows the generic fallback, exactly as before.
- **Group missions still show up twice** — confirmed still true: the same group mission cards are independently fetched and rendered both in the regular Mission tab and again inside the group panel's own Missions tab. Nothing links the two, so a check-in in one place doesn't immediately refresh the other's card until its own reload runs.
- **A hidden test area exists in the game** — there's a school-field-test-only district, figure, and quiz set built for a specific pilot test. Confirmed still present in the live database. Kept intentionally for now, not something to remove.

## In Progress (Intended Features — Actively Being Worked On)

These are committed features, not just ideas. Each is cross-checked against the actual live game code and database as of 2026-07-04, not just taken on intent.

- **Capture notification + collection pop-up** — ✅ **Done and shipped.** Capturing a figure shows a full-screen celebration overlay (rank-based header — "CAPTURED!" up to "LEGENDARY CAPTURE!" — plus a glow ring, and confetti for S/A-tier figures), not a silent archive update.
- **Sector-based fog clearing while moving** — ✅ **Done and shipped** (previously documented as not started — that was wrong). Walking around actively reveals fog cell-by-cell as you move, on top of the district-level clear from Watchtower check-ins; the grid isn't just a decorative overlay anymore. One real limitation: which cells you've walked is saved only to that device's local storage, not to your account in the database — so it doesn't carry over if you play on a second device or clear your browser data.
- **Rebalance common vs. gated captures (target 80% ungated / 20% gated)** — ⚠️ **Still far from the target, unchanged since last check.** The gating mechanism itself works correctly. Live-verified split: 11 S-tier + 20 A-tier = 31 gated figures against 21 B-tier + 22 C-tier = 43 ungated, out of 74 total — roughly 42% gated / 58% ungated. Better than 50/50, but still far short of 80/20. More B/C-tier figures (or reclassifying some A-tier ones) are still needed to hit the target.

## What's Planned Next (not in the game yet)

- A native phone app version with camera-based augmented reality, so figures can appear to exist in the real world through your camera.
- QR code check-in as an alternative to GPS for shop-style locations.
- A trading system to exchange collected items with other players.
- Rotating seasonal storylines and the ability to view the map through different historical eras.
- Real-world partnerships: limited-edition figures tied to media releases, real discounts at partner locations, and government-sponsored travel quests to lesser-visited provinces.
- **Lore with decisions and consequences** — let some Lore entries present the player with a choice partway through, where different answers lead to different follow-up content or outcomes, instead of every Lore entry being a single fixed read.
- **Environmental Puzzles (Lore as an on-site escape room)** — instead of just telling the player a fact outright, rewrite some Lore unlocks as a puzzle that can only be solved by physically reading the real location. Example: rather than stating "this town was built in 1907 by a noble," the mission becomes "find the family crest hidden on an old building's pillar, then decode the founding year from the architecture to open the next clue." The point is that the player's eyes have to actually scan the building, notice the stucco detailing, and engage with the real, aged place to find the answer — rather than just reading text at it.
- **Formal evaluation via Google Form** — this is a separate, broader thing from the in-game Lore quiz above: a proper judge-facing survey (Intrinsic Motivation Inventory, System Usability Scale, satisfaction/NPS questions) to measure the project's educational impact as a whole, not just per-lore-node knowledge. Still needs to actually be built as a real Google Form and run with test players — none of that evaluation has happened yet, even though the measurement plan for it is now fully written up.
- **Historical AI (later dev phase)** — a further-out idea to use the Gemini API as a historical-content assistant, using the player's location to sort and surface the most relevant figures/Lore/quiz content for wherever they currently are, rather than showing everything in a district at once.

## Still Thinking About (Not Committed Yet)

Ideas raised during review, not yet decided on:

- **Guild size cap** — groups are currently limited to 6 members with no way to grow. Still deciding whether that's a permanent design choice or whether bigger groups (especially for Raids) should eventually be allowed.
- **Quiz retry limits / hints** — a wrong quiz answer can currently be retried indefinitely. Considering whether to add a cooldown or a limited number of retries so quizzes feel more like a real test of understanding rather than trial-and-error.
- **In-app guided tutorial for new players** — the "how to play" steps exist as a written guide, but there's no first-run walkthrough inside the app itself teaching a brand-new player the loop. Considering adding one.
- **Broader achievement/badge system** — right now the only long-term trophy is the seasonal Top-3 leaderboard badge. Considering additional achievements (e.g. visiting every district, capturing every Legendary figure) as a further retention hook.
