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
  let lastKnownPosition = null;
  let loreNodes = [];
  let activeLoreNode = null;
  let activeQuiz = null;
  const unlockedLoreIds = new Set();
  const pendingLoreIds = new Set();
  const completedLoreChains = new Set();
  const visitedSupportNodeIds = new Set();
  const HOME_KEY = 'tam_roi_home';
  const LEGACY_HOME_KEY = 'siam' + 'echo_home';
  const LORE_KEY = 'tam_roi_lore_unlocked';
  const CHECKIN_TOLERANCE_M = 500;

  const BTS_MRT_STATIONS = [
    { name: 'Siam BTS', lat: 13.7455, lng: 100.5348, radius_m: 300 },
    { name: 'Asok BTS', lat: 13.7370, lng: 100.5604, radius_m: 300 },
    { name: 'Mo Chit BTS', lat: 13.8026, lng: 100.5538, radius_m: 300 },
    { name: 'Sala Daeng BTS', lat: 13.7286, lng: 100.5341, radius_m: 300 },
    { name: 'Sanam Chai MRT', lat: 13.7437, lng: 100.4941, radius_m: 300 },
    { name: 'Chatuchak Park MRT', lat: 13.8021, lng: 100.5530, radius_m: 300 },
  ];

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
    { id: 'node-rattanakosin-cafe-1', districtId: 'rattanakosin', type: 'cafe',     lat: 13.748, lng: 100.491, name: 'ร้านกาแฟโบราณ' },
    { id: 'node-rattanakosin-cafe-2', districtId: 'rattanakosin', type: 'cafe',     lat: 13.752, lng: 100.496, name: 'Café Chakri' },
    { id: 'node-rattanakosin-otop-1', districtId: 'rattanakosin', type: 'otop',     lat: 13.756, lng: 100.498, name: 'OTOP ผ้าไทย' },
    { id: 'node-rattanakosin-landmark-1', districtId: 'rattanakosin', type: 'landmark', lat: 13.7510, lng: 100.4930, name: 'วัดพระแก้ว' },
    { id: 'node-rattanakosin-landmark-2', districtId: 'rattanakosin', type: 'landmark', lat: 13.7565, lng: 100.4925, name: 'พระบรมมหาราชวัง' },
    { id: 'node-rattanakosin-landmark-3', districtId: 'rattanakosin', type: 'landmark', lat: 13.7459, lng: 100.4883, name: 'วัดโพธิ์' },
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

  const FIGURE_NODES = [
    { id: 'village-elder', districtId: 'silom', class: 'C', legacy_pts: 50, lat: 13.7268, lng: 100.5322, name_th: 'ขุนนางท้องถิ่น', name_en: 'Local Village Legend' },
    { id: 'river-merchant', districtId: 'silom', class: 'C', legacy_pts: 50, lat: 13.7246, lng: 100.5295, name_th: 'พ่อค้าแม่น้ำ', name_en: 'River Merchant' },
    { id: 'otop-master', districtId: 'chatuchak', class: 'C', legacy_pts: 50, lat: 13.8032, lng: 100.5534, name_th: 'ช่างฝีมือ OTOP', name_en: 'OTOP Craft Master' },
    { id: 'king-taksin', districtId: 'rattanakosin', class: 'S', legacy_pts: 500, lat: 13.7525, lng: 100.4935, name_th: 'สมเด็จพระเจ้าตากสิน', name_en: 'King Taksin the Great' },
  ];

  const MOCK_QUIZ = {
    'village-elder': {
      question_th: 'ขุนนางท้องถิ่นในเกมสะท้อนบทบาทใดของชุมชน',
      option_a: 'การนำและดูแลชุมชน',
      option_b: 'การขับรถไฟฟ้า',
      option_c: 'การผลิตดาวเทียม',
      option_d: 'การสร้างห้างสรรพสินค้า',
      correct_option: 'A',
    },
    'river-merchant': {
      question_th: 'พ่อค้าแม่น้ำเกี่ยวข้องกับระบบใดมากที่สุด',
      option_a: 'การค้าทางน้ำ',
      option_b: 'รถไฟใต้ดิน',
      option_c: 'อุตสาหกรรมอวกาศ',
      option_d: 'ฟุตบอลอาชีพ',
      correct_option: 'A',
    },
    'otop-master': {
      question_th: 'OTOP ในเกมเน้นคุณค่าใด',
      option_a: 'งานฝีมือท้องถิ่น',
      option_b: 'การแข่งรถ',
      option_c: 'อวกาศ',
      option_d: 'อุตสาหกรรมน้ำมัน',
      correct_option: 'A',
    },
  };

  const LORE_NODES = [
    {
      id: 'lore-rattanakosin-wall',
      name_th: 'ร่องรอยกำแพงเมือง',
      name_en: 'Old City Wall Trace',
      lat: 13.7530,
      lng: 100.4970,
      radius_m: 120,
      lore_pts: 30,
      content_type: 'text',
      content_th: 'บริเวณเกาะรัตนโกสินทร์เคยเป็นศูนย์กลางการป้องกันเมือง มีคูคลองและกำแพงเมืองช่วยกำหนดขอบเขตอำนาจของกรุงเทพฯ ยุคแรก',
      content_en: 'Rattanakosin once relied on canals and walls to define and defend the early capital.',
      chain_id: 'chain-rattanakosin-founding',
      chain_part: 1,
      district_id: 'rattanakosin',
    },
    {
      id: 'lore-grand-palace-axis',
      name_th: 'แกนพระบรมมหาราชวัง',
      name_en: 'Grand Palace Axis',
      lat: 13.7510,
      lng: 100.4925,
      radius_m: 120,
      lore_pts: 30,
      content_type: 'text',
      content_th: 'พระบรมมหาราชวังไม่ได้เป็นเพียงที่ประทับ แต่เป็นสัญลักษณ์ของการตั้งราชธานีใหม่และการจัดระเบียบพื้นที่ศักดิ์สิทธิ์ของเมือง',
      content_en: 'The Grand Palace marked both royal residence and the sacred order of the new capital.',
      chain_id: 'chain-rattanakosin-founding',
      chain_part: 2,
      district_id: 'rattanakosin',
    },
    {
      id: 'lore-wat-pho-learning',
      name_th: 'วัดโพธิ์กับความรู้สาธารณะ',
      name_en: 'Wat Pho Public Knowledge',
      lat: 13.7465,
      lng: 100.4930,
      radius_m: 120,
      lore_pts: 40,
      content_type: 'text',
      content_th: 'วัดโพธิ์เป็นแหล่งรวบรวมตำรา ความรู้แพทย์แผนไทย และจารึกที่เปิดให้ผู้คนเรียนรู้ จึงเปรียบเสมือนมหาวิทยาลัยกลางเมืองในอดีต',
      content_en: 'Wat Pho preserved inscriptions and traditional knowledge for public learning.',
      chain_id: 'chain-rattanakosin-founding',
      chain_part: 3,
      district_id: 'rattanakosin',
    },
    {
      id: 'lore-silom-trade',
      name_th: 'เส้นทางการค้าสีลม',
      name_en: 'Silom Trade Route',
      lat: 13.7260,
      lng: 100.5310,
      radius_m: 100,
      lore_pts: 25,
      content_type: 'text',
      content_th: 'ย่านสีลมเติบโตจากเส้นทางคมนาคมและการค้า เชื่อมชุมชนริมเจ้าพระยากับเศรษฐกิจเมืองสมัยใหม่',
      content_en: 'Silom grew from transport and trade routes linking river communities with the modern city.',
      chain_id: null,
      chain_part: null,
      district_id: 'silom',
    },
    {
      id: 'lore-chatuchak-market',
      name_th: 'ตลาดนัดกับเมืองร่วมสมัย',
      name_en: 'Weekend Market Memory',
      lat: 13.7990,
      lng: 100.5510,
      radius_m: 100,
      lore_pts: 25,
      content_type: 'text',
      content_th: 'จตุจักรสะท้อนเศรษฐกิจสร้างสรรค์ของกรุงเทพฯ ที่รวมงานฝีมือ อาหาร และความทรงจำของคนเมืองไว้ในพื้นที่เดียว',
      content_en: 'Chatuchak reflects Bangkok creative commerce through crafts, food, and urban memory.',
      chain_id: null,
      chain_part: null,
      district_id: 'chatuchak',
    },
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
    loadLoreData();
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
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        lastKnownPosition = { lat: latitude, lng: longitude, accuracy };
        updateLocationDot(latitude, longitude, accuracy);
        checkLoreProximity(latitude, longitude);
      },
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
        updateDiscoveryPercentFromDB(user.id);
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

  async function loadLoreData() {
    loreNodes = LORE_NODES;
    loadLocalLoreState();

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
      persistLocalLoreState();
    } catch { /* keep mock/local lore state */ }
  }

  function loadLocalLoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(LORE_KEY) || '[]');
      saved.forEach(id => unlockedLoreIds.add(id));
    } catch { /* ignore */ }
  }

  function persistLocalLoreState() {
    try {
      localStorage.setItem(LORE_KEY, JSON.stringify([...unlockedLoreIds]));
    } catch { /* ignore */ }
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
    if (!loreNodes.length) loreNodes = LORE_NODES;

    loreNodes.forEach(node => {
      if (unlockedLoreIds.has(node.id) || pendingLoreIds.has(node.id)) return;
      const distance = haversineDistance(userLat, userLng, node.lat, node.lng);
      if (distance <= (node.radius_m || 100)) unlockLore(node);
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
  }

  async function saveLoreUnlock(loreId) {
    const node = loreNodes.find(item => item.id === loreId) || activeLoreNode;
    if (!node) return;

    const btn = document.getElementById('btn-save-lore');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner"></div>`;
    }

    const user = window.AppCore?.App?.user;
    try {
      if (user) {
        await DB.Lore.unlock(user.id, node.id);
        await DB.Profiles.addLegacyPoints(user.id, (node.lore_pts || 0) * getTransportMultiplier());
      }
    } catch { /* offline/demo unlock still persists locally */ }

    unlockedLoreIds.add(node.id);
    pendingLoreIds.delete(node.id);
    persistLocalLoreState();
    window.AppCore?.closeAllSheets();
    const earned = (node.lore_pts || 0) * getTransportMultiplier();
    if (earned > (node.lore_pts || 0)) window.AppCore?.showToast('BTS/MRT Bonus! x2 Legacy Points');
    showFloatPtsOnMap(earned);
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
    renderFigureNodes();
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

  function renderFigureNodes() {
    Object.keys(markers).forEach(k => {
      if (k.startsWith('figure-')) { map.removeLayer(markers[k]); delete markers[k]; }
    });

    FIGURE_NODES.forEach(figure => {
      const state = userDistrictState[figure.districtId] || { fogged: true };
      if (state.fogged) return;

      const icon = L.divIcon({
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
        if (figure.class === 'C') openQuizForFigure(figure.id);
        else openLegendaryEncounter(figure.districtId, figure.id);
      });
      markers[`figure-${figure.id}`] = marker;
    });
  }

  // ── Node info card (above nav, no z-index conflicts) ──
  function showNodeInfoCard(node) {
    const card    = document.getElementById('node-info-card');
    const content = document.getElementById('node-info-content');
    if (!card || !content) return;

    const cfg      = NODE_CFG[node.type] || NODE_CFG.landmark;
    const district = (allDistrictsCache || MOCK_DISTRICTS).find(d => d.id === node.districtId);
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
    const node = MOCK_NODES.find(item => getSupportNodeId(item) === nodeId);
    if (!node || visitedSupportNodeIds.has(nodeId)) return;

    const btn = document.getElementById('btn-visit-support-node');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner"></div>`;
    }

    let nextState = null;
    const user = window.AppCore?.App?.user;
    try {
      if (user) nextState = await DB.Districts.updateNodeVisit(user.id, node.districtId, node.type);
    } catch { /* offline/demo fallback below */ }

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
    const district = (allDistrictsCache || MOCK_DISTRICTS).find(item => item.id === districtId);
    if (district && !canCheckIn(districtId, district)) {
      window.AppCore?.showToast('ยังไม่ครบเงื่อนไข Support Nodes');
      return;
    }

    const figure = figureId
      ? FIGURE_NODES.find(item => item.id === figureId)
      : FIGURE_NODES.find(item => item.districtId === districtId && item.class !== 'C');
    if (!figure) {
      window.AppCore?.showToast('ยังไม่มี Legendary Encounter ในย่านนี้');
      return;
    }
    openQuizForFigure(figure.id);
  }

  async function openQuizForFigure(figureId, questionIndex = 0, questions = null) {
    const figure = FIGURE_NODES.find(item => item.id === figureId);
    if (!figure) return;

    let quizQuestions = questions;
    try {
      if (!quizQuestions) {
        const count = figure.class === 'C' ? 1 : 3;
        const data = await DB.Quiz.getForFigure(figureId, count);
        quizQuestions = Array.isArray(data) ? data : [data].filter(Boolean);
      }
    } catch { /* use fallback */ }

    if (!quizQuestions?.length) quizQuestions = [MOCK_QUIZ[figureId]].filter(Boolean);
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
        options.querySelectorAll('.quiz-option').forEach(item => item.classList.remove('btn-primary'));
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
    if (activeQuiz.selected !== question.correct_option) {
      window.AppCore?.showToast('ยังไม่ถูก ลองใหม่อีกครั้ง');
      activeQuiz.selected = null;
      renderQuizSheet();
      return;
    }

    if (activeQuiz.questionIndex + 1 < activeQuiz.questions.length) {
      openQuizForFigure(activeQuiz.figure.id, activeQuiz.questionIndex + 1, activeQuiz.questions);
      return;
    }

    const user = window.AppCore?.App?.user;
    try {
      if (user) await DB.Figures.capture(user.id, activeQuiz.figure.id, activeQuiz.questions.length);
    } catch { /* offline/demo capture below */ }

    window.CollectionModule?.markCaptured?.(activeQuiz.figure.id);
    window.AppCore?.closeAllSheets();
    showFloatPtsOnMap(activeQuiz.figure.legacy_pts || 0);
    window.AppCore?.showToast('จับบุคคลสำเร็จ');
    activeQuiz = null;
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
    updateDiscoveryPercentFromDB(window.AppCore?.App?.user?.id);
    showFloatPtsOnMap(150 * getTransportMultiplier());
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
    updateDiscoveryPercentFromDB(window.AppCore?.App?.user?.id);
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
    return BTS_MRT_STATIONS.some(station => (
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

  function getLoreNodes() { return loreNodes.length ? loreNodes : LORE_NODES; }
  function getUnlockedLoreIds() { return [...unlockedLoreIds]; }

  return { init, resize, confirmHome, skipHomePicker, saveLoreUnlock, visitSupportNode, openLegendaryEncounter, openQuizForFigure, submitQuizAnswer, getLoreNodes, getUnlockedLoreIds };
})();

window.MapModule = MapModule;
