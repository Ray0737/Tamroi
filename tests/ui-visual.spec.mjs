import { test, expect } from '/home/papajittan/Documents/node_modules/playwright/test.mjs';

const SCREENSHOT_DIR = '/home/papajittan/Documents/Tamroi/restyling/05_bangkok_street_quest/screenshots';
const MOCK_USER = { id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'traveler@example.com', user_metadata: { full_name: 'Traveler' } };

const MOCK_DB_SCRIPT = `
const user = ${JSON.stringify(MOCK_USER)};
const emptySubscription = () => ({ unsubscribe() {} });
const Auth = {
  async getSession() { return { user, access_token: 'visual-test', expires_at: 9999999999 }; },
  onStateChange() { return { data: { subscription: emptySubscription() } }; },
  async getUser() { return user; }, async signOut() {}
};
const Profiles = {
  async getOrCreate() { return { id: user.id, username: 'Traveler', legacy_score: 1250, archive_count: 3, province: 'Bangkok', avatar_url: null }; },
  async get() { return { id: user.id, username: 'Traveler', legacy_score: 1250 }; }
};
const Districts = {
  async getAll() { return [{ id: 'thonburi', name_th: 'ธนบุรี' }]; }, async getCleared() { return []; },
  async getVisitedSupportNodes() { return []; }, async getDiscoveryPercent() { return 32; },
  async getUserState() { return [{ district_id: 'thonburi', fogged: false, cafes_visited: 1, otops_visited: 1, landmarks_visited: 2 }]; }
};
const Figures = {
  async getAll() { return [
    { id: 'king-taksin', name_th: 'พระเจ้าตากสินมหาราช', name_en: 'King Taksin', class: 'S', legacy_pts: 500, district_id: 'thonburi' },
    { id: 'sri-prat', name_th: 'ศรีปราชญ์', name_en: 'Si Prat', class: 'A', legacy_pts: 250, district_id: 'thonburi' },
    { id: 'thao-suranari', name_th: 'ท้าวสุรนารี', name_en: 'Thao Suranari', class: 'C', legacy_pts: 50, district_id: 'thonburi' },
    { id: 'sunthorn-phu', name_th: 'สุนทรภู่', name_en: 'Sunthorn Phu', class: 'B', legacy_pts: 120, district_id: 'thonburi' }
  ]; },
  async getUserCaptures() { return [{ figure_id: 'thao-suranari' }]; }
};
const Artifacts = {
  async getAll() { return [
    { id: 'old-map', name: 'แผนที่กรุงเทพฯ โบราณ', rarity: 'rare' },
    { id: 'ceramic-bowl', name: 'ชามเบญจรงค์', rarity: 'common' },
    { id: 'temple-bell', name: 'ระฆังวัดเก่า', rarity: 'legendary' }
  ]; },
  async getUserArtifacts() { return [{ artifact_id: 'old-map' }, { artifact_id: 'ceramic-bowl' }]; }
};
const Lore = { async getUserUnlocked() { return []; }, async getRecallQuestions() { return []; } };
const Missions = {
  async getDailyChallenges() { return [
    { type: 'visit', title_th: 'เยี่ยมชมสถานที่สำคัญ 2 แห่ง', target_count: 2, current: 1, pts_reward: 40, completed: false },
    { type: 'capture', title_th: 'ค้นพบบุคคลสำคัญ 1 คน', target_count: 1, current: 1, pts_reward: 30, completed: true },
    { type: 'quiz', title_th: 'ตอบคำถามประวัติศาสตร์', target_count: 1, current: 0, pts_reward: 40, completed: false }
  ]; },
  async getRecallMissions() { return []; }
};
const Notifications = { async getRecent() { return []; }, subscribe() { return emptySubscription(); } };
const Leaderboard = {
  async get() { return [
    { id: user.id, username: 'Traveler', province: 'Bangkok', legacy_score: 1250, map_discovery: 32, archive_count: 3 },
    { id: 'b', username: 'HuaLamphong', province: 'Bangkok', legacy_score: 2850, map_discovery: 61, archive_count: 12 },
    { id: 'c', username: 'TalatNoi', province: 'Bangkok', legacy_score: 2430, map_discovery: 54, archive_count: 9 },
    { id: 'd', username: 'BangRak', province: 'Bangkok', legacy_score: 2190, map_discovery: 47, archive_count: 8 }
  ]; },
  subscribe() { return emptySubscription(); }
};
const Coop = {
  async getMyGuild() { return window.__visualGuild ?? null; }, async getGuildLeaderboard() { return []; },
  async getGuildMembers() { return window.__visualGuild?.members ?? []; },
  async getCollabMissions() { return []; }, subscribeGuildChanges() { return emptySubscription(); },
  async getAllGuildCheckins() { return []; }, async getGuildClearedDistrictIds() { return []; },
  async getGuildScore() { return 4870; }, async getJoinRequests() { return []; },
  async getAnnouncements() { return [{ id: 'announcement-1', content: 'เสาร์นี้นัดสำรวจย่านกะดีจีน เริ่ม 09:00 น.', created_at: new Date(Date.now() - 3600000).toISOString(), profiles: { username: 'Traveler' } }]; },
  async getExpeditionLog() { return [{ type: 'fog', user: 'BangRak', detail: 'เขตธนบุรี', ts: new Date(Date.now() - 7200000).toISOString() }]; },
  subscribeGuildMembers() { return emptySubscription(); },
  subscribeGuildPresence() {
    const channel = { presenceState() { return window.__visualPresence ?? {}; }, track() {}, unsubscribe() {} };
    return channel;
  },
  openRallyChannel() { const channel = { on() { return channel; }, unsubscribe() {} }; return channel; }
};
const Community = {
  async getPosts() { return window.__visualForumPosts ?? []; }, async getReplies() { return []; },
  async likePost() {}, async unlikePost() {}, async flagPost() {}
};
window.DB = { Auth, Profiles, Districts, Figures, Artifacts, Lore, Missions, Notifications, Leaderboard, Coop, Community };
`;

