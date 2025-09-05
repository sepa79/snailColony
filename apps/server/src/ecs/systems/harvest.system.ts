import { IWorld, defineQuery } from 'bitecs';
import { Position, Worker, Base } from '../components';
import type { MapDef } from '@snail/protocol';
import { tileAt } from '../../game/terrain';

const query = defineQuery([Position, Worker]);

export function harvestSystem(world: IWorld, map: MapDef) {
  const ents = query(world);
  for (const eid of ents) {
    const x = Math.floor(Position.x[eid]);
    const y = Math.floor(Position.y[eid]);
    const tile = tileAt(map, x, y);
    if (!tile) continue;

    const baseEid = Worker.base[eid];
    const hasBase = baseEid !== undefined && baseEid >= 0;
    const bx = hasBase ? Math.floor(Position.x[baseEid]) : -1;
    const by = hasBase ? Math.floor(Position.y[baseEid]) : -1;

    // If at assigned base, unload
    if (hasBase && x === bx && y === by) {
      const biom = Worker.carry_biomass[eid];
      const water = Worker.carry_water[eid];
      if (biom > 0 || water > 0) {
        Base.biomass[baseEid] += biom;
        Base.water[baseEid] += water;
        Worker.carry_biomass[eid] = 0;
        Worker.carry_water[eid] = 0;
      }
      continue;
    }

    // Harvest from tile
    const capacity = Worker.carry_capacity[eid];
    const carried = Worker.carry_biomass[eid] + Worker.carry_water[eid];
    const space = capacity - carried;
    if (space <= 0) continue;
    if (tile.resources) {
      if ((tile.resources.biomass ?? 0) > 0) {
        const amt = Math.min(space, tile.resources.biomass!);
        tile.resources.biomass! -= amt;
        Worker.carry_biomass[eid] += amt;
      } else if ((tile.resources.water ?? 0) > 0) {
        const amt = Math.min(space, tile.resources.water!);
        tile.resources.water! -= amt;
        Worker.carry_water[eid] += amt;
      }
    }
  }
  return world;
}
