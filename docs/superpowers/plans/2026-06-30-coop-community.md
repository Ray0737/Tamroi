# Co-op Community Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix guild member display + duplicate-join error, add real-time member reload, request-to-join + clipboard invite, rename Rank → Community tab with sub-tabs (อันดับ / กลุ่มของฉัน / ถกเถียง), and add a general community forum.

**Architecture:** Vanilla JS module pattern, no build step. All DB work goes through `supabase-client.js`. New `CommunityForumModule` in its own file. Tab rename is a string/ID swap; community sub-tabs are pill-driven show/hide, handled in `app.js`.

**Tech Stack:** HTML5 · Bootstrap 5.3 · Vanilla JS ES6 modules · Supabase (PostgreSQL + Realtime)

## Global Constraints

- No npm, no build step, no framework — serve with VS Code Live Server (port 5500)
- All JS uses IIFE module pattern: `const XModule = (() => { ... })(); window.XModule = XModule;`
- All user-visible strings use `escapeHtml()` before `innerHTML`
- All Supabase calls go through `js/supabase-client.js` — never call `_sb` (the Supabase client) from page modules
- CSS variables only — never hardcode hex colors
- Max content width 430px
- `js/env.js` holds public Supabase anon config — never put secrets there

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `supabase/patch_coop_fix.sql` | Create | `guild_join_requests`, `community_posts`, `community_post_flags` tables + RLS |
| `js/supabase-client.js` | Modify | Fix duplicate-join error; add `subscribeGuildMembers`, join-request methods, `DB.Community` namespace |
| `app.html` | Modify | Rename Rank→Community nav; add community sub-tabs; move guild panel; add forum panel; remove discuss pill from Collection; add guild-search bottom sheet; load `community-forum.js` |
| `js/app.js` | Modify | Rename `'leaderboard'` → `'community'` everywhere; add community sub-tab binding + switching |
| `js/guild.js` | Modify | Add member subscription; copy invite button; join-requests panel (leader); search bottom sheet binding; pending-request display on no-guild screen |
| `js/community-forum.js` | Create | `CommunityForumModule` — general forum feed, post, reply, flag |
| `js/collection.js` | Modify | Remove discuss filter logic |
| `tests/coop-static.test.mjs` | Modify | Update assertions for renamed/moved elements |

---

## Task 1: DB Patch SQL

**Files:**
- Create: `supabase/patch_coop_fix.sql`

**Interfaces:**
- Produces: `guild_join_requests`, `community_posts`, `community_post_flags` tables available in Supabase

- [ ] **Step 1: Create the SQL patch file**

```sql
-- supabase/patch_coop_fix.sql

-- ── guild_join_requests ────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_join_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id   UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, user_id)
);
ALTER TABLE guild_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member can insert own request"
  ON guild_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member can read own request"
  ON guild_join_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "leader can read guild requests"
  ON guild_join_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM guild_members
    WHERE guild_members.guild_id = guild_join_requests.guild_id
      AND guild_members.user_id = auth.uid()
      AND guild_members.role = 'leader'
  ));

CREATE POLICY "leader can update guild requests"
  ON guild_join_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM guild_members
    WHERE guild_members.guild_id = guild_join_requests.guild_id
      AND guild_members.user_id = auth.uid()
      AND guild_members.role = 'leader'
  ));

-- ── community_posts ────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 500),
  parent_id  UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read community_posts"
  ON community_posts FOR SELECT USING (true);

CREATE POLICY "authenticated can insert own community_post"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── community_post_flags ───────────────────────────────
CREATE TABLE IF NOT EXISTS community_post_flags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, flagged_by)
);
ALTER TABLE community_post_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can flag"
  ON community_post_flags FOR INSERT
  WITH CHECK (auth.uid() = flagged_by);
```

- [ ] **Step 2: Run the patch in Supabase**

Go to Supabase dashboard → SQL Editor → paste the file content → Run.
Verify in Table Editor that `guild_join_requests`, `community_posts`, `community_post_flags` all appear with RLS enabled.

- [ ] **Step 3: Commit**

```bash
git add supabase/patch_coop_fix.sql
git commit -m "feat: add guild_join_requests + community_posts DB tables"
```

---

## Task 2: Extend supabase-client.js

**Files:**
- Modify: `js/supabase-client.js`

**Interfaces:**
- Consumes: existing `_sb` Supabase client, existing `Coop` object
- Produces:
  - `DB.Coop.joinGuild` — throws `'คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว'` on duplicate
  - `DB.Coop.subscribeGuildMembers(guildId, callback)` → Supabase channel
  - `DB.Coop.searchGuilds(query)` → `Array<{id, name, member_count}>`
  - `DB.Coop.sendJoinRequest(guildId, userId)` → request row
  - `DB.Coop.getMyPendingRequest(userId)` → `{id, guild_id, status, guilds:{name}} | null`
  - `DB.Coop.getJoinRequests(guildId)` → `Array<{id, user_id, profiles:{username}}>`
  - `DB.Coop.approveRequest(requestId, guildId, targetUserId)` → void
  - `DB.Coop.rejectRequest(requestId)` → void
  - `DB.Community.getPosts()` → `Array<post>`
  - `DB.Community.getReplies(parentId)` → `Array<post>`
  - `DB.Community.postMessage(userId, content, parentId?)` → post row
  - `DB.Community.flagPost(postId, userId)` → void

