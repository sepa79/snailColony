# Requirements — Client View (Isometric 2D + optional Voxels)

> Render requirements only — Codex should implement using the current client stack (React + PixiJS for iso; Three.js for voxels).

## A) Isometric 2D (PixiJS)
- Use 2:1 diamond projection. Tile size configurable (e.g., 64×32).
- Draw terrain in **batches**:
  - One `Graphics` per chunk/layer or converted to a mesh to avoid per-frame triangulation.
- Overlays:
  - `Water:Puddle/Stream` shaded diamonds above terrain (alpha).
  - `Water:Full` **not** drawn as base water; instead draw a solid diamond w/ different material or shader and mark as obstacle (no path reticle).
  - `Grass` drawn as small symbol or tint overlay in tile center.
  - `Structure:Bridge` drawn above `Water:Full` (visual passable hint).
  - `Structure:Colony` drawn as simple dome/symbol.
- Input:
  - Camera pan via keys (arrows) and/or mouse drag; zoom optional.
  - Toggles: **G** grid, **W** water animation (if shader used), **Space** pause tick (client animations only).
- Performance:
  - Map layers are static during match → pre-render into `RenderTexture` or cached mesh.
  - Only animated water/units re-render each frame.

## B) Voxels 3D (optional)
- A separate route or toggle renders the same map in 3D:
  - Terrain → boxes (thin).
  - Water: Puddle/Stream → thin translucent boxes; Full → taller translucent block.
  - Grass → small box or plane cluster.
  - Bridge → flat box above water.
  - Colony → small sphere/dome.
- Controls: Orbit (mouse), **G/W/Space/R** as above.
- ESM with `importmap` (no bundler required for PoC). Fallback to local vendor files if needed.

## C) Data flow
- Client receives `MapDef` once on join with `mapVersion` and caches it.
- Reconcile on rejoin: if `mapVersion` differs, request full map.
- No per-tick map redraws; only animate overlays (water) or dynamic entities.
