# Tamroi UI Restyling Concepts

Seven visual directions cover the project's seven main user-facing states:

1. Landing (`index.html`)
2. Login and registration (`login.html`)
3. Location and home-district onboarding (`onboarding.html`)
4. Map and encounter sheet (`app.html`, Map)
5. Figure and artifact collection (`app.html`, Collection)
6. Missions, daily challenges, and co-op progress (`app.html`, Mission)
7. Rankings and guild presence (`app.html`, Community)

Each style folder contains `01-landing.png` through `07-community.png`, plus `board-entry.png` and `board-app.png` comparison sheets.

## 01 Royal Chronicle

An illuminated Siamese-manuscript RPG: indigo lacquer, parchment, antique gold, vermilion seals, jade progress, and engraved rarity frames. This direction gives Tamroi the clearest historical-epic identity, but it needs the most ornamental artwork.

## 02 Neon Time Rift

A Bangkok time-travel hunt: midnight glass, cyan scan lines, magenta temporal portals, topographic grids, and holographic character files. It fits GPS, transit, fog scanning, and live co-op systems with fewer bespoke textures than Royal Chronicle.

## 03 Festival Diorama

A collectible travel board game: fold-out maps, clay landmarks, cotton fog, passport stamps, enamel pins, postcards, and woven textile details. It is the warmest and most approachable direction while retaining adult information density.

## 04 Khon Celestial Saga

A theatrical Thai RPG built from black lacquer, emerald and purple silk, gold frames, mother-of-pearl, masks, curtains, and spotlights. It gives encounters and rankings the strongest sense of spectacle, but its ornamental cards and navigation would require a substantial custom asset library.

## 05 Bangkok Street Quest

An urban scavenger hunt using screen-printed posters, torn paper, transit lines, route arrows, stamps, and travel stickers. Its bold hierarchy fits outdoor use and can be reproduced largely with CSS, textures, and a limited illustration set.

## 06 Living Museum Adventure

A field-research game using museum cases, exhibit-table maps, archival labels, teak, bronze, sandstone, and turquoise scan light. It balances historical credibility with game progression and is the least likely to date visually.

## 07 Cozy Pixel Quest

A pastel pixel-art RPG menu built from retro desktop windows, grid paper, thick navy outlines, stickers, sparkles, chunky buttons, character sprites, and an orange cat guide. It makes every tab feel like a distinct game menu and gives rewards, rarity, progress, and locked content the clearest collectible-game treatment.

## Generation notes

- The built-in image generator created all comparison boards and page concepts except `03_festival_diorama/07-community.png`.
- The image service timed out twice on that final screen. Its replacement is a deterministic composition built from the established Festival Diorama palette and component language; the editable source is `03_festival_diorama/07-community-source.svg`.
- Generated Thai copy can contain visual spelling errors. Treat these as art-direction concepts, then rebuild selected screens with real HTML text and accessible controls.
- The prompts preserved existing functions: auth, two-step onboarding, fog/check-in, support-node gates, figure rarity, artifacts, daily/co-op missions, solo/guild ranking, and the four-tab app shell.
- `07_cozy_pixel_quest/` used `/home/papajittan/Downloads/pixela.png` as a style and component reference. The generated screens replace its sample content with Tamroi's Thai locations and gameplay systems.

## Prompt set

All built-in generations used the `ui-mockup` use case, straight-on 430 × 932 mobile proportions, legible Thai labels, accessible contrast, and no device perspective, browser chrome, hands, or watermark.

- **Royal Chronicle:** “Restyle Tamroi as a premium illuminated Siamese-manuscript RPG using indigo lacquer, parchment, antique gold, vermilion seals, jade progress, Thai ornament, ink-wash maps, engraved character rarity frames, and the existing app functions.”
- **Neon Time Rift:** “Restyle Tamroi as a Thai urban time-travel location game using a midnight Bangkok map, cyan scan grids, magenta temple-shaped portals, holographic traveler files, temporal encounters, and the existing app functions.”
- **Festival Diorama:** “Restyle Tamroi as a premium adult collectible travel board game using fold-out maps, clay Thai landmarks, cotton fog, passport stamps, enamel pins, postcards, woven textiles, tactile paper cards, and the existing app functions.”
- **Khon Celestial Saga:** “Restyle Tamroi as a Thai theatre RPG using lacquer, silk, gold, pearl inlay, masks, curtains, spotlights, staged Legendary Acts, and the existing app functions.”
- **Bangkok Street Quest:** “Restyle Tamroi as a Bangkok street-poster scavenger hunt using screen print, risograph grain, torn paper, transit graphics, route stickers, stamps, and the existing app functions.”
- **Living Museum Adventure:** “Restyle Tamroi as a cinematic Thai museum expedition using exhibit-table maps, glass cases, archival labels, field notes, bronze, sandstone, turquoise scanning, and the existing app functions.”
- **Cozy Pixel Quest:** “Using the supplied pixel UI only as a style reference, restyle Tamroi as a cozy pastel pixel RPG with retro desktop windows, grid paper, thick navy outlines, chunky shadows, stickers, sparkles, character sprites, collectible cards, and the existing app functions.”
