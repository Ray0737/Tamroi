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
  bindNavigation();
  bindSheetOverlay();
  loadNotifications();
  subscribeNotifications();
  switchTab('map');
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

  if (previousTab === 'leaderboard' && tab !== 'leaderboard') {
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
  const titles = { map: '', collection: 'Collection', mission: 'Missions', leaderboard: 'Leaderboard' };
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
  } else if (tab === 'leaderboard') {
    window.LeaderboardModule?.load();
  }
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

function openLoreSheet(node) {
  const title = document.getElementById('lore-title');
  const typeBadge = document.getElementById('lore-type-badge');
  const ptsBadge = document.getElementById('lore-pts-badge');
  const narrative = document.getElementById('lore-narrative');
  const img = document.getElementById('lore-img');
  const audioWrap = document.getElementById('lore-audio-wrap');
  const audio = document.getElementById('lore-audio');
  const audioToggle = document.getElementById('lore-audio-toggle');
  const saveBtn = document.getElementById('btn-save-lore');
  if (!title || !typeBadge || !ptsBadge || !narrative || !saveBtn) return;

  const contentType = node.content_type || 'text';
  title.textContent = node.name_th || node.name_en || 'Lore';
  typeBadge.textContent = contentType;
  ptsBadge.textContent = `+${node.lore_pts || 0} pts`;
  narrative.textContent = node.content_th || node.content_en || '';

  if (img) {
    const isImage = contentType === 'image' && node.media_url;
    img.hidden = !isImage;
    img.src = isImage ? node.media_url : '';
    img.alt = isImage ? (node.name_th || node.name_en || '') : '';
  }

  if (audioWrap && audio && audioToggle) {
    const isAudio = contentType === 'audio' && node.media_url;
    audioWrap.hidden = !isAudio;
    audio.src = isAudio ? node.media_url : '';
    audioToggle.textContent = 'เล่นเสียง';
    audioToggle.onclick = async () => {
      if (audio.paused) {
        await audio.play();
        audioToggle.textContent = 'หยุดเสียง';
      } else {
        audio.pause();
        audioToggle.textContent = 'เล่นเสียง';
      }
    };
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'บันทึกลง Journal';
  saveBtn.onclick = () => window.MapModule?.saveLoreUnlock(node.id);
  openSheet('lore-sheet');
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
    figure_unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;color:var(--color-primary)"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
    fog_cleared:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;color:var(--color-success)"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    rank_change:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;color:#FFD700"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    artifact:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;color:var(--color-muted)"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`,
  };
  // escapeHtml prevents XSS from DB-sourced notification title/message
  list.innerHTML = notifs.map(n => `
    <div class="notif-row ${n.is_read ? '' : 'unread'}" data-id="${escapeHtml(String(n.id))}" data-type="${escapeHtml(n.type || '')}">
      <span class="notif-icon">${icons[n.type] || ''}</span>
      <div class="notif-body">
        <p class="notif-title">${escapeHtml(n.title)}</p>
        <p class="notif-msg">${escapeHtml(n.message)}</p>
      </div>
      ${!n.is_read ? `<span class="notif-dot"></span>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.notif-row').forEach(row => {
    row.addEventListener('click', async () => {
      const id = row.dataset.id;
      row.classList.remove('unread');
      row.querySelector('.notif-dot')?.remove();
      await DB.Notifications.markRead(id).catch(() => {});
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
    document.querySelector('.app-wrapper')?.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ── Sign Out ──────────────────────────────────────────
document.getElementById('btn-signout')?.addEventListener('click', async () => {
  try { await App.notifChannel?.unsubscribe?.(); } catch { /* ignore */ }
  await DB.Auth.signOut();
  window.location.href = 'index.html';
});

// ── Mock fallback data ────────────────────────────────
function getMockNotifications() {
  return [
    { id: '1', type: 'figure_unlock', title: 'New Figure Nearby!', message: 'King Taksin is unlocked in Rattanakosin', is_read: false, created_at: new Date() },
    { id: '2', type: 'fog_cleared',   title: 'District Explored',  message: 'Silom fog cleared — +3 spots revealed',  is_read: false, created_at: new Date() },
    { id: '3', type: 'rank_change',   title: 'You ranked up!',     message: 'You moved to #24 on the Leaderboard',    is_read: true,  created_at: new Date() },
  ];
}

// ── Expose globally ───────────────────────────────────
window.AppCore = { App, switchTab, openSheet, closeAllSheets, openLoreSheet, openLoreChainSheet, showFloatPts, showToast };
