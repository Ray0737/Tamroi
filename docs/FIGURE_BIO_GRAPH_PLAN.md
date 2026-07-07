# Plan — Figure Biography Detail + Relationship Graph UI

> Status: PLAN ONLY — nothing implemented yet.
> Scope: Collection tab → tap captured figure → full biography view (bio, relatives, related locations, related lore) + an interactive relationship graph overlay.

---

## ⚠️ Constraint conflict, resolved up front

The UI reference prompt asks for **React + Tailwind + Framer Motion + React Flow**.
This repo is **zero-tooling vanilla JS** (CLAUDE.md: no npm, no build step, no framework).

**Decision: adapt the design to vanilla SVG + CSS transitions.** Everything the reference
asks for (pan/zoom canvas, draggable nodes, focus animation, fade-out of unselected
nodes, radial trait labels, detail side panel, back button) is achievable with:

| Reference stack | Vanilla equivalent |
|---|---|
| React Flow canvas | one `<svg>` with a `transform` group (`translate + scale` matrix) |
| Node drag physics | `pointerdown/pointermove/pointerup` on node `<g>` elements |
| Framer Motion transitions | CSS `transition` on transform/opacity + `requestAnimationFrame` for camera easing |
| Tailwind | existing `css/variables.css` tokens + one new `css/figure-graph.css` |

If a true React template is still wanted later, it lives in a separate repo — not here.

---

## Current state (what already exists)

- `figures` table: 74 rows, has `lat`, `lng`, `era` (patch_era), `description`, `class`, `district_id`. See `docs/Db.md`.
- `lore_nodes.figure_id` **already exists** (patch_figure_quote.sql) — links a lore node/chain to a figure. Currently only used by the chain-complete sheet in map.js.
- `collection.js showDetail()`: Bootstrap modal with name/class/pts/era/description + debate button. This is the extension point.
- Lore Journal in Collection works (`renderLoreJournal`); it is *not* connected to figures yet.

**What's missing for the feature:** relatives data, per-figure lore listing in the bio, related-locations listing, richer bio fields, the graph UI.

---

## Phase A — DB (new patch: `supabase/patch_figure_bio.sql`)

```sql
-- 1. Richer bio fields (era already exists)
ALTER TABLE figures ADD COLUMN IF NOT EXISTS bio_th     TEXT;   -- long-form biography (description stays as the short card blurb)
ALTER TABLE figures ADD COLUMN IF NOT EXISTS birth_year INTEGER;
ALTER TABLE figures ADD COLUMN IF NOT EXISTS death_year INTEGER;

-- 2. Relations (edges of the graph)
CREATE TABLE IF NOT EXISTS figure_relations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id   TEXT NOT NULL REFERENCES figures(id) ON DELETE CASCADE,
  related_id  TEXT NOT NULL REFERENCES figures(id) ON DELETE CASCADE,
  relation_th TEXT NOT NULL,          -- e.g. 'พระสหาย', 'ศิษย์-อาจารย์', 'ร่วมยุค', 'คู่ขัดแย้ง'
  UNIQUE (figure_id, related_id)
);
ALTER TABLE figure_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read figure_relations" ON figure_relations FOR SELECT USING (true);
-- Rows are stored one-directional; the client queries both directions (or() filter).

-- 3. Seed: start with the obvious clusters from Db.md
--    - Pridi Banomyong ↔ Thanpuying Phunsuk (คู่สมรส)
--    - Pridi ↔ Seni Pramoj ↔ Free Thai Movement (ขบวนการเสรีไทย)
--    - Phraya Phahon ↔ Phibunsongkhram ↔ Phraya Song Suradej (คณะราษฎร 2475)
--    - Kukrit ↔ Seni Pramoj (พี่น้อง)
--    - King Naresuan ↔ Sri Suriyothai (ยุคอยุธยา)
--    - Rama-court clusters per district (Dusit royals, Rattanakosin craftsmen...)
```