async function prepare(page, { authenticated = false } = {}) {
  await page.route(/https:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com)\/.*\.js(?:\?.*)?$/, route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('tam_roi_onboarded', 'true');
    localStorage.setItem('tam_roi_home', JSON.stringify({ id: 'phra-nakhon', lat: 13.7563, lng: 100.5018, name_th: 'พระนคร', name_en: 'Phra Nakhon' }));
    localStorage.removeItem('tamroi_active_tab');
  });
  if (authenticated) {
    await page.route('**/js/supabase-client.js', route => route.fulfill({ contentType: 'application/javascript', body: MOCK_DB_SCRIPT }));
    await page.route('**/js/map.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: `window.MapModule = { init() { document.getElementById('map-view')?.classList.add('map-texture-fallback'); }, resize() {}, getLoreNodes() { return []; } };`,
    }));
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/**', route => route.abort());
  }
  await page.route('https://*.basemaps.cartocdn.com/**', route => route.abort());
  await page.route('https://tiles.openfreemap.org/**', route => route.abort());
}

async function settle(page) {
  await page.waitForSelector('body');
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    document.querySelectorAll('.bottom-sheet.open').forEach(sheet => sheet.classList.remove('open'));
    document.getElementById('sheet-overlay')?.classList.remove('active');
    document.querySelectorAll('.toast-container, .toast-app, .toast').forEach(toast => toast.remove());
  });
}

async function expectNoLayoutLeaks(page, label) {
  const report = await page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const overflow = [...document.querySelectorAll('body *')]
      .filter(visible)
      .filter(element => !element.closest('.leaflet-pane, .maplibregl-canvas-container'))
      .map(element => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.left < -1 || rect.right > innerWidth + 1)
      .map(({ element, rect }) => `${element.tagName.toLowerCase()}#${element.id}.${element.className}: ${Math.round(rect.left)}..${Math.round(rect.right)}`)
      .slice(0, 12);

    const headerItems = [...document.querySelectorAll('.top-bar > *')].filter(visible).map(element => element.getBoundingClientRect());
    const headerOverlap = headerItems.some((a, index) => headerItems.slice(index + 1).some(b => a.right > b.left + 1 && b.right > a.left + 1));
    return { documentOverflow: document.documentElement.scrollWidth - innerWidth, overflow, headerOverlap };
  });
  expect(report, `${label}: ${JSON.stringify(report)}`).toEqual({ documentOverflow: 0, overflow: [], headerOverlap: false });
}

test.use({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
test.setTimeout(60000);

test('capture entry and auth screens', async ({ page }) => {
  await prepare(page);
  await page.goto('/index.html', { waitUntil: 'commit' });
  await settle(page);
  await expectNoLayoutLeaks(page, 'landing');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-landing.png`, animations: 'disabled' });

  await page.goto('/login.html?mode=login', { waitUntil: 'commit' });
  await settle(page);
  await expectNoLayoutLeaks(page, 'login');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login.png`, animations: 'disabled' });

  await page.locator('.auth-tab[data-tab="register"]').click();
  await page.waitForTimeout(150);
  await expectNoLayoutLeaks(page, 'register');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-register.png`, animations: 'disabled' });
});

test('capture onboarding screen', async ({ page }) => {
  await prepare(page, { authenticated: true });
  await page.addInitScript(() => localStorage.removeItem('tam_roi_onboarded'));
  await page.goto('/onboarding.html', { waitUntil: 'commit' });
  await settle(page);
  await expectNoLayoutLeaks(page, 'onboarding');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-onboarding.png`, animations: 'disabled' });
});

test('capture all app tabs', async ({ page }) => {
  await prepare(page, { authenticated: true });
  await page.goto('/app.html', { waitUntil: 'commit' });
  await settle(page);
  await page.waitForFunction(() => window.AppCore?.App?.user, undefined, { timeout: 15000 });

  const tabs = [
    ['map', '05-app-map.png'],
    ['collection', '06-app-collection.png'],
    ['mission', '07-app-mission.png'],
    ['community', '08-app-community.png'],
  ];
  for (const [tab, filename] of tabs) {
    await page.evaluate(name => window.AppCore?.switchTab(name), tab);
    await page.waitForTimeout(650);
    await page.evaluate(() => {
      document.querySelectorAll('.bottom-sheet.open').forEach(sheet => sheet.classList.remove('open'));
      document.getElementById('sheet-overlay')?.classList.remove('active');
      document.querySelectorAll('.toast-container, .toast-app, .toast').forEach(toast => toast.remove());
    });
    await expectNoLayoutLeaks(page, `app-${tab}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${filename}`, animations: 'disabled' });
  }
});

test('capture populated My Group and forum states', async ({ page }) => {
  const guildState = {
    guild: {
      id: 'guild-bkk-01', name: 'ปลาหมึกนักสำรวจ', invite_code: 'BKK026', myRole: 'leader',
      description: 'ทีมสำรวจประวัติศาสตร์กรุงเทพฯ แบบเดินจริง เก็บจริง เรียนรู้ร่วมกัน',
      announcement: 'ภารกิจสัปดาห์นี้: ตามรอยชุมชนริมน้ำฝั่งธนบุรี',
    },
    members: [
      { user_id: 'aaaaaaaa-0000-0000-0000-000000000001', role: 'leader', profiles: { username: 'Traveler', avatar_url: null } },
      { user_id: 'member-02', role: 'member', profiles: { username: 'HuaLamphong', avatar_url: null } },
      { user_id: 'member-03', role: 'member', profiles: { username: 'BangRak', avatar_url: null } },
      { user_id: 'member-04', role: 'member', profiles: { username: 'TalatNoi', avatar_url: null } },
    ],
  };
  const forumPosts = [
    { id: 'post-1', user_id: 'member-02', content: 'เมื่อเช้าไปตามรอยสถานีหัวลำโพงมา รายละเอียดสถาปัตยกรรมด้านหน้าสวยมาก!', created_at: new Date(Date.now() - 18 * 60000).toISOString(), profiles: { username: 'HuaLamphong', avatar_url: null }, likeCount: 12, likedByMe: true },
    { id: 'post-2', user_id: 'member-03', content: 'ใครมีข้อมูลเรื่องชุมชนกุฎีจีนเพิ่มเติมบ้างครับ อยากเตรียมตัวก่อนภารกิจกลุ่มวันเสาร์', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), profiles: { username: 'BangRak', avatar_url: null }, likeCount: 7, likedByMe: false },
    { id: 'post-3', user_id: 'member-04', content: 'แชร์พิกัดร้านกาแฟเก่าแถวตลาดน้อย อยู่ใกล้จุด Lore เดินต่อกันได้พอดีเลย', created_at: new Date(Date.now() - 5 * 3600000).toISOString(), profiles: { username: 'TalatNoi', avatar_url: null }, likeCount: 19, likedByMe: false },
  ];

  await page.addInitScript(({ guildState, forumPosts, userId }) => {
    window.__visualGuild = guildState;
    window.__visualForumPosts = forumPosts;
    window.__visualPresence = {
      online: [{ user_id: userId }, { user_id: 'member-02' }, { user_id: 'member-03' }],
    };
  }, { guildState, forumPosts, userId: MOCK_USER.id });
  await prepare(page, { authenticated: true });
  await page.goto('/app.html', { waitUntil: 'commit' });
  await settle(page);
  await page.waitForFunction(() => window.AppCore?.App?.user, undefined, { timeout: 15000 });
  await page.evaluate(() => window.AppCore?.switchTab('community'));
  await page.waitForTimeout(400);

  await page.locator('[data-community-tab="mygroup"]').click();
  await page.waitForTimeout(700);
  await expect(page.locator('#guild-panel .guild-name')).toContainText('ปลาหมึกนักสำรวจ');
  await expectNoLayoutLeaks(page, 'app-my-group');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/09-app-my-group.png`, animations: 'disabled' });

  await page.locator('[data-community-tab="discuss"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator('.forum-post')).toHaveCount(3);
  await expectNoLayoutLeaks(page, 'app-forum');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-app-forum.png`, animations: 'disabled' });
});

test('375px compact-phone layout has no horizontal leaks', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await prepare(page, { authenticated: true });
  await page.goto('/app.html', { waitUntil: 'commit' });
  await settle(page);
  await page.waitForFunction(() => window.AppCore?.App?.user, undefined, { timeout: 15000 });
  for (const tab of ['map', 'collection', 'mission', 'community']) {
    await page.evaluate(name => window.AppCore?.switchTab(name), tab);
    await page.waitForTimeout(300);
    await expectNoLayoutLeaks(page, `375px-${tab}`);
  }
});
