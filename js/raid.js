// ── Raid Module ───────────────────────────────────────
const RaidModule = (() => {
  let _session     = null;   // raid_sessions row
  let _members     = [];     // { user_id, is_ready, joined_at, profiles }
  let _broadcastCh = null;
  let _presenceCh  = null;
  let _isHost      = false;
  let _questions   = [];
  let _qIndex      = 0;
  let _retried     = false;
  let _answers     = {};     // userId → answer letter
  let _answered    = [];     // userIds who answered ≥1 question
  let _timer       = null;
  const QUESTION_TIME = 30;

  function init() {
    // Hooks called by MapModule when raid figure info card is opened.
  }

  function canStartRaid(figure) {
    if (!figure?.raid_only) return false;
    const guild = window.GuildModule?.getState();
    if (!guild) return false;
    const online = window.GuildModule.getOnlineMemberIds();
    return online.size >= (figure.raid_min_players || 2);
  }

  async function openRaidModal(figure, existingSessionId = null) {
    const user  = window.AppCore?.App?.user;
    const guild = window.GuildModule?.getState();
    if (!user || !guild) return;

    const modal = document.getElementById('raid-modal');
    if (!modal) return;
    modal.removeAttribute('hidden');

    try {
      if (existingSessionId) {
        _session = await DB.Raid.getById(existingSessionId);
        _isHost  = _session.host_user_id === user.id;
      } else {
        _session = await DB.Raid.createSession(figure.id, guild.guild.id, user.id);
        _isHost  = true;
      }
      _answers = {}; _answered = []; _qIndex = 0; _retried = false;

      await DB.Raid.joinSession(_session.id, user.id);
      if (_isHost) _notifyGuildMembers(guild, _session, figure);

      _broadcastCh = DB.Raid.openBroadcast(_session.id);
      _presenceCh  = DB.Raid.openPresence(_session.id);

      _presenceCh.on('presence', { event: 'sync' }, () => {
        _members = _flatPresence(_presenceCh.presenceState());
        _refreshLobby();
      });
      _presenceCh.on('presence', { event: 'join' }, () => {
        _members = _flatPresence(_presenceCh.presenceState());
        _refreshLobby();
      });
      _presenceCh.on('presence', { event: 'leave' }, handleHostFailover);

      _presenceCh.track({ user_id: user.id, username: window.AppCore.App.profile?.username, joined_at: new Date().toISOString() });

      // Clients receive quiz questions and results from host
      _broadcastCh.on('broadcast', { event: 'QUESTION' }, ({ payload }) => {
        if (_isHost) return;
        _renderClientQuestion(payload);
      });
      _broadcastCh.on('broadcast', { event: 'ROUND_RESULT' }, ({ payload }) => {
        if (_isHost) return;
        _showRoundResult(payload.correct_option, payload.passed, payload.correct_count, payload.total_players);
      });
      _broadcastCh.on('broadcast', { event: 'RAID_COMPLETE' }, () => {
        if (!_isHost) _showComplete();
      });
      _broadcastCh.on('broadcast', { event: 'RAID_FAILED' }, ({ payload }) => {
        if (!_isHost) _failRaid(payload.reason, false);
      });
      _broadcastCh.on('broadcast', { event: 'READY' }, ({ payload }) => {
        const m = _members.find(m => m.user_id === payload.user_id);
        if (m) m.is_ready = true;
        _refreshLobby();
      });
      _broadcastCh.on('broadcast', { event: 'ANSWER' }, ({ payload }) => {
        if (!_isHost) return;
        _answers[payload.user_id] = payload.answer;
        if (!_answered.includes(payload.user_id)) _answered.push(payload.user_id);
        if (Object.keys(_answers).length >= Math.max(_members.length, 1)) _tallyAnswers();
      });

      renderLobbyModal(figure);
    } catch (e) {
      _close();
      window.AppCore?.showToast?.('ไม่สามารถเริ่ม Raid ได้: ' + (e.message || ''));
    }
  }

  function _flatPresence(state) {
    return Object.values(state || {}).flat().map(p => ({
      user_id:  p.user_id,
      is_ready: p.is_ready || false,
      joined_at: p.joined_at,
      profiles: { username: p.username }
    }));
  }

  async function _notifyGuildMembers(guild, session, figure) {
    for (const m of guild.members) {
      if (m.user_id === window.AppCore?.App?.user?.id) continue;
      try {
        await DB.Notifications.push(
          m.user_id, 'raid',
          `⚔️ Raid เริ่มแล้ว!`,
          `กลุ่มของคุณเริ่ม Raid ${figure.name_th || figure.id} — เข้าร่วมได้เลย`,
          session.id
        );
      } catch {}
    }
  }

  function renderLobbyModal(figure) {
    const content = document.getElementById('raid-modal-content');
    if (!content) return;
    const minReady = figure?.raid_min_players || 2;

    content.innerHTML = `
      <div style="padding:var(--space-md)">
        <div style="text-align:center;margin-bottom:var(--space-md)">
          <p style="font-size:32px;margin:0">⚔️</p>
          <h3 style="font-family:var(--font-heading);font-size:18px;font-weight:700;margin:6px 0 4px">
            ${escapeHtml(figure?.name_th || 'Raid')} Raid</h3>
          <p style="font-size:11px;color:var(--color-muted)">รอสมาชิกกดพร้อม ${minReady} คนขึ้นไป</p>
        </div>
        <div id="raid-member-grid" style="display:flex;flex-wrap:wrap;gap:var(--space-sm);
             justify-content:center;margin-bottom:var(--space-md)">
          ${_members.map(_memberAvatar).join('')}
        </div>
        ${_isHost ? `
          <button class="btn btn-primary btn-full" id="btn-start-raid"
                  ${_readyCount() < minReady ? 'disabled' : ''}>
            เริ่มได้เลย
          </button>` : `
          <p style="text-align:center;font-size:13px;color:var(--color-muted)">รอผู้นำ...</p>`}
        <button class="btn btn-ghost btn-full" id="btn-ready-up" style="margin-top:8px">
          พร้อม
        </button>
        <button class="btn btn-ghost btn-full" onclick="RaidModule._close()"
                style="margin-top:8px;font-size:12px;color:var(--color-muted)">
          ยกเลิก
        </button>
      </div>`;

    document.getElementById('btn-start-raid')?.addEventListener('click', _startRaid.bind(null, figure));
    document.getElementById('btn-ready-up')?.addEventListener('click', _setReady);
  }

  function _refreshLobby() {
    const grid = document.getElementById('raid-member-grid');
    if (!grid) return;
    grid.innerHTML = _members.map(_memberAvatar).join('');
    const startBtn = document.getElementById('btn-start-raid');
    if (startBtn) {
      const minReady = _session?.raid_min_players || 2;
      startBtn.disabled = _readyCount() < minReady;
    }
  }

  function _memberAvatar(m) {
    const p = m.profiles || {};
    return `
      <div style="text-align:center">
        <div style="position:relative;display:inline-block">
          <div class="avatar-sm" style="width:48px;height:48px;font-size:18px;
               border:2px solid ${m.is_ready ? 'var(--color-success)' : 'var(--color-border)'}">
            ${escapeHtml((p.username || '?').substring(0, 2).toUpperCase())}
          </div>
          ${m.is_ready ? `<span style="position:absolute;bottom:-2px;right:-2px;font-size:12px">✅</span>` : ''}
        </div>
        <p style="font-size:10px;margin:4px 0 0;color:var(--color-muted);max-width:52px;
                  overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${escapeHtml(p.username || '?')}</p>
      </div>`;
  }

  function _readyCount() {
    return _members.filter(m => m.is_ready).length;
  }

  async function _setReady() {
    const user = window.AppCore?.App?.user;
    if (!user || !_session) return;
    try { await DB.Raid.setReady(_session.id, user.id); } catch {}
    const me = _members.find(m => m.user_id === user.id);
    if (me) me.is_ready = true;
    _broadcastCh?.send({ type: 'broadcast', event: 'READY', payload: { user_id: user.id } });
    _refreshLobby();
    const btn = document.getElementById('btn-ready-up');
    if (btn) btn.textContent = '✅ พร้อมแล้ว';
  }

  async function _startRaid(figure) {
    if (!_isHost || !_session) return;
    await DB.Raid.updateSession(_session.id, { status: 'active', started_at: new Date().toISOString() });
    _questions = await DB.Quiz.getRaidQuestions(_session.figure_id, 3);
    _qIndex = 0; _answered = [];
    renderQuizScreen();
  }

  function renderQuizScreen() {
    const q = _questions[_qIndex];
    if (!q) { _completeRaid(); return; }

    const content = document.getElementById('raid-modal-content');
    if (!content) return;

    _answers = {};
    let timeLeft = QUESTION_TIME;
    let selfAnswered = false;

    content.innerHTML = `
      <div style="padding:var(--space-md)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-sm)">
          <span style="font-size:11px;color:var(--color-muted)">คำถาม ${_qIndex + 1} / ${_questions.length}</span>
          <span id="raid-timer" style="font-size:20px;font-weight:800;color:var(--color-primary)">${timeLeft}</span>
        </div>
        <div style="width:100%;background:rgba(255,255,255,0.08);border-radius:var(--radius-full);
                    height:4px;margin-bottom:var(--space-md);overflow:hidden">
          <div id="raid-timer-bar" style="height:100%;width:100%;background:var(--color-primary);
               border-radius:var(--radius-full);transition:width 1s linear"></div>
        </div>
        <p style="font-size:14px;font-weight:600;line-height:1.6;margin-bottom:var(--space-md)">
          ${escapeHtml(q.question_th || q.question || '')}</p>
        <div id="raid-options" style="display:flex;flex-direction:column;gap:var(--space-sm)">
          ${['A','B','C','D'].filter(opt => q[`option_${opt.toLowerCase()}`]).map(opt => `
            <button class="btn btn-outline" data-opt="${opt}"
                    style="text-align:left;font-size:13px;padding:10px var(--space-sm)">
              <span style="font-weight:700;margin-right:8px">${opt}.</span>
              ${escapeHtml(q[`option_${opt.toLowerCase()}`] || '')}
            </button>`).join('')}
        </div>
        <p id="raid-wait-msg" style="text-align:center;font-size:11px;color:var(--color-muted);
           margin-top:var(--space-sm)" hidden>รอคำตอบจากสมาชิกทุกคน...</p>
      </div>`;

    // Broadcast question to clients (host only)
    if (_isHost) {
      _broadcastCh?.send({
        type: 'broadcast', event: 'QUESTION',
        payload: {
          index: _qIndex,
          question_th: q.question_th || q.question,
          options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }
        }
      });
    }

    const user = window.AppCore?.App?.user;
    document.querySelectorAll('#raid-options [data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (selfAnswered) return;
        selfAnswered = true;
        document.querySelectorAll('#raid-options [data-opt]').forEach(b => b.disabled = true);
        btn.style.borderColor = 'var(--color-primary)';
        document.getElementById('raid-wait-msg')?.removeAttribute('hidden');

        const answer = btn.dataset.opt;
        _broadcastCh?.send({ type: 'broadcast', event: 'ANSWER', payload: { user_id: user?.id, question_index: _qIndex, answer } });

        if (user && !_answered.includes(user.id)) _answered.push(user.id);
        if (_isHost) {
          _answers[user.id] = answer;
          if (Object.keys(_answers).length >= Math.max(_members.length, 1)) _tallyAnswers();
        }
      });
    });

    if (_timer) clearInterval(_timer);
    _timer = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('raid-timer');
      const barEl   = document.getElementById('raid-timer-bar');
      if (timerEl) timerEl.textContent = timeLeft;
      if (barEl)   barEl.style.width   = (timeLeft / QUESTION_TIME * 100) + '%';
      if (timeLeft <= 0) {
        clearInterval(_timer); _timer = null;
        if (_isHost) _tallyAnswers();
      }
    }, 1000);
  }

  // Client-only question render (no timer authority)
  function _renderClientQuestion(payload) {
    const content = document.getElementById('raid-modal-content');
    if (!content) return;
    const user = window.AppCore?.App?.user;
    let selfAnswered = false;

    content.innerHTML = `
      <div style="padding:var(--space-md)">
        <p style="font-size:11px;color:var(--color-muted);margin-bottom:var(--space-sm)">
          คำถาม ${payload.index + 1} / ${_questions.length || '?'}</p>
        <p style="font-size:14px;font-weight:600;line-height:1.6;margin-bottom:var(--space-md)">
          ${escapeHtml(payload.question_th || '')}</p>
        <div id="raid-options" style="display:flex;flex-direction:column;gap:var(--space-sm)">
          ${['A','B','C','D'].filter(opt => payload.options?.[opt]).map(opt => `
            <button class="btn btn-outline" data-opt="${opt}"
                    style="text-align:left;font-size:13px;padding:10px var(--space-sm)">
              <span style="font-weight:700;margin-right:8px">${opt}.</span>
              ${escapeHtml(payload.options[opt] || '')}
            </button>`).join('')}
        </div>
        <p id="raid-wait-msg" style="text-align:center;font-size:11px;color:var(--color-muted);
           margin-top:var(--space-sm)" hidden>รอคำตอบ...</p>
      </div>`;

    document.querySelectorAll('#raid-options [data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (selfAnswered) return;
        selfAnswered = true;
        document.querySelectorAll('#raid-options [data-opt]').forEach(b => b.disabled = true);
        btn.style.borderColor = 'var(--color-primary)';
        document.getElementById('raid-wait-msg')?.removeAttribute('hidden');
        _broadcastCh?.send({ type: 'broadcast', event: 'ANSWER', payload: { user_id: user?.id, question_index: payload.index, answer: btn.dataset.opt } });
        if (user && !_answered.includes(user.id)) _answered.push(user.id);
      });
    });
  }

  function _tallyAnswers() {
    if (_timer) { clearInterval(_timer); _timer = null; }
    const q       = _questions[_qIndex];
    const correct = q?.correct_answer || q?.correct_option;
    const total   = Math.max(_members.length, 1);
    const correctCount = Object.values(_answers).filter(a => a === correct).length;
    const passed  = correctCount / total > 0.5;

    _broadcastCh?.send({
      type: 'broadcast', event: 'ROUND_RESULT',
      payload: { index: _qIndex, correct_option: correct, passed, correct_count: correctCount, total_players: total }
    });

    _showRoundResult(correct, passed, correctCount, total);
  }

  function _showRoundResult(correct, passed, correctCount, total) {
    const content = document.getElementById('raid-modal-content');
    if (!content) return;

    content.innerHTML = `
      <div style="padding:var(--space-lg);text-align:center">
        <p style="font-size:48px;margin:0">${passed ? '✅' : '❌'}</p>
        <h3 style="font-family:var(--font-heading);font-size:20px;font-weight:700;margin:var(--space-sm) 0 4px">
          ${passed ? 'ผ่าน!' : 'ลองใหม่'}</h3>
        <p style="font-size:13px;color:var(--color-muted)">
          ตอบถูก ${correctCount} / ${total} คน · คำตอบที่ถูก: <strong>${escapeHtml(correct || '?')}</strong></p>
        <p style="font-size:11px;color:var(--color-muted)">
          คำถาม ${_qIndex + 1} / ${_questions.length}</p>
      </div>`;

    setTimeout(() => {
      if (!_isHost) return; // only host drives the game forward
      if (passed) {
        _qIndex++;
        if (_qIndex >= _questions.length) _completeRaid();
        else { _retried = false; renderQuizScreen(); }
      } else if (!_retried) {
        _retried = true;
        renderQuizScreen();
      } else {
        _failRaid('wrong_answers', true);
      }
    }, 2500);
  }

  async function _completeRaid() {
    if (_timer) clearInterval(_timer);
    try {
      await DB.Raid.updateSession(_session.id, { status: 'completed', completed_at: new Date().toISOString() });
      await DB.Raid.insertCaptures(_session.figure_id, _answered);
    } catch {}

    _broadcastCh?.send({ type: 'broadcast', event: 'RAID_COMPLETE', payload: { figure_id: _session.figure_id, success: true } });
    _showComplete();
  }

  function _showComplete() {
    const content = document.getElementById('raid-modal-content');
    if (!content) return;
    content.innerHTML = `
      <div style="padding:var(--space-lg);text-align:center">
        <p style="font-size:48px;margin:0">🏆</p>
        <h3 style="font-family:var(--font-heading);font-size:20px;font-weight:700;margin:var(--space-sm) 0 8px">
          Raid สำเร็จ!</h3>
        <p style="font-size:13px;color:var(--color-muted);margin-bottom:var(--space-md)">
          บุคคลถูกจับแล้ว! ทุกคนได้รับ Legacy Points</p>
        <button class="btn btn-primary btn-full" onclick="RaidModule._close()">ปิด</button>
      </div>`;
  }

  async function _failRaid(reason, broadcastIt) {
    if (_timer) clearInterval(_timer);
    if (broadcastIt) {
      try { await DB.Raid.updateSession(_session.id, { status: 'failed', completed_at: new Date().toISOString() }); } catch {}
      _broadcastCh?.send({ type: 'broadcast', event: 'RAID_FAILED', payload: { reason } });
    }
    const content = document.getElementById('raid-modal-content');
    if (!content) return;
    content.innerHTML = `
      <div style="padding:var(--space-lg);text-align:center">
        <p style="font-size:48px;margin:0">💀</p>
        <h3 style="font-family:var(--font-heading);font-size:20px;font-weight:700;margin:var(--space-sm) 0 8px">
          Raid ล้มเหลว</h3>
        <p style="font-size:13px;color:var(--color-muted);margin-bottom:var(--space-md)">
          ${reason === 'disconnected' ? 'สมาชิกไม่ครบ' : 'ตอบผิดทั้งสองรอบ'} — ลองใหม่ได้หลัง 10 นาที</p>
        <button class="btn btn-ghost btn-full" onclick="RaidModule._close()">ปิด</button>
      </div>`;
  }

  function handleHostFailover() {
    const user     = window.AppCore?.App?.user;
    const presence = _presenceCh?.presenceState?.() || {};
    const connected = Object.values(presence).flat().map(p => p.user_id).filter(Boolean);

    if (!connected.includes(_session?.host_user_id) && connected.length > 0) {
      const sorted = _members
        .filter(m => connected.includes(m.user_id))
        .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
      if (sorted[0]?.user_id === user?.id) {
        _isHost = true;
        try { DB.Raid.updateSession(_session.id, { host_user_id: user.id }); } catch {}
      }
    }

    _members = _flatPresence(presence);
    if (connected.length < (_session?.raid_min_players || 2) && _isHost) {
      _failRaid('disconnected', true);
    }
  }

  // Entry point for tapping a raid-start notification — joins the session that's
  // already running instead of creating a new one.
  async function joinFromNotification(sessionId) {
    try {
      const session = await DB.Raid.getById(sessionId);
      if (!session || session.status !== 'waiting') {
        window.AppCore?.showToast?.('Raid นี้จบไปแล้วหรือไม่มีอยู่จริง');
        return;
      }
      await openRaidModal(session.figures, sessionId);
    } catch {
      window.AppCore?.showToast?.('ไม่สามารถเข้าร่วม Raid ได้');
    }
  }

  function _close() {
    if (_timer) clearInterval(_timer);
    try { _broadcastCh?.unsubscribe(); } catch {}
    try { _presenceCh?.unsubscribe(); } catch {}
    _session = null; _members = []; _isHost = false;
    _questions = []; _qIndex = 0; _answers = {}; _answered = []; _retried = false;
    document.getElementById('raid-modal')?.setAttribute('hidden', '');
  }

  return { init, canStartRaid, openRaidModal, joinFromNotification, renderLobbyModal, renderQuizScreen, handleHostFailover, _close };
})();

window.RaidModule = RaidModule;
