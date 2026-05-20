// ── Grid Fog Demo ─────────────────────────────────────
(function () {
  const cells = window.FogGrid.createGridCells({ rows: 18, cols: 10 });
  const unlockedCellIds = new Set();
  const layers = new Map();
  const thailandBounds = [
    [window.FogGrid.THAILAND_BOUNDS.south, window.FogGrid.THAILAND_BOUNDS.west],
    [window.FogGrid.THAILAND_BOUNDS.north, window.FogGrid.THAILAND_BOUNDS.east],
  ];

  const map = L.map('demo-map', {
    center: [13.7563, 100.5018],
    zoom: 5,
    minZoom: 5,
    maxZoom: 8,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  map.fitBounds(thailandBounds, { padding: [12, 12], animate: false });

  function cellToLatLngBounds(cell) {
    return [
      [cell.bounds[0][0], cell.bounds[0][1]],
      [cell.bounds[2][0], cell.bounds[2][1]],
    ];
  }

  function getCellClass(cell) {
    return unlockedCellIds.has(cell.id) ? 'fog-cell-unlocked' : 'fog-cell-locked';
  }

  function renderGrid() {
    cells.forEach(cell => {
      const layer = L.rectangle(cellToLatLngBounds(cell), {
        className: getCellClass(cell),
        interactive: false,
      }).addTo(map);
      layers.set(cell.id, layer);
    });
  }

  function refreshGridStyles() {
    layers.forEach((layer, id) => {
      const cell = cells.find(item => item.id === id);
      if (!cell) return;
      const element = layer.getElement();
      if (!element) return;
      element.classList.remove('fog-cell-locked', 'fog-cell-unlocked');
      element.classList.add(getCellClass(cell));
    });
  }

  function updateText(cell, locationName) {
    const currentCell = document.getElementById('current-cell');
    const gridCount = document.getElementById('grid-count');
    const unlockedCount = document.getElementById('unlocked-count');
    const locationTitle = document.getElementById('location-name');
    const visibilityState = document.getElementById('visibility-state');

    if (currentCell) currentCell.textContent = cell?.id || '-';
    if (gridCount) gridCount.textContent = String(cells.length);
    if (unlockedCount) unlockedCount.textContent = String(unlockedCellIds.size);
    if (locationTitle) locationTitle.textContent = locationName || 'Current Location';
    if (visibilityState) visibilityState.textContent = cell ? 'Unlocked' : 'Outside TH';
  }

  function unlockCurrentCell(lat, lng, locationName) {
    const cell = window.FogGrid.findCellForLatLng(lat, lng, cells);
    unlockedCellIds.clear();
    if (cell) unlockedCellIds.add(cell.id);
    refreshGridStyles();
    updateText(cell, locationName);
    map.panTo([lat, lng], { animate: true, duration: 0.4 });
  }

  function bindControls() {
    document.querySelectorAll('.demo-location-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.demo-location-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        unlockCurrentCell(
          Number(button.dataset.lat),
          Number(button.dataset.lng),
          button.dataset.name
        );
      });
    });
  }

  renderGrid();
  bindControls();
  unlockCurrentCell(13.7563, 100.5018, 'Bangkok');
})();
