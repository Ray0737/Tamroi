// ── Collection Module ────────────────────────────────
const CollectionModule = (() => {
  let allFigures   = [];
  let allArtifacts = [];
  let captures     = new Set();
  let ownedArtifacts = new Set();
  let newCaptures  = new Set();
  let loreEntries = [];
  let activeFilter = 'all';
  let loaded = false;
  let figureModalBound = false;

  function loadNewCaptures() {
    try {
      const ids = JSON.parse(localStorage.getItem('tamroi_new_captures') || '[]');
      newCaptures = new Set(ids.filter(id => captures.has(id)));
    } catch { newCaptures = new Set(); }
  }

  function saveNewCaptures() {
    localStorage.setItem('tamroi_new_captures', JSON.stringify([...newCaptures]));
  }


  async function load() {
    if (loaded) {
      await refreshLoreEntries();
      render();
      return;
    }
    loaded = true;

    const user = window.AppCore?.App?.user;
    try {
      [allFigures, allArtifacts] = await Promise.all([DB.Figures.getAll(), DB.Artifacts.getAll()]);
      if (user) {
        const [caps, arts, lore] = await Promise.all([
          DB.Figures.getUserCaptures(user.id),
          DB.Artifacts.getUserArtifacts(user.id),
          DB.Lore.getUserUnlocked(user.id),
        ]);
        caps.forEach(c => captures.add(c.figure_id));
        arts.forEach(a => ownedArtifacts.add(a.artifact_id));
        loreEntries = normalizeLoreRows(lore);
        loadNewCaptures();
      }
    } catch {
      allFigures   = [];
      allArtifacts = [];
      loreEntries  = getLocalLoreEntries();
      window.AppCore?.showToast?.('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ');
    }

    bindFilters();
    render();
  }

  async function refreshLoreEntries() {
    const user = window.AppCore?.App?.user;
    if (!user) {
      loreEntries = getLocalLoreEntries();
      return;
    }
    try {
      loreEntries = normalizeLoreRows(await DB.Lore.getUserUnlocked(user.id));
    } catch {
      loreEntries = getLocalLoreEntries();
    }
  }

  function bindFilters() {
    document.querySelectorAll('#collection-filters .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#collection-filters .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeFilter = pill.dataset.filter;
        render();
      });
    });

    const searchInput = document.getElementById('collection-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => render());
    }
  }

  function render() {
    renderStats();
    renderLoreJournal();
    renderFigures();
    renderArtifacts();
  }

  function renderStats() {
    const captured = allFigures.filter(f => captures.has(f.id)).length;
    const legacy   = allFigures
      .filter(f => captures.has(f.id))
      .reduce((sum, f) => sum + (f.legacy_pts || 0), 0);

    const el = document.getElementById('collection-stats');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-item"><span class="stat-value text-orange">${captured}</span><span class="stat-label">Figures</span></div>
      <div class="stat-item"><span class="stat-value text-green">${ownedArtifacts.size}</span><span class="stat-label">Artifacts</span></div>
      <div class="stat-item"><span class="stat-value text-white">${legacy.toLocaleString()}</span><span class="stat-label">Legacy Pts</span></div>
    `;
    // Keep map stats pill in sync
    const capturedEl = document.getElementById('map-stat-captured');
    const legacyEl   = document.getElementById('map-stat-legacy');
    if (capturedEl) capturedEl.textContent = captured;
    if (legacyEl)   legacyEl.textContent   = legacy.toLocaleString();
  }

  function renderFigures() {
    const personSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:36px;height:36px"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    const grid    = document.getElementById('figure-grid');
    const query   = document.getElementById('collection-search')?.value?.toLowerCase() || '';
    const journal = document.getElementById('lore-journal');

    let filtered = allFigures.filter(f => {
      if (activeFilter === 'journal') return false;
      if (activeFilter !== 'all' && activeFilter !== 'artifacts' && f.class !== activeFilter.toUpperCase()) return false;
      if (activeFilter === 'artifacts') return false;
      if (query && !f.name_en.toLowerCase().includes(query) && !f.name_th.includes(query)) return false;
      return true;
    });

    if (!grid) return;
    grid.hidden = activeFilter === 'journal';
    if (journal) journal.hidden = activeFilter !== 'journal';

    const newOnes = filtered.filter(f => newCaptures.has(f.id));
    const rest    = filtered.filter(f => !newCaptures.has(f.id));

    const renderCard = (f, isNew) => {
      const isCaptured = captures.has(f.id);
      const isLocked   = f.class === 'S' && !isCaptured;
      const onclick = isNew
        ? `CollectionModule.dismissNew('${f.id}')`
        : isCaptured ? `CollectionModule.showDetail('${f.id}')` : '';

      return `
        <div class="figure-card ${isCaptured ? `captured-${f.class.toLowerCase()}` : ''} ${isLocked ? 'locked' : ''}"
             style="position:relative" onclick="${onclick}">
          ${isNew ? `<span style="position:absolute;top:4px;left:4px;width:8px;height:8px;border-radius:50%;background:#FF3B30;z-index:2;display:block"></span>` : ''}
          ${isCaptured ? `<div class="captured-ribbon">${checkSVG()}</div>` : ''}
          ${isLocked   ? `<div class="lock-overlay">${lockSVG()}</div>` : ''}
          <div class="figure-portrait" style="color:var(--color-muted)">${personSVG}</div>
          <span class="badge badge-${f.class.toLowerCase()}">${f.class}-Class</span>
          <p class="figure-name-th">${f.name_th}</p>
          <p class="figure-name-en">${f.name_en}</p>
          ${isLocked
            ? `<span class="phase-locked-label">PHASE LOCKED</span>`
            : `<span class="figure-pts">+${f.legacy_pts} pts</span>`
          }
        </div>
      `;
    };

    grid.innerHTML = [
      ...newOnes.map(f => renderCard(f, true)),
      ...rest.map(f => renderCard(f, false)),
    ].join('');
  }

  // SVG icons for each artifact type — fixed-size container prevents overflow
  const ARTIFACT_SVG = {
    'bronze-sword':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4L4 20"/><path d="M20 4l-5 1-1 5L20 4z" fill="rgba(246,193,158,0.3)"/><path d="M8 16l-2 2"/><path d="M6.5 14.5l-3 3 1 1 3-3"/></svg>`,
    'old-map':       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    'ceramic-bowl':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-2 8H8L6 8z"/><path d="M4 8h16"/><path d="M9 16v2a2 2 0 004 0v-2"/></svg>`,
    'silk-fragment': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6c0 0 2-2 4 0s4 0 4 0 2-2 4 0 4 0 4 0"/><path d="M3 12c0 0 2-2 4 0s4 0 4 0 2-2 4 0 4 0 4 0"/><path d="M3 18c0 0 2-2 4 0s4 0 4 0 2-2 4 0 4 0 4 0"/></svg>`,
    'temple-bell':   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  };
  const ARTIFACT_SVG_DEFAULT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`;

  const RARITY_COLORS = { legendary: '#F6C19E', rare: '#7BC67E', common: '#8986A8' };

  function renderArtifacts() {
    const container = document.getElementById('artifact-scroll');
    const section = document.getElementById('collection-artifacts-section');
    if (!container) return;
    if (section) section.hidden = activeFilter === 'journal';

    const list = activeFilter === 'all' || activeFilter === 'artifacts'
      ? allArtifacts
      : [];

    if (!list.length) { container.innerHTML = ''; return; }

    container.innerHTML = list.map(a => {
      const owned    = ownedArtifacts.has(a.id);
      const iconSVG  = ARTIFACT_SVG[a.id] || ARTIFACT_SVG_DEFAULT;
      const rarColor = RARITY_COLORS[a.rarity] || RARITY_COLORS.common;

      return `
        <div class="artifact-card ${owned ? '' : 'locked'}"
             style="${owned ? '' : 'opacity:0.4;filter:grayscale(0.8)'}">
          <!-- Fixed 44×44 circle keeps the SVG inside the card -->
          <div style="
            width:44px;height:44px;border-radius:50%;
            background:${rarColor}18;
            border:1.5px solid ${rarColor}40;
            display:flex;align-items:center;justify-content:center;
            margin:0 auto 6px;flex-shrink:0;
            color:${rarColor};overflow:hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"
                 style="width:22px;height:22px;flex-shrink:0">
              ${iconSVG.replace(/^<svg[^>]*>|<\/svg>$/g, '')}
            </svg>
          </div>
          <p class="artifact-name" style="font-size:9px;line-height:1.3;
             white-space:normal;word-break:break-word;text-align:center">
            ${escapeHtml(a.name)}
          </p>
          <div class="rarity-dot ${a.rarity}"
               style="background:${rarColor};margin:4px auto 0"></div>
        </div>
      `;
    }).join('');
  }

  function renderLoreJournal() {
    const journal = document.getElementById('lore-journal');
    if (!journal) return;

    if (activeFilter !== 'journal') {
      journal.hidden = true;
      return;
    }

    journal.hidden = false;
    if (!loreEntries.length) {
      journal.innerHTML = `
        <div class="lore-journal-card">
          <p class="lore-journal-title">ยังไม่มี Lore</p>
          <p class="lore-journal-preview">เดินเข้าใกล้จุดประวัติศาสตร์บนแผนที่เพื่อปลดล็อคเรื่องราว</p>
        </div>
      `;
      return;
    }

    const grouped = groupLoreEntries(loreEntries);
    journal.innerHTML = grouped.map(group => {
      if (!group.chainId) return renderLoreEntry(group.entries[0]);
      const complete = group.entries.length >= 3;
      const pct = Math.min(100, Math.round((group.entries.length / 3) * 100));
      return `
        <div class="lore-chain-card">
          <div class="lore-chain-head">
            <div>
              <p class="lore-journal-title">${escapeHtml(group.title)}</p>
              <p class="lore-journal-meta">${complete ? 'Complete' : `${group.entries.length}/3 parts`}</p>
            </div>
            <span class="lore-type-badge">${complete ? 'Complete' : `${group.entries.length}/3`}</span>
          </div>
          <div class="progress-track"><div class="progress-fill orange" style="width:${pct}%"></div></div>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm);margin-top:var(--space-sm)">
            ${group.entries.map(renderLoreEntry).join('')}
          </div>
        </div>
      `;
    }).join('');

    journal.querySelectorAll('.lore-journal-card').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('expanded'));
    });
  }

  function normalizeLoreRows(rows) {
    return (rows || [])
      .map(row => {
        const node = row.lore_nodes || row;
        if (!node?.id) return null;
        return {
          ...node,
          unlocked_at: row.unlocked_at || node.unlocked_at,
        };
      })
      .filter(Boolean);
  }

  function getLocalLoreEntries() {
    const nodes = window.MapModule?.getLoreNodes?.() || [];
    const unlocked = new Set(window.MapModule?.getUnlockedLoreIds?.() || []);
    return nodes
      .filter(node => unlocked.has(node.id))
      .map(node => ({ ...node, unlocked_at: new Date().toISOString() }));
  }

  function groupLoreEntries(entries) {
    const groups = [];
    const byChain = new Map();

    entries.forEach(entry => {
      if (!entry.chain_id) {
        groups.push({ chainId: null, entries: [entry] });
        return;
      }
      if (!byChain.has(entry.chain_id)) {
        const group = {
          chainId: entry.chain_id,
          title: entry.name_th || 'Lore Chain',
          entries: [],
        };
        byChain.set(entry.chain_id, group);
        groups.push(group);
      }
      byChain.get(entry.chain_id).entries.push(entry);
    });

    groups.forEach(group => {
      group.entries.sort((a, b) => (a.chain_part || 0) - (b.chain_part || 0));
    });
    return groups;
  }

  function renderLoreEntry(entry) {
    const district = entry.districts?.name_th || entry.district_name || entry.district_id || 'Thailand';
    const date = entry.unlocked_at ? new Date(entry.unlocked_at).toLocaleDateString('th-TH') : '';
    const content = entry.content_th || entry.content_en || '';
    const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;

    return `
      <div class="lore-journal-card" data-lore-id="${escapeHtml(entry.id)}">
        <div class="lore-chain-head">
          <div>
            <p class="lore-journal-title">${escapeHtml(entry.name_th || entry.name_en || 'Lore')}</p>
            <p class="lore-journal-meta">${escapeHtml(district)}${date ? ' · ' + escapeHtml(date) : ''}</p>
          </div>
          <span class="lore-type-badge">${escapeHtml(entry.content_type || 'text')}</span>
        </div>
        <p class="lore-journal-preview">${escapeHtml(preview)}</p>
        <div class="lore-journal-full">${escapeHtml(content)}</div>
      </div>
    `;
  }

  function showDetail(figureId) {
    const fig = allFigures.find(f => f.id === figureId);
    if (!fig) return;
    const modal = document.getElementById('figure-modal');
    if (!modal) return;
    bindFigureModalCleanup(modal);

    document.getElementById('modal-figure-emoji').textContent = fig.image_emoji || '👤';
    document.getElementById('modal-figure-name').textContent  = fig.name_th;
    document.getElementById('modal-figure-en').textContent    = fig.name_en;
    document.getElementById('modal-figure-badge').className   = `badge badge-${fig.class.toLowerCase()}`;
    document.getElementById('modal-figure-badge').textContent = `${fig.class}-Class`;
    document.getElementById('modal-figure-pts').textContent   = `+${fig.legacy_pts} Legacy Points`;

    const bioCard = document.getElementById('modal-figure-bio-card');
    const eraEl   = document.getElementById('modal-figure-era');
    const bioEl   = document.getElementById('modal-figure-bio');
    if (eraEl) eraEl.textContent = fig.era || `${fig.class}-Class · ${(fig.district_id || '').replace(/_/g, ' ')}` || '–';
    if (bioEl) bioEl.textContent = fig.description || fig.description_th || '–';
    if (bioCard) bioCard.hidden = !fig.description && !fig.description_th;

    cleanupModalState();
    const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
  }

  function bindFigureModalCleanup(modal) {
    if (figureModalBound) return;
    figureModalBound = true;
    modal.addEventListener('hidden.bs.modal', cleanupModalState);
  }

  function cleanupModalState() {
    window.setTimeout(() => {
      if (document.querySelector('.modal.show')) return;
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
    }, 0);
  }

  function markCaptured(figureId) {
    captures.add(figureId);
    newCaptures.add(figureId);
    saveNewCaptures();
    render();
  }

  function dismissNew(figureId) {
    newCaptures.delete(figureId);
    saveNewCaptures();
    render();
    showDetail(figureId);
  }

  function checkSVG() {
    return `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="1.5,6 4.5,9.5 10.5,2.5"/>
    </svg>`;
  }

  function lockSVG() {
    return `<svg viewBox="0 0 12 12" fill="currentColor">
      <rect x="2" y="5.5" width="8" height="5.5" rx="1"/>
      <path d="M4 5.5V4a2 2 0 114 0v1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>`;
  }

  return { load, showDetail, markCaptured, dismissNew };
})();

window.CollectionModule = CollectionModule;
