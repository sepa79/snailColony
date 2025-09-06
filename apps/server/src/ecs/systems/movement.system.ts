import { IWorld, defineQuery } from 'bitecs';
import { Position, Velocity, Destination } from '../components';
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

    let dx = Velocity.dx[eid];
    let dy = Velocity.dy[eid];

    if (Destination.active[eid]) {
      const maxX = map.width - 1;
      const maxY = map.height - 1;
      const tx = Math.max(0, Math.min(Destination.x[eid], maxX));
      const ty = Math.max(0, Math.min(Destination.y[eid], maxY));
      Destination.x[eid] = tx;
      Destination.y[eid] = ty;
      const rx = tx - Position.x[eid];
      const ry = ty - Position.y[eid];
      const dist = Math.sqrt(rx * rx + ry * ry);
      if (dist <= speed) {
        Position.x[eid] = tx;
        Position.y[eid] = ty;
        Velocity.dx[eid] = 0;
        Velocity.dy[eid] = 0;
        Destination.active[eid] = 0;
        continue;
      }
      dx = rx / dist;
      dy = ry / dist;
      Velocity.dx[eid] = dx;
      Velocity.dy[eid] = dy;
    } else {
      // Clamp velocity magnitude so diagonal or large inputs don't exceed base speed
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 1) {
        dx /= mag;
        dy /= mag;
        Velocity.dx[eid] = dx;
        Velocity.dy[eid] = dy;
      }
    }

    const maxX = map.width - 1;
    const maxY = map.height - 1;
    const nx = Position.x[eid] + dx * speed;
    const ny = Position.y[eid] + dy * speed;
    Position.x[eid] = Math.max(0, Math.min(nx, maxX));
    Position.y[eid] = Math.max(0, Math.min(ny, maxY));
  }
  return world;
}
