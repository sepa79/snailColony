import { IWorld } from 'bitecs';
import { MapDef } from '@snail/protocol';

interface Params {
  slime: {
    decay_per_tick: Record<string, Record<string, number>>;
  };
  moisture: { thresholds: { wet: number; damp: number } };
}

export function slimeDecaySystem(world: IWorld, map: MapDef, params: Params) {
  let moistureState: string;
  const wet = params.moisture.thresholds.wet;
  const damp = params.moisture.thresholds.damp;
  if (map.moisture >= wet) moistureState = 'wet';
  else if (map.moisture >= damp) moistureState = 'damp';
  else moistureState = 'dry';

  const decayTable = params.slime.decay_per_tick[moistureState] || {};
  for (const tile of map.tiles) {
    const terrain = tile.terrain as unknown as string;
    const decay = decayTable[terrain] ?? 0;
    tile.slime_intensity = Math.max(0, tile.slime_intensity - decay);
  }
  return world;
}
