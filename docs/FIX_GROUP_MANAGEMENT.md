# FIX_GROUP_MANAGEMENT.md — Co-op Mode Group Management Overhaul

> **Purpose:** Verification doc before implementation. Review each section and confirm before I write code.

---

## Current Problems

| Tab | Problem |
|---|---|
| อันดับ (rank) | Guild leaderboard rows have a "คัดลอก" (copy code) button and a "ลบ" (delete) button visible inline — this is management UI polluting a leaderboard view |
| กลุ่มของฉัน | Shows only a basic member list + leave button. No missions, raids, announcements, discussions, admin controls, or join-request management |
| (missing) | No dedicated tab to browse and request to join groups |

---

## Change 1 — อันดับ: Pure Leaderboard

**File:** `js/leaderboard.js` → `_renderGuildLeaderboard()`

**What changes:**
- Remove `btn-copy-code` button from expanded guild card HTML
- Remove `btn-delete-guild` button from expanded guild card HTML
- Remove `iconCopy` and `iconTrash` SVG definitions (unused after removal)
- Remove their click-event bindings
- For members: show invite code as **read-only display text** (no copy button); invite code management belongs in กลุ่มของฉัน
- For non-members: show "สมาชิก X คน · N districts · M captures" (already there)

**Result:** Guild leaderboard is rank + stats only. No actions.

**Verify:**
- Open Community → อันดับ → กลุ่ม pill
- Tap any guild card to expand
- No copy button, no delete button visible — just the invite code text (for your own guild) or join prompt (for others)

---

## Change 2 — กลุ่มของฉัน: Full Group Hub

**Files:** `js/guild.js` · `app.html`

### 2a. When NOT in a group

Same as current "no guild" card but:
- Remove the "ค้นหากลุ่ม" button (search is now the **หากลุ่ม** tab)
- Keep: create group input + join-by-invite-code input
- If user has a pending join request → show pending banner (already implemented via `_renderNoGuild(pendingRequest)`)

### 2b. When IN a group — Group Hub Layout

Replace the current single member-list card with a sectioned hub. Sections render in order:

#### Header (always visible)
- Group name + "Team" label
- Online member count (e.g. "2/6 ออนไลน์")
- Invite code display (read-only text, no copy button needed here — ponytail: invite code is already on leaderboard)
- Admin sees: **[แก้ไขกลุ่ม]** button → inline edit for group name + announcement text

#### Announcements (always visible, collapsible)
- Shows `guilds.announcement` text set by admin
- If null/empty and user is not leader: show "ยังไม่มีประกาศ"
- Admin: editable inline text field + save button
- **DB change required:** add `announcement TEXT` column to `guilds` table (see DB Changes section)

#### Party — สมาชิก (always visible)
- Member list (same rows as current: avatar initials, online dot, username, role badge)
- Leader sees **[Kick]** button per member (same as current)
- Leader sees pending join requests sub-section:
  - List of pending `guild_join_requests` for this guild
  - Each row: username, "อนุมัติ" button, "ปฏิเสธ" button
  - On approve → `DB.Coop.approveRequest()` → re-render
  - On reject → `DB.Coop.rejectRequest()` → re-render
  - If no pending: hidden entirely

#### ภารกิจกลุ่ม — Collaborative Missions (always visible)
- Reuse `CoopModule.renderMissionCard()` output inline
- Call `DB.Coop.getCollabMissions()` + `DB.Coop.getAllGuildCheckins(guildId)` on render
- Same check-in button behaviour as the Mission tab widget
- If no missions: small muted placeholder

#### Raids (always visible, info only)
- Shows a card: "⚔️ Raids จะปรากฏบนแผนที่เมื่อมีสมาชิกออนไลน์เพียงพอ"
- Shows online member count vs minimum required
- No action buttons here — raids are triggered from the map
- Reason: raid sessions are started from `MapModule` / `RaidModule` on figure info card; duplicating the flow here is out of scope

#### ถกเถียง / Group Discussion (collapsible link)
- Button: "เปิดการถกเถียง →" → switches to ถกเถียง sub-tab (`_switchCommunityTab('discuss')`)
- Does NOT embed the full forum inline (avoids duplication with the ถกเถียง tab)

#### Footer actions
- Non-leader: **[ออกจากกลุ่ม]** button (same as current)
- Leader: **[ออกจากกลุ่ม]** is hidden (leader must transfer or delete)
- Leader: **[ลบกลุ่ม]** button at bottom (with confirm dialog)

---

## Change 3 — หากลุ่ม: Group Discovery Tab (NEW)

**Files:** `app.html` · `js/guild.js` · `js/app.js` · `js/supabase-client.js`

### 3a. app.html

Add pill to community sub-tabs:
```html
<button class="pill" data-community-tab="findgroup">หากลุ่ม</button>
```

Add section div (hidden by default):
```html
<div id="community-findgroup-section" hidden>
  <div id="findgroup-panel"></div>
</div>
```

### 3b. app.js — `_switchCommunityTab`

Add case:
```js
} else if (view === 'findgroup') {
  document.getElementById('community-findgroup-section')?.removeAttribute('hidden');
  window.GuildModule?.renderFindGroupPanel();
}
```

Add `'community-findgroup-section'` to the hide-all array in `_switchCommunityTab`.

