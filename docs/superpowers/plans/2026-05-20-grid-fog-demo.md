# Grid Fog Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Thailand grid Fog of War helper and a screenshotable `/demo` page.

**Architecture:** Keep the live app's district-polygon fog unchanged. Add `window.FogGrid` as a classic browser helper, then create `demo/` assets that render a Leaflet-based grid fog mockup using that helper.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Leaflet CDN, Node static tests.

---

### Task 1: Regression Test

**Files:**
- Create: `tests/grid-fog-static.test.mjs`
- Modify: `tests/run-static.mjs`

- [x] **Step 1: Write the failing test**

Add a Node static test that loads `js/fog-grid.js` in a VM, checks `window.FogGrid`, verifies an 18 x 10 grid creates 180 cells, checks Bangkok cell lookup, and verifies the `/demo` assets reference the helper.

- [x] **Step 2: Run the test to verify it fails**

Run: `rtk node tests/grid-fog-static.test.mjs`

Expected: FAIL with `Error: js/fog-grid.js must exist`.

### Task 2: Grid Helper

**Files:**
- Create: `js/fog-grid.js`

- [ ] **Step 1: Implement helper**

Expose `window.FogGrid` with `THAILAND_BOUNDS`, `createGridCells(options)`, and `findCellForLatLng(lat, lng, cells)`.

- [ ] **Step 2: Run focused test**

Run: `rtk node tests/grid-fog-static.test.mjs`

Expected: FAIL until demo assets are added, then PASS.

### Task 3: Demo Page

**Files:**
- Create: `demo/index.html`
- Create: `demo/demo.css`
- Create: `demo/demo.js`

- [ ] **Step 1: Add page shell**

Create a static `/demo` page with a mobile screenshot frame, map surface, summary stats, and controls for sample user locations.

- [ ] **Step 2: Render grid fog**

Use Leaflet rectangles for locked cells and an unlocked style for the selected user cell.

- [ ] **Step 3: Run focused test**

Run: `rtk node tests/grid-fog-static.test.mjs`

Expected: PASS.

### Task 4: Required Project Docs

**Files:**
- Modify: `docs/progress.md`
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`
- Modify: `docs/dev-plan.md`
- Modify: `docs/dev-plan-prompt.xml`

- [ ] **Step 1: Document the new helper and demo route**

Record that grid fog prototype and `/demo` assets exist, while live app fog remains district-polygon based.

- [ ] **Step 2: Run full static suite**

Run: `rtk node tests/run-static.mjs`

Expected: all tests exit 0.

