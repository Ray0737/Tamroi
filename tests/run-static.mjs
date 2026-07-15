import { spawnSync } from 'node:child_process';

const tests = [
  'tests/lore-static.test.mjs',
  'tests/remaining-static.test.mjs',
  'tests/prod-readiness-static.test.mjs',
  'tests/district-seed-static.test.mjs',
  'tests/env-policy-static.test.mjs',
  'tests/grid-fog-static.test.mjs',
  'tests/coop-static.test.mjs',
  'tests/new-features-static.test.mjs',
  'tests/land-verification-static.test.mjs',
];

let failed = false;

tests.forEach(test => {
  const result = spawnSync(process.execPath, [test], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
});

process.exit(failed ? 1 : 0);
