// ── Guild Module ──────────────────────────────────────
const GuildModule = (() => {
  let _state = null;        // { guild, members } | null
  let _presenceMap = {};    // userId → presence entries
  let _presenceChannel = null;
  let _membersChannel = null;
  let _userId = null;

  async function init(userId) {
    _userId = userId;
    try {
      _state = await DB.Coop.getMyGuild(userId);
    } catch {
      _state = null;
    }
    if (_state) { subscribePresence(); subscribeMembers(); }
  }

  function getState() { return _state; }

  function getOnlineMemberIds() {
    const ids = new Set();
    Object.values(_presenceMap).flat().forEach(p => { if (p.user_id) ids.add(p.user_id); });
    return ids;
  }

  function subscribePresence() {
    if (!_state?.guild?.id) return;
    if (_presenceChannel) { try { _presenceChannel.unsubscribe(); } catch {} }

    _presenceChannel = DB.Coop.subscribeGuildPresence(_state.guild.id, {
      onSync: () => {
        _presenceMap = _presenceChannel.presenceState() || {};
        _refreshMemberList();
      },
      onJoin: () => {
        _presenceMap = _presenceChannel.presenceState() || {};
        _refreshMemberList();
      },
      onLeave: () => {
        _presenceMap = _presenceChannel.presenceState() || {};
        _refreshMemberList();
      }
    });

    _presenceChannel.track({ user_id: _userId, online_at: new Date().toISOString() });
  }

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

  async function renderGuildPanel() {
    const el = document.getElementById('guild-panel');
    if (!el) return;

    if (!_state) {
      el.innerHTML = _renderNoGuild();
      _bindNoGuildActions(el);
      return;
    }

    const { guild, members } = _state;
    const onlineIds = getOnlineMemberIds();

    el.innerHTML = `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);overflow:hidden;
                  border:1px solid rgba(255,126,85,0.15)">
        <div style="background:linear-gradient(135deg,rgba(255,126,85,0.12),rgba(255,126,85,0.04));
                    padding:var(--space-md);border-bottom:1px solid rgba(255,126,85,0.1)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;
                         color:var(--color-primary);font-weight:600">Team</p>
              <h3 style="margin:2px 0 0;font-family:var(--font-heading);font-size:17px;font-weight:700;
                         color:var(--color-white)">
                ${escapeHtml(guild.name)}</h3>
            </div>
            <div style="text-align:right">
              <p style="margin:0;font-size:10px;color:var(--color-muted)">รหัสเชิญ</p>
              <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:var(--color-primary);
                         letter-spacing:3px;font-family:monospace">${escapeHtml(guild.invite_code)}</p>
            </div>
          </div>
        </div>

        <div id="guild-member-list" style="padding:var(--space-sm) var(--space-md)">
          ${members.map(m => _memberRow(m, onlineIds)).join('')}
        </div>

        ${guild.myRole !== 'leader' ? `
          <div style="padding:0 var(--space-md) var(--space-md)">
            <button class="btn btn-ghost btn-full" id="btn-leave-guild"
                    style="font-size:12px;color:var(--color-muted);border-color:var(--color-border)">
              ออกจากกลุ่ม
            </button>
          </div>` : ''}
      </div>`;

    el.querySelector('#btn-leave-guild')?.addEventListener('click', _handleLeave);
    el.querySelectorAll('[data-kick]').forEach(btn =>
      btn.addEventListener('click', () => _handleKick(btn.dataset.kick))
    );
  }

  function _memberRow(m, onlineIds) {
    const profile  = m.profiles || {};
    const username = escapeHtml(profile.username || '?');
    const initials = username.substring(0, 2).toUpperCase();
    const isOnline = onlineIds.has(m.user_id);
    const isLeader = m.role === 'leader';
    const isMe     = m.user_id === _userId;

    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;
                  border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="position:relative;flex-shrink:0">
          <div class="avatar-sm" style="width:36px;height:36px;font-size:13px">${initials}</div>
          <span style="position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;
                       background:${isOnline ? 'var(--color-success)' : 'var(--color-border)'};
                       border:2px solid var(--color-card-dark)"></span>
        </div>
        <div style="flex:1;min-width:0">
          <p style="margin:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${username}${isMe ? ' <span style="color:var(--color-muted);font-weight:400;font-size:11px">(คุณ)</span>' : ''}
          </p>
          ${isLeader ? `<p style="margin:0;font-size:10px;color:var(--color-primary)">Leader</p>` : ''}
        </div>
        ${_state.guild.myRole === 'leader' && !isMe ? `
          <button style="font-size:10px;color:var(--color-muted);background:none;
                         border:1px solid var(--color-border);border-radius:var(--radius-sm);
                         padding:3px 8px;cursor:pointer"
                  data-kick="${escapeHtml(m.user_id)}">Kick</button>` : ''}
      </div>`;
  }

  function _refreshMemberList() {
    const el = document.getElementById('guild-member-list');
    if (!el || !_state) return;
    const onlineIds = getOnlineMemberIds();
    el.innerHTML = _state.members.map(m => _memberRow(m, onlineIds)).join('');
    el.querySelectorAll('[data-kick]').forEach(btn =>
      btn.addEventListener('click', () => _handleKick(btn.dataset.kick))
    );
  }

  function _renderNoGuild(pendingRequest = null) {
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
        <div style="display:flex;gap:8px">
          <input id="guild-code-input" type="text" placeholder="รหัสเชิญ (6 ตัว)..."
                 maxlength="6"
                 style="flex:1;background:var(--color-card-darker);border:1px solid var(--color-border);
                        border-radius:var(--radius-md);padding:8px 10px;color:var(--color-white);
                        font-size:12px;text-transform:uppercase;letter-spacing:2px">
          <button id="btn-join-guild"
                  class="btn btn-outline btn-sm"
                  style="display:flex;align-items:center;gap:4px;white-space:nowrap">
            ${iconEnter} เข้าร่วม
          </button>
        </div>
        <button class="btn btn-ghost btn-full" id="btn-search-guild"
                style="font-size:12px;color:var(--color-muted);border-color:var(--color-border)">
          ค้นหากลุ่ม</button>
        <p id="guild-error" style="font-size:11px;color:#ef5350;margin:6px 0 0;min-height:16px"></p>
      </div>`;
  }

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

  async function _handleCopyInvite() {
    if (!_state?.guild?.invite_code) return;
    try {
      await navigator.clipboard.writeText(_state.guild.invite_code);
    } catch {
      // clipboard unavailable — show code in prompt as fallback
      window.prompt('รหัสเชิญ:', _state.guild.invite_code);
      return;
    }
    const btn = document.getElementById('btn-copy-invite');
    if (!btn) return;
    btn.textContent = 'คัดลอกแล้ว!';
    setTimeout(() => { if (btn) btn.textContent = 'คัดลอก'; }, 1500);
  }

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

  async function _handleCreate() {
    const name  = document.getElementById('guild-name-input')?.value?.trim();
    const errEl = document.getElementById('guild-error');
    if (!name) { if (errEl) errEl.textContent = 'กรุณาใส่ชื่อกลุ่ม'; return; }
    try {
      await DB.Coop.createGuild(name, _userId);
      _state = await DB.Coop.getMyGuild(_userId);
      subscribePresence();
      subscribeMembers();
      await renderGuildPanel();
      document.dispatchEvent(new CustomEvent('guild-changed'));
    } catch (e) {
      if (errEl) errEl.textContent = e.message || 'เกิดข้อผิดพลาด';
    }
  }

  async function _handleJoin() {
    const code  = document.getElementById('guild-code-input')?.value?.trim();
    const errEl = document.getElementById('guild-error');
    if (!code) { if (errEl) errEl.textContent = 'กรุณาใส่รหัสเชิญ'; return; }
    try {
      await DB.Coop.joinGuild(code, _userId);
      _state = await DB.Coop.getMyGuild(_userId);
      subscribePresence();
      subscribeMembers();
      renderGuildPanel();
    } catch (e) {
      if (errEl) errEl.textContent = e.message || 'รหัสไม่ถูกต้อง';
    }
  }

  async function _handleDelete(guildId) {
    if (!confirm('ลบกลุ่มนี้? ไม่สามารถกู้คืนได้')) return;
    try {
      await DB.Coop.deleteGuild(guildId);
      if (_state?.guild?.id === guildId) {
        if (_presenceChannel) { try { _presenceChannel.unsubscribe(); } catch {} _presenceChannel = null; }
        _state = null;
      }
      document.dispatchEvent(new CustomEvent('guild-changed'));
    } catch { window.AppCore?.showToast?.('เกิดข้อผิดพลาด'); }
  }

  async function _handleLeave() {
    if (!confirm('ออกจากกลุ่ม?')) return;
    await DB.Coop.leaveGuild(_state.guild.id, _userId);
    if (_presenceChannel) { try { _presenceChannel.unsubscribe(); } catch {} _presenceChannel = null; }
    if (_membersChannel) { try { _membersChannel.unsubscribe(); } catch {} _membersChannel = null; }
    _state = null;
    renderGuildPanel();
  }

  async function _handleKick(targetUserId) {
    if (!confirm('เอาสมาชิกคนนี้ออก?')) return;
    await DB.Coop.kickMember(_state.guild.id, targetUserId);
    _state = await DB.Coop.getMyGuild(_userId);
    _refreshMemberList();
  }

  return { init, getState, getOnlineMemberIds, subscribePresence, renderGuildPanel };
})();

window.GuildModule = GuildModule;
