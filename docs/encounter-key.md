# Encounter Key Mechanic

## Summary

Watchtower check-in now awards a district-specific **Encounter Key**. Starting a Legendary (A-tier) Encounter requires **both** the key **and** all Support Node requirements to be met.

Inspired by the Master Ball in Pokémon GO — a rare, location-earned item that gates the highest-value capture.

---

## Old Flow

```
Support nodes met → "ปลดล็อค Encounter" button → quiz
```

## New Flow

```
Check in at Watchtower → 🗝️ Key awarded (toast + flag set)
Key + Support nodes met → "🗝️ ใช้กุญแจ Encounter" button → quiz
```

---

## Key Properties

| Property | Value |
|---|---|
| Scope | District-specific (one key per district) |
| Durability | Permanent once earned — never consumed or lost |
| Source | Watchtower check-in only |
| Applies to | A-tier (Legendary) figures only |

---

## Encounter Gate States

| Has Key | Support Nodes | UI shown |
|---|---|---|
| No | Any | "เช็กอิน Watchtower เพื่อรับกุญแจ Encounter" card |
| Yes | Not met | "🗝️ มีกุญแจแล้ว — รอ Support Nodes" + progress bars |
| Yes | All met | "🗝️ ใช้กุญแจ Encounter" button → opens quiz |

---

## Implementation

### DB
- New column: `user_districts.has_encounter_key BOOLEAN DEFAULT FALSE`
- Patch file: `supabase/patch_encounter_key.sql`
- Backfill: all rows with `fogged = FALSE` get `has_encounter_key = TRUE`

### JS
- `supabase-client.js` → `Districts.checkIn()`: adds `has_encounter_key: true` to upsert
- `map.js` → `performCheckIn()`: sets `has_encounter_key: true` in local state cache, shows toast
- `map.js` → `renderSupportGate()`: checks `state.has_encounter_key` before rendering gate UI
