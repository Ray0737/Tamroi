// ── Collection Module ────────────────────────────────
const CollectionModule = (() => {
  let allFigures   = [];
  let allArtifacts = [];
  let captures     = new Set();
  let ownedArtifacts = new Set();
  let newCaptures  = new Set();
  let loreEntries = [];
  let activeView        = 'figures'; // 'figures' | 'artifacts' | 'journal'
  let activeClassFilter = 'all';     // 'all' | 'S' | 'A' | 'B' | 'C'
  let ownedOnly         = false;
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
      const user = window.AppCore?.App?.user;
      if (user) {
        try {
          const caps = await DB.Figures.getUserCaptures(user.id);
          captures = new Set(caps.map(c => c.figure_id));
          loadNewCaptures();
        } catch {}
      }
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
      const dbRows = normalizeLoreRows(await DB.Lore.getUserUnlocked(user.id));
      const dbIds = new Set(dbRows.map(e => e.id));
      const localOnly = getLocalLoreEntries().filter(e => !dbIds.has(e.id));
      loreEntries = [...dbRows, ...localOnly];
    } catch {
      loreEntries = getLocalLoreEntries();
    }
  }

  function bindFilters() {
    const classSelect = document.getElementById('collection-class-filter');
    if (classSelect) {
      classSelect.addEventListener('change', () => {
        activeClassFilter = classSelect.value;
        classSelect.classList.toggle('has-value', activeClassFilter !== 'all');
        render();
      });
    }

    const ownedBtn = document.getElementById('collection-owned-toggle');
    if (ownedBtn) {
      ownedBtn.addEventListener('click', () => {
        ownedOnly = !ownedOnly;
        ownedBtn.classList.toggle('active', ownedOnly);
        render();
      });
    }

    ['collection-artifacts-pill', 'collection-journal-pill'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (activeView === view) {
          activeView = 'figures';
          btn.classList.remove('active');
        } else {
          document.querySelectorAll('#collection-filters .pill').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          if (ownedOnly) document.getElementById('collection-owned-toggle')?.classList.add('active');
          activeView = view;
        }
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
    const el = document.getElementById('collection-stats');
    if (!el) return;

    if (activeView === 'journal') {
      const totalLore    = window.MapModule?.getLoreNodes?.()?.length || 0;
      const completeChains = groupLoreEntries(loreEntries).filter(g => g.chainId && g.entries.length >= 3).length;
      const lorePts      = loreEntries.reduce((s, e) => s + (e.lore_pts || 0), 0);
      el.innerHTML = `
        <div class="stat-item"><span class="stat-value text-orange">${loreEntries.length}${totalLore ? '/' + totalLore : ''}</span><span class="stat-label">Lore</span></div>
        <div class="stat-item"><span class="stat-value text-green">${completeChains}</span><span class="stat-label">Chains</span></div>
        <div class="stat-item"><span class="stat-value text-white">${lorePts.toLocaleString()}</span><span class="stat-label">Lore Pts</span></div>
      `;
      return;
    }

    const captured = allFigures.filter(f => captures.has(f.id)).length;
    const legacy   = allFigures
      .filter(f => captures.has(f.id))
      .reduce((sum, f) => sum + (f.legacy_pts || 0), 0);

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
      if (activeView === 'journal' || activeView === 'artifacts') return false;
      if (ownedOnly && !captures.has(f.id)) return false;
      if (activeClassFilter !== 'all' && f.class !== activeClassFilter.toUpperCase()) return false;
      if (query && !f.name_en.toLowerCase().includes(query) && !f.name_th.includes(query)) return false;
      return true;
    });

    if (!grid) return;
    grid.hidden = activeView === 'journal';
    if (journal) journal.hidden = activeView !== 'journal';

    const classOrder = { S: 0, A: 1, B: 2, C: 3 };
    filtered.sort((a, b) => (classOrder[a.class] ?? 9) - (classOrder[b.class] ?? 9));

    const newOnes = filtered.filter(f => newCaptures.has(f.id));
    const rest    = filtered.filter(f => !newCaptures.has(f.id));

    const renderCard = (f, isNew) => {
      const isCaptured = captures.has(f.id);
      const isLocked   = (f.class === 'S' || f.class === 'A') && !isCaptured;
      const onclick = isNew
        ? `CollectionModule.dismissNew('${f.id}')`
        : isCaptured ? `CollectionModule.showDetail('${f.id}')` : '';

      return `
        <div class="figure-card ${isCaptured ? `captured-${f.class.toLowerCase()}` : ''} ${isLocked ? 'locked' : ''}"
             style="position:relative" onclick="${onclick}">
          ${isNew ? `<span style="position:absolute;top:4px;right:4px;width:8px;height:8px;border-radius:50%;background:var(--color-primary);z-index:2;display:block"></span>` : ''}
          ${isCaptured ? `<div class="captured-ribbon">${checkSVG()}</div>` : ''}
          ${isLocked   ? `<div class="lock-overlay">${lockSVG()}</div>` : ''}
          <div class="figure-portrait" style="color:var(--color-muted)">${personSVG}</div>
          <span class="figure-class-label ${f.class.toLowerCase()}">${f.class}-Class</span>
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
    if (section) section.hidden = activeView === 'journal';

    const showArtifacts = activeView !== 'journal' && (activeView === 'artifacts' || activeClassFilter === 'all');
    let list = showArtifacts ? allArtifacts : [];
    if (ownedOnly && list.length) list = list.filter(a => ownedArtifacts.has(a.id));

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

  async function renderLoreJournal() {
    const journal = document.getElementById('lore-journal');
    if (!journal) return;

    if (activeView !== 'journal') {
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

    // fetch pre/post records for all unlocked nodes
    const userId = window.App?.user?.id;
    const assessmentMap = new Map(); // loreId → { pre, post }
    if (userId && loreEntries.length) {
      const results = await Promise.allSettled(
        loreEntries.map(e => DB.Lore.getAssessments(userId, e.id).then(rows => ({ id: e.id, rows })))
      );
      results.forEach(r => {
        if (r.status !== 'fulfilled') return;
        const { id, rows } = r.value;
        const pre  = rows.find(a => a.phase === 'pre');
        const post = rows.find(a => a.phase === 'post');
        if (pre && post) assessmentMap.set(id, { pre, post });
      });
    }

    const grouped = groupLoreEntries(loreEntries);
    journal.innerHTML = grouped.map(group => {
      if (!group.chainId) return renderLoreEntry(group.entries[0], assessmentMap);
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
            ${group.entries.map(e => renderLoreEntry(e, assessmentMap)).join('')}
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

  function renderLoreEntry(entry, assessmentMap = new Map()) {
    const district = entry.districts?.name_th || entry.district_name || entry.district_id || 'Thailand';
    const date = entry.unlocked_at ? new Date(entry.unlocked_at).toLocaleDateString('th-TH') : '';
    const content = entry.content_th || entry.content_en || '';
    const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;

    const assessment = assessmentMap.get(entry.id);
    const pill = assessment
      ? `<span class="lore-score-pill">ก่อน ${Number(assessment.pre.score)}/${Number(assessment.pre.total)} → หลัง ${Number(assessment.post.score)}/${Number(assessment.post.total)}</span>`
      : '';

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
        ${pill}
      </div>
    `;
  }

  function showDetail(figureId) {
    const fig = allFigures.find(f => f.id === figureId);
    if (!fig) return;
    const modal = document.getElementById('figure-modal');
    if (!modal) return;
    bindFigureModalCleanup(modal);

    // Portrait emoji
    const emojiEl = document.getElementById('modal-figure-emoji');
    if (emojiEl) emojiEl.textContent = fig.image_emoji || '🏛️';

    document.getElementById('modal-figure-name').textContent  = escapeHtml(fig.name_th);
    document.getElementById('modal-figure-en').textContent    = escapeHtml(fig.name_en || '');
    document.getElementById('modal-figure-badge').className   = `figure-class-label ${fig.class.toLowerCase()}`;
    document.getElementById('modal-figure-badge').textContent = `${fig.class}-Class`;
    document.getElementById('modal-figure-pts').textContent   = `+${fig.legacy_pts} Legacy Points`;

    const eraEl = document.getElementById('modal-figure-era');
    const bioEl = document.getElementById('modal-figure-bio');
    if (eraEl) eraEl.textContent = escapeHtml(fig.era || `${fig.class}-Class · ${(fig.district_id || '').replace(/_/g, ' ')}`);
    if (bioEl) bioEl.textContent = escapeHtml(fig.description || '–');

    // Clear async sections
    ['modal-figure-relations','modal-figure-lore','modal-figure-locations'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    cleanupModalState();
    const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();

    // Wire graph button
    const graphBtn = document.getElementById('btn-figure-graph');
    if (graphBtn) {
      graphBtn.onclick = () => { bsModal.hide(); window.FigureGraphModule?.open(figureId); };
    }

    // Inject "Unsolved History" button if figure is captured and has a debate
    const footerEl = modal.querySelector('.modal-footer');
    const existing = document.getElementById('btn-figure-debate');
    if (existing) existing.remove();

    if (captures.has(figureId) && window.DebateModule) {
      DB.Debates.getForFigure(figureId).then(debate => {
        if (!debate) return;
        const btn = document.createElement('button');
        btn.id          = 'btn-figure-debate';
        btn.type        = 'button';
        btn.className   = 'btn btn-outline btn-full';
        btn.style.cssText = 'font-size:11px;margin-bottom:4px';
        btn.textContent = 'ประวัติศาสตร์ที่ยังถกเถียง';
        btn.onclick     = () => { bsModal.hide(); DebateModule.open(figureId); };
        footerEl.insertBefore(btn, footerEl.firstChild);
      }).catch(() => {});
    }

    // Async bio sections — fire-and-forget, fills in as data arrives
    _fillBioSections(fig, figureId, bsModal);
  }

  async function _fillBioSections(fig, figureId, bsModal) {
    const [bioRes, relRes, loreRes] = await Promise.allSettled([
      DB.Figures.getBio(figureId),
      DB.Figures.getRelations(figureId),
      DB.Lore.getForFigure(figureId),
    ]);

    // Long-form bio
    if (bioRes.status === 'fulfilled' && bioRes.value) {
      const bio = bioRes.value;
      const bioEl = document.getElementById('modal-figure-bio');
      const eraEl = document.getElementById('modal-figure-era');
      if (bioEl && bio.bio_th) bioEl.textContent = escapeHtml(bio.bio_th);
      if (eraEl && (bio.birth_year || bio.death_year)) {
        const years = [bio.birth_year ? `พ.ศ. ${bio.birth_year + 543}` : null,
                       bio.death_year ? `พ.ศ. ${bio.death_year + 543}` : null].filter(Boolean).join(' – ');
        eraEl.textContent = escapeHtml((bio.era || fig.era || '') + (years ? `  ·  ${years}` : ''));
      }
    }

    // Relations chips
    if (relRes.status === 'fulfilled' && relRes.value?.length) {
      const relList = document.getElementById('modal-figure-relations-list');
      const relSec  = document.getElementById('modal-figure-relations');
      if (relList && relSec) {
        relList.innerHTML = relRes.value.map(r => {
          const captured = captures.has(r.id);
          const emoji    = escapeHtml(r.image_emoji || '🏛️');
          const name     = escapeHtml(r.name_th || r.id);
          const rel      = escapeHtml(r.relation_th || '');
          if (captured) {
            return `<button class="fig-relation-chip" onclick="CollectionModule.showDetail('${escapeHtml(r.id)}')">
              <span class="fig-chip-emoji">${emoji}</span>
              <span class="fig-chip-name">${name}</span>
              <span class="fig-chip-rel">${rel}</span>
            </button>`;
          }
          return `<span class="fig-relation-chip fig-chip-locked" title="ยังไม่ถูกจับ">
            <span class="fig-chip-emoji">🔒</span>
            <span class="fig-chip-name">???</span>
            <span class="fig-chip-rel">${rel}</span>
          </span>`;
        }).join('');
        relSec.style.display = '';
      }
    }

    // Related lore
    if (loreRes.status === 'fulfilled' && loreRes.value?.length) {
      const loreSec  = document.getElementById('modal-figure-lore');
      const loreList = document.getElementById('modal-figure-lore-list');
      const unlockedIds = new Set(loreEntries.map(e => e.lore_nodes?.id || e.id));
      if (loreList && loreSec) {
        loreList.innerHTML = loreRes.value.map(node => {
          const unlocked = unlockedIds.has(node.id);
          const name     = escapeHtml(node.name_th || node.name_en || '');
          if (unlocked) {
            return `<button class="fig-lore-row fig-lore-unlocked" onclick="CollectionModule._openLoreFromModal('${escapeHtml(node.id)}', event)">
              <span class="fig-lore-icon">📜</span>
              <span class="fig-lore-name">${name}</span>
            </button>`;
          }
          return `<div class="fig-lore-row fig-lore-locked">
            <span class="fig-lore-icon">🔒</span>
            <span class="fig-lore-name fig-lore-teaser">??? — ไปสำรวจเพื่อปลดล็อก</span>
          </div>`;
        }).join('');
        loreSec.style.display = '';
      }
    }

    // Related locations — figure's own pin + lore node coords
    const locations = [];
    if (fig.lat && fig.lng) {
      locations.push({ name: escapeHtml(fig.name_th), sub: escapeHtml((fig.district_id || '').replace(/_/g, ' ')), lat: fig.lat, lng: fig.lng });
    }
    if (loreRes.status === 'fulfilled') {
      (loreRes.value || []).filter(n => n.lat && n.lng).forEach(n => {
        locations.push({ name: escapeHtml(n.name_th || n.name_en || ''), sub: 'Lore', lat: n.lat, lng: n.lng });
      });
    }
    if (locations.length) {
      const locSec  = document.getElementById('modal-figure-locations');
      const locList = document.getElementById('modal-figure-locations-list');
      if (locList && locSec) {
        locList.innerHTML = locations.map(loc =>
          `<div class="fig-location-row">
            <span class="fig-loc-name">${loc.name}</span>
            <span class="fig-loc-sub">${loc.sub}</span>
            <button class="fig-loc-map-btn" onclick="CollectionModule._goToMap(${loc.lat},${loc.lng})">ดูบนแผนที่</button>
          </div>`
        ).join('');
        locSec.style.display = '';
      }
    }
  }

  function _openLoreFromModal(loreId, e) {
    e?.stopPropagation();
    const node = loreEntries.find(entry => (entry.lore_nodes?.id || entry.id) === loreId)?.lore_nodes
               || loreEntries.find(entry => entry.id === loreId);
    if (node) window.AppCore?.openLoreSheet?.(node);
  }

  function _goToMap(lat, lng) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('figure-modal'));
    modal?.hide();
    // Switch to map tab
    const mapTab = document.querySelector('[data-tab="map"]');
    if (mapTab) mapTab.click();
    setTimeout(() => window.MapModule?.flyToLocation?.(lat, lng), 300);
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

  return { load, showDetail, markCaptured, dismissNew, isCaptured: id => captures.has(id), _openLoreFromModal, _goToMap };
})();

window.CollectionModule = CollectionModule;
