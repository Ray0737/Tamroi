import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const mapJs = read('js/map.js');
const schema = read('supabase/schema.sql');
const patch = read('supabase/patch_district_seed.sql');
const combinedSql = `${schema}\n${patch}`;

const districtBlock = mapJs.match(/const MOCK_DISTRICTS = \[([\s\S]*?)\n  \];/);
assert(districtBlock, 'map.js must keep MOCK_DISTRICTS parseable');

const districtIds = [...districtBlock[1].matchAll(/id:\s*'([^']+)'/g)].map(match => match[1]);
assert(districtIds.length >= 12, 'MVP map should expose the current Bangkok/Nonthaburi district set');

districtIds.forEach(id => {
  assert(combinedSql.includes(`'${id}'`), `Supabase district seed must include ${id}`);
});

assert(patch.includes('ON CONFLICT (id) DO UPDATE'), 'district seed patch must be safely re-runnable');
