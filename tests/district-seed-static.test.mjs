import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const mapJs = read('js/map.js');
const patch = read('supabase/patch_district_seed.sql');

assert(mapJs.includes('DB.Districts.getAll'), 'map.js must load districts from DB (not hardcoded MOCK_DISTRICTS)');
assert(patch.includes('ON CONFLICT (id) DO UPDATE'), 'district seed patch must be safely re-runnable');
