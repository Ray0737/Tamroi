# Grid Fog Demo Design

## Goal

Add a proposal-ready `/demo` page showing a Thailand-wide grid Fog of War model where the user's current grid cell becomes visible when unlocked.

## Approved Approach

Use a hybrid path:

- Keep the current live app district-polygon fog unchanged.
- Add a reusable classic-script helper at `js/fog-grid.js`.
- Build a separate `demo/` static page that consumes the helper and can be opened at `/demo`.
- Leave the helper ready for future app integration without changing Supabase schema or the production map flow in this task.

## Architecture

`js/fog-grid.js` exposes `window.FogGrid` with stable grid generation over an approximate Thailand bounding box, readable cell IDs, rectangle bounds, and coordinate-to-cell lookup.

`demo/index.html`, `demo/demo.css`, and `demo/demo.js` render a screenshotable mobile proposal UI using Leaflet and the shared helper. The demo simulates user location in Bangkok, highlights the active cell, shows locked cells as fog, and exposes simple district/location controls for screenshots.

## Data Flow

1. Demo boot creates an 18 x 10 Thailand grid from `FogGrid.createGridCells()`.
2. The selected user coordinate resolves through `FogGrid.findCellForLatLng()`.
3. All cells render as dark fog rectangles.
4. The resolved cell is redrawn with the unlocked style and the UI summary updates.

## Testing

Add a static Node test that verifies:

- `js/fog-grid.js` exists and exposes `window.FogGrid`.
- The default 18 x 10 grid creates 180 stable cells.
- A Bangkok coordinate resolves to a grid cell.
- `/demo` assets exist and load/use the helper.

