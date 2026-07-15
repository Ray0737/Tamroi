// ── Map Module ────────────────────────────────────────
const MapModule = (() => {
  let map = null;
  let guildFogLayer = null;    // truthy flag: guild fog currently rendered
  let markers = {};
  let activeDistrict = null;
  let _locationMarker = null;    // real-time GPS dot
  let _locationWatcher = null;    // watchPosition handle
  let _posHistory = [];      // recent positions for speed/teleport detection
  let allDistrictsCache = null;
  let homeLocation = null;
  let lastKnownPosition = null;
  let loreNodes = [];
  let activeLoreNode = null;
  let activeQuiz = null;
  const unlockedLoreIds = new Set();
  const pendingLoreIds = new Set();
  const completedLoreChains = new Set();
  const visitedSupportNodeIds = new Set();
  // v3: replaced the rectangular grid-cell walk reveal with circle-per-point holes
  // (same ring-hole technique already used for districts) · smooth trail, not squares.
  const _WALK_KEY = 'tam_roi_walk_trail_v4'; // bumped: v3 data was recorded under a spacing rule looser than the reveal radius, producing overlapping/jagged holes
  let _walkStoreKey = _WALK_KEY; // per-user suffix set in _initWalkGrid · a shared browser must not sync one account's cached trail into another account's DB rows
  const WALK_REVEAL_RADIUS_M = 30;
  // Must be >= WALK_REVEAL_RADIUS_M · spacing smaller than the reveal circle guarantees
  // heavy overlap between adjacent circles even walking in a straight line.
  const WALK_MIN_SPACING_M = 30;
  let _walkedPoints = []; // [{lat, lng}, ...]

  // Watchtower check-in reveal radius · sized to roughly one school/campus premises
  // (e.g. Satit PSM/SWU), not a multi-block area. Used both for the permanent fog hole
  // (buildFogLayer) and the growing-reveal animation (playFogClearSweep), so the sweep's
  // final frame and the persisted state are the exact same shape.
  const WATCHTOWER_REVEAL_RADIUS_M = 180;
  const HOME_KEY = 'tam_roi_home';
  const LEGACY_HOME_KEY = 'siam' + 'echo_home';
  const CHECKIN_TOLERANCE_M = 500;

  // ── Bounding box for the fog overlay ────────────────
  // Covers Bangkok, Nonthaburi AND Ayutthaya province
  const FOG_OUTER = [
    [0, 90], [0, 115], [25, 115], [25, 90],
  ];
  const FOG_OUTER_LL = FOG_OUTER.map(([lat, lng]) => [lng, lat]);

  // ── Districts · loaded from Supabase districts table ──
  // (allDistrictsCache holds the live data after loadDistrictData runs)

  // ── Nodes · loaded from Supabase support_nodes table ──
  let supportNodes = [];

  // ── Watchtowers · loaded from Supabase watchtowers table ──
  // Districts with zero rows here fall back to their own watchtower_lat/watchtower_lng
  // (legacy single-watchtower behavior).
  let allWatchtowersCache = [];
  const visitedWatchtowerIds = new Set();

  // ── Figure nodes · loaded from Supabase figures table ─
  let figureNodes = [];
  const capturedFigureIds = new Set();
  const jigsawUnlockedFigureIds = new Set(); // figures unlocked via a completed Jigsaw mission, bypasses the support-node gate
  const _figureCircleFeatures = {};  // figure.id -> GeoJSON circle Feature (80m proximity)
  const _loreRingFeatures = {};  // node.id   -> GeoJSON circle Feature (50m proximity)


  // ── Lore nodes · loaded from Supabase lore_nodes table ─

  // ── User state ─────────────────────────────────────
  // Default all districts to fogged+zero · DB state loaded at boot overrides these
  const _blank = () => ({ fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 });
  let userDistrictState = {
    rattanakosin: _blank(),
    dusit: _blank(),
    pathumwan: _blank(),
    silom: _blank(),
    sukhumvit: _blank(),
    watthana: _blank(),
    chatuchak: _blank(),
    ladphrao: _blank(),
    bang_kapi: _blank(),
    phra_khanong: _blank(),
    bang_na: _blank(),
    nonthaburi: _blank(),
    ayutthaya: _blank(),
    satit_test: _blank(),
    rangsit: _blank(),
  };

  // ── SVG icon helpers ────────────────────────────────
  const _SVG = {
    coffee: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    shop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
    temple: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="13"/><line x1="10" y1="18" x2="10" y2="13"/><line x1="14" y1="18" x2="14" y2="13"/><line x1="18" y1="18" x2="18" y2="13"/><polygon points="12 3 20 8 4 8"/></svg>`,
  };

  const NODE_CFG = {
    cafe: { label: 'ร้านกาแฟ', color: '#7BC67E', bg: 'rgba(123,198,126,0.18)', svg: _SVG.coffee },
    otop: { label: 'OTOP / ร้านค้า', color: '#fff', bg: 'rgba(126,184,232,0.18)', svg: _SVG.shop },
    landmark: { label: 'สถานที่สำคัญ', color: '#fff', bg: 'rgba(242,184,75,0.18)', svg: _SVG.temple },
  };

  // ── MapLibre helpers ─────────────────────────────────
  // Internal state stays {lat,lng}; flip to [lng,lat] only at the MapLibre API boundary.
  function _emptyFC() { return { type: 'FeatureCollection', features: [] }; }

  function _addMarker(lat, lng, html, opts = {}) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const el = wrap.firstElementChild;
    if (opts.interactive === false) el.style.pointerEvents = 'none';
    if (opts.zIndex) el.style.zIndex = String(opts.zIndex);
    return new maplibregl.Marker({
      element: el,
      anchor: 'top-left',
      offset: [-(opts.anchorX || 0), -(opts.anchorY || 0)],
      // MapLibre default is pitchAlignment:'map', which skews/foreshortens the icon with
      // the tilted ground plane · reads as the pin "moving" as camera pitch/pan changes.
      // 'viewport' billboards it: always upright, facing camera, fixed to its lng/lat only.
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
    }).setLngLat([lng, lat]).addTo(map);
  }

  // Great-circle destination-point formula, sampled around a full bearing sweep ·
  // gives a geodesic circle polygon since MapLibre has no native circle primitive.
  function _circleRing(lat, lng, radiusM, steps = 48) {
    const distRad = radiusM / 6371000;
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const ring = [];
    for (let i = 0; i <= steps; i++) {
      const brng = (i / steps) * 2 * Math.PI;
      const lat2 = Math.asin(Math.sin(latRad) * Math.cos(distRad) + Math.cos(latRad) * Math.sin(distRad) * Math.cos(brng));
      const lng2 = lngRad + Math.atan2(
        Math.sin(brng) * Math.sin(distRad) * Math.cos(latRad),
        Math.cos(distRad) - Math.sin(latRad) * Math.sin(lat2)
      );
      ring.push([lng2 * 180 / Math.PI, lat2 * 180 / Math.PI]);
    }
    return ring;
  }

  function _circleFeature(lat, lng, radiusM) {
    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [_circleRing(lat, lng, radiusM)] } };
  }

  function _syncFigureCircleSource() {
    map?.getSource('figure-proximity-source')?.setData({ type: 'FeatureCollection', features: Object.values(_figureCircleFeatures) });
  }

  function _syncLoreRingSource() {
    map?.getSource('lore-ring-source')?.setData({ type: 'FeatureCollection', features: Object.values(_loreRingFeatures) });
  }

  // Fog polygons use ring winding (not evenodd) to mark holes · normalize direction
  // so exterior/holes are unambiguous regardless of how the source data was wound.
  function _signedArea(ring) {
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
      sum += x1 * y2 - x2 * y1;
    }
    return sum / 2;
  }

  function _ringWithWinding(ring, wantCCW) {
    const closed = (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1])
      ? ring.slice()
      : [...ring, ring[0]];
    const isCCW = _signedArea(closed) > 0;
    return isCCW === wantCCW ? closed : closed.slice().reverse();
  }

  function _initOverlaySources() {
    // Order = paint order (bottom -> top): grid, fog, guild fog, proximity rings.
    map.addSource('grid-source', { type: 'geojson', data: _emptyFC() });
    map.addLayer({
      id: 'grid-layer', type: 'line', source: 'grid-source',
      paint: { 'line-color': 'rgba(255,255,255,0.15)', 'line-width': 1 }
    });

    map.addSource('fog-source', { type: 'geojson', data: _emptyFC() });
    map.addLayer({
      id: 'fog-layer', type: 'fill', source: 'fog-source',
      paint: { 'fill-color': '#08070f', 'fill-opacity': 0.88 }
    });

    // Fog-clear sweep: buildFogLayer() swaps the fog polygon's shape instantly (geometry
    // changes can't tween), so this is a separate real MapLibre fill layer shaped like the
    // just-revealed district, faded out via a native paint-property transition. Being a real
    // 3D layer (not a CSS/DOM overlay) it tilts with the map's pitch exactly like fog-layer does.
    map.addSource('fog-clear-fx-source', { type: 'geojson', data: _emptyFC() });
    map.addLayer({
      id: 'fog-clear-fx-layer', type: 'fill', source: 'fog-clear-fx-source',
      paint: { 'fill-color': '#08070f', 'fill-opacity': 0, 'fill-opacity-transition': { duration: 800 } }
    });

    map.addSource('guild-fog-source', { type: 'geojson', data: _emptyFC() });
    map.addLayer({
      id: 'guild-fog-fill', type: 'fill', source: 'guild-fog-source',
      paint: { 'fill-color': '#7BC67E', 'fill-opacity': 0.22 }
    });
    map.addLayer({
      id: 'guild-fog-line', type: 'line', source: 'guild-fog-source',
      paint: { 'line-color': '#7BC67E', 'line-width': 1, 'line-opacity': 0.35 }
    });

    map.addSource('figure-proximity-source', { type: 'geojson', data: _emptyFC() });
    map.addLayer({
      id: 'figure-proximity-fill', type: 'fill', source: 'figure-proximity-source',
      paint: { 'fill-color': '#EAE7E1', 'fill-opacity': 0.12 }
    });
    map.addLayer({
      id: 'figure-proximity-line', type: 'line', source: 'figure-proximity-source',
      paint: { 'line-color': '#EAE7E1', 'line-width': 2 }
    });

    map.addSource('lore-ring-source', { type: 'geojson', data: _emptyFC() });
    map.addLayer({
      id: 'lore-ring-fill', type: 'fill', source: 'lore-ring-source',
      paint: { 'fill-color': '#8986A8', 'fill-opacity': 0.05 }
    });
    map.addLayer({
      id: 'lore-ring-line', type: 'line', source: 'lore-ring-source',
      paint: { 'line-color': '#8986A8', 'line-width': 1, 'line-dasharray': [4, 4] }
    });
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    const container = document.getElementById('map-view');
    if (!container || map) return;

    // Keep the illustrated paper map visible while remote raster tiles are loading.
    // MapLibre paints an opaque canvas immediately, so without this state a slow or
    // offline tile request turns the useful CSS fallback into a blank black panel.
    container.classList.add('map-texture-fallback');

    map = new maplibregl.Map({
      container: 'map-view',
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          // Vector building footprints + water (OpenFreeMap, no API key) · used only for
          // fill-extrusion depth and river color; ground/roads/labels still come from the carto raster above.
          ofm: {
            type: 'vector',
            url: 'https://tiles.openfreemap.org/planet',
            generateId: true, // assigns a numeric feature id per building, used to pick a retro color bucket below
          },
        },
        layers: [
          { id: 'carto-layer', type: 'raster', source: 'carto' },
          {
            id: 'water-fill',
            type: 'fill',
            source: 'ofm',
            'source-layer': 'water',
            paint: { 'fill-color': '#2869c8', 'fill-opacity': 0.85 },
          },
          {
            id: 'waterway-line',
            type: 'line',
            source: 'ofm',
            'source-layer': 'waterway',
            paint: { 'line-color': '#2869c8', 'line-width': 2.5 },
          },
          {
            id: '3d-buildings',
            type: 'fill-extrusion',
            source: 'ofm',
            'source-layer': 'building',
            minzoom: 15,
            paint: {
              // Street Quest palette bucketed by feature id · looks random per building, stable
              // on re-render. Warm paper/tan family weighted higher, orange for pop.
              'fill-extrusion-color': [
                'match', ['%', ['id'], 6],
                0, '#f4ead0', // paper light
                1, '#2b2824', // warm ink
                2, '#d9cda9', // kraft tan
                3, '#f05a19', // orange pop
                4, '#c9c1ab', // muted paper
                '#201d16',    // ink (fallback bucket)
              ],
              'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.85,
            },
          },
        ],
      },
      center: [100.502, 13.756],
      zoom: 12,
      minZoom: 10,
      maxBounds: [[97.3, 5.5], [105.7, 20.5]],
      pitch: 60,
      bearing: 0,
      attributionControl: false,
    });

    // Full 360 camera rotation enabled (right-drag / two-finger twist), plus the tilt ·
    // no NavigationControl (zoom +/-, compass) added here; the app has its own
    // fab-locate/fab-tilt buttons for the equivalent actions instead.

    map.on('load', () => {
      _initOverlaySources();
      renderThailandGrid();

      loadDistrictData();
      loadLoreData();
      updateStatsBar();

      // Start GPS tracking
      startLocationTracking();
      _initWalkGrid();
    });

    map.on('sourcedata', event => {
      if (event.sourceId === 'carto' && event.isSourceLoaded) {
        container.classList.remove('map-texture-fallback');
      }
    });

    document.getElementById('btn-locate-me').addEventListener('click', () => {
      if (!lastKnownPosition) { window.AppCore?.showToast('กำลังรอสัญญาณ GPS...'); return; }
      map.flyTo({ center: [lastKnownPosition.lng, lastKnownPosition.lat], zoom: 13, duration: 800 });
    });

    // Top-down <-> tilted camera toggle
    let _isTopDown = false;
    document.getElementById('btn-toggle-tilt').addEventListener('click', (e) => {
      _isTopDown = !_isTopDown;
      map.easeTo({ pitch: _isTopDown ? 0 : 60, duration: 500 });
      e.currentTarget.classList.toggle('fab-tilt--active', _isTopDown);
    });
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
      const dt = (now - prev.ts) / 1000; // seconds
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
        // ponytail: 100m cap · walk cells are ~1.1km wide, so ≥100m accuracy still lands in the right cell most of the time; tighter than this kills indoor dev GPS
        if (accuracy <= 100) _revealWalkCell(latitude, longitude);
      },
      err => console.warn('[GPS]', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  async function _initWalkGrid() {
    // localStorage first (instant paint + offline fallback), then the DB copy
    // becomes the source of truth · local points missing from the DB (recorded
    // offline, or pre-dating patch_walk_trail) are synced up on boot.
    const user = window.AppCore?.App?.user;
    if (user) {
      _walkStoreKey = `${_WALK_KEY}:${user.id}`;
      // one-time migration of the old account-agnostic key · first account to boot claims it
      const legacy = localStorage.getItem(_WALK_KEY);
      if (legacy) {
        if (!localStorage.getItem(_walkStoreKey)) localStorage.setItem(_walkStoreKey, legacy);
        localStorage.removeItem(_WALK_KEY);
      }
    }
    let local = [];
    try { local = JSON.parse(localStorage.getItem(_walkStoreKey) || '[]'); } catch { }
    _walkedPoints = local;

    if (!user || !DB.WalkTrail) return;
    try {
      const dbPoints = await DB.WalkTrail.getPoints(user.id);
      const inDb = new Set(dbPoints.map(p => `${p.lat},${p.lng}`));
      // filter _walkedPoints (not `local`) so GPS points revealed while the
      // fetch was in flight survive the replacement below
      const missing = _walkedPoints.filter(p => !inDb.has(`${p.lat},${p.lng}`));
      if (missing.length) DB.WalkTrail.addPoints(user.id, missing).catch(() => { });
      _walkedPoints = dbPoints.concat(missing);
      if (allDistrictsCache) buildFogLayer(allDistrictsCache);
    } catch { /* offline · keep the localStorage copy */ }
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
    // Check against every kept point, not just the last one · a "last point only" check
    // lets jittery/backtracking GPS (common on desktop or weak signal) re-stamp a fresh
    // overlapping circle near a spot already covered, which is what produced the jagged
    // scribble: MapLibre can't cleanly tessellate a polygon whose holes cross each other.
    const tooClose = _walkedPoints.some(p => haversineDistance(p.lat, p.lng, lat, lng) < WALK_MIN_SPACING_M);
    if (tooClose) return;
    _walkedPoints.push({ lat, lng });
    try { localStorage.setItem(_walkStoreKey, JSON.stringify(_walkedPoints)); } catch { }
    const user = window.AppCore?.App?.user;
    if (user) DB.WalkTrail?.addPoints(user.id, [{ lat, lng }]).catch(() => { }); // fire-and-forget · localStorage line above is the offline net, _initWalkGrid re-syncs it
    if (allDistrictsCache) buildFogLayer(allDistrictsCache);
  }

  function updateLocationDot(lat, lng, accuracy) {
    if (_locationMarker) { _locationMarker.remove(); _locationMarker = null; }

    // Dot marker with pulsing CSS animation
    _locationMarker = _addMarker(lat, lng, `<div class="marker-location-dot"></div>`, {
      anchorX: 9, anchorY: 9, interactive: false, zIndex: 1000,
    });
  }

  async function loadDistrictData() {
    let districts = [];
    try {
      const data = await DB.Districts.getAll();
      if (data?.length) districts = data;

      const user = window.AppCore?.App?.user;
      const baseLoaders = [loadWatchtowers(), loadSupportNodes(), loadFigureNodes()];
      if (user) {
        const [stateData, capsData, visitedWtIds, jigsawIds] = await Promise.all([
          DB.Districts.getUserState(user.id),
          DB.Figures.getUserCaptures(user.id),
          DB.Watchtowers?.getUserVisitedIds(user.id) ?? Promise.resolve([]),
          DB.Coop?.getJigsawEncounterUnlocks(user.id) ?? Promise.resolve([]),
          loadVisitedSupportNodes(user.id),
          ...baseLoaders,
        ]);
        (capsData || []).forEach(c => capturedFigureIds.add(c.figure_id));
        (visitedWtIds || []).forEach(id => visitedWatchtowerIds.add(id));
        (jigsawIds || []).forEach(id => jigsawUnlockedFigureIds.add(id));
        stateData.forEach(s => {
          userDistrictState[s.district_id] = s;
        });
        syncDiscoveryPercent(user.id);
        _subscribeUserDistrictsWithReconnect(user.id);
      } else {
        await Promise.all(baseLoaders);
      }
    } catch { /* use mock data */ }

    allDistrictsCache = districts;
    homeLocation = getHomeLocation();

    if (!homeLocation) {
      showHomeLocationPicker(districts);
    } else {
      map.jumpTo({ center: [homeLocation.lng, homeLocation.lat], zoom: 13 });
      addHomeMarker(homeLocation);
      renderAll(districts);
    }
  }

  async function loadWatchtowers() {
    try {
      const data = await DB.Watchtowers?.getAll();
      if (data?.length) allWatchtowersCache = data;
    } catch { /* allWatchtowersCache stays empty · every district falls back to legacy single-watchtower */ }
  }

  async function loadSupportNodes() {
    try {
      const data = await DB.SupportNodes.getAll();
      if (data?.length) {
        // normalise district_id → districtId so existing render code works unchanged
        supportNodes = data.map(n => ({ ...n, districtId: n.district_id }));
      }
    } catch { /* supportNodes stays empty · nodes just won't render */ }
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
      if (distance <= (node.radius_m || 50)) unlockLore(node);
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

    if (!isDev() && (!lastKnownPosition || haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, node.lat, node.lng) > (node.radius_m || 50))) {
      window.AppCore?.showToast('คุณอยู่ไกลเกินไป · เดินทางให้ใกล้กว่านี้');
      return;
    }

    // Quiz-before-save used to gate here on a district-level quiz_questions row,
    // routing into a separate quiz-sheet. Superseded by app.js's own pre/post
    // retrieval-practice flow (quiz_questions.lore_id + assessment_type), which
    // runs around this same save from openLoreSheet · keeping both caused saves
    // to silently divert into the old sheet and never actually persist.
    await completeLoreUnlock(node);
  }

  async function completeLoreUnlock(nodeOrId) {
    const node = typeof nodeOrId === 'string'
      ? (loreNodes.find(item => item.id === nodeOrId) || activeLoreNode)
      : nodeOrId;
    if (!node) return;

    const btn = document.getElementById('btn-save-lore');
    if (btn) { btn.disabled = true; btn.innerHTML = `<div class="spinner"></div>`; }

    const user = window.AppCore?.App?.user;
    if (user) {
      try {
        await DB.Lore.unlock(user.id, node.id);
        await DB.Profiles.addLegacyPoints(user.id, node.lore_pts || 0);
      } catch (e) {
        console.error('[lore unlock] DB write failed:', e);
        if (navigator.onLine) {
          window.AppCore?.showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
          if (btn) { btn.disabled = false; btn.innerHTML = 'อ่านแล้ว บันทึก →'; }
          return;
        }
      }
    }

    unlockedLoreIds.add(node.id);
    pendingLoreIds.delete(node.id);
    renderLoreMarkers();
    window.AppCore?.closeAllSheets();
    showFloatPtsOnMap(node.lore_pts || 0);
    if (user) DB.Missions?.updateChallengeProgress(user.id, 'lore').catch(() => { });
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

    const chainFigure = chainNodes[0].figure_id
      ? (figureNodes.find(f => f.id === chainNodes[0].figure_id) || null)
      : null;
    window.AppCore?.openLoreChainSheet({
      title: `${chainNodes[0].name_th || 'Lore Chain'} Complete`,
      content: chainNodes.map(item => item.content_th || item.content_en || '').join('\n\n'),
      figure: chainFigure,
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

  // ── Fog clear sweep: growing radial reveal (Civ6/RTS fog-of-war pattern,
  //    same visual family as Far Cry/AC tower-sync reveals) ──
  // The real fog hole is already cut instantly by buildFogLayer() underneath. This layer
  // ── Real-time fog sync, with reconnect ──────────────
  // The postgres_changes subscription existed but had no status handling: Supabase Realtime
  // websockets drop on tab backgrounding / network blips, and with no reconnect logic the
  // subscription silently goes stale · another device's check-in stops arriving until a
  // full page reload. Track the channel and re-subscribe with backoff on CHANNEL_ERROR/
  // TIMED_OUT/CLOSED instead of leaving it dead.
  let _userDistrictsChannel = null;
  let _userDistrictsRetryDelay = 2000;
  function _subscribeUserDistrictsWithReconnect(userId) {
    if (_userDistrictsChannel) DB.removeChannel(_userDistrictsChannel);
    _userDistrictsChannel = DB.Districts.subscribeUserDistricts(
      userId,
      payload => {
        const row = payload.new;
        if (row && !row.fogged) {
          userDistrictState[row.district_id] = { ...(userDistrictState[row.district_id] || {}), ...row };
          buildFogLayer(allDistrictsCache || []);
        }
      },
      (status) => {
        if (status === 'SUBSCRIBED') {
          _userDistrictsRetryDelay = 2000; // reset backoff once healthy
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setTimeout(() => _subscribeUserDistrictsWithReconnect(userId), _userDistrictsRetryDelay);
          _userDistrictsRetryDelay = Math.min(_userDistrictsRetryDelay * 2, 30000); // cap at 30s
        }
      }
    );
  }

  // covers the same district with a fog-colored donut whose hole (a circle centered on the
  // watchtower) grows from 0 to full district radius, so the reveal reads as fog peeling
  // back from the check-in point outward, instead of an instant pop. Real MapLibre fill
  // layer (not CSS/canvas), so it tilts/rotates with the camera exactly like fog-layer does.
  // Bumped by every playFogClearSweep call so an older, still-running sweep can tell it's
  // been superseded and stop · without this, checking in at a second watchtower before the
  // first one's 1.4s animation finishes leaves two independent frame() loops both writing
  // to the same fog-clear-fx-source every frame, which looks like two overlapping circles
  // fighting each other (and can leave a stuck ghost shape if one loop "wins" mid-shrink).
  let _sweepGeneration = 0;

  function playFogClearSweep(centerLat, centerLng, maxRadiusM = WATCHTOWER_REVEAL_RADIUS_M) {
    const src = map?.getSource('fog-clear-fx-source');
    if (!src || centerLat == null || centerLng == null) return;

    const myGeneration = ++_sweepGeneration;

    // Exterior is a fixed circle at the final reveal radius (matching buildFogLayer's real
    // hole exactly) · NOT the district's polygon_coords placeholder rectangle. The donut
    // (exterior minus a growing inner hole) starts as a full solid circle covering the area
    // and shrinks to nothing, so it lines up seamlessly with the real circular hole underneath.
    const exterior = _ringWithWinding(_circleRing(centerLat, centerLng, maxRadiusM), true); // CCW

    const DURATION = 1400;
    const startZoom = map.getZoom();
    map.easeTo({ zoom: startZoom - 0.6, duration: 400 }); // brief pull-back, "establishing shot"

    const start = performance.now();
    function frame(now) {
      if (myGeneration !== _sweepGeneration) return; // a newer sweep took over · stop quietly
      try {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic: fast start, slow settle
        const r = Math.max(20, eased * maxRadiusM);
        const hole = _ringWithWinding(_circleRing(centerLat, centerLng, r), false); // CW hole
        src.setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [exterior, hole] } });
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          src.setData(_emptyFC());
          map.easeTo({ zoom: startZoom, duration: 600 });
        }
      } catch (err) {
        // A thrown error mid-loop would otherwise silently kill the RAF chain and leave
        // whatever partial donut shape was last drawn stuck on screen forever.
        console.warn('[fog sweep] aborted:', err);
        src.setData(_emptyFC());
      }
    }
    map.setPaintProperty('fog-clear-fx-layer', 'fill-opacity', 0.88);
    requestAnimationFrame(frame);
  }

  // A fixed 180m circle can leave a district's own support nodes sitting outside the
  // revealed area · invisible (per _isRevealedAt) with no way to know they're there to
  // walk toward. Grows the single-watchtower reveal radius just enough to cover every
  // support node that belongs to this district, never shrinking below the base radius.
  function _watchtowerRevealRadius(districtId, centerLat, centerLng) {
    if (centerLat == null || centerLng == null) return WATCHTOWER_REVEAL_RADIUS_M;
    let maxDist = WATCHTOWER_REVEAL_RADIUS_M;
    supportNodes.forEach(n => {
      if (n.districtId !== districtId || n.lat == null || n.lng == null) return;
      const d = haversineDistance(centerLat, centerLng, n.lat, n.lng) + 40; // padding so the node isn't right on the fog edge
      if (d > maxDist) maxDist = d;
    });
    return maxDist;
  }

  // ── Fog: single inverted polygon ───────────────────
  // One polygon covers all Bangkok; holes are cut for each explored district.
  // Ring winding (exterior CCW, holes CW) marks holes · no evenodd fill rule in MapLibre.
  function buildFogLayer(districts) {
    // Cleared districts reveal as a circle around the watchtower, not the raw district
    // polygon · polygon_coords is a known-approximate placeholder shape (rough rectangle,
    // not a real administrative boundary), so using it made every check-in reveal a square.
    // A circle at WATCHTOWER_REVEAL_RADIUS_M matches the "~1km2 around the checkpoint" area
    // the game already describes, and matches playFogClearSweep's animation radius exactly
    // so the sweep doesn't visually snap to a different final shape when it hands off here.
    //
    // Multi-watchtower districts (allWatchtowersCache has rows for this district_id):
    // fully-cleared reveals the district polygon (one contiguous hole, no gaps between circles);
    // not-yet-complete reveals only the circles of the watchtowers this user has visited so far.
    const clearedPolys = [];
    districts.forEach(d => {
      const districtWatchtowers = allWatchtowersCache.filter(w => w.district_id === d.id);
      const fullyCleared = !(userDistrictState[d.id]?.fogged ?? true);

      if (districtWatchtowers.length === 0) {
        if (!fullyCleared) return;
        const lat = d.watchtower_lat ?? d.center_lat;
        const lng = d.watchtower_lng ?? d.center_lng;
        if (lat != null && lng != null) {
          clearedPolys.push(_circleRing(lat, lng, _watchtowerRevealRadius(d.id, lat, lng)));
        }
        return;
      }

      // All watchtowers visited → reveal full district polygon so the cleared area
      // looks contiguous, not two separate circles with fog between them.
      if (fullyCleared) {
        const raw = d.polygon_coords;
        const coords = (typeof raw === 'string' ? JSON.parse(raw) : raw) || [];
        if (coords.length) {
          clearedPolys.push(coords.map(c => [c[1], c[0]])); // [lat,lng] → [lng,lat]
          return;
        }
        // No polygon_coords → fall back to all watchtower circles
        districtWatchtowers.forEach(w => clearedPolys.push(_circleRing(w.lat, w.lng, WATCHTOWER_REVEAL_RADIUS_M)));
        return;
      }
      districtWatchtowers.filter(w => visitedWatchtowerIds.has(w.id))
        .forEach(w => clearedPolys.push(_circleRing(w.lat, w.lng, WATCHTOWER_REVEAL_RADIUS_M)));
    });

    // Walk-trail holes: a small circle per walked point (smooth trail, not grid squares).
    // bbox pre-filter just skips points already inside a revealed shape to keep the
    // union below cheap · it's a performance trim, not a correctness requirement.
    const clearedBboxes = clearedPolys.map(poly => {
      let s = Infinity, n = -Infinity, w = Infinity, e = -Infinity;
      poly.forEach(([lng, lat]) => { s = Math.min(s, lat); n = Math.max(n, lat); w = Math.min(w, lng); e = Math.max(e, lng); });
      return { s, n, w, e };
    });
    _walkedPoints
      .filter(({ lat, lng }) => !clearedBboxes.some(b => lat > b.s && lat < b.n && lng > b.w && lng < b.e))
      .forEach(({ lat, lng }) => clearedPolys.push(_circleRing(lat, lng, WALK_REVEAL_RADIUS_M)));

    // Merge every cleared shape (watchtower/district circles + walk-trail circles) into
    // one set of simple, non-crossing hole rings. The old approach bridged overlapping
    // circles with a fixed-width strip sized to the smaller radius, which cut inside the
    // larger circle and crossed back out through its boundary · self-intersecting hole
    // rings, which MapLibre's tessellator rendered as a jagged black wedge. A real
    // polygon union can't produce that: overlapping, touching, or contained shapes always
    // merge into one clean simple boundary, regardless of how many shapes overlap at once
    // (the strip approach only ever handled two circles at a time).
    const merged = clearedPolys.length
      ? window.polygonClipping.union(...clearedPolys.map(ring => [ring])).map(poly => poly[0])
      : [];

    const outer = _ringWithWinding(FOG_OUTER_LL, true);
    const holes = merged.map(ring => _ringWithWinding(ring, false));

    map?.getSource('fog-source')?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [outer, ...holes] },
    });
  }

  function renderThailandGrid() {
    if (!window.FogGrid) return;
    const src = map?.getSource('grid-source');
    if (!src) return;
    const features = window.FogGrid.createGridCells().map(cell => {
      const ring = cell.bounds.map(([lat, lng]) => [lng, lat]);
      ring.push(ring[0]);
      return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ring } };
    });
    src.setData({ type: 'FeatureCollection', features });
  }

  function renderGuildFog(clearedDistrictIds) {
    const src = map?.getSource('guild-fog-source');
    if (!src) return;
    guildFogLayer = clearedDistrictIds?.length ? true : null;
    if (!clearedDistrictIds?.length || !allDistrictsCache) {
      src.setData(_emptyFC());
      return;
    }
    const userCleared = new Set(
      Object.keys(userDistrictState).filter(id => !userDistrictState[id].fogged)
    );
    const features = allDistrictsCache
      .filter(d => clearedDistrictIds.includes(d.id) && !userCleared.has(d.id))
      .map(d => {
        const raw = d.polygon_coords;
        const coords = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
        if (!coords.length) return null;
        const ring = coords.map(c => [c[1], c[0]]);
        ring.push(ring[0]);
        return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
      })
      .filter(Boolean);
    src.setData({ type: 'FeatureCollection', features });
  }

  // ── Watchtower markers ─────────────────────────────
  function watchtowerIconHtml(visited, title) {
    return `<div class="marker-watchtower ${visited ? 'visited' : ''}" title="${title}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px">
        <rect x="4" y="2" width="16" height="4" rx="1"/>
        <line x1="6" y1="6" x2="6" y2="22"/><line x1="18" y1="6" x2="18" y2="22"/>
        <line x1="12" y1="6" x2="12" y2="22"/><line x1="4" y1="22" x2="20" y2="22"/>
        <line x1="6" y1="12" x2="18" y2="12"/>
      </svg>
    </div>`;
  }

  function renderWatchtowers(districts) {
    // Clear every previous watchtower marker (both legacy per-district and multi
    // per-watchtower keys) before re-adding, same cleanup pattern as renderNodes.
    Object.keys(markers).forEach(k => {
      if (k.startsWith('wt-')) { markers[k].remove(); delete markers[k]; }
    });

    districts.forEach(d => {
      const districtWatchtowers = allWatchtowersCache.filter(w => w.district_id === d.id);

      if (districtWatchtowers.length === 0) {
        // Legacy single-watchtower district · unchanged behavior.
        const fogged = userDistrictState[d.id]?.fogged ?? true;
        const wt = _addMarker(d.center_lat, d.center_lng, watchtowerIconHtml(!fogged, d.name_th),
          { anchorX: 16, anchorY: 38 });
        wt.getElement().addEventListener('click', () => showCheckInSheet({
          ...d, checkinLat: d.center_lat, checkinLng: d.center_lng, watchtowerId: null,
        }));
        markers[`wt-${d.id}`] = wt;
        return;
      }

      // Multi-watchtower district · one marker per watchtower, each tracked individually.
      // District-level "fogged" only flips once every watchtower here has been visited
      // (handled server-side by the completion trigger); each marker's own visited state
      // is purely "did THIS user check in at THIS point".
      districtWatchtowers.forEach(w => {
        const visited = visitedWatchtowerIds.has(w.id);
        const title = w.name_th || d.name_th;
        const wt = _addMarker(w.lat, w.lng, watchtowerIconHtml(visited, title), { anchorX: 16, anchorY: 38 });
        wt.getElement().addEventListener('click', () => showCheckInSheet({
          ...d, name_th: title, checkinLat: w.lat, checkinLng: w.lng, watchtowerId: w.id,
        }));
        markers[`wt-${w.id}`] = wt;
      });
    });
  }

  // A district's `fogged` flag alone isn't enough to gate node/lore markers: for a
  // multi-watchtower district, fogged=false already means every watchtower was visited
  // (the completion trigger sets it), so the whole polygon is revealed and anything in
  // the district should show. But a legacy single-watchtower district's check-in only
  // ever punches a small WATCHTOWER_REVEAL_RADIUS_M circle · fogged flips false on the
  // FIRST check-in while most of the district is still fogged, so without this distance
  // check, nodes/lore across the whole district would appear floating outside the fog
  // that's actually been cleared.
  function _isRevealedAt(districtId, lat, lng) {
    const state = userDistrictState[districtId];
    if (!state || state.fogged !== false) return false;

    const districtWatchtowers = allWatchtowersCache.filter(w => w.district_id === districtId);
    if (districtWatchtowers.length) {
      // Mirror buildFogLayer's own fully-cleared shape exactly (polygon_coords, or a
      // fallback union of watchtower circles) instead of trusting fogged=false blindly ·
      // polygon_coords is a known-approximate rough rectangle, so a node near a district's
      // edge can sit outside it even though every watchtower here has been visited.
      if (lat == null || lng == null) return false;
      const d = (allDistrictsCache || []).find(dd => dd.id === districtId);
      const raw = d?.polygon_coords;
      const coords = (typeof raw === 'string' ? JSON.parse(raw) : raw) || [];
      if (coords.length) return _pointInPoly(lat, lng, coords);
      return districtWatchtowers.some(w => haversineDistance(lat, lng, w.lat, w.lng) <= WATCHTOWER_REVEAL_RADIUS_M);
    }

    const d = (allDistrictsCache || []).find(dd => dd.id === districtId);
    const wtLat = d?.watchtower_lat ?? d?.center_lat;
    const wtLng = d?.watchtower_lng ?? d?.center_lng;
    if (wtLat == null || wtLng == null || lat == null || lng == null) return false;
    return haversineDistance(lat, lng, wtLat, wtLng) <= _watchtowerRevealRadius(districtId, wtLat, wtLng);
  }

  // ── Node markers ────────────────────────────────────
  function renderNodes() {
    // Clear existing node markers
    Object.keys(markers).forEach(k => {
      if (k.startsWith('node-')) { markers[k].remove(); delete markers[k]; }
    });

    supportNodes.forEach((node, i) => {
      if (!_isRevealedAt(node.districtId, node.lat, node.lng)) return;

      const cfg = NODE_CFG[node.type] || NODE_CFG.landmark;
      const html = `<div class="marker-node marker-${node.type}" style="color:${cfg.color}">${cfg.svg}</div>`;

      const nodeMarker = _addMarker(node.lat, node.lng, html, { anchorX: 11, anchorY: 11 });
      // Use custom card instead of a map popup · avoids z-index conflict with bottom-nav
      nodeMarker.getElement().addEventListener('click', () => showNodeInfoCard(node));
      markers[`node-${i}`] = nodeMarker;
    });
  }

  function renderFigureNodes() {
    Object.keys(markers).forEach(k => {
      if (k.startsWith('figure-')) { markers[k].remove(); delete markers[k]; }
    });
    Object.keys(_figureCircleFeatures).forEach(k => delete _figureCircleFeatures[k]);

    figureNodes.forEach(figure => {
      if (capturedFigureIds.has(figure.id) || window.CollectionModule?.isCaptured?.(figure.id)) return;

      // C-class: proximity-based, always visible regardless of fog
      if (figure.class === 'C') {
        if (figure.lat == null || figure.lng == null) return;
        const cHtml = `<div class="marker-node" style="color:#fff;background:var(--color-map-pin);border-color:var(--color-map-pin)" title="${escapeHtml(figure.name_th || '')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>`;
        _figureCircleFeatures[figure.id] = _circleFeature(figure.lat, figure.lng, 80);
        const marker = _addMarker(figure.lat, figure.lng, cHtml, { anchorX: 12, anchorY: 12 });
        marker.getElement().addEventListener('click', () => _openCaptureSheet(figure));
        markers[`figure-${figure.id}`] = marker;
        return;
      }

      const state = userDistrictState[figure.districtId] || { fogged: true };
      if (state.fogged) return;

      if (figure.lat == null || figure.lng == null) {
        const district = (allDistrictsCache || []).find(d => d.id === figure.districtId);
        const lat = district?.watchtower_lat ?? district?.center_lat;
        const lng = district?.watchtower_lng ?? district?.center_lng;
        if (lat == null || lng == null) return;
        const html = `<div class="marker-node" style="opacity:0.55;border-style:dashed" title="ตำแหน่งยังไม่ระบุ">?</div>`;
        const placeholderMarker = _addMarker(lat, lng, html, { anchorX: 12, anchorY: 12 });
        placeholderMarker.getElement().addEventListener('click', () => {
          if (figure.raid_only) _startRaidEncounter(figure);
          else if (figure.class === 'B') openQuizForFigure(figure.id);
          else openLegendaryEncounter(figure.districtId, figure.id);
        });
        markers[`figure-${figure.id}`] = placeholderMarker;
        return;
      }

      const raidReady = figure.raid_only && window.RaidModule?.canStartRaid(figure);
      const html = figure.raid_only
        ? raidReady
          ? `<div class="marker-node" style="color:#EF5350;background:rgba(239,83,80,0.15);border-color:#EF5350" title="Raid Encounter — พร้อมเริ่ม">⚔️</div>`
          : `<div class="marker-node" style="color:#EF5350;background:rgba(239,83,80,0.15);border-color:#EF5350;opacity:0.5" title="Raid Encounter — ต้องมีสมาชิกกลุ่มออนไลน์อย่างน้อย ${figure.raid_min_players || 2} คน">⚔️🔒</div>`
        : `<div class="marker-node" style="color:#fff;background:var(--color-map-pin);border-color:var(--color-map-pin)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>`;

      const marker = _addMarker(figure.lat, figure.lng, html, { anchorX: 12, anchorY: 12 });
      marker.getElement().addEventListener('click', () => {
        if (figure.raid_only) _startRaidEncounter(figure);
        else if (figure.class === 'B') openQuizForFigure(figure.id);
        else openLegendaryEncounter(figure.districtId, figure.id);
      });
      markers[`figure-${figure.id}`] = marker;
    });

    _syncFigureCircleSource();
  }

  let _pendingCaptureC = null;

  function _openCaptureSheet(figure) {
    const pos = lastKnownPosition;
    const inRange = isDev() || (pos && haversineDistance(pos.lat, pos.lng, figure.lat, figure.lng) <= 80);
    if (!inRange) {
      window.AppCore?.showToast('เข้าใกล้กว่านี้ (80 ม.)');
      return;
    }
    _pendingCaptureC = figure;
    document.getElementById('c-capture-emoji').innerHTML = figure.image_emoji
      ? escapeHtml(figure.image_emoji)
      : '<i class="bi bi-person-fill"></i>';
    document.getElementById('c-capture-name').textContent = figure.name_th || figure.name_en || '';
    window.AppCore?.openSheet('c-capture-sheet');
  }

  // Raid-only figures skip the solo quiz entirely · they can only be captured
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
    if (u) {
      try {
        await DB.Figures.capture(u.id, figure.id, quizScore);
      } catch (err) {
        console.error('[Figures.capture] failed to save', err);
        if (navigator.onLine && err?.code !== '23505') {
          window.AppCore?.showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
          return;
        }
      }
    }
    if (u) DB.Missions?.updateChallengeProgress(u.id, 'capture').catch(() => { });
    capturedFigureIds.add(figure.id);
    window.CollectionModule?.markCaptured?.(figure.id);
    const mk = markers[`figure-${figure.id}`];
    if (mk) { mk.remove(); delete markers[`figure-${figure.id}`]; }
    if (_figureCircleFeatures[figure.id]) {
      delete _figureCircleFeatures[figure.id];
      _syncFigureCircleSource();
    }
    const distId = figure.districtId;
    if (distId && userDistrictState[distId]?.fogged !== false) {
      if (u) DB.Districts.checkIn(u.id, distId).catch(() => { });
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
      if (k.startsWith('lore-')) { markers[k].remove(); delete markers[k]; }
    });
    Object.keys(_loreRingFeatures).forEach(k => delete _loreRingFeatures[k]);

    getLoreNodes().forEach(node => {
      const districtId = node.district_id || node.districtId;
      if (districtId && !_isRevealedAt(districtId, node.lat, node.lng)) return;

      const discovered = unlockedLoreIds.has(node.id) || pendingLoreIds.has(node.id);

      if (!discovered) {
        // Radius ring so players can see how close they need to be
        _loreRingFeatures[node.id] = _circleFeature(node.lat, node.lng, 50);

        const mysteryHtml = `<div class="marker-node marker-lore-mystery" title="???">???</div>`;
        const mysteryMarker = _addMarker(node.lat, node.lng, mysteryHtml, { anchorX: 12, anchorY: 12 });
        mysteryMarker.getElement().addEventListener('click', () => openVisitedLore(node.id));
        markers[`lore-${node.id}`] = mysteryMarker;
        return;
      }

      const html = `<div class="marker-node marker-lore" title="${escapeHtml(node.name_th || node.name_en || 'Lore')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z"/>
        </svg>
      </div>`;

      const marker = _addMarker(node.lat, node.lng, html, { anchorX: 12, anchorY: 12 });
      marker.getElement().addEventListener('click', () => openVisitedLore(node.id));
      markers[`lore-${node.id}`] = marker;
    });

    _syncLoreRingSource();
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

  // ── Support node info sheet ──────────────────────────
  function showNodeInfoCard(node) {
    const content = document.getElementById('node-info-content');
    if (!content) return;

    const cfg = NODE_CFG[node.type] || NODE_CFG.landmark;
    const district = (allDistrictsCache || []).find(d => d.id === node.districtId);
    const id = getSupportNodeId(node);
    const visited = visitedSupportNodeIds.has(id);

    const iconInner = node.type === 'cafe'
      ? '<path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/>'
      : node.type === 'otop'
        ? '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>'
        : '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><polygon points="12 2 20 7 4 7"/>';

    content.innerHTML = `
      <div class="sq-node-head" style="--node-color:${cfg.color};--node-tint:${cfg.bg}">
        <div class="sq-node-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            ${iconInner}
          </svg>
        </div>
        <div class="sq-node-copy">
          <div class="sq-node-title-row">
            <p class="sq-node-title">${escapeHtml(node.name)}</p>
            ${visited ? '<span class="explored-badge">✓ เยี่ยมชมแล้ว</span>' : ''}
          </div>
          <p class="sq-node-meta">
            ${escapeHtml(cfg.label)}${district ? ' · ' + escapeHtml(district.name_th) : ''}
          </p>
        </div>
      </div>
      <div class="sq-node-route-note"><span>FIELD STOP</span><b>100 m radius</b></div>
      ${visited ? '' : `
      <button class="btn btn-primary btn-sm btn-full sq-node-action"
              id="btn-visit-support-node"
              onclick="MapModule.visitSupportNode('${escapeHtml(id)}')">
        บันทึกจุดนี้ <span aria-hidden="true">↗</span>
      </button>`}
    `;

    window.AppCore?.openSheet('node-info-sheet');
  }

  async function visitSupportNode(nodeId) {
    const node = supportNodes.find(item => getSupportNodeId(item) === nodeId);
    if (!node || visitedSupportNodeIds.has(nodeId)) return;

    if (!isDev() && (!lastKnownPosition || haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, node.lat, node.lng) > 100)) {
      window.AppCore?.showToast('คุณอยู่ไกลเกินไป · เดินทางให้ใกล้กว่านี้');
      return;
    }

    const btn = document.getElementById('btn-visit-support-node');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner"></div>`;
    }

    let nextState = null;
    const user = window.AppCore?.App?.user;
    if (user) {
      try {
        nextState = await DB.Districts.updateNodeVisit(user.id, node.districtId, node.type, nodeId);
      } catch (err) {
        console.error('[Districts.updateNodeVisit] failed to save', err);
        if (navigator.onLine) {
          window.AppCore?.showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
          if (btn) { btn.disabled = false; btn.innerHTML = 'เยี่ยมชมสถานที่นี้'; }
          return;
        }
      }
    }

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
    // Multi-watchtower district: "already visited" is per-watchtower, not per-district ·
    // the district only flips fogged=false once every watchtower in it is done.
    const fogged = district.watchtowerId
      ? !visitedWatchtowerIds.has(district.watchtowerId)
      : (state.fogged ?? true);

    document.getElementById('checkin-district-name').textContent = district.name_th;
    document.getElementById('checkin-district-province').textContent = district.province;

    const rc = district.required_cafes || 2;
    const ro = district.required_otops || 1;
    const rl = district.required_landmarks || 3;
    const vc = state.cafes_visited || 0;
    const vo = state.otops_visited || 0;
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
        <div class="sq-stamp-mark sq-generated-stamp sq-stamp-round ${vc >= rc ? 'is-stamped' : ''}" aria-label="${vc >= rc ? 'สำเร็จ' : 'รอสะสม'}">
          <span>${vc >= rc ? 'สำเร็จ' : 'รอสะสม'}</span>
        </div>
        <span class="checklist-text">${vc}/${rc} Local Cafes visited</span>
      </div>
      <div class="checklist-item ${vo >= ro ? 'done' : ''}">
        <div class="sq-stamp-mark sq-generated-stamp sq-stamp-frame ${vo >= ro ? 'is-stamped' : ''}" aria-label="${vo >= ro ? 'สำเร็จ' : 'รอสะสม'}">
          <span>${vo >= ro ? 'สำเร็จ' : 'รอสะสม'}</span>
        </div>
        <span class="checklist-text">${vo}/${ro} OTOP / Workshop visited</span>
      </div>
      <div class="checklist-item ${vl >= rl ? 'done' : ''}">
        <div class="sq-stamp-mark sq-generated-stamp sq-stamp-round ${vl >= rl ? 'is-stamped' : ''}" aria-label="${vl >= rl ? 'สำเร็จ' : 'รอสะสม'}">
          <span>${vl >= rl ? 'สำเร็จ' : 'รอสะสม'}</span>
        </div>
        <span class="checklist-text">${vl}/${rl} Landmarks checked</span>
      </div>
    `;

    const btn = document.getElementById('btn-checkin');
    const badge = document.getElementById('checkin-explored-badge');
    const alreadyCleared = !fogged;

    // Already-explored is redundant once checked in · the encounter/support-node
    // content below already implies it · so it moves up to a small status badge
    // next to the district name instead of a disabled ghost button in the action
    // stack, leaving just the real actions (Encounter CTA / Cancel) down there.
    if (badge) badge.hidden = !alreadyCleared;
    if (alreadyCleared) {
      btn.hidden = true;
    } else {
      btn.hidden = false;
      btn.textContent = 'Check In & Clear Fog';
      btn.disabled = false;
      btn.className = 'btn btn-sm btn-full btn-primary sq-checkin-primary';
    }

    window.AppCore?.openSheet('checkin-sheet');
  }

  function renderSupportGate(district, state = {}) {
    const container = document.getElementById('checkin-encounter');
    if (!container) return;

    if (!state.has_encounter_key) {
      container.innerHTML = `
        <div class="sq-encounter-locked mb-3">
          <div class="sq-locked-stamp">${lockSVG(20)}</div>
          <div class="sq-locked-copy text-black">
            <strong>Encounter key locked</strong>
            <p>เช็กอิน Watchtower เพื่อรับกุญแจ Encounter</p>
          </div>
        </div>
      `;
      return;
    }

    const rows = [
      { label: 'Cafe', count: state.cafes_visited || 0, required: district.required_cafes || 2 },
      { label: 'OTOP', count: state.otops_visited || 0, required: district.required_otops || 1 },
      { label: 'Landmark', count: state.landmarks_visited || 0, required: district.required_landmarks || 3 },
    ];
    const canUnlock = rows.every(row => row.count >= row.required);

    if (canUnlock) {
      container.innerHTML = `
        <div class="sq-encounter-ready mb-3">
          <div class="sq-ready-stamp"><span>KEY</span><b>READY</b></div>
          <div class="sq-ready-copy">
            <strong>Legendary Encounter ready</strong>
            <span>ครบทุก Support Stamp แล้ว</span>
          </div>
          <button class="btn btn-primary btn-sm btn-full sq-encounter-button" onclick="MapModule.openLegendaryEncounter('${escapeHtml(district.id)}')">
            ${keySVG(16)} ใช้กุญแจ Encounter ↗
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="sq-support-progress mb-3">
        <div class="sq-support-progress-head">
          <p>${keySVG(14)} Encounter key / Support Stamps</p>
          <span>${rows.filter(row => row.count >= row.required).length}/${rows.length}</span>
        </div>
        <div class="sq-support-progress-list">
        ${rows.map(row => {
      const pct = Math.min(100, Math.round((row.count / row.required) * 100));
      return `
            <div class="sq-support-progress-row">
              <div class="sq-support-progress-label"><span>${row.label}</span><b>${row.count}/${row.required}</b></div>
              <div class="sq-support-progress-track"><div class="sq-support-progress-fill" style="width:${pct}%"></div></div>
            </div>
          `;
    }).join('')}
        </div>
      </div>
    `;
  }

  function openLegendaryEncounter(districtId, figureId = null) {
    const district = (allDistrictsCache || []).find(item => item.id === districtId);
    const figure = figureId
      ? figureNodes.find(item => item.id === figureId)
      : figureNodes.find(item => item.districtId === districtId && item.class !== 'C');
    if (!figure) {
      window.AppCore?.showToast('ยังไม่มี Legendary Encounter ในย่านนี้');
      return;
    }

    // A completed Jigsaw mission grants this figure directly · same as
    // finishing the support-node chain, just via the collab route instead.
    const jigsawUnlocked = jigsawUnlockedFigureIds.has(figure.id);
    if (!jigsawUnlocked && district && !canCheckIn(districtId, district)) {
      window.AppCore?.showToast('ยังไม่ครบเงื่อนไข Support Nodes');
      return;
    }
    if (figure.raid_only) { _startRaidEncounter(figure); return; }
    openQuizForFigure(figure.id);
  }

  async function openQuizForFigure(figureId, questionIndex = 0, questions = null) {
    const figure = figureNodes.find(item => item.id === figureId);
    if (!figure) return;

    // Proximity gate · every other capture/interact path on the map has one (C-class 80m,
    // watchtower 500m, lore 50m, support node 100m); this was the one gap where a B/A/S
    // quiz could be started from anywhere once district/support-node prerequisites were met.
    // Only checked on a fresh quiz start (questionIndex 0, no carried-over questions), not
    // on advancing between questions within the same quiz.
    const isFreshStart = questionIndex === 0 && !questions;
    if (isFreshStart && !isDev() && figure.lat != null && figure.lng != null) {
      if (!lastKnownPosition || haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, figure.lat, figure.lng) > 80) {
        window.AppCore?.showToast('เข้าใกล้กว่านี้ (80 ม.)');
        return;
      }
    }

    let quizQuestions = questions;
    try {
      if (!quizQuestions) {
        const count = figure.class === 'B' ? 1 : 3;
        const data = await DB.Quiz.getForFigure(figureId, count);
        quizQuestions = Array.isArray(data) ? data : [data].filter(Boolean);
      }
    } catch { /* use fallback */ }

    if (!quizQuestions?.length) {
      window.AppCore?.showToast?.('ไม่พบคำถาม Quiz · กรุณาตรวจสอบการเชื่อมต่อ');
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
        <button class="quiz-option" data-option="${option}" type="button">
          <span class="quiz-option-letter">${option}</span>
          <span class="quiz-option-text">${escapeHtml(question[key] || '')}</span>
        </button>
      `;
    }).join('');

    options.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        activeQuiz.selected = btn.dataset.option;
        options.querySelectorAll('.quiz-option').forEach(item => item.classList.remove('selected'));
        btn.classList.add('selected');
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
    const chosen = activeQuiz.selected;
    const correct = question.correct_option;

    if (chosen !== correct) {
      const opts = document.querySelectorAll('#quiz-options .quiz-option');
      opts.forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.option === correct) btn.classList.add('quiz-correct');
        if (btn.dataset.option === chosen) btn.classList.add('quiz-wrong');
      });
      const optionsEl = document.getElementById('quiz-options');
      let feedbackEl = document.querySelector('.quiz-feedback');
      if (!feedbackEl) {
        feedbackEl = document.createElement('p');
        feedbackEl.className = 'quiz-feedback';
        optionsEl?.after(feedbackEl);
      }
      feedbackEl.textContent = 'ตอบผิด · ลองใหม่อีกครั้ง';
      activeQuiz.selected = null;

      const isHard = activeQuiz.figure?.class === 'S' || activeQuiz.figure?.class === 'A';
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
    if (user) DB.Missions?.updateChallengeProgress(user.id, 'quiz').catch(() => { });

    if (activeQuiz.questionIndex + 1 < activeQuiz.questions.length) {
      openQuizForFigure(activeQuiz.figure.id, activeQuiz.questionIndex + 1, activeQuiz.questions);
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
    const d = activeDistrict;
    const btn = document.getElementById('btn-checkin');

    if (!isDev() && !isWithinCheckInRange(d)) {
      window.AppCore?.showToast('คุณอยู่ไกลเกินไป · เดินทางให้ใกล้กว่านี้');
      return;
    }

    btn.innerHTML = `<div class="spinner"></div>`;
    btn.disabled = true;

    const user = window.AppCore?.App?.user;
    const sweepLat = d.checkinLat ?? d.watchtower_lat ?? d.center_lat;
    const sweepLng = d.checkinLng ?? d.watchtower_lng ?? d.center_lng;

    if (d.watchtowerId) {
      // Multi-watchtower district: insert-only visit row · the completion trigger
      // decides server-side whether this finishes the district. We mirror that same
      // "all watchtowers visited?" check locally so fog updates instantly, without
      // waiting on the realtime round-trip.
      if (user) {
        try {
          await DB.Watchtowers.checkIn(user.id, d.watchtowerId);
        } catch (err) {
          console.error('[Watchtowers.checkIn] failed to save', err);
          if (navigator.onLine) {
            window.AppCore?.showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
            btn.disabled = false;
            btn.textContent = 'Check In & Clear Fog ✓';
            return;
          }
        }
      }
      visitedWatchtowerIds.add(d.watchtowerId);

      const siblingIds = allWatchtowersCache.filter(w => w.district_id === d.id).map(w => w.id);
      const districtComplete = siblingIds.every(id => visitedWatchtowerIds.has(id));

      if (districtComplete) {
        userDistrictState[d.id] = { ...userDistrictState[d.id], fogged: false, has_encounter_key: true };
        window.AppCore?.showToast('ครบทุก Watchtower แล้ว · ได้รับกุญแจ Encounter! 🗝️');
      } else {
        const remaining = siblingIds.length - siblingIds.filter(id => visitedWatchtowerIds.has(id)).length;
        window.AppCore?.showToast(`เช็คอินแล้ว · เหลืออีก ${remaining} จุดในเขตนี้`);
      }
    } else {
      // Legacy single-watchtower district · unchanged behavior.
      if (user) {
        try {
          await DB.Districts.checkIn(user.id, d.id);
        } catch (err) {
          console.error('[Districts.checkIn] failed to save', err);
          if (navigator.onLine) {
            window.AppCore?.showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
            btn.disabled = false;
            btn.textContent = 'Check In & Clear Fog ✓';
            return;
          }
        }
      }
      userDistrictState[d.id] = { ...userDistrictState[d.id], fogged: false, has_encounter_key: true };
      window.AppCore?.showToast('ได้รับกุญแจ Encounter แล้ว! 🗝️');
    }

    // Rebuild the entire fog layer (removes the old polygon, adds new with extra hole)
    buildFogLayer(allDistrictsCache || []);
    playFogClearSweep(sweepLat, sweepLng, d.watchtowerId ? undefined : _watchtowerRevealRadius(d.id, sweepLat, sweepLng));

    // Reveal nodes in this district
    renderNodes();

    // Reveal lore markers for this newly cleared district
    renderLoreMarkers();

    // Update watchtower to visited state
    renderWatchtowers(allDistrictsCache || []);

    window.AppCore?.closeAllSheets();
    updateStatsBar();
    syncDiscoveryPercent(user?.id);
    showFloatPtsOnMap(150);
    if (user) DB.Missions?.updateChallengeProgress(user.id, 'checkin').catch(() => { });
  }

  // ── Check-in eligibility ────────────────────────────
  function canCheckIn(districtId, district) {
    const s = userDistrictState[districtId] || {};
    return (s.cafes_visited || 0) >= (district.required_cafes || 2) &&
      (s.otops_visited || 0) >= (district.required_otops || 1) &&
      (s.landmarks_visited || 0) >= (district.required_landmarks || 3);
  }

  function isWithinCheckInRange(district) {
    if (!lastKnownPosition) return false;
    if (lastKnownPosition.accuracy === 0 || lastKnownPosition.accuracy > 2000) return false;
    const lat = district.checkinLat ?? district.watchtower_lat ?? district.center_lat;
    const lng = district.checkinLng ?? district.watchtower_lng ?? district.center_lng;
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
    const grid = document.getElementById('home-picker-grid');
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

    homeLocation = {
      id: districtId, lat: district.center_lat, lng: district.center_lng,
      name_th: district.name_th, name_en: district.name_en
    };
    try {
      localStorage.setItem(HOME_KEY, JSON.stringify(homeLocation));
      localStorage.removeItem(LEGACY_HOME_KEY);
    } catch { /* ignore */ }

    window.AppCore?.closeAllSheets();
    map.flyTo({ center: [homeLocation.lng, homeLocation.lat], zoom: 13, duration: 1000 });
    addHomeMarker(homeLocation);

    userDistrictState[districtId] = { ...(userDistrictState[districtId] || {}), fogged: false };
    renderAll(allDistrictsCache || []);
    syncDiscoveryPercent(window.AppCore?.App?.user?.id);
    window.AppCore?.showFloatPts(50, window.innerWidth / 2, window.innerHeight / 2);

    // Persist home district fog clear to DB so it survives reload.
    const homeUser = window.AppCore?.App?.user;
    if (homeUser) DB.Districts.checkIn(homeUser.id, districtId).catch(() => { });
  }

  function skipHomePicker() {
    window.AppCore?.closeAllSheets();
    renderAll(allDistrictsCache || []);
  }

  function addHomeMarker(home) {
    if (markers['home']) markers['home'].remove();
    const html = `<div class="marker-home" title="${home.name_th || 'Home'}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round"
           style="width:16px;height:16px">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>`;
    markers['home'] = _addMarker(home.lat, home.lng, html, { anchorX: 19, anchorY: 46 });
  }

  // ── Stats bar ───────────────────────────────────────
  function updateStatsBar() {
    const total = Object.keys(userDistrictState).length;
    const explored = Object.values(userDistrictState).filter(s => !s.fogged).length;
    const pct = total ? Math.round((explored / total) * 100) : 0;
    const el = document.getElementById('map-stat-explored');
    if (el) el.textContent = pct + '%';
  }

  async function syncDiscoveryPercent(userId) {
    if (!userId) { updateStatsBar(); return; }
    try {
      const pct = await DB.Districts.getDiscoveryPercent(userId);
      const el = document.getElementById('map-stat-explored');
      if (el) el.textContent = pct + '%';
      await DB.Districts.setDiscoveryPercent(userId, pct);
    } catch { updateStatsBar(); }
  }

  function showFloatPtsOnMap(pts) {
    const rect = map.getContainer().getBoundingClientRect();
    window.AppCore?.showFloatPts(pts, rect.width / 2, rect.height / 2);
  }

  function checkSVG() {
    return `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="1.5,6 4.5,9.5 10.5,2.5"/>
    </svg>`;
  }

  function keySVG(size = 16) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;vertical-align:-3px;flex-shrink:0">
      <circle cx="7" cy="15" r="4"/><path d="M10.5 11.5L21 1"/><path d="M17 5l3 3"/><path d="M14 8l2.5 2.5"/>
    </svg>`;
  }

  function lockSVG(size = 16) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;vertical-align:-3px;flex-shrink:0">
      <rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    </svg>`;
  }

  function resize() { map?.resize(); }

  document.getElementById('btn-checkin')?.addEventListener('click', performCheckIn);
  document.getElementById('btn-c-capture')?.addEventListener('click', () => {
    if (!_pendingCaptureC) return;
    const fig = _pendingCaptureC;
    _pendingCaptureC = null;
    if (!isDev() && (!lastKnownPosition || haversineDistance(lastKnownPosition.lat, lastKnownPosition.lng, fig.lat, fig.lng) > 80)) {
      window.AppCore?.showToast('เข้าใกล้กว่านี้ (80 ม.)');
      return;
    }
    _completeCapture(fig, 0);
  });

  function getLoreNodes() { return loreNodes; }
  function getUnlockedLoreIds() { return [...unlockedLoreIds]; }

  const _rallyPins = {};
  function renderRallyPin(userId, username, lat, lng) {
    if (!map) return;
    if (_rallyPins[userId]) _rallyPins[userId].remove();
    const html = `<div style="background:var(--color-map-pin);color:#fff;font-size:10px;font-weight:700;
                       padding:3px 8px;border-radius:10px;white-space:nowrap;
                       box-shadow:0 2px 8px rgba(0,0,0,0.4);pointer-events:none">
             📍 ${escapeHtml(username)}</div>`;
    _rallyPins[userId] = _addMarker(lat, lng, html, { anchorX: 0, anchorY: 16, interactive: false, zIndex: 900 });
  }

  function flyToLocation(lat, lng, zoom = 16) {
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom, pitch: 45, duration: 800 });
  }

  return { init, resize, confirmHome, skipHomePicker, saveLoreUnlock, visitSupportNode, openLegendaryEncounter, openQuizForFigure, submitQuizAnswer, getLoreNodes, getUnlockedLoreIds, renderGuildFog, renderRallyPin, flyToLocation, getLastKnownPosition: () => lastKnownPosition };
})();

window.MapModule = MapModule;