**Related locations = derived, no new table** (ponytail: derive first):
1. the figure's own `lat/lng` pin,
2. `lore_nodes WHERE figure_id = :id` (each has lat/lng + name),
3. `support_nodes WHERE district_id = figure.district_id` (landmarks only).

Add a curated `figure_locations` table only if derived results prove too noisy.

---

## Phase B — Runtime API (`js/supabase-client.js`)

```js
// under Figures
async getBio(figureId)        // figures row incl. bio_th/birth_year/death_year
async getRelations(figureId)  // figure_relations where figure_id = X OR related_id = X,
                              // joined with figures(name_th, name_en, class, image_emoji)
async getAllRelations()       // all edges — used by the graph view
// under Lore
async getForFigure(figureId)  // lore_nodes where figure_id = X (public read)
```

Update CLAUDE.md Runtime APIs + FUNCTION_LOG.md in the same task.

---

## Phase C — Bio detail view (extend existing figure modal)

Keep the Bootstrap modal (`#figure-modal` in app.html) — grow it, don't replace it.
New sections below the existing bio card, each hidden when empty:

```
┌──────────────────────────────┐
│  👑  สมเด็จพระเจ้าตากสิน      │  ← existing header (emoji, name, class, pts)
│  era · พ.ศ. 2277–2325        │  ← era + birth/death years
├──────────────────────────────┤
│  ประวัติ (bio_th, long-form)  │  ← existing bio card, now uses bio_th ?? description
├──────────────────────────────┤
│  ความสัมพันธ์                 │  ← relation chips: [emoji ชื่อ · relation_th]
│  (tap chip → showDetail of   │    captured → opens their bio; not captured →
│   that figure)               │    greyed chip + 🔒
├──────────────────────────────┤
│  Lore ที่เกี่ยวข้อง            │  ← lore_nodes.figure_id = this figure
│  unlocked → tap reopens lore │    locked → "???" teaser row (drives exploration)
│  sheet (saved/read-only)     │
├──────────────────────────────┤
│  สถานที่ที่เกี่ยวข้อง          │  ← derived locations list;
│  each row: name · district   │    "ดูบนแผนที่" → close modal, switch to map tab,
│                              │    map.flyTo(location)
├──────────────────────────────┤
│  [🕸️ ดูแผนผังความสัมพันธ์]    │  ← opens the graph overlay (Phase D)
│  [ประวัติศาสตร์ที่ยังถกเถียง]  │  ← existing debate button unchanged
└──────────────────────────────┘
```

Implementation notes:
- All rendering in `collection.js showDetail()` — fetch `getBio + getRelations + Lore.getForFigure` with `Promise.allSettled`, render what resolves. No spinner blocking: header paints instantly from `allFigures` cache, sections fill in.
- `escapeHtml()` on every DB string (names, relation_th, lore content).
- "Lore ที่เกี่ยวข้อง" reuses the visual style of `renderLoreEntry()`; unlocked check via `DB.Lore.getUserUnlocked` already cached in `loreEntries`.
- This **is** the "append lore to the collection" fix: lore becomes reachable from the figure card, not only the Journal pill.

---

## Phase D — Relationship Graph overlay (`js/figure-graph.js` + `css/figure-graph.css`)

