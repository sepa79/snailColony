import {
  IWorld,
  addComponent,
  addEntity,
  defineQuery,
  removeComponent,
} from 'bitecs';
import { Base, BuildTimer, Position, initBase } from '../components';
import type { MapDef, Structure } from '@snail/protocol';
import { tileAt } from '../../game/terrain';

interface Params {
  colony: { build_cost: { biomass: number; water: number }; build_time_seconds: number };
}

interface Request {
  base: number;
  x: number;
  y: number;
}

const buildQuery = defineQuery([BuildTimer, Position]);

export function colonizationSystem(
  world: IWorld,
  map: MapDef,
  params: Params,
  requests: Request[] = [],
) {
  // handle new build requests
  for (const r of requests) {
    const tile = tileAt(map, r.x, r.y);
    if (
      !tile ||
      tile.structure !== ('None' as unknown as Structure) ||
      tile.terrain === 'Rock' ||
      tile.terrain === 'Cliff' ||
      tile.water === 'Full'
    ) {
      continue;
    }
    if (
      Base.biomass[r.base] >= params.colony.build_cost.biomass &&
      Base.water[r.base] >= params.colony.build_cost.water
    ) {
      Base.biomass[r.base] -= params.colony.build_cost.biomass;
      Base.water[r.base] -= params.colony.build_cost.water;
      const eid = addEntity(world);
      addComponent(world, Position, eid);
      addComponent(world, BuildTimer, eid);
      Position.x[eid] = r.x;
      Position.y[eid] = r.y;
      BuildTimer.remaining[eid] = params.colony.build_time_seconds;
    }
  }

  // progress existing builds
  const ents = buildQuery(world);
  for (const eid of ents) {
    BuildTimer.remaining[eid] -= 1;
    if (BuildTimer.remaining[eid] <= 0) {
      removeComponent(world, BuildTimer, eid);
      addComponent(world, Base, eid);
      initBase(eid);
      const x = Math.floor(Position.x[eid]);
      const y = Math.floor(Position.y[eid]);
      const tile = tileAt(map, x, y);
      if (tile) {
        tile.structure = 'Colony' as unknown as Structure;
      }
    }
  }
  return world;
}
