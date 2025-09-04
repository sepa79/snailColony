import { IWorld, defineQuery } from 'bitecs';
import { Position, Velocity } from '../components';
import { MapDef } from '@snail/protocol';
import { terrainAt, tileAt } from '../../game/terrain';

interface Params {
  deposit_rate_per_step: number;
  terrain: Record<string, { slime_weight: number }>;
}

const query = defineQuery([Position, Velocity]);

export function slimeDepositSystem(world: IWorld, map: MapDef, params: Params) {
  const ents = query(world);
  for (const eid of ents) {
    const dx = Velocity.dx[eid];
    const dy = Velocity.dy[eid];
    if (dx === 0 && dy === 0) continue;
    const step = Math.sqrt(dx * dx + dy * dy);
    const x = Math.floor(Position.x[eid]);
    const y = Math.floor(Position.y[eid]);
    const tile = tileAt(map, x, y);
    if (!tile) continue;
    const terrain = terrainAt(map, x, y);
    const weight = params.terrain?.[terrain ?? '']?.slime_weight ?? 1;
    const deposit = params.deposit_rate_per_step * step * weight;
    tile.slime_intensity = Math.min(1, (tile.slime_intensity ?? 0) + deposit);
  }
  return world;
}
