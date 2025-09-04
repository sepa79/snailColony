import { IWorld, defineQuery } from 'bitecs';
import { Position, Velocity } from '../components';
import { MapDef } from '@snail/protocol';
import { terrainAt } from '../../game/terrain';

interface Params {
  terrain: Record<string, { base_speed: number }>;
}

const moveQuery = defineQuery([Position, Velocity]);

export function movementSystem(world: IWorld, map: MapDef, params: Params) {
  const ents = moveQuery(world);
  for (const eid of ents) {
    const terrain = terrainAt(map, Math.floor(Position.x[eid]), Math.floor(Position.y[eid]));
    const base = params.terrain?.[terrain ?? '']?.base_speed ?? 1;
    Position.x[eid] += Velocity.dx[eid] * base;
    Position.y[eid] += Velocity.dy[eid] * base;
  }
  return world;
}
