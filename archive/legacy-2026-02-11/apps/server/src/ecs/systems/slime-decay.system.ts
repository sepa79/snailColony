import { IWorld } from 'bitecs';
import { MapDef } from '@snail/protocol';

interface Params {
  slime: {
    decay_per_tick: Record<string, Record<string, number>>;
  };
  moisture: { thresholds: { wet: number; damp: number } };
  aura?: {
    radius: number;
    slime_decay_multiplier: number;
    bases: { x: number; y: number }[];
  };
}

export function slimeDecaySystem(world: IWorld, map: MapDef, params: Params) {
  let moistureState: string;
  const wet = params.moisture.thresholds.wet;
  const damp = params.moisture.thresholds.damp;
  if (map.moisture >= wet) moistureState = 'wet';
  else if (map.moisture >= damp) moistureState = 'damp';
  else moistureState = 'dry';

  const decayTable = params.slime.decay_per_tick[moistureState] || {};
  const width = map.width;
  for (let i = 0; i < map.tiles.length; i++) {
    const tile = map.tiles[i];
    const terrain = tile.terrain as unknown as string;
    let decay = decayTable[terrain] ?? 0;
    if (params.aura) {
      const x = i % width;
      const y = Math.floor(i / width);
      for (const b of params.aura.bases) {
        const dx = b.x - x;
        const dy = b.y - y;
        if (dx * dx + dy * dy <= params.aura.radius * params.aura.radius) {
          decay *= params.aura.slime_decay_multiplier;
          break;
        }
      }
    }
    tile.slime_intensity = Math.max(0, tile.slime_intensity - decay);
  }
  return world;
}
