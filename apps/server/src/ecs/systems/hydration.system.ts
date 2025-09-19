import { IWorld, defineQuery, addComponent } from 'bitecs';
import { Hydration, Velocity, Position, Worker, Dead } from '../components';
import { MapDef, TerrainType } from '@snail/protocol';
import { terrainAt, isWaterNode, tileAt } from '../../game/terrain';
import type { GameParams } from '../../config';

interface Params {
  terrain: GameParams['terrain'];
  slime: Pick<GameParams['slime'], 'hydration_save_max'>;
  aura?: {
    radius: number;
    hydration_cost_hard_multiplier: number;
    bases: { x: number; y: number }[];
  };
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
      const baseCost = params.terrain?.[terrain ?? TerrainType.Dirt]?.hydration_cost ?? 0;
      const save = (tile?.slime_intensity ?? 0) * (params.slime?.hydration_save_max ?? 0);
      let cost = baseCost * (1 - save);
      if (params.aura) {
        for (const b of params.aura.bases) {
          const dx = b.x - Position.x[eid];
          const dy = b.y - Position.y[eid];
          if (dx * dx + dy * dy <= params.aura.radius * params.aura.radius) {
            cost *= params.aura.hydration_cost_hard_multiplier;
            break;
          }
        }
      }
      value = Math.max(0, value - cost);
    }
    if (isWaterNode(map, x, y)) {
      value = Worker.hydration_max[eid];
    }
    Hydration.value[eid] = value;
    if (value <= 0 && (terrain === TerrainType.Rock || terrain === TerrainType.Road)) {
      addComponent(world, Dead, eid);
    }
  }
  return world;
}
