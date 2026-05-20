// ── Thailand Grid Fog Helper ──────────────────────────
(function () {
  const THAILAND_BOUNDS = {
    south: 5.61,
    west: 97.34,
    north: 20.46,
    east: 105.64,
  };

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function normalizeBounds(bounds) {
    return {
      south: Number(bounds?.south ?? THAILAND_BOUNDS.south),
      west: Number(bounds?.west ?? THAILAND_BOUNDS.west),
      north: Number(bounds?.north ?? THAILAND_BOUNDS.north),
      east: Number(bounds?.east ?? THAILAND_BOUNDS.east),
    };
  }

  function createGridCells(options) {
    const rows = Math.max(1, Number(options?.rows || 18));
    const cols = Math.max(1, Number(options?.cols || 10));
    const bounds = normalizeBounds(options?.bounds);
    const latStep = (bounds.north - bounds.south) / rows;
    const lngStep = (bounds.east - bounds.west) / cols;
    const cells = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const south = bounds.south + latStep * row;
        const north = bounds.south + latStep * (row + 1);
        const west = bounds.west + lngStep * col;
        const east = bounds.west + lngStep * (col + 1);

        cells.push({
          id: `th-r${pad2(row + 1)}-c${pad2(col + 1)}`,
          row: row + 1,
          col: col + 1,
          bounds: [
            [south, west],
            [south, east],
            [north, east],
            [north, west],
          ],
          center: {
            lat: south + (north - south) / 2,
            lng: west + (east - west) / 2,
          },
        });
      }
    }

    return cells;
  }

  function findCellForLatLng(lat, lng, cells) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return null;

    return (cells || []).find(cell => {
      const south = cell.bounds[0][0];
      const west = cell.bounds[0][1];
      const north = cell.bounds[2][0];
      const east = cell.bounds[2][1];
      return userLat >= south && userLat <= north && userLng >= west && userLng <= east;
    }) || null;
  }

  window.FogGrid = {
    THAILAND_BOUNDS,
    createGridCells,
    findCellForLatLng,
  };
})();