### 3c. guild.js — `renderFindGroupPanel()`

New exported function. Renders into `#findgroup-panel`.

**Layout:**
1. Search bar (`<input>` + ค้นหา button) at top
2. Default state (no search): calls `DB.Coop.searchGuilds('')` to list all public groups (up to 20), sorted by score descending
3. On search: filters by name via `DB.Coop.searchGuilds(query)`
4. Each guild card shows:
   - Rank position (if available)
   - Guild name
   - Member count
   - Legacy score
   - Request button state:
     - **"ขอเข้าร่วม"** → `DB.Coop.sendJoinRequest(guildId, userId)` + notify leader
     - **"รอการอนุมัติ"** (disabled) if pending request exists
     - **"คุณอยู่แล้ว"** (disabled) if user is already a member of this guild
5. If user is already IN a guild: show banner "คุณอยู่ในกลุ่มแล้ว — ออกก่อนเพื่อเข้าร่วมกลุ่มอื่น" and disable all request buttons

### 3d. supabase-client.js — extend `searchGuilds` + `sendJoinRequest`

**`searchGuilds`**: extend SELECT to also return `guild_legacy_score` from `guild_leaderboard` view (or do a separate count from guild_leaderboard per result). Simplest: join with `guild_leaderboard` view.

**`sendJoinRequest`**: after successful insert, fetch the guild leader's user_id (`guild_members` where `guild_id = X AND role = 'leader'`), then call:
```js
DB.Notifications.send(leaderId, 'join_request', 'คำขอเข้าร่วมกลุ่ม', `${username} ขอเข้าร่วม ${guildName}`)
```
This puts the notification in the leader's notification bell (existing notification system).

---

## DB Changes Required

Run this SQL in Supabase SQL Editor (will be added to a new patch file `supabase/patch_group_management.sql`):

```sql
-- Add announcement column to guilds
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS announcement TEXT;

-- Update RLS update policy to allow leader to update announcement
-- (existing policy already allows leader to update own guild: created_by = auth.uid())
-- No additional policy needed.
```

---

## Files Touched

| File | Change |
|---|---|
| `js/leaderboard.js` | Remove copy + delete buttons from `_renderGuildLeaderboard` |
| `js/guild.js` | Expand `renderGuildPanel` into full hub; add `renderFindGroupPanel`; remove `_openSearchSheet` bottom-sheet trigger |
| `js/app.js` | Add `findgroup` case to `_switchCommunityTab`; add `community-findgroup-section` to hide-all list |
| `app.html` | Add หากลุ่ม pill; add `community-findgroup-section` div; remove `guild-search-sheet` bottom sheet (no longer needed) |
| `js/supabase-client.js` | Extend `searchGuilds` to return score; extend `sendJoinRequest` to notify leader |
| `supabase/patch_group_management.sql` | New patch: `ALTER TABLE guilds ADD COLUMN IF NOT EXISTS announcement TEXT` |

---

## Out of Scope (not in this fix)

- Group events system (no `guild_events` table — no clear spec for what an event is in this prototype)
- Transfer leadership (no spec; current leader must delete + members rejoin under new leader)
- Group max-members setting via UI (already enforced at DB level; changing it is admin-level, skipped)
- Multiple announcements / announcement history (single text field covers MVP need)
- Inline discussion embed in กลุ่มของฉัน (link to ถกเถียง tab is sufficient; avoids duplication)

---

## Verify Checklist

After implementation, check each of these:

**อันดับ tab:**
- [ ] Expand any guild card — no copy button, no delete button

**กลุ่มของฉัน — no group state:**
- [ ] No "ค้นหากลุ่ม" button visible
- [ ] Create + join-by-code still work
- [ ] Pending request banner shows if you have a pending request

**กลุ่มของฉัน — in group (member view):**
- [ ] Header: group name, online count, invite code
- [ ] Announcements section: shows announcement text or "ยังไม่มีประกาศ"
- [ ] No edit controls for announcements
- [ ] Party: member list with online dots
- [ ] No kick buttons (member, not leader)
- [ ] Collaborative missions section renders mission cards
- [ ] Raids info card shows online count
- [ ] "เปิดการถกเถียง" button switches to ถกเถียง sub-tab
- [ ] Leave group button present

**กลุ่มของฉัน — in group (leader view):**
- [ ] [แก้ไขกลุ่ม] button visible in header
- [ ] Editing group name works (updates `guilds.name`)
- [ ] Editing announcement saves to `guilds.announcement` and re-renders
- [ ] Pending join requests section visible (if any pending)
- [ ] Approve request → user added to members, request disappears
- [ ] Reject request → request disappears
- [ ] Kick button visible on each member row
- [ ] Leave group button hidden (leader cannot leave, only delete)
- [ ] Delete group button visible at bottom

**หากลุ่ม tab:**
- [ ] New "หากลุ่ม" pill visible in community sub-tabs
- [ ] Default load shows list of public groups
- [ ] Search by name filters results
- [ ] Each card shows name, member count, score, request button
- [ ] "ขอเข้าร่วม" → button changes to "รอการอนุมัติ" (disabled)
- [ ] Guild leader receives notification in notification bell
- [ ] If already in a guild → all request buttons disabled, banner shown
- [ ] If user is already member of a specific guild → that guild shows "คุณอยู่แล้ว"
