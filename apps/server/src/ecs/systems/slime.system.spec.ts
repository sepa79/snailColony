import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Velocity } from '../components';
import { slimeDepositSystem } from './slime-deposit.system';
import { slimeDecaySystem } from './slime-decay.system';
import type {
  MapDef,
  WaterLayer,
  GrassLayer,
  Structure,
  TerrainType,
} from '@snail/protocol';
import { readFileSync } from 'fs';
import { join } from 'path';

const params = JSON.parse(
  readFileSync(join(__dirname, '../../../config/parameters.json'), 'utf-8'),
);

function makeMap(terrain: string, moisture = 0, slime = 0): MapDef {
  return {
    width: 1,
    height: 1,
    version: 1,
    moisture,
    tiles: [
      {
        terrain: terrain as unknown as TerrainType,
        water: 'None' as WaterLayer,
        grass: 'None' as GrassLayer,
        structure: 'None' as Structure,
        slime_intensity: slime,
      },
    ],
  } as unknown as MapDef;
}

describe('slime systems', () => {
  it('deposits slime based on movement', () => {
    const map = makeMap('sidewalk');
    const world = createWorld();
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.dx[eid] = 1;
    Velocity.dy[eid] = 0;
    slimeDepositSystem(world, map, {
      deposit_rate_per_step: params.slime.deposit_rate_per_step,
      terrain: params.terrain,
    });
    expect(map.tiles[0].slime_intensity).toBeCloseTo(
      params.slime.deposit_rate_per_step,
    );
  });

  it('decays slime based on moisture and terrain', () => {
    const map = makeMap('gravel', 70, 0.5); // wet
    slimeDecaySystem(createWorld(), map, {
      slime: { decay_per_tick: params.slime.decay_per_tick },
      moisture: params.moisture,
    });
    expect(map.tiles[0].slime_intensity).toBeCloseTo(
      0.5 - params.slime.decay_per_tick.wet.gravel,
    );
  });
});
