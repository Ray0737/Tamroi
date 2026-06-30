// Guild panel + ranking Playwright tests
// Verifies: (1) guild name is white in panel, (2) panel shows guild after init (no race)
import { test, expect } from '/home/papajittan/Documents/node_modules/playwright/test.mjs';

const USER_ID  = 'aaaaaaaa-0000-0000-0000-000000000001';
const GUILD_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const MOCK_USER = { id: USER_ID, email: 'pw@test.com', user_metadata: { full_name: 'PwTest' } };

const MOCK_GUILD_STATE = {
  guild: { id: GUILD_ID, name: 'ทีมปลามึก', invite_code: 'ABC123', max_members: 6, created_by: USER_ID, myRole: 'leader' },
  members: [{ user_id: USER_ID, role: 'leader', joined_at: new Date().toISOString(), profiles: { username: 'PwTest' } }]
};

// Minimal supabase-client.js mock — replaces the real file so no Supabase JWT dance needed
const MOCK_DB_SCRIPT = `
const Auth = {
  async getSession() {
    return { user: ${JSON.stringify(MOCK_USER)}, access_token: 'fake', expires_at: 9999999999 };
  },
  onStateChange(cb) { return { data: { subscription: { unsubscribe() {} } } }; },
  async signOut() {},
  async signInWithOAuth() {},
  async getUser() { return ${JSON.stringify(MOCK_USER)}; }
};

const Profiles = {
  async getOrCreate() { return { id: '${USER_ID}', username: 'PwTest', legacy_score: 0, avatar_url: null, province: 'Bangkok' }; },
  async get()        { return { id: '${USER_ID}', username: 'PwTest', legacy_score: 0 }; },
  async update()     { return {}; },
  async addLegacyPoints() {},
};

const Districts = {
  async getAll()               { return []; },
  async getCleared()           { return []; },
  async markCleared()          { return {}; },
  async getVisitedSupportNodes() { return []; },
  async updateNodeVisit()      {},
};

const Figures    = { async getAll() { return []; }, async getCaptures() { return []; }, async capture() {} };
const Artifacts  = { async getAll() { return []; }, async getUnlocked() { return []; } };
const Lore       = { async getAll() { return []; }, async getUserUnlocked() { return []; }, async unlock() {} };
const Quiz       = { async getForFigure() { return []; } };
const Leaderboard = {
  async getTop() { return []; },
  async getTopWeekly() { return []; },
  async getTopMonthly() { return []; },
  subscribe(cb) { return { unsubscribe() {} }; },
};
const SupportNodes     = { async getAll() { return []; } };
const BtsMrtStations   = { async getAll() { return []; } };
const Notifications    = { async getRecent() { return []; }, subscribe(u,cb) { return { unsubscribe(){} }; } };
const Missions         = { async getActive() { return []; }, async getDailyChallenges() { return []; } };
const Raid             = {
  async getActiveSession() { return null; },
  async createSession()    { return {}; },
  async joinSession()      { return {}; },
  async getSessionMembers(){ return []; },
  subscribe(cb)            { return { unsubscribe(){} }; }
};
const Discussion  = { async getForFigure()   { return []; }, async post() {}, async flag() {} };
const Community   = { async getPosts()       { return []; }, async post() {}, async flag() {} };

// Coop with guild state — overridden per test via window.__mockGuildState
const Coop = {
  async getMyGuild()           { return window.__mockGuildState ?? null; },
  async createGuild(name)      { return { id: '${GUILD_ID}', name, invite_code: 'NEW001' }; },
  async getGuildMembers()      { return MOCK_GUILD_STATE.members; },
  async getGuildLeaderboard()  { return []; },
  async getMyMemberships()     { return {}; },
  async getCollabMissions()    { return []; },
  async getAllGuildCheckins()   { return []; },
  async getMissionCheckins()   { return []; },
  async joinGuild()            {},
  async leaveGuild()           {},
  async kickMember()           {},
  async deleteGuild()          {},
  async searchGuilds()         { return []; },
  async sendJoinRequest()      {},
  async approveRequest()       {},
  async rejectRequest()        {},
  async checkInToMission()     {},
  async getPendingRequestForUser() { return null; },
  subscribeGuildPresence()     { return { presenceState(){ return {}; }, track(){}, unsubscribe(){} }; },
  subscribeGuildMembers(id,cb) { return { unsubscribe(){} }; },
  subscribeMissionProgress(m,g,cb) { return { unsubscribe(){} }; },
  subscribeGuildChanges(cb)    { return { unsubscribe(){} }; },
};

window.DB = { Auth, Profiles, Districts, Figures, SupportNodes, BtsMrtStations,
              Artifacts, Leaderboard, Lore, Quiz, Notifications, Missions, Coop, Raid, Discussion, Community };
`;

