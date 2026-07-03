// ── App State ─────────────────────────────────────────
const App = {
  user: null,
  profile: null,
  currentTab: 'map',
  mapInitialized: false,
  notifChannel: null,
};

// ── Boot ──────────────────────────────────────────────
// Strategy: getSession() first (reads localStorage cache, instant).
// Falls back to onAuthStateChange only when session is absent —
// that covers the OAuth callback path where tokens arrive in the URL.
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Try the stored session directly — this is instant for return visits
  let cachedSession = null;
  try { cachedSession = await DB.Auth.getSession(); } catch { /* not configured */ }

  if (cachedSession) {
    // Returning user: session already in localStorage — boot immediately
    await _bootApp(cachedSession.user);
    return;
  }

  // 2. No stored session — wait for auth state change
  //    (handles OAuth redirect where the token arrives in the URL hash/query)
  let _booted = false;

  DB.Auth.onStateChange(async (event, session) => {
    if (_booted) return;

    if (event === 'SIGNED_IN' && session) {
      // OAuth or fresh login just completed
      _booted = true;
      await _bootApp(session.user);

    } else if (event === 'INITIAL_SESSION') {
      if (session && !_booted) {
        // Session appeared by the time INITIAL_SESSION fired
        _booted = true;
        await _bootApp(session.user);
      } else if (!session) {
        // Genuinely not logged in
        window.location.href = 'login.html';
      }

    } else if (event === 'SIGNED_OUT') {
      window.location.href = 'login.html';
    }
  });
});

async function _bootApp(user) {
  if (App.user) return; // guard against double-boot
  App.user = user;

  try {
    App.profile = await DB.Profiles.getOrCreate(App.user);
  } catch {
    App.profile = {
      username: App.user.user_metadata?.full_name?.split(' ')[0]
             || App.user.user_metadata?.username
             || App.user.email?.split('@')[0]
             || 'Traveler',
      legacy_score: 0,
    };
  }

  updateTopBar();
  updateMapStatsPill();
  bindNavigation();
  bindCommunitySubTabs();
  bindSheetOverlay();
  loadNotifications();
  subscribeNotifications();
  window.GuildModule?.init(user.id);
  switchTab(localStorage.getItem('tamroi_active_tab') || 'map');
}

// ── Top Bar ───────────────────────────────────────────
function updateTopBar() {
  const p = App.profile;
  const usernameEl = document.getElementById('topbar-username');
  const avatarEl   = document.getElementById('topbar-avatar');
  if (usernameEl) usernameEl.textContent = p.username || 'Traveler';
  if (avatarEl) {
    const initials = (p.username || 'T').substring(0, 2).toUpperCase();
    if (p.avatar_url) {
      // Validate: only allow https:// avatar URLs to prevent javascript: or data: XSS
      try {
        const parsed = new URL(p.avatar_url);
        if (parsed.protocol === 'https:') {
          const img = document.createElement('img');
          img.src    = parsed.href;            // safe — no innerHTML
          img.alt    = escapeHtml(p.username || '');
          img.style.borderRadius = '0';        // remove circle border
          avatarEl.innerHTML = '';
          avatarEl.appendChild(img);
        } else {
          avatarEl.textContent = initials;     // reject non-https avatars
        }
      } catch {
        avatarEl.textContent = initials;       // invalid URL — fallback to initials
      }
    } else {
      avatarEl.textContent = initials;
    }
  }
}

// ── Map Stats Pill ────────────────────────────────────
function updateMapStatsPill() {
  const p = App.profile;
  if (!p) return;
  const capturedEl = document.getElementById('map-stat-captured');
  const legacyEl   = document.getElementById('map-stat-legacy');
  if (capturedEl) capturedEl.textContent = p.archive_count ?? 0;
  if (legacyEl)   legacyEl.textContent   = (p.legacy_score  || 0).toLocaleString();
}

// ── Tab Navigation ────────────────────────────────────
function bindNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });
}

