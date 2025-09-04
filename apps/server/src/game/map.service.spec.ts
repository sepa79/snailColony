import { MapService, validateTile } from './map.service';
import {
  TerrainType,
  WaterLayer,
  GrassLayer,
  Structure,
  Tile,
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
});
