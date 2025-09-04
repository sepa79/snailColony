import { IWorld, defineQuery } from 'bitecs';
import { Hydration, Velocity } from '../components';

const hydrateQuery = defineQuery([Hydration, Velocity]);

export function hydrationSystem(world: IWorld) {
  const ents = hydrateQuery(world);
  for (const eid of ents) {
    if (Velocity.dx[eid] !== 0 || Velocity.dy[eid] !== 0) {
      Hydration.value[eid] = Math.max(0, Hydration.value[eid] - 1);
    }
  }
  return world;
}