function switchTab(tab) {
  if (App.currentTab === tab && App.mapInitialized) return;
  const previousTab = App.currentTab;
  App.currentTab = tab;
  localStorage.setItem('tamroi_active_tab', tab);

  if (previousTab === 'community' && tab !== 'community') {
    window.LeaderboardModule?.unsubscribe?.();
  }

  // Hide all tab sections
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));

  // Update footer active state
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  const section = document.getElementById(`tab-${tab}`);
  if (section) {
    section.classList.add('active');
    section.classList.add('page-enter');
    section.addEventListener('animationend', () => section.classList.remove('page-enter'), { once: true });
  }

  // Update top bar page title for non-map tabs
  const titles = { map: '', collection: 'Collection', mission: 'Missions', community: 'Community' };
  const titleEl = document.querySelector('.top-bar__center .page-title');
  if (titleEl) titleEl.textContent = titles[tab] || '';

  // Lazy-load each tab's data
  if (tab === 'map') {
    if (!App.mapInitialized) {
      window.MapModule?.init();
      App.mapInitialized = true;
    } else {
      window.MapModule?.resize();
    }
  } else if (tab === 'collection') {
    window.CollectionModule?.load();
  } else if (tab === 'mission') {
    window.MissionModule?.load();
    window.CoopModule?.load();
  } else if (tab === 'community') {
    const activePill = document.querySelector('[data-community-tab].active');
    _switchCommunityTab(activePill?.dataset.communityTab || 'rank');
  }
}

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

function bindCommunitySubTabs() {
  document.querySelectorAll('[data-community-tab]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-community-tab]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      _switchCommunityTab(pill.dataset.communityTab);
    });
  });
}

// ── Bottom Sheet & Overlay ────────────────────────────
function bindSheetOverlay() {
  const overlay = document.getElementById('sheet-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeAllSheets);
  }
}

function openSheet(sheetId) {
  const sheet   = document.getElementById(sheetId);
  const overlay = document.getElementById('sheet-overlay');
  const nav     = document.querySelector('.bottom-nav');
  if (sheet)   sheet.classList.add('open');
  if (overlay) overlay.classList.add('active');
  // Prevent the nav from intercepting touches while a sheet is open
  if (nav) nav.style.pointerEvents = 'none';
}

function closeAllSheets() {
  document.querySelectorAll('.bottom-sheet.open').forEach(s => s.classList.remove('open'));
  const overlay = document.getElementById('sheet-overlay');
  const nav     = document.querySelector('.bottom-nav');
  if (overlay) overlay.classList.remove('active');
  if (nav) nav.style.pointerEvents = '';  // restore nav
}