Full-screen dark overlay (`position:fixed; inset:0; background:var(--color-bg)`），above
the tab shell, below toasts. Opened from the bio modal button; closed via Back.

### Data contract (dummy-swappable, as the reference asked)

```js
const graphData = {
  nodes: [
    { id: 'fig-s-01', label: 'พระเจ้าตากสิน', sub: 'King Taksin', emoji: '👑',
      class: 'S', captured: true,
      traits: ['กอบกู้เอกราช', 'ธนบุรี', 'พ.ศ. 2310'],          // radial labels in focus state
      detail: { description: '...', era: '...', locations: [...] } },
  ],
  edges: [
    { source: 'fig-s-01', target: 'fig-a-17', label: 'ร่วมยุค' },
  ],
};
```

Built at open time from `figureNodes`-style cache + `getAllRelations()`. Non-captured
figures render as dimmed "???" nodes (silhouette, no name) — exploration teaser.

### Module layout (one IIFE, same pattern as MapModule)

```
FigureGraphModule
├─ open(figureId)  / close()
├─ _layout()        // simple radial/cluster placement by district, then user drags freely
├─ _camera          // {x, y, scale} → applied as transform on the <g> root
│   ├─ pan: pointer drag on background
│   ├─ zoom: wheel / pinch (two-pointer distance)
│   └─ flyTo(node): rAF-eased translate+scale to center node (ease-out cubic,
│                   same easing family as playFogClearSweep)
├─ _nodes           // <g class="fg-node"> per figure: <circle> avatar ring (class color),
│                   //   emoji <text>, name label <text> below
│   └─ drag: pointerdown on node captures pointer, moves node, re-renders its edges
├─ _edges           // <line class="fg-edge">, curved via <path> Q-bezier for polish
└─ _focus(node)     // focus state:
    ├─ svg root gets .fg-focused → CSS: .fg-node:not(.selected) { opacity:.15; filter:blur(1px) }
    │                              .fg-edge:not(.connected)     { opacity:.08 }
    ├─ traits appear radially: absolutely-positioned <div> chips around the node's
    │   screen position, staggered transition-delay (60ms apart) — "game-like" pop
    ├─ detail card slides in from bottom (mobile, 430px shell) with figure info
    │   + relations list + "เปิดประวัติเต็ม" → close graph, showDetail(id)
    └─ Back button (top-left) → reverse: chips fade, card slides out, camera eases
        back to saved pre-focus transform, .fg-focused removed
```

### Animation spec (the "premium" feel, no Framer Motion needed)

| Interaction | Technique | Duration/easing |
|---|---|---|
| Camera fly-to on node tap | rAF loop lerping camera x/y/scale | 450ms, ease-out cubic |
| Unselected fade/blur | CSS class swap, `transition: opacity .35s, filter .35s` | 350ms |
| Radial trait chips | `transform: scale(.6)→1; opacity 0→1`, staggered delays | 250ms each, 60ms stagger |
| Detail card | `translateY(100%)→0` | 300ms, `cubic-bezier(.2,.8,.2,1)` |
| Node drag | direct transform update per pointermove (no transition while dragging) | — |
| Back / zoom-out | reverse camera lerp to stored transform | 450ms |

Performance guard: ~75 nodes + edges is trivial for SVG; disable blur filter if
`matchMedia('(prefers-reduced-motion)')` or node count > 150.

---

## Phase E — Docs + tests

- Update `docs/progress.md`, `docs/FUNCTION_LOG.md`, `docs/GAME_LOGIC.md`, `CLAUDE.md` (DB tables + Runtime APIs + file structure + Supabase patch order).
- `tests/figure-bio-static.test.mjs`: static checks — patch file exists, `figure_relations` has RLS, `collection.js` calls `escapeHtml` in new render paths, `figure-graph.js` exposes `window.FigureGraphModule.open/close`.

## Build order & effort

1. **A + B + C** — bio sections in the modal (DB patch, client API, modal render). Ship first; useful alone. ~1 session.
2. **D** — graph overlay. Purely additive, reads the same API. ~1–2 sessions.
3. Relation seed data grows over time — the UI must render fine with zero edges (graph shows lone node + hint text).

## Open questions (answer before implementing)

1. Relation seed: who writes the historical relation data — hand-curated SQL (recommended, ~30 edges from Db.md clusters) or later CMS-style admin?
2. Graph scope: whole roster in one canvas, or only the focused figure's neighborhood (1–2 hops)? Recommend neighborhood-first — cleaner on a 430px screen.
3. Should non-captured related figures be fully hidden instead of "???" teasers? (Teaser recommended — drives gameplay loop.)
