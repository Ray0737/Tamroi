import { readFileSync, existsSync } from 'node:fs';

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

assert(existsSync(new URL('supabase/patch_lore.sql', root)), 'supabase/patch_lore.sql must exist');
assert(mapJs.includes('function haversineDistance'), 'map.js must expose a private haversineDistance helper');
assert(mapJs.includes('DB.Lore.getAll'), 'map.js must load lore nodes from DB');
assert(mapJs.includes('checkLoreProximity'), 'map.js must check lore proximity from GPS updates');
assert(mapJs.includes('unlockLore'), 'map.js must unlock lore when user enters a lore radius');
assert(mapJs.includes('renderLoreMarkers'), 'map.js must render map icons for visited lore places');
assert(mapJs.includes('openVisitedLore'), 'map.js must reopen visited lore from a lore icon click');
assert(mapJs.includes("marker.on('click', () => openVisitedLore(node.id))"), 'visited lore markers must open lore on icon click');
assert(mapJs.includes('renderLoreMarkers();'), 'map.js must refresh lore icons after lore state changes');
assert(appHtml.includes('id="lore-sheet"'), 'app.html must include the lore unlock bottom sheet');
assert(appHtml.includes('id="chain-sheet"'), 'app.html must include the chain completion bottom sheet');
assert(appJs.includes('function openLoreSheet'), 'app.js must expose openLoreSheet');
assert(appJs.includes('node.is_saved'), 'reopened lore sheets must not offer duplicate Journal saves');
assert(appJs.includes('function openLoreChainSheet'), 'app.js must expose openLoreChainSheet');
assert(dbJs.includes('const Lore'), 'supabase-client.js must add DB.Lore');
assert(dbJs.includes('addLegacyPoints'), 'supabase-client.js must add DB.Profiles.addLegacyPoints');
assert(collectionJs.includes('data-filter="journal"') || appHtml.includes('data-filter="journal"'), 'Collection filters must include Journal');
assert(collectionJs.includes('renderLoreJournal'), 'collection.js must render the Lore Journal');
