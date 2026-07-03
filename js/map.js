// ── Map Module ────────────────────────────────────────
const MapModule = (() => {
  let map        = null;
  let fogLayer         = null;    // single unified fog polygon
  let guildFogLayer    = null;    // tinted overlay for guild-cleared districts
  let markers          = {};
  let activeDistrict   = null;
  let _nodeCardTimer   = null;    // auto-dismiss timer for node info card
  let _locationMarker  = null;    // real-time GPS dot
  let _locationWatcher = null;    // watchPosition handle
  let _posHistory      = [];      // recent positions for speed/teleport detection
  let allDistrictsCache = null;
  let homeLocation      = null;
  let lastKnownPosition = null;
  let loreNodes = [];
  let activeLoreNode = null;
  let activeQuiz = null;
  const unlockedLoreIds = new Set();
  const pendingLoreIds = new Set();
  const completedLoreChains = new Set();
  const visitedSupportNodeIds = new Set();
  const _WALK_KEY = 'tam_roi_walk_cells';
  let _walkGridCells = null;
  let _walkGridMap   = null;
  const _walkedCells = new Set();
  const HOME_KEY = 'tam_roi_home';
  const LEGACY_HOME_KEY = 'siam' + 'echo_home';
  const CHECKIN_TOLERANCE_M = 500;

  // ── BTS/MRT stations — loaded from Supabase bts_mrt_stations ──
  let btsMrtStations = [];

  // ── Bounding box for the fog overlay ────────────────
  // Covers Bangkok, Nonthaburi AND Ayutthaya province
  const FOG_OUTER = [
    [13.40, 100.20], [13.40, 101.10],
    [14.50, 101.10], [14.50, 100.20],
  ];

  // ── Districts — loaded from Supabase districts table ──
  // (allDistrictsCache holds the live data after loadDistrictData runs)

  // ── Nodes — loaded from Supabase support_nodes table ──
  let supportNodes = [];

  // ── Figure nodes — loaded from Supabase figures table ─
  let figureNodes = [];


  // ── Lore nodes — loaded from Supabase lore_nodes table ─

  // ── User state ─────────────────────────────────────
  // Default all districts to fogged+zero — DB state loaded at boot overrides these
  const _blank = () => ({ fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 });
  let userDistrictState = {
    rattanakosin: _blank(),
    dusit:        _blank(),
    pathumwan:    _blank(),
    silom:        _blank(),
    sukhumvit:    _blank(),
    watthana:     _blank(),
    chatuchak:    _blank(),
    ladphrao:     _blank(),
    bang_kapi:    _blank(),
    phra_khanong: _blank(),
    bang_na:      _blank(),
    nonthaburi:   _blank(),
    ayutthaya:    _blank(),
    satit_test:   _blank(),
  };

  // ── SVG icon helpers ────────────────────────────────
  const _SVG = {
    coffee: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    shop:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
    temple: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="13"/><line x1="10" y1="18" x2="10" y2="13"/><line x1="14" y1="18" x2="14" y2="13"/><line x1="18" y1="18" x2="18" y2="13"/><polygon points="12 3 20 8 4 8"/></svg>`,
  };

  const NODE_CFG = {
    cafe:     { label: 'ร้านกาแฟ',      color: '#7BC67E', bg: 'rgba(123,198,126,0.18)', svg: _SVG.coffee },
    otop:     { label: 'OTOP / ร้านค้า', color: '#F6C19E', bg: 'rgba(246,193,158,0.18)', svg: _SVG.shop },
    landmark: { label: 'สถานที่สำคัญ',   color: '#8986A8', bg: 'rgba(137,134,168,0.18)', svg: _SVG.temple },
  };

  // ── Init ───────────────────────────────────────────
  function init() {
    const container = document.getElementById('map-view');
    if (!container || map) return;

    map = L.map('map-view', {
      center: [13.756, 100.502],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    renderThailandGrid();

    loadDistrictData();
    loadLoreData();
    updateStatsBar();

    // Dismiss node info card on map click/drag
    map.on('click mousedown', () => {
      const card = document.getElementById('node-info-card');
      if (card) { card.classList.remove('show'); clearTimeout(_nodeCardTimer); }
    });

    // Start GPS tracking
    startLocationTracking();
    _initWalkGrid();
  }

  // ── Real-time location dot ─────────────────────────
  // ── GPS anti-spoof helpers ─────────────────────────
  // DevTools Sensors always reports accuracy === 0.
  // Mock-location apps can teleport instantly; real movement is capped at ~50 m/s.
  function _isPlausiblePosition(lat, lng, accuracy) {
    if (accuracy === 0) return false; // DevTools spoof signature

    const now = Date.now();
    if (_posHistory.length) {
      const prev = _posHistory[_posHistory.length - 1];
      const dist = haversineDistance(prev.lat, prev.lng, lat, lng);
      const dt   = (now - prev.ts) / 1000; // seconds
      if (dt > 0 && dist / dt > 50) return false; // > 50 m/s is impossible on foot/transit
    }

    _posHistory.push({ lat, lng, ts: now });
    if (_posHistory.length > 10) _posHistory.shift();
    return true;
  }

  function startLocationTracking() {
    if (!navigator.geolocation) return;

    _locationWatcher = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!isDev() && !_isPlausiblePosition(latitude, longitude, accuracy)) {
          console.warn('[GPS] Rejected implausible position (accuracy=' + accuracy + ')');
          return;
        }
        lastKnownPosition = { lat: latitude, lng: longitude, accuracy };
        updateLocationDot(latitude, longitude, accuracy);
        checkLoreProximity(latitude, longitude);
        _revealWalkCell(latitude, longitude);
      },
      err => console.warn('[GPS]', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function _initWalkGrid() {
    if (!window.FogGrid) return;
    _walkGridCells = window.FogGrid.createGridCells({
      bounds: { south: 13.45, north: 14.10, west: 100.20, east: 100.90 },
      rows: 65, cols: 70,
    });
    _walkGridMap = new Map(_walkGridCells.map(c => [c.id, c]));
    try {
      JSON.parse(localStorage.getItem(_WALK_KEY) || '[]').forEach(id => _walkedCells.add(id));
    } catch {}
  }

  function _pointInPoly(lat, lng, coords) {
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const [yi, xi] = coords[i], [yj, xj] = coords[j];
      if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  }

  function _revealWalkCell(lat, lng) {
    const cell = _walkGridCells && window.FogGrid.findCellForLatLng(lat, lng, _walkGridCells);
    if (!cell || _walkedCells.has(cell.id)) return;
    _walkedCells.add(cell.id);
    try { localStorage.setItem(_WALK_KEY, JSON.stringify([..._walkedCells])); } catch {}
    buildFogLayer(allDistrictsCache || []);
  }

  function updateLocationDot(lat, lng, accuracy) {
    if (_locationMarker)  { map.removeLayer(_locationMarker);  _locationMarker = null; }

    // Dot marker with pulsing CSS animation
    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-location-dot"></div>`,
      iconSize:   [18, 18],
      iconAnchor: [9, 9],
    });

    _locationMarker = L.marker([lat, lng], {
      icon,
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);
  }

  async function loadDistrictData() {
    let districts = [];
    try {
      const data = await DB.Districts.getAll();
      if (data?.length) districts = data;

      const user = window.AppCore?.App?.user;
      const baseLoaders = [loadSupportNodes(), loadFigureNodes(), loadBtsMrtStations()];
      if (user) {
        const [stateData] = await Promise.all([
          DB.Districts.getUserState(user.id),
          loadVisitedSupportNodes(user.id),
          ...baseLoaders,
        ]);
        stateData.forEach(s => {
          userDistrictState[s.district_id] = s;
        });
        updateDiscoveryPercentFromDB(user.id);
      } else {
        await Promise.all(baseLoaders);
      }
    } catch { /* use mock data */ }

    allDistrictsCache = districts;
    homeLocation = getHomeLocation();

    if (!homeLocation) {
      showHomeLocationPicker(districts);
    } else {
      map.setView([homeLocation.lat, homeLocation.lng], 13, { animate: false });
      addHomeMarker(homeLocation);
      renderAll(districts);
    }
  }

  async function loadSupportNodes() {
    try {
      const data = await DB.SupportNodes.getAll();
      if (data?.length) {
        // normalise district_id → districtId so existing render code works unchanged
        supportNodes = data.map(n => ({ ...n, districtId: n.district_id }));
      }
    } catch { /* supportNodes stays empty — nodes just won't render */ }
  }

  async function loadFigureNodes() {
    try {
      const data = await DB.Figures.getAll();
      if (data?.length) {
        figureNodes = data.map(f => ({ ...f, districtId: f.district_id }));
        const missing = figureNodes.filter(f => f.lat == null || f.lng == null).map(f => f.id);
        if (missing.length) console.warn('[map] figures missing lat/lng ids:', missing);
      }
    } catch { /* figureNodes stays empty */ }
  }

  async function loadBtsMrtStations() {
    try {
      const data = await DB.BtsMrtStations.getAll();
      if (data?.length) btsMrtStations = data;
    } catch { /* btsMrtStations stays empty — transport multiplier returns 1 */ }
  }

  async function loadVisitedSupportNodes(userId) {
    if (!DB.Districts.getVisitedSupportNodes) return;
    try {
      const nodeIds = await DB.Districts.getVisitedSupportNodes(userId);
      nodeIds.forEach(id => visitedSupportNodeIds.add(id));
    } catch { /* older DB patches keep session-only visit dedupe */ }
  }

  async function loadLoreData() {
    loreNodes = [];
    unlockedLoreIds.clear();
    pendingLoreIds.clear();

    const user = window.AppCore?.App?.user;
    if (!user) return;

    try {
      const [nodes, unlocked] = await Promise.all([
        DB.Lore.getAll(),
        DB.Lore.getUserUnlocked(user.id),
      ]);
      if (nodes?.length) loreNodes = nodes;
      unlocked.forEach(row => {
        const id = row.lore_id || row.lore_nodes?.id;
        if (id) unlockedLoreIds.add(id);
      });
      if (map) renderLoreMarkers();
    } catch (e) { console.error('[lore] failed to load from Supabase:', e); }
  }

  function haversineDistance(lat1, lng1, lat2, lng2) {
    const toRad = deg => deg * Math.PI / 180;
    const earthRadiusM = 6371000;
    const dLat = toRad(Number(lat2) - Number(lat1));
    const dLng = toRad(Number(lng2) - Number(lng1));
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2)))
      * Math.sin(dLng / 2) ** 2;
    return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function checkLoreProximity(userLat, userLng) {
    loreNodes.forEach(node => {
      if (unlockedLoreIds.has(node.id) || pendingLoreIds.has(node.id)) return;
      const districtId = node.district_id || node.districtId;
      if (districtId && userDistrictState[districtId]?.fogged !== false) return;
      const distance = haversineDistance(userLat, userLng, node.lat, node.lng);
      if (distance <= (Math.min(node.radius_m || 50, 50))) unlockLore(node);
    });
  }

  function unlockLore(node) {
    activeLoreNode = node;
    pendingLoreIds.add(node.id);

    const banner = document.getElementById('proximity-banner');
    const name = document.getElementById('proximity-name');
    if (banner && name) {
      name.textContent = node.name_th || node.name_en || 'Lore nearby';
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 2500);
    }

    window.AppCore?.openLoreSheet(node);
    renderLoreMarkers();
  }

  async function saveLoreUnlock(loreId) {
    const node = loreNodes.find(item => item.id === loreId) || activeLoreNode;
    if (!node) return;

    if (!isDev() && lastKnownPosition && haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, node.lat, node.lng) > (Math.min(node.radius_m || 50, 50))) {
      window.AppCore?.showToast('คุณอยู่ไกลเกินไป — เดินทางให้ใกล้กว่านี้');
      return;
    }

    // Quiz gate: if the district has a quiz question, ask it before saving
    const districtId = node.district_id || node.districtId;
    if (districtId) {
      try {
        const q = await DB.Quiz.getForDistrict(districtId);
        if (q) {
          activeQuiz = { isLore: true, loreId: node.id, questions: [q], questionIndex: 0, selected: null };
          renderLoreQuizSheet(node, q);
          window.AppCore?.openSheet('quiz-sheet');
          return;
        }
      } catch { /* no quiz available, proceed directly */ }
    }

    await completeLoreUnlock(node);
  }

  function renderLoreQuizSheet(node, question) {
    const step    = document.getElementById('quiz-step');
    const pts     = document.getElementById('quiz-pts');
    const title   = document.getElementById('quiz-title');
    const qEl     = document.getElementById('quiz-question');
    const options = document.getElementById('quiz-options');
    const submit  = document.getElementById('btn-submit-quiz');
    if (!step || !pts || !title || !qEl || !options || !submit) return;

    step.textContent = 'Lore Quiz';
    pts.textContent  = `+${node.lore_pts || 0} pts`;
    title.textContent = node.name_th || node.name_en || 'Lore';
    qEl.textContent   = question.question_th || '';

    options.innerHTML = ['A', 'B', 'C', 'D'].map(opt => {
      const key = `option_${opt.toLowerCase()}`;
      return `<button class="btn btn-ghost btn-full quiz-option" data-option="${opt}" type="button">${opt}. ${escapeHtml(question[key] || '')}</button>`;
    }).join('');

    options.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        activeQuiz.selected = btn.dataset.option;
        options.querySelectorAll('.quiz-option').forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); });
        btn.classList.remove('btn-ghost');
        btn.classList.add('btn-primary');
      });
    });

    submit.disabled = false;
    submit.textContent = 'ยืนยันคำตอบ';
    submit.onclick = submitQuizAnswer;
  }

  async function completeLoreUnlock(nodeOrId) {
    const node = typeof nodeOrId === 'string'
      ? (loreNodes.find(item => item.id === nodeOrId) || activeLoreNode)
      : nodeOrId;
    if (!node) return;

    const btn = document.getElementById('btn-save-lore');
    if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div>`; }

    const user = window.AppCore?.App?.user;
    try {
      if (user) {
        await DB.Lore.unlock(user.id, node.id);
        await DB.Profiles.addLegacyPoints(user.id, (node.lore_pts || 0) * getTransportMultiplier());
      }
    } catch (e) { console.error('[lore unlock] DB write failed:', e); }

    unlockedLoreIds.add(node.id);
    pendingLoreIds.delete(node.id);
    renderLoreMarkers();
    window.AppCore?.closeAllSheets();
    const earned = (node.lore_pts || 0) * getTransportMultiplier();
    if (earned > (node.lore_pts || 0)) window.AppCore?.showToast('BTS/MRT Bonus! x2 Legacy Points');
    showFloatPtsOnMap(earned);
    if (user) DB.Missions?.updateChallengeProgress(user.id, 'lore').catch(() => {});
    window.CollectionModule?.load?.();
    checkLoreChainComplete(node, user);
  }

  async function checkLoreChainComplete(node, user) {
    if (!node.chain_id || completedLoreChains.has(node.chain_id)) return;

    const chainNodes = loreNodes
      .filter(item => item.chain_id === node.chain_id)
      .sort((a, b) => (a.chain_part || 0) - (b.chain_part || 0));
    if (chainNodes.length < 3) return;

    const complete = chainNodes.every(item => unlockedLoreIds.has(item.id));
    if (!complete) return;

    completedLoreChains.add(node.chain_id);
    try {
      if (user) await DB.Profiles.addLegacyPoints(user.id, 50);
    } catch { /* keep chain completion visible even if score write fails */ }

    window.AppCore?.openLoreChainSheet({
      title: `${chainNodes[0].name_th || 'Lore Chain'} Complete`,
      content: chainNodes.map(item => item.content_th || item.content_en || '').join('\n\n'),
    });
    showFloatPtsOnMap(50);
  }

  // ── Unified render ─────────────────────────────────
  function renderAll(districts) {
    buildFogLayer(districts);
    renderWatchtowers(districts);
    renderNodes();
    renderLoreMarkers();
    renderFigureNodes();
  }

  // ── Fog: single inverted polygon ───────────────────
  // One polygon covers all Bangkok; holes are cut for each explored district.
  // Uses SVG evenodd fill rule — clean, no per-district artifacts.
  function buildFogLayer(districts) {
    const clearedPolys = districts
      .filter(d => !(userDistrictState[d.id]?.fogged ?? true))
      .map(d => {
        const raw = d.polygon_coords;
        return (typeof raw === 'string' ? JSON.parse(raw) : (raw || [])).map(c => [c[0], c[1]]);
      })
      .filter(h => h.length > 0);

    // Walk-cell holes: skip cells already inside a cleared district polygon to avoid
    // evenodd fill-rule cancellation (overlapping holes re-fog the overlap area).
    const cellHoles = [..._walkedCells]
      .map(id => _walkGridMap?.get(id))
      .filter(cell => cell && !clearedPolys.some(poly => _pointInPoly(cell.center.lat, cell.center.lng, poly)))
      .map(cell => cell.bounds);

    if (fogLayer) { map.removeLayer(fogLayer); fogLayer = null; }

    fogLayer = L.polygon([FOG_OUTER, ...clearedPolys, ...cellHoles], {
      fillColor:   '#0d0c1d',
      fillOpacity: 0.80,
      stroke:      false,
      interactive: false,
      fillRule:    'evenodd',
    }).addTo(map);
  }

  function renderThailandGrid() {
    if (!window.FogGrid) return;
    const layers = window.FogGrid.createGridCells().map(cell => L.polygon(cell.bounds, {
      color:       'rgba(255,255,255,0.15)',
      weight:      1,
      fill:        false,
      interactive: false,
    }));
    L.layerGroup(layers).addTo(map);
  }

  function renderGuildFog(clearedDistrictIds) {
    if (guildFogLayer) { map.removeLayer(guildFogLayer); guildFogLayer = null; }
    if (!clearedDistrictIds?.length || !allDistrictsCache) return;
    const userCleared = new Set(
      Object.keys(userDistrictState).filter(id => !userDistrictState[id].fogged)
    );
    const layers = allDistrictsCache
      .filter(d => clearedDistrictIds.includes(d.id) && !userCleared.has(d.id))
      .map(d => {
        const raw = d.polygon_coords;
        const coords = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
        if (!coords.length) return null;
        return L.polygon(coords.map(c => [c[0], c[1]]), {
          fillColor:   '#7BC67E',
          fillOpacity: 0.22,
          color:       '#7BC67E',
          weight:      1,
          opacity:     0.35,
          interactive: false,
        });
      })
      .filter(Boolean);
    if (!layers.length) return;
    guildFogLayer = L.layerGroup(layers).addTo(map);
  }

  // ── Watchtower markers ─────────────────────────────
  function renderWatchtowers(districts) {
    districts.forEach(d => {
      if (markers[`wt-${d.id}`]) {
        map.removeLayer(markers[`wt-${d.id}`]);
      }

      const fogged = userDistrictState[d.id]?.fogged ?? true;
      const icon = L.divIcon({
        className: '',
        html: `<div class="marker-watchtower ${fogged ? '' : 'visited'}" title="${d.name_th}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px">
            <rect x="4" y="2" width="16" height="4" rx="1"/>
            <line x1="6" y1="6" x2="6" y2="22"/><line x1="18" y1="6" x2="18" y2="22"/>
            <line x1="12" y1="6" x2="12" y2="22"/><line x1="4" y1="22" x2="20" y2="22"/>
            <line x1="6" y1="12" x2="18" y2="12"/>
          </svg>
        </div>`,
        iconSize: [32, 38],
        iconAnchor: [16, 38],
      });

      const wt = L.marker([d.center_lat, d.center_lng], { icon }).addTo(map);

      // Always show check-in sheet — the sheet handles locked/unlocked state
      wt.on('click', () => showCheckInSheet(d));

      markers[`wt-${d.id}`] = wt;
    });
  }

  // ── Node markers ────────────────────────────────────
  function renderNodes() {
    // Clear existing node markers
    Object.keys(markers).forEach(k => {
      if (k.startsWith('node-')) { map.removeLayer(markers[k]); delete markers[k]; }
    });

    supportNodes.forEach((node, i) => {
      const state = userDistrictState[node.districtId] || { fogged: true };
      if (state.fogged) return;

      const cfg  = NODE_CFG[node.type] || NODE_CFG.landmark;
      const icon = L.divIcon({
        className: '',
        html: `<div class="marker-node marker-${node.type}" style="color:${cfg.color}">${cfg.svg}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const nodeMarker = L.marker([node.lat, node.lng], { icon }).addTo(map);
      // Use custom card instead of Leaflet popup — avoids z-index conflict with bottom-nav
      nodeMarker.on('click', () => showNodeInfoCard(node));
      markers[`node-${i}`] = nodeMarker;
    });
  }

  function renderFigureNodes() {
    Object.keys(markers).forEach(k => {
      if (k.startsWith('figure-')) { map.removeLayer(markers[k]); delete markers[k]; }
    });

    figureNodes.forEach(figure => {
      const state = userDistrictState[figure.districtId] || { fogged: true };
      if (state.fogged) return;
      if (window.CollectionModule?.isCaptured?.(figure.id)) return;

      if (figure.lat == null || figure.lng == null) {
        const district = (allDistrictsCache || []).find(d => d.id === figure.districtId);
        const lat = district?.watchtower_lat ?? district?.center_lat;
        const lng = district?.watchtower_lng ?? district?.center_lng;
        if (lat == null || lng == null) return;
        const icon = L.divIcon({
          className: '',
          html: `<div class="marker-node" style="opacity:0.55;border-style:dashed" title="ตำแหน่งยังไม่ระบุ">?</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        markers[`figure-${figure.id}`] = L.marker([lat, lng], { icon }).addTo(map);
        return;
      }

      const icon = figure.raid_only
        ? L.divIcon({
            className: '',
            html: `<div class="marker-node" style="color:#EF5350;background:rgba(239,83,80,0.15);border-color:#EF5350" title="Raid Encounter">⚔️</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
        : L.divIcon({
            className: '',
            html: `<div class="marker-node" style="color:var(--color-primary);background:var(--color-primary-dim);border-color:var(--color-primary)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

      const marker = L.marker([figure.lat, figure.lng], { icon }).addTo(map);
      marker.on('click', () => {
        if (figure.raid_only) _startRaidEncounter(figure);
        else if (figure.class === 'C') _completeCapture(figure, 0);
        else if (figure.class === 'B') openQuizForFigure(figure.id);
        else openLegendaryEncounter(figure.districtId, figure.id);
      });
      markers[`figure-${figure.id}`] = marker;
    });
  }

  // Raid-only figures skip the solo quiz entirely — they can only be captured
  // through RaidModule's group lobby (canStartRaid checks online guild members).
  function _startRaidEncounter(figure) {
    if (!window.RaidModule) return;
    if (!window.RaidModule.canStartRaid(figure)) {
      window.AppCore?.showToast('ต้องมีสมาชิกกลุ่มออนไลน์อย่างน้อย ' + (figure.raid_min_players || 2) + ' คนเพื่อเริ่ม Raid');
      return;
    }
    window.RaidModule.openRaidModal(figure);
  }

  async function _completeCapture(figure, quizScore) {
    const u = window.AppCore?.App?.user;
    try { if (u) await DB.Figures.capture(u.id, figure.id, quizScore); } catch {}
    if (u) DB.Missions?.updateChallengeProgress(u.id, 'capture').catch(() => {});
    window.CollectionModule?.markCaptured?.(figure.id);
    const mk = markers[`figure-${figure.id}`];
    if (mk) { map.removeLayer(mk); delete markers[`figure-${figure.id}`]; }
    const distId = figure.districtId;
    if (distId && userDistrictState[distId]?.fogged !== false) {
      if (u) DB.Districts.checkIn(u.id, distId).catch(() => {});
      userDistrictState[distId] = { ...(userDistrictState[distId] || {}), fogged: false };
      buildFogLayer(allDistrictsCache || []);
      renderWatchtowers(allDistrictsCache || []);
    }
    window.AppCore?.closeAllSheets();
    showFloatPtsOnMap(figure.legacy_pts || 0);
    window.AppCore?.showCaptureReveal(figure);
  }

  function renderLoreMarkers() {
    Object.keys(markers).forEach(k => {
      if (k.startsWith('lore-')) { map.removeLayer(markers[k]); delete markers[k]; }
    });

    getLoreNodes().forEach(node => {
      const districtId = node.district_id || node.districtId;
      const state = districtId ? userDistrictState[districtId] : null;
      if (districtId && state?.fogged !== false) return;

      const discovered = unlockedLoreIds.has(node.id) || pendingLoreIds.has(node.id);

      if (!discovered) {
        // Radius ring so players can see how close they need to be
        const ring = L.circle([node.lat, node.lng], {
          radius: 50,
          color: '#8986A8',
          weight: 1,
          dashArray: '4,4',
          fillColor: '#8986A8',
          fillOpacity: 0.05,
          interactive: false,
        }).addTo(map);
        markers[`lore-ring-${node.id}`] = ring;

        const mysteryIcon = L.divIcon({
          className: '',
          html: `<div class="marker-node marker-lore-mystery" title="???">???</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const mysteryMarker = L.marker([node.lat, node.lng], { icon: mysteryIcon }).addTo(map);
        mysteryMarker.on('click', () => openVisitedLore(node.id));
        markers[`lore-${node.id}`] = mysteryMarker;
        return;
      }

      const icon = L.divIcon({
        className: '',
        html: `<div class="marker-node marker-lore" title="${escapeHtml(node.name_th || node.name_en || 'Lore')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z"/>
          </svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([node.lat, node.lng], { icon }).addTo(map);
      marker.on('click', () => openVisitedLore(node.id));
      markers[`lore-${node.id}`] = marker;
    });
  }

  function openVisitedLore(loreId) {
    const node = getLoreNodes().find(item => item.id === loreId);
    if (!node) return;

    if (!unlockedLoreIds.has(loreId) && !pendingLoreIds.has(loreId)) {
      window.AppCore?.showToast('เดินทางไปปลดล็อค Lore นี้ก่อน');
      return;
    }

    activeLoreNode = node;
    window.AppCore?.openLoreSheet({ ...node, is_saved: unlockedLoreIds.has(loreId) });
  }

  // ── Node info card (above nav, no z-index conflicts) ──
  function showNodeInfoCard(node) {
    const card    = document.getElementById('node-info-card');
    const content = document.getElementById('node-info-content');
    if (!card || !content) return;

    const cfg      = NODE_CFG[node.type] || NODE_CFG.landmark;
    const district = (allDistrictsCache || []).find(d => d.id === node.districtId);
    const id = getSupportNodeId(node);
    const visited = visitedSupportNodeIds.has(id);

    const iconInner = node.type === 'cafe'
      ? '<path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/>'
      : node.type === 'otop'
        ? '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>'
        : '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><polygon points="12 2 20 7 4 7"/>';

    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px">
        <div style="width:36px;height:36px;border-radius:50%;background:${cfg.bg};
                    display:flex;align-items:center;justify-content:center;
                    flex-shrink:0;color:${cfg.color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">
            ${iconInner}
          </svg>
        </div>
        <div style="flex:1;min-width:0">
          <p style="margin:0;font-weight:600;font-size:13px;color:#fff;line-height:1.3;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(node.name)}</p>
          <p style="margin:2px 0 0;font-size:10px;color:#8986A8">
            ${escapeHtml(cfg.label)}${district ? ' · ' + escapeHtml(district.name_th) : ''}
          </p>
        </div>
        <button onclick="document.getElementById('node-info-card').classList.remove('show')"
                style="background:none;border:none;color:#8986A8;padding:4px;cursor:pointer;
                       flex-shrink:0;display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               style="width:16px;height:16px">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div style="padding:0 14px 12px">
        <button class="btn btn-sm ${visited ? 'btn-ghost' : 'btn-primary'} btn-full"
                id="btn-visit-support-node"
                onclick="MapModule.visitSupportNode('${escapeHtml(id)}')"
                ${visited ? 'disabled' : ''}>
          ${visited ? 'เยี่ยมชมแล้ว' : 'เยี่ยมชมสถานที่นี้'}
        </button>
      </div>
    `;

    card.classList.add('show');
    clearTimeout(_nodeCardTimer);
    _nodeCardTimer = setTimeout(() => card.classList.remove('show'), 4000);
  }

  async function visitSupportNode(nodeId) {
    const node = supportNodes.find(item => getSupportNodeId(item) === nodeId);
    if (!node || visitedSupportNodeIds.has(nodeId)) return;

    if (!isDev() && lastKnownPosition && haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, node.lat, node.lng) > CHECKIN_TOLERANCE_M) {
      window.AppCore?.showToast('คุณอยู่ไกลเกินไป — เดินทางให้ใกล้กว่านี้');
      return;
    }

    const btn = document.getElementById('btn-visit-support-node');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner"></div>`;
    }

    let nextState = null;
    const user = window.AppCore?.App?.user;
    try {
      if (user) nextState = await DB.Districts.updateNodeVisit(user.id, node.districtId, node.type, nodeId);
    } catch { /* offline fallback below */ }

    const current = userDistrictState[node.districtId] || { fogged: false, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 };
    const field = node.type === 'cafe' ? 'cafes_visited'
      : node.type === 'otop' ? 'otops_visited'
      : 'landmarks_visited';
    userDistrictState[node.districtId] = nextState || {
      ...current,
      [field]: (current[field] || 0) + 1,
    };

    visitedSupportNodeIds.add(nodeId);
    window.AppCore?.showToast('บันทึกการเยี่ยมชม ✓');
    showNodeInfoCard(node);
    if (activeDistrict?.id === node.districtId) showCheckInSheet(activeDistrict);
  }

  function getSupportNodeId(node) {
    return node.id || `${node.districtId}-${node.type}-${node.lat}-${node.lng}`;
  }

  // ── Check-in sheet ─────────────────────────────────
  function showCheckInSheet(district) {
    activeDistrict = district;
    const state = userDistrictState[district.id] || {};
    const fogged = state.fogged ?? true;

    document.getElementById('checkin-district-name').textContent     = district.name_th;
    document.getElementById('checkin-district-province').textContent = district.province;

    const rc = district.required_cafes     || 2;
    const ro = district.required_otops     || 1;
    const rl = district.required_landmarks || 3;
    const vc = state.cafes_visited     || 0;
    const vo = state.otops_visited     || 0;
    const vl = state.landmarks_visited || 0;

    document.getElementById('checkin-reveals').innerHTML = `
      <span class="reveal-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;margin-right:3px">
          <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
        </svg>${rc} Cafes
      </span>
      <span class="reveal-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;margin-right:3px">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        </svg>${ro} OTOP
      </span>
      <span class="reveal-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;margin-right:3px">
          <line x1="3" y1="22" x2="21" y2="22"/><line x1="10" y1="18" x2="10" y2="11"/><polygon points="12 2 20 7 4 7"/>
        </svg>${rl} Landmarks
      </span>
    `;

    renderSupportGate(district, state);

    document.getElementById('checkin-checklist').innerHTML = `
      <div class="checklist-item ${vc >= rc ? 'done' : ''}">
        <div class="check-icon ${vc >= rc ? 'done' : ''}">${vc >= rc ? checkSVG() : ''}</div>
        <span class="checklist-text">${vc}/${rc} Local Cafes visited</span>
      </div>
      <div class="checklist-item ${vo >= ro ? 'done' : ''}">
        <div class="check-icon ${vo >= ro ? 'done' : ''}">${vo >= ro ? checkSVG() : ''}</div>
        <span class="checklist-text">${vo}/${ro} OTOP / Workshop visited</span>
      </div>
      <div class="checklist-item ${vl >= rl ? 'done' : ''}">
        <div class="check-icon ${vl >= rl ? 'done' : ''}">${vl >= rl ? checkSVG() : ''}</div>
        <span class="checklist-text">${vl}/${rl} Landmarks checked</span>
      </div>
    `;

    const btn      = document.getElementById('btn-checkin');
    const alreadyCleared = !fogged;

    if (alreadyCleared) {
      btn.textContent = 'Already Explored ✓';
      btn.disabled    = true;
      btn.className   = 'btn btn-full btn-ghost';
    } else {
      btn.textContent = 'Check In & Clear Fog';
      btn.disabled    = false;
      btn.className   = 'btn btn-full btn-primary';
    }

    window.AppCore?.openSheet('checkin-sheet');
  }

  function renderSupportGate(district, state = {}) {
    const container = document.getElementById('checkin-encounter');
    if (!container) return;

    const rows = [
      { label: 'Cafe', count: state.cafes_visited || 0, required: district.required_cafes || 2 },
      { label: 'OTOP', count: state.otops_visited || 0, required: district.required_otops || 1 },
      { label: 'Landmark', count: state.landmarks_visited || 0, required: district.required_landmarks || 3 },
    ];
    const canUnlock = rows.every(row => row.count >= row.required);

    if (canUnlock) {
      container.innerHTML = `
        <button class="btn btn-primary btn-full mb-3" onclick="MapModule.openLegendaryEncounter('${escapeHtml(district.id)}')">
          ปลดล็อค Encounter
        </button>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card-outlined mb-3">
        <p style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-sm);color:var(--color-muted)">Legendary Encounter Locked</p>
        ${rows.map(row => {
          const pct = Math.min(100, Math.round((row.count / row.required) * 100));
          return `
            <div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--color-muted);margin-bottom:4px">
                <span>${row.label}</span><span>${row.count}/${row.required}</span>
              </div>
              <div class="progress-track"><div class="progress-fill orange" style="width:${pct}%"></div></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function openLegendaryEncounter(districtId, figureId = null) {
    const district = (allDistrictsCache || []).find(item => item.id === districtId);
    if (district && !canCheckIn(districtId, district)) {
      window.AppCore?.showToast('ยังไม่ครบเงื่อนไข Support Nodes');
      return;
    }

    const figure = figureId
      ? figureNodes.find(item => item.id === figureId)
      : figureNodes.find(item => item.districtId === districtId && item.class !== 'C');
    if (!figure) {
      window.AppCore?.showToast('ยังไม่มี Legendary Encounter ในย่านนี้');
      return;
    }
    if (figure.raid_only) { _startRaidEncounter(figure); return; }
    openQuizForFigure(figure.id);
  }

  async function openQuizForFigure(figureId, questionIndex = 0, questions = null) {
    const figure = figureNodes.find(item => item.id === figureId);
    if (!figure) return;

    let quizQuestions = questions;
    try {
      if (!quizQuestions) {
        const count = figure.class === 'B' ? 1 : 3;
        const data = await DB.Quiz.getForFigure(figureId, count);
        quizQuestions = Array.isArray(data) ? data : [data].filter(Boolean);
      }
    } catch { /* use fallback */ }

    if (!quizQuestions?.length) {
      window.AppCore?.showToast?.('ไม่พบคำถาม Quiz — กรุณาตรวจสอบการเชื่อมต่อ');
      return;
    }
    const question = quizQuestions[questionIndex];
    if (!question) return;

    activeQuiz = { figure, questions: quizQuestions, questionIndex, selected: null };
    renderQuizSheet();
    window.AppCore?.openSheet('quiz-sheet');
  }

  function renderQuizSheet() {
    if (!activeQuiz) return;
    const { figure, questions, questionIndex } = activeQuiz;
    const question = questions[questionIndex];
    const step = document.getElementById('quiz-step');
    const pts = document.getElementById('quiz-pts');
    const title = document.getElementById('quiz-title');
    const questionEl = document.getElementById('quiz-question');
    const options = document.getElementById('quiz-options');
    const submit = document.getElementById('btn-submit-quiz');
    if (!step || !pts || !title || !questionEl || !options || !submit) return;

    step.textContent = figure.class === 'C' ? 'C-Class Quiz' : `Master Quiz ${questionIndex + 1}/${questions.length}`;
    pts.textContent = `+${figure.legacy_pts || 0} pts`;
    title.textContent = figure.name_th;
    questionEl.textContent = question.question_th || '';
    options.innerHTML = ['A', 'B', 'C', 'D'].map(option => {
      const key = `option_${option.toLowerCase()}`;
      return `
        <button class="btn btn-ghost btn-full quiz-option" data-option="${option}" type="button">
          ${option}. ${escapeHtml(question[key] || '')}
        </button>
      `;
    }).join('');

    options.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        activeQuiz.selected = btn.dataset.option;
        options.querySelectorAll('.quiz-option').forEach(item => { item.classList.remove('btn-primary'); item.classList.add('btn-ghost'); });
        btn.classList.remove('btn-ghost');
        btn.classList.add('btn-primary');
      });
    });

    submit.disabled = false;
    submit.textContent = questionIndex + 1 < questions.length ? 'ข้อต่อไป' : 'จับบุคคลนี้';
    submit.onclick = submitQuizAnswer;
  }

  async function submitQuizAnswer() {
    if (!activeQuiz?.selected) {
      window.AppCore?.showToast('เลือกคำตอบก่อน');
      return;
    }

    const question = activeQuiz.questions[activeQuiz.questionIndex];
    const chosen  = activeQuiz.selected;
    const correct = question.correct_option;

    if (chosen !== correct) {
      const opts = document.querySelectorAll('#quiz-options .quiz-option');
      opts.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.option === correct) btn.classList.add('quiz-correct');
        if (btn.dataset.option === chosen)  btn.classList.add('quiz-wrong');
      });
      const optionsEl = document.getElementById('quiz-options');
      let feedbackEl  = document.querySelector('.quiz-feedback');
      if (!feedbackEl) {
        feedbackEl = document.createElement('p');
        feedbackEl.className = 'quiz-feedback';
        optionsEl?.after(feedbackEl);
      }
      feedbackEl.textContent = 'ตอบผิด — ลองใหม่อีกครั้ง';
      activeQuiz.selected = null;

      // Lore quiz always retries (no S/A penalty)
      const isHard = !activeQuiz.isLore && (activeQuiz.figure?.class === 'S' || activeQuiz.figure?.class === 'A');
      if (isHard) {
        setTimeout(() => { window.AppCore?.closeAllSheets(); activeQuiz = null; }, 2000);
      } else {
        setTimeout(() => {
          opts.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('quiz-correct', 'quiz-wrong');
          });
          feedbackEl.textContent = '';
        }, 1500);
      }
      return;
    }

    const user = window.AppCore?.App?.user;
    // Increment quiz challenge progress on each correct answer
    if (user) DB.Missions?.updateChallengeProgress(user.id, 'quiz').catch(() => {});

    if (activeQuiz.questionIndex + 1 < activeQuiz.questions.length) {
      openQuizForFigure(activeQuiz.figure.id, activeQuiz.questionIndex + 1, activeQuiz.questions);
      return;
    }

    // ── Lore quiz: correct answer → complete the unlock ──
    if (activeQuiz.isLore) {
      const loreId = activeQuiz.loreId;
      activeQuiz = null;
      window.AppCore?.closeAllSheets();
      await completeLoreUnlock(loreId);
      return;
    }

    const _fig = activeQuiz.figure;
    const _score = activeQuiz.questions.length;
    activeQuiz = null;
    await _completeCapture(_fig, _score);
  }

  // ── Perform check-in ────────────────────────────────
  async function performCheckIn() {
    if (!activeDistrict) return;
    const d   = activeDistrict;
    const btn = document.getElementById('btn-checkin');

    if (!isDev() && !isWithinCheckInRange(d)) {
      window.AppCore?.showToast('คุณอยู่ไกลเกินไป — เดินทางให้ใกล้กว่านี้');
      return;
    }

    btn.innerHTML = `<div class="spinner"></div>`;
    btn.disabled  = true;

    try {
      const user = window.AppCore?.App?.user;
      if (user) await DB.Districts.checkIn(user.id, d.id);
    } catch { /* offline — continue locally */ }

    userDistrictState[d.id] = { ...userDistrictState[d.id], fogged: false };

    // Rebuild the entire fog layer (removes the old polygon, adds new with extra hole)
    buildFogLayer(allDistrictsCache || []);

    // Reveal nodes in this district
    renderNodes();

    // Reveal lore markers for this newly cleared district
    renderLoreMarkers();

    // Update watchtower to visited state
    renderWatchtowers(allDistrictsCache || []);

    window.AppCore?.closeAllSheets();
    updateStatsBar();
    updateDiscoveryPercentFromDB(window.AppCore?.App?.user?.id);
    showFloatPtsOnMap(150 * getTransportMultiplier());
    const _ciUser = window.AppCore?.App?.user;
    if (_ciUser) DB.Missions?.updateChallengeProgress(_ciUser.id, 'checkin').catch(() => {});
  }

  // ── Check-in eligibility ────────────────────────────
  function canCheckIn(districtId, district) {
    const s = userDistrictState[districtId] || {};
    return (s.cafes_visited     || 0) >= (district.required_cafes     || 2) &&
           (s.otops_visited     || 0) >= (district.required_otops     || 1) &&
           (s.landmarks_visited || 0) >= (district.required_landmarks || 3);
  }

  function isWithinCheckInRange(district) {
    if (!lastKnownPosition) return false;
    if (lastKnownPosition.accuracy === 0 || lastKnownPosition.accuracy > 2000) return false;
    const lat = district.watchtower_lat || district.center_lat;
    const lng = district.watchtower_lng || district.center_lng;
    return haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, lat, lng) <= CHECKIN_TOLERANCE_M;
  }

  function isDev() {
    return ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  }

  // ── Home location ───────────────────────────────────
  function getHomeLocation() {
    try {
      const saved = localStorage.getItem(HOME_KEY);
      if (saved) return JSON.parse(saved);

      const legacy = localStorage.getItem(LEGACY_HOME_KEY);
      if (!legacy) return null;

      localStorage.setItem(HOME_KEY, legacy);
      localStorage.removeItem(LEGACY_HOME_KEY);
      return JSON.parse(legacy);
    } catch { return null; }
  }

  function showHomeLocationPicker(districts) {
    const grid   = document.getElementById('home-picker-grid');
    if (!grid) return;
    const pinSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    grid.innerHTML = districts.map(d => `
      <div class="home-district-card" onclick="MapModule.confirmHome('${d.id}')">
        <div class="home-district-icon">${pinSVG}</div>
        <p class="home-district-name-th">${d.name_th}</p>
        <p class="home-district-name-en">${d.name_en}</p>
      </div>
    `).join('');
    setTimeout(() => window.AppCore?.openSheet('home-location-sheet'), 400);
  }

  function confirmHome(districtId) {
    const district = (allDistrictsCache || []).find(d => d.id === districtId);
    if (!district) return;

    homeLocation = { id: districtId, lat: district.center_lat, lng: district.center_lng,
                     name_th: district.name_th, name_en: district.name_en };
    try {
      localStorage.setItem(HOME_KEY, JSON.stringify(homeLocation));
      localStorage.removeItem(LEGACY_HOME_KEY);
    } catch { /* ignore */ }

    window.AppCore?.closeAllSheets();
    map.flyTo([homeLocation.lat, homeLocation.lng], 13, { duration: 1 });
    addHomeMarker(homeLocation);

    userDistrictState[districtId] = { ...(userDistrictState[districtId] || {}), fogged: false };
    renderAll(allDistrictsCache || []);
    updateDiscoveryPercentFromDB(window.AppCore?.App?.user?.id);
    window.AppCore?.showFloatPts(50, window.innerWidth / 2, window.innerHeight / 2);

    // Persist home district fog clear to DB so it survives reload.
    const homeUser = window.AppCore?.App?.user;
    if (homeUser) DB.Districts.checkIn(homeUser.id, districtId).catch(() => {});
  }

  function skipHomePicker() {
    window.AppCore?.closeAllSheets();
    renderAll(allDistrictsCache || []);
  }

  function addHomeMarker(home) {
    if (markers['home']) { map.removeLayer(markers['home']); }
    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-home" title="${home.name_th || 'Home'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round"
             style="width:16px;height:16px;transform:rotate(45deg)">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
      iconSize: [38, 46], iconAnchor: [19, 46],
    });
    markers['home'] = L.marker([home.lat, home.lng], { icon }).addTo(map);
  }

  // ── Stats bar ───────────────────────────────────────
  function updateStatsBar() {
    const total    = Object.keys(userDistrictState).length;
    const explored = Object.values(userDistrictState).filter(s => !s.fogged).length;
    const pct      = total ? Math.round((explored / total) * 100) : 0;
    const el = document.getElementById('map-stat-explored');
    if (el) el.textContent = pct + '%';
  }

  async function updateDiscoveryPercentFromDB(userId) {
    if (!userId) {
      updateStatsBar();
      return;
    }
    try {
      const pct = await DB.Districts.getDiscoveryPercent(userId);
      const el = document.getElementById('map-stat-explored');
      if (el) el.textContent = pct + '%';
    } catch {
      updateStatsBar();
    }
  }

  function getTransportMultiplier() {
    if (!lastKnownPosition) return 1;
    return btsMrtStations.some(station => (
      haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, station.lat, station.lng) <= station.radius_m
    )) ? 2 : 1;
  }

  function showFloatPtsOnMap(pts) {
    const sz = map.getSize();
    window.AppCore?.showFloatPts(pts, sz.x / 2, sz.y / 2);
  }

  function checkSVG() {
    return `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="1.5,6 4.5,9.5 10.5,2.5"/>
    </svg>`;
  }

  function resize() { map?.invalidateSize(); }

  document.getElementById('btn-checkin')?.addEventListener('click', performCheckIn);

  function getLoreNodes() { return loreNodes; }
  function getUnlockedLoreIds() { return [...unlockedLoreIds]; }

  const _rallyPins = {};
  function renderRallyPin(userId, username, lat, lng) {
    if (!map) return;
    if (_rallyPins[userId]) map.removeLayer(_rallyPins[userId]);
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:var(--color-primary);color:#fff;font-size:10px;font-weight:700;
                         padding:3px 8px;border-radius:10px;white-space:nowrap;
                         box-shadow:0 2px 8px rgba(0,0,0,0.4);pointer-events:none">
               📍 ${escapeHtml(username)}</div>`,
      iconSize: [null, null], iconAnchor: [0, 16],
    });
    _rallyPins[userId] = L.marker([lat, lng], { icon, zIndexOffset: 900, interactive: false }).addTo(map);
  }

  return { init, resize, confirmHome, skipHomePicker, saveLoreUnlock, visitSupportNode, openLegendaryEncounter, openQuizForFigure, submitQuizAnswer, getLoreNodes, getUnlockedLoreIds, renderGuildFog, renderRallyPin, getLastKnownPosition: () => lastKnownPosition };
})();

window.MapModule = MapModule;
