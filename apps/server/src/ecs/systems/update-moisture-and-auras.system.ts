import { IWorld, defineQuery } from 'bitecs';
import { MapDef, TerrainType } from '@snail/protocol';
import { Position, Upkeep } from '../components';
import type { GameParams } from '../../config';

interface RoadDefaults {
  base_speed: number;
  hydration_cost: number;
}

interface AuraParams {
  bases: { x: number; y: number }[];
  radius: number;
  speed_bonus: number;
  hydration_cost_hard_multiplier: number;
  slime_decay_multiplier: number;
}

const baseQuery = defineQuery([Position, Upkeep]);

export function updateMoistureAndAurasSystem(
  world: IWorld,
  map: MapDef,
  params: GameParams,
  roadDefaults: RoadDefaults,
): AuraParams {
  map.moisture = Math.max(0, map.moisture - 1);

  if (map.moisture < params.moisture.thresholds.damp) {
    if (params.terrain[TerrainType.Road]) {
      params.terrain[TerrainType.Road].base_speed = params.moisture.sidewalk_dry_speed;
      params.terrain[TerrainType.Road].hydration_cost =
        params.moisture.sidewalk_dry_hydration_cost;
    }
  } else {
    if (params.terrain[TerrainType.Road]) {
      params.terrain[TerrainType.Road].base_speed = roadDefaults.base_speed;
      params.terrain[TerrainType.Road].hydration_cost = roadDefaults.hydration_cost;
    }
  }

  const bases: { x: number; y: number }[] = [];
  const ents = baseQuery(world);
  for (const eid of ents) {
    if (Upkeep.active[eid]) {
      bases.push({ x: Position.x[eid], y: Position.y[eid] });
    }
  }

  return {
    bases,
    radius: params.upkeep.aura.radius,
    speed_bonus: params.upkeep.aura.speed_bonus,
    hydration_cost_hard_multiplier:
      params.upkeep.aura.hydration_cost_hard_multiplier,
    slime_decay_multiplier: params.upkeep.aura.slime_decay_multiplier,
  };
}
