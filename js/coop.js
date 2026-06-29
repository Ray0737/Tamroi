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
          <h3 class="section-title" style="margin-bottom:var(--space-sm)">🤝 ภารกิจกลุ่ม</h3>
          <div id="coop-mission-cards" style="display:flex;flex-direction:column;gap:var(--space-sm)"></div>
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

  async function _doCheckin(mission, guild, user, wrapperEl) {
    try {
      await DB.Coop.checkInToMission(mission.id, guild.guild.id, user.id);
      // UI update comes from the postgres_changes subscription
    } catch { /* duplicate or distance error — ignore */ }
  }

  function renderMissionCard(mission, checkinCount, myCheckin) {
    const done = checkinCount >= mission.required_players;
    const pct  = Math.min(100, Math.round((checkinCount / mission.required_players) * 100));

    return `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                  border:1px solid rgba(123,198,126,0.2);overflow:hidden">
        <div style="padding:var(--space-md);border-bottom:1px solid rgba(255,255,255,0.05)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:14px">🤝</span>
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
                         color:var(--color-success)">ภารกิจกลุ่ม</span>
          </div>
          <h4 style="margin:0 0 4px;font-family:var(--font-heading);font-size:14px;font-weight:700">
            ${escapeHtml(mission.title_th)}</h4>
          <p style="margin:0;font-size:11px;color:var(--color-muted);line-height:1.5">
            ${escapeHtml(mission.description_th || '')}</p>
        </div>
        <div style="padding:var(--space-sm) var(--space-md) var(--space-md)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:11px;color:var(--color-muted)">
              ${checkinCount} / ${mission.required_players} สมาชิกเช็คอินแล้ว
            </span>
            <span style="font-size:11px;font-weight:700;
                         color:${done ? 'var(--color-success)' : 'var(--color-primary)'}">
              ${done ? '✅ สำเร็จ' : `+${mission.reward_pts} pts`}
            </span>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:var(--radius-full);height:6px;overflow:hidden">
            <div style="height:100%;width:${pct}%;
                         background:${done ? 'var(--color-success)' : 'var(--color-primary)'};
                         border-radius:var(--radius-full);transition:width 0.4s ease"></div>
          </div>
          ${!myCheckin && !done ? `
            <button class="btn btn-primary btn-full" data-checkin-btn
                    style="margin-top:var(--space-sm);font-size:13px">
              เช็คอินภารกิจนี้
            </button>` : ''}
        </div>
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
      <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                  border:1px dashed var(--color-border);padding:var(--space-md);text-align:center">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:var(--color-muted)">
          🤝 เข้าร่วมกลุ่มเพื่อทำภารกิจร่วมกัน</p>
        <p style="margin:0;font-size:11px;color:var(--color-muted)">ไปที่แท็บ Rank → กลุ่ม</p>
      </div>`;
  }

  return { load, renderMissionCard, subscribeProgress };
})();

window.CoopModule = CoopModule;
