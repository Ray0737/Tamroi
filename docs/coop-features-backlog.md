# Co-op Feature Backlog
> Player-perspective review · 2026-07-02

---

## Priority 1 — Social Glue (low effort, high feel)

### Guild Expedition Log
A running feed inside the Guild panel showing recent member activity.

- "Mook captured พระพิฆเนศ at Surasak · 5m ago"
- "Beam cleared Lak Si fog · 12m ago"
- "Pat unlocked Lore: ท่าเรือคลองสาน · 1h ago"

**Why it matters:** The guild feels dead between sessions. This makes it feel alive at zero coordination cost.  
**Data:** All events already exist in DB — captures in `user_captures`, fog clears in `user_districts`, lore in `user_lore`. Just need a feed query + guild panel section.  
**Scope:** Read-only feed, no new tables needed. One DB view + UI panel.

---

### Rally Pin
One-tap "I'm here, come join me" button that broadcasts a map pin to guildmates.

- Tapping sends a guild notification with the player's current GPS coords
- Notification deeplinks to that location on the map
- Pin auto-expires after 2 hours

**Why it matters:** Right now players coordinate on LINE instead of in-app. This makes the app the coordination tool.  
**Scope:** Supabase Broadcast message to guild channel + one notification row + map pin renderer.

---

## Priority 2 — Territorial Stakes (medium effort, high retention)

### District Territory Claiming
First guild to complete all collab missions in a district "claims" it.

- Claimed district shows guild color tint on the leaderboard map
- Owning guild earns a small passive weekly bonus (e.g. +10 pts/member)
- Another guild can contest by completing all missions again — ownership transfers
- Guild profile shows "Districts Held: 3"

**Why it matters:** Clears discovery has no social meaning right now. Territory gives a reason to compete over specific real places.  
**DB:** Add `claimed_by_guild_id` + `claimed_at` column on `districts` table (or a separate `district_claims` table if contests need history).  
**Scope:** Medium — DB column, trigger on mission completion, map render tint, leaderboard stat.

---

### Guild vs. Guild Sprint Event
Timed 48h race between two guilds to check in at a shared set of 5 landmarks first.

- Any guild can issue a challenge to another guild (by invite code)
- Both guilds see the same 5 target locations and a shared countdown
- First guild to hit all 5 wins a badge + bonus points for all members
- Results posted to the community forum automatically

**Why it matters:** Creates a moment worth screenshotting and sharing. Rivalries drive retention.  
**Scope:** Needs a `guild_challenges` table + challenge UI + event expiry logic. Medium-large.

---

## Priority 3 — Deeper Raid Experience (medium effort, quality)

### Raid Discovery & LFG
Two connected fixes for the raid discoverability problem:

1. **⚔️ map marker** for raid-only figures (bug fix — currently missing, looks identical to locked figures)
2. **"Find Raid Party" button** on the figure info card — posts a public LFG listing visible to all players, not just guildmates
3. LFG listings expire after 24h or when the raid fires

**Why it matters:** Players can't start a raid alone and can't tell a raid figure apart from a locked one. Both kill engagement before it starts.  
**Scope:** Marker fix is trivial. LFG needs a `raid_lfg` table + UI panel. Split into two tasks.

---

### Role Split in Raids
Instead of everyone answering the same questions, divide the question pool by role.

- **Historian** — answers "what happened / who was involved" questions
- **Navigator** — answers "where / when" questions  
- Each player picks a role in the lobby (or gets auto-assigned if party is small)
- Both roles must pass for the raid to succeed — interdependence by design

**Why it matters:** Right now all raiders do the same thing in parallel. Roles create dependency and make it feel like a real team effort.  
**Scope:** Needs `question_type` column on `quiz_questions` + lobby role-pick UI + raid scoring split. Medium.

---

## Priority 4 — Async Collaboration (larger, later)

### Guild Relay Mission
A chained mission where each step must be completed by a *different* member at a *different* location.

- Step 1: Player A checks in at location X → unlocks a clue for step 2
- Step 2: Player B must visit location Y within 48h → unlocks step 3
- Step 3: any member completes the final quiz → whole guild gets the reward

**Why it matters:** No live coordination required, but still feels collaborative. Works across timezones.  
**Scope:** New mission type in `collab_missions` with `chain_steps` JSON. Larger lift.

---

## Known Bugs to Fix First
These block the co-op features above from feeling polished — fix before building new.

| Bug | Impact |
|-----|--------|
| Raid-only figures show no ⚔️ marker | Players can't tell raids exist |
| Raid-start notification doesn't deeplink to raid screen | Players miss their own raid |
| No "Start Raid" button visible until you're already in the right guild state | Discovery friction |

---

## Summary Table

| Feature | Effort | Impact | Do When |
|---------|--------|--------|---------|
| Bug fixes (markers + notif deeplink) | XS | High | Next session |
| Guild Expedition Log | S | High | Next session |
| Rally Pin | S | Medium | Next session |
| District Territory Claiming | M | High | After log/pin |
| Raid LFG listing | M | High | After bug fixes |
| Guild vs. Guild Sprint | L | High | After territory |
| Raid Role Split | M | Medium | After LFG |
| Guild Relay Mission | L | Medium | Later |
