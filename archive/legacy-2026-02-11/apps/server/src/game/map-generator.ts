import { MapDef, TerrainType, WaterLayer, GrassLayer, Structure, Tile, GameParams } from '@snail/protocol';

/**
 * Generate a random map using basic rules.
 * Ensures the origin tile hosts a colony on valid terrain.
 */
export function generateMap(width: number, height: number, params: GameParams): MapDef {
  const tiles: Tile[] = [];
  const moisture = params.moisture?.thresholds?.wet ?? 0;
  const biomassDefault = params.resources?.biomass ?? 0;
  const waterDefault = params.resources?.water ?? 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let terrain = TerrainType.Dirt;
      let water = WaterLayer.None;

      const r = Math.random();
      if (r < 0.1) {
        terrain = TerrainType.ShallowWaterBed;
        water = WaterLayer.Full;
      } else if (r < 0.2) {
        terrain = TerrainType.Rock;
      } else if (r < 0.3) {
        terrain = TerrainType.Brush;
      }

      tiles.push({
        terrain,
        water,
        grass: GrassLayer.None,
        structure: Structure.None,
        slime_intensity: 0,
        resources: { biomass: biomassDefault, water: waterDefault },
      });
    }
  }

  // ensure starting colony at (0,0) on valid terrain
  const start = tiles[0];
  start.terrain = TerrainType.Dirt;
  start.water = WaterLayer.None;
  start.structure = Structure.Colony;

  return { width, height, version: 1, moisture, tiles };
}
