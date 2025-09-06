import type {
  MapDef,
  TerrainType,
  WaterLayer,
  GrassLayer,
  Structure,
} from '@snail/protocol';
import { tileAt } from '../game/terrain';
import { findPath, PathParams } from './pathfinding';
import { pioneer } from './pioneer';
import { convoyPath } from './convoy';
import { scheduleMaintenance } from './maintenance';

const terrainParams = {
  sidewalk: { base_speed: 1, hydration_cost: 2, slime_weight: 1 },
};
const params: PathParams = { terrain: terrainParams, k: 3 };

function mapWithSlime(bottom: number): MapDef {
  const sidewalk = 'sidewalk' as unknown as TerrainType;

  return {
    width: 4,
    height: 2,
    version: 1,
    moisture: 0,
    tiles: [
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: bottom },
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: bottom },
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: bottom },
      { terrain: sidewalk, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: bottom },
    ],
  };
}

describe('ai pathfinding', () => {
  it('prefers slime path on hard terrain', () => {
    const map = mapWithSlime(1);
    const path = findPath(map, { x: 0, y: 0 }, { x: 3, y: 0 }, params);
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 0 },
    ]);
  });

  it('returns empty path when goal is outside the map', () => {
    const map = mapWithSlime(0);
    const path = findPath(map, { x: 0, y: 0 }, { x: 5, y: 5 }, params);
    expect(path).toHaveLength(0);
  });

  it('prefers faster terrain even if path is longer', () => {
    const fast = 'fast' as unknown as TerrainType;
    const slow = 'slow' as unknown as TerrainType;
    const map: MapDef = {
      width: 3,
      height: 2,
      version: 1,
      moisture: 0,
      tiles: [
        { terrain: fast, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
        { terrain: fast, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
        { terrain: fast, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
        { terrain: slow, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
        { terrain: slow, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
        { terrain: slow, water: 'None' as WaterLayer, grass: 'None' as GrassLayer, structure: 'None' as Structure, slime_intensity: 0 },
      ],
    } as unknown as MapDef;
    const terrain = {
      fast: { base_speed: 1, hydration_cost: 0, slime_weight: 1 },
      slow: { base_speed: 0.25, hydration_cost: 0, slime_weight: 1 },
    };
    const path = findPath(map, { x: 0, y: 1 }, { x: 2, y: 1 }, { terrain, k: 0 });
    expect(path).toEqual([
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ]);
  });

  it('pioneer paints path when none exists', () => {
    const map = mapWithSlime(0);
    const trip = pioneer(map, { x: 0, y: 0 }, { x: 3, y: 0 }, params);
    expect(trip.length).toBeGreaterThan(0);
    expect(tileAt(map, 1, 0)?.slime_intensity ?? 0).toBeGreaterThan(0);
  });

  it('convoy prefers tiles with slime > 0.3', () => {
    const map = mapWithSlime(0.5);
    const path = convoyPath(map, { x: 0, y: 0 }, { x: 3, y: 0 }, params);
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 0 },
    ]);
  });

  it('schedules maintenance when slime drops below threshold', () => {
    const map = mapWithSlime(0);
    map.tiles[1].slime_intensity = 0.1; // critical tile (1,0)
    const tasks = scheduleMaintenance(map, [{ x: 1, y: 0 }], [
      { id: 1, x: 0, y: 0 },
      { id: 2, x: 2, y: 2 },
    ]);
    expect(tasks).toEqual([{ worker: 1, target: { x: 1, y: 0 } }]);
    map.tiles[1].slime_intensity = 0.5;
    const none = scheduleMaintenance(map, [{ x: 1, y: 0 }], [
      { id: 1, x: 0, y: 0 },
    ]);
    expect(none).toHaveLength(0);
  });
});