async function mockDB(page) {
  await page.route('**/js/supabase-client.js', route => {
    route.fulfill({ contentType: 'application/javascript', body: MOCK_DB_SCRIPT });
  });
  // Block external resources that might slow things down
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**', route => route.abort());
  await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
  await page.route('https://*.tile.carto.com/**', route => route.abort());
}

async function dismissSheets(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.bottom-sheet.open').forEach(s => s.classList.remove('open'));
    const ov = document.getElementById('sheet-overlay');
    if (ov) ov.classList.remove('active');
  });
  await page.waitForTimeout(100);
}

async function navigateToMyGroup(page) {
  await page.evaluate(() => {
    window.AppCore?.switchTab('community');
    document.querySelector('[data-community-tab="mygroup"]')?.click();
  });
  await page.waitForTimeout(600);
}

test.describe('Guild module', () => {
  test('panel shows guild name when user is in a guild', async ({ page }) => {
    await mockDB(page);
    // Set state BEFORE page loads so it's available when init() runs
    await page.addInitScript(g => { window.__mockGuildState = g; }, MOCK_GUILD_STATE);
    await page.goto('/app.html');
    await page.waitForTimeout(800);
    await dismissSheets(page);

    await navigateToMyGroup(page);

    const panel = page.locator('#guild-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('h3')).toContainText('ทีมปลามึก');
    await expect(panel).not.toContainText('ยังไม่มีกลุ่ม');
  });

  test('panel shows "ยังไม่มีกลุ่ม" when user has no guild', async ({ page }) => {
    await mockDB(page);
    // __mockGuildState not set → undefined ?? null → null → no guild
    await page.goto('/app.html');
    await page.waitForTimeout(800);
    await dismissSheets(page);

    await navigateToMyGroup(page);
    await expect(page.locator('#guild-panel')).toContainText('ยังไม่มีกลุ่ม');
  });

  test('guild name in panel has white computed color', async ({ page }) => {
    await mockDB(page);
    await page.addInitScript(g => { window.__mockGuildState = g; }, MOCK_GUILD_STATE);
    await page.goto('/app.html');
    await page.waitForTimeout(800);
    await dismissSheets(page);

    await navigateToMyGroup(page);

    const nameEl = page.locator('#guild-panel h3');
    await expect(nameEl).toBeVisible();
    await expect(nameEl).toHaveCSS('color', 'rgb(255, 255, 255)');
  });

  test('guild leaderboard section becomes visible on guild view toggle', async ({ page }) => {
    await mockDB(page);
    await page.addInitScript(g => { window.__mockGuildState = g; }, MOCK_GUILD_STATE);
    await page.goto('/app.html');
    await page.waitForTimeout(800);
    await dismissSheets(page);

    await page.evaluate(() => {
      window.AppCore?.switchTab('community');
      document.querySelector('#leaderboard-view [data-view="guild"]')?.click();
    });
    await page.waitForTimeout(400);

    await expect(page.locator('#guild-leaderboard-section')).not.toHaveAttribute('hidden');
    await expect(page.locator('#guild-leaderboard-list')).toBeVisible();
  });
});
