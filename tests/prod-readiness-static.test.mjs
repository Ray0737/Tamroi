import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const dbJs = read('js/supabase-client.js');
const buildJs = read('build.js');
const progress = read('docs/progress.md');
const agents = read('AGENTS.md');
const devPlan = read('docs/dev-plan.md');

assert(dbJs.includes('emailRedirectTo'), 'Auth.signUp must set emailRedirectTo for production verification');
assert(dbJs.includes('/login.html'), 'emailRedirectTo should return users to login.html');
assert(!buildJs.includes('gitignored and never committed'), 'build.js docs must not call env.js gitignored');
assert(existsSync(new URL('supabase/patch_district_seed.sql', root)), 'district seed patch must exist for DB coverage');
assert(existsSync(new URL('docs/production-smoke.md', root)), 'production smoke checklist doc must exist');
assert(progress.includes('patch_district_seed.sql'), 'docs/progress.md must mention district seed patch');
assert(agents.includes('patch_district_seed.sql'), 'AGENTS.md must mention district seed patch');
assert(devPlan.includes('production-smoke.md'), 'docs/dev-plan.md must mention production smoke checklist');
