import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const envJs = readFileSync(new URL('js/env.js', root), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(envJs.includes('window.ENV'), 'js/env.js must define window.ENV');
assert(envJs.includes('SUPABASE_URL'), 'js/env.js must define SUPABASE_URL');
assert(envJs.includes('SUPABASE_ANON_KEY'), 'js/env.js must define SUPABASE_ANON_KEY');
assert(!/service[_-]?role/i.test(envJs), 'js/env.js must never contain service-role keys');
assert(!/gitignored|do not commit/i.test(envJs), 'js/env.js comments must match the tracked env policy');
