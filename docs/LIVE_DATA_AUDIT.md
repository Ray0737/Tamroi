# LIVE_DATA_AUDIT.md — Supabase live-data vs. static/mock

> Generated: 2026-07-04
> Scope: full `js/` scan — verify UI reads live Supabase data, not local static/mock
> Status key: 🔴 Fix before release · 🟡 Minor · ✅ Verified live

---

## Verdict

Data layer is **fully Supabase-backed**. Every module (`map`, `collection`, `missions`,
`leaderboard`, `guild`, `coop`, `raid`, `discussion`, `community-forum`, `debates`, `app`)
routes through `window.DB.*`. No module holds a mock dataset as its primary source.
Four spots still let static data shadow or bypass the live source.

---

## 🔴 Fix — static data leaks into the UI

### 1. Fake notifications shown to users — `js/app.js:421` + `:747`

```js
let notifs = getMockNotifications();          // "King Taksin unlocked", "ranked #24"…
if (App.user) { try { notifs = await DB.Notifications.get(...) } catch { /* keep mock */ } }
```

- **Anonymous users always see 3 fabricated notifications.**
- On a **transient DB error**, a logged-in user silently sees fake data (`ranked #24`,
  `Silom fog cleared`) as if real.
- **Fix:** render an empty state instead of mock. Delete `getMockNotifications()` and
  set `notifs = []` on the catch.

### 2. Home-district picker is a hardcoded list — `js/app.js:715`

```js
const DISTRICTS = [ { id:'rattanakosin', name_th:'รัตนโกสินทร์', lat, lng }, …12 rows ];
```

- Duplicates the live `districts` table. **Will drift** as districts are added/renamed in
  Supabase (e.g. Ayutthaya exists in DB but not this list).
- **Fix:** populate `#select-home-district` from `DB.Districts.getAll()`.

### 3. Leaderboard "season/all" toggle is non-functional — `js/leaderboard.js:96,189`

```js
activePeriod = e.target.value;   // 'all' | 'season' — captured…
const data = await DB.Leaderboard.get(activeMetric);   // …but never passed
```

- The period control changes state and re-fetches, but `Leaderboard.get()` ignores it —
  **always returns all-time**. The seasonal view is cosmetic, not live.
- **Fix:** either thread `activePeriod` into `DB.Leaderboard.get()` (needs a season filter
  in the query/view), or remove the control until it's backed.

---

## 🟡 Minor

### 4. Stale "mock" comment — `js/map.js:228`

```js
} catch { /* use mock data */ }   // there is no mock — districts stays []
```

Misleading; the fallback is now empty, not mock. Update the comment. Behavior is correct.

### 5. `SEASONAL_EVENTS` hardcoded — `js/missions.js:53`

Client-static array of festival multipliers. **Acceptable** — config/logic, not user data,
and doesn't belong in a per-user table. Only move to DB if you want to edit events without a
redeploy. No action needed for NSC.

---

## ✅ Not an issue (verified live / correctly static)

| Item | Location | Why fine |
|---|---|---|
| `FOG_OUTER` | `map.js:35` | Map bounds polygon — presentation constant |
| SVG icon constants | `missions.js`, others | UI assets |
| `DISTRICT_ERA_TH` | `missions.js:14` | Static id→era label mapping |
| `_CHAPTER_LABELS` | `coop.js:149` | Jigsaw chapter titles — config |
| All DB reads | `supabase-client.js` | Single source; RLS-scoped per user |

---

## Fix Order

```
1. Fake notifications (app.js)    ← shows fabricated data to real users
2. Home-district drift (app.js)   ← correctness; diverges from live districts table
3. Leaderboard period (leaderboard.js) ← wire or remove the season toggle
4. Stale comment (map.js)         ← one-line cleanup
```
