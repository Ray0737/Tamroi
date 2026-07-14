// ── Co-op Mission Module ──────────────────────────────
const CoopModule = (() => {
  let _progressChannels = [];
  // Session-only: mission ids the player has tapped open. Every mission
  // (checkin or jigsaw) starts as a closed paper-ticket cover; opening one
  // swaps that single slot for its full content instead of reloading the list.
  const _openMissions = new Set();

  async function load() {
    const el = document.getElementById('coop-missions');
    if (!el) return;

    const user = window.AppCore?.App?.user;
    // GuildModule.init() fires once at boot and isn't necessarily done yet
    // by the time a user taps the Mission tab — without this await, a
    // guild member landing here early sees "join a guild" because
    // getState() is read before the fetch resolves.
    await window.GuildModule?.ready?.();
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

      if (!missions.length) { el.innerHTML = _noMissionsCard(); return; }

      el.innerHTML = `
        <div>
          <h3 class="section-title" style="margin-bottom:var(--space-sm)"><i class="bi bi-people-fill"></i> ภารกิจกลุ่ม</h3>
          <div id="coop-mission-cards"></div>
        </div>`;

      const cardsEl = document.getElementById('coop-mission-cards');
      for (const [missionIndex, m] of missions.entries()) {
        const wrapper = document.createElement('div');
        wrapper.dataset.missionId = m.id;

        if (m.type === 'jigsaw') {
          const assignments = await DB.Coop.getJigsawAssignments(guild.guild.id, m.id);
          if (guild.guild.myRole === 'leader' && assignments.length === 0) {
            const members = await DB.Coop.getGuildMembers(guild.guild.id);
            const memberIds = members.map(mem => mem.user_id);
            if (memberIds.length >= 2) {
              await DB.Coop.assignJigsawChapters(guild.guild.id, m.id, memberIds);
              const fresh = await DB.Coop.getJigsawAssignments(guild.guild.id, m.id);
              assignments.push(...fresh);
            }
          }
          await _renderJigsawSlot(wrapper, m, assignments, user.id, guild.guild.id, missionIndex + 1);
        } else {
          const checkins  = existingCheckins.filter(c => c.mission_id === m.id);
          const myCheckin = checkins.find(c => c.user_id === user.id);
          _renderCheckinSlot(wrapper, m, checkins.length, myCheckin, guild, user, missionIndex + 1);
        }

        cardsEl.appendChild(wrapper);
      }
    } catch {
      el.innerHTML = _noMissionsCard();
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
        window.AppCore?.showToast('คุณอยู่ไกลเกินไป · เดินทางให้ใกล้กว่านี้');
        return;
      }
    }
    try {
      await DB.Coop.checkInToMission(mission.id, guild.guild.id, user.id);
      // UI update comes from the postgres_changes subscription
    } catch { /* duplicate checkin · ignore */ }
  }

  // ── Closed paper-ticket cover, shared by checkin + jigsaw missions ────
  function _missionCoverHtml(mission, indexLabel, kicker, done) {
    return `
      <article class="coop-mission-card sq-mission-pass sq-mission-pass--${indexLabel} sq-mission-cover ${done ? 'done' : ''}" data-cover>
        <div class="sq-mission-rail" aria-hidden="true">
          <strong>${indexLabel}</strong>
          <span>MISSION</span>
          <i class="bi bi-lightning-charge-fill"></i>
        </div>
        <div class="sq-mission-pass-body">
          <div class="coop-mission-head">
            <i class="bi bi-flag" aria-hidden="true"></i>
            <div class="sq-mission-heading">
              <span class="sq-mission-kicker">${escapeHtml(kicker)}</span>
              <p class="coop-mission-title">${escapeHtml(mission.title_th)}</p>
            </div>
            <span class="coop-mission-badge ${done ? 'done' : ''}">
              ${done ? `<i class="bi bi-check-circle-fill"></i> สำเร็จ` : `+${mission.reward_pts} pts`}
            </span>
          </div>
          <button type="button" class="sq-cover-open-btn" data-open-mission>
            <i class="bi bi-chevron-down"></i> แตะเพื่อเปิดภารกิจ
          </button>
        </div>
      </article>`;
  }

  function _renderCheckinSlot(wrapper, mission, checkinCount, myCheckin, guild, user, missionIndex = 1, skipSubscribe = false) {
    const done = checkinCount >= mission.required_players;
    const indexLabel = String(missionIndex).padStart(2, '0');

    if (!_openMissions.has(mission.id)) {
      wrapper.innerHTML = _missionCoverHtml(mission, indexLabel, `FIELD MISSION ${indexLabel}`, done);
      wrapper.querySelector('[data-open-mission]')?.addEventListener('click', () => {
        _openMissions.add(mission.id);
        _renderCheckinSlot(wrapper, mission, checkinCount, myCheckin, guild, user, missionIndex);
      });
      return;
    }

    wrapper.innerHTML = renderMissionCard(mission, checkinCount, myCheckin, missionIndex);
    wrapper.querySelector('[data-checkin-btn]')?.addEventListener('click', () => _doCheckin(mission, guild, user, wrapper));
    if (!skipSubscribe) subscribeProgress(mission.id, guild.guild.id, wrapper, mission, user, missionIndex);
  }

  async function _renderJigsawSlot(wrapper, mission, assignments, currentUserId, guildId, missionIndex = 1) {
    const indexLabel = String(missionIndex).padStart(2, '0');

    if (!_openMissions.has(mission.id)) {
      wrapper.innerHTML = _missionCoverHtml(mission, indexLabel, `JIGSAW MISSION ${indexLabel}`, false);
      wrapper.querySelector('[data-open-mission]')?.addEventListener('click', async () => {
        _openMissions.add(mission.id);
        await _renderJigsawSlot(wrapper, mission, assignments, currentUserId, guildId, missionIndex);
      });
      return;
    }

    wrapper.innerHTML = await _renderJigsawCard(mission, assignments, currentUserId, guildId, missionIndex);
    wrapper.querySelector('[data-jigsaw-collapse]')?.addEventListener('click', () => {
      _openMissions.delete(mission.id);
      _renderJigsawSlot(wrapper, mission, assignments, currentUserId, guildId, missionIndex);
    });
    _wireJigsawCard(wrapper, mission, assignments, currentUserId, guildId);
  }

  function renderMissionCard(mission, checkinCount, myCheckin, missionIndex = 1) {
    const done = checkinCount >= mission.required_players;
    const pct  = Math.min(100, Math.round((checkinCount / mission.required_players) * 100));
    const indexLabel = String(missionIndex).padStart(2, '0');

    return `
      <article class="coop-mission-card sq-mission-pass sq-mission-pass--${indexLabel} ${done ? 'done' : ''}">
        <div class="sq-mission-rail" aria-hidden="true">
          <strong>${indexLabel}</strong>
          <span>MISSION</span>
          <i class="bi bi-lightning-charge-fill"></i>
        </div>
        <div class="sq-mission-pass-body">
          <div class="coop-mission-head">
            <i class="bi bi-flag" aria-hidden="true"></i>
            <div class="sq-mission-heading">
              <span class="sq-mission-kicker">FIELD MISSION ${indexLabel}</span>
              <p class="coop-mission-title">${escapeHtml(mission.title_th)}</p>
            </div>
            <span class="coop-mission-badge ${done ? 'done' : ''}">
              ${done ? `<i class="bi bi-check-circle-fill"></i> สำเร็จ` : `+${mission.reward_pts} pts`}
            </span>
          </div>
          <p class="coop-mission-desc">${escapeHtml(mission.description_th || '')}</p>
          <div class="coop-progress-row">
            <span><strong>${checkinCount} / ${mission.required_players}</strong> สมาชิกเช็คอินแล้ว</span>
            <b>${pct}%</b>
          </div>
          <div class="coop-progress-track" aria-label="${pct}% complete">
            <div class="coop-progress-fill ${done ? 'done' : 'pending'}" style="width:${pct}%"></div>
          </div>
          ${!myCheckin && !done ? `
            <button type="button" class="btn btn-primary btn-full coop-checkin-btn" data-checkin-btn>
              เช็คอินภารกิจนี้
            </button>` : ''}
        </div>
      </article>`;
  }

  function subscribeProgress(missionId, guildId, wrapperEl, mission, user, missionIndex = 1) {
    const ch = DB.Coop.subscribeMissionProgress(missionId, guildId, async () => {
      try {
        const checkins  = await DB.Coop.getMissionCheckins(missionId, guildId);
        const myCheckin = checkins.find(c => c.user_id === user?.id);
        _renderCheckinSlot(wrapperEl, mission, checkins.length, myCheckin, { guild: { id: guildId } }, user, missionIndex, true);
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
      <div class="coop-no-guild" data-empty>
        <i class="bi bi-people"></i>
        <p>เข้าร่วมกลุ่มเพื่อทำภารกิจร่วมกัน</p>
        <p class="hint">ไปที่แท็บ Rank → กลุ่ม</p>
      </div>`;
  }

  function _noMissionsCard() {
    return `
      <div class="coop-no-guild" data-empty>
        <i class="bi bi-flag"></i>
        <p>ยังไม่มีภารกิจกลุ่มในตอนนี้</p>
      </div>`;
  }

  // ── Jigsaw v2 · GPS checkpoint + timeline reconstruction ──────────────
  const _CHAPTER_LABELS = ['บทที่ 1: กำแพงเมือง', 'บทที่ 2: แกนพระราชวัง', 'บทที่ 3: วัดโพธิ์'];
  const _jigsawQuizPassed  = new Set(); // session-only: assignment.id once recall quiz cleared
  const _jigsawRecallCache = new Map(); // lore_node_id → questions[]

  function _chapterLabel(i) { return _CHAPTER_LABELS[i] || `บทที่ ${i + 1}`; }

  // ── Timer: 20 min from the group's earliest assignment, purely
  // client-side (reuses the existing assigned_at column — no schema
  // change). A single shared interval ticks every [data-jigsaw-deadline]
  // element on the page once a second.
  const _JIGSAW_TIME_LIMIT_MS = 20 * 60 * 1000;

  function _jigsawDeadline(assignments) {
    const times = assignments.map(a => new Date(a.assigned_at).getTime()).filter(t => !Number.isNaN(t));
    if (!times.length) return null;
    return Math.min(...times) + _JIGSAW_TIME_LIMIT_MS;
  }

  function _jigsawTimerMarkup(assignments) {
    const deadline = _jigsawDeadline(assignments);
    if (!deadline) return '';
    return `<span class="jigsaw-timer" data-jigsaw-deadline="${deadline}"><i class="bi bi-stopwatch"></i> --:--</span>`;
  }

  function _jigsawFormatRemaining(ms) {
    if (ms <= 0) return 'หมดเวลา';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function _jigsawStartTimerTicker() {
    setInterval(() => {
      document.querySelectorAll('[data-jigsaw-deadline]').forEach(el => {
        const remaining = Number(el.dataset.jigsawDeadline) - Date.now();
        el.classList.toggle('jigsaw-timer-expired', remaining <= 0);
        el.innerHTML = `<i class="bi bi-stopwatch"></i> ${_jigsawFormatRemaining(remaining)}`;
      });
    }, 1000);
  }
  _jigsawStartTimerTicker();

  // ── Overview: always-visible per-member status row, independent of
  // whichever phase the current viewer happens to be in.
  const _JIGSAW_STATUS_ICON = {
    locked: 'bi-lock-fill', quiz: 'bi-question-circle-fill',
    pending: 'bi-pencil-fill', done: 'bi-check-circle-fill', voted: 'bi-flag-fill',
  };

  function _jigsawMemberStatus(assign) {
    if (!assign.summary_posted) {
      const unlocked = window.MapModule?.getUnlockedLoreIds?.()?.includes(assign.lore_node_id);
      return unlocked ? { key: 'pending', label: 'กำลังเขียนสรุป' } : { key: 'locked', label: 'ยังไม่ปลดล็อก' };
    }
    if (assign.proposed_order) return { key: 'voted', label: 'ยืนยันลำดับแล้ว' };
    return { key: 'done', label: 'ส่งสรุปแล้ว' };
  }

  function _jigsawOverviewMarkup(assignments) {
    if (!assignments.length) return '';
    return `
      <div class="jigsaw-overview">
        <p class="jigsaw-overview-label"><i class="bi bi-people-fill"></i> ภาพรวมทีม</p>
        <div class="jigsaw-overview-list">
          ${assignments.map(a => {
            const status = _jigsawMemberStatus(a);
            return `
              <div class="jigsaw-overview-row">
                ${avatarHTML(a.profiles?.avatar_url, escapeHtml((a.profiles?.username || '?').slice(0, 2).toUpperCase()), 22, 'var(--color-border)')}
                <span class="jigsaw-overview-name">${escapeHtml(a.profiles?.username || '?')}</span>
                <span class="jigsaw-overview-chapter">${escapeHtml(_chapterLabel(a.chapter_index))}</span>
                <span class="jigsaw-overview-status jigsaw-overview-status-${status.key}">
                  <i class="bi ${_JIGSAW_STATUS_ICON[status.key]}"></i> ${escapeHtml(status.label)}
                </span>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  async function _renderJigsawCard(mission, assignments, currentUserId, guildId, missionIndex = 1) {
    const myAssign = assignments.find(a => a.user_id === currentUserId);
    const indexLabel = String(missionIndex).padStart(2, '0');
    let bodyHtml;
    let step = 1;             // which checkpoint node (1-4) is active
    let status = 'WAITING';   // top-right eyebrow label
    let footerHint = 'รอผู้นำกิลด์แจกบทอ่าน';

    if (!myAssign) {
      bodyHtml = `<p style="font-size:12px;color:var(--color-muted)">
        รอผู้นำกิลด์กดปุ่ม <strong>แจกบทอ่าน</strong> เพื่อเริ่ม Jigsaw
        <br><span style="font-size:10px">(ต้องการสมาชิกอย่างน้อย 2 คน)</span></p>`;
    } else if (!myAssign.summary_posted) {
      const unlocked = window.MapModule?.getUnlockedLoreIds?.()?.includes(myAssign.lore_node_id);
      if (!unlocked) {
        bodyHtml = _jigsawLockedBody(myAssign);
        step = 1; status = 'ACTIVE QUEST'; footerHint = 'เดินทางไปจุดหมายเพื่อปลดล็อกบท';
      } else {
        const questions = await _jigsawGetRecallQuestions(myAssign.lore_node_id);
        if (questions.length && !_jigsawQuizPassed.has(myAssign.id)) {
          bodyHtml = _jigsawQuizBody(myAssign, questions);
          step = 2; status = 'ACTIVE QUEST'; footerHint = 'ตอบคำถามให้ถูกก่อนสรุปบท';
        } else {
          bodyHtml = _jigsawContributeBody(mission, myAssign, assignments);
          step = 3; status = 'ACTIVE QUEST'; footerHint = 'กรอกสรุปบทของคุณ';
        }
      }
    } else if (!assignments.every(a => a.summary_posted)) {
      bodyHtml = _jigsawSubmittedBody(assignments);
      step = 3; status = 'WAITING TEAM'; footerHint = 'รอสมาชิกคนอื่นส่งสรุปบท';
    } else {
      bodyHtml = await _jigsawMergeBody(mission, assignments, guildId, currentUserId);
      const won = bodyHtml.includes('jigsaw-result-win');
      const lost = bodyHtml.includes('jigsaw-result-lose');
      step = 4;
      status = won ? 'COMPLETE' : lost ? 'RETRY' : 'MERGE PHASE';
      footerHint = won ? 'สำเร็จ! ทุกคนได้รับรางวัลแล้ว' : lost ? 'ลำดับยังไม่ถูกต้อง ลองใหม่' : 'เรียงลำดับเวลาให้ถูกต้องแล้วยืนยัน';
    }

    const doneCount = Math.min(step - 1, 4);
    const track = [1, 2, 3, 4].map((n, i) => {
      const cls = n < step ? 'done' : n === step ? 'active' : '';
      return `<span class="jigsaw-route-node ${cls}">${String(n).padStart(2, '0')}</span>${i < 3 ? '<span class="jigsaw-route-connector"></span>' : ''}`;
    }).join('');

    return `
      <article class="jigsaw-route-card" data-mission-id="${escapeHtml(mission.id)}">
        <div class="jigsaw-route-topbar">
          <span class="jigsaw-route-eyebrow">ROUTE ${indexLabel}</span>
          <span class="jigsaw-route-status">${status}</span>
          <button type="button" class="jigsaw-route-collapse" data-jigsaw-collapse aria-label="ย่อภารกิจ">
            <i class="bi bi-chevron-up"></i>
          </button>
        </div>
        <div class="jigsaw-route-header">
          <div class="jigsaw-route-icon"><i class="bi bi-puzzle-fill"></i></div>
          <div class="jigsaw-route-heading">
            <h4 class="jigsaw-route-title">${escapeHtml(mission.title_th)}</h4>
            <p class="jigsaw-route-sub">Jigsaw Mission ${indexLabel}</p>
          </div>
          <span class="jigsaw-route-badge">+${mission.reward_pts}<small>PTS</small></span>
        </div>
        <div class="jigsaw-route-track" aria-hidden="true">${track}</div>
        ${_jigsawTimerMarkup(assignments)}
        <div class="jigsaw-route-body">${bodyHtml}</div>
        ${_jigsawOverviewMarkup(assignments)}
        <div class="jigsaw-route-footer">
          <span>${escapeHtml(footerHint)}</span>
          <span>${doneCount}/4 CHECKPOINTS</span>
        </div>
      </article>`;
  }

  async function _jigsawGetRecallQuestions(loreNodeId) {
    if (!loreNodeId) return [];
    if (_jigsawRecallCache.has(loreNodeId)) return _jigsawRecallCache.get(loreNodeId);
    let questions = [];
    try { questions = await DB.Lore.getRecallQuestions(loreNodeId); } catch { /* ponytail: skip gate when the fetch fails, same as no questions seeded */ }
    _jigsawRecallCache.set(loreNodeId, questions);
    return questions;
  }

  // ── Phase 2: locked (GPS gate) ────────────────────────
  function _jigsawLockedBody(assign) {
    const node = (window.MapModule?.getLoreNodes?.() || []).find(n => n.id === assign.lore_node_id);
    return `
      <p class="jigsaw-chapter-label">${escapeHtml(_chapterLabel(assign.chapter_index))}</p>
      <div class="jigsaw-locked">
        <i class="bi bi-geo-alt"></i>
        <p>เดินทางไปที่ <strong>${escapeHtml(node?.name_th || 'จุดที่กำหนด')}</strong> เพื่อปลดล็อกบทนี้</p>
        ${node ? `<button class="btn btn-outline btn-sm" data-jigsaw-flyto="${node.lat}|${node.lng}">ดูตำแหน่งบนแผนที่</button>` : ''}
      </div>`;
  }

  // ── Phase 3a: expert quiz gate ────────────────────────
  function _jigsawQuizBody(assign, questions) {
    return `
      <p class="jigsaw-chapter-label">${escapeHtml(_chapterLabel(assign.chapter_index))}</p>
      <p class="jigsaw-hint">ตอบคำถามให้ถูกก่อนสรุปบท</p>
      <div class="jigsaw-quiz" data-assignment-id="${escapeHtml(assign.id)}">
        ${questions.map((q, qi) => `
          <div class="jigsaw-quiz-q" data-q="${qi}">
            <p class="jigsaw-quiz-question">${escapeHtml(q.question_th)}</p>
            <div class="quiz-option-grid">
              ${['A', 'B', 'C', 'D'].map(opt => `
                <button class="quiz-option" type="button" data-opt="${opt}">
                  <span class="quiz-option-letter">${opt}</span>
                  <span class="quiz-option-text">${escapeHtml(q['option_' + opt.toLowerCase()] || '')}</span>
                </button>
              `).join('')}
            </div>
          </div>`).join('')}
        <button class="btn btn-primary btn-sm btn-full" data-jigsaw-submit-quiz disabled style="margin-top:8px">ตรวจคำตอบ</button>
      </div>`;
  }

  // ── Phase 3b: structured summary form ─────────────────
  function _jigsawContributeBody(mission, assign, assignments) {
    const done = assignments.filter(a => a.summary_posted).length;
    return `
      <p class="jigsaw-chapter-label">${escapeHtml(_chapterLabel(assign.chapter_index))}</p>
      <p class="jigsaw-hint">ความคืบหน้า: ${done}/${assignments.length} บทเสร็จสิ้น</p>
      <div class="jigsaw-form" data-assignment-id="${escapeHtml(assign.id)}" data-mission-id="${escapeHtml(mission.id)}">
        <label class="jigsaw-field-label">ช่วงเวลา</label>
        <input class="jigsaw-input" data-field="period" maxlength="60" placeholder="เช่น รัชกาลที่ 1, พ.ศ. 2325">
        <label class="jigsaw-field-label">บุคคลสำคัญ</label>
        <input class="jigsaw-input" data-field="figure" maxlength="60" placeholder="ใครมีบทบาทในเหตุการณ์นี้">
        <label class="jigsaw-field-label">เหตุการณ์สำคัญ</label>
        <textarea class="jigsaw-input" data-field="event" maxlength="300" rows="2" placeholder="สรุปสาระสำคัญ (สูงสุด 300 ตัวอักษร)"></textarea>
        <button class="btn btn-primary btn-sm btn-full" data-jigsaw-submit-summary style="margin-top:8px">ส่งสรุปบท</button>
      </div>`;
  }

  // ── Phase 3: waiting for teammates ────────────────────
  function _jigsawSubmittedBody(assignments) {
    const done = assignments.filter(a => a.summary_posted).length;
    return `
      <div class="jigsaw-locked">
        <i class="bi bi-check-circle"></i>
        <p>คุณส่งสรุปแล้ว · รอสมาชิกคนอื่น (${done}/${assignments.length} บท)</p>
      </div>`;
  }

  // ── Phase 4: merge · shuffle, drag-reorder, vote ──────
  async function _jigsawMergeBody(mission, assignments, guildId, currentUserId) {
    const myAssign = assignments.find(a => a.user_id === currentUserId);
    const votes = assignments.filter(a => a.proposed_order);
    const allVoted = votes.length === assignments.length;

    if (allVoted) {
      const same = votes.every(a => JSON.stringify(a.proposed_order) === JSON.stringify(votes[0].proposed_order));
      if (same) {
        let won = false;
        try { won = await DB.Coop.isJigsawComplete(mission.id, guildId); } catch {}
        return won ? _jigsawResultBody(assignments, true) : _jigsawResultBody(assignments, false);
      }
    }

    const order = _seededShuffle(assignments.map(a => a.chapter_index), `${guildId}:${mission.id}`);
    return `
      <p class="jigsaw-hint">${votes.length}/${assignments.length} คนยืนยันลำดับแล้ว · ลากการ์ดให้เรียงตามช่วงเวลาที่ถูกต้อง แล้วกดยืนยัน</p>
      <div class="jigsaw-merge-list" data-mission-id="${escapeHtml(mission.id)}" data-guild-id="${escapeHtml(guildId)}">
        ${order.map(chapterIdx => {
          const a = assignments.find(x => x.chapter_index === chapterIdx);
          const summary = _jigsawParseSummary(a?.chapter_summary);
          return `
            <div class="jigsaw-merge-card" draggable="true" data-chapter="${chapterIdx}">
              <span class="jigsaw-merge-handle"><i class="bi bi-grip-vertical"></i></span>
              <div style="min-width:0;flex:1">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                  ${avatarHTML(a?.profiles?.avatar_url, escapeHtml((a?.profiles?.username || '?').slice(0, 2).toUpperCase()), 20, 'var(--color-border)')}
                  <span class="jigsaw-merge-author">${escapeHtml(a?.profiles?.username || '?')}</span>
                </div>
                <p class="jigsaw-merge-line"><strong>${escapeHtml(summary.period || '·')}</strong> · ${escapeHtml(summary.figure || '·')}</p>
                <p class="jigsaw-merge-line muted">${escapeHtml(summary.event || '')}</p>
              </div>
            </div>`;
        }).join('')}
      </div>
      <button class="btn btn-primary btn-sm btn-full" data-jigsaw-submit-order style="margin-top:10px">ยืนยันลำดับเวลา</button>`;
  }

  function _jigsawResultBody(assignments, won) {
    if (won) {
      return `
        <div class="jigsaw-result jigsaw-result-win">
          <i class="bi bi-trophy-fill"></i>
          <p>เรียงลำดับถูกต้อง! ทุกคนได้รับรางวัลแล้ว</p>
        </div>`;
    }
    return `
      <div class="jigsaw-result jigsaw-result-lose">
        <i class="bi bi-x-circle"></i>
        <p>ลำดับยังไม่ถูกต้อง · คุยกับกิลด์แล้วลองใหม่</p>
        <button class="btn btn-outline btn-sm" data-jigsaw-retry-order>ลองใหม่</button>
      </div>`;
  }

  function _jigsawParseSummary(raw) {
    try { return JSON.parse(raw || '{}'); } catch { return { event: raw || '' }; }
  }

  // Tiny seeded PRNG (mulberry32-style) so every guild member sees the same
  // shuffle order for a given mission · doesn't affect correctness (each
  // client submits its own dragged order), just keeps group discussion sane.
  function _seededShuffle(arr, seedStr) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _enableJigsawDrag(container) {
    let dragEl = null;
    container.querySelectorAll('.jigsaw-merge-card').forEach(card => {
      card.addEventListener('dragstart', () => { dragEl = card; card.classList.add('dragging'); });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragEl = null; });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        if (!dragEl || dragEl === card) return;
        const rect = card.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        container.insertBefore(dragEl, before ? card : card.nextSibling);
      });
    });
  }

  // ── Wiring · attaches listeners for whichever state just rendered ────
  function _wireJigsawCard(wrapper, mission, assignments, currentUserId, guildId) {
    const myAssign = assignments.find(a => a.user_id === currentUserId);

    wrapper.querySelector('[data-jigsaw-flyto]')?.addEventListener('click', e => {
      const [lat, lng] = e.currentTarget.dataset.jigsawFlyto.split('|').map(Number);
      window.AppCore?.switchTab?.('map');
      window.MapModule?.flyToLocation?.(lat, lng, 17);
    });

    // Quiz gate · click to select, all-correct unlocks the summary form
    const quizEl = wrapper.querySelector('.jigsaw-quiz');
    if (quizEl && myAssign) {
      const answers = {};
      quizEl.querySelectorAll('.jigsaw-quiz-q').forEach(qEl => {
        const qi = qEl.dataset.q;
        qEl.querySelectorAll('.quiz-option').forEach(btn => {
          btn.addEventListener('click', () => {
            qEl.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            answers[qi] = btn.dataset.opt;
            const submitBtn = quizEl.querySelector('[data-jigsaw-submit-quiz]');
            if (submitBtn) submitBtn.disabled = Object.keys(answers).length < quizEl.querySelectorAll('.jigsaw-quiz-q').length;
          });
        });
      });
      quizEl.querySelector('[data-jigsaw-submit-quiz]')?.addEventListener('click', async () => {
        const questions = await _jigsawGetRecallQuestions(myAssign.lore_node_id);
        const allCorrect = questions.every((q, qi) => answers[qi] === q.correct_option);
        if (!allCorrect) {
          window.AppCore?.showToast?.('มีคำตอบผิด ลองใหม่อีกครั้ง');
          quizEl.querySelectorAll('.quiz-option.selected').forEach(b => b.classList.remove('selected'));
          Object.keys(answers).forEach(k => delete answers[k]);
          quizEl.querySelector('[data-jigsaw-submit-quiz]').disabled = true;
          return;
        }
        _jigsawQuizPassed.add(myAssign.id);
        CoopModule.load();
      });
    }

    // Structured summary form
    const formEl = wrapper.querySelector('.jigsaw-form');
    formEl?.querySelector('[data-jigsaw-submit-summary]')?.addEventListener('click', async () => {
      const period = formEl.querySelector('[data-field="period"]')?.value.trim();
      const figure = formEl.querySelector('[data-field="figure"]')?.value.trim();
      const event_ = formEl.querySelector('[data-field="event"]')?.value.trim();
      if (!period || !figure || !event_) { window.AppCore?.showToast?.('กรอกให้ครบทุกช่อง'); return; }
      try {
        await DB.Coop.postJigsawSummary(guildId, mission.id, currentUserId, { period, figure, event: event_ });
        window.AppCore?.showToast?.('✓ ส่งสรุปบทเรียบร้อยแล้ว');
        CoopModule.load();
      } catch { window.AppCore?.showToast?.('ไม่สามารถส่งสรุปได้'); }
    });

    // Merge phase · drag reorder + vote
    const mergeList = wrapper.querySelector('.jigsaw-merge-list');
    if (mergeList) {
      _enableJigsawDrag(mergeList);
      wrapper.querySelector('[data-jigsaw-submit-order]')?.addEventListener('click', async () => {
        const order = [...mergeList.querySelectorAll('.jigsaw-merge-card')].map(c => Number(c.dataset.chapter));
        try {
          await DB.Coop.setProposedOrder(myAssign.id, order);
          window.AppCore?.showToast?.('✓ ยืนยันลำดับแล้ว · รอสมาชิกคนอื่น');
          CoopModule.load();
        } catch { window.AppCore?.showToast?.('ไม่สามารถบันทึกลำดับได้'); }
      });
      _jigsawSubscribeMerge(mission.id, guildId);
    }

    wrapper.querySelector('[data-jigsaw-retry-order]')?.addEventListener('click', async () => {
      try {
        await DB.Coop.clearProposedOrders(guildId, mission.id);
        CoopModule.load();
      } catch { window.AppCore?.showToast?.('ลองใหม่ไม่สำเร็จ'); }
    });
  }

  // No dedup guard needed · _cancelProgressSubs() at the top of every _liveLoad()
  // call already unsubscribes and clears _progressChannels, so this always
  // starts fresh each render pass.
  function _jigsawSubscribeMerge(missionId, guildId) {
    const ch = DB.Coop.subscribeJigsawAssignments(missionId, guildId, () => CoopModule.load());
    _progressChannels.push(ch);
  }

  return { load, renderMissionCard, subscribeProgress };
})();

window.CoopModule = CoopModule;
