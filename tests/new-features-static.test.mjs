import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (c, msg) => { if (!c) throw new Error(msg); };

// ── Retrieval Practice SQL ────────────────────────────────────────────────────
assert(existsSync(new URL('supabase/patch_retrieval_practice.sql', root)),
       'patch_retrieval_practice.sql must exist');
const rpSql = read('supabase/patch_retrieval_practice.sql');
assert(rpSql.includes('recall_due_at'), 'user_lore must gain recall_due_at');
assert(rpSql.includes('set_recall_due_at'), 'recall_due_at trigger must be defined');
assert(rpSql.includes('lore_recall'), 'daily_challenges must support lore_recall type');
console.log('✓ Retrieval Practice SQL checks passed');

// ── Retrieval Practice API ────────────────────────────────────────────────────
const db = read('js/supabase-client.js');
assert(db.includes('getRecallMissions'), 'DB.Missions must have getRecallMissions');
assert(db.includes('completeRecall'), 'DB.Missions must have completeRecall');
assert(db.includes('getRecallQuestions'), 'DB.Lore must have getRecallQuestions');
console.log('✓ Retrieval Practice API checks passed');

// ── Retrieval Practice UI ─────────────────────────────────────────────────────
const missionsJs = read('js/missions.js');
assert(missionsJs.includes('lore_recall'), 'missions.js must handle lore_recall type');
assert(missionsJs.includes('openRecall'), 'missions.js must export openRecall');
assert(missionsJs.includes('_handleRecallAnswer'), 'missions.js must have _handleRecallAnswer');
const appHtml = read('app.html');
assert(appHtml.includes('recall-modal'), 'app.html must have #recall-modal');
console.log('✓ Retrieval Practice UI checks passed');

// ── Unsolved History SQL ──────────────────────────────────────────────────────
assert(existsSync(new URL('supabase/patch_debates.sql', root)),
       'patch_debates.sql must exist');
const debateSql = read('supabase/patch_debates.sql');
assert(debateSql.includes('history_debates'), 'history_debates table must be defined');
assert(debateSql.includes('debate_votes'), 'debate_votes table must be defined');
assert(debateSql.includes('get_debate_stats'), 'get_debate_stats RPC must be defined');
assert(debateSql.includes('SECURITY DEFINER'), 'get_debate_stats must be SECURITY DEFINER');
console.log('✓ Unsolved History SQL checks passed');

// ── Unsolved History API + UI ─────────────────────────────────────────────────
assert(db.includes('const Debates'), 'supabase-client.js must define Debates namespace');
assert(db.includes('getForFigure'), 'DB.Debates must have getForFigure');
assert(db.includes('get_debate_stats'), 'DB.Debates must call get_debate_stats RPC');
assert(existsSync(new URL('js/debates.js', root)), 'js/debates.js must exist');
const debatesJs = read('js/debates.js');
assert(debatesJs.includes('DebateModule'), 'debates.js must define DebateModule');
assert(debatesJs.includes('open'), 'DebateModule must have open()');
assert(appHtml.includes('debate-sheet'), 'app.html must have #debate-sheet');
assert(appHtml.includes('js/debates.js'), 'app.html must load js/debates.js');
const collectionJs = read('js/collection.js');
assert(collectionJs.includes('DebateModule.open'), 'collection.js must call DebateModule.open');
console.log('✓ Unsolved History API + UI checks passed');

// ── Jigsaw Learning SQL ───────────────────────────────────────────────────────
assert(existsSync(new URL('supabase/patch_jigsaw.sql', root)),
       'patch_jigsaw.sql must exist');
const jigsawSql = read('supabase/patch_jigsaw.sql');
assert(jigsawSql.includes('chapter_index'), 'lore_nodes must gain chapter_index');
assert(jigsawSql.includes('guild_jigsaw_assignments'),
       'guild_jigsaw_assignments table must be defined');
assert(jigsawSql.includes("type IN ('checkin', 'jigsaw')"),
       'collab_missions must support jigsaw type');
console.log('✓ Jigsaw Learning SQL checks passed');

// ── Jigsaw Learning API + UI ──────────────────────────────────────────────────
assert(db.includes('getJigsawAssignments'), 'DB.Coop must have getJigsawAssignments');
assert(db.includes('assignJigsawChapters'), 'DB.Coop must have assignJigsawChapters');
assert(db.includes('postJigsawSummary'), 'DB.Coop must have postJigsawSummary');
const coopJs = read('js/coop.js');
assert(coopJs.includes('jigsaw'), 'coop.js must handle jigsaw mission type');
assert(coopJs.includes('_renderJigsawCard'), 'coop.js must define _renderJigsawCard');
assert(coopJs.includes('postJigsawSummary'), 'coop.js must expose postJigsawSummary');
console.log('✓ Jigsaw Learning API + UI checks passed');

console.log('\n✓ All new-features-static checks passed');
