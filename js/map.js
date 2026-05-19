// ── Map Module ────────────────────────────────────────
const MapModule = (() => {
  let map        = null;
  let fogLayer         = null;    // single unified fog polygon
  let markers          = {};
  let activeDistrict   = null;
  let _nodeCardTimer   = null;    // auto-dismiss timer for node info card
  let _locationMarker  = null;    // real-time GPS dot
  let _locationRing    = null;    // GPS accuracy circle
  let _locationWatcher = null;    // watchPosition handle
  let allDistrictsCache = null;
  let homeLocation      = null;
  const HOME_KEY = 'tam_roi_home';
  const LEGACY_HOME_KEY = 'siam' + 'echo_home';

  // ── Bangkok bounding box for the fog overlay ────────
  // Covers entire Greater Bangkok + Nonthaburi
  const FOG_OUTER = [
    [13.40, 100.20], [13.40, 100.95],
    [14.10, 100.95], [14.10, 100.20],
  ];

  // ── Districts ───────────────────────────────────────
  const MOCK_DISTRICTS = [
    { id: 'rattanakosin', name_th: 'รัตนโกสินทร์',      name_en: 'Rattanakosin',        province: 'Bangkok',
      center_lat: 13.7519, center_lng: 100.4930,
      polygon_coords: [[13.743,100.485],[13.743,100.502],[13.760,100.502],[13.760,100.485],[13.743,100.485]],
      required_cafes: 2, required_otops: 1, required_landmarks: 3 },

    { id: 'dusit',        name_th: 'ดุสิต-พระนคร',      name_en: 'Dusit-Phra Nakhon',   province: 'Bangkok',
      center_lat: 13.7740, center_lng: 100.5109,
      polygon_coords: [[13.762,100.500],[13.762,100.523],[13.786,100.523],[13.786,100.500],[13.762,100.500]],
      required_cafes: 2, required_otops: 1, required_landmarks: 3 },

    { id: 'pathumwan',    name_th: 'ปทุมวัน-สยาม',       name_en: 'Pathumwan-Siam',      province: 'Bangkok',
      center_lat: 13.7442, center_lng: 100.5320,
      polygon_coords: [[13.732,100.517],[13.732,100.545],[13.752,100.545],[13.752,100.517],[13.732,100.517]],
      required_cafes: 2, required_otops: 1, required_landmarks: 2 },

    { id: 'silom',        name_th: 'สีลม-บางรัก',        name_en: 'Silom-Bangrak',       province: 'Bangkok',
      center_lat: 13.7274, center_lng: 100.5329,
      polygon_coords: [[13.718,100.518],[13.718,100.540],[13.735,100.540],[13.735,100.518],[13.718,100.518]],
      required_cafes: 2, required_otops: 1, required_landmarks: 3 },

    { id: 'sukhumvit',    name_th: 'สุขุมวิท',            name_en: 'Sukhumvit',           province: 'Bangkok',
      center_lat: 13.7339, center_lng: 100.5614,
      polygon_coords: [[13.720,100.553],[13.720,100.585],[13.745,100.585],[13.745,100.553],[13.720,100.553]],
      required_cafes: 2, required_otops: 1, required_landmarks: 3 },

    { id: 'watthana',     name_th: 'วัฒนา-ทองหล่อ',       name_en: 'Watthana-Thonglor',   province: 'Bangkok',
      center_lat: 13.7297, center_lng: 100.5826,
      polygon_coords: [[13.718,100.568],[13.718,100.596],[13.742,100.596],[13.742,100.568],[13.718,100.568]],
      required_cafes: 3, required_otops: 1, required_landmarks: 2 },

    { id: 'chatuchak',    name_th: 'จตุจักร',              name_en: 'Chatuchak',           province: 'Bangkok',
      center_lat: 13.8022, center_lng: 100.5507,
      polygon_coords: [[13.792,100.540],[13.792,100.570],[13.815,100.570],[13.815,100.540],[13.792,100.540]],
      required_cafes: 2, required_otops: 1, required_landmarks: 3 },

    { id: 'ladphrao',     name_th: 'ลาดพร้าว',             name_en: 'Ladphrao',            province: 'Bangkok',
      center_lat: 13.8100, center_lng: 100.5900,
      polygon_coords: [[13.795,100.570],[13.795,100.610],[13.825,100.610],[13.825,100.570],[13.795,100.570]],
      required_cafes: 2, required_otops: 1, required_landmarks: 3 },

    { id: 'bang_kapi',    name_th: 'บางกะปิ-มีนบุรี',      name_en: 'Bang Kapi',           province: 'Bangkok',
      center_lat: 13.7775, center_lng: 100.6392,
      polygon_coords: [[13.760,100.615],[13.760,100.660],[13.795,100.660],[13.795,100.615],[13.760,100.615]],
      required_cafes: 2, required_otops: 1, required_landmarks: 2 },

    { id: 'phra_khanong', name_th: 'พระโขนง-อ่อนนุช',     name_en: 'Phra Khanong',        province: 'Bangkok',
      center_lat: 13.7009, center_lng: 100.5953,
      polygon_coords: [[13.688,100.582],[13.688,100.612],[13.714,100.612],[13.714,100.582],[13.688,100.582]],
      required_cafes: 2, required_otops: 1, required_landmarks: 2 },

    { id: 'bang_na',      name_th: 'บางนา-สุวรรณภูมิ',    name_en: 'Bang Na',             province: 'Bangkok',
      center_lat: 13.6571, center_lng: 100.6123,
      polygon_coords: [[13.642,100.594],[13.642,100.632],[13.672,100.632],[13.672,100.594],[13.642,100.594]],
      required_cafes: 2, required_otops: 2, required_landmarks: 2 },

    { id: 'nonthaburi',   name_th: 'นนทบุรี',              name_en: 'Nonthaburi',          province: 'Nonthaburi',
      center_lat: 13.8621, center_lng: 100.5144,
      polygon_coords: [[13.848,100.500],[13.848,100.530],[13.876,100.530],[13.876,100.500],[13.848,100.500]],
      required_cafes: 2, required_otops: 1, required_landmarks: 2 },
  ];

  // ── Nodes ───────────────────────────────────────────
  const MOCK_NODES = [
    // Rattanakosin
    { districtId: 'rattanakosin', type: 'cafe',     lat: 13.748, lng: 100.491, name: 'ร้านกาแฟโบราณ' },
    { districtId: 'rattanakosin', type: 'cafe',     lat: 13.752, lng: 100.496, name: 'Café Chakri' },
    { districtId: 'rattanakosin', type: 'otop',     lat: 13.756, lng: 100.498, name: 'OTOP ผ้าไทย' },
    { districtId: 'rattanakosin', type: 'landmark', lat: 13.7510, lng: 100.4930, name: 'วัดพระแก้ว' },
    { districtId: 'rattanakosin', type: 'landmark', lat: 13.7565, lng: 100.4925, name: 'พระบรมมหาราชวัง' },
    { districtId: 'rattanakosin', type: 'landmark', lat: 13.7459, lng: 100.4883, name: 'วัดโพธิ์' },
    // Dusit
    { districtId: 'dusit', type: 'landmark', lat: 13.775, lng: 100.513, name: 'พระที่นั่งวิมานเมฆ' },
    { districtId: 'dusit', type: 'landmark', lat: 13.768, lng: 100.508, name: 'วัดเบญจมบพิตร' },
    { districtId: 'dusit', type: 'cafe',     lat: 13.772, lng: 100.510, name: 'Tha Phra Chan Café' },
    { districtId: 'dusit', type: 'otop',     lat: 13.778, lng: 100.515, name: 'OTOP ของที่ระลึก' },
    // Pathumwan
    { districtId: 'pathumwan', type: 'landmark', lat: 13.744, lng: 100.535, name: 'ศาลท้าวมหาพรหม' },
    { districtId: 'pathumwan', type: 'cafe',     lat: 13.743, lng: 100.528, name: 'Siam Square Coffee' },
    { districtId: 'pathumwan', type: 'otop',     lat: 13.747, lng: 100.532, name: 'OTOP สยาม' },
    // Silom
    { districtId: 'silom', type: 'cafe',     lat: 13.725, lng: 100.528, name: 'Silom Coffee Roasters' },
    { districtId: 'silom', type: 'otop',     lat: 13.728, lng: 100.531, name: 'OTOP เครื่องหนัง' },
    { districtId: 'silom', type: 'landmark', lat: 13.724, lng: 100.535, name: 'ศาลเจ้าพ่อเสือ' },
    // Sukhumvit
    { districtId: 'sukhumvit', type: 'cafe',     lat: 13.733, lng: 100.558, name: 'Asok Coffee House' },
    { districtId: 'sukhumvit', type: 'otop',     lat: 13.736, lng: 100.563, name: 'OTOP Terminal 21' },
    { districtId: 'sukhumvit', type: 'landmark', lat: 13.740, lng: 100.570, name: 'บ้านจิม ทอมป์สัน' },
    // Watthana
    { districtId: 'watthana', type: 'cafe',     lat: 13.728, lng: 100.577, name: 'Thonglor Café' },
    { districtId: 'watthana', type: 'cafe',     lat: 13.722, lng: 100.584, name: 'Ekkamai Coffee Roasters' },
    { districtId: 'watthana', type: 'cafe',     lat: 13.735, lng: 100.573, name: 'Phrom Phong Brew' },
    { districtId: 'watthana', type: 'otop',     lat: 13.731, lng: 100.572, name: 'OTOP ของฝาก Thonglor' },
    // Chatuchak
    { districtId: 'chatuchak', type: 'cafe',     lat: 13.800, lng: 100.549, name: 'JJ Market Coffee' },
    { districtId: 'chatuchak', type: 'otop',     lat: 13.803, lng: 100.553, name: 'ตลาดนัดจตุจักร' },
    { districtId: 'chatuchak', type: 'landmark', lat: 13.797, lng: 100.544, name: 'สวนจตุจักร' },
    // Ladphrao
    { districtId: 'ladphrao', type: 'cafe',     lat: 13.808, lng: 100.582, name: 'Ladphrao Coffee' },
    { districtId: 'ladphrao', type: 'otop',     lat: 13.814, lng: 100.588, name: 'OTOP ลาดพร้าว' },
    { districtId: 'ladphrao', type: 'landmark', lat: 13.820, lng: 100.591, name: 'วัดลาดพร้าว' },
    // Bang Kapi
    { districtId: 'bang_kapi', type: 'landmark', lat: 13.774, lng: 100.635, name: 'วัดบางกะปิ' },
    { districtId: 'bang_kapi', type: 'cafe',     lat: 13.778, lng: 100.642, name: 'The Mall Café' },
    { districtId: 'bang_kapi', type: 'otop',     lat: 13.781, lng: 100.628, name: 'OTOP มีนบุรี' },
    // Phra Khanong
    { districtId: 'phra_khanong', type: 'cafe',     lat: 13.700, lng: 100.593, name: 'On Nut Coffee' },
    { districtId: 'phra_khanong', type: 'otop',     lat: 13.703, lng: 100.597, name: 'OTOP On Nut' },
    { districtId: 'phra_khanong', type: 'landmark', lat: 13.696, lng: 100.588, name: 'วัดพระโขนง' },
    // Bang Na
    { districtId: 'bang_na', type: 'landmark', lat: 13.658, lng: 100.612, name: 'วัดบางนา' },
    { districtId: 'bang_na', type: 'otop',     lat: 13.652, lng: 100.607, name: 'OTOP Bang Na' },
    { districtId: 'bang_na', type: 'cafe',     lat: 13.664, lng: 100.620, name: 'Suvarnabhumi Café' },
    // Nonthaburi
    { districtId: 'nonthaburi', type: 'landmark', lat: 13.862, lng: 100.515, name: 'วัดเฉลิมพระเกียรติ' },
    { districtId: 'nonthaburi', type: 'cafe',     lat: 13.857, lng: 100.510, name: 'Nonthaburi Riverside Café' },
    { districtId: 'nonthaburi', type: 'otop',     lat: 13.865, lng: 100.520, name: 'ตลาดนนทบุรี' },
  ];

  // ── User state ─────────────────────────────────────
  let userDistrictState = {
    rattanakosin: { fogged: false, cafes_visited: 2, otops_visited: 1, landmarks_visited: 2 },
    dusit:        { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    pathumwan:    { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    silom:        { fogged: true, cafes_visited: 1, otops_visited: 0, landmarks_visited: 1 },
    sukhumvit:    { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    watthana:     { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    chatuchak:    { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    ladphrao:     { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    bang_kapi:    { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    phra_khanong: { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    bang_na:      { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
    nonthaburi:   { fogged: true, cafes_visited: 0, otops_visited: 0, landmarks_visited: 0 },
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

    loadDistrictData();
    updateStatsBar();

    // Dismiss node info card on map click/drag
    map.on('click mousedown', () => {
      const card = document.getElementById('node-info-card');
      if (card) { card.classList.remove('show'); clearTimeout(_nodeCardTimer); }
    });

    // Start GPS tracking
    startLocationTracking();
  }

  // ── Real-time location dot ─────────────────────────
  function startLocationTracking() {
    if (!navigator.geolocation) return;

    _locationWatcher = navigator.geolocation.watchPosition(
      pos => updateLocationDot(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      err => console.warn('[GPS]', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function updateLocationDot(lat, lng, accuracy) {
    if (_locationMarker)  { map.removeLayer(_locationMarker);  _locationMarker = null; }
    if (_locationRing)    { map.removeLayer(_locationRing);    _locationRing   = null; }

    // Accuracy ring — light blue filled circle
    _locationRing = L.circle([lat, lng], {
      radius:      accuracy,
      fillColor:   '#4FC3F7',
      fillOpacity: 0.10,
      color:       '#4FC3F7',
      weight:      1,
      opacity:     0.35,
      interactive: false,
    }).addTo(map);

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
    let districts = MOCK_DISTRICTS;
    try {
      const data = await DB.Districts.getAll();
      if (data?.length) districts = data;

      const user = window.AppCore?.App?.user;
      if (user) {
        const stateData = await DB.Districts.getUserState(user.id);
        stateData.forEach(s => {
          userDistrictState[s.district_id] = s;
        });
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

  // ── Unified render ─────────────────────────────────
  function renderAll(districts) {
    buildFogLayer(districts);
    renderWatchtowers(districts);
    renderNodes();
  }

  // ── Fog: single inverted polygon ───────────────────
  // One polygon covers all Bangkok; holes are cut for each explored district.
  // Uses SVG evenodd fill rule — clean, no per-district artifacts.
  function buildFogLayer(districts) {
    const holes = districts
      .filter(d => !(userDistrictState[d.id]?.fogged ?? true))
      .map(d => {
        const raw = d.polygon_coords;
        const coords = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
        return coords.map(c => [c[0], c[1]]);
      })
      .filter(h => h.length > 0);

    if (fogLayer) { map.removeLayer(fogLayer); fogLayer = null; }

    fogLayer = L.polygon([FOG_OUTER, ...holes], {
      fillColor:   '#0d0c1d',
      fillOpacity: 0.80,
      stroke:      false,
      interactive: false,
      fillRule:    'evenodd',
    }).addTo(map);
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

    MOCK_NODES.forEach((node, i) => {
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

  // ── Node info card (above nav, no z-index conflicts) ──
  function showNodeInfoCard(node) {
    const card    = document.getElementById('node-info-card');
    const content = document.getElementById('node-info-content');
    if (!card || !content) return;

    const cfg      = NODE_CFG[node.type] || NODE_CFG.landmark;
    const district = (allDistrictsCache || MOCK_DISTRICTS).find(d => d.id === node.districtId);

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
    `;

    card.classList.add('show');
    clearTimeout(_nodeCardTimer);
    _nodeCardTimer = setTimeout(() => card.classList.remove('show'), 4000);
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
    const unlocked = canCheckIn(district.id, district);
    const alreadyCleared = !fogged;

    if (alreadyCleared) {
      btn.textContent = 'Already Explored ✓';
      btn.disabled    = true;
      btn.className   = 'btn btn-full btn-ghost';
    } else if (unlocked) {
      btn.textContent = 'Check In & Clear Fog';
      btn.disabled    = false;
      btn.className   = 'btn btn-full btn-primary';
    } else {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> ยังไม่ครบเงื่อนไข`;
      btn.disabled  = true;
      btn.className = 'btn btn-full btn-ghost';
    }

    // Demo shortcut for Rattanakosin
    if (district.id === 'rattanakosin' && fogged && !unlocked) {
      btn.textContent = 'Check In & Clear Fog (Demo)';
      btn.disabled    = false;
      btn.className   = 'btn btn-full btn-primary';
    }

    window.AppCore?.openSheet('checkin-sheet');
  }

  // ── Perform check-in ────────────────────────────────
  async function performCheckIn() {
    if (!activeDistrict) return;
    const d   = activeDistrict;
    const btn = document.getElementById('btn-checkin');
    btn.innerHTML = `<div class="spinner"></div>`;
    btn.disabled  = true;

    try {
      const user = window.AppCore?.App?.user;
      if (user) await DB.Districts.checkIn(user.id, d.id);
    } catch { /* offline/demo — continue locally */ }

    userDistrictState[d.id] = { ...userDistrictState[d.id], fogged: false };

    // Rebuild the entire fog layer (removes the old polygon, adds new with extra hole)
    buildFogLayer(allDistrictsCache || MOCK_DISTRICTS);

    // Reveal nodes in this district
    renderNodes();

    // Update watchtower to visited state
    renderWatchtowers(allDistrictsCache || MOCK_DISTRICTS);

    window.AppCore?.closeAllSheets();
    updateStatsBar();
    showFloatPtsOnMap(150);
  }

  // ── Check-in eligibility ────────────────────────────
  function canCheckIn(districtId, district) {
    const s = userDistrictState[districtId] || {};
    return (s.cafes_visited     || 0) >= (district.required_cafes     || 2) &&
           (s.otops_visited     || 0) >= (district.required_otops     || 1) &&
           (s.landmarks_visited || 0) >= (district.required_landmarks || 3);
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
    const district = (allDistrictsCache || MOCK_DISTRICTS).find(d => d.id === districtId);
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
    renderAll(allDistrictsCache || MOCK_DISTRICTS);
    window.AppCore?.showFloatPts(50, window.innerWidth / 2, window.innerHeight / 2);
  }

  function skipHomePicker() {
    window.AppCore?.closeAllSheets();
    renderAll(allDistrictsCache || MOCK_DISTRICTS);
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

  return { init, resize, confirmHome, skipHomePicker };
})();

window.MapModule = MapModule;
