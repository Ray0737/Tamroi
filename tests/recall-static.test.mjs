import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const assert = (c, msg) => { if (!c) throw new Error(msg); };

const db = read('js/supabase-client.js');
assert(db.includes('getRecallMissions'), 'DB.Missions must have getRecallMissions');
assert(db.includes('completeRecall'), 'DB.Missions must have completeRecall');
assert(db.includes('getRecallQuestions'), 'DB.Lore must have getRecallQuestions');
assert(db.includes('const Debates'), 'supabase-client.js must define Debates namespace');
assert(db.includes('getForFigure'), 'DB.Debates must have getForFigure');
assert(db.includes('get_debate_stats'), 'DB.Debates must call get_debate_stats RPC');
assert(db.includes('getJigsawAssignments'), 'DB.Coop must have getJigsawAssignments');
assert(db.includes('assignJigsawChapters'), 'DB.Coop must have assignJigsawChapters');
assert(db.includes('postJigsawSummary'), 'DB.Coop must have postJigsawSummary');
console.log('✓ recall static checks passed');
