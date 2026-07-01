# ตามรอย · Tamroi — Game Logic Reference

> Pure gameplay mechanics: what each part of the game is, and exactly when/how it triggers. No theory, no code/file references — see `docs/PROJECT_SUMMARY.md` for the technical side.
> Last accurate as of: 2026-07-01

---

## Core Solo Loop

- **Login** — sign in with Google or email/password, then grant location permission.
- **Onboarding** — pick a home district → that district's fog clears immediately and you get +50 points.
- **Fog of War** — the whole map starts covered in dark fog. It only clears where you've actually physically been — nothing unlocks remotely.
- **Watchtower check-in** — every district has one main landmark (a temple, monument, or historic site). Get within 500 meters of it to check in. A successful check-in clears about 1km² of fog around that spot (not the whole district at once, so there's always more to explore) and reveals any locked figures hiding in that area.
- **Support Nodes** — smaller real spots in each district: 2 cafés, 1 local craft/OTOP shop, and 3 secondary landmarks. Visiting all of them is required before the rarest figures (S/A) become capturable. Common figures (B/C) don't need this step.
- **Lore** — deeper story entries that unlock in two ways: either just by walking close to a specific spot, or by visiting a whole set of connected locations that together tell one story (for example, three different real sites that together unlock the story of a historical event). Reading Lore adds bonus points and gets saved to your personal archive.
- **Quiz** — pops up once a figure becomes available to capture. Common figures need one easy question. Rare figures need three questions, and you have to get all three right.
- **Capture** — answering the quiz correctly (or just discovering a common figure) adds that figure to your collection and increases your score automatically.
- **Score & Leaderboard** — your score goes up automatically every time you capture a figure or unlock Lore. The leaderboard updates instantly for everyone whenever anyone's score changes.
- **Notifications** — you get alerted when new places to explore open up nearby, when your leaderboard rank changes, or when something needs your action (like a group invite you can accept or decline).
- **Mission tab** — one shared screen that stacks several panels: a seasonal-event banner (if today matches a special date), a public-transport bonus banner, your personal **Active Quest** card (auto-picks the next uncaptured Rare/Legendary figure in a district you've unlocked and tracks a 4-step checklist toward it), and your **Daily Challenges** list (small tasks that reset every 24 hours). These panels are the same whether you're solo or in a group — they're always about your own personal progress. The one part of this tab that's group-only is the **Group Missions** section in the middle: if you're not in a group it just shows a "join a group" prompt, but if you are, it lists your group's shared check-in objectives with a live progress bar.

## Figure Rarity Tiers

- **Common (C)** — captured instantly just by finding it. No quiz, no extra steps.
- **Uncommon (B)** — one quiz question to capture.
- **Rare (A)** — must visit all Support Nodes in the district first, then answer 3 quiz questions correctly.
- **Legendary (S)** — same requirement as Rare, unless it's a Raid-only figure, in which case it can only be captured through a group Raid (see below).
- **How rarity is decided** — figures are ranked by how big their historical impact was, how long that impact lasted, and how well-documented it is in real history.
- **Content rule — no Rama-line kings** — reigning/historical Kings of the Chakri dynasty (Rama I–X) are excluded from the figure pool entirely, regardless of tier. This is a permanent content restriction, not a future task.

## Keeping the Game Interesting Over Time

- **Special-date content** — some Lore only unlocks on the real calendar date the event happened, so it feels timed to something real rather than always available.
- **Bonus point events** — certain figures or activities earn double points during specific real-world periods or anniversaries.
- **Seasonal leaderboard** — the ranking resets every 3 months so newcomers always have a fresh shot at the top, and the top 3 players each season keep a permanent badge to show for it.

## Group / Co-op Play

- **Creating and joining a group (Guild)** — one player creates a group (up to 6 people) and gets a 6-digit invite code to share; anyone else joins just by entering that code, or by requesting to join a group they found through search.
- **Group status** — you can see which of your groupmates are currently online.
- **Shared exploration map** — a group's combined "explored" map shows every district any member has personally cleared, so the whole group benefits from each other's travel.
- **Group leaderboard** — groups are ranked against each other too, based on their combined discovery, captures, and score.
- **Group management** — the group's leader can remove members, hand off leadership to someone else, post announcements to the group, or disband the group entirely.
- **Group missions** — the group picks a shared objective that requires a minimum number of members to check in at the same real location within a set time limit. Once enough members do it in time, everyone in the group automatically gets a reward — bonus Lore and points — without needing to do anything else.
- **Raid encounters** — reserved for the rarest, hardest-to-get figures. Requires a minimum number of players. The group leader starts it, everyone readies up, and then the whole group answers a set of harder questions together at the same time, in real time, rather than each person doing it separately. Enough correct answers from the group passes the round; getting it wrong allows one retry. If the person who started the raid disconnects, someone else automatically takes over as leader so the raid isn't ruined. Anyone who participated by answering at least one question gets the figure if the raid succeeds.
- **Discussion threads** — under each figure, players can leave comments and one reply to a comment; a comment gets automatically hidden if enough other players report it.
- **Community forum** — a separate general discussion feed for the whole player base, not tied to any specific figure, with posts, replies, and likes.

## Fair Play

- **Location double-checking** — the game doesn't just trust whatever location your device reports; it's independently re-checked before letting your fog clear, so simple spoofing tricks don't work.
- **Small tolerance built in** — a roughly 20-meter margin is allowed around each check-in point, since real GPS naturally drifts a little — this isn't enough room to fake being somewhere you're not, just enough to handle normal inaccuracy.
- **Planned future protections** — flagging impossibly fast "travel" between two check-ins, detecting known fake-GPS apps, requiring a photo at high-value locations, and limiting how often someone can check in — none of these exist yet, they're just planned.

## Known Rough Edges

- Only Bangkok and Ayutthaya currently have real figures and Lore, even though the map itself covers the whole country.
- GPS can occasionally be a little off, especially indoors, near large multi-entrance sites, or in areas with weak signal — this is being manually corrected for major locations over time.
- No offline mode yet — you need a live internet connection the whole time you're playing.
- Long play sessions use up battery quickly because of continuous location tracking.

## Bugs & Fixes Needed (cross-checked against code, 2026-07-01)

- **Some figures never appear on the map at all** — if a figure doesn't have a saved map location, it silently doesn't render anywhere, with no error and no placeholder marker — it just doesn't exist as far as a player can tell. The fix is either to guarantee every figure always has a location before it's ever shown to players, or to show some visible fallback marker instead of just dropping it.
- **Raid figures have no special marker on the map** — the rarest figures that require a group Raid instead of a solo quiz look identical to any other locked figure on the map right now. There's no distinct icon or "Start Raid" button telling the player this one works differently before they walk up to it.
- **Raid-start notifications don't take you into the raid** — when a raid you're part of kicks off, the notification you get doesn't open the raid screen directly; you have to go find it yourself.
- **Lore/quiz review-status check isn't wired in yet** — the intent is that only content which has been officially reviewed and approved should ever be shown to a player, but that check isn't actually being enforced right now, so unreviewed content could theoretically be served.
- **A hidden test area exists in the game** — there's a school-field-test-only district, figure, and quiz set built for a specific pilot test. Kept intentionally for now, not something to remove.

## In Progress (Intended Features — Actively Being Worked On)

These are committed features, not just ideas. Each is cross-checked against the actual code in `C:\Users\LENOVO\Documents\Lieutenant Hecker\Primary Data\AI\Coding\Website - Tamroi - Coop` as of 2026-07-01, not just taken on intent.

- **Capture notification + collection pop-up** — ✅ **Already done in code.** Capturing a figure already shows a full-screen celebration overlay (rank-based header — "CAPTURED!" up to "LEGENDARY CAPTURE!" — plus a glow ring, and confetti for S/A-tier figures), not a silent archive update. Verified in `js/map.js` (`submitQuizAnswer`, which calls `AppCore.showCaptureReveal` right after a successful capture) and `js/app.js` (`showCaptureReveal`, which builds the overlay and confetti). This item can be considered shipped rather than in-progress.
- **Sector-based fog clearing while moving** — ❌ **Not started.** Verified: fog only ever clears as one single lump, and only at the moment of an explicit Watchtower check-in (`js/map.js`, `performCheckIn`, which sets the district's `fogged` flag and rebuilds one big polygon reveal). Continuous GPS updates while walking (`watchPosition()`) currently only move the player's dot and check Lore proximity — they don't touch fog state at all. A grid system does exist (`js/fog-grid.js`, `window.FogGrid`), but right now it's only used to draw a decorative gridline overlay on the map, not to track or reveal individual cells as the player moves through them. Genuinely still to be built.
- **Rebalance common vs. gated captures (target 80% ungated / 20% gated)** — ⚠️ **Partially there, not at target.** The gating mechanism itself is fully built and working (`js/map.js`: `canCheckIn()` blocks S/A-tier figures behind the Support Node visit count; `renderFigureNodes()` already routes B/C figures straight to the quiz while S/A go through the gated Legendary Encounter). But the actual figure roster isn't at the 80/20 split yet: the live 26-figure set (figure IDs referenced in `supabase/patch_era.sql`) currently breaks down as 7 S-tier + 3 A-tier = 10 gated figures against 6 B-tier + 10 C-tier = 16 ungated figures — roughly 38% gated / 62% ungated. That's already leaning toward more ungated figures than gated, but it's well short of the intended 80/20 ratio, so more B/C-tier figures still need to be added (or some A-tier figures reclassified) to hit the target.

## What's Planned Next (not in the game yet)

- A native phone app version with camera-based augmented reality, so figures can appear to exist in the real world through your camera.
- QR code check-in as an alternative to GPS for shop-style locations.
- A trading system to exchange collected items with other players.
- Rotating seasonal storylines and the ability to view the map through different historical eras.
- Real-world partnerships: limited-edition figures tied to media releases, real discounts at partner locations, and government-sponsored travel quests to lesser-visited provinces.
- **Lore with decisions and consequences** — let some Lore entries present the player with a choice partway through, where different answers lead to different follow-up content or outcomes, instead of every Lore entry being a single fixed read.
- **Environmental Puzzles (Lore as an on-site escape room)** — instead of just telling the player a fact outright, rewrite some Lore unlocks as a puzzle that can only be solved by physically reading the real location. Example: rather than stating "this town was built in 1907 by a noble," the mission becomes "find the family crest hidden on an old building's pillar, then decode the founding year from the architecture to open the next clue." The point is that the player's eyes have to actually scan the building, notice the stucco detailing, and engage with the real, aged place to find the answer — rather than just reading text at it.
- **Formal evaluation via Google Form** — build the player-facing pretest/posttest survey (Intrinsic Motivation Inventory + learning outcome questions from the proposal's testing methodology) as an actual Google Form, since none of that evaluation has been run yet.
- **Historical AI (later dev phase)** — a further-out idea to use the Gemini API as a historical-content assistant, using the player's location to sort and surface the most relevant figures/Lore/quiz content for wherever they currently are, rather than showing everything in a district at once.

## Still Thinking About (Not Committed Yet)

Ideas raised during review, not yet decided on:

- **Guild size cap** — groups are currently limited to 6 members with no way to grow. Still deciding whether that's a permanent design choice or whether bigger groups (especially for Raids) should eventually be allowed.
- **Quiz retry limits / hints** — a wrong quiz answer can currently be retried indefinitely. Considering whether to add a cooldown or a limited number of retries so quizzes feel more like a real test of understanding rather than trial-and-error.
- **In-app guided tutorial for new players** — the "how to play" steps exist as a written guide, but there's no first-run walkthrough inside the app itself teaching a brand-new player the loop. Considering adding one.
- **Broader achievement/badge system** — right now the only long-term trophy is the seasonal Top-3 leaderboard badge. Considering additional achievements (e.g. visiting every district, capturing every Legendary figure) as a further retention hook.
