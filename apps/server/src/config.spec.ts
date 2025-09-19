import params from './config';
import { TerrainType } from '@snail/protocol';

describe('config loader', () => {
  it('loads parameters from json', () => {
    expect(params.terrain[TerrainType.Dirt].base_speed).toBeCloseTo(1.0);
  });
});
