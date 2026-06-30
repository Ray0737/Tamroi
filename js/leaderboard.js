// ── Leaderboard Module ────────────────────────────────
const LeaderboardModule = (() => {
  let loaded = false;
  let activeMetric = 'legacy';
  let activePeriod = 'all';
  let currentPlayers = [];
  let realtimeChannel = null;
  let guildRealtimeChannel = null;

  const MY_ID = '__current_user__';

  const CROWN_SVG = `<svg viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M2 19l3-9 5 5 4-9 4 9 3-7v11H2z"/></svg>`;

  function load() {
    if (loaded) {
      render();
      subscribe();
      return;
    }
    loaded = true;
    bindControls();
    fetchAndRender();
  }

  function bindControls() {
    document.querySelectorAll('#leaderboard-metric .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#leaderboard-metric .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeMetric = pill.dataset.metric;
        render();
      });
    });

    document.querySelectorAll('#leaderboard-period .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#leaderboard-period .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activePeriod = pill.dataset.period;
        fetchAndRender();
      });
    });

    // Immediate refresh when a guild is created or deleted
    document.addEventListener('guild-changed', () => {
      _renderGuildLeaderboard();
      window.GuildModule?.renderGuildPanel();
    });

    // Guild / Solo view toggle
    document.querySelectorAll('#leaderboard-view .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#leaderboard-view .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const soloEl  = document.getElementById('solo-leaderboard-section');
        const guildEl = document.getElementById('guild-leaderboard-section');
        if (pill.dataset.view === 'guild') {
          soloEl?.setAttribute('hidden', '');
          guildEl?.removeAttribute('hidden');
          window.GuildModule?.renderGuildPanel();
          _renderGuildLeaderboard();
          _subscribeGuildRealtime();
        } else {
          guildEl?.setAttribute('hidden', '');
          soloEl?.removeAttribute('hidden');
        }
      });
    });
  }

  async function _renderGuildLeaderboard() {
    const el = document.getElementById('guild-leaderboard-list');
    if (!el) return;
    el.innerHTML = `<div style="display:flex;justify-content:center;padding:20px"><div class="spinner"></div></div>`;
    try {
      const guilds = await DB.Coop.getGuildLeaderboard();
      const user       = window.AppCore?.App?.user;
      const membership = user ? await DB.Coop.getMyMemberships(user.id) : {};

      const iconChevron = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;transition:transform .2s">
        <polyline points="6 9 12 15 18 9"/></svg>`;
      const iconCopy = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>`;
      const iconTrash = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>`;

      el.innerHTML = !guilds.length
        ? `<p style="text-align:center;color:var(--color-muted);font-size:12px;padding:var(--space-md)">ยังไม่มีกลุ่ม</p>`
        : guilds.map((g, i) => {
            const isMine   = g.guild_id in membership;
            const isLeader = membership[g.guild_id] === 'leader';
            return `
            <div class="guild-card card" data-id="${g.guild_id}" data-code="${escapeHtml(g.invite_code || '')}"
                 style="padding:0;cursor:pointer;overflow:hidden;
                        border:1px solid ${isMine ? 'rgba(255,126,85,0.3)' : 'rgba(255,255,255,0.06)'}">

              <!-- Header row -->
              <div style="display:flex;align-items:center;gap:10px;padding:11px 14px">
                <span style="font-size:13px;font-weight:800;color:var(--color-muted);
                             width:18px;text-align:center;flex-shrink:0">${i + 1}</span>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <p style="margin:0;font-size:13px;font-weight:700;color:var(--color-white);
                               white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      ${escapeHtml(g.name)}</p>
                    ${isMine ? `<span style="font-size:9px;background:rgba(255,126,85,.15);
                      color:var(--color-primary);border-radius:4px;padding:1px 6px;font-weight:600">คุณ</span>` : ''}
                    ${isLeader ? `<span style="font-size:9px;background:rgba(255,126,85,.08);
                      color:var(--color-muted);border-radius:4px;padding:1px 6px">Leader</span>` : ''}
                  </div>
                  <p style="margin:3px 0 0;font-size:10px;color:var(--color-muted)">
                    ${g.member_count ?? 0} members · ${g.guild_discovery_count} districts · ${g.guild_captures} captures</p>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0">
                  <span style="font-size:13px;font-weight:700;color:var(--color-primary)">
                    ${(g.guild_legacy_score || 0).toLocaleString()} pts</span>
                </div>
                <span class="chevron-icon" style="flex-shrink:0;color:var(--color-muted)">${iconChevron}</span>
              </div>

              <!-- Expanded detail -->
              <div class="guild-detail" hidden
                   style="border-top:1px solid rgba(255,255,255,0.05);padding:10px 14px;
                          background:rgba(0,0,0,0.15)">
                ${isMine ? `
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="flex:1">
                      <p style="margin:0 0 5px;font-size:9px;color:var(--color-muted);
                                 text-transform:uppercase;letter-spacing:1.5px">รหัสเชิญ</p>
                      <div style="display:inline-flex;align-items:center;gap:10px;
                                  background:rgba(255,126,85,0.08);border:1px solid rgba(255,126,85,0.2);
                                  border-radius:8px;padding:6px 12px">
                        <span style="font-size:17px;font-weight:800;color:var(--color-primary);
                                     letter-spacing:5px;font-family:monospace">${escapeHtml(g.invite_code || '—')}</span>
                        <button class="btn-copy-code btn-copy-icon">${iconCopy}</button>
                      </div>
                    </div>
                    ${isLeader ? `
                    <button class="btn-delete-guild btn btn-danger"
                            style="display:flex;align-items:center;gap:4px;padding:5px 10px;font-size:11px;flex-shrink:0">
                      ${iconTrash} ลบ
                    </button>` : ''}
                  </div>` : `
                  <p style="margin:0;font-size:11px;color:var(--color-muted)">
                    เข้าร่วมกลุ่มนี้เพื่อดูรหัสเชิญ</p>`}
              </div>
            </div>`;
          }).join('');

      el.querySelectorAll('.guild-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          const detail  = card.querySelector('.guild-detail');
          const chevron = card.querySelector('.chevron-icon svg');
          const open    = !detail.hidden;
          detail.hidden = open;
          if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
        });
        card.querySelector('.btn-copy-code')?.addEventListener('click', async (e) => {
          const code = card.dataset.code;
          await navigator.clipboard.writeText(code);
          e.currentTarget.innerHTML = '✓ คัดลอกแล้ว';
          setTimeout(() => _renderGuildLeaderboard(), 1800);
        });
        card.querySelector('.btn-delete-guild')?.addEventListener('click', async () => {
          await window.GuildModule?.deleteGuild(card.dataset.id);
          _renderGuildLeaderboard();
        });
      });
    } catch {
      el.innerHTML = '';
    }
  }

  async function fetchAndRender() {
    const listEl = document.getElementById('leaderboard-list');
    if (listEl) listEl.innerHTML = `<div style="display:flex;justify-content:center;padding:40px"><div class="spinner"></div></div>`;

    let players = [];
    try {
      const user = window.AppCore?.App?.user;
      const data = await DB.Leaderboard.get(activeMetric);
      players = (data || []).map(p => ({
        ...p,
        id: p.id === user?.id ? MY_ID : p.id,
        province: p.province || 'Thailand',
      }));
    } catch (error) {
      currentPlayers = [];
      renderEmptyState('โหลด Leaderboard จากฐานข้อมูลไม่ได้');
      subscribe();
      return;
    }

    sortPlayers(players);
    currentPlayers = players;
    render();
    subscribe();
  }

  function sortPlayers(players) {
    const col = activeMetric === 'discovery' ? 'map_discovery'
              : activeMetric === 'archive'   ? 'archive_count'
              : 'legacy_score';
    players.sort((a, b) => (b[col] || 0) - (a[col] || 0));
  }

  function getMetricValue(player) {
    if (activeMetric === 'discovery') return (player.map_discovery || 0).toFixed(0) + '%';
    if (activeMetric === 'archive')   return (player.archive_count || 0) + ' items';
    return (player.legacy_score || 0).toLocaleString() + ' pts';
  }

  function render(players = currentPlayers) {
    if (!players?.length) {
      renderEmptyState('ยังไม่มีข้อมูล Leaderboard');
      return;
    }
    sortPlayers(players);
    currentPlayers = players;
    renderPodium(players.slice(0, 3));
    renderMyRank(players);
    renderList(players);
  }

  function renderEmptyState(message) {
    const podium = document.getElementById('leaderboard-podium');
    const myRank = document.getElementById('my-rank-card');
    const list = document.getElementById('leaderboard-list');
    if (podium) podium.innerHTML = '';
    if (myRank) myRank.innerHTML = '';
    if (list) {
      list.innerHTML = `
        <div style="padding:28px var(--space-md);text-align:center;color:var(--color-muted)">
          ${escapeHtml(message)}
        </div>
      `;
    }
  }

  function subscribe() {
    if (realtimeChannel || !window.AppCore?.App?.user || !DB.Leaderboard.subscribe) return;
    try {
      realtimeChannel = DB.Leaderboard.subscribe(onScoreUpdate);
    } catch { realtimeChannel = null; }
  }

  function unsubscribe() {
    if (!realtimeChannel) return;
    try { realtimeChannel.unsubscribe(); } catch { /* ignore */ }
    realtimeChannel = null;
  }

  function _subscribeGuildRealtime() {
    if (guildRealtimeChannel) return;
    try {
      guildRealtimeChannel = DB.Coop.subscribeGuildChanges(() => {
        _renderGuildLeaderboard();
        window.GuildModule?.renderGuildPanel();
      });
    } catch { guildRealtimeChannel = null; }
  }

  function onScoreUpdate(payload) {
    const updated = payload?.new;
    if (!updated?.id || !currentPlayers.length) return;

    const user = window.AppCore?.App?.user;
    const rowId = updated.id === user?.id ? MY_ID : updated.id;
    const idx = currentPlayers.findIndex(p => p.id === rowId);
    if (idx === -1) return;

    const before = currentPlayers.map(p => p.id).join('|');
    currentPlayers[idx] = {
      ...currentPlayers[idx],
      legacy_score: updated.legacy_score,
      map_discovery: updated.map_discovery,
      archive_count: updated.archive_count,
    };
    sortPlayers(currentPlayers);
    const after = currentPlayers.map(p => p.id).join('|');

    if (before !== after) {
      render(currentPlayers);
      return;
    }

    patchPlayerRow(rowId);
    renderPodium(currentPlayers.slice(0, 3));
    renderMyRank(currentPlayers);
  }

  function patchPlayerRow(playerId) {
    const safeId = String(playerId).replace(/"/g, '\\"');
    const row = document.querySelector(`[data-user-id="${safeId}"]`);
    const player = currentPlayers.find(p => p.id === playerId);
    const score = row?.querySelector('[data-rank-score]');
    if (score && player) score.textContent = getMetricValue(player);
  }

  // ── Podium (top 3) ────────────────────────────────
  function renderPodium(top3) {
    const el = document.getElementById('leaderboard-podium');
    if (!el) return;
    if (top3.length < 3) { el.innerHTML = ''; return; }
    const [first, second, third] = top3;

    const podiumItem = (p, pos) => {
      const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
      const heights = { 1: 60, 2: 44, 3: 32 };
      const sizes   = { 1: 54, 2: 44, 3: 40 };
      const c = colors[pos];
      const h = heights[pos];
      const s = sizes[pos];
      const init = escapeHtml((p.username || '?').charAt(0).toUpperCase());
      const name = escapeHtml(p.username || '');

      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
          ${pos === 1 ? `<div style="height:22px;display:flex;align-items:center">${CROWN_SVG}</div>` : '<div style="height:22px"></div>'}
          <div style="
            width:${s}px;height:${s}px;border-radius:50%;
            background:${c}22;border:2.5px solid ${c};
            display:flex;align-items:center;justify-content:center;
            font-weight:800;font-size:${pos===1?18:14}px;color:${c}">
            ${init}
          </div>
          <p style="margin:0;font-size:11px;font-weight:600;color:var(--color-white);
                    max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                    text-align:center">${name}</p>
          <p style="margin:0;font-size:9px;color:var(--color-muted)">${getMetricValue(p)}</p>
          <div style="
            width:100%;height:${h}px;
            background:${c}18;
            border-radius:var(--radius-sm) var(--radius-sm) 0 0;
            border-top:2px solid ${c}40;
            display:flex;align-items:center;justify-content:center">
            <span style="font-weight:800;font-size:14px;color:${c}">#${pos}</span>
          </div>
        </div>
      `;
    };

    el.innerHTML = `
      <div style="display:flex;align-items:flex-end;gap:var(--space-sm);
                  padding:var(--space-md) var(--space-sm) 0">
        ${podiumItem(second, 2)}
        ${podiumItem(first,  1)}
        ${podiumItem(third,  3)}
      </div>
    `;
  }

  // ── My rank card ──────────────────────────────────
  function renderMyRank(players) {
    const el = document.getElementById('my-rank-card');
    if (!el) return;
    const myIdx = players.findIndex(p => p.id === MY_ID);
    if (myIdx === -1) { el.innerHTML = ''; return; }
    const me = players[myIdx];
    const rank = myIdx + 1;

    el.innerHTML = `
      <div style="
        display:flex;align-items:center;gap:10px;
        background:var(--color-primary-dim);
        border:1.5px solid var(--color-primary);
        border-radius:var(--radius-md);
        padding:10px 14px;margin-bottom:var(--space-sm)">
        <span style="font-size:18px;font-weight:800;font-family:var(--font-heading);
                     color:var(--color-primary);width:28px;text-align:center;flex-shrink:0">#${rank}</span>
        <div style="width:34px;height:34px;border-radius:50%;border:2px solid var(--color-primary);
                    background:var(--color-primary-dim);display:flex;align-items:center;
                    justify-content:center;font-weight:700;font-size:12px;
                    color:var(--color-primary);flex-shrink:0">
          ${escapeHtml((me.username||'Y').substring(0,2).toUpperCase())}
        </div>
        <div style="flex:1;min-width:0">
          <p style="margin:0;font-weight:600;font-size:13px;color:var(--color-white)">
            ${escapeHtml(me.username)} <span style="font-size:10px;color:var(--color-primary)">(You)</span>
          </p>
          <p style="margin:1px 0 0;font-size:10px;color:var(--color-muted)">${escapeHtml(me.province)}</p>
        </div>
        <span style="font-weight:700;font-size:14px;color:var(--color-primary);flex-shrink:0">${getMetricValue(me)}</span>
      </div>
    `;
  }

  // ── Full rank list ────────────────────────────────
  function renderList(players) {
    const el = document.getElementById('leaderboard-list');
    if (!el) return;

    const rankColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

    el.innerHTML = players.map((p, idx) => {
      const rank        = idx + 1;
      const isMe        = p.id === MY_ID;
      const rankColor   = rankColors[rank] || (isMe ? 'var(--color-primary)' : 'var(--color-muted)');
      const init        = escapeHtml((p.username || '?').substring(0, 2).toUpperCase());
      const ringColor   = rankColors[rank] || (isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)');

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;
                    border-radius:12px;
                    background:var(--color-card-darker);
                    border:1px solid rgba(255,255,255,0.07);
                    transition:background .15s"
             data-user-id="${escapeHtml(p.id)}">

          <span style="width:28px;text-align:center;font-size:13px;font-weight:800;
                       flex-shrink:0;color:${rankColor}">
            #${rank}
          </span>

          <div style="width:36px;height:36px;border-radius:50%;flex-shrink:0;
                      background:rgba(255,255,255,0.06);
                      display:flex;align-items:center;justify-content:center;
                      font-size:12px;font-weight:700;color:${rankColor};
                      box-shadow:0 0 0 2px ${ringColor}">
            ${init}
          </div>

          <div style="flex:1;min-width:0">
            <p style="margin:0;font-size:13px;font-weight:600;color:var(--color-white);
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${escapeHtml(p.username)}${isMe ? ` <span style="font-size:10px;font-weight:400;color:var(--color-muted)">(You)</span>` : ''}
            </p>
            <p style="margin:2px 0 0;font-size:10px;color:var(--color-muted)">
              ${escapeHtml(p.province || '—')}</p>
          </div>

          <span data-rank-score style="font-size:12px;font-weight:700;flex-shrink:0;
                       color:${rankColor}">
            ${getMetricValue(p)}
          </span>
        </div>
      `;
    }).join('');
  }

  return { load, unsubscribe, onScoreUpdate };
})();

window.LeaderboardModule = LeaderboardModule;
