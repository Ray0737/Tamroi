# Co-op Fixes + Community Tab — Design Spec
Date: 2026-06-30

## Summary

Six changes to the co-op/guild system and navigation:

1. Rename "Rank" bottom-nav tab → **Community**, with three sub-tabs inside
2. Full guild hub ("กลุ่มของฉัน") as a sub-tab replacing the current side-panel in Rank
3. Fix member list not showing + auto-reload on new joins
4. Fix raw "duplicate key" error → friendly Thai message
5. Request-to-join flow + clipboard invite button
6. General community forum (ถกเถียง) moved out of Collection

---

## 1. Bottom Nav

| Before | After |
|--------|-------|
| Map · Collection · Mission · Rank | Map · Collection · Mission · **Community** |

The `data-tab="leaderboard"` button and `#tab-leaderboard` section are renamed to `community`. The nav label changes to "Community" (keep same icon or swap to a people icon).

---

## 2. Community Tab Structure

Inside `#tab-community`, a pill row controls three views:

```
[ อันดับ ] [ กลุ่มของฉัน ] [ ถกเถียง ]
```

- **อันดับ** — existing leaderboard content (solo/guild sub-toggle, podium, rank list). No functional change.
- **กลุ่มของฉัน** — new guild hub (section 3 below).
- **ถกเถียง** — general community forum (section 5 below).

Default active pill: อันดับ.

The old "เดี่ยว / กลุ่ม" leaderboard pill row is kept inside the อันดับ section unchanged.

---

## 3. Guild Hub ("กลุ่มของฉัน")

Replaces the current `#guild-panel` / `#guild-leaderboard-section` inside the Rank tab. Rendered by the existing `GuildModule.renderGuildPanel()` (extended).

### 3a. No-guild state
Same as today: name input → Create, code input → Join. Plus a new **Browse & Request** button that opens a search modal (section 4b).

### 3b. In-guild state — Member view
- Guild name header + 6-char invite code + **Copy** button (copies code to clipboard, shows "คัดลอกแล้ว!" for 1.5 s)
- Member list with online dot (existing presence subscription)
- **Auto-reload on new member join**: `DB.Coop.subscribeGuildMembers(guildId, callback)` — postgres_changes INSERT on `guild_members` for this `guild_id`. On fire: re-fetch `getGuildMembers`, update `_state.members`, call `_refreshMemberList()`.
- Leave button

### 3c. In-guild state — Leader (admin) view
Everything above, plus:
- **Kick** button per member (existing)
- **Pending requests** badge on a "คำขอเข้าร่วม" row — count of `status='pending'` in `guild_join_requests`. Tapping opens a list; each row has Approve / Reject buttons.
  - Approve: inserts into `guild_members` + sets request `status='approved'`
  - Reject: sets request `status='rejected'`

---

## 4. Invite & Request-to-Join

### 4a. Invite button (clipboard)
In the guild panel header, next to the invite code:
```
รหัสเชิญ  [A B C 1 2 3]  [Copy]
```
`navigator.clipboard.writeText(guild.invite_code)` — no new DB needed.

### 4b. Request to Join
On the no-guild screen, a "ค้นหากลุ่ม" button opens a bottom sheet:
- Text input: search guild by name (client-side `ilike` query on `guilds.name`)
- Results list: guild name + member count. "ขอเข้าร่วม" button per row.
- Sends INSERT into `guild_join_requests (guild_id, user_id, status='pending')`.
- If a pending request already exists: show "รอการอนุมัติอยู่" (no duplicate insert).
- User sees their pending request status on the no-guild screen: "⏳ รอการอนุมัติจาก [guild name]".

