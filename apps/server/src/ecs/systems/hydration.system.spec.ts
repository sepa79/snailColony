import { createWorld, addEntity, addComponent, hasComponent } from 'bitecs';
import { Hydration, Velocity, Position, Worker, Dead, initWorker } from '../components';
import { hydrationSystem } from './hydration.system';
import { TerrainType } from '@snail/protocol';
import type { MapDef, WaterLayer, GrassLayer, Structure } from '@snail/protocol';
import baseParams from '../../config';
const params = JSON.parse(JSON.stringify(baseParams));

function makeMap(terrain: TerrainType, water?: number): MapDef {
  return {
    width: 1,
    height: 1,
    version: 1,
    moisture: 0,
    tiles: [
      {
        terrain,
        water: 'None' as WaterLayer,
        grass: 'None' as GrassLayer,
        structure: 'None' as Structure,
        slime_intensity: 0,
        resources: water ? { water } : undefined,
      },
    ],
  } as unknown as MapDef;
}

describe('hydrationSystem', () => {
  function setup(map: MapDef, hydration: number, dx: number, dy: number) {
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Hydration, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Position, eid);
    addComponent(world, Worker, eid);
    initWorker(eid);
    Hydration.value[eid] = hydration;
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.dx[eid] = dx;
    Velocity.dy[eid] = dy;
    return { world, eid, map };
  }

  it('reduces hydration based on terrain cost', () => {
    const { world, eid, map } = setup(makeMap(TerrainType.Rock), 5, 1, 0);
    hydrationSystem(world, map, params);
    expect(Hydration.value[eid]).toBeCloseTo(4.8);
    expect(hasComponent(world, Dead, eid)).toBe(false);
  });

  it('refills hydration at water node', () => {
    const { world, eid, map } = setup(makeMap(TerrainType.Dirt, 10), 3, 0, 0);
    hydrationSystem(world, map, params);
    expect(Hydration.value[eid]).toBe(Worker.hydration_max[eid]);
  });

  it('marks entity dead when hydration hits zero on hard terrain', () => {
    const { world, eid, map } = setup(makeMap(TerrainType.Road), 0.1, 1, 0);
    hydrationSystem(world, map, params);
    expect(Hydration.value[eid]).toBeCloseTo(0);
    expect(hasComponent(world, Dead, eid)).toBe(true);
  });

  it('does not mark entity dead when dry on soft terrain', () => {
    const { world, eid, map } = setup(makeMap(TerrainType.Dirt), 0, 0, 0);
    hydrationSystem(world, map, params);
    expect(Hydration.value[eid]).toBeCloseTo(0);
    expect(hasComponent(world, Dead, eid)).toBe(false);
  });

  it('slime reduces hydration cost', () => {
    const map = makeMap(TerrainType.Rock);
    map.tiles[0].slime_intensity = 1;
    const { world, eid } = setup(map, 5, 1, 0);
    hydrationSystem(world, map, params);
    const base = params.terrain[TerrainType.Rock].hydration_cost;
    const expected = 5 - base * (1 - params.slime.hydration_save_max);
    expect(Hydration.value[eid]).toBeCloseTo(expected);
  });

  it('respects modified hydration cost', () => {
    const { world, eid, map } = setup(makeMap(TerrainType.Rock), 5, 1, 0);
    const custom = JSON.parse(JSON.stringify(baseParams));
    custom.terrain[TerrainType.Rock].hydration_cost = 1;
    hydrationSystem(world, map, custom);
    expect(Hydration.value[eid]).toBeCloseTo(4);
  });
});
