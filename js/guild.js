// ── Guild Module ──────────────────────────────────────────
const GuildModule = (() => {
  let _state = null;        // { guild, members } | null
  let _presenceMap = {};    // userId → presence entries
  let _presenceChannel = null;
  let _membersChannel = null;
  let _userId = null;
  let _initPromise = null;  // ponytail: guards renderGuildPanel against reload race

  const iconEnter = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>`;

  async function init(userId) {
    _userId = userId;
    _initPromise = (async () => {
      try {
        _state = await DB.Coop.getMyGuild(userId);
      } catch {
        _state = null;
      }
      if (_state) { subscribePresence(); subscribeMembers(); }
      if (_state) _refreshGuildFog();
    })();
    return _initPromise;
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
        _refreshGuildFog();
      } catch {}
    });
  }

  async function _refreshGuildFog() {
    if (!_state?.guild?.id) return;
    try {
      const ids = await DB.Coop.getGuildClearedDistrictIds(_state.guild.id);
      window.MapModule?.renderGuildFog(ids);
    } catch {}
  }

  async function renderGuildPanel() {
    if (_initPromise) await _initPromise;
    const el = document.getElementById('guild-panel');
    if (!el) return;

    if (!_state) {
      const pending = await DB.Coop.getMyPendingRequest(_userId).catch(() => null);
      el.innerHTML = _renderNoGuild(pending);
      _bindNoGuildActions(el, pending);
      return;
    }

    const { guild, members } = _state;
    const onlineIds = getOnlineMemberIds();
    const isLeader  = guild.myRole === 'leader';

    el.innerHTML = _renderGuildHub(guild, members, onlineIds, isLeader);
    _bindHubActions(el, guild, isLeader);
    _loadPendingRequests(guild.id, isLeader);
    _loadMissionsSection(guild.id);

    // Lazy-load guild score without blocking render
    DB.Coop.getGuildScore(guild.id).then(score => {
      const el2 = document.getElementById('guild-score-display');
      if (el2) el2.textContent = score.toLocaleString() + ' pts';
    }).catch(() => {});
  }

  function _renderGuildHub(guild, members, onlineIds, isLeader) {
    const onlineCount = members.filter(m => onlineIds.has(m.user_id)).length;

    return `
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">

        <!-- Header -->
        <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                    border:1px solid rgba(255,126,85,0.15);overflow:hidden">
          <div style="background:linear-gradient(135deg,rgba(255,126,85,0.12),rgba(255,126,85,0.04));
                      padding:var(--space-md);border-bottom:1px solid rgba(255,126,85,0.1)">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
              <div style="min-width:0">
                <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;
                           color:var(--color-primary);font-weight:600">Team</p>
                <h3 style="margin:2px 0;font-family:var(--font-heading);font-size:17px;font-weight:700;
                           color:var(--color-white);word-break:break-word">${escapeHtml(guild.name)}</h3>
                <p style="margin:0;font-size:11px;color:var(--color-muted)">${onlineCount}/${members.length} ออนไลน์</p>
                <p style="margin:2px 0 0;font-size:11px;color:var(--color-muted)">
                  <span id="guild-score-display">—</span></p>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <p style="margin:0;font-size:9px;color:var(--color-muted);text-transform:uppercase;letter-spacing:1px">รหัสเชิญ</p>
                <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:var(--color-primary);
                           letter-spacing:3px;font-family:monospace">${escapeHtml(guild.invite_code)}</p>
                <button id="btn-copy-invite"
                        style="margin-top:4px;font-size:10px;color:var(--color-muted);background:none;
                               border:1px solid var(--color-border);border-radius:var(--radius-sm);
                               padding:3px 8px;cursor:pointer">คัดลอก</button>
              </div>
            </div>
            ${isLeader ? `
              <button id="btn-edit-guild"
                      style="margin-top:var(--space-sm);font-size:11px;color:var(--color-muted);
                             background:none;border:1px solid var(--color-border);
                             border-radius:var(--radius-sm);padding:4px 10px;cursor:pointer">แก้ไขกลุ่ม</button>` : ''}
          </div>

          ${isLeader ? `
          <div id="guild-edit-form" hidden
               style="padding:var(--space-md);border-bottom:1px solid rgba(255,255,255,0.05);
                      background:rgba(0,0,0,0.1)">
            <p style="margin:0 0 6px;font-size:10px;color:var(--color-muted);
                       text-transform:uppercase;letter-spacing:1px">ชื่อกลุ่ม</p>
            <input id="edit-guild-name" type="text" value="${escapeHtml(guild.name)}"
                   style="width:100%;background:var(--color-card-darker);border:1px solid var(--color-border);
                          border-radius:var(--radius-md);padding:8px 10px;color:var(--color-white);
                          font-size:13px;margin-bottom:var(--space-sm);box-sizing:border-box">
            <p style="margin:0 0 6px;font-size:10px;color:var(--color-muted);
                       text-transform:uppercase;letter-spacing:1px">ประกาศ</p>
            <textarea id="edit-guild-announcement" rows="3"
                      style="width:100%;background:var(--color-card-darker);border:1px solid var(--color-border);
                             border-radius:var(--radius-md);padding:8px 10px;color:var(--color-white);
                             font-size:13px;resize:vertical;margin-bottom:var(--space-sm);box-sizing:border-box"
              >${escapeHtml(guild.announcement || '')}</textarea>
            <div style="display:flex;gap:8px">
              <button id="btn-save-guild" class="btn btn-primary" style="flex:1;font-size:12px">บันทึก</button>
              <button id="btn-cancel-edit" class="btn btn-ghost"
                      style="flex:1;font-size:12px;border-color:var(--color-border)">ยกเลิก</button>
            </div>
          </div>` : ''}
        </div>

        <!-- Announcements -->
        <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                    border:1px solid rgba(255,255,255,0.06);padding:var(--space-md)">
          <p style="margin:0 0 6px;font-size:10px;color:var(--color-muted);text-transform:uppercase;
                     letter-spacing:1px;font-weight:600">📢 ประกาศ</p>
          ${guild.announcement
            ? `<p style="margin:0;font-size:13px;color:var(--color-white);line-height:1.6">${escapeHtml(guild.announcement)}</p>`
            : `<p style="margin:0;font-size:12px;color:var(--color-muted)">ยังไม่มีประกาศ</p>`}
        </div>

        <!-- Party / Members -->
        <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                    border:1px solid rgba(255,255,255,0.06);padding:var(--space-md)">
          <p style="margin:0 0 var(--space-sm);font-size:10px;color:var(--color-muted);
                     text-transform:uppercase;letter-spacing:1px;font-weight:600">สมาชิก (${members.length})</p>
          <div id="guild-member-list">
            ${members.map(m => _memberRow(m, onlineIds)).join('')}
          </div>
          <div id="guild-pending-requests" hidden></div>
        </div>

        <!-- Collab Missions -->
        <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                    border:1px solid rgba(255,255,255,0.06);padding:var(--space-md)">
          <p style="margin:0 0 var(--space-sm);font-size:10px;color:var(--color-muted);
                     text-transform:uppercase;letter-spacing:1px;font-weight:600">ภารกิจกลุ่ม</p>
          <div id="guild-hub-missions">
            <div style="display:flex;justify-content:center;padding:16px"><div class="spinner"></div></div>
          </div>
        </div>

        <!-- Discussion link -->
        <button id="btn-open-discuss" class="btn btn-ghost btn-full"
                style="font-size:12px;color:var(--color-muted);border-color:var(--color-border)">
          เปิดการถกเถียง →</button>

        <!-- Footer -->
        ${!isLeader ? `
          <button class="btn btn-ghost btn-full" id="btn-leave-guild"
                  style="font-size:12px;color:var(--color-muted);border-color:var(--color-border)">
            ออกจากกลุ่ม</button>` : `
          <button class="btn btn-danger btn-full" id="btn-delete-guild"
                  style="font-size:12px">ลบกลุ่ม</button>`}

      </div>`;
  }

  function _bindHubActions(el, guild, isLeader) {
    el.querySelector('#btn-leave-guild')?.addEventListener('click', _handleLeave);
    el.querySelector('#btn-delete-guild')?.addEventListener('click', () => _handleDelete(guild.id));
    el.querySelector('#btn-open-discuss')?.addEventListener('click', () => {
      document.querySelector('[data-community-tab="discuss"]')?.click();
    });
    el.querySelector('#btn-copy-invite')?.addEventListener('click', () => {
      navigator.clipboard.writeText(guild.invite_code).then(() =>
        window.AppCore?.showToast?.('คัดลอกรหัสเชิญแล้ว!')
      ).catch(() => {});
    });
    el.querySelectorAll('[data-kick]').forEach(btn =>
      btn.addEventListener('click', () => _handleKick(btn.dataset.kick))
    );
    el.querySelectorAll('[data-transfer]').forEach(btn =>
      btn.addEventListener('click', () => _handleTransfer(btn.dataset.transfer, guild.id))
    );
    if (!isLeader) return;
    const editForm = el.querySelector('#guild-edit-form');
    el.querySelector('#btn-edit-guild')?.addEventListener('click', () => {
      if (editForm) editForm.hidden = !editForm.hidden;
    });
    el.querySelector('#btn-cancel-edit')?.addEventListener('click', () => {
      if (editForm) editForm.hidden = true;
    });
    el.querySelector('#btn-save-guild')?.addEventListener('click', () => _handleSaveGuild(guild.id));
  }

  async function _handleSaveGuild(guildId) {
    const name         = document.getElementById('edit-guild-name')?.value?.trim();
    const announcement = document.getElementById('edit-guild-announcement')?.value?.trim() || null;
    if (!name) return;
    try {
      await DB.Coop.updateGuild(guildId, { name, announcement });
      _state.guild.name         = name;
      _state.guild.announcement = announcement;
      await renderGuildPanel();
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'บันทึกไม่สำเร็จ');
    }
  }

  function _memberRow(m, onlineIds) {
    const profile  = m.profiles || {};
    const username = escapeHtml(profile.username || '?');
    const initials = username.substring(0, 2).toUpperCase();
    const isOnline = onlineIds.has(m.user_id);
    const isLeader = m.role === 'leader';
    const isMe     = m.user_id === _userId;
    const iAmLeader = _state.guild.myRole === 'leader';

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
        ${iAmLeader && !isMe ? `
          <div style="display:flex;gap:4px">
            <button style="font-size:10px;color:var(--color-muted);background:none;
                           border:1px solid var(--color-border);border-radius:var(--radius-sm);
                           padding:3px 8px;cursor:pointer"
                    data-transfer="${escapeHtml(m.user_id)}">โอน</button>
            <button style="font-size:10px;color:var(--color-muted);background:none;
                           border:1px solid var(--color-border);border-radius:var(--radius-sm);
                           padding:3px 8px;cursor:pointer"
                    data-kick="${escapeHtml(m.user_id)}">Kick</button>
          </div>` : ''}
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
    el.querySelectorAll('[data-transfer]').forEach(btn =>
      btn.addEventListener('click', () => _handleTransfer(btn.dataset.transfer, _state.guild.id))
    );
  }

  async function _loadPendingRequests(guildId, isLeader) {
    if (!isLeader) return;
    const el = document.getElementById('guild-pending-requests');
    if (!el) return;
    try {
      const requests = await DB.Coop.getJoinRequests(guildId);
      if (!requests.length) return;
      el.hidden = false;
      el.innerHTML = `
        <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:var(--space-sm);
                    padding-top:var(--space-sm)">
          <p style="margin:0 0 var(--space-sm);font-size:10px;color:var(--color-muted);
                     text-transform:uppercase;letter-spacing:1px">คำขอเข้าร่วม (${requests.length})</p>
          ${requests.map(r => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
              <p style="margin:0;flex:1;font-size:12px;font-weight:600">
                ${escapeHtml(r.profiles?.username || '?')}</p>
              <button class="btn btn-primary" style="font-size:10px;padding:4px 10px"
                      data-approve="${escapeHtml(r.id)}">อนุมัติ</button>
              <button class="btn btn-ghost"
                      style="font-size:10px;padding:4px 10px;border-color:var(--color-border)"
                      data-reject="${escapeHtml(r.id)}">ปฏิเสธ</button>
            </div>`).join('')}
        </div>`;
      el.querySelectorAll('[data-approve]').forEach(btn =>
        btn.addEventListener('click', () => _handleApprove(btn.dataset.approve))
      );
      el.querySelectorAll('[data-reject]').forEach(btn =>
        btn.addEventListener('click', () => _handleReject(btn.dataset.reject))
      );
    } catch {}
  }

  async function _loadMissionsSection(guildId) {
    const el = document.getElementById('guild-hub-missions');
    if (!el) return;
    const user = window.AppCore?.App?.user;
    try {
      const [missions, allCheckins] = await Promise.all([
        DB.Coop.getCollabMissions(),
        DB.Coop.getAllGuildCheckins(guildId)
      ]);
      if (!missions.length) {
        el.innerHTML = `<p style="margin:0;font-size:12px;color:var(--color-muted)">ยังไม่มีภารกิจ</p>`;
        return;
      }
      el.innerHTML = '';
      el.style.cssText += 'display:flex;flex-direction:column;gap:8px';
      for (const m of missions) {
        const checkins  = allCheckins.filter(c => c.mission_id === m.id);
        const myCheckin = checkins.find(c => c.user_id === user?.id);
        const wrapper   = document.createElement('div');
        wrapper.innerHTML = window.CoopModule?.renderMissionCard(m, checkins.length, myCheckin) ?? '';
        wrapper.querySelector('[data-checkin-btn]')?.addEventListener('click', async () => {
          try {
            await DB.Coop.checkInToMission(m.id, guildId, user.id);
            await _loadMissionsSection(guildId);
          } catch {}
        });
        el.appendChild(wrapper);
      }
    } catch {
      el.innerHTML = '';
    }
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
                      margin-bottom:var(--space-sm);display:flex;align-items:center;gap:8px">
            <p style="margin:0;flex:1;font-size:12px;color:var(--color-primary);text-align:left">
              ⏳ รอการอนุมัติจาก <strong>${escapeHtml(pendingRequest.guilds?.name || '...')}</strong>
            </p>
            <button id="btn-cancel-request"
                    style="font-size:10px;color:var(--color-muted);background:none;
                           border:1px solid var(--color-border);border-radius:var(--radius-sm);
                           padding:3px 8px;cursor:pointer;flex-shrink:0"
                    data-req-id="${escapeHtml(pendingRequest.id)}">ยกเลิก</button>
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
        <p id="guild-error" style="font-size:11px;color:#ef5350;margin:6px 0 0;min-height:16px"></p>
      </div>`;
  }

  function _bindNoGuildActions(el, pendingRequest) {
    el.querySelector('#btn-create-guild')?.addEventListener('click', _handleCreate);
    el.querySelector('#btn-join-guild')?.addEventListener('click', _handleJoin);
    el.querySelector('#btn-cancel-request')?.addEventListener('click', async () => {
      if (!pendingRequest?.id) return;
      try {
        await DB.Coop.cancelRequest(pendingRequest.id);
        await renderGuildPanel();
      } catch (e) {
        window.AppCore?.showToast?.(e.message || 'ยกเลิกไม่สำเร็จ');
      }
    });
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
    if (!await window.AppCore.showConfirm('ลบกลุ่มนี้? ไม่สามารถกู้คืนได้', { destructive: true, confirmLabel: 'ลบ' })) return;
    try {
      await DB.Coop.deleteGuild(guildId);
      if (_state?.guild?.id === guildId) {
        if (_presenceChannel) { try { _presenceChannel.unsubscribe(); } catch {} _presenceChannel = null; }
        _state = null;
      }
      document.dispatchEvent(new CustomEvent('guild-changed'));
      renderGuildPanel();
    } catch { window.AppCore?.showToast?.('เกิดข้อผิดพลาด'); }
  }

  async function _handleLeave() {
    if (!await window.AppCore.showConfirm('ออกจากกลุ่ม?', { destructive: true, confirmLabel: 'ออก' })) return;
    await DB.Coop.leaveGuild(_state.guild.id, _userId);
    if (_presenceChannel) { try { _presenceChannel.unsubscribe(); } catch {} _presenceChannel = null; }
    if (_membersChannel)  { try { _membersChannel.unsubscribe();  } catch {} _membersChannel  = null; }
    _state = null;
    renderGuildPanel();
  }

  async function _handleKick(targetUserId) {
    if (!await window.AppCore.showConfirm('เอาสมาชิกคนนี้ออก?', { destructive: true, confirmLabel: 'นำออก' })) return;
    await DB.Coop.kickMember(_state.guild.id, targetUserId);
    _state = await DB.Coop.getMyGuild(_userId);
    _refreshMemberList();
  }

  async function _handleTransfer(targetUserId, guildId) {
    if (!await window.AppCore.showConfirm('โอนตำแหน่ง Leader ให้สมาชิกคนนี้?', { confirmLabel: 'โอน' })) return;
    try {
      await DB.Coop.transferLeader(guildId, targetUserId, _userId);
      _state = await DB.Coop.getMyGuild(_userId);
      await renderGuildPanel();
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'โอนตำแหน่งไม่สำเร็จ');
    }
  }

  async function _handleApprove(requestId) {
    try {
      await DB.Coop.approveRequest(requestId);
      await renderGuildPanel();
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'อนุมัติไม่สำเร็จ');
    }
  }

  async function _handleReject(requestId) {
    try {
      await DB.Coop.rejectRequest(requestId);
      await renderGuildPanel();
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'เกิดข้อผิดพลาด');
    }
  }

  async function renderFindGroupPanel() {
    if (_initPromise) await _initPromise;
    const el = document.getElementById('findgroup-panel');
    if (!el) return;
    const myGuildId = _state?.guild?.id ?? null;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        ${myGuildId ? `
          <div style="padding:var(--space-sm) var(--space-md);background:rgba(255,126,85,0.08);
                      border-radius:var(--radius-md);border:1px solid rgba(255,126,85,0.2)">
            <p style="margin:0;font-size:12px;color:var(--color-primary)">
              คุณอยู่ในกลุ่มแล้ว — ออกก่อนเพื่อเข้าร่วมกลุ่มอื่น</p>
          </div>` : ''}
        <div style="display:flex;gap:8px">
          <input id="findgroup-search-input" type="text" placeholder="ค้นหากลุ่ม..."
                 style="flex:1;background:var(--color-card-darker);border:1px solid var(--color-border);
                        border-radius:var(--radius-md);padding:10px var(--space-sm);
                        color:var(--color-white);font-size:13px">
          <button class="btn btn-primary" id="btn-findgroup-search" style="white-space:nowrap">ค้นหา</button>
        </div>
        <div id="findgroup-results"></div>
      </div>`;

    const searchInput = el.querySelector('#findgroup-search-input');
    const searchBtn   = el.querySelector('#btn-findgroup-search');
    const resultsEl   = el.querySelector('#findgroup-results');
    const doSearch    = () => _loadFindGroupResults(resultsEl, searchInput.value.trim(), myGuildId);

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    doSearch();
  }

  async function _loadFindGroupResults(resultsEl, query, myGuildId) {
    if (!resultsEl) return;
    resultsEl.innerHTML = `<div style="display:flex;justify-content:center;padding:20px"><div class="spinner"></div></div>`;
    const user = window.AppCore?.App?.user;
    try {
      const [guilds, pendingReq] = await Promise.all([
        DB.Coop.searchGuilds(query),
        user ? DB.Coop.getMyPendingRequest(user.id).catch(() => null) : Promise.resolve(null)
      ]);

      guilds.sort((a, b) => (b.guild_legacy_score || 0) - (a.guild_legacy_score || 0));

      if (!guilds.length) {
        resultsEl.innerHTML = `<p style="text-align:center;color:var(--color-muted);font-size:12px;padding:var(--space-md)">ไม่พบกลุ่ม</p>`;
        return;
      }

      resultsEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        ${guilds.map((g, i) => {
          const isMyGuild = !!(myGuildId && g.id === myGuildId);
          const isPending = pendingReq?.guild_id === g.id;
          const disabled  = !!myGuildId || isMyGuild || isPending;
          const btnLabel  = isMyGuild ? 'คุณอยู่แล้ว' : isPending ? 'รอการอนุมัติ' : 'ขอเข้าร่วม';
          return `
            <div style="background:var(--color-card-dark);border-radius:var(--radius-md);
                        border:1px solid rgba(255,255,255,0.06);overflow:hidden">
              <div style="display:flex;align-items:center;gap:10px;padding:10px var(--space-sm)">
                <span style="font-size:12px;font-weight:700;color:var(--color-muted);
                             width:20px;text-align:center;flex-shrink:0">${i + 1}</span>
                <div style="flex:1;min-width:0">
                  <p style="margin:0;font-size:13px;font-weight:600;color:var(--color-white);
                             white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(g.name)}</p>
                  <p style="margin:2px 0 0;font-size:10px;color:var(--color-muted)">
                    ${g.member_count} สมาชิก · ${(g.guild_legacy_score || 0).toLocaleString()} pts</p>
                </div>
                <button class="btn btn-primary"
                        style="font-size:11px;padding:6px 12px;white-space:nowrap;flex-shrink:0;${disabled ? 'opacity:.5;cursor:default' : ''}"
                        data-guild-id="${escapeHtml(g.id)}"
                        ${disabled ? 'disabled' : ''}>
                  ${btnLabel}
                </button>
              </div>
              ${g.announcement ? `
                <div style="padding:6px var(--space-sm) 10px calc(20px + 10px + var(--space-sm));
                            border-top:1px solid rgba(255,255,255,0.04)">
                  <p style="margin:0;font-size:11px;color:var(--color-muted);line-height:1.5">
                    ${escapeHtml(g.announcement)}</p>
                </div>` : ''}
            </div>`;
        }).join('')}
      </div>`;

      resultsEl.querySelectorAll('button[data-guild-id]:not([disabled])').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DB.Coop.sendJoinRequest(btn.dataset.guildId, user.id);
            btn.textContent = 'รอการอนุมัติ';
            btn.disabled = true;
          } catch (e) {
            window.AppCore?.showToast?.(e.message || 'ส่งคำขอไม่สำเร็จ');
          }
        });
      });
    } catch (e) {
      console.error('[findgroup]', e);
      resultsEl.innerHTML = `<p style="text-align:center;color:var(--color-muted);font-size:12px">เกิดข้อผิดพลาด</p>`;
    }
  }

  return { init, getState, getOnlineMemberIds, subscribePresence, renderGuildPanel, renderFindGroupPanel };
})();

window.GuildModule = GuildModule;