### 4c. DB — guild_join_requests
```sql
create table guild_join_requests (
  id          uuid primary key default gen_random_uuid(),
  guild_id    uuid not null references guilds(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now(),
  unique (guild_id, user_id)
);
-- RLS
alter table guild_join_requests enable row level security;
create policy "member can insert own request"
  on guild_join_requests for insert with check (auth.uid() = user_id);
create policy "member can read own request"
  on guild_join_requests for select using (auth.uid() = user_id);
create policy "leader can read guild requests"
  on guild_join_requests for select
  using (exists (
    select 1 from guild_members
    where guild_members.guild_id = guild_join_requests.guild_id
      and guild_members.user_id = auth.uid()
      and guild_members.role = 'leader'
  ));
create policy "leader can update guild requests"
  on guild_join_requests for update
  using (exists (
    select 1 from guild_members
    where guild_members.guild_id = guild_join_requests.guild_id
      and guild_members.user_id = auth.uid()
      and guild_members.role = 'leader'
  ));
```

---

## 5. General Community Forum (ถกเถียง)

### 5a. Collection tab changes
- Remove the `data-filter="discuss"` pill from `#collection-filters`
- Remove the `#discussion-panel` div and all `discuss` filter logic from `collection.js`
- The figure-specific discussion (triggered via `showDetail` when filter=discuss) is removed. Figure discussions are no longer accessible (they were barely used; the data stays in DB).

### 5b. Forum UI
Simple flat thread with top-level posts + one level of replies (same pattern as existing DiscussionModule).

Feed shows 50 most recent top-level posts, newest first. Each post shows:
- Avatar initials + username + time ago
- Content text
- Reply count → tap to expand replies inline
- Flag button (not own posts)

Compose box at the top: textarea + Post button.

Rendered by a new `CommunityForumModule` in `js/community-forum.js`.

### 5c. DB — community_posts
```sql
create table community_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null check (char_length(content) <= 500),
  parent_id   uuid references community_posts(id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table community_posts enable row level security;
create policy "anyone can read"
  on community_posts for select using (true);
create policy "authenticated can insert own"
  on community_posts for insert with check (auth.uid() = user_id);
```

`DB.Community` namespace in `supabase-client.js`:
- `getPosts()` — top-level posts with profiles join + reply count
- `getReplies(parentId)` — replies for a post
- `postMessage(userId, content, parentId?)` — insert
- `flagPost(postId, userId)` — reuse existing `discussion_flags` table or same pattern

---

## 6. Bug Fixes

### 6a. Duplicate-join error
In `DB.Coop.joinGuild`: after the INSERT, if `error.code === '23505'` throw `new Error('คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว')` instead of re-throwing the raw Supabase error.

### 6b. Member list auto-reload
`DB.Coop.subscribeGuildMembers(guildId, callback)` — wraps a `postgres_changes` channel on `guild_members` filtered by `guild_id=eq.{guildId}` for INSERT/DELETE events. Called in `GuildModule.subscribePresence()` alongside the presence channel.

---

## 7. DB Patch File

New file: `supabase/patch_coop_fix.sql`
- `guild_join_requests` table + RLS (section 4c)
- `community_posts` table + RLS (section 5c)
- Helper function `search_guilds(query text)` — returns `(id, name, member_count)` for ilike search (avoids exposing full guilds table to clients)

---

## 8. Files Changed

| File | Change |
|------|--------|
| `app.html` | Rename tab/nav; add Community sub-tabs; add guild hub section; add forum section; remove discuss pill from Collection |
| `js/guild.js` | Extend renderGuildPanel with copy button, join requests panel, member subscription |
| `js/supabase-client.js` | `Coop.joinGuild` error fix; `Coop.subscribeGuildMembers`; `Coop.getJoinRequests`; `Coop.approveRequest`; `Coop.rejectRequest`; `Coop.sendJoinRequest`; `Coop.searchGuilds`; new `DB.Community` namespace |
| `js/community-forum.js` | New file — general forum module |
| `js/collection.js` | Remove discuss filter logic |
| `js/app.js` | Update tab navigation for renamed tab |
| `supabase/patch_coop_fix.sql` | New file — guild_join_requests + community_posts |
| `COOP_FIX_INSTRUCTIONS.md` | Verification checklist (root of repo) |

---

## Out of Scope

- Push notifications for join request approval (can add later)
- Guild announcements tab (mentioned in original request but no current data model — add when needed)
- Raid UI changes (existing raid module untouched)
- Figure-specific discussion data is preserved in DB but the UI entry point is removed