async function openLoreSheet(node) {
  const title     = document.getElementById('lore-title');
  const typeBadge = document.getElementById('lore-type-badge');
  const ptsBadge  = document.getElementById('lore-pts-badge');
  const narrative = document.getElementById('lore-narrative');
  const img       = document.getElementById('lore-img');
  const audioWrap = document.getElementById('lore-audio-wrap');
  const audio     = document.getElementById('lore-audio');
  const audioToggle = document.getElementById('lore-audio-toggle');
  const saveBtn   = document.getElementById('btn-save-lore');
  const phasePanel = document.getElementById('lore-phase-panel');
  if (!title || !typeBadge || !ptsBadge || !narrative || !saveBtn) return;

  // ── populate static header (always) ──────────────────
  const contentType = node.content_type || 'text';
  title.textContent    = node.name_th || node.name_en || 'Lore';
  typeBadge.textContent = contentType;
  ptsBadge.textContent  = `+${node.lore_pts || 0} pts`;
  narrative.textContent = node.content_th || node.content_en || '';

  if (img) {
    const isImage = contentType === 'image' && node.media_url;
    img.hidden = !isImage;
    img.src    = isImage ? node.media_url : '';
    img.alt    = isImage ? (node.name_th || node.name_en || '') : '';
  }
  if (audioWrap && audio && audioToggle) {
    const isAudio = contentType === 'audio' && node.media_url;
    audioWrap.hidden = !isAudio;
    audio.src = isAudio ? node.media_url : '';
    audioToggle.textContent = 'เล่นเสียง';
    audioToggle.onclick = async () => {
      if (audio.paused) { await audio.play(); audioToggle.textContent = 'หยุดเสียง'; }
      else { audio.pause(); audioToggle.textContent = 'เล่นเสียง'; }
    };
  }

  // ── already saved node → legacy behaviour ─────────────
  if (node.is_saved) {
    if (phasePanel) phasePanel.hidden = true;
    saveBtn.disabled = true;
    saveBtn.textContent = 'บันทึกแล้ว';
    saveBtn.onclick = null;
    openSheet('lore-sheet');
    return;
  }

  // ── fetch questions + prior attempts (parallel) ───────
  const userId = App.user?.id;
  let questions = [], priorPre = false, priorPost = false;
  // pre score: 0 = no pretest yet; null = priorPre but score unknown (legacy); actual int = loaded from DB
  let preScore = 0;
  if (userId) {
    try {
      const [qs, assessments] = await Promise.all([
        DB.Lore.getLoreQuestions(node.id),
        DB.Lore.getAssessments(userId, node.id)
      ]);
      questions  = qs || [];
      const preAss  = assessments.find(a => a.phase === 'pre');
      priorPre      = !!preAss;
      priorPost     = assessments.some(a => a.phase === 'post');
      if (preAss) preScore = preAss.score; else if (priorPre) preScore = null;
    } catch (_) { /* degraded: skip tests */ }
  }

  const hasQuestions  = questions.length > 0;
  const needsPretest  = hasQuestions && !priorPre;
  const needsPosttest = hasQuestions && !priorPost;

  // ── helper: render a quiz into #lore-phase-panel ──────
  function renderQuiz(qs, onSubmit) {
    if (!phasePanel) return;
    let answers = {};
    phasePanel.innerHTML = qs.map((q, i) => `
      <p class="lore-narrative"><strong>${escapeHtml(q.question_th)}</strong></p>
      <div class="lore-quiz-options mb-3">
        ${['A','B','C','D'].map(opt => `
          <button class="btn btn-ghost btn-full lore-quiz-opt mb-1" data-q="${i}" data-opt="${opt}">
            ${escapeHtml(q['option_' + opt.toLowerCase()])}
          </button>`).join('')}
      </div>`).join('');
    phasePanel.querySelectorAll('.lore-quiz-opt').forEach(btn => {
      btn.onclick = () => {
        const qi = btn.dataset.q;
        phasePanel.querySelectorAll(`[data-q="${qi}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        answers[qi] = btn.dataset.opt;
      };
    });
    saveBtn.textContent = 'ส่งคำตอบ';
    saveBtn.disabled    = false;
    saveBtn.onclick     = () => {
      const score = qs.filter((q, i) => answers[i] === q.correct_option).length;
      onSubmit(score, qs.length);
    };
  }

  // ── helper: show content phase ────────────────────────
  function showContentPhase() {
    if (phasePanel) phasePanel.hidden = true;
    saveBtn.disabled    = false;
    saveBtn.textContent = 'อ่านแล้ว บันทึก →';
    saveBtn.onclick     = async () => {
      try {
        await window.MapModule?.saveLoreUnlock(node.id);
        if (needsPosttest) {
          showPosttestPhase();
        } else {
          closeAllSheets();
        }
      } catch (_) {
        closeAllSheets();
      }
    };
  }

  // ── helper: show posttest phase ───────────────────────
  function showPosttestPhase() {
    if (phasePanel) { phasePanel.hidden = false; }
    typeBadge.textContent = 'หลังอ่าน';
    renderQuiz(questions, async (score, total) => {
      if (userId) {
        try {
          const saves = [DB.Lore.saveAssessment(userId, node.id, 'post', score, total)];
          if (preScore !== null && !priorPre) {
            saves.push(DB.Lore.saveAssessment(userId, node.id, 'pre', preScore, total));
          }
          await Promise.all(saves);
          // bonus points
          const bonus = preScore === null ? 0
            : preScore === 0 && score === total ? 20
            : score > preScore ? 10 : 0;
          if (bonus > 0) await DB.Profiles.addLegacyPoints(userId, bonus);
        } catch (_) {}
      }
      showResultPhase(preScore, score, questions.length);
    });
  }

  // ── helper: show result phase ─────────────────────────
  function showResultPhase(pre, post, total) {
    if (phasePanel) {
      const alreadyKnew = pre !== null && pre === total;
      const learned     = pre !== null && post > pre;
      const pct         = total > 0 ? Math.round((post / total) * 100) : 0;
      phasePanel.hidden = false;
      phasePanel.innerHTML = `
        <div class="lore-delta-badge">
          ${alreadyKnew
            ? '<span>เก่งมาก! คุณรู้เรื่องนี้อยู่แล้ว 🏆</span>'
            : learned
              ? `<span>คุณเรียนรู้เพิ่มขึ้น! ตอบถูก ${post}/${total} (${pct}%)</span>`
              : `<span>ตอบถูก ${post}/${total} (${pct}%) — ลองอ่านอีกครั้ง!</span>`}
        </div>`;
    }
    saveBtn.textContent = 'ปิด';
    saveBtn.disabled    = false;
    saveBtn.onclick     = () => closeAllSheets();
  }

  // ── phase entry ───────────────────────────────────────
  openSheet('lore-sheet');

  if (needsPretest) {
    if (phasePanel) phasePanel.hidden = false;
    typeBadge.textContent = 'ก่อนอ่าน';
    renderQuiz(questions, (score, total) => {
      preScore = score;
      if (phasePanel) phasePanel.hidden = true;
      typeBadge.textContent = contentType;
      showContentPhase();
    });
  } else {
    showContentPhase();
  }
}

function openLoreChainSheet(chain) {
  const title = document.getElementById('chain-title');
  const narrative = document.getElementById('chain-narrative');
  if (!title || !narrative) return;
  title.textContent = chain.title || 'เรื่องราวสมบูรณ์';
  narrative.textContent = chain.content || '';
  openSheet('chain-sheet');
}

// ── Notifications ─────────────────────────────────────
async function loadNotifications() {
  let notifs = getMockNotifications();

  if (App.user) {
    try {
      notifs = await DB.Notifications.get(App.user.id);
    } catch { /* keep mock */ }
  }

  renderNotifications(notifs);

  const unread = notifs.filter(n => !n.is_read).length;
  const badge = document.querySelector('.notif-badge');
  if (badge) {
    badge.style.display = unread > 0 ? '' : 'none';
  }
}

function subscribeNotifications() {
  if (!App.user || App.notifChannel || !DB.Notifications.subscribe) return;
  try {
    App.notifChannel = DB.Notifications.subscribe(App.user.id, payload => {
      if (localStorage.getItem('tamroi_notif') === 'off') return;
      prependNotification(payload.new);
      updateUnreadBadge(1);
    });
  } catch { App.notifChannel = null; }
}

function prependNotification(notif) {
  const list = document.getElementById('notif-list');
  if (!list || !notif) return;
  renderNotifications([notif, ...getRenderedNotifications()]);
}

function getRenderedNotifications() {
  return [...document.querySelectorAll('#notif-list .notif-row')].map(row => ({
    id: row.dataset.id,
    type: row.dataset.type || '',
    title: row.querySelector('.notif-title')?.textContent || '',
    message: row.querySelector('.notif-msg')?.textContent || '',
    is_read: !row.classList.contains('unread'),
    ref_id: row.querySelector('[data-ref]')?.dataset.ref || null,
  }));
}

function updateUnreadBadge(delta) {
  const badge = document.querySelector('.notif-badge');
  if (badge && delta > 0) badge.style.display = '';
}

function renderNotifications(notifs) {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!notifs.length) {
    list.innerHTML = `<p style="color:var(--color-muted);text-align:center;padding:var(--space-lg)">No notifications yet</p>`;
    return;
  }
  const icons = {
    figure_unlock: `<i class="bi bi-flag" style="font-size:19px;color:var(--color-primary)"></i>`,
    fog_cleared:   `<i class="bi bi-map" style="font-size:19px;color:var(--color-success)"></i>`,
    rank_change:   `<i class="bi bi-trophy" style="font-size:19px;color:#FFD700"></i>`,
    artifact:      `<i class="bi bi-box-seam" style="font-size:19px;color:var(--color-muted)"></i>`,
    raid:          `<i class="bi bi-lightning" style="font-size:19px;color:#EF5350"></i>`,
    rally:         `<i class="bi bi-geo-alt" style="font-size:19px;color:var(--color-primary)"></i>`,
    join_request:  `<i class="bi bi-person-plus" style="font-size:19px;color:var(--color-primary)"></i>`,
  };
  // escapeHtml prevents XSS from DB-sourced notification title/message
  const isPendingJoinRequest = n => n.type === 'join_request' && !n.is_read && n.ref_id;
  list.innerHTML = notifs.map(n => `
    <div class="notif-row ${n.is_read ? '' : 'unread'}" data-id="${escapeHtml(String(n.id))}" data-type="${escapeHtml(n.type || '')}" data-ref-id="${escapeHtml(String(n.ref_id || ''))}">
      <span class="notif-icon">${icons[n.type] || ''}</span>
      <div class="notif-body">
        <p class="notif-title">${escapeHtml(n.title)}</p>
        <p class="notif-msg">${escapeHtml(n.message)}</p>
      </div>
      ${isPendingJoinRequest(n) ? `
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-primary" style="font-size:10px;padding:4px 10px"
                  data-accept="${escapeHtml(String(n.id))}" data-ref="${escapeHtml(String(n.ref_id))}">ยอมรับ</button>
          <button class="btn btn-ghost" style="font-size:10px;padding:4px 10px;border-color:var(--color-border)"
                  data-ignore="${escapeHtml(String(n.id))}" data-ref="${escapeHtml(String(n.ref_id))}">ไม่รับ</button>
        </div>
      ` : (!n.is_read ? `<span class="notif-dot"></span>` : '')}
    </div>
  `).join('');

  list.querySelectorAll('.notif-row').forEach(row => {
    if (row.querySelector('[data-accept]')) return;
    row.addEventListener('click', async () => {
      const id = row.dataset.id;
      row.classList.remove('unread');
      row.querySelector('.notif-dot')?.remove();
      await DB.Notifications.markRead(id).catch(() => {});
      if (row.dataset.type === 'raid' && row.dataset.refId) {
        window.RaidModule?.joinFromNotification(row.dataset.refId);
      }
    });
  });

  list.querySelectorAll('[data-accept]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      try {
        await DB.Coop.approveRequest(btn.dataset.ref);
        await DB.Notifications.markRead(btn.dataset.accept).catch(() => {});
        document.dispatchEvent(new CustomEvent('guild-changed'));
        loadNotifications();
      } catch (err) { showToast(err.message || 'อนุมัติไม่สำเร็จ'); }
    });
  });
  list.querySelectorAll('[data-ignore]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      try {
        await DB.Coop.rejectRequest(btn.dataset.ref);
        await DB.Notifications.markRead(btn.dataset.ignore).catch(() => {});
        loadNotifications();
      } catch (err) { showToast(err.message || 'เกิดข้อผิดพลาด'); }
    });
  });
}

// ── Points Float Animation ─────────────────────────────
function showFloatPts(pts, x, y) {
  const el = document.createElement('div');
  el.className = 'float-pts';
  el.textContent = `+${pts}pts`;
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast';
    toast.innerHTML = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span class="toast-msg"></span>
    `;
    document.querySelector('.app-wrapper')?.appendChild(toast);
  }

  toast.querySelector('.toast-msg').textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ── Themed confirm dialog ─────────────────────────────
function showConfirm(message, { destructive = false, confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก' } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:var(--color-overlay);z-index:9999;display:flex;align-items:center;justify-content:center;padding:var(--space-md)';

    const confirmBg  = destructive ? '#ef5350' : 'var(--color-primary)';
    const confirmClr = '#fff';

    overlay.innerHTML = `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-md);
                  padding:18px;width:100%;max-width:260px;text-align:center;
                  border:1px solid var(--color-border)">
        <i class="bi ${destructive ? 'bi-exclamation-triangle-fill' : 'bi-question-circle'}"
           style="font-size:32px;color:${destructive ? '#ef5350' : 'var(--color-muted)'};
                  display:block;margin-bottom:12px"></i>
        <p style="color:var(--color-white);font-family:var(--font-body);font-size:13px;
                  font-weight:600;margin:0 0 16px;line-height:1.5">${message}</p>
        <div style="display:flex;gap:8px">
          <button data-cancel class="confirm-btn confirm-btn-cancel">${cancelLabel}</button>
          <button data-ok class="confirm-btn confirm-btn-ok"
                  style="background:${confirmBg};color:${confirmClr}">${confirmLabel}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const done = r => { overlay.remove(); resolve(r); };
    overlay.addEventListener('click', e => { if (e.target === overlay) done(false); });
    overlay.querySelector('[data-cancel]').onclick = () => done(false);
    overlay.querySelector('[data-ok]').onclick    = () => done(true);
  });
}

// ── Sign Out ──────────────────────────────────────────
document.getElementById('btn-signout')?.addEventListener('click', async () => {
  try { await App.notifChannel?.unsubscribe?.(); } catch { /* ignore */ }
  await DB.Auth.signOut();
  window.location.href = 'index.html';
});

// ── Settings: Edit Username ───────────────────────────
document.getElementById('btn-edit-username')?.addEventListener('click', () => {
  const input = document.getElementById('input-username');
  input.value = App.profile?.username || '';
  document.getElementById('settings-username-view').style.display = 'none';
  document.getElementById('settings-username-edit').style.display = 'block';
  input.focus();
});

document.getElementById('btn-username-cancel')?.addEventListener('click', () => {
  document.getElementById('settings-username-view').style.display = 'flex';
  document.getElementById('settings-username-edit').style.display = 'none';
});

document.getElementById('btn-username-save')?.addEventListener('click', async () => {
  const input = document.getElementById('input-username');
  const newName = input.value.trim();
  if (!newName || newName === App.profile?.username) {
    document.getElementById('settings-username-view').style.display = 'flex';
    document.getElementById('settings-username-edit').style.display = 'none';
    return;
  }
  try {
    await DB.Profiles.update(App.user.id, { username: newName });
    App.profile.username = newName;
    document.getElementById('settings-username').textContent = newName;
    document.getElementById('settings-avatar').textContent = newName.substring(0, 2).toUpperCase();
    updateTopBar();
    showToast('เปลี่ยนชื่อสำเร็จ');
  } catch {
    showToast('เปลี่ยนชื่อไม่สำเร็จ — ชื่อนี้อาจถูกใช้แล้ว');
  }
  document.getElementById('settings-username-view').style.display = 'flex';
  document.getElementById('settings-username-edit').style.display = 'none';
});

// ── Settings: Notifications Toggle ───────────────────
(function initNotifToggle() {
  const track = document.getElementById('notif-toggle-track');
  const thumb = document.getElementById('notif-toggle-thumb');
  const checkbox = document.getElementById('toggle-notifications');
  if (!track) return;

  const enabled = localStorage.getItem('tamroi_notif') !== 'off';
  const apply = (on) => {
    track.style.background = on ? 'var(--color-success)' : 'var(--color-muted)';
    thumb.style.left = on ? '20px' : '2px';
    checkbox.checked = on;
    localStorage.setItem('tamroi_notif', on ? 'on' : 'off');
  };
  apply(enabled);
  track.addEventListener('click', () => apply(!checkbox.checked));
})();

// ── Mock fallback data ────────────────────────────────
function getMockNotifications() {
  return [
    { id: '1', type: 'figure_unlock', title: 'New Figure Nearby!', message: 'King Taksin is unlocked in Rattanakosin', is_read: false, created_at: new Date() },
    { id: '2', type: 'fog_cleared',   title: 'District Explored',  message: 'Silom fog cleared — +3 spots revealed',  is_read: false, created_at: new Date() },
    { id: '3', type: 'rank_change',   title: 'You ranked up!',     message: 'You moved to #24 on the Leaderboard',    is_read: true,  created_at: new Date() },
  ];
}

// ── Capture Reveal Animation ──────────────────────────
function showCaptureReveal(figure) {
  const cls = figure.class || 'C';
  const isLegendary = cls === 'S' || cls === 'A';
  const headerText  = cls === 'S' ? 'LEGENDARY CAPTURE!' : cls === 'A' ? 'RARE CAPTURE!' : 'CAPTURED!';
  const glowColor   = cls === 'S' ? 'var(--color-class-s)' : cls === 'A' ? '#C0A060' : 'var(--color-success)';
  const holdMs      = isLegendary ? 3200 : 2200;

  const overlay = document.createElement('div');
  overlay.className = 'capture-reveal-overlay';

  overlay.innerHTML = `
    <div class="capture-reveal-card${isLegendary ? ' capture-reveal-legendary' : ''}" style="${isLegendary ? `--glow-color:${glowColor}` : ''}">
      ${isLegendary ? '<div class="capture-glow-ring"></div><div class="capture-shimmer"></div>' : ''}
      <div class="capture-header" style="color:${glowColor}">${headerText}</div>
      <span class="capture-emoji">${escapeHtml(figure.image_emoji || '👤')}</span>
      <div class="capture-name-th">${escapeHtml(figure.name_th || '')}</div>
      <div class="capture-name-en">${escapeHtml(figure.name_en || '')}</div>
      <span class="badge badge-${cls.toLowerCase()}">${cls}-Class</span>
      <div class="capture-pts" style="color:${glowColor}">+${figure.legacy_pts || 0} Legacy Points</div>
    </div>`;

  if (isLegendary) {
    const colors = ['#F6C19E', '#7BC67E', '#ffffff', '#C0A060', '#F6C19E', '#7BC67E'];
    for (let i = 0; i < 14; i++) {
      const dot = document.createElement('div');
      dot.className = 'capture-confetti';
      dot.style.cssText = `left:${15+Math.random()*70}%;top:${15+Math.random()*70}%;width:${5+Math.random()*7}px;height:${5+Math.random()*7}px;background:${colors[i%colors.length]};animation-delay:${(Math.random()*0.5).toFixed(2)}s`;
      overlay.appendChild(dot);
    }
  }

  document.body.appendChild(overlay);
  const dismiss = () => { overlay.style.cssText += 'opacity:0;transition:opacity 0.3s'; setTimeout(() => overlay.remove(), 300); };
  overlay.addEventListener('click', dismiss);
  setTimeout(dismiss, holdMs);
}

// ── Expose globally ───────────────────────────────────
window.AppCore = { App, switchTab, openSheet, closeAllSheets, openLoreSheet, openLoreChainSheet, showFloatPts, showToast, showConfirm, updateMapStatsPill, showCaptureReveal };
