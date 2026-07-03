// ── Co-op Mission Module ──────────────────────────────
const CoopModule = (() => {
  let _progressChannels = [];

  async function load() {
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
        const checkins  = existingCheckins.filter(c => c.mission_id === m.id);
        const myCheckin = checkins.find(c => c.user_id === user.id);
        const wrapper   = document.createElement('div');
        wrapper.dataset.missionId = m.id;
        wrapper.innerHTML = renderMissionCard(m, checkins.length, myCheckin);
        wrapper.querySelector('[data-checkin-btn]')?.addEventListener('click', () => _doCheckin(m, guild, user, wrapper));
        cardsEl.appendChild(wrapper);
        subscribeProgress(m.id, guild.guild.id, wrapper, m, user);
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

  function _noGuildCard() {
    return `
      <div class="coop-no-guild">
        <i class="bi bi-people"></i>
        <p>เข้าร่วมกลุ่มเพื่อทำภารกิจร่วมกัน</p>
        <p class="hint">ไปที่แท็บ Rank → กลุ่ม</p>
      </div>`;
  }

  return { load, renderMissionCard, subscribeProgress };
})();

window.CoopModule = CoopModule;
