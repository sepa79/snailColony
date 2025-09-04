# Acceptance Criteria

## Server
- [ ] `Tile` model with layers; loader returns a valid `MapDef`.
- [ ] Validation prevents illegal combos (`Cliff` + `Structure`, `Water:Full` + `Colony`, etc.).
- [ ] Functions: `moveCost(tile)`, `isBlocked(tile)`, `hydrationDrain(tile)` with unit tests.
- [x] Protocol includes `MapDef` and `mapVersion`; client can join and receive it once.
- [x] Server dashboard renders `MapDef` on a 2D map.

## Client — Isometric 2D
- [x] Renders a 15×15 map from `MapDef` using diamond tiles.
- [x] Overlays drawn above terrain; `Water:Full` visibly distinct and blocks tile highlights.
- [x] Keys work: **G** grid toggle, **W** water anim toggle, **Space** pause.
- [x] Performance: terrain cached (no per-frame rebuild).

## Client — Voxels 3D (optional)
- [x] Same `MapDef` rendered as voxels.
- [x] `Water:Full` as a blocking translucent volume; `Bridge` visible.
- [x] **G/W/Space/R** shortcuts work.

## Docs
- [x] README updated; phase PRs reference this spec.
