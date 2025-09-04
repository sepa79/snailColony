import { MapService, validateTile, validateMap } from './map.service';
import {
  TerrainType,
  WaterLayer,
  GrassLayer,
  Structure,
  Tile,
  MapDef,
} from '../../../../libs/protocol/src';

describe('MapService', () => {
  it('loads map and roundtrips', () => {
    const svc = new MapService();
    const map = svc.load('test');
    expect(JSON.parse(JSON.stringify(map))).toEqual(map);
  });

  it('detects invalid tile', () => {
    const bad: Tile = {
      terrain: TerrainType.Cliff,
      water: WaterLayer.None,
      grass: GrassLayer.None,
      structure: Structure.Colony,
    };
    expect(() => validateTile(bad)).toThrow();
  });

  it('parses resources and moisture', () => {
    const svc = new MapService();
    const map = svc.load('test');
    expect(map.moisture).toBeGreaterThanOrEqual(0);
    expect(map.tiles[0].resources?.biomass).toBe(5);
    expect(map.tiles[1].resources?.water).toBe(10);
  });

  it('detects invalid resources and moisture', () => {
    const tile: Tile = {
      terrain: TerrainType.Dirt,
      water: WaterLayer.None,
      grass: GrassLayer.None,
      structure: Structure.None,
      resources: { biomass: -1 },
    };
    expect(() => validateTile(tile)).toThrow();
    const map: MapDef = {
      width: 1,
      height: 1,
      tiles: [
        {
          terrain: TerrainType.Dirt,
          water: WaterLayer.None,
          grass: GrassLayer.None,
          structure: Structure.None,
        },
      ],
      version: 1,
      moisture: -5,
    };
    expect(() => validateMap(map)).toThrow();
  });
});
