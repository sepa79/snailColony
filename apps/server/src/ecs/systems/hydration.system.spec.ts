import { createWorld, addEntity, addComponent, hasComponent } from 'bitecs';
import { Hydration, Velocity, Position, Worker, Dead, initWorker } from '../components';
import { hydrationSystem } from './hydration.system';
import type {
  MapDef,
  WaterLayer,
  GrassLayer,
  Structure,
  TerrainType,
} from '@snail/protocol';
import { readFileSync } from 'fs';
import { join } from 'path';

const params = JSON.parse(
  readFileSync(join(__dirname, '../../../config/parameters.json'), 'utf-8')
);

function makeMap(terrain: string, water?: number): MapDef {
  return {
    width: 1,
    height: 1,
    version: 1,
    moisture: 0,
    tiles: [
      {
        terrain: terrain as unknown as TerrainType,
        water: 'None' as WaterLayer,
        grass: 'None' as GrassLayer,
        structure: 'None' as Structure,
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
    const { world, eid, map } = setup(makeMap('gravel'), 5, 1, 0);
    hydrationSystem(world, map, params);
    expect(Hydration.value[eid]).toBeCloseTo(4.8);
  });

  it('refills hydration at water node', () => {
    const { world, eid, map } = setup(makeMap('grass', 10), 3, 0, 0);
    hydrationSystem(world, map, params);
    expect(Hydration.value[eid]).toBe(Worker.hydration_max[eid]);
  });

  it('marks entity dead when hydration hits zero on hard terrain', () => {
    const { world, eid, map } = setup(makeMap('sidewalk'), 0.1, 1, 0);
    hydrationSystem(world, map, params);
    expect(Hydration.value[eid]).toBeCloseTo(0);
    expect(hasComponent(world, Dead, eid)).toBe(true);
  });
});
