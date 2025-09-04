import { MapService, validateTile, validateMap } from './map.service';
import {
  TerrainType,
  WaterLayer,
  GrassLayer,
  Structure,
  Tile,
  MapDef,
} from '../../../../libs/protocol/src';
import { join } from 'path';

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
      slime_intensity: 0,
    };
    expect(() => validateTile(bad)).toThrow();
  });

  it('parses resources and moisture', () => {
    const svc = new MapService();
    const map = svc.load('test');
    expect(map.moisture).toBeGreaterThanOrEqual(0);
    expect(map.tiles[0].resources?.biomass).toBe(5);
    expect(map.tiles[1].resources?.water).toBe(10);
    expect(map.tiles[0].slime_intensity).toBe(0);
  });

  it('detects invalid resources and moisture', () => {
    const tile: Tile = {
      terrain: TerrainType.Dirt,
      water: WaterLayer.None,
      grass: GrassLayer.None,
      structure: Structure.None,
      slime_intensity: 0,
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
          slime_intensity: 0,
        },
      ],
      version: 1,
      moisture: -5,
    };
    expect(() => validateMap(map)).toThrow();
  });

  it('locates parameters.json from nested working directory', () => {
    const original = process.cwd();
    process.chdir(join(__dirname, '..'));
    try {
      const svc = new MapService();
      expect(() => svc.load('test')).not.toThrow();
    } finally {
      process.chdir(original);
    }
  });
});
