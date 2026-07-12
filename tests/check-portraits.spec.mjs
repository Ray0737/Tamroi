import { test, expect } from '/home/papajittan/Documents/node_modules/playwright/test.mjs';

const MOCK_USER = { id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'traveler@example.com', user_metadata: { full_name: 'Traveler' } };
const MOCK_FIGURES = [
  { id: 'king-naresuan', name_th: 'สมเด็จพระนเรศวรมหาราช', name_en: 'King Naresuan the Great', class: 'S', legacy_pts: 400, district_id: 'ayutthaya' },
  { id: 'king-taksin',   name_th: 'สมเด็จพระเจ้าตากสินมหาราช', name_en: 'King Taksin the Great', class: 'S', legacy_pts: 500, district_id: 'thonburi' },
  { id: 'thao',          name_th: 'ท้าวสุรนารี', name_en: 'Thao Suranari', class: 'C', legacy_pts: 50, district_id: 'korat' },
];
const MOCK_DB = `
const user = ${JSON.stringify(MOCK_USER)};
const sub = () => ({ unsubscribe() {} });
window.DB = {
  Auth: { async getSession() { return { user, access_token:'t', expires_at:9999999999 }; }, onStateChange() { return { data:{ subscription: sub() } }; }, async getUser() { return user; }, async signOut() {} },
  Profiles: { async getOrCreate() { return { id:user.id, username:'T', legacy_score:0, archive_count:0, province:'Bangkok', avatar_url:null }; }, async get() { return { id:user.id, username:'T', legacy_score:0 }; } },
  Districts: { async getAll() { return []; }, async getCleared() { return []; }, async getVisitedSupportNodes() { return []; }, async getDiscoveryPercent() { return 0; }, async getUserState() { return []; } },
  Figures: { async getAll() { return ${JSON.stringify(MOCK_FIGURES)}; }, async getUserCaptures() { return []; }, async getBio() { return null; }, async getRelations() { return []; }, async getAllRelations() { return []; } },
  Artifacts: { async getAll() { return []; }, async getUserArtifacts() { return []; } },
  Lore: { async getUserUnlocked() { return []; }, async getAll() { return []; }, async getForFigure() { return []; }, async getAssessments() { return []; }, async getRecallQuestions() { return []; } },
  Missions: { async getDailyChallenges() { return []; }, async getRecallMissions() { return []; } },
  Notifications: { async getRecent() { return []; }, subscribe() { return sub(); } },
  Leaderboard: { async get() { return []; }, subscribe(cb) { cb([]); return sub(); } },
  Coop: { async getMyGuild() { return null; }, async getMyMemberships() { return []; }, async getGuildLeaderboard() { return []; }, async getGuildMembers() { return []; }, async getCollabMissions() { return []; }, subscribeGuildChanges() { return sub(); }, async getAllGuildCheckins() { return []; }, async getGuildClearedDistrictIds() { return []; }, async getJoinRequests() { return []; } },
  Debates: { async getForFigure() { return null; } },
  Community: { async getPosts() { return []; }, async getReplies() { return []; }, async likePost() {}, async unlikePost() {}, async flagPost() {} },
};
`;

test.use({ viewport: { width: 430, height: 932 } });
test.setTimeout(30000);

test('figure portraits show SVG fallback when wiki images fail', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tam_roi_onboarded', 'true');
    localStorage.setItem('tam_roi_home', JSON.stringify({ id: 'phra-nakhon', lat: 13.7563, lng: 100.5018, name_th: 'พระนคร' }));
  });
  await page.route('**/js/supabase-client.js', route => route.fulfill({ contentType: 'application/javascript', body: MOCK_DB }));
  await page.route('**/js/map.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.MapModule = { init() {}, resize() {}, getLoreNodes() { return []; } };` }));
  await page.route('https://upload.wikimedia.org/**', route => route.abort()); // simulate hotlink block
  await page.route('https://*.basemaps.cartocdn.com/**', route => route.abort());
  await page.route('https://tiles.openfreemap.org/**', route => route.abort());

  await page.goto('/app.html', { waitUntil: 'commit' });
  await page.waitForFunction(() => window.AppCore?.App?.user, undefined, { timeout: 15000 });

  await page.evaluate(() => window.AppCore?.switchTab('collection'));
  await page.waitForTimeout(2500); // allow images to fail + onerror to fire

  const result = await page.evaluate(() => {
    const portraits = [...document.querySelectorAll('.figure-portrait')];
    return {
      total: portraits.length,
      empty: portraits.filter(p => {
        const img = p.querySelector('img');
        const imgVisible = img && img.style.display !== 'none';
        const hasSvg = !!p.querySelector('svg');
        return !imgVisible && !hasSvg;
      }).length,
    };
  });

  console.log('Portrait check:', result);
  await page.screenshot({ path: '/tmp/figure-portrait-fallback.png' });
  expect(result.total, 'no figure-portrait elements found').toBeGreaterThan(0);
  expect(result.empty, 'some portraits are empty (no svg or visible img)').toBe(0);
});
