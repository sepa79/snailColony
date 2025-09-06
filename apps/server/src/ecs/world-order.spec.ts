import { World } from './world';
import baseParams from '../config';

describe('world system order', () => {
  it('runs systems in configured order', () => {
    const worldA = new World();
    const mapA = (worldA as any).map;
    mapA.moisture = baseParams.moisture.thresholds.wet;
    mapA.tiles[0].terrain = 'sidewalk' as any;
    mapA.tiles[0].slime_intensity = 1;
    (worldA as any).params.simulation.order = [
      'update_moisture_and_auras',
      'slime_decay',
    ];
    worldA.tick();
    const dampDecay = baseParams.slime.decay_per_tick.damp.sidewalk;
    expect(mapA.tiles[0].slime_intensity).toBeCloseTo(1 - dampDecay);

    const worldB = new World();
    const mapB = (worldB as any).map;
    mapB.moisture = baseParams.moisture.thresholds.wet;
    mapB.tiles[0].terrain = 'sidewalk' as any;
    mapB.tiles[0].slime_intensity = 1;
    (worldB as any).params.simulation.order = [
      'slime_decay',
      'update_moisture_and_auras',
    ];
    worldB.tick();
    const wetDecay = baseParams.slime.decay_per_tick.wet.sidewalk;
    expect(mapB.tiles[0].slime_intensity).toBeCloseTo(1 - wetDecay);
  });
});
