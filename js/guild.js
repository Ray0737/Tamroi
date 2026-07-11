// ── Guild Module ──────────────────────────────────────────
const GuildModule = (() => {
  let _state = null;        // { guild, members } | null
  let _presenceMap = {};    // userId → presence entries
  let _presenceChannel = null;
  let _membersChannel = null;
  let _rallyChannel = null;
  let _userId = null;
  let _initPromise = null;  // ponytail: guards renderGuildPanel against reload race

  async function init(userId) {
    _userId = userId;
    _initPromise = (async () => {
      try {
        _state = await DB.Coop.getMyGuild(userId);
      } catch {
        _state = null;
      }
      if (_state) { subscribePresence(); subscribeMembers(); subscribeRallyPins(); }
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
    if (isLeader) _loadPendingRequests(guild.id);
    _loadAnnouncements(guild.id, isLeader);
    _loadExpeditionLog(guild.id);
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
      <div>

        <!-- ── Team header — compact profile row ── -->
        <div class="guild-section">
          <div class="guild-header-row">
            <div class="guild-emblem">${escapeHtml(guild.name.substring(0, 2).toUpperCase())}</div>
            <div class="guild-header-main">
              <h3 class="guild-name">${escapeHtml(guild.name)}</h3>
              <p class="guild-header-meta">
                <span class="guild-status-dot"></span>
                <span>${onlineCount}/${members.length} ออนไลน์</span>
                <span>·</span>
                <span id="guild-score-display">—</span>
              </p>
            </div>
            ${isLeader ? `
            <button id="btn-edit-guild" class="guild-header-edit-btn" title="แก้ไข">
              <i class="bi bi-pencil"></i></button>` : ''}
          </div>

          <!-- ── Quick actions — moved up from the bottom ── -->
          <div class="guild-action-row">
            <button id="btn-rally-pin" class="guild-action-btn" style="color:var(--color-primary)">
              <i class="bi bi-geo-alt-fill"></i> Rally</button>
            <button id="btn-open-discuss" class="guild-action-btn" style="color:var(--color-muted)">
              <i class="bi bi-chat"></i> ถกเถียง</button>
            ${!isLeader ? `
              <button id="btn-leave-guild" class="guild-action-btn" style="color:var(--color-danger)">
                <i class="bi bi-box-arrow-right"></i> ออกจากกลุ่ม</button>` : `
              <button id="btn-delete-guild" class="guild-action-btn" style="color:var(--color-danger)">
                <i class="bi bi-trash"></i> ลบกลุ่ม</button>`}
          </div>

          ${guild.description ? `
          <p class="guild-desc-text">${escapeHtml(guild.description)}</p>` : ''}
          ${guild.announcement ? `
          <div class="guild-announce-row">
            <i class="bi bi-megaphone"></i>
            <p>${escapeHtml(guild.announcement)}</p>
          </div>` : ''}

          <!-- Edit form -->
          ${isLeader ? `
          <div id="guild-edit-form" hidden style="margin-top:14px">
            <p class="guild-field-label">ชื่อกลุ่ม</p>
            <input id="edit-guild-name" type="text" class="guild-input" autocomplete="off" value="${escapeHtml(guild.name)}">
            <p class="guild-field-label">คำอธิบาย</p>
            <textarea id="edit-guild-desc" class="guild-textarea" rows="2" maxlength="200" autocomplete="off"
                      >${escapeHtml(guild.description || '')}</textarea>
            <div class="guild-form-actions">
              <button id="btn-cancel-edit" class="btn btn-ghost"
                      style="font-size:11px;padding:5px 14px;border-color:var(--color-border)">ยกเลิก</button>
              <button id="btn-save-guild" class="btn btn-primary"
                      style="font-size:11px;padding:5px 16px">บันทึก</button>
            </div>
          </div>` : ''}
        </div>

        <!-- ── Sub-nav — switches the panels below, mirrors the main bottom nav ── -->
        <div class="guild-subnav">
          <button class="guild-subnav-item active" data-guild-tab="members">
            <i class="bi bi-people"></i><span>สมาชิก</span></button>
          <button class="guild-subnav-item" data-guild-tab="announce">
            <i class="bi bi-megaphone"></i><span>ประกาศ</span></button>
          <button class="guild-subnav-item" data-guild-tab="log">
            <i class="bi bi-journal-text"></i><span>บันทึก</span></button>
          <button class="guild-subnav-item" data-guild-tab="missions">
            <i class="bi bi-lightning"></i><span>ภารกิจ</span></button>
        </div>

        <!-- ── Members + Requests ── -->
        <div class="guild-section guild-subpanel" data-guild-panel="members">
          <div class="guild-invite-line">
            <span>รหัสเชิญ</span>
            <span class="guild-invite-code">${escapeHtml(guild.invite_code)}</span>
            <button id="btn-copy-invite" class="guild-invite-copy-btn" title="คัดลอก">
              <i class="bi bi-clipboard"></i></button>
          </div>
          <div id="guild-member-list">
            ${members.map(m => _memberRow(m, onlineIds)).join('')}
          </div>
          ${isLeader ? `
          <div id="guild-requests-top" style="margin-top:10px">
            <div style="display:flex;justify-content:center;padding:4px"><div class="spinner"></div></div>
          </div>` : ''}
        </div>

        <!-- ── Announcements ── -->
        <div class="guild-section guild-subpanel" data-guild-panel="announce" hidden>
          ${isLeader ? `
          <div class="guild-compose-row">
            <textarea id="announcement-input" rows="1" maxlength="500" autocomplete="off"
                      placeholder="พิมพ์ประกาศใหม่..."></textarea>
            <button id="btn-post-announcement" class="forum-send-btn" title="โพสต์">
              <i class="bi bi-send-fill"></i></button>
          </div>` : ''}
          <div id="guild-announcements-list">
            <div style="display:flex;justify-content:center;padding:14px"><div class="spinner"></div></div>
          </div>
        </div>

        <!-- ── Expedition Log ── -->
        <div class="guild-section guild-subpanel" data-guild-panel="log" hidden>
          <div id="guild-expedition-log">
            <div style="display:flex;justify-content:center;padding:14px"><div class="spinner"></div></div>
          </div>
        </div>

        <!-- ── Missions ── -->
        <div class="guild-section guild-subpanel" data-guild-panel="missions" hidden>
          <div id="guild-hub-missions">
            <div style="display:flex;justify-content:center;padding:10px"><div class="spinner"></div></div>
          </div>
        </div>

      </div>`;
  }

  function _bindHubActions(el, guild, isLeader) {
    el.querySelectorAll('.guild-subnav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.guildTab;
        el.querySelectorAll('.guild-subnav-item').forEach(b => b.classList.toggle('active', b === btn));
        el.querySelectorAll('[data-guild-panel]').forEach(panel => {
          panel.hidden = panel.dataset.guildPanel !== tab;
        });
      });
    });

    el.querySelector('#btn-leave-guild')?.addEventListener('click', _handleLeave);
    el.querySelector('#btn-delete-guild')?.addEventListener('click', () => _handleDelete(guild.id));
    const rallyBtn = el.querySelector('#btn-rally-pin');
    rallyBtn?.addEventListener('click', () => _handleRallyPin(rallyBtn));
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

    el.querySelector('#btn-post-announcement')?.addEventListener('click', () =>
      _handlePostAnnouncement(guild.id)
    );
  }

  async function _handleSaveGuild(guildId) {
    const name = document.getElementById('edit-guild-name')?.value?.trim();
    const desc = document.getElementById('edit-guild-desc')?.value?.trim() ?? '';
    if (!name) return;
    try {
      await DB.Coop.updateGuild(guildId, { name, description: desc || null });
      _state.guild.name = name;
      _state.guild.description = desc || null;
      await renderGuildPanel();
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'บันทึกไม่สำเร็จ');
    }
  }

  async function _handlePostAnnouncement(guildId) {
    const input = document.getElementById('announcement-input');
    const content = input?.value?.trim();
    if (!content) return;
    const btn = document.getElementById('btn-post-announcement');
    if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner" style="width:14px;height:14px"></div>`; }
    try {
      const user = window.AppCore?.App?.user;
      await DB.Coop.postAnnouncement(guildId, content, user?.id);
      if (input) input.value = '';
      await _loadAnnouncements(guildId, _state?.guild?.myRole === 'leader');
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'โพสต์ไม่สำเร็จ');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = `<i class="bi bi-send"></i>`; }
    }
  }

  async function _loadAnnouncements(guildId, isLeader) {
    const el = document.getElementById('guild-announcements-list');
    if (!el) return;
    try {
      const items = await DB.Coop.getAnnouncements(guildId);
      if (!items.length) {
        el.innerHTML = `<p class="guild-list-empty">ยังไม่มีประกาศ</p>`;
        return;
      }
      el.innerHTML = items.map(a => {
        const name = escapeHtml(a.profiles?.username || '?');
        const ago  = _relativeTime(a.created_at);
        return `
          <div class="guild-announcement-item">
            <div class="guild-announcement-body">
              <p class="guild-announcement-text">${escapeHtml(a.content)}</p>
              <p class="guild-announcement-meta">${name} · ${ago}</p>
            </div>
            ${isLeader ? `
            <button class="guild-del-btn" data-del-announcement="${escapeHtml(a.id)}">
              <i class="bi bi-x-lg"></i></button>` : ''}
          </div>`;
      }).join('');
      el.querySelectorAll('[data-del-announcement]').forEach(btn =>
        btn.addEventListener('click', async () => {
          await DB.Coop.deleteAnnouncement(btn.dataset.delAnnouncement).catch(() => {});
          await _loadAnnouncements(guildId, isLeader);
        })
      );
    } catch {
      el.innerHTML = `<p class="guild-list-error">โหลดไม่สำเร็จ</p>`;
    }
  }

  function _relativeTime(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'เมื่อกี้';
    if (m < 60) return `${m} นาทีที่แล้ว`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
    return `${Math.floor(h / 24)} วันที่แล้ว`;
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
      <div class="guild-member-row">
        <div class="guild-member-avatar-wrap">
          ${avatarHTML(profile.avatar_url, initials, 34, isLeader ? 'var(--color-primary)' : 'var(--color-muted)')}
          <span class="guild-status-badge ${isOnline ? 'online' : 'offline'}"></span>
        </div>
        <div style="flex:1;min-width:0">
          <p class="guild-member-name">
            ${username}${isMe ? ' <span class="guild-member-you">(คุณ)</span>' : ''}
          </p>
          ${isLeader ? `<p class="guild-member-leader-tag">
                          <i class="bi bi-star-fill" style="font-size:9px"></i> Leader</p>` : ''}
        </div>
        ${iAmLeader && !isMe ? `
          <div class="guild-member-actions">
            <button class="guild-icon-btn" data-transfer="${escapeHtml(m.user_id)}">
              <i class="bi bi-arrow-left-right"></i></button>
            <button class="guild-icon-btn danger" data-kick="${escapeHtml(m.user_id)}">
              <i class="bi bi-person-x"></i></button>
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

  async function _loadPendingRequests(guildId) {
    const el = document.getElementById('guild-requests-top');
    if (!el) return;
    try {
      const requests = await DB.Coop.getJoinRequests(guildId);
      const header = `<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:var(--color-primary);
                                 display:flex;align-items:center;gap:6px">
                        <i class="bi bi-person-plus"></i> คำขอเข้าร่วม${requests.length ? ` (${requests.length})` : ''}</p>`;
      if (!requests.length) {
        el.innerHTML = header + `<p style="margin:0;font-size:12px;color:var(--color-muted)">ไม่มีคำขอ</p>`;
        return;
      }
      el.innerHTML = header + requests.map(r => {
        const name     = escapeHtml(r.profiles?.username || '?');
        const initials = name.substring(0, 2).toUpperCase();
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;
                      border-bottom:1px solid rgba(255,255,255,0.05)">
            ${avatarHTML(r.profiles?.avatar_url, initials, 34, 'var(--color-muted)')}
            <p style="margin:0;flex:1;font-size:13px;font-weight:600;color:var(--color-white)">${name}</p>
            <button class="btn btn-primary" style="font-size:11px;padding:5px 12px;white-space:nowrap"
                    data-approve="${escapeHtml(r.id)}">ยอมรับ</button>
            <button class="btn btn-ghost"
                    style="font-size:11px;padding:5px 12px;white-space:nowrap;border-color:var(--color-border)"
                    data-reject="${escapeHtml(r.id)}">ปฏิเสธ</button>
          </div>`;
      }).join('');
      el.querySelectorAll('[data-approve]').forEach(btn =>
        btn.addEventListener('click', () => _handleApprove(btn.dataset.approve))
      );
      el.querySelectorAll('[data-reject]').forEach(btn =>
        btn.addEventListener('click', () => _handleReject(btn.dataset.reject))
      );
    } catch (e) {
      const el2 = document.getElementById('guild-requests-top');
      if (el2) el2.innerHTML = `<p class="guild-list-error" style="text-align:left;padding:0">โหลดคำขอไม่สำเร็จ: ${escapeHtml(e?.message || 'unknown')}</p>`;
      console.error('[guild] _loadPendingRequests failed:', e);
    }
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

  function subscribeRallyPins() {
    if (!_state?.guild?.id) return;
    if (_rallyChannel) { try { _rallyChannel.unsubscribe(); } catch {} }
    _rallyChannel = DB.Coop.openRallyChannel(_state.guild.id);
    _rallyChannel.on('broadcast', { event: 'rally_pin' }, ({ payload }) => {
      if (!payload) return;
      if (Date.now() - new Date(payload.sent_at).getTime() > 7200000) return; // 2h expiry
      window.MapModule?.renderRallyPin(payload.user_id, payload.username, payload.lat, payload.lng);
      if (payload.user_id !== _userId)
        window.AppCore?.showToast?.(`${escapeHtml(payload.username)} ส่งหมุด Rally!`);
    });
    _rallyChannel.subscribe();
  }

  async function _handleRallyPin(btn) {
    const pos = window.MapModule?.getLastKnownPosition?.();
    if (!pos) { window.AppCore?.showToast?.('ไม่พบตำแหน่ง GPS'); return; }
    const user = window.AppCore?.App?.user;
    const me   = _state?.members?.find(m => m.user_id === user?.id);
    const username = me?.profiles?.username || 'Traveler';
    const payload  = { user_id: user.id, username, lat: pos.lat, lng: pos.lng, sent_at: new Date().toISOString() };
    if (btn) btn.disabled = true;
    try {
      await _rallyChannel.send({ type: 'broadcast', event: 'rally_pin', payload });
      _state.members
        .filter(m => m.user_id !== user.id)
        .forEach(m => DB.Notifications.push(m.user_id, 'rally', `${username} ส่งหมุด`, 'แตะเพื่อดูบนแผนที่').catch(() => {}));
      window.AppCore?.showToast?.('ส่งหมุด Rally แล้ว!');
    } catch {
      window.AppCore?.showToast?.('ส่งหมุดไม่สำเร็จ');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function _loadExpeditionLog() {
    const el = document.getElementById('guild-expedition-log');
    if (!el || !_state) return;
    try {
      const memberIds = _state.members.map(m => m.user_id);
      const events = await DB.Coop.getExpeditionLog(memberIds);
      if (!events.length) {
        el.innerHTML = `<p class="guild-list-empty">ยังไม่มีกิจกรรม</p>`;
        return;
      }
      const iconFor  = { capture: 'bi-trophy', fog: 'bi-map', lore: 'bi-book' };
      const labelFor = { capture: 'จับ', fog: 'เปิดหมอก', lore: 'ปลดล็อก Lore:' };
      el.innerHTML = events.map(e => `
        <div class="guild-log-item">
          <i class="bi ${iconFor[e.type]} guild-log-icon"></i>
          <div class="guild-log-body">
            <p class="guild-log-text">
              <strong>${escapeHtml(e.user)}</strong> ${labelFor[e.type]}
              <span class="guild-log-detail">${escapeHtml(e.detail)}</span>
            </p>
            <p class="guild-log-time">${_relativeTime(e.ts)}</p>
          </div>
        </div>`).join('');
    } catch {
      el.innerHTML = `<p class="guild-list-error">โหลดไม่สำเร็จ</p>`;
    }
  }

  function _renderNoGuild(pendingRequest = null) {
    return `
      <div class="guild-no-panel">
        <i class="bi bi-people guild-no-icon"></i>
        <h3 class="guild-no-title">ยังไม่มีกลุ่ม</h3>
        <p class="guild-no-desc">สร้างหรือเข้าร่วมกลุ่มเพื่อเล่นร่วมกับเพื่อน</p>
        ${pendingRequest ? `
          <div class="guild-pending-banner">
            <p><i class="bi bi-hourglass-split"></i> รอการอนุมัติจาก <strong>${escapeHtml(pendingRequest.guilds?.name || '...')}</strong></p>
            <button id="btn-cancel-request" class="guild-pending-cancel"
                    data-req-id="${escapeHtml(pendingRequest.id)}">ยกเลิก</button>
          </div>` : ''}
        <input id="guild-name-input" type="text" placeholder="ชื่อกลุ่มใหม่..." class="guild-input" autocomplete="off">
        <textarea id="guild-desc-input" placeholder="คำอธิบายกลุ่ม (ไม่บังคับ)" rows="2" maxlength="200"
                  class="guild-textarea" autocomplete="off"></textarea>
        <button class="btn btn-primary btn-full" id="btn-create-guild"
                style="font-size:13px;padding:7px 10px;margin-bottom:var(--space-sm)">
          สร้างกลุ่มใหม่</button>
        <div style="display:flex;align-items:flex-end;gap:8px">
          <input id="guild-code-input" type="text" placeholder="กรอกรหัสเชิญ 6 หลัก"
                 maxlength="6" class="guild-input guild-code-input" autocomplete="off"
                 style="flex:1;margin-bottom:0">
          <button id="btn-join-guild"
                  class="btn btn-outline btn-sm"
                  style="display:flex;align-items:center;gap:4px;white-space:nowrap;
                         font-size:12px;padding:8px 14px;flex-shrink:0">
            <i class="bi bi-box-arrow-in-right"></i> เข้าร่วม
          </button>
        </div>
        <p id="guild-error" style="font-size:11px;color:var(--color-danger);margin:6px 0 0;min-height:16px"></p>
      </div>
      <div style="margin-top:var(--space-md)">
        <p class="guild-find-hint">หรือค้นหากลุ่ม</p>
        <div class="guild-find-row" style="align-items:flex-end">
          <input id="findgroup-search-input" type="text" placeholder="ค้นหากลุ่ม..."
                 class="guild-input" autocomplete="off" style="flex:1;margin-bottom:0">
          <button class="btn btn-primary" id="btn-findgroup-search"
                  style="white-space:nowrap;font-size:12px;padding:8px 16px;flex-shrink:0">ค้นหา</button>
        </div>
        <div id="findgroup-results" style="margin-top:var(--space-md)"></div>
      </div>`;
  }

  function _bindNoGuildActions(el, pendingRequest) {
    el.querySelector('#btn-create-guild')?.addEventListener('click', _handleCreate);
    el.querySelector('#btn-join-guild')?.addEventListener('click', _handleJoin);

    const searchInput = el.querySelector('#findgroup-search-input');
    const searchBtn   = el.querySelector('#btn-findgroup-search');
    const resultsEl   = el.querySelector('#findgroup-results');
    if (searchInput && searchBtn && resultsEl) {
      const doSearch = () => _loadFindGroupResults(resultsEl, searchInput.value.trim(), null);
      searchBtn.addEventListener('click', doSearch);
      searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
      doSearch();
    }

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
    const desc  = document.getElementById('guild-desc-input')?.value?.trim() || undefined;
    const errEl = document.getElementById('guild-error');
    if (!name) { if (errEl) errEl.textContent = 'กรุณาใส่ชื่อกลุ่ม'; return; }
    try {
      await DB.Coop.createGuild(name, _userId, desc);
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
        resultsEl.innerHTML = `<p class="guild-list-empty">ไม่พบกลุ่ม</p>`;
        return;
      }

      resultsEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        ${guilds.map((g, i) => {
          const isMyGuild = !!(myGuildId && g.id === myGuildId);
          const isPending = pendingReq?.guild_id === g.id;
          const disabled  = !!myGuildId || isMyGuild || isPending;
          const btnLabel  = isMyGuild ? 'คุณอยู่แล้ว' : isPending ? 'รอการอนุมัติ' : 'ขอเข้าร่วม';
          return `
            <div class="guild-result-card">
              <div class="guild-result-head">
                <span class="guild-result-rank">${i + 1}</span>
                <div class="guild-result-body">
                  <p class="guild-result-name">${escapeHtml(g.name)}</p>
                  <p class="guild-result-meta">
                    ${g.member_count} สมาชิก · ${(g.guild_legacy_score || 0).toLocaleString()} pts</p>
                </div>
                <button class="btn btn-primary"
                        style="font-size:11px;padding:6px 12px;white-space:nowrap;flex-shrink:0;${disabled ? 'opacity:.5;cursor:default' : ''}"
                        data-guild-id="${escapeHtml(g.id)}"
                        ${disabled ? 'disabled' : ''}>
                  ${btnLabel}
                </button>
              </div>
              ${(g.description || g.announcement) ? `
                <div class="guild-result-desc">
                  <p>${escapeHtml(g.description || g.announcement)}</p>
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
      resultsEl.innerHTML = `<p class="guild-list-empty">เกิดข้อผิดพลาด</p>`;
    }
  }

  return { init, getState, getOnlineMemberIds, subscribePresence, renderGuildPanel };
})();

window.GuildModule = GuildModule;
