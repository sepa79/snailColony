import { World } from './world';
import baseParams from '../config';
import type { MapDef, GameParams, TerrainType } from '@snail/protocol';

type TestWorld = World & { map: MapDef; params: GameParams };

describe('world system order', () => {
  it('runs systems in configured order', () => {
    const worldA = new World() as TestWorld;
    worldA.map.moisture = baseParams.moisture.thresholds.wet;
    worldA.map.tiles[0].terrain = 'sidewalk' as unknown as TerrainType;
    worldA.map.tiles[0].slime_intensity = 1;
    worldA.params.simulation.order = ['update_moisture_and_auras', 'slime_decay'];
    worldA.tick();
    const dampDecay = baseParams.slime.decay_per_tick.damp.sidewalk;
    expect(worldA.map.tiles[0].slime_intensity).toBeCloseTo(1 - dampDecay);

    const worldB = new World() as TestWorld;
    worldB.map.moisture = baseParams.moisture.thresholds.wet;
    worldB.map.tiles[0].terrain = 'sidewalk' as unknown as TerrainType;
    worldB.map.tiles[0].slime_intensity = 1;
    worldB.params.simulation.order = ['slime_decay', 'update_moisture_and_auras'];
    worldB.tick();
    const wetDecay = baseParams.slime.decay_per_tick.wet.sidewalk;
    expect(worldB.map.tiles[0].slime_intensity).toBeCloseTo(1 - wetDecay);
  });
});
