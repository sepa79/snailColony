import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Destination } from '../components';
import { movementSystem } from './movement.system';
import { TerrainType } from '@snail/protocol';
import type { MapDef, WaterLayer, GrassLayer, Structure } from '@snail/protocol';
import baseParams from '../../config';
const params = JSON.parse(JSON.stringify(baseParams));

function makeMap(terrain: TerrainType): MapDef {
  return {
    width: 10,
    height: 10,
    version: 1,
    moisture: 0,
    tiles: Array.from({ length: 100 }, () => ({
      terrain,
      water: 'None' as WaterLayer,
      grass: 'None' as GrassLayer,
      structure: 'None' as Structure,
      slime_intensity: 0,
    })),
  } as unknown as MapDef;
}

describe('movementSystem', () => {
  function setup(dx: number, dy: number) {
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Destination, eid);
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.dx[eid] = dx;
    Velocity.dy[eid] = dy;
    Destination.active[eid] = 0;
    return { world, eid };
  }

  it('scales movement by terrain base_speed', () => {
    const map = makeMap(TerrainType.Rock);
    const { world, eid } = setup(1, 0);
    movementSystem(world, map, params);
    expect(Position.x[eid]).toBeCloseTo(0.75); // rock base_speed 0.75
  });

  it('is slower on road than dirt', () => {
    const grassMap = makeMap(TerrainType.Dirt);
    const sidewalkMap = makeMap(TerrainType.Road);
    const { world: w1, eid: e1 } = setup(1, 0);
    const { world: w2, eid: e2 } = setup(1, 0);
    movementSystem(w1, grassMap, params);
    movementSystem(w2, sidewalkMap, params);
    expect(Position.x[e1]).toBeCloseTo(1.0);
    expect(Position.x[e2]).toBeCloseTo(0.6);
  });

  it('applies slime speed bonus', () => {
    const map = makeMap(TerrainType.Dirt);
    map.tiles[0].slime_intensity = 1;
    const { world, eid } = setup(1, 0);
    movementSystem(world, map, params);
    expect(Position.x[eid]).toBeCloseTo(1 + params.slime.speed_bonus_max);
  });

  it('uses modified parameter values', () => {
    const map = makeMap(TerrainType.Dirt);
    const custom = JSON.parse(JSON.stringify(baseParams));
    custom.terrain[TerrainType.Dirt].base_speed = 2;
    const { world, eid } = setup(1, 0);
    movementSystem(world, map, custom);
    expect(Position.x[eid]).toBeCloseTo(2);
  });

  it('normalizes diagonal movement so it is not faster', () => {
    const map = makeMap(TerrainType.Dirt);
    const { world, eid } = setup(1, 1);
    movementSystem(world, map, params);
    const expected = 1 / Math.sqrt(2);
    expect(Position.x[eid]).toBeCloseTo(expected);
    expect(Position.y[eid]).toBeCloseTo(expected);
    // overall distance should equal base speed of 1
    const dist = Math.hypot(Position.x[eid], Position.y[eid]);
    expect(dist).toBeCloseTo(1);
  });

  it('moves to destination and stops', () => {
    const map = makeMap(TerrainType.Dirt);
    const { world, eid } = setup(0, 0);
    Destination.x[eid] = 5;
    Destination.y[eid] = 0;
    Destination.active[eid] = 1;
    for (let i = 0; i < 10; i++) {
      movementSystem(world, map, params);
    }
    expect(Position.x[eid]).toBeCloseTo(5);
    expect(Position.y[eid]).toBeCloseTo(0);
    expect(Destination.active[eid]).toBe(0);
    expect(Velocity.dx[eid]).toBe(0);
    expect(Velocity.dy[eid]).toBe(0);
  });

  it('clamps movement within map bounds', () => {
    const map: MapDef = {
      width: 3,
      height: 1,
      version: 1,
      moisture: 0,
      tiles: Array.from({ length: 3 }, () => ({
        terrain: TerrainType.Dirt,
        water: 'None' as WaterLayer,
        grass: 'None' as GrassLayer,
        structure: 'None' as Structure,
        slime_intensity: 0,
      })),
    } as unknown as MapDef;
    const { world, eid } = setup(1, 0);
    Position.x[eid] = 2;
    movementSystem(world, map, params);
    expect(Position.x[eid]).toBeCloseTo(map.width - 1);
    Velocity.dx[eid] = -1;
    movementSystem(world, map, params);
    expect(Position.x[eid]).toBeGreaterThanOrEqual(0);
  });
});
