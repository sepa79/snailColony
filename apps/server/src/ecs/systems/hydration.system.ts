import { IWorld, defineQuery, addComponent } from 'bitecs';
import { Hydration, Velocity, Position, Worker, Dead } from '../components';
import { MapDef } from '@snail/protocol';
import { terrainAt, isWaterNode, tileAt } from '../../game/terrain';
import type { GameParams } from '../../config';

interface Params {
  terrain: GameParams['terrain'];
  slime: Pick<GameParams['slime'], 'hydration_save_max'>;
}

const hydrateQuery = defineQuery([Hydration, Velocity, Position, Worker]);

export function hydrationSystem(world: IWorld, map: MapDef, params: Params) {
  const ents = hydrateQuery(world);
  for (const eid of ents) {
    const x = Math.floor(Position.x[eid]);
    const y = Math.floor(Position.y[eid]);
    const terrain = terrainAt(map, x, y);
    let value = Hydration.value[eid];
    if (Velocity.dx[eid] !== 0 || Velocity.dy[eid] !== 0) {
      const tile = tileAt(map, x, y);
      const baseCost = params.terrain?.[terrain ?? '']?.hydration_cost ?? 0;
      const save = (tile?.slime_intensity ?? 0) * (params.slime?.hydration_save_max ?? 0);
      const cost = baseCost * (1 - save);
      value = Math.max(0, value - cost);
    }
    if (isWaterNode(map, x, y)) {
      value = Worker.hydration_max[eid];
    }
    Hydration.value[eid] = value;
    if (value <= 0 && (terrain === 'gravel' || terrain === 'sidewalk')) {
      addComponent(world, Dead, eid);
    }
  }
  return world;
}
