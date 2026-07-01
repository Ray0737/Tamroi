# New Capture Badge — Design Spec

**Date:** 2026-07-02  
**File affected:** `js/collection.js` only

---

## Goal

When a player captures a new figure, it appears at the top of the collection grid with a red notification dot (top-left corner). Clicking it dismisses the badge and returns the card to its natural sorted position. The "new" state survives page refresh.

---

## State

Add at module scope in `collection.js`:

```js
let newCaptures = new Set();
```

---

## Persistence

Key: `tamroi_new_captures` in `localStorage` — JSON array of figure IDs.

Two helpers (inline, no abstraction):
- **load**: `JSON.parse(localStorage.getItem('tamroi_new_captures') || '[]')` filtered to IDs actually in `captures`
- **save**: `localStorage.setItem('tamroi_new_captures', JSON.stringify([...newCaptures]))`

---

## Changes per function

### `load()`
After populating `captures` from DB, hydrate `newCaptures` from localStorage (filter to valid captured IDs only).

### `markCaptured(figureId)`
1. `captures.add(figureId)` — existing
2. `newCaptures.add(figureId)` — new
3. Persist to localStorage — new
4. `render()` — existing

### `renderFigures()`
Split `filtered` into two arrays:
- `newOnes` — figures whose ID is in `newCaptures`
- `rest` — everyone else

Render `newOnes` first (top of grid). Each new card:
- Gets a red dot: `position:absolute; top:4px; left:4px; width:8px; height:8px; border-radius:50%; background:#FF3B30; z-index:2`
- `onclick` calls `CollectionModule.dismissNew('${f.id}')` instead of `showDetail`

Cards in `rest` render exactly as today.

### `dismissNew(figureId)` — new export
1. `newCaptures.delete(figureId)`
2. Persist to localStorage
3. `render()` — card drops back to natural position
4. `showDetail(figureId)`

---

## What's NOT changing

- No new CSS file — dot is inline on the card element
- No new files
- Sort order within `rest` unchanged (existing DB order)
- Sort order within `newOnes` — newest capture last-added to Set, so natural insertion order (good enough)
- Artifact and lore rendering untouched
