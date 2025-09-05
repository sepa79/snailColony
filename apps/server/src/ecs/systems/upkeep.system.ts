import { IWorld, defineQuery, removeComponent } from 'bitecs';
import { Base, Position, Upkeep } from '../components';
import { MapDef, Structure } from '@snail/protocol';
import { tileAt } from '../../game/terrain';
import type { GameParams } from '../../config';

interface Params {
  interval_seconds: number;
  base: GameParams['upkeep']['base'];
  colony: GameParams['upkeep']['colony'];
  dormant_collapse_seconds: number;
}

const upkeepQuery = defineQuery([Base, Upkeep, Position]);

export function upkeepSystem(world: IWorld, map: MapDef, params: Params) {
  const ents = upkeepQuery(world);
  for (const eid of ents) {
    Upkeep.timer[eid] -= 1;
    if (Upkeep.timer[eid] <= 0) {
      Upkeep.timer[eid] = params.interval_seconds;
      const x = Math.floor(Position.x[eid]);
      const y = Math.floor(Position.y[eid]);
      const tile = tileAt(map, x, y);
      const cost =
        tile?.structure === ('Colony' as unknown as Structure)
          ? params.colony
          : params.base;
      if (
        Base.water[eid] >= cost.water &&
        Base.biomass[eid] >= cost.biomass
      ) {
        Base.water[eid] -= cost.water;
        Base.biomass[eid] -= cost.biomass;
        Upkeep.active[eid] = 1;
        Upkeep.dormant_time[eid] = 0;
      } else {
        Upkeep.active[eid] = 0;
      }
    }
    if (Upkeep.active[eid] === 0) {
      Upkeep.dormant_time[eid] += 1;
      if (Upkeep.dormant_time[eid] >= params.dormant_collapse_seconds) {
        removeComponent(world, Base, eid);
        removeComponent(world, Upkeep, eid);
        const x = Math.floor(Position.x[eid]);
        const y = Math.floor(Position.y[eid]);
        const tile = tileAt(map, x, y);
        if (tile) {
          tile.structure = 'None' as unknown as Structure;
        }
      }
    }
  }
  return world;
}
