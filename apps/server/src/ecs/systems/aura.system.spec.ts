import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Hydration, Worker, initWorker } from '../components';
import { movementSystem } from './movement.system';
import { hydrationSystem } from './hydration.system';
import { slimeDecaySystem } from './slime-decay.system';
import type { MapDef, WaterLayer, GrassLayer, Structure, TerrainType } from '@snail/protocol';
import baseParams from '../../config';
const params = JSON.parse(JSON.stringify(baseParams));

function makeMap(terrain: string, moisture = 0, slime = 0): MapDef {
  return {
    width: 10,
    height: 10,
    version: 1,
    moisture,
    tiles: Array.from({ length: 100 }, () => ({
      terrain: terrain as unknown as TerrainType,
      water: 'None' as WaterLayer,
      grass: 'None' as GrassLayer,
      structure: 'None' as Structure,
      slime_intensity: slime,
    })),
  } as unknown as MapDef;
}

describe('aura effects', () => {
  it('reduces hydration cost within aura', () => {
    const map = makeMap('sidewalk');
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Hydration, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Position, eid);
    addComponent(world, Worker, eid);
    initWorker(eid);
    Hydration.value[eid] = 5;
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.dx[eid] = 1;
    Velocity.dy[eid] = 0;
    hydrationSystem(world, map, {
      terrain: params.terrain,
      slime: { hydration_save_max: params.slime.hydration_save_max },
      aura: {
        radius: params.upkeep.aura.radius,
        hydration_cost_hard_multiplier: params.upkeep.aura.hydration_cost_hard_multiplier,
        bases: [{ x: 0, y: 0 }],
      },
    });
    const base = params.terrain.sidewalk.hydration_cost;
    const expected = 5 - base * params.upkeep.aura.hydration_cost_hard_multiplier;
    expect(Hydration.value[eid]).toBeCloseTo(expected);
  });

  it('adds speed bonus within aura', () => {
    const map = makeMap('grass');
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.dx[eid] = 1;
    Velocity.dy[eid] = 0;
    movementSystem(world, map, {
      terrain: params.terrain,
      slime: { speed_bonus_max: params.slime.speed_bonus_max },
      aura: {
        radius: params.upkeep.aura.radius,
        speed_bonus: params.upkeep.aura.speed_bonus,
        bases: [{ x: 0, y: 0 }],
      },
    });
    expect(Position.x[eid]).toBeCloseTo(1 + params.upkeep.aura.speed_bonus);
  });

  it('slows slime decay within aura', () => {
    const map = makeMap('sidewalk', 0, 1);
    slimeDecaySystem(createWorld(), map, {
      slime: { decay_per_tick: params.slime.decay_per_tick },
      moisture: params.moisture,
      aura: {
        radius: params.upkeep.aura.radius,
        slime_decay_multiplier: params.upkeep.aura.slime_decay_multiplier,
        bases: [{ x: 0, y: 0 }],
      },
    });
    const decay = params.slime.decay_per_tick.dry.sidewalk * params.upkeep.aura.slime_decay_multiplier;
    expect(map.tiles[0].slime_intensity).toBeCloseTo(1 - decay);
  });
});
