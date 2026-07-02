// ── Leaderboard Module ────────────────────────────────
const LeaderboardModule = (() => {
  let loaded = false;
  let activeMetric = 'legacy';
  let activePeriod = 'all';
  let currentPlayers = [];
  let realtimeChannel = null;
  let guildRealtimeChannel = null;

  const MY_ID = '__current_user__';

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

  const _chevron = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  function buildCustomSelect(id) {
    const sel = document.getElementById(id);
    if (!sel) return;

    const wrap = document.createElement('div');
    wrap.className = 'lb-custom-wrap';
    // carry over flex style from the original select
    if (sel.style.flex) wrap.style.flex = sel.style.flex;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'lb-custom-trigger';

    const panel = document.createElement('div');
    panel.className = 'lb-custom-panel';

    const opts = Array.from(sel.options);
    opts.forEach(o => {
      const item = document.createElement('div');
      item.className = 'lb-custom-option' + (o.selected ? ' selected' : '');
      item.dataset.value = o.value;
      item.textContent = o.text;
      item.addEventListener('click', () => {
        sel.value = o.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        updateTrigger();
        closePanel();
      });
      panel.appendChild(item);
    });

    function updateTrigger() {
      const cur = sel.options[sel.selectedIndex];
      trigger.innerHTML = `<span>${cur?.text || ''}</span>${_chevron}`;
      panel.querySelectorAll('.lb-custom-option').forEach(item => {
        item.classList.toggle('selected', item.dataset.value === sel.value);
      });
    }

    function closePanel() {
      panel.classList.remove('open');
      trigger.classList.remove('open');
    }

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = panel.classList.contains('open');
      document.querySelectorAll('.lb-custom-panel.open').forEach(p => {
        p.classList.remove('open');
        p.previousElementSibling?.classList.remove('open');
      });
      if (!isOpen) { panel.classList.add('open'); trigger.classList.add('open'); }
    });

    updateTrigger();
    sel.style.display = 'none';
    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
  }

  function bindControls() {
    ['leaderboard-view', 'leaderboard-period', 'leaderboard-metric'].forEach(buildCustomSelect);

    document.getElementById('leaderboard-metric')?.addEventListener('change', e => {
      activeMetric = e.target.value;
      render();
    });

    document.getElementById('leaderboard-period')?.addEventListener('change', e => {
      activePeriod = e.target.value;
      fetchAndRender();
    });

    // Immediate refresh when a guild is created or deleted
    document.addEventListener('guild-changed', () => {
      _renderGuildLeaderboard();
      window.GuildModule?.renderGuildPanel();
    });

    // Guild / Solo view toggle
    document.getElementById('leaderboard-view')?.addEventListener('change', e => {
      const soloEl  = document.getElementById('solo-leaderboard-section');
      const guildEl = document.getElementById('guild-leaderboard-section');
      if (e.target.value === 'guild') {
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

    document.addEventListener('click', () => {
      document.querySelectorAll('.lb-custom-panel.open').forEach(p => {
        p.classList.remove('open');
        p.previousElementSibling?.classList.remove('open');
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

      el.innerHTML = !guilds.length
        ? `<p class="guild-list-empty">ยังไม่มีกลุ่ม</p>`
        : guilds.map((g, i) => {
            const isMine   = g.guild_id in membership;
            const isLeader = membership[g.guild_id] === 'leader';
            const rank     = i + 1;
            const tier     = _RANK_TIER[rank];
            return `
            <div class="lb-row ${isMine ? 'lb-my-row' : ''}" data-id="${g.guild_id}" data-code="${escapeHtml(g.invite_code || '')}"
                 style="cursor:pointer">
              <span class="lb-rank ${tier || ''}">${tier ? _rankIcon(rank) : `#${rank}`}</span>
              <div class="lb-name-block">
                <p class="lb-name">
                  ${escapeHtml(g.name)}${isMine ? ` <span class="lb-you">${isLeader ? 'Leader' : 'คุณ'}</span>` : ''}
                </p>
                <p class="lb-sub">${g.member_count ?? 0} members · ${g.guild_discovery_count} districts · ${g.guild_captures} captures</p>
              </div>
              <span class="lb-score ${tier || ''}">${(g.guild_legacy_score || 0).toLocaleString()} pts</span>
              <i class="bi bi-chevron-down chevron-icon" style="color:var(--color-muted);font-size:11px;transition:transform .2s"></i>
            </div>
            <div class="guild-detail" hidden style="padding:4px 4px 12px 34px">
              ${isMine ? `
                <p style="margin:0 0 4px;font-size:9px;color:var(--color-muted);text-transform:uppercase;letter-spacing:1.5px">รหัสเชิญ</p>
                <span style="font-size:15px;font-weight:800;color:var(--color-primary);letter-spacing:4px;font-family:monospace">${escapeHtml(g.invite_code || '—')}</span>
              ` : `<p style="margin:0;font-size:11px;color:var(--color-muted)">เข้าร่วมกลุ่มนี้เพื่อดูรหัสเชิญ</p>`}
            </div>`;
          }).join('');

      el.querySelectorAll('.lb-row[data-id]').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          const detail  = row.nextElementSibling;
          const chevron = row.querySelector('.chevron-icon');
          const open    = !detail.hidden;
          detail.hidden = open;
          if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
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
    renderMyRank(players);
    renderList(players);
  }

  function renderEmptyState(message) {
    const myRank = document.getElementById('my-rank-card');
    const list = document.getElementById('leaderboard-list');
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
    renderMyRank(currentPlayers);
  }

  function patchPlayerRow(playerId) {
    const safeId = String(playerId).replace(/"/g, '\\"');
    const row = document.querySelector(`[data-user-id="${safeId}"]`);
    const player = currentPlayers.find(p => p.id === playerId);
    const score = row?.querySelector('[data-rank-score]');
    if (score && player) score.textContent = getMetricValue(player);
  }

  const _RANK_TIER = { 1: 'gold', 2: 'silver', 3: 'bronze' };

  function _rankIcon(rank) {
    const tier = _RANK_TIER[rank];
    if (!tier) return `#${rank}`;
    return `<i class="bi bi-trophy-fill"></i>`;
  }

  // ── My rank row ─────────────────────────────────────
  function renderMyRank(players) {
    const el = document.getElementById('my-rank-card');
    if (!el) return;
    const myIdx = players.findIndex(p => p.id === MY_ID);
    if (myIdx === -1) { el.innerHTML = ''; return; }
    const me = players[myIdx];
    const rank = myIdx + 1;
    const tier = _RANK_TIER[rank];

    el.innerHTML = `
      <div class="lb-row lb-my-row">
        <span class="lb-rank ${tier || ''}">${tier ? _rankIcon(rank) : `#${rank}`}</span>
        ${avatarHTML(me.avatar_url, (me.username||'Y').substring(0,2).toUpperCase(), 32, 'var(--color-primary)', 'var(--color-primary-dim)')}
        <div class="lb-name-block">
          <p class="lb-name">${escapeHtml(me.username)} <span class="lb-you">(You)</span></p>
          <p class="lb-sub">${escapeHtml(me.province)}</p>
        </div>
        <span class="lb-score">${getMetricValue(me)}</span>
      </div>
    `;
  }

  // ── Full rank list — flat, divider-separated ──────
  function renderList(players) {
    const el = document.getElementById('leaderboard-list');
    if (!el) return;

    el.innerHTML = players.map((p, idx) => {
      const rank = idx + 1;
      const isMe = p.id === MY_ID;
      const tier = _RANK_TIER[rank];
      const init = (p.username || '?').substring(0, 2).toUpperCase();
      const ringColor = tier ? { gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' }[tier]
                       : (isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)');

      return `
        <div class="lb-row" data-user-id="${escapeHtml(p.id)}">
          <span class="lb-rank ${tier || ''}">${tier ? _rankIcon(rank) : `#${rank}`}</span>
          ${avatarHTML(p.avatar_url, init, 32, ringColor)}
          <div class="lb-name-block">
            <p class="lb-name">${escapeHtml(p.username)}${isMe ? ` <span class="lb-you">(You)</span>` : ''}</p>
            <p class="lb-sub">${escapeHtml(p.province || '—')}</p>
          </div>
          <span data-rank-score class="lb-score ${tier || ''}">${getMetricValue(p)}</span>
        </div>
      `;
    }).join('');
  }

  return { load, unsubscribe, onScoreUpdate };
})();

window.LeaderboardModule = LeaderboardModule;
