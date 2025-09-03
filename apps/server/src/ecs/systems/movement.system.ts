import { IWorld, defineQuery } from 'bitecs';
import { Position, Velocity } from '../components';

const moveQuery = defineQuery([Position, Velocity]);

export function movementSystem(world: IWorld) {
  const ents = moveQuery(world);
  for (const eid of ents) {
    Position.x[eid] += Velocity.dx[eid];
    Position.y[eid] += Velocity.dy[eid];
  }
  return world;
}
