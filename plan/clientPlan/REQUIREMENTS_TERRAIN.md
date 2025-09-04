# Requirements — Terrain & Resource Layers

## 1) Layers
Implement **four** orthogonal layers per tile:
- `terrain: TerrainType`
- `water: WaterLayer`
- `grass: GrassLayer`
- `structure: Structure`

Layers are merged for movement/hydration; **resources are overlays**, not terrains.

## 2) TerrainType (base)
Allowed values:
- `Dirt` — baseline
- `Mud`
- `Sand`
- `Rock` — cannot place Colony
- `Brush` — reduces line-of-sight
- `Cliff` — **blocked**
- `ShallowWaterBed` — passable unless overlaid by `Water:Full`
- `Road` — player-built baseline (improves move cost)

## 3) WaterLayer (overlay, mutually exclusive)
- `None`
- `Puddle` — small, passable; minor regen; +move cost
- `Stream` — passable; regen; higher +move cost; may require Bridge if design changes
- `Full` — **impassable obstacle** unless `Bridge` structure exists

## 4) GrassLayer (overlay, stacked density)
- `None` | `Sparse` | `Normal` | `Dense`
- Affects economy only (gatherable), **no movement impact**.

## 5) Structure (overlay)
- `None`
- `Colony` — cannot be placed on `Rock`/`Cliff` or with `Water:Full`
- `Bridge` — can be placed on tiles with `Water:Full`; turns that tile **passable**

## 6) Movement & Hydration
Define functions:
- `moveCost(tile): number`
- `hydrationDrain(tile): number` (per second, before unit modifiers)

### Suggested defaults (scalars):
- Move cost baseline Dirt=1.0
  - `Mud`: ×1.3
  - `Sand`: ×1.4
  - `Rock`: ×1.2
  - `Brush`: ×1.3
  - `Cliff`: INF (blocked)
  - `ShallowWaterBed`: ×1.6
  - `Road`: ×0.7
- Overlays:
  - `Water:Puddle`: +0.2; regen +0.1/s
  - `Water:Stream`: +0.5; regen +0.2/s
  - `Water:Full`: blocked unless `Bridge`
  - `Grass:*`: no cost effect

- Hydration (multipliers vs. baseline drain 1.0/s):
  - `Mud`: ×0.8
  - `Sand`: ×1.3
  - `Brush`: ×0.9
  - `ShallowWaterBed`: ×0.6
  - `Puddle`: ×0.5 (+0.1 regen)
  - `Stream`: ×0.5 (+0.2 regen)

**When `water<=0`**: HP decays (e.g., 0.5/s).

## 7) Validation rules
- `Cliff` → always `blocked` (cannot hold structures).
- `Water:Full` + no `Bridge` → `blocked`.
- `Colony` cannot be placed on `Rock`, `Cliff`, or any tile with `Water:Full` overlay.
- `Bridge` only valid on tiles with `Water:Full`.

## 8) Balancing knobs (config)
Expose tunables (e.g., env vars or server config):
- `HYDRATION.base`, `HYDRATION.sand`, `HYDRATION.mud`, `HYDRATION.streamRegen`, ...  
- `MOVECOST.dirt`, `MOVECOST.road`, `MOVECOST.addPuddle`, ...
