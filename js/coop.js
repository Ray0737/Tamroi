// ── Co-op Mission Module ──────────────────────────────
const CoopModule = (() => {
  let _progressChannels = [];

  // ponytail: group missions are disabled for now — show a locked placeholder
  // instead of the real panel. Bump/remove this to re-enable.
  const GROUP_MISSIONS_UNLOCK_DAYS = 14;

  async function load() {
    const el = document.getElementById('coop-missions');
    if (!el) return;

    el.innerHTML = _lockedCard();
    return;
  }

  async function _liveLoad() {
    const el = document.getElementById('coop-missions');
    if (!el) return;

    const user  = window.AppCore?.App?.user;
    const guild = window.GuildModule?.getState();

    if (!user || !guild) {
      el.innerHTML = _noGuildCard();
      return;
    }

    el.innerHTML = `<div style="display:flex;justify-content:center;padding:20px"><div class="spinner"></div></div>`;

    try {
      const [missions, existingCheckins] = await Promise.all([
        DB.Coop.getCollabMissions(),
        DB.Coop.getAllGuildCheckins(guild.guild.id)
      ]);

      _cancelProgressSubs();

      if (!missions.length) { el.innerHTML = ''; return; }

      el.innerHTML = `
        <div>
          <h3 class="section-title" style="margin-bottom:var(--space-sm)"><i class="bi bi-people-fill"></i> ภารกิจกลุ่ม</h3>
          <div id="coop-mission-cards"></div>
        </div>`;

      const cardsEl = document.getElementById('coop-mission-cards');
      for (const m of missions) {
        const wrapper = document.createElement('div');
        wrapper.dataset.missionId = m.id;

        if (m.type === 'jigsaw') {
          const assignments = await DB.Coop.getJigsawAssignments(guild.guild.id, m.id);
          if (guild.role === 'leader' && assignments.length === 0) {
            const members = await DB.Coop.getGuildMembers(guild.guild.id);
            const memberIds = members.map(mem => mem.user_id);
            if (memberIds.length >= 2) {
              await DB.Coop.assignJigsawChapters(guild.guild.id, m.id, memberIds);
              const fresh = await DB.Coop.getJigsawAssignments(guild.guild.id, m.id);
              assignments.push(...fresh);
            }
          }
          wrapper.innerHTML = _renderJigsawCard(m, assignments, user.id, guild.guild.id);
        } else {
          const checkins  = existingCheckins.filter(c => c.mission_id === m.id);
          const myCheckin = checkins.find(c => c.user_id === user.id);
          wrapper.innerHTML = renderMissionCard(m, checkins.length, myCheckin);
          wrapper.querySelector('[data-checkin-btn]')?.addEventListener('click', () => _doCheckin(m, guild, user, wrapper));
          subscribeProgress(m.id, guild.guild.id, wrapper, m, user);
        }

        cardsEl.appendChild(wrapper);
      }
    } catch {
      el.innerHTML = '';
    }
  }

  function _haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000, r = Math.PI / 180;
    const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function _isDev() { return ['localhost', '127.0.0.1', ''].includes(window.location.hostname); }

  async function _doCheckin(mission, guild, user, wrapperEl) {
    const pos = window.MapModule?.getLastKnownPosition?.();
    const d   = mission.districts;
    if (!_isDev() && pos && d) {
      const lat = d.watchtower_lat || d.center_lat;
      const lng = d.watchtower_lng || d.center_lng;
      if (_haversine(pos.lat, pos.lng, lat, lng) > 500) {
        window.AppCore?.showToast('คุณอยู่ไกลเกินไป — เดินทางให้ใกล้กว่านี้');
        return;
      }
    }
    try {
      await DB.Coop.checkInToMission(mission.id, guild.guild.id, user.id);
      // UI update comes from the postgres_changes subscription
    } catch { /* duplicate checkin — ignore */ }
  }

  function renderMissionCard(mission, checkinCount, myCheckin) {
    const done = checkinCount >= mission.required_players;
    const pct  = Math.min(100, Math.round((checkinCount / mission.required_players) * 100));

    return `
      <div class="coop-mission-card ${done ? 'done' : ''}">
        <div class="coop-mission-head">
          <i class="bi bi-flag"></i>
          <p class="coop-mission-title">${escapeHtml(mission.title_th)}</p>
          <span class="coop-mission-badge ${done ? 'done' : ''}">
            ${done ? `<i class="bi bi-check-circle-fill"></i> สำเร็จ` : `+${mission.reward_pts} pts`}
          </span>
        </div>
        <p class="coop-mission-desc">${escapeHtml(mission.description_th || '')}</p>
        <div class="coop-progress-row">
          <span>${checkinCount} / ${mission.required_players} สมาชิกเช็คอินแล้ว</span>
        </div>
        <div class="coop-progress-track">
          <div class="coop-progress-fill ${done ? 'done' : 'pending'}" style="width:${pct}%"></div>
        </div>
        ${!myCheckin && !done ? `
          <button class="btn btn-primary btn-full coop-checkin-btn" data-checkin-btn style="font-size:12px;padding:9px">
            เช็คอินภารกิจนี้
          </button>` : ''}
      </div>`;
  }

  function subscribeProgress(missionId, guildId, wrapperEl, mission, user) {
    const ch = DB.Coop.subscribeMissionProgress(missionId, guildId, async () => {
      try {
        const checkins  = await DB.Coop.getMissionCheckins(missionId, guildId);
        const myCheckin = checkins.find(c => c.user_id === user?.id);
        wrapperEl.innerHTML = renderMissionCard(mission, checkins.length, myCheckin);
        wrapperEl.querySelector('[data-checkin-btn]')?.addEventListener('click', () =>
          _doCheckin(mission, { guild: { id: guildId } }, user, wrapperEl)
        );
      } catch {}
    });
    _progressChannels.push(ch);
  }

  function _cancelProgressSubs() {
    _progressChannels.forEach(ch => { try { ch.unsubscribe(); } catch {} });
    _progressChannels = [];
  }

  function _lockedCard() {
    return `
      <div class="coop-no-guild" data-empty>
        <i class="bi bi-lock"></i>
        <p>ภารกิจกลุ่มจะปลดล็อกใน ${GROUP_MISSIONS_UNLOCK_DAYS} วัน</p>
        <p class="hint">เร็ว ๆ นี้</p>
      </div>`;
  }

  function _noGuildCard() {
    return `
      <div class="coop-no-guild">
        <i class="bi bi-people"></i>
        <p>เข้าร่วมกลุ่มเพื่อทำภารกิจร่วมกัน</p>
        <p class="hint">ไปที่แท็บ Rank → กลุ่ม</p>
      </div>`;
  }

  // ── Jigsaw rendering ──────────────────────────────────
  const _CHAPTER_LABELS = ['บทที่ 1: กำแพงเมือง', 'บทที่ 2: แกนพระราชวัง', 'บทที่ 3: วัดโพธิ์'];

  function _renderJigsawCard(mission, assignments, currentUserId, guildId) {
    const myAssign  = assignments.find(a => a.user_id === currentUserId);
    const allPosted = assignments.length >= 3 && assignments.every(a => a.summary_posted);

    let bodyHtml;
    if (!myAssign) {
      bodyHtml = `<p style="font-size:12px;color:var(--color-muted)">
        รอผู้นำกิลด์กดปุ่ม <strong>แจกบทอ่าน</strong> เพื่อเริ่ม Jigsaw
        <br><span style="font-size:10px">(ต้องการสมาชิกอย่างน้อย 2 คน)</span></p>`;
    } else if (allPosted) {
      bodyHtml = `<p style="font-size:12px;color:var(--color-success);margin-bottom:8px">
        ✓ ทุกบทเสร็จสิ้น — ภาพรวมสมบูรณ์ปรากฏแล้ว!</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${assignments.map(a => `
            <div style="background:rgba(206,147,216,0.08);border-radius:var(--radius-md);
                        padding:8px 10px;border-left:2px solid #CE93D8">
              <p style="font-size:10px;font-weight:700;color:#CE93D8;margin:0 0 3px">
                ${escapeHtml(a.profiles?.username || '?')} — ${escapeHtml(_CHAPTER_LABELS[a.chapter_index] || `บทที่ ${a.chapter_index + 1}`)}
              </p>
              <p style="font-size:11px;color:var(--color-muted);margin:0">${escapeHtml(a.chapter_summary || '')}</p>
            </div>`).join('')}
        </div>`;
    } else if (!myAssign.summary_posted) {
      bodyHtml = `
        <p style="font-size:11px;color:var(--color-muted);margin-bottom:8px">
          บทของคุณ: <strong style="color:var(--color-white)">${escapeHtml(_CHAPTER_LABELS[myAssign.chapter_index] || `บทที่ ${myAssign.chapter_index + 1}`)}</strong>
        </p>
        <p style="font-size:11px;color:var(--color-muted);margin-bottom:10px">
          ความคืบหน้า: ${assignments.filter(a => a.summary_posted).length}/${assignments.length} บทเสร็จสิ้น
        </p>
        <textarea id="jigsaw-summary-${escapeHtml(mission.id)}" maxlength="600" rows="3"
          style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--color-border);
                 border-radius:var(--radius-md);color:var(--color-white);font-size:12px;
                 padding:8px;resize:none;box-sizing:border-box;margin-bottom:8px"
          placeholder="สรุปสาระสำคัญจากบทที่คุณได้รับ (สูงสุด 600 ตัวอักษร)"></textarea>
        <button class="btn btn-primary btn-full" style="font-size:12px"
                onclick="CoopModule.postJigsawSummary('${escapeHtml(guildId)}','${escapeHtml(mission.id)}')">
          ส่งสรุปบท
        </button>`;
    } else {
      bodyHtml = `<p style="font-size:12px;color:var(--color-success)">
        ✓ คุณส่งสรุปแล้ว — รอสมาชิกคนอื่น (${assignments.filter(a => a.summary_posted).length}/${assignments.length} บท)</p>`;
    }

    return `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                  border:1px solid rgba(206,147,216,0.25);overflow:hidden;margin-bottom:12px">
        <div style="background:linear-gradient(135deg,rgba(206,147,216,0.15),rgba(206,147,216,0.04));
                    padding:var(--space-md);border-bottom:1px solid rgba(206,147,216,0.12)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:9px;text-transform:uppercase;font-weight:700;
                         color:#CE93D8;letter-spacing:1px">Jigsaw Mission</span>
            <span style="font-size:9px;color:var(--color-muted)">+${mission.reward_pts} pts</span>
          </div>
          <h4 style="font-family:var(--font-heading);font-size:14px;font-weight:700;margin:0">
            ${escapeHtml(mission.title_th)}
          </h4>
        </div>
        <div style="padding:var(--space-md)">${bodyHtml}</div>
      </div>`;
  }

  async function postJigsawSummary(guildId, missionId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    const textarea = document.getElementById(`jigsaw-summary-${missionId}`);
    const summary  = textarea?.value?.trim();
    if (!summary) { window.AppCore?.showToast?.('กรุณาเขียนสรุปบทก่อน'); return; }
    try {
      await DB.Coop.postJigsawSummary(guildId, missionId, user.id, summary);
      window.AppCore?.showToast?.('✓ ส่งสรุปบทเรียบร้อยแล้ว');
      CoopModule.init ? CoopModule.init() : CoopModule.load();
    } catch { window.AppCore?.showToast?.('ไม่สามารถส่งสรุปได้'); }
  }


  return { load, renderMissionCard, subscribeProgress, postJigsawSummary };
})();

window.CoopModule = CoopModule;
