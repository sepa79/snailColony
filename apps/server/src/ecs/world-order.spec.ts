import { World } from './world';
import baseParams from '../config';
import { TerrainType } from '@snail/protocol';
import type { MapDef, GameParams } from '@snail/protocol';
import { harvestSystem } from './systems/harvest.system';
import { Position, Worker } from './components';

interface TestWorld {
  map: MapDef;
  params: GameParams;
  tick: () => void;
}

describe('world system order', () => {
  it('runs systems in configured order', () => {
    const worldA = new World() as unknown as TestWorld;
    worldA.map.moisture = baseParams.moisture.thresholds.wet;
    worldA.map.tiles[0].terrain = TerrainType.Road;
    worldA.map.tiles[0].slime_intensity = 1;
    worldA.params.simulation.order = ['update_moisture_and_auras', 'slime_decay'];
    worldA.tick();
    const dampDecay = baseParams.slime.decay_per_tick.damp.Road;
    const auraMultiplier = worldA.params.upkeep.aura.slime_decay_multiplier;
    expect(worldA.map.tiles[0].slime_intensity).toBeCloseTo(
      1 - dampDecay * auraMultiplier,
    );

    const worldB = new World() as unknown as TestWorld;
    worldB.map.moisture = baseParams.moisture.thresholds.wet;
    worldB.map.tiles[0].terrain = TerrainType.Road;
    worldB.map.tiles[0].slime_intensity = 1;
    worldB.params.simulation.order = ['slime_decay', 'update_moisture_and_auras'];
    worldB.tick();
    const wetDecay = baseParams.slime.decay_per_tick.wet.Road;
    expect(worldB.map.tiles[0].slime_intensity).toBeCloseTo(1 - wetDecay);
  });

  it('exposes bases in snapshots and deposits to the starting base', () => {
    const world = new World();
    const snapshot = world.snapshot();
    expect(Array.isArray(snapshot)).toBe(true);
    expect(snapshot.bases.length).toBeGreaterThan(0);
    const [snailState] = snapshot;
    const primaryBase = snapshot.bases.find((b) => b.id === snapshot.startingBase);
    expect(primaryBase).toBeDefined();
    expect(primaryBase?.biomass).toBe(0);
    expect(primaryBase?.water).toBe(0);
    expect(primaryBase?.active).toBe(true);
    expect(Worker.base[snailState.id]).toBe(primaryBase?.id ?? -1);

    const ecsWorld = (world as unknown as { world: unknown }).world as Parameters<
      typeof harvestSystem
    >[0];
    const map = world.getMap();
    if (!primaryBase) {
      throw new Error('Expected a starting base');
    }
    Position.x[snailState.id] = primaryBase.x;
    Position.y[snailState.id] = primaryBase.y;
    Worker.carry_biomass[snailState.id] = 2;
    Worker.carry_water[snailState.id] = 1;

    harvestSystem(ecsWorld, map);

    const updated = world.snapshot();
    const updatedBase = updated.bases.find((b) => b.id === primaryBase.id);
    expect(updatedBase).toBeDefined();
    expect(updatedBase?.biomass).toBeCloseTo(2);
    expect(updatedBase?.water).toBeCloseTo(1);
    expect(Worker.carry_biomass[snailState.id]).toBe(0);
    expect(Worker.carry_water[snailState.id]).toBe(0);
  });
});
