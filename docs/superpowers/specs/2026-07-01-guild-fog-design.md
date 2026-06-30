# Shared Guild Fog of War — Design Spec
> Tamroi · Co-op Branch · 2026-07-01

## Problem

The co-op spec (docs/COOP.md §Feature 1) calls for the map to show the union of all guild members' cleared districts as a second, lighter fog layer. Nothing in `map.js` or `guild.js` implements this today.

## Approach

Render individual tinted overlay polygons for guild-cleared-but-not-user-cleared districts, stacked on top of the existing user fog layer.

**Why not a second fog polygon?**
Stacking two fog polygons has alpha compositing problems: a guild layer below the user fog is invisible (user fog 0.80 covers it); a guild layer above re-fogs the user's own cleared areas. Individual district highlight polygons sidestep both problems entirely.

**Visual result:**
- User-cleared districts: fully clear (no change to current behavior)
- Guild-cleared, user-not-yet-cleared: subtle green tint (#7BC67E, 0.22 opacity) visible through the dark fog — shows guildmates' territory
- Neither cleared: fully dark fog (unchanged)

## Files Touched

### `supabase-client.js`
Add to `window.DB.Coop`:
```js
async getGuildClearedDistrictIds(guildId)
```
- Fetch `guild_members.user_id` for the guild
- Query `user_districts` WHERE `user_id IN [...]` AND `fogged = false`
- Return array of distinct `district_id` strings

No new DB tables. Two sequential SELECTs (members already fetched by guild.js on init, but keeping it self-contained here).

### `map.js`
Add to `MapModule` public surface:
```js
renderGuildFog(clearedDistrictIds)
```
- Diffs against `userDistrictState` to find guild-only-cleared districts
- Creates `L.layerGroup` of per-district `L.polygon` with `fillColor: '#7BC67E'`, `fillOpacity: 0.22`, `weight: 1`, `opacity: 0.35`, `interactive: false`
- Stores in module-scoped `guildFogLayer`; previous layer removed on re-render
- No-ops if user has no guild or allDistrictsCache is empty

### `guild.js`
After `init()` resolves the user's guild:
- Call `DB.Coop.getGuildClearedDistrictIds(guild.id)`
- Call `MapModule.renderGuildFog(ids)`
- Re-call on member subscription updates (Presence join/leave already triggers `renderGuildPanel`, same hook)

## Scope

- No new DB tables or triggers
- No change to existing `buildFogLayer()` or `fogLayer`
- No change to watchtower check-in or fog punch-hole logic
- No toggle UI in MVP (guild fog always on when user is in a guild and map is loaded)
