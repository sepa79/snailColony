import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Velocity } from '../components';
import { movementSystem } from './movement.system';
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

function makeMap(terrain: string): MapDef {
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
      },
    ],
  } as unknown as MapDef;
}

describe('movementSystem', () => {
  function setup(dx: number, dy: number) {
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.dx[eid] = dx;
    Velocity.dy[eid] = dy;
    return { world, eid };
  }

  it('scales movement by terrain base_speed', () => {
    const map = makeMap('gravel');
    const { world, eid } = setup(1, 0);
    movementSystem(world, map, params);
    expect(Position.x[eid]).toBeCloseTo(0.8); // gravel base_speed 0.8
  });

  it('is slower on sidewalk than grass', () => {
    const grassMap = makeMap('grass');
    const sidewalkMap = makeMap('sidewalk');
    const { world: w1, eid: e1 } = setup(1, 0);
    const { world: w2, eid: e2 } = setup(1, 0);
    movementSystem(w1, grassMap, params);
    movementSystem(w2, sidewalkMap, params);
    expect(Position.x[e1]).toBeCloseTo(1.0);
    expect(Position.x[e2]).toBeCloseTo(0.6);
  });
});
