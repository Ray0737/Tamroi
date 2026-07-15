// Systematic Verification Process for support_nodes + watchtowers coordinates.
// Regenerate the checklist:              node scripts/verification-checklist.mjs
// Mark one point after manual review:    node scripts/verification-checklist.mjs mark <id> verified|flagged "note"
//   (mark requires SUPABASE_SERVICE_KEY env var — never commit that key)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const envText = readFileSync(join(ROOT, 'js/env.js'), 'utf8');
const SUPABASE_URL = envText.match(/SUPABASE_URL:\s*'([^']+)'/)[1];
const ANON_KEY = envText.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/)[1];

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=district_id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`${table} fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function markStatus(table, id, status, note) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_KEY env var required to write a verification status');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ verification_status: status, verified_note: note ?? null, verified_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`${table} update failed: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  if (rows.length === 0) throw new Error(`No row with id=${id} in ${table}`);
  return rows[0];
}

function mapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

async function generateChecklist() {
  const [nodes, towers] = await Promise.all([fetchTable('support_nodes'), fetchTable('watchtowers')]);
  const rows = [
    ...nodes.map(n => ({ ...n, kind: 'support_node' })),
    ...towers.map(t => ({ ...t, kind: 'watchtower' })),
  ];
  const pending = rows.filter(r => r.verification_status === 'pending').length;
  const flagged = rows.filter(r => r.verification_status === 'flagged').length;
  const verified = rows.filter(r => r.verification_status === 'verified').length;

  const lines = [
    '# Support Node / Watchtower Land Verification',
    '',
    `Generated ${new Date().toISOString()} — ${rows.length} points total: ${verified} verified, ${flagged} flagged, ${pending} pending.`,
    '',
    'Each point must be manually confirmed as public land (or flagged as restricted/private) before ship.',
    'Mark a point: `node scripts/verification-checklist.mjs mark <id> verified|flagged "note"`',
    '',
    '| Status | Kind | ID | Name | District | Coords | Note |',
    '|---|---|---|---|---|---|---|',
    ...rows.map(r => {
      const badge = r.verification_status === 'verified' ? '✅' : r.verification_status === 'flagged' ? '🚩' : '⬜';
      const name = r.name ?? r.name_th ?? r.name_en ?? '';
      return `| ${badge} ${r.verification_status} | ${r.kind} | \`${r.id}\` | ${name} | ${r.district_id ?? ''} | [${r.lat}, ${r.lng}](${mapsLink(r.lat, r.lng)}) | ${r.verified_note ?? ''} |`;
    }),
    '',
  ];
  writeFileSync(join(ROOT, 'docs/land_verification.md'), lines.join('\n'));
  console.log(`docs/land_verification.md written — ${verified} verified, ${flagged} flagged, ${pending} pending`);
}

const [, , cmd, id, status, ...noteParts] = process.argv;
if (cmd === 'mark') {
  if (!id || !['verified', 'flagged'].includes(status)) {
    console.error('Usage: node scripts/verification-checklist.mjs mark <id> verified|flagged "note"');
    process.exit(1);
  }
  const table = id.startsWith('node-') ? 'support_nodes' : 'watchtowers';
  await markStatus(table, id, status, noteParts.join(' '));
  await generateChecklist();
} else {
  await generateChecklist();
}
