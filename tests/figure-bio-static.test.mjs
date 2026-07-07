// figure-bio-static.test.mjs — static regression for Figure Biography + Graph feature
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = p => resolve(__dir, '..', p);

let pass = 0, fail = 0;
function ok(label, cond) {
  if (cond) { console.log(`  ✓ ${label}`); pass++; }
  else       { console.error(`  ✗ ${label}`); fail++; }
}

// ── Patch file exists ────────────────────────────────
const bioSql = readFileSync(root('supabase/patch_figure_bio.sql'), 'utf8');
ok('patch_figure_bio.sql exists', bioSql.length > 0);
ok('patch_figure_bio: figure_relations CREATE TABLE', bioSql.includes('CREATE TABLE IF NOT EXISTS figure_relations'));
ok('patch_figure_bio: RLS enabled', bioSql.includes('ENABLE ROW LEVEL SECURITY'));
ok('patch_figure_bio: public SELECT policy', bioSql.includes('FOR SELECT USING (true)'));
ok('patch_figure_bio: WHERE EXISTS FK guard', bioSql.includes('WHERE EXISTS'));
ok('patch_figure_bio: bio_th column', bioSql.includes('bio_th'));
ok('patch_figure_bio: birth_year column', bioSql.includes('birth_year'));

// ── supabase-client.js new methods ──────────────────
const client = readFileSync(root('js/supabase-client.js'), 'utf8');
ok('supabase-client: getBio', client.includes('async getBio('));
ok('supabase-client: getRelations', client.includes('async getRelations('));
ok('supabase-client: getAllRelations', client.includes('async getAllRelations('));
ok('supabase-client: Lore.getForFigure', client.includes('async getForFigure('));

// ── collection.js escapeHtml usage in new paths ─────
const collection = readFileSync(root('js/collection.js'), 'utf8');
ok('collection: _fillBioSections function', collection.includes('_fillBioSections'));
ok('collection: escapeHtml used in relation chip', collection.includes("escapeHtml(r.name_th"));
ok('collection: escapeHtml used for lore name', collection.includes("escapeHtml(node.name_th"));
ok('collection: _openLoreFromModal exported', collection.includes('_openLoreFromModal'));
ok('collection: _goToMap exported', collection.includes('_goToMap'));

// ── figure-graph.js module ───────────────────────────
const graph = readFileSync(root('js/figure-graph.js'), 'utf8');
ok('figure-graph.js: FigureGraphModule IIFE', graph.includes('const FigureGraphModule'));
ok('figure-graph.js: open(figureId) exported', graph.includes('return { open, close }'));
ok('figure-graph.js: window.FigureGraphModule', graph.includes('window.FigureGraphModule'));
ok('figure-graph.js: focus function', graph.includes('function _focus('));
ok('figure-graph.js: rAF camera', graph.includes('requestAnimationFrame'));
ok('figure-graph.js: prefers-reduced-motion', graph.includes('prefers-reduced-motion'));

// ── app.html wired up ────────────────────────────────
const html = readFileSync(root('app.html'), 'utf8');
ok('app.html: figure-graph.css link', html.includes('figure-graph.css'));
ok('app.html: figure-graph.js script', html.includes('figure-graph.js'));
ok('app.html: modal-dialog-scrollable', html.includes('modal-dialog-scrollable'));
ok('app.html: btn-figure-graph', html.includes('btn-figure-graph'));
ok('app.html: figure-graph-overlay div', html.includes('figure-graph-overlay'));
ok('app.html: modal-figure-relations section', html.includes('modal-figure-relations'));
ok('app.html: modal-figure-lore section', html.includes('modal-figure-lore'));
ok('app.html: modal-figure-locations section', html.includes('modal-figure-locations'));

// ── map.js flyToLocation ─────────────────────────────
const mapJs = readFileSync(root('js/map.js'), 'utf8');
ok('map.js: flyToLocation defined', mapJs.includes('function flyToLocation('));
ok('map.js: flyToLocation exported', mapJs.includes('flyToLocation,'));

// ── Summary ──────────────────────────────────────────
console.log(`\n${pass + fail} checks — ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
