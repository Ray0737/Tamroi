import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const appHtml = read('app.html');
const appJs = read('js/app.js');
const mapJs = read('js/map.js');
const dbJs = read('js/supabase-client.js');
const collectionJs = read('js/collection.js');
const leaderboardJs = read('js/leaderboard.js');
const sql = read('supabase/patch_lore.sql');

assert(mapJs.includes('visitSupportNode'), 'map.js must handle support node visit button clicks');
assert(mapJs.includes('visitedSupportNodeIds'), 'map.js must prevent duplicate local node visits');
assert(mapJs.includes('renderSupportGate'), 'map.js must render support gate progress or encounter button');
assert(sql.includes('increment_node_visit'), 'patch_lore.sql must add increment_node_visit RPC');
assert(appHtml.includes('id="quiz-sheet"'), 'app.html must include quiz bottom sheet');
assert(mapJs.includes('openQuizForFigure'), 'map.js must open quiz flow for map figures');
assert(mapJs.includes('submitQuizAnswer'), 'map.js must submit quiz answers');
assert(collectionJs.includes('markCaptured'), 'collection.js must expose card refresh after capture');
assert(dbJs.includes('getDiscoveryPercent'), 'DB.Districts must expose discovery percent calculation');
assert(mapJs.includes('updateDiscoveryPercentFromDB'), 'map.js must update map discovery percent from DB');
assert(mapJs.includes('BTS_MRT_STATIONS'), 'map.js must define BTS/MRT bonus station data');
assert(mapJs.includes('getTransportMultiplier'), 'map.js must apply BTS/MRT point multiplier helper');
assert(dbJs.includes('user-notifications') && dbJs.includes('subscribe(userId'), 'DB.Notifications must expose Realtime subscription');
assert(appJs.includes('subscribeNotifications'), 'app.js must subscribe to live notifications');
assert(leaderboardJs.includes('patchPlayerRow'), 'leaderboard.js must patch changed Realtime rows');
