import { IWorld, defineQuery } from 'bitecs';
import { Position, Velocity } from '../components';
import { MapDef } from '@snail/protocol';
import { terrainAt, tileAt } from '../../game/terrain';
import type { GameParams } from '../../config';

interface Params {
  terrain: GameParams['terrain'];
  slime: Pick<GameParams['slime'], 'speed_bonus_max'>;
  aura?: {
    radius: number;
    speed_bonus: number;
    bases: { x: number; y: number }[];
  };
}

const moveQuery = defineQuery([Position, Velocity]);

export function movementSystem(world: IWorld, map: MapDef, params: Params) {
  const ents = moveQuery(world);
  for (const eid of ents) {
    const x = Math.floor(Position.x[eid]);
    const y = Math.floor(Position.y[eid]);
    const terrain = terrainAt(map, x, y);
    const tile = tileAt(map, x, y);
    const base = params.terrain?.[terrain ?? '']?.base_speed ?? 1;
    const bonus = (tile?.slime_intensity ?? 0) * (params.slime?.speed_bonus_max ?? 0);
    let speed = base + bonus;
    if (params.aura) {
      for (const b of params.aura.bases) {
        const dx = b.x - Position.x[eid];
        const dy = b.y - Position.y[eid];
        if (dx * dx + dy * dy <= params.aura.radius * params.aura.radius) {
          speed += params.aura.speed_bonus;
          break;
        }
      }
    }
    Position.x[eid] += Velocity.dx[eid] * speed;
    Position.y[eid] += Velocity.dy[eid] * speed;
  }
  return world;
}
