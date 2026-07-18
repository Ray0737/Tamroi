# GPS Spoofing — Threat Analysis & Mitigations

**Project:** ตามรอย (Tam Roi)
**Date:** 2026-06-28
**Status:** Partial mitigations implemented (client-side); server-side validation pending

---

## Attack Surface

Tam Roi's core game loop — fog-of-war reveal, lore unlock, and legendary encounter unlock — is gated by physical GPS proximity. All location verification runs in the browser via `navigator.geolocation.watchPosition()`. An attacker who can feed fake coordinates to that API gains full access to any location-locked feature without leaving their desk.

### Affected mechanics

| Mechanic | Function | Attack impact |
|---|---|---|
| District check-in (fog clear) | `performCheckIn()` | Unlock any district remotely |
| Lore proximity trigger | `checkLoreProximity()` | Unlock all lore nodes instantly |
| BTS/MRT bonus multiplier | `getTransportMultiplier()` | Earn 2× points without transit |
| Figure encounter gate | `openLegendaryEncounter()` | Bypass district unlock requirement |

---

## Spoofing Vectors

### 1. Chrome / Firefox DevTools — Sensors panel
**Difficulty:** trivial (F12 → More tools → Sensors → Location override)
**Signature:** Browser reports `coords.accuracy === 0` — an impossible value for real GPS hardware.

### 2. Android mock location apps
**Difficulty:** easy (enable Developer Options → Select mock location app)
**Signature:** Coordinates can teleport instantaneously between distant points; real movement is capped by physics (~50 m/s for transit).

### 3. JavaScript prototype override
**Difficulty:** moderate (inject before page scripts load via extension or service worker)
**Signature:** `navigator.geolocation.watchPosition` is replaced with a custom function that fires fake `PositionSuccess` callbacks.

### 4. Root / jailbreak GPS spoofing
**Difficulty:** high (requires rooted device or GPS emulator at OS level)
**Signature:** Indistinguishable client-side; requires server-side validation.

---

## Mitigations Implemented (js/map.js)

### Accuracy threshold — blocks DevTools (Vector 1)

```js
// In _isPlausiblePosition() — rejects before updating lastKnownPosition
if (accuracy === 0) return false;         // DevTools exact-zero signature

// In isWithinCheckInRange() — rejects at the check-in gate
if (lastKnownPosition.accuracy === 0 || lastKnownPosition.accuracy > 2000) return false;
```

Real mobile GPS returns `accuracy` in the range 5–100 m. Desktop DevTools always returns `0`. The `accuracy === 0` check in `_isPlausiblePosition` silently rejects all DevTools spoofs before `lastKnownPosition` is updated. The `> 2000` coarse-reading guard is a second line of defence at the check-in call site.

### Speed / teleport check — blocks mock location apps (Vector 2)

```js
// In _isPlausiblePosition()
const dist = haversineDistance(prev.lat, prev.lng, lat, lng);
const dt   = (now - prev.ts) / 1000;
if (dt > 0 && dist / dt > 50) return false; // 50 m/s ≈ 180 km/h
```

Position history (last 10 readings) is kept in `_posHistory`. Any jump exceeding 50 m/s between consecutive `watchPosition` callbacks is rejected. The threshold covers BTS/MRT travel (~30 m/s max) with margin while blocking instant teleportation.

Both checks are bypassed on `localhost` / `127.0.0.1` via the existing `isDev()` guard so development is unaffected.

### Support node visit distance check (added 2026-07-01)

`visitSupportNode()` now rejects if `haversineDistance > CHECKIN_TOLERANCE_M (500 m)` before writing to DB.

### Lore unlock proximity re-check (added 2026-07-01)

`saveLoreUnlock()` re-checks `haversineDistance > node.radius_m` at save time, blocking direct console calls like `MapModule.saveLoreUnlock('any-id')`.

### Collab mission GPS gate — NOT present (contradicts an earlier draft of this doc)

`docs/PROJECT_SUMMARY_CODE.md`'s 2026-07-05 live-code audit found `js/coop.js` mission check-in is **DB-only, no distance check** — any guild member can "check in" from home. An earlier version of this file claimed this was fixed 2026-07-01; that was wrong, or was reverted. Treat as an open gap until re-verified against `js/coop.js` directly.

---

## Remaining Gaps

### Server-side validation (not yet implemented — highest priority)

`DB.Districts.checkIn(user.id, d.id)` currently sends **no coordinates** to Supabase. The server accepts every check-in unconditionally. A user who bypasses client-side checks (rooted device, network proxy) can still write arbitrary check-ins to the database.

**Recommended fix:**
1. Pass `lastKnownPosition` to the check-in RPC.
2. Add a Supabase database function that validates `(lat, lng)` falls within the district's `polygon_coords` bounding box before committing.
3. Reject if `accuracy === 0` server-side as well (the client can still lie about this, but it adds friction).

```sql
-- Example guard in check_in RPC
IF accuracy = 0 THEN
  RAISE EXCEPTION 'Invalid accuracy value';
END IF;

IF NOT ST_Within(
  ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
  ST_SetSRID(ST_GeomFromGeoJSON(district_polygon), 4326)
) THEN
  RAISE EXCEPTION 'Position outside district bounds';
END IF;
```

Same pattern applies to `DB.Lore.unlock()` and `DB.Coop.checkInToMission()` — both send no coordinates to the server.

### Rate limiting (not yet implemented)

No cap on check-ins per user per day. With coordinates validated server-side this matters less, but a rate limit (e.g. 5 new districts per 24 h) is cheap insurance.

---

## Summary

| Vector | Blocked? | How |
|---|---|---|
| Chrome DevTools Sensors | **Yes** | `accuracy === 0` rejection |
| Android mock location (basic) | **Yes** | 50 m/s teleport detection |
| Console call to `saveLoreUnlock` | **Yes** | GPS re-check at save time (2026-07-01) |
| Console call to `visitSupportNode` | **Yes** | Distance guard added (2026-07-01) |
| Co-op mission checkin without travel | **No** | DB-only checkin, no distance check (per `docs/PROJECT_SUMMARY_CODE.md` 2026-07-05 audit) |
| JS prototype override | Partial | Mitigated if override happens after our script loads |
| Root/OS-level GPS spoof | **No** | Requires server-side coordinate validation |
| Replay / proxy attack | **No** | Requires server-side coordinate validation |

Client-side hardening raises the bar for casual cheaters. Meaningful protection against determined attackers requires server-side PostGIS validation of submitted coordinates.
