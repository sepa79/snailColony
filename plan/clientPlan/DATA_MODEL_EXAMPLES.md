# Data Model — Examples (not final code)

## TypeScript interfaces (example)
```ts
type TerrainType =
  | "Dirt" | "Mud" | "Sand" | "Rock" | "Brush"
  | "Cliff" | "ShallowWaterBed" | "Road";

type WaterLayer = "None" | "Puddle" | "Stream" | "Full";
type GrassLayer = "None" | "Sparse" | "Normal" | "Dense";

type Structure =
  | { t: "None" }
  | { t: "Colony"; owner: string }
  | { t: "Bridge"; hp: number };

interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  water: WaterLayer;
  grass: GrassLayer;
  structure: Structure;
}
interface MapDef {
  size: number;
  tiles: Tile[][];
  version: string;   // bump when layout changes
  seed?: number;
}
```

## JSON example (single tile)
```json
{ "x": 12, "y": 7, "terrain": "ShallowWaterBed", "water": "Full", "grass": "None", "structure": { "t": "Bridge", "hp": 100 } }
```

## Movement merging (pseudo)
```
if (tile.terrain === "Cliff") blocked = true
if (tile.water === "Full" && tile.structure.t !== "Bridge") blocked = true

cost = baseCost[tile.terrain]
if (tile.water === "Puddle") cost += 0.2
if (tile.water === "Stream") cost += 0.5
// grass: no effect
```

## Hydration (pseudo)
```
drain = baseDrain                 // 1.0/s
drain *= multByTerrain[tile.terrain]
if (tile.water === "Puddle") drain = drain * 0.5 - 0.1  // regen
if (tile.water === "Stream") drain = drain * 0.5 - 0.2  // regen
```
