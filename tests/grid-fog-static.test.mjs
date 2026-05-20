import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(existsSync(new URL('js/fog-grid.js', root)), 'js/fog-grid.js must exist');
assert(existsSync(new URL('demo/index.html', root)), 'demo/index.html must exist for /demo');
assert(existsSync(new URL('demo/demo.js', root)), 'demo/demo.js must exist');
assert(existsSync(new URL('demo/demo.css', root)), 'demo/demo.css must exist');

const helperJs = read('js/fog-grid.js');
const sandbox = { window: {} };
vm.runInNewContext(helperJs, sandbox);

assert(sandbox.window.FogGrid, 'fog-grid.js must expose window.FogGrid');
assert(typeof sandbox.window.FogGrid.createGridCells === 'function', 'FogGrid.createGridCells must be a function');
assert(typeof sandbox.window.FogGrid.findCellForLatLng === 'function', 'FogGrid.findCellForLatLng must be a function');

const cells = sandbox.window.FogGrid.createGridCells({ rows: 18, cols: 10 });
assert(cells.length === 180, '18 x 10 Thailand grid must create 180 cells');
assert(cells[0].id === 'th-r01-c01', 'grid cell ids must be stable and readable');
assert(cells.every(cell => cell.bounds.length === 4), 'each grid cell must expose rectangle bounds');

const bangkokCell = sandbox.window.FogGrid.findCellForLatLng(13.7563, 100.5018, cells);
assert(bangkokCell, 'Bangkok coordinate must resolve to a Thailand grid cell');
assert(bangkokCell.id.startsWith('th-r'), 'resolved grid cell must use th-rXX-cXX id format');

const demoHtml = read('demo/index.html');
const demoJs = read('demo/demo.js');
const demoCss = read('demo/demo.css');

assert(demoHtml.includes('../js/fog-grid.js'), 'demo page must load the reusable FogGrid helper');
assert(demoHtml.includes('id="demo-map"'), 'demo page must include a screenshotable map surface');
assert(demoJs.includes('FogGrid.createGridCells'), 'demo JS must render cells from FogGrid');
assert(demoJs.includes('FogGrid.findCellForLatLng'), 'demo JS must unlock the user current grid cell');
assert(demoCss.includes('.fog-cell-unlocked'), 'demo CSS must style unlocked grid visibility');
