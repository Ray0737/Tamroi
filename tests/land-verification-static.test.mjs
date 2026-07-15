import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// Systematic Verification Process for the 47 support_nodes + 2 watchtowers
// coordinates — every point must carry an explicit reviewed/flagged status,
// not just an unchecked "looks fine" assumption.

assert(existsSync(new URL('supabase/patch_node_verification.sql', root)), 'patch_node_verification.sql must exist');
const patch = read('supabase/patch_node_verification.sql');
assert(patch.includes('ALTER TABLE support_nodes ADD COLUMN IF NOT EXISTS verification_status'), 'support_nodes must gain verification_status');
assert(patch.includes('ALTER TABLE watchtowers ADD COLUMN IF NOT EXISTS verification_status'), 'watchtowers must gain verification_status');
assert(/CHECK \(verification_status IN \('pending', 'verified', 'flagged'\)\)/.test(patch), 'verification_status must be constrained to pending/verified/flagged');
assert(patch.includes('verified_note'), 'verification must support a reviewer note');
assert(patch.includes('verified_at'), 'verification must timestamp the review');

assert(existsSync(new URL('scripts/verification-checklist.mjs', root)), 'scripts/verification-checklist.mjs must exist');
const script = read('scripts/verification-checklist.mjs');
assert(script.includes("fetchTable('support_nodes')") && script.includes("fetchTable('watchtowers')"), 'checklist must cover both support_nodes and watchtowers');
assert(script.includes('SUPABASE_SERVICE_KEY'), 'writing a verification status must require a service key, never the public anon key');
assert(script.includes("ANON_KEY"), 'reading the checklist must use only the public anon key');
assert(!/SUPABASE_SERVICE_KEY\s*=\s*['"]/.test(script), 'service key must never be hardcoded in the script');
assert(script.includes("docs/land_verification.md"), 'checklist must regenerate the docs/land_verification.md audit trail');

console.log('land-verification-static.test.mjs OK');