- [ ] **Step 1: Fix duplicate-join error in `joinGuild`**

Find the `joinGuild` function (~line 508). Replace:
```js
    if (error) throw error;
    return data;
```
with:
```js
    if (error) {
      if (error.code === '23505') throw new Error('คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว');
      throw error;
    }
    return data;
```

- [ ] **Step 2: Add `subscribeGuildMembers` to the `Coop` object**

After the existing `getGuildLeaderboard` method (before the closing `};` of `Coop`), add:
```js
  subscribeGuildMembers(guildId, callback) {
    return _sb.channel(`guild-members-${guildId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'guild_members',
        filter: `guild_id=eq.${guildId}`
      }, callback)
      .subscribe();
  },
```

- [ ] **Step 3: Add join-request methods to `Coop`**

After `subscribeGuildMembers`, add:
```js
  async searchGuilds(query) {
    const { data, error } = await _sb
      .from('guilds')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(10);
    if (error) throw error;
    const results = await Promise.all((data || []).map(async g => {
      const { count } = await _sb
        .from('guild_members')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', g.id);
      return { ...g, member_count: count || 0 };
    }));
    return results;
  },

  async sendJoinRequest(guildId, userId) {
    const { data: existing } = await _sb
      .from('guild_join_requests')
      .select('id, status')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) return existing;
    const { data, error } = await _sb
      .from('guild_join_requests')
      .insert({ guild_id: guildId, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMyPendingRequest(userId) {
    const { data } = await _sb
      .from('guild_join_requests')
      .select('id, guild_id, status, guilds(name)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    return data || null;
  },

  async getJoinRequests(guildId) {
    const { data, error } = await _sb
      .from('guild_join_requests')
      .select('id, user_id, created_at, profiles(username)')
      .eq('guild_id', guildId)
      .eq('status', 'pending')
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async approveRequest(requestId, guildId, targetUserId) {
    const { error: memberErr } = await _sb
      .from('guild_members')
      .insert({ guild_id: guildId, user_id: targetUserId, role: 'member' });
    if (memberErr && memberErr.code !== '23505') throw memberErr;
    const { error } = await _sb
      .from('guild_join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);
    if (error) throw error;
  },

  async rejectRequest(requestId) {
    const { error } = await _sb
      .from('guild_join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    if (error) throw error;
  },
```

- [ ] **Step 4: Add `Community` namespace before the `window.DB` line**

Find the `window.DB = { ... }` line at the bottom of the file. Above it, add:
```js
// ── Community ──────────────────────────────────────────
const Community = {
  async getPosts() {
    const { data, error } = await _sb
      .from('community_posts')
      .select('*, profiles(username)')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async getReplies(parentId) {
    const { data, error } = await _sb
      .from('community_posts')
      .select('*, profiles(username)')
      .eq('parent_id', parentId)
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async postMessage(userId, content, parentId = null) {
    const { data, error } = await _sb
      .from('community_posts')
      .insert({ user_id: userId, content, parent_id: parentId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async flagPost(postId, userId) {
    const { error } = await _sb
      .from('community_post_flags')
      .insert({ post_id: postId, flagged_by: userId });
    if (error && error.code !== '23505') throw error;
  },
};
```

- [ ] **Step 5: Add `Community` to the `window.DB` export**

Find:
```js
window.DB = { Auth, Profiles, Districts, Figures, SupportNodes, BtsMrtStations, Artifacts, Leaderboard, Lore, Quiz, Notifications, Missions, Coop, Raid, Discussion };
```
Replace with:
```js
window.DB = { Auth, Profiles, Districts, Figures, SupportNodes, BtsMrtStations, Artifacts, Leaderboard, Lore, Quiz, Notifications, Missions, Coop, Raid, Discussion, Community };
```

- [ ] **Step 6: Commit**

```bash
git add js/supabase-client.js
git commit -m "feat: extend DB.Coop with member sub + join requests; add DB.Community"
```

---

## Task 3: Restructure app.html

**Files:**
- Modify: `app.html`

**Interfaces:**
- Consumes: existing tab/nav IDs; existing guild-panel, leaderboard IDs
- Produces:
  - `data-tab="community"` nav button replacing `data-tab="leaderboard"`
  - `#tab-community` section with `#community-rank-section`, `#community-guild-section`, `#community-forum-section`
  - `[data-community-tab]` pills: `rank`, `mygroup`, `discuss`
  - `#guild-panel` inside `#community-guild-section`
  - `#community-forum-panel` inside `#community-forum-section`
  - `#guild-search-sheet` bottom sheet
  - `data-filter="discuss"` pill REMOVED from collection filters
  - `#discussion-panel` div REMOVED from collection section
  - `<script src="js/community-forum.js">` added

- [ ] **Step 1: Remove discuss pill from Collection filters**

Find in the collection section:
```html
            <button class="pill" data-filter="discuss">💬 ถกเถียง</button>
```
Delete that line.

- [ ] **Step 2: Remove `#discussion-panel` from Collection section**

Find:
```html
          <div id="discussion-panel" hidden style="padding-top:var(--space-sm)"></div>
```
Delete that line.

- [ ] **Step 3: Rename the bottom nav Rank button**

Find:
```html
    <button class="nav-item" data-tab="leaderboard">
```
Replace with:
```html
    <button class="nav-item" data-tab="community">
```

Find the nav label inside that button:
```html
      <span class="nav-label">Rank</span>
```
Replace with:
```html
      <span class="nav-label">Community</span>
```

- [ ] **Step 4: Replace the entire leaderboard tab section**

Find the entire `<section id="tab-leaderboard" ...>...</section>` block and replace it with:

```html
    <!-- ── TAB: COMMUNITY ──────────────────────── -->
    <section id="tab-community" class="tab-section">
      <div class="section-scroll">
        <div class="section-inner" style="display:flex;flex-direction:column;gap:var(--space-md)">

          <!-- Community sub-tab pills -->
          <div class="filter-pills" id="community-sub-tabs">
            <button class="pill active" data-community-tab="rank">อันดับ</button>
            <button class="pill" data-community-tab="mygroup">กลุ่มของฉัน</button>
            <button class="pill" data-community-tab="discuss">ถกเถียง</button>
          </div>

          <!-- ── อันดับ ── -->
          <div id="community-rank-section" style="display:flex;flex-direction:column;gap:var(--space-md)">
            <div class="filter-pills" id="leaderboard-view">
              <button class="pill active" data-view="solo">เดี่ยว</button>
              <button class="pill" data-view="guild">กลุ่ม</button>
            </div>
            <div id="solo-leaderboard-section">
              <div class="filter-pills" id="leaderboard-period">
                <button class="pill active" data-period="weekly">Weekly</button>
                <button class="pill" data-period="monthly">Monthly</button>
                <button class="pill" data-period="alltime">All-Time</button>
              </div>
              <div class="filter-pills" id="leaderboard-metric">
                <button class="pill active" data-metric="legacy">Legacy Score</button>
                <button class="pill" data-metric="discovery">Map Discovery</button>
                <button class="pill" data-metric="archive">Archive</button>
              </div>
              <div class="card" id="leaderboard-podium" style="padding:0 var(--space-sm) var(--space-sm)"></div>
              <div id="my-rank-card"></div>
              <div class="card" style="padding:var(--space-sm)">
                <div id="leaderboard-list">
                  <div style="display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>
                </div>
              </div>
            </div>
            <div id="guild-leaderboard-section" hidden style="display:flex;flex-direction:column;gap:var(--space-md)">
              <div id="guild-leaderboard-list"></div>
            </div>
          </div>

          <!-- ── กลุ่มของฉัน ── -->
          <div id="community-guild-section" hidden>
            <div id="guild-panel">
              <div style="display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>
            </div>
          </div>

          <!-- ── ถกเถียง ── -->
          <div id="community-forum-section" hidden>
            <div id="community-forum-panel"></div>
          </div>

        </div>
      </div>
    </section>
```

- [ ] **Step 5: Add guild-search bottom sheet**

Find the closing `</body>` tag. Before it (alongside other bottom sheets), add:

```html
  <!-- ── Guild Search Sheet ── -->
  <div class="bottom-sheet" id="guild-search-sheet" hidden>
    <div class="bottom-sheet-handle"></div>
    <h3 style="font-family:var(--font-heading);font-size:16px;font-weight:700;
               margin:0 0 var(--space-sm)">ค้นหากลุ่ม</h3>
    <div style="display:flex;gap:8px;margin-bottom:var(--space-sm)">
      <input id="guild-search-input" type="text" placeholder="ชื่อกลุ่ม..."
             style="flex:1;background:var(--color-card-darker);border:1px solid var(--color-border);
                    border-radius:var(--radius-md);padding:10px var(--space-sm);
                    color:var(--color-white);font-size:13px">
      <button class="btn btn-primary" id="btn-guild-search" style="white-space:nowrap">ค้นหา</button>
    </div>
    <div id="guild-search-results" style="display:flex;flex-direction:column;gap:8px"></div>
  </div>
```

- [ ] **Step 6: Add community-forum.js script tag**

Find:
```html
<script src="js/discussion.js"></script>
```
After it, add:
```html
<script src="js/community-forum.js"></script>
```

- [ ] **Step 7: Verify the page still loads (no JS errors)**

Open `app.html` in Live Server. Open DevTools console. Login and confirm no errors appear on page load.

- [ ] **Step 8: Commit**

```bash
git add app.html
git commit -m "feat: rename Rank→Community tab; add community sub-tabs and guild-search sheet"
```

---

## Task 4: Update app.js

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `window.LeaderboardModule`, `window.GuildModule`, `window.CommunityForumModule`
- Produces: `switchTab('community')` works; `_switchCommunityTab(view)` binds sub-tabs

- [ ] **Step 1: Rename all `'leaderboard'` references to `'community'`**

In `switchTab()`, find:
```js
  if (previousTab === 'leaderboard' && tab !== 'leaderboard') {
    window.LeaderboardModule?.unsubscribe?.();
  }
```
Replace with:
```js
  if (previousTab === 'community' && tab !== 'community') {
    window.LeaderboardModule?.unsubscribe?.();
  }
```

Find:
```js
  const titles = { map: '', collection: 'Collection', mission: 'Missions', leaderboard: 'Leaderboard' };
```
Replace with:
```js
  const titles = { map: '', collection: 'Collection', mission: 'Missions', community: 'Community' };
```

Find:
```js
  } else if (tab === 'leaderboard') {
    window.LeaderboardModule?.load();
    window.GuildModule?.renderGuildPanel();
  }
```
Replace with:
```js
  } else if (tab === 'community') {
    const activePill = document.querySelector('[data-community-tab].active');
    _switchCommunityTab(activePill?.dataset.communityTab || 'rank');
  }
```

- [ ] **Step 2: Add `_switchCommunityTab` function**

After `switchTab()`, add:

```js
function _switchCommunityTab(view) {
  ['community-rank-section', 'community-guild-section', 'community-forum-section']
    .forEach(id => document.getElementById(id)?.setAttribute('hidden', ''));

  if (view === 'rank') {
    document.getElementById('community-rank-section')?.removeAttribute('hidden');
    window.LeaderboardModule?.load();
  } else if (view === 'mygroup') {
    document.getElementById('community-guild-section')?.removeAttribute('hidden');
    window.GuildModule?.renderGuildPanel();
  } else if (view === 'discuss') {
    document.getElementById('community-forum-section')?.removeAttribute('hidden');
    window.CommunityForumModule?.load();
  }
}
```

- [ ] **Step 3: Bind community sub-tab pills**

In `bindNavigation()` or just after it, add a call to a new function:

```js
function bindCommunitySubTabs() {
  document.querySelectorAll('[data-community-tab]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-community-tab]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      _switchCommunityTab(pill.dataset.communityTab);
    });
  });
}
```

Then in the `init()` / boot function (wherever `bindNavigation()` is called), also call `bindCommunitySubTabs()`.

- [ ] **Step 4: Verify tab navigation works in browser**

Open Live Server. Login. Tap Community in the nav. Confirm sub-tab pills switch content. Tap อันดับ → leaderboard loads. Tap กลุ่มของฉัน → guild panel loads. Tap ถกเถียง → forum panel loads (may be empty).

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "feat: wire community tab + sub-tab switching in app.js"
```

---

## Task 5: Extend guild.js

**Files:**
- Modify: `js/guild.js`

**Interfaces:**
- Consumes: `DB.Coop.subscribeGuildMembers`, `DB.Coop.getJoinRequests`, `DB.Coop.approveRequest`, `DB.Coop.rejectRequest`, `DB.Coop.searchGuilds`, `DB.Coop.sendJoinRequest`, `DB.Coop.getMyPendingRequest`, `window.AppCore.openSheet`
- Produces: updated `renderGuildPanel()` (now async), `subscribeMembers()` added to module

- [ ] **Step 1: Add `_membersChannel` variable and `subscribeMembers` function**

At the top of the IIFE, alongside the existing `let _presenceChannel = null;`, add:
```js
  let _membersChannel = null;
```

After `subscribePresence()`, add:
```js
  function subscribeMembers() {
    if (!_state?.guild?.id) return;
    if (_membersChannel) { try { _membersChannel.unsubscribe(); } catch {} }
    _membersChannel = DB.Coop.subscribeGuildMembers(_state.guild.id, async () => {
      try {
        _state.members = await DB.Coop.getGuildMembers(_state.guild.id);
        _refreshMemberList();
      } catch {}
    });
  }
```

- [ ] **Step 2: Call `subscribeMembers()` in `init()`**

Find:
```js
    if (_state) subscribePresence();
```
Replace with:
```js
    if (_state) { subscribePresence(); subscribeMembers(); }
```

- [ ] **Step 3: Make `renderGuildPanel` async + fetch join requests for leader**

Change the function signature:
```js
  async function renderGuildPanel() {
```

In the in-guild branch, after `const { guild, members } = _state;`, add:
```js
    const requests = guild.myRole === 'leader'
      ? await DB.Coop.getJoinRequests(guild.id).catch(() => [])
      : [];
```

- [ ] **Step 4: Add copy button to guild header**

Find the invite code display block in `renderGuildPanel`:
```js
            <div style="text-align:right">
              <p style="margin:0;font-size:10px;color:var(--color-muted)">รหัสเชิญ</p>
              <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:var(--color-primary);
                         letter-spacing:3px;font-family:monospace">${escapeHtml(guild.invite_code)}</p>
            </div>
```
Replace with:
```js
            <div style="text-align:right">
              <p style="margin:0;font-size:10px;color:var(--color-muted)">รหัสเชิญ</p>
              <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
                <p style="margin:0;font-size:15px;font-weight:700;color:var(--color-primary);
                           letter-spacing:3px;font-family:monospace">${escapeHtml(guild.invite_code)}</p>
                <button id="btn-copy-invite"
                        style="font-size:10px;color:var(--color-muted);background:none;
                               border:1px solid var(--color-border);border-radius:var(--radius-sm);
                               padding:3px 8px;cursor:pointer">คัดลอก</button>
              </div>
            </div>
```

Then after `el.querySelector('#btn-leave-guild')?.addEventListener(...)`, add:
```js
    el.querySelector('#btn-copy-invite')?.addEventListener('click', _handleCopyInvite);
```

- [ ] **Step 5: Add `_handleCopyInvite` function**

```js
  async function _handleCopyInvite() {
    if (!_state?.guild?.invite_code) return;
    await navigator.clipboard.writeText(_state.guild.invite_code);
    const btn = document.getElementById('btn-copy-invite');
    if (!btn) return;
    btn.textContent = 'คัดลอกแล้ว!';
    setTimeout(() => { if (btn) btn.textContent = 'คัดลอก'; }, 1500);
  }
```

- [ ] **Step 6: Add join-requests panel for leader**

In the `renderGuildPanel` template, after the member-list div and before the leave button div, add:
```js
        ${requests.length ? `
          <div style="padding:0 var(--space-md) var(--space-sm)">
            <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;
                       letter-spacing:1px;color:var(--color-primary);font-weight:600">
              คำขอเข้าร่วม (${requests.length})</p>
            <div id="join-requests-list" style="display:flex;flex-direction:column;gap:6px">
              ${requests.map(r => `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 0;
                            border-bottom:1px solid rgba(255,255,255,0.04)">
                  <div style="flex:1;font-size:13px;font-weight:600">
                    ${escapeHtml(r.profiles?.username || '?')}</div>
                  <button class="btn btn-primary"
                          style="font-size:10px;padding:4px 10px"
                          data-approve="${escapeHtml(r.id)}"
                          data-uid="${escapeHtml(r.user_id)}">อนุมัติ</button>
                  <button style="font-size:10px;color:var(--color-muted);background:none;
                                 border:1px solid var(--color-border);
                                 border-radius:var(--radius-sm);padding:4px 10px;cursor:pointer"
                          data-reject="${escapeHtml(r.id)}">ปฏิเสธ</button>
                </div>`).join('')}
            </div>
          </div>` : ''}
```

After binding kick buttons, add:
```js
    el.querySelectorAll('[data-approve]').forEach(btn =>
      btn.addEventListener('click', () =>
        _handleApprove(btn.dataset.approve, guild.id, btn.dataset.uid))
    );
    el.querySelectorAll('[data-reject]').forEach(btn =>
      btn.addEventListener('click', () => _handleReject(btn.dataset.reject))
    );
```

- [ ] **Step 7: Add `_handleApprove` and `_handleReject` functions**

```js
  async function _handleApprove(requestId, guildId, targetUserId) {
    try {
      await DB.Coop.approveRequest(requestId, guildId, targetUserId);
      await renderGuildPanel();
    } catch (e) {
      alert(e.message || 'อนุมัติไม่สำเร็จ');
    }
  }

  async function _handleReject(requestId) {
    try {
      await DB.Coop.rejectRequest(requestId);
      await renderGuildPanel();
    } catch (e) {
      alert(e.message || 'เกิดข้อผิดพลาด');
    }
  }
```

- [ ] **Step 8: Update `_renderNoGuild` to accept `pendingRequest` + show search button**

Change signature and add pending display + search button:
```js
  function _renderNoGuild(pendingRequest) {
    return `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                  border:1px dashed var(--color-border);padding:var(--space-lg);text-align:center">
        <p style="font-size:32px;margin:0 0 var(--space-sm)">🤝</p>
        <h3 style="font-family:var(--font-heading);font-size:16px;font-weight:700;margin:0 0 6px">
          ยังไม่มีกลุ่ม</h3>
        <p style="font-size:12px;color:var(--color-muted);margin:0 0 var(--space-md)">
          สร้างหรือเข้าร่วมกลุ่มเพื่อเล่นร่วมกับเพื่อน</p>
        ${pendingRequest ? `
          <div style="padding:var(--space-sm);background:rgba(255,126,85,0.08);
                      border-radius:var(--radius-md);border:1px solid rgba(255,126,85,0.2);
                      margin-bottom:var(--space-sm)">
            <p style="margin:0;font-size:12px;color:var(--color-primary)">
              ⏳ รอการอนุมัติจาก <strong>${escapeHtml(pendingRequest.guilds?.name || '...')}</strong>
            </p>
          </div>` : ''}
        <input id="guild-name-input" type="text" placeholder="ชื่อกลุ่มใหม่..."
               style="width:100%;background:var(--color-card-darker);border:1px solid var(--color-border);
                      border-radius:var(--radius-md);padding:10px var(--space-sm);color:var(--color-white);
                      font-size:13px;margin-bottom:8px">
        <button class="btn btn-primary btn-full" id="btn-create-guild" style="margin-bottom:var(--space-sm)">
          สร้างกลุ่มใหม่</button>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="guild-code-input" type="text" placeholder="รหัสเชิญ (6 ตัว)..."
                 maxlength="6"
                 style="flex:1;background:var(--color-card-darker);border:1px solid var(--color-border);
                        border-radius:var(--radius-md);padding:10px var(--space-sm);color:var(--color-white);
                        font-size:13px;text-transform:uppercase">
          <button class="btn btn-outline" id="btn-join-guild" style="white-space:nowrap">เข้าร่วม</button>
        </div>
        <button class="btn btn-ghost btn-full" id="btn-search-guild"
                style="font-size:12px;color:var(--color-muted);border-color:var(--color-border)">
          ค้นหากลุ่ม</button>
        <p id="guild-error" style="font-size:11px;color:#ef5350;margin:6px 0 0;min-height:16px"></p>
      </div>`;
  }
```

- [ ] **Step 9: Update `renderGuildPanel` no-guild branch to fetch pending request**

Find the no-guild branch:
```js
    if (!_state) {
      el.innerHTML = _renderNoGuild();
      _bindNoGuildActions(el);
      return;
    }
```
Replace with:
```js
    if (!_state) {
      const pendingReq = _userId
        ? await DB.Coop.getMyPendingRequest(_userId).catch(() => null)
        : null;
      el.innerHTML = _renderNoGuild(pendingReq);
      _bindNoGuildActions(el);
      return;
    }
```

- [ ] **Step 10: Add search button to `_bindNoGuildActions` + add search handler functions**

```js
  function _bindNoGuildActions(el) {
    el.querySelector('#btn-create-guild')?.addEventListener('click', _handleCreate);
    el.querySelector('#btn-join-guild')?.addEventListener('click', _handleJoin);
    el.querySelector('#btn-search-guild')?.addEventListener('click', _openSearchSheet);
  }

  function _openSearchSheet() {
    window.AppCore?.openSheet('guild-search-sheet');
    // bind search button (re-bind each open to avoid stale closures)
    const searchBtn = document.getElementById('btn-guild-search');
    if (searchBtn) {
      const clone = searchBtn.cloneNode(true);
      searchBtn.replaceWith(clone);
      clone.addEventListener('click', _handleGuildSearch);
    }
  }

  async function _handleGuildSearch() {
    const query     = document.getElementById('guild-search-input')?.value?.trim();
    const resultsEl = document.getElementById('guild-search-results');
    if (!query || !resultsEl) return;

    resultsEl.innerHTML = `<div style="display:flex;justify-content:center;padding:20px">
      <div class="spinner"></div></div>`;
    try {
      const guilds = await DB.Coop.searchGuilds(query);
      if (!guilds.length) {
        resultsEl.innerHTML = `<p style="text-align:center;color:var(--color-muted);
          font-size:12px;padding:var(--space-md)">ไม่พบกลุ่ม</p>`;
        return;
      }
      resultsEl.innerHTML = guilds.map(g => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;
                    background:var(--color-card-darker);border-radius:var(--radius-md)">
          <div style="flex:1">
            <p style="margin:0;font-size:13px;font-weight:600">${escapeHtml(g.name)}</p>
            <p style="margin:0;font-size:11px;color:var(--color-muted)">${g.member_count} สมาชิก</p>
          </div>
          <button class="btn btn-primary"
                  style="font-size:11px;padding:6px 12px;white-space:nowrap"
                  data-request-guild="${escapeHtml(g.id)}">ขอเข้าร่วม</button>
        </div>`).join('');

      resultsEl.querySelectorAll('[data-request-guild]').forEach(btn =>
        btn.addEventListener('click', () => _handleRequestJoin(btn.dataset.requestGuild, btn))
      );
    } catch {
      resultsEl.innerHTML = `<p style="text-align:center;color:var(--color-muted);font-size:12px">
        เกิดข้อผิดพลาด</p>`;
    }
  }

  async function _handleRequestJoin(guildId, btn) {
    try {
      await DB.Coop.sendJoinRequest(guildId, _userId);
      btn.textContent = 'รอการอนุมัติ';
      btn.disabled = true;
    } catch (e) {
      alert(e.message || 'ส่งคำขอไม่สำเร็จ');
    }
  }
```

- [ ] **Step 11: Export `subscribeMembers` from the module return**

Find the `return { init, getState, getOnlineMemberIds, subscribePresence, renderGuildPanel };` line. Replace with:
```js
  return { init, getState, getOnlineMemberIds, subscribePresence, subscribeMembers, renderGuildPanel };
```

- [ ] **Step 12: Verify in browser**

Login. Go Community → กลุ่มของฉัน. If in a group: member list shows, copy button works, leader sees requests. If not in group: search sheet opens, pending request shows.

- [ ] **Step 13: Commit**

```bash
git add js/guild.js
git commit -m "feat: guild.js — copy invite, member subscription, join requests, search sheet"
```

---

## Task 6: Create js/community-forum.js

**Files:**
- Create: `js/community-forum.js`

**Interfaces:**
- Consumes: `DB.Community.getPosts`, `DB.Community.getReplies`, `DB.Community.postMessage`, `DB.Community.flagPost`, `window.AppCore.App.user`, `window.escapeHtml`
- Produces: `window.CommunityForumModule.load()`

- [ ] **Step 1: Create the file**

```js
// ── Community Forum Module ─────────────────────────────
const CommunityForumModule = (() => {

  async function load() {
    const el = document.getElementById('community-forum-panel');
    if (!el) return;
    el.innerHTML = `<div style="display:flex;justify-content:center;padding:30px">
      <div class="spinner"></div></div>`;
    try {
      const posts = await DB.Community.getPosts();
      _render(posts);
    } catch {
      el.innerHTML = `<p style="text-align:center;color:var(--color-muted);
        font-size:12px;padding:var(--space-md)">โหลดไม่ได้</p>`;
    }
  }

  function _render(posts) {
    const el   = document.getElementById('community-forum-panel');
    if (!el) return;
    const user = window.AppCore?.App?.user;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                    border:1px solid var(--color-border);padding:var(--space-sm)">
          <textarea id="forum-compose" rows="2" maxlength="500"
                    placeholder="แสดงความคิดเห็น... (สูงสุด 500 ตัวอักษร)"
                    style="width:100%;background:transparent;border:none;color:var(--color-white);
                           font-size:13px;resize:none;outline:none;font-family:inherit"></textarea>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" id="btn-forum-post"
                    style="font-size:12px;padding:6px 16px">โพสต์</button>
          </div>
        </div>
        ${!posts.length
          ? `<p style="text-align:center;color:var(--color-muted);font-size:12px;padding:var(--space-md)">
               ยังไม่มีโพสต์ — เป็นคนแรก!</p>`
          : posts.map(p => _postCard(p, user)).join('')}
      </div>`;

    document.getElementById('btn-forum-post')?.addEventListener('click', _handlePost);
    el.querySelectorAll('[data-toggle-replies]').forEach(btn =>
      btn.addEventListener('click', () => _toggleReplies(btn.dataset.toggleReplies))
    );
    el.querySelectorAll('[data-flag-post]').forEach(btn =>
      btn.addEventListener('click', () => _flagPost(btn.dataset.flagPost))
    );
  }

  function _postCard(p, user) {
    const name = escapeHtml(p.profiles?.username || 'Anonymous');
    const ago  = _timeAgo(p.created_at);
    return `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-md);
                  border:1px solid var(--color-border);padding:10px var(--space-sm)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px">
            <div class="avatar-sm" style="width:24px;height:24px;font-size:10px">
              ${name.substring(0,2).toUpperCase()}</div>
            <span style="font-size:12px;font-weight:600">${name}</span>
            <span style="font-size:10px;color:var(--color-muted)">${ago}</span>
          </div>
          ${user && p.user_id !== user.id ? `
            <button data-flag-post="${escapeHtml(p.id)}"
                    style="font-size:10px;color:var(--color-muted);background:none;
                           border:none;cursor:pointer;padding:2px 6px"
                    title="รายงาน">🚩</button>` : ''}
        </div>
        <p style="margin:0 0 6px;font-size:13px;line-height:1.5">${escapeHtml(p.content)}</p>
        <button data-toggle-replies="${escapeHtml(p.id)}"
                style="font-size:10px;color:var(--color-muted);background:none;border:none;cursor:pointer">
          ↩ ตอบกลับ</button>
        <div id="replies-${escapeHtml(p.id)}" hidden></div>
      </div>`;
  }

  async function _toggleReplies(postId) {
    const el = document.getElementById(`replies-${postId}`);
    if (!el) return;
    if (!el.hidden) { el.hidden = true; return; }

    el.innerHTML = `<div style="display:flex;justify-content:center;padding:10px">
      <div class="spinner" style="width:16px;height:16px"></div></div>`;
    el.hidden = false;

    try {
      const replies = await DB.Community.getReplies(postId);
      el.innerHTML = `
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:6px">
          ${replies.map(r => `
            <div style="margin-left:16px;border-left:2px solid rgba(255,126,85,0.3);
                        padding-left:10px;padding-top:4px">
              <span style="font-size:11px;font-weight:600">
                ${escapeHtml(r.profiles?.username || 'Anonymous')}</span>
              <span style="font-size:10px;color:var(--color-muted);margin-left:4px">
                ${_timeAgo(r.created_at)}</span>
              <p style="margin:2px 0 0;font-size:12px">${escapeHtml(r.content)}</p>
            </div>`).join('')}
          <div style="margin-left:16px;display:flex;gap:6px;margin-top:4px">
            <input id="reply-input-${escapeHtml(postId)}" type="text" maxlength="500"
                   placeholder="ตอบกลับ..."
                   style="flex:1;background:var(--color-card-darker);border:1px solid var(--color-border);
                          border-radius:var(--radius-md);padding:6px 10px;
                          color:var(--color-white);font-size:12px">
            <button class="btn btn-primary" style="font-size:11px;padding:6px 12px"
                    data-send-reply="${escapeHtml(postId)}">ส่ง</button>
          </div>
        </div>`;
      el.querySelector('[data-send-reply]')?.addEventListener('click', () => _handleReply(postId));
    } catch {
      el.hidden = true;
    }
  }

  async function _handlePost() {
    const ta   = document.getElementById('forum-compose');
    const text = ta?.value?.trim();
    if (!text) return;
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try {
      await DB.Community.postMessage(user.id, text);
      ta.value = '';
      await load();
    } catch (e) {
      alert(e.message || 'โพสต์ไม่สำเร็จ');
    }
  }

  async function _handleReply(parentId) {
    const input = document.getElementById(`reply-input-${parentId}`);
    const text  = input?.value?.trim();
    if (!text) return;
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try {
      await DB.Community.postMessage(user.id, text, parentId);
      // close and reopen to reload replies
      const el = document.getElementById(`replies-${parentId}`);
      if (el) { el.hidden = true; el.innerHTML = ''; }
      await _toggleReplies(parentId);
    } catch (e) {
      alert(e.message || 'ตอบกลับไม่สำเร็จ');
    }
  }

  async function _flagPost(postId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try { await DB.Community.flagPost(postId, user.id); } catch {}
  }

  function _timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'เมื่อกี้';
    if (m < 60) return `${m} นาทีที่แล้ว`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
    return `${Math.floor(h / 24)} วันที่แล้ว`;
  }

  return { load };
})();

window.CommunityForumModule = CommunityForumModule;
```

- [ ] **Step 2: Verify in browser**

Go Community → ถกเถียง. Post a message. Confirm it appears. Tap ↩ ตอบกลับ, write a reply, confirm it shows nested.

- [ ] **Step 3: Commit**

```bash
git add js/community-forum.js
git commit -m "feat: add CommunityForumModule — general community forum"
```

---

## Task 7: Clean up collection.js

**Files:**
- Modify: `js/collection.js`

**Interfaces:**
- Produces: `bindFilters()` no longer references `discuss`; `renderFigures()` no longer hides grid for discuss; `showDetail()` no longer has discuss branch

- [ ] **Step 1: Remove discuss logic from `bindFilters()`**

Find in `bindFilters()`:
```js
        const discPanel = document.getElementById('discussion-panel');
        if (activeFilter === 'discuss') {
          discPanel?.removeAttribute('hidden');
        } else {
          discPanel?.setAttribute('hidden', '');
        }
```
Delete those 5 lines.

- [ ] **Step 2: Remove discuss from `renderFigures()` hidden condition**

Find:
```js
    grid.hidden = activeFilter === 'journal' || activeFilter === 'discuss';
```
Replace with:
```js
    grid.hidden = activeFilter === 'journal';
```

- [ ] **Step 3: Remove discuss branch from `showDetail()`**

Find:
```js
  function showDetail(figureId) {
    if (activeFilter === 'discuss') {
      window.DiscussionModule?.init(figureId);
      return;
    }
```
Replace with:
```js
  function showDetail(figureId) {
```

- [ ] **Step 4: Verify Collection tab still works**

Go Collection. Confirm all pills (ทั้งหมด/S/A/B/C/Artifacts/Journal) work. Tap a figure card — modal opens normally.

- [ ] **Step 5: Commit**

```bash
git add js/collection.js
git commit -m "refactor: remove discuss filter from collection — moved to Community tab"
```

---

## Task 8: Update Static Tests

**Files:**
- Modify: `tests/coop-static.test.mjs`

- [ ] **Step 1: Update assertions that reference moved/renamed elements**

Find and replace these three assertions:

OLD (line ~43):
```js
assert(appHtml.includes('data-view="guild"'), 'leaderboard tab must have guild pill');
```
NEW:
```js
assert(appHtml.includes('data-community-tab="mygroup"'), 'community tab must have guild sub-tab pill');
```

OLD (line ~75):
```js
assert(appHtml.includes('id="discussion-panel"'), 'app.html must include #discussion-panel');
```
NEW:
```js
assert(appHtml.includes('id="community-forum-panel"'), 'app.html must include #community-forum-panel');
```

OLD (line ~76):
```js
assert(appHtml.includes('data-filter="discuss"'), 'collection filters must include discuss pill');
```
NEW:
```js
assert(appHtml.includes('data-community-tab="discuss"'), 'community tab must have discuss sub-tab pill');
```

- [ ] **Step 2: Add assertions for new files and methods**

At the end, before `console.log('\n✅ All coop-static checks passed')`, add:
```js
// ── New: community-forum.js ───────────────────────────
assert(existsSync(new URL('js/community-forum.js', root)), 'js/community-forum.js must exist');
const forumJs = read('js/community-forum.js');
assert(forumJs.includes('const CommunityForumModule'), 'community-forum.js must define CommunityForumModule');
assert(forumJs.includes('window.CommunityForumModule'), 'CommunityForumModule must be exposed on window');
assert(appHtml.includes('js/community-forum.js'), 'app.html must load community-forum.js');
console.log('✓ CommunityForumModule checks passed');

// ── New: DB additions ─────────────────────────────────
assert(dbJs.includes('subscribeGuildMembers'), 'DB.Coop must have subscribeGuildMembers');
assert(dbJs.includes('sendJoinRequest'), 'DB.Coop must have sendJoinRequest');
assert(dbJs.includes('const Community'), 'supabase-client.js must define Community namespace');
assert(dbJs.includes('Community'), 'window.DB must expose Community');
console.log('✓ DB additions checks passed');

// ── New: patch_coop_fix.sql ───────────────────────────
assert(existsSync(new URL('supabase/patch_coop_fix.sql', root)), 'patch_coop_fix.sql must exist');
const fixSql = read('supabase/patch_coop_fix.sql');
assert(fixSql.includes('guild_join_requests'), 'patch_coop_fix.sql must define guild_join_requests');
assert(fixSql.includes('community_posts'), 'patch_coop_fix.sql must define community_posts');
assert(fixSql.includes('community_post_flags'), 'patch_coop_fix.sql must define community_post_flags');
console.log('✓ patch_coop_fix.sql checks passed');
```

- [ ] **Step 3: Run the static tests**

```bash
node tests/run-static.mjs
```
Expected: all tests pass including the updated coop-static checks.

- [ ] **Step 4: Commit**

```bash
git add tests/coop-static.test.mjs
git commit -m "test: update coop-static assertions for Community tab rename"
```

---

## Final Verification

- [ ] Run `node tests/run-static.mjs` — all green
- [ ] Open `docs/COOP_FIX_INSTRUCTIONS.md` — work through the checklist manually in the browser
